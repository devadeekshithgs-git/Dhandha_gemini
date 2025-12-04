export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode?: string;
}

export interface CartItem extends Product {
  quantity: number;
  discount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // Positive = Due from customer
  lastTransactionDate: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  balance: number; // Positive = We owe them
  nextPaymentDate: string;
}

export interface MerchantProfile {
  shopName: string;
  ownerName: string;
  upiId: string;
  phone: string;
  address: string;
}

export enum PaymentMethod {
  CASH = 'Cash',
  UPI = 'UPI',
  G_PAY = 'Google Pay',
  PHONE_PE = 'PhonePe',
  PAYTM = 'Paytm',
  CREDIT = 'Udhaar (Credit)'
}

export interface SalesData {
  day: string;
  amount: number;
}