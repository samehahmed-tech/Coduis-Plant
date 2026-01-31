
import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    Legend
} from 'recharts';
import {
    DollarSign,
    ShoppingBag,
    Users,
    TrendingUp,
    Store,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    MapPin,
    Calendar
} from 'lucide-react';
import { Branch } from '../types';

interface AdminDashboardProps {
    branches: Branch[];
    lang: 'en' | 'ar';
    t: any;
}

const COMPARATIVE_DATA = [
    { name: 'Sat', zayed: 4000, maadi: 2400, october: 2400 },
    { name: 'Sun', zayed: 3000, maadi: 1398, october: 2210 },
    { name: 'Mon', zayed: 2000, maadi: 9800, october: 2290 },
    { name: 'Tue', zayed: 2780, maadi: 3908, october: 2000 },
    { name: 'Wed', zayed: 1890, maadi: 4800, october: 2181 },
    { name: 'Thu', zayed: 2390, maadi: 3800, october: 2500 },
    { name: 'Fri', zayed: 3490, maadi: 4300, october: 2100 },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ branches, lang, t }) => {
    const [timeRange, setTimeRange] = useState('Last 7 Days');

    const stats = [
        { title: lang === 'ar' ? 'إجمالي مبيعات الفروع' : 'Total Group Revenue', value: '452,500', change: '+12.5%', isUp: true, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
        { title: lang === 'ar' ? 'إجمالي الطلبات' : 'Total Group Orders', value: '12,450', change: '+8.2%', isUp: true, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        { title: lang === 'ar' ? 'متوسط السلة' : 'Avg. Ticket Size', value: '36.50', change: '-2.1%', isUp: false, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
        { title: lang === 'ar' ? 'نمو الفروع' : 'Branch Growth', value: '24.2%', change: '+4.5%', isUp: true, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
    ];

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Store className="text-indigo-600" />
                        {lang === 'ar' ? 'مركز التحكم والتحليلات' : 'Group Analytics Center'}
                    </h2>
                    <p className="text-sm text-slate-500 font-bold">{lang === 'ar' ? 'متابعة أداء كافة الفروع والمواقع في الوقت الفعلي.' : 'Monitor performance across all branches and locations in real-time.'}</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button className="px-4 py-2 text-xs font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl">Real-time</button>
                    <button className="px-4 py-2 text-xs font-black uppercase text-slate-500 hover:text-slate-800 transition-colors">Historical</button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <div key={idx} className="card-primary !p-6 group hover:scale-[1.02] transition-transform cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center`}>
                                <stat.icon size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-black ${stat.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {stat.change}
                            </div>
                        </div>
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{stat.title}</h3>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}<span className="text-sm ml-1 opacity-50 font-bold">{lang === 'ar' ? 'ج.م' : 'EGP'}</span></p>
                    </div>
                ))}
            </div>

            {/* Comparative Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 card-primary !p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{lang === 'ar' ? 'مقارنة المبيعات الأسبوعية' : 'Weekly Sales Comparison'}</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'أداء الفروع الكبرى' : 'Top branches revenue performance'}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-black text-slate-400">
                            <Calendar size={14} /> {timeRange}
                        </div>
                    </div>
                    <div className="h-80 w-full min-h-[320px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <AreaChart data={COMPARATIVE_DATA}>
                                <defs>
                                    <linearGradient id="colorZayed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMaadi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                                <Area type="monotone" dataKey="zayed" name="Zayed Branch" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorZayed)" />
                                <Area type="monotone" dataKey="maadi" name="Maadi Branch" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMaadi)" />
                                <Area type="monotone" dataKey="october" name="October Branch" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.3} fill="#f59e0b" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card-primary !p-6">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">{lang === 'ar' ? 'حالة الفروع' : 'Branch Health'}</h3>
                    <div className="space-y-4">
                        {branches.map(branch => (
                            <div key={branch.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group cursor-pointer hover:border-indigo-400 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-xs text-slate-800 dark:text-white uppercase tracking-tight">{branch.name}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">{branch.location}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-indigo-600 uppercase">98% Load</p>
                                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                        <div className="w-4/5 h-full bg-indigo-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button className="w-full py-4 text-[10px] font-black uppercase text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl hover:text-indigo-600 hover:border-indigo-400 transition-all">
                            View Live Map
                        </button>
                    </div>
                </div>
            </div>

            {/* Item Performance Comparison */}
            <div className="card-primary !p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{lang === 'ar' ? 'تحليل المبيعات لكل فرع' : 'Branch-wise Sales Analysis'}</h3>
                    <button className="text-xs font-black text-indigo-600 uppercase hover:underline">Export Full Report</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest">
                                <th className="px-6 py-4">Branch</th>
                                <th className="px-6 py-4">Gross Revenue</th>
                                <th className="px-6 py-4">Direct Sales</th>
                                <th className="px-6 py-4">Delivery</th>
                                <th className="px-6 py-4">Inventory Cost</th>
                                <th className="px-6 py-4">Net Margin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {branches.map(branch => (
                                <tr key={branch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-black text-sm text-slate-800 dark:text-white uppercase">{branch.name}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">125,000 ج.م</td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">85,000</td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">40,000</td>
                                    <td className="px-6 py-4 font-bold text-rose-500">15%</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-black uppercase tracking-widest">22% Peak</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
