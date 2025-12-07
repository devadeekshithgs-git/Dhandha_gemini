import React, { useState, useRef } from 'react';
import { Vendor, VendorBill } from '../types';
import { Truck, Calendar, ArrowRight, Plus, X, Pencil, Trash2, Search, ChevronDown, ChevronUp, FileText, Image as ImageIcon, Upload } from 'lucide-react';

interface VendorsProps {
    vendors: Vendor[];
    onAddVendor: (vendor: Vendor) => void;
    onUpdateVendor: (vendor: Vendor) => void;
    onDeleteVendor: (id: string) => void;
}

const Vendors: React.FC<VendorsProps> = ({ vendors, onAddVendor, onUpdateVendor, onDeleteVendor }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);

    // Add Bill State
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [activeVendorForBill, setActiveVendorForBill] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newBill, setNewBill] = useState<{
        amount: string;
        itemsDescription: string;
        date: string;
        billImageUrl?: string;
    }>({
        amount: '',
        itemsDescription: '',
        date: new Date().toISOString().split('T')[0],
        billImageUrl: undefined
    });

    const [form, setForm] = useState<Partial<Vendor>>({
        name: '',
        category: '',
        balance: 0,
        nextPaymentDate: ''
    });

    const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const openAddModal = () => {
        setEditingId(null);
        setForm({ name: '', category: '', balance: 0, nextPaymentDate: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (e: React.MouseEvent, vendor: Vendor) => {
        e.stopPropagation();
        setEditingId(vendor.id);
        setForm({ ...vendor });
        setIsModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onDeleteVendor(id);
    };

    const toggleExpand = (id: string) => {
        setExpandedVendorId(prev => prev === id ? null : id);
    };

    const handleSave = () => {
        if (form.name && form.balance !== undefined) {
            if (editingId) {
                const vendorToUpdate = vendors.find(v => v.id === editingId);
                if (vendorToUpdate) {
                    onUpdateVendor({
                        ...vendorToUpdate,
                        name: form.name!,
                        category: form.category || 'General',
                        balance: Number(form.balance),
                        nextPaymentDate: form.nextPaymentDate || new Date().toISOString().split('T')[0]
                    });
                }
            } else {
                const vendorToAdd: Vendor = {
                    id: Date.now().toString(),
                    name: form.name!,
                    category: form.category || 'General',
                    balance: Number(form.balance),
                    nextPaymentDate: form.nextPaymentDate || new Date().toISOString().split('T')[0],
                    bills: []
                };
                onAddVendor(vendorToAdd);
            }
            setIsModalOpen(false);
        }
    };

    // Bill Handling
    const openBillModal = (vendorId: string) => {
        setActiveVendorForBill(vendorId);
        setNewBill({
            amount: '',
            itemsDescription: '',
            date: new Date().toISOString().split('T')[0],
            billImageUrl: undefined
        });
        setIsBillModalOpen(true);
    };

    const handleBillImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewBill(prev => ({ ...prev, billImageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveBill = () => {
        if (activeVendorForBill && newBill.amount) {
            const vendor = vendors.find(v => v.id === activeVendorForBill);
            if (vendor) {
                const amount = parseFloat(newBill.amount);
                const bill: VendorBill = {
                    id: Date.now().toString(),
                    date: newBill.date,
                    amount: amount,
                    itemsDescription: newBill.itemsDescription || 'Purchase',
                    billImageUrl: newBill.billImageUrl
                };

                onUpdateVendor({
                    ...vendor,
                    balance: vendor.balance + amount, // Increase balance (payable)
                    bills: [bill, ...(vendor.bills || [])]
                });
                setIsBillModalOpen(false);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header with U-Shaped Valley */}
            <div className="relative bg-white pt-8 pb-4 shadow-sm z-20">
                <h1 className="text-center text-lg font-bold text-orange-800 tracking-tight">Vendor Management</h1>
                <p className="text-center text-xs text-orange-600 mb-2">Track payables & orders</p>

                {/* The Curve Protrusion */}
                <div className="absolute top-full left-0 w-full h-[60px] overflow-hidden pointer-events-none z-20">
                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full text-white drop-shadow-sm">
                        <path d="M 38 0 C 40 0 40 50 50 50 C 60 50 60 0 62 0 Z" fill="currentColor" />
                    </svg>
                </div>

                {/* The Add Button */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 z-30 -mt-2">
                    <button
                        onClick={openAddModal}
                        className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-200 active:scale-90 transition-transform hover:bg-orange-600 ring-4 ring-white"
                    >
                        <Plus size={28} />
                    </button>
                </div>
            </div>

            <div className="mt-16 px-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search vendor..."
                        className="w-full bg-white pl-12 pr-6 py-3.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-slate-100 outline-none transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 mt-2 space-y-4 pb-24">
                {filteredVendors.map(vendor => {
                    const isExpanded = expandedVendorId === vendor.id;
                    return (
                        <div
                            key={vendor.id}
                            onClick={() => toggleExpand(vendor.id)}
                            className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 ${isExpanded ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-100'}`}
                        >
                            <div className="p-4 flex justify-between items-start cursor-pointer active:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${isExpanded ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{vendor.name}</h3>
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wide font-bold">{vendor.category}</span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    {isExpanded ? (
                                        <ChevronUp size={20} className="text-slate-400 mb-1" />
                                    ) : (
                                        <ChevronDown size={20} className="text-slate-400 mb-1" />
                                    )}
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Due</p>
                                    <p className={`font-bold transition-all ${isExpanded ? 'text-3xl text-orange-600' : 'text-lg text-slate-700'}`}>₹{vendor.balance}</p>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="px-4 pb-4 animate-fade-in space-y-4">
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                        <button
                                            onClick={(e) => openEditModal(e, vendor)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
                                        >
                                            <Pencil size={16} /> Edit Details
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, vendor.id)}
                                            className="w-12 flex items-center justify-center py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openBillModal(vendor.id); }}
                                            className="flex items-center justify-center gap-2 bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-100 active:scale-95 transition-transform"
                                        >
                                            <Plus size={18} /> Add Bill
                                        </button>
                                        <button className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-transform">
                                            Pay Now <ArrowRight size={18} />
                                        </button>
                                    </div>

                                    {/* Purchase History */}
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                            <FileText size={12} /> Purchase History
                                        </h4>
                                        <div className="space-y-3">
                                            {vendor.bills && vendor.bills.length > 0 ? (
                                                vendor.bills.map(bill => (
                                                    <div key={bill.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex gap-3">
                                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                            {bill.billImageUrl ? (
                                                                <img src={bill.billImageUrl} alt="Bill" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <FileText size={20} className="text-slate-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <p className="font-bold text-slate-800 text-sm">{bill.itemsDescription}</p>
                                                                <span className="font-bold text-orange-600 text-sm">₹{bill.amount}</span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 mt-1">{bill.date}</p>
                                                            {bill.billImageUrl && <span className="text-[10px] text-blue-500 font-bold mt-1 inline-block">View Bill</span>}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4 text-slate-400 text-xs">
                                                    No past bills recorded.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* General Add/Edit Vendor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
                        <div className="bg-orange-500 p-4 flex justify-between items-center text-white">
                            <h2 className="font-bold text-lg">{editingId ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Company/Name</label>
                                <input
                                    autoFocus
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                                    placeholder="e.g. Metro Wholesale"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                        placeholder="e.g. Dairy"
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Opening Due (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-800"
                                        placeholder="0"
                                        value={form.balance}
                                        onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Next Due Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500"
                                    value={form.nextPaymentDate}
                                    onChange={(e) => setForm({ ...form, nextPaymentDate: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200 active:scale-95 transition-transform mt-2"
                            >
                                {editingId ? 'Update Vendor Details' : 'Save Vendor Details'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Bill Modal */}
            {isBillModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
                        <div className="bg-orange-600 p-4 flex justify-between items-center text-white">
                            <h2 className="font-bold text-lg">Add Purchase Bill</h2>
                            <button onClick={() => setIsBillModalOpen(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Image Upload */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-32 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden"
                            >
                                {newBill.billImageUrl ? (
                                    <img src={newBill.billImageUrl} alt="Bill Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <>
                                        <Upload size={24} className="text-slate-400 mb-2" />
                                        <span className="text-xs font-bold text-slate-400">Upload Bill Photo / PDF</span>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={handleBillImageUpload}
                            />

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Items Purchased</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm resize-none h-20"
                                    placeholder="e.g. 50kg Rice, 20L Oil..."
                                    value={newBill.itemsDescription}
                                    onChange={(e) => setNewBill({ ...newBill, itemsDescription: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Bill Amount (₹)</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-800"
                                        placeholder="0"
                                        value={newBill.amount}
                                        onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-800"
                                        value={newBill.date}
                                        onChange={(e) => setNewBill({ ...newBill, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveBill}
                                disabled={!newBill.amount}
                                className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200 active:scale-95 transition-transform mt-2 disabled:opacity-50"
                            >
                                Add to Vendor Due
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendors;
