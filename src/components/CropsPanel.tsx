import React, { useState, useEffect } from "react";
import { CropCycle, Milestone } from "../types";
import { 
  Plus, Check, Play, Calendar, DollarSign, Award, BookOpen, Trash, 
  FileSpreadsheet, Sliders, Calculator, LineChart, Cpu, TrendingUp, 
  BarChart3, AlertCircle, AlertTriangle, ShieldCheck, Flame, Info, CheckCircle2, ChevronRight
} from "lucide-react";

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

export const CROP_TEMPLATES: Record<string, {
  unitName: string;
  measuredIn: "Units" | "Kg";
  avgUnitsPerPlant: number;
  avgWeightPerPlantKg: number;
  recommendedSpacingWithinRow: number; // cm
  recommendedRowSpacing: number; // cm
  recommendedSurvival: number; // %
  recommendedHarvest: number; // %
  defaultPricePerUnit: number;
  defaultPricePerKg: number;
  plantingMethod: "Field" | "Bed";
}> = {
  "Maize": {
    unitName: "Cob",
    measuredIn: "Units",
    avgUnitsPerPlant: 1,
    avgWeightPerPlantKg: 0.35,
    recommendedSpacingWithinRow: 25,
    recommendedRowSpacing: 75,
    recommendedSurvival: 95,
    recommendedHarvest: 90,
    defaultPricePerUnit: 5,
    defaultPricePerKg: 12,
    plantingMethod: "Field"
  },
  "Fresh Maize": {
    unitName: "Cob",
    measuredIn: "Units",
    avgUnitsPerPlant: 1,
    avgWeightPerPlantKg: 0.35,
    recommendedSpacingWithinRow: 25,
    recommendedRowSpacing: 75,
    recommendedSurvival: 96,
    recommendedHarvest: 92,
    defaultPricePerUnit: 6,
    defaultPricePerKg: 14,
    plantingMethod: "Field"
  },
  "Sweet Corn": {
    unitName: "Cob",
    measuredIn: "Units",
    avgUnitsPerPlant: 2,
    avgWeightPerPlantKg: 0.3,
    recommendedSpacingWithinRow: 30,
    recommendedRowSpacing: 75,
    recommendedSurvival: 95,
    recommendedHarvest: 88,
    defaultPricePerUnit: 8,
    defaultPricePerKg: 18,
    plantingMethod: "Field"
  },
  "Onion": {
    unitName: "Bulb",
    measuredIn: "Units",
    avgUnitsPerPlant: 1,
    avgWeightPerPlantKg: 0.15,
    recommendedSpacingWithinRow: 15,
    recommendedRowSpacing: 15,
    recommendedSurvival: 95,
    recommendedHarvest: 92,
    defaultPricePerUnit: 2,
    defaultPricePerKg: 15,
    plantingMethod: "Bed"
  },
  "Garlic": {
    unitName: "Bulb",
    measuredIn: "Units",
    avgUnitsPerPlant: 1,
    avgWeightPerPlantKg: 0.08,
    recommendedSpacingWithinRow: 10,
    recommendedRowSpacing: 15,
    recommendedSurvival: 96,
    recommendedHarvest: 94,
    defaultPricePerUnit: 4,
    defaultPricePerKg: 25,
    plantingMethod: "Bed"
  },
  "Cabbage": {
    unitName: "Head",
    measuredIn: "Units",
    avgUnitsPerPlant: 1,
    avgWeightPerPlantKg: 1.5,
    recommendedSpacingWithinRow: 45,
    recommendedRowSpacing: 45,
    recommendedSurvival: 94,
    recommendedHarvest: 88,
    defaultPricePerUnit: 12,
    defaultPricePerKg: 8,
    plantingMethod: "Bed"
  },
  "Tomato": {
    unitName: "Kg",
    measuredIn: "Kg",
    avgUnitsPerPlant: 10,
    avgWeightPerPlantKg: 1.5,
    recommendedSpacingWithinRow: 50,
    recommendedRowSpacing: 60,
    recommendedSurvival: 92,
    recommendedHarvest: 85,
    defaultPricePerUnit: 1,
    defaultPricePerKg: 20,
    plantingMethod: "Field"
  },
  "Irish Potatoes": {
    unitName: "Kg",
    measuredIn: "Kg",
    avgUnitsPerPlant: 8,
    avgWeightPerPlantKg: 0.8,
    recommendedSpacingWithinRow: 30,
    recommendedRowSpacing: 75,
    recommendedSurvival: 95,
    recommendedHarvest: 90,
    defaultPricePerUnit: 2,
    defaultPricePerKg: 16,
    plantingMethod: "Field"
  },
  "Sweet Potatoes": {
    unitName: "Kg",
    measuredIn: "Kg",
    avgUnitsPerPlant: 6,
    avgWeightPerPlantKg: 0.6,
    recommendedSpacingWithinRow: 30,
    recommendedRowSpacing: 90,
    recommendedSurvival: 96,
    recommendedHarvest: 90,
    defaultPricePerUnit: 1,
    defaultPricePerKg: 14,
    plantingMethod: "Field"
  },
  "Tobacco": {
    unitName: "Plant",
    measuredIn: "Units",
    avgUnitsPerPlant: 1,
    avgWeightPerPlantKg: 0.25,
    recommendedSpacingWithinRow: 50,
    recommendedRowSpacing: 100,
    recommendedSurvival: 95,
    recommendedHarvest: 90,
    defaultPricePerUnit: 15,
    defaultPricePerKg: 45,
    plantingMethod: "Field"
  },
  "Pineapple": {
    unitName: "Fruit",
    measuredIn: "Units",
    avgUnitsPerPlant: 1,
    avgWeightPerPlantKg: 1.8,
    recommendedSpacingWithinRow: 30,
    recommendedRowSpacing: 90,
    recommendedSurvival: 98,
    recommendedHarvest: 95,
    defaultPricePerUnit: 25,
    defaultPricePerKg: 15,
    plantingMethod: "Field"
  },
  "Watermelon": {
    unitName: "Fruit",
    measuredIn: "Units",
    avgUnitsPerPlant: 2,
    avgWeightPerPlantKg: 5.0,
    recommendedSpacingWithinRow: 90,
    recommendedRowSpacing: 150,
    recommendedSurvival: 92,
    recommendedHarvest: 85,
    defaultPricePerUnit: 35,
    defaultPricePerKg: 7,
    plantingMethod: "Field"
  }
};

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
  const [activeTab, setActiveTab] = useState<"batches" | "forecaster">("batches");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCropIds, setSelectedCropIds] = useState<string[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [cardTabs, setCardTabs] = useState<Record<string, "milestones" | "sales_margin">>({});

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const { getAllFromOfflineStore } = await import("../db/offline_db");
        const dns = await getAllFromOfflineStore("delivery_notes");
        if (dns && dns.length > 0) {
          setDeliveryNotes(dns);
        }
      } catch (e) {
        console.warn("Failed loading delivery notes in CropsPanel:", e);
      }
    };
    loadNotes();
  }, [crops]);
  
  // Custom states for templates and dynamically calculated fields
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  // Form State
  const [cropType, setCropType] = useState("");
  const [customCropType, setCustomCropType] = useState("");
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState("");
  const [fieldBlock, setFieldBlock] = useState("");
  const [areaHectares, setAreaHectares] = useState(2);
  const [expectedYieldKg, setExpectedYieldKg] = useState(5000);

  // New planning and calculator engine fields
  const [plantingMethod, setPlantingMethod] = useState<"Field" | "Bed">("Field");
  const [measuredInKgOrUnits, setMeasuredInKgOrUnits] = useState<"Kg" | "Units">("Kg");
  const [harvestUnitName, setHarvestUnitName] = useState("Kg");
  const [expectedSellingPricePerUnit, setExpectedSellingPricePerUnit] = useState(0);
  const [expectedSellingPricePerKg, setExpectedSellingPricePerKg] = useState(12);
  const [plantSpacingWithinRow, setPlantSpacingWithinRow] = useState(25); // cm
  const [rowSpacing, setRowSpacing] = useState(75); // cm
  const [bedWidth, setBedWidth] = useState(1.2); // m
  const [bedLength, setBedLength] = useState(20); // m
  const [numberOfBeds, setNumberOfBeds] = useState(10);
  const [expectedSurvivalRate, setExpectedSurvivalRate] = useState(95); // %
  const [expectedHarvestRate, setExpectedHarvestRate] = useState(90); // %
  const [avgHarvestUnitsPerPlant, setAvgHarvestUnitsPerPlant] = useState(1);
  const [averageWeightPerPlantKg, setAverageWeightPerPlantKg] = useState(0.35);

  // Real-time computed values
  const [computedTotalPopulation, setComputedTotalPopulation] = useState(0);
  const [computedLivePlants, setComputedLivePlants] = useState(0);
  const [computedHarvestPopulation, setComputedHarvestPopulation] = useState(0);
  const [computedExpectedUnits, setComputedExpectedUnits] = useState(0);
  const [computedExpectedKg, setComputedExpectedKg] = useState(0);
  const [computedRevenueProjection, setComputedRevenueProjection] = useState(0);

  // AI Intelligence states
  const [aiSelectedCropId, setAiSelectedCropId] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<{
    yieldPredictionScore: number;
    revenueConfidenceScore: number;
    productionRiskScore: number;
    recommendations: string[];
  } | null>(null);

  // Apply crop template defaults on change
  useEffect(() => {
    const activeCrop = cropType === "Other" ? customCropType : cropType;
    if (activeCrop && CROP_TEMPLATES[activeCrop]) {
      const template = CROP_TEMPLATES[activeCrop];
      setHarvestUnitName(template.unitName);
      setMeasuredInKgOrUnits(template.measuredIn);
      setAvgHarvestUnitsPerPlant(template.avgUnitsPerPlant);
      setAverageWeightPerPlantKg(template.avgWeightPerPlantKg);
      setPlantSpacingWithinRow(template.recommendedSpacingWithinRow);
      setRowSpacing(template.recommendedRowSpacing);
      setExpectedSurvivalRate(template.recommendedSurvival);
      setExpectedHarvestRate(template.recommendedHarvest);
      setExpectedSellingPricePerUnit(template.defaultPricePerUnit);
      setExpectedSellingPricePerKg(template.defaultPricePerKg);
      setPlantingMethod(template.plantingMethod);
      setSelectedTemplate(activeCrop);
    } else {
      setSelectedTemplate("");
    }
  }, [cropType, customCropType]);

  // Recalculate everything dynamically and continuously to prevent desync
  useEffect(() => {
    let totalPopulation = 0;
    const sWithin = Number(plantSpacingWithinRow) || 25;
    const sRow = Number(rowSpacing) || 75;

    if (plantingMethod === "Field") {
      const fieldAreaM2 = Number(areaHectares) * 10000;
      const spacingAreaM2 = (sWithin / 100) * (sRow / 100);
      if (spacingAreaM2 > 0) {
        totalPopulation = Math.floor(fieldAreaM2 / spacingAreaM2);
      }
    } else {
      const width = Number(bedWidth) || 1.2;
      const length = Number(bedLength) || 20;
      const beds = Number(numberOfBeds) || 10;
      
      const rowsPerBed = Math.max(1, Math.floor(width / (sRow / 100)));
      const plantsPerRow = Math.max(1, Math.floor(length / (sWithin / 100)));
      totalPopulation = rowsPerBed * plantsPerRow * beds;
    }

    const survivalRate = Number(expectedSurvivalRate) || 95;
    const harvestRate = Number(expectedHarvestRate) || 90;

    const livePlants = Math.floor(totalPopulation * (survivalRate / 100));
    const harvestPopulation = Math.floor(livePlants * (harvestRate / 100));

    const expectedUnits = Math.floor(harvestPopulation * (Number(avgHarvestUnitsPerPlant) || 1));
    const expectedKg = Number((harvestPopulation * (Number(averageWeightPerPlantKg) || 0.35)).toFixed(1));

    let revenueForecast = 0;
    if (measuredInKgOrUnits === "Units") {
      revenueForecast = expectedUnits * (Number(expectedSellingPricePerUnit) || 0);
    } else {
      revenueForecast = expectedKg * (Number(expectedSellingPricePerKg) || 0);
    }

    setComputedTotalPopulation(totalPopulation);
    setComputedLivePlants(livePlants);
    setComputedHarvestPopulation(harvestPopulation);
    setComputedExpectedUnits(expectedUnits);
    setComputedExpectedKg(expectedKg);
    setComputedRevenueProjection(revenueForecast);

    // Synchronize default expectedYieldKg field for backward-compatibility with reports/finance 
    setExpectedYieldKg(expectedKg || 25000);
  }, [
    plantingMethod, areaHectares, plantSpacingWithinRow, rowSpacing, 
    bedWidth, bedLength, numberOfBeds, expectedSurvivalRate, expectedHarvestRate,
    avgHarvestUnitsPerPlant, averageWeightPerPlantKg, measuredInKgOrUnits,
    expectedSellingPricePerUnit, expectedSellingPricePerKg
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCropType = cropType === "Other" ? customCropType : cropType;

    if (!finalCropType || !expectedHarvestDate || !fieldBlock) {
      alert("Please check your entry factors.");
      return;
    }

    const newCrop: CropCycle = {
      id: "crop-" + (crops.length + 1) + "-" + Date.now().toString().slice(-4),
      cropType: finalCropType,
      plantingDate,
      expectedHarvestDate,
      fieldBlock,
      areaHectares: Number(areaHectares),
      expectedYieldKg: Number(computedExpectedKg || expectedYieldKg),
      status: "Planning",
      milestones: [
        { id: "m1", name: "Land Prep & Population Grid Setup", startDate: plantingDate, endDate: expectedHarvestDate, isCompleted: false },
        { id: "m2", name: "Emergence and Drip Lines Audit", startDate: plantingDate, endDate: expectedHarvestDate, isCompleted: false },
        { id: "m3", name: "Flowering & Harvest Spacing Check", startDate: plantingDate, endDate: expectedHarvestDate, isCompleted: false },
        { id: "m4", name: "Harvesting & Revenue Ledger Post", startDate: plantingDate, endDate: expectedHarvestDate, isCompleted: false }
      ],
      expensesLinked: 0,
      revenueLinked: 0,
      farmId: "farm-1",

      // Enhanced persistent fields
      plantingMethod,
      measuredInKgOrUnits,
      harvestUnitName,
      expectedSellingPricePerUnit: Number(expectedSellingPricePerUnit),
      expectedSellingPricePerKg: Number(expectedSellingPricePerKg),
      plantSpacingWithinRow: Number(plantSpacingWithinRow),
      rowSpacing: Number(rowSpacing),
      bedWidth: Number(bedWidth),
      bedLength: Number(bedLength),
      numberOfBeds: Number(numberOfBeds),
      plantsPerBed: Number(plantingMethod === "Bed" ? (computedTotalPopulation / (numberOfBeds || 1)) : 0),
      totalExpectedPlantPopulation: Number(computedTotalPopulation),
      expectedSurvivalRate: Number(expectedSurvivalRate),
      expectedHarvestRate: Number(expectedHarvestRate),
      avgHarvestUnitsPerPlant: Number(avgHarvestUnitsPerPlant),
      averageWeightPerPlantKg: Number(averageWeightPerPlantKg),
      expectedRevenueProjection: Number(computedRevenueProjection),
      actualRevenueCollected: 0,
      actualHarvestUnits: 0
    };

    onAddCrop(newCrop);
    setShowAddForm(false);
    
    // Reset Form
    setCropType("");
    setCustomCropType("");
    setFieldBlock("");
  };

  // Call the Hercules AI Intelligence route
  const runAiYieldDiagnostics = async () => {
    if (!aiSelectedCropId) {
      alert("Please select a crop batch first!");
      return;
    }
    const crop = crops.find(c => c.id === aiSelectedCropId);
    if (!crop) return;

    setAiLoading(true);
    setAiReport(null);

    try {
      const response = await fetch("/api/crop-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cropData: crop })
      });
      const data = await response.json();
      setAiReport(data);
    } catch (err) {
      console.error(err);
      alert("Failed to retrieve AI recommendations. Check device connection.");
    } finally {
      setAiLoading(false);
    }
  };

  // Aggregate statistics across active tenant crop cycles 
  const totalPlannedActivePopulation = crops.reduce((acc, curr) => acc + (curr.totalExpectedPlantPopulation || 0), 0);
  const totalForecastedRevenue = crops.reduce((acc, curr) => acc + (curr.expectedRevenueProjection || 0), 0);
  const totalActualRevenue = crops.reduce((acc, curr) => acc + (curr.revenueLinked || 0), 0);
  const totalDirectExpenses = crops.reduce((acc, curr) => acc + (curr.expensesLinked || 0), 0);
  const netVariance = totalActualRevenue - totalForecastedRevenue;

  return (
    <div className="space-y-6" id="crops-platform-panel-wrapper">
      
      {/* Upper Module Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("batches")}
          className={`px-5 py-3 text-xs uppercase font-extrabold tracking-wider transition-all flex items-center gap-2 border-b-2 font-mono ${
            activeTab === "batches" 
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/20" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Active Batches & Planning</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("forecaster");
            if (crops.length > 0 && !aiSelectedCropId) {
              setAiSelectedCropId(crops[0].id);
            }
          }}
          className={`px-5 py-3 text-xs uppercase font-extrabold tracking-wider transition-all flex items-center gap-2 border-b-2 font-mono ${
            activeTab === "forecaster" 
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/20" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>Production & Revenue Forecasting</span>
        </button>
      </div>

      {activeTab === "batches" ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Create Crop Cycle Form Box */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 space-y-6 animate-fade-in" id="crop-form">
              <div className="flex justify-between items-center pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    Initialize Crop Production Plan
                  </h3>
                </div>
                {selectedTemplate && (
                  <span className="px-2.5 py-0.5 text-[9.5px] font-extrabold tracking-wider uppercase bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">
                    {selectedTemplate} Template Applied
                  </span>
                )}
              </div>

              {/* SECTION A: General Information */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">A. General Crop Logistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Crop Type & Strain</label>
                    <select 
                      value={cropType} 
                      onChange={e => setCropType(e.target.value)} 
                      required 
                      className="w-full text-xs font-semibold border bg-slate-50 rounded-lg p-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
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
                        className="w-full text-xs border bg-slate-50 rounded-lg p-2.5 mt-2 font-semibold text-slate-700 outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Field / Block Segment</label>
                    <input 
                      type="text" 
                      placeholder="e.g. North Fields Block B" 
                      value={fieldBlock} 
                      onChange={e => setFieldBlock(e.target.value)} 
                      required 
                      className="w-full text-xs border bg-slate-50 font-semibold rounded-lg p-2.5 text-slate-755"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Area Cultivated (Hectares)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={areaHectares} 
                      onChange={e => setAreaHectares(Number(e.target.value))} 
                      required 
                      className="w-full text-xs border bg-slate-50 font-semibold rounded-lg p-2.5 text-slate-755"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Planting Date</label>
                    <input 
                      type="date" 
                      value={plantingDate} 
                      onChange={e => setPlantingDate(e.target.value)} 
                      required 
                      className="w-full text-xs border bg-slate-50 font-mono rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Expected Harvest Date</label>
                    <input 
                      type="date" 
                      value={expectedHarvestDate} 
                      onChange={e => setExpectedHarvestDate(e.target.value)} 
                      required 
                      className="w-full text-xs border bg-slate-50 font-mono rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Planting Layout Engine</label>
                    <select 
                      value={plantingMethod} 
                      onChange={e => setPlantingMethod(e.target.value as any)} 
                      className="w-full text-xs font-semibold border bg-slate-50 rounded-lg p-2.5 text-slate-700 outline-none"
                    >
                      <option value="Field">Direct Field-Based Placement</option>
                      <option value="Bed">Raised Bed-Based Placement</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: Layout Parameter Spacing Engine */}
              <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">B. Layout Parameters & Spacing Constraints</h4>
                  <span className="text-[9px] text-slate-400 font-mono">Row / Plant Spacing calculation standards</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  {plantingMethod === "Bed" && (
                    <>
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Bed Width (Meters)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={bedWidth} 
                          onChange={e => setBedWidth(Number(e.target.value))} 
                          className="w-full text-xs border bg-white rounded p-2 text-slate-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Bed Length (Meters)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={bedLength} 
                          onChange={e => setBedLength(Number(e.target.value))} 
                          className="w-full text-xs border bg-white rounded p-2 text-slate-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Number of Beds</label>
                        <input 
                          type="number" 
                          value={numberOfBeds} 
                          onChange={e => setNumberOfBeds(Number(e.target.value))} 
                          className="w-full text-xs border bg-white rounded p-2 text-slate-700 font-mono"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Row Spacing (cm)</label>
                    <input 
                      type="number" 
                      value={rowSpacing} 
                      onChange={e => setRowSpacing(Number(e.target.value))} 
                      className="w-full text-xs border bg-white rounded p-2 text-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Inside-Row spacing (cm)</label>
                    <input 
                      type="number" 
                      value={plantSpacingWithinRow} 
                      onChange={e => setPlantSpacingWithinRow(Number(e.target.value))} 
                      className="w-full text-xs border bg-white rounded p-2 text-slate-700 font-mono"
                    />
                  </div>
                </div>

                {/* Micro calculation summary */}
                <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-2 bg-indigo-50 border border-indigo-100/50 rounded-lg text-[10px] font-semibold text-indigo-900 leading-normal">
                    <strong>Layout Area:</strong> {plantingMethod === "Field" ? `${(areaHectares * 10000).toLocaleString()} m² (${areaHectares} Ha)` : `${(bedWidth * bedLength * numberOfBeds).toFixed(1)} m² across ${numberOfBeds} Beds`}
                  </div>
                  <div className="p-2 bg-indigo-50 border border-indigo-100/50 rounded-lg text-[10px] font-semibold text-indigo-900 leading-normal">
                    <strong>Spacing Footprint:</strong> {rowSpacing}cm row × {plantSpacingWithinRow}cm plant spacing = {(((rowSpacing || 75) / 100) * ((plantSpacingWithinRow || 25) / 100)).toFixed(4)} m² per crop node.
                  </div>
                  <div className="p-2 bg-emerald-50 border border-emerald-100/50 rounded-lg text-[10px] font-semibold text-emerald-900 leading-normal font-sans">
                    🌱 <strong>Initial Plant Population:</strong> <strong className="text-emerald-700 font-mono text-xs">{computedTotalPopulation.toLocaleString()}</strong> seedlings planned.
                  </div>
                </div>
              </div>

              {/* SECTION C: Survival Projections & Unit/Weight Harvesting parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">C. Survival Rate Modelling</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Expected Survival Rate (%)</label>
                      <input 
                        type="number" 
                        max="100" 
                        min="1"
                        value={expectedSurvivalRate} 
                        onChange={e => setExpectedSurvivalRate(Number(e.target.value))} 
                        className="w-full text-xs border bg-white rounded p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Expected Harvest Rate (%)</label>
                      <input 
                        type="number" 
                        max="100" 
                        min="1"
                        value={expectedHarvestRate} 
                        onChange={e => setExpectedHarvestRate(Number(e.target.value))} 
                        className="w-full text-xs border bg-white rounded p-2 font-mono"
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-slate-100 rounded text-[9.5px] font-medium leading-relaxed font-sans text-slate-500">
                    Expected Live Plants: <strong className="text-slate-800 font-mono">{computedLivePlants.toLocaleString()}</strong> (Survival) <br />
                    Predicted Harvest Population: <strong className="text-emerald-600 font-mono">{computedHarvestPopulation.toLocaleString()}</strong> stalks ready for collection.
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">D. Yield Estimation Engine</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Measurement Strategy</label>
                      <select 
                        value={measuredInKgOrUnits} 
                        onChange={e => setMeasuredInKgOrUnits(e.target.value as any)} 
                        className="w-full text-xs border bg-white rounded p-2 outline-none text-slate-700"
                      >
                        <option value="Kg">Weight-Based (Kg)</option>
                        <option value="Units">Unit-Based (Cobs/Heads)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Unit/Metric Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Cob, Head, Bulb"
                        value={harvestUnitName} 
                        onChange={e => setHarvestUnitName(e.target.value)} 
                        className="w-full text-xs border bg-white rounded p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Units Per Plant</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={avgHarvestUnitsPerPlant} 
                        onChange={e => setAvgHarvestUnitsPerPlant(Number(e.target.value))} 
                        className="w-full text-xs border bg-white rounded p-2 font-mono"
                        disabled={measuredInKgOrUnits === "Kg"}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Average Plant Weight (Kg)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={averageWeightPerPlantKg} 
                        onChange={e => setAverageWeightPerPlantKg(Number(e.target.value))} 
                        className="w-full text-xs border bg-white rounded p-2 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION D: Financial Pricing Ledger */}
              <div className="space-y-3 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                <h4 className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">E. Expected Revenue Pricing Calculator</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Expected Price per Unit ({harvestUnitName})</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">{currencySymbol}</span>
                      <input 
                        type="number" 
                        step="0.1"
                        value={expectedSellingPricePerUnit} 
                        onChange={e => setExpectedSellingPricePerUnit(Number(e.target.value))} 
                        className="w-full pl-7 text-xs border bg-white rounded p-2 text-slate-700 font-mono font-bold"
                        disabled={measuredInKgOrUnits === "Kg"}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Expected Price per Kilogram (Kg)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">{currencySymbol}</span>
                      <input 
                        type="number" 
                        step="0.1"
                        value={expectedSellingPricePerKg} 
                        onChange={e => setExpectedSellingPricePerKg(Number(e.target.value))} 
                        className="w-full pl-7 text-xs border bg-white rounded p-2 text-slate-700 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Final outcomes layout */}
                <div className="p-3 bg-emerald-600 text-white rounded-lg flex flex-wrap justify-between items-center gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-100 block">Total Anticipated Yield Outputs</span>
                    <p className="text-xs font-semibold">
                      Expected Volume: <strong className="font-mono">{computedExpectedKg.toLocaleString()} Kg</strong> 
                      {measuredInKgOrUnits === "Units" && (
                        <span> | <strong className="font-mono">{computedExpectedUnits.toLocaleString()}</strong> harvestable {harvestUnitName}s</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9.5px] uppercase font-bold tracking-widest text-emerald-100 block">EXPECTED REVENUE PROJECTION</span>
                    <span className="text-lg font-black font-mono">
                      {currencySymbol}{computedRevenueProjection.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-extrabold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-lg text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Establish Crop Cycle</span>
                </button>
              </div>
            </form>
          )}

          {/* Grid control banner */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
            <div>
              <h2 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Crop Batches & Milestone Managers</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Verify production states, isolated safely inside multi-tenant partitions.</p>
            </div>
            <div className="flex gap-2">
              {onGotoCsvImport && (
                <button 
                  type="button"
                  onClick={() => onGotoCsvImport("crops")}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Import via CSV</span>
                </button>
              )}
              {!isReadonly && crops.length < 15 ? (
                <button 
                  id="create-crop-cycle-button"
                  onClick={() => setShowAddForm(true)}
                  className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>+ Create Crop Cycle</span>
                </button>
              ) : isReadonly ? (
                <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 rounded-lg border border-rose-100 font-mono py-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Read-only mode active
                </span>
              ) : (
                <span className="text-xs text-amber-500 font-bold bg-amber-50 px-2 rounded-lg border border-amber-100 font-mono py-1.5">
                  Tenant crop list full (Max 15 active limits)
                </span>
              )}
            </div>
          </div>

          {/* Bulk select summary indicator */}
          {selectedCropIds.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-4 shadow-sm animate-fade-in font-sans">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 text-[10px] flex items-center justify-center font-black">
                  {selectedCropIds.length}
                </span>
                <span className="text-[11px] text-rose-900 font-bold">
                  Crop cycle{selectedCropIds.length > 1 ? "s" : ""} marked for batch purge archive
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCropIds([])}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`CRITICAL RED LAYER: Delete ${selectedCropIds.length} selected crop(s)?`)) {
                      selectedCropIds.forEach(id => {
                        if (onDeleteCrop) onDeleteCrop(id);
                      });
                      setSelectedCropIds([]);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-rose-650 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Trash className="w-3 h-3" />
                  <span>Archive Bulk Rows</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Batches Card Items */}
          <div className="grid grid-cols-1 gap-6">
            {crops.map(crop => {
              const survivalRate = crop.expectedSurvivalRate || 95;
              const harvestPrice = crop.measuredInKgOrUnits === "Units" 
                ? `${currencySymbol}${crop.expectedSellingPricePerUnit || 0} / ${crop.harvestUnitName || "Unit"}`
                : `${currencySymbol}${crop.expectedSellingPricePerKg || 0} / Kg`;

              const forecastedRevenue = crop.expectedRevenueProjection || 0;
              const actualRevenue = crop.revenueLinked || 0;
              const financialVariance = actualRevenue - forecastedRevenue;

              return (
                <div key={crop.id} className="bg-white border rounded-2xl shadow-sm overflow-hidden border-slate-200">
                  {/* Card Header row */}
                  <div className="px-6 py-4 border-b bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedCropIds.includes(crop.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCropIds(prev => [...prev, crop.id]);
                          } else {
                            setSelectedCropIds(prev => prev.filter(uid => uid !== crop.id));
                          }
                        }}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4"
                      />
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-xs">
                        {crop.cropType.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-800">{crop.cropType}</h3>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-slate-200 text-slate-700 uppercase rounded">
                            {crop.plantingMethod || "Field"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium font-sans">
                          Block: <strong className="text-slate-700">{crop.fieldBlock}</strong> ({crop.areaHectares} Ha)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[9.5px] font-black uppercase text-slate-400">STAGE STATUS:</span>
                      <select 
                        value={crop.status}
                        onChange={e => onUpdateStatus(crop.id, e.target.value as any)}
                        className="text-xs font-extrabold bg-white border rounded-lg px-2.5 py-1 text-slate-700 outline-none cursor-pointer border-slate-300 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Harvested">Harvested</option>
                        <option value="Sold">Sold / Finished</option>
                      </select>
                      
                      {!isReadonly && onDeleteCrop && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to archive crop batch "${crop.cropType}"?`)) {
                              onDeleteCrop(crop.id);
                              setSelectedCropIds(prev => prev.filter(uid => uid !== crop.id));
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded bg-transparent transition-colors cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Info Panels - Bento grid style */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 border-b text-xs font-semibold">
                    {/* Plant population & spacing model info */}
                    <div className="space-y-2 border-r border-slate-100 pr-2">
                      <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Population Parameters</span>
                      </span>
                      <div className="space-y-1 text-slate-600 font-sans font-medium">
                        <p>Expected Spacing: <strong className="text-slate-800">{crop.rowSpacing || 75}x{crop.plantSpacingWithinRow || 25} cm</strong></p>
                        <p>Total Plant Population: <strong className="text-indigo-900 font-mono font-bold">{(crop.totalExpectedPlantPopulation || 0).toLocaleString()}</strong></p>
                        <p>Survival Projections: <strong className="text-slate-800">{survivalRate}% ({Math.floor((crop.totalExpectedPlantPopulation || 0) * (survivalRate/100)).toLocaleString()} Live)</strong></p>
                      </div>
                    </div>

                    {/* Yield target and measurement model */}
                    <div className="space-y-2 border-r border-slate-100 pr-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>Agronomic Volumes</span>
                      </span>
                      <div className="space-y-1 text-slate-600 font-sans font-medium">
                        <p>Expected Harvest: <strong className="text-slate-800">{crop.expectedYieldKg?.toLocaleString()} Kg</strong></p>
                        <p>Actual Yield Achieved: <strong className="text-slate-800">{crop.actualYieldKg || 0} Kg</strong></p>
                        {crop.measuredInKgOrUnits === "Units" && (
                          <p>Units Per Plant: <strong className="text-slate-800 font-mono">{crop.avgHarvestUnitsPerPlant || 1} {crop.harvestUnitName || "Unit"}</strong></p>
                        )}
                        <p>Selling Price: <strong className="text-emerald-700 font-semibold">{harvestPrice}</strong></p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2 border-r border-slate-100 pr-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Timeline Milestones</span>
                      </span>
                      <div className="space-y-1 text-slate-600 font-sans font-medium">
                        <p>Season Plating: <strong className="text-slate-800 font-mono">{crop.plantingDate}</strong></p>
                        <p>Target Collection: <strong className="text-slate-800 font-mono">{crop.expectedHarvestDate}</strong></p>
                        <p>Current Stage: <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold uppercase text-[9px] rounded font-sans">{crop.status}</span></p>
                      </div>
                    </div>

                    {/* Cash Projection PQL variance analysis */}
                    <div className="space-y-2 pl-2 text-right flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-widest">Expected Revenue</span>
                        <span className="text-md font-black text-slate-900 font-mono">
                          {currencySymbol}{(forecastedRevenue).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-widest">Postings Variance (Actual vs Planned)</span>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={`text-xs font-black font-mono ${financialVariance >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                            {financialVariance >= 0 ? "+" : ""}{currencySymbol}{financialVariance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Section Tabs */}
                  {(() => {
                    const activeCardTab = cardTabs[crop.id] || "milestones";
                    const linkedDNs = deliveryNotes.filter(dn => dn.cropCycleId === crop.id && (dn.status === "Confirmed" || dn.status === "confirmed"));
                    const revenue_recognised = linkedDNs.reduce((acc, dn) => acc + (dn.totalValue || 0), 0);
                    const cost_to_date = crop.expensesLinked || 0;
                    const gross_margin = revenue_recognised - cost_to_date;
                    const totalGrossPct = revenue_recognised > 0 ? (gross_margin / revenue_recognised) * 100 : 0;

                    return (
                      <>
                        <div className="px-6 py-2 pb-0 border-b border-slate-100 bg-slate-50/30 flex gap-4">
                          <button
                            type="button"
                            onClick={() => setCardTabs(prev => ({ ...prev, [crop.id]: "milestones" }))}
                            className={`pb-1.5 text-[11px] font-black uppercase tracking-wider relative transition-colors cursor-pointer ${
                              activeCardTab === "milestones" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            📋 Growth Milestones
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardTabs(prev => ({ ...prev, [crop.id]: "sales_margin" }))}
                            className={`pb-1.5 text-[11px] font-black uppercase tracking-wider relative transition-colors cursor-pointer ${
                              activeCardTab === "sales_margin" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            💰 Sales & Margins (Offtaker Deliveries)
                          </button>
                        </div>

                        {activeCardTab === "milestones" ? (
                          <div className="p-6 bg-slate-50/50">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-3 tracking-widest">Progressive Farm Cycle Milestones Checklist</span>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              {crop.milestones && crop.milestones.map(m => (
                                <div key={m.id} className={`p-3 rounded-xl border flex flex-col justify-between h-20 transition-all ${
                                  m.isCompleted ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-white border-slate-200 text-slate-600"
                                }`}>
                                  <div className="flex justify-between items-start">
                                    <span className="text-[11px] font-black leading-tight line-clamp-2">{m.name}</span>
                                    <input 
                                      type="checkbox"
                                      checked={m.isCompleted}
                                      onChange={e => onUpdateMilestone(crop.id, m.id, e.target.checked)}
                                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                                    />
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-400 block uppercase">Season Checklist</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 bg-slate-50/50 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Revenue Recognised</span>
                                <span className="text-lg font-black text-emerald-700 font-mono">
                                  {currencySymbol}{revenue_recognised.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-1 font-semibold leading-none font-mono">Status: Confirmed DNs</span>
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Cost To Date (COGS)</span>
                                <span className="text-lg font-black text-rose-600 font-mono">
                                  {currencySymbol}{cost_to_date.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-1 font-semibold leading-none font-mono">Direct expense lines</span>
                              </div>

                              <div className={`p-4 rounded-xl border ${gross_margin >= 0 ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"}`}>
                                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Gross Cycle Margin</span>
                                <span className={`text-lg font-black font-mono ${gross_margin >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
                                  {currencySymbol}{gross_margin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-1 font-semibold leading-none font-mono">Margin: {(totalGrossPct).toFixed(1)}%</span>
                              </div>
                            </div>

                            {/* Display underlying delivery notes support */}
                            <div className="bg-white rounded-xl border border-slate-200/85 overflow-hidden">
                              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <span className="text-[10.5px] font-bold text-slate-600 uppercase">Supporting Delivery Accruals</span>
                                <span className="text-[10px] uppercase bg-slate-200 px-1.5 py-0.5 font-bold rounded font-mono text-slate-700">
                                  {linkedDNs.length} record{linkedDNs.length === 1 ? "" : "s"}
                                </span>
                              </div>

                              {linkedDNs.length === 0 ? (
                                <div className="p-4 text-center text-xs italic text-slate-400">
                                  No confirmed delivery notes linked to this crop cycle yet. Record deliveries at Offtaker portal and project margins.
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-[11.5px]">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                                        <th className="p-2.5">DN Ref</th>
                                        <th className="p-2.5">Buyer (Offtaker)</th>
                                        <th className="p-2.5">Quantity</th>
                                        <th className="p-2.5">Grade</th>
                                        <th className="p-2.5">Unit Price</th>
                                        <th className="p-2.5 text-right">Total Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {linkedDNs.map((dn: any) => (
                                        <tr key={dn.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                          <td className="p-2.5 font-bold text-slate-800 font-mono">{dn.dnNumber}</td>
                                          <td className="p-2.5 text-slate-600 font-semibold">{dn.offtakerName || "Certified Aggregator"}</td>
                                          <td className="p-2.5 font-semibold text-slate-700">{dn.quantity || dn.qty} {dn.unit}</td>
                                          <td className="p-2.5 font-bold text-slate-500 font-mono">{dn.gradeTag || dn.grade}</td>
                                          <td className="p-2.5 font-semibold text-slate-700 font-mono">{currencySymbol}{(dn.unitPrice || 0).toFixed(2)}</td>
                                          <td className="p-2.5 text-right font-bold text-emerald-800 font-mono">{currencySymbol}{(dn.totalValue || 0).toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              );
            })}
            
            {crops.length === 0 && (
              <div className="bg-slate-50 border border-dashed p-10 text-center rounded-2xl text-slate-400 font-semibold italic">
                No active or planned crop batches registered yet. Click &ldquo;+ Create Crop Cycle&rdquo; to model your planting layout and expect yields!
              </div>
            )}
          </div>

        </div>
      ) : (
        // Tab 2: Production Forecasting & AI Yield Intelligence Dashboard
        <div className="space-y-6 animate-in fade-in duration-200 font-sans" id="crops-forecasting-panel">
          
          {/* Dashboard Summary upper widgets */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Planned Population</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-indigo-900 font-mono">{totalPlannedActivePopulation.toLocaleString()}</span>
                <span className="text-[10px] font-extrabold text-indigo-500">Seedlings Blocked</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-normal font-sans font-medium">Modelled across all active multi-tenant segments.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Total Forecast Revenue</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900 font-mono">{currencySymbol}{totalForecastedRevenue.toLocaleString()}</span>
                <span className="text-[10px] font-extrabold text-emerald-500">Pre-harvest value</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-normal font-medium">Aggregated on-row yield potential math.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Actual Realized Revenue</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-indigo-950 font-mono">{currencySymbol}{totalActualRevenue.toLocaleString()}</span>
                <span className="text-[10px] font-extrabold text-slate-500">Double-entry ledger</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-normal font-medium">Sum of all actual invoices linked successfully.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border text-white p-5 rounded-2xl border border-slate-200 space-y-1 bg-slate-950">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ledger Variance Analysis</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-black font-mono ${netVariance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {netVariance >= 0 ? "+" : ""}{currencySymbol}{netVariance.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Var</span>
              </div>
              <p className="text-[10.5px] text-slate-500 leading-normal font-medium font-sans">Compare planned goals against historical entries.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Crop Efficiency Matrix list */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Mabala Production Forecasts Ledger</h3>
                  <p className="text-xs text-slate-500">Active tenant allocations ledger accounts</p>
                </div>
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded font-mono">
                  Forecast Accounts
                </span>
              </div>

              <div className="space-y-3.5">
                {crops.length > 0 ? (
                  crops.map(c => {
                    const price = c.measuredInKgOrUnits === "Units" 
                      ? `${currencySymbol}${c.expectedSellingPricePerUnit || 0} / Unit`
                      : `${currencySymbol}${c.expectedSellingPricePerKg || 0} / Kg`;
                    const area = c.areaHectares || 1;
                    const pop = c.totalExpectedPlantPopulation || 1;
                    const expectedRev = c.expectedRevenueProjection || 0;
                    
                    // Efficiency formulas
                    const yieldPerHa = (c.expectedYieldKg || 0) / area;
                    const yieldPerAcre = ((c.expectedYieldKg || 0) / area) * 0.404686;
                    const revPerHa = expectedRev / area;
                    const revPerPlant = expectedRev / pop;

                    return (
                      <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-800 block text-sm">{c.cropType}</span>
                          <span className="text-indigo-650 font-mono">{c.fieldBlock}</span>
                        </div>

                        {/* Efficiency widgets */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-100/50">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 block">Yield Per Hectare</span>
                            <span className="text-slate-800 font-mono font-bold">{Math.floor(yieldPerHa).toLocaleString()} Kg/Ha</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 block">Yield Per Acre</span>
                            <span className="text-slate-800 font-mono font-bold">{Math.floor(yieldPerAcre).toLocaleString()} Kg/Ac</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 block">Revenue Per Hectare</span>
                            <span className="text-emerald-600 font-mono font-bold">{currencySymbol}{Math.floor(revPerHa).toLocaleString()}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 block">Revenue Per Plant</span>
                            <span className="text-emerald-600 font-mono font-bold">{currencySymbol}{revPerPlant.toFixed(2)} / pl</span>
                          </div>
                        </div>

                        {/* Target comparisons */}
                        <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500 font-sans font-medium">
                          <span>Forecast Target: <strong className="text-slate-800 font-mono">{currencySymbol}{(c.expectedRevenueProjection || 0).toLocaleString()}</strong></span>
                          <span>Actual Earned: <strong className="text-emerald-700 font-mono">{currencySymbol}{(c.revenueLinked || 0).toLocaleString()}</strong></span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-400 italic text-center p-6 text-xs">
                    Please create crop cycle batches first using Tab 1 to build financial projections ledger!
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: AI Yield Intelligence Recommendation Box */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 text-white space-y-4">
              <div className="pb-3 border-b border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#f8fafc]">
                    Hercules AI Spacing Optimizer
                  </h3>
                </div>
                <p className="text-[11px] text-slate-405 leading-relaxed">
                  Real-time machine learning recommendations parsing plant spacing, rain volumes, fertilizer usage, and soil profiles.
                </p>
              </div>

              {crops.length > 0 ? (
                <div className="space-y-4 text-xs font-semibold">
                  {/* Selector for AI */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 block uppercase">Select Target Crop Batch</label>
                    <select
                      value={aiSelectedCropId}
                      onChange={e => setAiSelectedCropId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-2.5 rounded-lg outline-none font-bold"
                    >
                      <option value="">-- Choose Harvest Batch --</option>
                      {crops.map(c => (
                        <option key={c.id} value={c.id}>{c.cropType} - Block: {c.fieldBlock} ({(c.totalExpectedPlantPopulation || 0).toLocaleString()} Pl)</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={runAiYieldDiagnostics}
                    disabled={aiLoading}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 font-bold text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    {aiLoading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                        <span>Running Core Diagnostics...</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4 text-slate-950" />
                        <span>Run AI Spacing Optimizer</span>
                      </>
                    )}
                  </button>

                  {/* AI Results */}
                  {aiReport && (
                    <div className="space-y-4 p-4 bg-slate-950/70 border border-slate-800 rounded-xl mt-3 animate-fade-in text-[11.5px] leading-relaxed">
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-0.5">
                          <span className="text-slate-400 block uppercase text-[8px]">Yield Score</span>
                          <span className="text-emerald-400 font-black font-mono text-xs">{aiReport.yieldPredictionScore}%</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-0.5">
                          <span className="text-slate-400 block uppercase text-[8px]">Revenue Conf</span>
                          <span className="text-indigo-400 font-black font-mono text-xs">{aiReport.revenueConfidenceScore}%</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-0.5">
                          <span className="text-slate-400 block uppercase text-[8px]">Harvest Risk</span>
                          <span className="text-rose-400 font-black font-mono text-xs">{aiReport.productionRiskScore}%</span>
                        </div>
                      </div>

                      {/* AI Recommendations */}
                      <div className="space-y-2 font-medium font-sans text-slate-300">
                        <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">Agronomic Guidance</span>
                        {aiReport.recommendations && aiReport.recommendations.map((rec, rIdx) => (
                          <div key={rIdx} className="flex gap-2 items-start text-xs p-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-slate-300 leading-normal font-semibold">{rec}</p>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                  {!aiReport && !aiLoading && (
                    <div className="p-4 bg-slate-950/30 border border-slate-800 border-dashed text-center text-slate-500 rounded-xl">
                      Select an active crop batch above and press run to apply AI simulation modelling and recommendations!
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-slate-500 italic text-center p-6 text-xs">
                  Please create crop cycle batches first to run AI calculations!
                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
