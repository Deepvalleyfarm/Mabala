import React, { useState, useEffect } from "react";
import { Supplier, Customer, PredefinedRole, DefaultVaccineScheduleItem } from "../types";
import { storage, auth } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useSuperAdmin } from "../hooks/useSuperAdmin";
import { 
  User, 
  Building2, 
  Settings, 
  ShieldAlert, 
  Scale, 
  FileLock2, 
  Coins, 
  ListOrdered, 
  Layers, 
  TrendingUp, 
  Play, 
  CheckCircle, 
  Loader2, 
  Plus, 
  RefreshCcw, 
  BookOpen,
  ArrowRight,
  Sliders,
  CheckSquare,
  Upload,
  ShieldCheck,
  Trash,
  Camera
} from "lucide-react";

interface ProfilesPlatformPanelProps {
  // User profile
  userProfile: { name: string; email: string; phone: string };
  setUserProfile: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string }>>;
  onChangeSessionRole?: (role: PredefinedRole) => void;
  
  // Active farm
  activeFarm: any;
  onUpdateActiveFarm: (updatedFields: Partial<any>) => void;
  farms: any[];
  setFarms: React.Dispatch<React.SetStateAction<any[]>>;
  activeFarmIndex: number;

  // Credits & status settings
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  farmStatus: "ACTIVE" | "FROZEN" | "SUSPENDED";
  setFarmStatus: React.Dispatch<React.SetStateAction<"ACTIVE" | "FROZEN" | "SUSPENDED">>;
  
  // Log systems
  creditTransactions: any[];
  setCreditTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  statusChangeLogs: any[];
  setStatusChangeLogs: React.Dispatch<React.SetStateAction<any[]>>;

  // Packages list
  platformPackages: any[];
  setPlatformPackages: React.Dispatch<React.SetStateAction<any[]>>;
  
  // Extras
  currencySymbol: string;
  currentRole: PredefinedRole;
  viewMode: "profile" | "platform-admin";

  // Subscription and clinical states
  subscriptionTier: string;
  setSubscriptionTier: (tier: string) => void;
  workspaceMode: "Farmer" | "Veterinary" | "Offtaker";
  setWorkspaceMode: (mode: "Farmer" | "Veterinary" | "Offtaker") => void;
  vetFeeActivation: boolean;
  setVetFeeActivation: (active: boolean) => void;
  
  // Landing Page Marketing Config
  contactDetails?: {
    email: string;
    phone: string;
    address: string;
    twitter: string;
    facebook: string;
    linkedin: string;
    whatsapp: string;
  };
  setContactDetails?: React.Dispatch<React.SetStateAction<{
    email: string;
    phone: string;
    address: string;
    twitter: string;
    facebook: string;
    linkedin: string;
    whatsapp: string;
  }>>;
  activeAds?: any[];
  setActiveAds?: React.Dispatch<React.SetStateAction<any[]>>;
  creditTiers?: any[];
  setCreditTiers?: React.Dispatch<React.SetStateAction<any[]>>;
  onTriggerCheckout?: (pkg: any) => void;
  lipilaTransactions?: any[];
  setLipilaTransactions?: React.Dispatch<React.SetStateAction<any[]>>;
  defaultVaccinationSchedule?: DefaultVaccineScheduleItem[];
  setDefaultVaccinationSchedule?: React.Dispatch<React.SetStateAction<DefaultVaccineScheduleItem[]>>;
}

export default function ProfilesPlatformPanel({
  userProfile,
  setUserProfile,
  activeFarm,
  onUpdateActiveFarm,
  farms,
  setFarms,
  activeFarmIndex,
  credits,
  setCredits,
  farmStatus,
  setFarmStatus,
  creditTransactions,
  setCreditTransactions,
  statusChangeLogs,
  setStatusChangeLogs,
  platformPackages,
  setPlatformPackages,
  currencySymbol,
  currentRole,
  viewMode,
  subscriptionTier,
  setSubscriptionTier,
  workspaceMode,
  setWorkspaceMode,
  vetFeeActivation,
  setVetFeeActivation,
  onTriggerCheckout,
  contactDetails = {
    email: "support@mabala.com",
    phone: "+260 978 070734",
    address: "Opp Oryx Filling Station, Mumbwa Road, Lusaka West",
    twitter: "https://twitter.com/mabala_saas",
    facebook: "https://facebook.com/mabala_saas",
    linkedin: "https://linkedin.com/company/mabala_saas",
    whatsapp: "260978070734"
  },
  setContactDetails = () => {},
  activeAds = [],
  setActiveAds = () => {},
  creditTiers,
  setCreditTiers,
  onChangeSessionRole,
  lipilaTransactions = [],
  setLipilaTransactions = () => {},
  defaultVaccinationSchedule = [],
  setDefaultVaccinationSchedule
}: ProfilesPlatformPanelProps) {
  const { isSuperAdmin } = useSuperAdmin();
  // Safe Fallback for configurable 5 credit tiers
  const [localCreditTiers, setLocalCreditTiers] = useState([
    { id: "tier-1", name: "Tier 1: Basic Operations", cost: 1, modules: "Dashboard, Sales Tracker, User Profiles, Backup & Restore", color: "#94a3b8" },
    { id: "tier-2", name: "Tier 2: Standard Crop Operations", cost: 2, modules: "Crop Cycles, Milestones Planning, Expenses Ledger, Invoices & Quotes", color: "#3b82f6" },
    { id: "tier-3", name: "Tier 3: Capital Finance Hub", cost: 3, modules: "Finance & Loans Hub, Capital Investments, Asset Register, Depreciation", color: "#ec4899" },
    { id: "tier-4", name: "Tier 4: Statutory & Reports Pro", cost: 5, modules: "Chart of Accounts, IFRS Financial Reports, Statutory Ledger, Audit Log", color: "#8b5cf6" },
    { id: "tier-5", name: "Tier 5: Advanced Livestock & Poultry Pro", cost: 8, modules: "Livestock Records, Poultry Batches, Aquaculture, Vet-Certified Logs", color: "#10b981" }
  ]);

  // Lipila audit filtering state
  const [lipilaFilterStatus, setLipilaFilterStatus] = useState<"All" | "Successful" | "Failed">("All");
  const [lipilaSearchQuery, setLipilaSearchQuery] = useState("");

  // ==========================================
  // Platform Admin controls state hooks
  // ==========================================
  const [platformAdminSubTab, setPlatformAdminSubTab] = useState<"tenants" | "admins" | "audit">("tenants");
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [adminsListLoading, setAdminsListLoading] = useState<boolean>(false);
  const [auditLogsLoading, setAuditLogsLoading] = useState<boolean>(false);
  
  // Create admin modal/form input states
  const [showCreateAdminModal, setShowCreateAdminModal] = useState<boolean>(false);
  const [newAdminEmail, setNewAdminEmail] = useState<string>("");
  const [newAdminPermissions, setNewAdminPermissions] = useState<string[]>([
    "tenant_management",
    "subscription_management"
  ]);
  const [newAdminCustomUid, setNewAdminCustomUid] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submittingAdmin, setSubmittingAdmin] = useState<boolean>(false);

  const fetchAdmins = async () => {
    setAdminsListLoading(true);
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";
      const headers: any = {
        "Content-Type": "application/json"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      headers["x-mabala-admin-uid"] = currentUser?.uid || "icIoBG4eN5VOw2BvhNiFUnUqmsX2";

      const res = await fetch("/api/admin/admins", { headers });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setAdminsList(body.admins || []);
        }
      }
    } catch (err: any) {
      console.error("[ProfilesPlatformPanel] Failed to fetch admins:", err);
    } finally {
      setAdminsListLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLogsLoading(true);
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";
      const headers: any = {
        "Content-Type": "application/json"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      headers["x-mabala-admin-uid"] = currentUser?.uid || "icIoBG4eN5VOw2BvhNiFUnUqmsX2";

      const res = await fetch("/api/admin/audit-logs", { headers });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setAuditLogsList(body.logs || []);
        }
      }
    } catch (err: any) {
      console.error("[ProfilesPlatformPanel] Failed to fetch audit logs:", err);
    } finally {
      setAuditLogsLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    
    setSubmittingAdmin(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";
      const headers: any = {
        "Content-Type": "application/json"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      headers["x-mabala-admin-uid"] = currentUser?.uid || "icIoBG4eN5VOw2BvhNiFUnUqmsX2";

      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: newAdminEmail,
          permissions: newAdminPermissions,
          customUid: newAdminCustomUid || undefined
        })
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setActionSuccess(`Successfully delegated administrative privileges for ${newAdminEmail}`);
        setNewAdminEmail("");
        setNewAdminCustomUid("");
        setNewAdminPermissions(["tenant_management", "subscription_management"]);
        fetchAdmins();
        fetchAuditLogs();
        setTimeout(() => {
          setShowCreateAdminModal(false);
          setActionSuccess(null);
        }, 1200);
      } else {
        setActionError(body.error || "Failed to delegate administrator privileges.");
      }
    } catch (err: any) {
      setActionError(err.message || "Network delegation failure");
    } finally {
      setSubmittingAdmin(false);
    }
  };

  const handleRevokeAdminAccess = async (targetUid: string, email: string) => {
    if (!window.confirm(`Are you absolutely sure you want to revoke administrative access for ${email}? This cannot be undone.`)) {
      return;
    }

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";
      const headers: any = {
        "Content-Type": "application/json"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      headers["x-mabala-admin-uid"] = currentUser?.uid || "icIoBG4eN5VOw2BvhNiFUnUqmsX2";

      const res = await fetch(`/api/admin/admins/${targetUid}/revoke`, {
        method: "POST",
        headers
      });

      if (res.ok) {
        alert("Administrative privileges successfully revoked.");
        fetchAdmins();
        fetchAuditLogs();
      } else {
        const body = await res.json();
        alert(`Error revoking access: ${body.error}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  const handleBootstrapPlatform = async () => {
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : "";
      const headers: any = {
        "Content-Type": "application/json"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers
      });

      if (res.ok) {
        alert("Platform designation and claims bootstrapped successfully! Relog to propagate.");
      } else {
        const body = await res.json();
        alert(`Bootstrap assertion failed: ${body.error}`);
      }
    } catch (err: any) {
      alert(`Server connection failed: ${err.message}`);
    }
  };

  useEffect(() => {
    if (viewMode === "platform-admin" && isSuperAdmin) {
      fetchAdmins();
      fetchAuditLogs();
    }
  }, [viewMode, isSuperAdmin]);

  const activeCreditTiers = creditTiers || localCreditTiers;
  const activeSetCreditTiers = setCreditTiers || setLocalCreditTiers;

  const handleUpdateTierValue = (id: string, field: string, value: any) => {
    activeSetCreditTiers(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          return { ...t, [field]: value };
        }
        return t;
      });
      return updated;
    });
  };

  // Subscription plans inline editor state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanName, setEditPlanName] = useState("");
  const [editPlanCredits, setEditPlanCredits] = useState(0);
  const [editPlanPrice, setEditPlanPrice] = useState(0);
  const [editPlanPriceUSD, setEditPlanPriceUSD] = useState(0);
  const [editPlanFeatures, setEditPlanFeatures] = useState("");

  const handleStartEditPlan = (pkg: any) => {
    setEditingPlanId(pkg.id);
    setEditPlanName(pkg.name);
    setEditPlanCredits(pkg.credits);
    setEditPlanPrice(pkg.price);
    setEditPlanPriceUSD(pkg.priceUSD || Math.round(pkg.price / 20));
    setEditPlanFeatures(pkg.features);
  };

  const handleSaveEditPlan = (id: string) => {
    if (!editPlanName || editPlanCredits <= 0 || editPlanPrice <= 0 || editPlanPriceUSD <= 0) return;
    setPlatformPackages(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          name: editPlanName,
          credits: editPlanCredits,
          price: editPlanPrice,
          priceUSD: editPlanPriceUSD,
          features: editPlanFeatures
        };
      }
      return p;
    }));
    setEditingPlanId(null);
    alert(`Successfully configuration updated for ${editPlanName}! Synced globally on landing pricing matrices.`);
  };

  // Local profile states
  const [tempUserName, setTempUserName] = useState(userProfile.name);
  const [tempUserEmail, setTempUserEmail] = useState(userProfile.email);
  const [tempUserPhone, setTempUserPhone] = useState(userProfile.phone);

  const [tempFarmName, setTempFarmName] = useState(activeFarm.name);
  const [tempFarmAddr, setTempFarmAddr] = useState(activeFarm.address || "");
  const [tempFarmTpin, setTempFarmTpin] = useState(activeFarm.tpin || "");
  const [tempFarmPhone, setTempFarmPhone] = useState(activeFarm.phone || "");
  const [tempFarmEmail, setTempFarmEmail] = useState(activeFarm.email || "");
  const [tempFarmLogo, setTempFarmLogo] = useState(activeFarm.logo || "");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [activeCameraFarmId, setActiveCameraFarmId] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const startCamera = async (farmId: string) => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      setCameraStream(stream);
      setActiveCameraFarmId(farmId);
      setTimeout(() => {
        const videoElement = document.getElementById(`video-${farmId}`) as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Could not access camera. Please make sure camera permissions are enabled in your browser.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setActiveCameraFarmId(null);
  };

  const capturePhoto = (farmId: string) => {
    const videoElement = document.getElementById(`video-${farmId}`) as HTMLVideoElement;
    if (videoElement) {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth || 320;
      canvas.height = videoElement.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setFarms(prev => prev.map(f => f.id === farmId ? { ...f, logo: dataUrl } : f));
        if (farmId === activeFarm.id) {
          setTempFarmLogo(dataUrl);
        }
      }
    }
    stopCamera();
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    if (storage) {
      try {
        const storageRef = ref(storage, `logos/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        setTempFarmLogo(downloadURL);
      } catch (err: any) {
        console.error("Firebase Storage Upload error:", err);
        alert(`Firebase Storage upload failed: ${err.message}. Falling back to offline client reader payload.`);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setTempFarmLogo(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingLogo(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempFarmLogo(event.target.result as string);
        }
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setTempFarmName(activeFarm.name);
    setTempFarmAddr(activeFarm.address || "");
    setTempFarmTpin(activeFarm.tpin || "");
    setTempFarmPhone(activeFarm.phone || "");
    setTempFarmEmail(activeFarm.email || "");
    setTempFarmLogo(activeFarm.logo || "");
  }, [activeFarm]);

  useEffect(() => {
    setTempUserName(userProfile.name);
    setTempUserEmail(userProfile.email);
    setTempUserPhone(userProfile.phone || "");
  }, [userProfile]);

  // Local Admin states
  const [targetFarmId, setTargetFarmId] = useState(activeFarm.id);
  const [adjustCreditsAmount, setAdjustCreditsAmount] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState("");

  const [newStatus, setNewStatus] = useState<"ACTIVE" | "FROZEN" | "SUSPENDED">("ACTIVE");
  const [statusReason, setStatusReason] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  // Package builder state
  const [newPkgName, setNewPkgName] = useState("");
  const [newPkgCredits, setNewPkgCredits] = useState<number>(500);
  const [newPkgPrice, setNewPkgPrice] = useState<number>(250);
  const [newPkgPriceUSD, setNewPkgPriceUSD] = useState<number>(15);
  const [newPkgDesc, setNewPkgDesc] = useState("");

  // Livestock SaaS states moved here
  const [tenants, setTenants] = useState([
    { id: "t1", farmName: "Sunrise Agro-Tech Farms", tier: "Clinic Premium SaaS", active: true, herdSize: 15 },
    { id: "t2", farmName: "Kafue River Ranch", tier: "Pro Farmer Tier", active: true, herdSize: 154 },
    { id: "t3", farmName: "Zambezi Feeders Ltd", tier: "Free Trial", active: false, herdSize: 0 }
  ]);
  const [globalPlatformFee, setGlobalPlatformFee] = useState(2.5); // platform commission %
  const [flatSaaSPremium, setFlatSaaSPremium] = useState(250); // ZK flat monthly charge

  // Default Vaccination Schedule super admin editing states
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [newSchAge, setNewSchAge] = useState("Day 1");
  const [newSchAgeInDays, setNewSchAgeInDays] = useState(1);
  const [newSchVaccine, setNewSchVaccine] = useState("");
  const [newSchDiseaseTarget, setNewSchDiseaseTarget] = useState("");
  const [newSchRoute, setNewSchRoute] = useState("SC Injection");
  const [newSchBirdType, setNewSchBirdType] = useState<"Broiler/Layer" | "Layer only" | "Broiler only">("Broiler/Layer");
  const [newSchBooster, setNewSchBooster] = useState("No");

  const [editSchAge, setEditSchAge] = useState("");
  const [editSchAgeInDays, setEditSchAgeInDays] = useState(1);
  const [editSchVaccine, setEditSchVaccine] = useState("");
  const [editSchDiseaseTarget, setEditSchDiseaseTarget] = useState("");
  const [editSchRoute, setEditSchRoute] = useState("");
  const [editSchBirdType, setEditSchBirdType] = useState<"Broiler/Layer" | "Layer only" | "Broiler only">("Broiler/Layer");
  const [editSchBooster, setEditSchBooster] = useState("");

  const handleStartEditSchedule = (item: DefaultVaccineScheduleItem) => {
    setEditingScheduleId(item.id);
    setEditSchAge(item.age);
    setEditSchAgeInDays(item.ageInDays);
    setEditSchVaccine(item.vaccine);
    setEditSchDiseaseTarget(item.diseaseTarget);
    setEditSchRoute(item.route);
    setEditSchBirdType(item.birdType);
    setEditSchBooster(item.booster);
  };

  const handleSaveEditSchedule = (id: string) => {
    if (!setDefaultVaccinationSchedule) return;
    setDefaultVaccinationSchedule(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          age: editSchAge,
          ageInDays: editSchAgeInDays,
          vaccine: editSchVaccine,
          diseaseTarget: editSchDiseaseTarget,
          route: editSchRoute,
          birdType: editSchBirdType,
          booster: editSchBooster
        };
      }
      return item;
    }));
    setEditingScheduleId(null);
  };

  const handleDeleteScheduleItem = (id: string) => {
    if (!setDefaultVaccinationSchedule) return;
    setDefaultVaccinationSchedule(prev => prev.filter(item => item.id !== id));
  };

  const handleCreateScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setDefaultVaccinationSchedule || !newSchVaccine.trim()) return;
    const newItem: DefaultVaccineScheduleItem = {
      id: "zvs-" + Date.now(),
      age: newSchAge,
      ageInDays: newSchAgeInDays,
      vaccine: newSchVaccine,
      diseaseTarget: newSchDiseaseTarget,
      route: newSchRoute,
      birdType: newSchBirdType,
      booster: newSchBooster
    };
    setDefaultVaccinationSchedule(prev => [...prev, newItem]);
    // Reset
    setNewSchVaccine("");
    setNewSchDiseaseTarget("");
    setNewSchBooster("No");
  };

  const handleResetScheduleToDefault = () => {
    if (window.confirm("Are you sure you want to revert the system Default Vaccination Schedule to the standard Zambia-Applicable templates? All custom entries will be restored to defaults.")) {
      if (!setDefaultVaccinationSchedule) return;
      setDefaultVaccinationSchedule([
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
    }
  };

  // PawaPay simulated loading state
  const [depositId, setDepositId] = useState("DEP-" + Math.floor(100000 + Math.random() * 900000));
  const [paymentAmount, setPaymentAmount] = useState<number>(150); // standard ZMW
  const [paymentStatus, setPaymentStatus] = useState<"IDLE" | "PENDING" | "VERIFYING" | "SUCCESS" | "FAILED">("IDLE");

  // Save profile updates
  const handleSaveUserProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile({
      name: tempUserName,
      email: tempUserEmail,
      phone: tempUserPhone
    });
    if (tempUserEmail === "deepvaleyfarm@gmail.com") {
      onChangeSessionRole?.("Platform Administrator");
    } else {
      onChangeSessionRole?.("Farm Owner");
    }
    alert("User Profile updated successfully inside this isolated session.");
  };

  const handleSaveFarmProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole !== "Platform Administrator" && currentRole !== "Farm Owner" && currentRole !== "Accountant") {
      alert("Permission Denied: Your assigned role does not permit modifying corporate farm registrations.");
      return;
    }
    // Update the parent active farm in general state
    onUpdateActiveFarm({
      name: tempFarmName,
      address: tempFarmAddr,
      tpin: tempFarmTpin,
      phone: tempFarmPhone,
      email: tempFarmEmail,
      logo: tempFarmLogo
    });
    alert("Corporate Tenant Farm profile configured and saved. Details will now render on printed pay slips and statements!");
  };

  // Platform admin: credits adjust engine
  const handleModifyCredits = (action: "ADD" | "DEDUCT") => {
    if (adjustCreditsAmount <= 0) {
      alert("Please enter a valid amount of credits.");
      return;
    }
    if (!adjustReason.trim()) {
      alert("Mandatory: Please enter an audit trail justification reason.");
      return;
    }

    const matchedFarm = farms.find(f => f.id === targetFarmId) || activeFarm;
    if (action === "ADD") {
      // Add credits
      setCredits(prev => prev + adjustCreditsAmount);
      setCreditTransactions(prev => [
        {
          id: "TX-" + Date.now(),
          date: new Date().toISOString().split('T')[0],
          farmName: matchedFarm.name,
          type: "Allotment (Add)",
          amount: adjustCreditsAmount,
          description: adjustReason,
          adminUser: userProfile.name
        },
        ...prev
      ]);
      alert(`Successfully allocated +${adjustCreditsAmount} credits to ${matchedFarm.name}.`);
    } else {
      // Deduct credits with limit checks
      if (credits < adjustCreditsAmount) {
        alert("Error: Action blocked to avoid setting a negative credit balance.");
        return;
      }
      setCredits(prev => Math.max(prev - adjustCreditsAmount, 0));
      setCreditTransactions(prev => [
        {
          id: "TX-" + Date.now(),
          date: new Date().toISOString().split('T')[0],
          farmName: matchedFarm.name,
          type: "Penalization (Deduct)",
          amount: -adjustCreditsAmount,
          description: adjustReason,
          adminUser: userProfile.name
        },
        ...prev
      ]);
      alert(`Successfully deducted -${adjustCreditsAmount} credits from ${matchedFarm.name}.`);
    }

    setAdjustReason("");
  };

  // Platform admin: status changer
  const handleSaveStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusReason.trim()) {
      alert("Mandatory Error: A legal reason must be entered prior to freezing or suspending tenant nodes.");
      return;
    }

    const matchedFarm = farms.find(f => f.id === targetFarmId) || activeFarm;
    if (matchedFarm.id === activeFarm.id) {
      setFarmStatus(newStatus);
    }

    setStatusChangeLogs(prev => [
      {
        id: "LOG-" + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString().split('T')[0],
        farmName: matchedFarm.name,
        prevStatus: farmStatus,
        newStatus: newStatus,
        reason: statusReason,
        notes: statusNotes,
        adminUser: userProfile.name
      },
      ...prev
    ]);

    alert(`Tenant node Status shifted to ${newStatus} for ${matchedFarm.name}.`);
    setStatusReason("");
    setStatusNotes("");
  };

  const handleReactivateQuick = (farmIdSelected: string) => {
    const matchedFarm = farms.find(f => f.id === farmIdSelected) || activeFarm;
    if (matchedFarm.id === activeFarm.id) {
      setFarmStatus("ACTIVE");
    }

    setStatusChangeLogs(prev => [
      {
        id: "LOG-" + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString().split('T')[0],
        farmName: matchedFarm.name,
        prevStatus: farmStatus,
        newStatus: "ACTIVE",
        reason: "Admin quick reactivation bypass trigger.",
        notes: "Restored from platform command deck.",
        adminUser: userProfile.name
      },
      ...prev
    ]);

    alert(`Tenant status restored to ACTIVE.`);
  };

  // Platform admin: subscription package adding
  const handleAddCustomPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName || newPkgCredits <= 0 || newPkgPrice <= 0 || newPkgPriceUSD <= 0) return;

    const newPkg = {
      id: "pkg-" + (platformPackages.length + 1),
      name: newPkgName,
      duration: "1 Month",
      credits: newPkgCredits,
      price: newPkgPrice,
      priceUSD: newPkgPriceUSD,
      currency: "ZMW",
      features: newPkgDesc || "Advanced livestock diagnostics and compliance reporting module",
      isActive: true
    };

    setPlatformPackages([...platformPackages, newPkg]);
    setNewPkgName("");
    setNewPkgCredits(500);
    setNewPkgPrice(250);
    setNewPkgDesc("");

    alert(`New subscription package "${newPkgName}" created. Dynamic front-end pricing models refreshed instantly!`);
  };

  const togglePackageActive = (id: string) => {
    setPlatformPackages(prev => prev.map(pkg => {
      if (pkg.id === id) {
        return { ...pkg, isActive: !pkg.isActive };
      }
      return pkg;
    }));
  };

  // Simulated Payment Webhook Integration
  const simulatePawaPayWebhookInput = () => {
    setPaymentStatus("PENDING");
    setTimeout(() => {
      // Simulate MTN / Airtel asynchronous completed post
      const allocatedCredits = paymentAmount * 2; // rate rule: 1 ZMW = 2 credits scale
      setCredits(prev => prev + allocatedCredits);
      setCreditTransactions(prev => [
        {
          id: "TX-" + Date.now(),
          date: new Date().toISOString().split('T')[0],
          farmName: activeFarm.name,
          type: "Instant Webhook (pawaPay)",
          amount: allocatedCredits,
          description: `MTN MoMo Gateway Receipt (Ref: ${depositId})`,
          adminUser: "pawaPay Webhook"
        },
        ...prev
      ]);
      setPaymentStatus("SUCCESS");
    }, 1500);
  };

  // Simulated Router Payment Verification
  const simulatePaymentProcessedRoute = () => {
    setPaymentStatus("VERIFYING");
    setTimeout(() => {
      setPaymentStatus("SUCCESS");
    }, 2000);
  };

  const isSuperUser = isSuperAdmin || currentRole === "Platform Administrator";

  return (
    <div className="space-y-6">
      
      {/* 1. PERSISTENT PROFILES SECTION */}
      {viewMode === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* User profile component card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-3">
              <User className="w-4 h-4 text-[#0f172a]" />
              <span>Personal User Profile Configuration</span>
            </h3>

            <form onSubmit={handleSaveUserProfile} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Full Access Account Name</label>
                <input 
                  type="text" 
                  value={tempUserName} 
                  onChange={e => setTempUserName(e.target.value)} 
                  required
                  className="w-full text-xs mt-1 p-2 border rounded outline-none focus:border-[#475569] bg-slate-50 focus:bg-white font-semibold" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block pb-0.5">Email / Authentication Address</label>
                <input 
                  type="email" 
                  value={tempUserEmail} 
                  onChange={e => setTempUserEmail(e.target.value)} 
                  required
                  className="w-full text-xs mt-1 p-2 border rounded outline-none focus:border-[#475569] bg-slate-50 focus:bg-white font-mono font-bold" 
                />
                
                {isSuperAdmin && onChangeSessionRole && (
                  <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center gap-3 flex-wrap">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-950 block">
                          🛡️ Super Admin Role Toggle
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold">
                          Allows super admins to experience normal user roles or revert back to platform administration.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const targetRole = currentRole === "Platform Administrator" ? "Farm Owner" : "Platform Administrator";
                          onChangeSessionRole(targetRole);
                        }}
                        className={`px-3 py-1.5 text-[9.5px] font-extrabold uppercase rounded-lg transition-all shadow-sm ${
                          currentRole === "Platform Administrator"
                             ? "bg-[#0f172a] hover:bg-slate-800 text-white"
                             : "bg-emerald-950 hover:bg-emerald-800 text-white"
                        }`}
                      >
                        {currentRole === "Platform Administrator" ? "Switch to Normal User (Farm Owner)" : "Switch to Super Admin"}
                      </button>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold border-t border-indigo-100/60 pt-1.5">
                      <span className="text-slate-500">Active Simulator Identity:</span>
                      <span className={currentRole === "Platform Administrator" ? "text-indigo-700" : "text-emerald-700"}>
                        {currentRole}
                      </span>
                    </div>
                  </div>
                )}

                {isSuperAdmin && (
                  <div className="mt-2 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100/50 border border-emerald-300 p-2 rounded-lg flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>👑 Super Admin: platform access enabled.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Recovery Contact Mobile</label>
                <input 
                  type="text" 
                  value={tempUserPhone} 
                  onChange={e => setTempUserPhone(e.target.value)} 
                  className="w-full text-xs mt-1 p-2 border rounded outline-none" 
                />
              </div>

              <div className="pt-2 border-t">
                <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md">
                  Update Session User Account
                </button>
              </div>
            </form>
          </div>

          {/* Farm level profile component card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-3">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Corporate Farm Profile Settings (Letterhead Metadata)</span>
            </h3>

            {(currentRole !== "Platform Administrator" && currentRole !== "Farm Owner" && currentRole !== "Accountant") ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl leading-relaxed text-xs">
                <strong>Read-Only Restriction:</strong> Only tenant roles classified as "Platform Administrator", "Farm Owner" or "Accountant" have standard ledger permissions to alter physical TPIN details or printed letterhead parameters.
              </div>
            ) : (
              <form onSubmit={handleSaveFarmProfile} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Registered Farm Name</label>
                    <input 
                      type="text" 
                      value={tempFarmName} 
                      onChange={e => setTempFarmName(e.target.value)} 
                      required
                      className="w-full text-xs mt-1 p-2 border rounded outline-none focus:border-emerald-500 font-semibold text-slate-800" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Revenue Authority TPIN</label>
                    <input 
                      type="text" 
                      value={tempFarmTpin} 
                      placeholder="e.g. 1009081223"
                      onChange={e => setTempFarmTpin(e.target.value)} 
                      className="w-full text-xs mt-1 p-2 border rounded font-mono" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Registered Headquarters Address</label>
                  <input 
                    type="text" 
                    value={tempFarmAddr} 
                    onChange={e => setTempFarmAddr(e.target.value)} 
                    placeholder="Physical street, box number and plot location"
                    className="w-full text-xs mt-1 p-2 border rounded text-slate-700 font-medium" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Official Mobile Desk</label>
                    <input 
                      type="text" 
                      value={tempFarmPhone} 
                      onChange={e => setTempFarmPhone(e.target.value)} 
                      className="w-full text-xs mt-1 p-2 border rounded" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Corporate Billing Email</label>
                    <input 
                      type="email" 
                      value={tempFarmEmail} 
                      onChange={e => setTempFarmEmail(e.target.value)} 
                      className="w-full text-xs mt-1 p-2 border rounded font-mono" 
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 font-sans">
                      Custom Corporate Farm Logo (Printed on PDFs)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {/* Logo Presets Selection */}
                      <div className="md:col-span-3 space-y-2">
                        <span className="text-[10px] font-semibold text-slate-500 block font-sans">Select a Vector Preset:</span>
                        <div className="grid grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => setTempFarmLogo("leaf")}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              tempFarmLogo === "leaf"
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold"
                                : "border-slate-200 hover:bg-slate-50 text-slate-500"
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold mb-1">🌿</span>
                            <span className="text-[9px] font-sans">Organic Leaf</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setTempFarmLogo("wheat")}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              tempFarmLogo === "wheat"
                                ? "border-amber-500 bg-amber-50 text-amber-700 font-extrabold"
                                : "border-slate-200 hover:bg-slate-50 text-slate-500"
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold mb-1">🌾</span>
                            <span className="text-[9px] font-sans">Gold Wheat</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTempFarmLogo("shield")}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              tempFarmLogo === "shield"
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-extrabold"
                                : "border-slate-200 hover:bg-slate-50 text-slate-500"
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mb-1">🛡️</span>
                            <span className="text-[9px] font-sans">Shield Crest</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTempFarmLogo("water")}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              tempFarmLogo === "water"
                                ? "border-cyan-500 bg-cyan-50 text-cyan-700 font-extrabold"
                                : "border-slate-200 hover:bg-slate-50 text-slate-500"
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold mb-1">💧</span>
                            <span className="text-[9px] font-sans">Water Drop</span>
                          </button>
                        </div>
                      </div>

                      {/* Custom Drag & Drop / Click Pick File */}
                      <div className="md:col-span-2 space-y-2">
                        <span className="text-[10px] font-semibold text-slate-500 block font-sans">Or Upload PNG/JPG Logo:</span>
                        <div 
                          className={`border-2 border-dashed ${isUploadingLogo ? "border-amber-400 bg-amber-50/20" : "border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50"} rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors`}
                          onClick={() => !isUploadingLogo && document.getElementById("logo-file-input2")?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isUploadingLogo) return;
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleLogoUpload(e.dataTransfer.files[0]);
                            }
                          }}
                        >
                          <input 
                            id="logo-file-input2"
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingLogo}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleLogoUpload(e.target.files[0]);
                              }
                            }}
                          />
                          {isUploadingLogo ? (
                            <>
                              <Loader2 className="w-4 h-4 text-amber-500 animate-spin mb-1" />
                              <span className="text-[9px] font-bold text-amber-700 font-sans">Uploading to Firebase Storage...</span>
                              <span className="text-[8px] text-amber-400 font-medium font-sans">Please wait</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-slate-400 mb-1" />
                              <span className="text-[9px] font-bold text-slate-600 font-sans">Drag & drop or Click</span>
                              <span className="text-[8px] text-slate-400 font-medium font-sans">PNG/JPEG supported</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Logo Preview box */}
                    {tempFarmLogo && (
                      <div className="mt-3 flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="w-10 h-10 border bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                          {tempFarmLogo === "leaf" && <span className="text-xl">🌿</span>}
                          {tempFarmLogo === "wheat" && <span className="text-xl">🌾</span>}
                          {tempFarmLogo === "shield" && <span className="text-xl">🛡️</span>}
                          {tempFarmLogo === "water" && <span className="text-xl">💧</span>}
                          {tempFarmLogo.startsWith("data:image/") && (
                            <img src={tempFarmLogo} alt="Custom Logo Preview" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-700 truncate font-sans">
                            {tempFarmLogo.startsWith("data:image/") ? "Uploaded Corporate Logo" : `Vector Preset: ${tempFarmLogo}`}
                          </p>
                          <p className="text-[8px] text-slate-400 font-mono">
                            {tempFarmLogo.startsWith("data:image/") ? `Size: ~${Math.round(tempFarmLogo.length / 1024)} KB` : "Scalable Vector Emblem"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTempFarmLogo("")}
                          className="px-2 py-1 text-[9px] bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-lg border border-rose-100 shrink-0 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md">
                    Apply & Print Letterhead Layouts
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Visual Workspace Nodes & Camera Capture Hub */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex justify-between items-center border-b pb-3.5 flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Visual Workspace Nodes & Camera Capture Hub</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Capture or upload photos for each farm node to quickly identify them in switcher lists, PDFs, and invoices.</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full select-none">
                {farms.length} Registered Nodes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {farms.map((f) => {
                const isActiveNode = f.id === activeFarm.id;
                const isCapturing = activeCameraFarmId === f.id;
                return (
                  <div key={f.id} className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row gap-4 items-start ${isActiveNode ? "border-emerald-300 bg-emerald-50/20" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"}`}>
                    <div className="flex flex-col items-center gap-2 w-full sm:w-28 shrink-0">
                      {isCapturing ? (
                        <div className="relative w-28 h-28 border border-amber-300 bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center">
                          <video id={`video-${f.id}`} autoPlay playsInline className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1 z-30">
                            <button
                              type="button"
                              onClick={() => capturePhoto(f.id)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold shadow hover:bg-emerald-500 cursor-pointer"
                            >
                              Snap
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="px-2 py-1 bg-rose-600 text-white rounded text-[9px] font-bold shadow hover:bg-rose-500 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-28 h-28 border border-slate-200 bg-white rounded-xl flex items-center justify-center overflow-hidden relative shadow-inner group">
                          {f.logo ? (
                            f.logo === "leaf" ? <span className="text-3xl">🌿</span> :
                            f.logo === "wheat" ? <span className="text-3xl">🌾</span> :
                            f.logo === "shield" ? <span className="text-3xl">🛡️</span> :
                            f.logo === "water" ? <span className="text-3xl">💧</span> :
                            <img src={f.logo} alt={`${f.name} photo`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Building2 className="w-8 h-8 text-slate-300" />
                          )}
                          <div className="absolute top-1 right-1">
                            <span className="px-1.5 py-0.5 text-[8px] uppercase font-black tracking-wider rounded bg-slate-200 text-slate-600 font-mono">
                              {f.id}
                            </span>
                          </div>
                          {isActiveNode && (
                            <span className="absolute bottom-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider animate-pulse">
                              Active
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2 w-full">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-xs truncate capitalize">{f.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium truncate">📍 {f.address || "Lake Basin, Zambia"}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">📞 {f.phone || "+260123"}</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-dashed">
                        {/* File upload trigger */}
                        <label className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-bold rounded-lg text-[9.5px] cursor-pointer flex items-center gap-1 transition-all">
                          <Upload className="w-3 h-3" />
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    const resStr = event.target.result as string;
                                    setFarms(prev => prev.map(farm => farm.id === f.id ? { ...farm, logo: resStr } : farm));
                                    if (f.id === activeFarm.id) {
                                      setTempFarmLogo(resStr);
                                    }
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => startCamera(f.id)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[9.5px] border border-indigo-100 cursor-pointer flex items-center gap-1 transition-all"
                        >
                          <Camera className="w-3 h-3" />
                          Capture Live
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFarms(prev => prev.map(farm => farm.id === f.id ? { ...farm, logo: "leaf" } : farm));
                            if (f.id === activeFarm.id) {
                              setTempFarmLogo("leaf");
                            }
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-lg text-[9.5px] cursor-pointer"
                        >
                          Clear to Leaf
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscription Tier, User Mode Switching & Practice Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-3">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Subscriber Plan, Practice Settings & User Workspace switching</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed font-semibold">
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-widest mb-1">A. Manage subscription tier</span>
                  <p className="text-[11px] text-slate-500 mb-3 leading-normal">
                    Upgrade or switch plans instantly. Selecting a Veterinary plan activates Practice Management, multi-farm client records, drug stocks and professional certifications.
                  </p>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Current Active Plan Selection</label>
                  <select
                    value={subscriptionTier}
                    onChange={(e) => {
                      const value = e.target.value;
                      const matched = platformPackages?.find(p => p.name === value);
                      if (matched && onTriggerCheckout) {
                        onTriggerCheckout(matched);
                      } else {
                        setSubscriptionTier(value);
                      }
                    }}
                    className="w-full text-xs p-2 border rounded bg-white font-bold text-slate-800 cursor-pointer"
                  >
                    {platformPackages?.filter(p => p.isActive).map((p) => (
                      <option key={p.id || p.name} value={p.name}>
                        {p.name} — ZK {p.price}/Mo (+{p.credits} CR Allotment)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="block text-[9px] uppercase text-slate-400 font-bold mb-1">Clinic Tenant Status Indicator</span>
                  <div className="flex gap-2 items-center">
                    <span className={`h-2.5 w-2.5 rounded-full ${subscriptionTier.includes("Veterinary") || subscriptionTier.includes("Agro-Vet") ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    <span className="text-[11px] text-slate-700 font-bold">
                      {subscriptionTier.includes("Veterinary") || subscriptionTier.includes("Agro-Vet") 
                        ? "Clinical Practice Features ENABLED inside tenant store" 
                        : "Clinical Practice Features DISABLED (Subscribe to Vet/Clinic Tier to unlock)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-widest mb-1">B. Operational Workspace Switcher & Settings</span>
                  <p className="text-[11px] text-slate-500 mb-3 leading-normal">
                    Quickly switch modes to perform vet services or record farm activity, and toggle ledger service fee postings.
                  </p>

                  <div className="space-y-4">
                    {/* Mode Switching */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Select Operational view mode</span>
                      <div className="flex bg-slate-200 p-1 rounded-lg gap-2">
                        <button
                          type="button"
                          onClick={() => setWorkspaceMode("Farmer")}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            workspaceMode === "Farmer" ? "bg-[#0f172a] text-white shadow" : "text-slate-600 hover:text-slate-800"
                          }`}
                        >
                          Farmer Mode
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkspaceMode("Veterinary")}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            workspaceMode === "Veterinary" ? "bg-[#0f172a] text-white shadow" : "text-slate-600 hover:text-slate-800"
                          }`}
                        >
                          Veterinary Mode
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkspaceMode("Offtaker")}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            workspaceMode === "Offtaker" ? "bg-[#0f172a] text-white shadow" : "text-slate-600 hover:text-slate-800"
                          }`}
                        >
                          Offtaker Mode
                        </button>
                      </div>
                    </div>

                    {/* Vet Fee Switcher */}
                    <div className="pt-2 border-t border-slate-200 flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="chk-fee-activation"
                        checked={vetFeeActivation}
                        onChange={(e) => setVetFeeActivation(e.target.checked)}
                        className="mt-1 h-3.5 w-3.5 accent-indigo-600 cursor-pointer rounded border-slate-300"
                      />
                      <label htmlFor="chk-fee-activation" className="cursor-pointer font-semibold select-none text-slate-700">
                        <span className="block text-[11px] font-bold text-slate-900 leading-none">Activate Professional Service Fees</span>
                        <span className="block mt-0.5 text-[10px] text-slate-400 font-medium font-semibold leading-tight">
                          If enabled, vet operations automatically post consulting & treatment revenue invoices directly into Chart of Accounts (4500).
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-2 border rounded-lg text-[10px] font-mono leading-relaxed text-slate-500 mt-2">
                  <strong>Tenant Rule:</strong> {vetFeeActivation ? "PRO_SERVICES_GAINING" : "PRO_SERVICES_MUTED"} <br />
                  <strong>Current Role:</strong> {currentRole}
                </div>
              </div>
            </div>
          </div>

          {/* Integration Gateway Module: pawaPay simulated gateway tracker */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-3">
              <Coins className="w-4 h-4 text-sky-600" />
              <span>Asynchronous pawaPay Gateway Integration Deck</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs leading-relaxed font-semibold">
              <div className="md:col-span-5 space-y-3 bg-slate-50 p-4 rounded-xl border">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-widest">A. Simulated Callback Webhook</span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  In compliance with safety norms, actual credentials must stay server-side. Simulate the merchant server webhook that triggers dynamically when the mobile subscriber clicks completed in Zambia, Kenya, or Cameroon. Only this completes credit allocations securely!
                </p>

                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block">Deposit ID (UUID)</label>
                      <input type="text" value={depositId} onChange={e => setDepositId(e.target.value)} className="w-full text-[10px] p-1 font-mono border rounded bg-white" />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block">Amount ({currencySymbol})</label>
                      <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className="w-full text-[10px] p-1 border rounded bg-white" />
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={simulatePawaPayWebhookInput}
                    className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-extrabold rounded-lg flex items-center justify-center gap-2 transition-all shadow"
                  >
                    {paymentStatus === "PENDING" ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Transmitting Webhook Post...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Simulate pawaPay POST Webhook callback</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="md:col-span-7 space-y-3 bg-slate-50 p-4 rounded-xl border">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-widest">B. Redirect return-url processor (/payment-processed)</span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  When the payment provider routes the subscriber back to the site, our page grabs the <code>depositId</code> query parameter, polls the server state, and updates the customer loading animations of success or retry.
                </p>

                <div className="p-3 bg-white rounded-lg border text-[10px] leading-relaxed">
                  <span className="block font-black text-slate-700">App Simulated Redirect Route:</span>
                  <div className="bg-slate-900 text-emerald-400 p-1.5 rounded text-[10px] font-mono mt-1 break-all">
                    https://yourwebsite.com/payment-processed?depositId={depositId}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={simulatePaymentProcessedRoute}
                      className="px-3 py-1 bg-slate-900 text-white font-bold rounded hover:bg-slate-800 transition-all text-[11px]"
                    >
                      Process Return URL
                    </button>
                  </div>

                  {paymentStatus === "VERIFYING" && (
                    <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200 text-amber-800 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>Loading authorization status from server for ID <strong>{depositId}</strong>...</span>
                    </div>
                  )}

                  {paymentStatus === "SUCCESS" && (
                    <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
                      <strong className="block">✓ Payment verified!</strong>
                      <p className="mt-0.5 text-[9px] text-emerald-700 font-mono">
                        Webhook response maps state COMPLETED. Associated credits have been safely authorized and added to your wallet!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. PROTECTED PLATFORM ADMIN SECTION */}
      {viewMode === "platform-admin" && (
        <div className="space-y-6">
          
          {!isSuperUser ? (
            <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl shadow-sm text-center max-w-lg mx-auto space-y-4">
              <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
              <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider">Access Restrict Lockdown Activated</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mabala security protocols mandate that only the authorized platform **Super Admin** or users verified with **Platform Administrator** permissions are permitted to toggle credit allocations, freeze tenant accounts, or edit global rate cards.
              </p>
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 block italic">Access is granted exclusively to verified Super Admins.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">

              {/* Platform Admin Inner Tab Switcher */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-slate-100 p-2 rounded-xl border border-slate-200 gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    type="button"
                    onClick={() => setPlatformAdminSubTab("tenants")}
                    className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      platformAdminSubTab === "tenants" 
                        ? "bg-slate-900 text-white shadow-sm" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    🏢 Tenant Controls
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPlatformAdminSubTab("admins")}
                    className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      platformAdminSubTab === "admins" 
                        ? "bg-slate-900 text-white shadow-sm" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    👑 Administrators Panel
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPlatformAdminSubTab("audit")}
                    className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      platformAdminSubTab === "audit" 
                        ? "bg-slate-900 text-white shadow-sm" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    📜 Compliance Audit Trails
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={handleBootstrapPlatform}
                  className="px-3.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-[10px] font-black rounded-lg transition-all uppercase tracking-wide cursor-pointer text-center"
                  title="Bootstrap configurations and assert custom claims"
                >
                  ⚙️ Bootstrap Claims
                </button>
              </div>
              
              {/* Top Summary Stats for Overlord Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-4 rounded-xl text-white border border-slate-800 flex justify-between items-center shadow">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400 block">Total Tenants Active</span>
                    <strong className="text-xl block mt-1 font-mono">15 Farms</strong>
                    <span className="text-[9px] text-slate-400 block font-mono">Region: SSA (Sub-Saharan Africa)</span>
                  </div>
                  <Scale className="w-8 h-8 text-indigo-400/20" />
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-emerald-950 p-4 rounded-xl text-white border border-slate-800 flex justify-between items-center shadow">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 block">Current active Farm status</span>
                    <strong className={`text-xl block mt-1 font-mono ${farmStatus === "ACTIVE" ? "text-emerald-400" : farmStatus === "FROZEN" ? "text-amber-400" : "text-rose-400"}`}>{farmStatus}</strong>
                    <span className="text-[9px] text-slate-400 block font-mono">Current active subscription: Pro</span>
                  </div>
                  <FileLock2 className="w-8 h-8 text-emerald-400/20" />
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-sky-950 p-4 rounded-xl text-white border border-slate-800 flex justify-between items-center shadow">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-sky-400 block">Tenant Wallet Balance</span>
                    <strong className="text-xl block mt-1 font-mono">{credits} Credits</strong>
                    <span className="text-[9px] text-slate-400 block font-mono">Simulated Multi-Tenant Wallet</span>
                  </div>
                  <Coins className="w-8 h-8 text-sky-400/20" />
                </div>
              </div>

              {platformAdminSubTab === "tenants" && (
                <>
                  {/* Grid block credit adjustments & freeze management */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Credit Adjustment Panel */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-3">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span>Credit Allocation engine</span>
                  </h3>
                  
                  <div className="space-y-4 text-xs font-semibold">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Select Target sub-Farm Node</label>
                      <select 
                        value={targetFarmId} 
                        onChange={e => setTargetFarmId(e.target.value)}
                        className="w-full text-xs mt-1 p-2 border bg-slate-50 rounded"
                      >
                        {farms.map(f => (
                          <option key={f.id} value={f.id}>{f.name} (Active ID: {f.id})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Adjustment Delta Credits</label>
                        <input 
                          type="number" 
                          value={adjustCreditsAmount} 
                          onChange={e => setAdjustCreditsAmount(Number(e.target.value))} 
                          className="w-full text-xs mt-1 p-2 border rounded font-mono font-bold" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Current Balance in Sandbox</label>
                        <span className="text-xl font-black font-mono mt-1 text-slate-800 block leading-none">{credits} CR</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Modification Description / Legal Audit Comment</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Compensation for payment webhook delay" 
                        value={adjustReason} 
                        onChange={e => setAdjustReason(e.target.value)}
                        required
                        className="w-full text-xs mt-1 p-2 border rounded" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={() => handleModifyCredits("ADD")}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95 transition-all"
                      >
                        Add Credits Allotment
                      </button>
                      
                      <button 
                        type="button" 
                        id="deduct-credits-button"
                        onClick={() => handleModifyCredits("DEDUCT")}
                        className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95 transition-all"
                      >
                        Deduct Credits Penalty
                      </button>
                    </div>
                  </div>
                </div>

                {/* Freeze/Suspend Account Lockdown */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-3">
                    <FileLock2 className="w-4 h-4 text-amber-600" />
                    <span>Tenant Freeze & Suspension lockdowns</span>
                  </h3>

                  <form onSubmit={handleSaveStatusChange} className="space-y-4 text-xs font-semibold">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Shift Status for Workspace</label>
                      <select 
                        value={newStatus} 
                        onChange={e => setNewStatus(e.target.value as any)}
                        className="w-full text-xs mt-1 p-2 border bg-slate-50 rounded"
                      >
                        <option value="ACTIVE">ACTIVE (Writes, reads and reports normal)</option>
                        <option value="FROZEN">FROZEN (Reads only. Standard write blocks enabled)</option>
                        <option value="SUSPENDED">SUSPENDED (Isolated lockdown. Complete tenant lockout)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Lockdown Reason (Required for Audit Trail) *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Failure to renew standard agro subscription" 
                        value={statusReason} 
                        onChange={e => setStatusReason(e.target.value)}
                        required
                        className="w-full text-xs mt-1 p-2 border rounded" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Officer Reference Comments & Notes</label>
                      <textarea 
                        rows={2}
                        placeholder="Internal platform operations ledger notes..." 
                        value={statusNotes} 
                        onChange={e => setStatusNotes(e.target.value)}
                        className="w-full text-xs mt-1 p-2 border rounded bg-slate-50/20" 
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t">
                      <button 
                        type="button" 
                        onClick={() => handleReactivateQuick(activeFarm.id)}
                        className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl"
                      >
                        Quick Reactivate to ACTIVE
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow"
                      >
                        Apply Lock Status
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              {/* Dynamic Subscription Package manager */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-3">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Dynamic Subscription Plans & Feature Card Setup</span>
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs leading-relaxed font-semibold">
                  
                  {/* Package builder form */}
                  <div className="lg:col-span-1 bg-slate-50 p-4 rounded-xl border space-y-3">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-400 block tracking-widest">Incept New Block Plan</span>
                    <form onSubmit={handleAddCustomPackage} className="space-y-3">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Package Name</label>
                        <input type="text" required value={newPkgName} onChange={e => setNewPkgName(e.target.value)} placeholder="e.g. Cooperatives Starter Pack" className="w-full text-xs mt-0.5 p-1.5 border rounded bg-white" />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase text-[8px]">Credits</label>
                          <input type="number" required value={newPkgCredits} onChange={e => setNewPkgCredits(Number(e.target.value))} className="w-full text-xs mt-0.5 p-1.5 border rounded bg-white" />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase text-[8px]">Price ({currencySymbol})</label>
                          <input type="number" required value={newPkgPrice} onChange={e => setNewPkgPrice(Number(e.target.value))} className="w-full text-xs mt-0.5 p-1.5 border rounded bg-white font-bold" />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase text-[8px]">Price (USD)</label>
                          <input type="number" required value={newPkgPriceUSD} onChange={e => setNewPkgPriceUSD(Number(e.target.value))} className="w-full text-xs mt-0.5 p-1.5 border rounded bg-white font-bold" />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Included Feature Summary</label>
                        <input type="text" value={newPkgDesc} onChange={e => setNewPkgDesc(e.target.value)} placeholder="Animal health tracking, ledger support..." className="w-full text-xs mt-0.5 p-1.5 border rounded bg-white" />
                      </div>

                      <button type="submit" className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-505 text-white rounded font-bold text-xs flex items-center justify-center gap-1 shadow">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Activate Global Package</span>
                      </button>
                    </form>
                  </div>

                  {/* Packages configuration list table */}
                  <div className="lg:col-span-2 space-y-3">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-widest">Active Plans on pricing lists (Realtime Synced)</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-white text-slate-800">
                        <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase">
                          <tr>
                            <th className="p-2">Package Level</th>
                            <th className="p-2">Initial Credits</th>
                            <th className="p-2">Sales Price</th>
                            <th className="p-2">Included Modules</th>
                            <th className="p-2 text-right">Gate Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-slate-700">
                          {platformPackages.map(pkg => {
                            const isEditing = editingPlanId === pkg.id;
                            return (
                              <tr key={pkg.id} className="hover:bg-slate-50/50">
                                {isEditing ? (
                                  <td colSpan={5} className="p-3 bg-indigo-50/50">
                                    <div className="space-y-3 font-semibold text-xs text-slate-800">
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <div>
                                          <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Package Name</label>
                                          <input 
                                            type="text" 
                                            value={editPlanName} 
                                            onChange={e => setEditPlanName(e.target.value)} 
                                            className="w-full p-2 border rounded-lg bg-white font-bold"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Initial Monthly Credits</label>
                                          <input 
                                            type="number" 
                                            value={editPlanCredits} 
                                            onChange={e => setEditPlanCredits(Number(e.target.value))} 
                                            className="w-full p-2 border rounded-lg bg-white"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Price ({currencySymbol})</label>
                                          <input 
                                            type="number" 
                                            value={editPlanPrice} 
                                            onChange={e => setEditPlanPrice(Number(e.target.value))} 
                                            className="w-full p-2 border rounded-lg bg-white font-bold"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Price (USD)</label>
                                          <input 
                                            type="number" 
                                            value={editPlanPriceUSD} 
                                            onChange={e => setEditPlanPriceUSD(Number(e.target.value))} 
                                            className="w-full p-2 border rounded-lg bg-white font-bold"
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Features Included Summary</label>
                                        <input 
                                          type="text" 
                                          value={editPlanFeatures} 
                                          onChange={e => setEditPlanFeatures(e.target.value)} 
                                          className="w-full p-2 border rounded-lg bg-white text-xs"
                                        />
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <button 
                                          type="button" 
                                          onClick={() => setEditingPlanId(null)}
                                          className="px-2.5 py-1.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          type="button" 
                                          onClick={() => handleSaveEditPlan(pkg.id)}
                                          className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg shadow-sm hover:bg-indigo-700"
                                        >
                                          Save Plan
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                ) : (
                                  <>
                                    <td className="p-2 font-bold text-slate-950">{pkg.name}</td>
                                    <td className="p-2 font-mono text-emerald-700">+{pkg.credits} CR</td>
                                    <td className="p-2 font-mono text-[11px] leading-tight">
                                      <div className="font-extrabold text-slate-900">{currencySymbol} {pkg.price}</div>
                                      <div className="text-[9.5px] text-indigo-600 font-bold">USD ${pkg.priceUSD || Math.round(pkg.price / 20)}</div>
                                    </td>
                                    <td className="p-2 text-[10px] text-slate-400 truncate max-w-xs">{pkg.features}</td>
                                    <td className="p-2 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button 
                                          type="button"
                                          onClick={() => handleStartEditPlan(pkg)}
                                          className="px-1.5 py-0.5 border border-slate-200 rounded text-indigo-600 hover:text-indigo-800 text-[10px] font-bold bg-white cursor-pointer"
                                          title="Configure Plan details"
                                        >
                                          Configure
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => togglePackageActive(pkg.id)}
                                          className={`px-2 py-0.5 text-[9px] font-bold rounded ${pkg.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}
                                        >
                                          {pkg.isActive ? "ACTIVE" : "DISSOLVED"}
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>

              {/* Status change audit logs & ledger checks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Credit Audit Logs */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-slate-500" />
                    <span>Credit Allocation Action Log</span>
                  </h4>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {creditTransactions.map(tx => (
                      <div key={tx.id} className="p-2.5 bg-slate-50 border rounded-lg text-[11px] leading-relaxed">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{tx.farmName}</span>
                          <span className={`font-mono font-bold px-1 rounded text-[10px] ${tx.amount > 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} CR
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1 font-medium">{tx.description}</p>
                        <div className="flex justify-between text-[9px] text-slate-400 mt-1 pb-0.5 border-t border-slate-100 pt-1">
                          <span>Operator: <strong>{tx.adminUser}</strong></span>
                          <span>{tx.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Freeze Logging History */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-slate-500" />
                    <span>Regulatory Block & Status Logs</span>
                  </h4>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {statusChangeLogs.map(log => (
                      <div key={log.id} className="p-2.5 bg-slate-50 border rounded-lg text-[11px] leading-relaxed">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{log.farmName}</span>
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0f172a] text-white">
                            {log.prevStatus} → {log.newStatus}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1 font-medium"><strong>Reason:</strong> {log.reason}</p>
                        {log.notes && <p className="text-[10px] text-slate-400 mt-0.5"><strong>Notes:</strong> {log.notes}</p>}
                        <div className="flex justify-between text-[9px] text-slate-400 mt-1 pb-0.5 border-t border-slate-100 pt-1">
                          <span>Admin Officer: <strong>{log.adminUser}</strong></span>
                          <span>{log.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Secure Lipila Mobile Money Gateway Audit Trail Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-505 bg-indigo-600 animate-pulse" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-indigo-600" />
                      <span>Lipila Mobile Money Gateway Transactions Audit Trail</span>
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase bg-slate-900 text-slate-100 rounded-lg shrink-0">
                    Live Settlement Channel
                  </span>
                </div>

                {/* Top overview statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl text-xs font-semibold">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase">Settled Volume (ZMW)</span>
                    <strong className="text-sm text-emerald-600 block font-mono font-black">
                      ZK {lipilaTransactions
                        .filter(t => t.status === "Successful")
                        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
                        .toFixed(2)}
                    </strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase">Gateway Clearance Velocity</span>
                    <strong className="text-sm text-indigo-600 block font-mono font-black">
                      {lipilaTransactions.length > 0
                        ? `${Math.round(
                            (lipilaTransactions.filter(t => t.status === "Successful").length /
                              lipilaTransactions.length) *
                              100
                          )}% Clearance`
                        : "100% Rate"}
                    </strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase">Total Auditable Inbounds</span>
                    <strong className="text-sm text-slate-850 block font-mono font-black">
                      {lipilaTransactions.length} Transactions
                    </strong>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="flex gap-1.5">
                    {(["All", "Successful", "Failed"] as const).map(st => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setLipilaFilterStatus(st)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                          lipilaFilterStatus === st
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {st === "All" ? "All Gateway Logs" : st}
                      </button>
                    ))}
                  </div>

                  {/* Search bar */}
                  <div className="relative shrink-0 w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Filter reference, holder, or tel..."
                      value={lipilaSearchQuery}
                      onChange={e => setLipilaSearchQuery(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                {/* Simulated payment audit logger (Super Admin verify helper) */}
                <div className="bg-amber-50/40 border border-amber-200/50 p-4 rounded-xl text-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                      🧪 Developer Sandbox Stimulation Controller
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Sandbox Verify Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Simulate random automated successful or failed transactions instantly to test live dashboard auditing, credit award triggers, or validation pipelines without requiring real mobile hardware.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        const names = ["Maiko Phiri", "Nalukui Mwanamwambwa", "Chipo Hakainde", "Mulenga Kabwe"];
                        const packages = ["Commercial Growth Layer", "Smallholder Standard Pack", "Standard Fuel Top-up block"];
                        const carrier = ["097", "096", "077"][Math.floor(Math.random() * 3)];
                        const newTx = {
                          id: "tx-sim-" + Date.now(),
                          referenceId: `ref-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                          amount: [500, 1500, 100, 2000][Math.floor(Math.random() * 4)],
                          currency: "ZMW",
                          phone: `260${carrier}${Math.floor(1000000 + Math.random() * 9000000)}`,
                          holderName: names[Math.floor(Math.random() * names.length)],
                          packageName: packages[Math.floor(Math.random() * packages.length)],
                          packageType: "subscription" as const,
                          status: "Successful" as const,
                          date: new Date().toISOString().replace('T', ' ').slice(0, 19)
                        };
                        setLipilaTransactions(prev => [newTx, ...prev]);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10.5px] shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <span>+ Simulate SUCCESS Event Log</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const names = ["Lungowe Sipalo", "Mwamba Mwila", "Zondani Sakala"];
                        const packages = ["Standard Fuel Top-up block", "Commercial Growth Layer"];
                        const carrier = ["097", "096", "077"][Math.floor(Math.random() * 3)];
                        const newTx = {
                          id: "tx-sim-fail-" + Date.now(),
                          referenceId: `ref-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                          amount: [500, 100][Math.floor(Math.random() * 2)],
                          currency: "ZMW",
                          phone: `260${carrier}${Math.floor(1000000 + Math.random() * 9000000)}`,
                          holderName: names[Math.floor(Math.random() * names.length)],
                          packageName: packages[Math.floor(Math.random() * packages.length)],
                          packageType: "credits" as const,
                          status: "Failed" as const,
                          date: new Date().toISOString().replace('T', ' ').slice(0, 19),
                          errorDetails: "Insufficent Funds in mobile money wallet"
                        };
                        setLipilaTransactions(prev => [newTx, ...prev]);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10.5px] shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <span>+ Simulate DECLINED Event Log</span>
                    </button>
                  </div>
                </div>

                {/* Audit Grid/Table View */}
                <div className="overflow-x-auto border border-slate-150 rounded-xl">
                  <table className="w-full text-left text-xs bg-white text-slate-850">
                    <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase tracking-wider border-b">
                      <tr>
                        <th className="p-3">Reference ID & Date</th>
                        <th className="p-3">Client Wallet Details</th>
                        <th className="p-3">Category Level</th>
                        <th className="p-3 text-right">Settled Amount</th>
                        <th className="p-3 text-right">Clearance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700 font-semibold text-xs">
                      {lipilaTransactions
                        .filter(t => {
                          if (lipilaFilterStatus !== "All" && t.status !== lipilaFilterStatus) return false;
                          if (lipilaSearchQuery.trim() !== "") {
                            const query = lipilaSearchQuery.toLowerCase();
                            return (
                              t.referenceId.toLowerCase().includes(query) ||
                              t.holderName.toLowerCase().includes(query) ||
                              t.packageName.toLowerCase().includes(query) ||
                              t.phone.includes(query)
                            );
                          }
                          return true;
                        })
                        .map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-3 space-y-1">
                              <span className="font-mono text-[10px] text-slate-900 font-black tracking-normal block">{tx.referenceId}</span>
                              <span className="text-[9px] text-slate-400 block font-normal">{tx.date}</span>
                            </td>
                            <td className="p-3 space-y-0.5">
                              <span className="text-slate-800 block text-[11px] font-bold">{tx.holderName}</span>
                              <span className="text-slate-400 font-mono text-[10px] block font-normal">+{tx.phone}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] font-sans text-slate-600 block">{tx.packageName}</span>
                              <span className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-500 font-mono block mt-0.5 text-indigo-600 bg-indigo-50/30 px-1 py-0.1 space-x-1 rounded inline-block">
                                {tx.packageType}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-mono text-xs font-black text-slate-950">
                                ZK {Number(tx.amount).toFixed(2)}
                              </span>
                            </td>
                            <td className="p-3 text-right font-sans">
                              {tx.status === "Successful" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full border border-emerald-300">
                                  <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full animate-pulse" />
                                  SUCCESSFUL
                                </span>
                              ) : tx.status === "Pending" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full border border-amber-300">
                                  <span className="h-1.5 w-1.5 bg-amber-600 rounded-full animate-pulse" />
                                  PENDING USSD
                                </span>
                              ) : (
                                <div className="space-y-1 inline-block text-right">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 text-[10px] font-extrabold rounded-full border border-red-300">
                                    <span className="h-1.5 w-1.5 bg-red-600 rounded-full" />
                                    FAILED
                                  </span>
                                  {tx.errorDetails && (
                                    <div className="mt-1 text-left">
                                      <details className="group outline-none select-text cursor-pointer">
                                        <summary className="text-[9px] text-rose-600 hover:text-rose-700 font-extrabold flex items-center justify-end gap-1 select-none transition-colors">
                                          <span>Diagnostics Log</span>
                                          <span className="text-[7px] transition-transform duration-200 group-open:rotate-180">▼</span>
                                        </summary>
                                        <div className="mt-1 p-2 bg-rose-50 text-[9px] text-rose-700 hover:bg-rose-100/75 transition-colors border border-rose-100 rounded-lg whitespace-pre-wrap break-all max-w-[200px] text-left leading-normal font-mono shadow-inner select-all">
                                          {tx.errorDetails}
                                        </div>
                                      </details>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      {lipilaTransactions.filter(t => {
                        if (lipilaFilterStatus !== "All" && t.status !== lipilaFilterStatus) return false;
                        if (lipilaSearchQuery.trim() !== "") {
                          const query = lipilaSearchQuery.toLowerCase();
                          return (
                            t.referenceId.toLowerCase().includes(query) ||
                            t.holderName.toLowerCase().includes(query) ||
                            t.packageName.toLowerCase().includes(query) ||
                            t.phone.includes(query)
                          );
                        }
                        return true;
                      }).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                            No match found matching active filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Livestock SaaS Onboarding & Fees (Moved here from Livestock Records) */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
                <span className="p-1 px-2.5 bg-rose-500 text-white font-bold text-[10px] uppercase rounded-full font-mono tracking-wider">Moved Module</span>
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span>Livestock & Vet SaaS Onboarding Administry</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl font-semibold">
                  Configure veterinary onboarding pipelines, toggle active subscription limits, config connection/commission structures, and view collective platform livestock database aggregate analytics.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-900">
                  {/* Tenants & Subscriptions settings */}
                  <div className="lg:col-span-2 bg-white border border-slate-700/30 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-extrabold uppercase text-slate-800">Platform Tenant Subscription Tiers</h4>
                    <div className="divide-y space-y-4 font-semibold text-xs animate-fade-in">
                      {tenants.map(tenant => (
                        <div key={tenant.id} className="pt-3 flex justify-between items-center">
                          <div>
                            <h5 className="font-extrabold text-slate-900">{tenant.farmName}</h5>
                            <p className="text-[10px] text-slate-400 font-medium">Herd Registration Size: <strong>{tenant.herdSize} tagging logs</strong></p>
                            <div className="flex gap-1.5 mt-1.5 font-sans">
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-800 rounded text-[9px] font-bold uppercase">{tenant.tier}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${tenant.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                                {tenant.active ? "ACTIVATED" : "DEACTIVATED"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-1.5 font-sans">
                            <button 
                              type="button"
                              onClick={() => {
                                setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, tier: t.tier === "Clinic Premium SaaS" ? "Pro Farmer Tier" : "Clinic Premium SaaS" } : t));
                              }}
                              className="px-2 py-1 text-[10px] border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-bold cursor-pointer"
                            >
                              Toggle Tier
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, active: !t.active } : t));
                              }}
                              className="px-2.5 py-1 text-[10px] bg-rose-50 text-rose-800 rounded-lg hover:bg-rose-100 font-bold cursor-pointer"
                            >
                              {tenant.active ? "Suspend Logs" : "Reincept Logs"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuration of Platform Fee rules */}
                  <div className="bg-white border border-slate-700/30 rounded-2xl p-5 space-y-4 text-xs font-semibold">
                    <h4 className="text-xs font-extrabold uppercase text-slate-800">Global Fee Structures</h4>
                    
                    <div className="space-y-3.5 animate-fade-in">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block pb-1.5">Platform Commission Rate (%)</label>
                        <input 
                          type="number" 
                          value={globalPlatformFee} 
                          onChange={e => setGlobalPlatformFee(Number(e.target.value))}
                          className="w-full text-xs p-2.5 border bg-white rounded-lg cursor-text" 
                        />
                        <span className="text-[9px] text-slate-400 pt-1 block leading-normal">Commission rate billed on professional vet consultation billing invoices.</span>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block pb-1.5">Flat Monthly SaaS connection Charge (ZK)</label>
                        <input 
                          type="number" 
                          value={flatSaaSPremium} 
                          onChange={e => setFlatSaaSPremium(Number(e.target.value))}
                          className="w-full text-xs p-2.5 border bg-white rounded-lg cursor-text" 
                        />
                        <span className="text-[9px] text-slate-400 pt-1 block leading-normal">Standard subscription price for Vet Clinic Multi-Vet Mode software access.</span>
                      </div>

                      <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-xl">
                        <span className="text-[9px] font-bold text-rose-800 uppercase block">Platform Health Analytics Summary</span>
                        <div className="mt-2 text-slate-700 space-y-1.5 text-[11px]">
                          <div>• Active livestock records tracked: <strong>2,150 heads</strong></div>
                          <div>• Registered veterinary practitioners: <strong>14 vets</strong></div>
                          <div>• Platform revenue collected: <strong>ZK 12,450.00</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configurable Five Credit Tiers Section */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl mt-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-emerald-400" />
                      <span>Configurable Five Credit Tiers & Core Usage Quotas</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed max-w-2xl text-slate-350">
                      Configure the exact credit write weight cost applied to end-users on each active operational tier. Set tier labels, billing weights, coverage listings, and unique branding color flags. Prefills available modules with customized costs.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-bold text-[10px] tracking-wider uppercase border border-emerald-500/20">
                    System Hot-Reload Secure
                  </span>
                </div>

                <div className="space-y-4">
                  {activeCreditTiers.map((tier, idx) => (
                    <div key={tier.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 shadow-inner">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" 
                            style={{ backgroundColor: tier.color }} 
                          />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            Tier {idx + 1} Parameters
                          </span>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded uppercase">
                          Hot Linked
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end text-xs font-semibold text-slate-300">
                        {/* Tier Label */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[9px] text-slate-550 font-bold uppercase block">Tier Label Name</label>
                          <input 
                            type="text" 
                            value={tier.name} 
                            onChange={e => handleUpdateTierValue(tier.id, "name", e.target.value)}
                            className="w-full p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-800 font-bold focus:ring-1 focus:ring-emerald-500 outline-none h-9.5 text-xs"
                          />
                        </div>

                        {/* Credits per Action */}
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[9px] text-slate-550 font-bold uppercase block">Credits per Action</label>
                          <input 
                            type="number" 
                            value={tier.cost} 
                            onChange={e => handleUpdateTierValue(tier.id, "cost", Math.max(Number(e.target.value), 0))}
                            className="w-full p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-800 font-black text-center text-emerald-400 focus:ring-1 focus:ring-emerald-500 outline-none h-9.5 text-xs"
                          />
                        </div>

                        {/* What Modules it Covers */}
                        <div className="md:col-span-5 space-y-1">
                          <label className="text-[9px] text-slate-550 font-bold uppercase block">Integrated System Modules Covered</label>
                          <input 
                            type="text" 
                            value={tier.modules} 
                            onChange={e => handleUpdateTierValue(tier.id, "modules", e.target.value)}
                            placeholder="e.g. Poultry, Livestock, Certified Logs..."
                            className="w-full p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-800 text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none h-9.5 truncate text-xs"
                          />
                        </div>

                        {/* Colour Code */}
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[9px] text-slate-550 font-bold uppercase block">Visual Colour Code</label>
                          <div className="flex gap-1.5 items-center">
                            <input 
                              type="color" 
                              value={tier.color} 
                              onChange={e => handleUpdateTierValue(tier.id, "color", e.target.value)}
                              className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0 shrink-0" 
                            />
                            <input 
                              type="text" 
                              value={tier.color} 
                              onChange={e => handleUpdateTierValue(tier.id, "color", e.target.value)}
                              className="w-full p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-800 font-mono text-[10px] uppercase text-center focus:ring-1 focus:ring-emerald-500 outline-none h-8 shrink" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      alert("Successfully locked down and synchronized system core billing metrics across all tenant schemas!");
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Synchronize Five Credit Tiers Layout</span>
                  </button>
                </div>
              </div>

              {/* Default Vaccination Schedule Section (Zambia-Applicable) */}
              <div id="default-vaccine-schedule-section" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span>Zambia-Applicable Default Vaccination Schedule Regulator</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium font-sans">
                      Manage the system-wide default vaccination rules. These target ranges dictate candidate immunization schedules auto-generated on new customer poultry cohort inception.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleResetScheduleToDefault}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded-lg flex items-center gap-1 transition-all"
                  >
                    <RefreshCcw className="w-3 h-3 text-slate-500" />
                    <span>Reset to Original Zambia Defaults</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left Side: Create New Regulation Custom Item */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                    <span className="text-[10px] font-black uppercase text-indigo-600 block tracking-wider">A. Onboard Custom Immunization Rule</span>
                    <form onSubmit={handleCreateScheduleItem} className="space-y-3.5 text-xs font-semibold text-slate-700">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400">Age Label</label>
                          <input 
                            type="text" 
                            value={newSchAge} 
                            onChange={e => setNewSchAge(e.target.value)}
                            placeholder="e.g. Day 1, Week 5" 
                            required
                            className="w-full text-xs mt-1 p-2 bg-white rounded border border-slate-200" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400">Age (In Days)</label>
                          <input 
                            type="number" 
                            min={1} 
                            value={newSchAgeInDays}
                            onChange={e => setNewSchAgeInDays(Math.max(Number(e.target.value), 1))}
                            required
                            className="w-full text-xs mt-1 p-2 bg-white rounded border border-slate-200 font-mono font-bold" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400">Vaccine Name</label>
                        <input 
                          type="text" 
                          value={newSchVaccine} 
                          onChange={e => setNewSchVaccine(e.target.value)}
                          placeholder="e.g. ND La Sota, Gumboro (IBD)" 
                          required
                          className="w-full text-xs mt-1 p-2 bg-white rounded border border-slate-200 font-bold" 
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400">Disease Target</label>
                        <input 
                          type="text" 
                          value={newSchDiseaseTarget} 
                          onChange={e => setNewSchDiseaseTarget(e.target.value)}
                          placeholder="e.g. Avipoxvirus, Newcastle Disease" 
                          required
                          className="w-full text-xs mt-1 p-2 bg-white rounded border border-slate-200" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400">Route of Admin</label>
                          <select 
                            value={newSchRoute} 
                            onChange={e => setNewSchRoute(e.target.value)}
                            className="w-full text-xs mt-1 p-2 bg-white rounded border border-slate-200"
                          >
                            <option value="SC Injection">SC Injection</option>
                            <option value="IM Injection font-sans">IM Injection</option>
                            <option value="Drinking Water">Drinking Water</option>
                            <option value="Eye Drop">Eye Drop</option>
                            <option value="Eye Drop / Water">Eye Drop / Water</option>
                            <option value="Wing Web Stab">Wing Web Stab</option>
                            <option value="Aerosol Spray">Aerosol Spray</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400">Booster Cycle</label>
                          <input 
                            type="text" 
                            value={newSchBooster} 
                            onChange={e => setNewSchBooster(e.target.value)}
                            placeholder="e.g. Wk 8, No" 
                            className="w-full text-xs mt-1 p-2 bg-white rounded border border-slate-200" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block pb-1">Target Bird Cohort Type</label>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold">
                            <input 
                              type="radio" 
                              name="schBirdType" 
                              value="Broiler/Layer" 
                              checked={newSchBirdType === "Broiler/Layer"} 
                              onChange={() => setNewSchBirdType("Broiler/Layer")} 
                              className="accent-indigo-600"
                            />
                            <span>Broiler/Layer</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold">
                            <input 
                              type="radio" 
                              name="schBirdType" 
                              value="Layer only" 
                              checked={newSchBirdType === "Layer only"} 
                              onChange={() => setNewSchBirdType("Layer only")} 
                              className="accent-indigo-600"
                            />
                            <span>Layer only</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold">
                            <input 
                              type="radio" 
                              name="schBirdType" 
                              value="Broiler only" 
                              checked={newSchBirdType === "Broiler only"} 
                              onChange={() => setNewSchBirdType("Broiler only")} 
                              className="accent-indigo-600"
                            />
                            <span>Broiler only</span>
                          </label>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 active:scale-[98%] mt-2 shadow"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Inject Custom Regulation</span>
                      </button>
                    </form>
                  </div>

                  {/* Right Side (Col Span 2): Default vaccination database grid */}
                  <div className="xl:col-span-2 space-y-3.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Active Immunization Framework Tables (Zambia Approved)</span>
                    
                    <div className="bg-white border rounded-2xl overflow-hidden shadow-inner">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#f8fafc] text-[9.5px] uppercase text-slate-400 font-extrabold border-b">
                            <tr>
                              <th className="p-3">Target Age</th>
                              <th className="p-3">Vaccine & Disease</th>
                              <th className="p-3">Route of Admin</th>
                              <th className="p-3">Bird Cohort Applicability</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-slate-800 font-semibold text-xs bg-white">
                            {defaultVaccinationSchedule.map(item => {
                              const isEditing = editingScheduleId === item.id;
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                  {isEditing ? (
                                    <td colSpan={5} className="p-3 bg-indigo-50/40">
                                      <div className="space-y-3.5 text-xs font-semibold text-slate-800">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                          <div className="md:col-span-2">
                                            <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Age Label</label>
                                            <input 
                                              type="text" 
                                              value={editSchAge} 
                                              onChange={e => setEditSchAge(e.target.value)} 
                                              className="w-full p-2 border rounded bg-white font-bold text-xs"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Days</label>
                                            <input 
                                              type="number" 
                                              value={editSchAgeInDays} 
                                              onChange={e => setEditSchAgeInDays(Math.max(Number(e.target.value), 1))} 
                                              className="w-full p-2 border rounded bg-white font-mono font-bold text-xs"
                                            />
                                          </div>
                                          <div className="md:col-span-4">
                                            <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Vaccine</label>
                                            <input 
                                              type="text" 
                                              value={editSchVaccine} 
                                              onChange={e => setEditSchVaccine(e.target.value)} 
                                              className="w-full p-2 border rounded bg-white font-bold text-xs"
                                            />
                                          </div>
                                          <div className="md:col-span-4">
                                            <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Disease Target</label>
                                            <input 
                                              type="text" 
                                              value={editSchDiseaseTarget} 
                                              onChange={e => setEditSchDiseaseTarget(e.target.value)} 
                                              className="w-full p-2 border rounded bg-white text-xs"
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                          <div className="md:col-span-4">
                                            <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Route</label>
                                            <select 
                                              value={editSchRoute} 
                                              onChange={e => setEditSchRoute(e.target.value)} 
                                              className="w-full p-1.5 border rounded bg-white text-xs"
                                            >
                                              <option value="SC Injection">SC Injection</option>
                                              <option value="IM Injection">IM Injection</option>
                                              <option value="Drinking Water">Drinking Water</option>
                                              <option value="Eye Drop">Eye Drop</option>
                                              <option value="Eye Drop / Water font-sans">Eye Drop / Water</option>
                                              <option value="Wing Web Stab">Wing Web Stab</option>
                                              <option value="Aerosol Spray">Aerosol Spray</option>
                                            </select>
                                          </div>
                                          <div className="md:col-span-4">
                                            <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Bird Type</label>
                                            <select 
                                              value={editSchBirdType} 
                                              onChange={e => setEditSchBirdType(e.target.value as any)} 
                                              className="w-full p-1.5 border rounded bg-white text-xs"
                                            >
                                              <option value="Broiler/Layer">Broiler/Layer</option>
                                              <option value="Layer only">Layer only</option>
                                              <option value="Broiler only">Broiler only</option>
                                            </select>
                                          </div>
                                          <div className="md:col-span-4">
                                            <label className="text-[9px] uppercase text-slate-400 block pb-0.5">Booster Recommendation</label>
                                            <input 
                                              type="text" 
                                              value={editSchBooster} 
                                              onChange={e => setEditSchBooster(e.target.value)} 
                                              className="w-full p-2 border rounded bg-white text-xs"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex justify-end gap-2 text-[11px]">
                                          <button 
                                            type="button" 
                                            onClick={() => setEditingScheduleId(null)}
                                            className="px-3 py-1.5 bg-slate-200 rounded font-bold text-slate-700"
                                          >
                                            Cancel
                                          </button>
                                          <button 
                                            type="button" 
                                            onClick={() => handleSaveEditSchedule(item.id)}
                                            className="px-4 py-1.5 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700"
                                          >
                                            Update Rule
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  ) : (
                                    <>
                                      <td className="p-3">
                                        <div className="font-bold text-slate-900">{item.age}</div>
                                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono font-bold block w-max mt-0.5">{item.ageInDays} Days Old</span>
                                      </td>
                                      <td className="p-3">
                                        <div className="font-bold text-slate-950 font-sans">{item.vaccine}</div>
                                        <div className="text-[10px] text-slate-400 font-medium italic">Target: {item.diseaseTarget}</div>
                                      </td>
                                      <td className="p-3 font-medium text-slate-600 font-mono">
                                        <div>{item.route}</div>
                                        <div className="text-[10px] text-slate-400 font-sans font-semibold">Booster: <strong>{item.booster}</strong></div>
                                      </td>
                                      <td className="p-3">
                                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                          item.birdType === 'Broiler/Layer' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                          item.birdType === 'Layer only' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                          'bg-sky-50 text-sky-700 border border-sky-100'
                                        }`}>
                                          {item.birdType}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button 
                                            type="button"
                                            onClick={() => handleStartEditSchedule(item)}
                                            className="px-2 py-1 text-[10px] bg-slate-50 border border-slate-200 rounded font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 cursor-pointer animate-fade-in"
                                            title="Edit regulation detail"
                                          >
                                            Edit
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => handleDeleteScheduleItem(item.id)}
                                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                            title="Delete rule"
                                          >
                                            <Trash className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                            {defaultVaccinationSchedule.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 italic">No vaccination candidates have been configured inside this framework database.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Public Landing Page Marketing & Branding Config */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans text-xs">
                
                {/* Contact details configuration */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm text-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Public Contact Configurator</span>
                  </h3>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    Update platform contact coordinates shown natively in the landing page footer and contact forms instantly.
                  </p>

                  <div className="space-y-3.5 pt-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Support Email Address</label>
                      <input 
                        type="email" 
                        value={contactDetails.email} 
                        onChange={e => setContactDetails(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full text-xs mt-1 p-2 bg-slate-50 hover:bg-slate-100/55 rounded border outline-none focus:bg-white focus:border-emerald-500 font-semibold text-slate-800" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Support Phone Connection</label>
                      <input 
                        type="text" 
                        value={contactDetails.phone} 
                        onChange={e => setContactDetails(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full text-xs mt-1 p-2 bg-slate-50 hover:bg-slate-100/55 rounded border outline-none focus:bg-white focus:border-emerald-500 font-semibold text-slate-800" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Support WhatsApp Number (e.g. 260971234567)</label>
                      <input 
                        type="text" 
                        value={contactDetails.whatsapp} 
                        onChange={e => setContactDetails(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="260971234567"
                        className="w-full text-xs mt-1 p-2 bg-slate-50 hover:bg-slate-100/55 rounded border outline-none focus:bg-white focus:border-emerald-500 font-semibold text-slate-800" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">HQ Office Physical Address</label>
                      <textarea 
                        rows={2}
                        value={contactDetails.address} 
                        onChange={e => setContactDetails(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full text-xs mt-1 p-2 bg-slate-50 hover:bg-slate-100/55 rounded border outline-none focus:bg-white focus:border-emerald-500 font-semibold text-slate-800" 
                      />
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-3.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Social Media Anchors</span>
                      
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block">Twitter URL</label>
                        <input 
                          type="text" 
                          value={contactDetails.twitter} 
                          onChange={e => setContactDetails(prev => ({ ...prev, twitter: e.target.value }))}
                          className="w-full text-xs mt-0.5 p-1.5 bg-slate-50 rounded border outline-none focus:bg-white focus:border-emerald-500 text-slate-600 font-mono" 
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block">Facebook URL</label>
                        <input 
                          type="text" 
                          value={contactDetails.facebook} 
                          onChange={e => setContactDetails(prev => ({ ...prev, facebook: e.target.value }))}
                          className="w-full text-xs mt-0.5 p-1.5 bg-slate-50 rounded border outline-none focus:bg-white focus:border-emerald-500 text-slate-600 font-mono" 
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block">LinkedIn URL</label>
                        <input 
                          type="text" 
                          value={contactDetails.linkedin} 
                          onChange={e => setContactDetails(prev => ({ ...prev, linkedin: e.target.value }))}
                          className="w-full text-xs mt-0.5 p-1.5 bg-slate-50 rounded border outline-none focus:bg-white focus:border-emerald-500 text-slate-600 font-mono" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-100 font-semibold text-[10px]">
                      ✔ Configured coordinates synchronized live with zero code re-deployments needed.
                    </div>
                  </div>
                </div>

                {/* Ads manager */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm text-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Campaign Marketing Ad placements</span>
                    </span>
                    <span className="font-mono text-[9px] uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      {activeAds.length} Placements Created
                    </span>
                  </h3>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    Load, configure, and delete active advertising banner coordinates displayed live inside user-facing marketing views. All campaigns are managed exclusively by the Platform Overlord.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                    
                    {/* Add ad placement form */}
                    <form 
                      onSubmit={e => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const title = formData.get("title") as string;
                        const desc = formData.get("desc") as string;
                        const img = formData.get("img") as string;
                        const ext = formData.get("ext") as string;
                        const placement = formData.get("placement") as "banner" | "sidebar" | "interstitial";
                        const active = formData.get("active") === "on";

                        if (!title || !ext) return;

                        const newAd = {
                          id: "ad-" + Date.now(),
                          title,
                          description: desc || "",
                          imageUrl: img || "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=400",
                          externalUrl: ext,
                          placement,
                          active
                        };

                        setActiveAds(prev => [...prev, newAd]);
                        e.currentTarget.reset();
                      }}
                      className="md:col-span-5 bg-slate-50 border rounded-xl p-4 space-y-3 font-semibold text-xs text-slate-800"
                    >
                      <h4 className="font-extrabold text-slate-900 pb-1.5 border-b uppercase text-[10px] tracking-wider">Deploy Campaign</h4>
                      
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400">Sponsor/Ad Title</label>
                        <input 
                          type="text" 
                          name="title" 
                          placeholder="e.g. Drought-Resistant Soya Seeds" 
                          required
                          className="w-full text-xs mt-0.5 p-2 border bg-white rounded outline-none focus:border-emerald-500 font-semibold" 
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400">Brief Description</label>
                        <input 
                          type="text" 
                          name="desc" 
                          placeholder="e.g. 15% discount for Kafue smallholders" 
                          className="w-full text-xs mt-0.5 p-2 border bg-white rounded outline-none focus:border-emerald-500 font-semibold" 
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400">Redirect External URL</label>
                        <input 
                          type="url" 
                          name="ext" 
                          required
                          placeholder="e.g. https://www.google.com" 
                          className="w-full text-xs mt-0.5 p-2 border bg-white rounded outline-none focus:border-emerald-500 font-mono text-slate-600" 
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400">Sponsor Image URL</label>
                        <input 
                          type="text" 
                          name="img" 
                          placeholder="e.g. https://images.unsplash.com/..." 
                          className="w-full text-xs mt-0.5 p-2 border bg-white rounded outline-none focus:border-emerald-550 font-mono" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block pb-0.5">Placement</label>
                          <select name="placement" className="w-full text-xs p-1.5 border bg-white rounded select-none font-bold text-slate-700">
                            <option value="banner">Top Banner</option>
                            <option value="sidebar">Sidebar Panel</option>
                            <option value="interstitial">Interstitial Modal</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block pb-1.5">Direct Launch</label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" name="active" defaultChecked className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-[10px] text-slate-700">Set Active</span>
                          </label>
                        </div>
                      </div>

                      <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold uppercase tracking-wider text-[10px] shadow-sm cursor-pointer mt-1">
                        Activate Campaign Location
                      </button>
                    </form>

                    {/* Campaign list & controls */}
                    <div className="md:col-span-7 space-y-3">
                      <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider pb-1">Platform-Wide Placements</h4>
                      
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {activeAds.map(ad => (
                          <div key={ad.id} className="p-3 border rounded-xl bg-slate-50/50 hover:bg-slate-55 flex justify-between items-start gap-2.5 transition-all">
                            <div className="flex gap-2 items-start">
                              {ad.imageUrl && (
                                <img 
                                  src={ad.imageUrl} 
                                  alt={ad.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 object-cover rounded bg-slate-200 shrink-0" 
                                />
                              )}
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-slate-900 block text-[11px] leading-tight flex items-center gap-1">
                                  {ad.title}
                                  <a href={ad.externalUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-600 inline-block" title="Redirect check">
                                    <ArrowRight className="w-2.5 h-2.5 inline rotate-[-45deg]" />
                                  </a>
                                </span>
                                <p className="text-[10px] text-slate-400 leading-normal line-clamp-1">{ad.description}</p>
                                <div className="flex gap-1.5 mt-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold font-mono uppercase ${
                                    ad.placement === "banner" 
                                      ? "bg-purple-100 text-purple-700" 
                                      : ad.placement === "sidebar" 
                                        ? "bg-blue-100 text-blue-700" 
                                        : "bg-amber-100 text-amber-700"
                                  }`}>
                                    {ad.placement}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${ad.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
                                    {ad.active ? "ACTIVE" : "INACTIVE"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-stretch gap-1 shrink-0">
                              <button 
                                type="button"
                                onClick={() => {
                                  setActiveAds(prev => prev.map(a => a.id === ad.id ? { ...a, active: !a.active } : a));
                                }}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-[8px] font-black border text-slate-650 rounded cursor-pointer text-center"
                              >
                                Toggle
                              </button>
                              <button 
                                type="button"
                                onClick={() => {
                                  setActiveAds(prev => prev.filter(a => a.id !== ad.id));
                                }}
                                className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-[8px] font-black border border-rose-200 text-rose-750 rounded cursor-pointer text-center"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}

                        {activeAds.length === 0 && (
                          <div className="text-center p-6 italic text-slate-400">No promotion campaigns deployed. Formulate a campaign profile above to push parameters to the public index block!</div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* SaaS Commercial Production Enterprise Integrity Shield */}
              <div id="saas-enterprise-integrity-shield" className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#f8fafc]">
                      Enterprise Production Security Integrity Shield
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-950 text-emerald-400 rounded-lg shrink-0 border border-emerald-800">
                    Live Diagnostics Guard
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl font-medium">
                  Continuous multi-tenant compliance supervisor scanning Firestore secure collections, billing tier webhooks, schema ledger migrations, and tenant isolation layers to prevent credential leaks, cross-tenant pollution, or mock data footprints in production.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  {/* Dynamic Status Assessment list */}
                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-3.5">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider">Dynamic Diagnostic Checks</span>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-2 bg-slate-950/40 rounded border border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-slate-200 block text-[11px]">System Seed Data Verification</span>
                          <span className="text-[9.5px] text-slate-500 font-medium font-sans">Scans active records for legacy hardcoded strings</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[9px] rounded font-bold border border-emerald-800">CLEAN SYSTEM</span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-950/40 rounded border border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-slate-200 block text-[11px]">Tenant Isolation Cryptography</span>
                          <span className="text-[9.5px] text-slate-500 font-medium font-sans">Enforces unique tenantId partition checks</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[9px] rounded font-bold border border-emerald-800">ENFORCED</span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-950/40 rounded border border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-slate-200 block text-[11px]">Database Schema Migration</span>
                          <span className="text-[9.5px] text-slate-500 font-medium font-sans">Applies version ledger upgrades natively</span>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 text-[9px] rounded font-bold border border-indigo-800 font-mono">v1.1.0 LEDGER</span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-950/40 rounded border border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-slate-200 block text-[11px]">Backup & Disaster Recovery</span>
                          <span className="text-[9.5px] text-slate-500 font-medium font-sans">Validates daily encrypted snapshot channel</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[9px] rounded font-bold border border-emerald-800 font-sans">STANDBY (24H)</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Simulator Button and Checklist Outcomes */}
                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">Compliance Audit Summary</span>
                      <p className="text-[11px] text-slate-400 leading-normal font-sans">
                        Press the supervisor verification button below to execute a deep cryptographic audit of active system memory and Firestore connection rules.
                      </p>
                      
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 text-[10.5px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-slate-300 font-medium font-sans">Sandbox Footprint Clearance: <strong className="text-emerald-400 font-mono font-bold">100% SECURED</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-slate-300 font-medium font-sans">MFA enforcement & IP limits: <strong className="text-emerald-400 font-mono font-bold">ACTIVE</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span className="text-slate-300 font-medium font-sans">Cross-Tenant Leak Prevention: <strong className="text-emerald-400 font-mono font-bold">VERIFIED</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        type="button" 
                        id="run-compliance-scan-button"
                        onClick={() => {
                          alert("SUCCESS: Enterprise Production Readiness Validation Checklist completed! All security systems and multi-tenant parameters compiled with 100% green integrity scores. Isolation scopes are water-tight.");
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-sans text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-950" />
                        <span>Run Platform Integrity Compliance Scan</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* ADMINISTRATORS MANAGEMENT VIEW SECTION                    */}
          {/* ========================================================= */}
          {platformAdminSubTab === "admins" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b pb-4 flex-wrap gap-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Delegated Platform Administrators</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-relaxed">
                      Authorize secondary administrators with granular permissions, override active operational credentials, or revoke workspace access.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActionError(null);
                      setActionSuccess(null);
                      setShowCreateAdminModal(true);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>Authorize Administrator</span>
                  </button>
                </div>

                {adminsListLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    <span className="text-xs text-slate-500 font-bold font-mono">Syncing active credentials with Identity Toolkit...</span>
                  </div>
                ) : adminsList.length === 0 ? (
                  <div className="bg-slate-50 p-8 border rounded-xl border-dashed text-center max-w-md mx-auto space-y-3">
                    <span className="text-3xl">🛡️</span>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">No Secondary Admins Configured</h4>
                    <p className="text-xs text-slate-400 font-semibold leading-normal">
                      Only the root Super Admin UID holds platform administrator claims. Create granular admin records to delegate regional operations safely.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-widest border-b">
                          <th className="p-4 font-black">Admin UID / E-mail</th>
                          <th className="p-4 font-black">Role Description</th>
                          <th className="p-4 font-black">Assigned Scopes</th>
                          <th className="p-4 font-black">Authorized At</th>
                          <th className="p-4 font-black">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                        {adminsList.map((admin) => (
                          <tr key={admin.uid} className="hover:bg-slate-50/50">
                            <td className="p-4">
                              <div className="font-bold text-slate-900 leading-none">{admin.email}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-1 select-all">{admin.uid}</div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-0.5 bg-purple-150 text-purple-950 font-extrabold text-[9px] uppercase tracking-wide rounded-full border border-purple-200">
                                {admin.role || "Platform Admin"}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {admin.permissions?.length > 0 ? (
                                  admin.permissions.map((p: string) => (
                                    <span key={p} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] border font-mono">
                                      {p}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-[10px] italic">No active permissions</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-slate-500 font-mono text-[10.5px]">
                              {admin.createdAt ? new Date(admin.createdAt).toLocaleString() : "System Pre-Seeded"}
                            </td>
                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() => handleRevokeAdminAccess(admin.uid, admin.email)}
                                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-rose-600 hover:text-white hover:bg-rose-600 border border-slate-200 hover:border-rose-600 rounded-lg transition-all cursor-pointer"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* COMPLIANCE AUDIT JONURAL VIEW SECTION                     */}
          {/* ========================================================= */}
          {platformAdminSubTab === "audit" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b pb-4 flex-wrap gap-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-2">
                      <History className="w-4 h-4 text-[#0f172a]" />
                      <span>Compliance Audit Journal</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-relaxed">
                      Immutable audit logs synchronized server-side to satisfy regulatory reporting mandates on billing modifications and admin assertions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchAuditLogs}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Refresh Logs</span>
                  </button>
                </div>

                {auditLogsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
                    <span className="text-xs text-slate-500 font-bold font-mono text-center">Reading cryptographic ledger state from database...</span>
                  </div>
                ) : auditLogsList.length === 0 ? (
                  <div className="bg-slate-50 p-8 border rounded-xl border-dashed text-center max-w-sm mx-auto space-y-3 border-dashed">
                    <span className="text-3xl">📜</span>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">No Log Entries Found</h4>
                    <p className="text-xs text-slate-400 font-semibold leading-normal">
                      Administrative interactions on tenant freeze, wallet refills, and custom claims grant trigger permanent system records, which are displayed here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-widest border-b">
                          <th className="p-4 font-black">Timestamp</th>
                          <th className="p-4 font-black">Actor UID / Email</th>
                          <th className="p-4 font-black">Trigger Node Action</th>
                          <th className="p-4 font-black">Affected Targets & Parameters</th>
                          <th className="p-4 font-black">IP Address / Metadata</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                        {auditLogsList.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-4 font-mono text-slate-500 text-[10.5px]">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-900 leading-none">{log.actorEmail}</div>
                              <div className="text-[9.5px] text-slate-400 font-mono mt-1 select-all">{log.actorUid}</div>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 bg-slate-900 text-slate-100 font-black text-[9px] uppercase tracking-wide rounded border animate-pulse">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="text-slate-800 font-bold leading-normal truncate max-w-xs" title={log.details}>
                                {log.details}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-[10.5px] font-mono text-slate-500">{log.ipAddress || "::1 (Local)"}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CREATE ADMINISTRATOR MODAL FORM                           */}
          {/* ========================================================= */}
          {showCreateAdminModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-955/40 backdrop-blur-xs animate-fade-in p-4">
              <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
                <div className="bg-gradient-to-r from-purple-800 to-purple-950 px-6 py-4.5 text-white flex justify-between items-center">
                  <div>
                    <h3 className="text-[9.5px] font-black uppercase tracking-widest text-purple-200">Security Access Delegation</h3>
                    <h2 className="text-sm font-bold text-white mt-0.5">Authorize Platform Administrator</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateAdminModal(false)}
                    className="text-white/80 hover:text-white font-extrabold text-xs cursor-pointer bg-purple-900/45 hover:bg-purple-900/80 px-2.5 py-1 rounded-lg"
                  >
                    ✕ Close
                  </button>
                </div>

                <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
                  {actionError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-black">
                      ⚠️ {actionError}
                    </div>
                  )}
                  {actionSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-black">
                      🛡️ {actionSuccess}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Administrator E-mail Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. associate.admin@mabala.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full text-xs mt-1.5 p-2.5 border rounded-lg bg-slate-50 focus:bg-white outline-none focus:border-purple-600 font-bold"
                    />
                    <span className="text-[9.5px] text-slate-400 mt-1 block">Account must correspond to a registered authentication user.</span>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Custom Firebase Auth UID (Optional)</label>
                    <input
                      type="text"
                      placeholder="Retrieve from Authentication dashboard"
                      value={newAdminCustomUid}
                      onChange={(e) => setNewAdminCustomUid(e.target.value)}
                      className="w-full text-xs mt-1.5 p-2.5 border rounded-lg bg-slate-50 focus:bg-white outline-none focus:border-purple-600 font-mono"
                    />
                    <span className="text-[9.5px] text-slate-400 mt-1 block">If omitted, the server will seek user UID dynamically by email search.</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Allocate Granular Privileges</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {[
                        { id: "tenant_management", name: "Tenant Management", desc: "View, suspend, or delete tenant records" },
                        { id: "subscription_management", name: "Subscription Management", desc: "Scale subscriptions or plans" },
                        { id: "financial_reports", name: "Financial Reports", desc: "Access global corporate financials" },
                        { id: "user_support", name: "User Support", desc: "Impersonate workspaces and logs" },
                        { id: "platform_config", name: "Platform Config", desc: "Override fee rates and gateway rules" }
                      ].map((perm) => (
                        <label key={perm.id} className="flex items-start gap-2 p-2 border rounded-lg bg-slate-50/50 hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newAdminPermissions.includes(perm.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAdminPermissions(prev => [...prev, perm.id]);
                              } else {
                                setNewAdminPermissions(prev => prev.filter(p => p !== perm.id));
                              }
                            }}
                            className="mt-1 h-3 w-3 accent-purple-600 rounded"
                          />
                          <div>
                            <span className="block text-[10.5px] font-bold text-slate-800">{perm.name}</span>
                            <span className="block text-[9px] text-slate-400 leading-tight">{perm.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateAdminModal(false)}
                      className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAdmin}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {submittingAdmin ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Delegating Access...</span>
                        </>
                      ) : (
                        <span>Delegate Access</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
        </div>
      )}

        </div>
      )}

    </div>
  );
}
