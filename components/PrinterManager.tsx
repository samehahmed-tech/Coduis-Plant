
import React, { useEffect, useRef, useState } from 'react';
import {
    Printer as PrinterIcon, Plus, Search, Edit3, Trash2,
    X, Network, Monitor, Building2,
    AlertCircle, RefreshCcw
} from 'lucide-react';
import { Printer, OrderType, PrinterRole } from '../types';
import { printGatewayApi } from '../services/api';

// Stores
import { useAuthStore } from '../stores/useAuthStore';

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds between heartbeat cycles

const PrinterManager: React.FC = () => {
    const { printers, branches, settings, updateSettings, fetchPrinters, createPrinterInDB, updatePrinterInDB, deletePrinterFromDB, heartbeatPrinterInDB } = useAuthStore();
    const lang = (settings.language || 'en') as 'en' | 'ar';

    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState<string | null>(null);
    const [queueStats, setQueueStats] = useState<{ queued: number; processing: number; completed: number; failed: number; total: number }>({
        queued: 0, processing: 0, completed: 0, failed: 0, total: 0,
    });
    const [queueJobs, setQueueJobs] = useState<any[]>([]);
    const [printerModal, setPrinterModal] = useState<{
        isOpen: boolean;
        mode: 'ADD' | 'EDIT';
        printer: Printer;
    } | null>(null);

    // Keep a ref to the current printers list so the heartbeat interval
    // always reads fresh data without re-triggering the useEffect.
    const printersRef = useRef(printers);
    printersRef.current = printers;

    const filteredPrinters = (printers || []).filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const primaryCashierPrinterId = settings.primaryCashierPrinterId || '';
    const brandingByType = settings.receiptBrandingByOrderType || {};
    const printerRoles: Array<{ value: PrinterRole; label: string }> = [
        { value: 'CASHIER', label: 'Cashier' },
        { value: 'KITCHEN', label: 'Kitchen' },
        { value: 'SHAWARMA', label: 'Shawarma' },
        { value: 'GRILL', label: 'Grill' },
        { value: 'BAR', label: 'Bar' },
        { value: 'DESSERT', label: 'Dessert' },
        { value: 'OTHER', label: 'Other' },
    ];

    const handlePrimaryCashierChange = (printerId: string) => {
        updateSettings({ primaryCashierPrinterId: printerId });
    };

    const updateBranding = (type: OrderType, field: 'logoUrl' | 'qrUrl', value: string) => {
        const current = settings.receiptBrandingByOrderType || {};
        updateSettings({
            receiptBrandingByOrderType: {
                ...current,
                [type]: {
                    ...current[type],
                    [field]: value,
                },
            },
        });
    };

    useEffect(() => {
        fetchPrinters();
    }, [fetchPrinters]);

    // Heartbeat: fire once after mount, then every HEARTBEAT_INTERVAL_MS.
    // Uses a ref so the interval callback always sees the latest printers
    // WITHOUT re-running the effect (which was causing the infinite 429 cascade).
    useEffect(() => {
        let cancelled = false;

        const runHeartbeats = async () => {
            const currentPrinters = printersRef.current || [];
            const targets = currentPrinters.filter((p) => p.type === 'NETWORK');
            if (targets.length === 0) return;
            // Heartbeat each printer sequentially to avoid burst requests
            for (const p of targets) {
                if (cancelled) break;
                await heartbeatPrinterInDB(p.id).catch(() => undefined);
            }
        };

        // Initial heartbeat with a small delay to let the component settle
        const initialTimeout = window.setTimeout(runHeartbeats, 2000);
        const timer = window.setInterval(runHeartbeats, HEARTBEAT_INTERVAL_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(initialTimeout);
            window.clearInterval(timer);
        };
    }, [heartbeatPrinterInDB]);

    const loadQueue = async () => {
        setQueueLoading(true);
        setQueueError(null);
        try {
            const branchId = settings.activeBranchId;
            const data = await printGatewayApi.getJobs({ branchId, limit: 20 });
            setQueueStats(data.stats || { queued: 0, processing: 0, completed: 0, failed: 0, total: 0 });
            setQueueJobs(Array.isArray(data.jobs) ? data.jobs : []);
        } catch (error: any) {
            setQueueError(error?.message || 'Failed to load print queue');
        } finally {
            setQueueLoading(false);
        }
    };

    useEffect(() => {
        loadQueue();
        const timer = window.setInterval(loadQueue, 5000);
        return () => window.clearInterval(timer);
    }, [settings.activeBranchId]);

    const handleSave = async () => {
        if (!printerModal) return;
        setIsSaving(true);
        try {
            if (printerModal.mode === 'ADD') {
                await createPrinterInDB({ ...printerModal.printer, id: `prn-${Date.now()}` });
            } else {
                await updatePrinterInDB(printerModal.printer);
            }
            setPrinterModal(null);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        await deletePrinterFromDB(id);
    };

    const handlePacketTest = async (id: string) => {
        setTestingId(id);
        await heartbeatPrinterInDB(id);
        setTestingId(null);
    };

    const handleRetryJob = async (jobId: string) => {
        await printGatewayApi.retryJob(jobId);
        await loadQueue();
    };

    return (
        <div className="p-8 space-y-10 animate-fade-in transition-all pb-24 min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <PrinterIcon className="text-indigo-600" size={36} />
                        Printer Management
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                        Configure printers and print stations.
                    </p>
                </div>
                <button
                    onClick={() => setPrinterModal({
                        isOpen: true,
                        mode: 'ADD',
                        printer: {
                            id: '',
                            code: '',
                            name: '',
                            type: 'LOCAL',
                            address: '',
                            isActive: true,
                            isPrimaryCashier: false,
                            role: 'OTHER',
                            branchId: branches[0]?.id || '',
                        }
                    })}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Add Printer
                </button>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-3 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 rounded-[2.5rem] outline-none shadow-sm font-bold text-sm"
                    />
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-[2.5rem] flex flex-col items-center justify-center shadow-sm">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">ACTIVE PRINTERS</p>
                    <p className="text-3xl font-black text-emerald-600">{printers.filter(p => p.isActive).length} <span className="text-xs opacity-40">/ {printers.length}</span></p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="mb-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Primary Cashier Printer</p>
                        <select
                            value={primaryCashierPrinterId}
                            onChange={(e) => handlePrimaryCashierChange(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                        >
                            <option value="">Auto (no forced printer)</option>
                            {printers.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Global Receipt Branding (fallback)</p>
                        <div className="grid grid-cols-1 gap-2">
                            <input
                                type="text"
                                placeholder="Logo URL"
                                value={settings.receiptLogoUrl || ''}
                                onChange={(e) => updateSettings({ receiptLogoUrl: e.target.value })}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                            />
                            <input
                                type="text"
                                placeholder="QR URL"
                                value={settings.receiptQrUrl || ''}
                                onChange={(e) => updateSettings({ receiptQrUrl: e.target.value })}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                            />
                        </div>
                    </div>
                </div>
                <div className="mb-5 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Receipt Branding by Order Type</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[OrderType.DINE_IN, OrderType.TAKEAWAY, OrderType.DELIVERY, OrderType.PICKUP].map((type) => (
                            <div key={type} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{type}</p>
                                <input
                                    type="text"
                                    placeholder="Logo URL"
                                    value={brandingByType[type]?.logoUrl || ''}
                                    onChange={(e) => updateBranding(type, 'logoUrl', e.target.value)}
                                    className="w-full mb-2 p-2 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-bold outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="QR URL"
                                    value={brandingByType[type]?.qrUrl || ''}
                                    onChange={(e) => updateBranding(type, 'qrUrl', e.target.value)}
                                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-bold outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">Print Queue Monitor</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Live branch queue and failures</p>
                    </div>
                    <button
                        onClick={loadQueue}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest"
                    >
                        <RefreshCcw size={12} className={queueLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                    <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-3"><p className="text-[10px] font-black text-amber-600">Queued</p><p className="text-xl font-black text-amber-600">{queueStats.queued}</p></div>
                    <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 p-3"><p className="text-[10px] font-black text-indigo-600">Processing</p><p className="text-xl font-black text-indigo-600">{queueStats.processing}</p></div>
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-3"><p className="text-[10px] font-black text-emerald-600">Completed</p><p className="text-xl font-black text-emerald-600">{queueStats.completed}</p></div>
                    <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 p-3"><p className="text-[10px] font-black text-rose-600">Failed</p><p className="text-xl font-black text-rose-600">{queueStats.failed}</p></div>
                    <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-3"><p className="text-[10px] font-black text-slate-500">Total</p><p className="text-xl font-black text-slate-700 dark:text-slate-200">{queueStats.total}</p></div>
                </div>

                {queueError && <p className="text-xs font-black text-rose-500 mb-4">{queueError}</p>}

                <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                    {queueJobs.length === 0 && !queueLoading && (
                        <div className="text-[11px] font-bold text-slate-500">No recent print jobs.</div>
                    )}
                    {queueJobs.map((job) => (
                        <div key={job.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[11px] font-black text-slate-800 dark:text-white truncate">{job.id}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{job.type} | {job.status} | attempts {job.attempts}/{job.max_attempts}</p>
                                {job.last_error && <p className="text-[10px] font-bold text-rose-500 truncate">{job.last_error}</p>}
                            </div>
                            {String(job.status || '').toUpperCase() === 'FAILED' && (
                                <button
                                    onClick={() => handleRetryJob(job.id)}
                                    className="px-3 py-2 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Printer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {filteredPrinters.map(printer => {
                    const branch = branches.find(b => b.id === printer.branchId);
                    return (
                        <div key={printer.id} className="group bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden flex flex-col border-b-[8px] border-b-indigo-600/5 hover:border-b-indigo-600 duration-500">
                            <div className="flex justify-between items-start mb-8">
                                <div className={`p-5 rounded-3xl shadow-lg transition-all ${printer.isActive ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    {printer.type === 'NETWORK' ? <Network size={28} /> : <Monitor size={28} />}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setPrinterModal({ isOpen: true, mode: 'EDIT', printer })} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"><Edit3 size={18} /></button>
                                    <button onClick={() => handleDelete(printer.id)} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm"><Trash2 size={18} /></button>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{printer.name}</h3>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1">
                                        {printer.code || 'NO-CODE'} | {printer.role || 'OTHER'}
                                    </p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                        <Building2 size={14} className="text-indigo-500" /> {branch?.name || 'No Branch'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner">
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{printer.type === 'NETWORK' ? 'IP ADDRESS' : 'PRINTER ID'}</p>
                                        <p className="text-xs font-black text-slate-800 dark:text-white truncate font-mono tracking-tighter">{printer.address}</p>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full shadow-[0_0_12px] ${printer.isActive ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' : 'bg-slate-300 shadow-transparent'}`} />
                                </div>
                            </div>

                            <div className="mt-10 flex gap-4">
                                <button
                                    onClick={() => handlePacketTest(printer.id)}
                                    disabled={testingId === printer.id}
                                    className="flex-[2] py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {testingId === printer.id ? 'Testing...' : 'Test Connection'}
                                </button>
                                <div className={`flex-1 py-4 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest border ${printer.isActive ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border-emerald-100' : 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 border-rose-100'}`}>
                                    {(printer.isOnline ?? printer.isActive) ? 'Online' : 'Offline'}
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
                                <span className={`${printer.isPrimaryCashier ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {printer.isPrimaryCashier ? 'Primary Cashier Printer' : 'Secondary Printer'}
                                </span>
                                <span className="text-slate-400">
                                    {printer.lastHeartbeatAt ? `Last ping: ${new Date(printer.lastHeartbeatAt).toLocaleString()}` : 'No heartbeat yet'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Printer Modal */}
            {printerModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl flex items-end sm:items-center justify-center z-[110] p-2 sm:p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] sm:rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col transform animate-in zoom-in-95 duration-400 max-h-[92vh]">
                        <div className="p-4 sm:p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start sm:items-center gap-3 sm:gap-4 bg-slate-50/50 dark:bg-slate-950/20">
                            <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                                <div className="p-3 sm:p-5 bg-indigo-600 text-white rounded-2xl sm:rounded-[2rem] shadow-2xl shadow-indigo-600/30 shrink-0">
                                    <PrinterIcon size={22} className="sm:hidden" />
                                    <PrinterIcon size={32} className="hidden sm:block" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{printerModal.mode === 'ADD' ? 'Add Printer' : 'Edit Printer'}</h3>
                                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 tracking-[0.2em] sm:tracking-[0.3em] uppercase mt-1 truncate">Printer settings and connection details</p>
                                </div>
                            </div>
                            <button onClick={() => setPrinterModal(null)} className="p-2 sm:p-4 bg-white dark:bg-slate-800 text-slate-400 rounded-xl sm:rounded-2xl shadow-sm hover:rotate-90 hover:text-rose-500 transition-all shrink-0"><X size={20} className="sm:hidden" /><X size={24} className="hidden sm:block" /></button>
                        </div>

                        <div className="p-4 sm:p-10 space-y-6 sm:space-y-10 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Printer Number / Code</label>
                                    <input
                                        type="text"
                                        value={printerModal.printer.code || ''}
                                        onChange={(e) => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, code: e.target.value } })}
                                        className="w-full p-4 sm:p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl sm:rounded-3xl font-black text-xs uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 border-2 border-transparent focus:border-indigo-600 transition-all shadow-inner"
                                        placeholder="e.g. PRN-01"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Printer Name</label>
                                    <input
                                        type="text"
                                        value={printerModal.printer.name}
                                        onChange={(e) => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, name: e.target.value } })}
                                        className="w-full p-4 sm:p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl sm:rounded-3xl font-black text-xs uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 border-2 border-transparent focus:border-indigo-600 transition-all shadow-inner"
                                        placeholder="e.g. KITCHEN_B1"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Branch</label>
                                    <select
                                        value={printerModal.printer.branchId}
                                        onChange={(e) => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, branchId: e.target.value } })}
                                        className="w-full p-4 sm:p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl sm:rounded-3xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 border-2 border-transparent focus:border-indigo-600 transition-all shadow-inner appearance-none"
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Role</label>
                                    <select
                                        value={printerModal.printer.role || 'OTHER'}
                                        onChange={(e) => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, role: e.target.value as PrinterRole } })}
                                        className="w-full p-4 sm:p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl sm:rounded-3xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 border-2 border-transparent focus:border-indigo-600 transition-all shadow-inner appearance-none"
                                    >
                                        {printerRoles.map((role) => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cashier Main Printer</label>
                                    <button
                                        onClick={() => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, isPrimaryCashier: !printerModal.printer.isPrimaryCashier } })}
                                        className={`w-full p-4 sm:p-5 rounded-2xl sm:rounded-3xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${printerModal.printer.isPrimaryCashier ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent'}`}
                                    >
                                        {printerModal.printer.isPrimaryCashier ? 'PRIMARY ENABLED' : 'SET AS PRIMARY'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Connection Type</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <button
                                        onClick={() => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, type: 'NETWORK' } })}
                                        className={`p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 sm:gap-4 ${printerModal.printer.type === 'NETWORK' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-lg' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                    >
                                        <Network size={24} className="sm:hidden" />
                                        <Network size={32} className="hidden sm:block" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Network Printer</span>
                                    </button>
                                    <button
                                        onClick={() => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, type: 'LOCAL' } })}
                                        className={`p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 sm:gap-4 ${printerModal.printer.type === 'LOCAL' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-lg' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                    >
                                        <Monitor size={24} className="sm:hidden" />
                                        <Monitor size={32} className="hidden sm:block" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Local Printer</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    {printerModal.printer.type === 'NETWORK' ? 'IP Address' : 'Printer ID'}
                                </label>
                                <input
                                    type="text"
                                    value={printerModal.printer.address}
                                    onChange={(e) => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, address: e.target.value } })}
                                    className="w-full p-4 sm:p-5 bg-slate-900 text-indigo-400 rounded-2xl sm:rounded-3xl font-black text-xs font-mono outline-none border-2 border-indigo-950 shadow-2xl tracking-tighter"
                                    placeholder={printerModal.printer.type === 'NETWORK' ? "10.0.0.XXX" : "EPSON-L90"}
                                />
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl sm:rounded-[2rem] border border-amber-100/50 dark:border-amber-800/30">
                                <AlertCircle size={20} className="text-amber-500 flex-shrink-0 sm:hidden" />
                                <AlertCircle size={24} className="text-amber-500 flex-shrink-0 hidden sm:block" />
                                <p className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase leading-relaxed tracking-widest">
                                    Connection will be tested after saving.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 sm:p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                            <button
                                onClick={() => setPrinterModal(null)}
                                disabled={isSaving}
                                className="w-full sm:flex-1 py-4 sm:py-5 bg-white dark:bg-slate-800 text-slate-500 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-100 transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full sm:flex-[2] py-4 sm:py-5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrinterManager;
