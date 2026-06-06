export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  flag: string;
  defaultTaxSystem: "VAT" | "Sales Tax" | "Turnover Tax" | "None";
  isZambia: boolean;
}

export const COUNTRIES: CountryInfo[] = [
  { code: "ZM", name: "Zambia", currency: "ZMW", symbol: "ZK", flag: "🇿🇲", defaultTaxSystem: "VAT", isZambia: true },
  { code: "KE", name: "Kenya", currency: "KES", symbol: "KSh", flag: "🇰🇪", defaultTaxSystem: "VAT", isZambia: false },
  { code: "TZ", name: "Tanzania", currency: "TZS", symbol: "TSh", flag: "🇹🇿", defaultTaxSystem: "VAT", isZambia: false },
  { code: "UG", name: "Uganda", currency: "UGX", symbol: "USh", flag: "🇺🇬", defaultTaxSystem: "None", isZambia: false },
  { code: "ZA", name: "South Africa", currency: "ZAR", symbol: "R", flag: "🇿🇦", defaultTaxSystem: "VAT", isZambia: false },
  { code: "NG", name: "Nigeria", currency: "NGN", symbol: "₦", flag: "🇳🇬", defaultTaxSystem: "VAT", isZambia: false },
  { code: "GH", name: "Ghana", currency: "GHS", symbol: "GH₵", flag: "🇬🇭", defaultTaxSystem: "VAT", isZambia: false },
  { code: "RW", name: "Rwanda", currency: "RWF", symbol: "FRw", flag: "🇷🇼", defaultTaxSystem: "VAT", isZambia: false },
  { code: "EG", name: "Egypt", currency: "EGP", symbol: "E£", flag: "🇪🇬", defaultTaxSystem: "VAT", isZambia: false },
  { code: "ET", name: "Ethiopia", currency: "ETB", symbol: "Br", flag: "🇪🇹", defaultTaxSystem: "Turnover Tax", isZambia: false },
];
