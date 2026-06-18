import React, { useState, useMemo } from "react";
import { 
  Plus, Search, Sliders, Settings, HardDrive, LayoutGrid, Calendar, AlertCircle, Sparkles, Filter, 
  Trash2, Edit, Check, ArrowUpDown, Clock, Users, ShieldAlert, Award, TrendingUp, Info, 
  Send, Phone, CheckCircle, AlertTriangle, MapPin, Map, RefreshCw
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area
} from "recharts";
import { VetClient, VetAppointment, DiseaseOutbreak, VetWalletTx, ClinicalRecord } from "./types";
import { VetNotification } from "./useVeterinaryNotifications";

interface DashboardTabProps {
  clients: VetClient[];
  appointments: VetAppointment[];
  outbreaks: DiseaseOutbreak[];
  credits: number;
  subscriptionPlan: string;
  transactions: VetWalletTx[];
  onTriggerModal: (modalType: string) => void;
  currencySymbol: string;
  records?: ClinicalRecord[];
  // Notification hook integration
  notifications?: VetNotification[];
  onTriggerInApp?: (id: string) => void;
  onTriggerWhatsApp?: (id: string) => void;
  onAcknowledgeAlert?: (id: string) => void;
  // Appointment events integration
  onAddAppointment?: (apt: any) => void;
  onUpdateAppointment?: (id: string, updates: any) => void;
}

export default function DashboardTab({
  clients,
  appointments,
  outbreaks,
  credits,
  subscriptionPlan,
  transactions,
  onTriggerModal,
  currencySymbol,
  records = [],
  notifications = [],
  onTriggerInApp,
  onTriggerWhatsApp,
  onAcknowledgeAlert,
  onAddAppointment,
  onUpdateAppointment
}: DashboardTabProps) {

  // Selected district for spatial heatmap interaction
  const [selectedHeatDistrict, setSelectedHeatDistrict] = useState<string>("Choma");
  const [showAddAptModal, setShowAddAptModal] = useState(false);

  // New appointment form state
  const [aptClient, setAptClient] = useState("");
  const [aptType, setAptType] = useState<VetAppointment["type"]>("Consultation");
  const [aptCat, setAptCat] = useState<VetAppointment["category"]>("Online Booking");
  const [aptDateTime, setAptDateTime] = useState("2026-06-18T10:00");
  const [aptRoute, setAptRoute] = useState("");
  const [aptVet, setAptVet] = useState("vet-noah");

  // WhatsApp manual template overlay modal
  const [whatsappOverlayMsg, setWhatsappOverlayMsg] = useState<string | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState<string>("");

  const pendingAppointments = appointments.filter(a => a.status === "Pending");
  const activeAlertsCount = outbreaks.filter(o => o.status === "Active Alert").length;
  const pendingAppointmentsCount = pendingAppointments.length;

  // Calculate approximate credit burn rates and exhaust forecasts
  const currentLevel = credits;
  const avgMonthlyBurn = 480; 
  const burnRatePerDay = parseFloat((avgMonthlyBurn / 30).toFixed(1));
  const estimatedDaysRemaining = burnRatePerDay > 0 ? Math.ceil(currentLevel / burnRatePerDay) : 0;
  
  const formattedExhaustionDate = useMemo(() => {
    if (estimatedDaysRemaining <= 0) return "Exhausted";
    const date = new Date("2026-06-16");
    date.setDate(date.getDate() + estimatedDaysRemaining);
    return date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
  }, [estimatedDaysRemaining]);

  // Credit usage distribution (Simulated data)
  const creditUsageHistory = [
    { month: "Jan", "Clinical Records": 120, "Lab Investigations": 50, "AI Decisions": 30, "Permits & Certs": 40 },
    { month: "Feb", "Clinical Records": 140, "Lab Investigations": 75, "AI Decisions": 45, "Permits & Certs": 60 },
    { month: "Mar", "Clinical Records": 180, "Lab Investigations": 90, "AI Decisions": 65, "Permits & Certs": 55 },
    { month: "Apr", "Clinical Records": 210, "Lab Investigations": 110, "AI Decisions": 80, "Permits & Certs": 90 },
    { month: "May", "Clinical Records": 290, "Lab Investigations": 140, "AI Decisions": 120, "Permits & Certs": 150 },
    { month: "Jun", "Clinical Records": 320, "Lab Investigations": 185, "AI Decisions": 190, "Permits & Certs": 210 }
  ];

  const sumRecords = 320, sumLabs = 185, sumAi = 190, sumPermits = 210;
  const totalCreditsUsedThisMonth = sumRecords + sumLabs + sumAi + sumPermits;

  // Spatial coordinates configuration for Zambia districts
  const districtMapNodes = [
    { name: "Chisamba", cx: 240, cy: 190, r: 12, cases: 42, severity: "Critical", disease: "African Swine Fever", info: "East commercial swine units isolated" },
    { name: "Choma", cx: 160, cy: 260, r: 14, cases: 110, severity: "High", disease: "Foot & Mouth (SAT 2)", info: "Batoka ward quarantine checkpoint active" },
    { name: "Livingstone", cx: 100, cy: 310, r: 10, cases: 15, severity: "Medium", disease: "East Coast Fever", info: "Grazing pasture block Alpha restricted" },
    { name: "Mansa", cx: 200, cy: 80, r: 8, cases: 0, severity: "Low", disease: "None (Cleared)", info: "Routine border biocheck active" },
    { name: "Katete", cx: 360, cy: 160, r: 8, cases: 0, severity: "Low", disease: "None (Cleared)", info: "Vaccination defense ring complete" },
    { name: "Lusaka", cx: 260, cy: 220, r: 9, cases: 4, severity: "Medium", disease: "Rabies quarantine", info: "Active canine vaccination campaign" }
  ];

  const selectedNodeDetails = useMemo(() => {
    return districtMapNodes.find(node => node.name === selectedHeatDistrict) || districtMapNodes[1];
  }, [selectedHeatDistrict]);

  const handleAddNewAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptClient) return;
    
    if (onAddAppointment) {
      onAddAppointment({
        clientId: "cl-gen",
        clientName: aptClient,
        type: aptType,
        category: aptCat,
        dateTime: aptDateTime,
        assignedVetId: aptVet,
        routeLocation: aptRoute || "Central Veterinary Clinic"
      });
      setAptClient("");
      setAptRoute("");
      setShowAddAptModal(false);
    }
  };

  const handleAssignVet = (aptId: string, vetId: string) => {
    if (onUpdateAppointment) {
      onUpdateAppointment(aptId, { assignedVetId: vetId });
    }
  };

  const handleCompleteApt = (aptId: string) => {
    if (onUpdateAppointment) {
      onUpdateAppointment(aptId, { status: "Completed" });
    }
  };

  const triggerDirectWhatsApp = (notif: VetNotification) => {
    const templatedMessage = `Mabala Veterinary Alert Details:\n---------------------------------\nTo Farmer: *${notif.clientName}*\nSubject: *${notif.title}*\n\nMessage: ${notif.message}\nAction: Please contact Southern Province Vet Center immediately.\nDue Date: *${notif.dueDate}* (Within ${notif.daysRemaining} Days)`;
    
    setWhatsappPhone(notif.farmerPhone);
    setWhatsappOverlayMsg(templatedMessage);
    
    if (onTriggerWhatsApp) {
      onTriggerWhatsApp(notif.id);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden" id="vet-dashboard-header">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 bottom-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">Veterinary Domain Node</span>
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/35 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">Surveillance Center</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white leading-none pt-1">Mabala Veterinary Suite</h1>
          <p className="text-sm text-slate-400">Biological traceability index, central pathology registry, vaccine boosters, and live outbreak maps.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 z-10 shrink-0">
          <button 
            type="button"
            onClick={() => onTriggerModal("subscribe")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition rounded-xl text-xs font-bold text-white shadow shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            Manage Subscription
          </button>
          <button 
            type="button"
            onClick={() => onTriggerModal("recharge")}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-98 transition rounded-xl text-xs font-bold text-white shadow shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Purchase Credit Bundles
          </button>
        </div>
      </div>

      {/* 2. Top-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="vet-top-metrics">
        
        {/* Active Client Profiles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block leading-none pb-1">Onboarded Clients</span>
            <span className="text-2xl font-bold text-slate-800">{clients.length}</span>
            <span className="text-[10px] text-emerald-600 font-bold block pt-0.5">⚡ Verified Farmers</span>
          </div>
        </div>

        {/* Pending Consultations / Visits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block leading-none pb-1">Scheduled Appointments</span>
            <span className="text-2xl font-bold text-slate-800">{pendingAppointmentsCount}</span>
            <span className="text-[10px] text-amber-600 font-bold block pt-0.5">⚠️ {pendingAppointments.length} Pending Actions</span>
          </div>
        </div>

        {/* Active Outbreak Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block leading-none pb-1">Epidemiology Alarms</span>
            <span className="text-2xl font-bold text-slate-800">{activeAlertsCount}</span>
            <span className="text-[10px] text-rose-600 font-bold block pt-0.5">● Quarantine Restriction</span>
          </div>
        </div>

        {/* Subscription Credits Balance */}
        <div className="bg-gradient-to-br from-teal-555 to-emerald-650 bg-emerald-950 p-5 rounded-2xl border border-emerald-900 shadow-sm text-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-900 border border-emerald-700/60 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-widest block leading-none pb-1">Credit Wallet</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-2xl font-extrabold font-mono">{credits}</span>
              <span className="text-[10px] text-emerald-300">Credits available</span>
            </div>
            <span className="text-[10px] text-emerald-200 font-semibold block truncate font-mono">Exhaustion: {formattedExhaustionDate}</span>
          </div>
        </div>

      </div>

      {/* 3. NEW SECTION: Live Disease Surveillance Heat Map & Outbreak Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="disease-surveillance-hub">
        
        {/* Spatial Heatmap Visualizer Canvas (SVG) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Map className="w-4 h-4 text-emerald-600" /> State Disease Surveillance Spatial Heat Map
              </h2>
              <p className="text-xs text-slate-500">Live epidemiological pathology distribution map of Zambia. Pulse zones reveal critical quarantines.</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-mono font-extrabold text-rose-600 tracking-wider">LIVE SURVEILLANCE FEED</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* The SVG spatial outline map viewport */}
            <div className="md:col-span-7 bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-center items-center relative overflow-hidden" style={{ minHeight: "340px" }}>
              <div className="absolute top-2 left-2 z-10 text-[9px] font-mono font-bold text-slate-400">
                ZOOM: AUTO (ZAMBIA DISTRICTS GRID)
              </div>
              
              <svg viewBox="0 0 450 360" className="w-full max-w-[380px] h-auto text-slate-200" fill="none" xmlns="http://www.w3.org/2000/svg">
                
                {/* Simulated background provincial vector map paths of Zambia */}
                <path d="M 50,50 L 120,40 L 190,45 L 230,10 L 250,50 L 320,60 L 390,90 L 410,130 L 350,170 L 320,150 L 300,190 L 260,210 L 190,225 L 140,290 L 60,330 L 30,300 L 40,240 L 100,200 L 70,140 Z" fill="#ebf7ee" stroke="#b0dcbd" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M 190,45 L 260,110 L 310,105 L 320,60 M 300,190 L 350,180 L 380,140 Q 300,220 260,210" stroke="#9bcdaa" strokeWidth="1" strokeDasharray="3 3" />
                
                {/* Dynamic heat spots & pulsing waves */}
                {districtMapNodes.map((node) => {
                  const isNodeSelected = selectedHeatDistrict === node.name;
                  const isCritical = node.severity === "Critical";
                  const isHigh = node.severity === "High";
                  const isMedium = node.severity === "Medium";
                  
                  let radialGradiantClass = "fill-emerald-500/10 stroke-emerald-500";
                  let pulseColor = "rgba(16, 185, 129, 0.4)";
                  
                  if (isCritical) {
                    radialGradiantClass = "fill-rose-500/25 stroke-rose-600";
                    pulseColor = "rgba(244, 63, 94, 0.6)";
                  } else if (isHigh) {
                    radialGradiantClass = "fill-amber-500/25 stroke-amber-600";
                    pulseColor = "rgba(245, 158, 11, 0.5)";
                  } else if (isMedium) {
                    radialGradiantClass = "fill-blue-500/20 stroke-blue-500";
                    pulseColor = "rgba(59, 130, 246, 0.4)";
                  }

                  return (
                    <g 
                      key={node.name} 
                      className="cursor-pointer select-none group transition-all"
                      onClick={() => setSelectedHeatDistrict(node.name)}
                    >
                      {/* Pulse circle wave (rendered via standard elements or simple scale animations) */}
                      {(isCritical || isHigh) && (
                        <circle 
                          cx={node.cx} 
                          cy={node.cy} 
                          r={node.r * (isNodeSelected ? 2.2 : 1.6)} 
                          fill="none" 
                          stroke={isCritical ? "#f43f5e" : "#f59e0b"} 
                          strokeWidth="1.5" 
                          className="animate-ping opacity-25"
                          style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
                        />
                      )}
                      
                      {/* Interactive District Circle Area */}
                      <circle 
                        cx={node.cx} 
                        cy={node.cy} 
                        r={isNodeSelected ? node.r + 4 : node.r} 
                        className={`${radialGradiantClass} transition-all duration-300 group-hover:scale-110`}
                        strokeWidth={isNodeSelected ? 3 : 1.5}
                        style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
                      />

                      {/* Small Center Core Identifier Pin */}
                      <circle 
                        cx={node.cx} 
                        cy={node.cy} 
                        r="3.5" 
                        fill={isCritical ? "#e11d48" : isHigh ? "#d97706" : isMedium ? "#2563eb" : "#059669"} 
                      />

                      {/* Custom styled District Name Label */}
                      <text 
                        x={node.cx} 
                        y={node.cy - node.r - 4} 
                        textAnchor="middle" 
                        className="font-mono font-black text-[9px] fill-slate-700 tracking-tight transition-all group-hover:fill-slate-900 group-hover:text-[10px]"
                        style={{ textShadow: "1px 1.5px 0px white" }}
                      >
                        {node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Micro panel with specific active district bio-security info */}
            <div className="md:col-span-5 space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-start pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">SELECTED REGION STATE</span>
                    <strong className="text-sm font-bold text-slate-800">{selectedNodeDetails.name} District</strong>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold leading-none ${
                    selectedNodeDetails.severity === "Critical" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                    selectedNodeDetails.severity === "High" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                    selectedNodeDetails.severity === "Medium" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                    "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}>
                    {selectedNodeDetails.severity} SEVERITY
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Confirmed Cases:</span>
                    <strong className="text-slate-800">{selectedNodeDetails.cases} Live Cases</strong>
                  </div>
                  
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Recorded Pathogen:</span>
                    <strong className="text-rose-600 font-bold">{selectedNodeDetails.disease}</strong>
                  </div>

                  <div className="pt-2 border-t border-slate-250">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">OFFICIAL BIO-SECURITY QUARANTINE BOUNDS</span>
                    <p className="text-slate-600 text-xs mt-1 font-sans italic leading-relaxed">
                      "{selectedNodeDetails.info}"
                    </p>
                  </div>
                </div>

                {selectedNodeDetails.cases > 0 && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] rounded-lg font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                    <span>Animal movement permit restriction enforced! Special clearance required.</span>
                  </div>
                )}
              </div>

              {/* General epidemiological statistics ledger summaries */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bio-Security Quick Summary</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border rounded-lg text-center">
                    <span className="text-slate-400 text-[9px] block">TOTAL REGIONAL CASES</span>
                    <strong className="text-lg text-slate-800 mt-1 font-mono">{outbreaks.reduce((s, o) => s + o.confirmedCases, 0)}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-lg text-center">
                    <span className="text-slate-400 text-[9px] block">TOTAL PATHOLOGY MORTALITIES</span>
                    <strong className="text-lg text-rose-600 mt-1 font-mono">{outbreaks.reduce((s, o) => s + o.mortalities, 0)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Pending Clinical Appointments Supervisor Panel */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4.5 h-4.5 text-amber-500" /> Pending Clinical Appointments
              </h3>
              <button 
                onClick={() => setShowAddAptModal(true)}
                className="p-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Book Appointment
              </button>
            </div>
            <p className="text-xs text-slate-500">Track and assign veterinarians to local mobile/clinic visits securely.</p>
          </div>

          <div className="space-y-3 overflow-y-auto pr-1 max-h-[310px] scrollbar-thin flex-1 min-h-[220px]">
            {pendingAppointments.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-100 text-center text-slate-400 italic text-xs">
                No pending clinical appointments found. All visits matched!
              </div>
            ) : (
              pendingAppointments.map((apt) => (
                <div key={apt.id} className="p-3.5 border border-slate-150 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs space-y-3 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-slate-800 block text-xs">{apt.clientName}</strong>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{apt.type} • {apt.category}</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[8px] rounded uppercase">
                      {apt.status}
                    </span>
                  </div>

                  <div className="space-y-1 bg-white p-2 rounded-lg border text-[10px] text-slate-500 font-mono">
                    <div className="flex justify-between">
                      <span>Schedule:</span>
                      <strong className="text-slate-700">{new Date(apt.dateTime).toLocaleDateString()} {new Date(apt.dateTime).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}</strong>
                    </div>
                    {apt.routeLocation && (
                      <div className="flex justify-between">
                        <span>Route/Farm:</span>
                        <strong className="text-slate-700 truncate max-w-[150px]">{apt.routeLocation}</strong>
                      </div>
                    )}
                  </div>

                  {/* Operational Dropdown for Doctor Assignment & Done trigger */}
                  <div className="flex items-center gap-1.5 justify-between pt-1">
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[9px] text-slate-400 uppercase font-mono font-bold shrink-0">Vet Assignment:</span>
                      <select 
                        value={apt.assignedVetId || "vet-noah"}
                        onChange={(e) => handleAssignVet(apt.id, e.target.value)}
                        className="p-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 focus:outline-none flex-1 truncate"
                      >
                        <option value="vet-noah">Dr. Noah Mulenga</option>
                        <option value="vet-sibeso">Sibeso Nalungwe</option>
                        <option value="vet-mwale">Kelvin Mwale (Lab)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCompleteApt(apt.id)}
                      className="p-1 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-extrabold text-[9px] rounded-lg flex items-center gap-0.5 whitespace-nowrap cursor-pointer select-none"
                    >
                      <Check className="w-3 h-3" /> Terminate Done
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Completed appointments are moved to the consultation ledger folders.</span>
          </div>
        </div>

      </div>

      {/* 5. NEW SECTION: Vaccination booster and Treatment withdrawal alerts center */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4" id="booster-withdrawal-notifications">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-500 animate-pulse" /> Active Vaccination Boosters & Drug Withdrawal Warnings (&lt;= 3 Days)
            </h3>
            <p className="text-xs text-slate-500">Real-time alerts generated from clinical files. Direct-dispatch WhatsApp notifications with custom multi-tenant templates.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold flex items-center gap-1.5">
              ⚠️ {notifications.length} Active System Alerts
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notifications.map((notif) => (
            <div key={notif.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition hover:shadow-sm ${
              notif.type === "withdrawal_period" ? "bg-rose-50/40 border-rose-150" : "bg-indigo-50/40 border-indigo-150"
            }`}>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                      notif.type === "withdrawal_period" ? "bg-rose-100 text-rose-800" : "bg-indigo-100 text-indigo-800"
                    }`}>
                      {notif.type === "withdrawal_period" ? "☢ DRUG WITHDRAWAL" : "💉 VACCINE BOOSTER"}
                    </span>
                    <strong className="text-slate-800 text-xs block pt-1">{notif.title}</strong>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                    notif.daysRemaining <= 1 ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-amber-150 bg-amber-100 text-amber-800"
                  }`}>
                    {notif.daysRemaining <= 0 ? "OVERDUE" : `In ${notif.daysRemaining} days`}
                  </span>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed font-medium">
                  {notif.message}
                </p>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono bg-white/60 p-2 rounded-lg border">
                  <span>Client Farmer: <strong className="text-slate-700">{notif.clientName}</strong></span>
                  <span>Due: <strong className="text-slate-700">{notif.dueDate}</strong></span>
                </div>
              </div>

              {/* Interactions to dispatch messages */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button 
                  onClick={() => onTriggerInApp && onTriggerInApp(notif.id)}
                  className={`flex-1 py-1.5 transition text-[10px] font-black rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer select-none ${
                    notif.status === "Sent_InApp" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200"
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" /> 
                  {notif.status === "Sent_InApp" ? "✓ Sent In-App Alert" : "🔔 Send In-App Alert"}
                </button>
                <button 
                  onClick={() => triggerDirectWhatsApp(notif)}
                  className={`flex-1 py-1.5 transition text-[10px] font-black rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer select-none ${
                    notif.status === "Sent_WhatsApp" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" /> 
                  {notif.status === "Sent_WhatsApp" ? "✓ WhatsApp Dispatched" : "💬 dispatch WhatsApp"}
                </button>
                <button 
                  onClick={() => onAcknowledgeAlert && onAcknowledgeAlert(notif.id)}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 hover:bg-slate-50 transition text-[10px] font-bold rounded-lg cursor-pointer select-none"
                  title="Archive/Dismiss alert from feed"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* 4. Veterinary Doctor Activity Radar Widget */}
      <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-3xl space-y-5 shadow-sm" id="doctor-activity-radar">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-1.5 pb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping inline-block" />
              <h2 className="text-sm font-extrabold text-indigo-950 uppercase tracking-wide">Veterinary Doctor's Hub: Unified Activity & Compliance Radar</h2>
            </div>
            <p className="text-xs text-slate-500">Scheduled clinical operations, treatment history, and active veterinary alert dispatches.</p>
          </div>
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-[10px] rounded-full uppercase tracking-wider">
            🩺 Doctor Role Dashboard Connected
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Upcoming Scheduled Appointments */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-[#111822] text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" /> Upcoming Scheduled Appointments
              </h3>
              <span className="bg-amber-100 text-amber-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                {appointments.filter(a => a.status === "Pending").length} Pending
              </span>
            </div>

            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-[11px] italic">No scheduled appointments logged.</div>
              ) : (
                appointments.slice(0, 5).map(apt => (
                  <div key={apt.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 text-[11px] transition-all hover:border-slate-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800 block">{apt.clientName}</span>
                        <span className="text-[10px] text-slate-500">Client Ref: <strong className="font-semibold text-slate-600">{apt.clientId}</strong></span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase ${
                        apt.status === "Completed" 
                          ? "bg-emerald-100 text-emerald-800" 
                          : apt.status === "Cancelled" 
                            ? "bg-rose-100 text-rose-800" 
                            : "bg-amber-100 text-amber-800"
                      }`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-semibold font-mono font-medium">
                      <div className="flex items-center gap-1 col-span-2">
                        <Clock className="w-3 h-3 text-slate-400" /> {apt.dateTime}
                      </div>
                    </div>

                    <div className="text-[10px] text-[#4a5668] bg-slate-100/50 p-1 rounded-md text-center font-bold">
                      {apt.type} ({apt.category})
                    </div>

                    {apt.status === "Pending" && (
                      <div className="flex gap-1.5 pt-1.5">
                        <button 
                          onClick={() => onUpdateAppointment && onUpdateAppointment(apt.id, { status: "Completed" })}
                          className="flex-1 py-1 bg-emerald-500 hover:bg-emerald-600 font-bold text-white rounded-lg text-[9.5px] cursor-pointer"
                        >
                          Complete
                        </button>
                        <button 
                          onClick={() => onUpdateAppointment && onUpdateAppointment(apt.id, { status: "Cancelled" })}
                          className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 font-bold text-slate-400 rounded-lg text-[9.5px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 2: Recent Health & Treatment Logs */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-[#111822] text-xs flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-600" /> Recent Diagnosis & Therapy Logs
              </h3>
              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                {records.length} Recorded
              </span>
            </div>

            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {records.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-[11px] italic">No therapy runs recorded. Clear a consultation to log data.</div>
              ) : (
                records.slice(0, 5).map(record => (
                  <div key={record.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1.5 text-[11px] transition-all hover:border-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800">Tag: {record.animalId}</span>
                      <span className="text-[9px] font-mono text-slate-500 font-bold">{record.date || "2026-06-17"}</span>
                    </div>

                    <div className="text-[10px] space-y-0.5">
                      <div><span className="text-slate-400 font-bold uppercase">Diagnosis:</span> <strong className="text-rose-700 font-bold">{record.diagnosis || "Post-mortem investigation"}</strong></div>
                      <div><span className="text-slate-400 font-bold uppercase">Prognosis:</span> <span className="font-semibold text-slate-600">{record.status || "In therapy"}</span></div>
                    </div>

                    <div className="border-t border-slate-200/80 pt-1 text-[10px] text-slate-500 font-semibold leading-snug">
                      📄 <span className="italic">{record.treatmentPlanned || "Surgical recovery monitoring only"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 3: Critical Treatment Booster Alerts */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-[#111822] text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" /> 3-Day Vaccination Booster Targets
              </h3>
              <span className="bg-rose-100 text-rose-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                {notifications.filter(n => n.type === "vaccination_booster" || n.type === "withdrawal_period").length} Active
              </span>
            </div>

            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-[11px] italic">No upcoming booster targets. All animals compliant.</div>
              ) : (
                notifications.slice(0, 5).map(notif => (
                  <div key={notif.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 text-[11px] transition-all hover:border-slate-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800 block">{notif.title}</span>
                        <span className="text-[10.5px] text-rose-600 font-black">{notif.type === "vaccination_booster" ? "Booster Target" : "Withdrawal Window"}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{notif.dueDate}</span>
                    </div>

                    <p className="text-[10px] leading-relaxed text-slate-500 bg-white p-1.5 rounded-lg border border-slate-100">
                      {notif.message}
                    </p>

                    <div className="flex gap-1.5 pt-1.5">
                      <button 
                        onClick={() => onTriggerInApp && onTriggerInApp(notif.id)}
                        className={`flex-1 py-1 transition text-[9px] font-bold rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer select-none ${
                          notif.status === "Sent_InApp" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        {notif.status === "Sent_InApp" ? "✓ App Alert" : "🔔 App Alert"}
                      </button>
                      <button 
                        onClick={() => triggerDirectWhatsApp(notif)}
                        className={`flex-1 py-1 transition text-[9px] font-bold rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer select-none ${
                          notif.status === "Sent_WhatsApp" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {notif.status === "Sent_WhatsApp" ? "✓ WhatsApp Dispatched" : "💬 dispatch WhatsApp"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Traditional Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="credit-analytics-blocks">
        
        {/* Credits usage timeseries chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Resource Consumption & Credit Burndown</h3>
              <p className="text-xs text-slate-500">Platform credits consumed dynamically per billing classification activity over the last 6 months.</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={creditUsageHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLabs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Area type="monotone" dataKey="Clinical Records" stroke="#6366f1" fillOpacity={1} fill="url(#colorRecords)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="Lab Investigations" stroke="#10b981" fillOpacity={1} fill="url(#colorLabs)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="AI Decisions" stroke="#f59e0b" fillOpacity={0} strokeWidth={1.5} />
                <Area type="monotone" dataKey="Permits & Certs" stroke="#3b82f6" fillOpacity={0} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Credit Burn rate metrics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Dynamic Consumption Health</h3>
              <p className="text-xs text-slate-500">Departmental split and burn profile.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Average Monthly Burn:</span>
                <span className="font-bold text-slate-700">{avgMonthlyBurn} Credits</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Calculated Burn Rate:</span>
                <span className="font-bold text-amber-600">{burnRatePerDay} Credits / Day</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Total Consumed This Month:</span>
                <span className="font-bold text-slate-800">{totalCreditsUsedThisMonth} Credits</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 pb-1">
                  <span>CLINICAL VISITS (CRM)</span>
                  <span>{sumRecords} Credits ({Math.round(sumRecords / totalCreditsUsedThisMonth * 100)}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(sumRecords / totalCreditsUsedThisMonth) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 pb-1">
                  <span>LABORATORY DIAGNOSTICS</span>
                  <span>{sumLabs} Credits ({Math.round(sumLabs / totalCreditsUsedThisMonth * 100)}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(sumLabs / totalCreditsUsedThisMonth) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 pb-1">
                  <span>AI DECISION SUPPORT</span>
                  <span>{sumAi} Credits ({Math.round(sumAi / totalCreditsUsedThisMonth * 100)}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(sumAi / totalCreditsUsedThisMonth) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 pb-1">
                  <span>VETERINARY MOVEMENT CARDS</span>
                  <span>{sumPermits} Credits ({Math.round(sumPermits / totalCreditsUsedThisMonth * 100)}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(sumPermits / totalCreditsUsedThisMonth) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Admins can customize transactional rates in Billing & Config.</span>
          </div>
        </div>

      </div>

      {/* QUICK BOOKING MODAL */}
      {showAddAptModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold font-sans">Apt Schedule Central Appointment</h3>
                <p className="text-[9px] text-emerald-400 font-mono">Setup pending clinical site consultations</p>
              </div>
              <button onClick={() => setShowAddAptModal(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
            </div>

            <form onSubmit={handleAddNewAppointment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Farmer Client Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mukuni Ranching Co-op" 
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none"
                  value={aptClient}
                  onChange={(e) => setAptClient(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Appointment Type</label>
                  <select 
                    value={aptType} 
                    onChange={(e) => setAptType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Herd Health Inspection">Herd Health Inspection</option>
                    <option value="Laboratory Testing">Laboratory Testing</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Category</label>
                  <select 
                    value={aptCat} 
                    onChange={(e) => setAptCat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none"
                  >
                    <option value="Walk-in">Walk-in</option>
                    <option value="Online Booking">Online Booking</option>
                    <option value="Mobile Vet Booking">Mobile Vet Booking</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none"
                    value={aptDateTime}
                    onChange={(e) => setAptDateTime(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Assign Vet Surgeon</label>
                  <select 
                    value={aptVet} 
                    onChange={(e) => setAptVet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none"
                  >
                    <option value="vet-noah">Dr. Noah Mulenga</option>
                    <option value="vet-sibeso">Sibeso Nalungwe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Specific Field Route Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mosi-o-Tunya Rd pastures, Livingstone" 
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none"
                  value={aptRoute}
                  onChange={(e) => setAptRoute(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowAddAptModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">Schedule Visit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP OVERLAY MSG MODAL FOR EMULATION */}
      {whatsappOverlayMsg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in slide-in-from-bottom-20 duration-300">
            <div className="p-4 bg-[#075E54] text-white flex items-center gap-2 border-b border-[#054D44]">
              {/* WhatsApp icon look-alike */}
              <div className="w-8 h-8 rounded-full bg-emerald-500 border border-emerald-400/30 text-white font-mono flex items-center justify-center font-bold text-sm shrink-0">
                W
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">Mabala API WhatsApp Gateway</h4>
                <p className="text-[9px] text-[#25D366] font-extrabold flex items-center gap-1">
                  <span>● API channels connected</span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#ECE5DD] space-y-3 min-h-[140px]" style={{ backgroundImage: "radial-gradient(#dbcbbb 10%, transparent 11%)", backgroundSize: "12px 12px" }}>
              <div className="p-3 bg-[#DCF8C6] border shadow-sm rounded-xl text-[11px] text-slate-800 border-[#98d876]/40 max-w-[90%] font-mono space-y-1 block leading-relaxed float-left">
                <div className="text-[8px] text-slate-400 pb-0.5">To: {whatsappPhone}</div>
                {whatsappOverlayMsg.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
                <div className="text-[8px] text-slate-400 text-right pt-1 select-none">19:39 ✓✓</div>
              </div>
              <div className="clear-both" />
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2 text-xs">
              <button 
                type="button" 
                onClick={() => setWhatsappOverlayMsg(null)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-center cursor-pointer active:scale-98 transition shadow"
              >
                Close Gateway Session
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
