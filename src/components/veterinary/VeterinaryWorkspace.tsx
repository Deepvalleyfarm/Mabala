import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { 
  Heart, Users, Barcode, ClipboardList, Wallet, Sparkles, AlertCircle, TrendingUp, Info
} from "lucide-react";

import { 
  VetTenant, VetClient, VetStaff, VetAppointment, ClinicalRecord, MovementCard, 
  LabSample, VaccineCampaign, DiseaseOutbreak, MedicationInventory, VetWalletTx 
} from "./types";

import { 
  INITIAL_STAFF, INITIAL_CLIENTS, INITIAL_APPOINTMENTS, INITIAL_CLINICAL_RECORDS, 
  INITIAL_MOVEMENTS, INITIAL_LABS, INITIAL_CAMPAIGNS, INITIAL_OUTBREAKS, 
  INITIAL_MEDICATIONS, INITIAL_VET_TRANSACTIONS, CREDIT_BUNDLES, CreditBundle 
} from "./data";

import DashboardTab from "./DashboardTab";
import CrmTab from "./CrmTab";
import ClinicalTab from "./ClinicalTab";
import LabTab from "./LabTab";
import PharmacyTab from "./PharmacyTab";
import BillingTab from "./BillingTab";
import { useVeterinaryNotifications } from "./useVeterinaryNotifications";

interface VeterinaryWorkspaceProps {
  onAddAuditLog: (action: string, category: string, details: string) => void;
  currencySymbol?: string;
  onPostVeterinaryTransaction?: (
    eventType: "Consultation Record" | "Laboratory Test",
    amount: number,
    clientName: string,
    details: string
  ) => void;
  accounts?: any[];
}

export default function VeterinaryWorkspace({
  onAddAuditLog,
  currencySymbol = "K",
  onPostVeterinaryTransaction,
  accounts = []
}: VeterinaryWorkspaceProps) {
  
  // 1. Core State Managers
  const [activeTab, setActiveTab2] = useState<"dashboard" | "crm" | "clinical" | "lab" | "pharmacy" | "billing">("dashboard");
  const [credits, setCredits] = useState<number>(315);
  const [tenant, setTenant] = useState<VetTenant>({
    id: "vet-tenant-020042e7",
    orgName: "Southern Province Veterinary Center",
    type: "Veterinary Clinic",
    subscriptionPlan: "Monthly",
    subscriptionExpires: "2026-07-31",
    vatRegistered: true,
    tpnNumber: "TRN-9982L-ZMW"
  });

  const [clients, setClients] = useState<VetClient[]>(INITIAL_CLIENTS);
  const [appointments, setAppointments] = useState<VetAppointment[]>(INITIAL_APPOINTMENTS);
  const [records, setRecords] = useState<ClinicalRecord[]>(INITIAL_CLINICAL_RECORDS);
  const [movements, setMovements] = useState<MovementCard[]>(INITIAL_MOVEMENTS);
  const [samples, setSamples] = useState<LabSample[]>(INITIAL_LABS);
  const [campaigns, setCampaigns] = useState<VaccineCampaign[]>(INITIAL_CAMPAIGNS);
  const [outbreaks, setOutbreaks] = useState<DiseaseOutbreak[]>(INITIAL_OUTBREAKS);
  const [inventory, setInventory] = useState<MedicationInventory[]>(INITIAL_MEDICATIONS);
  const [transactions, setTransactions] = useState<VetWalletTx[]>(INITIAL_VET_TRANSACTIONS);

  // Status banners / system notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "warning" }>({ text: "", type: "success" });

  const showNotification = (text: string, type: "success" | "warning" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg({ text: "", type: "success" });
    }, 4500);
  };

  // Automated vaccination boosters & drug treatment withdrawal background monitor hook
  const {
    notifications,
    triggerInAppNotification,
    triggerWhatsAppNotification,
    acknowledgeAlert
  } = useVeterinaryNotifications(records, clients, showNotification);

  // 2. State Mutators & Credit Deduction Checks
  
  // CRM onboarding (costs 5 credits)
  const handleAddClient = (newClient: Omit<VetClient, "id" | "onboardedDate">): boolean => {
    if (credits < 5) {
      showNotification("Insufficient credits in tenant wallet!", "warning");
      return false;
    }

    const created: VetClient = {
      ...newClient,
      id: "cl-00" + (clients.length + 1),
      onboardedDate: new Date().toISOString().split("T")[0]
    };

    setClients([created, ...clients]);
    setCredits(prev => prev - 5);

    // Register transaction log
    const tx: VetWalletTx = {
      id: "vtx-" + Math.random().toString(36).slice(2, 9),
      date: new Date().toISOString().split("T")[0],
      type: "Credit Deduction",
      amountZmw: 0,
      creditsDelta: -5,
      description: `Onboarding Client profile: ${newClient.name} into district portfolio.`,
      status: "Success"
    };
    setTransactions([tx, ...transactions]);

    onAddAuditLog(
      "Client Registration",
      "Veterinary Module",
      `Onboarded farmer client ${newClient.name} using 5 credits`
    );

    showNotification("Client profile registered! 5 Credits deducted.");
    return true;
  };

  // Consultation records (costs 15 credits)
  const handleAddClinicalRecord = (ndata: Omit<ClinicalRecord, "id" | "date">): boolean => {
    if (credits < 15) {
      showNotification("Insufficient credits in wallet!", "warning");
      return false;
    }

    const created: ClinicalRecord = {
      ...ndata,
      id: "clin-0" + (records.length + 1),
      date: new Date().toISOString().split("T")[0]
    };

    setRecords([created, ...records]);
    setCredits(prev => prev - 15);

    const tx: VetWalletTx = {
      id: "vtx-" + Math.random().toString(36).slice(2, 9),
      date: new Date().toISOString().split("T")[0],
      type: "Credit Deduction",
      amountZmw: 0,
      creditsDelta: -15,
      description: `Clinical Consultation Log - Animal Tag ID: ${ndata.animalId}`,
      status: "Success"
    };
    setTransactions([tx, ...transactions]);

    // Automatically post service charge to Mabala Financial Ledger debiting/crediting coa codes
    if (onPostVeterinaryTransaction) {
      onPostVeterinaryTransaction(
        "Consultation Record",
        ndata.cost,
        ndata.clientName,
        `Diagnosis: ${ndata.diagnosis} for Tag ID ${ndata.animalId}`
      );
    }

    onAddAuditLog(
      "Clinical consultation logged",
      "Veterinary Clinic",
      `Recorded treatment for ear tag ID: ${ndata.animalId}`
    );

    showNotification("Consultation logged successfully! 15 Credits deducted.");
    return true;
  };

  // Movement permits (costs 20 credits)
  const handleAddMovementCard = (ndata: Omit<MovementCard, "id" | "permitNo" | "dateIssued" | "status">): boolean => {
    if (credits < 20) {
      showNotification("Insufficient credits in wallet!", "warning");
      return false;
    }

    const created: MovementCard = {
      ...ndata,
      id: "mov-0" + (movements.length + 1),
      permitNo: "ZAM-VET-2026-" + Math.floor(10000 + Math.random() * 90000),
      dateIssued: new Date().toISOString().split("T")[0],
      status: "Approved"
    };

    setMovements([created, ...movements]);
    setCredits(prev => prev - 20);

    const tx: VetWalletTx = {
      id: "vtx-" + Math.random().toString(36).slice(2, 9),
      date: new Date().toISOString().split("T")[0],
      type: "Credit Deduction",
      amountZmw: 0,
      creditsDelta: -20,
      description: `Issued QR Transit Movement permit ref: ${created.permitNo}`,
      status: "Success"
    };
    setTransactions([tx, ...transactions]);

    onAddAuditLog(
      "Movement Permit Issued",
      "Veterinary Module",
      `Approved cattle transit card ${created.permitNo}`
    );

    showNotification("Transit movements permit card approved! 20 Credits deducted.");
    return true;
  };

  // Lab approval outcomes (costs 10 credits)
  const handleApproveResults = (
    sampleId: string, 
    resultsNotes: string, 
    extraVals?: { parasiteLoad?: string; count?: string; milkGrade?: "A" | "B" | "C" | "D" }
  ): boolean => {
    if (credits < 10) {
      showNotification("Insufficient credits in wallet!", "warning");
      return false;
    }

    setSamples(prev => prev.map(s => {
      if (s.id === sampleId) {
        return {
          ...s,
          status: "Completed",
          testResultsNotes: resultsNotes,
          parasiteLoad: extraVals?.parasiteLoad,
          milkQualityGrade: extraVals?.milkGrade,
          approvedBy: "Kelvin Mwale"
        };
      }
      return s;
    }));

    setCredits(prev => prev - 10);

    const tx: VetWalletTx = {
      id: "vtx-" + Math.random().toString(36).slice(2, 9),
      date: new Date().toISOString().split("T")[0],
      type: "Credit Deduction",
      amountZmw: 0,
      creditsDelta: -10,
      description: `VLIS Diagnostics Verification & Approval for sample: ${sampleId}`,
      status: "Success"
    };
    setTransactions([tx, ...transactions]);

    // Retrieve active sample client to complete credit/debit transaction
    const targetSample = samples.find(s => s.id === sampleId);
    if (onPostVeterinaryTransaction && targetSample) {
      onPostVeterinaryTransaction(
        "Laboratory Test",
        485, // Lab analysis fee
        targetSample.clientName,
        `Approved lab diagnostics parasite status for sample: ${sampleId}`
      );
    }

    onAddAuditLog(
      "Lab Sample Approved",
      "Veterinary VLIS",
      `Approved findings for biological sample ${sampleId}`
    );

    showNotification("Laboratory diagnosis approved & published! 10 Credits spent.");
    return true;
  };

  // Pharmacy restocks
  const handleRestockItem = (itemId: string, qtyToAdd: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, qtyAvailable: item.qtyAvailable + qtyToAdd };
      }
      return item;
    }));
    showNotification(`Added ${qtyToAdd} items to dispensary stock cabinet.`);
  };

  // Marketplace procurements
  const handleProcureMarketplaceItem = (mitem: Omit<MedicationInventory, "id">) => {
    const created: MedicationInventory = {
      ...mitem,
      id: "med-0" + (inventory.length + 1)
    };

    setInventory([...inventory, created]);
    showNotification(`Procured ${created.name} directly into pharmacy cabinet!`);
  };

  // Purchasing credit bundles
  const handlePurchaseCredits = (bundle: CreditBundle, paymentMethod: VetWalletTx["paymentPlatform"]) => {
    const totCredits = bundle.credits + bundle.bonusCredits;
    setCredits(prev => prev + totCredits);

    const tx: VetWalletTx = {
      id: "vtx-" + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toISOString().split("T")[0],
      type: "Credit Purchase",
      amountZmw: bundle.priceZmw,
      creditsDelta: totCredits,
      description: `Purchased Credit Bundle: ${bundle.name} (${bundle.credits} Credits + ${bundle.bonusCredits} Bonus)`,
      paymentPlatform: paymentMethod,
      status: "Success"
    };
    setTransactions([tx, ...transactions]);

    onAddAuditLog(
      "Credit Wallet Top-up",
      "Veterinary Suite Billing",
      `Credited ${totCredits} credits using payment gateway channel ${paymentMethod}`
    );

    showNotification(`Simulated payment approved! Credited +${totCredits} credits into pool!`);
  };

  // Upgrading subscription tier
  const handleModifySubscriptionPlan = (newPlan: VetTenant["subscriptionPlan"]) => {
    setTenant(prev => ({ ...prev, subscriptionPlan: newPlan }));
    
    // Auto add budget journal credits
    let creditAdd = 0;
    let price = 0;
    if (newPlan === "Monthly") { creditAdd = 500; price = 1000; }
    else if (newPlan === "Annual") { creditAdd = 6000; price = 12000; }
    else if (newPlan === "Enterprise") { creditAdd = 15000; price = 25000; }

    if (creditAdd > 0) {
      setCredits(prev => prev + creditAdd);
      const tx: VetWalletTx = {
        id: "vtx-" + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toISOString().split("T")[0],
        type: "Subscription",
        amountZmw: price,
        creditsDelta: creditAdd,
        description: `Upgraded subscription tier to: ${newPlan} Pro Package`,
        status: "Success"
      };
      setTransactions([tx, ...transactions]);
    }

    onAddAuditLog(
      "Subscription Modified",
      "Veterinary ERP Billing",
      `Tenant upgraded commercial subscript to: ${newPlan} Tier`
    );

    showNotification(`Subscription plan updated to ${newPlan}! Double-entry matching complete.`);
  };

  // 3. Premium Certified PDF document generators

  // A. Animal Health Passport Printable PDF
  const handleDownloadPassport = (rec: ClinicalRecord) => {
    try {
      const doc = new jsPDF();
      
      // Theme Palette (Dark Navy & Warm Amber)
      doc.setFillColor(15, 23, 42); // slate-900 background header
      doc.rect(0, 0, 210, 50, "F");

      // Brand Title Header
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text("MABALA VETERINARY PORTFOLIO", 15, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Official Certified Animal Health & Bio-Security Passport Document", 15, 28);
      
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("District Authorization No: ZAM-MBL-V-SOL2", 15, 36);

      // Section: Case Identity Profile Info
      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("I. ANIMAL TRACKING IDENTITY PROFILE", 15, 65);

      doc.setDrawColor(226, 232, 240); // slate-200 line spacer
      doc.line(15, 69, 195, 69);

      // Bio Metrics Grid columns layout
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      
      doc.text("Live Ear Tag ID:", 15, 78);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(rec.animalId, 45, 78);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Biological Species:", 110, 78);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(rec.species, 145, 78);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Registered Farmer Name:", 15, 86);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(rec.clientName, 45, 86);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Biological Status Tag:", 110, 86);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(rec.status, 145, 86);

      // Section: Medical Diagnostics & Records
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("II. PATHOLOGICAL CLINICAL RECORD DETAILS", 15, 105);
      doc.line(15, 109, 195, 109);

      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Clinical Consultation Date:", 15, 118);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(rec.date, 60, 118);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Primary Diagnostic Findings:", 15, 126);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(71, 85, 105); // slate-600
      
      // Dynamic multiphase wrap text for findings
      const findingsLines = doc.splitTextToSize(rec.clinicalFindings, 175);
      doc.text(findingsLines, 15, 132);

      // Diagnosis and Treatment Steps
      let offset = 142 + (findingsLines.length * 4);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Assigned Medical Diagnosis:", 15, offset);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(185, 28, 28); // red border text
      doc.text(rec.diagnosis, 65, offset);

      offset += 8;
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Treatment Administered Procedure:", 15, offset);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(rec.treatmentPlanned || "N/A", 65, offset);

      // Prescriptions Disbursed
      offset += 12;
      doc.setFont("Helvetica", "bold");
      doc.text("III. DISPENSED MEDICATIONS & PRESCRIPTIONS", 15, offset);
      doc.line(15, offset + 3, 195, offset + 3);

      offset += 10;
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      if (rec.prescriptions && rec.prescriptions.length > 0) {
        rec.prescriptions.forEach((presc, idx) => {
          doc.text(`* ${presc}`, 18, offset + (idx * 6));
        });
        offset += (rec.prescriptions.length * 6);
      } else {
        doc.text("No prescriptions issued for this record.", 18, offset);
        offset += 6;
      }

      // Legal stamp and seal segment
      offset += 15;
      doc.setFillColor(248, 250, 252); // extremely soft slate
      doc.rect(15, offset, 180, 25, "F");
      
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("AUTHORIZING LICENSED VETERINARIAN SIGNATURE:", 20, offset + 8);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(rec.vetSignature || "Dr. Noah Mulenga", 20, offset + 15);

      doc.setTextColor(16, 185, 129); // emerald green
      doc.text("MABALA BIOLOGICAL SECURITY VERIFIED SECTOR", 125, offset + 15);

      doc.save(`Animal_Passport_${rec.animalId}.pdf`);
      showNotification("Official Bio Health Passport PDF compiled!");
    } catch (err: any) {
      console.error(err);
      showNotification("PDF compiling failed: " + err.message, "warning");
    }
  };

  // B. QR-Verifiable Transit Permit Printable PDF
  const handleDownloadPermitPdf = (mov: MovementCard) => {
    try {
      const doc = new jsPDF();
      
      doc.setFillColor(4, 120, 87); // emerald-700 green heading frame
      doc.rect(0, 0, 210, 45, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.text("REPUBLIC OF ZAMBIA - VETERINARY PERMIT", 15, 18);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Official Cattle & Live Animal Inter-District Siding Transit Movement Permit", 15, 26);
      
      doc.setFontSize(8);
      doc.setTextColor(209, 250, 229);
      doc.text(`Clearance Hash UUID: ${mov.healthClearanceUuid}`, 15, 33);

      // ID Header
      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Official Permit Card Ref: ${mov.permitNo}`, 15, 60);
      doc.line(15, 64, 195, 64);

      // Details grid
      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);

      doc.text("Total Head of Cattle Count:", 15, 73);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${mov.animalCount} Animals`, 55, 73);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Pathogenic Species Class:", 110, 73);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(mov.species, 150, 73);

      // Boundaries origin destinations
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Origin Physical Settelement:", 15, 83);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${mov.originFarm} [District: ${mov.originDistrict}]`, 55, 83);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Consignee Consignment Site:", 15, 93);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${mov.destinationFarm} [District: ${mov.destinationDistrict}]`, 55, 93);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Official Date Issued Clearance:", 15, 103);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(mov.dateIssued, 55, 103);

      // QR Verification Block simulator representer
      doc.setFillColor(243, 244, 246);
      doc.rect(40, 120, 130, 60, "F");

      // Draw a simulated barcode/matrix box representation 
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(1);
      doc.rect(45, 125, 25, 25);
      // Simulating bits lines inside QR
      doc.line(48, 128, 62, 128);
      doc.line(48, 134, 55, 134);
      doc.line(55, 140, 65, 140);
      doc.line(62, 130, 62, 145);

      doc.setTextColor(51, 65, 85);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("VERIFIED HEALTH STATUS SCAN TAG", 78, 134);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Licensed vets must verify this QR transit sticker", 78, 140);
      doc.text("during highway checkpoint inspections.", 78, 144);

      // Footer
      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text("AUTHORIZED APPROVED STAMP - DEPT OF LIVESTOCK DEVELOPMENT", 15, 200);

      doc.save(`Transit_Permit_${mov.permitNo}.pdf`);
      showNotification("Approved Transit Movement Card compiled as PDF!");
    } catch (err: any) {
      console.error(err);
      showNotification("Permit PDF compiling failed.", "warning");
    }
  };

  // C. Payment Billing receipt PDF
  const handleDownloadBillingReceipt = (tx: VetWalletTx) => {
    try {
      const doc = new jsPDF();
      
      doc.setFillColor(30, 27, 75); // deep slate/blue bg header
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("MABALA CORE BILLING LEDGER", 15, 18);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Zambia National Revenue and Platform Credit Wallet Statement Receipt", 15, 25);

      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Official Receipt Statement: ${tx.id.toUpperCase()}`, 15, 55);
      doc.line(15, 59, 195, 59);

      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);

      doc.text("Statement Date:", 15, 68);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(tx.date, 55, 68);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Transaction Classification:", 15, 78);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(tx.type, 55, 78);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Transaction Memo Details:", 15, 88);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(tx.description, 55, 88);

      if (tx.paymentPlatform) {
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Payment Platform Sync Channel:", 15, 98);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(tx.paymentPlatform, 55, 98);
      }

      // Financial allocation boxes
      doc.setFillColor(249, 250, 251);
      doc.rect(15, 112, 180, 22, "F");
      doc.setDrawColor(229, 231, 235);
      doc.rect(15, 112, 180, 22);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Paid Amount (ZMW):", 20, 125);
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129); // green
      doc.text(`${currencySymbol}${tx.amountZmw.toLocaleString()}.00 ZMW`, 70, 125);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Credits Credited: +${tx.creditsDelta} Credits`, 130, 125);

      // Audit notes Double entry complete
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("This transaction has cleared all security validation checks and been posted automatically to the Chart of Accounts.", 15, 160);

      doc.save(`Receipt_Mabala_${tx.id}.pdf`);
      showNotification("Financial Transaction receipt ledger PDF compiled!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16 font-sans">
      
      {/* Dynamic Toast Status Feed Notification Banner */}
      {toastMsg.text && (
        <div className="fixed top-5 right-5 z-55 max-w-sm w-full animate-in slide-in-from-top-4 duration-200">
          <div className={`p-4 rounded-xl border-2 flex items-start gap-3 shadow-lg ${
            toastMsg.type === "warning" ? "bg-rose-50 border-rose-300 text-rose-800" : "bg-emerald-50 border-emerald-300 text-emerald-800"
          }`}>
            <AlertCircle className={`w-5 h-5 shrink-0 ${toastMsg.type === "warning" ? "text-rose-500" : "text-emerald-500"}`} />
            <div>
              <p className="text-xs font-bold">{toastMsg.type === "warning" ? "Biological Security Trigger" : "System Notification Approved"}</p>
              <p className="text-[11px] font-sans font-medium pt-0.5">{toastMsg.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Internal Ribbon Control Hub */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Module Sub header navigation bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8">
          
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl flex-wrap">
            <button 
              onClick={() => setActiveTab2("dashboard")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer flex items-center gap-1.5 ${
                activeTab === "dashboard" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Heart className="w-4 h-4 text-emerald-500" /> Command Hub
            </button>

            <button 
              onClick={() => setActiveTab2("crm")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer flex items-center gap-1.5 ${
                activeTab === "crm" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users className="w-4 h-4 text-emerald-500" /> Farmer CRM Profiles
            </button>

            <button 
              onClick={() => setActiveTab2("clinical")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer flex items-center gap-1.5 ${
                activeTab === "clinical" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-800"
              }`}
            >
              <ClipboardList className="w-4 h-4 text-emerald-500" /> Clinical & Permits
            </button>

            <button 
              onClick={() => setActiveTab2("lab")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer flex items-center gap-1.5 ${
                activeTab === "lab" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Barcode className="w-4 h-4 text-emerald-500" /> Labs VLIS Specimen
            </button>

            <button 
              onClick={() => setActiveTab2("pharmacy")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer flex items-center gap-1.5 ${
                activeTab === "pharmacy" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Heart className="w-4 h-4 text-emerald-500" /> Cabinet Pharmacy
            </button>

            <button 
              onClick={() => setActiveTab2("billing")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer flex items-center gap-1.5 ${
                activeTab === "billing" ? "bg-white text-indigo-700 shadow-sm font-extrabold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Wallet className="w-4 h-4 text-indigo-500" /> Billing & COA Logs
            </button>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-1">
              🟢 Node: {tenant.orgName}
            </span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold">
              Sub: {tenant.subscriptionPlan} Plan
            </span>
          </div>

        </div>

        {/* 4. CHANNELS TAB RENDERS SCREEN ROUTERS */}
        <div>
          {activeTab === "dashboard" && (
            <DashboardTab 
              clients={clients}
              appointments={appointments}
              outbreaks={outbreaks}
              credits={credits}
              subscriptionPlan={tenant.subscriptionPlan}
              transactions={transactions}
              onTriggerModal={(mType) => {
                if (mType === "subscribe" || mType === "recharge") {
                  setActiveTab2("billing");
                }
              }}
              currencySymbol={currencySymbol}
              notifications={notifications}
              onTriggerInApp={triggerInAppNotification}
              onTriggerWhatsApp={triggerWhatsAppNotification}
              onAcknowledgeAlert={acknowledgeAlert}
              onAddAppointment={(newApt) => {
                setAppointments(prev => [
                  { 
                    id: "apt-" + Math.floor(1000 + Math.random() * 9000), 
                    clientName: newApt.clientName,
                    animalId: newApt.animalId,
                    type: newApt.type,
                    date: newApt.date,
                    time: newApt.time,
                    status: "Pending",
                    notes: newApt.notes
                  }, 
                  ...prev
                ]);
                showNotification("Clinical appointment scheduled!");
              }}
              onUpdateAppointment={(id, updates) => {
                setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
                showNotification("Appointment details updated!");
              }}
            />
          )}

          {activeTab === "crm" && (
            <CrmTab 
              clients={clients}
              onAddClient={handleAddClient}
              credits={credits}
            />
          )}

          {activeTab === "clinical" && (
            <ClinicalTab 
              records={records}
              movements={movements}
              campaigns={campaigns}
              credits={credits}
              onAddClinicalRecord={handleAddClinicalRecord}
              onAddMovementCard={handleAddMovementCard}
              onDownloadPassport={handleDownloadPassport}
              onDownloadPermitPdf={handleDownloadPermitPdf}
              currencySymbol={currencySymbol}
            />
          )}

          {activeTab === "lab" && (
            <LabTab 
              samples={samples}
              credits={credits}
              onApproveResults={handleApproveResults}
            />
          )}

          {activeTab === "pharmacy" && (
            <PharmacyTab 
              inventory={inventory}
              onRestockItem={handleRestockItem}
              onProcureMarketplaceItem={handleProcureMarketplaceItem}
              currencySymbol={currencySymbol}
            />
          )}

          {activeTab === "billing" && (
            <BillingTab 
              tenant={tenant}
              transactions={transactions}
              credits={credits}
              onPurchaseCredits={handlePurchaseCredits}
              onModifySubscriptionPlan={handleModifySubscriptionPlan}
              onDownloadBillingReceipt={handleDownloadBillingReceipt}
              currencySymbol={currencySymbol}
            />
          )}
        </div>

      </div>

    </div>
  );
}
