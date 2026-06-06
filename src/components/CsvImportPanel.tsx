import React, { useState, useRef } from "react";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  AlertCircle, 
  Trash, 
  ArrowRight, 
  Calendar, 
  Tag, 
  DollarSign, 
  CheckCircle2,
  Info
} from "lucide-react";
import { LivestockRecord, CropCycle, ExpenseTransaction, Supplier, ExpenseRow } from "../types";

interface CsvImportPanelProps {
  suppliers: Supplier[];
  onAddLivestockRecord: (record: LivestockRecord) => void;
  onAddCrop: (crop: CropCycle) => void;
  onAddTransaction: (tx: ExpenseTransaction) => void;
  currencySymbol: string;
  isReadonly: boolean;
  preselectedModule?: "expenses" | "crops" | "livestock" | null;
}

type ImportType = "livestock" | "crops" | "expenses";

export default function CsvImportPanel({
  suppliers,
  onAddLivestockRecord,
  onAddCrop,
  onAddTransaction,
  currencySymbol,
  isReadonly,
  preselectedModule
}: CsvImportPanelProps) {
  const [activeModule, setActiveModule] = useState<ImportType>(
    preselectedModule || "livestock"
  );

  // File states
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputText, setInputText] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  
  // Parsed records state
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Templates Definitions
  const templates = {
    livestock: {
      headers: "tagId,type,species,breed,gender,acquisitionType,source,dateAcquired,purchasePrice,currentValue",
      demo: `LH-501,Cattle,Beef,Angus,Female,Bought,Nelspruit Breeders,2026-05-15,12000,12500
LH-502,Goats,Meat,Boer,Male,Birthed,Farm Inception,2026-05-20,0,3200
LH-503,Pigs,Landrace,Durop,Female,Bought,Lusaka Pig Unit,2026-06-01,2200,2400`,
      description: "Bulk registry of biological livestock assets with tag numbers, breed details, and evaluative capital values."
    },
    crops: {
      headers: "cropType,plantingDate,expectedHarvestDate,fieldBlock,areaHectares,expectedYieldKg,status",
      demo: `Yellow Maize,2026-06-01,2026-10-15,Block B-4,4.5,9000,Active
Sugar Beans,2026-05-10,2026-08-30,Block A-1,2.2,4100,Planning
Irish Potatoes,2026-04-15,2026-07-20,Block C-3,1.8,6000,Active`,
      description: "Agronomic crop cycles linking planting blocks, area calculations, and yield evaluations."
    },
    expenses: {
      headers: "date,supplierName,category,description,quantity,unitPrice,taxSystem,coaCode",
      demo: `2026-06-01,Lusaka Feed Mills,Poultry Feed & Crumbles Cost,Broiler Feed Starter 50kg bags,10,380,VAT,5210
2026-06-02,Zambia National Breeders,Veterinary, Meds & Fingerling Purchase,Newcastle ND vaccine vials,2,150,None,5300
2026-06-03,Chisamba Breeding Coop,Livestock Feed Formulation,Soya meal concentrate protein,15,420,Sales Tax,5220`,
      description: "Double-entry cash book payment entries with corresponding accounts, quantities, unit prices, and supplier alignment."
    }
  };

  const handleCopyTemplate = () => {
    const templateText = `${templates[activeModule].headers}\n${templates[activeModule].demo}`;
    navigator.clipboard.writeText(templateText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readAndParseFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readAndParseFile(e.target.files[0]);
    }
  };

  const readAndParseFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setErrorText("Invalid file type. Please upload a structured .csv format file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvText(text);
    };
    reader.onerror = () => {
      setErrorText("Error reading file.");
    };
    reader.readAsText(file);
  };

  // Safe and precise CSV Parser
  const parseCsvText = (text: string) => {
    setErrorText(null);
    setSuccessCount(null);
    if (!text.trim()) {
      setPreviewRows([]);
      return;
    }

    try {
      const lines: string[] = [];
      let currentLine = "";
      let insideQuotes = false;

      // Handle quotes/commas split properly
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === "\n" && !insideQuotes) {
          lines.push(currentLine);
          currentLine = "";
        } else if (char === "\r" && !insideQuotes) {
          // skip carriage returns
        } else {
          currentLine += char;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      if (lines.length === 0) {
        setPreviewRows([]);
        return;
      }

      // First row headers
      const headers = parseCsvRow(lines[0]);
      const dataRows = lines.slice(1).filter(line => line.trim() !== "");

      const parsedItems = dataRows.map((line, lineIdx) => {
        const columns = parseCsvRow(line);
        const rowData: Record<string, string> = {};

        headers.forEach((header, colIdx) => {
          const cleanHeader = header.trim();
          rowData[cleanHeader] = columns[colIdx] ? columns[colIdx].trim() : "";
        });

        // Add index and validation block
        const validation = validateRow(rowData);
        return {
          id: `preview-${lineIdx}-${Date.now()}`,
          data: rowData,
          validation: validation,
          isSelected: validation.isValid // select valid rows by default
        };
      });

      setPreviewRows(parsedItems);
    } catch (e: any) {
      setErrorText(`Failed parsing CSV: ${e.message}`);
    }
  };

  const parseCsvRow = (rowText: string): string[] => {
    const result: string[] = [];
    let cell = "";
    let insideQuotes = false;

    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        result.push(cell);
        cell = "";
      } else {
        cell += char;
      }
    }
    result.push(cell);
    return result;
  };

  // Perform validation on inputs
  const validateRow = (rowData: Record<string, string>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (activeModule === "livestock") {
      if (!rowData.tagId) errors.push("Tag ID (tagId) is required.");
      if (!rowData.type) errors.push("Animal group type (Cattle/Goats etc) is required.");
      if (!rowData.species) errors.push("Species name is required.");
      if (!rowData.breed) errors.push("Breed type is required.");
      if (rowData.gender && !["Male", "Female"].includes(rowData.gender)) {
        errors.push("Gender must be 'Male' or 'Female'.");
      }
      if (rowData.acquisitionType && !["Bought", "Birthed", "Gifted"].includes(rowData.acquisitionType)) {
        errors.push("Acquisition type must be 'Bought', 'Birthed', or 'Gifted'.");
      }
    } else if (activeModule === "crops") {
      if (!rowData.cropType) errors.push("Crop cropType is required.");
      if (!rowData.fieldBlock) errors.push("Field block is required.");
      if (!rowData.plantingDate) errors.push("Planting Date is required YYYY-MM-DD.");
      if (rowData.areaHectares && isNaN(Number(rowData.areaHectares))) {
        errors.push("Area in Hectares must be a numeric score.");
      }
    } else if (activeModule === "expenses") {
      if (!rowData.date) errors.push("Transaction date is required (date).");
      if (!rowData.supplierName) errors.push("Supplier Name is required.");
      if (!rowData.category) errors.push("Expense Category is required.");
      if (rowData.unitPrice && isNaN(Number(rowData.unitPrice))) {
        errors.push("Unit Price must be a number.");
      }
      if (rowData.quantity && isNaN(Number(rowData.quantity))) {
        errors.push("Quantity must be numeric.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleLoadDemo = () => {
    const fullText = `${templates[activeModule].headers}\n${templates[activeModule].demo}`;
    setInputText(fullText);
    parseCsvText(fullText);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    parseCsvText(text);
  };

  const handleToggleRowSelect = (id: string) => {
    setPreviewRows(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, isSelected: !row.isSelected };
      }
      return row;
    }));
  };

  const handleUpdateRecordField = (rowId: string, colName: string, value: string) => {
    setPreviewRows(prev => prev.map(row => {
      if (row.id === rowId) {
        const updatedData = { ...row.data, [colName]: value };
        const validation = validateRow(updatedData);
        return {
          ...row,
          data: updatedData,
          validation: validation,
          isSelected: validation.isValid ? row.isSelected : false
        };
      }
      return row;
    }));
  };

  const handleClearPreview = () => {
    setPreviewRows([]);
    setInputText("");
    setErrorText(null);
    setSuccessCount(null);
  };

  const handleExecuteImport = () => {
    if (isReadonly) {
      alert("System is currently in read-only permission layout.");
      return;
    }

    const selectedRows = previewRows.filter(r => r.isSelected && r.validation.isValid);
    if (selectedRows.length === 0) {
      alert("No validated selected rows available to import.");
      return;
    }

    try {
      selectedRows.forEach(row => {
        const item = row.data;
        if (activeModule === "livestock") {
          const rec: LivestockRecord = {
            id: `LIV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            tagId: item.tagId,
            type: item.type,
            species: item.species,
            breed: item.breed,
            gender: (item.gender || "Female") as "Male" | "Female",
            acquisitionType: (item.acquisitionType || "Bought") as any,
            source: item.source || "Imported Spreadsheet",
            dateAcquired: item.dateAcquired || new Date().toISOString().split('T')[0],
            purchasePrice: Math.abs(Number(item.purchasePrice || 0)),
            currentValue: Math.abs(Number(item.currentValue || item.purchasePrice || 0)),
            healthEvents: [],
            feedingLogs: [],
            status: "Active",
            farmId: "farm-1"
          };
          onAddLivestockRecord(rec);
        } else if (activeModule === "crops") {
          const expectedHarvest = item.expectedHarvestDate || new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const rec: CropCycle = {
            id: `CRP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            cropType: item.cropType,
            plantingDate: item.plantingDate || new Date().toISOString().split('T')[0],
            expectedHarvestDate: expectedHarvest,
            fieldBlock: item.fieldBlock,
            areaHectares: Math.abs(Number(item.areaHectares || 1.0)),
            expectedYieldKg: Math.abs(Number(item.expectedYieldKg || 1000)),
            status: (item.status || "Active") as any,
            milestones: [
              { id: "m-1", name: "Seed Treatment & Bed Sowing", startDate: item.plantingDate || new Date().toISOString().split('T')[0], endDate: expectedHarvest, isCompleted: true },
              { id: "m-2", name: "Emergence Thinning Check", startDate: item.plantingDate || new Date().toISOString().split('T')[0], endDate: expectedHarvest, isCompleted: false },
              { id: "m-3", name: "Inter-row Crop Cultivation", startDate: item.plantingDate || new Date().toISOString().split('T')[0], endDate: expectedHarvest, isCompleted: false },
              { id: "m-4", name: "Silking / Ear Tassel Sizing", startDate: item.plantingDate || new Date().toISOString().split('T')[0], endDate: expectedHarvest, isCompleted: false },
              { id: "m-5", name: "Primary Grain Collection", startDate: item.plantingDate || new Date().toISOString().split('T')[0], endDate: expectedHarvest, isCompleted: false }
            ],
            expensesLinked: 0,
            revenueLinked: 0,
            farmId: "farm-1"
          };
          onAddCrop(rec);
        } else if (activeModule === "expenses") {
          const qty = Number(item.quantity || 1);
          const price = Number(item.unitPrice || 0);
          const sub = price * qty;
          const taxPct = item.taxSystem === "VAT" ? 0.15 : item.taxSystem === "Sales Tax" ? 0.05 : 0;
          const taxVal = sub * taxPct;
          
          // Try to lookup registered supplier by name, or match a default supplier
          let foundSupplier = suppliers.find(s => s.name.toLowerCase() === item.supplierName.toLowerCase());
          if (!foundSupplier && suppliers.length > 0) {
            foundSupplier = suppliers[0];
          }
          
          const row: ExpenseRow = {
            category: item.category,
            description: item.description || `Batch import ${item.category}`,
            quantity: qty,
            unitPrice: price,
            amount: sub,
            coaCode: item.coaCode || "5200"
          };

          const tx: ExpenseTransaction = {
            id: `EXP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            supplierId: foundSupplier ? foundSupplier.id : "SUP-CSV",
            supplierName: foundSupplier ? foundSupplier.name : item.supplierName,
            date: item.date || new Date().toISOString().split('T')[0],
            taxSystem: (item.taxSystem || "None") as any,
            taxAmount: taxVal,
            subtotal: sub,
            total: sub + taxVal,
            rows: [row],
            farmId: "farm-1"
          };
          onAddTransaction(tx);
        }
      });

      setSuccessCount(selectedRows.length);
      setPreviewRows([]);
      setInputText("");
    } catch (e: any) {
      setErrorText(`Import aborted during writes: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex-wrap gap-4">
        <div>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
            System Synchronization Office
          </span>
          <h1 className="text-xl font-bold font-sans text-slate-800 mt-2">Mabala Bulk CSV Import Office</h1>
          <p className="text-xs text-slate-500 max-w-xl font-medium mt-1 leading-normal">
            Effortlessly bootstrap or scale your database registries by seeding multiple agricultural crop cycles, biological animal profiles, or financial Ledger rows via Excel-comported CSV templates.
          </p>
        </div>
        <FileSpreadsheet className="w-12 h-12 text-slate-300 pointer-events-none" />
      </div>

      {/* Module tab selecions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: "livestock", label: "🐔 Animal Assets Hub", desc: "Batch register cattle ear tags, breeds, evaluating weight baseline variables." },
          { id: "crops", label: "🌾 Crop Blocks Registry", desc: "Seed fields blocks, planned crop areas, expected harvest indicators." },
          { id: "expenses", label: "💸 Accounting Ledger", desc: "Disburse accounts, transaction rows, values & taxation codes." }
        ].map(mod => {
          const isSelected = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => {
                setActiveModule(mod.id as ImportType);
                handleClearPreview();
              }}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                isSelected 
                  ? "bg-emerald-990 border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm" 
                  : "bg-white hover:bg-slate-50/50 border-slate-200"
              }`}
            >
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{mod.label}</h3>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">{mod.desc}</p>
              {isSelected && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 shadow-md animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* Template block area */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">CSV Data Format Template Info</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTemplate}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold border flex items-center gap-1.5 text-slate-700 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>{copied ? "Copied!" : "Copy Template Headers"}</span>
            </button>
            <button
              onClick={handleLoadDemo}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Load Demonstrative Playground Data</span>
            </button>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 leading-normal">
          {templates[activeModule].description} Ensure the very first line of your file contains precisely matching spelling values:
        </p>

        <div className="flex flex-wrap gap-1.5">
          {templates[activeModule].headers.split(",").map(heading => (
            <span key={heading} className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-[10.5px] font-bold border border-slate-300">
              {heading}
            </span>
          ))}
        </div>
      </div>

      {/* Drag Drop / Paste Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all min-h-[220px] relative ${
            dragActive 
              ? "border-emerald-500 bg-emerald-50/20" 
              : "border-slate-300 bg-white hover:border-slate-400"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-xs font-bold text-slate-700 mb-1">Drag and drop your comports CSV file here</p>
          <p className="text-[10px] text-slate-400 font-medium mb-3">or choose standard select file on machine</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
          >
            Locate System File
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col gap-3">
          <label className="text-[10.5px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <span>Direct CSV Paste Buffer / Text Processor</span>
          </label>
          <textarea
            value={inputText}
            onChange={handleTextareaChange}
            rows={7}
            placeholder={`Paste raw string logs here, e.g:\n${templates[activeModule].headers}\nRow data values goes here...`}
            className="w-full text-xs font-mono p-3 border rounded-xl bg-slate-50/50 focus:bg-white resize-none shadow-inner"
          />
        </div>
      </div>

      {/* Status Messages */}
      {errorText && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-center gap-3 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span>{errorText}</span>
        </div>
      )}

      {successCount !== null && (
        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 text-xs font-semibold animate-fade-in shadow-xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <div>
            <h4 className="text-emerald-900 font-black">Transaction Batch Succeeded!</h4>
            <p className="text-emerald-700 font-normal mt-0.5">Successfully registered {successCount} record entries to the farm registries modules and logged transient system audit logs.</p>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {previewRows.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs animate-slide-up">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">CSV Processing Ledger Preview</h3>
              <p className="text-xs text-slate-400 font-medium leading-none mt-1">Review validation and modify records inline before sealing system writes.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearPreview}
                className="px-3.5 py-1.5 border hover:bg-slate-50 rounded-lg text-xs font-extrabold text-slate-600 cursor-pointer"
              >
                Clear Preview
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={previewRows.filter(r => r.isSelected).length === 0 || isReadonly}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
              >
                <span>Import {previewRows.filter(r => r.isSelected).length} Checked Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-white text-slate-800">
              <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b">
                <tr>
                  <th className="p-4 w-10">Select</th>
                  <th className="p-4">Attributes Alignment / Values</th>
                  <th className="p-4">Analysis / Status Checks</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold">
                {previewRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={row.isSelected}
                        onChange={() => handleToggleRowSelect(row.id)}
                        disabled={!row.validation.isValid}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4 disabled:opacity-40"
                      />
                    </td>
                    <td className="p-4 space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {Object.keys(row.data).map(key => (
                          <div key={key} className="flex flex-col bg-slate-50 p-1.5 rounded border border-slate-150">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{key}</span>
                            <input
                              type="text"
                              value={row.data[key]}
                              onChange={(e) => handleUpdateRecordField(row.id, key, e.target.value)}
                              className="w-full bg-transparent font-medium text-slate-800 text-xs font-sans p-0.5 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      {row.validation.isValid ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-55 px-2.5 py-1 rounded inline-flex self-center">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Strictly Validated</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 p-2 bg-rose-50 rounded-lg border border-rose-100 max-w-sm">
                          <span className="text-[10px] text-rose-800 font-extrabold uppercase tracking-wide">Validation Failures:</span>
                          {row.validation.errors.map((err: string) => (
                            <li key={err} className="text-[10px] text-rose-600 font-bold leading-normal">{err}</li>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
