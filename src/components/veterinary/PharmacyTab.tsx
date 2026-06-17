import React, { useState } from "react";
import { 
  Plus, Search, Shield, Heart, FileText, Check, AlertTriangle, Printer, Sparkles, MapPin, 
  Clock, ShieldAlert, Award, ArrowUpRight, CheckSquare, RefreshCw, ShoppingCart, ShoppingBag, 
  Layers, Package, ChevronUp, AlertCircle
} from "lucide-react";
import { MedicationInventory } from "./types";

interface PharmacyTabProps {
  inventory: MedicationInventory[];
  onRestockItem: (itemId: string, qtyToAdd: number) => void;
  onProcureMarketplaceItem: (item: Omit<MedicationInventory, "id">) => void;
  currencySymbol: string;
}

export const SUPPLIER_CATALOG: Omit<MedicationInventory, "id">[] = [
  {
    name: "CenVet Pen-Strep Suspension",
    category: "Antibiotics",
    dosageForm: "Liquid Injectable, 250ml",
    batchNumber: "PNS-2026-F2",
    expiryDate: "2028-09-12",
    qtyAvailable: 50,
    unitCost: 310,
    reorderLevel: 8
  },
  {
    name: "BoviShield Gold BVD Vaccine",
    category: "Vaccines",
    dosageForm: "Vials, 10-Doses pack",
    batchNumber: "BVS-8809B",
    expiryDate: "2027-02-15",
    qtyAvailable: 20,
    unitCost: 780,
    reorderLevel: 5,
    coldChainRegimen: "2°C to 8°C (Constant)"
  },
  {
    name: "Amprolium 20% Soluble Powder",
    category: "Dewormers",
    dosageForm: "Powder packet (Coccidiostat)",
    batchNumber: "AMP-112X",
    expiryDate: "2028-04-10",
    qtyAvailable: 40,
    unitCost: 195,
    reorderLevel: 10
  },
  {
    name: "Syntocinon Oxytocin Injectable",
    category: "Hormones",
    dosageForm: "Vials, 50ml",
    batchNumber: "OXY-381Y",
    expiryDate: "2027-08-30",
    qtyAvailable: 15,
    unitCost: 320,
    reorderLevel: 3
  }
];

export default function PharmacyTab({
  inventory,
  onRestockItem,
  onProcureMarketplaceItem,
  currencySymbol
}: PharmacyTabProps) {
  
  const [activeSubView, setActiveSubView] = useState<"stocks" | "market">("stocks");
  const [searchQuery, setSearchQuery] = useState("");
  const [valuationMethod, setValuationMethod] = useState<"FIFO" | "WeightedAverage">("FIFO");

  // Sum Valuation
  const totalValuation = React.useMemo(() => {
    return inventory.reduce((acc, curr) => acc + (curr.qtyAvailable * curr.unitCost), 0);
  }, [inventory]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Selector Line \& Analytics Summary */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm font-sans">
        
        {/* Toggle selectors */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl shrink-0">
          <button 
            type="button"
            onClick={() => setActiveSubView("stocks")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition select-none cursor-pointer ${
              activeSubView === "stocks" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pharmacy Dispensary Stocks
          </button>
          <button 
            type="button"
            onClick={() => setActiveSubView("market")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition select-none cursor-pointer ${
              activeSubView === "market" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Certified Supply Marketplace
          </button>
        </div>

        {/* Valuation and strategy summaries */}
        <div className="flex flex-wrap items-center gap-6 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[9px]">Accounting Method:</span>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button 
                onClick={() => setValuationMethod("FIFO")}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition ${
                  valuationMethod === "FIFO" ? "bg-emerald-500 text-white" : "text-slate-500"
                }`}
              >
                FIFO (First-In, First-Out)
              </button>
              <button 
                onClick={() => setValuationMethod("WeightedAverage")}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition ${
                  valuationMethod === "WeightedAverage" ? "bg-emerald-500 text-white" : "text-slate-400"
                }`}
              >
                Avg. Cost
              </button>
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6 space-y-0.5 font-mono">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Pharmacy Asset valuation</span>
            <span className="text-sm font-bold text-slate-800">
              {currencySymbol}{totalValuation.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* FILTER SEARCH DISPENSARY */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-7 pointer-events-none" />
        <input 
          type="text" 
          placeholder={activeSubView === "stocks" ? "Search pharmacy medicine cabinets by batch, drug..." : "Search certified supplier catalogs..."}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* STOCKS DISPENSARY VIEW */}
      {activeSubView === "stocks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="dispensary-cabinets-grid">
          {inventory.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.category.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => {
            const isLowStock = item.qtyAvailable <= item.reorderLevel;
            const isNearExpiry = new Date(item.expiryDate).getTime() < new Date("2026-12-31").getTime();

            return (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition flex flex-col justify-between">
                <div className="space-y-3">
                  
                  {/* Category Banner \& Expiry Danger Warnings */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      {item.category}
                    </span>
                    {isNearExpiry && (
                      <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 rounded font-mono font-bold text-[8px] text-rose-600 uppercase flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5 text-rose-500" /> Expiring warning
                      </span>
                    )}
                  </div>

                  {/* Header Title Information */}
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs leading-snug">{item.name}</h5>
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Batch: {item.batchNumber}</span>
                  </div>

                  {/* Physical/Therapeutic specifications */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-mono space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">CABINET QTY:</span>
                      <span className={`font-bold ${isLowStock ? "text-rose-600" : "text-slate-800"}`}>{item.qtyAvailable} Units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">EXPIRY DATE:</span>
                      <span className="font-bold text-slate-600">{item.expiryDate}</span>
                    </div>
                    {item.coldChainRegimen && (
                      <div className="flex justify-between text-indigo-600">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Cold Chain Status:</span>
                        <span className="font-extrabold flex items-center gap-1.5">
                          ❄ {item.coldChainRegimen}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={() => onRestockItem(item.id, 10)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded-xl cursor-pointer transition flex items-center justify-center gap-1 border border-slate-200"
                  >
                    Quick Add +10 Cabinet Units
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUPPLY MARKETPLACE VIEW */}
      {activeSubView === "market" && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-950 rounded-2xl border border-emerald-900 text-white flex justify-between items-center">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">Certified B2B Marketplace Hub</span>
              <h5 className="text-xs font-bold font-sans">Official Certified Distributors Manufacturer's Procurement</h5>
              <p className="text-[10px] text-emerald-300">Procure diagnostic equipment, cold-chain vaccines and therapeutics directly. Auto-integrates on delivery.</p>
            </div>
            <ShoppingBag className="w-10 h-10 text-emerald-400 shrink-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUPPLIER_CATALOG.filter(sc => sc.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 flex justify-between gap-6 hover:border-slate-300 transition shadow-sm">
                
                <div className="space-y-3 flex-1">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-mono font-bold uppercase tracking-wider">{item.category}</span>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">{item.name}</h5>
                    <span className="text-[10px] text-slate-400 block pt-0.5">Specifications: {item.dosageForm}</span>
                  </div>

                  <div className="flex gap-4 font-mono text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span>PRE-DETERMINED UNIT COST:</span>
                      <span className="font-bold text-slate-800 block">{currencySymbol}{item.unitCost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span>BATCH CODE:</span>
                      <span className="font-bold text-slate-700 block">{item.batchNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-end shrink-0">
                  <button 
                    onClick={() => onProcureMarketplaceItem(item)}
                    className="px-4 py-2 bg-emerald-55 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-extrabold rounded-xl flex items-center gap-1 shadow-md cursor-pointer select-none transition active:scale-95"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Procure Stocks
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
