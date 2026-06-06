import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { PoultryBatch } from "../types";
import { 
  DollarSign, Scale, TrendingUp, Sliders, FileText, Download, 
  Trash, Plus, Check, Info, AlertCircle, RefreshCw, BarChart, FileCheck 
} from "lucide-react";

interface PoultryFinancialDashboardProps {
  batches: PoultryBatch[];
  onUpdatePoultryBatch?: (batch: PoultryBatch) => void;
  currencySymbol: string;
}

export default function PoultryFinancialDashboard({
  batches,
  onUpdatePoultryBatch,
  currencySymbol
}: PoultryFinancialDashboardProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"p_and_l" | "comparison" | "estimator">("p_and_l");

  // Overhead editing states
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [labourHours, setLabourHours] = useState(0);
  const [labourRate, setLabourRate] = useState(45); // default ZMW per hour
  const [utilityCost, setUtilityCost] = useState(0);
  const [shedDepreciation, setShedDepreciation] = useState(0);

  // Flock Estimator states
  const [estBatchId, setEstBatchId] = useState<string>(batches[0]?.id || "");
  const [estPriceBasis, setEstPriceBasis] = useState<"PER_BIRD" | "PER_KG">("PER_BIRD");
  const [marketPricePerBird, setMarketPricePerBird] = useState(85);
  const [marketPricePerKg, setMarketPricePerKg] = useState(55);
  const [overrideWeight, setOverrideWeight] = useState<number | "">("");

  // Find selected assets
  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const estBatch = batches.find(b => b.id === estBatchId);

  // General Helper to compute P&L metrics for any poultry batch
  const computeBatchMetrics = (b: PoultryBatch) => {
    // 1. REVENUES
    const birdsSoldRev = (b.salesLogs || []).reduce((s, x) => s + (x.amount || 0), 0);
    const eggsSoldRev = (b.eggSales || []).reduce((s, x) => s + (x.totalRevenue || 0), 0);
    const totalRevenue = birdsSoldRev + eggsSoldRev;

    // 2. DIRECT COSTS
    const chicksCount = b.quantity || 0;
    const chickCost = chicksCount * (b.unitAcquisitionCost ?? 12);
    const setupCost = b.brooderSetupCost ?? 0;
    const transportCost = b.transportCost ?? 0;
    const feedCost = (b.feedLogs || []).reduce((s, x) => s + (x.cost || 0), 0);
    
    const medCostVal = (b.medications || []).reduce((s, x) => s + (x.cost || 0), 0);
    const treatmentCostVal = (b.healthEvents || []).reduce((s, x) => s + (x.treatmentCost ?? 0), 0);
    const medCost = medCostVal + treatmentCostVal;

    // 3. OVERHEAD COSTS
    const lHours = b.labourHours ?? 0;
    const lRate = b.labourRatePerHour ?? 0;
    const labourCost = lHours * lRate;
    const utils = b.utilityCost ?? 0;
    const depreciation = b.shedDepreciation ?? 0;
    const totalOverheads = labourCost + utils + depreciation;

    const totalCosts = chickCost + setupCost + transportCost + feedCost + medCost + totalOverheads;

    // 4. NET P&L & Margins
    const netProfit = totalRevenue - totalCosts;
    const marginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : (totalRevenue === 0 && totalCosts > 0 ? -100 : 0);

    // 5. WEIGHTS & VOLUMES & EGGS
    // Latest sampled weight
    let latestWeightKg = 1.8; // default fallback
    if (b.weightSamples && b.weightSamples.length > 0) {
      const sorted = [...b.weightSamples].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
      latestWeightKg = sorted[0].averageWeightG / 1000;
    } else if (b.birdType?.includes("Broilers")) {
      latestWeightKg = 2.0;
    }

    const liveweightSoldKg = (b.salesLogs || []).reduce((s, x) => s + (x.quantity * (x.averageWeightKg || latestWeightKg)), 0);
    const liveweightRemainingKg = b.currentCount * latestWeightKg;
    const totalLiveweightGrownKg = liveweightSoldKg + liveweightRemainingKg;

    const totalEggsCollected = (b.eggCollections || []).reduce((s, x) => s + x.totalCollected, 0);
    const totalDozensCollected = totalEggsCollected / 12;

    // Unit calculations
    const costPerBirdPlaced = totalCosts / (chicksCount || 1);
    const costPerKgLiveweight = totalLiveweightGrownKg > 0 ? totalCosts / totalLiveweightGrownKg : 0;
    const costPerDozenEggs = totalDozensCollected > 0 ? totalCosts / totalDozensCollected : 0;

    // Feed Conversion Ratio (FCR = Total Feed In / Total Liveweight Gained)
    const feedInKg = (b.feedLogs || []).reduce((s, x) => s + x.quantityKg, 0);
    // Rough estimation of biological FCR
    const fcr = totalLiveweightGrownKg > 0 ? feedInKg / totalLiveweightGrownKg : 0;

    const mortalityRate = chicksCount > 0 ? ((chicksCount - b.currentCount) / chicksCount) * 100 : 0;

    const revenuePerBird = totalRevenue / (chicksCount || 1);
    const profitPerBird = netProfit / (chicksCount || 1);

    return {
      birdsSoldRev,
      eggsSoldRev,
      totalRevenue,
      chickCost,
      setupCost,
      transportCost,
      feedCost,
      medCost,
      labourCost,
      utils,
      depreciation,
      totalOverheads,
      totalCosts,
      netProfit,
      marginPct,
      latestWeightKg,
      totalLiveweightGrownKg,
      totalEggsCollected,
      totalDozensCollected,
      costPerBirdPlaced,
      costPerKgLiveweight,
      costPerDozenEggs,
      fcr,
      mortalityRate,
      revenuePerBird,
      profitPerBird,
      chicksCount
    };
  };

  // Open editor with current batch values
  const handleOpenOverheadEditor = (b: PoultryBatch) => {
    setEditingBatchId(b.id);
    setLabourHours(b.labourHours ?? 0);
    setLabourRate(b.labourRatePerHour ?? 45);
    setUtilityCost(b.utilityCost ?? 0);
    setShedDepreciation(b.shedDepreciation ?? 0);
  };

  // Post overhead allocations to global state batch
  const handleSaveOverheadAllocations = () => {
    if (!editingBatchId || !onUpdatePoultryBatch) return;
    const batch = batches.find(b => b.id === editingBatchId);
    if (!batch) return;

    onUpdatePoultryBatch({
      ...batch,
      labourHours,
      labourRatePerHour: labourRate,
      utilityCost,
      shedDepreciation
    });

    setEditingBatchId(null);
  };

  // CSV Exporter for Batch Performance summary
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Batch ID,Cohort Name,Bird Type,Placed Count,Alive Count,Mortality Rate %,Total Feed (Kg),FCR,Total Revenue (ZK),Total Cost (ZK),Net Profit (ZK),Profit Margin %,Cost per Bird,Cost per Kg\n";
    
    batches.forEach(b => {
      const metrics = computeBatchMetrics(b);
      const feedInKg = (b.feedLogs || []).reduce((s, x) => s + x.quantityKg, 0);
      csvContent += `"${b.batchId}","${b.batchName}","${b.birdType}",${b.quantity},${b.currentCount},${metrics.mortalityRate.toFixed(1)},${feedInKg.toFixed(1)},${metrics.fcr.toFixed(2)},${metrics.totalRevenue.toFixed(2)},${metrics.totalCosts.toFixed(2)},${metrics.netProfit.toFixed(2)},${metrics.marginPct.toFixed(1)},${metrics.costPerBirdPlaced.toFixed(2)},${metrics.costPerKgLiveweight.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FarmFlow_Poultry_Financial_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Exporter for detailed comparisons
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    // Emerald Green theme branding
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, 297, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(26);
    doc.text("FarmFlow", 15, 18);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text("Sustainable Husbandry Ledger & Business Intelligence Reports", 15, 25);

    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text("POULTRY BATCHES PROFITABILITY & ANALYSIS REPORT", 140, 16);
    doc.setFontSize(8.5);
    doc.setFont("Helvetica", "normal");
    doc.text("Zambia Ministry of Agriculture GAAP & IFRS Biological Asset Standards", 140, 22);
    doc.text(`Reference Date: ${new Date().toISOString().split("T")[0]}`, 140, 26);
    doc.text(`Total Batches Evaluated: ${batches.length}`, 140, 30);

    // Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(10, 48, 277, 8, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("Batch ID", 12, 53);
    doc.text("Cohort Name", 32, 53);
    doc.text("Bird Breed", 68, 53);
    doc.text("Placed/Alive", 100, 53);
    doc.text("Mortality", 120, 53);
    doc.text("FCR", 135, 53);
    doc.text("Total Revenues (ZK)", 150, 53);
    doc.text("Cumulative Costs (ZK)", 185, 53);
    doc.text("Net Profit / Loss (ZK)", 220, 53);
    doc.text("Profit Margin %", 255, 53);

    // Rows
    let y = 61;
    doc.setFont("Helvetica", "normal");
    batches.forEach(b => {
      if (y > 185) {
        doc.addPage();
        // Emerald header simple band
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, 297, 10, "F");
        y = 18;
      }

      const metrics = computeBatchMetrics(b);
      const isProfit = metrics.netProfit >= 0;

      doc.setFont("Helvetica", "bold");
      doc.text(b.batchId, 12, y);
      doc.setFont("Helvetica", "normal");
      doc.text(b.batchName.substring(0, 18), 32, y);
      doc.text(b.breed, 68, y);
      doc.text(`${b.quantity} / ${b.currentCount}`, 100, y);
      doc.text(`${metrics.mortalityRate.toFixed(1)}%`, 120, y);
      doc.text(b.birdType?.includes("Broilers") ? metrics.fcr.toFixed(2) : "N/A", 135, y);
      doc.text(`${currencySymbol} ${metrics.totalRevenue.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})}`, 150, y);
      doc.text(`${currencySymbol} ${metrics.totalCosts.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})}`, 185, y);
      
      if (isProfit) {
        doc.setTextColor(15, 118, 110); // emerald-700
      } else {
        doc.setTextColor(190, 24, 74); // rose-700
      }
      doc.text(`${isProfit ? "+" : ""}${currencySymbol} ${metrics.netProfit.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})}`, 220, y);
      doc.text(`${metrics.marginPct.toFixed(1)}%`, 255, y);
      
      doc.setTextColor(30, 41, 59); // reset

      // separator tiny line
      doc.setDrawColor(241, 245, 249);
      doc.line(10, y + 2, 287, y + 2);
      y += 8;
    });

    // Summary footer boxes
    y += 4;
    const overallRevenue = batches.reduce((sum, b) => sum + computeBatchMetrics(b).totalRevenue, 0);
    const overallCost = batches.reduce((sum, b) => sum + computeBatchMetrics(b).totalCosts, 0);
    const overallProfit = overallRevenue - overallCost;
    
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(10, y, 277, 20, "F");
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.rect(10, y, 277, 20, "S");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`PORTFOLIO TOTAL REVENUE:`, 15, y + 8);
    doc.text(`${currencySymbol} ${overallRevenue.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})}`, 15, y + 14);

    doc.text(`PORTFOLIO TOTAL COST:`, 105, y + 8);
    doc.text(`${currencySymbol} ${overallCost.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})}`, 105, y + 14);

    doc.text(`CUMULATIVE PORTFOLIO NET PROFIT:`, 195, y + 8);
    doc.setTextColor(overallProfit >= 0 ? 15 : 190, overallProfit >= 0 ? 118 : 24, overallProfit >= 0 ? 110 : 74);
    doc.text(`${currencySymbol} ${overallProfit.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})}`, 195, y + 14);

    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.text("Official Document of FarmFlow Agri-ERP Hub. Under Agricultural Credit Act Zambia guidelines.", 10, 195);

    doc.save(`FarmFlow_Poultry_Performance_Summary_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (batches.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 bg-slate-50 border border-dashed rounded-2xl p-6">
        <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h5 className="font-extrabold uppercase text-xs tracking-wider text-slate-700">No Poultry Cohorts Active</h5>
        <p className="text-xs max-w-sm mx-auto mt-1 font-semibold leading-relaxed">
          Please add and activate your first poultry flock batch in the directory to begin tracking feed consumption, vaccinations, live scales, and financial P&L.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6 animate-fade-in text-slate-800">
      
      {/* Financial subtab control bar */}
      <div className="flex border-b border-slate-200 pb-3 justify-between items-center flex-wrap gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("p_and_l")}
            className={`px-4 py-2 font-black uppercase text-[10.5px] rounded-lg tracking-wider transition-all cursor-pointer ${activeTab === "p_and_l" ? "bg-white text-emerald-900 shadow-3xs font-black" : "text-slate-500 hover:text-slate-800"}`}
          >
            📋 Batch P&L Statement
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comparison")}
            className={`px-4 py-2 font-black uppercase text-[10.5px] rounded-lg tracking-wider transition-all cursor-pointer ${activeTab === "comparison" ? "bg-white text-emerald-900 shadow-3xs font-black" : "text-slate-500 hover:text-slate-800"}`}
          >
            ⚖️ Cross-Batch Comparison
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("estimator")}
            className={`px-4 py-2 font-black uppercase text-[10.5px] rounded-lg tracking-wider transition-all cursor-pointer ${activeTab === "estimator" ? "bg-white text-emerald-900 shadow-3xs font-black" : "text-slate-500 hover:text-slate-800"}`}
          >
            💡 Flock Value Estimator
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" /> Export PDF Report
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV Data
          </button>
        </div>
      </div>

      {/* OVERHEAD COMPLIANCE ALLOCATION DRAWER/POPUP IF SHOWN */}
      {editingBatchId && (
        <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-350 space-y-4 animate-slide-up">
          <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
            <div>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold tracking-wider px-2 py-0.5 rounded uppercase font-mono">FINANCIAL ALLOCATION COMPLIANCE</span>
              <h5 className="text-xs font-black uppercase text-emerald-950 mt-1">🏠 Overhead Cost Allocation: {batches.find(b => b.id === editingBatchId)?.batchName}</h5>
            </div>
            <button
              onClick={() => setEditingBatchId(null)}
              className="bg-slate-200 hover:bg-slate-350 px-2.5 py-1 text-slate-700 font-bold text-[10px] rounded-lg"
            >
              Cancel ×
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9.5px] uppercase font-bold text-slate-500">Estimated Labour Hours</label>
              <input
                type="number"
                min="0"
                value={labourHours}
                onChange={e => setLabourHours(Math.max(0, Number(e.target.value)))}
                className="p-2 border bg-white rounded-lg font-mono font-bold"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9.5px] uppercase font-bold text-slate-500">Hourly Rate ({currencySymbol}/hr)</label>
              <input
                type="number"
                min="0"
                value={labourRate}
                onChange={e => setLabourRate(Math.max(0, Number(e.target.value)))}
                className="p-2 border bg-white rounded-lg font-mono font-bold"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9.5px] uppercase font-bold text-slate-500">Utilities / Energy Allocation (ZK)</label>
              <input
                type="number"
                min="0"
                value={utilityCost}
                onChange={e => setUtilityCost(Math.max(0, Number(e.target.value)))}
                className="p-2 border bg-white rounded-lg font-mono font-bold text-emerald-850"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9.5px] uppercase font-bold text-slate-500">Shed Depreciation Allocation (ZK)</label>
              <input
                type="number"
                min="0"
                value={shedDepreciation}
                onChange={e => setShedDepreciation(Math.max(0, Number(e.target.value)))}
                className="p-2 border bg-white rounded-lg font-mono font-bold text-emerald-850"
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-emerald-200 pt-3">
            <div className="text-slate-600 font-bold">
              Total Estimated Allocated Overhead: <span className="font-mono text-emerald-800 font-extrabold">{currencySymbol} {((labourHours * labourRate) + utilityCost + shedDepreciation).toFixed(2)}</span>
            </div>
            <button
              onClick={handleSaveOverheadAllocations}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-650 text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-xs cursor-pointer"
            >
              ✓ Save Overheads Allocation
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: BATCH P&L STATEMENT */}
      {activeTab === "p_and_l" && (
        <div className="space-y-5 animate-fade-in">
          {/* Select batch selector */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Cohort Selector</span>
              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="p-2 border bg-white text-xs rounded-xl font-bold font-sans text-slate-800 w-64 focus:outline-hidden"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.batchName} ({b.batchId}) - [{b.birdType}]</option>
                ))}
              </select>
            </div>
            {selectedBatch && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenOverheadEditor(selectedBatch)}
                  className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-850 font-black uppercase text-[10.5px] tracking-wider rounded-xl transition-all shadow-3xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" /> Adjust Batch Overheads
                </button>
              </div>
            )}
          </div>

          {selectedBatch ? (() => {
            const m = computeBatchMetrics(selectedBatch);
            const profit = m.netProfit;
            const isProfit = profit >= 0;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Visual Overview card */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <span className="text-[9px] font-black bg-slate-200/80 text-slate-600 uppercase px-2.5 py-0.5 rounded font-mono block w-fit">
                      {selectedBatch.birdType}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-2">{selectedBatch.batchName}</h3>
                    <p className="text-[11px] text-slate-500 font-semibold font-sans mt-0.5 font-mono">Cohort Code: {selectedBatch.batchId}</p>
                  </div>

                  {/* Net Profit indicator */}
                  <div className="p-4 rounded-xl border flex flex-col justify-center bg-white shadow-3xs relative overflow-hidden">
                    <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Net Accounting Earnings</span>
                    <span className={`text-xl font-black block mt-1.5 ${isProfit ? "text-emerald-800" : "text-rose-800"}`}>
                      {isProfit ? "+" : ""}{currencySymbol} {profit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 uppercase block w-fit rounded mt-1.5 ${isProfit ? "bg-emerald-100/70 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {m.marginPct.toFixed(1)}% profit margin
                    </span>
                    <div className="absolute right-3 bottom-3 opacity-15">
                      <TrendingUp className="w-12 h-12" />
                    </div>
                  </div>

                  {/* Efficiency Metrics */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Operational Indicators</span>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold font-sans">Mortality Rate:</span>
                      <span className="font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded leading-tight">
                        {m.mortalityRate.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold font-sans">Feed Conversion Ratio (FCR):</span>
                      <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded leading-tight">
                        {m.fcr > 0 ? m.fcr.toFixed(2) : "N/A (no sample)"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold font-sans">Average Sampled Weight:</span>
                      <span className="font-mono font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded leading-tight">
                        {m.latestWeightKg.toFixed(2)} kg / bird
                      </span>
                    </div>

                    {selectedBatch.birdType === "Layers (Eggs)" && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold font-sans font-mono text-[10px]">Total Eggs Harvested:</span>
                        <span className="font-mono font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded leading-tight">
                          {m.totalEggsCollected.toLocaleString()} ({m.totalDozensCollected.toFixed(0)} doz)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* detailed breakdown sheet */}
                <div className="bg-white rounded-2xl border border-slate-200 lg:col-span-2 p-5 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">Statement of Comprehensive Profit & Loss</h4>
                    <span className="text-[8.5px] uppercase bg-slate-100 px-2.5 py-1 text-slate-500 font-bold font-mono">GAAP Compliance Standard</span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs text-slate-800 font-medium">
                    {/* REVENUES */}
                    <div className="py-2">
                      <div className="flex justify-between text-[11px] uppercase text-emerald-800 font-black">
                        <span>Line 1: Operational Revenue</span>
                        <span className="font-mono">{currencySymbol} {m.totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                      <div className="pl-4 mt-1.5 space-y-1 text-slate-500 font-semibold">
                        <div className="flex justify-between">
                          <span>- Commerical Bird Sales (Live Ledger)</span>
                          <span className="font-mono text-slate-800">{currencySymbol} {m.birdsSoldRev.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>- Hen Eggs Sales Revenue</span>
                          <span className="font-mono text-slate-800">{currencySymbol} {m.eggsSoldRev.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                        </div>
                      </div>
                    </div>

                    {/* DIRECT PRODUCTION COSTS */}
                    <div className="py-2 pb-3">
                      <div className="flex justify-between text-[11px] uppercase text-rose-800 font-black">
                        <span>Line 2: Direct Husbandry Costs</span>
                        <span className="font-mono">{currencySymbol} {(m.totalCosts - m.totalOverheads).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                      <div className="pl-4 mt-1.5 space-y-1.5 text-slate-500 font-semibold">
                        <div className="flex justify-between">
                          <span>- Day-Old Chicks (DOC) Acquisition ({m.chicksCount} birds × {currencySymbol}{selectedBatch.unitAcquisitionCost ?? 12})</span>
                          <span className="font-mono text-slate-800">{currencySymbol} {m.chickCost.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>- Transport & Landing Logistic Costs</span>
                          <span className="font-mono text-slate-800">{currencySymbol} {m.transportCost.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>- Brooder Equipment & Setup Materials</span>
                          <span className="font-mono text-slate-800">{currencySymbol} {m.setupCost.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>- Poultry Feed & Crumbles Costs</span>
                          <span className="font-mono text-slate-800">{currencySymbol} {m.feedCost.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>- Veterinary Medicines & Vaccination schedule fees</span>
                          <span className="font-mono text-slate-800">{currencySymbol} {m.medCost.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                        </div>
                      </div>
                    </div>

                    {/* OVERHEADS INcurred */}
                    <div className="py-2.5 pb-3">
                      <div className="flex justify-between text-[11px] uppercase text-amber-800 font-black">
                        <span>Line 3: Allocated Overheads & Labor</span>
                        <span className="font-mono">{currencySymbol} {m.totalOverheads.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                      <div className="pl-4 mt-1.5 space-y-1 text-slate-500 font-semibold">
                        <div className="flex justify-between">
                          <span>- Labor cost ({selectedBatch.labourHours ?? 0} hrs @ {currencySymbol}{selectedBatch.labourRatePerHour ?? 45}/hr)</span>
                          <span className="font-mono text-slate-800">{currencySymbol} {m.labourCost.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>- Energy, Water & Brooder Utilities</span>
                          <span className="font-mono text-slate-800">{currencySymbol} {m.utils.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>- Shed Machinery & Housing Depreciation</span>
                          <span className="font-mono text-slate-800">{currencySymbol} {m.depreciation.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                        </div>
                      </div>
                    </div>

                    {/* TOTAL BOTTOM LINE */}
                    <div className="py-3 bg-slate-50 px-3 rounded-xl border border-slate-100 flex flex-col gap-1.5 mt-2 transition-all">
                      <div className="flex justify-between font-black uppercase text-sm">
                        <span className="text-slate-700">Total Capital Outlay:</span>
                        <span className="font-mono text-slate-900">{currencySymbol} {m.totalCosts.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                      <div className="flex justify-between font-black uppercase text-sm border-t border-dashed border-slate-350 pt-1.5">
                        <span className={isProfit ? "text-emerald-800" : "text-rose-800"}>Net Earnings (P&L):</span>
                        <span className={`font-mono ${isProfit ? "text-emerald-800" : "text-rose-800"}`}>
                          {isProfit ? "+" : ""}{currencySymbol} {profit.toLocaleString(undefined, {minimumFractionDigits:2})}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Unit cost segment */}
                  <div className="bg-emerald-50/40 rounded-xl border border-emerald-200/60 p-4 mt-3">
                    <span className="text-[9.5px] font-black uppercase text-emerald-850 block tracking-widest font-mono mb-2">Prorated Cost Breakdown Indexes</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-emerald-950">
                      <div>
                        <span className="text-[8.5px] uppercase text-slate-400 block font-bold leading-none">Cost per Bird Placed</span>
                        <span className="font-mono text-sm font-black block mt-1">{currencySymbol} {m.costPerBirdPlaced.toFixed(2)}</span>
                        <span className="text-[7.5px] text-slate-400 font-sans block leading-none font-medium">Initial placements input</span>
                      </div>
                      <div>
                        <span className="text-[8.5px] uppercase text-slate-400 block font-bold leading-none">Cost per Kg Liveweight</span>
                        <span className="font-mono text-sm font-black block mt-1">{currencySymbol} {m.costPerKgLiveweight.toFixed(2)}</span>
                        <span className="text-[7.5px] text-slate-400 font-sans block leading-none font-medium">Overall live biomass produced</span>
                      </div>
                      <div>
                        <span className="text-[8.5px] uppercase text-slate-400 block font-bold leading-none">Cost per Dozen Eggs</span>
                        <span className="font-mono text-sm font-black block mt-1">
                          {selectedBatch.birdType === "Layers (Eggs)" && m.costPerDozenEggs > 0 
                            ? `${currencySymbol} ${m.costPerDozenEggs.toFixed(2)}` 
                            : "N/A (non-laying)"}
                        </span>
                        <span className="text-[7.5px] text-slate-400 font-sans block leading-none font-medium">For egg collections only</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : null}
        </div>
      )}

      {/* TAB 2: CROSS-BATCH COMPARISON TABLE */}
      {activeTab === "comparison" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-3xs">
            <div className="px-5 py-4 bg-slate-50 border-b">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Flocks Benchmark &amp; Cross-Batch Comparison Ledger</h4>
              <p className="text-[10.5px] text-slate-500 font-semibold font-sans mt-0.5">Compares FCR index, biological mortality rates, acquisition and labor outlay alongside profitability margins.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-black uppercase text-[8.5px] tracking-wider">
                    <th className="p-3">Batch Reference</th>
                    <th className="p-3">Cohort Breed</th>
                    <th className="p-3 text-center">Placed</th>
                    <th className="p-3 text-center">Alive</th>
                    <th className="p-3 text-center">Mortality %</th>
                    <th className="p-3 text-center text-blue-800 font-bold">FCR Index</th>
                    <th className="p-3 text-right">Cost / Bird</th>
                    <th className="p-3 text-right">Revenue / Bird</th>
                    <th className="p-3 text-right text-emerald-800 font-bold">Total Net Profit</th>
                    <th className="p-3 text-center">Margin %</th>
                    <th className="p-3 text-center">Overheads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {batches.map(b => {
                    const m = computeBatchMetrics(b);
                    const isProfit = m.netProfit >= 0;
                    const isBroiler = b.birdType?.includes("Broilers");

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block font-sans">{b.batchName}</span>
                          <span className="font-mono text-[9px] text-slate-500 font-extrabold">{b.batchId}</span>
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">{b.breed}</td>
                        <td className="p-3 text-center font-mono font-bold">{b.quantity}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-900">{b.currentCount}</td>
                        <td className="p-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9px] ${m.mortalityRate > 10 ? "bg-red-50 text-red-800 font-black" : "bg-slate-100 text-slate-700"}`}>
                            {m.mortalityRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {isBroiler && m.fcr > 0 ? (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 font-mono font-black text-[9.5px] rounded">
                              {m.fcr.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[9px]">Layers</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-500">{currencySymbol} {m.costPerBirdPlaced.toFixed(1)}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-500">{currencySymbol} {m.revenuePerBird.toFixed(1)}</td>
                        <td className="p-3 text-right">
                          <span className={`font-mono font-black ${isProfit ? "text-emerald-800" : "text-rose-800"}`}>
                            {isProfit ? "+" : ""}{currencySymbol} {m.netProfit.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wide ${isProfit ? "bg-emerald-50 text-emerald-800 font-black" : "bg-rose-50 text-rose-800 font-black"}`}>
                            {m.marginPct.toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenOverheadEditor(b)}
                            className="px-2 py-1 text-[9px] uppercase font-black tracking-wider bg-slate-150 hover:bg-slate-200 rounded text-slate-700 cursor-pointer transition-colors"
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FLOCK VALUE ESTIMATOR */}
      {activeTab === "estimator" && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <span className="text-[9.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-mono">BIOLOGICAL ASSET VALUATION</span>
              <h4 className="text-xs font-black uppercase text-slate-800 mt-2 font-sans">🐔 Real-Time Flock Market Capital & Estimator Widget</h4>
              <p className="text-[10.5px] text-slate-500 font-semibold font-sans mt-0.5">Calculates biological market capitalization values for balance sheets or inventory assessments based on live remaining head counts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Controls Column */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col gap-1.5 text-xs font-medium">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Choose Herd/Flock Cohort</label>
                  <select
                    value={estBatchId}
                    onChange={e => {
                      setEstBatchId(e.target.value);
                      const b = batches.find(x => x.id === e.target.value);
                      // Reset customized weight
                      setOverrideWeight("");
                    }}
                    className="p-2 border bg-white rounded-lg font-bold text-slate-800 w-full"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.batchName} ({b.batchId}) - [{b.currentCount} birds]</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-medium">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Valuation Strategy basis</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-150 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setEstPriceBasis("PER_BIRD")}
                      className={`py-1 text-[10px] rounded font-black uppercase text-center cursor-pointer ${estPriceBasis === "PER_BIRD" ? "bg-white text-emerald-900 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      Flat Per Bird
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstPriceBasis("PER_KG")}
                      className={`py-1 text-[10px] rounded font-black uppercase text-center cursor-pointer ${estPriceBasis === "PER_KG" ? "bg-white text-emerald-900 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      Weight Per Kg
                    </button>
                  </div>
                </div>

                {estPriceBasis === "PER_BIRD" ? (
                  <div className="flex flex-col gap-1.5 text-xs font-medium animate-fade-in">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Assumed Market Price / Bird ({currencySymbol})</label>
                    <input
                      type="number"
                      value={marketPricePerBird}
                      onChange={e => setMarketPricePerBird(Math.max(1, Number(e.target.value)))}
                      className="p-2 border bg-white rounded-lg font-mono font-bold"
                    />
                  </div>
                ) : (
                  <div className="space-y-3.5 animate-fade-in">
                    <div className="flex flex-col gap-1.5 text-xs font-medium">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Market Price per Live Kg ({currencySymbol})</label>
                      <input
                        type="number"
                        value={marketPricePerKg}
                        onChange={e => setMarketPricePerKg(Math.max(1, Number(e.target.value)))}
                        className="p-2 border bg-white rounded-lg font-mono font-bold"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5 text-xs font-medium">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Est. Weight (kg / bird) [Override]</label>
                      <input
                        type="number"
                        step="0.05"
                        placeholder="Latest sample of cohort"
                        value={overrideWeight}
                        onChange={e => setOverrideWeight(e.target.value === "" ? "" : Number(e.target.value))}
                        className="p-2 border bg-white rounded-lg font-mono font-bold"
                      />
                      <span className="text-[9px] text-slate-400 font-semibold italic">Leave blank to inherit latest sampled weight</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Valuation Dashboard View column */}
              {estBatch ? (() => {
                const metrics = computeBatchMetrics(estBatch);
                
                // Determine appropriate calculation weight
                const calcWeight = estPriceBasis === "PER_BIRD" 
                  ? 1 
                  : (overrideWeight !== "" ? (overrideWeight as number) : metrics.latestWeightKg);

                const activeBirds = estBatch.currentCount || 0;
                const price = estPriceBasis === "PER_BIRD" ? marketPricePerBird : marketPricePerKg;
                
                // Dynamic valuation logic
                const flockEstValuation = estPriceBasis === "PER_BIRD" 
                  ? activeBirds * price 
                  : activeBirds * calcWeight * price;

                return (
                  <div className="lg:col-span-2 space-y-4">
                    {/* Valuation Panel */}
                    <div className="p-6 bg-emerald-850 text-white rounded-2xl relative overflow-hidden space-y-4 shadow-sm">
                      <div className="absolute right-4 top-4 bg-emerald-700/60 p-2.5 rounded-xl border border-emerald-500">
                        <Scale className="w-8 h-8 text-white animate-pulse" />
                      </div>
                      
                      <div>
                        <span className="text-[9px] font-mono tracking-widest uppercase bg-emerald-600 px-3 py-1 text-white rounded font-bold">
                          Biological Asset Capital Valuation
                        </span>
                        <h5 className="text-[11px] font-mono uppercase font-black text-emerald-100 mt-2">COHORT: {estBatch.batchName} ({estBatch.batchId})</h5>
                      </div>

                      <div className="pt-2">
                        <span className="text-[10px] text-emerald-200 block uppercase font-bold tracking-wider leading-none">Net Market Valuation</span>
                        <span className="font-mono text-3xl font-black block mt-1.5 text-white">
                          {currencySymbol} {flockEstValuation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-emerald-700 text-emerald-100 text-[10.5px]">
                        <div>
                          <span className="text-[8.5px] text-emerald-300 block uppercase font-bold leading-none font-sans">Remaining Birds</span>
                          <strong className="text-xs font-mono font-black mt-1 block">{activeBirds} heads</strong>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-emerald-300 block uppercase font-bold leading-none font-sans">Assumed Unit Basis</span>
                          <strong className="text-xs font-mono font-black mt-1 block">
                            {estPriceBasis === "PER_BIRD" 
                              ? `${currencySymbol}${price} / bird` 
                              : `${calcWeight.toFixed(2)} kg × ${currencySymbol}${price}/kg`}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-emerald-300 block uppercase font-bold leading-none font-sans">Est. Live Biomass</span>
                          <strong className="text-xs font-mono font-black mt-1 block">
                            {estPriceBasis === "PER_BIRD" 
                              ? "N/A" 
                              : `${(activeBirds * calcWeight).toFixed(1)} kg`}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Accounting Advice Segment */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex gap-3 text-xs">
                      <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="space-y-1 font-semibold leading-relaxed">
                        <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wide">Biological Inventory Ledger Policy</p>
                        <p className="text-slate-500 text-[10.5px] leading-relaxed">
                          Under Zambian IAS 41 standard for Agriculture, biological assets (poultry flocks) are measured on initial recognition and at the end of each reporting period at their fair value less costs to sell. Ensure this valuation is exported and registered under account code <strong className="text-slate-700 underline font-mono">1430 Biological Assets - Poultry Flocks</strong> during quarterly balance sheet adjustments.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })() : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
