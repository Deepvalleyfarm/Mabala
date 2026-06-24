import React, { useState, useEffect } from "react";
import { safeLocalStorage as localStorage } from "../../utils/safeStorage";
import { 
  Plus, 
  Search, 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  ArrowRight, 
  ChevronRight, 
  Trash2, 
  Settings, 
  Shield, 
  FileText, 
  Smartphone, 
  Activity, 
  Wifi, 
  Check,
  UserCheck,
  Info
} from "lucide-react";

import { 
  initOfflineDb,
  saveToOfflineStore,
  getAllFromOfflineStore,
  deleteFromOfflineStore,
  generateLocalId,
  getTenantSubscriptionStatus,
  PendingOperation,
  queuePendingOperation,
  logOfflineAudit
} from "../../db/offline_db";

import { 
  paymentService, 
  calculateCustomFees, 
  getActiveFeeRates, 
  FeeConfigItem 
} from "./PaymentService";
import { LedgerService } from "./LedgerService";
import AgriSupplierLinkForm from "./AgriSupplierLinkForm";
import { RecordDeliveryModal } from "./RecordDeliveryModal";
import { db } from "../../firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  addDoc, 
  getDoc,
  serverTimestamp
} from "firebase/firestore";

// Helper for currency and layout
interface OfftakerPanelProps {
  currentTenantId: string;
  currentRole: string;
  userEmail: string;
  onAddLedgerEntry: (date: string, desc: string, debit: string, credit: string, amount: number, module: string) => void;
  cropCycles: any[];
  setCropCycles: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification: (msg: string, type: "success" | "warning" | "info" | "error") => void;
  isOnline: boolean;
  workspaceMode?: "Farmer" | "Veterinary" | "Offtaker";
}

export default function OfftakerPanel({
  currentTenantId,
  currentRole,
  userEmail,
  onAddLedgerEntry,
  cropCycles,
  setCropCycles,
  addNotification,
  isOnline,
  workspaceMode = "Offtaker"
}: OfftakerPanelProps) {
  
  // Tab states: 'offtaker-dashboard', 'deliveries', 'farmers', 'wallet-ledger', 'fee-config', 'farmer-sell-hub'
  const [activeSubTab, setActiveSubTab] = useState<string>(
    workspaceMode === "Farmer" ? "farmer-sell-hub" : "offtaker-dashboard"
  );

  const isFarmerWorkspace = workspaceMode === "Farmer";
  const effectiveActiveSubTab = isFarmerWorkspace ? "farmer-sell-hub" : activeSubTab;

  // Offtaker staff session sub-role: 'Offtaker Admin' | 'Offtaker Staff (Record-Only)' | 'Offtaker Staff (Record and Pay)'
  const [offtakerStaffRole, setOfftakerStaffRole] = useState<string>("Offtaker Admin");

  // Determine view mode based on role & email
  // If the user identity is "owner@mabala.com", they are the main farmer. Let's let them experience BOTH views for testability!
  // Normal offtaker roles see Offtaker Workspace only.
  const isFarmerPlayer = userEmail === "owner@mabala.com" || currentRole === "Farm Owner";
  const isPlatformAdmin = currentRole === "Platform Administrator" || userEmail === "deepvaleyfarm@gmail.com";

  // Configuration and Local DB States
  const [registeredFarmers, setRegisteredFarmers] = useState<any[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [offtakerProducts, setOfftakerProducts] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [pendingOpsCount, setPendingOpsCount] = useState<number>(0);
  const [payouts, setPayouts] = useState<any[]>([]);

  const [farmerOfftakerLinks, setFarmerOfftakerLinks] = useState<any[]>([]);
  const [adjustmentNotes, setAdjustmentNotes] = useState<any[]>([]);
  const [offtakerProfile, setOfftakerProfile] = useState<any | null>(null);
  const [allOfftakersList, setAllOfftakersList] = useState<any[]>([]);

  // Onboarding wizard states
  const [onboardStep, setOnboardStep] = useState<"form" | "post" | "completed">("form");
  const [onboardLegalName, setOnboardLegalName] = useState("");
  const [onboardPACRA, setOnboardPACRA] = useState("");
  const [onboardTPIN, setOnboardTPIN] = useState("");
  const [onboardSector, setOnboardSector] = useState<"grain" | "dairy" | "cotton" | "tobacco" | "livestock" | "other">("grain");
  const [onboardContact, setOnboardContact] = useState("");
  const [onboardDepots, setOnboardDepots] = useState("");

  const [onboardNewProdName, setOnboardNewProdName] = useState("");
  const [onboardNewProdUnit, setOnboardNewProdUnit] = useState("Kgs");
  const [onboardNewProdPrice, setOnboardNewProdPrice] = useState("");

  const [onboardStaffName, setOnboardStaffName] = useState("");
  const [onboardStaffRole, setOnboardStaffRole] = useState("Offtaker Staff (Record and Pay)");

  // Batch Payment Working Queue States
  const [showPayoutProgress, setShowPayoutProgress] = useState(false);
  const [payoutQueueTotal, setPayoutQueueTotal] = useState(0);
  const [payoutQueueCurrent, setPayoutQueueCurrent] = useState(0);
  const [payoutQueueLogs, setPayoutQueueLogs] = useState<string[]>([]);
  const [simulatePayoutTimeout, setSimulatePayoutTimeout] = useState(false);

  // Connection/Link requests States
  const [addLinkPhoneOrNRC, setAddLinkPhoneOrNRC] = useState("");
  
  // Adjustment Notes States
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState<any | null>(null);
  const [adjReason, setAdjReason] = useState("Scales moisture discount recalibration");
  const [adjQty, setAdjQty] = useState("");
  const [adjUnitPrice, setAdjUnitPrice] = useState("");
  const [adjGrade, setAdjGrade] = useState("");

  // Farmer payout panel states
  const [farmerPrefMethod, setFarmerPrefMethod] = useState<"mobile_money" | "bank_transfer">("mobile_money");
  const [farmerPrefMoMoProvider, setFarmerPrefMoMoProvider] = useState("MTN MoMo");
  const [farmerPrefPhone, setFarmerPrefPhone] = useState("");
  const [farmerPrefBankName, setFarmerPrefBankName] = useState("ZANACO");
  const [farmerPrefAccNum, setFarmerPrefAccNum] = useState("");
  const [farmerPrefAccName, setFarmerPrefAccName] = useState("");

  // Fee structure configuration state (Admin view)
  const [feesHistory, setFeesHistory] = useState<FeeConfigItem[]>([]);
  const [editFarmerRate, setEditFarmerRate] = useState<string>("2.8");
  const [editFarmerFlat, setEditFarmerFlat] = useState<string>("15.00");
  const [editOfftakerRate, setEditOfftakerRate] = useState<string>("2.8");
  const [editOfftakerFlat, setEditOfftakerFlat] = useState<string>("15.00");

  // Subscription information
  const [subValidation, setSubValidation] = useState<{ status: string; graceUntil?: string }>({ status: "active" });

  // Dialog & Insert Form States
  const [showAddFarmer, setShowAddFarmer] = useState(false);
  const [farmerNRC, setFarmerNRC] = useState("");
  const [farmerNameInput, setFarmerNameInput] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [farmerPayoutMethod, setFarmerPayoutMethod] = useState<"mobile_money" | "bank">("mobile_money");
  const [farmerProvider, setFarmerProvider] = useState("MTN");
  const [farmerBank, setFarmerBank] = useState("");
  const [farmerBankAccount, setFarmerBankAccount] = useState("");

  const [showRecordDelivery, setShowRecordDelivery] = useState(false);
  const [deliveryFarmerId, setDeliveryFarmerId] = useState("");
  const [deliveryProduct, setDeliveryProduct] = useState("");
  const [deliveryQty, setDeliveryQty] = useState("");
  const [deliveryUnit, setDeliveryUnit] = useState("Kgs");
  const [deliveryGrade, setDeliveryGrade] = useState("Grade A");
  const [deliveryUnitPrice, setDeliveryUnitPrice] = useState("");
  const [deliveryCropCycleId, setDeliveryCropCycleId] = useState("");

  const [showFundWallet, setShowFundWallet] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundMoMoNumber, setFundMoMoNumber] = useState("");
  const [fundNarration, setFundNarration] = useState("Capital Account Offtaker Wallet Funding");

  // --- Quality & Pricing Module States ---
  const [qualitySettings, setQualitySettings] = useState<any[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [editingGradeRow, setEditingGradeRow] = useState<{ productId: string; gradeId: string } | null>(null);
  
  // Temporary fields for inline row editing
  const [editGradeName, setEditGradeName] = useState("");
  const [editGradeDescription, setEditGradeDescription] = useState("");
  const [editGradePrice, setEditGradePrice] = useState<string>("0");
  const [editGradeActive, setEditGradeActive] = useState(true);

  // Add Product Category Dialog states
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("Kgs");
  const [showRecordDeliveryModal, setShowRecordDeliveryModal] = useState(false);

  // Farmer Code unique assignment states
  const [editingFarmerCodeId, setEditingFarmerCodeId] = useState<string | null>(null);
  const [tempFarmerCode, setTempFarmerCode] = useState("");
  const [isSavingFarmerCode, setIsSavingFarmerCode] = useState(false);
  
  // Farmer view: active offtaker's published price card directory loaded for the logged-in farmer
  const [publishedPricesList, setPublishedPricesList] = useState<any[]>([]);
  const [loadingPriceboard, setLoadingPriceboard] = useState(false);

  // Payout multi-selection batch state
  const [selectedDNs, setSelectedDNs] = useState<string[]>([]);
  const [isProcessingPayouts, setIsProcessingPayouts] = useState(false);

  // Load and seed standard data
  useEffect(() => {
    loadAllOfflineData();
    // Validate subscription state
    const sub = getTenantSubscriptionStatus(currentTenantId);
    setSubValidation(sub);
  }, [currentTenantId]);

  // Handle automatic syncing when connectivity status toggles online
  useEffect(() => {
    if (isOnline) {
      processSynchronizationQueue();
    }
  }, [isOnline]);

  // Force active subtab configuration in Farmer portal view
  useEffect(() => {
    if (workspaceMode === "Farmer" && activeSubTab !== "farmer-sell-hub") {
      setActiveSubTab("farmer-sell-hub");
    }
  }, [workspaceMode, activeSubTab]);

  const loadAllOfflineData = async () => {
    try {
      const dbInstance = await initOfflineDb();

      // Get registered farmers
      const offlineFarmers = await getAllFromOfflineStore("farmers");
      if (offlineFarmers.length === 0) {
        // Seed some illustrative Zambia farmer suppliers
        const seedFarmers = [
          { id: "farmer-z1", name: "Mwansa Chilufya", nrc: "112233/44/1", phone: "0977283921", payoutMethod: "mobile_money", provider: "MTN", status: "Active", farmerCode: "MBL-MWANSA" },
          { id: "farmer-z2", name: "Chileshe Bwalya", nrc: "556677/88/1", phone: "0966482012", payoutMethod: "mobile_money", provider: "Airtel", status: "Active", farmerCode: "MBL-CHILESHE" },
          { id: "farmer-z3", name: "Nalukui Mwanamwambwa", nrc: "990011/22/1", phone: "0955681029", payoutMethod: "bank", bankName: "ZANACO", bankAccount: "1002931023", status: "Active", farmerCode: "MBL-NALUKUI" }
        ];
        for (const f of seedFarmers) {
          await saveToOfflineStore("farmers", f);
        }
        setRegisteredFarmers(seedFarmers);
      } else {
        setRegisteredFarmers(offlineFarmers);
      }

      // Get products
      const offlineProducts = await getAllFromOfflineStore("offtaker_products");
      if (offlineProducts.length === 0) {
        const seedProducts = [
          { id: "prod-x1", productName: "Raw milk — Grade A", unit: "Litres", defaultUnitPrice: 14.50 },
          { id: "prod-x2", productName: "Zambia Seed Cotton — Fine Quality", unit: "Kgs", defaultUnitPrice: 18.00 },
          { id: "prod-x3", productName: "White Maize Grain", unit: "50Kg bag", defaultUnitPrice: 220.00 },
          { id: "prod-x4", productName: "Soybeans — Grade B", unit: "Kgs", defaultUnitPrice: 11.20 }
        ];
        // Save to offline storage
        for (const p of seedProducts) {
          await saveToOfflineStore("offtaker_products", p);
        }
        setOfftakerProducts(seedProducts);
      } else {
        setOfftakerProducts(offlineProducts);
      }

      // Get Delivery notes
      const offlineDN = await getAllFromOfflineStore("delivery_notes");
      if (offlineDN.length === 0) {
        const seedDN = [
          { id: "dn-1", dnNumber: "DN-2026-001", farmerId: "farmer-z1", farmerName: "Mwansa Chilufya", product: "Raw milk — Grade A", qty: 250, unit: "Litres", grade: "Grade A", unitPrice: 14.50, totalValue: 3625.00, status: "Confirmed", paymentStatus: "Unpaid", createdAt: "2026-06-18T10:00:00Z" },
          { id: "dn-2", dnNumber: "DN-2026-002", farmerId: "farmer-z2", farmerName: "Chileshe Bwalya", product: "White Maize Grain", qty: 50, unit: "50Kg bag", grade: "Grade A", unitPrice: 220.00, totalValue: 11000.00, status: "Pending", paymentStatus: "Unpaid", createdAt: "2026-06-18T14:30:00Z" }
        ];
        for (const dn of seedDN) {
          await saveToOfflineStore("delivery_notes", dn);
        }
        setDeliveryNotes(seedDN);
      } else {
        setDeliveryNotes(offlineDN);
      }

      // Wallet details & history
      const savedBalance = localStorage.getItem("offtaker_wallet_balance");
      if (savedBalance) setWalletBalance(Number(savedBalance));
      else {
        setWalletBalance(25000.00); // give 25,000 ZMW default allocation for testability
        localStorage.setItem("offtaker_wallet_balance", "25000");
      }

      const offlineTx = await getAllFromOfflineStore("wallet_transactions");
      setWalletTransactions(offlineTx);

      // Pendingoperations count
      const pending = await getAllFromOfflineStore("pending_operations");
      setPendingOpsCount(pending.length);

      // Fee configs
      const savedFees = localStorage.getItem("mabala_fee_configs");
      if (savedFees) {
        setFeesHistory(JSON.parse(savedFees));
      } else {
        localStorage.setItem("mabala_fee_configs", JSON.stringify(getActiveFeeRates()));
      }

      // Load offtakerProfile
      const savedProfileStr = localStorage.getItem(`offtaker_profile_${currentTenantId}`);
      if (savedProfileStr) {
        setOfftakerProfile(JSON.parse(savedProfileStr));
      } else {
        const offProfiles = await getAllFromOfflineStore("offtakers");
        const match = offProfiles.find((o: any) => o.tenantId === currentTenantId || o.id === currentTenantId);
        if (match) {
          setOfftakerProfile(match);
          localStorage.setItem(`offtaker_profile_${currentTenantId}`, JSON.stringify(match));
        }
      }

      // Load connection links
      const offlineLinks = await getAllFromOfflineStore("farmer_offtaker_links");
      if (offlineLinks.length === 0) {
        const seedLinks = [
          { id: "link-1", farmerId: "farmer-z1", farmerName: "Mwansa Chilufya", nrc: "112233/44/1", phone: "0977283921", offtakerId: currentTenantId, offtakerName: "Mabala Agrichain Ltd", status: "Active" },
          { id: "link-2", farmerId: "farmer-z2", farmerName: "Chileshe Bwalya", nrc: "556677/88/1", phone: "0966482012", offtakerId: currentTenantId, offtakerName: "Mabala Agrichain Ltd", status: "Pending" },
          { id: "link-3", farmerId: "farmer-z3", farmerName: "Nalukui Mwanamwambwa", nrc: "990011/22/1", phone: "0955681029", offtakerId: currentTenantId, offtakerName: "Mabala Agrichain Ltd", status: "Active" }
        ];
        for (const l of seedLinks) {
          await saveToOfflineStore("farmer_offtaker_links", l);
        }
        setFarmerOfftakerLinks(seedLinks);
      } else {
        setFarmerOfftakerLinks(offlineLinks);
      }

      // Load adjustment notes
      const offlineAdjustments = await getAllFromOfflineStore("adjustment_notes");
      setAdjustmentNotes(offlineAdjustments);

      // Load all offtakers list
      const offlineOfftakers = await getAllFromOfflineStore("offtakers");
      if (offlineOfftakers.length === 0) {
        const seedOfftakers = [
          { id: "offtaker-tenant-1", tenantId: "offtaker-tenant-1", legalName: "Mabala Agrichain Ltd", registrationNumber: "MAB-2026-9281", tpin: "1002391039", sector: "grain", status: "active", depotLocations: ["Choma central depot", "Lusaka industrial area"] },
          { id: "offtaker-tenant-2", tenantId: "offtaker-tenant-2", legalName: "Zambia Dairy Co-op", registrationNumber: "ZDC-2025-10293", tpin: "3302919230", sector: "dairy", status: "active", depotLocations: ["Mazabuka collection hub", "Kafue refrigeration depot"] }
        ];
        for (const o of seedOfftakers) {
          await saveToOfflineStore("offtakers", o);
        }
        setAllOfftakersList(seedOfftakers);
      } else {
        setAllOfftakersList(offlineOfftakers);
      }

      // Fill Farmer Preference default values
      const activePrefStr = localStorage.getItem(`farmer_payout_pref_Mwansa`);
      if (activePrefStr) {
        const pref = JSON.parse(activePrefStr);
        setFarmerPrefMethod(pref.method);
        setFarmerPrefMoMoProvider(pref.provider);
        setFarmerPrefPhone(pref.phone);
        setFarmerPrefBankName(pref.bankName);
        setFarmerPrefAccNum(pref.accNum);
        setFarmerPrefAccName(pref.accName);
      } else {
        setFarmerPrefMethod("mobile_money");
        setFarmerPrefMoMoProvider("MTN MoMo");
        setFarmerPrefPhone("0977283921");
        setFarmerPrefBankName("ZANACO");
        setFarmerPrefAccNum("1002931023");
        setFarmerPrefAccName("Mwansa Chilufya");
      }

    } catch (e) {
      console.error("Failed to seed and initialize offline layer structures:", e);
    }
  };

  // Sync Queue worker
  const processSynchronizationQueue = async () => {
    const queue: PendingOperation[] = await getAllFromOfflineStore("pending_operations");
    if (queue.length === 0) return;

    addNotification(`🔄 Connecting to clearing pipes... Syncing ${queue.length} pending offline records safely`, "info");
    
    // In order of queue structure, process action syncs
    for (const op of queue) {
      op.syncStatus = "Synchronizing";
      await saveToOfflineStore("pending_operations", op);

      try {
        // Mock server push or actual Firestore Rest synchronization
        // Simulation delay so it looks beautiful on the dashboard
        await new Promise(r => setTimeout(r, 800));

        // Complete operation and drop from pending_operations
        await deleteFromOfflineStore("pending_operations", op.operationId);
        
        // Log Audit trail to ledger
        await logOfflineAudit({
          eventType: "Sync Completed",
          timestamp: new Date().toISOString(),
          userId: userEmail,
          tenantId: currentTenantId,
          module: op.module,
          action: `${op.action} Synced`,
          syncStatus: "Success"
        });
      } catch (err) {
        op.syncStatus = "Failed";
        op.retryCount += 1;
        await saveToOfflineStore("pending_operations", op);
        console.error("Offline sync error on item:", op, err);
      }
    }

    // Refresh pending counter state
    const refreshedQueue = await getAllFromOfflineStore("pending_operations");
    setPendingOpsCount(refreshedQueue.length);
    if (refreshedQueue.length === 0) {
      addNotification("✅ Synchronization completed! Firestore is now the authority.", "success");
    } else {
      addNotification("⚠️ Synchronisation experienced interrupted CORS. Will re-attempt when network stabilizes.", "warning");
    }
    loadAllOfflineData();
  };

  // --- Quality & Pricing handlers ---
  const loadQualitySettings = async () => {
    setIsLoadingSettings(true);
    try {
      const qSnapshot = await getDocs(collection(db, "offtakers", currentTenantId, "qualitySettings"));
      const settingsList: any[] = [];
      qSnapshot.forEach((docSnapshot) => {
        settingsList.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });

      if (settingsList.length > 0) {
        setQualitySettings(settingsList);
      } else {
        const defaultSettings = offtakerProducts.map((prod) => {
          const standardGrades = [
            { gradeId: "A", gradeName: "Grade A", description: "Clean, dry, no visible damage, moisture < 13%", pricePerUnit: prod.defaultUnitPrice || 15.00, active: true },
            { gradeId: "B", gradeName: "Grade B", description: "Slight impurity, moisture < 14%", pricePerUnit: Number(((prod.defaultUnitPrice || 15.00) * 0.9).toFixed(2)), active: true },
            { gradeId: "Premium", gradeName: "Premium", description: "Hand-sorted premium quality selection", pricePerUnit: Number(((prod.defaultUnitPrice || 15.00) * 1.15).toFixed(2)), active: false },
            { gradeId: "Reject", gradeName: "Reject", description: "Impurities > 50% or moisture > 15%", pricePerUnit: Number(((prod.defaultUnitPrice || 15.00) * 0.4).toFixed(2)), active: true }
          ];
          return {
            id: prod.id,
            productId: prod.id,
            productName: prod.productName,
            unit: prod.unit,
            grades: standardGrades,
            lastPublished: null,
            lastPublishedBy: null,
            history: []
          };
        });
        setQualitySettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error loading quality settings from firestore:", error);
      const defaultSettings = offtakerProducts.map((prod) => {
        const standardGrades = [
          { gradeId: "A", gradeName: "Grade A", description: "Clean, dry, no visible damage, moisture < 13%", pricePerUnit: prod.defaultUnitPrice || 15.00, active: true },
          { gradeId: "B", gradeName: "Grade B", description: "Slight impurity, moisture < 14%", pricePerUnit: Number(((prod.defaultUnitPrice || 15.00) * 0.9).toFixed(2)), active: true },
          { gradeId: "Premium", gradeName: "Premium", description: "Hand-sorted premium quality selection", pricePerUnit: Number(((prod.defaultUnitPrice || 15.00) * 1.15).toFixed(2)), active: false },
          { gradeId: "Reject", gradeName: "Reject", description: "Impurities > 50% or moisture > 15%", pricePerUnit: Number(((prod.defaultUnitPrice || 15.00) * 0.4).toFixed(2)), active: true }
        ];
        return {
          id: prod.id,
          productId: prod.id,
          productName: prod.productName,
          unit: prod.unit,
          grades: standardGrades,
          lastPublished: null,
          lastPublishedBy: null,
          history: []
        };
      });
      setQualitySettings(defaultSettings);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const registerFarmerCodesOnFirestore = async () => {
    try {
      for (const f of registeredFarmers) {
        if (f.farmerCode) {
          const codeRef = doc(db, "offtakers", currentTenantId, "farmerCodes", f.farmerCode.trim().toUpperCase());
          const snapshot = await getDoc(codeRef);
          if (!snapshot.exists()) {
            await setDoc(codeRef, {
              farmerId: f.id,
              assignedAt: new Date().toISOString()
            });
          }
        }
      }
    } catch (e) {
      console.warn("Silent seeding of farmer codes was blocked:", e);
    }
  };

  const loadPriceboardForFarmer = async () => {
    setLoadingPriceboard(true);
    try {
      const compiled: any[] = [];
      for (const offtaker of allOfftakersList) {
        const qSnapshot = await getDocs(collection(db, "offtakers", offtaker.id || offtaker.tenantId, "qualitySettings"));
        const productsList: any[] = [];
        qSnapshot.forEach((docSnapshot) => {
          productsList.push(docSnapshot.data());
        });
        
        let lastPublishDate: string | null = null;
        productsList.forEach(p => {
          if (p.lastPublished) {
            if (!lastPublishDate || p.lastPublished > lastPublishDate) {
              lastPublishDate = p.lastPublished;
            }
          }
        });

        compiled.push({
          offtakerId: offtaker.id || offtaker.tenantId,
          offtakerName: offtaker.legalName,
          sector: offtaker.sector,
          lastPublished: lastPublishDate,
          products: productsList
        });
      }
      setPublishedPricesList(compiled);
    } catch (e) {
      console.error("Failed to load price board directories for farmer:", e);
    } finally {
      setLoadingPriceboard(false);
    }
  };

  useEffect(() => {
    if (currentTenantId && offtakerProducts.length > 0) {
      loadQualitySettings();
    }
  }, [currentTenantId, offtakerProducts]);

  useEffect(() => {
    if (registeredFarmers.length > 0 && currentTenantId) {
      registerFarmerCodesOnFirestore();
    }
  }, [registeredFarmers, currentTenantId]);

  useEffect(() => {
    if (activeSubTab === "farmer-sell-hub" && allOfftakersList.length > 0) {
      loadPriceboardForFarmer();
    }
  }, [activeSubTab, allOfftakersList]);

  const handleAddNewProductCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      addNotification("Please provide a product category name", "warning");
      return;
    }
    const cleanName = newProductName.trim();
    const cleanUnit = newProductUnit.trim();

    const newId = "prod-" + Date.now();
    const newProduct = {
      id: newId,
      productId: newId,
      productName: cleanName,
      unit: cleanUnit,
      grades: [
        { gradeId: "A", gradeName: "Grade A", description: "Clean and premium quality", pricePerUnit: 10.05, active: true },
        { gradeId: "B", gradeName: "Grade B", description: "Standard commercial quality", pricePerUnit: 8.50, active: true }
      ],
      lastPublished: null,
      lastPublishedBy: null,
      history: []
    };

    setQualitySettings(prev => [...prev, newProduct]);
    
    await saveToOfflineStore("offtaker_products", {
      id: newId,
      productName: cleanName,
      unit: cleanUnit,
      defaultUnitPrice: 10.05
    });
    
    const refreshedProds = await getAllFromOfflineStore("offtaker_products");
    setOfftakerProducts(refreshedProds);

    setNewProductName("");
    setShowAddProductModal(false);
    addNotification(`Product "${cleanName}" added. Make sure to Publish Changes when ready!`, "success");
  };

  const handleAddNewGrade = (productId: string) => {
    const freshGradeId = "grade-" + Date.now();
    const newGrade = {
      gradeId: freshGradeId,
      gradeName: "New Grade",
      description: "Define quality specifications (e.g., Moisture %)",
      pricePerUnit: 0.00,
      active: true
    };

    setQualitySettings(prev => prev.map(prod => {
      if (prod.productId === productId || prod.id === productId) {
        return {
          ...prod,
          grades: [...prod.grades, newGrade]
        };
      }
      return prod;
    }));

    setEditingGradeRow({ productId, gradeId: freshGradeId });
    setEditGradeName("New Grade");
    setEditGradeDescription("Define quality specifications");
    setEditGradePrice("0.00");
    setEditGradeActive(true);
  };

  const handleSaveInlineGradeEdit = (productId: string, gradeId: string) => {
    const numPrice = parseFloat(editGradePrice);
    if (isNaN(numPrice) || numPrice < 0) {
      addNotification("Please enter a valid non-negative price per unit", "warning");
      return;
    }
    if (!editGradeName.trim()) {
      addNotification("Grade Name is required", "warning");
      return;
    }

    setQualitySettings(prev => prev.map(prod => {
      if (prod.productId === productId || prod.id === productId) {
        const updatedGrades = prod.grades.map((g: any) => {
          if (g.gradeId === gradeId) {
            return {
              ...g,
              gradeName: editGradeName.trim(),
              description: editGradeDescription.trim(),
              pricePerUnit: Number(numPrice.toFixed(2)),
              active: editGradeActive
            };
          }
          return g;
        });
        return { ...prod, grades: updatedGrades };
      }
      return prod;
    }));

    setEditingGradeRow(null);
    addNotification("Grade updated locally. Click 'Publish Changes' to sync with farmers.", "info");
  };

  const handlePublishPrices = async () => {
    setIsLoadingSettings(true);
    try {
      const publishTimestamp = new Date().toISOString();
      const publishBy = userEmail || "Offtaker Admin";
      const offtakerName = offtakerProfile?.legalName || "Mabala Agrichain Ltd";

      // 1. Loop through each product quality setting and publish to Firestore
      for (const product of qualitySettings) {
        const logEntry = {
          changedAt: publishTimestamp,
          changedBy: publishBy,
          details: `Published quality grade schedule upgrade containing ${product.grades.length} grades.`
        };

        const updatedHistory = [logEntry, ...(product.history || [])];

        const docRef = doc(db, "offtakers", currentTenantId, "qualitySettings", product.id || product.productId);
        await setDoc(docRef, {
          productName: product.productName,
          unit: product.unit,
          grades: product.grades,
          lastPublished: publishTimestamp,
          lastPublishedBy: publishBy,
          history: updatedHistory
        });
      }

      // 2. Loop through registeredFarmers and write notifications + SMS
      const activeGradesToNotify: any[] = [];
      qualitySettings.forEach(p => {
        p.grades.forEach((g: any) => {
          if (g.active) {
            activeGradesToNotify.push({
              productName: p.productName,
              gradeName: g.gradeName,
              price: g.pricePerUnit,
              unit: p.unit
            });
          }
        });
      });

      for (const farmer of registeredFarmers) {
        for (const item of activeGradesToNotify) {
          const titleText = `Price Update from ${offtakerName}`;
          const bodyText = `${item.productName} Grade ${item.gradeName} is now ZMW ${item.price}/${item.unit}`;
          
          try {
            const notifId = generateLocalId("NOTIF");
            const notifRef = doc(db, "farmers", farmer.id || farmer.farmerUid || "anonymous", "notifications", notifId);
            await setDoc(notifRef, {
              title: titleText,
              body: bodyText,
              read: false,
              createdAt: publishTimestamp,
              offtakerUid: currentTenantId
            });
          } catch (notifErr) {
            console.warn(`Could not dispatch in-app notification to farmer ${farmer.id || farmer.farmerUid}:`, notifErr);
          }

          const rawPhone = farmer.phone || farmer.mobileNumber;
          if (rawPhone && rawPhone.replace(/\D/g, "").length >= 9) {
            const smsMessage = `Mabala Info: ${titleText}. ${bodyText}.`;
            try {
              await fetch("/api/lipila/send-sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phone: rawPhone,
                  message: smsMessage
                })
              });
            } catch (smsErr) {
              console.warn(`SMS distribution proxy failed for ${rawPhone}: `, smsErr);
            }
          }
        }
      }

      await loadQualitySettings();
      addNotification("🚀 Dynamic Price schedules published successfully! SMS broad-casted to suppliers.", "success");
    } catch (err: any) {
      console.error("Publishing quality grades failed: ", err);
      addNotification("Failed to upload quality pricing specs: " + err.message, "error");
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleUpdateFarmerCode = async (farmerId: string, oldCode: string, newCode: string) => {
    if (!newCode.trim()) {
      addNotification("Farmer Code cannot be empty", "error");
      return;
    }
    const cleanNewCode = newCode.trim().toUpperCase();
    const cleanOldCode = oldCode ? oldCode.trim().toUpperCase() : "";

    if (cleanNewCode === cleanOldCode) {
      setEditingFarmerCodeId(null);
      return;
    }

    setIsSavingFarmerCode(true);
    try {
      const newCodeRef = doc(db, "offtakers", currentTenantId, "farmerCodes", cleanNewCode);
      
      await setDoc(newCodeRef, {
        farmerId: farmerId,
        assignedAt: new Date().toISOString()
      });

      if (cleanOldCode) {
        const oldCodeRef = doc(db, "offtakers", currentTenantId, "farmerCodes", cleanOldCode);
        await deleteDoc(oldCodeRef);
      }

      setRegisteredFarmers(prev => prev.map(f => {
        if (f.id === farmerId) {
          return { ...f, farmerCode: cleanNewCode };
        }
        return f;
      }));

      const matchedFarmer = registeredFarmers.find(f => f.id === farmerId);
      if (matchedFarmer) {
        await saveToOfflineStore("farmers", {
          ...matchedFarmer,
          farmerCode: cleanNewCode
        });
      }

      addNotification(`🎉 Farmer Code ${cleanNewCode} successfully assigned!`, "success");
      setEditingFarmerCodeId(null);
    } catch (error: any) {
      console.error("Failed to assign unique farmer code:", error);
      addNotification("⚠️ Farmer Code is already taken or invalid. Must be unique per offtaker.", "error");
    } finally {
      setIsSavingFarmerCode(false);
    }
  };

  // -----------------------------
  // HANDLERS
  // -----------------------------

  const handleRegisterFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerNameInput || !farmerNRC) {
      addNotification("NRC Number & Full Name are required components.", "warning");
      return;
    }

    // Tenant checking validation
    if (subValidation.status === "expired") {
      addNotification("Offline Access Requires An Active Paid Subscription. Locked.", "error");
      return;
    }

    const newFarmer = {
      id: generateLocalId("FRM"),
      name: farmerNameInput,
      nrc: farmerNRC,
      phone: farmerPhone || "0977000000",
      payoutMethod: farmerPayoutMethod,
      provider: farmerProvider,
      bankName: farmerBank,
      bankAccount: farmerBankAccount,
      status: "Active"
    };

    try {
      await saveToOfflineStore("farmers", newFarmer);
      addNotification(`Farmer ${newFarmer.name} registered locally!`, "success");

      // Save operation in sync queue
      await queuePendingOperation({
        operationId: `sync-${Date.now()}`,
        tenantId: currentTenantId,
        module: "farmers",
        action: "Create",
        payload: newFarmer,
        timestamp: new Date().toISOString(),
        syncStatus: "Pending",
        retryCount: 0
      });

      setRegisteredFarmers(prev => [...prev, newFarmer]);
      setPendingOpsCount(prev => prev + 1);
      setShowAddFarmer(false);
      
      // Clear fields
      setFarmerNameInput("");
      setFarmerNRC("");
      setFarmerPhone("");
    } catch (e) {
      addNotification("Error registry offline.", "error");
    }
  };

  const handleRecordDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryFarmerId || !deliveryProduct || !deliveryQty || !deliveryUnitPrice) {
      addNotification("Please record product, farmer, rate amount, and quantity.", "warning");
      return;
    }

    if (subValidation.status === "expired") {
      addNotification("Offline Access requires an active paid subscription. Locked.", "error");
      return;
    }

    const selectedFarmer = registeredFarmers.find(f => f.id === deliveryFarmerId);
    if (!selectedFarmer) return;

    const value = Number(deliveryQty) * Number(deliveryUnitPrice);
    
    // Create new delivery note
    const newDN = {
      id: generateLocalId("DN"),
      dnNumber: `DN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000).toString()}`,
      farmerId: deliveryFarmerId,
      farmerName: selectedFarmer.name,
      product: deliveryProduct,
      qty: Number(deliveryQty),
      unit: deliveryUnit,
      grade: deliveryGrade,
      unitPrice: Number(deliveryUnitPrice),
      totalValue: value,
      cropCycleId: deliveryCropCycleId || null,
      status: "Confirmed",
      paymentStatus: "Unpaid",
      createdAt: new Date().toISOString()
    };

    try {
      await saveToOfflineStore("delivery_notes", newDN);
      
      // Queue Offline operation
      await queuePendingOperation({
        operationId: `sync-${Date.now()}`,
        tenantId: currentTenantId,
        module: "delivery_notes",
        action: "Create",
        payload: newDN,
        timestamp: new Date().toISOString(),
        syncStatus: "Pending",
        retryCount: 0
      });

      // Post into parent system ledger rules automatically
      onAddLedgerEntry(
        new Date().toISOString().slice(0, 10),
        `Accrued payable created against supplier farmer ${selectedFarmer.name} via ${newDN.dnNumber}`,
        "Expense", // Accrued Debit
        "Asset",
        value,
        "offtaker"
      );

      // Post into central dual-entry ledger
      LedgerService.postDNConfirmed(newDN, userEmail || currentTenantId);

      // Link Crop Margin if cropCycleId selected
      if (deliveryCropCycleId) {
        setCropCycles(prev => prev.map(c => {
          if (c.id === deliveryCropCycleId) {
            return {
              ...c,
              revenueLinked: (c.revenueLinked || 0) + value
            };
          }
          return c;
        }));
      }

      addNotification(`Delivery note ${newDN.dnNumber} recorded successfully!`, "success");
      setDeliveryNotes(prev => [newDN, ...prev]);
      setPendingOpsCount(prev => prev + 1);
      setShowRecordDelivery(false);

      // Clear fields
      setDeliveryFarmerId("");
      setDeliveryProduct("");
      setDeliveryQty("");
      setDeliveryUnitPrice("");
      setDeliveryCropCycleId("");
    } catch (err) {
      addNotification("Error caching delivery transaction.", "error");
    }
  };

  const handleFundWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(fundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      addNotification("Value must be a positive number.", "warning");
      return;
    }

    addNotification(`Initiating Lipila Wallet fund collection for ZMW ${amountNum}...`, "info");
    
    // Call abstraction check
    try {
      const response = await paymentService.collect({
        referenceId: `ref-${Date.now()}`,
        amount: amountNum,
        narration: fundNarration,
        accountNumber: fundMoMoNumber || "0977112233",
        email: userEmail
      });

      if (response.status === "Pending" || response.status === "Successful") {
        const newBal = walletBalance + amountNum;
        setWalletBalance(newBal);
        localStorage.setItem("offtaker_wallet_balance", String(newBal));

        const tx = {
          id: generateLocalId("TX"),
          type: "fund",
          amount: amountNum,
          lipilaRef: response.referenceId,
          createdAt: new Date().toISOString(),
          narration: fundNarration
        };
        await saveToOfflineStore("wallet_transactions", tx);
        setWalletTransactions(prev => [tx, ...prev]);

        // Post ledger entries for cash movement
        onAddLedgerEntry(
          new Date().toISOString().slice(0, 10),
          `Funded Offtaker wallet via Lipila: Ref ${response.referenceId}`,
          "Asset",
          "Equity",
          amountNum,
          "offtaker"
        );

        // Post to LedgerService
        LedgerService.postWalletFunded(amountNum, response.referenceId, userEmail || currentTenantId);

        addNotification(`Wallet credited with K ${amountNum} successfully!`, "success");
        setShowFundWallet(false);
        setFundAmount("");
      }
    } catch (e) {
      addNotification("Payment transaction failed.", "error");
    }
  };

  // Farmer confirm/dispute logic
  const handleUpdateDNStatus = async (id: string, newStatus: "Confirmed" | "Disputed") => {
    const matched = deliveryNotes.find(d => d.id === id);
    if (!matched) return;

    const updated = { ...matched, status: newStatus };
    await saveToOfflineStore("delivery_notes", updated);

    // Sync state
    await queuePendingOperation({
      operationId: `sync-${Date.now()}`,
      tenantId: currentTenantId,
      module: "delivery_notes",
      action: "Update",
      payload: updated,
      timestamp: new Date().toISOString(),
      syncStatus: "Pending",
      retryCount: 0
    });

    if (newStatus === "Confirmed") {
      LedgerService.postDNConfirmed(updated, userEmail || currentTenantId);
    }

    setDeliveryNotes(prev => prev.map(d => d.id === id ? updated : d));
    setPendingOpsCount(prev => prev + 1);
    addNotification(`Delivery note status updated to ${newStatus}.`, "success");
  };

  // Onboarding Submit handler
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardLegalName || !onboardPACRA || !onboardTPIN || !onboardContact) {
      addNotification("Please complete all onboarding form fields.", "warning");
      return;
    }

    const newProfile = {
      id: currentTenantId,
      tenantId: currentTenantId,
      legalName: onboardLegalName,
      registrationNumber: onboardPACRA,
      tpin: onboardTPIN,
      sector: onboardSector,
      primaryContact: onboardContact,
      status: "active",
      depotLocations: onboardDepots ? onboardDepots.split(",").map(s => s.trim()) : ["Central Hub Depot"]
    };

    try {
      await saveToOfflineStore("offtakers", newProfile);
      setOfftakerProfile(newProfile);
      localStorage.setItem(`offtaker_profile_${currentTenantId}`, JSON.stringify(newProfile));
      
      // Auto-initialize wallet to balance = 0
      setWalletBalance(0);
      localStorage.setItem("offtaker_wallet_balance", "0");

      addNotification("Offtaker self-onboarding registered! Wallet initialized to K 0.00.", "success");
      setOnboardStep("post"); // Go to step to prompt optionally adding products and inviting staff
    } catch (err) {
      addNotification("Onboarding register failed.", "error");
    }
  };

  const handleOnboardAddProduct = async () => {
    if (!onboardNewProdName || !onboardNewProdPrice) {
      addNotification("Please enter product name and unit price.", "warning");
      return;
    }
    const newProd = {
      id: generateLocalId("PROD"),
      offtakerId: currentTenantId,
      productName: onboardNewProdName,
      unit: onboardNewProdUnit,
      defaultUnitPrice: Number(onboardNewProdPrice),
      gradeTags: ["Grade A", "Grade B"],
      active: true
    };
    try {
      await saveToOfflineStore("offtaker_products", newProd);
      setOfftakerProducts(prev => [...prev, newProd]);
      setOnboardNewProdName("");
      setOnboardNewProdPrice("");
      addNotification(`Catalog product "${newProd.productName}" added successfully.`, "success");
    } catch (err) {
      addNotification("Failed adding product.", "error");
    }
  };

  const handleOnboardAddStaffSubmit = async () => {
    if (!onboardStaffName) {
      addNotification("Please provide staff member name.", "warning");
      return;
    }
    addNotification(`Staff member "${onboardStaffName}" invited successfully as ${onboardStaffRole}!`, "success");
    setOnboardStaffName("");
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem(`offtaker_profile_${currentTenantId}`);
    setOfftakerProfile(null);
    setOnboardStep("form");
    setOnboardLegalName("");
    setOnboardPACRA("");
    setOnboardTPIN("");
    setOnboardContact("");
    setOnboardDepots("");
    addNotification("Onboarding status cleared for demonstration/reset.", "info");
  };

  // Farmer confirm action handler (download PDF invoice dummy printout!)
  const handleFarmerConfirmDN = async (id: string) => {
    const matched = deliveryNotes.find(d => d.id === id);
    if (!matched) return;

    const updated = { ...matched, status: "Confirmed", confirmationDate: new Date().toISOString() };
    await saveToOfflineStore("delivery_notes", updated);
    setDeliveryNotes(prev => prev.map(d => d.id === id ? updated : d));
    
    // Post to ledger
    LedgerService.postDNConfirmed(updated, userEmail || currentTenantId);

    // Auto-update crops panel's revenueLinked when a delivery with crop links is confirmed!
    if (matched.cropCycleId) {
      setCropCycles(prev => prev.map(c => {
        if (c.id === matched.cropCycleId) {
          return { ...c, revenueLinked: (c.revenueLinked || 0) + matched.totalValue };
        }
        return c;
      }));
    }

    addNotification(`Delivery note ${matched.dnNumber} has been CONFIRMED by you! Receipts are ready.`, "success");
    triggerReceiptPrintout(updated);
  };

  const handleFarmerDisputeDN = async (id: string) => {
    const matched = deliveryNotes.find(d => d.id === id);
    if (!matched) return;
    const updated = { ...matched, status: "Disputed" };
    await saveToOfflineStore("delivery_notes", updated);
    setDeliveryNotes(prev => prev.map(d => d.id === id ? updated : d));
    addNotification(`Delivery note ${matched.dnNumber} has been marked as disputed. Aggregator notified.`, "warning");
  };

  // 48h deadline simulator
  const handleSimulate48hDeadline = async () => {
    let count = 0;
    const updated = deliveryNotes.map(dn => {
      if (dn.status === "Pending") {
        count++;
        // If it links crop cycle, update revenue
        if (dn.cropCycleId) {
          setCropCycles(prev => prev.map(c => {
            if (c.id === dn.cropCycleId) {
              return { ...c, revenueLinked: (c.revenueLinked || 0) + dn.totalValue };
            }
            return c;
          }));
        }
        const confirmedDN = { ...dn, status: "Confirmed", autoConfirmed: true, confirmationDate: new Date().toISOString() };
        // Post each auto-confirmed DN to ledger
        LedgerService.postDNConfirmed(confirmedDN, userEmail || currentTenantId);
        return confirmedDN;
      }
      return dn;
    });

    for (const item of updated) {
      if (item.autoConfirmed) {
        await saveToOfflineStore("delivery_notes", item);
      }
    }
    setDeliveryNotes(updated);
    if (count > 0) {
      addNotification(`Auto-confirmation deadline elapsed simulated: ${count} pending delivery notes confirmed!`, "success");
    } else {
      addNotification("No pending delivery notes to auto-confirm.", "info");
    }
  };

  // Farmer Preference update
  const handleFarmerUpdatePreferenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prefObj = {
      method: farmerPrefMethod,
      provider: farmerPrefMoMoProvider,
      phone: farmerPrefPhone,
      bankName: farmerPrefBankName,
      accNum: farmerPrefAccNum,
      accName: farmerPrefAccName
    };
    localStorage.setItem(`farmer_payout_pref_Mwansa`, JSON.stringify(prefObj));
    
    // If payout preferences updated, sync back into registeredFarmers Mwansa's mock profile info
    setRegisteredFarmers(prev => prev.map(f => {
      if (f.id === "farmer-z1") {
        return {
          ...f,
          payoutMethod: farmerPrefMethod === "mobile_money" ? "mobile_money" : "bank",
          provider: farmerPrefMoMoProvider,
          bankAccount: farmerPrefMethod === "bank_transfer" ? farmerPrefAccNum : "",
          bankName: farmerPrefMethod === "bank_transfer" ? farmerPrefBankName : ""
        };
      }
      return f;
    }));

    addNotification("Your settlement and payout preferences updated successfully!", "success");
  };

  // Connection Linking Handlers
  const handleFarmerRequestConnection = async (offtakerId: string) => {
    const offObj = allOfftakersList.find(o => o.id === offtakerId || o.tenantId === offtakerId);
    if (!offObj) return;

    // Check if link already exists
    const existing = farmerOfftakerLinks.find(l => l.offtakerId === offtakerId && l.farmerId === "farmer-z1");
    if (existing) {
      addNotification("A connection request with this offtaker is already pending or active.", "warning");
      return;
    }

    const newLink = {
      id: generateLocalId("LNK"),
      farmerId: "farmer-z1",
      farmerName: "Mwansa Chilufya",
      nrc: "112233/44/1",
      phone: "0977283921",
      offtakerId: offtakerId,
      offtakerName: offObj.legalName,
      status: "Pending",
      initiatedBy: "farmer"
    };

    await saveToOfflineStore("farmer_offtaker_links", newLink);
    setFarmerOfftakerLinks(prev => [...prev, newLink]);
    addNotification(`Connection request sent to ${offObj.legalName}. Awaiting approval.`, "info");
  };

  const handleFarmerApproveLinkRequest = async (linkId: string) => {
    const matched = farmerOfftakerLinks.find(l => l.id === linkId);
    if (!matched) return;

    const updated = { ...matched, status: "Active" };
    await saveToOfflineStore("farmer_offtaker_links", updated);
    setFarmerOfftakerLinks(prev => prev.map(l => l.id === linkId ? updated : l));
    addNotification(`Connection request from ${matched.offtakerName} approved! Double-signed connection is ACTIVE.`, "success");
  };

  const handleFarmerDeclineLinkRequest = async (linkId: string) => {
    setFarmerOfftakerLinks(prev => prev.filter(l => l.id !== linkId));
    addNotification("Connection request declined and dismissed.", "info");
  };

  const handleOfftakerApproveLinkRequest = async (linkId: string) => {
    const matched = farmerOfftakerLinks.find(l => l.id === linkId);
    if (!matched) return;

    const updated = { ...matched, status: "Active" };
    await saveToOfflineStore("farmer_offtaker_links", updated);
    setFarmerOfftakerLinks(prev => prev.map(l => l.id === linkId ? updated : l));
    addNotification(`Farmer connection request from ${matched.farmerName} approved! Double-signed connection is ACTIVE.`, "success");
  };

  const handleOfftakerDeclineLinkRequest = async (linkId: string) => {
    setFarmerOfftakerLinks(prev => prev.filter(l => l.id !== linkId));
    addNotification("Farmer connection request declined.", "info");
  };

  const handleAddLinkFromOfftakerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addLinkPhoneOrNRC) {
      addNotification("Please enter Farmer phone or NRC number.", "warning");
      return;
    }

    // Match farmer
    const matchedFarmer = registeredFarmers.find(f => f.phone === addLinkPhoneOrNRC || f.nrc === addLinkPhoneOrNRC);
    if (matchedFarmer) {
      const existing = farmerOfftakerLinks.find(l => l.farmerId === matchedFarmer.id && l.offtakerId === currentTenantId);
      if (existing) {
        addNotification("A connection with this farmer is already pending or active.", "warning");
        return;
      }

      const newLink = {
        id: generateLocalId("LNK"),
        farmerId: matchedFarmer.id,
        farmerName: matchedFarmer.name,
        nrc: matchedFarmer.nrc,
        phone: matchedFarmer.phone,
        offtakerId: currentTenantId,
        offtakerName: offtakerProfile?.legalName || "Mabala Agrichain Ltd",
        status: "Pending",
        initiatedBy: "offtaker"
      };

      await saveToOfflineStore("farmer_offtaker_links", newLink);
      setFarmerOfftakerLinks(prev => [...prev, newLink]);
      addNotification(`Connection request registered for ${matchedFarmer.name}. Connection status is Pending until farmer confirms in-app.`, "success");
      setAddLinkPhoneOrNRC("");
    } else {
      // Invite path
      addNotification(`No existing farmer matched phone/NRC "${addLinkPhoneOrNRC}". Outbound SMS invitation dispatched! An invite record has been pre-staged for when they signup.`, "info");
      setAddLinkPhoneOrNRC("");
    }
  };

  // Adjustment Note submitting
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjustmentDialog) return;
    const dn = showAdjustmentDialog;

    const newQty = Number(adjQty);
    const newPrice = Number(adjUnitPrice);
    
    if (isNaN(newQty) || newQty <= 0 || isNaN(newPrice) || newPrice <= 0) {
      addNotification("Please input positive quantities and rates.", "warning");
      return;
    }

    const originalTotalValue = dn.totalValue || dn.total_value || (dn.qty * dn.unitPrice);
    const newTotalValue = newQty * newPrice;
    const valueDelta = newTotalValue - originalTotalValue;

    const newNote = {
      id: generateLocalId("ADJ"),
      originalDnId: dn.id,
      dnNumber: dn.dnNumber,
      reason: adjReason,
      fieldChanges: {
        qty: { from: dn.qty || dn.quantity, to: newQty },
        unitPrice: { from: dn.unitPrice, to: newPrice },
        grade: { from: dn.grade || dn.gradeTag, to: adjGrade },
        totalValue: { from: originalTotalValue, to: newTotalValue }
      },
      createdBy: userEmail,
      approvedBy: "Platform System Controller",
      createdAt: new Date().toISOString()
    };

    const updatedDN = {
      ...dn,
      qty: newQty,
      quantity: newQty,
      unitPrice: newPrice,
      grade: adjGrade,
      gradeTag: adjGrade,
      totalValue: newTotalValue,
      status: "Confirmed",
      adjustmentNote: newNote
    };

    try {
      await saveToOfflineStore("adjustment_notes", newNote);
      await saveToOfflineStore("delivery_notes", updatedDN);

      setAdjustmentNotes(prev => [newNote, ...prev]);
      setDeliveryNotes(prev => prev.map(item => item.id === dn.id ? updatedDN : item));

      // Post delta change in main systems ledgers
      if (valueDelta !== 0) {
        onAddLedgerEntry(
          new Date().toISOString().slice(0, 10),
          `Moisture / scale adjustment offset for ${dn.dnNumber}: Value Delta K ${valueDelta.toFixed(2)}`,
          valueDelta >= 0 ? "Expense" : "Revenue",
          "Asset",
          Math.abs(valueDelta),
          "offtaker"
        );
      }

      // If linked crop cycle, update the crops panel's revenue
      if (dn.cropCycleId) {
        setCropCycles(prev => prev.map(c => {
          if (c.id === dn.cropCycleId) {
            return { ...c, revenueLinked: (c.revenueLinked || 0) + valueDelta };
          }
          return c;
        }));
      }

      addNotification(`Adjustment note ${newNote.id} written. Delivery note updated to K ${newTotalValue.toFixed(2)}.`, "success");
      setShowAdjustmentDialog(null);
    } catch (err) {
      addNotification("Filing adjustment failed.", "error");
    }
  };

  const triggerReceiptPrintout = (dn: any) => {
    // Generate simple readable itemised receipt console print layout
    const content = `
==============================================
           MABALA ACCRUED RECEIPT         
==============================================
Receipt Ref:  REC-${dn.dnNumber}
Timestamp:    ${dn.confirmationDate || new Date().toISOString()}
Buyer:        ${dn.offtakerName || "Certified Mabala Aggregator"}
Farmer:       Mwansa Chilufya
NRC:          112233/44/1
----------------------------------------------
Product:      ${dn.product}
Net Quantity: ${dn.qty || dn.quantity} ${dn.unit}
Grade Class:  ${dn.grade || dn.gradeTag}
Unit Value:   ZMW ${(dn.unitPrice || 0).toFixed(2)}
----------------------------------------------
GROSS DUE:    ZMW ${(dn.totalValue || 0).toFixed(2)}
MABALA FEE:   ZMW ${calculateCustomFees(dn.totalValue || (dn.qty * dn.unitPrice)).farmerFee.toFixed(2)}
NET PAYOUT:   ZMW ${calculateCustomFees(dn.totalValue || (dn.qty * dn.unitPrice)).netToFarmer.toFixed(2)}
----------------------------------------------
STATUS:       ${dn.status} (Verified)
==============================================
    Thank you for choosing Mabala.cloud
`;
    console.log(content);
    alert(content);
  };

  const handleToggleSelectDN = (id: string) => {
    setSelectedDNs(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Payout disburment calculations
  const handleProcessSelectedPayments = async () => {
    if (selectedDNs.length === 0) return;

    // Scoped role permission validation
    if (offtakerStaffRole === "Offtaker Staff (Record-Only)") {
      addNotification("Permission Denied: Your assigned Offtaker Staff role is Record-Only. You do not have authorization to initiate payouts or clear transactions from the Lipila Wallet.", "error");
      return;
    }

    // Premium status verification
    if (subValidation.status === "expired") {
      addNotification("Offline access has expired or is blocked. Subscription required.", "error");
      return;
    }

    const dnsToPay = deliveryNotes.filter(d => selectedDNs.includes(d.id) && d.paymentStatus === "Unpaid");
    if (dnsToPay.length === 0) return;

    const totalGrosValue = dnsToPay.reduce((acc, current) => acc + current.totalValue, 0);
    const fees = calculateCustomFees(totalGrosValue);

    if (walletBalance < fees.totalOfftakerDebit) {
      addNotification(`Insufficient wallet balance. Total ledger debit required: K ${fees.totalOfftakerDebit.toFixed(2)}. Available balance: K ${walletBalance.toFixed(2)}.`, "error");
      return;
    }

    // Initialize Animated Working Batch Progress Queue
    setIsProcessingPayouts(true);
    setShowPayoutProgress(true);
    setPayoutQueueTotal(dnsToPay.length);
    setPayoutQueueCurrent(0);
    setPayoutQueueLogs(["Initializing Lipila Payout Gateway connection...", "Deducting wallet balance provisionally..."]);

    // Deduct provisional wallet balance (idempotently hold)
    const provisionalBal = walletBalance - fees.totalOfftakerDebit;
    setWalletBalance(provisionalBal);
    localStorage.setItem("offtaker_wallet_balance", String(provisionalBal));

    // Post initial payouts entries as pending-clearing
    const newPayoutItems: any[] = [];

    // Loop through individual delivery notes to process disbursements sequentially
    let finalSuccess = true;
    const uniqueFarmerIds: string[] = Array.from(new Set(dnsToPay.map(d => String(d.farmerId))));

    // Simulate API process delays
    for (let index = 0; index < uniqueFarmerIds.length; index++) {
      const fId = uniqueFarmerIds[index];
      const farmerObj = registeredFarmers.find(x => x.id === fId);
      if (!farmerObj) continue;

      const fDNs = dnsToPay.filter(d => d.farmerId === fId);
      const farmerGross = fDNs.reduce((acc, c) => acc + c.totalValue, 0);
      const farmerFeeSplit = calculateCustomFees(farmerGross);
      
      setPayoutQueueCurrent(index + 1);
      setPayoutQueueLogs(prev => [
        ...prev, 
        `Routing K ${farmerFeeSplit.netToFarmer.toFixed(2)} to ${farmerObj.name} (${farmerObj.phone || "Bank Transfer"})...`
      ]);

      // Delay for animates progress
      await new Promise(r => setTimeout(r, 1200));

      if (simulatePayoutTimeout) {
        // If simulated timeout
        finalSuccess = false;
        setPayoutQueueLogs(prev => [
          ...prev,
          `❌ [LIPILA GATEWAY TIMEOUT] Payout attempt failed for ${farmerObj.name}. Rail transmission error.`
        ]);
        break;
      } else {
        // Successful payment api disburse
        setPayoutQueueLogs(prev => [
          ...prev,
          `✅ [SUCCESS] Settlement cleared for ${farmerObj.name}. Reference: Ref-${Date.now().toString().slice(-6)}`
        ]);

        const pId = generateLocalId("PAY");
        const payoutItem = {
          id: pId,
          farmerId: fId,
          farmerName: farmerObj.name,
          grossAmount: farmerGross,
          netAmount: farmerFeeSplit.netToFarmer,
          farmerFee: farmerFeeSplit.farmerFee,
          status: "completed",
          payoutMethod: farmerObj.bankAccount ? "bank" : "mobile_money",
          phoneOrAccount: farmerObj.bankAccount || farmerObj.phone,
          provider: farmerObj.provider || "MTN",
          createdAt: new Date().toISOString()
        };
        newPayoutItems.push(payoutItem);
      }
    }

    await new Promise(r => setTimeout(r, 800));

    if (finalSuccess) {
      // CLEAR SUCCESS STATE
      setPayoutQueueLogs(prev => [...prev, "Writing permanent ledger audits...", "Confirming settlement receipts..."]);
      
      // Update DNs in storage
      const updatedNotes = deliveryNotes.map(d => {
        if (selectedDNs.includes(d.id)) {
          return { ...d, paymentStatus: "Paid", payoutId: generateLocalId("PAY") };
        }
        return d;
      });

      for (const note of updatedNotes) {
        if (selectedDNs.includes(note.id)) {
          await saveToOfflineStore("delivery_notes", note);
        }
      }
      setDeliveryNotes(updatedNotes);

      // Write WalletTransactions (debit & fee)
      const debitTx = {
        id: generateLocalId("TX"),
        type: "debit",
        amount: totalGrosValue,
        lipilaRef: `LP-${Date.now().toString().slice(-8)}`,
        createdAt: new Date().toISOString(),
        narration: `Settle deliveries batch: ${selectedDNs.join(", ")}`
      };
      const feeTx = {
        id: generateLocalId("TX"),
        type: "fee",
        amount: fees.offtakerFee,
        lipilaRef: `LP-FEE-${Date.now().toString().slice(-8)}`,
        createdAt: new Date().toISOString(),
        narration: `Mabala system offtaker fee collection`
      };

      await saveToOfflineStore("wallet_transactions", debitTx);
      await saveToOfflineStore("wallet_transactions", feeTx);
      setWalletTransactions(prev => [debitTx, feeTx, ...prev]);

      // Save payouts history logs and post payout completed events to finance engine
      for (const p of newPayoutItems) {
        await saveToOfflineStore("payouts", p);
        setPayouts(prev => [p, ...prev]);

        const itemFees = calculateCustomFees(p.grossAmount);
        LedgerService.postPayoutCompleted({
          payoutId: p.id,
          farmerId: p.farmerId,
          farmerName: p.farmerName,
          grossAmount: p.grossAmount,
          netAmount: p.netAmount,
          farmerFee: p.farmerFee,
          offtakerFee: itemFees.offtakerFee,
          offtakerId: currentTenantId,
          lipilaRef: p.id
        });
      }

      // Record standard posts to double entry ledger
      onAddLedgerEntry(
        new Date().toISOString().slice(0, 10),
        `Payout disburment settlement: gross K ${totalGrosValue} net K ${fees.netToFarmer}`,
        "Revenue",
        "Asset",
        fees.netToFarmer,
        "offtaker"
      );

      onAddLedgerEntry(
        new Date().toISOString().slice(0, 10),
        `Wallet ledger payout debit matching gross K ${totalGrosValue} + fees K ${fees.offtakerFee}`,
        "Liability",
        "Asset",
        fees.totalOfftakerDebit,
        "offtaker"
      );

      addNotification(`Settled disbursements for ZMW ${totalGrosValue.toFixed(2)}. Farmer Net: ZMW ${fees.netToFarmer.toFixed(2)}`, "success");
      setSelectedDNs([]);
    } else {
      // ROLLBACK FAILURE STATE - IDEMPOTENCY SAFETY GATE
      setPayoutQueueLogs(prev => [
        ...prev, 
        "⚠️ [REVERSAL ROOT] Executing automated transaction safety rollback...",
        "Reversing wallet provision-hold debit K " + fees.totalOfftakerDebit.toFixed(2) + "...",
        "Reinstating delivery notes back to unpaid status..."
      ]);

      // Post failed/reversed events to the double-entry finance ledger
      for (const fId of uniqueFarmerIds) {
        const fDNs = dnsToPay.filter(d => d.farmerId === fId);
        const farmerGross = fDNs.reduce((acc, c) => acc + c.totalValue, 0);
        const farmerFeeSplit = calculateCustomFees(farmerGross);
        const farmerObj = registeredFarmers.find(x => x.id === fId);
        const farmerName = farmerObj ? farmerObj.name : "Unknown Farmer";

        LedgerService.postPayoutFailed({
          payoutId: "fail-" + Date.now().toString().slice(-6),
          farmerId: fId,
          farmerName,
          grossAmount: farmerGross,
          netAmount: farmerFeeSplit.netToFarmer,
          farmerFee: farmerFeeSplit.farmerFee,
          offtakerFee: farmerFeeSplit.offtakerFee,
          offtakerId: currentTenantId,
          lipilaRef: "REV-ERR-" + Date.now().toString().slice(-4)
        });
      }

      // Restore wallet balance
      const restoredBal = walletBalance; // walletBalance was already provisionally deducted
      setWalletBalance(restoredBal + fees.totalOfftakerDebit);
      localStorage.setItem("offtaker_wallet_balance", String(restoredBal + fees.totalOfftakerDebit));

      // Re-stage transaction reversal log
      const reversalTx = {
        id: generateLocalId("TX"),
        type: "reversal",
        amount: fees.totalOfftakerDebit,
        lipilaRef: `LP-REV-${Date.now().toString().slice(-8)}`,
        createdAt: new Date().toISOString(),
        narration: `Automated reversal for timed out settlement batch`
      };
      await saveToOfflineStore("wallet_transactions", reversalTx);
      setWalletTransactions(prev => [reversalTx, ...prev]);

      await new Promise(r => setTimeout(r, 1200));
      addNotification("Payment rail cleared failed / timed out. Automated safety rollback completed.", "error");
    }

    setIsProcessingPayouts(false);
  };

  const handleUpdateAdminFees = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfigs: FeeConfigItem[] = [
      {
        side: "farmer",
        ratePercent: Number(editFarmerRate),
        flatFee: Number(editFarmerFlat),
        effectiveFrom: new Date().toISOString(),
        setBy: userEmail,
        notes: "Admin adjustment card entry"
      },
      {
        side: "offtaker",
        ratePercent: Number(editOfftakerRate),
        flatFee: Number(editOfftakerFlat),
        effectiveFrom: new Date().toISOString(),
        setBy: userEmail,
        notes: "Admin adjustment card entry"
      }
    ];

    localStorage.setItem("mabala_fee_configs", JSON.stringify(updatedConfigs));
    setFeesHistory(updatedConfigs);
    addNotification("Platform ledger transaction fees successfully configured dynamic versioning!", "success");
  };

  // View specific subsets
  const unpaidDNNotes = deliveryNotes.filter(d => d.paymentStatus === "Unpaid");

  return (
    <div className="space-y-6" id="offtaker-marketplace-parent-container">

      {/* Connectivity & License Banner */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 font-sans select-none shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl">
            <Smartphone className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <span>Mabala Offtaker Gateway</span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold border border-emerald-500/25">
                  <Wifi className="w-2.5 h-2.5" />
                  <span>Online</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold border border-amber-500/25">
                  <Wifi className="w-2.5 h-2.5 animate-pulse" />
                  <span>Offline Mode</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Zambian Farmer Trade, Liquidation Settlement & Accruals Clearing Module.
            </p>
          </div>
        </div>

        {/* License Badges */}
        <div className="flex items-center gap-2">
          {subValidation.status === "active" ? (
            <span className="px-3 py-1 font-bold bg-emerald-500/10 text-emerald-400 text-[11px] uppercase rounded-full border border-emerald-500/20">
              🟢 Offline Enabled (Active SaaS)
            </span>
          ) : subValidation.status === "grace_period" ? (
            <span className="px-3 py-1 font-bold bg-amber-500/10 text-amber-400 text-[11px] uppercase rounded-full border border-amber-500/20">
              🟡 Off-Access Expires Shortly (Grace Period)
            </span>
          ) : (
            <span className="px-3 py-1 font-bold bg-rose-500/10 text-rose-400 text-[11px] uppercase rounded-full border border-rose-500/20 animate-pulse">
              🔴 Offline Access Disabled (Locked)
            </span>
          )}

          {pendingOpsCount > 0 && (
            <span className="px-3 py-1 font-bold bg-sky-500 text-white text-[11px] uppercase rounded-full animate-bounce">
              {pendingOpsCount} Pending Syncs
            </span>
          )}
        </div>
      </div>

      {workspaceMode === "Offtaker" && !offtakerProfile ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-3xl mx-auto shadow-sm space-y-6 animate-fade-in text-slate-800" id="offtaker-onboarding-wizard-container">
          <div className="space-y-2 text-center pb-4 border-b border-slate-100">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] uppercase font-black tracking-widest rounded-full border border-emerald-500/15">
              Agricultural Offtaker Registration
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Onboard Your Offtaker Profile</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Activate your direct settlement pipelines, define product purchase catalogs, and verify corporate PACRA parameters instantly.
            </p>
          </div>

          {onboardStep === "form" && (
            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Legal business Name</label>
                  <input
                    type="text"
                    required
                    value={onboardLegalName}
                    onChange={(e) => setOnboardLegalName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white text-slate-850"
                    placeholder="e.g. Lusaka Grain Silos PLC"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">PACRA Registration Number</label>
                  <input
                    type="text"
                    required
                    value={onboardPACRA}
                    onChange={(e) => setOnboardPACRA(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white text-slate-850"
                    placeholder="e.g. PACRA-2026-90218"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">TPIN Number</label>
                  <input
                    type="text"
                    required
                    value={onboardTPIN}
                    onChange={(e) => setOnboardTPIN(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white text-slate-850"
                    placeholder="e.g. 1003491820"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Primary Contact Email / Phone</label>
                  <input
                    type="text"
                    required
                    value={onboardContact}
                    onChange={(e) => setOnboardContact(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white text-slate-850"
                    placeholder="e.g. contact@offtaker.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Purchase Sector Focus</label>
                  <select
                    value={onboardSector}
                    onChange={(e) => setOnboardSector(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none bg-slate-50 focus:bg-white text-slate-850"
                  >
                    <option value="grain">Grains (White Maize, Soy, Wheat)</option>
                    <option value="dairy">Dairy (Fresh milk, Cheese ingredients)</option>
                    <option value="cotton">Cotton & Fibres</option>
                    <option value="tobacco">Tobacco Products</option>
                    <option value="livestock">Livestock & Beef meat</option>
                    <option value="other">Other Agriculture crops</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Depot Locations (Comma separated)</label>
                  <input
                    type="text"
                    value={onboardDepots}
                    onChange={(e) => setOnboardDepots(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none bg-slate-50 focus:bg-white text-slate-850"
                    placeholder="e.g. Choma Silo A, Kafue Storage Hub"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl cursor-pointer transition-all shadow-md"
              >
                Submit PACRA Verification & Complete Onboarding
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOnboardLegalName("Mabala Agrichain Ltd");
                    setOnboardPACRA("MAB-2026-9281");
                    setOnboardTPIN("1002391039");
                    setOnboardContact("info@mabala.cloud");
                    setOnboardSector("grain");
                    setOnboardDepots("Choma depot, Lusaka depot");
                    addNotification("Pre-filled demo corporate profile credentials.", "info");
                  }}
                  className="text-[10px] text-indigo-600 hover:underline cursor-pointer font-bold"
                >
                  ⚡ Fast Pre-fill Demo Profile
                </button>
              </div>
            </form>
          )}

          {onboardStep === "post" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                <div className="p-1.5 bg-emerald-500 rounded-full text-white">✓</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Your profile is active under PACRA verification logs!</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Wallet created with balance 0. Complete setup options below or optionally proceed to analytics dashboards.
                  </p>
                </div>
              </div>

              {/* Persistent Wallet Warning Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-amber-800 uppercase">Warning: Wallet is currently unfunded</span>
                  <p className="text-xs text-amber-950 font-semibold leading-normal">Fund your wallet via Lipila before paying farmers.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Catalog adder */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 block font-mono">1. Custom product Catalog Price List</span>
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={onboardNewProdName}
                      onChange={(e) => setOnboardNewProdName(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs font-sans outline-none text-slate-850"
                      placeholder="Product (e.g. Grade A Soya)"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={onboardNewProdUnit}
                        onChange={(e) => setOnboardNewProdUnit(e.target.value)}
                        className="border border-slate-200 bg-white rounded-lg p-2 text-xs outline-none text-slate-850"
                      >
                        <option value="Kgs">Kgs</option>
                        <option value="Litres">Litres</option>
                        <option value="Bags">Bags</option>
                        <option value="Tons">Tons</option>
                      </select>
                      <input
                        type="number"
                        value={onboardNewProdPrice}
                        onChange={(e) => setOnboardNewProdPrice(e.target.value)}
                        className="border border-slate-200 bg-white rounded-lg p-2 text-xs font-mono outline-none text-slate-850"
                        placeholder="Price (ZMW)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleOnboardAddProduct}
                      className="w-full py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-[10px] uppercase rounded-lg cursor-pointer transition-all"
                    >
                      Add Custom Product
                    </button>
                  </div>
                </div>

                {/* Invite Staff */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 block font-mono">2. Invite Scoped Staff Members</span>
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={onboardStaffName}
                      onChange={(e) => setOnboardStaffName(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs outline-none text-slate-850"
                      placeholder="Staff Member full Name"
                    />
                    <select
                      value={onboardStaffRole}
                      onChange={(e) => setOnboardStaffRole(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs outline-none text-slate-850"
                    >
                      <option value="Offtaker Staff (Record-Only)">Record-Only permissions</option>
                      <option value="Offtaker Staff (Record and Pay)">Record and Pay permissions</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleOnboardAddStaffSubmit}
                      className="w-full py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-[10px] uppercase rounded-lg cursor-pointer transition-all"
                    >
                      Invite Staff Role
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOnboardStep("completed")}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all border-none"
                >
                  Setup Finished. Continue to Analytics Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleResetOnboarding}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Persona Role Switcher Panel */}
          {workspaceMode !== "Farmer" && (
            <div className="bg-indigo-50/60 border border-indigo-100 p-4.5 rounded-2xl flex flex-wrap items-center justify-between gap-4" id="offtaker-persona-role-switcher-panel">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 font-mono tracking-wider">Active Offtaker Persona & Scoped Permissions Router</span>
                <p className="text-xs text-indigo-950 font-semibold leading-normal">
                  Switch between offtaker company administration and scoped staff roles to test permission rules and dual-signed delivery clearances.
                </p>
              </div>
              
              <div className="flex bg-white border border-indigo-100 p-1 rounded-xl shadow-xs gap-1">
                {["Offtaker Admin", "Offtaker Staff (Record-Only)", "Offtaker Staff (Record & Pay)"].map((roleOpt) => {
                  const actualRole = roleOpt === "Offtaker Staff (Record & Pay)" ? "Offtaker Staff (Record and Pay)" : roleOpt;
                  const isSel = offtakerStaffRole === actualRole;
                  return (
                    <button
                      key={roleOpt}
                      type="button"
                      onClick={() => setOfftakerStaffRole(actualRole)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        isSel ? "bg-[#0f172a] text-white shadow-xs" : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      {roleOpt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs Menu Navigation */}
          {workspaceMode !== "Farmer" && (
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveSubTab("offtaker-dashboard")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSubTab === "offtaker-dashboard"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                📈 Offtaker Analytics
              </button>

              <button
                onClick={() => setActiveSubTab("deliveries")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSubTab === "deliveries"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                🧾 Delivery Notes Accruals ({deliveryNotes.length})
              </button>

              <button
                onClick={() => setActiveSubTab("farmers")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSubTab === "farmers"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                🌾 Farmers Registry ({registeredFarmers.length})
              </button>

              <button
                onClick={() => setActiveSubTab("wallet-ledger")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSubTab === "wallet-ledger"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                💼 Lipila Wallet Balance
              </button>

              <button
                onClick={() => setActiveSubTab("quality-pricing")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSubTab === "quality-pricing"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                ⚙️ Quality & Pricing
              </button>

              {isFarmerPlayer && (
                <button
                  onClick={() => setActiveSubTab("farmer-sell-hub")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer bg-[#FFF9E6] border border-amber-300 text-amber-900`}
                >
                  🌽 Farmer Portal ("Sell to Offtakers")
                </button>
              )}

              {isPlatformAdmin && (
                <button
                  onClick={() => setActiveSubTab("fee-config")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer bg-slate-900 hover:bg-slate-800 text-slate-100`}
                >
                  ⚙️ Platform Fee Config (Admin Only)
                </button>
              )}
            </div>
          )}

      {/* TAB CONTENT: OFFTAKER ANALYTICS */}
      {effectiveActiveSubTab === "offtaker-dashboard" && workspaceMode !== "Farmer" && (
        <div className="space-y-6 animate-fade-in text-slate-900 font-sans">
          
          {/* Dashboard Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Mabala Active Wallet</span>
              <span className="text-3xl font-black block mt-2 text-slate-900 font-mono">
                ZK {walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span>✔ Synced via Secured Lipila Pipe</span>
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Unpaid Accrual notes</span>
              <span className="text-3xl font-black block mt-2 text-rose-600 font-mono">
                ZK {unpaidDNNotes.reduce((acc, c) => acc + c.totalValue, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">
                {unpaidDNNotes.length} pending confirm/payment receipts
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Registered Agri-Suppliers</span>
              <span className="text-3xl font-black block mt-2 text-slate-900 font-mono">
                {registeredFarmers.length}
              </span>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">
                Active certified farmers linked on pacra
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Pending Sync Queue</span>
              <span className={`text-3xl font-black block mt-2 font-mono ${pendingOpsCount > 0 ? "text-sky-600 animate-pulse" : "text-slate-400"}`}>
                {pendingOpsCount}
              </span>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">
                Saves stored locally on IndexedDb
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono mb-4">Depot Agent Operations Center</h4>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowRecordDelivery(true)}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Farmer Delivery</span>
              </button>

              <button
                onClick={() => setShowAddFarmer(true)}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Link & Onboard New Farmer</span>
              </button>

              <button
                onClick={() => setShowFundWallet(true)}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Wallet className="w-4 h-4" />
                <span>Fund Wallet (Lipila mobile money)</span>
              </button>
            </div>
          </div>

          {/* Guidelines on Payout Fees - PRD Section */}
          <div className="p-5 bg-sky-50/50 border border-sky-100 rounded-2xl space-y-3 font-sans text-xs text-slate-700">
            <h5 className="font-extrabold text-sky-950 flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-600" />
              <span>Configurable Dual-Sided Clearance Fees Matrix</span>
            </h5>
            <p className="leading-relaxed text-[11px] text-sky-900">
              Pursuant to Mabala revenue auditing regulations, every crop/milk delivery settlement cleared through the platform Lipila pipes splits fees independently:
            </p>
            <ul className="list-disc pl-5 text-[11px] space-y-1 text-slate-600">
              <li><strong>Farmer-side fee</strong>: Default <strong>2.8% + K15.00</strong> deducted natively from gross payout before final disbursement.</li>
              <li><strong>Offtaker-side fee</strong>: Default <strong>2.8% + K15.00</strong> added to the wallet debit allocation at payment time.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DELIVERY NOTES */}
      {effectiveActiveSubTab === "deliveries" && workspaceMode !== "Farmer" && (
        <div className="space-y-6 animate-fade-in text-slate-900 font-sans">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 border border-slate-200/80 rounded-2xl gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Pending & Confirmed Delivery Accruals</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Unpaid delivery notes can be grouped and settled. Farmer gets disbursed net amounts automatically via MoMo / Bank.</p>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowRecordDeliveryModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Delivery</span>
              </button>

              {selectedDNs.length > 0 && (
                <button
                  onClick={handleProcessSelectedPayments}
                  disabled={isProcessingPayouts}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow transition"
                >
                  <span>{isProcessingPayouts ? "Authorizing Payouts..." : `Payout Selected (${selectedDNs.length})`}</span>
                </button>
              )}
            </div>
          </div>

          {/* Deliveries Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 uppercase text-[9.5px] font-black text-slate-500 font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5 w-10">Select</th>
                  <th className="p-3.5">Ref ID</th>
                  <th className="p-3.5">Agri Supplier</th>
                  <th className="p-3.5">Product & Quantity</th>
                  <th className="p-3.5">Unit Price</th>
                  <th className="p-3.5">Total Value (Gross)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveryNotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic font-medium">No recorded deliveries found inside this tenant organizational scope.</td>
                  </tr>
                ) : (
                  deliveryNotes.map(dn => {
                    const isSelected = selectedDNs.includes(dn.id);
                    const isUnpaid = dn.paymentStatus === "Unpaid";
                    
                    return (
                      <tr key={dn.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3.5 pl-5">
                          {isUnpaid ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectDN(dn.id)}
                              className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                          ) : (
                            <div className="w-4 h-4 bg-emerald-100 rounded flex items-center justify-center text-emerald-600">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 font-bold font-mono text-slate-700">{dn.dnNumber}</td>
                        <td className="p-3.5 text-slate-700 font-medium">{dn.farmerName}</td>
                        <td className="p-3.5 text-slate-600">
                          <span className="font-bold text-slate-800">{dn.qty}</span> {dn.unit} of {dn.product}
                          <span className="block text-[10px] text-slate-400 font-semibold uppercase">{dn.grade}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">ZK {dn.unitPrice.toFixed(2)}</td>
                        <td className="p-3.5 font-bold font-mono text-slate-900">ZK {dn.totalValue.toFixed(2)}</td>
                        <td className="p-3.5">
                          <div className="flex gap-1">
                            {dn.status === "Pending" ? (
                              <>
                                <button
                                  onClick={() => handleUpdateDNStatus(dn.id, "Confirmed")}
                                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleUpdateDNStatus(dn.id, "Disputed")}
                                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold rounded cursor-pointer"
                                >
                                  Dispute
                                </button>
                              </>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                dn.status === "Confirmed" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                              }`}>
                                {dn.status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            dn.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse"
                          }`}>
                            {dn.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FARMERS REGISTRY */}
      {effectiveActiveSubTab === "farmers" && workspaceMode !== "Farmer" && (
        <div className="space-y-6 animate-fade-in text-slate-900 font-sans">
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Linked Supplier Directory</h3>
              <p className="text-[11px] text-slate-500">Mabala reuses farmer entities natively to avoid profile silos. Local cache persist directories.</p>
            </div>
            
            <button
              onClick={() => setShowAddFarmer(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Link New Farmer</span>
            </button>
          </div>

          {/* Directory grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {registeredFarmers.map(farmer => (
              <div key={farmer.id} className="p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-sm transition space-y-4">
                <div className="flex gap-3 justify-between items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm font-mono">
                    {farmer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {farmer.status || "Active"}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-800 mt-1">{farmer.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono mt-0.5">NRC: {farmer.nrc}</p>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1.5 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span>Active contact:</span>
                    <strong className="text-slate-700">{farmer.phone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Payout Rail:</span>
                    <strong className="text-slate-700 capitalize">
                      {farmer.payoutMethod === "mobile_money" 
                        ? `${farmer.provider} Mobile Money` 
                        : `${farmer.bankName || "Bank"} (A/C: ...${(farmer.bankAccount || "").slice(-4)})`}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl mt-2 font-mono">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Farmer Code:</span>
                    {editingFarmerCodeId === farmer.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempFarmerCode}
                          onChange={(e) => setTempFarmerCode(e.target.value)}
                          className="px-1.5 py-0.5 border border-slate-300 rounded text-xs w-24 uppercase font-bold text-slate-800"
                          placeholder="e.g. FM-123"
                          disabled={isSavingFarmerCode}
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateFarmerCode(farmer.id, farmer.farmerCode || "", tempFarmerCode)}
                          className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                          disabled={isSavingFarmerCode}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingFarmerCodeId(null)}
                          className="px-1 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                          disabled={isSavingFarmerCode}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded-lg border border-indigo-100">
                          {farmer.farmerCode || "NOT_ASSIGNED"}
                        </span>
                        <button
                          onClick={() => {
                            setEditingFarmerCodeId(farmer.id);
                            setTempFarmerCode(farmer.farmerCode || "");
                          }}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center p-1 font-sans font-bold cursor-pointer transition hover:bg-slate-200 rounded"
                          title="Edit Farmer Code"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: QUALITY & PRICING SETTINGS */}
      {effectiveActiveSubTab === "quality-pricing" && workspaceMode !== "Farmer" && (
        <div className="space-y-6 animate-fade-in text-slate-900 font-sans">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 border border-slate-200/80 rounded-2xl gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Quality Classification & Price Settings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Define crop grades, pricing per unit, and active toggles. Make sure to publish changes to broadcast SMS updates to linked suppliers.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-200 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product Category</span>
              </button>

              <button
                onClick={handlePublishPrices}
                disabled={isLoadingSettings || qualitySettings.length === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow transition disabled:opacity-50"
              >
                <span>{isLoadingSettings ? "Publishing..." : "Publish & Notify Farmers"}</span>
              </button>
            </div>
          </div>

          {qualitySettings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 italic">
              No products found or initialized. Click "Add Product Category" above to construct your crop catalog.
            </div>
          ) : (
            <div className="space-y-6">
              {qualitySettings.map((product) => (
                <div key={product.id || product.productId} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-5 py-4 border-b border-slate-200/80 flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        🌾 {product.productName}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider font-mono">
                        Unit of Measure: <span className="text-slate-600 font-bold">{product.unit}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddNewGrade(product.id || product.productId)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-lg transition border border-indigo-100"
                    >
                      + Add Grade Scale
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50/55 uppercase text-[9.5px] font-black text-slate-500 font-mono tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3.5 pl-5">Grade Name</th>
                          <th className="p-3.5">Quality Specifications Description</th>
                          <th className="p-3.5">Price Per Unit (ZMW)</th>
                          <th className="p-3.5">Status Check</th>
                          <th className="p-3.5 text-right pr-5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!product.grades || product.grades.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 font-medium italic">
                              No grade scales registered under this category yet. Click Add Grade to populate.
                            </td>
                          </tr>
                        ) : (
                          product.grades.map((grade: any) => {
                            const isEditingThisRow = editingGradeRow?.productId === (product.id || product.productId) && editingGradeRow?.gradeId === grade.gradeId;
                            
                            return (
                              <tr key={grade.gradeId} className="hover:bg-slate-50/30 transition">
                                <td className="p-3.5 pl-5 font-bold text-slate-700">
                                  {isEditingThisRow ? (
                                    <input
                                      type="text"
                                      value={editGradeName}
                                      onChange={(e) => setEditGradeName(e.target.value)}
                                      className="px-2 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 w-32"
                                    />
                                  ) : (
                                    <span>{grade.gradeName}</span>
                                  )}
                                </td>

                                <td className="p-3.5 text-slate-600 font-medium">
                                  {isEditingThisRow ? (
                                    <input
                                      type="text"
                                      value={editGradeDescription}
                                      onChange={(e) => setEditGradeDescription(e.target.value)}
                                      className="px-2 py-1 border border-slate-300 rounded text-xs text-slate-800 w-full"
                                    />
                                  ) : (
                                    <span>{grade.description}</span>
                                  )}
                                </td>

                                <td className="p-3.5 font-bold text-slate-800">
                                  {isEditingThisRow ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-400 text-xs">ZMW</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editGradePrice}
                                        onChange={(e) => setEditGradePrice(e.target.value)}
                                        className="px-2 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 w-24"
                                      />
                                    </div>
                                  ) : (
                                    <span className="bg-indigo-50/50 text-indigo-950 px-2 py-0.5 rounded font-mono text-xs border border-indigo-100/50">
                                      ZMW {grade.pricePerUnit.toFixed(2)}
                                    </span>
                                  )}
                                </td>

                                <td className="p-3.5">
                                  {isEditingThisRow ? (
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={editGradeActive}
                                        onChange={(e) => setEditGradeActive(e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600"
                                      />
                                      <span className="text-xs text-slate-600 font-bold">Show to Farmer</span>
                                    </label>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                      grade.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-400"
                                    }`}>
                                      {grade.active ? "Active" : "Inactive"}
                                    </span>
                                  )}
                                </td>

                                <td className="p-3.5 text-right pr-5">
                                  {isEditingThisRow ? (
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        onClick={() => handleSaveInlineGradeEdit(product.id || product.productId, grade.gradeId)}
                                        className="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-[10px]"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingGradeRow(null)}
                                        className="px-2 py-1 bg-slate-250 text-slate-700 rounded font-bold text-[10px] border border-slate-300/80"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEditingGradeRow({ productId: product.id || product.productId, gradeId: grade.gradeId });
                                        setEditGradeName(grade.gradeName);
                                        setEditGradeDescription(grade.description);
                                        setEditGradePrice(grade.pricePerUnit.toString());
                                        setEditGradeActive(!!grade.active);
                                      }}
                                      className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 font-bold transition hover:bg-slate-100 rounded text-[10px]"
                                    >
                                      ✏️ Edit Grade
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50/50 px-5 py-3 border-t border-slate-150 flex justify-between items-center text-[10px] text-slate-400">
                    <div className="flex gap-1 items-center">
                      <span>Status:</span>
                      {product.lastPublished ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Published</span>
                      ) : (
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Draft Issues</span>
                      )}
                    </div>

                    <span>
                      {product.lastPublished ? (
                        <span>Last published: <strong>{new Date(product.lastPublished).toLocaleString()}</strong> by <strong>{product.lastPublishedBy}</strong></span>
                      ) : (
                        <span>Not published yet. Changes will stay local until published.</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Historical price log ledger */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Dynamic Price Publication Changes History</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Chronological system log audit trail captured during live grade adjustments and broadcasting runs.</p>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 uppercase text-[9px] font-black text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-mono">Timestamp</th>
                    <th className="p-3">Category Affected</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Details Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {(() => {
                    const compiledHistory: any[] = [];
                    qualitySettings.forEach(prod => {
                      if (prod.history) {
                        prod.history.forEach((h: any) => {
                          compiledHistory.push({
                            timestamp: h.changedAt,
                            productName: prod.productName,
                            operator: h.changedBy,
                            details: h.details
                          });
                        });
                      }
                    });

                    // Sort chronologically desc
                    const sortedHistory = compiledHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                    if (sortedHistory.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="p-5 text-center text-slate-400 italic font-medium">No external pricing adjustments published from this portal tenant folder.</td>
                        </tr>
                      );
                    }

                    return sortedHistory.map((h, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30">
                        <td className="p-3 font-mono text-[10.5px] font-bold text-slate-500">{new Date(h.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-bold text-slate-700">{h.productName}</td>
                        <td className="p-3 text-[11px] text-slate-500">{h.operator}</td>
                        <td className="p-3 italic font-medium">{h.details}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: WALLET & LIPILA TRANSACTION LEDGER */}
      {effectiveActiveSubTab === "wallet-ledger" && workspaceMode !== "Farmer" && (
        <div className="space-y-6 animate-fade-in text-slate-900 font-sans">
          
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200/80 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Lipila Funding Vault & Transaction Logs</h3>
              <p className="text-[11px] text-slate-500">View real-time collections and disbursements ledger entries synchronized with standard ledger accounts.</p>
            </div>
            
            <button
              onClick={() => setShowFundWallet(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Wallet className="w-4 h-4" />
              <span>Fund Offtaker Wallet via Lipila</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 uppercase text-[9.5px] font-black text-slate-500 font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Date</th>
                  <th className="p-3.5">Ref ID</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Transaction Type</th>
                  <th className="p-3.5">Amount (ZMW)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {walletTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic font-medium">No system ledger movements captured under this tenant wallet structure.</td>
                  </tr>
                ) : (
                  walletTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3.5 pl-5 text-slate-600 font-medium">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-700">{t.lipilaRef || "Internal"}</td>
                      <td className="p-3.5 text-slate-700 font-medium">{t.narration}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.type === "fund" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`p-3.5 font-bold font-mono ${t.type === "fund" ? "text-emerald-600" : "text-rose-600"}`}>
                        {t.type === "fund" ? "+" : "-"} ZK {t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FARMER SELL PORTAL */}
      {effectiveActiveSubTab === "farmer-sell-hub" && (
        <div className="space-y-6 animate-fade-in text-slate-900 font-sans">
          
          <div className="p-6 bg-[#FEFDF9] border border-amber-250 rounded-2xl space-y-4">
            <h4 className="text-sm font-black text-amber-950 uppercase tracking-widest font-mono">My Farmer Multi-Sales and Accruals</h4>
            <p className="text-xs text-amber-900 leading-normal">
              Confirm or dispute delivery notes recorded by commercial offtakers. Keep absolute margin trace link to crop cycle cost metrics.
            </p>
          </div>

          {/* Delivery Review list specifically for testability representing Farmer side */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden p-6 space-y-4">
            <h5 className="font-extrabold text-slate-800">Pending Delivery Confirmations</h5>
            
            <div className="space-y-3">
              {deliveryNotes.filter(d => d.status === "Pending").length === 0 ? (
                <div className="p-6 text-center italic text-slate-400 text-xs">No pending delivery review requests sent to you.</div>
              ) : (
                deliveryNotes.filter(d => d.status === "Pending").map(dn => (
                  <div key={dn.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <h6 className="font-extrabold text-slate-800">Delivery of {dn.qty} {dn.unit} — {dn.product}</h6>
                      <p className="text-[11px] text-slate-500">Recorded on {new Date(dn.createdAt).toLocaleDateString()} at price limit rate K {dn.unitPrice}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateDNStatus(dn.id, "Confirmed")}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-black cursor-pointer shadow-sm hover:bg-emerald-550"
                      >
                        Confirm Delivery Value ZK {dn.totalValue}
                      </button>
                      <button
                        onClick={() => handleUpdateDNStatus(dn.id, "Disputed")}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-black cursor-pointer shadow-sm hover:bg-rose-550"
                      >
                        Dispute Value Match
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ADMIN CONFIG COA FEES */}
      {effectiveActiveSubTab === "fee-config" && workspaceMode !== "Farmer" && (
        <div className="space-y-6 animate-fade-in text-slate-900 font-sans">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Form Setup */}
            <form onSubmit={handleUpdateAdminFees} className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Platform Clearance Fee Card Settings</h4>
              <p className="text-[11.5px] text-slate-500 leading-relaxed">
                Platform Administrators can configure decimal rate scales globally. Change increments do not cascade retrospectively to settled items.
              </p>

              {/* Farmer side fields */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Farmer Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFarmerRate}
                    onChange={(e) => setEditFarmerRate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white text-xs outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Farmer Flat (ZK)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFarmerFlat}
                    onChange={(e) => setEditFarmerFlat(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white text-xs outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              {/* Offtaker side fields */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Offtaker Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOfftakerRate}
                    onChange={(e) => setEditOfftakerRate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white text-xs outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Offtaker Flat (ZK)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOfftakerFlat}
                    onChange={(e) => setEditOfftakerFlat(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white text-xs outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Apply Fee Card Adjustments & Version Log
              </button>
            </form>

            {/* Audit History Logs */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Commission Vault Version Audit History</h4>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                  <div className="p-1 bg-emerald-100 rounded text-emerald-800 shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono font-bold">19 JUNE 2026 05:48</span>
                    <p className="text-xs font-bold text-slate-800">First-class deployment config version established</p>
                    <p className="text-[10px] text-slate-500">2.8% + K15.00 setup activated across linked mobile wallets.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FARMER PORTAL ("SELL TO OFFTAKERS") */}
      {effectiveActiveSubTab === "farmer-sell-hub" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-slate-900 font-sans" id="farmer-portal-sell-hub">
          {/* Left Column: Settlement & Preferences preferences view / modifier Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
                  <Smartphone className="w-5 h-5 bg-transparent" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Payout Preferences</h3>
                  <p className="text-[11px] text-slate-500">Configure Airtel/MTN/Bank payout defaults.</p>
                </div>
              </div>

              <form onSubmit={handleFarmerUpdatePreferenceSubmit} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Default Payout Class</label>
                  <select
                    value={farmerPrefMethod}
                    onChange={(e) => setFarmerPrefMethod(e.target.value as any)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs outline-none focus:bg-white"
                  >
                    <option value="mobile_money">Mobile Money Account</option>
                    <option value="bank_transfer">Direct Bank Transfer account</option>
                  </select>
                </div>

                {farmerPrefMethod === "mobile_money" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Mobile Money Provider</label>
                      <select
                        value={farmerPrefMoMoProvider}
                        onChange={(e) => setFarmerPrefMoMoProvider(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs outline-none focus:bg-white"
                      >
                        <option value="MTN MoMo">Zambia MTN MoMo</option>
                        <option value="Airtel Money">Zambia Airtel Money</option>
                        <option value="Zamtel Kwacha">Zambia Zamtel Kwacha</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Active Mobile Number</label>
                      <input
                        type="tel"
                        value={farmerPrefPhone}
                        onChange={(e) => setFarmerPrefPhone(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-600 font-mono"
                        placeholder="e.g. 0977283921"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Zambian Clearing Bank</label>
                      <select
                        value={farmerPrefBankName}
                        onChange={(e) => setFarmerPrefBankName(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs outline-none focus:bg-white"
                      >
                        <option value="ZANACO">Zambian National Commercial Bank (ZANACO)</option>
                        <option value="Standard Chartered">Standard Chartered Bank Zambia Ltd</option>
                        <option value="Absa Bank">ABSA Bank Zambia PLC</option>
                        <option value="First National Bank">FNB Zambia Ltd</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Account Number</label>
                      <input
                        type="text"
                        value={farmerPrefAccNum}
                        onChange={(e) => setFarmerPrefAccNum(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-600 font-mono"
                        placeholder="e.g. 1002931023"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Account Holder Name</label>
                      <input
                        type="text"
                        value={farmerPrefAccName}
                        onChange={(e) => setFarmerPrefAccName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none"
                        placeholder="e.g. Mwansa Chilufya"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Save Settlement Preferences
                </button>
              </form>
            </div>

            {/* Simulated 48h deadline tool trigger */}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3">
              <span className="text-[10px] font-black uppercase text-amber-800 font-mono tracking-wider block">Simulated 48-Hour auto confirmation</span>
              <p className="text-xs text-amber-900 leading-normal">
                If the 48h deadline passes without manual action, pending delivery notes auto-confirm to protect farmer liquidations and keep ledger accruals accurate.
              </p>
              <button
                type="button"
                onClick={handleSimulate48hDeadline}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
              >
                Simulate 48h Deadline Elapsed
              </button>
            </div>
          </div>

          {/* Right Column: Connection with Aggregators (Awaiting lists & confirmations) */}
          <div className="lg:col-span-2 space-y-6">

            {/* FARMER PRICE BOARD */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    📢 Live Price Board Directory
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Real-time certified quality scale catalog grades offered by registered Mabala offtakers.</p>
                </div>
                
                <button 
                  onClick={loadPriceboardForFarmer}
                  disabled={loadingPriceboard}
                  className="px-2.5 py-1 bg-slate-100 text-slate-600 hover:text-slate-800 rounded font-bold text-[10px] flex items-center gap-1 transition"
                >
                  {loadingPriceboard ? "Syncing..." : "🔄 Refresh Prices"}
                </button>
              </div>

              {loadingPriceboard ? (
                <div className="py-8 text-center text-slate-400 italic text-xs animate-pulse">
                  Querying live quality grading price books from authority directories...
                </div>
              ) : publishedPricesList.length === 0 ? (
                <div className="py-6 text-center text-slate-400 italic text-xs">
                  No published price schedules recorded by aggregators yet. Ask offtakers to publish.
                </div>
              ) : (
                <div className="space-y-5">
                  {publishedPricesList.map((offItem) => {
                    const isRecentlyUpdated = offItem.lastPublished && 
                      (Date.now() - new Date(offItem.lastPublished).getTime() < 7 * 24 * 60 * 60 * 1000);

                    return (
                      <div key={offItem.offtakerId} className="p-4 bg-slate-50/50 border border-slate-200/80 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-slate-100 text-[11px] font-black flex items-center justify-center font-mono uppercase">
                              {offItem.offtakerName.slice(0, 2)}
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-800">{offItem.offtakerName}</h4>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">{offItem.sector || "General"} Offtaker Procurement</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            {isRecentlyUpdated && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase tracking-wider rounded-full border border-emerald-500/15 flex items-center gap-1">
                                🔥 Updated recently
                              </span>
                            )}
                            
                            {offItem.lastPublished ? (
                              <span className="text-[9px] text-slate-400 font-medium">
                                Effective From: <strong>{new Date(offItem.lastPublished).toLocaleDateString()}</strong>
                              </span>
                            ) : (
                              <span className="text-[9px] text-amber-500 font-bold bg-amber-50 px-1 py-0.5 rounded">
                                No published price list yet
                              </span>
                            )}
                          </div>
                        </div>

                        {(!offItem.products || offItem.products.length === 0) ? (
                          <div className="text-[10px] text-slate-400 italic py-2 text-center">
                            No active crops grades cataloged under this partner partner.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {offItem.products.map((prod: any) => {
                              const activeGrades = (prod.grades || []).filter((g: any) => g.active);

                              if (activeGrades.length === 0) return null;

                              return (
                                <div key={prod.productId} className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-xs">
                                  <div className="bg-slate-50 px-3.5 py-2 font-black text-[10px] text-slate-700 uppercase tracking-wider font-mono flex justify-between">
                                    <span>🌾 {prod.productName}</span>
                                    <span className="text-slate-400 font-bold">ZMW per {prod.unit}</span>
                                  </div>

                                  <div className="divide-y divide-slate-100 font-sans text-xs">
                                    {activeGrades.map((g: any) => (
                                      <div key={g.gradeId} className="p-3 flex justify-between items-center hover:bg-slate-50/20 transition">
                                        <div className="space-y-0.5 max-w-[70%]">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-extrabold text-slate-800 text-xs">{g.gradeName}</span>
                                          </div>
                                          <p className="text-[10px] text-slate-400 font-semibold leading-normal">{g.description}</p>
                                        </div>

                                        <span className="text-xs font-black font-mono text-indigo-700 bg-indigo-50/70 border border-indigo-100/50 px-2.5 py-1 rounded">
                                          ZMW {g.pricePerUnit.toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Connection with Aggregators */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between gap-2">
                <span>🤝 Connected Offtakers & Aggregators</span>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  {farmerOfftakerLinks.filter(l => l.farmerId === "farmer-z1" && l.status === "Active").length} connected
                </span>
              </h3>

              {/* Linking Request Directory search list */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider block">Authorized Mabala Offtakers Directory</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allOfftakersList.map(off => {
                    const linked = farmerOfftakerLinks.find(l => (l.offtakerId === off.tenantId || l.offtakerId === off.id) && l.farmerId === "farmer-z1");
                    return (
                      <div key={off.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 font-mono">{off.sector} Sector Buyer</span>
                          <h4 className="text-xs font-black text-slate-900 mt-1">{off.legalName || off.legal_name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono block">PACRA: {off.registrationNumber || off.registration_number}</span>
                          <span className="text-[10px] text-slate-500 font-mono block mt-1">📍 Depots: {(off.depotLocations || []).slice(0, 2).join(", ")}</span>
                        </div>

                        {linked ? (
                          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                            <span className={`text-[10px] font-bold uppercase ${linked.status === "Active" ? "text-emerald-600" : "text-amber-600"}`}>
                              Status: {linked.status}
                            </span>
                            {linked.status === "Pending" && linked.initiatedBy === "offtaker" && (
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleFarmerApproveLinkRequest(linked.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFarmerDeclineLinkRequest(linked.id)}
                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleFarmerRequestConnection(off.tenantId || off.id)}
                            className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg cursor-pointer transition-all shadow-xs"
                          >
                            Request Connection Link
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pending Confirmations list and match validation */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">🔔 Farmer Delivery Note confirmation Centre</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Review and double-sign incoming deliveries recorded by aggregators at depots. Once confirmed, payments are escrow-accrued instantly and receipts can be generated.
              </p>

              <div className="space-y-3">
                {deliveryNotes.filter(d => d.farmerId === "farmer-z1").length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No registered deliveries found under your NRC 112233/44/1.
                  </div>
                ) : (
                  deliveryNotes.filter(d => d.farmerId === "farmer-z1").map(dn => {
                    const isPending = dn.status === "Pending";
                    return (
                      <div key={dn.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400 block">{dn.dnNumber} • Recorded {new Date(dn.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs font-bold text-slate-900 block">{dn.product}</span>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-600 font-medium">
                            <span>Quantity: <strong className="text-slate-800">{dn.qty} {dn.unit}</strong></span>
                            <span>Grade: <span className="bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700">{dn.grade || dn.gradeTag || "Grade Class A"}</span></span>
                            <span>Payout: <strong className="text-emerald-700">ZK {(dn.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                          </div>
                          {dn.autoConfirmed && (
                            <span className="text-[10px] text-amber-600 font-bold block mt-1">🕒 Auto-confirmed via 48h elapsed deadline</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isPending ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleFarmerConfirmDN(dn.id)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-md"
                              >
                                Confirm Match
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFarmerDisputeDN(dn.id)}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl cursor-pointer transition-all"
                              >
                                Dispute
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`px-2.5 py-1 text-[10px] uppercase font-black rounded-full border ${
                                dn.status === "Confirmed" 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-500/20" 
                                  : "bg-rose-50 text-rose-600 border-rose-500/20"
                              }`}>
                                {dn.status}
                              </span>
                              {dn.status === "Confirmed" && (
                                <button
                                  type="button"
                                  onClick={() => triggerReceiptPrintout(dn)}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                                >
                                  📄 Print itemized Receipt
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        </>
      )}

      {/* -----------------------------
          MODALS / FORMS POPUPS
         ----------------------------- */}

      {/* OVERLAY: ADD FARMER */}
      {showAddFarmer && workspaceMode !== "Farmer" && (
        <AgriSupplierLinkForm
          offtakerId={currentTenantId}
          offtakerName={offtakerProfile?.legalName || "Mabala Agrichain Ltd"}
          onClose={() => setShowAddFarmer(false)}
          onOnboardSuccess={(newFarmer) => {
            setRegisteredFarmers(prev => [newFarmer, ...prev]);
            setShowAddFarmer(false);
          }}
          addNotification={addNotification}
        />
      )}

      {/* OVERLAY: RECORD NEW DELIVERY */}
      {showRecordDelivery && workspaceMode !== "Farmer" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleRecordDeliverySubmit} className="w-full max-w-md bg-white rounded-3xl p-6 text-slate-900 border border-slate-200 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase text-slate-400 font-mono">Record Crop/Milk Delivery note</span>
              <button type="button" onClick={() => setShowRecordDelivery(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Select Linked Farmer</label>
                <select
                  required
                  value={deliveryFarmerId}
                  onChange={(e) => setDeliveryFarmerId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none bg-slate-50 focus:bg-white"
                >
                  <option value="">-- Choose agri supplier --</option>
                  {registeredFarmers.map(f => (
                    <option key={f.id} value={f.id}>{f.name} (NRC: {f.nrc})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Product Category</label>
                  <select
                    required
                    value={deliveryProduct}
                    onChange={(e) => {
                      setDeliveryProduct(e.target.value);
                      const matchedProd = offtakerProducts.find(p => p.productName === e.target.value);
                      if (matchedProd) {
                        setDeliveryUnit(matchedProd.unit);
                        setDeliveryUnitPrice(String(matchedProd.defaultUnitPrice));
                      }
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none bg-slate-50 focus:bg-white"
                  >
                    <option value="">-- Choose crop/livestock --</option>
                    {offtakerProducts.map(p => (
                      <option key={p.id} value={p.productName}>{p.productName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Quality Classification</label>
                  <select
                    value={deliveryGrade}
                    onChange={(e) => setDeliveryGrade(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none bg-slate-50 focus:bg-white"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B</option>
                    <option value="Grade C">Grade C (Industrial)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity Delivered</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={deliveryQty}
                    onChange={(e) => setDeliveryQty(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
                    placeholder="e.g. 100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Unit price (ZK)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={deliveryUnitPrice}
                    onChange={(e) => setDeliveryUnitPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none font-mono"
                    placeholder="Rate limit"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Linking Crop Cycle (Zambia tracker)</label>
                <select
                  value={deliveryCropCycleId}
                  onChange={(e) => setDeliveryCropCycleId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none bg-slate-50 focus:bg-white"
                >
                  <option value="">-- No reference / Non-crop product --</option>
                  {cropCycles.map(c => (
                    <option key={c.id} value={c.id}>{c.cropType} Field: {c.fieldBlock} ({c.status})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-555 text-white font-black text-xs rounded-xl cursor-pointer"
            >
              Issue Digital Delivery Note & Notify Farmer
            </button>
          </form>
        </div>
      )}

      {/* OVERLAY: FUND WALLET */}
      {showFundWallet && workspaceMode !== "Farmer" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleFundWalletSubmit} className="w-full max-w-md bg-white rounded-3xl p-6 text-slate-900 border border-slate-200 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase text-slate-400 font-mono">Fund Wallet Terminal</span>
              <button type="button" onClick={() => setShowFundWallet(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Collection Amount (ZK)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white font-mono focus:border-emerald-600 outline-none"
                  placeholder="ZK 5,000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Mobile Money Number</label>
                <input
                  type="tel"
                  required
                  value={fundMoMoNumber}
                  onChange={(e) => setFundMoMoNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white font-mono focus:border-emerald-600 outline-none"
                  placeholder="e.g. 0977283910"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Narration</label>
                <input
                  type="text"
                  value={fundNarration}
                  onChange={(e) => setFundNarration(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-550 text-white font-black text-xs rounded-xl cursor-pointer"
            >
              Secure Payout Settlement Integration via Lipila
            </button>
          </form>
        </div>
      )}

      {/* OVERLAY: PROCESSING PAYOUTS BATCH LOOP */}
      {showPayoutProgress && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200 text-slate-900 shadow-2xl space-y-4 animate-scale-up">
            <div className="text-center space-y-2">
              <div className="inline-block relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Mabala Liquidation Batch Queue Settlements</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Executing secure disbursement instructions via Lipila APIs. Do not navigate away.
              </p>
            </div>

            {/* Animating progress bar percentage */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] font-bold text-slate-600 font-mono">
                <span>Queue Progress</span>
                <span>{Math.round((payoutQueueCurrent / (payoutQueueTotal || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full" 
                  style={{ width: `${Math.round((payoutQueueCurrent / (payoutQueueTotal || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="p-3 bg-slate-950 text-emerald-400 rounded-2xl h-44 overflow-y-auto font-mono text-[10px] space-y-1 select-none border border-slate-900 shadow-inner">
              {payoutQueueLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: QUALITY ADJUSTMENT NOTE POPUP */}
      {showAdjustmentDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleAdjustmentSubmit} className="w-full max-w-md bg-white rounded-3xl p-6 text-slate-900 border border-slate-200 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase text-slate-400 font-mono">Issue Quality Adjustment Note</span>
              <button 
                type="button" 
                onClick={() => setShowAdjustmentDialog(null)} 
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Adjusted Quantity ({showAdjustmentDialog.unit || "Kgs"})</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={adjQty}
                    onChange={(e) => setAdjQty(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs font-mono text-slate-850"
                    placeholder="e.g. 1450"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Grade Unit Price (ZMW)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={adjUnitPrice}
                    onChange={(e) => setAdjUnitPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs font-mono text-slate-850"
                    placeholder="e.g. 3.50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Adjusted Quality Grade</label>
                  <select
                    value={adjGrade}
                    onChange={(e) => setAdjGrade(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs text-slate-850"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Grade C">Grade C (Sub-standard)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Final Net Payment</label>
                  <div className="p-2 bg-slate-100 font-mono rounded-xl text-xs text-slate-700 font-bold">
                    ZK {((Number(adjQty) || 0) * (Number(adjUnitPrice) || 0)).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Moisture content / impurity reason remarks</label>
                <textarea
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 h-20 text-xs resize-none text-slate-850"
                  placeholder="e.g., Moisture deduction above 13.5% threshold + impurity clean out discount..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer border-none"
            >
              Calculate Net Value & Bind Adjustment Note
            </button>
          </form>
        </div>
      )}

      {/* ADD CROP/PRODUCT CATEGORY MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-sm">Add New Product Category</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Define a product line that your organization currently procures.</p>
            </div>

            <form onSubmit={handleAddNewProductCategory} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Soybeans, Yellow Maize, Sorghum"
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-xs font-sans text-slate-850"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Unit of Measure</label>
                <select
                  value={newProductUnit}
                  onChange={(e) => setNewProductUnit(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-xs font-sans text-slate-850"
                >
                  <option value="Kgs">Kgs</option>
                  <option value="50Kg bag">50Kg bag</option>
                  <option value="tonne">tonne</option>
                  <option value="litre">litre</option>
                  <option value="crate">crate</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-slate-100 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow transition"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRecordDeliveryModal && (
        <RecordDeliveryModal
          offtakerUid={currentTenantId}
          registeredFarmers={registeredFarmers}
          qualitySettings={qualitySettings}
          userEmail={userEmail}
          onClose={() => setShowRecordDeliveryModal(false)}
          onSuccess={(newDN) => {
            setDeliveryNotes((prev) => [newDN, ...prev]);
            setShowRecordDeliveryModal(false);
          }}
        />
      )}

    </div>
  );
}
