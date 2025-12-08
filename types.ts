export interface Product {
  id: string;
  name: string;
  price: number; // Legacy - selling price
  costPrice: number; // Cost price for revenue calculation
  sellingPrice: number; // Selling price
  gst?: number; // GST percentage (optional)
  stock: number;
  category: string;
  barcode?: string;
  image?: string; // Base64 or URL of product image
}

export interface CartItem extends Product {
  quantity: number;
  discount: number;
}

export interface CustomerDue {
  id: string;
  amount: number;
  description: string; // What the due is for
  items?: { name: string; quantity: number; price: number }[]; // Items purchased on credit
  date: string;
  paid: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // Positive = Due from customer
  lastTransactionDate: string;
  dues?: CustomerDue[]; // Track individual dues with details
}

export interface VendorBill {
  id: string;
  date: string;
  amount: number;
  itemsDescription: string;
  billImageUrl?: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone?: string;
  category: string;
  balance: number; // Positive = We owe them
  nextPaymentDate: string;
  bills?: VendorBill[];
}

export interface MerchantProfile {
  shopName: string;
  ownerName: string;
  upiId: string;
  phone: string;
  address: string;
  geminiApiKey?: string;
}

export enum PaymentMethod {
  CASH = 'Cash',
  UPI = 'UPI',
  G_PAY = 'Google Pay',
  PHONE_PE = 'PhonePe',
  PAYTM = 'Paytm',
  CREDIT = 'Udhaar (Credit)'
}

export interface Transaction {
  id: string;
  customerId: string | null;
  customerName: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  itemsCount: number;
  billId: string;
  items?: CartItem[]; // To store historical item details and cost
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  vendorId?: string;
  vendorName?: string;
}

export interface SalesData {
  day: string;
  amount: number;
}