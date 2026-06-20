import { db } from "../firebase";
import { collection, addDoc, updateDoc, doc, setDoc } from "firebase/firestore";

export interface PendingOperation {
  operationId: string;
  tenantId: string;
  module: string;
  action: "Create" | "Update" | "Delete" | "Upload";
  payload: any;
  timestamp: string;
  syncStatus: "Pending" | "Synchronizing" | "Failed";
  retryCount: number;
}

export interface AuditLogEntry {
  id?: string;
  eventType: string; // "Offline Creation", "Offline Update", "Offline Deletion", "Sync Completed", "Sync Failed"
  timestamp: string;
  userId: string;
  tenantId: string;
  module: string;
  action: string;
  syncStatus: string;
}

const DB_NAME = "mabala_offline_db";
const DB_VERSION = 2;

export function initOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      const stores = [
        "pending_operations",
        "livestock",
        "poultry",
        "crops",
        "inventory",
        "sales",
        "finance",
        "employees",
        "veterinary",
        "wallet",
        "user_settings",
        "offtakers",
        "delivery_notes",
        "audit_logs",
        "offtaker_products",
        "farmer_offtaker_links",
        "adjustment_notes",
        "offtaker_wallets",
        "wallet_transactions",
        "payouts",
        "fee_configs"
      ];

      stores.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          if (store === "pending_operations") {
            db.createObjectStore(store, { keyPath: "operationId" });
          } else {
            db.createObjectStore(store, { keyPath: "id" });
          }
        }
      });
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Subscription Validation Helper
export function getTenantSubscriptionStatus(tenantId: string): {
  status: "active" | "expired" | "suspended" | "grace_period";
  graceUntil?: string;
} {
  const cached = localStorage.getItem(`sub_status_${tenantId}`);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      // Let's check dates to enforce grace period or expiration
      const now = new Date();
      const expiry = new Date(parsed.expiryDate || now);
      
      if (parsed.subscriptionStatus === "active" && parsed.accountStatus === "active") {
        return { status: "active" };
      }
      
      // If expired but within 7 days grace period
      const daysSinceExpiry = (now.getTime() - expiry.getTime()) / (1000 * 3600 * 24);
      if (daysSinceExpiry <= 7 && daysSinceExpiry > 0 && parsed.accountStatus === "active") {
        const graceDate = new Date(expiry.getTime() + 7 * 24 * 60 * 60 * 1000);
        return { status: "grace_period", graceUntil: graceDate.toISOString() };
      }
      
      return { status: "expired" };
    } catch (e) {
      return { status: "expired" };
    }
  }
  // Default fallback if offline and no cached details: allow grace check representation
  return { status: "active" }; // Standard offline fallback assuming active initially
}

// Primary DB helpers
export async function saveToOfflineStore(storeName: string, data: any): Promise<void> {
  const dbInst = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = dbInst.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getFromOfflineStore(storeName: string, id: string): Promise<any> {
  const dbInst = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = dbInst.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllFromOfflineStore(storeName: string): Promise<any[]> {
  const dbInst = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = dbInst.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromOfflineStore(storeName: string, id: string): Promise<void> {
  const dbInst = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = dbInst.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Sync queue helpers
export async function queuePendingOperation(op: PendingOperation): Promise<void> {
  await saveToOfflineStore("pending_operations", op);
  // Log Audit trail
  await logOfflineAudit({
    eventType: `Offline ${op.action}`,
    timestamp: new Date().toISOString(),
    userId: op.tenantId, // map to tenant for consistency
    tenantId: op.tenantId,
    module: op.module,
    action: op.action,
    syncStatus: "Pending"
  });
}

export async function logOfflineAudit(entry: AuditLogEntry): Promise<void> {
  const id = `audit-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const fullEntry = { ...entry, id };
  await saveToOfflineStore("audit_logs", fullEntry);
}

// UUID helper
export function generateLocalId(prefix: string): string {
  const year = new Date().getFullYear();
  const uuid = Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${uuid}`;
}
