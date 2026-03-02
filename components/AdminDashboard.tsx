import React from 'react';
import {
    DollarSign,
    ShoppingBag,
    Activity,
    TrendingUp,
    Store,
    AlertTriangle,
    Calendar
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

type BranchPerformanceRow = {
    branchId: string;
    branchName: string;
    location: string;
    revenue: number;
    ordersCount: number;
    avgTicket: number;
    cancelled: number;
    activeOrders: number;
    lowStock: number;
};

interface AdminDashboardProps {
    lang: 'en' | 'ar';
    rows: BranchPerformanceRow[];
    isLoading: boolean;
    error: string | null;
    periodLabel: string;
}

const currencyLabel = (lang: 'en' | 'ar') => (lang === 'ar' ? 'ج.م' : 'EGP');
const formatCompact = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value || 0));
const formatMoney = (value: number, lang: 'en' | 'ar') => `${formatCompact(value)} ${currencyLabel(lang)}`;

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, rows, isLoading, error, periodLabel }) => {
    const totals = React.useMemo(() => {
        const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
        const totalOrders = rows.reduce((sum, row) => sum + Number(row.ordersCount || 0), 0);
        const totalActive = rows.reduce((sum, row) => sum + Number(row.activeOrders || 0), 0);
        const totalCancelled = rows.reduce((sum, row) => sum + Number(row.cancelled || 0), 0);
        const totalLowStock = rows.reduce((sum, row) => sum + Number(row.lowStock || 0), 0);
        const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        return { totalRevenue, totalOrders, totalActive, totalCancelled, totalLowStock, avgTicket };
    }, [rows]);

    const chartData = React.useMemo(
        () => rows.map((row) => ({
            name: row.branchName,
            revenue: Number(row.revenue || 0),
            orders: Number(row.ordersCount || 0),
        })),
        [rows],
    );

    const stats = [
        {
            title: lang === 'ar' ? 'إجمالي إيراد الفروع' : 'Total Group Revenue',
            value: formatMoney(totals.totalRevenue, lang),
            icon: DollarSign,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        },
        {
            title: lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
            value: formatCompact(totals.totalOrders),
            icon: ShoppingBag,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        },
        {
            title: lang === 'ar' ? 'متوسط الفاتورة' : 'Avg Ticket',
            value: formatMoney(totals.avgTicket, lang),
            icon: Activity,
            color: 'text-orange-600',
            bg: 'bg-orange-100 dark:bg-orange-900/30',
        },
        {
            title: lang === 'ar' ? 'طلبات قيد التشغيل' : 'Active Orders',
            value: formatCompact(totals.totalActive),
            icon: TrendingUp,
            color: 'text-rose-600',
            bg: 'bg-rose-100 dark:bg-rose-900/30',
        },
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen animate-fade-in transition-colors duration-200 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 uppercase flex items-center gap-3 tracking-tighter">
                        <Store className="text-indigo-500 shadow-xl" />
                        {lang === 'ar' ? 'لوحة أداء الفروع' : 'Branch Performance Dashboard'}
                    </h2>
                    <p className="text-sm md:text-base text-muted font-bold tracking-wide mt-1">
                        {lang === 'ar' ? 'مؤشرات تشغيلية ومالية حية لكل الفروع.' : 'Live operational and financial KPIs across branches.'}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-card/60 backdrop-blur-md p-2 px-4 rounded-xl border border-border/50 shadow-sm text-xs font-black text-main uppercase tracking-widest">
                    <Calendar size={14} className="text-indigo-500" />
                    {periodLabel}
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm font-bold flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div
                        key={stat.title}
                        className="relative overflow-hidden bg-card/80 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-500 group"
                        style={{ animationDelay: `${index * 60}ms` }}
                    >
                        {/* Glowing orb background */}
                        <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${stat.bg} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />

                        {/* Gradient accent top strip */}
                        <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-${stat.color.split('-')[1]}-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity`} />

                        <div className="flex justify-between items-start gap-4 relative z-10 mb-4">
                            <div className={`p-3.5 rounded-2xl ${stat.bg} shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ring-1 ring-white/10 shadow-inner`}>
                                <stat.icon size={24} className={stat.color} />
                            </div>
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted truncate mb-1.5 z-10 relative">{stat.title}</h3>
                        <p className="text-2xl xl:text-3xl font-black text-main tracking-tight z-10 relative" style={{ fontVariantNumeric: 'tabular-nums' }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 card-primary rounded-3xl p-6">
                    <h3 className="text-sm font-black text-main uppercase tracking-widest mb-6 border-b border-border/50 pb-4">
                        {lang === 'ar' ? 'مقارنة الإيراد حسب الفرع' : 'Revenue by Branch'}
                    </h3>
                    <div className="min-h-[260px] md:h-[320px] lg:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--border-color), 0.2)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(var(--text-muted))' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(var(--text-muted))' }} />
                                <Tooltip
                                    formatter={(value: any, key: any) => {
                                        if (key === 'revenue') return [formatMoney(Number(value || 0), lang), lang === 'ar' ? 'إيراد' : 'Revenue'];
                                        return [formatCompact(Number(value || 0)), lang === 'ar' ? 'طلبات' : 'Orders'];
                                    }}
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', color: 'white', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card-primary rounded-3xl p-6 flex flex-col justify-center">
                    <h3 className="text-sm font-black text-main uppercase tracking-widest mb-6 border-b border-border/50 pb-4">
                        {lang === 'ar' ? 'مخاطر تشغيلية' : 'Operational Risks'}
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 group hover:bg-amber-500/20 transition-all">
                            <span className="text-amber-600 dark:text-amber-500 text-sm font-black uppercase tracking-wider">{lang === 'ar' ? 'طلبات ملغاة' : 'Cancelled Orders'}</span>
                            <span className="text-xl font-black text-amber-600 bg-amber-500/20 px-3 py-1 rounded-xl">{formatCompact(totals.totalCancelled)}</span>
                        </div>
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 group hover:bg-rose-500/20 transition-all">
                            <span className="text-rose-600 dark:text-rose-500 text-sm font-black uppercase tracking-wider">{lang === 'ar' ? 'أصناف منخفضة المخزون' : 'Low Stock Alerts'}</span>
                            <span className="text-xl font-black text-rose-600 bg-rose-500/20 px-3 py-1 rounded-xl">{formatCompact(totals.totalLowStock)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-primary rounded-3xl overflow-hidden border border-border/50 shadow-xl">
                <div className="p-6 border-b border-border/50 bg-card">
                    <h3 className="font-black text-main uppercase tracking-widest text-sm">
                        {lang === 'ar' ? 'تفاصيل الأداء لكل فرع' : 'Branch Performance Details'}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-elevated/50 text-muted text-[10px] uppercase font-black tracking-widest">
                                <th className="px-6 py-4 rounded-tl-xl">{lang === 'ar' ? 'الفرع' : 'Branch'}</th>
                                <th className="px-6 py-4">{lang === 'ar' ? 'الإيراد' : 'Revenue'}</th>
                                <th className="px-6 py-4">{lang === 'ar' ? 'الطلبات' : 'Orders'}</th>
                                <th className="px-6 py-4">{lang === 'ar' ? 'متوسط الفاتورة' : 'Avg Ticket'}</th>
                                <th className="px-6 py-4">{lang === 'ar' ? 'الطلبات النشطة' : 'Active'}</th>
                                <th className="px-6 py-4">{lang === 'ar' ? 'الإلغاءات' : 'Cancelled'}</th>
                                <th className="px-6 py-4 rounded-tr-xl">{lang === 'ar' ? 'تنبيهات المخزون' : 'Low Stock'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30 bg-card">
                            {rows.map((row) => (
                                <tr key={row.branchId} className="hover:bg-elevated/50 transition-colors group">
                                    <td className="px-6 py-4 font-black text-sm text-main">{row.branchName}</td>
                                    <td className="px-6 py-4 font-black text-emerald-500">{formatMoney(row.revenue, lang)}</td>
                                    <td className="px-6 py-4 font-black text-xs text-indigo-400 group-hover:text-indigo-500">{formatCompact(row.ordersCount)}</td>
                                    <td className="px-6 py-4 font-black text-xs text-muted">{formatMoney(row.avgTicket, lang)}</td>
                                    <td className="px-6 py-4 text-xs font-black text-blue-500">{formatCompact(row.activeOrders)}</td>
                                    <td className="px-6 py-4 text-xs font-black text-rose-500">{formatCompact(row.cancelled)}</td>
                                    <td className="px-6 py-4 text-xs font-black text-amber-500">{formatCompact(row.lowStock)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!isLoading && rows.length === 0 && (
                        <div className="px-6 py-12 text-center text-sm font-black text-muted uppercase tracking-widest">
                            {lang === 'ar' ? 'لا توجد بيانات أداء للفروع في الفترة الحالية.' : 'No branch performance data for the selected period.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
