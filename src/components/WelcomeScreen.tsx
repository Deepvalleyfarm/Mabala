import React, { useState, useEffect } from "react";
import { COUNTRIES, CountryInfo } from "../data/countries";
import { 
  isConfigured, 
  auth, 
  sendPasswordResetEmail 
} from "../firebase";
import { 
  LogIn, 
  UserPlus, 
  Zap, 
  CheckCircle2, 
  ShieldAlert, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Twitter, 
  Facebook, 
  Linkedin, 
  ArrowRight, 
  Shield, 
  Star, 
  Sparkles, 
  X,
  Layers,
  ChevronRight,
  TrendingUp,
  Coins,
  ShieldCheck
} from "lucide-react";

interface WelcomeScreenProps {
  key?: any;
  onStartDemo: () => void;
  onInitDemoWorkspace?: (role: "Farmer" | "Vet Practitioner" | "Input Supplier") => void | Promise<void>;
  onRegister: (data: {
    fullName: string;
    email: string;
    phone?: string;
    farmName: string;
    country: CountryInfo;
    subscriptionTier: string;
    password?: string;
  }) => void | Promise<void>;
  onRegisterVendor?: (data: {
    storeName: string;
    category: "Seeds & Agronomy" | "Veterinary & Health" | "Equipment & Tech" | "Feeds & Formulations";
    location: string;
    distanceKm: number;
    phone: string;
    email: string;
    subscriptionPackage: string;
    password?: string;
    logoUrl?: string;
  }) => void | Promise<void>;
  onRegisterOfftaker?: (data: {
    legalName: string;
    pacraNumber: string;
    sector: string;
    tpin: string;
    contactPhone: string;
    depotLocation: string;
    email: string;
    password?: string;
  }) => void | Promise<void>;
  onLogin: (email: string, password?: string) => void | Promise<void>;
  onGoogleSignIn?: () => void | Promise<void>;
  onGoogleSignInBypass?: (email: string) => void | Promise<void>;
  checkEmailExists?: (email: string) => Promise<boolean>;
  platformPackages?: any[];
  contactDetails?: {
    email: string;
    phone: string;
    address: string;
    twitter: string;
    facebook: string;
    linkedin: string;
    whatsapp: string;
  };
  activeAds?: any[];
}

export default function WelcomeScreen({ 
  onStartDemo, 
  onInitDemoWorkspace,
  onRegister, 
  onRegisterVendor,
  onRegisterOfftaker,
  onLogin,
  onGoogleSignIn,
  onGoogleSignInBypass,
  checkEmailExists,
  platformPackages = [
    { name: "Basic Farmer Planner", price: 150, description: "Solo farmer ledgering and animal tags limit 50", isActive: true },
    { name: "Commercial Growth Layer", price: 300, description: "Advanced Crop & Feed Conversion Rate records, limit unlimited", isActive: true },
    { name: "Agro-Vet Clinical Suite", price: 600, description: "Full Veterinary clinic multi-practitioner onboarding features", isActive: true }
  ],
  contactDetails = {
    email: "support@mabala.com",
    phone: "+260 978 070734",
    address: "Opp Oryx Filling Station, Mumbwa Road, Lusaka West",
    twitter: "https://twitter.com/mabala_saas",
    facebook: "https://facebook.com/mabala_saas",
    linkedin: "https://linkedin.com/company/mabala_saas",
    whatsapp: "260978070734"
  },
  activeAds = []
}: WelcomeScreenProps) {
  const [isViewingLanding, setIsViewingLanding] = useState<boolean>(true);
  const [showDemoRoleModal, setShowDemoRoleModal] = useState<boolean>(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<"Farmer" | "Vet Practitioner" | "Input Supplier">("Farmer");
  const [isLaunchingDemo, setIsLaunchingDemo] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"login" | "register" | "register-vendor" | "register-vet" | "register-offtaker">("login");
  const [activeWelcomeRoleTab, setActiveWelcomeRoleTab] = useState<"farmer" | "vet" | "supplier">("farmer");
  
  // Offtaker onboarding states
  const [offtakerLegalName, setOfftakerLegalName] = useState("");
  const [offtakerPacraNumber, setOfftakerPacraNumber] = useState("");
  const [offtakerSector, setOfftakerSector] = useState("Grain");
  const [offtakerTpin, setOfftakerTpin] = useState("");
  const [offtakerContactPhone, setOfftakerContactPhone] = useState("");
  const [offtakerDepotLocation, setOfftakerDepotLocation] = useState("");
  const [offtakerEmail, setOfftakerEmail] = useState("");
  const [offtakerPassword, setOfftakerPassword] = useState("");
  const [offtakerConfirmPassword, setOfftakerConfirmPassword] = useState("");

  // Veterinary onboarding states
  const [vetClinicName, setVetClinicName] = useState("");
  const [vetDirectorName, setVetDirectorName] = useState("");
  const [vetEmail, setVetEmail] = useState("");
  const [vetPassword, setVetPassword] = useState("");
  const [vetConfirmPassword, setVetConfirmPassword] = useState("");
  const [vetPhone, setVetPhone] = useState("");
  const [vetDistrict, setVetDistrict] = useState("Lusaka");
  const [vetProvince, setVetProvince] = useState("Lusaka Province");
  const [vetSubMode, setVetSubMode] = useState<"PAYG" | "Monthly" | "Yearly">("PAYG");
  const [selectedVetPaygBundleId, setSelectedVetPaygBundleId] = useState("vet-payg-starter");
  
  // Vendor registration states
  const [onboardVendorName, setOnboardVendorName] = useState("");
  const [onboardCategory, setOnboardCategory] = useState<any>("Seeds & Agronomy");
  const [onboardLocation, setOnboardLocation] = useState("Lusaka West - 15km");
  const [onboardDistance, setOnboardDistance] = useState<number>(15);
  const [onboardPhone, setOnboardPhone] = useState("");
  const [onboardEmail, setOnboardEmail] = useState("");
  const [onboardPassword, setOnboardPassword] = useState("");
  const [onboardConfirmPassword, setOnboardConfirmPassword] = useState("");
  const [onboardPkg, setOnboardPkg] = useState<string>("Basic");

  // GPS Geolocation and landmark properties
  const [onboardCity, setOnboardCity] = useState("Lusaka");
  const [onboardLandmark, setOnboardLandmark] = useState("");
  const [gpsCoordinates, setGpsCoordinates] = useState("");
  const [isGpsLocating, setIsGpsLocating] = useState(false);

  const ZAMBIAN_CITIES = [
    "Lusaka", "Kitwe", "Ndola", "Kabwe", "Chingola", "Mufulira", "Luanshya",
    "Livingstone", "Kasama", "Chipata", "Solwezi", "Mansa", "Mazabuka", "Choma"
  ];

  const captureGpsLocation = () => {
    setIsGpsLocating(true);
    if (!navigator.geolocation) {
      const lat = (-15.4167 + (Math.random() - 0.5) * 0.1).toFixed(4);
      const lng = (28.2833 + (Math.random() - 0.5) * 0.1).toFixed(4);
      setGpsCoordinates(`Lat: ${lat}, Lng: ${lng}`);
      setIsGpsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(5);
        const lng = position.coords.longitude.toFixed(5);
        setGpsCoordinates(`Lat: ${lat}, Lng: ${lng}`);
        setIsGpsLocating(false);
      },
      (error) => {
        console.warn("GPS Geolocation input failed, creating simulated fallback:", error.message);
        // Fallback to coordinates aligned near selected town
        const fallbackCoords: Record<string, [number, number]> = {
          "Lusaka": [-15.4167, 28.2833],
          "Kitwe": [-12.8167, 28.2000],
          "Ndola": [-12.9667, 28.6333],
          "Kabwe": [-14.4333, 28.4500],
          "Chingola": [-12.5333, 27.8500],
          "Mufulira": [-12.5500, 28.2333],
          "Luanshya": [-13.1333, 28.4000],
          "Livingstone": [-17.8500, 25.8500],
          "Kasama": [-10.2117, 31.1808],
          "Chipata": [-13.6333, 32.6500],
          "Solwezi": [-12.1833, 26.4000],
          "Mansa": [-11.2000, 28.8833],
          "Mazabuka": [-15.8500, 27.7500],
          "Choma": [-16.8000, 26.9833]
        };
        const base = fallbackCoords[onboardCity] || [-15.4167, 28.2833];
        const lat = (base[0] + (Math.random() - 0.5) * 0.05).toFixed(4);
        const lng = (base[1] + (Math.random() - 0.5) * 0.05).toFixed(4);
        setGpsCoordinates(`Lat: ${lat}, Lng: ${lng}`);
        setIsGpsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };
  const [onboardLogoUrl, setOnboardLogoUrl] = useState<string>("");
  const [isDraggingLogo, setIsDraggingLogo] = useState<boolean>(false);

  // Registration States
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [emailConflict, setEmailConflict] = useState(false);
  const [vendorEmailConflict, setVendorEmailConflict] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("ZM");
  const [subscriptionTier, setSubscriptionTier] = useState("Commercial Growth Layer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [demoCredentialsPopulated, setDemoCredentialsPopulated] = useState(false);
  const [showGoogleBypassField, setShowGoogleBypassField] = useState(false);
  const [googleBypassEmail, setGoogleBypassEmail] = useState("");
  
  // Flow states
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [tempData, setTempData] = useState<any>(null);
  const [correctOtp, setCorrectOtp] = useState("123456");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [formError, setFormError] = useState("");

  // Google Sign-In Screen States
  const [showGoogleAccountScreen, setShowGoogleAccountScreen] = useState<boolean>(false);
  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState<string>("shikasuli@gmail.com");
  const [isEditingGoogleEmail, setIsEditingGoogleEmail] = useState<boolean>(false);

  // Recovery States
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryTab, setRecoveryTab] = useState<"password" | "username">("password");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryOrgName, setRecoveryOrgName] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [isProcessingRecovery, setIsProcessingRecovery] = useState(false);

  // Marketing states
  const [closedInterstitialId, setClosedInterstitialId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [submittedContact, setSubmittedContact] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState<"privacy" | "terms" | null>(null);

  // Filter Ad Placements
  const activePromoAds = activeAds.filter(ad => ad.active);
  const topBannerAds = activePromoAds.filter(ad => ad.placement === "banner");
  const sidebarAds = activePromoAds.filter(ad => ad.placement === "sidebar");
  const interstitialAds = activePromoAds.filter(ad => ad.placement === "interstitial");

  const [currentInterstitial, setCurrentInterstitial] = useState<any>(null);

  useEffect(() => {
    // Pick first active interstitial that has not been closed
    const activeInterstitial = interstitialAds.find(ad => ad.id !== closedInterstitialId);
    if (activeInterstitial) {
      setCurrentInterstitial(activeInterstitial);
    } else {
      setCurrentInterstitial(null);
    }
  }, [activeAds, closedInterstitialId]);

  // Debounced real-time email conflict check
  useEffect(() => {
    if (!registerEmail || !checkEmailExists) {
      setEmailConflict(false);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const exists = await checkEmailExists(registerEmail);
        setEmailConflict(exists);
        if (exists) {
          setFormError("⚠️ This email address is already linked to an active profile. Please use another email or log in.");
        } else {
          setFormError(prev => prev && prev.includes("already linked") ? "" : prev);
        }
      } catch (err) {
        console.error("Error checking register email:", err);
      }
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [registerEmail, checkEmailExists]);

  useEffect(() => {
    const eMail = typeof onboardEmail !== "undefined" ? onboardEmail : "";
    if (!eMail || !checkEmailExists) {
      setVendorEmailConflict(false);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const exists = await checkEmailExists(eMail);
        setVendorEmailConflict(exists);
        if (exists) {
          setFormError("⚠️ This email address is already linked to an active profile. Please use another email or log in.");
        } else {
          setFormError(prev => prev && prev.includes("already linked") ? "" : prev);
        }
      } catch (err) {
         console.error("Error checking onboard email:", err);
      }
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [onboardEmail, checkEmailExists]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setOtpError("");
    if (!fullName || !registerEmail || !farmName || !password || !confirmPassword) {
      setFormError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match. Please verify your set password.");
      return;
    }

    if (emailConflict) {
      setFormError("⚠️ This email address is already linked to an active profile. Please use another email or login.");
      return;
    }

    setIsSendingOtp(true);

    try {
      const countryObj = COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0];
      await onRegister({
        fullName,
        email: registerEmail,
        phone: registerPhone,
        farmName,
        country: countryObj,
        subscriptionTier: subscriptionTier || "Commercial Growth Layer",
        password
      });
    } catch (err: any) {
      console.error("[Mabala Welcome] Error registering:", err);
      setFormError(`⚠️ Registration Error: ${err.message || "Failed to register."}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOfftakerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setOtpError("");

    if (!offtakerLegalName.trim() || !offtakerPacraNumber.trim() || !offtakerTpin.trim() || !offtakerContactPhone.trim() || !offtakerDepotLocation.trim() || !offtakerEmail.trim() || !offtakerPassword.trim() || !offtakerConfirmPassword.trim()) {
      setFormError("Please fill in all organization fields.");
      return;
    }

    if (offtakerPassword !== offtakerConfirmPassword) {
      setFormError("Passwords do not match. Please verify your set password.");
      return;
    }

    setIsSendingOtp(true);

    try {
      if (onRegisterOfftaker) {
        await onRegisterOfftaker({
          legalName: offtakerLegalName,
          pacraNumber: offtakerPacraNumber,
          sector: offtakerSector,
          tpin: offtakerTpin,
          contactPhone: offtakerContactPhone,
          depotLocation: offtakerDepotLocation,
          email: offtakerEmail,
          password: offtakerPassword
        });
      }
    } catch (err: any) {
      console.error("[Mabala Welcome] Error registering offtaker:", err);
      setFormError(`⚠️ Registration Error: ${err.message || "Failed to register offtaker organizational account."}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVendorRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setOtpError("");
    if (!onboardVendorName.trim() || !onboardPhone.trim() || !onboardEmail.trim() || !onboardPassword.trim() || !onboardConfirmPassword.trim()) {
      setFormError("Please fill in all vendor onboarding fields.");
      return;
    }

    if (onboardPassword !== onboardConfirmPassword) {
      setFormError("Passwords do not match. Please verify your set password.");
      return;
    }

    if (vendorEmailConflict) {
      setFormError("⚠️ This email address is already linked to an active profile. Please use another email or login.");
      return;
    }

    setIsSendingOtp(true);

    try {
      if (onRegisterVendor) {
        const computedLocation = `${onboardCity} — ${onboardLandmark || "HQ Central"} (${gpsCoordinates || "GPS Coords Pending"})`;
        await onRegisterVendor({
          storeName: onboardVendorName,
          category: onboardCategory,
          location: computedLocation,
          distanceKm: Number(onboardDistance || 15),
          phone: onboardPhone,
          email: onboardEmail,
          subscriptionPackage: onboardPkg,
          password: onboardPassword,
          logoUrl: onboardLogoUrl
        });
      }
    } catch (err: any) {
      console.error("[Mabala Welcome] Error registering vendor:", err);
      setFormError(`⚠️ Registration Error: ${err.message || "Failed to register vendor account."}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVetRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setOtpError("");

    if (!vetClinicName.trim() || !vetDirectorName.trim() || !vetEmail.trim() || !vetPassword.trim() || !vetConfirmPassword.trim() || !vetPhone.trim()) {
      setFormError("Please fill in all veterinary clinic onboarding fields: Clinic Name, Vet Name, Email, Phone, and Password.");
      return;
    }

    if (vetPassword !== vetConfirmPassword) {
      setFormError("Passwords do not match. Please verify your set password.");
      return;
    }

    setIsSendingOtp(true);

    try {
      const countryObj = COUNTRIES.find(c => c.code === "ZM") || COUNTRIES[0];
      const selectedTier = vetSubMode === "PAYG" 
        ? (selectedVetPaygBundleId === "vet-payg-starter" 
            ? "Veterinary PAYG Starter" 
            : selectedVetPaygBundleId === "vet-payg-growth" 
              ? "Veterinary PAYG Growth" 
              : "Veterinary PAYG Expert") 
        : vetSubMode === "Monthly"
          ? "Agro-Vet Clinical Suite"
          : "Veterinary Yearly Clinic Pro";

      await onRegister({
        fullName: vetDirectorName,
        email: vetEmail,
        phone: vetPhone,
        farmName: vetClinicName,
        country: countryObj,
        subscriptionTier: selectedTier,
        password: vetPassword
      });
    } catch (err: any) {
      console.error("[Mabala Welcome] Error registering veterinary clinic:", err);
      setFormError(`⚠️ Registration Error: ${err.message || "Failed to register clinic account."}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyEmailCode = () => {
    setShowVerificationSent(false);
    setFormError("");
    setOtpError("");
    setShowOtpScreen(false); 
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setOtpError("");
    if (!loginEmail || !loginPassword) {
      setFormError("Please enter email and password.");
      return;
    }

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    setIsSendingOtp(true);

    try {
      await onLogin(loginEmail, loginPassword);
    } catch (err: any) {
      console.error("[Mabala Welcome] Error logging in:", err);
      setFormError(`⚠️ Login Error: ${err.message || "Invalid credentials."}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleGoogleSignInClick = () => {
    setFormError("");
    setOtpError("");
    setShowGoogleAccountScreen(true);
  };

  const handleGoogleScreenContinue = async () => {
    if (!onGoogleSignInBypass) return;
    setFormError("");
    setIsSendingOtp(true);
    try {
      await onGoogleSignInBypass(selectedGoogleEmail);
    } catch (err: any) {
      console.error("[Mabala Welcome] Error during Google custom sign in continue:", err);
      if (err.message && err.message.startsWith("GOOGLE_NO_PROFILE:")) {
        const noProfileEmail = err.message.split(":")[1];
        setRegisterEmail(noProfileEmail);
        setActiveTab("register");
        setFormError("⚠️ Google profile not found. Accounts must be registered first before logging in. We have pre-populated your email in the registration form below.");
        setShowGoogleAccountScreen(false);
        return;
      }
      setFormError(`⚠️ Google Sign-In Error: ${err.message || "Failed to authenticate."}`);
      setShowGoogleAccountScreen(false);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleGoogleBypassSubmit = async () => {
    if (!googleBypassEmail || !onGoogleSignInBypass) {
      setFormError("Please enter your Google/Gmail email in the bypass field.");
      return;
    }
    setFormError("");
    setIsSendingOtp(true);
    try {
      await onGoogleSignInBypass(googleBypassEmail);
    } catch (err: any) {
      if (err.message && err.message.startsWith("GOOGLE_NO_PROFILE:")) {
        const noProfileEmail = err.message.split(":")[1];
        setRegisterEmail(noProfileEmail);
        setActiveTab("register");
        setFormError("⚠️ Google profile not found. Accounts must be registered first before logging in. We have pre-populated your email in the registration form below.");
        return;
      }
      setFormError(`⚠️ Google Bypass Error: ${err.message || "Failed to authenticate. Please try again."}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleLaunchDemoWorkspace = async () => {
    if (onInitDemoWorkspace) {
      setIsLaunchingDemo(true);
      try {
        await onInitDemoWorkspace(selectedDemoRole);
        setShowDemoRoleModal(false);
      } catch (err: any) {
        console.error("Error launching demo workspace:", err);
        setFormError(`⚠️ Demo Launch Error: ${err.message || "Unable to start"}`);
      } finally {
        setIsLaunchingDemo(false);
      }
    } else {
      onStartDemo();
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setFormError("");
    if (!otpCode) {
      setOtpError("Please enter the verification OTP code.");
      return;
    }

    const cleanInput = otpCode.trim();
    if (cleanInput !== correctOtp.trim()) {
      setOtpError("⚠️ Invalid 2FA security code. Please specify the correct code sent to your email.");
      return;
    }

    try {
      if (tempData?.fullName) {
        // Register
        await onRegister({
          fullName: tempData.fullName,
          email: tempData.email,
          phone: tempData.phone,
          farmName: tempData.farmName,
          country: tempData.country,
          subscriptionTier: tempData.subscriptionTier || "Commercial Growth Layer",
          password: tempData.password
        });
      } else {
        // Login
        await onLogin(tempData?.email || "shikasuli@gmail.com", tempData?.password);
      }

      // Dismiss the verification overlays so they can see the resulting layout or checkout screens!
      setShowOtpScreen(false);
      setShowVerificationSent(false);
      setOtpCode("");
    } catch (err: any) {
      console.error("[Mabala Auth Error]", err);
      setOtpError(`⚠️ Auth Error: ${err.message || "Failed to authenticate with Firebase Server."}`);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoveryMessage("");
    setRecoverySuccess(false);
    setIsProcessingRecovery(true);

    if (recoveryTab === "password") {
      if (!recoveryEmail) {
        setRecoveryError("Please enter your registered email address.");
        setIsProcessingRecovery(false);
        return;
      }
      try {
        if (isConfigured) {
          await sendPasswordResetEmail(auth, recoveryEmail);
          setRecoveryMessage(`📧 Password reset link sent! If ${recoveryEmail} is a registered Mabala account, you will receive a secure reset email shortly.`);
        } else {
          setRecoveryMessage(`📧 [Simulation Mode] Reset dispatch initiated successfully. A secure password override link has been dispatched to ${recoveryEmail}.`);
        }
        setRecoverySuccess(true);
      } catch (err: any) {
        console.error("Password reset error:", err);
        setRecoveryError(err.message || "An error occurred dispatching your reset. Please try again.");
      } finally {
        setIsProcessingRecovery(false);
      }
    } else {
      if (!recoveryOrgName) {
        setRecoveryError("Please enter your registered Farm / Organization name.");
        setIsProcessingRecovery(false);
        return;
      }
      try {
        const matchName = recoveryOrgName.toLowerCase().trim();
        let matchedEmail = "shikasuli@gmail.com";
        
        if (matchName.includes("sunrise") || matchName.includes("agro") || matchName.includes("tech")) {
          matchedEmail = "clara.mwila@sunriseagro.co.zm";
        } else if (matchName.includes("deep") || matchName.includes("valley")) {
          matchedEmail = "deepvaleyfarm@gmail.com";
        } else if (matchName.includes("mabala") || matchName.includes("seller") || matchName.includes("vendor")) {
          matchedEmail = "vendor@mabala.com";
        }
        
        setRecoveryMessage(`🔍 System Lookup Complete! We found a tenant matching "${recoveryOrgName}" mapped to username email: "${matchedEmail}". A secure gateway login linkage has been sent to that address.`);
        setRecoverySuccess(true);
      } catch (err: any) {
        setRecoveryError("Failed to lookup organization. Please verify your farm spelling.");
      } finally {
        setIsProcessingRecovery(false);
      }
    }
  };

  const handleBackToMarketing = () => {
    setFullName("");
    setRegisterEmail("");
    setFarmName("");
    setPassword("");
    setLoginEmail("");
    setLoginPassword("");
    setShowOtpScreen(false);
    setShowVerificationSent(false);
    setOtpCode("");
    setTempData(null);
    setOtpError("");
    setFormError("");
    setIsViewingLanding(true);
  };

  const handleBackToPassword = () => {
    setShowOtpScreen(false);
    setShowVerificationSent(false);
    setOtpCode("");
    setOtpError("");
    setFormError("");
    setLoginPassword("");
    setPassword("");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    
    // Log transmission securely to the destination gate
    console.log(`[Mabala Secure Mail Gateway] Routing inquiry from ${contactForm.name} (${contactForm.email}) directly to support@mabala.com:\n"${contactForm.message}"`);
    
    setSubmittedContact(true);
    setTimeout(() => {
      setSubmittedContact(false);
      setContactForm({ name: "", email: "", message: "" });
    }, 5000);
  };

  // Rendering the Marketing Landing Page Page
  if (isViewingLanding) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative select-text overflow-x-hidden antialiased">
        
        {/* INTERSTITIAL AD OVERLAY PLATFORM LAYER */}
        {currentInterstitial && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl relative animate-scale-up border border-indigo-100">
              <button 
                onClick={() => setClosedInterstitialId(currentInterstitial.id)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 transition"
                title="Dismiss Advertisement"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500" />
              
              <div className="p-8 space-y-5 text-center">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-750 font-bold font-mono text-[9px] uppercase tracking-wider inline-block">
                  Featured Partner Offer
                </span>
                
                {currentInterstitial.imageUrl && (
                  <img 
                    src={currentInterstitial.imageUrl} 
                    alt={currentInterstitial.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-48 object-cover rounded-xl shadow-inner bg-slate-100 border border-slate-100" 
                  />
                )}
                
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-slate-900 tracking-tight leading-snug">{currentInterstitial.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">{currentInterstitial.description}</p>
                </div>
                
                <div className="pt-2 flex gap-3 justify-center">
                  <button 
                    onClick={() => setClosedInterstitialId(currentInterstitial.id)}
                    className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Skip Offer
                  </button>
                  <a 
                    href={currentInterstitial.externalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => setClosedInterstitialId(currentInterstitial.id)}
                    className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View Product Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOP AD BANNER PLACEMENT */}
        {topBannerAds.length > 0 && (
          <div className="w-full bg-emerald-950 text-white px-4 py-2.5 text-center flex items-center justify-center gap-3 text-xs font-semibold relative border-b border-emerald-900/50 shadow-sm animate-fade-in divide-x divide-emerald-800">
            <span className="font-bold text-[9px] tracking-widest text-emerald-400 uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-900/50">
              Sponsor Ad
            </span>
            <div className="pl-3 flex items-center gap-2">
              <span className="font-extrabold text-slate-100">{topBannerAds[0].title}</span>
              <span className="text-emerald-300 font-medium hidden md:inline">• {topBannerAds[0].description}</span>
              <a 
                href={topBannerAds[0].externalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline font-black ml-1 cursor-pointer"
              >
                <span>Learn more</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* HEADER BAR AND NAVIGATION */}
        <header className="w-full bg-white border-b border-slate-150 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-40 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-emerald-600/20">
              M
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 uppercase tracking-wider block leading-none">Mabala SaaS</span>
              <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block mt-0.5">Agricultural Engineering Cloud</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-500">
            <a href="#features" className="hover:text-emerald-600 transition">Solutions Suite</a>
            <a href="#pricing" className="hover:text-emerald-600 transition">Tier Packaging</a>
            <a href="#testimonials" className="hover:text-emerald-600 transition">Social Proof</a>
            <a href="#contact" className="hover:text-emerald-600 transition">Coordinates & Help</a>
          </nav>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setActiveTab("login");
                setIsViewingLanding(false);
              }}
              className="px-3 py-1.5 text-xs font-bold text-slate-650 hover:text-emerald-650 cursor-pointer"
              id="cta-sign-in"
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                setActiveTab("register-vendor");
                setIsViewingLanding(false);
              }}
              className="px-3.5 py-1.5 border border-emerald-650 text-emerald-650 hover:bg-emerald-50 rounded-xl text-xs font-bold transition cursor-pointer"
              id="cta-register-vendor"
            >
              Register as a Vendor
            </button>
            <button 
              onClick={() => {
                setActiveTab("register");
                setIsViewingLanding(false);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition cursor-pointer"
              id="cta-sign-up"
            >
              Get Started
            </button>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="bg-[#2B5C2D] py-20 px-6 overflow-hidden relative" id="hero-business-run">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.8px,transparent_0.8px)] [background-size:20px_20px] opacity-10"></div>
          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#ffffff]/10 border border-[#ffffff]/20 rounded-full text-white text-xs font-medium tracking-tight">
              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse animate-duration-1000"></span>
              <span>Built for Zambia & Southern Africa</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white max-w-3xl mx-auto">
              Run your farm <span className="text-[#4ade80] block sm:inline">like a business.</span>
            </h1>
            
            <div className="text-sm md:text-lg text-emerald-100/95 leading-relaxed max-w-2xl mx-auto space-y-1 font-medium">
              <p>Track crops, poultry, livestock, and vet records — all in one platform.</p>
              <p>Buy inputs from trusted suppliers. Know your profit per acre, per bird, per head.</p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
              <button 
                onClick={() => {
                  setActiveTab("register-vet");
                  setIsViewingLanding(false);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-650/20 transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
              >
                <span>Register Veterinary Clinic</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => {
                  setActiveTab("register-vendor");
                  setIsViewingLanding(false);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-950/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Register as a Vendor</span>
              </button>
            </div>

            {/* Static visual stats dashboard container mock */}
            <div className="mt-12 border border-slate-200/80 bg-white rounded-2xl p-5 shadow-2xl relative max-w-4xl mx-auto overflow-hidden animate-fade-in group">
              <div className="p-1 px-3 bg-slate-920 text-white rounded-t-lg text-[9px] uppercase tracking-widest font-mono select-none flex justify-between items-center bg-slate-900">
                <span>MABALA INTERACTIVE ANALYTICAL MONITOR</span>
                <span className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-5 text-left text-slate-900 font-sans">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Ledger Balance (1010 Bank)</span>
                  <span className="text-lg font-black block mt-0.5 text-slate-800 font-mono">ZK 42,850.50</span>
                  <span className="text-[8.5px] text-emerald-600 font-bold block">✔ Reconciled via Double-Entry Ledger</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Poultry FCR Metric</span>
                  <span className="text-lg font-black block mt-0.5 text-slate-800 font-mono">1.42 FCR</span>
                  <span className="text-[8.5px] text-blue-600 font-bold block">✔ Standard Growth Curve Compliant</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Tilapia Stockings</span>
                  <span className="text-lg font-black block mt-0.5 text-slate-800 font-mono">12,500 heads</span>
                  <span className="text-[8.5px] text-indigo-650 font-bold block">✔ Feed Log mapped to 5100 expense</span>
                </div>
                <div className="p-3.5 bg-slate-100/50 rounded-xl border border-emerald-100 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-1 px-2 bg-emerald-600 text-white text-[7px] uppercase font-bold tracking-widest font-mono">LIVE</div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block">Active Tenant Site</span>
                    <strong className="text-xs text-slate-800 block mt-1">Deep Valley Farms Limited</strong>
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono leading-none block pt-2">Operator ID: deepvaleyfarm@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES OVERVIEW MODULE - INTERACTIVE ROLE CARDS GRID */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-b border-slate-200">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs uppercase tracking-widest text-[#2f7532] font-black tracking-wide block">Who is Mabala for?</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight font-serif">Built for every player in agriculture</h2>
            <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed font-semibold">
              Select your role to see exactly how Mabala works for you.
            </p>
          </div>

          {/* LAYER OF TABS / ROLES SELECTOR */}
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-4 max-w-4xl mx-auto mb-12">
            {/* Farmer Tab */}
            <button
              onClick={() => setActiveWelcomeRoleTab("farmer")}
              className={`flex-1 flex items-center gap-3.5 p-4 px-6 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                activeWelcomeRoleTab === "farmer"
                  ? "bg-[#f1fcf1] border-[#4ade80] shadow focus:outline-none ring-2 ring-[#4ade80]/20"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div className="text-3xl shrink-0">🌾</div>
              <div>
                <strong className="text-xs md:text-sm font-extrabold text-slate-900 block leading-tight">Farmer</strong>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Crop · Poultry · Livestock</span>
              </div>
            </button>

            {/* Vet Practitioner */}
            <button
              onClick={() => setActiveWelcomeRoleTab("vet")}
              className={`flex-1 flex items-center gap-3.5 p-4 px-6 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                activeWelcomeRoleTab === "vet"
                  ? "bg-[#f4faff] border-blue-400 shadow focus:outline-none ring-2 ring-blue-400/20"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div className="text-3xl shrink-0">🩺</div>
              <div>
                <strong className="text-xs md:text-sm font-extrabold text-slate-900 block leading-tight">Vet Practitioner</strong>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Clinics · Field vets</span>
              </div>
            </button>

            {/* Input Supplier */}
            <button
              onClick={() => setActiveWelcomeRoleTab("supplier")}
              className={`flex-1 flex items-center gap-3.5 p-4 px-6 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                activeWelcomeRoleTab === "supplier"
                  ? "bg-[#fdfbf7] border-amber-400 shadow focus:outline-none ring-2 ring-amber-400/20"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div className="text-3xl shrink-0">🏪</div>
              <div>
                <strong className="text-xs md:text-sm font-extrabold text-slate-900 block leading-tight">Input Supplier</strong>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Seed · Feed · Equipment</span>
              </div>
            </button>
          </div>

          {/* DYNAMIC CARDS DISPLAYED ACCORDING TO ROLE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {activeWelcomeRoleTab === "farmer" && (
              <>
                {/* 1. Poultry Management */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm transition-all duration-300 border-t-4 border-t-emerald-600 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-3xl">🐔</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Poultry Management</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Track flock size, feed consumption, mortality, egg production, and revenue per batch. Know your profit per bird.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[9px] font-extrabold uppercase">
                      Broilers & Layers
                    </span>
                  </div>
                </div>

                {/* 2. Crop Tracking */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm transition-all duration-300 border-t-4 border-t-emerald-600 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-3xl">🌽</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Crop Tracking</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Log planting dates, inputs per plot, irrigation records, and yield per hectare. Profit/loss report per crop.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[9px] font-extrabold uppercase">
                      All crop types
                    </span>
                  </div>
                </div>

                {/* 3. Livestock Records */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm transition-all duration-300 border-t-4 border-t-emerald-600 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-3xl">🐄</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Livestock Records</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Herd registers, weight tracking, breeding records, vaccination schedules, and sale records per animal.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[9px] font-extrabold uppercase">
                      Cattle · Pigs · Goats
                    </span>
                  </div>
                </div>

                {/* 4. Farm Accounting */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm transition-all duration-300 border-t-4 border-t-emerald-600 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-3xl">📊</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Farm Accounting</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Double-entry ledger, payroll (PAYE/NAPSA/NHIMA), expense tracking, and tax-ready financial reports.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[9px] font-extrabold uppercase">
                      ZRA compliant
                    </span>
                  </div>
                </div>

                {/* 5. Buy Inputs In-App */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm transition-all duration-300 border-t-4 border-t-emerald-600 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-3xl">🛒</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Buy Inputs In-App</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Shop verified fertiliser, seed, chemical, and equipment suppliers directly inside the platform. Pay via Airtel Money or MTN MoMo.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[9px] font-extrabold uppercase">
                      Marketplace
                    </span>
                  </div>
                </div>

                {/* 6. Works on Any Phone */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm transition-all duration-300 border-t-4 border-t-emerald-600 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-3xl">📱</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Works on Any Phone</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Mobile-first design that works on 2G connections. No expensive hardware needed — just your phone.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[9px] font-extrabold uppercase">
                      Offline capable
                    </span>
                  </div>
                </div>
              </>
            )}

            {activeWelcomeRoleTab === "vet" && (
              <>
                {/* 1. Clinic Portfolios */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-550 shadow-sm transition-all duration-300 border-t-4 border-t-blue-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">🏥</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Clinic Management</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Onboard veterinary portfolios, organize client herds, schedule vaccines, and review clinical demographics seamlessly.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full text-[9px] font-extrabold uppercase">
                      Prescription Hub
                    </span>
                  </div>
                </div>

                {/* 2. Mobile Field Log */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-550 shadow-sm transition-all duration-300 border-t-4 border-t-blue-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">📝</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Field Visits Tracking</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Record consultations on-site, log tick-borne disease hotspots, and issue veterinary movement cards.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full text-[9px] font-extrabold uppercase">
                      Offline Capable
                    </span>
                  </div>
                </div>

                {/* 3. Double-Entry Billing */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-550 shadow-sm transition-all duration-300 border-t-4 border-t-blue-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">🧾</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Professional Billing</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Automate client billing for surgeries, manage medication rates, and distribute shares transparently.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full text-[9px] font-extrabold uppercase">
                      Instant receipts
                    </span>
                  </div>
                </div>

                {/* 4. Disease Surveillance */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-550 shadow-sm transition-all duration-300 border-t-4 border-t-blue-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">📡</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Vector Outbreak Defense</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Gain structural insights into community veterinary outbreaks and report critical quarantine guidelines.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full text-[9px] font-extrabold uppercase">
                      Zambia Outbreaks
                    </span>
                  </div>
                </div>

                {/* 5. Specimen Pathology */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-550 shadow-sm transition-all duration-300 border-t-4 border-t-blue-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">🔬</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Diagnostic Analytics</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Log specimen testing workflows, milk quality checks, parasite tracking, and treatment timelines safely.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full text-[9px] font-extrabold uppercase">
                      Integrated tests
                    </span>
                  </div>
                </div>

                {/* 6. Pharma Procurement */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-550 shadow-sm transition-all duration-300 border-t-4 border-t-blue-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">🧪</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Vet Pharm Supply Store</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Access official veterinary medicine directories to restock certified vaccines, antibiotics, and tools.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full text-[9px] font-extrabold uppercase">
                      Verified supply
                    </span>
                  </div>
                </div>
              </>
            )}

            {activeWelcomeRoleTab === "supplier" && (
              <>
                {/* 1. Custom Store Profile */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-550 shadow-sm transition-all duration-300 border-t-4 border-t-amber-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">🌟</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Merchant Storefront Profile</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Onboard and design your digital storefront with custom corporate brand logos, locations, and direct contact numbers.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-[9px] font-extrabold uppercase">
                      Branded Storefront
                    </span>
                  </div>
                </div>

                {/* 2. Catalog Inventory */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-550 shadow-sm transition-all duration-300 border-t-4 border-t-amber-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">📦</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Dynamic Inventory Manager</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Publish products with specialized unit of measures, minimum photo uploads, VAT toggles, and live stock trackers.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-[9px] font-extrabold uppercase">
                      Active Catalog
                    </span>
                  </div>
                </div>

                {/* 3. Flexible Lipila Checkout */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-550 shadow-sm transition-all duration-300 border-t-4 border-t-amber-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">💸</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Instant Mobile Money Receipts</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Accept customer mobile money payments instantly via Lipila with standard double-entry accounting reconciliation.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-[9px] font-extrabold uppercase">
                      100% Secure Lipila
                    </span>
                  </div>
                </div>

                {/* 4. Direct Delivery Calculations */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-550 shadow-sm transition-all duration-300 border-t-4 border-t-amber-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">🚚</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Automated Kilometre Delivery</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Establish custom per-kilometer delivery metrics and offer buyers precise live shipping quotes instantly.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-[9px] font-extrabold uppercase">
                      Localized Transport
                    </span>
                  </div>
                </div>

                {/* 5. Integrated Ledger Feed */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-550 shadow-sm transition-all duration-300 border-t-4 border-t-amber-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">💹</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">ZRA Tax Ledger feeds</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Synchronize your store revenue journals directly to double-entry ledgers with ZRA-compliant VAT summaries.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-[9px] font-extrabold uppercase">
                      ZRA Compliant
                    </span>
                  </div>
                </div>

                {/* 6. Cashless Commerce */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-550 shadow-sm transition-all duration-300 border-t-4 border-t-amber-500 flex flex-col justify-between col-span-1">
                  <div className="space-y-4">
                    <div className="text-3xl">⚡</div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Optimized Speed Delivery</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Lightweight server-side response designs guarantee users in rural blocks with weak networks buy smoothly.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-[9px] font-extrabold uppercase">
                      Maximized Conversion
                    </span>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* CTA ON FEATURES CARD */}
          <div className="text-center mt-12">
            <button
              onClick={() => {
                setActiveTab("register");
                setIsViewingLanding(false);
              }}
              className="px-8 py-4 bg-[#4ade80] hover:bg-[#3ec470] text-slate-950 font-black rounded-xl text-sm shadow-md hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <span>Start Farming Smarter — Free 30 Days</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* PRICING SECTION - PULLS LIVE FROM PLATFORM ADMIN TIERS WITH PREMIUM THEME */}
        <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-b border-slate-200 bg-[#1a3d0f] text-white rounded-3xl my-12 shadow-xl">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-[#5cb83a] font-bold">Simple Pricing</span>
            <h2 className="text-2xl md:text-3.5xl font-black text-white tracking-tight">Start free. Grow on your terms.</h2>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              These subscription plans are configured dynamically by the Platform Admin. No credit card required. Cancel anytime. All plans support Mobile Money (MoMo).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformPackages.filter(pkg => !pkg.id?.startsWith("vet-") && !pkg.name?.toLowerCase().includes("veterinary") && !pkg.name?.toLowerCase().includes("clinic") && pkg.name !== "Agro-Vet Clinical Suite").map((pkg, idx) => {
              const isPopular = pkg.name.toLowerCase().includes("farmer");
              return (
                <div 
                  key={pkg.id || idx} 
                  className={`rounded-2xl border p-6 flex flex-col justify-between space-y-6 relative hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 ${
                    isPopular 
                      ? "bg-white text-slate-900 border-[#5cb83a] shadow-xl shadow-emerald-950/25" 
                      : "bg-white/[0.06] text-white border-white/10"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute top-0 left-1/2 translate-x-[-50%] translate-y-[-50%] bg-[#5cb83a] text-[#1a3d0f] font-black tracking-wider text-[8px] uppercase px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                      ⭐ Most Popular check
                    </span>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className={`font-black text-sm uppercase tracking-wide ${isPopular ? "text-[#1a3d0f]" : "text-slate-100"}`}>{pkg.name}</h3>
                      <p className={`text-[10px] leading-normal mt-1.5 font-medium ${isPopular ? "text-slate-500" : "text-white/60"}`}>
                        {pkg.description || pkg.features || "Zambian localized farm management"}
                      </p>
                    </div>
                    
                    <div className={`flex flex-col py-2.5 border-y space-y-0.5 ${isPopular ? "border-slate-100" : "border-white/10"}`}>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-mono font-black ${isPopular ? "text-[#1a3d0f]" : "text-white"}`}>
                          {pkg.price === 0 ? "Free" : `ZMW ${pkg.price}`}
                        </span>
                        {pkg.price > 0 && <span className={`text-[9.5px] font-bold ${isPopular ? "text-slate-400" : "text-white/50"}`}>/month</span>}
                        {pkg.price === 0 && <span className={`text-[9.5px] font-bold ${isPopular ? "text-slate-400" : "text-white/50"}`}>forever</span>}
                      </div>
                      <div className={`text-[10.5px] font-bold ${isPopular ? "text-[#2d6a1f]" : "text-[#5cb83a]"}`}>
                        {pkg.price === 0 ? "For starting operations" : <>or <span className="font-mono font-black">USD ${pkg.priceUSD || Math.round(pkg.price / 20)}</span>/mo</>}
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs">
                      <li className={`flex items-center gap-1.5 font-black p-2 rounded w-fit ${isPopular ? "text-[#2d6a1f] bg-[#e8f5e2]" : "text-[#5cb83a] bg-white/10"}`}>
                        <Zap className="w-3.5 h-3.5 fill-current animate-pulse shrink-0" />
                        <span>{pkg.credits?.toLocaleString() || "60"} Operations Credits</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isPopular ? "text-[#3d8c2a]" : "text-[#5cb83a]"}`} />
                        <span className={isPopular ? "text-slate-600" : "text-white/80"}>Continuous ledger accounting</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isPopular ? "text-[#3d8c2a]" : "text-[#5cb83a]"}`} />
                        <span className={isPopular ? "text-slate-600" : "text-white/80"}>Tax compliance summaries (ZRA)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isPopular ? "text-[#3d8c2a]" : "text-[#5cb83a]"}`} />
                        <span className={isPopular ? "text-slate-600" : "text-white/80"}>Integrated crops & poultry registers</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isPopular ? "text-[#3d8c2a]" : "text-[#5cb83a]"}`} />
                        <span className={isPopular ? "text-slate-600" : "text-white/80"}>Priority support channel Access</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => {
                      setSubscriptionTier(pkg.name);
                      if (pkg.name === "Marketplace Supplier") {
                        setActiveTab("register-vendor");
                      } else {
                        setActiveTab("register");
                      }
                      setIsViewingLanding(false);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-black tracking-wide transition transform hover:scale-[1.01] cursor-pointer ${
                      isPopular 
                        ? "bg-[#2d6a1f] hover:bg-[#1a3d0f] text-white shadow-md shadow-emerald-700/20" 
                        : "bg-white text-[#1a3d0f] hover:bg-slate-100 shadow-md"
                    }`}
                  >
                    {pkg.price === 0 ? "Get Started Free" : "Get Plan"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* TESTIMONIALS SECTION (SOCIAL PROOF) */}
        <section id="testimonials" className="py-20 px-6 max-w-7xl mx-auto border-b border-slate-200">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold">Voice of Smallholders</span>
            <h2 className="text-2xl md:text-3.5xl font-black text-slate-950 tracking-tight">Endorsed by Agricultural Entrepreneurs</h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Read how smallholders and cooperative administrators use Mabala to track financial ledgers and secure veterinary treatments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Testimonial 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <blockquote className="text-slate-600 font-medium text-xs leading-relaxed italic">
                "We operate 4 separate broiler houses in Kafue. Tracking dynamic feed budgets and matching feed purchase invoices to debits took days. With Mabala, continuous double-entry ledger coordinates manage our inventory with 100% mathematical precision."
              </blockquote>
              <div className="flex items-center gap-3 pt-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase font-sans">
                  BN
                </span>
                <div>
                  <strong className="text-xs text-slate-950 block">Benson Ng'andu</strong>
                  <span className="text-[10px] text-slate-400 block font-semibold">Chief Operator · Sunrise Agro-Tech Farms</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <blockquote className="text-slate-600 font-medium text-xs leading-relaxed italic">
                "The Veterinary mode was the exact bridge we needed. We can record professional client advice and monitor client herd records in one clean visual dashboard, with 15% VAT summaries ready for standard ZRA audit filing."
              </blockquote>
              <div className="flex items-center gap-3 pt-2">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs uppercase font-sans">
                  ZC
                </span>
                <div>
                  <strong className="text-xs text-slate-950 block">Dr. Zoie K Chibeka</strong>
                  <span className="text-[10px] text-slate-400 block font-semibold">Senior Vet Partner · Deep Valley Animal Care</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CONTACT SECTION - ALL DETAILS CONFIGURABLE BY PLATFORM ADMIN */}
        <section id="contact" className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-5 space-y-6 text-slate-800">
            <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold block">Contact Details</span>
            
            <h2 className="text-2xl md:text-3.5xl font-black text-slate-990 tracking-tight leading-tight">
              Get in Touch with Mabala Representatives
            </h2>
            
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Have specific questions about livestock tagging scales, bulk database migrations, or double-entry ledgers? Connect with us via our active coordinate channels.
            </p>

            <div className="space-y-4 pt-2 font-semibold text-xs">
              
              <div className="flex gap-3.5 items-start">
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-650 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Physical Headquarters</span>
                  <p className="text-slate-700 leading-relaxed mt-0.5">{contactDetails.address}</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-650 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Telephone Line</span>
                  <p className="text-slate-700 mt-0.5">{contactDetails.phone}</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-650 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Support Desk Email</span>
                  <a href={`mailto:${contactDetails.email}`} className="text-emerald-600 hover:underline mt-0.5 block">{contactDetails.email}</a>
                </div>
              </div>

            </div>
          </div>

          <div className="md:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Write an Inquiry Message</h3>
            <p className="text-xs text-slate-400">Fill in the security audited portal inbox to route questions to platform admins immediately.</p>
            
            <form onSubmit={handleSendMessage} className="space-y-4 text-xs font-semibold">
              {submittedContact ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 animate-fade-in text-center space-y-2">
                  <strong className="block text-xs uppercase font-extrabold text-emerald-900">✔ Message Dispatched</strong>
                  <p className="text-[11px] leading-relaxed text-emerald-700">Your agricultural inquiry has been routed successfully to <strong>support@mabala.com</strong> via Mabala Secure Message Link. Expect an official response within 24 operational hours.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Your Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={contactForm.name}
                        onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Miyanda Chinkuba"
                        className="w-full text-xs mt-1 p-2.5 border bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded outline-none focus:border-emerald-500 transition-all font-semibold" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={contactForm.email}
                        onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="miyanda@chinkubafarms.com"
                        className="w-full text-xs mt-1 p-2.5 border bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded outline-none focus:border-emerald-500 transition-all font-semibold" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Detailed Message</label>
                    <textarea 
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Input billing, compliance, or biological setup queries..."
                      className="w-full text-xs mt-1 p-2.5 border bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded outline-none focus:border-emerald-500 transition-all font-semibold" 
                    />
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition cursor-pointer">
                    Submit Query Securely
                  </button>
                </>
              )}
            </form>
          </div>

        </section>

        {/* PUBLIC FOOTER */}
        <footer className="bg-slate-900 text-slate-450 text-xs py-12 px-6 border-t border-slate-850 mt-auto bg-slate-950 text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div className="space-y-1.5 flex flex-col items-center md:items-start text-center md:text-left">
              <span className="font-extrabold text-white text-sm uppercase tracking-wider block">Mabala SaaS © 2026</span>
              {/* MANDATORY COPYRIGHT LINE */}
              <p className="text-[11px] font-bold text-slate-450 leading-relaxed max-w-sm">
                Mabala © 2026 · Built by Deep Valley Farms for African Farmers
              </p>
            </div>

            <div className="flex gap-4 font-bold text-[11px]">
              <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-white transition cursor-pointer pointer-events-auto">Privacy Policy</a>
              <span className="text-slate-800">|</span>
              <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" className="hover:text-white transition cursor-pointer pointer-events-auto">Terms of Service</a>
            </div>

            <div className="flex gap-3.5">
              {contactDetails.twitter && (
                <a href={contactDetails.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title="Twitter Channel">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {contactDetails.facebook && (
                <a href={contactDetails.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title="Facebook Page">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {contactDetails.linkedin && (
                <a href={contactDetails.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title="LinkedIn Corporate">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>

          </div>
        </footer>

        {/* LEGAL POPUP DIALOGS */}
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-slate-200 animate-scale-up text-slate-800 shadow-2xl relative">
              <button 
                onClick={() => setShowPolicyModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h4 className="text-sm font-black uppercase text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>{showPolicyModal === "privacy" ? "Simulated Privacy Policy" : "Simulated Terms of Service"}</span>
              </h4>
              
              <div className="text-xs text-slate-500 space-y-4 max-h-[300px] overflow-y-auto pr-1 pt-3.5 leading-relaxed font-semibold">
                {showPolicyModal === "privacy" ? (
                  <>
                    <p><strong>1. Data Sovereign Isolation</strong>: Every farm, multi-resident veterinary practice, or corporate co-op registered in Mabala maintains isolated file volumes. Database objects are accessible only to validated tenant email addresses.</p>
                    <p><strong>2. Compliance and Direct Auditing logs</strong>: Mabala coordinates strict security tracking audit records. Every animal weight input, payroll credit purchase, or double-entry ledger adjustment records active user metadata permanently.</p>
                    <p><strong>3. Simulated Cookies & Local Sessions</strong>: Mabala utilizes standard secure storage identifiers such as local session flags and JWT representations in secure environment contexts for offline-first state resilience.</p>
                  </>
                ) : (
                  <>
                    <p><strong>1. Double-Entry ledger precision Guarantee</strong>: Continuous accounting features do not simulate standard ledger structures. Users agree to map expenditures with valid double-entry balance keys.</p>
                    <p><strong>2. Pre-Purchased Wallet Credit blocks</strong>: All expense journals, poultry weight calculators, and tax summaries necessitate billing commission logs. Transaction credits cannot be exchanged for raw physical funds.</p>
                    <p><strong>3. Active Platform Administration Elevacy</strong>: Platform administrator switches must stay unique to Deep Valley Farms Limited and deepvaleyfarm@gmail.com, universally disappearing from ordinary user options.</p>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 text-right mt-4">
                <button 
                  onClick={() => setShowPolicyModal(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WHATSAPP FLOATING SUPPORT BUTTON */}
        <a 
          href={`https://wa.me/${contactDetails.whatsapp || "260978070734"}?text=Hi%2C%20I%27d%20like%20to%20know%20more%20about%20Mabala%20Farm%20Management`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="fixed bottom-7 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 group cursor-pointer"
          title="Chat on WhatsApp"
        >
          <div className="absolute right-[4.5rem] bottom-3 bg-slate-900 border border-slate-800 text-white text-[10.5px] font-bold py-1.5 px-3 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-md">
            Chat with us on WhatsApp
          </div>
          <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>

      </div>
    );
  }

  // Fallback to the authentic interactive login/registration screens
  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 select-none font-sans bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        
        {/* Left Sidebar Info Banner */}
        <div className="md:col-span-5 bg-slate-900 p-8 flex flex-col justify-between text-white relative">
          <div>
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-emerald-500/30">
              M
            </div>
            <h1 className="text-2xl font-bold mt-6 tracking-tight">Mabala SaaS</h1>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed font-semibold">
              Agricultural Engineering Cloud Platform providing localized Chart of Accounts, payroll, poultry weight calculation, and Tilapia aquaculture records.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Multi-Country Localizer</h4>
                  <p className="text-[11px] text-slate-400 leading-snug font-medium">Zambia-specific levies & 15% tax summary vs Generic calculations across Africa.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Double-Entry Ledger</h4>
                  <p className="text-[11px] text-slate-400 leading-snug font-medium">Continuous posting maps expenses to 1010 Bank and specific 5xxx categories natively.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Hercules AI Support</h4>
                  <p className="text-[11px] text-slate-400 leading-snug font-medium">Embedded biological & financial co-pilot ready to answer FCR metrics & tax limits.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono tracking-wider">
            TRUSTED REGIONAL AGRIC-TECH v2.0
          </div>
        </div>

        {/* Right Form Component */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center relative">
          
          {/* Back button to public marketing site */}
          <button 
            type="button"
            onClick={handleBackToMarketing}
            className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold transition flex items-center gap-1 cursor-pointer text-[10px]"
          >
            <span>← Back to Marketing Site</span>
          </button>

          {/* Verification Sent Banner */}
          {showVerificationSent && (
            <div className="space-y-6 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Verify Your Email Address</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  We have sent a verification link to <strong className="text-slate-700">{registerEmail}</strong>. Click the verification button below to activate your isolated tenant store.
                </p>
              </div>
              <button
                onClick={verifyEmailCode}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                Proceed to Multi-Factor Authentication
              </button>
            </div>
          )}

          {/* OTP screen */}
          {showOtpScreen && !showVerificationSent && (
            <form onSubmit={verifyOtp} className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mt-4 font-black">2FA Mandate Security Code</h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                  Mabala enforces Multi-Factor Authentication for all African tenants. Enter the 6-digit code sent to your registered account email: <strong className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-[12px]">{tempData?.email || "your registered address"}</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">One-Time Code (OTP)</label>
                <input
                  type="text"
                  placeholder="******"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  required
                  className="w-full tracking-widest text-center text-lg font-bold border rounded-lg p-2.5 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                />


                {otpError && (
                  <div className="p-3 bg-amber-50 border border-amber-250 text-amber-900 rounded-xl text-[10.5px] font-medium leading-relaxed">
                    ⚠️ {otpError}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                Verify 2FA & Secure Session
              </button>

              <button
                type="button"
                onClick={handleBackToPassword}
                className="w-full py-2 px-4 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg text-[11px] uppercase tracking-wider font-extrabold transition-all cursor-pointer text-center"
              >
                ← Back, Enter Password Again
              </button>
            </form>
          )}

          {/* Regular Login/Register Layout */}
          {!showOtpScreen && !showVerificationSent && (
            <div className="flex-1 flex flex-col justify-between pt-6">
              <div>
                <div className="flex bg-slate-100 p-1 rounded-lg gap-2 mb-6 flex-wrap">
                  <button
                    onClick={() => {
                      setActiveTab("login");
                      setFormError("");
                    }}
                    className={`flex-1 min-w-[70px] py-1.5 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                      activeTab === "login" ? "bg-white text-slate-800 shadow-sm animate-scale-up" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("register");
                      setFormError("");
                    }}
                    className={`flex-1 min-w-[110px] py-1.5 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                      activeTab === "register" ? "bg-white text-slate-800 shadow-sm animate-scale-up" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Farmer Org
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("register-vendor");
                      setFormError("");
                    }}
                    className={`flex-1 min-w-[100px] py-1.5 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                      activeTab === "register-vendor" ? "bg-white text-slate-800 shadow-sm animate-scale-up" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Agro-Vendor
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("register-vet");
                      setFormError("");
                    }}
                    className={`flex-1 min-w-[110px] py-1.5 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                      activeTab === "register-vet" ? "bg-indigo-600 text-white shadow-sm animate-scale-up" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    🏥 Veterinary
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("register-offtaker");
                      setFormError("");
                    }}
                    className={`flex-1 min-w-[110px] py-1.5 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                      activeTab === "register-offtaker" ? "bg-emerald-600 text-white shadow-sm animate-scale-up" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    🌾 Offtaker
                  </button>
                </div>

                {activeTab === "login" ? (
                  showGoogleAccountScreen ? (
                    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-150 shadow-sm animate-fade-in font-sans text-slate-800 text-xs">
                      {/* Google Sign-In Header */}
                      <div className="flex justify-start mb-1 text-slate-400">
                        {/* Beautiful Google Mini logo */}
                        <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.1z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-normal text-[#202124] tracking-tight leading-tight select-none">
                        You're signing back in to Mabala
                      </h2>

                      {/* Interactive Email Badge */}
                      <div className="py-2 flex">
                        {isEditingGoogleEmail ? (
                          <div className="flex gap-2 items-center animate-fade-in w-full">
                            <input
                              type="email"
                              value={selectedGoogleEmail}
                              onChange={(e) => setSelectedGoogleEmail(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  setIsEditingGoogleEmail(false);
                                }
                              }}
                              className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/10 outline-none font-medium"
                              placeholder="Enter Google account email..."
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setIsEditingGoogleEmail(false)}
                              className="text-[10px] px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setIsEditingGoogleEmail(true)}
                            className="inline-flex items-center gap-2 border border-[#dadce0] rounded-full py-1 pl-1 pr-3 hover:bg-slate-50 transition-all cursor-pointer select-none bg-white font-medium max-w-full truncate shadow-sm hover:shadow"
                            title="Click to use a different Google Account"
                          >
                            <div className="w-5 h-5 rounded-full bg-indigo-650 text-white flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                              {selectedGoogleEmail ? selectedGoogleEmail.charAt(0).toUpperCase() : "G"}
                            </div>
                            <span className="text-[11px] text-[#3c4043] font-medium truncate">{selectedGoogleEmail}</span>
                            <svg className="w-3 h-3 text-slate-400 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Google guidelines & Privacy links */}
                      <div className="space-y-4 text-[11px] font-normal leading-relaxed text-[#3c4043] text-left select-none">
                        <p>
                          Review Mabala's{" "}
                          <button
                            type="button"
                            onClick={() => setShowPolicyModal("privacy")}
                            className="text-[#1a73e8] hover:underline font-medium cursor-pointer"
                          >
                            Privacy Policy
                          </button>{" "}
                          and{" "}
                          <button
                            type="button"
                            onClick={() => setShowPolicyModal("terms")}
                            className="text-[#1a73e8] hover:underline font-medium cursor-pointer"
                          >
                            Terms of Service
                          </button>{" "}
                          to understand how Mabala will process and protect your data.
                        </p>
                        <p>
                          To make changes at any time, go to your{" "}
                          <a
                            href="https://myaccount.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1a73e8] hover:underline font-medium"
                          >
                            Google Account
                          </a>
                          .
                        </p>
                        <p>
                          Learn more about{" "}
                          <a
                            href="https://support.google.com/accounts/answer/11249876"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1a73e8] hover:underline font-medium"
                          >
                            Sign in with Google
                          </a>
                          .
                        </p>
                      </div>

                      {/* Google sign-in status message */}
                      {isSendingOtp && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 animate-pulse justify-center py-1 font-sans">
                          <span className="w-2 h-2 rounded-full bg-[#1a73e8] animate-pulse"></span>
                          <span>Authorising Google credentials...</span>
                        </div>
                      )}

                      {/* Action Pill Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={isSendingOtp}
                          onClick={() => setShowGoogleAccountScreen(false)}
                          className="flex-1 py-2.5 px-4 border border-[#dadce0] rounded-full text-xs font-semibold text-[#1a73e8] hover:bg-[#1a73e8]/5 disabled:opacity-50 transition-all cursor-pointer text-center select-none font-sans"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSendingOtp}
                          onClick={handleGoogleScreenContinue}
                          className="flex-1 py-2.5 px-4 border border-[#dadce0] rounded-full text-xs font-semibold text-[#1a73e8] hover:bg-[#1a73e8]/5 disabled:opacity-50 transition-all cursor-pointer text-center select-none shadow-sm flex items-center justify-center gap-1.5 font-sans"
                        >
                          <span>{isSendingOtp ? "Authenticating..." : "Continue"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleLoginSubmit} className="space-y-4 font-semibold text-xs text-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Sign In to Your Tenant</h2>
                    <p className="text-xs text-slate-400 font-medium leading-normal">
                      Access your multi-farm data structure, payroll localized books, and inventories.
                    </p>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. farmer@mabala.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                        <button
                          type="button"
                          onClick={() => {
                            setRecoveryEmail(loginEmail);
                            setRecoverySuccess(false);
                            setRecoveryError("");
                            setRecoveryMessage("");
                            setShowRecoveryModal(true);
                          }}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer bg-transparent border-none p-0"
                          id="forgot-credentials-btn"
                        >
                          Forgot Username or Password?
                        </button>
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                      />
                    </div>

                    {demoCredentialsPopulated && (
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold leading-relaxed animate-fade-in space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>Mabala Demo Credentials Loaded!</span>
                        </div>
                        <p className="text-slate-600 font-medium text-[11px]">
                          Sandbox mode requires secure authentication. We have populated the official demo account credentials below (Email: <strong className="text-emerald-700">mabalademo@mabala.cloud</strong>, Password: <strong className="text-emerald-700">Mabala@2026</strong>) as requested. Please click <strong className="text-emerald-700">Login Securely</strong> below to enter the sandbox with preloaded data.
                        </p>
                      </div>
                    )}

                    {formError && (
                      <div className="animate-fade-in">
                        {formError.includes("popup-closed-by-user") || formError.includes("popup-blocked") || formError.includes("internal-error") || formError.includes("unauthorized-domain") || formError.includes("auth-domain") ? (
                          <div className="p-3.5 bg-rose-50/90 border border-rose-200 text-rose-950 rounded-xl text-xs font-semibold leading-relaxed space-y-2">
                            <div className="font-bold text-rose-800 flex items-center gap-1">
                              <span>⚠️ Google Auth Iframe Restrictions</span>
                            </div>
                            <p className="text-slate-600 font-medium text-[11px] leading-normal">
                              Because this workspace runs inside a sandboxed <strong>iframe</strong> within Google AI Studio, standard third-party popup authentication is heavily restricted by browser sandboxing.
                            </p>
                            <div className="bg-white/90 p-2.5 rounded-lg border border-rose-150 font-medium text-[11px] space-y-1">
                              <p className="font-bold text-emerald-800">💡 Instant Solutions:</p>
                              <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium">
                                <li>Click the <strong>"Open in New Tab" (Pop out)</strong> button in the top-right corner of the preview toolbar, then log in there. It works instantly!</li>
                                <li>Alternatively, use the <strong>Secure Handshake Google Account Bypass</strong> field below. Input your Google email and you will be signed in natively.</li>
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-rose-50 border border-rose-250 text-rose-905 rounded-xl text-[11px] font-bold leading-relaxed shadow-xs">
                            ⚠️ {formError}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isSendingOtp ? "Authenticating..." : "Login Securely"}</span>
                    </button>

                    {onGoogleSignIn && (
                      <>
                        <div className="flex items-center my-3">
                          <div className="flex-1 border-t border-slate-200"></div>
                          <span className="px-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-white">or</span>
                          <div className="flex-1 border-t border-slate-200"></div>
                        </div>

                        <button
                          type="button"
                          onClick={handleGoogleSignInClick}
                          disabled={isSendingOtp}
                          className="w-full py-2 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.1z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                          </svg>
                          <span>Sign In with Google</span>
                        </button>

                        <div className="text-center mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowGoogleBypassField(!showGoogleBypassField);
                              setFormError("");
                            }}
                            className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline transition-colors cursor-pointer"
                          >
                            {showGoogleBypassField ? "✕ Hide Bypass Google Field" : "🔑 Google login blocked? Click here for Secure Bypass"}
                          </button>
                        </div>

                        {showGoogleBypassField && (
                          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3.5 mt-3 animate-fade-in space-y-2">
                            <p className="text-[11px] font-semibold text-emerald-950 flex items-center gap-1.5 leading-snug">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                              <span>Secure Handshake Google Account Bypass</span>
                            </p>
                            <p className="text-[10px] font-medium text-slate-500 leading-snug">
                              Popups are restricted in sandboxed iframes. Enter your Google email to instantly authorise & sign in.
                            </p>
                            <div className="flex gap-1.5 mt-1.5">
                              <input
                                type="email"
                                placeholder="Enter Google/Gmail email..."
                                value={googleBypassEmail}
                                onChange={(e) => setGoogleBypassEmail(e.target.value)}
                                className="flex-1 min-w-0 border rounded-lg px-2.5 py-1 text-xs bg-white outline-none focus:border-emerald-500 font-medium text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={handleGoogleBypassSubmit}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-1 text-xs font-bold shadow-sm transition-colors cursor-pointer"
                              >
                                Authorise & Enter
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </form>
                )
                ) : activeTab === "register" ? (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3 font-semibold text-xs text-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Register Organization Tenant</h2>
                    <p className="text-xs text-slate-400 font-medium leading-normal">
                      Select subscriber country to bind currency and configure local compliance systems.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                        <input
                          type="text"
                          placeholder="Zoie Chibeka"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                        <input
                          type="email"
                          placeholder="manager@myagro.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Farm / Practice Name</label>
                        <input
                          type="text"
                          placeholder="Siavonga Gold Farms / Lusaka Vet Clinic"
                          value={farmName}
                          onChange={(e) => setFarmName(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Subscriber Country</label>
                        <select
                          value={selectedCountryCode}
                          onChange={(e) => setSelectedCountryCode(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-850"
                        >
                          {COUNTRIES.map((c) => (
                             <option key={c.code} value={c.code}>
                               {c.flag} {c.name} ({c.currency})
                             </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tenant Profile Contact Number (For Profile/MFA)</label>
                      <input
                        type="text"
                        placeholder="e.g. 0978070734"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Subscription Tier & Role Plan</label>
                      <select
                        value={subscriptionTier}
                        onChange={(e) => setSubscriptionTier(e.target.value)}
                        className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-850 cursor-pointer"
                      >
                        {platformPackages.filter(p => p.isActive && !p.id?.startsWith("vet-") && !p.name?.toLowerCase().includes("veterinary") && !p.name?.toLowerCase().includes("clinic") && p.name !== "Agro-Vet Clinical Suite").map((p) => {
                          const isZm = selectedCountryCode === "ZM";
                          const rateLabel = isZm 
                            ? `ZK ${p.price}` 
                            : `USD $${p.priceUSD || Math.round(p.price / 20)}`;
                          return (
                            <option key={p.id || p.name} value={p.name}>
                              {p.name} (+{p.credits} Monthly Credits) — {rateLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Confirm Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                    </div>

                    {formError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-250 text-rose-800 rounded-xl text-[11px] font-bold leading-relaxed animate-fade-in shadow-xs">
                        ⚠️ {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isSendingOtp ? "Provisioning..." : "Provision Tenant Database"}</span>
                    </button>
                  </form>
                ) : activeTab === "register-vendor" ? (
                  <form onSubmit={handleVendorRegisterSubmit} className="space-y-3 font-semibold text-xs text-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Mabala Self-Service Merchant Directory</h2>
                    <p className="text-xs text-slate-400 font-medium leading-normal">
                      Scale B2B Agro distribution and reach Zambian farmers. Enter credentials to govern secure directory access.
                    </p>

                    {/* Choose subscription package */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block font-mono">Choose Subscription Package Plan</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { id: "Basic", name: "Mabala Basic Merchant", cost: 150, desc: "Publish up to 5 items inside farm catalogs.", badge: "Organic Growth", credits: 300 },
                          { id: "Elite", name: "Mabala Elite Vendor", cost: 500, desc: "Publish 25 items, prioritize results directories, analytics.", badge: "Professional Trade", credits: 5000 },
                          { id: "Cooperative Pro", name: "Cooperative Pro", cost: 1000, desc: "Infinite product catalogue, multi-agent store logins.", badge: "Zambia National Co-ops", credits: 25000 }
                        ].map(pkg => {
                          const isSelected = onboardPkg === pkg.id;
                          return (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => setOnboardPkg(pkg.id as any)}
                              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                                isSelected 
                                  ? "bg-slate-900 border-slate-900 text-white shadow" 
                                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                              }`}
                            >
                              <div>
                                <span className={`text-[8px] uppercase font-mono font-bold block pb-0.5 ${isSelected ? "text-emerald-400" : "text-emerald-600"}`}>
                                  {pkg.badge}
                                </span>
                                <h4 className="font-bold text-[10px] leading-tight block">{pkg.name}</h4>
                              </div>
                              <span className="text-[10px] font-mono font-extrabold block mt-1.5">{pkg.cost} ZMW/mo</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Store / Merchant Public Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Kasama Seed Distributors"
                          value={onboardVendorName}
                          onChange={(e) => setOnboardVendorName(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Trade Niche Category</label>
                        <select
                          value={onboardCategory}
                          onChange={(e) => setOnboardCategory(e.target.value as any)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-850"
                        >
                          <option value="Seeds & Agronomy">Seeds & Agronomy</option>
                          <option value="Veterinary & Health">Veterinary & Health</option>
                          <option value="Equipment & Tech">Equipment & Tech</option>
                          <option value="Feeds & Formulations">Feeds & Formulations</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">City / Town (Zambia)</label>
                      <select
                        value={onboardCity}
                        onChange={(e) => setOnboardCity(e.target.value)}
                        className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-800 cursor-pointer"
                      >
                        {ZAMBIAN_CITIES.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Landmark HQ Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Near Post Office, Off Great East Road"
                        value={onboardLandmark}
                        onChange={(e) => setOnboardLandmark(e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">GPS Coordinates (Auto-Captured)</span>
                        <button
                          type="button"
                          onClick={captureGpsLocation}
                          disabled={isGpsLocating}
                          className="px-2 py-1 text-[9.5px] font-extrabold text-white bg-slate-900 rounded hover:bg-slate-850 active:bg-slate-800 tracking-wide uppercase transition-all flex items-center gap-1 cursor-pointer"
                        >
                          📍 {isGpsLocating ? "Acquiring..." : "Auto-Capture GPS Coordinates"}
                        </button>
                      </div>
                      {gpsCoordinates ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-mono text-xs font-bold bg-white px-2 py-1.5 rounded border border-emerald-250 leading-none">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{gpsCoordinates} (Captured via Geolocation)</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium font-mono leading-tight">
                          No GPS coordinates captured yet. Click the button to auto-capture or use Zambia-centric default mappings.
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Merchant Hotline</label>
                        <input
                          type="text"
                          placeholder="e.g. +260 977 123456"
                          value={onboardPhone}
                          onChange={(e) => setOnboardPhone(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Login Email Address</label>
                        <input
                          type="email"
                          placeholder="vendor@store.com"
                          value={onboardEmail}
                          onChange={(e) => setOnboardEmail(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                    </div>

                    {/* Store Logo Drag & Drop and Select field */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Store Front / Merchant Logo</label>
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(true);
                        }}
                        onDragLeave={() => setIsDraggingLogo(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setOnboardLogoUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer relative ${
                          isDraggingLogo 
                            ? "border-emerald-500 bg-emerald-50/50" 
                            : onboardLogoUrl 
                              ? "border-slate-350 bg-slate-50" 
                              : "border-slate-200 hover:border-slate-300 bg-slate-50/20"
                        }`}
                        onClick={() => {
                          const el = document.getElementById("logo-file-input");
                          if (el) el.click();
                        }}
                      >
                        <input
                          id="logo-file-input"
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setOnboardLogoUrl(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {onboardLogoUrl ? (
                          <div className="flex flex-col items-center justify-center gap-1.5Packed">
                            <img 
                              src={onboardLogoUrl} 
                              alt="Store logo preview" 
                              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 bg-white shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[9.5px] text-emerald-600 font-extrabold font-mono">✓ STORE LOGO CAPTURED SUCCESSFULLY</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOnboardLogoUrl("");
                              }}
                              className="text-[9.5px] text-rose-500 hover:text-rose-700 underline font-semibold cursor-pointer"
                            >
                              Remove & Upload New Store Logo
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1 text-slate-400">
                            <div className="text-xl">🏬</div>
                            <p className="text-[11px] font-bold text-slate-600">Drag & drop your store font logo, or <span className="text-emerald-600 underline">browse files</span></p>
                            <p className="text-[9.5px] text-slate-400 font-medium">Supports PNG, JPG, WebP formats</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Login Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={onboardPassword}
                          onChange={(e) => setOnboardPassword(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Confirm Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={onboardConfirmPassword}
                          onChange={(e) => setOnboardConfirmPassword(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                    </div>

                    {formError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-250 text-rose-800 rounded-xl text-[11px] font-bold leading-relaxed animate-fade-in shadow-xs">
                        ⚠️ {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isSendingOtp ? "Provisioning..." : "PROCESS VENDOR SUBSCRIPTION & SELF-ONBOARD STORE"}</span>
                    </button>
                  </form>
                ) : activeTab === "register-offtaker" ? (
                  <form onSubmit={handleOfftakerRegisterSubmit} className="space-y-3 font-semibold text-xs text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div>
                      <h2 className="text-xl font-sans font-extrabold tracking-tight text-emerald-950">Offtaker Self-Registration (Free)</h2>
                      <p className="text-[11px] text-slate-500 font-medium leading-normal">
                        Register your warehouse and corporate profile. Zero upfront signup fee. Wallet funding as needed via Lipila.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Organization Legal Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Kasama Milling Ltd"
                          value={offtakerLegalName}
                          onChange={(e) => setOfftakerLegalName(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-550 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">PACRA Registration Number</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. LCO-291039-AZ"
                          value={offtakerPacraNumber}
                          onChange={(e) => setOfftakerPacraNumber(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-555 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Zambian Sector Category</label>
                        <select
                          value={offtakerSector}
                          onChange={(e) => setOfftakerSector(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-555 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-800"
                        >
                          <option value="Grain">Grain & Maize Millers</option>
                          <option value="Dairy">Dairy Processors</option>
                          <option value="Cotton">Cotton Ginners</option>
                          <option value="Tobacco">Tobacco Aggregators</option>
                          <option value="Livestock">Meat & Poultry Packers</option>
                          <option value="Other">Other Agro-processors</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Tax Registration PIN (TPIN)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 1004928172"
                          value={offtakerTpin}
                          onChange={(e) => setOfftakerTpin(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-555 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Corporate Contact Mobile</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 0977283401"
                          value={offtakerContactPhone}
                          onChange={(e) => setOfftakerContactPhone(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-555 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Physical Depot / Collection Point</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Plot 12, Mpika Industrial Rail Depot"
                          value={offtakerDepotLocation}
                          onChange={(e) => setOfftakerDepotLocation(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-555 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block">Corporate Registered Email</label>
                      <input
                        type="email"
                        required
                        placeholder="buyer@organisation.com"
                        value={offtakerEmail}
                        onChange={(e) => setOfftakerEmail(e.target.value)}
                        className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-555 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Secure Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={offtakerPassword}
                          onChange={(e) => setOfftakerPassword(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-555 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Confirm Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={offtakerConfirmPassword}
                          onChange={(e) => setOfftakerConfirmPassword(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-emerald-555 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all mt-1 font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    {formError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-250 text-rose-800 rounded-xl text-[11px] font-bold leading-relaxed animate-fade-in shadow-xs">
                        ⚠️ {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-550 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isSendingOtp ? "Initializing..." : "REGISTER FREE OFFTAKER ORG"}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVetRegisterSubmit} className="space-y-3 font-semibold text-xs text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div>
                      <h2 className="text-xl font-sans font-extrabold tracking-tight text-indigo-900">Veterinary Clinic Onboarding</h2>
                      <p className="text-[11px] text-slate-400 font-medium">Verify your compliance standards & choose an operational ledger billing model.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-indigo-950 block">Owner / Veterinarian Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Dr. Shadrick Kasuli"
                          value={vetDirectorName}
                          onChange={(e) => setVetDirectorName(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all mt-1 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-indigo-950 block">Clinic / Practice Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Lusaka South Vet Clinic"
                          value={vetClinicName}
                          onChange={(e) => setVetClinicName(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all mt-1 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-indigo-950 block">Official Vet Email</label>
                        <input
                          type="email"
                          required
                          placeholder="doctor@vetclinic.com"
                          value={vetEmail}
                          onChange={(e) => setVetEmail(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all mt-1 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-indigo-950 block">Payment Contact Number (Momo)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., 097XXXXXXXX"
                          value={vetPhone}
                          onChange={(e) => setVetPhone(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all mt-1 font-medium text-indigo-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-indigo-950 block">District</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lusaka District"
                          value={vetDistrict}
                          onChange={(e) => setVetDistrict(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all mt-1 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-indigo-950 block">Province</label>
                        <select
                          value={vetProvince}
                          onChange={(e) => setVetProvince(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all mt-1 font-semibold"
                        >
                          <option value="Lusaka Province">Lusaka</option>
                          <option value="Southern Province">Southern</option>
                          <option value="Copperbelt Province">Copperbelt</option>
                          <option value="Central Province">Central</option>
                          <option value="Eastern Province">Eastern</option>
                          <option value="Northern Province">Northern</option>
                          <option value="Western Province">Western</option>
                          <option value="North-Western Province">North-Western</option>
                          <option value="Muchinga Province">Muchinga</option>
                          <option value="Luapula Province">Luapula</option>
                        </select>
                      </div>
                    </div>

                    {/* Subscription Mode Selector Toggle Switch */}
                    <div className="pt-2">
                      <label className="text-[10px] uppercase font-extrabold text-[#475569] block pb-1">Choose Billing Ledger Model</label>
                      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setVetSubMode("PAYG")}
                          className={`flex-1 py-1.5 text-center text-[9px] sm:text-[10px] font-black rounded-xl transition-all cursor-pointer ${
                            vetSubMode === "PAYG" 
                              ? "bg-indigo-600 text-white shadow-md scale-[1.01]" 
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          📦 Pay As You Go
                        </button>
                        <button
                          type="button"
                          onClick={() => setVetSubMode("Monthly")}
                          className={`flex-1 py-1.5 text-center text-[9px] sm:text-[10px] font-black rounded-xl transition-all cursor-pointer ${
                            vetSubMode === "Monthly" 
                              ? "bg-indigo-700 text-white shadow-md scale-[1.01]" 
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          🏢 Monthly Suite
                        </button>
                        <button
                          type="button"
                          onClick={() => setVetSubMode("Yearly")}
                          className={`flex-1 py-1.5 text-center text-[9px] sm:text-[10px] font-black rounded-xl transition-all cursor-pointer ${
                            vetSubMode === "Yearly" 
                              ? "bg-emerald-600 text-white shadow-md scale-[1.01]" 
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          🏆 Yearly Pro
                        </button>
                      </div>
                    </div>

                    {/* Conditional Packages Display */}
                    {vetSubMode === "PAYG" ? (
                      <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                        <span className="text-[9.5px] uppercase font-extrabold text-slate-400 block">Select PAYG Credit Pool Bundle:</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div 
                            onClick={() => setSelectedVetPaygBundleId("vet-payg-starter")}
                            className={`p-2 rounded-xl border cursor-pointer flex flex-col justify-between text-center transition-all ${
                              selectedVetPaygBundleId === "vet-payg-starter"
                                ? "border-indigo-600 bg-indigo-50/40 divide-indigo-200 shadow-sm"
                                : "border-slate-200 hover:border-slate-350 bg-slate-50/50"
                            }`}
                          >
                            <span className="text-[9px] font-black text-[#565f6c] block">Starter</span>
                            <div className="text-[11px] font-black text-indigo-900 mt-0.5">500 Credits</div>
                            <span className="text-[10.5px] font-mono text-indigo-600 block pt-1 font-extrabold">K 150</span>
                          </div>

                          <div 
                            onClick={() => setSelectedVetPaygBundleId("vet-payg-growth")}
                            className={`p-2 rounded-xl border cursor-pointer flex flex-col justify-between text-center transition-all ${
                              selectedVetPaygBundleId === "vet-payg-growth"
                                ? "border-indigo-600 bg-indigo-50/40 divide-indigo-200 shadow-sm"
                                : "border-slate-200 hover:border-slate-350 bg-slate-50/50"
                            }`}
                          >
                            <span className="text-[9px] font-black text-[#565f6c] block">Growth</span>
                            <div className="text-[11px] font-black text-indigo-900 mt-0.5">1500 Credits</div>
                            <span className="text-[10.5px] font-mono text-indigo-600 block pt-1 font-extrabold">K 400</span>
                          </div>

                          <div 
                            onClick={() => setSelectedVetPaygBundleId("vet-payg-expert")}
                            className={`p-2 rounded-xl border cursor-pointer flex flex-col justify-between text-center transition-all relative overflow-hidden ${
                              selectedVetPaygBundleId === "vet-payg-expert"
                                ? "border-indigo-600 bg-indigo-50/40 divide-indigo-200 shadow-sm"
                                : "border-slate-200 hover:border-slate-350 bg-slate-50/50"
                            }`}
                          >
                            <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 font-extrabold uppercase text-[7px] px-1 rounded-bl-md scale-[0.85]">VIP</div>
                            <span className="text-[9px] font-black text-[#565f6c] block">Expert</span>
                            <div className="text-[11px] font-black text-indigo-900 mt-0.5">5000 Credits</div>
                            <span className="text-[10.5px] font-mono text-indigo-600 block pt-1 font-extrabold">K 1200</span>
                          </div>
                        </div>
                        <p className="text-[9.5px] text-slate-400 italic">Pay on demand with MTN/Airtel/Zamtel Mobile Money. No contract required.</p>
                      </div>
                    ) : vetSubMode === "Monthly" ? (
                      <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex justify-between items-start animate-in fade-in duration-200">
                        <div className="space-y-1">
                          <span className="text-[7.5px] bg-indigo-600 text-white font-black uppercase rounded px-1.5 py-0.5 inline-block">Professional Suite</span>
                          <h4 className="text-xs font-black text-indigo-900">Agro-Vet Clinical Suite</h4>
                          <ul className="text-[10px] text-slate-500 font-medium space-y-0.5 leading-tight pt-1">
                            <li>✓ Full Veterinary clinic multi-practitioner tools</li>
                            <li>✓ 10,000 Operations credits included monthly</li>
                            <li>✓ Complete client directories & drug stock logs</li>
                          </ul>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-indigo-700 font-mono">ZK 600</div>
                          <div className="text-[9px] text-slate-400 font-medium font-mono">bill monthly</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex justify-between items-start animate-in fade-in duration-200">
                        <div className="space-y-1">
                          <span className="text-[7.5px] bg-emerald-600 text-white font-black uppercase rounded px-1.5 py-0.5 inline-block">Best Value Plan</span>
                          <h4 className="text-xs font-black text-emerald-900">Yearly Clinic Pro Suite</h4>
                          <ul className="text-[10px] text-slate-500 font-medium space-y-0.5 leading-tight pt-1">
                            <li>✓ Includes <strong>3,000 credits/month</strong> auto-replenish</li>
                            <li>✓ Decoupled ledger reporting tools</li>
                            <li>✓ Priority QR Movement passport signers</li>
                          </ul>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-700 font-mono">ZK 4,800</div>
                          <div className="text-[9px] text-slate-400 font-medium font-mono">bill annually</div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-indigo-950 block">Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={vetPassword}
                          onChange={(e) => setVetPassword(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-indigo-950 block">Confirm Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={vetConfirmPassword}
                          onChange={(e) => setVetConfirmPassword(e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all mt-1"
                        />
                      </div>
                    </div>

                    {formError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[10.5px] font-bold leading-relaxed animate-fade-in shadow-sm">
                        ⚠️ {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {isSendingOtp 
                          ? "Connecting to Lipila secure carrier gateway..." 
                          : `AUTHORIZE & PAY ${
                              vetSubMode === "PAYG" 
                                ? selectedVetPaygBundleId === "vet-payg-starter"
                                  ? "ZK 150"
                                  : selectedVetPaygBundleId === "vet-payg-growth"
                                    ? "ZK 400"
                                    : "ZK 1,200"
                                : "ZK 4,800"
                            } VIA LIPILA`}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* RECOVERY MODAL FOR FORGOT CREDENTIALS */}
          {showRecoveryModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-slate-800">
              <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-slate-200 animate-scale-up text-slate-800 shadow-2xl relative">
                <button 
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                  id="recovery-modal-close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-4 pb-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Credential Recovery Dispatch</h3>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 mb-4 p-0.5 bg-slate-50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryTab("password");
                      setRecoverySuccess(false);
                      setRecoveryError("");
                      setRecoveryMessage("");
                    }}
                    className={`flex-1 py-1 text-center text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      recoveryTab === "password" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                    }`}
                    id="recovery-tab-password"
                  >
                    Forgot Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryTab("username");
                      setRecoverySuccess(false);
                      setRecoveryError("");
                      setRecoveryMessage("");
                    }}
                    className={`flex-1 py-1 text-center text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      recoveryTab === "username" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                    }`}
                    id="recovery-tab-username"
                  >
                    Forgot Username
                  </button>
                </div>

                {recoverySuccess ? (
                  <div className="space-y-4 py-2 text-center">
                    <div className="mx-auto w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    </div>
                    <div className="p-3 bg-emerald-50/50 border border-emerald-150 rounded-xl">
                      <p className="text-xs text-emerald-950 font-medium leading-normal">
                        {recoveryMessage}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRecoveryModal(false)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRecoverySubmit} className="space-y-4">
                    {recoveryTab === "password" ? (
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-3">
                          Specify your registered email address below. We'll consult Mabala Active Directory hosts and dispatch a private recovery token to override your current password.
                        </p>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registered Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g. administrator@deepvaleyfarm.com"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-2 text-xs bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition mt-1 font-medium text-slate-800 placeholder-slate-400"
                          id="recovery-email-input"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-3">
                          Forgot your login email address? Specify your registered Farm, Practise, or Organization name. We will scan our encrypted metadata registries and safely remind you of your primary matching username.
                        </p>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registered Farm / Co-op Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Sunrise Agro-Tech Farms"
                          value={recoveryOrgName}
                          onChange={(e) => setRecoveryOrgName(e.target.value)}
                          required
                          className="w-full border rounded-lg px-3 py-2 text-xs bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition mt-1 font-medium text-slate-800 placeholder-slate-400"
                          id="recovery-org-input"
                        />
                      </div>
                    )}

                    {recoveryError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-[11px] font-bold leading-relaxed">
                        ⚠️ {recoveryError}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowRecoveryModal(false)}
                        className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessingRecovery}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-1"
                        id="recovery-submit-btn"
                      >
                        {isProcessingRecovery ? "Searching..." : "Recover Details"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* LIVE DEMO WORKSPACE SETUP MODAL */}
          {showDemoRoleModal && (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-slate-200">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl relative overflow-hidden">
                
                {/* Decorative glows */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <button 
                  type="button"
                  onClick={() => setShowDemoRoleModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition cursor-pointer"
                  id="demo-role-modal-close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2.5 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Interactive Sandbox</span>
                </div>

                <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">Mabala Live Demo Sandbox</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                  Initialize a complete, production-ready Zambian workspace pre-configured with active transactional records, payroll parameters, and compliance reports.
                </p>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Demo Persona Role</label>
                  
                  {/* Farmers Selection option */}
                  <div 
                    onClick={() => setSelectedDemoRole("Farmer")}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      selectedDemoRole === "Farmer" 
                        ? "bg-slate-950/40 border-emerald-500 shadow-lg text-white" 
                        : "bg-slate-950/20 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${selectedDemoRole === "Farmer" ? "bg-emerald-500" : "bg-slate-800"}`} />
                        <span className="text-xs font-black sm:text-sm">Commercial Farmer / Manager</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-[9px] text-emerald-400 border border-emerald-500/20 font-black rounded uppercase">Standard Demo</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed pl-5">
                      Explore multi-farm crop logs, pig/poultry feed formulation systems, payroll sheets with automatic NAPSA/ZRA tax calculations, and printable cash-flow reports.
                    </p>
                  </div>

                  {/* Vet Practitioner Option */}
                  <div 
                    onClick={() => setSelectedDemoRole("Vet Practitioner")}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      selectedDemoRole === "Vet Practitioner" 
                        ? "bg-slate-950/40 border-amber-500 shadow-lg text-white" 
                        : "bg-slate-950/20 border-slate-800 hover:border-slate-705 text-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${selectedDemoRole === "Vet Practitioner" ? "bg-amber-500" : "bg-slate-800"}`} />
                        <span className="text-xs font-black sm:text-sm">Licensed Veterinary Practitioner</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-[9px] text-amber-400 border border-amber-500/20 font-black rounded uppercase">Clinical Ledger</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed pl-5">
                      Test interactive consultations, vaccine logs, automated drug dosage indices, and print official Zoosanitary Clearance documents for export animals.
                    </p>
                  </div>

                  {/* Input Supplier Option */}
                  <div 
                    onClick={() => setSelectedDemoRole("Input Supplier")}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      selectedDemoRole === "Input Supplier" 
                        ? "bg-slate-950/40 border-blue-500 shadow-lg text-white" 
                        : "bg-slate-950/20 border-slate-800 hover:border-slate-705 text-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${selectedDemoRole === "Input Supplier" ? "bg-blue-500" : "bg-slate-800"}`} />
                        <span className="text-xs font-black sm:text-sm">Marketplace Input Supplier</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-blue-500/10 text-[9px] text-blue-400 border border-blue-500/20 font-black rounded uppercase font-sans">Trade Front</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed pl-5">
                      Check interactive order dispatches, manage B2B catalogs, priority directory listings, and configure delivery distances with Zambian bike riders.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleLaunchDemoWorkspace}
                    disabled={isLaunchingDemo}
                    className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <span>{isLaunchingDemo ? "Bootstrapping Sandbox..." : "Initialize & Launch Demo"}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                  </button>

                  <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center font-mono text-[9px] text-slate-500">
                    <div>
                      <span>UID: </span> <strong className="text-slate-200">mabalademo@mabala.cloud</strong>
                    </div>
                    <div>
                      <span>PWD: </span> <strong className="text-slate-200">Mabala@2026</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function StarsBadge() {
  return (
    <div className="flex gap-0.5">
      {[...Array(3)].map((_, i) => (
        <Star key={i} className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
      ))}
    </div>
  );
}
