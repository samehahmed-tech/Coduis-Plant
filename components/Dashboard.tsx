
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
import SensitiveData from './SensitiveData';
import { AppPermission } from '../types';
import { DollarSign, ShoppingBag, Users, TrendingUp, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { getBusinessInsights } from '../services/geminiService';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { translations } from '../services/translations';

const DAILY_DATA = [
  { name: '08 AM', revenue: 400 },
  { name: '10 AM', revenue: 1200 },
  { name: '12 PM', revenue: 3500 },
  { name: '02 PM', revenue: 4200 },
  { name: '04 PM', revenue: 2800 },
  { name: '06 PM', revenue: 5600 },
  { name: '08 PM', revenue: 7200 },
  { name: '10 PM', revenue: 4800 },
];

const WEEKLY_DATA = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 6390 },
  { name: 'Sun', revenue: 5490 },
];

const ITEM_PERFORMANCE = [
  { name: 'Pizza', sales: 450, growth: 12 },
  { name: 'Burger', sales: 380, growth: -5 },
  { name: 'Salad', sales: 290, growth: 20 },
  { name: 'Steak', sales: 210, growth: 8 },
  { name: 'Pasta', sales: 180, growth: 15 },
];

const STAFF_PERFORMANCE = [
  { name: 'Ahmed S.', orders: 145, rating: 4.8 },
  { name: 'Sarah M.', orders: 132, rating: 4.9 },
  { name: 'John D.', orders: 110, rating: 4.5 },
  { name: 'Maria K.', orders: 98, rating: 4.7 },
];

const ACTIVE_CUSTOMERS = [
  { name: 'Sameh Ahmed', visits: 12, totalSpent: 4500 },
  { name: 'Fatima Z.', visits: 8, totalSpent: 2800 },
  { name: 'Omar K.', visits: 6, totalSpent: 1900 },
];

const categoryData = [
  { name: 'Starters', value: 400 },
  { name: 'Mains', value: 800 },
  { name: 'Drinks', value: 300 },
  { name: 'Desserts', value: 200 },
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

const Dashboard: React.FC = () => {
  const { settings, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const { language: lang, isDarkMode } = settings;

  // Re-create t object for compatibility with existing JSX
  const t = {
    total_rev: lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
    orders: lang === 'ar' ? 'الطلبات' : 'Orders',
    // Add generic fallback or other keys if needed dynamic
  };

  const getT = (key: string) => translate(key, lang);

  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [isError, setIsError] = useState(false);
  const [viewScope, setViewScope] = useState<'DAILY' | 'COMPREHENSIVE'>('DAILY');
  const [dateRange, setDateRange] = useState('Today');

  useEffect(() => {
    handleGenerateInsight();
  }, []);

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    setIsError(false);
    const salesSummary = { weeklyTotal: 25550, topDay: 'Saturday', trend: 'Upward' };
    const lowStock = ['Tomatoes', 'Ribeye Steak', 'Red Wine'];
    const result = await getBusinessInsights(salesSummary, lowStock, lang, settings.geminiApiKey);

    // Simple check to see if the result contains keywords indicating a quota error
    if (result.toLowerCase().includes("quota") || result.includes("حصة الاستخدام")) {
      setIsError(true);
    }

    setInsight(result);
    setLoadingInsight(false);
  };

  // Dynamic theme colors for charts
  const primaryColor = `rgb(var(--primary))`;
  const chartTextColor = isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const gridColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  const tooltipStyle = {
    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(var(--border-color), 0.2)',
    color: 'rgb(var(--text-main))',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(var(--border-color), 0.1)',
    textAlign: lang === 'ar' ? 'right' : 'left' as any
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in transition-colors duration-200 min-h-screen pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="heading-lg text-slate-800 dark:text-white uppercase flex items-center gap-3">
            {viewScope === 'DAILY' ? (lang === 'ar' ? 'البث المباشر لليوم' : 'Today\'s Live Feed') : (lang === 'ar' ? 'نظرة شاملة' : 'Global Overview')}
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
            {viewScope === 'DAILY' ? (lang === 'ar' ? 'متابعة حية للأداء اليومي' : 'Real-time performance metrics') : (lang === 'ar' ? 'تحليل معمق للأداء العام' : 'Deep-dive into historical performance')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* View Scope Toggle */}
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewScope('DAILY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewScope === 'DAILY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {lang === 'ar' ? 'يومي' : 'Daily'}
            </button>
            <button
              onClick={() => setViewScope('COMPREHENSIVE')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewScope === 'COMPREHENSIVE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {lang === 'ar' ? 'شامل' : 'Comprehensive'}
            </button>
          </div>

          {/* Date Picker (Mock) */}
          {viewScope === 'COMPREHENSIVE' && (
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Today">{lang === 'ar' ? 'اليوم' : 'Today'}</option>
              <option value="Week">{lang === 'ar' ? 'هذا الأسبوع' : 'This Week'}</option>
              <option value="Month">{lang === 'ar' ? 'هذا الشهر' : 'This Month'}</option>
              <option value="Year">{lang === 'ar' ? 'هذا العام' : 'This Year'}</option>
              <option value="Custom">{lang === 'ar' ? 'فترة مخصصة' : 'Custom Period'}</option>
            </select>
          )}

          <button
            onClick={handleGenerateInsight}
            className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 btn-theme font-bold text-xs uppercase tracking-wider hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all active:scale-95 ml-auto lg:ml-0"
          >
            <Sparkles size={14} />
            {loadingInsight ? (lang === 'ar' ? 'جارِ...' : 'Loading...') : (lang === 'ar' ? 'ذكاء صناعي' : 'AI Intel')}
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t.total_rev, value: viewScope === 'DAILY' ? '12,450 ج.م' : '255,550 ج.م', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+12%' },
          { label: t.orders, value: viewScope === 'DAILY' ? '142' : '4,890', icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10', trend: '+5%' },
          { label: lang === 'ar' ? 'متوسط الطلب' : 'Avg Order', value: viewScope === 'DAILY' ? '87.5 ج.م' : '52.3 ج.م', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: '+3%' },
          { label: lang === 'ar' ? 'الإلغاءات' : 'Cancellations', value: viewScope === 'DAILY' ? '2' : '48', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', trend: '-10%' },
        ].map((stat, index) => (
          <div key={index} className="card-primary p-8 rounded-[2rem] hover:-translate-y-2 group">
            <div className="flex justify-between items-start">
              <div className="space-y-2 shrink-0">
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-main tracking-tight">
                  <SensitiveData
                    permission={AppPermission.DATA_VIEW_REVENUE}
                    hasPermission={hasPermission}
                    lang={lang}
                  >
                    {stat.value}
                  </SensitiveData>
                </h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${stat.trend.startsWith('+') ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                  {stat.trend}
                </span>
              </div>
              <div className={`p-4 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform duration-500 shadow-sm border border-white/5`}>
                <stat.icon size={24} className={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Main Charts */}
        <div className="xl:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <div className="card-primary !p-8 md:!p-10 rounded-[2.5rem]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
              <div>
                <h3 className="text-xl font-black text-main flex items-center gap-3">
                  <div className="w-2 h-8 bg-primary rounded-full" />
                  {viewScope === 'DAILY' ? (lang === 'ar' ? 'نبض المبيعات (اليوم)' : 'Sales Pulse (Today)') : (lang === 'ar' ? 'أداء الإيرادات' : 'Revenue Performance')}
                </h3>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-1 ml-5">Volume Metrics Index</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/40" />
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">{lang === 'ar' ? 'الإيرادات' : 'Revenue'}</span>
                </div>
              </div>
            </div>
            <div className="h-80 md:h-[400px] w-full relative overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewScope === 'DAILY' ? DAILY_DATA : WEEKLY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 10, fontWeight: 900 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 10, fontWeight: 900 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(var(--primary), 0.03)' }} />
                  <Bar dataKey="revenue" fill={primaryColor} radius={[12, 12, 0, 0]} barSize={viewScope === 'DAILY' ? 20 : 40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Staff Performance */}
            <div className="card-primary !p-6">
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-5 uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                {lang === 'ar' ? 'أداء الموظفين' : 'Staff Ranking'}
              </h3>
              <div className="space-y-4">
                {STAFF_PERFORMANCE.map((staff, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                        {staff.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">{staff.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{staff.orders} Orders</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-indigo-600">{staff.rating}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(s => <div key={s} className={`w-1 h-1 rounded-full mx-0.5 ${s <= Math.floor(staff.rating) ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Item Performance */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-5 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag size={16} className="text-indigo-600" />
                {lang === 'ar' ? 'الأكثر مبيعاً' : 'Best Sellers'}
              </h3>
              <div className="space-y-5">
                {ITEM_PERFORMANCE.map((item, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className={item.growth > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {item.growth > 0 ? '↑' : '↓'} {Math.abs(item.growth)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                        style={{ width: `${(item.sales / ITEM_PERFORMANCE[0].sales) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI & Customers */}
        <div className="space-y-6">
          {/* AI Advisor Card */}
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl">
                  <Sparkles size={20} />
                </div>
                <h4 className="font-black text-lg uppercase tracking-tight">{lang === 'ar' ? 'المستشار الذكي' : 'AI Advisor'}</h4>
              </div>

              <div className="space-y-4">
                {loadingInsight ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-2 bg-white/20 rounded-full w-3/4" />
                    <div className="h-2 bg-white/20 rounded-full w-full" />
                    <div className="h-2 bg-white/20 rounded-full w-2/3" />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed font-medium transition-all duration-500">
                    {insight || (lang === 'ar' ? 'قم بتحديث الرؤى للحصول على نصائح ذكية...' : 'Refresh to get intelligent business tips...')}
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate('/ai-insights')}
                className="w-full py-3 bg-white text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
              >
                {lang === 'ar' ? 'عرض التحليل الكامل' : 'Full Analysis'}
              </button>
            </div>
          </div>

          {/* Sales by Category (Pie Chart) */}
          <div className="card-primary !p-6">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 uppercase tracking-widest">
              {lang === 'ar' ? 'المبيعات حسب الفئة' : 'Categorical Mix'}
            </h3>
            <div className="h-48 w-full min-h-[190px] relative overflow-hidden">
              <ResponsiveContainer width="100%" height="100%" minHeight={190}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="75%"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[9px] font-bold text-slate-500 uppercase truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers Activity */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-5 uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              {lang === 'ar' ? 'العملاء النشطون' : 'Key Customers'}
            </h3>
            <div className="space-y-4">
              {ACTIVE_CUSTOMERS.map((customer, i) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all cursor-default border border-transparent hover:border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-black">
                      {customer.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">{customer.name}</p>
                      <p className="text-[9px] font-bold text-slate-400">{customer.visits} Visits</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-600">{customer.totalSpent} LE</p>
                  </div>
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
