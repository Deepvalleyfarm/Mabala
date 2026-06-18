import React, { useState, useMemo } from "react";
import { LivestockRecord } from "../types";
import { 
  Check, ArrowRight, ArrowLeft, Camera, Shield, FileCheck, 
  MapPin, Heart, QrCode, ClipboardList 
} from "lucide-react";

interface AnimalRegistrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: LivestockRecord) => void;
  currencySymbol: string;
  existingCount: number;
}

const SPECIES_PRESETS = [
  { id: "Cattle", label: "Cattle", icon: "🐂", description: "Bovine / Cow herd nodes" },
  { id: "Goats", label: "Goats", icon: "🐐", description: "Caprine meat & dairy nodes" },
  { id: "Sheep", label: "Sheep", icon: "🐑", description: "Ovine breeding units" },
  { id: "Pigs", label: "Pigs", icon: "🐖", description: "Porcine husbandry clusters" },
  { id: "Donkeys", label: "Donkeys", icon: "🫏", description: "Equine draft animal support" },
  { id: "Horses", label: "Horses", icon: "🐎", description: "Equine transportation & sport" },
  { id: "Rabbits", label: "Rabbits", icon: "🐇", description: "Lagomorph micro-farming" },
  { id: "Other", label: "Other", icon: "🐾", description: "Custom agricultural species" },
];

const BREED_PRESETS: Record<string, string[]> = {
  Cattle: ["Boran Stud", "Angus Breed", "Hereford Cattle", "Sahiwal Bull", "Brahman Stud", "Dairy Holstein-Friesian"],
  Goats: ["Boer Stud Goat", "Kalahari Red Goat", "Saanen Dairy Goat", "Savanna White Goat", "Local Gwembe Kid"],
  Sheep: ["Dorper Mutton", "Damara Fat-tail", "Merino Fine-wool", "Suffolk Meat Sheep", "Local Zambian Fat-tail"],
  Pigs: ["Large White Porker", "Landrace Sow breed", "Duroc Studer", "Hampshire Red Line", "Local Village Pig"],
  Donkeys: ["Abyssinian Donkey", "Masai Donkey", "Zambian Landrace Donkey"],
  Horses: ["Thoroughbred Racer", "Appaloosa Stud", "Arabian Warmblood", "Zambian Cross-draught"],
  Rabbits: ["New Zealand White Fryer", "California Meat Rabbit", "Flemish Giant Breed", "Chinchilla Fur line"],
  Other: ["Local Multi-breed Mix", "Standard Hybrid Selection"],
};

export default function AnimalRegistrationWizard({
  isOpen,
  onClose,
  onSave,
  currencySymbol,
  existingCount
}: AnimalRegistrationWizardProps) {
  const [step, setStep] = useState(1);

  // Form states
  const [species, setSpecies] = useState("Cattle");
  const [customSpecies, setCustomSpecies] = useState("");
  const [breed, setBreed] = useState("Boran Stud");
  const [customBreed, setCustomBreed] = useState("");
  const [tagId, setTagId] = useState("");
  const [animalName, setAnimalName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Female");
  const [dob, setDob] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [section, setSection] = useState("A-Block");
  const [paddock, setPaddock] = useState("Paddock 4");
  const [vaccinationStatus, setVaccinationStatus] = useState("Up to Date");
  const [healthNotes, setHealthNotes] = useState("Healthy specimen, verified by supervisor.");

  // Generate Unique ID and assets on fly
  const finalSpecies = useMemo(() => {
    return species === "Other" ? (customSpecies.trim() || "Other") : species;
  }, [species, customSpecies]);

  const finalBreed = useMemo(() => {
    return breed === "Other" ? (customBreed.trim() || "Other") : breed;
  }, [breed, customBreed]);

  const generatedId = useMemo(() => {
    const specUpper = finalSpecies.toUpperCase().substring(0, 4);
    const orderNum = String(existingCount + 1).padStart(5, "0");
    return `MBL-${specUpper}-${orderNum}`;
  }, [finalSpecies, existingCount]);

  const finalTagId = useMemo(() => {
    return tagId.trim() || generatedId;
  }, [tagId, generatedId]);

  const progressPercent = (step / 6) * 100;

  const handleNext = () => {
    if (step < 6) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleSave = () => {
    const record: LivestockRecord = {
      id: "lv-wiz-" + Date.now(),
      type: finalSpecies,
      species: finalSpecies,
      breed: finalBreed,
      tagId: finalTagId,
      gender: gender,
      acquisitionType: "Birthed",
      source: "Mabala Self-Registry Wizard",
      dateAcquired: dob,
      purchasePrice: 0,
      currentValue: species === "Cattle" ? 12000 : species === "Goats" ? 3500 : 2500,
      status: "Active",
      farmId: "farm-1",
      dob: dob,
      age: "0 months",
      photos: {
        profile: photoUrl.trim() || "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=150"
      },
      healthEvents: [],
      feedingLogs: [],
      color: "Standard markings",
      weight: species === "Cattle" ? 45 : species === "Goats" ? 8 : 6,
      sire: "Herd Sire Code",
      dam: "Dam Breeder Code",
    };
    onSave(record);
    // Reset Form
    setStep(1);
    setTagId("");
    setAnimalName("");
    setPhotoUrl("");
    setCustomSpecies("");
    setCustomBreed("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="animal-wizard-overlay">
      <div className="bg-white rounded-3xl max-w-3xl w-full flex flex-col shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all">
        
        {/* Wizard Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 text-white flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block font-mono">Simple Livestock Operating System</span>
            <h2 className="text-lg font-extrabold tracking-tight">Onboard Animal Registration Wizard</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-3 text-xs bg-slate-800 hover:bg-slate-700/80 rounded-xl font-bold cursor-pointer transition-all border border-slate-700 text-slate-300"
          >
            ✕ Exit
          </button>
        </div>

        {/* Level Indicator Progress Bar */}
        <div className="w-full bg-slate-100 h-2">
          <div 
            className="bg-emerald-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Badge Row */}
        <div className="px-6 py-3 border-b bg-slate-50 flex justify-between items-center text-xs text-slate-500 font-bold font-sans">
          <span>Step {step} of 6 : <span className="text-slate-800">{
            step === 1 ? "Animal Species Category" :
            step === 2 ? "Biological Profile Information" :
            step === 3 ? "Onboarding Snapshot Image" :
            step === 4 ? "Ownership, Farm & Pasture Coordinates" :
            step === 5 ? "Sub-Herd Immunity & Vaccinations" :
            "Review Certificate Summary"
          }</span></span>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider font-mono">
            Onboarding Mode
          </span>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[60vh] min-h-[350px]">
          
          {/* STEP 1: Animal Type Selection */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center max-w-md mx-auto pb-2">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">Select animal species category</h3>
                <p className="text-slate-500 text-xs mt-1">Which species cluster represents the new dynamic asset profile?</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                {SPECIES_PRESETS.map((p) => {
                  const isSelected = species === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSpecies(p.id);
                        const defaultBreeds = BREED_PRESETS[p.id] || [];
                        setBreed(defaultBreeds[0] || "Other");
                      }}
                      className={`p-4 text-center rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 min-h-[110px] focus:outline-none ${
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50/50"
                      }`}
                    >
                      <span className="text-3xl filter hover:scale-115 transition-transform">{p.icon}</span>
                      <div>
                        <span className="font-extrabold text-xs block leading-tight">{p.label}</span>
                        <span className={`text-[8.5px] mt-0.5 block leading-tight opacity-75 truncate max-w-[120px] ${isSelected ? "text-slate-200" : "text-slate-400"}`}>
                          {p.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {species === "Other" && (
                <div className="bg-amber-50/50 border border-amber-200/70 p-4 rounded-xl mt-4 max-w-md mx-auto">
                  <label className="text-[10px] font-black uppercase text-amber-800 block pb-1.5">Enter Custom Animal Species Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Camel, Alpaca, Fish"
                    value={customSpecies}
                    onChange={(e) => setCustomSpecies(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-800 text-xs font-bold text-slate-800 shadow-3xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Animal Profiles Detail Form */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block pb-1">Animal Name / Cohort ID</label>
                  <input
                    type="text"
                    placeholder="e.g. Bessie / Big Bull"
                    value={animalName}
                    onChange={(e) => setAnimalName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white text-slate-800 font-bold text-xs rounded-xl outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block pb-1">Ear Tag ID (Manual Override)</label>
                  <input
                    type="text"
                    placeholder="Leave blank to generate automatically"
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white font-mono text-slate-800 font-bold text-xs rounded-xl outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block pb-1">Registered Breed</label>
                  <select
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white font-bold text-xs text-slate-800 rounded-xl outline-none focus:border-slate-800"
                  >
                    {(BREED_PRESETS[species] || []).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="Other">Add Custom Breed...</option>
                  </select>
                </div>

                {breed === "Other" && (
                  <div>
                    <label className="text-[10px] font-black uppercase text-amber-800 block pb-1">Enter Custom Breed Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Red Angus Hybrid"
                      value={customBreed}
                      onChange={(e) => setCustomBreed(e.target.value)}
                      className="w-full p-2.5 border border-amber-300 bg-amber-50/20 text-slate-800 font-bold text-xs rounded-xl outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block pb-1">Animal Gender</label>
                  <div className="grid grid-cols-2 gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setGender("Male")}
                      className={`p-2.5 text-xs font-bold rounded-xl border cursor-pointer ${gender === "Male" ? "bg-slate-900 border-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("Female")}
                      className={`p-2.5 text-xs font-bold rounded-xl border cursor-pointer ${gender === "Female" ? "bg-slate-900 border-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block pb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white font-mono text-slate-800 font-bold text-xs rounded-xl outline-none focus:border-slate-800"
                  />
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: Snapshot Image Upload mock */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in pb-2">
              <div className="text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-full bg-slate-100 border text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Attach Snapshot Photos</h3>
                <p className="text-slate-500 text-xs mt-1">Provide a passport portrait URL to enrich the visual certificate profile</p>
              </div>

              <div className="max-w-md mx-auto space-y-3.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block pb-1">Live Image Link URL</label>
                  <input
                    type="url"
                    placeholder="Paste un-rounded image URL (optional)"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white text-slate-800 font-bold text-xs rounded-xl outline-none focus:border-slate-800"
                  />
                </div>

                <div className="text-center pt-2">
                  <span className="text-[10px] text-slate-400 block">Or select a standard model placeholder:</span>
                  <div className="mt-2.5 flex justify-center gap-2">
                    {[
                      { l: "🐂 Hereford Calf", u: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=150" },
                      { l: "🐐 Boer Kid", u: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=150" },
                      { l: "🐑 Dorper Ewe", u: "https://images.unsplash.com/photo-1484557985045-ebd25e08ae73?w=150" }
                    ].map((btn, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => setPhotoUrl(btn.u)}
                        className={`px-3 py-1.5 border hover:border-slate-400 rounded-lg text-[10px] font-bold bg-white text-slate-700 shadow-3xs cursor-pointer ${photoUrl === btn.u && "border-slate-900 bg-slate-50 text-slate-900"}`}
                      >
                        {btn.l}
                      </button>
                    ))}
                  </div>
                </div>

                {photoUrl && (
                  <div className="flex justify-center pt-3">
                    <img 
                      src={photoUrl} 
                      alt="Profile preview" 
                      className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-md ring-2 ring-emerald-500/25"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Ownership Details */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-300 block pb-1">Affiliated Farm Site</label>
                  <input
                    type="text"
                    disabled
                    value="Primary Mabala Operating Hub"
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 cursor-not-allowed text-slate-500 font-bold text-xs rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block pb-1">Farm Block / Compartment</label>
                  <input
                    type="text"
                    placeholder="e.g. Block A, West Fields"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white text-slate-800 font-bold text-xs rounded-xl outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 block pb-1">Paddock Range Coordinate</label>
                  <input
                    type="text"
                    placeholder="e.g. Paddock 9 Ranger, Southern pasture"
                    value={paddock}
                    onChange={(e) => setPaddock(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white text-slate-800 font-bold text-xs rounded-xl outline-none"
                  />
                </div>

              </div>
            </div>
          )}

          {/* STEP 5: Health & Vaccinations */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 gap-4">
                
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block pb-1</div>">Herd Immunity Status</label>
                  <select
                    value={vaccinationStatus}
                    onChange={(e) => setVaccinationStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white font-bold text-xs text-slate-800 rounded-xl outline-none focus:border-slate-800"
                  >
                    <option value="Up to Date">✓ Completed Base Vaccinations (Up to Date)</option>
                    <option value="Partially Vaccinated">⚠ Partially Protected (Awaiting Schedules)</option>
                    <option value="Not Vaccinated">⚠ Unprotected (Unvaccinated State)</option>
                    <option value="Overdue">🔴 Critical Schedules Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block pb-1">Biological Health Vitals & Notes</label>
                  <textarea
                    rows={4}
                    placeholder="Describe diagnostic checks, physical scores, or marking details..."
                    value={healthNotes}
                    onChange={(e) => setHealthNotes(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white font-semibold text-xs text-slate-800 rounded-xl outline-none focus:border-slate-800 resize-none"
                  />
                </div>

              </div>
            </div>
          )}

          {/* STEP 6: Review & Certificate generation */}
          {step === 6 && (
            <div className="space-y-5 animate-fade-in font-sans">
              
              {/* Registration Certificate with Double Borders mock */}
              <div className="border-4 border-slate-900 p-6 rounded-2xl bg-slate-50 relative overflow-hidden" id="printable-certificate">
                
                {/* Decorative Seal Background */}
                <div className="absolute right-[-20px] top-[-20px] w-48 h-48 rounded-full bg-emerald-500/10 flex items-center justify-center -rotate-12 border border-dashed border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">OFFICIAL SEAL • APPROVED</span>
                </div>

                {/* Passport Stamp and ID Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-dashed border-slate-200 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600 inline shrink-0" />
                      <span>MABALA REGISTRATION CERTIFICATE</span>
                    </h3>
                    <p className="text-[10px] font-bold text-emerald-700 mt-0.5 tracking-wider font-mono">UNIVERSAL REGISTRATION COMPLIANT</p>
                  </div>
                  <div className="bg-slate-200 border text-slate-800 px-3 py-1 rounded font-mono font-bold text-[10.5px]">
                    <span className="text-[9px] text-slate-400 block uppercase">Generated ID</span>
                    {generatedId}
                  </div>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-4">
                  
                  {/* Portrait photo */}
                  <div className="sm:col-span-3 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-xl border border-slate-300 overflow-hidden bg-slate-200 shadow-sm relative">
                      <img 
                        src={photoUrl.trim() || "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=150"} 
                        alt="Onboarded profile" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono font-bold mt-1 uppercase tracking-wider">Mabala Captured</span>
                  </div>

                  {/* Text properties */}
                  <div className="sm:col-span-6 grid grid-cols-2 gap-y-3.5 text-xs font-semibold">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase font-sans">Animal Name</span>
                      <span className="text-slate-800 font-extrabold text-sm block">{animalName || "Bessie"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase font-sans">Verified Tag ID</span>
                      <span className="text-amber-800 font-mono font-extrabold text-sm block">{finalTagId}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase font-sans">Species Class</span>
                      <span className="text-slate-700 block">{finalSpecies}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase font-sans">Breed Type</span>
                      <span className="text-slate-700 block">{finalBreed}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase font-sans">Gender</span>
                      <span className="text-slate-700 block">{gender}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase font-sans">Date of Birth</span>
                      <span className="text-slate-700 font-mono block">{dob}</span>
                    </div>
                  </div>

                  {/* QR Code section */}
                  <div className="sm:col-span-3 flex flex-col items-center border border-dashed border-slate-300 p-2 bg-white rounded-xl">
                    <QrCode className="w-16 h-16 text-slate-900" />
                    <span className="text-[8px] text-slate-400 font-mono font-bold uppercase tracking-widest mt-1">Scan Verified</span>
                  </div>
                </div>

                {/* Lower meta */}
                <div className="border-t border-dashed border-slate-200 mt-4 pt-4.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-bold text-slate-500">
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">Coordinates Range</span>
                    <span className="text-slate-800 truncate block">{section} • {paddock}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">Immunity Protection</span>
                    <span className="text-emerald-600 font-black block">{vaccinationStatus}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">Operational Status</span>
                    <span className="text-indigo-600 block">Verified Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div>
            {step > 1 && (
              <button 
                type="button"
                onClick={handleBack}
                className="px-4 py-2 bg-white hover:bg-slate-100 border text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-3xs transition-all active:scale-98"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>

            {step < 6 ? (
              <button 
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 hover:shadow"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 hover:shadow"
              >
                <FileCheck className="w-4 h-4" />
                Onboard Asset Profile
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
