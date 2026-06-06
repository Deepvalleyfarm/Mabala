import React, { useState } from "react";
import { ExpenseTransaction, Supplier, ExpenseRow } from "../types";
import { 
  Plus, 
  Trash, 
  Save, 
  Filter, 
  AlertTriangle, 
  Layers, 
  BookOpen, 
  Users, 
  Building2, 
  DollarSign, 
  ArrowRight,
  ClipboardList,
  Contact,
  FileSpreadsheet
} from "lucide-react";

interface ExpensesPanelProps {
  expenses: ExpenseTransaction[];
  suppliers: Supplier[];
  onAddTransaction: (tx: ExpenseTransaction) => void;
  onAddSupplier: (sup: Supplier) => void;
  isReadonly: boolean;
  currencySymbol: string;
  onGotoCsvImport?: (targetModule: "expenses" | "crops" | "livestock") => void;
}

const EXP_COA_MAP = [
  { category: "Aquafeed & Feed Purchases Expense", code: "5200" },
  { category: "Poultry Feed & Crumbles Cost", code: "5210" },
  { category: "Livestock Feed Formulation", code: "5220" },
  { category: "Veterinary, Meds & Fingerling Purchase", code: "5300" },
  { category: "Crop Seed & Seedling Acquisition", code: "5310" },
  { category: "Water Management & Liming Costs", code: "5400" },
  { category: "Aeration, Pumping & Electricity", code: "5410" },
  { category: "Direct Labour Allocation", code: "5500" },
  { category: "Pond, Cage & Infrastructure Maintenance", code: "5600" },
  { category: "Harvesting & Processing Costs", code: "5700" },
  { category: "Transport, Logistics & Cold Chain", code: "5800" },
  { category: "Pesticides, Herbicide & Fertilizer", code: "5910" },
  { category: "Tractor Fuel, Spares & Servicing", code: "5920" }
];

export default function ExpensesPanel({ 
  expenses, 
  suppliers, 
  onAddTransaction, 
  onAddSupplier, 
  isReadonly, 
  currencySymbol,
  onGotoCsvImport
}: ExpensesPanelProps) {
  const [activeTab, setActiveTab] = useState<"expenses" | "suppliers">("expenses");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  // New Trans State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxSystem, setTaxSystem] = useState<"VAT" | "Sales Tax" | "None">("VAT");
  const [rows, setRows] = useState<ExpenseRow[]>([
    { category: "Aquafeed & Feed Purchases Expense", description: "", quantity: 1, unitPrice: 0, amount: 0, coaCode: "5200" }
  ]);

  // New Supplier State
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supTpin, setSupTpin] = useState("");
  const [supCategory, setSupCategory] = useState("Feed");
  const [supNotes, setSupNotes] = useState("");

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const addRow = () => {
    setRows([...rows, { category: "Aquafeed & Feed Purchases Expense", description: "", quantity: 1, unitPrice: 0, amount: 0, coaCode: "5200" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof ExpenseRow, val: any) => {
    const updated = [...rows];
    let rowObj = { ...updated[index] };
    
    if (field === "category") {
      rowObj.category = val;
      const found = EXP_COA_MAP.find(m => m.category === val);
      rowObj.coaCode = found ? found.code : "5200";
    } else if (field === "quantity" || field === "unitPrice") {
      rowObj[field] = Number(val);
      rowObj.amount = rowObj.quantity * rowObj.unitPrice;
    } else {
      (rowObj as any)[field] = val;
    }

    updated[index] = rowObj;
    setRows(updated);
  };

  const subtotal = rows.reduce((acc, r) => acc + (r.quantity * r.unitPrice), 0);
  const taxPct = taxSystem === "VAT" ? 0.15 : taxSystem === "Sales Tax" ? 0.05 : 0;
  const taxAmount = subtotal * taxPct;
  const total = subtotal + taxAmount;

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;
    const ns: Supplier = {
      id: "SUP-" + Date.now(),
      name: supName,
      contactPerson: supContact,
      phone: supPhone,
      email: supEmail,
      address: supAddress,
      tpin: supTpin,
      category: supCategory,
      notes: supNotes
    };
    onAddSupplier( ns);
    setSelectedSupplierId(ns.id);
    setSupName("");
    setSupContact("");
    setSupPhone("");
    setSupEmail("");
    setSupAddress("");
    setSupTpin("");
    setSupNotes("");
    setShowSupplierForm(false);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert("Please select a registered supplier.");
      return;
    }
    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup) return;

    const tx: ExpenseTransaction = {
      id: "EXP-" + (100 + expenses.length + 1),
      supplierId: sup.id,
      supplierName: sup.name,
      date,
      taxSystem,
      taxAmount,
      subtotal,
      total,
      rows: rows.map(r => ({ ...r, amount: r.quantity * r.unitPrice })),
      farmId: "farm-1"
    };

    onAddTransaction(tx);
    setShowAddForm(false);
    // Reset Rows
    setRows([{ category: "Aquafeed & Feed Purchases Expense", description: "", quantity: 1, unitPrice: 0, amount: 0, coaCode: "5200" }]);
  };

  // Pagination helper
  const paginate = (items: any[]) => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  };

  return (
    <div className="space-y-6">
      {/* Tab select menu */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold border gap-1">
        <button 
          onClick={() => { setActiveTab("expenses"); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "expenses" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-705"}`}
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          <span>Expenses Ledger</span>
        </button>
        <button 
          onClick={() => { setActiveTab("suppliers"); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "suppliers" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-705"}`}
        >
          <Building2 className="w-3.5 h-3.5 text-slate-505" />
          <span>Suppliers Directory ({suppliers.length})</span>
        </button>
      </div>

      {/* Supplier Form Block Inline */}
      {showSupplierForm && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-slide-up" id="sup-form">
          <h3 className="text-xs font-black text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-1.5">
            <Contact className="w-4 h-4 text-emerald-600" />
            <span>Onboard New Supplier / Contractor</span>
          </h3>
          <form onSubmit={handleCreateSupplier} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Supplier Name *</label>
                <input type="text" value={supName} placeholder="e.g. Copperbelt Seeds Ltd" onChange={e => setSupName(e.target.value)} required className="w-full text-xs border rounded p-2 focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Contact Person</label>
                <input type="text" value={supContact} placeholder="e.g. Kelvin Mwape" onChange={e => setSupContact(e.target.value)} className="w-full text-xs border rounded p-2 focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Phone</label>
                <input type="text" value={supPhone} placeholder="e.g. +260977881122" onChange={e => setSupPhone(e.target.value)} className="w-full text-xs border rounded p-2" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Registered Tax TPIN</label>
                <input type="text" value={supTpin} onChange={e => setSupTpin(e.target.value)} className="w-full text-xs border rounded p-2 placeholder-slate-400 font-mono" placeholder="e.g. 1004312903" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Contractor Email</label>
                <input type="email" value={supEmail} placeholder="e.g. sales@copperbeltseeds.co.zm" onChange={e => setSupEmail(e.target.value)} className="w-full text-xs border rounded p-2" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Physical Address</label>
                <input type="text" value={supAddress} placeholder="e.g. Chibuluma Road, Kitwe, Zambia" onChange={e => setSupAddress(e.target.value)} className="w-full text-xs border rounded p-2" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Supply Category</label>
                <select value={supCategory} onChange={e => setSupCategory(e.target.value)} className="w-full text-xs border rounded p-2 bg-white font-semibold text-slate-700">
                  <option value="Feed">Biological Feed / Pouches</option>
                  <option value="Seeds">Crop Seeds & Inputs</option>
                  <option value="Veterinary">Veterinary Drugs & Hormones</option>
                  <option value="Infrastructure">Infrastructure Maintenance</option>
                  <option value="Logistics">Transport & Logistics</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500">Internal Remarks / Notes</label>
              <textarea value={supNotes} rows={2} onChange={e => setSupNotes(e.target.value)} placeholder="Enter brief notes about delivery rates or lead times..." className="w-full text-xs border rounded p-2 bg-slate-50 focus:bg-white" />
            </div>

            <div className="flex gap-2 justify-end text-xs font-semibold pt-2 border-t">
              <button type="button" onClick={() => setShowSupplierForm(false)} className="px-3.5 py-1.5 bg-slate-100 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-md">Conclude Supplier Onboarding</button>
            </div>
          </form>
        </div>
      )}

      {/* Main Multi-Line Record Form */}
      {showAddForm && !showSupplierForm && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Post Double-Entry Multi-Line Farm Expense</span>
            </h3>
            <button onClick={() => setShowSupplierForm(true)} className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100">+ New Supplier</button>
          </div>

          <form onSubmit={handleSaveTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-extrabold text-slate-500">Vendor / Supplier *</label>
                <select 
                  value={selectedSupplierId} 
                  onChange={e => setSelectedSupplierId(e.target.value)} 
                  required 
                  className="w-full text-xs border bg-slate-50 rounded p-2 text-slate-800 font-semibold mt-1"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider mt-1">Transaction Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full text-xs border bg-slate-50 rounded p-2" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-extrabold text-slate-500">Tax Assessment Type</label>
                <select value={taxSystem} onChange={e => setTaxSystem(e.target.value as any)} className="w-full text-xs border bg-slate-50 rounded p-2 mt-1 font-semibold text-slate-700">
                  <option value="VAT">VAT (15% standard rate)</option>
                  <option value="Sales Tax">Sales Tax (5% flat)</option>
                  <option value="None">None (Tax Exempt / Nil)</option>
                </select>
              </div>
            </div>

            {/* Dynamic ledger Rows */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Debit Transactions Lines</span>
              {rows.map((row, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <div className="col-span-3">
                    <label className="text-[9px] text-slate-500 font-mono tracking-tighter">Debit CoA Account (Auto)</label>
                    <select 
                      value={row.category} 
                      onChange={e => updateRow(index, "category", e.target.value)}
                      className="w-full text-xs border bg-white rounded p-1 font-semibold text-slate-800 mt-1"
                    >
                      {EXP_COA_MAP.map(m => (
                        <option key={m.category} value={m.category}>{m.category} (DR {m.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <label className="text-[9px] text-slate-500">Activity Specific Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Feed batch til-3, 100kgs"
                      value={row.description}
                      onChange={e => updateRow(index, "description", e.target.value)}
                      required 
                      className="w-full text-xs border bg-white rounded p-1.5 mt-1"
                    />
                  </div>
                  <div className="col-span-1.5">
                    <label className="text-[9px] text-slate-500">Qty</label>
                    <input 
                      type="number" 
                      value={row.quantity}
                      onChange={e => updateRow(index, "quantity", e.target.value)}
                      required 
                      className="w-full text-xs border bg-white rounded p-1.5 font-mono mt-1"
                    />
                  </div>
                  <div className="col-span-1.5">
                    <label className="text-[9px] text-slate-500">Unit Price ({currencySymbol})</label>
                    <input 
                      type="number" 
                      value={row.unitPrice}
                      onChange={e => updateRow(index, "unitPrice", e.target.value)}
                      required 
                      className="w-full text-xs border bg-white rounded p-1.5 font-mono mt-1"
                    />
                  </div>
                  <div className="col-span-1.5 text-right flex flex-col justify-center">
                    <span className="text-[9px] text-slate-400">Net Amount</span>
                    <span className="text-xs font-mono font-black text-slate-900 mt-2">{(row.quantity * row.unitPrice).toFixed(2)}</span>
                  </div>
                  <div className="col-span-0.5 text-center pt-2">
                    <button type="button" onClick={() => removeRow(index)} className="text-rose-500 hover:text-rose-700 font-black">
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addRow} className="px-3.5 py-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg text-xs font-bold border">+ Add Lead Line</button>

            {/* Accounting preview box */}
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center text-xs">
              <div className="text-emerald-800 leading-relaxed">
                <span className="font-extrabold block uppercase tracking-wider text-[9px]">Double-Entry Journal Generation Preview:</span>
                <p className="mt-1 font-mono text-[9px] text-slate-700">
                  Debit: {rows.map(r => `Dr ${r.coaCode} (${r.category}) - ${currencySymbol}${(r.quantity*r.unitPrice).toFixed(2)}`).join(" | ")} <br/>
                  Credit: Cr 1010 Bank - {currencySymbol}{total.toFixed(2)}
                </p>
              </div>
              <div className="text-right whitespace-nowrap font-semibold">
                <div className="text-slate-500 text-[10px]">SUBTOTAL: {currencySymbol}{subtotal.toFixed(2)}</div>
                <div className="text-slate-500 text-[10px]">VAT TAX WEIGHT: {currencySymbol}{taxAmount.toFixed(2)}</div>
                <div className="text-sm font-black text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded border border-emerald-200 mt-1">TOTAL: {currencySymbol}{total.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-100 rounded">Discard</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow-md flex items-center gap-1">
                <Save className="w-4 h-4" />
                <span>Post & Debit Ledger</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EXPENSES TAB CONTENT */}
      {activeTab === "expenses" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Continuous Expenses & Cash book Disbursals</h4>
              <p className="text-[11px] text-slate-500 leading-normal">General bookkeeping tracking double entry debit operations. Ledger maps to IAS standards.</p>
            </div>
            {!isReadonly ? (
              <div className="flex items-center gap-2">
                {onGotoCsvImport && (
                  <button
                    onClick={() => onGotoCsvImport("expenses")}
                    className="px-4 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-705 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                    <span>Import via CSV</span>
                  </button>
                )}
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post New Expense</span>
                </button>
              </div>
            ) : (
              <span className="text-xs text-rose-500 font-bold bg-rose-50 px-2.5 py-1 rounded inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Read-Only View
              </span>
            )}
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Reference ID</th>
                    <th className="p-3">Supplier / Vendor</th>
                    <th className="p-3">Collection Date</th>
                    <th className="p-3">Double Entry Postings</th>
                    <th className="p-3 text-right">Invoice Sum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {paginate(expenses).map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-700">{tx.id}</td>
                      <td className="p-3 font-bold text-slate-950">{tx.supplierName}</td>
                      <td className="p-3 text-slate-500 font-medium">{tx.date}</td>
                      <td className="p-3 leading-relaxed">
                        {tx.rows.map((r, i) => (
                          <div key={i} className="text-[10px] font-mono text-slate-600 font-semibold">
                            Dr <span className="text-slate-900 font-bold">{r.coaCode}</span> ({r.category}) — {currencySymbol}{r.amount.toFixed(2)}
                          </div>
                        ))}
                        <div className="text-[10px] font-mono text-emerald-600 border-t border-slate-100/60 pt-0.5 mt-0.5">
                          Cr <span className="font-bold">1010</span> BankOperational — {currencySymbol}{tx.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-[#0f172a]">
                        {currencySymbol} {tx.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic">No expense records posted. Click "+ Post New Expense" to create logs.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Expenses */}
            {expenses.length > 0 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">Show items:</span>
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
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded border bg-white enabled:hover:bg-slate-50 text-[11px] disabled:opacity-40 font-bold"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 bg-slate-50 rounded font-mono font-bold text-[11px] text-slate-600">
                    Page {currentPage} of {Math.ceil(expenses.length / pageSize) || 1}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(expenses.length / pageSize)))} 
                    disabled={currentPage >= Math.ceil(expenses.length / pageSize)}
                    className="px-2.5 py-1 rounded border bg-white enabled:hover:bg-slate-50 text-[11px] disabled:opacity-40 font-bold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUPPLIERS MODULE TAB CONTENT */}
      {activeTab === "suppliers" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-fade-in">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Professional Suppliers/Payees Tracker</h4>
              <p className="text-[11px] text-slate-500 leading-normal">Monitor vendor credit obligations, registered details, TPINs, and track total payouts committed in cashbooks.</p>
            </div>
            {!isReadonly ? (
              <button 
                onClick={() => setShowSupplierForm(true)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-800"
              >
                <span>+ Register Payee / Supplier</span>
              </button>
            ) : (
              <span className="text-xs text-rose-550 font-bold">Read-Only</span>
            )}
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 bg-white">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-3">Vendor Name</th>
                    <th className="p-3">TPIN No</th>
                    <th className="p-3">Product Category</th>
                    <th className="p-3">Primary Contact</th>
                    <th className="p-3">Physical Address</th>
                    <th className="p-3">Remarks / Notes</th>
                    <th className="p-3 text-right">Total Disbursed Sum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {paginate(suppliers).map(s => {
                    // Compute total disbursements paid to this supplier!
                    const matchExpenses = expenses.filter(ex => ex.supplierId === s.id);
                    const totalPaid = matchExpenses.reduce((acc, ex) => acc + ex.total, 0);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="block font-extrabold text-slate-950">{s.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono italic block">{s.id}</span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-700">{s.tpin || "N/A"}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase font-extrabold font-mono">{s.category}</span>
                        </td>
                        <td className="p-3 text-[11px] leading-relaxed">
                          <span className="block font-bold mt-0.5">{s.contactPerson}</span>
                          <span className="text-slate-400 block font-mono text-[10px]">{s.phone} {s.email && `| ${s.email}`}</span>
                        </td>
                        <td className="p-3 max-w-xs text-slate-500 truncate">{s.address || "Local Pickup Delivery"}</td>
                        <td className="p-3 max-w-xs text-slate-400 italic font-medium leading-snug">{s.notes || "-"}</td>
                        <td className="p-3 text-right font-mono font-extrabold text-rose-600">
                          {currencySymbol} {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">No registered suppliers found. Create payees inline or click "+ Register Payee" above.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Suppliers */}
            {suppliers.length > 0 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">Show items:</span>
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
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded border bg-white enabled:hover:bg-slate-50 text-[11px] disabled:opacity-40 font-bold"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 bg-slate-50 rounded font-mono font-bold text-[11px] text-slate-600">
                    Page {currentPage} of {Math.ceil(suppliers.length / pageSize) || 1}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(suppliers.length / pageSize)))} 
                    disabled={currentPage >= Math.ceil(suppliers.length / pageSize)}
                    className="px-2.5 py-1 rounded border bg-white enabled:hover:bg-slate-50 text-[11px] disabled:opacity-40 font-bold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
