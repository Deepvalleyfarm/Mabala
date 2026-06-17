import React, { useState } from "react";
import { 
  Plus, Search, Shield, Heart, FileText, Check, AlertTriangle, Printer, Sparkles, MapPin, 
  Clock, ShieldAlert, Award, ArrowUpRight, CheckSquare, RefreshCw, Send, DollarSign,
  CheckCircle, Info
} from "lucide-react";
import { ClinicalRecord, MovementCard, VaccineCampaign } from "./types";

interface ClinicalTabProps {
  records: ClinicalRecord[];
  movements: MovementCard[];
  campaigns: VaccineCampaign[];
  credits: number;
  onAddClinicalRecord: (data: Omit<ClinicalRecord, "id" | "date">) => boolean;
  onAddMovementCard: (data: Omit<MovementCard, "id" | "permitNo" | "dateIssued" | "status">) => boolean;
  onDownloadPassport: (record: ClinicalRecord) => void;
  onDownloadPermitPdf: (mov: MovementCard) => void;
  currencySymbol: string;
}

export default function ClinicalTab({
  records,
  movements,
  campaigns,
  credits,
  onAddClinicalRecord,
  onAddMovementCard,
  onDownloadPassport,
  onDownloadPermitPdf,
  currencySymbol
}: ClinicalTabProps) {
  
  const [subTab, setSubTab] = useState<"consult" | "move" | "vaccine" | "surgery">("consult");
  const [searchTag, setSearchTag] = useState("");

  // Consultation Form
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [cName, setCName] = useState("");
  const [cContact, setCContact] = useState("");
  const [animalTag, setAnimalTag] = useState("");
  const [species, setSpecies] = useState("Bovine (Steer)");
  const [diagnosis, setDiagnosis] = useState("");
  const [findings, setFindings] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescVal, setPrescVal] = useState("");
  const [cost, setCost] = useState(250);
  const [cStatus, setCStatus] = useState<ClinicalRecord["status"]>("Under Treatment");
  const [gps, setGps] = useState("-17.821, 25.850");
  const [cError, setCError] = useState("");

  // Movement Form
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [mOriginD, setMOriginD] = useState("Choma");
  const [mDestD, setMDestD] = useState("Lusaka Cent.");
  const [mOriginF, setMOriginF] = useState("");
  const [mDestF, setMDestF] = useState("");
  const [mCount, setMCount] = useState(25);
  const [mSpecies, setMSpecies] = useState("Bovine (Steer)");
  const [mError, setMError] = useState("");

  // Movement Card Generator States
  const [selectedMovementAnimal, setSelectedMovementAnimal] = useState("BOV-2019-Z29");
  const [showQrVerificationModal, setShowQrVerificationModal] = useState(false);
  const [customVerificationPayload, setCustomVerificationPayload] = useState<any>(null);

  const handleCreateConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !animalTag || !diagnosis || !findings) {
      setCError("Please complete all required fields.");
      return;
    }

    if (credits < 15) {
      setCError("Insufficient credits! Logging a consultation requires 15 credits.");
      return;
    }

    const success = onAddClinicalRecord({
      clientId: "cl-gen",
      clientName: cName,
      animalId: animalTag,
      species,
      diagnosis,
      clinicalFindings: findings,
      treatmentPlanned: treatment,
      prescriptions: prescVal ? prescVal.split(",").map(p => p.trim()) : [],
      cost: Number(cost),
      status: cStatus,
      gpsCoords: gps,
      vetSignature: "Dr. Noah Mulenga"
    });

    if (success) {
      setCName("");
      setAnimalTag("");
      setDiagnosis("");
      setFindings("");
      setTreatment("");
      setPrescVal("");
      setCError("");
      setShowConsultModal(false);
    }
  };

  const handleCreateMovementPermit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mOriginF || !mDestF) {
      setMError("Farms parameters cannot be empty.");
      return;
    }

    if (credits < 20) {
      setMError("Insufficient credits! Movement permits require 20 credits.");
      return;
    }

    const success = onAddMovementCard({
      originDistrict: mOriginD,
      destinationDistrict: mDestD,
      originFarm: mOriginF,
      destinationFarm: mDestF,
      animalCount: Number(mCount),
      species: mSpecies,
      healthClearanceUuid: "hc-" + Math.random().toString(36).slice(2, 10)
    });

    if (success) {
      setMOriginF("");
      setMDestF("");
      setMError("");
      setShowMoveModal(false);
    }
  };

  // AI disease prescription assistant hook triggers
  const triggerAiCopilotHelp = () => {
    if (!findings) {
      alert("Please outline clinical findings first to assist the AI.");
      return;
    }
    // Simulate smart AI recommendation
    setDiagnosis("Colibacillosis / Calf Scours (AI Recommended)");
    setTreatment("Rehydration, oral administration of sulfadiazine, standard isolation steps.");
    setPrescVal("Sulfadiazine suspension, Electrolytes Powder packet");
    setCost(480);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Sub tabs line banner */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setSubTab("consult")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition duration-150 select-none cursor-pointer flex items-center gap-1.5 ${
            subTab === "consult" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Heart className="w-4 h-4" /> Consultations & Certs
        </button>
        <button 
          onClick={() => setSubTab("move")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition duration-150 select-none cursor-pointer flex items-center gap-1.5 ${
            subTab === "move" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Send className="w-4 h-4" /> Movement Permits / QR
        </button>
        <button 
          onClick={() => setSubTab("vaccine")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition duration-150 select-none cursor-pointer flex items-center gap-1.5 ${
            subTab === "vaccine" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield className="w-4 h-4" /> Campaigns Track (EPID)
        </button>
        <button 
          onClick={() => setSubTab("surgery")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition duration-150 select-none cursor-pointer flex items-center gap-1.5 ${
            subTab === "surgery" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" /> Surgical Modules
        </button>
      </div>

      {/* RENDER CHANNELS */}

      {/* A. CONSULTATIONS SUBTAB */}
      {subTab === "consult" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 max-w-sm w-full relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
              <input 
                type="text" 
                placeholder="Search ear tag ID or client..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
              />
            </div>

            <button 
              type="button"
              onClick={() => setShowConsultModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 active:scale-98 transition shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Consultation (Costs 15 Credits)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200 font-mono">
                  <th className="py-3 px-6">Case Ref</th>
                  <th className="py-3 px-6">Animal Tag / Species</th>
                  <th className="py-3 px-6">Farmer (Client)</th>
                  <th className="py-3 px-6">Primary Diagnosis</th>
                  <th className="py-3 px-6 text-center">Outcome</th>
                  <th className="py-3 px-6">Receipt / Cost</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {records.filter(r => r.animalId.includes(searchTag) || r.clientName.toLowerCase().includes(searchTag.toLowerCase())).map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-mono font-bold text-[10px] text-slate-500">{rec.id.toUpperCase()}</td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800 block">{rec.animalId}</span>
                      <span className="text-[10px] text-slate-400">{rec.species}</span>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600">{rec.clientName}</td>
                    <td className="py-4 px-6 font-medium text-slate-700">{rec.diagnosis}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        rec.status === "Healed" ? "bg-emerald-50 text-emerald-700" :
                        rec.status === "Recovering" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-700">{currencySymbol}{rec.cost.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => onDownloadPassport(rec)}
                        className="p-1 px-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[10px] font-extrabold rounded-lg inline-flex items-center gap-1 select-none cursor-pointer transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> Passport PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* B. MOVEMENTS SUBTAB */}
      {subTab === "move" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Veterinary Transit Permits & Verifiable Movement Cards</h4>
              <p className="text-[10px] text-slate-400 font-mono">Enforce bio-security checks, vaccine validations, and digital QR quarantine passports.</p>
            </div>

            <button 
              type="button"
              onClick={() => setShowMoveModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition active:scale-98"
            >
              <Plus className="w-4 h-4" /> Issue Transit Permit (Costs 20 Credits)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Official Transit Permits Ledger */}
            <div className="lg:col-span-7 space-y-4">
              <h5 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Global Transit Permits Register</h5>
              
              <div className="grid grid-cols-1 gap-4">
                {movements.map((mov) => (
                  <div key={mov.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden transition hover:border-slate-350">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-[9px] font-mono font-bold">
                          {mov.permitNo}
                        </span>
                        <h5 className="font-bold text-slate-800 text-sm mt-1">{mov.animalCount} Cattle [{mov.species}]</h5>
                        <span className="text-[10px] text-slate-400 block pt-0.5">Approved transit date : {mov.dateIssued}</span>
                      </div>

                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-150 text-[10px] font-extrabold rounded-full">
                        ✓ QR-VERIFIED
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs font-medium">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px]">ORIGIN FARM:</span>
                        <span className="font-bold text-slate-700 max-w-[200px] truncate">{mov.originFarm} ({mov.originDistrict})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px]">DESTINATION:</span>
                        <span className="font-bold text-slate-700 max-w-[200px] truncate">{mov.destinationFarm} ({mov.destinationDistrict})</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[10px] text-slate-400">
                        <span>SECURITY TRUST HASH:</span>
                        <span className="font-mono text-[9px] truncate max-w-[120px]">{mov.healthClearanceUuid}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => onDownloadPermitPdf(mov)}
                        className="w-full py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-xl inline-flex items-center justify-center gap-1.5 select-none cursor-pointer transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Certified Transit Permit PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Branded Verifiable 'Veterinary Movement Cards' Generator */}
            <div className="lg:col-span-5 space-y-4">
              <h5 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Mabala Verifiable Passage Cards</h5>
              
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 relative">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">Dynamic Compliance Passage Card</h4>
                  <p className="text-[10px] text-slate-400">Validate immunization records of specific livestock animal IDs directly from centralized database registries.</p>
                </div>

                {/* Animal ID selector */}
                <div className="space-y-1.5 text-xs">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Select Target Ear-Tag ID:</label>
                  <select
                    value={selectedMovementAnimal}
                    onChange={(e) => setSelectedMovementAnimal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700"
                  >
                    <option value="BOV-2019-Z29">BOV-2019-Z29 (Mukuni Ranching Co-op • Steer)</option>
                    <option value="COW-DRY-38A">COW-DRY-38A (Green Valley Dairy Farms • Holstein)</option>
                    <option value="OVN-MA-4511">OVN-MA-4511 (Chisamba Smallholders • Breeding Ram)</option>
                    <option value="POR-SOW-909">POR-SOW-909 (Katete Pork Producers • Sow)</option>
                  </select>
                </div>

                {/* Dynamic Health & Vaccination Compliance Checklist Panel */}
                {(() => {
                  const isZ29 = selectedMovementAnimal === "BOV-2019-Z29";
                  const is38A = selectedMovementAnimal === "COW-DRY-38A";
                  const isRam = selectedMovementAnimal === "OVN-MA-4511";
                  
                  const animalName = isZ29 ? "Zambia Boran Bull Steer" : is38A ? "Holstein Heifer Dry" : isRam ? "Blackhead Persian Ram" : "Large White Sow";
                  const owner = isZ29 ? "Mukuni Ranching Co-op" : is38A ? "Green Valley Dairy Farms" : isRam ? "Chisamba Smallholder Hub" : "Katete Pork Producers";
                  const district = isZ29 ? "Choma" : is38A ? "Livingstone" : isRam ? "Chisamba" : "Katete";
                  
                  // Vaccination status determinations
                  const fmdStatus = isZ29 || isRam ? "Compliant" : "Overdue";
                  const asfStatus = "Compliant";
                  const anthraxStatus = isZ29 || is38A ? "Compliant" : "Due Booster";
                  
                  let complianceScore = 15;
                  if (fmdStatus === "Compliant") complianceScore += 45;
                  if (anthraxStatus === "Compliant") complianceScore += 40;

                  const isAuthorizedForTransit = complianceScore >= 80 && district !== "Chisamba" && district !== "Choma";

                  const qrVerificationPayload = {
                    animalId: selectedMovementAnimal,
                    animalName,
                    owner,
                    district,
                    fmdStatus,
                    anthraxStatus,
                    complianceScore,
                    isAuthorized: isAuthorizedForTransit
                  };

                  return (
                    <div className="space-y-4">
                      
                      {/* Pull summary results */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs font-semibold">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[10px]">REGISTERED OWNER:</span>
                          <span className="text-slate-700 truncate max-w-[170px]">{owner}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[10px]">BREED/DESCR:</span>
                          <span className="text-slate-705 text-slate-700">{animalName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[10px]">VET DISTRICT OFFICE:</span>
                          <span className="text-slate-700">{district} District</span>
                        </div>
                      </div>

                      {/* Bio-Traceability Audit */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Central Registry Vaccination Audit:</span>
                        <div className="space-y-1.5 text-xs font-bold text-slate-700">
                          <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                            <span className="flex items-center gap-1.5 font-sans">🛡️ Foot & Mouth Defense</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase ${fmdStatus === "Compliant" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                              {fmdStatus}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                            <span className="flex items-center gap-1.5 font-sans">🛡️ Anthrax Spore Ring Protection</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase ${anthraxStatus === "Compliant" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                              {anthraxStatus}
                            </span>
                          </div>
                        </div>

                        {/* Compliance Level progress */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                            <span>Compliance Level Score:</span>
                            <span>{complianceScore}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${complianceScore >= 80 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${complianceScore}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Branded Pass Card Preview */}
                      <div className="p-4 rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/20 to-violet-50/20 shadow-md space-y-4 relative overflow-hidden text-center">
                        
                        <div className="absolute top-1 left-1 opacity-25">
                          <Award className="w-12 h-12 text-indigo-400" />
                        </div>
                        
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono text-slate-400 block tracking-widest font-extrabold">REPUBLIC OF ZAMBIA</span>
                          <strong className="text-[10px] font-bold text-indigo-800 tracking-tight block">VETERINARY TRANSIT PERMIT QR-PASS CARD</strong>
                          <span className="text-[8px] text-slate-400 block font-mono">HASHID : {Math.random().toString(36).slice(2, 10).toUpperCase()}</span>
                        </div>

                        {/* The interactive verified scan-code QR */}
                        <div 
                          onClick={() => {
                            setCustomVerificationPayload(qrVerificationPayload);
                            setShowQrVerificationModal(true);
                          }}
                          className="w-28 h-28 bg-white border border-slate-200 p-2 rounded-xl shadow-xs mx-auto flex items-center justify-center cursor-pointer select-none relative group"
                        >
                          {/* Simulated scan code matrix */}
                          <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900" fill="currentColor">
                            <rect x="0" y="0" width="30" height="30" />
                            <rect x="5" y="5" width="20" height="20" fill="white" />
                            <rect x="10" y="10" width="10" height="10" />

                            <rect x="70" y="0" width="30" height="30" />
                            <rect x="75" y="5" width="20" height="20" fill="white" />
                            <rect x="80" y="10" width="10" height="10" />

                            <rect x="0" y="70" width="30" height="30" />
                            <rect x="5" y="75" width="20" height="20" fill="white" />
                            <rect x="10" y="80" width="10" height="10" />

                            <rect x="35" y="2" width="12" height="12" />
                            <rect x="12" y="35" width="12" height="12" />
                            <rect x="42" y="42" width="16" height="16" />
                            <rect x="65" y="45" width="10" height="20" />
                            <rect x="45" y="75" width="22" height="22" />
                            <rect x="80" y="35" width="15" height="15" />
                            <rect x="75" y="75" width="20" height="10" />
                            <rect x="85" y="85" width="15" height="15" />
                          </svg>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-xs rounded-xl flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none p-2">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                            <span className="text-[8px] font-mono text-white font-extrabold mt-1">CLICK TO SCANN VALIDATE</span>
                          </div>
                        </div>

                        <span className="text-[9px] text-slate-400 block font-mono">Click QR code to execute digital trust audit</span>

                        {isAuthorizedForTransit ? (
                          <div className="p-2 bg-emerald-50 border border-emerald-150 text-emerald-700 text-[10px] rounded-lg font-bold flex items-center justify-center gap-1.5 font-sans">
                            <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50/50" />
                            <span>TRANSIT PASS APPROVED</span>
                          </div>
                        ) : (
                          <div className="p-2 bg-rose-50 border border-rose-150 text-rose-700 text-[10px] rounded-lg font-bold flex items-center justify-center gap-1.5 font-sans">
                            <AlertTriangle className="w-4 h-4 text-rose-500 fill-rose-50/50" />
                            <span>HOLD ORDER: COMPLIANCE REJECTED</span>
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => {
                            alert("Creating certified Passage Card print file... System compiled!");
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-[10px] font-extrabold rounded-xl shadow cursor-pointer select-none transition"
                        >
                          Download Print card Passage Passport (PNG/PDF)
                        </button>
                      </div>

                    </div>
                  );
                })()}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* C. CAMPAIGNS SUBTAB */}
      {subTab === "vaccine" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white flex justify-between items-center">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-mono font-bold uppercase">Surveillance Programs</span>
              <h4 className="text-sm font-bold">Pathology Immunization Campaigns Log</h4>
              <p className="text-xs text-slate-400">District-wide rings and prophylactic immunizations monitoring dashboards.</p>
            </div>
            
            <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700/50 text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Total Target Population</span>
              <span className="text-base font-bold text-emerald-400 font-mono">17,000 Animals</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => {
              const pct = Math.round((camp.administeredCount / camp.targetCount) * 100);
              return (
                <div key={camp.id} className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-mono font-bold uppercase">{camp.disease}</span>
                      <h5 className="font-bold text-slate-800 text-xs pt-1">{camp.title}</h5>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      camp.status === "Active" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      {camp.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>Progress Coverage</span>
                      <span>{camp.administeredCount.toLocaleString()} / {camp.targetCount.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                    <span>District: {camp.targetDistrict}</span>
                    <span>Ends: {camp.endDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* D. SURGERY MANAGEMENT SUBTAB */}
      {subTab === "surgery" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-10">
          <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">Surgical scheduling & Post-operative records pipeline</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">Provides pre-operative physiological checks checklist, anesthesiology dosage calculator frames, recovery monitoring reports, surgical sutures batch registers, and vet surgeon commission splits ledger entries.</p>
          <div className="mt-4 p-4 rounded-xl border border-slate-100 bg-slate-50 text-left max-w-lg mx-auto text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span>Standard Surgical Service Fee:</span>
              <span className="font-bold">K4,800 + Supplies Costs</span>
            </div>
            <div className="flex justify-between">
              <span>Commission Sharing Splits:</span>
              <span className="font-bold text-indigo-600">60% Vet Specialist / 40% Clinic Node</span>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* I. Consultation logging */}
      {showConsultModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold">Log Clinical Consultation Record</h3>
                <p className="text-[10px] text-emerald-400 font-mono">Deducts 15 credits from centralized wallet</p>
              </div>
              <button onClick={() => setShowConsultModal(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateConsultation} className="p-6 space-y-4 text-xs">
              
              {cError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-500" /> {cError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Client Farmer Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Mukuni Ranching"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Animal Tag ID * (Index-linked)</label>
                  <input 
                    type="text" 
                    placeholder="e.g., BOV-2019-Z29"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={animalTag}
                    onChange={(e) => setAnimalTag(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Species / Class Description</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Anesthetic/Supplies service Cost (ZMW)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1 flex justify-between">
                    <span>PATHOLOGICAL CLINICAL FINDINGS (Vitals, temperatures etc) *</span>
                    <button 
                      type="button" 
                      onClick={triggerAiCopilotHelp}
                      className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-[8px] font-extrabold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Consult AI Copilot suggestions
                    </button>
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Describe clinical parameters: pulse, rumination rates, fever parameters..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Main Clinical Diagnosis *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., East Coast Fever (Theileriosis)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Recovery Prognosis</label>
                  <select 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={cStatus}
                    onChange={(e) => setCStatus(e.target.value as any)}
                  >
                    <option value="Under Treatment">Under Active Therapy</option>
                    <option value="Recovering">Recovering / Positive prognosis</option>
                    <option value="Healed">Completely Cleared & Healed</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Treatment Plan Administered</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Intramuscular Buparvaquone (Butalex) at 2.5mg/kg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Dispensed Medications (Prescriptions list, comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Cobactan, Terramycin LA, Vitamins Complex"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={prescVal}
                    onChange={(e) => setPrescVal(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400">Ledger Charge: <span className="font-extrabold text-slate-700">15 Credits</span></span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowConsultModal(false)} className="px-4 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">Approve Consultation & Post</button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* II. Transit movements permit cards creation */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold">Issue Official Transit Movement Card</h3>
                <p className="text-[10px] text-emerald-400 font-mono">Deducts 20 credits from central wallet on approval</p>
              </div>
              <button onClick={() => setShowMoveModal(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateMovementPermit} className="p-6 space-y-4 text-xs">
              
              {mError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-500" /> {mError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Origin District *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Choma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={mOriginD}
                    onChange={(e) => setMOriginD(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Destination District *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Lusaka Central"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={mDestD}
                    onChange={(e) => setMDestD(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Specific Origin Farm / Site Address *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Green Valley Dairy Farms Ltd Sector-B"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={mOriginF}
                    onChange={(e) => setMOriginF(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Destination Consignee Location *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Bonaventure Veterinary Feedlots, Lusaka"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={mDestF}
                    onChange={(e) => setMDestF(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Total Animals Count *</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={mCount}
                    onChange={(e) => setMCount(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block pb-1">Livestock Species Description</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={mSpecies}
                    onChange={(e) => setMSpecies(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Charged: <span className="font-extrabold text-slate-700">20 Credits</span></span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowMoveModal(false)} className="px-4 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">Issue Approved Movement Card</button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* III. QR compliance passport verification modal */}
      {showQrVerificationModal && customVerificationPayload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-indigo-900 to-indigo-950 text-white flex justify-between items-center border-b border-indigo-950">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Registry trust Network</h3>
                  <p className="text-[10px] text-emerald-300 font-mono">Cryptographic Passage Verification</p>
                </div>
              </div>
              <button onClick={() => setShowQrVerificationModal(false)} className="text-slate-400 hover:text-white font-extrabold text-sm p-1">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs font-medium">
              
              {/* Seal Banner status */}
              <div className={`p-4 rounded-2xl text-center space-y-1 border ${
                customVerificationPayload.isAuthorized 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                <div className="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center shadow-xs">
                  {customVerificationPayload.isAuthorized ? (
                    <Award className="w-7 h-7 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-7 h-7 text-rose-600" />
                  )}
                </div>
                <strong className="text-base font-extrabold block uppercase tracking-wider pt-1">
                  {customVerificationPayload.isAuthorized ? "AUTHORIZED FOR PASSAGE" : "DENIED / HOLD ORDER"}
                </strong>
                <span className="text-[9px] font-mono font-bold block opacity-75">
                  AUDIT TIMESTAMP: {new Date().toISOString().split("T")[0]} 12:45 UTC
                </span>
              </div>

              {/* Bio details list */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-mono">Registry Bio-Traceability Audit</span>
                
                <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5 font-mono">
                    <span>LIVESTOCK TAG ID:</span>
                    <strong className="text-slate-800 font-black">{customVerificationPayload.animalId}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 py-1.5 font-sans">
                    <span>FARM OWNER:</span>
                    <strong className="text-slate-900 truncate max-w-[160px]">{customVerificationPayload.owner}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 py-1.5 font-sans">
                    <span>BREED CLASS:</span>
                    <strong className="text-slate-705 text-slate-700">{customVerificationPayload.animalName}</strong>
                  </div>
                  <div className="flex justify-between pt-1.5 font-mono">
                    <span>VACCINE COMPLIANCE SCORE:</span>
                    <strong className={customVerificationPayload.complianceScore >= 80 ? "text-emerald-600 font-black" : "text-amber-600 font-black"}>
                      {customVerificationPayload.complianceScore}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Digital blockchain credentials stamps */}
              <div className="p-3.5 rounded-xl border border-slate-250 bg-slate-50 text-[10px] text-slate-500 font-mono space-y-1">
                <div className="flex justify-between">
                  <span>REGISTRY PUBLIC ROOT KEY:</span>
                  <span className="font-extrabold text-slate-700 truncate max-w-[120px]">mbl_root_sec_01f92</span>
                </div>
                <div className="flex justify-between">
                  <span>DIGITAL CERTIFICATE HASH:</span>
                  <span className="font-extrabold text-slate-700 truncate max-w-[120px]">sha256-a9bd91d1e67b2ff</span>
                </div>
                <div className="flex justify-between text-[9px] pt-1.5 border-t text-slate-400">
                  <span>ISSUER NODE:</span>
                  <span className="font-bold">MINISTRY-AGR-CHOMA-ZAM</span>
                </div>
              </div>

              {!customVerificationPayload.isAuthorized && (
                <div className="p-3 bg-amber-50 border border-amber-250 text-amber-800 text-[10px] rounded-xl font-bold flex gap-2">
                  <Info className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Cattle from active quarantine districts (Choma / Chisamba) cannot transit without special quarantine permit stamps. Run boosters to unlock.</span>
                </div>
              )}

              <button 
                type="button" 
                onClick={() => setShowQrVerificationModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold rounded-2xl cursor-pointer text-center select-none shadow hover:shadow-md transition active:scale-98"
              >
                Clear Audit Certificate Validation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
