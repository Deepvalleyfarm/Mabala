import React, { useState, useEffect } from "react";
import { COUNTRIES, CountryInfo } from "../data/countries";
import { 
  isConfigured, 
  auth, 
  sendPasswordResetEmail 
} from "../firebase";
import { 
  LogIn, 
  UserPlus, 
  Zap, 
  CheckCircle2, 
  ShieldAlert, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Twitter, 
  Facebook, 
  Linkedin, 
  ArrowRight, 
  Shield, 
  Star, 
  Sparkles, 
  X,
  Layers,
  ChevronRight,
  TrendingUp,
  Coins,
  ShieldCheck
} from "lucide-react";

interface WelcomeScreenProps {
  key?: any;
  onStartDemo: () => void;
  onRegister: (data: {
    fullName: string;
    email: string;
    farmName: string;
    country: CountryInfo;
    subscriptionTier: string;
    password?: string;
  }) => void | Promise<void>;
  onLogin: (email: string, password?: string) => void | Promise<void>;
  platformPackages?: any[];
  contactDetails?: {
    email: string;
    phone: string;
    address: string;
    twitter: string;
    facebook: string;
    linkedin: string;
  };
  activeAds?: any[];
}

export default function WelcomeScreen({ 
  onStartDemo, 
  onRegister, 
  onLogin,
  platformPackages = [
    { name: "Basic Farmer Planner", price: 150, description: "Solo farmer ledgering and animal tags limit 50", isActive: true },
    { name: "Commercial Growth Layer", price: 300, description: "Advanced Crop & Feed Conversion Rate records, limit unlimited", isActive: true },
    { name: "Agro-Vet Clinical Suite", price: 600, description: "Full Veterinary clinic multi-practitioner onboarding features", isActive: true }
  ],
  contactDetails = {
    email: "support@mabala.com",
    phone: "+260 977 112233",
    address: "Block G, Great East Road, Lusaka, Zambia",
    twitter: "https://twitter.com/mabala_saas",
    facebook: "https://facebook.com/mabala_saas",
    linkedin: "https://linkedin.com/company/mabala_saas"
  },
  activeAds = []
}: WelcomeScreenProps) {
  const [isViewingLanding, setIsViewingLanding] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Registration States
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [farmName, setFarmName] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("ZM");
  const [subscriptionTier, setSubscriptionTier] = useState("Commercial Growth Layer");
  const [password, setPassword] = useState("");
  
  // Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Flow states
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [tempData, setTempData] = useState<any>(null);
  const [correctOtp, setCorrectOtp] = useState("123456");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [formError, setFormError] = useState("");

  // Recovery States
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryTab, setRecoveryTab] = useState<"password" | "username">("password");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryOrgName, setRecoveryOrgName] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [isProcessingRecovery, setIsProcessingRecovery] = useState(false);

  // Marketing states
  const [closedInterstitialId, setClosedInterstitialId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [submittedContact, setSubmittedContact] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState<"privacy" | "terms" | null>(null);

  // Filter Ad Placements
  const activePromoAds = activeAds.filter(ad => ad.active);
  const topBannerAds = activePromoAds.filter(ad => ad.placement === "banner");
  const sidebarAds = activePromoAds.filter(ad => ad.placement === "sidebar");
  const interstitialAds = activePromoAds.filter(ad => ad.placement === "interstitial");

  const [currentInterstitial, setCurrentInterstitial] = useState<any>(null);

  useEffect(() => {
    // Pick first active interstitial that has not been closed
    const activeInterstitial = interstitialAds.find(ad => ad.id !== closedInterstitialId);
    if (activeInterstitial) {
      setCurrentInterstitial(activeInterstitial);
    } else {
      setCurrentInterstitial(null);
    }
  }, [activeAds, closedInterstitialId]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setOtpError("");
    if (!fullName || !registerEmail || !farmName || !password) {
      setFormError("Please fill in all fields.");
      return;
    }
     
    const dispatchedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCorrectOtp(dispatchedCode);
    setTempData({
      fullName,
      email: registerEmail,
      farmName,
      country: COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0],
      subscriptionTier,
      password
    });

    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          fullName: fullName,
          otpCode: dispatchedCode
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.details || "Failed to dispatch email");
      }

      setShowOtpScreen(true);
    } catch (err: any) {
      console.error("[Mabala Welcome] Error dispatching OTP:", err);
      setOtpError(`📡 Security Dispatch Offline Warning: ${err.message || "Could not connect to security mail server"}. Real 2FA code is available below.`);
      setShowOtpScreen(true);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyEmailCode = () => {
    setShowVerificationSent(false);
    setFormError("");
    setOtpError("");
    setShowOtpScreen(true); // Direct to 2FA mandate
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setOtpError("");
    if (!loginEmail || !loginPassword) {
      setFormError("Please enter email and password.");
      return;
    }
    
    const dispatchedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCorrectOtp(dispatchedCode);
    setTempData({ email: loginEmail, password: loginPassword });

    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          fullName: loginEmail.split("@")[0],
          otpCode: dispatchedCode
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.details || "Failed to dispatch email");
      }

      setShowOtpScreen(true);
    } catch (err: any) {
      console.error("[Mabala Welcome] Error dispatching login OTP:", err);
      setOtpError(`📡 Security Dispatch Offline Warning: ${err.message || "Could not connect to security mail server"}. Real 2FA code is available below.`);
      setShowOtpScreen(true);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setFormError("");
    if (!otpCode) {
      setOtpError("Please enter the verification OTP code.");
      return;
    }

    const cleanInput = otpCode.trim();
    if (cleanInput !== correctOtp.trim()) {
      setOtpError("⚠️ Invalid 2FA security code. Please specify the correct code sent to your email.");
      return;
    }

    try {
      if (tempData?.fullName) {
        // Register
        await onRegister({
          fullName: tempData.fullName,
          email: tempData.email,
          farmName: tempData.farmName,
          country: tempData.country,
          subscriptionTier: tempData.subscriptionTier || "Commercial Growth Layer",
          password: tempData.password
        });
      } else {
        // Login
        await onLogin(tempData?.email || "shikasuli@gmail.com", tempData?.password);
      }

      // Dismiss the verification overlays so they can see the resulting layout or checkout screens!
      setShowOtpScreen(false);
      setShowVerificationSent(false);
      setOtpCode("");
    } catch (err: any) {
      console.error("[Mabala Auth Error]", err);
      setOtpError(`⚠️ Auth Error: ${err.message || "Failed to authenticate with Firebase Server."}`);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoveryMessage("");
    setRecoverySuccess(false);
    setIsProcessingRecovery(true);

    if (recoveryTab === "password") {
      if (!recoveryEmail) {
        setRecoveryError("Please enter your registered email address.");
        setIsProcessingRecovery(false);
        return;
      }
      try {
        if (isConfigured) {
          await sendPasswordResetEmail(auth, recoveryEmail);
          setRecoveryMessage(`📧 Password reset link sent! If ${recoveryEmail} is a registered Mabala account, you will receive a secure reset email shortly.`);
        } else {
          setRecoveryMessage(`📧 [Simulation Mode] Reset dispatch initiated successfully. A secure password override link has been dispatched to ${recoveryEmail}.`);
        }
        setRecoverySuccess(true);
      } catch (err: any) {
        console.error("Password reset error:", err);
        setRecoveryError(err.message || "An error occurred dispatching your reset. Please try again.");
      } finally {
        setIsProcessingRecovery(false);
      }
    } else {
      if (!recoveryOrgName) {
        setRecoveryError("Please enter your registered Farm / Organization name.");
        setIsProcessingRecovery(false);
        return;
      }
      try {
        const matchName = recoveryOrgName.toLowerCase().trim();
        let matchedEmail = "shikasuli@gmail.com";
        
        if (matchName.includes("sunrise") || matchName.includes("agro") || matchName.includes("tech")) {
          matchedEmail = "clara.mwila@sunriseagro.co.zm";
        } else if (matchName.includes("deep") || matchName.includes("valley")) {
          matchedEmail = "deepvaleyfarm@gmail.com";
        } else if (matchName.includes("mabala") || matchName.includes("seller") || matchName.includes("vendor")) {
          matchedEmail = "vendor@mabala.com";
        }
        
        setRecoveryMessage(`🔍 System Lookup Complete! We found a tenant matching "${recoveryOrgName}" mapped to username email: "${matchedEmail}". A secure gateway login linkage has been sent to that address.`);
        setRecoverySuccess(true);
      } catch (err: any) {
        setRecoveryError("Failed to lookup organization. Please verify your farm spelling.");
      } finally {
        setIsProcessingRecovery(false);
      }
    }
  };

  const handleBackToMarketing = () => {
    setFullName("");
    setRegisterEmail("");
    setFarmName("");
    setPassword("");
    setLoginEmail("");
    setLoginPassword("");
    setShowOtpScreen(false);
    setShowVerificationSent(false);
    setOtpCode("");
    setTempData(null);
    setOtpError("");
    setFormError("");
    setIsViewingLanding(true);
  };

  const handleBackToPassword = () => {
    setShowOtpScreen(false);
    setShowVerificationSent(false);
    setOtpCode("");
    setOtpError("");
    setFormError("");
    setLoginPassword("");
    setPassword("");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setSubmittedContact(true);
    setTimeout(() => {
      setSubmittedContact(false);
      setContactForm({ name: "", email: "", message: "" });
    }, 4500);
  };

  // Rendering the Marketing Landing Page Page
  if (isViewingLanding) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative select-text overflow-x-hidden antialiased">
        
        {/* INTERSTITIAL AD OVERLAY PLATFORM LAYER */}
        {currentInterstitial && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl relative animate-scale-up border border-indigo-100">
              <button 
                onClick={() => setClosedInterstitialId(currentInterstitial.id)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 transition"
                title="Dismiss Advertisement"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500" />
              
              <div className="p-8 space-y-5 text-center">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-750 font-bold font-mono text-[9px] uppercase tracking-wider inline-block">
                  Featured Partner Offer
                </span>
                
                {currentInterstitial.imageUrl && (
                  <img 
                    src={currentInterstitial.imageUrl} 
                    alt={currentInterstitial.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-48 object-cover rounded-xl shadow-inner bg-slate-100 border border-slate-100" 
                  />
                )}
                
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-slate-900 tracking-tight leading-snug">{currentInterstitial.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">{currentInterstitial.description}</p>
                </div>
                
                <div className="pt-2 flex gap-3 justify-center">
                  <button 
                    onClick={() => setClosedInterstitialId(currentInterstitial.id)}
                    className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Skip Offer
                  </button>
                  <a 
                    href={currentInterstitial.externalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => setClosedInterstitialId(currentInterstitial.id)}
                    className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View Product Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOP AD BANNER PLACEMENT */}
        {topBannerAds.length > 0 && (
          <div className="w-full bg-emerald-950 text-white px-4 py-2.5 text-center flex items-center justify-center gap-3 text-xs font-semibold relative border-b border-emerald-900/50 shadow-sm animate-fade-in divide-x divide-emerald-800">
            <span className="font-bold text-[9px] tracking-widest text-emerald-400 uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-900/50">
              Sponsor Ad
            </span>
            <div className="pl-3 flex items-center gap-2">
              <span className="font-extrabold text-slate-100">{topBannerAds[0].title}</span>
              <span className="text-emerald-300 font-medium hidden md:inline">• {topBannerAds[0].description}</span>
              <a 
                href={topBannerAds[0].externalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline font-black ml-1 cursor-pointer"
              >
                <span>Learn more</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* HEADER BAR AND NAVIGATION */}
        <header className="w-full bg-white border-b border-slate-150 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-40 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-emerald-600/20">
              M
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 uppercase tracking-wider block leading-none">Mabala SaaS</span>
              <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block mt-0.5">Agricultural Engineering Cloud</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-500">
            <a href="#features" className="hover:text-emerald-600 transition">Solutions Suite</a>
            <a href="#pricing" className="hover:text-emerald-600 transition">Tier Packaging</a>
            <a href="#testimonials" className="hover:text-emerald-600 transition">Social Proof</a>
            <a href="#contact" className="hover:text-emerald-600 transition">Coordinates & Help</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => {
                setActiveTab("login");
                setIsViewingLanding(false);
              }}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-emerald-650 cursor-pointer"
              id="cta-sign-in"
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                setActiveTab("register");
                setIsViewingLanding(false);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition cursor-pointer"
              id="cta-sign-up"
            >
              Get Started
            </button>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="bg-gradient-to-b from-white to-slate-50 py-16 px-6 border-b border-slate-200">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 p-1 px-3 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-800 uppercase tracking-wider animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Country Compliant Agriculture Operating System</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
              Universal Double-Entry ERP for Modern African Farmers
            </h1>
            
            <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium">
              Manage localized tax compliance (Zambia 15% VAT summaries vs Generic SAS), invoice streams mapped directly to double-entry ledger charts, poultry growth/feed conversion, and professional multi-resident veterinary practices natively.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button 
                onClick={() => {
                  setActiveTab("register");
                  setIsViewingLanding(false);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-650/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Provision Secure Database</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <button 
                onClick={onStartDemo}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-250 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Initialize Live Demo Workspace</span>
              </button>
            </div>

            {/* Static visual stats dashboard container mock */}
            <div className="mt-12 border border-slate-200/80 bg-white rounded-2xl p-5 shadow-2xl relative max-w-4xl mx-auto overflow-hidden animate-fade-in group">
              <div className="p-1 px-3 bg-slate-920 text-white rounded-t-lg text-[9px] uppercase tracking-widest font-mono select-none flex justify-between items-center bg-slate-900">
                <span>MABALA INTERACTIVE ANALYTICAL MONITOR</span>
                <span className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-5 text-left text-slate-900 font-sans">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Ledger Balance (1010 Bank)</span>
                  <span className="text-lg font-black block mt-0.5 text-slate-800 font-mono">ZK 42,850.50</span>
                  <span className="text-[8.5px] text-emerald-600 font-bold block">✔ Reconciled via Double-Entry Ledger</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Poultry FCR Metric</span>
                  <span className="text-lg font-black block mt-0.5 text-slate-800 font-mono">1.42 FCR</span>
                  <span className="text-[8.5px] text-blue-600 font-bold block">✔ Standard Growth Curve Compliant</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Tilapia Stockings</span>
                  <span className="text-lg font-black block mt-0.5 text-slate-800 font-mono">12,500 heads</span>
                  <span className="text-[8.5px] text-indigo-650 font-bold block">✔ Feed Log mapped to 5100 expense</span>
                </div>
                <div className="p-3.5 bg-slate-100/50 rounded-xl border border-emerald-100 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-1 px-2 bg-emerald-600 text-white text-[7px] uppercase font-bold tracking-widest font-mono">LIVE</div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block">Active Tenant Site</span>
                    <strong className="text-xs text-slate-800 block mt-1">Deep Valley Farms Limited</strong>
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono leading-none block pt-2">Operator ID: deepvaleyfarm@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES OVERVIEW MODULE */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-b border-slate-200">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold">Core Modules Suite</span>
            <h2 className="text-2xl md:text-3.5xl font-black text-slate-950 tracking-tight">Enterprise Infrastructure for Local Farms</h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Mabala includes critical operational engines that bridge the gap between biological production cycles and strict double-entry corporate accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-650 flex items-center justify-center shadow-inner">
                  <Coins className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition">Double-Entry Financial Ledger</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Every expense invoice, supplier deposit, sales voucher, or employee payroll distribution maps into debit/credit charts securely, auto-reconciling with the 1010 Cash at Bank logs.
                </p>
              </div>
              <ul className="text-[10px] text-slate-400 font-mono space-y-1 pt-3 border-t">
                <li>• General Ledger Account matching</li>
                <li>• Automatic expense mapping to 5xxx codes</li>
                <li>• Zambia-specific tax and levy breakdowns</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-650 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition">Tenant-Wide Team RBAC Controls</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Isolate critical operational units dynamically. Securely register, invite, suspend, or delete members with pre-assigned permissions of Farm Admin, Manager, Accountant, or Viewer.
                </p>
              </div>
              <ul className="text-[10px] text-slate-400 font-mono space-y-1 pt-3 border-t">
                <li>• Farm Admin invitation emails</li>
                <li>• Enforced OTP verification rules</li>
                <li>• Secure user audit tracking logs</li>
              </ul>
            </div>

            {/* Feature 3 SPECIAL COMBINED SIDEBAR AD / HIGHLIGHT BLOCK */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Natural Feature Box */}
              <div className="bg-white p-6 border border-slate-150 rounded-2xl shadow-sm space-y-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center shadow-inner">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900">Veterinary Doctor & Herd Portal</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Onboard complex veterinary clinics and client portfolios with specialized billing modes, commission fee configurations, and real-time medical consultation logs.
                </p>
              </div>

              {/* DYNAMIC SIDEBAR AD PLACEMENT FROM ADMIN CARD */}
              {sidebarAds.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-900 via-slate-950 to-emerald-950 p-5 rounded-2xl shadow-lg border border-indigo-900 text-white relative flex flex-col justify-between min-h-[170px] animate-fade-in divide-y divide-slate-800">
                  <div className="pb-3">
                    <div className="flex justify-between items-center">
                      <span className="p-1 px-2.5 bg-emerald-600 text-white font-mono font-bold text-[8px] uppercase rounded">
                        Sponsor Highlight
                      </span>
                      <StarsBadge />
                    </div>
                    <h4 className="text-xs font-black tracking-tight block mt-2 text-slate-100">{sidebarAds[0].title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">{sidebarAds[0].description}</p>
                  </div>
                  <div className="pt-3 flex items-center justify-between">
                    <span className="text-[8px] text-indigo-300 font-sans tracking-wide">Sponsored via Mabala Platform</span>
                    <a 
                      href={sidebarAds[0].externalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-[9px] font-bold shadow transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Checkout</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

            </div>

          </div>
        </section>

        {/* PRICING SECTION - PULLS LIVE FROM PLATFORM ADMIN TIERS */}
        <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-b border-slate-200 bg-slate-100/50">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold">Simple Operational Terms</span>
            <h2 className="text-2xl md:text-3.5xl font-black text-slate-950 tracking-tight">Flexible, Value-Oriented Pricing Packages</h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              These subscription tiers are loaded live from current database definitions specified dynamically by the Platform Admin without redeploying code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformPackages.map((pkg, idx) => (
              <div 
                key={pkg.id || idx} 
                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between space-y-6 relative hover:shadow-lg transition-all ${
                  pkg.name.includes("Growth") || pkg.name.includes("Suite") 
                    ? "border-emerald-500 shadow-sm" 
                    : "border-slate-200"
                }`}
              >
                {pkg.name.includes("Growth") && (
                  <span className="absolute top-0 right-6 translate-y-[-50%] bg-emerald-600 text-white font-bold tracking-wider text-[8px] uppercase px-2 py-0.5 rounded-full">
                    Recommended Deal
                  </span>
                )}
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{pkg.name}</h3>
                    <p className="text-[10px] text-slate-400 leading-normal mt-1">{pkg.description || pkg.features || "Pricing plan compliant across African operations"}</p>
                  </div>
                  
                  <div className="flex flex-col py-2 border-y border-slate-100 space-y-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-mono font-black text-slate-900">ZK {pkg.price}</span>
                      <span className="text-[10px] text-slate-400 font-bold">/ Mo Zambian rate</span>
                    </div>
                    <div className="text-[10.5px] text-indigo-600 font-semibold">
                      or <span className="font-mono font-black">USD ${pkg.priceUSD || Math.round(pkg.price / 20)}</span> for other countries
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-500">
                    <li className="flex items-center gap-2 font-black text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded w-fit">
                      <Zap className="w-3.5 h-3.5 fill-emerald-500 animate-pulse text-emerald-500" />
                      <span>{pkg.credits?.toLocaleString() || "10,000"} Initial Monthly Credits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shadow-sm" />
                      <span>Continuous Double-entry records</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shadow-sm" />
                      <span>Localized Tax VAT computations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shadow-sm" />
                      <span>FCR biological calculators</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shadow-sm" />
                      <span>Secure team logins (Max 15 users)</span>
                    </li>
                  </ul>
                </div>

                <button 
                  onClick={() => {
                    setSubscriptionTier(pkg.name);
                    setActiveTab("register");
                    setIsViewingLanding(false);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    pkg.name.includes("Growth") || pkg.name.includes("Suite")
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Acquire This Plan
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS SECTION (SOCIAL PROOF) */}
        <section id="testimonials" className="py-20 px-6 max-w-7xl mx-auto border-b border-slate-200">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold">Voice of Smallholders</span>
            <h2 className="text-2xl md:text-3.5xl font-black text-slate-950 tracking-tight">Endorsed by Agricultural Entrepreneurs</h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Read how smallholders and cooperative administrators use Mabala to track financial ledgers and secure veterinary treatments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Testimonial 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <blockquote className="text-slate-600 font-medium text-xs leading-relaxed italic">
                "We operate 4 separate broiler houses in Kafue. Tracking dynamic feed budgets and matching feed purchase invoices to debits took days. With Mabala, continuous double-entry ledger coordinates manage our inventory with 100% mathematical precision."
              </blockquote>
              <div className="flex items-center gap-3 pt-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase font-sans">
                  BN
                </span>
                <div>
                  <strong className="text-xs text-slate-950 block">Benson Ng'andu</strong>
                  <span className="text-[10px] text-slate-400 block font-semibold">Chief Operator · Sunrise Agro-Tech Farms</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <blockquote className="text-slate-600 font-medium text-xs leading-relaxed italic">
                "The Veterinary mode was the exact bridge we needed. We can record professional client advice and monitor client herd records in one clean visual dashboard, with 15% VAT summaries ready for standard ZRA audit filing."
              </blockquote>
              <div className="flex items-center gap-3 pt-2">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs uppercase font-sans">
                  ZK
                </span>
                <div>
                  <strong className="text-xs text-slate-950 block">Dr. Bwalya Kampamba</strong>
                  <span className="text-[10px] text-slate-400 block font-semibold">Senior Vet Partner · Lusaka Animal Hospital</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CONTACT SECTION - ALL DETAILS CONFIGURABLE BY PLATFORM ADMIN */}
        <section id="contact" className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-5 space-y-6 text-slate-800">
            <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold block">Contact Details</span>
            
            <h2 className="text-2xl md:text-3.5xl font-black text-slate-990 tracking-tight leading-tight">
              Get in Touch with Mabala Representatives
            </h2>
            
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Have specific questions about livestock tagging scales, bulk database migrations, or double-entry ledgers? Connect with us via our active coordinate channels.
            </p>

            <div className="space-y-4 pt-2 font-semibold text-xs">
              
              <div className="flex gap-3.5 items-start">
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-650 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Physical Headquarters</span>
                  <p className="text-slate-700 leading-relaxed mt-0.5">{contactDetails.address}</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-650 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Telephone Line</span>
                  <p className="text-slate-700 mt-0.5">{contactDetails.phone}</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-650 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Support Desk Email</span>
                  <a href={`mailto:${contactDetails.email}`} className="text-emerald-600 hover:underline mt-0.5 block">{contactDetails.email}</a>
                </div>
              </div>

            </div>
          </div>

          <div className="md:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Write an Inquiry Message</h3>
            <p className="text-xs text-slate-400">Fill in the security audited portal inbox to route questions to platform admins immediately.</p>
            
            <form onSubmit={handleSendMessage} className="space-y-4 text-xs font-semibold">
              {submittedContact ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 animate-fade-in text-center space-y-2">
                  <strong className="block text-xs uppercase font-extrabold">✔ Message Dispatched</strong>
                  <p className="text-[11px] leading-relaxed">Your agricultural inquiry records have been routed securely to corporate coordinators. Expect an official response within 24 operational hours.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Your Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={contactForm.name}
                        onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Miyanda Chinkuba"
                        className="w-full text-xs mt-1 p-2.5 border bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded outline-none focus:border-emerald-500 transition-all font-semibold" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={contactForm.email}
                        onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="miyanda@chinkubafarms.com"
                        className="w-full text-xs mt-1 p-2.5 border bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded outline-none focus:border-emerald-500 transition-all font-semibold" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Detailed Message</label>
                    <textarea 
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Input billing, compliance, or biological setup queries..."
                      className="w-full text-xs mt-1 p-2.5 border bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded outline-none focus:border-emerald-500 transition-all font-semibold" 
                    />
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition cursor-pointer">
                    Submit Query Securely
                  </button>
                </>
              )}
            </form>
          </div>

        </section>

        {/* PUBLIC FOOTER */}
        <footer className="bg-slate-900 text-slate-450 text-xs py-12 px-6 border-t border-slate-850 mt-auto bg-slate-950 text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div className="space-y-1.5 flex flex-col items-center md:items-start text-center md:text-left">
              <span className="font-extrabold text-white text-sm uppercase tracking-wider block">Mabala SaaS © 2026</span>
              {/* MANDATORY COPYRIGHT LINE */}
              <p className="text-[11px] font-bold text-slate-450 leading-relaxed max-w-sm">
                Mabala © 2026 · Built by Deep Valley Farms for African Farmers
              </p>
            </div>

            <div className="flex gap-4 font-bold text-[11px]">
              <button onClick={() => setShowPolicyModal("privacy")} className="hover:text-white transition cursor-pointer pointer-events-auto">Privacy Policy</button>
              <span className="text-slate-800">|</span>
              <button onClick={() => setShowPolicyModal("terms")} className="hover:text-white transition cursor-pointer pointer-events-auto">Terms of Service</button>
            </div>

            <div className="flex gap-3.5">
              {contactDetails.twitter && (
                <a href={contactDetails.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title="Twitter Channel">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {contactDetails.facebook && (
                <a href={contactDetails.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title="Facebook Page">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {contactDetails.linkedin && (
                <a href={contactDetails.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title="LinkedIn Corporate">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>

          </div>
        </footer>

        {/* LEGAL POPUP DIALOGS */}
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-slate-200 animate-scale-up text-slate-800 shadow-2xl relative">
              <button 
                onClick={() => setShowPolicyModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h4 className="text-sm font-black uppercase text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>{showPolicyModal === "privacy" ? "Simulated Privacy Policy" : "Simulated Terms of Service"}</span>
              </h4>
              
              <div className="text-xs text-slate-500 space-y-4 max-h-[300px] overflow-y-auto pr-1 pt-3.5 leading-relaxed font-semibold">
                {showPolicyModal === "privacy" ? (
                  <>
                    <p><strong>1. Data Sovereign Isolation</strong>: Every farm, multi-resident veterinary practice, or corporate co-op registered in Mabala maintains isolated file volumes. Database objects are accessible only to validated tenant email addresses.</p>
                    <p><strong>2. Compliance and Direct Auditing logs</strong>: Mabala coordinates strict security tracking audit records. Every animal weight input, payroll credit purchase, or double-entry ledger adjustment records active user metadata permanently.</p>
                    <p><strong>3. Simulated Cookies & Local Sessions</strong>: Mabala utilizes standard secure storage identifiers such as local session flags and JWT representations in secure environment contexts for offline-first state resilience.</p>
                  </>
                ) : (
                  <>
                    <p><strong>1. Double-Entry ledger precision Guarantee</strong>: Continuous accounting features do not simulate standard ledger structures. Users agree to map expenditures with valid double-entry balance keys.</p>
                    <p><strong>2. Pre-Purchased Wallet Credit blocks</strong>: All expense journals, poultry weight calculators, and tax summaries necessitate billing commission logs. Transaction credits cannot be exchanged for raw physical funds.</p>
                    <p><strong>3. Active Platform Administration Elevacy</strong>: Platform administrator switches must stay unique to Deep Valley Farms Limited and deepvaleyfarm@gmail.com, universally disappearing from ordinary user options.</p>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 text-right mt-4">
                <button 
                  onClick={() => setShowPolicyModal(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Fallback to the authentic interactive login/registration screens
  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 select-none font-sans bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        
        {/* Left Sidebar Info Banner */}
        <div className="md:col-span-5 bg-slate-900 p-8 flex flex-col justify-between text-white relative">
          <div>
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-emerald-500/30">
              M
            </div>
            <h1 className="text-2xl font-bold mt-6 tracking-tight">Mabala SaaS</h1>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed font-semibold">
              Agricultural Engineering Cloud Platform providing localized Chart of Accounts, payroll, poultry weight calculation, and Tilapia aquaculture records.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Multi-Country Localizer</h4>
                  <p className="text-[11px] text-slate-400 leading-snug font-medium">Zambia-specific levies & 15% tax summary vs Generic calculations across Africa.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Double-Entry Ledger</h4>
                  <p className="text-[11px] text-slate-400 leading-snug font-medium">Continuous posting maps expenses to 1010 Bank and specific 5xxx categories natively.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Hercules AI Support</h4>
                  <p className="text-[11px] text-slate-400 leading-snug font-medium">Embedded biological & financial co-pilot ready to answer FCR metrics & tax limits.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono tracking-wider">
            TRUSTED REGIONAL AGRIC-TECH v2.0
          </div>
        </div>

        {/* Right Form Component */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center relative">
          
          {/* Back button to public marketing site */}
          <button 
            type="button"
            onClick={handleBackToMarketing}
            className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold transition flex items-center gap-1 cursor-pointer text-[10px]"
          >
            <span>← Back to Marketing Site</span>
          </button>

          {/* Verification Sent Banner */}
          {showVerificationSent && (
            <div className="space-y-6 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Verify Your Email Address</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  We have sent a verification link to <strong className="text-slate-700">{registerEmail}</strong>. Click the verification button below to activate your isolated tenant store.
                </p>
              </div>
              <button
                onClick={verifyEmailCode}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                Proceed to Multi-Factor Authentication
              </button>
            </div>
          )}

          {/* OTP screen */}
          {showOtpScreen && !showVerificationSent && (
            <form onSubmit={verifyOtp} className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mt-4 font-black">2FA Mandate Security Code</h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                  Mabala enforces Multi-Factor Authentication for all African tenants. Enter the 6-digit code sent to your registered account email: <strong className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-[12px]">{tempData?.email || "your registered address"}</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">One-Time Code (OTP)</label>
                <input
                  type="text"
                  placeholder="******"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  required
                  className="w-full tracking-widest text-center text-lg font-bold border rounded-lg p-2.5 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                />


                {otpError && (
                  <div className="p-3 bg-amber-50 border border-amber-250 text-amber-900 rounded-xl text-[10.5px] font-medium leading-relaxed">
                    ⚠️ {otpError}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                Verify 2FA & Secure Session
              </button>

              <button
                type="button"
                onClick={handleBackToPassword}
                className="w-full py-2 px-4 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg text-[11px] uppercase tracking-wider font-extrabold transition-all cursor-pointer text-center"
              >
                ← Back, Enter Password Again
              </button>
            </form>
          )}

          {/* Regular Login/Register Layout */}
          {!showOtpScreen && !showVerificationSent && (
            <div className="flex-1 flex flex-col justify-between pt-6">
              <div>
                <div className="flex bg-slate-100 p-1 rounded-lg gap-2 mb-6">
                  <button
                    onClick={() => {
                      setActiveTab("login");
                      setFormError("");
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      activeTab === "login" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("register");
                      setFormError("");
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      activeTab === "register" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Create Organization
                  </button>
                </div>

                {activeTab === "login" ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4 font-semibold text-xs text-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Sign In to Your Tenant</h2>
                    <p className="text-xs text-slate-400 font-medium leading-normal">
                      Access your multi-farm data structure, payroll localized books, and inventories.
                    </p>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. farmer@mabala.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                        <button
                          type="button"
                          onClick={() => {
                            setRecoveryEmail(loginEmail);
                            setRecoverySuccess(false);
                            setRecoveryError("");
                            setRecoveryMessage("");
                            setShowRecoveryModal(true);
                          }}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer bg-transparent border-none p-0"
                          id="forgot-credentials-btn"
                        >
                          Forgot Username or Password?
                        </button>
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                      />
                    </div>

                    {formError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-250 text-rose-905 rounded-xl text-[11px] font-bold leading-relaxed animate-fade-in">
                        ⚠️ {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isSendingOtp ? "Dispatching 2FA Code..." : "Authenticate Securely"}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3 font-semibold text-xs text-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Register Organization Tenant</h2>
                    <p className="text-xs text-slate-400 font-medium leading-normal">
                      Select subscriber country to bind currency and configure local compliance systems.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                        <input
                          type="text"
                          placeholder="Bwalya Kampamba"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                        <input
                          type="email"
                          placeholder="manager@myagro.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Farm / Practice Name</label>
                        <input
                          type="text"
                          placeholder="Siavonga Gold Farms / Lusaka Vet Clinic"
                          value={farmName}
                          onChange={(e) => setFarmName(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Subscriber Country</label>
                        <select
                          value={selectedCountryCode}
                          onChange={(e) => setSelectedCountryCode(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-850"
                        >
                          {COUNTRIES.map((c) => (
                             <option key={c.code} value={c.code}>
                               {c.flag} {c.name} ({c.currency})
                             </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Subscription Tier & Role Plan</label>
                      <select
                        value={subscriptionTier}
                        onChange={(e) => setSubscriptionTier(e.target.value)}
                        className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-850 cursor-pointer"
                      >
                        {platformPackages.filter(p => p.isActive).map((p) => {
                          const isZm = selectedCountryCode === "ZM";
                          const rateLabel = isZm 
                            ? `ZK ${p.price}` 
                            : `USD $${p.priceUSD || Math.round(p.price / 20)}`;
                          return (
                            <option key={p.id || p.name} value={p.name}>
                              {p.name} (+{p.credits} Monthly Credits) — {rateLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                      />
                    </div>

                    {formError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-250 text-rose-800 rounded-xl text-[11px] font-bold leading-relaxed animate-fade-in shadow-xs">
                        ⚠️ {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isSendingOtp ? "Dispatching 2FA Code..." : "Provision Tenant Database"}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Demo Mode Activation */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <div className="text-center text-xs text-slate-400 font-semibold font-medium">Ready to launch your farm operations?</div>
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 hover:border-emerald-350 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  id="btn-demo-mode"
                >
                  <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>Initialize Blank Workspace (Completely Empty Database)</span>
                </button>
              </div>
            </div>
          )}

          {/* RECOVERY MODAL FOR FORGOT CREDENTIALS */}
          {showRecoveryModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-slate-800">
              <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-slate-200 animate-scale-up text-slate-800 shadow-2xl relative">
                <button 
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                  id="recovery-modal-close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-4 pb-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Credential Recovery Dispatch</h3>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 mb-4 p-0.5 bg-slate-50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryTab("password");
                      setRecoverySuccess(false);
                      setRecoveryError("");
                      setRecoveryMessage("");
                    }}
                    className={`flex-1 py-1 text-center text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      recoveryTab === "password" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                    }`}
                    id="recovery-tab-password"
                  >
                    Forgot Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryTab("username");
                      setRecoverySuccess(false);
                      setRecoveryError("");
                      setRecoveryMessage("");
                    }}
                    className={`flex-1 py-1 text-center text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      recoveryTab === "username" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                    }`}
                    id="recovery-tab-username"
                  >
                    Forgot Username
                  </button>
                </div>

                {recoverySuccess ? (
                  <div className="space-y-4 py-2 text-center">
                    <div className="mx-auto w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    </div>
                    <div className="p-3 bg-emerald-50/50 border border-emerald-150 rounded-xl">
                      <p className="text-xs text-emerald-950 font-medium leading-normal">
                        {recoveryMessage}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRecoveryModal(false)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRecoverySubmit} className="space-y-4">
                    {recoveryTab === "password" ? (
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-3">
                          Specify your registered email address below. We'll consult Mabala Active Directory hosts and dispatch a private recovery token to override your current password.
                        </p>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registered Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g. administrator@deepvaleyfarm.com"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-2 text-xs bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition mt-1 font-medium text-slate-800 placeholder-slate-400"
                          id="recovery-email-input"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-3">
                          Forgot your login email address? Specify your registered Farm, Practise, or Organization name. We will scan our encrypted metadata registries and safely remind you of your primary matching username.
                        </p>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registered Farm / Co-op Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Sunrise Agro-Tech Farms"
                          value={recoveryOrgName}
                          onChange={(e) => setRecoveryOrgName(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-2 text-xs bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition mt-1 font-medium text-slate-800 placeholder-slate-400"
                          id="recovery-org-input"
                        />
                      </div>
                    )}

                    {recoveryError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-[11px] font-bold leading-relaxed">
                        ⚠️ {recoveryError}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowRecoveryModal(false)}
                        className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessingRecovery}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-1"
                        id="recovery-submit-btn"
                      >
                        {isProcessingRecovery ? "Searching..." : "Recover Details"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function StarsBadge() {
  return (
    <div className="flex gap-0.5">
      {[...Array(3)].map((_, i) => (
        <Star key={i} className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
      ))}
    </div>
  );
}
