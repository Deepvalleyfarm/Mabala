# AI Prompt: Fully Scalable Multi-Tenant Agribusiness Platform
## Instruction Guide & Technical Design Specifications for Building a Custom SaaS Engine

*Copy and paste the entire prompt blueprint below into your AI coding companion to construct the architecture from scratch.*

```markdown
You are an elite principal Full-Stack Cloud Architect and React/Node Engineer. We are building a corporate, highly robust, and enterprise-grade multi-tenant SaaS application called **Mabala Enterprise Platform** for agricultural planning, supply-chain monitoring, and multi-tenant ledger management.

Your goal is to build out a production-ready, highly secure repository structured with a modular React frontend (styled using Tailwind CSS and Lucide Icons) and an Express Node.js backend. This setup will be tightly integrated with Firebase (Authentication, Firestore, and Hosting) and include payment routes compatible with the preeminent Zambian local platform, **Lipila API Payment Gateway**.

---

## SECTION 1: SYSTEM TOPOLOGY & TECH STACK

1. **Frontend framework**: React 18+ populated via Vite, configured with TypeScript. Strict modular structure separating view panels from global state stores.
2. **Backend engine**: Full-stack Express.js server hosted inside standard Cloud Run containers, handling secure API calls, webhooks, and Lipila payment verification.
3. **Identity & Data Store**: 
   - **Firebase Authentication** mapped to custom claims (e.g., `tenantId`, `role`).
   - **Cloud Firestore**: Configured in a **Logical Single-Database Multi-Tenancy** topology. Every single document across all collections MUST define a string field: `tenantId: string`.
4. **Domain Ingress Routing**: Built-in routing layers resolving request headers dynamically to isolate tenants based on subdomains or mapped custom domains.

---

## SECTION 2: ARCHITECTURAL STEP-BY-STEP PROMPT BLUEPRINT

### PHASE 1: IDENTITY ACCESS MANAGEMENT & FIREBASE MULTI-TENANCY CONFIGURATION

#### 1. Setup Custom Claims & Sign-Up Pipelines
Write a server-side Firebase Cloud Function or Express middleware that intercept user accounts creation:
- When a tenant signs up, generate a globally unique `tenantId` (e.g., `tenant-xxx`).
- Apply Firebase Custom Auth Claims using the Admin SDK:
  ```javascript
  await admin.auth().setCustomUserClaims(uid, { tenantId: tenantId, role: "Owner" });
  ```
- Store tenant details inside a `/tenants` root collection containing the pricing tier (e.g., `Trial`, `Commercial`, `Enterprise`).

#### 2. Implement Lock-Tight Firestore Rules
Write a robust, custom `firestore.rules` file that guarantees logical data partitioning. No tenant can ever access, read, or write to database records belonging to another tenant:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Core helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function belongsToTenant(tenantId) {
      return request.auth.token.tenantId == tenantId;
    }

    match /tenants/{tenantId} {
      allow read: if isAuthenticated() && (belongsToTenant(tenantId) || request.auth.token.role == "PlatformAdmin");
      allow write: if isAuthenticated() && belongsToTenant(tenantId) && request.auth.token.role == "Owner";
    }

    // Partitioned agricultural and financial telemetry
    match /{collectionName}/{documentId} {
      allow read, write: if isAuthenticated() && 
        resource.data.tenantId == request.auth.token.tenantId &&
        (request.auth.token.role in ["Owner", "Manager", "Operator", "Consultant"]);
    }
  }
}
```

---

### PHASE 2: TENANT SUBDOMAIN & ROUTING MIDDLEWARE (NODE.JS EXPRESS)

To support domain hosting (e.g., `tenantA.mabala.cloud` or `custom-domain.com`), build an express ingress router middleware that auto-resolves requested headers and extracts the active tenant context:

```typescript
// server/middleware/tenantResolver.ts
import { Request, Response, NextFunction } from "express";
import { getFirestore } from "firebase-admin/firestore";

export interface TenantRequest extends Request {
  tenantId?: string;
  tenantConfig?: any;
}

export async function tenantResolver(req: TenantRequest, res: Response, next: NextFunction) {
  const host = req.headers.host || ""; // e.g., "chisamba.mabala.cloud" or "coop.com"
  const db = getFirestore();

  try {
    let tenantId = "";
    
    // 1. Check for custom domains or subdomains structure
    if (host.includes("localhost") || host.includes("mabala.cloud")) {
      const parts = host.split(".");
      if (parts.length > 2 && parts[0] !== "www" && parts[0] !== "ais-dev") {
        tenantId = parts[0]; // extraction of subdomain
      }
    }

    // 2. Query mapped domains in Firebase store if no subdomain matched
    if (!tenantId) {
      const tenantSnap = await db.collection("tenants")
        .where("customDomain", "==", host)
        .limit(1)
        .get();
        
      if (!tenantSnap.empty) {
        tenantId = tenantSnap.docs[0].id;
      }
    }

    // Default to platform hub fallback if unmapped
    req.tenantId = tenantId || "central-hub";
    next();
  } catch (error) {
    console.error("Failed resolving tenant ingress routing headers:", error);
    res.status(500).json({ error: "System routing resolution error" });
  }
}
```

---

### PHASE 3: LIPILA REGIONAL PAYMENT GATEWAY SERVER-SIDE PROXY

Since payment integrations demand strict API privacy, do NOT expose credentials on the client. Set up an Express proxy handler targeting the Lipila API to securely coordinate Mobile Money transactions (Airtel, MTN, Zamtel):

#### 1. Define Request Payloads & Secret Access
```typescript
// server/routes/payments.ts
import express from "express";
import axios from "axios";

const router = express.Router();

const LIPILA_API_URL = "https://api.lipila.com/v1"; // Production URL
const LIPILA_API_KEY = process.env.LIPILA_API_KEY;
const LIPILA_MERCHANT_ID = process.env.LIPILA_MERCHANT_ID;

// Initiate mobile money payout or debit (push payments)
router.post("/api/charge", async (req, res) => {
  const { amount, phoneNumber, network, reference } = req.body;

  try {
    const payload = {
      apiKey: LIPILA_API_KEY,
      merchantId: LIPILA_MERCHANT_ID,
      amount: parseFloat(amount),
      currency: "ZMW",
      paymentMethod: "MOBILE_MONEY",
      msisdn: phoneNumber,
      provider: network, // "MTN", "AIRTEL", "ZAMTEL"
      narration: "Mabala SaaS Tenant Charge",
      reference: reference, // Tenant unique ID or invoice link
      callbackUrl: `${process.env.PUBLIC_SERVICE_URL}/api/payments/callback`
    };

    const response = await axios.post(`${LIPILA_API_URL}/payments/initiate`, payload, {
      headers: { "Content-Type": "application/json" }
    });

    res.json(response.data);
  } catch (err: any) {
    console.error("Lipila integration crash:", err.response?.data || err.message);
    res.status(400).json({ error: "Mobile Money transaction request rejected" });
  }
});
```

#### 2. Double-Blind Callback Webhook Handling
```typescript
// server/routes/payments.ts continued
router.post("/api/payments/callback", async (req, res) => {
  const { TransactionID, Reference, Status, Amount } = req.body;
  const db = getFirestore();

  try {
    // 1. Locate paying tenant by reference
    const tenantId = Reference; 
    
    if (Status === "SUCCESS") {
      // 2. Extend subscription billing state inside Firestore
      const tenantRef = db.collection("tenants").doc(tenantId);
      await tenantRef.update({
        subscriptionStatus: "ACTIVE",
        activeTier: "Commercial Growth Layer",
        lastPaidAmount: Amount,
        lastTransactionDate: new Date().toISOString()
      });
      console.log(`Successfully credited tenant ${tenantId} via Webhook transaction ${TransactionID}`);
    }

    res.status(200).send("ACK");
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    res.status(500).send("Internal processing fault");
  }
});
```

---

### PHASE 4: CLIENT-SIDE TENANT PERSISTENCE & AGRICULTURAL CORE PANELS

#### 1. Tenant Authentication Context (`/src/context/TenantContext.tsx`)
Create a persistent React state manager mapping Firestore user session profiles:
```typescript
import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

interface TenantContextType {
  user: User | null;
  tenantId: string | null;
  role: string | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType>({ user: null, tenantId: null, role: null, loading: true });

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Extract claim variables from standard decoded JSON Web Token
        const idTokenResult = await firebaseUser.getIdTokenResult();
        setTenantId(idTokenResult.claims.tenantId as string || null);
        setRole(idTokenResult.claims.role as string || null);
      } else {
        setUser(null);
        setTenantId(null);
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <TenantContext.Provider value={{ user, tenantId, role, loading }}>
      {children}
    </TenantContext.Provider>
  );
};
```

#### 2. Re-implement Main Business Panels
Create modular panels that request and pass tenant identifiers transparently:
- `/src/components/CropsPanel.tsx`: Manage sowing cycles, field tracking, and harvest registers partitioned per tenant.
- `/src/components/LivestockPoultryPanel.tsx`: Track layer mortality rates, brooder temperatures, feed conversions, and vaccine calendars.
- `/src/components/TaskManager.tsx`: Complete with rolling daily task lists, scheduling inputs, and the "Urgent within 24 hours" highlighter algorithm.
- `/src/components/ReportsPanel.tsx`: Display consolidated cash inflows, Mom expenses, and work completeness metrics with custom Recharts visualizations.

---

## SECTION 3: DEPLOYMENT MANUAL

1. **Database Initialization**: Apply the indexing schemas on the `tenantId` field to prevent slow queries as tenant scale surges.
2. **Domain Mapping**: Point wildcards on your domain DNS configuration to point to Firebase Hosting target networks:
   - `CNAME` rule: `*.mabala.cloud` -> `hosting.gservice.com`
3. **Security Check**: Enforce Firebase custom SSL configurations inside mapped tenant configurations so each custom domain gets auto-provisioned single Let's Encrypt certificates.
```
