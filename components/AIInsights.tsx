import React, { useState, useEffect, useMemo } from 'react';
import {
    Sparkles, TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
    ArrowRight, RefreshCw, PieChart, BarChart3, DollarSign, Package,
    Users, ShoppingBag, Activity, Zap, Brain, Target, Shield,
    Clock, Award, ChevronRight, Layers, Scale
} from 'lucide-react';
import { aiApi } from '../services/api/ai';
import { reportsApi } from '../services/api/reports';

import { useMenuStore } from '../stores/useMenuStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useAuthStore } from '../stores/useAuthStore';
import { translations } from '../services/translations';

type AnalysisTab = 'overview' | 'menu' | 'supply' | 'operations';

const TABS: { id: AnalysisTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Health Score', icon: Activity },
    { id: 'menu', label: 'Menu Engineering', icon: BarChart3 },
    { id: 'supply', label: 'Supply Forecast', icon: TrendingUp },
    { id: 'operations', label: 'Operations', icon: Target },
];

const AIInsights: React.FC = () => {
    const { categories } = useMenuStore();
    const { inventory } = useInventoryStore();
    const { orders } = useOrderStore();
    const { settings } = useAuthStore();

    const menuItems = categories.flatMap(cat => cat.items);
    const lang = (settings.language || 'en') as 'en' | 'ar';
    const t = translations[lang] || translations['en'];

    const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
    const [menuAnalysis, setMenuAnalysis] = useState('');
    const [inventoryForecast, setInventoryForecast] = useState('');
    const [operationsInsight, setOperationsInsight] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

    // Computed business metrics
    const metrics = useMemo(() => {
        const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
        const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;
        const lowStockItems = inventory.filter(i => {
            const qty = i.warehouseQuantities?.reduce((s: number, w: any) => s + w.quantity, 0) || 0;
            return qty <= (i.threshold || 0);
        }).length;
        const totalItems = menuItems.length;
        const totalCategories = categories.length;
        const totalOrders = orders.length;
        const compositeItems = inventory.filter(i => i.isComposite).length;
        const uniqueCustomers = new Set(orders.map(o => o.customerId).filter(Boolean)).size;

        // Health score calculation
        const menuScore = totalItems > 10 ? 25 : totalItems * 2.5;
        const inventoryScore = lowStockItems === 0 ? 25 : Math.max(0, 25 - lowStockItems * 3);
        const salesScore = totalOrders > 50 ? 25 : totalOrders * 0.5;
        const diversityScore = totalCategories > 5 ? 25 : totalCategories * 5;
        const healthScore = Math.min(100, Math.round(menuScore + inventoryScore + salesScore + diversityScore));

        return { totalRevenue, avgTicket, lowStockItems, totalItems, totalCategories, totalOrders, compositeItems, uniqueCustomers, healthScore };
    }, [orders, inventory, menuItems, categories]);

    const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const [menuRes, invRes, opsRes] = await Promise.all([
                aiApi.chat({ message: lang === 'ar' ? 'اعمل تحليل هندسة منيو مختصر من 4 نقاط عملية مع نصائح لزيادة المبيعات.' : 'Provide a concise menu engineering analysis in 4 actionable points with upselling strategies.', lang, context: { menuItems, orders, categories, inventory } }),
                aiApi.chat({ message: lang === 'ar' ? 'اعمل توقع مخزون مختصر مع العناصر المعرضة للنفاد واقتراحات إعادة الطلب والجدول الزمني.' : 'Provide a short inventory forecast with at-risk items, restock suggestions, and timeline recommendations.', lang, context: { inventory, orders, menuItems, categories } }),
                aiApi.chat({ message: lang === 'ar' ? 'حلل كفاءة العمليات التشغيلية وقدم 3 توصيات لتحسين الأداء والربحية.' : 'Analyze operational efficiency and provide 3 specific recommendations to improve performance and profitability.', lang, context: { orders, menuItems, inventory, categories } }),
            ]);
            setMenuAnalysis(menuRes.text || '');
            setInventoryForecast(invRes.text || '');
            setOperationsInsight(opsRes.text || '');
            setLastAnalyzed(new Date());
        } catch (error) { console.error("AI Analysis Error:", error); }
        finally { setIsAnalyzing(false); }
    };

    useEffect(() => { runAnalysis(); }, []);

    const getHealthColor = (score: number) => {
        if (score >= 80) return { text: 'text-emerald-500', bg: 'bg-emerald-500/10', gradient: 'from-emerald-500 to-teal-500', label: 'Excellent' };
        if (score >= 60) return { text: 'text-blue-500', bg: 'bg-blue-500/10', gradient: 'from-blue-500 to-indigo-500', label: 'Good' };
        if (score >= 40) return { text: 'text-amber-500', bg: 'bg-amber-500/10', gradient: 'from-amber-500 to-orange-500', label: 'Fair' };
        return { text: 'text-rose-500', bg: 'bg-rose-500/10', gradient: 'from-rose-500 to-red-500', label: 'Critical' };
    };

    const health = getHealthColor(metrics.healthScore);

    return (
        <div className="p-4 md:p-8 lg:p-10 bg-app min-h-screen pb-24">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-violet-600/30">
                            <Brain size={28} />
                        </div>
                        <h2 className="text-3xl font-black text-main uppercase tracking-tighter">AI Business Intelligence</h2>
                    </div>
                    <p className="text-muted font-bold text-xs uppercase tracking-widest opacity-60">
                        Menu Engineering · Supply Forecast · Operational Analysis
                        {lastAnalyzed && <span className="ml-3 text-[9px] normal-case opacity-40">Last: {lastAnalyzed.toLocaleTimeString()}</span>}
                    </p>
                </div>
                <button onClick={runAnalysis} disabled={isAnalyzing}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50">
                    <RefreshCw size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                    {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
                {[
                    { label: 'Revenue', value: `${(metrics.totalRevenue / 1000).toFixed(1)}K`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Orders', value: metrics.totalOrders, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Avg Ticket', value: `${metrics.avgTicket.toFixed(0)}`, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { label: 'Menu Items', value: metrics.totalItems, icon: Layers, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                    { label: 'Categories', value: metrics.totalCategories, icon: PieChart, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                    { label: 'Composites', value: metrics.compositeItems, icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Low Stock', value: metrics.lowStockItems, icon: AlertTriangle, color: metrics.lowStockItems > 0 ? 'text-rose-500' : 'text-emerald-500', bg: metrics.lowStockItems > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10' },
                    { label: 'Customers', value: metrics.uniqueCustomers, icon: Users, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="card-primary border border-border p-4 rounded-[1.5rem] shadow-sm">
                        <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}><stat.icon size={14} /></div>
                        <p className="text-[7px] font-black text-muted uppercase tracking-widest mb-0.5">{stat.label}</p>
                        <h4 className="text-lg font-black text-main">{stat.value}</h4>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mb-8 bg-elevated/40 p-1.5 rounded-2xl border border-border w-fit">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20' : 'text-muted hover:text-main hover:bg-elevated/60'}`}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════════ HEALTH SCORE TAB ═══════════ */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Health Score Card */}
                        <div className="card-primary border border-border rounded-[2.5rem] p-8 shadow-sm text-center lg:col-span-1">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-6">Business Health Score</h3>
                            <div className="relative w-40 h-40 mx-auto mb-6">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
                                    <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" strokeLinecap="round"
                                        className={health.text} strokeDasharray={`${metrics.healthScore * 3.14} 314`}
                                        style={{ transition: 'stroke-dasharray 1.5s ease-in-out' }} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-4xl font-black ${health.text}`}>{metrics.healthScore}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted">/ 100</span>
                                </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${health.bg} ${health.text}`}>{health.label}</span>
                        </div>

                        {/* Score Breakdown */}
                        <div className="card-primary border border-border rounded-[2.5rem] p-8 shadow-sm lg:col-span-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-6">Health Breakdown</h3>
                            <div className="space-y-5">
                                {[
                                    { label: 'Menu Diversity', score: metrics.totalItems > 10 ? 25 : Math.round(metrics.totalItems * 2.5), max: 25, icon: Layers, color: 'bg-violet-500', tip: `${metrics.totalItems} items across ${metrics.totalCategories} categories` },
                                    { label: 'Inventory Health', score: metrics.lowStockItems === 0 ? 25 : Math.max(0, Math.round(25 - metrics.lowStockItems * 3)), max: 25, icon: Package, color: 'bg-emerald-500', tip: `${metrics.lowStockItems} items below threshold` },
                                    { label: 'Sales Volume', score: metrics.totalOrders > 50 ? 25 : Math.round(metrics.totalOrders * 0.5), max: 25, icon: ShoppingBag, color: 'bg-blue-500', tip: `${metrics.totalOrders} total orders processed` },
                                    { label: 'Category Balance', score: metrics.totalCategories > 5 ? 25 : Math.round(metrics.totalCategories * 5), max: 25, icon: PieChart, color: 'bg-amber-500', tip: `${metrics.totalCategories} active categories` },
                                ].map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <item.icon size={14} className="text-muted" />
                                                <span className="text-xs font-black text-main uppercase tracking-widest">{item.label}</span>
                                            </div>
                                            <span className="text-xs font-black text-muted">{item.score}/{item.max}</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${(item.score / item.max) * 100}%` }} />
                                        </div>
                                        <p className="text-[9px] text-muted mt-1">{item.tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { title: 'Revenue Intelligence', desc: metrics.totalRevenue > 0 ? `Average ticket of ${metrics.avgTicket.toFixed(0)} across ${metrics.totalOrders} orders` : 'No revenue data yet — start processing orders', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { title: 'Inventory Alert', desc: metrics.lowStockItems > 0 ? `${metrics.lowStockItems} items below reorder threshold — action needed` : 'All inventory levels are optimal', icon: AlertTriangle, color: metrics.lowStockItems > 0 ? 'text-rose-500' : 'text-emerald-500', bg: metrics.lowStockItems > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10' },
                            { title: 'Customer Base', desc: metrics.uniqueCustomers > 0 ? `${metrics.uniqueCustomers} unique customers engaged` : 'Build your customer base through CRM', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        ].map((insight, i) => (
                            <div key={i} className="card-primary border border-border rounded-[2rem] p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl ${insight.bg} ${insight.color} flex items-center justify-center`}><insight.icon size={18} /></div>
                                    <h4 className="text-xs font-black text-main uppercase tracking-widest">{insight.title}</h4>
                                </div>
                                <p className="text-xs text-muted font-bold leading-relaxed">{insight.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════ MENU ENGINEERING TAB ═══════════ */}
            {activeTab === 'menu' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                    <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border bg-elevated/30 flex items-center justify-between">
                            <h3 className="text-lg font-black text-main uppercase tracking-tight flex items-center gap-2">
                                <BarChart3 size={18} className="text-indigo-500" /> AI Menu Engineering Analysis
                            </h3>
                            <div className="flex items-center gap-2 text-[9px] font-black text-muted">
                                <Sparkles size={12} className="text-violet-500" /> Powered by AI
                            </div>
                        </div>
                        <div className="p-8">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <RefreshCw className="animate-spin text-indigo-600" size={32} />
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest animate-pulse">Consulting AI Model...</p>
                                </div>
                            ) : (
                                <div className="p-6 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/5 dark:to-violet-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Lightbulb size={18} className="text-amber-500" />
                                        <span className="text-xs font-black text-muted uppercase tracking-widest">Strategic Menu Insights</span>
                                    </div>
                                    <p className="text-sm text-main leading-relaxed font-medium whitespace-pre-wrap">{menuAnalysis || 'Click "Run Analysis" to generate AI-powered menu insights.'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Menu Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Items', value: metrics.totalItems, icon: Layers, color: 'text-violet-500' },
                            { label: 'Categories', value: metrics.totalCategories, icon: PieChart, color: 'text-blue-500' },
                            { label: 'Composite/BOM', value: metrics.compositeItems, icon: Package, color: 'text-amber-500' },
                            { label: 'Active Orders', value: metrics.totalOrders, icon: ShoppingBag, color: 'text-emerald-500' },
                        ].map((s, i) => (
                            <div key={i} className="card-primary border border-border p-5 rounded-[1.5rem] shadow-sm">
                                <s.icon size={16} className={`${s.color} mb-2`} />
                                <p className="text-[8px] font-black text-muted uppercase tracking-widest">{s.label}</p>
                                <h4 className="text-2xl font-black text-main">{s.value}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════ SUPPLY FORECAST TAB ═══════════ */}
            {activeTab === 'supply' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                    <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border bg-elevated/30 flex items-center justify-between">
                            <h3 className="text-lg font-black text-main uppercase tracking-tight flex items-center gap-2">
                                <TrendingUp size={18} className="text-emerald-500" /> AI Supply Chain Forecast
                            </h3>
                            <div className="flex items-center gap-2 text-[9px] font-black text-muted">
                                <Sparkles size={12} className="text-violet-500" /> Powered by AI
                            </div>
                        </div>
                        <div className="p-8">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <RefreshCw className="animate-spin text-emerald-600" size={32} />
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest animate-pulse">Running Simulation...</p>
                                </div>
                            ) : (
                                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp size={18} className="text-emerald-500" />
                                        <span className="text-xs font-black text-muted uppercase tracking-widest">Procurement Intelligence</span>
                                    </div>
                                    <p className="text-sm text-main leading-relaxed font-medium whitespace-pre-wrap">{inventoryForecast || 'Click "Run Analysis" to generate AI-powered supply forecasts.'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Low Stock Items */}
                    {metrics.lowStockItems > 0 && (
                        <div className="card-primary border border-rose-200 dark:border-rose-500/20 rounded-[2rem] p-6 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2"><AlertTriangle size={14} /> Items Below Threshold ({metrics.lowStockItems})</h3>
                            <div className="space-y-2">
                                {inventory.filter(i => {
                                    const qty = i.warehouseQuantities?.reduce((s: number, w: any) => s + w.quantity, 0) || 0;
                                    return qty <= (i.threshold || 0);
                                }).slice(0, 8).map((item, i) => {
                                    const qty = item.warehouseQuantities?.reduce((s: number, w: any) => s + w.quantity, 0) || 0;
                                    return (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10">
                                            <span className="text-xs font-bold text-main">{item.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-rose-500">{qty} {item.unit}</span>
                                                <span className="text-[10px] text-muted">(min: {item.threshold})</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ OPERATIONS TAB ═══════════ */}
            {activeTab === 'operations' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                    <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border bg-elevated/30 flex items-center justify-between">
                            <h3 className="text-lg font-black text-main uppercase tracking-tight flex items-center gap-2">
                                <Target size={18} className="text-amber-500" /> AI Operations Analysis
                            </h3>
                            <div className="flex items-center gap-2 text-[9px] font-black text-muted">
                                <Sparkles size={12} className="text-violet-500" /> Powered by AI
                            </div>
                        </div>
                        <div className="p-8">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <RefreshCw className="animate-spin text-amber-600" size={32} />
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest animate-pulse">Analyzing Operations...</p>
                                </div>
                            ) : (
                                <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Zap size={18} className="text-amber-500" />
                                        <span className="text-xs font-black text-muted uppercase tracking-widest">Efficiency Recommendations</span>
                                    </div>
                                    <p className="text-sm text-main leading-relaxed font-medium whitespace-pre-wrap">{operationsInsight || 'Click "Run Analysis" to generate operational efficiency insights.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CTA Banner */}
            <div className="mt-10 p-8 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-violet-600/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-elevated/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative">
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3"><Brain size={24} /> AI Analysis Report</h3>
                    <p className="text-violet-100 font-bold text-[10px] tracking-[0.2em] uppercase opacity-70">Autonomous business optimization engine · Real-time intelligence</p>
                </div>
                <button onClick={runAnalysis} disabled={isAnalyzing}
                    className="relative bg-white text-violet-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-violet-50 transition-all flex items-center gap-3 shadow-xl disabled:opacity-50">
                    {isAnalyzing ? 'Analyzing...' : 'Full System Scan'} <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default AIInsights;
