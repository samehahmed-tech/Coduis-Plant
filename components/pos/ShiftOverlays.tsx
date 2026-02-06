import React, { useState, useEffect } from 'react';
import { Lock, Unlock, LogOut, Calculator, ArrowRight, CheckCircle2, History } from 'lucide-react';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { shiftsApi } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';
import { translations } from '../../services/translations';
import { useToast } from '../Toast';

interface ShiftOverlaysProps {
    onOpen: () => void;
}

export const ShiftOverlays: React.FC<ShiftOverlaysProps> = ({ onOpen }) => {
    const activeShift = useFinanceStore(state => state.activeShift);
    const setShift = useFinanceStore(state => state.setShift);
    const settings = useAuthStore(state => state.settings);
    const user = useAuthStore(state => state.settings.currentUser);
    const lang = (settings.language || 'en') as 'en' | 'ar';
    const t = translations[lang] || translations.en;
    const { showToast } = useToast();

    const [openingBalance, setOpeningBalance] = useState('0');
    const [loading, setLoading] = useState(false);
    const [actualBalance, setActualBalance] = useState('0');
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [shiftReport, setShiftReport] = useState<any>(null);

    useEffect(() => {
        const hydrateShift = async () => {
            if (activeShift) return;
            if (!settings.activeBranchId) return;
            try {
                const res = await shiftsApi.getActive(settings.activeBranchId);
                if (res) setShift(res);
            } catch {
                // ignore if no active shift
            }
        };
        hydrateShift();
    }, [activeShift, settings.activeBranchId, setShift, user?.id]);

    // If there's no active shift, show the Open Shift Lock Screen
    if (!activeShift) {
        const handleOpenShift = async () => {
            setLoading(true);
            try {
                const id = Math.random().toString(36).substr(2, 9).toUpperCase();
                const data = {
                    id,
                    branchId: settings.activeBranchId || 'b1',
                    userId: user?.id || 'u1',
                    openingBalance: parseFloat(openingBalance),
                };
                const res = await shiftsApi.open(data);
                setShift(res);
                onOpen();
            } catch (err) {
                showToast(t.shift_open_failed || 'Failed to open shift', 'error');
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-20">
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
                <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in duration-300">
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-24 h-24 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-500/20">
                            <Lock className="w-12 h-12 text-indigo-500" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                            {t.shift_locked || 'Shift Locked'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed">
                            {t.open_shift_message || 'Please open a new shift with a starting balance to begin operations.'}
                        </p>

                        <div className="space-y-6 text-left max-w-sm mx-auto">
                            <div>
                                <label className="block text-sm font-black text-slate-500 uppercase tracking-widest mb-3 px-2">
                                    {t.starting_balance || 'Opening Cash Balance (EGP)'}
                                </label>
                                <div className="relative">
                                    <Calculator className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 w-6 h-6" />
                                    <input
                                        type="number"
                                        value={openingBalance}
                                        onChange={(e) => setOpeningBalance(e.target.value)}
                                        className="w-full py-5 pl-16 pr-8 bg-slate-100 dark:bg-slate-800/50 border-none rounded-3xl text-2xl font-black focus:ring-4 focus:ring-indigo-500/20 transition-all text-indigo-600 dark:text-indigo-400"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleOpenShift}
                                disabled={loading}
                                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-500/20"
                            >
                                {loading ? 'Processing...' : (
                                    <>
                                        <Unlock className="w-6 h-6" />
                                        {t.open_shift || 'Open Shift Now'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/30 p-6 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">RestoFlow ERP Production v1.0</p>
                    </div>
                </div>
            </div>
        );
    }

    // --- Close Shift Rendering (Triggered by Parent via local state/context if needed) ---
    // For simplicity, we expose a "Close Shift" button only in this component or via POS state
    return null;
};

export const CloseShiftModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const activeShift = useFinanceStore(state => state.activeShift);
    const setShift = useFinanceStore(state => state.setShift);
    const settings = useAuthStore(state => state.settings);
    const t = translations[settings.language];
    const { showToast } = useToast();

    const [actualBalance, setActualBalance] = useState('0');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    if (!isOpen || !activeShift) return null;

    const handleClose = async () => {
        setLoading(true);
        try {
            const res = await shiftsApi.close(activeShift.id, {
                actualBalance: parseFloat(actualBalance),
                notes: 'Desktop POS Closure'
            });
            setReport(res);
            // Wait a bit to show success report before clearing shift
            setTimeout(() => {
                setShift(null);
                onClose();
            }, 3000);
        } catch (err) {
            showToast(t.shift_close_failed || 'Failed to close shift', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />

            {!report ? (
                <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/10 transform animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-6 mb-10">
                        <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                            <LogOut className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.close_shift || 'Shift Out / Reconcile'}</h2>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Audit Log ID: {activeShift.id}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t.opening || 'Opening'}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">{activeShift.openingBalance} EGP</p>
                        </div>
                        <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100/20">
                            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">{t.started || 'Started'}</p>
                            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{new Date(activeShift.openingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    <div className="mb-10">
                        <label className="block text-sm font-black text-slate-500 uppercase tracking-widest mb-4 px-2">
                            {t.counted_cash || 'Actual Cash in Drawer (EGP)'}
                        </label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                                <Calculator className="text-indigo-500 w-5 h-5" />
                            </div>
                            <input
                                type="number"
                                autoFocus
                                value={actualBalance}
                                onChange={(e) => setActualBalance(e.target.value)}
                                className="w-full py-6 pl-20 pr-8 bg-slate-100 dark:bg-slate-800/50 border-none rounded-3xl text-3xl font-black focus:ring-4 focus:ring-indigo-500/20 transition-all text-indigo-600 dark:text-indigo-400"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-3xl font-black text-lg transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                            {t.cancel || 'Go Back'}
                        </button>
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-[2] py-5 bg-red-600 hover:bg-red-700 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/20"
                        >
                            {loading ? 'Closing...' : (
                                <>
                                    <Unlock className="w-5 h-5" />
                                    {t.confirm_close || 'Close & Sync'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] p-10 text-center shadow-2xl border border-white/10 transform animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Shift Reconciled</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">Wait for Z-Report sync...</p>

                    <div className="space-y-3 mb-8">
                        <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Expected</span>
                            <span className="text-lg font-black text-slate-700 dark:text-slate-300">{report.expectedBalance?.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Actual</span>
                            <span className="text-lg font-black text-green-600">{report.actualBalance?.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex justify-between items-center py-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Variance</span>
                            <span className={`text-lg font-black ${report.actualBalance - report.expectedBalance < 0 ? 'text-red-500' : 'text-indigo-500'}`}>
                                {(report.actualBalance - report.expectedBalance).toFixed(2)} EGP
                            </span>
                        </div>
                    </div>

                    <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 animate-[progress_3s_linear]" style={{ width: '100%' }} />
                    </div>
                </div>
            )}
        </div>
    );
};
