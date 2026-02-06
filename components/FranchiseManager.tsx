import React, { useMemo } from 'react';
import { Building2, Activity, AlertTriangle, Eye } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { translations } from '../services/translations';

const FranchiseManager: React.FC = () => {
    const { branches, settings, hasPermission, setActiveBranch } = useAuthStore();
    const { orders } = useOrderStore();
    const { inventory } = useInventoryStore();
    const lang = settings.language || 'en';
    const t = translations[lang];

    const branchStats = useMemo(() => {
        return branches.map(branch => {
            const branchOrders = orders.filter(o => o.branchId === branch.id);
            const revenue = branchOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            const openOrders = branchOrders.filter(o => o.status !== 'DELIVERED').length;
            const lowStock = inventory.filter(i => i.threshold > 0 && (i.warehouseQuantities || []).some(w => w.quantity <= i.threshold)).length;
            return {
                branch,
                revenue,
                openOrders,
                lowStock
            };
        });
    }, [branches, orders, inventory]);

    return (
        <div className="p-6 lg:p-10 bg-app min-h-screen pb-24">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                    <Building2 size={26} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-main uppercase tracking-tight">Multi-Branch Control</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                        Read-only overview. Drill down by permission.
                    </p>
                </div>
                <div className="ml-auto px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Eye size={12} />
                    Read-only
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {branchStats.map(({ branch, revenue, openOrders, lowStock }) => (
                    <div key={branch.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black text-main">{branch.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted">{branch.location || branch.address}</p>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full">
                                ACTIVE
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Revenue</div>
                                <div className="text-xl font-black text-main">{t.currency || 'EGP'} {revenue.toFixed(0)}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Open Orders</div>
                                <div className="text-xl font-black text-main flex items-center gap-2">
                                    <Activity size={16} /> {openOrders}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Low Stock</div>
                                <div className="text-xl font-black text-amber-500 flex items-center gap-2">
                                    <AlertTriangle size={16} /> {lowStock}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Branch Id</div>
                                <div className="text-xs font-mono font-black text-main">{branch.id}</div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end">
                            <button
                                onClick={() => setActiveBranch(branch.id)}
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
