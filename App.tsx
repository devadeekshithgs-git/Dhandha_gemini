import React, { useState } from 'react';
import { Home, Users, ScanBarcode, Package, Handshake } from 'lucide-react';

import Dashboard from './components/Dashboard';
import Billing from './components/Billing';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import Vendors from './components/Vendors';
import Profile from './components/Profile';

import { Product, CartItem, Customer, Vendor, PaymentMethod, MerchantProfile, CustomerDue, Transaction } from './types';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_VENDORS, MOCK_SALES_DATA } from './constants';

enum Tab {
  HOME = 'home',
  CUSTOMERS = 'customers',
  BILLING = 'billing',
  INVENTORY = 'inventory',
  VENDORS = 'vendors',
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [showProfile, setShowProfile] = useState(false);

  // Application Data State
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);
  const [salesData, setSalesData] = useState(MOCK_SALES_DATA);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile>({
    shopName: 'Shree Ganesh Kirana',
    ownerName: 'Rajesh Gupta',
    upiId: '', // User needs to set this
    phone: '9876543210',
    address: '123, Market Road, Mumbai'
  });

  const [cashInHand, setCashInHand] = useState<number>(0);

  // Computed Totals
  const totalReceivables = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
  const totalPayables = vendors.reduce((acc, v) => acc + v.balance, 0);

  // Handlers
  const handleProductUpdate = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddVendor = (newVendor: Vendor) => {
    setVendors(prev => [...prev, newVendor]);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
  };

  const handleDeleteVendor = (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      setVendors(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleTransactionComplete = (items: CartItem[], total: number, customerId: string | null, paymentMethod: PaymentMethod, cashGiven?: number) => {
    // 1. Update Stock
    const itemsMap = new Map(items.map(i => [i.id, i.quantity]));
    setProducts(prev => prev.map(p => {
      const qty = itemsMap.get(p.id);
      return qty ? { ...p, stock: p.stock - qty } : p;
    }));

    // 2. Resolve Customer Name
    let customerName = 'Guest';
    let currentCustomer = null;
    if (customerId) {
      currentCustomer = customers.find(c => c.id === customerId);
      if (currentCustomer) customerName = currentCustomer.name;
    }

    const billId = Date.now().toString().slice(-4);

    // 3. Register Recent Transaction
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      customerId,
      customerName,
      amount: total,
      date: new Date().toLocaleString(),
      paymentMethod,
      itemsCount: items.length,
      billId
    };
    setTransactions(prev => [newTransaction, ...prev]);

    // 4. Handle Credit
    if (paymentMethod === PaymentMethod.CREDIT && customerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === customerId) {
          // Create new due entry with items purchased
          const newDue: CustomerDue = {
            id: Date.now().toString(),
            amount: total,
            description: `Bill #${billId} • ${items.length} item(s)`,
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price * item.quantity
            })),
            date: new Date().toISOString().split('T')[0],
            paid: false
          };

          return {
            ...c,
            balance: c.balance + total,
            lastTransactionDate: new Date().toISOString().split('T')[0],
            dues: [...(c.dues || []), newDue]
          };
        }
        return c;
      }));
    }

    // Mock Sales Data Update
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    setSalesData(prev => prev.map(d =>
      d.day === today ? { ...d, amount: d.amount + total } : d
    ));

    // Update Cash In Hand
    if (paymentMethod === PaymentMethod.CASH) {
      setCashInHand(prev => prev + total);
    }

    // alert(`Transaction Successful! ₹${total} received via ${paymentMethod}.`);
  };

  const handleProfileSave = (updatedProfile: MerchantProfile) => {
    setMerchantProfile(updatedProfile);
  };

  if (showProfile) {
    return <Profile profile={merchantProfile} onSave={handleProfileSave} onBack={() => setShowProfile(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case Tab.HOME:
        return <Dashboard salesData={salesData} receivables={totalReceivables} payables={totalPayables} cashInHand={cashInHand} profile={merchantProfile} onOpenProfile={() => setShowProfile(true)} recentTransactions={transactions} />;
      case Tab.BILLING:
        return <Billing products={products} merchantProfile={merchantProfile} onCompleteTransaction={handleTransactionComplete} onAddCustomer={handleAddCustomer} recentTransactions={transactions} />;
      case Tab.INVENTORY:
        return <Inventory products={products} onUpdateProduct={handleProductUpdate} onDeleteProduct={handleDeleteProduct} onAddProduct={handleAddProduct} />;
      case Tab.CUSTOMERS:
        return <Customers customers={customers} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} onDeleteCustomer={handleDeleteCustomer} />;
      case Tab.VENDORS:
        return <Vendors vendors={vendors} onAddVendor={handleAddVendor} onUpdateVendor={handleUpdateVendor} onDeleteVendor={handleDeleteVendor} />;
      default:
        return <Dashboard salesData={salesData} receivables={totalReceivables} payables={totalPayables} cashInHand={cashInHand} profile={merchantProfile} onOpenProfile={() => setShowProfile(true)} />;
    }
  };

  // Navigation Items Config
  const navItems = [
    { id: Tab.HOME, icon: Home, label: 'Home' },
    { id: Tab.CUSTOMERS, icon: Users, label: 'Customers' },
    { id: Tab.BILLING, icon: ScanBarcode, label: 'Bill' },
    { id: Tab.INVENTORY, icon: Package, label: 'Items' },
    { id: Tab.VENDORS, icon: Handshake, label: 'Vendors' },
  ];

  const activeIndex = navItems.findIndex(item => item.id === activeTab);
  const ActiveIcon = navItems[activeIndex].icon;

  // Defines the curve shape for the valley
  const valleyPath = "M0,0 C 30 0 30 55 50 55 C 70 55 70 0 100 0";

  return (
    <div className="h-[100dvh] w-full max-w-md mx-auto bg-slate-50 flex flex-col overflow-hidden relative shadow-2xl">
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Fluid Bottom Navigation */}
      <nav className="h-[88px] bg-white absolute bottom-0 w-full z-40 rounded-t-[30px] shadow-[0_-5px_30px_rgba(0,0,0,0.03)]">
        <div className="relative w-full h-full flex items-stretch">

          {/* The Moving 'Valley' Active Indicator */}
          <div
            className="absolute top-0 left-0 h-full w-[20%] transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] z-10 pointer-events-none"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          >
            {/* SVG curve matching the background color */}
            <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[190%] h-[60px] pointer-events-none">
              <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full">
                <path d={valleyPath} fill="none" stroke="black" strokeWidth="4" className="opacity-[0.03] blur-[2px]" />
                <path d={`${valleyPath} Z`} className="fill-slate-50" />
                <path d={valleyPath} fill="none" stroke="black" strokeWidth="0.5" className="opacity-10" />
              </svg>
            </div>

            {/* The Floating Circle Button */}
            <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-[54px] h-[54px] bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 text-white transform transition-all duration-300 z-20 border-[3px] border-white/10">
              <ActiveIcon size={26} />
            </div>
          </div>

          {/* Navigation Buttons */}
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex-1 h-full flex flex-col items-center justify-end pb-5 relative z-20 focus:outline-none touch-manipulation group"
              >
                <span className={`absolute top-5 transition-all duration-300 ${isActive ? 'opacity-0 scale-50 -translate-y-4' : 'opacity-100 text-slate-400 scale-100'}`}>
                  <item.icon size={26} strokeWidth={2} className="group-hover:text-slate-600 transition-colors" />
                </span>

                <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'translate-y-0 text-emerald-600' : 'text-slate-400 mt-6 group-hover:text-slate-500'}`}>
                  {item.label}
                </span>

                <span className={`absolute bottom-3 w-1.5 h-1.5 bg-emerald-500 rounded-full transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}></span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;