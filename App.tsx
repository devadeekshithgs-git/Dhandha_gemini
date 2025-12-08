import React, { useState, useEffect, useRef } from 'react';
import { Home, Users, ScanBarcode, Package, Handshake, Settings, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

import Login from './components/Login';
import Onboarding from './components/Onboarding';

import Dashboard from './components/Dashboard';
import Billing from './components/Billing';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import Vendors from './components/Vendors';
import Profile from './components/Profile';

import { Product, CartItem, Customer, Vendor, PaymentMethod, MerchantProfile, CustomerDue, Transaction, Expense } from './types';
import { MOCK_SALES_DATA } from './constants';

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
  const [showTour, setShowTour] = useState(false);

  // Application Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [salesData, setSalesData] = useState(MOCK_SALES_DATA); // Fallback to mock for now
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  // App Data
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);

  const [cashInHand, setCashInHand] = useState<number>(0);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
        setMerchantProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (data) {
        setMerchantProfile({
          shopName: data.business_name || '',
          ownerName: data.owner_name || '',
          upiId: data.upi_id || '',
          phone: session?.user.phone || session?.user.email || '',
          address: ''
        });
        // Load App Data only after profile is confirmed
        fetchData();
      } else {
        setMerchantProfile(null);
      }
    } catch (e) {
      console.error("Profile Fetch Error", e);
    } finally {
      setAuthLoading(false);
      setProfileLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // 1. Fetch Products
      const { data: prodData } = await supabase.from('products').select('*');
      if (prodData) setProducts(prodData.map((p: any) => ({
        ...p,
        costPrice: p.cost_price,
        sellingPrice: p.selling_price
      })));

      // 2. Fetch Customers and Dues
      const { data: custData } = await supabase.from('customers').select('*, dues:customer_dues(*)');
      if (custData) setCustomers(custData.map((c: any) => ({
        ...c,
        lastTransactionDate: c.last_transaction_date,
        dues: c.dues || []
      })));

      // 3. Fetch Vendors
      const { data: vendData } = await supabase.from('vendors').select('*');
      if (vendData) setVendors(vendData.map((v: any) => ({
        ...v,
        nextPaymentDate: v.next_payment_date
      })));

      // 4. Fetch Transactions
      const { data: transData } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (transData) setTransactions(transData.map((t: any) => ({
        ...t,
        customerId: t.customer_id,
        customerName: t.customer_name,
        paymentMethod: t.payment_method,
        itemsCount: t.items_count,
        billId: t.bill_id
      })));

      // 5. Fetch Expenses
      const { data: expData } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (expData) setExpenses(expData);

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Computed Totals
  const totalReceivables = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
  const totalPayables = vendors.reduce((acc, v) => acc + v.balance, 0);

  // Handlers
  const handleProductUpdate = async (updatedProduct: Product) => {
    const { error } = await supabase.from('products').update({
      name: updatedProduct.name,
      cost_price: updatedProduct.costPrice,
      selling_price: updatedProduct.sellingPrice,
      stock: updatedProduct.stock,
      category: updatedProduct.category,
      barcode: updatedProduct.barcode,
      image: updatedProduct.image,
      gst: updatedProduct.gst
    }).eq('id', updatedProduct.id);

    if (!error) {
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    } else {
      console.error('Update Product Error:', error);
      alert('Failed to update product: ' + error.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        console.error('Delete Product Error:', error);
        alert('Failed to delete product: ' + error.message);
      }
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    const dbProduct = {
      id: newProduct.id,
      name: newProduct.name,
      cost_price: newProduct.costPrice || 0,
      selling_price: newProduct.sellingPrice || 0,
      price: newProduct.sellingPrice || 0,
      stock: newProduct.stock || 0,
      category: newProduct.category,
      gst: newProduct.gst,
      barcode: newProduct.barcode,
      image: newProduct.image
    };

    const { error } = await supabase.from('products').insert(dbProduct);
    if (!error) {
      setProducts(prev => [...prev, newProduct]);
    } else {
      console.error('Add Product Error:', error);
      alert('Failed to add product: ' + error.message);
    }
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    const dbCustomer = {
      id: newCustomer.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      balance: newCustomer.balance,
      last_transaction_date: newCustomer.lastTransactionDate
    };
    const { error } = await supabase.from('customers').insert(dbCustomer);
    if (!error) {
      setCustomers(prev => [...prev, newCustomer]);
    } else {
      console.error('Add Customer Error:', error);
      alert('Failed to add customer: ' + error.message);
    }
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    const { error } = await supabase.from('customers').update({
      name: updatedCustomer.name,
      phone: updatedCustomer.phone,
      balance: updatedCustomer.balance,
      last_transaction_date: updatedCustomer.lastTransactionDate
    }).eq('id', updatedCustomer.id);

    if (!error) {
      setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    } else {
      console.error('Update Customer Error:', error);
      alert('Failed to update customer: ' + error.message);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (!error) {
        setCustomers(prev => prev.filter(c => c.id !== id));
      } else {
        console.error('Delete Customer Error:', error);
        alert('Failed to delete customer: ' + error.message);
      }
    }
  };

  const handleAddVendor = async (newVendor: Vendor) => {
    const dbVendor = {
      id: newVendor.id,
      name: newVendor.name,
      category: newVendor.category,
      balance: newVendor.balance,
      next_payment_date: newVendor.nextPaymentDate
    };
    const { error } = await supabase.from('vendors').insert(dbVendor);
    if (!error) {
      setVendors(prev => [...prev, newVendor]);
    } else {
      console.error('Add Vendor Error:', error);
      alert('Failed to add vendor: ' + error.message);
    }
  };

  const handleUpdateVendor = async (updatedVendor: Vendor) => {
    const { error } = await supabase.from('vendors').update({
      name: updatedVendor.name,
      category: updatedVendor.category,
      balance: updatedVendor.balance,
      next_payment_date: updatedVendor.nextPaymentDate
    }).eq('id', updatedVendor.id);

    if (!error) {
      setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
    } else {
      console.error('Update Vendor Error:', error);
      alert('Failed to update vendor: ' + error.message);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      const { error } = await supabase.from('vendors').delete().eq('id', id);
      if (!error) {
        setVendors(prev => prev.filter(v => v.id !== id));
      } else {
        console.error('Delete Vendor Error:', error);
        alert('Failed to delete vendor: ' + error.message);
      }
    }
  };

  const handleTransactionComplete = async (items: CartItem[], total: number, customerId: string | null, paymentMethod: PaymentMethod, cashGiven?: number) => {
    try {
      // 1. Update Stock Locally
      const itemsMap = new Map(items.map(i => [i.id, i.quantity]));
      setProducts(prev => prev.map(p => {
        const qty = itemsMap.get(p.id);
        return qty ? { ...p, stock: p.stock - qty } : p;
      }));

      // Update Stock in DB
      for (const item of items) {
        const current = products.find(p => p.id === item.id);
        if (current) {
          const { error } = await supabase.from('products').update({ stock: current.stock - item.quantity }).eq('id', item.id);
          if (error) throw new Error(`Failed to update stock for ${item.name}: ${error.message}`);
        }
      }

      // 2. Resolve Customer Name
      let customerName = 'Guest';
      let currentCustomer = null;
      if (customerId) {
        currentCustomer = customers.find(c => c.id === customerId);
        if (currentCustomer) customerName = currentCustomer.name;
      }

      const billId = Date.now().toString().slice(-4);

      // 3. Register Transaction in DB
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        customerId,
        customerName,
        amount: total,
        date: new Date().toLocaleString(),
        paymentMethod,
        itemsCount: items.length,
        billId,
        items: items // Save items for historical cost calculation
      };

      const { error: transError } = await supabase.from('transactions').insert({
        id: newTransaction.id,
        customer_id: newTransaction.customerId,
        customer_name: newTransaction.customerName,
        amount: newTransaction.amount,
        date: newTransaction.date,
        payment_method: newTransaction.paymentMethod,
        items_count: newTransaction.itemsCount,
        bill_id: newTransaction.billId,
        items: items // Store full item details including costPrice at time of sale
      });

      if (transError) throw new Error('Failed to record transaction: ' + transError.message);

      setTransactions(prev => [newTransaction, ...prev]);

      // 4. Handle Credit DB Update
      if (paymentMethod === PaymentMethod.CREDIT && customerId && currentCustomer) {
        // Create due
        const newDue = {
          id: Date.now().toString(),
          customer_id: customerId,
          amount: total,
          description: `Bill #${billId} • ${items.length} item(s)`,
          date: new Date().toISOString().split('T')[0],
          paid: false,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price * item.quantity
          }))
        };

        const { error: dueError } = await supabase.from('customer_dues').insert(newDue);
        if (dueError) throw new Error('Failed to record customer due: ' + dueError.message);

        const newBalance = currentCustomer.balance + total;
        const { error: balError } = await supabase.from('customers').update({
          balance: newBalance,
          last_transaction_date: new Date().toISOString().split('T')[0]
        }).eq('id', customerId);

        if (balError) throw new Error('Failed to update customer balance: ' + balError.message);

        // Refresh customers to get updated dues
        const { data: custData } = await supabase.from('customers').select('*, dues:customer_dues(*)').eq('id', customerId).single();
        if (custData) {
          setCustomers(prev => prev.map(c => c.id === customerId ? {
            ...c,
            balance: custData.balance,
            lastTransactionDate: custData.last_transaction_date,
            dues: custData.dues || []
          } : c));
        }
      }

      // Update Cash In Hand
      if (paymentMethod === PaymentMethod.CASH) {
        setCashInHand(prev => prev + total);
      }
    } catch (error: any) {
      console.error('Transaction Error:', error);
      alert('Transaction failed: ' + error.message);
    }
  };

  const handleAddExpense = async (newExpense: Expense) => {
    const dbExpense = {
      id: newExpense.id,
      amount: newExpense.amount,
      category: newExpense.category,
      description: newExpense.description,
      date: newExpense.date,
      vendor_id: newExpense.vendorId,
      vendor_name: newExpense.vendorName
    };

    const { error } = await supabase.from('expenses').insert(dbExpense);
    if (!error) {
      setExpenses(prev => [...prev, newExpense]);
      alert('Expense recorded successfully!');
    } else {
      console.error('Add Expense Error:', error);
      alert('Failed to add expense: ' + error.message);
    }
  };

  const handleProfileSave = (updatedProfile: MerchantProfile) => {
    setMerchantProfile(updatedProfile);
    localStorage.setItem('merchantProfile', JSON.stringify(updatedProfile));
  };

  if (showProfile) {
    return <Profile profile={merchantProfile} onSave={handleProfileSave} onBack={() => setShowProfile(false)} onShowTour={() => setShowTour(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case Tab.HOME:
        return <Dashboard receivables={totalReceivables} payables={totalPayables} cashInHand={cashInHand} profile={merchantProfile} onOpenProfile={() => setShowProfile(true)} recentTransactions={transactions} expenses={expenses} />;
      case Tab.BILLING:
        return <Billing products={products} merchantProfile={merchantProfile} onCompleteTransaction={handleTransactionComplete} onAddCustomer={handleAddCustomer} recentTransactions={transactions} onAddExpense={handleAddExpense} vendors={vendors} onAddVendor={handleAddVendor} />;
      case Tab.INVENTORY:
        return <Inventory products={products} setProducts={setProducts} onUpdateProduct={handleProductUpdate} onDeleteProduct={handleDeleteProduct} onAddProduct={handleAddProduct} />;
      case Tab.CUSTOMERS:
        return <Customers customers={customers} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} onDeleteCustomer={handleDeleteCustomer} />;
      case Tab.VENDORS:
        return <Vendors vendors={vendors} onAddVendor={handleAddVendor} onUpdateVendor={handleUpdateVendor} onDeleteVendor={handleDeleteVendor} expenses={expenses} />;
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

  // Dynamic Styles based on Active Tab
  const getTabStyles = (tab: Tab) => {
    switch (tab) {
      case Tab.BILLING:
        return { bg: 'bg-slate-800', shadow: 'shadow-slate-400', text: 'text-slate-800', dot: 'bg-slate-800' };
      case Tab.INVENTORY:
        return { bg: 'bg-blue-600', shadow: 'shadow-blue-200', text: 'text-blue-600', dot: 'bg-blue-600' };
      case Tab.VENDORS:
        return { bg: 'bg-orange-500', shadow: 'shadow-orange-200', text: 'text-orange-600', dot: 'bg-orange-500' };
      case Tab.CUSTOMERS:
        return { bg: 'bg-emerald-600', shadow: 'shadow-emerald-200', text: 'text-emerald-600', dot: 'bg-emerald-600' };
      case Tab.HOME:
      default:
        return { bg: 'bg-yellow-500', shadow: 'shadow-yellow-200', text: 'text-yellow-600', dot: 'bg-yellow-500' };
    }
  };

  const activeStyle = getTabStyles(activeTab);

  // Swipe Logic
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = navItems.findIndex(item => item.id === activeTab);
      let newIndex = currentIndex;

      if (isLeftSwipe && currentIndex < navItems.length - 1) {
        newIndex = currentIndex + 1; // Go to Next Tab
      } else if (isRightSwipe && currentIndex > 0) {
        newIndex = currentIndex - 1; // Go to Prev Tab
      }

      if (newIndex !== currentIndex) {
        setActiveTab(navItems[newIndex].id);
      }
    }
  };

  // Defines the curve shape for the valley
  // Render Login if no session
  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (showTour) {
    return <Onboarding userId={session.user.id} mode="tour_only" onComplete={() => setShowTour(false)} />;
  }

  // Render Onboarding if session but no profile
  if (!merchantProfile && !profileLoading) {
    return <Onboarding userId={session.user.id} onComplete={() => fetchUserProfile(session.user.id)} />;
  }

  // Main App
  const valleyPath = "M0,0 C 30 0 30 55 50 55 C 70 55 70 0 100 0";

  return (
    <div
      className="h-[100dvh] w-full max-w-md mx-auto bg-slate-50 flex flex-col overflow-hidden relative shadow-2xl"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Global Settings Button */}
      <button
        onClick={() => setShowProfile(true)}
        className="absolute top-8 right-6 z-50 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
      >
        <Settings size={20} />
      </button>

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
            <div className={`absolute -top-[6px] left-1/2 -translate-x-1/2 w-[54px] h-[54px] rounded-full flex items-center justify-center shadow-lg text-white transform transition-all duration-300 z-20 border-[3px] border-white/10 ${activeStyle.bg} ${activeStyle.shadow}`}>
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

                <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? `translate-y-0 ${activeStyle.text}` : 'text-slate-400 mt-6 group-hover:text-slate-500'}`}>
                  {item.label}
                </span>

                <span className={`absolute bottom-3 w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? `opacity-100 scale-100 ${activeStyle.dot}` : 'opacity-0 scale-0 bg-slate-400'}`}></span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;