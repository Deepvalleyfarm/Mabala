import React, { useState, useEffect } from "react";
import { 
  LineChart, 
  LayoutDashboard, 
  BookOpen, 
  Receipt, 
  Compass, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  DollarSign, 
  Waves, 
  Egg, 
  Boxes, 
  UserSquare2,
  FileText,
  Shield,
  Database,
  Coins,
  Package,
  History,
  Store,
  Heart,
  Tractor,
  Beef,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { PredefinedRole, OptionalModulePermission } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isReadonly: boolean;
  onTopUp: () => void;
  credits: number;
  currentRole: PredefinedRole;
  rolePermissions: { [moduleId: string]: OptionalModulePermission };
  userEmail: string;
  subscriptionTier: string;
  workspaceMode: "Farmer" | "Veterinary";
  activeFarmName: string;
  onOpenAnimalWizard?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isReadonly, 
  onTopUp, 
  credits,
  currentRole,
  rolePermissions,
  userEmail,
  subscriptionTier,
  workspaceMode,
  activeFarmName,
  onOpenAnimalWizard
}: SidebarProps) {

  // Define 12 Farmer-focused logical categories
  const categories = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      tabId: "dashboard"
    },
    {
      id: "livestock",
      label: "Livestock Management",
      icon: Beef,
      subItems: [
        { id: "livestock", label: "Animal Profiles & List" },
        { id: "livestock-registry", label: "Register Animal (Wizard)" } // Launches registration wizard
      ]
    },
    {
      id: "poultry",
      label: "Poultry Management",
      icon: Egg,
      subItems: [
        { id: "poultry", label: "Poultry Flocks & Batches" }
      ]
    },
    {
      id: "crops",
      label: "Crops & Field Ops",
      icon: Compass,
      subItems: [
        { id: "crops", label: "Crop Cycles & Blocks" }
      ]
    },
    {
      id: "finance",
      label: "Finance Hub",
      icon: Coins,
      subItems: [
        { id: "finance-hub", label: "Mabala Finance & Wallet" },
        { id: "expenses", label: "Expenses Ledger" },
        { id: "invoices", label: "Invoices & Quotations" },
        { id: "assets", label: "Biological Asset Register" },
        { id: "accounts", label: "Chart of Accounts" }
      ]
    },
    {
      id: "sales-mkt",
      label: "Sales & Marketplace",
      icon: Store,
      subItems: [
        { id: "sales", label: "Sales & Customers" },
        { id: "marketplace", label: "Vendor Marketplace" }
      ]
    },
    {
      id: "inventory",
      label: "Inventory & Stock",
      icon: Boxes,
      subItems: [
        { id: "inventory", label: "Inventory Stockroom" }
      ]
    },
    {
      id: "hr",
      label: "Human Resources",
      icon: Users,
      subItems: [
        { id: "payroll", label: "Employees & Payroll" }
      ]
    },
    {
      id: "machinery",
      label: "Machines & Tractor",
      icon: Tractor,
      subItems: [
        { id: "assets", label: "Equipment Asset Log" }
      ]
    },
    {
      id: "veterinary",
      label: "Veterinary Services",
      icon: Heart,
      tabId: "veterinary"
    },
    {
      id: "reports-group",
      label: "Reports & Analytics",
      icon: FileSpreadsheet,
      tabId: "reports"
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      subItems: [
        { id: "profile", label: "User & Farm Settings" },
        { id: "permissions", label: "Roles & Permission" },
        { id: "backup-restore", label: "Data Backup & Restore" },
        { id: "audit-archive", label: "Audit Trails" }
      ]
    }
  ];

  // If Platform Administrator, append Platform Admin category
  const isAdmin = userEmail === "deepvaleyfarm@gmail.com" || currentRole === "Platform Administrator";
  const displayedCategories = [...categories];
  if (isAdmin) {
    displayedCategories.push({
      id: "platform-admin-group",
      label: "Platform Admin",
      icon: Shield,
      tabId: "platform-admin"
    });
  }

  // Check sub-item filtering based on permissions & isolations
  const isTabAllowed = (tabId: string) => {
    // If in veterinary workspace view, restrict to vet & configs
    if (workspaceMode === "Veterinary") {
      return (
        tabId === "veterinary" ||
        tabId === "profile" ||
        tabId === "platform-admin" ||
        tabId === "backup-restore" ||
        tabId === "audit-archive" ||
        tabId === "permissions"
      );
    }

    // Farmer Mode - hide veterinary suite (rendered inside Livestock/Poultry panels when needed, but veterinary main component is restricted)
    if (tabId === "veterinary") return false;

    if (
      tabId === "dashboard" || 
      tabId === "permissions" || 
      tabId === "profile" || 
      tabId === "platform-admin" ||
      tabId === "backup-restore" ||
      tabId === "finance-hub" ||
      tabId === "assets" ||
      tabId === "marketplace" ||
      tabId === "audit-archive" ||
      tabId === "accounts" ||
      tabId === "expenses" ||
      tabId === "invoices" ||
      tabId === "sales" ||
      tabId === "crops" ||
      tabId === "payroll" ||
      tabId === "livestock" ||
      tabId === "poultry" ||
      tabId === "inventory" ||
      tabId === "reports"
    ) {
      // Check specific role permissions
      const perm = rolePermissions[tabId];
      if (perm) return perm.read;
      return true;
    }
    return true;
  };

  // State to hold which category folder is open
  const [openCategory, setOpenCategory] = useState<string | null>(() => {
    const activeCat = displayedCategories.find(c => 
      c.tabId === activeTab || 
      (c.subItems && c.subItems.some(sub => sub.id === activeTab))
    );
    return activeCat ? activeCat.id : "dashboard";
  });

  // Expand properly if activeTab changes from outside
  useEffect(() => {
    const matchingCat = displayedCategories.find(c => 
      c.tabId === activeTab || 
      (c.subItems && c.subItems.some(sub => sub.id === activeTab))
    );
    if (matchingCat) {
      setOpenCategory(matchingCat.id);
    }
  }, [activeTab]);

  const handleCategoryClick = (cat: typeof categories[0]) => {
    if (cat.tabId) {
      // Direct navigation
      if (isTabAllowed(cat.tabId)) {
        setActiveTab(cat.tabId);
        setOpenCategory(cat.id);
      }
    } else if (cat.subItems) {
      const isExpanded = openCategory === cat.id;
      setOpenCategory(isExpanded ? null : cat.id);
      
      // Auto-clicks the first allowed sub-item if opening
      if (!isExpanded) {
        const firstAllowed = cat.subItems.find(sub => isTabAllowed(sub.id));
        if (firstAllowed) {
          if (firstAllowed.id === "livestock-registry") {
            if (onOpenAnimalWizard) onOpenAnimalWizard();
          } else {
            setActiveTab(firstAllowed.id);
          }
        }
      }
    }
  };

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-screen border-r border-slate-800 text-white select-none shrink-0" id="mabala-sidebar">
      {/* Platform Branding */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/60 font-sans">
        <div className="w-9 h-9 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Soft medium-green colored circular background */}
            <circle cx="50" cy="50" r="48" fill="#5A9E6F" />
            <path d="M50 78C50 78 48 55 48 48C48 38 34 28 34 28C34 28 30 42 41 51C47 55 50 78 50 78Z" fill="white" />
            <path d="M50 78C50 78 52 55 52 48C52 38 66 28 66 28C66 28 70 42 59 51C53 55 50 78 50 78Z" fill="white" />
            <path d="M50 82V35" stroke="white" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <span className="text-white font-bold text-xl tracking-tight block font-sans">Mabala</span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block font-mono">Agro OS</span>
        </div>
      </div>

      {/* Dynamic Profile Badge inside Sidebar */}
      <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/30 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black shrink-0">
            {currentRole === "Platform Administrator" ? "PA" : currentRole === "Farm Owner" ? "FO" : currentRole === "Veterinary Doctor" ? "VT" : "W"}
          </div>
          <div className="min-w-0 font-sans">
            <span className="text-[9px] text-slate-500 block font-mono font-semibold uppercase leading-none pb-0.5">Role / Plan</span>
            <span className="text-xs text-slate-100 font-bold truncate block">{currentRole}</span>
            <span className="text-[10px] text-emerald-400 font-semibold truncate block">{subscriptionTier}</span>
          </div>
        </div>

        {subscriptionTier.includes("Veterinary") || subscriptionTier.includes("Agro-Vet") ? (
          <div className="pt-2 border-t border-slate-800 text-[10px] flex items-center justify-between font-semibold">
            <span className="text-slate-500 uppercase tracking-widest text-[8px] font-mono font-bold">Workspace View</span>
            <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 border border-indigo-500/35 rounded font-mono uppercase text-[9px] font-bold">
              {workspaceMode}
            </span>
          </div>
        ) : null}
      </div>

      {/* Credit Balance Card */}
      <div className="mx-4 my-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40 flex flex-col gap-2 font-sans">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Credits Pool</span>
          <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
            credits === 0 ? "bg-rose-500 text-white" : credits < 50 ? "bg-amber-500 text-black" : "bg-emerald-500/20 text-emerald-400"
          }`}>
            {credits}
          </span>
        </div>
        <button 
          onClick={onTopUp}
          className="w-full py-1 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-[10px] font-bold text-white transition-all cursor-pointer"
        >
          Top Up Wallet
        </button>
      </div>

      {/* 12 Grouped Accordion Navigation Sections */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent font-sans">
        {displayedCategories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeTab === cat.tabId || (cat.subItems && cat.subItems.some(sub => sub.id === activeTab));
          const isExpanded = openCategory === cat.id;

          // Check if category is allowed at all
          const isCategoryVisible = cat.tabId 
            ? isTabAllowed(cat.tabId) 
            : (cat.subItems && cat.subItems.some(sub => isTabAllowed(sub.id)));

          if (!isCategoryVisible) return null;

          return (
            <div key={cat.id} className="space-y-0.5">
              <button
                onClick={() => handleCategoryClick(cat)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isSelected 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-500"}`} />
                  <span>{cat.label}</span>
                </div>
                {cat.subItems && (
                  isExpanded 
                    ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {/* Sub-menu rendering if expanded */}
              {cat.subItems && isExpanded && (
                <div className="pl-6.5 pr-2 py-1 space-y-1 border-l border-slate-800/80 ml-5">
                  {cat.subItems.map((sub) => {
                    const isSubAllowed = isTabAllowed(sub.id);
                    if (!isSubAllowed) return null;

                    const isSubActive = activeTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          if (sub.id === "livestock-registry") {
                            if (onOpenAnimalWizard) onOpenAnimalWizard();
                          } else {
                            setActiveTab(sub.id);
                          }
                        }}
                        className={`w-full text-left py-1.5 px-2 rounded-md text-[11px] block transition-all font-semibold ${
                          isSubActive 
                            ? "bg-emerald-600/15 text-emerald-400 font-extrabold" 
                            : sub.id === "livestock-registry" 
                              ? "text-emerald-500 font-extrabold hover:text-emerald-400 hover:underline"
                              : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono tracking-wider">
        <div>MABALA FARM WORKER CORE</div>
        <div className="text-slate-600">EASY OS MODE</div>
      </div>
    </aside>
  );
}
