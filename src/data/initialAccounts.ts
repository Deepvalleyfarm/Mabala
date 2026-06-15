export interface Account {
  code: string;
  name: string;
  category: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  balance: number;
}

export const INITIAL_ACCOUNTS: Account[] = [
  // Assets (1xxx)
  { code: "1010", name: "Bank Operational Account", category: "Asset", balance: 0 },
  { code: "1020", name: "Mobile Money Settlement Account", category: "Asset", balance: 0 },
  { code: "1100", name: "Accounts Receivable", category: "Asset", balance: 0 },
  { code: "1200", name: "Short-Term Loans Receivable", category: "Asset", balance: 0 },
  { code: "1310", name: "Inventory - Seeds & Planting Materials", category: "Asset", balance: 0 },
  { code: "1320", name: "Inventory - Fertilizers & Limestone", category: "Asset", balance: 0 },
  { code: "1330", name: "Inventory - Chemicals & Pesticides", category: "Asset", balance: 0 },
  { code: "1340", name: "Inventory - Feed Supplies (Poultry/Fish)", category: "Asset", balance: 0 },
  { code: "1410", name: "Biological Assets - Harvestable Crops", category: "Asset", balance: 0 },
  { code: "1420", name: "Biological Assets - Livestock Herd value", category: "Asset", balance: 0 },
  { code: "1430", name: "Biological Assets - Poultry Flocks", category: "Asset", balance: 0 },
  { code: "1440", name: "Biological Assets - Aqua Biomass", category: "Asset", balance: 0 },
  { code: "1510", name: "Land / Farm Fields Asset", category: "Asset", balance: 0 },
  { code: "1520", name: "Sheds, Ponds & Infrastructure Asset", category: "Asset", balance: 0 },
  { code: "1530", name: "Tractors & Agricultural Implements", category: "Asset", balance: 0 },
  { code: "1600", name: "Investment Portfolio", category: "Asset", balance: 0 },

  // Liabilities (2xxx)
  { code: "2010", name: "Accounts Payable (Trade Creditors)", category: "Liability", balance: 0 },
  { code: "2020", name: "Accrued Employee PAYE Tax Liability", category: "Liability", balance: 0 },
  { code: "2030", name: "NAPSA Pension Liabilities", category: "Liability", balance: 0 },
  { code: "2040", name: "NHIMA Health Scheme Liabilities", category: "Liability", balance: 0 },
  { code: "2050", name: "Workers Compensation Liability (WCF)", category: "Liability", balance: 0 },
  { code: "2060", name: "Zambia Skills Development Levy Accrual", category: "Liability", balance: 0 },
  { code: "2070", name: "Output VAT (ZRA VAT Payable)", category: "Liability", balance: 0 },
  { code: "2110", name: "Agricultural Commercial Banks Loan", category: "Liability", balance: 0 },

  // Equity (3xxx)
  { code: "3010", name: "Shareholders Equity Contribution", category: "Equity", balance: 0 },
  { code: "3020", name: "Retained Earnings (Reserves)", category: "Equity", balance: 0 },

  // Revenue (4xxx)
  { code: "4000", name: "Crop Sales Revenue", category: "Revenue", balance: 0 },
  { code: "4100", name: "Fish / Aquaculture Sales Revenue", category: "Revenue", balance: 0 },
  { code: "4110", name: "Fingerling Sales Revenue (Hatchery)", category: "Revenue", balance: 0 },
  { code: "4200", name: "Poultry Sales Revenue (Meat/Eggs)", category: "Revenue", balance: 0 },
  { code: "4300", name: "Livestock Sales Revenue (Cattle/Goats)", category: "Revenue", balance: 0 },
  { code: "4500", name: "Veterinary Clinical Service Revenue", category: "Revenue", balance: 0 },
  { code: "4400", name: "Other Farm Ancillary Income", category: "Revenue", balance: 0 },

  // Expenses (5xxx)
  { code: "5100", name: "Staff Wages & Salaries", category: "Expense", balance: 0 },
  { code: "5110", name: "NAPSA Pension - Employer Portion", category: "Expense", balance: 0 },
  { code: "5120", name: "NHIMA - Employer Portion", category: "Expense", balance: 0 },
  { code: "5130", name: "Workers Compensation Expense", category: "Expense", balance: 0 },
  { code: "5140", name: "Skills Development Levy Expense", category: "Expense", balance: 0 },
  { code: "5200", name: "Aquafeed & Feed Purchases Expense", category: "Expense", balance: 0 },
  { code: "5210", name: "Poultry Feed & Crumbles Cost", category: "Expense", balance: 0 },
  { code: "5220", name: "Livestock Feed Formulation", category: "Expense", balance: 0 },
  { code: "5300", name: "Veterinary, Meds & Fingerling Purchase", category: "Expense", balance: 0 },
  { code: "5310", name: "Crop Seed & Seedling Acquisition", category: "Expense", balance: 0 },
  { code: "5400", name: "Water Management & Liming Costs", category: "Expense", balance: 0 },
  { code: "5410", name: "Aeration, Pumping & Electricity", category: "Expense", balance: 0 },
  { code: "5500", name: "Direct Labour Allocation", category: "Expense", balance: 0 },
  { code: "5600", name: "Pond, Cage & Infrastructure Maintenance", category: "Expense", balance: 0 },
  { code: "5700", name: "Harvesting & Processing Costs", category: "Expense", balance: 0 },
  { code: "5800", name: "Transport, Logistics & Cold Chain", category: "Expense", balance: 0 },
  { code: "5900", name: "Mortality Losses (Non-Cash)", category: "Expense", balance: 0 },
  { code: "5910", name: "Pesticides, Herbicide & Fertilizer", category: "Expense", balance: 0 },
  { code: "5920", name: "Tractor Fuel, Spares & Servicing", category: "Expense", balance: 0 },
  { code: "5930", name: "ZRA Input VAT (Refundable portion)", category: "Expense", balance: 0 }
];
