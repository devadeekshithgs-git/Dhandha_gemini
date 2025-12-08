import React, { useState } from 'react';
import { ArrowRight, Check, User, Building2, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SLIDES = [
    {
        title: "Track your Business",
        desc: "See your daily sales and profits at a glance.",
        image: "/screen_home.png", // from public folder
        color: "bg-emerald-50 text-emerald-600"
    },
    {
        title: "Fast Billing",
        desc: "Bill customers in seconds with Quick Cash.",
        image: "/screen_bill.png",
        color: "bg-blue-50 text-blue-600"
    },
    {
        title: "Manage Stock",
        desc: "Keep track of inventory and get low stock alerts.",
        image: "/screen_items.png",
        color: "bg-orange-50 text-orange-600"
    }
];

interface OnboardingProps {
    onComplete: () => void;
    userId: string;
    mode?: 'full' | 'tour_only';
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, userId, mode = 'full' }) => {
    const [step, setStep] = useState(0); // 0-2: Slides, 3: Profile Setup
    const [loading, setLoading] = useState(false);

    // Profile Form
    const [ownerName, setOwnerName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [upiId, setUpiId] = useState('');

    const handleNext = () => {
        if (step < SLIDES.length - 1) {
            setStep(step + 1);
        } else {
            if (mode === 'tour_only') onComplete();
            else setStep(3); // Go to Profile Setup
        }
    };

    const handleSaveProfile = async () => {
        if (!ownerName || !businessName) {
            alert("Name and Business Name are required!");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('profiles').upsert({
                id: userId,
                owner_name: ownerName,
                business_name: businessName,
                upi_id: upiId
            });

            if (error) throw error;
            onComplete();
        } catch (error: any) {
            alert('Error saving profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Render Slide
    if (step < 3) {
        const slide = SLIDES[step];
        return (
            <div className="min-h-[100dvh] bg-white flex flex-col max-w-md mx-auto relative overflow-hidden">
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
                    <div className="absolute top-10 right-10">
                        {mode === 'tour_only' ? (
                            <button onClick={onComplete} className="text-slate-400 font-bold text-sm">Close</button>
                        ) : (
                            <button onClick={() => setStep(3)} className="text-slate-400 font-bold text-sm">Skip</button>
                        )}
                    </div>

                    <div className={`w-full aspect-[9/16] max-h-[50vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100 ${slide.color} flex items-center justify-center relative`}>
                        {/* Mockup Frame */}
                        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-3xl font-black text-slate-800">{slide.title}</h2>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">{slide.desc}</p>
                    </div>
                </div>

                <div className="p-8 pb-12 safe-area-bottom">
                    <div className="flex justify-center gap-2 mb-8">
                        {SLIDES.map((_, i) => (
                            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-slate-800' : 'w-2 bg-slate-200'}`} />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                        {step === SLIDES.length - 1 ? (mode === 'tour_only' ? "Close Guide" : "Get Started") : "Next"} <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    // Render Profile Setup
    return (
        <div className="min-h-[100dvh] bg-white flex flex-col max-w-md mx-auto p-8 pt-12 animate-slide-up">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Tell us about you</h1>
            <p className="text-slate-500 mb-8 font-medium">To create your digital business card</p>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Owner Name</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            autoFocus
                            placeholder="e.g. Rahul Kumar"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-lg outline-none focus:border-slate-400 transition-all"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Business Name</label>
                    <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            placeholder="e.g. Rahul Dhandha"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-lg outline-none focus:border-slate-400 transition-all"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>UPI ID (For Payments)</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">OPTIONAL</span>
                    </label>
                    <div className="relative">
                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            placeholder="e.g. rahul@okaxis"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-lg outline-none focus:border-slate-400 transition-all"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1"></div>

            <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-emerald-200 active:scale-[0.98] transition-transform disabled:opacity-50 mt-8 mb-4 flex items-center justify-center gap-2"
            >
                Start My Business <Check size={20} />
            </button>
        </div>
    );
};

export default Onboarding;
