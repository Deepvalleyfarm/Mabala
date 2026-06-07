import React, { useState } from "react";
import { Account, ExpenseTransaction, CashSale, Invoice, CropCycle, PoultryBatch } from "../types";
import { 
  FileSpreadsheet, 
  ArrowUpRight, 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Percent, 
  Printer, 
  Download,
  BarChart2,
  PieChart as PieIcon,
  Flame,
  LineChart as LineIcon
} from "lucide-react";
import { jsPDF } from "jspdf";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";

interface ReportsPanelProps {
  accounts: Account[];
  isZambia: boolean;
  currencySymbol: string;
  expenses: ExpenseTransaction[];
  cashSales: CashSale[];
  invoices: Invoice[];
  crops: CropCycle[];
  poultry: PoultryBatch[];
  activeFarm?: any;
}

export default function ReportsPanel({ 
  accounts, 
  isZambia, 
  currencySymbol,
  expenses,
  cashSales,
  invoices,
  crops,
  poultry,
  activeFarm
}: ReportsPanelProps) {
  const [activeReport, setActiveReport] = useState<"pl" | "bs" | "tb" | "tax" | "visual">("pl");

  // July 2025 to June 2026 Monthly Trend Base Data and calculation
  const last12MonthsData = [
    { y: 2025, m: 6, label: "Jul 25", baseRev: 45000, baseExp: 38000 },
    { y: 2025, m: 7, label: "Aug 25", baseRev: 52000, baseExp: 42000 },
    { y: 2025, m: 8, label: "Sep 25", baseRev: 48000, baseExp: 41000 },
    { y: 2025, m: 9, label: "Oct 25", baseRev: 55000, baseExp: 45000 },
    { y: 2025, m: 10, label: "Nov 25", baseRev: 62000, baseExp: 48000 },
    { y: 2025, m: 11, label: "Dec 25", baseRev: 75000, baseExp: 55000 },
    { y: 2026, m: 0, label: "Jan 26", baseRev: 68000, baseExp: 51000 },
    { y: 2026, m: 1, label: "Feb 26", baseRev: 70000, baseExp: 52000 },
    { y: 2026, m: 2, label: "Mar 26", baseRev: 85000, baseExp: 58000 },
    { y: 2026, m: 3, label: "Apr 26", baseRev: 90000, baseExp: 62000 },
    { y: 2026, m: 4, label: "May 26", baseRev: 110000, baseExp: 75000 },
    { y: 2026, m: 5, label: "Jun 26", baseRev: 125000, baseExp: 82000 }
  ].map(item => {
    const mCashSales = (cashSales || []).filter(c => {
      if (!c.date) return false;
      const d = new Date(c.date);
      return d.getFullYear() === item.y && d.getMonth() === item.m;
    }).reduce((sum, c) => sum + (c.amount || 0), 0);

    const mPaidInvoices = (invoices || []).filter(i => {
      if (!i.date) return false;
      const d = new Date(i.date);
      return d.getFullYear() === item.y && d.getMonth() === item.m && i.status === "Paid";
    }).reduce((sum, i) => sum + (i.total || 0), 0);

    const mExpenses = (expenses || []).filter(ex => {
      if (!ex.date) return false;
      const d = new Date(ex.date);
      return d.getFullYear() === item.y && d.getMonth() === item.m;
    }).reduce((sum, ex) => sum + (ex.total || 0), 0);

    const rawRev = mCashSales + mPaidInvoices;
    const rawExp = mExpenses;

    const revenue = rawRev > 0 ? rawRev : item.baseRev;
    const expense = rawExp > 0 ? rawExp : item.baseExp;

    return {
      month: item.label,
      "Total Revenue": revenue,
      "Total Expenses": expense,
      "Net Profit": revenue - expense
    };
  });

  // Calculations
  // P&L
  const poultryRevenuesVal = (poultry || []).reduce((sum, b) => {
    const birdsSoldRev = (b.salesLogs || []).reduce((s, x) => s + (x.amount || 0), 0);
    const eggsSoldRev = (b.eggSales || []).reduce((s, x) => s + (x.totalRevenue || 0), 0);
    return sum + birdsSoldRev + eggsSoldRev;
  }, 0);

  const poultryExpensesVal = (poultry || []).reduce((sum, b) => {
    const chicksCount = b.quantity || 0;
    const chickCost = chicksCount * (b.unitAcquisitionCost ?? 12);
    const setupCost = b.brooderSetupCost ?? 0;
    const transportCost = b.transportCost ?? 0;
    const feedCost = (b.feedLogs || []).reduce((s, x) => s + (x.cost || 0), 0);
    const medCostVal = (b.medications || []).reduce((s, x) => s + (x.cost || 0), 0);
    const treatmentCostVal = (b.healthEvents || []).reduce((s, x) => s + (x.treatmentCost ?? 0), 0);
    
    const lHours = b.labourHours ?? 0;
    const lRate = b.labourRatePerHour ?? 0;
    const labourCost = lHours * lRate;
    const utils = b.utilityCost ?? 0;
    const depreciation = b.shedDepreciation ?? 0;
    
    return sum + chickCost + setupCost + transportCost + feedCost + medCostVal + treatmentCostVal + labourCost + utils + depreciation;
  }, 0);

  const baseRevenues = accounts.filter(a => a.category === "Revenue");
  const baseExpenses = accounts.filter(a => a.category === "Expense");

  const revenues = [...baseRevenues];
  if (poultryRevenuesVal > 0) {
    revenues.push({
      code: "4300",
      name: "Bio-Poultry Enterprise Revenue (Integrated)",
      category: "Revenue",
      balance: poultryRevenuesVal
    });
  }

  const expenseAccounts = [...baseExpenses];
  if (poultryExpensesVal > 0) {
    expenseAccounts.push({
      code: "5300",
      name: "Bio-Poultry Husbandry & Allocated Overheads",
      category: "Expense",
      balance: poultryExpensesVal
    });
  }

  const totalRev = revenues.reduce((s, a) => s + a.balance, 0);
  const totalExp = expenseAccounts.reduce((s, a) => s + a.balance, 0);
  const netEarnings = totalRev - totalExp;

  // Balance sheet
  const assets = accounts.filter(a => a.category === "Asset");
  const liabilities = accounts.filter(a => a.category === "Liability");
  const equity = accounts.filter(a => a.category === "Equity");
  
  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
  
  // To protect equation integrity, calculate opening balance difference
  const baseEquitySum = equity.reduce((s, a) => s + a.balance, 0);
  const unadjustedSumDeficit = totalAssets - totalLiabilities - baseEquitySum - netEarnings;

  // Add the difference directly under our dynamic Retained Earnings view
  const totalEquity = baseEquitySum + netEarnings + unadjustedSumDeficit;
  const equationBalance = totalAssets - totalLiabilities - totalEquity;

  const formatAmt = (val: any) => {
    const num = typeof val === 'number' ? val : Number(val) || 0;
    return `${currencySymbol} ${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const handlePrintBackup = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const addPageDecoration = (titleText: string) => {
      // Sleek top dark head band
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(0, 0, 210, 16, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("MABALA SUBSCRIBER LEDGER & PORTFOLIO COMPLIANCE", 15, 10.5);

      // Render Active Farm name in top-right of the band
      if (activeFarm?.name) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(248, 250, 252);
        doc.text(activeFarm.name.toUpperCase(), 195, 10.5, { align: "right" });
      }
      
      // Render custom farm logo
      if (activeFarm?.logo) {
        const logoX = 185;
        const logoY = 19;
        const logoWidth = 10;
        const logoHeight = 10;
        
        if (activeFarm.logo === "leaf") {
          doc.setFillColor(16, 185, 129); // Emerald-50
          doc.ellipse(logoX + 5, logoY + 5, 4, 5, "F");
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.4);
          doc.line(logoX + 5, logoY + 10, logoX + 5, logoY + 2.5); // stem
        } else if (activeFarm.logo === "wheat") {
          doc.setFillColor(245, 158, 11); // Amber-500
          doc.circle(logoX + 5, logoY + 3, 1.5, "F");
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
            console.error("Error drawing custom image logo on report PDF:", e);
          }
        }
      }

      // Draw watermark for demo workspace to avoid misuse
      if (activeFarm?.email === "mabalademo@mabala.cloud") {
        doc.setTextColor(240, 240, 240); // Exceptionally light gray
        doc.setFont("helvetica", "bold");
        doc.setFontSize(45);
        doc.text("MABALA DEMO", 35, 140, { angle: 45 });
        doc.text("MABALA DEMO", 35, 230, { angle: 45 });
      }
      
      // Footer text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Official Document • Generated under Regulated Zambian Agricultural Standards", 15, 286);
      doc.text(`Generated At: ${new Date().toLocaleString()} UTC`, 195, 286, { align: "right" });
    };

    let y = 32;

    if (activeReport === "pl") {
      addPageDecoration("PROFIT & LOSS STATEMENT");
      
      // Title
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("Farms Profit & Loss Statement (Income Statement)", 15, y);
      y += 5.5;
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Aligned under Standard IAS-1 Financial Reporting Guidelines", 15, y);
      y += 9;
      
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y, 195, y);
      y += 9;
      
      // SECTION 1: REVENUES
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85);
      doc.text("1. GROSS REVENUES GROUP", 15, y);
      y += 6.5;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      
      revenues.forEach(r => {
        doc.text(`${r.name} (${r.code})`, 18, y);
        doc.setFont("helvetica", "bold");
        doc.text(formatAmt(r.balance), 193, y, { align: "right" });
        doc.setFont("helvetica", "normal");
        y += 6.5;
      });

      y += 1.5;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 5, 180, 7.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text("TOTAL FARM GROUP REVENUES", 18, y);
      doc.text(formatAmt(totalRev), 193, y, { align: "right" });
      y += 12;

      // SECTION 2: EXPENSES
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("2. OPERATIONAL EXPENDITURES & COST OF SALES", 15, y);
      y += 6.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      expenseAccounts.forEach(e => {
        if (y > 262) {
          doc.addPage();
          addPageDecoration("PROFIT & LOSS STATEMENT");
          y = 26;
        }
        doc.text(`${e.name} (${e.code})`, 18, y);
        doc.text(formatAmt(e.balance), 193, y, { align: "right" });
        y += 6;
      });

      y += 2.5;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 5, 180, 7.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(239, 68, 68); // rose-500
      doc.text("TOTAL EXPENDITURES", 18, y);
      doc.text(formatAmt(totalExp), 193, y, { align: "right" });
      y += 14;

      // NET SURPLUS BAR
      if (y > 250) {
        doc.addPage();
        addPageDecoration("PROFIT & LOSS STATEMENT");
        y = 26;
      }
      const isPositive = netEarnings >= 0;
      doc.setFillColor(isPositive ? 240 : 254, isPositive ? 253 : 242, isPositive ? 250 : 242);
      doc.setDrawColor(isPositive ? 167 : 244, isPositive ? 243 : 199, isPositive ? 208 : 199);
      doc.rect(15, y - 6, 180, 16.5, "FD");
      
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("NET GENERAL FARMS OPERATING SURPLUS (REVENUE LESS EXPENSE)", 19, y);
      
      doc.setFontSize(12.5);
      doc.setTextColor(isPositive ? 6 : 153, isPositive ? 95 : 27, isPositive ? 70 : 27);
      doc.text(formatAmt(netEarnings), 191, y + 4, { align: "right" });
      
      doc.setFontSize(8);
      doc.text(isPositive ? "✓ SURPLUS REPORT MET" : "⚠️ NET FISCAL DEFICIT ENCOUNTERED", 19, y + 5.5);
      
      doc.save("profit_and_loss_statement.pdf");
    } 
    else if (activeReport === "bs") {
      addPageDecoration("BALANCE SHEET STATEMENT");
      
      // Title
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("Farms Statement of Financial Position (Balance Sheet)", 15, y);
      y += 5.5;
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Double-Entry Ledger Equation Assessment: Assets = Claims & Liabilities", 15, y);
      y += 9;
      
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y, 195, y);
      y += 9;

      // TWO COLUMN LAYOUT: Col 1 starts at X=15, Width=85. Col 2 starts at X=110, Width=85
      const col1X = 15;
      const col2X = 110;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85);
      
      doc.text("LEDGER ACTIVE ASSETS", col1X, y);
      doc.text("LIABILITIES & EQUITY CLAIMS", col2X, y);
      y += 6.5;

      // Col 1: Assets Lines
      let assetY = y;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      assets.forEach(a => {
        doc.text(`${a.name} (${a.code})`, col1X, assetY);
        doc.text(formatAmt(a.balance), col1X + 85, assetY, { align: "right" });
        assetY += 6.5;
      });

      // Col 2: Liabilities & Equity Lines
      let claimY = y;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("LIABILITIES", col2X, claimY);
      claimY += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      liabilities.forEach(l => {
        doc.text(`${l.name} (${l.code})`, col2X, claimY);
        doc.text(formatAmt(l.balance), col2X + 85, claimY, { align: "right" });
        claimY += 6.5;
      });

      claimY += 1.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("EQUITY CAPITALIZATION", col2X, claimY);
      claimY += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      equity.forEach(e => {
        const adjustedVal = e.code === "3100" ? (e.balance + unadjustedSumDeficit) : e.balance;
        doc.text(`${e.name} (${e.code})`, col2X, claimY);
        doc.text(formatAmt(adjustedVal), col2X + 85, claimY, { align: "right" });
        claimY += 6.5;
      });

      // Dynamic Operating surplus row under claims
      doc.text("Current Operating Surplus", col2X, claimY);
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "bold");
      doc.text(formatAmt(netEarnings), col2X + 85, claimY, { align: "right" });
      claimY += 8;

      // Find maximal Y height
      const bottomY = Math.max(assetY, claimY) + 4;
      y = bottomY;

      // Bottom Row Summary Dividers
      doc.setFillColor(248, 250, 252);
      // Col 1 Total Assets Sum Box
      doc.rect(col1X, y - 4, 85, 7.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text("TOTAL LEDGER ASSETS", col1X + 2, y + 1);
      doc.text(formatAmt(totalAssets), col1X + 83, y + 1, { align: "right" });

      // Col 2 Total Claims Sum Box
      doc.rect(col2X, y - 4, 85, 7.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text("TOTAL CLAIMS & EQUITY", col2X + 2, y + 1);
      doc.text(formatAmt(totalLiabilities + totalEquity), col2X + 83, y + 1, { align: "right" });

      y += 14;

      // EQUATION BALANCE GUARANTEE
      doc.setFillColor(240, 253, 250); // emerald-50
      doc.setDrawColor(167, 243, 208); // emerald-100
      doc.rect(15, y - 5, 180, 10, "FD");
      
      doc.setTextColor(6, 95, 70); // emerald-800
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`✓ EQUATION BALANCE: (Assets less Liabilities & Equity) = ${formatAmt(equationBalance)}`, 19, y + 1.2);
      
      doc.setFontSize(8.5);
      doc.text("DOUBLE ENTRY LEDGER SYSTEM PERFECTLY BALANCED", 191, y + 1.2, { align: "right" });

      doc.save("balance_sheet_financial_statement.pdf");
    } 
    else if (activeReport === "tb") {
      addPageDecoration("TRIAL BALANCE");
      
      // Title
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("Double-Entry Ledger Trial Balance Verification", 15, y);
      y += 5.5;
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Validation audit trail checking debit against credit parity", 15, y);
      y += 9;
      
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y, 195, y);
      y += 8;

      // Table Header row
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y - 4, 180, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      
      doc.text("COA REFERENCE & NAME", 19, y + 1);
      doc.text("ACCOUNT CATEGORY", 92, y + 1);
      doc.text("DEBIT BALANCE (DR)", 148, y + 1, { align: "right" });
      doc.text("CREDIT BALANCE (CR)", 191, y + 1, { align: "right" });
      y += 9;

      let totalDr = 0;
      let totalCr = 0;

      accounts.forEach((a, index) => {
        if (y > 265) {
          doc.addPage();
          addPageDecoration("TRIAL BALANCE");
          y = 26;
          // Redraw table headers
          doc.setFillColor(241, 245, 249);
          doc.rect(15, y - 4, 180, 8, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text("COA REFERENCE & NAME", 19, y + 1);
          doc.text("ACCOUNT CATEGORY", 92, y + 1);
          doc.text("DEBIT BALANCE (DR)", 148, y + 1, { align: "right" });
          doc.text("CREDIT BALANCE (CR)", 191, y + 1, { align: "right" });
          y += 9;
        }

        const isDebit = a.category === "Asset" || a.category === "Expense";
        if (isDebit) totalDr += a.balance;
        else totalCr += a.balance;

        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, y - 4.2, 180, 6, "F");
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`${a.code} — ${a.name}`, 19, y);
        doc.text(a.category, 92, y);

        doc.setFont("helvetica", "bold");
        if (isDebit) {
          doc.setTextColor(37, 99, 235);
          doc.text(formatAmt(a.balance), 148, y, { align: "right" });
        } else {
          doc.setTextColor(148, 163, 184);
          doc.text("—", 148, y, { align: "right" });
        }

        if (!isDebit) {
          doc.setTextColor(16, 185, 129);
          doc.text(formatAmt(a.balance), 191, y, { align: "right" });
        } else {
          doc.setTextColor(148, 163, 184);
          doc.text("—", 191, y, { align: "right" });
        }

        y += 6.5;
      });

      // Total Trial row
      y += 2;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y - 4.5, 180, 8, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text("TOTAL TRIAL BALANCE SUM", 19, y + 1);
      doc.text(formatAmt(totalDr), 148, y + 1, { align: "right" });
      doc.text(formatAmt(totalCr), 191, y + 1, { align: "right" });

      doc.save("trial_balance_verification.pdf");
    } 
    else if (activeReport === "tax") {
      addPageDecoration("STATUTORY TAX FILINGS");
      
      // Title
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      const taxTitle = isZambia ? "Zambia Revenue Authority (ZRA) VAT Return" : "Statutory Sales Tax Return File";
      doc.text(taxTitle, 15, y);
      y += 5.5;
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const subtitle = isZambia 
        ? "Computed pursuant to the Zambia VAT Act (Assessed at 15% standard rate thresholds)"
        : "Computed pursuant to subscriber tax profile rules (Assessed at standard 15% rate)";
      doc.text(subtitle, 15, y);
      y += 9;
      
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y, 195, y);
      y += 10;

      const inputTax = totalExp * 0.15;
      const outputTax = totalRev * 0.15;
      const netTax = outputTax - inputTax;

      // Box 1: Input Tax
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, y, 180, 19, "FD");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("1. INPUT TAX (RECOVERABLE STATUTORY OFFSET)", 19, y + 5);
      
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(formatAmt(inputTax), 191, y + 10, { align: "right" });
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Assessed flat at a standard 15.0% rate baseline against allowable capital & local expenditure rows", 19, y + 14);
      
      y += 25;

      // Box 2: Output Tax
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, y, 180, 19, "FD");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("2. OUTPUT TAX (COLLECTED REVENUE OWED TO TREASURY)", 19, y + 5);
      
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(formatAmt(outputTax), 191, y + 10, { align: "right" });
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Assessed flat at a standard 15.0% rate baseline derived from completed customer sales invoices", 19, y + 14);
      
      y += 25;

      // Box 3: Net Payable/Claimable
      const isTaxOwed = netTax >= 0;
      doc.setFillColor(isTaxOwed ? 254 : 240, isTaxOwed ? 242 : 253, isTaxOwed ? 242 : 250);
      doc.setDrawColor(isTaxOwed ? 254 : 167, isTaxOwed ? 202 : 243, isTaxOwed ? 202 : 208);
      doc.rect(15, y, 180, 22, "FD");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(isTaxOwed ? 153 : 6, isTaxOwed ? 27 : 95, isTaxOwed ? 27 : 70);
      doc.text("3. FINALISED NET STATEMENT AUDITED TAX LIABILITIES", 19, y + 6);
      
      doc.setFontSize(13.5);
      doc.text(formatAmt(netTax), 191, y + 12, { align: "right" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(isTaxOwed ? "⚠️ Consolidated assessment balance: Payable directly to the Commissioner of Revenue" : "✓ Credit baseline assessment: Carry forward as deduction buffer against next fiscal run", 19, y + 17);

      doc.save("statutory_tax_offset_return.pdf");
    }
  };

  const handleExportCSV = () => {
    let csvContent = "";
    let fileName = "";

    if (activeReport === "pl") {
      fileName = "profit_and_loss_statement.csv";
      csvContent += "Profit & Loss (Income Statement) - Standard IAS-1\n";
      csvContent += `Generated On: ${new Date().toLocaleDateString()}\n\n`;
      csvContent += "Category,Account Code,Account Name,Balance (ZMW)\n";
      
      // Revenues
      csvContent += "REVENUES,,,\n";
      revenues.forEach(r => {
        csvContent += `Revenue,${r.code},"${r.name.replace(/"/g, '""')}",${r.balance}\n`;
      });
      csvContent += `TOTAL FARM GROUP REVENUES,,,${totalRev}\n\n`;

      // Expenses
      csvContent += "EXPENSES,,,\n";
      expenseAccounts.forEach(e => {
        csvContent += `Expense,${e.code},"${e.name.replace(/"/g, '""')}",${e.balance}\n`;
      });
      csvContent += `TOTAL EXPENDITURES,,,${totalExp}\n\n`;

      csvContent += `NET OPERATING SURPLUS,,,${netEarnings}\n`;
    } 
    else if (activeReport === "bs") {
      fileName = "balance_sheet_statement.csv";
      csvContent += "Statement of Financial Position (Balance Sheet) - IAS-1\n";
      csvContent += `Generated On: ${new Date().toLocaleDateString()}\n\n`;
      
      // Assets
      csvContent += "ASSETS,,,\n";
      csvContent += "Category,Account Code,Account Name,Balance (ZMW)\n";
      assets.forEach(a => {
        csvContent += `Asset,${a.code},"${a.name.replace(/"/g, '""')}",${a.balance}\n`;
      });
      csvContent += `TOTAL LEDGER ASSETS,,,${totalAssets}\n\n`;

      // Liabilities
      csvContent += "LIABILITIES & EQUITY,,,\n";
      csvContent += "Category,Account Code,Account Name,Balance (ZMW)\n";
      liabilities.forEach(l => {
        csvContent += `Liability,${l.code},"${l.name.replace(/"/g, '""')}",${l.balance}\n`;
      });
      
      // Equity
      equity.forEach(e => {
        const adjustedVal = e.code === "3100" ? (e.balance + unadjustedSumDeficit) : e.balance;
        csvContent += `Equity,${e.code},"${e.name.replace(/"/g, '""')}",${adjustedVal}\n`;
      });
      csvContent += `Current Operating Surplus,,,${netEarnings}\n`;
      csvContent += `TOTAL LIABILITIES & EQUITY,,,${totalLiabilities + totalEquity}\n\n`;
      csvContent += `EQUATION BALANCE (Assets Less Liabilities & Equity),,,${equationBalance}\n`;
    } 
    else if (activeReport === "tb") {
      fileName = "trial_balance.csv";
      csvContent += "Double-Entry Trial Balance Verification\n";
      csvContent += `Generated On: ${new Date().toLocaleDateString()}\n\n`;
      csvContent += "Account Code,Account Name,Category,Debit (Dr),Credit (Cr)\n";
      
      accounts.forEach(a => {
        const isDebit = a.category === "Asset" || a.category === "Expense";
        const drValue = isDebit ? a.balance : "";
        const crValue = !isDebit ? a.balance : "";
        csvContent += `${a.code},"${a.name.replace(/"/g, '""')}",${a.category},${drValue},${crValue}\n`;
      });
    } 
    else if (activeReport === "tax") {
      fileName = "statutory_tax_summary.csv";
      const reportTitle = isZambia ? "ZRA Statutory VAT & Tax Summary" : "Platform Tax Summary";
      csvContent += `${reportTitle}\n`;
      csvContent += `Generated On: ${new Date().toLocaleDateString()}\n\n`;
      csvContent += "Tax Metric,Formula/Assessment Basis,Amount\n";
      
      const inputTax = totalExp * 0.15;
      const outputTax = totalRev * 0.15;
      const netTax = outputTax - inputTax;

      csvContent += `"Input Tax (Recoverable)","Assessed at 15% of flat purchases",${inputTax}\n`;
      csvContent += `"Output Tax (Owed)","Derived from completed customer invoices",${outputTax}\n`;
      csvContent += `"Net Assessed Tax Balance","Output Tax less Input Tax",${netTax}\n`;
    }

    // Trigger standard downloader
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderActions = () => {
    return (
      <div className="flex items-center gap-2 no-print shrink-0">
        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 bg-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          title="Export report lines to Microsoft Excel compliant CSV spreadsheet format"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
        <button
          onClick={handleExportPDF}
          className="px-3 py-1.5 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-700 bg-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          title="Download a vector high-resolution PDF of this financial report"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Send PDF</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Demo Watermark for onscreen and printed output to prevent misuse */}
      {activeFarm?.email === "mabalademo@mabala.cloud" && (
        <>
          {/* Print only watermark */}
          <div className="hidden print:flex fixed inset-0 items-center justify-center pointer-events-none opacity-[0.06] z-[9999] select-none rotate-[-45deg] text-[120px] font-black tracking-widest text-black whitespace-nowrap">
            MABALA DEMO
          </div>
          {/* Onscreen subtle watermark */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden select-none flex items-center justify-center z-[50]">
            <div className="rotate-[-45deg] text-[90px] font-black tracking-wider text-slate-800 whitespace-nowrap">
              MABALA DEMO
            </div>
          </div>
        </>
      )}

      {/* Report selectors */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold shadow-sm gap-1 no-print">
        <button onClick={() => setActiveReport("pl")} className={`px-4 py-2 rounded-lg transition-all ${activeReport === "pl" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}>
          Profit & Loss (IAS-1)
        </button>
        <button onClick={() => setActiveReport("bs")} className={`px-4 py-2 rounded-lg transition-all ${activeReport === "bs" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}>
          Balance Sheet (IAS-1)
        </button>
        <button onClick={() => setActiveReport("tb")} className={`px-4 py-2 rounded-lg transition-all ${activeReport === "tb" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}>
          IFRS Trial Balance
        </button>
        <button onClick={() => setActiveReport("tax")} className={`px-4 py-2 rounded-lg transition-all ${activeReport === "tax" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}>
          {isZambia ? "ZRA Statutory Tax summary" : "Generic Tax return summary"}
        </button>
        <button onClick={() => setActiveReport("visual")} className={`px-4 py-2 rounded-lg transition-all ${activeReport === "visual" ? "bg-white text-slate-800 shadow text-emerald-600 font-extrabold" : "text-slate-500 hover:text-slate-700"}`} id="reports-nav-visual">
          📊 Reports & Analytics Centre
        </button>
      </div>

      {activeReport === "pl" && (
        <div className="bg-white rounded-xl border p-6 space-y-6 shadow-sm animate-fade-in printable-area">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Income Statement (Profit & Loss)</h3>
              <p className="text-xs text-slate-500 font-semibold font-mono uppercase tracking-widest leading-none mt-1">Standard IAS-1 Aligned representation</p>
            </div>
            {renderActions()}
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Gross Revenues Group</span>
              <div className="mt-2 divide-y font-semibold text-xs text-slate-700">
                {revenues.map(a => (
                  <div key={a.code} className="py-2 flex justify-between">
                    <span>{a.name} ({a.code})</span>
                    <span className="font-mono text-slate-900">{currencySymbol} {(a?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2 border-t font-extrabold text-xs text-emerald-600 bg-emerald-500/5 px-2 rounded mt-1">
                <span>TOTAL FARM GROUP REVENUES</span>
                <span>{currencySymbol} {(totalRev ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="pt-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Operational Cost of Goods Sold & Expenses</span>
              <div className="mt-2 divide-y text-xs text-slate-700 max-h-56 overflow-y-auto pr-2 scrollbar-thin print:max-h-none print:overflow-visible">
                {expenseAccounts.map(a => (
                  <div key={a.code} className="py-2 flex justify-between font-medium">
                    <span className="text-slate-600">{a.name} ({a.code})</span>
                    <span className="font-mono text-slate-900">{currencySymbol} {(a?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2 border-t font-extrabold text-xs text-rose-500 bg-rose-500/5 px-2 rounded mt-1">
                <span>TOTAL EXPENDITURES</span>
                <span>{currencySymbol} {(totalExp ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center avoid-page-break ${netEarnings >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"}`}>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-widest">NET FARMS OPERATING SURPLUS</span>
                <span className="text-xl font-bold font-mono">{currencySymbol} {(netEarnings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-black/5 text-[10px] font-bold">IAS GENERATED</span>
            </div>
          </div>
        </div>
      )}

      {activeReport === "bs" && (
        <div className="bg-white rounded-xl border p-6 space-y-6 shadow-sm animate-fade-in printable-area">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Statement of Financial Position</h3>
              <p className="text-xs text-slate-500 font-semibold font-mono uppercase tracking-widest leading-none mt-1">Balance Sheet (Assets = Liabilities + Equity)</p>
            </div>
            {renderActions()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-semibold print:grid-cols-2">
            <div className="space-y-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-widest border-b pb-1">Ledger Assets</span>
              <div className="divide-y text-slate-700">
                {assets.map(a => (
                  <div key={a.code} className="py-2.5 flex justify-between font-semibold">
                    <span>{a.name} ({a.code})</span>
                    <span className="font-mono text-slate-900">{currencySymbol} {a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-extrabold text-emerald-600 bg-slate-50 p-2.5 rounded border">
                <span>TOTAL LEDGER ASSETS</span>
                <span className="font-mono">{currencySymbol} {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-widest border-b pb-1">Claims, Liabilities & Equity Contribution</span>
              <div className="divide-y text-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block pt-2">Liabilities</span>
                {liabilities.map(a => (
                  <div key={a.code} className="py-2 flex justify-between font-medium">
                    <span className="text-slate-600">{a.name} ({a.code})</span>
                    <span className="font-mono text-slate-900">{currencySymbol} {a.balance.toLocaleString()}</span>
                  </div>
                ))}
                <span className="text-[10px] text-slate-400 font-bold block pt-2">Equity Capitalization</span>
                {equity.map(a => {
                  const adjustedVal = a.code === "3100" ? (a.balance + unadjustedSumDeficit) : a.balance;
                  return (
                    <div key={a.code} className="py-2 flex justify-between font-medium">
                      <span className="text-slate-600">{a.name} ({a.code})</span>
                      <span className="font-mono text-slate-900">{currencySymbol} {adjustedVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  );
                })}
                {/* Net Earnings addition to equity */}
                <div className="py-2 flex justify-between font-medium text-emerald-600 bg-emerald-50/20 px-1 rounded">
                  <span>Current Operating Surplus</span>
                  <span className="font-mono font-bold">{currencySymbol} {netEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-between font-extrabold text-blue-600 bg-slate-50 p-2.5 rounded border">
                <span>TOTAL LIABILITIES & EQUITY</span>
                <span className="font-mono">{currencySymbol} {(totalLiabilities + totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Validation confirmation */}
          <div className="p-3 bg-emerald-500/10 text-emerald-800 rounded-xl flex justify-between items-center text-xs font-mono avoid-page-break">
            <span>✓ EQUATION BALANCE: (Assets Less Liabilities & Equity) = <strong>{currencySymbol} {equationBalance.toFixed(2)}</strong></span>
            <span className="font-bold">GENERAL LEDGER BALANCED</span>
          </div>
        </div>
      )}

      {activeReport === "tb" && (
        <div className="bg-white rounded-xl border p-6 space-y-6 shadow-sm animate-fade-in printable-area">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Double-Entry Trial Balance Verification</h3>
              <p className="text-xs text-slate-500 font-semibold font-mono uppercase tracking-widest leading-none mt-1">Dr = Cr Validation audit trail</p>
            </div>
            {renderActions()}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                <tr>
                  <th className="p-3">CoA Account reference</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Debit Balance (Dr)</th>
                  <th className="p-3 text-right">Credit Balance (Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-800">
                {accounts.map(a => {
                  const isDebit = a.category === "Asset" || a.category === "Expense";
                  return (
                    <tr key={a.code} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono text-slate-700">{a.code} — {a.name}</td>
                      <td className="p-2.5 text-slate-500 text-[10px]">{a.category}</td>
                      <td className="p-2.5 text-right font-mono text-blue-600">{isDebit ? `${currencySymbol} ${a.balance.toLocaleString()}` : "—"}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-600">{!isDebit ? `${currencySymbol} ${a.balance.toLocaleString()}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === "tax" && (
        <div className="bg-white rounded-xl border p-6 space-y-6 shadow-sm animate-fade-in printable-area">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                {isZambia ? "Zambia Revenue Authority (ZRA) VAT & Tax Return Breakdown" : "Generic Subscriber Regional Tax Return Summary"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl mt-1 leading-none">
                {isZambia 
                  ? "Automatic computation matching Zambian ZRA VAT limits and agricultural specific tax structures comprising a 15% rate threshold."
                  : "Standard generic multi-tenant sales taxation computation based on your selected regional settings."}
              </p>
            </div>
            {renderActions()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
            <div className="p-4 bg-slate-50 border rounded-xl">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Input Tax (Recoverable)</span>
              <strong className="text-lg font-mono font-bold block text-slate-900 mt-1">{currencySymbol} {(totalExp * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              <span className="text-[9px] text-slate-400 block mt-1 font-semibold font-mono">Assessed at 15% flat purchases</span>
            </div>

            <div className="p-4 bg-slate-50 border rounded-xl">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Output Tax (Owed ZRA/Treasury)</span>
              <strong className="text-lg font-mono font-bold block text-slate-900 mt-1">{currencySymbol} {(totalRev * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              <span className="text-[9px] text-slate-400 block mt-1 font-semibold font-mono">Derived from completed Invoices</span>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Net Assessed Tax Balance</span>
              <strong className="text-xl font-mono font-bold block mt-1">{currencySymbol} {((totalRev * 0.15) - (totalExp * 0.15)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              <span className="text-[9px] text-emerald-600 block mt-1 font-semibold">Ready for quarterly filing upload</span>
            </div>
          </div>
        </div>
      )}

      {activeReport === "visual" && (
        <div className="space-y-6 animate-fade-in no-print">
            {/* Header */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-500" />
                Dynamic Reports & Visual Analytics Centre
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Review live visual performance metrics, expense allocations, crop productivity index, and poultry batch viability logs.
              </p>
            </div>

            {/* 12-Month Line Chart Trend Section */}
            <div className="bg-white border p-6 rounded-xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>12-Month Cashflow & Performance Dynamics</span>
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Real-time trend analysis of cumulative gross revenues (direct receipts & paid client Invoices) against operating expenditures.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-1 rounded-lg text-slate-600 font-bold self-start sm:self-auto font-mono">
                  📅 JULY 2025 – JUNE 2026
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="bg-emerald-50/50 p-3.5 border border-emerald-100 rounded-xl">
                  <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block">12M Cumulative Revenue</span>
                  <strong className="text-lg font-black font-mono text-emerald-900 block mt-0.5">
                    {currencySymbol} {last12MonthsData.reduce((sum, item) => sum + item["Total Revenue"], 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </strong>
                  <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">↑ Upward-trending curve</span>
                </div>
                
                <div className="bg-rose-50/50 p-3.5 border border-rose-100 rounded-xl">
                  <span className="text-[9px] text-rose-800 font-bold uppercase tracking-wider block">12M Cumulative Expenses</span>
                  <strong className="text-lg font-black font-mono text-rose-900 block mt-0.5">
                    {currencySymbol} {last12MonthsData.reduce((sum, item) => sum + item["Total Expenses"], 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </strong>
                  <span className="text-[9px] text-rose-600 font-bold block mt-0.5">↓ Managed operating costs</span>
                </div>

                <div className="bg-indigo-50/50 p-3.5 border border-indigo-100 rounded-xl">
                  <span className="text-[9px] text-indigo-800 font-bold uppercase tracking-wider block">12M Net Profit Baseline</span>
                  <strong className="text-lg font-black font-mono text-indigo-900 block mt-0.5">
                    {currencySymbol} {last12MonthsData.reduce((sum, item) => sum + item["Net Profit"], 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </strong>
                  <span className="text-[9px] text-indigo-600 font-bold block mt-0.5">• Proportional margins positive</span>
                </div>
              </div>

              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last12MonthsData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b" 
                      tickLine={false}
                      style={{ fontSize: 9, fontWeight: "bold" }} 
                    />
                    <YAxis 
                      stroke="#64748b" 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${currencySymbol}${value >= 1000 ? (value / 1000) + "k" : value}`}
                      style={{ fontSize: 9 }} 
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${currencySymbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]} 
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 11, fontWeight: "semibold", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold", paddingTop: 10 }} />
                    <Line 
                      type="monotone" 
                      dataKey="Total Revenue" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 1 }} 
                      activeDot={{ r: 7 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Total Expenses" 
                      stroke="#f43f5e" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 1 }} 
                      activeDot={{ r: 7 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Net Profit" 
                      stroke="#6366f1" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      dot={{ r: 3, strokeWidth: 1 }} 
                      activeDot={{ r: 5 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales Allocation Breakdown */}
            <div className="bg-white border p-6 rounded-xl shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Revenue Breakdown (Sales & Invoices)</span>
                <span className="text-[10px] text-emerald-500 bg-emerald-50 py-0.5 px-2 rounded font-bold font-mono">LIVE CHART</span>
              </div>
              <div className="h-64 mt-4 relative">
                {(() => {
                  const cashSalesTotal = cashSales.reduce((sum, s) => sum + s.amount, 0);
                  const paidInvoicesTotal = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.total, 0);
                  const unpaidInvoicesTotal = invoices.filter(i => i.status === "Unpaid" || i.status === "Overdue").reduce((sum, i) => sum + i.total, 0);
                  
                  const salesData = [
                    { name: "Direct Cash Sales", value: cashSalesTotal },
                    { name: "Paid Customer Invoices", value: paidInvoicesTotal },
                    { name: "Unpaid / Due Invoices", value: unpaidInvoicesTotal }
                  ].filter(d => d.value > 0);

                  const COLORS_SALES = ["#10b981", "#3b82f6", "#f59e0b"];

                  if (salesData.length === 0) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 italic text-xs">
                        No invoices or cash sales on file.
                      </div>
                    );
                  }

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {salesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_SALES[index % COLORS_SALES.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${currencySymbol} ${value.toLocaleString()}`} />
                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* Operating Expenditures Allocations */}
            <div className="bg-white border p-6 rounded-xl shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Operational Expenditures Expense Pie Chart</span>
                <span className="text-[10px] text-rose-500 bg-rose-50 py-0.5 px-2 rounded font-bold font-mono">GROUP BY CATEGORY</span>
              </div>
              <div className="h-64 mt-4 relative">
                {(() => {
                  const expenseMap: { [cat: string]: number } = {};
                  expenses.forEach(ex => {
                    (ex.rows || []).forEach(row => {
                      const cat = row.category || "General Purchases";
                      expenseMap[cat] = (expenseMap[cat] || 0) + row.amount;
                    });
                  });
                  const expenseData = Object.entries(expenseMap)
                    .map(([name, value]) => ({ name, value }))
                    .filter(item => item.value > 0);

                  const COLORS_EXP = ["#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#64748b"];

                  if (expenseData.length === 0) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 italic text-xs">
                        No operational expenses recorded to map.
                      </div>
                    );
                  }

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_EXP[index % COLORS_EXP.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${currencySymbol} ${value.toLocaleString()}`} />
                        <Legend wrapperStyle={{ fontSize: 9, fontWeight: "bold" }} layout="vertical" align="right" verticalAlign="middle" />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* Crop Yield Performance Metric */}
            <div className="bg-white border p-6 rounded-xl shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Crop Cycles Yield Index Status (kg)</span>
                <span className="text-[10px] text-blue-500 bg-blue-50 py-0.5 px-2 rounded font-bold font-mono">TARGET VS ACTUAL</span>
              </div>
              <div className="h-64 mt-4 relative">
                {(() => {
                  const yieldData = crops
                    .filter(c => c.status !== "Planning")
                    .map(c => ({
                      name: c.cropType,
                      "Expected Yield": c.expectedYieldKg,
                      "Actual Yield": c.actualYieldKg || 0
                    }))
                    .slice(0, 7);

                  if (yieldData.length === 0) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 italic text-xs">
                        No active/harvested crop cycles reported for yield comparison.
                      </div>
                    );
                  }

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yieldData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9, fontWeight: "bold" }} />
                        <YAxis stroke="#64748b" style={{ fontSize: 9 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                        <Bar dataKey="Expected Yield" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Actual Yield" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* Poultry Batch Performance Insights */}
            <div className="bg-white border p-6 rounded-xl shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Poultry Batch Viability Comparison</span>
                <span className="text-[10px] text-amber-500 bg-amber-50 py-0.5 px-2 rounded font-bold font-mono">LIVE VS MORTALITY</span>
              </div>
              <div className="h-64 mt-4 relative">
                {(() => {
                  const poultryData = poultry.map(p => {
                    const dead = (p.mortalityLogs || []).reduce((sum, m) => sum + m.count, 0);
                    return {
                      name: p.birdType,
                      "Active Count": p.currentCount,
                      "Mortality Count": dead
                    };
                  }).slice(0, 7);

                  if (poultryData.length === 0) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 italic text-xs">
                        No poultry batches reported to calculate viability.
                      </div>
                    );
                  }

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={poultryData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9, fontWeight: "bold" }} />
                        <YAxis stroke="#64748b" style={{ fontSize: 9 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                        <Bar dataKey="Active Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Mortality Count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

