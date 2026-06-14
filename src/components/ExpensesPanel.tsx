import React, { useState } from "react";
import { ExpenseTransaction, Supplier, ExpenseRow } from "../types";
import { 
  Plus, 
  Trash, 
  Save, 
  Filter, 
  AlertTriangle, 
  Layers, 
  BookOpen, 
  Users, 
  Building2, 
  DollarSign, 
  ArrowRight,
  ClipboardList,
  Contact,
  FileSpreadsheet,
  Upload,
  CheckCircle,
  Copy,
  Info
} from "lucide-react";

interface ExpensesPanelProps {
  expenses: ExpenseTransaction[];
  suppliers: Supplier[];
  onAddTransaction: (tx: ExpenseTransaction) => void;
  onAddSupplier: (sup: Supplier) => void;
  isReadonly: boolean;
  currencySymbol: string;
  onGotoCsvImport?: (targetModule: "expenses" | "crops" | "livestock") => void;
}

const EXP_COA_MAP = [
  { category: "Aquafeed & Feed Purchases Expense", code: "5200" },
  { category: "Poultry Feed & Crumbles Cost", code: "5210" },
  { category: "Livestock Feed Formulation", code: "5220" },
  { category: "Veterinary, Meds & Fingerling Purchase", code: "5300" },
  { category: "Crop Seed & Seedling Acquisition", code: "5310" },
  { category: "Water Management & Liming Costs", code: "5400" },
  { category: "Aeration, Pumping & Electricity", code: "5410" },
  { category: "Direct Labour Allocation", code: "5500" },
  { category: "Pond, Cage & Infrastructure Maintenance", code: "5600" },
  { category: "Harvesting & Processing Costs", code: "5700" },
  { category: "Transport, Logistics & Cold Chain", code: "5800" },
  { category: "Pesticides, Herbicide & Fertilizer", code: "5910" },
  { category: "Tractor Fuel, Spares & Servicing", code: "5920" }
];

export default function ExpensesPanel({ 
  expenses, 
  suppliers, 
  onAddTransaction, 
  onAddSupplier, 
  isReadonly, 
  currencySymbol,
  onGotoCsvImport
}: ExpensesPanelProps) {
  const [activeTab, setActiveTab] = useState<"expenses" | "suppliers">("expenses");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Trans State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxSystem, setTaxSystem] = useState<"VAT" | "Sales Tax" | "None">("VAT");
  const [rows, setRows] = useState<ExpenseRow[]>([
    { category: "Aquafeed & Feed Purchases Expense", description: "", quantity: 1, unitPrice: 0, amount: 0, coaCode: "5200" }
  ]);

  // New Supplier State
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supTpin, setSupTpin] = useState("");
  const [supCategory, setSupCategory] = useState("Feed");
  const [supNotes, setSupNotes] = useState("");

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // CSV Bulk Upload states
  const [showCsvForm, setShowCsvForm] = useState(false);
  const [csvPayloadText, setCsvPayloadText] = useState("");
  const [csvDragActive, setCsvDragActive] = useState(false);
  const [csvPreviewList, setCsvPreviewList] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccessMessage, setCsvSuccessMessage] = useState<string | null>(null);
  const csvFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setCsvDragActive(true);
    } else if (e.type === "dragleave") {
      setCsvDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCsvDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readAndParseCsvFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readAndParseCsvFile(e.target.files[0]);
    }
  };

  const readAndParseCsvFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setCsvError("Invalid file type. Please upload a structured .csv format file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvPayloadText(text);
      handleParseCsv(text);
    };
    reader.onerror = () => {
      setCsvError("Error reading uploaded CSV file.");
    };
    reader.readAsText(file);
  };

  const handleParseCsv = (text: string) => {
    setCsvError(null);
    setCsvSuccessMessage(null);
    if (!text.trim()) {
      setCsvPreviewList([]);
      return;
    }

    try {
      const lines: string[] = [];
      let currentLine = "";
      let insideQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === "\n" && !insideQuotes) {
          lines.push(currentLine);
          currentLine = "";
        } else if (char === "\r" && !insideQuotes) {
          // Ignore
        } else {
          currentLine += char;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      if (lines.length === 0) {
        setCsvPreviewList([]);
        return;
      }

      const rawHeaders = lines[0].split(",");
      const headers = rawHeaders.map(h => h.trim().toLowerCase());
      const dataRows = lines.slice(1).filter(line => line.trim() !== "");

      const parsed = dataRows.map((line, idx) => {
        const columns = [];
        let cell = "";
        let insideQ = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            insideQ = !insideQ;
          } else if (char === "," && !insideQ) {
            columns.push(cell);
            cell = "";
          } else {
            cell += char;
          }
        }
        columns.push(cell);

        const record: Record<string, string> = {};
        headers.forEach((header, colIdx) => {
          record[header] = columns[colIdx] ? columns[colIdx].trim() : "";
        });

        // Resolve mappings with alternative spelling variants
        const dateVal = record.date || record.timestamp || record.day || new Date().toISOString().split('T')[0];
        const supplierNameVal = record.suppliername || record.supplier || record.vendor || "Bulk Supplier";
        const categoryVal = record.category || record.account || record.accountname || "Aquafeed & Feed Purchases Expense";
        const descriptionVal = record.description || record.desc || record.remarks || `Imported transaction line ${idx + 1}`;
        const quantityVal = record.quantity ? Number(record.quantity) : record.qty ? Number(record.qty) : 1;
        const unitPriceVal = record.unitprice ? Number(record.unitprice) : record.price ? Number(record.price) : record.rate ? Number(record.rate) : 0;
        const coaCodeVal = record.coacode || record.code || record.accountcode || "";

        // Resolve CoA category & code matching:
        let matchedCoa = EXP_COA_MAP.find(coa => coa.code === coaCodeVal);
        if (!matchedCoa) {
          matchedCoa = EXP_COA_MAP.find(coa => coa.category.toLowerCase().includes(categoryVal.toLowerCase()) || categoryVal.toLowerCase().includes(coa.category.toLowerCase()));
        }

        const finalCoaCode = matchedCoa ? matchedCoa.code : (coaCodeVal || "5200");
        const finalCategory = matchedCoa ? matchedCoa.category : (categoryVal || "Aquafeed & Feed Purchases Expense");

        // Schema validation
        const errors: string[] = [];
        if (isNaN(quantityVal) || quantityVal <= 0) {
          errors.push("Quantity must be a positive number greater than zero.");
        }
        if (isNaN(unitPriceVal) || unitPriceVal <= 0) {
          errors.push("Unit Price must be a positive number greater than zero.");
        }
        
        const isAccountCodeInMap = EXP_COA_MAP.some(item => item.code === finalCoaCode);
        if (!finalCoaCode || !isAccountCodeInMap) {
          errors.push(`Selected Chart of Accounts debit account code (DR ${finalCoaCode || "N/A"}) is invalid.`);
        }

        return {
          id: `csv-${idx}-${Date.now()}`,
          original: record,
          date: dateVal,
          supplierName: supplierNameVal,
          category: finalCategory,
          coaCode: finalCoaCode,
          description: descriptionVal,
          quantity: quantityVal,
          unitPrice: unitPriceVal,
          total: (isNaN(quantityVal) ? 0 : quantityVal) * (isNaN(unitPriceVal) ? 0 : unitPriceVal),
          errors,
          isValid: errors.length === 0,
          isSelected: errors.length === 0
        };
      });

      setCsvPreviewList(parsed);
    } catch (err: any) {
      setCsvError(`Failed to parse CSV lines: ${err.message}`);
    }
  };

  const handleLoadDemoCsv = () => {
    const demoCsv = `date,supplierName,category,description,quantity,unitPrice,coacode\n` +
      `2026-06-01,Copperbelt Seeds,Crop Seed & Seedling Acquisition,Imported Maize Seed Type-H,5,120,5310\n` +
      `2026-06-02,Lusaka Feed Mills,Aquafeed & Feed Purchases Expense,Tilapia Starter Crumble 20kg bags,10,340,5200\n` +
      `2026-06-03,Kitwe Vet Clinic,Veterinary, Meds & Fingerling Purchase,Vaccination drops 100ml,2,190,5300\n` +
      `2026-06-04,Zambia Power,Aeration, Pumping & Electricity,Substation high-load pump invoice,1,1250,5410`;
    setCsvPayloadText(demoCsv);
    handleParseCsv(demoCsv);
  };

  const handleBulkImportSave = () => {
    if (isReadonly) return;
    const targets = csvPreviewList.filter(item => item.isSelected && item.isValid);
    if (targets.length === 0) {
      alert("No valid checked records available to import.");
      return;
    }

    try {
      targets.forEach(item => {
        let checkSup = suppliers.find(s => s.name.toLowerCase() === item.supplierName.toLowerCase());
        if (!checkSup) {
          const newSup: Supplier = {
            id: "SUP-AUTO-" + Math.floor(Math.random() * 100005),
            name: item.supplierName,
            category: "General Purchases",
            contactPerson: "",
            phone: "",
            email: "",
            address: "",
            tpin: "",
            notes: "Onboarded automatically during historical CSV bulk ledger entry"
          };
          onAddSupplier(newSup);
          checkSup = newSup;
        }

        const taxPct = taxSystem === "VAT" ? 0.15 : taxSystem === "Sales Tax" ? 0.05 : 0;
        const subPaid = item.total;
        const taxVal = subPaid * taxPct;

        const tx: ExpenseTransaction = {
          id: "EXP-BULK-" + Math.floor(Math.random() * 100000),
          supplierId: checkSup.id,
          supplierName: checkSup.name,
          date: item.date,
          taxSystem: taxSystem,
          taxAmount: taxVal,
          subtotal: subPaid,
          total: subPaid + taxVal,
          rows: [
            {
              category: item.category,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: subPaid,
              coaCode: item.coaCode
            }
          ],
          farmId: "farm-1"
        };
        onAddTransaction(tx);
      });

      setCsvSuccessMessage(`Successfully bulk imported ${targets.length} historical ledger transactions into the active farm record!`);
      setCsvPreviewList([]);
      setCsvPayloadText("");
      setShowCsvForm(false);
      setTimeout(() => setCsvSuccessMessage(null), 5000);
    } catch (err: any) {
      setCsvError(`Failed to insert batch: ${err.message}`);
    }
  };

  const addRow = () => {
    setFormError(null);
    setRows([...rows, { category: "Aquafeed & Feed Purchases Expense", description: "", quantity: 1, unitPrice: 0, amount: 0, coaCode: "5200" }]);
  };

  const removeRow = (index: number) => {
    setFormError(null);
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof ExpenseRow, val: any) => {
    setFormError(null);
    const updated = [...rows];
    let rowObj = { ...updated[index] };
    
    if (field === "category") {
      rowObj.category = val;
      const found = EXP_COA_MAP.find(m => m.category === val);
      rowObj.coaCode = found ? found.code : "5200";
    } else if (field === "quantity" || field === "unitPrice") {
      rowObj[field] = Number(val);
      rowObj.amount = rowObj.quantity * rowObj.unitPrice;
    } else {
      (rowObj as any)[field] = val;
    }

    updated[index] = rowObj;
    setRows(updated);
  };

  const subtotal = rows.reduce((acc, r) => acc + (r.quantity * r.unitPrice), 0);
  const taxPct = taxSystem === "VAT" ? 0.15 : taxSystem === "Sales Tax" ? 0.05 : 0;
  const taxAmount = subtotal * taxPct;
  const total = subtotal + taxAmount;

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;
    const ns: Supplier = {
      id: "SUP-" + Date.now(),
      name: supName,
      contactPerson: supContact,
      phone: supPhone,
      email: supEmail,
      address: supAddress,
      tpin: supTpin,
      category: supCategory,
      notes: supNotes
    };
    onAddSupplier( ns);
    setSelectedSupplierId(ns.id);
    setSupName("");
    setSupContact("");
    setSupPhone("");
    setSupEmail("");
    setSupAddress("");
    setSupTpin("");
    setSupNotes("");
    setShowSupplierForm(false);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedSupplierId) {
      const err = "Please select a registered supplier.";
      setFormError(err);
      alert(err);
      return;
    }

    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup) {
      const err = "Selected supplier was not found.";
      setFormError(err);
      alert(err);
      return;
    }

    // Comprehensive Schema Validation for each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Amount validation ensures strictly positive value (quantity and unitPrice must be > 0)
      if (row.quantity <= 0) {
        const err = `Validation Error (Line ${i + 1}): Quantity must be a positive number greater than zero.`;
        setFormError(err);
        alert(err);
        return;
      }
      if (row.unitPrice <= 0) {
        const err = `Validation Error (Line ${i + 1}): Unit Price must be a positive number greater than zero.`;
        setFormError(err);
        alert(err);
        return;
      }

      // Selected Account Code Validation
      const isAccountCodeInMap = EXP_COA_MAP.some(item => item.code === row.coaCode);
      if (!row.coaCode || !isAccountCodeInMap) {
        const err = `Validation Error (Line ${i + 1}): Selected Chart of Accounts debit account code (DR ${row.coaCode || "N/A"}) is invalid. Please select a valid Category.`;
        setFormError(err);
        alert(err);
        return;
      }
    }

    const tx: ExpenseTransaction = {
      id: "EXP-" + (100 + expenses.length + 1),
      supplierId: sup.id,
      supplierName: sup.name,
      date,
      taxSystem,
      taxAmount,
      subtotal,
      total,
      rows: rows.map(r => ({ ...r, amount: r.quantity * r.unitPrice })),
      farmId: "farm-1"
    };

    onAddTransaction(tx);
    setShowAddForm(false);
    setFormError(null);
    // Reset Rows
    setRows([{ category: "Aquafeed & Feed Purchases Expense", description: "", quantity: 1, unitPrice: 0, amount: 0, coaCode: "5200" }]);
  };

  // Pagination helper
  const paginate = (items: any[]) => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  };

  return (
    <div className="space-y-6">
      {/* Tab select menu */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold border gap-1">
        <button 
          onClick={() => { setActiveTab("expenses"); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "expenses" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-705"}`}
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          <span>Expenses Ledger</span>
        </button>
        <button 
          onClick={() => { setActiveTab("suppliers"); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "suppliers" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-705"}`}
        >
          <Building2 className="w-3.5 h-3.5 text-slate-505" />
          <span>Suppliers Directory ({suppliers.length})</span>
        </button>
      </div>

      {/* Supplier Form Block Inline */}
      {showSupplierForm && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-slide-up" id="sup-form">
          <h3 className="text-xs font-black text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-1.5">
            <Contact className="w-4 h-4 text-emerald-600" />
            <span>Onboard New Supplier / Contractor</span>
          </h3>
          <form onSubmit={handleCreateSupplier} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Supplier Name *</label>
                <input type="text" value={supName} placeholder="e.g. Copperbelt Seeds Ltd" onChange={e => setSupName(e.target.value)} required className="w-full text-xs border rounded p-2 focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Contact Person</label>
                <input type="text" value={supContact} placeholder="e.g. Kelvin Mwape" onChange={e => setSupContact(e.target.value)} className="w-full text-xs border rounded p-2 focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Phone</label>
                <input type="text" value={supPhone} placeholder="e.g. +260977881122" onChange={e => setSupPhone(e.target.value)} className="w-full text-xs border rounded p-2" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Registered Tax TPIN</label>
                <input type="text" value={supTpin} onChange={e => setSupTpin(e.target.value)} className="w-full text-xs border rounded p-2 placeholder-slate-400 font-mono" placeholder="e.g. 1004312903" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Contractor Email</label>
                <input type="email" value={supEmail} placeholder="e.g. sales@copperbeltseeds.co.zm" onChange={e => setSupEmail(e.target.value)} className="w-full text-xs border rounded p-2" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Physical Address</label>
                <input type="text" value={supAddress} placeholder="e.g. Chibuluma Road, Kitwe, Zambia" onChange={e => setSupAddress(e.target.value)} className="w-full text-xs border rounded p-2" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Supply Category</label>
                <select value={supCategory} onChange={e => setSupCategory(e.target.value)} className="w-full text-xs border rounded p-2 bg-white font-semibold text-slate-700">
                  <option value="Feed">Biological Feed / Pouches</option>
                  <option value="Seeds">Crop Seeds & Inputs</option>
                  <option value="Veterinary">Veterinary Drugs & Hormones</option>
                  <option value="Infrastructure">Infrastructure Maintenance</option>
                  <option value="Logistics">Transport & Logistics</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500">Internal Remarks / Notes</label>
              <textarea value={supNotes} rows={2} onChange={e => setSupNotes(e.target.value)} placeholder="Enter brief notes about delivery rates or lead times..." className="w-full text-xs border rounded p-2 bg-slate-50 focus:bg-white" />
            </div>

            <div className="flex gap-2 justify-end text-xs font-semibold pt-2 border-t">
              <button type="button" onClick={() => setShowSupplierForm(false)} className="px-3.5 py-1.5 bg-slate-100 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-md">Conclude Supplier Onboarding</button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Bulk Upload Form Block */}
      {showCsvForm && !showSupplierForm && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-6 animate-slide-up" id="csv-bulk-form">
          <div className="flex justify-between items-center border-b pb-3.5">
            <div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
                Historical Ledger Seed Tool
              </span>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mt-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Bulk Import Historical Expenses & Transactions</span>
              </h3>
            </div>
            <button
              onClick={() => {
                setShowCsvForm(false);
                setCsvPreviewList([]);
                setCsvError(null);
              }}
              className="px-3 py-1.5 bg-slate-100 font-bold hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Chart of Accounts Alignment & Mappings Instructions</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal font-medium">
              Your CSV file columns will automatically map to corresponding ledger attributes. You can use standard spellings. 
              The system scans for columns matching <strong>date</strong>, <strong>supplierName</strong>, <strong>category</strong> (or <strong>account</strong>), <strong>description</strong>, <strong>quantity</strong>, <strong>unitPrice</strong>, and optionally <strong>coaCode</strong> (or <strong>accountCode</strong>).
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block w-full mt-1">Acceptable CoA Debit Code mappings:</span>
              {EXP_COA_MAP.map(item => (
                <span key={item.code} className="px-2 py-0.5 bg-white text-slate-800 rounded font-mono text-[9.5px] font-bold border border-slate-200 shadow-2xs">
                  {item.category} (DR {item.code})
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-200/60 justify-end">
              <button
                type="button"
                onClick={handleLoadDemoCsv}
                className="px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 duration-150 font-bold rounded-lg text-[10.5px] shadow-xs cursor-pointer"
              >
                Load Demonstrative Demo Template
              </button>
            </div>
          </div>

          {/* Interactive Drag Drop / Input Fields Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all min-h-[145px] relative ${
                csvDragActive 
                  ? "border-emerald-500 bg-emerald-50/10" 
                  : "border-slate-300 bg-slate-50/50 hover:border-slate-400"
              }`}
            >
              <input
                type="file"
                ref={csvFileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700">Drag & Drop your expense CSV here</p>
              <p className="text-[10px] text-slate-400 mb-2">or select file location on your machine</p>
              <button
                type="button"
                onClick={() => csvFileInputRef.current?.click()}
                className="px-3 py-1 text-slate-700 bg-white border rounded border-slate-300 hover:bg-slate-50 text-[10.5px] font-bold shadow-xs cursor-pointer"
              >
                Upload CSV File
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">
                Direct CSV Raw Text Paste Area
              </label>
              <textarea
                value={csvPayloadText}
                onChange={(e) => {
                  setCsvPayloadText(e.target.value);
                  handleParseCsv(e.target.value);
                }}
                rows={5}
                placeholder="date,supplierName,category,description,quantity,unitPrice,coacode&#10;2026-06-01,Supplier LLC,Aquafeed & Feed Purchases Expense,Feed Bags,5,150,5200"
                className="w-full text-xs font-mono p-2.5 border rounded-xl bg-slate-50/50 focus:bg-white resize-none shadow-inner"
              />
            </div>
          </div>

          {/* Errors and successes */}
          {csvError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{csvError}</span>
            </div>
          )}

          {csvSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{csvSuccessMessage}</span>
            </div>
          )}

          {/* Parsed CSV Transactions preview list */}
          {csvPreviewList.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">CSV Bulk Verification Grid</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Review, toggle selection or fix validation warnings below.</p>
                </div>
                <button
                  type="button"
                  onClick={handleBulkImportSave}
                  disabled={csvPreviewList.filter(x => x.isSelected && x.isValid).length === 0}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md font-sans"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Import {csvPreviewList.filter(x => x.isSelected && x.isValid).length} Executable Lines</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-72 border rounded-xl divide-y bg-white">
                <table className="w-full text-left text-xs bg-white">
                  <thead className="bg-slate-50 uppercase text-[9px] font-bold text-slate-500 tracking-wider sticky top-0 border-b">
                    <tr>
                      <th className="p-3 w-8">Import</th>
                      <th className="p-3">Details Alignment</th>
                      <th className="p-3">Attributes Calculation</th>
                      <th className="p-3">Analysis Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {csvPreviewList.map((item, idx) => (
                      <tr key={item.id} className={`hover:bg-slate-50/50 ${!item.isValid ? "bg-rose-50/20" : ""}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.isSelected}
                            disabled={!item.isValid}
                            onChange={() => {
                              const updated = [...csvPreviewList];
                              updated[idx].isSelected = !updated[idx].isSelected;
                              setCsvPreviewList(updated);
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-30"
                          />
                        </td>
                        <td className="p-3">
                          <div className="text-[11px] font-bold text-slate-900">{item.supplierName}</div>
                          <div className="text-[10.5px] text-slate-500 font-medium font-sans">{item.description}</div>
                          <div className="text-[9.5px] mt-0.5 text-slate-400 font-medium">{item.date}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-[10.5px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 inline-block md:block md:w-fit font-bold">
                            {item.category} (DR {item.coaCode})
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">
                            {item.quantity} units x {currencySymbol}{item.unitPrice.toFixed(2)} = {currencySymbol}{item.total.toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3">
                          {item.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9.5px] font-black tracking-wider uppercase border border-emerald-200/50 flex items-center gap-1 animate-pulse inline-flex">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow shrink-0" /> Perfect Record
                            </span>
                          ) : (
                            <div className="bg-rose-50 border border-rose-100 p-1.5 rounded-lg max-w-xs space-y-1">
                              <span className="text-[9px] uppercase font-extrabold text-rose-800 tracking-wider block">Line Failures</span>
                              {item.errors.map((err: string) => (
                                <li key={err} className="text-[9.5px] text-rose-700 font-bold list-none leading-tight">{err}</li>
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
      )}

      {/* Main Multi-Line Record Form */}
      {showAddForm && !showSupplierForm && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Post Double-Entry Multi-Line Farm Expense</span>
            </h3>
            <button onClick={() => setShowSupplierForm(true)} className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100">+ New Supplier</button>
          </div>

          <form onSubmit={handleSaveTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-extrabold text-slate-500">Vendor / Supplier *</label>
                <select 
                  value={selectedSupplierId} 
                  onChange={e => setSelectedSupplierId(e.target.value)} 
                  required 
                  className="w-full text-xs border bg-slate-50 rounded p-2 text-slate-800 font-semibold mt-1"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider mt-1">Transaction Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full text-xs border bg-slate-50 rounded p-2" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-extrabold text-slate-500">Tax Assessment Type</label>
                <select value={taxSystem} onChange={e => setTaxSystem(e.target.value as any)} className="w-full text-xs border bg-slate-50 rounded p-2 mt-1 font-semibold text-slate-700">
                  <option value="VAT">VAT (15% standard rate)</option>
                  <option value="Sales Tax">Sales Tax (5% flat)</option>
                  <option value="None">None (Tax Exempt / Nil)</option>
                </select>
              </div>
            </div>

            {/* Dynamic ledger Rows */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Debit Transactions Lines</span>
              {rows.map((row, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <div className="col-span-3">
                    <label className="text-[9px] text-slate-500 font-mono tracking-tighter">Debit CoA Account (Auto)</label>
                    <select 
                      value={row.category} 
                      onChange={e => updateRow(index, "category", e.target.value)}
                      className="w-full text-xs border bg-white rounded p-1 font-semibold text-slate-800 mt-1"
                    >
                      {EXP_COA_MAP.map(m => (
                        <option key={m.category} value={m.category}>{m.category} (DR {m.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <label className="text-[9px] text-slate-500">Activity Specific Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Feed batch til-3, 100kgs"
                      value={row.description}
                      onChange={e => updateRow(index, "description", e.target.value)}
                      required 
                      className="w-full text-xs border bg-white rounded p-1.5 mt-1"
                    />
                  </div>
                  <div className="col-span-1.5">
                    <label className="text-[9px] text-slate-500">Qty</label>
                    <input 
                      type="number" 
                      value={row.quantity}
                      onChange={e => updateRow(index, "quantity", e.target.value)}
                      required 
                      className={`w-full text-xs border bg-white rounded p-1.5 font-mono mt-1 ${row.quantity <= 0 ? 'border-rose-500 ring-1 ring-rose-250 bg-rose-50 text-rose-800' : 'focus:border-emerald-500'}`}
                    />
                  </div>
                  <div className="col-span-1.5">
                    <label className="text-[9px] text-slate-500">Unit Price ({currencySymbol})</label>
                    <input 
                      type="number" 
                      value={row.unitPrice}
                      onChange={e => updateRow(index, "unitPrice", e.target.value)}
                      required 
                      className={`w-full text-xs border bg-white rounded p-1.5 font-mono mt-1 ${row.unitPrice <= 0 ? 'border-rose-500 ring-1 ring-rose-250 bg-rose-50 text-rose-800' : 'focus:border-emerald-500'}`}
                    />
                  </div>
                  <div className="col-span-1.5 text-right flex flex-col justify-center">
                    <span className="text-[9px] text-slate-400">Net Amount</span>
                    <span className="text-xs font-mono font-black text-slate-900 mt-2">{(row.quantity * row.unitPrice).toFixed(2)}</span>
                  </div>
                  <div className="col-span-0.5 text-center pt-2">
                    <button type="button" onClick={() => removeRow(index)} className="text-rose-500 hover:text-rose-700 font-black">
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addRow} className="px-3.5 py-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg text-xs font-bold border">+ Add Lead Line</button>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Accounting preview box */}
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center text-xs">
              <div className="text-emerald-800 leading-relaxed">
                <span className="font-extrabold block uppercase tracking-wider text-[9px]">Double-Entry Journal Generation Preview:</span>
                <p className="mt-1 font-mono text-[9px] text-slate-700">
                  Debit: {rows.map(r => `Dr ${r.coaCode} (${r.category}) - ${currencySymbol}${(r.quantity*r.unitPrice).toFixed(2)}`).join(" | ")} <br/>
                  Credit: Cr 1010 Bank - {currencySymbol}{total.toFixed(2)}
                </p>
              </div>
              <div className="text-right whitespace-nowrap font-semibold">
                <div className="text-slate-500 text-[10px]">SUBTOTAL: {currencySymbol}{subtotal.toFixed(2)}</div>
                <div className="text-slate-500 text-[10px]">VAT TAX WEIGHT: {currencySymbol}{taxAmount.toFixed(2)}</div>
                <div className="text-sm font-black text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded border border-emerald-200 mt-1">TOTAL: {currencySymbol}{total.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-100 rounded">Discard</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow-md flex items-center gap-1">
                <Save className="w-4 h-4" />
                <span>Post & Debit Ledger</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EXPENSES TAB CONTENT */}
      {activeTab === "expenses" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Continuous Expenses & Cash book Disbursals</h4>
              <p className="text-[11px] text-slate-500 leading-normal">General bookkeeping tracking double entry debit operations. Ledger maps to IAS standards.</p>
            </div>
            {!isReadonly ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowCsvForm(!showCsvForm);
                    setShowAddForm(false);
                    setShowSupplierForm(false);
                    setCsvPreviewList([]);
                    setCsvError(null);
                  }}
                  className={`px-4 py-1.5 border hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${showCsvForm ? 'bg-slate-200 border-slate-400 text-slate-800' : 'border-slate-300 text-slate-700'}`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span>{showCsvForm ? "Close CSV Tool" : "Import via CSV"}</span>
                </button>
                <button 
                  onClick={() => {
                    setShowAddForm(true);
                    setShowCsvForm(false);
                  }}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post New Expense</span>
                </button>
              </div>
            ) : (
              <span className="text-xs text-rose-500 font-bold bg-rose-50 px-2.5 py-1 rounded inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Read-Only View
              </span>
            )}
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Reference ID</th>
                    <th className="p-3">Supplier / Vendor</th>
                    <th className="p-3">Collection Date</th>
                    <th className="p-3">Double Entry Postings</th>
                    <th className="p-3 text-right">Invoice Sum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {paginate(expenses).map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-700">{tx.id}</td>
                      <td className="p-3 font-bold text-slate-950">{tx.supplierName}</td>
                      <td className="p-3 text-slate-500 font-medium">{tx.date}</td>
                      <td className="p-3 leading-relaxed">
                        {tx.rows.map((r, i) => (
                          <div key={i} className="text-[10px] font-mono text-slate-600 font-semibold">
                            Dr <span className="text-slate-900 font-bold">{r.coaCode}</span> ({r.category}) — {currencySymbol}{r.amount.toFixed(2)}
                          </div>
                        ))}
                        <div className="text-[10px] font-mono text-emerald-600 border-t border-slate-100/60 pt-0.5 mt-0.5">
                          Cr <span className="font-bold">1010</span> BankOperational — {currencySymbol}{tx.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-[#0f172a]">
                        {currencySymbol} {tx.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic">No expense records posted. Click "+ Post New Expense" to create logs.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Expenses */}
            {expenses.length > 0 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">Show items:</span>
                  <select 
                    value={pageSize} 
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="border rounded p-1 text-xs font-semibold bg-white"
                  >
                    <option value={10}>10 items</option>
                    <option value={50}>50 items</option>
                    <option value={100}>100 items</option>
                  </select>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded border bg-white enabled:hover:bg-slate-50 text-[11px] disabled:opacity-40 font-bold"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 bg-slate-50 rounded font-mono font-bold text-[11px] text-slate-600">
                    Page {currentPage} of {Math.ceil(expenses.length / pageSize) || 1}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(expenses.length / pageSize)))} 
                    disabled={currentPage >= Math.ceil(expenses.length / pageSize)}
                    className="px-2.5 py-1 rounded border bg-white enabled:hover:bg-slate-50 text-[11px] disabled:opacity-40 font-bold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUPPLIERS MODULE TAB CONTENT */}
      {activeTab === "suppliers" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-fade-in">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Professional Suppliers/Payees Tracker</h4>
              <p className="text-[11px] text-slate-500 leading-normal">Monitor vendor credit obligations, registered details, TPINs, and track total payouts committed in cashbooks.</p>
            </div>
            {!isReadonly ? (
              <button 
                onClick={() => setShowSupplierForm(true)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-800"
              >
                <span>+ Register Payee / Supplier</span>
              </button>
            ) : (
              <span className="text-xs text-rose-550 font-bold">Read-Only</span>
            )}
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 bg-white">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-3">Vendor Name</th>
                    <th className="p-3">TPIN No</th>
                    <th className="p-3">Product Category</th>
                    <th className="p-3">Primary Contact</th>
                    <th className="p-3">Physical Address</th>
                    <th className="p-3">Remarks / Notes</th>
                    <th className="p-3 text-right">Total Disbursed Sum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {paginate(suppliers).map(s => {
                    // Compute total disbursements paid to this supplier!
                    const matchExpenses = expenses.filter(ex => ex.supplierId === s.id);
                    const totalPaid = matchExpenses.reduce((acc, ex) => acc + ex.total, 0);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="block font-extrabold text-slate-950">{s.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono italic block">{s.id}</span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-700">{s.tpin || "N/A"}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase font-extrabold font-mono">{s.category}</span>
                        </td>
                        <td className="p-3 text-[11px] leading-relaxed">
                          <span className="block font-bold mt-0.5">{s.contactPerson}</span>
                          <span className="text-slate-400 block font-mono text-[10px]">{s.phone} {s.email && `| ${s.email}`}</span>
                        </td>
                        <td className="p-3 max-w-xs text-slate-500 truncate">{s.address || "Local Pickup Delivery"}</td>
                        <td className="p-3 max-w-xs text-slate-400 italic font-medium leading-snug">{s.notes || "-"}</td>
                        <td className="p-3 text-right font-mono font-extrabold text-rose-600">
                          {currencySymbol} {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">No registered suppliers found. Create payees inline or click "+ Register Payee" above.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Suppliers */}
            {suppliers.length > 0 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">Show items:</span>
                  <select 
                    value={pageSize} 
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="border rounded p-1 text-xs font-semibold bg-white"
                  >
                    <option value={10}>10 items</option>
                    <option value={50}>50 items</option>
                    <option value={100}>100 items</option>
                  </select>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded border bg-white enabled:hover:bg-slate-50 text-[11px] disabled:opacity-40 font-bold"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 bg-slate-50 rounded font-mono font-bold text-[11px] text-slate-600">
                    Page {currentPage} of {Math.ceil(suppliers.length / pageSize) || 1}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(suppliers.length / pageSize)))} 
                    disabled={currentPage >= Math.ceil(suppliers.length / pageSize)}
                    className="px-2.5 py-1 rounded border bg-white enabled:hover:bg-slate-50 text-[11px] disabled:opacity-40 font-bold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
