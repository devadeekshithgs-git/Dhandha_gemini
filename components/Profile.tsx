import React, { useState } from 'react';
import { MerchantProfile } from '../types';
import { Store, CreditCard, Save, ArrowLeft } from 'lucide-react';

interface ProfileProps {
  profile: MerchantProfile;
  onSave: (profile: MerchantProfile) => void;
  onBack: () => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, onSave, onBack }) => {
  const [formData, setFormData] = useState<MerchantProfile>(profile);

  const handleChange = (field: keyof MerchantProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    alert('Business details updated successfully!');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-slide-up">
      <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Business Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
        {/* Business Info Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Store size={14} /> Shop Details
          </h2>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Shop Name</label>
            <input 
              value={formData.shopName}
              onChange={e => handleChange('shopName', e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-slate-800"
              placeholder="e.g. Laxmi General Store"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Owner Name</label>
            <input 
              value={formData.ownerName}
              onChange={e => handleChange('ownerName', e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
              placeholder="e.g. Ramesh Kumar"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
            <textarea 
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
              rows={2}
              placeholder="Shop address..."
            />
          </div>
        </div>

        {/* Payments Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CreditCard size={14} /> Payments & UPI
          </h2>
          
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs text-blue-700 leading-relaxed">
            <strong>Note:</strong> Enter your valid UPI ID (e.g., 9876543210@ybl). This will be used to generate QR codes for customers to pay you directly.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Merchant UPI ID</label>
            <input 
              value={formData.upiId}
              onChange={e => handleChange('upiId', e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-slate-800 font-mono"
              placeholder="username@bank"
            />
          </div>
        </div>

        {/* Save Button */}
        <button 
          onClick={handleSave}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Save size={20} /> Save Changes
        </button>
      </div>
    </div>
  );
};

export default Profile;