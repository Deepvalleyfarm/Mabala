import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  X, 
  Search, 
  Check, 
  AlertCircle, 
  User, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  Calendar,
  Contact,
  Trash2,
  Lock
} from "lucide-react";
import { writeBatch, doc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { saveToOfflineStore } from "../../db/offline_db";

// Firestore Error Types as required by firebase-integration skill
enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const zambianNRCRegex = /^\d{6}\/\d{2}\/\d{1}$/;

const deliverySchema = z.object({
  selectedFarmerId: z.string().min(1, "Please search and select a linked farmer from the dropdown"),
  productId: z.string().min(1, "Please select a product category"),
  gradeId: z.string().min(1, "Please select an active quality grade"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  verifiedBy: z.string().min(2, "Staff verifier name is required"),
  verificationChecked: z.boolean().refine((val) => val === true, {
    message: "You must physically inspect the quality and check this box to proceed."
  }),
  deliveryDate: z.string().min(1, "Delivery date & time is required")
});

type DeliveryFormValues = z.infer<typeof deliverySchema>;

interface RecordDeliveryModalProps {
  offtakerUid: string;
  registeredFarmers: any[];
  qualitySettings: any[];
  onClose: () => void;
  onSuccess: (newDN: any) => void;
  userEmail?: string;
}

export function RecordDeliveryModal({
  offtakerUid,
  registeredFarmers,
  qualitySettings,
  onClose,
  onSuccess,
  userEmail
}: RecordDeliveryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<any | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryRef, setDeliveryRef] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      selectedFarmerId: "",
      productId: "",
      gradeId: "",
      quantity: undefined,
      verifiedBy: "",
      verificationChecked: false,
      deliveryDate: new Date().toISOString().substring(0, 16)
    }
  });

  const watchProductId = watch("productId");
  const watchGradeId = watch("gradeId");
  const watchQuantity = watch("quantity") || 0;

  // Active product selection & grading tracking
  const activeProduct = qualitySettings.find(p => p.id === watchProductId || p.productId === watchProductId);
  const activeGrades = activeProduct?.grades?.filter((g: any) => g.active) || [];
  const activeGrade = activeGrades.find((g: any) => g.gradeId === watchGradeId);
  const pricePerUnit = activeGrade?.pricePerUnit || 0;
  const calculatedTotal = Number((watchQuantity * pricePerUnit).toFixed(2));

  // Dynamic remote and local farmer lookup
  useEffect(() => {
    const fetchLinkedFarmers = async () => {
      const term = searchQuery.trim().toLowerCase();
      if (!term) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const colRef = collection(db, "offtakers", offtakerUid, "linkedFarmers");
        const snapshot = await getDocs(colRef);
        const fbList: any[] = [];
        snapshot.forEach((docSnapshot) => {
          fbList.push({ id: docSnapshot.id, ...docSnapshot.data() });
        });

        // Fallback merge with component-loaded registeredFarmers
        const mergedMap = new Map();
        [...registeredFarmers, ...fbList].forEach(f => {
          mergedMap.set(f.id || f.farmerUid, f);
        });
        const allFarmers = Array.from(mergedMap.values());

        // Perform matching on startsWith(code) or contains(name)
        const filtered = allFarmers.filter((f: any) => {
          const code = (f.farmerCode || "").toLowerCase();
          const name = (f.name || f.farmerName || "").toLowerCase();
          return code.startsWith(term) || name.includes(term);
        });

        setSearchResults(filtered);
      } catch (err) {
        console.error("Failed to query farmers from database, performing offline search fallback", err);
        const filtered = registeredFarmers.filter((f: any) => {
          const code = (f.farmerCode || "").toLowerCase();
          const name = (f.name || f.farmerName || "").toLowerCase();
          return code.startsWith(term) || name.includes(term);
        });
        setSearchResults(filtered);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchLinkedFarmers();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, offtakerUid, registeredFarmers]);

  const handleSelectFarmer = (farmer: any) => {
    setSelectedFarmer(farmer);
    setValue("selectedFarmerId", farmer.id || farmer.farmerUid);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleClearSelectedFarmer = () => {
    setSelectedFarmer(null);
    setValue("selectedFarmerId", "");
    setSearchQuery("");
  };

  // Reset product grade fields if product updates
  useEffect(() => {
    setValue("gradeId", "");
  }, [watchProductId, setValue]);

  const onRecordDelivery = async (values: DeliveryFormValues) => {
    if (!selectedFarmer) return;

    setIsSubmitting(true);
    const generatedDeliveryId = "DEL-" + Math.floor(100000 + Math.random() * 900000);

    const deliveryPayload = {
      farmerUid: selectedFarmer.id || selectedFarmer.farmerUid || "",
      farmerCode: selectedFarmer.farmerCode || "",
      farmerName: selectedFarmer.name || selectedFarmer.farmerName || "",
      productId: activeProduct?.id || activeProduct?.productId || "",
      productName: activeProduct?.productName || "",
      gradeId: activeGrade?.gradeId || "",
      gradeName: activeGrade?.gradeName || "",
      quantity: values.quantity,
      unit: activeProduct?.unit || "Kgs",
      unitPrice: pricePerUnit,
      totalValue: calculatedTotal,
      verifiedBy: values.verifiedBy.trim(),
      verifiedAt: new Date(values.deliveryDate).toISOString(),
      status: "pending_grn",
      createdAt: new Date().toISOString(),
      createdBy: userEmail || "offtaker_portal"
    };

    const notificationPayload = {
      title: "New Crop Delivery Recorded",
      body: `Your delivery of ${values.quantity} ${activeProduct?.unit || "Kgs"} of ${activeProduct?.productName} has been recorded. Reference: ${generatedDeliveryId}`,
      read: false,
      createdAt: new Date().toISOString(),
      offtakerUid: offtakerUid
    };

    try {
      // Create atomic Firestore Write Batch
      const batch = writeBatch(db);

      const offtakerDeliveryRef = doc(db, "offtakers", offtakerUid, "deliveries", generatedDeliveryId);
      const farmerDeliveryRef = doc(db, "farmers", selectedFarmer.id || selectedFarmer.farmerUid, "deliveries", generatedDeliveryId);
      const notificationRef = doc(db, "farmers", selectedFarmer.id || selectedFarmer.farmerUid, "notifications", "notif-" + Date.now());

      batch.set(offtakerDeliveryRef, deliveryPayload);
      batch.set(farmerDeliveryRef, deliveryPayload);
      batch.set(notificationRef, notificationPayload);

      // Commit Batch Atomically
      await batch.commit();

      // Write to Local IndexDB store for offline-first parity
      const localDN = {
        id: generatedDeliveryId,
        dnNumber: generatedDeliveryId,
        farmerId: selectedFarmer.id || selectedFarmer.farmerUid,
        farmerName: selectedFarmer.name || selectedFarmer.farmerName,
        product: activeProduct?.productName || "",
        qty: values.quantity,
        unit: activeProduct?.unit || "Kgs",
        grade: activeGrade?.gradeName || "",
        unitPrice: pricePerUnit,
        totalValue: calculatedTotal,
        status: "Pending",
        paymentStatus: "Unpaid",
        createdAt: new Date().toISOString()
      };

      await saveToOfflineStore("delivery_notes", localDN);

      // Complete Success Flow
      setDeliveryRef(generatedDeliveryId);
      onSuccess(localDN);

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `offtakers/${offtakerUid}/deliveries/${generatedDeliveryId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordAnother = () => {
    reset();
    setSelectedFarmer(null);
    setSearchQuery("");
    setDeliveryRef(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col font-sans text-slate-800">
        
        {/* HEADER */}
        <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              🌾 Record New Farmer Delivery
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Capture incoming harvest deliveries, grade quality, and issue instant receipt notifications.</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {deliveryRef ? (
          /* SUCCESS SCREEN DISPLAY */
          <div className="p-8 text-center space-y-6 flex-1 overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                Delivery Captured
              </span>
              <h4 className="text-lg font-black text-slate-800 mt-2">Crop Receipt Ledger Form Created Successfully</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                An atomic ledger receipt has been generated. The linked farmer was notified immediately via in-app push messages.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl max-w-sm mx-auto space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Reference Ledger ID</span>
                <span className="font-mono font-black text-slate-950 bg-white px-2 py-0.5 border border-slate-200 rounded">{deliveryRef}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Crop Category</span>
                <span className="font-bold text-slate-800">{activeProduct?.productName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Accrued Volume</span>
                <span className="font-extrabold text-slate-900">{watchQuantity} {activeProduct?.unit}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2 mt-2">
                <span className="text-slate-500 font-black">Gross Total Accrual</span>
                <span className="font-mono font-black text-emerald-700">ZMW {calculatedTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4 max-w-md mx-auto">
              <button
                onClick={onClose}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Close Portal View
              </button>
              <button
                onClick={handleRecordAnother}
                className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow transition cursor-pointer"
              >
                Record Another Delivery
              </button>
            </div>
          </div>
        ) : (
          /* TRANSACTION INPUT FORM */
          <form onSubmit={handleSubmit(onRecordDelivery)} className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* 1. FARMER SEARCH & SELECTION */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                1. Supplier Search & Selection
              </label>

              {!selectedFarmer ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by Farmer Code or Name (e.g. Mwansa/MBL-MWANSA)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full border border-slate-300 pl-10 pr-4 py-2.5 bg-slate-50 text-xs font-semibold rounded-xl text-slate-850 focus:border-indigo-600 transition outline-none"
                  />

                  {/* DROP DOWN SEARCH RESULTS */}
                  {showDropdown && searchQuery.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-20 overflow-hidden max-h-56 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-xs text-slate-400 animate-pulse font-medium">
                          Searching linked suppliers registry...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 italic font-medium">
                          No linked farmers match your query. Try adding them to the registry.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {searchResults.map((farmer) => (
                            <button
                              key={farmer.id || farmer.farmerUid}
                              type="button"
                              onClick={() => handleSelectFarmer(farmer)}
                              className="w-full text-left p-3 hover:bg-indigo-50/40 flex justify-between items-center transition cursor-pointer text-xs"
                            >
                              <div className="space-y-0.5">
                                <p className="font-extrabold text-slate-850">{farmer.name || farmer.farmerName}</p>
                                <p className="text-[10px] text-slate-400 font-bold font-mono">CODE: {farmer.farmerCode}</p>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                                {farmer.nrc}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* SELECTED FARMER PROFILE CARD */
                <div className="bg-gradient-to-r from-slate-50 to-indigo-50/10 border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-100 font-extrabold text-xs flex items-center justify-center shadow-xs">
                      <User className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{selectedFarmer.name || selectedFarmer.farmerName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <span className="font-mono text-slate-600 font-bold uppercase tracking-wider">{selectedFarmer.farmerCode}</span> 
                        &bull; NRC: <span className="font-mono">{selectedFarmer.nrc}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase rounded border border-emerald-500/10">
                      Linked & Active
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSelectedFarmer}
                      className="p-1 px-1.5 hover:bg-slate-200 text-slate-400 hover:text-rose-600 rounded bg-slate-100 text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                    >
                      Change Supplier
                    </button>
                  </div>
                </div>
              )}
              {errors.selectedFarmerId && (
                <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.selectedFarmerId.message}</span>
                </p>
              )}
            </div>

            {/* 2. PRODUCT & QUALITY SELECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Crop Product Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  2. Product Category
                </label>
                <select
                  disabled={qualitySettings.length === 0}
                  {...register("productId")}
                  className="w-full border border-slate-300 py-2.5 px-3 bg-slate-50 text-xs font-semibold rounded-xl text-slate-850 focus:border-indigo-600 transition outline-none"
                >
                  <option value="">-- Choose Harvest Crop --</option>
                  {qualitySettings.map((prod) => (
                    <option key={prod.id || prod.productId} value={prod.id || prod.productId}>
                      🌾 {prod.productName}
                    </option>
                  ))}
                </select>
                {errors.productId && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.productId.message}</span>
                  </p>
                )}
              </div>

              {/* Quality Grade Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  3. Quality Grading
                </label>
                <select
                  disabled={!watchProductId}
                  {...register("gradeId")}
                  className="w-full border border-slate-300 py-2.5 px-3 bg-slate-50 text-xs font-semibold rounded-xl text-slate-850 focus:border-indigo-600 transition outline-none"
                >
                  <option value="">-- Select Grade Scale --</option>
                  {activeGrades.map((grade: any) => (
                    <option key={grade.gradeId} value={grade.gradeId}>
                      {grade.gradeName} &mdash; ZMW {grade.pricePerUnit.toFixed(2)}
                    </option>
                  ))}
                </select>
                {errors.gradeId && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.gradeId.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* LIVE PRICE AUTO-DISPLAY INDICATOR */}
            {activeGrade && (
              <div className="bg-indigo-50/50 border border-indigo-200/60 p-3 rounded-xl flex items-center justify-between text-xs font-sans text-indigo-950">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-650 animate-pulse"></span>
                  <div>
                    <span className="font-bold">{activeGrade.gradeName} Price Certified</span>
                    <span className="block text-[10px] text-slate-400 font-medium leading-none mt-0.5">{activeGrade.description}</span>
                  </div>
                </div>
                <span className="font-mono font-black text-indigo-800 bg-white px-2.5 py-1 border border-indigo-100 rounded-lg">
                  ZMW {pricePerUnit.toFixed(2)} / {activeProduct?.unit}
                </span>
              </div>
            )}

            {/* 3. QUANTITY & TOTAL VALUE CALCULATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              
              {/* Quantity Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  4. Collected Quantity
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter precise quantity..."
                    {...register("quantity", { valueAsNumber: true })}
                    className="w-full border border-slate-300 pl-3 pr-16 py-2.5 bg-slate-50 text-xs font-mono font-bold rounded-xl text-slate-850 focus:border-indigo-600 transition outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <span className="text-[10px] font-black uppercase tracking-wider font-mono text-indigo-650 bg-indigo-50 border border-indigo-100/60 px-1.5 py-0.5 rounded">
                      {activeProduct?.unit || "Unit"}
                    </span>
                  </div>
                </div>
                {errors.quantity && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.quantity.message}</span>
                  </p>
                )}
              </div>

              {/* Total Value Auto-calc Display */}
              <div className="space-y-1 flex flex-col justify-end">
                <div className="bg-slate-50/50 border border-slate-200/80 p-3 rounded-xl flex flex-col h-[40px] justify-center">
                  <div className="flex justify-between items-center text-xs px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Live Total Valuation</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      ZMW {calculatedTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. VERIFICATION DEPOSIT NOTES */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Operator checked by */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    5. Verified By (Staff Name)
                  </label>
                  <input
                    type="text"
                    placeholder="Signature of verifier..."
                    {...register("verifiedBy")}
                    className="w-full border border-slate-300 py-2.5 px-3 bg-slate-50 text-xs font-semibold rounded-xl text-slate-850 focus:border-indigo-600 transition outline-none"
                  />
                  {errors.verifiedBy && (
                    <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.verifiedBy.message}</span>
                    </p>
                  )}
                </div>

                {/* Delivery datetime overrides */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    6. Date/Time of Procurement
                  </label>
                  <input
                    type="datetime-local"
                    {...register("deliveryDate")}
                    className="w-full border border-slate-300 py-2 px-3 bg-slate-50 font-mono text-xs rounded-xl text-slate-850 focus:border-indigo-600 transition outline-none"
                  />
                  {errors.deliveryDate && (
                    <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.deliveryDate.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Hardened Verification checkbox */}
              <div className="p-3.5 bg-rose-50/50 border border-slate-200 rounded-2xl">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register("verificationChecked")}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="text-[11px] leading-relaxed text-slate-600 font-medium">
                    I have physically inspected and verified this delivery. The quantity and quality grade are accurate.
                  </div>
                </label>
                {errors.verificationChecked && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1.5 pl-0.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.verificationChecked.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* BUTTON FOOTER */}
            <div className="flex gap-3 pt-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? "Atomically Writing Record..." : "Confirm & Record Delivery"}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
