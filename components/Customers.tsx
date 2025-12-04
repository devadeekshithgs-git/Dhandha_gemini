import React, { useState } from 'react';
import { Customer } from '../types';
import { Search, Plus, Phone, MessageCircle, X, Pencil, Trash2 } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ name: '', phone: '' });

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const totalReceivables = customers.reduce((acc, curr) => acc + (curr.balance > 0 ? curr.balance : 0), 0);

  const sendWhatsApp = (phone: string, balance: number, name: string) => {
     const cleanPhone = phone.replace(/\D/g, '');
     const message = `Namaste ${name} Ji, your current pending amount at our store is ₹${balance}. Please pay at your earliest convenience. Thank you!`;
     const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
     window.open(url, '_blank');
  };

  const openAddModal = () => {
      setEditingId(null);
      setForm({ name: '', phone: '' });
      setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
      setEditingId(customer.id);
      setForm({ name: customer.name, phone: customer.phone });
      setIsModalOpen(true);
  };

  const handleSave = () => {
    if (form.name && form.phone) {
        if (editingId) {
            // Update existing
            const customerToUpdate = customers.find(c => c.id === editingId);
            if (customerToUpdate) {
                onUpdateCustomer({
                    ...customerToUpdate,
                    name: form.name,
                    phone: form.phone
                });
            }
        } else {
            // Add new
            const customerToAdd: Customer = {
                id: Date.now().toString(),
                name: form.name,
                phone: form.phone,
                balance: 0,
                lastTransactionDate: new Date().toISOString().split('T')[0]
            };
            onAddCustomer(customerToAdd);
        }
        setIsModalOpen(false);
    }
  };

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
                    <Phone className="text-white" size={20} />
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
                <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group">
                    <div>
                        <h3 className="font-bold text-slate-800">{customer.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{customer.phone}</p>
                        
                        {/* Edit Actions */}
                        <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => openEditModal(customer)} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-blue-600 font-bold uppercase tracking-wide">
                                <Pencil size={10} /> Edit
                             </button>
                             <button onClick={() => onDeleteCustomer(customer.id)} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-wide">
                                <Trash2 size={10} /> Delete
                             </button>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`font-bold text-base ${customer.balance > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {customer.balance > 0 ? `₹${customer.balance}` : 'Settled'}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => window.open(`tel:${customer.phone}`)} className="p-1.5 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
                                <Phone size={14} />
                            </button>
                            {customer.balance > 0 && (
                                <button 
                                    onClick={() => sendWhatsApp(customer.phone, customer.balance, customer.name)}
                                    className="p-1.5 bg-green-100 rounded-full text-green-600 hover:bg-green-200 flex items-center gap-1"
                                >
                                    <MessageCircle size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
       </div>

       {/* Add/Edit Customer Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
                <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                    <h2 className="font-bold text-lg">{editingId ? 'Edit Customer' : 'New Customer'}</h2>
                    <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                        <input 
                            autoFocus
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            placeholder="e.g. Rahul Kumar"
                            value={form.name}
                            onChange={(e) => setForm({...form, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Phone Number</label>
                        <input 
                            type="tel"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                            placeholder="9876543210"
                            value={form.phone}
                            onChange={(e) => setForm({...form, phone: e.target.value})}
                        />
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