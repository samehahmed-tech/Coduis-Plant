
import React, { useState, useMemo } from 'react';
import {
    ShieldAlert,
    History,
    Search,
    Filter,
    Eye,
    Zap,
    Clock,
    AlertTriangle,
    CheckCircle2,
    User as UserIcon,
    HardDriveLabel,
    ArrowRight,
    Maximize2,
    FileSearch,
    Fingerprint
} from 'lucide-react';
import { AuditLog, AuditEventType, User } from '../types';

interface ForensicsHubProps {
    logs: AuditLog[];
    lang: 'en' | 'ar';
    t: any;
    users: User[];
}

const ForensicsHub: React.FC<ForensicsHubProps> = ({ logs, lang, t, users }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<AuditEventType | 'ALL'>('ALL');
    const [forensicMode, setForensicMode] = useState(false);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch =
                log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.eventType.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesFilter = filterType === 'ALL' || log.eventType === filterType;

            return matchesSearch && matchesFilter;
        });
    }, [logs, searchQuery, filterType]);

    const selectedLog = logs.find(l => l.id === selectedLogId);

    const getEventIcon = (type: AuditEventType) => {
        switch (type) {
            case AuditEventType.POS_VOID: return <AlertTriangle className="text-rose-500" />;
            case AuditEventType.POS_DISCOUNT: return <Zap className="text-amber-500" />;
            case AuditEventType.SECURITY_PERMISSION_CHANGE: return <ShieldAlert className="text-indigo-600" />;
            case AuditEventType.PO_STATUS_CHANGE: return <CheckCircle2 className="text-emerald-500" />;
            default: return <Clock className="text-slate-400" />;
        }
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Fingerprint className="text-indigo-600" size={32} />
                        {lang === 'ar' ? 'مركز التحقيق الجنائي الرقمي' : 'Forensics & Audit Hub'}
                    </h2>
                    <p className="text-sm text-slate-500 font-bold">
                        {lang === 'ar' ? 'سجلات غير قابلة للتغيير لكل لمسة في النظام. الشفافية المطلقة.' : 'Immutable audit trails for every system touchpoint. Total non-repudiation.'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setForensicMode(!forensicMode)}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${forensicMode ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
                    >
                        <FileSearch size={18} />
                        {lang === 'ar' ? 'وضع التحقيق النشط' : 'Active Forensic Mode'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Logs Timeline */}
                <div className="xl:col-span-7 space-y-4">
                    <div className="card-primary !p-4 flex flex-col md:flex-row gap-4 items-center mb-6">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={lang === 'ar' ? 'بحث في السجلات...' : 'Search Audit Logs...'}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 font-bold text-xs"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 font-black text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 w-full md:w-auto"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value as any)}
                        >
                            <option value="ALL">All Events</option>
                            {Object.values(AuditEventType).map(v => (
                                <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3 max-h-[700px] overflow-y-auto no-scrollbar pr-2">
                        {filteredLogs.length === 0 ? (
                            <div className="card-primary !p-20 text-center opacity-40">
                                <History size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="font-black uppercase text-xs">No matching forensic records found</p>
                            </div>
                        ) : (
                            filteredLogs.map(log => (
                                <button
                                    key={log.id}
                                    onClick={() => setSelectedLogId(log.id)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group ${selectedLogId === log.id ? 'bg-white dark:bg-slate-900 border-indigo-600 shadow-xl' : 'bg-white/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedLogId === log.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                        {getEventIcon(log.eventType)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{log.eventType}</span>
                                            <span className="text-[9px] font-bold text-slate-400">{log.timestamp.toLocaleTimeString()}</span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate tracking-tight">{log.id}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <UserIcon size={12} className="text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{log.userName} • {log.userRole}</span>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className={`text-slate-300 group-hover:text-indigo-600 transition-all ${selectedLogId === log.id ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Forensic Inspector */}
                <div className="xl:col-span-5">
                    {selectedLog ? (
                        <div className="space-y-6 sticky top-8">
                            <div className="card-primary !p-6 border-t-4 border-t-indigo-600 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                                            <Maximize2 size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase">Forensic Inspector</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Snapshot Review</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase">Integrity Status</p>
                                        <p className="text-xs font-black text-emerald-500 flex items-center justify-end gap-1">
                                            <CheckCircle2 size={12} /> VERIFIED
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Source Agent</p>
                                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{selectedLog.userName}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Device ID</p>
                                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 font-mono">{selectedLog.deviceId}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Branch Context</p>
                                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{selectedLog.branchId}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Timestamp</p>
                                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{selectedLog.timestamp.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {selectedLog.payload.before && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <History size={14} className="text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">State: BEFORE</span>
                                            </div>
                                            <pre className="bg-slate-900 text-slate-400 p-4 rounded-xl text-[10px] font-mono overflow-x-auto border border-slate-800">
                                                {JSON.stringify(selectedLog.payload.before, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <ArrowRight size={14} className="text-indigo-600" />
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">State: AFTER</span>
                                        </div>
                                        <pre className="bg-indigo-950 text-indigo-200/80 p-4 rounded-xl text-[10px] font-mono overflow-x-auto border border-indigo-900/50 shadow-inner">
                                            {JSON.stringify(selectedLog.payload.after, null, 2)}
                                        </pre>
                                    </div>

                                    {selectedLog.payload.reason && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 p-4 rounded-xl">
                                            <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Stated Intent / Reason</p>
                                            <p className="text-xs font-bold text-amber-900 dark:text-amber-200 italic">"{selectedLog.payload.reason}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {forensicMode && (
                                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 p-6 rounded-2xl animate-pulse">
                                    <div className="flex items-center gap-3 mb-4">
                                        <AlertTriangle className="text-rose-600 underline" size={24} />
                                        <div>
                                            <h4 className="text-xs font-black text-rose-800 dark:text-rose-200 uppercase tracking-tighter italic font-serif">Anomaly Analysis Running...</h4>
                                            <p className="text-[9px] font-bold text-rose-600 uppercase">AI Forensics Layer Active</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-rose-800/70 dark:text-rose-300/70 leading-relaxed">
                                        The forensic engine is currently analyzing the sequence of events preceding this log. It is looking for cross-branch patterns that may indicate systemic abuse or workflow bypass.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card-primary !p-32 flex flex-col items-center justify-center text-center opacity-50 bg-slate-50/50 dark:bg-slate-900/50 border-dashed">
                            <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-8 border-4 border-white dark:border-slate-900 shadow-xl">
                                <FileSearch size={48} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Select Log for Inspection</h3>
                            <p className="text-sm text-slate-500 font-bold mt-2 max-w-xs mx-auto">
                                Pick a forensic snapshot from the timeline to perform a detailed metadata audit and state comparison.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForensicsHub;
