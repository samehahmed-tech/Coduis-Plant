import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Activity, AlertTriangle, Eye, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { translations } from '../services/translations';
import { analyticsApi } from '../services/api';

type BranchPerf = {
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

const FranchiseManager: React.FC = () => {
    const { settings, hasPermission, setActiveBranch } = useAuthStore();
    const lang = settings.language || 'en';
    const t = translations[lang];
    const [data, setData] = useState<BranchPerf[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const load = async () => {
        setIsLoading(true);
        try {
            const rows = await analyticsApi.getBranchPerformance();
            setData(rows);
        } catch (error) {
            console.error('Failed to load branch analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const benchmark = useMemo(() => {
        const avgRevenue = data.length > 0 ? data.reduce((s, b) => s + b.revenue, 0) / data.length : 0;
        return data.map(b => ({
            ...b,
            revenueDeltaPct: avgRevenue > 0 ? ((b.revenue - avgRevenue) / avgRevenue) * 100 : 0,
            anomaly: b.cancelled > Math.max(3, b.ordersCount * 0.12) || b.lowStock > 10,
        }));
    }, [data]);

    return (
        <div className="p-6 lg:p-10 bg-app min-h-screen pb-24">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                    <Building2 size={26} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-main uppercase tracking-tight">Multi-Branch Control</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                        Server-verified metrics with permission-scoped drill-down.
                    </p>
                </div>
                <div className="ml-auto px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Eye size={12} />
                    Read-only
                </div>
            </div>

            {isLoading && (
                <div className="bg-card border border-border rounded-3xl p-6 text-sm text-muted">Loading analytics...</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {benchmark.map((branch) => (
                    <div key={branch.branchId} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black text-main">{branch.branchName}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted">{branch.location || branch.branchId}</p>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${branch.anomaly ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                {branch.anomaly ? 'ANOMALY' : 'OK'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Revenue</div>
                                <div className="text-xl font-black text-main">{t.currency || 'EGP'} {branch.revenue.toFixed(0)}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Orders</div>
                                <div className="text-xl font-black text-main flex items-center gap-2">
                                    <Activity size={16} /> {branch.ordersCount}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Low Stock</div>
                                <div className="text-xl font-black text-amber-500 flex items-center gap-2">
                                    <AlertTriangle size={16} /> {branch.lowStock}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Benchmark</div>
                                <div className={`text-sm font-black flex items-center gap-2 ${branch.revenueDeltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    <TrendingUp size={14} /> {branch.revenueDeltaPct >= 0 ? '+' : ''}{branch.revenueDeltaPct.toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end">
                            <button
                                onClick={() => setActiveBranch(branch.branchId)}
                                disabled={!hasPermission('NAV_REPORTS' as any)}
                                className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                            >
                                <Eye size={14} />
                                Drill Down
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FranchiseManager;
