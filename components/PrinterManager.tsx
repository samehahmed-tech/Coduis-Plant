
import React, { useState } from 'react';
import {
    Printer as PrinterIcon, Plus, Search, Edit3, Trash2,
    CheckCircle2, X, Save, Network, Monitor, Building2,
    Settings, AlertCircle
} from 'lucide-react';
import { Printer, Branch, PrinterType } from '../types';

interface PrinterManagerProps {
    printers: Printer[];
    branches: Branch[];
    onAddPrinter: (printer: Printer) => void;
    onUpdatePrinter: (printer: Printer) => void;
    onDeletePrinter: (id: string) => void;
    lang: 'en' | 'ar';
}

const PrinterManager: React.FC<PrinterManagerProps> = ({
    printers, branches, onAddPrinter, onUpdatePrinter, onDeletePrinter, lang
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [printerModal, setPrinterModal] = useState<{
        isOpen: boolean;
        mode: 'ADD' | 'EDIT';
        printer: Printer;
    } | null>(null);

    const filteredPrinters = printers.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSave = () => {
        if (!printerModal) return;
        if (printerModal.mode === 'ADD') {
            onAddPrinter({ ...printerModal.printer, id: `prn-${Date.now()}` });
        } else {
            onUpdatePrinter(printerModal.printer);
        }
        setPrinterModal(null);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8 animate-fade-in transition-all pb-24">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <PrinterIcon className="text-indigo-600" size={36} />
                        {lang === 'ar' ? 'إدارة الطابعات' : 'Printer Hub'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                        {lang === 'ar' ? 'تكوين محطات الطباعة والربط الشبكي' : 'Configure print stations and network links'}
                    </p>
                </div>
                <button
                    onClick={() => setPrinterModal({
                        isOpen: true,
                        mode: 'ADD',
                        printer: { id: '', name: '', type: 'LOCAL', address: '', isActive: true, branchId: branches[0]?.id || '' }
                    })}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    {lang === 'ar' ? 'طابعة جديدة' : 'Add Printer'}
                </button>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder={lang === 'ar' ? 'بحث باسم الطابعة أو العنوان...' : 'Search by name or IP...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold shadow-sm"
                    />
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-5 rounded-[2rem] flex flex-col items-center justify-center">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{lang === 'ar' ? 'نشطة' : 'Active Online'}</p>
                    <p className="text-2xl font-black text-emerald-600">{printers.filter(p => p.isActive).length} / {printers.length}</p>
                </div>
            </div>

            {/* Printer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredPrinters.map(printer => {
                    const branch = branches.find(b => b.id === printer.branchId);
                    return (
                        <div key={printer.id} className="group bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden flex flex-col border-b-[8px] border-b-indigo-600/5 hover:border-b-indigo-600 transition-all duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-5 rounded-[1.5rem] shadow-lg ${printer.isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    {printer.type === 'NETWORK' ? <Network size={28} /> : <Monitor size={28} />}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setPrinterModal({ isOpen: true, mode: 'EDIT', printer })} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"><Edit3 size={18} /></button>
                                    <button onClick={() => onDeletePrinter(printer.id)} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18} /></button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase truncate">{printer.name}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                        <Building2 size={12} /> {branch?.name || 'Main Branch'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{printer.type === 'NETWORK' ? 'IP Address' : 'System ID'}</p>
                                        <p className="text-xs font-black text-slate-800 dark:text-white truncate font-mono">{printer.address}</p>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${printer.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button className="flex-1 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Test Print</button>
                                <div className={`px-4 py-4 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest ${printer.isActive ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/20 text-rose-600'}`}>
                                    {printer.isActive ? (lang === 'ar' ? 'متصل' : 'Ready') : (lang === 'ar' ? 'معطل' : 'Offline')}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Printer Modal */}
            {printerModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col transform animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                            <div className="flex items-center gap-5">
                                <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-600/20">
                                    <PrinterIcon size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase">{printerModal.mode === 'ADD' ? (lang === 'ar' ? 'إضافة طابعة' : 'Add Printer') : (lang === 'ar' ? 'تعديل طابعة' : 'Edit Printer')}</h3>
                                    <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">{lang === 'ar' ? 'تخصيص نقطة طباعة الطلبات' : 'Setup order print destination'}</p>
                                </div>
                            </div>
                            <button onClick={() => setPrinterModal(null)} className="p-3 bg-white dark:bg-slate-800 text-slate-400 rounded-2xl shadow-sm hover:rotate-90 transition-all"><X size={24} /></button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'اسم الطابعة' : 'Printer Alias'}</label>
                                    <input
                                        type="text"
                                        value={printerModal.printer.name}
                                        onChange={(e) => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, name: e.target.value } })}
                                        className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 border border-transparent focus:border-indigo-500 transition-all"
                                        placeholder="Kitchen Main"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'الفرع' : 'Associated Branch'}</label>
                                    <select
                                        value={printerModal.printer.branchId}
                                        onChange={(e) => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, branchId: e.target.value } })}
                                        className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] font-black text-xs uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 border border-transparent focus:border-indigo-500 transition-all"
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'نوع الاتصال' : 'Connection Architecture'}</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, type: 'NETWORK' } })}
                                        className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${printerModal.printer.type === 'NETWORK' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                    >
                                        <Network size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Network / IP</span>
                                    </button>
                                    <button
                                        onClick={() => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, type: 'LOCAL' } })}
                                        className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${printerModal.printer.type === 'LOCAL' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                    >
                                        <Monitor size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Local / System</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {printerModal.printer.type === 'NETWORK' ? (lang === 'ar' ? 'عنوان الـ IP' : 'Host / IP Address') : (lang === 'ar' ? 'اسم الطابعة في النظام' : 'System Label')}
                                </label>
                                <input
                                    type="text"
                                    value={printerModal.printer.address}
                                    onChange={(e) => setPrinterModal({ ...printerModal, printer: { ...printerModal.printer, address: e.target.value } })}
                                    className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] font-bold text-sm font-mono outline-none focus:ring-4 focus:ring-indigo-500/10 border border-transparent focus:border-indigo-500 transition-all"
                                    placeholder={printerModal.printer.type === 'NETWORK' ? "192.168.1.100" : "EPSON-T88-V"}
                                />
                            </div>

                            <div className="flex items-center gap-3 p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-indigo-600"><AlertCircle size={18} /></div>
                                <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase leading-relaxed tracking-wider">
                                    {lang === 'ar' ? 'تأكد من ثبات الـ IP في حالة الطابعات الشبكية لضمان جودة الاتصال' : 'Static IP configuration is recommended for network print stability'}
                                </p>
                            </div>
                        </div>

                        <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex gap-4">
                            <button
                                onClick={() => setPrinterModal(null)}
                                className="flex-1 py-5 bg-white dark:bg-slate-800 text-slate-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all"
                            >
                                Confirm Registration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrinterManager;
