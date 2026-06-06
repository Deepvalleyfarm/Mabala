import React, { useState } from "react";
import { FishBatch, WaterQualityReading } from "../types";
import { Waves, Plus, Activity, Droplet, Thermometer, Database, Check, AlertTriangle } from "lucide-react";

interface AquaculturePanelProps {
  batches: FishBatch[];
  onAddFishBatch: (batch: FishBatch) => void;
  onAddWaterReading: (batchId: string, reading: WaterQualityReading) => void;
  isReadonly: boolean;
  currencySymbol: string;
}

export default function AquaculturePanel({
  batches,
  onAddFishBatch,
  onAddWaterReading,
  isReadonly,
  currencySymbol
}: AquaculturePanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");

  // New Batch Form State
  const [strain, setStrain] = useState("Siavonga Red Tilapia");
  const [pondName, setPondName] = useState("Earthen Pond 3");
  const [quantity, setQuantity] = useState(5000);
  const [system, setSystem] = useState<"Pond" | "Cage" | "Tank">("Pond");

  // New Reading Form State
  const [ph, setPh] = useState(7.2);
  const [doLevel, setDoLevel] = useState(5.5);
  const [temp, setTemp] = useState(26.8);
  const [ammonia, setAmmonia] = useState(0.015);
  const [nitrite, setNitrite] = useState(0.05);

  const activeBatch = batches.find(b => b.id === (selectedBatchId || batches[0]?.id));

  const handlePostBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pondName || !strain) return;

    const nb: FishBatch = {
      id: "fish-" + Date.now(),
      batchId: `TIL-2026-00${batches.length + 1}`,
      species: "Nile Tilapia",
      strain,
      productionSystem: system,
      pondName,
      stockingQuantity: quantity,
      currentFishCount: quantity,
      averageWeightStockingG: 10,
      targetMarketWeightG: 400,
      expectedHarvestDate: "2026-11-20",
      status: "Stocked",
      feedLogs: [],
      weightSamplings: [],
      waterReadings: [
        { date: "2026-05-26", pH: 7.2, doLevel: 5.5, temp: 26.5, ammonia: 0.012, nitrite: 0.04 }
      ],
      mortalityLogs: [],
      harvests: [],
      sales: [],
      waterInterventions: [],
      medications: [],
      farmId: "farm-1"
    };

    onAddFishBatch(nb);
    setShowAddForm(false);
  };

  const handleSaveWaterReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatch) return;

    const r: WaterQualityReading = {
      date: new Date().toISOString().split('T')[0],
      pH: Number(ph),
      doLevel: Number(doLevel),
      temp: Number(temp),
      ammonia: Number(ammonia),
      nitrite: Number(nitrite)
    };

    onAddWaterReading(activeBatch.id, r);
    setShowReadingForm(false);
  };

  // Stocking Density Checks (Standard volume 500m3 for Earther Ponds)
  const pondVolumeM3 = 500;
  const stockingDensity = activeBatch ? (activeBatch.currentFishCount / pondVolumeM3) : 0;
  const limitsExceeded = stockingDensity > 12; // Tilapia standard trigger

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Status statistics block */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold">
            <span>Aquatic Production Units</span>
            <Waves className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-800">{batches.length} Active System Ponds</div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Standardized biological biomass accounting</p>
        </div>

        {/* Real-time stocking density widget */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold">
            <span>Stocking Density check</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          {activeBatch ? (
            <>
              <div className="text-2xl font-bold mt-1 text-slate-800">{stockingDensity.toFixed(1)} fish/m³</div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full ${limitsExceeded ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`}></span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {limitsExceeded ? "Overstocked! Oxygen collapse risk!" : "Ideal Stocking Volume Verified"}
                </span>
              </div>
            </>
          ) : (
            <div className="text-sm font-semibold text-slate-400 mt-2">No active ponds selected</div>
          )}
        </div>

        {/* Feeding cost accumulation card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold">
            <span>Water Quality reference</span>
            <Droplet className="w-4 h-4 text-emerald-400 animate-bounce" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-800">Tilapia Standards</div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Temp: 25-32°C • pH: 6.5-8.5 • NH3 &lt; 0.02mg/L</p>
        </div>

      </div>

      {showAddForm && (
        <form onSubmit={handlePostBatch} className="bg-white p-5 rounded-xl border space-y-4 animate-fade-in" id="fish-form">
          <h4 className="text-xs uppercase font-extrabold text-slate-800">Initialize Tilapia Pond System</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input type="text" placeholder="e.g. Siavonga Cage 4" value={pondName} onChange={e => setPondName(e.target.value)} required className="text-xs border p-2 rounded" />
            <select value={system} onChange={e => setSystem(e.target.value as any)} className="text-xs border p-2 rounded text-slate-700">
              <option value="Pond">Earthen Pond</option>
              <option value="Cage">Floating Cage System</option>
              <option value="Tank">Race Way / Concrete Tank</option>
            </select>
            <input type="number" placeholder="Quantity fingerlings stock" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required className="text-xs border p-2 rounded" />
            <input type="text" placeholder="Nile Tilapia strain name" value={strain} onChange={e => setStrain(e.target.value)} required className="text-xs border p-2 rounded" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-1.5 bg-slate-100 rounded text-xs font-semibold">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded text-xs">Save Unit</button>
          </div>
        </form>
      )}

      {/* Main Pond display module split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Pond List */}
        <div className="md:col-span-4 bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
            <span className="font-extrabold text-xs text-slate-800 uppercase">Interactive Pond Select</span>
            <button onClick={() => setShowAddForm(true)} className="text-xs font-bold text-emerald-600 hover:underline">+ Production Unit</button>
          </div>
          <div className="divide-y">
            {batches.map(b => (
              <button
                key={b.id}
                onClick={() => { setSelectedBatchId(b.id); setShowReadingForm(false); }}
                className={`w-full p-4 text-left flex items-center justify-between transition-all hover:bg-slate-50/60 ${
                  activeBatch?.id === b.id ? "bg-emerald-500/10 border-l-4 border-emerald-500" : ""
                }`}
              >
                <div>
                  <h5 className="font-bold text-xs text-slate-900">{b.pondName}</h5>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{b.batchId} • {b.strain}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-700 block">{b.currentFishCount} fish</span>
                  <span className="text-[10px] text-slate-400 block italic">{b.productionSystem}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Pond Dash Details */}
        <div className="md:col-span-8 space-y-6">
          {activeBatch ? (
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden p-6 space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b pb-4 flex-wrap gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Water Quality parameters: {activeBatch.pondName}</h3>
                  <p className="text-[11px] text-slate-500">Continuous logs vs Tilapia reference standards. Oxygen drop blocks feeding schedules.</p>
                </div>
                <button 
                  onClick={() => setShowReadingForm(!showReadingForm)}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold"
                >
                  + Add Daily Reading
                </button>
              </div>

              {/* Reading Inputs */}
              {showReadingForm && (
                <form onSubmit={handleSaveWaterReading} className="bg-slate-50 p-4 rounded-xl border space-y-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block tracking-wider">Log Physical & Chemical Parameters</span>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-500">pH level</label>
                      <input type="number" step="0.1" value={ph} onChange={e => setPh(Number(e.target.value))} required className="w-full text-xs p-1.5 border bg-white rounded" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-500">Dissolved O2 (mg/L)</label>
                      <input type="number" step="0.1" value={doLevel} onChange={e => setDoLevel(Number(e.target.value))} required className="w-full text-xs p-1.5 border bg-white rounded" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-500">Temp (°C)</label>
                      <input type="number" step="0.1" value={temp} onChange={e => setTemp(Number(e.target.value))} required className="w-full text-xs p-1.5 border bg-white rounded" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-500">Ammonia NH3</label>
                      <input type="number" step="0.001" value={ammonia} onChange={e => setAmmonia(Number(e.target.value))} required className="w-full text-xs p-1.5 border bg-white rounded" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-500">Nitrite NO2</label>
                      <input type="number" step="0.01" value={nitrite} onChange={e => setNitrite(Number(e.target.value))} required className="w-full text-xs p-1.5 border bg-white rounded" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowReadingForm(false)} className="px-3 py-1 bg-slate-200 text-[10px] uppercase font-bold rounded">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white text-[10px] uppercase font-bold rounded">Log parameters</button>
                  </div>
                </form>
              )}

              {/* Water quality Warnings indicators */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {activeBatch.waterReadings.slice(-1).map((r, i) => {
                  const isPhWarn = r.pH < 6.5 || r.pH > 8.5;
                  const isDoWarn = r.doLevel < 4.0;
                  const isTempWarn = r.temp < 25 || r.temp > 32;
                  const isAmmoniaWarn = r.ammonia >= 0.02;
                  const isNitriteWarn = r.nitrite >= 0.1;

                  return (
                    <React.Fragment key={i}>
                      <div className={`p-3 rounded-lg border text-center ${isPhWarn ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-emerald-50 border-emerald-100 text-emerald-800"}`}>
                        <span className="text-[9px] font-bold block uppercase text-slate-400">Pond pH</span>
                        <strong className="text-lg block font-mono mt-1">{r.pH}</strong>
                        <span className="text-[9px] block text-slate-500 mt-1">{isPhWarn ? "🚨 Outside limit!" : "✓ Stable"}</span>
                      </div>

                      <div className={`p-3 rounded-lg border text-center ${isDoWarn ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-emerald-50 border-emerald-100 text-emerald-800"}`}>
                        <span className="text-[9px] font-bold block uppercase text-slate-400">Oxygen DO</span>
                        <strong className="text-lg block font-mono mt-1">{r.doLevel} mg/L</strong>
                        <span className="text-[9px] block text-slate-500 mt-1">{isDoWarn ? "🚨 Collapsing!" : "✓ Rich O2"}</span>
                      </div>

                      <div className={`p-3 rounded-lg border text-center ${isTempWarn ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-emerald-50 border-emerald-100 text-emerald-800"}`}>
                        <span className="text-[9px] font-bold block uppercase text-slate-400">Temp</span>
                        <strong className="text-lg block font-mono mt-1">{r.temp}°C</strong>
                        <span className="text-[9px] block text-slate-500 mt-1">{isTempWarn ? "🚨 Out range!" : "✓ Nominal"}</span>
                      </div>

                      <div className={`p-3 rounded-lg border text-center ${isAmmoniaWarn ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-emerald-50 border-emerald-100 text-emerald-800"}`}>
                        <span className="text-[9px] font-bold block uppercase text-slate-400">Ammonia NH3</span>
                        <strong className="text-lg block font-mono mt-1">{r.ammonia} pH</strong>
                        <span className="text-[9px] block text-slate-500 mt-1">{isAmmoniaWarn ? "🚨 Hazardous!" : "✓ Safe levels"}</span>
                      </div>

                      <div className={`p-3 rounded-lg border text-center ${isNitriteWarn ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-emerald-50 border-emerald-100 text-emerald-800"}`}>
                        <span className="text-[9px] font-bold block uppercase text-slate-400">Nitrite NO2</span>
                        <strong className="text-lg block font-mono mt-1">{r.nitrite} mg/L</strong>
                        <span className="text-[9px] block text-[#6b7280] mt-1">{isNitriteWarn ? "🚨 High Toxic!" : "✓ Clear"}</span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Time-series parameters chart (SVG-drawn metrics) */}
              <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest block">Time-Series Oxygen & pH Trend (D3-like SVG)</span>
                
                <div className="h-44 w-full flex items-end relative border-b border-l border-slate-300 pb-2 pl-2">
                  {/* Draw SVG Grid representation */}
                  <svg className="absolute inset-0 w-full h-full text-slate-300 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="25%" x2="100%" y2="25%" stroke="currentColor" strokeDasharray="4 4" strokeWidth="0.5" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeDasharray="4 4" strokeWidth="0.5" />
                    <line x1="0" y1="75%" x2="100%" y2="75%" stroke="currentColor" strokeDasharray="4 4" strokeWidth="0.5" />
                    
                    {/* Time series lines */}
                    {activeBatch.waterReadings.length >= 2 && (
                      <>
                        {/* oxygen line: blue */}
                        <path 
                          d={`M 20 ${150 - activeBatch.waterReadings[0].doLevel * 20} L 250 ${150 - activeBatch.waterReadings[1].doLevel * 20}`} 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="3" 
                        />
                        {/* pH line: emerald */}
                        <path 
                          d={`M 20 ${150 - activeBatch.waterReadings[0].pH * 15} L 250 ${150 - activeBatch.waterReadings[1].pH * 15}`} 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="3" 
                        />
                      </>
                    )}
                  </svg>

                  {/* SVG Nodes */}
                  <div className="absolute left-4 bottom-2 text-[10px] text-blue-600 font-bold bg-white px-2 py-0.5 rounded border shadow-sm">
                    ● Oxygen (DO) mg/L 
                  </div>
                  <div className="absolute left-36 bottom-2 text-[10px] text-emerald-600 font-bold bg-white px-2 py-0.5 rounded border shadow-sm">
                    ● pH Level
                  </div>
                  
                  <div className="text-[9px] text-slate-400 absolute right-4 bottom-2 font-mono">Date logs: Multi-Sample Scale</div>
                </div>
              </div>

              {/* Feed Cost mapping alert */}
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs leading-relaxed text-emerald-800">
                🌱 **Continuous Feed ledger entry link**: Posting fingerlings sourcing debit mappings automatically updates biological assets account <strong className="text-slate-900">1440 (Aqua Biomass)</strong>.
              </div>

            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border rounded-xl text-slate-400 italic">Please select or register an active aquaculture production system.</div>
          )}
        </div>

      </div>
    </div>
  );
}
