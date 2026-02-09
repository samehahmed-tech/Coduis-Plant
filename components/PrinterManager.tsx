
import React, { useEffect, useState } from 'react';
import {
    Printer as PrinterIcon, Plus, Search, Edit3, Trash2,
    X, Network, Monitor, Building2,
    AlertCircle
} from 'lucide-react';
import { Printer, Branch } from '../types';

// Stores
import { useAuthStore } from '../stores/useAuthStore';

const PrinterManager: React.FC = () => {
    const { printers, branches, settings, fetchPrinters, createPrinterInDB, updatePrinterInDB, deletePrinterFromDB, heartbeatPrinterInDB } = useAuthStore();
    const lang = (settings.language || 'en') as 'en' | 'ar';

    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [printerModal, setPrinterModal] = useState<{
        isOpen: boolean;
        mode: 'ADD' | 'EDIT';
        printer: Printer;
    } | null>(null);

    const filteredPrinters = (printers || []).filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchPrinters();
    }, [fetchPrinters]);

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

    return (
        <div className="p-8 space-y-10 animate-fade-in transition-all pb-24 min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <PrinterIcon className="text-indigo-600" size={36} />
                        Network Infrastructure
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                        Configure order routing, thermal stations, and KDS nodes.
                    </p>
                </div>
                <button
                    onClick={() => setPrinterModal({
                        isOpen: true,
                        mode: 'ADD',
                        printer: { id: '', name: '', type: 'LOCAL', address: '', isActive: true, branchId: branches[0]?.id || '' }
                    })}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Register Station
                </button>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-3 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Scan network aliases or system IDs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 rounded-[2.5rem] outline-none shadow-sm font-bold text-sm"
                    />
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-[2.5rem] flex flex-col items-center justify-center shadow-sm">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">SYSTEM NODES</p>
                    <p className="text-3xl font-black text-emerald-600">{printers.filter(p => p.isActive).length} <span className="text-xs opacity-40">/ {printers.length}</span></p>
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
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                        <Building2 size={14} className="text-indigo-500" /> {branch?.name || 'GLOBAL NODE'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner">
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{printer.type === 'NETWORK' ? 'IP ADDRESS' : 'DAEMON ID'}</p>
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
                                    {testingId === printer.id ? 'Testing...' : 'Packet Test'}
                                </button>
                                <div className={`flex-1 py-4 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest border ${printer.isActive ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border-emerald-100' : 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 border-rose-100'}`}>
                                    {printer.isActive ? 'Online' : 'Offline'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Printer Modal */}
            {printerModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col transform animate-in zoom-in-95 duration-400">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-600/30">
                                    <PrinterIcon size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{printerModal.mode === 'ADD' ? 'Node Registration' : 'Edit Configuration'}</h3>
                                    <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mt-1">Universal Print Protocol v2.6</p>
                                </div>
                            </div>
                            <button onClick={() => setPrinterModal(null)} className="p-4 bg-white dark:bg-slate-800 text-slate-400 rounded-2xl shadow-sm hover:rotate-90 hover:text-rose-500 transition-all"><X size={24} /></button>
                        </div>

                        <div className="p-10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Station Alias</label>
                                    <input
                                        type="text"
                                        value={printerModal.printer.name}
                                        onChange={(e) => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, name: e.target.value } })}
                                        className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-xs uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 border-2 border-transparent focus:border-indigo-600 transition-all shadow-inner"
                                        placeholder="e.g. KITCHEN_B1"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Branch Cluster</label>
                                    <select
                                        value={printerModal.printer.branchId}
                                        onChange={(e) => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, branchId: e.target.value } })}
                                        className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 border-2 border-transparent focus:border-indigo-600 transition-all shadow-inner appearance-none"
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Connection Fabric</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, type: 'NETWORK' } })}
                                        className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${printerModal.printer.type === 'NETWORK' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-lg' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                    >
                                        <Network size={32} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">TCP/IP Network</span>
                                    </button>
                                    <button
                                        onClick={() => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, type: 'LOCAL' } })}
                                        className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${printerModal.printer.type === 'LOCAL' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-lg' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                    >
                                        <Monitor size={32} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Direct Daemon</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    {printerModal.printer.type === 'NETWORK' ? 'Endpoint / Host IP' : 'System Hardware ID'}
                                </label>
                                <input
                                    type="text"
                                    value={printerModal.printer.address}
                                    onChange={(e) => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, address: e.target.value } })}
                                    className="w-full p-5 bg-slate-900 text-indigo-400 rounded-3xl font-black text-xs font-mono outline-none border-2 border-indigo-950 shadow-2xl tracking-tighter"
                                    placeholder={printerModal.printer.type === 'NETWORK' ? "10.0.0.XXX" : "DAEMON://EPSON-L90"}
                                />
                            </div>

                            <div className="flex items-center gap-4 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] border border-amber-100/50 dark:border-amber-800/30">
                                <AlertCircle size={24} className="text-amber-500 flex-shrink-0" />
                                <p className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase leading-relaxed tracking-widest">
                                    System will perform a handshake after confirmation to verify node integrity.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex gap-4">
                            <button
                                onClick={() => setPrinterModal(null)}
                                disabled={isSaving}
                                className="flex-1 py-5 bg-white dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-100 transition-all shadow-sm"
                            >
                                Abort
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Secure Registration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrinterManager;
