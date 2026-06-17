import React, { useState } from "react";
import { 
  CreditCard, Smartphone, ShieldCheck, DollarSign, ArrowUpRight, ArrowUpDown, Filter, 
  Send, RefreshCw, Layers, Sparkles, Check, AlertCircle, Bookmark, ClipboardList, Printer
} from "lucide-react";
import { VetWalletTx, VetTenant } from "./types";
import { CREDIT_BUNDLES, CreditBundle } from "./data";

interface BillingTabProps {
  tenant: VetTenant;
  transactions: VetWalletTx[];
  credits: number;
  onPurchaseCredits: (bundle: CreditBundle, paymentMethod: VetWalletTx["paymentPlatform"]) => void;
  onModifySubscriptionPlan: (newPlan: VetTenant["subscriptionPlan"]) => void;
  onDownloadBillingReceipt: (tx: VetWalletTx) => void;
  currencySymbol: string;
}

export default function BillingTab({
  tenant,
  transactions,
  credits,
  onPurchaseCredits,
  onModifySubscriptionPlan,
  onDownloadBillingReceipt,
  currencySymbol
}: BillingTabProps) {
  
  const [activePlan, setActivePlan] = useState<VetTenant["subscriptionPlan"]>(tenant.subscriptionPlan);
  const [selectedBundle, setSelectedBundle] = useState<CreditBundle | null>(null);
  const [paymentGatewayOpen, setPaymentGatewayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<VetWalletTx["paymentPlatform"]>("MTN MoMo");
  const [phoneNumberIn, setPhoneNumberIn] = useState("");
  const [formError, setFormError] = useState("");

  const handleOpenGateway = (bundle: CreditBundle) => {
    setSelectedBundle(bundle);
    setPhoneNumberIn("");
    setFormError("");
    setPaymentGatewayOpen(true);
  };

  const handleApproveRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBundle) return;

    if ((payMethod === "MTN MoMo" || payMethod === "Airtel Money" || payMethod === "Zamtel Kwacha") && !phoneNumberIn) {
      setFormError("Please enter your mobile phone number for the network USSD challenge.");
      return;
    }

    onPurchaseCredits(selectedBundle, payMethod);
    setPaymentGatewayOpen(false);
    setSelectedBundle(null);
  };

  const upgradeSubscription = (plan: VetTenant["subscriptionPlan"], zCost: number) => {
    if (confirm(`Are you sure you want to change your Subscription Plan to: ${plan}? This will register a debit journal entry of K${zCost} in the Chart of Accounts.`)) {
      onModifySubscriptionPlan(plan);
      setActivePlan(plan);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Overview Line */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="billing-wallet-summary">
        {/* Available credits */}
        <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest block leading-none pb-1">Available balance</span>
            <span className="text-3xl font-extrabold font-mono tracking-tight text-white block">{credits} Credits</span>
            <span className="text-xs text-slate-400 block pt-1 leading-snug">Continuous automatic credit pool deduction is active on performance tracking records.</span>
          </div>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Multi-Branch pool: Shared</span>
            <span>Ref: MFA-NODE-COA</span>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block leading-none pb-1">Subscription Plan</span>
            <span className="text-2xl font-bold text-slate-800 block">{tenant.subscriptionPlan} Package Plan</span>
            <p className="text-xs text-slate-500 leading-snug pt-1">
              Currently enjoying standard unrestricted permissions across all 14 clinical CRM laboratory pharmacy modules.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
            <span>Next Invoice cycle: Monthly Recurring</span>
          </div>
        </div>

        {/* Integrated Chart of accounts postings */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-6 border border-indigo-150 flex flex-col justify-between gap-4">
          <div>
            <div className="flex gap-1.5 items-center">
              <span className="p-1 bg-indigo-500/10 text-indigo-700 rounded-lg"><ShieldCheck className="w-5 h-5" /></span>
              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Mabala Chart of Accounts Integration</h5>
            </div>
            <p className="text-xs text-slate-600 pt-1 leading-snug font-medium">
              All transactions automatically trigger double-entry audit journals posting straight into the revenue controls framework!
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400 block pb-1">Node: Acc 4100 - Vet Sales Revenue</span>
        </div>
      </div>

      {/* Subscription Plans Choice */}
      <div className="space-y-4" id="subscription-tiers-models">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Veterinary Commercial Subscription Plans</h4>
          <p className="text-xs text-slate-500">Configure or toggle corporate, NGO, or district-level framework allocations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Monthly plan */}
          <div className={`p-5 rounded-2xl border ${tenant.subscriptionPlan === "Monthly" ? "border-emerald-500 bg-emerald-500/5" : "border-slate-200 bg-white"} relative flex flex-col justify-between gap-4`}>
            <div>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-mono font-bold">ZIMBABWE/ZAMBIA STAND.</span>
              <h5 className="font-bold text-slate-800 text-xs pt-1">Monthly Clinic Tier</h5>
              <div className="font-mono pt-2">
                <span className="font-extrabold text-lg text-slate-800">K1,000</span>
                <span className="text-[10px] text-slate-400"> / Month</span>
              </div>
              <p className="text-[10px] text-slate-500 pt-2 leading-relaxed">Includes 500 recurring credits per month for standard outpatient clinics. Double entry COA matched.</p>
            </div>
            <button 
              onClick={() => upgradeSubscription("Monthly", 1000)}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg transition"
            >
              {tenant.subscriptionPlan === "Monthly" ? "Active Plan" : "Choose Plan"}
            </button>
          </div>

          {/* Annual plan */}
          <div className={`p-5 rounded-2xl border ${tenant.subscriptionPlan === "Annual" ? "border-emerald-500 bg-emerald-500/5" : "border-slate-200 bg-white"} relative flex flex-col justify-between gap-4`}>
            <div>
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-mono font-bold">16% DISCOUNT INCLUDED</span>
              <h5 className="font-bold text-slate-800 text-xs pt-1">Annual Pro Tier</h5>
              <div className="font-mono pt-2">
                <span className="font-extrabold text-lg text-slate-800">K12,000</span>
                <span className="text-[10px] text-slate-400"> / Year</span>
              </div>
              <p className="text-[10px] text-slate-500 pt-2 leading-relaxed">Includes 6,000 credits upfront. Perfect for medium multi-branch livestock consultant firms.</p>
            </div>
            <button 
              onClick={() => upgradeSubscription("Annual", 12000)}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg transition"
            >
              {tenant.subscriptionPlan === "Annual" ? "Active Plan" : "Choose Plan"}
            </button>
          </div>

          {/* Enterprise Vet Groups */}
          <div className={`p-5 rounded-2xl border ${tenant.subscriptionPlan === "Enterprise" ? "border-emerald-500 bg-emerald-500/5" : "border-slate-200 bg-white"} relative flex flex-col justify-between gap-4`}>
            <div>
              <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[9px] font-mono font-bold uppercase">Multi branch Networks</span>
              <h5 className="font-bold text-slate-800 text-xs pt-1">Corporate Vet Chain</h5>
              <div className="font-mono pt-2">
                <span className="font-extrabold text-lg text-slate-800">Custom Rate</span>
                <span className="text-[10px] text-slate-400"> Contract</span>
              </div>
              <p className="text-[10px] text-slate-500 pt-2 leading-relaxed">Unlimited users, shared laboratory processing rosters, consolidated financial accounts logs.</p>
            </div>
            <button 
              onClick={() => upgradeSubscription("Enterprise", 25000)}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg transition"
            >
              {tenant.subscriptionPlan === "Enterprise" ? "Active Plan" : "Contact Sales for SLA"}
            </button>
          </div>

          {/* Government departments */}
          <div className={`p-5 rounded-2xl border ${tenant.subscriptionPlan === "Government" ? "border-emerald-500 bg-emerald-500/5" : "border-slate-200 bg-white"} relative flex flex-col justify-between gap-4`}>
            <div>
              <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 rounded text-[9px] font-mono font-bold uppercase">District Epidemiology</span>
              <h5 className="font-bold text-slate-800 text-xs pt-1">District / Province Gov</h5>
              <div className="font-mono pt-2">
                <span className="font-extrabold text-lg text-slate-800">Gov Grant Match</span>
                <span className="text-[10px] text-slate-400"> Alloc</span>
              </div>
              <p className="text-[10px] text-slate-500 pt-2 leading-relaxed">Disease surveillance outbreak map integrations, quarantine zones declarations control panels.</p>
            </div>
            <button 
              onClick={() => upgradeSubscription("Government", 0)}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg transition"
            >
              {tenant.subscriptionPlan === "Government" ? "Active Gov Permit" : "Deploy Gov Framework"}
            </button>
          </div>

        </div>
      </div>

      {/* Credit Purchase Bundles */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Top Up Credit Bundles</h4>
          <p className="text-xs text-slate-500">Fast pay-as-you-go credit recharges using local Zambian mobile money APIs.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {CREDIT_BUNDLES.map((bundle) => (
            <div key={bundle.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between gap-3 text-center shadow-xs">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block leading-none pb-1">{bundle.name}</span>
                <span className="text-lg font-extrabold font-mono text-indigo-600 block">{bundle.credits} Credits</span>
                {bundle.bonusCredits > 0 && (
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[8px] font-mono font-bold inline-block mt-1">
                    +{bundle.bonusCredits} Bonus
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block pb-2">{currencySymbol}{bundle.priceZmw}</span>
                <button 
                  onClick={() => handleOpenGateway(bundle)}
                  className="w-full py-1 bg-slate-900 override-bg-emerald hover:bg-slate-850 hover:bg-slate-800 text-white font-bold text-[10px] rounded cursor-pointer"
                >
                  Buy Pool
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Journals Logs */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-800">Centralized Wallet Ledger Logs</h4>
        
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 font-mono border-b border-slate-200 tracking-wider">
                <th className="py-3 px-6">Trx ID</th>
                <th className="py-3 px-6">Transaction Date</th>
                <th className="py-3 px-6">Transfer Classification</th>
                <th className="py-3 px-6">Description Memo</th>
                <th className="py-3 px-6 text-center">Platform Gateway</th>
                <th className="py-3 px-6 text-center">Credits Delta</th>
                <th className="py-3 px-6">Paid (ZMW)</th>
                <th className="py-3 px-6 text-right">Invoices / Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6 font-bold text-[10px] text-slate-500">{tx.id.toUpperCase()}</td>
                  <td className="py-4 px-6 text-slate-500">{tx.date}</td>
                  <td className="py-4 px-6 font-bold text-slate-700">{tx.type}</td>
                  <td className="py-4 px-6 font-sans font-medium text-slate-600 truncate max-w-[280px]">{tx.description}</td>
                  <td className="py-4 px-6 text-center">
                    {tx.paymentPlatform ? (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                        {tx.paymentPlatform}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className={`py-4 px-6 text-center font-bold ${tx.creditsDelta > 0 ? "text-emerald-600" : "text-amber-500"}`}>
                    {tx.creditsDelta > 0 ? `+${tx.creditsDelta}` : tx.creditsDelta}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800">
                    {tx.amountZmw > 0 ? `${currencySymbol}${tx.amountZmw.toLocaleString()}` : "-"}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {tx.amountZmw > 0 && (
                      <button 
                        onClick={() => onDownloadBillingReceipt(tx)}
                        className="p-1 px-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer transition select-none"
                      >
                        <Printer className="w-3 h-3" /> Receipt PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT MODAL CHALLEGE SIMULATION */}
      {paymentGatewayOpen && selectedBundle && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold">Mabala Local Payment Portal</h3>
                <p className="text-[10px] text-emerald-400 font-mono">Secured Zambian National Interoperable Gateway (ZVC)</p>
              </div>
              <button 
                onClick={() => setPaymentGatewayOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApproveRecharge} className="p-6 space-y-4 text-xs font-sans">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-bold">
                  {formError}
                </div>
              )}

              {/* Package Details summary */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Procuring:</span>
                  <span>{selectedBundle.credits} Credits pack</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Price (ZMW):</span>
                  <span>{currencySymbol}{selectedBundle.priceZmw.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Bonus allocations:</span>
                  <span>+{selectedBundle.bonusCredits} free credits</span>
                </div>
              </div>

              {/* Choice of channels */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => { setPayMethod("MTN MoMo"); setPhoneNumberIn(""); }}
                    className={`py-2 px-3 border rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                      payMethod === "MTN MoMo" ? "border-amber-500 bg-amber-500/5 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span>🟡 MTN MoMo</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setPayMethod("Airtel Money"); setPhoneNumberIn(""); }}
                    className={`py-2 px-3 border rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                      payMethod === "Airtel Money" ? "border-rose-500 bg-rose-500/5 text-rose-800" : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span>🔴 Airtel Money</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setPayMethod("Zamtel Kwacha"); setPhoneNumberIn(""); }}
                    className={`py-2 px-3 border rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                      payMethod === "Zamtel Kwacha" ? "border-teal-500 bg-teal-500/5 text-teal-800" : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span>🟢 Zamtel Kwacha</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setPayMethod("Visa CARD"); setPhoneNumberIn("4000 8821 7711 0002"); }}
                    className={`py-2 px-3 border rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                      payMethod === "Visa CARD" ? "border-blue-500 bg-blue-500/5 text-blue-800" : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span>🔵 Visa CARD</span>
                  </button>
                </div>
              </div>

              {payMethod !== "Visa CARD" ? (
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pb-1">Mobile Money Phone Number *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 0977xxxxxx or 0966xxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-mono font-bold"
                    value={phoneNumberIn}
                    onChange={(e) => setPhoneNumberIn(e.target.value)}
                    required
                  />
                  <span className="text-[9px] text-slate-400 block pt-1">
                    Triggers a USSD secure PIN request and instant bank deposit transfer challenge on the subscriber carrier.
                  </span>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pb-1">Simulated Card Details</label>
                  <input 
                    type="text" 
                    disabled
                    className="w-full px-3 py-2 bg-slate-150 border border-slate-200 rounded-xl outline-none text-xs font-mono text-slate-500 bg-slate-50"
                    value={phoneNumberIn}
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setPaymentGatewayOpen(false)}
                  className="w-1/2 py-2 bg-slate-150 border border-slate-250 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1 border border-emerald-450"
                >
                  <Check className="w-4 h-4" /> Finalize Payment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
