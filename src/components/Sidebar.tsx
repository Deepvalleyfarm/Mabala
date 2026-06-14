import React from "react";
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
  Store
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
  activeFarmName
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "marketplace", label: "Vendor Marketplace", icon: Store },
    { id: "accounts", label: "Chart of Accounts", icon: BookOpen },
    { id: "expenses", label: "Expenses Ledger", icon: Receipt },
    { id: "finance-hub", label: "Finance & Loans Hub", icon: Coins },
    { id: "assets", label: "Asset Register", icon: Package },
    { id: "crops", label: "Crop Cycles", icon: Compass },
    { id: "payroll", label: "Payroll localizer (Pro)", icon: Users },
    { id: "sales", label: "Sales Tracker", icon: DollarSign },
    { id: "invoices", label: "Invoices & Quotes", icon: FileText },
    { id: "livestock", label: "Livestock Records", icon: UserSquare2 },
    { id: "poultry", label: "Poultry Batches", icon: Egg },
    { id: "aquaculture", label: "Aquaculture Systems", icon: Waves },
    { id: "inventory", label: "Inventory & Stock", icon: Boxes },
    { id: "reports", label: "Financial Reports", icon: FileSpreadsheet },
    { id: "permissions", label: "Access & Roles", icon: Shield },
    { id: "backup-restore", label: "Backup & Restore", icon: Database },
    { id: "audit-archive", label: "Audit Logs & Archive", icon: History },
    { id: "profile", label: "User & Farm Profiles", icon: Settings }
  ];

  if (userEmail === "deepvaleyfarm@gmail.com" || currentRole === "Platform Administrator") {
    menuItems.push({ id: "platform-admin", label: "🏢 Switch to Platform Admin", icon: Settings });
  }

  // Dynamically filter menu items based on assigned role permissions
  const allowedMenuItems = menuItems.filter((item) => {
    if (
      item.id === "dashboard" || 
      item.id === "permissions" || 
      item.id === "profile" || 
      item.id === "platform-admin" ||
      item.id === "backup-restore" ||
      item.id === "finance-hub" ||
      item.id === "assets" ||
      item.id === "marketplace" ||
      item.id === "audit-archive"
    ) return true;
    const perm = rolePermissions[item.id];
    return perm ? perm.read : true;
  });

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-screen border-r border-slate-800 text-white select-none shrink-0" id="mabala-sidebar">
      {/* Platform Branding */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/60 font-sans">
        <div className="w-9 h-9 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Soft medium-green colored circular background */}
            <circle cx="50" cy="50" r="48" fill="#5A9E6F" />
            
            {/* Left Leaf branch */}
            <path d="M50 78C50 78 48 55 48 48C48 38 34 28 34 28C34 28 30 42 41 51C47 55 50 78 50 78Z" fill="white" />
            
            {/* Right Leaf branch */}
            <path d="M50 78C50 78 52 55 52 48C52 38 66 28 66 28C66 28 70 42 59 51C53 55 50 78 50 78Z" fill="white" />
            
            {/* Central clean stem line to solidify design */}
            <path d="M50 82V35" stroke="white" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <span className="text-white font-bold text-xl tracking-tight block font-sans">Mabala</span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block font-mono">Agro ERP</span>
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
              {workspaceMode} Mode
            </span>
          </div>
        ) : null}
      </div>

      {/* Credit Balance Card */}
      <div className="mx-4 my-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700/50 flex flex-col gap-2 font-sans">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Credits</span>
          <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
            credits === 0 ? "bg-rose-500 text-white" : credits < 50 ? "bg-amber-500 text-black" : "bg-emerald-500/20 text-emerald-400"
          }`}>
            {credits}
          </span>
        </div>
        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${credits === 0 ? "bg-rose-500" : credits < 50 ? "bg-amber-400" : "bg-emerald-400"}`} 
            style={{ width: `${Math.min((credits / 800) * 100, 100)}%` }}
          />
        </div>
        <button 
          onClick={onTopUp}
          className="w-full py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all rounded-lg text-xs font-bold text-white shadow font-sans cursor-pointer"
        >
          Top Up Credits
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent font-sans">
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                isActive 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-800/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
              id={`sidebar-tab-${item.id}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
        <div>MULTI-TENANT SAAS</div>
        <div className="text-slate-600">ROLE-SIM: ENABLED</div>
      </div>
    </aside>
  );
}
