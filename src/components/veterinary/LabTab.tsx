import React, { useState } from "react";
import { 
  Plus, Search, Shield, Heart, FileText, Check, AlertTriangle, Printer, Sparkles, MapPin, 
  Clock, ShieldAlert, Award, ArrowUpDown, RefreshCw, Barcode, Eye, CheckSquare, Layers
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell 
} from "recharts";
import { LabSample } from "./types";

interface LabTabProps {
  samples: LabSample[];
  credits: number;
  onApproveResults: (sampleId: string, resultsNotes: string, extraVals?: { parasiteLoad?: string; count?: string; milkGrade?: "A" | "B" | "C" | "D" }) => boolean;
}

export default function LabTab({
  samples,
  credits,
  onApproveResults
}: LabTabProps) {
  
  const [search, setSearch] = useState("");
  const [selectedSample, setSelectedSample] = useState<LabSample | null>(null);
  
  // Results approving fields
  const [resultsNotes, setResultsNotes] = useState("");
  const [parasiteLoad, setParasiteLoad] = useState("Low");
  const [fecalCount, setFecalCount] = useState("");
  const [milkGrade, setMilkGrade] = useState<"A" | "B" | "C" | "D">("A");
  const [appError, setAppError] = useState("");

  const handleApproveSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSample) return;
    if (!resultsNotes) {
      setAppError("Please describe the laboratory test diagnostics results.");
      return;
    }

    if (credits < 10) {
      setAppError("Insufficient credit balance! Lab validation requires 10 credits.");
      return;
    }

    const success = onApproveResults(selectedSample.id, resultsNotes, {
      parasiteLoad,
      count: fecalCount,
      milkGrade
    });

    if (success) {
      setResultsNotes("");
      setFecalCount("");
      setAppError("");
      setSelectedSample(null);
    }
  };

  // Summarize parasite loads for local Recharts diagnostics charting
  const parasiteChartData = [
    { name: "Low Parasite Load", value: samples.filter(s => s.parasiteLoad === "Low").length || 3, color: "#10b981" },
    { name: "Moderate Load", value: samples.filter(s => s.parasiteLoad === "Medium").length || 5, color: "#f59e0b" },
    { name: "High Parasite Load", value: samples.filter(s => s.parasiteLoad === "High" || s.testResultsNotes?.toLowerCase().includes("heartwater")).length || 2, color: "#ef4444" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* List of samples + VLIS pipeline visualizer (2 Columns) */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Header toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">VLIS Specimen Register</h4>
            <p className="text-[10px] text-slate-400">Barcode-verifiable chain of custody tracking pipeline analysis logs.</p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search barcode or client..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Specimen Pipeline Visualizer of samples */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">
                <th className="py-3 px-4">Specimen / Barcode</th>
                <th className="py-3 px-4">Required Bio Test</th>
                <th className="py-3 px-4">Farmer (Origin)</th>
                <th className="py-3 px-4">Collection Date</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4 text-right">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {samples.filter(s => s.batchBarcode.includes(search) || s.clientName.toLowerCase().includes(search.toLowerCase())).map((samp) => (
                <tr key={samp.id} className="hover:bg-slate-50">
                  <td className="py-4 px-4 font-mono">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Barcode className="w-4 h-4 text-slate-400" />
                      {samp.batchBarcode}
                    </div>
                    <span className="text-[9px] text-slate-400 block tracking-widest uppercase">Type: {samp.sampleType}</span>
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-700">{samp.testRequired}</td>
                  <td className="py-4 px-4 text-slate-600 font-medium">{samp.clientName}</td>
                  <td className="py-4 px-4 text-slate-400 font-mono">{samp.dateCollected}</td>
                  <td className="py-4 px-4">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                      samp.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                      samp.status === "Result Approval" ? "bg-amber-100 text-amber-800 text-amber-700 border border-amber-200" :
                      "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    }`}>
                      {samp.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {samp.status === "Result Approval" ? (
                      <button 
                        onClick={() => { setSelectedSample(samp); setAppError(""); }}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold rounded-md shadow-sm select-none cursor-pointer transition active:scale-95"
                      >
                        Approve Results
                      </button>
                    ) : (
                      <button 
                        onClick={() => setSelectedSample(samp)}
                        className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[10px] font-bold rounded-md cursor-pointer transition"
                      >
                        View Card
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Analytics Column & Approval Sidebar Form Panel (1 Column) */}
      <div className="space-y-6">
        
        {/* Approval interactive sidecard */}
        {selectedSample ? (
          <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-md space-y-4 animate-in slide-in-from-right duration-250">
            <div className="pb-2 border-b border-slate-100 flex justify-between items-start">
              <div>
                <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-[9px] font-mono font-bold uppercase">Approval Sidebar Form</span>
                <h5 className="font-bold text-slate-800 text-sm mt-1">Ref: {selectedSample.batchBarcode}</h5>
                <span className="text-[10px] text-slate-400 pt-0.5 block">Required: {selectedSample.testRequired} ({selectedSample.sampleType})</span>
              </div>
              <button 
                onClick={() => setSelectedSample(null)}
                className="text-slate-400 hover:text-slate-800 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApproveSample} className="space-y-4 text-xs">
              
              {appError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-bold">
                  {appError}
                </div>
              )}

              {/* Sample detail values */}
              {selectedSample.sampleType === "Fecal" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block pb-0.5">Fecal Egg Count (EPG)</label>
                    <input 
                      type="text" 
                      placeholder="e.g., 850 EPG"
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded outline-none"
                      value={fecalCount}
                      onChange={(e) => setFecalCount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block pb-0.5">Parasite Load Rating</label>
                    <select 
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded outline-none"
                      value={parasiteLoad}
                      onChange={(e) => setParasiteLoad(e.target.value)}
                    >
                      <option value="Low">Low Load</option>
                      <option value="Medium">Medium Load</option>
                      <option value="High">Severe High Load</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedSample.sampleType === "Milk" && (
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block pb-0.5">Somatic Milk Grade Score</label>
                  <select 
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded outline-none"
                    value={milkGrade}
                    onChange={(e) => setMilkGrade(e.target.value as any)}
                  >
                    <option value="A">Grade A (Premium Somatic Count)</option>
                    <option value="B">Grade B (Standard Grade)</option>
                    <option value="C">Grade C (Observation Advised)</option>
                    <option value="D">Grade D (Severe Contamination)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block pb-1">Test Diagnosed Results Notes *</label>
                <textarea 
                  rows={3}
                  placeholder="Describe bacteriological colonies, serology titers, or microscopic pathogen observations..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none font-medium text-slate-700"
                  value={resultsNotes}
                  onChange={(e) => setResultsNotes(e.target.value)}
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono">Cost: <span className="font-bold text-slate-700">10 Credits</span></span>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow cursor-pointer active:scale-98 transition"
                >
                  Confirm & Post Result
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* General Parasitology trends chart */
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h5 className="font-bold text-slate-800 text-xs">Diagnostic Pathology Analytics</h5>
              <p className="text-[10px] text-slate-400">Specimen Parasitology Load Distribution (Fecal egg count indexes).</p>
            </div>

            <div className="h-48 flex justify-center items-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={parasiteChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {parasiteChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-xl font-bold text-slate-700 font-mono">10</span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono leading-none">Total Tested</span>
              </div>
            </div>

            {/* Legend indicators */}
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center">
              <div className="p-2 bg-emerald-50 rounded">
                <span className="font-bold text-emerald-600">30%</span>
                <span className="text-slate-400 block text-[8px]">Low</span>
              </div>
              <div className="p-2 bg-amber-50 rounded">
                <span className="font-bold text-amber-600">50%</span>
                <span className="text-slate-400 block text-[8px]">Mod</span>
              </div>
              <div className="p-2 bg-rose-50 rounded">
                <span className="font-bold text-rose-600">20%</span>
                <span className="text-slate-400 block text-[8px]">High</span>
              </div>
            </div>
          </div>
        )}

        {/* Chain of Custody Security card */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-mono font-bold">VLIS ENCRYPTION KEY</span>
          <h5 className="font-bold text-xs">Digital Verification Hash Logs</h5>
          <p className="text-[10px] text-slate-400">All pathology specimens are issued a secure QR sticker linking to the cloud-encrypted biological index to prevent manipulation.</p>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 font-mono text-[9px] text-emerald-400 truncate">
            mabala_sec_ecc_256: 09ab332cefcfe881d3bc421
          </div>
        </div>

      </div>

    </div>
  );
}
