import React, { useState } from 'react';
import { Product } from '../types';
import { Search, Plus, Save, Edit2, PackageOpen, X, Trash2 } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddProduct: (product: Product) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onUpdateProduct, onDeleteProduct, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  
  // Add New Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    category: 'General'
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const saveEdit = () => {
    if (editingId && editForm) {
      onUpdateProduct(editForm as Product);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleAddNew = () => {
    if (newProduct.name && newProduct.price !== undefined) {
        const productToAdd: Product = {
            id: Date.now().toString(),
            name: newProduct.name,
            price: Number(newProduct.price),
            stock: Number(newProduct.stock) || 0,
            category: newProduct.category || 'General'
        };
        onAddProduct(productToAdd);
        setIsAdding(false);
        setNewProduct({ name: '', price: 0, stock: 0, category: 'General' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* Header with U-Shaped Valley */}
      <div className="relative bg-white pt-8 pb-4 shadow-sm z-20">
        <h1 className="text-center text-lg font-bold text-slate-700 tracking-tight">Manage Inventory</h1>
        <p className="text-center text-xs text-slate-400 mb-2">Track stock & prices</p>
        
        {/* The Curve Protrusion */}
        <div className="absolute top-full left-0 w-full h-[60px] overflow-hidden pointer-events-none z-20">
             <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full text-white drop-shadow-sm">
                 <path d="M 38 0 C 40 0 40 50 50 50 C 60 50 60 0 62 0 Z" fill="currentColor" />
             </svg>
        </div>

        {/* The Add Button */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 z-30 -mt-2">
             <button 
                onClick={() => setIsAdding(true)}
                className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-200 active:scale-90 transition-transform hover:bg-blue-700 ring-4 ring-white"
            >
                 <Plus size={28} />
             </button>
        </div>
      </div>

      <div className="mt-16 px-6 pb-2">
        <div className="relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
                type="text"
                placeholder="Search items..."
                className="w-full bg-white pl-12 pr-6 py-3.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-slate-100 outline-none transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2 space-y-3 pb-24">
        {filteredProducts.map(product => (
            <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                {editingId === product.id ? (
                    <div className="space-y-3">
                        <input 
                            value={editForm.name} 
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="w-full p-2 border rounded font-bold text-sm"
                            placeholder="Product Name"
                        />
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Price</label>
                                <input 
                                    type="number"
                                    value={editForm.price} 
                                    onChange={e => setEditForm({...editForm, price: Number(e.target.value)})}
                                    className="w-full p-2 border rounded text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Stock</label>
                                <input 
                                    type="number"
                                    value={editForm.stock} 
                                    onChange={e => setEditForm({...editForm, stock: Number(e.target.value)})}
                                    className="w-full p-2 border rounded text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                             <button 
                                onClick={() => setEditingId(null)}
                                className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-medium text-xs"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={saveEdit}
                                className="flex-[2] bg-blue-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-xs"
                            >
                                <Save size={14} /> Update
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-800">{product.name}</p>
                            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 inline-block px-2 py-0.5 rounded mt-1">{product.category}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                            <span className="font-bold text-slate-900">₹{product.price}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.stock < 20 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                Qty: {product.stock}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                <button onClick={() => startEdit(product)} className="p-1.5 bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => onDeleteProduct(product.id)} className="p-1.5 bg-slate-50 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        ))}
        {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <PackageOpen size={40} className="mb-2 opacity-50"/>
                <p className="text-sm">No items found</p>
            </div>
        )}
      </div>

      {/* Add New Product Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                    <h2 className="font-bold text-lg">Add New Product</h2>
                    <button onClick={() => setIsAdding(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Item Name</label>
                        <input 
                            autoFocus
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            placeholder="e.g. Basmati Rice 5kg"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Price (₹)</label>
                             <input 
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                placeholder="0"
                                value={newProduct.price || ''}
                                onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                             />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Stock</label>
                             <input 
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                placeholder="0"
                                value={newProduct.stock || ''}
                                onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                             />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        >
                            <option>Staples</option>
                            <option>Snacks</option>
                            <option>Beverages</option>
                            <option>Personal Care</option>
                            <option>Household</option>
                            <option>General</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleAddNew}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform mt-2"
                    >
                        Save Product
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;