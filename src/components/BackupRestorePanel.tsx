import React, { useState, useRef, useEffect } from "react";
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
  Maximize2,
  Sparkles,
  Server,
  RefreshCw,
  Globe,
  Activity
} from "lucide-react";
import backupPreset from "../data/backup.json";

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

  // Staging / Deployment Multi-env API Diagnostics States
  const [detectedApiBase, setDetectedApiBase] = useState("");
  const [overrideInput, setOverrideInput] = useState("");
  const [manualOverrideActive, setManualOverrideActive] = useState(false);
  const [testingPings, setTestingPings] = useState(false);
  const [pingResults, setPingResults] = useState<any[]>([]);

  useEffect(() => {
    // Determine active bases & settings representation on load
    try {
      const storedOverride = localStorage.getItem("mabala_api_base_override") || "";
      setOverrideInput(storedOverride);
      setManualOverrideActive(!!storedOverride);

      const storedBase = localStorage.getItem("mabala_api_base_v2") || "";
      setDetectedApiBase(storedOverride || storedBase);
    } catch (_) {}

    runHostAndGatewayPings();
  }, []);

  const runHostAndGatewayPings = async () => {
    setTestingPings(true);
    
    // Read environment variables
    let envApiBase = "";
    try {
      const env = (import.meta as any).env || {};
      envApiBase = env.VITE_API_URL || "";
      if (envApiBase.startsWith("VITE_API_URL=")) {
        envApiBase = envApiBase.slice("VITE_API_URL=".length);
      }
      envApiBase = envApiBase.replace(/^['"]|['"]$/g, "").trim();
      if (envApiBase.endsWith("/")) envApiBase = envApiBase.slice(0, -1);
    } catch (_) {}

    const hostname = window.location.hostname;

    const pool = [
      { url: envApiBase, label: "Environment VITE_API_URL Config" },
      { url: window.location.origin, label: "Static Server Origin (Default)" },
      { url: `${window.location.protocol}//${hostname}:3000`, label: "Local Express Port 3000" },
      { url: "https://api.mabala.cloud", label: "Production API Subdomain Gateway" },
      { url: "https://ais-pre-bcedzqraiumz6w3ealvfml-281687245635.europe-west2.run.app", label: "AI Studio Staging Tunnel" }
    ].filter(item => item.url) as Array<{ url: string; label: string; status?: string }>;

    // De-duplicate array
    const seen = new Set();
    const uniquePool = pool.filter(el => {
      const duplicate = seen.has(el.url);
      seen.add(el.url);
      return !duplicate;
    });

    const current = uniquePool.map(x => ({ ...x, status: "Checking" }));
    setPingResults(current);

    const updatePromises = current.map(async (candidate, index) => {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2050);
        const res = await fetch(`${candidate.url}/api/health`, { signal: controller.signal });
        clearTimeout(id);
        if (res.ok) {
          const json = await res.json();
          if (json && (json.status === "healthy" || json.status === "ok")) {
            current[index].status = "Healthy";
            return;
          }
        }
      } catch (_) {}
      current[index].status = "Failed";
    });

    await Promise.all(updatePromises);
    setPingResults([...current]);
    setTestingPings(false);
  };

  const handleSaveOverride = () => {
    try {
      const cleaned = overrideInput.trim();
      if (!cleaned) {
        handleResetOverride();
        return;
      }

      localStorage.setItem("mabala_api_base_override", cleaned);
      localStorage.setItem("mabala_api_base_v2", cleaned);
      setManualOverrideActive(true);
      setDetectedApiBase(cleaned);
      setSuccessMsg("API Gateway Override committed successfully! Applet has updated routing dynamically.");
      setTimeout(() => setSuccessMsg(null), 4000);
      runHostAndGatewayPings();
    } catch (e: any) {
      setErrorMsg(`Failed to commit override parameters: ${e.message}`);
    }
  };

  const handleResetOverride = () => {
    try {
      localStorage.removeItem("mabala_api_base_override");
      localStorage.removeItem("mabala_api_base_v2");
      setOverrideInput("");
      setManualOverrideActive(false);
      setDetectedApiBase("");
      setSuccessMsg("Custom API override cleared. Restarting automatic discovery...");
      setTimeout(() => setSuccessMsg(null), 4000);
      runHostAndGatewayPings();
    } catch (e: any) {
      setErrorMsg(`Failed to clear custom settings: ${e.message}`);
    }
  };

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
          address: "Opp Oryx Filling Station, Mumbwa Road, Lusaka West",
          phone: "+260978070734",
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

          {/* Preloaded Demo Backup Seeding Option */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-3 font-sans animate-fade-in">
            <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[12px] uppercase">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Mabala Backup Dataset Detected</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              A preloaded system backup containing all crop cycles, expenses, assets, loans, employees, advances, sales, and invoices from the attached copy has been loaded. Click below to inspect and restore this full dataset instantly.
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  parseAndVerify(JSON.stringify(backupPreset));
                } catch (e) {
                  setErrorMsg("Unable to parse pretrained backup: " + String(e));
                }
              }}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer w-full"
            >
              <Database className="w-4 h-4" />
              <span>Load Identified System Backup</span>
            </button>
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

      {/* Network API Base Configuration & Diagnostics */}
      <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4" id="api-diagnostics-sector">
        <div className="flex items-center gap-2.5 border-b pb-3.5">
          <span className="p-2 bg-indigo-55 text-indigo-600 rounded-lg shrink-0 border border-indigo-100">
            <Server className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Multi-Environment API Gateway & Payment Diagnostics</h3>
            <p className="text-[11px] text-slate-500 leading-normal font-medium mt-0.5">
              Verify communication streams with your active Node/Express Gateway to prevent 'Failed to Fetch' blocked transactions when deployed on custom providers (e.g., Hostinger, VPS, GCP).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          <div className="space-y-4">
            <h4 className="text-[11px] uppercase font-extrabold text-slate-400 tracking-wider">Live API Base Configuration</h4>
            
            <div className="space-y-2">
              <label className="text-[10.5px] text-slate-600 font-semibold block">
                Active Configured Backend URL:
              </label>
              <div className="bg-slate-50 border p-2.5 rounded-xl flex items-center justify-between font-mono text-[10.5px] text-slate-700">
                <span className="truncate pr-2">{detectedApiBase || "Relative Origin (Fallback)"}</span>
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase">
                  {detectedApiBase ? "Override Active" : "Origin-Relative"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[10.5px] font-bold text-slate-600 block">
                Manual Override Target URL (Hostinger / VPS Deployment):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., https://api.mabala.cloud"
                  value={overrideInput}
                  onChange={(e) => setOverrideInput(e.target.value)}
                  className="flex-grow text-xs font-mono p-2 border rounded-lg bg-slate-50 focus:bg-white placeholder-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveOverride}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                >
                  Save & Connect
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                Tip: If hosting the full-stack Applet on Hostinger, enter your subdomain (e.g. <code>https://api.mabala.cloud</code>) or direct port endpoint to bypass client-side discovery limits!
              </p>
            </div>

            {manualOverrideActive && (
              <button
                type="button"
                onClick={handleResetOverride}
                className="text-[10.5px] font-bold text-rose-650 hover:text-rose-700 hover:underline flex items-center gap-1.5 pt-1 cursor-pointer"
              >
                Clear Custom Override (Restore Auto-Discovery)
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2 rounded-lg">
              <h4 className="text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">Live Server Discovery Streams</h4>
              <button
                type="button"
                disabled={testingPings}
                onClick={runHostAndGatewayPings}
                className="text-[9.5px] bg-white hover:bg-slate-50 text-slate-700 font-extrabold px-2 py-1 rounded border flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${testingPings ? "animate-spin" : ""}`} />
                <span>Test & Probe Nodes</span>
              </button>
            </div>

            <div className="overflow-hidden border rounded-xl divide-y text-[10.5px]">
              {pingResults.map((candidate, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50 bg-white font-medium">
                  <div className="min-w-0 pr-2">
                    <div className="font-mono text-[10px] text-slate-700 truncate">{candidate.url}</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-0.5">{candidate.label}</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 font-bold">
                    {candidate.status === "Checking" && (
                      <span className="text-[9.5px] text-indigo-600 animate-pulse uppercase font-black">Probing...</span>
                    )}
                    {candidate.status === "Healthy" && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-black uppercase flex items-center gap-0.5">
                        ● Healthy (200 OK)
                      </span>
                    )}
                    {candidate.status === "Failed" && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[9px] font-black uppercase flex items-center gap-0.5">
                        ▲ Offline / Blocked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
