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
  Info,
  ExternalLink,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell,
  Legend 
} from "recharts";

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

  const [recentClicks, setRecentClicks] = useState<any[]>([]);

  // 3b. Listen to referralClicks
  useEffect(() => {
    if (!partnerId) return;
    const clicksRef = collection(db, "referralClicks");
    const q = query(clicksRef, where("partnerId", "==", partnerId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const da = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const db = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return db - da;
      });
      setRecentClicks(list.slice(0, 10));
    }, (error) => {
      console.error("[Partner Portal] Error listening to clicks:", error);
    });
    return () => unsubscribe();
  }, [partnerId]);

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
  const canAccessPromo = displayPartner.status !== "suspended";
  
  const unpaidCommission = Math.max(0, (displayPartner.totalCommissionEarned || 0) - (displayPartner.totalCommissionPaid || 0));

  // Dynamic tiered commission structures based on cumulative conversions
  const conversionsCount = displayPartner.totalPaidConversions || 0;
  let currentTierName = "Bronze Partner";
  let tierRate = 0.15;
  let nextTierName = "Silver Partner";
  let neededForNext = 5 - conversionsCount;
  let progressPct = Math.min(100, (conversionsCount / 5) * 100);
  let tierBadgeBg = "bg-amber-50 border-amber-200 text-amber-700";

  if (conversionsCount >= 15) {
    currentTierName = "Gold Partner";
    tierRate = 0.25;
    nextTierName = "Max Tier Reached";
    neededForNext = 0;
    progressPct = 100;
    tierBadgeBg = "bg-yellow-100 border-yellow-300 text-yellow-800 font-extrabold";
  } else if (conversionsCount >= 5) {
    currentTierName = "Silver Partner";
    tierRate = 0.20;
    nextTierName = "Gold Partner";
    neededForNext = 15 - conversionsCount;
    progressPct = Math.min(100, ((conversionsCount - 5) / 10) * 100);
    tierBadgeBg = "bg-slate-100 border-slate-300 text-slate-800 font-extrabold";
  }

  // Combined Live Chronological Activity Log (clicks, signups, payouts)
  const activityFeed = [
    ...recentClicks.map(c => ({
      id: c.id,
      type: "click",
      title: "Link Click Detected",
      desc: `A user from ${c.userAgent ? c.userAgent.split(" ")[0] : "Web Browser"} clicked your vanity referral link.`,
      time: c.timestamp ? new Date(c.timestamp).toLocaleTimeString() : "Just now",
      rawDate: c.timestamp ? new Date(c.timestamp) : new Date()
    })),
    ...conversions.map(conv => {
      let title = "Commission Attributed";
      let desc = `Earned pending commission of ZK ${conv.commissionAmount} from registration ${conv.tenantName || "Mabala Tenant"}.`;
      let type = "signup";

      if (conv.payoutStatus === "paid") {
        title = "Disbursement Cleared";
        desc = `Commission of ZK ${conv.commissionAmount} successfully settled to your mobile money wallet.`;
        type = "payout";
      } else if (conv.payoutStatus === "approved") {
        title = "Commission Approved";
        desc = `Commission of ZK ${conv.commissionAmount} approved for ${conv.tenantName || "Mabala Tenant"}. Payout scheduled.`;
        type = "payout";
      } else if (conv.payoutStatus === "processing") {
        title = "Payout Initiated";
        desc = `Payout of ZK ${conv.commissionAmount} is being processed via Lipila mobile money gateway.`;
        type = "payout";
      } else if (conv.payoutStatus === "declined") {
        title = "Commission Declined";
        desc = `Commission of ZK ${conv.commissionAmount} declined: Self-referral protection trigger or audit review flag.`;
        type = "signup";
      }

      return {
        id: conv.id + "-" + (conv.payoutStatus || "pending"),
        type,
        title,
        desc,
        time: conv.signupDate ? new Date(conv.signupDate).toLocaleTimeString() : "Just now",
        rawDate: conv.signupDate ? new Date(conv.signupDate) : new Date()
      };
    })
  ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 8);

  // Daily Performance mock/dynamic chart data for Recharts area chart
  const performanceChartData = [
    { name: "Mon", Clicks: Math.max(2, Math.round((displayPartner.totalClicks || 0) * 0.1)), Signups: Math.round((displayPartner.totalSignups || 0) * 0.1) },
    { name: "Tue", Clicks: Math.max(3, Math.round((displayPartner.totalClicks || 0) * 0.15)), Signups: Math.round((displayPartner.totalSignups || 0) * 0.1) },
    { name: "Wed", Clicks: Math.max(4, Math.round((displayPartner.totalClicks || 0) * 0.2)), Signups: Math.round((displayPartner.totalSignups || 0) * 0.2) },
    { name: "Thu", Clicks: Math.max(1, Math.round((displayPartner.totalClicks || 0) * 0.1)), Signups: Math.round((displayPartner.totalSignups || 0) * 0.1) },
    { name: "Fri", Clicks: Math.max(5, Math.round((displayPartner.totalClicks || 0) * 0.25)), Signups: Math.round((displayPartner.totalSignups || 0) * 0.3) },
    { name: "Sat", Clicks: Math.max(2, Math.round((displayPartner.totalClicks || 0) * 0.1)), Signups: Math.round((displayPartner.totalSignups || 0) * 0.1) },
    { name: "Sun", Clicks: Math.max(2, Math.round((displayPartner.totalClicks || 0) * 0.1)), Signups: Math.round((displayPartner.totalSignups || 0) * 0.1) }
  ];

  // Funnel data
  const totalClicksVal = displayPartner.totalClicks || 0;
  const totalSignupsVal = displayPartner.totalSignups || 0;
  const totalConversionsVal = displayPartner.totalPaidConversions || 0;
  const ctrVal = totalClicksVal > 0 ? ((totalSignupsVal / totalClicksVal) * 100).toFixed(1) : "0.0";

  const funnelData = [
    { name: "Clicks", value: totalClicksVal || 1, fill: "#3b82f6" },
    { name: "Signups", value: totalSignupsVal || 1, fill: "#10b981" },
    { name: "Paid Conversions", value: totalConversionsVal || 1, fill: "#6366f1" }
  ];

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
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
        
        {/* Link Clicks */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 block">Link Clicks</span>
            <span className="text-lg md:text-xl font-black text-slate-800 font-mono block mt-1">
              {(displayPartner.totalClicks || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-100/50">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Click traffic</span>
          </div>
        </div>

        {/* Total Signups */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 block">Free Signups</span>
            <span className="text-lg md:text-xl font-black text-slate-800 font-mono block mt-1">
              {(displayPartner.totalSignups || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-100/50">
            <Users className="w-3 h-3 text-emerald-500" />
            <span>Farmers onboarded</span>
          </div>
        </div>

        {/* Paid Conversions & Tier */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 block">Conversions</span>
              <span className={`px-1 rounded text-[8px] font-bold ${tierBadgeBg}`}>
                {currentTierName.split(" ")[0]}
              </span>
            </div>
            <span className="text-lg md:text-xl font-black text-indigo-600 font-mono block mt-1">
              {conversionsCount}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-100/50 truncate">
            <Award className="w-3 h-3 text-indigo-500" />
            <span>{currentTierName}</span>
          </div>
        </div>

        {/* Earned Commission */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 block">Earned Comm.</span>
            <span className="text-lg font-black text-slate-800 font-mono block mt-1 truncate">
              ZK {(displayPartner.totalCommissionEarned || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-100/50">
            <DollarSign className="w-3 h-3 text-emerald-500" />
            <span>Rate: {(tierRate * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Paid Commission */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 block">Paid Out</span>
            <span className="text-lg font-black text-slate-800 font-mono block mt-1 truncate">
              ZK {(displayPartner.totalCommissionPaid || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-100/50">
            <CreditCard className="w-3 h-3 text-slate-400" />
            <span>Disbursed wallet</span>
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-emerald-800 block">Owed Balance</span>
            <span className="text-lg font-black text-emerald-700 font-mono block mt-1 truncate">
              ZK {unpaidCommission.toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-emerald-800 font-medium flex items-center gap-1 pt-1 border-t border-emerald-200/50">
            <Coins className="w-3 h-3 text-emerald-600" />
            <span>Pending sweeps</span>
          </div>
        </div>

        {/* Mabala Credits */}
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-indigo-800 block">Wallet Credits</span>
            <span className="text-lg font-black text-indigo-700 font-mono block mt-1">
              {userProfile?.credits || 100}
            </span>
          </div>
          <div className="text-[10px] text-indigo-800 font-medium flex items-center gap-1 pt-1 border-t border-indigo-200/50">
            <Coins className="w-3.5 h-3.5 text-indigo-600" />
            <span>Active Pool</span>
          </div>
        </div>

      </div>

      {/* 3. Primary Referral Code & Link copy tools */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
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
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between space-y-4">
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
              disabled={isSuspended}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${isSuspended ? "bg-slate-100 text-slate-400 cursor-not-allowed" : copiedLinkId === "main-link" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"} cursor-pointer`}
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

        {/* NEW: Dynamic QR Code Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-between text-center space-y-3">
          <div className="w-full">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-600 block">Vanity QR Link</span>
            <p className="text-[9.5px] text-slate-400 mt-0.5 leading-tight">One-tap scan for offline farmer marketing</p>
          </div>
          <div className="w-24 h-24 flex items-center justify-center bg-slate-50 border border-slate-150 rounded-2xl p-1.5 shadow-inner">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getPersonalizedLink() || "https://mabala.cloud/r/" + displayPartner.referralCode)}`} 
              alt="Referral QR Code" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <a 
            href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(getPersonalizedLink() || "https://mabala.cloud/r/" + displayPartner.referralCode)}`} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span>High-Res QR Download</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
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
          {!canAccessPromo ? (
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

      {/* Analytics & Activity Log Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recharts Performance Analytics (8 cols) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-extrabold text-slate-800 text-sm">Performance analytics dashboard</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time engagement telemetry & conversion funnels.</p>
            </div>
            <div className="px-3 py-1 bg-slate-100 border rounded-xl text-[10px] font-bold text-slate-600">
              CTR: <span className="text-emerald-600 font-black">{ctrVal}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Traffic CTR */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Engagement trends (weekly)</span>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                    <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "10px" }} />
                    <Area type="monotone" dataKey="Clicks" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                    <Area type="monotone" dataKey="Signups" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSignups)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-[9px] font-bold">
                <span className="flex items-center gap-1 text-blue-600"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Link Clicks</span>
                <span className="flex items-center gap-1 text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Free Signups</span>
              </div>
            </div>

            {/* Conversion Funnel BarChart */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Lead conversion funnel</span>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                    <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "10px" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 text-[9px] font-bold">
                <span className="text-blue-500">Clicks: {totalClicksVal}</span>
                <span className="text-emerald-500">Signups: {totalSignupsVal}</span>
                <span className="text-indigo-500">Paid: {totalConversionsVal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Activity Log Chronological Feed (4 cols) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-4 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-extrabold text-slate-800 text-sm">Live activity telemetry</h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time click & conversion alerts feed.</p>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <div className="mt-4 space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {activityFeed.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-[11px] font-normal">
                  Idle. Share your link to trigger real-time logs...
                </div>
              ) : (
                activityFeed.map((act) => (
                  <div key={act.id} className="flex gap-3 text-[11px] font-medium leading-relaxed">
                    <div className="mt-0.5">
                      {act.type === "click" ? (
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                      ) : act.type === "payout" ? (
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-slate-800 truncate">{act.title}</span>
                        <span className="text-[8px] font-semibold text-slate-400 font-mono shrink-0">{act.time}</span>
                      </div>
                      <p className="text-slate-500 text-[10.5px] leading-tight mt-0.5">{act.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 text-[10px] text-slate-400 font-bold flex items-center justify-between">
            <span>Tracking session: ACTIVE</span>
            <span>Refreshes dynamically</span>
          </div>
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
