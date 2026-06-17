import React, { useState } from "react";
import { 
  PlusCircle, Search, Filter, ShieldCheck, MapPin, Phone, Mail, Award, AlertTriangle, Check
} from "lucide-react";
import { VetClient, VetFarm } from "./types";

interface CrmTabProps {
  clients: VetClient[];
  onAddClient: (newClient: Omit<VetClient, "id" | "onboardedDate">) => boolean; // returns success if credits allowed
  credits: number;
  clientIdForNewFarm?: string;
  onAddFarmToClient?: (clientId: string, farm: { name: string; sizeHectares: number; speciesList: string[]; diseaseHistory: string[] }) => boolean;
}

export default function CrmTab({
  clients,
  onAddClient,
  credits
}: CrmTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState("All");
  const [filterRisk, setFilterRisk] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<VetClient["type"]>("Farmer");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("Livingstone");
  const [province, setProvince] = useState("Southern Province");
  const [gpsCoords, setGpsCoords] = useState("-17.83, 25.85");
  const [herdSize, setHerdSize] = useState(120);
  const [riskCategory, setRiskCategory] = useState<VetClient["riskCategory"]>("Moderate");
  const [assignedVetId, setAssignedVetId] = useState("vet-noah");

  const [formError, setFormError] = useState("");

  const handleRegisterClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactPerson || !phone || !email) {
      setFormError("Please fill in all required fields (Name, Contact Person, Phone, Email)");
      return;
    }

    if (credits < 5) {
      setFormError("Insufficient credits! Client registration requires 5 credits. Please purchase more credits.");
      return;
    }

    const success = onAddClient({
      name,
      type,
      contactPerson,
      phone,
      email,
      address,
      district,
      province,
      gpsCoords,
      herdSize: Number(herdSize),
      riskCategory,
      assignedVetId
    });

    if (success) {
      // Clear Form & Close Model
      setName("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setAddress("");
      setFormError("");
      setShowAddModal(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = filterRegion === "All" || c.province === filterRegion;
    const matchesRisk = filterRisk === "All" || c.riskCategory === filterRisk;
    return matchesSearch && matchesRegion && matchesRisk;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Search and filter action lines */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full md:max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input 
            type="text" 
            placeholder="Search clients by name, contact, district..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Province select */}
          <select 
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
          >
            <option value="All">All Provinces</option>
            <option value="Southern Province">Southern Province</option>
            <option value="Eastern Province">Eastern Province</option>
            <option value="Luapula Province">Luapula Province</option>
            <option value="Central Province">Central Province</option>
          </select>

          {/* Risk Level */}
          <select 
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
          >
            <option value="All">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Moderate">Moderate Risk</option>
            <option value="High">High Risk</option>
          </select>

          <button 
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white rounded-xl flex items-center gap-1.5 shadow active:scale-98 transition ml-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Register Clients (Costs 5 Credits)
          </button>
        </div>
      </div>

      {/* Grid of clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="client-crm-grid">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="space-y-4">
              {/* Client header card */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-mono text-[9px] font-extrabold rounded uppercase tracking-wider">
                    {client.type}
                  </span>
                  <h4 className="text-base font-bold text-slate-800 leading-tight pt-1">{client.name}</h4>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">ID: {client.id} Onboarded: {client.onboardedDate}</div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                  client.riskCategory === "High" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                  client.riskCategory === "Moderate" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                  "bg-emerald-50 text-emerald-700 border border-emerald-100"
                }`}>
                  {client.riskCategory} Risk
                </span>
              </div>

              {/* Bio Grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Contact Person</span>
                  <span className="font-bold text-slate-700">{client.contactPerson}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Herd / Population</span>
                  <span className="font-bold font-mono text-slate-800">{client.herdSize} Animals</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Physical Site Address</span>
                  <span className="font-medium text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {client.address}, {client.district}
                  </span>
                </div>
              </div>

              {/* Contact metadata */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-4 flex-wrap text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {client.phone}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {client.email}</span>
                <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-slate-400" /> GPS: {client.gpsCoords}</span>
              </div>
            </div>

            {/* Diagnostic/Treatment activity summary status bar */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-bold flex items-center gap-1 text-emerald-600">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Active Biological Ledger
              </span>
              <span className="text-slate-400 font-mono">District ID: {client.district.toUpperCase().slice(0, 3)}</span>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-2 py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <span className="text-xs text-slate-500 font-medium font-mono">No matching veterinary client registries found.</span>
          </div>
        )}
      </div>

      {/* 5. Onboarding Modal form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold">Register New Veterinary Client Card</h3>
                <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">Unified biological index registry</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterClient} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Client / Org Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Mosi Farms Cattle Co."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Client Type *</label>
                  <select 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-600"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                  >
                    <option value="Farmer">Individual Farmer</option>
                    <option value="Commercial Farm">Commercial Farm</option>
                    <option value="Cooperative">Cooperative Hub</option>
                    <option value="Ranch">Ranching Estate</option>
                    <option value="Dairy Farm">Dairy Farm Operator</option>
                    <option value="Pig Farm">Swine Producer Unit</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Primary Representative *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Charles Mukuni"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Primary Phone Contact *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 0977xxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Active Email *</label>
                  <input 
                    type="email" 
                    placeholder="e.g., admin@mosi.farm"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Initial Herd Size count</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                    value={herdSize}
                    onChange={(e) => setHerdSize(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Pathological Risk Profile</label>
                  <select 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-600"
                    value={riskCategory}
                    onChange={(e) => setRiskCategory(e.target.value as any)}
                  >
                    <option value="Low">Low Bio Security Risk</option>
                    <option value="Moderate">Moderate Bio Security Risk</option>
                    <option value="High">High Pathogenic Hazard Risk</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Physical Address *</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g., Plot 11, Batoka Siding road, Choma district"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none resize-none"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-mono">Deducts: <span className="font-bold text-slate-600">5 Credits</span> from Wallet</span>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/15 cursor-pointer flex items-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" /> Approve & Spend Credits
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
