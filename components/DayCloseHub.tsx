import React, { useEffect, useMemo, useState } from 'react';
import { dayCloseApi } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';

const todayLocalDate = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const DayCloseHub: React.FC = () => {
    const { settings, branches } = useAuthStore();
    const lang = settings.language || 'en';
    const currentUser = settings.currentUser;
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    const availableBranches = useMemo(() => {
        if (isSuperAdmin) return branches;
        if (!settings.activeBranchId) return [];
        return branches.filter((b) => b.id === settings.activeBranchId);
    }, [branches, isSuperAdmin, settings.activeBranchId]);

    const [branchId, setBranchId] = useState<string>(settings.activeBranchId || availableBranches[0]?.id || '');
    const [date, setDate] = useState<string>(todayLocalDate());
    const [report, setReport] = useState<any | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [notes, setNotes] = useState('');
    const [enforceFiscalClean, setEnforceFiscalClean] = useState(true);
    const [emailTo, setEmailTo] = useState('');
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!branchId && availableBranches[0]?.id) {
            setBranchId(availableBranches[0].id);
        }
    }, [availableBranches, branchId]);

    const loadReport = async () => {
        if (!branchId || !date) return;
        setIsLoadingReport(true);
        setError(null);
        setMessage(null);
        try {
            const data = await dayCloseApi.getReport(branchId, date);
            setReport(data);
        } catch (e: any) {
            setError(e?.message || 'Failed to load report');
            setReport(null);
        } finally {
            setIsLoadingReport(false);
        }
    };

    const loadHistory = async () => {
        if (!branchId) return;
        try {
            const rows = await dayCloseApi.getHistory(branchId, 20);
            setHistory(rows || []);
        } catch {
            setHistory([]);
        }
    };

    useEffect(() => {
        loadReport();
        loadHistory();
    }, [branchId, date]);

    const handleCloseDay = async () => {
        if (!branchId || !date) return;
        setIsClosing(true);
        setError(null);
        setMessage(null);
        try {
            const result = await dayCloseApi.close(branchId, date, {
                notes: notes || undefined,
                enforceFiscalClean,
            });
            setMessage(result.message || 'Day closed successfully');
            await loadReport();
            await loadHistory();
        } catch (e: any) {
            setError(e?.message || 'Failed to close day');
        } finally {
            setIsClosing(false);
        }
    };

    const handleSendEmail = async () => {
        if (!branchId || !date || !emailTo.trim()) {
            setError(lang === 'ar' ? 'أدخل بريداً واحداً على الأقل' : 'Enter at least one recipient email');
            return;
        }
        setIsSending(true);
        setError(null);
        setMessage(null);
        try {
            const to = emailTo.split(',').map((x) => x.trim()).filter(Boolean);
            const result = await dayCloseApi.sendEmail(branchId, date, {
                to,
                subject: `Day Close Report - ${date}`,
                includeReports: ['sales', 'payments', 'audit'],
            });
            setMessage(result.message || (lang === 'ar' ? 'تم إرسال الإيميل' : 'Email sent'));
        } catch (e: any) {
            setError(e?.message || 'Failed to send email');
        } finally {
            setIsSending(false);
        }
    };

    const handlePrintReport = () => {
        if (settings.autoPrintReports === false) return;
        window.print();
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen">
            <div className="card-primary rounded-3xl p-5 md:p-6">
                <h2 className="text-2xl font-black text-main">{lang === 'ar' ? 'إغلاق اليوم' : 'Day Close'}</h2>
                <p className="text-sm text-muted mt-1">{lang === 'ar' ? 'إغلاق يوم الفرع مع مراجعة الإيراد والحالة الضريبية' : 'Close branch day with sales and fiscal health checks'}</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
                    <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="px-3 py-2.5 rounded-xl bg-elevated border border-border/50 font-bold"
                    >
                        {availableBranches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-2.5 rounded-xl bg-elevated border border-border/50 font-bold"
                    />
                    <button
                        onClick={loadReport}
                        disabled={isLoadingReport}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                        {isLoadingReport ? (lang === 'ar' ? 'تحميل...' : 'Loading...') : (lang === 'ar' ? 'تحديث التقرير' : 'Refresh Report')}
                    </button>
                    <button
                        onClick={handleCloseDay}
                        disabled={isClosing}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                        {isClosing ? (lang === 'ar' ? 'جارٍ الإغلاق...' : 'Closing...') : (lang === 'ar' ? 'إغلاق اليوم' : 'Close Day')}
                    </button>
                </div>
                <div className="mt-3">
                    <button
                        onClick={handlePrintReport}
                        className="px-4 py-2.5 rounded-xl bg-slate-700 text-white font-black text-xs uppercase tracking-widest"
                    >
                        {lang === 'ar' ? 'طباعة التقرير' : 'Print Report'}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={lang === 'ar' ? 'ملاحظات الإغلاق (اختياري)' : 'Close notes (optional)'}
                        className="px-3 py-2.5 rounded-xl bg-elevated border border-border/50 font-bold"
                    />
                    <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-elevated border border-border/50 font-bold text-sm">
                        <input
                            type="checkbox"
                            checked={enforceFiscalClean}
                            onChange={(e) => setEnforceFiscalClean(e.target.checked)}
                        />
                        {lang === 'ar' ? 'منع الإغلاق إذا الحالة الضريبية غير نظيفة' : 'Block close if fiscal health is not clean'}
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                    <input
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder={lang === 'ar' ? 'إيميلات مفصولة بفاصلة' : 'Comma-separated recipient emails'}
                        className="md:col-span-3 px-3 py-2.5 rounded-xl bg-elevated border border-border/50 font-bold"
                    />
                    <button
                        onClick={handleSendEmail}
                        disabled={isSending}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                        {isSending ? (lang === 'ar' ? 'إرسال...' : 'Sending...') : (lang === 'ar' ? 'إرسال الإيميل' : 'Send Email')}
                    </button>
                </div>

                {error && <p className="mt-3 text-rose-600 text-sm font-bold">{error}</p>}
                {message && <p className="mt-3 text-emerald-600 text-sm font-bold">{message}</p>}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="card-primary rounded-3xl p-5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted mb-3">{lang === 'ar' ? 'ملخص المبيعات' : 'Sales Summary'}</h3>
                    <div className="space-y-2 text-sm font-bold">
                        <p>{lang === 'ar' ? 'الطلبات:' : 'Orders:'} {report?.salesSummary?.totalOrders ?? 0}</p>
                        <p>{lang === 'ar' ? 'الإيراد:' : 'Revenue:'} {(report?.salesSummary?.totalRevenue ?? 0).toLocaleString()}</p>
                        <p>{lang === 'ar' ? 'الصافي:' : 'Net Sales:'} {(report?.salesSummary?.netSales ?? 0).toLocaleString()}</p>
                        <p>{lang === 'ar' ? 'الضريبة:' : 'Tax:'} {(report?.salesSummary?.totalTax ?? 0).toLocaleString()}</p>
                        <p>{lang === 'ar' ? 'الخصومات:' : 'Discounts:'} {(report?.salesSummary?.totalDiscount ?? 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="card-primary rounded-3xl p-5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted mb-3">{lang === 'ar' ? 'الحالة الضريبية' : 'Fiscal Health'}</h3>
                    <div className="space-y-2 text-sm font-bold">
                        <p>{lang === 'ar' ? 'Submitted:' : 'Submitted:'} {report?.fiscalHealth?.submitted ?? 0}</p>
                        <p>{lang === 'ar' ? 'Pending:' : 'Pending:'} {report?.fiscalHealth?.pending ?? 0}</p>
                        <p>{lang === 'ar' ? 'Failed:' : 'Failed:'} {report?.fiscalHealth?.failed ?? 0}</p>
                        <p>{lang === 'ar' ? 'Dead Letters:' : 'Dead Letters:'} {report?.fiscalHealth?.deadLettersPending ?? 0}</p>
                    </div>
                </div>

                <div className="card-primary rounded-3xl p-5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted mb-3">{lang === 'ar' ? 'التدقيق' : 'Audit Summary'}</h3>
                    <div className="space-y-2 text-sm font-bold">
                        <p>{lang === 'ar' ? 'إجمالي الأحداث:' : 'Total Events:'} {report?.auditSummary?.totalEvents ?? 0}</p>
                        <p>{lang === 'ar' ? 'ط¥ظ„ط؛ط§ط،:' : 'Voids:'} {report?.auditSummary?.voidCount ?? 0}</p>
                        <p>{lang === 'ar' ? 'خصومات:' : 'Discounts:'} {report?.auditSummary?.discountCount ?? 0}</p>
                        <p>{lang === 'ar' ? 'مرتجعات:' : 'Refunds:'} {report?.auditSummary?.refundCount ?? 0}</p>
                    </div>
                </div>
            </div>

            <div className="card-primary rounded-3xl p-5">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted mb-3">{lang === 'ar' ? 'سجل الإغلاق' : 'Close History'}</h3>
                {history.length === 0 && (
                    <p className="text-sm text-muted font-bold">{lang === 'ar' ? 'لا يوجد سجل حتى الآن' : 'No history yet'}</p>
                )}
                <div className="space-y-2">
                    {history.map((row) => (
                        <div key={row.id} className="p-3 rounded-xl bg-elevated border border-border/50 flex items-center justify-between text-sm">
                            <div>
                                <p className="font-black">{row.date}</p>
                                <p className="text-muted font-bold">{lang === 'ar' ? 'ط¨ظˆط§ط³ط·ط©:' : 'By:'} {row.closedBy}</p>
                            </div>
                            <div className="text-right font-bold">
                                <p>{lang === 'ar' ? 'الطلبات:' : 'Orders:'} {row.summary?.totalOrders ?? 0}</p>
                                <p>{lang === 'ar' ? 'الصافي:' : 'Net:'} {(row.summary?.netSales ?? 0).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DayCloseHub;


