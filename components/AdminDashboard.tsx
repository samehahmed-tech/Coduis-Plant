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
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Store className="text-indigo-600" />
                        {lang === 'ar' ? 'لوحة أداء الفروع' : 'Branch Performance Dashboard'}
                    </h2>
                    <p className="text-sm text-slate-500 font-bold">
                        {lang === 'ar' ? 'مؤشرات تشغيلية ومالية حية لكل الفروع.' : 'Live operational and financial KPIs across branches.'}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-black text-slate-500">
                    <Calendar size={14} />
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
                {stats.map((stat) => (
                    <div key={stat.title} className="card-primary !p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center`}>
                                <stat.icon size={22} />
                            </div>
                        </div>
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{stat.title}</h3>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 card-primary !p-6">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">
                        {lang === 'ar' ? 'مقارنة الإيراد حسب الفرع' : 'Revenue by Branch'}
                    </h3>
                    <div className="min-h-[260px] md:h-[320px] lg:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} />
                                <Tooltip
                                    formatter={(value: any, key: any) => {
                                        if (key === 'revenue') return [formatMoney(Number(value || 0), lang), lang === 'ar' ? 'إيراد' : 'Revenue'];
                                        return [formatCompact(Number(value || 0)), lang === 'ar' ? 'طلبات' : 'Orders'];
                                    }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card-primary !p-6">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">
                        {lang === 'ar' ? 'مخاطر تشغيلية' : 'Operational Risks'}
                    </h3>
                    <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold">
                            {lang === 'ar' ? 'طلبات ملغاة' : 'Cancelled Orders'}: {formatCompact(totals.totalCancelled)}
                        </div>
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold">
                            {lang === 'ar' ? 'أصناف منخفضة المخزون' : 'Low Stock Alerts'}: {formatCompact(totals.totalLowStock)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-primary !p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {lang === 'ar' ? 'تفاصيل الأداء لكل فرع' : 'Branch Performance Details'}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest">
                                <th className="px-6 py-4">{lang === 'ar' ? 'الفرع' : 'Branch'}</th>
                                <th className="px-6 py-4">{lang === 'ar' ? 'الإيراد' : 'Revenue'}</th>
                                <th className="px-6 py-4">{lang === 'ar' ? 'الطلبات' : 'Orders'}</th>
                                <th className="px-6 py-4">{lang === 'ar' ? 'متوسط الفاتورة' : 'Avg Ticket'}</th>
                                <th className="px-6 py-4">{lang === 'ar' ? 'الطلبات النشطة' : 'Active'}</th>
                                <th className="px-6 py-4">{lang === 'ar' ? 'الإلغاءات' : 'Cancelled'}</th>
                                <th className="px-6 py-4">{lang === 'ar' ? 'تنبيهات المخزون' : 'Low Stock'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {rows.map((row) => (
                                <tr key={row.branchId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-black text-sm text-slate-800 dark:text-white">{row.branchName}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">{formatMoney(row.revenue, lang)}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{formatCompact(row.ordersCount)}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{formatMoney(row.avgTicket, lang)}</td>
                                    <td className="px-6 py-4 text-xs font-black text-indigo-600">{formatCompact(row.activeOrders)}</td>
                                    <td className="px-6 py-4 text-xs font-black text-rose-500">{formatCompact(row.cancelled)}</td>
                                    <td className="px-6 py-4 text-xs font-black text-amber-600">{formatCompact(row.lowStock)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!isLoading && rows.length === 0 && (
                        <div className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                            {lang === 'ar' ? 'لا توجد بيانات أداء للفروع في الفترة الحالية.' : 'No branch performance data for the selected period.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
