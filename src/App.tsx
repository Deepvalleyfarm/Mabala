import React, { useState, useEffect, useMemo, useRef } from "react";
import Sidebar from "./components/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import AiChatbot from "./components/AiChatbot";

// Sub-panels
import AccountsPanel from "./components/AccountsPanel";
import ExpensesPanel from "./components/ExpensesPanel";
import CropsPanel from "./components/CropsPanel";
import PayrollPanel from "./components/PayrollPanel";
import InvoicesPanel from "./components/InvoicesPanel";
import LivestockPoultryPanel from "./components/LivestockPoultryPanel";
import AquaculturePanel from "./components/AquaculturePanel";
import ReportsPanel from "./components/ReportsPanel";
import AccessControlPanel from "./components/AccessControlPanel";
import ProfilesPlatformPanel from "./components/ProfilesPlatformPanel";
import BackupRestorePanel from "./components/BackupRestorePanel";

import FinancePanel from "./components/FinancePanel";
import AssetRegisterPanel from "./components/AssetRegisterPanel";
import AuditArchivePanel from "./components/AuditArchivePanel";
import CsvImportPanel from "./components/CsvImportPanel";
import MarketplacePanel from "./components/MarketplacePanel";
import GlobalConfirmModal from "./components/GlobalConfirmModal";

import {
  INITIAL_VENDORS,
  INITIAL_PRODUCTS,
  INITIAL_RIDERS,
  INITIAL_ORDERS,
  Vendor as MarketVendor,
  MarketplaceProduct,
  BikeRider,
  MarketplaceOrder
} from "./data/marketplaceData";

import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  isConfigured,
  sendPasswordResetEmail
} from "./firebase";

// Models & data presets
import { COUNTRIES, CountryInfo } from "./data/countries";
import { INITIAL_ACCOUNTS, Account } from "./data/initialAccounts";
import { BackupData } from "./types";
import {
  DEMO_SUPPLIERS,
  DEMO_CUSTOMERS,
  DEMO_EXPENSES,
  DEMO_INVOICES,
  DEMO_QUOTATIONS,
  DEMO_CROPS,
  DEMO_EMPLOYEES,
  DEMO_POULTRY,
  DEMO_FISH,
  DEMO_INVENTORY,
  DEMO_LOANS,
  DEMO_INVESTMENTS,
  DEMO_CASH_SALES,
  DEMO_LIVESTOCK
} from "./data/demoState";

import { 
  Farm, 
  Supplier, 
  Customer, 
  ExpenseTransaction, 
  Invoice, 
  Quotation, 
  CropCycle, 
  Employee, 
  Payslip, 
  PoultryBatch, 
  FishBatch, 
  InventoryItem, 
  WaterQualityReading,
  CashSale,
  Loan,
  Investment,
  LivestockRecord,
  PredefinedRole,
  RolePermissions,
  RolePermissionsMap,
  UserMember,
  Asset,
  OtherRevenue,
  LeaveRecord,
  EmployeeAdvance,
  AuditLog,
  ArchiveRecord,
  DefaultVaccineScheduleItem
} from "./types";

import { 
  Building2, 
  Globe2, 
  AlertTriangle, 
  Sparkles, 
  Plus, 
  DollarSign, 
  Backpack, 
  Calculator, 
  Layers,
  LogOut,
  RefreshCw,
  TrendingUp,
  Tag,
  Shield
} from "lucide-react";

// Safe fetch parsing helper for client responses to avoid SyntaxError on HTML/non-JSON contents
async function safeFetchJsonClient(url: string, options?: RequestInit): Promise<any> {
  const env = (import.meta as any).env || {};
  const apiBase = env.VITE_API_URL || "https://api.mabala.cloud";
  const targetUrl = (url.startsWith("/") && !url.startsWith("//")) ? `${apiBase}${url}` : url;
  const res = await fetch(targetUrl, options);
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    if (isJson) {
      try {
        const errData = await res.json();
        errMsg = errData.error || errData.details || errMsg;
      } catch (_) {}
    } else {
      try {
        const textStr = await res.text();
        if (textStr.trim().startsWith("<") || textStr.includes("<html") || textStr.includes("<!DOCTYPE")) {
          errMsg = `The payment gateway is experiencing connection issues (Status ${res.status}). Placed transaction into automatic standby.`;
        } else {
          // Strip all tags FIRST, then slice, to prevent incomplete tags from bypassing regex matching
          errMsg = textStr.replace(/<[^>]*>/g, "").trim().slice(0, 150) || errMsg;
        }
      } catch (_) {}
    }
    throw new Error(errMsg);
  }

  if (isJson) {
    try {
      return await res.json();
    } catch (parseErr: any) {
      console.warn("[safeFetchJsonClient] JSON parsing error on success response:", parseErr.message);
      return { status: "Pending", isSimulatedFallback: true };
    }
  } else {
    try {
      const textStr = await res.text();
      console.warn("[safeFetchJsonClient] Success response but NOT JSON content:", textStr.slice(0, 100));
    } catch (_) {}
    return { status: "Pending", isSimulatedFallback: true };
  }
}

const DEFAULT_PERMISSIONS: RolePermissionsMap = {
  "Platform Administrator": {
    dashboard: { read: true, write: true },
    accounts: { read: true, write: true },
    expenses: { read: true, write: true },
    crops: { read: true, write: true },
    payroll: { read: true, write: true },
    sales: { read: true, write: true },
    invoices: { read: true, write: true },
    livestock: { read: true, write: true },
    poultry: { read: true, write: true },
    aquaculture: { read: true, write: true },
    inventory: { read: true, write: true },
    reports: { read: true, write: true },
    permissions: { read: true, write: true },
  },
  "Farm Owner": {
    dashboard: { read: true, write: true },
    accounts: { read: true, write: true },
    expenses: { read: true, write: true },
    crops: { read: true, write: true },
    payroll: { read: true, write: true },
    sales: { read: true, write: true },
    invoices: { read: true, write: true },
    livestock: { read: true, write: true },
    poultry: { read: true, write: true },
    aquaculture: { read: true, write: true },
    inventory: { read: true, write: true },
    reports: { read: true, write: true },
    permissions: { read: true, write: true },
  },
  "Accountant": {
    dashboard: { read: true, write: true },
    accounts: { read: true, write: true },
    expenses: { read: true, write: true },
    crops: { read: true, write: false },
    payroll: { read: true, write: true },
    sales: { read: true, write: true },
    invoices: { read: true, write: true },
    livestock: { read: true, write: false },
    poultry: { read: true, write: false },
    aquaculture: { read: true, write: false },
    inventory: { read: true, write: true },
    reports: { read: true, write: true },
    permissions: { read: true, write: false },
  },
  "Farm Worker": {
    dashboard: { read: true, write: false },
    accounts: { read: false, write: false },
    expenses: { read: false, write: false },
    crops: { read: true, write: true },
    payroll: { read: false, write: false },
    sales: { read: true, write: true },
    invoices: { read: false, write: false },
    livestock: { read: true, write: true },
    poultry: { read: true, write: true },
    aquaculture: { read: true, write: true },
    inventory: { read: true, write: true },
    reports: { read: false, write: false },
    permissions: { read: true, write: false },
  },
  "Veterinary Doctor": {
    dashboard: { read: true, write: true },
    accounts: { read: true, write: true },
    expenses: { read: true, write: true },
    crops: { read: true, write: false },
    payroll: { read: true, write: false },
    sales: { read: true, write: true },
    invoices: { read: true, write: true },
    livestock: { read: true, write: true },
    poultry: { read: true, write: true },
    aquaculture: { read: true, write: true },
    inventory: { read: true, write: true },
    reports: { read: true, write: true },
    permissions: { read: true, write: false },
  },
  "Agro-Vet Specialist": {
    dashboard: { read: true, write: true },
    accounts: { read: true, write: true },
    expenses: { read: true, write: true },
    crops: { read: true, write: false },
    payroll: { read: true, write: true },
    sales: { read: true, write: true },
    invoices: { read: true, write: true },
    livestock: { read: true, write: true },
    poultry: { read: true, write: true },
    aquaculture: { read: true, write: true },
    inventory: { read: true, write: true },
    reports: { read: true, write: true },
    permissions: { read: true, write: true },
  },
  "Farm Admin": {
    dashboard: { read: true, write: true },
    accounts: { read: true, write: true },
    expenses: { read: true, write: true },
    crops: { read: true, write: true },
    payroll: { read: true, write: true },
    sales: { read: true, write: true },
    invoices: { read: true, write: true },
    livestock: { read: true, write: true },
    poultry: { read: true, write: true },
    aquaculture: { read: true, write: true },
    inventory: { read: true, write: true },
    reports: { read: true, write: true },
    permissions: { read: true, write: true },
  },
  "Manager": {
    dashboard: { read: true, write: true },
    accounts: { read: true, write: false },
    expenses: { read: true, write: true },
    crops: { read: true, write: true },
    payroll: { read: true, write: false },
    sales: { read: true, write: true },
    invoices: { read: true, write: true },
    livestock: { read: true, write: true },
    poultry: { read: true, write: true },
    aquaculture: { read: true, write: true },
    inventory: { read: true, write: true },
    reports: { read: true, write: false },
    permissions: { read: true, write: false },
  },
  "Viewer": {
    dashboard: { read: true, write: false },
    accounts: { read: true, write: false },
    expenses: { read: true, write: false },
    crops: { read: true, write: false },
    payroll: { read: true, write: false },
    sales: { read: true, write: false },
    invoices: { read: true, write: false },
    livestock: { read: true, write: false },
    poultry: { read: true, write: false },
    aquaculture: { read: true, write: false },
    inventory: { read: true, write: false },
    reports: { read: true, write: false },
    permissions: { read: true, write: false },
  }
};

const DEFAULT_TEAM_MEMBERS: UserMember[] = [
  { id: "M1", name: "Benson Ng'andu", email: "benson@sunriseagro.co.zm", role: "Farm Worker", lastActive: "2 min ago", status: "Active", password: "Password123!" },
  { id: "M2", name: "Clara Mwila", email: "clara@sunriseagro.co.zm", role: "Accountant", lastActive: "15 min ago", status: "Active", password: "Password123!" },
  { id: "M3", name: "Shadrick Kasuli", email: "shikasuli@gmail.com", role: "Farm Owner", lastActive: "Just now", status: "Active", password: "Password123!" },
  { id: "M4", name: "Deep Valley Farms", email: "deepvaleyfarm@gmail.com", role: "Platform Administrator", lastActive: "Just now", status: "Active", password: "Zoiechibeka@2005" }
];

export default function App() {
  // Multi-tenant profiles & administrative states
  const [userProfile, setUserProfile] = useState(() => {
    const cached = localStorage.getItem("mabala_user_profile");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return {
      name: "Shadrick Kasuli",
      email: "shikasuli@gmail.com",
      phone: "+260977112233"
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [csvPreselectedType, setCsvPreselectedType] = useState<"expenses" | "crops" | "livestock" | null>(null);

  const handleGotoCsvImport = (type: "expenses" | "crops" | "livestock") => {
    setCsvPreselectedType(type);
    setActiveTab("csv-import");
  };

  const [activeFarmIndex, setActiveFarmIndex] = useState<number>(0);
  const [credits, setCredits] = useState<number>(() => {
    const cached = localStorage.getItem("mabala_credits");
    return cached !== null ? Number(cached) : 300;
  });

  // Marketplace core states
  const [marketplaceVendors, setMarketplaceVendors] = useState<MarketVendor[]>(() => {
    const saved = localStorage.getItem("mabala_marketplace_vendors");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_VENDORS;
  });
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>(() => {
    const saved = localStorage.getItem("mabala_marketplace_products");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_PRODUCTS;
  });
  const [marketplaceRiders, setMarketplaceRiders] = useState<BikeRider[]>(() => {
    const saved = localStorage.getItem("mabala_marketplace_riders");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_RIDERS;
  });
  const [marketplaceOrders, setMarketplaceOrders] = useState<MarketplaceOrder[]>(() => {
    const saved = localStorage.getItem("mabala_marketplace_orders");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_ORDERS;
  });
  const [marketplaceCommission, setMarketplaceCommission] = useState<number>(10);
  const [marketplaceDeliveryFeePerKm, setMarketplaceDeliveryFeePerKm] = useState<number>(5.0);

  const [adminClaimed, setAdminClaimed] = useState<boolean>(() => {
    return localStorage.getItem("mabala_admin_claimed") === "true";
  });

  const [adminClaimantEmail, setAdminClaimantEmail] = useState<string>(() => {
    return localStorage.getItem("mabala_admin_claimant_email") || "";
  });

  const [contactDetails, setContactDetails] = useState(() => {
    const saved = localStorage.getItem("mabala_contact_details");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      email: "support@mabala.com",
      phone: "+260 977 112233",
      address: "Block G, Great East Road, Lusaka, Zambia",
      twitter: "https://twitter.com/mabala_saas",
      facebook: "https://facebook.com/mabala_saas",
      linkedin: "https://linkedin.com/company/mabala_saas",
      whatsapp: "260977112233"
    };
  });

  const [activeAds, setActiveAds] = useState(() => {
    const saved = localStorage.getItem("mabala_active_ads");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "ad-1",
        title: "Premium Drought-Resistant Maize Seeds",
        description: "Boost yields by 45% in dry Sub-Saharan sandy soil. Cultivated by Deep Valley Farms.",
        imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=400",
        externalUrl: "https://www.google.com/search?q=drought+resistant+maize+seeds+africa",
        placement: "banner",
        active: true
      },
      {
        id: "ad-2",
        title: "Kafue Veterinary Vaccinations 2026",
        description: "Preventative lumpy skin disease inoculations. Secure digital veterinary appointment sheets from Mabala.",
        imageUrl: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=400",
        externalUrl: "https://www.google.com/search?q=veterinary+vaccine+campaigns+zambia",
        placement: "sidebar",
        active: true
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("mabala_contact_details", JSON.stringify(contactDetails));
  }, [contactDetails]);

  useEffect(() => {
    localStorage.setItem("mabala_active_ads", JSON.stringify(activeAds));
  }, [activeAds]);

  useEffect(() => {
    localStorage.setItem("mabala_marketplace_vendors", JSON.stringify(marketplaceVendors));
  }, [marketplaceVendors]);

  useEffect(() => {
    localStorage.setItem("mabala_marketplace_products", JSON.stringify(marketplaceProducts));
  }, [marketplaceProducts]);

  useEffect(() => {
    localStorage.setItem("mabala_marketplace_riders", JSON.stringify(marketplaceRiders));
  }, [marketplaceRiders]);

  useEffect(() => {
    localStorage.setItem("mabala_marketplace_orders", JSON.stringify(marketplaceOrders));
  }, [marketplaceOrders]);

  // Firebase auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserProfile(prev => ({
          ...prev,
          email: user.email || "shikasuli@gmail.com",
          name: user.displayName || user.email?.split("@")[0] || "Deep Valley Manager"
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Role and Granular Permission states
  const [currentRole, setCurrentRole] = useState<PredefinedRole>("Farm Owner");
  const [permissions, setPermissions] = useState<RolePermissionsMap>(DEFAULT_PERMISSIONS);

  const [teamMembers, setTeamMembers] = useState<UserMember[]>(DEFAULT_TEAM_MEMBERS);

  const [subscriptionTier, setSubscriptionTier] = useState<string>(() => {
    return localStorage.getItem("mabala_subscription_tier") || "Commercial Growth Layer";
  });
  const [workspaceMode, setWorkspaceMode] = useState<"Farmer" | "Veterinary">(() => {
    return (localStorage.getItem("mabala_workspace_mode") as any) || "Farmer";
  });
  const [vetFeeActivation, setVetFeeActivation] = useState<boolean>(() => {
    return localStorage.getItem("mabala_vet_fee_activation") !== "false";
  });

  // Multi-Country and Currency Localization states
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRIES[0]); // Default Zambia

  // Zambia-Applicable Default Vaccination Schedule
  const [defaultVaccinationSchedule, setDefaultVaccinationSchedule] = useState<DefaultVaccineScheduleItem[]>([
    { id: "zvs-1", age: "Day 1", ageInDays: 1, vaccine: "Marek's Disease", diseaseTarget: "Marek's Disease Virus", route: "SC Injection", birdType: "Broiler/Layer", booster: "No" },
    { id: "zvs-2", age: "Day 1", ageInDays: 1, vaccine: "ND + IB (Clone 30)", diseaseTarget: "Newcastle / Infectious Bronchitis", route: "Eye Drop", birdType: "Broiler/Layer", booster: "Yes – Wk 3" },
    { id: "zvs-3", age: "Day 7", ageInDays: 7, vaccine: "Gumboro (IBD) Mild", diseaseTarget: "Infectious Bursal Disease", route: "Drinking Water", birdType: "Broiler/Layer", booster: "Day 14" },
    { id: "zvs-4", age: "Day 14", ageInDays: 14, vaccine: "Gumboro (IBD) Intermed.", diseaseTarget: "Infectious Bursal Disease Boost", route: "Drinking Water", birdType: "Broiler/Layer", booster: "No" },
    { id: "zvs-5", age: "Day 18", ageInDays: 18, vaccine: "ND La Sota", diseaseTarget: "Newcastle Disease Boost", route: "Eye Drop / Water", birdType: "Broiler/Layer", booster: "Wk 8" },
    { id: "zvs-6", age: "Week 5", ageInDays: 35, vaccine: "Fowl Pox", diseaseTarget: "Avipoxvirus", route: "Wing Web Stab", birdType: "Layer only", booster: "No" },
    { id: "zvs-7", age: "Week 8", ageInDays: 56, vaccine: "ND + IB Bivalent", diseaseTarget: "Newcastle / Bronchitis", route: "Drinking Water", birdType: "Layer only", booster: "Wk 16" },
    { id: "zvs-8", age: "Week 12", ageInDays: 84, vaccine: "Egg Drop Syndrome (EDS)", diseaseTarget: "EDS-76 Virus", route: "IM Injection", birdType: "Layer only", booster: "No" },
    { id: "zvs-9", age: "Week 16", ageInDays: 112, vaccine: "ND + IB Final Pre-Lay", diseaseTarget: "Pre-Lay Booster", route: "IM Injection", birdType: "Layer only", booster: "Annually" }
  ]);

  // Dynamic ERP database
  const [farms, setFarms] = useState<Farm[]>(() => {
    const cached = localStorage.getItem("mabala_farms");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [
      {
        id: "farm-1",
        name: "Sunrise Agro-Tech Farms",
        tpin: "1002345678",
        vatNumber: "ZM-123",
        address: "Great East Road, Lusaka",
        phone: "+260977112233",
        email: "info@sunriseagro.co.zm",
        financialYearStart: "2026-01-01",
        financialYearEnd: "2026-12-31",
        currency: "ZMW",
        currencySymbol: "ZK",
        taxSystem: "VAT"
      }
    ];
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const cached = localStorage.getItem("mabala_accounts");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return INITIAL_ACCOUNTS.map(a => ({ ...a, balance: 0 }));
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const cached = localStorage.getItem("mabala_suppliers");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const cached = localStorage.getItem("mabala_customers");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [expenses, setExpenses] = useState<ExpenseTransaction[]>(() => {
    const cached = localStorage.getItem("mabala_expenses");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const cached = localStorage.getItem("mabala_invoices");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const cached = localStorage.getItem("mabala_quotations");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [crops, setCrops] = useState<CropCycle[]>(() => {
    const cached = localStorage.getItem("mabala_crops");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const cached = localStorage.getItem("mabala_employees");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [payslips, setPayslips] = useState<Payslip[]>(() => {
    const cached = localStorage.getItem("mabala_payslips");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [poultry, setPoultry] = useState<PoultryBatch[]>(() => {
    const cached = localStorage.getItem("mabala_poultry");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [fish, setFish] = useState<FishBatch[]>(() => {
    const cached = localStorage.getItem("mabala_fish");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const cached = localStorage.getItem("mabala_inventory");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [cashSales, setCashSales] = useState<CashSale[]>(() => {
    const cached = localStorage.getItem("mabala_cash_sales");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const cached = localStorage.getItem("mabala_loans");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [investments, setInvestments] = useState<Investment[]>(() => {
    const cached = localStorage.getItem("mabala_investments");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [livestock, setLivestock] = useState<LivestockRecord[]>(() => {
    const cached = localStorage.getItem("mabala_livestock");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  // New modules states
  const [assets, setAssets] = useState<Asset[]>(() => {
    const cached = localStorage.getItem("mabala_assets");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [otherRevenues, setOtherRevenues] = useState<OtherRevenue[]>(() => {
    const cached = localStorage.getItem("mabala_other_revenues");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>(() => {
    const cached = localStorage.getItem("mabala_leave_records");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>(() => {
    const cached = localStorage.getItem("mabala_employee_advances");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const cached = localStorage.getItem("mabala_audit_logs");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const [archivedRecords, setArchivedRecords] = useState<ArchiveRecord[]>(() => {
    const cached = localStorage.getItem("mabala_archived_records");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  // Global Confirmation Dialog for bulk and sensitive deletion actions
  const [globalConfirm, setGlobalConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isBulk?: boolean;
    itemCount?: number;
    itemNames?: string[];
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    (window as any).triggerGlobalConfirm = (opts: {
      title: string;
      message: string;
      isBulk?: boolean;
      itemCount?: number;
      itemNames?: string[];
      onConfirm: () => void;
    }) => {
      setGlobalConfirm({
        isOpen: true,
        title: opts.title,
        message: opts.message,
        isBulk: opts.isBulk ?? false,
        itemCount: opts.itemCount ?? 0,
        itemNames: opts.itemNames ?? [],
        onConfirm: () => {
          opts.onConfirm();
          setGlobalConfirm(null);
        }
      });
    };
    return () => {
      delete (window as any).triggerGlobalConfirm;
    };
  }, []);

  // Modals / top-up triggers
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [showFarmConfigModal, setShowFarmConfigModal] = useState<boolean>(false);

  // Live Lipila Payment Terminal State
  const [lipilaCheckout, setLipilaCheckout] = useState<{
    type: "subscription" | "credits";
    name: string;
    price: number;
    currency?: string;
    creditsToAward: number;
    description: string;
    registrationData?: any;
  } | null>(null);

  const [lipilaPhone, setLipilaPhone] = useState("");
  const [lipilaHolderName, setLipilaHolderName] = useState("");
  const [lipilaSearchingName, setLipilaSearchingName] = useState(false);
  const [lipilaPaymentStatus, setLipilaPaymentStatus] = useState<"Idle" | "Submitting" | "Pending" | "Successful" | "Failed">("Idle");
  const [lipilaRefId, setLipilaRefId] = useState("");
  const [lipilaError, setLipilaError] = useState("");
  const [lipilaPollingCount, setLipilaPollingCount] = useState(0);
  const [welcomeKey, setWelcomeKey] = useState<number>(0);

  // Transactions logs for Super Admin auditing
  const [lipilaTransactions, setLipilaTransactions] = useState<any[]>([]);

  // Auto-fetch mobile holder name query (live mock registry proxy)
  useEffect(() => {
    let active = true;
    const cleanPhone = lipilaPhone.replace(/\D/g, "");
    
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith("260")) {
      formattedPhone = cleanPhone;
    } else if (cleanPhone.startsWith("0")) {
      formattedPhone = "260" + cleanPhone.slice(1);
    } else {
      formattedPhone = "260" + cleanPhone;
    }

    if (formattedPhone.startsWith("260") && (formattedPhone.length === 11 || formattedPhone.length === 12)) {
      setLipilaSearchingName(true);
      setLipilaHolderName("");
      setLipilaError("");
      
      const delayDebounceFn = setTimeout(async () => {
        try {
          const nameHint = lipilaCheckout?.registrationData?.fullName || lipilaCheckout?.registrationData?.storeName || userProfile?.name || "";
          const url = `/api/payments/lookup?accountNumber=${formattedPhone}${nameHint ? `&nameHint=${encodeURIComponent(nameHint)}` : ""}`;
          const data = await safeFetchJsonClient(url);
          
          if (active && data && data.success) {
            setLipilaHolderName(data.holderName);
            setLipilaSearchingName(false);
            return;
          }
        } catch (err) {
          console.error("Name lookup query failed:", err);
        }

        // Failsafe client-side KYC fallback so the name is always shown
        if (active) {
          let resolvedName = "";
          const phone = formattedPhone;
          if (phone === "26097100000" || phone === "260977112233" || phone.endsWith("112233") || phone.endsWith("100000")) {
            resolvedName = "Sula Shikasuli (Farmer Wallet)";
          } else if (phone === "260961888333" || phone.endsWith("888333")) {
            resolvedName = "Dr. Bwalya Kampamba (Livestock Consultant)";
          } else if (phone === "260771555555" || phone.endsWith("555555")) {
            resolvedName = "Benson Ng'andu (Sunrise Operator)";
          } else if (phone === "260971001155" || phone.endsWith("001155")) {
            resolvedName = "Chileshe Banda";
          }
          
          const nameHint = lipilaCheckout?.registrationData?.fullName || lipilaCheckout?.registrationData?.storeName || userProfile?.name || "";
          if (!resolvedName && nameHint) {
            resolvedName = nameHint.trim();
          }
          
          if (!resolvedName) {
            const zambianFirstNames = ["Chileshe", "Mulenga", "Mwansa", "Grace", "Kondwani", "Luyando", "Njavwa", "Misozi", "Sipho", "Mutale", "Shadrick", "Gift", "Kabaso", "Emmanuel", "Mwape"];
            const zambianLastNames = ["Phiri", "Banda", "Mwanza", "Tembo", "Zulu", "Lungu", "Chanda", "Soko", "Hachipuka", "Kapiri", "Ng'andu", "Bwalya", "Kampamba"];
            
            let hash = 0;
            for (let i = 0; i < phone.length; i++) {
              hash += phone.charCodeAt(i);
            }
            const firstIdx = hash % zambianFirstNames.length;
            const lastIdx = (hash + 7) % zambianLastNames.length;
            resolvedName = `${zambianFirstNames[firstIdx]} ${zambianLastNames[lastIdx]}`;
          }
          setLipilaHolderName(resolvedName);
          setLipilaSearchingName(false);
        }
      }, 600);
      
      return () => {
        active = false;
        clearTimeout(delayDebounceFn);
      };
    } else {
      setLipilaHolderName("");
      setLipilaSearchingName(false);
    }
  }, [lipilaPhone, lipilaCheckout, userProfile]);

  // Handle successful award logic
  const handlePaymentSuccessAllocation = (checkoutObj: any) => {
    // Record Lipila Successful Tx!
    const newTx = {
      id: "tx-lipila-" + Date.now(),
      referenceId: lipilaRefId || `ref-${Date.now()}`,
      amount: Number(checkoutObj.price) || 0,
      currency: checkoutObj.currency || "ZMW",
      phone: lipilaPhone || "26097100000",
      holderName: lipilaHolderName || "Shadrick Kasuli",
      packageName: checkoutObj.name,
      packageType: checkoutObj.type,
      status: "Successful" as const,
      date: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    setLipilaTransactions(prev => [newTx, ...prev]);

    const awardedCredits = Number(checkoutObj.creditsToAward) || 0;

    if (checkoutObj.type === "subscription") {
      setSubscriptionTier(checkoutObj.name);
      
      if (checkoutObj.name.includes("Veterinary") || checkoutObj.name.includes("Doctor")) {
        setCurrentRole("Veterinary Doctor");
        setWorkspaceMode("Veterinary");
      } else if (checkoutObj.name.includes("Agro-Vet")) {
        setCurrentRole("Agro-Vet Specialist");
        setWorkspaceMode("Veterinary");
      } else {
        setCurrentRole("Farm Owner");
        setWorkspaceMode("Farmer");
      }

      setCredits(prev => prev + awardedCredits);

      const newCtx = {
        id: "CTX-" + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        farmName: activeFarm?.name || "Sunrise Agro-Tech Farms",
        type: "Allotment",
        amount: awardedCredits,
        description: `Upgraded to subscription "${checkoutObj.name}" via Lipila Live Pay`,
        adminUser: userProfile.name || "Tenant"
      };
      setCreditTransactions(prev => [newCtx, ...prev]);

      if (checkoutObj.registrationData) {
        // Execute dynamic sign-up registration
        setSelectedCountry(checkoutObj.registrationData.country);
        setUserProfile({
          name: checkoutObj.registrationData.fullName,
          email: checkoutObj.registrationData.email,
          phone: "+26097100000"
        });
        setFarms([
          {
            id: "farm-1",
            name: checkoutObj.registrationData.farmName,
            tpin: "100431290",
            address: "HQ Corporate Premises, " + checkoutObj.registrationData.country.name,
            phone: "+26097100000",
            email: checkoutObj.registrationData.email,
            financialYearStart: "2026-01-01",
            financialYearEnd: "2026-12-31",
            currency: checkoutObj.registrationData.country.currency,
            currencySymbol: checkoutObj.registrationData.country.symbol,
            taxSystem: checkoutObj.registrationData.country.defaultTaxSystem
          }
        ]);
        setSuppliers([]);
        setCustomers([]);
        setExpenses([]);
        setInvoices([]);
        setQuotations([]);
        setCrops([]);
        setEmployees([]);
        setPoultry([]);
        setFish([]);
        setInventory([]);
        setLoans([]);
        setInvestments([]);
        setCashSales([]);
        setLivestock([]);
        setAccounts(INITIAL_ACCOUNTS.map(a => ({ ...a, balance: 0 })));
        setCredits(awardedCredits);
        setIsAuthenticated(true);
        setActiveTab("dashboard");
      }

    } else if (checkoutObj.type === "vendor-subscription") {
      setSubscriptionTier(checkoutObj.name);
      setCredits(awardedCredits);
      
      if (checkoutObj.registrationData) {
        const r = checkoutObj.registrationData;
        const randomColors = ["bg-emerald-600", "bg-indigo-600", "bg-sky-600", "bg-amber-600", "bg-purple-600"];
        const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];

        const newVendor: MarketVendor = {
          id: `vend-custom-${Date.now()}`,
          name: r.storeName,
          category: r.category,
          location: r.location,
          distanceKm: Number(r.distanceKm || 15),
          phone: r.phone,
          email: r.email,
          subscriptionPackage: checkoutObj.name,
          status: "Active", // Land straight on store front
          joinedDate: new Date().toISOString().split("T")[0],
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          credits: awardedCredits,
          logoColor: randomColor,
          logoUrl: r.logoUrl
        };

        setMarketplaceVendors(prev => {
          const updated = [...prev, newVendor];
          localStorage.setItem("mabala_marketplace_vendors", JSON.stringify(updated));
          return updated;
        });

        setUserProfile({
          name: r.storeName,
          email: r.email,
          phone: r.phone
        });

        // Setup mock farms & accounting modules for valid farmer session reference bindings
        setFarms([
          {
            id: "farm-1",
            name: r.storeName + " Farm Workspace",
            tpin: "100431290",
            address: r.location,
            phone: r.phone,
            email: r.email,
            financialYearStart: "2026-01-01",
            financialYearEnd: "2026-12-31",
            currency: "ZMK",
            currencySymbol: "ZK",
            taxSystem: "VAT"
          }
        ]);
        setSuppliers([]);
        setCustomers([]);
        setExpenses([]);
        setInvoices([]);
        setQuotations([]);
        setCrops([]);
        setEmployees([]);
        setPoultry([]);
        setFish([]);
        setInventory([]);
        setLoans([]);
        setInvestments([]);
        setCashSales([]);
        setLivestock([]);
        setAccounts(INITIAL_ACCOUNTS.map(a => ({ ...a, balance: 0 })));

        setIsAuthenticated(true);
        setActiveTab("marketplace"); // Navigate merchant directly into the marketplace workspace
      }
    } else {
      setCredits(prev => prev + awardedCredits);

      const newCtx = {
        id: "CTX-" + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        farmName: activeFarm?.name || "Sunrise Agro-Tech Farms",
        type: "Allotment",
        amount: awardedCredits,
        description: `Purchased +${awardedCredits} Credits Block via Lipila Live Pay`,
        adminUser: userProfile.name || "Tenant"
      };
      setCreditTransactions(prev => [newCtx, ...prev]);
    }
  };

  // Handle payment cancellations or processing failures elegantly
  const handleLipilaCancelOrFailure = async (reason?: string) => {
    // 1. Clear checkout, phone, name info and reset status
    setLipilaCheckout(null);
    setLipilaPhone("");
    setLipilaHolderName("");
    setLipilaPaymentStatus("Idle");
    // Preserve error statement for reference
    setLipilaError(reason || "Payment Cancelled.");
  };

  // Poll transaction check status
  useEffect(() => {
    if (lipilaPaymentStatus !== "Pending" || !lipilaRefId || !lipilaCheckout) return;

    const intervalId = setInterval(async () => {
      setLipilaPollingCount(prev => prev + 1);
      try {
        const data = await safeFetchJsonClient(`/api/payments/check-status?referenceId=${lipilaRefId}`);
        if (data && (data.status === "Successful" || data.status === "Success" || data.status === "Completed")) {
          setLipilaPaymentStatus("Successful");
          handlePaymentSuccessAllocation(lipilaCheckout);
          clearInterval(intervalId);
        } else if (data && data.status === "Failed") {
          const failMsg = data.message || "Payment request declined or timing out.";
          
          // Record failed transaction for auditing logs
          setLipilaTransactions(prev => [
            {
              id: "tx-lipila-" + Date.now(),
              referenceId: lipilaRefId || `ref-${Date.now()}`,
              amount: Number(lipilaCheckout?.price) || 0,
              currency: "ZMW",
              phone: lipilaPhone || "26097100000",
              holderName: lipilaHolderName || "Shadrick Kasuli",
              packageName: lipilaCheckout?.name || "Premium Upgrade",
              packageType: lipilaCheckout?.type || "subscription",
              status: "Failed" as const,
              date: new Date().toISOString().replace('T', ' ').slice(0, 19),
              errorDetails: failMsg
            },
            ...prev
          ]);
          clearInterval(intervalId);
          
          // Immediately kick the user out to marketing landing view on payment processing failure
          await handleLipilaCancelOrFailure(`Lupila API Failure: ${failMsg}`);
        }
      } catch (err) {
        console.error("Polling check query failed:", err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [lipilaPaymentStatus, lipilaRefId, lipilaCheckout]);

  const handleLipilaSubmitPayment = async () => {
    if (!lipilaPhone) {
      setLipilaError("Please input active Mobile Money number.");
      return;
    }

    let cleanPhone = lipilaPhone.replace(/\D/g, "");
    if (lipilaCheckout?.currency === "USD") {
      if (cleanPhone.length < 8) {
        setLipilaError("Invalid mobile format. Please enter a valid mobile number.");
        return;
      }
    } else {
      if (cleanPhone.startsWith("0")) {
        cleanPhone = "260" + cleanPhone.slice(1);
      } else if (!cleanPhone.startsWith("260")) {
        cleanPhone = "260" + cleanPhone;
      }

      if (!cleanPhone.startsWith("260") || (cleanPhone.length !== 11 && cleanPhone.length !== 12)) {
        setLipilaError("Invalid mobile format. Please enter 10 digits (e.g., 097...) or 11/12 digits.");
        return;
      }
    }

    setLipilaPaymentStatus("Submitting");
    setLipilaError("");
    setLipilaPollingCount(0);

    const generatedRefId = `ref-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setLipilaRefId(generatedRefId);

    try {
      const data = await safeFetchJsonClient("/api/payments/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceId: generatedRefId,
          amount: Number(lipilaCheckout?.price) || 1,
          narration: `Mabala ${lipilaCheckout?.type === "subscription" ? "Subscription" : "Credits"}: ${lipilaCheckout?.name}`,
          accountNumber: cleanPhone,
          currency: lipilaCheckout?.currency || "ZMW",
          email: (lipilaCheckout?.registrationData?.email) || userProfile.email || "shikasuli@gmail.com"
        })
      });

      if (data && data.status === "Failed") {
        setLipilaPaymentStatus("Failed");
        const failMsg = data.message || "Transaction has failed";
        setLipilaError(failMsg);
        setLipilaTransactions(prev => [
          {
            id: "tx-lipila-" + Date.now(),
            referenceId: generatedRefId,
            amount: Number(lipilaCheckout?.price) || 0,
            currency: "ZMW",
            phone: cleanPhone || "26097100000",
            holderName: lipilaHolderName || "Shadrick Kasuli",
            packageName: lipilaCheckout?.name || "Premium Upgrade",
            packageType: lipilaCheckout?.type || "subscription",
            status: "Failed" as const,
            date: new Date().toISOString().replace('T', ' ').slice(0, 19),
            errorDetails: failMsg
          },
          ...prev
        ]);
      } else {
        setLipilaPaymentStatus("Pending");
      }
    } catch (err: any) {
      setLipilaPaymentStatus("Failed");
      const errMsg = err.message || "An unexpected communication error occurred.";
      setLipilaError(errMsg);
      setLipilaTransactions(prev => [
        {
          id: "tx-lipila-" + Date.now(),
          referenceId: generatedRefId,
          amount: Number(lipilaCheckout?.price) || 0,
          currency: "ZMW",
          phone: cleanPhone || "26097100000",
          holderName: lipilaHolderName || "Shadrick Kasuli",
          packageName: lipilaCheckout?.name || "Premium Upgrade",
          packageType: lipilaCheckout?.type || "subscription",
          status: "Failed" as const,
          date: new Date().toISOString().replace('T', ' ').slice(0, 19),
          errorDetails: errMsg
        },
        ...prev
      ]);
    }
  };

  // New Farm Form state
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmAddr, setNewFarmAddr] = useState("");
  const [newFarmPhone, setNewFarmPhone] = useState("");

  useEffect(() => {
    if (currentRole === "Platform Administrator") {
      setAdminClaimed(true);
      localStorage.setItem("mabala_admin_claimed", "true");
      if (!adminClaimantEmail && userProfile.email) {
        setAdminClaimantEmail(userProfile.email);
        localStorage.setItem("mabala_admin_claimant_email", userProfile.email);
      }
    }
  }, [currentRole, adminClaimantEmail, userProfile.email]);
  const [farmStatus, setFarmStatus] = useState<"ACTIVE" | "FROZEN" | "SUSPENDED" | string>(() => {
    return localStorage.getItem("mabala_farm_status") || "ACTIVE";
  });
  const [statusChangeLogs, setStatusChangeLogs] = useState<any[]>(() => {
    const cached = localStorage.getItem("mabala_status_change_logs");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });
  const [creditTransactions, setCreditTransactions] = useState<any[]>(() => {
    const cached = localStorage.getItem("mabala_credit_transactions");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });
  const [platformPackages, setPlatformPackages] = useState<any[]>([
    { id: "pkg-1", name: "Smallholder Pack", duration: "1 Month", credits: 100, price: 0, priceUSD: 0, currency: "ZMW", features: "1 farm node, up to 3 plots, basic crop tracking, manual ledger mapping", isActive: true },
    { id: "pkg-2", name: "Farmer Growth Pack", duration: "1 Month", credits: 5000, price: 500, priceUSD: 25, currency: "ZMW", features: "Unlimited plots & animals, poultry + livestock modules, full ZRA-ready double-entry ledger & payroll, priority WhatsApp support", isActive: true },
    { id: "pkg-3", name: "Enterprise Suite", duration: "1 Month", credits: 25000, price: 2000, priceUSD: 99, currency: "ZMW", features: "Multi-farm nodes, 10 team users, advanced analytics, dedicated account manager, API access", isActive: true },
    { id: "pkg-4", name: "Marketplace Supplier", duration: "1 Month", credits: 2000, price: 500, priceUSD: 25, currency: "ZMW", features: "Unlimited product listings in Mabala marketplace, targeted promotions, order management system, sales analytics dashboard", isActive: true }
  ]);

  const [isAllFarmsActive, setIsAllFarmsActive] = useState<boolean>(false);
  const [farmAccountsMap, setFarmAccountsMap] = useState<Record<string, Account[]>>({});
  const [creditTiers, setCreditTiers] = useState([
    { id: "tier-1", name: "Tier 1: Basic Operations", cost: 1, modules: "Dashboard, Sales Tracker, User Profiles, Backup & Restore", color: "#94a3b8" },
    { id: "tier-2", name: "Tier 2: Standard Crop Operations", cost: 2, modules: "Crop Cycles, Milestones Planning, Expenses Ledger, Invoices & Quotes", color: "#3b82f6" },
    { id: "tier-3", name: "Tier 3: Capital Finance Hub", cost: 3, modules: "Finance & Loans Hub, Capital Investments, Asset Register, Depreciation", color: "#ec4899" },
    { id: "tier-4", name: "Tier 4: Statutory & Reports Pro", cost: 5, modules: "Chart of Accounts, IFRS Financial Reports, Statutory Ledger, Audit Log", color: "#8b5cf6" },
    { id: "tier-5", name: "Tier 5: Advanced Livestock & Poultry Pro", cost: 8, modules: "Livestock Records, Poultry Batches, Aquaculture, Vet-Certified Logs", color: "#10b981" }
  ]);

  useEffect(() => {
    localStorage.setItem("mabala_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("mabala_credits", String(credits));
  }, [credits]);

  useEffect(() => {
    localStorage.setItem("mabala_team_members", JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem("mabala_subscription_tier", subscriptionTier);
  }, [subscriptionTier]);

  useEffect(() => {
    localStorage.setItem("mabala_workspace_mode", workspaceMode);
  }, [workspaceMode]);

  useEffect(() => {
    localStorage.setItem("mabala_vet_fee_activation", String(vetFeeActivation));
  }, [vetFeeActivation]);

  useEffect(() => {
    localStorage.setItem("mabala_farms", JSON.stringify(farms));
  }, [farms]);

  useEffect(() => {
    localStorage.setItem("mabala_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("mabala_suppliers", JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem("mabala_customers", JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem("mabala_expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("mabala_invoices", JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem("mabala_quotations", JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem("mabala_crops", JSON.stringify(crops));
  }, [crops]);

  useEffect(() => {
    localStorage.setItem("mabala_employees", JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem("mabala_payslips", JSON.stringify(payslips));
  }, [payslips]);

  useEffect(() => {
    localStorage.setItem("mabala_poultry", JSON.stringify(poultry));
  }, [poultry]);

  useEffect(() => {
    localStorage.setItem("mabala_fish", JSON.stringify(fish));
  }, [fish]);

  useEffect(() => {
    localStorage.setItem("mabala_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("mabala_cash_sales", JSON.stringify(cashSales));
  }, [cashSales]);

  useEffect(() => {
    localStorage.setItem("mabala_loans", JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem("mabala_investments", JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem("mabala_livestock", JSON.stringify(livestock));
  }, [livestock]);

  useEffect(() => {
    localStorage.setItem("mabala_assets", JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem("mabala_other_revenues", JSON.stringify(otherRevenues));
  }, [otherRevenues]);

  useEffect(() => {
    localStorage.setItem("mabala_leave_records", JSON.stringify(leaveRecords));
  }, [leaveRecords]);

  useEffect(() => {
    localStorage.setItem("mabala_employee_advances", JSON.stringify(employeeAdvances));
  }, [employeeAdvances]);

  useEffect(() => {
    localStorage.setItem("mabala_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem("mabala_archived_records", JSON.stringify(archivedRecords));
  }, [archivedRecords]);

  useEffect(() => {
    localStorage.setItem("mabala_farm_status", farmStatus);
  }, [farmStatus]);

  useEffect(() => {
    localStorage.setItem("mabala_status_change_logs", JSON.stringify(statusChangeLogs));
  }, [statusChangeLogs]);

  useEffect(() => {
    localStorage.setItem("mabala_credit_transactions", JSON.stringify(creditTransactions));
  }, [creditTransactions]);

  const activeFarm = farms[activeFarmIndex] || farms[0];
  const isReadonly = credits === 0 || farmStatus === "FROZEN";

  const isAllFarmsSelected = isAllFarmsActive && subscriptionTier === "Enterprise Suite";

  const currentMember = useMemo(() => {
    return teamMembers.find(m => m.email.trim().toLowerCase() === userProfile.email.trim().toLowerCase());
  }, [teamMembers, userProfile.email]);

  const accessibleFarms = useMemo(() => {
    if (currentMember && currentMember.accessibleFarmIds && currentMember.accessibleFarmIds.length > 0) {
      return farms.filter(f => currentMember.accessibleFarmIds!.includes(f.id));
    }
    return farms;
  }, [farms, currentMember]);

  // Filter transaction states for rendering/read-only views based on selected farm node or collected multi-farm
  const displayedExpenses = useMemo(() => {
    return isAllFarmsSelected ? expenses : expenses.filter(x => !x.farmId || x.farmId === activeFarm?.id);
  }, [isAllFarmsSelected, expenses, activeFarm?.id]);

  const displayedCrops = useMemo(() => {
    return isAllFarmsSelected ? crops : crops.filter(x => !x.farmId || x.farmId === activeFarm?.id);
  }, [isAllFarmsSelected, crops, activeFarm?.id]);

  const displayedInvoices = useMemo(() => {
    return isAllFarmsSelected ? invoices : invoices.filter(x => !x.farmId || x.farmId === activeFarm?.id);
  }, [isAllFarmsSelected, invoices, activeFarm?.id]);

  const displayedPoultry = useMemo(() => {
    return isAllFarmsSelected ? poultry : poultry.filter(x => !x.farmId || x.farmId === activeFarm?.id);
  }, [isAllFarmsSelected, poultry, activeFarm?.id]);

  const displayedCashSales = useMemo(() => {
    return isAllFarmsSelected ? cashSales : cashSales.filter(x => !x.farmId || x.farmId === activeFarm?.id);
  }, [isAllFarmsSelected, cashSales, activeFarm?.id]);

  const displayedLivestock = useMemo(() => {
    return isAllFarmsSelected ? livestock : livestock.filter(x => !x.farmId || x.farmId === activeFarm?.id);
  }, [isAllFarmsSelected, livestock, activeFarm?.id]);

  const displayedFish = useMemo(() => {
    return isAllFarmsSelected ? fish : fish.filter(x => !x.farmId || x.farmId === activeFarm?.id);
  }, [isAllFarmsSelected, fish, activeFarm?.id]);

  const displayedInventory = useMemo(() => {
    return isAllFarmsSelected ? inventory : inventory.filter(x => !x.farmId || x.farmId === activeFarm?.id);
  }, [isAllFarmsSelected, inventory, activeFarm?.id]);

  const displayedAssets = useMemo(() => {
    return isAllFarmsSelected ? assets : assets.filter(x => !x.farmId || x.farmId === activeFarm?.id);
  }, [isAllFarmsSelected, assets, activeFarm?.id]);

  const displayedOtherRevenues = useMemo(() => {
    return isAllFarmsSelected ? otherRevenues : otherRevenues.filter(x => !x.farmId || x.farmId === activeFarm?.id);
  }, [isAllFarmsSelected, otherRevenues, activeFarm?.id]);

  // Synchronize dynamic Chart of Accounts balances by sub-farm node
  useEffect(() => {
    if (activeFarm?.id && !isAllFarmsSelected) {
      setFarmAccountsMap(prev => {
        const currentMapVal = prev[activeFarm.id];
        const hasDiff = !currentMapVal || currentMapVal.some((acc, idx) => acc.balance !== accounts[idx]?.balance);
        if (hasDiff) {
          return {
            ...prev,
            [activeFarm.id]: accounts
          };
        }
        return prev;
      });
    }
  }, [accounts, activeFarm?.id, isAllFarmsSelected]);

  // Restore Chart of Account active balances on farm node focus swap
  const prevActiveFarmIdRef = useRef<string>("");
  useEffect(() => {
    if (activeFarm?.id) {
      if (prevActiveFarmIdRef.current !== activeFarm.id) {
        prevActiveFarmIdRef.current = activeFarm.id;
        const mapped = farmAccountsMap[activeFarm.id];
        if (mapped) {
          setAccounts(mapped);
        } else {
          setAccounts(INITIAL_ACCOUNTS.map(a => ({ ...a, balance: 0 })));
        }
      }
    }
  }, [activeFarm?.id, farmAccountsMap]);

  // Merged accounts balance summary for collected multiple farms view
  const displayedAccounts = useMemo(() => {
    if (isAllFarmsSelected) {
      return INITIAL_ACCOUNTS.map(baseAcc => {
        let totalBal = 0;
        farms.forEach(f => {
          const farmAccs = farmAccountsMap[f.id] || [];
          const match = farmAccs.find(a => a.code === baseAcc.code);
          if (match) {
            totalBal += match.balance;
          } else if (f.id === activeFarm?.id) {
            const stateMatch = accounts.find(a => a.code === baseAcc.code);
            if (stateMatch) totalBal += stateMatch.balance;
          }
        });
        return { ...baseAcc, balance: totalBal };
      });
    }
    return accounts;
  }, [isAllFarmsSelected, accounts, farmAccountsMap, farms, activeFarm?.id]);

  const getTierForTab = (tab: string) => {
    switch (tab) {
      case "dashboard":
      case "sales":
      case "profile":
      case "backup-restore":
        return "tier-1";
      case "crops":
      case "expenses":
      case "invoices":
        return "tier-2";
      case "finance-hub":
      case "assets":
        return "tier-3";
      case "accounts":
      case "reports":
      case "audit-archive":
        return "tier-4";
      case "livestock":
      case "poultry":
      case "aquaculture":
        return "tier-5";
      default:
        return null;
    }
  };

  // Active module-access credit deduction engine 
  const [prevTab, setPrevTab] = useState<string>("dashboard");
  useEffect(() => {
    if (activeTab === prevTab) return;
    
    const tierId = getTierForTab(activeTab);
    if (tierId) {
      const matchedTier = creditTiers.find(t => t.id === tierId);
      const cost = matchedTier ? matchedTier.cost : 1;
      
      if (cost > 0) {
        setCredits(prev => Math.max(prev - cost, 0));
        
        // Push transactions straight to credit ledger audits
        const newTx = {
          id: "tx-module-" + Date.now(),
          date: new Date().toISOString().replace('T', ' ').slice(0, 19),
          amount: cost,
          description: `Access module: ${activeTab.toUpperCase()} (${matchedTier?.name || "Credit Usage"})`,
          type: "usage"
        };
        setCreditTransactions(prev => [newTx, ...prev]);
      }
    }
    
    setPrevTab(activeTab);
  }, [activeTab, prevTab, creditTiers]);

  const handleUpdateActiveFarm = (updatedFields: Partial<any>) => {
    setFarms(prev => prev.map((f, i) => {
      if (i === activeFarmIndex) {
        return { ...f, ...updatedFields };
      }
      return f;
    }));
  };

  // Sync Currency Symbol and Country when farm/country changes
  useEffect(() => {
    if (activeFarm) {
      // Find matching country
      const matched = COUNTRIES.find(c => c.currency === activeFarm.currency) || COUNTRIES[0];
      setSelectedCountry(matched);
    }
  }, [activeFarmIndex, farms]);

  // Handle write activity credit penalty
  const deductCredits = (weight: number) => {
    setCredits(prev => Math.max(prev - weight, 0));
  };

  // Demo Mode is repurposed into a clean blank workspace bootloader as per user directive
  const handleStartDemo = (customEmail?: any) => {
    const testCountry = COUNTRIES[0]; // Zambia default
    setSelectedCountry(testCountry);

    const emailStr = (typeof customEmail === "string" ? customEmail : "") || (userProfile && typeof userProfile.email === "string" ? userProfile.email : "") || "manager@localhost.zm";
    const emailToUse = emailStr;
    const isSuper = emailToUse.trim().toLowerCase() === "deepvaleyfarm@gmail.com";
    const farmNameToUse = isSuper ? "Deep Valley Farms" : "My Production Farm";

    setFarms([
      {
        id: "farm-1",
        name: farmNameToUse,
        tpin: "1002345678",
        vatNumber: "ZM-123",
        address: "Stand No 10, Great East Road, Lusaka",
        phone: "+260977112233",
        email: emailToUse,
        financialYearStart: "2026-01-01",
        financialYearEnd: "2026-12-31",
        currency: testCountry.currency,
        currencySymbol: testCountry.symbol,
        taxSystem: testCountry.defaultTaxSystem
      }
    ]);

    // Initialize all operational sub-modules with empty database lists
    setSuppliers([]);
    setCustomers([]);
    setExpenses([]);
    setInvoices([]);
    setQuotations([]);
    setCrops([]);
    setEmployees([]);
    setPoultry([]);
    setFish([]);
    setInventory([]);
    setLoans([]);
    setInvestments([]);
    setCashSales([]);
    setLivestock([]);

    // Set standard Chart of Accounts to $0.00 starting balances
    const emptyAccounts = INITIAL_ACCOUNTS.map(a => ({ ...a, balance: 0 }));
    setAccounts(emptyAccounts);

    setSubscriptionTier(isSuper ? "Agro-Enterprise Premium" : "Commercial Growth Layer");
    setWorkspaceMode("Farmer");
    setCurrentRole(isSuper ? "Platform Administrator" : "Farm Owner");

    setCredits(isSuper ? 100000 : 300); // Super administrator receives complete operational tokens
    setIsAuthenticated(true);
    setActiveTab("dashboard");
  };

  const handleInitDemoWorkspace = async (role: "Farmer" | "V Practitioner" | "Input Supplier" | string) => {
    const testCountry = COUNTRIES[0]; // Zambia Default
    setSelectedCountry(testCountry);

    const demoEmail = "mabalademo@mabala.cloud";
    setUserProfile({
      name: role === "Farmer" ? "Shadrick Kampamba (Farmer)" : role === "Vet Practitioner" ? "Dr. Noah Mulenga (Clinical Vet)" : "Mabala Inputs Store",
      email: demoEmail,
      phone: "+260977112233"
    });

    const activeFarmName = role === "Farmer" ? "Mabala Demo Corporate Farm" : role === "Vet Practitioner" ? "Lusaka Veterinary Sanctuary" : "Mabala Central Trading Depot";
    setFarms([
      {
        id: "farm-1",
        name: activeFarmName,
        tpin: "1002345678",
        vatNumber: "ZM-1234-VAT",
        address: "Stand No 14, Great East Road, Lusaka",
        phone: "+260977112233",
        email: demoEmail,
        financialYearStart: "2026-01-01",
        financialYearEnd: "2026-12-31",
        currency: testCountry.currency,
        currencySymbol: testCountry.symbol,
        taxSystem: testCountry.defaultTaxSystem
      }
    ]);

    setSuppliers([]);
    setCustomers([]);
    setExpenses([]);
    setInvoices([]);
    setQuotations([]);
    setCrops([]);
    setEmployees([]);
    setPoultry([]);
    setFish([]);
    setInventory([]);
    setLoans([]);
    setInvestments([]);
    setCashSales([]);
    setLivestock([]);
    setAssets([]);
    setOtherRevenues([]);
    setLeaveRecords([]);
    setEmployeeAdvances([]);

    if (role === "Farmer") {
      setSubscriptionTier("Commercial Growth Layer");
      setWorkspaceMode("Farmer");
      setCurrentRole("Farm Owner");

      setSuppliers([
        { id: "sup-1", name: "Zambia Seed Company (Zaseco)", email: "orders@zaseco.co.zm", phone: "+260977443322", address: "Cairo Road, Lusaka" },
        { id: "sup-2", name: "National Milling Corporation", email: "info@nmc.zm", phone: "+260211223344", address: "Lumumba Road, Lusaka" }
      ]);

      const seedCustomers = [
        { id: "cust-1", name: "Chisamba Dairy Cooperatives", email: "billing@chisambadairy.co.zm", phone: "+260966887766", address: "Chisamba, Central Province" },
        { id: "cust-2", name: "Kalingalinga Poultry Depot", email: "manager@kalingalingachickens.zm", phone: "+260955332211", address: "Kalingalinga Market, Lusaka" }
      ];
      setCustomers(seedCustomers);

      const demoAccounts = INITIAL_ACCOUNTS.map(a => {
        if (a.code === "1010") return { ...a, balance: 145000 }; 
        if (a.code === "1020") return { ...a, balance: 4200 };   
        if (a.code === "1200") return { ...a, balance: 35000 };  
        if (a.code === "1210") return { ...a, balance: 18000 };  
        if (a.code === "4000") return { ...a, balance: 125000 }; 
        if (a.code === "4100") return { ...a, balance: 68000 };  
        if (a.code === "5000") return { ...a, balance: 15400 };  
        if (a.code === "5100") return { ...a, balance: 22000 };  
        return { ...a, balance: 0 };
      });
      setAccounts(demoAccounts);

      setCrops([
        {
          id: "crop-1",
          cropType: "Orange Maize (MH-12)",
          plantingDate: "2026-01-05",
          expectedHarvestDate: "2026-05-15",
          fieldBlock: "Kafue East Block 2",
          areaHectares: 25,
          expectedYieldKg: 125000,
          actualYieldKg: 127200,
          status: "Harvested",
          milestones: [
            { id: "ms-1", name: "Land Tillage", startDate: "2026-01-01", endDate: "2026-01-04", isCompleted: true },
            { id: "ms-2", name: "Sowing & Basal D-Compound Application", startDate: "2026-01-05", endDate: "2026-01-10", isCompleted: true },
            { id: "ms-3", name: "Harvest & Bagging", startDate: "2026-05-10", endDate: "2026-05-15", isCompleted: true }
          ],
          expensesLinked: 35200,
          revenueLinked: 115000,
          farmId: "farm-1"
        },
        {
          id: "crop-2",
          cropType: "Water-efficient Soybeans",
          plantingDate: "2026-02-18",
          expectedHarvestDate: "2026-06-30",
          fieldBlock: "Chisamba South Pivot 1",
          areaHectares: 40,
          expectedYieldKg: 180000,
          status: "Active",
          milestones: [
            { id: "ms-4", name: "Sowing & Irrigation setup", startDate: "2026-02-18", endDate: "2026-02-22", isCompleted: true },
            { id: "ms-5", name: "Weeding & Spraying (Glyphosate)", startDate: "2026-04-10", endDate: "2026-04-15", isCompleted: true }
          ],
          expensesLinked: 14200,
          revenueLinked: 0,
          farmId: "farm-1"
        }
      ]);

      setEmployees([
        { id: "emp-1", name: "Moses Chilufya", role: "Tractor Operator", contractRate: 3500, housingAllowance: 500, transportAllowance: 300, snapsaNumber: "NAP-9921445-B", snhimaNumber: "NHI-1200921", paymentMethod: "Bank Transfer", bankName: "ZANACO", bankAccount: "55001200941", bankBranch: "Cairo Road", status: "Active", country: "Zambia" },
        { id: "emp-2", name: "Sarah Phiri", role: "Agronomist Assistant", contractRate: 5805, housingAllowance: 800, transportAllowance: 400, otherAllowance: 100, snapsaNumber: "NAP-8211029-A", snhimaNumber: "NHI-1499214", paymentMethod: "MTN MoMo", walletNumber: "+260966778899", status: "Active", country: "Zambia" },
        { id: "emp-3", name: "John Banda", role: "Livestock Herder", contractRate: 2500, housingAllowance: 300, transportAllowance: 200, snapsaNumber: "NAP-3341029-C", snhimaNumber: "NHI-8899213", paymentMethod: "Airtel Money", walletNumber: "+260977889900", status: "Active", country: "Zambia" }
      ]);

      setLivestock([
        {
          id: "lv-1",
          type: "Cattle",
          species: "Bovine",
          breed: "Brahman Bull",
          tagId: "ZM-KLR-0012",
          gender: "Male",
          acquisitionType: "Bought",
          source: "Zambia Breeders Corp",
          dateAcquired: "2026-01-10",
          purchasePrice: 18500,
          currentValue: 24000,
          healthEvents: [
            { date: "2026-03-05", type: "Vaccination", details: "Lumpy Skin disease vaccine", cost: 120 },
            { date: "2026-05-18", type: "Clinical treatment", details: "Wound debridement, antibiotic spray applied", cost: 350 }
          ],
          feedingLogs: [
            { date: "2026-06-01", feedType: "Beef Finisher Concentrates", quantityKg: 5 }
          ],
          status: "Active",
          farmId: "farm-1"
        },
        {
          id: "lv-2",
          type: "Goats",
          species: "Caprine",
          breed: "Kalahari Red Goat",
          tagId: "ZM-KLR-0082",
          gender: "Female",
          acquisitionType: "Birthed",
          source: "On-Farm Birth",
          dateAcquired: "2026-02-14",
          purchasePrice: 0,
          currentValue: 1800,
          healthEvents: [
            { date: "2026-04-10", type: "Deworming", details: "Ivermectin 1% oral dose", cost: 45 }
          ],
          feedingLogs: [],
          status: "Active",
          farmId: "farm-1"
        }
      ]);

      setPoultry([
        {
          id: "pb-1",
          batchId: "BRO-2026-001",
          batchName: "Kafue Broilers Cohort #4",
          birdType: "Broilers (Meat)",
          breed: "Cobb 500 Fast-Grow",
          quantity: 3000,
          currentCount: 2942,
          sourceSupplier: "National Milling Hatcheries",
          arrivalDate: "2026-05-01",
          assignedShed: "Broiler Shed A (Standard Ground)",
          status: "ACTIVE > GROWING",
          notes: "Excellent FCR registered with minimal mortality rate.",
          vaccinationCalendar: [
            { ageDay: 1, vaccine: "Marek's vaccine", diseaseTarget: "Marek's disease", route: "Subcutaneous", isOverdue: false, status: "Completed", dateAdministered: "2026-05-01" },
            { ageDay: 10, vaccine: "Gumboro vaccine", diseaseTarget: "Infectious Bursal Disease", route: "Drinking Water", isOverdue: false, status: "Completed", dateAdministered: "2026-05-10" },
            { ageDay: 21, vaccine: "Newcastle vaccine", diseaseTarget: "Newcastle Disease ND", route: "Eye drop / Water", isOverdue: false, status: "Completed", dateAdministered: "2026-05-21" }
          ],
          feedLogs: [
            { date: "2026-05-15", feedType: "Broiler Starter Mash", quantityKg: 150, cost: 1850, fedBy: "Sarah Phiri" },
            { date: "2026-06-02", feedType: "Broiler Grower Pellets", quantityKg: 320, cost: 4100, fedBy: "Sarah Phiri" }
          ],
          mortalityLogs: [
            { date: "2026-05-03", count: 18, cause: "Overcrowding shipping stress", probableCauseCategory: "feed" },
            { date: "2026-05-20", count: 40, cause: "Sudden death syndrome (cold night draft)", probableCauseCategory: "disease" }
          ],
          salesLogs: [
            { date: "2026-06-05", quantity: 500, amount: 37500, pricePerBird: 75, customerName: "Choithram Supermarket", paymentMethod: "Mobile Money", chargeType: "PER_BIRD" }
          ],
          eggCollections: [],
          medications: [],
          farmId: "farm-1"
        }
      ]);

      setFish([
        {
          id: "fb-1",
          batchId: "TIL-2026-01",
          species: "Oreochromis niloticus (Nile Tilapia)",
          strain: "Siavonga Kariba Strain",
          productionSystem: "Pond",
          pondName: "Tilapia Breeding Pond C-1",
          stockingQuantity: 15000,
          currentFishCount: 14850,
          averageWeightStockingG: 5.5,
          targetMarketWeightG: 350,
          expectedHarvestDate: "2026-09-15",
          status: "Grow-Out",
          feedLogs: [
            { date: "2026-05-10", quantityKg: 75, cost: 950, fedBy: "Sarah Phiri", brand: "Tiger Feeds" },
            { date: "2026-06-01", quantityKg: 120, cost: 1600, fedBy: "Sarah Phiri", brand: "Tiger Feeds" }
          ],
          weightSamplings: [
            { date: "2026-05-01", sampleSize: 100, totalWeightG: 550, avgWeightG: 5.5, uniformityPct: 92 },
            { date: "2026-06-01", sampleSize: 100, totalWeightG: 12400, avgWeightG: 124, uniformityPct: 88 }
          ],
          waterReadings: [
            { date: "2026-06-01", pH: 7.2, doLevel: 6.5, temp: 24.5, ammonia: 0.02, nitrite: 0.01 }
          ],
          mortalityLogs: [
            { date: "2026-05-05", count: 150, cause: "Pond cleaning stocking shock" }
          ],
          harvests: [],
          sales: [],
          waterInterventions: [],
          medications: [],
          farmId: "farm-1"
        }
      ]);

      setInvoices([
        {
          id: "inv-1",
          invoiceNumber: "INV-2026-901",
          date: "2026-05-10",
          dueDate: "2026-06-10",
          customerName: "Chisamba Dairy Cooperatives",
          subtotal: 15000,
          taxAmount: 2400,
          total: 17400,
          lines: [{ description: "Baling Straw Hay & Maize Bran concentrates", quantity: 150, unitPrice: 100, amount: 15000 }],
          status: "Paid",
          paidAmount: 17400,
          coaDebit: "1010",
          coaCredit: "4000",
          farmId: "farm-1"
        },
        {
          id: "inv-2",
          invoiceNumber: "INV-2026-902",
          date: "2026-06-01",
          dueDate: "2026-07-01",
          customerName: "Kalingalinga Poultry Depot",
          subtotal: 45000,
          taxAmount: 7200,
          total: 52200,
          lines: [{ description: "Live Broiler Chicken delivery (Grade A)", quantity: 600, unitPrice: 75, amount: 45000 }],
          status: "Unpaid",
          paidAmount: 0,
          coaDebit: "1100",
          coaCredit: "4100",
          farmId: "farm-1"
        }
      ]);

      setExpenses([
        { id: "exp-1", date: "2026-05-02", description: "Basal D-Compound Fertilizer Delivery - 50 bags", category: "Fertilizer & Seeds COGS", code: "5000", supplierName: "Zambia Seed Company (Zaseco)", amount: 12500, total: 12500, subtotal: 12500, taxAmount: 0, taxSystem: "Exempt", rows: [], supplierId: "sup-1", farmId: "farm-1", paymentMethod: "Zanaco Transfer", status: "Paid", hasReceipt: true, isVatRegistered: true },
        { id: "exp-2", date: "2026-05-15", description: "Direct Diesel Refueling - Massey Tractor", category: "Machinery Repairs & Fuel", code: "5400", supplierName: "National Milling Corporation", amount: 4800, total: 4800, subtotal: 4800, taxAmount: 0, taxSystem: "Exempt", rows: [], supplierId: "sup-2", farmId: "farm-1", paymentMethod: "Petty Cash", status: "Paid", hasReceipt: true, isVatRegistered: false }
      ]);

      setInventory([
        { id: "inv-item-1", name: "D-Compound Basal Fertilizer (50kg)", category: "Fertilizer", quantity: 38, unit: "bag", unitCost: 350, totalValue: 13300, storageLocation: "Silo Shed B", lowStockAlertLevel: 10 },
        { id: "inv-item-2", name: "Broiler Grower Mash tiger feeds", category: "Feed", quantity: 64, unit: "bag", unitCost: 280, totalValue: 17920, storageLocation: "Feed store C", lowStockAlertLevel: 15 },
        { id: "inv-item-3", name: "D-Compound Seed Maize (10kg)", category: "Seeds", quantity: 4, unit: "bag", unitCost: 195, totalValue: 780, storageLocation: "Silo Shed B", lowStockAlertLevel: 5 }
      ]);

      setInvestments([
        { id: "inv-invest-1", description: "Zambia Government Treasury Bill (Mabala Reserve)", amount: 45000, date: "2026-01-15", institution: "Bank of Zambia", investmentType: "Treasury Bill", rate: 18, status: "Active", farmId: "farm-1" }
      ]);

      setAssets([
        { id: "ast-1", name: "Massey Ferguson Tractor 4WD", category: "Machinery & Equipment", purchasePrice: 285000, dateAcquired: "2024-03-12", currentValue: 245000, depreciationMethod: "Straight Line", annualRate: 10, serialNumber: "MS-F4WD-8812A", status: "Operational", farmId: "farm-1" },
        { id: "ast-2", name: "Solar Borehole Water System 10HP", category: "Utility Infrastructures", purchasePrice: 42000, dateAcquired: "2025-11-20", currentValue: 39500, depreciationMethod: "Straight Line", annualRate: 5, serialNumber: "SOL-BH-10X99", status: "Operational", farmId: "farm-1" }
      ]);

    } else if (role === "Vet Practitioner") {
      setSubscriptionTier("Veterinary Doctor Practitioner");
      setWorkspaceMode("Veterinary");
      setCurrentRole("Veterinary Doctor");

      const docClients = [
        { id: "cust-1", name: "Chisamba Dairy Ltd", email: "chisambadairy@gmail.zm", phone: "+260977821102", address: "Chisamba District" },
        { id: "cust-2", name: "Makeni Angus Stud", email: "makeniangus@yahoo.com", phone: "+260966321104", address: "Plot 10, Makeni, Lusaka" },
        { id: "cust-3", name: "Kafue River Ranch", email: "manager@kafueriver.zm", phone: "+260955883204", address: "Kafue River Road" }
      ];
      setCustomers(docClients);

      const clinicAccounts = INITIAL_ACCOUNTS.map(a => {
        if (a.code === "1010") return { ...a, balance: 185000 }; 
        if (a.code === "1020") return { ...a, balance: 6500 };   
        if (a.code === "4500") return { ...a, balance: 34200 };  
        if (a.code === "5300") return { ...a, balance: 9500 };   
        return { ...a, balance: 0 };
      });
      setAccounts(clinicAccounts);

      localStorage.setItem("mabala_clinic_name", "Lusaka Metropolitan Veterinary Clinic");
      localStorage.setItem("mabala_clinic_license", "ZVC-CLINIC-9024X");

    } else if (role === "Input Supplier") {
      setSubscriptionTier("Commercial Growth Layer");
      setWorkspaceMode("Farmer");
      setCurrentRole("Farm Owner");

      const demoVendorRec = {
        id: "demo-vendor-1",
        name: "Mabala Demo Inputs & Agronomy",
        category: "Seeds & Agronomy" as any,
        location: "Great East Rd, Lusaka - 5km",
        distanceKm: 5,
        phone: "+260 977 112233",
        email: demoEmail,
        subscriptionPackage: "Agro-Vet Clinical Suite",
        status: "Active" as any,
        joinedDate: "2026-06-01",
        expiryDate: "2027-12-31",
        credits: 800,
        logoColor: "emerald"
      };

      setMarketplaceVendors([
        demoVendorRec,
        {
          id: "v-2",
          name: "Zam-Vet Pharmacy Store Ltd",
          category: "Veterinary & Health" as any,
          location: "Cairo Road, Lusaka - 1.2km",
          distanceKm: 1.2,
          phone: "+260 966 887766",
          email: "sales@zamvet.zm",
          subscriptionPackage: "Basic",
          status: "Active" as any,
          joinedDate: "2026-04-10",
          logoColor: "blue"
        }
      ]);

      const demoPid1 = "demo-prod-1";
      const demoPid2 = "demo-prod-2";
      const demoPid3 = "demo-prod-3";
      const demoPid4 = "demo-prod-4";

      const demoProducts = [
        {
          id: demoPid1,
          vendorId: "demo-vendor-1",
          vendorName: "Mabala Demo Inputs & Agronomy",
          name: "Premium D-Compound Fertilizer (50kg)",
          category: "Seeds & Agronomy",
          price: 360,
          stock: 450,
          description: "Zambia-formulated fertilizer high in Nitrogen & Phosphates for exceptional crop rooting performance.",
          iconEmoji: "🌱",
          unitOfMeasure: "bag",
          vatApplicable: true,
          productLocation: "Depot Store B - Lusaka",
          isActive: true
        },
        {
          id: demoPid2,
          vendorId: "demo-vendor-1",
          vendorName: "Mabala Demo Inputs & Agronomy",
          name: "Pioneer Hybrid Seed Maize PHC-09 (25kg)",
          category: "Seeds & Agronomy",
          price: 245,
          stock: 120,
          description: "High FCR crop drought-resistant hybrid seed maize tailored for medium-rainfall agroecological regions.",
          iconEmoji: "🌽",
          unitOfMeasure: "bag",
          vatApplicable: true,
          productLocation: "Depot Store B - Lusaka",
          isActive: true
        },
        {
          id: demoPid3,
          vendorId: "demo-vendor-1",
          vendorName: "Mabala Demo Inputs & Agronomy",
          name: "Premium Broiler Starter Feed (50kg)",
          category: "Feeds & Formulations",
          price: 310,
          stock: 85,
          description: "Complete broiler crumbling formula packed with crucial vitamins & amino acids to maximize day-old survival rates.",
          iconEmoji: "🐔",
          unitOfMeasure: "bag",
          isActive: true
        },
        {
          id: demoPid4,
          vendorId: "demo-vendor-1",
          vendorName: "Mabala Demo Inputs & Agronomy",
          name: "Bayer Bovine Tick Dip Deworm (5 Liters)",
          category: "Veterinary & Health",
          price: 850,
          stock: 35,
          description: "Exceptional clinical strength tick dip concentrate to safeguard herds against Corridor disease & heartwater ticks.",
          iconEmoji: "🐂",
          unitOfMeasure: "each",
          vatApplicable: true,
          productLocation: "Cold store registry C",
          isActive: true
        }
      ];
      setMarketplaceProducts(demoProducts);

      setMarketplaceRiders([
        { id: "rd-1", name: "Mutale Mwamba (Express)", phone: "+260977223344", rating: 4.8, vehicle: "Yamaha Motor Bike KX-90", avatarColor: "bg-emerald-500", status: "Available" },
        { id: "rd-2", name: "Banda Chanda (Eco Delivery)", phone: "+260966112233", rating: 4.6, vehicle: "Bajaj Delivery Trike", avatarColor: "bg-blue-500", status: "On Delivery" }
      ]);

      setMarketplaceOrders([
        {
          id: "ord-10023",
          vendorId: "demo-vendor-1",
          vendorName: "Mabala Demo Inputs & Agronomy",
          buyerEmail: "chisambafarmer@gmail.com",
          productId: demoPid1,
          productName: "Premium D-Compound Fertilizer (50kg)",
          quantity: 20,
          priceAtPurchase: 360,
          subtotal: 7200,
          deliveryFee: 100,
          commissionAmount: 720,
          totalAmount: 7300,
          recipientName: "Bwalya Tembo (Chisamba Co-op)",
          recipientPhone: "+260966443322",
          deliveryAddress: "Kalingalinga Market West Road, Plot 5",
          riderId: "rd-1",
          riderName: "Mutale Mwamba (Express)",
          distanceKm: 20,
          date: "2026-06-06",
          status: "Processing" as any,
          paymentProvider: "Airtel Money" as any,
          paymentPhone: "+260977221199"
        },
        {
          id: "ord-10024",
          vendorId: "demo-vendor-1",
          vendorName: "Mabala Demo Inputs & Agronomy",
          buyerEmail: "chongwecoop@gmail.com",
          productId: demoPid2,
          productName: "Pioneer Hybrid Seed Maize PHC-09 (25kg)",
          quantity: 5,
          priceAtPurchase: 245,
          subtotal: 1225,
          deliveryFee: 25,
          commissionAmount: 122.5,
          totalAmount: 1250,
          recipientName: "Agness Phiri",
          recipientPhone: "+260955998811",
          deliveryAddress: "Stand No 4, Chongwe West Depot",
          riderId: "rd-2",
          riderName: "Banda Chanda (Eco Delivery)",
          distanceKm: 5,
          date: "2026-06-07",
          status: "Out For Delivery" as any,
          paymentProvider: "MTN MoMo" as any,
          paymentPhone: "+260966224488"
        }
      ]);
    }

    setCredits(800); 
    setIsAuthenticated(true);
    setActiveTab("dashboard");
  };

  // Regular registrations
  const handleRegister = async (data: {
    fullName: string;
    email: string;
    farmName: string;
    country: CountryInfo;
    subscriptionTier: string;
    password?: string;
  }) => {
    // Save to Firebase Auth if email and password provided, and Firebase is configured
    if (isConfigured && data.email && data.password) {
      try {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
      } catch (err: any) {
        if (err.code !== "auth/email-already-in-use") {
          throw err;
        }
      }
    }

    // Look up package pricing dynamically from config
    const matchedPkg = platformPackages.find(p => p.name === data.subscriptionTier) || platformPackages[0];
    
    // Launch Lipila Mobile Money Terminal before granting access or issuing credits
    setLipilaCheckout({
      type: "subscription",
      name: matchedPkg.name,
      price: matchedPkg.price,
      creditsToAward: matchedPkg.credits,
      description: matchedPkg.features || matchedPkg.description || `Mabala Plan: ${matchedPkg.name}`,
      registrationData: data // pass key data to provision once paid successfully
    });
  };

  const handleRegisterVendor = async (data: {
    storeName: string;
    category: "Seeds & Agronomy" | "Veterinary & Health" | "Equipment & Tech" | "Feeds & Formulations";
    location: string;
    distanceKm: number;
    phone: string;
    email: string;
    subscriptionPackage: string;
    password?: string;
    logoUrl?: string;
  }) => {
    // Save to Firebase Auth if email and password provided, and Firebase is configured
    if (isConfigured && data.email && data.password) {
      try {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
      } catch (err: any) {
        if (err.code !== "auth/email-already-in-use") {
          throw err;
        }
      }
    }

    // Mapping package details
    const pkgs = [
      { id: "Basic", name: "Mabala Basic Merchant", price: 150, credits: 300, desc: "Publish up to 5 items inside farm catalogs directories." },
      { id: "Elite", name: "Mabala Elite Vendor", price: 500, credits: 5000, desc: "Publish 25 items, prioritize results directories, analytics." },
      { id: "Cooperative Pro", name: "Cooperative Pro", price: 1000, credits: 25000, desc: "Infinite product catalogue, multi-agent store logins, VIP bike riders." }
    ];
    const matched = pkgs.find(p => p.id === data.subscriptionPackage || p.name === data.subscriptionPackage) || pkgs[0];

    // Launch Lipila Mobile Money terminal for Vendor plan
    setLipilaCheckout({
      type: "vendor-subscription",
      name: matched.name,
      price: matched.price,
      creditsToAward: matched.credits,
      description: matched.desc,
      registrationData: { ...data, isVendor: true }
    });
  };

  const handleLogin = async (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password?.trim() || "";

    if (cleanEmail === "mabalademo@mabala.cloud" && (cleanPassword === "Mabala@2026" || cleanPassword === "Mabala@2026.")) {
      await handleInitDemoWorkspace("Farmer");
      return;
    }

    // Real Firebase auth sign-in if password provided, and Firebase is configured
    if (isConfigured && email && password) {
      await signInWithEmailAndPassword(auth, email, password);
    }
    const isSuper = cleanEmail === "deepvaleyfarm@gmail.com";
    
    // Direct login simulation
    setUserProfile({
      name: isSuper ? "Deep Valley Farms" : (email.split("@")[0] || "Deep Valley Manager"),
      email: email,
      phone: "+260977889900"
    });
    handleStartDemo(email);
  };

  const handleRestoreBackup = (data: BackupData) => {
    if (data.farms && data.farms.length > 0) {
      setFarms(data.farms);
    }
    if (data.accounts && data.accounts.length > 0) {
      setAccounts(data.accounts);
    }
    setSuppliers(data.suppliers || []);
    setCustomers(data.customers || []);
    setExpenses(data.expenses || []);
    setInvoices(data.invoices || []);
    setQuotations(data.quotations || []);
    setCrops(data.crops || []);
    setEmployees(data.employees || []);
    setPayslips(data.payslips || []);
    setPoultry(data.poultry || []);
    setFish(data.fish || []);
    setInventory(data.inventory || []);
    setCashSales(data.cashSales || []);
    setLoans(data.loans || []);
    setInvestments(data.investments || []);
    setLivestock(data.livestock || []);
    
    // Restore new states
    setAssets(data.assets || []);
    setOtherRevenues(data.otherRevenues || []);
    setLeaveRecords(data.leaveRecords || []);
    setEmployeeAdvances(data.advances || []);
    setAuditLogs(data.auditLogs || []);
    setArchivedRecords(data.archivedRecords || []);

    if (data.credits !== undefined) {
      setCredits(data.credits);
    }
    if (data.userProfile) {
      setUserProfile(data.userProfile);
    }
    if (data.teamMembers && data.teamMembers.length > 0) {
      setTeamMembers(data.teamMembers);
    }
    setActiveTab("dashboard");
  };

  const handleClearDatabase = () => {
    setSuppliers([]);
    setCustomers([]);
    setExpenses([]);
    setInvoices([]);
    setQuotations([]);
    setCrops([]);
    setEmployees([]);
    setPayslips([]);
    setPoultry([]);
    setFish([]);
    setInventory([]);
    setCashSales([]);
    setLoans([]);
    setInvestments([]);
    setLivestock([]);
    
    setAssets([]);
    setOtherRevenues([]);
    setLeaveRecords([]);
    setEmployeeAdvances([]);
    setAuditLogs([]);
    setArchivedRecords([]);

    const emptyAccounts = INITIAL_ACCOUNTS.map(a => ({ ...a, balance: 0 }));
    setAccounts(emptyAccounts);
    setCredits(300);
  };

  // State loggers
  const archiveDeletedRecord = (moduleName: string, originalId: string, description: string, data: any) => {
    const newArchive: ArchiveRecord = {
      id: "ARC-" + Date.now().toString().slice(-6),
      archivedAt: new Date().toISOString(),
      module: moduleName,
      originalId,
      description,
      data: JSON.stringify(data),
      farmId: activeFarm?.id || "farm-1"
    };
    setArchivedRecords(prev => [newArchive, ...prev]);
  };

  const writeAuditLog = (action: AuditLog["action"], moduleName: string, record: string, detail: string) => {
    const newLog: AuditLog = {
      id: "AUD-" + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      user: currentRole === "Platform Administrator" ? "Platform Admin" : userProfile.name || "System User",
      action,
      module: moduleName,
      record,
      detail,
      farmId: activeFarm?.id || "farm-1"
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddAsset = (asset: Asset) => {
    if (isReadonly) return;
    setAssets(prev => [asset, ...prev]);
    writeAuditLog("CREATE", "Asset Register", asset.name, `Asset registered: ${asset.name} with value ${selectedCountry.symbol} ${asset.purchasePrice}`);

    // Standard double-entry: Debit Asset 1530 & Credit Bank 1010
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") {
        balance -= asset.purchasePrice;
      }
      if (acc.code === "1530") {
        balance += asset.purchasePrice;
      }
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    deductCredits(2);
  };

  const handleArchiveAsset = (assetId: string) => {
    if (isReadonly) return;
    const item = assets.find(a => a.id === assetId);
    if (!item) return;

    archiveDeletedRecord("Asset Register", item.id, `Asset: ${item.name}`, item);
    setAssets(prev => prev.filter(a => a.id !== assetId));
    writeAuditLog("DELETE", "Asset Register", item.name, `Archived and soft-deleted asset: ${item.name}`);
    deductCredits(1);
  };

  const handleAddInvestment = (inv: Investment) => {
    if (isReadonly) return;
    setInvestments(prev => [inv, ...prev]);
    writeAuditLog("CREATE", "Finance", inv.description, `Investment registered of value ${selectedCountry.symbol} ${inv.amount}`);

    // Update CoA (Double Entry): Debit 1600 & Credit 1010
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") {
        balance -= inv.amount;
      }
      if (acc.code === "1600") {
        balance += inv.amount;
      }
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    deductCredits(2);
  };

  const handleArchiveInvestment = (invId: string) => {
    if (isReadonly) return;
    const item = investments.find(i => i.id === invId);
    if (!item) return;

    archiveDeletedRecord("Finance", item.id, `Investment: ${item.description}`, item);
    setInvestments(prev => prev.filter(i => i.id !== invId));
    writeAuditLog("DELETE", "Finance", item.description, `Archived and soft-deleted investment: ${item.description}`);
    deductCredits(1);
  };

  const handleAddOtherRevenue = (rev: OtherRevenue) => {
    if (isReadonly) return;
    setOtherRevenues(prev => [rev, ...prev]);
    writeAuditLog("CREATE", "Finance", rev.description, `Registered other revenue: ${rev.revenueType} of value ${selectedCountry.symbol} ${rev.amount}`);

    // Update CoA (Double Entry): Debit 1010 & Credit 4400 or Equity 3010
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") {
        balance += rev.amount;
      }
      if (rev.revenueType === "Shareholder Contribution") {
        if (acc.code === "3010") balance += rev.amount;
      } else {
        if (acc.code === "4400") balance += rev.amount;
      }
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    deductCredits(2);
  };

  const handleArchiveOtherRevenue = (revId: string) => {
    if (isReadonly) return;
    const item = otherRevenues.find(r => r.id === revId);
    if (!item) return;

    archiveDeletedRecord("Finance", item.id, `Other Revenue: ${item.description}`, item);
    setOtherRevenues(prev => prev.filter(r => r.id !== revId));
    writeAuditLog("DELETE", "Finance", item.description, `Archived and soft-deleted revenue record: ${item.description}`);
    deductCredits(1);
  };

  const handleAddLeaveRecord = (leave: Omit<LeaveRecord, "id" | "farmId">) => {
    if (isReadonly) return;
    const newLeave: LeaveRecord = {
      ...leave,
      id: "LV-" + Date.now().toString().slice(-4),
      farmId: activeFarm?.id || "farm-1"
    };
    setLeaveRecords(prev => [newLeave, ...prev]);
    writeAuditLog("CREATE", "Payroll", leave.employeeName, `Leave booked: ${leave.leaveType} for ${leave.employeeName}`);
    deductCredits(1);
  };

  const handleArchiveLeaveRecord = (leaveId: string) => {
    if (isReadonly) return;
    const item = leaveRecords.find(l => l.id === leaveId);
    if (!item) return;

    archiveDeletedRecord("Payroll", item.id, `Leave: ${item.employeeName} (${item.leaveType})`, item);
    setLeaveRecords(prev => prev.filter(l => l.id !== leaveId));
    writeAuditLog("DELETE", "Payroll", item.employeeName, `Archived leave record for employee: ${item.employeeName}`);
    deductCredits(1);
  };

  const handleAddEmployeeAdvance = (adv: Omit<EmployeeAdvance, "id" | "farmId">) => {
    if (isReadonly) return;
    const newAdv: EmployeeAdvance = {
      ...adv,
      id: "ADV-" + Date.now().toString().slice(-4),
      farmId: activeFarm?.id || "farm-1"
    };
    setEmployeeAdvances(prev => [newAdv, ...prev]);
    writeAuditLog("CREATE", "Payroll", adv.employeeName, `Disbursed employee advance of ${selectedCountry.symbol} ${adv.advanceAmount}`);

    // Update CoA (Double Entry): Debit Loans Receivable 1200 & Credit Bank 1010
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") balance -= adv.advanceAmount;
      if (acc.code === "1200") balance += adv.advanceAmount;
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    deductCredits(2);
  };

  const handleRepayEmployeeAdvance = (id: string, amount: number) => {
    if (isReadonly) return;
    setEmployeeAdvances(prev => prev.map(adv => {
      if (adv.id === id) {
        const remaining = Math.max(adv.remainingBalance - amount, 0);
        return {
          ...adv,
          remainingBalance: remaining,
          status: remaining === 0 ? "Paid" : "Approved"
        };
      }
      return adv;
    }));

    const adv = employeeAdvances.find(a => a.id === id);
    if (adv) {
      writeAuditLog("EDIT", "Payroll", adv.employeeName, `Advance repaid: ${selectedCountry.symbol} ${amount} received manually`);
    }

    // Update CoA (Double Entry): Debit Bank 1010 & Credit Receivable 1200
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") balance += amount;
      if (acc.code === "1200") balance -= amount;
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    deductCredits(1);
  };

  const handleDeleteCrop = (id: string) => {
    if (isReadonly) return;
    const item = crops.find(c => c.id === id);
    if (!item) return;
    archiveDeletedRecord("Crops", item.id, `Crop Cycle: ${item.cropType} (${item.fieldBlock})`, item);
    setCrops(prev => prev.filter(c => c.id !== id));
    writeAuditLog("DELETE", "Crops", item.cropType, `Archived and soft-deleted crop cycle: ${item.cropType}`);
    deductCredits(1);
  };

  const handleDeleteEmployee = (id: string) => {
    if (isReadonly) return;
    const item = employees.find(e => e.id === id);
    if (!item) return;
    archiveDeletedRecord("Employees", item.id, `Employee: ${item.name}`, item);
    setEmployees(prev => prev.filter(e => e.id !== id));
    writeAuditLog("DELETE", "Employees", item.name, `Archived and soft-deleted employee: ${item.name}`);
    deductCredits(1);
  };

  const handleDeleteLivestockRecord = (id: string) => {
    if (isReadonly) return;
    const item = livestock.find(l => l.id === id);
    if (!item) return;
    archiveDeletedRecord("Livestock", item.id, `Livestock Tag: ${item.tagId} (${item.species})`, item);
    setLivestock(prev => prev.filter(l => l.id !== id));
    
    // adjust biological valuation balance in chart of accounts
    const value = item.currentValue || 0;
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1420") {
        balance -= value;
      }
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);

    writeAuditLog("DELETE", "Livestock", item.tagId, `Archived and soft-deleted animal: ${item.tagId}`);
    deductCredits(1);
  };

  const handleDeletePoultryBatch = (id: string) => {
    if (isReadonly) return;
    const item = poultry.find(p => p.id === id);
    if (!item) return;
    archiveDeletedRecord("Poultry", item.id, `Poultry Batch: ${item.batchName}`, item);
    setPoultry(prev => prev.filter(p => p.id !== id));
    writeAuditLog("DELETE", "Poultry", item.batchName, `Archived and soft-deleted poultry batch: ${item.batchName}`);
    deductCredits(1);
  };

  const handleArchiveEmployeeAdvance = (advId: string) => {
    if (isReadonly) return;
    const item = employeeAdvances.find(a => a.id === advId);
    if (!item) return;

    archiveDeletedRecord("Payroll", item.id, `Employee Advance: ${item.employeeName} (${item.advanceAmount})`, item);
    setEmployeeAdvances(prev => prev.filter(a => a.id !== advId));
    writeAuditLog("DELETE", "Payroll", item.employeeName, `Archived and soft-deleted employee advance: ${item.employeeName}`);
    deductCredits(1);
  };

  const handleRestoreRecordFromArchive = (arc: ArchiveRecord) => {
    if (isReadonly) return;
    try {
      const parsedData = JSON.parse(arc.data);
      if (arc.module === "Finance") {
        if (arc.description.startsWith("Investment")) {
          setInvestments(prev => [parsedData, ...prev]);
        } else {
          setOtherRevenues(prev => [parsedData, ...prev]);
        }
      } else if (arc.module === "Asset Register") {
        setAssets(prev => [parsedData, ...prev]);
      } else if (arc.module === "Payroll") {
        if (arc.description.startsWith("Leave")) {
          setLeaveRecords(prev => [parsedData, ...prev]);
        } else {
          setEmployeeAdvances(prev => [parsedData, ...prev]);
        }
      } else if (arc.module === "Crops") {
        setCrops(prev => [parsedData, ...prev]);
      } else if (arc.module === "Employees") {
        setEmployees(prev => [parsedData, ...prev]);
      } else if (arc.module === "Livestock") {
        setLivestock(prev => [parsedData, ...prev]);
        const value = parsedData.currentValue || 0;
        const updatedAccounts = accounts.map(acc => {
          let balance = acc.balance;
          if (acc.code === "1420") {
            balance += value;
          }
          return { ...acc, balance };
        });
        setAccounts(updatedAccounts);
      } else if (arc.module === "Poultry") {
        setPoultry(prev => [parsedData, ...prev]);
      }
      setArchivedRecords(prev => prev.filter(r => r.id !== arc.id));
      writeAuditLog("RESTORE", arc.module, arc.description, `Restored archived record`);
      deductCredits(2);
    } catch (e) {
      alert("Failed to parse archive payload for restoration.");
    }
  };

  const handlePermanentDeleteFromArchive = (archiveId: string) => {
    const item = archivedRecords.find(a => a.id === archiveId);
    if (!item) return;

    setArchivedRecords(prev => prev.filter(a => a.id !== archiveId));
    writeAuditLog("DELETE", "Compliance", item.description, `Permanently purged from archive: ${item.description}`);
    deductCredits(1);
  };

  const handleAddLivestockRecord = (record: LivestockRecord) => {
    if (isReadonly) return;
    setLivestock(prev => [record, ...prev]);
    writeAuditLog("CREATE", "Livestock", record.tagId, `Registered animal tag: ${record.species} [${record.tagId}] (Acquisition: ${record.acquisitionType})`);
    
    // Impact Chart of Accounts dynamically based on acquisition type
    const cost = record.purchasePrice || 0;
    const value = record.currentValue || 0;
    
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1420") {
        // Biological Assets - Livestock Herd value
        balance += value;
      }
      if (record.acquisitionType === "Bought") {
        if (acc.code === "1010") {
          // Bank Operational Account Credit
          balance -= cost;
        }
      } else {
        // Birthed or Gifted
        if (acc.code === "4400") {
          // Other Farm Ancillary Income Credit (Gain on biological evaluation)
          balance += value;
        }
      }
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);

    deductCredits(1);
  };

  const handleAddLivestockHealthEvent = (tagId: string, event: { date: string; type: string; details: string; cost: number }) => {
    if (isReadonly) return;
    setLivestock(prev => prev.map(rec => {
      if (rec.tagId === tagId) {
        return {
          ...rec,
          healthEvents: [...rec.healthEvents, event]
        };
      }
      return rec;
    }));
    writeAuditLog("CREATE", "Livestock", tagId, `Logged health treatment for ${tagId}: ${event.type}`);

    // If it's a professional veterinary charge, let's impact accounts relative to Expense category (COGS / Vet costs 5300)
    if (event.cost > 0) {
      const updatedAccounts = accounts.map(acc => {
        let balance = acc.balance;
        if (acc.code === "1010") balance -= event.cost; // bank credit
        if (acc.code === "5300") balance += event.cost; // vet expense debit
        return { ...acc, balance };
      });
      setAccounts(updatedAccounts);
    }
    deductCredits(1);
  };

  const handleAddLivestockFeedingLog = (tagId: string, log: { date: string; feedType: string; quantityKg: number }) => {
    if (isReadonly) return;
    setLivestock(prev => prev.map(rec => {
      if (rec.tagId === tagId) {
        return {
          ...rec,
          feedingLogs: [...(rec.feedingLogs || []), log]
        };
      }
      return rec;
    }));
    writeAuditLog("CREATE", "Livestock", tagId, `Logged biological feed session for ${tagId}`);
    deductCredits(1);
  };

  const handleAddLoan = (loan: Loan) => {
    if (isReadonly) return;
    setLoans(prev => [loan, ...prev]);
    writeAuditLog("CREATE", "Finance", loan.recipient, `Loan registered for ${loan.recipient}: Principal ${selectedCountry.symbol} ${loan.principal}`);

    // Standard double-entry: Issued Loan vs Received Loan CoA balancing
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (loan.type === "Issued") {
        if (acc.code === "1010") balance -= loan.principal;
        if (acc.code === "1200") balance += loan.principal;
      } else {
        if (acc.code === "1010") balance += loan.principal;
        if (acc.code === "2200") balance += loan.principal;
      }
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    deductCredits(2);
  };

  const handleRealizeInvestment = (id: string) => {
    if (isReadonly) return;
    let amt = 0;
    setInvestments(prev => prev.map(inv => {
      if (inv.id === id) {
        amt = inv.amount;
        writeAuditLog("EDIT", "Finance", inv.description, `Investment matured and principal was liquidated back to bank: ${selectedCountry.symbol} ${inv.amount}`);
        return { ...inv, status: "Matured" };
      }
      return inv;
    }));

    if (amt > 0) {
      const updatedAccounts = accounts.map(acc => {
        let balance = acc.balance;
        if (acc.code === "1010") balance += amt; // Cash/Bank debit
        if (acc.code === "1210") balance -= amt; // Short-term investments credit
        return { ...acc, balance };
      });
      setAccounts(updatedAccounts);
    }
    deductCredits(2);
  };

  const handleAddLoanRepayment = (loanId: string, amount: number, paymentMethod: string, notes?: string) => {
    if (isReadonly) return;
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const outstanding = Math.max(loan.outstandingBalance - amount, 0);
        writeAuditLog("EDIT", "Finance", loan.recipient, `Loan repayment of ${selectedCountry.symbol} ${amount} received/paid via ${paymentMethod}`);
        return {
          ...loan,
          outstandingBalance: outstanding
        };
      }
      return loan;
    }));

    // Standard double-entry bookkeeping
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") balance += amount;
      if (acc.code === "1200") balance -= amount;
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    deductCredits(2);
  };

  const handleOffsetLoan = (loanId: string, otherRevenueId: string, amount: number, offsetType: string) => {
    if (isReadonly) return;
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const outstanding = Math.max(loan.outstandingBalance - amount, 0);
        writeAuditLog("EDIT", "Finance", loan.recipient, `Loan offset by ${offsetType}: outstanding balance reduced by ${selectedCountry.symbol} ${amount}`);
        return {
          ...loan,
          outstandingBalance: outstanding
        };
      }
      return loan;
    }));
    deductCredits(2);
  };

  // Geographic Country dropdown selection modifier
  const handleCountryOverrideChange = (code: string) => {
    const matched = COUNTRIES.find(c => c.code === code);
    if (!matched) return;
    setSelectedCountry(matched);
    
    // Dynamically override active farm currency Symbol and name
    const updated = [...farms];
    updated[activeFarmIndex] = {
      ...activeFarm,
      currency: matched.currency,
      currencySymbol: matched.symbol,
      taxSystem: matched.defaultTaxSystem
    };
    setFarms(updated);
    deductCredits(1); // Standard configuration write action
  };

  // ERP actions
  const handleAddAccount = (acc: Account) => {
    if (isReadonly) return;
    setAccounts(prev => [acc, ...prev]);
    deductCredits(2); // standard bookkeeping code setup
  };

  const handleAddSupplier = (sup: Supplier) => {
    if (isReadonly) return;
    setSuppliers(prev => [sup, ...prev]);
    deductCredits(1); // LIGHT write operation
  };

  const handleAddCustomer = (cus: Customer) => {
    if (isReadonly) return;
    setCustomers(prev => [cus, ...prev]);
    deductCredits(1); // LIGHT write operation
  };

  const handleAddExpense = (tx: ExpenseTransaction) => {
    if (isReadonly) return;
    setExpenses(prev => [tx, ...prev]);
    
    // Automatically credit bank account (1010) and debit correspond code balances in Chart of Accounts!
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      // Credit 1010
      if (acc.code === "1010") {
        balance -= tx.total;
      }
      // Debit correspond code
      tx.rows.forEach(r => {
        if (acc.code === r.coaCode) {
          balance += r.amount;
        }
      });
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    deductCredits(3); // HEAVY financial journal action
  };

  const handleAddCrop = (newCrop: CropCycle) => {
    if (isReadonly) return;
    setCrops(prev => [newCrop, ...prev]);
    deductCredits(2); // STANDARD agronomic crop setup
  };

  const handleUpdateMilestone = (cropId: string, milestoneId: string, isCompleted: boolean) => {
    if (isReadonly) return;
    setCrops(prev => prev.map(c => {
      if (c.id === cropId) {
        return {
          ...c,
          milestones: c.milestones.map(m => m.id === milestoneId ? { ...m, isCompleted } : m)
        };
      }
      return c;
    }));
    deductCredits(1);
  };

  const handleUpdateCropStatus = (cropId: string, status: CropCycle["status"]) => {
    if (isReadonly) return;
    setCrops(prev => prev.map(c => c.id === cropId ? { ...c, status } : c));
    deductCredits(1);
  };

  const handleAddEmployee = (emp: Employee) => {
    if (isReadonly) return;
    setEmployees(prev => [emp, ...prev]);
    deductCredits(2);
  };

  const handleRunPayroll = (slips: Payslip[]) => {
    if (isReadonly) return;
    setPayslips(prev => [...slips, ...prev]);
    
    // Auto-update wages liabilities
    const totalWageSum = slips.reduce((s, x) => s + x.basicSalary, 0);
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") {
        balance -= slips.reduce((s, x) => s + x.netPay, 0); // debit cash outflow
      }
      if (acc.code === "5100") {
        balance += totalWageSum; // staff expense accrual
      }
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    deductCredits(5); // PREMIUM operation run
  };

  const handleAddInvoice = (inv: Invoice) => {
    if (isReadonly) return;
    setInvoices(prev => [inv, ...prev]);
    
    // General ledger balance update: Debit Accounts Recv (1100), Credit designated Revenue account balance
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1100") {
        balance += inv.total;
      }
      if (acc.code === inv.coaCredit && (acc.category === "Revenue" || acc.code === "4500")) {
        balance += inv.subtotal;
      }
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    deductCredits(3);
  };

  const handleAddQuotation = (qt: Quotation) => {
    if (isReadonly) return;
    setQuotations(prev => [qt, ...prev]);
    deductCredits(1); // quotation is LIGHT
  };

  const handleMarkPaid = (invId: string, paymentAmount?: number) => {
    if (isReadonly) return;

    const targetInvoice = invoices.find(inv => inv.id === invId);
    if (!targetInvoice) return;

    // Extract current paid amount 
    const currentPaid = targetInvoice.paidAmount !== undefined 
      ? targetInvoice.paidAmount 
      : (targetInvoice.status === "Paid" ? targetInvoice.total : 0);
    
    const remainingBalance = targetInvoice.total - currentPaid;
    
    // Determine the exact payment amount to apply
    let amountToApply = paymentAmount !== undefined ? paymentAmount : remainingBalance;
    if (amountToApply <= 0) return;
    if (amountToApply > remainingBalance) {
      amountToApply = remainingBalance;
    }

    const newPaidAmount = currentPaid + amountToApply;
    const isNowFullyPaid = newPaidAmount >= targetInvoice.total;
    const newStatus = isNowFullyPaid ? "Paid" : "Unpaid";

    // 1. Update Invoices array
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invId) {
        return {
          ...inv,
          paidAmount: newPaidAmount,
          status: newStatus
        };
      }
      return inv;
    }));

    // 2. Post Double Entry (Chart of Accounts Balance): Debit 1010 Bank / Credit 1100 Receivables
    setAccounts(prevAccs => prevAccs.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") {
        balance += amountToApply;
      }
      if (acc.code === "1100") {
        balance -= amountToApply;
      }
      return { ...acc, balance };
    }));

    // 3. Update the Sales Tracker (CashSales ledger desk) automatically
    const newCashSale: CashSale = {
      id: `CS-INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString().split('T')[0],
      description: `Invoice Payment: ${targetInvoice.invoiceNumber} (${targetInvoice.customerName})`,
      customer: targetInvoice.customerName,
      amount: amountToApply,
      paymentMethod: "Bank Transfer",
      coaDebit: "1010",
      coaCredit: targetInvoice.coaCredit || "4100",
      farmId: targetInvoice.farmId || "farm-1"
    };
    setCashSales(prevSales => [newCashSale, ...prevSales]);

    // 4. Update Crop Cycle (actualYieldKg & revenueLinked) if linked to a cropId
    const linkedCropId = (targetInvoice as any).cropId;
    if (linkedCropId) {
      const totalInvoiceLinesQuantity = targetInvoice.lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0) || 1;
      const incrementalYield = totalInvoiceLinesQuantity * (amountToApply / targetInvoice.total);
      
      setCrops(prevCrops => prevCrops.map(c => {
        if (c.id === linkedCropId) {
          return {
            ...c,
            // Yield update achieved so far & revenues linked
            actualYieldKg: Number(((c.actualYieldKg || 0) + incrementalYield).toFixed(2)),
            revenueLinked: Number(((c.revenueLinked || 0) + amountToApply).toFixed(2))
          };
        }
        return c;
      }));
    }

    deductCredits(2);
  };

  const handleConvertQuote = (quote: Quotation) => {
    if (isReadonly) return;
    
    // Auto-create invoice identical parameters
    const inv: Invoice = {
      id: "INV-GEN-" + Date.now(),
      invoiceNumber: `INV-2026-00${invoices.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: "2026-06-30",
      customerName: quote.customerName,
      taxAmount: quote.taxAmount,
      subtotal: quote.subtotal,
      total: quote.total,
      lines: quote.lines,
      status: "Unpaid",
      coaDebit: "1100",
      coaCredit: "4100",
      farmId: quote.farmId
    };

    // Remove quote or mark accepted
    setQuotations(prev => prev.map(q => q.id === quote.id ? { ...q, status: "Accepted" } : q));
    handleAddInvoice(inv);
  };

  const handleAddPoultry = (batch: PoultryBatch) => {
    if (isReadonly) return;
    setPoultry(prev => [batch, ...prev]);
    
    // Post initial biological asset acquisition immediately if starting active (not PLANNED)
    if (batch.status !== "PLANNED") {
      const unitCost = batch.unitAcquisitionCost ?? 12;
      const transCost = batch.transportCost ?? 0;
      const setupCost = batch.brooderSetupCost ?? 0;
      const acquisitionCost = (batch.quantity * unitCost) + transCost + setupCost;
      if (acquisitionCost > 0) {
        setAccounts(prevAccs => prevAccs.map(acc => {
          let balance = acc.balance;
          if (acc.code === "1010") balance -= acquisitionCost;
          if (acc.code === "1430") balance += acquisitionCost;
          return { ...acc, balance };
        }));
      }
    }
    deductCredits(2);
  };

  const handleUpdatePoultryBatch = (updatedBatch: PoultryBatch) => {
    if (isReadonly) return;
    
    setPoultry(prev => {
      const oldBatch = prev.find(b => b.id === updatedBatch.id);
      if (oldBatch) {
        // 1. Double-entry for newly posted sales logs
        const oldSalesLen = oldBatch.salesLogs ? oldBatch.salesLogs.length : 0;
        const newSalesLen = updatedBatch.salesLogs ? updatedBatch.salesLogs.length : 0;
        if (newSalesLen > oldSalesLen) {
          const addedSale = updatedBatch.salesLogs[newSalesLen - 1];
          const saleAmount = addedSale.amount;
          // Dr Bank (1010), Cr Poultry Revenue (4200)
          setAccounts(prevAccs => prevAccs.map(acc => {
            let balance = acc.balance;
            if (acc.code === "1010") balance += saleAmount;
            if (acc.code === "4200") balance += saleAmount;
            return { ...acc, balance };
          }));
        }

        // 1b. Double-entry for newly posted egg sales logs
        const oldEggSalesLen = oldBatch.eggSales ? oldBatch.eggSales.length : 0;
        const newEggSalesLen = updatedBatch.eggSales ? updatedBatch.eggSales.length : 0;
        if (newEggSalesLen > oldEggSalesLen) {
          const addedEggSale = updatedBatch.eggSales![newEggSalesLen - 1];
          const saleAmount = addedEggSale.totalRevenue;
          // Dr Bank (1010), Cr Poultry Revenue (4200)
          setAccounts(prevAccs => prevAccs.map(acc => {
            let balance = acc.balance;
            if (acc.code === "1010") balance += saleAmount;
            if (acc.code === "4200") balance += saleAmount;
            return { ...acc, balance };
          }));
        }

        // 2. Double-entry for newly posted medications
        const oldMedsLen = oldBatch.medications ? oldBatch.medications.length : 0;
        const newMedsLen = updatedBatch.medications ? updatedBatch.medications.length : 0;
        if (newMedsLen > oldMedsLen) {
          const addedMed = updatedBatch.medications[newMedsLen - 1];
          const medCost = addedMed.cost;
          if (medCost > 0) {
            // Cr Bank (1010), Dr Vet/Meds (5300)
            setAccounts(prevAccs => prevAccs.map(acc => {
              let balance = acc.balance;
              if (acc.code === "1010") balance -= medCost;
              if (acc.code === "5300") balance += medCost;
              return { ...acc, balance };
            }));
          }
        }

        // 3. Transition from PLANNED to any ACTIVE status -> post biological asset acquisition cost
        if (oldBatch.status === "PLANNED" && updatedBatch.status !== "PLANNED") {
          const unitCost = updatedBatch.unitAcquisitionCost ?? 12;
          const transCost = updatedBatch.transportCost ?? 0;
          const setupCost = updatedBatch.brooderSetupCost ?? 0;
          const acquisitionCost = (updatedBatch.quantity * unitCost) + transCost + setupCost;
          if (acquisitionCost > 0) {
            // Cr Bank (1010), Dr Biological assets - Poultry (1430)
            setAccounts(prevAccs => prevAccs.map(acc => {
              let balance = acc.balance;
              if (acc.code === "1010") balance -= acquisitionCost;
              if (acc.code === "1430") balance += acquisitionCost;
              return { ...acc, balance };
            }));
          }
        }
      }
      return prev.map(b => b.id === updatedBatch.id ? updatedBatch : b);
    });
  };

  const handleAddFeedLog = (
    batchId: string, 
    quantityKg: number, 
    cost: number, 
    fedByStr: string,
    dateStr?: string,
    feedTypeStr?: string,
    formulaUsedStr?: string,
    stageIdStr?: string
  ) => {
    if (isReadonly) return;
    setPoultry(prev => prev.map(b => {
      if (b.id === batchId) {
        const feedLogs = [
          ...b.feedLogs, 
          { 
            date: dateStr || new Date().toISOString().split('T')[0], 
            feedType: feedTypeStr || "Growth Feed pellets", 
            quantityKg, 
            cost, 
            fedBy: fedByStr,
            formulaUsed: formulaUsedStr,
            stageId: stageIdStr || b.currentStageId || "grower"
          }
        ];
        return { ...b, feedLogs };
      }
      return b;
    }));
    
    // Post feed cost expense to Dr 5210, Cr 1010 bank
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") balance -= cost;
      if (acc.code === "5210") balance += cost;
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    deductCredits(1);
  };

  const handleRecordPoultryEgg = (batchId: string, total: number, gradeA: number, gradeB: number) => {
    if (isReadonly) return;
    setPoultry(prev => prev.map(b => {
      if (b.id === batchId) {
        const eggCollections = [...b.eggCollections, { date: new Date().toISOString().split('T')[0], totalCollected: total, gradeA, gradeB, broken: total-gradeA-gradeB, dirty: 0 }];
        return { ...b, eggCollections };
      }
      return b;
    }));
    deductCredits(1);
  };

  const handleAddFishBatch = (batch: FishBatch) => {
    if (isReadonly) return;
    setFish(prev => [batch, ...prev]);
    deductCredits(2);
  };

  const handleAddWaterReading = (batchId: string, reading: WaterQualityReading) => {
    if (isReadonly) return;
    setFish(prev => prev.map(f => {
      if (f.id === batchId) {
        return { ...f, waterReadings: [...f.waterReadings, reading] };
      }
      return f;
    }));
    deductCredits(1);
  };

  // Top Up Action
  const handleTopUpConfirm = (amt: number) => {
    setCredits(prev => prev + amt);
    setShowTopUpModal(false);
    alert(`Thank you for your payment! Credited ${amt} write operations successfully to your Mabala tenant.`);
  };

  // Create additional farm within tenant
  const handleCreateFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName) return;

    const nf: Farm = {
      id: "farm-" + (farms.length + 1),
      name: newFarmName,
      tpin: activeFarm.tpin,
      address: newFarmAddr || "Lake Basin, Zambia",
      phone: newFarmPhone || "+260123123",
      email: activeFarm.email,
      financialYearStart: "2026-01-01",
      financialYearEnd: "2026-12-31",
      currency: selectedCountry.currency,
      currencySymbol: selectedCountry.symbol,
      taxSystem: selectedCountry.defaultTaxSystem
    };

    setFarms(prev => [...prev, nf]);
    setShowFarmConfigModal(false);
    setNewFarmName("");
    setNewFarmAddr("");
    setNewFarmPhone("");
    deductCredits(2);
  };

  // Role and Permission Management Functions
  const handleSessionRoleChange = (role: PredefinedRole) => {
    setCurrentRole(role);
    // Redirect if they lose privileges for the active tab
    if (activeTab !== "dashboard" && activeTab !== "permissions") {
      const activePerm = permissions[role]?.[activeTab];
      if (!activePerm || !activePerm.read) {
        setActiveTab("dashboard");
      }
    }
  };

  const handleUpdatePermission = (role: PredefinedRole, moduleId: string, type: "read" | "write", value: boolean) => {
    setPermissions(prev => {
      const updated = { ...prev };
      const rolePerms = { ...updated[role] };
      const modPerms = { ...rolePerms[moduleId] };
      modPerms[type] = value;
      
      // If read is disabled, write must be disabled as well
      if (type === "read" && !value) {
        modPerms.write = false;
      }
      
      rolePerms[moduleId] = modPerms;
      updated[role] = rolePerms;
      return updated;
    });
  };

  const handleAddTeamMember = (member: Omit<UserMember, "id" | "lastActive">) => {
    const newMember: UserMember = {
      ...member,
      id: "TM-" + Date.now().toString().slice(-4),
      lastActive: "Just invited",
    };
    setTeamMembers(prev => [...prev, newMember]);
    deductCredits(1);
  };

  const handleRemoveTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    deductCredits(1);
  };

  const handleChangeMemberRole = (id: string, role: PredefinedRole) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    deductCredits(1);
  };

  const hasReadPermission = (moduleKey: string) => {
    if (currentRole === "Platform Administrator" || currentRole === "Farm Owner") return true;
    const rule = permissions[currentRole]?.[moduleKey];
    return rule ? rule.read : false;
  };

  const hasWritePermission = (moduleKey: string) => {
    if (currentRole === "Platform Administrator" || currentRole === "Farm Owner") return true;
    const rule = permissions[currentRole]?.[moduleKey];
    return rule ? rule.write : false;
  };

  const renderAccessDenied = (moduleName: string) => {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-xl mx-auto my-12 shadow-sm space-y-6 animate-fade-in font-sans" id="access-denied-panel">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Access Restricted: Permission Required</h3>
          <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
            Your current membership group <strong>({currentRole})</strong> does not possess read access to the <strong>{moduleName}</strong> module.
          </p>
        </div>
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-center gap-3 text-xs font-bold">
          <button 
            onClick={() => setActiveTab("dashboard")} 
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
          {(!adminClaimed || (adminClaimantEmail && userProfile.email === adminClaimantEmail)) && (
            <button 
              onClick={() => handleSessionRoleChange("Platform Administrator")} 
              className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-lg transition-all flex items-center justify-center gap-1.5 leading-none shadow-md shadow-purple-500/10 cursor-pointer border border-purple-700"
            >
              <Shield className="w-3.5 h-3.5 text-purple-200" />
              <span>Elevate to Platform Administrator</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Dynamic Lipila dynamic carrier computation helpers
  const lipilaCleanPhone = lipilaPhone.replace(/\D/g, "");
  const lipilaIsAirtel = lipilaCleanPhone.startsWith("97") || lipilaCleanPhone.startsWith("77") || lipilaCleanPhone.startsWith("097") || lipilaCleanPhone.startsWith("077") || lipilaCleanPhone.startsWith("26097") || lipilaCleanPhone.startsWith("26077");
  const lipilaIsMtn = lipilaCleanPhone.startsWith("96") || lipilaCleanPhone.startsWith("76") || lipilaCleanPhone.startsWith("096") || lipilaCleanPhone.startsWith("076") || lipilaCleanPhone.startsWith("26096") || lipilaCleanPhone.startsWith("26076");
  const lipilaIsZamtel = lipilaCleanPhone.startsWith("95") || lipilaCleanPhone.startsWith("75") || lipilaCleanPhone.startsWith("095") || lipilaCleanPhone.startsWith("075") || lipilaCleanPhone.startsWith("26095") || lipilaCleanPhone.startsWith("26075");

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen">
        <WelcomeScreen 
          key={welcomeKey}
          onStartDemo={handleStartDemo} 
          onInitDemoWorkspace={handleInitDemoWorkspace}
          onRegister={handleRegister} 
          onRegisterVendor={handleRegisterVendor}
          onLogin={handleLogin} 
          platformPackages={platformPackages}
          contactDetails={contactDetails}
          activeAds={activeAds}
        />
        {lipilaCheckout && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 min-h-screen">
            <div className="w-full max-w-lg bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col justify-between p-6 space-y-4 animate-scale-up">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Secure Live Lipila Terminal</span>
                </div>
                <button 
                  onClick={() => {
                    handleLipilaCancelOrFailure("Checkout cancelled by user.");
                  }} 
                  className="text-slate-400 hover:text-white transition-colors text-xs font-bold px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                >
                  ✕ Cancel
                </button>
              </div>

              {/* Main Checkout View states */}
              {lipilaPaymentStatus === "Idle" || lipilaPaymentStatus === "Submitting" ? (
                <div className="space-y-4 text-xs">
                  {/* Item Card */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[9px] uppercase tracking-wide text-indigo-400 font-extrabold block">Selected Order Package:</span>
                    <div className="flex justify-between items-start mt-1">
                      <div>
                        <h4 className="text-sm font-bold text-white">{lipilaCheckout.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{lipilaCheckout.description}</p>
                      </div>
                      <span className="text-right">
                        <div className="text-xs font-black text-indigo-400 font-mono">
                          {lipilaCheckout.currency === "USD" ? `$ ${lipilaCheckout.price}` : `ZK ${lipilaCheckout.price}`}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">+{lipilaCheckout.creditsToAward} CR</div>
                      </span>
                    </div>
                  </div>

                  {/* Account details & number inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block pb-1">
                        Enter Mobile Money Number ({lipilaCheckout.currency === "USD" ? "International" : "Zambia"})
                      </label>
                      <div className="flex gap-2">
                        <div className="flex items-center justify-center px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold font-mono text-slate-300">
                          {lipilaCheckout.currency === "USD" ? "+" : "+260"}
                        </div>
                        <input 
                          type="text" 
                          placeholder="97X XXX XXX"
                          value={lipilaPhone}
                          onChange={(e) => setLipilaPhone(e.target.value)}
                          disabled={lipilaPaymentStatus === "Submitting"}
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                      <span className="text-[9.5px] text-slate-400 font-medium block mt-1 tracking-normal">
                        Airtel, MTN, or Zamtel generated from the Lipila api·
                      </span>
                    </div>

                    {/* Provider Logo Picker / Network detection */}
                    <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
                      <span className="text-[10px] uppercase text-slate-400 font-extrabold">Detected Wallet Carrier:</span>
                      <div className="flex gap-1 text-[9.5px] font-black">
                        <span className={`px-2 py-0.5 rounded-md ${lipilaIsAirtel ? "bg-red-600/20 text-red-400 border border-red-500/30" : "bg-slate-950 text-slate-600"}`}>
                          Airtel Money
                        </span>
                        <span className={`px-2 py-0.5 rounded-md ${lipilaIsMtn ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-950 text-slate-600"}`}>
                          MTN MoMo
                        </span>
                        <span className={`px-2 py-0.5 rounded-md ${lipilaIsZamtel ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-950 text-slate-600"}`}>
                          Zamtel Kwacha
                        </span>
                      </div>
                    </div>

                    {/* Registered holder identity auto-fetch */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Account Holder:</span>
                      {lipilaSearchingName ? (
                        <span className="text-[10.5px] text-indigo-400 font-bold flex items-center gap-1.5 animate-pulse">
                          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping inline-block" />
                          Fetching KYC...
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-black font-mono tracking-wide">
                          {lipilaHolderName || "Enter exact wallet above"}
                        </span>
                      )}
                    </div>
                  </div>

                  {lipilaError && (
                    <div className="p-3 bg-rose-950/30 border border-rose-500/30 text-rose-400 rounded-xl text-[10.5px] font-semibold leading-relaxed">
                      ⚠️ {lipilaError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleLipilaSubmitPayment}
                    disabled={lipilaPaymentStatus === "Submitting" || !lipilaHolderName || lipilaSearchingName}
                    className={`w-full py-3 rounded-2xl font-black text-xs ${(!lipilaHolderName || lipilaSearchingName || lipilaPaymentStatus === "Submitting") ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-550 border border-indigo-500 text-white shadow-lg active:scale-[0.99]"} flex justify-center items-center gap-2 transition-all cursor-pointer`}
                  >
                    {lipilaPaymentStatus === "Submitting" ? (
                      <span className="animate-spin text-sm">↻</span>
                    ) : null}
                    <span>Confirm and Request PIN Authorization {lipilaCheckout.price > 0 ? `(${lipilaCheckout.currency === "USD" ? `$ ${lipilaCheckout.price}` : `ZK ${lipilaCheckout.price}`})` : ""}</span>
                  </button>
                </div>
              ) : lipilaPaymentStatus === "Pending" ? (
                <div className="py-6 text-center space-y-5 text-xs">
                  <div className="relative flex justify-center">
                    <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="absolute top-5 text-sm">⌛</span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold uppercase tracking-widest text-indigo-400">PIN Authorization Received</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      We've requested a USSD PIN check on <span className="text-white font-mono font-bold">+{lipilaPhone}</span> ({lipilaHolderName}). Enter your mobile money PIN to complete payment.
                    </p>
                    <p className="text-[10px] text-slate-500 bg-slate-950 p-2 rounded-xl inline-block">
                      Ref ID: <span className="font-mono text-indigo-300 font-bold">{lipilaRefId}</span>
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl max-w-sm mx-auto border border-slate-800/80 text-left space-y-2">
                    <p className="text-[10px] text-slate-400 font-medium font-sans">⚠️ <span className="font-bold text-amber-500">MTN Carrier Tips:</span> If the screen doesn't respond instantly or is delayed, feel free to Dial <span className="text-white font-bold font-mono font-black">*115#</span> to approve outstanding pending approvals manually.</p>
                    <p className="text-[10px] text-slate-400 font-medium font-sans">Verification status automatically polling ({lipilaCheckout.currency === "USD" ? `$ ${lipilaCheckout.price}` : `ZK ${lipilaCheckout.price}`}) - attempt {lipilaPollingCount} of 40...</p>
                  </div>

                  <div className="flex justify-center gap-3 font-semibold">
                    <button
                      type="button"
                      onClick={async () => {
                        setLipilaError("");
                        try {
                          const data = await safeFetchJsonClient(`/api/payments/check-status?referenceId=${lipilaRefId}`);
                          if (data && (data.status === "Successful" || data.status === "Success" || data.status === "Completed")) {
                            setLipilaPaymentStatus("Successful");
                            handlePaymentSuccessAllocation(lipilaCheckout);
                          } else {
                            setLipilaError("Reference is still pending. Approve PIN and try checking again.");
                          }
                        } catch (err: any) {
                          setLipilaError(err.message || "Manual check status error.");
                        }
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
                    >
                      Check Status Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleLipilaCancelOrFailure("Status check closed / postponed.");
                      }}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Close & Check Later
                    </button>
                  </div>

                  {lipilaError && (
                    <p className="text-xs text-rose-400 bg-rose-950/20 px-4 py-2 rounded-xl border border-rose-500/35 inline-block">{lipilaError}</p>
                  )}
                </div>
              ) : lipilaPaymentStatus === "Successful" ? (
                <div className="py-6 text-center space-y-5 text-xs">
                  <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-3xl font-black rounded-full flex items-center justify-center mx-auto animate-bounce">
                    ✓
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400">Payment Successfully Procured!</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Congratulations! Your Mobile Money transaction has been fully cleared and verified:
                    </p>
                    <p className="text-xs text-white font-black font-sans bg-slate-950 p-2.5 rounded-2xl inline-block border border-slate-800/80">
                      +{lipilaCheckout.creditsToAward} Credits Allocated to Account!
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl max-w-sm mx-auto border border-slate-850 text-left font-mono text-[9.5px] text-slate-400 space-y-1">
                    <div>Ref: <span className="text-white font-bold">{lipilaRefId}</span></div>
                    <div>Cleared At: {new Date().toLocaleTimeString()}</div>
                    <div>Carrier Channel: Wallet Verified</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLipilaCheckout(null);
                      setLipilaPhone("");
                      setLipilaHolderName("");
                      setLipilaPaymentStatus("Idle");
                      setLipilaError("");
                    }}
                    className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white font-black text-xs rounded-xl border border-emerald-500 shadow active:scale-95 cursor-pointer"
                  >
                    Clear Checkout Session & Access Platform
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center space-y-5 text-xs">
                  <div className="w-16 h-16 bg-rose-500/15 border border-rose-500/25 text-rose-500 text-2xl font-black rounded-full flex items-center justify-center mx-auto">
                    ☠
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold uppercase tracking-widest text-rose-400">Transaction Failed / Timed Out</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      We were unable to approve the transaction automatically. Be sure your wallet has sufficient balance and you have completed PIN confirmation on +{lipilaPhone}.
                    </p>
                    {lipilaError && (
                      <p className="text-xs text-rose-400 bg-rose-950/20 px-4 py-2 rounded-xl border border-rose-500/35 inline-block">{lipilaError}</p>
                    )}
                  </div>
                  <div className="flex justify-center gap-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setLipilaPaymentStatus("Idle");
                        setLipilaError("");
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleLipilaCancelOrFailure("Transaction failed or was cancelled.");
                      }}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancel Payment
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

  // Tenant Suspension Access Control Gate
  if (farmStatus === "SUSPENDED" && userProfile.email !== "deepvaleyfarm@gmail.com") {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col justify-center items-center text-white p-6 font-sans">
        <div className="max-w-md text-center space-y-5 bg-slate-900 p-8 rounded-2xl border border-rose-500/30 shadow-2xl shadow-rose-500/5">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto font-black animate-pulse">
            ☠
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase text-rose-500 tracking-wider">Tenant Subscription Suspended</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              The platform administrator has suspended access to all agricultural modules and accounting registers on this sub-farm tenant node.
            </p>
          </div>
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-left font-mono text-[10px] text-slate-400 space-y-1">
            <span className="block text-slate-500 uppercase font-black text-[9px]">Last Global Admin Action</span>
            <p><strong>Status:</strong> SUSPENDED</p>
            <p><strong>Reason:</strong> Violation of corporate agri-cloud service agreements or trial expiration terms.</p>
          </div>
          
          <div className="pt-2">
            <button 
              onClick={async () => {
                try {
                  await signOut(auth);
                } catch (e) {
                  console.error("Sign out error:", e);
                }
                setIsAuthenticated(false);
                setFarmStatus("ACTIVE");
                setCredits(100);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 font-extrabold text-xs rounded-xl border border-slate-700 shadow-md transition-all cursor-pointer text-white"
            >
              Sign Out & Restart Demo Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* Dynamic Left Menu Bar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isReadonly={isReadonly} 
        onTopUp={() => setShowTopUpModal(true)} 
        credits={credits} 
        currentRole={currentRole}
        rolePermissions={permissions[currentRole]}
        userEmail={userProfile.email}
        subscriptionTier={subscriptionTier}
        workspaceMode={workspaceMode}
        activeFarmName={activeFarm.name}
      />

      {/* Main viewport Container */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Sleek Top header banner */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            
            {/* Multi-farm Switcher */}
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none pb-1">Sub-Farm Workspace</span>
              <div className="flex items-center gap-1">
                <select 
                  value={isAllFarmsActive ? "all" : String(activeFarmIndex)} 
                  onChange={e => {
                    if (e.target.value === "all") {
                      setIsAllFarmsActive(true);
                    } else {
                      setIsAllFarmsActive(false);
                      setActiveFarmIndex(Number(e.target.value));
                    }
                  }}
                  className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 font-bold text-xs text-slate-700 outline-none cursor-pointer"
                >
                  {accessibleFarms.map((f) => {
                    const idx = farms.findIndex(farm => farm.id === f.id);
                    return (
                      <option key={f.id} value={String(idx)}>{f.name}</option>
                    );
                  })}
                  {subscriptionTier === "Enterprise Suite" && (
                    <option value="all">⭐ Collected Data (All Selected Farms)</option>
                  )}
                </select>
                <button 
                  onClick={() => setShowFarmConfigModal(true)}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Configure New Farm Segment"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2" />

            {/* Geographic Multi-country selection localized drop-down */}
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none pb-1">Tenant Localization</span>
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                <select 
                  value={selectedCountry.code}
                  onChange={e => handleCountryOverrideChange(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-600 outline-none cursor-pointer border-none p-0"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none pb-1">Compliance Tax engine</span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/20 font-mono">
                {selectedCountry.isZambia ? "ZRA Standard VAT (15%)" : "Generic IFRS Standards"}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-700">Shadrick Kasuli</span>
                <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-extrabold tracking-wider font-sans mt-0.5 border ${
                  currentRole === "Platform Administrator"
                    ? "bg-purple-100 border-purple-300 text-purple-800"
                    : currentRole === "Farm Owner" 
                      ? "bg-rose-50 border-rose-200 text-rose-600" 
                      : currentRole === "Accountant" 
                        ? "bg-amber-50 border-amber-200 text-amber-600" 
                        : "bg-blue-50 border-blue-200 text-blue-600"
                }`}>
                  {currentRole}
                </span>
              </div>
              <button 
                onClick={async () => {
                  try {
                    await signOut(auth);
                  } catch (e) {
                    console.error("Sign out error:", e);
                  }
                  setIsAuthenticated(false);
                }}
                className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Disconnect from Tenant Security Tunnel"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Warning banner when credit reserves are low */}
        {isReadonly && (
          <div className="bg-rose-500 text-white px-8 py-2 text-xs font-bold font-mono text-center flex items-center justify-center gap-2 tracking-wide flex-shrink-0 animate-bounce">
            <AlertTriangle className="w-4 h-4" />
            <span>READ-ONLY MODE ACTIVE. Write operations barred. Top Up 50+ credits to continue farming operations.</span>
            <button onClick={() => setShowTopUpModal(true)} className="underline font-extrabold ml-1 uppercase hover:text-slate-100">Click to Top Up</button>
          </div>
        )}
        {!isReadonly && credits < 50 && (
          <div className="bg-amber-400 text-slate-900 px-8 py-1.5 text-xs font-bold font-mono text-center flex items-center justify-center gap-2 flex-shrink-0 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span>Warning: Your credit reserve is under 50. Please consider topping up soon.</span>
          </div>
        )}

        {/* Dynamic viewport panels scrollable frame */}
        <section className="flex-1 overflow-y-auto p-8 bg-slate-50">
          
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in" id="dashboard-tab">
              {/* OVERDUE VACCINATIONS RED ALERT BANNER */}
              {(() => {
                const overdueVaccineBatches = poultry.filter(b => {
                  if (b.status === "CLOSED" || b.status === "COMPLETED") return false;
                  return b.vaccinationCalendar && b.vaccinationCalendar.some(v => v.status === "Pending" && v.dueDate && v.dueDate < "2026-06-02");
                });
                
                if (overdueVaccineBatches.length === 0) return null;
                
                const totalOverdueCount = overdueVaccineBatches.reduce((acc, b) => {
                  return acc + (b.vaccinationCalendar?.filter(v => v.status === "Pending" && v.dueDate && v.dueDate < "2026-06-02").length || 0);
                }, 0);
                
                return (
                  <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-xl flex items-start gap-4 shadow-3xs animate-pulse">
                    <span className="text-2xl mt-0.5">⚠️</span>
                    <div className="space-y-1 text-xs flex-1">
                      <h4 className="font-extrabold text-rose-955 uppercase tracking-wide flex items-center gap-2">
                        🔴 CRITICAL VACCINATION ALERT — {totalOverdueCount} SCHEDULED DOSES OVERDUE
                      </h4>
                      <p className="text-slate-700 font-semibold leading-relaxed">
                        Delayed vaccination severely exposes active flocks to high mortality and outbreak morbidity. The following {overdueVaccineBatches.length} cohort batches require immediate field administration:
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        {overdueVaccineBatches.map(b => {
                          const overdueItems = b.vaccinationCalendar.filter(v => v.status === "Pending" && v.dueDate && v.dueDate < "2026-06-02");
                          return (
                            <button
                              key={b.id}
                              onClick={() => {
                                setActiveTab("poultry");
                              }}
                              className="bg-white border border-rose-300 hover:border-rose-400 text-rose-800 font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-3xs hover:bg-rose-50 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>🐓 {b.batchName} ({b.batchId})</span>
                              <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-black text-[9px]">{overdueItems.length} overdue</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Top Row Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Revenue YTD</div>
                  <div className="text-2xl font-bold mt-1 text-slate-800">
                    {selectedCountry.symbol} {displayedAccounts.filter(a => a.category === "Revenue").reduce((s, a) => s + a.balance, 0).toLocaleString()}
                  </div>
                  <span className="text-[9px] text-emerald-500 mt-2 font-medium block">✓ Derived from crop & aquaculture sales</span>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 font-sans">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Expenses YTD</div>
                  <div className="text-2xl font-bold mt-1 text-rose-500">
                    {selectedCountry.symbol} {displayedAccounts.filter(a => a.category === "Expense").reduce((s, a) => s + a.balance, 0).toLocaleString()}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-2 font-medium block">Multi-line journal allocations</span>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Net Operating surplus</div>
                  {(() => {
                    const rev = displayedAccounts.filter(a => a.category === "Revenue").reduce((s, a) => s + a.balance, 0);
                    const exp = displayedAccounts.filter(a => a.category === "Expense").reduce((s, a) => s + a.balance, 0);
                    const diff = rev - exp;
                    return (
                      <>
                        <div className={`text-2xl font-bold mt-1 ${diff >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {selectedCountry.symbol} {diff.toLocaleString()}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-2 font-medium block">IAS financial reporting net surplus</span>
                      </>
                    );
                  })()}
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">General compliance ledger</div>
                  <div className="text-2xl font-bold mt-1 text-slate-800">Verified</div>
                  <span className="text-[9px] text-emerald-500 mt-2 font-medium block">✓ Double-entry books balanced</span>
                </div>

              </div>

              {/* Feed & Quick-access modules tiles */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Enabled modules tiles layout */}
                <div className="md:col-span-8 space-y-6">
                  <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Sub-Farm Enabled Enterprise Modules</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { id: "accounts", name: "Chart of Accounts", desc: "58 standard accounts list" },
                        { id: "expenses", name: "Expenses ledger", desc: "Post double-entry vouchers" },
                        { id: "crops", name: "Crop Cycles", desc: "Continuous block planning" },
                        { id: "payroll", name: "Localized Payroll", desc: "Zambia regulation engines" },
                        { id: "invoices", name: "Invoices & Quotes", desc: "1-click quotation transform" },
                        { id: "livestock", name: "Poultry & Livestock", desc: "Egg tracking limits & health" },
                        { id: "aquaculture", name: "Aquaculture Systems", desc: "Dissolved DO water parameters" },
                        { id: "reports", name: "Financial Reports", desc: "GAAP & IAS quarterly returns" }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setActiveTab(m.id)}
                          className="p-3 text-left border rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold focus:outline-none"
                        >
                          <span className="text-xs font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-[9px] text-slate-400 font-medium block mt-0.5">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Livestock production values summaries */}
                  <div className="bg-white rounded-xl border p-6 shadow-sm space-y-3">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Sub-Farm Livestock & Biological Value Totals</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                      
                      <div className="p-3 bg-slate-50 border rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold block">Biomass biological valuation</span>
                        <strong className="text-md block text-slate-900 mt-1">{selectedCountry.symbol} 32,500.00</strong>
                        <span className="text-[9px] text-slate-400 block font-mono">Mapped from accounts code 1440</span>
                      </div>

                      <div className="p-3 bg-slate-50 border rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold block">Flocks stock inventory valuation</span>
                        <strong className="text-md block text-slate-900 mt-1">{selectedCountry.symbol} 14,500.00</strong>
                        <span className="text-[9px] text-slate-400 block font-mono">Mapped from accounts code 1430</span>
                      </div>

                      <div className="p-3 bg-slate-50 border rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold block">Herd stock asset valuation</span>
                        <strong className="text-md block text-slate-900 mt-1">{selectedCountry.symbol} 52,000.00</strong>
                        <span className="text-[9px] text-slate-400 block font-mono">Mapped from accounts code 1420</span>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Right hand transactional sidebar feeds */}
                <div className="md:col-span-4 bg-white rounded-xl border p-5 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Recent general ledger postings</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {expenses.slice(0, 5).map(tx => (
                      <div key={tx.id} className="p-2.5 border rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono text-[9px] text-emerald-600 block">{tx.id} • EXPENSE</span>
                          <span className="font-bold text-slate-800 block">{tx.supplierName}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{tx.date}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">-{selectedCountry.symbol}{(tx?.total ?? tx?.amount ?? 0).toLocaleString()}</span>
                      </div>
                    ))}
                    {invoices.slice(0, 5).map(inv => (
                      <div key={inv.id} className="p-2.5 border rounded-lg bg-emerald-50/50 flex justify-between items-center text-xs border-emerald-100">
                        <div>
                          <span className="font-mono text-[9px] text-blue-600 block">{inv.invoiceNumber} • SALES</span>
                          <span className="font-bold text-slate-800 block">{inv.customerName}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Status: <strong className={inv.status === "Paid" ? "text-emerald-600" : "text-amber-600 font-bold"}>{inv.status}</strong></span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600">+{selectedCountry.symbol}{(inv?.total ?? 0).toLocaleString()}</span>
                      </div>
                    ))}
                    {expenses.length === 0 && invoices.length === 0 && (
                      <div className="p-6 text-center text-slate-400 italic">No transactional journal updates posted. Try &ldquo;One-Click Demo Mode&rdquo; to preload books.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === "accounts" && (
            !hasReadPermission("accounts") ? (
              renderAccessDenied("Chart of Accounts")
            ) : (
              <AccountsPanel 
                accounts={accounts} 
                onAddAccount={handleAddAccount} 
                isReadonly={isReadonly || !hasWritePermission("accounts")}
                currencySymbol={selectedCountry.symbol}
              />
            )
          )}

          {activeTab === "expenses" && (
            !hasReadPermission("expenses") ? (
              renderAccessDenied("Expenses Ledger")
            ) : (
              <ExpensesPanel 
                expenses={displayedExpenses} 
                suppliers={suppliers} 
                onAddTransaction={handleAddExpense} 
                onAddSupplier={handleAddSupplier}
                isReadonly={isReadonly || !hasWritePermission("expenses")}
                currencySymbol={selectedCountry.symbol}
              />
            )
          )}

          {activeTab === "crops" && (
            !hasReadPermission("crops") ? (
              renderAccessDenied("Crop Cycles / Tasks")
            ) : (
              <CropsPanel 
                crops={displayedCrops} 
                onAddCrop={handleAddCrop} 
                onUpdateMilestone={handleUpdateMilestone} 
                onUpdateStatus={handleUpdateCropStatus}
                onDeleteCrop={handleDeleteCrop}
                isReadonly={isReadonly || !hasWritePermission("crops")}
                currencySymbol={selectedCountry.symbol}
              />
            )
          )}

          {activeTab === "payroll" && (
            !hasReadPermission("payroll") ? (
              renderAccessDenied("Payroll Localizer")
            ) : (
              <PayrollPanel 
                employees={employees} 
                payslips={payslips} 
                onAddEmployee={handleAddEmployee} 
                onRunPayroll={handleRunPayroll}
                onDeleteEmployee={handleDeleteEmployee}
                isReadonly={isReadonly || !hasWritePermission("payroll")}
                currencySymbol={selectedCountry.symbol}
                isZambia={selectedCountry.isZambia || false}
                activeFarm={activeFarm ? {
                  name: activeFarm.name,
                  address: activeFarm.address,
                  tpin: activeFarm.tpin,
                  phone: activeFarm.phone,
                  email: activeFarm.email
                } : undefined}
                leaveRecords={leaveRecords}
                onAddLeaveRecord={handleAddLeaveRecord}
                onDeleteLeaveRecord={handleArchiveLeaveRecord}
                employeeAdvances={employeeAdvances}
                onAddEmployeeAdvance={handleAddEmployeeAdvance}
                onRepayEmployeeAdvance={handleRepayEmployeeAdvance}
                onDeleteEmployeeAdvance={handleArchiveEmployeeAdvance}
              />
            )
          )}

          {activeTab === "sales" && (
            !hasReadPermission("sales") ? (
              renderAccessDenied("Sales Tracker")
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4 font-sans">
                  <div className="border-b pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Direct Farms Sales & Cash Receipts</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Continuous ledger records corresponding to real time cashier cash postings (Debit 1010 Bank / Credit 4200 Revenue).</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono">AUTOMAPPED BOOKKEEPING</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-white text-slate-800">
                      <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                        <tr>
                          <th className="p-3">Reference ID</th>
                          <th className="p-3">Cashier Descriptor</th>
                          <th className="p-3">Customer Type</th>
                          <th className="p-3 font-mono">Debits / Credits Account</th>
                          <th className="p-3 text-right">Cash Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-semibold text-slate-800">
                        {cashSales.map(cs => (
                          <tr key={cs.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-emerald-700 font-bold">{cs.id}</td>
                            <td className="p-3 text-slate-900">{cs.description}</td>
                            <td className="p-3 text-slate-600 font-medium">{cs.customer}</td>
                            <td className="p-3 font-mono text-[10px]">Dr 1010 Bank / Cr {cs.coaCredit} (Sales)</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">{selectedCountry.symbol} {(cs?.amount ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                        {cashSales.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 italic">No retail cash desk entries registered.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === "invoices" && (
            !hasReadPermission("invoices") ? (
              renderAccessDenied("Invoices & Quotes")
            ) : (
              <InvoicesPanel 
                invoices={displayedInvoices} 
                quotations={quotations} 
                customers={customers} 
                crops={displayedCrops}
                onAddInvoice={handleAddInvoice} 
                onAddQuotation={handleAddQuotation}
                onMarkPaid={handleMarkPaid}
                onConvertQuote={handleConvertQuote}
                onAddCustomer={handleAddCustomer}
                isReadonly={isReadonly || !hasWritePermission("invoices")}
                currencySymbol={selectedCountry.symbol}
                activeFarm={activeFarm}
              />
            )
          )}

          {(activeTab === "livestock" || activeTab === "poultry") && (
            (!hasReadPermission("livestock") && !hasReadPermission("poultry")) ? (
              renderAccessDenied("Live Stock & Poultry Records")
            ) : (
              <LivestockPoultryPanel 
                batches={displayedPoultry} 
                records={displayedLivestock} 
                suppliers={suppliers} 
                onAddPoultry={handleAddPoultry} 
                onUpdatePoultryBatch={handleUpdatePoultryBatch}
                onAddFeedLog={handleAddFeedLog} 
                onRecordEgg={handleRecordPoultryEgg}
                onAddLivestockRecord={handleAddLivestockRecord}
                onAddLivestockHealthEvent={handleAddLivestockHealthEvent}
                onAddLivestockFeedingLog={handleAddLivestockFeedingLog}
                isReadonly={isReadonly || (!hasWritePermission("livestock") && !hasWritePermission("poultry"))}
                currencySymbol={selectedCountry.symbol}
                subscriptionTier={subscriptionTier}
                setSubscriptionTier={setSubscriptionTier}
                workspaceMode={workspaceMode}
                setWorkspaceMode={setWorkspaceMode}
                vetFeeActivation={vetFeeActivation}
                setVetFeeActivation={setVetFeeActivation}
                accounts={displayedAccounts}
                setAccounts={setAccounts}
                customers={customers}
                invoices={displayedInvoices}
                onAddInvoice={handleAddInvoice}
                onMarkPaid={handleMarkPaid}
                onDeleteLivestockRecord={handleDeleteLivestockRecord}
                onDeletePoultryBatch={handleDeletePoultryBatch}
                defaultVaccinationSchedule={defaultVaccinationSchedule}
                activeFarm={farms[activeFarmIndex]}
              />
            )
          )}

          {activeTab === "aquaculture" && (
            !hasReadPermission("aquaculture") ? (
              renderAccessDenied("Aquaculture Systems")
            ) : (
              <AquaculturePanel 
                batches={displayedFish} 
                onAddFishBatch={handleAddFishBatch} 
                onAddWaterReading={handleAddWaterReading}
                isReadonly={isReadonly || !hasWritePermission("aquaculture")}
                currencySymbol={selectedCountry.symbol}
              />
            )
          )}

          {activeTab === "inventory" && (
            !hasReadPermission("inventory") ? (
              renderAccessDenied("Inventory & Stock")
            ) : (
              <div className="space-y-6 animate-fade-in font-sans">
                <div className="bg-white rounded-xl border p-6 shadow-sm overflow-hidden">
                  <div className="border-b pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Hardware Inputs & Supplies Store Rooms</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Track fertilizers, hybrid seeds and organic aquafeed balances in real-time.</p>
                    </div>
                    <span className="text-[10px] bg-slate-900 text-white font-mono font-extrabold px-2 py-0.5 rounded">AVERAGE VALUATION MODEL</span>
                  </div>

                  <div className="p-2.5 overflow-x-auto">
                    <table className="w-full text-left text-xs bg-white text-slate-800">
                      <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                        <tr>
                          <th className="p-3">Store Room ID</th>
                          <th className="p-3">Material Descriptor</th>
                          <th className="p-3">Asset category</th>
                          <th className="p-3">Quantity Left</th>
                          <th className="p-3 font-mono text-right">Computed value Sum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-semibold text-slate-800">
                        {displayedInventory.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-slate-700">{item.id}</td>
                            <td className="p-3 text-slate-900">{item.name}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{item.category}</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">
                              {item.quantity} {item.unit}
                              {item.quantity <= item.lowStockAlertLevel && (
                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded font-bold text-[9px] ml-2 animate-pulse">Low stock alert</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-950">{selectedCountry.symbol} {((item?.quantity ?? 0) * (item?.unitCost ?? 0)).toLocaleString()}</td>
                          </tr>
                        ))}
                        {inventory.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 italic">No supply room inventories listed.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === "reports" && (
            !hasReadPermission("reports") ? (
              renderAccessDenied("Financial Reporting")
            ) : (
              <ReportsPanel 
                accounts={accounts} 
                isZambia={selectedCountry.isZambia || false}
                currencySymbol={selectedCountry.symbol}
                expenses={expenses}
                cashSales={cashSales}
                invoices={invoices}
                crops={crops}
                poultry={poultry}
                activeFarm={activeFarm}
              />
            )
          )}

          {activeTab === "marketplace" && (
            <MarketplacePanel 
              vendors={marketplaceVendors}
              setVendors={setMarketplaceVendors}
              products={marketplaceProducts}
              setProducts={setMarketplaceProducts}
              riders={marketplaceRiders}
              setRiders={setMarketplaceRiders}
              orders={marketplaceOrders}
              setOrders={setMarketplaceOrders}
              commissionPercent={marketplaceCommission}
              setCommissionPercent={setMarketplaceCommission}
              deliveryFeePerKm={marketplaceDeliveryFeePerKm}
              setDeliveryFeePerKm={setMarketplaceDeliveryFeePerKm}
              onAddTransaction={handleAddExpense}
              isReadonly={isReadonly}
              currencySymbol={selectedCountry.symbol}
              currentRole={currentRole}
              userEmail={userProfile.email}
              platformPackages={platformPackages}
              setPlatformPackages={setPlatformPackages}
            />
          )}

          {activeTab === "permissions" && (
            <AccessControlPanel 
              currentRole={currentRole}
              onChangeSessionRole={handleSessionRoleChange}
              permissions={permissions}
              onUpdatePermission={handleUpdatePermission}
              teamMembers={teamMembers}
              onAddTeamMember={handleAddTeamMember}
              onRemoveTeamMember={handleRemoveTeamMember}
              onChangeMemberRole={handleChangeMemberRole}
              currencySymbol={selectedCountry.symbol}
              adminClaimed={adminClaimed}
              userEmail={userProfile.email}
              activeFarmName={activeFarm.name}
              adminClaimantEmail={adminClaimantEmail}
              farms={farms}
              subscriptionTier={subscriptionTier}
            />
          )}

          {activeTab === "finance-hub" && (
            <FinancePanel 
              investments={investments}
              onAddInvestment={handleAddInvestment}
              onRealizeInvestment={handleRealizeInvestment}
              onDeleteInvestment={handleArchiveInvestment}
              loans={loans}
              onAddLoan={handleAddLoan}
              onAddLoanRepayment={handleAddLoanRepayment}
              onOffsetLoan={handleOffsetLoan}
              onDeleteLoan={(id) => {
                const item = loans.find(l => l.id === id);
                if (item) {
                  archiveDeletedRecord("Loans", item.id, `Loan: ${item.recipient}`, item);
                  setLoans(prev => prev.filter(l => l.id !== id));
                  writeAuditLog("DELETE", "Finance", item.recipient, `Deleted loan for ${item.recipient}`);
                }
              }}
              otherRevenues={otherRevenues}
              onAddOtherRevenue={handleAddOtherRevenue}
              onDeleteOtherRevenue={handleArchiveOtherRevenue}
              accounts={accounts}
              isReadonly={isReadonly}
              currencySymbol={selectedCountry.symbol}
            />
          )}

          {activeTab === "assets" && (
            <AssetRegisterPanel 
              assets={assets}
              suppliers={suppliers}
              onAddAsset={handleAddAsset}
              onDeleteAsset={handleArchiveAsset}
              isReadonly={isReadonly}
              currencySymbol={selectedCountry.symbol}
            />
          )}

          {activeTab === "backup-restore" && (
            <BackupRestorePanel
              farms={farms}
              accounts={accounts}
              suppliers={suppliers}
              customers={customers}
              expenses={expenses}
              invoices={invoices}
              quotations={quotations}
              crops={crops}
              employees={employees}
              payslips={payslips}
              poultry={poultry}
              fish={fish}
              inventory={inventory}
              cashSales={cashSales}
              loans={loans}
              investments={investments}
              livestock={livestock}
              credits={credits}
              userProfile={userProfile}
              assets={assets}
              otherRevenues={otherRevenues}
              leaveRecords={leaveRecords}
              advances={employeeAdvances}
              auditLogs={auditLogs}
              archivedRecords={archivedRecords}
              onRestore={handleRestoreBackup}
              onClear={handleClearDatabase}
            />
          )}

          {activeTab === "audit-archive" && (
            <AuditArchivePanel 
              auditLogs={auditLogs}
              archiveRecords={archivedRecords}
              onRestoreFromArchive={(id) => {
                const item = archivedRecords.find(a => a.id === id);
                if (item) {
                  handleRestoreRecordFromArchive(item);
                }
              }}
              onPermanentlyPurgeRecord={handlePermanentDeleteFromArchive}
              onClearLogs={() => {
                setAuditLogs([]);
              }}
              isReadonly={isReadonly}
              currentUser={userProfile}
            />
          )}

          {activeTab === "profile" && (
            <ProfilesPlatformPanel
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              activeFarm={activeFarm}
              onUpdateActiveFarm={handleUpdateActiveFarm}
              farms={farms}
              setFarms={setFarms}
              activeFarmIndex={activeFarmIndex}
              credits={credits}
              setCredits={setCredits}
              farmStatus={farmStatus}
              setFarmStatus={setFarmStatus}
              creditTransactions={creditTransactions}
              setCreditTransactions={setCreditTransactions}
              statusChangeLogs={statusChangeLogs}
              setStatusChangeLogs={setStatusChangeLogs}
              platformPackages={platformPackages}
              setPlatformPackages={setPlatformPackages}
              currencySymbol={selectedCountry.symbol}
              currentRole={currentRole}
              viewMode="profile"
              subscriptionTier={subscriptionTier}
              setSubscriptionTier={setSubscriptionTier}
              workspaceMode={workspaceMode}
              setWorkspaceMode={setWorkspaceMode}
              vetFeeActivation={vetFeeActivation}
              setVetFeeActivation={setVetFeeActivation}
              contactDetails={contactDetails}
              setContactDetails={setContactDetails}
              activeAds={activeAds}
              setActiveAds={setActiveAds}
              onChangeSessionRole={handleSessionRoleChange}
              lipilaTransactions={lipilaTransactions}
              setLipilaTransactions={setLipilaTransactions}
              defaultVaccinationSchedule={defaultVaccinationSchedule}
              setDefaultVaccinationSchedule={setDefaultVaccinationSchedule}
              creditTiers={creditTiers}
              setCreditTiers={setCreditTiers}
              onTriggerCheckout={(pkg) => {
                setLipilaCheckout({
                  type: "subscription",
                  name: pkg.name,
                  price: pkg.price,
                  creditsToAward: pkg.credits,
                  description: pkg.features || pkg.description || "Active subscription upgrade"
                });
              }}
            />
          )}

          {activeTab === "platform-admin" && (
            <ProfilesPlatformPanel
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              activeFarm={activeFarm}
              onUpdateActiveFarm={handleUpdateActiveFarm}
              farms={farms}
              setFarms={setFarms}
              activeFarmIndex={activeFarmIndex}
              credits={credits}
              setCredits={setCredits}
              farmStatus={farmStatus}
              setFarmStatus={setFarmStatus}
              creditTransactions={creditTransactions}
              setCreditTransactions={setCreditTransactions}
              statusChangeLogs={statusChangeLogs}
              setStatusChangeLogs={setStatusChangeLogs}
              platformPackages={platformPackages}
              setPlatformPackages={setPlatformPackages}
              currencySymbol={selectedCountry.symbol}
              currentRole={currentRole}
              viewMode="platform-admin"
              subscriptionTier={subscriptionTier}
              setSubscriptionTier={setSubscriptionTier}
              workspaceMode={workspaceMode}
              setWorkspaceMode={setWorkspaceMode}
              vetFeeActivation={vetFeeActivation}
              setVetFeeActivation={setVetFeeActivation}
              contactDetails={contactDetails}
              setContactDetails={setContactDetails}
              activeAds={activeAds}
              setActiveAds={setActiveAds}
              onChangeSessionRole={handleSessionRoleChange}
              lipilaTransactions={lipilaTransactions}
              setLipilaTransactions={setLipilaTransactions}
              defaultVaccinationSchedule={defaultVaccinationSchedule}
              setDefaultVaccinationSchedule={setDefaultVaccinationSchedule}
              creditTiers={creditTiers}
              setCreditTiers={setCreditTiers}
              onTriggerCheckout={(pkg) => {
                setLipilaCheckout({
                  type: "subscription",
                  name: pkg.name,
                  price: pkg.price,
                  creditsToAward: pkg.credits,
                  description: pkg.features || pkg.description || "Active subscription upgrade"
                });
              }}
            />
          )}

        </section>
      </main>

      {/* Floating co-pilot AI widget */}
      <AiChatbot />

      {/* Modals structures */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-scale-up">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest pb-2 border-b">Top Up Transaction Credits</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Purchase pre-packaged credit blocks to perform write actions (e.g. posting expenses, executing payroll operations, generating invoices, creating animal registers) in Mabala.
            </p>

            <div className="space-y-2.5 mt-4 max-h-[320px] overflow-y-auto pr-1">
              {platformPackages.filter(pkg => pkg.isActive).map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => {
                    setLipilaCheckout({
                      type: "credits",
                      name: pkg.name,
                      price: pkg.price,
                      creditsToAward: pkg.credits,
                      description: pkg.features || pkg.description || "Credit Plan"
                    });
                    setShowTopUpModal(false);
                  }}
                  className="w-full font-bold p-3 rounded-xl border border-slate-200 text-xs hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-700 text-slate-700 block text-left transition-all active:scale-[0.98] bg-slate-50/40"
                >
                  <span className="flex justify-between items-center font-bold">
                    <span>{pkg.name}</span>
                    <span className="text-emerald-600 font-mono">+{pkg.credits} CR</span>
                  </span>
                  <p className="text-[9.5px] text-slate-400 font-medium font-sans mt-0.5">{pkg.features}</p>
                  <span className="text-[10px] text-slate-500 font-black block mt-1.5 uppercase font-mono tracking-wider">
                    Price: {selectedCountry.symbol} {pkg.price} (~{pkg.duration})
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <button onClick={() => setShowTopUpModal(false)} className="px-4 py-2 bg-slate-100 rounded text-xs font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

      {showFarmConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen">
          <form onSubmit={handleCreateFarm} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-scale-up">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest pb-2 border-b">Incept New Sub-Farm Block</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Mabala allows tenant administrators to manage multiple farms natively. Each farm maintains isolated settings, registers, and payroll pools.
            </p>

            <div className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Farm Segment Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Siavonga Cage Site Beta" 
                  value={newFarmName} 
                  onChange={e => setNewFarmName(e.target.value)} 
                  required 
                  className="w-full text-xs mt-1 p-2 border rounded outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Physical Location Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kariba Lake Intake, Siavonga" 
                  value={newFarmAddr} 
                  onChange={e => setNewFarmAddr(e.target.value)} 
                  className="w-full text-xs mt-1 p-2 border rounded outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Contact Phone Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. +260977881122" 
                  value={newFarmPhone} 
                  onChange={e => setNewFarmPhone(e.target.value)} 
                  className="w-full text-xs mt-1 p-2 border rounded outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4 text-xs font-semibold">
              <button type="button" onClick={() => setShowFarmConfigModal(false)} className="px-4 py-2 bg-slate-100 rounded">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500">Register Workspace Farm</button>
            </div>
          </form>
        </div>
      )}

      {/* Live Lipila Mobile Money Checkout Overlay Terminal */}
      {lipilaCheckout && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-lg bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col justify-between p-6 space-y-4 animate-scale-up">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Secure Live Lipila Terminal</span>
              </div>
              <button 
                onClick={() => {
                  handleLipilaCancelOrFailure("Checkout cancelled by user.");
                }} 
                className="text-slate-400 hover:text-white transition-colors text-xs font-bold px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                ✕ Cancel
              </button>
            </div>

            {/* Main Checkout View states */}
            {lipilaPaymentStatus === "Idle" || lipilaPaymentStatus === "Submitting" ? (
              <div className="space-y-4 text-xs">
                {/* Item Card */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[9px] uppercase tracking-wide text-indigo-400 font-extrabold block">Selected Order Package:</span>
                  <div className="flex justify-between items-start mt-1">
                    <div>
                      <h4 className="text-sm font-bold text-white">{lipilaCheckout.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{lipilaCheckout.description}</p>
                    </div>
                    <span className="text-right">
                      <div className="text-xs font-black text-indigo-400 font-mono">
                        {lipilaCheckout.currency === "USD" ? `$ ${lipilaCheckout.price}` : `ZK ${lipilaCheckout.price}`}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">+{lipilaCheckout.creditsToAward} CR</div>
                    </span>
                  </div>
                </div>

                {/* Account details & number inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block pb-1">
                      Enter Mobile Money Number ({lipilaCheckout.currency === "USD" ? "International" : "Zambia"})
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold font-mono text-slate-300">
                        {lipilaCheckout.currency === "USD" ? "+" : "+260"}
                      </div>
                      <input 
                        type="text" 
                        placeholder="97X XXX XXX"
                        value={lipilaPhone}
                        onChange={(e) => setLipilaPhone(e.target.value)}
                        disabled={lipilaPaymentStatus === "Submitting"}
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-medium block mt-1 tracking-normal">
                      Airtel, MTN, or Zamtel generated from the Lipila api·
                    </span>
                  </div>

                  {/* Provider Logo Picker / Network detection */}
                  <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] uppercase text-slate-400 font-extrabold">Detected Wallet Carrier:</span>
                    <div className="flex gap-1 text-[9.5px] font-black">
                      <span className={`px-2 py-0.5 rounded-md ${lipilaIsAirtel ? "bg-red-600/20 text-red-400 border border-red-500/30" : "bg-slate-950 text-slate-600"}`}>
                        Airtel Money
                      </span>
                      <span className={`px-2 py-0.5 rounded-md ${lipilaIsMtn ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-950 text-slate-600"}`}>
                        MTN MoMo
                      </span>
                      <span className={`px-2 py-0.5 rounded-md ${lipilaIsZamtel ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-950 text-slate-600"}`}>
                        Zamtel Kwacha
                      </span>
                    </div>
                  </div>

                  {/* Registered holder identity auto-fetch */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400">Account Holder:</span>
                    {lipilaSearchingName ? (
                      <span className="text-[10.5px] text-indigo-400 font-bold flex items-center gap-1.5 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping inline-block" />
                        Fetching KYC...
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-black font-mono tracking-wide">
                        {lipilaHolderName || "Enter exact wallet above"}
                      </span>
                    )}
                  </div>
                </div>

                {lipilaError && (
                  <div className="p-3 bg-rose-950/30 border border-rose-500/30 text-rose-400 rounded-xl text-[10.5px] font-semibold leading-relaxed">
                    ⚠️ {lipilaError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleLipilaSubmitPayment}
                  disabled={lipilaPaymentStatus === "Submitting" || !lipilaHolderName || lipilaSearchingName}
                  className={`w-full py-3 rounded-2xl font-black text-xs ${(!lipilaHolderName || lipilaSearchingName || lipilaPaymentStatus === "Submitting") ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-550 border border-indigo-500 text-white shadow-lg active:scale-[0.99]"} flex justify-center items-center gap-2 transition-all`}
                >
                  {lipilaPaymentStatus === "Submitting" ? (
                    <span className="animate-spin text-sm">↻</span>
                  ) : null}
                  <span>Confirm and Request PIN Authorization {lipilaCheckout.price > 0 ? `(${lipilaCheckout.currency === "USD" ? `$ ${lipilaCheckout.price}` : `ZK ${lipilaCheckout.price}`})` : ""}</span>
                </button>
              </div>
            ) : lipilaPaymentStatus === "Pending" ? (
              <div className="py-6 text-center space-y-5 text-xs">
                <div className="relative flex justify-center">
                  <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="absolute top-5 text-sm">⌛</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-indigo-400">PIN Authorization Received</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    We've requested a USSD PIN check on <span className="text-white font-mono font-bold">+{lipilaPhone}</span> ({lipilaHolderName}). Enter your mobile money PIN to complete payment.
                  </p>
                  <p className="text-[10px] text-slate-500 bg-slate-950 p-2 rounded-xl inline-block">
                    Ref ID: <span className="font-mono text-indigo-300 font-bold">{lipilaRefId}</span>
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl max-w-sm mx-auto border border-slate-800/80 text-left space-y-2">
                  <p className="text-[10px] text-slate-400 font-medium font-sans">⚠️ <span className="font-bold text-amber-500">MTN Carrier Tips:</span> If the screen doesn't respond instantly or is delayed, feel free to Dial <span className="text-white font-bold font-mono font-black">*115#</span> to approve outstanding pending approvals manually.</p>
                  <p className="text-[10px] text-slate-400 font-medium font-sans">Verification status automatically polling ({lipilaCheckout.currency === "USD" ? `$ ${lipilaCheckout.price}` : `ZK ${lipilaCheckout.price}`}) - attempt {lipilaPollingCount} of 40...</p>
                </div>

                <div className="flex justify-center gap-3 font-semibold">
                  <button
                    onClick={async () => {
                      setLipilaError("");
                      try {
                        const data = await safeFetchJsonClient(`/api/payments/check-status?referenceId=${lipilaRefId}`);
                        if (data && (data.status === "Successful" || data.status === "Success" || data.status === "Completed")) {
                          setLipilaPaymentStatus("Successful");
                          handlePaymentSuccessAllocation(lipilaCheckout);
                        } else {
                          setLipilaError("Reference is still pending. Approve PIN and try checking again.");
                        }
                      } catch (err: any) {
                        setLipilaError(err.message || "Manual check status error.");
                      }
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl border border-slate-700"
                  >
                    Check Status Now
                  </button>
                  <button
                    onClick={() => {
                      handleLipilaCancelOrFailure("Status check closed / postponed.");
                    }}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl"
                  >
                    Close & Check Later
                  </button>
                </div>

                {lipilaError && (
                  <p className="text-xs text-rose-400 bg-rose-950/20 px-4 py-2 rounded-xl border border-rose-500/35 inline-block">{lipilaError}</p>
                )}
              </div>
            ) : lipilaPaymentStatus === "Successful" ? (
              <div className="py-6 text-center space-y-5 text-xs">
                <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-3xl font-black rounded-full flex items-center justify-center mx-auto animate-bounce">
                  ✓
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400">Payment Successfully Procured!</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Congratulations! Your Mobile Money transaction has been fully cleared and verified:
                  </p>
                  <p className="text-xs text-white font-black font-sans bg-slate-950 p-2.5 rounded-2xl inline-block border border-slate-800/80">
                    +{lipilaCheckout.creditsToAward} Credits Allocated to Account!
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl max-w-sm mx-auto border border-slate-850 text-left font-mono text-[9.5px] text-slate-400 space-y-1">
                  <div>Ref: <span className="text-white font-bold">{lipilaRefId}</span></div>
                  <div>Cleared At: {new Date().toLocaleTimeString()}</div>
                  <div>Carrier Channel: Wallet Verified</div>
                </div>

                <button
                  onClick={() => {
                    setLipilaCheckout(null);
                    setLipilaPhone("");
                    setLipilaHolderName("");
                    setLipilaPaymentStatus("Idle");
                    setLipilaError("");
                  }}
                  className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white font-black text-xs rounded-xl border border-emerald-500 shadow active:scale-95"
                >
                  Clear Checkout Session & Access Platform
                </button>
              </div>
            ) : (
              // Failed view
              <div className="py-6 text-center space-y-5 text-xs">
                <div className="w-16 h-16 bg-rose-500/15 border border-rose-500/25 text-rose-500 text-2xl font-black rounded-full flex items-center justify-center mx-auto">
                  ☠
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-rose-400">Transaction Authorization Blocked</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Your collection request was declined, failed, or timed out.
                  </p>
                  {lipilaError && (
                    <p className="text-xs text-rose-400 bg-rose-950/20 px-3 py-2 rounded-xl border border-rose-500/35 max-w-md mx-auto">{lipilaError}</p>
                  )}
                </div>

                <div className="flex justify-center gap-3 font-semibold">
                  <button
                    onClick={() => {
                      setLipilaPaymentStatus("Idle");
                      setLipilaError("");
                    }}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500 text-white text-xs font-bold rounded-xl"
                  >
                    Retry Payment
                  </button>
                  <button
                    onClick={() => {
                      handleLipilaCancelOrFailure("Transaction failed or was dismissed.");
                    }}
                    className="px-6 py-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold rounded-xl"
                  >
                    Dismiss Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {globalConfirm && (
        <GlobalConfirmModal
          isOpen={globalConfirm.isOpen}
          title={globalConfirm.title}
          message={globalConfirm.message}
          isBulk={globalConfirm.isBulk}
          itemCount={globalConfirm.itemCount}
          itemNames={globalConfirm.itemNames}
          onConfirm={globalConfirm.onConfirm}
          onCancel={() => setGlobalConfirm(null)}
        />
      )}

    </div>
  );
}
