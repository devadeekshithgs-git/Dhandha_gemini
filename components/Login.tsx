import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Smartphone, Mail, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // IMPORTANT: This URL must be whitelisted in Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs
                    // If not whitelisted, Supabase will fallback to the default Site URL (usually localhost), causing login to fail on production.
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error: any) {
            alert(error.message);
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            alert("Please enter a valid phone number");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: '+91' + phone
            });
            if (error) throw error;
            setOtpSent(true);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                phone: '+91' + phone,
                token: otp,
                type: 'sms'
            });
            if (error) throw error;
        } catch (error: any) {
            alert(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-white max-w-md mx-auto relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-64 bg-slate-900 rounded-b-[3rem] z-0"></div>

            <div className="z-10 w-full bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 mt-4">
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="Dhandha" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg" />
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Dhandha</h1>
                    <p className="text-slate-500 font-medium">Manage your shop like a Pro</p>
                </div>

                {!otpSent ? (
                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-4 rounded-xl border-2 border-slate-100 flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98]"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
                            Continue with Google
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-slate-100"></div>
                            <span className="text-xs text-slate-400 font-bold uppercase">Or Log in with Phone</span>
                            <div className="flex-1 h-px bg-slate-100"></div>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">+91</span>
                                <input
                                    type="tel"
                                    placeholder="Enter Mobile Number"
                                    className="w-full pl-14 pr-4 py-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-lg outline-none focus:border-slate-400 transition-all"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    maxLength={10}
                                />
                            </div>
                            <button
                                onClick={handleSendOtp}
                                disabled={loading || phone.length < 10}
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-200 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Get OTP <ArrowRight size={20} /></>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-slate-500 text-sm">OTP sent to +91 {phone}</p>
                            <button onClick={() => setOtpSent(false)} className="text-blue-600 text-xs font-bold mt-1">Change Number</button>
                        </div>

                        <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            className="w-full text-center py-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-2xl tracking-[0.5em] outline-none focus:border-slate-400 transition-all"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            maxLength={6}
                            autoFocus
                        />

                        <button
                            onClick={handleVerifyOtp}
                            disabled={loading || otp.length < 6}
                            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-emerald-200 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
                        </button>
                    </div>
                )}
            </div>

            <p className="mt-8 text-xs text-center text-slate-400 max-w-xs mx-auto">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    );
};

export default Login;
