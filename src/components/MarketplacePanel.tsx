import React, { useState, useEffect } from "react";
import { safeLocalStorage as localStorage } from "../utils/safeStorage";
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Bike, 
  DollarSign, 
  CheckCircle, 
  Store, 
  Plus, 
  Trash, 
  MapPin, 
  Sliders, 
  ShieldCheck, 
  Layers, 
  Settings, 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  Info,
  ChevronLeft,
  X,
  CreditCard,
  Building2,
  Phone,
  Mail,
  User,
  Zap,
  ArrowRight
} from "lucide-react";
import { Vendor, MarketplaceProduct, BikeRider, MarketplaceOrder } from "../data/marketplaceData";
import { Supplier, ExpenseTransaction, ExpenseRow, PredefinedRole } from "../types";
import { jsPDF } from "jspdf";

interface MarketplacePanelProps {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  products: MarketplaceProduct[];
  setProducts: React.Dispatch<React.SetStateAction<MarketplaceProduct[]>>;
  riders: BikeRider[];
  setRiders: React.Dispatch<React.SetStateAction<BikeRider[]>>;
  orders: MarketplaceOrder[];
  setOrders: React.Dispatch<React.SetStateAction<MarketplaceOrder[]>>;
  
  commissionPercent: number; // e.g. 10 for 10%
  setCommissionPercent: (val: number) => void;
  deliveryFeePerKm: number; // e.g. 5.0 ZMW per km
  setDeliveryFeePerKm: (val: number) => void;

  onAddTransaction: (tx: ExpenseTransaction) => void;
  isReadonly: boolean;
  currencySymbol: string;
  currentRole: PredefinedRole;
  userEmail: string;

  platformPackages?: any[];
  setPlatformPackages?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function MarketplacePanel({
  vendors,
  setVendors,
  products,
  setProducts,
  riders,
  setRiders,
  orders,
  setOrders,
  commissionPercent,
  setCommissionPercent,
  deliveryFeePerKm,
  setDeliveryFeePerKm,
  onAddTransaction,
  isReadonly,
  currencySymbol,
  currentRole,
  userEmail,
  platformPackages = [],
  setPlatformPackages = () => {}
}: MarketplacePanelProps) {
  // Determine allowed sub tabs based on role
  const isSuperAdminUser = currentRole === "Platform Administrator" || currentRole === "Super Admin" || userEmail === "deepvaleyfarm@gmail.com";
  const isFarmerUser = !isSuperAdminUser && (
    currentRole === "Farm Owner" || 
    currentRole === "Manager" || 
    currentRole === "Farm Worker" || 
    currentRole === "Farm Admin" || 
    currentRole === "Viewer"
  );
  const isVendorUser = !isSuperAdminUser && !isFarmerUser;

  // Navigation tabs
  // "buyer" | "vendor-portal" | "admin-config" | "analytics"
  const [activeSubTab, setActiveSubTab] = useState<"buyer" | "vendor-portal" | "admin-config" | "analytics">(
    isVendorUser ? "vendor-portal" : "buyer"
  );

  useEffect(() => {
    if (isFarmerUser) {
      setActiveSubTab("buyer");
    } else if (isVendorUser) {
      setActiveSubTab("vendor-portal");
    }
  }, [currentRole, userEmail]);

  // Simulated subscription and expiry notifications dispatched/logged
  const [expiryNotifications, setExpiryNotifications] = useState<any[]>([
    { id: 1, recipient: "owner@mabala.com", farm: "Mabala Farms Store", type: "7-Day Warning Notice", date: "2026-06-03", status: "Sent (Auto-dispatched)" },
    { id: 2, recipient: "coop-seeds@mabala.org", farm: "Chisamba Seeds Cooperatives", type: "Expired Suspended Alert", date: "2026-06-04", status: "Sent (Tenant Store Hidden)" },
    { id: 3, recipient: "lusaka-livestock@gmail.com", farm: "Lusaka Livestock Hub", type: "Renewed Receipt Notification", date: "2026-06-05", status: "Sent (Payment Confirmed)" }
  ]);

  // Filter conditions
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Shopping state
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(1);
  const [distanceKm, setDistanceKm] = useState<number>(10);
  const [selectedRiderId, setSelectedRiderId] = useState<string>("");
  
  // Buyer Details
  const [recipientName, setRecipientName] = useState("Suli Shika");
  const [recipientPhone, setRecipientPhone] = useState("+260 977 123456");
  const [deliveryAddress, setDeliveryAddress] = useState("Shika Farms block E, Chisamba, Zambia");

  // Lipila Gateway Modal states
  const [showLipilaModal, setShowLipilaModal] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<"MTN MoMo" | "Airtel Money" | "Zamtel Money">("MTN MoMo");
  const [paymentPhone, setPaymentPhone] = useState("+260 977 123456");
  const [paymentPin, setPaymentPin] = useState("");
  const [lipilaState, setLipilaState] = useState<"idle" | "handshake" | "pin_entry" | "processing" | "success" | "error">("idle");
  const [lipilaErrorMsg, setLipilaErrorMsg] = useState("");

  // Lipila Flow Type & Selection
  const [lipilaFlowType, setLipilaFlowType] = useState<"product" | "subscription">("product");
  const [renewSelectedPlan, setRenewSelectedPlan] = useState<any>(null);

  // Admin Configurer States
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanName, setEditingPlanName] = useState("");
  const [editingPlanPrice, setEditingPlanPrice] = useState<number>(0);
  const [editingPlanFeatures, setEditingPlanFeatures] = useState("");

  // Admin Backend Product Upload States
  const [adminUploadVendorId, setAdminUploadVendorId] = useState("");
  const [adminUploadName, setAdminUploadName] = useState("");
  const [adminUploadCategory, setAdminUploadCategory] = useState<MarketplaceProduct["category"]>("Seeds & Agronomy");
  const [adminUploadPrice, setAdminUploadPrice] = useState<number>(100);
  const [adminUploadStock, setAdminUploadStock] = useState<number>(50);
  const [adminUploadDescription, setAdminUploadDescription] = useState("");
  const [adminUploadExpiry, setAdminUploadExpiry] = useState("2026-06-15");
  const [adminUploadIcon, setAdminUploadIcon] = useState("📦");

  // Vendor self-onboarding states
  const [isSelfRegistered, setIsSelfRegistered] = useState<boolean>(
    vendors.some(v => v.email === userEmail)
  );
  const [registeredVendorId, setRegisteredVendorId] = useState<string>(
    vendors.find(v => v.email === userEmail)?.id || ""
  );
  const [onboardVendorName, setOnboardVendorName] = useState("");
  const [onboardCategory, setOnboardCategory] = useState<Vendor["category"]>("Seeds & Agronomy");
  const [onboardLocation, setOnboardLocation] = useState("Lusaka West - 15km");
  const [onboardDistance, setOnboardDistance] = useState<number>(15);
  const [onboardPhone, setOnboardPhone] = useState("");
  const [onboardPkg, setOnboardPkg] = useState<string>("Premium Seller");
  const [onboardLogoUrl, setOnboardLogoUrl] = useState<string>("");
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  
  // Own catalog editing states
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState<MarketplaceProduct["category"]>("Seeds & Agronomy");
  const [newProdPrice, setNewProdPrice] = useState<number>(100);
  const [newProdStock, setNewProdStock] = useState<number>(50);
  const [newProdDescription, setNewProdDescription] = useState("");
  const [newProdEmoji, setNewProdEmoji] = useState("🌾");
  
  const [newProdUnitOfMeasure, setNewProdUnitOfMeasure] = useState("kg"); // kg, litre, bag, bundle, each, tonne, crate, etc.
  const [newProdVatApplicable, setNewProdVatApplicable] = useState(false);
  const [newProdProductLocation, setNewProdProductLocation] = useState(""); // Default to vendor's location
  const [newProdProductImages, setNewProdProductImages] = useState<string[]>([]);
  const [newProdIsActive, setNewProdIsActive] = useState(true);
  const [newProdLowStockThreshold, setNewProdLowStockThreshold] = useState<number>(5);
  const [isDraggingProdImg, setIsDraggingProdImg] = useState(false);

  const [editingProduct, setEditingProduct] = useState<MarketplaceProduct | null>(null);
  const [simulatedEmails, setSimulatedEmails] = useState<any[]>([]);
  const [showEmailsInbox, setShowEmailsInbox] = useState(false);
  const [selectedSubscribedEmail, setSelectedSubscribedEmail] = useState<any | null>(null);

  // Admin logs & states
  const [adminCommissionInput, setAdminCommissionInput] = useState<number>(commissionPercent);
  const [adminDeliveryInput, setAdminDeliveryInput] = useState<number>(deliveryFeePerKm);

  // Active Vendor welcome email & password reset fields
  const [simulatedWelcomeEmail, setSimulatedWelcomeEmail] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");

  // Derive counts & values
  const activeVendorRecord = vendors.find(v => v.email === userEmail || v.id === registeredVendorId);

  // Sync category inheritance from vendor profile to add-product form field
  React.useEffect(() => {
    if (activeVendorRecord) {
      setNewProdCategory(activeVendorRecord.category);
    }
  }, [activeVendorRecord]);

  // Calculations for active checkout
  const checkoutSubtotal = selectedProduct ? selectedProduct.price * purchaseQuantity : 0;
  const checkoutDeliveryFee = distanceKm * deliveryFeePerKm;
  const checkoutCommission = (checkoutSubtotal * (commissionPercent / 100));
  const checkoutTotal = checkoutSubtotal + checkoutDeliveryFee;

  const categories = ["All", "Seeds & Agronomy", "Veterinary & Health", "Equipment & Tech", "Feeds & Formulations"];

  // Search filtered products
  const filteredProducts = products.filter(p => {
    const vendor = vendors.find(v => v.id === p.vendorId);
    if (vendor) {
      const today = new Date("2026-06-05");
      const isVendorExpired = vendor.status === "Expired" || (vendor.expiryDate && new Date(vendor.expiryDate) < today);
      
      if (isVendorExpired) {
        if (p.isAdminUploaded) {
          const isProductExpired = p.expiryDate && new Date(p.expiryDate) < today;
          if (isProductExpired) return false;
        } else {
          return false;
        }
      }
    }

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const isPubliclyAvailable = p.isActive !== false && p.stock > 0;
    return matchesSearch && matchesCat && isPubliclyAvailable;
  });

  // Handle self enrollment as vendor
  const handleOnboardVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardVendorName.trim() || !onboardPhone.trim()) {
      alert("Please provide store name and dispatch contact phone.");
      return;
    }

    const newVendorId = `vend-custom-${Date.now()}`;
    const colors = ["bg-emerald-600", "bg-indigo-600", "bg-sky-600", "bg-amber-600", "bg-purple-600"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const matchedPlan = platformPackages.find(p => p.name === onboardPkg);
    const creditsValue = matchedPlan?.credits || (onboardPkg === "Premium Seller" ? 300 : 100);

    const newVendor: Vendor & { tempPassword?: string; forcesPasswordReset?: boolean; customResetCompleted?: boolean } = {
      id: newVendorId,
      name: onboardVendorName,
      category: onboardCategory,
      location: onboardLocation,
      distanceKm: Number(onboardDistance || 10),
      phone: onboardPhone,
      email: userEmail,
      subscriptionPackage: onboardPkg,
      status: "Active",
      joinedDate: new Date("2026-06-05").toISOString().split("T")[0],
      expiryDate: "2026-07-05", // 30 days starting from today June 5
      credits: creditsValue,
      logoColor: randomColor,
      logoUrl: onboardLogoUrl || undefined,
      forcesPasswordReset: false,
      customResetCompleted: true
    };

    setVendors(prev => [...prev, newVendor]);
    setIsSelfRegistered(true);
    setRegisteredVendorId(newVendorId);
    setActiveSubTab("vendor-portal");
    alert(`🚀 Congratulations! "${newVendor.name}" has been successfully onboarded and activated. You have been directed straight to your Live Merchant Storefront Portal!`);
  };

  // Handle product images uploading with dimensions validation
  const handleProductImageUpload = (files: FileList | null) => {
    if (!files) return;
    const fileList = Array.from(files);
    
    // Check total count constraint
    if (newProdProductImages.length + fileList.length > 6) {
      alert("⚠️ Catalogue Policy Warning: You can upload a maximum of 6 product images.");
      return;
    }

    fileList.forEach(file => {
      if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
        alert(`❌ Invalid Format: "${file.name}" is not a supported file. Mabala only accepts JPG, PNG, or WebP.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        
        // Dimensions check using transient image element
        const tempImg = new Image();
        tempImg.src = resultUrl;
        tempImg.onload = () => {
          if (tempImg.width < 600 || tempImg.height < 600) {
            alert(`⚠️ Dimension Verification Failed for "${file.name}": Image is ${tempImg.width}x${tempImg.height}px. Mabala directories enforce a strict MINIMUM of 600x600px to maintain crisp catalog styling.`);
          } else {
            setNewProdProductImages(prev => [...prev, resultUrl]);
          }
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLoadDemoProductImages = () => {
    const demoPics = [
      "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80", // Barley / Wheat seeds
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80", // Agro spray
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80"  // Fertilizers
    ];
    setNewProdProductImages(demoPics);
    alert("💡 Premium Presets: Added 3 pre-validated high-resolution agricultural catalogue photos (800x800px)!");
  };

  // Handle adding product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      alert("Name is required.");
      return;
    }
    if (!activeVendorRecord) {
      alert("No active vendor profile matches your account.");
      return;
    }
    if (newProdProductImages.length < 2) {
      alert("⚠️ Catalogue Policy Violation: At least 2 high-resolution product images are required to publish this product. Please select or drag at least 2 images.");
      return;
    }
    if (newProdProductImages.length > 6) {
      alert("⚠️ Catalogue Policy Violation: Maximum 6 images are allowed.");
      return;
    }

    const newProduct: MarketplaceProduct = {
      id: `prod-custom-${Date.now()}`,
      vendorId: activeVendorRecord.id,
      vendorName: activeVendorRecord.name,
      name: newProdName,
      category: newProdCategory,
      price: Number(newProdPrice || 10),
      stock: Number(newProdStock || 1),
      description: newProdDescription || `${newProdName} catalog release.`,
      iconEmoji: newProdEmoji,
      unitOfMeasure: newProdUnitOfMeasure,
      vatApplicable: newProdVatApplicable,
      productLocation: newProdProductLocation.trim() || activeVendorRecord.location,
      productImages: newProdProductImages,
      isActive: newProdIsActive,
      lowStockThreshold: Number(newProdLowStockThreshold || 5)
    };

    setProducts(prev => {
      const updated = [newProduct, ...prev];
      localStorage.setItem("mabala_marketplace_products", JSON.stringify(updated));
      return updated;
    });

    // reset form fields
    setNewProdName("");
    setNewProdPrice(100);
    setNewProdStock(50);
    setNewProdDescription("");
    setNewProdEmoji("🌾");
    setNewProdUnitOfMeasure("kg");
    setNewProdVatApplicable(false);
    setNewProdProductLocation("");
    setNewProdProductImages([]);
    setNewProdIsActive(true);
    setNewProdLowStockThreshold(5);

    alert(`"${newProduct.name}" added to your live catalog store!`);
  };

  const handleDeleteProduct = (prodId: string) => {
    if (window.confirm("Are you sure you want to pull down this product item from the live directory shelf?")) {
      setProducts(prev => prev.filter(p => p.id !== prodId));
    }
  };

  // Open checkout modal
  const handleOpenCheckout = (product: MarketplaceProduct) => {
    setSelectedProduct(product);
    setPurchaseQuantity(1);
    // Grab corresponding vendor's default distance score if applicable
    const vend = vendors.find(v => v.id === product.vendorId);
    if (vend) {
      setDistanceKm(vend.distanceKm);
    }
    // Pre-select first available rider
    if (riders.length > 0) {
      setSelectedRiderId(riders[0].id);
    }
    setSelectedProduct(product);
  };

  const triggerLipilaPayHandshake = () => {
    if (isReadonly) {
      alert("Operation rejected. The system workspace is configured in readonly demonstration sandbox mode.");
      return;
    }
    if (!recipientName.trim() || !recipientPhone.trim() || !deliveryAddress.trim() || !selectedRiderId) {
      alert("Please ensure recipient details and a last-mile registered bike rider are validated.");
      return;
    }
    setLipilaErrorMsg("");
    setLipilaState("handshake");
    setShowLipilaModal(true);

    // Simulated network handshake delay
    setTimeout(() => {
      setLipilaState("pin_entry");
    }, 1500);
  };

  const handleLipilaAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentPin.length < 4) {
      setLipilaErrorMsg("Authoritative security pin must span exactly 4 numerical indexes.");
      return;
    }

    setLipilaState("processing");

    // Perform validation check to simulate real dynamic error code scenario on specific values
    setTimeout(() => {
      if (paymentPin === "0000") {
        setLipilaState("error");
        setLipilaErrorMsg("LIPILA TRANSACTION ARRESTED: Dynamic PIN verification failure (Incorrect mobile money numeric credentials entered. Try '1234' sandbox pin).");
        return;
      }

      // Complete checkout successfully
      setLipilaState("success");

      // Compile final records writes
      if (lipilaFlowType === "subscription") {
        finalizeSubscriptionRenewal();
      } else {
        finalizeMarketplaceTransaction();
      }

    }, 2800);
  };

  const finalizeSubscriptionRenewal = () => {
    if (!renewSelectedPlan || !activeVendorRecord) return;

    const today = new Date("2026-06-05");
    let baseDate = new Date(today);
    if (activeVendorRecord.expiryDate && new Date(activeVendorRecord.expiryDate) > today) {
      baseDate = new Date(activeVendorRecord.expiryDate);
    }
    baseDate.setDate(baseDate.getDate() + 30);
    const newExpiryStr = baseDate.toISOString().split("T")[0];
    const creditsToTopUp = renewSelectedPlan.credits || 300;

    // Update vendors list
    setVendors(prev => prev.map(v => {
      if (v.id === activeVendorRecord.id) {
        return {
          ...v,
          subscriptionPackage: renewSelectedPlan.name,
          status: "Active",
          expiryDate: newExpiryStr,
          credits: (v.credits || 0) + creditsToTopUp
        };
      }
      return v;
    }));

    // Generate simulated vendor subscription fee ledger entry
    const ledgerRow: ExpenseRow = {
      category: "Marketplace Subscription Renewal",
      description: `Upgrade/Renew store "${activeVendorRecord.name}" to Mabala [${renewSelectedPlan.name}]`,
      quantity: 1,
      unitPrice: renewSelectedPlan.price,
      amount: renewSelectedPlan.price,
      coaCode: "5100" // Marketing & Business Subscriptions
    };

    const expenseTx: ExpenseTransaction = {
      id: `EXP-SUB-${Date.now()}`,
      supplierId: "mabala-systems",
      supplierName: "Mabala SaaS Core Engine",
      date: "2026-06-05",
      taxSystem: "None",
      taxAmount: 0,
      subtotal: renewSelectedPlan.price,
      total: renewSelectedPlan.price,
      rows: [ledgerRow],
      farmId: "farm-1"
    };

    onAddTransaction(expenseTx);
  };

  const finalizeMarketplaceTransaction = () => {
    if (!selectedProduct) return;

    const chosenRider = riders.find(r => r.id === selectedRiderId) || riders[0];
    
    // 1. Create Order entry
    const newOrder: MarketplaceOrder = {
      id: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      vendorId: selectedProduct.vendorId,
      vendorName: selectedProduct.vendorName,
      buyerEmail: userEmail,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: purchaseQuantity,
      priceAtPurchase: selectedProduct.price,
      subtotal: checkoutSubtotal,
      deliveryFee: checkoutDeliveryFee,
      commissionAmount: checkoutCommission,
      totalAmount: checkoutTotal,
      recipientName: recipientName,
      recipientPhone: recipientPhone,
      deliveryAddress: deliveryAddress,
      riderId: chosenRider.id,
      riderName: chosenRider.name,
      distanceKm: distanceKm,
      date: new Date().toISOString().split("T")[0],
      status: "Processing",
      paymentProvider: paymentProvider,
      paymentPhone: paymentPhone
    };

    setOrders(prev => [newOrder, ...prev]);

    // 2. Decrement corresponding product stock & calculate notifications
    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === selectedProduct.id) {
          const nextStock = Math.max(0, p.stock - purchaseQuantity);
          return {
            ...p,
            stock: nextStock
          };
        }
        return p;
      });
      localStorage.setItem("mabala_marketplace_products", JSON.stringify(updated));
      return updated;
    });

    // Generate simulated transactional and alerts notifications
    const targetVendor = vendors.find(v => v.id === selectedProduct.vendorId);
    const vendorEmail = targetVendor?.email || "vendor@mabala.com";
    const netPayable = newOrder.subtotal - newOrder.commissionAmount;

    // A. Purchase Notification email template
    const orderEmailHtml = `
      <div style="font-family: sans-serif; padding: 25px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1.5px;">Mabala Sourcing Order Notification</h2>
          <p style="margin: 5px 0 0 0; font-size: 11px; letter-spacing: 1px; font-weight: bold; opacity: 0.9;">INSTANT CLEARING DIRECTIVE</p>
        </div>
        <p style="font-size: 13px; font-weight: bold; margin-top: 20px; color: #0f172a;">Salutations, ${targetVendor?.name || "Merchant Owner"}</p>
        <p style="font-size: 12px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
          Your directory storefront node has registered a validated checkout settlement, cleared via MTN MoMo and vetted routing endpoints. Please pack goods for instant biker pick up.
        </p>
        <h4 style="text-transform: uppercase; font-size: 10px; color: #64748b; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px;">Dispatch Metrics Header</h4>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Order Serial:</td>
            <td style="padding: 6px 0; font-weight: bold; font-family: monospace; text-align: right; color: #0f172a;">${newOrder.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Buyer Identity:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${newOrder.recipientName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Buyer Hub Area:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #047857;">${newOrder.deliveryAddress}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Quantity/Attributes:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${newOrder.quantity}x ${newOrder.productName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Logistics Operator:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #4f46e5;">Rider ${newOrder.riderName} (Est: ${newOrder.distanceKm} KM)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Transaction Time:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1px dashed #cbd5e1; font-size: 12px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Gross Sale Amount:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; font-family: monospace;">${newOrder.subtotal.toFixed(2)} ZMW</td>
            </tr>
            <tr style="color: #e11d48;">
              <td style="padding: 4px 0;">Mabala Commission Percentage Deducted (${commissionPercent}%):</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; font-family: monospace;">- ${newOrder.commissionAmount.toFixed(2)} ZMW</td>
            </tr>
            <tr style="font-weight: bold; color: #0d9488; font-size: 13.5px;">
              <td style="padding: 8px 0 0 0; border-top: 1px solid #cbd5e1;">NET PAYABLE TO VENDOR:</td>
              <td style="padding: 8px 0 0 0; text-align: right; border-top: 1px solid #cbd5e1; font-family: monospace;">${netPayable.toFixed(2)} ZMW</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 20px; line-height: 1.4;">
          This message serves as a formal payment clearance report generated dynamically on Mabala network servers. Secured by Lipila core.
        </p>
      </div>
    `;

    const newTxEmail = {
      id: `mail-${Date.now()}-tx`,
      recipient: vendorEmail,
      subject: `📧 Mabala Order Dispatch Notification - Ref [${newOrder.id}]`,
      body: orderEmailHtml,
      date: new Date().toLocaleTimeString(),
      type: "order"
    };

    setSimulatedEmails(prev => [newTxEmail, ...prev]);

    // B. Check Low stock alert notification criteria
    const threshold = selectedProduct.lowStockThreshold !== undefined ? selectedProduct.lowStockThreshold : 5;
    const previousStock = selectedProduct.stock;
    const nextStock = Math.max(0, previousStock - purchaseQuantity);

    if (nextStock <= threshold) {
      const lowStockEmailHtml = `
        <div style="font-family: sans-serif; padding: 25px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #fecdd3; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #e11d48; color: white; padding: 20px; border-radius: 12px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">⚠️ Mabala Low Stock Warning Alert</h2>
            <p style="margin: 5px 0 0 0; font-size: 11px; letter-spacing: 1px; font-weight: bold; opacity: 0.9;">CATALOG EXPIRY MITIGATION</p>
          </div>
          <p style="font-size: 13px; font-weight: bold; margin-top: 20px; color: #0f172a;">Attention Store Owner, ${targetVendor?.name || "Merchant Owner"}</p>
          <p style="font-size: 12.5px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
            This security service warning logs that available stock for <strong style="color: #e11d48;">"${selectedProduct.name}"</strong> has slipped past your adjusted threshold of <strong>${threshold} ${selectedProduct.unitOfMeasure || "units"}</strong>.
          </p>
          
          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 18px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <span style="font-size: 10px; text-transform: uppercase; display: block; color: #94a3b8; font-weight: bold; letter-spacing: 1px;">Current Balanced Ledger</span>
            <strong style="font-size: 38px; color: #e11d48; display: block; font-family: monospace; font-weight: bold; margin: 5px 0;">
              ${nextStock} ${selectedProduct.unitOfMeasure || "units"}
            </strong>
            <span style="font-size: 11px; color: #b91c1c; font-weight: bold;">⚠️ ACTION REQUIRED TO PRESERVE VISIBILITY</span>
          </div>

          <p style="font-size: 12px; line-height: 1.6; color: #475569; margin-bottom: 15px;">
            To ensure single-tenant catalogue sheets remain active on customer dashboards, please log in to your Mabala seller portal immediately, access your product list, and update stock numbers above zero.
          </p>
          <p style="font-size: 11px; font-style: italic; color: #64748b;">
            💡 Restocking above the low-limit notification clears this exception flag. When stock lands at 0, your item is auto-hidden from index directory views programmatically.
          </p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.4;">
            Do not reply directly to this automated server report system. Form parameters conform to national co-ops requirements.
          </p>
        </div>
      `;

      const lowStockEmail = {
        id: `mail-${Date.now()}-stock`,
        recipient: vendorEmail,
        subject: `⚠️ Low Stock Warning: "${selectedProduct.name}" dropped below limit!`,
        body: lowStockEmailHtml,
        date: new Date().toLocaleTimeString(),
        type: "low_stock"
      };

      setSimulatedEmails(prev => [lowStockEmail, ...prev]);
    }

    // 3. Inject standard transaction row in active Mabala general ledger module
    const ledgerRow: ExpenseRow = {
      category: "Marketplace Purchase",
      description: `Bought ${purchaseQuantity}x ${selectedProduct.name} delivered by cargo rider (${chosenRider.name})`,
      quantity: purchaseQuantity,
      unitPrice: selectedProduct.price,
      amount: checkoutSubtotal,
      coaCode: "5200" // feed & formulations / standard seeds crop input
    };

    const expenseTx: ExpenseTransaction = {
      id: `EXP-MKT-${Date.now()}`,
      supplierId: selectedProduct.vendorId,
      supplierName: selectedProduct.vendorName,
      date: new Date().toISOString().split("T")[0],
      taxSystem: "None",
      taxAmount: 0,
      subtotal: checkoutSubtotal,
      total: checkoutTotal, // including courier transport rate
      rows: [ledgerRow],
      farmId: "farm-1"
    };

    onAddTransaction(expenseTx);
  };

  // Generate beautiful subscription receipt PDF
  const downloadSubscriptionReceiptPdf = (vendorName: string, planName: string, price: number) => {
    try {
      const doc = new jsPDF();
      
      // Header branding
      doc.setFillColor(16, 185, 129); // Emerald-500
      doc.rect(0, 0, 210, 35, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.text("MABALAagro", 15, 24);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text("LIPILA DIGITAL TRANSACTION CLEARANCE ARTIFACT", 110, 23);
      
      // Content layout
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFontSize(14);
      doc.setFont("Helvetica", "bold");
      doc.text("Mabala Merchant Subscription Bill", 15, 50);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      const invoiceId = `MBS-${Date.now().toString().slice(-6)}`;
      const dateStr = new Date().toISOString().split("T")[0];
      doc.text(`Receipt Serial: ${invoiceId}`, 15, 57);
      doc.text(`Billing Period: Monthly Recurring`, 15, 63);
      doc.text(`Clearing Time: ${dateStr}`, 15, 69);
      doc.text(`Settlement Engine: LIPILA CORE API`, 15, 75);
      
      // Billing Info
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.rect(15, 83, 180, 45, "F");
      doc.setFont("Helvetica", "bold");
      doc.text("SUBSCRIBER LOGS", 20, 91);
      doc.setFont("Helvetica", "normal");
      doc.text(`Merchant Name: ${vendorName || "Mabala Self-Merchant"}`, 20, 99);
      doc.text(`Enrolled Package Tier: ${planName}`, 20, 107);
      doc.text(`Cleared Payment: ${price} ZMW (Mobile Money Settlement)`, 20, 115);
      doc.text(`Account Status: ACTIVE / ENROLLED`, 20, 121);
      
      // Terms / Agreement
      doc.setFont("Helvetica", "bold");
      doc.text("MABALA MERCHANT SERVICE REGULATION MANDATE", 15, 142);
      doc.setFont("Helvetica", "normal");
      const terms = [
        "1. Merchant directory access remains active for 30 days starting from the date of the Lipila transaction.",
        "2. The merchant agrees to comply with the standard Zambian National Co-ops Trade Regulations.",
        "3. Products must contain accurate descriptions, real available inventory, and specify physical area holdings.",
        "4. Standard Mabala ecosystem commission deductions check against every aggregate delivery dispatch.",
        "5. Transactions processed via the Lipila clearance pipes incur standard single-tenant processing fees."
      ];
      let offset = 150;
      terms.forEach(line => {
        doc.text(line, 15, offset);
        offset += 8;
      });
      
      // Footer
      doc.setFillColor(15, 23, 42); // Dark slate
      doc.rect(0, 270, 210, 27, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("Secured with Lipila Instant Settlement Protocol © Mabala Multi-Tenant Agro-ERP.", 45, 280);
      
      doc.save(`receipt-${invoiceId}.pdf`);
    } catch(err) {
      console.error("PDF Generate Error", err);
      alert("Failed to download PDF receipt.");
    }
  };

  // Generate beautiful receipt PDF
  const downloadReceiptPdf = (order: MarketplaceOrder) => {
    try {
      const doc = new jsPDF();
      
      // Header branding
      doc.setFillColor(16, 185, 129); // Emerald-500
      doc.rect(0, 0, 210, 35, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.text("MABALAagro", 15, 24);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text("LIPILA DIGITAL TRANSACTION CLEARANCE ARTIFACT", 120, 23);
      
      // Content layout
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFontSize(14);
      doc.setFont("Helvetica", "bold");
      doc.text("Mabala Ecosystem Purchase Bill", 15, 50);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Receipt Serial: ${order.id}`, 15, 57);
      doc.text(`Clearing Time: ${order.date}`, 15, 63);
      doc.text(`MoMo Handshake Phone: ${order.paymentPhone}`, 15, 69);
      doc.text(`Gateway Operator: ${order.paymentProvider}`, 15, 75);
      
      // Vendor Info
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.rect(15, 83, 180, 24, "F");
      doc.setFont("Helvetica", "bold");
      doc.text("VENDOR DETAILS", 20, 91);
      doc.setFont("Helvetica", "normal");
      doc.text(`Name: ${order.vendorName}`, 20, 97);
      doc.text(`Dispatch Loc: Realized within system registers`, 20, 103);
      
      // Delivery info
      doc.rect(15, 112, 180, 30, "F");
      doc.setFont("Helvetica", "bold");
      doc.text("LAST-MILE BIKE COURIER ARTIFACTS", 20, 120);
      doc.setFont("Helvetica", "normal");
      doc.text(`Rider Name: ${order.riderName}`, 20, 126);
      doc.text(`Target Destination: ${order.deliveryAddress}`, 20, 132);
      doc.text(`Assessed Distance: ${order.distanceKm} Kilometers`, 20, 138);

      // Line items table
      doc.setFillColor(30, 41, 59);
      doc.rect(15, 150, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.text("Product Catalog Item Description", 20, 155);
      doc.text("Qty", 120, 155);
      doc.text("Unit Price", 145, 155);
      doc.text("Amount ZMW", 170, 155);

      doc.setTextColor(30, 41, 59);
      doc.setFont("Helvetica", "normal");
      doc.text(order.productName, 20, 166);
      doc.text(order.quantity.toString(), 122, 166);
      doc.text(`${order.priceAtPurchase}.00`, 147, 166);
      doc.text(`${order.subtotal}.00`, 172, 166);
      
      // Totals
      doc.setDrawColor(203, 213, 225);
      doc.line(15, 175, 195, 175);
      
      doc.setFont("Helvetica", "bold");
      doc.text("Product Subtotal:", 120, 184);
      doc.setFont("Helvetica", "normal");
      doc.text(`${order.subtotal}.00 ZMW`, 170, 184);
      
      doc.setFont("Helvetica", "bold");
      doc.text("Bike Rider Courier:", 120, 191);
      doc.setFont("Helvetica", "normal");
      doc.text(`${order.deliveryFee}.00 ZMW`, 170, 191);

      doc.setFont("Helvetica", "bold");
      doc.text("Mabala Commission Earned:", 120, 198);
      doc.setFont("Helvetica", "normal");
      doc.text(`(${commissionPercent}%) Included`, 170, 198);
      
      doc.setFillColor(236, 253, 245);
      doc.rect(120, 204, 75, 10, "F");
      doc.setTextColor(16, 185, 129);
      doc.setFont("Helvetica", "bold");
      doc.text("Total Settled (ZMW):", 124, 210);
      doc.text(`${order.totalAmount}.00`, 168, 210);
      
      // Footer audit stamp
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text("Secured with Lipila Instant Settlement Protocol © Mabala Multi-Tenant Agro-ERP.", 45, 245);
      doc.text("This clearance is mathematically integrated to your general ledger accounts spreadsheet.", 43, 250);

      doc.save(`mabala-marketplace-receipt-${order.id}.pdf`);
    } catch (e: any) {
      alert(`Error print generation: ${e.message}`);
    }
  };

  const SlateToHex = (code: number) => {
    return "#1e293b";
  };

  const handleApplyAdminRates = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadonly) {
      alert("Platform in readonly configuration state.");
      return;
    }
    setCommissionPercent(adminCommissionInput);
    setDeliveryFeePerKm(adminDeliveryInput);
    alert(`Global rate parameters adjusted! Commission set to ${adminCommissionInput}% and Courier Delivery fee is capped at ${adminDeliveryInput} ZMW/km.`);
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-y-auto pb-12 pr-1 font-sans">
      
      {/* Top Banner and Navigation Tabs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
            Mabala B2B Trade & Logistics
          </span>
          <h1 className="text-xl font-bold text-slate-800 mt-1 mb-1 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            <span>Mabala Vendor Marketplace</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Procure hybrid crop inputs, livestock feed, and clinical vaccines with instant Lipila Mobile Money & last-mile bike delivery.
          </p>
        </div>
        
        {/* Switch Sub Tabs */}
        {!isFarmerUser && !isVendorUser && (
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border self-stretch md:self-auto shrink-0 flex-wrap gap-1">
            <button
              onClick={() => setActiveSubTab("buyer")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "buyer" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🌽 Browse Catalogue
            </button>
            
            <button
              onClick={() => setActiveSubTab("vendor-portal")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "vendor-portal" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🏪 Vendor Registry Portal
            </button>

            <button
              onClick={() => setActiveSubTab("analytics")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "analytics" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📈 Market Analytics
            </button>

            {isSuperAdminUser && (
              <button
                onClick={() => setActiveSubTab("admin-config")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === "admin-config" ? "bg-white text-slate-800 shadow animate-pulse" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🛠️ Market Super-Admin
              </button>
            )}
          </div>
        )}
      </div>

      {/* RENDER BUYER DIRECTORY TABS */}
      {activeSubTab === "buyer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar Column For Directory Filter */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Directories Filters</span>
                </h3>

                {/* Search Text */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search input seeds, meds..."
                    className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Sub Categories Checklist */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Filter by Category</label>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left py-1.5 px-3 rounded-lg text-xs font-bold block transition-all ${
                        selectedCategory === cat 
                          ? "bg-slate-900 text-white" 
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Cargo Logistics Constants Info */}
                <div className="pt-4 border-t border-slate-100 text-[10px] space-y-2 text-slate-500 leading-normal">
                  <div className="flex justify-between font-semibold">
                    <span>Admin Commission:</span>
                    <span className="text-slate-800 font-mono">{commissionPercent}%</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Base Carrier Delivery:</span>
                    <span className="text-slate-800 font-mono">{deliveryFeePerKm} ZMW/km</span>
                  </div>
                  <p className="text-[9.5px] text-slate-400">
                    *Courier transportation fee is automatically calculated depending on distance from vendor base to Shika central station.
                  </p>
                </div>
              </div>

              {/* Verified Bike Riders Roster */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span>Active Bike Couriers</span>
                </h4>
                <div className="divide-y space-y-2.5 pt-1.5">
                  {riders.map(r => (
                    <div key={r.id} className="pt-2 flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${r.status === "Available" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                        <div>
                          <span className="font-bold text-slate-700 block text-xs">{r.name.split(" ")[0]} {r.name.split(" ")[1] || ""}</span>
                          <span className="text-[10px] text-slate-400 font-mono leading-none">{r.vehicle}</span>
                        </div>
                      </div>
                      <span className="text-amber-500 font-bold font-mono">★ {r.rating}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Catalog list block */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Product detailed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map(product => {
                  const outOfStock = product.stock === 0;
                  return (
                    <div 
                      key={product.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs relative overflow-hidden"
                    >
                      {/* Product Category Banner */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="text-[10px] bg-slate-100 uppercase tracking-widest font-black text-slate-500 px-2 py-0.5 rounded font-mono">
                          {product.category}
                        </span>
                        <span className="text-sm font-bold text-slate-800 font-mono">
                          {product.price} ZMW
                        </span>
                      </div>

                      {/* Info body */}
                      <div className="space-y-2 flex-1">
                        <div className="flex gap-2.5 items-center">
                          <span className="text-3xl p-1 bg-slate-50 rounded-lg">{product.iconEmoji}</span>
                          <div>
                            <h3 className="font-bold text-slate-800 text-xs lines-clamp-1">{product.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {(() => {
                                const mVen = vendors.find(v => v.id === product.vendorId);
                                if (mVen?.logoUrl) {
                                  return (
                                    <img
                                      src={mVen.logoUrl}
                                      alt=""
                                      className="w-3.5 h-3.5 rounded-full object-cover border border-slate-200 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  );
                                }
                                return <span className="text-[10px]">🏪</span>;
                              })()}
                              <span className="text-[10px] font-bold text-emerald-600 block leading-tight">Vendor: {product.vendorName}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-[11px] text-slate-400 leading-normal font-semibold min-h-[36px]">
                          {product.description}
                        </p>
                      </div>

                      {/* Stock Level Tracker */}
                      <div className="mt-4 pt-3 border-t border-slate-150 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${outOfStock ? "bg-rose-500" : product.stock < 15 ? "bg-amber-400 text-slate-900" : "bg-emerald-500"}`} />
                          <span className="text-[10px] text-slate-500">{product.stock} bags on hand</span>
                        </div>

                        <button
                          onClick={() => handleOpenCheckout(product)}
                          disabled={outOfStock}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-[10px] rounded-lg tracking-wider transition-all uppercase cursor-pointer"
                        >
                          {outOfStock ? "Sold Out" : "Buy Inputs"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full bg-slate-50 p-12 text-center rounded-3xl border border-dashed space-y-3">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">No Catalog Items Found</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">Try matching another terminology segment, filtering different trade sectors from directories lists, or self-onboarding products catalogue inside Vendor registers.</p>
                  </div>
                )}
              </div>

              {/* Dynamic Bottom - Order Placed Confirmation Log Table */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>Lipila Platform Cleared Orders Logs</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Direct receipts and printable invoices corresponding to your B2B agricultural procurements.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-white text-slate-800">
                    <thead className="bg-slate-50 uppercase text-[9.5px] font-bold text-slate-400 tracking-wider border-b">
                      <tr>
                        <th className="p-3">Receipt Serial / Date</th>
                        <th className="p-3">Source Vendor</th>
                        <th className="p-3">Product Description</th>
                        <th className="p-3">Delivery Logistic</th>
                        <th className="p-3">Transaction total</th>
                        <th className="p-3 text-right">Clearance Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold text-slate-700">
                      {orders.filter(ord => ord.buyerEmail === userEmail).map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <span className="font-mono text-[10px] text-slate-600 block">{order.id}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{order.date}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-emerald-700 font-bold block">{order.vendorName}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-mono">B2B Verified Node</span>
                          </td>
                          <td className="p-3">
                            <span className="block font-sans text-[11px] truncate max-w-xs">{order.quantity}x {order.productName}</span>
                            <span className="text-[9px] text-slate-400 block font-mono">Cost Base: {order.priceAtPurchase} ZMW</span>
                          </td>
                          <td className="p-3">
                            <span className="block font-sans text-[11px] truncate max-w-xs">{order.riderName.split(" ")[0]}</span>
                            <span className="text-[9px] text-slate-400 font-mono block">Dist: {order.distanceKm} km ({order.deliveryFee} ZMW)</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {order.totalAmount} ZMW
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => downloadReceiptPdf(order)}
                              className="px-3 py-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] tracking-wide uppercase rounded cursor-pointer"
                            >
                              Download Invoice PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                      {orders.filter(ord => ord.buyerEmail === userEmail).length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-[10.5px] text-slate-400">
                            No transactions processed under your farm account. Trigger checkout of a catalog input to inspect real confirmation artifacts.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER ACTIVE CHECKOUT DRAWER / FORM AREA */}
      {activeSubTab === "buyer" && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 flex justify-end z-40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full flex flex-col justify-between shadow-2xl animate-slide-left overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 block">B2B Checkout Ledger</span>
                <h3 className="text-sm font-bold">Agricultural Purchase Clearance</h3>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product recap info & variables */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              
              <div className="bg-slate-50 p-4 rounded-xl border flex items-center gap-3">
                <span className="text-4xl">{selectedProduct.iconEmoji}</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{selectedProduct.name}</h4>
                  <span className="text-[10px] text-slate-400 block pb-1 leading-normal">{selectedProduct.description}</span>
                  <div className="flex gap-2 text-[10px] font-bold">
                    <span className="text-indigo-600">Price: {selectedProduct.price} ZMW</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-emerald-600">Stock: {selectedProduct.stock} bags Left</span>
                  </div>
                </div>
              </div>

              {/* Purchase variables */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block pb-1">Define Purchase Quantity</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPurchaseQuantity(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border rounded font-black text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold px-4">{purchaseQuantity} Bag(s)</span>
                    <button 
                      onClick={() => setPurchaseQuantity(prev => Math.min(selectedProduct.stock, prev + 1))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border rounded font-black text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Distance variables slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                    <label className="text-[10px] uppercase text-slate-500">Logistics Distance Indicator (KM)</label>
                    <span className="font-mono text-emerald-600">{distanceKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={120}
                    value={distanceKm}
                    onChange={e => setDistanceKm(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase font-mono">
                    <span>Close Depot (2km)</span>
                    <span>Ndola Hinterlands (120km)</span>
                  </div>
                </div>

                {/* Bike Rider selection list */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Select Available Rider</label>
                  <div className="grid grid-cols-1 gap-2">
                    {riders.map(r => {
                      const isSelected = selectedRiderId === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRiderId(r.id)}
                          className={`p-3 text-left border rounded-xl flex justify-between items-center transition-all ${
                            isSelected 
                              ? "bg-slate-900 text-white border-slate-900" 
                              : "bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs block">{r.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{r.vehicle}</span>
                          </div>
                          <span className="text-xs font-bold text-amber-400">★ {r.rating}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Buyer receipt details */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h4 className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">Destination / Delivery Info</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block font-bold uppercase">Recipient name</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={e => setRecipientName(e.target.value)}
                        className="w-full p-2 border bg-slate-50 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block font-bold uppercase">Contact Phone</label>
                      <input
                        type="text"
                        value={recipientPhone}
                        onChange={e => setRecipientPhone(e.target.value)}
                        className="w-full p-2 border bg-slate-50 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block font-bold uppercase">Target Delivery Address</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      className="w-full p-2 border bg-slate-50 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Pricing Recap & Button */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="space-y-1 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Product Subtotal:</span>
                  <span className="font-mono text-slate-900">{checkoutSubtotal} ZMW</span>
                </div>
                <div className="flex justify-between">
                  <span>Rider Delivery Transport:</span>
                  <span className="font-mono text-slate-900">{checkoutDeliveryFee} ZMW ({distanceKm} km x {deliveryFeePerKm} ZMW)</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-1.5 text-slate-900 text-sm font-extrabold">
                  <span>Overall Bill Value:</span>
                  <span className="font-mono text-emerald-600">{checkoutTotal} ZMW</span>
                </div>
              </div>

              <button
                onClick={triggerLipilaPayHandshake}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Process Purchase via Lipila Pay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER LIPILA GATEWAY MODAL SANDBOX */}
      {showLipilaModal && (
        <div className="fixed inset-0 bg-slate-950/80 index-50 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-2xl relative overflow-hidden">
            
            {/* Top Indicator */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest text-[#10b981] font-bold">LIPILA PAY SECURE GATEWAY</span>
              </div>
              <button 
                onClick={() => {
                  setShowLipilaModal(false);
                  setLipilaState("idle");
                }}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Handshake animations */}
            {lipilaState === "handshake" && (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin mx-auto pb-1" />
                <h4 className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">Negotiating Sandbox Handshake...</h4>
                <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">Connecting with Lusaka Lipila Core Clearing Engine. Securing single-tenant cryptographic pipes.</p>
              </div>
            )}

            {/* PIN Entry Area styling authentic mobile screen */}
            {lipilaState === "pin_entry" && (
              <form onSubmit={handleLipilaAuthorize} className="space-y-4">
                <div className="text-center p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                    {lipilaFlowType === "subscription" ? "Merchant Plan Upgrade" : "B2B Aggregate Request"}
                  </span>
                  <h3 className="text-lg font-black text-white font-mono">
                    {lipilaFlowType === "subscription" ? `${renewSelectedPlan?.price}` : `${checkoutTotal}`} ZMW
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-semibold">
                    {lipilaFlowType === "subscription" ? `Mabala Plan: ${renewSelectedPlan?.name}` : selectedProduct?.name}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Mobile Money Carrier Operator</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["MTN MoMo", "Airtel Money", "Zamtel Money"] as any[]).map(prov => {
                        const isChosen = paymentProvider === prov;
                        return (
                          <button
                            key={prov}
                            type="button"
                            onClick={() => setPaymentProvider(prov)}
                            className={`py-2 px-1 text-center font-bold text-[10px] uppercase rounded-lg border tracking-wide font-sans cursor-pointer ${
                              isChosen 
                                ? "bg-white text-slate-950 border-white" 
                                : "bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800"
                            }`}
                          >
                            {prov.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Gateway Mobile Wallet number</label>
                    <input
                      type="text"
                      required
                      value={paymentPhone}
                      onChange={e => setPaymentPhone(e.target.value)}
                      placeholder="+260 9xx xxxxxx"
                      className="w-full text-center p-2 border border-slate-800 bg-slate-950 text-white font-mono text-xs focus:border-emerald-500 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center pb-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">4-Digit Security PIN</label>
                      <span className="text-[9px] text-[#10b981] font-mono lowercase">momo security prompt</span>
                    </div>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={paymentPin}
                      onChange={e => setPaymentPin(e.target.value)}
                      placeholder="••••"
                      className="w-full text-center p-3 border border-slate-800 bg-slate-950 text-white font-mono text-base tracking-widest focus:border-emerald-400 focus:outline-none rounded-xl"
                    />
                    <span className="text-[9px] text-slate-500 block pt-1.5 leading-normal text-center">
                      *Sandbox simulation: Enter standard "1234" numeric credential to grant authorization. Entering "0000" triggers dynamic denial testing.
                    </span>
                  </div>
                </div>

                {lipilaErrorMsg && (
                  <div className="p-3 bg-rose-950/50 border border-rose-900/40 text-rose-300 rounded-lg text-xs leading-normal font-bold">
                    {lipilaErrorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Confirm Authorization PIN
                </button>
              </form>
            )}

            {/* Clearing states */}
            {lipilaState === "processing" && (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin mx-auto" />
                <h4 className="text-xs uppercase font-extrabold tracking-widest text-[#10b981]">Processing Ledger Settlement...</h4>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal">Liquidating wallet assets, dispersing client cargo bike transport, registering system auditing ledger records...</p>
              </div>
            )}

            {/* Error testing block */}
            {lipilaState === "error" && (
              <div className="py-6 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h4 className="text-xs uppercase font-black tracking-widest text-rose-400 border-b pb-2">Authorization Arrested</h4>
                <p className="text-[10.5px] text-slate-300 leading-normal font-bold px-2">{lipilaErrorMsg}</p>
                <button
                  type="button"
                  onClick={() => setLipilaState("pin_entry")}
                  className="px-5 py-1.5 border border-slate-855 hover:bg-slate-800 rounded-lg text-xs text-white uppercase font-bold cursor-pointer"
                >
                  Correction Override
                </button>
              </div>
            )}

            {/* Success clearance logs screen */}
            {lipilaState === "success" && (
              <div className="py-6 text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-[#10b981] mx-auto animate-bounce" />
                <h4 className="text-xs uppercase font-black text-emerald-400 tracking-widest">Lipila Settlement Approved!</h4>
                <p className="text-[11px] text-slate-300 max-w-xs mx-auto leading-normal">
                  Your billing total parameter <span className="font-mono text-white font-bold">
                    {lipilaFlowType === "subscription" ? `${renewSelectedPlan?.price}` : `${checkoutTotal}`} ZMW
                  </span> has been cleared successfully. 
                  General ledger row was posted to Accounts on core system block mapping.
                </p>
                
                {lipilaFlowType === "subscription" ? (
                  <div className="p-3 bg-slate-950 text-left border border-slate-800 rounded-xl space-y-1.5 text-[10.5px] font-mono text-slate-400 font-semibold">
                    <div>Store: <span className="text-white">{activeVendorRecord?.name}</span></div>
                    <div>Plan: <span className="text-white">{renewSelectedPlan?.name}</span></div>
                    <div>Status: <span className="text-emerald-400 font-bold uppercase">UPGRADED & ACTIVE</span></div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950 text-left border border-slate-800 rounded-xl space-y-1.5 text-[10.5px] font-mono text-slate-400">
                    <div>Order ID: <span className="text-white">{`ORD-MKT-${Date.now().toString().slice(-4)}`}</span></div>
                    <div>Rider: <span className="text-white">{riders.find(r => r.id === selectedRiderId)?.name.split(" ")[0]}</span></div>
                    <div>Status: <span className="text-emerald-400">Assigned / Dispatched</span></div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-2">
                  {lipilaFlowType === "subscription" ? (
                    <button
                      type="button"
                      onClick={() => downloadSubscriptionReceiptPdf(
                        activeVendorRecord?.name || "Mabala Self-Merchant",
                        renewSelectedPlan?.name || "Mabala Package Layer",
                        renewSelectedPlan?.price || 150
                      )}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <span>📥 Download Printable Receipt</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const tempOrder: MarketplaceOrder = {
                          id: `ORD-MKT-${Date.now().toString().slice(-4)}`,
                          vendorId: selectedProduct?.vendorId || "vend-1",
                          vendorName: selectedProduct?.vendorName || "Seed Co",
                          buyerEmail: userEmail || "buyer@test.com",
                          productId: selectedProduct?.id || "prod-1",
                          productName: selectedProduct?.name || "Inputs",
                          quantity: purchaseQuantity,
                          priceAtPurchase: selectedProduct?.price || 100,
                          subtotal: checkoutSubtotal,
                          deliveryFee: checkoutDeliveryFee,
                          commissionAmount: checkoutCommission,
                          totalAmount: checkoutTotal,
                          recipientName: recipientName || "Buyer Customer",
                          recipientPhone: recipientPhone || "+260 970000000",
                          deliveryAddress: deliveryAddress || "Farm Gateway HQ",
                          riderId: selectedRiderId || "rider-1",
                          riderName: riders.find(r => r.id === selectedRiderId)?.name || "Rider Cargo",
                          distanceKm: distanceKm,
                          date: new Date().toISOString().split("T")[0],
                          status: "Processing",
                          paymentProvider: "MTN MoMo",
                          paymentPhone: paymentPhone || "+260 960000000"
                        };
                        downloadReceiptPdf(tempOrder);
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <span>📥 Download Printable Receipt</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowLipilaModal(false);
                      setLipilaState("idle");
                      setSelectedProduct(null);
                    }}
                    className="px-4 py-1.5 bg-white text-slate-950 font-black rounded-lg text-[11px] tracking-wide uppercase cursor-pointer"
                  >
                    Finish System Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER SELLER SELF REGISTRY & CATALOG MANAGEMENT */}
      {activeSubTab === "vendor-portal" && (
        <div className="space-y-6">
          
          {/* Main vendor onboarding block if not enrolled */}
          {!isSelfRegistered ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
                    Mabala Self-Service Merchant Directory
                  </span>
                  <h3 className="text-base font-bold text-slate-800 mt-2">Scale B2B Agro distribution and reach Zambian farmers</h3>
                  <p className="text-xs text-slate-500 leading-normal font-medium mt-1">
                    Independent agricultural vendors self-register on the Mabala public marketing workspace to publish live product catalogs, handle bulk supply, and disburse cargo via vetted bike logistics.
                  </p>
                </div>

                {/* Sub packages choice cards */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Choose Subscription Package Plan</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: "Basic", name: "Mabala Basic Merchant", cost: 150, desc: "Publish up to 5 items inside farm catalogs directories.", badge: "Organic Growth" },
                      { id: "Elite", name: "Mabala Elite Vendor", cost: 500, desc: "Publish 25 items, prioritize results directories, analytics.", badge: "Professional Trade" },
                      { id: "Cooperative Pro", name: "Cooperative Pro", cost: 1000, desc: "Infinite product catalogue, multi-agent store logins, VIP bike riders.", badge: "Zambia National Co-ops" }
                    ].map(pkg => {
                      const isSelected = onboardPkg === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setOnboardPkg(pkg.id as any)}
                          className={`p-4 rounded-2xl text-left border transition-all relative flex flex-col justify-between ${
                            isSelected 
                              ? "bg-slate-900 border-slate-900 text-white shadow" 
                              : "bg-white hover:bg-slate-50/50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className={`text-[8.5px] uppercase font-mono font-bold block pb-1 ${isSelected ? "text-emerald-400" : "text-emerald-600"}`}>
                            {pkg.badge}
                          </span>
                          <h4 className="font-bold text-xs leading-tight block">{pkg.name}</h4>
                          <p className={`text-[10.5px] mt-2 mb-3 leading-normal ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                            {pkg.desc}
                          </p>
                          <span className="text-xs font-mono font-extrabold block">{pkg.cost} ZMW/mo</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Registration detailed form */}
                <form onSubmit={handleOnboardVendor} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500">Store / Merchant Public name</label>
                    <input
                      type="text"
                      required
                      value={onboardVendorName}
                      onChange={e => setOnboardVendorName(e.target.value)}
                      placeholder="e.g. Chisamba Fertilizers Depot"
                      className="w-full text-xs p-2.5 mt-1 border rounded bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500">Core Agricultural trade niche</label>
                    <select
                      value={onboardCategory}
                      onChange={e => setOnboardCategory(e.target.value as any)}
                      className="w-full text-xs p-2.5 mt-1 border rounded bg-slate-50 focus:bg-white focus:outline-none"
                    >
                      <option value="Seeds & Agronomy">Seeds & Agronomy</option>
                      <option value="Veterinary & Health">Veterinary & Health</option>
                      <option value="Equipment & Tech">Equipment & Tech</option>
                      <option value="Feeds & Formulations">Feeds & Formulations</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500">Store Headquarters Location</label>
                    <input
                      type="text"
                      required
                      value={onboardLocation}
                      onChange={e => setOnboardLocation(e.target.value)}
                      placeholder="e.g. Soweto Street, Lusaka West"
                      className="w-full text-xs p-2.5 mt-1 border rounded bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500">Relative Distance to Shika Station (km)</label>
                    <input
                      type="number"
                      required
                      value={onboardDistance}
                      onChange={e => setOnboardDistance(Number(e.target.value))}
                      placeholder="e.g. 15"
                      className="w-full text-xs p-2.5 mt-1 border rounded bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Merchant Contact Hotline</label>
                    <input
                      type="text"
                      required
                      value={onboardPhone}
                      onChange={e => setOnboardPhone(e.target.value)}
                      placeholder="+260 97x xxxxxx dispatch line"
                      className="w-full text-xs p-2.5 mt-1 border rounded bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Corporate & Brand Logo</label>
                      <button
                        type="button"
                        onClick={() => {
                          setOnboardLogoUrl("https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=120&q=80");
                        }}
                        className="text-[9px] text-emerald-600 hover:underline font-extrabold cursor-pointer"
                      >
                        ✨ Set Sample Agribusiness Badge Logo
                      </button>
                    </div>

                    <div 
                      onDragOver={e => { e.preventDefault(); setIsDraggingLogo(true); }}
                      onDragLeave={() => setIsDraggingLogo(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setIsDraggingLogo(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          if (["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setOnboardLogoUrl(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          } else {
                            alert("❌ Invalid logo format. Please provide PNG, JPG, or WebP.");
                          }
                        }
                      }}
                      className={`p-4 border border-dashed rounded-xl text-center transition-all ${isDraggingLogo ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                    >
                      <input 
                        type="file" 
                        id="onboard_logo_file" 
                        accept=".png,.jpg,.jpeg,.webp"
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setOnboardLogoUrl(ev.target?.result as string);
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                      <label htmlFor="onboard_logo_file" className="cursor-pointer space-y-1.5 block">
                        {onboardLogoUrl ? (
                          <div className="flex flex-col items-center space-y-1.5">
                            <img src={onboardLogoUrl} alt="Store Logo Preview" className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm" referrerPolicy="no-referrer" />
                            <span className="text-[10px] text-slate-500 font-bold">Logo Uploaded Successfully! Click to replace.</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs text-slate-700 block">Drag & drop your store logo image or <strong className="text-emerald-600 hover:underline">browse file</strong></span>
                            <span className="text-[9px] text-slate-400 block leading-normal font-medium">PNG, JPG, WebP formats accepted</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-3">
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow"
                    >
                      Process Vendor Subscription & Self-Onboard Store
                    </button>
                  </div>
                </form>
              </div>

              {/* Informative column explain trade rules */}
              <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-6">
                <div>
                  <span className="text-[8.5px] uppercase font-bold tracking-widest block text-indigo-400 font-mono">B2B Core Trade Regulation Code</span>
                  <h3 className="text-sm font-bold block pt-1">Mabala Unified Market Laws for Tenants</h3>
                </div>

                <div className="space-y-4 text-xs font-semibold">
                  <div className="flex gap-3">
                    <div className="p-1.5 bg-slate-800 rounded-lg shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-white text-xs">Certified Input Sourcing</h4>
                      <p className="text-slate-400 leading-normal text-[10.5px]">All merchants self-onboarded under national packages are validated to sell registered seed-stock and animal health remedies approved by the country’s regulatory body.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-1.5 bg-slate-800 rounded-lg shrink-0">
                      <Bike className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-white text-xs">Vetted Bike Rider Dispatch</h4>
                      <p className="text-slate-400 leading-normal text-[10.5px]">Last mile delivery coordinates correspond directly to kilometers assessed on checkout. Rider fees go directly to independent registered bike logistics owners.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-1.5 bg-slate-800 rounded-lg shrink-0">
                      <DollarSign className="w-4 h-4 text-[#10b981]" />
                    </div>
                    <div>
                      <h4 className="text-white text-xs">Commission Card Settlement</h4>
                      <p className="text-slate-400 leading-normal text-[10.5px]">Mabala deducts a configurable percentage commission directly from completed sales invoices to maintain developer systems and credit clearing networks.</p>
                    </div>
                  </div>
                </div>

                {/* Showcase dynamic admin rate card so user sees it is real */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[10.5px] font-mono text-slate-400 space-y-1.5">
                  <h4 className="text-white font-bold uppercase tracking-wider text-[9px] pb-1 border-b border-slate-850">ASSESSED GATEWAY CONSTANTS</h4>
                  <div className="flex justify-between">
                    <span>Mabala Marketplace Commission Fee:</span>
                    <span className="text-emerald-400 font-bold">{commissionPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last-Mile Transportation Rate Card:</span>
                    <span className="text-emerald-400 font-bold">{deliveryFeePerKm} ZMW/km</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeVendorRecord?.status === "Pending" ? (
            
            // PENDING ADMIN APPROVAL STATE view
            <div className="col-span-full w-full bg-slate-50 p-8 rounded-3xl border border-slate-200 text-center space-y-6 animate-fade-in text-slate-800">
              <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto text-xl border border-yellow-200 animate-bounce">
                ⏳
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-black uppercase text-slate-850 tracking-wider">Mabala Store Registry Pending Approval</h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed font-semibold">
                  Your merchant profile <strong className="text-slate-800">"{activeVendorRecord?.name}"</strong> has been registered successfully but is currently <strong className="text-yellow-600 font-bold uppercase">Pending Super Administrator Activation</strong>.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-2xl max-w-md mx-auto text-[11px] font-semibold leading-relaxed text-left">
                ℹ️ <strong>Super Administrator Review required:</strong> Access approval can be granted in your administration panel. Navigate to the <strong>"Admin Control"</strong> panel to review pending merchants and approve this portal instance.
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("admin-config")}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Switch to Admin Control Panel
                </button>
              </div>
            </div>

          ) : (activeVendorRecord as any)?.forcesPasswordReset ? (

            // SECURE FORCED PASSWORD RESET STATE view
            <div className="col-span-full w-full max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-lg space-y-6 animate-fade-in text-slate-800">
              <div className="text-center space-y-2">
                <span className="text-[9px] bg-indigo-50 text-indigo-750 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
                  Security Access Verification
                </span>
                <h3 className="text-sm font-black text-slate-800 uppercase pt-2">Forced Password Reset Required</h3>
                <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                  This is your first login to the Mabala Seller Portal using temporary credentials. For your protection, you must establish a secure permanent password.
                </p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newPasswordInput.trim() || !confirmPasswordInput.trim()) {
                    alert("Please complete all password elements.");
                    return;
                  }
                  if (newPasswordInput !== confirmPasswordInput) {
                    alert("New password fields do not match.");
                    return;
                  }
                  if (newPasswordInput.length < 5) {
                    alert("Your new secure password must contain at least 5 character dimensions.");
                    return;
                  }

                  // Update vendor record
                  setVendors(prev => prev.map(item => {
                    if (item.id === activeVendorRecord.id) {
                      return {
                        ...item,
                        forcesPasswordReset: false,
                        tempPassword: undefined
                      };
                    }
                    return item;
                  }));

                  alert("🚀 Password securely established! Welcome to your Mabala Seller dashboard portal space.");
                  setNewPasswordInput("");
                  setConfirmPasswordInput("");
                }}
                className="space-y-4 text-xs font-semibold"
              >
                <div className="bg-slate-50 p-3 rounded-xl border border-dashed flex justify-between items-center text-[11px] text-slate-500 font-bold">
                  <span>Authorized Username:</span>
                  <span className="font-mono text-slate-800">{(activeVendorRecord as any)?.email}</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Temporary Password Entered</label>
                  <input
                    type="text"
                    disabled
                    className="w-full mt-1 p-2 bg-slate-50 border rounded font-mono text-slate-400 select-all cursor-not-allowed"
                    value={(activeVendorRecord as any)?.tempPassword || ""}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Establish New Private Password</label>
                  <input
                    type="password"
                    className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded text-slate-900"
                    placeholder="••••••••"
                    value={newPasswordInput}
                    onChange={e => setNewPasswordInput(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded text-slate-900"
                    placeholder="••••••••"
                    value={confirmPasswordInput}
                    onChange={e => setConfirmPasswordInput(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs cursor-pointer text-center"
                >
                  Settle Private Password & Boot Dashboard
                </button>
              </form>
            </div>

          ) : (
            
            // IF VENDOR APPROVED & CREDENTIALS RESET COMPLETED -> RUN NORMAL SELLER PORTAL DASHBOARD
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Vendor Catalogue Manager */}
              <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                
                {/* 1. Subscription Management High Fidelity Segment */}
                <div className="bg-gradient-to-br from-indigo-900 via-slate-950 to-emerald-950 p-6 rounded-3xl border border-indigo-950 text-white space-y-5">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest font-mono">
                        Mabala Gateway Merchant Subscription
                      </span>
                      <h4 className="text-xl font-black text-slate-100 mt-2 block">
                        Account Billing & Limits Center
                      </h4>
                      <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                        Currently enrolled under the <strong className="text-emerald-400 font-bold uppercase">{activeVendorRecord?.subscriptionPackage}</strong> tier.
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-300 uppercase font-black block">Available Account Balance</span>
                      <strong className="text-2xl font-mono text-emerald-400 block font-black">
                        {activeVendorRecord?.credits || 0} Credits
                      </strong>
                      <span className="text-[9px] text-emerald-300 font-semibold">• Auto credit top-up active</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-indigo-900/60 pt-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-300 uppercase font-black block">Current Subscription Period</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono font-bold">
                          Expires on: <mark className="bg-transparent text-white font-black underline decoration-emerald-400">{activeVendorRecord?.expiryDate || "2026-06-30"}</mark>
                        </span>
                      </div>
                      
                      {/* Reminder status */}
                      {(() => {
                        const today = new Date("2026-06-05");
                        const expiry = new Date(activeVendorRecord?.expiryDate || "2026-06-30");
                        const diffTime = expiry.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays <= 7 && diffDays >= 0) {
                          return (
                            <div className="pt-2 text-[11px] text-yellow-300 leading-normal font-bold flex gap-1.5 items-center">
                              <Mail className="w-3.5 h-3.5 animate-pulse text-yellow-400" />
                              <span>📬 Email expiry notice sent (7 days before subscription period ends).</span>
                            </div>
                          );
                        } else if (diffDays < 0) {
                          return (
                            <div className="pt-2 text-[11px] text-red-500 leading-normal font-bold flex gap-1.5 items-center">
                              <AlertCircle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                              <span>⚠️ ACCOUNT EXPIRED. Storefront hidden until manual renewal processed.</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="pt-1.5 text-[10px] text-slate-300">
                              ✓ Auto reminder scheduled for {new Date(expiry.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}.
                            </div>
                          );
                        }
                      })()}
                    </div>

                    <div className="space-y-1 md:border-l md:border-indigo-900/60 md:pl-4">
                      <span className="text-[9px] text-slate-300 uppercase font-black block">Package limits & Features</span>
                      <ul className="text-[10px] text-slate-300 space-y-1">
                        <li>• Listing Limit: {activeVendorRecord?.subscriptionPackage === "Basic" ? "5 Active items" : (activeVendorRecord?.subscriptionPackage === "Elite" ? "25 Active items" : "Unlimited listings")}</li>
                        <li>• Features: Homepage featured slots, priority support, advanced analytics</li>
                      </ul>
                    </div>
                  </div>

                  {/* Manual Renewal Selector Option UI */}
                  <div className="pt-4 border-t border-indigo-900/60">
                    <span className="text-[9.5px] text-slate-300 uppercase font-black block pb-2">Renew or Upgrade Subscription dynamically via Lipila:</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {platformPackages.map(pkg => (
                        <div 
                          key={pkg.id} 
                          className="p-3 rounded-xl bg-slate-900/85 border border-slate-800 flex justify-between items-center hover:border-emerald-500 transition-all text-xs"
                        >
                          <div>
                            <h5 className="font-bold text-white leading-tight">{pkg.name}</h5>
                            <span className="text-[10px] text-indigo-300 font-mono select-none">{pkg.price} ZMW/Mo • +{pkg.credits || 300} Credits</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setLipilaFlowType("subscription");
                              setRenewSelectedPlan(pkg);
                              setLipilaErrorMsg("");
                              setLipilaState("handshake");
                              setShowLipilaModal(true);
                              setTimeout(() => {
                                setLipilaState("pin_entry");
                              }, 1300);
                            }}
                            className="p-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer shrink-0"
                          >
                            Renew/Pay
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-4 pt-4">
                  <div className="flex items-center gap-3">
                    {activeVendorRecord?.logoUrl ? (
                      <img 
                        src={activeVendorRecord.logoUrl} 
                        alt="Vendor Logo" 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 text-lg shrink-0">
                        🏪
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] bg-slate-150 text-slate-600 font-extrabold px-2 py-0.5 rounded uppercase font-mono">
                        STORE NODE: {activeVendorRecord?.id}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 mt-1">{activeVendorRecord?.name}</h3>
                      <p className="text-xs text-slate-400 font-medium leading-none mt-1">
                        Niche: {activeVendorRecord?.category} | Location: {activeVendorRecord?.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {/* Simulated Mailbox Trigger Button with unread counts badge */}
                    <button
                      type="button"
                      onClick={() => setShowEmailsInbox(!showEmailsInbox)}
                      className={`p-2.5 rounded-xl border text-xs text-center transition-all cursor-pointer ${showEmailsInbox ? "bg-amber-500 text-white border-amber-600" : "bg-indigo-50 border-indigo-150 text-indigo-700 hover:bg-indigo-100"}`}
                    >
                      <span className="text-[9px] text-indigo-400 font-extrabold block uppercase tracking-wider">SMS & Mail gateway</span>
                      <strong className="flex items-center justify-center gap-1.5 mt-0.5">
                        📬 {simulatedEmails.length} Alerts
                        {simulatedEmails.length > 0 && (
                          <span className="w-2 h-2 bg-rose-600 rounded-full animate-pulse inline-block" />
                        )}
                      </strong>
                    </button>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-slate-700 text-center">
                      <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Plan Billing Tier</span>
                      <span className="font-bold text-emerald-800">{activeVendorRecord?.subscriptionPackage} Package</span>
                    </div>
                  </div>
                </div>

                {/* SIMULATED VENDOR MAILBOX EXPANSION TRAY */}
                {showEmailsInbox && (
                  <div className="p-5 rounded-3xl bg-slate-900 text-slate-100 border border-slate-800 shadow-xl space-y-4 animate-fade-in relative">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <div>
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">📧 Simulated SMS & Email Notifications Gateway</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Automated diagnostic check of transactional receipts and low stock alerts.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEmailsInbox(false)}
                        className="text-[10px] uppercase font-black text-rose-400 hover:text-rose-300 underline cursor-pointer"
                      >
                        Minimize Inbox
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Left list pane */}
                      <div className="md:col-span-5 h-[280px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {simulatedEmails.map(mail => (
                          <div
                            key={mail.id}
                            onClick={() => setSelectedSubscribedEmail(mail)}
                            className={`p-2.5 rounded-xl border cursor-pointer text-[10.5px] transition-all text-left ${selectedSubscribedEmail?.id === mail.id ? "bg-amber-500/10 border-amber-500 text-white" : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"}`}
                          >
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mb-1">
                              <span className="truncate max-w-[150px]">{mail.recipient}</span>
                              <span>{mail.date}</span>
                            </div>
                            <strong className="block text-slate-100 truncate">{mail.subject}</strong>
                            <span className={`inline-block mt-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${mail.type === "low_stock" ? "bg-rose-500/25 text-rose-300" : "bg-emerald-500/25 text-emerald-300"}`}>
                              {mail.type === "low_stock" ? "Low Stock Warning" : "Delivery Order Receipt"}
                            </span>
                          </div>
                        ))}

                        {simulatedEmails.length === 0 && (
                          <div className="h-[220px] flex flex-col items-center justify-center text-slate-400 text-center space-y-2">
                            <span className="text-3xl">📭</span>
                            <p className="text-[10.5px] font-bold">Inbox is currently empty</p>
                            <p className="text-[9.5px] text-slate-500 max-w-xs leading-normal">
                              Purchase items at checkout or deplete stock past safety thresholds to dispatch instant warnings.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right viewer pane */}
                      <div className="md:col-span-7 bg-white rounded-2xl p-4 border border-slate-800 h-[280px] overflow-y-auto text-slate-800 text-xs shadow-inner">
                        {selectedSubscribedEmail ? (
                          <div dangerouslySetInnerHTML={{ __html: selectedSubscribedEmail.body }} />
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                            <span className="text-2xl mb-1 mt-6">📄</span>
                            <p className="font-bold text-[11px] text-slate-300">No Alert Selected</p>
                            <p className="text-[9.5px] text-slate-500 max-w-[200px]">Click any message logs on the sidebar to view full compiled metrics.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* List own products catalog */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Your Live Store Inventory</h4>
                  
                  <div className="divide-y border rounded-2xl overflow-hidden bg-slate-50">
                    {products.filter(p => p.vendorId === activeVendorRecord?.id).map(prod => {
                      const isLowStock = prod.stock <= (prod.lowStockThreshold || 5);
                      return (
                        <div key={prod.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border-b">
                          <div className="flex gap-3 items-center">
                            {prod.productImages && prod.productImages.length > 0 ? (
                              <img 
                                src={prod.productImages[0]} 
                                alt=""
                                className="w-12 h-12 rounded-lg object-cover border shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-3xl p-1 bg-slate-100 rounded-lg shrink-0">{prod.iconEmoji}</span>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase font-mono font-bold text-slate-400 tracking-widest">{prod.category}</span>
                                <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded font-mono ${prod.isActive !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                  {prod.isActive !== false ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <h5 className="font-bold text-xs text-slate-800">{prod.name}</h5>
                              <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed max-w-sm shrink-0">
                                {prod.description || `${prod.name} catalogue release`}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[9.5px] font-mono text-slate-400 font-bold">
                                <span>📍 Location: <b className="text-slate-600">{prod.productLocation || activeVendorRecord?.location}</b></span>
                                <span>• ⚖️ Unit: <b className="text-slate-600">{prod.unitOfMeasure || "kg"}</b></span>
                                <span>• ⚙️ VAT: <b className="text-[#10b981]">{prod.vatApplicable ? "Yes (16%)" : "Exempt"}</b></span>
                                {prod.productImages && <span>• 📸 Images: <b className="text-slate-600">{prod.productImages.length}</b></span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto text-xs shrink-0">
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 block font-bold leading-none uppercase">Item Cost</span>
                              <span className="font-mono font-bold text-slate-950">{prod.price} ZMW</span>
                              <span className="text-[9.5px] text-slate-400 block font-bold leading-none uppercase mt-1">Stock Level</span>
                              <span className={`font-mono font-bold block ${isLowStock ? "text-rose-600 font-extrabold animate-pulse" : "text-slate-700"}`}>
                                {prod.stock} / Alert at {prod.lowStockThreshold || 5}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setProducts(prev => {
                                    const updated = prev.map(p => p.id === prod.id ? { ...p, isActive: p.isActive === false } : p);
                                    localStorage.setItem("mabala_marketplace_products", JSON.stringify(updated));
                                    return updated;
                                  });
                                  alert(`"${prod.name}" status updated successfully!`);
                                }}
                                title="Click to instant toggle publish status"
                                className={`p-1.5 px-2 font-black uppercase text-[9px] rounded-lg cursor-pointer transition ${prod.isActive !== false ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                              >
                                {prod.isActive !== false ? "Deactivate" : "Activate"}
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingProduct(prod)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-bold uppercase text-[9px]"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {products.filter(p => p.vendorId === activeVendorRecord?.id).length === 0 && (
                      <div className="p-8 text-center text-xs text-slate-400 bg-white">
                        Your catalog database is empty. Build catalog items using the registration form.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Vendor Catalogue Publisher Form & Store Clearings */}
              <div className="lg:col-span-4 space-y-6">

                {/* Onboard Catalog Form */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Publish catalog input</h3>
                    <p className="text-[10.5px] text-slate-400 leading-normal">Publish products immediately visible on buyer directory pages.</p>
                  </div>

                  <form onSubmit={handleAddProduct} className="space-y-3 px-0.5 text-xs font-semibold">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450">Product Public Name</label>
                      <input
                        type="text"
                        required
                        value={newProdName}
                        onChange={e => setNewProdName(e.target.value)}
                        placeholder="e.g. Certified Soya S-401 bags"
                        className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-450">Retail price (ZMW)</label>
                        <input
                          type="number"
                          required
                          value={newProdPrice}
                          onChange={e => setNewProdPrice(Number(e.target.value))}
                          className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-450">In-Stock Qty</label>
                        <input
                          type="number"
                          required
                          value={newProdStock}
                          onChange={e => setNewProdStock(Number(e.target.value))}
                          className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-450">Unit of measure</label>
                        <select
                          value={newProdUnitOfMeasure}
                          onChange={e => setNewProdUnitOfMeasure(e.target.value)}
                          className="w-full mt-1 p-2 border bg-slate-50 rounded"
                        >
                          <option value="kg">kg (Kilogram)</option>
                          <option value="litre">litre (Litre)</option>
                          <option value="bag">bag (Bag)</option>
                          <option value="bundle">bundle (Bundle)</option>
                          <option value="each">each (Each)</option>
                          <option value="tonne">tonne (Tonne)</option>
                          <option value="crate">crate (Crate)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-450">Low Stock Alert Limit</label>
                        <input
                          type="number"
                          required
                          value={newProdLowStockThreshold}
                          onChange={e => setNewProdLowStockThreshold(Number(e.target.value))}
                          className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-[#1e293b]">Category / Niche</label>
                        <input
                          type="text"
                          required
                          value={newProdCategory}
                          onChange={e => setNewProdCategory(e.target.value)}
                          placeholder={activeVendorRecord?.category || "Seeds & Agronomy"}
                          className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded text-xs"
                        />
                        <span className="text-[9px] text-slate-450 block leading-normal font-medium mt-0.5">Inherited from store niche, feel free to refine or make more specific.</span>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-450">Illustration / Emoji</label>
                        <select
                          value={newProdEmoji}
                          onChange={e => setNewProdEmoji(e.target.value)}
                          className="w-full mt-1 p-2 border bg-slate-50 rounded"
                        >
                          <option value="🌾">🌾 Oats / Crop</option>
                          <option value="🌽">🌽 Maize Sizing</option>
                          <option value="🫘">🫘 Seeds Bean</option>
                          <option value="🧪">🧪 Med / Vaccine</option>
                          <option value="🧼">🧼 Dip Soap</option>
                          <option value="🚜">🚜 Tractor Rental</option>
                          <option value="⚙️">⚙️ Heavy Tooling</option>
                          <option value="🐷">🐷 Feeding Pigs</option>
                          <option value="☀️">☀️ Solar Drip</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">VAT Status</label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setNewProdVatApplicable(true)}
                            className={`flex-1 py-1.5 rounded-lg border font-bold text-[10px] uppercase cursor-pointer ${newProdVatApplicable ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]" : "bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-500"}`}
                          >
                            VAT (16%)
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewProdVatApplicable(false)}
                            className={`flex-1 py-1.5 rounded-lg border font-bold text-[10px] uppercase cursor-pointer ${!newProdVatApplicable ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-500"}`}
                          >
                            Exempt
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-455">Custom Location</label>
                        <input
                          type="text"
                          value={newProdProductLocation}
                          onChange={e => setNewProdProductLocation(e.target.value)}
                          placeholder={activeVendorRecord?.location || "Lusaka, ZM"}
                          className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded"
                        />
                      </div>
                    </div>

                    {/* Drag and Drop Product Images */}
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-black text-slate-450">Product Images (Min 2, Max 6)</label>
                        <button
                          type="button"
                          onClick={handleLoadDemoProductImages}
                          className="text-[9px] text-emerald-600 hover:underline font-extrabold inline-flex items-center"
                        >
                          ✨ Load Demo Agricultural Images
                        </button>
                      </div>
                      
                      <div 
                        onDragOver={e => { e.preventDefault(); setIsDraggingProdImg(true); }}
                        onDragLeave={() => setIsDraggingProdImg(false)}
                        onDrop={e => {
                          e.preventDefault();
                          setIsDraggingProdImg(false);
                          handleProductImageUpload(e.dataTransfer.files);
                        }}
                        className={`mt-1.5 p-3.5 border border-dashed rounded-xl text-center transition-all ${isDraggingProdImg ? "border-[#10b981] bg-[#10b981]/5" : "border-slate-200 hover:border-slate-350 bg-slate-50"}`}
                      >
                        <input 
                          type="file" 
                          id="product_img_files" 
                          multiple 
                          accept=".png,.jpg,.jpeg,.webp"
                          className="hidden" 
                          onChange={e => handleProductImageUpload(e.target.files)}
                        />
                        <label htmlFor="product_img_files" className="cursor-pointer space-y-1 block">
                          <span className="text-[11px] text-slate-700 block">Drag & drop or <strong className="text-[#10b981] hover:underline">browse files</strong></span>
                          <span className="text-[9px] text-slate-400 block leading-normal font-medium">Accepted: PNG, JPG, WebP (Strict min 600x600px size threshold)</span>
                        </label>
                      </div>

                      {/* Render preview gallery */}
                      {newProdProductImages.length > 0 && (
                        <div className="mt-2 grid grid-cols-6 gap-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200">
                          {newProdProductImages.map((img, i) => (
                            <div key={i} className="relative group aspect-square rounded-lg border overflow-hidden bg-white">
                              <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => setNewProdProductImages(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-0.5 right-0.5 p-0.5 bg-black/65 hover:bg-black text-white text-[8px] rounded cursor-pointer font-bold leading-none"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-bold text-slate-450">Descriptive Scope (Max 500 chars)</label>
                        <span className="text-[9.5px] text-slate-400 font-mono">{(newProdDescription || "").length}/500</span>
                      </div>
                      <textarea
                        value={newProdDescription}
                        onChange={e => setNewProdDescription(e.target.value.slice(0, 500))}
                        rows={2.5}
                        maxLength={500}
                        placeholder="Detail certified properties, bag measurements etc."
                        className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-white font-black rounded-lg text-xs tracking-wider uppercase shadow cursor-pointer text-center"
                    >
                      Publish Item to Catalogue Shelf
                    </button>
                  </form>
                </div>

                {/* Sub-orders cleared dashboard for this specific vendor */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Store Clearings (Last orders received)</h3>
                    <p className="text-[10.5px] text-slate-400 leading-normal">Track purchase deliveries pending rider updates.</p>
                  </div>

                  <div className="space-y-2.5 divide-y">
                    {orders.filter(o => o.vendorId === activeVendorRecord?.id).slice(0, 4).map(o => (
                      <div key={o.id} className="pt-2 text-xs font-semibold flex justify-between items-center">
                        <div>
                          <span className="text-slate-800 block text-[11px]">{o.quantity}x {o.productName}</span>
                          <span className="text-[9px] text-slate-400 font-mono">Date: {o.date} | Address: {o.deliveryAddress}</span>
                        </div>
                        <span className="text-emerald-700 font-mono font-bold text-xs">{o.subtotal} ZMW</span>
                      </div>
                    ))}
                    {orders.filter(o => o.vendorId === activeVendorRecord?.id).length === 0 && (
                      <div className="text-center text-[10.5px] text-slate-400 italic py-2">
                        No orders registered under your catalog merchant identity.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
          
        </div>
      )}

      {/* RENDER MARKETPLACE & SUBSCRIPTION ANALYTICS DASHBOARD */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          
          {/* Main Stat KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-100 flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-xl text-white">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-indigo-950 font-bold uppercase tracking-wider block">Aggregate Product GMV</span>
                <strong className="text-xl font-black font-mono">
                  {orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()} ZMW
                </strong>
                <span className="text-[9px] text-indigo-700 block mt-0.5">• Total trade volume generated ({orders.length} orders)</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl border border-emerald-100 flex items-center gap-4">
              <div className="p-3 bg-emerald-600 rounded-xl text-white">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-950 font-bold uppercase tracking-wider block">Subscription Volume</span>
                <strong className="text-xl font-black font-mono">
                  {(vendors.reduce((sum, v) => {
                    const price = platformPackages.find(p => p.name === v.subscriptionPackage)?.price || (v.subscriptionPackage === "Premium Seller" ? 500 : 150);
                    return sum + price;
                  }, 0)).toLocaleString()} ZMW/Mo
                </strong>
                <span className="text-[9px] text-emerald-700 block mt-0.5">• MRR on {vendors.length} merchants</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-100 flex items-center gap-4">
              <div className="p-3 bg-amber-600 rounded-xl text-white">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-amber-950 font-bold uppercase tracking-wider block">Expiry Warnings</span>
                <strong className="text-xl font-black font-mono text-amber-850">
                  {vendors.filter(v => {
                    if (v.status === "Expired") return true;
                    if (!v.expiryDate) return false;
                    const diffDays = Math.ceil((new Date(v.expiryDate).getTime() - new Date("2026-06-05").getTime()) / (1000 * 3600 * 24));
                    return diffDays <= 7 && diffDays >= 0;
                  }).length} Stores
                </strong>
                <span className="text-[9px] text-amber-700 block mt-0.5">• Expired or critical period (&lt;7d)</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-slate-800 rounded-xl text-white">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Logistics Dispatch</span>
                <strong className="text-xl font-black font-mono">
                  {riders.filter(r => r.status === "Available").length} / {riders.length} Can Go
                </strong>
                <span className="text-[9px] text-slate-500 block mt-0.5">• Active bike dispatchers ready</span>
              </div>
            </div>
            
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Visual packages distribution and Expire Notice Simulator */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              
              {/* Packages Share Bar chart visualization */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Mabala Merchant Tier Distribution Share</h4>
                  <p className="text-[10.5px] text-slate-400">Merchant registration allocation across active packages.</p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {(() => {
                    const packagesMap: Record<string, { count: number; color: string; bg: string }> = {
                      "Premium Seller": { count: 0, color: "bg-emerald-600", bg: "bg-emerald-50" },
                      "Smallholder Standard Pack": { count: 0, color: "bg-indigo-600", bg: "bg-indigo-50" },
                      "Commercial Growth Layer": { count: 0, color: "bg-sky-600", bg: "bg-sky-50" },
                      "Agro-Enterprise Premium": { count: 0, color: "bg-purple-600", bg: "bg-purple-50" },
                      "Basic": { count: 0, color: "bg-slate-500", bg: "bg-slate-50" }
                    };

                    vendors.forEach(v => {
                      const tier = v.subscriptionPackage;
                      if (!packagesMap[tier]) {
                        packagesMap[tier] = { count: 0, color: "bg-indigo-600", bg: "bg-indigo-50" };
                      }
                      packagesMap[tier].count++;
                    });

                    const totalTenants = vendors.length || 1;

                    return Object.entries(packagesMap).map(([name, detail]) => {
                      const percentage = Math.round((detail.count / totalTenants) * 100);
                      return (
                        <div key={name} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-700">{name}</span>
                            <span className="font-mono text-slate-500 font-medium font-bold">
                              {detail.count} Tenants ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className={`${detail.color} h-full transition-all duration-1000`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Expire Warn Notification Generator Controller */}
              <div className="border-t pt-5 space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span>Dynamic Billing & Expiry Warning Center</span>
                  </h4>
                  <p className="text-[10.5px] text-slate-400">
                    Interact with system notification pathways. Click any row trigger action button below to simulation-broadcast customized notifications & update the outbox logs in real time.
                  </p>
                </div>

                <div className="overflow-x-auto border rounded-xl overflow-hidden bg-slate-50">
                  <table className="w-full text-left text-[11px] text-slate-800 bg-white">
                    <thead className="bg-[#f1f5f9] text-[9.5px] font-bold text-slate-400 uppercase tracking-wider border-b">
                      <tr>
                        <th className="p-2.5">Merchant Store</th>
                        <th className="p-2.5 text-center">Remaining Days</th>
                        <th className="p-2.5 text-right">Expiry Threshold Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold">
                      {vendors.map(v => {
                        const today = new Date("2026-06-05");
                        const expiry = new Date(v.expiryDate || "2026-06-30");
                        const diffTime = expiry.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        const isExpired = v.status === "Expired" || diffDays < 0;

                        return (
                          <tr key={v.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5">
                              <span className="font-bold text-slate-800 block leading-tight">{v.name}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">{v.email}</span>
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold">
                              {isExpired ? (
                                <span className="text-rose-600 px-2 py-0.5 bg-rose-50 rounded">EXPIRED</span>
                              ) : (
                                <span className={`${diffDays <= 7 ? "text-yellow-600 font-extrabold" : "text-emerald-600"}`}>
                                  {diffDays} Days Left
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  // Send simulated warning alert
                                  const newLog = {
                                    id: expiryNotifications.length + 1,
                                    recipient: v.email,
                                    farm: v.name,
                                    type: isExpired ? "Expired Store Notification" : "7-Day Critical Interval notice",
                                    date: new Date("2026-06-05").toISOString().split("T")[0],
                                    status: isExpired ? "Sent (Store Suspended in frontend)" : "Sent (Auto warning threshold)"
                                  };
                                  setExpiryNotifications(prev => [newLog, ...prev]);
                                  alert(`⚡ Notification dispatched to "${v.email}"!\nMessage text: "Mabala warns subscription period ends shortly for system node [${v.name}]. Proceed to Lipila endpoint to avoid merchant store suspension."`);
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[9.5px] cursor-pointer"
                              >
                                Trigger Expiry Alert Mail
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

            {/* Right Column: Live Subscription Logs & Expiry Notifications Track Console */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Live System Broadcast Logs</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Outbox auditing trails of email messages delivered to store managers.
                </p>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {expiryNotifications.map((note) => (
                  <div key={note.id} className="p-3 bg-slate-50 border rounded-xl space-y-1 text-[11px] leading-relaxed">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-indigo-900 block">{note.type}</span>
                      <span className="text-[9px] font-mono font-medium text-slate-400">{note.date}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-medium leading-normal">
                      Recipient: <strong className="text-slate-800 font-bold">{note.recipient}</strong> ({note.farm})
                    </p>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 font-semibold px-2 py-0.5 rounded-full block w-fit">
                      {note.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Instant Manual Renew / Upgrade trigger right inside analytics dashboard */}
              <div className="p-4 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl border border-indigo-950 text-white space-y-3.5">
                <span className="text-[9px] uppercase font-mono font-black text-indigo-300 block tracking-wider">
                  ⚡ Interactive Merchant Renewal Gateway
                </span>
                <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed">
                  Fast gateway setup to renew or upgrade subscription tier and reload credit limits dynamically via Lipila.
                </p>
                
                <div className="space-y-2.5">
                  {vendors.map(v => {
                    const priceValue = v.subscriptionPackage === "Premium Seller" ? 500 : (v.subscriptionPackage === "Elite" ? 200 : 150);
                    return (
                      <div key={v.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900 text-xs border border-indigo-950/50">
                        <div>
                          <strong className="text-white block truncate max-w-[120px]">{v.name}</strong>
                          <span className="text-[10px] text-emerald-400 font-mono italic">{v.subscriptionPackage}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setLipilaFlowType("subscription");
                            // Set dynamic renew variables for this merchant!
                            setRenewSelectedPlan({
                              name: v.subscriptionPackage || "Premium Seller",
                              price: priceValue,
                              credits: v.subscriptionPackage === "Premium Seller" ? 300 : 100
                            });
                            setLipilaErrorMsg("");
                            setLipilaState("handshake");
                            setShowLipilaModal(true);
                            // We mock the transition
                            setTimeout(() => {
                              setLipilaState("pin_entry");
                            }, 1300);

                            // We must temporarily override the activeVendorRecord! Let's make sure it renews!
                            setRegisteredVendorId(v.id);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Renew / Pay
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* RENDER ADVERTISING/CONFIG ADMIN SETTINGS PAGE */}
      {activeSubTab === "admin-config" && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Super Admin Rate Config Form */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 h-fit">
              <div>
                <span className="text-[10px] bg-indigo-50 text-indigo-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
                  Market Overlord Control
                </span>
                <h3 className="text-sm font-black uppercase text-slate-800 mt-2">Global Rate Cards Sizing</h3>
                <p className="text-xs text-slate-500 leading-normal">Configure commissions collected on finished checkouts & core bike rider per-kilometer transport fees.</p>
              </div>

              <form onSubmit={handleApplyAdminRates} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Lipila Commission Fee Percent (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={adminCommissionInput}
                    onChange={e => setAdminCommissionInput(Number(e.target.value))}
                    className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[9px] text-slate-400 pt-1 block leading-normal">
                    This commission portion is dynamically accrued onto Mabala ledger totals upon every successful clearing.
                  </span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Cargo Bike Courier Rate (ZMW per KM)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    max={30}
                    value={adminDeliveryInput}
                    onChange={e => setAdminDeliveryInput(Number(e.target.value))}
                    className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[9px] text-slate-400 pt-1 block leading-normal">
                    Assigned couriers will be allocated standard fuel and carriage weights matching this distance value.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-800 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm cursor-pointer"
                >
                  Apply Global Marketplace Configurations
                </button>
              </form>
            </div>

            {/* Overlord Metrics Directory list of Vendors & orders commissions */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-5">
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-slate-800">
                  <span className="text-[9px] text-indigo-400 uppercase font-black block tracking-widest font-mono">Total Sales Booked</span>
                  <strong className="text-xl font-mono block mt-1">
                    {orders.reduce((acc, current) => acc + current.subtotal, 0)} ZMW
                  </strong>
                  <span className="text-[10px] text-slate-400 block leading-none font-semibold mt-1">
                    Combined value of hybrid seed batches and input catalogs.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-slate-800">
                  <span className="text-[9px] text-emerald-400 uppercase font-black block tracking-widest font-mono">Commission Revenue Acquired</span>
                  <strong className="text-xl font-mono block mt-1 font-black text-emerald-700">
                    {orders.reduce((acc, current) => acc + current.commissionAmount, 0).toFixed(2)} ZMW
                  </strong>
                  <span className="text-[10px] text-emerald-600 block leading-none font-semibold mt-1">
                    Accrued platform system profits.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase font-black block tracking-widest font-mono">Registered Merchants</span>
                  <strong className="text-xl font-mono block mt-1">{vendors.length} Stores</strong>
                  <span className="text-[10px] text-slate-400 block leading-none font-semibold mt-1">
                    Independent sub-accounts tracking inventories.
                  </span>
                </div>
              </div>

              {/* Custom Super Admin Subscription Packages Manager */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-250 space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Mabala Active Subscription Plans (Super Admin)</h4>
                  <p className="text-[10.5px] text-slate-400">Configure package names, ZMW pricing, features text and active status toggles live.</p>
                </div>

                <div className="overflow-x-auto border rounded-xl bg-white overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-[#f8fafc] text-[9.5px] font-bold text-slate-400 uppercase tracking-wider border-b">
                      <tr>
                        <th className="p-3">Plan Name</th>
                        <th className="p-3">Monthly Cost</th>
                        <th className="p-3">Credits Block</th>
                        <th className="p-3">Description Features</th>
                        <th className="p-3">Platform Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold text-slate-700 text-xs">
                      {platformPackages.map((pkg: any) => (
                        <tr key={pkg.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">
                            {editingPlanId === pkg.id ? (
                              <input 
                                type="text"
                                className="border rounded px-2 py-1 text-xs w-full bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={editingPlanName}
                                onChange={e => setEditingPlanName(e.target.value)}
                              />
                            ) : (
                              <span>{pkg.name}</span>
                            )}
                          </td>
                          <td className="p-3 font-mono">
                            {editingPlanId === pkg.id ? (
                              <input 
                                type="number"
                                className="border rounded px-2 py-1 text-xs w-24 bg-white font-mono text-slate-900 focus:outline-none"
                                value={editingPlanPrice}
                                onChange={e => setEditingPlanPrice(Number(e.target.value))}
                              />
                            ) : (
                              <span>{pkg.price} ZMW</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-indigo-600 font-bold">
                            {pkg.credits || 0} Credits
                          </td>
                          <td className="p-3 text-[11px] font-normal leading-normal text-slate-500 max-w-xs">
                            {editingPlanId === pkg.id ? (
                              <textarea 
                                className="border rounded px-2 py-1 text-xs w-full bg-white text-slate-950 text-[11px] focus:outline-none"
                                value={editingPlanFeatures}
                                onChange={e => setEditingPlanFeatures(e.target.value)}
                                rows={2}
                              />
                            ) : (
                              <span>{pkg.features || pkg.description}</span>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                setPlatformPackages(prev => prev.map(p => {
                                  if (p.id === pkg.id) {
                                    return { ...p, isActive: !p.isActive };
                                  }
                                  return p;
                                }));
                              }}
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border cursor-pointer ${
                                pkg.isActive 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {pkg.isActive ? "● Active / Loaded" : "○ Inactive / Hidden"}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            {editingPlanId === pkg.id ? (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPlatformPackages(prev => prev.map(p => {
                                      if (p.id === pkg.id) {
                                        return {
                                          ...p,
                                          name: editingPlanName,
                                          price: editingPlanPrice,
                                          features: editingPlanFeatures
                                        };
                                      }
                                      return p;
                                    }));
                                    setEditingPlanId(null);
                                    alert("Mabala dynamic subscription package parameters updated!");
                                  }}
                                  className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPlanId(null)}
                                  className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPlanId(pkg.id);
                                  setEditingPlanName(pkg.name);
                                  setEditingPlanPrice(pkg.price);
                                  setEditingPlanFeatures(pkg.features || pkg.description || "");
                                }}
                                className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                              >
                                Edit Plan
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Admin Backend Upload Form */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-250 space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Admin Backend Product Publisher</h4>
                  <p className="text-[10.5px] text-slate-400">
                    Publish specialized products on behalf of any merchant. Admin-uploaded products only delist/archive after the specified custom listing expiry date, independent of the vendor's subscription.
                  </p>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!adminUploadName.trim() || !adminUploadVendorId) {
                      alert("Please provide product name and assign a merchant.");
                      return;
                    }
                    const targetVendor = vendors.find(v => v.id === adminUploadVendorId);
                    if (!targetVendor) return;

                    const newAdminProduct: MarketplaceProduct = {
                      id: `prod-admin-${Date.now()}`,
                      vendorId: targetVendor.id,
                      vendorName: targetVendor.name,
                      name: adminUploadName,
                      category: adminUploadCategory,
                      price: Number(adminUploadPrice || 10),
                      stock: Number(adminUploadStock || 1),
                      description: adminUploadDescription || "Admin sponsored/uploaded merchant listing.",
                      iconEmoji: adminUploadIcon,
                      isAdminUploaded: true,
                      expiryDate: adminUploadExpiry,
                      unitOfMeasure: "each",
                      vatApplicable: false,
                      productLocation: targetVendor.location,
                      productImages: ["🌾", "🌾"], // fallback
                      isActive: true,
                      lowStockThreshold: 5
                    };

                    setProducts(prev => [newAdminProduct, ...prev]);
                    // Reset fields
                    setAdminUploadName("");
                    setAdminUploadPrice(100);
                    setAdminUploadStock(50);
                    setAdminUploadDescription("");
                    alert(`💡 Admin Backend Success: "${newAdminProduct.name}" posted on behalf of "${targetVendor.name}" successfully! Its listing will expire on ${adminUploadExpiry}.`);
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold bg-white p-5 rounded-2xl border"
                >
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Select Target Merchant</label>
                    <select
                      className="w-full mt-1 p-2 border bg-slate-50 rounded"
                      value={adminUploadVendorId}
                      onChange={e => setAdminUploadVendorId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Vendor --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.subscriptionPackage})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Product Name</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded"
                      placeholder="e.g. Admin Sponsored Maize Seeds"
                      value={adminUploadName}
                      onChange={e => setAdminUploadName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Product Category</label>
                    <select
                      className="w-full mt-1 p-2 border bg-slate-50 rounded"
                      value={adminUploadCategory}
                      onChange={e => setAdminUploadCategory(e.target.value as any)}
                    >
                      <option value="Seeds & Agronomy">Seeds & Agronomy</option>
                      <option value="Veterinary & Health">Veterinary & Health</option>
                      <option value="Equipment & Tech">Equipment & Tech</option>
                      <option value="Feeds & Formulations">Feeds & Formulations</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Retail Unit Price (ZMW)</label>
                    <input
                      type="number"
                      className="w-full mt-1 p-2 border bg-slate-50 rounded font-mono"
                      value={adminUploadPrice}
                      onChange={e => setAdminUploadPrice(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">In-Stock Quantities</label>
                    <input
                      type="number"
                      className="w-full mt-1 p-2 border bg-slate-50 rounded font-mono"
                      value={adminUploadStock}
                      onChange={e => setAdminUploadStock(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-yellow-600">Product Listing Expiry Date</label>
                    <input
                      type="date"
                      className="w-full mt-1 p-2 border border-yellow-200 bg-yellow-50/50 rounded font-mono text-slate-900 animate-pulse"
                      value={adminUploadExpiry}
                      onChange={e => setAdminUploadExpiry(e.target.value)}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Administrative Product Notes / Description</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded"
                      placeholder="Special description context for sponsored goods..."
                      value={adminUploadDescription}
                      onChange={e => setAdminUploadDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Item Emoji Illustration</label>
                    <select
                      className="w-full mt-1 p-2 border bg-slate-50 rounded"
                      value={adminUploadIcon}
                      onChange={e => setAdminUploadIcon(e.target.value)}
                    >
                      <option value="🌿">🌿 Oats Agronomy</option>
                      <option value="🌽">🌽 Maize champion</option>
                      <option value="🧪">🧪 Live NDV Vaccine</option>
                      <option value="⚙️">⚙️ Heavy Drill Tools</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 lg:col-span-3 pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-xs cursor-pointer"
                    >
                      Publish Admin Sponsored Product Listing
                    </button>
                  </div>
                </form>
              </div>

              {/* Dynamic Vendor accounts directory table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Registered Merchant Node Directory & Status</h4>
                <div className="overflow-x-auto border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs bg-white text-slate-800">
                    <thead className="bg-[#f8fafc] uppercase text-[9px] font-bold text-slate-400 tracking-wider border-b">
                      <tr>
                        <th className="p-3">Store ID / Joined Date</th>
                        <th className="p-3">Store Name & Contact</th>
                        <th className="p-3">Package & Expiry</th>
                        <th className="p-3">Credits Balance</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Interactive Simulator Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold text-slate-700 text-xs">
                      {vendors.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-[10.5px]">
                            {v.id}
                            <span className="text-[9px] text-slate-400 block font-normal">Joined: {v.joinedDate}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-800 font-bold block">{v.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono block">{v.phone} • {v.email}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border">
                              {v.subscriptionPackage}
                            </span>
                            <span className="text-[10.5px] font-mono text-slate-500 block pt-1">
                              Expires: {v.expiryDate || "N/A"}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-700 text-center">
                            {v.credits || 0} Credits
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                              v.status === "Active" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : v.status === "Expired" 
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }`}>
                              ● {v.status || "Active"}
                            </span>
                          </td>
                          <td className="p-3 text-right space-y-1.5 md:space-y-0.5 space-x-1">
                            {v.status === "Pending" && (
                              <button
                                type="button"
                                onClick={() => {
                                  const tempPwd = (v as any).tempPassword || `Mabala_${Math.floor(1000 + Math.random() * 9000)}!`;
                                  setVendors(prev => prev.map(item => {
                                    if (item.id === v.id) {
                                      return {
                                        ...item,
                                        status: "Active",
                                        tempPassword: tempPwd,
                                        forcesPasswordReset: true
                                      };
                                    }
                                    return item;
                                  }));

                                  // Launch Simulated Welcome Email popup dialog
                                  setSimulatedWelcomeEmail({
                                    to: v.email,
                                    vendorName: v.name,
                                    subject: `Welcome to Mabala Seller Portal — Activation Approved`,
                                    portalUrl: `${window.location.origin}/seller-portal`,
                                    tempPassword: tempPwd,
                                    support: "support@mabala.com or phone +260 977 881212"
                                  });
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black cursor-pointer mr-1 animate-pulse"
                              >
                                Approve & Activate Vendor
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setVendors(prev => prev.map(item => {
                                  if (item.id === v.id) {
                                    return {
                                      ...item,
                                      status: item.status === "Expired" ? "Active" : "Expired"
                                    };
                                  }
                                  return item;
                                }));
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9.5px] font-bold cursor-pointer"
                            >
                              Toggle Expired State
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setVendors(prev => prev.map(item => {
                                  if (item.id === v.id) {
                                    return {
                                      ...item,
                                      credits: (item.credits || 0) + 100
                                    };
                                  }
                                  return item;
                                }));
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[9.55px] font-extrabold cursor-pointer"
                            >
                              +100 Credits
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* SIMULATED WELCOME EMAIL MODAL OVERLAY */}
      {simulatedWelcomeEmail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden text-slate-800 animate-scale-up">
            
            {/* Header Banner */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                  M
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Mabala Automated Mailer System</h4>
                  <h3 className="text-sm font-bold block pt-0.5">Secure Vendor Dispatch Active</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSimulatedWelcomeEmail(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                id="close-simulated-email"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Metas */}
            <div className="p-4 bg-slate-50 border-b space-y-1 text-xs">
              <div className="flex justify-between">
                <div>
                  <span className="text-slate-400 font-bold">To:</span> <span className="font-mono text-slate-850 font-semibold">{simulatedWelcomeEmail.to}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono font-medium">Auto-Dispatched Server-Side • ZM</div>
              </div>
              <div>
                <span className="text-slate-400 font-bold">From:</span> <span className="font-bold text-slate-850 font-semibold font-sans">Mabala Seller Activation System &lt;no-reply@mabala.com&gt;</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold">Subject:</span> <span className="font-extrabold text-slate-900">{simulatedWelcomeEmail.subject}</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6 max-h-[380px] overflow-y-auto leading-relaxed">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-900">Mabala Seller Portal Approval & Account Activation</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Dear <strong className="text-slate-800 font-black">{simulatedWelcomeEmail.vendorName}</strong>,
                </p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Congratulations! Your application has been approved by the Mabala platform administrators. Your credentials and regional subscription workspace has been successfully initialized. Below you'll find the credentials and checklist required to start selling.
                </p>
              </div>

              {/* Boxed login details */}
              <div className="p-4 bg-[#f8fafc] border rounded-2xl space-y-3 text-slate-700">
                <h4 className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Mabala Seller portal login credentials</h4>
                <div className="space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between gap-1">
                    <span>Login URL for Mabala Seller Portal:</span>
                    <span className="text-emerald-600 hover:underline font-mono text-[11px] font-bold">
                      {simulatedWelcomeEmail.portalUrl}/seller-portal
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Username (Your Email):</span>
                    <span className="font-mono text-slate-900 font-bold">{simulatedWelcomeEmail.to}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Temporary Password:</span>
                    <span className="font-mono bg-yellow-50 text-yellow-850 font-black border border-yellow-200 px-2 py-0.5 rounded text-[11px]">
                      {simulatedWelcomeEmail.tempPassword}
                    </span>
                  </div>
                  <div className="text-[10px] text-yellow-750 italic font-medium">
                    ⚠️ *Forced reset on first login: You are forced to establish a custom brand secure password upon first logging in to your Seller Portal.
                  </div>
                </div>
              </div>

              {/* Quick start guide */}
              <div className="space-y-2 text-xs text-slate-700">
                <h4 className="text-xs font-bold text-slate-800 uppercase">Mabala Quick-Start Guide for Adding Products:</h4>
                <ul className="space-y-2 text-slate-600 font-semibold leading-relaxed list-decimal list-inside pl-1">
                  <li>Navigate to the **Mabala Seller Portal** using the URL above.</li>
                  <li>Use your email and temporary password to authenticate.</li>
                  <li>Complete the forced password reset security form by confirming your new secret key.</li>
                  <li>Access the **Catalogue Management** workspace from your tab page.</li>
                  <li>Click **"Add Custom Product"**, define retail units price in **ZMW**, stock volumes, and insert agronomic features notes.</li>
                  <li>Press publish — the product will instantly sync onto the active marketplace available to all farmers.</li>
                </ul>
              </div>

              {/* Contact point */}
              <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 font-semibold">
                If you experience any difficulties onboarding your catalog, please reach out to:
                <div className="mt-1 font-bold text-slate-700 font-mono">
                  Mabala Support Desk: {simulatedWelcomeEmail.support}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-50 border-t text-right">
              <button
                type="button"
                onClick={() => setSimulatedWelcomeEmail(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-white text-xs font-black transition cursor-pointer"
              >
                Deliver to Vendor Inbox & Close Simulator
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border w-full max-w-lg shadow-xl space-y-4 text-xs font-semibold text-slate-800">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">🛠️ Edit Product Details</h4>
                <p className="text-[10px] text-slate-400 capitalize font-medium">Modify properties for directory listings and stock alarms.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingProduct(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Inputs Form */}
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 text-left">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Product Name</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded text-xs"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 font-semibold">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Retail price (ZMW)</label>
                  <input
                    type="number"
                    className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded font-mono text-xs"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">In-Stock Quantity</label>
                  <input
                    type="number"
                    className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded font-mono text-xs"
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Unit of measure</label>
                  <select
                    className="w-full mt-1 p-2 border bg-slate-50 rounded text-xs"
                    value={editingProduct.unitOfMeasure || "kg"}
                    onChange={e => setEditingProduct({...editingProduct, unitOfMeasure: e.target.value})}
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="litre">litre (Litre)</option>
                    <option value="bag">bag (Bag)</option>
                    <option value="bundle">bundle (Bundle)</option>
                    <option value="each">each (Each)</option>
                    <option value="tonne">tonne (Tonne)</option>
                    <option value="crate">crate (Crate)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded font-mono text-xs"
                    value={editingProduct.lowStockThreshold || 5}
                    onChange={e => setEditingProduct({...editingProduct, lowStockThreshold: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-bold">Product Category / Niche</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded text-xs"
                  value={editingProduct.category}
                  onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                  placeholder="e.g. Specialty Hybrid Seeds"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">VAT Status</label>
                  <select
                    className="w-full mt-1 p-2 border bg-slate-50 rounded text-xs"
                    value={editingProduct.vatApplicable ? "yes" : "no"}
                    onChange={e => setEditingProduct({...editingProduct, vatApplicable: e.target.value === "yes"})}
                  >
                    <option value="no">Exempt / No VAT</option>
                    <option value="yes">Standard VAT Applicable (16%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Operational Location</label>
                  <input
                    type="text"
                    className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded text-xs"
                    placeholder={activeVendorRecord?.location}
                    value={editingProduct.productLocation || ""}
                    onChange={e => setEditingProduct({...editingProduct, productLocation: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Description (Max 500 chars)</label>
                <textarea
                  className="w-full mt-1 p-2 border bg-slate-50 focus:bg-white rounded resize-none text-xs"
                  rows={3}
                  maxLength={500}
                  value={editingProduct.description || ""}
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value.slice(0, 500)})}
                />
                <div className="text-[9.5px] text-right text-slate-400 mt-0.5 font-mono">
                  {(editingProduct.description || "").length}/500 Characters
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border">
                <input
                  type="checkbox"
                  id="editIsActive"
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer text-left"
                  checked={editingProduct.isActive !== false}
                  onChange={e => setEditingProduct({...editingProduct, isActive: e.target.checked})}
                />
                <label htmlFor="editIsActive" className="text-slate-700 uppercase font-bold text-[10px] tracking-wide cursor-pointer select-none text-left">
                  Listing active on directory shelves (Out-of-stock items also need valid stock qty to display)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t flex justify-end gap-2 text-xs font-bold uppercase">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingProduct.name.trim()) return;
                  setProducts(prev => {
                    const up = prev.map(p => p.id === editingProduct.id ? editingProduct : p);
                    localStorage.setItem("mabala_marketplace_products", JSON.stringify(up));
                    return up;
                  });
                  setEditingProduct(null);
                  alert("Product details updated successfully!");
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
              >
                Save updates
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
