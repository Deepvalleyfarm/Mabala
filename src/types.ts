/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  flag: string;
  defaultTaxSystem: string;
}

export interface Farm {
  id: string;
  name: string;
  tpin: string;
  vatNumber?: string;
  address: string;
  phone: string;
  email: string;
  financialYearStart: string;
  financialYearEnd: string;
  currency: string;
  currencySymbol: string;
  taxSystem: "VAT" | "Sales Tax" | "Turnover Tax" | "None";
  logo?: string;
}

export type AccountCategory = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";

export interface Account {
  code: string; // CoA Code e.g., '1010'
  name: string;
  category: AccountCategory;
  balance: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  module: string;
}

export interface ExpenseRow {
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  coaCode: string;
}

export interface ExpenseTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  taxSystem: string;
  taxAmount: number;
  subtotal: number;
  total: number;
  rows: ExpenseRow[];
  farmId: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  tpin: string;
  category: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  address: string;
  phone: string;
  email: string;
  tpin?: string;
}

export interface Milestone {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
}

export interface CropCycle {
  id: string;
  cropType: string;
  plantingDate: string;
  expectedHarvestDate: string;
  fieldBlock: string;
  areaHectares: number;
  expectedYieldKg: number;
  actualYieldKg?: number;
  status: "Planning" | "Active" | "Harvested" | "Sold";
  milestones: Milestone[];
  expensesLinked: number;
  revenueLinked: number;
  farmId: string;
  
  // Custom enhanced fields for Plant Population, Survival & Revenue Forecasting engine
  plantingMethod?: "Field" | "Bed";
  measuredInKgOrUnits?: "Kg" | "Units";
  harvestUnitName?: string; // (e.g. Cob, Head, Bulb, Plant, Fruit etc.)
  expectedSellingPricePerUnit?: number;
  expectedSellingPricePerKg?: number;
  plantSpacingWithinRow?: number; // cm
  rowSpacing?: number; // cm
  bedWidth?: number; // meters
  bedLength?: number; // meters
  numberOfBeds?: number;
  plantsPerBed?: number; // Auto calculated
  totalExpectedPlantPopulation?: number; // Auto calculated
  expectedSurvivalRate?: number; // %
  expectedHarvestRate?: number; // %
  avgHarvestUnitsPerPlant?: number;
  averageWeightPerPlantKg?: number;
  expectedRevenueProjection?: number; // Auto calculated
  actualRevenueCollected?: number; // For actual vs planned variance
  actualHarvestUnits?: number; // Actual harvested units
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  contractRate: number; // basic monthly rate
  housingAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  grossSalary?: number;
  napsaNumber?: string;
  nhimaNumber?: string;
  paymentMethod?: "Bank Transfer" | "Airtel Money" | "MTN MoMo" | "Zamtel Money" | "JabuPay" | "Other Wallets";
  bankName?: string;
  bankAccount?: string;
  bankBranch?: string;
  walletNumber?: string;
  country: string;
  status: "Active" | "Terminated";
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  grossSalary: number;
  paye: number;
  napsaEmployee: number;
  napsaEmployer: number;
  nhimaEmployee: number;
  nhimaEmployer: number;
  wcfEmployer: number;
  skillsLevyEmployer: number;
  netPay: number;
  adjustmentReason?: string;
  paymentMethod?: string;
  walletNumber?: string;
  bankName?: string;
  bankAccount?: string;
  bankBranch?: string;
}

export interface EmployeeSalaryAdjustment {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  month: string;
  basicBefore: number;
  basicAfter: number;
  allowancesBefore: number;
  allowancesAfter: number;
  reason: string;
}

export interface StatutoryPaymentMonth {
  id: string;
  month: string;
  type: "NAPSA" | "NHIMA" | "PAYE" | "WCF" | "Skills Levy";
  employeeContribution: number;
  employerContribution: number;
  totalPaid: number;
  status: "Pending" | "Paid";
  paymentDate?: string;
  receiptRef?: string;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerTpin?: string;
  taxAmount: number;
  subtotal: number;
  total: number;
  lines: InvoiceLine[];
  status: "Unpaid" | "Paid" | "Overdue";
  coaDebit: string; // usually 1100
  coaCredit: string; // usually 4000 / 4100
  farmId: string;
  paidAmount?: number;
  cropId?: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  date: string;
  validityPeriodDays: number;
  customerName: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  lines: InvoiceLine[];
  status: "Draft" | "Accepted" | "Rejected";
  farmId: string;
}

export interface CashSale {
  id: string;
  date: string;
  description: string;
  customer: string;
  amount: number;
  paymentMethod: "Cash" | "Mobile Money" | "Bank Transfer";
  coaDebit: string;
  coaCredit: string;
  farmId: string;
}

export interface Loan {
  id: string;
  recipient: string;
  principal: number;
  interestRate: number; // e.g. 5%
  startDate: string;
  endDate: string;
  outstandingBalance: number;
  type: "Issued" | "Received";
  farmId: string;
}

export interface Investment {
  id: string;
  description: string;
  amount: number;
  date: string;
  institution: string;
  investmentType: "Government Bond" | "Treasury Bill" | "Mutual Fund" | "Other";
  rate: number; // e.g. 10 (%)
  status: "Active" | "Matured" | "Realized";
  farmId: string;
}

export interface LivestockRecord {
  id: string;
  type: "Cattle" | "Goats" | "Sheep" | "Pigs" | "Other" | string;
  species: string;
  breed: string;
  subBreed?: string;
  tagId: string;
  gender: "Male" | "Female";
  acquisitionType: "Bought" | "Birthed" | "Gifted" | string;
  source: string;
  dateAcquired: string;
  purchasePrice: number;
  currentValue: number;
  healthEvents: { date: string; type: string; details: string; cost: number }[];
  feedingLogs: { date: string; feedType: string; quantityKg: number }[];
  status: "Active" | "Sold" | "Deceased" | "Dead" | "Slaughtered" | "Missing" | "Transferred" | "Quarantined" | string;
  farmId: string;
  dob?: string;
  age?: string;
  color?: string;
  weight?: number;
  estimatedMarketValue?: number;
  insuranceValue?: number;
  rfid?: string;
  qrCode?: string;
  barcode?: string;
  microchip?: string;
  govRegistration?: string;
  photos?: {
    profile?: string;
    medical?: string[];
    injury?: string[];
    sale?: string[];
  };
  documents?: {
    id: string;
    name: string;
    url: string;
    type: string;
    dateAdded: string;
  }[];
  healthScore?: number;
  productivity?: string;
  sire?: string;
  dam?: string;
  breedingSuccessRate?: number;
  isDairy?: boolean;
}

export interface StockHarvestRecord {
  id: string;
  itemType: "Crop" | "Livestock" | "Poultry" | "Fish";
  name: string; // e.g. "Maize", "Goats"
  quantity: number;
  unit: string;
  harvestDate: string;
  storageLocation: string;
  marketPrice: number;
  sellingPrice?: number;
  status: "In Stock" | "Sold";
}

export interface InventoryItem {
  id: string;
  name: string;
  category: "Fertilizer" | "Seeds" | "Chemicals" | "Tools" | "Equipment" | "Feed" | "Other";
  quantity: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  storageLocation: string;
  lowStockAlertLevel: number;
}

export interface InventoryTransfer {
  id: string;
  date: string;
  name: string;
  quantity: number;
  source: string;
  destination: string;
  authorizedBy: string;
}

// 10. Poultry
export interface PoultryFeedLog {
  date: string;
  feedType: string;
  quantityKg: number;
  cost: number;
  fedBy: string;
  formulaUsed?: string;
  stageId?: string;
}

export interface VaccinationRecord {
  id?: string;
  ageDay: number;
  vaccine: string;
  diseaseTarget: string;
  route: string;
  isOverdue: boolean;
  status: "Pending" | "Completed";
  dueDate?: string;
  dateAdministered?: string;
  brandName?: string;
  lotNumber?: string;
  dosePerBird?: string;
  birdsVaccinated?: number;
  administeredBy?: string;
  completedOnTime?: boolean;
}

export interface PoultryHealthEvent {
  id: string;
  date: string;
  birdsAffected: number;
  symptoms: string;
  preliminaryDiagnosis: string;
  severity: "Mild" | "Moderate" | "Severe";
  status: "Resolved" | "Ongoing" | "Resulted in Mortality";
  treatmentDrug?: string;
  activeIngredient?: string;
  dosage?: string; // mg/kg or ml/L
  route?: string;
  durationDays?: number;
  withholdingPeriodDays?: number;
  withholdingCloseDate?: string;
  treatmentCost?: number;
  linkedMortalityCount?: number;
  notes?: string;
}

export interface MedicationRegisterItem {
  id: string;
  brandName: string;
  activeIngredient: string;
  dosageGuide: string;
  withdrawalPeriodDays: number;
  routeOfAdmin: string;
  category: "Antibiotic" | "Dewormer" | "Coccidiostat" | "Vitamin/Supplement" | "Other";
  indicatedFor: string;
  unitCost: number;
}


export interface DefaultVaccineScheduleItem {
  id: string;
  age: string;
  ageInDays: number;
  vaccine: string;
  diseaseTarget: string;
  route: string;
  birdType: "Broiler/Layer" | "Layer only" | "Broiler only";
  booster: string;
}

export interface EggCollection {
  date: string;
  totalCollected: number;
  gradeA: number;
  gradeB: number;
  broken: number;
  dirty: number;
  hatching?: number; // set aside for hatching
  traysCollected?: number; // trays collected tracking
}

export interface EggSale {
  id: string;
  date: string;
  customerName: string;
  sellUnit: "tray" | "dozen" | "egg";
  quantity: number;
  pricePerUnit: number;
  totalEggs: number;
  totalRevenue: number;
  traysSold?: number; // trays sold tracking
}

export interface PoultryBatch {
  id: string;
  batchId: string; // generated e.g. BRO-2026-001
  batchName: string;
  birdType: "Broilers (Meat)" | "Layers (Eggs)" | "Ducks" | "Turkeys" | "Guinea Fowl" | "Indigenous";
  breed: string;
  productionSystem?: string; // e.g. Free-range tracking, seasonal, pekin duck meat production
  currentStageId?: string; // "brooding" | "grower" | "finisher" | "developer" | "layer_production" | "breeder"
  accomplishedChecklist?: string[]; // strings like "brooding:req-0" etc.
  unitAcquisitionCost?: number; // Cost per bird (for initial double-entry capital tracking)
  transportCost?: number; // Added for initialization transport cost logs
  brooderSetupCost?: number; // Added for initialization brooder setup cost logs
  labourHours?: number; // Estimated cumulative labour hours
  labourRatePerHour?: number; // Rate per hour for labour (default to ZK rate or equivalent)
  utilityCost?: number; // Accumulated energy, water and gas utilities
  shedDepreciation?: number; // Allocated building or machinery depreciation
  notes?: string; // Customizable description notes for templates and duplicates
  targetStage?: string; // Target final stage e.g. "Finishing" or "Laying"
  quantity: number;
  currentCount: number;
  sourceSupplier: string;
  arrivalDate: string;
  assignedShed: string;
  status: "PLANNED" | "ACTIVE > BROODING" | "ACTIVE > GROWING" | "ACTIVE > FINISHING" | "ACTIVE > LAYING" | "PARTIAL SALE" | "COMPLETED" | "CLOSED";
  feedLogs: PoultryFeedLog[];
  feedStockAllocated?: number;
  weightSamples?: { date: string; averageWeightG: number; remarks?: string; sampleSize?: number; uniformityPct?: number }[];
  vaccinationCalendar: VaccinationRecord[];
  eggCollections: EggCollection[];
  eggSales?: EggSale[];
  mortalityLogs: { 
    date: string; 
    count: number; 
    cause: string; 
    probableCauseCategory?: "feed" | "disease" | "predator" | "unknown"; 
    disposalMethod?: string;
  }[];
  salesLogs: { 
    id?: string;
    date: string; 
    quantity: number; 
    amount: number; 
    pricePerBird: number;
    customerName?: string;
    paymentMethod?: string;
    chargeType?: "PER_BIRD" | "PER_KG";
    averageWeightKg?: number;
    pricePerKg?: number;
    dressingPercentage?: number;
    grossMarginPerBird?: number;
  }[];
  medications: { date: string; drugName: string; dosage: string; cost: number; withholdingCloseDate?: string }[];
  healthEvents?: PoultryHealthEvent[];
  mortalityThresholdPct?: number;
  farmId: string;
}

// 11. Aquaculture
export interface WaterQualityReading {
  date: string;
  pH: number;
  doLevel: number; // dissolved oxygen
  temp: number;
  ammonia: number;
  nitrite: number;
}

export interface GrowthSample {
  date: string;
  sampleSize: number;
  totalWeightG: number;
  avgWeightG: number;
  uniformityPct: number;
}

export interface FishBatch {
  id: string; // ULID
  batchId: string;
  species: string;
  strain: string;
  productionSystem: "Pond" | "Cage" | "Tank" | "Polyculture";
  pondName: string;
  stockingQuantity: number;
  currentFishCount: number;
  averageWeightStockingG: number;
  targetMarketWeightG: number;
  expectedHarvestDate: string;
  status: "Planned" | "Stocked" | "Grow-Out" | "Pre-Harvest" | "Harvested" | "Closed";
  feedLogs: { date: string; quantityKg: number; cost: number; fedBy: string; brand: string }[];
  weightSamplings: GrowthSample[];
  waterReadings: WaterQualityReading[];
  mortalityLogs: { date: string; count: number; cause: string }[];
  harvests: { date: string; quantityKg: number; avgWeightG: number; grade: string; processing: string }[];
  sales: { date: string; quantityKg: number; pricePerKg: number; totalSales: number; form: string }[];
  waterInterventions: { date: string; action: string; cost: number }[];
  medications: { date: string; name: string; activeIngredient: string; dosage: string; withdrawalDays: number; cost: number; dateGiven: string }[];
  farmId: string;
}

export interface AdCampaign {
  id: string;
  advertiserName: string;
  campaignName: string;
  adType: "CPM" | "CPC" | "Flat Rate";
  creativeUrl?: string;
  creativeUrlText: string;
  destinationUrl: string;
  views: number;
  clicks: number;
  isActive: boolean;
  placement: "banner" | "sidebar" | "interstitial";
}

export interface AppConfig {
  emailContact: string;
  phoneContact: string;
  addressContact: string;
  socialTwitter: string;
  socialFacebook: string;
}

export type PredefinedRole = "Super Admin" | "Platform Administrator" | "Farm Owner" | "Accountant" | "Farm Worker" | "Veterinary Doctor" | "Agro-Vet Specialist" | "Farm Admin" | "Manager" | "Viewer" | "Farmer" | "partner";

export interface OptionalModulePermission {
  read: boolean;
  write: boolean;
}

export interface RolePermissions {
  [moduleId: string]: OptionalModulePermission;
}

export type RolePermissionsMap = {
  [role in PredefinedRole]: RolePermissions;
};

export interface UserMember {
  id: string;
  name: string;
  email: string;
  role: PredefinedRole;
  avatar?: string;
  lastActive: string;
  status?: "Active" | "Deactivated";
  password?: string;
  accessibleFarmIds?: string[];
}

export interface Asset {
  id: string;
  name: string;
  category: "Land" | "Buildings" | "Equipment" | "Vehicles" | "Water Infrastructure" | "Other";
  serial?: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  location: string;
  supplierId: string;
  condition: "Excellent" | "Good" | "Fair" | "Poor";
  notes?: string;
  depreciationRate: number; // e.g. annual percentage rate
  farmId: string;
}

export interface OtherRevenue {
  id: string;
  description: string;
  amount: number;
  date: string;
  source: string;
  revenueType: "Grant" | "Shareholder Contribution" | "Other Income";
  coaCode: string;
  farmId: string;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  leaveType: "Annual" | "Sick" | "Maternity" | "Paternity" | "Study" | "Compassionate" | "Unpaid";
  status: "Pending" | "Approved" | "Rejected";
  notes?: string;
  farmId: string;
}

export interface EmployeeAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  advanceAmount: number;
  remainingBalance: number;
  requestDate: string;
  repaymentMonth: string; // e.g. "2026-06"
  status: "Pending" | "Approved" | "Paid" | "Deducted";
  notes?: string;
  farmId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: "CREATE" | "EDIT" | "DELETE" | "RESTORE" | "CLEAR" | "LOGIN";
  module: string;
  record: string;
  detail: string;
  farmId: string;
}

export interface ArchiveRecord {
  id: string;
  archivedAt: string;
  module: string;
  originalId: string;
  description: string;
  data: string; // JSON string
  farmId: string;
}

export interface BackupData {
  farms: Farm[];
  accounts: Account[];
  suppliers: Supplier[];
  customers: Customer[];
  expenses: ExpenseTransaction[];
  invoices: Invoice[];
  quotations: Quotation[];
  crops: CropCycle[];
  employees: Employee[];
  payslips: Payslip[];
  poultry: PoultryBatch[];
  fish: FishBatch[];
  inventory: InventoryItem[];
  cashSales: CashSale[];
  loans: Loan[];
  investments: Investment[];
  livestock: LivestockRecord[];
  assets?: Asset[];
  otherRevenues?: OtherRevenue[];
  leaveRecords?: LeaveRecord[];
  advances?: EmployeeAdvance[];
  inventoryMovements?: InventoryTransfer[];
  auditLogs?: AuditLog[];
  archivedRecords?: ArchiveRecord[];
  credits?: number;
  userProfile?: { name: string; email: string; phone: string; };
  backupDate?: string;
  teamMembers?: UserMember[];
}export interface FormulaIngredient {
  name: string;
  quantityKg: number;
  costPerKg: number;
  crudeProteinPct: number;
  metabolizableEnergyKcal: number;
  calciumPct: number;
  phosphorusPct: number;
}

export interface FeedFormula {
  id: string;
  name: string;
  stage: "Starter" | "Grower" | "Finisher" | "Layer Mash";
  version: number;
  createdAt: string;
  notes?: string;
  ingredients: FormulaIngredient[];
  totalQuantityKg: number;
  farmId: string;
}

export interface FarmTask {
  id: string;
  title: string;
  description: string;
  category: "General" | "Equipment Maintenance" | "Irrigation Scheduling" | "Harvesting" | "Livestock Feed" | "Crop Spraying" | "Other";
  dueDate: string; // ISO-8601 YYYY-MM-DD or YYYY-MM-DDTHH:MM
  isCompleted: boolean;
  completedAt?: string; // date completed (e.g., ISO string)
  farmId: string;
}

// -----------------------------------------------------
// Offtaker Portal Database Schemas
// -----------------------------------------------------

export interface Offtaker {
  id: string;
  tenantId: string;
  legalName: string;
  registrationNumber: string;
  tpin: string;
  sector: "grain" | "dairy" | "cotton" | "tobacco" | "livestock" | "other";
  depotLocations: string[]; // array of strings
  status: "active" | "suspended";
  createdAt: string;
}

export interface OfftakerProduct {
  id: string;
  offtakerId: string;
  productName: string;
  unit: string; // kg, litre, head, bale, etc.
  defaultUnitPrice: number;
  gradeTags: string[]; // array
  active: boolean;
}

export interface FarmerOfftakerLink {
  id: string;
  farmerId: string; // FK to Farmer
  offtakerId: string; // FK to Offtaker
  status: "pending" | "active" | "revoked";
  initiatedBy: "farmer" | "offtaker";
  linkedAt: string;
  respondedAt?: string;
}

export interface DeliveryNote {
  id: string;
  dnNumber: string; // unique, sequential PER offtaker (e.g. DN-2026-001)
  farmerId: string;
  farmerName?: string; // cached helper
  offtakerId: string;
  productId: string;
  productName?: string; // cached helper
  quantity: number;
  unit: string;
  gradeTag: string;
  unitPrice: number;
  totalValue: number;
  cropCycleId?: string | null; // FK to existing CropCycle (nullable)
  status: "pending_confirmation" | "confirmed" | "disputed";
  confirmationDeadline?: string;
  confirmedAt?: string;
  paymentStatus: "unpaid" | "paid";
  payoutId?: string | null;
  recordedByUserId: string;
  createdAt: string;
}

export interface AdjustmentNote {
  id: string;
  originalDnId: string;
  reason: string;
  fieldChanges: {
    quantity?: { from: number; to: number };
    unitPrice?: { from: number; to: number };
    gradeTag?: { from: string; to: string };
  };
  createdBy: string;
  approvedBy: string;
  createdAt: string;
}

export interface OfftakerWallet {
  id: string;
  offtakerId: string;
  balance: number;
  currency: string; // 'ZMW' by default
  lastFundedAt?: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: "fund" | "debit" | "fee" | "reversal";
  amount: number;
  lipilaReference: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  offtakerId: string;
  farmerId: string;
  deliveryNoteIds: string[]; // can be multiple DNs in one payout
  grossAmount: number;
  offtakerFeeAmount: number;
  farmerFeeAmount: number;
  netAmountToFarmer: number;
  payoutMethod: "mobile_money" | "bank_transfer";
  lipilaReference: string;
  status: "initiated" | "processing" | "completed" | "failed" | "reversed";
  createdAt: string;
  completedAt?: string;
}

export interface FeeConfig {
  id: string;
  side: "farmer" | "offtaker";
  ratePercent: number; // decimal (e.g., 2.8)
  flatFee: number; // decimal ZMW (e.g., 15.00)
  effectiveFrom: string;
  setByUserId: string;
  createdAt: string;
}


