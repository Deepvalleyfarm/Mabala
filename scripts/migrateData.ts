import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, terminate } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// Define protected UIDs that MUST NOT be touched
const PROTECTED_UIDS = new Set([
  "3LHjQNJ9xYV4EOB7IBwvAUaPsib2",
  "icIoBG4eN5VOw2BvhNiFUnUqmsX2"
]);

// Firebase config
const firebaseConfig = {
  projectId: "mabala-f2d65",
  appId: "1:237562839144:web:9e7a13fd6626ace870fbdd",
  apiKey: "AIzaSyD3ixrRx5Y3vEobSH7sCGQZBZVWeYFzoHY",
  authDomain: "mabala-f2d65.firebaseapp.com",
};

// Log paths
const AUDIT_LOG_PATH = path.join(process.cwd(), "migration_audit.log");

function logToAudit(text: string) {
  console.log(text);
  fs.appendFileSync(AUDIT_LOG_PATH, `${new Date().toISOString()} - ${text}\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const isLive = args.includes("--live");
  const bypassPrompt = args.includes("--yes");

  // Reset audit log
  fs.writeFileSync(AUDIT_LOG_PATH, `=== MABALA DATA CLEANUP & PRODUCTION READY MIGRATION ===\nStarted at: ${new Date().toISOString()}\n\n`);

  logToAudit(`Mode selected: ${isLive ? "LIVE DELETION" : "DRY-RUN (SIMULATION)"}`);
  logToAudit(`Protected UIDs: ${Array.from(PROTECTED_UIDS).join(", ")}`);
  logToAudit("Initializing Firebase Client Context...");

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, "ai-studio-020042e7-7cf8-4e86-bdea-ea1ae9737651");

  const usersToDelete: string[] = [];
  const paymentsToDelete: string[] = [];

  logToAudit("\n--- STEP 1: Scanning users_data Collection ---");
  try {
    const userSnap = await getDocs(collection(db, "users_data"));
    logToAudit(`Found ${userSnap.size} total documents in users_data.`);

    userSnap.forEach((userDoc) => {
      const uid = userDoc.id;
      if (PROTECTED_UIDS.has(uid)) {
        logToAudit(`[KEEP] User Workspace [${uid}] belongs to a live subscriber. PRESERVING.`);
      } else {
        const email = userDoc.data()?.email || "Unknown Email";
        logToAudit(`[DELETE CANDIDATE] User Workspace [${uid}] (${email}) is a demo/seeded account.`);
        usersToDelete.push(uid);
      }
    });
  } catch (err: any) {
    logToAudit(`[ERROR] Failed to scan users_data: ${err.message}`);
  }

  logToAudit("\n--- STEP 2: Scanning payments Collection ---");
  try {
    const paymentSnap = await getDocs(collection(db, "payments"));
    logToAudit(`Found ${paymentSnap.size} total documents in payments.`);

    paymentSnap.forEach((payDoc) => {
      const paymentId = payDoc.id;
      const data = payDoc.data();
      const uid = data.uid || "anonymous";
      
      if (PROTECTED_UIDS.has(uid)) {
        logToAudit(`[KEEP] Payment Record [${paymentId}] belongs to live subscriber [${uid}]. PRESERVING.`);
      } else {
        logToAudit(`[DELETE CANDIDATE] Payment Record [${paymentId}] belongs to [${uid}]. Mark for deletion.`);
        paymentsToDelete.push(paymentId);
      }
    });
  } catch (err: any) {
    logToAudit(`[ERROR] Failed to scan payments: ${err.message}`);
  }

  // Summary
  logToAudit("\n==========================================");
  logToAudit("MIGRATION SCAN COMPLETE SUMMARY:");
  logToAudit(`- User Workspaces to Delete: ${usersToDelete.length}`);
  logToAudit(`- Payment Records to Delete: ${paymentsToDelete.length}`);
  logToAudit("==========================================");

  if (usersToDelete.length === 0 && paymentsToDelete.length === 0) {
    logToAudit("Database is already clean. No deletions required.");
    await terminate(db);
    process.exit(0);
  }

  if (!isLive) {
    logToAudit("\n[DRY RUN COMPLETED] Simulation finished. To perform actual deletions, re-run with '--live' flag.");
    await terminate(db);
    process.exit(0);
  }

  // Live prompt
  if (!bypassPrompt) {
    logToAudit("\n!!! WARNING !!!");
    logToAudit("You are running in LIVE mode. Deleting document records is IRREVERSIBLE.");
    logToAudit("To proceed, run this script with '--yes' flag to bypass interactive prompts in background container execution.");
    await terminate(db);
    process.exit(1);
  }

  logToAudit("\n--- LIVE ACTION PHASE: Executing Deletions ---");

  // Deleting users
  for (const uid of usersToDelete) {
    try {
      logToAudit(`[DELETING] Requesting delete for users_data/${uid}...`);
      await deleteDoc(doc(db, "users_data", uid));
      logToAudit(`[DELETED SUCCESS] /users_data/${uid} successfully removed.`);
    } catch (err: any) {
      logToAudit(`[DELETED FAILED] Failed to delete /users_data/${uid}: ${err.message}`);
    }
  }

  // Deleting payments
  for (const payId of paymentsToDelete) {
    try {
      logToAudit(`[DELETING] Requesting delete for payments/${payId}...`);
      await deleteDoc(doc(db, "payments", payId));
      logToAudit(`[DELETED SUCCESS] /payments/${payId} successfully removed.`);
    } catch (err: any) {
      logToAudit(`[DELETED FAILED] Failed to delete /payments/${payId}: ${err.message}`);
    }
  }

  logToAudit("\n--- All operations finished. ---");
  await terminate(db);
  logToAudit("Database connection terminated clean.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Critical script failure:", err);
  process.exit(1);
});
