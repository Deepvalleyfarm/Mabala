import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  Loader2, 
  CheckCircle, 
  Phone, 
  User, 
  Mail, 
  MapPin, 
  CreditCard, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Copy, 
  CopyCheck, 
  AlertCircle, 
  Building2,
  Lock,
  Smartphone
} from "lucide-react";
import { collection, query, where, getDocs, doc, setDoc, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";
import { saveToOfflineStore } from "../../db/offline_db";

const zambianNRCRegex = /^\d{6}\/\d{2}\/\d{1}$/;

const validationSchema = z.object({
  fullName: z.string().min(2, "Full legal name is required"),
  nrc: z.string().regex(zambianNRCRegex, "NRC format must be NNNNNN/NN/N (e.g. 123456/11/1)"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  phone: z.string().min(9, "Primary mobile number is required"),
  secondaryPhone: z.string().optional(),
  street: z.string().min(3, "Street / Village is required"),
  district: z.string().min(2, "District is required"),
  province: z.enum([
    "Central", "Copperbelt", "Eastern", "Luapula", "Lusaka", 
    "Muchinga", "Northern", "North-Western", "Southern", "Western"
  ]),
  country: z.string().default("Zambia"),
  payoutMethod: z.enum(["mobile_money", "bank"]),
  // Mobile money sub-fields
  mobileNumber: z.string().optional(),
  mobileOperator: z.string().optional(),
  accountName: z.string().optional(),
  accountNameOverridden: z.boolean().default(false),
  // Bank sub-fields
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
});

type FormValues = z.infer<typeof validationSchema>;

interface AgriSupplierLinkFormProps {
  offtakerId: string;
  offtakerName: string;
  onClose: () => void;
  onOnboardSuccess: (newFarmer: any) => void;
  addNotification: (msg: string, type: "success" | "warning" | "info" | "error") => void;
}

export default function AgriSupplierLinkForm({
  offtakerId,
  offtakerName,
  onClose,
  onOnboardSuccess,
  addNotification
}: AgriSupplierLinkFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [checkingEmail, setCheckingEmail] = useState<boolean>(false);
  const [matchedMabalaUid, setMatchedMabalaUid] = useState<string | null>(null);

  // Photo state
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  // Camera states
  const [useCameraMode, setUseCameraMode] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Lipila verification state
  const [detectingOperator, setDetectingOperator] = useState<string>("Unknown");
  const [verifyingPayoutName, setVerifyingPayoutName] = useState<boolean>(false);
  const [verifiedPayoutName, setVerifiedPayoutName] = useState<string>("");
  const [payoutVerificationError, setPayoutVerificationError] = useState<string | null>(null);
  const [editNameManually, setEditNameManually] = useState<boolean>(false);

  // Success state
  const [onboardedFarmerCode, setOnboardedFarmerCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [savingForm, setSavingForm] = useState<boolean>(false);

  const steps = [
    { num: 1, label: "Identity" },
    { num: 2, label: "KYC Photo" },
    { num: 3, label: "Contact & Address" },
    { num: 4, label: "Payout Config" },
    { num: 5, label: "Review & Authorize" }
  ];

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    trigger,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(validationSchema) as any,
    defaultValues: {
      fullName: "",
      nrc: "",
      email: "",
      phone: "",
      secondaryPhone: "",
      street: "",
      district: "",
      province: "Lusaka",
      country: "Zambia",
      payoutMethod: "mobile_money",
      mobileNumber: "",
      mobileOperator: "Unknown",
      accountName: "",
      accountNameOverridden: false,
      bankName: "",
      bankAccount: ""
    }
  });

  const watchEmail = watch("email");
  const watchPhone = watch("phone");
  const watchPayoutMethod = watch("payoutMethod");
  const watchMobileNumber = watch("mobileNumber");
  const watchAccountName = watch("accountName");

  // Phone PREFIX operator detector
  useEffect(() => {
    if (!watchMobileNumber) {
      setDetectingOperator("Unknown");
      setValue("mobileOperator", "Unknown");
      return;
    }
    const cleanNum = watchMobileNumber.trim().replace(/\D/g, "");
    // Airtel prefixes: 097, 077, 26097, 26077
    if (/^(097|077|26097|26077)/.test(cleanNum)) {
      setDetectingOperator("Airtel Money");
      setValue("mobileOperator", "Airtel Money");
    } 
    // MTN prefixes: 096, 076, 26096, 26076
    else if (/^(096|076|26096|26076)/.test(cleanNum)) {
      setDetectingOperator("MTN MoMo");
      setValue("mobileOperator", "MTN MoMo");
    } 
    // Zamtel prefixes: 095, 075, 26095, 26075
    else if (/^(095|075|26095|26075)/.test(cleanNum)) {
      setDetectingOperator("Zamtel Kwacha");
      setValue("mobileOperator", "Zamtel Kwacha");
    } 
    else {
      setDetectingOperator("Unknown");
      setValue("mobileOperator", "Unknown");
    }
  }, [watchMobileNumber, setValue]);

  // Firestore mabala account query on Email change/blur
  const handleQueryEmailMabalaAccount = async () => {
    const emailVal = watchEmail ? watchEmail.trim() : "";
    if (!emailVal || errors.email) return;

    setCheckingEmail(true);
    try {
      const q = query(collection(db, "users_data"), where("email", "==", emailVal.toLowerCase()));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const docData = querySnap.docs[0].data();
        const farmerUid = querySnap.docs[0].id;

        setMatchedMabalaUid(farmerUid);
        addNotification("✨ Mabala Account Match Found! Auto-populating registered profile metrics.", "success");

        // Autopopulate fields if present
        if (docData.name) {
          setValue("fullName", docData.name);
        }
        if (docData.phone) {
          setValue("phone", docData.phone);
          setValue("mobileNumber", docData.phone);
        }
        if (docData.street || docData.district || docData.province) {
          setValue("street", docData.street || "");
          setValue("district", docData.district || "");
          if (docData.province) {
            setValue("province", docData.province as any);
          }
        }
      } else {
        setMatchedMabalaUid(null);
      }
    } catch (e: any) {
      console.warn("Firestore check email failed:", e);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Lipila verification
  const handleVerifyPayoutAccount = async () => {
    if (!watchMobileNumber) return;
    setVerifyingPayoutName(true);
    setPayoutVerificationError(null);
    try {
      const response = await fetch(`/api/lipila/name-lookup?number=${encodeURIComponent(watchMobileNumber)}`);
      const data = await response.json();
      if (data.success && data.accountName) {
        setVerifiedPayoutName(data.accountName);
        setValue("accountName", data.accountName);
        setEditNameManually(false);
        addNotification(`✅ Mobile Money wallet verified under holder "${data.accountName}"`, "success");
      } else {
        throw new Error(data.error || "Lookup unsuccessful");
      }
    } catch (err: any) {
      console.warn("Lipila lookup failed:", err);
      setPayoutVerificationError(err.message || "Failed to fetch remote provider records.");
      setEditNameManually(true); // fallbacks to manual setup
    } finally {
      setVerifyingPayoutName(false);
    }
  };

  // Camera capture controls
  const startCamera = async () => {
    setCameraError(null);
    setUseCameraMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn(e));
      }
    } catch (err: any) {
      console.error("Camera capture access denied:", err);
      setCameraError("Camera permission blocked or hardware busy. Please upload file below instead.");
      setUseCameraMode(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseCameraMode(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          setPhotoBlob(blob);
          const previewUrl = URL.createObjectURL(blob);
          setPhotoPreview(previewUrl);
          stopCamera();
          addNotification("📸 Photo successfully captured!", "success");
        }
      }, "image/jpeg", 0.85);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setPhotoBlob(file);
        setPhotoPreview(URL.createObjectURL(file));
        addNotification("📂 Image uploaded successfully!", "success");
      } else {
        addNotification("⚠️ Invalid file! Please upload a valid image file", "warning");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoBlob(file);
      setPhotoPreview(URL.createObjectURL(file));
      addNotification("📂 Image uploaded successfully!", "success");
    }
  };

  // Step Navigations
  const handleNextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger(["fullName", "nrc", "email"]);
    } else if (currentStep === 2) {
      if (!photoBlob) {
        addNotification("⚠️ A valid KYC Profile photo is required to continue.", "warning");
        return;
      }
      isValid = true;
    } else if (currentStep === 3) {
      isValid = await trigger(["phone", "secondaryPhone", "street", "district", "province"]);
    } else if (currentStep === 4) {
      if (watchPayoutMethod === "mobile_money") {
        isValid = await trigger(["mobileNumber", "mobileOperator", "accountName", "accountNameOverridden"]);
        if (isValid && !watchAccountName) {
          addNotification("⚠️ Please verify the payout mobile number or edit the name.", "warning");
          return;
        }
      } else {
        isValid = await trigger(["bankName", "bankAccount"]);
      }
    }

    if (isValid && currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Farmer Code Generator
  const generateUniqueFarmerCode = async (offtakerId: string): Promise<string> => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let isUnique = false;
    let code = "";
    
    // Safety break loop limit
    let limit = 0;
    while (!isUnique && limit < 15) {
      limit++;
      let suffix = "";
      for (let i = 0; i < 6; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `MBL-${suffix}`;

      // Check Firestore
      try {
        const q = query(
          collection(db, "offtakers", offtakerId, "linkedFarmers"),
          where("farmerCode", "==", code)
        );
        const querySnap = await getDocs(q);
        if (querySnap.empty) {
          isUnique = true;
        }
      } catch (e) {
        isUnique = true; // offline default fallback
      }
    }
    return code;
  };

  // Handle Form Submission
  const onFormSubmit = async (data: FormValues) => {
    if (!photoBlob) {
      addNotification("⚠️ Photo is required", "warning");
      return;
    }

    setSavingForm(true);
    setUploadProgress(10);
    try {
      const generatedFarmerUid = matchedMabalaUid || "farmer_man_" + Date.now().toString(36);
      const farmerCode = await generateUniqueFarmerCode(offtakerId);

      // Upload Profile Image with Resumable Progress
      setIsUploadingPhoto(true);
      const storageRef = ref(storage, `/farmers/${offtakerId}/${generatedFarmerUid}/profile.jpg`);
      
      const uploadTask = uploadBytesResumable(storageRef, photoBlob);
      
      const downloadUrl: string = await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 90 + 10
            );
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Storage upload failure:", error);
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      setUploadProgress(100);
      setIsUploadingPhoto(false);

      // Create Linked Farmer object
      const linkedFarmerPayload = {
        farmerUid: generatedFarmerUid,
        name: data.fullName,
        nrc: data.nrc,
        email: data.email || "",
        phone: data.phone,
        secondaryPhone: data.secondaryPhone || "",
        profilePhotoUrl: downloadUrl,
        farmerCode: farmerCode,
        payoutMethod: data.payoutMethod,
        mobileNumber: data.payoutMethod === "mobile_money" ? data.mobileNumber : "",
        mobileOperator: data.payoutMethod === "mobile_money" ? data.mobileOperator : "",
        accountName: data.payoutMethod === "mobile_money" ? data.accountName : "",
        accountNameOverridden: data.payoutMethod === "mobile_money" ? data.accountNameOverridden : false,
        bankName: data.payoutMethod === "bank" ? data.bankName : "",
        bankAccount: data.payoutMethod === "bank" ? data.bankAccount : "",
        address: {
          street: data.street,
          district: data.district,
          province: data.province,
          country: data.country
        },
        createdAt: new Date().toISOString()
      };

      // 1. Create farmer in Firestore under offtaker: `/offtakers/{offtakerUid}/linkedFarmers/{farmerUid}`
      const linkedFarmerRef = doc(db, "offtakers", offtakerId, "linkedFarmers", generatedFarmerUid);
      await setDoc(linkedFarmerRef, linkedFarmerPayload);

      // 2. If matched real user account: add backlink to `/farmers/{farmerUid}/offtakerLinks/{offtakerUid}`
      if (matchedMabalaUid) {
        const backlinkRef = doc(db, "farmers", generatedFarmerUid, "offtakerLinks", offtakerId);
        await setDoc(backlinkRef, {
          offtakerId: offtakerId,
          linkedAt: new Date().toISOString()
        });

        // 3. Write in-app notification to Firestore under `/users_data/{farmerId}/notifications/{id}`
        const notifId = "notif_" + Date.now();
        const notificationRef = doc(db, "users_data", generatedFarmerUid, "notifications", notifId);
        await setDoc(notificationRef, {
          id: notifId,
          message: `You have been linked to ${offtakerName} as a supplier.`,
          type: "info",
          createdAt: new Date().toISOString()
        });
      }

      // 4. Save to IndexedDB (local cache update)
      const offlineObject = {
        id: generatedFarmerUid,
        farmerId: generatedFarmerUid,
        farmerName: data.fullName,
        name: data.fullName,
        nrc: data.nrc,
        phone: data.phone,
        payoutMethod: data.payoutMethod,
        payoutDestination: data.payoutMethod === "mobile_money" ? data.mobileNumber : `${data.bankName} (${data.bankAccount})`,
        offtakerId: offtakerId,
        offtakerName: offtakerName,
        farmerCode: farmerCode,
        status: "Active",
        profilePhotoUrl: downloadUrl,
        provider: data.payoutMethod === "mobile_money" ? (data.mobileOperator?.includes("Airtel") ? "Airtel" : data.mobileOperator?.includes("MTN") ? "MTN" : "Zamtel") : "",
        bankName: data.payoutMethod === "bank" ? data.bankName : "",
        bankAccount: data.payoutMethod === "bank" ? data.bankAccount : ""
      };
      await saveToOfflineStore("registered_farmers", offlineObject);

      // 5. Success
      setOnboardedFarmerCode(farmerCode);
      onOnboardSuccess(offlineObject);
      addNotification(`🎉 Farmer ${offlineObject.farmerName} successfully linked with Code ${farmerCode}!`, "success");

    } catch (error: any) {
      console.error("KYC onboarding complete failure:", error);
      addNotification("⚠️ Link failed: " + (error.message || "Unable to sync payload data."), "error");
    } finally {
      setSavingForm(false);
    }
  };

  const copyToClipboard = () => {
    if (onboardedFarmerCode) {
      navigator.clipboard.writeText(onboardedFarmerCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      addNotification("📋 Farmer code copied to clipboard", "info");
    }
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header section */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Agri-Supplier Supplier Link</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Verify credentials, capture KYC metadata, and establish durable clearing tracks.</p>
          </div>
          {!onboardedFarmerCode && (
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Wizard progress steps */}
        {!onboardedFarmerCode && (
          <div className="bg-slate-100/50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-1.5 w-full">
              {steps.map((st, i) => (
                <React.Fragment key={st.num}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black font-mono transition duration-300 ${
                      currentStep === st.num 
                        ? "bg-slate-900 text-white shadow-md ring-2 ring-emerald-500/20" 
                        : currentStep > st.num 
                        ? "bg-emerald-600 text-white" 
                        : "bg-slate-200 text-slate-500"
                    }`}>
                      {currentStep > st.num ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : st.num}
                    </div>
                    <span className={`text-[10px] font-bold tracking-tight hidden sm:inline ${
                      currentStep === st.num ? "text-slate-900 font-extrabold" : "text-slate-400"
                    }`}>
                      {st.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-[2px] mx-1 rounded transition duration-300 ${
                      currentStep > st.num ? "bg-emerald-600" : "bg-slate-200"
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <AnimatePresence mode="wait">
            
            {/* SUCCESS POST-SUBMISSION CAPTURE CARD */}
            {onboardedFarmerCode ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 px-4 space-y-6"
              >
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle className="w-10 h-10 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-black text-slate-900">KYC Onboarding Accomplished!</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    The supplier has been successfully authenticated, registered under PACRA guidelines, and connected as a certified clearing producer.
                  </p>
                </div>

                {/* Farmer Code Showcase */}
                <div className="max-w-xs mx-auto bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1.5 bg-emerald-600 text-white text-[8px] font-bold uppercase tracking-wider rounded-bl-lg">
                    Clearing Track LIVE
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-widest block">Farmer Code Account ID</span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl font-black font-mono tracking-wider text-slate-950">{onboardedFarmerCode}</span>
                    <button 
                      onClick={copyToClipboard}
                      className="p-1.5 bg-white hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 border border-slate-200/80 shadow-sm transition"
                      title="Copy Code"
                    >
                      {copiedCode ? <CopyCheck className="w-4 h-4 text-emerald-600 animate-scale-up" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 max-w-sm mx-auto flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow transition"
                  >
                    Conclude and Open Registry
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-6">
                
                {/* STEP 1: IDENTITY */}
                {currentStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex items-start gap-3">
                      <User className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Farmer account mapping lookup</h5>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Provide their registered Mabala email first. If they already hold a Mabala wallet account, their physical address, payout structures, and contact parameters will auto-sync instantly.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Registered System Email Address</span>
                        <span className="text-slate-300 font-normal lowercase italic">(Optional, trigger lookup on exit)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          {...register("email")}
                          onBlur={handleQueryEmailMabalaAccount}
                          className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-3 text-xs outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                          placeholder="e.g. farmer.mwansa@gmail.com"
                        />
                        {checkingEmail && (
                          <div className="absolute right-3.5 top-3 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        )}
                        {matchedMabalaUid && !checkingEmail && (
                          <div className="absolute right-3.5 top-3 text-emerald-600">
                            <CheckCircle className="w-4 h-4 animate-scale-up" />
                          </div>
                        )}
                      </div>
                      {errors.email && <p className="text-[10px] text-red-500 font-bold">{errors.email.message}</p>}
                    </div>

                    {matchedMabalaUid && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-semibold flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                        <span>Mabala Client matches UID: ${matchedMabalaUid.slice(0, 8)}... (Auto-Sync parameters engaged)</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Farmer Full Legal Name *</label>
                        <input
                          type="text"
                          {...register("fullName")}
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                          placeholder="As displayed on NRC (e.g. Kelvin Ng'andu)"
                        />
                        {errors.fullName && <p className="text-[10px] text-red-500 font-bold">{errors.fullName.message}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">National Registration Card (NRC) *</label>
                        <input
                          type="text"
                          {...register("nrc")}
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white font-mono"
                          placeholder="e.g. 104829/11/1"
                        />
                        {errors.nrc && <p className="text-[10px] text-red-500 font-bold">{errors.nrc.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: PHOTO CAPTURE AND UPLOAD */}
                {currentStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-1">
                      <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">Profile KYC Verification Photo *</label>
                      <p className="text-[10px] text-slate-400">Capture a live snapshot or pick a PNG/JPEG document from photo gallery.</p>
                    </div>

                    <div className="max-w-md mx-auto aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden flex flex-col items-center justify-center relative group">
                      
                      {/* Standard camera streaming overlay */}
                      {useCameraMode && (
                        <div className="absolute inset-0 bg-black flex flex-col justify-between z-10">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold shadow-md transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={captureFrame}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black shadow-md flex items-center gap-1.5 transition"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Take Snapshot</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Photo preview after capture/upload */}
                      {photoPreview ? (
                        <div className="absolute inset-0 bg-slate-100 z-10 flex flex-col items-center justify-center">
                          <img 
                            src={photoPreview} 
                            alt="Profile KYC Preview" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoBlob(null);
                              setPhotoPreview(null);
                            }}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-950 text-white flex items-center justify-center transition"
                            title="Remove Photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 space-y-4"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleFileDrop}
                        >
                          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                            <Camera className="w-6 h-6" />
                          </div>
                          <div className="text-center space-y-1">
                            <span className="text-[11px] text-slate-600 font-extrabold block">Drag image here or browse</span>
                            <span className="text-[9px] text-slate-400 font-medium block">Resolution recommendation: 240x240 minimum</span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold shadow transition flex items-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Direct Live Camera</span>
                            </button>
                            <label className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold shadow-sm transition flex items-center gap-1 cursor-pointer">
                              <Upload className="w-3.5 h-3.5 text-slate-400" />
                              <span>Import Document</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleFileSelect}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                    {cameraError && (
                      <p className="text-[10px] text-red-500 font-semibold text-center mt-1">{cameraError}</p>
                    )}
                  </motion.div>
                )}

                {/* STEP 3: CONTACT PARAMETERS AND PHYSICAL ADDRESS */}
                {currentStep === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Primary Mobile Number *</span>
                        </label>
                        <input
                          type="tel"
                          {...register("phone")}
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                          placeholder="e.g. 0977281029"
                        />
                        {errors.phone && <p className="text-[10px] text-red-500 font-bold">{errors.phone.message}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Secondary Contact Phone (Optional)</label>
                        <input
                          type="tel"
                          {...register("secondaryPhone")}
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                          placeholder="e.g. 0966112233"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Physical Address and Geographic Coordinates</span>
                      </h5>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Street / Village / Plot Number *</label>
                        <input
                          type="text"
                          {...register("street")}
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none"
                          placeholder="e.g. Plot 12, Siavonga Road"
                        />
                        {errors.street && <p className="text-[10px] text-red-500 font-bold">{errors.street.message}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">District *</label>
                          <input
                            type="text"
                            {...register("district")}
                            className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none"
                            placeholder="e.g. Mazabuka"
                          />
                          {errors.district && <p className="text-[10px] text-red-500 font-bold">{errors.district.message}</p>}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Zambian Province *</label>
                          <select
                            {...register("province")}
                            className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none bg-slate-50 focus:bg-white"
                          >
                            <option value="Central">Central</option>
                            <option value="Copperbelt">Copperbelt</option>
                            <option value="Eastern">Eastern</option>
                            <option value="Luapula">Luapula</option>
                            <option value="Lusaka">Lusaka</option>
                            <option value="Muchinga">Muchinga</option>
                            <option value="Northern">Northern</option>
                            <option value="North-Western">North-Western</option>
                            <option value="Southern">Southern</option>
                            <option value="Western">Western</option>
                          </select>
                          {errors.province && <p className="text-[10px] text-red-500 font-bold">{errors.province.message}</p>}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Country</label>
                          <input
                            type="text"
                            disabled
                            {...register("country")}
                            className="w-full border border-slate-250 rounded-xl p-3 text-xs outline-none bg-slate-100 text-slate-500 cursor-not-allowed font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: PAYOUT PREFERENCES */}
                {currentStep === 4 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`border-2 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                        watchPayoutMethod === "mobile_money" 
                          ? "bg-slate-50 border-emerald-600 text-slate-900" 
                          : "border-slate-200 hover:bg-slate-50/50 text-slate-500"
                      }`}>
                        <input
                          type="radio"
                          value="mobile_money"
                          {...register("payoutMethod")}
                          className="sr-only"
                        />
                        <Smartphone className="w-6 h-6 mb-2 text-emerald-600" />
                        <span className="text-xs font-black">Mobile Money Wallet</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">Clears instantly via Lipila</span>
                      </label>

                      <label className={`border-2 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                        watchPayoutMethod === "bank" 
                          ? "bg-slate-50 border-emerald-600 text-slate-900" 
                          : "border-slate-200 hover:bg-slate-50/50 text-slate-500"
                      }`}>
                        <input
                          type="radio"
                          value="bank"
                          {...register("payoutMethod")}
                          className="sr-only"
                        />
                        <Building2 className="w-6 h-6 mb-2 text-indigo-600" />
                        <span className="text-xs font-black">Inter-Bank Route</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">24-hour clearing window</span>
                      </label>
                    </div>

                    {/* MOBILE MONEY METHOD CONFIGURE PANEL */}
                    {watchPayoutMethod === "mobile_money" ? (
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                            <span>Mobile money wallet number *</span>
                            {detectingOperator !== "Unknown" && (
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                detectingOperator.includes("Airtel") 
                                  ? "bg-red-50 text-red-600 border border-red-100" 
                                  : detectingOperator.includes("MTN") 
                                  ? "bg-amber-50 text-amber-700 border border-amber-100" 
                                  : "bg-teal-50 text-teal-600 border border-teal-100"
                              }`}>
                                {detectingOperator}
                              </span>
                            )}
                          </label>

                          <div className="flex gap-2">
                            <input
                              type="tel"
                              {...register("mobileNumber")}
                              className="flex-1 border border-slate-200 rounded-xl p-3 text-xs outline-none bg-white font-semibold focus:border-emerald-600"
                              placeholder="e.g. 0977281029"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyPayoutAccount}
                              disabled={!watchMobileNumber || verifyingPayoutName}
                              className="px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 text-white disabled:text-slate-400 text-[10px] font-extrabold rounded-xl shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              {verifyingPayoutName ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <span>Verify Holder</span>
                              )}
                            </button>
                          </div>
                        </div>

                        {verifiedPayoutName && (
                          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between text-[11px] text-emerald-800">
                            <span className="font-semibold">Registered Holder: {verifiedPayoutName}</span>
                            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                          </div>
                        )}

                        {payoutVerificationError && (
                          <div className="p-3 bg-amber-50/70 border border-amber-150 rounded-xl text-[10px] text-amber-800 space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Operator Lookup Failure (Fallback Engaged)</span>
                            </div>
                            <p className="text-[9.5px] leading-relaxed">
                              Could not verify wallet with Lipila service directly. You may override and write the billing name manually below.
                            </p>
                          </div>
                        )}

                        {editNameManually && (
                          <div className="space-y-1.5 animate-scale-up">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Manual Account Holder Name Override</label>
                            <input
                              type="text"
                              {...register("accountName")}
                              className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none bg-white"
                              placeholder="Specify matching name manually"
                            />
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <input 
                                type="checkbox" 
                                id="accountNameOverridden"
                                {...register("accountNameOverridden")}
                                className="w-3.5 h-3.5 rounded text-emerald-600 border-slate-300"
                              />
                              <label htmlFor="accountNameOverridden" className="text-[9.5px] text-slate-400 leading-none">
                                Confirm manual discrepancy clearance override
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registered Zambia Commercial Bank *</label>
                          <input
                            type="text"
                            {...register("bankName")}
                            className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none bg-white"
                            placeholder="e.g. Zambia National Commercial Bank (ZANACO)"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clearing Account Number *</label>
                          <input
                            type="text"
                            {...register("bankAccount")}
                            className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none bg-white font-mono"
                            placeholder="e.g. 100348291039"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 5: REVIEW & AUTHORIZE SCANNABLE CARD */}
                {currentStep === 5 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-2.5">
                      <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Final Compliance Review</h5>
                        <p className="text-[11px] text-indigo-900/80 leading-relaxed mt-0.5">
                          Carefully inspect the compiled metadata before finalizing the supplier connection trail. Authorized clearing parameters will lock upon completion.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl divide-y divide-slate-200 text-xs text-slate-700">
                      
                      {/* Identity Row */}
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {photoPreview ? (
                            <img 
                              src={photoPreview} 
                              alt="KYC Preview" 
                              className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                              <Camera className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <span className="font-extrabold text-slate-900 block">{getValues("fullName")}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">NRC: {getValues("nrc")}</span>
                          </div>
                        </div>

                        {getValues("email") && (
                          <div className="text-right text-[10px] text-slate-400">
                            <span className="block font-medium">{getValues("email")}</span>
                            {matchedMabalaUid && <span className="text-emerald-600 font-bold uppercase tracking-wider">● Mabala Client Linked</span>}
                          </div>
                        )}
                      </div>

                      {/* Contact & Physical Address */}
                      <div className="p-4 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block">Primary dispatch parameters</span>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400">Primary Phone:</span> <strong className="text-slate-800">{getValues("phone")}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Address:</span> <strong className="text-slate-800">{getValues("street")}, {getValues("district")} ({getValues("province")})</strong>
                          </div>
                        </div>
                      </div>

                      {/* Payout Clearance details */}
                      <div className="p-4 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block">Billing clearance pathway</span>
                        {getValues("payoutMethod") === "mobile_money" ? (
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-400">Route:</span> <strong className="text-slate-800 font-mono">Mobile Money ({getValues("mobileOperator")})</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Wallet No:</span> <strong className="text-slate-800 font-mono">{getValues("mobileNumber")}</strong>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400">Holder Name:</span> <strong className="text-emerald-700">{getValues("accountName")}</strong>
                              {getValues("accountNameOverridden") && <span className="ml-1 text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 font-medium">Overridden</span>}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-400">Route:</span> <strong className="text-slate-800 font-mono">Commercial Bank Account</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Bank Name:</span> <strong className="text-slate-800">{getValues("bankName")}</strong>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400">Account No:</span> <strong className="text-slate-800 font-mono">{getValues("bankAccount")}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* MODAL ACTION CONTROLS */}
                <div className="bg-slate-50 border-t border-slate-100 -mx-6 -mb-6 p-6 flex justify-between gap-3 mt-8">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={savingForm}
                      className="px-5 py-3 border border-slate-200 hover:bg-slate-100/1 text-slate-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 5 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition ml-auto cursor-pointer"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={savingForm || isUploadingPhoto}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 text-white disabled:text-slate-400 font-black text-xs rounded-xl flex items-center gap-1.5 shadow transition ml-auto cursor-pointer"
                    >
                      {(savingForm || isUploadingPhoto) ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Syncing Data ({uploadProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Complete KYC & Link</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
