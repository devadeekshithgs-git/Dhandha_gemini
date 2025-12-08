import React, { useState, useRef } from 'react';
import { Package, Plus, Search, Filter, Trash2, Edit2, AlertCircle, X, ChevronDown, Check, PackageOpen, LayoutGrid, List as ListIcon, History, ImagePlus, Scan, Minus, Save, Upload, FileDown, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../types';
import BarcodeScanner from './BarcodeScanner';

interface InventoryProps {
    products: Product[];
    setProducts?: React.Dispatch<React.SetStateAction<Product[]>>; // Optional for transition
    onUpdateProduct: (product: Product) => void;
    onDeleteProduct: (id: string) => void;
    onAddProduct: (product: Product) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onUpdateProduct, onDeleteProduct, onAddProduct }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [isAdding, setIsAdding] = useState(false);
    const [stockUpdateProduct, setStockUpdateProduct] = useState<Product | null>(null);
    const [stockToAdd, setStockToAdd] = useState('0');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});

    const [showScanner, setShowScanner] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const fileImportRef = useRef<HTMLInputElement>(null);

    // New Product Form State
    const [newProduct, setNewProduct] = useState<Partial<Product>>({
        name: '',
        costPrice: 0,
        sellingPrice: 0,
        price: 0,
        stock: 0,
        category: 'General',
        gst: undefined,
        image: undefined,
        barcode: undefined
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (isEdit) {
                    setEditForm(prev => ({ ...prev, image: reader.result as string }));
                } else {
                    setNewProduct(prev => ({ ...prev, image: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddNew = () => {
        if (!newProduct.name || !newProduct.sellingPrice) return;

        const product: Product = {
            id: Date.now().toString(),
            name: newProduct.name,
            costPrice: newProduct.costPrice || 0,
            sellingPrice: newProduct.sellingPrice || 0,
            price: newProduct.sellingPrice || 0, // Fallback
            stock: newProduct.stock || 0,
            category: newProduct.category || 'General',
            gst: newProduct.gst,
            image: newProduct.image,
            barcode: newProduct.barcode
        };

        onAddProduct(product);
        setIsAdding(false);
        setNewProduct({
            name: '',
            costPrice: 0,
            sellingPrice: 0,
            price: 0,
            stock: 0,
            category: 'General',
            gst: undefined,
            image: undefined,
            barcode: undefined
        });
    };

    const startEdit = (product: Product) => {
        setEditingId(product.id);
        setEditForm(product);
    };

    const saveEdit = () => {
        if (!editingId) return;
        const productToUpdate = products.find(p => p.id === editingId);
        if (productToUpdate) {
            onUpdateProduct({ ...productToUpdate, ...editForm } as Product);
        }
        setEditingId(null);
        setEditForm({});
    };

    const openStockUpdate = (product: Product) => {
        setStockUpdateProduct(product);
        setStockToAdd('0');
    };

    const handleStockUpdateSave = () => {
        if (!stockUpdateProduct || !stockToAdd) return;

        const qty = parseInt(stockToAdd);
        if (isNaN(qty) || qty <= 0) return;

        onUpdateProduct({ ...stockUpdateProduct, stock: stockUpdateProduct.stock + qty });
        setStockUpdateProduct(null);
        setStockToAdd('0');
    };

    const handleDeleteClick = (id: string) => {
        onDeleteProduct(id);
    };

    // Bulk Import Logic
    const downloadSampleFile = () => {
        const headers = ['Name', 'Selling Price', 'Cost Price', 'Stock', 'Category', 'Barcode', 'GST'];
        const sampleData = [
            { 'Name': 'Maggi Noodles', 'Selling Price': 14, 'Cost Price': 10, 'Stock': 50, 'Category': 'Snacks', 'Barcode': '8901058862998', 'GST': 18 },
            { 'Name': 'Sugar 1kg', 'Selling Price': 45, 'Cost Price': 40, 'Stock': 20, 'Category': 'Staples', 'Barcode': '', 'GST': 0 }
        ];

        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "inventory_sample.xlsx", { bookType: 'xlsx' });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            let addedCount = 0;
            data.forEach((row: any) => {
                const name = row['Name'] || row['Item Name'] || row['Product Name'];
                const price = row['Selling Price'] || row['Price'] || row['MRP'] || 0;

                if (name && price) {
                    const newProd: Product = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        name: name,
                        sellingPrice: Number(price),
                        costPrice: Number(row['Cost Price'] || row['Cost'] || 0),
                        price: Number(price),
                        stock: Number(row['Stock'] || row['Qty'] || row['Quantity'] || 0),
                        category: row['Category'] || 'General',
                        gst: row['GST'] ? Number(row['GST']) : undefined,
                        barcode: row['Barcode'] ? String(row['Barcode']) : undefined,
                        image: undefined
                    };
                    onAddProduct(newProd);
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                alert(`Successfully imported ${addedCount} items!`);
                setShowImportModal(false);
            } else {
                alert("No valid items found. Please use the sample template.");
            }
        };
        reader.readAsBinaryString(file);
        // Reset input
        e.target.value = '';
    };

    const filteredProducts = products.filter(p =>
        (filterCategory === 'All' || p.category === filterCategory) &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode === searchTerm)
    );

    const getProfit = (p: Product) => {
        if (!p.costPrice) return 0;
        return (p.sellingPrice || p.price) - p.costPrice;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header with U-Shaped Valley */}
            <div className="relative bg-white pt-8 pb-4 shadow-sm z-20">
                <h1 className="text-center text-lg font-bold text-blue-800 tracking-tight">Inventory Management</h1>
                <p className="text-center text-xs text-blue-600 mb-2">{products.length} Items Total</p>

                {/* The Curve Protrusion */}
                <div className="absolute top-full left-0 w-full h-[60px] overflow-hidden pointer-events-none z-20">
                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full text-white drop-shadow-sm">
                        <path d="M 38 0 C 40 0 40 50 50 50 C 60 50 60 0 62 0 Z" fill="currentColor" />
                    </svg>
                </div>

                {/* Import Button (Top Left) */}
                <button
                    onClick={() => setShowImportModal(true)}
                    className="absolute top-6 left-6 p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 active:scale-95 transition-all shadow-sm border border-blue-100 z-30"
                    title="Import Inventory"
                >
                    <Upload size={20} />
                </button>

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

            {/* Search and Filters */}
            <div className="mt-16 px-6 flex gap-2">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full bg-white pl-12 pr-4 py-3.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-slate-100 outline-none transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <select
                        className="appearance-none bg-white border border-slate-100 text-slate-700 py-3.5 pl-4 pr-10 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] outline-none font-medium text-sm h-full"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option>All</option>
                        <option>Staples</option>
                        <option>Snacks</option>
                        <option>Beverages</option>
                        <option>Personal Care</option>
                        <option>Household</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
                {filteredProducts.map(product => (
                    <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 animate-fade-in">
                        {editingId === product.id ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 mb-2">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-slate-300 relative"
                                    >
                                        {(editForm.image || product.image) ? (
                                            <img src={editForm.image || product.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImagePlus size={20} className="text-slate-400" />
                                        )}
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <Edit2 size={12} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Item Name</label>
                                        <input
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full p-2 border rounded text-sm font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Cost Price</label>
                                        <input
                                            type="number"
                                            value={editForm.costPrice || ''}
                                            onChange={e => setEditForm({ ...editForm, costPrice: Number(e.target.value) })}
                                            className="w-full p-2 border rounded text-sm"
                                            placeholder="Cost"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Selling Price</label>
                                        <input
                                            type="number"
                                            value={editForm.sellingPrice || editForm.price || ''}
                                            onChange={e => setEditForm({ ...editForm, sellingPrice: Number(e.target.value), price: Number(e.target.value) })}
                                            className="w-full p-2 border rounded text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Stock</label>
                                        <input
                                            type="number"
                                            value={editForm.stock}
                                            onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                                            className="w-full p-2 border rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Barcode</label>
                                        <input
                                            type="text"
                                            value={editForm.barcode || ''}
                                            onChange={e => setEditForm({ ...editForm, barcode: e.target.value })}
                                            className="w-full p-2 border rounded text-sm"
                                            placeholder="Scan/Type"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">GST % (Optional)</label>
                                    <input
                                        type="number"
                                        value={editForm.gst || ''}
                                        onChange={e => setEditForm({ ...editForm, gst: e.target.value ? Number(e.target.value) : undefined })}
                                        className="w-full p-2 border rounded text-sm"
                                        placeholder="e.g. 18"
                                    />
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
                                <div className="flex items-center gap-3">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <PackageOpen size={20} className="text-slate-300" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-slate-800">{product.name}</p>
                                        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 inline-block px-2 py-0.5 rounded mt-1">{product.category}</p>
                                        {product.gst && (
                                            <span className="ml-1 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">GST {product.gst}%</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <span className="font-bold text-slate-900">₹{product.sellingPrice || product.price}</span>
                                    {product.costPrice > 0 && (
                                        <span className="text-[10px] text-green-600 font-medium">
                                            Profit: ₹{getProfit(product)}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${product.stock < 20 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            Qty: {product.stock}
                                        </span>
                                        <button
                                            onClick={() => openStockUpdate(product)}
                                            className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 active:scale-90 transition-all shadow-sm border border-blue-100"
                                            title="Add Stock"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <button
                                            onClick={() => startEdit(product)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                                        >
                                            <Edit2 size={12} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(product.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-white hover:shadow-sm border border-transparent hover:border-red-100 transition-all"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <PackageOpen size={40} className="mb-2 opacity-50" />
                        <p className="text-sm">No items found</p>
                    </div>
                )}
            </div>

            {/* Add New Product Modal */}
            {isAdding && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
                        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                            <h2 className="font-bold text-lg">Add New Product</h2>
                            <button onClick={() => setIsAdding(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Image Upload */}
                            <div className="flex items-center gap-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-20 h-20 bg-slate-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors overflow-hidden border-2 border-dashed border-slate-300"
                                >
                                    {newProduct.image ? (
                                        <img src={newProduct.image} alt="Product" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <ImagePlus size={24} className="text-slate-400" />
                                            <span className="text-[10px] text-slate-400 mt-1">Add Photo</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, false)}
                                />
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Item Name</label>
                                    <input
                                        autoFocus
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        placeholder="e.g. Basmati Rice 5kg"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Full Width Scan Button */}
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Barcode (Optional)</label>
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className={`w-full p-3 rounded-xl border-dashed border-2 flex items-center justify-center gap-2 font-bold transition-all ${newProduct.barcode ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-blue-300 bg-blue-50 text-blue-600 hover:border-blue-400 hover:bg-blue-100'}`}
                                >
                                    {newProduct.barcode ? (
                                        <>
                                            <Scan size={20} />
                                            <span className="text-sm font-bold">{newProduct.barcode}</span>
                                            <span
                                                onClick={(e) => { e.stopPropagation(); setNewProduct({ ...newProduct, barcode: '' }) }}
                                                className="ml-2 p-1 bg-white rounded-full text-slate-400 hover:text-red-500 shadow-sm"
                                            >
                                                <X size={14} />
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Scan size={20} />
                                            <span>Scan Barcode</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Cost Price (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                        placeholder="0"
                                        value={newProduct.costPrice || ''}
                                        onChange={(e) => setNewProduct({ ...newProduct, costPrice: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Selling Price (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                        placeholder="0"
                                        value={newProduct.sellingPrice || ''}
                                        onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: Number(e.target.value), price: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Profit Preview */}
                            {(newProduct.costPrice || 0) > 0 && (newProduct.sellingPrice || 0) > 0 && (
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                                    <span className="text-xs text-green-600 font-medium">Profit per unit: </span>
                                    <span className="text-green-700 font-bold">₹{(newProduct.sellingPrice || 0) - (newProduct.costPrice || 0)}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Stock</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                        placeholder="0"
                                        value={newProduct.stock || ''}
                                        onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">GST % (Optional)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                        placeholder="e.g. 18"
                                        value={newProduct.gst || ''}
                                        onChange={(e) => setNewProduct({ ...newProduct, gst: e.target.value ? Number(e.target.value) : undefined })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-700"
                                    value={newProduct.category}
                                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                >
                                    <option>Staples</option>
                                    <option>Snacks</option>
                                    <option>Beverages</option>
                                    <option>Personal Care</option>
                                    <option>Household</option>
                                    <option>Oils</option>
                                    <option>General</option>
                                </select>
                            </div>

                            <button
                                onClick={handleAddNew}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform mt-4"
                            >
                                Save Product
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Add Stock Modal */}
            {stockUpdateProduct && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
                        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                            <h2 className="font-bold text-lg">Receive Stock</h2>
                            <button onClick={() => setStockUpdateProduct(null)} className="bg-white/20 p-1 rounded-full hover:bg-white/30">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-500">
                                Adding stock for: <span className="font-bold text-slate-800">{stockUpdateProduct.name}</span>
                            </p>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Quantity Received</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setStockToAdd(prev => String(Math.max(0, (parseInt(prev || '0') - 1))))}
                                        className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <input
                                        autoFocus
                                        type="number"
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-center text-lg"
                                        placeholder="0"
                                        value={stockToAdd}
                                        onChange={(e) => setStockToAdd(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setStockToAdd(prev => String((parseInt(prev || '0') + 1)))}
                                        className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 active:scale-95 transition-transform"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleStockUpdateSave}
                                disabled={!stockToAdd || parseInt(stockToAdd) <= 0}
                                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                            >
                                Confirm & Update Stock
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Modal */}
            {showScanner && (
                <BarcodeScanner
                    onScanSuccess={(code) => {
                        setNewProduct({ ...newProduct, barcode: code });
                        setShowScanner(false);
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
                        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                            <h2 className="font-bold text-lg flex items-center gap-2"><FileSpreadsheet size={20} /> Bulk Import</h2>
                            <button onClick={() => setShowImportModal(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Upload size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800">Upload Inventory File</h3>
                                <p className="text-sm text-slate-500">Supports .xlsx and .csv files</p>
                            </div>

                            <button
                                onClick={downloadSampleFile}
                                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-400 transition-all text-sm"
                            >
                                <FileDown size={18} /> Download Sample Template
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">Then</span>
                                </div>
                            </div>

                            <button
                                onClick={() => fileImportRef.current?.click()}
                                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <Upload size={18} /> Select File to Upload
                            </button>
                            <input
                                ref={fileImportRef}
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
