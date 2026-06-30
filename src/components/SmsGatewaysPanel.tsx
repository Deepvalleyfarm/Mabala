import React, { useState, useEffect } from "react";
import { 
  Server, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  ChevronRight, 
  Globe, 
  ShieldAlert, 
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Search,
  Calendar,
  Save,
  Check,
  AlertCircle
} from "lucide-react";

interface Gateway {
  id: string;
  provider_name?: string;
  name?: string;
  base_url?: string;
  api_key?: string;
  sender_id?: string;
  account_username?: string;
  route_channel?: string;
  extra_params?: Record<string, string>;
  priority_order?: number;
  status?: string;
  last_tested_at?: string;
  last_test_result?: string;
}

interface Override {
  institutionId: string;
  name: string;
  smsRateZmw: number | null;
  effectiveDate: string | null;
  hasOverride: boolean;
}

export default function SmsGatewaysPanel() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalPrice, setGlobalPrice] = useState<number>(0.90);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  
  // UI states
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);
  const [extraParamsList, setExtraParamsList] = useState<{ key: string; value: string }[]>([]);
  const [isReplacingKey, setIsReplacingKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Connection testing states
  const [testingGatewayId, setTestingGatewayId] = useState<string | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; rawResponse?: string } | null>(null);
  const [showTestModal, setShowTestModal] = useState<string | null>(null); // Gateway ID

  // Pricing form states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstId, setSelectedInstId] = useState("");
  const [overridePrice, setOverridePrice] = useState("");
  const [overrideDate, setOverrideDate] = useState("");
  const [pricingMsg, setPricingMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchGateways();
    fetchPricing();
    fetchInstitutions();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sms/gateways");
      const data = await res.json();
      if (data.success) {
        setGateways(data.gateways || []);
      }
    } catch (err) {
      console.error("Failed to fetch gateways:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricing = async () => {
    try {
      const res = await fetch("/api/admin/sms/pricing");
      const data = await res.json();
      if (data.success) {
        setGlobalPrice(data.global_price_per_sms || 0.90);
        setOverrides(data.overrides || []);
      }
    } catch (err) {
      console.error("Failed to fetch pricing:", err);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await fetch("/api/admin/institutions");
      const data = await res.json();
      if (data.success) {
        setInstitutions(data.institutions || []);
      }
    } catch (err) {
      console.error("Failed to fetch institutions:", err);
    }
  };

  const handleToggleStatus = async (gw: Gateway) => {
    const newStatus = gw.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch("/api/admin/sms/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: gw.id,
          provider_name: gw.provider_name || gw.name,
          base_url: gw.base_url,
          api_key: "••••", // Retain masked key
          sender_id: gw.sender_id,
          account_username: gw.account_username,
          route_channel: gw.route_channel,
          extra_params: gw.extra_params,
          priority_order: gw.priority_order,
          status: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchGateways();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdatePriority = async (gw: Gateway, priority: number) => {
    try {
      await fetch("/api/admin/sms/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: gw.id,
          provider_name: gw.provider_name || gw.name,
          base_url: gw.base_url,
          api_key: "••••", // Retain masked
          sender_id: gw.sender_id,
          account_username: gw.account_username,
          route_channel: gw.route_channel,
          extra_params: gw.extra_params,
          priority_order: priority,
          status: gw.status
        })
      });
      fetchGateways();
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  const handleOpenEdit = (gw: Gateway) => {
    setEditingGateway(gw);
    setIsReplacingKey(false);
    // Convert Record<string, string> to array of key-value pairs
    if (gw.extra_params) {
      const arr = Object.keys(gw.extra_params).map(k => ({
        key: k,
        value: gw.extra_params![k] || ""
      }));
      setExtraParamsList(arr);
    } else {
      setExtraParamsList([]);
    }
  };

  const handleAddExtraParam = () => {
    setExtraParamsList([...extraParamsList, { key: "", value: "" }]);
  };

  const handleRemoveExtraParam = (index: number) => {
    setExtraParamsList(extraParamsList.filter((_, idx) => idx !== index));
  };

  const handleSaveGateway = async () => {
    if (!editingGateway) return;
    setIsSaving(true);
    
    // Build extra_params object
    const finalExtra: Record<string, string> = {};
    extraParamsList.forEach(item => {
      if (item.key.trim()) {
        finalExtra[item.key.trim()] = item.value;
      }
    });

    try {
      const payload = {
        id: editingGateway.id,
        provider_name: editingGateway.provider_name || editingGateway.name,
        base_url: editingGateway.base_url,
        api_key: isReplacingKey ? editingGateway.api_key : "••••", // If replacing, send new value, else retain
        sender_id: editingGateway.sender_id,
        account_username: editingGateway.account_username,
        route_channel: editingGateway.route_channel,
        extra_params: finalExtra,
        priority_order: editingGateway.priority_order,
        status: editingGateway.status
      };

      const res = await fetch("/api/admin/sms/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setEditingGateway(null);
        fetchGateways();
      }
    } catch (err) {
      console.error("Failed to save gateway:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunTest = async () => {
    if (!showTestModal || !testPhoneNumber.trim()) return;
    setTestingGatewayId(showTestModal);
    setTestResult(null);

    try {
      const res = await fetch(`/api/admin/sms/gateways/${showTestModal}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: testPhoneNumber,
          provider_name: gateways.find(g => g.id === showTestModal)?.provider_name || showTestModal
        })
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || "Test execution complete.",
        rawResponse: data.rawResponse
      });
      fetchGateways(); // reload testing logs
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to initiate test connection."
      });
    } finally {
      setTestingGatewayId(null);
    }
  };

  const handleSaveGlobalPrice = async () => {
    setPricingMsg(null);
    try {
      const res = await fetch("/api/admin/sms/pricing/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_per_sms: globalPrice })
      });
      const data = await res.json();
      if (data.success) {
        setPricingMsg({ type: "success", text: data.message });
        fetchPricing();
      } else {
        setPricingMsg({ type: "error", text: data.error || "Failed to update global price" });
      }
    } catch (err: any) {
      setPricingMsg({ type: "error", text: err.message });
    }
  };

  const handleSaveOverride = async () => {
    setPricingMsg(null);
    if (!selectedInstId || !overridePrice) {
      setPricingMsg({ type: "error", text: "Please select an institution and specify the rate." });
      return;
    }
    try {
      const res = await fetch("/api/admin/sms/pricing/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId: selectedInstId,
          price_per_sms: parseFloat(overridePrice),
          effective_date: overrideDate || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setPricingMsg({ type: "success", text: "Override configured successfully." });
        setSelectedInstId("");
        setOverridePrice("");
        setOverrideDate("");
        fetchPricing();
      } else {
        setPricingMsg({ type: "error", text: data.error || "Failed to configure override" });
      }
    } catch (err: any) {
      setPricingMsg({ type: "error", text: err.message });
    }
  };

  const handleCreateNewGateway = () => {
    const newId = `generic_${Date.now().toString().slice(-4)}`;
    setEditingGateway({
      id: newId,
      provider_name: "New SMS Gateway",
      base_url: "",
      api_key: "",
      sender_id: "",
      account_username: "",
      route_channel: "",
      extra_params: {},
      priority_order: (gateways.length + 1),
      status: "inactive"
    });
    setExtraParamsList([]);
    setIsReplacingKey(true);
  };

  // Filter institutions based on search query
  const filteredInsts = institutions.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* SECTION Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block mb-1 font-mono">System Gateway Registry</span>
          <h2 className="text-2xl font-black tracking-tight">SMS Gateway Configurations</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">Configure failover providers, encrypt secret keys, test connectivity and define granular country rate overrides.</p>
        </div>
        <button
          onClick={handleCreateNewGateway}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Custom Gateway
        </button>
      </div>

      {/* Grid: Gateway List & Pricing Config */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Col (span 2): Gateway Registry List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-wider mb-4 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-indigo-500" /> Active Failover Sequence
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span className="text-xs font-bold font-mono">Loading gateways...</span>
              </div>
            ) : gateways.length === 0 ? (
              <p className="text-xs font-medium text-slate-500 py-6 text-center">No gateways registered. Add a custom gateway or click reset.</p>
            ) : (
              <div className="space-y-4">
                {gateways.map((gw, index) => (
                  <div 
                    key={gw.id} 
                    className="border border-slate-100 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono text-[10px] font-black rounded-lg">
                          #{gw.priority_order || index + 1}
                        </span>
                        <h4 className="text-sm font-black text-slate-800">{gw.provider_name || gw.name || "Custom Provider"}</h4>
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${
                          gw.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-500"
                        }`}>
                          {gw.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 max-w-md truncate">
                        {gw.base_url || "Built-in SDK Handler"}
                      </p>
                      
                      {gw.last_tested_at && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1">
                          <span className="font-semibold">Last tested:</span>
                          <span className="font-mono text-slate-700">{new Date(gw.last_tested_at).toLocaleString()}</span>
                          <span className={`inline-flex items-center gap-0.5 ml-1.5 font-bold ${
                            gw.last_test_result?.startsWith("Passed") ? "text-emerald-600" : "text-amber-600"
                          }`}>
                            {gw.last_test_result?.startsWith("Passed") ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                            {gw.last_test_result?.split(" (Resp:")[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Priority adjustment */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Order</span>
                        <input
                          type="number"
                          value={gw.priority_order || 0}
                          onChange={(e) => handleUpdatePriority(gw, parseInt(e.target.value) || 1)}
                          className="w-12 h-8 px-1.5 text-center bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:outline-indigo-500"
                          min="1"
                        />
                      </div>

                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggleStatus(gw)}
                        className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                        title={gw.status === "active" ? "Deactivate Gateway" : "Activate Gateway"}
                      >
                        {gw.status === "active" ? (
                          <ToggleRight className="w-8 h-8 text-indigo-600" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-300" />
                        )}
                      </button>

                      <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                        <button
                          onClick={() => {
                            setTestResult(null);
                            setTestPhoneNumber("");
                            setShowTestModal(gw.id);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Test
                        </button>

                        <button
                          onClick={() => handleOpenEdit(gw)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" /> Config
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col (span 1): Global & Granular Overrides */}
        <div className="space-y-6">
          
          {/* Global pricing set */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" /> Global Price Setting
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Standard baseline rate per message part when no tenant overrides exist.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Baseline Rate (ZMW / part)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400">ZMW</span>
                  <input
                    type="number"
                    value={globalPrice}
                    onChange={(e) => setGlobalPrice(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveGlobalPrice}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Save baseline rate
              </button>
            </div>
          </div>

          {/* Granular Overrides */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-500" /> Granular Institution Overrides
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Override standard pricing per institution node with custom effective dates.</p>
            </div>

            {pricingMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                pricingMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50 text-rose-800 border border-rose-100"
              }`}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-bold">{pricingMsg.text}</span>
              </div>
            )}

            <div className="space-y-3 font-sans">
              
              {/* Select institution with a searchable query */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Search & Select Institution</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                  />
                </div>
                
                {searchQuery && filteredInsts.length > 0 && (
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg p-1.5 space-y-0.5 z-10 relative">
                    {filteredInsts.slice(0, 5).map(inst => (
                      <button
                        key={inst.id}
                        type="button"
                        onClick={() => {
                          setSelectedInstId(inst.id);
                          setSearchQuery(inst.name);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between ${
                          selectedInstId === inst.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span>{inst.name}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Custom Rate</label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-2.5 text-[10px] font-black text-slate-400">ZMW</span>
                    <input
                      type="number"
                      value={overridePrice}
                      onChange={(e) => setOverridePrice(e.target.value)}
                      placeholder="0.85"
                      step="0.01"
                      className="w-full pl-10 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Effective Date</label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="date"
                      value={overrideDate}
                      onChange={(e) => setOverrideDate(e.target.value)}
                      className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveOverride}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Enforce custom rate
              </button>
            </div>

            {/* Existing Overrides Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
              <div className="bg-slate-50 p-2 border-b border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Configured Node Overrides</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {overrides.filter(o => o.hasOverride).length === 0 ? (
                  <p className="p-3 text-[10px] text-slate-400 text-center font-bold">No custom rate overrides active.</p>
                ) : (
                  overrides.filter(o => o.hasOverride).map(o => (
                    <div key={o.institutionId} className="p-2.5 flex items-center justify-between text-xs bg-slate-50/20 hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800 line-clamp-1">{o.name}</p>
                        {o.effectiveDate && (
                          <p className="text-[9px] text-slate-400 font-medium">Effective: {o.effectiveDate}</p>
                        )}
                      </div>
                      <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        ZMW {Number(o.smsRateZmw).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Add/Edit Gateway Configuration */}
      {editingGateway && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in font-sans">
            <div className="bg-slate-950 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest block font-mono">Configuration Manager</span>
                <h3 className="text-base font-black">{editingGateway.provider_name || "Add Gateway Server"}</h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-lg border border-slate-700">
                ID: {editingGateway.id}
              </span>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Provider name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Provider Display Name</label>
                  <input
                    type="text"
                    value={editingGateway.provider_name || ""}
                    onChange={(e) => setEditingGateway({ ...editingGateway, provider_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Sender ID (Alpha Tag)</label>
                  <input
                    type="text"
                    value={editingGateway.sender_id || ""}
                    placeholder="e.g. Mabala"
                    onChange={(e) => setEditingGateway({ ...editingGateway, sender_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              {/* Endpoint API Base URL */}
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Endpoint Base URL</label>
                <input
                  type="text"
                  value={editingGateway.base_url || ""}
                  placeholder="e.g. https://api.beem.africa/v1/send"
                  onChange={(e) => setEditingGateway({ ...editingGateway, base_url: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              {/* Account Username & Route Channel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Account Username / ID</label>
                  <input
                    type="text"
                    value={editingGateway.account_username || ""}
                    onChange={(e) => setEditingGateway({ ...editingGateway, account_username: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Route Channel</label>
                  <input
                    type="text"
                    value={editingGateway.route_channel || ""}
                    placeholder="e.g. transactional"
                    onChange={(e) => setEditingGateway({ ...editingGateway, route_channel: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              {/* API Security Key with Explicit Masking & Replace */}
              <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-indigo-950">Gateway Authorization API Key / Secret</label>
                  {!isReplacingKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReplacingKey(true);
                        setEditingGateway({ ...editingGateway, api_key: "" });
                      }}
                      className="text-[10px] font-extrabold text-indigo-600 uppercase hover:underline cursor-pointer"
                    >
                      Replace Key
                    </button>
                  )}
                </div>

                {isReplacingKey ? (
                  <input
                    type="password"
                    placeholder="Enter new API credential key..."
                    value={editingGateway.api_key || ""}
                    onChange={(e) => setEditingGateway({ ...editingGateway, api_key: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-indigo-500"
                  />
                ) : (
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 select-none flex items-center justify-between">
                    <span>{editingGateway.api_key || "••••••••"}</span>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">ENCRYPTED AT REST</span>
                  </div>
                )}
              </div>

              {/* DYNAMIC EXTRA PARAMETERS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Dynamic Extra Parameters (Providers-Specific)</label>
                  <button
                    type="button"
                    onClick={handleAddExtraParam}
                    className="text-[10px] font-extrabold text-indigo-600 uppercase hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Param
                  </button>
                </div>

                {extraParamsList.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold py-2">No extra parameters defined.</p>
                ) : (
                  <div className="space-y-2">
                    {extraParamsList.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Param Key"
                          value={item.key}
                          onChange={(e) => {
                            const copy = [...extraParamsList];
                            copy[idx].key = e.target.value;
                            setExtraParamsList(copy);
                          }}
                          className="w-1/2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                        <input
                          type="text"
                          placeholder="Value"
                          value={item.value}
                          onChange={(e) => {
                            const copy = [...extraParamsList];
                            copy[idx].value = e.target.value;
                            setExtraParamsList(copy);
                          }}
                          className="w-1/2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraParam(idx)}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingGateway(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-extrabold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGateway}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1 shadow"
              >
                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Test Connection handshake */}
      {showTestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-slate-950 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest block font-mono font-black">Connection Diagnostics</span>
                <h3 className="text-base font-black">Test Connection & Send SMS</h3>
              </div>
              <button
                onClick={() => setShowTestModal(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">Sends a real connection handshake test message using your configured parameters. Note: regular carrier credit charges apply.</p>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Recipient Phone Number (with Country Code)</label>
                <input
                  type="text"
                  placeholder="e.g. +260777000111"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  testResult.success ? "bg-emerald-50 text-emerald-900 border-emerald-100" : "bg-rose-50 text-rose-900 border-rose-100"
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                    <span>{testResult.message}</span>
                  </div>

                  {testResult.rawResponse && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-extrabold uppercase text-slate-400">Raw Provider Response</p>
                      <pre className="p-2 bg-slate-950 text-slate-200 font-mono text-[10px] rounded-lg overflow-x-auto select-all max-h-36 whitespace-pre-wrap">
                        {testResult.rawResponse}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowTestModal(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-extrabold uppercase cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRunTest}
                disabled={testingGatewayId !== null || !testPhoneNumber.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                {testingGatewayId ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" /> Dispatching...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Execute Diagnostics
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
