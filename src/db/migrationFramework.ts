/**
 * Production-Grade Database Migration Framework
 * Encapsulates schema versioning, backward compatibility tracking, and transformation of tenant documents.
 */

export interface SchemaMigration {
  version: number;
  description: string;
  up: (data: any) => any;
  down: (data: any) => any;
}

/**
 * Migration Registry
 * Lists the historical sequence of schema changes required when upgrading tenant databases.
 */
export const migrationRegistry: SchemaMigration[] = [
  {
    version: 1,
    description: "Initial production baseline schema v1",
    up: (data: any) => {
      // Ensure baseline array entities exist
      const baseline = { ...data };
      const collections = [
        "farms", "accounts", "suppliers", "customers", "expenses", "invoices",
        "quotations", "crops", "employees", "payslips", "poultry", "fish",
        "inventory", "cashSales", "loans", "investments", "livestock", "assets",
        "otherRevenues", "leaveRecords", "employeeAdvances", "auditLogs", "archivedRecords"
      ];
      collections.forEach(col => {
        if (!Array.isArray(baseline[col])) {
          baseline[col] = [];
        }
      });
      return baseline;
    },
    down: (data: any) => data
  },
  {
    version: 2,
    description: "Add soft-delete and audit trail schema tracking to historical logs",
    up: (data: any) => {
      const updated = { ...data };
      // Ensure isDeleted parameter or deletedAt metadata field structure exists across rows
      const arrayKeys = ["suppliers", "customers", "expenses", "invoices", "crops", "employees", "livestock"];
      arrayKeys.forEach(key => {
        if (Array.isArray(updated[key])) {
          updated[key] = updated[key].map((item: any) => {
            if (typeof item === "object" && item !== null) {
              return {
                isDeleted: item.isDeleted !== undefined ? item.isDeleted : false,
                version: item.version || 1,
                ...item
              };
            }
            return item;
          });
        }
      });
      if (!Array.isArray(updated.auditLogs)) {
        updated.auditLogs = [];
      }
      return updated;
    },
    down: (data: any) => {
      const downgraded = { ...data };
      const arrayKeys = ["suppliers", "customers", "expenses", "invoices", "crops", "employees", "livestock"];
      arrayKeys.forEach(key => {
        if (Array.isArray(downgraded[key])) {
          downgraded[key] = downgraded[key].map((item: any) => {
            if (typeof item === "object" && item !== null) {
              const { isDeleted, version, ...rest } = item;
              return rest;
            }
            return item;
          });
        }
      });
      return downgraded;
    }
  },
  {
    version: 3,
    description: "Initialize tenant wallets ledger with baseline currency auditing keys and systemSettings concept",
    up: (data: any) => {
      const updated = { ...data };
      if (!updated.systemSettings) {
        updated.systemSettings = {
          theme: "light",
          notificationsEnabled: true,
          auditRetentionDays: 365,
          mfaEnabled: false,
          mfaSmsVerified: false,
          backupRetentionPolicy: "90_DAYS"
        };
      }
      if (typeof updated.credits !== "number") {
        updated.credits = 300;
      }
      return updated;
    },
    down: (data: any) => {
      const downgraded = { ...data };
      delete downgraded.systemSettings;
      return downgraded;
    }
  }
];

/**
 * Schema Version Manager
 * Reads and records database target schema state.
 */
export const schemaVersionManager = {
  getCurrentVersion(): number {
    return migrationRegistry[migrationRegistry.length - 1].version;
  },
  
  getRequiredMigrations(currentVersion: number): SchemaMigration[] {
    return migrationRegistry.filter(m => m.version > currentVersion);
  }
};

/**
 * Migration Runner
 * Iteratively applies progressive transformations on incoming data to ensure zero lost details.
 */
export function migrationRunner(rawTenantData: any): { migratedData: any; upgradedCount: number } {
  if (!rawTenantData) {
    return { migratedData: {}, upgradedCount: 0 };
  }
  
  const currentDocVersion = typeof rawTenantData.schemaVersion === "number" ? rawTenantData.schemaVersion : 0;
  const targetVersion = schemaVersionManager.getCurrentVersion();
  
  if (currentDocVersion >= targetVersion) {
    return { migratedData: rawTenantData, upgradedCount: 0 };
  }
  
  console.log(`[Schema Migration] Upgrading tenant schema from v${currentDocVersion} to v${targetVersion}...`);
  let activeData = { ...rawTenantData };
  let upgradedCount = 0;
  
  const applicable = schemaVersionManager.getRequiredMigrations(currentDocVersion);
  
  for (const m of applicable) {
    try {
      console.log(`[Schema Migration] Applying migration v${m.version}: ${m.description}`);
      activeData = m.up(activeData);
      activeData.schemaVersion = m.version;
      upgradedCount++;
    } catch (err) {
      console.error(`[Schema Migration] Failure executing migration v${m.version}:`, err);
      throw new Error(`Database Migration Framework Error processing version ${m.version}: ${String(err)}`);
    }
  }
  
  console.log(`[Schema Migration] Multi-tenant migration run succeeded. Upgraded keys across ${upgradedCount} versions.`);
  return { migratedData: activeData, upgradedCount };
}
