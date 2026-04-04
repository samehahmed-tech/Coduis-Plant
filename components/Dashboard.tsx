import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

import LiveClock from './common/LiveClock';
import SystemHealth from './common/SystemHealth';
import SensitiveData from './SensitiveData';
import EmptyState from './common/EmptyState';
import PageSkeleton from './common/PageSkeleton';
import { AppPermission } from '../types';
import AnimatedNumber from './common/AnimatedNumber';
import {
  DollarSign, ShoppingBag, Users, TrendingUp, Sparkles, Package, Database,
  AlertCircle, AlertTriangle, Clock, Clock3, Wallet, Building2,
  ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import AIAlertsWidget from './AIAlertsWidget';
import ActivityFeed from './common/ActivityFeed';
import { aiApi } from '../services/api/ai';
import { reportsApi } from '../services/api/reports';
import { inventoryApi } from '../services/api';
import { socketService } from '../services/socketService';

import LiveKanbanBoard from './dashboard/LiveKanbanBoard';
import { KitchenPerformanceWidget, DeliveryStatusWidget } from './dashboard/KitchenDispatchWidgets';
import { ChefHat, Truck, LayoutDashboard } from 'lucide-react';

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
    revenue: number; paidRevenue: number; discounts: number; orderCount: number;
    avgTicket: number; uniqueCustomers: number; itemsSold: number;
    cancelled: number; pending: number; delivered: number; cancelRate: number;
  };
  trendData: Array<{ name: string; revenue: number }>;
  paymentBreakdown: Array<{ name: string; value: number }>;
  orderTypeBreakdown: Array<{ name: string; value: number }>;
  categoryData: Array<{ name: string; value: number }>;
  topItems: Array<{ name: string; qty: number; revenue: number }>;
  branchPerformance: Array<{ branchId: string; branchName: string; orders: number; revenue: number; avgTicket: number }>;
  topCustomers: Array<{ id: string; name: string; visits: number; totalSpent: number }>;
};

const EMPTY_PAYLOAD: DashboardPayload = {
  totals: { revenue: 0, paidRevenue: 0, discounts: 0, orderCount: 0, avgTicket: 0, uniqueCustomers: 0, itemsSold: 0, cancelled: 0, pending: 0, delivered: 0, cancelRate: 0 },
  trendData: [], paymentBreakdown: [], orderTypeBreakdown: [], categoryData: [], topItems: [], branchPerformance: [], topCustomers: []
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
  const [retryCount, setRetryCount] = useState(0);

  const retryLoad = () => setRetryCount(c => c + 1);

  // Smart Inventory Alerts
  const [inventoryAlerts, setInventoryAlerts] = useState<{ lowStock: number; expiringSoon: number; totalAtRisk: number }>({ lowStock: 0, expiringSoon: 0, totalAtRisk: 0 });

  useEffect(() => {
    const loadInventoryAlerts = async () => {
      try {
        const [reorderData, expiringData] = await Promise.all([
          reportsApi.getReorderAlerts().catch(() => []),
          reportsApi.getExpiringBatches().catch(() => null),
        ]);
        setInventoryAlerts({
          lowStock: Array.isArray(reorderData) ? reorderData.length : 0,
          expiringSoon: expiringData?.totalBatches || 0,
          totalAtRisk: Math.round(expiringData?.totalAtRiskValue || 0),
        });
      } catch { /* silent */ }
    };
    loadInventoryAlerts();
  }, [retryCount]);



  // Simulated pseudo-live metrics moved from TopBar
  const [liveMetrics, setLiveMetrics] = useState({ orders: 34, prep: 12, drivers: 4 });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        orders: prev.orders + Math.floor(Math.random() * 2),
        prep: prev.prep + (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.8 ? 1 : 0),
        drivers: prev.drivers
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const range = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    if (viewScope === 'DAILY') { start.setHours(0, 0, 0, 0); }
    else if (viewScope === 'WEEKLY') { start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); }
    else if (viewScope === 'MONTHLY') { start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0); }
    else { start.setFullYear(2000, 0, 1); start.setHours(0, 0, 0, 0); }
    return { startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
  }, [viewScope]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true); setError(null);
        const data = await reportsApi.getDashboardKpis({
          branchId: settings.activeBranchId, startDate: range.startDate, endDate: range.endDate, scope: viewScope
        });
        if (!cancelled) setPayload(data as DashboardPayload);
      } catch (e: any) {
        if (!cancelled) {
          setPayload(EMPTY_PAYLOAD);
          setError(e?.message || 'Failed to load dashboard');
          // Auto-retry once after 3 seconds on first failure
          if (retryCount === 0) {
            setTimeout(() => { if (!cancelled) setRetryCount(1); }, 3000);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [settings.activeBranchId, range.startDate, range.endDate, viewScope, retryCount]);

  useEffect(() => {
    const refresh = () => {
      reportsApi.getDashboardKpis({
        branchId: settings.activeBranchId, startDate: range.startDate, endDate: range.endDate, scope: viewScope
      }).then((data) => setPayload(data as DashboardPayload)).catch(() => undefined);
    };
    socketService.on('order:created', refresh); socketService.on('order:status', refresh);
    socketService.on('dispatch:assigned', refresh); socketService.on('driver:status', refresh);
    return () => {
      socketService.off('order:created', refresh); socketService.off('order:status', refresh);
      socketService.off('dispatch:assigned', refresh); socketService.off('driver:status', refresh);
    };
  }, [settings.activeBranchId, range.startDate, range.endDate, viewScope]);

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    try {
      const result = await aiApi.getInsights(settings.activeBranchId);
      setInsight(result.insight || '');
    } catch (error: any) { setInsight(error?.message || (lang === 'ar' ? 'فشل تحميل التحليل الذكي' : 'Failed to load AI insight')); }
    finally { setLoadingInsight(false); }
  };

  const { totals, trendData, paymentBreakdown, orderTypeBreakdown, categoryData, topItems, branchPerformance, topCustomers } = payload;
  const currencySymbolStr = currencySymbol;
  const primaryColor = 'rgb(var(--primary))';

  const hasData = totals.orderCount > 0 || totals.pending > 0 || topCustomers.length > 0 || topItems.length > 0;

  const alertsList = useMemo(() => {
    const list: { id: string; icon: any; label: string; color: string; bg: string }[] = [];
    if (totals.pending > 3) list.push({ id: 'p', icon: Clock, label: lang === 'ar' ? `${totals.pending} طلبات معلقة` : `${totals.pending} pending orders`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' });
    if (totals.cancelled > 2 && totals.orderCount > 0 && (totals.cancelled / totals.orderCount) > 0.1) list.push({ id: 'c', icon: AlertTriangle, label: lang === 'ar' ? `نسبة إلغاء عالية` : `High cancellation rate`, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' });
    if (totals.avgTicket > 0 && totals.avgTicket < 50 && totals.orderCount >= 5) list.push({ id: 'a', icon: TrendingUp, label: lang === 'ar' ? `متوسط فاتورة منخفض` : `Low avg ticket`, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20' });
    if (inventoryAlerts.lowStock > 0) list.push({ id: 'ls', icon: Package, label: lang === 'ar' ? `${inventoryAlerts.lowStock} أصناف مخزون منخفض` : `${inventoryAlerts.lowStock} low stock items`, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' });
    if (inventoryAlerts.expiringSoon > 0) list.push({ id: 'eb', icon: AlertTriangle, label: lang === 'ar' ? `${inventoryAlerts.expiringSoon} دفعات قريبة من الانتهاء` : `${inventoryAlerts.expiringSoon} expiring batches`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' });
    return list;
  }, [totals, lang]);

  // Data for Row 1: KPI Strips
  const kpiStats = [
    { label: lang === 'ar' ? 'الإيرادات' : 'Revenue', value: <AnimatedNumber value={totals.revenue} format={v => `${v.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currencySymbolStr}`} />, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', perm: AppPermission.DATA_VIEW_REVENUE, sparkKey: 'revenue', sparkColor: '#10b981' },
    { label: lang === 'ar' ? 'الطلبات' : 'Orders', value: <AnimatedNumber value={totals.orderCount} />, icon: ShoppingBag, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', perm: AppPermission.DATA_VIEW_REVENUE, sparkKey: 'revenue', sparkColor: '#6366f1' },
    { label: lang === 'ar' ? 'طلبات حية' : 'Active Orders', value: liveMetrics.orders, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', perm: AppPermission.DATA_VIEW_REVENUE, sparkKey: null, sparkColor: '' },
    { label: lang === 'ar' ? 'وقت التحضير' : 'Prep Time', value: `${liveMetrics.prep}m`, icon: ChefHat, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', perm: AppPermission.DATA_VIEW_REVENUE, sparkKey: null, sparkColor: '' },
    { label: lang === 'ar' ? 'سائقين متاحين' : 'Drivers', value: `${liveMetrics.drivers}/5`, icon: Truck, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', perm: AppPermission.DATA_VIEW_REVENUE, sparkKey: null, sparkColor: '' },
    { label: lang === 'ar' ? 'متوسط الفاتورة' : 'Avg Ticket', value: <AnimatedNumber value={totals.avgTicket} format={v => `${v.toFixed(1)} ${currencySymbolStr}`} />, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', perm: AppPermission.DATA_VIEW_REVENUE, sparkKey: 'revenue', sparkColor: '#8b5cf6' },
  ];

  return (
    <div className="relative min-h-full bg-app transition-colors duration-200 overflow-y-auto overflow-x-hidden">
      {/* ── Dynamic Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/8 blur-[120px] animate-float" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[45%] h-[45%] rounded-full bg-accent/6 blur-[100px] animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-success/5 blur-[80px] animate-float" style={{ animationDelay: '6s' }} />
      </div>
      <div className="relative z-10 p-4 lg:p-6">
        {/* ── Header ── */}
        <div className="flex items-end justify-between gap-2 border-b border-border/20 pb-3 mb-4 lg:mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg lg:text-xl font-black text-main tracking-tight flex items-center gap-2">
              <LayoutDashboard size={18} className="text-primary" />
              {lang === 'ar' ? 'لوحة القيادة' : 'Dashboard'}
            </h2>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-elevated/50 rounded-lg border border-border/40">
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping-soft absolute inline-flex h-full w-full rounded-full ${hasData ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${hasData ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted mt-0.5">
                {hasData ? (lang === 'ar' ? 'متصل ومباشر' : 'Live & Synced') : (lang === 'ar' ? 'في الانتظار' : 'Standby')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="tab-group bg-card/60 p-1 rounded-xl border border-border/30 flex">
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'ALL'] as Scope[]).map(scope => (
                <button
                  key={scope}
                  onClick={() => setViewScope(scope)}
                  className={`tab-item px-3 py-1.5 rounded-lg text-[9px] lg:text-[10px] font-bold uppercase tracking-widest transition-all ${viewScope === scope ? 'bg-primary text-white shadow-md' : 'text-muted hover:text-main hover:bg-elevated'}`}
                >
                  {scope}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-20 bg-card border border-border/20 rounded-2xl animate-pulse" />)}
            </div>
            <div className="flex gap-4 h-[400px]">
              <div className="flex-1 bg-card border border-border/20 rounded-2xl animate-pulse" />
              <div className="w-[300px] hidden xl:block bg-card border border-border/20 rounded-2xl animate-pulse" />
            </div>
          </div>
        )}

        {error && (
          <div className="m-4 p-5 bg-rose-500/8 text-rose-500 font-bold rounded-2xl border border-rose-500/15 flex items-center gap-3">
            <AlertCircle size={16} />
            <span className="flex-1">{error}</span>
            <button
              onClick={retryLoad}
              className="shrink-0 px-4 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105"
            >
              {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        {!loading && !hasData && !error && (
          <div className="flex flex-col items-center justify-center py-20 lg:py-32">
            <div className="w-full max-w-2xl relative group">
              {/* Decorative gradient blob behind the card */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-success/10 rounded-[3rem] blur-2xl scale-105 opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
              <div className="relative bg-card/80 backdrop-blur-sm border border-border/30 rounded-[2.5rem] p-12 lg:p-16 flex flex-col items-center justify-center gap-6 shadow-xl">
                <div className="p-5 bg-gradient-to-br from-primary/15 to-accent/10 text-primary rounded-[1.5rem] shadow-lg shadow-primary/10 animate-float">
                  <Database size={36} />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-main mb-2 tracking-tight">{lang === 'ar' ? 'لا توجد بيانات تشغيلية' : 'No Operational Data'}</h3>
                  <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
                    {lang === 'ar' ? 'لم يتم تسجيل أي طلبات أو حركات في هذه الفترة الزمنية.' : 'No recorded transactions or active operations in this time range.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <button onClick={() => navigate('/pos')} className="bg-gradient-to-r from-primary to-primary-hover text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.02] transition-all flex items-center gap-2">
                    <ShoppingBag size={16} />{lang === 'ar' ? 'إنشاء أول طلب' : 'Point of Sale'}
                  </button>
                  <button onClick={() => navigate('/finance')} className="bg-card border-2 border-border/50 hover:border-primary/40 hover:bg-elevated text-main font-black flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all hover:shadow-lg">
                    <Wallet size={16} />{lang === 'ar' ? 'فتح الوردية' : 'Open Shift'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && hasData && !error && (
          <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-w-0">

              {alertsList.length > 0 && (
                <div className="flex flex-wrap gap-2 shrink-0 animate-in slide-in-from-top-2 duration-300">
                  {alertsList.map(a => (
                    <button key={a.id} onClick={() => { if (a.id === 'ls' || a.id === 'eb') navigate('/inventory'); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-bold cursor-pointer hover:scale-[1.02] transition-transform ${a.bg} ${a.color}`}>
                      <a.icon size={14} /><span>{a.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ROW 1: KPI Overview Strip */}
              <div className="shrink-0 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 lg:gap-3">
                {kpiStats.map((stat, i) => (
                  <div key={i} className="theme-card p-3 flex items-center justify-between group">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted truncate mb-0.5">{stat.label}</p>
                      <h3 className={`text-base lg:text-lg font-black ${stat.color} leading-none tracking-tight drop-shadow-sm`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <SensitiveData permission={stat.perm} hasPermission={hasPermission} lang={lang}>{stat.value}</SensitiveData>
                      </h3>
                    </div>
                    <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.border} border flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300`}>
                      <stat.icon size={14} className={stat.color} />
                    </div>
                  </div>
                ))}
              </div>

              {/* ROW 2: Live Operations (Kanban + Kitchen) */}
              <div className="shrink-0 flex flex-col xl:flex-row gap-3 lg:gap-4 min-h-[400px] lg:min-h-[500px]">
                {/* Left: Kanban Board */}
                <div className="flex-1 theme-card overflow-hidden flex flex-col">
                  <LiveKanbanBoard />
                </div>
                {/* Right: Kitchen Load */}
                <div className="w-full xl:w-[350px] shrink-0 flex flex-col">
                  <KitchenPerformanceWidget />
                </div>
              </div>

              {/* ROW 3: Dispatch & Delivery */}
              <div className="shrink-0 flex flex-col xl:flex-row gap-3 lg:gap-4 min-h-[300px]">
                <div className="w-full xl:w-[350px] shrink-0 flex flex-col">
                  <DeliveryStatusWidget />
                </div>
                <div className="flex-1 theme-card p-4 lg:p-5">
                  <h3 className="text-[11px] font-black tracking-widest uppercase text-muted mb-4 border-b border-border/20 pb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" /> Active Timeline
                  </h3>
                  <div className="h-[200px] flex items-center justify-center opacity-50">
                    <p className="text-[10px] uppercase font-bold text-muted tracking-widest">Awaiting Timeline Data</p>
                  </div>
                </div>
              </div>

              {/* ROW 4: Insights (Charts) */}
              <div className="shrink-0 grid grid-cols-1 xl:grid-cols-2 gap-3 lg:gap-4 min-h-[350px]">
                {/* Area 1: Top Items */}
                <div className="theme-card p-4 lg:p-5">
                  <h3 className="text-[11px] font-black tracking-widest uppercase text-muted mb-4 border-b border-border/20 pb-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-500" /> Top Performers
                  </h3>
                  <div className="space-y-2">
                    {topItems.slice(0, 5).map((item, i) => (
                      <div key={`${item.name}-${i}`} className="flex items-center justify-between p-3 rounded-xl bg-elevated/40 border border-border/20">
                        <div>
                          <p className="text-[12px] font-bold text-main">{item.name}</p>
                          <p className="text-[9px] uppercase tracking-widest text-muted font-bold mt-0.5">{item.qty} units</p>
                        </div>
                        <p className="text-[11px] font-black text-emerald-500">{item.revenue.toLocaleString()} {currencySymbolStr}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Area 2: Revenue Trend */}
                <div className="theme-card p-4 lg:p-5 flex flex-col">
                  <h3 className="text-[11px] font-black tracking-widest uppercase text-muted mb-4 border-b border-border/20 pb-3 flex items-center gap-2">
                    <DollarSign size={14} className="text-indigo-500" /> Revenue Trend
                  </h3>
                  <div className="flex-1 w-full relative z-10 -mx-2 -mb-2">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted)' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted)' }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '12px', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="revenue" stroke={primaryColor} strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Persistent Activity Feed */}
            <div className="hidden xl:flex w-[280px] 2xl:w-[320px] shrink-0 theme-card flex-col overflow-hidden">
              <div className="shrink-0 p-4 border-b border-border/20">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-main flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  {lang === 'ar' ? 'سجل النشاط المباشر' : 'Live Activity Feed'}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                <ActivityFeed />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
