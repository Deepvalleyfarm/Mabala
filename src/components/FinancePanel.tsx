import React, { useState } from "react";
import { useOperationalSafetyCheck } from "./BoundaryGuard";
import { Investment, Loan, OtherRevenue, Account } from "../types";
import AccountsPanel from "./AccountsPanel";
import { 
  Coins, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  TrendingUp, 
  Sparkles, 
  DollarSign, 
  RefreshCw, 
  Percent, 
  Trash2, 
  HelpCircle,
  PiggyBank
} from "lucide-react";

interface FinancePanelProps {
  investments: Investment[];
  onAddInvestment: (inv: Omit<Investment, "id" | "farmId">) => void;
  onRealizeInvestment: (id: string) => void;
  onDeleteInvestment: (id: string) => void;

  loans: Loan[];
  onAddLoan: (loan: Omit<Loan, "id" | "farmId">) => void;
  onAddLoanRepayment: (loanId: string, amount: number, paymentMethod: string, notes?: string) => void;
  onOffsetLoan: (loanId: string, otherRevenueId: string, amount: number, offsetType: string) => void;
  onDeleteLoan: (id: string) => void;

  otherRevenues: OtherRevenue[];
  onAddOtherRevenue: (rev: Omit<OtherRevenue, "id" | "farmId">) => void;
  onDeleteOtherRevenue: (id: string) => void;

  accounts: Account[];
  onAddAccount: (acc: Account) => void;
  isReadonly: boolean;
  currencySymbol: string;
}

export default function FinancePanel({
  investments,
  onAddInvestment,
  onRealizeInvestment,
  onDeleteInvestment,
  loans,
  onAddLoan,
  onAddLoanRepayment,
  onOffsetLoan,
  onDeleteLoan,
  otherRevenues,
  onAddOtherRevenue,
  onDeleteOtherRevenue,
  accounts,
  onAddAccount,
  isReadonly,
  currencySymbol
}: FinancePanelProps) {
  useOperationalSafetyCheck("FinancePanel");
  const [activeSubTab, setActiveSubTab] = useState<"investments" | "loans" | "other-revenue" | "accounts">("investments");

  // Models states
  const [showAddInv, setShowAddInv] = useState(false);
  const [invDesc, setInvDesc] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invDate, setInvDate] = useState(new Date().toISOString().substring(0, 10));
  const [invInst, setInvInst] = useState("");
  const [invType, setInvType] = useState<"Government Bond" | "Treasury Bill" | "Mutual Fund" | "Other">("Government Bond");
  const [invRate, setInvRate] = useState("");

  const [showAddLoan, setShowAddLoan] = useState(false);
  const [loanRecipient, setLoanRecipient] = useState("");
  const [loanPrincipal, setLoanPrincipal] = useState("");
  const [loanRate, setLoanRate] = useState("5");
  const [loanStart, setLoanStart] = useState(new Date().toISOString().substring(0, 10));
  const [loanEnd, setLoanEnd] = useState("");
  const [loanType, setLoanType] = useState<"Issued" | "Received">("Issued");

  const [showAddRev, setShowAddRev] = useState(false);
  const [revDesc, setRevDesc] = useState("");
  const [revAmount, setRevAmount] = useState("");
  const [revDate, setRevDate] = useState(new Date().toISOString().substring(0, 10));
  const [revSource, setRevSource] = useState("");
  const [revTypeOpt, setRevTypeOpt] = useState<"Grant" | "Shareholder Contribution" | "Other Income">("Grant");
  const [revCoaCode, setRevCoaCode] = useState("4100");

  // Offset & Repayment states
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState("Mobile Money");
  const [repayNotes, setRepayNotes] = useState("");

  const [selectedLoanForOffset, setSelectedLoanForOffset] = useState<Loan | null>(null);
  const [offsetRevenueId, setOffsetRevenueId] = useState("");
  const [offsetAmount, setOffsetAmount] = useState("");
  const [customOffsetType, setCustomOffsetType] = useState("Grant Offset");

  // Totals calculations
  const totalInvestedSum = investments.reduce((sum, inv) => sum + (inv.status === "Active" ? inv.amount : 0), 0);
  const totalMaturedSum = investments.reduce((sum, inv) => sum + (inv.status === "Matured" ? inv.amount : 0), 0);
  
  const loansIssuedActive = loans.filter(l => l.type === "Issued");
  const totalLoansIssued = loansIssuedActive.reduce((sum, l) => sum + l.principal, 0);
  const outstandingLoansIssued = loansIssuedActive.reduce((sum, l) => sum + l.outstandingBalance, 0);

  const loansReceivedActive = loans.filter(l => l.type === "Received");
  const totalLoansReceived = loansReceivedActive.reduce((sum, l) => sum + l.principal, 0);
  const outstandingLoansReceived = loansReceivedActive.reduce((sum, l) => sum + l.outstandingBalance, 0);

  const totalOtherRevenue = otherRevenues.reduce((sum, r) => sum + r.amount, 0);

  // Handlers
  const handleAddInvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invDesc || !invAmount || !invInst) {
      alert("Please fill all required fields.");
      return;
    }
    onAddInvestment({
      description: invDesc,
      amount: Number(invAmount),
      date: invDate,
      institution: invInst,
      investmentType: invType as Investment["investmentType"],
      rate: Number(invRate) || 0,
      status: "Active"
    });
    setInvDesc("");
    setInvAmount("");
    setInvInst("");
    setInvRate("");
    setShowAddInv(false);
  };

  const handleAddLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanRecipient || !loanPrincipal || !loanStart || !loanEnd) {
      alert("Please check all inputs, including start and end dates.");
      return;
    }
    onAddLoan({
      recipient: loanRecipient,
      principal: Number(loanPrincipal),
      interestRate: Number(loanRate),
      startDate: loanStart,
      endDate: loanEnd,
      outstandingBalance: Number(loanPrincipal),
      type: loanType
    });
    setLoanRecipient("");
    setLoanPrincipal("");
    setLoanRate("5");
    setLoanEnd("");
    setShowAddLoan(false);
  };

  const handleAddRevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revDesc || !revAmount || !revSource) {
      alert("Please complete description, amount, and source.");
      return;
    }
    onAddOtherRevenue({
      description: revDesc,
      amount: Number(revAmount),
      date: revDate,
      source: revSource,
      revenueType: revTypeOpt,
      coaCode: revCoaCode
    });
    setRevDesc("");
    setRevAmount("");
    setRevSource("");
    setShowAddRev(false);
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForRepay || !repayAmount) return;
    onAddLoanRepayment(selectedLoanForRepay.id, Number(repayAmount), repayMethod, repayNotes);
    setRepayAmount("");
    setRepayNotes("");
    setSelectedLoanForRepay(null);
  };

  const handleOffsetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForOffset || !offsetAmount) return;
    onOffsetLoan(
      selectedLoanForOffset.id,
      offsetRevenueId || "custom", // can be custom or specific otherRevenue ID
      Number(offsetAmount),
      customOffsetType
    );
    setOffsetAmount("");
    setOffsetRevenueId("");
    setSelectedLoanForOffset(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner and Navigation */}
      <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-500" />
            Finance & Investments Hub
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage Government bonds, corporate investments, grants, other non-crop revenue streams and loans with double-entry ledgers.
          </p>
        </div>
        <div className="flex bg-slate-100 border p-1 rounded-lg text-xs font-semibold self-start md:self-auto shrink-0 flex-wrap gap-1 md:gap-0">
          <button
            onClick={() => setActiveSubTab("investments")}
            className={`px-3 py-1.5 rounded-md transition-all ${activeSubTab === "investments" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Investments Registry
          </button>
          <button
            onClick={() => setActiveSubTab("other-revenue")}
            className={`px-3 py-1.5 rounded-md transition-all ${activeSubTab === "other-revenue" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Non-Crop Revenue
          </button>
          <button
            onClick={() => setActiveSubTab("loans")}
            className={`px-3 py-1.5 rounded-md transition-all ${activeSubTab === "loans" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Loan Ledgers
          </button>
          <button
            onClick={() => setActiveSubTab("accounts")}
            className={`px-3 py-1.5 rounded-md transition-all ${activeSubTab === "accounts" ? "bg-white text-slate-900 shadow-sm animate-pulse-subtle" : "text-slate-500 hover:text-slate-800"}`}
          >
            Chart of Accounts (CoA)
          </button>
        </div>
      </div>

      {/* SUB TAB: INVESTMENTS */}
      {activeSubTab === "investments" && (
        <div className="space-y-6">
          {/* Stats Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Total Active Principal</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{currencySymbol} {totalInvestedSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-emerald-500 font-medium mt-1">Safeguarded double-entry assets</div>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Matured/Liquidated Sum</div>
              <div className="text-2xl font-black text-slate-500 mt-1">{currencySymbol} {totalMaturedSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">Returned to cash ledger accounts</div>
            </div>
            <div className="bg-slate-900 text-white p-5 rounded-xl border shadow-sm flex flex-col justify-between">
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Total Assets Value</div>
              <div className="text-xl font-black text-emerald-400">{currencySymbol} {(totalInvestedSum + totalMaturedSum).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="text-[9px] text-slate-400 mt-2 font-mono">Ledger Node: 1600 - Invested Assets</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Bond & Security Portfolios</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Government-backed notes, long-term bonds, and mutual holdings.</p>
              </div>
              {!isReadonly && (
                <button
                  onClick={() => setShowAddInv(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Book Investment
                </button>
              )}
            </div>

            {showAddInv && (
              <form onSubmit={handleAddInvSubmit} className="p-6 bg-slate-50/50 border-b border-dashed grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Description / Security Title</label>
                  <input
                    type="text"
                    required
                    value={invDesc}
                    onChange={e => setInvDesc(e.target.value)}
                    placeholder="e.g. GRZ 5-Year Bond No. 29"
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Principal Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={invAmount}
                    onChange={e => setInvAmount(e.target.value)}
                    placeholder="15000"
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Institution / Issuer</label>
                  <input
                    type="text"
                    required
                    value={invInst}
                    onChange={e => setInvInst(e.target.value)}
                    placeholder="e.g. Bank of Zambia"
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Security Type</label>
                  <select
                    value={invType}
                    onChange={e => setInvType(e.target.value as any)}
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
                  >
                    <option value="Government Bond">Government Bond</option>
                    <option value="Treasury Bill">Treasury Bill</option>
                    <option value="Mutual Fund">Mutual Fund</option>
                    <option value="Other">Other Security</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Annual Yield Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invRate}
                    onChange={e => setInvRate(e.target.value)}
                    placeholder="12.5"
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Booking Execution Date</label>
                  <input
                    type="date"
                    required
                    value={invDate}
                    onChange={e => setInvDate(e.target.value)}
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
                  />
                </div>
                <div className="col-span-1 md:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddInv(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 rounded-lg hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white text-xs font-bold py-1.5 px-4 rounded-lg hover:bg-emerald-700"
                  >
                    Execute Purchase
                  </button>
                </div>
              </form>
            )}

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-xs bg-white text-slate-800">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-3">Reference / Code</th>
                    <th className="p-3">Portfolio Description</th>
                    <th className="p-3">Institution</th>
                    <th className="p-3 font-mono">Yield Rate</th>
                    <th className="p-3">Investment type</th>
                    <th className="p-3">Execution Date</th>
                    <th className="p-3 font-mono text-right">Value Sum</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-800">
                  {investments.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-[10px] text-slate-400">{inv.id}</td>
                      <td className="p-3">
                        <span className="block text-slate-900">{inv.description}</span>
                        <span className="text-[10px] text-slate-400 block font-normal font-mono">CoA Ledger: 1600</span>
                      </td>
                      <td className="p-3">{inv.institution}</td>
                      <td className="p-3 font-mono text-indigo-600">{inv.rate ? `${inv.rate}% p.a.` : "None"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{inv.investmentType}</span>
                      </td>
                      <td className="p-3">{inv.date}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-950">{currencySymbol} {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === "Active" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : inv.status === "Matured" 
                            ? "bg-blue-50 text-blue-700 border border-blue-200" 
                            : "bg-slate-50 text-slate-500"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                           {inv.status === "Active" && !isReadonly && (
                            <button
                              onClick={() => {
                                const triggerConfirm = (window as any).triggerGlobalConfirm;
                                if (triggerConfirm) {
                                  triggerConfirm({
                                    title: "Liquidate Investment",
                                    message: `Are you sure you want to confirm maturation and liquidation of this investment "${inv.institution}" (${inv.investmentType}) back to Cash/Bank?`,
                                    isBulk: false,
                                    onConfirm: () => onRealizeInvestment(inv.id)
                                  });
                                } else {
                                  if (window.confirm("Confirm maturation and liquidation of this investment back to Cash/Bank?")) {
                                    onRealizeInvestment(inv.id);
                                  }
                                }
                              }}
                              className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded border border-blue-200 cursor-pointer"
                            >
                              Liquidate
                            </button>
                          )}
                           {!isReadonly && (
                            <button
                              onClick={() => {
                                const triggerConfirm = (window as any).triggerGlobalConfirm;
                                if (triggerConfirm) {
                                  triggerConfirm({
                                    title: "Delete Investment Record",
                                    message: `Are you sure you want to delete investment record "${inv.institution}" of amount ${inv.amount}?`,
                                    isBulk: true,
                                    itemCount: 1,
                                    itemNames: [`${inv.institution} - ${inv.investmentType} (${inv.amount})`],
                                    onConfirm: () => onDeleteInvestment(inv.id)
                                  });
                                } else {
                                  if (window.confirm("Are you sure you want to delete this investment record? This will require confirmation.")) {
                                    onDeleteInvestment(inv.id);
                                  }
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {investments.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 italic">No investment items listed. Book an active bond, bill, or savings note to track yield portfolios.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB: OTHER REVENUE (NON-CROP INCOME & GRANTS) */}
      {activeSubTab === "other-revenue" && (
        <div className="space-y-6">
          {/* Stats Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Total Non-Crop Revenues</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{currencySymbol} {totalOtherRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-emerald-500 font-medium mt-1">Grants, shareholder equity injections & auxiliary incomes</div>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Total Grants Secured</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {currencySymbol} {otherRevenues
                  .filter(r => r.revenueType === "Grant")
                  .reduce((sum, r) => sum + r.amount, 0)
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-indigo-500 font-medium mt-1">Used to offset loans or fund operating deficits</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Revenue Stream localizer</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Record seed grants, donor aid, and non-commercial deposits directly in ledger books.</p>
              </div>
              {!isReadonly && (
                <button
                  onClick={() => setShowAddRev(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Other Income
                </button>
              )}
            </div>

            {showAddRev && (
              <form onSubmit={handleAddRevSubmit} className="p-6 bg-slate-50/50 border-b border-dashed grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Descriptor / Revenue Reference</label>
                  <input
                    type="text"
                    required
                    value={revDesc}
                    onChange={e => setRevDesc(e.target.value)}
                    placeholder="e.g. EU Agri-Grant Part A"
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Total Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={revAmount}
                    onChange={e => setRevAmount(e.target.value)}
                    placeholder="45000"
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Source / Funding Agency / Depositor</label>
                  <input
                    type="text"
                    required
                    value={revSource}
                    onChange={e => setRevSource(e.target.value)}
                    placeholder="e.g. CEEC Seed Funding"
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Revenue Stream Type</label>
                  <select
                    value={revTypeOpt}
                    onChange={e => {
                      setRevTypeOpt(e.target.value as any);
                      if (e.target.value === "Grant") setRevCoaCode("4100");
                      else if (e.target.value === "Shareholder Contribution") setRevCoaCode("3000");
                      else setRevCoaCode("4130");
                    }}
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
                  >
                    <option value="Grant">Grant / Donor Aid</option>
                    <option value="Shareholder Contribution">Shareholder Contribution</option>
                    <option value="Other Income">Other Revenue / Rental</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Credit Ledger Account</label>
                  <select
                    value={revCoaCode}
                    onChange={e => setRevCoaCode(e.target.value)}
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
                  >
                    {revTypeOpt === "Grant" && <option value="4100">4100 - Grant / Donation Income</option>}
                    {revTypeOpt === "Shareholder Contribution" && <option value="3000">3000 - Share Capital (Equity)</option>}
                    <option value="4130">4130 - Rental Income</option>
                    <option value="4030">4030 - Other Farm Revenue</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Deposit Value Date</label>
                  <input
                    type="date"
                    required
                    value={revDate}
                    onChange={e => setRevDate(e.target.value)}
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
                  />
                </div>
                <div className="col-span-1 md:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRev(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 rounded-lg hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white text-xs font-bold py-1.5 px-4 rounded-lg hover:bg-emerald-700"
                  >
                    Record Income stream
                  </button>
                </div>
              </form>
            )}

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-xs bg-white text-slate-800">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-3">Transaction ID</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Source / Benefactor</th>
                    <th className="p-3">revenue category</th>
                    <th className="p-3">Ledger Chart Account</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 font-mono text-right">Value Amount</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-800">
                  {otherRevenues.map(rev => (
                    <tr key={rev.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-[10px] text-slate-400">{rev.id}</td>
                      <td className="p-3 text-slate-900">{rev.description}</td>
                      <td className="p-3 text-slate-700">{rev.source}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rev.revenueType === "Grant" 
                            ? "bg-purple-50 text-purple-700 border border-purple-200" 
                            : rev.revenueType === "Shareholder Contribution" 
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {rev.revenueType}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {accounts.find(a => a.code === rev.coaCode)?.name || `${rev.coaCode} - Ledger Account`}
                      </td>
                      <td className="p-3 font-mono">{rev.date}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-950">{currencySymbol} {rev.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right">
                        {!isReadonly && (
                          <button
                            onClick={() => {
                              const triggerConfirm = (window as any).triggerGlobalConfirm;
                              if (triggerConfirm) {
                                triggerConfirm({
                                  title: "Delete Revenue Record",
                                  message: `Are you sure you want to delete non-crop revenue record: "${rev.description}" of amount ${rev.amount}?`,
                                  isBulk: true,
                                  itemCount: 1,
                                  itemNames: [`${rev.description} - ${rev.revenueType} (${rev.amount})`],
                                  onConfirm: () => onDeleteOtherRevenue(rev.id)
                                });
                              } else {
                                if (window.confirm("Are you sure you want to delete this non-crop revenue record? This will require confirmation.")) {
                                  onDeleteOtherRevenue(rev.id);
                                }
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {otherRevenues.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 italic">No non-crop other revenue recorded. Record EU grants, CEEC seed lines, or personal additions to start tracking in standard financial reports.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB: LOANS (ISSUED AND RECEIVED WITH OFFSET FORM) */}
      {activeSubTab === "loans" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Loans Issued (Staff/Ext)</div>
              <div className="text-xl font-black text-slate-800 mt-1">{currencySymbol} {totalLoansIssued.toLocaleString()}</div>
              <div className="text-[9px] text-slate-400 mt-2 font-mono">Ledger: 1200 - Loans Receivable</div>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Total Outstanding Receivables</div>
              <div className="text-xl font-black text-rose-500 mt-1">{currencySymbol} {outstandingLoansIssued.toLocaleString()}</div>
              <div className="text-[10.1px] text-rose-500 font-semibold mt-1">Cash owed to business</div>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Loans Received (Liabilities)</div>
              <div className="text-xl font-black text-slate-800 mt-1">{currencySymbol} {totalLoansReceived.toLocaleString()}</div>
              <div className="text-[9px] text-slate-400 mt-2 font-mono">Ledger: 2500 - Bank Loans</div>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Outstanding Payable Debt</div>
              <div className="text-xl font-black text-indigo-600 mt-1">{currencySymbol} {outstandingLoansReceived.toLocaleString()}</div>
              <div className="text-[10.1px] text-indigo-500 font-semibold mt-1">Liabilities to settle</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Loan Ledgers</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Track both Loans Issued (to workers or third parties) and Loans Received (e.g. from bank, CEEC or shareholder).</p>
              </div>
              {!isReadonly && (
                <button
                  onClick={() => setShowAddLoan(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Book New Loan
                </button>
              )}
            </div>

            {showAddLoan && (
              <form onSubmit={handleAddLoanSubmit} className="p-6 bg-slate-50/50 border-b border-dashed grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Recipient / Borrower (Staff or Institution)</label>
                  <input
                    type="text"
                    required
                    value={loanRecipient}
                    onChange={e => setLoanRecipient(e.target.value)}
                    placeholder="e.g. Patrick Imasiku (Field Worker) or Saro Ltd"
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Principal Balance ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={loanPrincipal}
                    onChange={e => setLoanPrincipal(e.target.value)}
                    placeholder="5000"
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={loanRate}
                    onChange={e => setLoanRate(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Loan Category Type</label>
                  <select
                    value={loanType}
                    onChange={e => setLoanType(e.target.value as any)}
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
                  >
                    <option value="Issued">Issued (Owed to Us - Asset)</option>
                    <option value="Received">Received (Liabilities - We Owe)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Issuance / Value date</label>
                  <input
                    type="date"
                    required
                    value={loanStart}
                    onChange={e => setLoanStart(e.target.value)}
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Repayment Due Date</label>
                  <input
                    type="date"
                    required
                    value={loanEnd}
                    onChange={e => setLoanEnd(e.target.value)}
                    className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
                  />
                </div>
                <div className="col-span-1 md:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLoan(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 rounded-lg hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white text-xs font-bold py-1.5 px-4 rounded-lg hover:bg-emerald-700"
                  >
                    Settle & Book Loan
                  </button>
                </div>
              </form>
            )}

            {/* Repayment Modal Form */}
            {selectedLoanForRepay && (
              <div className="p-6 bg-emerald-50/50 border-b border-emerald-100 flex flex-col gap-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Record Direct Cash Repayment for: {selectedLoanForRepay.recipient}</h4>
                  <button onClick={() => setSelectedLoanForRepay(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
                </div>
                <form onSubmit={handleRepaySubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Repayment Amount ({currencySymbol})</label>
                    <input
                      type="number"
                      required
                      max={selectedLoanForRepay.outstandingBalance}
                      min="1"
                      value={repayAmount}
                      onChange={e => setRepayAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Method</label>
                    <select
                      value={repayMethod}
                      onChange={e => setRepayMethod(e.target.value)}
                      className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
                    >
                      <option value="Cash">Cash Drawer</option>
                      <option value="Mobile Money">MTN / Airtel Money</option>
                      <option value="Bank Transfer">Bank Wire</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500">Remarks / Journal Notes</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={repayNotes}
                        onChange={e => setRepayNotes(e.target.value)}
                        placeholder="Log reference, cash book code"
                        className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none flex-1"
                      />
                      <button type="submit" className="bg-emerald-600 font-bold text-xs text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shrink-0">
                        Record Settle
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Offset Modal Form (Offset with Auxiliary Revenue e.g. Grants or Contributions) */}
            {selectedLoanForOffset && (
              <div className="p-6 bg-indigo-50/50 border-b border-indigo-100 flex flex-col gap-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800">Offset Loan balance with other revenues / grants: {selectedLoanForOffset.recipient}</h4>
                  <button onClick={() => setSelectedLoanForOffset(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
                </div>
                <form onSubmit={handleOffsetSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-700 font-sans">1. Source Non-Crop Revenue</label>
                    <select
                      value={offsetRevenueId}
                      required
                      onChange={e => {
                        setOffsetRevenueId(e.target.value);
                        const mathStream = otherRevenues.find(r => r.id === e.target.value);
                        if (mathStream) {
                          setOffsetAmount(Math.min(mathStream.amount, selectedLoanForOffset.outstandingBalance).toString());
                          setCustomOffsetType(`${mathStream.revenueType} Offset — ${mathStream.source}`);
                        }
                      }}
                      className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choose Registered Revenue Stream --</option>
                      {otherRevenues.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.description} ({currencySymbol}{r.amount.toLocaleString()} - {r.revenueType})
                        </option>
                      ))}
                      <option value="custom">-- Custom Shareholder Contribution / Personal Fund Expensing --</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">2. Offset Settle amount ({currencySymbol})</label>
                    <input
                      type="number"
                      required
                      max={selectedLoanForOffset.outstandingBalance}
                      min="1"
                      value={offsetAmount}
                      onChange={e => setOffsetAmount(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500">3. Offset Scheme Type description</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customOffsetType}
                        onChange={e => setCustomOffsetType(e.target.value)}
                        placeholder="e.g., EU Grant offsetting employee loan"
                        className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none flex-1"
                      />
                      <button type="submit" className="bg-indigo-600 font-bold text-xs text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shrink-0">
                        Amortize Offset
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-xs bg-white text-slate-800">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-3">Loan Ref</th>
                    <th className="p-3">Borrower / Lender</th>
                    <th className="p-3">category</th>
                    <th className="p-3 font-mono">Interest Rate</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 font-mono text-right">Principal</th>
                    <th className="p-3 font-mono text-right text-rose-600">O/S balance</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-800">
                  {loans.map(loan => (
                    <tr key={loan.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-[10px] text-slate-400">{loan.id}</td>
                      <td className="p-3">
                        <span className="block text-slate-900">{loan.recipient}</span>
                        <span className="text-[9px] text-slate-400 block font-normal font-mono">
                          {loan.type === "Issued" ? "Asset Node: 1200" : "Liability Node: 2500"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          loan.type === "Issued" 
                            ? "bg-rose-50 text-rose-700 border border-rose-100" 
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                          {loan.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-500">{loan.interestRate}% interest</td>
                      <td className="p-3 font-mono">{loan.startDate}</td>
                      <td className="p-3 font-mono">{loan.endDate}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">{currencySymbol} {loan.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={`p-3 text-right font-mono font-bold ${loan.outstandingBalance > 0 ? "text-rose-600 font-black" : "text-emerald-600"}`}>
                        {currencySymbol} {loan.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          loan.outstandingBalance === 0 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {loan.outstandingBalance === 0 ? "Fully Settled" : "Outstanding"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {loan.outstandingBalance > 0 && !isReadonly && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedLoanForRepay(loan);
                                  setSelectedLoanForOffset(null);
                                }}
                                className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded border border-emerald-200 cursor-pointer"
                              >
                                Repay Cash
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLoanForOffset(loan);
                                  setSelectedLoanForRepay(null);
                                }}
                                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded border border-indigo-200 cursor-pointer"
                              >
                                Offset / Grant
                              </button>
                            </>
                          )}
                          {!isReadonly && (
                            <button
                              onClick={() => {
                                const triggerConfirm = (window as any).triggerGlobalConfirm;
                                if (triggerConfirm) {
                                  triggerConfirm({
                                    title: "Delete Loan Record",
                                    message: `Are you sure you want to delete and soft-delete loan record: "${loan.recipient}" of amount ${loan.principal}?`,
                                    isBulk: true,
                                    itemCount: 1,
                                    itemNames: [`${loan.recipient} - ${loan.type} (${loan.principal})`],
                                    onConfirm: () => onDeleteLoan(loan.id)
                                  });
                                } else {
                                  if (window.confirm("Are you sure you want to delete this loan record permanently?")) {
                                    onDeleteLoan(loan.id);
                                  }
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {loans.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400 italic">No loan accounts on file. Log issued worker loans or received bank borrowings.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "accounts" && (
        <AccountsPanel 
          accounts={accounts}
          onAddAccount={onAddAccount}
          isReadonly={isReadonly}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
