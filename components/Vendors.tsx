import React, { useState } from 'react';
import { Vendor } from '../types';
import { Truck, Calendar, ArrowRight, Plus, X, Pencil, Trash2, Search } from 'lucide-react';

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

  const openEditModal = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setForm({ ...vendor });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (form.name && form.balance !== undefined) {
        if (editingId) {
            // Update Existing
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
            // Add New
            const vendorToAdd: Vendor = {
                id: Date.now().toString(),
                name: form.name!,
                category: form.category || 'General',
                balance: Number(form.balance),
                nextPaymentDate: form.nextPaymentDate || new Date().toISOString().split('T')[0]
            };
            onAddVendor(vendorToAdd);
        }
        setIsModalOpen(false);
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
        {filteredVendors.map(vendor => (
            <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group">
                <div className="p-4 border-b border-slate-50 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 border border-orange-100">
                            <Truck size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{vendor.name}</h3>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wide font-bold">{vendor.category}</span>
                            
                            {/* Edit/Delete Actions */}
                            <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(vendor)} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-blue-600 font-bold uppercase tracking-wide">
                                    <Pencil size={10} /> Edit
                                </button>
                                <button onClick={() => onDeleteVendor(vendor.id)} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-wide">
                                    <Trash2 size={10} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                         <p className="text-[10px] text-slate-400 uppercase font-bold">Payment Due</p>
                         <p className="text-xl font-bold text-orange-600">₹{vendor.balance}</p>
                    </div>
                </div>
                <div className="px-4 py-3 bg-slate-50 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">Due: {vendor.nextPaymentDate}</span>
                    </div>
                    <button className="text-blue-600 font-bold flex items-center gap-1 text-xs uppercase tracking-wide">
                        Pay Now <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        ))}

        {vendors.length === 0 && (
            <div className="text-center text-slate-400 py-10">
                <p>No vendors added yet.</p>
            </div>
        )}
      </div>

       {/* Add/Edit Vendor Modal */}
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
                            onChange={(e) => setForm({...form, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                             <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                placeholder="e.g. Dairy"
                                value={form.category}
                                onChange={(e) => setForm({...form, category: e.target.value})}
                             />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Opening Due (₹)</label>
                             <input 
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-800"
                                placeholder="0"
                                value={form.balance}
                                onChange={(e) => setForm({...form, balance: Number(e.target.value)})}
                             />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Next Due Date</label>
                        <input 
                            type="date"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500"
                            value={form.nextPaymentDate}
                            onChange={(e) => setForm({...form, nextPaymentDate: e.target.value})}
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
    </div>
  );
};

export default Vendors;