import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, CartItem, PaymentMethod, Customer, MerchantProfile } from '../types';
import { Search, Scan, Plus, Minus, Trash2, ArrowRight, X, User, Check, Smartphone, Camera } from 'lucide-react';
import { MOCK_CUSTOMERS } from '../constants';

interface BillingProps {
    products: Product[];
    merchantProfile: MerchantProfile;
    onCompleteTransaction: (items: CartItem[], total: number, customerId: string | null, paymentMethod: PaymentMethod, cashGiven?: number) => void;
    onAddCustomer: (customer: Customer) => void;
}

const Billing: React.FC<BillingProps> = ({ products, merchantProfile, onCompleteTransaction, onAddCustomer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCheckout, setShowCheckout] = useState(false);

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [scanError, setScanError] = useState('');

    // Checkout State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [customerMode, setCustomerMode] = useState<'existing' | 'new' | 'guest'>('existing');
    const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '' });
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');


    // Cash Payment State
    const [cashGiven, setCashGiven] = useState<string>('');

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
        // Beep sound
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

    // Cash Calculation
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

    // Scanning Logic
    useEffect(() => {
        let interval: number;
        if (isScanning && videoRef.current) {
            const startCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' }
                    });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();

                        // Check for BarcodeDetector support
                        if ('BarcodeDetector' in window) {
                            // @ts-ignore
                            const barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'qr_code'] });
                            interval = window.setInterval(async () => {
                                if (videoRef.current) {
                                    try {
                                        const barcodes = await barcodeDetector.detect(videoRef.current);
                                        if (barcodes.length > 0) {
                                            const code = barcodes[0].rawValue;
                                            // Simulate product lookup
                                            const found = products.find(p => p.id === code || p.barcode === code);
                                            // For demo, if not found, just pick a random product to simulate success
                                            const demoProduct = found || products[Math.floor(Math.random() * products.length)];

                                            addToCart(demoProduct);
                                            setIsScanning(false);
                                        }
                                    } catch (err) {
                                        // console.error(err);
                                    }
                                }
                            }, 500);
                        } else {
                            setScanError("Barcode detection not supported on this device. Using simulation.");
                        }
                    }
                } catch (err) {
                    setScanError("Camera access denied or not available.");
                    console.error(err);
                }
            };
            startCamera();
        } else {
            // Stop stream
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
        return () => clearInterval(interval);
    }, [isScanning, products]);

    const simulateScan = () => {
        // Pick random product
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        addToCart(randomProduct);
        setIsScanning(false);
    };

    // QR Code Generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        `upi://pay?pa=${merchantProfile.upiId}&pn=${encodeURIComponent(merchantProfile.shopName)}&am=${totalAmount}&tn=BillPayment`
    )}`;

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">

            {/* Header with U-Shaped Valley */}
            <div className="relative bg-white pt-8 pb-4 shadow-sm z-20">
                <h1 className="text-center text-lg font-bold text-slate-700 tracking-tight">New Bill</h1>
                <p className="text-center text-xs text-slate-400 mb-2">Scan or search items</p>

                {/* The Curve Protrusion */}
                <div className="absolute top-full left-0 w-full h-[60px] overflow-hidden pointer-events-none z-20">
                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full text-white drop-shadow-sm">
                        <path d="M 38 0 C 40 0 40 50 50 50 C 60 50 60 0 62 0 Z" fill="currentColor" />
                    </svg>
                </div>

                {/* The Scan Button */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 z-30 -mt-2">
                    <button
                        onClick={() => setIsScanning(true)}
                        className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-white shadow-xl shadow-slate-400 active:scale-90 transition-transform hover:bg-slate-900 ring-4 ring-white"
                    >
                        <Scan size={30} />
                    </button>
                </div>
            </div>

            {/* Search Bar - Google Style */}
            <div className="mt-16 px-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search items manually..."
                        className="w-full bg-white pl-12 pr-4 py-3.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-slate-100 outline-none transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {/* Search Results Dropdown */}
                    {searchTerm && (
                        <div className="absolute top-full left-0 right-0 bg-white shadow-xl border-t z-50 max-h-60 overflow-y-auto rounded-xl mt-2">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(p => (
                                    <div key={p.id} onClick={() => addToCart(p)} className="p-3 border-b flex justify-between items-center active:bg-slate-50 cursor-pointer">
                                        <div>
                                            <p className="font-medium text-slate-800">{p.name}</p>
                                            <p className="text-xs text-slate-500">Stock: {p.stock}</p>
                                        </div>
                                        <span className="font-bold text-emerald-600">â‚¹{p.price}</span>
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
            <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-3 pb-[200px]">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                        <Scan size={48} className="mb-4" />
                        <p>Cart is empty</p>
                        <p className="text-xs">Tap scan button or search above</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start">
                            <div className="flex-1">
                                <p className="font-semibold text-black">{item.name}</p>
                                <p className="text-sm text-black">â‚¹{item.price} x {item.quantity}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <p className="font-bold text-black">â‚¹{item.price * item.quantity}</p>
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

            {/* Bottom Sheet Total */}
            {cart.length > 0 && (
                <div className="absolute bottom-[110px] left-4 right-4 bg-white shadow-2xl z-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-black text-sm font-bold">{cart.length} Items</span>
                        <div className="text-right">
                            <span className="text-xs text-black block font-bold uppercase">Total to Pay</span>
                            <span className="text-2xl font-bold text-black">â‚¹{totalAmount}</span>
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

            {/* Checkout Modal */}
            {showCheckout && (

                <div className="absolute inset-x-0 top-0 bottom-[90px] bg-white z-30 flex flex-col animate-slide-up overflow-hidden rounded-b-[30px] shadow-xl border-b border-slate-100">
                    <div className="p-4 border-b flex items-center gap-4 bg-white sticky top-0">
                        <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-slate-100 rounded-full">
                            <ArrowRight className="rotate-180 text-slate-600" size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800">Complete Payment</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">

                        {/* Total Display */}
                        <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Total Bill Amount</p>
                            <h1 className="text-4xl font-bold text-slate-900">â‚¹{totalAmount}</h1>
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
                                {[PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.CREDIT].map(method => (
                                    <button
                                        key={method}
                                        onClick={() => setPaymentMethod(method)}
                                        className={`p-3 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-1 transition-all ${paymentMethod === method ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500'}`}
                                    >
                                        {method === PaymentMethod.CASH && "ðŸ’µ"}
                                        {method === PaymentMethod.UPI && "ðŸ“±"}
                                        {method === PaymentMethod.CREDIT && "ðŸ“’"}
                                        <span>{method === PaymentMethod.CREDIT ? 'Credit' : method}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Specific Payment Logic */}
                            {paymentMethod === PaymentMethod.CASH && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Cash Received</label>
                                        <input
                                            type="number"
                                            autoFocus
                                            placeholder="Amount"
                                            className="w-32 p-2 rounded-lg border border-slate-300 text-right font-bold text-slate-800 outline-none focus:border-emerald-500"
                                            value={cashGiven}
                                            onChange={e => setCashGiven(e.target.value)}
                                        />
                                    </div>
                                    {cashGivenNum > 0 && (
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Change to Return</label>
                                            <span className={`text-lg font-bold ${changeDue >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                â‚¹{changeDue >= 0 ? changeDue : 'Insufficient'}
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

                    <div className="p-4 border-t bg-white sticky bottom-0">
                        <button
                            onClick={handleCheckout}
                            disabled={paymentMethod === PaymentMethod.CASH && cashGivenNum < totalAmount}
                            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-base shadow-lg shadow-emerald-200 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            )
            }

            {/* Camera Modal */}
            {
                isScanning && (
                    <div className="absolute inset-0 bg-black z-50 flex flex-col">
                        <div className="relative flex-1 bg-black">
                            <video ref={videoRef} className="w-full h-full object-cover opacity-80" playsInline muted autoPlay></video>

                            {/* Scanner Overlay UI */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-64 h-64 border-2 border-emerald-500 rounded-3xl relative">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1 rounded-tl-lg"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1 rounded-tr-lg"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1 rounded-bl-lg"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1 rounded-br-lg"></div>

                                    <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                                </div>
                                <p className="text-white mt-8 font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">Point at a barcode</p>

                                {scanError && (
                                    <div className="absolute bottom-32 px-6 py-3 bg-red-500/90 text-white rounded-xl text-center text-sm max-w-xs">
                                        {scanError}
                                        <button onClick={simulateScan} className="block mt-2 bg-white text-red-600 px-3 py-1 rounded-lg text-xs font-bold mx-auto">
                                            Simulate Scan (Demo)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 bg-black flex justify-center">
                            <button onClick={() => setIsScanning(false)} className="bg-white/20 text-white p-4 rounded-full">
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};


export default Billing;

