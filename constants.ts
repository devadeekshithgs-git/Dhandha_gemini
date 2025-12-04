import { Product, Customer, Vendor, SalesData } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Toor Dal 1kg', price: 145, costPrice: 120, sellingPrice: 145, stock: 50, category: 'Staples' },
  { id: '2', name: 'Fortune Oil 1L', price: 165, costPrice: 140, sellingPrice: 165, stock: 30, category: 'Oils' },
  { id: '3', name: 'Maggi Noodles', price: 14, costPrice: 11, sellingPrice: 14, stock: 100, category: 'Snacks' },
  { id: '4', name: 'Tata Salt', price: 28, costPrice: 22, sellingPrice: 28, stock: 45, category: 'Staples' },
  { id: '5', name: 'Sugar 1kg', price: 42, costPrice: 36, sellingPrice: 42, stock: 80, category: 'Staples' },
  { id: '6', name: 'Colgate Toothpaste', price: 95, costPrice: 80, sellingPrice: 95, gst: 18, stock: 25, category: 'Personal Care' },
  { id: '7', name: 'Lux Soap', price: 35, costPrice: 28, sellingPrice: 35, gst: 18, stock: 60, category: 'Personal Care' },
  { id: '8', name: 'Red Label Tea', price: 130, costPrice: 105, sellingPrice: 130, stock: 40, category: 'Beverages' },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1', name: 'Rahul Sharma', phone: '9876543210', balance: 450, lastTransactionDate: '2023-10-24', dues: [
      {
        id: 'd1', amount: 450, description: 'Monthly groceries', date: '2023-10-24', paid: false, items: [
          { name: 'Toor Dal 1kg', quantity: 2, price: 290 },
          { name: 'Sugar 1kg', quantity: 1, price: 42 },
          { name: 'Maggi Noodles', quantity: 8, price: 112 }
        ]
      }
    ]
  },
  {
    id: '2', name: 'Priya Singh', phone: '9123456789', balance: 1200, lastTransactionDate: '2023-10-22', dues: [
      { id: 'd2', amount: 1200, description: 'Festival shopping', date: '2023-10-22', paid: false }
    ]
  },
  { id: '3', name: 'Amit Patel', phone: '9988776655', balance: 0, lastTransactionDate: '2023-10-25', dues: [] },
];

export const MOCK_VENDORS: Vendor[] = [
  { id: '1', name: 'Metro Wholesale', category: 'General', balance: 5000, nextPaymentDate: '2023-11-01' },
  { id: '2', name: 'Rajesh Dairy', category: 'Milk/Dairy', balance: 1200, nextPaymentDate: '2023-10-28' },
];

export const MOCK_SALES_DATA: SalesData[] = [
  { day: 'Mon', amount: 4500 },
  { day: 'Tue', amount: 5200 },
  { day: 'Wed', amount: 3800 },
  { day: 'Thu', amount: 6100 },
  { day: 'Fri', amount: 5900 },
  { day: 'Sat', amount: 8400 },
  { day: 'Sun', amount: 7200 },
];