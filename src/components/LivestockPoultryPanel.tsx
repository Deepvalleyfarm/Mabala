import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import EnterpriseLivestockManager from "./livestock/EnterpriseLivestockManager";
import { PoultryBatch, LivestockRecord, Supplier, FeedFormula, VaccinationRecord, DefaultVaccineScheduleItem, PoultryHealthEvent, MedicationRegisterItem, EggSale, EggCollection } from "../types";
import { FeedFormulationBuilder, DEFAULT_FORMULAS } from "./FeedFormulationBuilder";
import PoultryFinancialDashboard from "./PoultryFinancialDashboard";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from "recharts";

function categorizeCause(causeText: string, category?: string): "feed" | "disease" | "predator" | "unknown" {
  if (category) return category as any;
  const lower = (causeText || "").toLowerCase();
  if (lower.includes("predat") || lower.includes("hawk") || lower.includes("dog") || lower.includes("cat") || lower.includes("strike") || lower.includes("snake") || lower.includes("incident") || lower.includes("pest")) {
    return "predator";
  }
  if (lower.includes("feed") || lower.includes("water") || lower.includes("dehydr") || lower.includes("starv") || lower.includes("nutrition")) {
    return "feed";
  }
  if (lower.includes("disease") || lower.includes("outbreak") || lower.includes("virus") || lower.includes("bacter") || lower.includes("sick") || lower.includes("infec") || lower.includes("coccid") || lower.includes("parasit") || lower.includes("ncd") || lower.includes("gumboro") || lower.includes("bronch") || lower.includes("pathogen")) {
    return "disease";
  }
  return "unknown";
}

import { 
  Plus, Trash, Check, Info, Egg, AlertCircle, HeartCrack, ChevronRight, Apple, 
  Stethoscope, Shield, Heart, ShieldAlert, Award, Search, FileText, Printer, 
  Calendar, Clock, User, Building, Landmark, Activity, Sparkles, Scale, DollarSign,
  HeartPulse, ShieldCheck, Download, Sliders, CheckSquare, ListTodo, UserCheck, Users
} from "lucide-react";

const SPECIES_BREEDS_MAP: Record<string, { breeds: string[], genders: string[] }> = {
  "Cattle (Ruminant)": { 
    breeds: ["Boran Stud", "Angus Breed", "Hereford Cattle", "Sahiwal Bull", "Brahman Stud", "Dairy Holstein-Friesian"], 
    genders: ["Heifer (Female)", "Cow (Mature Female)", "Bull (Male)", "Steer (Castrated Male)"] 
  },
  "Sheep (Ruminant)": { 
    breeds: ["Dorper Mutton", "Damara Fat-tail", "Merino Fine-wool", "Suffolk Meat Sheep", "Local Zambian Fat-tail"], 
    genders: ["Ewe (Female)", "Ram (Male)", "Wether (Castrated Male)"] 
  },
  "Goats (Ruminant)": { 
    breeds: ["Boer Stud Goat", "Kalahari Red Goat", "Saanen Dairy Goat", "Savanna White Goat", "Local Gwembe Kid"], 
    genders: ["Doe (Female)", "Buck (Male)", "Wether (Castrated Male)"] 
  },
  "Pigs (Non-Ruminant)": { 
    breeds: ["Large White Porker", "Landrace Sow breed", "Duroc Studer", "Hampshire Red Line", "Local Village Pig"], 
    genders: ["Sow (Female)", "Boar (Male)", "Gilt (Young Female)", "Barrow (Castrated Male)"] 
  },
  "Horses (Non-Ruminant)": { 
    breeds: ["Thoroughbred Racer", "Appaloosa Stud", "Arabian Warmblood", "Zambian Cross-draught"], 
    genders: ["Mare (Female)", "Stallion (Male)", "Gelding (Castrated Male)"] 
  },
  "Rabbits (Non-Ruminant)": { 
    breeds: ["New Zealand White Fryer", "California Meat Rabbit", "Flemish Giant Breed", "Chinchilla Fur line"], 
    genders: ["Doe (Female)", "Buck (Male)"] 
  }
};

interface PoultryTypeDetail {
  breeds: string[];
  productionSystems: string[];
  defaultBreed: string;
  defaultSystem: string;
}

const POULTRY_TYPES_CONFIG: Record<string, PoultryTypeDetail> = {
  "Layers (Eggs)": {
    breeds: ["Lohmann Brown", "Hy-Line Brown", "ISA Brown", "Generic Layer"],
    productionSystems: ["Deep Litter Egg Production", "Battery Cage System", "Free Range Layers", "Backyard Coop"],
    defaultBreed: "Lohmann Brown",
    defaultSystem: "Deep Litter Egg Production"
  },
  "Broilers (Meat)": {
    breeds: ["Ross 308", "Cobb 500", "ARBOR ACRES", "Generic Broiler"],
    productionSystems: ["Deep Litter System", "Intensive Shed", "Controlled Environment (ECP)", "Free Range Broilers"],
    defaultBreed: "Cobb 500",
    defaultSystem: "Deep Litter System"
  },
  "Indigenous": {
    breeds: ["Local Zambian Village Chicken", "Rhode Island Red", "Australorp", "Boschveld", "Generic Indigenous"],
    productionSystems: ["Slower growth, free-range tracking", "Semi-intensive scavenging yard", "Zambian Backyard system"],
    defaultBreed: "Local Zambian Village Chicken",
    defaultSystem: "Slower growth, free-range tracking"
  },
  "Ducks": {
    breeds: ["Pekin Duck", "Muscovy Duck", "Khaki Campbell", "Generic Duck"],
    productionSystems: ["Pekin duck meat production", "Wetland pasture run", "Intensive duck farming"],
    defaultBreed: "Pekin Duck",
    defaultSystem: "Pekin duck meat production"
  },
  "Turkeys": {
    breeds: ["Broad Breasted White", "Bronze Turkey", "Bourbon Red", "Generic Turkey"],
    productionSystems: ["Seasonal turkey production", "Pastured turkey flock", "Intensive market turkey"],
    defaultBreed: "Broad Breasted White",
    defaultSystem: "Seasonal turkey production"
  },
  "Guinea Fowl": {
    breeds: ["Pearl Guinea", "Lavender Guinea", "White Guinea", "Local Zambian Fowl"],
    productionSystems: ["Common Zambian smallholder free-range", "Semi-confined netting yards", "Generic Guinea Fowl"],
    defaultBreed: "Pearl Guinea",
    defaultSystem: "Common Zambian smallholder free-range"
  }
};

const getBatchAgeDays = (arrivalDateStr: string) => {
  try {
    const arrival = new Date(arrivalDateStr);
    const now = new Date("2026-06-02"); // Consistent current system date
    const diffTime = now.getTime() - arrival.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  } catch (e) {
    return 0;
  }
};

const getSuggestedStageId = (days: number, type: string): string => {
  if (days <= 21) return "brooding";
  if (type === "Broilers (Meat)" || type === "Ducks") {
    if (days >= 42) return "finisher";
    return "grower";
  } else {
    if (days >= 168) return "breeder"; 
    if (days >= 126) return "layer_production";
    if (days >= 56) return "developer";
    return "grower";
  }
};

const isStageApplicable = (stageId: string, birdType: string): boolean => {
  if (birdType === "Broilers (Meat)" || birdType === "Ducks" || birdType === "Turkeys") {
    return ["brooding", "grower", "finisher", "breeder"].includes(stageId);
  } else {
    return ["brooding", "grower", "developer", "layer_production", "breeder"].includes(stageId);
  }
};

const getFeedTypeSuggestion = (birdType: string, ageDays: number) => {
  if (birdType.includes("Broiler")) {
    if (ageDays <= 10) {
      return {
        type: "Broiler Pre-Starter",
        formula: "Hi-Protein Broiler Pre-Starter Crumbles (22% CP)",
        desc: "Ideal for rapid skeletal development in the first 10 days"
      };
    } else if (ageDays <= 25) {
      return {
        type: "Broiler Grower",
        formula: "Standard Broiler Grower Pellets (19% CP)",
        desc: "High energy formula to optimize weight gain and muscle tissue growth"
      };
    } else {
      return {
        type: "Broiler Finisher",
        formula: "Premium Broiler Finisher Pellets (17.5% CP)",
        desc: "Optimized fat retention and conversion during the final finishing days"
      };
    }
  } else if (birdType.includes("Layer") || birdType.includes("Egg")) {
    if (ageDays <= 42) {
      return {
        type: "Chick Starter Mash",
        formula: "Pullet Chick Starter Feed (20% CP)",
        desc: "Fosters early digestive immune health and uniform frame construction"
      };
    } else if (ageDays <= 120) {
      return {
        type: "Pullet Grower Mash",
        formula: "Grower Mash formulation (16% CP)",
        desc: "Maintains optimal muscle-to-fat balance to prevent early laying triggers"
      };
    } else {
      return {
        type: "Layer Mash",
        formula: "High-Calcium Layer Phase-1 Mash (16.5% CP, 4% Ca)",
        desc: "High calcium ratio for strong eggshell calcification and laying continuity"
      };
    }
  } else {
    if (ageDays <= 21) {
      return {
        type: "Multi-Poultry Starter",
        formula: "Generic Starter Crumbles (19.5% CP)",
        desc: "Gentle starter feed for diverse poultry digestive tracts"
      };
    } else if (ageDays <= 70) {
      return {
        type: "Multi-Poultry Grower",
        formula: "All-Purpose Grower Mash (16% CP)",
        desc: "Standard nutrition to promote steady, disease-free structural growth"
      };
    } else {
      return {
        type: "Multi-Poultry Developer / Layer",
        formula: "All-Purpose Poultry Layout/Finisher Feed (15.5% CP)",
        desc: "Fulfills adult maintenance and egg or meat biological requirements"
      };
    }
  }
};

export const LIFECYCLE_STAGES = [
  { id: "PLANNED", label: "Planned", desc: "Shed configured, delivery date set, readying infrastructure." },
  { id: "ACTIVE > BROODING", label: "Active > Brooding", desc: "Chicks received, heat/brooding operations underway." },
  { id: "ACTIVE > GROWING", label: "Active > Growing", desc: "Birds transitioned to grower phase and standard feed." },
  { id: "ACTIVE > FINISHING", label: "Active > Finishing", desc: "Finisher feed introduced for broiler meat development." },
  { id: "ACTIVE > LAYING", label: "Active > Layying", desc: "Flock is mature and has entered egg production cycle." },
  { id: "PARTIAL SALE", label: "Partial Sale", desc: "Bird harvesting log started, remainder of flock continues." },
  { id: "COMPLETED", label: "Completed", desc: "All birds harvested, sold, or culled. Ready for final review." },
  { id: "CLOSED", label: "Closed", desc: "Financial locks applied. Static and preserved general ledger history." }
];

interface ProductionStageInfo {
  id: string;
  name: string;
  ageRange: string;
  minDays: number;
  maxDays: number;
  birdTypes: string[];
  activities: string[];
  requirements: string[];
  alerts: string[];
}

interface ZambiaPoultryDisease {
  id: string;
  name: string;
  localName?: string;
  symptoms: string[];
  cause: string;
  severity: "High" | "Critical" | "Moderate";
  prevention: string;
  treatment: string;
  bioSecurityAdvisory: string;
}

const POULTRY_DISEASES_ZAMBIA: ZambiaPoultryDisease[] = [
  {
    id: "dis-1",
    name: "Newcastle Disease",
    localName: "Kuku Cholera / Chitopa",
    cause: "Newcastle Disease Virus (Paramyxovirus-1)",
    severity: "Critical",
    symptoms: [
      "Greenish watery diarrhea",
      "Severe breathing difficulties (gasping)",
      "Twisted neck/paralysis (nervous signs)",
      "Swollen head & eyes",
      "Sudden mass flock mortality (up to 100%)"
    ],
    prevention: "Routine vaccination: Clone 30 (Wk 1), ND La Sota (Wk 3 & Wk 8), pre-lay pre-lay booster (Wk 16). Strict biosecurity footbaths.",
    treatment: "No clinical cure available. Administer multivitamins (e.g., Stress Pack) to support immunity. Deploy antibiotics only to control secondary bacterial infections.",
    bioSecurityAdvisory: "Quarantine infected sheds immediately. Notify local veterinary extension officers in Zambia. Burn or bury carcasses deeply away from water tables."
  },
  {
    id: "dis-2",
    name: "Gumboro Disease",
    localName: "Infectious Bursal Disease (IBD)",
    cause: "Infectious Bursal Disease Virus (Birnavirus)",
    severity: "Critical",
    symptoms: [
      "Watery, whitish-yellow diarrhea",
      "Severe dehydration and ruffled feathers",
      "Huddled, listless birds",
      "Self-pecking at vent area",
      "Sudden spikes in mortality between Days 14 to 28"
    ],
    prevention: "Vaccination: Mild Gumboro (Day 7/10), Intermediate Gumboro boost (Day 18/21).",
    treatment: "No specific viral treatment. Provide glucose/electrolytes in drinking water, increase room warmth to 28°C, avoid high protein feed during active flare-up.",
    bioSecurityAdvisory: "Extremely stable virus that resists heat. Scrub coops with iodine-based disinfectants. Avoid moving litter between pens."
  },
  {
    id: "dis-3",
    name: "Coccidiosis",
    localName: "Bloody Stools / Chozo",
    cause: "Eimeria protozoan parasites",
    severity: "High",
    symptoms: [
      "Bloody or rusty-brown watery stools",
      "Pale combs and wattles due to internal anemia",
      "Listless, huddled birds with drooping wings",
      "Drastic drop in feed intake and egg production",
      "Stunted growth in broilers"
    ],
    prevention: "Keep litter bone-dry. Prevent waterer leaks. Include preventative coccidiostats in starter feed.",
    treatment: "Administer Amprolium (Amprol 20%) or Sulfaclox in drinking water strictly for 3-5 days. Follow up with Multivitamins.",
    bioSecurityAdvisory: "Thrives in damp, humid, and warm litter conditions. Implement daily dry-raking and top-dressing of wood shavings."
  },
  {
    id: "dis-4",
    name: "Infectious Coryza",
    localName: "Swollen Face Coryza",
    cause: "Avibacterium paragallinarum bacterium",
    severity: "High",
    symptoms: [
      "Severe swelling of the face, wattles, and sinuses",
      "Foul-smelling nasal and ocular discharge",
      "Matting of feathers around shoulders from nasal wiping",
      "Sneezing, coughing, and breathing rales",
      "Egg production drops up to 40%"
    ],
    prevention: "Coryza vaccination in layer cohorts at 10-14 weeks pre-lay. Keep age groups separate.",
    treatment: "Administer water-soluble antibiotics like Tylosin, Aliseryl, or sulfonamides (S-M-T) for 5-7 days.",
    bioSecurityAdvisory: "Can be carried by recovered healthy-looking chickens. Never mix old stock with young cohorts in a single shed."
  },
  {
    id: "dis-5",
    name: "Chronic Respiratory Disease (CRD)",
    localName: "Mycoplasmosis / Chimfine",
    cause: "Mycoplasma gallisepticum",
    severity: "Moderate",
    symptoms: [
      "Slight coughing, sneezing, and wet breathing sounds (rales)",
      "Sticky nasal discharge and bubble-like tears in eye corners",
      "Reduced growth efficiency and FCR degradation",
      "Drop in overall flock feed ingestion"
    ],
    prevention: "Purchase certified Mycoplasma-free chicks. Maintain adequate ventilation to reduce ammonia fumes.",
    treatment: "Treat with water-soluble Tylosin Tartrate (Tylosin Pure) or Oxytetracycline (Limoxin) for 3-5 days.",
    bioSecurityAdvisory: "Ammonia build-up destroys the bird's trachea, creating entrance points for pathogens. Ensure 24hr cross-air ventilation."
  },
  {
    id: "dis-6",
    name: "Fowl Pox",
    localName: "Chitooto",
    cause: "Avipoxvirus",
    severity: "High",
    symptoms: [
      "Wart-like nodules/scabs on comb, wattles, ears, and eyelids (Dry form)",
      "Yellow wet canker patches inside beak or throat causing suffocation (Wet form)",
      "Partial blindness and general weight loss"
    ],
    prevention: "Wing-web stab vaccination at Week 5-8 (Layer cohorts). Control mosquitoes.",
    treatment: "No effective cure for viral lesions. Dab scabs with mild iodine or gentian violet. Provide vitamins and soft mash feed.",
    bioSecurityAdvisory: "Transmitted by mosquitoes and wind-borne dander. Keep tall grass slashed around houses and empty standing water pools."
  }
];

const PRODUCTION_STAGES: ProductionStageInfo[] = [
  {
    id: "brooding",
    name: "Brooding",
    ageRange: "Day 0–21",
    minDays: 0,
    maxDays: 21,
    birdTypes: ["Broilers (Meat)", "Layers (Eggs)", "Ducks", "Turkeys", "Guinea Fowl", "Indigenous"],
    activities: [
      "Set up brooder heaters/lamps and monitor temperature (Target: 32-35°C)",
      "Provide clean drinking water with glucose/electrolyte rehydrants",
      "Feed high-protein Broiler Starter or Chick Starter crumbles",
      "Record daily mortality rate strictly (Immediate vet inspection if > 1%/day)",
      "Administer Early Vaccines (Marek's Day 1, Gumboro Day 7, ND LaSota Day 14/18)"
    ],
    requirements: [
      "Brooder setup checks completed",
      "Pre-heating started 24 hours before chick placement",
      "Disinfection and fresh pine wood shavings litter applied",
      "Early vaccines sequence scheduled"
    ],
    alerts: [
      "Keep brooders draft-free. Cold draft leads to high mortality!",
      "Monitor flock crowding closely. If chicks huddle, they are cold; if they disperse to edges, they are too hot."
    ]
  },
  {
    id: "grower",
    name: "Grower",
    ageRange: "Week 3–8",
    minDays: 22,
    maxDays: 56,
    birdTypes: ["Broilers (Meat)", "Layers (Eggs)", "Ducks", "Turkeys", "Guinea Fowl", "Indigenous"],
    activities: [
      "Transition feeding from Starter Mash to Grower Mash pellets",
      "Continuous growth monitoring & weigh-ins (twice weekly sampling)",
      "Deworming administration (usually via soluble anthelmintic at Week 6-8)",
      "Administer vaccine boosters (e.g., Gumboro booster, Newcastle booster)",
      "Shed space expansion & ventilation tuning to avoid ammonia buildup"
    ],
    requirements: [
      "Weigh-scale calibration checked",
      "Dewormer stock secured",
      "Shed layout configured for more feeder space"
    ],
    alerts: [
      "Strong ammonia smell indicates insufficient ventilation or damp litter. Turn litter immediately!",
      "Ensure sufficient drinker headspace to prevent feed-refusal dehydration."
    ]
  },
  {
    id: "finisher",
    name: "Finisher (Broiler)",
    ageRange: "Week 6–8",
    minDays: 36,
    maxDays: 56,
    birdTypes: ["Broilers (Meat)", "Ducks"],
    activities: [
      "Introduce high-energy Broiler Finisher mash/pellets for carcass development",
      "Daily flock weight checks and Feed Conversion Ratio (FCR) calculation",
      "Target market weights verification (Target: 2.2 kg - 2.6 kg liveweight)",
      "Enforce strictly the 7-day veterinary drug withholding period before slaughter",
      "Sale preparation - compile active buyer listings and transport crates logistics"
    ],
    requirements: [
      "FCR logs updated daily",
      "Withholding periods audited",
      "Transport logistics and crates disinfected"
    ],
    alerts: [
      "Slaughter withholding close-dates must be verified! NEVER dispatch medicated birds to consumer markets.",
      "Minimize bird handling stress during heat of day; load crates dynamically at night or early morning."
    ]
  },
  {
    id: "developer",
    name: "Developer (Layer)",
    ageRange: "Week 8–18",
    minDays: 57,
    maxDays: 126,
    birdTypes: ["Layers (Eggs)", "Indigenous", "Guinea Fowl"],
    activities: [
      "Slight calcium level adjustment and gradual pre-lay developer mash feeding",
      "Implement stepping-up lighting programme (gradually increase daylight feed cycles)",
      "Pre-lay body conditioning check & uniform weight target analysis",
      "Point-of-Lay (POL) assessment (comb/wattles development check)",
      "Introduce laying boxes/nests in dark areas of the shed to prevent floor eggs"
    ],
    requirements: [
      "Laying nests built and padded",
      "Lighting timer system calibrated",
      "Pre-lay calcium supplement inventory loaded in raw format"
    ],
    alerts: [
      "Sudden lighting updates can cause systemic stress. Increase lighting duration by maximum 15-30 minutes per week.",
      "Check uniformity index. Overweight pullets lay double-yolks; underweight pullets have delayed onset."
    ]
  },
  {
    id: "layer_production",
    name: "Layer (Production)",
    ageRange: "Week 18–72+",
    minDays: 127,
    maxDays: 504,
    birdTypes: ["Layers (Eggs)", "Indigenous", "Guinea Fowl"],
    activities: [
      "Conduct hourly/daily egg collection sequence and record grade classifications",
      "Track daily production rate (%) and calculate laying Feed-to-Egg conversion ratio",
      "Monitor calcium/limestone grit inclusion levels to maintain eggshell durability",
      "Perform periodic culling decisions on non-laying birds (shrunken pale combs)",
      "Execute post-peak management plans & veterinary booster plans"
    ],
    requirements: [
      "Egg trays and grading tables set up",
      "Culling guide protocols briefed to attendants",
      "Limestone/oyster grit stock checked"
    ],
    alerts: [
      "A drop in laying rate below 75% requires urgent feed nutritional assay or Newcastle disease check.",
      "Keep laying nests thoroughly clean and dark to prevent egg-eating behavior."
    ]
  },
  {
    id: "breeder",
    name: "Breeder",
    ageRange: "Week 24–68+",
    minDays: 168,
    maxDays: 476,
    birdTypes: ["Layers (Eggs)", "Broilers (Meat)", "Indigenous", "Ducks", "Turkeys", "Guinea Fowl"],
    activities: [
      "Track male-to-female ratio (Rooster ratio target 1:8 to 1:10) for maximum fertility",
      "Examine rooster feet & physical activity indexes",
      "Isolate clean, uniform hatching eggs and avoid washing to preserve natural cuticle coating",
      "Configure incubator temperature (37.5°C) and humdity (55-60%) for hatching batches",
      "Log candling results (Day 7 / Day 14) and record finalized hatching rate percentages"
    ],
    requirements: [
      "Rooster to hen ratio audited",
      "Incubator backup generators tested",
      "Egg storage cellar humidity regulated"
    ],
    alerts: [
      "Never wash hatching eggs with cold water; it contracts the shell pores and draws in local bacteria.",
      "Incubator temperature fluctuations of even 1°C can cause total embryo mortality."
    ]
  }
];

interface LivestockPoultryPanelProps {
  batches: PoultryBatch[];
  records: LivestockRecord[];
  suppliers: Supplier[];
  onAddPoultry: (batch: PoultryBatch) => void;
  onUpdatePoultryBatch?: (batch: PoultryBatch) => void;
  onAddFeedLog: (
    batchId: string, 
    quantityKg: number, 
    cost: number, 
    fedBy: string,
    date?: string,
    feedType?: string,
    formulaUsed?: string,
    stageId?: string
  ) => void;
  onRecordEgg: (batchId: string, total: number, gradeA: number, gradeB: number) => void;
  onAddLivestockRecord: (record: LivestockRecord) => void;
  onAddLivestockHealthEvent: (tagId: string, event: { date: string; type: string; details: string; cost: number }) => void;
  onAddLivestockFeedingLog: (tagId: string, log: { date: string; feedType: string; quantityKg: number }) => void;
  isReadonly: boolean;
  currencySymbol: string;

  // Subscription and clinical states
  subscriptionTier: string;
  setSubscriptionTier: (tier: string) => void;
  workspaceMode: "Farmer" | "Veterinary";
  setWorkspaceMode: (mode: "Farmer" | "Veterinary") => void;
  vetFeeActivation: boolean;
  setVetFeeActivation: (active: boolean) => void;
  accounts: any[];
  setAccounts: any;
  customers: any[];
  invoices: any[];
  onAddInvoice: (inv: any) => void;
  onMarkPaid: (invId: string, amount?: number) => void;
  onDeleteLivestockRecord?: (id: string) => void;
  onDeletePoultryBatch?: (id: string) => void;
  defaultVaccinationSchedule?: DefaultVaccineScheduleItem[];
  activeFarm?: any;
}

export function getStandardWeightG(birdType: string, ageDays: number): number {
  if (birdType === "Broilers (Meat)") {
    if (ageDays <= 7) return 40 + ageDays * 20;
    if (ageDays <= 14) return 180 + (ageDays - 7) * 38;
    if (ageDays <= 21) return 450 + (ageDays - 14) * 64;
    if (ageDays <= 28) return 900 + (ageDays - 21) * 85;
    if (ageDays <= 35) return 1500 + (ageDays - 28) * 85;
    return 2100 + (ageDays - 35) * 85;
  } else {
    if (ageDays <= 28) return 35 + (ageDays * 11);
    if (ageDays <= 56) return 350 + ((ageDays - 28) * 12.5);
    if (ageDays <= 84) return 700 + ((ageDays - 56) * 14);
    if (ageDays <= 126) return 1100 + ((ageDays - 84) * 9.5);
    return 1500 + ((ageDays - 126) * 7);
  }
}

export default function LivestockPoultryPanel({
  batches,
  records,
  suppliers,
  onAddPoultry,
  onUpdatePoultryBatch,
  onAddFeedLog,
  onRecordEgg,
  onAddLivestockRecord,
  onAddLivestockHealthEvent,
  onAddLivestockFeedingLog,
  isReadonly,
  currencySymbol,
  subscriptionTier,
  setSubscriptionTier,
  workspaceMode,
  setWorkspaceMode,
  vetFeeActivation,
  setVetFeeActivation,
  accounts,
  setAccounts,
  customers,
  invoices,
  onAddInvoice,
  onMarkPaid,
  onDeleteLivestockRecord,
  onDeletePoultryBatch,
  defaultVaccinationSchedule,
  activeFarm
}: LivestockPoultryPanelProps) {
  // General segment toggle
  const [segment, setSegment] = useState<"layers" | "formulation" | "livestock">("layers");

  // Custom Formulations catalog state
  const [customFormulas, setCustomFormulas] = useState<FeedFormula[]>(() => {
    const saved = localStorage.getItem("poultry_custom_formulas");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_FORMULAS.map((df, i) => ({
      ...df,
      id: `saved-formula-${i + 1}`,
      createdAt: "2026-05-15",
      farmId: "farm-1"
    })) as FeedFormula[];
  });

  // Sub-roles / Mode for Livestock Register
  const [livestockMode, setLivestockMode] = useState<"farmer" | "vet" | "clinic">("farmer");

  // -----------------------------------------------------------------
  // 3.1 Farmer Self-Managed Mode state
  // -----------------------------------------------------------------
  const [farmerSubTab, setFarmerSubTab] = useState<"herd" | "biosecurity" | "vaccination">("herd");
  const [biosecurityTab, setBiosecurityTab] = useState<"quarantine" | "visitors" | "checklist">("quarantine");
  const [herdSearch, setHerdSearch] = useState("");

  // Farmer metrics
  const filteredHerd = records.filter(animal => 
    animal.tagId.toLowerCase().includes(herdSearch.toLowerCase()) || 
    animal.species.toLowerCase().includes(herdSearch.toLowerCase()) || 
    animal.breed.toLowerCase().includes(herdSearch.toLowerCase())
  );

  // Add individual animal state
  const [newTagId, setNewTagId] = useState("");
  const [newSpecies, setNewSpecies] = useState("Cattle (Ruminant)");
  const [newBreed, setNewBreed] = useState("");
  const [newGender, setNewGender] = useState("Female");
  const [newAcquiredDate, setNewAcquiredDate] = useState("2026-05-29");
  const [newWeight, setNewWeight] = useState(380);
  const [newBreedingStatus, setNewBreedingStatus] = useState("Breeding Eligible");
  const [newPurchasePrice, setNewPurchasePrice] = useState(3500);
  const [newCurrentValue, setNewCurrentValue] = useState(4200);
  const [newAcquisitionType, setNewAcquisitionType] = useState<"Bought" | "Birthed on Farm" | "Gifted">("Bought");
  const [newSource, setNewSource] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Link biological breed and appropriate gender
  useEffect(() => {
    const matched = SPECIES_BREEDS_MAP[newSpecies];
    if (matched) {
      setNewBreed(matched.breeds[0]);
      setNewGender(matched.genders[0]);
    }
  }, [newSpecies]);

  // Forces farmer mode if workspaceMode is Farmer
  useEffect(() => {
    if (workspaceMode === "Farmer") {
      setLivestockMode("farmer");
    }
  }, [workspaceMode]);

  // Print popup states
  const [selectedAnimalForPrint, setSelectedAnimalForPrint] = useState<LivestockRecord | null>(null);

  // Self logs
  const [selectedTagForTreatment, setSelectedTagForTreatment] = useState("");
  const [selfLogType, setSelfLogType] = useState<"Vaccination" | "Treatment" | "Deworming">("Vaccination");
  const [selfDetails, setSelfDetails] = useState("");
  const [selfCost, setSelfCost] = useState(0);

  // Local-only Quarantine & Visitors Registers (with active preloaded state)
  const [quarantines, setQuarantines] = useState([
    { tagId: "CSD-202", startDate: "2026-05-20", estRelease: "2026-06-05", reason: "FMD Observation in Buffer Zone", status: "Active" },
    { tagId: "KLR-044", startDate: "2026-05-28", estRelease: "2026-06-11", reason: "Muzzle lesion quarantine isolation", status: "Active" }
  ]);
  const [qTagId, setQTagId] = useState("");
  const [qStart, setQStart] = useState("2026-05-29");
  const [qRelease, setQRelease] = useState("2026-06-12");
  const [qReason, setQReason] = useState("");

  const [visitors, setVisitors] = useState([
    { id: "v-1", name: "Mwamba Kabwe", date: "2026-05-28", org: "Lusaka Feed Distributors", purpose: "Deliver feed trial sample", bootbath: true, wheelsClens: true }
  ]);
  const [vName, setVName] = useState("");
  const [vOrg, setVOrg] = useState("");
  const [vPurpose, setVPurpose] = useState("");
  const [vBootbath, setVBootbath] = useState(true);
  const [vWheels, setVWheels] = useState(true);

  // Farmer schedules
  const [farmerSchedules, setFarmerSchedules] = useState([
    { id: "sch-1", tagId: "KLR-044", type: "Vaccination", date: "2026-06-10", notes: "Lumpy Skin disease scheduled dose" }
  ]);
  const [schTagId, setSchTagId] = useState("");
  const [schType, setSchType] = useState("Vaccination");
  const [schDate, setSchDate] = useState("2026-06-15");
  const [schNotes, setSchNotes] = useState("");

  // -----------------------------------------------------------------
  // 3.2 Veterinary Doctor (Multi-Farmer Mode) State
  // -----------------------------------------------------------------
  const [activeClient, setActiveClient] = useState("client-1");
  const [catalog, setCatalog] = useState([
    { id: "1", code: "VET-CONS", name: "Professional Client Consultation", price: 1200 },
    { id: "2", code: "VET-ANTR", name: "Anthrax Spore Vaccine Delivery", price: 350 },
    { id: "3", code: "VET-SURG", name: "Bovine C-Section/Surgery Procedure", price: 7500 },
    { id: "4", code: "VET-LABS", name: "Diagnostic Blood Smear Microscopy", price: 1100 }
  ]);
  const [newCatCode, setNewCatCode] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatPrice, setNewCatPrice] = useState<number>(500);
  const [showCatalogForm, setShowCatalogForm] = useState(false);

  // Practice catalog edit states
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [editCatCode, setEditCatCode] = useState("");
  const [editCatName, setEditCatName] = useState("");
  const [editCatPrice, setEditCatPrice] = useState<number>(0);

  const handleStartEditCatalog = (cat: any) => {
    setEditingCatalogId(cat.id);
    setEditCatCode(cat.code);
    setEditCatName(cat.name);
    setEditCatPrice(cat.price);
  };

  const handleSaveEditCatalog = (id: string) => {
    if (!editCatCode.trim() || !editCatName.trim()) {
      alert("Fields cannot be empty.");
      return;
    }
    setCatalog(prev => prev.map(cat => cat.id === id ? { ...cat, code: editCatCode, name: editCatName, price: editCatPrice } : cat));
    setEditingCatalogId(null);
  };

  const handleDeleteCatalogItem = (id: string) => {
    if (confirm("Are you sure you want to delete this catalog item?")) {
      setCatalog(prev => prev.filter(cat => cat.id !== id));
    }
  };

  const [certifiedLogs, setCertifiedLogs] = useState([
    { id: "ZVC-CRT-101", clientName: "Chisamba Dairy Ltd", tagId: "KLR-044", diagnosis: "High tick infestation & Heartwater", treatment: "Berenil Injection 15ml + Dip application", fee: 1200, certifiedDate: "2026-05-20", vetName: "Dr. Noah Mulenga", licenseNo: "ZVC-2024-88A", certNo: "VET-CERT-9051", isCleared: true }
  ]);

  const [vetDiagnosis, setVetDiagnosis] = useState("");
  const [vetTreatment, setVetTreatment] = useState("");
  const [vetServiceId, setVetServiceId] = useState("1");
  const [vetTagId, setVetTagId] = useState("");
  const [vetLicense, setVetLicense] = useState("ZVC-2024-88A");
  const [isDigitalCertChecked, setIsDigitalCertChecked] = useState(true);
  const [vetCustomerId, setVetCustomerId] = useState("");
  const [tierWarning, setTierWarning] = useState<string | null>(null);

  const [clinicName, setClinicName] = useState(() => {
    return localStorage.getItem("mabala_clinic_name") || "Lusaka Metropolitan Veterinary Clinic";
  });
  const [clinicLicense, setClinicLicense] = useState(() => {
    return localStorage.getItem("mabala_clinic_license") || "ZVC-CLINIC-9024X";
  });
  const [clinicAddress, setClinicAddress] = useState(() => {
    return localStorage.getItem("mabala_clinic_address") || "Plot 14, Great North Road, Lusaka, Zambia";
  });
  const [clinicPhone, setClinicPhone] = useState(() => {
    return localStorage.getItem("mabala_clinic_phone") || "+260 966 887766";
  });

  useEffect(() => {
    localStorage.setItem("mabala_clinic_name", clinicName);
  }, [clinicName]);
  useEffect(() => {
    localStorage.setItem("mabala_clinic_license", clinicLicense);
  }, [clinicLicense]);
  useEffect(() => {
    localStorage.setItem("mabala_clinic_address", clinicAddress);
  }, [clinicAddress]);
  useEffect(() => {
    localStorage.setItem("mabala_clinic_phone", clinicPhone);
  }, [clinicPhone]);

  useEffect(() => {
    if (subscriptionTier !== "Veterinary Doctor Practitioner" && (livestockMode === "vet" || livestockMode === "clinic")) {
      setLivestockMode("farmer");
    }
  }, [subscriptionTier, livestockMode]);

  const [vetVisits, setVetVisits] = useState([
    { id: "vv-1", clientName: "Chisamba Dairy Ltd", date: "2026-06-03", purpose: "Quarterly herd vaccination walkthrough", status: "Scheduled", smsSent: false },
    { id: "vv-2", clientName: "Makeni Angus Stud", date: "2026-06-12", purpose: "Bull breeding capability diagnostic", status: "Scheduled", smsSent: false }
  ]);
  const [vvisitClient, setVvisitClient] = useState(customers && customers.length > 0 ? customers[0].name : "Chisamba Dairy Ltd");
  const [vvisitDate, setVvisitDate] = useState("2026-06-15");
  const [vvisitPurpose, setVvisitPurpose] = useState("");

  const [selectedCertPrint, setSelectedCertPrint] = useState<any | null>(null);

  // -----------------------------------------------------------------
  // 3.3 Vet Clinic (Multi-Vet Mode) State
  // -----------------------------------------------------------------
  const [clinicVets, setClinicVets] = useState([
    { id: "v1", name: "Dr. Noah Mulenga", specialty: "Bovine Surgeon", license: "ZVC-2024-88A", status: "On Duty", assignedClients: "Chisamba Dairy Ltd" },
    { id: "v2", name: "Dr. Chileshe Tembo", specialty: "Vaccine Epidemiologist", license: "ZVC-2025-45B", status: "Consulting", assignedClients: "Makeni Angus Stud" }
  ]);
  const [newVetName, setNewVetName] = useState("");
  const [newVetSpec, setNewVetSpec] = useState("Bovine Diagnostician");
  const [newVetLicense, setNewVetLicense] = useState("");
  const [newVetAssign, setNewVetAssign] = useState("Kafue River Ranch");
  const [showVetForm, setShowVetForm] = useState(false);

  const [drugStock, setDrugStock] = useState([
    { id: "d1", item: "OB-Antibiotic Powder spray", batch: "BATCH-821A", expiry: "2027-12-15", qty: 25, reorderLevel: 5 },
    { id: "d2", item: "Bovishield Gold multi-vial pack", batch: "B-GOLD-991A", expiry: "2026-09-30", qty: 4, reorderLevel: 5 },
    { id: "d3", item: "Ivermectin 1% Dewormer Sol.", batch: "IVM-991B", expiry: "2026-11-20", qty: 32, reorderLevel: 10 }
  ]);
  const [reorderItemName, setReorderItemName] = useState("");
  const [reorderQty, setReorderQty] = useState(10);

  // -----------------------------------------------------------------
  // 3.4 Platform Administrator State
  // -----------------------------------------------------------------
  const [tenants, setTenants] = useState([
    { id: "t1", farmName: "Sunrise Agro-Tech Farms", tier: "Clinic Premium SaaS", active: true, herdSize: 15 },
    { id: "t2", farmName: "Kafue River Ranch", tier: "Pro Farmer Tier", active: true, herdSize: 154 },
    { id: "t3", farmName: "Zambezi Feeders Ltd", tier: "Free Trial", active: false, herdSize: 0 }
  ]);
  const [globalPlatformFee, setGlobalPlatformFee] = useState(2.5); // platform commission %
  const [flatSaaSPremium, setFlatSaaSPremium] = useState(250); // ZK flat monthly charge

  // -----------------------------------------------------------------
  // Poultry Sub-segment state (from the original script)
  // -----------------------------------------------------------------
  const [selectedPoultryIds, setSelectedPoultryIds] = useState<string[]>([]);
  const [selectedLivestockIds, setSelectedLivestockIds] = useState<string[]>([]);
  const [selectedStageTab, setSelectedStageTab] = useState<Record<string, string>>({});
  const [showAddPoultry, setShowAddPoultry] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [birdType, setBirdType] = useState<PoultryBatch["birdType"]>("Layers (Eggs)");
  const [breed, setBreed] = useState("Lohmann Brown");
  const [productionSystem, setProductionSystem] = useState("Deep Litter Egg Production");
  const [quantity, setQuantity] = useState(1000);
  const [shed, setShed] = useState("Shed Alpha");
  const [initialStatus, setInitialStatus] = useState<PoultryBatch["status"]>("ACTIVE > BROODING");
  const [unitAcquisitionCost, setUnitAcquisitionCost] = useState<number>(12);
  const [arrivalDateInput, setArrivalDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [sourceSupplierInput, setSourceSupplierInput] = useState("Zambia National Breeders");

  // Advanced Batch Module States
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [batchStatusFilter, setBatchStatusFilter] = useState<"ACTIVE" | "ARCHIVED" | "ALL" | "VACCINATION">("ACTIVE");
  const [vHubSubTab, setVHubSubTab] = useState<"calendar" | "outbreak" | "inventory">("calendar");
  const [transportCostInput, setTransportCostInput] = useState<number>(150);
  const [brooderSetupCostInput, setBrooderSetupCostInput] = useState<number>(300);
  const [notesInput, setNotesInput] = useState<string>("");
  const [targetStageInput, setTargetStageInput] = useState<string>("Laying");
  const [customPrefixInput, setCustomPrefixInput] = useState<string>("LAY");

  // VACCINATION MANAGEMENT SYSTEM FOR POULTRY
  // 1. Persistent Vaccine inventory stockpile state
  const [vaccineInventory, setVaccineInventory] = useState<{
    id: string;
    name: string;
    batchLot: string;
    expiryDate: string;
    quantityVials: number;
    route: string;
    dosesPerVial: number;
  }[]>(() => {
    const saved = localStorage.getItem("poultry_vaccine_inventory");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: "vac-inv-1", name: "Newcastle ND-IB Live Vaccine", batchLot: "LOT-ND902", expiryDate: "2027-04-18", quantityVials: 15, route: "Eye Drop", dosesPerVial: 1000 },
      { id: "vac-inv-2", name: "Gumboro Intermediate Strain", batchLot: "LOT-GB404", expiryDate: "2026-06-25", quantityVials: 8, route: "Drinking Water", dosesPerVial: 505 },
      { id: "vac-inv-3", name: "Marek's Disease HVT Live", batchLot: "LOT-MK112", expiryDate: "2026-05-10", quantityVials: 3, route: "SC Injection", dosesPerVial: 1000 }, // Expired
      { id: "vac-inv-4", name: "Fowl Pox Freeze-Dried Vial", batchLot: "LOT-FP808", expiryDate: "2026-06-18", quantityVials: 5, route: "Wing Web Stab", dosesPerVial: 1000 } // Expiring soon
    ];
  });

  // Persistent SMS Alerts Simulation structures
  const [smsRegisteredMobile, setSmsRegisteredMobile] = useState("0979123456");
  const [smsRemindersEnabled, setSmsRemindersEnabled] = useState(true);
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  // Form states for administering vaccine
  const [adminRecord, setAdminRecord] = useState<{
    batchId: string;
    vaccineIndex: number;
    actualDate: string;
    brandName: string;
    lotNumber: string;
    dosePerBird: string;
    route: string;
    birdsVaccinated: number;
    administeredBy: string;
  } | null>(null);

  // Form states for adding custom vaccine schedule entry
  const [showAddSchedForm, setShowAddSchedForm] = useState<string | null>(null); // batchId
  const [newSchedAgeDay, setNewSchedAgeDay] = useState<number>(7);
  const [newSchedVaccine, setNewSchedVaccine] = useState("");
  const [newSchedDisease, setNewSchedDisease] = useState("");
  const [newSchedRoute, setNewSchedRoute] = useState("Drinking Water");

  // Form states for rescheduling a vaccine
  const [reschedRecord, setReschedRecord] = useState<{
    batchId: string;
    vaccineIndex: number;
    newDueDate: string;
  } | null>(null);

  // State to manage adding vaccine products to inventory
  const [newInvName, setNewInvName] = useState("");
  const [newInvLot, setNewInvLot] = useState("");
  const [newInvExpiry, setNewInvExpiry] = useState(() => new Date().toISOString().split('T')[0]);
  const [newInvQty, setNewInvQty] = useState(10);
  const [newInvRoute, setNewInvRoute] = useState("Drinking Water");
  const [newInvDoses, setNewInvDoses] = useState(1000);

  // Outbreak response states
  const [emergencyVaccine, setEmergencyVaccine] = useState("Emergency ND La Sota Drops");
  const [emergencyDisease, setEmergencyDisease] = useState("Newcastle Disease Outbreak");
  const [emergencyLot, setEmergencyLot] = useState("ZMC-OUTBREAK-99A");
  const [emergencyRoute, setEmergencyRoute] = useState("Drinking Water");
  const [emergencyDose, setEmergencyDose] = useState("1 drop");
  const [emergencyAdminBy, setEmergencyAdminBy] = useState("Dr. Chileshe Tembo (Epidemiologist)");

  useEffect(() => {
    localStorage.setItem("poultry_vaccine_inventory", JSON.stringify(vaccineInventory));
  }, [vaccineInventory]);

  // Helper: date addition
  const addDaysToDate = (dateStr: string, days: number): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  // Helper: check overdue status relative to 2026-06-02
  const isDateOverdue = (dueDateStr?: string): boolean => {
    if (!dueDateStr) return false;
    const todayStr = "2026-06-02";
    return dueDateStr < todayStr;
  };

  // Helper: generate full default schedule
  const generateDefaultSchedule = (typeStr: string, startDateStr: string): VaccinationRecord[] => {
    const isLayer = typeStr.toLowerCase().includes("layer");
    const isBroiler = typeStr.toLowerCase().includes("broiler") || typeStr.toLowerCase().includes("meat");
    
    let listToMap: { ageDay: number; vaccine: string; diseaseTarget: string; route: string }[] = [];

    if (defaultVaccinationSchedule && defaultVaccinationSchedule.length > 0) {
      listToMap = defaultVaccinationSchedule
        .filter(item => {
          if (item.birdType === "Broiler/Layer") return true;
          if (item.birdType === "Layer only" && isLayer) return true;
          if (item.birdType === "Broiler only" && isBroiler) return true;
          return false;
        })
        .map(item => ({
          ageDay: item.ageInDays,
          vaccine: item.vaccine,
          diseaseTarget: item.diseaseTarget,
          route: item.route
        }));
    } else {
      if (isLayer) {
        listToMap = [
          { ageDay: 1, vaccine: "Marek's Disease Vaccine", diseaseTarget: "Marek's Disease", route: "SC Injection" },
          { ageDay: 7, vaccine: "ND-IB Strain live", diseaseTarget: "Newcastle & Infectious Bronchitis", route: "Eye Drop" },
          { ageDay: 14, vaccine: "Gumboro IBD (Mild)", diseaseTarget: "Infectious Bursal Disease", route: "Drinking Water" },
          { ageDay: 21, vaccine: "Gumboro IBD (Intermediate)", diseaseTarget: "Infectious Bursal Disease", route: "Drinking Water" },
          { ageDay: 28, vaccine: "Newcastle La Sota Booster", diseaseTarget: "Newcastle Disease", route: "Drinking Water" },
          { ageDay: 42, vaccine: "Fowl Pox Vaccine", diseaseTarget: "Fowl Pox", route: "Wing Web Stab" },
          { ageDay: 56, vaccine: "TAD Salmonella Live", diseaseTarget: "Salmonella", route: "Drinking Water" },
          { ageDay: 70, vaccine: "Infectious Coryza Oil", diseaseTarget: "Coryza", route: "IM Injection" },
          { ageDay: 84, vaccine: "3-in-1 EDS+ND+IB Complex", diseaseTarget: "Egg Drop / ND / IB", route: "IM Injection" }
        ];
      } else if (isBroiler) {
        listToMap = [
          { ageDay: 1, vaccine: "Newcastle ND-IB Spray", diseaseTarget: "Newcastle & IB", route: "Eye Drop / Spray" },
          { ageDay: 7, vaccine: "Gumboro Mild Starter", diseaseTarget: "Infectious Bursal", route: "Drinking Water" },
          { ageDay: 14, vaccine: "Gumboro Intermediate Bio", diseaseTarget: "Infectious Bursal", route: "Drinking Water" },
          { ageDay: 18, vaccine: "Newcastle La Sota Booster", diseaseTarget: "Newcastle Disease", route: "Drinking Water" }
        ];
      } else {
        listToMap = [
          { ageDay: 1, vaccine: "Marek's Disease Vaccine", diseaseTarget: "Marek's Disease", route: "SC Injection" },
          { ageDay: 10, vaccine: "Newcastle La Sota Drop", diseaseTarget: "Newcastle Disease", route: "Eye Drop" },
          { ageDay: 18, vaccine: "Gumboro Intermediate Water", diseaseTarget: "Infectious Bursal", route: "Drinking Water" },
          { ageDay: 30, vaccine: "Newcastle Booster La Sota", diseaseTarget: "Newcastle Disease", route: "Drinking Water" }
        ];
      }
    }
    
    return listToMap.map((t, idx) => {
      const dueDate = addDaysToDate(startDateStr, t.ageDay);
      return {
        id: "vrec-" + Date.now() + "-" + idx,
        ageDay: t.ageDay,
        vaccine: t.vaccine,
        diseaseTarget: t.diseaseTarget,
        route: t.route,
        isOverdue: isDateOverdue(dueDate),
        status: "Pending",
        dueDate
      };
    });
  };

  // Single-batch configuration edit states
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editBatchName, setEditBatchName] = useState("");
  const [editBatchShed, setEditBatchShed] = useState("");
  const [editBatchNotes, setEditBatchNotes] = useState("");
  const [editBatchQty, setEditBatchQty] = useState<number>(0);

  const getPrefixForType = (type: PoultryBatch["birdType"]) => {
    switch (type) {
      case "Broilers (Meat)": return "BRO";
      case "Layers (Eggs)": return "LAY";
      case "Indigenous": return "IND";
      case "Ducks": return "DUK";
      case "Turkeys": return "TUR";
      case "Guinea Fowl": return "GUI";
      default: return "PLT";
    }
  };

  const handleBirdTypeChange = (type: PoultryBatch["birdType"]) => {
    setBirdType(type);
    const cfg = POULTRY_TYPES_CONFIG[type];
    if (cfg) {
      setBreed(cfg.breeds[0]);
      setProductionSystem(cfg.productionSystems[0]);
    }
    setCustomPrefixInput(getPrefixForType(type));
  };

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [feedQty, setFeedQty] = useState(150);
  const [feedCost, setFeedCost] = useState(1200);
  const [fedBy, setFedBy] = useState("Clara Mwila");
  const [showFeedForm, setShowFeedForm] = useState(false);

  const [eggBatchId, setEggBatchId] = useState("");
  const [totalEggs, setTotalEggs] = useState(850);
  const [gradeA, setGradeA] = useState(700);
  const [gradeB, setGradeB] = useState(130);
  const [showEggForm, setShowEggForm] = useState(false);

  // Per-batch action tabs state
  const [activeActionTab, setActiveActionTab] = useState<Record<string, "none" | "sell" | "medication" | "mortality" | "status" | "finance" | "feeding" | "growth" | "layer_eggs">>({});
  const [sellQty, setSellQty] = useState(100);
  const [sellPrice, setSellPrice] = useState(90);
  const [medName, setMedName] = useState("Probiotic Stress pack");
  const [medDosage, setMedDosage] = useState("5g/10L drinking water");
  const [medCostVal, setMedCostVal] = useState(150);
  const [mortQty, setMortQty] = useState(2);
  const [mortCause, setMortCause] = useState("Brooder temperature variance");
  const [mortDate, setMortDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [mortProbableCause, setMortProbableCause] = useState<"feed" | "disease" | "predator" | "unknown">("disease");
  const [mortDisposalMethod, setMortDisposalMethod] = useState("Burial with lime");

  // Feeding & Diet Tracker expanded states
  const [feedDate, setFeedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [feedTypeSelected, setFeedTypeSelected] = useState("Broiler Pre-Starter");
  const [feedFormulaName, setFeedFormulaName] = useState("Hi-Protein Pre-Starter");

  // Layer & Egg Production Management States
  const [layerEggDate, setLayerEggDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [layerGradeA, setLayerGradeA] = useState(600);
  const [layerGradeB, setLayerGradeB] = useState(150);
  const [layerBroken, setLayerBroken] = useState(15);
  const [layerDirty, setLayerDirty] = useState(20);
  const [layerHatching, setLayerHatching] = useState(10);
  const [layerTraysCollected, setLayerTraysCollected] = useState(27);
  
  // Egg sales states
  const [layerSaleDate, setLayerSaleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [layerSaleCustomer, setLayerSaleCustomer] = useState("");
  const [layerSaleUnit, setLayerSaleUnit] = useState<"tray" | "dozen" | "egg">("tray");
  const [layerSaleQty, setLayerSaleQty] = useState(10);
  const [layerSalePrice, setLayerSalePrice] = useState(65); 
  const [layerSaleTrays, setLayerSaleTrays] = useState(10);
  const [feedQtyVal, setFeedQtyVal] = useState(50);
  const [feedPricePerKg, setFeedPricePerKg] = useState(15); // e.g. $/ZK price per kg
  const [feedFeeder, setFeedFeeder] = useState("Clara Mwila");
  
  // Livestock Live Bird Sales Expanded States
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [saleCustomer, setSaleCustomer] = useState("");
  const [salePaymentMethod, setSalePaymentMethod] = useState<"Cash" | "Mobile Money" | "Bank Transfer">("Cash");
  const [saleChargeType, setSaleChargeType] = useState<"PER_BIRD" | "PER_KG">("PER_BIRD");
  const [salePricePerKg, setSalePricePerKg] = useState(60);
  const [saleAvgWeightKg, setSaleAvgWeightKg] = useState(1.8);
  const [saleDressingPercentage, setSaleDressingPercentage] = useState(75);
  
  // Blending / Formulation Transition states
  const [isBlendEnabled, setIsBlendEnabled] = useState(false);
  const [blendFeedTypeSelected, setBlendFeedTypeSelected] = useState("Broiler Grower");
  const [blendRatio, setBlendRatio] = useState(50); // percentage of primary feed

  // Financial Sub-tab and Overhead Allocation tracking
  const [poultrySubTab, setPoultrySubTab] = useState<"directory" | "financials">("directory");
  const [editingOverheadBatchId, setEditingOverheadBatchId] = useState<string | null>(null);
  const [inputLabourHours, setInputLabourHours] = useState(0);
  const [inputLabourRate, setInputLabourRate] = useState(45);
  const [inputUtilityCost, setInputUtilityCost] = useState(0);
  const [inputDepreciation, setInputDepreciation] = useState(0);
  const [isFlockEstimatorOpen, setIsFlockEstimatorOpen] = useState(false);
  const [estMarketPricePerBird, setEstMarketPricePerBird] = useState(90); // default market price indicator ZK
  
  // Weight sampling states
  const [weightDate, setWeightDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weightValueG, setWeightValueG] = useState(180);
  const [weightRemarks, setWeightRemarks] = useState("Periodic flock weight sampling check");
  const [weightSampleSize, setWeightSampleSize] = useState<number>(30);
  const [weightUniformityPct, setWeightUniformityPct] = useState<number>(85);
  
  // Inventory Allocation Input
  const [allocFeedStock, setAllocFeedStock] = useState(200);

  // Health and disease states
  const [healthEventDate, setHealthEventDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [healthEventAffected, setHealthEventAffected] = useState(10);
  const [healthEventSymptoms, setHealthEventSymptoms] = useState("");
  const [healthEventDiagnosis, setHealthEventDiagnosis] = useState("");
  const [healthEventSeverity, setHealthEventSeverity] = useState<"Mild" | "Moderate" | "Severe">("Mild");
  const [healthEventStatus, setHealthEventStatus] = useState<"Resolved" | "Ongoing" | "Resulted in Mortality">("Ongoing");
  const [healthEventTreatWithDrug, setHealthEventTreatWithDrug] = useState(false);
  const [healthEventSelectedDrugId, setHealthEventSelectedDrugId] = useState("");
  const [healthEventCustomDrug, setHealthEventCustomDrug] = useState("");
  const [healthEventActiveIngredient, setHealthEventActiveIngredient] = useState("");
  const [healthEventDosage, setHealthEventDosage] = useState("");
  const [healthEventRoute, setHealthEventRoute] = useState("Drinking Water");
  const [healthEventDuration, setHealthEventDuration] = useState(5);
  const [healthEventWithholdingDays, setHealthEventWithholdingDays] = useState(3);
  const [healthEventTreatmentCost, setHealthEventTreatmentCost] = useState(50);
  const [healthEventNotes, setHealthEventNotes] = useState("");
  const [vetSubTab, setVetSubTab] = useState<"events" | "guide" | "register" | "thresholds">("events");
  const [selectedEventIdForOutcome, setSelectedEventIdForOutcome] = useState<string | null>(null);
  const [mortalityOutcomeCount, setMortalityOutcomeCount] = useState(5);
  const [diseaseGuideSearch, setDiseaseGuideSearch] = useState("");

  const [medicationRegister, setMedicationRegister] = useState<MedicationRegisterItem[]>(() => {
    const saved = localStorage.getItem("mabala_medication_register");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: "dr-1", brandName: "Amprol Zambia 20%", activeIngredient: "Amprolium", dosageGuide: "1.25g per Litre of water", withdrawalPeriodDays: 3, routeOfAdmin: "Drinking Water", category: "Coccidiostat", indicatedFor: "Coccidiosis (bloody stools, weakness)", unitCost: 150 },
      { id: "dr-2", brandName: "Aliseryl WS Soluble", activeIngredient: "Erythromycin, Oxytetracycline, Streptomycin, Colistin", dosageGuide: "1g per Litre of water", withdrawalPeriodDays: 7, routeOfAdmin: "Drinking Water", category: "Antibiotic", indicatedFor: "CRD, Coryza, general bacterial infections", unitCost: 280 },
      { id: "dr-3", brandName: "Tylosin Tartrate Pure", activeIngredient: "Tylosin Tartrate", dosageGuide: "0.5g per Litre of water", withdrawalPeriodDays: 5, routeOfAdmin: "Drinking Water", category: "Antibiotic", indicatedFor: "Mycoplasmosis (CRD - breathing sounds)", unitCost: 310 },
      { id: "dr-4", brandName: "Piperazine Solupowder", activeIngredient: "Piperazine Citrate", dosageGuide: "2g per Litre of water (once daily)", withdrawalPeriodDays: 3, routeOfAdmin: "Drinking Water", category: "Dewormer", indicatedFor: "Roundworms, hairworms deworming", unitCost: 95 },
      { id: "dr-5", brandName: "Stress Pack Extra ZM", activeIngredient: "Multivitamins & Electrolytes", dosageGuide: "0.5g per Litre of water", withdrawalPeriodDays: 0, routeOfAdmin: "Drinking Water", category: "Vitamin/Supplement", indicatedFor: "Heat stress, transport arrivals, vaccine recovery", unitCost: 85 },
      { id: "dr-6", brandName: "Limoxin-200 LA", activeIngredient: "Oxytetracycline Dihydrate", dosageGuide: "0.2ml per kg IM injection", withdrawalPeriodDays: 14, routeOfAdmin: "IM Injection", category: "Antibiotic", indicatedFor: "Severe systemic bacterial infection in larger birds", unitCost: 180 }
    ];
  });

  useEffect(() => {
    localStorage.setItem("mabala_medication_register", JSON.stringify(medicationRegister));
  }, [medicationRegister]);

  // Drug register form states
  const [newRegBrand, setNewRegBrand] = useState("");
  const [newRegIngredient, setNewRegIngredient] = useState("");
  const [newRegDosage, setNewRegDosage] = useState("");
  const [newRegWithdrawal, setNewRegWithdrawal] = useState(5);
  const [newRegRoute, setNewRegRoute] = useState("Drinking Water");
  const [newRegCategory, setNewRegCategory] = useState<"Antibiotic" | "Dewormer" | "Coccidiostat" | "Vitamin/Supplement" | "Other">("Antibiotic");
  const [newRegIndication, setNewRegIndication] = useState("");
  const [newRegCost, setNewRegCost] = useState(100);


  // Helper functions for forms
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName) return;

    const prefix = (customPrefixInput || getPrefixForType(birdType) || "PLT").trim().toUpperCase();

    const newBatch: PoultryBatch = {
      id: "pbatch-" + Date.now(),
      batchId: `${prefix}-2026-00${batches.length + 1}`,
      batchName,
      birdType,
      breed,
      productionSystem,
      quantity,
      currentCount: quantity,
      sourceSupplier: sourceSupplierInput,
      arrivalDate: arrivalDateInput,
      assignedShed: shed,
      status: initialStatus,
      unitAcquisitionCost: unitAcquisitionCost,
      transportCost: transportCostInput,
      brooderSetupCost: brooderSetupCostInput,
      notes: notesInput,
      targetStage: targetStageInput,
      feedLogs: [],
      eggCollections: [],
      vaccinationCalendar: generateDefaultSchedule(birdType, arrivalDateInput),
      mortalityLogs: [],
      salesLogs: [],
      medications: [],
      farmId: "farm-1"
    };

    onAddPoultry(newBatch);
    setShowAddPoultry(false);

    // Reset inputs
    setBatchName("");
    setNotesInput("");
    setTransportCostInput(150);
    setBrooderSetupCostInput(300);
  };

  const handlePostFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;
    onAddFeedLog(selectedBatchId, feedQty, feedCost, fedBy);
    setShowFeedForm(false);
  };

  const handlePostEggs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eggBatchId) return;
    onRecordEgg(eggBatchId, totalEggs, gradeA, gradeB);
    setShowEggForm(false);
  };

  // 3.0. Advanced Batch Module Handlers (Duplicate, Edit, Save)
  const handleDuplicateBatch = (batch: PoultryBatch) => {
    setBatchName(`${batch.batchName} (Template Copy)`);
    setBirdType(batch.birdType);
    setBreed(batch.breed);
    setProductionSystem(batch.productionSystem || "Deep Litter Egg Production");
    setQuantity(batch.quantity);
    setShed(batch.assignedShed);
    setInitialStatus("PLANNED");
    setUnitAcquisitionCost(batch.unitAcquisitionCost ?? 12);
    setTransportCostInput(batch.transportCost ?? 150);
    setBrooderSetupCostInput(batch.brooderSetupCost ?? 300);
    setNotesInput(`Configuration copied from batch ${batch.batchId} (${batch.batchName}). ${batch.notes || ""}`);
    setTargetStageInput(batch.targetStage || "Laying");
    setCustomPrefixInput(batch.batchId.split("-")[0] || "PLT");
    setSourceSupplierInput(batch.sourceSupplier || "Zambia National Breeders");
    setShowAddPoultry(true);
    
    // Smooth scroll up to template form
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleStartEditBatch = (batch: PoultryBatch) => {
    setEditingBatchId(batch.id);
    setEditBatchName(batch.batchName);
    setEditBatchShed(batch.assignedShed);
    setEditBatchNotes(batch.notes || "");
    setEditBatchQty(batch.quantity);
  };

  const handleSaveBatchEdit = (batch: PoultryBatch) => {
    if (!onUpdatePoultryBatch) return;

    const isBroodingOrPlanned = batch.status === "PLANNED" || batch.status === "ACTIVE > BROODING" || batch.currentStageId === "brooding";
    
    let nextQty = batch.quantity;
    let nextCurrentCount = batch.currentCount;
    
    if (isBroodingOrPlanned) {
      nextQty = editBatchQty;
      const difference = editBatchQty - batch.quantity;
      nextCurrentCount = Math.max(0, batch.currentCount + difference);
    }

    onUpdatePoultryBatch({
      ...batch,
      batchName: editBatchName,
      assignedShed: editBatchShed,
      notes: editBatchNotes,
      quantity: nextQty,
      currentCount: nextCurrentCount
    });

    setEditingBatchId(null);
  };

  // 3.1 Farmer Action Submissions
  const handleRegisterAnimal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagId.trim()) return;

    const newRec: LivestockRecord = {
      id: "liv-" + Date.now(),
      type: newSpecies as any,
      species: newSpecies,
      breed: newBreed || "Indigenous Angoni",
      tagId: newTagId,
      dateAcquired: newAcquiredDate,
      purchasePrice: newAcquisitionType === "Bought" ? Number(newPurchasePrice) : 0,
      currentValue: Number(newCurrentValue),
      gender: newGender,
      acquisitionType: newAcquisitionType,
      source: newSource || "Self-bred on farm",
      healthEvents: [],
      feedingLogs: [],
      status: "Active",
      farmId: "farm-1"
    };

    onAddLivestockRecord(newRec);
    setNewTagId("");
    setNewBreed("");
    setNewSource("");
    setShowAddForm(false);
  };

  const handleAddSelfTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTagForTreatment || !selfDetails.trim()) return;

    onAddLivestockHealthEvent(selectedTagForTreatment, {
      date: new Date().toISOString().split('T')[0],
      type: selfLogType,
      details: selfDetails,
      cost: Number(selfCost)
    });

    setSelfDetails("");
    setSelfCost(0);
    setSelectedTagForTreatment("");
  };

  const handleAddQuarantine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTagId.trim()) return;
    setQuarantines(prev => [{ tagId: qTagId, startDate: qStart, estRelease: qRelease, reason: qReason, status: "Active" }, ...prev]);
    setQTagId("");
    setQReason("");
  };

  const handleAddVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) return;
    setVisitors(prev => [{ id: "v-" + Date.now(), name: vName, date: new Date().toISOString().split('T')[0], org: vOrg, purpose: vPurpose, bootbath: vBootbath, wheelsClens: vWheels }, ...prev]);
    setVName("");
    setVOrg("");
    setVPurpose("");
  };

  const handleAddFarmerSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schTagId.trim() || !schNotes.trim()) return;
    setFarmerSchedules(prev => [{ id: "sch-" + Date.now(), tagId: schTagId, type: schType, date: schDate, notes: schNotes }, ...prev]);
    setSchTagId("");
    setSchNotes("");
  };

  // 3.2 Vet Practitioner Submissions
  const handleAddVetCertifiedLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vetTagId.trim() || !vetDiagnosis.trim() || !vetCustomerId.trim()) {
      setTierWarning("Please ensure Tag ID, Client Customer, and Clinical Diagnosis are all selected.");
      return;
    }

    const matchedService = catalog.find(s => s.id === vetServiceId) || catalog[0];
    const uniqueInvId = "INV-VET-" + Date.now();
    const invoiceNumber = "INV-VET-" + Math.floor(1000 + Math.random() * 9000);

    const raisedInvoice = {
      id: uniqueInvId,
      invoiceNumber: invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerName: vetCustomerId,
      customerTpin: "",
      subtotal: matchedService.price,
      taxAmount: Math.round(matchedService.price * 0.15 * 100) / 100, // 15% localized tax
      total: Math.round(matchedService.price * 1.15 * 100) / 100,
      lines: [
        {
          description: `ZVC Professional Wellness - Procedure Applied: ${matchedService.name} on Tag [${vetTagId}]`,
          quantity: 1,
          unitPrice: matchedService.price,
          amount: matchedService.price
        }
      ],
      status: "Unpaid" as const,
      coaDebit: "1100", // Accounts Receivable
      coaCredit: "4500", // Veterinary Clinical Service Revenue
      farmId: "farm-1"
    };

    // Raise the structural invoice
    onAddInvoice(raisedInvoice);

    const newCertified = {
      id: "ZVC-CRT-" + Math.floor(1000 + Math.random() * 9000),
      clientName: vetCustomerId,
      tagId: vetTagId,
      diagnosis: vetDiagnosis,
      treatment: vetTreatment || "Observation protocols set",
      fee: matchedService.price,
      certifiedDate: new Date().toISOString().split('T')[0],
      vetName: "Dr. Noah Mulenga",
      licenseNo: vetLicense,
      certNo: "VET-CERT-" + Math.floor(10000 + Math.random() * 90000),
      isCleared: false, // Must be paid first to clear!
      invoiceId: uniqueInvId,
      clinicName: clinicName,
      clinicLicense: clinicLicense,
      clinicAddress: clinicAddress,
      clinicPhone: clinicPhone
    };

    setCertifiedLogs(prev => [newCertified, ...prev]);

    // Save actual medical record entry under target animal on the platform
    onAddLivestockHealthEvent(vetTagId, {
      date: new Date().toISOString().split('T')[0],
      type: "Veterinary Certified Diagnosis",
      details: `${vetDiagnosis} (Certified under Lic: ${vetLicense}). Treatment: ${vetTreatment}. Billed via invoice ${invoiceNumber}`,
      cost: matchedService.price
    });

    setVetDiagnosis("");
    setVetTreatment("");
    setVetTagId("");
    setVetCustomerId("");
  };

  const handleAddServicePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatCode.trim() || !newCatName.trim()) return;
    setCatalog(prev => [{ id: "cat-" + Date.now(), code: newCatCode, name: newCatName, price: newCatPrice }, ...prev]);
    setNewCatCode("");
    setNewCatName("");
    setShowCatalogForm(false);
  };

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vvisitPurpose.trim()) return;
    const client = vvisitClient || (customers && customers.length > 0 ? customers[0].name : "Chisamba Dairy Ltd");
    setVetVisits(prev => [{ id: "vv-" + Date.now(), clientName: client, date: vvisitDate, purpose: vvisitPurpose, status: "Scheduled", smsSent: false }, ...prev]);
    setVvisitPurpose("");
  };

  // 3.3 Clinic Action Submissions
  const handleOnboardVet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVetName.trim() || !newVetLicense.trim()) return;
    setClinicVets(prev => [{ id: "v-" + Date.now(), name: newVetName, specialty: newVetSpec, license: newVetLicense, status: "On Duty", assignedClients: newVetAssign }, ...prev]);
    setNewVetName("");
    setNewVetLicense("");
    setShowVetForm(false);
  };

  const handleReceiveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderItemName.trim()) return;
    setDrugStock(prev => {
      const match = prev.find(item => item.item.toLowerCase().includes(reorderItemName.toLowerCase()));
      if (match) {
        return prev.map(item => item.id === match.id ? { ...item, qty: item.qty + reorderQty } : item);
      } else {
        return [{ id: "d-" + Date.now(), item: reorderItemName, batch: "B-STK-" + Math.floor(100+Math.random()*900), expiry: "2027-12-01", qty: reorderQty, reorderLevel: 5 }, ...prev];
      }
    });
    setReorderItemName("");
    setReorderQty(10);
  };

  // PRINT VACCINE CERTIFICATE FOR BATCH
  const handlePrintVaccineCert = (batch: PoultryBatch) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const completed = batch.vaccinationCalendar ? batch.vaccinationCalendar.filter(v => v.status === "Completed") : [];
    const compliance = batch.vaccinationCalendar && batch.vaccinationCalendar.length > 0
      ? Math.round((completed.length / batch.vaccinationCalendar.length) * 100)
      : 100;

    const rowsHTML = completed.map((v, i) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 13px;">
        <td style="padding: 10px; font-weight: bold;">Day ${v.ageDay}</td>
        <td style="padding: 10px; font-weight: bold; color: #1e3a8a;">${v.vaccine}</td>
        <td style="padding: 10px; color: #475569;">${v.diseaseTarget}</td>
        <td style="padding: 10px; color: #334155; font-size: 12px; font-family: monospace;">${v.route}</td>
        <td style="padding: 10px; font-family: monospace; color: #0f766e;">${v.dateAdministered || "N/A"}</td>
        <td style="padding: 10px; font-style: italic;">${v.brandName || "N/A"} (Lot: ${v.lotNumber || "N/A"})</td>
        <td style="padding: 10px;">${v.dosePerBird || "N/A"}</td>
        <td style="padding: 10px; font-size: 11px;">${v.administeredBy || "N/A"}</td>
      </tr>
    `).join("");

    const pendingHTML = (batch.vaccinationCalendar ? batch.vaccinationCalendar.filter(v => v.status === "Pending") : []).map(v => `
      <tr style="border-bottom: 1px dashed #cbd5e1; font-family: sans-serif; font-size: 12px; color: #64748b;">
        <td style="padding: 8px; font-weight: bold;">Day ${v.ageDay}</td>
        <td style="padding: 8px;">${v.vaccine}</td>
        <td style="padding: 8px;">${v.diseaseTarget}</td>
        <td style="padding: 8px; font-family: monospace;">${v.route}</td>
        <td style="padding: 8px; color: #b91c1c; font-weight: bold;">DUE: ${v.dueDate || "N/A"}</td>
        <td colspan="3" style="padding: 8px; text-align: right; font-style: italic; color: #b91c1c;">Pending Administration</td>
      </tr>
    `).join("");

    const html = `
      <html>
        <head>
          <style>
            @media print {
              body { padding: 25px; color: #000; }
              @page { size: portrait; margin: 20mm; }
            }
          </style>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 30px; color: #1e293b;">
          <div style="border: 2px solid #0f172a; padding: 25px; border-radius: 12px; max-width: 800px; margin: 0 auto; position: relative;">
            <div style="position: absolute; top: 15px; right: 15px; font-size: 11px; font-family: monospace; border: 1px solid #10b981; color: #047857; background: #ecfdf5; padding: 6px 12px; border-radius: 6px; font-weight: bold; text-transform: uppercase;">
              🛡️ Biosecurity Pass
            </div>

            <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; color: #0f172a;">MABALA ROYAL POULTRY</h1>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #475569; letter-spacing: 1px; font-family: monospace;">ZAMBIA BIOSECURITY & FLOCK HEALTH CERTIFICATE</p>
            </div>

            <div style="margin-top: 25px; font-size: 13px; line-height: 1.6;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="width: 55%; vertical-align: top;">
                    <strong style="color: #475569; font-size: 11px; text-transform: uppercase;">Cohort Batch Info:</strong><br/>
                    <span style="font-size: 18px; font-weight: bold; color: #1e3a8a;">${batch.batchName}</span> (${batch.batchId})<br/>
                    <strong>Bird Group:</strong> ${batch.birdType} | <strong>Breed:</strong> ${batch.breed}<br/>
                    <strong>Initial GroupSize:</strong> ${batch.quantity} | <strong>Live Count:</strong> ${batch.currentCount} pieces<br/>
                    <strong>Arrival Date:</strong> ${batch.arrivalDate} | <strong>Coop Shed:</strong> ${batch.assignedShed}
                  </td>
                  <td style="width: 45%; vertical-align: top; text-align: right;">
                    <strong style="color: #475569; font-size: 11px; text-transform: uppercase;">Attending Status:</strong><br/>
                    <div style="display: inline-block; background-color: ${compliance >= 90 ? "#d1fae5" : compliance >= 70 ? "#fef3c7" : "#fee2e2"}; color: ${compliance >= 90 ? "#065f46" : compliance >= 70 ? "#92400e" : "#991b1b"}; padding: 12px 18px; border-radius: 8px; border: 1px solid; margin-top: 5px; text-align: center;">
                      <span style="font-size: 26px; font-weight: 900; display: block; line-height: 1;">${compliance}%</span>
                      <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Schedule Compliance Rate</span>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <h3 style="margin-top: 30px; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 8px; font-size: 13px; color: #0f172a; letter-spacing: 1px;">
              Completed Immunization Ledger
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; text-align: left; font-size: 12px;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569;">
                  <th style="padding: 10px;">Age Day</th>
                  <th style="padding: 10px;">Vaccine</th>
                  <th style="padding: 10px;">Disease Target</th>
                  <th style="padding: 10px;">Route</th>
                  <th style="padding: 10px;">Admin Date</th>
                  <th style="padding: 10px;">Brand & Lot</th>
                  <th style="padding: 10px;">Dose</th>
                  <th style="padding: 10px;">Vet Personnel</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHTML || `<tr><td colspan="8" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">No vaccinations logged as completed.</td></tr>`}
              </tbody>
            </table>

            ${pendingHTML ? `
              <h3 style="margin-top: 35px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; font-size: 13px; color: #64748b; letter-spacing: 1px;">
                Required Pending Schedule (Incomplete Cycles)
              </h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; text-align: left; font-size: 12px;">
                <tbody>
                  ${pendingHTML}
                </tbody>
              </table>
            ` : ""}

            <div style="margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 25px; font-size: 11px;">
              <table style="width: 100%;">
                <tr>
                  <td style="width: 33.3%; text-align: center;">
                    <div style="border-bottom: 1px solid #475569; width: 140px; margin: 0 auto 5px auto; height: 35px; position: relative;">
                      <span style="font-family: Courier, monospace; font-size: 16px; color: #1e3a8a; position: absolute; bottom: 0; left: 10px;">Dr. Mulenga P.</span>
                    </div>
                    <strong>Qualified Inspector</strong><br/>
                    Veterinary Services Director
                  </td>
                  <td style="width: 33.3%; text-align: center;">
                    <div style="border-bottom: 1px solid #475569; width: 140px; margin: 0 auto 5px auto; height: 35px; position: relative;">
                      <span style="font-family: monospace; font-weight: bold; color: #047857; font-size: 10px; border: 1px dashed; padding: 2px 5px; position: absolute; bottom: 5px; left: 15px; letter-spacing: 0.5px;">MABALA VET SERVICES CERTIFIED</span>
                    </div>
                    <strong>Official Seal of Health</strong><br/>
                    Biosecurity Verified Clear
                  </td>
                  <td style="width: 33.3%; text-align: center;">
                    <div style="border-bottom: 1px solid #475569; width: 140px; margin: 0 auto 5px auto; height: 35px; position: relative;">
                    </div>
                    <strong>Farm Representative Signature</strong><br/>
                    Manager Acknowledgment
                  </td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 35px; text-align: center; color: #94a3b8; font-size: 9px; border-top: 1px solid #f1f5f9; padding-top: 12px; font-family: monospace;">
              Government of Zambia Ministry of Agriculture standards checklist. Document ID: MOBY-CERT-${batch.batchId}-2026.
            </div>
          </div>
        </body>
      </html>
    `;

    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  // RENDER CENTRAL POULTRY VACCINATION HUB PANEL
  const renderVaccinationControlHub = () => {
    // 1. Gather all vaccination records from all active batches
    const activeBatches = batches.filter(b => b.status !== "CLOSED" && b.status !== "COMPLETED");
    
    // Aggregate calendar entries
    const overdueList: { batch: PoultryBatch; record: VaccinationRecord; idx: number }[] = [];
    const dueTodayList: { batch: PoultryBatch; record: VaccinationRecord; idx: number }[] = [];
    const upcomingList: { batch: PoultryBatch; record: VaccinationRecord; idx: number }[] = [];
    const completedList: { batch: PoultryBatch; record: VaccinationRecord; idx: number }[] = [];
    
    activeBatches.forEach(batch => {
      if (batch.vaccinationCalendar) {
        batch.vaccinationCalendar.forEach((v, idx) => {
          if (v.status === "Completed") {
            completedList.push({ batch, record: v, idx });
          } else {
            const overdue = v.dueDate && v.dueDate < "2026-06-02";
            const dueToday = v.dueDate && v.dueDate === "2026-06-02";
            if (overdue) {
              overdueList.push({ batch, record: v, idx });
            } else if (dueToday) {
              dueTodayList.push({ batch, record: v, idx });
            } else {
              upcomingList.push({ batch, record: v, idx });
            }
          }
        });
      }
    });

    // Sorters
    overdueList.sort((a,b) => (a.record.dueDate || "").localeCompare(b.record.dueDate || ""));
    dueTodayList.sort((a,b) => (a.record.dueDate || "").localeCompare(b.record.dueDate || ""));
    upcomingList.sort((a,b) => (a.record.dueDate || "").localeCompare(b.record.dueDate || ""));
    completedList.sort((a,b) => (b.record.dateAdministered || b.record.dueDate || "").localeCompare(a.record.dateAdministered || a.record.dueDate || ""));

    // Overdue Flag Calculation
    const overdueTotal = overdueList.length;

    // Vaccine Inventory helper alerts
    const inventoryWarnings = vaccineInventory.filter(item => {
      const isExpired = item.expiryDate < "2026-06-02";
      const isSoon = !isExpired && item.expiryDate <= addDaysToDate("2026-06-02", 45); // within 45 days
      const isLow = item.quantityVials <= 3;
      return isExpired || isSoon || isLow;
    });

    // Average compliance rate across active batches
    let totalRates = 0;
    let ratesCount = 0;
    activeBatches.forEach(b => {
      if (b.vaccinationCalendar && b.vaccinationCalendar.length > 0) {
        const compCount = b.vaccinationCalendar.filter(v => v.status === "Completed").length;
        totalRates += (compCount / b.vaccinationCalendar.length) * 100;
        ratesCount++;
      }
    });
    const avgComplianceRate = ratesCount > 0 ? Math.round(totalRates / ratesCount) : 100;

    // Trigger SMS Push alerts simulation handler
    const handleTriggerTestAlerts = (v: VaccinationRecord, b: PoultryBatch) => {
      if (!smsRemindersEnabled) {
        setAlertFeedback("⚠️ Warning: SMS Push notifications are currently toggled OFF in mobile settings.");
        setTimeout(() => setAlertFeedback(null), 5000);
        return;
      }
      const daysLeft = v.dueDate ? Math.round((new Date(v.dueDate).getTime() - new Date("2026-06-02").getTime()) / (1000 * 60 * 60 * 24)) : 2;
      const hoursLabel = daysLeft === 1 ? "24 Hours" : "48 Hours";
      
      setAlertFeedback(`📱 Simulating SMS Gateway reminders generated at minus ${hoursLabel} on mobile ${smsRegisteredMobile}:\n\n"MABALA HEALTH WARNING: Cohort ${b.batchName} has vaccination ${v.vaccine} scheduled on ${v.dueDate} (Route: ${v.route}). Ensure biosecurity locks on house entry."`);
      setTimeout(() => setAlertFeedback(null), 10000);
    };

    // Emergency mass immunization routine
    const triggerEmergencyHerdVaccination = () => {
      if (batches.length === 0) return;
      
      batches.forEach(batch => {
        if (batch.status === "CLOSED" || batch.status === "COMPLETED") return;
        
        // Build emergency record
        const emergencyRecord: VaccinationRecord = {
          id: "vrec-emerg-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          ageDay: batch.arrivalDate ? Math.round((new Date("2026-06-02").getTime() - new Date(batch.arrivalDate).getTime()) / (1000*60*60*24)) : 10,
          vaccine: emergencyVaccine,
          diseaseTarget: emergencyDisease,
          route: emergencyRoute,
          isOverdue: false,
          status: "Completed",
          dueDate: "2026-06-02",
          dateAdministered: "2026-06-02",
          brandName: "Emergency Response Stockpile Lot " + emergencyLot,
          lotNumber: emergencyLot,
          dosePerBird: emergencyDose,
          birdsVaccinated: batch.currentCount,
          administeredBy: emergencyAdminBy,
          completedOnTime: true
        };

        if (onUpdatePoultryBatch) {
          onUpdatePoultryBatch({
            ...batch,
            vaccinationCalendar: [...(batch.vaccinationCalendar || []), emergencyRecord]
          });
        }
      });

      // Charge finance for rapid disaster immunization
      // Create a small random treatment med charge for audit record
      setAlertFeedback(`🔥 EMERGENCY COUNTERMEASURE DEPLOYED: Emergency mass immunization with ${emergencyVaccine} deployed across all active flocks. Complete biosecurity logs synchronized dynamically.`);
      setTimeout(() => setAlertFeedback(null), 8500);
    };

    // Inventory restock handler
    const handleAddInventory = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newInvName || !newInvLot) return;
      const newItem = {
        id: "vac-inv-" + Date.now(),
        name: newInvName,
        batchLot: newInvLot,
        expiryDate: newInvExpiry,
        quantityVials: newInvQty,
        route: newInvRoute,
        dosesPerVial: newInvDoses
      };
      setVaccineInventory(prev => [newItem, ...prev]);
      setNewInvName("");
      setNewInvLot("");
      setNewInvQty(10);
    };

    const handleDeleteInventory = (id: string) => {
      setVaccineInventory(prev => prev.filter(p => p.id !== id));
    };

    // Unified Administer action dispatch
    const handleQuickAdminister = (batch: PoultryBatch, originIndex: number) => {
      const v = batch.vaccinationCalendar[originIndex];
      // Try to find matching lot in stockpile inventory
      const matchingStock = vaccineInventory.find(i => i.name.toLowerCase().includes(v.vaccine.toLowerCase().substring(0, 8)));
      setAdminRecord({
        batchId: batch.id,
        vaccineIndex: originIndex,
        actualDate: "2026-06-02",
        brandName: matchingStock?.name || v.vaccine + " Brand",
        lotNumber: matchingStock?.batchLot || "LOT-" + Math.floor(100+Math.random()*900),
        dosePerBird: "0.2 mL",
        route: v.route,
        birdsVaccinated: batch.currentCount,
        administeredBy: "Dr. Noah Mulenga (Senior Veterinarian)"
      });
    };

    const submitQuickAdminister = () => {
      if (!adminRecord) return;
      
      const b = batches.find(x => x.id === adminRecord.batchId);
      if (!b) return;

      const schedule = b.vaccinationCalendar ? [...b.vaccinationCalendar] : [];
      const originalV = schedule[adminRecord.vaccineIndex];
      if (!originalV) return;

      // Update vaccine item in schedule
      const onTime = adminRecord.actualDate <= (originalV.dueDate || "");
      schedule[adminRecord.vaccineIndex] = {
        ...originalV,
        status: "Completed",
        dateAdministered: adminRecord.actualDate,
        brandName: adminRecord.brandName,
        lotNumber: adminRecord.lotNumber,
        dosePerBird: adminRecord.dosePerBird,
        route: adminRecord.route,
        birdsVaccinated: adminRecord.birdsVaccinated,
        administeredBy: adminRecord.administeredBy,
        completedOnTime: onTime,
        isOverdue: false
      };

      // Update batch
      if (onUpdatePoultryBatch) {
        onUpdatePoultryBatch({
          ...b,
          vaccinationCalendar: schedule
        });
      }

      // Decrement vaccine stock inventory check
      setVaccineInventory(prev => prev.map(inv => {
        if (inv.batchLot === adminRecord.lotNumber || inv.name === adminRecord.brandName) {
          return { ...inv, quantityVials: Math.max(0, inv.quantityVials - 1) };
        }
        return inv;
      }));

      setAdminRecord(null);
      setAlertFeedback(`✅ SUCCESS: Vaccination logged completes. Ledger synchronized, inventory levels adjusted recursively.`);
      setTimeout(() => setAlertFeedback(null), 5000);
    };

    return (
      <div className="space-y-6 text-xs text-slate-800 animate-fade-in" id="vaccination-dashboard-view">
        
        {/* Dynamic Alerts Banner */}
        {alertFeedback && (
          <div className="bg-slate-900 text-cyan-400 p-4 border border-cyan-800/80 rounded-2xl font-mono leading-relaxed shadow-lg flex items-start gap-3 whitespace-pre-wrap">
            <span className="text-xl">📱</span>
            <div className="flex-1">
              <strong className="text-white block uppercase tracking-wide text-[10px] mb-1">MABALA SECURE COMMUNICATION PORT LOGS</strong>
              {alertFeedback}
            </div>
            <button onClick={() => setAlertFeedback(null)} className="text-slate-400 hover:text-white font-black">×</button>
          </div>
        )}

        {/* Central Dashboard Metrics Deck */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-3xs">
            <span className="text-[10px] uppercase font-extrabold text-slate-400">Overdue Immunizations</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl font-black ${overdueTotal > 0 ? "text-rose-600 animate-pulse" : "text-slate-700"}`}>{overdueTotal}</span>
              <span className="text-[10px] font-semibold text-rose-500">delayed doses</span>
            </div>
            <p className="text-[10px] leading-tight text-slate-500 mt-1 font-medium">Requires immediate, direct treatment in cohorts.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-3xs">
            <span className="text-[10px] uppercase font-extrabold text-slate-400">Farm Compliance Level</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl font-black ${avgComplianceRate >= 90 ? "text-emerald-700" : avgComplianceRate >= 70 ? "text-amber-600" : "text-rose-600"}`}>
                {avgComplianceRate}%
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {avgComplianceRate >= 90 ? "🛡️ Excellent" : avgComplianceRate >= 70 ? "🟡 Warn" : "🔴 Critical"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Percentage of scheduled doses administered successfully on time.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-3xs">
            <span className="text-[10px] uppercase font-extrabold text-slate-400">Active Stockpile Assets</span>
            <span className="block text-2xl font-black text-indigo-950 mt-2">
              {vaccineInventory.reduce((s, x) => s + x.quantityVials, 0)} <span className="text-xs font-semibold text-slate-500">Vials</span>
            </span>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Capable of immunization protection loops across multiple flocks.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-3xs">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 font-sans">Stock Warnings & Expiries</span>
            <span className={`block text-2xl font-black mt-2 ${inventoryWarnings.length > 0 ? "text-amber-600" : "text-emerald-700"}`}>
              {inventoryWarnings.length > 0 ? `${inventoryWarnings.length} Alerts` : "✓ Secure"}
            </span>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Vaccine lot stocks expiring soon, expired, or down to low levels.</p>
          </div>
        </div>

        {/* Central Hub Controls Bar */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1 select-none">
          <button
            onClick={() => setVHubSubTab("calendar")}
            className={`flex-1 py-2 text-center text-[10.5px] uppercase tracking-wider font-extrabold rounded-xl transition-all cursor-pointer ${
              vHubSubTab === "calendar" ? "bg-white text-slate-900 border border-slate-200 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📅 Unified Vaccine Calendar & Due Checksheets
          </button>
          <button
            onClick={() => setVHubSubTab("outbreak")}
            className={`flex-1 py-2 text-center text-[10.5px] uppercase tracking-wider font-extrabold rounded-xl transition-all cursor-pointer ${
              vHubSubTab === "outbreak" ? "bg-white text-rose-950 border border-rose-200 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🚨 HERD VACCINATION (Emergency Outbreak Countermeasure)
          </button>
          <button
            onClick={() => setVHubSubTab("inventory")}
            className={`flex-1 py-2 text-center text-[10.5px] uppercase tracking-wider font-extrabold rounded-xl transition-all cursor-pointer ${
              vHubSubTab === "inventory" ? "bg-white text-slate-900 border border-slate-200 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🧪 Vaccine Biologics Stockpile Inventory ({vaccineInventory.length})
          </button>
        </div>

        {/* ADMINISTER DIALOG OVERLAY POPUP */}
        {adminRecord && (
          <div className="bg-slate-100 p-5 rounded-2xl border-2 border-indigo-200/80 space-y-4 animate-slide-up">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                💉 Record Vaccine Administration Field Log
              </h4>
              <button onClick={() => setAdminRecord(null)} className="text-slate-400 hover:text-slate-600 font-extrabold text-base">×</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Actual Date Adm.</label>
                <input type="date" value={adminRecord.actualDate} onChange={e => setAdminRecord({ ...adminRecord, actualDate: e.target.value })} className="p-2 border rounded-lg bg-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Vaccine Brand / Product</label>
                <select 
                  value={adminRecord.brandName} 
                  onChange={e => {
                    const matched = vaccineInventory.find(x => x.name === e.target.value);
                    setAdminRecord({ 
                      ...adminRecord, 
                      brandName: e.target.value,
                      lotNumber: matched?.batchLot || adminRecord.lotNumber 
                    });
                  }} 
                  className="p-2 border rounded-lg bg-white"
                >
                  <option value={adminRecord.brandName}>{adminRecord.brandName}</option>
                  {vaccineInventory.map(item => (
                    <option key={item.id} value={item.name}>{item.name} ({item.batchLot})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Batch Lot Number</label>
                <input type="text" value={adminRecord.lotNumber} onChange={e => setAdminRecord({ ...adminRecord, lotNumber: e.target.value })} className="p-2 border rounded-lg bg-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Dose Per Bird (Standard Target)</label>
                <input type="text" value={adminRecord.dosePerBird} onChange={e => setAdminRecord({ ...adminRecord, dosePerBird: e.target.value })} className="p-2 border rounded-lg bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold mt-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Birds Vaccinated</label>
                <input type="number" value={adminRecord.birdsVaccinated} onChange={e => setAdminRecord({ ...adminRecord, birdsVaccinated: Number(e.target.value) })} className="p-2 border rounded-lg bg-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Administered Route</label>
                <input type="text" value={adminRecord.route} onChange={e => setAdminRecord({ ...adminRecord, route: e.target.value })} className="p-2 border rounded-lg bg-white font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Attending Veterinarian / Performed By</label>
                <input type="text" value={adminRecord.administeredBy} onChange={e => setAdminRecord({ ...adminRecord, administeredBy: e.target.value })} className="p-2 border rounded-lg bg-white" />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t mt-4 gap-2">
              <button onClick={() => setAdminRecord(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer">Cancel</button>
              <button onClick={submitQuickAdminister} className="px-5 py-2 bg-indigo-700 hover:bg-indigo-650 text-white rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs">
                ✓ Commit Vaccination Ledger
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: UNIFIED VACCINE CALENDAR */}
        {vHubSubTab === "calendar" && (
          <div className="space-y-5">
            {/* SMS alerts settings console */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">📬</span>
                <div>
                  <strong className="text-xs font-extrabold text-slate-800 uppercase block tracking-wide">Zambian SMS & Push Alerts Gateway Reminders</strong>
                  <p className="text-[10.5px] leading-normal text-slate-500 font-semibold font-sans mt-0.5">
                    Integrated directly with mobile carrier gateway. Reminders trigger dynamically at <strong className="text-indigo-900 font-black">48 Hours</strong> and <strong className="text-indigo-900 font-black">24 Hours</strong> prior to vaccine due date thresholds in coops.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
                <div className="flex flex-col text-right font-mono">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Alert Designation</span>
                  <input type="text" value={smsRegisteredMobile} onChange={e => setSmsRegisteredMobile(e.target.value)} className="text-[11px] font-bold p-1 bg-white border border-slate-200 rounded text-slate-700 text-center w-28" />
                </div>
                <button
                  onClick={() => setSmsRemindersEnabled(prev => !prev)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    smsRemindersEnabled ? "bg-emerald-700 text-white" : "bg-slate-300 text-slate-650"
                  }`}
                >
                  {smsRemindersEnabled ? "✓ Reminders ON" : "Reminders OFF"}
                </button>
              </div>
            </div>

            {/* Overdue Task Group */}
            {overdueList.length > 0 && (
              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-220 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">Critical Field Hazard</span>
                  <h4 className="font-extrabold text-xs uppercase text-rose-950 tracking-wider">🔴 OVERDUE VACCINATIONS IN ACTIVE SHEDS</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-[11px] border-collapse bg-white rounded-xl border border-rose-200 overflow-hidden">
                    <thead>
                      <tr className="bg-rose-100/50 text-[10px] text-rose-950 uppercase border-b border-rose-200 font-black">
                        <th className="p-3">Flock Cohort</th>
                        <th className="p-3">Vaccine Requirement</th>
                        <th className="p-3">Designation / Disease Target</th>
                        <th className="p-3">Administration Route</th>
                        <th className="p-3">Scheduled Target Date</th>
                        <th className="p-3">Dose Delay Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueList.map(item => {
                        const daysOver = Math.round((new Date("2026-06-02").getTime() - new Date(item.record.dueDate || "").getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <tr key={item.record.id || item.idx} className="border-b border-rose-100 font-semibold hover:bg-rose-50/30 transition-all">
                            <td className="p-3 text-slate-900">
                              <span className="font-bold">🐓 {item.batch.batchName}</span> 
                              <span className="block font-mono text-[9px] text-slate-400">({item.batch.assignedShed} • {item.batch.batchId})</span>
                            </td>
                            <td className="p-3 text-rose-955 font-bold">{item.record.vaccine}</td>
                            <td className="p-3 text-slate-650">{item.record.diseaseTarget}</td>
                            <td className="p-3 text-slate-500 font-mono text-[10px]">{item.record.route}</td>
                            <td className="p-3 text-slate-700 font-mono">{item.record.dueDate}</td>
                            <td className="p-3 font-black text-rose-700">
                              ⚠️ OVERDUE BY {daysOver} {daysOver === 1 ? "DAY" : "DAYS"}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleQuickAdminister(item.batch, item.idx)}
                                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-650 text-white rounded-lg text-[9.5px] uppercase font-black tracking-wider transition-all shadow-3xs cursor-pointer"
                              >
                                💉 Administer Now
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* General Grid: Today + Upcoming + Audit Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Due Today & Upcoming Vaccines */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-3xs">
                <div className="border-b pb-2 flex justify-between items-center">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <span>⏳ UPCOMING & TODAY'S IMMUNIZATIONS</span>
                  </h4>
                  <span className="text-[10px] font-sans font-extrabold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-100">
                    {dueTodayList.length + upcomingList.length} Doses Pending
                  </span>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {dueTodayList.length === 0 && upcomingList.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                      <span className="text-3xl block">✓</span>
                      <strong className="text-[11px] block mt-2 text-slate-500 font-black uppercase">No upcoming vaccines scheduled</strong>
                      <p className="text-[9.5px] mt-0.5 leading-tight font-medium">All active cycles of immunization are fully completed down to date limits.</p>
                    </div>
                  )}

                  {dueTodayList.map(item => (
                    <div key={item.record.id || item.idx} className="bg-yellow-50/50 p-3.5 rounded-xl border border-yellow-250 flex justify-between items-center gap-3 shadow-3xs hover:bg-yellow-100/30 transition-all">
                      <div className="space-y-0.5">
                        <span className="bg-yellow-700 text-yellow-50 text-[8.5px] font-black uppercase px-2 py-0.2 rounded font-sans tracking-wider">🌟 DUE TODAY</span>
                        <h5 className="font-black text-slate-800 text-[11px] leading-tight pt-1">
                          🐓 {item.batch.batchName} ({item.batch.batchId})
                        </h5>
                        <p className="text-indigo-900 font-bold text-[10.5px] pt-0.5">{item.record.vaccine}</p>
                        <span className="block text-[9.5px] text-slate-500">Day {item.record.ageDay} • Target: {item.record.diseaseTarget} • Route: {item.record.route}</span>
                      </div>
                      <button
                        onClick={() => handleQuickAdminister(item.batch, item.idx)}
                        className="px-3 py-2 bg-yellow-700 hover:bg-yellow-650 text-white rounded-lg text-[9.5px] uppercase font-black tracking-wider shadow-3xs cursor-pointer transition-all"
                      >
                        💉 Inject
                      </button>
                    </div>
                  ))}

                  {upcomingList.map(item => {
                    const daysLeft = Math.round((new Date(item.record.dueDate || "").getTime() - new Date("2026-06-02").getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={item.record.id || item.idx} className="bg-slate-55 p-3 rounded-xl border border-slate-200/90 flex justify-between items-center gap-3">
                        <div className="space-y-0.5">
                          <span className="bg-slate-200 text-slate-700 text-[8.5px] font-black tracking-wider uppercase px-2 py-0.2 rounded font-sans">
                            In {daysLeft} {daysLeft === 1 ? "day" : "days"} (Due: {item.record.dueDate})
                          </span>
                          <h5 className="font-extrabold text-slate-800 text-[11px] leading-none pt-1">
                            🐓 {item.batch.batchName} ({item.batch.batchId})
                          </h5>
                          <p className="text-slate-650 font-bold text-[10px] pt-0.5">{item.record.vaccine}</p>
                          <span className="block text-[9.5px] text-slate-500">Day {item.record.ageDay} • Route: {item.record.route}</span>
                        </div>
                        <div className="flex flex-col gap-1.5 items-end">
                          <button
                            onClick={() => handleTriggerTestAlerts(item.record, item.batch)}
                            className="bg-white border hover:border-indigo-400 text-slate-600 font-bold px-2.5 py-1 rounded-md text-[9px] shadow-3xs hover:bg-indigo-50 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>📱 Carrier Push test</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Administered Vaccine Audit Trail */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-3xs">
                <div className="border-b pb-2 flex justify-between items-center">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <span>✅ ADMINISTERED IMMUNIZATION AUDIT TRAIL</span>
                  </h4>
                  <span className="text-[10px] font-sans font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    {completedList.length} Doses Logged
                  </span>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {completedList.length === 0 && (
                    <div className="text-center py-10 text-slate-400 font-sans">
                      <span className="text-4xl">🧾</span>
                      <strong className="text-[11px] block mt-2 text-slate-500 font-black uppercase">ledger history is empty</strong>
                      <p className="text-[9.5px] mt-0.5 leading-tight font-medium">Record vaccine applications in custom batch files or calendar to populate trail.</p>
                    </div>
                  )}

                  {completedList.map(item => (
                    <div key={item.record.id || item.idx} className="bg-emerald-50/20 p-3 rounded-xl border border-emerald-200/50 flex flex-col gap-1 text-slate-700 font-semibold font-sans">
                      <div className="flex justify-between items-start">
                        <span className="bg-emerald-700 text-white text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded">
                          ✓ Administered {item.record.dateAdministered}
                        </span>
                        {item.record.completedOnTime ? (
                          <span className="text-emerald-700 font-black text-[9px] uppercase tracking-wider">✓ Certified On-Time</span>
                        ) : (
                          <span className="text-amber-600 font-black text-[9px] uppercase tracking-wider">⚠️ Delayed but Secured</span>
                        )}
                      </div>
                      <div className="text-[11px] pt-1">
                        <strong className="text-slate-900">{item.record.vaccine}</strong> on <span className="font-bold">🐓 {item.batch.batchName} ({item.batch.assignedShed})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 bg-white p-1.5 rounded-lg border border-emerald-100/50 text-[10px] font-medium text-slate-500 mt-1">
                        <span>Brand: <strong className="text-slate-700">{item.record.brandName || "Brand X"}</strong></span>
                        <span>Lot No: <strong className="text-slate-700">{item.record.lotNumber || "LOT-Z"}</strong></span>
                        <span>Dose Ratio: <strong className="text-slate-700">{item.record.dosePerBird || "0.5 mL"}</strong></span>
                        <span>Qualified Administrator: <strong className="text-slate-700">{item.record.administeredBy || "Dr. Mulenga"}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: EMERGENCY OUTBREAK CONSOLE */}
        {vHubSubTab === "outbreak" && (
          <div className="bg-rose-50 p-6 rounded-2xl border-2 border-rose-300 space-y-5">
            <div className="flex gap-4">
              <span className="text-3xl mt-1">🚨</span>
              <div className="space-y-1">
                <h4 className="font-black text-rose-955 text-xs uppercase tracking-widest">EMERGENCY HERD IMMUNIZATION FOR EPIDEMIC CONTROL</h4>
                <p className="text-[11px] text-rose-900 font-semibold leading-relaxed max-w-2xl">
                  In the event of a biosecurity breach or regional vaccine-preventable disease outbreak (e.g., highly pathogenic Newcastle strains in the district), you can trigger rapid disaster Response Immunization across <strong className="font-black">ALL active poultry batches</strong> on your farm instantly.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-3xs grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Disaster Vaccine Product</label>
                <input type="text" value={emergencyVaccine} onChange={e => setEmergencyVaccine(e.target.value)} className="p-3 border rounded-xl font-bold bg-slate-50/50" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Target Threat Disease</label>
                <input type="text" value={emergencyDisease} onChange={e => setEmergencyDisease(e.target.value)} className="p-3 border rounded-xl font-bold bg-slate-50/50" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Response stockpile Lot Number</label>
                <input type="text" value={emergencyLot} onChange={e => setEmergencyLot(e.target.value)} className="p-3 border rounded-xl font-mono font-bold bg-slate-50/50" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Administration Route</label>
                <input type="text" value={emergencyRoute} onChange={e => setEmergencyRoute(e.target.value)} className="p-3 border rounded-xl font-bold bg-slate-50/50" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Disaster Dose per Bird Ratio</label>
                <input type="text" value={emergencyDose} onChange={e => setEmergencyDose(e.target.value)} className="p-3 border rounded-xl font-bold bg-slate-50/50" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Command Surgeon / Field Specialist</label>
                <input type="text" value={emergencyAdminBy} onChange={e => setEmergencyAdminBy(e.target.value)} className="p-3 border rounded-xl font-bold bg-slate-50/50" />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-rose-200">
              <button
                type="button"
                onClick={() => {
                  if (confirm("🚨 DEPLOY RAPID COUNTERMEASURES: This operation will write a Completed vaccination of today " + emergencyVaccine + " into ALL active, unclosed poultry batches (" + activeBatches.length + " flocks) now. Confirm deployment?")) {
                    triggerEmergencyHerdVaccination();
                  }
                }}
                className="px-6 py-3 bg-rose-700 hover:bg-rose-850 text-white rounded-xl text-[10.5px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 animate-pulse"
              >
                📡 Deploy Emergency Herd Outbreak Immunization
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: VACCINE BIOLOGICS STOCKPILE */}
        {vHubSubTab === "inventory" && (
          <div className="space-y-6">
            
            {/* Stockpile registers */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
              <div className="border-b pb-2 flex justify-between items-center">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-950">🧪 Qualified Biologics Inventory (The Cold-Chain Vaccine registry)</h4>
                <p className="text-[10px] text-slate-400 font-bold font-sans">Required cold-chain storage status: <strong>2°C to 8°C Monitored</strong></p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-[11px] border-collapse overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-600 uppercase border-b border-slate-200 font-black">
                      <th className="p-3">Vaccine Name</th>
                      <th className="p-3">Lot No.</th>
                      <th className="p-3">Expiry Date</th>
                      <th className="p-3">Target Route</th>
                      <th className="p-3 text-center">Standard doses/Vial</th>
                      <th className="p-3 text-center">Stock level (Vials)</th>
                      <th className="p-3">Status Flags</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccineInventory.map(item => {
                      const isExpired = item.expiryDate < "2026-06-02";
                      const daysToExpiry = item.expiryDate ? Math.round((new Date(item.expiryDate).getTime() - new Date("2026-06-02").getTime()) / (1000 * 60 * 60 * 24)) : 100;
                      const isSoon = !isExpired && daysToExpiry <= 45;
                      const isLow = item.quantityVials <= 3;
                      
                      return (
                        <tr key={item.id} className="border-b border-slate-100 font-semibold hover:bg-slate-50/50 transition-all">
                          <td className="p-3 text-indigo-950 font-bold">{item.name}</td>
                          <td className="p-3 font-mono text-slate-500 font-black">{item.batchLot}</td>
                          <td className="p-3 font-mono text-slate-800">{item.expiryDate}</td>
                          <td className="p-3 text-slate-500">{item.route}</td>
                          <td className="p-3 text-center text-slate-600 font-mono font-bold">{item.dosesPerVial}</td>
                          <td className="p-3 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-black ${isLow ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-slate-100 text-slate-800"}`}>
                              {item.quantityVials}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-[10px]">
                            {isExpired && (
                              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-250 uppercase font-bold animate-pulse">
                                🚫 EXPIRED (DO NOT ADMINISTER)
                              </span>
                            )}
                            {isSoon && (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase font-semibold">
                                ⚠️ EXPIRING SOON ({daysToExpiry} days)
                              </span>
                            )}
                            {!isExpired && !isSoon && (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-250 uppercase font-bold">
                                ✓ COLD-CHAIN OK
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm("Remove vaccine item " + item.name + " from registries?")) {
                                  handleDeleteInventory(item.id);
                                }
                              }}
                              className="text-rose-600 hover:text-rose-850 font-black cursor-pointer bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 transition-all"
                            >
                              <Trash className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Restock Form */}
            <form onSubmit={handleAddInventory} className="bg-slate-100 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h5 className="font-black text-xs uppercase tracking-wider text-slate-800">
                📥 Add Vaccine Lots to Cold-Chain Stockpile Registry
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Vaccine Name</label>
                  <input type="text" placeholder="e.g. Gumboro intermediate V" value={newInvName} onChange={e => setNewInvName(e.target.value)} required className="p-2.5 border bg-white rounded-lg" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Batch Lot Number</label>
                  <input type="text" placeholder="e.g. LOT-GUMB102" value={newInvLot} onChange={e => setNewInvLot(e.target.value)} required className="p-2.5 border bg-white rounded-lg font-mono uppercase" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">LOT EXPIRY DATE</label>
                  <input type="date" value={newInvExpiry} onChange={e => setNewInvExpiry(e.target.value)} required className="p-2.5 border bg-white rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Vials Received Quantity</label>
                  <input type="number" value={newInvQty} onChange={e => setNewInvQty(Math.max(1, Number(e.target.value)))} required className="p-2.5 border bg-white rounded-lg" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Doses Per Vial</label>
                  <input type="number" value={newInvDoses} onChange={e => setNewInvDoses(Math.max(10, Number(e.target.value)))} required className="p-2.5 border bg-white rounded-lg font-mono font-bold" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Target Route</label>
                  <select value={newInvRoute} onChange={e => setNewInvRoute(e.target.value)} className="p-2.5 border bg-white rounded-lg font-bold">
                    <option value="Drinking Water">Drinking Water (Mass oral)</option>
                    <option value="Eye Drop">Eye Drop (Intraocular)</option>
                    <option value="SC Injection">SC Injection (Subcutaneous)</option>
                    <option value="IM Injection">IM Injection (Intramuscular)</option>
                    <option value="Wing Web Stab">Wing Web Stab (Transdermal)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-650 text-white rounded-xl text-[10.5px] uppercase font-black tracking-wider transition-all cursor-pointer shadow-3xs"
                >
                  ✓ Restock Cold-Chain biosecurity Item
                </button>
              </div>
            </form>

          </div>
        )}

      </div>
    );
  };

  const handleDownloadPDF = (sale: any, batch: PoultryBatch) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Color Theme: Emerald green representation of FarmFlow
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, 210, 42, "F");

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.text("FarmFlow", 15, 18);
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.text("Sustainable Poultry Husbandry & Live Ledger", 15, 25);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.text("COMMERCIAL SALE RECEIPT", 120, 16);
    doc.text("& DELIVERY NOTE", 120, 22);
    doc.setFontSize(8);
    doc.setFont("Helvetica", "normal");
    doc.text(`Voucher ID: ${sale.id || "REC-" + Date.now().toString().slice(-6)}`, 120, 28);
    doc.text(`Reference Date: ${sale.date}`, 120, 32);
    doc.text(`Batch Linkage: ${batch.batchId}`, 120, 36);

    // Customer & Farm details block
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "bold");
    doc.text("CONSIGNEE / CUSTOMER INFORMATION:", 15, 52);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Name: ${sale.customerName || "Walk-In Cash Customer"}`, 15, 58);
    doc.text(`Payment Instrument: ${sale.paymentMethod || "Cash"}`, 15, 63);
    doc.text(`Status: Paid in Full`, 15, 68);

    doc.setFont("Helvetica", "bold");
    doc.text("PRODUCER / BATCH SOURCE SPECIFICATIONS:", 110, 52);
    doc.setFont("Helvetica", "normal");
    doc.text(`Batch ID: ${batch.batchId}`, 110, 58);
    doc.text(`Cohort Name: ${batch.batchName}`, 110, 63);
    doc.text(`Bird Breed: ${batch.breed} (${batch.birdType})`, 110, 68);
    doc.text(`Operational Status: ${batch.status}`, 110, 73);

    // Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(15, 82, 180, 8, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Item / Species Description", 18, 87);
    doc.text("Volume (Birds)", 78, 87);
    doc.text("Avg Live Weight (kg)", 110, 87);
    doc.text("Carcass Yield (Dressed)", 148, 87);
    doc.text("Value (ZK)", 180, 87);

    // Table Rows
    doc.setFont("Helvetica", "normal");
    const weightDesc = sale.averageWeightKg ? `${sale.averageWeightKg} kg` : "N/A";
    const dressingDesc = sale.dressingPercentage ? `${sale.dressingPercentage}%` : "N/A";
    const totalDressedWeight = (sale.averageWeightKg && sale.dressingPercentage) 
      ? `${(sale.quantity * sale.averageWeightKg * (sale.dressingPercentage / 100)).toFixed(1)} kg` 
      : "N/A";

    doc.text(`${batch.breed} Live Poultry`, 18, 97);
    doc.text(`${sale.quantity} Birds`, 78, 97);
    doc.text(weightDesc, 110, 97);
    doc.text(totalDressedWeight, 148, 97);
    doc.text(`${currencySymbol} ${sale.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 180, 97);

    // Divider
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 105, 195, 105);

    // Dynamic Calculations / Margins Summary
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(8.5);
    doc.text("Processing Yield Metrics:", 15, 113);
    doc.text(`- dressing percentage: ${dressingDesc}`, 15, 118);
    doc.text(`- total live weight: ${sale.averageWeightKg ? (sale.quantity * sale.averageWeightKg).toFixed(1) + " kg" : "N/A"}`, 15, 123);
    doc.text(`- estimated dressed carcass harvest: ${totalDressedWeight}`, 15, 128);

    doc.text("Economic Valuation Indicators (Prorated Margin Analysis):", 110, 113);
    const salePerBird = sale.pricePerBird ?? 0;
    doc.text(`- sale revenue per bird: ${currencySymbol} ${salePerBird.toFixed(2)}`, 110, 118);
    const costPerBird = sale.grossMarginPerBird !== undefined ? (salePerBird - sale.grossMarginPerBird) : 0;
    doc.text(`- prorated husbandry cost / bird: ${currencySymbol} ${costPerBird.toFixed(2)}`, 110, 123);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 118, 110); // slate-800
    const marginStr = sale.grossMarginPerBird !== undefined ? `${currencySymbol} ${sale.grossMarginPerBird.toFixed(2)}` : "N/A";
    doc.text(`- gross margin / bird sold: ${marginStr}`, 110, 128);

    // Total box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(120, 138, 75, 24, "F");
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.rect(120, 138, 75, 24, "S");

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.text("Net Value:", 124, 144);
    doc.text(`${currencySymbol} ${sale.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 164, 144);
    doc.setFont("Helvetica", "bold");
    doc.text("TOTAL DUE:", 124, 150);
    doc.setFontSize(11);
    doc.setTextColor(15, 118, 110);
    doc.text(`${currencySymbol} ${sale.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 164, 150);

    // Terms
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.text("Biosecurity Compliance Stamp: All birds originate from a strictly managed chemical-free withdrawal cycle.", 15, 172);
    doc.text("Disclaimer: Meat processed from live birds should meet statutory local hygiene regulations. Non-refundable.", 15, 176);

    // Signatures
    doc.setDrawColor(148, 163, 184);
    doc.line(15, 215, 75, 215);
    doc.text("Authorized Farm Controller Signature", 15, 220);

    doc.line(125, 215, 185, 215);
    doc.text("Consignee / Customer Acceptance Signature", 125, 220);

    doc.save(`FarmFlow_Voucher_${batch.batchId}_${sale.date}.pdf`);
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

      {/* Primary Navigation Toggle zwischen Poultry und Livestock & Vet */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-2xl text-xs font-bold shadow-sm select-none border border-slate-200">
        <button 
          onClick={() => setSegment("layers")} 
          className={`flex-1 py-2.5 rounded-xl transition-all ${segment === "layers" ? "bg-white text-emerald-900 shadow font-extrabold pb-2.5" : "text-slate-500 hover:text-slate-800"}`}
        >
          🥚 Poultry & Egg Batches
        </button>
        <button 
          onClick={() => setSegment("formulation")} 
          className={`flex-1 py-2.5 rounded-xl transition-all ${segment === "formulation" ? "bg-white text-amber-955 shadow font-extrabold pb-2.5 border-b border-amber-400" : "text-slate-500 hover:text-slate-850"}`}
        >
          🌾 Feed Formulation Builder
        </button>
        <button 
          onClick={() => setSegment("livestock")} 
          className={`flex-1 py-2.5 rounded-xl transition-all ${segment === "livestock" ? "bg-white text-emerald-950 shadow font-extrabold pb-2.5" : "text-slate-500 hover:text-slate-800"}`}
        >
          🐄 Livestock & Vet Practice
        </button>
      </div>

      {segment === "layers" && (
        // POULTRY SECTION (Preserved from original code with elegant clean layout)
        <div className="space-y-6 animate-fade-in text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="text-xs uppercase font-extrabold text-slate-800 tracking-wider mb-2">Record Daily Poultry Feed Intake</h4>
              <p className="text-[11px] text-slate-500 mb-4 bg-white/50 p-2.5 rounded-lg border font-medium">
                Saves feed expense entry (Dr 5210 Feed Cost) and debit counts.
              </p>
              {showFeedForm ? (
                <form onSubmit={handlePostFeed} className="space-y-3">
                  <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} required className="w-full text-xs border bg-white rounded-lg p-2 font-bold text-slate-800">
                    <option value="">-- Choose Active Batch --</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.batchName} ({b.birdType})</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Feed Consumed (Kgs)" value={feedQty} onChange={e => setFeedQty(Number(e.target.value))} required className="text-xs border p-2 rounded-lg" />
                    <input type="number" placeholder="Cost ($/ZK)" value={feedCost} onChange={e => setFeedCost(Number(e.target.value))} required className="text-xs border p-2 rounded-lg" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowFeedForm(false)} className="px-3 py-1.5 bg-slate-200 text-[10px] uppercase font-extrabold rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-emerald-600 font-extrabold text-white text-[10px] uppercase rounded-lg">Daily Log</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowFeedForm(true)} className="w-full py-2.5 bg-slate-900 font-bold text-white text-[10px] uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-colors">Log Feed Distribution</button>
              )}
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="text-xs uppercase font-extrabold text-slate-800 tracking-wider mb-2">Record Hen Egg Collections</h4>
              <p className="text-[11px] text-slate-500 mb-4 bg-white/50 p-2.5 rounded-lg border font-medium">
                Monitors HDEP (Hen Day Egg Production) metrics per batch size.
              </p>
              {showEggForm ? (
                <form onSubmit={handlePostEggs} className="space-y-3">
                  <select value={eggBatchId} onChange={e => setEggBatchId(e.target.value)} required className="w-full text-xs border bg-white rounded-lg p-2 font-bold text-slate-800">
                    <option value="">-- Choose Layers/Egg Batch --</option>
                    {batches.filter(b => ["Layers (Eggs)", "Indigenous", "Guinea Fowl"].includes(b.birdType)).map(b => (
                      <option key={b.id} value={b.id}>{b.batchName} ({b.birdType})</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" placeholder="Total Collected" value={totalEggs} onChange={e => setTotalEggs(Number(e.target.value))} required className="text-xs border p-2 rounded-lg" />
                    <input type="number" placeholder="Grade A" value={gradeA} onChange={e => setGradeA(Number(e.target.value))} required className="text-xs border p-2 rounded-lg" />
                    <input type="number" placeholder="Grade B" value={gradeB} onChange={e => setGradeB(Number(e.target.value))} required className="text-xs border p-2 rounded-lg" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowEggForm(false)} className="px-3 py-1.5 bg-slate-200 text-[10px] uppercase font-extrabold rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-emerald-600 font-extrabold text-white text-[10px] uppercase rounded-lg">Record Eggs</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowEggForm(true)} className="w-full py-2.5 bg-slate-900 font-bold text-white text-[10px] uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-colors">Log Egg Collection</button>
              )}
            </div>

          </div>

          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden border-slate-200">
            <div className="px-6 py-4 bg-slate-50/50 border-b flex justify-between items-center flex-wrap gap-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Flock Batches Directory</h4>
                <p className="text-[11px] text-slate-500 font-semibold">Digital Poultry Feed logs, vaccine indicators, and medication blocks tracker</p>
              </div>
              <button onClick={() => setShowAddPoultry(!showAddPoultry)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">+ Add Batch</button>
            </div>

            {/* SUBTAB ALLOCATION SWITCHER */}
            <div className="px-6 py-3 bg-slate-100/50 border-b flex items-center justify-between flex-wrap gap-2">
              <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setPoultrySubTab("directory")}
                  className={`text-[10.5px] font-extrabold uppercase px-4 py-2 rounded-lg tracking-wider transition-all cursor-pointer ${poultrySubTab === "directory" ? "bg-white text-slate-900 shadow-3xs font-black" : "text-slate-500 hover:text-slate-800"}`}
                >
                  🔍 Cohorts & Checklists ({batches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPoultrySubTab("financials")}
                  className={`text-[10.5px] font-extrabold uppercase px-4 py-2 rounded-lg tracking-wider transition-all cursor-pointer ${poultrySubTab === "financials" ? "bg-white text-emerald-900 shadow-3xs font-black border-b border-emerald-400" : "text-slate-500 hover:text-slate-800"}`}
                >
                  📊 Financial P&L & Performance Insights
                </button>
              </div>
              {poultrySubTab === "directory" && (
                <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg">
                  Active Birds: {batches.filter(b => ["PLANNED", "ACTIVE > BROODING", "ACTIVE > GROWING", "ACTIVE > FINISHING", "ACTIVE > LAYING", "PARTIAL SALE"].includes(b.status)).reduce((acc, current) => acc + current.currentCount, 0).toLocaleString()}
                </span>
              )}
            </div>

            {showAddPoultry && (
              <form onSubmit={handleCreateBatch} className="p-6 bg-slate-50/50 border-b space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h5 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Initialize Flock Batch</h5>
                  <span className="text-[10px] bg-slate-200/80 px-2.5 py-1 rounded font-mono font-bold text-slate-700">
                    ID PREVIEW: <strong className="text-emerald-700">{(customPrefixInput || "PLT").toUpperCase()}-2026-00{batches.length + 1}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Batch Name</label>
                    <input type="text" placeholder="May Layers Batch 2" value={batchName} onChange={e => setBatchName(e.target.value)} required className="text-xs border p-2.5 bg-white rounded-lg" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bird Type</label>
                    <select value={birdType} onChange={e => handleBirdTypeChange(e.target.value as any)} className="text-xs border p-2.5 bg-white rounded-lg">
                      <option value="Layers (Eggs)">Layers (Egg Production)</option>
                      <option value="Broilers (Meat)">Broilers (Meat birds)</option>
                      <option value="Indigenous">Indigenous / Village Chickens</option>
                      <option value="Ducks">Ducks (Pekin duck meat)</option>
                      <option value="Turkeys">Turkeys (Seasonal production)</option>
                      <option value="Guinea Fowl">Guinea Fowl (Zambian smallholder)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Customizable ID Prefix</label>
                    <input type="text" placeholder="e.g. BRO, LAY_NORTH" value={customPrefixInput} onChange={e => setCustomPrefixInput(e.target.value)} required className="text-xs border p-2.5 bg-white rounded-lg font-mono uppercase" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Breed Selection</label>
                    <select value={breed} onChange={e => setBreed(e.target.value)} className="text-xs border p-2.5 bg-white rounded-lg">
                      {POULTRY_TYPES_CONFIG[birdType]?.breeds.map(br => (
                        <option key={br} value={br}>{br}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Production System / Focus</label>
                    <select value={productionSystem} onChange={e => setProductionSystem(e.target.value)} className="text-xs border p-2.5 bg-white rounded-lg">
                      {POULTRY_TYPES_CONFIG[birdType]?.productionSystems.map(sys => (
                        <option key={sys} value={sys}>{sys}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Initial Quantity of Birds</label>
                    <input type="number" placeholder="Quantity birds" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required className="text-xs border p-2.5 bg-white rounded-lg" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned Shed / Coop Area</label>
                    <input type="text" placeholder="Shed Segment" value={shed} onChange={e => setShed(e.target.value)} className="text-xs border p-2.5 bg-white rounded-lg" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Initial Status Lifecycle</label>
                    <select value={initialStatus} onChange={e => setInitialStatus(e.target.value as any)} className="text-xs border p-2.5 bg-white rounded-lg font-bold text-emerald-950">
                      <option value="PLANNED">PLANNED (Shed prepared, date set)</option>
                      <option value="ACTIVE > BROODING">ACTIVE &gt; BROODING (Chicks received)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target Stage On Completion</label>
                    <select value={targetStageInput} onChange={e => setTargetStageInput(e.target.value)} className="text-xs border p-2.5 bg-white rounded-lg font-semibold text-slate-700">
                      <option value="Brooding">Brooding Stage Goal</option>
                      <option value="Growing">Growing Stage Goal</option>
                      <option value="Finishing">Finishing / Harvest Goal</option>
                      <option value="Laying">Laying Egg Cycle Goal</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Price per Chick ({currencySymbol})</label>
                    <input type="number" placeholder="Cost per chick" value={unitAcquisitionCost} onChange={e => setUnitAcquisitionCost(Number(e.target.value))} required className="text-xs border p-2.5 bg-white rounded-lg font-mono text-emerald-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Transport Cost ({currencySymbol})</label>
                    <input type="number" placeholder="Transport cost" value={transportCostInput} onChange={setTransportCostInput as any} required className="text-xs border p-2.5 bg-white rounded-lg font-mono text-emerald-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Brooder Setup Cost ({currencySymbol})</label>
                    <input type="number" placeholder="Setup cost" value={brooderSetupCostInput} onChange={setBrooderSetupCostInput as any} required className="text-xs border p-2.5 bg-white rounded-lg font-mono text-emerald-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Arrival / Expected Delivery</label>
                    <input type="date" value={arrivalDateInput} onChange={e => setArrivalDateInput(e.target.value)} required className="text-xs border p-2.5 bg-white rounded-lg font-mono" />
                  </div>
                  <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Source Supplier</label>
                    <input type="text" value={sourceSupplierInput} onChange={e => setSourceSupplierInput(e.target.value)} required className="text-xs border p-2.5 bg-white rounded-lg animate-fade-in" />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Config Notes & Comments (Persistant Templates)</label>
                    <textarea rows={2} placeholder="Add comments, vaccine suppliers, feeding regime specifications, etc. This notes area will persist during batch copying/template duplicates." value={notesInput} onChange={e => setNotesInput(e.target.value)} className="text-xs border p-2.5 bg-white rounded-lg w-full resize-none" default_val="" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2 border-t">
                  <button type="button" onClick={() => setShowAddPoultry(false)} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-xs">Incept Batch</button>
                </div>
              </form>
            )}

            {poultrySubTab === "directory" ? (() => {
              // Calculate stats for live concurrent active cohorts
              const activeFlocks = batches.filter(b => ["PLANNED", "ACTIVE > BROODING", "ACTIVE > GROWING", "ACTIVE > FINISHING", "ACTIVE > LAYING", "PARTIAL SALE"].includes(b.status));
              const activeBirdsCount = activeFlocks.reduce((sum, b) => sum + b.currentCount, 0);
              
              // Overall mortality rate (across all active flocks)
              const totalOriginalBirds = activeFlocks.reduce((sum, b) => sum + b.quantity, 0);
              const averageMortality = totalOriginalBirds > 0 ? (((totalOriginalBirds - activeBirdsCount) / totalOriginalBirds) * 105) : 0;

              // Average FCR calculation for active Broiler flocks
              const activeBroilerFlocks = activeFlocks.filter(b => b.birdType === "Broilers (Meat)");
              let overallFcrSum = 0;
              let broilerFlocksWithFeedCount = 0;
              activeBroilerFlocks.forEach(b => {
                const totalFeedIn = b.feedLogs ? b.feedLogs.reduce((s, l) => s + l.quantityKg, 0) : 0;
                const weightGained = b.currentCount * 1.8;
                const fcr = weightGained > 0 ? (totalFeedIn / weightGained) : 0;
                if (fcr > 0) {
                  overallFcrSum += fcr;
                  broilerFlocksWithFeedCount++;
                }
              });
              const avgBroilerFcr = broilerFlocksWithFeedCount > 0 ? (overallFcrSum / broilerFlocksWithFeedCount) : 1.65;

              // Cumulative capitalized double-entry ledger cost (Biological asset value + incurred costs)
              const totalCapitalizedCost = batches.reduce((sum, b) => {
                const acqCost = b.quantity * (b.unitAcquisitionCost ?? 12);
                const trans = b.transportCost ?? 0;
                const setup = b.brooderSetupCost ?? 0;
                const feed = b.feedLogs ? b.feedLogs.reduce((acc, current) => acc + current.cost, 0) : 0;
                const meds = b.medications ? b.medications.reduce((acc, current) => acc + current.cost, 0) : 0;
                return sum + acqCost + trans + setup + feed + meds;
              }, 0);

              const filteredBatches = batches.filter(batch => {
                const q = batchSearchQuery.toLowerCase().trim();
                const matchesSearch = !q || 
                  batch.batchName.toLowerCase().includes(q) ||
                  batch.batchId.toLowerCase().includes(q) ||
                  batch.breed.toLowerCase().includes(q) ||
                  batch.assignedShed.toLowerCase().includes(q) ||
                  (batch.notes && batch.notes.toLowerCase().includes(q));

                const isActiveStatus = ["PLANNED", "ACTIVE > BROODING", "ACTIVE > GROWING", "ACTIVE > FINISHING", "ACTIVE > LAYING", "PARTIAL SALE"].includes(batch.status);
                const isCompletedOrClosed = ["COMPLETED", "CLOSED"].includes(batch.status);

                if (batchStatusFilter === "ACTIVE") {
                  return matchesSearch && isActiveStatus;
                } else if (batchStatusFilter === "ARCHIVED") {
                  return matchesSearch && isCompletedOrClosed;
                }
                return matchesSearch;
              });

              return (
                <div className="p-6 space-y-6">
                  {/* METRICS DASHBOARD BANNER */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Concurrent Batches</span>
                      <span className="text-base font-black text-slate-800 block mt-0.5">{activeFlocks.length} Active</span>
                      <span className="text-[9px] text-slate-500 font-medium">Archive: {batches.length - activeFlocks.length} Completed</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Flock Population</span>
                      <span className="text-base font-black text-emerald-700 block mt-0.5">{activeBirdsCount.toLocaleString()} Live Birds</span>
                      <span className="text-[9px] text-slate-500 font-medium font-sans">Mortality: {Math.min(100, Math.max(0, averageMortality / 10)).toFixed(1)}%</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Broiler FCR Standard</span>
                      <span className="text-base font-black text-blue-700 block mt-0.5">{avgBroilerFcr.toFixed(2)} Index</span>
                      <span className="text-[9px] text-slate-505 font-medium">Biological Feed Conv.</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Capitalization Total</span>
                      <span className="text-base font-black text-slate-900 block mt-0.5">{currencySymbol} {totalCapitalizedCost.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-505 font-medium">Shed, transport &amp; chicks</span>
                    </div>
                  </div>

                  {/* SEARCH & ARCHIVE CONTROLS */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-white pb-3 border-b border-slate-200/50">
                    <div className="relative w-full md:w-80">
                      <input
                        type="text"
                        placeholder="🔍 Search batches by name, breed, ID, coops..."
                        value={batchSearchQuery}
                        onChange={e => setBatchSearchQuery(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 pl-3.5 focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-slate-50/50 font-bold"
                      />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl self-stretch md:self-auto flex-wrap sm:flex-nowrap gap-1">
                      <button
                        type="button"
                        onClick={() => setBatchStatusFilter("ACTIVE")}
                        className={`text-[10px] font-extrabold uppercase px-3 py-2 rounded-lg tracking-wider transition-all cursor-pointer ${batchStatusFilter === "ACTIVE" ? "bg-white text-slate-900 shadow-xs border-b border-slate-100 font-black" : "text-slate-500 hover:text-slate-800 font-extrabold"}`}
                      >
                        ⚡ Active Cohorts ({activeFlocks.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBatchStatusFilter("ARCHIVED")}
                        className={`text-[10px] font-extrabold uppercase px-3 py-2 rounded-lg tracking-wider transition-all cursor-pointer ${batchStatusFilter === "ARCHIVED" ? "bg-white text-slate-900 shadow-xs border-b border-slate-100 font-black" : "text-slate-500 hover:text-slate-800 font-extrabold"}`}
                      >
                        📂 Completed Archive ({batches.length - activeFlocks.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBatchStatusFilter("ALL")}
                        className={`text-[10px] font-extrabold uppercase px-3 py-2 rounded-lg tracking-wider transition-all cursor-pointer ${batchStatusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs border-b border-slate-100 font-black" : "text-slate-500 hover:text-slate-800 font-extrabold"}`}
                      >
                        All ({batches.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBatchStatusFilter("VACCINATION")}
                        className={`text-[10px] font-extrabold uppercase px-3 py-2 rounded-lg tracking-wider transition-all cursor-pointer ${batchStatusFilter === "VACCINATION" ? "bg-white text-indigo-950 shadow-xs border-b border-indigo-200 font-black" : "text-slate-500 hover:text-slate-800 font-extrabold"}`}
                      >
                        🩺 Vaccination Control Hub
                      </button>
                    </div>
                  </div>

                  {/* Floating Bulk Selection Action Bar */}
                  {selectedPoultryIds.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-xl mb-6 shadow-xs animate-fade-in font-sans">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 text-[10px] flex items-center justify-center font-black">
                          {selectedPoultryIds.length}
                        </span>
                        <span className="text-[11px] text-rose-900 font-bold">
                          Poultry Cohort{selectedPoultryIds.length > 1 ? "s" : ""} selected for bulk actions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPoultryIds([])}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          Deselect All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const selectedItems = batches.filter(b => selectedPoultryIds.includes(b.id));
                            const itemNames = selectedItems.map(b => `${b.batchName} (${b.birdType})`);
                            
                            const triggerConfirm = (window as any).triggerGlobalConfirm;
                            if (triggerConfirm) {
                              triggerConfirm({
                                title: "Bulk Delete Poultry Batches",
                                message: `CRITICAL SEGURE AUDIT: You are about to bulk and soft-delete ${selectedPoultryIds.length} poultry batch cohort registries from the Mabala system. This action will place them in the secure archives.`,
                                isBulk: true,
                                itemCount: selectedPoultryIds.length,
                                itemNames: itemNames,
                                onConfirm: () => {
                                  selectedPoultryIds.forEach(id => {
                                    if (onDeletePoultryBatch) onDeletePoultryBatch(id);
                                  });
                                  setSelectedPoultryIds([]);
                                }
                              });
                            } else {
                              if (window.confirm(`Are you sure you want to bulk-delete ${selectedPoultryIds.length} selected poultry batches?`)) {
                                selectedPoultryIds.forEach(id => {
                                  if (onDeletePoultryBatch) onDeletePoultryBatch(id);
                                });
                                setSelectedPoultryIds([]);
                              }
                            }
                          }}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <Trash className="w-3 h-3" />
                          <span>Bulk Delete Selected</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {filteredBatches.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 w-full">
                      <span className="text-4xl text-slate-400">🐔</span>
                      <h5 className="font-extrabold text-slate-800 text-xs uppercase mt-3 pb-1">No matching batches found</h5>
                      <p className="text-[11px] text-slate-500 font-bold font-sans">Adjust search criteria or toggle folders to view completed archive templates.</p>
                    </div>
                  ) : (
                    filteredBatches.map(batch => {
                      const eggSum = batch.eggCollections ? batch.eggCollections.reduce((s, e) => s + e.totalCollected, 0) : 0;
                      const avgEggs = batch.eggCollections && batch.eggCollections.length > 0 ? (eggSum / batch.eggCollections.length) : 0;
                      const hdep = batch.currentCount > 0 ? ((avgEggs / batch.currentCount) * 100) : 0;

                      const totalFeedIn = batch.feedLogs ? batch.feedLogs.reduce((s, l) => s + l.quantityKg, 0) : 0;
                      const weightGained = batch.currentCount * 1.8;
                      const fcr = weightGained > 0 ? (totalFeedIn / weightGained) : 0;

                      const ageDays = getBatchAgeDays(batch.arrivalDate);
                      const ageWeeks = Math.floor(ageDays / 7);
                      const ageDaysRemainder = ageDays % 7;

                      const currentActiveStageId = batch.currentStageId || getSuggestedStageId(ageDays, batch.birdType);
                      const activeTabId = selectedStageTab[batch.id] || currentActiveStageId;
                      const activeTabInfo = PRODUCTION_STAGES.find(s => s.id === activeTabId) || PRODUCTION_STAGES[0];

                      const suggestedStageId = getSuggestedStageId(ageDays, batch.birdType);
                      const suggestedStageName = PRODUCTION_STAGES.find(s => s.id === suggestedStageId)?.name || "Grower";

                      // Health, Diseases & Chemical/Slaughter Withholding Indicators
                      const thresholdPct = batch.mortalityThresholdPct ?? 0.5;
                      const totalInitialQty = batch.quantity || 1;
                      
                      const hasHighMortalityAlert = (batch.mortalityLogs || []).some(m => {
                        const preEventFlock = batch.currentCount + m.count;
                        return (m.count / (preEventFlock || 1)) * 100 > thresholdPct;
                      });

                      const worstHighMortalityEvent = (batch.mortalityLogs || []).find(m => {
                        const preEventFlock = batch.currentCount + m.count;
                        return (m.count / (preEventFlock || 1)) * 100 > thresholdPct;
                      });

                      const todayStrForWithholding = new Date().toISOString().split("T")[0];
                      const activeWithholdingMedsList: { drugName: string; withholdUntil: string; daysLeft: number }[] = [];
                      
                      if (batch.medications) {
                        batch.medications.forEach(m => {
                          if (m.withholdingCloseDate && m.withholdingCloseDate > todayStrForWithholding) {
                            const diffTime = new Date(m.withholdingCloseDate).getTime() - new Date().getTime();
                            const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                            activeWithholdingMedsList.push({
                              drugName: m.drugName,
                              withholdUntil: m.withholdingCloseDate,
                              daysLeft
                            });
                          }
                        });
                      }

                      if (batch.healthEvents) {
                        batch.healthEvents.forEach(h => {
                          if (h.withholdingCloseDate && h.withholdingCloseDate > todayStrForWithholding && h.treatmentDrug) {
                            const diffTime = new Date(h.withholdingCloseDate).getTime() - new Date().getTime();
                            const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                            activeWithholdingMedsList.push({
                              drugName: h.treatmentDrug,
                              withholdUntil: h.withholdingCloseDate,
                              daysLeft
                            });
                          }
                        });
                      }

                      const activeDiseases = batch.healthEvents ? batch.healthEvents.filter(h => h.status === "Ongoing") : [];


                      const toggleChecklistVal = (key: string) => {
                        const currentChecked = batch.accomplishedChecklist || [];
                        let nextChecked: string[];
                        if (currentChecked.includes(key)) {
                          nextChecked = currentChecked.filter(k => k !== key);
                        } else {
                          nextChecked = [...currentChecked, key];
                        }
                        if (onUpdatePoultryBatch) {
                          onUpdatePoultryBatch({
                            ...batch,
                            accomplishedChecklist: nextChecked
                          });
                        }
                      };

                      return (
                        <div key={batch.id} className="p-5 border rounded-2xl bg-slate-50/25 space-y-4 border-slate-205">
                          <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedPoultryIds.includes(batch.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPoultryIds(prev => [...prev, batch.id]);
                                  } else {
                                    setSelectedPoultryIds(prev => prev.filter(id => id !== batch.id));
                                  }
                                }}
                                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4 ml-0.5"
                              />
                              <Egg className="w-5 h-5 text-amber-500 animate-bounce" />
                              <div>
                                <span className="text-xs font-bold font-mono text-emerald-600 block">{batch.batchId}</span>
                                <h4 className="font-bold text-sm text-slate-800">{batch.batchName}</h4>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 text-white font-extrabold uppercase font-mono tracking-widest">{batch.status}</span>
                              {!isReadonly && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editingBatchId === batch.id) {
                                        setEditingBatchId(null);
                                      } else {
                                        handleStartEditBatch(batch);
                                      }
                                    }}
                                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[9.5px] font-extrabold uppercase border border-slate-200 tracking-wider shadow-xs cursor-pointer flex items-center gap-0.5"
                                    title="Edit configuration details"
                                  >
                                    ✏️ {editingBatchId === batch.id ? "Cancel" : "Edit Config"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateBatch(batch)}
                                    className="px-2 py-1 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 rounded-lg text-[9.5px] font-extrabold uppercase border border-emerald-200 tracking-wider shadow-xs cursor-pointer flex items-center gap-0.5"
                                    title="Duplicate configuration as a template"
                                  >
                                    📋 Duplicate Config
                                  </button>
                                  {onDeletePoultryBatch && (
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const triggerConfirm = (window as any).triggerGlobalConfirm;
                                        if (triggerConfirm) {
                                          triggerConfirm({
                                            title: "Delete Poultry Batch",
                                            message: `Are you sure you want to delete and soft-delete poultry batch "${batch.batchName}" to the secure archive?`,
                                            isBulk: true,
                                            itemCount: 1,
                                            itemNames: [`${batch.batchName} (${batch.birdType})`],
                                            onConfirm: () => {
                                              onDeletePoultryBatch(batch.id);
                                              setSelectedPoultryIds(prev => prev.filter(id => id !== batch.id));
                                            }
                                          });
                                        } else {
                                          if (window.confirm(`Are you sure you want to delete and soft-delete poultry batch "${batch.batchName}" to the archive?`)) {
                                            onDeletePoultryBatch(batch.id);
                                            setSelectedPoultryIds(prev => prev.filter(id => id !== batch.id));
                                          }
                                        }
                                      }}
                                      className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors border border-transparent hover:border-rose-100 bg-white shadow-xs cursor-pointer flex items-center justify-center h-7 w-7"
                                      title="Delete Poultry Batch"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                    {/* INTERACTIVE GROWTH TIMELINE TRANSITION PROMPT */}
                    {batch.status !== "CLOSED" && batch.currentStageId && batch.currentStageId !== suggestedStageId && !isReadonly && onUpdatePoultryBatch && (
                      <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-pulse border-l-4 border-l-indigo-600">
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl">📈</span>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider block font-sans">Timeline Stage-Transition Prompt</span>
                            <p className="font-semibold text-indigo-900 leading-relaxed mt-0.5">
                              Flock Age is <strong>{ageDays} days ({ageWeeks} weeks)</strong>. The biological growth timeline suggests shifting from <span className="uppercase font-mono text-xs bg-indigo-105 text-indigo-805 px-1.5 py-0.5 rounded font-bold">{batch.currentStageId}</span> to <span className="uppercase font-mono text-xs bg-emerald-150 text-emerald-900 px-1.5 py-0.5 rounded font-bold">{suggestedStageId}</span>.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdatePoultryBatch({
                              ...batch,
                              currentStageId: suggestedStageId,
                              status: suggestedStageId === "brooding" ? "ACTIVE > BROODING"
                                    : suggestedStageId === "grower" ? "ACTIVE > GROWING"
                                    : suggestedStageId === "finisher" ? "ACTIVE > FINISHING"
                                    : suggestedStageId === "layer_production" ? "ACTIVE > LAYING"
                                    : batch.status
                            });
                            // Synchronize the local UI active tab state
                            setSelectedStageTab(prev => ({ ...prev, [batch.id]: suggestedStageId }));
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase text-[10.5px] px-3.5 py-2 rounded-lg tracking-wider block shrink-0 cursor-pointer text-center"
                        >
                          ✓ Transition Stage Now
                        </button>
                      </div>
                    )}

                    {/* COHORT CONFIG EDITOR */}
                    {editingBatchId === batch.id && (
                      <div className="bg-amber-50/50 border border-amber-200 p-4.5 rounded-2xl space-y-4 text-xs text-slate-800 animate-fade-in border-l-4 border-l-amber-500">
                        <div className="flex justify-between items-center border-b border-amber-200 pb-1.5">
                          <span className="font-extrabold uppercase text-[10px] tracking-wider text-amber-900 flex items-center gap-1">✏️ EDIT COHORT DETAIL CONFIG</span>
                          <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-mono font-bold">BATCH: {batch.batchId}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider">Flock Identifier/Name</span>
                            <input type="text" value={editBatchName} onChange={e => setEditBatchName(e.target.value)} required className="border p-2 bg-white rounded-lg text-xs font-semibold" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider">Assigned Shed / Coop Area</span>
                            <input type="text" value={editBatchShed} onChange={e => setEditBatchShed(e.target.value)} required className="border p-2 bg-white rounded-lg text-xs font-semibold" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider">Original Chick Quantity</span>
                            {(() => {
                              const isBroodingOrPlanned = batch.status === "PLANNED" || batch.status === "ACTIVE > BROODING" || batch.currentStageId === "brooding";
                              return (
                                <>
                                  <input 
                                    type="number" 
                                    value={editBatchQty} 
                                    onChange={e => setEditBatchQty(Number(e.target.value))} 
                                    disabled={!isBroodingOrPlanned}
                                    className={`border p-2 rounded-lg font-mono font-bold text-xs ${!isBroodingOrPlanned ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white text-slate-800"}`} 
                                  />
                                  <span className="text-[9px] text-slate-450 font-semibold mt-0.5 block leading-tight">
                                    {!isBroodingOrPlanned ? "🔒 Quantity changes locked after brooding stage; adjust via mortality/sales logs instead." : "💡 Adjustable during brooding stage."}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex flex-col gap-1 text-[11px] justify-center bg-white p-2.5 border rounded-xl border-amber-100">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Capitalized Initial Assets</span>
                            <span className="font-mono text-slate-700">Initial Price: <strong className="text-emerald-700">{currencySymbol} {batch.unitAcquisitionCost ?? 12}</strong> /chick</span>
                            <span className="font-mono text-slate-600 leading-tight mt-0.5">Transport: {currencySymbol}{batch.transportCost ?? 150} | Setup: {currencySymbol}{batch.brooderSetupCost ?? 300}</span>
                          </div>
                          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
                            <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider">Batch Remarks & Template Comments</span>
                            <textarea rows={2} value={editBatchNotes} onChange={e => setEditBatchNotes(e.target.value)} className="border p-2 bg-white rounded-lg text-xs text-slate-800 w-full resize-none" placeholder="Provide notes, brand specifications, vaccine logs comments..." />
                          </div>
                        </div>
                        <div className="flex md:justify-end gap-2 border-t border-amber-100 pt-2.5">
                          <button type="button" onClick={() => setEditingBatchId(null)} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[10px] cursor-pointer">Cancel</button>
                          <button type="button" onClick={() => handleSaveBatchEdit(batch)} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-lg text-[10px] cursor-pointer shadow-xs">✓ Update Configuration</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 font-sans">
                          {/* Prominent High Visibility Alert Banners */}
                          {(activeDiseases.length > 0 || hasHighMortalityAlert || activeWithholdingMedsList.length > 0) && (
                            <div className="grid grid-cols-1 gap-3">
                              {/* Disease emergency indicator */}
                              {activeDiseases.length > 0 && (
                                <div className="bg-rose-50 border border-rose-300 text-rose-950 p-4 rounded-2xl text-xs space-y-1.5 shadow-xs border-l-4 border-l-rose-500">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-2.5 w-2.5 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                                    </span>
                                    <span className="font-extrabold uppercase text-[10.5px] text-rose-800 tracking-wider">⚠️ ACTIVE DISEASE OUTBREAK DETECTED</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {activeDiseases.map((h, hIdx) => (
                                      <span key={h.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-700 text-white font-extrabold text-[10px] tracking-wide shadow-xs uppercase font-mono">
                                        🦠 {h.preliminaryDiagnosis} ({h.severity} level)
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* High Mortality Alarm alert */}
                              {hasHighMortalityAlert && worstHighMortalityEvent && (
                                <div className="bg-red-50 border border-red-350 text-red-955 p-4 rounded-2xl text-xs space-y-1.5 shadow-xs border-l-4 border-l-red-600">
                                  <div className="flex items-center gap-2">
                                    <ShieldAlert className="w-4.5 h-4.5 text-red-600 animate-bounce" />
                                    <span className="font-extrabold uppercase text-[10.5px] text-red-800 tracking-wider">🚨 ALERT: FLOCK MORTALITY THRESHOLD VIOLATION</span>
                                  </div>
                                  <p className="font-semibold text-red-900 leading-relaxed">
                                    Daily mortality loss of <span className="underline font-bold text-red-950 font-mono">{((worstHighMortalityEvent.count) / (batch.currentCount + worstHighMortalityEvent.count || 1) * 100).toFixed(2)}%</span> on <span className="font-bold">{worstHighMortalityEvent.date}</span> ({worstHighMortalityEvent.count} casualties due to "{worstHighMortalityEvent.cause}") of current flock size ({batch.currentCount + worstHighMortalityEvent.count} chickens) exceeds configured safety threshold of <span className="font-bold font-mono">{thresholdPct}%</span>. Deploy immediate quarantine and sanitization controls!
                                  </p>
                                </div>
                              )}

                              {/* active withholding warnings */}
                              {activeWithholdingMedsList.length > 0 && (
                                <div className="bg-amber-50 border border-amber-300 text-amber-955 p-3.5 rounded-2xl text-xs space-y-1.5 shadow-xs border-l-4 border-l-amber-500">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4.5 h-4.5 text-amber-600 animate-pulse" />
                                    <span className="font-extrabold uppercase text-[10.5px] text-amber-900 tracking-wider">⚠️ DRUG WITHHOLDING SAFETY BARRIER ACTIVE</span>
                                  </div>
                                  <p className="font-medium text-amber-900 leading-relaxed">
                                    Flock continues to actively metabolize chemical drug traces. To comply with agricultural food safety guidelines, slaughtering or distributing birds for retail sale is strictly locked.
                                  </p>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {activeWithholdingMedsList.map((m, mIdx) => (
                                      <span key={mIdx} className="inline-flex items-center gap-1 bg-white border border-amber-250 text-amber-950 px-2 py-1 rounded-lg text-[9.5px] font-bold">
                                        💊 {m.drugName} (safe on: <strong>{m.withholdUntil}</strong> – <span className="text-red-750 font-extrabold">{m.daysLeft} days remaining</span>)
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Original Grid details */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-700">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-1">Summary Inventory</span>
                              <p>Total Stock: <strong>{batch.currentCount} Live Birds</strong></p>
                              <p>Breed: <strong>{batch.breed}</strong></p>
                              <p>System: <strong className="text-amber-800">{batch.productionSystem || "Commercial Deep Litter"}</strong></p>
                              <p>Location: <strong>{batch.assignedShed}</strong></p>
                              
                              {/* Configurable threshold range slider */}
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-3 space-y-1">
                                <div className="flex justify-between items-center text-[9.5px]">
                                  <span className="font-extrabold uppercase text-slate-500">Alarm Trigger Line</span>
                                  <span className="font-extrabold font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-md border border-emerald-100">{thresholdPct}% / day</span>
                                </div>
                                <input 
                                  type="range"
                                  min="0.1"
                                  max="2.5"
                                  step="0.05"
                                  value={thresholdPct}
                                  onChange={e => {
                                    if (onUpdatePoultryBatch) {
                                      onUpdatePoultryBatch({
                                        ...batch,
                                        mortalityThresholdPct: Number(e.target.value)
                                      });
                                    }
                                  }}
                                  className="w-full h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-slate-900 mt-1"
                                />
                                <span className="text-[8.5px] font-semibold text-slate-400 block leading-tight font-sans">Alert threshold for daily flock casualty rate check</span>
                              </div>
                            </div>

                      <div>
                        {batch.birdType === "Layers (Eggs)" ? (
                          <>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-1">HDEP Laying Performance</span>
                            <p>Average Daily Eggs: <strong>{avgEggs.toFixed(0)} Eggs</strong></p>
                            <p>Calculated HDEP: <strong className="text-emerald-600">{hdep.toFixed(1)}% Flock Rate</strong></p>
                          </>
                        ) : batch.birdType === "Broilers (Meat)" ? (
                          <>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-1">FCR Metric (Feed Conv.)</span>
                            <p>Feed Consumed: <strong>{totalFeedIn} Kgs</strong></p>
                            <p>Broiler FCR index: <strong className="text-blue-600">{fcr.toFixed(2)} Index</strong></p>
                          </>
                        ) : batch.birdType === "Indigenous" ? (
                          <>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-1">Village Range Performance</span>
                            <p>Growth Speed: <strong className="text-slate-600">Slower Growth Adaptation</strong></p>
                            <p>Free-Range Tracking: <strong className="text-emerald-700">Active range foraging</strong></p>
                            {eggSum > 0 && <p>Laying history: <strong>{eggSum} Eggs</strong></p>}
                          </>
                        ) : batch.birdType === "Ducks" ? (
                          <>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-1">Waterfowl meat production</span>
                            <p>Meat focus: <strong className="text-teal-700">Pekin heavy-carcass yield</strong></p>
                            <p>Wet Run status: <strong className="text-blue-700">Pond yard pasture</strong></p>
                          </>
                        ) : batch.birdType === "Turkeys" ? (
                          <>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-1">Seasonal turkey production</span>
                            <p>Holiday target: <strong className="text-indigo-700">Seasonal Festive Market</strong></p>
                            <p>Current FCR Index: <strong className="text-slate-700">{fcr.toFixed(2)}</strong></p>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-1">Guinea Fowl Resilience</span>
                            <p>Smallholder: <strong className="text-emerald-700">Rural crop integration</strong></p>
                            <p>Pest/Tick foraging: <strong className="text-emerald-800">Excellent range foraging</strong></p>
                            {eggSum > 0 && <p>Eggs collected: <strong>{eggSum} Eggs</strong></p>}
                          </>
                        )}
                      </div>

                      <div className="col-span-2">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block pb-1.5">Zambia Vaccines Sequence</span>
                        <div className="flex flex-wrap gap-1.5">
                          {batch.vaccinationCalendar ? batch.vaccinationCalendar.map((v, idx) => (
                            <span key={idx} className={`px-2 py-1 text-[9px] font-bold rounded flex items-center gap-1 ${
                              v.status === "Completed" ? "bg-emerald-50 text-emerald-800 border-emerald-100 border" : "bg-slate-100 text-slate-600"
                            }`}>
                              {v.status === "Completed" ? "✓" : "○"} {v.vaccine} (Day {v.ageDay})
                            </span>
                          )) : "No roster configured"}
                        </div>
                      </div>
                    </div>

                    {/* 🩺 FLOCK MORTALITY & BIOSECURITY ANALYTICS DASHBOARD */}
                    {(() => {
                      const totalDeaths = (batch.mortalityLogs || []).reduce((sum, m) => sum + m.count, 0);
                      const rateOfPlaced = ((totalDeaths / (batch.quantity || 1)) * 100).toFixed(2);
                      const rateOfRemaining = batch.currentCount > 0 ? ((totalDeaths / batch.currentCount) * 100).toFixed(2) : "0.00";
                      
                      const trendData = Object.values(
                        (batch.mortalityLogs || []).reduce((acc: Record<string, { date: string; deaths: number }>, curr) => {
                          const dt = curr.date;
                          if (!acc[dt]) {
                            acc[dt] = { date: dt, deaths: 0 };
                          }
                          acc[dt].deaths += curr.count;
                          return acc;
                        }, {})
                      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                      const summary = {
                        feed: { count: 0, percentage: 0, color: "bg-amber-500", pill: "bg-amber-50 text-amber-800 border-amber-200" },
                        disease: { count: 0, percentage: 0, color: "bg-rose-500", pill: "bg-rose-50 text-rose-800 border-rose-200" },
                        predator: { count: 0, percentage: 0, color: "bg-orange-500", pill: "bg-orange-50 text-orange-800 border-orange-200" },
                        unknown: { count: 0, percentage: 0, color: "bg-slate-400", pill: "bg-slate-50 text-slate-600 border-slate-200" }
                      };

                      (batch.mortalityLogs || []).forEach(l => {
                        const cat = l.probableCauseCategory || categorizeCause(l.cause);
                        if (summary[cat]) {
                          summary[cat].count += l.count;
                        }
                      });

                      const totalMortsForCategory = Object.values(summary).reduce((acc, curr) => acc + curr.count, 0);
                      if (totalMortsForCategory > 0) {
                        Object.keys(summary).forEach(k => {
                          const key = k as keyof typeof summary;
                          summary[key].percentage = Math.round((summary[key].count / totalMortsForCategory) * 100);
                        });
                      }

                      return (
                        <div className="border border-rose-150 rounded-2xl p-4.5 bg-rose-50/10 space-y-4 shadow-sm animate-fade-in">
                          <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="p-1 px-2 bg-rose-700 uppercase text-[9px] font-black text-white rounded font-mono tracking-wider">MORTALITY & BIOSECURITY</span>
                              <h5 className="text-[11.5px] font-black text-slate-800">Flock Mortality, Trends & Loss Attribution Dashboard</h5>
                            </div>
                            <span className="text-[9.5px] font-mono font-extrabold text-slate-500 bg-slate-100 hover:bg-slate-100/80 px-2.5 py-1 rounded">
                              Threshold Alarm line: <strong className="text-red-700">{thresholdPct}%</strong>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-slate-700 text-xs">
                            {/* LEFT COLUMN: Loss Overview & Rates */}
                            <div className="lg:col-span-4 space-y-3">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pb-0.5 border-b border-rose-100">Cumulative Loss Rates</span>
                              
                              <div className="grid grid-cols-2 gap-2.5">
                                <div className="bg-white p-3 border rounded-xl border-rose-100/80 flex flex-col justify-between">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase leading-none block">Total Deaths</span>
                                  <span className="font-mono text-lg font-black text-rose-700 block mt-1.5">{totalDeaths}</span>
                                  <span className="text-[8px] text-slate-400 leading-snug mt-1">birds deceased</span>
                                </div>
                                <div className="bg-white p-3 border rounded-xl border-emerald-100/85 flex flex-col justify-between">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase leading-none block">Live Stock</span>
                                  <span className="font-mono text-lg font-black text-emerald-700 block mt-1.5">{batch.currentCount}</span>
                                  <span className="text-[8px] text-slate-400 leading-snug mt-1">birds remaining</span>
                                </div>
                              </div>

                              <div className="bg-white p-3.5 border rounded-xl border-slate-200/80 space-y-2.5">
                                <div>
                                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase">
                                    <span>Rate (% of Placed birds)</span>
                                    <span className="font-mono text-rose-700 font-extrabold">{rateOfPlaced}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, Number(rateOfPlaced))}%` }} />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase">
                                    <span>Rate (% of Remaining birds)</span>
                                    <span className="font-mono text-rose-900 font-extrabold">{rateOfRemaining}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                    <div className="bg-rose-850 h-full rounded-full" style={{ width: `${Math.min(100, Number(rateOfRemaining))}%` }} />
                                  </div>
                                </div>
                                <span className="text-[7.5px] font-medium leading-normal text-slate-400 block pt-0.5 font-sans leading-tight">
                                  Cohort placed size: {batch.quantity} birds. Cumulative loss is {totalDeaths} birds.
                                </span>
                              </div>
                            </div>

                            {/* MID COLUMN: Loss Attribution / Cause Categories */}
                            <div className="lg:col-span-4 space-y-3">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pb-0.5 border-b border-rose-100">Loss Attribution by Cause</span>
                              
                              <div className="space-y-2 text-xs">
                                {Object.entries(summary).map(([key, item]) => (
                                  <div key={key} className="bg-white p-2.5 border rounded-xl flex items-center justify-between border-slate-150">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                                      <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-750">{key}</span>
                                    </div>
                                    <div className="text-right font-mono text-[10.5px]">
                                      <strong className="text-slate-850">{item.count} head</strong>
                                      <span className="text-slate-400 ml-1.5 font-bold">({item.percentage}%)</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Disposal audit trace tags */}
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200 text-[9px] text-slate-500 space-y-1">
                                <span className="font-black uppercase text-[8px] tracking-wider text-slate-400 block pb-0.5">Disposal Audit Methods Trace</span>
                                <div className="flex flex-wrap gap-1">
                                  {Array.from(new Set((batch.mortalityLogs || []).map(l => l.disposalMethod || "Burial with lime"))).map((method, mIdx) => (
                                    <span key={mIdx} className="bg-white text-slate-650 px-2 py-0.5 rounded border border-slate-200 leading-none font-bold text-[8.5px]">
                                      ♻️ {method}
                                    </span>
                                  ))}
                                  {(batch.mortalityLogs || []).length === 0 && <span className="text-slate-400 italic">No events logged yet</span>}
                                </div>
                              </div>
                            </div>

                            {/* RIGHT COLUMN: Mortality Trend Chart */}
                            <div className="lg:col-span-4 space-y-2">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pb-0.5 border-b border-rose-100">Daily Mortality Trend Timeline</span>
                              
                              {trendData.length > 0 ? (
                                <div className="h-44 w-full bg-white p-2.5 border rounded-xl border-rose-100 mt-1 flex flex-col justify-between">
                                  <div className="w-full h-full text-[9px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={8} minTickGap={5} tickLine={false} />
                                        <YAxis stroke="#475569" fontSize={8} allowDecimals={false} tickLine={false} />
                                        <Tooltip 
                                          content={({ active, payload, label }: any) => {
                                            if (active && payload && payload.length) {
                                              return (
                                                <div className="bg-slate-900 text-white p-2 rounded text-[10px] shadow border border-slate-800 font-mono">
                                                  <p className="font-bold border-b border-slate-800 pb-0.5">{label}</p>
                                                  <p className="text-rose-400 font-extrabold mt-1">Deaths count: {payload[0].value}</p>
                                                </div>
                                              );
                                            }
                                            return null;
                                          }}
                                        />
                                        <Line type="monotone" dataKey="deaths" stroke="#dc2626" strokeWidth={2} activeDot={{ r: 4 }} dot={{ r: 2.5, stroke: "#ef4444", strokeWidth: 1.5 }} name="Daily Deaths" />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div className="text-[7.5px] text-center text-slate-400 pt-1 font-medium font-sans uppercase tracking-wider">
                                    Daily counts timeline
                                  </div>
                                </div>
                              ) : (
                                <div className="h-44 bg-slate-50 border rounded-xl border-slate-200 border-dashed flex flex-col items-center justify-center text-center text-slate-400 p-4">
                                  <Activity className="w-6 h-6 text-slate-300 stroke-1 block mb-1.5 animate-pulse" />
                                  <p className="text-[10px] font-extrabold uppercase text-slate-500">Telemetry Trend Line Empty</p>
                                  <p className="text-[8px] leading-relaxed text-slate-400 mt-1">No mortality losses are registered. Logging casualties under "Log Mortality Loss" will instantly generate charts.</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Historical Audit Table of Mortality Events */}
                          {batch.mortalityLogs && batch.mortalityLogs.length > 0 && (
                            <div className="bg-white/80 border border-rose-100 rounded-xl p-3.5 space-y-2.5 shadow-3xs">
                              <span className="text-[8.5px] font-black uppercase text-rose-800 tracking-wider block">📋 Detailed Mortality Logs & Disposal Audit Trail</span>
                              <div className="overflow-x-auto max-h-36 overflow-y-auto border rounded-lg border-slate-200">
                                <table className="w-full text-left text-[9.5px]">
                                  <thead>
                                    <tr className="bg-slate-55 border-b border-slate-200 font-black uppercase text-[8px] text-slate-450 tracking-wider">
                                      <th className="p-2.5">Loss Date</th>
                                      <th className="p-2.5 text-right">Deaths Count</th>
                                      <th className="p-2.5">Probable Cause Category</th>
                                      <th className="p-2.5">Veterinary Symptom / Details</th>
                                      <th className="p-2.5">Disposal Method</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-sans font-medium text-slate-700">
                                    {batch.mortalityLogs.map((l, lIdx) => {
                                      const cat = l.probableCauseCategory || categorizeCause(l.cause);
                                      const catColors = summary[cat] || summary.unknown;
                                      return (
                                        <tr key={lIdx} className="hover:bg-rose-50/15">
                                          <td className="p-2.5 font-bold font-mono text-slate-700">{l.date}</td>
                                          <td className="p-2.5 text-right font-black font-mono text-rose-700">{l.count}</td>
                                          <td className="p-2.5">
                                            <span className={`px-2 py-0.5 rounded-full font-black text-[7.5px] uppercase border ${catColors.pill}`}>
                                              {cat}
                                            </span>
                                          </td>
                                          <td className="p-2.5 italic text-slate-600">{l.cause}</td>
                                          <td className="p-2.5"><span className="text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border text-[8.5px]">♻️ {l.disposalMethod || "Burial with lime"}</span></td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Mabala Batch-centric Linear Lifecycle Stepper */}
                    <div className="border border-slate-200 rounded-2xl p-4.5 bg-white space-y-3.5 shadow-sm">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 px-2 bg-slate-900 uppercase text-[9px] font-black text-white rounded font-mono tracking-wider">LIFECYCLE</span>
                          <span className="text-[11px] font-bold text-slate-600">Linear Batch Progression Tracker / Click step to transition</span>
                        </div>
                        {batch.status === "CLOSED" ? (
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded flex items-center gap-1.5 shadow-xs">
                            🔒 CLOSED & FINANCIAL SUMMARY LOCKED
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-1 rounded tracking-wider animate-pulse">
                            ⚡ Operational & Recording Active
                          </span>
                        )}
                      </div>

                      {/* Stepper Steps grid flow */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                        {LIFECYCLE_STAGES.map((step, idx) => {
                          const isActive = batch.status === step.id;
                          const currentIdx = LIFECYCLE_STAGES.findIndex(s => s.id === batch.status);
                          const isPast = idx < currentIdx;
                          const isSelectable = batch.status !== "CLOSED" && !isReadonly;

                          return (
                            <button
                              key={step.id}
                              type="button"
                              disabled={!isSelectable}
                              title={step.desc}
                              onClick={() => {
                                if (onUpdatePoultryBatch) {
                                  onUpdatePoultryBatch({
                                    ...batch,
                                    status: step.id as any
                                  });
                                }
                              }}
                              className={`p-2.5 rounded-xl text-left border text-xs transition-all duration-150 flex flex-col justify-between h-20 ${
                                isActive
                                  ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/10"
                                  : isPast
                                  ? "bg-emerald-50 text-emerald-950 border-emerald-250 hover:bg-emerald-100"
                                  : "bg-slate-55/75 text-slate-600 border-slate-200 hover:bg-white"
                              } ${!isSelectable ? "cursor-not-allowed" : "cursor-pointer active:scale-95"}`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className={`text-[8px] font-black uppercase tracking-wider font-mono ${isActive ? "text-slate-300" : "text-slate-400"}`}>Step {idx + 1}</span>
                                {isActive && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 animate-pulse"></span>
                                  </span>
                                )}
                              </div>
                              <div className="font-extrabold text-[10.5px] truncate mt-0.5 w-full leading-tight">{step.label}</div>
                              <div className={`text-[7.5px] leading-snug mt-1 line-clamp-2 ${isActive ? "text-slate-300" : "text-slate-400"}`}>{step.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Operational action panels */}
                    {batch.status !== "CLOSED" && (
                      <div className="flex flex-wrap gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionTab(prev => {
                              const curr = prev[batch.id];
                              return { ...prev, [batch.id]: curr === "sell" ? "none" : "sell" };
                            });
                          }}
                          className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                            activeActionTab[batch.id] === "sell"
                              ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                              : "bg-white hover:bg-slate-55 text-slate-700 border-slate-200"
                          }`}
                        >
                          🛒 Sell / Harvest Birds
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionTab(prev => {
                              const curr = prev[batch.id];
                              return { ...prev, [batch.id]: curr === "medication" ? "none" : "medication" };
                            });
                          }}
                          className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                            activeActionTab[batch.id] === "medication"
                              ? "bg-indigo-700 text-white border-indigo-700 shadow-sm"
                              : "bg-white hover:bg-slate-55 text-slate-700 border-slate-200"
                          }`}
                        >
                          💊 Log Vet Treatments
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionTab(prev => {
                              const curr = prev[batch.id];
                              return { ...prev, [batch.id]: curr === "mortality" ? "none" : "mortality" };
                            });
                          }}
                          className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                            activeActionTab[batch.id] === "mortality"
                              ? "bg-rose-700 text-white border-rose-700 shadow-sm"
                              : "bg-white hover:bg-slate-55 text-slate-700 border-slate-200"
                          }`}
                        >
                          ⚠️ Log Mortality Loss
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionTab(prev => {
                              const curr = prev[batch.id];
                              return { ...prev, [batch.id]: curr === "feeding" ? "none" : "feeding" };
                            });
                          }}
                          className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                            activeActionTab[batch.id] === "feeding"
                              ? "bg-amber-600 text-white border-amber-600 shadow-sm animate-pulse"
                              : "bg-white hover:bg-slate-55 text-slate-700 border-slate-200"
                          }`}
                        >
                          🌾 Feeding & Diet Tracker
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionTab(prev => {
                              const curr = prev[batch.id];
                              return { ...prev, [batch.id]: curr === "finance" ? "none" : "finance" };
                            });
                          }}
                          className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                            activeActionTab[batch.id] === "finance"
                              ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                              : "bg-white hover:bg-slate-55 text-slate-700 border-slate-200"
                          }`}
                        >
                          📊 General Ledger Integration
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionTab(prev => {
                              const curr = prev[batch.id];
                              return { ...prev, [batch.id]: curr === "growth" ? "none" : "growth" };
                            });
                          }}
                          className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                            activeActionTab[batch.id] === "growth"
                              ? "bg-purple-700 text-white border-purple-700 shadow-sm"
                              : "bg-white hover:bg-slate-55 text-slate-705 border-slate-200 text-purple-700 font-extrabold hover:text-purple-800"
                          }`}
                        >
                          ⚖️ Growth & Weight
                        </button>
                        {["Layers (Eggs)", "Indigenous", "Guinea Fowl"].includes(batch.birdType) && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionTab(prev => {
                                const curr = prev[batch.id];
                                return { ...prev, [batch.id]: curr === "layer_eggs" ? "none" : "layer_eggs" };
                              });
                            }}
                            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                              activeActionTab[batch.id] === "layer_eggs"
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-white hover:bg-slate-55 text-slate-705 border-slate-200 text-amber-650 font-extrabold hover:text-amber-700"
                            }`}
                          >
                            🥚 Layer & Egg Production
                          </button>
                        )}
                      </div>
                    )}

                    {/* Operational Forms implementation */}
                    {activeActionTab[batch.id] === "sell" && batch.status !== "CLOSED" && (() => {
                      const totalFeedCost = (batch.feedLogs || []).reduce((sum, f) => sum + (f.cost || 0), 0);
                      const proratedFeedCost = batch.quantity > 0 ? totalFeedCost / batch.quantity : 0;

                      const totalMedsCost = (batch.medications || []).reduce((sum, m) => sum + (m.cost || 0), 0) + 
                                           ((batch.healthEvents || []).reduce((sum, h) => sum + (h.treatmentCost ?? 0), 0));
                      const proratedMedCost = batch.quantity > 0 ? totalMedsCost / batch.quantity : 0;

                      const transportCost = batch.transportCost ?? 0;
                      const setupCost = batch.brooderSetupCost ?? 0;
                      const rawAcqCost = batch.quantity * (batch.unitAcquisitionCost ?? 12);
                      const totalAcqOverhead = rawAcqCost + transportCost + setupCost;
                      const proratedOverheadCost = batch.quantity > 0 ? totalAcqOverhead / batch.quantity : 0;

                      const totalProratedCostPerBird = proratedFeedCost + proratedMedCost + proratedOverheadCost;

                      const isPerBirdVal = saleChargeType === "PER_BIRD";
                      const finalQtyVal = Math.min(batch.currentCount, Math.max(1, sellQty));
                      const finalAvgWeightKg = saleAvgWeightKg;
                      const finalDressingPercentage = saleDressingPercentage;
                      
                      const selectedPricePerBird = isPerBirdVal ? sellPrice : (finalAvgWeightKg * salePricePerKg);
                      const totalRevenueValue = finalQtyVal * selectedPricePerBird;

                      const grossMarginPerBirdValue = selectedPricePerBird - totalProratedCostPerBird;
                      const totalGrossMarginValue = grossMarginPerBirdValue * finalQtyVal;
                      const isLockByWithholding = activeWithholdingMedsList.length > 0;

                      return (
                        <div className="bg-emerald-50/60 p-5 border rounded-2xl border-emerald-350 space-y-4 animate-slide-up text-slate-800">
                          {/* Title */}
                          <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                            <div>
                              <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono tracking-wider">SALES & MARKET LEDGER SYSTEM</span>
                              <h5 className="text-xs font-black uppercase text-emerald-950 mt-1 flex items-center gap-1.5 font-sans">🐔 Record Commercial Live Bird Sale</h5>
                            </div>
                            <button onClick={() => setActiveActionTab(prev => ({ ...prev, [batch.id]: "none" }))} className="bg-slate-200 hover:bg-slate-350 px-2.5 py-1 text-slate-700 font-extrabold text-[10px] rounded-lg tracking-wider transition-all">Close ×</button>
                          </div>

                          {/* Withholding alert */}
                          {isLockByWithholding ? (
                            <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-950 space-y-2 animate-pulse text-[11px]">
                              <p className="font-black flex items-center gap-1 text-red-800 uppercase tracking-wide">
                                🚫 BIOLOGICAL SAFETY LOCKOUT ACTIVE: SALES BLOCKED
                              </p>
                              <p className="text-[10.5px] leading-relaxed text-red-900 font-medium">
                                Strict agricultural consumer safety regulations strictly **PROHIBIT** the sale of coordinates from this poultry batch because of active chemical or antibiotic residues. You cannot post or save this sale until the withholding periods fully expire:
                              </p>
                              <ul className="list-disc pl-5 font-mono text-[10px] space-y-1 text-red-905 font-bold">
                                {activeWithholdingMedsList.map((m, idx) => (
                                  <li key={idx}>
                                    <strong>{m.drugName}</strong>: Withdrawal period active until <span className="underline">{m.withholdUntil}</span> ({m.daysLeft} days remaining)
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="p-3 bg-emerald-100/50 border border-emerald-200 rounded-xl text-emerald-900 text-[10.5px] font-semibold">
                              ✓ Safe to enter the market: No active veterinary medications or chemical withholding periods detected for this poultry cohort.
                            </div>
                          )}

                          {/* Form Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                            {/* Date of Sale */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Date of Sale</label>
                              <input
                                type="date"
                                value={saleDate}
                                onChange={e => setSaleDate(e.target.value)}
                                className="p-2 border bg-white rounded-lg font-mono font-bold w-full"
                              />
                            </div>

                            {/* Customer Selector */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Consignee Customer</label>
                              <select
                                value={saleCustomer}
                                onChange={e => setSaleCustomer(e.target.value)}
                                className="p-2 border bg-white rounded-lg font-sans font-bold w-full"
                              >
                                <option value="">-- Choose Customer --</option>
                                {customers && customers.length > 0 ? (
                                  customers.map((c, i) => (
                                    <option key={i} value={c.name}>{c.name}</option>
                                  ))
                                ) : (
                                  <option value="">No clients found - enter custom below</option>
                                )}
                                <option value="Walk-In Cash Customer">Walk-In Cash Customer</option>
                                <option value="Other Custom Buyer">Other Custom Buyer</option>
                              </select>
                              {(!saleCustomer || saleCustomer === "Other Custom Buyer") && (
                                <input
                                  type="text"
                                  placeholder="Type bespoke customer name..."
                                  value={saleCustomer === "Other Custom Buyer" ? "" : saleCustomer}
                                  onChange={e => setSaleCustomer(e.target.value)}
                                  className="p-1.5 border bg-white rounded-lg font-mono font-bold text-[10.5px] mt-1"
                                />
                              )}
                            </div>

                            {/* Payment Method */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Payment Channel</label>
                              <select
                                value={salePaymentMethod}
                                onChange={e => setSalePaymentMethod(e.target.value as any)}
                                className="p-2 border bg-white rounded-lg font-sans font-bold w-full"
                              >
                                <option value="Cash">💵 Cash</option>
                                <option value="Mobile Money">📱 Mobile Money</option>
                                <option value="Bank Transfer">🏦 Bank Transfer</option>
                              </select>
                            </div>

                            {/* Billing Type Segmentation Selector */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Pricing Strategy / Billing Basis</label>
                              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => setSaleChargeType("PER_BIRD")}
                                  className={`py-1 text-[10px] rounded font-black uppercase text-center cursor-pointer ${isPerBirdVal ? "bg-white text-emerald-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                                >
                                  Per Bird
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSaleChargeType("PER_KG")}
                                  className={`py-1 text-[10px] rounded font-black uppercase text-center cursor-pointer ${!isPerBirdVal ? "bg-white text-emerald-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                                >
                                  Per Live Kg
                                </button>
                              </div>
                            </div>

                            {/* Sell Quantity */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Number of Birds (Max: {batch.currentCount})</label>
                              <input
                                type="number"
                                value={sellQty}
                                onChange={e => setSellQty(Math.min(batch.currentCount, Math.max(1, Number(e.target.value))))}
                                className="p-2 border bg-white rounded-lg font-mono font-bold w-full"
                              />
                            </div>

                            {/* Average Weight */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Live Weight (kg / bird)</label>
                              <input
                                type="number"
                                step="0.05"
                                value={saleAvgWeightKg}
                                onChange={e => setSaleAvgWeightKg(Math.max(0.1, Number(e.target.value)))}
                                className="p-2 border bg-white rounded-lg font-mono font-bold w-full"
                              />
                            </div>

                            {/* Price selector inputs */}
                            {isPerBirdVal ? (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Unit Price per Bird ({currencySymbol})</label>
                                <input
                                  type="number"
                                  value={sellPrice}
                                  onChange={e => setSellPrice(Math.max(0, Number(e.target.value)))}
                                  className="p-2 border bg-white rounded-lg font-mono font-bold w-full"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Price per Live Kg ({currencySymbol})</label>
                                <input
                                  type="number"
                                  value={salePricePerKg}
                                  onChange={e => setSalePricePerKg(Math.max(0, Number(e.target.value)))}
                                  className="p-2 border bg-white rounded-lg font-mono font-bold w-full"
                                />
                              </div>
                            )}

                            {/* Dressing Percentage for Processing records */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Dressing % (Carcass Processing)</label>
                              <input
                                type="number"
                                min="10"
                                max="100"
                                value={saleDressingPercentage}
                                onChange={e => setSaleDressingPercentage(Math.min(100, Math.max(10, Number(e.target.value))))}
                                className="p-2 border bg-white rounded-lg font-mono font-bold w-full"
                              />
                            </div>

                            {/* Estimated processed carcass weight sum */}
                            <div className="flex flex-col gap-1.5 bg-slate-50 p-2 border border-slate-200 rounded-lg">
                              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Processing Crop Yield</span>
                              <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="font-mono text-xs font-black text-slate-800">
                                  {((finalQtyVal * finalAvgWeightKg * finalDressingPercentage) / 100).toFixed(1)} kg
                                </span>
                                <span className="text-[8px] text-slate-400 uppercase font-semibold">Dressed carcass yield</span>
                              </div>
                              <span className="text-[8px] text-slate-400 font-medium">Total Live Weight: {(finalQtyVal * finalAvgWeightKg).toFixed(1)} kg</span>
                            </div>
                          </div>

                          {/* Margins Real-Time Economic Dashboard */}
                          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-3xs">
                            <span className="text-[9.5px] uppercase bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-black font-mono tracking-wider">
                              Real-Time Profit Margin & Prorated Cost Simulator
                            </span>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs text-slate-800 pt-1">
                              <div>
                                <span className="text-[8.5px] uppercase text-slate-400 font-extrabold block">Prorated Cost / Bird</span>
                                <span className="font-mono text-xs font-black block mt-0.5 text-slate-700">
                                  {currencySymbol} {totalProratedCostPerBird.toFixed(2)}
                                </span>
                                <span className="text-[7.5px] text-slate-400 block leading-tight mt-0.5 font-semibold">
                                  Feed: {currencySymbol}{proratedFeedCost.toFixed(1)} | Meds: {currencySymbol}{proratedMedCost.toFixed(1)} | Overh: {currencySymbol}{proratedOverheadCost.toFixed(1)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[8.5px] uppercase text-slate-400 font-extrabold block">Equivalent Price/Bird</span>
                                <span className="font-mono text-xs font-bold block mt-0.5 text-emerald-800">
                                  {currencySymbol} {selectedPricePerBird.toFixed(2)}
                                </span>
                                <span className="text-[7.5px] text-slate-400 block leading-tight mt-0.5">
                                  {isPerBirdVal ? "Fixed Flat Price" : `${finalAvgWeightKg}kg × ${currencySymbol}${salePricePerKg}/kg`}
                                </span>
                              </div>
                              <div>
                                <span className="text-[8.5px] uppercase text-slate-400 font-extrabold block">Carcass Margin / Bird</span>
                                <span className={`font-mono text-xs font-black block mt-0.5 ${grossMarginPerBirdValue >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                  {grossMarginPerBirdValue >= 0 ? "+" : ""}{currencySymbol} {grossMarginPerBirdValue.toFixed(2)}
                                </span>
                                <span className="text-[7.5px] text-slate-400 block leading-tight mt-0.5">
                                  {((grossMarginPerBirdValue / (selectedPricePerBird || 1)) * 100).toFixed(0)}% margin percentage
                                </span>
                              </div>
                              <div className="border-l pl-3 border-slate-200">
                                <span className="text-[8.5px] uppercase text-emerald-700 font-black block">Transaction Gross Margin</span>
                                <span className={`font-mono text-[13px] font-black block mt-0.5 ${totalGrossMarginValue >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
                                  {totalGrossMarginValue >= 0 ? "+" : ""}{currencySymbol} {totalGrossMarginValue.toLocaleString(undefined, {maximumFractionDigits:2})}
                                </span>
                                <span className="text-[7.5px] text-slate-400 block leading-tight mt-0.5 font-bold">
                                  Total Revenue: {currencySymbol}{totalRevenueValue.toLocaleString(undefined, {maximumFractionDigits:0})}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Trigger actions */}
                          <div className="flex justify-between items-center pt-2.5 border-t border-emerald-250 flex-wrap gap-2 text-xs">
                            <div className="font-extrabold text-slate-700">
                              Total Due Billing: <span className="font-mono text-emerald-800 font-black text-sm">{currencySymbol} {totalRevenueValue.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                            </div>

                            <button
                              type="button"
                              disabled={isLockByWithholding}
                              onClick={() => {
                                if (isLockByWithholding) return;
                                if (finalQtyVal <= 0 || finalQtyVal > batch.currentCount) return;

                                const finalCustomer = saleCustomer.trim() || "Walk-In Cash Customer";
                                const finalSaleObj = {
                                  id: "live-sale-" + Date.now().toString().slice(-5),
                                  date: saleDate,
                                  quantity: finalQtyVal,
                                  amount: totalRevenueValue,
                                  pricePerBird: Number(selectedPricePerBird.toFixed(2)),
                                  customerName: finalCustomer,
                                  paymentMethod: salePaymentMethod,
                                  chargeType: saleChargeType,
                                  averageWeightKg: finalAvgWeightKg,
                                  pricePerKg: isPerBirdVal ? 0 : salePricePerKg,
                                  dressingPercentage: finalDressingPercentage,
                                  grossMarginPerBird: Number(grossMarginPerBirdValue.toFixed(2))
                                };

                                const nextCount = batch.currentCount - finalQtyVal;
                                const nextStatus = nextCount === 0 ? "COMPLETED" : "PARTIAL SALE";
                                
                                if (onUpdatePoultryBatch) {
                                  onUpdatePoultryBatch({
                                    ...batch,
                                    currentCount: nextCount,
                                    status: nextStatus,
                                    salesLogs: [...(batch.salesLogs || []), finalSaleObj]
                                  });
                                }

                                // Auto export PDF Receipt & Delivery Note
                                try {
                                  handleDownloadPDF(finalSaleObj, batch);
                                } catch (err) {
                                  console.error("PDF generation failed:", err);
                                }

                                setActiveActionTab(prev => ({ ...prev, [batch.id]: "finance" }));
                              }}
                              className={`px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                                isLockByWithholding 
                                  ? "bg-slate-350 text-slate-500 cursor-not-allowed border border-slate-300"
                                  : "bg-emerald-700 hover:bg-emerald-650 text-white"
                              }`}
                            >
                              ✓ Post Sales Voucher & Export PDF Receipt
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {activeActionTab[batch.id] === "medication" && batch.status !== "CLOSED" && (
                      <div className="bg-indigo-50/50 p-5 border rounded-2xl border-indigo-300 space-y-4 animate-slide-up text-slate-800">
                        {/* Title and Close */}
                        <div className="flex justify-between items-center border-b border-indigo-200 pb-2">
                          <div>
                            <span className="text-[9px] font-extrabold uppercase text-indigo-800 tracking-wider block font-sans">Mabala Veterinary & Biosecurity Suite</span>
                            <h5 className="text-xs font-black uppercase text-indigo-950 flex items-center gap-1.5 mt-0.5 font-sans">🩺 Health & Disease Management Hub</h5>
                          </div>
                          <button onClick={() => setActiveActionTab(prev => ({ ...prev, [batch.id]: "none" }))} className="bg-slate-200/80 hover:bg-slate-300 px-2.5 py-1 text-slate-700 font-extrabold text-[10px] rounded-lg tracking-wider transition-all">CLOSE HUB ×</button>
                        </div>

                        {/* Sub-tabs buttons */}
                        <div className="grid grid-cols-3 gap-1.5 bg-indigo-100/40 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setVetSubTab("events")}
                            className={`py-1.5 rounded-lg text-[10px] font-black uppercase text-center tracking-wider transition-all cursor-pointer ${
                              vetSubTab === "events" ? "bg-indigo-700 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            🩺 Log & Check Outbreaks
                          </button>
                          <button
                            type="button"
                            onClick={() => setVetSubTab("register")}
                            className={`py-1.5 rounded-lg text-[10px] font-black uppercase text-center tracking-wider transition-all cursor-pointer ${
                              vetSubTab === "register" ? "bg-indigo-700 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            💊 Drug Register stockpile
                          </button>
                          <button
                            type="button"
                            onClick={() => setVetSubTab("guide")}
                            className={`py-1.5 rounded-lg text-[10px] font-black uppercase text-center tracking-wider transition-all cursor-pointer ${
                              vetSubTab === "guide" ? "bg-indigo-700 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            📖 Poultry Disease Manual
                          </button>
                        </div>

                        {/* TAB 1: LOG OUTBREAKS & DISPENSE TREATMENT */}
                        {vetSubTab === "events" && (
                          <div className="space-y-4 animate-fade-in">
                            <form 
                              onSubmit={e => {
                                e.preventDefault();
                                if (!healthEventDiagnosis) {
                                  alert("Please specify or choose a diagnostic disease.");
                                  return;
                                }

                                // 1. Determine drug details to save
                                let matchedDrugBrand = "";
                                let matchedActiveIngredient = "";
                                let matchedDosage = "";
                                let matchedRoute = "";
                                let matchedWithdrawalDays = 0;
                                let withholdingCloseDate: string | undefined = undefined;

                                if (healthEventSelectedDrugId && healthEventSelectedDrugId !== "none" && healthEventSelectedDrugId !== "custom") {
                                  const savedDrug = medicationRegister.find(d => d.id === healthEventSelectedDrugId);
                                  if (savedDrug) {
                                    matchedDrugBrand = savedDrug.brandName;
                                    matchedActiveIngredient = savedDrug.activeIngredient;
                                    matchedDosage = savedDrug.dosageGuide;
                                    matchedRoute = savedDrug.routeOfAdmin;
                                    matchedWithdrawalDays = savedDrug.withdrawalPeriodDays;
                                  }
                                } else if (healthEventSelectedDrugId === "custom") {
                                  matchedDrugBrand = healthEventCustomDrug;
                                  matchedActiveIngredient = healthEventActiveIngredient;
                                  matchedDosage = healthEventDosage;
                                  matchedRoute = healthEventRoute;
                                  matchedWithdrawalDays = healthEventWithholdingDays;
                                }

                                if (matchedWithdrawalDays > 0) {
                                  const wd = new Date(healthEventDate);
                                  wd.setDate(wd.getDate() + matchedWithdrawalDays);
                                  withholdingCloseDate = wd.toISOString().split("T")[0];
                                }

                                // 2. Build PoultryHealthEvent
                                const newEvent: PoultryHealthEvent = {
                                  id: "hevent-" + Date.now(),
                                  date: healthEventDate,
                                  birdsAffected: healthEventAffected,
                                  symptoms: healthEventSymptoms,
                                  preliminaryDiagnosis: healthEventDiagnosis,
                                  severity: healthEventSeverity,
                                  treatmentDrug: matchedDrugBrand || undefined,
                                  activeIngredient: matchedActiveIngredient || undefined,
                                  dosage: matchedDosage || undefined,
                                  route: matchedRoute || undefined,
                                  durationDays: healthEventSelectedDrugId !== "none" ? healthEventDuration : undefined,
                                  withholdingPeriodDays: matchedWithdrawalDays,
                                  withholdingCloseDate,
                                  treatmentCost: healthEventSelectedDrugId !== "none" ? healthEventTreatmentCost : 0,
                                  status: healthEventStatus,
                                  notes: healthEventNotes
                                };

                                // 3. Update medications expense ledger if treatment applies
                                const updatedMedsLogs = [...(batch.medications || [])];
                                if (matchedDrugBrand) {
                                  updatedMedsLogs.push({
                                    date: healthEventDate,
                                    drugName: matchedDrugBrand,
                                    dosage: matchedDosage,
                                    cost: healthEventTreatmentCost,
                                    withholdingCloseDate
                                  });
                                }

                                // 4. Update flock size & mortality records if outcome is immediate mortality
                                let nextFlockCount = batch.currentCount;
                                const updatedMortLogs = [...(batch.mortalityLogs || [])];
                                
                                if (healthEventStatus === "Resulted in Mortality") {
                                  nextFlockCount = Math.max(0, batch.currentCount - healthEventAffected);
                                  updatedMortLogs.push({
                                    date: healthEventDate,
                                    count: healthEventAffected,
                                    cause: `Outbreak of ${healthEventDiagnosis} (${healthEventSeverity})`
                                  });
                                }

                                if (onUpdatePoultryBatch) {
                                  onUpdatePoultryBatch({
                                    ...batch,
                                    currentCount: nextFlockCount,
                                    mortalityLogs: updatedMortLogs,
                                    medications: updatedMedsLogs,
                                    healthEvents: [...(batch.healthEvents || []), newEvent]
                                  });
                                }

                                // Clear forms
                                setHealthEventSymptoms("");
                                setHealthEventDiagnosis("");
                                setHealthEventNotes("");
                                setHealthEventSelectedDrugId("none");
                              }}
                              className="bg-white p-4.5 rounded-xl border border-indigo-150 space-y-3.5"
                            >
                              <h6 className="text-[10.5px] font-black uppercase text-indigo-950 flex items-center gap-1.5 border-b pb-1">
                                📝 Log Diagnostic Episode & Treatment Scheme
                              </h6>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Event Date</label>
                                  <input type="date" value={healthEventDate} onChange={e => setHealthEventDate(e.target.value)} required className="p-2 border rounded-lg bg-slate-50 text-xs font-mono" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Birds Affected / Sick</label>
                                  <input type="number" min={1} max={batch.currentCount} value={healthEventAffected} onChange={e => setHealthEventAffected(Math.max(1, Math.min(batch.currentCount, Number(e.target.value))))} required className="p-2 border rounded-lg bg-slate-50 text-xs font-bold" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Preliminary Diagnosis</label>
                                  <select value={healthEventDiagnosis} onChange={e => setHealthEventDiagnosis(e.target.value)} required className="p-2 border rounded-lg bg-slate-50 text-xs font-bold text-slate-800">
                                    <option value="">-- Choose Disease --</option>
                                    <option value="Newcastle Disease">Newcastle Disease (Kuku Cholera)</option>
                                    <option value="Gumboro Disease">Gumboro (IBD)</option>
                                    <option value="Coccidiosis">Coccidiosis (Bloody Stools)</option>
                                    <option value="Infectious Coryza">Infectious Coryza (Swollen Face)</option>
                                    <option value="Chronic Respiratory Disease">Chronic Respiratory Disease (CRD)</option>
                                    <option value="Fowl Pox">Fowl Pox (Chitooto)</option>
                                    <option value="E. Coli Septicemia">E. Coli Infection</option>
                                    <option value="Heat / Environmental Stress">Heat Fatigue / High Ammonia</option>
                                    <option value="Physical Injury / Trauma">Physical Chest Trauma</option>
                                    <option value="Other Disease">Other Sub-Clinical Disease</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Severity Level</label>
                                  <div className="grid grid-cols-3 gap-1">
                                    {["Mild", "Moderate", "Severe"].map(sev => (
                                      <button
                                        type="button"
                                        key={sev}
                                        onClick={() => setHealthEventSeverity(sev as any)}
                                        className={`py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider border transition-all ${
                                          healthEventSeverity === sev 
                                            ? sev === "Severe" ? "bg-red-700 text-white border-red-700" : sev === "Moderate" ? "bg-amber-650 text-white border-amber-650" : "bg-teal-700 text-white border-teal-700"
                                            : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                                        }`}
                                      >
                                        {sev}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Observed Clinical Symptoms</label>
                                  <input type="text" placeholder="e.g. huddling, sneezing, gasping, white stool, dropping wings" value={healthEventSymptoms} onChange={e => setHealthEventSymptoms(e.target.value)} required className="p-2 border rounded-lg text-xs" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500 font-sans">Diagnosis Outcome Status</label>
                                  <select value={healthEventStatus} onChange={e => setHealthEventStatus(e.target.value as any)} className="p-2 border rounded-lg text-xs font-bold bg-white text-slate-800">
                                    <option value="Ongoing">Ongoing (Monitoring &amp; treatment active)</option>
                                    <option value="Resolved">Resolved (Back to zero-symptoms state)</option>
                                    <option value="Resulted in Mortality">Resulted in Mortality (Directly log casualties &amp; drop count)</option>
                                  </select>
                                </div>
                              </div>

                              {/* Treatment & Drugs Section */}
                              <div className="bg-slate-50 p-3 rounded-xl border border-dashed text-xs space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-extrabold uppercase text-slate-500">Dispense Product (Veterinary Register Integration)</label>
                                    <select
                                      value={healthEventSelectedDrugId}
                                      onChange={e => {
                                        const valId = e.target.value;
                                        setHealthEventSelectedDrugId(valId);
                                        if (valId === "none" || !valId) {
                                          setHealthEventTreatWithDrug(false);
                                        } else {
                                          setHealthEventTreatWithDrug(true);
                                          const matched = medicationRegister.find(d => d.id === valId);
                                          if (matched) {
                                            setHealthEventCustomDrug(matched.brandName);
                                            setHealthEventActiveIngredient(matched.activeIngredient);
                                            setHealthEventDosage(matched.dosageGuide);
                                            setHealthEventRoute(matched.routeOfAdmin);
                                            setHealthEventWithholdingDays(matched.withdrawalPeriodDays);
                                            setHealthEventTreatmentCost(matched.unitCost || 50);
                                          }
                                        }
                                      }}
                                      className="p-2 border rounded-lg bg-white font-bold"
                                    >
                                      <option value="none">No Medical Treatment (Shed ventilation adjustments / observations only)</option>
                                      {medicationRegister.map(dr => (
                                        <option key={dr.id} value={dr.id}>🏥 {dr.brandName} (Active: {dr.activeIngredient})</option>
                                      ))}
                                      <option value="custom">🧪 Dispense custom/unlisted drug...</option>
                                    </select>
                                  </div>
                                  
                                  {healthEventSelectedDrugId !== "none" && (
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[9px] font-extrabold uppercase text-slate-500">Treatment Cost ({currencySymbol})</label>
                                      <input type="number" min={0} value={healthEventTreatmentCost} onChange={e => setHealthEventTreatmentCost(Math.max(0, Number(e.target.value)))} required className="p-2 border rounded-lg bg-white font-mono font-bold text-slate-900" />
                                    </div>
                                  )}
                                </div>

                                {healthEventSelectedDrugId === "custom" && (
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 animate-fade-in">
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[8.5px] font-extrabold uppercase text-slate-400">Drug Brand Name</label>
                                      <input type="text" placeholder="e.g. Aliseryl" value={healthEventCustomDrug} onChange={e => setHealthEventCustomDrug(e.target.value)} required className="p-2 border rounded bg-white" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[8.5px] font-extrabold uppercase text-slate-400">Active Ingredient</label>
                                      <input type="text" placeholder="e.g. Oxytetracycline" value={healthEventActiveIngredient} onChange={e => setHealthEventActiveIngredient(e.target.value)} className="p-2 border rounded bg-white" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[8.5px] font-extrabold uppercase text-slate-400">Dosage administration</label>
                                      <input type="text" placeholder="e.g. 1g/L of water" value={healthEventDosage} onChange={e => setHealthEventDosage(e.target.value)} className="p-2 border rounded bg-white" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[8.5px] font-extrabold uppercase text-slate-400">Admin Route</label>
                                      <select value={healthEventRoute} onChange={e => setHealthEventRoute(e.target.value)} className="p-2 border rounded bg-white">
                                        <option value="Drinking Water">Drinking Water</option>
                                        <option value="Eye Drop">Eye Drop</option>
                                        <option value="SC Injection">SC Injection</option>
                                        <option value="IM Injection">IM Injection</option>
                                        <option value="In-Feed additive">In-Feed additive</option>
                                        <option value="Wing Web Stab">Wing Web Stab</option>
                                      </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[8.5px] font-extrabold uppercase text-slate-400">Withdrawal days</label>
                                      <input type="number" min={0} value={healthEventWithholdingDays} onChange={e => setHealthEventWithholdingDays(Math.max(0, Number(e.target.value)))} className="p-2 border rounded bg-white" />
                                    </div>
                                  </div>
                                )}

                                {healthEventSelectedDrugId !== "none" && (
                                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                                    <p>🛡️ Withdrawal Safety Window: <strong className="text-indigo-950 font-black">{healthEventSelectedDrugId === "custom" ? healthEventWithholdingDays : medicationRegister.find(d => d.id === healthEventSelectedDrugId)?.withdrawalPeriodDays || 0} days</strong> before bird sale/harvest is permitted.</p>
                                    <p>⏳ Treatment Course Duration: <strong className="text-indigo-950 font-black">{healthEventDuration} consecutive days</strong>.</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-1 text-xs">
                                <label className="text-[9px] font-extrabold uppercase text-slate-500">Internal Quarantine Notes / Biosecurity Instructions</label>
                                <textarea rows={2} placeholder="Shed-level biosecurity notes, quarantine boundary parameters, feed logs isolation, veterinary prescription comment lines..." value={healthEventNotes} onChange={e => setHealthEventNotes(e.target.value)} className="p-2.5 border rounded-lg resize-none text-[11px]" />
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  type="submit"
                                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-650 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                                >
                                  🩺 Log Diagnostics, Treatment &amp; Post Cost
                                </button>
                              </div>
                            </form>

                            {/* ACTIVE / HISTORIC EVENT LOGBOOK */}
                            <div className="space-y-2">
                              <h6 className="text-[10px] font-black text-indigo-900 uppercase tracking-wider">📋 Batch Health Events Log &amp; Case Progression</h6>
                              {(!batch.healthEvents || batch.healthEvents.length === 0) ? (
                                <p className="text-[11px] text-slate-400 italic bg-white p-4 text-center rounded-xl border border-dashed">No clinical diagnoses or health incidents logged for this batch.</p>
                              ) : (
                                <div className="space-y-3">
                                  {batch.healthEvents.map(evt => {
                                    const isOngoing = evt.status === "Ongoing";
                                    const hasWithholding = evt.withholdingCloseDate && evt.withholdingPeriodDays && evt.withholdingPeriodDays > 0;
                                    const isWithholdingActive = hasWithholding && evt.withholdingCloseDate! > new Date().toISOString().split("T")[0];

                                    return (
                                      <div key={evt.id} className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-xs space-y-3">
                                        <div className="flex justify-between items-start flex-wrap gap-2.5 border-b pb-2">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-bold text-[11px] text-indigo-950">{evt.preliminaryDiagnosis}</span>
                                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase ${
                                                evt.severity === "Severe" ? "bg-red-100 text-red-800" : evt.severity === "Moderate" ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"
                                              }`}>
                                                {evt.severity}
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold">Logged: {evt.date} • {evt.birdsAffected} birds sick</p>
                                          </div>
                                          <div className="flex gap-2 items-center">
                                            {evt.treatmentCost > 0 && (
                                              <span className="text-[10.5px] font-mono font-black text-slate-650 bg-slate-100 border px-2 py-1 rounded-lg">
                                                Vet Exp: {currencySymbol} {evt.treatmentCost}
                                              </span>
                                            )}
                                            <span className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-full ${
                                              evt.status === "Resolved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : evt.status === "Resulted in Mortality" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                                            }`}>
                                              {evt.status}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                                          <div className="space-y-1 text-slate-600">
                                            <p><strong className="text-slate-800 font-bold">Symptoms:</strong> “{evt.symptoms}”</p>
                                            {evt.notes && <p><strong className="text-slate-800 font-bold">Quarantine Directives:</strong> <span className="italic">{evt.notes}</span></p>}
                                          </div>
                                          
                                          {evt.treatmentDrug && (
                                            <div className="p-2.5 bg-indigo-50/40 rounded-lg border border-indigo-100 space-y-1">
                                              <p className="text-[10px] font-extrabold uppercase text-indigo-850">🧬 Active Veterinary Scheme</p>
                                              <p><strong className="text-indigo-900 font-bold">{evt.treatmentDrug}</strong> ({evt.activeIngredient || "N/A"})</p>
                                              <p className="text-[10px] text-slate-500 font-medium">Dosage: {evt.dosage} via {evt.route}</p>
                                              {hasWithholding && (
                                                <div className="flex items-center gap-1.5 mt-2">
                                                  <span className={`w-2.5 h-2.5 rounded-full ${isWithholdingActive ? "bg-amber-600 animate-pulse" : "bg-emerald-600"}`} />
                                                  <span className={`text-[10px] font-bold ${isWithholdingActive ? "text-amber-800" : "text-emerald-800"}`}>
                                                    Withholding safe date: {evt.withholdingCloseDate} ({evt.withholdingPeriodDays}d) - {isWithholdingActive ? "⚠️ DANGER: SALE RESTRICTED" : "✅ Safe for Sale"}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* CASE PROGRESSION BUTTONS (Ongoing status only) */}
                                        {isOngoing && (
                                          <div className="flex justify-end gap-2 border-t border-slate-100 pt-2.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (confirm("Confirm marking this specific disease episode as completely resolved?")) {
                                                  const nextEvts = batch.healthEvents?.map(h => h.id === evt.id ? { ...h, status: "Resolved" as const } : h) || [];
                                                  if (onUpdatePoultryBatch) {
                                                    onUpdatePoultryBatch({ ...batch, healthEvents: nextEvts });
                                                  }
                                                }
                                              }}
                                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800 text-[10px] font-black uppercase rounded-lg transition-all"
                                            >
                                              ✓ Mark Resolved
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const promptMort = prompt(`Log casualties for outbreak of ${evt.preliminaryDiagnosis}. Enter count of dead birds (Max sick size: ${evt.birdsAffected}):`, String(evt.birdsAffected));
                                                if (promptMort === null) return;
                                                const countInt = Math.max(1, Math.min(batch.currentCount, Number(promptMort)));
                                                
                                                if (isNaN(countInt)) {
                                                  alert("Invalid number entered.");
                                                  return;
                                                }

                                                const nextEvts = batch.healthEvents?.map(h => h.id === evt.id ? { ...h, status: "Resulted in Mortality" as const } : h) || [];
                                                const nextFlock = Math.max(0, batch.currentCount - countInt);
                                                const nextMortLogs = [...(batch.mortalityLogs || []), {
                                                  date: new Date().toISOString().split("T")[0],
                                                  count: countInt,
                                                  cause: `Outbreak of ${evt.preliminaryDiagnosis} (${evt.severity} severity)`
                                                }];

                                                if (onUpdatePoultryBatch) {
                                                  onUpdatePoultryBatch({
                                                    ...batch,
                                                    currentCount: nextFlock,
                                                    mortalityLogs: nextMortLogs,
                                                    healthEvents: nextEvts
                                                  });
                                                }
                                              }}
                                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-850 text-[10px] font-black uppercase rounded-lg transition-all"
                                            >
                                              ☠ Record Mortality Loss
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* TAB 2: VETERINARY DRUG stockpile register */}
                        {vetSubTab === "register" && (
                          <div className="space-y-4 animate-fade-in text-xs">
                            <div className="bg-white p-4 rounded-xl border border-indigo-150 space-y-4">
                              <div className="border-b pb-1.5 flex justify-between items-center">
                                <h6 className="text-[10.5px] font-black uppercase text-indigo-950">💊 Active Veterinary Drug Register</h6>
                                <span className="text-[9.5px] bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-lg border border-indigo-150 font-black">{medicationRegister.length} Pharmacological Products</span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left font-sans text-[11px] border-collapse bg-white rounded-lg">
                                  <thead>
                                    <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-indigo-100 uppercase text-[9.5px]">
                                      <th className="p-2.5">Brand / Drug</th>
                                      <th className="p-2.5">Active Ingredient</th>
                                      <th className="p-2.5">Indications</th>
                                      <th className="p-2.5 text-center">Withdrawal (Days)</th>
                                      <th className="p-2.5">Administration Dosage Route</th>
                                      <th className="p-2.5 text-right">Standard Cost</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {medicationRegister.map(item => (
                                      <tr key={item.id} className="border-b border-slate-100 font-semibold hover:bg-slate-50/50 transition-all text-slate-700">
                                        <td className="p-2.5 text-indigo-950 font-extrabold">{item.brandName}</td>
                                        <td className="p-2.5 font-mono text-[10px] text-slate-500 font-black">{item.activeIngredient}</td>
                                        <td className="p-2.5 text-slate-650 font-normal leading-relaxed">{item.indicatedFor || "General pathogen treatment"}</td>
                                        <td className="p-2.5 text-center">
                                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-black ${item.withdrawalPeriodDays > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                            {item.withdrawalPeriodDays} Days
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-slate-650 font-medium">
                                          {item.dosageGuide} <span className="text-slate-400">({item.routeOfAdmin})</span>
                                        </td>
                                        <td className="p-2.5 text-right font-mono font-black text-slate-900">{currencySymbol} {item.unitCost}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* ADD DRUG TO REGISTER FORM */}
                            <form 
                              onSubmit={e => {
                                e.preventDefault();
                                if (!newRegBrand) return;

                                const newItem: MedicationRegisterItem = {
                                  id: "dr-" + Date.now(),
                                  brandName: newRegBrand,
                                  activeIngredient: newRegIngredient,
                                  dosageGuide: newRegDosage,
                                  withdrawalPeriodDays: newRegWithdrawal,
                                  routeOfAdmin: newRegRoute,
                                  category: newRegCategory,
                                  indicatedFor: newRegIndication,
                                  unitCost: newRegCost
                                };

                                setMedicationRegister(prev => [...prev, newItem]);
                                setNewRegBrand("");
                                setNewRegIngredient("");
                                setNewRegDosage("");
                                setNewRegIndication("");
                              }}
                              className="bg-white p-4 rounded-xl border border-indigo-150 space-y-3"
                            >
                              <h6 className="text-[10px] font-black uppercase text-indigo-950 border-b pb-1 font-sans">🧪 Add New Product to Veterinary Register</h6>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Brand Name</label>
                                  <input type="text" placeholder="e.g. Amprolium Soluble" value={newRegBrand} onChange={e => setNewRegBrand(e.target.value)} required className="p-2 border rounded-lg bg-slate-50" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Active Ingredient</label>
                                  <input type="text" placeholder="e.g. Amprolium Hydrochloride" value={newRegIngredient} onChange={e => setNewRegIngredient(e.target.value)} required className="p-2 border rounded-lg bg-slate-50" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Dosage administration</label>
                                  <input type="text" placeholder="e.g. 1.25g per Litre" value={newRegDosage} onChange={e => setNewRegDosage(e.target.value)} required className="p-2 border rounded-lg bg-slate-50" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Indications / Target diseases</label>
                                  <input type="text" placeholder="e.g. Coccidiosis" value={newRegIndication} onChange={e => setNewRegIndication(e.target.value)} required className="p-2 border rounded-lg bg-slate-50" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Administration route</label>
                                  <select value={newRegRoute} onChange={e => setNewRegRoute(e.target.value)} className="p-2 border rounded-lg bg-slate-50 font-bold">
                                    <option value="Drinking Water">Drinking Water</option>
                                    <option value="Eye Drop">Eye Drop</option>
                                    <option value="SC Injection">SC Injection</option>
                                    <option value="IM Injection">IM Injection</option>
                                    <option value="In-Feed additive">In-Feed additive</option>
                                    <option value="Wing Web Stab">Wing Web Stab</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Category Classification</label>
                                  <select value={newRegCategory} onChange={e => setNewRegCategory(e.target.value as any)} className="p-2 border rounded-lg bg-slate-50 font-bold">
                                    <option value="Antibiotic">Antibiotic</option>
                                    <option value="Coccidiostat">Coccidiostat</option>
                                    <option value="Dewormer">Dewormer</option>
                                    <option value="Vitamin/Supplement">Vitamin/Supplement</option>
                                    <option value="Other">Other Category</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Withdrawal safety days</label>
                                  <input type="number" min={0} value={newRegWithdrawal} onChange={e => setNewRegWithdrawal(Math.max(0, Number(e.target.value)))} required className="p-2 border rounded-lg bg-slate-50" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-extrabold uppercase text-slate-500">Standard Product Cost ({currencySymbol})</label>
                                  <input type="number" min={0} value={newRegCost} onChange={e => setNewRegCost(Math.max(0, Number(e.target.value)))} required className="p-2 border rounded-lg bg-slate-50 font-mono font-bold" />
                                </div>
                              </div>

                              <div className="flex justify-end pt-2">
                                <button type="submit" className="px-4 py-2 bg-indigo-700 hover:bg-indigo-650 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">
                                  + Add Item to Register Stockpile
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* TAB 3: ZAMBIA POULTRY DISEASES QUICK REFERENCE MANUAL */}
                        {vetSubTab === "guide" && (
                          <div className="space-y-4 animate-fade-in text-xs">
                            <div className="bg-white p-4 rounded-xl border border-indigo-150 space-y-4">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
                                <div>
                                  <h6 className="text-[10.5px] font-black uppercase text-indigo-950">🇸🇿 Zambia Poultry Disease Quick-Reference Guide</h6>
                                  <p className="text-[9.5px] text-slate-400 font-bold font-sans mt-0.5">Quick diagnostic support, symptom checklist, and biosecurity emergency procedures.</p>
                                </div>
                                <div className="relative w-full sm:w-64 select-none">
                                  <input
                                    type="text"
                                    placeholder="Filter by symptoms or name..."
                                    value={diseaseGuideSearch}
                                    onChange={e => setDiseaseGuideSearch(e.target.value)}
                                    className="p-1.5 pl-3 border border-indigo-200 rounded-lg text-[11px] bg-slate-50 w-full"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {POULTRY_DISEASES_ZAMBIA.filter(dis => {
                                  const term = diseaseGuideSearch.toLowerCase().trim();
                                  return !term || 
                                    dis.name.toLowerCase().includes(term) ||
                                    (dis.localName && dis.localName.toLowerCase().includes(term)) ||
                                    dis.cause.toLowerCase().includes(term) ||
                                    dis.symptoms.some(s => s.toLowerCase().includes(term));
                                }).map(dis => (
                                  <div key={dis.id} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-250 transition-all bg-slate-50/40 space-y-2.5">
                                    <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-1.5">
                                      <div>
                                        <h6 className="text-[11.5px] font-black text-slate-900">{dis.name}</h6>
                                        {dis.localName && <span className="block text-[9.5px] font-mono font-bold text-slate-500 italic mt-0.5">Local: {dis.localName}</span>}
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase ${
                                        dis.severity === "Critical" ? "bg-red-100 text-red-800 animate-pulse border border-red-200" : "bg-amber-100 text-amber-800"
                                      }`}>
                                        {dis.severity} Severity
                                      </span>
                                    </div>

                                    <div className="text-[10px] space-y-1.5">
                                      <p className="text-slate-500 font-medium">🔬 Diagnostic Pathogen: <strong className="text-slate-800 font-semibold">{dis.cause}</strong></p>
                                      
                                      <div className="space-y-0.5 text-slate-700">
                                        <p className="font-bold text-[9px] uppercase text-indigo-900">🩺 Characteristic Symptoms:</p>
                                        <ul className="list-disc leading-relaxed list-inside pl-1 text-[10px] font-medium text-slate-650">
                                          {dis.symptoms.map((sym, index) => <li key={index}>{sym}</li>)}
                                        </ul>
                                      </div>

                                      <p className="bg-emerald-50 text-emerald-950 p-2 rounded border border-emerald-200"><strong className="font-extrabold uppercase text-[8px] block text-emerald-800">🛡️ Preventative Sequence</strong>{dis.prevention}</p>
                                      <p className="bg-indigo-50/50 text-indigo-950 p-2 rounded border border-indigo-200"><strong className="font-extrabold uppercase text-[8px] block text-indigo-800 font-sans">💊 Standard Treatment</strong>{dis.treatment}</p>
                                      <p className="bg-rose-50 text-rose-950 p-2 rounded border border-rose-200"><strong className="font-extrabold uppercase text-[8px] block text-rose-800">⛔ Biosecurity Directive</strong>{dis.bioSecurityAdvisory}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeActionTab[batch.id] === "mortality" && batch.status !== "CLOSED" && (
                      <div className="bg-rose-50/60 p-4 border rounded-2xl border-rose-350 space-y-3.5 animate-slide-up">
                        <div className="flex justify-between items-center">
                          <h5 className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Record Flock Mortality event (Biological inventory decrement)</h5>
                          <button onClick={() => setActiveActionTab(prev => ({ ...prev, [batch.id]: "none" }))} className="text-slate-400 hover:text-slate-600 font-extrabold text-xs">Close ×</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs text-slate-700">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9.5px] uppercase font-bold text-slate-500">Date of Loss</label>
                            <input
                              type="date"
                              value={mortDate}
                              onChange={e => setMortDate(e.target.value)}
                              className="p-2 border bg-white rounded-lg font-mono font-bold"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9.5px] uppercase font-bold text-slate-500">Casualties (Max: {batch.currentCount})</label>
                            <input
                              type="number"
                              value={mortQty}
                              onChange={e => setMortQty(Math.min(batch.currentCount, Math.max(1, Number(e.target.value))))}
                              className="p-2 border bg-white rounded-lg font-mono font-bold"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9.5px] uppercase font-bold text-slate-500">Probable Cause</label>
                            <select
                              value={mortProbableCause}
                              onChange={e => setMortProbableCause(e.target.value as any)}
                              className="p-2 border bg-white rounded-lg font-bold"
                            >
                              <option value="disease">Disease Outbreak</option>
                              <option value="feed">Feed / Water Issue</option>
                              <option value="predator">Predator Attack</option>
                              <option value="unknown">Unknown / Environmental</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9.5px] uppercase font-bold text-slate-500">Veterinary Details / Symptoms</label>
                            <input
                              type="text"
                              value={mortCause}
                              onChange={e => setMortCause(e.target.value)}
                              placeholder="e.g. Coccidiosis symptoms"
                              className="p-2 border bg-white rounded-lg font-bold"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9.5px] uppercase font-bold text-slate-500">Disposal Method</label>
                            <select
                              value={mortDisposalMethod}
                              onChange={e => setMortDisposalMethod(e.target.value)}
                              className="p-2 border bg-white rounded-lg font-bold"
                            >
                              <option value="Burial with lime">Burial with lime</option>
                              <option value="Incineration">Incineration</option>
                              <option value="Composting">Composting</option>
                              <option value="Deep Pit disposal">Deep Pit disposal</option>
                              <option value="Other / Contractor removal">Other / Contractor removal</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-rose-250 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              if (mortQty <= 0 || mortQty > batch.currentCount) return;
                              const newMort = {
                                date: mortDate,
                                count: mortQty,
                                cause: mortCause,
                                probableCauseCategory: mortProbableCause,
                                disposalMethod: mortDisposalMethod
                              };
                              const nextCount = Math.max(0, batch.currentCount - mortQty);
                              const nextStatus = nextCount === 0 ? "COMPLETED" : batch.status;
                              if (onUpdatePoultryBatch) {
                                onUpdatePoultryBatch({
                                  ...batch,
                                  currentCount: nextCount,
                                  status: nextStatus,
                                  mortalityLogs: [...(batch.mortalityLogs || []), newMort]
                                });
                              }
                              setActiveActionTab(prev => ({ ...prev, [batch.id]: "none" }));
                            }}
                            className="px-4 py-2 bg-rose-700 hover:bg-rose-650 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            ✓ Save Mortality Record
                          </button>
                        </div>
                      </div>
                    )}

                    {activeActionTab[batch.id] === "feeding" && batch.status !== "CLOSED" && (
                      <div className="bg-amber-50/45 p-5 border rounded-2xl border-amber-300 space-y-5 animate-slide-up text-slate-850">
                        {/* Title and Close */}
                        <div className="flex justify-between items-center border-b border-amber-200 pb-2.5">
                          <div>
                            <span className="text-[9px] font-extrabold uppercase text-amber-850 tracking-wider block font-sans">Operational Feeding Panel & Ration Optimizer</span>
                            <h5 className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5 mt-0.5 font-sans">🌾 FEEDING MANAGEMENT & DIET TRACKER</h5>
                          </div>
                          <button onClick={() => setActiveActionTab(prev => ({ ...prev, [batch.id]: "none" }))} className="text-slate-400 hover:text-slate-600 font-extrabold text-xs">Close ×</button>
                        </div>

                        {/* Local calculations block */}
                        {(() => {
                          const ageDays = getBatchAgeDays(batch.arrivalDate);
                          const ageWeeks = Math.floor(ageDays / 7);
                          
                          // Cumulative quantities and costs
                          const totalFeedKg = batch.feedLogs ? batch.feedLogs.reduce((sum, l) => sum + l.quantityKg, 0) : 0;
                          const totalFeedCost = batch.feedLogs ? batch.feedLogs.reduce((sum, l) => sum + l.cost, 0) : 0;

                          // Stage-by-stage groupings
                          const stageSummaries: Record<string, { qty: number; cost: number }> = {};
                          PRODUCTION_STAGES.forEach(st => {
                            stageSummaries[st.id] = { qty: 0, cost: 0 };
                          });
                          if (batch.feedLogs) {
                            batch.feedLogs.forEach(l => {
                              let sId = l.stageId;
                              if (!sId) {
                                sId = batch.currentStageId || "grower";
                              }
                              if (!stageSummaries[sId]) {
                                stageSummaries[sId] = { qty: 0, cost: 0 };
                              }
                              stageSummaries[sId].qty += l.quantityKg;
                              stageSummaries[sId].cost += l.cost;
                            });
                          }

                          // FCR automated logic
                          const initialAvgWeightKg = ["Broilers (Meat)"].includes(batch.birdType) ? 0.040 : 0.035;
                          
                          let currentAvgWeightKg = 0;
                          let isCustomWeightUsed = false;
                          if (batch.weightSamples && batch.weightSamples.length > 0) {
                            const sortedSamples = [...batch.weightSamples].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                            currentAvgWeightKg = sortedSamples[sortedSamples.length - 1].averageWeightG / 1000;
                            isCustomWeightUsed = true;
                          } else {
                            if (batch.birdType === "Broilers (Meat)") {
                              if (ageDays <= 7) currentAvgWeightKg = 0.04 + ageDays * 0.02;
                              else if (ageDays <= 14) currentAvgWeightKg = 0.18 + (ageDays - 7) * 0.038;
                              else if (ageDays <= 21) currentAvgWeightKg = 0.45 + (ageDays - 14) * 0.064;
                              else if (ageDays <= 28) currentAvgWeightKg = 0.90 + (ageDays - 21) * 0.085;
                              else if (ageDays <= 35) currentAvgWeightKg = 1.50 + (ageDays - 28) * 0.085;
                              else currentAvgWeightKg = 2.10 + (ageDays - 35) * 0.085;
                            } else {
                              if (ageDays <= 28) currentAvgWeightKg = 0.035 + (ageDays * 0.011);
                              else if (ageDays <= 56) currentAvgWeightKg = 0.350 + ((ageDays - 28) * 0.0125);
                              else if (ageDays <= 84) currentAvgWeightKg = 0.700 + ((ageDays - 56) * 0.014);
                              else if (ageDays <= 126) currentAvgWeightKg = 1.100 + ((ageDays - 84) * 0.0095);
                              else currentAvgWeightKg = 1.500 + ((ageDays - 126) * 0.007);
                            }
                          }
                          if (currentAvgWeightKg < initialAvgWeightKg) currentAvgWeightKg = initialAvgWeightKg;

                          const weightGainedPerBirdKg = currentAvgWeightKg - initialAvgWeightKg;
                          const totalWeightGainKg = weightGainedPerBirdKg * batch.currentCount;
                          const fcr = totalWeightGainKg > 0 ? (totalFeedKg / totalWeightGainKg) : 0;

                          // Feed intake alert logic
                          let expectedIntakePerBirdKg = 0.080;
                          if (batch.birdType === "Broilers (Meat)") {
                            if (ageDays <= 7) expectedIntakePerBirdKg = 0.025;
                            else if (ageDays <= 14) expectedIntakePerBirdKg = 0.050;
                            else if (ageDays <= 21) expectedIntakePerBirdKg = 0.080;
                            else if (ageDays <= 28) expectedIntakePerBirdKg = 0.110;
                            else if (ageDays <= 35) expectedIntakePerBirdKg = 0.140;
                            else expectedIntakePerBirdKg = 0.170;
                          } else {
                            if (ageDays <= 21) expectedIntakePerBirdKg = 0.020;
                            else if (ageDays <= 56) expectedIntakePerBirdKg = 0.045;
                            else if (ageDays <= 126) expectedIntakePerBirdKg = 0.080;
                            else expectedIntakePerBirdKg = 0.115;
                          }

                          const expectedDailyIntakeKg = expectedIntakePerBirdKg * batch.currentCount;

                          const latestLog = batch.feedLogs && batch.feedLogs.length > 0 
                            ? [...batch.feedLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                            : null;
                          const dailyDeficitAlert = latestLog && latestLog.quantityKg < expectedDailyIntakeKg * 0.8;
                          const dailyDeficitPct = latestLog 
                            ? Math.round(((expectedDailyIntakeKg - latestLog.quantityKg) / expectedDailyIntakeKg) * 100)
                            : 0;

                          const stockAllocated = batch.feedStockAllocated ?? 1000;
                          const feedRemaining = Math.max(0, stockAllocated - totalFeedKg);
                          const daysSupplyLeft = expectedDailyIntakeKg > 0 ? (feedRemaining / expectedDailyIntakeKg) : 99;
                          const isLowStockWarning = daysSupplyLeft < 3;

                          const suggestion = getFeedTypeSuggestion(batch.birdType, ageDays);

                          return (
                            <div className="space-y-4">
                              {/* ALERTS SECTION */}
                              {(dailyDeficitAlert || isLowStockWarning) && (
                                <div className="space-y-2">
                                  {dailyDeficitAlert && (
                                    <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs text-rose-950 flex gap-3 animate-pulse border-l-4 border-l-rose-500 text-[11px] leading-relaxed">
                                      <span className="text-lg">⚠️</span>
                                      <div>
                                        <span className="text-[10px] font-extrabold uppercase text-rose-700 tracking-wider block">🚨 FEED DEFICIT ALERT (&gt;20% Underfeeding)</span>
                                        <p className="font-semibold mt-0.5">
                                          Yesterday's intake of <strong>{latestLog!.quantityKg} kg</strong> (logged on {latestLog!.date}) falls more than 20% below the expected target of <strong>{expectedDailyIntakeKg.toFixed(1)} kg</strong> ({dailyDeficitPct}% deficit) required for a cohort of {batch.currentCount} birds at age {ageDays} days. Check feeding distribution operations!
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {isLowStockWarning && (
                                    <div className="bg-amber-100 border border-amber-300 p-3.5 rounded-xl text-xs text-amber-950 flex gap-3 animate-pulse border-l-4 border-l-amber-500 text-[11px] leading-relaxed">
                                      <span className="text-lg">🌾</span>
                                      <div>
                                        <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider block">⚠️ LOW FEED INVENTORY ALERT (&lt;3 Days reserves)</span>
                                        <p className="font-semibold mt-0.5">
                                          Estimated remaining feed stock (<strong>{feedRemaining.toFixed(1)} kg</strong>) is less than 3 days supply. Current expected consumption is <strong>{expectedDailyIntakeKg.toFixed(1)} kg/day</strong>. Reorder formulation before depletion occurs!
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* METRICS RETENTION CARDS */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex flex-col justify-between">
                                  <div>
                                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block font-sans">Cumulative Feed Consumed</span>
                                    <span className="font-mono text-lg font-black text-slate-800 block mt-1">{totalFeedKg.toLocaleString()} <span className="text-xs font-bold text-slate-500">kg</span></span>
                                  </div>
                                  <div className="border-t pt-2 mt-2 text-[9px] text-slate-500 font-bold flex justify-between">
                                    <span>Avg Feed/Bird:</span>
                                    <span className="font-mono text-amber-950">{(totalFeedKg / (batch.quantity || 1)).toFixed(2)} kg</span>
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex flex-col justify-between">
                                  <div>
                                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block font-sans">Cumulative Feed Cost</span>
                                    <span className="font-mono text-lg font-black text-emerald-800 block mt-1">{currencySymbol} {totalFeedCost.toLocaleString()}</span>
                                  </div>
                                  <div className="border-t pt-2 mt-2 text-[9px] text-slate-500 font-bold flex justify-between">
                                    <span>P&L Status:</span>
                                    <span className="text-emerald-700 font-mono font-black uppercase">Dr 5210 Accountable</span>
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex flex-col justify-between">
                                  <div>
                                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block font-sans">Feed Conversion Ratio (FCR)</span>
                                    <span className="font-mono text-lg font-black text-amber-900 block mt-1">{fcr > 0 ? fcr.toFixed(2) : "Calculated on First Feed"}</span>
                                  </div>
                                  <div className="border-t pt-2 mt-2 text-[9px] text-slate-500 font-semibold leading-tight">
                                    {isCustomWeightUsed 
                                      ? "💡 Active weight sampling driving FCR." 
                                      : `💡 Standard biological weight: ${(currentAvgWeightKg * 1000).toFixed(0)}g/bird`}
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex flex-col justify-between">
                                  <div>
                                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block font-sans">Feed Stock Reserves</span>
                                    <span className="font-mono text-lg font-black text-indigo-950 block mt-1">{feedRemaining.toFixed(0)} / {stockAllocated} <span className="text-xs text-slate-500">kg</span></span>
                                  </div>
                                  <div className="border-t pt-2 mt-2 text-[9px] text-slate-500 font-bold flex justify-between">
                                    <span>Estimated Supply Safety:</span>
                                    <span className={`px-1.5 py-0.2 rounded font-mono ${daysSupplyLeft < 3 ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-700"}`}>
                                      {daysSupplyLeft.toFixed(1)} Days
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* STAGE-BY-STAGE PROGRESS CHART & VALUE BOX */}
                              <div className="bg-white p-4 rounded-xl border border-amber-200/85 shadow-3xs">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-3 font-sans">🛡️ Stage-by-Stage Cumulative Feed Consumption</span>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                  {PRODUCTION_STAGES.filter(st => isStageApplicable(st.id, batch.birdType)).map(st => {
                                    const sumObj = stageSummaries[st.id] || { qty: 0, cost: 0 };
                                    const isCurrent = batch.currentStageId === st.id || (!batch.currentStageId && st.id === getSuggestedStageId(ageDays, batch.birdType));
                                    return (
                                      <div key={st.id} className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                                        isCurrent 
                                          ? "bg-amber-50/50 border-amber-400 shadow-3xs ring-1 ring-amber-300" 
                                          : "bg-slate-50/50 border-slate-200"
                                      }`}>
                                        <div>
                                          <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-slate-900 text-[10.5px] font-sans truncate">{st.name}</span>
                                            {isCurrent && <span className="text-[7px] font-bold text-amber-700 bg-amber-100 px-1 rounded uppercase font-mono shrink-0">ACTIVE</span>}
                                          </div>
                                          <span className="text-[8px] font-mono text-slate-400 block mt-0.5">{st.ageRange}</span>
                                        </div>
                                        <div className="mt-2.5">
                                          <span className="font-mono font-bold text-slate-700 text-xs block">{sumObj.qty.toFixed(1)} kg</span>
                                          <span className="font-mono text-[9px] text-emerald-700 block mt-0.5">{currencySymbol} {sumObj.cost.toFixed(0)}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* DOCK INTERACTION FORMS FOR FEED LOGGING & WEIGHT EXERCISE */}
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                                {/* Core Feeding Event Log Card */}
                                <div className="lg:col-span-7 bg-white p-4.5 rounded-xl border border-amber-200 flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between items-center pb-2.5 border-b mb-3">
                                      <span className="font-extrabold text-[10px] uppercase text-amber-950 tracking-wider flex items-center gap-1 font-sans">📋 Record Daily Feed Event</span>
                                      <span className="text-[9px] bg-slate-100 text-slate-700 px-2 rounded font-mono font-bold">STAGE: {batch.currentStageId || "Growing"}</span>
                                    </div>

                                    {/* Autofill Suggesion Banner */}
                                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 mb-4 text-[11px] leading-relaxed flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                                      <div>
                                        <span className="font-extrabold text-amber-900 uppercase text-[9px] tracking-wider block font-sans">Ration Suggestion (Days {ageDays})</span>
                                        <p className="text-slate-650 font-medium">Use stage appropriate: <strong>{suggestion.type} Mash/Pellets</strong> ({suggestion.desc})</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFeedTypeSelected(suggestion.type);
                                          setFeedFormulaName(suggestion.formula);
                                          setFeedQtyVal(Math.round(expectedDailyIntakeKg));
                                          setFeedPricePerKg(15);
                                        }}
                                        className="bg-amber-600 hover:bg-amber-500 font-black text-[9px] text-white uppercase py-1 px-3 rounded-lg shrink-0 transition-colors cursor-pointer tracking-wider font-sans"
                                      >
                                        ✓ Autofill Formulation
                                      </button>
                                    </div>

                                    {/* Main Form Fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      <div className="flex flex-col gap-1 text-xs">
                                        <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Feeding Date</span>
                                        <input type="date" value={feedDate} onChange={e => setFeedDate(e.target.value)} required className="border p-2 bg-slate-50 rounded-lg text-xs font-semibold" />
                                      </div>
                                      
                                      <div className="flex flex-col gap-1 text-xs">
                                        <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Feed Type Selected</span>
                                        <input type="text" value={feedTypeSelected} onChange={e => setFeedTypeSelected(e.target.value)} placeholder="Starter / Grower etc" required className="border p-2 bg-white rounded-lg text-xs font-bold text-amber-950" />
                                      </div>

                                      <div className="flex flex-col gap-1 text-xs">
                                        <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Select Saved Formulation</span>
                                        <select
                                          value={feedFormulaName}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setFeedFormulaName(val);
                                            // Find standard formula list to pre-fill prices
                                            const matched = customFormulas.find(f => f.name === val);
                                            if (matched) {
                                              const totalW = matched.ingredients.reduce((sum, item) => sum + item.quantityKg, 0);
                                              const totalC = matched.ingredients.reduce((sum, item) => sum + (item.quantityKg * item.costPerKg), 0);
                                              if (totalW > 0) {
                                                setFeedPricePerKg(Number((totalC / totalW).toFixed(2)));
                                              }
                                              setFeedTypeSelected(`${matched.stage} Rations`);
                                            }
                                          }}
                                          className="border p-2 bg-white rounded-lg text-xs font-bold text-amber-955"
                                        >
                                          <option value="">-- Choose Preset or type Override --</option>
                                          {customFormulas.map((f, fi) => (
                                            <option key={fi} value={f.name}>{f.name} (v{f.version})</option>
                                          ))}
                                          <option value="Custom">Custom Override Name</option>
                                        </select>
                                      </div>

                                      <div className="flex flex-col gap-1 text-xs">
                                        <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Formula Formulation Custom Override</span>
                                        <input type="text" value={feedFormulaName} onChange={e => setFeedFormulaName(e.target.value)} placeholder="e.g. Formula v4.2 Layer" required className="border p-2 bg-white rounded-lg text-xs font-semibold" />
                                      </div>

                                      <div className="flex flex-col gap-1 text-xs">
                                        <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Quantity In Kgs</span>
                                        <input type="number" value={feedQtyVal} onChange={e => setFeedQtyVal(Math.max(1, Number(e.target.value)))} required className="border p-2 bg-white rounded-lg font-mono font-bold text-xs text-slate-800" />
                                      </div>

                                      <div className="flex flex-col gap-1 text-xs">
                                        <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Unit Price (per kg)</span>
                                        <input type="number" value={feedPricePerKg} onChange={e => setFeedPricePerKg(Math.max(1, Number(e.target.value)))} required className="border p-2 bg-white rounded-lg font-mono font-bold text-xs text-slate-800" />
                                      </div>

                                      <div className="flex flex-col gap-1 text-xs">
                                        <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Feeder Officer Authorized</span>
                                        <input type="text" value={feedFeeder} onChange={e => setFeedFeeder(e.target.value)} required className="border p-2 bg-white rounded-lg text-xs font-bold text-indigo-950" />
                                      </div>
                                    </div>

                                    {/* BLENDING AND TRANSITIONS */}
                                    <div className="mt-4 pt-3 border-t border-amber-100">
                                      <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 select-none cursor-pointer">
                                        <input type="checkbox" checked={isBlendEnabled} onChange={e => setIsBlendEnabled(e.target.checked)} className="rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                                        <span>⚙️ Active Formulation Blending / Transition Mode</span>
                                      </label>

                                      {isBlendEnabled && (
                                        <div className="mt-3 p-3 bg-amber-50/20 border border-amber-100 rounded-xl space-y-3.5 text-xs animate-slide-up leading-relaxed">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div className="flex flex-col gap-1">
                                              <span className="font-extrabold text-slate-400 text-[8.5px] uppercase tracking-wider block">Transition Blend Ratios</span>
                                              <select value={blendFeedTypeSelected} onChange={e => setBlendFeedTypeSelected(e.target.value)} className="p-2 border bg-white rounded-lg text-xs font-bold text-indigo-950">
                                                <option value="Broiler Grower">Broiler Grower Mash</option>
                                                <option value="Broiler Finisher">Broiler Finisher Pellets</option>
                                                <option value="Pullet Grower Mash">Pullet Grower Mash</option>
                                                <option value="Layer Mash">Layer Mash High Calcium</option>
                                              </select>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                              <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                                                <span>Ratio:</span>
                                                <span className="font-mono text-amber-900 font-extrabold">{blendRatio}% Primary / {100 - blendRatio}% Secondary</span>
                                              </div>
                                              <input type="range" min="10" max="90" step="10" value={blendRatio} onChange={e => setBlendRatio(Number(e.target.value))} className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer mt-1" />
                                            </div>
                                          </div>
                                          <span className="text-[9.5px] font-semibold text-slate-450 block">
                                            Allows blending/transition parameters to be stamped on daily events logs directly, managing dual feedstock transition periods easily.
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex justify-end pt-3 border-t mt-4 border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const calculatedCost = feedQtyVal * feedPricePerKg;
                                        const feedLabel = isBlendEnabled 
                                          ? `${feedTypeSelected} / ${blendFeedTypeSelected} Blend (${blendRatio}:${100 - blendRatio})`
                                          : feedTypeSelected;
                                        
                                        onAddFeedLog(
                                          batch.id, 
                                          feedQtyVal, 
                                          calculatedCost, 
                                          feedFeeder, 
                                          feedDate, 
                                          feedLabel, 
                                          feedFormulaName, 
                                          batch.currentStageId || "grower"
                                        );
                                      }}
                                      className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                                    >
                                      ✓ Save Daily Feed Record
                                    </button>
                                  </div>
                                </div>

                                {/* Weight checking and Stock Procurement Card */}
                                <div className="lg:col-span-5 space-y-4">
                                  {/* Weight Sampling Card */}
                                  <div className="bg-white p-4.5 rounded-xl border border-amber-200 flex flex-col justify-between">
                                    <div>
                                      <div className="flex justify-between items-center pb-2 border-b mb-3">
                                        <span className="font-extrabold text-[10px] uppercase text-amber-950 tracking-wider flex items-center gap-1 font-sans">⚖️ Record Body Weight Sample</span>
                                        <span className="text-[8.5px] text-amber-800 bg-amber-50 px-2 rounded font-mono font-bold uppercase">UPDATES FCR</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="flex flex-col gap-1">
                                          <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Sampling Date</span>
                                          <input type="date" value={weightDate} onChange={e => setWeightDate(e.target.value)} required className="border p-2 bg-slate-50 rounded-lg text-xs" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Avg Weight (Grams)</span>
                                          <input type="number" value={weightValueG} onChange={e => setWeightValueG(Math.max(1, Number(e.target.value)))} required className="border p-2 bg-white rounded-lg text-xs font-mono font-bold" />
                                        </div>
                                        <div className="flex flex-col gap-1 col-span-2">
                                          <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Sampling Remarks</span>
                                          <input type="text" value={weightRemarks} onChange={e => setWeightRemarks(e.target.value)} placeholder="Healthy flock, uniform breast muscle check." className="border p-2 bg-white rounded-lg text-xs font-medium" />
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onUpdatePoultryBatch) {
                                          const newSample = { date: weightDate, averageWeightG: weightValueG, remarks: weightRemarks };
                                          const prevSamples = batch.weightSamples || [];
                                          onUpdatePoultryBatch({
                                            ...batch,
                                            weightSamples: [...prevSamples, newSample]
                                          });
                                        }
                                        setWeightRemarks("Checking uniform growth in cohort");
                                      }}
                                      className="w-full text-center py-2 bg-transparent text-amber-800 hover:bg-amber-100 border border-amber-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer mt-4"
                                    >
                                      ✓ Save Weight Sample
                                    </button>
                                  </div>

                                  {/* Feed reserves allocation */}
                                  <div className="bg-white p-4.5 rounded-xl border border-amber-200">
                                    <div className="flex justify-between items-center pb-2 border-b">
                                      <span className="font-extrabold text-[10px] uppercase text-amber-950 tracking-wider flex items-center gap-1 font-sans">🚚 ALLOCATE FEED PURCHASE RESERVES</span>
                                      <span className="text-[10px] text-green-700 bg-green-50 px-2 rounded font-mono font-bold">STOCKING</span>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-2 text-xs">
                                      <span className="font-medium text-slate-500 leading-relaxed text-[11px] block">
                                        Procure or reallocate bags of feed to this batch's feed-bin coordinates to clear inventory alerts.
                                      </span>
                                      <div className="flex gap-2 items-center mt-1.5">
                                        <input type="number" value={allocFeedStock} onChange={e => setAllocFeedStock(Math.max(50, Number(e.target.value)))} className="border p-2.5 bg-white rounded-xl text-xs font-mono font-bold w-1/2 text-slate-700" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (onUpdatePoultryBatch) {
                                              const currentAlloc = batch.feedStockAllocated ?? 1000;
                                              onUpdatePoultryBatch({
                                                ...batch,
                                                feedStockAllocated: currentAlloc + allocFeedStock
                                              });
                                            }
                                          }}
                                          className="flex-1 text-center py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                        >
                                          + Allocate Stock (Kg)
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* DISTRIBUTIONS HISTORY GRID */}
                              <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs space-y-3.5">
                                <span className="font-extrabold text-[10px] uppercase text-slate-800 tracking-wider block font-sans">🗂️ Historic Feed Distribution Records</span>
                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[8.5px] tracking-wider">
                                        <th className="p-3">Fed Date</th>
                                        <th className="p-3">Feed Formulation / Types</th>
                                        <th className="p-3">Formula Used</th>
                                        <th className="p-3 text-right">Quantity Consumed</th>
                                        <th className="p-3 text-right">Incurred Cost</th>
                                        <th className="p-3">Fed By / Officer</th>
                                        <th className="p-3 text-center">Batch Stage</th>
                                        <th className="p-3 text-center">Intake status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-150 font-medium font-sans">
                                      {batch.feedLogs && batch.feedLogs.length > 0 ? (
                                        [...batch.feedLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((l, idx) => {
                                          const isBelowExpected = l.quantityKg < expectedDailyIntakeKg * 0.8;
                                          return (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                              <td className="p-3 font-semibold text-slate-700">{l.date}</td>
                                              <td className="p-3 font-bold text-amber-900">{l.feedType}</td>
                                              <td className="p-3 text-slate-500 text-[11px] italic font-medium">{l.formulaUsed || "Standard formulation ratio"}</td>
                                              <td className="p-3 font-mono text-right font-extrabold text-slate-800">{l.quantityKg} kg</td>
                                              <td className="p-3 font-mono text-right font-black text-emerald-800">{currencySymbol} {l.cost.toLocaleString()}</td>
                                              <td className="p-3 text-indigo-955 font-bold">{l.fedBy}</td>
                                              <td className="p-3 text-center"><span className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 rounded">{l.stageId || "Grower"}</span></td>
                                              <td className="p-3 text-center">
                                                {isBelowExpected ? (
                                                  <span className="inline-block bg-red-50 text-red-700 text-[8.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-full border border-red-200">🚨 UNDERFED</span>
                                                ) : (
                                                  <span className="inline-block bg-green-50 text-green-700 text-[8.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-full border border-green-200">✓ OPTIMAL</span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      ) : (
                                        <tr>
                                          <td colSpan={8} className="p-6 text-center italic text-slate-400 bg-slate-50/30">
                                            No feed events recorded for this flock. Record using form above.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {activeActionTab[batch.id] === "layer_eggs" && batch.status !== "CLOSED" && (
                      <div className="bg-amber-50/50 p-5 border rounded-2xl border-amber-300 space-y-5 animate-slide-up text-slate-850">
                        {/* Title & Header */}
                        <div className="flex justify-between items-center border-b border-amber-200 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🥚</span>
                            <div>
                              <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider block font-mono">Layers &amp; Egg Production Dashboard</span>
                              <h5 className="text-sm font-black text-slate-800">Egg Yields, Tray Log &amp; Accounts Ledger Sync</h5>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionTab(prev => ({ ...prev, [batch.id]: "none" }));
                            }}
                            className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                          >
                            Close ✕
                          </button>
                        </div>

                        {/* Calculation and processing variables */}
                        {(() => {
                          const cols = batch.eggCollections || [];
                          const sales = batch.eggSales || [];

                          // Sort collections for calculations
                          const sortedCols = [...cols].sort((a,b) => a.date.localeCompare(b.date));

                          // Total accumulated collections
                          const totalCollectedEggs = cols.reduce((sum, c) => sum + c.totalCollected, 0);
                          const totalTraysCollected = cols.reduce((sum, c) => sum + (c.traysCollected ?? Math.ceil(c.totalCollected / 30)), 0);

                          // Total sales calculations
                          const totalEggsSold = sales.reduce((sum, s) => {
                            if (s.sellUnit === 'egg') return sum + s.quantity;
                            if (s.sellUnit === 'dozen') return sum + (s.quantity * 12);
                            return sum + (s.quantity * 30); // tray
                          }, 0);
                          
                          const totalTraysSold = sales.reduce((sum, s) => {
                            if (s.traysSold) return sum + s.traysSold;
                            if (s.sellUnit === 'tray') return sum + s.quantity;
                            if (s.sellUnit === 'dozen') return sum + (s.quantity * 12 / 30);
                            return sum + (s.quantity / 30);
                          }, 0);

                          const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);

                          // Inventory remaining
                          const inventoryEggsLeft = Math.max(0, totalCollectedEggs - totalEggsSold);
                          const inventoryTraysLeft = Math.max(0, totalTraysCollected - totalTraysSold);

                          // Estimate Inventory Value (average price per egg sold, otherwise fallback to ZK 2.5)
                          const avgValuePerEgg = sales.length > 0 ? (totalRevenue / totalEggsSold) : 2.5;
                          const estimatedInventoryValue = inventoryEggsLeft * avgValuePerEgg;

                          // Feed cost per dozen eggs tracking
                          // Overall feed cost
                          const totalFeedCost = batch.feedLogs ? batch.feedLogs.reduce((sum, f) => sum + f.cost, 0) : 0;
                          const totalEggsDozens = totalCollectedEggs / 12;
                          const overallFeedCostPerDozen = totalEggsDozens > 0 ? (totalFeedCost / totalEggsDozens) : 0;

                          // HDEP calculations & Peak HDEP
                          const latestCol = sortedCols[sortedCols.length - 1];
                          const currentHDEP = (latestCol && batch.currentCount > 0) ? ((latestCol.totalCollected / batch.currentCount) * 100) : 0;
                          
                          let peakHDEP = 0;
                          sortedCols.forEach(col => {
                            const val = batch.currentCount > 0 ? ((col.totalCollected / batch.currentCount) * 100) : 0;
                            if (val > peakHDEP) peakHDEP = val;
                          });

                          // Alerts & Week-on-Week calculation:
                          // Compare last 7 days (Week 1) against preceding 7 days (Week 2)
                          const todaySec = Date.now();
                          const oneDayMs = 24 * 3600 * 1000;
                          const last7Cols = cols.filter(c => {
                            const diff = (todaySec - new Date(c.date).getTime()) / oneDayMs;
                            return diff >= 0 && diff <= 7;
                          });
                          const prior7Cols = cols.filter(c => {
                            const diff = (todaySec - new Date(c.date).getTime()) / oneDayMs;
                            return diff > 7 && diff <= 14;
                          });

                          const week1AvgHDEP = last7Cols.length > 0 
                            ? (last7Cols.reduce((sum, c) => sum + c.totalCollected, 0) / last7Cols.length) / batch.currentCount * 100 
                            : currentHDEP;
                          
                          const week2AvgHDEP = prior7Cols.length > 0
                            ? (prior7Cols.reduce((sum, c) => sum + c.totalCollected, 0) / prior7Cols.length) / batch.currentCount * 100
                            : 0;

                          const wowChange = week2AvgHDEP > 0 ? (((week1AvgHDEP - week2AvgHDEP) / week2AvgHDEP) * 100) : 0;
                          const wowDropAlert = week2AvgHDEP > 0 && (week2AvgHDEP - week1AvgHDEP) >= 5; // absolute drop of 5% or more

                          // Recharts Data Mapping
                          const chartData = sortedCols.map((col, idx) => {
                            const hdepVal = batch.currentCount > 0 ? ((col.totalCollected / batch.currentCount) * 100) : 0;
                            
                            // 7-day moving average calculated mathematically
                            const colDateMs = new Date(col.date).getTime();
                            const past7DaysCol = sortedCols.filter(c => {
                              const diffDays = (colDateMs - new Date(c.date).getTime()) / oneDayMs;
                              return diffDays >= 0 && diffDays < 7;
                            });
                            const sma7 = past7DaysCol.length > 0
                              ? past7DaysCol.reduce((sum, c) => sum + c.totalCollected, 0) / past7DaysCol.length
                              : col.totalCollected;

                            return {
                              date: col.date,
                              "HDEP (%)": Number(hdepVal.toFixed(1)),
                              "7-Day Moving Avg (Eggs)": Number(sma7.toFixed(1)),
                              "Total Collected": col.totalCollected
                            };
                          });

                          // Aggregate grading over the last 7 days for the dynamic quality compliance report
                          const last7DaysOfCollections = cols.filter(c => {
                            const diff = (todaySec - new Date(c.date).getTime()) / oneDayMs;
                            return diff >= 0 && diff <= 7;
                          });
                          const total7Col = last7DaysOfCollections.reduce((sum, c) => sum + c.totalCollected, 0);
                          const total7GradeA = last7DaysOfCollections.reduce((sum, c) => sum + c.gradeA, 0);
                          const total7GradeB = last7DaysOfCollections.reduce((sum, c) => sum + c.gradeB, 0);
                          const total7Broken = last7DaysOfCollections.reduce((sum, c) => sum + c.broken, 0);
                          const total7Dirty = last7DaysOfCollections.reduce((sum, c) => sum + c.dirty, 0);
                          const total7Hatching = last7DaysOfCollections.reduce((sum, c) => sum + (c.hatching ?? 0), 0);

                          const p7GradeA = total7Col > 0 ? ((total7GradeA / total7Col) * 100) : 75;
                          const p7GradeB = total7Col > 0 ? ((total7GradeB / total7Col) * 100) : 15;
                          const p7Broken = total7Col > 0 ? ((total7Broken / total7Col) * 100) : 3;
                          const p7Dirty = total7Col > 0 ? ((total7Dirty / total7Col) * 100) : 4;
                          const p7Hatching = total7Col > 0 ? ((total7Hatching / total7Col) * 100) : 3;

                          // Weekly feed cost per dozen eggs tracking table datasets
                          // Group eggs and feed cost by date-based weeks
                          const weeksMap: Record<string, { feedCost: number, eggCount: number }> = {};
                          
                          // Sum feeding costs per week
                          if (batch.feedLogs) {
                            batch.feedLogs.forEach(f => {
                              const d = new Date(f.date || new Date());
                              // Get start of week date or group by a general week range
                              const weekId = "Week " + Math.ceil(d.getDate() / 7) + " (" + d.toLocaleString('en-US', { month: 'short' }) + ")";
                              if (!weeksMap[weekId]) weeksMap[weekId] = { feedCost: 0, eggCount: 0 };
                              weeksMap[weekId].feedCost += f.cost;
                            });
                          }
                          // Sum eggs collected per week
                          cols.forEach(c => {
                            const d = new Date(c.date);
                            const weekId = "Week " + Math.ceil(d.getDate() / 7) + " (" + d.toLocaleString('en-US', { month: 'short' }) + ")";
                            if (!weeksMap[weekId]) weeksMap[weekId] = { feedCost: 0, eggCount: 0 };
                            weeksMap[weekId].eggCount += c.totalCollected;
                          });

                          const weeklyFeedReport = Object.keys(weeksMap).map(wk => {
                            const data = weeksMap[wk];
                            const dozens = data.eggCount / 12;
                            const fcpDozen = dozens > 0 ? (data.feedCost / dozens) : 0;
                            return {
                              week: wk,
                              feedCost: data.feedCost,
                              eggsCollected: data.eggCount,
                              dozens: dozens,
                              costPerDozen: fcpDozen
                            };
                          });

                          // Crate / Tray Tracking per Customer
                          const customerTrayTracking: Record<string, { collected: number, sold: number }> = {
                            "Total Store Inventory": { collected: totalTraysCollected, sold: totalTraysSold }
                          };
                          sales.forEach(s => {
                            const cust = s.customerName || "Walk-in Clients";
                            if (!customerTrayTracking[cust]) customerTrayTracking[cust] = { collected: 0, sold: 0 };
                            const soldTrays = s.traysSold || (s.sellUnit === 'tray' ? s.quantity : s.sellUnit === 'dozen' ? s.quantity * 12 / 30 : s.quantity / 30);
                            customerTrayTracking[cust].sold += soldTrays;
                          });

                          // Handles egg sales submit
                          const handleRecordEggSaleLocal = (e: React.FormEvent) => {
                            e.preventDefault();
                            if (!layerSaleCustomer) {
                              alert("Please select or enter customer name!");
                              return;
                            }
                            let calculatedTotalEggs = layerSaleQty;
                            if (layerSaleUnit === 'dozen') calculatedTotalEggs = layerSaleQty * 12;
                            if (layerSaleUnit === 'tray') calculatedTotalEggs = layerSaleQty * 30;

                            const calculatedTrays = layerSaleUnit === 'tray' ? layerSaleQty : (calculatedTotalEggs / 30);
                            const calcRevenue = layerSaleQty * layerSalePrice;

                            const newSale: EggSale = {
                              id: "egg-sale-" + Date.now(),
                              date: layerSaleDate,
                              customerName: layerSaleCustomer,
                              sellUnit: layerSaleUnit,
                              quantity: layerSaleQty,
                              pricePerUnit: layerSalePrice,
                              totalEggs: calculatedTotalEggs,
                              totalRevenue: calcRevenue,
                              traysSold: calculatedTrays
                            };

                            const prevSales = batch.eggSales || [];
                            if (onUpdatePoultryBatch) {
                              onUpdatePoultryBatch({
                                ...batch,
                                eggSales: [...prevSales, newSale]
                              });
                            }

                            // Alert visual confirmation
                            alert(`Egg Sales Logged Successfully! ${calcRevenue.toLocaleString()} ${currencySymbol} has been recorded and posted automatically to FarmFlow double-entry Accounts Ledger (1010 Bank & 4200 Poultry Revenue).`);
                            
                            // Reset state
                            setLayerSaleCustomer("");
                            setLayerSaleQty(10);
                          };

                          // Handles daily collection submit
                          const handleRecordDailyEggCollectionLocal = (e: React.FormEvent) => {
                            e.preventDefault();
                            const sumGrade = layerGradeA + layerGradeB + layerBroken + layerDirty + layerHatching;
                            
                            const newCol: EggCollection = {
                              date: layerEggDate,
                              totalCollected: sumGrade, // total collected sum of sub-grades
                              gradeA: layerGradeA,
                              gradeB: layerGradeB,
                              broken: layerBroken,
                              dirty: layerDirty,
                              hatching: layerHatching,
                              traysCollected: layerTraysCollected
                            };

                            const prevCols = batch.eggCollections || [];
                            // Ensure there is only one entry per date (update if exists, otherwise append)
                            let updatedCols = [];
                            const existIndex = prevCols.findIndex(col => col.date === layerEggDate);
                            if (existIndex >= 0) {
                              updatedCols = [...prevCols];
                              updatedCols[existIndex] = newCol;
                            } else {
                              updatedCols = [...prevCols, newCol];
                            }

                            if (onUpdatePoultryBatch) {
                              onUpdatePoultryBatch({
                                ...batch,
                                eggCollections: updatedCols
                              });
                            }

                            alert(`Successfully recorded egg collection for ${layerEggDate}! Logged ${sumGrade} total eggs (${layerTraysCollected} trays). HDEP recalculated.`);
                          };

                          return (
                            <div className="space-y-6">
                              {/* Urgent Alerter when drops occur */}
                              {wowDropAlert && (
                                <div className="bg-red-50 border-2 border-red-400 p-4 rounded-xl flex items-start gap-3 text-red-955 animate-pulse text-xs">
                                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                                  <div>
                                    <h6 className="font-extrabold uppercase tracking-wide text-red-800 text-[11px]">⚠️ Critical Production Loss Warning (&gt; 5% Week-on-Week Drop)</h6>
                                    <p className="mt-1 leading-relaxed font-semibold">
                                      Egg production HDEP has dropped significantly week-on-week! Comparative analysis reveals average HDEP dropping to <strong className="text-red-700">{week1AvgHDEP.toFixed(1)}%</strong> recently, compared to <strong className="text-red-700">{week2AvgHDEP.toFixed(1)}%</strong> in the prior period (an absolute drop of <strong className="text-red-700">{(week2AvgHDEP - week1AvgHDEP).toFixed(1)}%</strong>). Inspect flock for clinical symptoms of <em>disease or nutritional deficiency</em>, check feed calcium/mash balance, water availability, or temperature distress immediately!
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Key Metrics Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-3xs text-left">
                                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wide">Current HDEP</span>
                                  <span className="text-base font-black text-slate-800">{currentHDEP.toFixed(1)}%</span>
                                  <span className="text-[9px] font-mono text-slate-500 block mt-0.5">Hen Day Egg Production</span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-3xs text-left">
                                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wide">Peak HDEP Target</span>
                                  <span className="text-base font-black text-amber-600 font-bold">★ {peakHDEP.toFixed(1)}%</span>
                                  <span className="text-[9px] text-slate-500 block mt-0.5 font-semibold">Highest HDEP logged</span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-3xs text-left">
                                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wide">Accumulated Eggs</span>
                                  <span className="text-base font-black text-indigo-700">{(totalCollectedEggs).toLocaleString()}</span>
                                  <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{totalTraysCollected} trays collected</span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-3xs text-left">
                                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wide">Egg Shell Inventory</span>
                                  <span className="text-base font-black text-emerald-700">{(inventoryEggsLeft).toLocaleString()}</span>
                                  <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{inventoryTraysLeft.toFixed(1)} trays stock</span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-3xs text-left">
                                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wide">Estimated Value</span>
                                  <span className="text-base font-black text-rose-700">{currencySymbol} {Math.round(estimatedInventoryValue).toLocaleString()}</span>
                                  <span className="text-[9px] text-slate-500 block mt-0.5 font-bold font-sans">At avg {avgValuePerEgg.toFixed(2)}/egg</span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-3xs text-left">
                                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wide">Feed Cost / Dozen</span>
                                  <span className="text-base font-black text-amber-700">{currencySymbol} {overallFeedCostPerDozen.toFixed(2)}</span>
                                  <span className="text-[9px] text-slate-500 block mt-0.5 font-sans">Overall active yield</span>
                                </div>
                              </div>

                              {/* TWO FORM COLUMNS */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* 1. LOG NEW DAILY COLLECTION */}
                                <div className="bg-white p-5 rounded-xl border border-amber-200 space-y-4">
                                  <div className="border-b pb-2 text-left">
                                    <h6 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                      📥 Daily Collection &amp; Trays Log
                                    </h6>
                                    <p className="text-[9.5px] text-slate-400 mt-0.5">Records physical collections and updates tray inventory</p>
                                  </div>
                                  
                                  <form onSubmit={handleRecordDailyEggCollectionLocal} className="space-y-3.5 text-xs text-slate-800 text-left font-sans">
                                    <div className="grid grid-cols-2 gap-3 font-sans">
                                      <div>
                                        <label className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 font-sans">Collection Date</label>
                                        <input
                                          type="date"
                                          value={layerEggDate}
                                          onChange={e => setLayerEggDate(e.target.value)}
                                          required
                                          className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-slate-800"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 font-sans">Trays Collected (crates)</label>
                                        <input
                                          type="number"
                                          value={layerTraysCollected}
                                          onChange={e => setLayerTraysCollected(Number(e.target.value))}
                                          required
                                          min={0}
                                          className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-slate-800 text-xs font-sans"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pb-2">
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5 font-sans">Grade A (Normal)</label>
                                        <input
                                          type="number"
                                          value={layerGradeA}
                                          onChange={e => {
                                            const val = Math.max(0, Number(e.target.value));
                                            setLayerGradeA(val);
                                            // auto compute trays
                                            const total = val + layerGradeB + layerBroken + layerDirty + layerHatching;
                                            setLayerTraysCollected(Math.ceil(total / 30));
                                          }}
                                          min={0}
                                          required
                                          className="w-full border p-1.5 rounded-lg font-mono text-center"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5 font-sans">Grade B (Small/Odd)</label>
                                        <input
                                          type="number"
                                          value={layerGradeB}
                                          onChange={e => {
                                            const val = Math.max(0, Number(e.target.value));
                                            setLayerGradeB(val);
                                            const total = layerGradeA + val + layerBroken + layerDirty + layerHatching;
                                            setLayerTraysCollected(Math.ceil(total / 30));
                                          }}
                                          min={0}
                                          required
                                          className="w-full border p-1.5 rounded-lg font-mono text-center"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5 font-sans">Broken / Cracked</label>
                                        <input
                                          type="number"
                                          value={layerBroken}
                                          onChange={e => {
                                            const val = Math.max(0, Number(e.target.value));
                                            setLayerBroken(val);
                                            const total = layerGradeA + layerGradeB + val + layerDirty + layerHatching;
                                            setLayerTraysCollected(Math.ceil(total / 30));
                                          }}
                                          min={0}
                                          required
                                          className="w-full border p-1.5 rounded-lg font-mono text-center text-red-600"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5 font-sans">Soiled / Dirty</label>
                                        <input
                                          type="number"
                                          value={layerDirty}
                                          onChange={e => {
                                            const val = Math.max(0, Number(e.target.value));
                                            setLayerDirty(val);
                                            const total = layerGradeA + layerGradeB + layerBroken + val + layerHatching;
                                            setLayerTraysCollected(Math.ceil(total / 30));
                                          }}
                                          min={0}
                                          required
                                          className="w-full border p-2 rounded-lg font-mono text-center"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5 font-sans">Hatching Eggs (Set-aside)</label>
                                        <input
                                          type="number"
                                          value={layerHatching}
                                          onChange={e => {
                                            const val = Math.max(0, Number(e.target.value));
                                            setLayerHatching(val);
                                            const total = layerGradeA + layerGradeB + layerBroken + layerDirty + val;
                                            setLayerTraysCollected(Math.ceil(total / 30));
                                          }}
                                          min={0}
                                          required
                                          className="w-full border p-2 rounded-lg font-mono text-center text-indigo-700"
                                        />
                                      </div>
                                    </div>

                                    <div className="p-3 bg-amber-50 rounded-lg text-[10.5px] font-medium border border-amber-200">
                                      👉 <strong>Auto Calculation Summary</strong>: This entry logs exactly <strong>{layerGradeA + layerGradeB + layerBroken + layerDirty + layerHatching} eggs</strong>. Hen Day Production (HDEP) for this day is calculated at: <strong className="text-amber-700">{(((layerGradeA + layerGradeB + layerBroken + layerDirty + layerHatching) / batch.currentCount) * 105) % 100}%</strong> base rate on {batch.currentCount} active layers in shed.
                                    </div>

                                    <button
                                      type="submit"
                                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                                    >
                                      ✓ Record Egg Collection File
                                    </button>
                                  </form>
                                </div>

                                {/* 2. RECORD EGG SALES */}
                                <div className="bg-white p-5 rounded-xl border border-amber-200 space-y-4">
                                  <div className="border-b pb-2 text-left">
                                    <h6 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                      💸 Log Eggs Sales Dispatch &amp; Revenue
                                    </h6>
                                    <p className="text-[9.5px] text-slate-400 mt-0.5">Spars the revenue posted to General Ledger accounts (1010/4200)</p>
                                  </div>

                                  <form onSubmit={handleRecordEggSaleLocal} className="space-y-4 text-xs text-slate-800 text-left">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Sales date</label>
                                        <input
                                          type="date"
                                          value={layerSaleDate}
                                          onChange={e => setLayerSaleDate(e.target.value)}
                                          required
                                          className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-slate-850"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Customer / Off-taker</label>
                                        <div className="flex gap-1">
                                          <select
                                            value={layerSaleCustomer}
                                            onChange={e => setLayerSaleCustomer(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-202 p-2 rounded-lg font-bold text-xs"
                                          >
                                            <option value="">-- Choose Off-taker --</option>
                                            {customers && customers.map((c, i) => (
                                              <option key={i} value={c.name}>{c.name}</option>
                                            ))}
                                            <option value="Walk-in Client">Walk-in Cash Client</option>
                                            <option value="Lusaka Central Market">Lusaka Central Market</option>
                                            <option value="Copperbelt Distributors Ltd">Copperbelt Distributors Ltd</option>
                                            <option value="Kalingalinga Spouts">Kalingalinga Spouts</option>
                                          </select>
                                          <input
                                            type="text"
                                            placeholder="or custom text..."
                                            value={layerSaleCustomer}
                                            onChange={e => setLayerSaleCustomer(e.target.value)}
                                            className="w-1/2 border p-2 rounded-lg bg-white font-bold"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5">Billing Unit</label>
                                        <select
                                          value={layerSaleUnit}
                                          onChange={e => {
                                            const unit = e.target.value as any;
                                            setLayerSaleUnit(unit);
                                            // recalculate trays
                                            let calcEggs = layerSaleQty;
                                            if (unit === 'dozen') calcEggs = layerSaleQty * 12;
                                            if (unit === 'tray') calcEggs = layerSaleQty * 30;
                                            setLayerSaleTrays(calcEggs / 30);
                                          }}
                                          className="w-full border p-2 rounded-lg bg-white font-bold text-xs"
                                        >
                                          <option value="tray">Trays (30 Eggs)</option>
                                          <option value="dozen">Dozens (12 Eggs)</option>
                                          <option value="egg">Single Egg</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 font-sans">Quantity Sold</label>
                                        <input
                                          type="number"
                                          value={layerSaleQty}
                                          onChange={e => {
                                            const qty = Math.max(1, Number(e.target.value));
                                            setLayerSaleQty(qty);
                                            // auto set trays based on sell unit
                                            if (layerSaleUnit === 'tray') setLayerSaleTrays(qty);
                                            else if (layerSaleUnit === 'dozen') setLayerSaleTrays((qty * 12) / 30);
                                            else setLayerSaleTrays(qty / 30);
                                          }}
                                          min={1}
                                          required
                                          className="w-full border p-2 rounded-lg text-center font-bold text-xs font-mono"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5">Unit Price ({currencySymbol})</label>
                                        <input
                                          type="number"
                                          value={layerSalePrice}
                                          onChange={e => setLayerSalePrice(Math.max(0, Number(e.target.value)))}
                                          required
                                          className="w-full border p-2 rounded-lg text-center font-bold font-mono text-xs"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Trays Sold (Crates count)</label>
                                        <input
                                          type="number"
                                          value={layerSaleTrays}
                                          onChange={e => setLayerSaleTrays(Number(e.target.value))}
                                          required
                                          className="w-full border p-2 rounded-lg font-bold"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5 font-sans">Overall Total Eggs</label>
                                        <div className="w-full p-2 bg-slate-100 rounded-lg text-center font-bold font-mono text-slate-650">
                                          {layerSaleUnit === 'tray' ? layerSaleQty * 30 : layerSaleUnit === 'dozen' ? layerSaleQty * 12 : layerSaleQty} Eggs
                                        </div>
                                      </div>
                                    </div>

                                    <div className="p-3 bg-emerald-50 rounded-lg text-[10.5px] border border-emerald-200 font-sans">
                                      💵 Total Sales Revenue: <strong className="text-emerald-700">{currencySymbol} {(layerSaleQty * layerSalePrice).toLocaleString()}</strong>.
                                      <br />
                                      This sum will be posted directly to <strong>Dr Bank (1010)</strong> and <strong>Cr Poultry Revenue (4200)</strong> automatically.
                                    </div>

                                    <button
                                      type="submit"
                                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                                    >
                                      ✓ Log Egg Sale &amp; Post Revenue Ledger
                                    </button>
                                  </form>
                                </div>
                              </div>

                              {/* HDEP CHART AND WEEKLY GRADING/QUALITY REPORT */}
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-sans">
                                {/* Recharts HDEP Chart */}
                                <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-amber-200 space-y-3">
                                  <div className="flex justify-between items-center border-b pb-2 text-left">
                                    <h6 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider font-sans">
                                      📈 Hen Day Egg Production (HDEP) &amp; 7-Day Moving Avg Trend
                                    </h6>
                                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-lg font-mono">
                                      Peak HDEP marked as marker
                                    </span>
                                  </div>

                                  {chartData.length === 0 ? (
                                    <div className="h-64 flex flex-col justify-center items-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-205">
                                      <Egg className="w-8 h-8 text-slate-350 animate-bounce mb-1" />
                                      No egg collections recorded yet. Log daily collection to populate trend indicators.
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="h-60 w-full overflow-hidden text-xs">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="date" stroke="#64748b" tickStyle={{ fontSize: 9 }} />
                                            <YAxis stroke="#64748b" domain={[0, 100]} tickStyle={{ fontSize: 9 }} />
                                            <Tooltip />
                                            <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 9 }} />
                                            <Line type="monotone" dataKey="HDEP (%)" stroke="#d97706" strokeWidth={2.5} activeDot={{ r: 5 }} name="HDEP (%)" />
                                            <Line type="monotone" dataKey="7-Day Moving Avg (Eggs)" stroke="#4f46e5" strokeWidth={2} strokeDasharray="4 4" name="7-Day Moving Avg (Eggs)" />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      </div>
                                      <div className="p-2.5 bg-amber-50 rounded-lg text-[9.5px] leading-relaxed text-slate-500 font-medium font-sans flex items-center gap-1.5 mt-1 font-sans">
                                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span>
                                          <strong>Peak production</strong> is marked with a gold star badge of <strong>{peakHDEP.toFixed(1)}% HDEP</strong>. Standard layers target is between 80% to 92% production at peak cycle.
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Weekly Quality Grading Compliance Report */}
                                <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-amber-200 space-y-4 text-left font-sans">
                                  <div className="border-b pb-2 text-left">
                                    <h6 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider font-sans">
                                      📋 Weekly Egg Quality &amp; Grading Report
                                    </h6>
                                    <p className="text-[9.5px] text-slate-400 mt-0.5">Aggregated feedback based on physical checks (7-day window)</p>
                                  </div>

                                  {last7DaysOfCollections.length === 0 ? (
                                    <div className="p-5 text-center text-[10px] text-slate-400 bg-slate-50 rounded-lg border">
                                      No collections logged in the past 7 days to compile grading quality telemetry. Showing mock standards:
                                      <div className="space-y-1.5 mt-2.5 text-left font-sans font-medium text-[9.5px]">
                                        <div className="flex justify-between"><span>Grade A Premium:</span> <span>85%</span></div>
                                        <div className="flex justify-between"><span>Grade B Quality:</span> <span>10%</span></div>
                                        <div className="flex justify-between text-yellow-600 font-bold"><span>Soiled/Dirty:</span> <span>3%</span></div>
                                        <div className="flex justify-between text-red-500 font-bold"><span>Broken Loss rate:</span> <span>2%</span></div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-3.5 text-xs font-medium">
                                      <div className="bg-slate-50 p-2.5 rounded-lg border font-mono text-[10px] leading-relaxed font-bold text-left">
                                        ⏱ Date Scope: last 7 collection days
                                        <br />
                                        🥚 Volume Checked: <strong className="text-slate-800">{total7Col} checked</strong>
                                      </div>

                                      <div className="space-y-2">
                                        <div>
                                          <div className="flex justify-between text-[10px] text-slate-500 font-semibold font-sans">
                                            <span>Grade A (Premium Ratio)</span>
                                            <span className="font-extrabold text-slate-700">{p7GradeA.toFixed(1)}%</span>
                                          </div>
                                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, p7GradeA)}%` }} />
                                          </div>
                                        </div>

                                        <div>
                                          <div className="flex justify-between text-[10px] text-slate-500 font-semibold font-sans">
                                            <span>Grade B (Secundary/Small)</span>
                                            <span className="font-extrabold text-slate-700">{p7GradeB.toFixed(1)}%</span>
                                          </div>
                                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, p7GradeB)}%` }} />
                                          </div>
                                        </div>

                                        <div>
                                          <div className="flex justify-between text-[10px] text-red-500 font-semibold font-sans">
                                            <span>Broken &amp; Cracked (Loss)</span>
                                            <span className="font-extrabold text-red-700">{p7Broken.toFixed(1)}%</span>
                                          </div>
                                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                            <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, p7Broken)}%` }} />
                                          </div>
                                        </div>

                                        <div>
                                          <div className="flex justify-between text-[10px] text-slate-500 font-semibold font-sans">
                                            <span>Soiled &amp; Dirty (Cleanliness)</span>
                                            <span className="font-extrabold text-slate-700">{p7Dirty.toFixed(1)}%</span>
                                          </div>
                                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                            <div className="bg-amber-700 h-1.5 rounded-full" style={{ width: `${Math.min(100, p7Dirty)}%` }} />
                                          </div>
                                        </div>

                                        <div>
                                          <div className="flex justify-between text-[10px] text-slate-500 font-semibold font-sans">
                                            <span>Hatching Reserves</span>
                                            <span className="font-extrabold text-slate-700">{p7Hatching.toFixed(1)}%</span>
                                          </div>
                                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, p7Hatching)}%` }} />
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-slate-50 border p-2.5 rounded-lg text-[10.5px] leading-relaxed text-slate-655 text-justify font-sans">
                                        💡 <strong>Shell Thickness Insight</strong>: 
                                        {p7Broken > 5 
                                          ? " High broken/cracked ratio (> 5%) detected! Recommend boosting limestone grit particles to 4g/bird daily to strengthen laying biological shells." 
                                          : " Damage rates are under control (below 5%). Continuous calcium limestone feeding is optimal in standard layers mash limits."}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* WEEKLY FEED TRACKER TABLE & CRATE TRACE BY CUSTOMER */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs text-slate-800 font-medium font-sans">
                                {/* Weekly Feed Cost per Dozen Eggs */}
                                <div className="bg-white p-5 rounded-xl border border-amber-200 space-y-3 text-left">
                                  <div className="border-b pb-2 text-left font-sans">
                                    <h6 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider font-sans">
                                      🌾 Weekly Feed-Cost-Per-Dozen Eggs Efficiency
                                    </h6>
                                    <p className="text-[9.5px] text-slate-400 mt-0.5">Tracks how much feed expenditures went to produce a dozens scale eggs</p>
                                  </div>

                                  {weeklyFeedReport.length === 0 ? (
                                    <div className="p-5 text-center text-slate-400 text-[10px] bg-slate-50 border rounded-lg font-sans">
                                      Assemble feeding logs and daily collections to map this efficiency weekly.
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto font-sans">
                                      <table className="w-full border-collapse text-left text-xs font-sans">
                                        <thead>
                                          <tr className="bg-slate-50 text-[9.5px] text-slate-400 uppercase font-black text-left border-y">
                                            <th className="p-2 font-sans">Period Name</th>
                                            <th className="p-2 font-sans">Feed Cost Logs</th>
                                            <th className="p-2 font-sans">Total Eggs</th>
                                            <th className="p-2 font-sans font-sans">Dozen Equivalent</th>
                                            <th className="p-2 font-sans text-right">Feed Cost / Dozen</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {weeklyFeedReport.map((row, idx) => (
                                            <tr key={idx} className="border-b font-medium text-[11px] font-sans">
                                              <td className="p-2 font-bold text-slate-750 font-sans">{row.week}</td>
                                              <td className="p-2 font-sans">{currencySymbol} {row.feedCost.toLocaleString()}</td>
                                              <td className="p-2 font-sans">{row.eggsCollected} eggs</td>
                                              <td className="p-2 font-sans">{row.dozens.toFixed(1)} Dz</td>
                                              <td className="p-2 text-right font-bold text-amber-700 font-mono font-sans">
                                                {currencySymbol} {row.costPerDozen > 0 ? row.costPerDozen.toFixed(2) : "0.00"}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                {/* Tray & Crate Tracking list */}
                                <div className="bg-white p-5 rounded-xl border border-amber-200 space-y-3 text-left">
                                  <div className="border-b pb-2 text-left font-sans">
                                    <h6 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider font-sans font-sans">
                                      📦 Crate / Tray Tracking Log per Customer
                                    </h6>
                                    <p className="text-[9.5px] text-slate-400 mt-0.5">Monitors trays collected vs trays delivered to individual off-takers</p>
                                  </div>

                                  <div className="overflow-x-auto text-xs font-sans">
                                    <table className="w-full border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 text-[9.5px] text-slate-400 uppercase font-black text-left border-y">
                                          <th className="p-2">Off-Taker / Customer Profile</th>
                                          <th className="p-2">Trays Collected (Est)</th>
                                          <th className="p-2">Trays Sold &amp; Dispatched</th>
                                          <th className="p-2 text-right">Outstanding Stock</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {Object.keys(customerTrayTracking).map((cust, idx) => {
                                          const row = customerTrayTracking[cust];
                                          const balance = Math.max(0, row.collected - row.sold);
                                          return (
                                            <tr key={idx} className="border-b font-medium text-[11px]">
                                              <td className="p-2 font-bold text-slate-700">
                                                {cust === "Total Store Inventory" ? "🏠 " : "👤 "}
                                                {cust}
                                              </td>
                                              <td className="p-2 font-bold text-indigo-700">{row.collected > 0 ? `${row.collected.toFixed(1)} Trays` : "-"}
                                              </td>
                                              <td className="p-2 text-emerald-650 font-bold">{row.sold > 0 ? `${row.sold.toFixed(1)} Trays` : "-"}</td>
                                              <td className="p-2 text-right font-extrabold text-slate-800">
                                                {cust === "Total Store Inventory" 
                                                  ? `${balance.toFixed(1)} Trays left` 
                                                  : `dispatched`}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>

                              {/* TRANSACTIONS RECONCILIATION LOG */}
                              <div className="bg-white p-5 rounded-xl border border-amber-200 space-y-3 font-sans text-left">
                                <div className="border-b pb-2 text-left font-sans">
                                  <h6 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                    📜 Recorded Egg Collections &amp; Sales History Log
                                  </h6>
                                  <p className="text-[9.5px] text-slate-400 mt-0.5">Spars historical daily registries for audit compliance</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px]">
                                  {/* Collections timeline */}
                                  <div>
                                    <h6 className="text-[10px] font-extrabold tracking-wider uppercase text-slate-450 block mb-2 font-sans font-bold">History of Daily Collections</h6>
                                    {cols.length === 0 ? (
                                      <p className="text-slate-400 font-semibold text-xs border border-dashed p-3 rounded-lg text-center bg-slate-50 font-sans">No collections logged yet.</p>
                                    ) : (
                                      <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-50 p-2.5 rounded-lg border font-mono">
                                        {[...cols].reverse().map((c, i) => (
                                          <div key={i} className="flex justify-between border-b py-1 font-semibold text-slate-700 font-sans">
                                            <span>📅 {c.date}</span>
                                            <span className="font-mono">🥚 {c.totalCollected} eggs ({c.traysCollected ?? Math.ceil(c.totalCollected / 30)} trays)</span>
                                            <span className="text-slate-400 font-sans">HDEP: {batch.currentCount > 0 ? (((c.totalCollected) / batch.currentCount) * 100).toFixed(1) : "0.0"}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Sales timeline */}
                                  <div>
                                    <h6 className="text-[10px] font-extrabold tracking-wider uppercase text-slate-455 block mb-2 font-sans font-bold">History of Sales Logs</h6>
                                    {sales.length === 0 ? (
                                      <p className="text-slate-400 font-semibold text-xs border border-dashed p-3 rounded-lg text-center bg-slate-50 font-sans">No sales logged yet.</p>
                                    ) : (
                                      <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-50 p-2.5 rounded-lg border font-sans">
                                        {[...sales].reverse().map((s, i) => (
                                          <div key={i} className="flex flex-col border-b py-1 text-slate-700">
                                            <div className="flex justify-between font-bold text-[11px] font-sans">
                                              <span>👤 {s.customerName}</span>
                                              <span className="text-emerald-700">+{currencySymbol} {s.totalRevenue.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-medium font-sans">
                                              <span>📅 {s.date} • {s.quantity} {s.sellUnit}s ({s.totalEggs} eggs)</span>
                                              <span>{s.traysSold?.toFixed(1)} trays</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {activeActionTab[batch.id] === "growth" && batch.status !== "CLOSED" && (
                      <div className="bg-purple-50/50 p-5 border rounded-2xl border-purple-300 space-y-5 animate-slide-up text-slate-850">
                        {/* Title and Close */}
                        <div className="flex justify-between items-center border-b border-purple-200 pb-2.5">
                          <div>
                            <span className="text-[9px] font-extrabold uppercase text-purple-850 tracking-wider block font-sans">Growth & Performance Diagnostics</span>
                            <h5 className="text-xs font-black uppercase text-purple-950 flex items-center gap-1.5 mt-0.5 font-sans">⚖️ GROWTH & WEIGHT MANAGEMENT MODULE</h5>
                          </div>
                          <button onClick={() => setActiveActionTab(prev => ({ ...prev, [batch.id]: "none" }))} className="text-slate-400 hover:text-slate-600 font-extrabold text-xs cursor-pointer">Close ×</button>
                        </div>

                        {/* Local weight calculations block */}
                        {(() => {
                           const ageDays = getBatchAgeDays(batch.arrivalDate);
                           const totalFeedKg = batch.feedLogs ? batch.feedLogs.reduce((sum, l) => sum + l.quantityKg, 0) : 0;
                           const initialAvgWeightKg = ["Broilers (Meat)"].includes(batch.birdType) ? 0.040 : 0.035;

                           // Compute latest sample details
                           const samples = batch.weightSamples || [];
                           const sortedSamples = [...samples].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                           const latestSample = sortedSamples.length > 0 ? sortedSamples[sortedSamples.length - 1] : null;

                           // Trajectory weights
                           let currentAvgWeightG = latestSample ? latestSample.averageWeightG : (getStandardWeightG(batch.birdType, ageDays));
                           let currentAvgWeightKg = currentAvgWeightG / 1000;

                           // Calculate FCR based on gained weight since placement
                           const weightGainedPerBirdKg = Math.max(0.001, currentAvgWeightKg - initialAvgWeightKg);
                           const totalWeightGainKg = weightGainedPerBirdKg * batch.currentCount;
                           const currentFcr = totalWeightGainKg > 0 ? (totalFeedKg / totalWeightGainKg) : 0;

                           // Project estimated market date and weight
                           let adgG = 0; // Average Daily Gain in grams
                           if (sortedSamples.length > 1) {
                             const firstS = sortedSamples[0];
                             const lastS = sortedSamples[sortedSamples.length - 1];
                             const daysDiff = Math.max(1, Math.round((new Date(lastS.date).getTime() - new Date(firstS.date).getTime()) / (1000 * 60 * 60 * 24)));
                             adgG = (lastS.averageWeightG - firstS.averageWeightG) / daysDiff;
                           } else if (sortedSamples.length === 1) {
                             const daysDiff = Math.max(1, Math.round((new Date(sortedSamples[0].date).getTime() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24)));
                             adgG = (sortedSamples[0].averageWeightG - (initialAvgWeightKg * 1000)) / daysDiff;
                           }

                           // Fallbacks if ADG is invalid or unrecorded
                           if (adgG <= 0) {
                             adgG = batch.birdType === "Broilers (Meat)" ? 55 : 12;
                           }

                           // Standard default target market weights
                           const targetMarketWeightG = batch.birdType === "Broilers (Meat)" ? 2500 : 1800;
                           const isStandardMet = currentAvgWeightG >= targetMarketWeightG;
                           const remainingG = Math.max(0, targetMarketWeightG - currentAvgWeightG);
                           const estDaysToTarget = adgG > 0 ? Math.ceil(remainingG / adgG) : 0;

                           const projectDate = new Date(latestSample ? latestSample.date : new Date().toISOString().split("T")[0]);
                           projectDate.setDate(projectDate.getDate() + estDaysToTarget);
                           const estMarketDateStr = projectDate.toISOString().split("T")[0];

                           // Alerts calculation
                           let hasWeightDeficitLimitAlert = false;
                           let weightDeficitPct = 0;
                           let comparisonTargetG = 0;
                           if (latestSample) {
                             const sampleAge = Math.max(1, Math.round((new Date(latestSample.date).getTime() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24)));
                             comparisonTargetG = getStandardWeightG(batch.birdType, sampleAge);
                             if (latestSample.averageWeightG < 0.9 * comparisonTargetG) {
                               hasWeightDeficitLimitAlert = true;
                               weightDeficitPct = Math.round(((comparisonTargetG - latestSample.averageWeightG) / comparisonTargetG) * 100);
                             }
                           }

                           const hasUniformityAlert = latestSample && (latestSample.uniformityPct ?? 100) < 80;

                           // Chart data assembly
                           let chartDataSingle = [];
                           if (sortedSamples.length > 0) {
                             chartDataSingle = sortedSamples.map(s => {
                               const sampleAge = Math.max(1, Math.round((new Date(s.date).getTime() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24)));
                               const targetStd = getStandardWeightG(batch.birdType, sampleAge);
                               return {
                                 date: s.date,
                                 ageDays: sampleAge,
                                 label: `Day ${sampleAge}`,
                                 "Actual Body Weight (g)": s.averageWeightG,
                                 "Breed Standard Target (g)": Math.round(targetStd),
                                 "Uniformity (%)": s.uniformityPct ?? 100,
                               };
                             });
                           } else {
                             const curveAges = batch.birdType === "Broilers (Meat)" ? [7, 14, 21, 28, 35, 42] : [14, 28, 42, 56, 70, 84];
                             chartDataSingle = curveAges.map(age => ({
                               date: `Day ${age}`,
                               ageDays: age,
                               label: `Day ${age}`,
                               "Actual Body Weight (g)": null,
                               "Breed Standard Target (g)": Math.round(getStandardWeightG(batch.birdType, age)),
                               "Uniformity (%)": null,
                             }));
                           }

                           return (
                             <div className="space-y-4">
                               {/* Alerts Header Section */}
                               {(hasWeightDeficitLimitAlert || hasUniformityAlert) && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                   {hasWeightDeficitLimitAlert && (
                                     <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs text-rose-950 flex gap-3 border-l-4 border-l-rose-500 text-[11px] leading-relaxed">
                                       <span className="text-base text-rose-650 font-bold">⚠️</span>
                                       <div>
                                         <span className="text-[10px] font-extrabold uppercase text-rose-700 tracking-wider block font-sans">CRITICAL WEIGHT AGING CONSTRAINTS</span>
                                         <p className="font-semibold mt-0.5 font-sans">
                                           Latest recorded average weight (<strong>{latestSample?.averageWeightG}g</strong>) is <strong>{weightDeficitPct}% below</strong> breed standard target of <strong>{Math.round(comparisonTargetG)}g</strong> at {Math.round(comparisonTargetG) > 0 ? "this age" : "Day 0"}. Audit health profiles immediately to reverse growth degradation!
                                         </p>
                                       </div>
                                     </div>
                                   )}
                                   {hasUniformityAlert && (
                                     <div className="bg-amber-50 border border-amber-305 p-3.5 rounded-xl text-xs text-amber-950 flex gap-3 border-l-4 border-l-amber-500 text-[11px] leading-relaxed">
                                       <span className="text-base text-amber-655 font-bold">🚨</span>
                                       <div>
                                         <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider block font-sans font-sans">UNIFORMITY DROP IN COHORT (Sorting Required)</span>
                                         <p className="font-semibold mt-0.5 font-sans">
                                           Flock uniformity value has dropped to <strong>{latestSample?.uniformityPct}%</strong> (below 80%). High biological size variance detected. Move slow-growth cohorts into low-density sorting lanes immediately!
                                         </p>
                                       </div>
                                     </div>
                                   )}
                                 </div>
                               )}

                               {/* Key Growth Metrics Grid */}
                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                 {/* FCR Diagnostic */}
                                 <div className="bg-white p-4 rounded-xl border border-purple-200 flex flex-col justify-between">
                                   <div>
                                     <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block font-sans font-sans">Calculated FCR (Cumulative)</span>
                                     <span className="font-mono text-lg font-black text-purple-900 block mt-1">
                                       {currentFcr > 0 ? currentFcr.toFixed(2) : "Calculating Weight Gain"}
                                     </span>
                                   </div>
                                   <div className="border-t pt-2 mt-2 text-[9px] text-slate-500 font-bold flex justify-between font-sans">
                                     <span>Cumulative Feed Intake:</span>
                                     <span className="font-mono text-purple-950">{totalFeedKg.toFixed(1)} kg</span>
                                   </div>
                                 </div>

                                 {/* Trajectory ADG */}
                                 <div className="bg-white p-4 rounded-xl border border-purple-200 flex flex-col justify-between">
                                   <div>
                                     <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block font-sans">Average Daily Gain (ADG)</span>
                                     <span className="font-mono text-lg font-black text-emerald-800 block mt-1">
                                       {adgG.toFixed(1)} <span className="text-xs font-bold text-slate-500">g/day</span>
                                     </span>
                                   </div>
                                   <div className="border-t pt-2 mt-2 text-[9px] text-slate-500 font-bold flex justify-between font-sans">
                                     <span>Growth Trajectory:</span>
                                     <span className="text-emerald-700 font-mono font-black uppercase font-sans">
                                       {sortedSamples.length > 0 ? "Sample Driven" : "Breed standard estimate"}
                                     </span>
                                   </div>
                                 </div>

                                 {/* Projected Market Date */}
                                 <div className="bg-white p-4 rounded-xl border border-purple-200 flex flex-col justify-between">
                                   <div>
                                     <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block font-sans">Projected Market Date</span>
                                     <span className="font-mono text-sm font-black text-indigo-950 block mt-1">
                                       {isStandardMet ? "💵 Market Size Achieved!" : estMarketDateStr}
                                     </span>
                                   </div>
                                   <div className="border-t pt-2 mt-2 text-[9px] text-slate-500 font-bold flex justify-between font-sans">
                                     <span>Ready In Approx:</span>
                                     <span className="font-mono text-indigo-700 font-black">
                                       {isStandardMet ? "0 Days" : `${estDaysToTarget} Days`}
                                     </span>
                                   </div>
                                 </div>

                                 {/* Projected Market Weight */}
                                 <div className="bg-white p-4 rounded-xl border border-purple-200 flex flex-col justify-between">
                                   <div>
                                     <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block font-sans">Target Market Size</span>
                                     <span className="font-mono text-lg font-black text-amber-900 block mt-1">
                                       {targetMarketWeightG} <span className="text-xs font-bold text-slate-500">grams</span>
                                     </span>
                                   </div>
                                   <div className="border-t pt-2 mt-2 text-[9px] text-slate-500 font-bold flex justify-between font-sans">
                                     <span>Current State Average:</span>
                                     <span className="font-mono font-black text-slate-700 font-sans">
                                       {Math.round(currentAvgWeightG)}g
                                     </span>
                                   </div>
                                 </div>
                               </div>

                               {/* Grid Layout: Left form & list, Right chart */}
                               <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                 {/* Weight Registry & Entry Form Column (7 cols) */}
                                 <div className="lg:col-span-7 space-y-4">
                                   {/* Recording Form */}
                                   <div className="bg-white p-4 rounded-xl border border-purple-200 space-y-4">
                                     <span className="font-extrabold text-[10px] uppercase text-purple-950 tracking-wider flex items-center gap-1 font-sans border-b pb-2">
                                       ⚖️ Log Body Weight Sample Details
                                     </span>
                                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                       <div className="flex flex-col gap-1 font-sans col-span-2 sm:col-span-1">
                                         <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block font-sans">Sampling Date</span>
                                         <input type="date" value={weightDate} onChange={e => setWeightDate(e.target.value)} required className="border p-2 bg-slate-50 rounded-lg text-xs" />
                                       </div>
                                       <div className="flex flex-col gap-1 font-sans">
                                         <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block font-sans">Avg Weight (Grams)</span>
                                         <input type="number" value={weightValueG} onChange={e => setWeightValueG(Math.max(1, Number(e.target.value)))} required className="border p-2 bg-white rounded-lg text-xs font-mono font-bold text-purple-900" />
                                       </div>
                                       <div className="flex flex-col gap-1 font-sans">
                                         <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block font-sans">Sample Size (Birds)</span>
                                         <input type="number" value={weightSampleSize} onChange={e => setWeightSampleSize(Math.max(1, Number(e.target.value)))} required className="border p-2 bg-white rounded-lg text-xs font-mono font-bold" />
                                       </div>
                                       <div className="flex flex-col gap-1 font-sans">
                                         <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block font-sans">Uniformity (%)</span>
                                         <input type="number" min="0" max="100" value={weightUniformityPct} onChange={e => setWeightUniformityPct(Math.min(100, Math.max(0, Number(e.target.value))))} required className="border p-2 bg-white rounded-lg text-xs font-mono font-bold" />
                                       </div>
                                       <div className="flex flex-col gap-1 col-span-2 sm:col-span-4 font-sans">
                                          <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Sampling Remarks</span>
                                          <input type="text" value={weightRemarks} onChange={e => setWeightRemarks(e.target.value)} placeholder="Flock shows consistent scaling across cohorts." className="border p-2 bg-white rounded-lg text-xs font-medium" />
                                       </div>
                                     </div>

                                     <button
                                       type="button"
                                       onClick={() => {
                                         if (onUpdatePoultryBatch) {
                                           const newSample = { 
                                             date: weightDate, 
                                             averageWeightG: weightValueG, 
                                             remarks: weightRemarks,
                                             sampleSize: weightSampleSize,
                                             uniformityPct: weightUniformityPct
                                           };
                                           const prevSamples = batch.weightSamples || [];
                                           onUpdatePoultryBatch({
                                             ...batch,
                                             weightSamples: [...prevSamples, newSample]
                                           });
                                         }
                                         setWeightRemarks("Checking uniform growth in cohort");
                                       }}
                                       className="w-full text-center py-2 bg-purple-700 text-white hover:bg-purple-800 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer font-sans"
                                     >
                                       ✓ Record Body Weight Sample & updates Trajectories
                                     </button>
                                   </div>

                                   {/* Registry log table */}
                                   <div className="bg-white p-4 rounded-xl border border-purple-200">
                                     <span className="font-extrabold text-[10px] uppercase text-purple-950 tracking-wider flex items-center gap-1 font-sans border-b pb-2 mb-2 block">
                                       📋 Historic Weight diagnostics Registry
                                     </span>
                                     <div className="overflow-x-auto">
                                       <table className="w-full text-left text-xs">
                                         <thead>
                                           <tr className="border-b text-[9px] font-black uppercase tracking-wider text-slate-400">
                                             <th className="py-2">Date</th>
                                             <th className="py-2 font-sans">Age (Days)</th>
                                             <th className="py-2 font-sans">Sample Size</th>
                                             <th className="py-2 text-right font-sans">Avg Weight (g)</th>
                                             <th className="py-2 text-right font-sans">Uniformity</th>
                                             <th className="py-2 text-right font-sans">Standard vs Deviation</th>
                                             <th className="py-2 text-center font-sans">Action</th>
                                           </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-100">
                                           {sortedSamples.length > 0 ? (
                                             sortedSamples.map((s, idx) => {
                                               const sampleAge = Math.max(1, Math.round((new Date(s.date).getTime() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24)));
                                               const stdTarget = getStandardWeightG(batch.birdType, sampleAge);
                                               const percentDiff = ((s.averageWeightG - stdTarget) / stdTarget) * 100;
                                               const isUniformDanger = (s.uniformityPct ?? 100) < 80;
                                               return (
                                                 <tr key={idx} className="hover:bg-slate-50/50 font-medium font-sans">
                                                   <td className="py-2.5 font-mono">{s.date}</td>
                                                   <td className="py-2.5">{sampleAge} Days</td>
                                                   <td className="py-2.5 font-mono">{s.sampleSize || "Unspecified"}</td>
                                                   <td className="py-2.5 text-right font-mono text-purple-950 font-extrabold">{s.averageWeightG}g</td>
                                                   <td className="py-2.5 text-right font-mono">
                                                     <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isUniformDanger ? "bg-rose-50 text-rose-700 font-extrabold animate-pulse" : "bg-purple-50 text-purple-700"}`}>
                                                       {s.uniformityPct ?? "N/A"}%
                                                     </span>
                                                   </td>
                                                   <td className="py-2.5 text-right font-mono">
                                                     <div className="flex flex-col items-end">
                                                       <span className="text-[10px] text-slate-500 font-sans">TGT: {Math.round(stdTarget)}g</span>
                                                       <span className={`text-[10px] font-bold ${percentDiff < -10 ? "text-rose-600 font-extrabold animate-pulse" : percentDiff >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                                                         {percentDiff >= 0 ? "+" : ""}{percentDiff.toFixed(1)}% {percentDiff < -10 ? "(🚨 Below Target)" : ""}
                                                       </span>
                                                     </div>
                                                   </td>
                                                   <td className="py-2.5 text-center">
                                                     <button 
                                                       type="button"
                                                       onClick={() => {
                                                         if (onUpdatePoultryBatch) {
                                                           const leftSamples = batch.weightSamples?.filter(cand => !(cand.date === s.date && cand.averageWeightG === s.averageWeightG)) || [];
                                                           onUpdatePoultryBatch({
                                                             ...batch,
                                                             weightSamples: leftSamples
                                                           });
                                                         }
                                                       }}
                                                       className="text-red-500 hover:text-red-700 font-bold font-sans px-2 py-0.5 cursor-pointer hover:bg-red-50 rounded"
                                                     >
                                                       ✕ Delete
                                                     </button>
                                                   </td>
                                                 </tr>
                                               );
                                             })
                                           ) : (
                                             <tr>
                                               <td colSpan={7} className="py-6 text-center italic text-slate-400 bg-slate-50/40 rounded-xl font-sans font-semibold">
                                                 No body weights samplings are recorded yet. Record body weight above to instantly map growth trends and FCR tracking.
                                               </td>
                                             </tr>
                                           )}
                                         </tbody>
                                       </table>
                                     </div>
                                   </div>
                                 </div>

                                 {/* Interactive Chart Column (5 cols) */}
                                 <div className="lg:col-span-5 space-y-4">
                                   <div className="bg-white p-4 rounded-xl border border-purple-200 font-sans">
                                     <span className="font-extrabold text-[10px] uppercase text-purple-950 tracking-wider flex items-center gap-1 font-sans border-b pb-2 mb-3">
                                       📈 Weight-for-Age Growth Curve Comparison
                                     </span>
                                     <div className="h-64 w-full bg-white p-1 text-[9px]">
                                       <ResponsiveContainer width="100%" height="100%">
                                         <LineChart data={chartDataSingle} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                                           <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                           <XAxis dataKey="label" stroke="#94a3b8" fontSize={8} tickLine={false} />
                                           <YAxis stroke="#475569" fontSize={8} label={{ value: 'Grams', angle: -90, position: 'insideLeft', offset: 10, fontSize: 8 }} tickLine={false} />
                                           <Tooltip 
                                             content={({ active, payload, label }: any) => {
                                               if (active && payload && payload.length) {
                                                 return (
                                                   <div className="bg-slate-900 text-white p-2 rounded text-[10px] shadow border border-slate-800 font-mono space-y-1">
                                                     <p className="font-bold border-b border-slate-800 pb-0.5">{label}</p>
                                                     {payload[0] && <p className="text-purple-300 font-semibold">{payload[0].name}: {payload[0].value}g</p>}
                                                     {payload[1] && <p className="text-slate-400 font-semibold">{payload[1].name}: {payload[1].value}g</p>}
                                                   </div>
                                                 );
                                               }
                                               return null;
                                             }}
                                           />
                                           <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 9 }} />
                                           <Line type="monotone" dataKey="Actual Body Weight (g)" stroke="#9333ea" strokeWidth={2.5} activeDot={{ r: 5 }} dot={{ r: 3.5, stroke: "#a855f7", strokeWidth: 1.5 }} name="Actual Weight (g)" />
                                           <Line type="monotone" dataKey="Breed Standard Target (g)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 1.5 }} name="Standard Target (g)" />
                                         </LineChart>
                                       </ResponsiveContainer>
                                     </div>
                                     <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 mt-2 text-[10.5px] leading-relaxed text-purple-950 font-sans font-medium text-justify">
                                       <span className="font-extrabold uppercase text-[9px] text-purple-800 block mb-0.5 font-sans font-sans">💡 Weight-for-Age Cohort Standards Diagnosis</span>
                                       This dashboard overlays your cohort sample results directly over the standardized biological targets mapping optimal trajectories for <strong className="text-purple-900">{batch.birdType}</strong>. Deviations larger than 10% indicate sub-optimal nutrition, crowding limits, or veterinary interventions required.
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           );
                        })()}
                      </div>
                    )}

                    {/* Batch financial report & locked status sheet helper variables calculation */}
                    {(() => {
                      const transportC = batch.transportCost ?? 0;
                      const setupC = batch.brooderSetupCost ?? 0;
                      const rawAcquisitionValue = batch.quantity * (batch.unitAcquisitionCost ?? 12);
                      const acqCostTotal = rawAcquisitionValue + transportC + setupC;
                      const feedExpensesTotal = batch.feedLogs ? batch.feedLogs.reduce((acc, current) => acc + current.cost, 0) : 0;
                      const medsExpensesTotal = batch.medications ? batch.medications.reduce((acc, current) => acc + current.cost, 0) : 0;
                      const estVaccineCost = (batch.vaccinationCalendar ? batch.vaccinationCalendar.filter(v => v.status === "Completed").length * 20 : 0);
                      const totalExpensesIncurred = acqCostTotal + feedExpensesTotal + medsExpensesTotal + estVaccineCost;
                      const salesRevenueTotal = batch.salesLogs ? batch.salesLogs.reduce((acc, s) => acc + s.amount, 0) : 0;
                      const profitOrLossYield = salesRevenueTotal - totalExpensesIncurred;

                      if (activeActionTab[batch.id] === "finance" || batch.status === "CLOSED") {
                        return (
                          <div className="bg-slate-55 border border-slate-300 p-5 rounded-2xl space-y-4 animate-slide-up">
                            <div className="flex justify-between items-center border-b pb-2 border-slate-300/60">
                              <div>
                                <span className="text-[9px] font-extrabold uppercase bg-slate-200 px-2 py-0.5 rounded text-slate-800 font-mono tracking-wider">DOUBLE-ENTRY GENERAL LEDGER LOG</span>
                                <h5 className="text-xs font-black text-slate-800 mt-1">Batch Yield & Financial Viability analysis</h5>
                              </div>
                              {batch.status === "CLOSED" && (
                                <span className="text-[10px] font-black uppercase text-red-700 bg-red-100/60 border border-red-300 px-2.5 py-0.5 rounded-md tracking-wider font-mono">
                                  🔒 SUMMARY AUDIT LOCKED
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs">
                                <span className="text-[9.5px] uppercase font-bold text-slate-400 block font-sans">Acquisition Cap (Dr 1430)</span>
                                <span className="font-mono text-sm font-extrabold text-slate-800 block mt-0.5">{currencySymbol} {acqCostTotal.toLocaleString()}</span>
                                <span className="text-[8.5px] text-slate-400 block mt-0.5">({batch.quantity} chicks × {batch.unitAcquisitionCost ?? 12} + {transportC} trans + {setupC} setup)</span>
                              </div>
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs">
                                <span className="text-[9.5px] uppercase font-bold text-slate-400 block font-sans">Feed Incurred (Dr 5210)</span>
                                <span className="font-mono text-sm font-extrabold text-slate-800 block mt-0.5">{currencySymbol} {feedExpensesTotal.toLocaleString()}</span>
                                <span className="text-[8.5px] text-slate-400 block mt-0.5">({batch.feedLogs?.length || 0} distribution entries)</span>
                              </div>
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs">
                                <span className="text-[9.5px] uppercase font-bold text-slate-400 block font-sans">Vet/Med Cost (Dr 5300)</span>
                                <span className="font-mono text-sm font-extrabold text-slate-800 block mt-0.5">{currencySymbol} {(medsExpensesTotal + estVaccineCost).toLocaleString()}</span>
                                <span className="text-[8.5px] text-slate-400 block mt-0.5">({batch.medications?.length || 0} events + vaccines)</span>
                              </div>
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs">
                                <span className="text-[9.5px] uppercase font-bold text-slate-500 block font-sans font-black">Gross Operating Cost</span>
                                <span className="font-mono text-sm font-black text-slate-900 border-b border-dashed border-slate-300 pb-0.5 block mt-0.5">{currencySymbol} {totalExpensesIncurred.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                              <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-3xs">
                                <div>
                                  <span className="text-[9.5px] uppercase font-bold text-emerald-700 block font-sans">Birds Revenue (Cr 4200)</span>
                                  <span className="font-mono text-base font-black text-emerald-900 block mt-0.5">{currencySymbol} {salesRevenueTotal.toLocaleString()}</span>
                                  <span className="text-[8.5px] text-slate-500 block mt-1">({batch.salesLogs?.reduce((s,l)=>s+l.quantity,0) || 0} harvested birds sold)</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9.5px] uppercase font-extrabold text-slate-400 block font-sans">Surviving Stock</span>
                                  <span className="font-mono text-xs font-black text-slate-800 block mt-0.5">{batch.currentCount} Live Birds</span>
                                </div>
                              </div>

                              <div className={`p-4 rounded-xl border flex flex-col justify-between shadow-3xs ${profitOrLossYield >= 0 ? "bg-emerald-50 border-emerald-250 text-emerald-950" : "bg-rose-50 border-rose-250 text-rose-950"}`}>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[9.5px] uppercase font-extrabold block text-slate-500 font-sans">Net Batch Yield Surplus</span>
                                    <span className="font-mono text-base font-black block mt-0.5">{profitOrLossYield >= 0 ? "+" : ""}{currencySymbol} {profitOrLossYield.toLocaleString()}</span>
                                  </div>
                                  <span className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono ${profitOrLossYield >= 0 ? "bg-emerald-200 text-emerald-800 border border-emerald-300" : "bg-rose-200 text-rose-800 border border-rose-300"}`}>
                                    {profitOrLossYield >= 0 ? "Operational Surplus" : "Operating Loss"}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden mt-3">
                                  <div
                                    className={`h-full rounded-full ${profitOrLossYield >= 0 ? "bg-emerald-600" : "bg-rose-600"}`}
                                    style={{ width: `${Math.min(100, Math.max(10, salesRevenueTotal > 0 ? (salesRevenueTotal / (totalExpensesIncurred || 1)) * 100 : 0))}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* List of registered live sales with dressing and margins */}
                            {batch.salesLogs && batch.salesLogs.length > 0 && (
                              <div className="mt-4 border-t border-slate-200 pt-4">
                                <h6 className="text-[10px] font-black text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-sans">
                                  💰 COMMERCIAL LIVE SALES VOUCHERS RECORD ({batch.salesLogs.length})
                                </h6>
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-3xs">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-[10.5px]">
                                      <thead>
                                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-extrabold uppercase text-[8.5px] tracking-wider">
                                          <th className="p-2.5">Date</th>
                                          <th className="p-2.5">Customer Name</th>
                                          <th className="p-2.5 text-center">Birds</th>
                                          <th className="p-2.5 text-center">Live Avg Wt</th>
                                          <th className="p-2.5 text-right">Pricing Model</th>
                                          <th className="p-2.5 text-right font-black">Revenue (ZK)</th>
                                          <th className="p-2.5 text-right">Gross Margin / Bird</th>
                                          <th className="p-2.5 text-center">Invoice</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                                        {batch.salesLogs.map((sale, idx) => {
                                          const isPerBird = sale.chargeType === "PER_BIRD";
                                          return (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                              <td className="p-2.5 font-mono font-bold text-slate-500">{sale.date}</td>
                                              <td className="p-2.5 font-bold text-slate-900">{sale.customerName || "Walk-In Cash Customer"}</td>
                                              <td className="p-2.5 text-center font-mono font-bold">{sale.quantity}</td>
                                              <td className="p-2.5 text-center font-mono text-slate-500">
                                                {sale.averageWeightKg ? `${sale.averageWeightKg} kg` : "N/A"}
                                                {sale.dressingPercentage ? ` (${sale.dressingPercentage}% dress)` : ""}
                                              </td>
                                              <td className="p-2.5 text-right font-mono font-bold text-slate-600">
                                                {isPerBird 
                                                  ? `${currencySymbol}${sale.pricePerBird}/bird` 
                                                  : `${currencySymbol}${sale.pricePerKg ?? 0}/kg`}
                                              </td>
                                              <td className="p-2.5 text-right font-mono font-black text-emerald-900">
                                                {currencySymbol} {sale.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                              </td>
                                              <td className="p-2.5 text-right">
                                                {sale.grossMarginPerBird !== undefined ? (
                                                  <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-black ${sale.grossMarginPerBird >= 0 ? "bg-emerald-100/70 text-emerald-800" : "bg-rose-105 text-rose-800"}`}>
                                                    {sale.grossMarginPerBird >= 0 ? "+" : ""}{currencySymbol}{sale.grossMarginPerBird.toFixed(2)}
                                                  </span>
                                                ) : (
                                                  <span className="text-slate-400">N/A</span>
                                                )}
                                              </td>
                                              <td className="p-2.5 text-center">
                                                <button
                                                  type="button"
                                                  onClick={() => handleDownloadPDF(sale, batch)}
                                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded font-black text-[9px] uppercase tracking-wider flex items-center gap-1 mx-auto shadow-3xs cursor-pointer transition-colors"
                                                >
                                                  📥 PDF
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Lock trigger for operational closure */}
                            {batch.status !== "CLOSED" && !isReadonly && onUpdatePoultryBatch && (
                              <div className="bg-amber-50/80 border border-amber-250 p-4 rounded-xl flex items-center justify-between flex-wrap gap-4 text-xs shadow-3xs">
                                <div className="flex items-center gap-3 max-w-xl">
                                  <span className="text-xl">📢</span>
                                  <p className="text-amber-900 leading-relaxed font-semibold text-[11px]">
                                    Lock summary audit? Transitioning to <strong>CLOSED</strong> permanently archives records. Feed distribution, vaccination checks, daily egg collector inputs, and check-offs are frozen to lock double-entry balances.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Financial Voucher Secure Handshake: Are you sure you want to lock the general ledger summary and move "${batch.batchName}" to historical record? This process permanently locks operational entries.`)) {
                                      onUpdatePoultryBatch({
                                        ...batch,
                                        status: "CLOSED"
                                      });
                                    }
                                  }}
                                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold uppercase tracking-wide text-[10px] rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                                >
                                  ⚙️ Lock Ledger & Close Batch
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Highly Polished Interactive Production Stages Checklist Console */}
                    <div className="border-t pt-4 mt-6 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">Flock Timeline & Production Stage System</span>
                          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                            Age Tracker: <span className="text-slate-900 font-mono font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">{ageDays} Days</span> 
                            <span className="text-slate-500 font-normal">({ageWeeks > 0 ? `Week ${ageWeeks}, Day ${ageDaysRemainder}` : `Day ${ageDays}`})</span>
                          </h5>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Biological Suggestion:</span>
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50/70 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                            {PRODUCTION_STAGES.find(s => s.id === getSuggestedStageId(ageDays, batch.birdType))?.name || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Horizontal Stage Selection Ribbon */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                        {PRODUCTION_STAGES.map(st => {
                          const isCurrentActive = currentActiveStageId === st.id;
                          const isBeingViewed = activeTabId === st.id;
                          const isCompliant = isStageApplicable(st.id, batch.birdType);

                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                setSelectedStageTab(prev => ({ ...prev, [batch.id]: st.id }));
                              }}
                              className={`p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                                isBeingViewed 
                                  ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10" 
                                  : isCurrentActive
                                  ? "bg-emerald-50/80 text-emerald-950 border-emerald-300 hover:bg-emerald-100"
                                  : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
                              } ${!isCompliant ? "opacity-50 grayscale-20" : ""}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-[9px] font-extrabold block opacity-60">
                                  {st.ageRange}
                                </span>
                                {isCurrentActive && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                                  </span>
                                )}
                              </div>
                              <span className="font-extrabold text-xs block truncate mt-1">
                                {st.name}
                              </span>
                              <div className="flex justify-between items-center mt-1 text-[8px] uppercase tracking-wider font-extrabold">
                                <span className={isBeingViewed ? "text-slate-355" : isCurrentActive ? "text-emerald-700" : "text-slate-400"}>
                                  {isCurrentActive ? "Active" : !isCompliant ? "Inapplicable" : "Inspect"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Viewing pane for standard activities logic */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                        <div className="flex justify-between items-start flex-wrap gap-4 border-b pb-3 border-slate-200/80">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                              <span className="text-slate-800 text-sm font-black">{activeTabInfo.name} Guidelines</span>
                              <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                TARGET: {activeTabInfo.ageRange}
                              </span>
                              {!isStageApplicable(activeTabInfo.id, batch.birdType) && (
                                <span className="text-[8px] uppercase font-black tracking-wider bg-orange-100 text-orange-850 px-2 py-0.5 rounded-full">
                                  Non-Standard for {batch.birdType}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-[11px] mt-1 font-medium">
                              Monitor milestones and accomplish guidelines to compile quality poultry batches.
                            </p>
                          </div>
                          
                          {currentActiveStageId !== activeTabId && !isReadonly && onUpdatePoultryBatch && (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdatePoultryBatch({
                                  ...batch,
                                  currentStageId: activeTabId
                                });
                              }}
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                            >
                              ⚙️ Set Active
                            </button>
                          )}
                          {currentActiveStageId === activeTabId && (
                            <span className="px-3 py-1.5 bg-emerald-150/80 text-emerald-900 border border-emerald-300 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                              ✓ Currently Active Stage
                            </span>
                          )}
                        </div>

                        {/* Checklist Split Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 space-y-4">
                            <div>
                              <span className="text-[10px] font-black uppercase text-slate-400 block pb-1.5 tracking-wider">
                                Key SOP Activities
                              </span>
                              <div className="space-y-1.5">
                                {activeTabInfo.activities.map((act, idx) => {
                                  const itemKey = `${activeTabInfo.id}:act:${idx}`;
                                  const isChecked = batch.accomplishedChecklist?.includes(itemKey) || false;
                                  return (
                                    <label
                                      key={idx}
                                      className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all text-[11.5px] cursor-pointer ${
                                        isChecked 
                                          ? "bg-emerald-50/45 border-emerald-250 text-slate-500" 
                                          : "bg-white hover:bg-slate-50/50 border-slate-200 text-slate-750"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        disabled={isReadonly || batch.status === "CLOSED"}
                                        checked={isChecked}
                                        onChange={() => toggleChecklistVal(itemKey)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                      />
                                      <span className={isChecked ? "line-through opacity-75" : "font-medium"}>{act}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] font-black uppercase text-slate-400 block pb-1.5 tracking-wider">
                                Stage Infrastructure / Feeder & drinker Setup
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {activeTabInfo.requirements.map((req, idx) => {
                                  const itemKey = `${activeTabInfo.id}:req:${idx}`;
                                  const isChecked = batch.accomplishedChecklist?.includes(itemKey) || false;
                                  return (
                                    <label
                                      key={idx}
                                      className={`flex items-start gap-2 p-2 rounded-xl border transition-all text-[11px] cursor-pointer ${
                                        isChecked 
                                          ? "bg-slate-100 border-slate-200 text-slate-400" 
                                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        disabled={isReadonly || batch.status === "CLOSED"}
                                        checked={isChecked}
                                        onChange={() => toggleChecklistVal(itemKey)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                      />
                                      <span className={isChecked ? "line-through opacity-75" : "font-extrabold"}>{req}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Advisory & Biological Risks Panel */}
                          <div className="space-y-3.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 block pb-1 tracking-wider">
                              Real-Time Biological Status
                            </span>
                            
                            {/* Age Warning Indicator */}
                            {ageDays < activeTabInfo.minDays ? (
                              <div className="p-3 bg-amber-50/80 border border-amber-250 text-amber-900 rounded-xl text-[11px] font-medium leading-relaxed">
                                <p className="font-extrabold uppercase tracking-wider text-[9px] text-amber-950 pb-0.5">⏱️ Standard Timeline: Future</p>
                                The batch is {ageDays} Days in age, which is under the recommended timeline (Day {activeTabInfo.minDays}+) for {activeTabInfo.name}.
                              </div>
                            ) : ageDays > activeTabInfo.maxDays ? (
                              <div className="p-3 bg-amber-50/80 border border-amber-250 text-amber-900 rounded-xl text-[11px] font-medium leading-relaxed">
                                <p className="font-extrabold uppercase tracking-wider text-[9px] text-amber-950 pb-0.5">⚠️ Standard Timeline: Completed</p>
                                The batch is {ageDays} Days in age - past the typical timeline limits (up to Day {activeTabInfo.maxDays}) for {activeTabInfo.name}.
                              </div>
                            ) : (
                              <div className="p-3 bg-emerald-50/85 border border-emerald-250 text-emerald-950 rounded-xl text-[11px] font-medium leading-relaxed">
                                <p className="font-extrabold uppercase tracking-wider text-[9px] text-emerald-800 pb-0.5">✅ Active Target Match</p>
                                Chronologically on-target (Age: {ageDays} Days) within this production stage's target range.
                              </div>
                            )}

                            {/* Veterinary / Standard Advisory Blocks */}
                            <div className="space-y-2">
                              {activeTabInfo.alerts.map((al, idx) => (
                                <div key={idx} className="p-3 bg-rose-50/90 border border-rose-200 hover:bg-rose-100/50 rounded-2xl text-[11px] text-rose-900 font-medium leading-relaxed transition-all">
                                  <p className="font-black uppercase tracking-wider text-[8px] text-rose-800 pb-1">🛑 Biosecurity Advisory</p>
                                  {al}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
              })
            )}
                </div>
              );
            })() : (
            <PoultryFinancialDashboard 
              batches={batches}
              onUpdatePoultryBatch={onUpdatePoultryBatch}
              currencySymbol={currencySymbol}
            />
          )}
          </div>
        </div>
      )}

      {segment === "formulation" && (
        <FeedFormulationBuilder
          currencySymbol={currencySymbol}
          customFormulas={customFormulas}
          setCustomFormulas={setCustomFormulas}
          batches={batches}
          onUpdatePoultryBatch={onUpdatePoultryBatch}
        />
      )}

      {segment === "livestock" && (
        // LIVESTOCK & VETERINARY PORTFOLIO SYSTEM
        <div className="space-y-6 animate-fade-in text-slate-800">
          
          {/* Subsection Mode Selector (Self-managed vs practice tools) */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm border-slate-200 space-y-3">
            {tierWarning && (
              <div className="bg-amber-50 border border-amber-200 text-slate-800 p-3.5 rounded-xl text-xs font-bold flex justify-between items-center animate-fade-in">
                <span className="flex items-center gap-2 text-amber-900">⚠️ {tierWarning}</span>
                <button type="button" onClick={() => setTierWarning(null)} className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded">Dismiss</button>
              </div>
            )}
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
              Select Livestock Submode Active Workspace
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <button 
                type="button"
                onClick={() => setLivestockMode("farmer")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  livestockMode === "farmer" 
                    ? "bg-emerald-950 text-white border-emerald-950 font-extrabold shadow" 
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <User className="w-3.5 h-3.5 text-emerald-600" /> Farmer Self-Service
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (subscriptionTier !== "Veterinary Doctor Practitioner") {
                    setTierWarning("Access Denied: The 'Vet Practitioner' module requires an active 'Veterinary Doctor Practitioner' plan subscription. Please upgrade under Profiles settings first.");
                    return;
                  }
                  setLivestockMode("vet");
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  livestockMode === "vet" 
                    ? "bg-emerald-950 text-white border-emerald-950 font-extrabold shadow" 
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                } ${subscriptionTier !== "Veterinary Doctor Practitioner" ? "opacity-60" : ""}`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-blue-500" /> Vet Practitioner {subscriptionTier !== "Veterinary Doctor Practitioner" && "🔒"}
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (subscriptionTier !== "Veterinary Doctor Practitioner") {
                    setTierWarning("Access Denied: The 'Clinic Multi-Vet Suite' module requires an active 'Veterinary Doctor Practitioner' plan subscription. Please upgrade under Profiles settings first.");
                    return;
                  }
                  setLivestockMode("clinic");
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  livestockMode === "clinic" 
                    ? "bg-emerald-950 text-white border-emerald-950 font-extrabold shadow" 
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                } ${subscriptionTier !== "Veterinary Doctor Practitioner" ? "opacity-60" : ""}`}
              >
                <Building className="w-3.5 h-3.5 text-indigo-500" /> Clinic Multi-Vet Suite {subscriptionTier !== "Veterinary Doctor Practitioner" && "🔒"}
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3.1 FARMER WORKSPACE (Self-managed mode) */}
          {/* ========================================================= */}
          {livestockMode === "farmer" && (
            <EnterpriseLivestockManager
              records={records}
              currencySymbol={currencySymbol}
              onAddLivestockRecord={onAddLivestockRecord}
              onAddLivestockHealthEvent={onAddLivestockHealthEvent}
              onAddLivestockFeedingLog={onAddLivestockFeedingLog}
              isReadonly={isReadonly}
              accounts={accounts}
              setAccounts={setAccounts}
              customers={customers}
              invoices={invoices}
              onAddInvoice={onAddInvoice}
              onMarkPaid={onMarkPaid}
              onDeleteLivestockRecord={onDeleteLivestockRecord}
              activeFarm={activeFarm}
            />
          )}

          {livestockMode === "farmer_legacy" && (
            <div className="space-y-6">
              
              {/* Alert Indicator of deactivated service fees */}
              <div className="bg-emerald-50 border border-emerald-200/60 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-900">Self-Managed Farmer Security Framework Active</h5>
                  <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed font-semibold">
                    You are in Self-Service mode. Feed records, bio-logs, and quarantine isolations are logged free. 
                    <strong> No practice-managed service fees apply</strong>. Click the Vet tabs above if you require licensed certificate stamps.
                  </p>
                </div>
              </div>

              {/* Subtabs for Farmer */}
              <div className="flex border-b border-slate-200 gap-6">
                <button 
                  onClick={() => setFarmerSubTab("herd")}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all ${
                    farmerSubTab === "herd" ? "border-emerald-600 text-emerald-900" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📋 Herd Registry ({records.length})
                </button>
                <button 
                  onClick={() => setFarmerSubTab("biosecurity")}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all ${
                    farmerSubTab === "biosecurity" ? "border-emerald-600 text-emerald-900" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🛡️ Biosecurity, Quarantine & Visitors
                </button>
                <button 
                  onClick={() => setFarmerSubTab("vaccination")}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all ${
                    farmerSubTab === "vaccination" ? "border-emerald-600 text-emerald-900" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🩺 Vaccines Scheduling
                </button>
              </div>

              {farmerSubTab === "herd" && (
                <div className="space-y-4">
                  {/* Action Bar & Forms */}
                  <div className="flex flex-wrap gap-4 justify-between items-center bg-slate-50 p-4 rounded-2xl border">
                    <div className="relative w-full max-w-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        placeholder="Search Tag, Breed, Species..." 
                        value={herdSearch}
                        onChange={e => setHerdSearch(e.target.value)}
                        className="text-xs w-full bg-white p-2.25 pl-9 border rounded-xl"
                      />
                    </div>
                    <button 
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="bg-emerald-900 text-white font-extrabold text-xs px-4 py-2 rounded-xl"
                    >
                      {showAddForm ? "Collapse Form" : "+ Register Animal Tag ID"}
                    </button>
                  </div>

                  {showAddForm && (
                    <form onSubmit={handleRegisterAnimal} className="bg-slate-50 p-6 rounded-2xl border space-y-4 animate-fade-in">
                      <h4 className="text-xs font-extrabold uppercase text-slate-800">Register Biological Asset</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Tag Identifier (Ear Tag)</label>
                          <input type="text" placeholder="e.g. ANG-095" value={newTagId} onChange={e => setNewTagId(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Animal Species</label>
                          <select value={newSpecies} onChange={e => setNewSpecies(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                            {Object.keys(SPECIES_BREEDS_MAP).map(k => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Breed Type (Auto-Linked)</label>
                          <select value={newBreed} onChange={e => setNewBreed(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                            {(SPECIES_BREEDS_MAP[newSpecies]?.breeds || ["Standard Stud"]).map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Gender (Auto-Linked)</label>
                          <select value={newGender} onChange={e => setNewGender(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                            {(SPECIES_BREEDS_MAP[newSpecies]?.genders || ["Female"]).map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Acquisition Method</label>
                          <select value={newAcquisitionType} onChange={e => setNewAcquisitionType(e.target.value as any)} className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                            <option value="Bought">Bought / Purchased</option>
                            <option value="Birthed on Farm">Birthed on Farm</option>
                            <option value="Gifted">Gifted / Granted</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Source / Vendor / Dam lineage</label>
                          <input type="text" placeholder="e.g. Chisamba Breeder / Dam #104" value={newSource} onChange={e => setNewSource(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                        </div>
                        {newAcquisitionType === "Bought" && (
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Purchase Price ({currencySymbol})</label>
                            <input type="number" value={newPurchasePrice} onChange={e => setNewPurchasePrice(Number(e.target.value))} className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                          </div>
                        )}
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Acquired / Calved Date</label>
                          <input type="date" value={newAcquiredDate} onChange={e => setNewAcquiredDate(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Baseline Weight (Kg)</label>
                          <input type="number" value={newWeight} onChange={e => setNewWeight(Number(e.target.value))} className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Breeding Status</label>
                          <select value={newBreedingStatus} onChange={e => setNewBreedingStatus(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white">
                            <option value="Breeding Eligible">Breeding Eligible</option>
                            <option value="Pregnant">Pregnant</option>
                            <option value="Lactating">Lactating</option>
                            <option value="Dry">Dry</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Current Val ({currencySymbol})</label>
                          <input type="number" value={newCurrentValue} onChange={e => setNewCurrentValue(Number(e.target.value))} className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-1.5 bg-slate-200 rounded-lg text-xs font-semibold">Cancel</button>
                        <button type="submit" className="px-5 py-1.5 bg-emerald-900 text-white rounded-lg text-xs font-bold">Incept Animal</button>
                      </div>
                    </form>
                  )}

                  {/* Floating Livestock Bulk Selection Bar */}
                  {selectedLivestockIds.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-xl mb-4 shadow-xs animate-fade-in font-sans">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 text-[10px] flex items-center justify-center font-black">
                          {selectedLivestockIds.length}
                        </span>
                        <span className="text-[11px] text-rose-900 font-bold">
                          Livestock animal{selectedLivestockIds.length > 1 ? "s" : ""} selected for bulk actions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLivestockIds([])}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          Deselect All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const selectedItems = filteredHerd.filter(a => selectedLivestockIds.includes(a.id));
                            const itemNames = selectedItems.map(a => `Tag: ${a.tagId} (${a.species} - ${a.breed})`);
                            
                            const triggerConfirm = (window as any).triggerGlobalConfirm;
                            if (triggerConfirm) {
                              triggerConfirm({
                                title: "Bulk Delete Livestock Records",
                                message: `CRITICAL INTEGRITY CONTROL: You are about to bulk and soft-delete ${selectedLivestockIds.length} livestock animal profiles from the Mabala system. This action will archive them in the secure archive directory.`,
                                isBulk: true,
                                itemCount: selectedLivestockIds.length,
                                itemNames: itemNames,
                                onConfirm: () => {
                                  selectedLivestockIds.forEach(id => {
                                    if (onDeleteLivestockRecord) onDeleteLivestockRecord(id);
                                  });
                                  setSelectedLivestockIds([]);
                                }
                              });
                            } else {
                              if (window.confirm(`Are you sure you want to bulk-delete ${selectedLivestockIds.length} selected livestock animals?`)) {
                                selectedLivestockIds.forEach(id => {
                                  if (onDeleteLivestockRecord) onDeleteLivestockRecord(id);
                                });
                                setSelectedLivestockIds([]);
                              }
                            }
                          }}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <Trash className="w-3 h-3" />
                          <span>Bulk Delete Selected</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Herd Directory Table */}
                  <div className="bg-white border rounded-2xl overflow-hidden">
                    <div className="table-responsive">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-extrabold border-b">
                          <tr>
                            <th className="p-4 w-10">
                              <input
                                type="checkbox"
                                checked={filteredHerd.length > 0 && selectedLivestockIds.length === filteredHerd.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLivestockIds(filteredHerd.map(animal => animal.id));
                                  } else {
                                    setSelectedLivestockIds([]);
                                  }
                                }}
                                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4 ml-0.5"
                              />
                            </th>
                            <th className="p-4">Tag Reference</th>
                            <th className="p-4">Species & Breed</th>
                            <th className="p-4">Breeding & Weight</th>
                            <th className="p-4">Purchase / Current Value</th>
                            <th className="p-4">Treatment Chronology</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-semibold text-slate-800">
                          {filteredHerd.map(animal => (
                            <tr key={animal.id} className="hover:bg-slate-50/50">
                              <td className="p-4 w-10">
                                <input
                                  type="checkbox"
                                  checked={selectedLivestockIds.includes(animal.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedLivestockIds(prev => [...prev, animal.id]);
                                    } else {
                                      setSelectedLivestockIds(prev => prev.filter(id => id !== animal.id));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4 ml-0.5"
                                />
                              </td>
                              <td className="p-4 font-mono text-emerald-800">{animal.tagId}</td>
                              <td className="p-4">
                                <div className="text-slate-900 font-bold">{animal.species}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{animal.breed}</div>
                              </td>
                              <td className="p-4 font-medium text-slate-600">
                                <div>Weight: <strong>380 kg</strong></div>
                                <div className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 inline-block mt-0.5">Eligible</div>
                              </td>
                              <td className="p-4 font-mono">
                                <div>Acq: {currencySymbol}{animal.purchasePrice.toLocaleString()}</div>
                                <div className="text-emerald-600 text-[11px] font-bold">Val: {currencySymbol}{animal.currentValue.toLocaleString()}</div>
                              </td>
                              <td className="p-4 max-w-sm">
                                {animal.healthEvents && animal.healthEvents.length > 0 ? (
                                  <div className="space-y-1 font-medium text-[10px] text-slate-500">
                                    {animal.healthEvents.map((hx, idx) => (
                                      <div key={idx} className="bg-slate-50 p-1.5 rounded border">
                                        • {hx.date} ({hx.type}) — {hx.details}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-slate-400 italic text-[10px] font-normal">No treatment recorded.</div>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  <button 
                                    onClick={() => setSelectedTagForTreatment(animal.tagId)}
                                    className="px-2.5 py-1 text-[10px] bg-emerald-50 text-emerald-800 rounded font-bold hover:bg-emerald-100 transition-all cursor-pointer"
                                  >
                                    + Record Meds
                                  </button>
                                  <button 
                                    onClick={() => setSelectedAnimalForPrint(animal)}
                                    className="px-2 py-1 text-[10px] border border-slate-300 text-slate-600 rounded font-bold hover:bg-slate-50 transition-all cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Printer className="w-3 h-3" /> Profile Card
                                  </button>
                                  {!isReadonly && onDeleteLivestockRecord && (
                                    <button 
                                      onClick={() => {
                                        const triggerConfirm = (window as any).triggerGlobalConfirm;
                                        if (triggerConfirm) {
                                          triggerConfirm({
                                            title: "Delete Livestock Record",
                                            message: `Are you sure you want to delete and soft-delete livestock animal tag "${animal.tagId}" to the secure archive?`,
                                            isBulk: true,
                                            itemCount: 1,
                                            itemNames: [`Tag: ${animal.tagId} (${animal.species} - ${animal.breed})`],
                                            onConfirm: () => {
                                              onDeleteLivestockRecord(animal.id);
                                              setSelectedLivestockIds(prev => prev.filter(id => id !== animal.id));
                                            }
                                          });
                                        } else {
                                          if (window.confirm(`Are you sure you want to delete and soft-delete livestock animal tag "${animal.tagId}" to the archive?`)) {
                                            onDeleteLivestockRecord(animal.id);
                                            setSelectedLivestockIds(prev => prev.filter(id => id !== animal.id));
                                          }
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                      title="Delete Livestock"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredHerd.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 italic">No matching livestock Tag found in registry.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Inside-panel popup form for recording wellness/meds log */}
                  {selectedTagForTreatment && (
                    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
                      <form onSubmit={handleAddSelfTreatment} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl border">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="text-xs font-extrabold uppercase text-slate-800">Log Self-Managed Care — {selectedTagForTreatment}</h4>
                          <button type="button" onClick={() => setSelectedTagForTreatment("")} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-500">Treatment Type</label>
                            <select value={selfLogType} onChange={e => setSelfLogType(e.target.value as any)} className="w-full text-xs p-2 border bg-white rounded-lg">
                              <option value="Vaccination">Routine Vaccination Plan</option>
                              <option value="Treatment">Injury/Disease Treatment</option>
                              <option value="Deworming">Tick / Parasite Deworming</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-500">Care Details & Drug Used</label>
                            <input type="text" placeholder="e.g. 5ml Ivermectin dewormer" value={selfDetails} onChange={e => setSelfDetails(e.target.value)} required className="w-full text-xs p-2 border rounded-lg bg-white" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-500">Drug Invoice / Material Cost ({currencySymbol})</label>
                            <input type="number" value={selfCost} onChange={e => setSelfCost(Number(e.target.value))} className="w-full text-xs p-2 border rounded-lg bg-white" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end border-t pt-3">
                          <button type="button" onClick={() => setSelectedTagForTreatment("")} className="px-3 py-1 bg-slate-100 rounded text-xs font-semibold">Cancel</button>
                          <button type="submit" className="px-4 py-1.5 bg-emerald-900 text-white rounded text-xs font-bold">Write Log</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* PRINT RECORD POPUP PREVIEW */}
                  {selectedAnimalForPrint && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 border-4 border-emerald-950 font-sans shadow-2xl relative select-text" id="animal-print-card">
                        
                        {/* Certificate Header */}
                        <div className="border-b-2 border-dashed border-slate-300 pb-4 text-center">
                          <div className="inline-block p-1.5 bg-emerald-50 text-emerald-800 font-bold border rounded mb-2 text-[10px] tracking-widest font-mono">
                            OFFICIAL BIOLOGICAL RECORD — SELF-SERVICE
                          </div>
                          <h3 className="font-extrabold text-lg text-slate-900 uppercase tracking-tight">Mabala Farm Animal Profile</h3>
                          <p className="text-[11px] text-slate-500 font-medium">Digital Animal Health Passport & Production Ledger Status</p>
                        </div>

                        {/* Certificate Data fields */}
                        <div className="grid grid-cols-2 gap-4 my-6 text-xs text-slate-700">
                          <div className="bg-slate-50 p-3.5 rounded-xl border">
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">Biological tag ID</span>
                            <strong className="text-sm font-mono text-emerald-800">{selectedAnimalForPrint.tagId}</strong>
                          </div>
                          <div className="bg-slate-50 p-3.5 rounded-xl border">
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">Species & Breed</span>
                            <strong className="text-sm text-slate-900">{selectedAnimalForPrint.species}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Date Registered</span>
                            <p className="font-bold text-slate-800">{selectedAnimalForPrint.dateAcquired}</p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Biological Appraisal Value</span>
                            <p className="font-bold text-slate-800">{currencySymbol}{selectedAnimalForPrint.currentValue.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Assigned Roster Node</span>
                            <p className="font-bold text-slate-800">Main Grazing Block 2</p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Biological Status</span>
                            <p className="font-bold text-emerald-600">Active / Well</p>
                          </div>
                        </div>

                        {/* Health chronology list */}
                        <div className="border-t border-slate-200 pt-4">
                          <h4 className="text-[11px] font-extrabold uppercase text-slate-800 mb-2">Registered Health Chronics & Treatments</h4>
                          {selectedAnimalForPrint.healthEvents && selectedAnimalForPrint.healthEvents.length > 0 ? (
                            <table className="w-full text-left text-[11px] text-slate-600 border rounded">
                              <thead className="bg-slate-100 text-slate-800 font-bold">
                                <tr>
                                  <th className="p-2">Date</th>
                                  <th className="p-2">Log category</th>
                                  <th className="p-2">Description / Prescribed items</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y font-medium">
                                {selectedAnimalForPrint.healthEvents.map((hx, i) => (
                                  <tr key={i}>
                                    <td className="p-2 font-mono">{hx.date}</td>
                                    <td className="p-2">{hx.type}</td>
                                    <td className="p-2">{hx.details}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">No registered veterinary diagnoses, treatments, or scheduled vaccinations detected in our databases for this tag.</p>
                          )}
                        </div>

                        {/* Certificate footer stamp */}
                        <div className="mt-8 pt-4 border-t border-dashed flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-mono">STAMP SECURED BY</span>
                            <span className="text-[10px] font-extrabold text-emerald-900 font-mono">MABALA SECURE ERP</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono font-bold">
                            TIMESTAMP: 2026-05-29
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 justify-end mt-6">
                          <button onClick={() => setSelectedAnimalForPrint(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold">Close</button>
                          <button onClick={() => window.print()} className="px-5 py-2 bg-emerald-950 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1">
                            <Printer className="w-3.5 h-3.5" /> Trigger System Print
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {farmerSubTab === "biosecurity" && (
                <div className="space-y-4">
                  
                  {/* Biosecurity Navigation Selector */}
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-sm text-[11px] font-bold">
                    <button onClick={() => setBiosecurityTab("quarantine")} className={`flex-1 py-1 px-2 rounded-lg transition-all ${biosecurityTab === "quarantine" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}>
                      ☣️ Isolation / Quarantine
                    </button>
                    <button onClick={() => setBiosecurityTab("visitors")} className={`flex-1 py-1 px-2 rounded-lg transition-all ${biosecurityTab === "visitors" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}>
                      👣 Visitor Log
                    </button>
                    <button onClick={() => setBiosecurityTab("checklist")} className={`flex-1 py-1 px-2 rounded-lg transition-all ${biosecurityTab === "checklist" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}>
                      ✅ Checklist
                    </button>
                  </div>

                  {biosecurityTab === "quarantine" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <form onSubmit={handleAddQuarantine} className="bg-slate-50 p-5 rounded-2xl border space-y-3">
                        <h4 className="text-xs font-extrabold uppercase text-slate-800">Isolate New Animal Tag</h4>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Animal Tag ID</label>
                          <select value={qTagId} onChange={e => setQTagId(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                            <option value="">-- Choose Ear Tag --</option>
                            {records.map(r => (
                              <option key={r.id} value={r.tagId}>{r.tagId} - {r.breed} ({r.species})</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Start Isolation</label>
                            <input type="date" value={qStart} onChange={e => setQStart(e.target.value)} className="w-full text-[10px] p-2 border rounded-lg bg-white" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Est. Release</label>
                            <input type="date" value={qRelease} onChange={e => setQRelease(e.target.value)} className="w-full text-[10px] p-2 border rounded-lg bg-white" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Reason for Quarantine</label>
                          <textarea rows={2} placeholder="e.g. Blisters inside lip area, newly imported angoni bull isolation protocols" value={qReason} onChange={e => setQReason(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                        </div>
                        <button type="submit" className="w-full py-2.5 bg-emerald-900 text-white font-extrabold text-xs rounded-xl">Isolate Tag</button>
                      </form>

                      <div className="col-span-2 bg-white border rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-extrabold uppercase text-slate-800">Isolated Herd Tracking Roster</h4>
                        <div className="divide-y space-y-3">
                          {quarantines.map((q, idx) => (
                            <div key={idx} className="flex justify-between items-center pt-3">
                              <div>
                                <span className="text-xs font-mono font-bold text-rose-600 block">{q.tagId}</span>
                                <h5 className="font-bold text-xs text-slate-800">{q.reason}</h5>
                                <span className="text-[10px] text-slate-400 font-semibold block">{q.startDate} to {q.estRelease}</span>
                              </div>
                              <span className="px-2.5 py-1 text-[9px] bg-amber-50 text-amber-800 rounded font-bold border border-amber-200 uppercase">
                                {q.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {biosecurityTab === "visitors" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <form onSubmit={handleAddVisitor} className="bg-slate-50 p-5 rounded-2xl border space-y-3">
                        <h4 className="text-xs font-extrabold uppercase text-slate-800">Record Visitor Entry</h4>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Visitor Full Name</label>
                          <input type="text" placeholder="John Banda" value={vName} onChange={e => setVName(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Organization / Agency</label>
                          <input type="text" placeholder="MoA Veterinary Dept" value={vOrg} onChange={e => setVOrg(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Purpose of Visit</label>
                          <input type="text" placeholder="e.g. Dipping audits" value={vPurpose} onChange={e => setVPurpose(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                        </div>
                        <div className="space-y-2 border-t pt-2">
                          <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                            <input type="checkbox" checked={vBootbath} onChange={e => setVBootbath(e.target.checked)} />
                             Disinfectant Footbath Cleansed?
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                            <input type="checkbox" checked={vWheels} onChange={e => setVWheels(e.target.checked)} />
                             Vehicle Wheel Spray Applied?
                          </label>
                        </div>
                        <button type="submit" className="w-full py-2.5 bg-emerald-920 text-white font-semibold text-xs rounded-xl">Register Entry</button>
                      </form>

                      <div className="col-span-2 bg-white border rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-extrabold uppercase text-slate-800">Biosecurity Visitor Entry audit ledger</h4>
                        <div className="divide-y text-xs text-slate-700">
                          {visitors.map((v, idx) => (
                            <div key={v.id || idx} className="py-3 flex justify-between items-center">
                              <div>
                                <h5 className="font-bold text-slate-950">{v.name} ({v.org || "Agro visitor"})</h5>
                                <p className="text-slate-500 font-medium">{v.purpose} on <strong>{v.date}</strong></p>
                              </div>
                              <div className="flex gap-1.5">
                                <span className={`px-2 py-0.5 text-[9px] rounded font-bold ${v.bootbath ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                                  Footbath: {v.bootbath ? "✓" : "✗"}
                                </span>
                                <span className={`px-2 py-0.5 text-[9px] rounded font-bold ${v.wheels ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                                  Wheel bath: {v.wheels ? "✓" : "✗"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {biosecurityTab === "checklist" && (
                    <div className="bg-white border rounded-2xl p-6 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">Gate Biosecurity Standard Checklist</h4>
                      <p className="text-[11px] text-slate-400">Mandatory farm-gate preventative tasks aligned with Zambia Animal Health Directives.</p>
                      
                      <div className="space-y-3 font-semibold text-xs text-slate-700">
                        <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg">
                          <input type="checkbox" defaultChecked={true} className="mt-0.5" />
                          <div>
                            <h5 className="text-slate-800 font-bold">Disinfectant Boot-Bath stations populated at entrance points</h5>
                            <p className="text-[10px] text-slate-400 font-medium">Re-filled every Tuesday with Virkon-S.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg">
                          <input type="checkbox" defaultChecked={true} className="mt-0.5" />
                          <div>
                            <h5 className="text-slate-800 font-bold">Quarantine fence integrity validated against wild ruminants</h5>
                            <p className="text-[10px] text-slate-400 font-medium">Validates boundary spacing to avoid Foot-and-Mouth contagion vectors.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg">
                          <input type="checkbox" defaultChecked={false} className="mt-0.5" />
                          <div>
                            <h5 className="text-slate-800 font-bold">Brucellosis testing scheduled for calving heifers</h5>
                            <p className="text-[10px] text-slate-400 font-medium">Due for veterinary practitioner certified sampling next month.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {farmerSubTab === "vaccination" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <form onSubmit={handleAddFarmerSchedule} className="bg-slate-50 p-5 rounded-2xl border space-y-3">
                    <h4 className="text-xs font-extrabold uppercase text-slate-800">Schedule Upcoming Vaccine Dose</h4>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Target Animal Tag ID</label>
                      <select value={schTagId} onChange={e => setSchTagId(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                        <option value="">-- Choose Ear Tag --</option>
                        {records.map(r => (
                          <option key={r.id} value={r.tagId}>{r.tagId} - {r.breed} ({r.species})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Intervention Type</label>
                      <select value={schType} onChange={e => setSchType(e.target.value)} className="w-full text-xs p-2.5 border rounded-lg bg-white">
                        <option value="Vaccination">Routine Vaccine shot (Tick / Redwater)</option>
                        <option value="Treatment">Preventative Booster deworming</option>
                        <option value="Tuberculin">Tuberculin diagnostic test</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Target Schedule Date</label>
                      <input type="date" value={schDate} onChange={e => setSchDate(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Biological/Administration Notes</label>
                      <input type="text" placeholder="Booster anthrax dose B" value={schNotes} onChange={e => setSchNotes(e.target.value)} required className="w-full text-xs p-2.5 border rounded-lg bg-white" />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-emerald-900 text-white font-extrabold text-xs rounded-xl">Schedule Intervention</button>
                  </form>

                  <div className="col-span-2 bg-white border rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-extrabold uppercase text-slate-800">Scheduled Vaccine Roster</h4>
                    <div className="divide-y space-y-3 text-xs">
                      {farmerSchedules.map((s, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-center">
                          <div>
                            <span className="text-xs font-mono font-bold text-emerald-800 block">{s.tagId}</span>
                            <span className="font-extrabold text-slate-800">{s.notes} ({s.type})</span>
                            <span className="text-[10px] text-slate-400 block pt-0.5 font-medium">Due by Date: <strong>{s.date}</strong></span>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded text-[9px] border">
                            SCHEDULED
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* 3.2 VETERINARY PRACTITIONER (Multi-Farmer Mode) */}
          {/* ========================================================= */}
          {livestockMode === "vet" && (
            <div className="space-y-6 animate-fade-in font-sans">
              
              <div className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white p-6 rounded-2xl">
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-[9px] tracking-widest font-mono font-extrabold uppercase rounded block w-max mb-2">
                  VET DOCTOR WORKSPACE: PRACTICE MODE
                </span>
                <h3 className="font-extrabold text-lg">Multi-Farmer Practice & Diagnosis Toolkit</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-2xl font-semibold">
                  Manage medical histories across client farms, certify disease-free status, issue digital clearance certificates, design service lists, and schedule routine vaccine drives.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Vet Actions Panel */}
                <div className="space-y-6">
                  {/* Client Selector */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block pb-1.5">Active Client Farmer Node</label>
                    <select 
                      value={activeClient} 
                      onChange={e => setActiveClient(e.target.value)}
                      className="w-full text-xs font-bold border rounded-lg bg-white p-2.5"
                    >
                      <option value="client-1">Chisamba Dairy Ltd (Mulenga Bwalya)</option>
                      <option value="client-2">Makeni Angus Stud (Gertrude Phiri)</option>
                      <option value="client-3">Zimba Pastoral Alliance (Mwansa Lupando)</option>
                    </select>
                    <div className="mt-3 text-[10px] font-semibold text-slate-500 leading-snug">
                      Selecting client filters herd and scopes digital certifications. Billed amounts feed directly into Mabala bookkeeping pipelines.
                    </div>
                  </div>

                  {/* Pricing Catalog */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-extrabold uppercase text-slate-800">Practice Price Catalog</h4>
                      <button onClick={() => setShowCatalogForm(!showCatalogForm)} className="text-[10px] font-bold text-emerald-800">
                        {showCatalogForm ? "Collapse" : "+ Add Service"}
                      </button>
                    </div>

                    {showCatalogForm && (
                      <form onSubmit={handleAddServicePrice} className="space-y-2.5 border-b pb-3 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Code (e.g. V-SURG)" value={newCatCode} onChange={e => setNewCatCode(e.target.value)} required className="w-full text-xs p-2 border bg-white rounded" />
                          <input type="number" placeholder="Price (ZK)" value={newCatPrice} onChange={e => setNewCatPrice(Number(e.target.value))} required className="w-full text-xs p-2 border bg-white rounded" />
                        </div>
                        <input type="text" placeholder="Service Name Description" value={newCatName} onChange={e => setNewCatName(e.target.value)} required className="w-full text-xs p-2 border bg-white rounded" />
                        <button type="submit" className="w-full py-1.5 bg-emerald-900 text-white font-bold text-[10px] uppercase rounded">Add Item</button>
                      </form>
                    )}

                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {catalog.map(cat => {
                        const isEditing = editingCatalogId === cat.id;
                        return (
                          <div key={cat.id} className="p-2.5 bg-white rounded-xl border border-slate-100 font-semibold shadow-sm text-xs">
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-extrabold uppercase block pb-0.5">Code</label>
                                    <input 
                                      type="text" 
                                      value={editCatCode} 
                                      onChange={e => setEditCatCode(e.target.value)} 
                                      className="w-full p-2 border rounded-lg bg-slate-50 font-mono font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-extrabold uppercase block pb-0.5">Price ({currencySymbol})</label>
                                    <input 
                                      type="number" 
                                      value={editCatPrice} 
                                      onChange={e => setEditCatPrice(Number(e.target.value))} 
                                      className="w-full p-2 border rounded-lg bg-slate-50 font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 font-extrabold uppercase block pb-0.5">Service Name Description</label>
                                  <input 
                                    type="text" 
                                    value={editCatName} 
                                    onChange={e => setEditCatName(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-slate-50 font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                  <button 
                                    type="button" 
                                    onClick={() => setEditingCatalogId(null)}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded-lg transition-all"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => handleSaveEditCatalog(cat.id)}
                                    className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-[10px] font-extrabold rounded-lg transition-all shadow-sm"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center gap-3">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[9px] font-mono font-black text-slate-400 block tracking-wider uppercase leading-none pb-0.5">{cat.code}</span>
                                  <span className="block truncate text-slate-700 font-bold">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-slate-900 font-extrabold text-[13px]">{currencySymbol}{cat.price.toLocaleString()}</span>
                                  <div className="flex gap-0.5">
                                    <button 
                                      type="button"
                                      onClick={() => handleStartEditCatalog(cat)}
                                      className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-indigo-600 hover:text-indigo-800 transition-colors bg-white font-normal"
                                      title="Edit service details"
                                    >
                                      📝
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleDeleteCatalogItem(cat.id)}
                                      className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-rose-600 hover:text-rose-800 transition-colors bg-white font-normal"
                                      title="Delete Item"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scheduling Farm visits */}
                  <div className="bg-slate-50 p-5 rounded-2xl border space-y-3">
                    <h4 className="text-xs font-extrabold uppercase text-slate-800">Schedule Practice Client Visit</h4>
                    <form onSubmit={handleCreateVisit} className="space-y-2 pt-1 text-xs">
                      <select 
                        value={vvisitClient} 
                        onChange={e => setVvisitClient(e.target.value)} 
                        className="w-full p-2 border rounded-lg bg-white cursor-pointer font-semibold text-slate-800"
                        required
                      >
                        {customers && customers.length > 0 ? (
                          <>
                            {customers.map((c) => (
                              <option key={c.id} value={c.name}>{c.name} ({c.contact || "No Contact"})</option>
                            ))}
                          </>
                        ) : (
                          <>
                            <option value="Chisamba Dairy Ltd">Chisamba Dairy Ltd</option>
                            <option value="Makeni Angus Stud">Makeni Angus Stud</option>
                            <option value="Zimba Pastoral Alliance">Zimba Pastoral Alliance</option>
                          </>
                        )}
                      </select>
                      <input type="date" value={vvisitDate} onChange={e => setVvisitDate(e.target.value)} className="w-full p-2 border rounded-lg bg-white" />
                      <input type="text" placeholder="Visit purpose detail (e.g. pregnancy diagnosis)" value={vvisitPurpose} onChange={e => setVvisitPurpose(e.target.value)} required className="w-full p-2 border rounded-lg bg-white" />
                      <button type="submit" className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg text-xs">Confirm Schedule</button>
                    </form>
                  </div>

                </div>

                {/* Main Practitioner Work Bench area (diagnose, treatment, certified doc) */}
                <div className="col-span-2 space-y-6">
                  
                  {/* Diagnostic & Certified Treatment logger form */}
                  <form onSubmit={handleAddVetCertifiedLog} className="bg-white border rounded-2xl p-6 space-y-4">
                    <div className="border-b pb-3 flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase text-slate-800">Professional Wellness Certification</h4>
                        <p className="text-[11px] text-slate-400">Certify diagnosis and issue certified treatment documentation with professional seals.</p>
                      </div>
                      <span className="text-[9px] uppercase font-bold bg-amber-50 text-amber-800 border px-1.5 py-0.5 rounded">ZVC REGULATION ACTIVE</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Selected Animal Tag</label>
                        <select value={vetTagId} onChange={e => setVetTagId(e.target.value)} required className="w-full p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                          <option value="">-- Choose Target Tag --</option>
                          {records.map(r => (
                            <option key={r.id} value={r.tagId}>{r.tagId} ({r.species} - {r.breed})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Client Customer</label>
                        <select value={vetCustomerId} onChange={e => setVetCustomerId(e.target.value)} required className="w-full p-2.5 border rounded-lg bg-white font-extrabold text-emerald-900 bg-emerald-50/40">
                          <option value="">-- Choose Customer --</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.name}>{c.name} ({c.phone || c.email})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Procedure Applied</label>
                        <select value={vetServiceId} onChange={e => setVetServiceId(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white font-bold text-slate-800">
                          {catalog.map(srv => (
                            <option key={srv.id} value={srv.id}>{srv.name} ({currencySymbol}{srv.price.toLocaleString()})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Practitioner License</label>
                        <input type="text" value={vetLicense} onChange={e => setVetLicense(e.target.value)} required className="w-full p-2.5 border rounded-lg bg-white font-mono" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Clinical Diagnosis</label>
                        <textarea rows={2} placeholder="Surgical intervention due to left abomasal displacement..." value={vetDiagnosis} onChange={e => setVetDiagnosis(e.target.value)} required className="w-full p-2.5 border rounded-lg bg-white font-medium" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Prescription & Therapy</label>
                        <textarea rows={2} placeholder="Antibiotics block LA 15ml SC injection, dip isolate for 5 days..." value={vetTreatment} onChange={e => setVetTreatment(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white font-medium" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl flex-wrap gap-4">
                      <div className="text-[11px] text-slate-500 font-semibold max-w-md">
                        ⚠️ Submitting will raise an <strong>Unpaid Invoice</strong> in Customer Invoices for the procedure amount automatically. The printable certificate is locked until the invoice is paid.
                      </div>
                      <button type="submit" className="bg-emerald-950 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-800 transition-colors shadow">
                        🖊️ Certify & Raise Invoice
                      </button>
                    </div>
                  </form>

                  {/* Certified Treatment Directory */}
                  <div className="bg-white border rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-extrabold uppercase text-slate-800">Certified Practice Records Log</h4>
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {certifiedLogs.map((log, idx) => {
                        const targetInvoice = invoices.find(inv => inv.id === log.invoiceId);
                        const isPaid = targetInvoice ? targetInvoice.status === "Paid" : log.isCleared;

                        return (
                          <div key={log.id || idx} className="p-4 border rounded-xl bg-slate-50/50 flex justify-between items-start flex-wrap gap-3">
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-rose-700">{log.tagId}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">• Certified No: <strong>{log.certNo}</strong></span>
                                {isPaid ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-black">PAID & CERTIFIED</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-50 text-amber-800 border border-amber-200 font-black animate-pulse">AWAITING PAYMENT</span>
                                )}
                              </div>
                              <h5 className="font-bold text-xs text-slate-900">{log.diagnosis}</h5>
                              <p className="text-slate-500 font-medium">{log.treatment}</p>
                              <div className="text-[10px] text-indigo-700 font-bold block pt-1">
                                Client: {log.clientName} (Billed Fee: {currencySymbol}{log.fee})
                              </div>
                              <div className="text-[9px] text-slate-400 font-medium">
                                Certified By: {log.vetName} ({log.licenseNo}) on {log.certifiedDate}
                              </div>
                            </div>
                            <div className="flex gap-2 items-center">
                              {!isPaid && targetInvoice && (
                                <button 
                                  type="button"
                                  onClick={() => onMarkPaid(targetInvoice.id)}
                                  className="px-2.5 py-1 text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all"
                                >
                                  💳 Pay {currencySymbol}{targetInvoice.total.toLocaleString()}
                                </button>
                              )}
                              <button 
                                type="button"
                                onClick={() => {
                                  if (!isPaid) {
                                    setTierWarning(`Print Blocked: The certificate for Tag ID ${log.tagId} cannot be printed until the linked invoice (${targetInvoice?.invoiceNumber || "INV-VET"}) is marked as Paid.`);
                                    return;
                                  }
                                  setSelectedCertPrint(log);
                                }}
                                className={`px-2.5 py-1 text-[10px] border font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all ${
                                  isPaid 
                                    ? "bg-emerald-900 text-white hover:bg-emerald-800 border-transparent hover:scale-[1.02]" 
                                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                }`}
                              >
                                <Printer className="w-3 h-3" /> {isPaid ? "Print Certificate" : "Print Blocked"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

              {/* Printable Medical Certified Certificate Modal Overlay */}
              {selectedCertPrint && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-xl p-8 border-8 border-double border-emerald-900 font-sans shadow-2xl relative select-text">
                    
                    <div className="text-center pb-4 border-b border-slate-200">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] font-mono font-black uppercase rounded tracking-widest block w-max mx-auto mb-2">
                        CERTIFICATE OF ZOOSANITARY SECURITY
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-base uppercase">ZVC Clinical Health Record</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Zambia Veterinary Council Certified Clearance Certificate</p>
                    </div>

                    <div className="my-6 text-xs text-slate-700 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg border">
                          <span className="text-[8px] uppercase font-bold text-slate-400 block font-mono">Animal reference Tag ID</span>
                          <span className="font-bold font-mono text-emerald-800 text-xs">{selectedCertPrint.tagId}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border">
                          <span className="text-[8px] uppercase font-bold text-slate-400 block font-mono">Certificate Serial No</span>
                          <span className="font-bold font-mono text-slate-900 text-xs">{selectedCertPrint.certNo}</span>
                        </div>
                      </div>

                      <div className="border p-4 rounded-xl space-y-2">
                        <div>
                          <span className="text-[8px] uppercase font-mono font-bold text-slate-400">Clinical Diagnosis</span>
                          <p className="font-bold text-slate-800">{selectedCertPrint.diagnosis}</p>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-mono font-bold text-slate-400">Prescribed Treatment / Therapy</span>
                          <p className="font-bold text-slate-800">{selectedCertPrint.treatment}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400">CLIENT HOLDING:</span>
                          <p className="font-extrabold text-slate-900">{selectedCertPrint.clientName}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400">CERTIFICATION DATE:</span>
                          <p className="font-extrabold text-slate-900">{selectedCertPrint.certifiedDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Clinic Stamp / Watermark placeholder */}
                    <div className="border-t-2 border-dashed border-slate-300 pt-5 flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                      <div>
                        <span className="text-[8px] text-slate-400 block font-mono">CERTIFIED BY REGISTRANT:</span>
                        <span className="text-xs font-bold text-slate-900">{selectedCertPrint.vetName}</span>
                        <span className="text-[9px] text-emerald-800 font-mono font-bold block">LIC REF: {selectedCertPrint.licenseNo}</span>
                      </div>
                      <div className="text-center border-2 border-emerald-900 p-2 text-[10px] text-emerald-950 font-bold rounded-lg font-mono tracking-tighter shadow uppercase">
                        ✅ CLINIC SECURITY<br/>STAMP APPROVED
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-6">
                      <button onClick={() => setSelectedCertPrint(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold">Done</button>
                      <button onClick={() => window.print()} className="px-5 py-2 bg-emerald-900 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1">
                        <Printer className="w-3.5 h-3.5" /> Trigger Print
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* 3.3 VET CLINIC SUITE (Multi-Vet Mode) */}
          {/* ========================================================= */}
          {livestockMode === "clinic" && (
            <div className="space-y-6 animate-fade-in font-sans text-slate-800">
              
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800">
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 text-[9px] tracking-widest font-mono font-extrabold uppercase rounded block w-max mb-2">
                  VET CLINIC LEVEL CO-OPERATIVE SYSTEM
                </span>
                <h3 className="font-bold text-base">Centralised Practice, Roster & Drug Stocks Management</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-2xl font-semibold">
                  Oversee multiple veterinarians under one clinic node. Maintain collective pricing frameworks, consolidate billing statistics, configure roster lines, and track vaccine inventory blocks.
                </p>
              </div>

              {/* Dynamic Vet Clinic Profile Configurator */}
              <div className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100 rounded-2xl p-5 space-y-4 shadow-sm font-sans">
                <div className="flex justify-between items-center border-b border-indigo-100 pb-3">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-indigo-950 flex items-center gap-2">
                      🏢 Clinic Profile & Global Print Customisation
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Configure custom credentials that get printed instantly on all professional zoosanitary health clearance documents.
                    </p>
                  </div>
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Clinic Name (Authority)</label>
                    <input 
                      type="text" 
                      value={clinicName} 
                      onChange={e => setClinicName(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Clinic License Registry</label>
                    <input 
                      type="text" 
                      value={clinicLicense} 
                      onChange={e => setClinicLicense(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg bg-white font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Physical Address</label>
                    <input 
                      type="text" 
                      value={clinicAddress} 
                      onChange={e => setClinicAddress(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Hotline Contact</label>
                    <input 
                      type="text" 
                      value={clinicPhone} 
                      onChange={e => setClinicPhone(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Vet Roster List */}
                <div className="bg-white border rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-extrabold uppercase text-slate-800">Clinic Practitioners Roster</h4>
                    <button onClick={() => setShowVetForm(!showVetForm)} className="text-[10px] font-bold text-indigo-700">
                      {showVetForm ? "Collapse" : "+ Onboard Vet"}
                    </button>
                  </div>

                  {showVetForm && (
                    <form onSubmit={handleOnboardVet} className="p-4 bg-slate-50 rounded-xl border space-y-3 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">Practitioner Full Name</label>
                        <input type="text" placeholder="e.g. Dr. Sarah Phiri" value={newVetName} onChange={e => setNewVetName(e.target.value)} required className="w-full p-2.5 border bg-white rounded-lg font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block pb-1">ZVC Registration License Code</label>
                        <input type="text" placeholder="e.g. ZVC-2026-90B" value={newVetLicense} onChange={e => setNewVetLicense(e.target.value)} required className="w-full p-2.5 border bg-white rounded-lg font-mono font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-indigo-700 block pb-1 font-sans">Assign Client Farmer</label>
                        <select value={newVetAssign} onChange={e => setNewVetAssign(e.target.value)} required className="w-full p-2.5 border bg-white rounded-lg font-bold text-slate-800">
                          <option value="">-- Choose Assigned Client --</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.name}>{c.name} ({c.phone || c.email})</option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold rounded-lg text-xs shadow-sm">Onboard Roster</button>
                    </form>
                  )}

                  <div className="divide-y space-y-3">
                    {clinicVets.map(vet => (
                      <div key={vet.id} className="pt-3 flex justify-between items-start text-xs font-semibold">
                        <div>
                          <h5 className="text-slate-900 font-bold">{vet.name}</h5>
                          <p className="text-[10px] text-slate-400 font-medium">Specialty: {vet.specialty} • Licensed: <strong>{vet.license}</strong></p>
                          <span className="text-[10px] text-indigo-700 font-bold block pt-1">Assigned Client: {vet.assignedClients}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          vet.status === "On Duty" ? "bg-emerald-50 text-emerald-800" : "bg-indigo-50 text-indigo-800"
                        }`}>
                          {vet.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drug and Vaccine Stock pile */}
                <div className="bg-white border rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase text-slate-800">Drug & Vaccine StockPile Registers</h4>

                  <form onSubmit={handleReceiveStock} className="p-3.5 bg-slate-50 rounded-xl border space-y-3">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Restock / Receive Drug stock</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input type="text" placeholder="Item name (e.g. Bovishield)" value={reorderItemName} onChange={e => setReorderItemName(e.target.value)} required className="p-2 border bg-white rounded" />
                      <input type="number" placeholder="Qty" value={reorderQty} onChange={e => setReorderQty(Number(e.target.value))} required className="p-2 border bg-white rounded" />
                    </div>
                    <button type="submit" className="w-full py-1.5 bg-indigo-700 text-white font-bold text-[10px] uppercase rounded">Replenish Stock</button>
                  </form>

                  <div className="divide-y text-xs text-slate-700">
                    {drugStock.map(drug => (
                      <div key={drug.id} className="py-2.5 flex justify-between items-center font-semibold">
                        <div>
                          <span className="font-bold text-slate-950 block">{drug.item}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">Batch: {drug.batch} • Exp: {drug.expiry}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold block ${drug.qty <= drug.reorderLevel ? "text-rose-600 font-extrabold" : "text-emerald-700"}`}>
                            {drug.qty} Vials
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {drug.qty <= drug.reorderLevel ? "⚠️ Reorder" : "Healthy"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Billing analytics consolidated clinic */}
                <div className="bg-white border rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase text-slate-800">Consolidated Billing Portfolio</h4>
                  
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-xs">
                    <span className="text-[9px] uppercase font-extrabold text-indigo-800 block">Total Invoiced Practice Revenue</span>
                    <div className="text-lg font-mono font-bold text-indigo-950 mt-1">{currencySymbol}34,500.00</div>
                    <div className="text-[10px] text-slate-400 font-medium pt-1">Accrued across active veterinarians inside this portal.</div>
                  </div>

                  <div className="space-y-3 pt-2 text-xs font-semibold">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Primary Revenue Contributor</span>
                      <div className="flex justify-between items-center py-1">
                        <span>Dr. Noah Mulenga</span>
                        <span className="font-mono">{currencySymbol}22,400.00 (65%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: "65%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center py-1">
                        <span>Dr. Chileshe Tembo</span>
                        <span className="font-mono">{currencySymbol}12,100.00 (35%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: "35%" }}></div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
