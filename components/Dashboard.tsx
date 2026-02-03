
import React, { useEffect, useState, useMemo } from 'react';
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
import { DollarSign, ShoppingBag, Users, TrendingUp, Sparkles, AlertCircle, Package, Database } from 'lucide-react';
import { getBusinessInsights } from '../services/geminiService';
import { useAuthStore } from '../stores/useAuthStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useCRMStore } from '../stores/useCRMStore';
import { useMenuStore } from '../stores/useMenuStore';
import { useNavigate } from 'react-router-dom';
import AIAlertsWidget from './AIAlertsWidget';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

const Dashboard: React.FC = () => {
  const { settings, hasPermission } = useAuthStore();
  const { orders } = useOrderStore();
  const { customers } = useCRMStore();
  const { categories } = useMenuStore();
  const navigate = useNavigate();
  const { language: lang, isDarkMode, currencySymbol } = settings;

  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [viewScope, setViewScope] = useState<'DAILY' | 'COMPREHENSIVE'>('DAILY');

  // Calculate real stats from orders
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

    return {
      todayRevenue,
      totalRevenue,
      todayOrders: todayOrders.length,
      totalOrders: orders.length,
      avgOrder: avgOrder.toFixed(1),
      cancelledOrders,
    };
  }, [orders]);

  // Calculate hourly revenue for chart
  const hourlyData = useMemo(() => {
    const hours: { [key: string]: number } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= today) {
        const hour = orderDate.getHours();
        const label = hour < 12 ? `${hour || 12} AM` : `${hour === 12 ? 12 : hour - 12} PM`;
        hours[label] = (hours[label] || 0) + (order.total || 0);
      }
    });

    // Generate all hours with data
    const allHours = ['08 AM', '10 AM', '12 PM', '02 PM', '04 PM', '06 PM', '08 PM', '10 PM'];
    return allHours.map(name => ({ name, revenue: hours[name] || 0 }));
  }, [orders]);

  // Category sales from real orders
  const categoryData = useMemo(() => {
    const catSales: { [key: string]: number } = {};

    orders.forEach(order => {
      order.items?.forEach(item => {
        const cat = categories.find(c => c.items.some(i => i.id === item.id));
        if (cat) {
          catSales[cat.name] = (catSales[cat.name] || 0) + (item.price * item.quantity);
        }
      });
    });

    return Object.entries(catSales).map(([name, value]) => ({ name, value }));
  }, [orders, categories]);

  // Top customers
  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 5);
  }, [customers]);

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const salesSummary = {
      todayRevenue: stats.todayRevenue,
      totalOrders: stats.totalOrders,
      avgOrder: stats.avgOrder
    };
    const result = await getBusinessInsights(salesSummary, [], lang, settings.geminiApiKey);
    setInsight(result);
    setLoadingInsight(false);
  };

  // Theme colors for charts
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

  const hasData = orders.length > 0 || customers.length > 0 || categories.length > 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in transition-colors duration-200 min-h-screen pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="heading-lg text-main uppercase flex items-center gap-3">
            {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            <div className={`w-2.5 h-2.5 rounded-full ${hasData ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          </h2>
          <p className="text-sm text-muted font-semibold">
            {hasData
              ? (lang === 'ar' ? 'بيانات حقيقية من قاعدة البيانات' : 'Real data from database')
              : (lang === 'ar' ? 'لا توجد بيانات بعد - ابدأ بإضافة المنيو والطلبات' : 'No data yet - start by adding menu and orders')
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={handleGenerateInsight}
            className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 btn-theme font-bold text-xs uppercase tracking-wider hover:bg-primary/20 transition-all active:scale-95 ml-auto lg:ml-0"
          >
            <Sparkles size={14} />
            {loadingInsight ? (lang === 'ar' ? 'جارِ...' : 'Loading...') : (lang === 'ar' ? 'ذكاء صناعي' : 'AI Intel')}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!hasData && (
        <div className="card-primary p-12 rounded-[2.5rem] text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Database size={40} className="text-primary" />
          </div>
          <h3 className="text-xl font-black text-main mb-2">
            {lang === 'ar' ? 'مرحباً بك في Coduis Zen!' : 'Welcome to Coduis Zen!'}
          </h3>
          <p className="text-muted mb-6 max-w-md mx-auto">
            {lang === 'ar'
              ? 'النظام جاهز للعمل. ابدأ بإضافة المنيو والأصناف، ثم سجل أول طلب لترى الإحصائيات هنا.'
              : 'The system is ready. Start by adding your menu categories and items, then make your first order to see real statistics here.'
            }
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/menu')}
              className="px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all"
            >
              {lang === 'ar' ? 'إضافة المنيو' : 'Add Menu'}
            </button>
            <button
              onClick={() => navigate('/pos')}
              className="px-6 py-3 bg-elevated text-main rounded-2xl font-bold text-sm hover:bg-card transition-all"
            >
              {lang === 'ar' ? 'فتح نقطة البيع' : 'Open POS'}
            </button>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      {hasData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
                value: `${stats.totalRevenue.toLocaleString()} ${currencySymbol}`,
                icon: DollarSign,
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
              },
              {
                label: lang === 'ar' ? 'الطلبات' : 'Orders',
                value: stats.totalOrders.toString(),
                icon: ShoppingBag,
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                label: lang === 'ar' ? 'متوسط الطلب' : 'Avg Order',
                value: `${stats.avgOrder} ${currencySymbol}`,
                icon: TrendingUp,
                color: 'text-purple-500',
                bg: 'bg-purple-500/10',
              },
              {
                label: lang === 'ar' ? 'العملاء' : 'Customers',
                value: customers.length.toString(),
                icon: Users,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
              },
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
              <div className="bg-card dark:bg-card !p-8 md:!p-10 rounded-[2.5rem]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                  <div>
                    <h3 className="text-xl font-black text-main flex items-center gap-3">
                      <div className="w-2 h-8 bg-primary rounded-full" />
                      {lang === 'ar' ? 'نبض المبيعات (اليوم)' : 'Sales Pulse (Today)'}
                    </h3>
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-1 ml-5">
                      {lang === 'ar' ? 'الإيرادات حسب الساعة' : 'Hourly Revenue'}
                    </p>
                  </div>
                </div>
                <div className="h-80 md:h-[400px] w-full relative overflow-hidden">
                  {hourlyData.some(h => h.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 10, fontWeight: 900 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 10, fontWeight: 900 }} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(var(--primary), 0.03)' }} />
                        <Bar dataKey="revenue" fill={primaryColor} radius={[12, 12, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted">
                      <div className="text-center">
                        <Package size={48} className="mx-auto mb-4 opacity-30" />
                        <p>{lang === 'ar' ? 'لا توجد مبيعات اليوم' : 'No sales today'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: AI & Customers */}
            <div className="space-y-6">
              {/* AI Proactive Alerts */}
              <AIAlertsWidget />

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
                        {insight || (lang === 'ar' ? 'الخدمة غير متوفرة حالياً' : 'Service not available')}
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

              {/* Sales by Category */}
              {categoryData.length > 0 && (
                <div className="card-primary !p-6">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 uppercase tracking-widest">
                    {lang === 'ar' ? 'المبيعات حسب الفئة' : 'Sales by Category'}
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
                      <div key={i} className="flex items-center gap-1.5 p-2 bg-elevated/50 dark:bg-elevated/30 rounded-xl border border-border/50">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[9px] font-bold text-slate-500 uppercase truncate">{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Customers */}
              {topCustomers.length > 0 && (
                <div className="bg-card dark:bg-card p-6 rounded-3xl border border-border/50">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white mb-5 uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    {lang === 'ar' ? 'أفضل العملاء' : 'Top Customers'}
                  </h3>
                  <div className="space-y-4">
                    {topCustomers.map((customer, i) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-elevated dark:hover:bg-elevated/50 rounded-2xl transition-all cursor-default border border-transparent hover:border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-primary flex items-center justify-center font-black">
                            {customer.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200">{customer.name}</p>
                            <p className="text-[9px] font-bold text-slate-400">{customer.visits || 0} {lang === 'ar' ? 'زيارة' : 'Visits'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-emerald-600">{(customer.totalSpent || 0).toLocaleString()} {currencySymbol}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
