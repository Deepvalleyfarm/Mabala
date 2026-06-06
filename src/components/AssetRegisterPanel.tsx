import React, { useState } from "react";
import { Asset, Supplier } from "../types";
import { 
  Package, 
  Plus, 
  Trash2, 
  Wrench, 
  Calendar, 
  MapPin, 
  Award, 
  AlertTriangle, 
  TrendingDown, 
  HelpCircle,
  FileCheck
} from "lucide-react";

interface AssetRegisterPanelProps {
  assets: Asset[];
  suppliers: Supplier[];
  onAddAsset: (asset: Omit<Asset, "id" | "farmId">) => void;
  onDeleteAsset: (id: string) => void;
  isReadonly: boolean;
  currencySymbol: string;
}

export default function AssetRegisterPanel({
  assets,
  suppliers,
  onAddAsset,
  onDeleteAsset,
  isReadonly,
  currencySymbol
}: AssetRegisterPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Asset["category"]>("Equipment");
  const [serial, setSerial] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().substring(0, 10));
  const [purchasePrice, setPurchasePrice] = useState("");
  const [location, setLocation] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [condition, setCondition] = useState<Asset["condition"]>("Good");
  const [depreciationRate, setDepreciationRate] = useState("10"); // e.g. 10% annual depreciation
  const [notes, setNotes] = useState("");

  // Live Auto-Depreciation Calculator helper
  const calculateDepreciatedValue = (asset: Asset) => {
    const buyDate = new Date(asset.purchaseDate);
    const currentDate = new Date();
    
    // Difference in years
    const diffTime = Math.abs(currentDate.getTime() - buyDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const yearsElapsed = diffDays / 365.25;

    // Straight-line depreciation fraction
    const totalDepreciatedPct = (asset.depreciationRate * yearsElapsed) / 100;
    const currentValFraction = Math.max(0, 1 - totalDepreciatedPct);
    const calculatedCurrentValue = asset.purchasePrice * currentValFraction;

    return {
      depreciatedAmount: asset.purchasePrice * Math.min(1, totalDepreciatedPct),
      currentDepValue: parseFloat(calculatedCurrentValue.toFixed(2)),
      pctLost: Math.min(100, Math.round(totalDepreciatedPct * 100))
    };
  };

  const handleSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !purchasePrice || !supplierId || !location) {
      alert("Please check your input fields. Asset Name, Purchase Price, Supplier registry link, and Location are required.");
      return;
    }
    
    // Calculate initial currentValue
    onAddAsset({
      name,
      category,
      serial,
      purchaseDate,
      purchasePrice: Number(purchasePrice),
      currentValue: Number(purchasePrice),
      location,
      supplierId,
      condition,
      notes,
      depreciationRate: Number(depreciationRate)
    });

    setName("");
    setSerial("");
    setPurchasePrice("");
    setLocation("");
    setSupplierId("");
    setNotes("");
    setShowAddForm(false);
  };

  // Aggregated Statistics
  const totalOriginalBookValue = assets.reduce((sum, a) => sum + a.purchasePrice, 0);
  const totalDepreciatedCurrentValue = assets.reduce((sum, a) => {
    const { currentDepValue } = calculateDepreciatedValue(a);
    return sum + currentDepValue;
  }, 0);
  const totalDepreciationLoss = totalOriginalBookValue - totalDepreciatedCurrentValue;

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header and Intro banner */}
      <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" />
            Asset Register & Ledger
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Maintain compliance by recording fixed company assets, water infrastructure, machinery and farm-ware. Automate live depreciation logs.
          </p>
        </div>
        {!isReadonly && (
          <button
            onClick={() => setShowAddForm(prev => !prev)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-4 rounded-lg flex items-center gap-1.5 shadow active:scale-[0.98] transition-all self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {showAddForm ? "Collapse Form" : "Capitalize Asset"}
          </button>
        )}
      </div>

      {/* Asset Valuation Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="text-[10px] uppercase font-extrabold text-slate-400">Total Purchase Book Value</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{currencySymbol} {totalOriginalBookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-emerald-500 font-medium mt-1">Capitalized historical ledger entry</div>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="text-[10px] uppercase font-extrabold text-slate-400">Valuation After Depreciation</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{currencySymbol} {totalDepreciatedCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-amber-500 font-medium mt-1">Live straight-line depreciated value</div>
        </div>
        <div className="bg-slate-900 text-white p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="text-[10px] uppercase font-extrabold text-slate-400">Accumulated Depreciation Expense</div>
          <div className="text-xl font-black text-rose-400 mt-1">{currencySymbol} {totalDepreciationLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="text-[9px] text-slate-400 mt-2 font-mono">Ledger Offset Code: 5400 - Depreciation Exp</div>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleSub} className="bg-slate-50 border p-6 rounded-xl space-y-4 animate-fade-in">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1">
            <Wrench className="w-4 h-4 text-emerald-500" /> Book Fixed Asset Acquisition
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Asset Name Description</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Saro Solar Borehole Pump Set"
                className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Category type</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
              >
                <option value="Land">Land / Plots</option>
                <option value="Buildings">Buildings & Stands</option>
                <option value="Equipment">Equipment / Pumps / Engines</option>
                <option value="Vehicles">Vehicles / Motorbikes / Trucks</option>
                <option value="Water Infrastructure">Water Infrastructure / Tanks</option>
                <option value="Other">Other Fixed Asset</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Supplier (Registered dropdown)</label>
              <select
                value={supplierId}
                required
                onChange={e => setSupplierId(e.target.value)}
                className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose registered supplier --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category || "Agro Vendor"})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Purchase Price ({currencySymbol})</label>
              <input
                type="number"
                required
                min="1"
                value={purchasePrice}
                onChange={e => setPurchasePrice(e.target.value)}
                placeholder="15000"
                className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Official Serial number</label>
              <input
                type="text"
                value={serial}
                onChange={e => setSerial(e.target.value)}
                placeholder="e.g. S-BH-0023B"
                className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Purchase execution Date</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Storage / Operating Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Susu Farm Main Well"
                className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Annual Depreciation rate (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={depreciationRate}
                onChange={e => setDepreciationRate(e.target.value)}
                placeholder="10"
                className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Initial Condition state</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as any)}
                className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
              >
                <option value="Excellent">Excellent (Brand New / Static)</option>
                <option value="Good">Good (Working fine)</option>
                <option value="Fair">Fair (Needs slight maintenance)</option>
                <option value="Poor">Poor (Degraded / Urgent attention)</option>
              </select>
            </div>

            <div className="space-y-1 col-span-1 md:col-span-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Supplementary acquisition Notes</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Included pipes, base plate, stand design info"
                className="w-full text-xs p-2 border bg-white rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-6 rounded-lg shadow transition-all active:scale-[0.98]"
            >
              Confirm Capitalization
            </button>
          </div>
        </form>
      )}

      {/* Assets List View */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Fixed Asset Registry Entries</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Comprehensive capital log. Values depreciated incrementally based on time elapsed since acquisition.</p>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs bg-white text-slate-800">
            <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
              <tr>
                <th className="p-3">Ref ID</th>
                <th className="p-3">Asset detail and serial</th>
                <th className="p-3">category</th>
                <th className="p-3">Acquisition Date</th>
                <th className="p-3">Matched supplier</th>
                <th className="p-3">Condition</th>
                <th className="p-3 font-mono text-right">Book Value</th>
                <th className="p-3 font-mono text-center">Dep. Rate</th>
                <th className="p-3 font-mono text-right text-emerald-600">depreciated Value</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y font-semibold text-slate-800">
              {assets.map(asset => {
                const { currentDepValue, pctLost } = calculateDepreciatedValue(asset);
                const linkedSupplier = suppliers.find(s => s.id === asset.supplierId);

                return (
                  <tr key={asset.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-[10px] text-slate-400">{asset.id}</td>
                    <td className="p-3">
                      <span className="block text-slate-900 font-bold">{asset.name}</span>
                      {asset.serial && (
                        <span className="text-[9.5px] font-mono text-indigo-500 block font-normal">S/N: {asset.serial}</span>
                      )}
                      <span className="text-[9.5px] text-slate-400 block font-normal flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {asset.location}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{asset.category}</span>
                    </td>
                    <td className="p-3 font-mono">{asset.purchaseDate}</td>
                    <td className="p-3 text-slate-600 font-normal">
                      {linkedSupplier ? (
                        <div>
                          <span className="block font-bold text-slate-700">{linkedSupplier.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono block">{linkedSupplier.id}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unknown supplier</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        asset.condition === "Excellent" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : asset.condition === "Good" 
                          ? "bg-blue-50 text-blue-700 border border-blue-100" 
                          : asset.condition === "Fair" 
                          ? "bg-amber-50 text-amber-700 border border-amber-200" 
                          : "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                      }`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-700">
                      {currencySymbol} {asset.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500 text-[11px]">
                      {asset.depreciationRate}% p.a.
                      {pctLost > 0 && (
                        <span className="block text-[9.5px] text-rose-500 font-bold font-sans">-{pctLost}% life</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-slate-950">
                      {currencySymbol} {currentDepValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      {pctLost >= 100 && (
                        <span className="block text-[9px] uppercase font-sans text-rose-600 bg-rose-50 px-1 py-0.2 rounded font-black max-w-max ml-auto">Fully Depreciated</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {!isReadonly && (
                        <button
                          onClick={() => {
                            const triggerConfirm = (window as any).triggerGlobalConfirm;
                            if (triggerConfirm) {
                              triggerConfirm({
                                title: "Delete Asset Capitalization",
                                message: `Are you sure you want to delete and soft-delete fixed asset record: "${asset.name}" (${asset.category}) from your capitalized ledger?`,
                                isBulk: true,
                                itemCount: 1,
                                itemNames: [`${asset.name} (${asset.category}) - Cost: ${asset.purchasePrice}`],
                                onConfirm: () => onDeleteAsset(asset.id)
                              });
                            } else {
                              if (window.confirm("Are you sure you want to delete this asset record permanently? This will require confirmation.")) {
                                onDeleteAsset(asset.id);
                              }
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400 italic">No assets capitalized. Use the ledger booking menu to record company assets and begin tracing deprecations.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
