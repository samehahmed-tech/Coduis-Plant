import React, { useState } from 'react';
import {
    Megaphone,
    Ticket,
    Users,
    TrendingUp,
    Plus,
    Calendar,
    Mail,
    MessageSquare,
    Percent,
    ChevronRight,
    Filter,
    BarChart2,
    Clock
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { translations } from '../services/translations';

const CampaignHub: React.FC = () => {
    const { settings } = useAuthStore();
    const lang = settings.language || 'en';
    const t = translations[lang];

    const [campaigns] = useState([
        { id: 1, name: 'Ramadan 2026 Offer', status: 'ACTIVE', outreach: 12400, conversions: 850, method: 'SMS', discount: '20%' },
        { id: 2, name: 'Miss You Trigger (30d)', status: 'AUTOMATED', outreach: 450, conversions: 45, method: 'Email', discount: 'Free Dessert' },
        { id: 3, name: 'Weekend Surge', status: 'SCHEDULED', outreach: 0, conversions: 0, method: 'Push', discount: '15%' },
    ]);

    return (
        <div className="p-4 md:p-8 lg:p-12 bg-app min-h-screen pb-24">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                            <Megaphone size={32} />
                        </div>
                        <h2 className="text-4xl font-black text-main uppercase tracking-tighter italic">
                            {lang === 'ar' ? 'الحملات التسويقية' : 'Marketing Campaigns'}
                        </h2>
                    </div>
                    <p className="text-muted font-bold text-sm uppercase tracking-widest opacity-60 flex items-center gap-2">
                        {lang === 'ar' ? 'محرك الأتمتة والولاء الذكي' : 'Intelligent Automation & Loyalty Engine'}
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </p>
                </div>

                <button className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-[1.5rem] shadow-2xl shadow-primary/30 font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all">
                    <Plus size={18} />
                    {lang === 'ar' ? 'إطلاق حملة' : 'Blast Campaign'}
                </button>
            </div>

            {/* Performance Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Reach', value: '45.2K', sub: '+12% this month', icon: Users, color: 'text-blue-500' },
                    { label: 'Conversions', value: '3,840', sub: '8.5% rate', icon: TrendingUp, color: 'text-emerald-500' },
                    { label: 'Revenue Generated', value: '142K ج.م', sub: 'From campaigns only', icon: BarChart2, color: 'text-amber-500' },
                    { label: 'Active Coupons', value: '12', sub: '6 expiring soon', icon: Ticket, color: 'text-rose-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card border border-border p-8 rounded-[2rem] shadow-sm hover:border-primary/20 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl bg-app ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">LIVE</span>
                        </div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className="text-2xl font-black text-main uppercase">{stat.value}</h4>
                        <p className="text-[10px] font-bold text-muted mt-2 opacity-50">{stat.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Active Campaigns List */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black text-main uppercase tracking-tight flex items-center gap-3">
                            <Calendar className="text-primary" />
                            {lang === 'ar' ? 'إدارة الحملات' : 'Campaign Management'}
                        </h3>
                        <div className="flex items-center gap-3">
                            <button className="p-2 text-muted hover:text-main transition-colors"><Filter size={18} /></button>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-elevated/50 text-muted text-[10px] font-black uppercase tracking-widest border-b border-border">
                                    <th className="px-8 py-5">Campaign Name</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5">Channel</th>
                                    <th className="px-6 py-5">Conversions</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {campaigns.map(cp => (
                                    <tr key={cp.id} className="hover:bg-elevated/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-app flex items-center justify-center text-primary border border-border">
                                                    {cp.method === 'SMS' ? <MessageSquare size={18} /> : cp.method === 'Email' ? <Mail size={18} /> : <Megaphone size={18} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-main uppercase">{cp.name}</p>
                                                    <p className="text-[10px] font-bold text-muted uppercase tracking-tighter mt-0.5">Benefit: {cp.discount}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${cp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : cp.status === 'AUTOMATED' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted/10 text-muted'}`}>
                                                {cp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 font-bold text-xs text-muted">{cp.method}</td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-app rounded-full w-24 overflow-hidden">
                                                    <div className="h-full bg-emerald-500 w-2/3" />
                                                </div>
                                                <span className="text-[10px] font-black text-main">{cp.conversions}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="text-muted hover:text-primary transition-all">
                                                <ChevronRight size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Automation Triggers & Loyalty */}
                <div className="space-y-8">
                    <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8">
                            <Clock className="text-amber-500" />
                            <h3 className="text-lg font-black text-main uppercase tracking-tight">{lang === 'ar' ? 'محفزات الأتمتة' : 'Automation Triggers'}</h3>
                        </div>

                        <div className="space-y-4">
                            {[
                                { name: 'Welcome Offer', icon: Users, delay: 'Instant', status: true },
                                { name: 'Dormant Customer', icon: MessageSquare, delay: '30 Days', status: true },
                                { name: 'Birthday Treat', icon: Percent, delay: 'On Date', status: false },
                            ].map((trigger, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-app rounded-2xl border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <trigger.icon size={16} className="text-muted" />
                                        <div>
                                            <p className="text-[10px] font-black text-main uppercase">{trigger.name}</p>
                                            <p className="text-[9px] font-bold text-muted">Delay: {trigger.delay}</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-all ${trigger.status ? 'bg-emerald-500' : 'bg-muted/20'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${trigger.status ? 'right-1' : 'left-1'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                                <Users size={28} />
                            </div>
                            <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-all">
                                <Plus size={16} />
                            </button>
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tighter mb-2">{lang === 'ar' ? 'فئات الولاء' : 'Loyalty Segments'}</h4>
                        <p className="text-xs font-bold opacity-70 mb-8 leading-relaxed">
                            {lang === 'ar' ? 'تصنيف العملاء بناءً على سلوك الشراء' : 'Automatically group customers by purchase behavior & lifetime value.'}
                        </p>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-all">
                                <span className="text-[10px] font-black uppercase">Platinum (VIP)</span>
                                <span className="text-[10px] font-bold opacity-80">140 Profiles</span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-xl border border-white/5 opacity-50">
                                <span className="text-[10px] font-black uppercase">Dormant</span>
                                <span className="text-[10px] font-bold opacity-80">2,401 Profiles</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignHub;
