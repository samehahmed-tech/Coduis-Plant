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
import { MenuItem, InventoryItem, Order } from '../types';

interface AIInsightsProps {
    menuItems: MenuItem[];
    inventory: InventoryItem[];
    orders: Order[];
    lang: 'en' | 'ar';
    t: any;
}

const AIInsights: React.FC<AIInsightsProps> = ({ menuItems, inventory, orders, lang, t }) => {
    const [menuAnalysis, setMenuAnalysis] = useState<string>('');
    const [inventoryForecast, setInventoryForecast] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const [menuRes, invRes] = await Promise.all([
                analyzeMenuEngineering(menuItems, orders.slice(-50), lang),
                forecastInventory(inventory, orders.slice(-100), lang)
            ]);
            setMenuAnalysis(menuRes);
            setInventoryForecast(invRes);
        } catch (error) {
            console.error("AI Analysis Error:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        if (menuItems.length > 0) runAnalysis();
    }, []);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Sparkles className="text-indigo-600 animate-pulse" size={32} />
                        {lang === 'ar' ? 'تحليلات الذكاء الاصطناعي' : 'AI Business Insights'}
                    </h2>
                    <p className="text-slate-500 font-bold mt-1">
                        {lang === 'ar' ? 'رؤى ذكية لمساعدتك في اتخاذ قرارات أفضل' : 'Smart insights to help you make better data-driven decisions'}
                    </p>
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                >
                    <RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />
                    {isAnalyzing ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...') : (lang === 'ar' ? 'تحديث التحليل' : 'Refresh Insights')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Menu Engineering Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{lang === 'ar' ? 'هندسة المنيو' : 'Menu Engineering'}</h3>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Stars vs. Dogs Analysis</p>
                            </div>
                        </div>
                        <PieChart className="text-slate-200 dark:text-slate-700" size={40} />
                    </div>
                    <div className="p-8 flex-1 prose dark:prose-invert max-w-none">
                        {isAnalyzing ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-3/4"></div>
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-5/6"></div>
                            </div>
                        ) : (
                            <div className={`text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium ${lang === 'ar' ? 'text-right' : ''}`}>
                                {menuAnalysis}
                            </div>
                        )}
                    </div>
                </div>

                {/* Inventory Forecasting Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{lang === 'ar' ? 'توقعات المخزون' : 'Inventory Forecast'}</h3>
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Predictive Stock-out Alerts</p>
                            </div>
                        </div>
                        <BarChart3 className="text-slate-200 dark:text-slate-700" size={40} />
                    </div>
                    <div className="p-8 flex-1 prose dark:prose-invert max-w-none">
                        {isAnalyzing ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-3/4"></div>
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-5/6"></div>
                            </div>
                        ) : (
                            <div className={`text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium ${lang === 'ar' ? 'text-right' : ''}`}>
                                {inventoryForecast}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actionable Tips */}
            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-2 max-w-2xl text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <Lightbulb className="text-amber-300" size={28} />
                            <h3 className="text-2xl font-black uppercase tracking-tight">{lang === 'ar' ? 'نصيحة ذكية للنمو' : 'Smart Growth Tip'}</h3>
                        </div>
                        <p className="text-indigo-100 text-lg font-medium">
                            {lang === 'ar'
                                ? 'بناءً على تحليلات اليوم، نقترح عليك عمل عرض ترويجي على "أجنحة الدجاج" لزيادة مبيعاتها بنسبة 15٪ حيث أنها صنف "Puzzle" (ربح عالي ولكن شهرة منخفضة).'
                                : 'Based on today\'s analysis, we suggest running a promotion on "Chicken Wings" to boost sales by 15% as it is a "Puzzle" item (High profit but low popularity).'}
                        </p>
                    </div>
                    <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group-hover:shadow-2xl">
                        {lang === 'ar' ? 'طبق العرض الآن' : 'Apply Promo Now'}
                        <ArrowRight size={20} />
                    </button>
                </div>
                {/* Decorative circle */}
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
            </div>
        </div>
    );
};

export default AIInsights;
