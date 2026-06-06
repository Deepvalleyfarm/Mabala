import React, { useState } from "react";
import { Invoice, Quotation, Customer, InvoiceLine, CropCycle } from "../types";
import { jsPDF } from "jspdf";
import { 
  Plus, 
  Check, 
  FileCheck, 
  DollarSign, 
  Download, 
  ArrowRight, 
  CornerDownRight, 
  Users, 
  Receipt, 
  FileText, 
  Archive, 
  Search, 
  BadgeHelp, 
  CheckCircle,
  Clock,
  Printer,
  ChevronRight
} from "lucide-react";

interface InvoicesPanelProps {
  invoices: Invoice[];
  quotations: Quotation[];
  customers: Customer[];
  crops: CropCycle[];
  onAddInvoice: (inv: Invoice) => void;
  onAddQuotation: (qt: Quotation) => void;
  onMarkPaid: (id: string, paymentAmount?: number) => void;
  onConvertQuote: (quote: Quotation) => void;
  onAddCustomer: (cus: Customer) => void;
  isReadonly: boolean;
  currencySymbol: string;
  activeFarm?: any;
}

export default function InvoicesPanel({
  invoices,
  quotations,
  customers,
  crops,
  onAddInvoice,
  onAddQuotation,
  onMarkPaid,
  onConvertQuote,
  onAddCustomer,
  isReadonly,
  currencySymbol,
  activeFarm
}: InvoicesPanelProps) {
  const [activeSegment, setActiveSegment] = useState<"invoices" | "quotations" | "customers">("invoices");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // New Customer Form States
  const [custName, setCustName] = useState("");
  const [custTpin, setCustTpin] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custEmail, setCustEmail] = useState("");

  // New Invoice/Quotation Form States
  const [customerName, setCustomerName] = useState("");
  const [selectedCropId, setSelectedCropId] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: "", quantity: 1, unitPrice: 0, amount: 0 }
  ]);
  const [dueDate, setDueDate] = useState("2026-06-15");

  // Part Payment state modal
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleExportInvoicePDF = (docItem: any, isQuote: boolean = false) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const xMargin = 15;

    // --- Elegant Header Decor ---
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, pageWidth, 16, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("MABALA FINANCIAL TRANSACTION STANDARD • LETTERHEAD GENERATION", 15, 10.5);

    if (activeFarm?.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(248, 250, 252);
      doc.text(activeFarm.name.toUpperCase(), 195, 10.5, { align: "right" });
    }

    // DRAW THE LOGO IN THE HEADER BAND OR TOP CORNER (logoX=15, logoY=22)
    const logoX = 15;
    const logoY = 22;
    const logoWidth = 10;
    const logoHeight = 10;

    if (activeFarm?.logo) {
      if (activeFarm.logo === "leaf") {
        doc.setFillColor(16, 185, 129); // Emerald-500
        doc.ellipse(logoX + 5, logoY + 5, 4, 5, "F");
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.4);
        doc.line(logoX + 5, logoY + 10, logoX + 5, logoY + 2.5); // stem
      } else if (activeFarm.logo === "wheat") {
        doc.setFillColor(245, 158, 11); // Amber-500
        doc.circle(logoX + 5, logoY + 3.1, 1.5, "F");
        doc.circle(logoX + 3.2, logoY + 5, 1.2, "F");
        doc.circle(logoX + 6.8, logoY + 5, 1.2, "F");
        doc.circle(logoX + 5, logoY + 7, 1.5, "F");
        doc.rect(logoX + 4.5, logoY + 8, 1, 2.5, "F"); // stem
      } else if (activeFarm.logo === "shield") {
        doc.setFillColor(79, 70, 229); // Indigo-600
        doc.triangle(logoX + 1, logoY + 1, logoX + 9, logoY + 1, logoX + 5, logoY + 10, "F");
        doc.setFillColor(99, 102, 241); // Indigo-500
        doc.triangle(logoX + 3, logoY + 2, logoX + 7, logoY + 2, logoX + 5, logoY + 8, "F");
      } else if (activeFarm.logo === "water") {
        doc.setFillColor(6, 182, 212); // Cyan-500
        doc.triangle(logoX + 5, logoY + 2, logoX + 2.5, logoY + 7, logoX + 7.5, logoY + 7, "F");
        doc.circle(logoX + 5, logoY + 7, 2.5, "F");
      } else if (activeFarm.logo.startsWith("data:image/")) {
        try {
          const format = activeFarm.logo.includes("image/png") ? "PNG" : "JPEG";
          doc.addImage(activeFarm.logo, format, logoX, logoY, logoWidth, logoHeight);
        } catch (e) {
          console.error("Error drawing custom image logo on invoice PDF:", e);
        }
      }
    }

    // --- FARM ISSUER BLOCK ---
    let y = 25;
    const txtOffset = activeFarm?.logo ? 29 : 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(activeFarm?.name || "Corporate Farm Estate", txtOffset, y);
    y += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`TPIN: ${activeFarm?.tpin || "100431290"}` + (activeFarm?.phone ? ` | PH: ${activeFarm.phone}` : ""), txtOffset, y);
    y += 4;
    
    doc.text(`Email: ${activeFarm?.email || "billing@mabalasubscriber.com"} | Address: ${activeFarm?.address || "Zambian Land Sector Offices"}`, txtOffset, y);
    y += 8;

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.line(15, y, 195, y);
    y += 8;

    // --- DOCUMENT METADATA PANEL (2 Columns) ---
    // Background card
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 26, "F");
    doc.setDrawColor(241, 245, 249);
    doc.rect(15, y, 180, 26, "D");

    // Left Column: Document Type and Numbers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const docTitle = isQuote ? "PROFORMA QUOTATION" : "TAX INVOICE / DEMAND DEBT";
    doc.text(docTitle, 22, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const numLabel = isQuote ? `QUOTATION REF: ${docItem.quoteNumber || "QT-" + docItem.id.slice(0, 5).toUpperCase()}` : `INVOICE NUMBER: ${docItem.invoiceNumber}`;
    doc.text(numLabel, 22, y + 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const dateLabel = `Date Issued: ${docItem.date || "2026-06-01"} | Due Date Term: ${docItem.dueDate || "Immediate"}`;
    doc.text(dateLabel, 22, y + 21);

    // Right Column: Status & Balances
    doc.setFont("helvetica", "normal");
    doc.text("PAYMENT METADATA", 188, y + 8, { align: "right" });

    // Status Pill
    if (!isQuote) {
      const getPaidSum = (i: any) => {
        if (i.paidAmount !== undefined) return i.paidAmount;
        return i.status === "Paid" ? i.total : 0;
      };
      const paid = getPaidSum(docItem);
      const balance = docItem.total - paid;
      const statusText = balance === 0 ? "PAID IN FULL" : paid > 0 ? "PART PAID" : "UNPAID STATUS";
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(balance === 0 ? 16 : paid > 0 ? 79 : 220, balance === 0 ? 185 : paid > 0 ? 70 : 38, balance === 0 ? 129 : paid > 0 ? 229 : 38);
      doc.text(statusText, 188, y + 14, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.text(`Outstanding Bal: ${currencySymbol} ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 188, y + 21, { align: "right" });
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text("ESTIMATE PROFORMA", 188, y + 14, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("Expires in 30 days", 188, y + 21, { align: "right" });
    }

    y += 33;

    // --- RECIPIENT BUYER INFO BOX ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-400
    doc.text("RECIPIENT CUSTOMER BILL-TO:", 15, y);
    y += 5.5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(docItem.customerName, 15, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Customer TPIN: ${docItem.customerTpin || "N/A"}`, 15, y);
    y += 8;

    // --- LINE ITEMS TABLE GRID ---
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(15, y, 180, 7.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("ITEM DESCRIPTION & LEDGER ALLOCATION", 18, y + 5);
    doc.text("QTY", 120, y + 5, { align: "center" });
    doc.text("UNIT PRICE", 145, y + 5, { align: "right" });
    doc.text("NET AMOUNT", 192, y + 5, { align: "right" });

    y += 7.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    const docLines = docItem.lines || [];
    docLines.forEach((ln: any, idx: number) => {
      // Alternate row bg colors for beautiful spacing
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y, 180, 7, "F");
      }
      doc.setTextColor(51, 65, 85);
      doc.text(ln.description || "Unspecified Deliverables", 18, y + 5);
      doc.text(String(ln.quantity), 120, y + 5, { align: "center" });
      doc.text(`${currencySymbol} ${(ln.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 145, y + 5, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(`${currencySymbol} ${(ln.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 192, y + 5, { align: "right" });
      doc.setFont("helvetica", "normal");
      
      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 7, 195, y + 7);
      y += 7;
    });

    y += 3;

    // --- ACCUMULATED LEDGER TOTALS ---
    const subtotal = docItem.subtotal || docItem.total * 0.84;
    const taxAmount = docItem.taxAmount || docItem.total * 0.16;
    const total = docItem.total;

    // Draw little box for totals
    doc.setFillColor(248, 250, 252);
    doc.rect(xMargin + 100, y, 80, 23.5, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(xMargin + 100, y, 80, 23.5, "D");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("SUBTOTAL EXCLUDING TAXES:", xMargin + 104, y + 5.5);
    doc.text(`${currencySymbol} ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 192, y + 5.5, { align: "right" });

    doc.text("ZRA 16% STANDARD VAT RATE:", xMargin + 104, y + 11.5);
    doc.text(`${currencySymbol} ${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 192, y + 11.5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("TOTAL DUE / RECORDED VALUE:", xMargin + 104, y + 18.5);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(`${currencySymbol} ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 192, y + 18.5, { align: "right" });

    y += 33;

    // --- AUDIT TRAIL / DOUBLE-ENTRY FOOTNOTE ---
    if (!isQuote) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 15, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const coaDr = docItem.coaDebit || "1100";
      const coaCr = docItem.coaCredit || "4000";
      doc.text("ISO-ALIGNED DOUBLE-ENTRY JOURNAL REF:", 18, y + 5);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Dr Account ${coaDr} (Customer Ledger Accounts Receivable) • Cr Account ${coaCr} (General Crop Revenue Allocations)`, 18, y + 10);
      y += 15;
    }

    // Footer signature lines
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Thank you for your valued business. This document was auto-generated of true electronic ledger states.", 15, pageHeight - 20);
    doc.text("Authorized Auditor Signature & System Stamp", 195, pageHeight - 20, { align: "right" });

    // Save
    const docName = isQuote 
      ? `quotation_${docItem.id.slice(0, 6)}.pdf` 
      : `invoice_${docItem.invoiceNumber}.pdf`;
    doc.save(docName);
  };

  const addLine = () => {
    setLines([...lines, { description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof InvoiceLine, val: any) => {
    const updated = [...lines];
    let lineObj = { ...updated[idx] };
    if (field === "quantity" || field === "unitPrice") {
      lineObj[field] = Number(val);
      lineObj.amount = lineObj.quantity * lineObj.unitPrice;
    } else {
      (lineObj as any)[field] = val;
    }
    updated[idx] = lineObj;
    setLines(updated);
  };

  // Crop Batch Selection changes auto filler description!
  const handleCropBatchChange = (cropId: string) => {
    setSelectedCropId(cropId);
    if (!cropId) return;
    const crop = crops.find(c => c.id === cropId);
    if (!crop) return;

    // Auto-fill Description: Use: Batch/Cycle Name, Crop Type
    const autoDesc = `${crop.cropType} - Block: ${crop.fieldBlock} - Cycle Target Yield: ${crop.expectedYieldKg} kg`;
    
    // Auto populate the first line item description
    const updated = [...lines];
    updated[0] = {
      ...updated[0],
      description: autoDesc
    };
    setLines(updated);
  };

  const subtotal = lines.reduce((acc, r) => acc + (r.quantity * r.unitPrice), 0);
  const taxAmount = subtotal * 0.15; // default 15% local standard VAT representation
  const total = subtotal + taxAmount;

  // Add customer handler
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;
    const newCust: Customer = {
      id: "CUST-" + Date.now(),
      name: custName,
      tpin: custTpin || undefined,
      phone: custPhone,
      address: custAddress,
      email: custEmail,
      contact: custPhone // map contact
    };
    onAddCustomer(newCust);
    setCustomerName(newCust.name); // Set invoice dropdown
    setCustName("");
    setCustTpin("");
    setCustPhone("");
    setCustAddress("");
    setCustEmail("");
    setShowCustomerModal(false);
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;

    if (activeSegment === "invoices") {
      // Dynamic invoice creation
      const inv: Invoice = {
        id: "INV-" + Date.now(),
        invoiceNumber: `INV-2026-0${invoices.length + 11}`,
        date: new Date().toISOString().split('T')[0],
        dueDate,
        customerName,
        customerTpin: customers.find(c => c.name === customerName)?.tpin,
        taxAmount,
        subtotal,
        total,
        lines: lines.map(l => ({ ...l, amount: l.quantity * l.unitPrice })),
        status: "Unpaid",
        coaDebit: "1100",
        coaCredit: "4100",
        farmId: "farm-1",
        cropId: selectedCropId || undefined
      };
      // Keep state tracking variables
      (inv as any).paidAmount = 0;
      onAddInvoice(inv);
      setSelectedCropId("");
    } else {
      const qt: Quotation = {
        id: "QT-" + Date.now(),
        quoteNumber: `QT-2026-0${quotations.length + 11}`,
        date: new Date().toISOString().split('T')[0],
        validityPeriodDays: 30,
        customerName,
        taxAmount,
        subtotal,
        total,
        lines: lines.map(l => ({ ...l, amount: l.quantity * l.unitPrice })),
        status: "Draft",
        farmId: "farm-1"
      };
      onAddQuotation(qt);
    }

    setShowAddForm(false);
    setSelectedCropId("");
    setLines([{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const getPaidAmount = (inv: Invoice) => {
    if (inv.paidAmount !== undefined) return inv.paidAmount;
    return inv.status === "Paid" ? inv.total : 0;
  };

  // Trigger partial or full payments collection
  const collectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoiceId) return;
    onMarkPaid(paymentInvoiceId, paymentAmount);
    setPaymentInvoiceId(null);
    setPaymentAmount(0);
  };

  const openPaymentCollector = (inv: Invoice) => {
    setPaymentInvoiceId(inv.id);
    // Suggest remaining amount
    const paid = getPaidAmount(inv);
    const remaining = inv.total - paid;
    setPaymentAmount(remaining);
  };

  const getOutstandingBalance = (inv: Invoice) => {
    const paid = getPaidAmount(inv);
    return inv.total - paid;
  };

  // Pagination helper
  const paginate = (items: any[]) => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Panel Tabs switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit text-xs font-bold shadow-sm gap-1 border">
        <button 
          onClick={() => { setActiveSegment("invoices"); setShowAddForm(false); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl transition-all ${activeSegment === "invoices" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}
        >
          Customer Invoices
        </button>
        <button 
          onClick={() => { setActiveSegment("quotations"); setShowAddForm(false); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl transition-all ${activeSegment === "quotations" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}
        >
          Proforma Quotations
        </button>
        <button 
          onClick={() => { setActiveSegment("customers"); setShowAddForm(false); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl transition-all ${activeSegment === "customers" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}
        >
          Customers Directory ({customers.length})
        </button>
      </div>

      {/* Customer Form Modal Overlay */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen">
          <form onSubmit={handleSaveCustomer} className="w-full max-w-md bg-white rounded-2xl shadow-xl border p-6 space-y-4 animate-scale-up" id="customer-inline-form">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest pb-2 border-b">Onboard Customer Register</h4>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Customer Name *</label>
                <input type="text" value={custName} onChange={e => setCustName(e.target.value)} required className="w-full mt-1 border rounded p-2 focus:border-emerald-500 bg-slate-50 focus:bg-white" placeholder="e.g. Kasama Millers Ltd" />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">TPIN Number</label>
                <input type="text" value={custTpin} onChange={e => setCustTpin(e.target.value)} className="w-full mt-1 border rounded p-2 focus:border-emerald-500 bg-slate-50 focus:bg-white font-mono" placeholder="e.g. 1009180023" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500">Contact Number</label>
                  <input type="text" value={custPhone} onChange={e => setCustPhone(e.target.value)} className="w-full mt-1 border rounded p-2 focus:border-emerald-500 bg-slate-50 focus:bg-white" placeholder="e.g. +260977450123" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500">Email Address</label>
                  <input type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} className="w-full mt-1 border rounded p-2 focus:border-emerald-500 bg-slate-50 focus:bg-white" placeholder="e.g. procurement@kasamamills.zm" />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Registered Corporate Address</label>
                <input type="text" value={custAddress} onChange={e => setCustAddress(e.target.value)} className="w-full mt-1 border rounded p-2 bg-slate-50 focus:bg-white" placeholder="e.g. Plot 20, Independence Main Way, Kasama" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t text-xs font-semibold">
              <button type="button" onClick={() => setShowCustomerModal(false)} className="px-4 py-2 bg-slate-100 rounded">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 shadow">Save Customer</button>
            </div>
          </form>
        </div>
      )}

      {/* New invoice/quotation creator inline */}
      {showAddForm && (
        <form onSubmit={handleSaveDocument} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-6 animate-fade-in w-full max-w-4xl" id="doc-creator-form">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Generate {activeSegment === "invoices" ? "Audit Registered Customer Invoice" : "Proforma Quotation Entry"}</span>
            </h3>
            
            <button type="button" onClick={() => setShowCustomerModal(true)} className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-bold hover:bg-emerald-100">
              + Onboard Inline Customer
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500">Select Registered Customer Recipient *</label>
              <select value={customerName} onChange={e => setCustomerName(e.target.value)} required className="w-full text-xs font-bold border rounded p-2.5 bg-slate-50 mt-1">
                <option value="">-- Select Outflow Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.name}>{c.name} {c.tpin ? `(TPIN: ${c.tpin})` : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500">Linked Harvest Cycle / Crop batch</label>
              <select value={selectedCropId} onChange={e => handleCropBatchChange(e.target.value)} className="w-full text-xs font-bold border rounded p-2.5 bg-slate-50 mt-1 text-slate-700">
                <option value="">-- No linked crop batch --</option>
                {crops.map(c => (
                  <option key={c.id} value={c.id}>{c.cropType} ({c.fieldBlock}) — Target Yield: {c.expectedYieldKg}kg</option>
                ))}
              </select>
            </div>

            {activeSegment === "invoices" && (
              <div>
                <label className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Due Payment Deadline *</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="w-full text-xs border bg-slate-50 font-bold rounded p-2 mt-1" />
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Itemized Sales Ledger Lines</span>
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div className="col-span-6">
                  <label className="text-[9px] text-slate-400">Yield descriptor (Auto filled upon crop match)</label>
                  <input type="text" placeholder="Description of harvested yield or goods sold" value={line.description} onChange={e => updateLine(idx, "description", e.target.value)} required className="w-full text-xs border bg-white rounded p-1.5" />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] text-slate-400">Sailed Qty</label>
                  <input type="number" placeholder="Qty" value={line.quantity} onChange={e => updateLine(idx, "quantity", e.target.value)} required className="w-full text-xs border bg-white rounded p-1.5 font-mono" />
                </div>
                <div className="col-span-3">
                  <label className="text-[9px] text-slate-400">Unit Price ({currencySymbol})</label>
                  <input type="number" placeholder="Price" value={line.unitPrice} onChange={e => updateLine(idx, "unitPrice", e.target.value)} required className="w-full text-xs border bg-white rounded p-1.5 font-mono" />
                </div>
                <div className="col-span-1 text-center pt-4">
                  <button type="button" onClick={() => removeLine(idx)} className="text-rose-500 hover:text-rose-700 text-xs font-bold font-mono">X</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addLine} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 border">+ Add Line Item</button>
          </div>

          {/* Sum details */}
          <div className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center text-xs font-mono">
            <div>
              {activeSegment === "invoices" && (
                <p className="text-[10px] text-slate-500">
                  Accounts mapping preview: <strong className="text-slate-900">Dr 1100 (Receivables) / Cr 4000 (Revenue)</strong>
                </p>
              )}
            </div>
            <div className="text-right font-semibold space-y-1">
              <div>Subtotal: {currencySymbol} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div>Estimated VAT (15%): {currencySymbol} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="text-sm font-black text-emerald-700 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-100 mt-2 block">
                Total Due Weight: {currencySymbol} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md">Conclude Document</button>
          </div>
        </form>
      )}

      {/* PARTIAL / FULL PAYMENT COLLECTION MODAL */}
      {paymentInvoiceId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen">
          <form onSubmit={collectPayment} className="w-full max-w-md bg-white rounded-2xl shadow-xl border p-6 space-y-4 animate-scale-up" id="invoice-payment-form">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest pb-2 border-b">Collect Invoice Payment</h4>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Record full or partial cash collections on outstanding receivables. System dynamically calculates unpaid balances.
            </p>

            {(() => {
              const inv = invoices.find(i => i.id === paymentInvoiceId);
              if (!inv) return null;
              const paid = getPaidAmount(inv);
              const remaining = inv.total - paid;

              return (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-205">
                    <div className="flex justify-between font-semibold py-1">
                      <span>Invoice Total:</span>
                      <span className="font-mono">{currencySymbol} {inv.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold py-1">
                      <span>Total Already Collected:</span>
                      <span className="font-mono text-emerald-600 font-bold">{currencySymbol} {paid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold py-1 border-t mt-1">
                      <span>Remaining Balance:</span>
                      <span className="font-mono text-indigo-600 font-extrabold">{currencySymbol} {remaining.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500">Amount Collected Now ({currencySymbol}) *</label>
                    <input 
                      type="number" 
                      max={remaining}
                      min={1} 
                      step="any"
                      value={paymentAmount} 
                      onChange={e => setPaymentAmount(Number(e.target.value))} 
                      required 
                      className="w-full mt-1 border rounded p-2 focus:border-emerald-500 bg-slate-150 font-bold font-mono text-xs" 
                    />
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-3 border-t text-xs font-semibold">
              <button type="button" onClick={() => setPaymentInvoiceId(null)} className="px-4 py-2 bg-slate-100 rounded">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 shadow">Conclude Collected Payment</button>
            </div>
          </form>
        </div>
      )}

      {/* Main invoices lists */}
      {activeSegment === "invoices" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/50 border-b flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Acre Audit Invoice Directory</h3>
              <p className="text-[11px] text-slate-500">Auto-balanced customer credit obligations and outstanding collections registers.</p>
            </div>
            {!isReadonly ? (
              <button onClick={() => setShowAddForm(true)} className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold shadow">+ New Invoice</button>
            ) : (
              <span className="text-xs text-rose-500 bg-rose-50 px-2.5 py-1 rounded font-bold">Read-Only View</span>
            )}
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-white text-slate-800">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-3">Reference ID</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Due Deadline</th>
                    <th className="p-3">Double-Entry Reference</th>
                    <th className="p-3 text-right">Invoiced Sum</th>
                    <th className="p-3 text-right">Collected Amount</th>
                    <th className="p-3 text-right">Outstanding Bal</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Receive</th>
                    <th className="p-3 text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {paginate(invoices).map(inv => {
                    const paid = getPaidAmount(inv);
                    const balance = inv.total - paid;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-mono text-slate-900">{inv.invoiceNumber}</td>
                        <td className="p-2.5 text-slate-950 font-extrabold">{inv.customerName}</td>
                        <td className="p-2.5 text-slate-500 font-medium">{inv.dueDate}</td>
                        <td className="p-2.5 font-mono text-[9px] text-slate-500 leading-normal">
                          {paid > 0 ? `Collected: Dr 1010 Bank / Cr 1100 Recv` : ""} <br/>
                          {balance > 0 ? `Unpaid: Dr 1100 Recv / Cr 4000 Rev` : ""}
                        </td>
                        <td className="p-2.5 font-mono font-extrabold text-slate-900 text-right">
                          {currencySymbol} {inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600 text-right">
                          {currencySymbol} {paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 font-mono font-extrabold text-rose-500 text-right">
                          {currencySymbol} {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase font-mono ${
                            balance === 0 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                              : paid > 0 
                                ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                                : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}>
                            {balance === 0 ? "PAID" : paid > 0 ? "PART PAID" : "UNPAID"}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          {balance > 0 && !isReadonly ? (
                            <button 
                              onClick={() => openPaymentCollector(inv)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold rounded-lg cursor-pointer shadow-xs"
                            >
                              Collect
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-bold">✓</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleExportInvoicePDF(inv, false)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black rounded-lg border border-slate-200 cursor-pointer inline-flex items-center gap-1 hover:shadow-xs"
                            title="Download PDF demand notice with custom letterhead logo"
                          >
                            <Download className="w-2.5 h-2.5 text-slate-500" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400 italic">No customer invoices posted. Use the '+ New Invoice' trigger to bill corporate buyers.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {invoices.length > 0 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">Rows to display:</span>
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
                    Page {currentPage} of {Math.ceil(invoices.length / pageSize) || 1}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(invoices.length / pageSize)))} 
                    disabled={currentPage >= Math.ceil(invoices.length / pageSize)}
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

      {/* Main proforma quotes list */}
      {activeSegment === "quotations" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-6 py-4 bg-slate-50/50 border-b flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Quotations Registry Panel</h3>
              <p className="text-[11px] text-slate-500">Proforma documents have no double-entry ledger impact until converted into finalized customer invoice.</p>
            </div>
            {!isReadonly ? (
              <button onClick={() => setShowAddForm(true)} className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow">+ New Quotation</button>
            ) : (
              <span className="text-xs text-rose-500 bg-rose-50 px-2 rounded">Locked</span>
            )}
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-white text-slate-800">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-3">Reference ID</th>
                    <th className="p-3">Customer Recipient</th>
                    <th className="p-3">Date Drafted</th>
                    <th className="p-3">Validity Horizon</th>
                    <th className="p-3 text-right">Sum Weight</th>
                    <th className="p-3 text-right">Transition Action</th>
                    <th className="p-3 text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {paginate(quotations).map(qt => (
                    <tr key={qt.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-900">{qt.quoteNumber || "QT-DRAFT"}</td>
                      <td className="p-3 text-slate-950 font-bold">{qt.customerName}</td>
                      <td className="p-3 text-slate-500 font-medium">{qt.date}</td>
                      <td className="p-3 font-medium text-slate-600">{qt.validityPeriodDays || 30} Days valid</td>
                      <td className="p-3 font-mono font-extrabold text-slate-900 text-right">
                        {currencySymbol} {qt.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right">
                        {!isReadonly && (
                          <button 
                            onClick={() => onConvertQuote(qt)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold rounded-lg flex items-center gap-1 inline-flex cursor-pointer"
                          >
                            <span>Accept & Convert to Invoice</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleExportInvoicePDF(qt, true)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-lg border border-slate-200 cursor-pointer inline-flex items-center gap-1 hover:shadow-xs"
                          title="Download PDF Quotation with custom letterhead logo"
                        >
                          <Download className="w-3 h-3 text-slate-500" />
                          <span>PDF Quote</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {quotations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">No pro-forma quotations registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customers Directory Sub-Panel */}
      {activeSegment === "customers" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-6 py-4 bg-slate-50/50 border-b flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Multi-Country Customer Directory</h3>
              <p className="text-[11px] text-slate-500">List registered agricultural customers and audit total purchases linked to paid invoices.</p>
            </div>
            {!isReadonly ? (
              <button onClick={() => setShowCustomerModal(true)} className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow">+ Add Registered Customer</button>
            ) : (
              <span className="text-xs text-rose-500 bg-rose-50 px-2 rounded">Locked</span>
            )}
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-white text-slate-800">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-3">Customer ID</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">TPIN / TAX ID</th>
                    <th className="p-3">Contact Email</th>
                    <th className="p-3">Phone Line</th>
                    <th className="p-3">Address</th>
                    <th className="p-3 text-right">Audited Purchases Sum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-850">
                  {paginate(customers).map(c => {
                    // Sum paid + unpaid invoices for total purchases tracking!
                    const matchInvoices = invoices.filter(i => i.customerName === c.name);
                    const purchasesSum = matchInvoices.reduce((acc, i) => acc + i.total, 0);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-slate-500">{c.id}</td>
                        <td className="p-3 font-black text-slate-950 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.name}</span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-700">{c.tpin || "N/A - Non Taxable"}</td>
                        <td className="p-3 text-slate-600 font-medium">{c.email || "N/A - Off-Grid Customer"}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">{c.phone || "N/A"}</td>
                        <td className="p-2.5 max-w-xs text-slate-500 truncate">{c.address || "N/A Local Delivery"}</td>
                        <td className="p-3 font-mono font-extrabold text-right text-emerald-700">
                          {currencySymbol} {purchasesSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">No registered corporate customers found. Onboard clients inline above.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Customers */}
            {customers.length > 0 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">Rows to display:</span>
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
                  <span className="px-3 py-1 bg-slate-50 rounded font-mono font-bold text-[11px] text-slate-650">
                    Page {currentPage} of {Math.ceil(customers.length / pageSize) || 1}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(customers.length / pageSize)))} 
                    disabled={currentPage >= Math.ceil(customers.length / pageSize)}
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
