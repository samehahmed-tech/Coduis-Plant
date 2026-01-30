
import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { getBusinessInsights } from '../services/geminiService';

const data = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 6390 },
  { name: 'Sun', revenue: 5490 },
];

const categoryData = [
  { name: 'Starters', value: 400 },
  { name: 'Mains', value: 300 },
  { name: 'Drinks', value: 300 },
  { name: 'Desserts', value: 200 },
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981'];

interface DashboardProps {
  isDarkMode?: boolean;
  t: any;
  lang: 'en' | 'ar';
  onChangeView: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode = false, t, lang, onChangeView }) => {
  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    handleGenerateInsight();
  }, []);

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    setIsError(false);
    const salesSummary = { weeklyTotal: 25550, topDay: 'Saturday', trend: 'Upward' };
    const lowStock = ['Tomatoes', 'Ribeye Steak', 'Red Wine'];
    const result = await getBusinessInsights(salesSummary, lowStock, lang);

    // Simple check to see if the result contains keywords indicating a quota error
    if (result.toLowerCase().includes("quota") || result.includes("حصة الاستخدام")) {
      setIsError(true);
    }

    setInsight(result);
    setLoadingInsight(false);
  };

  const chartTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
    borderColor: isDarkMode ? '#334155' : '#fff',
    color: isDarkMode ? '#f8fafc' : '#1e293b',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    textAlign: lang === 'ar' ? 'right' : 'left' as any
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.dashboard}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">{lang === 'ar' ? 'أهلاً بك مرة أخرى، المدير' : 'Welcome back, Manager.'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateInsight}
            className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
          >
            <Sparkles size={16} />
            {loadingInsight ? (lang === 'ar' ? 'جارِ التحليل...' : 'Analyzing...') : (lang === 'ar' ? 'تحديث الرؤى' : 'Refresh Insights')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t.total_rev, value: (lang === 'ar' ? '٢٥,٥٥٠ ج.م' : '$25,550'), icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' },
          { label: t.orders, value: '1,245', icon: ShoppingBag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20' },
          { label: t.tables, value: '12/20', icon: Users, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20' },
          { label: t.growth, value: '+15%', icon: TrendingUp, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/20' },
        ].map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3.5 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights Section */}
      <div className={`rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/10 border border-white/10 transition-all duration-500 ${isError ? 'bg-gradient-to-r from-red-600 to-amber-700' : 'bg-gradient-to-r from-indigo-600 to-purple-700'}`}>
        <div className="flex items-start gap-5">
          <div className={`p-4 rounded-2xl backdrop-blur-md ${isError ? 'bg-white/10' : 'bg-white/20'}`}>
            {isError ? <AlertCircle className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black mb-3 tracking-tight">
              {isError
                ? (lang === 'ar' ? 'تنبيه: حصة الاستخدام' : 'System Alert: Quota Exceeded')
                : (lang === 'ar' ? 'رؤى محلل الأعمال الذكي' : 'AI Business Analyst Insights')}
            </h3>
            {loadingInsight ? (
              <div className="animate-pulse space-y-3">
                <div className="h-3 bg-white/30 rounded-full w-3/4"></div>
                <div className="h-3 bg-white/30 rounded-full w-full"></div>
                <div className="h-3 bg-white/30 rounded-full w-2/3"></div>
              </div>
            ) : (
              <div className="text-white/90 text-sm leading-loose whitespace-pre-line font-medium italic">
                {insight}
              </div>
            )}
            {!loadingInsight && !isError && (
              <button
                onClick={() => onChangeView('AI_INSIGHTS')}
                className="mt-6 flex items-center gap-2 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                {lang === 'ar' ? 'عرض التحليل التفصيلي' : 'View Detailed Analysis'}
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-black text-slate-800 dark:text-white mb-8 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" />
            {lang === 'ar' ? 'نظرة عامة على الإيرادات' : 'Revenue Overview'}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 700 }} orientation={lang === 'ar' ? 'top' : 'bottom' as any} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 700 }} orientation={lang === 'ar' ? 'right' : 'left' as any} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9' }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-black text-slate-800 dark:text-white mb-8">
            {lang === 'ar' ? 'المبيعات حسب الفئة' : 'Sales by Category'}
          </h3>
          <div className="h-80 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="220">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-8">
              {categoryData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
