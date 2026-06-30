import React, { useState, useEffect } from "react";
import { 
  Coins, 
  Search, 
  Building2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  Plus, 
  RefreshCw, 
  Database, 
  Clock, 
  Tag, 
  Check, 
  AlertCircle 
} from "lucide-react";

interface LedgerEntry {
  id: string;
  institutionId: string;
  amount: number;
  type: "top_up" | "deduction" | "refund";
  reference: string;
  note?: string;
  createdAt: string;
}

interface Institution {
  id: string;
  name: string;
  smsCreditBalance?: number;
  smsRateZmw?: number;
}

export default function SmsCreditsPanel() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Selected institution metrics
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [smsRate, setSmsRate] = useState<number>(0.90);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  // Adjustment Form States
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"top_up" | "deduction" | "refund">("top_up");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const res = await fetch("/api/admin/institutions");
      const data = await res.json();
      if (data.success) {
        setInstitutions(data.institutions || []);
      }
    } catch (err) {
      console.error("Failed to fetch institutions:", err);
    }
  };

  const handleSelectInstitution = async (id: string) => {
    setSelectedInstId(id);
    setLoading(true);
    setFormMsg(null);
    try {
      const res = await fetch(`/api/admin/institutions/${id}/sms-ledger`);
      const data = await res.json();
      if (data.success) {
        setCurrentBalance(data.smsCreditBalance || 0);
        setSmsRate(data.smsRateZmw || 0.90);
        setLedger(data.ledger || []);
      }
    } catch (err) {
      console.error("Failed to load ledger info:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId) {
      setFormMsg({ type: "error", text: "Please select an institution first." });
      return;
    }
    const deltaAmount = parseFloat(amount);
    if (isNaN(deltaAmount) || deltaAmount === 0) {
      setFormMsg({ type: "error", text: "Please enter a valid non-zero amount." });
      return;
    }

    setIsSubmitting(true);
    setFormMsg(null);

    // If deduction, adjust amount to negative
    const finalAmount = type === "deduction" ? -Math.abs(deltaAmount) : Math.abs(deltaAmount);

    try {
      const res = await fetch(`/api/admin/institutions/${selectedInstId}/sms-ledger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          type,
          reference: reference || "ADMIN_MANUAL_TOPUP",
          note: note || `Manual adjustment by Super Admin`
        })
      });

      const data = await res.json();
      if (data.success) {
        setFormMsg({ type: "success", text: "Sms credits updated and ledger entry recorded successfully!" });
        setAmount("");
        setReference("");
        setNote("");
        // Refresh active details
        handleSelectInstitution(selectedInstId);
        fetchInstitutions(); // update institutions list balance too
      } else {
        setFormMsg({ type: "error", text: data.error || "Failed to submit credit adjustment" });
      }
    } catch (err: any) {
      setFormMsg({ type: "error", text: err.message || "Network error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInsts = institutions.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block mb-1 font-mono">Ledger Ledger Ledger</span>
        <h2 className="text-2xl font-black tracking-tight">Sms Credit Core & Ledger History</h2>
        <p className="text-xs text-indigo-200 mt-1 max-w-xl">
          Top up tenant credits, view live balances, and view fully audited transactional ledgers detailing sending deductions and refunds.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Col (span 1): Select Node & Info */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-500" /> Select Institution Node
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Search across cooperatives, NGOs, and corporate partners.</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type to filter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
                {filteredInsts.length === 0 ? (
                  <p className="p-3 text-[10px] text-slate-400 text-center font-bold">No matching nodes.</p>
                ) : (
                  filteredInsts.map(inst => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(inst.name);
                        handleSelectInstitution(inst.id);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold transition-all flex items-center justify-between ${
                        selectedInstId === inst.id ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate font-black">{inst.name}</p>
                        <p className="text-[9px] text-slate-400 font-semibold font-mono truncate">ID: {inst.id}</p>
                      </div>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black flex-shrink-0">
                        {(inst.smsCreditBalance || 0).toLocaleString()} cr
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Wallet Balance Widget */}
          {selectedInstId && (
            <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider font-mono">Selected Balance</span>
                <Coins className="w-5 h-5 text-indigo-600" />
              </div>

              <div className="space-y-1">
                <h4 className="text-3xl font-black text-indigo-950 font-mono">
                  {currentBalance.toLocaleString()}
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Available SMS Credits</p>
              </div>

              <div className="border-t border-indigo-100 pt-3 flex justify-between text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Node Price Rate</span>
                  <span className="font-mono font-black text-slate-700">ZMW {smsRate.toFixed(2)} / msg</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Ledger Status</span>
                  <span className="font-semibold text-emerald-600 font-mono">Synced</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center/Right Col (span 2): Transaction adjustments and ledger lists */}
        <div className="xl:col-span-2 space-y-6">
          {selectedInstId ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form Col: Adjustment Inputs */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 md:col-span-1">
                <div>
                  <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-wider">
                    Adjust Balance
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Adjust pool credits.</p>
                </div>

                {formMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-1.5 ${
                    formMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-rose-50 text-rose-800 border-rose-100"
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-bold">{formMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitAdjustment} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Transaction Type</label>
                    <select
                      value={type}
                      onChange={(e: any) => setType(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                    >
                      <option value="top_up">Top Up (Positive)</option>
                      <option value="deduction">Deduction (Negative)</option>
                      <option value="refund">Refund / Credit adjustment</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Credit Amount (integer)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Audit / Pay Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. BANK-REF-9921"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Internal Audit Note</label>
                    <textarea
                      rows={2}
                      placeholder="Optional notes..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Enforce Adjustment
                  </button>
                </form>
              </div>

              {/* Table Col: Ledger Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-indigo-500" /> Transactional Ledger Logs
                  </h3>
                  <button
                    onClick={() => handleSelectInstitution(selectedInstId)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                    title="Reload ledger feed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20 max-h-[500px] overflow-y-auto">
                  {ledger.length === 0 ? (
                    <div className="text-center py-24 text-slate-400 space-y-2">
                      <FileText className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-bold font-mono">No ledger entries registered.</p>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto">All top-ups, deductions, and manually logged changes appear here immediately.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {ledger.map((entry) => (
                        <div key={entry.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                                entry.type === "top_up" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                entry.type === "refund" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>
                                {entry.type}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 font-semibold">{entry.reference}</span>
                            </div>

                            {entry.note && (
                              <p className="text-xs text-slate-700 font-semibold">{entry.note}</p>
                            )}

                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span className="font-mono">{new Date(entry.createdAt).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-sm font-mono font-black px-2.5 py-1 rounded-xl flex items-center gap-0.5 ${
                              entry.amount > 0 ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-amber-700 bg-amber-50 border border-amber-100"
                            }`}>
                              {entry.amount > 0 ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <ArrowDownLeft className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              {entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center text-slate-400 space-y-3">
              <Building2 className="w-12 h-12 mx-auto text-slate-300" />
              <h4 className="text-sm font-black text-slate-700">No active node selection</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Please search and select a cooperative, NGO, or commercial sponsor in the sidebar menu to process manual top ups and view its historic ledger feed.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
