import React, { useEffect, useState } from 'react';
import {
    Globe, Plus, RefreshCw, CheckCircle2, X, Settings, Trash2,
    Edit, ExternalLink, DollarSign, TrendingUp, Layers
} from 'lucide-react';
import { platformsApi } from '../services/api/platforms';
import { useAuthStore } from '../stores/useAuthStore';
import ExportButton from './common/ExportButton';
import { useToast } from './common/ToastProvider';
import { useConfirm } from './common/ConfirmProvider';

type Platform = {
    id: string;
    name: string;
    type?: string;
    apiKey?: string;
    commissionRate?: number;
    isActive?: boolean;
    logoUrl?: string;
    createdAt?: string;
};

const PLATFORM_PRESETS = [
    { name: 'Talabat', type: 'DELIVERY' },
    { name: 'Elmenus', type: 'DELIVERY' },
    { name: 'Uber Eats', type: 'DELIVERY' },
    { name: 'Noon Food', type: 'DELIVERY' },
    { name: 'Careem Food', type: 'DELIVERY' },
    { name: 'Custom', type: 'OTHER' },
];

const PlatformAggregator: React.FC = () => {
    const { settings } = useAuthStore();
    const lang = settings.language || 'en';
    const { success, error: showError } = useToast();
    const { confirm } = useConfirm();

    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
    const [form, setForm] = useState({ name: '', type: 'DELIVERY', apiKey: '', commissionRate: '15' });

    const load = async () => {
        setIsLoading(true);
        try { setPlatforms(await platformsApi.getAll()); } catch { } finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSave = async () => {
        if (!form.name) return;
        try {
            const data = { name: form.name, type: form.type, apiKey: form.apiKey || undefined, commissionRate: Number(form.commissionRate) || 0 };
            if (editingPlatform) { await platformsApi.update(editingPlatform.id, data); }
            else { await platformsApi.create(data); }
            setShowModal(false); setEditingPlatform(null);
            setForm({ name: '', type: 'DELIVERY', apiKey: '', commissionRate: '15' });
            await load();
            success(editingPlatform ? 'Platform updated' : 'Platform added');
        } catch (e: any) { showError(e.message); }
    };

    const handleDelete = async (id: string) => {
        const ok = await confirm({ title: 'Delete Platform', message: 'This will permanently remove this platform connection. Continue?', confirmText: 'Delete', variant: 'danger' });
        if (!ok) return;
        try { await platformsApi.delete(id); await load(); success('Platform deleted'); } catch (e: any) { showError(e.message); }
    };

    const openEdit = (p: Platform) => {
        setEditingPlatform(p);
        setForm({ name: p.name, type: p.type || 'DELIVERY', apiKey: p.apiKey || '', commissionRate: String(p.commissionRate || 15) });
        setShowModal(true);
    };

    const avgCommission = platforms.length > 0 ? (platforms.reduce((s, p) => s + (p.commissionRate || 0), 0) / platforms.length).toFixed(1) : '0';

    return (
        <div className="p-4 md:p-8 lg:p-10 bg-app min-h-screen pb-24">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white flex items-center justify-center shadow-2xl shadow-purple-600/30">
                            <Globe size={28} />
                        </div>
                        <h2 className="text-3xl font-black text-main uppercase tracking-tighter">{lang === 'ar' ? 'المنصات' : 'Platforms'}</h2>
                    </div>
                    <p className="text-muted font-bold text-xs uppercase tracking-widest opacity-60">{lang === 'ar' ? 'ربط منصات التوصيل وتتبع العمولات' : 'Connect Delivery Platforms & Track Commissions'}</p>
                </div>
                <div className="flex gap-2">
                    <ExportButton data={platforms} columns={[
                        { key: 'name', label: 'Platform' },
                        { key: 'type', label: 'Type' },
                        { key: 'commissionRate', label: 'Commission %', format: (v: any) => `${v || 0}%` },
                        { key: 'isActive', label: 'Status', format: (v: any) => v !== false ? 'Active' : 'Inactive' },
                    ]} filename="platforms" title="Platforms Report" />
                    <button onClick={() => { setEditingPlatform(null); setForm({ name: '', type: 'DELIVERY', apiKey: '', commissionRate: '15' }); setShowModal(true); }}
                        className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-5 py-2.5 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"><Plus size={14} /> Add Platform</button>
                    <button onClick={load} className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"><RefreshCw size={14} /></button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Connected Platforms', value: platforms.length, icon: Globe, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Avg Commission', value: `${avgCommission}%`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Types', value: new Set(platforms.map(p => p.type)).size, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                ].map((s, i) => (
                    <div key={i} className="card-primary border border-border p-5 rounded-[2rem] shadow-sm">
                        <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}><s.icon size={16} /></div>
                        <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">{s.label}</p>
                        <h4 className="text-xl font-black text-main">{s.value}</h4>
                    </div>
                ))}
            </div>

            {/* Platform Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading && <p className="text-muted col-span-full text-center py-12">Loading...</p>}
                {!isLoading && platforms.length === 0 && <p className="text-muted col-span-full text-center py-12">No platforms connected. Click "Add Platform" to get started.</p>}
                {platforms.map(p => (
                    <div key={p.id} className="card-primary border border-border rounded-[2rem] p-6 shadow-sm hover:border-purple-500/40 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-main">{p.name}</h4>
                                    <p className="text-[9px] font-bold text-muted uppercase">{p.type}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${p.isActive !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                {p.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-app rounded-xl border border-border">
                                <p className="text-[8px] font-black text-muted uppercase tracking-widest">Commission</p>
                                <p className="text-lg font-black text-main">{p.commissionRate || 0}%</p>
                            </div>
                            <div className="p-3 bg-app rounded-xl border border-border">
                                <p className="text-[8px] font-black text-muted uppercase tracking-widest">API Key</p>
                                <p className="text-xs font-bold text-muted truncate">{p.apiKey ? '••••' + p.apiKey.slice(-4) : 'Not set'}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => openEdit(p)} className="flex-1 py-2.5 bg-app border border-border rounded-xl text-[10px] font-black text-muted uppercase tracking-widest hover:text-main hover:border-purple-500/40 transition-colors flex items-center justify-center gap-1"><Edit size={12} /> Edit</button>
                            <button onClick={() => handleDelete(p.id)} className="px-4 py-2.5 bg-app border border-border rounded-xl text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-card border border-border rounded-[2rem] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <h3 className="text-lg font-black text-main">{editingPlatform ? 'Edit Platform' : 'Add Platform'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-muted hover:text-main"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {!editingPlatform && (
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-2 block">Quick Select</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PLATFORM_PRESETS.map(p => (
                                            <button key={p.name} onClick={() => setForm({ ...form, name: p.name, type: p.type })}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${form.name === p.name ? 'bg-purple-500/10 border-purple-500/30 text-purple-500' : 'border-border text-muted hover:text-main'}`}>{p.name}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Platform Name</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-purple-500 text-main" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Type</label>
                                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-purple-500 text-main">
                                        <option value="DELIVERY">Delivery</option>
                                        <option value="AGGREGATOR">Aggregator</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Commission %</label>
                                    <input type="number" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: e.target.value })}
                                        className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-purple-500 text-main" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">API Key (optional)</label>
                                <input type="password" value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} placeholder="Enter API key..."
                                    className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-purple-500 text-main" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-border flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-app border border-border rounded-xl text-xs font-black text-muted uppercase tracking-widest">Cancel</button>
                            <button onClick={handleSave} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">{editingPlatform ? 'Update' : 'Add'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlatformAggregator;
