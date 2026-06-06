import React, { useState, useEffect } from "react";
import { Employee, Payslip, EmployeeSalaryAdjustment, StatutoryPaymentMonth, LeaveRecord, EmployeeAdvance } from "../types";
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  DollarSign, 
  Settings, 
  Plus, 
  Sparkles, 
  Printer, 
  CreditCard, 
  Wallet, 
  Building2, 
  ClipboardList, 
  Coins, 
  ChevronDown, 
  ChevronRight,
  ShieldCheck,
  Calendar,
  UserCheck,
  PiggyBank,
  CheckCircle,
  FileSpreadsheet,
  Trash2,
  BookmarkPlus
} from "lucide-react";

interface PayrollPanelProps {
  employees: Employee[];
  payslips: Payslip[];
  onAddEmployee: (emp: Employee) => void;
  onRunPayroll: (slips: Payslip[]) => void;
  isReadonly: boolean;
  currencySymbol: string;
  isZambia: boolean;
  activeFarm?: {
    name: string;
    address: string;
    tpin: string;
    phone: string;
    email: string;
  };
  leaveRecords: LeaveRecord[];
  onAddLeaveRecord: (leave: Omit<LeaveRecord, "id" | "farmId">) => void;
  onDeleteLeaveRecord: (id: string) => void;
  employeeAdvances: EmployeeAdvance[];
  onAddEmployeeAdvance: (adv: Omit<EmployeeAdvance, "id" | "farmId">) => void;
  onRepayEmployeeAdvance: (id: string, amount: number) => void;
  onDeleteEmployeeAdvance: (id: string) => void;
  onDeleteEmployee?: (id: string) => void;
}

const ZAMBIAN_BANKS = [
  "Absa Bank Zambia PLC",
  "Access Bank Zambia Limited",
  "Atlas Mara Bank Zambia Limited",
  "Ecobank Zambia Limited",
  "First Alliance Bank Zambia Limited",
  "First National Bank (FNB) Zambia Limited",
  "Indo-Zambia Bank Limited",
  "Investrust Bank PLC",
  "Stanbic Bank Zambia Limited",
  "Standard Chartered Bank Zambia PLC",
  "Zambia National Commercial Bank (Zanaco) PLC"
];

export default function PayrollPanel({ 
  employees, 
  payslips, 
  onAddEmployee, 
  onRunPayroll, 
  isReadonly, 
  currencySymbol, 
  isZambia,
  activeFarm,
  leaveRecords,
  onAddLeaveRecord,
  onDeleteLeaveRecord,
  employeeAdvances,
  onAddEmployeeAdvance,
  onRepayEmployeeAdvance,
  onDeleteEmployeeAdvance,
  onDeleteEmployee
}: PayrollPanelProps) {
  // Navigation states
  const [activeTab, setActiveTab] = useState<"run" | "history" | "statutory" | "adjustments" | "leaves" | "advances">("run");
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [activeMonth, setActiveMonth] = useState("2026-05");

  // Leave Form state
  const [leaveEmployeeId, setLeaveEmployeeId] = useState("");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveType, setLeaveType] = useState<"Sick" | "Annual" | "Maternity" | "Compassionate">("Annual");
  const [leaveReason, setLeaveReason] = useState("");

  // Advances Form state
  const [advanceEmployeeId, setAdvanceEmployeeId] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().substring(0, 10));
  const [advanceNotes, setAdvanceNotes] = useState("");

  // Advance repayment helper
  const [repayingAdvanceId, setRepayingAdvanceId] = useState<string | null>(null);
  const [repayAmt, setRepayAmt] = useState("");

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // New Employee Form States
  const [name, setName] = useState("");
  const [role, setRole] = useState("Field Operator");
  const [contractRate, setContractRate] = useState<number>(4500);
  const [housingAllowance, setHousingAllowance] = useState<number>(500);
  const [transportAllowance, setTransportAllowance] = useState<number>(300);
  const [otherAllowance, setOtherAllowance] = useState<number>(200);
  const [napsaNumber, setNapsaNumber] = useState("");
  const [nhimaNumber, setNhimaNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<Employee["paymentMethod"]>("MTN MoMo");
  const [bankName, setBankName] = useState(ZAMBIAN_BANKS[0]);
  const [bankAccount, setBankAccount] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [walletNumber, setWalletNumber] = useState("");

  // Live Auto gross salary calculation for the form
  const computedGrossSalary = contractRate + housingAllowance + transportAllowance + otherAllowance;

  // Selection states for payroll (Pre-select active employees)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  
  // Custom adjustments for the *current* pending run
  const [adjustments, setAdjustments] = useState<{
    [empId: string]: {
      basic: number;
      housing: number;
      transport: number;
      other: number;
      reason: string;
    }
  }>({});

  // Active adjustment screen modal or target
  const [editingAdjustmentEmpId, setEditingAdjustmentEmpId] = useState<string | null>(null);
  const [tempBasic, setTempBasic] = useState<number>(0);
  const [tempHousing, setTempHousing] = useState<number>(0);
  const [tempTransport, setTempTransport] = useState<number>(0);
  const [tempOther, setTempOther] = useState<number>(0);
  const [tempReason, setTempReason] = useState<string>("");

  // Persistent historical adjustments logged
  const [adjustmentLogs, setAdjustmentLogs] = useState<EmployeeSalaryAdjustment[]>([
    {
      id: "adj-001",
      employeeId: "E1",
      employeeName: "Benson Ng'andu",
      date: "2026-05-15",
      month: "2026-05",
      basicBefore: 8000,
      basicAfter: 8500,
      allowancesBefore: 800,
      allowancesAfter: 1000,
      reason: "Promoted to Senior supervisor following Siavonga expansion."
    }
  ]);

  // ZRA Compliance Config
  const [zraThreshold, setZraThreshold] = useState(5100); 
  const [taxRate, setTaxRate] = useState(20); 

  // Modal print layouts
  const [selectedPayslipToPrint, setSelectedPayslipToPrint] = useState<Payslip | null>(null);
  const [expandedHistoryMonth, setExpandedHistoryMonth] = useState<string | null>(null);

  // Sync selected employees when the list of employees updates
  useEffect(() => {
    setSelectedEmployeeIds(employees.filter(e => e.status === "Active").map(e => e.id));
  }, [employees]);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || contractRate <= 0) return;

    const newWorker: Employee = {
      id: "EMP-" + (employees.length + 101),
      name,
      role,
      contractRate,
      housingAllowance,
      transportAllowance,
      otherAllowance,
      grossSalary: computedGrossSalary,
      napsaNumber: napsaNumber || undefined,
      nhimaNumber: nhimaNumber || undefined,
      paymentMethod,
      bankName: paymentMethod === "Bank Transfer" ? bankName : undefined,
      bankAccount: paymentMethod === "Bank Transfer" ? bankAccount : undefined,
      bankBranch: paymentMethod === "Bank Transfer" ? bankBranch : undefined,
      walletNumber: paymentMethod !== "Bank Transfer" ? walletNumber : undefined,
      country: isZambia ? "ZM" : "Generic",
      status: "Active"
    };

    onAddEmployee(newWorker);
    
    // Reset Form
    setName("");
    setRole("Field Operator");
    setContractRate(4500);
    setHousingAllowance(500);
    setTransportAllowance(300);
    setOtherAllowance(200);
    setNapsaNumber("");
    setNhimaNumber("");
    setBankAccount("");
    setBankBranch("");
    setWalletNumber("");
    setShowAddWorker(false);
  };

  // Open adjustment dialog for worker
  const openAdjustmentModal = (emp: Employee) => {
    const cached = adjustments[emp.id] || {
      basic: emp.contractRate,
      housing: emp.housingAllowance || 0,
      transport: emp.transportAllowance || 0,
      other: emp.otherAllowance || 0,
      reason: ""
    };
    setEditingAdjustmentEmpId(emp.id);
    setTempBasic(cached.basic);
    setTempHousing(cached.housing);
    setTempTransport(cached.transport);
    setTempOther(cached.other);
    setTempReason(cached.reason);
  };

  // Save current dynamic adjustment
  const saveAdjustment = () => {
    if (!editingAdjustmentEmpId) return;
    const emp = employees.find(e => e.id === editingAdjustmentEmpId);
    if (!emp) return;

    setAdjustments(prev => ({
      ...prev,
      [editingAdjustmentEmpId]: {
        basic: tempBasic,
        housing: tempHousing,
        transport: tempTransport,
        other: tempOther,
        reason: tempReason || "Monthly manual adjustment run modification."
      }
    }));

    // If actual rates changed, log it publicly
    const originalBasic = emp.contractRate;
    const originalAll = (emp.housingAllowance || 0) + (emp.transportAllowance || 0) + (emp.otherAllowance || 0);
    const newAll = tempHousing + tempTransport + tempOther;

    if (originalBasic !== tempBasic || originalAll !== newAll) {
      const newLog: EmployeeSalaryAdjustment = {
        id: "adj-" + Date.now().toString().slice(-4),
        employeeId: emp.id,
        employeeName: emp.name,
        date: new Date().toISOString().split("T")[0],
        month: activeMonth,
        basicBefore: originalBasic,
        basicAfter: tempBasic,
        allowancesBefore: originalAll,
        allowancesAfter: newAll,
        reason: tempReason || "Direct payslip manual override."
      };
      setAdjustmentLogs(prev => [newLog, ...prev]);
    }

    setEditingAdjustmentEmpId(null);
  };

  // Compute calculated payslips for selection
  const calculatedSlips: Payslip[] = employees
    .filter(emp => selectedEmployeeIds.includes(emp.id))
    .map(emp => {
      // Pick adjusted rates if present, otherwise default to worker static contract rules
      const adjusted = adjustments[emp.id];
      const basic = adjusted ? adjusted.basic : emp.contractRate;
      const hAll = adjusted ? adjusted.housing : (emp.housingAllowance || 0);
      const tAll = adjusted ? adjusted.transport : (emp.transportAllowance || 0);
      const oAll = adjusted ? adjusted.other : (emp.otherAllowance || 0);
      
      const gross = basic + hAll + tAll + oAll;
      
      let paye = 0;
      let napsaEmp = 0;
      let napsaGov = 0;
      let nhimaEmp = 0;
      let nhimaGov = 0;
      let wcfGov = 0;
      let skillsGov = 0;

      if (isZambia) {
        // Zambia statutory bands (calculated on Gross or Basic)
        // Usually, PAYE is based on taxable gross salary
        if (gross > zraThreshold) {
          paye = (gross - zraThreshold) * (taxRate / 100);
        }
        // NAPSA Pension: 5% employee, 5% employer of Gross
        napsaEmp = gross * 0.05;
        napsaGov = gross * 0.05;
        // NHIMA Health scheme: 1% employee, 1% employer
        nhimaEmp = gross * 0.01;
        nhimaGov = gross * 0.01;
        // Workers Compensation (WCF): 1% employer only
        wcfGov = gross * 0.01;
        // Skills Levy: 0.5% employer only
        skillsGov = gross * 0.005;
      } else {
        // Generic International Standard - Flat rate representation
        paye = gross * 0.10; // flat 10%
        napsaEmp = gross * 0.05; // flat 5% pension
        napsaGov = gross * 0.05;
      }

      const netPay = gross - paye - napsaEmp - nhimaEmp;

      return {
        id: `PAY-${emp.id}-${activeMonth}`,
        employeeId: emp.id,
        employeeName: emp.name,
        month: activeMonth,
        basicSalary: basic,
        housingAllowance: hAll,
        transportAllowance: tAll,
        otherAllowance: oAll,
        grossSalary: gross,
        paye,
        napsaEmployee: napsaEmp,
        napsaEmployer: napsaGov,
        nhimaEmployee: nhimaEmp,
        nhimaEmployer: nhimaGov,
        wcfEmployer: wcfGov,
        skillsLevyEmployer: skillsGov,
        netPay,
        adjustmentReason: adjusted ? adjusted.reason : undefined,
        paymentMethod: emp.paymentMethod,
        walletNumber: emp.walletNumber,
        bankName: emp.bankName,
        bankAccount: emp.bankAccount,
        bankBranch: emp.bankBranch
      };
    });

  const handleToggleSelectEmployee = (id: string) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const activeWorkers = employees.filter(e => e.status === "Active");
    if (selectedEmployeeIds.length === activeWorkers.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(activeWorkers.map(w => w.id));
    }
  };

  const executePayrollRun = () => {
    if (isReadonly) {
      alert("Credits finished or write access denied. Run is blocked.");
      return;
    }
    if (calculatedSlips.length === 0) {
      alert("No active workers selected. Select at least 1 employee.");
      return;
    }

    onRunPayroll(calculatedSlips);
    // Clear the active adjustments for the next cycle
    setAdjustments({});
    alert(`Successfully processed payroll for ${calculatedSlips.length} employees for ${activeMonth}! Generated Double-entry statutory general ledger entries.`);
  };

  // Group posted historical payslips by month
  const postedMonths = Array.from(new Set(payslips.map(p => p.month))).sort((a,b) => b.localeCompare(a));

  // Statutory summary calculations month-by-month
  const statutorySummaries = Array.from(new Set(payslips.map(p => p.month))).map(month => {
    const slipsForMonth = payslips.filter(p => p.month === month);
    const napsaEE = slipsForMonth.reduce((acc, p) => acc + p.napsaEmployee, 0);
    const napsaER = slipsForMonth.reduce((acc, p) => acc + p.napsaEmployer, 0);
    const nhimaEE = slipsForMonth.reduce((acc, p) => acc + p.nhimaEmployee, 0);
    const nhimaER = slipsForMonth.reduce((acc, p) => acc + p.nhimaEmployer, 0);
    const payeTotal = slipsForMonth.reduce((acc, p) => acc + p.paye, 0);
    const wcfTotal = slipsForMonth.reduce((acc, p) => acc + (p.wcfEmployer || 0), 0);
    const skillsTotal = slipsForMonth.reduce((acc, p) => acc + (p.skillsLevyEmployer || 0), 0);

    return {
      month,
      napsa: napsaEE + napsaER,
      nhima: nhimaEE + nhimaER,
      paye: payeTotal,
      wcf: wcfTotal,
      skills: skillsTotal,
      total: napsaEE + napsaER + nhimaEE + nhimaER + payeTotal + wcfTotal + skillsTotal
    };
  });

  const generateMockCSV = (title: string, data: any[]) => {
    alert("Exporting " + title + " to CSV format... Local download initiated successfully.");
  };

  const triggerPDFPrint = (elementId: string) => {
    window.print();
  };

  // General Simple Table Pagination logic
  const paginate = (items: any[]) => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  };

  return (
    <div className="space-y-6" id="payroll-workspace-root">
      {/* Tab Menu Header */}
      <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex-wrap gap-4">
        <div className="flex gap-2 bg-slate-100 p-0.5 rounded-lg text-xs font-bold border flex-wrap">
          <button 
            onClick={() => setActiveTab("run")} 
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeTab === "run" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Process Payroll</span>
          </button>
          <button 
            onClick={() => { setActiveTab("history"); setCurrentPage(1); }} 
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeTab === "history" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Payroll History</span>
          </button>
          <button 
            onClick={() => { setActiveTab("statutory"); setCurrentPage(1); }} 
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeTab === "statutory" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Statutory Remittance</span>
          </button>
          <button 
            onClick={() => { setActiveTab("adjustments"); setCurrentPage(1); }} 
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeTab === "adjustments" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Staff Adjustments ({adjustmentLogs.length})</span>
          </button>
          <button 
            onClick={() => { setActiveTab("leaves"); setCurrentPage(1); }} 
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeTab === "leaves" ? "bg-white text-slate-900 shadow-xs text-indigo-500 font-extrabold" : "text-slate-505 hover:text-slate-700"}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Leave Tracker ({leaveRecords.length})</span>
          </button>
          <button 
            onClick={() => { setActiveTab("advances"); setCurrentPage(1); }} 
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeTab === "advances" ? "bg-white text-slate-900 shadow-xs text-emerald-500 font-extrabold" : "text-slate-505 hover:text-slate-700"}`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Advances Register ({employeeAdvances.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isReadonly && activeTab === "run" && (
            <button 
              onClick={() => setShowAddWorker(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition-all shadow-sm"
            >
              + Register Employee Contract
            </button>
          )}
        </div>
      </div>

      {/* Configuration tax bands bar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#f8fafc]">Compliance Configurator</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            {isZambia 
              ? "Zambia Tax Authority Cap 331 PAYE bands and NAPSA pension contribution rates activated." 
              : "Generic African country default flat deductions configured (10% PAYE, 5% Pension)."}
          </p>
        </div>
        
        {isZambia && (
          <div className="flex gap-4 items-center">
            <div className="text-xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">ZRA Threshold</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-slate-400 text-[10px] font-mono">ZK</span>
                <input 
                  type="number" 
                  value={zraThreshold} 
                  onChange={e => setZraThreshold(Number(e.target.value))}
                  className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-bold font-mono text-emerald-400 text-xs" 
                />
              </div>
            </div>
            <div className="text-xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">PAYE Tier Rate</span>
              <div className="flex items-center gap-1 mt-0.5">
                <input 
                  type="number" 
                  value={taxRate} 
                  onChange={e => setTaxRate(Number(e.target.value))}
                  className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-bold font-mono text-emerald-400 text-xs" 
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Worker Form Modal-In-Place */}
      {showAddWorker && (
        <form onSubmit={handleCreateEmployee} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fade-in" id="add-employee-form">
          <div className="flex justify-between items-center border-b pb-3">
            <h4 className="text-xs uppercase font-extrabold text-slate-800 tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Register Worker Contract & Direct Allowances</span>
            </h4>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full text-[10px] font-mono">STEP 1</span>
          </div>

          {/* Form grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500">Employee Full Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Kondwani Mwape" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                className="w-full text-xs border bg-slate-50 rounded p-2 focus:bg-white outline-emerald-500 mt-1" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500">Farm Role / Designation *</label>
              <input 
                type="text" 
                placeholder="e.g. Broiler Section In-charge" 
                value={role} 
                onChange={e => setRole(e.target.value)} 
                required 
                className="w-full text-xs border bg-slate-50 rounded p-2 focus:bg-white outline-emerald-500 mt-1" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500">Basic Monthly Pay ({currencySymbol}) *</label>
              <input 
                type="number" 
                value={contractRate} 
                onChange={e => setContractRate(Number(e.target.value))} 
                required 
                className="w-full text-xs border bg-slate-50 rounded p-2 focus:bg-white outline-emerald-500 mt-1 font-mono" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500">NHIMA Health Number</label>
              <input 
                type="text" 
                placeholder="e.g. NHI89100234" 
                value={nhimaNumber} 
                onChange={e => setNhimaNumber(e.target.value)} 
                className="w-full text-xs border bg-slate-50 rounded p-2 focus:bg-white outline-emerald-500 mt-1 font-mono" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500">Housing Allowance ({currencySymbol})</label>
              <input 
                type="number" 
                value={housingAllowance} 
                onChange={e => setHousingAllowance(Number(e.target.value))} 
                className="w-full text-xs border bg-slate-50 rounded p-2 focus:bg-white outline-emerald-500 mt-1 font-mono" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500">Transport Allowance ({currencySymbol})</label>
              <input 
                type="number" 
                value={transportAllowance} 
                onChange={e => setTransportAllowance(Number(e.target.value))} 
                className="w-full text-xs border bg-slate-50 rounded p-2 focus:bg-white outline-emerald-500 mt-1 font-mono" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500">Other Custom Allowance ({currencySymbol})</label>
              <input 
                type="number" 
                value={otherAllowance} 
                onChange={e => setOtherAllowance(Number(e.target.value))} 
                className="w-full text-xs border bg-slate-50 rounded p-2 focus:bg-white outline-emerald-500 mt-1 font-mono" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500">NAPSA Pension Account Number</label>
              <input 
                type="text" 
                placeholder="e.g. NP4409184" 
                value={napsaNumber} 
                onChange={e => setNapsaNumber(e.target.value)} 
                className="w-full text-xs border bg-slate-50 rounded p-2 focus:bg-white outline-emerald-500 mt-1 font-mono" 
              />
            </div>
          </div>

          {/* Payment execution configuration */}
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-4">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-widest">Employee Cash Out / Disbursement Route</span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-extrabold text-slate-500">Salary payment method</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value as Employee["paymentMethod"])}
                  className="w-full text-xs border bg-white rounded p-2 mt-1 font-semibold"
                >
                  <option value="MTN MoMo">MTN Mobile Money Wallet</option>
                  <option value="Airtel Money">Airtel Mobile Money Wallet</option>
                  <option value="Zamtel Money">Zamtel Mobile Money Wallet</option>
                  <option value="JabuPay">JabuPay Wallet Account</option>
                  <option value="Other Wallets">Other Alternative Wallets</option>
                  <option value="Bank Transfer">Commercial Bank Transfer</option>
                </select>
              </div>

              {paymentMethod === "Bank Transfer" ? (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-extrabold text-slate-500">Commercial Bank Name</label>
                    <select 
                      value={bankName} 
                      onChange={e => setBankName(e.target.value)}
                      className="w-full text-xs border bg-white rounded p-2 mt-1 font-semibold"
                    >
                      {ZAMBIAN_BANKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-extrabold text-slate-500">Account Number & Branch</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required 
                        placeholder="10098712349" 
                        value={bankAccount} 
                        onChange={e => setBankAccount(e.target.value)} 
                        className="flex-1 text-xs border bg-white rounded p-2 mt-1 font-mono" 
                      />
                      <input 
                        type="text" 
                        required 
                        placeholder="Nchanga Branch" 
                        value={bankBranch} 
                        onChange={e => setBankBranch(e.target.value)} 
                        className="w-1/3 text-xs border bg-white rounded p-2 mt-1 font-mono" 
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-[10px] uppercase font-extrabold text-slate-500">Wallet Account Number (Numeric Option Only) *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 0977881122" 
                    value={walletNumber} 
                    onChange={e => {
                      // Only allow numbers
                      const clean = e.target.value.replace(/\D/g, "");
                      setWalletNumber(clean);
                    }} 
                    className="w-full text-xs border bg-white rounded p-2 mt-1 font-semibold font-mono" 
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-600">Dynamic Live Contract Pro-forma Gross Salary Summary:</span>
            <div className="font-mono font-extrabold text-emerald-800 text-sm">
              Basic ({currencySymbol} {contractRate.toLocaleString()}) + Allowances ({currencySymbol} {(housingAllowance + transportAllowance + otherAllowance).toLocaleString()}) = <span className="underline">{currencySymbol} {computedGrossSalary.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" onClick={() => setShowAddWorker(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md">Register Active Contract</button>
          </div>
        </form>
      )}

      {/* PROCESS TAB CONTENT */}
      {activeTab === "run" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Configure Current Staff Run</h4>
                <p className="text-[11px] text-slate-500 leading-normal">Exclude specific workers, adjust salary, or update allowances on demand prior to committing calculation sheets.</p>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <label className="text-[9px] uppercase font-mono font-bold text-slate-400 block mb-1">Target Month</label>
                  <input 
                    type="month" 
                    value={activeMonth} 
                    onChange={e => setActiveMonth(e.target.value)} 
                    className="text-xs border rounded-lg px-2.5 py-1 text-slate-700 bg-white font-bold" 
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-mono font-bold text-slate-400 block mb-1">Execution controls</label>
                  <button 
                    onClick={executePayrollRun}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-lg shadow-md cursor-pointer transition-all"
                  >
                    Post Monthly Payroll Run
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-center w-12">
                        <input 
                          type="checkbox" 
                          checked={selectedEmployeeIds.length === employees.filter(e => e.status === "Active").length && employees.filter(e => e.status === "Active").length > 0} 
                          onChange={handleSelectAll}
                          className="w-3.5 h-3.5 accent-emerald-600"
                        />
                      </th>
                      <th className="p-3">Staff Member</th>
                      <th className="p-3">Payment details</th>
                      <th className="p-3">Allowances</th>
                      <th className="p-3">Deductions</th>
                      <th className="p-3 text-right">Computed Net Cash</th>
                      <th className="p-3 text-center">Adjust Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {paginate(employees.filter(e => e.status === "Active")).map(emp => {
                      const isIncluded = selectedEmployeeIds.includes(emp.id);
                      
                      // Find if there is an active calculation sheet
                      const slip = calculatedSlips.find(s => s.employeeId === emp.id);
                      const hasAdjusted = !!adjustments[emp.id];

                      return (
                        <tr key={emp.id} className={`hover:bg-slate-50/50 ${!isIncluded ? "opacity-50 select-none bg-slate-50/20" : ""}`}>
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={isIncluded} 
                              onChange={() => handleToggleSelectEmployee(emp.id)}
                              className="w-3.5 h-3.5 accent-emerald-600"
                            />
                          </td>
                          <td className="p-3">
                            <span className="block font-bold text-slate-950">{emp.name}</span>
                            <span className="text-[10px] text-slate-400 italic block">{emp.role} {hasAdjusted && <span className="text-amber-500 font-bold ml-1">★ Adjusted</span>}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-mono text-slate-500 block">{emp.paymentMethod}</span>
                            <span className="text-[9px] text-slate-400 block font-mono">
                              {emp.paymentMethod === "Bank Transfer" ? `${emp.bankName} - ${emp.bankAccount}` : emp.walletNumber}
                            </span>
                          </td>
                          <td className="p-3 text-[10px] leading-relaxed">
                            {slip ? (
                              <div className="font-medium text-slate-600">
                                <div>Basic: <span className="font-mono font-bold text-slate-800">{currencySymbol}{slip.basicSalary}</span></div>
                                <div>All allowances: <span className="font-mono font-bold text-slate-800">{currencySymbol}{(slip.housingAllowance + slip.transportAllowance + slip.otherAllowance)}</span></div>
                                <div className="text-[9px] text-[#22c55e]">Gross: <span className="font-mono font-bold">{currencySymbol}{slip.grossSalary}</span></div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Excluded</span>
                            )}
                          </td>
                          <td className="p-3 text-[10px]">
                            {slip ? (
                              <div className="font-semibold text-rose-500">
                                <div>PAYE Tax: <span className="font-mono">{currencySymbol}{slip.paye.toFixed(2)}</span></div>
                                <div>NAPSA Pension: <span className="font-mono">{currencySymbol}{slip.napsaEmployee.toFixed(2)}</span></div>
                                {isZambia && <div>NHIMA: <span className="font-mono">{currencySymbol}{slip.nhimaEmployee.toFixed(2)}</span></div>}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Excluded</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-extrabold text-emerald-600">
                            {slip ? `${currencySymbol} ${slip.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={!isIncluded}
                                onClick={() => openAdjustmentModal(emp)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg border cursor-pointer disabled:opacity-30"
                              >
                                Edit / Override
                              </button>
                              {!isReadonly && onDeleteEmployee && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const triggerConfirm = (window as any).triggerGlobalConfirm;
                                    if (triggerConfirm) {
                                      triggerConfirm({
                                        title: "Delete Employee Record",
                                        message: `Are you sure you want to delete and soft-delete employee "${emp.name}" to the dynamic compliance archive?`,
                                        isBulk: true,
                                        itemCount: 1,
                                        itemNames: [`${emp.name} (${emp.role})`],
                                        onConfirm: () => onDeleteEmployee(emp.id)
                                      });
                                    } else {
                                      if (window.confirm(`Are you sure you want to delete and soft-delete employee ${emp.name} to the dynamic compliance archive?`)) {
                                        onDeleteEmployee(emp.id);
                                      }
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Delete Employee"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 italic">No registered farm employees. Register workers using the contract generator above.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Table Pagination details */}
              {employees.length > 0 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[11px]">Show rows per page:</span>
                    <select 
                      value={pageSize} 
                      onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                      className="border rounded p-1 text-xs font-semibold bg-white"
                    >
                      <option value={10}>10 items</option>
                      <option value={50}>50 items</option>
                      <option value={100}>100 items</option>
                    </select>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 rounded border bg-white enabled:hover:bg-slate-50 text-[11px] font-bold disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded font-bold font-mono text-[11px]">
                      Page {currentPage} of {Math.ceil(employees.filter(e => e.status === "Active").length / pageSize) || 1}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(employees.filter(e => e.status === "Active").length / pageSize)))} 
                      disabled={currentPage >= Math.ceil(employees.filter(e => e.status === "Active").length / pageSize)}
                      className="px-2.5 py-1 rounded border bg-white enabled:hover:bg-slate-50 text-[11px] font-bold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-emerald-50 text-emerald-800 border-t flex items-center justify-between text-xs font-mono">
              <span>
                → Continuous Postings: Debits Dr 5100 Wages & Salaries | Credits Cr 1010 Bank + Cr 2020/2030 (Accruals)
              </span>
              <span className="font-bold">IFRS COMPLIANT</span>
            </div>
          </div>
        </div>
      )}

      {/* OVERRIDE ADJUSTMENT DIALOG */}
      {editingAdjustmentEmpId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-scale-up">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest pb-2 border-b">Override Staff Payslip Rate</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Make temporary adjustments to basic salary or allowances for this run. System will automatically log changes and require an adjustment comment.
            </p>

            <div className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Basic Salary Override ({currencySymbol})</label>
                <input 
                  type="number" 
                  value={tempBasic} 
                  onChange={e => setTempBasic(Number(e.target.value))} 
                  className="w-full text-xs mt-1 p-2 border rounded font-mono" 
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500">Housing</label>
                  <input 
                    type="number" 
                    value={tempHousing} 
                    onChange={e => setTempHousing(Number(e.target.value))} 
                    className="w-full text-xs mt-1 p-1.5 border font-mono" 
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500">Transport</label>
                  <input 
                    type="number" 
                    value={tempTransport} 
                    onChange={e => setTempTransport(Number(e.target.value))} 
                    className="w-full text-xs mt-1 p-1.5 border font-mono" 
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500">Other</label>
                  <input 
                    type="number" 
                    value={tempOther} 
                    onChange={e => setTempOther(Number(e.target.value))} 
                    className="w-full text-xs mt-1 p-1.5 border font-mono" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Required Comment / Override Reason</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Added dry season overtime bonus"
                  value={tempReason} 
                  onChange={e => setTempReason(e.target.value)} 
                  className="w-full text-xs mt-1 p-2 border rounded" 
                />
              </div>

              {/* Gross sum */}
              <div className="p-3 bg-indigo-50 text-indigo-800 border-indigo-100 rounded-xl text-xs flex justify-between">
                <span>NEW COMPUTED GROSS:</span>
                <span className="font-mono font-bold">{currencySymbol} {(tempBasic + tempHousing + tempTransport + tempOther).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4 text-xs font-semibold">
              <button onClick={() => setEditingAdjustmentEmpId(null)} className="px-4 py-2 bg-slate-100 rounded">Cancel</button>
              <button onClick={saveAdjustment} className="px-5 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500">Apply Overrides</button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TAB CONTENT */}
      {activeTab === "history" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b pb-4 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Historical Monthly Payroll Summary Sheets</h4>
              <p className="text-[11px] text-slate-500">Browse fully finalized payroll sheets grouped by month. Export PDF reports or print custom letterhead slips.</p>
            </div>
            <button 
              onClick={() => generateMockCSV("Payroll History", payslips)}
              className="px-3 py-1.5 border rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm bg-white"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Export History CSV</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 space-y-4">
            {postedMonths.map(month => {
              const slipsForMonth = payslips.filter(p => p.month === month);
              const isMonthExpanded = expandedHistoryMonth === month;
              const totalMonthGross = slipsForMonth.reduce((acc, p) => acc + p.grossSalary, 0);
              const totalMonthNet = slipsForMonth.reduce((acc, p) => acc + p.netPay, 0);

              return (
                <div key={month} className="pt-4 first:pt-0 space-y-3">
                  <div 
                    onClick={() => setExpandedHistoryMonth(isMonthExpanded ? null : month)}
                    className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 cursor-pointer hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {isMonthExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      <div>
                        <span className="font-extrabold text-[#0f172a] text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span>{month} Summary sheet</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{slipsForMonth.length} Staff payslips committed.</span>
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs font-mono font-bold text-slate-800">
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 block font-sans">Total Gross</span>
                        <span>{currencySymbol} {totalMonthGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 block font-sans">Net Disbursed</span>
                        <span className="text-emerald-600">{currencySymbol} {totalMonthNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {isMonthExpanded && (
                    <div className="pl-6 pr-2 py-2 space-y-3 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide font-mono">Month Payslip itemization</span>
                        <button 
                          onClick={() => triggerPDFPrint(`history-sheet-${month}`)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[10px] flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Full Monthly Sheet</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto border rounded-xl">
                        <table className="w-full text-left text-xs bg-white text-slate-800">
                          <thead className="text-[9px] uppercase font-bold text-slate-400 bg-slate-50">
                            <tr>
                              <th className="p-2.5">Staff</th>
                              <th className="p-2.5">Method</th>
                              <th className="p-2.5">Basic Pay</th>
                              <th className="p-2.5">Allowances</th>
                              <th className="p-2.5 text-rose-500">Deductions</th>
                              <th className="p-2.5">Net Cash</th>
                              <th className="p-2.5 text-center">Print Slip</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y font-semibold text-slate-800">
                            {slipsForMonth.map(slip => (
                              <tr key={slip.id} className="hover:bg-slate-50/40">
                                <td className="p-2.5">
                                  <span className="block font-bold text-slate-900">{slip.employeeName}</span>
                                  <span className="text-[9px] text-slate-400 block">{slip.id}</span>
                                </td>
                                <td className="p-2.5 font-mono text-[10px] text-slate-500">
                                  {slip.paymentMethod}
                                </td>
                                <td className="p-2.5 font-mono">{currencySymbol} {slip.basicSalary.toLocaleString()}</td>
                                <td className="p-2.5 font-mono text-slate-600">
                                  {currencySymbol} {(slip.housingAllowance + slip.transportAllowance + slip.otherAllowance).toLocaleString()}
                                </td>
                                <td className="p-2.5 font-mono text-rose-500">
                                  {currencySymbol} {(slip.paye + slip.napsaEmployee + slip.nhimaEmployee).toFixed(2)}
                                </td>
                                <td className="p-2.5 font-mono text-emerald-600 font-extrabold">
                                  {currencySymbol} {slip.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    onClick={() => setSelectedPayslipToPrint(slip)}
                                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                                    title="Print on Farm Letterhead"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {payslips.length === 0 && (
              <div className="text-center p-12 italic text-slate-400 text-xs">No payroll history committed. Post a monthly run to build audited history pools.</div>
            )}
          </div>
        </div>
      )}

      {/* STATUTORY REMITTANCE TRACKING */}
      {activeTab === "statutory" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b pb-4 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Statutory Pension & Tax Obligations Tracking</h4>
              <p className="text-[11px] text-slate-500">Remittance compliance audit ledger tracking employer match weights and active deposits liabilities.</p>
            </div>
            
            <button 
              onClick={() => generateMockCSV("Statutory Tracking", payslips)}
              className="px-3 py-1.5 text-xs font-bold border rounded-lg bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Compliance Audit Pool</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 bg-white">
              <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                <tr>
                  <th className="p-3">Obli. Month</th>
                  <th className="p-3 text-right">{isZambia ? "ZRA PAYE Tax" : "Government tax"}</th>
                  <th className="p-3 text-right">{isZambia ? "NAPSA Pension Oblig" : "Pension funds"}</th>
                  {isZambia && <th className="p-3 text-right">NHIMA Health</th>}
                  {isZambia && <th className="p-3 text-right">WCF & Skills Levy</th>}
                  <th className="p-3 text-right">Compliance Liability Total</th>
                  <th className="p-3 text-center">Print Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-800">
                {statutorySummaries.map((sum, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold font-mono text-slate-900">{sum.month}</td>
                    <td className="p-3 text-right font-mono text-slate-650">{currencySymbol} {sum.paye.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-slate-650">{currencySymbol} {sum.napsa.toFixed(2)}</td>
                    {isZambia && <td className="p-3 text-right font-mono text-slate-650">{currencySymbol} {sum.nhima.toFixed(2)}</td>}
                    {isZambia && <td className="p-3 text-right font-mono text-slate-650">{currencySymbol} {(sum.wcf + sum.skills).toFixed(2)}</td>}
                    <td className="p-3 text-right font-mono text-indigo-600 font-extrabold">
                      {currencySymbol} {sum.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => triggerPDFPrint(`statutory-summary-${sum.month}`)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                        title="Print Statutory Assessment Report"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {statutorySummaries.length === 0 && (
                  <tr>
                    <td colSpan={isZambia ? 7 : 5} className="p-12 text-center text-slate-400 italic">No statutory tracking history logged. Process a payroll run first.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADJUSTMENTS VIEW */}
      {activeTab === "adjustments" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Contract Overrides & Allowances Audit Trail</span>
            </h4>
            <p className="text-[11px] text-slate-500">Audits manually adjusted contract rates, allowance additions, and justification records across workforces.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-white text-slate-800">
              <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                <tr>
                  <th className="p-3">Override Date</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3 text-right">Basic Before → After</th>
                  <th className="p-3 text-right">Allowances Before → After</th>
                  <th className="p-3">Captured Reason / Justification</th>
                  <th className="p-3 text-right">Event ID</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-800">
                {adjustmentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-slate-550 text-[10px]">{log.date}</td>
                    <td className="p-3">
                      <span className="block font-bold text-slate-900">{log.employeeName}</span>
                      <span className="text-[9px] text-slate-400 font-mono block">Month target: {log.month}</span>
                    </td>
                    <td className="p-3 text-right font-mono">
                      <span className="text-slate-400 block text-[10px]">{currencySymbol}{log.basicBefore}</span>
                      <span className="text-emerald-600 block text-xs">→ {currencySymbol}{log.basicAfter}</span>
                    </td>
                    <td className="p-3 text-right font-mono">
                      <span className="text-slate-400 block text-[10px]">{currencySymbol}{log.allowancesBefore}</span>
                      <span className="text-indigo-600 block text-xs">→ {currencySymbol}{log.allowancesAfter}</span>
                    </td>
                    <td className="p-3 max-w-xs text-slate-600 text-[11px] leading-relaxed italic">
                      "{log.reason}"
                    </td>
                    <td className="p-3 text-right font-mono text-[9px] font-extrabold text-[#7c3aed] uppercase">{log.id}</td>
                  </tr>
                ))}

                {adjustmentLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">No manual salary or allowance adjustments logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INDIVIDUAL PAYSLIP ON LETTERHEAD MODAL */}
      {selectedPayslipToPrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 border border-slate-200 text-slate-900 overflow-y-auto max-h-[90vh] font-sans">
            {/* Print Action Buttons */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6 sticky top-0 bg-white z-10">
              <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full uppercase font-mono">Audited Payslip Document representation</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => triggerPDFPrint(`letterhead-slip`)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Payslip</span>
                </button>
                <button 
                  onClick={() => setSelectedPayslipToPrint(null)} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Letterhead Paper mockup */}
            <div className="p-8 border border-slate-350 bg-white shadow-inner space-y-8 rounded-xl" id="letterhead-slip">
              {/* Header Letterhead Component */}
              <div className="flex justify-between items-start border-b-4 border-emerald-600 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center font-bold text-white text-base">M</div>
                    <span className="text-lg font-black tracking-tight text-slate-900 uppercase">
                      {activeFarm?.name || "Mabala Tenant Farms Group"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {activeFarm?.address || "HQ Plot Area 45, Lusaka, Zambia"}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    TPIN: {activeFarm?.tpin || "1009876543"} • Tel: {activeFarm?.phone || "+260 977 112233"} • Email: {activeFarm?.email || "billing@mabala.co.zm"}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-base font-black tracking-wider text-emerald-600 uppercase block font-mono">OFFICIAL PAYSLIP</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{selectedPayslipToPrint.month} Statement cycle</span>
                  <span className="text-[9px] text-[#8b5cf6] font-mono block font-bold mt-1 uppercase">Doc Ref: {selectedPayslipToPrint.id}</span>
                </div>
              </div>

              {/* Worker Information Block */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border">
                <div className="space-y-1 text-xs">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Employee Details</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedPayslipToPrint.employeeName}</div>
                  <div className="text-slate-600 font-medium">Register ID: {selectedPayslipToPrint.employeeId}</div>
                  <div className="text-slate-550 italic">{employees.find(e => e.id === selectedPayslipToPrint.employeeId)?.role || "Farm Worker Officer"}</div>
                </div>

                <div className="space-y-1 text-xs text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Salary payment Disbursed via</span>
                  <div className="font-bold text-slate-900">{selectedPayslipToPrint.paymentMethod || "Mobile Money"}</div>
                  {selectedPayslipToPrint.paymentMethod === "Bank Transfer" ? (
                    <div className="text-slate-600 font-mono text-[10px]">
                      {selectedPayslipToPrint.bankName} <br /> Acct: {selectedPayslipToPrint.bankAccount}
                    </div>
                  ) : (
                    <div className="text-slate-600 font-mono text-[10px]">
                      Mobile money Number: {selectedPayslipToPrint.walletNumber || "0977881122"}
                    </div>
                  )}
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-2 gap-8 text-xs font-semibold">
                {/* Earnings */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-widest text-[#047857] block border-b pb-1 font-extrabold">Earning weights</span>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Monthly Basic Salary:</span>
                      <span className="font-mono">{currencySymbol} {selectedPayslipToPrint.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Housing Allowance:</span>
                      <span className="font-mono">+ {currencySymbol}{selectedPayslipToPrint.housingAllowance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Transport Allowance:</span>
                      <span className="font-mono">+ {currencySymbol}{selectedPayslipToPrint.transportAllowance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Other Allowance:</span>
                      <span className="font-mono">+ {currencySymbol}{selectedPayslipToPrint.otherAllowance.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-extrabold text-slate-900 bg-slate-50 border p-2 rounded mt-4">
                    <span>GROSS SALARY:</span>
                    <span className="font-mono">{currencySymbol} {selectedPayslipToPrint.grossSalary.toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-widest text-rose-700 block border-b pb-1 font-extrabold">Remittance Deductions</span>

                  <div className="space-y-2 font-medium text-slate-600">
                    <div className="flex justify-between">
                      <span>Income Tax ({isZambia ? "ZRA PAYE" : "Flat PAYE"}):</span>
                      <span className="font-mono text-rose-500">- {currencySymbol}{selectedPayslipToPrint.paye.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pension ({isZambia ? "NAPSA EE 5%" : "EE pension 5%"}):</span>
                      <span className="font-mono text-rose-500">- {currencySymbol}{selectedPayslipToPrint.napsaEmployee.toFixed(2)}</span>
                    </div>
                    {isZambia && (
                      <div className="flex justify-between">
                        <span>Health Scheme (NHIMA EE 1%):</span>
                        <span className="font-mono text-rose-500">- {currencySymbol}{selectedPayslipToPrint.nhimaEmployee.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between font-extrabold text-rose-600 bg-slate-100/50 border p-2 rounded mt-4">
                    <span>TOTAL DEDUCT WEIGHT:</span>
                    <span className="font-mono">- {currencySymbol} {(selectedPayslipToPrint.paye + selectedPayslipToPrint.napsaEmployee + selectedPayslipToPrint.nhimaEmployee).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Employer match weights (Not deducted from worker, but paid on behalf) */}
              {isZambia && (
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed text-[10px]">
                  <span className="font-extrabold uppercase text-slate-500 tracking-wider block mb-2 text-[9px]">Employer Statutory Obligation Weights (Matched Cap)</span>
                  <div className="grid grid-cols-4 gap-2 text-slate-600 font-semibold font-mono">
                    <div>NAPSA (ER 5%): <span className="text-slate-800">{currencySymbol}{selectedPayslipToPrint.napsaEmployer.toFixed(2)}</span></div>
                    <div>NHIMA (ER 1%): <span className="text-slate-800">{currencySymbol}{selectedPayslipToPrint.nhimaEmployer.toFixed(2)}</span></div>
                    <div>WCF Liability: <span className="text-slate-800">{currencySymbol}{selectedPayslipToPrint.wcfEmployer.toFixed(2)}</span></div>
                    <div>Skills levy (0.5%): <span className="text-slate-800">{currencySymbol}{selectedPayslipToPrint.skillsLevyEmployer.toFixed(2)}</span></div>
                  </div>
                </div>
              )}

              {/* Net disbursed and signatures */}
              <div className="pt-6 border-t font-sans flex justify-between items-center bg-emerald-500/5 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">NET BANK DISBURSEMENT WEIGHT</span>
                  <span className="text-2xl font-black font-mono text-emerald-800">
                    {currencySymbol} {selectedPayslipToPrint.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold font-mono text-right">
                  <span>MABALA COMPLIANCE TOKEN</span> <br />
                  <span className="text-[#059669] font-extrabold">STATUS: PAID & AUDITED ✓</span>
                </div>
              </div>

              {selectedPayslipToPrint.adjustmentReason && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-medium text-[10px] italic">
                  "* System logged adjustment comment: '{selectedPayslipToPrint.adjustmentReason}'"
                </div>
              )}

              {/* Print signature lines */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-xs font-semibold text-slate-500 font-sans">
                <div className="border-t border-slate-350 pt-3">
                  <span>Officer Signature: _______________________</span>
                  <p className="text-[9px] text-slate-400 mt-0.5">Authorized Finance Officer approval</p>
                </div>
                <div className="border-t border-slate-250 pt-3 text-right">
                  <span>Employee Acknowledgement: _________________</span>
                  <p className="text-[9px] text-slate-400 mt-0.5">Recv in good order & compliance standards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "leaves" && (
        <div className="space-y-6 animate-fade-in font-sans">
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="border-b pb-4 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Leave Management Calendar</h3>
                <p className="text-[11px] text-slate-500 font-medium">Record and track animal husbandry & farming workers sick leave, annual holidays, and special compassion breaks.</p>
              </div>
            </div>

            {/* Form to Book Leave */}
            {!isReadonly && (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!leaveEmployeeId || !leaveStart || !leaveEnd) {
                  alert("Worker selection, Start and End dates are mandatory.");
                  return;
                }
                const worker = employees.find(emp => emp.id === leaveEmployeeId);
                if (!worker) return;
                onAddLeaveRecord({
                  employeeId: leaveEmployeeId,
                  employeeName: worker.name,
                  startDate: leaveStart,
                  endDate: leaveEnd,
                  leaveType,
                  status: "Approved",
                  notes: leaveReason
                });
                setLeaveEmployeeId("");
                setLeaveStart("");
                setLeaveEnd("");
                setLeaveReason("");
              }} className="p-4 bg-slate-50 border rounded-lg mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Select Employee</label>
                  <select
                    value={leaveEmployeeId}
                    onChange={e => setLeaveEmployeeId(e.target.value)}
                    required
                    className="w-full text-xs p-2 border bg-white rounded focus:outline-none"
                  >
                    <option value="">-- Choose employee contract --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Leave Type category</label>
                  <select
                    value={leaveType}
                    onChange={e => setLeaveType(e.target.value as any)}
                    className="w-full text-xs p-2 border bg-white rounded focus:outline-none"
                  >
                    <option value="Annual">Annual Paid Holidays</option>
                    <option value="Sick">Sick Certificate Leave</option>
                    <option value="Maternity">Maternity break</option>
                    <option value="Compassionate">Compassionate special</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Beginning Date</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={e => setLeaveStart(e.target.value)}
                    required
                    className="w-full text-xs p-2 border bg-white rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Ending Date</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={e => setLeaveEnd(e.target.value)}
                    required
                    className="w-full text-xs p-2 border bg-white rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1 flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Brief Reason description</label>
                    <input
                      type="text"
                      value={leaveReason}
                      onChange={e => setLeaveReason(e.target.value)}
                      placeholder="e.g. Annual holiday allocation"
                      className="w-full text-xs p-2 border bg-white rounded focus:outline-none"
                    />
                  </div>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs p-2 rounded shrink-0">
                    Settle Book
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left text-xs bg-white text-slate-800">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Matched Employee</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Period Start Date</th>
                    <th className="p-3">Period End Date</th>
                    <th className="p-3">Reason remarks</th>
                    <th className="p-3">status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-800">
                  {leaveRecords.map(leave => (
                    <tr key={leave.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-[10px] text-slate-400">{leave.id}</td>
                      <td className="p-3 text-slate-900">{leave.employeeName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{leave.leaveType}</span>
                      </td>
                      <td className="p-3 font-mono">{leave.startDate}</td>
                      <td className="p-3 font-mono">{leave.endDate}</td>
                      <td className="p-3 font-normal text-slate-500">{leave.notes || "None"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200">
                          {leave.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {!isReadonly && (
                          <button
                            onClick={() => {
                              if (window.confirm("Delete this leave record?")) {
                                onDeleteLeaveRecord(leave.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaveRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 italic">No leave bookings recorded. All authorized worker holiday timelines show here.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "advances" && (
        <div className="space-y-6 animate-fade-in font-sans">
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="border-b pb-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Salary Advance register desk</h3>
              <p className="text-[11px] text-slate-500 font-medium">Record cash advances or emergency credit disbursements given to employees. Automatic deduct options apply in payslips.</p>
            </div>

            {/* Advance Book form */}
            {!isReadonly && (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!advanceEmployeeId || !advanceAmount) {
                  alert("Worker selection and Advance Principal Amount must be filled.");
                  return;
                }
                const worker = employees.find(emp => emp.id === advanceEmployeeId);
                if (!worker) return;
                onAddEmployeeAdvance({
                  employeeId: advanceEmployeeId,
                  employeeName: worker.name,
                  amount: Number(advanceAmount),
                  advanceAmount: Number(advanceAmount),
                  remainingBalance: Number(advanceAmount),
                  requestDate: advanceDate,
                  repaymentMonth: advanceDate.substring(0, 7) || "2026-06",
                  status: "Approved",
                  notes: advanceNotes
                });
                setAdvanceEmployeeId("");
                setAdvanceAmount("");
                setAdvanceNotes("");
              }} className="p-4 bg-slate-50 border rounded-lg mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Pick worker</label>
                  <select
                    value={advanceEmployeeId}
                    onChange={e => setAdvanceEmployeeId(e.target.value)}
                    required
                    className="w-full text-xs p-2 border bg-white rounded focus:outline-none"
                  >
                    <option value="">-- Choose employee contract --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Advance Principal Value ({currencySymbol})</label>
                  <input
                    type="number"
                    value={advanceAmount}
                    onChange={e => setAdvanceAmount(e.target.value)}
                    required
                    placeholder="e.g. 1500"
                    className="w-full text-xs p-2 border bg-white rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Disbursement Value Date</label>
                  <input
                    type="date"
                    value={advanceDate}
                    onChange={e => setAdvanceDate(e.target.value)}
                    required
                    className="w-full text-xs p-2 border bg-white rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1 flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Descriptive Reason notes</label>
                    <input
                      type="text"
                      value={advanceNotes}
                      onChange={e => setAdvanceNotes(e.target.value)}
                      placeholder="e.g. School fees advance"
                      className="w-full text-xs p-2 border bg-white rounded focus:outline-none"
                    />
                  </div>
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-2 rounded shrink-0">
                    Disburse Cash
                  </button>
                </div>
              </form>
            )}

            {repayingAdvanceId && (
              <div className="bg-emerald-50 border border-emerald-200 mt-4 p-4 rounded-xl flex items-center justify-between gap-4 animate-fade-in text-xs">
                <div>
                  <span className="font-bold text-emerald-800">Record Manual Settle Pay on Outstanding Salary Advance:</span>
                  <p className="text-[10px] text-slate-500">Manually cash pay back the advance balance ledger node instead of standard payroll deductions.</p>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!repayAmt) return;
                  onRepayEmployeeAdvance(repayingAdvanceId, Number(repayAmt));
                  setRepayAmt("");
                  setRepayingAdvanceId(null);
                }} className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={repayAmt}
                    required
                    onChange={e => setRepayAmt(e.target.value)}
                    placeholder="e.g. 500"
                    className="text-xs p-1.5 border bg-white rounded outline-none"
                  />
                  <button type="submit" className="bg-emerald-600 justify-center text-white text-[11px] font-bold py-1.5 px-3 rounded cursor-pointer">
                    Submit Repayment
                  </button>
                  <button type="button" onClick={() => setRepayingAdvanceId(null)} className="text-slate-500 text-xs font-semibold hover:underline">Cancel</button>
                </form>
              </div>
            )}

            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left text-xs bg-white text-slate-800">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-3">Compliance Reference</th>
                    <th className="p-3">Matched Employee</th>
                    <th className="p-3 font-mono">Disbursement Date</th>
                    <th className="p-3 font-mono text-right">Principal Amount</th>
                    <th className="p-3 font-mono text-right text-rose-500">Remaining Balance</th>
                    <th className="p-3">Internal Remarks</th>
                    <th className="p-3 text-center">Status state</th>
                    <th className="p-3 text-right font-semibold">Ledger Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-800">
                  {employeeAdvances.map(adv => (
                    <tr key={adv.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-[10px] text-slate-400">{adv.id}</td>
                      <td className="p-3 text-slate-900">{adv.employeeName}</td>
                      <td className="p-3 font-mono">{adv.requestDate}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700">
                        {currencySymbol} {adv.advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${adv.remainingBalance > 0 ? "text-rose-600 font-extrabold" : "text-emerald-650"}`}>
                        {currencySymbol} {adv.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 font-normal text-slate-500">{adv.notes || "Emergency wages pool"}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          adv.remainingBalance === 0 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                        }`}>
                          {adv.remainingBalance === 0 ? "Settled YTD" : "Due Repayment"}
                        </span>
                      </td>
                      <td className="p-3 text-right flex justify-end gap-2">
                        {adv.remainingBalance > 0 && !isReadonly && (
                          <button
                            onClick={() => {
                              setRepayingAdvanceId(adv.id);
                              setRepayAmt(adv.remainingBalance.toString());
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 px-2 py-0.5 rounded text-[10.5px] cursor-pointer"
                          >
                            Repay cash
                          </button>
                        )}
                        {!isReadonly && (
                          <button
                            onClick={() => {
                              if (window.confirm("Remove salary advance? This is a compliance purge request.")) {
                                onDeleteEmployeeAdvance(adv.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {employeeAdvances.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 italic">No salary advances recorded. Emergency short-term staff dispersals log here.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
