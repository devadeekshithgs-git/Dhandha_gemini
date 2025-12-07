import React, { useState } from 'react';
import { Customer, CustomerDue } from '../types';
import { Search, Plus, Phone, MessageCircle, X, Pencil, Trash2, ChevronDown, ChevronUp, IndianRupee, FileText, ArrowLeft } from 'lucide-react';

interface CustomersProps {
    customers: Customer[];
    onAddCustomer: (customer: Customer) => void;
    onUpdateCustomer: (customer: Customer) => void;
    onDeleteCustomer: (id: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) => {
    const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', phone: '', dueAmount: '', dueDescription: '' });

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const totalReceivables = customers.reduce((acc, curr) => acc + (curr.balance > 0 ? curr.balance : 0), 0);
    const selectedCustomer = customers.find(c => c.id === viewingCustomerId);

    const sendWhatsApp = (phone: string, balance: number, name: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const message = `Namaste ${name} Ji, your current pending amount at our store is ₹${balance}. Please pay at your earliest convenience. Thank you!`;
        const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const openAddModal = () => {
        setEditingId(null);
        setForm({ name: '', phone: '', dueAmount: '', dueDescription: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (customer: Customer, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(customer.id);
        setForm({ name: customer.name, phone: customer.phone, dueAmount: '', dueDescription: '' });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this customer?')) {
            onDeleteCustomer(id);
            if (viewingCustomerId === id) setViewingCustomerId(null);
        }
    };

    const handleSave = () => {
        if (form.name && form.phone) {
            if (editingId) {
                // Update existing
                const customerToUpdate = customers.find(c => c.id === editingId);
                if (customerToUpdate) {
                    let updatedDues = customerToUpdate.dues || [];
                    let newBalance = customerToUpdate.balance;

                    // Add new due if amount is provided
                    if (form.dueAmount && Number(form.dueAmount) > 0) {
                        const newDue: CustomerDue = {
                            id: Date.now().toString(),
                            amount: Number(form.dueAmount),
                            description: form.dueDescription || 'General credit',
                            date: new Date().toISOString().split('T')[0],
                            paid: false
                        };
                        updatedDues = [...updatedDues, newDue];
                        newBalance += Number(form.dueAmount);
                    }

                    onUpdateCustomer({
                        ...customerToUpdate,
                        name: form.name,
                        phone: form.phone,
                        balance: newBalance,
                        dues: updatedDues,
                        lastTransactionDate: new Date().toISOString().split('T')[0]
                    });
                }
            } else {
                // Add new
                const initialDues: CustomerDue[] = [];
                let initialBalance = 0;

                // Add initial due if amount is provided
                if (form.dueAmount && Number(form.dueAmount) > 0) {
                    initialDues.push({
                        id: Date.now().toString(),
                        amount: Number(form.dueAmount),
                        description: form.dueDescription || 'Initial credit',
                        date: new Date().toISOString().split('T')[0],
                        paid: false
                    });
                    initialBalance = Number(form.dueAmount);
                }

                const customerToAdd: Customer = {
                    id: Date.now().toString(),
                    name: form.name,
                    phone: form.phone,
                    balance: initialBalance,
                    lastTransactionDate: new Date().toISOString().split('T')[0],
                    dues: initialDues
                };
                onAddCustomer(customerToAdd);
            }
            setIsModalOpen(false);
        }
    };

    const markDuePaid = (customerId: string, dueId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer && customer.dues) {
            const due = customer.dues.find(d => d.id === dueId);
            if (due) {
                const updatedDues = customer.dues.map(d =>
                    d.id === dueId ? { ...d, paid: true } : d
                );
                const newBalance = customer.balance - due.amount;
                onUpdateCustomer({
                    ...customer,
                    balance: Math.max(0, newBalance),
                    dues: updatedDues,
                    lastTransactionDate: new Date().toISOString().split('T')[0]
                });
            }
        }
    };

    // Detailed View for Selected Customer
    if (viewingCustomerId && selectedCustomer) {
        return (
            <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
                {/* Detail Header */}
                <div className="bg-white px-4 py-4 pt-8 shadow-sm z-20 sticky top-0 flex items-center gap-4">
                    <button
                        onClick={() => setViewingCustomerId(null)}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-800">{selectedCustomer.name}</h1>
                        <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                    </div>
                    <button
                        onClick={(e) => openEditModal(selectedCustomer, e)}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                    >
                        <Pencil size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">Total Outstanding Due</p>
                        <div className="flex items-center gap-2 mb-6">
                            <IndianRupee size={32} />
                            <span className="text-4xl font-bold">{selectedCustomer.balance.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => window.open(`tel:${selectedCustomer.phone}`)}
                                className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <Phone size={16} /> Call
                            </button>
                            <button
                                onClick={() => sendWhatsApp(selectedCustomer.phone, selectedCustomer.balance, selectedCustomer.name)}
                                className="flex-1 bg-white text-emerald-800 hover:bg-emerald-50 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                                <MessageCircle size={16} /> WhatsApp
                            </button>
                        </div>
                    </div>

                    {/* Dues Ledger */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <FileText size={16} /> Transaction History
                        </h3>

                        <div className="space-y-3">
                            {selectedCustomer.dues && selectedCustomer.dues.length > 0 ? (
                                [...selectedCustomer.dues].reverse().map(due => (
                                    <div key={due.id} className={`bg-white rounded-xl p-4 border border-slate-100 shadow-sm relative overflow-hidden ${due.paid ? 'opacity-60' : ''}`}>
                                        {due.paid && (
                                            <div className="absolute right-0 top-0 bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                                PAID
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800 text-base">{due.description}</p>
                                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                    {due.date}
                                                </p>

                                                {/* Item Breakdown */}
                                                {due.items && due.items.length > 0 && (
                                                    <div className="mt-3 bg-slate-50 rounded-lg p-2 border border-slate-100">
                                                        {due.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between text-xs text-slate-600 mb-1 last:mb-0">
                                                                <span>{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                                                                <span>₹{item.price}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-3 ml-4">
                                                <span className={`font-bold text-lg ${due.paid ? 'text-slate-400 line-through' : 'text-red-500'}`}>
                                                    ₹{due.amount}
                                                </span>

                                                {!due.paid && (
                                                    <button
                                                        onClick={() => markDuePaid(selectedCustomer.id, due.id)}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold rounded-lg hover:bg-emerald-100 active:scale-95 transition-all"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                                    <p>No transactions found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">

            {/* Header with U-Shaped Valley */}
            <div className="relative bg-white pt-8 pb-4 shadow-sm z-20">
                <h1 className="text-center text-lg font-bold text-emerald-800 tracking-tight">Customer Khata</h1>
                <p className="text-center text-xs text-emerald-600 mb-2">Manage udhaar & payments</p>

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
                        className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-200 active:scale-90 transition-transform hover:bg-emerald-700 ring-4 ring-white"
                    >
                        <Plus size={28} />
                    </button>
                </div>
            </div>

            {/* Receivables Summary */}
            <div className="mt-16 px-6">
                <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-100 text-white flex justify-between items-center">
                    <div>
                        <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Total Market Receivables</p>
                        <h2 className="text-2xl font-bold mt-1">₹{totalReceivables.toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                        <IndianRupee className="text-white" size={20} />
                    </div>
                </div>
            </div>

            {/* Search Bar - Google Style */}
            <div className="px-6 mt-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search customer..."
                        className="w-full bg-white pl-12 pr-6 py-3.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-slate-100 outline-none transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 mt-4 pb-24 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    <span>Customer Details</span>
                    <span>Due Amount</span>
                </div>
                {filtered.map(customer => (
                    <div
                        key={customer.id}
                        onClick={() => setViewingCustomerId(customer.id)}
                        className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
                    >
                        <div className="p-4 flex justify-between items-center group">
                            <div>
                                <h3 className="font-bold text-slate-800">{customer.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{customer.phone}</p>

                                {/* Edit Actions */}
                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        onClick={(e) => openEditModal(customer, e)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                                    >
                                        <Pencil size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(customer.id, e)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-white hover:shadow-sm border border-transparent hover:border-red-100 transition-all"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`font-bold text-base ${customer.balance > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                    {customer.balance > 0 ? `₹${customer.balance}` : 'Settled'}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); window.open(`tel:${customer.phone}`); }}
                                        className="p-3 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 shadow-sm"
                                    >
                                        <Phone size={20} />
                                    </button>
                                    {customer.balance > 0 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); sendWhatsApp(customer.phone, customer.balance, customer.name); }}
                                            className="p-3 bg-green-100 rounded-full text-green-600 hover:bg-green-200 flex items-center gap-1 shadow-sm"
                                        >
                                            <MessageCircle size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Customer Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
                        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                            <h2 className="font-bold text-lg">{editingId ? 'Edit Customer' : 'New Customer'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                                <input
                                    autoFocus
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                                    placeholder="e.g. Rahul Kumar"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                                    placeholder="9876543210"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>

                            {/* Due Amount Section */}
                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                    <IndianRupee size={12} /> Add Due Amount (Optional)
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Amount (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                                            placeholder="0"
                                            value={form.dueAmount}
                                            onChange={(e) => setForm({ ...form, dueAmount: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">For What?</label>
                                        <input
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="e.g. Monthly groceries, Festival items..."
                                            value={form.dueDescription}
                                            onChange={(e) => setForm({ ...form, dueDescription: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-transform mt-2"
                            >
                                {editingId ? 'Update Details' : 'Save Customer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;