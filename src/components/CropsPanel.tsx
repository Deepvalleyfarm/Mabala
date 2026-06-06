import React, { useState } from "react";
import { CropCycle, Milestone } from "../types";
import { Plus, Check, Play, Calendar, DollarSign, Award, BookOpen, Trash, FileSpreadsheet } from "lucide-react";

export const AFRICAN_CROPS_LIST = [
  {
    category: "Horticultural Leafy Greens & Vegetables",
    items: [
      { name: "Kalembula (Sweet Potato Leaves)", value: "Kalembula" },
      { name: "Bondwe (Amaranthus)", value: "Bondwe" },
      { name: "Chibwabwa (Pumpkin Leaves)", value: "Chibwabwa" },
      { name: "Mupilu (Mustard Leaves)", value: "Mupilu" },
      { name: "Lettac (Lettuce)", value: "Lettac" },
      { name: "Cabbage", value: "Cabbage" },
      { name: "Rape (Greens)", value: "Rape" },
      { name: "Spinach", value: "Spinach" },
    ]
  },
  {
    category: "Solanaceous & Fruit Vegetables",
    items: [
      { name: "Tomato", value: "Tomato" },
      { name: "Impwa (African Garden Egg / Eggplant)", value: "Impwa" },
      { name: "Eggplants", value: "Eggplants" },
      { name: "Green Paper (Green Pepper)", value: "Green Paper" },
      { name: "Red Paper (Red Pepper)", value: "Red Paper" },
      { name: "Yellow Paper (Yellow Pepper)", value: "Yellow Paper" },
      { name: "Chili (Chilli Pepper)", value: "Chili" },
      { name: "Okra", value: "Okra" },
      { name: "Cucumbers", value: "Cucumbers" },
    ]
  },
  {
    category: "Roots, Tubers & Bulbs",
    items: [
      { name: "Sweet Potatoes", value: "Sweet Potatoes" },
      { name: "Irish Potatoes", value: "Irish Potatoes" },
      { name: "Cassava", value: "Cassava" },
      { name: "Onion", value: "Onion" },
      { name: "Garlic", value: "Garlic" },
      { name: "Carrots", value: "Carrots" },
    ]
  },
  {
    category: "Field Crops & Grains",
    items: [
      { name: "Fresh Maize", value: "Fresh Maize" },
      { name: "Maize (White/Grain/Commercial)", value: "Maize" },
      { name: "Green beans", value: "Green beans" },
      { name: "Soybeans (Soya)", value: "Soybeans" },
      { name: "Wheat", value: "Wheat" },
      { name: "Sunflower", value: "Sunflower" },
      { name: "Groundnuts (Peanuts)", value: "Groundnuts" },
      { name: "Sorghum", value: "Sorghum" },
      { name: "Millet", value: "Millet" },
    ]
  },
  {
    category: "Commercial & Plantation Crops",
    items: [
      { name: "Tobacco", value: "Tobacco" },
      { name: "Cotton", value: "Cotton" },
      { name: "Sugarcane", value: "Sugarcane" },
      { name: "Coffee", value: "Coffee" },
    ]
  }
];

interface CropsPanelProps {
  crops: CropCycle[];
  onAddCrop: (crop: CropCycle) => void;
  onUpdateMilestone: (cropId: string, milestoneId: string, isCompleted: boolean) => void;
  onUpdateStatus: (cropId: string, status: CropCycle["status"]) => void;
  onDeleteCrop?: (id: string) => void;
  isReadonly: boolean;
  currencySymbol: string;
  onGotoCsvImport?: (targetModule: "expenses" | "crops" | "livestock") => void;
}

export default function CropsPanel({ 
  crops, 
  onAddCrop, 
  onUpdateMilestone, 
  onUpdateStatus, 
  onDeleteCrop, 
  isReadonly, 
  currencySymbol,
  onGotoCsvImport
}: CropsPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCropIds, setSelectedCropIds] = useState<string[]>([]);
  
  // Form State
  const [cropType, setCropType] = useState("");
  const [customCropType, setCustomCropType] = useState("");
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState("");
  const [fieldBlock, setFieldBlock] = useState("");
  const [areaHectares, setAreaHectares] = useState(5);
  const [expectedYieldKg, setExpectedYieldKg] = useState(25000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCropType = cropType === "Other" ? customCropType : cropType;

    if (!finalCropType || !expectedHarvestDate || !fieldBlock) {
      alert("Please check your entry.");
      return;
    }

    const newCrop: CropCycle = {
      id: "crop-" + (crops.length + 1),
      cropType: finalCropType,
      plantingDate,
      expectedHarvestDate,
      fieldBlock,
      areaHectares: Number(areaHectares),
      expectedYieldKg: Number(expectedYieldKg),
      status: "Planning",
      milestones: [
        { id: "m1", name: "Planning & Nursery Setup", startDate: plantingDate, endDate: expectedHarvestDate, isCompleted: false },
        { id: "m2", name: "Emergence & Herbicide Control", startDate: plantingDate, endDate: expectedHarvestDate, isCompleted: false },
        { id: "m3", name: "Flowering & Grain Development", startDate: plantingDate, endDate: expectedHarvestDate, isCompleted: false },
        { id: "m4", name: "Harvesting & Shelling Operations", startDate: plantingDate, endDate: expectedHarvestDate, isCompleted: false }
      ],
      expensesLinked: 0,
      revenueLinked: 0,
      farmId: "farm-1"
    };

    onAddCrop(newCrop);
    setShowAddForm(false);
    // Reset Form
    setCropType("");
    setCustomCropType("");
    setFieldBlock("");
  };

  return (
    <div className="space-y-6">
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 space-y-4 animate-fade-in" id="crop-form">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest pb-2 border-b">Initialize New Agronomic Crop Cycle</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Crop Type & Strain</label>
              <select 
                value={cropType} 
                onChange={e => setCropType(e.target.value)} 
                required 
                className="w-full text-xs border bg-slate-50 rounded p-2 font-semibold text-slate-700 outline-none"
              >
                <option value="">-- Choose African Crop Type --</option>
                {AFRICAN_CROPS_LIST.map(group => (
                  <optgroup key={group.category} label={group.category}>
                    {group.items.map(item => (
                      <option key={item.value} value={item.value}>{item.name}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="Other">Other / Custom Crop...</option>
              </select>
              {cropType === "Other" && (
                <input 
                  type="text" 
                  placeholder="e.g. Soybeans (ZMS 512)" 
                  value={customCropType} 
                  onChange={e => setCustomCropType(e.target.value)} 
                  required 
                  className="w-full text-xs border bg-slate-50 rounded p-2 mt-2 font-semibold text-slate-700 outline-none"
                />
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Field / Block Segment</label>
              <input 
                type="text" 
                placeholder="e.g. North Fields Block B" 
                value={fieldBlock} 
                onChange={e => setFieldBlock(e.target.value)} 
                required 
                className="w-full text-xs border bg-slate-50 rounded p-2"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Area Cultivated (Hectares)</label>
              <input 
                type="number" 
                value={areaHectares} 
                onChange={e => setAreaHectares(Number(e.target.value))} 
                required 
                className="w-full text-xs border bg-slate-50 rounded p-2"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Planting Date</label>
              <input 
                type="date" 
                value={plantingDate} 
                onChange={e => setPlantingDate(e.target.value)} 
                required 
                className="w-full text-xs border bg-slate-50 rounded p-2"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Expected Harvest Date</label>
              <input 
                type="date" 
                value={expectedHarvestDate} 
                onChange={e => setExpectedHarvestDate(e.target.value)} 
                required 
                className="w-full text-xs border bg-slate-50 rounded p-2"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Expected Yield Target (Kg)</label>
              <input 
                type="number" 
                value={expectedYieldKg} 
                onChange={e => setExpectedYieldKg(Number(e.target.value))} 
                required 
                className="w-full text-xs border bg-slate-50 rounded p-2"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-semibold text-emerald-800">
            ✓ Complete season planning: 4 milestones will be pre-configured and tracked progressively.
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-100 rounded text-xs font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs shadow-sm">Save Crop Cycle</button>
          </div>
        </form>
      )}

      {/* Grid of Active Crop Cycles */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Milestone & Crop Batches</h2>
          <p className="text-xs text-slate-500 font-medium">Auto-transition progressive crop development stages below.</p>
        </div>
        {!isReadonly && crops.length < 5 ? (
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded-lg text-xs font-bold font-mono"
          >
            + Create Crop Cycle
          </button>
        ) : isReadonly ? (
          <span className="text-xs text-rose-500 font-bold bg-rose-50 px-2 rounded font-mono">Credit block active</span>
        ) : (
          <span className="text-xs text-amber-500 font-bold bg-amber-50 px-2 rounded font-mono">Free plan limited to 5 crop cycles</span>
        )}
      </div>

      {/* Floating Bulk Selection Bar */}
      {selectedCropIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-xl mb-6 shadow-xs animate-fade-in font-sans">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 text-[10px] flex items-center justify-center font-black">
              {selectedCropIds.length}
            </span>
            <span className="text-[11px] text-rose-900 font-bold">
              Crop Cycle{selectedCropIds.length > 1 ? "s" : ""} selected for bulk actions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCropIds([])}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={() => {
                const selectedItems = crops.filter(c => selectedCropIds.includes(c.id));
                const itemNames = selectedItems.map(c => `${c.cropType} (Field: ${c.fieldBlock})`);
                
                const triggerConfirm = (window as any).triggerGlobalConfirm;
                if (triggerConfirm) {
                  triggerConfirm({
                    title: "Bulk Delete Crop Cycles",
                    message: `CRITICAL SECURE AREA: You are about to bulk and soft-delete ${selectedCropIds.length} agricultural crop cycle records from the Mabala registries. This action will place them in the secure system archive.`,
                    isBulk: true,
                    itemCount: selectedCropIds.length,
                    itemNames: itemNames,
                    onConfirm: () => {
                      selectedCropIds.forEach(id => {
                        if (onDeleteCrop) onDeleteCrop(id);
                      });
                      setSelectedCropIds([]);
                    }
                  });
                } else {
                  if (window.confirm(`Are you sure you want to bulk-delete ${selectedCropIds.length} selected crop cycles?`)) {
                    selectedCropIds.forEach(id => {
                      if (onDeleteCrop) onDeleteCrop(id);
                    });
                    setSelectedCropIds([]);
                  }
                }
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11.5px] font-black rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Trash className="w-3 h-3" />
              <span>Bulk Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {crops.map(crop => (
          <div key={crop.id} className="bg-white border rounded-xl shadow-sm overflow-hidden border-slate-200">
            {/* Cycle Header */}
            <div className="px-6 py-4 border-b bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedCropIds.includes(crop.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCropIds(prev => [...prev, crop.id]);
                    } else {
                      setSelectedCropIds(prev => prev.filter(id => id !== crop.id));
                    }
                  }}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4"
                />
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-xs">
                  {crop.cropType.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{crop.cropType}</h3>
                  <p className="text-[11px] text-slate-500 font-medium font-sans">Located in: <strong className="text-slate-700">{crop.fieldBlock} ({crop.areaHectares} Hectares)</strong></p>
                </div>
              </div>
 
               {/* Status selectors */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">STATUS STAGE:</span>
                <select 
                  value={crop.status}
                  onChange={e => onUpdateStatus(crop.id, e.target.value as any)}
                  className="text-xs font-bold bg-white border rounded px-2.5 py-1 text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="Harvested">Harvested</option>
                  <option value="Sold">Sold / Finished</option>
                </select>
                <span className={`px-2 py-1 text-[10px] font-extrabold rounded uppercase ${
                  crop.status === "Active" ? "bg-blue-50 text-blue-600" :
                  crop.status === "Harvested" ? "bg-amber-50 text-amber-600" :
                  crop.status === "Sold" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                }`}>
                  {crop.status}
                </span>
                {!isReadonly && onDeleteCrop && (
                  <button
                    type="button"
                    onClick={() => {
                      const triggerConfirm = (window as any).triggerGlobalConfirm;
                      if (triggerConfirm) {
                        triggerConfirm({
                          title: "Delete Crop Cycle",
                          message: `Are you sure you want to delete and soft-delete agricultural crop cycle: "${crop.cropType}" located at "${crop.fieldBlock}" to the system archive?`,
                          isBulk: true,
                          itemCount: 1,
                          itemNames: [`${crop.cropType} (Field: ${crop.fieldBlock})`],
                          onConfirm: () => {
                            onDeleteCrop(crop.id);
                            setSelectedCropIds(prev => prev.filter(id => id !== crop.id));
                          }
                        });
                      } else {
                        if (window.confirm(`Are you sure you want to delete and soft-delete agricultural crop cycle: "${crop.cropType}" located at "${crop.fieldBlock}" to the archive?`)) {
                          onDeleteCrop(crop.id);
                          setSelectedCropIds(prev => prev.filter(id => id !== crop.id));
                        }
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors border border-transparent hover:border-rose-100 cursor-pointer flex items-center justify-center"
                    title="Delete Crop Cycle"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Cycle Body Info */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 border-b">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-1">Agronomic Targets</span>
                <p className="text-xs font-medium text-slate-600">Expected Harvest Target: <strong className="text-slate-800">{crop.expectedYieldKg.toLocaleString()} Kg</strong></p>
                <p className="text-xs font-medium text-slate-600">Yield achieved so far: <strong className="text-slate-800">{crop.actualYieldKg || 0} Kg</strong></p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-1">Period Constraints</span>
                <p className="text-xs font-medium text-slate-600 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Planted: {crop.plantingDate}</p>
                <p className="text-xs font-medium text-slate-600 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Target: {crop.expectedHarvestDate}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-1">Cycle Financial Analysis</span>
                <p className="text-xs font-medium text-slate-600">Revenues Linked: <span className="text-emerald-600 font-bold">{currencySymbol}{crop.revenueLinked.toLocaleString()}</span></p>
                <p className="text-xs font-medium text-slate-600">Direct Seed Expenses: <span className="text-rose-500 font-bold">{currencySymbol}{crop.expensesLinked.toLocaleString()}</span></p>
              </div>

              <div className="space-y-1.5 text-right flex flex-col justify-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-0.5">Performance Score (P&L)</span>
                <span className={`text-md font-extrabold ${crop.revenueLinked - crop.expensesLinked >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {currencySymbol}{(crop.revenueLinked - crop.expensesLinked).toLocaleString()}
                </span>
                <span className="text-[9px] font-mono text-slate-400 block">Autoposts double entry accounts</span>
              </div>
            </div>

            {/* progressive Milestones Checklist */}
            <div className="p-6 bg-slate-50/50">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-3 tracking-widest">Crop Milestones Checklist</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {crop.milestones.map(m => (
                  <div key={m.id} className={`p-3 rounded-lg border flex flex-col justify-between h-20 transition-all ${
                    m.isCompleted ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800" : "bg-white border-slate-200"
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold leading-tight line-clamp-2">{m.name}</span>
                      <input 
                        type="checkbox"
                        checked={m.isCompleted}
                        onChange={e => onUpdateMilestone(crop.id, m.id, e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-opacity-20 cursor-pointer w-4 h-4"
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 block">Season Timeline</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {crops.length === 0 && (
          <div className="bg-slate-50 border p-8 text-center rounded-xl text-slate-400 italic">No crop cycles initiated. Click &ldquo;Create Crop Cycle&rdquo; to start tracking fields.</div>
        )}
      </div>
    </div>
  );
}
