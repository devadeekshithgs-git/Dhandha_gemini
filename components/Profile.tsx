import React, { useState } from 'react';
import { MerchantProfile } from '../types';
import { Store, CreditCard, Save, ArrowLeft, Sparkles, ExternalLink, Check, HelpCircle } from 'lucide-react';

interface ProfileProps {
  profile: MerchantProfile | null;
  onSave: (profile: MerchantProfile) => void;
  onBack: () => void;
  onShowTour: () => void;
}

// Default empty profile to prevent crashes when profile is null
const defaultProfile: MerchantProfile = {
  shopName: '',
  ownerName: '',
  upiId: '',
  phone: '',
  address: '',
  geminiApiKey: ''
};

const Profile: React.FC<ProfileProps> = ({ profile, onSave, onBack, onShowTour }) => {
  // Use profile if available, otherwise use default empty values
  const [formData, setFormData] = useState<MerchantProfile>(profile || defaultProfile);

  const handleChange = (field: keyof MerchantProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-slate-50 animate-slide-up relative z-50 shadow-xl">
      <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Business Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
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

        {/* Smart Assistant (AI) Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={14} className="text-violet-500" /> Smart Assistant (AI)
          </h2>

          <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 text-sm text-violet-800 leading-relaxed space-y-3">
            <p className="font-semibold">Unlock your AI Business Manager!</p>
            <p className="opacity-90">To use the Smart Assistant, you need a free API key from Google.</p>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-violet-700 transition-colors shadow-sm"
            >
              Get Free Key <ExternalLink size={12} />
            </a>

            <div className="bg-white/50 p-3 rounded-lg mt-2">
              <p className="font-bold text-xs mb-2">How to get it (Simple Steps):</p>
              <ol className="list-decimal pl-4 space-y-1 text-xs opacity-80">
                <li>Click the <b>"Get Free Key"</b> button above.</li>
                <li>Sign in with your Google account.</li>
                <li>Click <b>"Create API Key"</b>.</li>
                <li>Copy the code that starts with <code>AIza...</code></li>
                <li>Paste it in the box below.</li>
              </ol>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Google Gemini API Key</label>
            <div className="relative">
              <input
                type="password"
                value={formData.geminiApiKey || ''}
                onChange={e => handleChange('geminiApiKey', e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-500 font-mono text-sm"
                placeholder="Paste your key here (AIza...)"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Your key is stored locally on this device.</p>
          </div>
        </div>

        {/* Help & Support */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle size={14} /> Help & Support
          </h2>
          <button
            onClick={onShowTour}
            className="w-full py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-600 flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-slate-100"
          >
            View App Tour (Onboarding)
          </button>
        </div>
      </div>

      {/* Sticky Save Button - Absolute to container */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-20">
        <button
          onClick={handleSave}
          disabled={isSaved}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${isSaved ? 'bg-emerald-700 text-white shadow-none' : 'bg-emerald-600 text-white shadow-emerald-200'
            }`}
        >
          {isSaved ? (
            <>
              <Check size={20} /> Settings Saved!
            </>
          ) : (
            <>
              <Save size={20} /> Save Changes
            </>
          )}
        </button>
      </div >
    </div >
  );
};

export default Profile;