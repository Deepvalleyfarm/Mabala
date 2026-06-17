/**
 * Veterinary Clinic Management Domain Types
 */

export interface VetTenant {
  id: string;
  name: string;
  type: "Clinic" | "Hospital" | "Mobile Practice" | "Laboratory" | "Government Office" | "NGO" | "Consultancy";
  district: string;
  province: string;
  subscriptionPlan: "Monthly" | "Annual" | "Enterprise" | "Government" | "Pay-As-You-Go";
  creditsBalance: number;
}

export interface VetClient {
  id: string;
  name: string;
  type: "Farmer" | "Commercial Farm" | "Cooperative" | "Ranch" | "Dairy Farm" | "Poultry Farm" | "Goat Farm" | "Pig Farm";
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  province: string;
  gpsCoords: string;
  herdSize: number;
  riskCategory: "Low" | "Moderate" | "High";
  onboardedDate: string;
  assignedVetId: string;
}

export interface VetFarm {
  id: string;
  clientId: string;
  name: string;
  sizeHectares: number;
  speciesList: string[]; // e.g. ["Bovine", "Caprine", "Avian"]
  diseaseHistory: string[];
}

export interface VetStaff {
  id: string;
  name: string;
  role: "Clinic Owner" | "Branch Manager" | "Veterinarian" | "Veterinary Technician" | "Laboratory Technician" | "Pharmacist" | "Receptionist" | "Accounts Officer" | "Field Officer" | "Government Inspector";
  email: string;
  status: "Active" | "Inactive";
}

export interface VetAppointment {
  id: string;
  clientId: string;
  clientName: string;
  type: "Consultation" | "Vaccination" | "Surgery" | "Herd Health Inspection" | "Laboratory Testing" | "Pregnancy Diagnosis" | "Disease Investigation";
  category: "Walk-in" | "Online Booking" | "Mobile Vet Booking" | "Emergency";
  dateTime: string;
  status: "Pending" | "Completed" | "Cancelled";
  assignedVetId: string;
  routeLocation?: string;
}

export interface ClinicalRecord {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  animalId: string; // Tag ID of animal
  species: string;
  diagnosis: string;
  clinicalFindings: string;
  treatmentPlanned: string;
  prescriptions: string[];
  cost: number;
  status: "Recovering" | "Healed" | "Under Treatment" | "Died";
  gpsCoords?: string;
  vetSignature: string;
}

export interface MovementCard {
  id: string;
  permitNo: string;
  dateIssued: string;
  originDistrict: string;
  destinationDistrict: string;
  originFarm: string;
  destinationFarm: string;
  animalCount: number;
  species: string;
  healthClearanceUuid: string;
  status: "Approved" | "Pending" | "Rejected";
}

export interface LabSample {
  id: string;
  dateCollected: string;
  clientId: string;
  clientName: string;
  sampleType: "Blood" | "Fecal" | "Milk" | "Tissue" | "Swab";
  testRequired: "Parasitology" | "Microbiology" | "Serology" | "PCR Testing" | "Milk Quality Testing" | "Blood Testing";
  batchBarcode: string;
  status: "Sample Collection" | "Sample Registered" | "Processing" | "Testing" | "Result Approval" | "Completed";
  fecalEggCount?: string;
  parasiteLoad?: string; // Low, Med, High
  milkQualityGrade?: "A" | "B" | "C" | "D";
  testResultsNotes?: string;
  approvedBy?: string;
}

export interface VaccineCampaign {
  id: string;
  title: string;
  disease: string;
  targetDistrict: string;
  targetCount: number;
  administeredCount: number;
  startDate: string;
  endDate: string;
  status: "Planned" | "Active" | "Completed";
}

export interface DiseaseOutbreak {
  id: string;
  diseaseName: string;
  district: string;
  province: string;
  confirmedCases: number;
  mortalities: number;
  gpsCoords: string;
  dateReported: string;
  quarantineSectors: string; // yes/no or bounds
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Active Alert" | "Under Isolation" | "Contained";
}

export interface PrescriptionItem {
  medicationId: string;
  name: string;
  dose: string;
  duration: string;
}

export interface MedicationInventory {
  id: string;
  name: string;
  category: "Vaccines" | "Antibiotics" | "Dewormers" | "Vitamins" | "Hormones" | "Surgical Supplies" | "Laboratory Consumables";
  dosageForm: string;
  batchNumber: string;
  expiryDate: string;
  qtyAvailable: number;
  unitCost: number; // For balance sheet / FIFO
  reorderLevel: number;
  coldChainRegimen?: string; // e.g. "2°C - 8°C"
}

export interface VetWalletTx {
  id: string;
  date: string;
  type: "Subscription" | "Credit Purchase" | "Credit Deduction" | "Correction" | "Bonus" | "Loyalty";
  amountZmw: number;
  creditsDelta: number;
  description: string;
  paymentPlatform?: "Airtel Money" | "MTN MoMo" | "Zamtel Kwacha" | "Visa CARD" | "Bank Transfer";
  status: "Success" | "Pending" | "Failed";
}
