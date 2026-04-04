import React, { useEffect, useState } from 'react';
import {
    CheckCircle2, XCircle, Clock, Shield, RefreshCw, Key,
    RotateCcw, ShoppingCart, Calendar, AlertTriangle, Eye, X
} from 'lucide-react';
import { approvalApi } from '../services/api/approval';
import { useAuthStore } from '../stores/useAuthStore';
import ExportButton from './common/ExportButton';
import { useToast } from './common/ToastProvider';

type Approval = {
    id: string;
    type: string;
    referenceId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    details?: any;
    createdAt: string;
    resolvedAt?: string;
    resolvedBy?: string;
};

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
    REFUND: { label: 'Refund', icon: RotateCcw, color: 'text-rose-500' },
    PURCHASE_ORDER: { label: 'Purchase Order', icon: ShoppingCart, color: 'text-blue-500' },
    LEAVE: { label: 'Leave Request', icon: Calendar, color: 'text-emerald-500' },
    OVERTIME: { label: 'Overtime', icon: Clock, color: 'text-amber-500' },
    VOID: { label: 'Void Order', icon: XCircle, color: 'text-red-500' },
    DISCOUNT: { label: 'Discount Override', icon: AlertTriangle, color: 'text-violet-500' },
};

const ApprovalCenter: React.FC = () => {
    const { settings } = useAuthStore();
    const lang = settings.language || 'en';
    const { success, error: showError } = useToast();

    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
    const [pinModal, setPinModal] = useState<{ approvalId: string } | null>(null);
    const [pin, setPin] = useState('');

    const load = async () => {
        setIsLoading(true);
        try { setApprovals(await approvalApi.getAll()); } catch { } finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = statusFilter === 'ALL' ? approvals : approvals.filter(a => a.status === statusFilter);
    const pending = approvals.filter(a => a.status === 'PENDING').length;

    const handleVerifyPin = async () => {
        if (!pinModal || !pin) return;
        try {
            await approvalApi.verifyPin({ pin, approvalId: pinModal.approvalId });
            setPinModal(null); setPin('');
            await load();
        } catch (e: any) { showError(e.message || 'Invalid PIN'); }
    };

    return (
        <div className="p-4 md:p-8 lg:p-10 bg-app min-h-screen pb-24">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/30">
                            <Shield size={28} />
                        </div>
                        <h2 className="text-3xl font-black text-main uppercase tracking-tighter">{lang === 'ar' ? 'مركز الموافقات' : 'Approval Center'}</h2>
                        {pending > 0 && <span className="px-3 py-1 bg-rose-500 text-white rounded-full text-xs font-black">{pending}</span>}
                    </div>
                    <p className="text-muted font-bold text-xs uppercase tracking-widest opacity-60">{lang === 'ar' ? 'موافقات مركزية لجميع العمليات' : 'Centralized Approval Workflow'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButton data={filtered.map(a => ({ ...a, typeLabel: TYPE_META[a.type]?.label || a.type }))} columns={[
                        { key: 'typeLabel', label: 'Type' },
                        { key: 'referenceId', label: 'Reference' },
                        { key: 'status', label: 'Status' },
                        { key: 'createdAt', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleDateString() : '' },
                        { key: 'resolvedBy', label: 'Resolved By' },
                    ]} filename="approvals" title="Approval Report" />
                    <button onClick={load} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"><RefreshCw size={14} /> Refresh</button>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Approved', value: approvals.filter(a => a.status === 'APPROVED').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Rejected', value: approvals.filter(a => a.status === 'REJECTED').length, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'Total', value: approvals.length, icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                ].map((s, i) => (
                    <div key={i} className="card-primary border border-border p-5 rounded-[2rem] shadow-sm">
                        <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}><s.icon size={16} /></div>
                        <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">{s.label}</p>
                        <h4 className="text-xl font-black text-main">{s.value}</h4>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-1 mb-6 bg-elevated/40 p-1 rounded-xl border border-border w-fit">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-card text-main shadow-sm' : 'text-muted hover:text-main'}`}>{s}</button>
                ))}
            </div>

            {/* Table */}
            <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="responsive-table">
                    <table className="w-full text-left">
                        <thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-[0.2em]">
                            <tr>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-4 py-4">Reference</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Date</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading && <tr><td colSpan={5} className="px-6 py-12 text-center text-muted text-sm">Loading...</td></tr>}
                            {!isLoading && filtered.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-muted text-sm">No approval requests.</td></tr>}
                            {filtered.map(a => {
                                const meta = TYPE_META[a.type] || { label: a.type, icon: Shield, color: 'text-slate-500' };
                                return (
                                    <tr key={a.id} className="hover:bg-elevated/20 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <meta.icon size={14} className={meta.color} />
                                                <span className="text-xs font-black text-main">{meta.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-[10px] font-mono font-bold text-muted">{a.referenceId?.slice(-10) || '—'}</td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${a.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : a.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{a.status}</span>
                                        </td>
                                        <td className="px-4 py-4 text-[10px] text-muted">{new Date(a.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {a.status === 'PENDING' && (
                                                    <button onClick={() => { setPinModal({ approvalId: a.id }); }} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors" title="Approve with PIN"><Key size={14} /></button>
                                                )}
                                                <button onClick={() => setSelectedApproval(a)} className="p-1.5 rounded-lg bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 transition-colors" title="Details"><Eye size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PIN Modal */}
            {pinModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPinModal(null)}>
                    <div className="bg-card border border-border rounded-[2rem] w-full max-w-sm shadow-2xl text-center p-8" onClick={e => e.stopPropagation()}>
                        <Key size={40} className="text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-main mb-2">Manager PIN Required</h3>
                        <p className="text-xs text-muted mb-6">Enter your PIN to approve this request.</p>
                        <input type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value)} autoFocus
                            className="w-full px-6 py-4 bg-app border border-border rounded-xl text-2xl font-black text-main text-center tracking-[0.5em] outline-none focus:border-emerald-500 mb-4" placeholder="••••" />
                        <div className="flex gap-3">
                            <button onClick={() => setPinModal(null)} className="flex-1 py-3 bg-app border border-border rounded-xl text-xs font-black text-muted uppercase">Cancel</button>
                            <button onClick={handleVerifyPin} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase">Verify</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Drawer */}
            {selectedApproval && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelectedApproval(null)}>
                    <div className="w-full max-w-md bg-card h-full shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                            <h3 className="text-lg font-black text-main">Approval Details</h3>
                            <button onClick={() => setSelectedApproval(null)} className="p-2 text-muted hover:text-main"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Type', value: TYPE_META[selectedApproval.type]?.label || selectedApproval.type },
                                { label: 'Reference', value: selectedApproval.referenceId },
                                { label: 'Status', value: selectedApproval.status },
                                { label: 'Created', value: new Date(selectedApproval.createdAt).toLocaleString() },
                                ...(selectedApproval.resolvedAt ? [{ label: 'Resolved', value: new Date(selectedApproval.resolvedAt).toLocaleString() }] : []),
                                ...(selectedApproval.resolvedBy ? [{ label: 'Resolved By', value: selectedApproval.resolvedBy }] : []),
                            ].map((f, i) => (
                                <div key={i} className="p-3 bg-app rounded-xl border border-border">
                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">{f.label}</p>
                                    <p className="text-xs font-bold text-main">{f.value}</p>
                                </div>
                            ))}
                            {selectedApproval.details && (
                                <div className="p-3 bg-app rounded-xl border border-border">
                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">Details</p>
                                    <pre className="text-[10px] text-main whitespace-pre-wrap">{JSON.stringify(selectedApproval.details, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalCenter;
