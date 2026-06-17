import { 
  Supplier, 
  Customer, 
  ExpenseTransaction, 
  Invoice, 
  Quotation, 
  CropCycle, 
  Employee, 
  PoultryBatch, 
  FishBatch,
  CashSale,
  Loan,
  Investment,
  LivestockRecord,
  InventoryItem
} from "../types";

export const DEMO_SUPPLIERS: Supplier[] = [
  { id: "S1", name: "Zambia Seed Company (Zamseed)", contactPerson: "Mabvuto Phiri", phone: "+260978070734", email: "sales@zamseed.co.zm", address: "Plot 311A, Cairo Road, Lusaka", tpin: "1002345678", category: "Seeds & Crop" },
  { id: "S2", name: "Tiger Feeds Agro", contactPerson: "Sarah Banda", phone: "+260966445566", email: "info@tigerfeeds.zm", address: "Stand 49, Mwembeshi Road, Lusaka", tpin: "1009876543", category: "Feed supplies" },
  { id: "S3", name: "Aller Aqua Zambia", contactPerson: "Chileshe Mwamba", phone: "+260955998877", email: "zambia@aller-aqua.com", address: "Siavonga Harbour Road, Siavonga", tpin: "1008761234", category: "Aquafeed" },
  { id: "S4", name: "Novatek Animal Feeds", contactPerson: "David Kruyt", phone: "+260977881122", email: "novatek@feed.com.zm", address: "Landless Corner, Chisamba", tpin: "1005544332", category: "Poultry feed" }
];

export const DEMO_CUSTOMERS: Customer[] = [
  { id: "C1", name: "FreshPay Supermarkets Ltd", contact: "Agatha Mutale", address: "Manda Hill Shopping Centre, Great East Road, Lusaka", phone: "+260972412121", email: "procurement@freshpay.co.zm", tpin: "2005432101" },
  { id: "C2", name: "Siavonga Fish Wholesalers", contact: "Mulenga Kasonde", address: "Harbour view warehouse 3, Siavonga", phone: "+260955321321", email: "mulenga@siavongafish.com", tpin: "2007890123" },
  { id: "C3", name: "Lusaka Poultry Distributors", contact: "Ephraim Tembo", address: "Chawama Market Block F, Lusaka", phone: "+260978990011", email: "tembopoultry@gmail.com", tpin: "2001122334" }
];

export const DEMO_EXPENSES: ExpenseTransaction[] = [
  {
    id: "EXP-101",
    supplierId: "S3",
    supplierName: "Aller Aqua Zambia",
    date: "2026-05-18",
    taxSystem: "VAT",
    taxAmount: 2475,
    subtotal: 16500,
    total: 18975,
    rows: [
      { category: "Aquafeed & Feed Purchases Expense", description: "Aller Aqua Tilapia grower pellets (2mm, 50 bags)", quantity: 50, unitPrice: 330, amount: 16500, coaCode: "5200" }
    ],
    farmId: "farm-1"
  },
  {
    id: "EXP-102",
    supplierId: "S1",
    supplierName: "Zambia Seed Company (Zamseed)",
    date: "2026-05-22",
    taxSystem: "VAT",
    taxAmount: 1125,
    subtotal: 7500,
    total: 8625,
    rows: [
      { category: "Crop Seed & Seedling Acquisition", description: "ZMS 606 Hybrid Seed Maize (15 bags)", quantity: 15, unitPrice: 500, amount: 7500, coaCode: "5310" }
    ],
    farmId: "farm-1"
  }
];

export const DEMO_INVOICES: Invoice[] = [
  {
    id: "INV-2001",
    invoiceNumber: "INV-2026-001",
    date: "2026-05-10",
    dueDate: "2026-06-10",
    customerName: "FreshPay Supermarkets Ltd",
    customerTpin: "2005432101",
    taxAmount: 5120,
    subtotal: 32000,
    total: 37120,
    lines: [
      { description: "Premium Grade A fresh-chilled Whole Tilapia 400g+", quantity: 400, unitPrice: 80, amount: 32000 }
    ],
    status: "Paid",
    coaDebit: "1100",
    coaCredit: "4100",
    farmId: "farm-1"
  },
  {
    id: "INV-2002",
    invoiceNumber: "INV-2026-002",
    date: "2026-05-24",
    dueDate: "2026-06-24",
    customerName: "Lusaka Poultry Distributors",
    customerTpin: "2001122334",
    taxAmount: 4320,
    subtotal: 28800,
    total: 33120,
    lines: [
      { description: "Broiler live-weight whole birds (approx 1.8kg average)", quantity: 600, unitPrice: 48, amount: 28800 }
    ],
    status: "Unpaid",
    coaDebit: "1100",
    coaCredit: "4200",
    farmId: "farm-1"
  }
];

export const DEMO_QUOTATIONS: Quotation[] = [
  {
    id: "QT-1001",
    quoteNumber: "QT-2026-001",
    date: "2026-05-25",
    validityPeriodDays: 30,
    customerName: "FreshPay Supermarkets Ltd",
    subtotal: 18000,
    taxAmount: 2880,
    total: 20880,
    lines: [
      { description: "Premium Grade Large Eggs (Boxes of 30 trays = 900 eggs)", quantity: 10, unitPrice: 1800, amount: 18000 }
    ],
    status: "Draft",
    farmId: "farm-1"
  }
];

export const DEMO_CROPS: CropCycle[] = [
  {
    id: "crop-1",
    cropType: "Maize (ZMS 606)",
    plantingDate: "2026-05-01",
    expectedHarvestDate: "2026-09-15",
    fieldBlock: "Block Alpha (Red Soil)",
    areaHectares: 12,
    expectedYieldKg: 65000,
    status: "Active",
    milestones: [
      { id: "m1", name: "Planted & Nursery Stage", startDate: "2026-05-01", endDate: "2026-05-20", isCompleted: true },
      { id: "m2", name: "Emergence & Herbicide Treatment", startDate: "2026-05-21", endDate: "2026-06-15", isCompleted: false },
      { id: "m3", name: "Flowering & Grain Filling", startDate: "2026-06-16", endDate: "2026-08-10", isCompleted: false },
      { id: "m4", name: "Harvesting & Shelling Stage", startDate: "2026-08-11", endDate: "2026-09-15", isCompleted: false }
    ],
    expensesLinked: 7500,
    revenueLinked: 0,
    farmId: "farm-1"
  }
];

export const DEMO_EMPLOYEES: Employee[] = [
  { id: "E1", name: "Benson Ng'andu", role: "Fisheries Supervisor", contractRate: 8500, country: "ZM", status: "Active" },
  { id: "E2", name: "Clara Mwila", role: "Poultry Attendant", contractRate: 6000, country: "ZM", status: "Active" },
  { id: "E3", name: "Gabriel Phiri", role: "General Farm Hand", contractRate: 4500, country: "ZM", status: "Active" }
];

export const DEMO_POULTRY: PoultryBatch[] = [
  {
    id: "pbatch-1",
    batchId: "BRO-2026-001",
    batchName: "Ross 308 Broilers (Batch Alpha)",
    birdType: "Broilers (Meat)",
    breed: "Ross 308",
    productionSystem: "Deep Litter System",
    quantity: 1500,
    currentCount: 1485,
    sourceSupplier: "Ross Breeders Lusaka",
    arrivalDate: "2026-05-02",
    assignedShed: "Shed Alpha",
    status: "ACTIVE > GROWING",
    feedLogs: [
      { date: "2026-05-10", feedType: "Starter Crumbles", quantityKg: 120, cost: 960, fedBy: "Clara Mwila" },
      { date: "2026-05-20", feedType: "Grower Pellets", quantityKg: 180, cost: 1440, fedBy: "Clara Mwila" }
    ],
    vaccinationCalendar: [
      { ageDay: 1, vaccine: "Marek's Disease", diseaseTarget: "Marek's Disease Virus", route: "SC Injection", isOverdue: false, status: "Completed", dateAdministered: "2026-05-02" },
      { ageDay: 7, vaccine: "Gumboro (IBD) Mild", diseaseTarget: "Infectious Bursal Disease", route: "Drinking Water", isOverdue: false, status: "Completed", dateAdministered: "2026-05-09" },
      { ageDay: 14, vaccine: "ND + IB (Clone 30)", diseaseTarget: "Newcastle / Bronchitis", route: "Eye Drop", isOverdue: false, status: "Completed", dateAdministered: "2026-05-16" },
      { ageDay: 18, vaccine: "Gumboro Intermediate", diseaseTarget: "IBD Boost", route: "Drinking Water", isOverdue: false, status: "Completed", dateAdministered: "2026-05-20" }
    ],
    eggCollections: [],
    mortalityLogs: [
      { date: "2026-05-03", count: 8, cause: "Brooder dehydration" },
      { date: "2026-05-12", count: 7, cause: "Culling due to leg weakness" }
    ],
    salesLogs: [],
    medications: [
      { date: "2026-05-15", drugName: "Amprolium 20%", dosage: "1g/L water", cost: 220, withholdingCloseDate: "2026-05-22" }
    ],
    farmId: "farm-1"
  },
  {
    id: "pbatch-2",
    batchId: "LAY-2026-002",
    batchName: "Lohmann Brown High-Flock Layers",
    birdType: "Layers (Eggs)",
    breed: "Lohmann Brown",
    productionSystem: "Deep Litter Egg Production",
    quantity: 1200,
    currentCount: 1194,
    sourceSupplier: "Tiger Chicks Zambia",
    arrivalDate: "2026-01-15",
    assignedShed: "Shed Beta Layers",
    status: "ACTIVE > LAYING",
    feedLogs: [
      { date: "2026-05-18", feedType: "Layers Mash 18%", quantityKg: 150, cost: 1200, fedBy: "Clara Mwila" },
      { date: "2026-05-25", feedType: "Layers Mash 18%", quantityKg: 150, cost: 1200, fedBy: "Clara Mwila" }
    ],
    vaccinationCalendar: [
      { ageDay: 1, vaccine: "Marek's Disease", diseaseTarget: "Marek's Disease Virus", route: "SC Injection", isOverdue: false, status: "Completed", dateAdministered: "2026-01-15" },
      { ageDay: 21, vaccine: "Newcastle Disease LaSota", diseaseTarget: "ND Virus", route: "Eye Drop", isOverdue: false, status: "Completed", dateAdministered: "2026-02-05" },
      { ageDay: 70, vaccine: "Fowl Pox Vaccine", diseaseTarget: "Fowl Pox Virus", route: "Wing Web puncture", isOverdue: false, status: "Completed", dateAdministered: "2026-03-26" }
    ],
    eggCollections: [
      { date: "2026-05-28", totalCollected: 940, gradeA: 820, gradeB: 100, broken: 12, dirty: 8 },
      { date: "2026-05-29", totalCollected: 962, gradeA: 850, gradeB: 95, broken: 10, dirty: 7 }
    ],
    mortalityLogs: [],
    salesLogs: [],
    medications: [],
    farmId: "farm-1"
  },
  {
    id: "pbatch-3",
    batchId: "IND-2026-003",
    batchName: "Boschveld Village Free-Range",
    birdType: "Indigenous",
    breed: "Boschveld",
    productionSystem: "Slower growth, free-range tracking",
    quantity: 350,
    currentCount: 345,
    sourceSupplier: "Chisamba Village Breeding Center",
    arrivalDate: "2026-02-10",
    assignedShed: "Coop Gamma Free Range",
    status: "ACTIVE > LAYING",
    feedLogs: [
      { date: "2026-05-15", feedType: "Scavenging & Mixed Maize Grit", quantityKg: 20, cost: 160, fedBy: "Clara Mwila" }
    ],
    vaccinationCalendar: [
      { ageDay: 7, vaccine: "ND Eye Drop", diseaseTarget: "Newcastle Disease", route: "Eye Drop", isOverdue: false, status: "Completed", dateAdministered: "2026-02-17" }
    ],
    eggCollections: [
      { date: "2026-05-28", totalCollected: 120, gradeA: 95, gradeB: 20, broken: 3, dirty: 2 }
    ],
    mortalityLogs: [
      { date: "2026-04-18", count: 5, cause: "Local hawk predation during range run" }
    ],
    salesLogs: [],
    medications: [],
    farmId: "farm-1"
  },
  {
    id: "pbatch-4",
    batchId: "DUK-2026-004",
    batchName: "Pekin Meat Ducks (Pond Yard)",
    birdType: "Ducks",
    breed: "Pekin Duck",
    productionSystem: "Pekin duck meat production",
    quantity: 200,
    currentCount: 198,
    sourceSupplier: "Kafue Waterfowl Specialists",
    arrivalDate: "2026-04-20",
    assignedShed: "Shed Delta Wet-Run",
    status: "ACTIVE > GROWING",
    feedLogs: [
      { date: "2026-05-22", feedType: "Waterfowl Broiler Finisher", quantityKg: 45, cost: 360, fedBy: "Clara Mwila" }
    ],
    vaccinationCalendar: [],
    eggCollections: [],
    mortalityLogs: [
      { date: "2026-04-25", count: 2, cause: "Cold shock in early introduction" }
    ],
    salesLogs: [],
    medications: [],
    farmId: "farm-1"
  },
  {
    id: "pbatch-5",
    batchId: "TUR-2026-005",
    batchName: "Seasonal Festive Turkeys",
    birdType: "Turkeys",
    breed: "Broad Breasted White",
    productionSystem: "Seasonal turkey production",
    quantity: 150,
    currentCount: 150,
    sourceSupplier: "Mazabuka Hatcheries",
    arrivalDate: "2026-05-01",
    assignedShed: "Shed Epsilon Turkey Coop",
    status: "ACTIVE > GROWING",
    feedLogs: [
      { date: "2026-05-25", feedType: "Turkey Grower Crumbles", quantityKg: 50, cost: 450, fedBy: "Clara Mwila" }
    ],
    vaccinationCalendar: [],
    eggCollections: [],
    mortalityLogs: [],
    salesLogs: [],
    medications: [],
    farmId: "farm-1"
  },
  {
    id: "pbatch-6",
    batchId: "GUI-2026-006",
    batchName: "Pearl Guinea Fowls (Smallholder)",
    birdType: "Guinea Fowl",
    breed: "Pearl Guinea",
    productionSystem: "Common Zambian smallholder free-range",
    quantity: 100,
    currentCount: 97,
    sourceSupplier: "Monze Rural Co-operative Exchange",
    arrivalDate: "2026-03-01",
    assignedShed: "Upper Meadow Range Run",
    status: "ACTIVE > LAYING",
    feedLogs: [
      { date: "2026-05-20", feedType: "Sorghum & Seed Scratch", quantityKg: 15, cost: 110, fedBy: "Clara Mwila" }
    ],
    vaccinationCalendar: [],
    eggCollections: [
      { date: "2026-05-29", totalCollected: 35, gradeA: 28, gradeB: 6, broken: 1, dirty: 0 }
    ],
    mortalityLogs: [
      { date: "2026-03-15", count: 3, cause: "Stray dog incident" }
    ],
    salesLogs: [],
    medications: [],
    farmId: "farm-1"
  }
];

export const DEMO_FISH: FishBatch[] = [
  {
    id: "fish-1",
    batchId: "TIL-2026-003",
    species: "Nile Tilapia",
    strain: "Siavonga Red",
    productionSystem: "Pond",
    pondName: "Earthen Pond 2",
    stockingQuantity: 5000,
    currentFishCount: 4940,
    averageWeightStockingG: 12,
    targetMarketWeightG: 400,
    expectedHarvestDate: "2026-11-20",
    status: "Grow-Out",
    feedLogs: [
      { date: "2026-05-15", quantityKg: 80, cost: 640, fedBy: "Benson Ng'andu", brand: "Tiger Feeds" },
      { date: "2026-05-25", quantityKg: 95, cost: 760, fedBy: "Benson Ng'andu", brand: "Tiger Feeds" }
    ],
    weightSamplings: [
      { date: "2026-05-12", sampleSize: 50, totalWeightG: 1750, avgWeightG: 35, uniformityPct: 88 },
      { date: "2026-05-26", sampleSize: 60, totalWeightG: 4080, avgWeightG: 68, uniformityPct: 91 }
    ],
    waterReadings: [
      { date: "2026-05-20", pH: 7.2, doLevel: 5.4, temp: 26.5, ammonia: 0.015, nitrite: 0.05 },
      { date: "2026-05-26", pH: 7.4, doLevel: 5.8, temp: 27.1, ammonia: 0.012, nitrite: 0.04 }
    ],
    mortalityLogs: [
      { date: "2026-05-14", count: 35, cause: "Transport acclimation drop" },
      { date: "2026-05-22", count: 25, cause: "Predation by birds" }
    ],
    harvests: [],
    sales: [],
    waterInterventions: [
      { date: "2026-05-15", action: "Water top-up & liming (Lime 10kg)", cost: 180 }
    ],
    medications: [],
    farmId: "farm-1"
  }
];

export const DEMO_CASH_SALES: CashSale[] = [
  { id: "CS-101", date: "2026-05-20", description: "Direct retail sales of fresh-egg crates", customer: "Walk-in Retail Buyers", amount: 4800, paymentMethod: "Cash", coaDebit: "1010", coaCredit: "4200", farmId: "farm-1" }
];

export const DEMO_LOANS: Loan[] = [
  { id: "L-101", recipient: "Munyinda Co-operative Society", principal: 15000, interestRate: 8, startDate: "2026-01-10", endDate: "2026-10-10", outstandingBalance: 12000, type: "Issued", farmId: "farm-1" }
];

export const DEMO_INVESTMENTS: Investment[] = [
  { id: "I-101", description: "Zambia National Commercial Bank 180-Day Fixed Deposit", amount: 25000, date: "2026-03-01", institution: "Zanaco Bank Lusaka", investmentType: "Other", rate: 5.5, status: "Active", farmId: "farm-1" }
];

export const DEMO_LIVESTOCK: LivestockRecord[] = [
  { id: "LIV-1", type: "Goats", species: "Kalahari Red Goats", breed: "Purebred Red", tagId: "KLR-044", dateAcquired: "2025-11-12", purchasePrice: 1800, currentValue: 2600, gender: "Female", acquisitionType: "Bought", source: "Kalahari Breeders Ltd", healthEvents: [{ date: "2026-04-10", type: "Vaccination", details: "PPR disease vaccine shot", cost: 120 }], feedingLogs: [{ date: "2026-05-18", feedType: "Lucerne hay & bran pellets", quantityKg: 5 }], status: "Active", farmId: "farm-1" }
];

export const DEMO_INVENTORY: InventoryItem[] = [
  { id: "I1", name: "Premium Tilapia Grower Pellets", category: "Feed", quantity: 120, unit: "Bags", unitCost: 330, totalValue: 39600, storageLocation: "Siavonga Shed B", lowStockAlertLevel: 20 },
  { id: "I2", name: "High-yield Hybrid Seed Maize (ZMS)", category: "Seeds", quantity: 8, unit: "Bags", unitCost: 500, totalValue: 4000, storageLocation: "Dry Storage Room 1", lowStockAlertLevel: 5 },
  { id: "I3", name: "NPK 10-20-10 Fertilizer", category: "Fertilizer", quantity: 45, unit: "Bags", unitCost: 420, totalValue: 18900, storageLocation: "Dry Storage Room 2", lowStockAlertLevel: 15 }
];
