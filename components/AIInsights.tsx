
import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Lightbulb,
    ArrowRight,
    RefreshCw,
    PieChart,
    BarChart3
} from 'lucide-react';
import { analyzeMenuEngineering, forecastInventory } from '../services/geminiService';

// Stores
import { useMenuStore } from '../stores/useMenuStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useAuthStore } from '../stores/useAuthStore';

// Services
import { translations } from '../services/translations';

const AIInsights: React.FC = () => {
    const { categories } = useMenuStore();
    const { inventory } = useInventoryStore();
    const { orders } = useOrderStore();
    const { settings } = useAuthStore();

    const menuItems = categories.flatMap(cat => cat.items);
    const lang = (settings.language || 'en') as 'en' | 'ar';
    const t = translations[lang] || translations['en'];

    const [menuAnalysis, setMenuAnalysis] = useState<string>('');
    const [inventoryForecast, setInventoryForecast] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const menuRes = await analyzeMenuEngineering(menuItems, orders);
            setMenuAnalysis(menuRes);
            const invRes = await forecastInventory(inventory, orders);
            setInventoryForecast(invRes);
        } catch (error) {
            console.error("AI Analysis Error:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        runAnalysis();
    }, []);

    return (
        <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Sparkles className="text-indigo-600 animate-pulse" /> AI Business Intelligence
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-semibold italic">Deep-learning analysis of your operations, menu, and supply chain.</p>
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={18} className={isAnalyzing ? 'animate-spin' : ''} />
                    {isAnalyzing ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing System...') : (lang === 'ar' ? 'تحديث التحليل' : 'Re-Run Intelligence')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Menu Engineering Analysis */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <BarChart3 size={24} className="text-indigo-600" /> Menu Engineering
                        </h3>
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                            <PieChart size={18} className="text-slate-400" />
                        </div>
                    </div>
                    <div className="p-8 flex-1">
                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                <RefreshCw className="animate-spin text-indigo-600" size={32} />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Consulting AI Model...</p>
                            </div>
                        ) : (
                            <div className="prose dark:prose-invert max-w-none">
                                <div className="p-6 bg-slate-50 dark:bg-indigo-900/10 rounded-3xl border border-slate-100 dark:border-indigo-800/30">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Lightbulb className="text-amber-500" size={20} />
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Insights</span>
                                    </div>
                                    <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{menuAnalysis || "Analysis not available at this moment."}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Supply Chain & Forecast Analysis */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <TrendingUp size={24} className="text-emerald-600" /> Supply & Forecast
                        </h3>
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                            <AlertTriangle size={18} className="text-amber-500" />
                        </div>
                    </div>
                    <div className="p-8 flex-1">
                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                <RefreshCw className="animate-spin text-emerald-600" size={32} />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Running Simulation...</p>
                            </div>
                        ) : (
                            <div className="prose dark:prose-invert max-w-none">
                                <div className="p-6 bg-slate-50 dark:bg-emerald-900/10 rounded-3xl border border-slate-100 dark:border-emerald-800/30">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp className="text-emerald-500" size={20} />
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Procurement Logic</span>
                                    </div>
                                    <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{inventoryForecast || "Simulation results pending data stream."}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-10 p-10 bg-indigo-600 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-indigo-600/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />
                <div className="relative">
                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">RestoFlow Intelligence 2026</h3>
                    <p className="text-indigo-100 font-bold max-w-lg opacity-80 uppercase text-[10px] tracking-[0.2em]">Autonomous business optimization engine enabled.</p>
                </div>
                <button className="relative bg-white text-indigo-600 px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all flex items-center gap-3 shadow-xl">
                    View Strategic Roadmap <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default AIInsights;
