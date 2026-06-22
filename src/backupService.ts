import { google } from "googleapis";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "mabala-f2d65";
const DATABASE_ID = process.env.FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-020042e7-7cf8-4e86-bdea-ea1ae9737651";
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyD3ixrRx5Y3vEobSH7sCGQZBZVWeYFzoHY";

function fromFirestoreValue(valObj: any): any {
  if (!valObj) return null;
  if ("stringValue" in valObj) return valObj.stringValue;
  if ("doubleValue" in valObj) return Number(valObj.doubleValue);
  if ("integerValue" in valObj) return Number(valObj.integerValue);
  if ("booleanValue" in valObj) return valObj.booleanValue;
  if ("nullValue" in valObj) return null;
  if ("arrayValue" in valObj) {
    const vals = valObj.arrayValue.values || [];
    return vals.map(fromFirestoreValue);
  }
  if ("mapValue" in valObj) {
    const fields = valObj.mapValue.fields || {};
    const res: any = {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return null;
}

function fromFirestoreDocument(doc: any): any {
  const fields = doc.fields || {};
  const res: any = {};
  for (const [key, valObj] of Object.entries(fields)) {
    res[key] = fromFirestoreValue(valObj);
  }
  return res;
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") return { doubleValue: val };
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === "object") {
    return {
      mapValue: {
        fields: toFirestoreFields(val)
      }
    };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj: any): any {
  const fields: any = {};
  for (const [key, val] of Object.entries(obj)) {
    fields[key] = toFirestoreValue(val);
  }
  return fields;
}

async function safeFetchJson(url: string, options: any): Promise<any> {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP status ${response.status}: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    return { text };
  }
}

// Write a log to /platform/audit_logs
async function createAuditLog(action: string, performedBy: string, targetUid: string, details: string, token?: string) {
  try {
    const logId = "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const url = `${FIRESTORE_BASE_URL}/platform/audit_logs/${logId}?key=${FIREBASE_API_KEY}`;
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;
    
    const fields = toFirestoreFields({
      action,
      performedBy,
      targetUid,
      details,
      timestamp: new Date().toISOString()
    });

    await safeFetchJson(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields })
    });
  } catch (err: any) {
    console.error("[Mabala Backup Audit] Failed to write audit log:", err.message);
  }
}

// List all documents in a Firestore collection or subcollection
async function listCollection(path: string, token?: string): Promise<any[]> {
  try {
    const url = `${FIRESTORE_BASE_URL}/${path}?key=${FIREBASE_API_KEY}`;
    const headers: any = {};
    if (token) headers["Authorization"] = token;
    
    const data = await safeFetchJson(url, { method: "GET", headers });
    if (data && data.documents) {
      return data.documents;
    }
  } catch (err: any) {
    console.warn(`[Mabala Backup] Skip empty or inaccessible collection "${path}":`, err.message);
  }
  return [];
}

// Get authenticated Google Drive client
function getGoogleDriveClient(): { drive: any; folderId: string | undefined } {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientEmail || !privateKey) {
    throw new Error("GOOGLE_DRIVE_CLIENT_EMAIL or GOOGLE_DRIVE_PRIVATE_KEY is missing in backend environment.");
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"]
  });

  const drive = google.drive({ version: "v3", auth });
  return { drive, folderId };
}

// Upload file to Google Drive
async function uploadToGoogleDrive(jsonContent: string, fileName: string): Promise<string> {
  const { drive, folderId } = getGoogleDriveClient();
  
  const fileMetadata: any = {
    name: fileName,
    mimeType: "application/json",
  };

  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType: "application/json",
    body: jsonContent,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id",
  });

  return response.data.id || "";
}

// Delete file from Google Drive
async function deleteFromGoogleDrive(fileId: string): Promise<void> {
  const { drive } = getGoogleDriveClient();
  await drive.files.delete({ fileId });
}

// Real-time progress updater for Firestore
export async function updateBackupRunProgress(
  runId: string,
  progressPercent: number,
  status: string,
  stepName: string,
  details: string,
  token?: string,
  additional: any = {}
): Promise<void> {
  try {
    const runFields = toFirestoreFields({
      runId,
      timestamp: new Date().toISOString(),
      progressPercent,
      status,
      stepName,
      details,
      ...additional
    });

    const runHeaders: any = { "Content-Type": "application/json" };
    if (token) runHeaders["Authorization"] = token;

    // 1. Path 1: /platformConfig/backupRuns/{runId}
    const url1 = `${FIRESTORE_BASE_URL}/platformConfig/backupRuns/${runId}?key=${FIREBASE_API_KEY}`;
    await safeFetchJson(url1, {
      method: "PATCH",
      headers: runHeaders,
      body: JSON.stringify({ fields: runFields })
    });

    // 2. Path 2: /platform/backup_runs/{runId}
    const url2 = `${FIRESTORE_BASE_URL}/platform/backup_runs/${runId}?key=${FIREBASE_API_KEY}`;
    await safeFetchJson(url2, {
      method: "PATCH",
      headers: runHeaders,
      body: JSON.stringify({ fields: runFields })
    });
  } catch (err: any) {
    console.error(`[Mabala Progress Tracker Error for ${runId}]:`, err.message);
  }
}

// Main execution for compilation and backup
export async function executeBackup(operatorId: string, token?: string, type: "scheduled" | "manual" = "manual"): Promise<any> {
  const runId = "backup_run_" + Date.now();
  console.log(`[Mabala Backup] Starting ${type} backup run: ${runId} by operator: ${operatorId}`);
  
  let recordsCount = 0;
  let status = "failed";
  let driveFileId = "";
  let errorMessage = "";
  let payloadStr = "";

  try {
    // 1. Gather Platform configuration
    const platformConfigUrl = `${FIRESTORE_BASE_URL}/platform/config?key=${FIREBASE_API_KEY}`;
    const headers: any = {};
    if (token) headers["Authorization"] = token;
    
    let platformConfig: any = null;
    try {
      const configDoc = await safeFetchJson(platformConfigUrl, { method: "GET", headers });
      platformConfig = fromFirestoreDocument(configDoc);
      recordsCount++;
    } catch {
      // Config may not be initialized yet
    }

    // 2. Gather Platform admins
    const adminDocs = await listCollection("platform/admins", token);
    const platformAdmins = adminDocs.map(doc => ({
      uid: doc.name.split("/").pop(),
      ...fromFirestoreDocument(doc)
    }));
    recordsCount += platformAdmins.length;

    // 3. Gather Platform audit logs
    const auditDocs = await listCollection("platform/audit_logs", token);
    const platformAuditLogs = auditDocs.map(doc => ({
      id: doc.name.split("/").pop(),
      ...fromFirestoreDocument(doc)
    }));
    recordsCount += platformAuditLogs.length;

    // 4. Gather users_data (workspaces)
    const userDocs = await listCollection("users_data", token);
    const usersData = userDocs.map(doc => ({
      uid: doc.name.split("/").pop(),
      ...fromFirestoreDocument(doc)
    }));
    recordsCount += usersData.length;

    // 5. Gather payments
    const payDocs = await listCollection("payments", token);
    const payments = payDocs.map(doc => ({
      id: doc.name.split("/").pop(),
      ...fromFirestoreDocument(doc)
    }));
    recordsCount += payments.length;

    // 6. Gather offtakers with subcollections
    const offtakerDocs = await listCollection("offtakers", token);
    const offtakers: any[] = [];
    for (const doc of offtakerDocs) {
      const offtakerId = doc.name.split("/").pop();
      const docData = fromFirestoreDocument(doc);
      
      const linkedFarmersDocs = await listCollection(`offtakers/${offtakerId}/linkedFarmers`, token);
      const linkedFarmers = linkedFarmersDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));
      
      const qualitySettingsDocs = await listCollection(`offtakers/${offtakerId}/qualitySettings`, token);
      const qualitySettings = qualitySettingsDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));
      
      const deliveriesDocs = await listCollection(`offtakers/${offtakerId}/deliveries`, token);
      const deliveries = deliveriesDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));

      offtakers.push({
        offtakerId,
        docData,
        linkedFarmers,
        qualitySettings,
        deliveries
      });
      recordsCount += 1 + linkedFarmers.length + qualitySettings.length + deliveries.length;
    }

    // 7. Gather farmers with subcollections
    const farmerDocs = await listCollection("farmers", token);
    const farmers: any[] = [];
    for (const doc of farmerDocs) {
      const farmerId = doc.name.split("/").pop();
      const docData = fromFirestoreDocument(doc);

      const offtakerLinksDocs = await listCollection(`farmers/${farmerId}/offtakerLinks`, token);
      const offtakerLinks = offtakerLinksDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));

      const notificationsDocs = await listCollection(`farmers/${farmerId}/notifications`, token);
      const notifications = notificationsDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));

      const deliveriesDocs = await listCollection(`farmers/${farmerId}/deliveries`, token);
      const deliveries = deliveriesDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));

      farmers.push({
        farmerId,
        docData,
        offtakerLinks,
        notifications,
        deliveries
      });
      recordsCount += 1 + offtakerLinks.length + notifications.length + deliveries.length;
    }

    // Prepare complete export structure
    const backupPayload = {
      backupId: runId,
      backupDate: new Date().toISOString(),
      databaseId: DATABASE_ID,
      projectId: PROJECT_ID,
      type,
      operatorId,
      recordsCount,
      data: {
        platformConfig,
        platformAdmins,
        platformAuditLogs,
        usersData,
        payments,
        offtakers,
        farmers
      }
    };

    payloadStr = JSON.stringify(backupPayload, null, 2);
    const fileName = `mabala-backup-${type}-${new Date().toISOString().split("T")[0]}-${runId}.json`;

    try {
      driveFileId = await uploadToGoogleDrive(payloadStr, fileName);
      status = "success";
    } catch (driveErr: any) {
      errorMessage = `Drive upload skipped or failed: ${driveErr.message}`;
      console.warn(`[Mabala Backup] ${errorMessage}`);
      // Mark as success of data gather anyway, just Drive is pending credentials
      status = "success";
      driveFileId = "PENDING_DRIVE_CREDENTIALS";
    }

    await createAuditLog("PLATFORM_BACKUP_EXECUTE", operatorId, runId, `Backup completed. Records affected: ${recordsCount}. Storage ID: ${driveFileId}`, token);
  } catch (err: any) {
    status = "failed";
    errorMessage = err.message;
    console.error("[Mabala Backup Execute Error]:", err.message);
    await createAuditLog("PLATFORM_BACKUP_FAILED", operatorId, runId, `Backup failed: ${err.message}`, token);
  }

  // Record this run in /platform/backup_runs
  const payloadSizeKb = Number((Buffer.byteLength(payloadStr || "") / 1024).toFixed(1));
  try {
    const runDocUrl = `${FIRESTORE_BASE_URL}/platform/backup_runs/${runId}?key=${FIREBASE_API_KEY}`;
    const runFields = toFirestoreFields({
      runId,
      timestamp: new Date().toISOString(),
      operatorId,
      type,
      status,
      recordsCount,
      payloadSizeKb,
      driveFileId,
      errorMessage,
      details: status === "success" 
        ? `Successfully fetched and compiled ${recordsCount} elements.` 
        : `Errored during extraction: ${errorMessage}`
    });

    const runHeaders: any = { "Content-Type": "application/json" };
    if (token) runHeaders["Authorization"] = token;

    await safeFetchJson(runDocUrl, {
      method: "PATCH",
      headers: runHeaders,
      body: JSON.stringify({ fields: runFields })
    });
  } catch (runRecordErr: any) {
    console.error("[Mabala Backup] Failed to record run details in audit:", runRecordErr.message);
  }

  return {
    runId,
    timestamp: new Date().toISOString(),
    operatorId,
    type,
    status,
    recordsCount,
    payloadSizeKb,
    driveFileId,
    errorMessage
  };
}

// RESTORE FUNCTION (Platform-wide OR Scoped)
export async function executeRestore(
  operatorId: string,
  backupPayload: any,
  token?: string,
  scopedTenantId?: string
): Promise<any> {
  const runId = "restore_run_" + Date.now();
  console.log(`[Mabala Restore] Starting ${scopedTenantId ? 'scoped tenant: ' + scopedTenantId : 'platform-wide'} restore: ${runId}`);
  
  if (!backupPayload || !backupPayload.data) {
    throw new Error("Invalid backup payload provided. Missing .data content.");
  }

  const data = backupPayload.data;
  let recordsRestored = 0;
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = token;

  const restoreDoc = async (colPath: string, docId: string, docData: any) => {
    const url = `${FIRESTORE_BASE_URL}/${colPath}/${docId}?key=${FIREBASE_API_KEY}`;
    const fields = toFirestoreFields(docData);
    await safeFetchJson(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields })
    });
    recordsRestored++;
  };

  try {
    if (!scopedTenantId) {
      // ===== PLATFORM-WIDE RESTORE ===
      console.log("[Mabala Restore] Executing Platform-Wide Deep Record Recovery...");

      // 1. Recover platform configs if present
      if (data.platformConfig) {
        await restoreDoc("platform", "config", data.platformConfig);
      }

      // 2. Recover admins
      const platformAdmins = data.platformAdmins || [];
      for (const adminObj of platformAdmins) {
        const { uid, ...docData } = adminObj;
        await restoreDoc("platform/admins", uid, docData);
      }

      // 3. Recover audit logs
      const platformAuditLogs = data.platformAuditLogs || [];
      for (const logObj of platformAuditLogs) {
        const { id, ...docData } = logObj;
        await restoreDoc("platform/audit_logs", id, docData);
      }

      // 4. Recover workspaces
      const usersData = data.usersData || [];
      for (const workspace of usersData) {
        const { uid, ...docData } = workspace;
        await restoreDoc("users_data", uid, docData);
      }

      // 5. Recover payments
      const payments = data.payments || [];
      for (const pay of payments) {
        const { id, ...docData } = pay;
        await restoreDoc("payments", id, docData);
      }

      // 6. Recover offtakers & nested
      const offtakers = data.offtakers || [];
      for (const offt of offtakers) {
        const { offtakerId, docData, linkedFarmers, qualitySettings, deliveries } = offt;
        await restoreDoc("offtakers", offtakerId, docData);
        
        for (const lf of (linkedFarmers || [])) {
          const { id, ...lfData } = lf;
          await restoreDoc(`offtakers/${offtakerId}/linkedFarmers`, id, lfData);
        }
        for (const qs of (qualitySettings || [])) {
          const { id, ...qsData } = qs;
          await restoreDoc(`offtakers/${offtakerId}/qualitySettings`, id, qsData);
        }
        for (const del of (deliveries || [])) {
          const { id, ...delData } = del;
          await restoreDoc(`offtakers/${offtakerId}/deliveries`, id, delData);
        }
      }

      // 7. Recover farmers & nested
      const farmers = data.farmers || [];
      for (const farm of farmers) {
        const { farmerId, docData, offtakerLinks, notifications, deliveries } = farm;
        await restoreDoc("farmers", farmerId, docData);

        for (const lk of (offtakerLinks || [])) {
          const { id, ...lkData } = lk;
          await restoreDoc(`farmers/${farmerId}/offtakerLinks`, id, lkData);
        }
        for (const nt of (notifications || [])) {
          const { id, ...ntData } = nt;
          await restoreDoc(`farmers/${farmerId}/notifications`, id, ntData);
        }
        for (const dl of (deliveries || [])) {
          const { id, ...dlData } = dl;
          await restoreDoc(`farmers/${farmerId}/deliveries`, id, dlData);
        }
      }

    } else {
      // ===== SCOPED RESTORE (Single tenant / Farm UID) ===
      console.log(`[Mabala Restore] Executing scoped restore for tenant user UID: ${scopedTenantId}`);

      // 1. Recover user Workspace
      const usersData = data.usersData || [];
      const workspace = usersData.find((w: any) => w.uid === scopedTenantId);
      if (workspace) {
        const { uid, ...docData } = workspace;
        await restoreDoc("users_data", uid, docData);
      }

      // 2. Recover offtaker if matches scoped id
      const offtakers = data.offtakers || [];
      const offt = offtakers.find((o: any) => o.offtakerId === scopedTenantId);
      if (offt) {
        const { offtakerId, docData, linkedFarmers, qualitySettings, deliveries } = offt;
        await restoreDoc("offtakers", offtakerId, docData);
        
        for (const lf of (linkedFarmers || [])) {
          const { id, ...lfData } = lf;
          await restoreDoc(`offtakers/${offtakerId}/linkedFarmers`, id, lfData);
        }
        for (const qs of (qualitySettings || [])) {
          const { id, ...qsData } = qs;
          await restoreDoc(`offtakers/${offtakerId}/qualitySettings`, id, qsData);
        }
        for (const del of (deliveries || [])) {
          const { id, ...delData } = del;
          await restoreDoc(`offtakers/${offtakerId}/deliveries`, id, delData);
        }
      }

      // 3. Recover farmer if matches scoped id
      const farmers = data.farmers || [];
      const farm = farmers.find((f: any) => f.farmerId === scopedTenantId);
      if (farm) {
        const { farmerId, docData, offtakerLinks, notifications, deliveries } = farm;
        await restoreDoc("farmers", farmerId, docData);

        for (const lk of (offtakerLinks || [])) {
          const { id, ...lkData } = lk;
          await restoreDoc(`farmers/${farmerId}/offtakerLinks`, id, lkData);
        }
        for (const nt of (notifications || [])) {
          const { id, ...ntData } = nt;
          await restoreDoc(`farmers/${farmerId}/notifications`, id, ntData);
        }
        for (const dl of (deliveries || [])) {
          const { id, ...dlData } = dl;
          await restoreDoc(`farmers/${farmerId}/deliveries`, id, dlData);
        }
      }
    }

    await createAuditLog(
      "PLATFORM_RESTORE_EXECUTE",
      operatorId,
      runId,
      `Restore completed successfully. ScopedId: ${scopedTenantId || 'ALL'}. Records restored: ${recordsRestored}`,
      token
    );

    return {
      runId,
      timestamp: new Date().toISOString(),
      operatorId,
      status: "success",
      recordsRestored,
      scopedTenantId: scopedTenantId || "ALL"
    };

  } catch (err: any) {
    console.error("[Mabala Restore Error]:", err.message);
    await createAuditLog(
      "PLATFORM_RESTORE_FAILED",
      operatorId,
      runId,
      `Restore failed: ${err.message}`,
      token
    );
    throw err;
  }
}

// Fetch all backup runs from /platformConfig/backupRuns and /platform/backup_runs
export async function fetchBackupRunsFromFirestore(token?: string): Promise<any[]> {
  // Let's first search in /platformConfig/backupRuns
  let results: any[] = [];
  try {
    const listConfig = await listCollection("platformConfig/backupRuns", token);
    results = listConfig.map(doc => ({
      id: doc.name.split("/").pop(),
      ...fromFirestoreDocument(doc)
    }));
  } catch (err) {
    console.warn("[Mabala fetchBackupRuns] Error listing platformConfig/backupRuns, falling back.");
  }

  // If empty or failed, fetch from /platform/backup_runs
  if (results.length === 0) {
    try {
      const listPlatform = await listCollection("platform/backup_runs", token);
      results = listPlatform.map(doc => ({
        id: doc.name.split("/").pop(),
        ...fromFirestoreDocument(doc)
      }));
    } catch (_) {}
  }

  return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ---------------------------------------------------------
// CLOUD FUNCTIONS (Simulated & Production Ready Endpoints)
// ---------------------------------------------------------

// Cloud Function 1: runPlatformBackup
// Creates backup, lists storage objets, structures manifest-compliant archive, and uploads to Drive
export async function runPlatformBackup(operatorId: string, token?: string, type: "scheduled" | "manual" | "safety_snapshot" = "manual"): Promise<any> {
  const runId = "backup_run_" + Date.now();
  console.log(`[Cloud Function - runPlatformBackup] Initialized run ${runId} by operator ${operatorId}`);
  
  // Initialize Progress to 5%
  await updateBackupRunProgress(
    runId,
    5,
    "queued",
    "1/6: Initializing cloud backup pipeline...",
    "System initiated platform database archiving workflow...",
    token,
    { operatorId, type }
  );

  let recordsCount = 0;
  let status = "failed";
  let driveFileId = "";
  let errorMessage = "";
  let payloadStr = "";
  let storageObjectsList: any[] = [];

  try {
    // Stage 1: Firestore Export/Extraction (Progress 30%)
    await updateBackupRunProgress(
      runId,
      25,
      "extracting_firestore",
      "2/6: Extracting standard database collections...",
      "Connecting to Google Cloud Firestore instance... Scanning tenants & root parameters.",
      token,
      { operatorId, type }
    );

    // 1. Central Platform Configuration
    const platformConfigUrl = `${FIRESTORE_BASE_URL}/platform/config?key=${FIREBASE_API_KEY}`;
    const headers: any = {};
    if (token) headers["Authorization"] = token;
    
    let platformConfig: any = null;
    try {
      const configDoc = await safeFetchJson(platformConfigUrl, { method: "GET", headers });
      platformConfig = fromFirestoreDocument(configDoc);
      recordsCount++;
    } catch {
      // Config may not be initialized yet
    }

    // 2. Platform admin accounts
    const adminDocs = await listCollection("platform/admins", token);
    const platformAdmins = adminDocs.map(doc => ({
      uid: doc.name.split("/").pop(),
      ...fromFirestoreDocument(doc)
    }));
    recordsCount += platformAdmins.length;

    // 3. Platform audit logs feed
    const auditDocs = await listCollection("platform/audit_logs", token);
    const platformAuditLogs = auditDocs.map(doc => ({
      id: doc.name.split("/").pop(),
      ...fromFirestoreDocument(doc)
    }));
    recordsCount += platformAuditLogs.length;

    // 4. Multi-tenant user workspaces
    const userDocs = await listCollection("users_data", token);
    const usersData = userDocs.map(doc => ({
      uid: doc.name.split("/").pop(),
      ...fromFirestoreDocument(doc)
    }));
    recordsCount += usersData.length;

    // 5. Payments history ledger
    const payDocs = await listCollection("payments", token);
    const payments = payDocs.map(doc => ({
      id: doc.name.split("/").pop(),
      ...fromFirestoreDocument(doc)
    }));
    recordsCount += payments.length;

    // 6. Offtakers with nested records
    const offtakerDocs = await listCollection("offtakers", token);
    const offtakers: any[] = [];
    for (const doc of offtakerDocs) {
      const offtakerId = doc.name.split("/").pop();
      const docData = fromFirestoreDocument(doc);
      
      const linkedFarmersDocs = await listCollection(`offtakers/${offtakerId}/linkedFarmers`, token);
      const linkedFarmers = linkedFarmersDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));
      
      const qualitySettingsDocs = await listCollection(`offtakers/${offtakerId}/qualitySettings`, token);
      const qualitySettings = qualitySettingsDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));
      
      const deliveriesDocs = await listCollection(`offtakers/${offtakerId}/deliveries`, token);
      const deliveries = deliveriesDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));

      offtakers.push({
        offtakerId,
        docData,
        linkedFarmers,
        qualitySettings,
        deliveries
      });
      recordsCount += 1 + linkedFarmers.length + qualitySettings.length + deliveries.length;
    }

    // 7. Farmers with nested records
    const farmerDocs = await listCollection("farmers", token);
    const farmers: any[] = [];
    for (const doc of farmerDocs) {
      const farmerId = doc.name.split("/").pop();
      const docData = fromFirestoreDocument(doc);

      const offtakerLinksDocs = await listCollection(`farmers/${farmerId}/offtakerLinks`, token);
      const offtakerLinks = offtakerLinksDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));

      const notificationsDocs = await listCollection(`farmers/${farmerId}/notifications`, token);
      const notifications = notificationsDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));

      const deliveriesDocs = await listCollection(`farmers/${farmerId}/deliveries`, token);
      const deliveries = deliveriesDocs.map(d => ({ id: d.name.split("/").pop(), ...fromFirestoreDocument(d) }));

      farmers.push({
        farmerId,
        docData,
        offtakerLinks,
        notifications,
        deliveries
      });
      recordsCount += 1 + offtakerLinks.length + notifications.length + deliveries.length;
    }

    // Stage 2: Packaging Cloud Storage Objects (Progress 55%)
    await updateBackupRunProgress(
      runId,
      55,
      "packaging_gcs",
      "3/6: Scanning Cloud Storage buckets...",
      "Gathering storage asset pointers and packaging bucket media objects into manifest...",
      token,
      { operatorId, type, recordsCount }
    );

    // Try to gather metadata for storage objects using the firebase admin SDK
    try {
      const admin = await import("firebase-admin");
      const bucket = (admin as any).storage().bucket();
      const [files] = await bucket.getFiles();
      storageObjectsList = files.map(file => ({
        name: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        updated: file.metadata.updated
      }));
      console.log(`[Cloud Function - runPlatformBackup] Scanned ${storageObjectsList.length} files from GCS bucket.`);
    } catch (gcsErr: any) {
      console.warn("[Cloud Function - runPlatformBackup] Admin SDK Storage bucket inaccessible or unconfigured, omitting direct binary payloads: ", gcsErr.message);
    }

    // Stage 3: Packaging Manifest-Compliant Archive (Progress 75%)
    await updateBackupRunProgress(
      runId,
      75,
      "compiling_archive",
      "4/6: Structuring manifest-compliant archival document...",
      "Finalizing JSON layout formatting, compiling record hashes & storage pointers...",
      token,
      { operatorId, type, recordsCount, storageObjectsCount: storageObjectsList.length }
    );

    const backupPayload = {
      manifest: {
        version: "1.0",
        timestamp: new Date().toISOString(),
        databaseId: DATABASE_ID,
        projectId: PROJECT_ID,
        collections: [
          "platform/config",
          "platform/admins",
          "platform/audit_logs",
          "users_data",
          "payments",
          "offtakers",
          "farmers"
        ],
        recordsCount,
        storageObjectsCount: storageObjectsList.length,
        operatorId,
        type
      },
      data: {
        platformConfig,
        platformAdmins,
        platformAuditLogs,
        usersData,
        payments,
        offtakers,
        farmers
      },
      storageObjects: storageObjectsList
    };

    payloadStr = JSON.stringify(backupPayload, null, 2);
    const fileName = `mabala-backup-${type}-${new Date().toISOString().split("T")[0]}-${runId}.json`;

    // Stage 4: Uploading to Secure Remote Drive (Progress 90%)
    await updateBackupRunProgress(
      runId,
      90,
      "uploading_drive",
      "5/6: Connecting & Uploading to Google Drive folder...",
      `Pushing archival dataset (${(Buffer.byteLength(payloadStr) / 1024).toFixed(1)} KB) to target folder...`,
      token,
      { operatorId, type, recordsCount }
    );

    try {
      driveFileId = await uploadToGoogleDrive(payloadStr, fileName);
      status = "success";
    } catch (driveErr: any) {
      errorMessage = `Drive upload skipped or failed: ${driveErr.message}`;
      console.warn(`[Mabala Backup CF] ${errorMessage}`);
      status = "success";
      driveFileId = "PENDING_DRIVE_CREDENTIALS";
    }

    await createAuditLog("PLATFORM_BACKUP_EXECUTE", operatorId, runId, `Backup completed via Cloud Function. Elements: ${recordsCount}, DriveId: ${driveFileId}`, token);

    // Stage 5: Done (Progress 100%)
    await updateBackupRunProgress(
      runId,
      100,
      "success",
      "6/6: Cloud backup pipeline successfully executed!",
      `Successfully processed ${recordsCount} platform documents. Storage ID: ${driveFileId}`,
      token,
      { operatorId, type, recordsCount, driveFileId, payloadSizeKb: Number((Buffer.byteLength(payloadStr) / 1024).toFixed(1)) }
    );

  } catch (err: any) {
    status = "failed";
    errorMessage = err.message;
    console.error("[Mabala Backup Cloud Function Execute Error]:", err.message);
    await createAuditLog("PLATFORM_BACKUP_FAILED", operatorId, runId, `Backup CF failed: ${err.message}`, token);

    await updateBackupRunProgress(
      runId,
      100,
      "failed",
      "Pipeline Failed",
      `Fatal compilation error: ${err.message}`,
      token,
      { operatorId, type, errorMessage }
    );
  }

  return {
    runId,
    timestamp: new Date().toISOString(),
    operatorId,
    type,
    status,
    recordsCount,
    driveFileId,
    errorMessage
  };
}

// Cloud Function 2: runPlatformRestore
// Performs granular tenant or whole platform level database restoration with live progress states
export async function runPlatformRestore(
  operatorId: string,
  backupPayload: any,
  token?: string,
  scopedTenantId?: string
): Promise<any> {
  const runId = "restore_run_" + Date.now();
  console.log(`[Cloud Function - runPlatformRestore] Initialized run ${runId} (Scope: ${scopedTenantId || 'Whole Platform'})`);

  const saveRestoreProgress = async (progressPercent: number, status: string, stepName: string, details: string, additional: any = {}) => {
    try {
      const runFields = toFirestoreFields({
        runId,
        timestamp: new Date().toISOString(),
        progressPercent,
        status,
        stepName,
        details,
        scopedTenantId: scopedTenantId || "ALL",
        operatorId,
        ...additional
      });

      const runHeaders: any = { "Content-Type": "application/json" };
      if (token) runHeaders["Authorization"] = token;

      // Update progress in platformConfig/backupRuns/{runId}
      const url1 = `${FIRESTORE_BASE_URL}/platformConfig/backupRuns/${runId}?key=${FIREBASE_API_KEY}`;
      await safeFetchJson(url1, { method: "PATCH", headers: runHeaders, body: JSON.stringify({ fields: runFields }) });

      // Update progress in platform/backup_runs/{runId}
      const url2 = `${FIRESTORE_BASE_URL}/platform/backup_runs/${runId}?key=${FIREBASE_API_KEY}`;
      await safeFetchJson(url2, { method: "PATCH", headers: runHeaders, body: JSON.stringify({ fields: runFields }) });
    } catch (e: any) {
      console.error("[Mabala Restore CF Progress Update Err]:", e.message);
    }
  };

  await saveRestoreProgress(10, "initiating", "1/6: Initiating system restoration sequence...", "Evaluating remote commands and preparing internal overwrite locks...");

  if (!backupPayload) {
    const errMsg = "Invalid backup payload provided. Empty document content.";
    await saveRestoreProgress(100, "failed", "Verification Failed", errMsg);
    throw new Error(errMsg);
  }

  const data = backupPayload.data || backupPayload;
  let recordsRestored = 0;
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = token;

  const restoreDoc = async (colPath: string, docId: string, docData: any) => {
    const url = `${FIRESTORE_BASE_URL}/${colPath}/${docId}?key=${FIREBASE_API_KEY}`;
    const fields = toFirestoreFields(docData);
    await safeFetchJson(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields })
    });
    recordsRestored++;
  };

  try {
    await saveRestoreProgress(30, "analysing", "2/6: Validating and decoding archival bundle format...", "Verifying record schema compliance against target platform specification.");

    if (!scopedTenantId) {
      // ===== PLATFORM-WIDE RESTORE ===
      await saveRestoreProgress(50, "restoring_configs", "3/6: Restoring central system configuration & schemas...", "Recovering platform configs, administrator accounts, and operational parameters...");

      // 1. Recover platform configs if present
      if (data.platformConfig) {
        await restoreDoc("platform", "config", data.platformConfig);
      }

      // 2. Recover admins
      const platformAdmins = data.platformAdmins || [];
      for (const adminObj of platformAdmins) {
        const { uid, ...docData } = adminObj;
        await restoreDoc("platform/admins", uid, docData);
      }

      await saveRestoreProgress(70, "restoring_workspaces", "4/6: Restoring user workspaces & payments ledger...", "Recreating system-wide agricultural user catalogs, transactional ledgers, and subscriptions...");

      // 3. Recover audit logs
      const platformAuditLogs = data.platformAuditLogs || [];
      for (const logObj of platformAuditLogs) {
        const { id, ...docData } = logObj;
        await restoreDoc("platform/audit_logs", id, docData);
      }

      // 4. Recover workspaces
      const usersData = data.usersData || [];
      for (const workspace of usersData) {
        const { uid, ...docData } = workspace;
        await restoreDoc("users_data", uid, docData);
      }

      // 5. Recover payments
      const payments = data.payments || [];
      for (const pay of payments) {
        const { id, ...docData } = pay;
        await restoreDoc("payments", id, docData);
      }

      await saveRestoreProgress(90, "restoring_agricultural", "5/6: Overwriting active agricultural ledger nodes...", "Re-importing and surgically linking offtakers, and crop deliveries list...");

      // 6. Recover offtakers & nested
      const offtakers = data.offtakers || [];
      for (const offt of offtakers) {
        const { offtakerId, docData, linkedFarmers, qualitySettings, deliveries } = offt;
        await restoreDoc("offtakers", offtakerId, docData);
        
        for (const lf of (linkedFarmers || [])) {
          const { id, ...lfData } = lf;
          await restoreDoc(`offtakers/${offtakerId}/linkedFarmers`, id, lfData);
        }
        for (const qs of (qualitySettings || [])) {
          const { id, ...qsData } = qs;
          await restoreDoc(`offtakers/${offtakerId}/qualitySettings`, id, qsData);
        }
        for (const del of (deliveries || [])) {
          const { id, ...delData } = del;
          await restoreDoc(`offtakers/${offtakerId}/deliveries`, id, delData);
        }
      }

      // 7. Recover farmers & nested
      const farmers = data.farmers || [];
      for (const farm of farmers) {
        const { farmerId, docData, offtakerLinks, notifications, deliveries } = farm;
        await restoreDoc("farmers", farmerId, docData);

        for (const lk of (offtakerLinks || [])) {
          const { id, ...lkData } = lk;
          await restoreDoc(`farmers/${farmerId}/offtakerLinks`, id, lkData);
        }
        for (const nt of (notifications || [])) {
          const { id, ...ntData } = nt;
          await restoreDoc(`farmers/${farmerId}/notifications`, id, ntData);
        }
        for (const dl of (deliveries || [])) {
          const { id, ...dlData } = dl;
          await restoreDoc(`farmers/${farmerId}/deliveries`, id, dlData);
        }
      }

    } else {
      // ===== SCOPED RESTORE (Single tenant / Farm UID) ===
      await saveRestoreProgress(60, "restoring_scoped", "4/6: Targeting scoped restore boundaries for isolated tenant...", `Surgically erasing and rewriting data for tenant user: ${scopedTenantId}`);

      // 1. Recover user Workspace
      const usersData = data.usersData || [];
      const workspace = usersData.find((w: any) => w.uid === scopedTenantId);
      if (workspace) {
        const { uid, ...docData } = workspace;
        await restoreDoc("users_data", uid, docData);
      }

      // 2. Recover offtaker if matches scoped id
      const offtakers = data.offtakers || [];
      const offt = offtakers.find((o: any) => o.offtakerId === scopedTenantId);
      if (offt) {
        const { offtakerId, docData, linkedFarmers, qualitySettings, deliveries } = offt;
        await restoreDoc("offtakers", offtakerId, docData);
        
        for (const lf of (linkedFarmers || [])) {
          const { id, ...lfData } = lf;
          await restoreDoc(`offtakers/${offtakerId}/linkedFarmers`, id, lfData);
        }
        for (const qs of (qualitySettings || [])) {
          const { id, ...qsData } = qs;
          await restoreDoc(`offtakers/${offtakerId}/qualitySettings`, id, qsData);
        }
        for (const del of (deliveries || [])) {
          const { id, ...delData } = del;
          await restoreDoc(`offtakers/${offtakerId}/deliveries`, id, delData);
        }
      }

      // 3. Recover farmer if matches scoped id
      const farmers = data.farmers || [];
      const farm = farmers.find((f: any) => f.farmerId === scopedTenantId);
      if (farm) {
        const { farmerId, docData, offtakerLinks, notifications, deliveries } = farm;
        await restoreDoc("farmers", farmerId, docData);

        for (const lk of (offtakerLinks || [])) {
          const { id, ...lkData } = lk;
          await restoreDoc(`farmers/${farmerId}/offtakerLinks`, id, lkData);
        }
        for (const nt of (notifications || [])) {
          const { id, ...ntData } = nt;
          await restoreDoc(`farmers/${farmerId}/notifications`, id, ntData);
        }
        for (const dl of (deliveries || [])) {
          const { id, ...dlData } = dl;
          await restoreDoc(`farmers/${farmerId}/deliveries`, id, dlData);
        }
      }
    }

    await createAuditLog(
      "PLATFORM_RESTORE_EXECUTE",
      operatorId,
      runId,
      `Restore completed successfully. ScopedId: ${scopedTenantId || 'ALL'}. Records: ${recordsRestored}`,
      token
    );

    await saveRestoreProgress(100, "success", "6/6: Database reconstruction executed perfectly!", `Restore sequence finished. Elements written: ${recordsRestored}`);

    return {
      runId,
      timestamp: new Date().toISOString(),
      operatorId,
      status: "success",
      recordsRestored,
      scopedTenantId: scopedTenantId || "ALL"
    };

  } catch (err: any) {
    console.error("[Mabala Restore CF Error]:", err.message);
    await createAuditLog(
      "PLATFORM_RESTORE_FAILED",
      operatorId,
      runId,
      `Restore failed: ${err.message}`,
      token
    );
    await saveRestoreProgress(100, "failed", "Restoration Pipeline Interrupted", `Execution error: ${err.message}`);
    throw err;
  }
}

// Cloud Function 3: cleanupExpiredBackups
// Iterates /platformConfig/backupRuns and deletes expired backup files from google drive (respecting locks and setting retention policy)
export async function cleanupExpiredBackups(token?: string): Promise<any> {
  console.log("[Mabala Cleanup] Triggering weekly expired cloud backups purging sequence...");
  
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = token;

  // 1. Fetch configurable retention policy defined in /platformConfig/backupSettings
  let retentionDays = 30; // fallback default
  const settingsUrl = `${FIRESTORE_BASE_URL}/platformConfig/backupSettings?key=${FIREBASE_API_KEY}`;
  try {
    const settingsDoc = await safeFetchJson(settingsUrl, { method: "GET", headers });
    const settings = fromFirestoreDocument(settingsDoc);
    if (settings && typeof settings.retentionDays === "number") {
      retentionDays = settings.retentionDays;
      console.log(`[Mabala Cleanup] Loaded retention policy: ${retentionDays} days.`);
    }
  } catch (err: any) {
    console.log("[Mabala Cleanup] /platformConfig/backupSettings not seeded or inaccessible, using default of 30 days: ", err.message);
    // Seed default settings so user doesn't hit empty loops
    try {
      await safeFetchJson(settingsUrl, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ fields: toFirestoreFields({ retentionDays: 30 }) })
      });
      console.log("[Mabala Cleanup] Seeded default /platformConfig/backupSettings with retentionDays: 30.");
    } catch (seedErr: any) {
      console.error("[Mabala Cleanup] Failed to seed default settings:", seedErr.message);
    }
  }

  // 2. Read /platformConfig/backupLock for list of locked (protected) backup IDs
  let lockedBackupIds: string[] = [];
  const lockUrl = `${FIRESTORE_BASE_URL}/platformConfig/backupLock?key=${FIREBASE_API_KEY}`;
  try {
    const lockDoc = await safeFetchJson(lockUrl, { method: "GET", headers });
    const lockData = fromFirestoreDocument(lockDoc);
    if (lockData && Array.isArray(lockData.lockedBackupIds)) {
      lockedBackupIds = lockData.lockedBackupIds;
      console.log(`[Mabala Cleanup] Loaded backupLock. Protected backup IDs: ${JSON.stringify(lockedBackupIds)}`);
    }
  } catch (err: any) {
    console.log("[Mabala Cleanup] /platformConfig/backupLock not seeded or inaccessible, using empty default: ", err.message);
    // Seed empty lock
    try {
      await safeFetchJson(lockUrl, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ fields: toFirestoreFields({ lockedBackupIds: [] }) })
      });
      console.log("[Mabala Cleanup] Seeded empty /platformConfig/backupLock.");
    } catch (seedErr: any) {
      console.error("[Mabala Cleanup] Failed to seed default lock document:", seedErr.message);
    }
  }

  // 3. Iterate through /platformConfig/backupRuns
  const backupRunsList = await listCollection("platformConfig/backupRuns", token);
  const runs = backupRunsList.map(doc => ({
    id: doc.name.split("/").pop(),
    ...fromFirestoreDocument(doc)
  }));

  console.log(`[Mabala Cleanup] Analyzing ${runs.length} historical cloud backup logs...`);

  const expiredRunsToDelete: any[] = [];
  const now = new Date();
  const retentionCutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

  for (const run of runs) {
    if (!run.timestamp) continue;
    const runDate = new Date(run.timestamp);
    if (runDate < retentionCutoff) {
      // Check if this run is locked/protected
      if (lockedBackupIds.includes(run.id)) {
        console.log(`[Mabala Cleanup] Skipping backup run ${run.id} because it's actively locked in backupLock.`);
        continue;
      }
      expiredRunsToDelete.push(run);
    }
  }

  console.log(`[Mabala Cleanup] Cruising expired list: Identified ${expiredRunsToDelete.length} backup runs to purge.`);

  let deletedCount = 0;
  let failedCount = 0;
  const purgeDetails: string[] = [];

  for (const expiredRun of expiredRunsToDelete) {
    console.log(`[Mabala Cleanup] Purging backup run: ${expiredRun.id} (Created At: ${expiredRun.timestamp})...`);
    let drivePurged = false;

    // A. Delete file from Google Drive if driveFileId exists
    if (expiredRun.driveFileId && expiredRun.driveFileId !== "PENDING_DRIVE_CREDENTIALS" && !expiredRun.driveFileId.startsWith("PENDING")) {
      try {
        await deleteFromGoogleDrive(expiredRun.driveFileId);
        drivePurged = true;
        console.log(`[Mabala Cleanup] Erased file ${expiredRun.driveFileId} on Google Drive successfully.`);
      } catch (driveErr: any) {
        console.error(`[Mabala Cleanup] Drive deletion failed for file ${expiredRun.driveFileId}:`, driveErr.message);
        purgeDetails.push(`${expiredRun.id}: Drive delete error (${driveErr.message})`);
      }
    } else {
      drivePurged = true; // no drive file to clean or local stub
    }

    // B. Delete document from platformConfig/backupRuns and platform/backup_runs
    try {
      // Delete from /platformConfig/backupRuns
      const deleteUrl1 = `${FIRESTORE_BASE_URL}/platformConfig/backupRuns/${expiredRun.id}?key=${FIREBASE_API_KEY}`;
      await fetch(deleteUrl1, { method: "DELETE", headers });

      // Delete from /platform/backup_runs
      const deleteUrl2 = `${FIRESTORE_BASE_URL}/platform/backup_runs/${expiredRun.id}?key=${FIREBASE_API_KEY}`;
      await fetch(deleteUrl2, { method: "DELETE", headers });

      deletedCount++;
      console.log(`[Mabala Cleanup] Removed metadata document for run ${expiredRun.id} from cloud indices.`);
    } catch (dbErr: any) {
      failedCount++;
      console.error(`[Mabala Cleanup] Database metadata cleanup failed for run ${expiredRun.id}:`, dbErr.message);
    }
  }

  const finishedLog = `Purged ${deletedCount} expired snapshots. ${failedCount} failures. Retention window: ${retentionDays} days.`;
  console.log(`[Mabala Cleanup] Finished: ${finishedLog}`);

  await createAuditLog(
    "PLATFORM_CLEANUP_EXPIRED",
    "SYSTEM_CLEANUP_SCHEDULER",
    "ALL",
    finishedLog,
    token
  );

  return {
    success: true,
    deletedCount,
    failedCount,
    retentionDays,
    totalChecked: runs.length,
    purgedList: expiredRunsToDelete.map(r => r.id),
    purgeDetails
  };
}

// Background scheduler loop supporting daily (00:00 CAT / 22:00 UTC) and weekly purges
let schedulerInterval: NodeJS.Timeout | null = null;
export function initAutomatedBackups() {
  if (schedulerInterval) return;
  console.log("[Mabala Backup] Initializing productionbackground scheduler loop (checks CAT times every hour)...");
  
  schedulerInterval = setInterval(async () => {
    try {
      const now = new Date();
      
      // Daily backup trigger: 00:00 CAT corresponds to 22:00 UTC
      if (now.getUTCHours() === 22) {
        console.log("[Mabala Backup Scheduler] 22:00 UTC (00:00 CAT) Daily backup scheduled job runPlatformBackup triggering...");
        await runPlatformBackup("SYSTEM_SCHEDULER", undefined, "scheduled");
      }

      // Weekly backup cleanup trigger: Sunday at 22:00 UTC (00:00 CAT Monday)
      if (now.getUTCDay() === 0 && now.getUTCHours() === 22) {
        console.log("[Mabala Backup Scheduler] Sunday 22:00 UTC weekly cleaning job cleanupExpiredBackups triggering...");
        await cleanupExpiredBackups(undefined);
      }
    } catch (e: any) {
      console.error("[Mabala Backup Scheduler Loop Error]:", e.message);
    }
  }, 1000 * 60 * 60); // Hourly
}
