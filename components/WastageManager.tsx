import React, { useEffect, useMemo, useState } from 'react';
import {
    Trash2, DollarSign, AlertTriangle, Plus, X, Save, RefreshCw,
    Package, TrendingDown, BarChart3, Clock, Layers, Search
} from 'lucide-react';
import { wastageApi } from '../services/api/wastage';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useAuthStore } from '../stores/useAuthStore';
import ExportButton from './common/ExportButton';
import { useToast } from './common/ToastProvider';

type WastageEntry = {
    id: string;
    itemId: string;
    itemName?: string;
    warehouseId: string;
    quantity: number;
    reason: string;
    notes?: string;
    performedBy?: string;
    costImpact?: number;
    createdAt: string;
};

type WastageTab = 'log' | 'record' | 'analytics';

const REASONS = ['Expired', 'Damaged', 'Overproduction', 'Spoiled', 'Spillage', 'Return', 'Quality Fail', 'Other'];

const WastageManager: React.FC = () => {
    const { settings } = useAuthStore();
    const { inventory, warehouses } = useInventoryStore();
    const currency = settings.currencySymbol || 'LE';
    const { success, error: showError } = useToast();

    const [activeTab, setActiveTab] = useState<WastageTab>('log');
    const [entries, setEntries] = useState<WastageEntry[]>([]);
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ itemId: '', warehouseId: '', quantity: '1', reason: 'Expired', notes: '' });

    const load = async () => {
        setIsLoading(true);
        try {
            const [entries, rep] = await Promise.all([wastageApi.getRecent(100), wastageApi.getReport()]);
            setEntries(entries || []);
            setReport(rep);
        } catch { } finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleRecord = async () => {
        if (!form.itemId || !form.warehouseId || Number(form.quantity) <= 0) return;
        try {
            await wastageApi.record({
                itemId: form.itemId, warehouseId: form.warehouseId,
                quantity: Number(form.quantity), reason: form.reason,
                notes: form.notes || undefined, performedBy: settings.currentUser?.name || undefined,
            });
            setShowModal(false);
            setForm({ itemId: '', warehouseId: '', quantity: '1', reason: 'Expired', notes: '' });
            await load();
        } catch (e: any) { showError(e.message); }
    };

    const totals = useMemo(() => ({
        totalEvents: entries.length,
        totalCost: entries.reduce((s, e) => s + (e.costImpact || 0), 0),
        totalQty: entries.reduce((s, e) => s + e.quantity, 0),
        topReason: (() => {
            const counts: Record<string, number> = {};
            entries.forEach(e => { counts[e.reason] = (counts[e.reason] || 0) + 1; });
            return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        })(),
    }), [entries]);

    return (
        <div className="p-4 md:p-8 lg:p-10 bg-app min-h-screen pb-24">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-amber-600 to-red-600 text-white flex items-center justify-center shadow-2xl shadow-amber-600/30">
                            <Trash2 size={28} />
                        </div>
                        <h2 className="text-3xl font-black text-main uppercase tracking-tighter">Wastage Control</h2>
                    </div>
                    <p className="text-muted font-bold text-xs uppercase tracking-widest opacity-60">Record · Analyze · Reduce</p>
                </div>
                <div className="flex gap-2">
                    <ExportButton data={entries} columns={[
                        { key: 'itemName', label: 'Item' },
                        { key: 'quantity', label: 'Quantity' },
                        { key: 'reason', label: 'Reason' },
                        { key: 'notes', label: 'Notes' },
                        { key: 'performedBy', label: 'Performed By' },
                        { key: 'costImpact', label: 'Cost', format: (v: any) => `${(v || 0).toLocaleString()} ${currency}` },
                        { key: 'createdAt', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '' },
                    ]} filename="wastage" title="Wastage Report" />
                    <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-amber-600 to-red-600 text-white px-5 py-2.5 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"><Plus size={14} /> Record Wastage</button>
                    <button onClick={load} className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"><RefreshCw size={14} /></button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Wastage Events', value: totals.totalEvents, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Total Qty Lost', value: totals.totalQty, icon: Package, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'Cost Impact', value: `${totals.totalCost.toLocaleString()} ${currency}`, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
                    { label: 'Top Reason', value: totals.topReason, icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="card-primary border border-border p-5 rounded-[2rem] shadow-sm">
                        <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}><stat.icon size={16} /></div>
                        <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">{stat.label}</p>
                        <h4 className="text-xl font-black text-main">{stat.value}</h4>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-elevated/40 p-1.5 rounded-2xl border border-border w-fit">
                {[
                    { id: 'log' as WastageTab, label: 'Recent Log', icon: Clock },
                    { id: 'analytics' as WastageTab, label: 'Analytics', icon: BarChart3 },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-lg' : 'text-muted hover:text-main hover:bg-elevated/60'}`}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* LOG TAB */}
            {activeTab === 'log' && (
                <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
                    <div className="responsive-table">
                        <table className="w-full text-left">
                            <thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-[0.2em]">
                                <tr>
                                    <th className="px-6 py-4">Item</th>
                                    <th className="px-4 py-4">Qty</th>
                                    <th className="px-4 py-4">Reason</th>
                                    <th className="px-4 py-4">Notes</th>
                                    <th className="px-4 py-4">By</th>
                                    <th className="px-4 py-4 text-right">Cost</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {isLoading && <tr><td colSpan={7} className="px-6 py-12 text-center text-muted text-sm">Loading...</td></tr>}
                                {!isLoading && entries.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-muted text-sm">No wastage records.</td></tr>}
                                {entries.map((e, i) => {
                                    const item = inventory.find(inv => inv.id === e.itemId);
                                    return (
                                        <tr key={e.id || i} className="hover:bg-elevated/20 transition-all">
                                            <td className="px-6 py-4 text-xs font-black text-main">{e.itemName || item?.name || e.itemId}</td>
                                            <td className="px-4 py-4 font-mono text-xs font-black text-rose-500">{e.quantity}</td>
                                            <td className="px-4 py-4"><span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase">{e.reason}</span></td>
                                            <td className="px-4 py-4 text-[10px] text-muted truncate max-w-[150px]">{e.notes || '—'}</td>
                                            <td className="px-4 py-4 text-[10px] font-bold text-main">{e.performedBy || '—'}</td>
                                            <td className="px-4 py-4 text-right font-mono text-xs text-rose-500">{(e.costImpact || 0).toLocaleString()} {currency}</td>
                                            <td className="px-6 py-4 text-[10px] text-muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && report && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                    <div className="card-primary border border-border rounded-[2.5rem] p-6 shadow-sm">
                        <h3 className="text-lg font-black text-main uppercase tracking-tight mb-6">Wastage by Reason</h3>
                        <div className="space-y-4">
                            {REASONS.map(reason => {
                                const count = entries.filter(e => e.reason === reason).length;
                                const maxCount = Math.max(...REASONS.map(r => entries.filter(e => e.reason === r).length), 1);
                                if (count === 0) return null;
                                return (
                                    <div key={reason} className="flex items-center gap-4">
                                        <p className="text-[10px] font-black text-muted w-28 truncate">{reason}</p>
                                        <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
                                        </div>
                                        <p className="text-xs font-black text-main w-12 text-right">{count}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* RECORD MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-card border border-border rounded-[2rem] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <h3 className="text-lg font-black text-main">Record Wastage</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-muted hover:text-main"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Item</label>
                                <select value={form.itemId} onChange={e => setForm({ ...form, itemId: e.target.value })}
                                    className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-amber-500 text-main">
                                    <option value="">Select item...</option>
                                    {inventory.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Warehouse</label>
                                <select value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })}
                                    className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-amber-500 text-main">
                                    <option value="">Select warehouse...</option>
                                    {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Quantity</label>
                                    <input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                                        className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-black outline-none focus:border-amber-500 text-main" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Reason</label>
                                    <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                                        className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-amber-500 text-main">
                                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                                    className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-amber-500 text-main resize-none" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-border flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-app border border-border rounded-xl text-xs font-black text-muted uppercase tracking-widest">Cancel</button>
                            <button onClick={handleRecord} className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"><Save size={14} /> Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WastageManager;
