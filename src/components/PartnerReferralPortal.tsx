import React, { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  orderBy 
} from "firebase/firestore";
import { db } from "../firebase";
import { 
  Copy, 
  Check, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Coins, 
  LogOut, 
  Settings, 
  Award, 
  MessageCircle, 
  Facebook, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck,
  CreditCard,
  Layers,
  Info
} from "lucide-react";

interface PartnerReferralPortalProps {
  userProfile: any;
  onLogout: () => void;
}

export default function PartnerReferralPortal({ userProfile, onLogout }: PartnerReferralPortalProps) {
  const [partner, setPartner] = useState<any>(null);
  const [conversions, setConversions] = useState<any[]>([]);
  const [promoMessages, setPromoMessages] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<"all" | "facebook" | "whatsapp">("all");
  
  // Payout profile states
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<"airtel" | "mtn" | "zamtel">("airtel");
  const [facebookGroup, setFacebookGroup] = useState("");
  const [whatsappGroup, setWhatsappGroup] = useState("");
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const partnerId = userProfile?.uid;

  // 1. Listen to Partner document changes
  useEffect(() => {
    if (!partnerId) return;

    const partnerRef = doc(db, "partners", partnerId);
    const unsubscribe = onSnapshot(partnerRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPartner({ id: docSnap.id, ...data });
        
        // Populate inputs
        setFullName(data.fullName || "");
        setPhoneNumber(data.phoneNumber || "");
        setMobileMoneyProvider(data.mobileMoneyProvider || "airtel");
        setFacebookGroup(data.facebookGroupOrPageName || "");
        setWhatsappGroup(data.whatsappGroupName || "");
      } else {
        console.warn("[Partner Portal] No matching partner document found in Firestore.");
      }
      setIsLoading(false);
    }, (error) => {
      console.error("[Partner Portal] Error listening to partner doc:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId]);

  // 2. Listen to Referral Conversions ledger
  useEffect(() => {
    if (!partnerId) return;

    const convRef = collection(db, "referralConversions");
    const q = query(convRef, where("partnerId", "==", partnerId));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by signupDate descending safely in-memory
      list.sort((a: any, b: any) => {
        const da = a.signupDate ? new Date(a.signupDate).getTime() : 0;
        const db = b.signupDate ? new Date(b.signupDate).getTime() : 0;
        return db - da;
      });
      setConversions(list);
    }, (error) => {
      console.error("[Partner Portal] Error listening to conversions:", error);
    });

    return () => unsubscribe();
  }, [partnerId]);

  // 3. Listen to Promo Copy Library
  useEffect(() => {
    const promoRef = collection(db, "promoMessages");
    const unsubscribe = onSnapshot(promoRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setPromoMessages(list);
    }, (error) => {
      console.error("[Partner Portal] Error listening to promo messages:", error);
    });

    return () => unsubscribe();
  }, []);

  // 4. Update Partner Payout Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    
    if (!fullName.trim() || !phoneNumber.trim()) {
      setProfileMessage({ type: "error", text: "⚠️ Payout Name and Phone Number are required." });
      return;
    }

    // Quick regex validation for E.164-ish mobile number formats (at least 9 digits)
    const cleanPhone = phoneNumber.replace(/\s+/g, "");
    if (!/^\+?[1-9]\d{8,14}$/.test(cleanPhone)) {
      setProfileMessage({ type: "error", text: "⚠️ Please enter a valid phone number with country code (e.g., +260971000000)." });
      return;
    }

    setIsSavingProfile(true);

    try {
      const partnerRef = doc(db, "partners", partnerId);
      await updateDoc(partnerRef, {
        fullName,
        phoneNumber: cleanPhone,
        mobileMoneyProvider,
        facebookGroupOrPageName: facebookGroup,
        whatsappGroupName: whatsappGroup
      });
      setProfileMessage({ type: "success", text: "✅ Payout profile updated successfully." });
    } catch (err: any) {
      console.error("[Partner Portal] Error updating profile:", err);
      setProfileMessage({ type: "error", text: `⚠️ Error saving: ${err.message || "Unauthorized"}` });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getPersonalizedLink = () => {
    if (!partner?.referralCode) return "";
    return `${window.location.origin}/r/${partner.referralCode}`;
  };

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[400px]">
        <div className="animate-spin text-emerald-600 text-3xl">↻</div>
        <p className="text-xs text-slate-500 mt-2 font-mono font-medium">Synchronizing Mabala Partner Workspace...</p>
      </div>
    );
  }

  // Fallback defaults if partner document is newly created and still propagating
  const displayPartner = partner || {
    fullName: userProfile?.name || "New Partner",
    referralCode: "MB-PENDING",
    status: "pending_review",
    commissionRate: 0.15,
    totalClicks: 0,
    totalSignups: 0,
    totalPaidConversions: 0,
    totalCommissionEarned: 0,
    totalCommissionPaid: 0
  };

  const isApproved = displayPartner.status === "active";
  const isSuspended = displayPartner.status === "suspended";
  
  const unpaidCommission = Math.max(0, (displayPartner.totalCommissionEarned || 0) - (displayPartner.totalCommissionPaid || 0));

  const filteredPromo = promoMessages.filter(p => {
    if (selectedChannel === "all") return true;
    return p.channel === selectedChannel || p.channel === "both";
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8 space-y-8 font-sans">
      
      {/* 1. Header Hero Panel */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-600 block mb-1">Mabala Cloud Partner Program</span>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">Welcome, {displayPartner.fullName}!</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Promote Mabala Cloud's multi-tenant farm accounting and biological logs management to your agricultural network and earn <strong className="text-slate-700">{(displayPartner.commissionRate * 100).toFixed(0)}% commission</strong> on every paid subscription.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex flex-col text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Partner Account Status</span>
            <div className="mt-1">
              {displayPartner.status === "active" ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full border border-emerald-200/80 inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active / Approved
                </span>
              ) : displayPartner.status === "suspended" ? (
                <span className="px-3 py-1 bg-red-50 text-red-700 text-[10px] font-black uppercase rounded-full border border-red-200/80 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Suspended
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-full border border-amber-200/80 inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Pending Admin Review
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {isSuspended && (
        <div className="p-4 bg-red-550/10 border border-red-500/30 text-red-800 rounded-2xl text-xs font-semibold leading-relaxed flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>Your partner account has been suspended by platform administrators. No commissions will accumulate during suspension. Please contact Mabala support if you believe this is an error.</span>
        </div>
      )}

      {/* 2. Key Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Link Clicks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Link Clicks</span>
            <span className="text-xl md:text-2xl font-black text-slate-800 font-mono block mt-2">
              {(displayPartner.totalClicks || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-100/50">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Click-through traffic</span>
          </div>
        </div>

        {/* Total Signups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Free Signups</span>
            <span className="text-xl md:text-2xl font-black text-slate-800 font-mono block mt-2">
              {(displayPartner.totalSignups || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-100/50">
            <Users className="w-3 h-3 text-emerald-500" />
            <span>Farmers onboarded</span>
          </div>
        </div>

        {/* Paid Conversions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Paid Upgrades</span>
            <span className="text-xl md:text-2xl font-black text-slate-800 font-mono block mt-2">
              {(displayPartner.totalPaidConversions || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-100/50">
            <Layers className="w-3 h-3 text-indigo-500" />
            <span>Paid conversions</span>
          </div>
        </div>

        {/* Earned Commission */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Earned Commission</span>
            <span className="text-xl md:text-2xl font-black text-emerald-600 font-mono block mt-2">
              ZK {(displayPartner.totalCommissionEarned || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-100/50">
            <DollarSign className="w-3 h-3 text-emerald-500" />
            <span>Cumulative earnings</span>
          </div>
        </div>

        {/* Paid Commission */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Total Paid Out</span>
            <span className="text-xl md:text-2xl font-black text-slate-800 font-mono block mt-2">
              ZK {(displayPartner.totalCommissionPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-100/50">
            <CreditCard className="w-3 h-3 text-slate-400" />
            <span>Disbursed payments</span>
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 block">Available Balance</span>
            <span className="text-xl md:text-2xl font-black text-emerald-700 font-mono block mt-2">
              ZK {unpaidCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10.5px] text-emerald-800 font-medium flex items-center gap-1 pt-1 border-t border-emerald-200/50">
            <Coins className="w-3 h-3 text-emerald-600" />
            <span>Owed commission</span>
          </div>
        </div>

      </div>

      {/* 3. Primary Referral Code & Link copy tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Referral Code Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-600 block mb-1">Your Referral Code</span>
            <p className="text-xs text-slate-500">Farmers can optionally enter this code during signup to bind the attribution.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
            <div className="flex-1 font-mono text-base font-black text-slate-800 text-center uppercase tracking-wider py-1 select-all">
              {displayPartner.referralCode}
            </div>
            <button
              onClick={() => handleCopyCode(displayPartner.referralCode)}
              disabled={isSuspended}
              className={`p-2.5 rounded-xl transition-all active:scale-95 ${copiedCode ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-600"} cursor-pointer`}
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Personalized Link Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-600 block mb-1">Vanity Referral Link</span>
            <p className="text-xs text-slate-500">Farmers clicking this link will be tracked with a 30-day first-party cookie session.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
            <div className="flex-1 font-mono text-xs font-bold text-slate-600 truncate px-2 select-all">
              {getPersonalizedLink() || "https://mabala.cloud/r/" + displayPartner.referralCode}
            </div>
            <button
              onClick={() => handleCopyLink(getPersonalizedLink(), "main-link")}
              disabled={isSuspended || !isApproved}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${(!isApproved || isSuspended) ? "bg-slate-100 text-slate-400 cursor-not-allowed" : copiedLinkId === "main-link" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"} cursor-pointer`}
            >
              {copiedLinkId === "main-link" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* 4. Promotional Messaging Copypasta Library */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 gap-4">
          <div>
            <h2 className="font-extrabold text-slate-800 text-sm">Promotional copy-sharing assets</h2>
            <p className="text-xs text-slate-500 mt-0.5">Quick-share pre-written posts, formatted automatically with your personalized referral link.</p>
          </div>
          
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 text-xs font-semibold gap-1 shrink-0 shadow-sm">
            <button
              onClick={() => setSelectedChannel("all")}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${selectedChannel === "all" ? "bg-slate-100 text-slate-800 font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              All Channels
            </button>
            <button
              onClick={() => setSelectedChannel("whatsapp")}
              className={`px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${selectedChannel === "whatsapp" ? "bg-emerald-500/10 text-emerald-700 font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              WhatsApp
            </button>
            <button
              onClick={() => setSelectedChannel("facebook")}
              className={`px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${selectedChannel === "facebook" ? "bg-indigo-500/10 text-indigo-700 font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              <Facebook className="w-3.5 h-3.5 text-indigo-500" />
              Facebook
            </button>
          </div>
        </div>

        <div className="p-6">
          {!isApproved ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="font-bold text-slate-800 text-xs mt-2">Promo Material Restricted</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Promotional assets and share links are unlocked once your partner profile has been approved and activated by Mabala Platform Administrators.
              </p>
            </div>
          ) : filteredPromo.length === 0 ? (
            <p className="text-slate-400 italic text-center py-8 text-xs">No promotional templates match the filter or database has not been seeded yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPromo.map((item: any) => {
                const formattedBody = (item.bodyTemplate || "").replace(/\[Partner Link\]|\[Link\]/g, getPersonalizedLink());
                const isWa = item.channel === "whatsapp";
                const isFb = item.channel === "facebook";
                
                return (
                  <div key={item.id} className="border border-slate-100 rounded-2xl bg-slate-50/50 p-5 flex flex-col justify-between space-y-4 hover:border-slate-200 transition-all">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide truncate">{item.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${isWa ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : isFb ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                          {item.channel}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-slate-600 bg-white border border-slate-200/60 rounded-xl p-3 mt-3 max-h-[160px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                        {formattedBody}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyLink(formattedBody, item.id)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition-all flex items-center gap-1.5 border cursor-pointer active:scale-95 ${copiedLinkId === item.id ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-sm"}`}
                      >
                        {copiedLinkId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLinkId === item.id ? "Copied!" : "Copy Asset"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Referred Signups & Commission Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="font-extrabold text-slate-800 text-sm">Commission attribution ledger</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time breakdown of all farmers referred through your vanity link or referral code.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3.5">Attributed Tenant</th>
                <th className="p-3.5">Registration Date</th>
                <th className="p-3.5">Assigned Subscription</th>
                <th className="p-3.5">Status / Payment</th>
                <th className="p-3.5">Rate</th>
                <th className="p-3.5 text-right">Earned Commission</th>
                <th className="p-3.5 text-center">Payout Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {conversions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic font-normal">
                    No attributed referrals found in the system ledger. Share your link to start earning!
                  </td>
                </tr>
              ) : (
                conversions.map((conv: any) => {
                  const isPaid = conv.payoutStatus === "paid";
                  const isApprovedPayout = conv.payoutStatus === "approved";
                  const isPending = conv.payoutStatus === "pending";
                  const isRejected = conv.payoutStatus === "rejected";
                  const conversionPaid = conv.firstPaymentAmount > 0;
                  
                  return (
                    <tr key={conv.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{conv.tenantName || "Mabala Tenant"}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Tenant ID: {conv.tenantId}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {conv.signupDate ? new Date(conv.signupDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {conv.planAtFirstPayment || "Free Plan"}
                      </td>
                      <td className="p-3.5">
                        {conversionPaid ? (
                          <div className="flex flex-col">
                            <span className="text-emerald-600 font-bold font-mono">Paid (ZK {conv.firstPaymentAmount})</span>
                            <span className="text-[9.5px] text-slate-400 font-mono">{conv.firstPaymentDate ? new Date(conv.firstPaymentDate).toLocaleDateString() : ""}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium italic">Trial / No Payments Yet</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono font-bold">
                        {conv.commissionRate ? `${(conv.commissionRate * 100).toFixed(0)}%` : "15%"}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-800">
                        ZK {(conv.commissionAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-center">
                        {isPaid ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase rounded-full border border-emerald-200">
                            Paid Out
                          </span>
                        ) : isApprovedPayout ? (
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-extrabold uppercase rounded-full border border-indigo-200">
                            Approved
                          </span>
                        ) : isRejected ? (
                          <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-extrabold uppercase rounded-full border border-rose-200">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-extrabold uppercase rounded-full border border-slate-200">
                            Pending Review
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Payout Settings Form & Mobile Money Integration */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden max-w-4xl">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-extrabold text-slate-800 text-sm">Payout & mobile money profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">Commissions are automatically swept to your Zambian mobile money account once approved.</p>
        </div>
        
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Full Name */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block pb-1.5">Registered Wallet Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Banda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs border rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 bg-white shadow-sm font-semibold text-slate-800"
              />
            </div>

            {/* Mobile Money Provider */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block pb-1.5">Zambian Mobile Money Provider</label>
              <select
                value={mobileMoneyProvider}
                onChange={(e) => setMobileMoneyProvider(e.target.value as any)}
                className="w-full text-xs border rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 bg-white shadow-sm font-semibold text-slate-800"
              >
                <option value="airtel">Airtel Money</option>
                <option value="mtn">MTN Mobile Money</option>
                <option value="zamtel">Zamtel Kwacha</option>
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block pb-1.5">Mobile Wallet Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +260971000000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full text-xs border rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 bg-white shadow-sm font-bold font-mono text-slate-800"
              />
              <span className="text-[9.5px] text-slate-400 block mt-1">Include country prefix +260. Must be telco registered.</span>
            </div>

            {/* Facebook Platform */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block pb-1.5">Facebook Group/Page (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Poultry Zambia Community Admin"
                value={facebookGroup}
                onChange={(e) => setFacebookGroup(e.target.value)}
                className="w-full text-xs border rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 bg-white shadow-sm font-semibold text-slate-800"
              />
            </div>

            {/* WhatsApp Platform */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block pb-1.5">WhatsApp Group / Extension Scopes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Copperbelt Agro-Specialist leaders"
                value={whatsappGroup}
                onChange={(e) => setWhatsappGroup(e.target.value)}
                className="w-full text-xs border rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 bg-white shadow-sm font-semibold text-slate-800"
              />
            </div>

          </div>

          {profileMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold leading-relaxed border ${profileMessage.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
              {profileMessage.text}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-550 border border-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
            >
              {isSavingProfile ? (
                <span className="animate-spin text-xs">↻</span>
              ) : null}
              <span>Save Payout Credentials</span>
            </button>
          </div>

        </form>
      </div>

      {/* 7. Fraud Safeguard Notice Box */}
      <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 max-w-4xl space-y-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-slate-600" />
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Mabala Fraud Protection & Payout Sweeps</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Commission distributions are run on a net-15 schedule via Lipila's direct telco integration to prevent checkout chargebacks. Referral conversions are audited for self-referrals (e.g., trying to use your own partner link to purchase a personal farm subscription is strictly blacklisted and flags the payout for manual review). 
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Attribution window: Signups converted to paid plans within <strong className="text-slate-700">60 days</strong> of registration qualify for commission.
        </p>
      </div>

    </div>
  );
}
