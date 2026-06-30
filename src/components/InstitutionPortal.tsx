import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  UserCheck, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  Trash2, 
  Send, 
  Lock, 
  UserPlus, 
  ChevronRight, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  User,
  ShieldCheck,
  Building,
  HelpCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Percent,
  Download
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const calculateSmsParts = (text: string): number => {
  if (!text) return 0;
  if (text.length <= 160) return 1;
  return Math.ceil(text.length / 153);
};

interface InstitutionPortalProps {
  userProfile: {
    uid: string;
    email: string;
    name: string;
    role: string;
    tenantId?: string;
  };
  onLogout: () => void | Promise<void>;
}

export default function InstitutionPortal({ userProfile, onLogout }: InstitutionPortalProps) {
  const [activeMenu, setActiveMenu] = useState<
    "dashboard" | "reports" | "directory" | "subusers" | "billing" | "sms" | "settings"
  >("dashboard");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [farmersList, setFarmersList] = useState<any[]>([]);
  const [subUsersList, setSubUsersList] = useState<any[]>([]);
  const [billingData, setBillingData] = useState<any>(null);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffScope, setNewStaffScope] = useState<string[]>([]); // farmer IDs
  const [newStaffScopeType, setNewStaffScopeType] = useState<"all" | "region" | "cohort" | "farmers">("all");
  const [newStaffScopeValue, setNewStaffScopeValue] = useState(""); // text value for region or cohort
  const [newStaffPermissions, setNewStaffPermissions] = useState({
    view_dashboard: true,
    view_reports: true,
    export_data: true,
    send_sms: true,
  });
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [farmerSearchQuery, setFarmerSearchQuery] = useState("");
  const [selectedSubUserLogs, setSelectedSubUserLogs] = useState<any[] | null>(null);
  const [selectedSubUserNameForLogs, setSelectedSubUserNameForLogs] = useState("");
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  const [smsRecipients, setSmsRecipients] = useState<string[]>([]); // target farmer IDs
  const [smsMessage, setSmsMessage] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Advanced Bulk SMS States
  const [availableSmsRecipients, setAvailableSmsRecipients] = useState<any[]>([]);
  const [excludedOptOutCount, setExcludedOptOutCount] = useState<number>(0);
  const [smsBatches, setSmsBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [batchMessages, setBatchMessages] = useState<any[]>([]);
  const [batchSummary, setBatchSummary] = useState<any | null>(null);
  const [isLoadingSmsDetails, setIsLoadingSmsDetails] = useState(false);
  const [smsSendMode, setSmsSendMode] = useState<"immediate" | "scheduled">("immediate");
  const [smsScheduledTime, setSmsScheduledTime] = useState<string>("");
  const [showTopUpRequest, setShowTopUpRequest] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  
  // Recipient Filters
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterCohort, setFilterCohort] = useState<string>("all");
  const [filterCrop, setFilterCrop] = useState<string>("all");

  // Settings states
  const [settingsCoBranding, setSettingsCoBranding] = useState(false);
  const [settingsAllowMulti, setSettingsAllowMulti] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsLogo, setSettingsLogo] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Search and detail states
  const [directorySearch, setDirectorySearch] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);

  // Directory Export modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportConsentChecked, setExportConsentChecked] = useState(false);
  const [exportFormat, setExportFormat] = useState<"CSV" | "JSON">("CSV");
  const [isExporting, setIsExporting] = useState(false);

  // Dynamic Dashboard Filters State
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [cohortFilter, setCohortFilter] = useState("");
  const [cropTypeFilter, setCropTypeFilter] = useState("");
  const [trendPeriod, setTrendPeriod] = useState<"daily" | "weekly" | "monthly" | "seasonal" | "annual">("monthly");

  // Token helper
  const getAuthHeader = () => {
    // Attempt to pull user profile credentials or standard localStorage token
    const token = localStorage.getItem("mabala_id_token") || "";
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  // 1. Check auth / loading / status
  const loadPortalData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const headers = getAuthHeader();
      const queryParams = new URLSearchParams();
      if (startDateFilter) queryParams.append("startDate", startDateFilter);
      if (endDateFilter) queryParams.append("endDate", endDateFilter);
      if (regionFilter) queryParams.append("region", regionFilter);
      if (cohortFilter) queryParams.append("cohort_tag", cohortFilter);
      if (cropTypeFilter) queryParams.append("cropType", cropTypeFilter);

      const res = await fetch(`/api/institution/dashboard-summary?${queryParams.toString()}`, { headers });
      
      if (res.status === 403) {
        const errJson = await res.json();
        if (errJson.error && errJson.error.includes("suspended")) {
          setIsSuspended(true);
          setIsLoading(false);
          return;
        }
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to load dashboard data.");
      }

      const data = await res.json();
      setDashboardData(data);
      if (data.farmers) {
        setFarmersList(data.farmers);
      }
      
      // Seed Settings form
      if (data.institution) {
        setSettingsCoBranding(!!data.institution.co_branding_enabled);
        setSettingsAllowMulti(!!data.institution.allow_multi_sponsor);
        setSettingsName(data.institution.name || "");
      }

      // Fetch other sections in background
      fetchBilling();
      fetchReports();
      if (userProfile.role.toLowerCase().replace(/[\s_-]+/g, "") === "institutionadmin") {
        fetchSubUsers();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFarmers = async () => {
    try {
      const res = await fetch("/api/institution/farmers", { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setFarmersList(data.farmers || []);
      }
    } catch (err) {}
  };

  const fetchSubUsers = async () => {
    try {
      const res = await fetch("/api/institution/sub-users", { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setSubUsersList(data.subUsers || []);
      }
    } catch (err) {}
  };

  const fetchBilling = async () => {
    try {
      const res = await fetch("/api/institution/billing", { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setBillingData(data.billing || null);
      }
    } catch (err) {}
  };

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/institution/reports", { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setReportsList(data.reports || []);
      }
    } catch (err) {}
  };

  const handleExecuteExport = async () => {
    if (!exportConsentChecked) {
      setErrorMessage("Compliance error: You must confirm that your organization holds valid consent to export.");
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/institution/farmers/export", {
        method: "POST",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: exportFormat,
          consentConfirmed: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to execute directory export.");
      }

      const responseData = await res.json();
      const exportList = responseData.data || [];

      // Generate dynamic file download
      let content = "";
      let filename = `mabala_farmer_directory_${Date.now()}`;
      let mimeType = "application/json";

      if (exportFormat === "CSV") {
        mimeType = "text/csv;charset=utf-8;";
        filename += ".csv";
        const headers = ["ID", "Name", "Phone", "Region", "Cohort", "Registration Date", "Activity Status", "Subscription Status"];
        const rows = exportList.map((f: any) => [
          f.id,
          `"${(f.name || "").replace(/"/g, '""')}"`,
          f.phone || "N/A",
          `"${(f.region || f.location || "").replace(/"/g, '""')}"`,
          `"${(f.cohort || "").replace(/"/g, '""')}"`,
          f.registeredAt || "N/A",
          f.activityStatus || "Active",
          f.subscriptionStatus || "Active"
        ]);
        content = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      } else {
        filename += ".json";
        content = JSON.stringify(exportList, null, 2);
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage(`Directory exported successfully! ${exportList.length} records saved to ${exportFormat}.`);
      setIsExportModalOpen(false);
      setExportConsentChecked(false);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  useEffect(() => {
    if (activeMenu === "sms") {
      fetchSmsRecipientsAndBatches();
    }
  }, [activeMenu]);

  // Actions
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail || !newStaffName || !newStaffPassword) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }
    setIsCreatingStaff(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const scopeValueToSend =
        newStaffScopeType === "farmers"
          ? newStaffScope
          : newStaffScopeType === "region" || newStaffScopeType === "cohort"
          ? newStaffScopeValue
          : [];

      const res = await fetch("/api/institution/sub-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({
          email: newStaffEmail,
          name: newStaffName,
          phone: newStaffPhone,
          password: newStaffPassword,
          scopeType: newStaffScopeType,
          scopeValue: scopeValueToSend,
          permissions: newStaffPermissions
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create staff user.");

      setSuccessMessage(`Sub-user "${newStaffName}" has been successfully added to your institution staff.`);
      setNewStaffEmail("");
      setNewStaffName("");
      setNewStaffPhone("");
      setNewStaffPassword("");
      setNewStaffScope([]);
      setNewStaffScopeType("all");
      setNewStaffScopeValue("");
      setNewStaffPermissions({
        view_dashboard: true,
        view_reports: true,
        export_data: true,
        send_sms: true,
      });
      fetchSubUsers();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const newStatus = user.status === "deactivated" ? "active" : "deactivated";
    const confirmMsg = `Are you sure you want to ${newStatus === "deactivated" ? "deactivate" : "reactivate"} "${user.name}"? ${newStatus === "deactivated" ? "This will immediately invalidate their active sessions." : ""}`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/institution/sub-users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update sub-user status.");

      setSuccessMessage(`Sub-user "${user.name}" status has been toggled to ${newStatus}.`);
      fetchSubUsers();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleFetchLogs = async (user: any) => {
    setErrorMessage(null);
    setIsFetchingLogs(true);
    setSelectedSubUserNameForLogs(user.name);
    try {
      const res = await fetch(`/api/institution/sub-users/${user.id}/logs`, {
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch sub-user logs.");
      setSelectedSubUserLogs(data.logs || []);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsFetchingLogs(false);
    }
  };

  const handleRevokeStaff = async (uid: string) => {
    if (!window.confirm("Are you sure you want to revoke all access for this staff member? This action cannot be undone.")) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/institution/sub-users/${uid}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke staff user.");
      }
      setSuccessMessage("Staff sub-user access has been completely revoked.");
      fetchSubUsers();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const fetchSmsRecipientsAndBatches = async () => {
    try {
      const resRecipients = await fetch("/api/sms/recipients", { headers: getAuthHeader() });
      if (resRecipients.ok) {
        const data = await resRecipients.json();
        setAvailableSmsRecipients(data.recipients || []);
        setExcludedOptOutCount(data.excludedCount || 0);
      }
      
      const resBatches = await fetch("/api/sms/batches", { headers: getAuthHeader() });
      if (resBatches.ok) {
        const data = await resBatches.json();
        setSmsBatches(data.batches || []);
      }
    } catch (err) {}
  };

  const handleViewBatchDetails = async (batchId: string) => {
    setIsLoadingSmsDetails(true);
    try {
      const res = await fetch(`/api/sms/batches/${batchId}`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setSelectedBatch(data.batch);
        setBatchMessages(data.messages || []);
        setBatchSummary(data.summary || null);
      }
    } catch (err) {
      setErrorMessage("Failed to load batch details.");
    } finally {
      setIsLoadingSmsDetails(false);
    }
  };

  const handleDownloadCsv = (batch: any, messages: any[]) => {
    let csv = "Recipient Name,Recipient Phone,Personalized Message,Status,Parts,Error Message,Timestamp\n";
    for (const m of messages) {
      csv += `"${(m.recipient_name || "").replace(/"/g, '""')}",${m.recipient_phone},"${(m.personalized_message || "").replace(/"/g, '""')}",${m.status},${m.parts || 1},"${(m.error_message || "").replace(/"/g, '""')}",${m.timestamp}\n`;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sms_delivery_report_${batch.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (smsRecipients.length === 0) {
      setErrorMessage("Please select at least one recipient.");
      return;
    }
    if (!smsMessage.trim()) {
      setErrorMessage("Please compose a text message.");
      return;
    }

    // Map recipient IDs to fully-formed recipient list
    const selectedList = availableSmsRecipients
      .filter(r => smsRecipients.includes(r.id))
      .map(r => ({
        id: r.id,
        phone: r.phone,
        name: r.name
      }));

    setIsSendingSms(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/sms/send-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({
          selectedRecipients: selectedList,
          rawMessage: smsMessage,
          sendMode: smsSendMode,
          scheduledTime: smsSendMode === "scheduled" ? smsScheduledTime : null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch SMS batch.");
      }

      if (smsSendMode === "scheduled") {
        setSuccessMessage(`SMS batch successfully scheduled for ${selectedList.length} recipients.`);
      } else {
        setSuccessMessage(`Bulk SMS batch successfully sent to ${selectedList.length} recipients.`);
      }

      setSmsMessage("");
      setSmsRecipients([]);
      fetchBilling(); // Update credit balance
      fetchSmsRecipientsAndBatches(); // Refresh batches table
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleRequestTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTopUp(true);
    setTopUpSuccess(false);
    try {
      // Simulate real Top-up request to admin
      await new Promise(resolve => setTimeout(resolve, 800));
      setTopUpSuccess(true);
      setSuccessMessage(`Request for ${topUpAmount} SMS Credits top-up has been sent to Super Admin. Our billing team will credit your wallet immediately.`);
      setTimeout(() => setShowTopUpRequest(false), 3000);
    } catch (_) {
    } finally {
      setIsSubmittingTopUp(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/institution/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({
          co_branding_enabled: settingsCoBranding,
          allow_multi_sponsor: settingsAllowMulti,
          name: settingsName,
          logoUrl: settingsLogo
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update settings.");
      }
      setSuccessMessage("Institution settings saved successfully.");
      loadPortalData();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 2. Firewall: Suspension Screen
  if (isSuspended) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-rose-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Accent Glow */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-rose-500/10 blur-3xl rounded-full" />
          
          <div className="h-16 w-16 bg-rose-950/80 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20 shadow-lg">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          
          <h1 className="text-xl font-extrabold tracking-tight text-white mb-2 font-sans">
            Access Suspended
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Access suspended — contact Mabala support to reactivate.
          </p>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6 text-xs text-slate-500 font-mono text-left">
            <div>User ID: {userProfile.uid}</div>
            <div>Tenant: {userProfile.tenantId}</div>
            <div>Role: {userProfile.role}</div>
          </div>

          <button
            onClick={onLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            <LogOut className="w-4 h-4" />
            Logout from Session
          </button>
        </div>
      </div>
    );
  }

  // 3. Loading Screen
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <div className="text-xs uppercase tracking-widest text-indigo-400 font-extrabold animate-pulse">
            Loading Institution Security Vault...
          </div>
        </div>
      </div>
    );
  }

  const isUserAdmin = userProfile.role.toLowerCase().replace(/[\s_-]+/g, "") === "institutionadmin";

  return (
    <div className="h-screen w-full bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* Top Banner Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950 px-8 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-650 flex items-center justify-center shadow-lg border border-indigo-500/30">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                {dashboardData?.institution?.type || "NGO / Sponsor"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
            <h1 className="text-sm font-extrabold text-white leading-none">
              {dashboardData?.institution?.name || "Institution Portal"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-mono text-slate-500">SIGNED IN AS</span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{userProfile.name} ({userProfile.role})</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-200 text-slate-300 border border-slate-700 hover:border-rose-900 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Workspace Layout */}
      <div className="flex-1 flex h-full overflow-hidden relative">
        
        {/* Left Side Isolated Navigation Bar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between p-4 shrink-0 relative z-10">
          <div className="space-y-1.5">
            <div className="px-3 pb-3 pt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Mabala Institution Shell
              </span>
            </div>

            <button
              onClick={() => setActiveMenu("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeMenu === "dashboard"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Impact Dashboard</span>
            </button>

            <button
              onClick={() => setActiveMenu("directory")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeMenu === "directory"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Farmer Directory</span>
            </button>

            <button
              onClick={() => setActiveMenu("sms")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeMenu === "sms"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Bulk SMS Tool</span>
            </button>

            <button
              onClick={() => setActiveMenu("reports")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeMenu === "reports"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Reports & Exports</span>
            </button>

            {isUserAdmin && (
              <button
                onClick={() => setActiveMenu("subusers")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeMenu === "subusers"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Sub-User Control</span>
                </div>
                <span className="text-[10px] bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">Admin</span>
              </button>
            )}

            <button
              onClick={() => setActiveMenu("billing")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeMenu === "billing"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Billing & SMS Pool</span>
            </button>

            {isUserAdmin && (
              <button
                onClick={() => setActiveMenu("settings")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeMenu === "settings"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </button>
            )}
          </div>

          <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80 text-center">
            <span className="text-[9px] font-bold text-emerald-400 block uppercase mb-1">● Shield Active</span>
            <p className="text-[10px] text-slate-500 leading-snug">
              Strict compliance data vault is sealed under end-to-end audit tracking.
            </p>
          </div>
        </aside>

        {/* Viewport Dashboard Space */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          
          {/* Notification Messages Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-2xl text-xs font-semibold flex items-center gap-3 shadow-md animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-3 shadow-md animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Render Active Menu Tab */}
          {activeMenu === "dashboard" && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Header Info */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                  <h2 className="text-xl font-black text-white font-sans tracking-tight">
                    Impact Reporting Dashboard
                  </h2>
                  <p className="text-slate-400 text-xs">
                    Aggregated monitoring, ecological footprints, demographic disaggregation, and marketplace volume metrics.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-900 font-bold px-3 py-1.5 rounded-xl">
                    Live Data Ledger
                  </span>
                  <button 
                    onClick={loadPortalData}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-all border border-slate-700 cursor-pointer"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>

              {/* Dynamic Filter Controls Panel */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Advanced Cohort & Data Filtering
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Filter live aggregates</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {/* Start Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Start Date</label>
                    <input 
                      type="date" 
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-white"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">End Date</label>
                    <input 
                      type="date" 
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-white"
                    />
                  </div>

                  {/* Region Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Region/Province</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Lusaka, Southern"
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-white placeholder:text-slate-600"
                    />
                  </div>

                  {/* Cohort Tag */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Cohort/Program Tag</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Pilot-2026, Maize-A"
                      value={cohortFilter}
                      onChange={(e) => setCohortFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-white placeholder:text-slate-600"
                    />
                  </div>

                  {/* Crop Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Crop Type Filter</label>
                    <select
                      value={cropTypeFilter}
                      onChange={(e) => setCropTypeFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-white cursor-pointer"
                    >
                      <option value="">All Crop Types</option>
                      <option value="Maize">Maize</option>
                      <option value="Soybean">Soybean / Soya</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Sunflower">Sunflower</option>
                      <option value="Sorghum">Sorghum</option>
                      <option value="Other">Other Crops</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setStartDateFilter("");
                      setEndDateFilter("");
                      setRegionFilter("");
                      setCohortFilter("");
                      setCropTypeFilter("");
                      // Reactive clear
                      setTimeout(() => loadPortalData(), 50);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={loadPortalData}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-650/20"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>

              {/* Bento Grid Analytics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total Farmers */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-4 right-4 h-10 w-10 bg-indigo-950 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-900/30">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Farmers Monitored</span>
                  <div className="text-3xl font-extrabold text-white mt-1.5">
                    {dashboardData?.summary?.totalFarmers || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active program consensus</span>
                  </div>
                </div>

                {/* Total Hectares */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-4 right-4 h-10 w-10 bg-indigo-950 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-900/30">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Total Hectares</span>
                  <div className="text-3xl font-extrabold text-white mt-1.5">
                    {Number(dashboardData?.summary?.totalHectaresFarmed || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ha
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">Aggregated active farm acreage</div>
                </div>

                {/* Active Crop Cycles */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-4 right-4 h-10 w-10 bg-indigo-950 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-900/30">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Active Crop Cycles</span>
                  <div className="text-3xl font-extrabold text-white mt-1.5">
                    {dashboardData?.summary?.totalActiveCropCycles || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">Active crop telemetry streams</div>
                </div>

                {/* Consolidated Financial Net Income */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-4 right-4 h-10 w-10 bg-indigo-950 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-900/30">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Net Margin (ZMW)</span>
                  <div className={`text-2xl font-extrabold mt-1.5 ${
                    (dashboardData?.summary?.netIncomeMargin || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {Number(dashboardData?.summary?.netIncomeMargin || 0).toLocaleString()} ZMW
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
                    <span>Rev: {Number(dashboardData?.summary?.totalRevenue || 0).toLocaleString()}</span>
                    <span>Exp: {Number(dashboardData?.summary?.totalExpenses || 0).toLocaleString()}</span>
                  </div>
                </div>

              </div>

              {/* Data Visualization Charts & Trend Period Selectors */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Consolidated Yield Trends (Primary Recharts) */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6 lg:col-span-2 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Aggregated Performance Trends</h3>
                      <p className="text-xs text-slate-400">Linked cohort revenue vs expenditures over selected period.</p>
                    </div>
                    
                    {/* Period Toggles */}
                    <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                      {(["daily", "weekly", "monthly", "seasonal", "annual"] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setTrendPeriod(period)}
                          className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                            trendPeriod === period
                              ? "bg-indigo-600 text-white shadow-md"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-80 w-full pt-2">
                    {(!dashboardData?.trends?.[trendPeriod] || dashboardData.trends[trendPeriod].length === 0) ? (
                      <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
                        <span>No historical transactions logged for this selected time grouping.</span>
                        <span className="text-[10px] text-slate-600 mt-1">Select a different filter or add a trial record.</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.trends[trendPeriod]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 12 }} />
                          <Line type="monotone" dataKey="revenue" name="Total revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          <Line type="monotone" dataKey="expenses" name="Total expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          <Line type="monotone" dataKey="net" name="Net income" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Demographics & Compliance Circular Rings */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Cohort Disaggregation</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Evolving gender ratios, youth empowerment, and subscription health.
                    </p>
                  </div>
                  
                  {/* Progress Items */}
                  <div className="space-y-5 flex-1 justify-center flex flex-col">
                    
                    {/* Gender */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Female Farmer Base</span>
                        <span className="font-mono text-indigo-400">
                          {dashboardData?.summary?.totalFarmers > 0 
                            ? Math.round(((dashboardData?.demographics?.femaleCount || 0) / dashboardData.summary.totalFarmers) * 100) 
                            : 0}% ({dashboardData?.demographics?.femaleCount || 0}/{dashboardData?.summary?.totalFarmers || 0})
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${dashboardData?.summary?.totalFarmers > 0 
                              ? Math.round(((dashboardData?.demographics?.femaleCount || 0) / dashboardData.summary.totalFarmers) * 100) 
                              : 0}%` 
                          }} 
                        />
                      </div>
                    </div>

                    {/* Youth */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Youth (Under 35) Adoption</span>
                        <span className="font-mono text-indigo-400">
                          {dashboardData?.demographics?.youthPercentage || 0}% ({dashboardData?.demographics?.youthCount || 0} farmers)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${dashboardData?.demographics?.youthPercentage || 0}%` }} 
                        />
                      </div>
                    </div>

                    {/* Subscription Compliance */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Payment & Subscription Compliance</span>
                        <span className="font-mono text-indigo-400">
                          {dashboardData?.compliance?.currentPercentage || 0}% ({dashboardData?.compliance?.currentCount || 0} current)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${dashboardData?.compliance?.currentPercentage || 0}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Compliant: {dashboardData?.compliance?.currentCount || 0}</span>
                        <span>Overdue/Suspended: {dashboardData?.compliance?.overdueCount || 0}</span>
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-slate-850 flex items-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span>Calculated across authorized linked accounts.</span>
                  </div>
                </div>

              </div>

              {/* Sub-section details grids (Livestock, Crops, Financials) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. Livestock Production Systems */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">Livestock & Dairy Assets</h4>
                      <p className="text-xs text-slate-400">Total registers, animal products, and poultry counts.</p>
                    </div>
                    <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-500">
                      {dashboardData?.summary?.totalLivestockRegistered || 0} Head
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Milk Stats */}
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Milk Production</span>
                      <div className="text-xl font-black text-white">
                        {Number(dashboardData?.summary?.totalMilkProduced || 0).toLocaleString()} Liters
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Avg {Number(dashboardData?.summary?.milkAveragePerFarm || 0).toFixed(1)} L per farm ({dashboardData?.summary?.farmsWithMilk || 0} farms)
                      </p>
                    </div>

                    {/* Egg Stats */}
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Egg Analytics</span>
                      <div className="text-xl font-black text-white">
                        {Number(dashboardData?.summary?.totalEggsCollected || 0).toLocaleString()} Collected
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Sold: {Number(dashboardData?.summary?.totalEggsSold || 0).toLocaleString()} eggs
                      </p>
                    </div>
                  </div>

                  {/* Species breakdown list */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-widest text-[9px]">Registered Species Breakdown</h5>
                    {!dashboardData?.livestockByType || Object.keys(dashboardData.livestockByType).length === 0 ? (
                      <p className="text-slate-500 text-xs italic">No livestock registers matching your filters.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(dashboardData.livestockByType).map(([type, count]: any) => (
                          <div key={type} className="bg-slate-900/40 px-3.5 py-2 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                            <span className="text-slate-400">{type}</span>
                            <span className="font-extrabold text-white">{count} head</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-indigo-950/20 border border-indigo-900/20 p-3.5 rounded-2xl text-[11px] text-indigo-300 flex items-center justify-between">
                    <span>Active poultry cycles monitored:</span>
                    <strong className="text-xs text-white">{dashboardData?.summary?.totalActivePoultryBatches || 0} batches</strong>
                  </div>
                </div>

                {/* 2. Labor Force, Investments & Financial Pools */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">Labor, Investments & Financing</h4>
                      <p className="text-xs text-slate-400">Consolidated financial pipelines and employment ratios.</p>
                    </div>
                    <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-500">
                      {dashboardData?.summary?.totalStaffCount || 0} Employed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Employment */}
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Sponsor Workforce</span>
                      <div className="text-xl font-black text-white">
                        {dashboardData?.summary?.totalStaffCount || 0} Employees
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Active farm hands across managed land.
                      </p>
                    </div>

                    {/* Capital Invested */}
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Capital Invested</span>
                      <div className="text-xl font-black text-indigo-400">
                        {Number(dashboardData?.summary?.totalInvestments || 0).toLocaleString()} ZMW
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Sponsorship & equipment pools
                      </p>
                    </div>
                  </div>

                  {/* Loans & Repayment Performance summary */}
                  <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Consolidated Credit Pools</span>
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-800/60 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Principal Approved</span>
                        <span className="text-sm font-extrabold text-white">
                          {Number(dashboardData?.summary?.totalLoansValue || 0).toLocaleString()} ZMW
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Outstanding Balance</span>
                        <span className="text-sm font-extrabold text-amber-500">
                          {Number(dashboardData?.summary?.totalLoansOutstanding || 0).toLocaleString()} ZMW
                        </span>
                      </div>
                    </div>

                    {/* Lenders summary */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wide">Primary Credit Sources</span>
                      {!dashboardData?.loansByLender || Object.keys(dashboardData.loansByLender).length === 0 ? (
                        <p className="text-slate-600 text-[11px] italic">No active sponsor loans logged.</p>
                      ) : (
                        Object.entries(dashboardData.loansByLender).map(([lender, amt]: any) => (
                          <div key={lender} className="flex justify-between items-center py-1 border-b border-slate-900/40 last:border-0">
                            <span className="text-slate-400">{lender}</span>
                            <span className="font-bold text-white">{Number(amt).toLocaleString()} ZMW</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Crop Yield & Input Adoption Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Agronomic Crop Yields */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                  <div className="border-b border-slate-900 pb-3">
                    <h4 className="text-sm font-bold text-white">Agronomic Performance Indexes</h4>
                    <p className="text-xs text-slate-400">Calculated average yields per hectare across linked cycles.</p>
                  </div>

                  <div className="space-y-4">
                    {!dashboardData?.cropYields || Object.keys(dashboardData.cropYields).length === 0 ? (
                      <p className="text-slate-500 text-xs italic py-4">No logged yields found matching the filter scope.</p>
                    ) : (
                      Object.entries(dashboardData.cropYields).map(([crop, data]: any) => {
                        const avgYield = data.totalHectares > 0 ? (data.totalYield / data.totalHectares) : 0;
                        return (
                          <div key={crop} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-white">{crop} Yield</span>
                              <span className="text-xs font-black text-indigo-400">
                                {Number(avgYield).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg/ha
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                              {/* Scale relative to 5000 kg/ha limit */}
                              <div 
                                className="bg-indigo-500 h-full rounded-full" 
                                style={{ width: `${Math.min((avgYield / 5000) * 100, 100)}%` }} 
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Total crop: {Number(data.totalYield).toLocaleString()} kg</span>
                              <span>Total monitored land: {Number(data.totalHectares).toLocaleString()} ha</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Input Adoption & Supplies usage */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                  <div className="border-b border-slate-900 pb-3">
                    <h4 className="text-sm font-bold text-white">Input Adoption & Fertilizer Usage</h4>
                    <p className="text-xs text-slate-400">Supplies applied on program farms by category.</p>
                  </div>

                  <div className="space-y-3">
                    {!dashboardData?.inputUsage || Object.keys(dashboardData.inputUsage).length === 0 ? (
                      <p className="text-slate-500 text-xs italic py-4">No active input stocks tracked.</p>
                    ) : (
                      Object.entries(dashboardData.inputUsage).map(([category, info]: any) => (
                        <div key={category} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-850 text-xs">
                          <div>
                            <span className="font-extrabold text-white block capitalize">{category}</span>
                            <span className="text-[10px] text-slate-500">{info.count} active applications</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-indigo-400 block">
                              {Number(info.quantity).toLocaleString()} {info.unit}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Valued: {Number(info.totalValue).toLocaleString()} ZMW
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Offtaker Marketplace Activity */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Offtaker Marketplace Integration</h4>
                    <p className="text-xs text-slate-400">Consolidated direct volume transactions, sales values, and buyer records.</p>
                  </div>
                  <div className="bg-indigo-950 border border-indigo-900 px-3.5 py-1.5 rounded-xl text-xs font-black text-indigo-300 mt-2 sm:mt-0">
                    Sponsor Offtaker ID: {dashboardData?.institution?.id || "N/A"}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Total Value */}
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Direct Market Sales</span>
                    <div className="text-2xl font-black text-white mt-1">
                      {Number(dashboardData?.offtakerActivity?.totalValue || 0).toLocaleString()} ZMW
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Value transacted directly under sponsor agreements.</p>
                  </div>

                  {/* Total Volume */}
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Direct Market Volume</span>
                    <div className="text-2xl font-black text-indigo-400 mt-1">
                      {Number(dashboardData?.offtakerActivity?.totalVolume || 0).toLocaleString()} Units
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Aggregate crops delivered and validated.</p>
                  </div>

                  {/* Compliance Verification */}
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Buyer Classifications</span>
                      <p className="text-[11px] text-slate-400 mt-1.5">Direct crop contracts and delivery logistics.</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono block mt-2">✓ Verified Institutional Offtake active</span>
                  </div>

                </div>

                {/* Products breakdown */}
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Transaction Value by Commodity</span>
                  {!dashboardData?.offtakerActivity?.byProduct || Object.keys(dashboardData.offtakerActivity.byProduct).length === 0 ? (
                    <p className="text-slate-600 text-xs italic">No sales logs match current filter criteria.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(dashboardData.offtakerActivity.byProduct).map(([product, data]: any) => (
                        <div key={product} className="bg-slate-900/30 p-4 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-extrabold text-white block truncate">{product}</span>
                            <span className="text-[10px] text-slate-500">Delivered: {Number(data.volume).toLocaleString()} {data.unit}</span>
                          </div>
                          <span className="font-bold text-emerald-400">
                            {Number(data.value).toLocaleString()} ZMW
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sponsoring Farmers interactive directory roster (Click details) */}
              <div className="space-y-4">
                <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-white">Interactive Sponsoring Cohort Roster</h4>
                    <p className="text-xs text-slate-400">Click on any participant to expand their secure read-only farm profile.</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Select a row to drill down</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/50 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="p-4 pl-6">Farmer Name</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Region</th>
                        <th className="p-4 text-center">Crops</th>
                        <th className="p-4 text-center">Livestock</th>
                        <th className="p-4 text-right pr-6">Full Profile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmersList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-slate-500">
                            No sponsoring farmers found for the selected filter combination.
                          </td>
                        </tr>
                      ) : (
                        farmersList.map((f, idx) => (
                          <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-900/20 transition-all">
                            <td className="p-4 pl-6 font-bold text-white">{f.name}</td>
                            <td className="p-4 text-slate-300">
                              <div>{f.email}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{f.phone}</div>
                            </td>
                            <td className="p-4 text-slate-400">{f.location}</td>
                            <td className="p-4 text-center font-bold text-indigo-400">{f.cropCycles}</td>
                            <td className="p-4 text-center font-bold text-emerald-400">{f.livestockCount}</td>
                            <td className="p-4 text-right pr-6">
                              <button
                                onClick={() => {
                                  // Find detail match in detailed registry cache
                                  const matched = dashboardData?.farmersDetails?.find((d: any) => d.id === f.id) || f;
                                  setSelectedFarmer(matched);
                                }}
                                className="bg-indigo-600/10 hover:bg-indigo-600/30 text-indigo-300 font-bold py-1.5 px-3.5 rounded-xl border border-indigo-500/20 transition-all cursor-pointer"
                              >
                                Drill Down
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeMenu === "directory" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                  <h2 className="text-xl font-black text-white">Linked Farmer Directory</h2>
                  <p className="text-slate-400 text-xs">
                    Consenting program farmers with active monitoring clearance.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search farmers by name..."
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold outline-none text-white placeholder:text-slate-500 transition-all shadow"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setExportConsentChecked(false);
                      setIsExportModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl border border-indigo-500/20 transition-all cursor-pointer shadow-lg shadow-indigo-600/15 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Directory</span>
                  </button>
                </div>
              </div>

              {/* Farmers Table */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/50 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="p-4 pl-6">Farmer Name</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4">Region</th>
                      <th className="p-4">Cohort</th>
                      <th className="p-4">Registration Date</th>
                      <th className="p-4 text-center">Activity Status</th>
                      <th className="p-4 text-center">Subscription</th>
                      <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmersList.filter(f => f.name.toLowerCase().includes(directorySearch.toLowerCase())).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-500">
                          No linked sponsoring farmers found matching the search criteria.
                        </td>
                      </tr>
                    ) : (
                      farmersList
                        .filter(f => f.name.toLowerCase().includes(directorySearch.toLowerCase()))
                        .map((f, idx) => (
                          <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-900/20 transition-all">
                            <td className="p-4 pl-6">
                              <div className="font-bold text-white">{f.name}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{f.email || "farmer@mabala.cloud"}</div>
                            </td>
                            <td className="p-4 font-mono text-slate-300">{f.phone || "N/A"}</td>
                            <td className="p-4 text-slate-400">{f.region || f.location || "N/A"}</td>
                            <td className="p-4">
                              <span className="bg-slate-900 border border-slate-800 text-indigo-300 font-semibold px-2.5 py-0.5 rounded-lg text-[10px]">
                                {f.cohort || f.cohortTag || "N/A"}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400">{f.registeredAt || f.registrationDate || "N/A"}</td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                                f.activityStatus === "Active" || f.activityStatus === "active"
                                  ? "bg-emerald-950 text-emerald-400 border-emerald-800/30"
                                  : "bg-slate-900 text-slate-500 border-slate-805/50"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${f.activityStatus === "Active" || f.activityStatus === "active" ? "bg-emerald-400" : "bg-slate-500"}`} />
                                {f.activityStatus || "Active"}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                                f.subscriptionStatus === "Active" || f.subscriptionStatus === "active"
                                  ? "bg-indigo-950 text-indigo-400 border-indigo-900/30"
                                  : "bg-amber-950 text-amber-400 border-amber-900/30"
                              }`}>
                                {f.subscriptionStatus || "Active"}
                              </span>
                            </td>
                            <td className="p-4 text-right pr-6">
                              <button
                                onClick={() => {
                                  const matched = dashboardData?.farmersDetails?.find((d: any) => d.id === f.id) || f;
                                  setSelectedFarmer(matched);
                                }}
                                className="bg-indigo-600/10 hover:bg-indigo-600/30 text-indigo-300 font-bold py-1.5 px-3.5 rounded-xl border border-indigo-500/20 transition-all cursor-pointer"
                              >
                                View Record
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Compliance Export Click-Through Modal */}
              {isExportModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 overflow-y-auto">
                  <div className="w-full max-w-lg bg-slate-950 border border-slate-800 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center bg-slate-900/80 border-b border-slate-800 p-6">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-950 border border-amber-900/50 px-2 py-0.5 rounded">
                          Security & Compliance Audit
                        </span>
                        <h3 className="text-lg font-black tracking-tight text-white">Export Farmer Directory</h3>
                      </div>
                      <button 
                        onClick={() => {
                          setIsExportModalOpen(false);
                          setExportConsentChecked(false);
                        }}
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-all cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5 text-xs">
                      <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                        <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider block">🛡️ GDPR / Data Protection notice</span>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                          By downloading this personal and agricultural registry data, you confirm that your organization has secured explicit consent from these farmers to store, process, and export their personal records. This action is recorded in the immutable Institution Audit Log for compliance under local data protection laws.
                        </p>
                      </div>

                      {/* Unlinking Warning Notice requested verbatim */}
                      <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold text-amber-400 block">⚠️ Security Policy Notice</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Exports already downloaded are not recalled if a farmer is later unlinked. Access unlinking acts to revoke access immediately going forward, but previous physical downloads remain in possession of the downloader.
                        </p>
                      </div>

                      {/* Format Selection */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Export Format</span>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setExportFormat("CSV")}
                            className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                              exportFormat === "CSV"
                                ? "bg-indigo-600/10 border-indigo-500 text-indigo-300"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            CSV Spreadsheet
                          </button>
                          <button
                            type="button"
                            onClick={() => setExportFormat("JSON")}
                            className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                              exportFormat === "JSON"
                                ? "bg-indigo-600/10 border-indigo-500 text-indigo-300"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            JSON Structure
                          </button>
                        </div>
                      </div>

                      {/* Consent Checkbox */}
                      <label className="flex items-start gap-3 bg-slate-900/30 p-3.5 rounded-xl border border-slate-850 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={exportConsentChecked}
                          onChange={(e) => setExportConsentChecked(e.target.checked)}
                          className="mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                        />
                        <div className="text-[11px] text-slate-300 leading-snug">
                          I confirm that our organization has valid active consent from these farmers to export their personal records.
                        </div>
                      </label>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-900/50 border-t border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportModalOpen(false);
                          setExportConsentChecked(false);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-2 px-5 rounded-xl text-xs transition-all border border-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!exportConsentChecked || isExporting}
                        onClick={handleExecuteExport}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isExporting ? "Exporting..." : "Execute Secure Export ➔"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Farmer Detail Modal */}
              {selectedFarmer && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
                  <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 animate-scale-up max-h-[90vh]">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center bg-slate-900/80 border-b border-slate-800 p-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-950 border border-indigo-900/50 px-2 py-0.5 rounded">
                            Disaggregated Farm Level Registry
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${
                            selectedFarmer.status === "active" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-slate-900 text-slate-400 border border-slate-800"
                          }`}>
                            Status: {selectedFarmer.status || "active"}
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold tracking-tight">{selectedFarmer.name}</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedFarmer(null)} 
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-all cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-6 overflow-y-auto space-y-6 text-xs">
                      
                      {/* Section 1: Demographics & Registration */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850 space-y-2">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Primary Demographics</span>
                          <div className="space-y-1">
                            <div className="flex justify-between"><span className="text-slate-400">Phone:</span><strong className="text-white">{selectedFarmer.phone || "N/A"}</strong></div>
                            <div className="flex justify-between"><span className="text-slate-400">Email:</span><strong className="text-white">{selectedFarmer.email || "N/A"}</strong></div>
                            <div className="flex justify-between"><span className="text-slate-400">Address:</span><strong className="text-white truncate max-w-[130px]">{selectedFarmer.address || "N/A"}</strong></div>
                          </div>
                        </div>

                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850 space-y-2">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Program Details</span>
                          <div className="space-y-1">
                            <div className="flex justify-between"><span className="text-slate-400">Cohort Tag:</span><strong className="text-indigo-400">{selectedFarmer.cohortTag || selectedFarmer.cohort || "None"}</strong></div>
                            <div className="flex justify-between"><span className="text-slate-400">Registered:</span><strong className="text-white">{selectedFarmer.registrationDate || "N/A"}</strong></div>
                            <div className="flex justify-between"><span className="text-slate-400">Authorized Roles:</span><strong className="text-white">{(selectedFarmer.roles || []).join(", ") || "Farmer"}</strong></div>
                          </div>
                        </div>

                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850 space-y-2">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Land & Telemetry</span>
                          <div className="space-y-1">
                            <div className="flex justify-between"><span className="text-slate-400">Farmed Acreage:</span><strong className="text-white">{Number(selectedFarmer.totalHectaresFarmed || 0).toFixed(2)} ha</strong></div>
                            <div className="flex justify-between"><span className="text-slate-400">Crop Cycles:</span><strong className="text-indigo-400">{selectedFarmer.activeCropCyclesCount || 0} active</strong></div>
                            <div className="flex justify-between"><span className="text-slate-400">Compliance:</span><strong className="text-emerald-400">Consenting Member</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Financial Aggregates */}
                      <div className="bg-slate-900/20 p-5 rounded-2xl border border-slate-800 space-y-3">
                        <h4 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Individual Economic Ledger</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                            <span className="text-[10px] text-slate-500 block uppercase">Farm Revenue</span>
                            <span className="text-base font-extrabold text-emerald-400">
                              {Number(selectedFarmer.revenue || 0).toLocaleString()} ZMW
                            </span>
                          </div>
                          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                            <span className="text-[10px] text-slate-500 block uppercase">Farm Expenses</span>
                            <span className="text-base font-extrabold text-rose-400">
                              {Number(selectedFarmer.expenses || 0).toLocaleString()} ZMW
                            </span>
                          </div>
                          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                            <span className="text-[10px] text-slate-500 block uppercase">Net Profit Margin</span>
                            <span className={`text-base font-extrabold ${Number(selectedFarmer.netIncome || 0) >= 0 ? "text-indigo-400" : "text-rose-400"}`}>
                              {Number(selectedFarmer.netIncome || 0).toLocaleString()} ZMW
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Livestock & Dairy production */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 space-y-4">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Dairy & Eggs Performance</span>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                              <span className="text-[9px] text-slate-500 block uppercase">Milk Output</span>
                              <strong className="text-white text-sm">{Number(selectedFarmer.milkProduced || 0).toLocaleString()} Liters</strong>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                              <span className="text-[9px] text-slate-500 block uppercase">Eggs Collected</span>
                              <strong className="text-white text-sm">{Number(selectedFarmer.eggsCollected || 0).toLocaleString()} Eggs</strong>
                            </div>
                          </div>
                          
                          <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-850">
                            <div className="flex justify-between"><span>Eggs Sold:</span><strong>{Number(selectedFarmer.eggsSold || 0).toLocaleString()}</strong></div>
                            <div className="flex justify-between"><span>Active Poultry Batches:</span><strong>{selectedFarmer.poultryBatchesCount || 0} batches</strong></div>
                            <div className="flex justify-between"><span>Total Livestock Registries:</span><strong>{selectedFarmer.livestockCount || 0} head</strong></div>
                          </div>
                        </div>

                        {/* Labor, Investments & Credit Pool */}
                        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 space-y-4">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Credit, Capital & Labor</span>
                          
                          <div className="space-y-2 text-[11px]">
                            <div className="flex justify-between pb-1 border-b border-slate-850">
                              <span className="text-slate-400">Total Farm Employees:</span>
                              <strong className="text-white">{selectedFarmer.staffCount || 0} Workers</strong>
                            </div>
                            <div className="flex justify-between pb-1 border-b border-slate-850">
                              <span className="text-slate-400">Total Capital Investments:</span>
                              <strong className="text-indigo-400">{Number(selectedFarmer.investmentsTotal || 0).toLocaleString()} ZMW</strong>
                            </div>
                            <div className="flex justify-between pb-1 border-b border-slate-850">
                              <span className="text-slate-400">Outstanding Credit:</span>
                              <strong className="text-amber-500">{Number(selectedFarmer.loansOutstanding || 0).toLocaleString()} ZMW</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Total Credit Limits Approved:</span>
                              <strong className="text-white">{Number(selectedFarmer.loansValue || 0).toLocaleString()} ZMW</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Agronomic Indexes & Marketplace */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Agronomic Crop Yields */}
                        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 space-y-3">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Individual Harvest Yields</span>
                          {!selectedFarmer.cropYields || Object.keys(selectedFarmer.cropYields).length === 0 ? (
                            <p className="text-slate-600 text-xs italic">No crop yields harvested yet.</p>
                          ) : (
                            Object.entries(selectedFarmer.cropYields).map(([crop, data]: any) => {
                              const avg = data.totalHectares > 0 ? (data.totalYield / data.totalHectares) : 0;
                              return (
                                <div key={crop} className="flex justify-between items-center py-1.5 border-b border-slate-850 last:border-0">
                                  <span className="text-slate-400 font-bold">{crop}</span>
                                  <span className="text-indigo-400 font-extrabold">{Number(avg).toFixed(1)} kg/ha ({Number(data.totalYield).toLocaleString()} kg)</span>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Offtaker Marketplace Sales */}
                        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 space-y-3">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Offtaker Marketplace Roster</span>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Direct Contract Volume:</span>
                              <strong className="text-white">{Number(selectedFarmer.offtakerActivity?.totalVolume || 0).toLocaleString()} units</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Direct Sales Value:</span>
                              <strong className="text-emerald-400">{Number(selectedFarmer.offtakerActivity?.totalValue || 0).toLocaleString()} ZMW</strong>
                            </div>
                          </div>
                          
                          {/* Commodity Sales lists */}
                          <div className="text-[10px] bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1 max-h-24 overflow-y-auto">
                            {(!selectedFarmer.offtakerActivity?.byProduct || Object.keys(selectedFarmer.offtakerActivity.byProduct).length === 0) ? (
                              <p className="text-slate-600 italic">No marketplace contract receipts found.</p>
                            ) : (
                              Object.entries(selectedFarmer.offtakerActivity.byProduct).map(([prod, d]: any) => (
                                <div key={prod} className="flex justify-between text-slate-400">
                                  <span>{prod} ({Number(d.volume).toLocaleString()} {d.unit}):</span>
                                  <strong className="text-white">{Number(d.value).toLocaleString()} ZMW</strong>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Footer Warning & Exit */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border-t border-slate-800 p-6 gap-4">
                      <div className="text-[10px] text-slate-500 max-w-md">
                        🔒 <strong>Privacy Protection:</strong> Operational write accesses are strictly disabled for sponsoring institutions. All detail tables are read-only reports.
                      </div>
                      <button 
                        onClick={() => setSelectedFarmer(null)} 
                        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all cursor-pointer border border-slate-700 text-center"
                      >
                        Close Roster Record
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {activeMenu === "sms" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-white">Bulk SMS Communications</h2>
                  <p className="text-slate-400 text-xs">
                    Broadcast personalized regional alerts, weather advisories, training updates, or general bulletins to selected agricultural stakeholders.
                  </p>
                </div>
                
                {/* Credit Balance Display & CTA */}
                <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between gap-6 w-full md:w-auto">
                  <div className="text-xs">
                    <span className="text-slate-500 block font-bold uppercase tracking-wider text-[9px]">Credit Balance</span>
                    <strong className="text-emerald-400 text-base font-black">
                      {billingData?.smsCreditBalance !== undefined ? billingData.smsCreditBalance : "—"}
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Rate: {billingData?.smsRateZmw || "0.90"} ZMW/SMS</span>
                  </div>
                  <button
                    onClick={() => {
                      setTopUpSuccess(false);
                      setShowTopUpRequest(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] uppercase tracking-wider font-extrabold py-2 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Request Top-Up
                  </button>
                </div>
              </div>

              {/* TOP UP REQUEST MODAL */}
              {showTopUpRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
                    <button
                      onClick={() => setShowTopUpRequest(false)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-white font-extrabold text-sm"
                    >
                      ✕
                    </button>
                    <h3 className="text-base font-black text-white">Request SMS Credits Top-Up</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Submit a credits top-up order. An invoice will be dispatched to your billing contact immediately.
                    </p>

                    {topUpSuccess ? (
                      <div className="bg-emerald-950/40 border border-emerald-900/50 p-4 rounded-2xl text-xs text-emerald-400 font-semibold space-y-1">
                        <p>✓ Top-up request submitted successfully!</p>
                        <p className="text-[10px] text-slate-400">Our support representatives are processing your allocation.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleRequestTopUp} className="space-y-4 pt-2">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Select Amount</label>
                          <select
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none"
                          >
                            <option value={1000}>1,000 Credits (900 ZMW)</option>
                            <option value={5000}>5,000 Credits (4,500 ZMW)</option>
                            <option value={10000}>10,000 Credits (9,000 ZMW)</option>
                            <option value={50000}>50,000 Credits (45,000 ZMW)</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmittingTopUp}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingTopUp ? "Submitting Request..." : "Confirm Top-Up Order"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* COMPOSER */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6 lg:col-span-7 shadow-xl space-y-5">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Compose & Schedule Broadcast</h3>
                  
                  <form onSubmit={handleSendSms} className="space-y-5">
                    
                    {/* Message input */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-400 block">
                          Broadcast Text Content
                        </label>
                        <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                          Token: {"{first_name}"}
                        </span>
                      </div>
                      <textarea
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        placeholder="Hello {first_name}, dynamic crop weather alert! Please inspect your fields..."
                        rows={5}
                        className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-2xl p-4 text-xs font-semibold outline-none text-white transition-all shadow-inner font-sans"
                      />
                      
                      {/* Character & Segment counter */}
                      <div className="flex flex-wrap justify-between text-[11px] text-slate-500 mt-1 gap-2">
                        <span>Characters: {smsMessage.length} | Parts: {calculateSmsParts(smsMessage)}</span>
                        <span>Multi-part limit: 153 chars/segment after 160</span>
                      </div>
                    </div>

                    {/* Cost Estimate Summary Card */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SMS Cost Estimation</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Recipients</span>
                          <strong className="text-white">{smsRecipients.length}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Parts / Recipient</span>
                          <strong className="text-white">{calculateSmsParts(smsMessage)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Rate per SMS</span>
                          <strong className="text-white">{billingData?.smsRateZmw || "0.90"} ZMW</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold text-indigo-400">Estimated Cost</span>
                          <strong className="text-indigo-400 font-black">
                            {(smsRecipients.length * calculateSmsParts(smsMessage) * Number(billingData?.smsRateZmw || 0.90)).toFixed(2)} ZMW
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Send Modes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Send Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSmsSendMode("immediate")}
                            className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                              smsSendMode === "immediate"
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                            }`}
                          >
                            Immediate
                          </button>
                          <button
                            type="button"
                            onClick={() => setSmsSendMode("scheduled")}
                            className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                              smsSendMode === "scheduled"
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                            }`}
                          >
                            Scheduled
                          </button>
                        </div>
                      </div>

                      {smsSendMode === "scheduled" && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Select Date & Time</label>
                          <input
                            type="datetime-local"
                            value={smsScheduledTime}
                            onChange={(e) => setSmsScheduledTime(e.target.value)}
                            required
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:border-indigo-500 outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Action Execution Button */}
                    <div className="border-t border-slate-800 pt-5">
                      {/* INSUFFICIENT CREDIT WARNING BLOCK */}
                      {billingData?.smsCreditBalance !== undefined &&
                      billingData.smsCreditBalance < (smsRecipients.length * calculateSmsParts(smsMessage)) ? (
                        <div className="bg-rose-950/40 border border-rose-900/40 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="text-xs space-y-1">
                            <strong className="text-rose-400 font-bold block">🚨 Insufficient SMS Credit Balance</strong>
                            <p className="text-slate-400 text-[11px]">
                              Required: {smsRecipients.length * calculateSmsParts(smsMessage)} parts, Available: {billingData.smsCreditBalance} credits.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTopUpSuccess(false);
                              setShowTopUpRequest(true);
                            }}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-5 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all w-full md:w-auto"
                          >
                            Request Top-Up
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="text-xs">
                            <span className="text-slate-400 block">Total Message Parts:</span>
                            <span className="font-extrabold text-white">
                              {smsRecipients.length * calculateSmsParts(smsMessage)} SMS parts
                            </span>
                          </div>

                          <button
                            type="submit"
                            disabled={isSendingSms || smsRecipients.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            {isSendingSms
                              ? "Dispatching..."
                              : smsSendMode === "scheduled"
                              ? "Schedule SMS Batch"
                              : "Dispatch SMS Batch"}
                          </button>
                        </div>
                      )}
                    </div>

                  </form>
                </div>

                {/* RECIPIENT MULTI-SELECTOR WITH FILTERS */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6 lg:col-span-5 shadow-xl flex flex-col h-[520px]">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Target Recipients Selection</h3>
                  
                  {/* OPT-OUT HANDLING NOTICE */}
                  {excludedOptOutCount > 0 && (
                    <div className="bg-amber-950/30 border border-amber-900/30 px-3 py-2 rounded-xl text-[10px] text-amber-400 font-medium mb-3">
                      ⚠️ {excludedOptOutCount} suppressed recipients automatically excluded (Opted Out via STOP reply).
                    </div>
                  )}

                  {/* Filter controls */}
                  <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-900/40 p-2.5 rounded-2xl border border-slate-850">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Role</span>
                      <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[10px] text-white w-full outline-none"
                      >
                        <option value="all">All Roles</option>
                        <option value="farmer">Farmer</option>
                        <option value="farm worker">Farm Worker</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Region</span>
                      <select
                        value={filterRegion}
                        onChange={(e) => setFilterRegion(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[10px] text-white w-full outline-none"
                      >
                        <option value="all">All Regions</option>
                        {Array.from(new Set(availableSmsRecipients.map(r => r.region || "Lusaka, Zambia"))).map(reg => (
                          <option key={reg} value={reg}>{reg}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Cohort</span>
                      <select
                        value={filterCohort}
                        onChange={(e) => setFilterCohort(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[10px] text-white w-full outline-none"
                      >
                        <option value="all">All Cohorts</option>
                        {Array.from(new Set(availableSmsRecipients.map(r => r.cohort || "N/A"))).map(co => (
                          <option key={co} value={co}>{co}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Crop Type</span>
                      <select
                        value={filterCrop}
                        onChange={(e) => setFilterCrop(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[10px] text-white w-full outline-none"
                      >
                        <option value="all">All Crops</option>
                        {Array.from(new Set(availableSmsRecipients.flatMap(r => Array.isArray(r.crops) ? r.crops : []))).map(cr => (
                          <option key={cr} value={cr}>{cr}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filter candidates and count */}
                  {(() => {
                    const filteredRecipients = availableSmsRecipients.filter(r => {
                      if (filterRole !== "all" && r.role !== filterRole) return false;
                      if (filterRegion !== "all" && r.region !== filterRegion) return false;
                      if (filterCohort !== "all" && r.cohort !== filterCohort) return false;
                      if (filterCrop !== "all" && (!Array.isArray(r.crops) || !r.crops.includes(filterCrop))) return false;
                      return true;
                    });

                    return (
                      <>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[11px] text-slate-400 font-bold">
                            Matches: {filteredRecipients.length} participants
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSmsRecipients(filteredRecipients.map(f => f.id))}
                              className="text-[9px] bg-slate-900 hover:bg-slate-850 border border-slate-800 px-2 py-1 rounded-lg text-slate-300 font-bold cursor-pointer"
                            >
                              Select Matches
                            </button>
                            <button
                              type="button"
                              onClick={() => setSmsRecipients([])}
                              className="text-[9px] bg-slate-900 hover:bg-slate-850 border border-slate-800 px-2 py-1 rounded-lg text-slate-300 font-bold cursor-pointer"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>

                        {/* List display */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                          {filteredRecipients.length === 0 ? (
                            <p className="text-slate-500 text-xs italic text-center py-12 border border-dashed border-slate-850 rounded-2xl">
                              No matched candidates in scope.
                            </p>
                          ) : (
                            filteredRecipients.map((f) => {
                              const isChecked = smsRecipients.includes(f.id);
                              return (
                                <label
                                  key={f.id}
                                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border transition-all text-xs ${
                                    isChecked
                                      ? "bg-indigo-950/20 border-indigo-800/40 hover:bg-indigo-950/30"
                                      : "bg-slate-900/40 hover:bg-slate-900/80 border-slate-850"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSmsRecipients(smsRecipients.filter(id => id !== f.id));
                                      } else {
                                        setSmsRecipients([...smsRecipients, f.id]);
                                      }
                                    }}
                                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-extrabold text-white truncate">{f.name}</span>
                                      <span className="text-[8px] uppercase px-1.5 py-0.5 rounded-full font-bold bg-slate-900 border border-slate-800 text-slate-400">
                                        {f.role}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{f.phone}</p>
                                    <div className="flex flex-wrap gap-1 mt-1 text-[8px] font-bold text-slate-400">
                                      <span className="bg-slate-950 px-1 py-0.2 rounded">{f.region}</span>
                                      {f.cohort && f.cohort !== "N/A" && (
                                        <span className="bg-slate-950 px-1 py-0.2 rounded">Cohort: {f.cohort}</span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </>
                    );
                  })()}

                </div>

              </div>

              {/* SECTION: BATCH HISTORY & COMPREHENSIVE DELIVERY REPORTS */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">SMS Broadcast History</h3>
                    <p className="text-slate-400 text-xs">Verify transmission statuses, delivery rate metrics, and access per-recipient delivery report exports.</p>
                  </div>
                </div>

                {smsBatches.length === 0 ? (
                  <p className="text-slate-500 text-xs italic text-center py-12">No communication batches sent yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                          <th className="pb-3">Batch ID / Timestamp</th>
                          <th className="pb-3 text-center">Recipients</th>
                          <th className="pb-3 text-center">SMS Parts</th>
                          <th className="pb-3 text-right">Cost (ZMW)</th>
                          <th className="pb-3 text-center">Send Mode</th>
                          <th className="pb-3 text-center">Active Gateway</th>
                          <th className="pb-3 text-center">Status</th>
                          <th className="pb-3 text-right">Report</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 font-medium">
                        {smsBatches.map((batch) => (
                          <tr key={batch.id} className="hover:bg-slate-900/30 text-slate-300">
                            <td className="py-3">
                              <span className="text-white font-extrabold block">{batch.id}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(batch.timestamp || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 text-center text-white font-bold">
                              {batch.total_recipients || 0}
                            </td>
                            <td className="py-3 text-center">
                              {batch.total_parts || 0} parts
                            </td>
                            <td className="py-3 text-right font-mono text-emerald-400">
                              {Number(batch.total_cost || 0).toFixed(2)} ZMW
                            </td>
                            <td className="py-3 text-center text-[10px]">
                              {batch.send_mode === "scheduled" ? (
                                <span className="bg-amber-950/40 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded-full font-bold">
                                  Scheduled
                                </span>
                              ) : (
                                <span className="bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                                  Immediate
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-center font-bold text-indigo-400">
                              {batch.processed_gateway || "N/A"}
                            </td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                batch.status === "sent" || batch.status === "delivered"
                                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                                  : batch.status === "scheduled"
                                  ? "bg-amber-950/40 text-amber-400 border border-amber-900/30"
                                  : "bg-rose-950/40 text-rose-400 border border-rose-900/30"
                              }`}>
                                {batch.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleViewBatchDetails(batch.id)}
                                className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[10px] font-bold py-1 px-3 rounded-lg border border-indigo-800/30 transition-all cursor-pointer"
                              >
                                View Report
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* DETAILED DRILL DOWN REPORT MODAL */}
              {selectedBatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl relative flex flex-col max-h-[85vh] space-y-5">
                    <button
                      onClick={() => setSelectedBatch(null)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-white font-black text-sm"
                    >
                      ✕
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-black text-white">Batch Delivery Report: {selectedBatch.id}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            selectedBatch.status === "sent"
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                              : "bg-rose-950/40 text-rose-400 border border-rose-900/30"
                          }`}>
                            {selectedBatch.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">Dispatched on: {new Date(selectedBatch.timestamp).toLocaleString()} | Gateway: {selectedBatch.processed_gateway}</p>
                      </div>

                      {/* EXPORT REPORT CTA */}
                      <button
                        onClick={() => handleDownloadCsv(selectedBatch, batchMessages)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV Report
                      </button>
                    </div>

                    {/* STATS OVERVIEW CARDS */}
                    {batchSummary && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">Delivery Rate</span>
                          <strong className="text-white text-base font-extrabold">{batchSummary.deliveryRate}%</strong>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">Total SMS</span>
                          <strong className="text-white text-base font-extrabold">{batchSummary.total}</strong>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">Sent / Delivered</span>
                          <strong className="text-emerald-400 text-base font-extrabold">{batchSummary.sent + batchSummary.delivered}</strong>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">Failed</span>
                          <strong className="text-rose-400 text-base font-extrabold">{batchSummary.failed}</strong>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">Pending</span>
                          <strong className="text-slate-400 text-base font-extrabold">{batchSummary.pending}</strong>
                        </div>
                      </div>
                    )}

                    {/* MESSAGES LIST TABLE */}
                    <div className="flex-1 overflow-y-auto pr-1">
                      {isLoadingSmsDetails ? (
                        <p className="text-slate-500 text-xs italic text-center py-12">Loading delivery logs...</p>
                      ) : batchMessages.length === 0 ? (
                        <p className="text-slate-500 text-xs italic text-center py-12">No individual messages found for this batch.</p>
                      ) : (
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[8px] tracking-wider">
                              <th className="pb-2">Recipient</th>
                              <th className="pb-2">Phone Number</th>
                              <th className="pb-2">Message Body Preview</th>
                              <th className="pb-2 text-center">Parts</th>
                              <th className="pb-2 text-center">Status</th>
                              <th className="pb-2 text-right">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900 font-medium text-slate-300">
                            {batchMessages.map((m) => (
                              <tr key={m.id} className="hover:bg-slate-900/20">
                                <td className="py-2.5 text-white font-bold">{m.recipient_name || "N/A"}</td>
                                <td className="py-2.5 font-mono">{m.recipient_phone}</td>
                                <td className="py-2.5 max-w-xs truncate text-slate-400" title={m.personalized_message}>
                                  {m.personalized_message}
                                </td>
                                <td className="py-2.5 text-center">{m.parts || 1}</td>
                                <td className="py-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                                    m.status === "sent" || m.status === "delivered"
                                      ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                                      : m.status === "failed"
                                      ? "bg-rose-950/40 text-rose-400 border border-rose-900/30"
                                      : "bg-slate-900 text-slate-400"
                                  }`}>
                                    {m.status}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-bold text-rose-400 text-[10px]">
                                  {m.error_message || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div className="border-t border-slate-900 pt-4 flex justify-between items-center text-[10px] text-slate-500">
                      <span>🔒 Complete real-time logging sync via selected active gateways.</span>
                      <button
                        onClick={() => setSelectedBatch(null)}
                        className="bg-slate-900 hover:bg-slate-850 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-all border border-slate-800 cursor-pointer"
                      >
                        Close Report
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {activeMenu === "reports" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-800 pb-6">
                <h2 className="text-xl font-black text-white font-sans tracking-tight">Reports & Export Center</h2>
                <p className="text-slate-400 text-xs">
                  Compile, inspect, and export compiled regional yields, livestock distribution charts, and demographic aggregates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reportsList.map((rep, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-900/30 px-2.5 py-0.5 rounded-full font-bold">
                          {rep.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{rep.date}</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-white leading-snug">{rep.name}</h3>
                      <p className="text-[11px] text-slate-400">
                        Pre-compiled regional statistics and consent audit documentation.
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-900 text-xs">
                      <span className="text-slate-500 font-mono">{rep.size} ({rep.type})</span>
                      <button 
                        onClick={() => {
                          setSuccessMessage(`Preparing download for "${rep.name}"... Export compiled successfully.`);
                          setTimeout(() => setSuccessMessage(null), 3000);
                        }}
                        className="text-indigo-400 hover:text-white font-bold transition-all cursor-pointer"
                      >
                        Download File ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === "subusers" && isUserAdmin && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-800 pb-6">
                <h2 className="text-xl font-black text-white">Staff Sub-User Management</h2>
                <p className="text-slate-400 text-xs">
                  Onboard program officers or field assistants, assign them access to specific farmer scopes, and manage their system permissions.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Onboard form */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-white">Onboard Staff Member</h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">Register a new sub-user and customize their authorization scope.</p>
                  </div>

                  <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 outline-none text-white focus:border-indigo-500"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 outline-none text-white focus:border-indigo-500"
                        placeholder="staff@sponsor.org"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 outline-none text-white focus:border-indigo-500"
                        placeholder="+260 978 123456"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Account Password</label>
                      <input
                        type="password"
                        required
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 outline-none text-white focus:border-indigo-500"
                        placeholder="••••••••"
                      />
                    </div>

                    {/* Scope Assignment Selector */}
                    <div className="space-y-2 pt-2 border-t border-slate-900">
                      <label className="text-slate-400 font-bold block">Assigned Scope Assignment</label>
                      
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <label className="flex items-center gap-2 p-2 bg-slate-900/60 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900">
                          <input
                            type="radio"
                            name="scopeType"
                            checked={newStaffScopeType === "all"}
                            onChange={() => setNewStaffScopeType("all")}
                            className="text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
                          />
                          <span className="text-slate-300">All Linked Farmers</span>
                        </label>

                        <label className="flex items-center gap-2 p-2 bg-slate-900/60 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900">
                          <input
                            type="radio"
                            name="scopeType"
                            checked={newStaffScopeType === "region"}
                            onChange={() => setNewStaffScopeType("region")}
                            className="text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
                          />
                          <span className="text-slate-300">By Region</span>
                        </label>

                        <label className="flex items-center gap-2 p-2 bg-slate-900/60 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900">
                          <input
                            type="radio"
                            name="scopeType"
                            checked={newStaffScopeType === "cohort"}
                            onChange={() => setNewStaffScopeType("cohort")}
                            className="text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
                          />
                          <span className="text-slate-300">By Cohort Tag</span>
                        </label>

                        <label className="flex items-center gap-2 p-2 bg-slate-900/60 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900">
                          <input
                            type="radio"
                            name="scopeType"
                            checked={newStaffScopeType === "farmers"}
                            onChange={() => setNewStaffScopeType("farmers")}
                            className="text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
                          />
                          <span className="text-slate-300">Specific Farmers</span>
                        </label>
                      </div>

                      {/* Conditional Scope Input fields */}
                      {newStaffScopeType === "region" && (
                        <div className="pt-1.5 animate-fade-in">
                          <label className="text-slate-400 block mb-1">Region Name Filters</label>
                          <input
                            type="text"
                            required
                            value={newStaffScopeValue}
                            onChange={(e) => setNewStaffScopeValue(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 outline-none text-white focus:border-indigo-500"
                            placeholder="e.g. Lusaka, Central"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            Only resolves farmers whose location/address contains this term.
                          </p>
                        </div>
                      )}

                      {newStaffScopeType === "cohort" && (
                        <div className="pt-1.5 animate-fade-in">
                          <label className="text-slate-400 block mb-1">Cohort Tag Name</label>
                          <input
                            type="text"
                            required
                            value={newStaffScopeValue}
                            onChange={(e) => setNewStaffScopeValue(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 outline-none text-white focus:border-indigo-500"
                            placeholder="e.g. Coop-Alpha"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            Only resolves farmers whose registered cohort matches this tag.
                          </p>
                        </div>
                      )}

                      {newStaffScopeType === "farmers" && (
                        <div className="pt-1.5 space-y-1.5 animate-fade-in">
                          <div className="flex justify-between items-center">
                            <label className="text-slate-400 block">Select Farmers ({newStaffScope.length} selected)</label>
                            <span className="text-[10px] text-indigo-400 font-mono">My Farmers Base</span>
                          </div>
                          
                          <input
                            type="text"
                            value={farmerSearchQuery}
                            onChange={(e) => setFarmerSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 outline-none text-white text-[11px] focus:border-indigo-500"
                            placeholder="Search linked farmers..."
                          />

                          <div className="overflow-y-auto max-h-36 space-y-1.5 border border-slate-800 p-2 rounded-xl bg-slate-900/60">
                            {farmersList
                              .filter(f => !farmerSearchQuery || f.name.toLowerCase().includes(farmerSearchQuery.toLowerCase()))
                              .map((f, idx) => (
                                <label key={idx} className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-slate-900 p-1 rounded">
                                  <input
                                    type="checkbox"
                                    checked={newStaffScope.includes(f.id)}
                                    onChange={() => {
                                      if (newStaffScope.includes(f.id)) {
                                        setNewStaffScope(newStaffScope.filter(id => id !== f.id));
                                      } else {
                                        setNewStaffScope([...newStaffScope, f.id]);
                                      }
                                    }}
                                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                                  />
                                  <span className="truncate text-slate-300">{f.name}</span>
                                </label>
                              ))}
                            {farmersList.filter(f => !farmerSearchQuery || f.name.toLowerCase().includes(farmerSearchQuery.toLowerCase())).length === 0 && (
                              <p className="text-[10px] text-slate-500 text-center py-2">No matching linked farmers found.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Permissions Toggles */}
                    <div className="space-y-2 pt-3 border-t border-slate-900">
                      <label className="text-slate-400 font-bold block">Action Permissions</label>
                      <div className="grid grid-cols-1 gap-1.5 bg-slate-900/40 border border-slate-800 rounded-xl p-2.5 space-y-0.5">
                        <label className="flex items-center justify-between text-[11px] cursor-pointer text-slate-300 hover:text-white">
                          <span>View Impact Dashboard</span>
                          <input
                            type="checkbox"
                            checked={newStaffPermissions.view_dashboard}
                            onChange={(e) => setNewStaffPermissions({ ...newStaffPermissions, view_dashboard: e.target.checked })}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                          />
                        </label>
                        <label className="flex items-center justify-between text-[11px] cursor-pointer text-slate-300 hover:text-white">
                          <span>View Reports & Export Center</span>
                          <input
                            type="checkbox"
                            checked={newStaffPermissions.view_reports}
                            onChange={(e) => setNewStaffPermissions({ ...newStaffPermissions, view_reports: e.target.checked })}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                          />
                        </label>
                        <label className="flex items-center justify-between text-[11px] cursor-pointer text-slate-300 hover:text-white">
                          <span>Export Data & CSVs</span>
                          <input
                            type="checkbox"
                            checked={newStaffPermissions.export_data}
                            onChange={(e) => setNewStaffPermissions({ ...newStaffPermissions, export_data: e.target.checked })}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                          />
                        </label>
                        <label className="flex items-center justify-between text-[11px] cursor-pointer text-slate-300 hover:text-white">
                          <span>Send Bulk SMS Campaigns</span>
                          <input
                            type="checkbox"
                            checked={newStaffPermissions.send_sms}
                            onChange={(e) => setNewStaffPermissions({ ...newStaffPermissions, send_sms: e.target.checked })}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingStaff}
                      className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-md mt-4 cursor-pointer"
                    >
                      {isCreatingStaff ? "Onboarding Staff..." : "Create Staff Account"}
                    </button>
                  </form>
                </div>

                {/* Sub users list */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 lg:col-span-2 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-white">Active Sponsoring Staff</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Manage credentials, permissions, and log actions for sub-users.</p>
                    </div>
                    <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-xl font-mono">
                      {subUsersList.length} registered
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {subUsersList.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl">
                        <p className="text-slate-500 text-xs">
                          No active program officers registered. Use the onboard panel to register field staff.
                        </p>
                      </div>
                    ) : (
                      subUsersList.map((user, idx) => (
                        <div key={idx} className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4 text-xs transition-all hover:border-slate-700">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-white text-sm truncate">{user.name}</h4>
                                <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                  {user.role || "Staff"}
                                </span>
                                {user.status === "deactivated" ? (
                                  <span className="text-[9px] bg-rose-950/40 text-rose-300 border border-rose-900/40 px-2 py-0.5 rounded-full font-bold">
                                    Deactivated
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 px-2 py-0.5 rounded-full font-bold">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 font-mono text-[11px]">{user.email}</p>
                              {user.phone && <p className="text-slate-500 text-[10px]">{user.phone}</p>}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Deactivate/Reactivate toggle */}
                              <button
                                onClick={() => handleToggleUserStatus(user)}
                                className={`px-2.5 py-1.5 rounded-xl border font-bold text-[10px] transition-all cursor-pointer ${
                                  user.status === "deactivated"
                                    ? "bg-emerald-950/20 hover:bg-emerald-950/60 text-emerald-300 border-emerald-900/30"
                                    : "bg-amber-950/20 hover:bg-amber-950/60 text-amber-300 border-amber-900/30"
                                }`}
                              >
                                {user.status === "deactivated" ? "Reactivate" : "Deactivate"}
                              </button>

                              {/* Delete permanently */}
                              <button
                                onClick={() => handleRevokeStaff(user.id)}
                                className="bg-rose-950/20 hover:bg-rose-950/60 text-rose-300 font-bold py-1.5 px-2.5 rounded-xl border border-rose-900/30 transition-all cursor-pointer"
                                title="Delete Permanently"
                              >
                                Revoke
                              </button>
                            </div>
                          </div>

                          {/* Scope & Permissions visualization */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-900 text-[11px]">
                            <div className="space-y-1">
                              <span className="text-slate-500 font-bold block">Assigned Scope Limit</span>
                              <div className="text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-900 font-mono">
                                <p className="font-semibold text-indigo-300 capitalize">
                                  Type: {user.scopeType || "farmers"}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                  Resolves to: {Array.isArray(user.assignedFarmers) ? user.assignedFarmers.length : 0} linked farmers
                                </p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-slate-500 font-bold block">System Permissions</span>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(user.permissions || { view_dashboard: true, view_reports: true, export_data: true, send_sms: true }).map(([perm, val]) => (
                                  <span
                                    key={perm}
                                    className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                                      val
                                        ? "bg-slate-900 text-slate-300 border-slate-800"
                                        : "bg-slate-950 text-slate-600 border-transparent line-through"
                                    }`}
                                  >
                                    {perm.replace("_", " ")}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Sub-user Activity Log query action */}
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => handleFetchLogs(user)}
                              disabled={isFetchingLogs}
                              className="text-indigo-400 hover:text-indigo-300 text-[11px] font-bold flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
                            >
                              <span>View Activity Logs</span>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Activity Logs Slide-over or overlay */}
              {selectedSubUserLogs !== null && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50 animate-fade-in">
                  <div className="bg-slate-950 w-full max-w-lg h-full border-l border-slate-800 p-6 flex flex-col shadow-2xl justify-between animate-slide-left">
                    <div className="space-y-5 flex-1 min-h-0 flex flex-col">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                        <div>
                          <h3 className="text-md font-bold text-white">Activity Logs: {selectedSubUserNameForLogs}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">Audit actions executed by this staff member</p>
                        </div>
                        <button
                          onClick={() => setSelectedSubUserLogs(null)}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-400 p-2 rounded-xl border border-slate-800 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
                        {selectedSubUserLogs.length === 0 ? (
                          <div className="text-center py-12 border border-dashed border-slate-900 rounded-3xl">
                            <p className="text-slate-600 text-xs">No logged actions recorded for this sub-user.</p>
                          </div>
                        ) : (
                          selectedSubUserLogs.map((log, lIdx) => (
                            <div key={lIdx} className="p-3 bg-slate-900/60 border border-slate-800/60 rounded-xl space-y-1.5 text-[11px]">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-indigo-400 capitalize font-mono text-[10px]">
                                  {log.actionType?.replace("_", " ")}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-slate-300">{log.details}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-900 pt-4 mt-4 flex justify-end">
                      <button
                        onClick={() => setSelectedSubUserLogs(null)}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-2 px-5 rounded-xl border border-slate-800 cursor-pointer text-xs"
                      >
                        Close Logs
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMenu === "billing" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-800 pb-6">
                <h2 className="text-xl font-black text-white">Billing & SMS Account balance</h2>
                <p className="text-slate-400 text-xs">
                  Inspect SMS credit balance, current per-message rates, and official SaaS license invoicing logs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">SMS Credit Balance</span>
                    <div className="text-4xl font-extrabold text-white mt-2">
                      {billingData?.smsCreditBalance || 0}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Each recipient consumes 1 credit. Send limit is dynamically checked on every bulk dispatch.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-900">
                    <button 
                      onClick={() => {
                        setSuccessMessage("Your top-up request has been filed. An official ZMW payment invoice will be dispatched to your billing email shortly.");
                        setTimeout(() => setSuccessMessage(null), 5000);
                      }}
                      className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Purchase SMS Pack
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Current SMS Rate</span>
                    <div className="text-4xl font-extrabold text-white mt-2">
                      {billingData?.smsRateZmw || "0.90"} <span className="text-xs text-slate-400">ZMW/msg</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Sponsor package flat-rate standard. Rates are tax-exclusive and sync with Lipila gateways.
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Service provider: Lipila & Beem
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Licensing Tier</span>
                    <div className="text-xl font-extrabold text-indigo-400 mt-2">
                      Enterprise Sponsor Core
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Annual recurring corporate license. Allows unlimited staff seats and custom branding profiles.
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Renewal date: 2027-01-10
                  </div>
                </div>

              </div>

              {/* Invoices List */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-4">Official Invoicing Log</h3>
                
                <div className="space-y-3">
                  {(billingData?.invoices || []).map((inv: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex justify-between items-center gap-4 text-xs">
                      <div>
                        <div className="font-extrabold text-white">{inv.description}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{inv.id} — Issued {inv.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white">{inv.amount} {inv.currency}</div>
                        <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded-full font-bold">
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeMenu === "settings" && isUserAdmin && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-800 pb-6">
                <h2 className="text-xl font-black text-white">Co-Branding & Institutional Configurations</h2>
                <p className="text-slate-400 text-xs">
                  Manage organization names, portal logos, co-branding options, and multi-sponsor attachments.
                </p>
              </div>

              <div className="max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Sponsoring Organisation Name</label>
                    <input
                      type="text"
                      required
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 outline-none text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Company Logo URI / Icon Reference</label>
                    <input
                      type="text"
                      value={settingsLogo}
                      onChange={(e) => setSettingsLogo(e.target.value)}
                      placeholder="e.g. NGO, USAID, UN, Care International"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 outline-none text-white text-xs"
                    />
                  </div>

                  <div className="border-t border-slate-800 pt-4 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsCoBranding}
                        onChange={(e) => setSettingsCoBranding(e.target.checked)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-white block">Enable Client Portal Co-Branding</span>
                        <span className="text-[11px] text-slate-400">
                          If active, consenting farmers see your corporate colors and logo in their profiles.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsAllowMulti}
                        onChange={(e) => setSettingsAllowMulti(e.target.checked)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-white block">Allow Multi-Sponsor Attachments</span>
                        <span className="text-[11px] text-slate-400">
                          If disabled, program farmers linked to this organisation cannot self-attach to other organizations.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="border-t border-slate-800 pt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      {isSavingSettings ? "Saving Settings..." : "Save Configuration"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
