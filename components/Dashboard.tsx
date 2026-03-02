import React, { useEffect, useMemo, useState } from 'react';
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
  Cell,
  LineChart,
  Line,
} from 'recharts';
import SensitiveData from './SensitiveData';
import { AppPermission } from '../types';
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Sparkles,
  Package,
  Database,
  AlertCircle,
  Clock3,
  Wallet,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import AIAlertsWidget from './AIAlertsWidget';
import { aiApi, reportsApi } from '../services/api';
import { socketService } from '../services/socketService';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9'];
type Scope = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL';

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type DashboardPayload = {
  totals: {
    revenue: number;
    paidRevenue: number;
    discounts: number;
    orderCount: number;
    avgTicket: number;
    uniqueCustomers: number;
    itemsSold: number;
    cancelled: number;
    pending: number;
    delivered: number;
    cancelRate: number;
  };
  trendData: Array<{ name: string; revenue: number }>;
  paymentBreakdown: Array<{ name: string; value: number }>;
  orderTypeBreakdown: Array<{ name: string; value: number }>;
  categoryData: Array<{ name: string; value: number }>;
  topItems: Array<{ name: string; qty: number; revenue: number }>;
  branchPerformance: Array<{ branchId: string; branchName: string; orders: number; revenue: number; avgTicket: number }>;
  topCustomers: Array<{ id: string; name: string; visits: number; totalSpent: number }>;
  reportParity: {
    overview: {
      orderCount: number;
      grossSales: number;
      netSales: number;
      taxTotal: number;
      discountTotal: number;
      serviceChargeTotal: number;
    };
  };
};

const EMPTY_PAYLOAD: DashboardPayload = {
  totals: {
    revenue: 0,
    paidRevenue: 0,
    discounts: 0,
    orderCount: 0,
    avgTicket: 0,
    uniqueCustomers: 0,
    itemsSold: 0,
    cancelled: 0,
    pending: 0,
    delivered: 0,
    cancelRate: 0,
  },
  trendData: [],
  paymentBreakdown: [],
  orderTypeBreakdown: [],
  categoryData: [],
  topItems: [],
  branchPerformance: [],
  topCustomers: [],
  reportParity: {
    overview: {
      orderCount: 0,
      grossSales: 0,
      netSales: 0,
      taxTotal: 0,
      discountTotal: 0,
      serviceChargeTotal: 0,
    },
  },
};

const Dashboard: React.FC = () => {
  const { settings, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const { language: lang, isDarkMode, currencySymbol } = settings;

  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [viewScope, setViewScope] = useState<Scope>('DAILY');
  const [payload, setPayload] = useState<DashboardPayload>(EMPTY_PAYLOAD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    if (viewScope === 'DAILY') {
      start.setHours(0, 0, 0, 0);
    } else if (viewScope === 'WEEKLY') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (viewScope === 'MONTHLY') {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    } else {
      start.setFullYear(2000, 0, 1);
      start.setHours(0, 0, 0, 0);
    }
    return {
      startDate: formatLocalDate(start),
      endDate: formatLocalDate(end),
    };
  }, [viewScope]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await reportsApi.getDashboardKpis({
          branchId: settings.activeBranchId,
          startDate: range.startDate,
          endDate: range.endDate,
          scope: viewScope,
        });
        if (!cancelled) setPayload(data as DashboardPayload);
      } catch (e: any) {
        if (!cancelled) {
          setPayload(EMPTY_PAYLOAD);
          setError(e?.message || 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [settings.activeBranchId, range.startDate, range.endDate, viewScope]);

  useEffect(() => {
    const refresh = () => {
      reportsApi.getDashboardKpis({
        branchId: settings.activeBranchId,
        startDate: range.startDate,
        endDate: range.endDate,
        scope: viewScope,
      }).then((data) => setPayload(data as DashboardPayload)).catch(() => undefined);
    };

    socketService.on('order:created', refresh);
    socketService.on('order:status', refresh);
    socketService.on('dispatch:assigned', refresh);
    socketService.on('driver:status', refresh);

    return () => {
      socketService.off('order:created', refresh);
      socketService.off('order:status', refresh);
      socketService.off('dispatch:assigned', refresh);
      socketService.off('driver:status', refresh);
    };
  }, [settings.activeBranchId, range.startDate, range.endDate, viewScope]);

  const totals = payload.totals;
  const trendData = payload.trendData;
  const paymentBreakdown = payload.paymentBreakdown;
  const orderTypeBreakdown = payload.orderTypeBreakdown;
  const categoryData = payload.categoryData;
  const topItems = payload.topItems;
  const branchPerformance = payload.branchPerformance;
  const topCustomers = payload.topCustomers;

  const alerts = useMemo(() => {
    const list: string[] = [];
    if (totals.cancelRate > 8) list.push(lang === 'ar' ? 'معدل إلغاء مرتفع' : 'High cancellation rate');
    if (totals.pending > Math.max(5, Math.round(totals.orderCount * 0.35))) list.push(lang === 'ar' ? 'طلبات معلقة كثيرة' : 'Too many pending orders');
    if (totals.avgTicket < 80 && totals.orderCount > 20) list.push(lang === 'ar' ? 'متوسط الطلب منخفض' : 'Average ticket is low');
    if (totals.paidRevenue < totals.revenue * 0.8 && totals.orderCount > 0) list.push(lang === 'ar' ? 'نسبة تحصيل منخفضة' : 'Collection ratio is low');
    return list.slice(0, 4);
  }, [totals, lang]);

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    try {
      const result = await aiApi.getInsights(settings.activeBranchId);
      setInsight(result.insight || '');
    } catch (error: any) {
      setInsight(error?.message || (lang === 'ar' ? 'فشل تحميل التحليل الذكي' : 'Failed to load AI insight'));
    } finally {
      setLoadingInsight(false);
    }
  };

  const primaryColor = 'rgb(var(--primary))';
  const chartTextColor = isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const gridColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

  const tooltipStyle = {
    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)',
    borderColor: 'rgba(var(--border-color), 0.2)',
    color: 'rgb(var(--text-main))',
    borderRadius: '12px',
    border: '1px solid rgba(var(--border-color), 0.15)',
    fontSize: '12px',
  };

  const hasData = totals.orderCount > 0 || totals.pending > 0 || topCustomers.length > 0 || topItems.length > 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in transition-colors duration-200 min-h-screen pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 relative z-10">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 uppercase flex items-center gap-3 tracking-tighter">
            {lang === 'ar' ? 'لوحة القيادة' : 'Command Center'}
            <div className={`relative flex h-2.5 w-2.5 ml-1.5`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${hasData ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${hasData ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
          </h2>
          <p className="text-xs md:text-sm text-muted font-bold tracking-wide mt-0.5">
            {lang === 'ar' ? 'نظرة شاملة لحظية للأداء والعمليات' : 'Real-time operational & financial intelligence'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto bg-card/60 backdrop-blur-md p-1.5 rounded-[1.2rem] border border-white/5 shadow-sm">
          {(['DAILY', 'WEEKLY', 'MONTHLY', 'ALL'] as Scope[]).map(scope => (
            <button
              key={scope}
              onClick={() => setViewScope(scope)}
              className={`px-4 py-2 rounded-[1rem] text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 ${viewScope === scope ? 'bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]' : 'bg-transparent text-muted hover:text-main hover:bg-elevated/40'}`}
            >
              {scope}
            </button>
          ))}
          <div className="w-[1px] h-6 bg-border mx-1 hidden md:block" />
          <button
            onClick={handleGenerateInsight}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 hover:from-indigo-500/20 hover:to-cyan-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-5 py-2 rounded-[1rem] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 w-full md:w-auto shadow-sm group"
          >
            <Sparkles size={14} className="group-hover:animate-pulse" />
            {loadingInsight ? 'Analyzing...' : 'AI Intel'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-primary p-5 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 card-primary rounded-3xl p-6">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full mb-6" />
              <div className="h-[320px] bg-slate-100 dark:bg-slate-800/40 rounded-2xl" />
            </div>
            <div className="card-primary rounded-3xl p-6">
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-full mb-6" />
              <div className="h-[200px] bg-slate-100 dark:bg-slate-800/40 rounded-full mx-auto w-[200px]" />
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="card-primary p-6 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-600">
          {error}
        </div>
      )}

      {!loading && !hasData && (
        <div className="card-primary p-12 rounded-[2.5rem] text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Database size={40} className="text-primary" />
          </div>
          <h3 className="text-xl font-black text-main mb-2">{lang === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}</h3>
          <p className="text-muted mb-6 max-w-md mx-auto">
            {lang === 'ar' ? 'ابدأ بإضافة الأصناف والطلبات لعرض تفاصيل الأداء هنا.' : 'Start with menu items and orders to unlock full dashboard insights.'}
          </p>
          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/menu')} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all">Add Menu</button>
            <button onClick={() => navigate('/pos')} className="px-6 py-3 bg-elevated text-main rounded-2xl font-bold text-sm hover:bg-card transition-all">Open POS</button>
          </div>
        </div>
      )}

      {!loading && hasData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-5 mb-6">
            {[
              { label: lang === 'ar' ? 'الإيرادات' : 'Revenue', value: `${totals.revenue.toLocaleString()} ${currencySymbol}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'from-emerald-500/0 via-emerald-500/20 to-emerald-500/0', accent: 'bg-gradient-to-r from-emerald-500 to-teal-400', shadow: 'shadow-emerald-500/20', perm: AppPermission.DATA_VIEW_REVENUE },
              { label: lang === 'ar' ? 'المحصّل' : 'Collected', value: `${totals.paidRevenue.toLocaleString()} ${currencySymbol}`, icon: Wallet, color: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'from-blue-500/0 via-blue-500/20 to-blue-500/0', accent: 'bg-gradient-to-r from-blue-500 to-indigo-400', shadow: 'shadow-blue-500/20', perm: AppPermission.DATA_VIEW_REVENUE },
              { label: lang === 'ar' ? 'الطلبات' : 'Orders', value: String(totals.orderCount), icon: ShoppingBag, color: 'text-indigo-400', bg: 'bg-indigo-500/10', glow: 'from-indigo-500/0 via-indigo-500/20 to-indigo-500/0', accent: 'bg-gradient-to-r from-indigo-500 to-cyan-400', shadow: 'shadow-indigo-500/20', perm: AppPermission.DATA_VIEW_REVENUE },
              { label: lang === 'ar' ? 'متوسط الفاتورة' : 'Avg Ticket', value: `${totals.avgTicket.toFixed(1)} ${currencySymbol}`, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10', glow: 'from-violet-500/0 via-violet-500/20 to-violet-500/0', accent: 'bg-gradient-to-r from-violet-500 to-purple-400', shadow: 'shadow-violet-500/20', perm: AppPermission.DATA_VIEW_REVENUE },
              { label: lang === 'ar' ? 'الضيوف' : 'Guests', value: String(totals.uniqueCustomers), icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', glow: 'from-cyan-500/0 via-cyan-500/20 to-cyan-500/0', accent: 'bg-gradient-to-r from-cyan-500 to-blue-400', shadow: 'shadow-cyan-500/20', perm: AppPermission.DATA_VIEW_CUSTOMER_SENSITIVE },
              { label: lang === 'ar' ? 'الأصناف المباعة' : 'Items Sold', value: String(totals.itemsSold), icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'from-amber-500/0 via-amber-500/20 to-amber-500/0', accent: 'bg-gradient-to-r from-amber-500 to-orange-400', shadow: 'shadow-amber-500/20', perm: AppPermission.DATA_VIEW_REVENUE },
            ].map((stat, index) => (
              <div
                key={index}
                className={`relative overflow-hidden bg-card/60 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-4 lg:p-5 hover:-translate-y-1 hover:shadow-xl ${stat.shadow} transition-all duration-300 ease-out group`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Glowing orb background */}
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500`} />

                {/* Animated Gradient border glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-tr ${stat.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Gradient accent top strip */}
                <div className={`absolute top-0 left-0 w-full h-[2px] ${stat.accent} opacity-40 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="flex justify-between items-center gap-2 relative z-10">
                  <div className="min-w-0">
                    <p className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.1em] text-muted truncate mb-0.5">{stat.label}</p>
                    <h3 className="text-xl lg:text-2xl font-black text-main tracking-tight drop-shadow-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      <SensitiveData permission={stat.perm} hasPermission={hasPermission} lang={lang}>
                        {stat.value}
                      </SensitiveData>
                    </h3>
                  </div>
                  <div className={`p-3 rounded-2xl ${stat.bg} shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-inner`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 space-y-5">
              <div className="relative overflow-hidden bg-card/60 backdrop-blur-xl p-5 lg:p-6 rounded-[1.8rem] border border-white/5 shadow-xl group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-lg font-black text-main tracking-tight">{lang === 'ar' ? 'اتجاه المبيعات' : 'Revenue Trend'}</h3>
                  <div className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">{viewScope}</div>
                </div>
                <div className="h-[280px] relative z-10">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 10, fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 10, fontWeight: 700 }} dx={-10} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(var(--primary-rgb), 0.1)', strokeWidth: 2 }} />
                      <Line type="monotone" dataKey="revenue" stroke={primaryColor} strokeWidth={3} dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-card)' }} activeDot={{ r: 6, strokeWidth: 2, stroke: primaryColor }} animationDuration={1000} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="relative overflow-hidden bg-card/60 backdrop-blur-xl p-5 lg:p-6 rounded-[1.8rem] border border-white/5 shadow-xl group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <h3 className="text-[10px] font-black text-muted mb-4 uppercase tracking-[0.2em] relative z-10">Payments Mix</h3>
                  <div className="h-[200px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <PieChart>
                        <Pie data={paymentBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={5} cornerRadius={4} animationDuration={1000}>
                          {paymentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0)" />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
                    {paymentBreakdown.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-elevated/40 border border-white/5 backdrop-blur-sm">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] font-bold text-main truncate">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden bg-card/60 backdrop-blur-xl p-5 lg:p-6 rounded-[1.8rem] border border-white/5 shadow-xl group">
                  <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <h3 className="text-[10px] font-black text-muted mb-4 uppercase tracking-[0.2em] relative z-10">Order Types</h3>
                  <div className="h-[200px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={orderTypeBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 10, fontWeight: 700 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 10, fontWeight: 700 }} dx={-10} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(var(--primary-rgb), 0.05)' }} />
                        <Bar dataKey="value" fill={primaryColor} radius={[6, 6, 0, 0]} animationDuration={1000} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-primary p-6 rounded-[2rem] border-white/5 backdrop-blur-3xl bg-card/60">
                  <h3 className="text-[11px] font-black text-muted mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Building2 size={16} className="text-primary" />
                    Branch Performance
                  </h3>
                  <div className="space-y-3">
                    {branchPerformance.length === 0 && <p className="text-xs text-muted">No branch data.</p>}
                    {branchPerformance.map((b) => (
                      <div key={b.branchId} className="p-3.5 rounded-2xl bg-elevated/40 border border-white/5 hover:border-primary/30 transition-colors shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[13px] font-bold text-main">{b.branchName}</p>
                          <p className="text-[12px] font-black text-emerald-500 drop-shadow-sm">{b.revenue.toLocaleString()} {currencySymbol}</p>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted font-bold uppercase tracking-wider">
                          <span>{b.orders} orders</span>
                          <span>Avg {b.avgTicket.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-primary p-6 rounded-[2rem] border-white/5 backdrop-blur-3xl bg-card/60">
                  <h3 className="text-[11px] font-black text-muted mb-4 uppercase tracking-[0.2em]">Top Selling Items</h3>
                  <div className="space-y-2">
                    {topItems.length === 0 && <p className="text-xs text-muted">No item sales yet.</p>}
                    {topItems.map((item, i) => (
                      <div key={`${item.name}-${i}`} className="flex items-center justify-between p-3.5 rounded-2xl bg-elevated/40 border border-white/5 shadow-sm hover:border-primary/30 transition-colors">
                        <div>
                          <p className="text-[13px] font-bold text-main">{item.name}</p>
                          <p className="text-[10px] uppercase tracking-widest text-muted font-bold mt-0.5">{item.qty} units</p>
                        </div>
                        <p className="text-[12px] font-black text-emerald-500 drop-shadow-sm">{item.revenue.toLocaleString()} {currencySymbol}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AIAlertsWidget />

              <div className="bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-900 p-8 rounded-[2.5rem] text-white shadow-[0_20px_40px_rgba(99,102,241,0.25)] relative overflow-hidden group border border-indigo-500/30">
                {/* Animated tech background */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/30 rounded-full blur-[80px] group-hover:opacity-100 opacity-50 transition-all duration-1000" />
                <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-cyan-400/20 rounded-full blur-[60px] opacity-60" />

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl ring-1 ring-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                      <Sparkles size={24} className="text-cyan-300 drop-shadow-sm" />
                    </div>
                    <h4 className="font-black text-xl uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 drop-shadow-sm">AI Horizon</h4>
                  </div>

                  <div className="bg-black/25 backdrop-blur-xl rounded-2xl p-5 ring-1 ring-white/10 shadow-inner">
                    {loadingInsight ? (
                      <div className="flex flex-col gap-3">
                        <div className="h-4 w-3/4 bg-white/20 rounded-full animate-pulse" />
                        <div className="h-4 w-1/2 bg-white/20 rounded-full animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mt-2">Computing variables...</p>
                      </div>
                    ) : (
                      <p className="text-[13px] leading-relaxed font-semibold min-h-[66px] text-indigo-50">{insight || 'Initiate AI Intel to compute an operational strategy tailored to this scope.'}</p>
                    )}
                  </div>

                  <button onClick={() => navigate('/ai-insights')} className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2">
                    Deep Dive Analysis <Sparkles size={16} />
                  </button>
                </div>
              </div>

              <div className="card-primary p-6 rounded-[2rem] border-white/5 backdrop-blur-3xl bg-card/60 shadow-xl">
                <h3 className="text-[11px] font-black text-muted mb-4 uppercase tracking-[0.2em]">Operational Snapshot</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm p-3 rounded-2xl bg-elevated/40 border border-white/5 shadow-sm">
                    <div className="flex items-center gap-2.5 text-muted font-bold"><div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500"><Clock3 size={16} /></div> Pending</div>
                    <span className="font-black text-main">{totals.pending}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 rounded-2xl bg-elevated/40 border border-white/5 shadow-sm">
                    <div className="flex items-center gap-2.5 text-muted font-bold"><div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500"><AlertCircle size={16} /></div> Cancelled</div>
                    <span className="font-black text-rose-500">{totals.cancelled} <span className="opacity-60 text-[11px]">({totals.cancelRate.toFixed(1)}%)</span></span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 rounded-2xl bg-elevated/40 border border-white/5 shadow-sm">
                    <div className="flex items-center gap-2.5 text-muted font-bold"><div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><ShoppingBag size={16} /></div> Delivered</div>
                    <span className="font-black text-emerald-500">{totals.delivered}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 rounded-2xl bg-elevated/40 border border-white/5 shadow-sm">
                    <div className="flex items-center gap-2.5 text-muted font-bold"><div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500"><DollarSign size={16} /></div> Discounts</div>
                    <span className="font-black text-amber-500">{totals.discounts.toLocaleString()} {currencySymbol}</span>
                  </div>
                </div>
              </div>

              {alerts.length > 0 && (
                <div className="card-primary p-6 rounded-[2rem] border-rose-500/20 backdrop-blur-3xl bg-rose-500/5 shadow-lg shadow-rose-500/5">
                  <h3 className="text-[11px] font-black text-rose-500 mb-4 uppercase tracking-[0.2em]">Needs Attention</h3>
                  <div className="space-y-2">
                    {alerts.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                        <AlertCircle size={16} className="text-rose-500 shrink-0" />
                        <p className="text-[12px] font-bold text-rose-600 dark:text-rose-400">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {categoryData.length > 0 && (
                <div className="card-primary p-6 rounded-[2rem] border-white/5 backdrop-blur-3xl bg-card/60 shadow-xl">
                  <h3 className="text-[11px] font-black text-muted mb-4 uppercase tracking-[0.2em]">Top Categories</h3>
                  <div className="space-y-2">
                    {categoryData.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between p-3.5 rounded-2xl bg-elevated/40 border border-white/5 shadow-sm hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[13px] font-bold text-main">{c.name}</span>
                        </div>
                        <span className="text-[12px] font-black text-emerald-500 drop-shadow-sm">{c.value.toLocaleString()} {currencySymbol}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {topCustomers.length > 0 && (
                <div className="card-primary p-6 rounded-[2rem] border-white/5 backdrop-blur-3xl bg-card/60 shadow-xl">
                  <h3 className="text-[11px] font-black text-muted mb-4 uppercase tracking-[0.2em]">Top Customers</h3>
                  <div className="space-y-2">
                    {topCustomers.map((customer, i) => (
                      <div key={`${customer.id}-${i}`} className="flex justify-between items-center p-3.5 rounded-2xl bg-elevated/40 border border-white/5 shadow-sm hover:border-primary/30 transition-colors">
                        <div>
                          <p className="text-[13px] font-bold text-main">{customer.name}</p>
                          <p className="text-[10px] uppercase tracking-widest text-muted font-bold mt-0.5">{customer.visits || 0} visits</p>
                        </div>
                        <p className="text-[12px] font-black text-emerald-500 drop-shadow-sm">{(customer.totalSpent || 0).toLocaleString()} {currencySymbol}</p>
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
