import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, CartItem, PaymentMethod, Customer, MerchantProfile, Transaction, Expense, Vendor } from '../types';
import { Search, Scan, Plus, Minus, Trash2, ArrowRight, X, User, Check, Smartphone, Camera, Clock, Receipt, IndianRupee } from 'lucide-react';
import { MOCK_CUSTOMERS } from '../constants';
import BarcodeScanner from './BarcodeScanner';

interface BillingProps {
    products: Product[];
    merchantProfile: MerchantProfile;
    onCompleteTransaction: (items: CartItem[], total: number, customerId: string | null, paymentMethod: PaymentMethod, cashGiven?: number) => void;
    onAddCustomer: (customer: Customer) => void;
    onAddExpense: (expense: Expense) => void;
    recentTransactions: Transaction[];
    vendors: Vendor[];
    onAddVendor: (vendor: Vendor) => void;
}

const Billing: React.FC<BillingProps> = ({ products, merchantProfile, onCompleteTransaction, onAddCustomer, onAddExpense, recentTransactions, vendors, onAddVendor }) => {
    const [activeTab, setActiveTab] = useState<'bill' | 'expense'>('bill');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCheckout, setShowCheckout] = useState(false);

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState('');

    // Checkout State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [customerMode, setCustomerMode] = useState<'existing' | 'new' | 'guest'>('existing');
    const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '' });
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [cashGiven, setCashGiven] = useState<string>('');

    // Expense Form State
    const [expenseForm, setExpenseForm] = useState({
        amount: '',
        category: 'Supplies',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Expense Vendor State
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [expenseVendorMode, setExpenseVendorMode] = useState<'none' | 'existing' | 'new'>('none');
    const [vendorSearchTerm, setVendorSearchTerm] = useState('');
    const [newVendorForm, setNewVendorForm] = useState({ name: '', phone: '' });

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, products]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1, discount: 0 }];
        });
        setSearchTerm('');
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity) - item.discount, 0);
    const cashGivenNum = parseFloat(cashGiven) || 0;
    const changeDue = cashGivenNum > totalAmount ? cashGivenNum - totalAmount : 0;

    const handleCheckout = () => {
        let customerId = selectedCustomer?.id || null;
        if (customerMode === 'new' && newCustomerForm.name && newCustomerForm.phone) {
            const newCust: Customer = {
                id: Date.now().toString(),
                name: newCustomerForm.name,
                phone: newCustomerForm.phone,
                balance: 0,
                lastTransactionDate: new Date().toISOString().split('T')[0]
            };
            onAddCustomer(newCust);
            customerId = newCust.id;
        } else if (customerMode === 'guest') {
            customerId = null;
        }

        onCompleteTransaction(cart, totalAmount, customerId, paymentMethod, cashGivenNum);
        setCart([]);
        setShowCheckout(false);
        setSelectedCustomer(null);
        setPaymentMethod(PaymentMethod.CASH);
        setCustomerMode('existing');
        setCashGiven('');
        setNewCustomerForm({ name: '', phone: '' });
    };

    const handleSaveExpense = () => {
        if (!expenseForm.amount || !expenseForm.description) return;

        let finalVendorId = undefined;
        let finalVendorName = undefined;

        if (expenseVendorMode === 'existing' && selectedVendor) {
            finalVendorId = selectedVendor.id;
            finalVendorName = selectedVendor.name;
        } else if (expenseVendorMode === 'new' && newVendorForm.name) {
            const newVendor: Vendor = {
                id: Date.now().toString(),
                name: newVendorForm.name,
                phone: newVendorForm.phone,
                balance: 0,
                bills: [],
                category: 'General',
                nextPaymentDate: new Date().toISOString().split('T')[0]
            };
            onAddVendor(newVendor);
            finalVendorId = newVendor.id;
            finalVendorName = newVendor.name;
        }

        const newExpense: Expense = {
            id: Date.now().toString(),
            amount: parseFloat(expenseForm.amount),
            category: expenseForm.category,
            description: expenseForm.description,
            date: expenseForm.date,
            vendorId: finalVendorId,
            vendorName: finalVendorName
        };
        onAddExpense(newExpense);
        setExpenseForm({
            amount: '',
            category: 'Supplies',
            description: '',
            date: new Date().toISOString().split('T')[0]
        });
        setSelectedVendor(null);
        setExpenseVendorMode('none');
        setNewVendorForm({ name: '', phone: '' });
    };

    const handleScanSuccess = (code: string) => {
        const found = products.find(p => p.barcode === code || p.id === code);
        if (found) {
            addToCart(found);
            setIsScanning(false);
            if (navigator.vibrate) navigator.vibrate(200);
            const msg = new SpeechSynthesisUtterance("Item Added");
            window.speechSynthesis.speak(msg);
        } else {
            setScanError("Product not found");
            alert("Product not found");
            setIsScanning(false);
        }
    };

    const simulateScan = () => {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        addToCart(randomProduct);
        setIsScanning(false);
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        `upi://pay?pa=${merchantProfile.upiId}&pn=${encodeURIComponent(merchantProfile.shopName)}&am=${totalAmount}&tn=BillPayment`
    )}`;

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">

            {/* Header with U-Shaped Valley */}
            <div className="relative bg-white pt-20 pb-4 shadow-sm z-20">

                {/* Tab Switcher */}
                <div className="flex justify-center mb-2 px-6">
                    <div className="flex gap-3 px-4 w-full pt-2">
                        <button
                            onClick={() => setActiveTab('bill')}
                            className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 border-2 ${activeTab === 'bill' ? 'bg-teal-600 text-white border-teal-600 shadow-teal-200 scale-105 z-10' : 'bg-white text-slate-400 border-slate-100'}`}
                        >
                            Bill Customer
                        </button>
                        <button
                            onClick={() => setActiveTab('expense')}
                            className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 border-2 ${activeTab === 'expense' ? 'bg-rose-600 text-white border-rose-600 shadow-rose-200 scale-105 z-10' : 'bg-white text-slate-400 border-slate-100'}`}
                        >
                            Record Expense
                        </button>
                    </div>
                </div>

                {activeTab === 'bill' ? (
                    <>
                        <p className="text-center text-xs text-slate-400 mb-2">Scan or search items</p>
                        {recentTransactions.length > 0 && (
                            <div className="flex justify-center mb-1 animate-fade-in">
                                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                                    <Check size={10} className="text-emerald-600" />
                                    <span className="text-[10px] font-bold text-emerald-700">
                                        Last: ₹{recentTransactions[0].amount} ({recentTransactions[0].customerName})
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-center text-xs text-red-400 mb-2">Track business spendings</p>
                )}


                {/* The Curve Protrusion */}
                <div className="absolute top-full left-0 w-full h-[60px] overflow-hidden pointer-events-none z-20">
                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full text-white drop-shadow-sm">
                        <path d="M 38 0 C 40 0 40 50 50 50 C 60 50 60 0 62 0 Z" fill="currentColor" />
                    </svg>
                </div>

                {/* The Scan/Add Button */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 z-30 -mt-2">
                    {activeTab === 'bill' ? (
                        <button
                            onClick={() => setIsScanning(true)}
                            className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-white shadow-xl shadow-slate-400 active:scale-90 transition-transform hover:bg-slate-900 ring-4 ring-white"
                        >
                            <Scan size={30} />
                        </button>
                    ) : (
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-200 ring-4 ring-white">
                            <Receipt size={30} />
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto mt-16 pb-[120px]">
                {activeTab === 'bill' ? (
                    <>
                        {/* Search Bar - Google Style */}
                        <div className="px-6 mb-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search items manually..."
                                    className="w-full bg-white pl-12 pr-4 py-3.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-slate-100 outline-none transition-all text-sm font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <div className="absolute top-full left-0 right-0 bg-white shadow-xl border-t z-50 max-h-60 overflow-y-auto rounded-xl mt-2">
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map(p => (
                                                <div key={p.id} onClick={() => addToCart(p)} className="p-3 border-b flex justify-between items-center active:bg-slate-50 cursor-pointer">
                                                    <div>
                                                        <p className="font-medium text-slate-800">{p.name}</p>
                                                        <p className="text-xs text-slate-500">Stock: {p.stock}</p>
                                                    </div>
                                                    <span className="font-bold text-emerald-600">₹{p.price}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-slate-500">No items found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cart List */}
                        <div className="px-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-60">
                                    <Scan size={48} className="mb-4" />
                                    <p>Cart is empty</p>
                                    <p className="text-xs">Tap scan button or search above</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start animate-slide-up">
                                        <div className="flex-1">
                                            <p className="font-semibold text-black">{item.name}</p>
                                            <p className="text-sm text-black">₹{item.price} x {item.quantity}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <p className="font-bold text-black">₹{item.price * item.quantity}</p>
                                            <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                                                <button onClick={() => item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm transition-colors">
                                                    {item.quantity === 1 ? <Trash2 size={16} className="text-red-500" /> : <Minus size={16} className="text-black" />}
                                                </button>
                                                <span className="text-sm font-bold w-4 text-center text-black">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm transition-colors">
                                                    <Plus size={16} className="text-black" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    /* Expense Form */
                    <div className="p-6 space-y-6 animate-fade-in">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Amount</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        autoFocus
                                        className="w-full bg-slate-50 pl-10 pr-4 py-3 rounded-xl border border-slate-200 font-bold text-xl outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
                                        placeholder="0"
                                        value={expenseForm.amount}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Vendor Selection for Expense */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Pay To (Vendor)</label>
                                <div className="flex p-1 bg-slate-100 rounded-xl mb-3">
                                    <button onClick={() => setExpenseVendorMode('none')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${expenseVendorMode === 'none' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>No Vendor</button>
                                    <button onClick={() => setExpenseVendorMode('existing')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${expenseVendorMode === 'existing' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Select Existing</button>
                                    <button onClick={() => setExpenseVendorMode('new')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${expenseVendorMode === 'new' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Add New</button>
                                </div>

                                {expenseVendorMode === 'existing' && (
                                    <div className="relative">
                                        {selectedVendor ? (
                                            <div className="flex justify-between items-center p-3 border rounded-xl border-emerald-200 bg-emerald-50">
                                                <span className="font-bold text-emerald-900 text-sm">{selectedVendor.name}</span>
                                                <button onClick={() => setSelectedVendor(null)} className="text-emerald-600 text-xs font-bold uppercase">Change</button>
                                            </div>
                                        ) : (
                                            <div className="border rounded-xl overflow-hidden bg-slate-50">
                                                <input
                                                    className="w-full p-3 bg-transparent text-sm outline-none"
                                                    placeholder="Search Vendor..."
                                                    value={vendorSearchTerm}
                                                    onChange={(e) => setVendorSearchTerm(e.target.value)}
                                                />
                                                {vendorSearchTerm && (
                                                    <div className="max-h-32 overflow-y-auto border-t border-slate-200 bg-white">
                                                        {vendors.filter(v => v.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())).map(v => (
                                                            <div key={v.id} onClick={() => { setSelectedVendor(v); setVendorSearchTerm(''); }} className="p-2 border-b last:border-0 hover:bg-slate-50 cursor-pointer text-sm">
                                                                {v.name}
                                                            </div>
                                                        ))}
                                                        {vendors.filter(v => v.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())).length === 0 && (
                                                            <div className="p-2 text-center text-xs text-slate-400">No vendor found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {expenseVendorMode === 'new' && (
                                    <div className="space-y-2">
                                        <input
                                            placeholder="Vendor Name"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-red-400"
                                            value={newVendorForm.name}
                                            onChange={e => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                                        />
                                        <input
                                            placeholder="Phone (Optional)"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-red-400"
                                            value={newVendorForm.phone}
                                            onChange={e => setNewVendorForm({ ...newVendorForm, phone: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                                <select
                                    className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:border-red-500"
                                    value={expenseForm.category}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                >
                                    <option>Supplies</option>
                                    <option>Rent</option>
                                    <option>Utilities</option>
                                    <option>Salaries</option>
                                    <option>Transportation</option>
                                    <option>Maintenance</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                                <textarea
                                    className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:border-red-500"
                                    placeholder="What is this expense for?"
                                    rows={3}
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:border-red-500"
                                    value={expenseForm.date}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleSaveExpense}
                                disabled={!expenseForm.amount || !expenseForm.description}
                                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-200 active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                            >
                                <Receipt size={20} /> Save Expense
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Sheet Total (Only for Bill Tab) */}
            {activeTab === 'bill' && cart.length > 0 && (
                <div className="absolute bottom-[110px] left-4 right-4 bg-white shadow-2xl z-50 rounded-2xl p-4 border border-slate-100 animate-slide-up">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-black text-sm font-bold">{cart.length} Items</span>
                        <div className="text-right">
                            <span className="text-xs text-black block font-bold uppercase">Total to Pay</span>
                            <span className="text-2xl font-bold text-black">₹{totalAmount}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-slate-300"
                    >
                        Checkout <ArrowRight size={20} className="text-white" />
                    </button>
                </div>
            )}

            {/* Checkout Modal - Full Screen for Mobile */}
            {showCheckout && (
                <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-up">
                    <div className="p-4 border-b flex items-center gap-4 bg-white shadow-sm shrink-0">
                        <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-slate-100 rounded-full">
                            <ArrowRight className="rotate-180 text-slate-600" size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800">Complete Payment</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">

                        {/* Total Display */}
                        <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Total Bill Amount</p>
                            <h1 className="text-4xl font-bold text-slate-900">₹{totalAmount}</h1>
                        </div>

                        {/* Customer Section */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                                <User size={16} /> Customer Details
                            </h3>

                            {/* Customer Tabs */}
                            <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                                {(['existing', 'new', 'guest'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setCustomerMode(mode)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${customerMode === mode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>

                            {customerMode === 'existing' && (
                                <div>
                                    {selectedCustomer ? (
                                        <div className="flex justify-between items-center p-3 border rounded-xl border-emerald-200 bg-emerald-50">
                                            <div>
                                                <p className="font-bold text-emerald-900">{selectedCustomer.name}</p>
                                                <p className="text-xs text-emerald-700">{selectedCustomer.phone}</p>
                                            </div>
                                            <button onClick={() => setSelectedCustomer(null)} className="text-emerald-600 text-xs font-bold uppercase">Change</button>
                                        </div>
                                    ) : (
                                        <div className="border rounded-xl overflow-hidden">
                                            <div className="p-2 border-b bg-slate-50">
                                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                                                    <Search size={14} className="text-slate-400" />
                                                    <input
                                                        className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400"
                                                        placeholder="Search Customer..."
                                                        value={customerSearchTerm}
                                                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto">
                                                {MOCK_CUSTOMERS
                                                    .filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || c.phone.includes(customerSearchTerm))
                                                    .map(c => (
                                                        <div key={c.id} onClick={() => setSelectedCustomer(c)} className="p-3 border-b last:border-0 hover:bg-slate-50 cursor-pointer text-sm">
                                                            <div className="font-bold text-slate-700">{c.name}</div>
                                                            <div className="text-slate-400 text-xs">{c.phone}</div>
                                                        </div>
                                                    ))}
                                                {MOCK_CUSTOMERS.filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || c.phone.includes(customerSearchTerm)).length === 0 && (
                                                    <div className="p-4 text-center text-xs text-slate-400 italic">No customer found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {customerMode === 'new' && (
                                <div className="space-y-3">
                                    <input
                                        placeholder="Customer Name"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-slate-400"
                                        value={newCustomerForm.name}
                                        onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                    />
                                    <input
                                        placeholder="Phone Number"
                                        type="tel"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-slate-400"
                                        value={newCustomerForm.phone}
                                        onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                    />
                                </div>
                            )}

                            {customerMode === 'guest' && (
                                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 text-center italic">
                                    proceeding as Guest (No record will be saved)
                                </div>
                            )}
                        </div>

                        {/* Payment Methods */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                                <Smartphone size={16} /> Payment Mode
                            </h3>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {[PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.CREDIT].map(method => {
                                    const isCredit = method === PaymentMethod.CREDIT;
                                    const isDisabled = isCredit && customerMode === 'guest';

                                    return (
                                        <button
                                            key={method}
                                            onClick={() => !isDisabled && setPaymentMethod(method)}
                                            disabled={isDisabled}
                                            className={`p-3 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-1 transition-all ${paymentMethod === method
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : isDisabled
                                                    ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed opacity-60'
                                                    : 'border-slate-100 text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            {method === PaymentMethod.CASH && "💵"}
                                            {method === PaymentMethod.UPI && "📱"}
                                            {method === PaymentMethod.CREDIT && "📒"}
                                            <span>{isCredit ? 'Udhaar' : method}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {customerMode === 'guest' && (
                                <p className="text-[10px] text-center text-slate-400 -mt-2 mb-4">
                                    * Select a customer to give Udhaar (Credit)
                                </p>
                            )}

                            {/* Cash Payment Logic with Quick Buttons */}
                            {paymentMethod === PaymentMethod.CASH && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 animate-fade-in">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Cash Received</label>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            placeholder="0"
                                            className="w-32 p-3 rounded-lg border border-slate-700 bg-slate-900 text-right font-bold text-xl text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-900 transition-all"
                                            value={cashGiven}
                                            onChange={e => setCashGiven(e.target.value)}
                                        />
                                    </div>

                                    {/* Quick Cash Buttons */}
                                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                        <button onClick={() => setCashGiven(totalAmount.toString())} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-600 shadow-sm active:scale-95 whitespace-nowrap">
                                            Exact ₹{totalAmount}
                                        </button>
                                        <button onClick={() => setCashGiven((Math.ceil(totalAmount / 100) * 100).toString())} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm active:scale-95 whitespace-nowrap">
                                            Round ₹{Math.ceil(totalAmount / 100) * 100}
                                        </button>
                                        <button onClick={() => setCashGiven((Math.ceil(totalAmount / 500) * 500).toString())} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm active:scale-95 whitespace-nowrap">
                                            Round ₹{Math.ceil(totalAmount / 500) * 500}
                                        </button>
                                    </div>

                                    {cashGivenNum > 0 && (
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Change to Return</label>
                                            <span className={`text-xl font-bold ${changeDue >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                ₹{changeDue >= 0 ? changeDue : 'Insufficient'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(paymentMethod === PaymentMethod.UPI) && (
                                <div className="bg-white border border-slate-200 rounded-xl p-4 animate-fade-in">
                                    <p className="text-xs text-center text-slate-500 mb-3 font-bold uppercase">Ask customer to scan this QR</p>
                                    <div className="flex justify-center mb-4">
                                        {merchantProfile.upiId ? (
                                            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                                <img src={qrUrl} alt="Payment QR" className="w-40 h-40 mix-blend-multiply" />
                                            </div>
                                        ) : (
                                            <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-xs text-center p-2 rounded-xl text-slate-400">
                                                Add UPI ID in Profile settings to generate QR
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-center text-slate-400 mb-2">Or select specific app</p>
                                    <div className="flex gap-2">
                                        {[PaymentMethod.G_PAY, PaymentMethod.PHONE_PE, PaymentMethod.PAYTM].map(app => (
                                            <button
                                                key={app}
                                                onClick={() => setPaymentMethod(app)}
                                                className={`flex-1 py-2 text-[10px] font-bold border rounded-lg hover:bg-slate-50 ${paymentMethod === app ? 'bg-slate-100 border-slate-400' : 'border-slate-200'}`}
                                            >
                                                {app}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100 shrink-0 safe-area-bottom">
                        {(() => {
                            const isCashInvalid = paymentMethod === PaymentMethod.CASH && cashGivenNum < totalAmount;
                            const isGuestCreditInvalid = paymentMethod === PaymentMethod.CREDIT && customerMode === 'guest';
                            const isCustomerInvalid = paymentMethod === PaymentMethod.CREDIT && customerMode === 'existing' && !selectedCustomer;
                            const isNewCustomerInvalid = paymentMethod === PaymentMethod.CREDIT && customerMode === 'new' && (!newCustomerForm.name || !newCustomerForm.phone);

                            const isDisabled = isCashInvalid || isGuestCreditInvalid || isCustomerInvalid || isNewCustomerInvalid;

                            let buttonText = "Confirm Payment";
                            if (isCashInvalid) buttonText = `Enter ₹${totalAmount - cashGivenNum} More`;
                            if (isGuestCreditInvalid) buttonText = "Select Customer for Udhaar";
                            if (isCustomerInvalid) buttonText = "Select a Customer";
                            if (isNewCustomerInvalid) buttonText = "Enter Customer Details";

                            return (
                                <button
                                    onClick={handleCheckout}
                                    disabled={isDisabled}
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2
                                        ${isDisabled
                                            ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                                            : 'bg-emerald-600 text-white shadow-emerald-200'
                                        }`}
                                >
                                    {isDisabled && <X size={20} />}
                                    {buttonText}
                                </button>
                            );
                        })()}
                    </div>
                </div>
            )
            }

            {/* Camera Modal using shared BarcodeScanner */}
            {isScanning && (
                <BarcodeScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={() => setIsScanning(false)}
                />
            )}
        </div >
    );
};


export default Billing;
