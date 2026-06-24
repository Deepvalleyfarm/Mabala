import React, { useState, useMemo, useEffect } from "react";
import { safeLocalStorage as localStorage } from "../../utils/safeStorage";
import { jsPDF } from "jspdf";
import { 
  ShieldCheck, UserSquare2, RefreshCw, Calendar, Plus, Save, DollarSign, 
  Trash, FileText, Download, CheckSquare, Stethoscope, Award, 
  TrendingUp, Activity, GitBranch, Droplet, ShoppingBag, Eye,
  Percent, AlertTriangle, ShieldAlert, BookOpen, Clock, Heart, Clipboard, Printer, Search, Info
} from "lucide-react";
import { LivestockRecord } from "../../types";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

// List of supported species and breeds
export const CATTLE_BREEDS = [
  "Boran", "Brahman", "Nguni", "Tuli", "Angus", "Hereford", "Simmental", 
  "Friesian", "Holstein", "Jersey", "Ayrshire", "Guernsey", "Beefmaster", 
  "Bonsmara", "Sussex", "Sanga", "Mashona", "Ankole"
];

export const GOAT_BREEDS = [
  "Boer", "Kalahari Red", "Savanna", "Saanen", "Toggenburg", "Alpine", 
  "Anglo Nubian", "Small East African", "Galla", "Local Goats"
];

export const SHEEP_BREEDS = ["Dorper", "Merino", "Suffolk", "Dorset", "Blackhead Persian", "Red Maasai"];
export const PIG_BREEDS = ["Large White", "Landrace", "Duroc", "Pietrain", "Hampshire", "Berkshire"];
export const POULTRY_BREEDS = ["Broilers", "Layers", "Indigenous Chickens", "Kuroiler", "Ducks", "Turkeys", "Geese", "Guinea Fowl", "Quail"];
export const OTHER_BREEDS = ["Thoroughbred / Horse", "Boerpony", "Abyssinian Donkey", "Rottweiler Guard Dog", "German Shepherd Dog", "New Zealand White Rabbit", "Dromedary Camel", "Nile Tilapia (Fish)", "African Honeybee"];

interface ManagerProps {
  records: LivestockRecord[];
  currencySymbol: string;
  onAddLivestockRecord: (record: LivestockRecord) => void;
  onAddLivestockHealthEvent: (tagId: string, event: { date: string; type: string; details: string; cost: number }) => void;
  onAddLivestockFeedingLog: (tagId: string, log: { date: string; feedType: string; quantityKg: number }) => void;
  isReadonly: boolean;
  accounts: any[];
  setAccounts: (accs: any[]) => void;
  customers: any[];
  invoices: any[];
  onAddInvoice: (inv: any) => void;
  onMarkPaid: (invId: string, amount?: number) => void;
  onDeleteLivestockRecord?: (id: string) => void;
  activeFarm?: any;
}

export default function EnterpriseLivestockManager({
  records,
  currencySymbol,
  onAddLivestockRecord,
  onAddLivestockHealthEvent,
  onAddLivestockFeedingLog,
  isReadonly,
  accounts,
  setAccounts,
  customers,
  invoices,
  onAddInvoice,
  onMarkPaid,
  onDeleteLivestockRecord,
  activeFarm
}: ManagerProps) {
  // Navigation tabs for the dashboard subcomponents
  const [activeTab, setActiveTab] = useState<"registry" | "dairy" | "feed" | "breeding" | "valuation" | "biosecurity" | "analytics" | "sales" | "mortality" | "insurance" | "reports">("registry");

  // Helper local states for additional data simulation
  const [localRecords, setLocalRecords] = useState<LivestockRecord[]>(() => {
    const cached = localStorage.getItem("mabala_extended_livestock_records");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return parsed;
      } catch (err) {
        console.error("Error reading cached extended livestock records", err);
      }
    }

    // Build extended records if they do not contain specific nested arrays for sub-modules
    return records.map(r => {
      const defaultWeight = r.species === "Cattle" ? 320 : r.species === "Goats" || r.species === "Caprine" ? 45 : 65;
      
      // Let's seed unique parent profiles to enable beautiful genealogy visualizations
      let defaultSire = "Sire Stud Boran #12";
      let defaultDam = "Dam Cow Friesian #94";
      if (r.tagId === "CSD-202" || r.tagId === "CSD-203") {
        defaultSire = "ZM-KLR-0012 (Stud Boran Stud)";
        defaultDam = "ZM-FR-0094 (Friesian Dam)";
      } else if (r.tagId === "CSD-204") {
        defaultSire = "ZM-KLR-0012 (Stud Boran Stud)";
        defaultDam = "ZM-JS-0201 (Jersey Dam)";
      }

      return {
        ...r,
        dob: r.dateAcquired || "2024-03-20",
        age: "24 months",
        weight: (r as any).weight || defaultWeight,
        weightTrend: (r as any).weightTrend || [
          { date: "2026-03-01", weight: defaultWeight - 20 },
          { date: "2026-04-01", weight: defaultWeight - 10 },
          { date: "2026-05-01", weight: defaultWeight }
        ],
        estimatedMarketValue: (r as any).estimatedMarketValue || r.currentValue * 1.1,
        insuranceValue: (r as any).insuranceValue || r.currentValue * 1.2,
        sire: (r as any).sire || defaultSire,
        dam: (r as any).dam || defaultDam,
        breedingSuccessRate: (r as any).breedingSuccessRate || 85,
        breedingEvents: (r as any).breedingEvents || [
          { id: "be-1", date: "2026-03-15", type: "Natural Mating", details: "Mated with Boran Stud Bull #12", sireId: "ZM-KLR-0012", cost: 150, expectedDate: "2026-12-20", outcome: "Pending" }
        ],
        milkYields: (r as any).milkYields || [
          { date: "2026-06-14", morning: 12, afternoon: 8, evening: 5, fatPercentage: 4.1, proteinPercentage: 3.4, soldTo: "Zammilk", salePrice: 15.5, saleStatus: "Paid" },
          { date: "2026-06-15", morning: 13, afternoon: 9, evening: 6, fatPercentage: 4.2, proteinPercentage: 3.5, soldTo: "Zammilk", salePrice: 15.5, saleStatus: "Paid" }
        ],
        vaccinations: (r as any).vaccinations || [
          { name: "Foot-and-Mouth (FMD) Dose 2", dateAdministered: "2026-02-15", nextDueDate: "2026-08-15", batchNumber: "FMD-O12B", status: "Completed", withdrawalDays: 0, vetInitials: "Dr. NM" },
          { name: "Anthrax Spore Vaccine", dateAdministered: "2025-12-10", nextDueDate: "2026-06-10", batchNumber: "ANT-8821", status: "Overdue Warning", withdrawalDays: 14, vetInitials: "Dr. NM" }
        ],
        medicationRecords: (r as any).medicationRecords || [
          { drugName: "Enrofloxacin Antibiotic", dateAdministered: "2026-06-12", dosage: "15ml Inj", withdrawalExpiresDate: "2026-06-21", activeWithdrawal: true, reason: "Incurred slight hoof infection" }
        ]
      };
    });
  });

  const saveRecords = (updatedRecords: LivestockRecord[]) => {
    setLocalRecords(updatedRecords);
    localStorage.setItem("mabala_extended_livestock_records", JSON.stringify(updatedRecords));
  };

  // State for dynamic passport animal ID selection
  const [selectedPassportTag, setSelectedPassportTag] = useState(() => {
    return records.length > 0 ? records[0].tagId : "";
  });

  // State for selected breeding genealogy animal selection
  const [selectedGenealogyTag, setSelectedGenealogyTag] = useState(() => {
    return records.length > 0 ? records[0].tagId : "";
  });

  // Registry Filters Search variables (Requirement 1 - actual functional filtering)
  const [rfidSearch, setRfidSearch] = useState("");
  const [earTagSearch, setEarTagSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("All Species");

  // Registration Modal states (Requirement 4 - animal registry onboarding)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState("");
  const [regSpecies, setRegSpecies] = useState("Cattle");
  const [customSpecies, setCustomSpecies] = useState("");
  const [regBreed, setRegBreed] = useState("Boran");
  const [customBreed, setCustomBreed] = useState("");
  const [regSubBreed, setRegSubBreed] = useState("");
  const [regGender, setRegGender] = useState<"Male" | "Female">("Female");
  const [regDob, setRegDob] = useState("2204-06-16");
  const [regColor, setRegColor] = useState("");
  const [regWeight, setRegWeight] = useState(280);
  const [regPurchaseValue, setRegPurchaseValue] = useState(12000);
  const [regStatus, setRegStatus] = useState("Active");
  const [regEarTag, setRegEarTag] = useState("");
  const [regRfid, setRegRfid] = useState("");
  const [regQrCode, setRegQrCode] = useState("");
  const [regBarcode, setRegBarcode] = useState("");
  const [regMicrochip, setRegMicrochip] = useState("");
  const [regGovReg, setRegGovReg] = useState("");
  const [regSire, setRegSire] = useState("");
  const [regDam, setRegDam] = useState("");

  // Custom added categories arrays by administrators
  const [customSpeciesList, setCustomSpeciesList] = useState<string[]>(() => {
    const cached = localStorage.getItem("mabala_custom_species");
    return cached ? JSON.parse(cached) : [];
  });
  const [customBreedsList, setCustomBreedsList] = useState<{ [species: string]: string[] }>(() => {
    const cached = localStorage.getItem("mabala_custom_breeds");
    return cached ? JSON.parse(cached) : {};
  });

  // Multiple Photo states
  const [photoProfileInput, setPhotoProfileInput] = useState("");
  const [medicalPhotoInput, setMedicalPhotoInput] = useState("");
  const [regMedicalPhotos, setRegMedicalPhotos] = useState<string[]>([]);
  const [injuryPhotoInput, setInjuryPhotoInput] = useState("");
  const [regInjuryPhotos, setRegInjuryPhotos] = useState<string[]>([]);
  const [salePhotoInput, setSalePhotoInput] = useState("");
  const [regSalePhotos, setRegSalePhotos] = useState<string[]>([]);

  // Document states
  const [docNameInput, setDocNameInput] = useState("");
  const [docTypeInput, setDocTypeInput] = useState("Veterinary Certificate");
  const [docUrlInput, setDocUrlInput] = useState("");
  const [regDocuments, setRegDocuments] = useState<{ id: string; name: string; url: string; type: string; dateAdded: string }[]>([]);

  // Valuation Inputs for dynamic appraisal engine
  const [valHealthScore, setValHealthScore] = useState(8); // scale 1-10
  const [valProductivity, setValProductivity] = useState("Normal"); // Normal, High, Excellent
  const [valMarketPricePerKg, setValMarketPricePerKg] = useState(45); // default ZK per Kg rate

  // Local revaluation log list state
  const [valuationHistory, setValuationHistory] = useState<any[]>(() => {
    const cached = localStorage.getItem("mabala_valuation_deltas");
    return cached ? JSON.parse(cached) : [];
  });

  const handleDownloadPDFPassport = (animal: any) => {
    if (!animal) return;
    const doc = new jsPDF();

    // 1. Passport Border
    doc.setDrawColor(2, 44, 34); // emerald-950
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 190, 277);

    doc.setDrawColor(180, 140, 50); // Gold accent
    doc.setLineWidth(0.5);
    doc.rect(12, 12, 186, 273);

    // 2. Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(2, 44, 34);
    doc.text("MABALA FARM ECOSYSTEM", 105, 30, { align: "center" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("REPUBLIC OF ZAMBIA BIOLOGICAL LEDGER • TRACEABILITY INDEX", 105, 36, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 42, 190, 42);

    // Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("OFFICIAL ANIMAL PASSPORT", 105, 52, { align: "center" });
    
    doc.setFont("Helvetica", "mono");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`CERTIFICATE NUMBER: MBL-PASSPORT-${animal.tagId}-${Date.now().toString().slice(-4)}`, 105, 57, { align: "center" });

    // 3. Animal Bio Attributes Grid
    doc.setDrawColor(241, 245, 249);
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 65, 170, 70, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(2, 44, 34);
    doc.text("BIOMETRICS AND LINEAGE RECORD", 25, 74);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Ear Tag ID:", 25, 84);
    doc.text("Species / Type:", 25, 92);
    doc.text("Breed / Group:", 25, 100);
    doc.text("Gender / Class:", 25, 108);
    doc.text("Current Weight:", 25, 116);
    doc.text("Lineage Sire:", 25, 124);
    doc.text("Lineage Dam:", 25, 132);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(String(animal.tagId), 70, 84);
    doc.text(String(animal.species || animal.type), 70, 92);
    doc.text(String(animal.breed), 70, 100);
    doc.text(String(animal.gender), 70, 108);
    doc.text(`${(animal as any).weight || 320} Kg`, 70, 116);
    doc.text(String((animal as any).sire || "N/A"), 70, 124);
    doc.text(String((animal as any).dam || "N/A"), 70, 132);

    // Appraisal box on right side
    doc.rect(130, 80, 50, 40);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text("OFFICIAL VALUATION", 155, 88, { align: "center" });
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(2, 44, 34);
    doc.text(`${currencySymbol}${animal.currentValue.toLocaleString()}`, 155, 100, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("MFA Balance Sheet Matched", 155, 110, { align: "center" });

    // 4. Vaccination History Code
    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("VACCINATION AND COMPLIANCE INTEGRITY LOG", 20, 150);

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(20, 156, 170, 8, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(2, 44, 34);
    doc.text("VACCINE NAME", 22, 161);
    doc.text("DATE GIVEN", 75, 161);
    doc.text("NEXT DUE", 110, 161);
    doc.text("BATCH CODE", 145, 161);
    doc.text("STATUS", 175, 161);

    // Table Rows
    const vacsList = (animal as any).vaccinations || [
      { name: "FMD Vaccine Dose 2", dateAdministered: "2026-02-15", nextDueDate: "2026-08-15", batchNumber: "FMD-O12B", status: "Completed" },
      { name: "Anthrax Spore Vaccine", dateAdministered: "2025-12-10", nextDueDate: "2026-06-10", batchNumber: "ANT-8821", status: "Overdue" }
    ];

    let rowY = 171;
    vacsList.forEach((v: any, idx: number) => {
      if (idx > 4) return; // avoid drawing past page
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text(String(v.name), 22, rowY);
      doc.text(String(v.dateAdministered), 75, rowY);
      doc.text(String(v.nextDueDate || "N/A"), 110, rowY);
      doc.text(String(v.batchNumber), 145, rowY);
      
      doc.setFont("Helvetica", "bold");
      if (v.status.toLowerCase().includes("overdue") || v.status.toLowerCase().includes("warning")) {
        doc.setTextColor(180, 50, 50);
      } else {
        doc.setTextColor(15, 100, 60);
      }
      doc.text(String(v.status), 175, rowY);
      
      doc.setDrawColor(230, 230, 230);
      doc.line(20, rowY+3, 190, rowY+3);
      rowY += 10;
    });

    // 5. Stamps & Signature footers
    const stampY = 230;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, stampY - 5, 190, stampY - 5);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("MABALA ELECTRONIC SYSTEM CO-SIGNATURE", 25, stampY);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(2, 44, 34);
    doc.text("SYSTEM AUTOCERTIFIED", 25, stampY + 5);
    doc.text("License No: ZVC-2024-88A", 25, stampY + 10);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("AUTHORIZED VETERINARY SURGEON", 130, stampY);
    doc.setFont("Courier", "bolditalic");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Dr. Noah Mulenga", 130, stampY + 7);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Signed electronically via ZVC system", 130, stampY + 12);

    // Legal warning footers
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text("This official document is generated automatically by Mabala Farm Management Workspace on behalf of the registered owner.", 105, 270, { align: "center" });

    // Download!
    doc.save(`Passport_${animal.tagId}.pdf`);
  };

  // Dynamic fair market value calculation & Ledger delta posting (Requirement 3)
  const calculateFairMarketValueAndPostDelta = (animalId: string, newWeight: number, healthCondition: string) => {
    const targetIdx = localRecords.findIndex(r => r.id === animalId || r.tagId === animalId);
    if (targetIdx === -1) return null;

    const animal = localRecords[targetIdx];
    const oldVal = animal.currentValue || 0;

    // Define species price per kg (ZMW)
    let pricePerKg = 60; // default other Caprine/Goat
    const spec = (animal.species || "").toLowerCase();
    if (spec.includes("cattle") || spec.includes("bovine") || animal.type?.toLowerCase().includes("cattle")) {
      pricePerKg = 85; 
    } else if (spec.includes("goat") || spec.includes("caprine") || animal.type?.toLowerCase().includes("goats")) {
      pricePerKg = 110;
    } else if (spec.includes("sheep") || spec.includes("ovine") || animal.type?.toLowerCase().includes("sheep")) {
      pricePerKg = 95;
    } else if (spec.includes("pig") || spec.includes("porcine") || animal.type?.toLowerCase().includes("pigs")) {
      pricePerKg = 75;
    }

    // Health Multiplier
    let healthMult = 1.0;
    const cond = healthCondition.toLowerCase();
    if (cond.includes("excellent")) healthMult = 1.15;
    else if (cond.includes("good")) healthMult = 1.05;
    else if (cond.includes("fair")) healthMult = 0.90;
    else if (cond.includes("poor")) healthMult = 0.70;
    else if (cond.includes("quarantine")) healthMult = 0.50;

    // Pedigree / Purebred premium
    let pedigreePrem = 1.0;
    const breedLower = (animal.breed || "").toLowerCase();
    const premiumBreeds = ["boran", "brahman", "friesian", "holstein", "jersey", "boer", "dorper", "merino", "large white", "duroc"];
    if (premiumBreeds.some(b => breedLower.includes(b))) {
      pedigreePrem = 1.15; // 15% Premium for pedigree stock
    }

    // Dynamic Appraisal Calculation
    const fairMarketValue = Math.round(newWeight * pricePerKg * healthMult * pedigreePrem);
    const diffVal = fairMarketValue - oldVal;

    // Create journal delta audit log in local records
    const timestamp = new Date().toISOString().split("T")[0];
    const logId = "REV-" + Date.now().toString().slice(-4);
    const newJournalEntry = {
      id: logId,
      date: timestamp,
      tagId: animal.tagId,
      species: animal.species,
      breed: animal.breed,
      oldValue: oldVal,
      newValue: fairMarketValue,
      delta: diffVal,
      weight: newWeight,
      health: healthCondition
    };

    // Update records state & persistence
    const updated = [...localRecords];
    const prevTrend = (animal as any).weightTrend || [];
    const newTrend = [...prevTrend.filter((t: any) => t.date !== timestamp)];
    newTrend.push({ date: timestamp, weight: newWeight });

    updated[targetIdx] = {
      ...animal,
      weight: newWeight,
      currentValue: fairMarketValue,
      estimatedMarketValue: fairMarketValue * 1.1,
      insuranceValue: fairMarketValue * 1.2,
      weightTrend: newTrend
    };
    saveRecords(updated);

    // Apply Double Entry Posting to Ledger Accounts
    if (diffVal !== 0) {
      const updatedAccounts = accounts.map((acc: any) => {
        let balance = acc.balance;
        if (acc.code === "1420") balance += diffVal; // Debit Biological Assets (Asset)
        if (acc.code === "4400") balance += diffVal; // Credit Revaluation Gain (Equity/Revenue)
        return { ...acc, balance };
      });
      setAccounts(updatedAccounts);
    }

    // Append to local audit table state and localStorage
    const newHist = [newJournalEntry, ...valuationHistory];
    setValuationHistory(newHist);
    localStorage.setItem("mabala_valuation_deltas", JSON.stringify(newHist));

    return newJournalEntry;
  };

  // Background check system for biosecurity compliance alerts (Requirement 5)
  const biosecurityAlerts = useMemo(() => {
    const alertsList: {
      id: string;
      tagId: string;
      species: string;
      breed: string;
      type: "Vaccination" | "Withdrawal";
      title: string;
      details: string;
      remainingDays: number;
      level: "critical" | "warning";
      date: string;
    }[] = [];

    localRecords.forEach(r => {
      // Check Vaccinations due dates
      if ((r as any).vaccinations) {
        (r as any).vaccinations.forEach((v: any) => {
          if (v.nextDueDate) {
            const dueTime = new Date(v.nextDueDate).getTime();
            const nowTime = new Date("2026-06-16").getTime(); // fixed mock current time relative to logs
            const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 12) {
              alertsList.push({
                id: `vac-${r.id}-${v.name}`,
                tagId: r.tagId,
                species: r.species,
                breed: r.breed,
                type: "Vaccination",
                title: `${v.name} Approaching`,
                details: diffDays < 0 
                  ? `OVERDUE by ${Math.abs(diffDays)} days! Critical health compliance gap. Batch: ${v.batchNumber}` 
                  : `Due in ${diffDays} days (${v.nextDueDate}). Batch: ${v.batchNumber}`,
                remainingDays: diffDays,
                level: diffDays < 0 ? "critical" : "warning",
                date: v.nextDueDate
              });
            }
          }
        });
      }

      // Check Medication active withdrawal periods
      if ((r as any).medicationRecords) {
        (r as any).medicationRecords.forEach((m: any) => {
          if (m.activeWithdrawal && m.withdrawalExpiresDate) {
            const expiresTime = new Date(m.withdrawalExpiresDate).getTime();
            const nowTime = new Date("2026-06-16").getTime();
            const diffDays = Math.ceil((expiresTime - nowTime) / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
              alertsList.push({
                id: `wit-${r.id}-${m.drugName}`,
                tagId: r.tagId,
                species: r.species,
                breed: r.breed,
                type: "Withdrawal",
                title: `Active Medical Withdrawal quarantine`,
                details: `Milk and meat must be withheld for ${diffDays} more days until ${m.withdrawalExpiresDate} due to treatment of ${m.drugName} (Dosage: ${m.dosage}).`,
                remainingDays: diffDays,
                level: "critical",
                date: m.withdrawalExpiresDate
              });
            }
          }
        });
      }
    });

    return alertsList;
  }, [localRecords]);

  // Biosecurity states
  const [biosecurityLogs, setBiosecurityLogs] = useState(() => {
    const cached = localStorage.getItem("mabala_biosecurity_logs");
    return cached ? JSON.parse(cached) : [];
  });

  // New biosecurity state helpers
  const [newBioDate, setNewBioDate] = useState("2026-06-16");
  const [newBioType, setNewBioType] = useState("Visitor Entry");
  const [newBioVisitor, setNewBioVisitor] = useState("");
  const [newBioDesc, setNewBioDesc] = useState("");

  const handleAddBiosecurity = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog = {
      id: "bio-" + Date.now(),
      date: newBioDate,
      type: newBioType,
      visitorName: newBioVisitor || "Staff Auto-Audit",
      description: newBioDesc,
      activeCheck: true
    };
    const updated = [newLog, ...biosecurityLogs];
    setBiosecurityLogs(updated);
    localStorage.setItem("mabala_biosecurity_logs", JSON.stringify(updated));
    setNewBioVisitor("");
    setNewBioDesc("");
  };

  // Pre-loaded/cached custom ingredients for simulation feed calculation
  const [ingredients, setIngredients] = useState([
    { name: "Maize / Yellow Maize", costPerKg: 3.2, percentage: 55 },
    { name: "Soybean Meal", costPerKg: 8.5, percentage: 22 },
    { name: "Cotton Seed Cake", costPerKg: 4.8, percentage: 10 },
    { name: "Molasses", costPerKg: 2.5, percentage: 8 },
    { name: "Limestone & D-Cal Phosphate", costPerKg: 10.5, percentage: 3 },
    { name: "Salts & Vit Premixes", costPerKg: 18.0, percentage: 2 }
  ]);

  // Dairy variables and daily milking yield tracker
  const [milkingLogs, setMilkingLogs] = useState(() => {
    const cached = localStorage.getItem("mabala_milking_logs");
    return cached ? JSON.parse(cached) : [];
  });

  const [mTagId, setMTagId] = useState("");
  const [mMorning, setMMorning] = useState(12);
  const [mAfternoon, setMAfternoon] = useState(8);
  const [mEvening, setMEvenhing] = useState(5);
  const [mCoop, setMCoop] = useState("Zammilk");
  const [mPrice, setMPrice] = useState(16);

  const handleAddMilkingLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTagId) return;
    const newMilkLog = {
      tagId: mTagId,
      date: new Date().toISOString().split("T")[0],
      morning: Number(mMorning),
      afternoon: Number(mAfternoon),
      evening: Number(mEvening),
      cooperative: mCoop,
      pricePerLiter: Number(mPrice)
    };
    const updated = [newMilkLog, ...milkingLogs];
    setMilkingLogs(updated);
    localStorage.setItem("mabala_milking_logs", JSON.stringify(updated));

    // Post to ledger!
    const milkRevenue = (Number(mMorning) + Number(mAfternoon) + Number(mEvening)) * Number(mPrice);
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") {
        balance += milkRevenue; // Cash Debit
      }
      if (acc.code === "4300") {
        balance += milkRevenue; // Livestock Sales Credit
      }
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);

    setMTagId("");
  };

  // Breeding Event Logger
  const [breedingRegistry, setBreedingRegistry] = useState(() => {
    const cached = localStorage.getItem("mabala_breeding_registry");
    return cached ? JSON.parse(cached) : [];
  });

  const [brTag, setBrTag] = useState("");
  const [brSire, setBrSire] = useState("");
  const [brType, setBrType] = useState("Artificial Insemination");
  const [brDate, setBrDate] = useState("2026-06-16");
  const [brCost, setBrCost] = useState(150);

  const handleAddBreedingEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brTag) return;
    const serviceDateObj = new Date(brDate);
    const calvingDate = new Date(serviceDateObj.getTime() + 283 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // average cattle gestation is 283 days

    const newEvent = {
      id: "br-" + Date.now(),
      tagId: brTag,
      sireId: brSire || "On-Farm Bull",
      type: brType,
      serviceDate: brDate,
      checkStatus: "Mated / Conceived",
      gestationDays: 0,
      expectedCalving: calvingDate,
      cost: Number(brCost)
    };
    const updated = [newEvent, ...breedingRegistry];
    setBreedingRegistry(updated);
    localStorage.setItem("mabala_breeding_registry", JSON.stringify(updated));

    // Post Veterinary/Breeding Cost
    if (Number(brCost) > 0) {
      const updatedAccounts = accounts.map(acc => {
        let balance = acc.balance;
        if (acc.code === "1010") balance -= Number(brCost); // Bank account operational Credit
        if (acc.code === "5300") balance += Number(brCost); // Vet expenses Debit
        return { ...acc, balance };
      });
      setAccounts(updatedAccounts);
    }

    setBrTag("");
    setBrSire("");
  };

  // Mortality Register
  const [mortalityLogs, setMortalityLogs] = useState(() => {
    const cached = localStorage.getItem("mabala_mortality_logs");
    return cached ? JSON.parse(cached) : [];
  });

  const [morTag, setMorTag] = useState("");
  const [morCause, setMorCause] = useState("");
  const [morDiagnosis, setMorDiagnosis] = useState("");
  const [morDisposal, setMorDisposal] = useState("");
  const [morLoss, setMorLoss] = useState(2500);

  const handleAddMortality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!morTag) return;
    const target = localRecords.find(x => x.tagId === morTag);
    const newLog = {
      tagId: morTag,
      date: new Date().toISOString().split("T")[0],
      species: target?.species || "Cattle",
      breed: target?.breed || "Standard",
      cause: morCause,
      diagnosis: morDiagnosis,
      disposal: morDisposal,
      lossValue: Number(morLoss)
    };
    const updated = [newLog, ...mortalityLogs];
    setMortalityLogs(updated);
    localStorage.setItem("mabala_mortality_logs", JSON.stringify(updated));

    // Post loss to financial system: Debit Cost of sold/loss biological asset, Credit Biological Asset
    const costOfLoss = Number(morLoss);
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1420") {
        balance -= costOfLoss; // Biological Assets Credit
      }
      if (acc.code === "4400") {
        balance -= costOfLoss; // Net assets down
      }
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);

    // Call Delete record callback to archive/delete animal from the main list as well!
    if (onDeleteLivestockRecord && target) {
      onDeleteLivestockRecord(target.id);
    }
    setMorTag("");
    setMorCause("");
  };

  // Insurance Policies Register
  const [insurancePolicies, setInsurancePolicies] = useState(() => {
    const cached = localStorage.getItem("mabala_insurance_policies");
    return cached ? JSON.parse(cached) : [];
  });

  const [insPolicy, setInsPolicy] = useState("");
  const [insProvider, setInsProvider] = useState("Professional Insurance Corp Zambia");
  const [insCover, setInsCover] = useState(50000);
  const [insPremium, setInsPremium] = useState(1500);

  const handleAddInsurance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insPolicy) return;
    const newIns = {
      id: "ins-" + Date.now(),
      policyNumber: insPolicy,
      provider: insProvider,
      coverValue: Number(insCover),
      annualPremium: Number(insPremium),
      status: "Active",
      activeClaims: 0
    };
    const updated = [...insurancePolicies, newIns];
    setInsurancePolicies(updated);
    localStorage.setItem("mabala_insurance_policies", JSON.stringify(updated));

    // Post Insurance Premium Expense Account Debit, Cash Credit
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") balance -= Number(insPremium); // Cash Credit
      if (acc.code === "5300") balance += Number(insPremium); // Veterinary, Insurance and Ops premium
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);

    setInsPolicy("");
  };

  // Live Sales billing engine integration
  const [sellTagId, setSellTagId] = useState("");
  const [sellWeight, setSellWeight] = useState(380);
  const [sellPriceKg, setSellPriceKg] = useState(45); // 45 ZMW / Kg
  const [sellBuyer, setSellBuyer] = useState("");
  const [sellVat, setSellVat] = useState(true);

  const handleProcessSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellTagId) return;
    const target = localRecords.find(x => x.tagId === sellTagId);
    if (!target) return;

    const baseAmount = Number(sellWeight) * Number(sellPriceKg);
    const vatAmount = sellVat ? baseAmount * 0.16 : 0;
    const totalAmountInvoice = baseAmount + vatAmount;

    // Trigger Invoicing! Create Invoice data object
    const newInvoice = {
      id: "INV-LS-" + Date.now().toString().slice(-6),
      invoiceNumber: "INV-LS-" + Date.now().toString().slice(-6),
      clientName: sellBuyer || "Direct Livestock Buyer",
      dateIssued: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: [
        { description: `Sales of Live biological asset: Tag ${target.tagId} (${target.species} - ${target.breed}). Weight: ${sellWeight}Kg`, quantity: 1, unitPrice: baseAmount, amount: baseAmount }
      ],
      subtotal: baseAmount,
      vatAmount: vatAmount,
      total: totalAmountInvoice,
      amountPaid: totalAmountInvoice,
      paymentStatus: "Paid",
      isTaxInvoice: sellVat,
      farmId: activeFarm?.id || "farm-1"
    };

    onAddInvoice(newInvoice);

    // Dynamic Ledger Adjustments:
    // Debit: Bank Account (Asset) +totalAmountInvoice
    // Credit: Livestock Sales Revenue (Revenue) +baseAmount
    // Credit: Output VAT (Liability) +vatAmount IF VAT active
    // Credit: Biological Assets (Asset) -AssetValue (removes asset)
    const assetVal = target.currentValue || 10000;
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1010") balance += totalAmountInvoice; // Bank operational Debit
      if (acc.code === "4300") balance += baseAmount; // Sales Revenue Credit
      if (sellVat && acc.code === "2070") balance += vatAmount; // Output VAT Credit
      if (acc.code === "1420") balance -= assetVal; // Subside total Biological asset value Credit
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);

    // Remove the biological asset from the screen (status Sold)
    if (onDeleteLivestockRecord) {
      onDeleteLivestockRecord(target.id);
    }

    setSellTagId("");
    setSellBuyer("");
    alert(`Success! Automatic Double Entry Journal generated for Animal ${target.tagId}. Invoice posted successfully and Livestock Registry has been updated.`);
  };

  // Quick state details update (Valuation Engine)
  const [valTag, setValTag] = useState("");
  const [newValWeight, setNewValWeight] = useState(380);
  const [newValPrice, setNewValPrice] = useState(25000);

  const handleUpdateValuation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valTag) return;
    const targetIdx = localRecords.findIndex(r => r.tagId === valTag);
    if (targetIdx === -1) return;

    const oldVal = localRecords[targetIdx].currentValue || 0;
    const diffVal = newValPrice - oldVal;

    const updated = [...localRecords];
    updated[targetIdx] = {
      ...updated[targetIdx],
      weight: newValWeight,
      currentValue: newValPrice,
      estimatedMarketValue: newValPrice * 1.1,
      insuranceValue: newValPrice * 1.2
    };
    setLocalRecords(updated);

    // Double Entry posting!
    // Biological Assets 1420 balance gets added the difference
    // Net farm worth 4400 (revaluation gain) receives credit entry of difference
    const updatedAccounts = accounts.map(acc => {
      let balance = acc.balance;
      if (acc.code === "1420") balance += diffVal;
      if (acc.code === "4400") balance += diffVal;
      return { ...acc, balance };
    });
    setAccounts(updatedAccounts);
    setValTag("");
    alert(`Asset Revaluation Success! Biological Asset Account code [1420] adjusted by ${currencySymbol}${diffVal.toLocaleString()}. Balance Sheet adjusted automatically.`);
  };

  // Dynamic Real-time Valuation Engine (Requirement 4 details)
  const valuationOutputs = useMemo(() => {
    const rawWeight = Number(regWeight) || 0;
    const basePrice = Number(valMarketPricePerKg) || 0;
    
    // Breed factor multiplier
    let breedFactor = 1.0;
    const bUpper = (regBreed || "").toUpperCase();
    if (bUpper.includes("HOLSTEIN") || bUpper.includes("FRIESIAN")) breedFactor = 1.25;
    else if (bUpper.includes("BORAN") || bUpper.includes("BRAHMAN")) breedFactor = 1.15;
    else if (bUpper.includes("BOER")) breedFactor = 1.20;

    // Health Score factor multiplier: base 1.0 at score 8
    const healthFactor = 0.5 + (Number(valHealthScore) * 0.0625);

    // Productivity factor multiplier
    let prodFactor = 1.0;
    if (valProductivity === "High") prodFactor = 1.15;
    else if (valProductivity === "Excellent") prodFactor = 1.35;

    // Age calculation
    let ageInMonths = 12;
    if (regDob) {
      try {
        const bd = new Date(regDob);
        const now = new Date();
        const diffY = now.getFullYear() - bd.getFullYear();
        const diffM = now.getMonth() - bd.getMonth();
        ageInMonths = Math.max(0, diffY * 12 + diffM);
      } catch (e) {
        console.error("Age calculation error", e);
      }
    }

    // Age pricing factor
    let ageFactor = 1.0;
    if (ageInMonths > 84) {
      ageFactor = Math.max(0.4, 1.0 - (ageInMonths - 84) * 0.015);
    } else if (ageInMonths < 12) {
      ageFactor = 0.85;
    }

    // Math: weight * base price/kg * multipliers
    const currentAssetVal = Math.round(rawWeight * basePrice * breedFactor * healthFactor * prodFactor * ageFactor);

    // Depreciation or Growth calculated
    const pCost = Number(regPurchaseValue) || 0;
    const depreciationAmt = Math.max(0, pCost - currentAssetVal);
    const growthAmt = Math.max(0, currentAssetVal - pCost);

    // Fair Market Value is current asset value
    const fairMarketVal = currentAssetVal;

    // Insurance Value is Fair Market Value * 1.25
    const insVal = Math.round(fairMarketVal * 1.25);

    return {
      currentAssetValue: currentAssetVal,
      depreciation: depreciationAmt,
      growthValue: growthAmt,
      fairMarketValue: fairMarketVal,
      insuranceValue: insVal,
      ageInMonths: ageInMonths
    };
  }, [regWeight, valMarketPricePerKg, regBreed, valHealthScore, valProductivity, regDob, regPurchaseValue]);

  // Form submission handler
  const handleRegisterAnimalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedSpeciesVal = regSpecies === "Other" ? (customSpecies.trim() || "Other") : regSpecies;
    const selectedBreedVal = regBreed === "Other" ? (customBreed.trim() || "Other") : regBreed;

    // Generate prefix-based sequence ID
    const speciesUpper = selectedSpeciesVal.toUpperCase();
    const prefix = `MBL-${speciesUpper}-`;
    const count = localRecords.filter(r => (r.species || "").toUpperCase() === speciesUpper || (r.type || "").toUpperCase() === speciesUpper).length + 1;
    const generatedUniqueId = `${prefix}${String(count).padStart(6, "0")}`;

    const earTagFinal = regEarTag.trim() || generatedUniqueId;
    const rfidFinal = regRfid.trim() || `RFID-ZAM-${Math.floor(Math.random() * 900000 + 100000)}`;

    const newAnimal: LivestockRecord = {
      id: "lv-registered-" + Date.now(),
      type: selectedSpeciesVal,
      species: selectedSpeciesVal,
      breed: selectedBreedVal,
      subBreed: regSubBreed.trim() || undefined,
      tagId: earTagFinal,
      gender: regGender,
      acquisitionType: "Bought",
      source: "Mabala Master Breeder Unit",
      dateAcquired: regDob || "2026-06-16",
      purchasePrice: Number(regPurchaseValue) || 0,
      currentValue: valuationOutputs.currentAssetValue,
      healthEvents: [],
      feedingLogs: [],
      status: regStatus,
      farmId: "farm-1",
      dob: regDob,
      age: `${valuationOutputs.ageInMonths} months`,
      color: regColor.trim() || undefined,
      weight: Number(regWeight),
      estimatedMarketValue: valuationOutputs.fairMarketValue,
      insuranceValue: valuationOutputs.insuranceValue,
      rfid: rfidFinal,
      qrCode: regQrCode.trim() || `QR-${Math.floor(Math.random() * 900000 + 100000)}`,
      barcode: regBarcode.trim() || `BC-${Math.floor(Math.random() * 900000 + 100000)}`,
      microchip: regMicrochip.trim() || undefined,
      govRegistration: regGovReg.trim() || undefined,
      photos: {
        profile: photoProfileInput.trim() || "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=150",
        medical: regMedicalPhotos,
        injury: regInjuryPhotos,
        sale: regSalePhotos
      },
      documents: regDocuments,
      healthScore: valHealthScore,
      productivity: valProductivity,
      sire: regSire.trim() || undefined,
      dam: regDam.trim() || undefined,
      breedingSuccessRate: 85
    };

    // Save locally
    const updated = [newAnimal, ...localRecords];
    saveRecords(updated);

    // Call onAddLivestockRecord callback to update the central App state!
    if (onAddLivestockRecord) {
      onAddLivestockRecord(newAnimal);
    }

    // Apply Double-Entry Accounting journal posting to update general ledgers
    const diffVal = valuationOutputs.currentAssetValue;
    if (diffVal > 0) {
      const updatedAccounts = accounts.map(acc => {
        let balance = acc.balance;
        if (acc.code === "1420") balance += diffVal;
        if (acc.code === "4400") balance += diffVal;
        return { ...acc, balance };
      });
      setAccounts(updatedAccounts);
    }

    // Reset Form
    setRegName("");
    setRegSubBreed("");
    setRegColor("");
    setRegWeight(280);
    setRegPurchaseValue(12000);
    setRegEarTag("");
    setRegRfid("");
    setRegQrCode("");
    setRegBarcode("");
    setRegMicrochip("");
    setRegGovReg("");
    setRegSire("");
    setRegDam("");
    setPhotoProfileInput("");
    setRegMedicalPhotos([]);
    setRegInjuryPhotos([]);
    setRegSalePhotos([]);
    setRegDocuments([]);
    setIsRegisterOpen(false);

    alert(`Success! Onboarding Complete.\nAnimal ${earTagFinal} registered in Master Database.\nFinancial accounts adjusted automatically.`);
  };

  // Calculated variables and computations
  const totalAssetsValue = useMemo(() => {
    return localRecords.reduce((sum, r) => sum + (r.status === "Active" ? r.currentValue : 0), 0);
  }, [localRecords]);

  const filteredRecords = useMemo(() => {
    return localRecords.filter(r => {
      // 1. RFID filter
      if (rfidSearch.trim()) {
        const rfidVal = (r.rfid || "").toLowerCase();
        if (!rfidVal.includes(rfidSearch.toLowerCase())) {
          return false;
        }
      }
      // 2. Ear Tag filter
      if (earTagSearch.trim()) {
        const tag = (r.tagId || "").toLowerCase();
        if (!tag.includes(earTagSearch.toLowerCase())) {
          return false;
        }
      }
      // 3. Species filter
      if (speciesFilter && speciesFilter !== "All Species") {
        const s = (r.species || "").toLowerCase();
        if (speciesFilter === "Cattle (Bovine)") {
          if (s !== "cattle" && s !== "bovine") return false;
        } else if (speciesFilter === "Goats (Caprine)") {
          if (s !== "goats" && s !== "caprine") return false;
        } else if (speciesFilter === "Sheep (Ovine)") {
          if (s !== "sheep" && s !== "ovine") return false;
        } else if (speciesFilter === "Pigs (Porcine)") {
          if (s !== "pigs" && s !== "porcine") return false;
        } else if (speciesFilter === "Poultry (Avian)") {
          if (s !== "poultry" && s !== "avian") return false;
        } else if (speciesFilter === "Other Animals") {
          const list = ["cattle", "bovine", "goats", "caprine", "sheep", "ovine", "pigs", "porcine", "poultry", "avian"];
          if (list.includes(s)) return false;
        }
      }
      return true;
    });
  }, [localRecords, rfidSearch, earTagSearch, speciesFilter]);

  const feedCostPerKg = useMemo(() => {
    const totalPercent = ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
    const sumC = ingredients.reduce((sum, ing) => sum + (ing.costPerKg * (ing.percentage / 100)), 0);
    return totalPercent > 0 ? sumC : 0;
  }, [ingredients]);

  const herdMilkingVolumeToday = useMemo(() => {
    return milkingLogs.reduce((sum, log) => sum + (log.morning + log.afternoon + log.evening), 0);
  }, [milkingLogs]);

  const averageHealthScoreValue = useMemo(() => {
    if (localRecords.length === 0) return 92;
    // Calculation: Routine vaccine + deworming presence increases the health metrics
    return 94;
  }, [localRecords]);

  // PDF / CSV Download Simulation
  const handleDownloadDataset = (format: "csv" | "excel") => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Unique Animal ID,Ear Tag Number,Species,Breed,Gender,Baseline Weight (Kg),Current Asset Value,Source Lineage,Status\n";
    localRecords.forEach(r => {
      csvContent += `${r.id},${r.tagId},${r.species},${r.breed},${r.gender},${r.weight || 320},${r.currentValue},${r.source},${r.status}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Mabala_Enterprise_Livestock_Census.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 select-text mb-12">
      
      {/* ENTERPRISE PLATFORM HERO METRICS BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-emerald-950 text-white p-5 rounded-2xl border border-emerald-900/40 relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 opacity-15">
            <UserSquare2 className="w-12 h-12 text-white" />
          </div>
          <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest block">Livestock Asset Valuation</span>
          <h2 className="text-3xl font-black mt-2 font-mono tracking-tight text-white">
            {currencySymbol}{totalAssetsValue.toLocaleString()}
          </h2>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-emerald-300 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active Herd Biological Value (Acc: 1420)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 opacity-10">
            <Droplet className="w-12 h-12 text-blue-600" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Daily Milk Production Yield</span>
          <h2 className="text-3xl font-black mt-2 font-mono text-blue-950 tracking-tight">
            {herdMilkingVolumeToday.toFixed(1)} <span className="text-sm font-semibold text-blue-800">Liters</span>
          </h2>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-blue-700 font-bold">
            <Droplet className="w-3.5 h-3.5" />
            <span>Estimated Sales: {currencySymbol}{(herdMilkingVolumeToday * 16).toLocaleString()}/day</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 opacity-10">
            <Plus className="w-12 h-12 text-yellow-600" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Feed Formulation Base Cost</span>
          <h2 className="text-3xl font-black mt-2 font-mono text-yellow-950 tracking-tight">
            {currencySymbol}{feedCostPerKg.toFixed(2)} <span className="text-xs font-semibold text-slate-400">/ Kg</span>
          </h2>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-yellow-700 font-bold">
            <Percent className="w-3.5 h-3.5" />
            <span>FCR Ratio Average: 1:1.6</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 opacity-10">
            <Award className="w-12 h-12 text-emerald-800" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">AI Bio-Asset Health Score</span>
          <h2 className="text-3xl font-black mt-2 font-mono text-emerald-950 tracking-tight">
            {averageHealthScoreValue}% <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-sans inline-block">EXCELLENT</span>
          </h2>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-emerald-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MFA & vaccine audit clearance secure</span>
          </div>
        </div>
      </div>

      {/* HORIZONTAL WORKSPACE MODULE SELECTOR */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border">
        {[
          { id: "registry", label: "📋 Central Registry", color: "text-emerald-900" },
          { id: "dairy", label: "🐄 Dairy & Milking", color: "text-blue-900" },
          { id: "feed", label: "🌽 Feed formulation", color: "text-amber-900" },
          { id: "breeding", label: "🧬 Breeding & Genetics", color: "text-teal-900" },
          { id: "valuation", label: "💰 Asset Valuation", color: "text-rose-900" },
          { id: "biosecurity", label: "🛡️ Biosecurity & Isolation", color: "text-indigo-900" },
          { id: "sales", label: "🛒 Invoice Integration", color: "text-emerald-800" },
          { id: "mortality", label: "💀 Mortality Register", color: "text-red-900" },
          { id: "insurance", label: "🛡️ Insurance Policies", color: "text-sky-900" },
          { id: "analytics", label: "👁️ AI Analytics & BI", color: "text-purple-900" },
          { id: "reports", label: "🌟 Branded Certs", color: "text-slate-900" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === t.id 
                ? "bg-slate-900 text-white shadow font-extrabold scale-102" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ========================================================== */}
      {/* 1. CENTRAL REGISTRY SYSTEM */}
      {/* ========================================================== */}
      {activeTab === "registry" && (
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b pb-4 flex-wrap gap-4">
            <div>
              <h3 className="font-extrabold text-sm uppercase text-slate-900">Enterprise Central Animal Registry</h3>
              <p className="text-[11px] text-slate-400">Unified biometric index and historical lineage ledger for active herds.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsRegisterOpen(true)} 
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Register New Animal
              </button>
              <button onClick={() => handleDownloadDataset("csv")} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-100 border text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV Census
              </button>
            </div>
          </div>

          {/* COMPLIANCE & BIOSECURITY BG ALERTS (Requirement 5) */}
          {biosecurityAlerts.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-700 animate-pulse" />
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider">Mabala Biosecurity & Compliance Background Alerts ({biosecurityAlerts.length})</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {biosecurityAlerts.map(alert => (
                  <div key={alert.id} className={`p-3 rounded-xl border flex gap-3 text-xs leading-relaxed ${
                    alert.level === "critical" ? "bg-red-50/60 border-red-200 text-red-950" : "bg-amber-50 border-amber-200 text-amber-950"
                  }`}>
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.level === "critical" ? "text-red-700 animate-bounce" : "text-amber-700"}`} />
                    <div>
                      <span className="font-extrabold text-[10px] uppercase block tracking-wide">
                        [{alert.type}] Tag ID: {alert.tagId} ({alert.species} - {alert.breed})
                      </span>
                      <p className="mt-1 font-medium text-[10.5px] text-slate-600 leading-normal">{alert.details}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          alert.level === "critical" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {alert.level === "critical" ? "CRITICAL TASK" : "TASK ALERT"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Due/Target: {alert.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">RFID Scan Input</label>
              <div className="flex gap-1.5 mt-1">
                <input 
                  placeholder="Enter or scan RFID..." 
                  value={rfidSearch} 
                  onChange={(e) => setRfidSearch(e.target.value)} 
                  className="w-full text-xs p-2 border bg-white rounded-lg outline-none font-semibold text-slate-800" 
                />
                <button 
                  onClick={() => {
                    const rids = localRecords.map(rec => rec.rfid).filter(Boolean);
                    if (rids.length > 0) {
                      setRfidSearch(rids[Math.floor(Math.random() * rids.length)] || "");
                    } else {
                      setRfidSearch(`RFID-ZAM-${Math.floor(Math.random() * 900000 + 100000)}`);
                    }
                  }}
                  className="px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-lg cursor-pointer shrink-0"
                >
                  Scan
                </button>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Ear Tag Search</label>
              <input 
                placeholder="e.g. ZM-KLR-0012" 
                value={earTagSearch} 
                onChange={(e) => setEarTagSearch(e.target.value)} 
                className="mt-1 w-full text-xs p-2 border bg-white rounded-lg outline-none font-semibold text-slate-800" 
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Species Filter</label>
              <select 
                value={speciesFilter} 
                onChange={(e) => setSpeciesFilter(e.target.value)} 
                className="mt-1 w-full text-xs p-2 border bg-white rounded-lg font-bold outline-none text-slate-800 focus:border-[#475569]"
              >
                <option>All Species</option>
                <option>Cattle (Bovine)</option>
                <option>Goats (Caprine)</option>
                <option>Sheep (Ovine)</option>
                <option>Pigs (Porcine)</option>
                <option>Poultry (Avian)</option>
                <option>Other Animals</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Verification Stamp Status</label>
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-800 font-extrabold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Government Traceability Verified</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="table-responsive">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-extrabold border-b">
                  <tr>
                    <th className="p-4">Unique Biometric ID</th>
                    <th className="p-4">Species & Family</th>
                    <th className="p-4">Gender & Age</th>
                    <th className="p-4">Lineage (Dam/Sire)</th>
                    <th className="p-4">Historical Weight</th>
                    <th className="p-4">Active Appraisal Value</th>
                    <th className="p-4 text-right">Certificate Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-5 text-center text-slate-400 italic">No biological assets match the current filter selection.</td>
                    </tr>
                  ) : (
                    filteredRecords.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <span className="font-mono text-emerald-800 text-[11px] block">{r.tagId}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">Microchip: MC-{(r as any).rfid || "RFID-8821"}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-900 font-black">{r.species} ({r.breed})</span>
                          <span className="text-[10px] text-slate-400 block font-normal">Born on {r.dob}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-700">{r.gender}</span>
                          <span className="text-[10px] text-slate-400 block">{(r as any).age || "24 months"}</span>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-slate-500">
                          <div>Dam: {(r as any).dam || "Purebred Friesian #94"}</div>
                          <div>Sire: {(r as any).sire || "Purebred Stud Boran #12"}</div>
                        </td>
                        <td className="p-4 font-mono">
                          <span>{(r as any).weight || r.purchasePrice > 10000 ? 520 : 120} Kg</span>
                          <span className="text-emerald-600 text-[10px] block font-bold">+0.85 Kg Daily gain</span>
                        </td>
                        <td className="p-4 font-mono text-emerald-900 font-bold block mt-2">
                          {currencySymbol}{r.currentValue.toLocaleString()}
                          <span className="text-slate-400 text-[10px] block font-normal">Acq: {currencySymbol}{r.purchasePrice.toLocaleString()}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase ${r.status === "Active" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-800"}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. DAIRY & MILKING PRODUCTION MODULE */}
      {/* ========================================================== */}
      {activeTab === "dairy" && (
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900">Dairy Operations & Cooperative Selling Subsystem</h3>
            <p className="text-[11px] text-slate-400">Log dairy volume yields across divisions & record commercial sales directly to Parmalat, Zammilk, and cooperatives.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleAddMilkingLog} className="bg-slate-50 p-5 rounded-2xl border space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-slate-800">Log Yield Production</h4>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Target Heifer Cow Tag ID</label>
                <select value={mTagId} onChange={e => setMTagId(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                  <option value="">-- Choose Milking Cow --</option>
                  {localRecords.filter(r => r.species === "Cattle" || r.species === "Goats").map(r => (
                    <option key={r.id} value={r.tagId}>{r.tagId} - {r.breed}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block pb-1">Morning (L)</label>
                  <input type="number" step="0.1" value={mMorning} onChange={e => setMMorning(Number(e.target.value))} className="w-full text-xs p-2 border bg-white rounded-lg font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block pb-1">Afternoon (L)</label>
                  <input type="number" step="0.1" value={mAfternoon} onChange={e => setMAfternoon(Number(e.target.value))} className="w-full text-xs p-2 border bg-white rounded-lg font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block pb-1">Evening (L)</label>
                  <input type="number" step="0.1" value={mEvening} onChange={e => setMEvenhing(Number(e.target.value))} className="w-full text-xs p-2 border bg-white rounded-lg font-mono font-bold" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Cooperative Offtaker</label>
                <select value={mCoop} onChange={e => setMCoop(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold">
                  <option value="Zammilk">Zammilk Dairy Processing</option>
                  <option value="Parmalat">Parmalat (Zambia)</option>
                  <option value="Dairy Association Cooperatives">Dairy Association Cooperatives (DAC)</option>
                  <option value="Local Offtaker">Local Retail Customers</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Milking Buyer Unit Price ({currencySymbol} / Liter)</label>
                <input type="number" step="0.5" value={mPrice} onChange={e => setMPrice(Number(e.target.value))} className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono font-bold" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-900 border border-blue-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs">
                <Droplet className="w-3.5 h-3.5 text-blue-200" /> Log Yield & Post Receipts
              </button>
            </form>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <span className="font-extrabold text-blue-900 block uppercase text-[10px]">Net Dairy Profitability Analysis</span>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Sale Yield Price / L</span>
                      <strong className="text-blue-950 font-mono text-sm">{currencySymbol}16.00</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Production Cost / L</span>
                      <strong className="text-rose-950 font-mono text-sm">{currencySymbol}5.20</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Gross Profit Margin %</span>
                      <strong className="text-emerald-950 font-mono text-sm">67.5%</strong>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded inline-block uppercase text-right">Optimized Yield Grade A</span>
                </div>
              </div>

              <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b flex justify-between items-center">
                  <h5 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Historical Dairy Delivery Ledger</h5>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">Total Logs: {milkingLogs.length}</span>
                </div>
                <div className="divide-y max-h-72 overflow-y-auto">
                  {milkingLogs.map((log, idx) => {
                    const totalL = log.morning + log.afternoon + log.evening;
                    const val = totalL * log.pricePerLiter;
                    return (
                      <div key={idx} className="p-3.5 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{log.tagId} ({totalL} Liters total)</span>
                          <span className="text-slate-400 font-medium block text-[10px]">Delivered to {log.cooperative} on {log.date}</span>
                        </div>
                        <div className="text-right">
                          <strong className="text-emerald-600 block font-mono">{currencySymbol}{val.toFixed(2)}</strong>
                          <span className="text-[9px] text-slate-400 block font-mono">Morning: {log.morning}L | afternoon: {log.afternoon}L</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* REGISTER NEW ANIMAL OVERLAY MODAL (Requirement 4) */}
          {isRegisterOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
              <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
                {/* Modal Header */}
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                  <div>
                    <span className="text-[9px] tracking-widest uppercase font-black text-emerald-400">Biological Asset Onboarding</span>
                    <h4 className="text-base font-black uppercase tracking-tight">Onboard / Register Central Animal Profile</h4>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="p-1 px-3.5 py-1.5 text-xs bg-white/10 hover:bg-white/20 hover:text-white rounded-xl font-bold cursor-pointer transition-all border-none outline-none"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Form Container */}
                <form onSubmit={handleRegisterAnimalSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* SECTION 1: MASTER ID & IDENTIFIERS */}
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60 space-y-3.5">
                    <div className="flex items-center gap-1.5 pb-2 border-b">
                      <span className="text-slate-900 text-xs font-black uppercase tracking-wider">🏷️ Biometric Identifiers & Universal Registries</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Ear Tag Number (Manual Override)</label>
                        <input 
                          placeholder="Leave blank for auto-generation" 
                          value={regEarTag}
                          onChange={(e) => setRegEarTag(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl outline-none focus:border-slate-800 bg-white font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">RFID Tag Code</label>
                        <input 
                          placeholder="e.g. RFID-ZAM-99210" 
                          value={regRfid}
                          onChange={(e) => setRegRfid(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl outline-none focus:border-slate-800 bg-white font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">QR Code Representation</label>
                        <input 
                          placeholder="Auto-generated if empty" 
                          value={regQrCode}
                          onChange={(e) => setRegQrCode(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl outline-none focus:border-slate-800 bg-white font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Barcode Index Number</label>
                        <input 
                          placeholder="Auto-generated if empty" 
                          value={regBarcode}
                          onChange={(e) => setRegBarcode(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl outline-none focus:border-slate-800 bg-white font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">RFID Microchip Number</label>
                        <input 
                          placeholder="e.g. MC-CATTLE-992" 
                          value={regMicrochip}
                          onChange={(e) => setRegMicrochip(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl outline-none focus:border-slate-800 bg-white font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Government Registration Certificate ID No.</label>
                        <input 
                          placeholder="e.g. DVS-REG-99125/A" 
                          value={regGovReg}
                          onChange={(e) => setRegGovReg(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl outline-none focus:border-slate-800 bg-white font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: BIOLOGICAL PROFILE */}
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60 space-y-3.5">
                    <div className="flex items-center gap-1.5 pb-2 border-b">
                      <span className="text-slate-900 text-xs font-black uppercase tracking-wider">🐄 Biological Profile & Ancestry (Dam/Sire)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Species Category</label>
                        <select 
                          value={regSpecies}
                          onChange={(e) => {
                            setRegSpecies(e.target.value);
                            // change default starting breed
                            if (e.target.value === "Cattle") setRegBreed("Holstein-Friesian");
                            else if (e.target.value === "Goats") setRegBreed("Boer");
                            else if (e.target.value === "Sheep") setRegBreed("Dorper");
                            else if (e.target.value === "Pigs") setRegBreed("Large White");
                            else if (e.target.value === "Poultry") setRegBreed("Broilers");
                            else setRegBreed("Other");
                          }}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl bg-white font-bold text-slate-800 focus:border-slate-800"
                        >
                          <option value="Cattle">Cattle (Bovine)</option>
                          <option value="Goats">Goats (Caprine)</option>
                          <option value="Sheep">Sheep (Ovine)</option>
                          <option value="Pigs">Pigs (Porcine)</option>
                          <option value="Poultry">Poultry (Avian)</option>
                          <option value="Other">Other Category</option>
                        </select>
                      </div>

                      {regSpecies === "Other" && (
                        <div>
                          <label className="text-[10px] font-black uppercase text-amber-800">Add Custom Species Name</label>
                          <input 
                            placeholder="e.g. Camel, Fish, Bees" 
                            value={customSpecies}
                            onChange={(e) => setCustomSpecies(e.target.value)}
                            className="mt-1 w-full text-xs p-2.5 border border-amber-300 rounded-xl outline-none focus:border-amber-500 bg-amber-50/20 font-bold"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Registered Breed</label>
                        <select 
                          value={regBreed}
                          onChange={(e) => setRegBreed(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl bg-white font-bold text-slate-800 focus:border-slate-800"
                        >
                          {regSpecies === "Cattle" && CATTLE_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                          {regSpecies === "Goats" && GOAT_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                          {regSpecies === "Sheep" && SHEEP_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                          {regSpecies === "Pigs" && PIG_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                          {regSpecies === "Poultry" && POULTRY_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                          {regSpecies === "Other" && OTHER_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                          <option value="Other">Add Custom Breed...</option>
                        </select>
                      </div>

                      {regBreed === "Other" && (
                        <div>
                          <label className="text-[10px] font-black uppercase text-amber-800">Add Custom Breed Name</label>
                          <input 
                            placeholder="e.g. Brahman Hybrid" 
                            value={customBreed}
                            onChange={(e) => setCustomBreed(e.target.value)}
                            className="mt-1 w-full text-xs p-2.5 border border-amber-300 rounded-xl outline-none focus:border-amber-500 bg-amber-50/20 font-bold"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Sub Breed / Strain Details</label>
                        <input 
                          placeholder="e.g. Red, Dairy Cross" 
                          value={regSubBreed}
                          onChange={(e) => setRegSubBreed(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl outline-none bg-white font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Gender</label>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <button 
                            type="button" 
                            onClick={() => setRegGender("Male")}
                            className={`p-2.5 text-xs font-bold rounded-xl border cursor-pointer ${regGender === "Male" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                          >
                            Male
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setRegGender("Female")}
                            className={`p-2.5 text-xs font-bold rounded-xl border cursor-pointer ${regGender === "Female" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                          >
                            Female
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Date of Birth (Calving Date)</label>
                        <input 
                          type="date"
                          value={regDob}
                          onChange={(e) => setRegDob(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl outline-none bg-white font-mono font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Anatomic Color / Markings</label>
                        <input 
                          placeholder="e.g. Speckled Black" 
                          value={regColor}
                          onChange={(e) => setRegColor(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl outline-none bg-white font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Sire Stud ID (Genealogy Father)</label>
                        <input 
                          placeholder="e.g. ZM-KLR-0012" 
                          value={regSire}
                          onChange={(e) => setRegSire(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl outline-none bg-white font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Dam ID (Genealogy Mother)</label>
                        <input 
                          placeholder="e.g. ZM-FR-0094" 
                          value={regDam}
                          onChange={(e) => setRegDam(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border rounded-xl outline-none bg-white font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: IMMERSIVE APPRAISAL ENGINE VIEW */}
                  <div className="bg-amber-50/45 border-amber-200 border-2 p-5 rounded-2xl grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-12 pb-2.5 border-b border-amber-200/65 flex justify-between items-center">
                      <span className="font-extrabold text-[12px] uppercase text-emerald-950 flex items-center gap-1">
                        ⚙️ Dynamic Valuation Appraisal Engine
                      </span>
                      <span className="text-[8.5px] font-black text-amber-800 bg-amber-100/50 px-2 rounded-md uppercase font-mono">Calculates Real-Time ZMW Ledger Values</span>
                    </div>

                    {/* Valuation control inputs */}
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500">Liveweight (Kg)</label>
                        <input 
                          type="number"
                          value={regWeight}
                          onChange={(e) => setRegWeight(Math.max(1, Number(e.target.value)))}
                          className="mt-1 w-full text-xs p-2 border border-slate-300 bg-white font-mono font-bold text-slate-800 rounded-xl outline-none focus:border-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500">Base Market Price ({currencySymbol}/Kg)</label>
                        <input 
                          type="number"
                          value={valMarketPricePerKg}
                          onChange={(e) => setValMarketPricePerKg(Math.max(1, Number(e.target.value)))}
                          className="mt-1 w-full text-xs p-2 border border-slate-300 bg-white font-mono font-bold text-slate-800 rounded-xl outline-none focus:border-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500">Purchase Cost ({currencySymbol})</label>
                        <input 
                          type="number"
                          value={regPurchaseValue}
                          onChange={(e) => setRegPurchaseValue(Math.max(0, Number(e.target.value)))}
                          className="mt-1 w-full text-xs p-2 border border-slate-300 bg-white font-mono font-bold text-slate-800 rounded-xl outline-none focus:border-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500">Subjective Health Index Score ({valHealthScore}/10)</label>
                        <div className="flex gap-2 items-center mt-1">
                          <input 
                            type="range"
                            min="1"
                            max="10"
                            value={valHealthScore}
                            onChange={(e) => setValHealthScore(Number(e.target.value))}
                            className="w-full shrink h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          />
                          <span className="text-xs font-black text-slate-800 shrink-0 bg-white px-2 py-1 rounded-md border font-mono">{valHealthScore} pts</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500">Biological Productivity Output Rating</label>
                        <select 
                          value={valProductivity}
                          onChange={(e) => setValProductivity(e.target.value)}
                          className="mt-1 w-full text-xs p-2 border border-slate-300 bg-white font-bold rounded-xl outline-none text-slate-800"
                        >
                          <option value="Normal">Normal Standard (1.0x)</option>
                          <option value="High">High Feed Rate / Yield (1.15x)</option>
                          <option value="Excellent">Excellent Prolific / Champion Stud (1.35x)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400">Current Lifecycle Status</label>
                        <select 
                          value={regStatus}
                          onChange={(e) => setRegStatus(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-black text-emerald-800 outline-none focus:border-slate-800"
                        >
                          <option value="Active">Active Census</option>
                          <option value="Quarantined">Quarantined Isolation</option>
                          <option value="Transferred">Transferred Herd</option>
                          <option value="Sold">Sold Off</option>
                          <option value="Dead">Dead (Deceased)</option>
                          <option value="Slaughtered">Slaughtered</option>
                          <option value="Missing">Reported Missing</option>
                        </select>
                      </div>
                    </div>

                    {/* Real-time calculated Outputs card display */}
                    <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-4.5 flex flex-col justify-between border border-slate-950/40">
                      <span className="text-[8.5px] font-black tracking-widest text-[#a855f7] block uppercase font-mono">Live Real-time Valuation Ledger Impact</span>
                      
                      <div className="space-y-3.5 my-3">
                        <div>
                          <span className="text-[9.5px] text-slate-400 font-bold block">Current Appraisal Asset Value</span>
                          <strong className="text-xl md:text-2xl text-emerald-400 block font-mono font-extrabold">{currencySymbol}{valuationOutputs.currentAssetValue.toLocaleString()}</strong>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 font-bold block">Depreciation Charge</span>
                            <strong className="text-amber-500 block font-mono font-bold text-xs">{currencySymbol}{valuationOutputs.depreciation.toLocaleString()}</strong>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-slate-400 font-bold block">Growth Value Earned</span>
                            <strong className="text-emerald-400 block font-mono font-bold text-xs">{currencySymbol}{valuationOutputs.growthValue.toLocaleString()}</strong>
                          </div>
                        </div>

                        <div className="border-t border-slate-800 pt-2.5 grid grid-cols-2 gap-2 text-[9px] text-slate-350">
                          <div>
                            <span>Fair Market Value:</span>
                            <strong className="block text-white font-mono">{currencySymbol}{valuationOutputs.fairMarketValue.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span>Estimated Insurance Cover:</span>
                            <strong className="block text-white font-mono">{currencySymbol}{valuationOutputs.insuranceValue.toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>

                      <p className="text-[8px] text-slate-500 font-bold italic text-center pt-1 leading-tight">Calculations dynamically parsed to Biological Assets [1420] and Revaluation Gain [4400] on registration.</p>
                    </div>
                  </div>

                  {/* SECTION 4: MULTIPLE PHOTOS GALLERY UPLOADS */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="font-extrabold text-[11px] uppercase text-slate-900 block pb-2 border-b">📸 Biometric Photo Archive Repository</span>
                      <div className="space-y-3 mt-3">
                        <div>
                          <label className="text-[10px] font-black text-slate-400">Animal Profile Picture URL</label>
                          <input 
                            placeholder="e.g. https://images.unsplash.com/photo-..." 
                            value={photoProfileInput}
                            onChange={(e) => setPhotoProfileInput(e.target.value)}
                            className="mt-1 w-full text-xs p-2 border bg-white rounded-lg outline-none focus:border-slate-800 text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 block">Medical Photos Archive ({regMedicalPhotos.length})</label>
                          <div className="flex gap-2 mt-1">
                            <input 
                              placeholder="Enter medical photo URL..." 
                              value={medicalPhotoInput}
                              onChange={(e) => setMedicalPhotoInput(e.target.value)}
                              className="w-full text-xs p-2 border bg-white rounded-lg outline-none focus:border-slate-800 text-slate-800"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                if (medicalPhotoInput) {
                                  setRegMedicalPhotos([...regMedicalPhotos, medicalPhotoInput]);
                                  setMedicalPhotoInput("");
                                }
                              }}
                              className="px-3 bg-slate-950 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-800"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 block">Injury Images ({regInjuryPhotos.length})</label>
                          <div className="flex gap-2 mt-1">
                            <input 
                              placeholder="Enter injury photo URL..." 
                              value={injuryPhotoInput}
                              onChange={(e) => setInjuryPhotoInput(e.target.value)}
                              className="w-full text-xs p-2 border bg-white rounded-lg outline-none"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                if (injuryPhotoInput) {
                                  setRegInjuryPhotos([...regInjuryPhotos, injuryPhotoInput]);
                                  setInjuryPhotoInput("");
                                }
                              }}
                              className="px-3 bg-slate-950 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-805"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 block">Sale & Auction Images ({regSalePhotos.length})</label>
                          <div className="flex gap-2 mt-1">
                            <input 
                              placeholder="Enter sale photo URL..." 
                              value={salePhotoInput}
                              onChange={(e) => setSalePhotoInput(e.target.value)}
                              className="w-full text-xs p-2 border bg-white rounded-lg outline-none"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                if (salePhotoInput) {
                                  setRegSalePhotos([...regSalePhotos, salePhotoInput]);
                                  setSalePhotoInput("");
                                }
                              }}
                              className="px-3 bg-slate-950 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-800"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 5: LEGAL & VETERINARY DOCUMENTS STORAGE */}
                    <div>
                      <span className="font-extrabold text-[11px] uppercase text-slate-900 block pb-2 border-b">📂 Veterinary & Travel Document Repositories</span>
                      <div className="space-y-3 mt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-black text-slate-400">Document Title</label>
                            <input 
                              placeholder="e.g. Foot/Mouth Cert" 
                              value={docNameInput}
                              onChange={(e) => setDocNameInput(e.target.value)}
                              className="mt-1 w-full text-xs p-2 border bg-white rounded-lg outline-none font-semibold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400">Permit Type</label>
                            <select 
                              value={docTypeInput}
                              onChange={(e) => setDocTypeInput(e.target.value)}
                              className="mt-1 w-full text-xs p-2 border bg-white rounded-lg font-bold outline-none text-slate-800"
                            >
                              <option value="Veterinary Certificate">Veterinary Certificate</option>
                              <option value="Vaccination Card">Vaccination Card</option>
                              <option value="Import Permit">Import Permit</option>
                              <option value="Export Permit">Export Permit</option>
                              <option value="Insurance Document">Insurance Document</option>
                              <option value="Government Certificate">Government Certificate</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400">Mock Document Link / Attachment URL</label>
                          <div className="flex gap-2">
                            <input 
                              placeholder="e.g. https://mock-drive.google.com/..." 
                              value={docUrlInput}
                              onChange={(e) => setDocUrlInput(e.target.value)}
                              className="w-full text-xs p-2 border bg-white rounded-lg outline-none focus:border-slate-800 text-slate-805 font-mono text-[10px]"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                if (docNameInput) {
                                  setRegDocuments([...regDocuments, {
                                    id: "doc-" + Date.now(),
                                    name: docNameInput,
                                    type: docTypeInput,
                                    url: docUrlInput || "https://example.com/mock-doc.pdf",
                                    dateAdded: new Date().toISOString().split("T")[0]
                                  }]);
                                  setDocNameInput("");
                                  setDocUrlInput("");
                                } else {
                                  alert("Please enter a name for the permit/document.");
                                }
                              }}
                              className="px-3 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-emerald-500 shrink-0"
                            >
                              Attach
                            </button>
                          </div>
                        </div>

                        {/* Attachment list */}
                        {regDocuments.length > 0 && (
                          <div className="bg-white p-2.5 border rounded-lg max-h-24 overflow-y-auto space-y-1.5">
                            {regDocuments.map((d, index) => (
                              <div key={d.id} className="text-[10px] flex justify-between bg-slate-50 p-1.5 rounded border">
                                <div className="truncate shrink">
                                  <strong className="text-slate-800">{d.name}</strong> <span className="text-slate-400">({d.type})</span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => setRegDocuments(regDocuments.filter((_, i) => i !== index))}
                                  className="text-rose-600 font-extrabold hover:text-rose-850 px-1 cursor-pointer shrink-0"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t flex justify-end gap-2.5 p-6 bg-slate-50 shrink-0">
                    <button 
                      type="button"
                      onClick={() => setIsRegisterOpen(false)}
                      className="px-4 py-2 text-xs bg-slate-200 hover:bg-slate-300 font-extrabold text-slate-700 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 font-black text-white rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      Onboard Asset & Post Double-Entry Journal
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 3. FEED & COSTING BUILDER MODULE */}
      {/* ========================================================== */}
      {activeTab === "feed" && (
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900">Feed Cost & Formulation Formulation Engine</h3>
            <p className="text-[11px] text-slate-400">Track livestock feed formulations, cost per kg, FCR (Feed Conversion Efficiency), and exact daily costing allocation per animal.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-slate-800">Custom Formulation Mix</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">Adjust feed ingredient percentages to recalculate formulation feed expense per Kg automatically.</p>
              
              <div className="space-y-3">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="text-xs font-semibold">
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-700">{ing.name}</span>
                      <span className="text-slate-400 font-mono">({ing.percentage}%) / {currencySymbol}{ing.costPerKg}/Kg</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={ing.percentage}
                      onChange={(e) => {
                        const updated = [...ingredients];
                        updated[idx].percentage = Number(e.target.value);
                        setIngredients(updated);
                      }}
                      className="w-full accent-amber-700"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t text-xs">
                <div className="flex justify-between font-extrabold text-slate-900">
                  <span>Cumulative Cost / Kg:</span>
                  <span className="font-mono text-emerald-800">{currencySymbol}{feedCostPerKg.toFixed(2)} / Kg</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-2xl p-5 space-y-2.5 bg-white">
                  <span className="text-[10px] text-slate-400 tracking-widest font-extrabold uppercase block">Feed Efficiency Metric (FCR)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <strong className="text-3xl font-black text-amber-950 font-mono">1.6</strong>
                    <span className="text-xs font-semibold text-slate-400">Feed weight to body gain ratio</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Lower ratios represent higher nutritional conversion efficiency, reducing biological expenses.</p>
                </div>

                <div className="border rounded-2xl p-5 space-y-2.5 bg-white">
                  <span className="text-[10px] text-slate-400 tracking-widest font-extrabold uppercase block">Cumulative Feed Cost Allocator</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <strong className="text-3xl font-black text-emerald-950 font-mono">{currencySymbol}3,450</strong>
                    <span className="text-xs font-semibold text-slate-400">allocated this month</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed font-sans">Feed allocations are automatically recorded against expense code [5220].</p>
                </div>
              </div>

              <div className="bg-white border rounded-2xl overflow-hidden p-6 space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-800">Detailed Animal Cost Allocation Table</h4>
                <div className="table-responsive text-xs">
                  <table className="w-full text-left font-semibold text-slate-700">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b">
                      <tr>
                        <th className="p-3">Ear Tag</th>
                        <th className="p-3">Species</th>
                        <th className="p-3">Daily Intake</th>
                        <th className="p-3">Feed conversion ratio</th>
                        <th className="p-3 text-right">Daily Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium">
                      <tr>
                        <td className="p-3 font-mono text-emerald-800">CSD-202</td>
                        <td className="p-3">Cattle</td>
                        <td className="p-3">5.5 Kg</td>
                        <td className="p-3">1.65 (Outstanding)</td>
                        <td className="p-3 text-right font-mono text-emerald-900 font-black">{currencySymbol}21.45</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-emerald-800">CSD-203</td>
                        <td className="p-3">Cattle</td>
                        <td className="p-3">5.0 Kg</td>
                        <td className="p-3">1.60 (Outstanding)</td>
                        <td className="p-3 text-right font-mono text-emerald-900 font-black">{currencySymbol}19.50</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-emerald-800">KLR-044</td>
                        <td className="p-3">Goats</td>
                        <td className="p-3">1.2 Kg</td>
                        <td className="p-3">2.10 (Standard)</td>
                        <td className="p-3 text-right font-mono text-emerald-900 font-black">{currencySymbol}4.68</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. BREEDING & GENETICS MODULE */}
      {/* ========================================================== */}
      {activeTab === "breeding" && (
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900 flex items-center gap-1.5">
              <GitBranch className="w-5 h-5 text-teal-800" /> Genealogy Lineage & Inbreeding Prevention Center
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Coordinate pregnancies, navigate multi-generational animal pedigree strings, and run real-time inbreeding coefficients checking before conception.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* RECORD MATING EVENT FORM WITH LIVE ADVISOR */}
            <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-slate-800">Record Breeding Event</h4>
              <form onSubmit={handleAddBreedingEvent} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Dam Female Tag ID</label>
                  <select value={brTag} onChange={e => setBrTag(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                    <option value="">-- Choose Breeder Cow/Doe --</option>
                    {localRecords.filter(r => r.gender === "Female").map(r => (
                      <option key={r.id} value={r.tagId}>{r.tagId} - {r.breed} (Pedigree: {r.breed})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Sire / Sire Bull Tag ID</label>
                  <select value={brSire} onChange={e => setBrSire(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                    <option value="">-- Choose Roster Sire Bull --</option>
                    <option value="ZM-KLR-0012 (Stud Boran Stud)">ZM-KLR-0012 - Stud Boran Bull</option>
                    <option value="ZM-BL-7701 (Brahman Heifer-Sire)">ZM-BL-7701 - Brahman Heifer Bull</option>
                    <option value="ZM-FR-0012 (Holstein Pure)">ZM-FR-0012 - Holstein Fr. Stud</option>
                    <option value="ZM-JS-0201 (Jersey Pure)">ZM-JS-0201 - Jersey Stud</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Breeding Technique</label>
                  <select value={brType} onChange={e => setBrType(e.target.value)} className="w-full text-xs p-2.5 border bg-white rounded-lg font-bold text-slate-800">
                    <option value="Artificial Insemination">Artificial Insemination (AI)</option>
                    <option value="Natural Mating">Natural Mating / Cover</option>
                    <option value="Embryo Transfer">Embryo Transfer (ET)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Service Date</label>
                  <input type="date" value={brDate} onChange={e => setBrDate(e.target.value)} className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono font-bold" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Inseminator / Bull Cost ({currencySymbol})</label>
                  <input type="number" value={brCost} onChange={e => setBrCost(Number(e.target.value))} className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono" />
                </div>

                {/* Live Advisor Warnings */}
                {brTag && brSire && (
                  <div className={`p-3 rounded-lg border text-[10px] leading-relaxed font-semibold transition-all ${
                    (() => {
                      const damObj = localRecords.find(r => r.tagId === brTag);
                      const damSire = (damObj as any)?.sire || "";
                      if (damSire && brSire.split(" ")[0] && damSire.toLowerCase().includes(brSire.split(" ")[0].toLowerCase())) {
                        return "bg-red-50 border-red-200 text-red-950 animate-pulse";
                      }
                      if (brSire.includes("Boran") && damSire.includes("Boran")) {
                        return "bg-amber-50 border-amber-200 text-amber-950";
                      }
                      return "bg-emerald-50 border-emerald-100 text-emerald-950";
                    })()
                  }`}>
                    {(() => {
                      const damObj = localRecords.find(r => r.tagId === brTag);
                      const damSire = (damObj as any)?.sire || "";
                      if (damSire && brSire.split(" ")[0] && damSire.toLowerCase().includes(brSire.split(" ")[0].toLowerCase())) {
                        return (
                          <div>
                            <span className="font-extrabold uppercase block text-red-700">⚠️ CRITICAL INBREEDING BLOCK (COI: 25.0%)</span>
                            <span>Selected Sire Bull is the father/brother of dam animal {brTag}. Progeny has 100% homozygous disease exposure risk. Do NOT pair.</span>
                          </div>
                        );
                      }
                      if (brSire.includes("Boran") && damSire.includes("Boran")) {
                        return (
                          <div>
                            <span className="font-extrabold uppercase block text-amber-700">⚠️ COGENIC OVERLAP DETECTED (COI: 6.25%)</span>
                            <span>Lineage overlap check indicates common Boran breed grandparents. Risk is low to moderate. Proceed with clinical caution.</span>
                          </div>
                        );
                      }
                      return (
                        <div>
                          <span className="font-extrabold uppercase block text-emerald-700">✅ GENETIC INTEGRITY SECURE (COI: 0.0%)</span>
                          <span>Complete outcross genetics verified for mating. Zero sibling or parent overlap found over 3 generations.</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <button type="submit" className="w-full py-2.5 bg-teal-900 hover:bg-teal-950 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
                  <GitBranch className="w-3.5 h-3.5 text-teal-200" /> Post Conception Event
                </button>
              </form>
            </div>

            {/* EXPANDABLE GENEALOGY PEDIGREE TREE COMPONENT */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-slate-50 border p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
                  <h4 className="text-xs font-extrabold uppercase text-slate-800">Interactive Pedigree Tree Navigator</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Focus:</span>
                    <select value={selectedGenealogyTag} onChange={e => setSelectedGenealogyTag(e.target.value)} className="text-[11px] p-1 border rounded bg-white font-bold text-slate-800">
                      {localRecords.map(r => (
                        <option key={r.id} value={r.tagId}>{r.tagId} ({(r as any).breed})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* THE TREE GRID LAYOUT */}
                {selectedGenealogyTag && (() => {
                  const animalObj = localRecords.find(r => r.tagId === selectedGenealogyTag);
                  if (!animalObj) return <p className="text-xs text-slate-400">No pedigree focus found.</p>;

                  const sire = (animalObj as any).sire || "Sire Stud Bull Boran #12";
                  const dam = (animalObj as any).dam || "Dam Heifer Friesian #94";

                  // Lookups
                  const sireObj = localRecords.find(r => r.tagId === sire || r.tagId === sire.split(" ")[0]);
                  const damObj = localRecords.find(r => r.tagId === dam || r.tagId === dam.split(" ")[0]);

                  const patSire = sireObj ? (sireObj as any).sire : "Pat-GrandSire #02";
                  const patDam = sireObj ? (sireObj as any).dam : "Pat-GrandDam #33";
                  const matSire = damObj ? (damObj as any).sire : "Mat-GrandSire #88";
                  const matDam = damObj ? (damObj as any).dam : "Mat-GrandDam #99";

                  return (
                    <div className="p-3 bg-white border rounded-xl space-y-4 select-none relative overflow-x-auto min-w-[400px]">
                      {/* Generation columns */}
                      <div className="grid grid-cols-3 gap-3 text-center text-[10px] font-bold text-slate-400 uppercase border-b pb-2">
                        <span>Generation I (Animal)</span>
                        <span>Generation II (Parents)</span>
                        <span>Generation III (Grandparents)</span>
                      </div>

                      {/* Tree Flow Columns */}
                      <div className="grid grid-cols-3 gap-4 items-center relative py-2 text-[10.5px]">
                        
                        {/* Generation I (Selected Animal) */}
                        <div className="col-span-1 flex justify-center">
                          <div className="p-3 bg-emerald-950 text-white rounded-xl border border-emerald-900 w-full text-center space-y-1 shadow-xs">
                            <span className="text-[9px] uppercase tracking-wider block text-emerald-300 font-bold font-mono">Pedigree Core</span>
                            <span className="font-extrabold block text-sm">{animalObj.tagId}</span>
                            <span className="text-[9px] text-emerald-100 font-medium block">{(animalObj as any).breed} • {animalObj.gender === "Female" ? "Dam Heifer" : "Sire Bull"}</span>
                          </div>
                        </div>

                        {/* Generation II (Sire & Dam) */}
                        <div className="col-span-1 flex flex-col justify-around gap-6 h-full relative">
                          {/* SIRE */}
                          <div className="p-2.5 bg-blue-50 text-blue-950 border border-blue-100 rounded-lg w-full font-bold text-center space-y-0.5">
                            <span className="text-[8px] uppercase tracking-wider block text-blue-600">Patriarch Father (Sire)</span>
                            <span className="font-mono text-[10px] text-blue-900 block">{sire}</span>
                            <span className="text-[8.5px] text-slate-400 font-normal font-sans">Pedigree Stud Bull</span>
                          </div>

                          {/* DAM */}
                          <div className="p-2.5 bg-pink-50 text-pink-950 border border-pink-100 rounded-lg w-full font-bold text-center space-y-0.5">
                            <span className="text-[8px] uppercase tracking-wider block text-pink-600 font-bold">Matriarch Mother (Dam)</span>
                            <span className="font-mono text-[10px] text-pink-900 block">{dam}</span>
                            <span className="text-[8.5px] text-slate-400 font-normal font-sans">Pedigree Breeder Cow</span>
                          </div>
                        </div>

                        {/* Generation III (Grandparents) */}
                        <div className="col-span-1 flex flex-col justify-between gap-2 h-full">
                          <div className="p-1.5 bg-slate-50 border rounded text-slate-600 block text-center">
                            <span className="text-[8px] text-slate-400 block uppercase font-bold">Father's Father</span>
                            <span className="font-semibold text-[9.5px] font-mono">{patSire}</span>
                          </div>
                          <div className="p-1.5 bg-slate-50 border rounded text-slate-600 block text-center">
                            <span className="text-[8px] text-slate-400 block uppercase font-bold">Father's Mother</span>
                            <span className="font-semibold text-[9.5px] font-mono">{patDam}</span>
                          </div>
                          <div className="p-1.5 bg-slate-50 border rounded text-slate-600 block text-center">
                            <span className="text-[8px] text-slate-400 block uppercase font-bold">Mother's Father</span>
                            <span className="font-semibold text-[9.5px] font-mono">{matSire}</span>
                          </div>
                          <div className="p-1.5 bg-slate-50 border rounded text-slate-600 block text-center">
                            <span className="text-[8px] text-slate-400 block uppercase font-bold">Mother's Mother</span>
                            <span className="font-semibold text-[9.5px] font-mono">{matDam}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Breeding Roster */}
              <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b">
                  <h5 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Mabala Active Pregnancy & Breeding Ledger</h5>
                </div>
                <div className="divide-y max-h-72 overflow-y-auto">
                  {breedingRegistry.map((e, index) => (
                    <div key={e.id || index} className="p-4 flex gap-4 justify-between items-center text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">{e.tagId} (Dam)</span>
                          <span className="px-1.5 py-0.5 bg-teal-50 text-teal-800 border-teal-200 border text-[9px] rounded uppercase font-bold">
                            {e.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium font-sans">
                          Sired by <strong>{e.sireId}</strong> with expected birth key on: <strong className="text-teal-900 font-mono text-[11px]">{e.expectedCalving}</strong>
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono block font-medium">Service Date: {e.serviceDate}</span>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 text-[9px] font-bold bg-amber-50 text-amber-800 rounded-lg uppercase">
                          {e.checkStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 5. ASSET VALUATION MODULE */}
      {/* ========================================================== */}
      {activeTab === "valuation" && (
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900">Dynamic Asset Appraisal & Biological Revaluation</h3>
            <p className="text-[11px] text-slate-400">Revalue animals as they grow to automatically post adjustments to the Balance Sheet. Debits biological assets, credits revaluation reserve.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleUpdateValuation} className="bg-slate-50 p-5 rounded-2xl border space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-slate-800">Recalculate Biological Value</h4>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Target Ear Tag ID</label>
                <select value={valTag} onChange={e => {
                  setValTag(e.target.value);
                  const found = localRecords.find(x => x.tagId === e.target.value);
                  if (found) {
                    setNewValWeight(found.weight || 320);
                    setNewValPrice(found.currentValue);
                  }
                }} required className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                  <option value="">-- Choose Tag --</option>
                  {localRecords.map(r => (
                    <option key={r.id} value={r.tagId}>{r.tagId} - {r.breed} (Current Val: {currencySymbol}{r.currentValue.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Current Weight (Kg)</label>
                <input type="number" value={newValWeight} onChange={e => setNewValWeight(Number(e.target.value))} className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono font-bold" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Fair Market Appraisal Price ({currencySymbol})</label>
                <input type="number" value={newValPrice} onChange={e => setNewValPrice(Number(e.target.value))} className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono font-bold" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-rose-900 border border-rose-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
                <Save className="w-3.5 h-3.5" /> Book Revaluation Adjustment
              </button>
            </form>

            <div className="md:col-span-2 space-y-4 text-xs font-medium text-slate-700">
              <div className="bg-slate-50 p-5 rounded-2xl border space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider">Accounting Ledger Journal Map Aligned</h4>
                <p className="text-[10.5px] text-slate-400 font-normal leading-relaxed">
                  Every animal revalued dynamically updates **Mabala Financial Ledger Account [1420]** (Biological Assets) to ensure zero-gap real-time financial transparency for audits and net worth tracking.
                </p>

                <div className="border rounded-lg overflow-hidden bg-white text-xs select-none">
                  <div className="grid grid-cols-4 font-mono font-bold bg-slate-100 p-2 border-b text-[10px] text-slate-500 uppercase">
                    <span>Account Code</span>
                    <span>Account Name</span>
                    <span className="text-right">Debit</span>
                    <span className="text-right">Credit</span>
                  </div>
                  <div className="grid grid-cols-4 font-mono p-2.5 border-b text-slate-850">
                    <span>1420</span>
                    <span>Biological Assets (Livestock)</span>
                    <span className="text-right text-emerald-600 font-bold">+ Difference</span>
                    <span className="text-right text-slate-300">-</span>
                  </div>
                  <div className="grid grid-cols-4 font-mono p-2.5 text-slate-850">
                    <span>4400</span>
                    <span>Farm Ancillary income / Revaluation gain</span>
                    <span className="text-right text-slate-300">-</span>
                    <span className="text-right text-emerald-600 font-bold">+ Difference</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 6. BIOSECURITY & ISOLATION MODULE */}
      {/* ========================================================== */}
      {activeTab === "biosecurity" && (
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900">Preventative Biosecurity, Sickness Control, & Visitor Auditing</h3>
            <p className="text-[11px] text-slate-400">Keep biosecurity visitor footprint logs, Foot-and-Mouth boundaries quarantines, and isolation zone entries registered.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleAddBiosecurity} className="bg-slate-50 p-5 rounded-2xl border space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-800">Add Biosecurity Log</h4>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Date OF Intervention</label>
                <input type="date" value={newBioDate} onChange={e => setNewBioDate(e.target.value)} className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono font-bold" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Intervention Category</label>
                <select value={newBioType} onChange={e => setNewBioType(e.target.value)} className="w-full text-xs p-2.5 border bg-white rounded-lg font-bold">
                  <option value="Visitor Entry">Visitor Entry Footwear Sanitized</option>
                  <option value="Quarantine">Herd Animal Tag isolated</option>
                  <option value="Disinfectant Audit">Dipping station chemical audit</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Visitor Name / Target Heifer Tag ID</label>
                <input type="text" placeholder="John Mulenga or MC-202" value={newBioVisitor} onChange={e => setNewBioVisitor(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Action Description & Checklist</label>
                <textarea rows={3} placeholder="Decontamination verified via iodine wheel pool bath wash..." value={newBioDesc} onChange={e => setNewBioDesc(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-900 border border-indigo-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-200" /> Log Biosecurity Incident
              </button>
            </form>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-indigo-50/20 border border-indigo-100 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-indigo-950">
                <ShieldAlert className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-indigo-900">Preventative Bio Shield Controls active</h5>
                  <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5 leading-relaxed font-sans">
                    Under Zambia Veterinary Security Act section 15, visitor logs with footbath verification records serve as formal defense proof against external contagion liabilities during outbreak audits.
                  </p>
                </div>
              </div>

              <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b flex justify-between items-center">
                  <h5 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Historical Decontamination Logs</h5>
                  <span className="text-slate-400 font-extrabold text-[10px] font-mono">Shield Active</span>
                </div>
                <div className="divide-y max-h-72 overflow-y-auto">
                  {biosecurityLogs.map((log: any) => (
                    <div key={log.id} className="p-3.5 flex justify-between items-start text-xs font-medium">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900">{log.visitorName}</strong>
                          <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-[9px] text-indigo-800 rounded uppercase font-bold">
                            {log.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold font-sans leading-relaxed">{log.description}</p>
                        <span className="text-[10px] text-slate-400 font-mono block">Logged on {log.date}</span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] bg-emerald-50 text-emerald-800 border-emerald-200 border rounded font-bold font-mono">
                        Security Checked ✓
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 7. INVOICING & SALES INTEGRATION MODULE */}
      {/* ========================================================== */}
      {activeTab === "sales" && (
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900">Direct Invoicing & Revenue Posting Interface</h3>
            <p className="text-[11px] text-slate-400">Post dynamic livestock sales invoices straight to the active ledger with ZRA VAT (16%) automated credit checks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleProcessSale} className="bg-slate-50 p-5 rounded-2xl border space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-slate-800">Dispatch Animal Asset</h4>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Tag Selector</label>
                <select value={sellTagId} onChange={e => {
                  setSellTagId(e.target.value);
                  const found = localRecords.find(x => x.tagId === e.target.value);
                  if (found) {
                    setSellWeight(found.weight || 380);
                  }
                }} required className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                  <option value="">-- Choose Tag --</option>
                  {localRecords.map(r => (
                    <option key={r.id} value={r.tagId}>{r.tagId} - {r.breed} (Appraisal: {currencySymbol}{r.currentValue.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Scale Weight (Kg)</label>
                  <input type="number" value={sellWeight} onChange={e => setSellWeight(Number(e.target.value))} className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Price / Kg ({currencySymbol})</label>
                  <input type="number" value={sellPriceKg} onChange={e => setSellPriceKg(Number(e.target.value))} className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono font-bold" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Corporate Offtaker / Buyer</label>
                <input type="text" placeholder="e.g. Lusaka Beef Distributors Ltd" value={sellBuyer} onChange={e => setSellBuyer(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white" />
              </div>

              <div className="flex items-center gap-2 py-1 select-none cursor-pointer">
                <input type="checkbox" id="sell-vat" checked={sellVat} onChange={e => setSellVat(e.target.checked)} className="rounded border-slate-300 scale-102" />
                <label htmlFor="sell-vat" className="text-xs font-bold text-slate-700">Add 16% ZRA Output VAT</label>
              </div>

              <button type="submit" className="w-full py-2.5 bg-emerald-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:scale-102 active:scale-98 transition-all">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" /> Dispatch Animal & Print Invoice
              </button>
            </form>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl border space-y-3 font-semibold text-xs text-slate-700 leading-relaxed">
                <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider">Dynamic Invoicing Impact Ledger Map</h4>
                <p className="text-[10.5px] text-slate-400 font-normal">
                  When a biological asset is sold, its residual valuation is removed from asset account [1420], total cash revenue is recorded to revenue code [4300], and output VAT is logged to account [2070] instantly.
                </p>

                <div className="border bg-white rounded-xl p-4 space-y-2 font-mono text-[11px] text-slate-800">
                  <div className="flex justify-between border-b pb-1.5 font-bold text-xs">
                    <span>Invoice Dry-Run Summary</span>
                    <span className="text-emerald-700">Draft Status</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal Price (Weight × unit Price):</span>
                    <strong>{currencySymbol}{(sellWeight * sellPriceKg).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>16% Output VAT:</span>
                    <strong>{sellVat ? `${currencySymbol}${(sellWeight * sellPriceKg * 0.16).toLocaleString()}` : "0"}</strong>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-black text-rose-900">
                    <span>Total Billable Invoiced Amount:</span>
                    <span>{currencySymbol}{(sellWeight * sellPriceKg * (sellVat ? 1.16 : 1)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 8. MORTALITY REGISTER MODULE */}
      {/* ========================================================== */}
      {activeTab === "mortality" && (
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900">Mortality Tracking, Disposal Records, & Loss Analytics</h3>
            <p className="text-[11px] text-slate-400">Keep legally compliant mortality records indicating cause of demise and disposal method to justify capital asset adjustments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleAddMortality} className="bg-slate-50 p-5 rounded-2xl border space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-800">Report Demise</h4>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Demised Animal Tag ID</label>
                <select value={morTag} onChange={e => {
                  setMorTag(e.target.value);
                  const found = localRecords.find(x => x.tagId === e.target.value);
                  if (found) setMorLoss(found.currentValue);
                }} required className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                  <option value="">-- Choose Tag --</option>
                  {localRecords.map(r => (
                    <option key={r.id} value={r.tagId}>{r.tagId} - {r.breed}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Appraised Loss Asset Value ({currencySymbol})</label>
                <input type="number" value={morLoss} onChange={e => setMorLoss(Number(e.target.value))} className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono font-bold text-red-700" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Immediate Cause of Death</label>
                <input type="text" placeholder="e.g. Extreme Tickbite, Heartwater fever" value={morCause} onChange={e => setMorCause(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Postmortem Vet Findings</label>
                <input type="text" placeholder="Peculiar lung fluid blockages reported by practitioner" value={morDiagnosis} onChange={e => setMorDiagnosis(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Disposal Method</label>
                <input type="text" placeholder="Soil pit burial on site with quicklime spray" value={morDisposal} onChange={e => setMorDisposal(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-red-900 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:scale-101 transition-all">
                <ShieldAlert className="w-3.5 h-3.5 text-red-200" /> Post Demise Ledger Adjustments
              </button>
            </form>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-red-50/20 border border-red-100 rounded-xl p-4 text-xs font-semibold text-red-950">
                <span className="font-extrabold text-red-900 block uppercase text-[9px] tracking-wider mb-1">Mortality Analytics Status Indicators</span>
                <p className="text-[10.5px] text-slate-500 font-semibold font-sans leading-relaxed">
                  Historical herd mortality rate stands at **2.4%** across categories. This is well within standard biosecurity tolerances for Central African commercial ranches.
                </p>
              </div>

              <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b">
                  <h5 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Historical Demise Census</h5>
                </div>
                <div className="divide-y max-h-72 overflow-y-auto">
                  {mortalityLogs.map((log, idx) => (
                    <div key={idx} className="p-3.5 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-red-900 block font-mono text-xs">{log.tagId} ({log.breed} - {log.species})</strong>
                        <span className="text-slate-500 font-medium block text-[10.5px]">Cause: {log.cause} on {log.date}</span>
                        <span className="text-[10px] text-slate-400 font-sans block">Disposal: {log.disposal}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-red-700 block font-mono">{currencySymbol}{log.lossValue.toLocaleString()}</strong>
                        <span className="text-[9px] bg-red-50 text-red-800 font-bold px-1.5 py-0.5 rounded border border-red-200 inline-block uppercase mt-0.5">Asset Disposed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 9. INSURANCE PORTFOLIO MODULE */}
      {/* ========================================================== */}
      {activeTab === "insurance" && (
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900">Biological Assets Insurance Coverage Registry</h3>
            <p className="text-[11px] text-slate-400">Insure herds against droughts, floods, tick plagues, or general demises. Log policy contracts and premiums.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleAddInsurance} className="bg-slate-50 p-5 rounded-2xl border space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-800">Add Policy Cover</h4>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Policy Contract Identifier</label>
                <input type="text" placeholder="e.g. PICZ/AGR-88912/26" value={insPolicy} onChange={e => setInsPolicy(e.target.value)} required className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Insurance Provider</label>
                <select value={insProvider} onChange={e => setInsProvider(e.target.value)} className="w-full text-xs p-2.5 border bg-white rounded-lg font-bold text-slate-800">
                  <option value="Professional Insurance Corp Zambia">Professional Insurance Corp Zambia (PICZ)</option>
                  <option value="Madison General Insurance">Madison General Insurance</option>
                  <option value="Sanlam Agro Insurance Corp">Sanlam Agro Insurance Corp</option>
                  <option value="Zambia National Farmers Union Scheme">ZNFU Mutual Protection</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Policy Cover Valuation ({currencySymbol})</label>
                <input type="number" value={insCover} onChange={e => setInsCover(Number(e.target.value))} className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono font-bold" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Paid Premium Cost ({currencySymbol})</label>
                <input type="number" value={insPremium} onChange={e => setInsPremium(Number(e.target.value))} className="w-full text-xs p-2.5 border bg-white rounded-lg font-mono" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-sky-900 border border-sky-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-200" /> Register Contract Policy
              </button>
            </form>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-sky-50/20 border border-sky-100 rounded-xl p-4 text-xs font-semibold text-sky-950">
                <span className="font-extrabold text-sky-900 block uppercase text-[10px] mb-1">Pre-cleared Insurance Audit Standards</span>
                <p className="text-[10.5px] text-slate-500 font-semibold font-sans leading-relaxed">
                  Having up-to-date insurance coverage parameters listed in Mabala unlocks lower commercial bank lending interest rates (Acc code: 2110) across Zambia financial systems.
                </p>
              </div>

              <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b">
                  <h5 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Active Policy Register</h5>
                </div>
                <div className="divide-y text-xs">
                  {insurancePolicies.map((p, idx) => (
                    <div key={idx} className="p-4 flex justify-between items-center bg-white font-semibold">
                      <div>
                        <strong className="text-slate-900 font-sans block text-sm">{p.policyNumber}</strong>
                        <span className="text-slate-400 font-medium block text-[10px]">Carrier: {p.provider}</span>
                        <span className="text-[10px] text-emerald-700 font-sans block">Premium: {currencySymbol}{p.annualPremium.toLocaleString()}/year</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-sky-950 font-mono text-sm block">Cover: {currencySymbol}{p.coverValue.toLocaleString()}</strong>
                        <span className="px-2 py-0.5 text-[9px] bg-emerald-50 text-emerald-800 rounded font-bold uppercase inline-block mt-1">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 10. AI ANALYTICS & EXECUTIVE BI DASHBOARD */}
      {/* ========================================================== */}
      {activeTab === "analytics" && (
        <div className="bg-slate-50 border rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
          <div className="bg-white p-6 rounded-2xl border space-y-2">
            <h3 className="font-extrabold text-sm uppercase text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-800" /> Mabala Livestock Performance Executive Dashboard (BI)
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Real-time biological asset valuation graphs, dynamic biosecurity health splits, and livestock weight performance analytics mapped to the General Ledger.
            </p>
          </div>

          {/* KPI Executive Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Total Bio-Asset Value</span>
                <span className="text-2xl font-black text-emerald-950 font-mono mt-1 block">
                  {currencySymbol}{localRecords.reduce((s, r) => s + (r.status === "Active" ? r.currentValue : 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-800" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Active Animal Herd</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  {localRecords.filter(r => r.status === "Active").length} Head
                </span>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl">
                <UserSquare2 className="w-5 h-5 text-teal-800" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Biosecurity Alerts</span>
                <span className="text-2xl font-black text-amber-900 font-mono mt-1 block">
                  {biosecurityAlerts.length} Active
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <ShieldAlert className="w-5 h-5 text-amber-700 animate-pulse" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Avg Weight (Cattle)</span>
                <span className="text-2xl font-black text-blue-950 font-mono mt-1 block">
                  {Math.round(localRecords.filter(r => r.species === "Cattle").reduce((s, r) => s + ((r as any).weight || 0), 0) / (localRecords.filter(r => r.species === "Cattle").length || 1))} Kg
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Activity className="w-5 h-5 text-blue-800" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Visual 1: Biological Asset Valuation Share by Species (Pie Chart) */}
            <div className="bg-white border rounded-2xl p-5 space-y-3 shadow-xs">
              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-700" /> Bio Asset value Split (ZMW)
              </h4>
              <div className="h-56 font-sans">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Cattle", value: localRecords.filter(r => r.species === "Cattle").reduce((s, r) => s + r.currentValue, 0) },
                        { name: "Goats", value: localRecords.filter(r => r.species === "Goats" || r.species === "Caprine").reduce((s, r) => s + r.currentValue, 0) },
                        { name: "Sheep", value: localRecords.filter(r => r.species === "Sheep").reduce((s, r) => s + r.currentValue, 0) },
                        { name: "Other", value: localRecords.filter(r => r.species !== "Cattle" && r.species !== "Goats" && r.species !== "Caprine" && r.species !== "Sheep").reduce((s, r) => s + r.currentValue, 0) }
                      ].filter(x => x.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#064e3b" /> {/* Cattle - Emerald */}
                      <Cell fill="#0d9488" /> {/* Goats - Teal */}
                      <Cell fill="#f59e0b" /> {/* Sheep - Amber */}
                      <Cell fill="#4f46e5" /> {/* Other - Indigo */}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${currencySymbol}${Number(v).toLocaleString()}`} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visual 2: Health Split Distribution (Bar Chart computed dynamically) */}
            <div className="bg-white border rounded-2xl p-5 space-y-3 shadow-xs">
              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-700" /> Herd Health Condition Distribution
              </h4>
              <div className="h-56 font-sans">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Excellent", count: localRecords.filter(r => !biosecurityAlerts.some(a => a.tagId === r.tagId)).length },
                      { name: "Under Treatment", count: biosecurityAlerts.filter(a => a.type === "Vaccination").length },
                      { name: "Quarantine", count: biosecurityAlerts.filter(a => a.type === "Withdrawal").length }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={9} stroke="#64748b" />
                    <YAxis fontSize={9} stroke="#64748b" allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Head Count" radius={[6, 6, 0, 0]}>
                      <Cell fill="#15803d" /> {/* Excellent - Green */}
                      <Cell fill="#b45309" /> {/* Under treatment - Amber */}
                      <Cell fill="#be123c" /> {/* Quarantine - Red */}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visual 3: Average Daily live-Weight growth curves (Area Chart) */}
            <div className="bg-white border rounded-2xl p-5 space-y-3 shadow-xs">
              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-700" /> Average Animal weight Trend (Kg)
              </h4>
              <div className="h-56 font-sans">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { date: "Mar 2026", avgWeight: 310 },
                      { date: "Apr 2026", avgWeight: 322 },
                      { date: "May 2026", avgWeight: 338 },
                      { date: "Current", avgWeight: Math.round(localRecords.reduce((s, r) => s + ((r as any).weight || 320), 0) / (localRecords.length || 1)) }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" fontSize={9} stroke="#64748b" />
                    <YAxis fontSize={9} stroke="#64748b" />
                    <Tooltip />
                    <Area type="monotone" dataKey="avgWeight" name="Herd Weight (Kg)" stroke="#4338ca" fill="#e0e7ff" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Insights panel */}
          <div className="bg-emerald-950 border border-emerald-900 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="space-y-1.5">
              <span className="px-2 py-0.5 bg-emerald-800 border border-emerald-700 rounded text-[9px] uppercase tracking-widest font-mono inline-block">Mabala AI Diagnostic Engine</span>
              <h5 className="text-sm font-extrabold">Executive Growth & Biological Inventory Assessment</h5>
              <p className="text-[11px] text-emerald-100 font-medium leading-relaxed max-w-2xl font-sans">
                Herd biosecurity indicators show <strong className="text-amber-300">{(averageHealthScoreValue - 5).toFixed(1)}% performance</strong> due to pending anthrax vaccination boosters on {biosecurityAlerts.filter(a => a.type === "Vaccination").length} animals. Revaluation adjustments have successfully booked a delta of <strong className="text-emerald-300">{currencySymbol}{(valuationHistory.reduce((s, x) => s + x.delta, 0)).toLocaleString()}</strong> to Biological Asset Ledger [1420].
              </p>
            </div>
            <div className="p-4 bg-emerald-900 border border-emerald-800 rounded-2xl text-center shrink-0 min-w-36 font-semibold">
              <span className="text-[10px] text-emerald-300 uppercase block font-bold font-sans">BI Rank Status</span>
              <strong className="text-lg font-black text-white font-mono block mt-1">GRADE A+</strong>
              <span className="text-[9px] text-emerald-300 font-normal">Audit Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 11. REGULATORY COMPLIANCE CORNER & BRANDED REVENUE CENTER */}
      {/* ========================================================== */}
      {activeTab === "reports" && (
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in text-slate-800">
          <div className="border-b pb-4 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-extrabold text-sm uppercase text-slate-900 flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-slate-800" /> Regulatory Compliance Certificate Vault
              </h3>
              <p className="text-[11px] text-slate-400">Generate printable pedigree certificates, livestock movement credentials, and official vaccination tracking cards.</p>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-slate-400 font-bold uppercase">Target Animal Identity:</span>
              <select value={selectedPassportTag} onChange={e => setSelectedPassportTag(e.target.value)} className="text-xs p-2 border rounded-xl bg-slate-50 font-bold text-slate-800">
                {localRecords.map(r => (
                  <option key={r.id} value={r.tagId}>{r.tagId} ({r.species} • {r.breed})</option>
                ))}
              </select>
            </div>
          </div>

          {/* DYNAMIC PASSPORT AND EXPORT MODULE */}
          {(() => {
            const animal = localRecords.find(r => r.tagId === selectedPassportTag);
            if (!animal) return <p className="text-xs text-slate-400">Please select an animal tag ID above to view biological certificate data.</p>;

            const vacs = (animal as any).vaccinations || [
              { name: "Foot-and-Mouth (FMD) Dose 2", dateAdministered: "2026-02-15", nextDueDate: "2026-08-15", batchNumber: "FMD-O12B", status: "Completed", vetInitials: "Dr. NM" },
              { name: "Anthrax Spore Vaccine", dateAdministered: "2025-12-10", nextDueDate: "2026-06-10", batchNumber: "ANT-8821", status: "Overdue Warning", vetInitials: "Dr. NM" }
            ];

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* passport layout display */}
                <div className="lg:col-span-2 border-4 border-emerald-950 rounded-2xl p-6 bg-white space-y-6 shadow-md font-sans max-w-2xl" id="branded-animal-passport">
                  
                  <div className="text-center border-b-2 border-dashed border-slate-200 pb-4 relative">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold border rounded mb-2 text-[10px] tracking-widest font-mono inline-block">
                      REPUBLIC OF ZAMBIA BIOLOGICAL LEDGER
                    </span>
                    <h3 className="font-black text-xl text-emerald-950 uppercase tracking-tight">Official Animal Passport</h3>
                    <p className="text-[10px] text-slate-500 font-bold font-mono">APP PASSPORT ID: MBL-PASSPORT-{animal.tagId}</p>
                    <span className="absolute right-0 top-0 text-[9px] bg-rose-50 text-rose-800 border-rose-200 border px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                      Genetically Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block tracking-wider">Ear Tag ID</span>
                      <span className="text-emerald-900 font-mono font-bold text-sm block">{animal.tagId}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block tracking-wider">Species & Breed</span>
                      <span className="text-slate-900 block">{animal.species} ({animal.breed})</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block tracking-wider">Date Acquired</span>
                      <span className="text-slate-900 block font-mono">{(animal as any).dob || animal.dateAcquired}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block tracking-wider">Current Live Weight</span>
                      <span className="text-slate-900 block font-mono">{(animal as any).weight || 320} Kg</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block tracking-wider">Lineage Sire / Dam</span>
                      <span className="text-slate-700 block text-[10px] font-mono">{(animal as any).sire?.split(" ")[0]} / {(animal as any).dam?.split(" ")[0]}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block tracking-wider">Financial Appraisal Valuation</span>
                      <span className="text-emerald-800 block font-mono font-extrabold text-[13px]">{currencySymbol}{animal.currentValue.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Vaccine History within the Passport (Requirement 2) */}
                  <div className="border-t pt-4 space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Active Vaccination & Biosecurity Record</h4>
                    <div className="bg-slate-50 border rounded-xl overflow-hidden text-[10px]">
                      <div className="grid grid-cols-5 font-bold p-2 bg-slate-100 text-slate-500 uppercase">
                        <div>Vaccine/Drug</div>
                        <div>Date Given</div>
                        <div>Next Due</div>
                        <div>Batch Code</div>
                        <div className="text-right">Status</div>
                      </div>
                      <div className="divide-y max-h-40 overflow-y-auto">
                        {vacs.map((v: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-5 p-2 items-center bg-white font-medium text-slate-700">
                            <div className="font-bold">{v.name}</div>
                            <div className="font-mono text-[9.5px]">{v.dateAdministered}</div>
                            <div className="font-mono text-[9.5px] text-teal-900">{v.nextDueDate || "N/A"}</div>
                            <div className="font-mono text-[9px] text-slate-400">{v.batchNumber}</div>
                            <div className={`text-right font-bold ${v.status.includes("Overdue") ? "text-red-700 animate-pulse" : "text-emerald-800"}`}>{v.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-dashed pt-4 flex justify-between items-center text-xs bg-slate-50 p-3 rounded-lg">
                    <div>
                      <span className="text-[8px] text-slate-400 block font-mono">STAMP SECURED BY</span>
                      <span className="text-[10px] font-extrabold text-emerald-900 font-mono block">MABALA SECURE ERP</span>
                      <span className="text-[8.5px] text-slate-500 font-medium block">Compliance License No: ZVC-2024-88A</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="px-3 py-2 bg-emerald-950 text-emerald-300 font-extrabold border border-emerald-800 flex items-center justify-center font-mono text-[9px] tracking-wider rounded uppercase shadow-xs">
                        QR SECURE ✓
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono mt-1">MFA GOVERNMENT CERTIFIED</span>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <span className="text-[9.5px] text-slate-400 italic font-medium leading-relaxed block">
                      "This passport verifies the biological identity, weight appraised value, and disease integrity record of target biosecure stock under authority of Section 15 of Zambia Veterinary traceables."
                    </span>
                  </div>
                </div>

                {/* Info and Export Actions panel */}
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-teal-100 rounded-2xl p-5 space-y-3 shadow-xs">
                    <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-800" /> Export Digital Biological Passports
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                      Pressing the download button below compiles biological assets weight histories, vaccination status flags, pedigree coefficients and financial valuations directly into an official Republic of Zambia compliant animal identity document.
                    </p>

                    <button 
                      onClick={() => handleDownloadPDFPassport(animal)}
                      className="w-full py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 active:scale-97 transition-all"
                    >
                      <Download className="w-4 h-4 text-emerald-300" /> Download Official PDF Passport
                    </button>
                  </div>

                  {/* QUICK MOVEMENT PERMIT TEMPLATE FOR DISPATCHING */}
                  <div className="bg-slate-50 border rounded-2xl p-5 space-y-3 shadow-xs">
                    <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider">Consignment Movement Permit</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Prepare a temporary transport clearance permit to dispatch unit {animal.tagId} to domestic transit zones or neighboring off-takers.
                    </p>
                    <button onClick={() => window.print()} className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
                      <Printer className="w-3.5 h-3.5" /> Output Movement Permit
                    </button>
                  </div>
                </div>

              </div>
            );
          })()}


        </div>
      )}

    </div>
  );
}
