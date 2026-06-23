import React, { useState, useEffect } from "react";
import { 
  ArrowRight, 
  Check, 
  MapPin, 
  Phone, 
  Mail, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Layers, 
  Zap, 
  Users, 
  ShieldAlert,
  Coins,
  ArrowUpRight,
  Sparkles,
  Info,
  Calendar,
  X
} from "lucide-react";

export interface AdCampaign {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
  placement: "banner" | "sidebar" | "interstitial";
  active: boolean;
}

interface LandingPageProps {
  platformPackages: any[];
  contactDetails: {
    email: string;
    phone: string;
    address: string;
    twitter: string;
    facebook: string;
    linkedin: string;
  };
  activeAds: AdCampaign[];
  onSignUp: () => void;
  onSignIn: () => void;
  onStartDemo: () => void;
}

export default function LandingPage({
  platformPackages,
  contactDetails,
  activeAds,
  onSignUp,
  onSignIn,
  onStartDemo
}: LandingPageProps) {
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [currentInterstitialAd, setCurrentInterstitialAd] = useState<AdCampaign | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Trigger interstitial on mount if any active interstitial ad is loaded
  useEffect(() => {
    const interstitialAd = activeAds.find(ad => ad.active && ad.placement === "interstitial");
    if (interstitialAd) {
      setCurrentInterstitialAd(interstitialAd);
      // Automatically show interstitial with a minor delay for better UX feel
      const timer = setTimeout(() => {
        setShowInterstitial(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activeAds]);

  // Filters for active ads
  const activeBanners = activeAds.filter(ad => ad.active && ad.placement === "banner");
  const activeSidebars = activeAds.filter(ad => ad.active && ad.placement === "sidebar");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-emerald-500 selection:text-white" id="mabala-public-landing-page">
      
      {/* Top Configurable Banner Ads */}
      {activeBanners.length > 0 && (
        <div className="bg-emerald-900 text-white py-2.5 px-4 text-center text-xs font-semibold relative animate-pulse flex items-center justify-center gap-2 border-b border-emerald-850">
          <span className="bg-amber-400 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">AD PROMO</span>
          {activeBanners.map(ad => (
            <a 
              key={ad.id} 
              href={ad.externalUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline flex items-center gap-1 cursor-pointer"
            >
              <strong>{ad.title}</strong> — {ad.description}
              <ArrowUpRight className="w-3.5 h-3.5 inline text-emerald-300" />
            </a>
          ))}
        </div>
      )}

      {/* Primary Header/Navbar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-emerald-600/30">
              M
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900 block leading-none">Mabala SaaS</span>
              <span className="text-[9px] font-bold text-emerald-700 tracking-widest uppercase font-mono mt-0.5 block">ERP & Biotech Suite</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-black uppercase text-slate-600 tracking-wider">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing Options</a>
            <a href="#testimonials" className="hover:text-emerald-600 transition-colors">Testimonials</a>
            <a href="#contact" className="hover:text-emerald-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={onSignIn}
              className="px-4 py-2 hover:bg-slate-100 text-slate-850 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              id="landing-signin-btn"
            >
              Sign In
            </button>
            <button 
              onClick={onSignUp}
              className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              id="landing-signup-btn"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Structural Layout */}
      <main className="flex-grow">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-24 px-6 bg-gradient-to-b from-white via-slate-50 to-slate-100">
          {/* Decorative background grid and circles */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70"></div>
          
          <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Content */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-800 font-bold text-xs uppercase font-mono tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Next-Gen Agricultural Engineering Cloud</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-950 leading-tight">
                Modernize Your Farm with <span className="text-emerald-600">Enterprise Integrity.</span>
              </h1>
              
              <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl font-semibold">
                An all-in-one platform custom engineered for African growers and clinics. Leverage double-entry general ledger books, local statutory tax payroll tools, precision poultry analytics, and automated Tilapia feed regulators in one unified workspace.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <button 
                  onClick={onSignUp}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 hover:shadow-2xl hover:translate-y-[-1px] transition-all cursor-pointer text-center"
                >
                  Create Organization Account
                </button>
                <button 
                  onClick={onStartDemo}
                  className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 text-sm font-black uppercase tracking-widest rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="landing-hero-demo-btn"
                >
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>Launch Free Live Demo</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                <div>
                  <span className="block text-2xl md:text-3xl font-black text-slate-950">ZMW (ZK)</span>
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mt-1">Zambian Payroll Matcher</span>
                </div>
                <div>
                  <span className="block text-2xl md:text-3xl font-black text-slate-950">15% VAT</span>
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mt-1">Compliance Auditor</span>
                </div>
                <div>
                  <span className="block text-2xl md:text-3xl font-black text-slate-950">2FA Sec</span>
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mt-1">Mandated Security</span>
                </div>
              </div>
            </div>

            {/* Right Column Layout: Hero visual + advertisement sidebar */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
                <span className="p-1 px-2.5 bg-slate-950 text-white font-bold text-[9px] uppercase rounded-full font-mono tracking-wider select-none inline-block mb-4">Mabala Core Dashboard Live</span>
                
                <div className="space-y-4 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-600 font-bold">Z</div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">Chart of Accounts</span>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">Double-Entry Ledger v2</span>
                      </div>
                    </div>
                    <span className="font-mono text-emerald-600 font-bold">1010 Bank Active ✔</span>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 font-bold">P</div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">Payroll and statutory Levies</span>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">Zambia ZMW PAYE, NAPSA, NHIMA</span>
                      </div>
                    </div>
                    <span className="font-mono text-indigo-600 font-bold">Tax Compliant ✔</span>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-500 font-bold">L</div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">Livestock & Veterinary records</span>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">Herd Logs, Vaccination Tracker</span>
                      </div>
                    </div>
                    <span className="font-mono text-rose-600 font-bold">Clinical Tracker ✔</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-emerald-900 text-white rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-amber-400 text-slate-950 font-bold text-[8px] uppercase tracking-wider font-mono">STABILITY</div>
                  <h4 className="text-xs font-black tracking-wider uppercase">Isolated tenant databases</h4>
                  <p className="text-[10px] text-emerald-150 leading-relaxed mt-1">Multi-user enterprise grade system with localized security keys holding separate ledger caches.</p>
                </div>
              </div>

              {/* Sidebar Configurable Campaign Placement */}
              {activeSidebars.length > 0 && (
                <div className="mt-6 bg-amber-50/70 border border-amber-200/50 rounded-2xl p-4 space-y-3 shadow-md">
                  <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded text-[8px] font-extrabold uppercase font-mono tracking-wider">ADVERTISING PARTNER</span>
                  {activeSidebars.map(ad => (
                    <a 
                      key={ad.id} 
                      href={ad.externalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block group hover:bg-white p-2.5 rounded-xl border border-transparent hover:border-amber-200 transition-all cursor-pointer"
                    >
                      <div className="flex gap-3 items-center">
                        {ad.imageUrl && (
                          <img 
                            src={ad.imageUrl} 
                            alt={ad.title} 
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-lg object-cover bg-slate-200 shrink-0" 
                          />
                        )}
                        <div>
                          <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-1 group-hover:text-emerald-700 transition-colors">
                            <span>{ad.title}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 inline text-slate-450 group-hover:translate-x-0.5 transition-transform" />
                          </h5>
                          <p className="text-[10px] text-slate-500 font-medium pt-0.5">{ad.description}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* FEATURES OVERVIEW */}
        <section id="features" className="py-24 px-6 bg-white border-y border-slate-200/50">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase rounded-full font-mono tracking-wider">Modular Platform Architectural Capabilities</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Streamlined Agricultural Intelligence</h2>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                Take command of all commercial operations with modular setups curated specifically to ensure high double-entry precision and livestock audit safety.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 hover:bg-slate-50/30 hover:shadow-lg transition-all space-y-4">
                <span className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-emerald-800 text-sm font-mono">01</span>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">Double-Entry Financial General Ledger</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                  Continuous multi-currency ledger automatic balancing. Maps expense vouchers, receipt entries, payroll statutory deductions, and invoice outputs directly into compliant asset accounts.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 hover:bg-slate-50/30 hover:shadow-lg transition-all space-y-4">
                <span className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-emerald-800 text-sm font-mono">02</span>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">Localized Statutory Payroll Localizer</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                  Deducts exactly 15% VAT on commercial trades paired with compliant Zambian NAPSA, NHIMA, and PAYE income tax brackets with integrated payslip downloads.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 hover:bg-slate-50/30 hover:shadow-lg transition-all space-y-4">
                <span className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-800 text-sm font-mono">03</span>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">Multi-Vet practice Clinic modules</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                  Empower modern veterinary doctors to schedule vaccination charts, tag unique heads of cattle, manage critical antibiotic stocks, and draft consult invoices with standard rate card commissions.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 hover:bg-slate-50/30 hover:shadow-lg transition-all space-y-4">
                <span className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-800 text-sm font-mono">04</span>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">Poultry Batch Feed & Growth Metrics</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                  Calculate weight charts, feed conversion ratios (FCRs), mortality percentages, and map active egg collections with daily flock logs to calculate production ROI.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 hover:bg-slate-50/30 hover:shadow-lg transition-all space-y-4">
                <span className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-800 text-sm font-mono">05</span>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">Tilapia Aquaculture System Tracker</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                  Keep continuous logs of water temperatures, dissolved oxygen levels, biomass estimates, and automated sampling to maximize fish growth rates.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 hover:bg-slate-50/30 hover:shadow-lg transition-all space-y-4">
                <span className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-emerald-800 text-sm font-mono">06</span>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">Average-Cost Inventory Engine</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                  Auto-adjust stock inventories when invoicing customers. Triggers warning triggers upon critical stock counts to prevent operations suspension.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION - PULLED LIVE */}
        <section id="pricing" className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="p-1 px-2.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase rounded-full font-mono tracking-wider">Flexible subscription structures</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Platform Connection Pricing</h2>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                Select from standard connection levels matching your agro-operation size. Synchronized with live admin parameters.
              </p>

              {/* BILLING TOGGLE */}
              <div className="flex justify-center items-center gap-3 pt-2">
                <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-emerald-700" : "text-slate-400"}`}>Monthly Billing</span>
                <button
                  type="button"
                  onClick={() => setBillingCycle(prev => prev === "monthly" ? "yearly" : "monthly")}
                  className="w-12 h-6 bg-emerald-600 rounded-full p-1 relative transition-all duration-300 focus:outline-none flex items-center"
                  aria-label="Toggle Billing Period"
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"}`} />
                </button>
                <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-emerald-700" : "text-slate-400"}`}>
                  <span>Yearly Billing</span>
                  <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse">SAVE UP TO 15%</span>
                </span>
              </div>
            </div>

            {/* PACKAGE CARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {platformPackages
                .filter(pkg => {
                  return pkg.id === "PLAN_FREE" || pkg.id === "PLAN_HARVESTER" || pkg.id === "PLAN_ENTERPRISE";
                })
                .map((pkg) => {
                  const isPopular = pkg.id === "PLAN_HARVESTER";
                  const isEnterprise = pkg.id === "PLAN_ENTERPRISE";
                  const isDaily = pkg.id === "PLAN_DAILY";

                  // Evaluate prices & discounts dynamically
                  let displayPrice = pkg.price;
                  let billingText = isDaily ? "/day" : "/month";
                  let discountText = "";
                  
                  if (billingCycle === "yearly") {
                    if (pkg.yearly_price_zmw) {
                      displayPrice = pkg.yearly_price_zmw;
                      billingText = "/year";
                      if (pkg.id === "PLAN_HARVESTER") {
                        discountText = "10% Off — Save ZMW 180/year";
                      } else if (pkg.id === "PLAN_ENTERPRISE") {
                        discountText = "15% Off — Save ZMW 4,500/year";
                      } else {
                        const savings = (pkg.price * 12) - pkg.yearly_price_zmw;
                        discountText = `Discounted — Save ZMW ${savings}/year`;
                      }
                    }
                  }

                  // Target Audience mapping
                  let targetAudience = "Farmers & Vet Practitioners";
                  if (isEnterprise) {
                    targetAudience = "Commercial Farmers";
                  }

                  return (
                    <div 
                      key={pkg.id} 
                      className={`bg-white rounded-3xl p-8 border hover:shadow-xl transition-all flex flex-col justify-between space-y-6 relative ${
                        isPopular 
                          ? "border-emerald-500 ring-2 ring-emerald-550/10 shadow-lg" 
                          : "border-slate-200/80"
                      }`}
                    >
                      {isPopular && (
                        <span className="absolute top-0 right-8 transform -translate-y-1/2 bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider font-mono py-1 px-3 rounded-full shadow-md shadow-emerald-650/20">
                          Popular Choice
                        </span>
                      )}

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[8.5px] font-black uppercase rounded tracking-wider inline-block">
                            {targetAudience}
                          </span>
                          <h3 className="text-lg font-extrabold text-slate-900 pt-1.5">{pkg.name}</h3>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            {pkg.features || "Zambian localized farm management"}
                          </p>
                        </div>
                        
                        <div className="py-4 border-y border-slate-100 flex flex-col gap-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2.5xl font-black text-slate-950">ZMW {displayPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase">{billingText}</span>
                          </div>
                          {discountText && (
                            <span className="text-[10px] text-red-600 font-extrabold uppercase tracking-wide">
                              🎉 {discountText}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">Granted Credits Allotment:</span>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-300/20 rounded font-bold font-mono text-[11px] text-amber-800">
                            <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>
                              {isDaily ? "Unmetered Write Access" : `${pkg.credits?.toLocaleString()} write action credits included`}
                            </span>
                          </div>
                        </div>

                        {isEnterprise && (
                          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-300/10 text-amber-800 font-bold text-xs flex gap-2 animate-pulse">
                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Includes 2 Agronomist & 2 Vet clinic visits!</span>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={onSignUp}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          isPopular
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        }`}
                      >
                        Choose {pkg.name}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* AGRO VENDORS FREE ONBOARDING CALLOUT */}
            <div className="mt-16 pt-10 border-t border-slate-200/60 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-white p-8 rounded-3xl border">
              <div className="lg:col-span-2 space-y-3">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded font-mono font-black text-[9px] uppercase tracking-wider">
                  Vendor Network
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Are you an Agro Supplier or Vendor?</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Merchant listing onboardings are completely free! Map seeds, fertilizers, feeds, chemicals, formulations, veterinary drugs, or instruments with full clarity at no subscription rate. Instantly advertise catalogs straight to verified farmers across all provinces.
                </p>
              </div>
              <div className="lg:col-span-1 text-center lg:text-right">
                <button
                  onClick={onSignUp}
                  className="w-full lg:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition duration-300"
                >
                  Register as a Vendor (Free)
                </button>
              </div>
            </div>

            {/* VET PRACTITIONERS CLARIFICATION BANNER */}
            <div className="mt-8 bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4 text-xs leading-relaxed">
              <Info className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <strong className="text-indigo-900 block font-black uppercase tracking-wider text-[9px]">Vet Practitioners Notice</strong>
                <p className="text-indigo-750 font-semibold">
                  Veterinarians operate under the standard farmer pricing cards. No clinical premium tiers! Select the <strong className="text-indigo-950 font-sans">Daily Bundle</strong> or the <strong className="text-indigo-950 font-sans">Monthly Plan</strong> to access dynamic animal medical logging systems, client histories, movement tracks, and livestock records.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS PLACEHOLDER */}
        <section id="testimonials" className="py-24 px-6 bg-white border-t border-slate-200/50">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="p-1 px-2.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase rounded-full font-mono tracking-wider">Social proof in construction</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Trust Across the African Soil</h2>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                Discover how smallholders and clinical agro vets manage regulatory requirements and biological progress metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Testimonial Placeholder 1 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/50 space-y-4">
                <p className="text-slate-600 text-xs italic leading-relaxed font-semibold">
                  "Mabala transformed our standard cattle management and local payslip generation. Using the Zambia NHIMA and NAPSA tax calculator, we save over 10 hours of manual lookup every month."
                </p>
                <div className="flex gap-3 items-center">
                  <div className="w-9 h-9 rounded-full bg-slate-205 flex items-center justify-center font-black text-xs text-slate-700 shadow-inner">
                    MC
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Mulenga Chanda</h5>
                    <p className="text-[10px] text-slate-400 font-medium font-sans">Farm Admin, Mwamba Grazers</p>
                  </div>
                </div>
              </div>

              {/* Testimonial Placeholder 2 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/50 space-y-4">
                <p className="text-slate-600 text-xs italic leading-relaxed font-semibold">
                  "Perfect clinical accounting solver for veterinarians. The commission setup is incredibly easy, and we can tag individual livestock treatment files directly from the pasture."
                </p>
                <div className="flex gap-3 items-center">
                  <div className="w-9 h-9 rounded-full bg-slate-205 flex items-center justify-center font-black text-xs text-slate-700 shadow-inner">
                    SM
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Dr. Sampa Mwila</h5>
                    <p className="text-[10px] text-slate-400 font-medium font-sans">Lead Veterinarian, Sampa Vets Lusaka</p>
                  </div>
                </div>
              </div>

              {/* Testimonial Placeholder 3 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/50 space-y-4">
                <p className="text-slate-600 text-xs italic leading-relaxed font-semibold">
                  "The Tilapia Aquaculture parameter reports coupled with simple double entry are incredibly robust. Our farm inventory balance auto reconciles when feed is consumed."
                </p>
                <div className="flex gap-3 items-center">
                  <div className="w-9 h-9 rounded-full bg-slate-205 flex items-center justify-center font-black text-xs text-slate-700 shadow-inner">
                    PH
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Patrick Harrison</h5>
                    <p className="text-[10px] text-slate-400 font-medium font-sans">Operations Owner, Kariba Blue Aquaculture</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT SECTION - ALL DETAILS CONFIGURABLE */}
        <section id="contact" className="py-24 px-6 bg-slate-100 border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 font-sans">
            
            {/* Left Content Column */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-850 font-bold text-[10px] uppercase rounded-full font-mono tracking-wider inline-block">Configurable contact details</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-950 uppercase tracking-tight">Connect with our Platform Administry</h2>
              <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                Changes to these parameters take place immediately on this public landing page upon Platform Admin updates.
              </p>

              <div className="space-y-4 pt-4 text-xs font-semibold">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border text-slate-500 shrink-0">
                    <Mail className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Email Address</span>
                    <a href={`mailto:${contactDetails.email}`} className="text-slate-900 hover:underline">{contactDetails.email}</a>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border text-slate-500 shrink-0">
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Phone Number</span>
                    <a href={`tel:${contactDetails.phone}`} className="text-slate-900 hover:underline">{contactDetails.phone}</a>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border text-slate-500 shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Physical Address</span>
                    <span className="text-slate-900">{contactDetails.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Form Column */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-200 hover:shadow-xl transition-all">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-3 border-b mb-6">Send a secure inquiry</h3>
              <form onSubmit={(e) => { e.preventDefault(); alert("Platform inquiry sent successfully. Thank you!"); }} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase text-slate-400 font-bold block pb-1">Full Name</label>
                    <input type="text" placeholder="e.g. Samuel Mulenga" required className="w-full p-3 border rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-400 font-bold block pb-1">Email Address</label>
                    <input type="email" placeholder="e.g. sam@gmail.com" required className="w-full p-3 border rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold block pb-1">Message Subject</label>
                  <input type="text" placeholder="e.g. Account subscription details" required className="w-full p-3 border rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600" />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold block pb-1">Message Body</label>
                  <textarea placeholder="Write your inquiry here..." rows={4} required className="w-full p-3 border rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600"></textarea>
                </div>

                <button type="submit" className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl uppercase tracking-widest font-black text-[10px] shadow-md transition-all cursor-pointer">
                  Transmit Message
                </button>
              </form>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-slate-900 text-white py-12 px-6 border-t border-slate-950 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center font-extrabold text-slate-900 text-sm">
                M
              </div>
              <span className="font-extrabold tracking-tight text-white uppercase text-xs">Mabala SaaS Application</span>
            </div>
            
            {/* Required Copyright & Attribution Label exactly */}
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              Mabala © 2026 · Built by Deep Valley Farms for African Farmers
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
          </div>

          {/* Social media connections */}
          <div className="flex items-center gap-3">
            {contactDetails.twitter && (
              <a href={contactDetails.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-755 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all cursor-pointer" title="Twitter Link">
                <Twitter className="w-3.5 h-3.5" />
              </a>
            )}
            {contactDetails.facebook && (
              <a href={contactDetails.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-755 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all cursor-pointer" title="Facebook Link">
                <Facebook className="w-3.5 h-3.5" />
              </a>
            )}
            {contactDetails.linkedin && (
              <a href={contactDetails.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-755 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all cursor-pointer" title="LinkedIn Link">
                <Linkedin className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

        </div>
      </footer>

      {/* AD INTERSTITIAL MODAL */}
      {showInterstitial && currentInterstitialAd && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative animate-scale-up font-sans text-slate-800">
            
            <button 
              onClick={() => setShowInterstitial(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center hover:text-slate-900 transition-colors cursor-pointer z-15"
              title="Close advertisement"
            >
              <X className="w-4 h-4" />
            </button>

            {currentInterstitialAd.imageUrl && (
              <div className="relative h-64 bg-slate-900">
                <img 
                  src={currentInterstitialAd.imageUrl} 
                  alt={currentInterstitialAd.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-4 left-4 p-1 px-2.5 bg-amber-400 text-slate-950 font-bold text-[9px] uppercase rounded-full font-mono tracking-wider">
                  Featured Promotion
                </div>
              </div>
            )}

            <div className="p-6 space-y-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Special Announcement from our sponsor:</span>
              <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight">{currentInterstitialAd.title}</h3>
              <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                {currentInterstitialAd.description}
              </p>

              <div className="flex gap-2.5 pt-2 text-xs font-semibold">
                <button 
                  onClick={() => setShowInterstitial(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl uppercase tracking-wider text-[10px] font-black transition-colors cursor-pointer"
                >
                  Continue to site
                </button>
                <a 
                  href={currentInterstitialAd.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl uppercase tracking-wider text-[10px] font-black transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Explore promotion</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
