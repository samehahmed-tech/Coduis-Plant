import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

import LiveClock from './common/LiveClock';
import SystemHealth from './common/SystemHealth';
import SensitiveData from './SensitiveData';
import PageSkeleton from './common/PageSkeleton';
import { AppPermission } from '../types';
import AnimatedNumber from './common/AnimatedNumber';
import {
  DollarSign, ShoppingBag, Users, TrendingUp, Sparkles, Package, Database,
  AlertCircle, AlertTriangle, Clock, Wallet, Building2,
  ArrowUpRight, ArrowDownRight, Zap, Target, UserCheck, Calendar, Filter, ChevronDown, CheckCircle2,
  Activity, Star, Flame, Trophy, Eye, Briefcase, RefreshCcw, BrainCircuit, HeartHandshake, Scissors
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { aiApi } from '../services/api/ai';
import { reportsApi } from '../services/api/reports';
import { hrApi } from '../services/api/hr';
import { socketService } from '../services/socketService';
import { useAutonomousEngine } from '../stores/useAutonomousEngine';

import { KitchenPerformanceWidget, DeliveryStatusWidget } from './dashboard/KitchenDispatchWidgets';
import { ChefHat, Truck, LayoutDashboard } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9'];

type Scope = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

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
  trendData: Array<{ name: string; revenue: number; prevRevenue?: number }>;
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

// --- Subcomponents for Premium UI ---

interface MetricCardProps {
  label: string;
  value: any;
  subValue?: string;
  icon: any;
  color: string;
  trend?: { val: number; up: boolean };
  target?: number;
  permission?: AppPermission;
  lang: string;
  hasPermission: (p: AppPermission) => boolean;
  onClick?: () => void;
}

const MetricCard = React.memo<MetricCardProps>(({ label, value, subValue, icon: Icon, color, trend, target, permission, lang, hasPermission, onClick }) => {
  const progress = target ? Math.min(100, (value / target) * 100) : 0;
  
  return (
    <div 
      onClick={onClick}
      className={`relative group overflow-hidden bg-card/60 backdrop-blur-xl border border-border/30 rounded-[1.5rem] p-5 lg:p-6 transition-all hover:scale-[1.02] hover:bg-card/70 hover:shadow-2xl hover:shadow-black/5 active:scale-[0.98] ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Decorative gradient corner */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br transition-opacity duration-500 opacity-20 group-hover:opacity-30 blur-3xl`} style={{ background: color }} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.15em] text-muted mb-2">{label}</p>
          <h2 className="text-xl lg:text-3xl font-black text-main tracking-tighter tabular-nums flex items-end gap-1.5">
            <SensitiveData permission={permission} hasPermission={hasPermission} lang={lang}>
              {value}
            </SensitiveData>
            {subValue && <span className="text-xs font-bold text-muted mb-1 opacity-60">{subValue}</span>}
          </h2>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-[10px] font-black uppercase tracking-wider ${trend.up ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trend.val}% <span className="text-muted ml-1 opacity-70">{lang === 'ar' ? 'عن السابق' : 'vs prev'}</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl border flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12`} style={{ borderColor: `${color}30`, backgroundColor: `${color}15`, color }}>
          <Icon size={24} />
        </div>
      </div>

      {target && (
        <div className="mt-5 pt-4 border-t border-border/10 relative z-10">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted mb-2">
            <span>{lang === 'ar' ? 'الهدف المحقق' : 'Target Achieved'}</span>
            <span className={progress >= 100 ? 'text-emerald-500' : 'text-primary'}>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-elevated/40 rounded-full overflow-hidden border border-border/10">
            <div 
              className={`h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_12px_rgba(0,0,0,0.1)] ${progress >= 100 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-primary to-accent'}`}
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      )}
    </div>
  );
});

const Dashboard: React.FC = () => {
  const { settings, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const autonomousEngine = useAutonomousEngine();
  const { language: lang, isDarkMode, currencySymbol } = settings;
  const isAr = lang === 'ar';

  const [viewScope, setViewScope] = useState<Scope>('DAILY');
  const [customDates, setCustomDates] = useState({ start: formatLocalDate(new Date()), end: formatLocalDate(new Date()) });
  const [payload, setPayload] = useState<DashboardPayload>(EMPTY_PAYLOAD);
  const [prevPayload, setPrevPayload] = useState<DashboardPayload>(EMPTY_PAYLOAD);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState({ revenue: 5000, orders: 150 });
  
  // Real-time metrics
  const [liveMetrics, setLiveMetrics] = useState({ orders: 34, prep: 12, drivers: 4, activeStaff: 8 });

  const range = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    let compareStart = new Date(end);
    let compareEnd = new Date(end);

    if (viewScope === 'DAILY') { 
      start.setHours(0, 0, 0, 0); 
      compareStart.setFullYear(start.getFullYear() - 1);
      compareStart.setHours(0, 0, 0, 0);
      compareEnd.setFullYear(end.getFullYear() - 1);
    }
    else if (viewScope === 'WEEKLY') { 
      start.setDate(start.getDate() - 6); 
      start.setHours(0, 0, 0, 0); 
      compareStart.setDate(start.getDate() - 7);
      compareEnd.setDate(end.getDate() - 7);
    }
    else if (viewScope === 'MONTHLY') { 
      start.setDate(start.getDate() - 29); 
      start.setHours(0, 0, 0, 0); 
      compareStart.setMonth(start.getMonth() - 1);
      compareEnd.setMonth(end.getMonth() - 1);
    }
    else if (viewScope === 'YEARLY') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      compareStart.setFullYear(start.getFullYear() - 1);
      compareEnd.setFullYear(end.getFullYear() - 1);
    }
    else if (viewScope === 'CUSTOM') {
      return { 
        startDate: customDates.start, 
        endDate: customDates.end,
        compareStartDate: formatLocalDate(new Date(new Date(customDates.start).getFullYear() - 1, new Date(customDates.start).getMonth(), new Date(customDates.start).getDate())),
        compareEndDate: formatLocalDate(new Date(new Date(customDates.end).getFullYear() - 1, new Date(customDates.end).getMonth(), new Date(customDates.end).getDate()))
      };
    }

    return { 
      startDate: formatLocalDate(start), 
      endDate: formatLocalDate(end),
      compareStartDate: formatLocalDate(compareStart),
      compareEndDate: formatLocalDate(compareEnd)
    };
  }, [viewScope, customDates]);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const apiScope = (viewScope === 'YEARLY' || viewScope === 'CUSTOM') ? 'ALL' : viewScope as any;
        const [current, previous, staff] = await Promise.all([
          reportsApi.getDashboardKpis({ branchId: settings.activeBranchId, startDate: range.startDate, endDate: range.endDate, scope: apiScope }),
          reportsApi.getDashboardKpis({ branchId: settings.activeBranchId, startDate: range.compareStartDate, endDate: range.compareEndDate, scope: apiScope }).catch(() => EMPTY_PAYLOAD),
          hrApi.getEmployees().catch(() => [])
        ]);
        
        setPayload(current as DashboardPayload);
        setPrevPayload(previous as DashboardPayload);
        setEmployees(staff);
      } catch (e: any) {
        setError(e?.message || 'Failed to initialize dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [settings.activeBranchId, range, viewScope]);

  // Derived Trend Analysis
  const trends = useMemo(() => {
    const calcTrend = (cur: number, prev: number) => {
      if (prev === 0) return { val: 0, up: cur > 0 };
      const val = Math.round(((cur - prev) / prev) * 100);
      return { val: Math.abs(val), up: val >= 0 };
    };

    return {
      revenue: calcTrend(payload.totals.revenue, prevPayload.totals.revenue),
      orders: calcTrend(payload.totals.orderCount, prevPayload.totals.orderCount),
      avgTicket: calcTrend(payload.totals.avgTicket, prevPayload.totals.avgTicket),
      customers: calcTrend(payload.totals.uniqueCustomers, prevPayload.totals.uniqueCustomers)
    };
  }, [payload, prevPayload]);

  // Combined Chart Data
  const chartData = useMemo(() => {
    return payload.trendData.map((d, index) => ({
      ...d,
      prevRevenue: prevPayload.trendData[index]?.revenue || 0
    }));
  }, [payload.trendData, prevPayload.trendData]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="relative min-h-screen bg-app overflow-hidden">
      {/* ── Visual Effects Overlay ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1920px] mx-auto overflow-y-auto max-h-screen custom-scrollbar">
        
        {/* ── Header ── */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-border/20">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-primary to-accent p-0.5 shadow-xl shadow-primary/20">
              <div className="w-full h-full rounded-[1.1rem] bg-card flex items-center justify-center">
                <LayoutDashboard size={32} className="text-primary animate-pulse-soft" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-black text-main tracking-tight flex items-center gap-3">
                {isAr ? 'مركز العمليات الذكي' : 'Operations Intelligence Hub'}
                <span className="hidden md:flex px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left duration-700">
                  {isAr ? 'مباشر' : 'Live'}
                </span>
              </h1>
              <div className="flex items-center gap-4 mt-2 text-muted">
                <LiveClock format="HH:mm:ss" className="text-sm font-black tabular-nums opacity-80" />
                <div className="h-1 w-1 rounded-full bg-border" />
                <p className="text-xs font-bold opacity-60">{isAr ? 'تقارير أداء المنظومة' : 'Real-time performance analytics'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Range Select */}
            <div className="flex bg-card/60 backdrop-blur-md rounded-2xl border border-border/30 p-1">
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] as Scope[]).map(s => (
                <button
                  key={s}
                  onClick={() => setViewScope(s)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewScope === s ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted hover:text-main hover:bg-elevated'}`}
                >
                  {isAr ? (s === 'DAILY' ? 'اليوم' : s === 'WEEKLY' ? 'الأسبوع' : s === 'MONTHLY' ? 'الشهر' : 'مخصص') : s}
                </button>
              ))}
            </div>
            
            {viewScope === 'CUSTOM' && (
              <div className="flex items-center gap-2 animate-in zoom-in-95 duration-300">
                 <input 
                  type="date" 
                  value={customDates.start} 
                  onChange={e => setCustomDates(p => ({...p, start: e.target.value}))}
                  className="bg-card/60 backdrop-blur-md border border-border/30 rounded-xl px-4 py-2 text-xs font-bold text-main outline-none focus:border-primary/50"
                 />
                 <span className="text-muted">→</span>
                 <input 
                  type="date" 
                  value={customDates.end} 
                  onChange={e => setCustomDates(p => ({...p, end: e.target.value}))}
                  className="bg-card/60 backdrop-blur-md border border-border/30 rounded-xl px-4 py-2 text-xs font-bold text-main outline-none focus:border-primary/50"
                 />
              </div>
            )}

            <button className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95">
              <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} onClick={() => window.location.reload()} />
            </button>
          </div>
        </header>

        {/* ── Autonomous Insights ── */}
        {(autonomousEngine.peakLoad || autonomousEngine.revenueDrop || payload.totals.cancelRate > 5) && (
          <div className="flex animate-in slide-in-from-top-4 fade-in duration-700 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-4 lg:p-5 items-center gap-4 shadow-lg shadow-indigo-500/5">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <BrainCircuit className="text-indigo-500 animate-pulse-soft" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">{isAr ? 'توصيات الذكاء التشغيلي' : 'Autonomous Insights'}</h3>
              <p className="text-sm font-bold text-main mt-1 flex items-center flex-wrap gap-2">
                {autonomousEngine.peakLoad && <span className="px-2 py-0.5 text-[10px] uppercase font-black tracking-widest bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-lg">{isAr ? 'ضغط عالٍ' : 'Peak Load'}</span>}
                {autonomousEngine.revenueDrop && <span className="px-2 py-0.5 text-[10px] uppercase font-black tracking-widest bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg">{isAr ? 'انخفاض إيراد' : 'Revenue Drop'}</span>}
                <span className="opacity-80">{isAr ? 'يقترح وكيل العمليات تفعيل أنظمة التحفيز وتقييد المنتجات المعقدة لامتصاص الضغط.' : 'Ops & Finance Agents suggest activating promo campaigns and limiting complex items to absorb operational pressure.'}</span>
              </p>
            </div>
            <button className="h-10 px-6 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-500/20 whitespace-nowrap active:scale-95">
              {isAr ? 'تنفيذ الإجراءات' : 'Review & Act'}
            </button>
          </div>
        )}

        {/* ── Row 1: High Level KPI's with Performance Tracking ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 lg:gap-6">
          <MetricCard 
            label={isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}
            value={payload.totals.revenue.toLocaleString()}
            subValue={currencySymbol}
            icon={DollarSign}
            color="#10b981"
            trend={trends.revenue}
            target={targets.revenue}
            lang={lang}
            hasPermission={hasPermission}
            permission={AppPermission.DATA_VIEW_REVENUE}
          />
          <MetricCard 
            label={isAr ? 'حجم المبيعات' : 'Order Volume'}
            value={payload.totals.orderCount}
            icon={ShoppingBag}
            color="#6366f1"
            trend={trends.orders}
            target={targets.orders}
            lang={lang}
            hasPermission={hasPermission}
          />
          <MetricCard 
            label={isAr ? 'متوسط الفاتورة' : 'Average Ticket'}
            value={payload.totals.avgTicket.toFixed(2)}
            subValue={currencySymbol}
            icon={TrendingUp}
            color="#f59e0b"
            trend={trends.avgTicket}
            lang={lang}
            hasPermission={hasPermission}
            onClick={() => navigate('/reports/finance')}
          />
          <MetricCard 
            label={isAr ? 'الطاقم النشط' : 'Active Staff'}
            value={liveMetrics.activeStaff}
            subValue={`/ ${employees.length}`}
            icon={UserCheck}
            color="#ec4899"
            lang={lang}
            hasPermission={hasPermission}
            onClick={() => navigate('/hr')}
          />
          <MetricCard 
            label={isAr ? 'معدل الهدر' : 'Wastage Rate'}
            value={4.2}
            subValue="%"
            icon={Scissors}
            color="#ef4444"
            trend={{ val: 1.5, up: false }}
            lang={lang}
            hasPermission={hasPermission}
            onClick={() => navigate('/inventory')}
          />
          <MetricCard 
            label={isAr ? 'الاحتفاظ بالعملاء' : 'Customer Retention'}
            value={82}
            subValue="%"
            icon={HeartHandshake}
            color="#0ea5e9"
            trend={{ val: 5, up: true }}
            lang={lang}
            hasPermission={hasPermission}
            onClick={() => navigate('/crm')}
          />
        </section>

        {/* ── Row 2: Deep Analytics & Forecasting ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Main Chart: Revenue Comparison */}
          <div className="xl:col-span-2 bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] p-6 lg:p-8 flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-main tracking-tight">{isAr ? 'اتجاهات المبيعات والمقارنة' : 'Sales Trends & Comparison'}</h3>
                <p className="text-xs text-muted font-bold mt-1">{isAr ? 'مقارنة الفترة الحالية بنفس الفترة من العام السابق' : 'Comparing current period performance with previous year'}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-[10px] font-black uppercase text-muted">{isAr ? 'الحالي' : 'Current'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted/40" />
                  <span className="text-[10px] font-black uppercase text-muted">{isAr ? 'العام السابق' : 'Last Year'}</span>
                </div>
              </div>
            </div>

            <div className="w-full h-[400px] mt-4 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-border), 0.1)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'var(--color-muted)', fontWeight: 800 }} 
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'var(--color-muted)', fontWeight: 800 }} 
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(var(--color-card), 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(var(--color-border), 0.1)', borderRadius: '16px', padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="prevRevenue" name={isAr ? 'العام الماضي' : 'Last Year'} stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorPrev)" />
                  <Area type="monotone" dataKey="revenue" name={isAr ? 'الحالي' : 'Current'} stroke="rgb(var(--primary))" strokeWidth={4} fill="url(#colorCurrent)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Efficiency Radar */}
          <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] p-6 lg:p-8 shadow-xl flex flex-col">
            <h3 className="text-xl font-black text-main tracking-tight mb-8 flex items-center gap-3">
              <Activity className="text-accent" />
              {isAr ? 'مؤشر الكفاءة التشغيلية' : 'Operational Efficiency'}
            </h3>
            <div className="w-full h-[300px] mt-4 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                  { subject: isAr ? 'السرعة' : 'Speed', A: 85, fullMark: 100 },
                  { subject: isAr ? 'الجودة' : 'Quality', A: 92, fullMark: 100 },
                  { subject: isAr ? 'الدقة' : 'Accuracy', A: 78, fullMark: 100 },
                  { subject: isAr ? 'الخدمة' : 'Service', A: 95, fullMark: 100 },
                  { subject: isAr ? 'التكلفة' : 'Cost', A: 65, fullMark: 100 },
                ]}>
                  <PolarGrid stroke="rgba(var(--color-border), 0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--color-muted)', fontWeight: 800 }} />
                  <Radar name="Efficiency" dataKey="A" stroke="rgb(var(--accent))" fill="rgb(var(--accent))" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-elevated/40 rounded-2xl border border-border/20 text-center">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">{isAr ? 'أداء المطبخ' : 'Kitchen Score'}</p>
                <p className="text-xl font-black text-main mt-1">94%</p>
              </div>
              <div className="p-4 bg-elevated/40 rounded-2xl border border-border/20 text-center">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">{isAr ? 'أداء التوصيل' : 'Delivery Score'}</p>
                <p className="text-xl font-black text-main mt-1">82%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Employee Performance & Branch Status ── */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Top Employees */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] p-6 lg:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-main tracking-tight flex items-center gap-3">
                  <Trophy className="text-yellow-500" />
                  {isAr ? 'أفضل الموظفين أداءً' : 'Top Performing Staff'}
                </h3>
                <button className="text-[10px] font-black uppercase text-primary hover:underline">{isAr ? 'عرض الكل' : 'View All'}</button>
              </div>
              <div className="space-y-4">
                {employees.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0)).slice(0, 4).map((emp, i) => (
                  <div key={emp.id} className="group flex items-center gap-4 p-4 rounded-[1.25rem] bg-elevated/30 border border-border/20 hover:bg-elevated/60 transition-all">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-black text-primary border border-primary/20">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-card border-2 border-primary text-[10px] font-black flex items-center justify-center text-main shadow-lg">
                        #{i+1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-main truncate">{emp.name}</h4>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{emp.role || (isAr ? 'موظف' : 'Staff')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-500 tabular-nums">15,420 {currencySymbol}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <Star size={10} className="fill-yellow-500 text-yellow-500" />
                        <span className="text-[10px] font-black text-main">4.9</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform / Order Source Breakdown */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] p-6 lg:p-8 shadow-xl">
              <h3 className="text-xl font-black text-main tracking-tight mb-8">{isAr ? 'توزيع مصادر الطلبات' : 'Order Source Distribution'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={payload.orderTypeBreakdown}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {payload.orderTypeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {payload.orderTypeBreakdown.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs font-black text-main uppercase tracking-widest">{item.name}</span>
                      </div>
                      <span className="text-sm font-black text-muted tabular-nums">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </section>

        {/* ── Row 4: Real-time Operational Live Monitoring ── */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 min-h-[500px]">
          <div className="theme-card overflow-hidden flex flex-col p-8">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-main tracking-tight flex items-center gap-3">
                 <Flame className="text-rose-500" />
                 {isAr ? 'مراقبة المطبخ الحية' : 'Live Kitchen Monitor'}
               </h3>
               <button className="h-10 px-6 rounded-xl bg-elevated border border-border/40 text-[10px] font-black uppercase tracking-widest hover:bg-border transition-colors">
                  {isAr ? 'فتح الشاشة الكاملة' : 'Open KDS'}
               </button>
             </div>
             <div className="flex-1">
                <KitchenPerformanceWidget />
             </div>
          </div>
          <div className="theme-card overflow-hidden flex flex-col p-8">
             <h3 className="text-xl font-black text-main tracking-tight mb-8 flex items-center gap-3">
               <Truck className="text-cyan-500" />
               {isAr ? 'أداء التوصيل والمناديب' : 'Delivery & Logistics'}
             </h3>
             <div className="flex-1">
                <DeliveryStatusWidget />
             </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;
