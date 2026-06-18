import React, { useState, useEffect } from "react";
import { Plus, Trash, Check, Info, Sparkles, Scale, DollarSign, Save, RefreshCw, ArrowRight, GitBranch, Layers, AlertTriangle, Printer } from "lucide-react";
import { FeedFormula, FormulaIngredient, PoultryBatch } from "../types";

export interface ReferenceFeedSpec {
  feedType: string;
  stage: string;
  proteinPct: string;
  energyKcal: string;
  duration: string;
}

export const REFERENCE_FEED_SPECS: ReferenceFeedSpec[] = [
  { feedType: "Chick Starter", stage: "Brooding (0–3 wks)", proteinPct: "22–24%", energyKcal: "2,900–3,000", duration: "0–21 days" },
  { feedType: "Broiler Grower", stage: "Grower (3–6 wks)", proteinPct: "19–21%", energyKcal: "3,000–3,100", duration: "22–42 days" },
  { feedType: "Broiler Finisher", stage: "Finisher (6–8 wks)", proteinPct: "18–20%", energyKcal: "3,100–3,200", duration: "43–56 days" },
  { feedType: "Layer Chick Mash", stage: "Brooding Layer (0–8 wks)", proteinPct: "20–22%", energyKcal: "2,800–2,900", duration: "0–56 days" },
  { feedType: "Layer Grower Mash", stage: "Developer (8–18 wks)", proteinPct: "16–18%", energyKcal: "2,700–2,800", duration: "57–126 days" },
  { feedType: "Layer Mash (Pre-lay)", stage: "Pre-Lay (16–18 wks)", proteinPct: "17–18% + Ca", energyKcal: "2,750", duration: "112–126 days" },
  { feedType: "Layer Mash (Production)", stage: "Layer (18+ wks)", proteinPct: "16–18% + Ca 3.5–4%", energyKcal: "2,750–2,800", duration: "Continuous" }
];

export const ZAMBIAN_INGREDIENTS_LIBRARY = [
  { name: "Maize (Zambian No. 1 Corn)", defaultCostPerKg: 3.5, crudeProteinPct: 8.5, metabolizableEnergyKcal: 3300, calciumPct: 0.02, phosphorusPct: 0.28, description: "Primary calorie starch and metabolisable energy input" },
  { name: "Soya Meal (Full Fat)", defaultCostPerKg: 8.5, crudeProteinPct: 44.0, metabolizableEnergyKcal: 2230, calciumPct: 0.25, phosphorusPct: 0.60, description: "Highly nutritious vegetable protein supplement" },
  { name: "Fishmeal (Lake Kariba Kapenta/Sardine)", defaultCostPerKg: 16.0, crudeProteinPct: 60.5, metabolizableEnergyKcal: 2900, calciumPct: 4.5, phosphorusPct: 2.80, description: "Rich marine protein source & essential calcium booster" },
  { name: "Feed Lime (Chilanga Limestone)", defaultCostPerKg: 1.5, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 38.0, phosphorusPct: 0.02, description: "Critical calcium booster for high eggshell calcification" },
  { name: "Poultry Premix (Zambian Starter/Layer)", defaultCostPerKg: 28.0, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 15.0, phosphorusPct: 10.0, description: "Fortified trace minerals and vital multi-vitamins mix" },
  { name: "Coarse Salt (Lusaka Salt-Pans)", defaultCostPerKg: 2.0, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 0.0, phosphorusPct: 0.0, description: "Sodium source to maintain physiological balance and appetite" },
  { name: "Sunflower Cake", defaultCostPerKg: 5.0, crudeProteinPct: 28.5, metabolizableEnergyKcal: 1950, calciumPct: 0.30, phosphorusPct: 0.90, description: "Local high-fiber medium protein byproduct" }
];

export const STAGE_TARGETS = {
  Starter: { crudeProteinPct: 20.0, metabolizableEnergyKcal: 2850, calciumPct: 1.0, phosphorusPct: 0.45, label: "Broiler/Pullet Pre-Starter & Starter" },
  Grower: { crudeProteinPct: 18.0, metabolizableEnergyKcal: 2800, calciumPct: 0.9, phosphorusPct: 0.40, label: "Standard Poultry Grower" },
  Finisher: { crudeProteinPct: 17.0, metabolizableEnergyKcal: 2900, calciumPct: 0.8, phosphorusPct: 0.35, label: "Broiler/Meat Finisher" },
  "Layer Mash": { crudeProteinPct: 16.0, metabolizableEnergyKcal: 2700, calciumPct: 3.5, phosphorusPct: 0.40, label: "Laying Hens Production Mash" }
};

export const DEFAULT_FORMULAS: Omit<FeedFormula, "id" | "createdAt" | "farmId">[] = [
  {
    name: "Golden-Starter Premium Crumble",
    stage: "Starter",
    version: 1,
    notes: "Professional starter formulation with 21.3% protein for rapid early life muscle skeletal frame growth.",
    totalQuantityKg: 100,
    ingredients: [
      { name: "Maize (Zambian No. 1 Corn)", quantityKg: 52, costPerKg: 3.5, crudeProteinPct: 8.5, metabolizableEnergyKcal: 3300, calciumPct: 0.02, phosphorusPct: 0.28 },
      { name: "Soya Meal (Full Fat)", quantityKg: 35, costPerKg: 8.5, crudeProteinPct: 44.0, metabolizableEnergyKcal: 2230, calciumPct: 0.25, phosphorusPct: 0.60 },
      { name: "Fishmeal (Lake Kariba Kapenta/Sardine)", quantityKg: 10, costPerKg: 16.0, crudeProteinPct: 60.5, metabolizableEnergyKcal: 2900, calciumPct: 4.5, phosphorusPct: 2.80 },
      { name: "Feed Lime (Chilanga Limestone)", quantityKg: 1.5, costPerKg: 1.5, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 38.0, phosphorusPct: 0.02 },
      { name: "Poultry Premix (Zambian Starter/Layer)", quantityKg: 1.0, costPerKg: 28.0, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 15.0, phosphorusPct: 10.0 },
      { name: "Coarse Salt (Lusaka Salt-Pans)", quantityKg: 0.5, costPerKg: 2.0, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 0.0, phosphorusPct: 0.0 }
    ]
  },
  {
    name: "Grower Performance Ration",
    stage: "Grower",
    version: 1,
    notes: "Highly uniform developer ration targeting 18.3% protein and sustainable structural development.",
    totalQuantityKg: 100,
    ingredients: [
      { name: "Maize (Zambian No. 1 Corn)", quantityKg: 58, costPerKg: 3.5, crudeProteinPct: 8.5, metabolizableEnergyKcal: 3300, calciumPct: 0.02, phosphorusPct: 0.28 },
      { name: "Soya Meal (Full Fat)", quantityKg: 28, costPerKg: 8.5, crudeProteinPct: 44.0, metabolizableEnergyKcal: 2230, calciumPct: 0.25, phosphorusPct: 0.60 },
      { name: "Sunflower Cake", quantityKg: 9, costPerKg: 5.0, crudeProteinPct: 28.5, metabolizableEnergyKcal: 1950, calciumPct: 0.30, phosphorusPct: 0.90 },
      { name: "Feed Lime (Chilanga Limestone)", quantityKg: 3.5, costPerKg: 1.5, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 38.0, phosphorusPct: 0.02 },
      { name: "Poultry Premix (Zambian Starter/Layer)", quantityKg: 1.0, costPerKg: 28.0, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 15.0, phosphorusPct: 10.0 },
      { name: "Coarse Salt (Lusaka Salt-Pans)", quantityKg: 0.5, costPerKg: 2.0, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 0.0, phosphorusPct: 0.0 }
    ]
  },
  {
    name: "Broiler Finisher High-ME Power",
    stage: "Finisher",
    version: 1,
    notes: "Concentrated energy formula to lock in meat weight, uniform fats and outstanding feed conversion ratios.",
    totalQuantityKg: 100,
    ingredients: [
      { name: "Maize (Zambian No. 1 Corn)", quantityKg: 64, costPerKg: 3.5, crudeProteinPct: 8.5, metabolizableEnergyKcal: 3300, calciumPct: 0.02, phosphorusPct: 0.28 },
      { name: "Soya Meal (Full Fat)", quantityKg: 25, costPerKg: 8.5, crudeProteinPct: 44.0, metabolizableEnergyKcal: 2230, calciumPct: 0.25, phosphorusPct: 0.60 },
      { name: "Sunflower Cake", quantityKg: 6, costPerKg: 5.0, crudeProteinPct: 28.5, metabolizableEnergyKcal: 1950, calciumPct: 0.30, phosphorusPct: 0.90 },
      { name: "Feed Lime (Chilanga Limestone)", quantityKg: 3.5, costPerKg: 1.5, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 38.0, phosphorusPct: 0.02 },
      { name: "Poultry Premix (Zambian Starter/Layer)", quantityKg: 1.0, costPerKg: 28.0, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 15.0, phosphorusPct: 10.0 },
      { name: "Coarse Salt (Lusaka Salt-Pans)", quantityKg: 0.5, costPerKg: 2.0, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 0.0, phosphorusPct: 0.0 }
    ]
  },
  {
    name: "Ultra-Egg Calcium Power Mash",
    stage: "Layer Mash",
    version: 1,
    notes: "High 3.8% calcium layer formulation specialized for robust shell density and maximum hen-day consistency.",
    totalQuantityKg: 100,
    ingredients: [
      { name: "Maize (Zambian No. 1 Corn)", quantityKg: 51, costPerKg: 3.5, crudeProteinPct: 8.5, metabolizableEnergyKcal: 3300, calciumPct: 0.02, phosphorusPct: 0.28 },
      { name: "Soya Meal (Full Fat)", quantityKg: 25, costPerKg: 8.5, crudeProteinPct: 44.0, metabolizableEnergyKcal: 2230, calciumPct: 0.25, phosphorusPct: 0.60 },
      { name: "Fishmeal (Lake Kariba Kapenta/Sardine)", quantityKg: 8, costPerKg: 16.0, crudeProteinPct: 60.5, metabolizableEnergyKcal: 2900, calciumPct: 4.5, phosphorusPct: 2.80 },
      { name: "Feed Lime (Chilanga Limestone)", quantityKg: 14, costPerKg: 1.5, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 38.0, phosphorusPct: 0.02 },
      { name: "Poultry Premix (Zambian Starter/Layer)", quantityKg: 1.5, costPerKg: 28.0, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 15.0, phosphorusPct: 10.0 },
      { name: "Coarse Salt (Lusaka Salt-Pans)", quantityKg: 0.5, costPerKg: 2.0, crudeProteinPct: 0.0, metabolizableEnergyKcal: 0, calciumPct: 0.0, phosphorusPct: 0.0 }
    ]
  }
];

interface FeedFormulationBuilderProps {
  currencySymbol: string;
  customFormulas: FeedFormula[];
  setCustomFormulas: React.Dispatch<React.SetStateAction<FeedFormula[]>>;
  batches: PoultryBatch[];
  onUpdatePoultryBatch?: (batch: PoultryBatch) => void;
}

export const FeedFormulationBuilder: React.FC<FeedFormulationBuilderProps> = ({
  currencySymbol,
  customFormulas,
  setCustomFormulas,
  batches,
  onUpdatePoultryBatch
}) => {
  // Region ingredients library state with custom price modifications support
  const [ingredientsLib, setIngredientsLib] = useState(() => {
    const cached = localStorage.getItem("mabala_feed_ingredients_library");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Error reading cached ingredients library", e);
      }
    }
    return ZAMBIAN_INGREDIENTS_LIBRARY;
  });

  const handleUpdateBasePrice = (index: number, newPrice: number) => {
    const updated = [...ingredientsLib];
    updated[index] = {
      ...updated[index],
      defaultCostPerKg: newPrice
    };
    setIngredientsLib(updated);
    localStorage.setItem("mabala_feed_ingredients_library", JSON.stringify(updated));
    if (Number(selectedLibIngredientIdx) === index) {
      setLibPriceInput(newPrice);
    }
  };

  // Current active working formula state
  const [selectedStage, setSelectedStage] = useState<"Starter" | "Grower" | "Finisher" | "Layer Mash">("Starter");
  const [formulaName, setFormulaName] = useState("Custom Starter Formula");
  const [formulaNotes, setFormulaNotes] = useState("Specially formulated feed ratio optimized for high feed intake");
  const [currentVersion, setCurrentVersion] = useState(1);
  const [activeFormulaId, setActiveFormulaId] = useState<string | null>(null);

  // Ingredients state within the working formula
  const [ingredientsList, setIngredientsList] = useState<FormulaIngredient[]>([]);

  // Library lookup selections state
  const [selectedLibIngredientIdx, setSelectedLibIngredientIdx] = useState<number>(0);
  const [libWeightInput, setLibWeightInput] = useState<number>(10);
  const [libPriceInput, setLibPriceInput] = useState<number>(3.5);

  // Custom added ingredient state
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState(5);
  const [customWeight, setCustomWeight] = useState(10);
  const [customCP, setCustomCP] = useState(15);
  const [customME, setCustomME] = useState(2500);
  const [customCa, setCustomCa] = useState(1);
  const [customP, setCustomP] = useState(0.5);
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Batch feeding interaction states
  const [feedingBatchId, setFeedingBatchId] = useState("");
  const [feedingQuantityKg, setFeedingQuantityKg] = useState(150);
  const [feedingOfficer, setFeedingOfficer] = useState("Clara Mwila");
  const [feedingSuccessMsg, setFeedingSuccessMsg] = useState("");

  // Scale print mixture size state
  const [printScaleBatch, setPrintScaleBatch] = useState<number>(0);

  // Initialize with Golden Starter
  useEffect(() => {
    handleLoadTemplate(DEFAULT_FORMULAS[0]);
  }, []);

  const handleLoadTemplate = (tpl: Omit<FeedFormula, "id" | "createdAt" | "farmId"> | FeedFormula) => {
    setFormulaName(tpl.name);
    setSelectedStage(tpl.stage);
    setFormulaNotes(tpl.notes || "");
    setIngredientsList([...tpl.ingredients]);
    setCurrentVersion(tpl.version || 1);
    if ("id" in tpl) {
      setActiveFormulaId(tpl.id);
    } else {
      setActiveFormulaId(null);
    }
  };

  // Add library ingredient
  const handleAddLibraryIngredient = () => {
    const libItem = ingredientsLib[selectedLibIngredientIdx];
    if (!libItem) return;

    // Check if food already in current recipe
    const existingIdx = ingredientsList.findIndex(item => item.name === libItem.name);
    if (existingIdx > -1) {
      // update weight & price
      const updated = [...ingredientsList];
      updated[existingIdx].quantityKg += libWeightInput;
      updated[existingIdx].costPerKg = libPriceInput;
      setIngredientsList(updated);
    } else {
      // create new
      const newItem: FormulaIngredient = {
        name: libItem.name,
        quantityKg: libWeightInput,
        costPerKg: libPriceInput,
        crudeProteinPct: libItem.crudeProteinPct,
        metabolizableEnergyKcal: libItem.metabolizableEnergyKcal,
        calciumPct: libItem.calciumPct,
        phosphorusPct: libItem.phosphorusPct
      };
      setIngredientsList([...ingredientsList, newItem]);
    }
    // Update pre-set value
    setLibWeightInput(10);
  };

  // Add custom entry
  const handleAddCustomIngredient = () => {
    if (!customName.trim()) return;
    const newItem: FormulaIngredient = {
      name: customName,
      quantityKg: customWeight,
      costPerKg: customPrice,
      crudeProteinPct: customCP,
      metabolizableEnergyKcal: customME,
      calciumPct: customCa,
      phosphorusPct: customP
    };
    setIngredientsList([...ingredientsList, newItem]);
    setCustomName("");
    setShowCustomForm(false);
  };

  // Remove ingredient
  const handleRemoveIngredient = (index: number) => {
    const updated = ingredientsList.filter((_, i) => i !== index);
    setIngredientsList(updated);
  };

  // Handle edit quantity or price directly inside workspace table
  const handleEditIngredientField = (index: number, field: "quantityKg" | "costPerKg", value: number) => {
    const updated = [...ingredientsList];
    updated[index][field] = Math.max(0, value);
    setIngredientsList(updated);
  };

  // Calculate live outputs
  const calculatedStats = (() => {
    const totalWeight = ingredientsList.reduce((sum, item) => sum + item.quantityKg, 0);
    const totalCost = ingredientsList.reduce((sum, item) => sum + (item.quantityKg * item.costPerKg), 0);
    const costPerKg = totalWeight > 0 ? totalCost / totalWeight : 0;

    let crudeProteinSum = 0;
    let metabolizableEnergySum = 0;
    let calciumSum = 0;
    let phosphorusSum = 0;

    ingredientsList.forEach(item => {
      crudeProteinSum += (item.quantityKg * item.crudeProteinPct);
      metabolizableEnergySum += (item.quantityKg * item.metabolizableEnergyKcal);
      calciumSum += (item.quantityKg * item.calciumPct);
      phosphorusSum += (item.quantityKg * item.phosphorusPct);
    });

    return {
      totalWeight,
      totalCost,
      costPerKg,
      crudeProteinPct: totalWeight > 0 ? (crudeProteinSum / totalWeight) : 0,
      metabolizableEnergyKcal: totalWeight > 0 ? (metabolizableEnergySum / totalWeight) : 0,
      calciumPct: totalWeight > 0 ? (calciumSum / totalWeight) : 0,
      phosphorusPct: totalWeight > 0 ? (phosphorusSum / totalWeight) : 0
    };
  })();

  // Deficiencies flagging helper
  const target = STAGE_TARGETS[selectedStage];
  const deficiencies = (() => {
    const list: { field: string; label: string; current: number; required: number; severity: "red" | "orange"; text: string }[] = [];
    if (!target) return list;

    if (calculatedStats.crudeProteinPct < target.crudeProteinPct) {
      list.push({
        field: "CP",
        label: "Crude Protein",
        current: calculatedStats.crudeProteinPct,
        required: target.crudeProteinPct,
        severity: "red",
        text: `Protein deficit detected! Current: ${calculatedStats.crudeProteinPct.toFixed(1)}%. Target minimum for ${selectedStage} is ${target.crudeProteinPct}%. Rapid growth demands additional soya or fishmeal.`
      });
    }

    if (calculatedStats.metabolizableEnergyKcal < target.metabolizableEnergyKcal) {
      list.push({
        field: "ME",
        label: "Metabolizable Energy",
        current: calculatedStats.metabolizableEnergyKcal,
        required: target.metabolizableEnergyKcal,
        severity: "orange",
        text: `Energy density is below standard! Current: ${calculatedStats.metabolizableEnergyKcal.toFixed(0)} kcal/kg. Target is ${target.metabolizableEnergyKcal} kcal/kg. Add high-calorie Maize.`
      });
    }

    if (calculatedStats.calciumPct < target.calciumPct) {
      list.push({
        field: "Ca",
        label: "Calcium",
        current: calculatedStats.calciumPct,
        required: target.calciumPct,
        severity: "red",
        text: `Calcium levels are dangerously deficient! Current: ${calculatedStats.calciumPct.toFixed(2)}%. Target is ${target.calciumPct}%. Critical for eggshell calcification and pullet skeletal strength. Supplement with Feed Lime.`
      });
    }

    if (calculatedStats.phosphorusPct < target.phosphorusPct) {
      list.push({
        field: "P",
        label: "Phosphorus",
        current: calculatedStats.phosphorusPct,
        required: target.phosphorusPct,
        severity: "orange",
        text: `Phosphorus deficiency. Current: ${calculatedStats.phosphorusPct.toFixed(2)}%. Target is ${target.phosphorusPct}%. Incorporate high-phosphorus Premix or Fishmeal.`
      });
    }

    return list;
  })();

  // Uniform scale to 100Kg mix helper
  const handleScaleFormula = (targetTotalKg: number) => {
    const currentTotal = calculatedStats.totalWeight;
    if (currentTotal <= 0) return;
    const factor = targetTotalKg / currentTotal;

    const scaled = ingredientsList.map(item => ({
      ...item,
      quantityKg: Number((item.quantityKg * factor).toFixed(2))
    }));
    setIngredientsList(scaled);
  };

  // Printable guide exporter for the feed room
  const handlePrintMixingGuide = () => {
    // Create an invisible iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    // Generate dynamic ingredient rows
    const ingredientRowsHTML = ingredientsList.map((item) => {
      const proportion = calculatedStats.totalWeight > 0 ? (item.quantityKg / calculatedStats.totalWeight) * 100 : 0;
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-family: monospace;">
          <td style="padding: 10px; font-weight: bold; color: #0f172a; text-align: left; font-family: sans-serif;">${item.name}</td>
          <td style="padding: 10px; text-align: center; color: #4f46e5; font-weight: 700;">${proportion.toFixed(1)}%</td>
          <td style="padding: 10px; text-align: right; font-weight: 800; font-size: 14px; color: #030712;">${item.quantityKg.toFixed(2)} Kg</td>
          <td style="padding: 10px; text-align: right; color: #4b5563;">${currencySymbol} ${item.costPerKg.toFixed(2)}/Kg</td>
          <td style="padding: 10px; text-align: right; font-weight: 700; color: #047857;">${currencySymbol} ${(item.quantityKg * item.costPerKg).toFixed(2)}</td>
          <td style="padding: 10px; text-align: center; color: #9ca3af; font-size: 14px;">[ &nbsp; &nbsp; ]</td>
        </tr>
      `;
    }).join("");

    // Generate dynamic reference standard target rows
    const referenceRowsHTML = REFERENCE_FEED_SPECS.map((spec) => `
      <tr style="border-bottom: 1px dashed #e2e8f0; font-size: 11px;">
        <td style="padding: 6px; font-weight: bold; color: #374151; text-align: left;">${spec.feedType}</td>
        <td style="padding: 6px; color: #4b5563; text-align: left;">${spec.stage}</td>
        <td style="padding: 6px; text-align: center; font-weight: 800; color: #1d4ed8;">${spec.proteinPct}</td>
        <td style="padding: 6px; text-align: center; font-weight: 700; color: #030712;">${spec.energyKcal} Kcal</td>
        <td style="padding: 6px; text-align: right; color: #6b7280;">${spec.duration}</td>
      </tr>
    `).join("");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Feed Formulation Mixing Guide - ${formulaName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1f2937;
            background: #ffffff;
            line-height: 1.4;
            margin: 0;
            padding: 0;
          }
          .header-box {
            border-bottom: 3px double #111827;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .badge-spec {
            border: 2px dashed #047857;
            color: #047857;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            text-align: center;
            max-width: 150px;
          }
          h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            color: #111827;
          }
          .subtitle {
            margin: 4px 0 0 0;
            font-size: 11px;
            color: #4b5563;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .stats-grid {
            display: grid;
            grid-template-cols: repeat(4, 1fr);
            gap: 12px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .stat-item {
            display: flex;
            flex-direction: column;
          }
          .stat-lbl {
            font-size: 8px;
            font-weight: 800;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .stat-val {
            font-size: 12px;
            font-weight: bold;
            color: #111827;
          }
          .pills-panel {
            display: grid;
            grid-template-cols: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .pill-box {
            background-color: #111827;
            color: #ffffff;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
          }
          .pill-num {
            font-size: 16px;
            font-weight: 900;
            color: #fbbf24;
          }
          .pill-lbl {
            font-size: 9px;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #111827;
            color: #ffffff;
            padding: 8px 10px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            text-align: right;
          }
          th:first-child {
            text-align: left;
          }
          th:nth-child(2), th:last-child {
            text-align: center;
          }
          .info-note {
            background-color: #fef3c7;
            border-left: 4px solid #d97706;
            padding: 10px;
            border-radius: 4px;
            font-size: 11px;
            color: #78350f;
            margin-bottom: 20px;
            font-weight: 550;
          }
          .standards-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            background-color: #f9fafb;
            margin-bottom: 20px;
          }
          .standards-title {
            font-size: 11px;
            font-weight: 800;
            color: #111827;
            text-transform: uppercase;
            margin-top: 0;
            margin-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
          }
          .standards-list {
            margin: 0;
            padding-left: 15px;
            font-size: 10px;
            color: #374151;
          }
          .standards-list li {
            margin-bottom: 4px;
          }
          .signing-block {
            margin-top: 30px;
            display: grid;
            grid-template-cols: 1fr 1fr 1fr;
            gap: 20px;
            text-align: center;
            font-size: 10px;
          }
          .sign-field {
            border-top: 1px solid #9ca3af;
            margin-top: 35px;
            padding-top: 6px;
            font-weight: bold;
            color: #4b5563;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <span style="font-size: 9px; font-weight: 800; color: #4f46e5; letter-spacing: 2px; text-transform: uppercase; display: block;">FARM MIX STORE LOGISTIC FORM</span>
            <h1>FEED MIXING ROOM SHEET</h1>
            <p class="subtitle">Zambia National Poultry Standard Formulation Guideline</p>
          </div>
          <div class="badge-spec">
            Veterinary Verified<br/>Biosecure Compound
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-lbl">Active Formula Name</span>
            <span class="stat-val" style="color: #4f46e5;">${formulaName}</span>
          </div>
          <div class="stat-item">
            <span class="stat-lbl">Required Stage Target</span>
            <span class="stat-val"><span style="background-color: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase;">${selectedStage}</span></span>
          </div>
          <div class="stat-item">
            <span class="stat-lbl">Desired Batch Level</span>
            <span class="stat-val" style="font-family: monospace; font-size: 13px; font-weight: bold; color: #047857;">${calculatedStats.totalWeight.toFixed(1)} Kg</span>
          </div>
          <div class="stat-item">
            <span class="stat-lbl">Dispatch-Date Stamp</span>
            <span class="stat-val">${new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>

        ${formulaNotes ? `
          <div class="info-note">
            <strong>📋 WORKER CRITICAL DETAILS:</strong> ${formulaNotes}
          </div>
        ` : ""}

        <div class="pills-panel">
          <div class="pill-box">
            <div class="pill-num">${calculatedStats.crudeProteinPct.toFixed(1)}%</div>
            <div class="pill-lbl">Crude Protein</div>
          </div>
          <div class="pill-box">
            <div class="pill-num">${calculatedStats.metabolizableEnergyKcal.toFixed(0)}</div>
            <div class="pill-lbl">Energy (kcal/kg)</div>
          </div>
          <div class="pill-box">
            <div class="pill-num">${calculatedStats.calciumPct.toFixed(2)}%</div>
            <div class="pill-lbl">Calcium (Ca)</div>
          </div>
          <div class="pill-box">
            <div class="pill-num">${calculatedStats.phosphorusPct.toFixed(2)}%</div>
            <div class="pill-lbl">Phosphorus (P)</div>
          </div>
        </div>

        <h3 style="font-size: 12px; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; color: #111827; border-bottom: 2px solid #111827; padding-bottom: 2px;">⚖️ FEEDSTOCK RAW MATERIAL MIX RATIOS</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 32%;">Ingredient Input</th>
              <th style="width: 15%; text-align: center;">Formula Ratio</th>
              <th style="width: 18%; text-align: right;">Target Fill Weight</th>
              <th style="width: 15%; text-align: right;">Baseline Cost</th>
              <th style="width: 15%; text-align: right;">Gross Subtotal</th>
              <th style="width: 15%; text-align: center;">Operator OK</th>
            </tr>
          </thead>
          <tbody>
            ${ingredientRowsHTML}
            <tr style="background-color: #f9fafb; font-weight: bold; border-top: 2px solid #111827;">
              <td style="padding: 10px; font-weight: bold;">TOTAL DISPATCH BATCH</td>
              <td style="padding: 10px; text-align: center; font-weight: bold; color: #4f46e5;">100.0%</td>
              <td style="padding: 10px; text-align: right; font-weight: 900; font-size: 15px; color: #4f46e5;">${calculatedStats.totalWeight.toFixed(2)} Kg</td>
              <td style="padding: 10px; text-align: right; color: #6b7280; font-size: 10px;">AVERAGE:</td>
              <td style="padding: 10px; text-align: right; font-weight: 800; color: #047857;">${currencySymbol} ${calculatedStats.totalCost.toFixed(2)}</td>
              <td style="padding: 10px; text-align: center; color: #047857; font-weight: bold;">[ READY ]</td>
            </tr>
          </tbody>
        </table>

        <div class="standards-card">
          <h4 class="standards-title">🛡️ CHISAMBA POULTRY UNIT COMPLIANCE CHECKLIST</h4>
          <ul class="standards-list">
            <li><strong>AFLATOXIN RISK PREVENTION:</strong> Strictly inspect maize stock for Aspergillus flavus (discolored moldy kernels, high moisture, or sour smell) before milling. Moldy maize triggers severe liver morbidity and drops lay rates.</li>
            <li><strong>PRE-MIX DISPERSION:</strong> Under no circumstances dump micro-premix or coarse salt directly into a large capacity mixer. First hand-mix standard salt, premix, and feed lime with a 5kg bucket of milled maize until completely homogenous, then distribute evenly into the drum.</li>
            <li><strong>MILLED PARTICLE RANGES:</strong> Layer Mash for laying hens requires coarse grit structure (1.5mm to 3.5mm) to slow digested calcification release overnight. Starter chicks require fine uniform grind size (crumble density).</li>
            <li><strong>EQUIPMENT HYGIENE:</strong> Ensure the main drum mixer is isolated from chemical contaminants. Wear dust masks and sanitize handling shovels before starting.</li>
          </ul>
        </div>

        <div style="page-break-inside: avoid; margin-top: 25px;">
          <h3 style="font-size: 11px; margin-bottom: 8px; text-transform: uppercase; color: #111827; border-bottom: 1px dashed #cccccc; padding-bottom: 2px;">📖 TARGET NUTRITIONAL STAGE SPECIFICATIONS LIMITS (REFERENCE)</h3>
          <table>
            <thead>
              <tr style="background-color: #374151;">
                <th style="padding: 4px 6px; font-size: 9px; color: #ffffff; text-align: left;">Feed Formulation Type</th>
                <th style="padding: 4px 6px; font-size: 9px; color: #ffffff; text-align: left;">Recommended Stage Range</th>
                <th style="padding: 4px 6px; font-size: 9px; color: #ffffff; text-align: center;">Crude Protein %</th>
                <th style="padding: 4px 6px; font-size: 9px; color: #ffffff; text-align: center;">Energy ME (kcal/kg)</th>
                <th style="padding: 4px 6px; font-size: 9px; color: #ffffff; text-align: right;">Standard feeding Span</th>
              </tr>
            </thead>
            <tbody>
              ${referenceRowsHTML}
            </tbody>
          </table>
        </div>

        <div class="signing-block">
          <div>
            <div class="sign-field">FEED HANDLER (MIXER OPERATOR)</div>
            <span style="font-size: 8px; color: #6b7280; display: block; margin-top: 2px;">Sign on verification of physical fill bucket ratios</span>
          </div>
          <div>
            <div class="sign-field">HOUSE SUPERVISOR / MANAGER</div>
            <span style="font-size: 8px; color: #6b7280; display: block; margin-top: 2px;">Approved for dispatch to flock coordinate coordinates</span>
          </div>
          <div>
            <div class="sign-field">PHYSICAL DISPATCH BIN & SILO BATCH #</div>
            <span style="font-size: 8px; color: #6b7280; display: block; margin-top: 2px;">Ex: Bin-5 Feed silo / Cohort Batch B-2</span>
          </div>
        </div>
      </body>
      </html>
    `);
    doc.close();

    // Trigger printing
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1200);
      }
    }, 450);
  };

  // Save new Formula controller
  const handleSaveFormula = (isNew: boolean) => {
    if (!formulaName.trim()) return;

    if (isNew || !activeFormulaId) {
      const generatedId = `custom-formula-${Date.now()}`;
      const newFormula: FeedFormula = {
        id: generatedId,
        name: formulaName,
        stage: selectedStage,
        version: 1,
        createdAt: new Date().toISOString().split('T')[0],
        notes: formulaNotes,
        ingredients: [...ingredientsList],
        totalQuantityKg: calculatedStats.totalWeight,
        farmId: "farm-1"
      };

      const updated = [newFormula, ...customFormulas];
      setCustomFormulas(updated);
      localStorage.setItem("poultry_custom_formulas", JSON.stringify(updated));
      setActiveFormulaId(generatedId);
      setCurrentVersion(1);
      alert(`🎉 New formulation "${formulaName}" cataloged successfully!`);
    } else {
      // Update existing & increment version code
      const updated = customFormulas.map(f => {
        if (f.id === activeFormulaId) {
          return {
            ...f,
            name: formulaName,
            stage: selectedStage,
            version: f.version + 1,
            notes: formulaNotes,
            ingredients: [...ingredientsList],
            totalQuantityKg: calculatedStats.totalWeight,
            createdAt: new Date().toISOString().split('T')[0]
          };
        }
        return f;
      });
      setCustomFormulas(updated);
      localStorage.setItem("poultry_custom_formulas", JSON.stringify(updated));
      setCurrentVersion(prev => prev + 1);
      alert(`🎉 Formulation "${formulaName}" updated to Version ${currentVersion + 1}!`);
    }
  };

  // Delete saved formula
  const handleDeleteSavedFormula = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Confirm deleting this custom formulation permanently?")) return;
    const updated = customFormulas.filter(f => f.id !== id);
    setCustomFormulas(updated);
    localStorage.setItem("poultry_custom_formulas", JSON.stringify(updated));
    if (activeFormulaId === id) {
      setActiveFormulaId(null);
    }
  };

  // Direct allocate and feeding of active flock batch
  const handleAllocateFeedBatch = () => {
    if (!feedingBatchId) {
      alert("Please choose a target Poultry Batch to allocate this feed to.");
      return;
    }
    const targetBatch = batches.find(b => b.id === feedingBatchId);
    if (!targetBatch) return;

    if (calculatedStats.totalWeight <= 0) {
      alert("Your working formula has no ingredients loaded.");
      return;
    }

    // Cost calculations
    const costPerKg = calculatedStats.costPerKg;
    const allocatedIncurredCost = feedingQuantityKg * costPerKg;

    // Log feed event into this batch
    if (onUpdatePoultryBatch) {
      const feedLogItem = {
        date: new Date().toISOString().split('T')[0],
        quantityKg: feedingQuantityKg,
        cost: allocatedIncurredCost,
        fedBy: feedingOfficer,
        feedType: `${selectedStage} Rations`,
        formulaUsed: formulaName,
        stageId: targetBatch.currentStageId || "grower"
      };

      const updatedBatch = {
        ...targetBatch,
        feedLogs: [...(targetBatch.feedLogs || []), feedLogItem]
      };

      onUpdatePoultryBatch(updatedBatch);
      setFeedingSuccessMsg(`✅ Sent ${feedingQuantityKg} kg of "${formulaName}" to ${targetBatch.batchName}. Expenses of ${currencySymbol}${allocatedIncurredCost.toFixed(1)} parsed onto operational books!`);
      setTimeout(() => setFeedingSuccessMsg(""), 6000);
    }
  };

  // Update library index prices of selected library element
  useEffect(() => {
    const libItem = ingredientsLib[selectedLibIngredientIdx];
    if (libItem) {
      setLibPriceInput(libItem.defaultCostPerKg);
    }
  }, [selectedLibIngredientIdx, ingredientsLib]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900 text-white p-6.5 rounded-3xl relative overflow-hidden shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <span className="text-[10px] font-black tracking-widest text-amber-400 bg-amber-400/15 py-1 px-3 rounded-full uppercase block w-max">
            ZAMBIAN REGIONAL FEED SPECIFICATIONS v4.1
          </span>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">🌾 FEED FORMULATION ENGINE & NUTRITIONAL PROFILE OPTIMIZER</h2>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Formulate high-performance diets, balance biological limits, and execute cost mitigation strategies. Leverage local Zambian feedstocks: Chilanga Limestone, Kariba Lake Sardine Kapenta, full fat soybeans, and coarse salt pans.
          </p>
        </div>
        <div className="flex bg-amber-500/10 border border-amber-400/40 p-3.5 rounded-2xl flex-col items-center justify-center shrink-0">
          <span className="text-[8.5px] font-extrabold uppercase text-amber-300 tracking-wider">CHILANGA BASELINE CALCIUM</span>
          <span className="font-mono text-xl font-extrabold text-amber-400 mt-0.5">38.0% Ca</span>
        </div>
      </div>

      {/* Grid containing saved presets and builder */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Presets and House Formula Library */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Quick Loaded Starter Templates */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 p-5 rounded-2xl border border-amber-200/85 shadow-sm">
            <div className="flex items-center gap-2 pb-2.5 border-b border-amber-200 mb-3.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <h4 className="text-xs font-black uppercase text-amber-950">Pre-built Default Formula Templates</h4>
            </div>
            <p className="text-[11px] text-slate-650 leading-relaxed mb-4 font-medium">
              Select an official baseline recipe formulated by regional smallholder agronomists. Select one to quickly load and edit it:
            </p>
            <div className="space-y-3">
              {DEFAULT_FORMULAS.map((df, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLoadTemplate(df)}
                  className="w-full text-left bg-white p-3.5 rounded-xl border border-amber-300/45 hover:border-amber-500 transition-all hover:shadow-3xs flex justify-between items-center group cursor-pointer"
                >
                  <div className="space-y-1 pr-2">
                    <span className="text-[8.5px] font-black bg-amber-100 text-amber-900 uppercase tracking-widest px-1.5 py-0.2 rounded font-mono">
                      {df.stage}
                    </span>
                    <h5 className="font-bold text-slate-900 text-xs mt-1 font-sans">{df.name}</h5>
                    <p className="text-[9.5px] text-slate-450 line-clamp-1">{df.notes}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* User's Version Controlled Custom Formulations */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-700" />
                <h4 className="text-xs font-black uppercase text-slate-800">Saved Farm House Formulas</h4>
              </div>
              <span className="font-mono font-black text-[9.5px] bg-slate-100 text-slate-600 px-2 rounded-full">
                {customFormulas.length} Presets
              </span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {customFormulas.length > 0 ? (
                customFormulas.map((cf) => (
                  <div
                    key={cf.id}
                    onClick={() => handleLoadTemplate(cf)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center group ${
                      activeFormulaId === cf.id
                        ? "bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-300"
                        : "bg-slate-50/60 border-slate-200 hover:border-slate-350"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded font-mono uppercase">
                          {cf.stage}
                        </span>
                        <span className="text-[8px] font-mono text-slate-450 bg-slate-100 px-1 py-0.2 rounded">
                          v{cf.version}
                        </span>
                      </div>
                      <h5 className="font-sans font-extrabold text-xs text-slate-900 mt-1">{cf.name}</h5>
                      <div className="flex items-center gap-3 text-[9px] text-slate-500 font-bold">
                        <span>⚖️ {cf.totalQuantityKg.toFixed(0)} kg</span>
                        <span>•</span>
                        <span>🗓️ {cf.createdAt}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSavedFormula(cf.id, e)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 italic text-slate-400 text-xs">
                  No custom farm house formulas registered yet. Build one on the right to start.
                </div>
              )}
            </div>
          </div>

          {/* REFERENCE FEED SPECS TABLE CARD */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-black uppercase text-slate-800 font-sans">Dietary Stage targets</h4>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
              Reference standard dietary nutritional limits formulated for ideal poultry growth and egg density:
            </p>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {REFERENCE_FEED_SPECS.map((spec, i) => (
                <div key={i} className="border-b border-dashed border-slate-100 pb-3 last:border-0 last:pb-0 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900 font-sans">{spec.feedType}</span>
                    <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                      {spec.duration}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10.5px]">
                    <div>
                      <span className="text-[8.5px] uppercase text-slate-400 block font-bold">Stage</span>
                      <span className="font-semibold text-slate-600 line-clamp-1">{spec.stage}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[8.5px] uppercase text-slate-400 block font-bold font-mono">Protein</span>
                      <span className="font-black text-amber-750">{spec.proteinPct}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8.5px] uppercase text-slate-400 block font-bold">ME Energy</span>
                      <span className="font-extrabold text-slate-800 font-mono">{spec.energyKcal} kcal</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Formula Builder workspace */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            {/* Top Workspace Form Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 border-b">
              
              <div className="md:col-span-5 flex flex-col gap-1">
                <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider font-sans">Formula Name</label>
                <input
                  type="text"
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  className="border p-2.5 rounded-xl text-xs font-bold text-slate-800 italic"
                  placeholder="e.g. Chisamba Layer Mash Optimum Mix"
                />
              </div>

              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider font-sans">Target Production Stage</label>
                <select
                  value={selectedStage}
                  onChange={(e) => {
                    const st = e.target.value as any;
                    setSelectedStage(st);
                  }}
                  className="border p-2.5 rounded-xl bg-slate-50 text-xs font-black text-amber-950 font-sans"
                >
                  <option value="Starter">Starter</option>
                  <option value="Grower">Grower</option>
                  <option value="Finisher">Finisher</option>
                  <option value="Layer Mash">Layer Mash</option>
                </select>
              </div>

              <div className="md:col-span-4 flex flex-col gap-1">
                <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider font-sans">Formulator's Log Notes</label>
                <input
                  type="text"
                  value={formulaNotes}
                  onChange={(e) => setFormulaNotes(e.target.value)}
                  className="border p-2.5 rounded-xl text-xs font-semibold text-slate-500"
                  placeholder="e.g. Higher lime concentration for late layer batches."
                />
              </div>

            </div>

            {/* LIVE PROFILE OUTPUT (The calculated nutritional profile and cost) */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-black tracking-widest text-slate-350 uppercase">Formulated Active Compound Profile</span>
                </div>
                <div className="text-[9px] font-mono text-slate-450 bg-slate-850 px-3 py-1 rounded">
                  STAGE TARGET: {selectedStage.toUpperCase()} ({target?.label})
                </div>
              </div>

              {/* Grid with parameters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">Crude Protein</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-mono text-lg font-black text-slate-100">
                      {calculatedStats.crudeProteinPct.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">CP</span>
                  </div>
                  <div className="text-[9px] pt-1 border-t border-slate-800/40 text-slate-400 font-bold">
                    Target: <span className="font-mono font-extrabold text-amber-300">&gt;={target?.crudeProteinPct}%</span>
                  </div>
                </div>

                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">Metabolizable Energy</span>
                  <div className="flex items-baseline gap-1 mt-1 font-mono">
                    <span className="text-lg font-black text-slate-100">
                      {calculatedStats.metabolizableEnergyKcal.toFixed(0)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">kcal/kg</span>
                  </div>
                  <div className="text-[9px] pt-1 border-t border-slate-800/40 text-slate-400 font-bold">
                    Target: <span className="font-mono font-extrabold text-amber-300">&gt;={target?.metabolizableEnergyKcal}</span>
                  </div>
                </div>

                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">Calcium (Ca)</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-mono text-lg font-black text-slate-100">
                      {calculatedStats.calciumPct.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Ca</span>
                  </div>
                  <div className="text-[9px] pt-1 border-t border-slate-800/40 text-slate-400 font-bold">
                    Target: <span className="font-mono font-extrabold text-amber-300">~{target?.calciumPct}%</span>
                  </div>
                </div>

                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">Phosphorus (P)</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-mono text-lg font-black text-slate-100">
                      {calculatedStats.phosphorusPct.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">P</span>
                  </div>
                  <div className="text-[9px] pt-1 border-t border-slate-800/40 text-slate-400 font-bold">
                    Target: <span className="font-mono font-extrabold text-amber-300">~{target?.phosphorusPct}%</span>
                  </div>
                </div>

              </div>

              {/* Cost-per-kg calculation card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-800/80 pt-3 flex-wrap items-center">
                <div className="text-[11px] text-slate-350 font-bold flex gap-3 items-center">
                  <span>Batch Total: <span className="font-mono text-white text-xs font-extrabold">{calculatedStats.totalWeight.toFixed(1)} kg</span></span>
                  <span>Compound Cost: <span className="font-mono text-white text-xs font-extrabold">{currencySymbol} {calculatedStats.totalCost.toFixed(1)}</span></span>
                </div>
                
                {/* Cost per Kg display */}
                <div className="bg-slate-850 rounded-xl px-4 py-2 flex items-center justify-between border border-emerald-900/45 text-xs text-slate-300">
                  <span className="font-bold flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Unit Cost:</span>
                  <span className="font-mono text-[13px] font-black text-emerald-400">{currencySymbol} {calculatedStats.costPerKg.toFixed(2)}/kg</span>
                </div>

                {/* Batch Uniform Scale buttons */}
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleScaleFormula(100)}
                    className="p-1 px-2.5 bg-slate-800 text-[9.5px] uppercase font-mono font-black text-slate-300 rounded-lg hover:bg-slate-755 border border-slate-700 hover:text-white pointer-events-auto transition-all"
                  >
                    Scale to 100Kg Mix
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScaleFormula(1000)}
                    className="p-1 px-2.5 bg-slate-800 text-[9.5px] uppercase font-mono font-black text-slate-300 rounded-lg hover:bg-slate-755 border border-slate-700 hover:text-white pointer-events-auto transition-all"
                  >
                    Scale to 1000Kg Mix
                  </button>
                </div>
              </div>
            </div>

            {/* ERROR AND DEFICIENCIES ALERTS BLOCK */}
            {deficiencies.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block font-sans">
                  🚨 Biological Deficiencies detected in active recipe:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {deficiencies.map((def, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex gap-3 text-xs leading-relaxed animate-slide-up ${
                        def.severity === "red"
                          ? "bg-red-50 border-red-200 text-red-950 border-l-4 border-l-red-500"
                          : "bg-amber-50 border-amber-200 text-amber-950 border-l-4 border-l-amber-500"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-1 shrink-0" />
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider block">
                          Deficiency in {def.label} ({def.field})
                        </span>
                        <p className="mt-0.5 font-semibold text-[10.5px]">
                          {def.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIVE INGREDIENTS TABLE IN RECIPE */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-slate-500" />
                  <span className="text-xs uppercase font-black text-slate-850 font-sans">
                    Formulation Breakdown & Weight Allocations
                  </span>
                </div>
                <span className="text-[10px] text-slate-450 font-medium">
                  Modify quantities or compound cost per kg live in columns below.
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-205">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[8.5px] border-b border-slate-200">
                      <th className="p-3">Ingredient</th>
                      <th className="p-3 text-center">Batch proportion</th>
                      <th className="p-3 text-right">Quantity (Kg)</th>
                      <th className="p-3 text-right">Cost Per Kg</th>
                      <th className="p-3 text-right font-bold">Subtotal Cost</th>
                      <th className="p-3 text-center">CP %</th>
                      <th className="p-3 text-center">ME (kcal)</th>
                      <th className="p-3 text-center">Calcium %</th>
                      <th className="p-3 text-center">Phos %</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-sans font-semibold text-slate-700">
                    {ingredientsList.map((item, idx) => {
                      const proportion = calculatedStats.totalWeight > 0 ? (item.quantityKg / calculatedStats.totalWeight) * 100 : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-850 truncate max-w-[150px]">{item.name}</td>
                          <td className="p-3 text-center">
                            <span className="font-mono text-[10px] bg-indigo-50/80 p-1.5 rounded text-indigo-950">
                              {proportion.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              className="w-18 border rounded p-1 font-mono text-center font-bold text-indigo-950 bg-slate-50/50"
                              value={item.quantityKg}
                              onChange={(e) => handleEditIngredientField(idx, "quantityKg", Number(e.target.value))}
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.1"
                              className="w-18 border rounded p-1 font-mono text-center text-slate-705 bg-slate-50/50"
                              value={item.costPerKg}
                              onChange={(e) => handleEditIngredientField(idx, "costPerKg", Number(e.target.value))}
                            />
                          </td>
                          <td className="p-3 text-right font-mono font-black text-emerald-850">
                            {currencySymbol} {(item.quantityKg * item.costPerKg).toFixed(1)}
                          </td>
                          <td className="p-3 text-center font-mono">{item.crudeProteinPct.toFixed(1)}%</td>
                          <td className="p-3 text-center font-mono">{item.metabolizableEnergyKcal.toFixed(0)}</td>
                          <td className="p-3 text-center font-mono">{item.calciumPct.toFixed(2)}%</td>
                          <td className="p-3 text-center font-mono">{item.phosphorusPct.toFixed(2)}%</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(idx)}
                              className="text-slate-400 hover:text-red-700 p-1.5 rounded-lg"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {ingredientsList.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center p-8 bg-slate-50/50 italic text-slate-400">
                          No feed ingredient loaded. Build recipe by selecting items from local library below!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* INPUTS DOCK FOR LIBRARY AND CUSTOM ADDITIONS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-3 border-t">
              
              {/* Add from Regional Zambian Library */}
              <div className="md:col-span-7 bg-slate-5 inner-panel p-4.5 rounded-2xl border border-slate-201 text-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-black text-slate-800 uppercase text-[9.5px] tracking-wider block">
                    ⚡ Local Feedstock Ingredient Library
                  </span>
                  <span className="text-[8px] font-mono text-amber-800 bg-amber-50 px-1.5 rounded">ZAMBIAN LIBRARY</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                  
                  <div className="sm:col-span-6 flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 pb-0.5">Choose Input feedstock</label>
                    <select
                      value={selectedLibIngredientIdx}
                      onChange={(e) => setSelectedLibIngredientIdx(Number(e.target.value))}
                      className="border p-2 bg-white rounded-lg font-bold text-slate-750 font-sans truncate w-full"
                    >
                      {ingredientsLib.map((item, index) => (
                        <option key={index} value={index}>
                          {item.name} (CP: {item.crudeProteinPct}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 pb-0.5">Quantity (Kg)</label>
                    <input
                      type="number"
                      value={libWeightInput}
                      onChange={(e) => setLibWeightInput(Math.max(1, Number(e.target.value)))}
                      className="border p-2 bg-white rounded-lg font-mono font-bold text-slate-750"
                    />
                  </div>

                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 pb-0.5">Price (ZK/Kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={libPriceInput}
                      onChange={(e) => setLibPriceInput(Math.max(0.1, Number(e.target.value)))}
                      className="border p-2 bg-white rounded-lg font-mono text-slate-750 font-semibold"
                    />
                  </div>

                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border text-[10px] text-slate-450 leading-relaxed italic">
                  {ingredientsLib[selectedLibIngredientIdx]?.description}
                </div>

                {/* Interactive Ingredient Base Prices Controller (Requirement 3) */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-center text-[9.5px] uppercase tracking-wide">
                    <span className="font-extrabold text-slate-900">⚖️ Configure Ingredient Base Prices ({currencySymbol}/Kg)</span>
                    <span className="text-[8px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 rounded uppercase">Default Reference Library</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {ingredientsLib.map((item, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border flex flex-col justify-between">
                        <span className="font-bold text-slate-650 truncate text-[9px] w-full" title={item.name}>{item.name}</span>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono font-bold">{currencySymbol}</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={item.defaultCostPerKg}
                            onChange={(e) => handleUpdateBasePrice(idx, Math.max(0.1, Number(e.target.value)))}
                            className="w-full text-xs font-bold font-mono px-1.5 py-0.5 border rounded bg-slate-50 focus:bg-white text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddLibraryIngredient}
                  className="w-full text-center py-2 bg-amber-600 hover:bg-amber-500 font-black text-white text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-3xs"
                >
                  + Add Library feedstock To Mixture
                </button>
              </div>

              {/* Add Custom Feedstock */}
              <div className="md:col-span-5 bg-slate-5 p-4.5 rounded-2xl border border-slate-201 text-xs flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b mb-3">
                    <span className="font-black text-slate-800 uppercase text-[9.5px] tracking-wider block">
                      🧪 Add Proprietary Custom feedstock
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(!showCustomForm)}
                      className="text-[9.5px] font-bold text-indigo-700 bg-indigo-50 px-2 rounded hover:underline"
                    >
                      {showCustomForm ? "Hide" : "Show Form"}
                    </button>
                  </div>

                  {showCustomForm ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="col-span-2 flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase text-slate-400">Ingredient Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Broken Grain Milling Dust"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="border p-1.5 bg-white rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase text-slate-400">CP %</label>
                        <input
                          type="number"
                          value={customCP}
                          onChange={(e) => setCustomCP(Number(e.target.value))}
                          className="border p-1 bg-white rounded font-mono text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase text-slate-400">ME (kcal/kg)</label>
                        <input
                          type="number"
                          value={customME}
                          onChange={(e) => setCustomME(Number(e.target.value))}
                          className="border p-1 bg-white rounded font-mono text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase text-slate-400">Calcium %</label>
                        <input
                          type="number"
                          step="0.01"
                          value={customCa}
                          onChange={(e) => setCustomCa(Number(e.target.value))}
                          className="border p-1 bg-white rounded font-mono text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase text-slate-400">Phosphorus %</label>
                        <input
                          type="number"
                          step="0.01"
                          value={customP}
                          onChange={(e) => setCustomP(Number(e.target.value))}
                          className="border p-1 bg-white rounded font-mono text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase text-slate-400">Price per Kg</label>
                        <input
                          type="number"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(Number(e.target.value))}
                          className="border p-1 bg-white rounded font-mono text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase text-slate-400">Initial Weight</label>
                        <input
                          type="number"
                          value={customWeight}
                          onChange={(e) => setCustomWeight(Number(e.target.value))}
                          className="border p-1 bg-white rounded font-mono text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCustomIngredient}
                        disabled={!customName.trim()}
                        className="col-span-2 text-center py-2 bg-slate-900 hover:bg-slate-800 font-extrabold text-white text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer mt-2 disabled:opacity-50"
                      >
                        + Insert Custom Ingredient
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-100/50 rounded-xl border text-center text-slate-400 italic leading-relaxed text-[10.5px]">
                      Add custom unlisted inputs like brewery waste, groundnut husks, or local byproducts. Click "Show Form" to input parameters.
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* EXPORT TO PRINT ROOM CONTROLS */}
            <div className="bg-indigo-50/20 border border-indigo-150 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-indigo-650 shrink-0" />
                <div className="text-xs">
                  <span className="font-extrabold text-indigo-950 block">Printable Feed Room Mixing Guide</span>
                  <p className="text-slate-500 font-medium leading-relaxed font-sans mt-0.5">
                    Generate formatted compliance work-cards to attach to storage bins and mix silos with instructions.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                <div className="flex items-center justify-between sm:justify-start gap-1.5 text-xs bg-white border rounded-xl p-1.5 px-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scale Batch:</span>
                  <select
                    value={printScaleBatch}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      setPrintScaleBatch(num);
                      if (num > 0) {
                        handleScaleFormula(num);
                      }
                    }}
                    className="text-xs font-black text-slate-800 bg-transparent py-0.5 border-0 focus:ring-0 font-mono outline-hidden cursor-pointer"
                  >
                    <option value="0">Unscaled ({calculatedStats.totalWeight.toFixed(0)} kg)</option>
                    <option value="50">50 kg Bag</option>
                    <option value="100">100 kg Mix</option>
                    <option value="250">250 kg Batch</option>
                    <option value="500">500 kg Cycle</option>
                    <option value="1000">1000 kg Silo</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handlePrintMixingGuide}
                  disabled={ingredientsList.length === 0}
                  className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white text-[10.5px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Export Printable Guide
                </button>
              </div>
            </div>

            {/* SAVE AND VERSION CONTROLS PANEL */}
            <div className="p-4 bg-indigo-50/55 rounded-2xl border border-indigo-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <span className="font-extrabold text-indigo-950 block">Save Work / Manage Recipe Versions</span>
                <p className="text-slate-500 font-medium leading-normal max-w-lg">
                  Assign a unique house name and preserve specific version trees. Saving will list options in your local Farm House database instantly.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveFormula(true)}
                  className="px-4.5 py-2.5 bg-indigo-650 hover:bg-indigo-650/90 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" /> Save As New
                </button>
                {activeFormulaId && (
                  <button
                    type="button"
                    onClick={() => handleSaveFormula(false)}
                    className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Save New Version (Update v{currentVersion})
                  </button>
                )}
              </div>
            </div>

            {/* ALLOCATE & FEED ACTIVE BATCHES DIRECT LINK */}
            <div className="p-5.5 rounded-3xl border border-amber-300 bg-amber-50/20 shadow-3xs space-y-4">
              <div className="flex items-center gap-2 border-b border-amber-200 pb-2.5">
                <Layers className="w-4.5 h-4.5 text-amber-850" />
                <h4 className="text-xs font-black uppercase text-amber-950">
                  ⚡ DIRECT WORKSPACE ALLOCATION AND FEED FLOCK
                </h4>
              </div>
              <p className="text-[11.5px] text-slate-655 leading-relaxed font-medium">
                Distribute your custom formulated compounds straight to physical flock coordinate silos. Doing so logs a real-time feeding event inside the target batch ledger and registers compound costs automatically.
              </p>

              {feedingSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-950 font-bold animate-fade-in leading-relaxed">
                  {feedingSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end text-xs">
                
                <div className="sm:col-span-5 flex flex-col gap-1">
                  <span className="font-extrabold text-slate-500 text-[8.5px] uppercase tracking-wider">
                    TARGET POULTRY COHORT BATCH
                  </span>
                  <select
                    value={feedingBatchId}
                    onChange={(e) => setFeedingBatchId(e.target.value)}
                    className="border p-2.5 bg-white rounded-xl font-bold text-slate-800 font-sans"
                  >
                    <option value="">-- Select Active Cohort --</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchName} ({b.birdType} - {b.currentCount} birds)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 flex flex-col gap-1">
                  <span className="font-extrabold text-slate-500 text-[8.5px] uppercase tracking-wider">
                    ALLOCATED FEEDWEIGHT (Kg)
                  </span>
                  <input
                    type="number"
                    value={feedingQuantityKg}
                    onChange={(e) => setFeedingQuantityKg(Math.max(1, Number(e.target.value)))}
                    className="border p-2 bg-white rounded-xl font-mono font-bold text-slate-800 h-9.5 text-center"
                  />
                </div>

                <div className="sm:col-span-4 flex flex-col gap-1">
                  <span className="font-extrabold text-slate-500 text-[8.5px] uppercase tracking-wider">
                    AUTHORIZING OFFICER
                  </span>
                  <input
                    type="text"
                    value={feedingOfficer}
                    onChange={(e) => setFeedingOfficer(e.target.value)}
                    className="border p-2 bg-white rounded-xl font-bold text-indigo-950 h-9.5"
                  />
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAllocateFeedBatch}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer active:scale-95"
                >
                  Confirm Compound Allocation & Feed Flock
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
