import { safeLocalStorage as localStorage } from "../../utils/safeStorage";
import { getActiveFeeRates } from "./PaymentService";

export interface LedgerEntry {
  id: string;
  eventId: string; // ID of the Delivery note or Payout batch or Wallet transaction
  event: "DN confirmed" | "Wallet funded" | "Payout completed" | "Payout failed/reversed";
  side: "farmer" | "offtaker";
  date: string;
  coaCode: string; // Account code e.g. "1100" (Accounts Receivable), "2010" etc.
  coaName: string; // Account name
  debit: number;
  credit: number;
  cropCycleId?: string; // tagged to crop cycle if applicable
  farmerId?: string; // e.g. "farmer-z1"
  offtakerId?: string; // e.g. "offtaker-tenant-xyz"
  lipilaRef?: string; // Lipila ref for Wallet funded or payouts
  feeRateVersion?: string; // fee-rate version for reports
  notes?: string;
  farmerFee?: number;
  offtakerFee?: number;
  grossAmount?: number;
  netAmount?: number;
}

export const LedgerService = {
  getEntries(): LedgerEntry[] {
    const saved = localStorage.getItem("mabala_ledger_entries");
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  },

  saveEntries(entries: LedgerEntry[]) {
    localStorage.setItem("mabala_ledger_entries", JSON.stringify(entries));
  },

  post(newEntries: Omit<LedgerEntry, "id">[]) {
    const existing = this.getEntries();
    const withIds = newEntries.map(e => ({
      ...e,
      id: "ledger-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now()
    }));
    const updated = [...withIds, ...existing];
    this.saveEntries(updated);

    // Trigger window event so other panels know they need to refresh their state
    window.dispatchEvent(new Event("mabala_ledger_updated"));
    console.log("[LedgerService] Posted entries:", withIds);
    return withIds;
  },

  postDNConfirmed(dn: {
    id: string;
    dnNumber: string;
    farmerId: string;
    farmerName: string;
    product: string;
    qty: number;
    unit: string;
    unitPrice: number;
    totalValue: number;
    cropCycleId?: string | null;
    createdAt?: string;
  }, offtakerId: string) {
    const date = new Date().toISOString().slice(0, 10);
    const value = dn.totalValue;

    const entries: Omit<LedgerEntry, "id">[] = [
      // 1. Farmer-side: Accrued receivable (income, unpaid), tagged to crop cycle if applicable
      {
        eventId: dn.id,
        event: "DN confirmed",
        side: "farmer",
        date,
        coaCode: "1100",
        coaName: "Accounts Receivable",
        debit: value,
        credit: 0,
        cropCycleId: dn.cropCycleId || undefined,
        farmerId: dn.farmerId,
        offtakerId,
        notes: `Accrued receivable for farmer ${dn.farmerName} via ${dn.dnNumber} (${dn.product})`,
      },
      {
        eventId: dn.id,
        event: "DN confirmed",
        side: "farmer",
        date,
        coaCode: "4000",
        coaName: "Crop Sales Revenue",
        debit: 0,
        credit: value,
        cropCycleId: dn.cropCycleId || undefined,
        farmerId: dn.farmerId,
        offtakerId,
        notes: `Recognized accrued unpaid sales revenue for ${dn.product} via ${dn.dnNumber}`,
      },
      // 2. Offtaker-side: Accrued payable against the farmer supplier
      {
        eventId: dn.id,
        event: "DN confirmed",
        side: "offtaker",
        date,
        coaCode: "5310",
        coaName: "Crop Seed & Seedling Acquisition",
        debit: value,
        credit: 0,
        cropCycleId: dn.cropCycleId || undefined,
        farmerId: dn.farmerId,
        offtakerId,
        notes: `Accrued crop procurement cost from ${dn.farmerName} via ${dn.dnNumber}`,
      },
      {
        eventId: dn.id,
        event: "DN confirmed",
        side: "offtaker",
        date,
        coaCode: "2010",
        coaName: "Accounts Payable (Trade Creditors)",
        debit: 0,
        credit: value,
        cropCycleId: dn.cropCycleId || undefined,
        farmerId: dn.farmerId,
        offtakerId,
        notes: `Accrued supply chain payable to farmer ${dn.farmerName} for ${dn.dnNumber}`,
      }
    ];

    return this.post(entries);
  },

  postWalletFunded(amount: number, lipilaRef: string, offtakerId: string) {
    const date = new Date().toISOString().slice(0, 10);

    const entries: Omit<LedgerEntry, "id">[] = [
      // Offtaker-side: Wallet asset increase, tagged with Lipila ref
      {
        eventId: lipilaRef,
        event: "Wallet funded",
        side: "offtaker",
        date,
        coaCode: "1020",
        coaName: "Mobile Money Settlement Account",
        debit: amount,
        credit: 0,
        offtakerId,
        lipilaRef,
        notes: `Lipila wallet funded with ZMW ${amount}. Ref: ${lipilaRef}`,
      },
      {
        eventId: lipilaRef,
        event: "Wallet funded",
        side: "offtaker",
        date,
        coaCode: "3010",
        coaName: "Shareholders Equity Contribution",
        debit: 0,
        credit: amount,
        offtakerId,
        lipilaRef,
        notes: `Equity capitalization source link for Lipila wallet funding: Ref ${lipilaRef}`,
      }
    ];

    return this.post(entries);
  },

  postPayoutCompleted(params: {
    payoutId: string;
    farmerId: string;
    farmerName: string;
    grossAmount: number;
    netAmount: number;
    farmerFee: number;
    offtakerFee: number;
    offtakerId: string;
    lipilaRef: string;
    cropCycleId?: string;
  }) {
    const date = new Date().toISOString().slice(0, 10);
    const rates = getActiveFeeRates();
    const feeRateVersionFlag = `F:${rates.farmer.rate}%+K${rates.farmer.flat} / O:${rates.offtaker.rate}%+K${rates.offtaker.flat}`;

    const entries: Omit<LedgerEntry, "id">[] = [
      // 1. Farmer-side: Income recognised at net amount; fee recorded as expense; receivable cleared
      {
        eventId: params.payoutId,
        event: "Payout completed",
        side: "farmer",
        date,
        coaCode: "1020",
        coaName: "Mobile Money Settlement Account", // Net cash inflow
        debit: params.netAmount,
        credit: 0,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        notes: `Farmer received net payout ZMW ${params.netAmount}`,
      },
      {
        eventId: params.payoutId,
        event: "Payout completed",
        side: "farmer",
        date,
        coaCode: "5800",
        coaName: "Transport, Logistics & Cold Chain", // Farmer fee deduction recorded as logistics/expense
        debit: params.farmerFee,
        credit: 0,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        farmerFee: params.farmerFee,
        offtakerFee: params.offtakerFee,
        feeRateVersion: feeRateVersionFlag,
        grossAmount: params.grossAmount,
        netAmount: params.netAmount,
        notes: `Mabala transaction fee deduction on farmer payout`,
      },
      {
        eventId: params.payoutId,
        event: "Payout completed",
        side: "farmer",
        date,
        coaCode: "1100",
        coaName: "Accounts Receivable", // Clear accrued receivable
        debit: 0,
        credit: params.grossAmount,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        notes: `Cleared farmer receivable following completed Lipila run`,
      },

      // 2. Offtaker-side: Wallet asset decrease (gross + offtaker fee); payable cleared; offtaker fee recorded as platform expense
      {
        eventId: params.payoutId,
        event: "Payout completed",
        side: "offtaker",
        date,
        coaCode: "2010",
        coaName: "Accounts Payable (Trade Creditors)", // Cleared supply chain payable to farmer
        debit: params.grossAmount,
        credit: 0,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        notes: `Cleared accrued trade payable to farmer ${params.farmerName}`,
      },
      {
        eventId: params.payoutId,
        event: "Payout completed",
        side: "offtaker",
        date,
        coaCode: "5800",
        coaName: "Transport, Logistics & Cold Chain", // Offtaker fee is operating expense
        debit: params.offtakerFee,
        credit: 0,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        farmerFee: params.farmerFee,
        offtakerFee: params.offtakerFee,
        feeRateVersion: feeRateVersionFlag,
        grossAmount: params.grossAmount,
        netAmount: params.netAmount,
        notes: `Recorded Mabala system platform fee as procurement/trade expense`,
      },
      {
        eventId: params.payoutId,
        event: "Payout completed",
        side: "offtaker",
        date,
        coaCode: "1020",
        coaName: "Mobile Money Settlement Account", // Wallet asset decrease (gross + offtaker fee)
        debit: 0,
        credit: params.grossAmount + params.offtakerFee,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        notes: `Lipila ledger wallet debit for gross payment and flat commissions`,
      }
    ];

    return this.post(entries);
  },

  postPayoutFailed(params: {
    payoutId: string;
    farmerId: string;
    farmerName: string;
    grossAmount: number;
    netAmount: number;
    farmerFee: number;
    offtakerFee: number;
    offtakerId: string;
    lipilaRef: string;
  }) {
    const date = new Date().toISOString().slice(0, 10);
    const rates = getActiveFeeRates();
    const feeRateVersionFlag = `F:${rates.farmer.rate}%+K${rates.farmer.flat} / O:${rates.offtaker.rate}%+K${rates.offtaker.flat}`;

    const entries: Omit<LedgerEntry, "id">[] = [
      // 1. Farmer-side: Receivable reinstated, no income recognised
      {
        eventId: params.payoutId,
        event: "Payout failed/reversed",
        side: "farmer",
        date,
        coaCode: "1100",
        coaName: "Accounts Receivable", // Replaced/reinstated receivable
        debit: params.grossAmount,
        credit: 0,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        notes: `Reinstated accrued farmer receivable after payout failure`,
      },
      {
        eventId: params.payoutId,
        event: "Payout failed/reversed",
        side: "farmer",
        date,
        coaCode: "1020",
        coaName: "Mobile Money Settlement Account", // Reversed cash inflow
        debit: 0,
        credit: params.netAmount,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        notes: `Reversed unsuccessful cash disbursement`,
      },
      {
        eventId: params.payoutId,
        event: "Payout failed/reversed",
        side: "farmer",
        date,
        coaCode: "5800",
        coaName: "Transport, Logistics & Cold Chain", // Reverse fee
        debit: 0,
        credit: params.farmerFee,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        farmerFee: params.farmerFee,
        offtakerFee: params.offtakerFee,
        feeRateVersion: feeRateVersionFlag,
        grossAmount: params.grossAmount,
        netAmount: params.netAmount,
        notes: `Reversed transaction fee deduction on failed farmer payout`,
      },

      // 2. Offtaker-side: Wallet debit + fee reversed
      {
        eventId: params.payoutId,
        event: "Payout failed/reversed",
        side: "offtaker",
        date,
        coaCode: "1020",
        coaName: "Mobile Money Settlement Account", // Wallet debit + fee reversed (Credit asset back)
        debit: params.grossAmount + params.offtakerFee,
        credit: 0,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        notes: `Refunded provisional hold wallet balance following transmission crash`,
      },
      {
        eventId: params.payoutId,
        event: "Payout failed/reversed",
        side: "offtaker",
        date,
        coaCode: "2010",
        coaName: "Accounts Payable (Trade Creditors)", // Reinstated trade payable
        debit: 0,
        credit: params.grossAmount,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        notes: `Reinstated trade payable to farmer ${params.farmerName} after bank roll`,
      },
      {
        eventId: params.payoutId,
        event: "Payout failed/reversed",
        side: "offtaker",
        date,
        coaCode: "5800",
        coaName: "Transport, Logistics & Cold Chain", // Reverse commission expense
        debit: 0,
        credit: params.offtakerFee,
        farmerId: params.farmerId,
        offtakerId: params.offtakerId,
        lipilaRef: params.lipilaRef,
        farmerFee: params.farmerFee,
        offtakerFee: params.offtakerFee,
        feeRateVersion: feeRateVersionFlag,
        grossAmount: params.grossAmount,
        netAmount: params.netAmount,
        notes: `Reversed platform commission fee following transit failure`,
      }
    ];

    return this.post(entries);
  }
};
