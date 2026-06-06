export interface Vendor {
  id: string;
  name: string;
  category: "Seeds & Agronomy" | "Veterinary & Health" | "Equipment & Tech" | "Feeds & Formulations";
  location: string;
  distanceKm: number;
  phone: string;
  email: string;
  subscriptionPackage: "Basic" | "Elite" | "Cooperative Pro" | "Premium Seller" | string;
  status: "Active" | "Pending" | "Expired";
  joinedDate: string;
  expiryDate?: string;
  credits?: number;
  logoColor: string;
}

export interface MarketplaceProduct {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  category: "Seeds & Agronomy" | "Veterinary & Health" | "Equipment & Tech" | "Feeds & Formulations";
  price: number;
  stock: number;
  description: string;
  imageUrl?: string;
  iconEmoji: string;
  isAdminUploaded?: boolean;
  expiryDate?: string;
}

export interface BikeRider {
  id: string;
  name: string;
  phone: string;
  rating: number;
  vehicle: string;
  avatarColor: string;
  status: "Available" | "On Delivery" | "Offline";
}

export interface MarketplaceOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  buyerEmail: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  subtotal: number;
  deliveryFee: number;
  commissionAmount: number;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  riderId: string;
  riderName: string;
  distanceKm: number;
  date: string;
  status: "Processing" | "Out For Delivery" | "Delivered" | "Cancelled";
  paymentProvider: "MTN MoMo" | "Airtel Money" | "Zamtel Money";
  paymentPhone: string;
}

// Seed beautiful initial vendors
export const INITIAL_VENDORS: Vendor[] = [];

// Seed high-quality initial products
export const INITIAL_PRODUCTS: MarketplaceProduct[] = [];

// Seed standard bike riders
export const INITIAL_RIDERS: BikeRider[] = [];

// Initial orders
export const INITIAL_ORDERS: MarketplaceOrder[] = [];
