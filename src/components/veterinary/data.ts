import { VetClient, VetStaff, VetAppointment, ClinicalRecord, MovementCard, LabSample, VaccineCampaign, DiseaseOutbreak, MedicationInventory, VetWalletTx } from "./types";

// Credit deduction cost sheet configurator (administrators can modify this dynamically in-app!)
export interface CreditCostItem {
  id: string;
  serviceName: string;
  creditsCost: number;
}

export const INITIAL_CREDIT_COSTS: CreditCostItem[] = [
  { id: "client_reg", serviceName: "Client Profile Registration", creditsCost: 5 },
  { id: "farm_onboard", serviceName: "Farm Portfolio Onboarding", creditsCost: 10 },
  { id: "consult_rec", serviceName: "Clinical Consultation Medical Log", creditsCost: 15 },
  { id: "vaccine_rec", serviceName: "Vaccination Record & Certificate Issuing", creditsCost: 8 },
  { id: "movement_card", serviceName: "QR-Verified Movements Permit", creditsCost: 20 },
  { id: "ai_diagnose", serviceName: "AI Disease Prediction & Copilot Support", creditsCost: 12 },
  { id: "laboratory_test", serviceName: "Laboratory Sample Test Approval", creditsCost: 10 },
  { id: "surveillance", serviceName: "Outbreak Epidemiological Notification Report Log", creditsCost: 8 }
];

export interface CreditBundle {
  id: string;
  name: string;
  credits: number;
  priceZmw: number;
  bonusCredits: number;
  promoCode?: string;
}

export const CREDIT_BUNDLES: CreditBundle[] = [
  { id: "bundle-100", name: "Starter Bundle", credits: 100, priceZmw: 220, bonusCredits: 10 },
  { id: "bundle-250", name: "Standard Bundle", credits: 250, priceZmw: 500, bonusCredits: 30 },
  { id: "bundle-500", name: "Professional Bundle", credits: 500, priceZmw: 950, bonusCredits: 75 },
  { id: "bundle-1000", name: "Network Bundle", credits: 1000, priceZmw: 1800, bonusCredits: 180 },
  { id: "bundle-2500", name: "Commercial Bundle", credits: 2500, priceZmw: 4200, bonusCredits: 500 },
  { id: "bundle-5000", name: "Enterprise Bundle", credits: 5000, priceZmw: 8000, bonusCredits: 1200 },
  { id: "bundle-10000", name: "Institutional Bundle", credits: 10000, priceZmw: 15000, bonusCredits: 3000 }
];

export const INITIAL_STAFF: VetStaff[] = [
  { id: "vet-noah", name: "Dr. Noah Mulenga", role: "Veterinarian", email: "nmulenga@mabala.vet", status: "Active" },
  { id: "vet-sibeso", name: "Sibeso Nalungwe", role: "Veterinary Technician", email: "snalungwe@mabala.vet", status: "Active" },
  { id: "vet-mwale", name: "Kelvin Mwale", role: "Laboratory Technician", email: "kmwale@mabala.vet", status: "Active" },
  { id: "vet-phiri", name: "Agness Phiri", role: "Pharmacist", email: "aphiri@mabala.vet", status: "Active" },
  { id: "vet-reception", name: "Mutale Kabwe", role: "Receptionist", email: "reception@mabala.vet", status: "Active" }
];

export const INITIAL_CLIENTS: VetClient[] = [
  {
    id: "cl-001",
    name: "Mukuni Ranching Co-op",
    type: "Cooperative",
    contactPerson: "Charles Mukuni",
    phone: "0977461821",
    email: "charles@mukuni.org",
    address: "Plot 882, Mosi-o-Tunya Rd",
    district: "Livingstone",
    province: "Southern Province",
    gpsCoords: "-17.8329, 25.8569",
    herdSize: 450,
    riskCategory: "Moderate",
    onboardedDate: "2026-01-12",
    assignedVetId: "vet-noah"
  },
  {
    id: "cl-002",
    name: "Green Valley Dairy Farms",
    type: "Dairy Farm",
    contactPerson: "Agatha Banda",
    phone: "0966382199",
    email: "agatha@valley-milk.zm",
    address: "Gwembe Valley Settlement Sector A",
    district: "Choma",
    province: "Southern Province",
    gpsCoords: "-16.8221, 26.9812",
    herdSize: 180,
    riskCategory: "Low",
    onboardedDate: "2026-02-05",
    assignedVetId: "vet-sibeso"
  },
  {
    id: "cl-003",
    name: "Katete Pork Producers",
    type: "Pig Farm",
    contactPerson: "John Phiri",
    phone: "0955812322",
    email: "johnphiri@gmail.com",
    address: "Off Great East Road, km 12",
    district: "Katete",
    province: "Eastern Province",
    gpsCoords: "-14.0511, 32.0421",
    herdSize: 620,
    riskCategory: "High",
    onboardedDate: "2026-03-24",
    assignedVetId: "vet-noah"
  },
  {
    id: "cl-004",
    name: "Mambilima Goat Settlement",
    type: "Goat Farm",
    contactPerson: "Josephine Mwewa",
    phone: "0972412582",
    email: "mwewa_farm@luapulamail.zm",
    address: "Mambilima Falls Sector D",
    district: "Mansa",
    province: "Luapula Province",
    gpsCoords: "-10.5188, 28.5812",
    herdSize: 310,
    riskCategory: "Moderate",
    onboardedDate: "2026-04-10",
    assignedVetId: "vet-sibeso"
  }
];

export const INITIAL_APPOINTMENTS: VetAppointment[] = [
  {
    id: "apt-1",
    clientId: "cl-001",
    clientName: "Mukuni Ranching Co-op",
    type: "Herd Health Inspection",
    category: "Mobile Vet Booking",
    dateTime: "2026-06-18T09:00",
    status: "Pending",
    assignedVetId: "vet-noah",
    routeLocation: "Mukuni Main pastures - Livingstone"
  },
  {
    id: "apt-2",
    clientId: "cl-003",
    clientName: "Katete Pork Producers",
    type: "Vaccination",
    category: "Emergency",
    dateTime: "2026-06-19T14:30",
    status: "Pending",
    assignedVetId: "vet-sibeso",
    routeLocation: "Great East Road Site, Katete"
  },
  {
    id: "apt-3",
    clientId: "cl-002",
    clientName: "Green Valley Dairy Farms",
    type: "Pregnancy Diagnosis",
    category: "Walk-in",
    dateTime: "2026-06-20T11:00",
    status: "Pending",
    assignedVetId: "vet-noah",
    routeLocation: "Choma Town Vet Post"
  }
];

export const INITIAL_CLINICAL_RECORDS: ClinicalRecord[] = [
  {
    id: "clin-001",
    date: "2026-06-12",
    clientId: "cl-001",
    clientName: "Mukuni Ranching Co-op",
    animalId: "BOV-2019-Z29",
    species: "Bovine (Steer)",
    diagnosis: "East Coast Fever (Theileriosis)",
    clinicalFindings: "Enlarged pre-scapular lymph nodes, pyrexia (41.2°C), labored breathing and watery eyes. Blood smears confirm Koch's blue bodies.",
    treatmentPlanned: "Administer Buparvaquone (Butalex) at 2.5mg/kg Intramuscularly. Suppressive therapy with Oxytetracycline (Terramycin LA) for secondary lung infections.",
    prescriptions: ["Buparvaquone (Butalex) Injection", "Terramycin LA Long-acting antibiotic", "Ketoprofen (Nsaid pain relief)"],
    cost: 1350,
    status: "Under Treatment",
    gpsCoords: "-17.8341, 25.8561",
    vetSignature: "Dr. Noah Mulenga"
  },
  {
    id: "clin-002",
    date: "2026-06-14",
    clientId: "cl-002",
    clientName: "Green Valley Dairy Farms",
    animalId: "COW-DRY-38A",
    species: "Bovine (Holstein Heifer)",
    diagnosis: "Acute Coliform Mastitis",
    clinicalFindings: "Left-rear teat swollen, chordate fluid and blood clots. Body temperature 40.5°C, rumination stopped.",
    treatmentPlanned: "Intramammary infusions of Ampicillin (Cobactan), local cold compressor therapy, systemic penicillin, fluid hydration therapy.",
    prescriptions: ["Cobactan Intramammary Infusion", "Systemic Benzathine Penicillin G", "Multi-Vitamin B-Complex Support"],
    cost: 820,
    status: "Recovering",
    gpsCoords: "-16.8219, 26.9808",
    vetSignature: "Sibeso Nalungwe"
  }
];

export const INITIAL_MOVEMENTS: MovementCard[] = [
  {
    id: "mov-001",
    permitNo: "ZAM-VET-2026-88091",
    dateIssued: "2026-06-10",
    originDistrict: "Choma",
    destinationDistrict: "Lusaka Central",
    originFarm: "Green Valley Dairy Farms Sector B",
    destinationFarm: "Bonaventure Veterinary Feedlot Hub",
    animalCount: 35,
    species: "Bovine (Dairy Steers)",
    healthClearanceUuid: "hc-882ab31d-bcef",
    status: "Approved"
  },
  {
    id: "mov-002",
    permitNo: "ZAM-VET-2026-99211",
    dateIssued: "2026-06-15",
    originDistrict: "Livingstone",
    destinationDistrict: "Choma",
    originFarm: "Mukuni Ranching Co-op Sector D",
    destinationFarm: "Batoka Livestock Exhibition Grounds",
    animalCount: 12,
    species: "Bovine (Heifers)",
    healthClearanceUuid: "hc-112cb90e-aaaa",
    status: "Approved"
  }
];

export const INITIAL_LABS: LabSample[] = [
  {
    id: "lab-001",
    dateCollected: "2026-06-13",
    clientId: "cl-001",
    clientName: "Mukuni Ranching Co-op",
    sampleType: "Blood",
    testRequired: "Serology",
    batchBarcode: "MBL-S-1011A",
    status: "Result Approval",
    testResultsNotes: "Ehrlichia ruminantium identified via ELISA testing. Heartwater disease confirmed in blood smear vector examination.",
    approvedBy: "Kelvin Mwale"
  },
  {
    id: "lab-002",
    dateCollected: "2026-06-14",
    clientId: "cl-002",
    clientName: "Green Valley Dairy Farms",
    sampleType: "Milk",
    testRequired: "Milk Quality Testing",
    batchBarcode: "MBL-S-1012C",
    status: "Completed",
    milkQualityGrade: "A",
    testResultsNotes: "Somatic Cell Count (SCC) at 120,000 cells/ml. Bacterial plates negative for E.coli and Streptococcus residues. Exceptional premium grade milk.",
    approvedBy: "Kelvin Mwale"
  },
  {
    id: "lab-003",
    dateCollected: "2026-06-15",
    clientId: "cl-004",
    clientName: "Mambilima Goat Settlement",
    sampleType: "Fecal",
    testRequired: "Parasitology",
    batchBarcode: "MBL-S-1015X",
    status: "Processing",
    testResultsNotes: "Sample registered, centrifugation complete, preparing McMaster egg-counting slide frames.",
    approvedBy: ""
  }
];

export const INITIAL_CAMPAIGNS: VaccineCampaign[] = [
  {
    id: "camp-1",
    title: "Choma District Foot & Mouth Ring-Vaccination campaign",
    disease: "Foot and Mouth Disease (FMD)",
    targetDistrict: "Choma",
    targetCount: 5000,
    administeredCount: 3820,
    startDate: "2026-06-01",
    endDate: "2026-06-25",
    status: "Active"
  },
  {
    id: "camp-2",
    title: "Southern Province Anthrax Prophylactic Defense Campaign",
    disease: "Anthrax Spore",
    targetDistrict: "Livingstone / Choma / Mazabuka",
    targetCount: 12000,
    administeredCount: 0,
    startDate: "2026-07-10",
    endDate: "2026-08-10",
    status: "Planned"
  }
];

export const INITIAL_OUTBREAKS: DiseaseOutbreak[] = [
  {
    id: "out-001",
    diseaseName: "African Swine Fever",
    district: "Chisamba",
    province: "Central Province",
    confirmedCases: 42,
    mortalities: 38,
    gpsCoords: "-14.9602, 28.3221",
    dateReported: "2026-06-08",
    quarantineSectors: "Chisamba East commercial swine units, perimeter fences isolated",
    severity: "Critical",
    status: "Active Alert"
  },
  {
    id: "out-002",
    diseaseName: "Foot and Mouth Disease (FMD - SAT 2)",
    district: "Choma",
    province: "Southern Province",
    confirmedCases: 110,
    mortalities: 2,
    gpsCoords: "-16.8188, 26.9899",
    dateReported: "2026-06-11",
    quarantineSectors: "Batoka ward, veterinary road checkpoint active, livestock transport halted",
    severity: "High",
    status: "Under Isolation"
  },
  {
    id: "out-003",
    diseaseName: "East Coast Fever",
    district: "Livingstone",
    province: "Southern Province",
    confirmedCases: 15,
    mortalities: 9,
    gpsCoords: "-17.8211, 25.8501",
    dateReported: "2026-06-14",
    quarantineSectors: "Local Mukuni-area grazing pasture block Alpha restricted",
    severity: "Medium",
    status: "Active Alert"
  }
];

export const INITIAL_MEDICATIONS: MedicationInventory[] = [
  {
    id: "med-001",
    name: "Oxisolve 200 LA (Oxytetracycline)",
    category: "Antibiotics",
    dosageForm: "Liquid Injectable, 100ml",
    batchNumber: "OTC-2025-A1",
    expiryDate: "2027-12-10",
    qtyAvailable: 45,
    unitCost: 180,
    reorderLevel: 10
  },
  {
    id: "med-002",
    name: "FMD SAT-1/2 Dual Polyvalent Vaccine",
    category: "Vaccines",
    dosageForm: "Vials, 50-Doses pack",
    batchNumber: "FMD-O99B",
    expiryDate: "2026-11-20",
    qtyAvailable: 15,
    unitCost: 650,
    reorderLevel: 5,
    coldChainRegimen: "2°C to 8°C (Constant)"
  },
  {
    id: "med-003",
    name: "Dewormex Super Oral (Albendazole)",
    category: "Dewormers",
    dosageForm: "Oral Drench, 1 Liter",
    batchNumber: "ALB-D-010",
    expiryDate: "2028-05-15",
    qtyAvailable: 32,
    unitCost: 150,
    reorderLevel: 8
  },
  {
    id: "med-004",
    name: "Sterile Disposable Surgical Suture packs",
    category: "Surgical Supplies",
    dosageForm: "Suture Box (36 Units)",
    batchNumber: "SUT-381A",
    expiryDate: "2029-01-01",
    qtyAvailable: 18,
    unitCost: 240,
    reorderLevel: 4
  }
];

export const INITIAL_VET_TRANSACTIONS: VetWalletTx[] = [
  {
    id: "vtx-001",
    date: "2026-06-01",
    type: "Subscription",
    amountZmw: 1000,
    creditsDelta: 500,
    description: "Monthly subscription package - Vet Standard Clinic Plan",
    paymentPlatform: "Visa CARD",
    status: "Success"
  },
  {
    id: "vtx-002",
    date: "2026-06-05",
    type: "Credit Purchase",
    amountZmw: 500,
    creditsDelta: 280, // 250 credits + 30 bonus
    description: "Credit Bundle Purchase - Standard 250 Credits pack",
    paymentPlatform: "MTN MoMo",
    status: "Success"
  },
  {
    id: "vtx-003",
    date: "2026-06-10",
    type: "Credit Deduction",
    amountZmw: 0,
    creditsDelta: -15,
    description: "Clinical Consultation Log deduction - Case ref MBL-S-1011A",
    status: "Success"
  }
];
