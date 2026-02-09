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
import { getBusinessInsights } from '../services/geminiService';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import AIAlertsWidget from './AIAlertsWidget';
import { reportsApi } from '../services/api';
import { socketService } from '../services/socketService';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9'];
type Scope = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL';

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
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
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
    if (totals.cancelRate > 8) list.push(lang === 'ar' ? 'ظ…ط¹ط¯ظ„ ط¥ظ„ط؛ط§ط، ظ…ط±طھظپط¹' : 'High cancellation rate');
    if (totals.pending > Math.max(5, Math.round(totals.orderCount * 0.35))) list.push(lang === 'ar' ? 'ط·ظ„ط¨ط§طھ ظ…ط¹ظ„ظ‚ط© ظƒط«ظٹط±ط©' : 'Too many pending orders');
    if (totals.avgTicket < 80 && totals.orderCount > 20) list.push(lang === 'ar' ? 'ظ…طھظˆط³ط· ط§ظ„ط·ظ„ط¨ ظ…ظ†ط®ظپط¶' : 'Average ticket is low');
    if (totals.paidRevenue < totals.revenue * 0.8 && totals.orderCount > 0) list.push(lang === 'ar' ? 'ظ†ط³ط¨ط© طھط­طµظٹظ„ ظ…ظ†ط®ظپط¶ط©' : 'Collection ratio is low');
    return list.slice(0, 4);
  }, [totals, lang]);

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const salesSummary = {
      todayRevenue: totals.revenue,
      totalOrders: totals.orderCount,
      avgOrder: totals.avgTicket.toFixed(1),
    };
    const result = await getBusinessInsights(salesSummary, [], lang, settings.geminiApiKey);
    setInsight(result);
    setLoadingInsight(false);
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

  const hasData = totals.orderCount > 0 || topCustomers.length > 0 || topItems.length > 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in transition-colors duration-200 min-h-screen pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="heading-lg text-main uppercase flex items-center gap-3">
            {lang === 'ar' ? 'ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…' : 'Dashboard'}
            <div className={`w-2.5 h-2.5 rounded-full ${hasData ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          </h2>
          <p className="text-sm text-muted font-semibold">
            {lang === 'ar' ? 'طھظپط§طµظٹظ„ طھط´ط؛ظٹظ„ظٹط© ظ„ط­ط¸ظٹط© ظ„ظ„ظ…ط¨ظٹط¹ط§طھ ظˆط§ظ„ط¹ظ…ظ„ظٹط§طھ' : 'Live operational and financial breakdown'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {(['DAILY', 'WEEKLY', 'MONTHLY', 'ALL'] as Scope[]).map(scope => (
            <button
              key={scope}
              onClick={() => setViewScope(scope)}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${viewScope === scope ? 'bg-primary text-white border-primary' : 'bg-elevated text-main border-border/40'}`}
            >
              {scope}
            </button>
          ))}
          <button
            onClick={handleGenerateInsight}
            className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary/20 transition-all"
          >
            <Sparkles size={14} />
            {loadingInsight ? 'Loading...' : 'AI Intel'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card-primary p-6 rounded-2xl text-[11px] font-black uppercase tracking-widest text-indigo-600">
          Loading dashboard data from PostgreSQL...
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
          <h3 className="text-xl font-black text-main mb-2">{lang === 'ar' ? 'ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ط¨ط¹ط¯' : 'No data yet'}</h3>
          <p className="text-muted mb-6 max-w-md mx-auto">
            {lang === 'ar' ? 'ط§ط¨ط¯ط£ ط¨ط¥ط¶ط§ظپط© ط§ظ„ط£طµظ†ط§ظپ ظˆط§ظ„ط·ظ„ط¨ط§طھ ظ„ط¹ط±ط¶ طھظپط§طµظٹظ„ ط§ظ„ط£ط¯ط§ط، ظ‡ظ†ط§.' : 'Start with menu items and orders to unlock full dashboard insights.'}
          </p>
          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/menu')} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all">Add Menu</button>
            <button onClick={() => navigate('/pos')} className="px-6 py-3 bg-elevated text-main rounded-2xl font-bold text-sm hover:bg-card transition-all">Open POS</button>
          </div>
        </div>
      )}

      {!loading && hasData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[
              { label: 'Revenue', value: `${totals.revenue.toLocaleString()} ${currencySymbol}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10', perm: AppPermission.DATA_VIEW_REVENUE },
              { label: 'Paid Revenue', value: `${totals.paidRevenue.toLocaleString()} ${currencySymbol}`, icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10', perm: AppPermission.DATA_VIEW_REVENUE },
              { label: 'Orders', value: String(totals.orderCount), icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10', perm: AppPermission.DATA_VIEW_REVENUE },
              { label: 'Avg Ticket', value: `${totals.avgTicket.toFixed(1)} ${currencySymbol}`, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-500/10', perm: AppPermission.DATA_VIEW_REVENUE },
              { label: 'Unique Guests', value: String(totals.uniqueCustomers), icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-500/10', perm: AppPermission.DATA_VIEW_CUSTOMER_SENSITIVE },
              { label: 'Items Sold', value: String(totals.itemsSold), icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10', perm: AppPermission.DATA_VIEW_REVENUE },
            ].map((stat, index) => (
              <div key={index} className="card-primary p-5 rounded-2xl hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">{stat.label}</p>
                    <h3 className="text-xl font-black text-main mt-1">
                      <SensitiveData permission={stat.perm} hasPermission={hasPermission} lang={lang}>
                        {stat.value}
                      </SensitiveData>
                    </h3>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="card-primary p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-main">{lang === 'ar' ? 'ط§طھط¬ط§ظ‡ ط§ظ„ظ…ط¨ظٹط¹ط§طھ' : 'Revenue Trend'}</h3>
                  <div className="text-xs text-muted font-bold">{viewScope}</div>
                </div>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 11, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 11, fontWeight: 700 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="revenue" stroke={primaryColor} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-primary p-6 rounded-3xl">
                  <h3 className="text-sm font-black text-main mb-4 uppercase tracking-widest">Payments Mix</h3>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                          {paymentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {paymentBreakdown.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-elevated/60 border border-border/40">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] font-bold text-main truncate">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-primary p-6 rounded-3xl">
                  <h3 className="text-sm font-black text-main mb-4 uppercase tracking-widest">Order Types</h3>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orderTypeBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 11, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 11, fontWeight: 700 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="value" fill={primaryColor} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-primary p-6 rounded-3xl">
                  <h3 className="text-sm font-black text-main mb-4 uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={14} className="text-primary" />
                    Branch Performance
                  </h3>
                  <div className="space-y-3">
                    {branchPerformance.length === 0 && <p className="text-xs text-muted">No branch data.</p>}
                    {branchPerformance.map((b) => (
                      <div key={b.branchId} className="p-3 rounded-xl bg-elevated/50 border border-border/40">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-black text-main">{b.branchName}</p>
                          <p className="text-[11px] font-black text-emerald-600">{b.revenue.toLocaleString()} {currencySymbol}</p>
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-muted font-bold">
                          <span>{b.orders} orders</span>
                          <span>Avg {b.avgTicket.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-primary p-6 rounded-3xl">
                  <h3 className="text-sm font-black text-main mb-4 uppercase tracking-widest">Top Selling Items</h3>
                  <div className="space-y-2">
                    {topItems.length === 0 && <p className="text-xs text-muted">No item sales yet.</p>}
                    {topItems.map((item, i) => (
                      <div key={`${item.name}-${i}`} className="flex items-center justify-between p-2.5 rounded-xl bg-elevated/50 border border-border/40">
                        <div>
                          <p className="text-xs font-black text-main">{item.name}</p>
                          <p className="text-[10px] text-muted">{item.qty} units</p>
                        </div>
                        <p className="text-[11px] font-black text-emerald-600">{item.revenue.toLocaleString()} {currencySymbol}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AIAlertsWidget />

              <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-xl">
                      <Sparkles size={18} />
                    </div>
                    <h4 className="font-black text-base uppercase tracking-tight">AI Advisor</h4>
                  </div>
                  {loadingInsight ? (
                    <p className="text-sm opacity-80">Generating recommendation...</p>
                  ) : (
                    <p className="text-sm leading-relaxed font-medium min-h-[66px]">{insight || 'Run AI Intel to generate an executive summary for current scope.'}</p>
                  )}
                  <button onClick={() => navigate('/ai-insights')} className="w-full py-2.5 bg-white text-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                    Full Analysis
                  </button>
                </div>
              </div>

              <div className="card-primary p-6 rounded-3xl">
                <h3 className="text-sm font-black text-main mb-4 uppercase tracking-widest">Operational Snapshot</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted"><Clock3 size={14} /> Pending Orders</div>
                    <span className="font-black text-main">{totals.pending}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted"><AlertCircle size={14} /> Cancelled</div>
                    <span className="font-black text-rose-600">{totals.cancelled} ({totals.cancelRate.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted"><ShoppingBag size={14} /> Delivered</div>
                    <span className="font-black text-emerald-600">{totals.delivered}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted"><DollarSign size={14} /> Discounts</div>
                    <span className="font-black text-amber-600">{totals.discounts.toLocaleString()} {currencySymbol}</span>
                  </div>
                </div>
              </div>

              {alerts.length > 0 && (
                <div className="card-primary p-6 rounded-3xl border-rose-200/40">
                  <h3 className="text-sm font-black text-main mb-4 uppercase tracking-widest">Needs Attention</h3>
                  <div className="space-y-2">
                    {alerts.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-900/10 border border-rose-200/30">
                        <AlertCircle size={14} className="text-rose-500" />
                        <p className="text-xs font-bold text-main">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {categoryData.length > 0 && (
                <div className="card-primary p-6 rounded-3xl">
                  <h3 className="text-sm font-black text-main mb-4 uppercase tracking-widest">Top Categories</h3>
                  <div className="space-y-2">
                    {categoryData.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between p-2.5 rounded-xl bg-elevated/60 border border-border/40">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-xs font-bold text-main">{c.name}</span>
                        </div>
                        <span className="text-xs font-black text-emerald-600">{c.value.toLocaleString()} {currencySymbol}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {topCustomers.length > 0 && (
                <div className="card-primary p-6 rounded-3xl">
                  <h3 className="text-sm font-black text-main mb-4 uppercase tracking-widest">Top Customers</h3>
                  <div className="space-y-2">
                    {topCustomers.map((customer, i) => (
                      <div key={`${customer.id}-${i}`} className="flex justify-between items-center p-2.5 rounded-xl bg-elevated/60 border border-border/40">
                        <div>
                          <p className="text-xs font-black text-main">{customer.name}</p>
                          <p className="text-[10px] text-muted">{customer.visits || 0} visits</p>
                        </div>
                        <p className="text-xs font-black text-emerald-600">{(customer.totalSpent || 0).toLocaleString()} {currencySymbol}</p>
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
