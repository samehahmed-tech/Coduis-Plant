import React from 'react';
import { Headset, RefreshCw, Users, Bike, Ban, Clock3, Percent, DollarSign, PhoneCall, Route, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ordersApi, deliveryApi, callCenterSupervisorApi, getActionableErrorMessage } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';

type AnyOrder = Record<string, any>;
type AnyDriver = Record<string, any>;
type Escalation = {
    id: string;
    orderId: string;
    branchId?: string | null;
    status: 'OPEN' | 'RESOLVED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reason: string;
    notes?: string | null;
    createdBy?: string | null;
    createdAt: string;
    assignedTo?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: string | null;
    resolutionNotes?: string | null;
};
type CoachingNote = {
    id: string;
    agentId: string;
    branchId?: string | null;
    note: string;
    tags?: string[];
    createdBy?: string | null;
    createdAt: string;
};
type DiscountViolation = {
    orderId: string;
    branchId?: string | null;
    agentId?: string | null;
    status: string;
    subtotal: number;
    discount: number;
    total: number;
    discountPercent: number;
    createdAt: string;
    approved?: boolean;
};

const getOrderDate = (o: AnyOrder) => new Date(o.created_at || o.createdAt || Date.now());
const getOrderStatus = (o: AnyOrder) => String(o.status || '').toUpperCase();
const getOrderTotal = (o: AnyOrder) => Number(o.total || 0);
const getOrderDiscount = (o: AnyOrder) => Number(o.discount || 0);

const CallCenterManager: React.FC = () => {
    const { settings, branches, users } = useAuthStore();
    const lang = (settings.language || 'en') as 'en' | 'ar';
    const currency = settings.currencySymbol || (lang === 'ar' ? 'ج.م' : 'EGP');
    const branchId = settings.activeBranchId || '';

    const [fromDate, setFromDate] = React.useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().slice(0, 10);
    });
    const [toDate, setToDate] = React.useState(() => new Date().toISOString().slice(0, 10));
    const [selectedBranch, setSelectedBranch] = React.useState(branchId);
    const [orders, setOrders] = React.useState<AnyOrder[]>([]);
    const [drivers, setDrivers] = React.useState<AnyDriver[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [escalations, setEscalations] = React.useState<Escalation[]>([]);
    const [coachingNotes, setCoachingNotes] = React.useState<CoachingNote[]>([]);
    const [escalatingOrderId, setEscalatingOrderId] = React.useState<string | null>(null);
    const [resolvingEscalationId, setResolvingEscalationId] = React.useState<string | null>(null);
    const [isScanningEscalations, setIsScanningEscalations] = React.useState(false);
    const [coachingAgentId, setCoachingAgentId] = React.useState<string>('');
    const [coachingNoteInput, setCoachingNoteInput] = React.useState('');
    const [isSavingCoaching, setIsSavingCoaching] = React.useState(false);
    const [discountViolations, setDiscountViolations] = React.useState<DiscountViolation[]>([]);
    const [isApprovingDiscountOrderId, setIsApprovingDiscountOrderId] = React.useState<string | null>(null);
    const [showFilters, setShowFilters] = React.useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

    const load = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const orderParams: any = { limit: 500 };
            if (selectedBranch) orderParams.branch_id = selectedBranch;
            const [allOrders, allDrivers] = await Promise.all([
                ordersApi.getAll(orderParams),
                deliveryApi.getDrivers(selectedBranch ? { branchId: selectedBranch } : undefined),
            ]);
            const [escalationData, coachingData, discountAbuseData] = await Promise.all([
                callCenterSupervisorApi.getEscalations({
                    status: 'OPEN',
                    ...(selectedBranch ? { branchId: selectedBranch } : {}),
                }),
                callCenterSupervisorApi.getCoachingNotes(selectedBranch ? { branchId: selectedBranch } : undefined),
                callCenterSupervisorApi.getDiscountAbuse({
                    ...(selectedBranch ? { branchId: selectedBranch } : {}),
                    startDate: fromDate,
                    endDate: toDate,
                    thresholdPercent: 20,
                    thresholdAmount: 120,
                }),
            ]);

            const start = new Date(`${fromDate}T00:00:00`);
            const end = new Date(`${toDate}T23:59:59.999`);

            const ccOrders = (Array.isArray(allOrders) ? allOrders : []).filter((o) => {
                const source = String(o.source || '').toLowerCase();
                const isCallCenter = o.is_call_center_order === true || o.isCallCenterOrder === true || source === 'call_center';
                const inDate = getOrderDate(o) >= start && getOrderDate(o) <= end;
                return isCallCenter && inDate;
            });

            setOrders(ccOrders);
            setDrivers(Array.isArray(allDrivers) ? allDrivers : []);
            setEscalations(Array.isArray(escalationData) ? escalationData : []);
            setCoachingNotes(Array.isArray(coachingData) ? coachingData : []);
            setDiscountViolations(Array.isArray(discountAbuseData?.violations) ? discountAbuseData.violations : []);
        } catch (e: any) {
            setError(e?.message || 'Failed to load call center overview');
            setOrders([]);
            setDrivers([]);
            setEscalations([]);
            setCoachingNotes([]);
            setDiscountViolations([]);
        } finally {
            setIsLoading(false);
        }
    }, [fromDate, toDate, selectedBranch]);

    React.useEffect(() => {
        load();
    }, [load]);

    React.useEffect(() => {
        const updateLayout = () => {
            const wide = window.innerWidth >= 1024;
            if (wide) {
                setShowFilters(true);
            }
        };
        updateLayout();
        window.addEventListener('resize', updateLayout);
        return () => window.removeEventListener('resize', updateLayout);
    }, []);

    const metrics = React.useMemo(() => {
        const totalOrders = orders.length;
        const delivered = orders.filter((o) => getOrderStatus(o) === 'DELIVERED').length;
        const cancelled = orders.filter((o) => getOrderStatus(o) === 'CANCELLED').length;
        const active = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(getOrderStatus(o))).length;
        const revenue = orders.reduce((sum, o) => sum + getOrderTotal(o), 0);
        const discounts = orders.reduce((sum, o) => sum + getOrderDiscount(o), 0);
        const oldPending = orders.filter((o) => {
            const status = getOrderStatus(o);
            if (!['PENDING', 'PREPARING', 'READY'].includes(status)) return false;
            const mins = (Date.now() - getOrderDate(o).getTime()) / 60000;
            return mins >= 20;
        }).length;
        return {
            totalOrders,
            delivered,
            cancelled,
            active,
            revenue,
            discounts,
            oldPending,
            cancelRate: totalOrders > 0 ? (cancelled / totalOrders) * 100 : 0,
        };
    }, [orders]);

    const agentStats = React.useMemo(() => {
        const map = new Map<string, { id: string; name: string; orders: number; revenue: number; cancelled: number; discounts: number; pending: number }>();
        for (const o of orders) {
            const id = String(o.call_center_agent_id || o.callCenterAgentId || 'UNASSIGNED');
            const foundUser = users.find((u) => u.id === id);
            const name = foundUser?.name || id;
            const entry = map.get(id) || { id, name, orders: 0, revenue: 0, cancelled: 0, discounts: 0, pending: 0 };
            entry.orders += 1;
            entry.revenue += getOrderTotal(o);
            entry.discounts += getOrderDiscount(o);
            if (getOrderStatus(o) === 'CANCELLED') entry.cancelled += 1;
            if (!['DELIVERED', 'CANCELLED'].includes(getOrderStatus(o))) entry.pending += 1;
            map.set(id, entry);
        }
        return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    }, [orders, users]);
    const coachingNotesByAgent = React.useMemo(() => {
        const map = new Map<string, CoachingNote[]>();
        for (const note of coachingNotes) {
            const arr = map.get(note.agentId) || [];
            arr.push(note);
            map.set(note.agentId, arr);
        }
        return map;
    }, [coachingNotes]);

    const activeOrdersByDriver = React.useMemo(() => {
        const m = new Map<string, AnyOrder[]>();
        for (const o of orders) {
            const driverId = String(o.driver_id || o.driverId || '');
            if (!driverId) continue;
            if (['DELIVERED', 'CANCELLED'].includes(getOrderStatus(o))) continue;
            const arr = m.get(driverId) || [];
            arr.push(o);
            m.set(driverId, arr);
        }
        return m;
    }, [orders]);

    const driverStats = React.useMemo(() => {
        return drivers.map((d) => {
            const id = String(d.id || '');
            const assigned = orders.filter((o) => String(o.driver_id || o.driverId || '') === id);
            const delivered = assigned.filter((o) => getOrderStatus(o) === 'DELIVERED').length;
            const activeOrders = activeOrdersByDriver.get(id) || [];
            return {
                id,
                name: d.name || d.fullName || id,
                status: String(d.status || 'UNKNOWN'),
                branchId: String(d.branchId || d.branch_id || ''),
                totalAssigned: assigned.length,
                delivered,
                activeCount: activeOrders.length,
                currentRoute: activeOrders[0]?.delivery_address || activeOrders[0]?.deliveryAddress || '-',
            };
        }).sort((a, b) => b.activeCount - a.activeCount);
    }, [drivers, orders, activeOrdersByDriver]);

    const cancelledOrders = React.useMemo(
        () => orders.filter((o) => getOrderStatus(o) === 'CANCELLED').slice(0, 10),
        [orders],
    );

    const pendingOrders = React.useMemo(
        () => orders.filter((o) => ['PENDING', 'PREPARING', 'READY'].includes(getOrderStatus(o))).slice(0, 12),
        [orders],
    );
    const escalatedOrderIds = React.useMemo(() => new Set(escalations.map((e) => e.orderId)), [escalations]);

    const createEscalation = async (order: AnyOrder) => {
        const orderId = String(order.id || '').trim();
        if (!orderId) return;
        if (escalatedOrderIds.has(orderId)) return;
        setEscalatingOrderId(orderId);
        try {
            const mins = Math.floor((Date.now() - getOrderDate(order).getTime()) / 60000);
            const priority: Escalation['priority'] = mins >= 45 ? 'CRITICAL' : mins >= 30 ? 'HIGH' : 'MEDIUM';
            const created = await callCenterSupervisorApi.createEscalation({
                orderId,
                branchId: selectedBranch || branchId || undefined,
                priority,
                reason: mins >= 45 ? 'SLA_BREACH' : 'SLA_RISK',
                notes: `Auto escalation from supervisor board at ${mins}m pending`,
            });
            setEscalations((prev) => [created, ...prev]);
        } catch (e: any) {
            setError(getActionableErrorMessage(e, lang));
        } finally {
            setEscalatingOrderId(null);
        }
    };

    const resolveEscalation = async (id: string) => {
        setResolvingEscalationId(id);
        try {
            await callCenterSupervisorApi.resolveEscalation(id, 'Resolved by supervisor');
            setEscalations((prev) => prev.filter((e) => e.id !== id));
        } catch (e: any) {
            setError(getActionableErrorMessage(e, lang));
        } finally {
            setResolvingEscalationId(null);
        }
    };

    const scanEscalations = async () => {
        setIsScanningEscalations(true);
        try {
            const result = await callCenterSupervisorApi.scanEscalations({
                thresholdMinutes: 20,
                branchId: selectedBranch || branchId || undefined,
            });
            if (Array.isArray(result.escalations) && result.escalations.length > 0) {
                setEscalations((prev) => [...result.escalations, ...prev]);
            }
        } catch (e: any) {
            setError(getActionableErrorMessage(e, lang));
        } finally {
            setIsScanningEscalations(false);
        }
    };

    const saveCoachingNote = async () => {
        const agentId = coachingAgentId.trim();
        const note = coachingNoteInput.trim();
        if (!agentId || !note) return;
        setIsSavingCoaching(true);
        try {
            const created = await callCenterSupervisorApi.addCoachingNote({
                agentId,
                note,
                branchId: selectedBranch || branchId || undefined,
            });
            setCoachingNotes((prev) => [created, ...prev]);
            setCoachingNoteInput('');
        } catch (e: any) {
            setError(getActionableErrorMessage(e, lang));
        } finally {
            setIsSavingCoaching(false);
        }
    };

    const approveDiscountViolation = async (violation: DiscountViolation, status: 'APPROVED' | 'REJECTED') => {
        setIsApprovingDiscountOrderId(violation.orderId);
        try {
            await callCenterSupervisorApi.approveDiscountViolation({
                orderId: violation.orderId,
                agentId: violation.agentId || undefined,
                branchId: selectedBranch || branchId || undefined,
                status,
                reason: status === 'APPROVED' ? 'Manager approved high discount' : 'Manager rejected high discount',
            });
            setDiscountViolations((prev) => prev.filter((v) => v.orderId !== violation.orderId));
        } catch (e: any) {
            setError(getActionableErrorMessage(e, lang));
        } finally {
            setIsApprovingDiscountOrderId(null);
        }
    };

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n || 0);
    const fmtMoney = (n: number) => `${fmt(n)} ${currency}`;

    const kpis = [
        { icon: PhoneCall, label: lang === 'ar' ? 'إجمالي طلبات الكول سنتر' : 'Call Center Orders', value: fmt(metrics.totalOrders) },
        { icon: Clock3, label: lang === 'ar' ? 'طلبات معلقة +20 دقيقة' : 'Pending > 20 min', value: fmt(metrics.oldPending) },
        { icon: Ban, label: lang === 'ar' ? 'إلغاءات' : 'Cancelled', value: `${fmt(metrics.cancelled)} (${metrics.cancelRate.toFixed(1)}%)` },
        { icon: DollarSign, label: lang === 'ar' ? 'مبيعات الكول سنتر' : 'Call Center Sales', value: fmtMoney(metrics.revenue) },
        { icon: Percent, label: lang === 'ar' ? 'إجمالي الخصومات' : 'Total Discounts', value: fmtMoney(metrics.discounts) },
        { icon: Bike, label: lang === 'ar' ? 'طلبات نشطة للتوصيل' : 'Active Delivery Orders', value: fmt(metrics.active) },
    ];

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen pb-24">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Headset className="text-indigo-600" />
                        {lang === 'ar' ? 'مركز تحكم مدير الكول سنتر' : 'Call Center Manager Control'}
                    </h1>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                        {lang === 'ar' ? 'متابعة شاملة للموظفين والمبيعات والطيارين والأوردرات.' : 'Complete view of agents, sales, drivers, orders, cancellations and pending.'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setShowFilters((prev) => !prev)}
                        className="lg:hidden px-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-xs font-black text-slate-700 dark:text-slate-200"
                    >
                        {showFilters ? (lang === 'ar' ? 'إخفاء الفلاتر' : 'Hide Filters') : (lang === 'ar' ? 'إظهار الفلاتر' : 'Show Filters')}
                    </button>
                </div>
                {showFilters && (
                <div className="w-full flex flex-wrap items-center gap-2 lg:w-auto">
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-xs font-bold"
                    >
                        <option value="">{lang === 'ar' ? 'كل الفروع' : 'All branches'}</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-xs font-bold" />
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-xs font-bold" />
                    <button onClick={load} disabled={isLoading} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center gap-2 disabled:opacity-60">
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        {lang === 'ar' ? 'تحديث' : 'Refresh'}
                    </button>
                </div>
                )}
            </div>

            {error && <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {kpis.map((k) => (
                    <div key={k.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <k.icon size={18} className="text-indigo-600" />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{k.label}</div>
                        <div className="text-xl font-black text-slate-900 dark:text-white">{k.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-2">
                        <Users size={14} /> {lang === 'ar' ? 'أداء موظفي الكول سنتر' : 'Agent Performance'}
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="text-slate-400 uppercase text-[10px]">
                                <tr>
                                    <th className="py-2">{lang === 'ar' ? 'الموظف' : 'Agent'}</th>
                                    <th>{lang === 'ar' ? 'طلبات' : 'Orders'}</th>
                                    <th>{lang === 'ar' ? 'مبيعات' : 'Sales'}</th>
                                    <th>{lang === 'ar' ? 'إلغاءات' : 'Cancelled'}</th>
                                    <th>{lang === 'ar' ? 'خصومات' : 'Discounts'}</th>
                                    <th>{lang === 'ar' ? 'معلق' : 'Pending'}</th>
                                    <th>{lang === 'ar' ? 'تدريب' : 'Coaching'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentStats.map((a) => (
                                    <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800">
                                        <td className="py-2 font-bold">{a.name}</td>
                                        <td>{fmt(a.orders)}</td>
                                        <td>{fmtMoney(a.revenue)}</td>
                                        <td className="text-rose-600 font-bold">{fmt(a.cancelled)}</td>
                                        <td>{fmtMoney(a.discounts)}</td>
                                        <td className="text-amber-600 font-bold">{fmt(a.pending)}</td>
                                        <td>
                                            <button
                                                onClick={() => setCoachingAgentId(a.id)}
                                                className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                {lang === 'ar' ? `ملاحظة (${coachingNotesByAgent.get(a.id)?.length || 0})` : `Note (${coachingNotesByAgent.get(a.id)?.length || 0})`}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {agentStats.length === 0 && <div className="py-6 text-center text-xs font-bold text-slate-400">{lang === 'ar' ? 'لا توجد بيانات موظفين للفترة.' : 'No agent data for selected period.'}</div>}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-2">
                        <Route size={14} /> {lang === 'ar' ? 'متابعة الطيارين' : 'Driver Tracking'}
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="text-slate-400 uppercase text-[10px]">
                                <tr>
                                    <th className="py-2">{lang === 'ar' ? 'الطيار' : 'Driver'}</th>
                                    <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                    <th>{lang === 'ar' ? 'نشط' : 'Active'}</th>
                                    <th>{lang === 'ar' ? 'تم التوصيل' : 'Delivered'}</th>
                                    <th>{lang === 'ar' ? 'الوجهة الحالية' : 'Current Route'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {driverStats.map((d) => (
                                    <tr key={d.id} className="border-t border-slate-100 dark:border-slate-800">
                                        <td className="py-2 font-bold">{d.name}</td>
                                        <td>{d.status}</td>
                                        <td className="text-indigo-600 font-bold">{fmt(d.activeCount)}</td>
                                        <td className="text-emerald-600 font-bold">{fmt(d.delivered)}</td>
                                        <td className="max-w-[240px] truncate">{d.currentRoute}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {driverStats.length === 0 && <div className="py-6 text-center text-xs font-bold text-slate-400">{lang === 'ar' ? 'لا يوجد طيارين متاحين.' : 'No drivers available.'}</div>}
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-600 mb-3">
                    {lang === 'ar' ? 'ملاحظات التدريب للموظفين' : 'Agent Coaching Notes'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-2 mb-3">
                    <select
                        value={coachingAgentId}
                        onChange={(e) => setCoachingAgentId(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-xs font-bold"
                    >
                        <option value="">{lang === 'ar' ? 'اختر موظف' : 'Select agent'}</option>
                        {agentStats.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                    <input
                        value={coachingNoteInput}
                        onChange={(e) => setCoachingNoteInput(e.target.value)}
                        placeholder={lang === 'ar' ? 'اكتب ملاحظة تدريب قصيرة...' : 'Write a coaching note...'}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                    <button
                        onClick={saveCoachingNote}
                        disabled={isSavingCoaching || !coachingAgentId.trim() || !coachingNoteInput.trim()}
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black disabled:opacity-60"
                    >
                        {lang === 'ar' ? 'حفظ الملاحظة' : 'Save Note'}
                    </button>
                </div>
                <div className="space-y-2 max-h-[260px] overflow-y-auto">
                    {coachingNotes.slice(0, 30).map((note) => {
                        const agentName = users.find((u) => u.id === note.agentId)?.name || note.agentId;
                        return (
                            <div key={note.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{agentName}</div>
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">{note.note}</div>
                                <div className="text-[10px] text-slate-400 mt-1">{new Date(note.createdAt).toLocaleString()}</div>
                            </div>
                        );
                    })}
                    {coachingNotes.length === 0 && (
                        <div className="py-4 text-center text-xs font-bold text-slate-400">
                            {lang === 'ar' ? 'لا توجد ملاحظات تدريب حالياً.' : 'No coaching notes yet.'}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-600 mb-3">
                    {lang === 'ar' ? 'مراقبة إساءة الخصومات' : 'Discount Abuse Monitor'}
                </h2>
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {discountViolations.map((v) => {
                        const agentName = users.find((u) => u.id === v.agentId)?.name || v.agentId || 'UNASSIGNED';
                        return (
                            <div key={v.orderId} className="p-3 rounded-xl border border-amber-100 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/30">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="font-black">#{v.orderId}</span>
                                    <span className="font-black text-amber-700">{v.discountPercent.toFixed(1)}%</span>
                                </div>
                                <div className="mt-1 text-[11px] text-slate-600">
                                    {lang === 'ar' ? 'الموظف:' : 'Agent:'} {agentName} | {lang === 'ar' ? 'الخصم:' : 'Discount:'} {fmtMoney(v.discount)}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        onClick={() => approveDiscountViolation(v, 'APPROVED')}
                                        disabled={isApprovingDiscountOrderId === v.orderId}
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                                    >
                                        {lang === 'ar' ? 'اعتماد' : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => approveDiscountViolation(v, 'REJECTED')}
                                        disabled={isApprovingDiscountOrderId === v.orderId}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                                    >
                                        {lang === 'ar' ? 'رفض' : 'Reject'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {discountViolations.length === 0 && (
                        <div className="py-4 text-center text-xs font-bold text-slate-400">
                            {lang === 'ar' ? 'لا توجد حالات خصم عالية غير معتمدة.' : 'No unapproved high-discount cases.'}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-2">
                        <Clock3 size={14} /> {lang === 'ar' ? 'الأوردرات المعلقة' : 'Pending Orders'}
                    </h2>
                    <div className="space-y-2 max-h-[360px] overflow-y-auto">
                        {pendingOrders.map((o) => {
                            const mins = Math.floor((Date.now() - getOrderDate(o).getTime()) / 60000);
                            const isEscalated = escalatedOrderIds.has(String(o.id));
                            return (
                                <div key={String(o.id)} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="font-black">#{o.order_number || o.orderNumber || o.id}</span>
                                        <span className="font-bold text-amber-600">{mins}m</span>
                                    </div>
                                    <div className="mt-1 text-[11px] text-slate-500">{o.customer_name || o.customerName || '-'} - {o.delivery_address || o.deliveryAddress || '-'}</div>
                                    <div className="mt-2">
                                        <button
                                            onClick={() => createEscalation(o)}
                                            disabled={isEscalated || escalatingOrderId === String(o.id)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${
                                                isEscalated
                                                    ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                                                    : 'bg-rose-600 text-white hover:bg-rose-700'
                                            }`}
                                        >
                                            <AlertTriangle size={12} />
                                            {isEscalated ? (lang === 'ar' ? 'تم التصعيد' : 'Escalated') : (lang === 'ar' ? 'تصعيد' : 'Escalate')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {pendingOrders.length === 0 && <div className="py-6 text-center text-xs font-bold text-slate-400">{lang === 'ar' ? 'لا توجد أوردرات معلقة.' : 'No pending orders.'}</div>}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-2">
                        <Ban size={14} /> {lang === 'ar' ? 'آخر الإلغاءات' : 'Latest Cancellations'}
                    </h2>
                    <div className="space-y-2 max-h-[360px] overflow-y-auto">
                        {cancelledOrders.map((o) => (
                            <div key={String(o.id)} className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 dark:bg-rose-900/10 dark:border-rose-900/30">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-black">#{o.order_number || o.orderNumber || o.id}</span>
                                    <span className="font-bold text-rose-600">{fmtMoney(getOrderTotal(o))}</span>
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500">{o.customer_name || o.customerName || '-'} - {o.cancel_reason || o.cancelReason || (lang === 'ar' ? 'بدون سبب' : 'No reason')}</div>
                            </div>
                        ))}
                        {cancelledOrders.length === 0 && <div className="py-6 text-center text-xs font-bold text-slate-400">{lang === 'ar' ? 'لا توجد إلغاءات في الفترة.' : 'No cancellations in selected period.'}</div>}
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                        <AlertTriangle size={14} /> {lang === 'ar' ? 'قائمة التصعيدات المفتوحة' : 'Open Escalations Queue'}
                    </h2>
                    <button
                        onClick={scanEscalations}
                        disabled={isScanningEscalations}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-60"
                    >
                        <RefreshCw size={12} className={isScanningEscalations ? 'animate-spin' : ''} />
                        {lang === 'ar' ? 'فحص تلقائي' : 'Auto Scan'}
                    </button>
                </div>
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {escalations.map((e) => (
                        <div key={e.id} className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 dark:bg-rose-900/10 dark:border-rose-900/30 flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-black">#{e.orderId} - {e.priority}</div>
                                <div className="text-[11px] text-slate-500">{e.reason} {e.notes ? `• ${e.notes}` : ''}</div>
                            </div>
                            <button
                                onClick={() => resolveEscalation(e.id)}
                                disabled={resolvingEscalationId === e.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
                            >
                                <CheckCircle2 size={12} />
                                {lang === 'ar' ? 'حل' : 'Resolve'}
                            </button>
                        </div>
                    ))}
                    {escalations.length === 0 && (
                        <div className="py-6 text-center text-xs font-bold text-slate-400">
                            {lang === 'ar' ? 'لا توجد تصعيدات مفتوحة حالياً.' : 'No open escalations right now.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallCenterManager;
