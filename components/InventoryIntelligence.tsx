import React, { useEffect, useMemo, useState } from 'react';
import {
    Brain, AlertTriangle, ShoppingCart, RefreshCw, Package, Search,
    CheckCircle2, ArrowRight, Calculator, Layers, ClipboardCheck,
    X, Save, Play, Eye, Clock, Scale
} from 'lucide-react';
import { inventoryIntelligenceApi } from '../services/api/inventoryIntelligence';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useAuthStore } from '../stores/useAuthStore';
import ExportButton from './common/ExportButton';
import { useToast } from './common/ToastProvider';

type IntelTab = 'alerts' | 'suggestions' | 'stockcount' | 'converter';

const TABS: { id: IntelTab; label: string; icon: any }[] = [
    { id: 'alerts', label: 'Reorder Alerts', icon: AlertTriangle },
    { id: 'suggestions', label: 'Purchase AI', icon: ShoppingCart },
    { id: 'stockcount', label: 'Stock Count', icon: ClipboardCheck },
    { id: 'converter', label: 'Unit Converter', icon: Scale },
];

const InventoryIntelligence: React.FC = () => {
    const { settings } = useAuthStore();
    const { warehouses } = useInventoryStore();
    const currency = settings.currencySymbol || 'LE';
    const { success, error: showError, warning } = useToast();

    const [activeTab, setActiveTab] = useState<IntelTab>('alerts');
    const [alerts, setAlerts] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [warehouseId, setWarehouseId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Stock count
    const [countSession, setCountSession] = useState<any>(null);
    const [counts, setCounts] = useState<{ itemId: string; countedQty: number; notes: string }[]>([]);

    // Unit converter
    const [convertFrom, setConvertFrom] = useState('kg');
    const [convertTo, setConvertTo] = useState('g');
    const [convertValue, setConvertValue] = useState('1');
    const [convertResult, setConvertResult] = useState<any>(null);
    const [supportedUnits, setSupportedUnits] = useState<string[]>([]);

    const loadAlerts = async () => {
        setIsLoading(true);
        try { setAlerts(await inventoryIntelligenceApi.getReorderAlerts(warehouseId || undefined)); }
        catch { } finally { setIsLoading(false); }
    };

    const loadSuggestions = async () => {
        setIsLoading(true);
        try { setSuggestions(await inventoryIntelligenceApi.getPurchaseSuggestions(warehouseId || undefined)); }
        catch { } finally { setIsLoading(false); }
    };

    const loadUnits = async () => {
        try { setSupportedUnits(await inventoryIntelligenceApi.getSupportedUnits()); } catch { }
    };

    useEffect(() => { loadAlerts(); loadSuggestions(); loadUnits(); }, []);

    const handleConvert = async () => {
        try {
            const result = await inventoryIntelligenceApi.convertUnit(Number(convertValue), convertFrom, convertTo);
            setConvertResult(result);
        } catch (e: any) { showError(e.message); }
    };

    const handleStartCount = async () => {
        if (!warehouseId) { warning('Select a warehouse first'); return; }
        try {
            const session = await inventoryIntelligenceApi.createStockCount(warehouseId);
            setCountSession(session);
            setCounts((session.items || []).map((it: any) => ({ itemId: it.itemId, countedQty: it.systemQty || 0, notes: '' })));
        } catch (e: any) { showError(e.message); }
    };

    const handleUpdateCount = (itemId: string, field: string, value: any) => {
        setCounts(prev => prev.map(c => c.itemId === itemId ? { ...c, [field]: value } : c));
    };

    const handleCompleteCount = async (apply: boolean) => {
        if (!countSession) return;
        try {
            await inventoryIntelligenceApi.updateStockCount(countSession.id, counts);
            await inventoryIntelligenceApi.completeStockCount(countSession.id, apply);
            setCountSession(null);
            setCounts([]);
            success(apply ? 'Stock count applied!' : 'Stock count saved (draft)');
        } catch (e: any) { showError(e.message); }
    };

    return (
        <div className="p-4 md:p-8 lg:p-10 bg-app min-h-screen pb-24">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-2xl shadow-cyan-600/30">
                            <Brain size={28} />
                        </div>
                        <h2 className="text-3xl font-black text-main uppercase tracking-tighter">Inventory Intelligence</h2>
                    </div>
                    <p className="text-muted font-bold text-xs uppercase tracking-widest opacity-60">Reorder · Smart Purchase · Physical Count · Conversion</p>
                </div>
                <div className="flex gap-2 items-center">
                    <ExportButton data={activeTab === 'alerts' ? alerts : suggestions} columns={
                        activeTab === 'alerts' ? [
                            { key: 'itemName', label: 'Item' },
                            { key: 'currentStock', label: 'Current' },
                            { key: 'reorderPoint', label: 'Reorder Point' },
                            { key: 'shortage', label: 'Shortage' },
                            { key: 'urgency', label: 'Urgency' },
                        ] : [
                            { key: 'itemName', label: 'Item' },
                            { key: 'suggestedQty', label: 'Suggested Qty' },
                            { key: 'estimatedCost', label: 'Est. Cost', format: (v: any) => `${(v || 0).toLocaleString()} ${currency}` },
                            { key: 'supplierName', label: 'Supplier' },
                            { key: 'priority', label: 'Priority' },
                        ]
                    } filename={`inventory_${activeTab}`} title={activeTab === 'alerts' ? 'Reorder Alerts' : 'Purchase Suggestions'} />
                    <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
                        className="px-4 py-2.5 bg-card border border-border rounded-xl text-xs font-bold outline-none text-main">
                        <option value="">All Warehouses</option>
                        {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                    </select>
                    <button onClick={() => { loadAlerts(); loadSuggestions(); }} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-5 py-2.5 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-elevated/40 p-1.5 rounded-2xl border border-border w-fit flex-wrap">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' : 'text-muted hover:text-main hover:bg-elevated/60'}`}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════════ REORDER ALERTS ═══════════ */}
            {activeTab === 'alerts' && (
                <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
                    <div className="p-6 border-b border-border bg-elevated/30 flex items-center justify-between">
                        <h3 className="text-lg font-black text-main uppercase tracking-tight flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> Items Below Reorder Point ({alerts.length})</h3>
                    </div>
                    <div className="responsive-table">
                        <table className="w-full text-left">
                            <thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-[0.2em]">
                                <tr>
                                    <th className="px-6 py-4">Item</th>
                                    <th className="px-4 py-4">Current Stock</th>
                                    <th className="px-4 py-4">Reorder Point</th>
                                    <th className="px-4 py-4">Shortage</th>
                                    <th className="px-6 py-4">Urgency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {isLoading && <tr><td colSpan={5} className="px-6 py-12 text-center text-muted text-sm">Loading...</td></tr>}
                                {!isLoading && alerts.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-emerald-500 text-sm font-bold">✓ All stock levels are above reorder points</td></tr>}
                                {alerts.map((a, i) => (
                                    <tr key={i} className="hover:bg-elevated/20 transition-all">
                                        <td className="px-6 py-4 text-xs font-black text-main">{a.itemName || a.itemId}</td>
                                        <td className="px-4 py-4 font-mono text-xs font-black text-rose-500">{a.currentStock} {a.unit}</td>
                                        <td className="px-4 py-4 font-mono text-xs text-muted">{a.reorderPoint} {a.unit}</td>
                                        <td className="px-4 py-4 font-mono text-xs font-black text-amber-500">{a.shortage}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${a.urgency === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500' : a.urgency === 'HIGH' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {a.urgency || 'MEDIUM'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══════════ PURCHASE SUGGESTIONS ═══════════ */}
            {activeTab === 'suggestions' && (
                <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
                    <div className="p-6 border-b border-border bg-elevated/30 flex items-center justify-between">
                        <h3 className="text-lg font-black text-main uppercase tracking-tight flex items-center gap-2"><ShoppingCart size={18} className="text-emerald-500" /> AI Purchase Suggestions</h3>
                    </div>
                    <div className="responsive-table">
                        <table className="w-full text-left">
                            <thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-[0.2em]">
                                <tr>
                                    <th className="px-6 py-4">Item</th>
                                    <th className="px-4 py-4">Suggested Qty</th>
                                    <th className="px-4 py-4">Est. Cost</th>
                                    <th className="px-4 py-4">Supplier</th>
                                    <th className="px-6 py-4">Priority</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {isLoading && <tr><td colSpan={5} className="px-6 py-12 text-center text-muted text-sm">Loading...</td></tr>}
                                {!isLoading && suggestions.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-emerald-500 text-sm font-bold">✓ No purchase suggestions at this time</td></tr>}
                                {suggestions.map((s, i) => (
                                    <tr key={i} className="hover:bg-elevated/20 transition-all">
                                        <td className="px-6 py-4 text-xs font-black text-main">{s.itemName || s.itemId}</td>
                                        <td className="px-4 py-4 font-mono text-xs font-black text-blue-500">{s.suggestedQty} {s.unit}</td>
                                        <td className="px-4 py-4 font-mono text-xs text-main">{(s.estimatedCost || 0).toLocaleString()} {currency}</td>
                                        <td className="px-4 py-4 text-[10px] font-bold text-muted">{s.supplierName || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${s.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {s.priority || 'MEDIUM'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══════════ STOCK COUNT ═══════════ */}
            {activeTab === 'stockcount' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                    {!countSession ? (
                        <div className="card-primary border border-border rounded-[2.5rem] p-12 shadow-sm text-center">
                            <ClipboardCheck size={48} className="text-muted mx-auto mb-4" />
                            <h3 className="text-xl font-black text-main mb-2">Physical Stock Count</h3>
                            <p className="text-sm text-muted mb-6 max-w-md mx-auto">Select a warehouse and start a new stock count session. Count each item physically and record discrepancies.</p>
                            <button onClick={handleStartCount}
                                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest inline-flex items-center gap-2 hover:scale-105 transition-transform">
                                <Play size={14} /> Start Count Session
                            </button>
                        </div>
                    ) : (
                        <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-border bg-elevated/30 flex items-center justify-between">
                                <h3 className="text-lg font-black text-main">Active Count Session</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => handleCompleteCount(false)} className="px-4 py-2 bg-slate-500/10 text-slate-500 rounded-xl text-[10px] font-black uppercase">Save Draft</button>
                                    <button onClick={() => handleCompleteCount(true)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><CheckCircle2 size={12} /> Apply Adjustments</button>
                                </div>
                            </div>
                            <div className="responsive-table">
                                <table className="w-full text-left">
                                    <thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-[0.2em]">
                                        <tr>
                                            <th className="px-6 py-4">Item</th>
                                            <th className="px-4 py-4">System Qty</th>
                                            <th className="px-4 py-4">Counted Qty</th>
                                            <th className="px-4 py-4">Variance</th>
                                            <th className="px-6 py-4">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {counts.map((c, i) => {
                                            const sysItem = (countSession.items || []).find((it: any) => it.itemId === c.itemId);
                                            const variance = c.countedQty - (sysItem?.systemQty || 0);
                                            return (
                                                <tr key={c.itemId} className="hover:bg-elevated/20">
                                                    <td className="px-6 py-4 text-xs font-black text-main">{sysItem?.itemName || c.itemId}</td>
                                                    <td className="px-4 py-4 font-mono text-xs text-muted">{sysItem?.systemQty || 0}</td>
                                                    <td className="px-4 py-4">
                                                        <input type="number" value={c.countedQty} onChange={e => handleUpdateCount(c.itemId, 'countedQty', Number(e.target.value))}
                                                            className="w-24 px-3 py-2 bg-app border border-border rounded-lg text-xs font-black text-main text-center outline-none focus:border-cyan-500" />
                                                    </td>
                                                    <td className="px-4 py-4"><span className={`font-mono text-xs font-black ${variance === 0 ? 'text-emerald-500' : variance > 0 ? 'text-blue-500' : 'text-rose-500'}`}>{variance > 0 ? '+' : ''}{variance}</span></td>
                                                    <td className="px-6 py-4">
                                                        <input type="text" value={c.notes} onChange={e => handleUpdateCount(c.itemId, 'notes', e.target.value)} placeholder="Notes..."
                                                            className="w-full px-3 py-2 bg-app border border-border rounded-lg text-[10px] text-main outline-none focus:border-cyan-500" />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ UNIT CONVERTER ═══════════ */}
            {activeTab === 'converter' && (
                <div className="card-primary border border-border rounded-[2.5rem] p-8 shadow-sm max-w-lg animate-in slide-in-from-bottom-5 duration-500">
                    <h3 className="text-lg font-black text-main uppercase tracking-tight mb-6 flex items-center gap-2"><Scale size={18} className="text-cyan-500" /> Unit Converter</h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Value</label>
                            <input type="number" value={convertValue} onChange={e => setConvertValue(e.target.value)}
                                className="w-full px-4 py-3 bg-app border border-border rounded-xl text-sm font-black text-main text-center outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">From</label>
                            <select value={convertFrom} onChange={e => setConvertFrom(e.target.value)}
                                className="w-full px-3 py-3 bg-app border border-border rounded-xl text-xs font-bold text-main outline-none focus:border-cyan-500">
                                {supportedUnits.length > 0 ? supportedUnits.map(u => <option key={u} value={u}>{u}</option>) : ['kg', 'g', 'lb', 'oz', 'L', 'ml', 'gal', 'pcs'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">To</label>
                            <select value={convertTo} onChange={e => setConvertTo(e.target.value)}
                                className="w-full px-3 py-3 bg-app border border-border rounded-xl text-xs font-bold text-main outline-none focus:border-cyan-500">
                                {supportedUnits.length > 0 ? supportedUnits.map(u => <option key={u} value={u}>{u}</option>) : ['kg', 'g', 'lb', 'oz', 'L', 'ml', 'gal', 'pcs'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleConvert} className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:shadow-lg transition-shadow">
                        <Calculator size={14} /> Convert
                    </button>
                    {convertResult && (
                        <div className="mt-6 p-5 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-500/5 dark:to-blue-500/5 rounded-2xl border border-cyan-100 dark:border-cyan-500/10 text-center">
                            <p className="text-3xl font-black text-main">{convertResult.result || convertResult.value}</p>
                            <p className="text-xs text-muted mt-1">{convertValue} {convertFrom} = {convertResult.result || convertResult.value} {convertTo}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InventoryIntelligence;
