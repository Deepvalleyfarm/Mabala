import React, { useState, useRef } from "react";
import { 
  BackupData, 
  CropCycle, 
  Invoice, 
  ExpenseTransaction, 
  CashSale, 
  LivestockRecord, 
  PoultryBatch, 
  FishBatch, 
  UserMember, 
  Account 
} from "../types";
import { INITIAL_ACCOUNTS } from "../data/initialAccounts";
import { 
  Database, 
  UploadCloud, 
  DownloadCloud, 
  Clipboard, 
  Check, 
  AlertTriangle, 
  Trash2, 
  FileCheck, 
  Maximize2 
} from "lucide-react";

interface BackupRestorePanelProps {
  // state getters
  farms: any[];
  accounts: any[];
  suppliers: any[];
  customers: any[];
  expenses: any[];
  invoices: any[];
  quotations: any[];
  crops: any[];
  employees: any[];
  payslips: any[];
  poultry: any[];
  fish: any[];
  inventory: any[];
  cashSales: any[];
  loans: any[];
  investments: any[];
  livestock: any[];
  credits: number;
  userProfile: any;

  assets: any[];
  otherRevenues: any[];
  leaveRecords: any[];
  advances: any[];
  inventoryMovements?: any[];
  auditLogs: any[];
  archivedRecords: any[];

  // callbacks
  onRestore: (data: BackupData) => void;
  onClear: () => void;
}

export default function BackupRestorePanel({
  farms,
  accounts,
  suppliers,
  customers,
  expenses,
  invoices,
  quotations,
  crops,
  employees,
  payslips,
  poultry,
  fish,
  inventory,
  cashSales,
  loans,
  investments,
  livestock,
  credits,
  userProfile,
  assets,
  otherRevenues,
  leaveRecords,
  advances,
  inventoryMovements,
  auditLogs,
  archivedRecords,
  onRestore,
  onClear
}: BackupRestorePanelProps) {
  const [pasteData, setPasteData] = useState("");
  const [copied, setCopied] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<BackupData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compile active workspace state into standard JSON backup format
  const generateBackupData = (): BackupData => {
    return {
      farms,
      accounts,
      suppliers,
      customers,
      expenses,
      invoices,
      quotations,
      crops,
      employees,
      payslips,
      poultry,
      fish,
      inventory,
      cashSales,
      loans,
      investments,
      livestock,
      credits,
      userProfile,
      assets,
      otherRevenues,
      leaveRecords,
      advances,
      inventoryMovements,
      auditLogs,
      archivedRecords,
      backupDate: new Date().toISOString()
    };
  };

  const handleDownloadBackup = () => {
    try {
      const data = generateBackupData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mabala-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccessMsg("System successfully compiled and downloaded backup payload.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setErrorMsg(`Failed to generate backup: ${e.message}`);
    }
  };

  const handleCopyBackup = () => {
    try {
      const data = generateBackupData();
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) {
      setErrorMsg("Failed to copy backup data.");
    }
  };

  // Human mapping / singular/plural resolution
  const parseAndVerify = (rawText: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (!rawText.trim()) {
        setErrorMsg("Please paste or upload backup payload.");
        return;
      }
      
      const parsed = JSON.parse(rawText);
      
      // Determine session profile if available
      const parsedProfile = parsed.userProfile || (parsed.currentUser ? {
        name: parsed.currentUser.fullname || parsed.currentUser.username,
        email: `${(parsed.currentUser.username || "admin").toLowerCase()}@localhost.zm`,
        phone: ""
      } : undefined);

      // Map roles helper
      const mapRole = (role: string): "Platform Administrator" | "Farm Owner" | "Accountant" | "Farm Worker" => {
        if (role === "Platform Administrator") return "Platform Administrator";
        if (role === "Administrator" || role === "Admin" || role === "Farm Owner" || role === "Owner") return "Farm Owner";
        if (role === "Accountant") return "Accountant";
        return "Farm Worker";
      };

      // Map team members from parsed users list
      const mappedTeamMembers: UserMember[] = (parsed.users || []).map((u: any) => ({
        id: u.id || `M-${Date.now()}-${Math.random()}`,
        name: u.fullname || u.username || "Team Member",
        email: u.email || `${(u.username || "user").toLowerCase()}@localhost.zm`,
        role: mapRole(u.role),
        lastActive: u.lastActive || "Just now"
      }));

      // Normalize suppliers list
      const mappedSuppliers: any[] = parsed.suppliers || parsed.supplier || [];

      // Normalize customers list
      const mappedCustomers: any[] = parsed.customers || parsed.customer || [];

      // Map and normalize crops list
      const rawCrops = parsed.cropCycles || parsed.crops || parsed.crop || [];
      const mappedCrops: CropCycle[] = rawCrops.map((c: any) => {
        if (c.cropType && c.plantingDate) {
          return c;
        }
        return {
          id: c.id || `crop-${Date.now()}-${Math.random()}`,
          cropType: c.crop || "French Beans",
          plantingDate: c.plantDate || "2026-01-01",
          expectedHarvestDate: c.harvestDate || "2026-04-01",
          fieldBlock: c.batchName || "Block A",
          areaHectares: c.area ? Number((Number(c.area) / 10000).toFixed(3)) : 0.5,
          expectedYieldKg: Number(c.expectedYield) || 1200,
          actualYieldKg: c.status === "Harvested" ? Number(c.expectedYield) : 0,
          status: c.status === "Planned" ? "Planning" : (c.status === "Harvested" ? "Harvested" : "Active"),
          milestones: [],
          expensesLinked: 0,
          revenueLinked: 0,
          farmId: "farm-1"
        };
      });

      // Map and normalize expenses list
      const rawExpenses = parsed.expenses || parsed.expense || parsed.expenseTransactions || [];
      const mappedExpenses: ExpenseTransaction[] = rawExpenses.map((ex: any) => {
        if (ex.rows && ex.rows.length > 0) {
          return ex;
        }
        const mappedSupplier = mappedSuppliers.find((s: any) => s.name === ex.supplier) || { id: "S-default", name: ex.supplier || "Cash/General Supplier" };
        return {
          id: ex.id || `EXP-${Date.now()}-${Math.random()}`,
          supplierId: mappedSupplier.id,
          supplierName: mappedSupplier.name,
          date: ex.date || "2026-01-01",
          taxSystem: "VAT",
          taxAmount: 0,
          subtotal: Number(ex.amount) || (Number(ex.qty) * Number(ex.unitPrice)) || 0,
          total: Number(ex.amount) || (Number(ex.qty) * Number(ex.unitPrice)) || 0,
          rows: [
            {
              category: ex.cat || ex.category || "General Expense",
              description: ex.desc || ex.description || "General Purchase",
              quantity: Number(ex.qty) || 1,
              unitPrice: Number(ex.unitPrice) || Number(ex.amount) || 0,
              amount: Number(ex.amount) || 0,
              coaCode: "5000"
            }
          ],
          farmId: "farm-1"
        };
      });

      // Map and normalize invoices list
      const rawInvoices = parsed.invoices || parsed.invoice || [];
      const mappedInvoices: Invoice[] = rawInvoices.map((inv: any) => {
        let cleanStatus: "Unpaid" | "Paid" | "Overdue" = "Unpaid";
        if (inv.status === "Paid") {
          cleanStatus = "Paid";
        } else if (inv.status === "Overdue") {
          cleanStatus = "Overdue";
        }

        const mappedLines = (inv.lines || []).map((line: any) => ({
          description: line.description || line.desc || "Item Details",
          quantity: Number(line.quantity || line.qty) || 1,
          unitPrice: Number(line.unitPrice || line.price) || 0,
          amount: Number(line.amount) || 0
        }));

        return {
          id: inv.id || `INV-${Date.now()}-${Math.random()}`,
          invoiceNumber: inv.invoiceNumber || inv.invNo || `INV-2026-001`,
          date: inv.date || "2026-01-01",
          dueDate: inv.dueDate || "2026-02-01",
          customerName: inv.customerName || inv.customer || "General Customer",
          customerTpin: inv.customerTpin || undefined,
          taxAmount: Number(inv.taxAmount || inv.vatAmt) || 0,
          subtotal: Number(inv.subtotal) || 0,
          total: Number(inv.total) || 0,
          lines: mappedLines,
          status: cleanStatus,
          coaDebit: inv.coaDebit || "1100",
          coaCredit: inv.coaCredit || "4100",
          farmId: inv.farmId || "farm-1",
          paidAmount: Number(inv.paidAmount || inv.amountPaid || inv.paid) || 0
        };
      });

      // Map other revenues to cashSales
      const rawSales = parsed.sales || parsed.cashSales || parsed.cashSale || [];
      const mappedCashSales: CashSale[] = rawSales.map((s: any) => {
        let pm: "Cash" | "Mobile Money" | "Bank Transfer" = "Cash";
        if (s.payMethod === "Mobile Money") pm = "Mobile Money";
        else if (s.payMethod === "Bank Transfer") pm = "Bank Transfer";

        return {
          id: s.id || `CS-${Date.now()}-${Math.random()}`,
          date: s.date || "2026-01-01",
          description: s.description || s.product || `Sale of produce`,
          customer: s.customer || "Walk-in Customer",
          amount: Number(s.amount) || Number(s.qty) * Number(s.unitPrice) || 0,
          paymentMethod: pm,
          coaDebit: s.coaDebit || "1010",
          coaCredit: s.coaCredit || "4000",
          farmId: "farm-1"
        };
      });

      // Map goats to livestock
      const mappedGoats: LivestockRecord[] = (parsed.goats || []).map((g: any) => ({
        id: g.id || `goat-${Date.now()}-${Math.random()}`,
        type: "Goats",
        species: "Goat",
        breed: g.breed || "Indigenous/Local",
        tagId: g.tag || "Tag",
        dateAcquired: g.buyDate || g.dob || "2025-01-01",
        purchasePrice: Number(g.price) || 0,
        currentValue: Number(g.price) || 800,
        healthEvents: (parsed.vaccinations || [])
          .filter((v: any) => v.goatTag && g.tag && g.tag.includes(v.goatTag))
          .map((v: any) => ({
            date: v.date,
            type: v.name || "Vaccination",
            details: v.notes || "Administered",
            cost: 0
          })),
        feedingLogs: [],
        farmId: "farm-1"
      }));

      // Merge standard livestock records + mapped goats
      const rawLivestock = parsed.livestock || parsed.livestockRecord || [];
      const filteredRawLivestock: LivestockRecord[] = rawLivestock
        .filter((l: any) => l.type !== "Chicken" && l.type !== "Duck" && l.type !== "Poultry")
        .map((l: any) => ({
          id: l.id || `live-${Date.now()}-${Math.random()}`,
          type: l.type || "Other",
          species: l.species || l.type || "Other",
          breed: l.breed || "Indigenous",
          tagId: l.tagId || `TAG-${l.id}`,
          dateAcquired: l.dateAcquired || l.date || "2026-04-19",
          purchasePrice: Number(l.purchasePrice) || 0,
          currentValue: Number(l.currentValue) || Number(l.qty) * 200 || 500,
          healthEvents: l.healthEvents || [],
          feedingLogs: l.feedingLogs || [],
          farmId: "farm-1"
        }));

      const finalLivestock = [...mappedGoats, ...filteredRawLivestock];

      // Map Chicken/Duck to standard poultry
      const mappedPoultry: PoultryBatch[] = (parsed.livestock || [])
        .filter((l: any) => l.type === "Chicken" || l.type === "Duck" || l.type === "Poultry")
        .map((l: any) => ({
          id: l.id || `poultry-${Date.now()}-${Math.random()}`,
          batchId: l.type === "Chicken" ? "CHI-2026-001" : "DUK-2026-001",
          batchName: `${l.type} - Spring Batch`,
          birdType: l.type === "Chicken" ? "Layers (Eggs)" : "Ducks",
          breed: "Indigenous",
          quantity: Number(l.qty) || 5,
          currentCount: Number(l.qty) || 5,
          sourceSupplier: "Local Breeder",
          arrivalDate: l.date || "2026-04-19",
          assignedShed: "Shed A",
          status: "Active",
          eggCollections: [],
          feedLogs: [],
          mortalityLogs: l.notes && l.notes.includes("mortalities") 
            ? [{ date: l.date, count: 8, cause: l.notes }] 
            : [],
          farmId: "farm-1"
        }));

      // Generate a Tilapia Fish Batch from fishUpdates and fishFeedings
      const rawFishFeedings = parsed.fishFeedings || [];
      const rawFishUpdates = parsed.fishUpdates || [];
      const hasFishLogs = rawFishFeedings.length > 0 || rawFishUpdates.length > 0;
      
      const mappedFish: FishBatch[] = parsed.fish || parsed.fishBatch || (hasFishLogs ? [{
        id: "fish-1",
        batchId: "FB-2026-01",
        species: "Tilapia",
        strain: "Abbassa",
        productionSystem: "Tank",
        pondName: "Main Breeding Tank",
        stockingQuantity: 90,
        currentFishCount: 75,
        averageWeightStockingG: 10,
        targetMarketWeightG: 450,
        expectedHarvestDate: "2026-10-31",
        status: "Stocked",
        feedLogs: rawFishFeedings.map((f: any) => ({
          date: f.date,
          quantityKg: Number(f.qty) || 0.1,
          cost: Number(f.qty) * 20,
          fedBy: f.by || "Supervisor",
          brand: f.type || "Floating"
        })),
        weightSamplings: [],
        waterReadings: [],
        mortalityLogs: rawFishUpdates
          .filter((u: any) => u.reason === "Death")
          .map((u: any) => ({
            date: u.date,
            count: Number(u.qty) || 0,
            cause: u.notes || "Anoxia/Oxygen drop"
          })),
        harvests: [],
        sales: [],
        waterInterventions: [],
        medications: [],
        farmId: "farm-1"
      }] : []);

      // Parse and normalize ledger accounts balance
      const rawCOA = parsed.chartOfAccounts || parsed.accounts || [];
      let mappedAccounts: Account[] = [];

      if (rawCOA && rawCOA.length > 3) {
        mappedAccounts = rawCOA.map((a: any) => ({
          code: a.code,
          name: a.name,
          category: a.category,
          balance: Number(a.balance) || 0
        }));
      } else {
        mappedAccounts = INITIAL_ACCOUNTS.map((a: any) => ({
          ...a,
          balance: 0
        }));
      }

      // Flexible matching mapping
      const normalized: BackupData = {
        farms: parsed.farms || parsed.farm || [{
          id: "farm-1",
          name: "My Production Farm",
          tpin: "1002345678",
          vatNumber: "ZM-123",
          address: "Stand No 10, Great East Road, Lusaka",
          phone: "+260977112233",
          email: "manager@localhost.zm",
          financialYearStart: "2026-01-01",
          financialYearEnd: "2026-12-31",
          currency: "ZMW",
          taxSystem: "VAT"
        }],
        accounts: mappedAccounts,
        suppliers: mappedSuppliers,
        customers: mappedCustomers,
        expenses: mappedExpenses,
        invoices: mappedInvoices,
        quotations: parsed.quotations || parsed.quotation || [],
        crops: mappedCrops,
        employees: parsed.employees || parsed.employee || [],
        payslips: parsed.payslips || parsed.payslip || [],
        poultry: parsed.poultry || parsed.poultryBatch || mappedPoultry,
        fish: mappedFish,
        inventory: parsed.inventory || parsed.inventoryItem || parsed.inventoryItems || [],
        cashSales: mappedCashSales,
        loans: parsed.loans || parsed.loan || [],
        investments: parsed.investments || parsed.investment || [],
        livestock: finalLivestock,
        credits: parsed.credits !== undefined ? Number(parsed.credits) : 300,
        userProfile: parsedProfile,
        teamMembers: mappedTeamMembers,
        assets: parsed.assets || [],
        otherRevenues: parsed.otherRevenues || [],
        leaveRecords: parsed.leaveRecords || [],
        advances: parsed.advances || [],
        inventoryMovements: parsed.inventoryMovements || [],
        auditLogs: parsed.auditLogs || [],
        archivedRecords: parsed.archivedRecords || []
      };

      setParsedPreview(normalized);
    } catch (e: any) {
      setErrorMsg(`Invalid JSON file or backup payload: ${e.message}`);
      setParsedPreview(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseAndVerify(text);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseAndVerify(text);
      };
      reader.readAsText(file);
    }
  };

  const triggerConfirmRestore = () => {
    if (!parsedPreview) return;
    onRestore(parsedPreview);
    setSuccessMsg("Restore Successful! Loaded all agricultural ledger cycles.");
    setParsedPreview(null);
    setPasteData("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans" id="backup-restore-container">
      
      {/* Title Header */}
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10">
          <Database className="w-64 h-64 text-emerald-400" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg">
              <Database className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-extrabold uppercase">Disaster Recovery & Portability</span>
          </div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">Enterprise Backup & Tenant Recovery Layer</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            Export your entire double-entry journals, crop batches, statutory configurations, and livestock rosters into a portable JSON backup payload, or restore historical backups to replace high-volume parameters cleanly.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-pulse">
          <FileCheck className="w-4 h-4 text-emerald-650" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-850 rounded-xl text-xs font-extrabold flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Export Sector */}
        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Export Current Workspace</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Save a snapshot of your currently working tenant parameters immediately in a single readable `.json` file.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border space-y-3 font-mono text-[11px]">
            <div className="flex justify-between border-b pb-1.5 text-slate-500">
              <span>Primary Farms Registered:</span>
              <span className="font-bold text-slate-800">{farms.length}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5 text-slate-500">
              <span>Active Crop Cycles:</span>
              <span className="font-bold text-slate-800">{crops.length}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5 text-slate-500">
              <span>Registered Invoices / Quotes:</span>
              <span className="font-bold text-slate-800">{invoices.length} / {quotations.length}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5 text-slate-500">
              <span>Chart of Accounts Nodes:</span>
              <span className="font-bold text-slate-800">{accounts.length}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5 text-slate-500">
              <span>Livestock & Poultry Batches:</span>
              <span className="font-bold text-slate-800">{livestock.length + poultry.length + fish.length}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Financial Cash Receipts:</span>
              <span className="font-bold text-slate-800">{cashSales.length}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadBackup}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Download Backup File</span>
            </button>
            <button
              onClick={handleCopyBackup}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
            </button>
          </div>

          {/* Clean Reset Section to comply with empty db directive */}
          <div className="pt-4 border-t border-slate-100">
            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl space-y-2">
              <h4 className="text-[11px] font-extrabold uppercase text-rose-800 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Direct Workspace Purge
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Need a completely blank, empty database structure? Overwrite the current workspace with complete empty states (0 crops, 0 invoices, 0 sales, 0 livestock, initialized only with system default chart of accounts parameters).
              </p>
              <button
                onClick={() => {
                  if (confirm("Attention: Are you sure you wish to wipe the entire database clean? This leaves the dashboard and tables completely empty.")) {
                    onClear();
                    setSuccessMsg("Success! The workspace database is now completely empty.");
                    setTimeout(() => setSuccessMsg(null), 4000);
                  }
                }}
                className="w-full py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Initialize Empty Database</span>
              </button>
            </div>
          </div>
        </div>

        {/* Import / Restore Sector */}
        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Restore or Import Backup</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Accepts and loads data from a previous file backup (.json) or directly pasted JSON string payload.</p>
          </div>

          {/* Interactive Drag Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center gap-2 ${
              dragOver ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50"
            }`}
          >
            <UploadCloud className="w-10 h-10 text-slate-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-700 block">Drag & drop your backup .json file here</span>
              <span className="text-[11px] text-slate-400">or click to browse local files</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          <div className="relative flex py-1 items-center font-semibold text-[10px] text-slate-400 uppercase">
            <div className="flex-grow border-t"></div>
            <span className="flex-shrink mx-4">or paste payload string</span>
            <div className="flex-grow border-t"></div>
          </div>

          {/* Pasting area */}
          <div className="space-y-2">
            <textarea
              placeholder='Paste backup JSON payload text here... e.g. {"farms": [], "accounts": [], "crops": []}'
              rows={4}
              value={pasteData}
              onChange={e => {
                setPasteData(e.target.value);
                if (e.target.value.trim() && e.target.value.trim().endsWith("}")) {
                  parseAndVerify(e.target.value);
                }
              }}
              className="w-full text-xs font-mono p-3 bg-slate-50 border rounded-xl outline-none focus:border-emerald-500 focus:bg-white resize-y"
            />
            {pasteData && !parsedPreview && (
              <button
                type="button"
                onClick={() => parseAndVerify(pasteData)}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-[10px]"
              >
                Validate Paste Payload
              </button>
            )}
          </div>

          {/* Backup Preview Modal / Zone */}
          {parsedPreview && (
            <div className="p-4 bg-purple-50/40 border border-purple-200/65 rounded-xl space-y-3 font-sans animate-fade-in">
              <div className="flex items-center gap-1.5 text-purple-800 font-extrabold text-[12px] uppercase">
                <FileCheck className="w-4 h-4 text-purple-700" />
                <span>Backup Payload Verified</span>
              </div>
              <p className="text-[11px] text-slate-500">
                System analyzed the file and map codes. Confirm the parameters detected below:
              </p>
              
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px] bg-white border rounded p-3">
                <div className="text-slate-500">🏢 Corporate Farms: <strong className="text-purple-700">{parsedPreview.farms.length}</strong></div>
                <div className="text-slate-500">🌿 Soil Crop Cycles: <strong className="text-purple-700">{parsedPreview.crops.length}</strong></div>
                <div className="text-slate-500">🧾 Total Invoices: <strong className="text-purple-700">{parsedPreview.invoices.length}</strong></div>
                <div className="text-slate-500">📒 Ledger Accounts: <strong className="text-purple-700">{parsedPreview.accounts.length}</strong></div>
                <div className="text-slate-500">🐖 Livestock Batches: <strong className="text-purple-700">{parsedPreview.livestock.length + parsedPreview.poultry.length + parsedPreview.fish.length}</strong></div>
                <div className="text-slate-500">💰 Sales Records: <strong className="text-purple-700">{parsedPreview.cashSales.length}</strong></div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[10.5px] leading-relaxed font-semibold flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Caution:</strong> Overwriting will completely replace your current agricultural ERP books with the snapshot parameters. Ensure you have backed up active data.
                </span>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={triggerConfirmRestore}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/10 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Execute Tenant Restore Now</span>
                </button>
                <button
                  onClick={() => setParsedPreview(null)}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-500 rounded-lg transition-all font-bold text-xs border cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
