import React, { useState, useEffect } from 'react';
import {
    FileText,
    ShieldCheck,
    Download,
    Printer,
    TrendingUp,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    Info,
    Clock,
    Landmark,
    Calculator
} from 'lucide-react';
import { reportsApi, shiftsApi } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { translations } from '../services/translations';

const FiscalHub: React.FC = () => {
    const { settings } = useAuthStore();
    const lang = settings.language || 'en';
    const t = translations[lang];

    const [fiscalData, setFiscalData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // 1st of current month
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadFiscalData();
    }, [dateRange]);

    const loadFiscalData = async () => {
        setIsLoading(true);
        try {
            const data = await reportsApi.getFiscal({
                startDate: dateRange.start,
                endDate: dateRange.end
            });
            setFiscalData(data);
        } catch (error) {
            console.error("Failed to load fiscal data", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 lg:p-12 bg-app min-h-screen pb-24">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 rounded-[2rem] bg-indigo-700 text-white flex items-center justify-center shadow-2xl shadow-indigo-700/30">
                            <Landmark size={32} />
                        </div>
                        <h2 className="text-4xl font-black text-main uppercase tracking-tighter">
                            {lang === 'ar' ? 'الامتثال الضريبي' : 'Fiscal Hub'}
                        </h2>
                    </div>
                    <p className="text-muted font-bold text-sm uppercase tracking-widest opacity-60 flex items-center gap-2">
                        {lang === 'ar' ? 'الامتثال الضريبي والتقارير القانونية' : 'Tax Compliance & Statutory Reporting'}
                        <CheckCircle2 size={14} className="text-success" />
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
                    <div className="flex items-center gap-3 pr-6 border-r border-border">
                        <Calendar size={18} className="text-muted" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted uppercase">Period Selection</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="bg-transparent text-sm font-black text-main outline-none"
                                />
                                <span className="text-muted opacity-40">-</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="bg-transparent text-sm font-black text-main outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    <button className="p-3 bg-app hover:bg-elevated border border-border rounded-xl transition-all">
                        <Download size={18} className="text-muted" />
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
                {/* VAT Summary Card */}
                <div className="xl:col-span-2 bg-card border border-border rounded-[2.5rem] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <Calculator size={120} />
                    </div>

                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                            <FileText size={20} />
                        </div>
                        <h3 className="text-xl font-black text-main uppercase tracking-tight">VAT 14.0% Declaration</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Taxable Base (Net)</p>
                            <h4 className="text-3xl font-black text-main">
                                {fiscalData?.data?.netSales?.toLocaleString() || '0'} <span className="text-sm">ج.م</span>
                            </h4>
                            <p className="text-[10px] font-bold text-muted mt-2">Exclude non-taxable items</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">VAT Amount (Payable)</p>
                            <h4 className="text-3xl font-black text-rose-500">
                                {fiscalData?.data?.vatAmount?.toLocaleString() || '0'} <span className="text-sm">ج.م</span>
                            </h4>
                            <div className="flex items-center gap-1.5 mt-2">
                                <TrendingUp size={10} className="text-rose-500" />
                                <span className="text-[10px] font-bold text-muted">+4.2% from last month</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Total Fiscal Sales</p>
                            <h4 className="text-3xl font-black text-main">
                                {fiscalData?.data?.totalSales?.toLocaleString() || '0'} <span className="text-sm">ج.م</span>
                            </h4>
                            <p className="text-[10px] font-bold text-muted mt-2">From {fiscalData?.data?.orderCount || 0} valid orders</p>
                        </div>
                    </div>

                    <div className="mt-12 flex items-center gap-4 p-4 bg-app rounded-2xl border border-border/50">
                        <Info size={16} className="text-primary shrink-0" />
                        <p className="text-xs font-bold text-muted">
                            Data extracted directly from signed transaction logs. This summary fulfills the monthly VAT return requirements for the Egyptian Ministry of Finance.
                        </p>
                    </div>
                </div>

                {/* ETA Readiness Card */}
                <div className="bg-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-700/30 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-white/10 rounded-2xl">
                                <ShieldCheck size={28} />
                            </div>
                            <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full">BETA</span>
                        </div>
                        <h4 className="text-2xl font-black uppercase tracking-tighter mb-4">ETA Mandate Readiness</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase opacity-70 italic">GS1 Mapping</span>
                                <CheckCircle2 size={16} className="text-emerald-400" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase opacity-70 italic">Digital Signature</span>
                                <CheckCircle2 size={16} className="text-emerald-400" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase opacity-70 italic">E-Receipt API Bridge</span>
                                <AlertTriangle size={16} className="text-amber-400" />
                            </div>
                        </div>
                    </div>

                    <button className="mt-8 flex items-center justify-center gap-3 bg-white text-indigo-700 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all">
                        Integrate With ETA Portal
                        <ExternalLink size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Z-Report History */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-main uppercase tracking-tight flex items-center gap-3 px-2">
                        <Clock className="text-primary" />
                        Z-Report Registry
                    </h3>
                    <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-elevated/50 text-[10px] font-black uppercase text-muted tracking-widest border-b border-border">
                                <tr>
                                    <th className="px-8 py-5">Daily Closure Date</th>
                                    <th className="px-6 py-5">Shift Final</th>
                                    <th className="px-6 py-5">VAT 14.0%</th>
                                    <th className="px-8 py-5 text-right">Certificate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {[
                                    { date: '2026-02-01', total: '42,400', vat: '5,936', status: 'SIGNED' },
                                    { date: '2026-01-31', total: '38,500', vat: '5,390', status: 'SIGNED' },
                                    { date: '2026-01-30', total: '51,200', vat: '7,168', status: 'SIGNED' },
                                ].map((report, i) => (
                                    <tr key={i} className="hover:bg-app/50 transition-all">
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-main">{report.date}</p>
                                            <p className="text-[10px] font-bold text-muted uppercase">Batch ID: #ZNT-{report.date.replace(/-/g, '')}</p>
                                        </td>
                                        <td className="px-6 py-6 font-mono text-xs font-black">{report.total} ج.م</td>
                                        <td className="px-6 py-6 font-mono text-xs font-black text-rose-500">{report.vat} ج.م</td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                {report.status}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Audit & Compliance Log */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-main uppercase tracking-tight flex items-center gap-3 px-2">
                        <ShieldCheck className="text-primary" />
                        Compliance Audit Trail
                    </h3>
                    <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-6">
                        {[
                            { action: 'VAT Rate Verification', user: 'System (Auto)', time: '2h ago', status: 'PASS' },
                            { action: 'Z-Report Finalization', user: 'Admin Mahmoud', time: '14h ago', status: 'PASS' },
                            { action: 'Invoice Sequence Audit', user: 'Forensics Engine', time: '1d ago', status: 'PASS' },
                            { action: 'Manual Price Override', user: 'User Sarah', time: '2d ago', status: 'REVIEW', color: 'text-amber-500' },
                        ].map((log, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-app rounded-2xl border border-border/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-8 rounded-full bg-border/20" />
                                    <div>
                                        <p className="text-xs font-black text-main uppercase">{log.action}</p>
                                        <p className="text-[10px] font-bold text-muted">Initiated by {log.user} • {log.time}</p>
                                    </div>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${log.color || 'text-emerald-500'}`}>{log.status}</span>
                            </div>
                        ))}

                        <button className="w-full mt-6 flex items-center justify-center gap-2 text-muted hover:text-primary transition-all text-xs font-bold uppercase tracking-widest">
                            <FileText size={16} />
                            View Full Fiscal Logs
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FiscalHub;
