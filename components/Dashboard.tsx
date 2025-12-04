import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SalesData, MerchantProfile } from '../types';
import { getBusinessInsights } from '../services/geminiService';
import { Sparkles, IndianRupee, Wallet, TrendingUp, TrendingDown, Minus, Settings } from 'lucide-react';

interface DashboardProps {
    salesData: SalesData[];
    receivables: number;
    payables: number;
    cashInHand: number;
    profile: MerchantProfile;
    onOpenProfile: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ salesData, receivables, payables, cashInHand, profile, onOpenProfile }) => {
    const [insight, setInsight] = useState<string>('');
    const [loadingInsight, setLoadingInsight] = useState<boolean>(false);

    const revenue = salesData.reduce((acc, curr) => acc + curr.amount, 0);
    const expenses = Math.floor(revenue * 0.72);
    const profit = revenue - expenses;

    const handleGetInsight = async () => {
        setLoadingInsight(true);
        const result = await getBusinessInsights(salesData, receivables, payables);
        setInsight(result);
        setLoadingInsight(false);
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto pb-28 bg-slate-50">
            {/* Header */}
            <header className="p-6 pb-2 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Namaste, {profile.ownerName || 'Owner Ji'}</h1>
                    <p className="text-sm text-slate-500">{profile.shopName || "My Kirana Store"}</p>
                </div>
                <button
                    onClick={onOpenProfile}
                    className="p-2 bg-white border border-slate-200 rounded-full text-slate-600 shadow-sm active:scale-95 transition-transform"
                >
                    <Settings size={20} />
                </button>
            </header>

            <div className="px-6 space-y-6 mt-4">

                {/* Profit & Loss Section */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h2 className="text-sm font-bold text-slate-800 mb-6">Profit & Loss</h2>

                    <div className="flex items-center justify-between gap-2 mb-6">
                        {/* Revenue */}
                        <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                    <Wallet size={14} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Revenue</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">₹{revenue.toLocaleString('en-IN')}</h3>
                        </div>

                        {/* Minus Sign */}
                        <div className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-slate-400">
                            <Minus size={14} />
                        </div>

                        {/* Expense */}
                        <div className="flex-1 bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-red-100 text-red-500 rounded-lg">
                                    <TrendingDown size={14} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Expense</span>
                            </div>
                            <h3 className="text-lg font-bold text-red-600">₹{expenses.toLocaleString('en-IN')}</h3>
                        </div>
                    </div>

                    {/* Profit Card */}
                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-600 mb-1">Net Profit</p>
                                <h3 className="text-2xl font-bold text-emerald-700">₹{profit.toLocaleString('en-IN')}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 bg-emerald-600 text-white p-5 rounded-3xl shadow-lg shadow-emerald-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-wider mb-2">Cash in Hand</p>
                            <div className="flex items-center gap-2">
                                <IndianRupee size={24} />
                                <span className="text-3xl font-bold">{cashInHand.toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-xs text-emerald-100 mt-1 font-medium">Available Cash</p>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                            <Wallet size={120} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">To Collect</p>
                        <div className="flex items-center gap-2 text-orange-500">
                            <IndianRupee size={20} />
                            <span className="text-xl font-bold">{receivables.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-medium">From Customers</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">To Pay</p>
                        <div className="flex items-center gap-2 text-slate-700">
                            <IndianRupee size={20} />
                            <span className="text-xl font-bold">{payables.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-medium">To Vendors</p>
                    </div>
                </div>

                {/* Sales Chart */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Sales Trends</h3>
                        <select className="bg-slate-50 text-xs py-1.5 px-3 rounded-lg border border-slate-200 outline-none text-slate-600 font-bold">
                            <option>Weekly</option>
                            <option>Monthly</option>
                        </select>
                    </div>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis hide={true} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`₹${value}`, 'Sales']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorAmt)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gemini AI Assistant */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <Sparkles className="text-white" size={16} />
                        </div>
                        <h3 className="font-bold text-white tracking-wide text-sm">SMART ASSISTANT</h3>
                    </div>
                    {insight ? (
                        <div className="prose prose-sm prose-invert leading-relaxed animate-fade-in text-indigo-50">
                            {insight}
                            <button
                                onClick={() => setInsight('')}
                                className="block mt-4 text-xs font-bold text-indigo-600 bg-white px-4 py-2 rounded-xl hover:bg-white/90 transition-colors w-fit"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-indigo-100 mb-5 opacity-90 font-medium leading-relaxed">Get AI-powered insights on how to improve your business profits and cash flow.</p>
                            <button
                                onClick={handleGetInsight}
                                disabled={loadingInsight}
                                className="w-full bg-white text-indigo-600 py-3.5 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {loadingInsight ? 'Analyzing...' : 'Analyze My Business'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;