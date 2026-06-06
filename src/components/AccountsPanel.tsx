import React, { useState } from "react";
import { Account } from "../data/initialAccounts";
import { Plus, CheckCircle, Search, Sparkles } from "lucide-react";

interface AccountsPanelProps {
  accounts: Account[];
  onAddAccount: (acc: Account) => void;
  isReadonly: boolean;
  currencySymbol: string;
}

export default function AccountsPanel({ accounts, onAddAccount, isReadonly, currencySymbol }: AccountsPanelProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<"Asset" | "Liability" | "Equity" | "Revenue" | "Expense">("Expense");
  const [showAddForm, setShowAddForm] = useState(false);

  // Stats strip
  const totalAssets = accounts.filter(a => a.category === "Asset").reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.category === "Liability").reduce((s, a) => s + a.balance, 0);
  const totalRevenueYtd = accounts.filter(a => a.category === "Revenue").reduce((s, a) => s + a.balance, 0);
  const totalExpensesYtd = accounts.filter(a => a.category === "Expense").reduce((s, a) => s + a.balance, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) {
      alert("Please check your entry.");
      return;
    }
    onAddAccount({
      code: newCode,
      name: newName,
      category: newCategory,
      balance: 0
    });
    setNewCode("");
    setNewName("");
    setShowAddForm(false);
  };

  const filtered = accounts.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search);
    const matchesCategory = filterCategory === "All" || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Statistics Strip */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Ledger Assets</div>
          <div className="text-2xl font-bold mt-1 text-slate-800">{currencySymbol} {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-emerald-500 mt-2 font-medium">Auto-calculated live balance</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Liabilities</div>
          <div className="text-2xl font-bold mt-1 text-slate-800">{currencySymbol} {totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-amber-500 mt-2 font-medium">Claims against operations</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Revenue YTD</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{currencySymbol} {totalRevenueYtd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-slate-400 mt-2 font-medium">Auto-derived from Sales modules</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Expenses YTD</div>
          <div className="text-2xl font-bold mt-1 text-rose-500">{currencySymbol} {totalExpensesYtd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-slate-400 mt-2 font-medium">Multi-line expense journals</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 gap-4">
          <div>
            <h2 className="font-extrabold text-slate-800 text-sm">International Standard CoA <span className="text-[10px] text-slate-400 font-normal ml-2">IFRS Aligned Standard</span></h2>
            <p className="text-xs text-slate-500">Mabala provisions 58 pre-configured accounts directly scoped to your selected country.</p>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 text-xs font-semibold gap-1">
            {["All", "Asset", "Liability", "Equity", "Revenue", "Expense"].map(c => (
              <button 
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`px-3 py-1 rounded transition-all ${filterCategory === c ? "bg-emerald-500/10 text-emerald-700" : "text-slate-500 hover:text-slate-800"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search by code or account name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs border rounded-lg pl-9 pr-3 py-2 outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            {!isReadonly ? (
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-500 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Account</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex items-center gap-1">
                Read-Only (No credits left)
              </span>
            )}
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 grid grid-cols-4 gap-4 items-end animate-fade-in">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Account Code</label>
                <input 
                  type="text" 
                  placeholder="e.g. 5230"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  required
                  className="w-full text-xs border bg-white rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Account Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Borehole & Solar Irrigation Cost"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  className="w-full text-xs border bg-white rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Category</label>
                <select 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full text-xs border bg-white rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500"
                >
                  <option value="Asset">Asset (1xxx)</option>
                  <option value="Liability">Liability (2xxx)</option>
                  <option value="Equity">Equity (3xxx)</option>
                  <option value="Revenue">Revenue (4xxx)</option>
                  <option value="Expense">Expense (5xxx)</option>
                </select>
              </div>
              <div className="col-span-4 flex justify-end gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-emerald-600 rounded-lg text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Create Account Code
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3">CoA Code</th>
                  <th className="p-3">Account Name</th>
                  <th className="p-3">Category Group</th>
                  <th className="p-3 text-right">Computed Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map(acc => (
                  <tr key={acc.code} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-700">{acc.code}</td>
                    <td className="p-3 text-slate-900">{acc.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.category === "Asset" ? "bg-emerald-50 text-emerald-700" :
                        acc.category === "Liability" ? "bg-amber-50 text-amber-700" :
                        acc.category === "Equity" ? "bg-blue-50 text-blue-700" :
                        acc.category === "Revenue" ? "bg-indigo-50 text-indigo-700" :
                        "bg-rose-50 text-rose-700"
                      }`}>
                        {acc.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {currencySymbol} {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 italic">No account codes match the active filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
