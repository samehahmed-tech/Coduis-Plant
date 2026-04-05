import React, { useState, useEffect } from 'react';
import { 
    Lock, Unlock, LogOut, Calculator, ArrowRight, 
    CheckCircle2, History, ShieldAlert, Coins, 
    TrendingUp, ArrowDownRight, User
} from 'lucide-react';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { shiftsApi } from '../../services/api/shifts';
import { useAuthStore } from '../../stores/useAuthStore';
import { translations } from '../../services/translations';
import { useToast } from '../Toast';
import { motion, AnimatePresence } from 'framer-motion';

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
    const isRTL = lang === 'ar';

    const [openingBalance, setOpeningBalance] = useState('0');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const hydrateShift = async () => {
            if (activeShift) return;
            if (!settings.activeBranchId) return;
            try {
                const res = await shiftsApi.getActive(settings.activeBranchId);
                if (res) setShift(res);
            } catch { /* ignore */ }
        };
        hydrateShift();
    }, [activeShift, settings.activeBranchId, setShift, user?.id]);

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

        const addAmount = (amount: number) => {
            const current = parseFloat(openingBalance) || 0;
            setOpeningBalance((current + amount).toString());
        };

        return (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-8"
            >
                <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-3xl" />
                
                {/* Decorative background glass elements */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] animate-pulse delay-700" />

                <motion.div 
                    initial={{ y: 40, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    className="relative w-full max-w-2xl bg-white/5 border border-white/10 rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row backdrop-blur-md"
                >
                    {/* Left Side: Branding & Info */}
                    <div className="md:w-5/12 bg-indigo-600 p-10 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md shadow-inner border border-white/20">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-white leading-tight mb-4 uppercase tracking-tighter">
                                {isRTL ? 'وردية جديدة' : 'Safe Lock'}
                            </h2>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-80 decoration-indigo-200">
                                {t.open_shift_message || 'Initialize the POS system by declaring your starting cash drawer balance.'}
                            </p>
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">{isRTL ? 'الموظف' : 'OPERATOR'}</p>
                                    <p className="text-sm font-black text-white uppercase">{user?.username || 'GUEST MANAGER'}</p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-white/10">
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">RestoFlow Production v1.2</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Input & Actions */}
                    <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
                        <div className="mb-10 text-center md:text-left">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4">
                                {isRTL ? 'رصيد الافتتاح' : 'DECLARE STARTING CASH'}
                            </h3>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-indigo-500 opacity-40">EGP</span>
                                <input
                                    type="number"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                    className="w-full py-8 pl-24 pr-8 bg-slate-100 dark:bg-slate-800/50 border-none rounded-[2rem] text-4xl font-black text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all text-center md:text-left tabular-nums"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-3 gap-3 mb-10">
                            {[100, 200, 500].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => addAmount(amt)}
                                    className="py-3 px-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all active:scale-95 shadow-sm"
                                >
                                    +{amt}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleOpenShift}
                            disabled={loading || parseFloat(openingBalance) < 0}
                            className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all hover:shadow-[0_20px_40px_rgba(79,70,229,0.3)] active:scale-[0.98] relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            {loading ? (
                                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Unlock className="w-6 h-6" />
                                    <span>{isRTL ? 'فتح الوردية' : 'UNLOCK SYSTEM'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    return null;
};

interface CloseShiftModalProps {
    isOpen: boolean; 
    onClose: () => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({ isOpen, onClose }) => {
    const activeShift = useFinanceStore(state => state.activeShift);
    const setShift = useFinanceStore(state => state.setShift);
    const settings = useAuthStore(state => state.settings);
    const lang = (settings.language || 'en') as 'en' | 'ar';
    const t = translations[lang] || translations.en;
    const { showToast } = useToast();
    const isRTL = lang === 'ar';

    const [actualBalance, setActualBalance] = useState('0');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    if (!isOpen || !activeShift) return null;

    const handleClose = async () => {
        setLoading(true);
        try {
            const res = await shiftsApi.close(activeShift.id, {
                actualBalance: parseFloat(actualBalance),
                notes: 'Desktop POS Terminal Session End'
            });
            setReport(res);
            setTimeout(() => {
                setShift(null);
                onClose();
            }, 5000);
        } catch (err) {
            showToast(t.shift_close_failed || 'Reconciliation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-8"
            >
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={onClose} />
                
                {!report ? (
                    <motion.div 
                        initial={{ y: 40, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 40, opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-xl bg-card rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
                    >
                        <div className="p-10">
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center border border-rose-500/20 shadow-inner">
                                    <LogOut className="w-10 h-10 text-rose-500" />
                                </div>
                                <div className={isRTL ? 'text-right' : 'text-left'}>
                                    <h2 className="text-3xl font-black text-main uppercase tracking-tighter">{isRTL ? 'إغلاق الوردية' : 'End Session'}</h2>
                                    <p className="text-xs font-black text-muted uppercase tracking-[0.2em] mt-1 bg-elevated/50 px-3 py-1 rounded-full inline-block border border-border/20">Audit ID: {activeShift.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5 mb-10">
                                <div className="p-6 bg-elevated/40 rounded-[2rem] border border-border/20 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Coins size={14} className="text-amber-500" />
                                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{t.opening || 'OPENING'}</p>
                                    </div>
                                    <p className="text-2xl font-black text-main tabular-nums">{activeShift.openingBalance} <span className="text-xs opacity-40 italic">EGP</span></p>
                                </div>
                                <div className="p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <History size={14} className="text-indigo-500" />
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t.started || 'SINCE'}</p>
                                    </div>
                                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                                        {new Date(activeShift.openingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-12">
                                <label className={`block text-xs font-black text-muted uppercase tracking-[0.3em] mb-5 px-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {isRTL ? 'النقدية الموجودة بالدرج حالياً' : 'RECONCILE DRAWER CASH'}
                                </label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-card rounded-2xl flex items-center justify-center shadow-inner border border-border/20">
                                        <Calculator className="text-indigo-500 w-6 h-6" />
                                    </div>
                                    <input
                                        type="number"
                                        autoFocus
                                        value={actualBalance}
                                        onChange={(e) => setActualBalance(e.target.value)}
                                        className="w-full py-7 pl-24 pr-8 bg-slate-100 dark:bg-slate-800/50 border-none rounded-[2rem] text-4xl font-black text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all text-center tabular-nums"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={onClose} className="flex-1 py-6 bg-elevated text-main rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all hover:bg-border/20 active:scale-95 shadow-sm">
                                    {t.cancel || 'GO BACK'}
                                </button>
                                <button
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="flex-[2] py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-4 transition-all shadow-xl shadow-rose-500/30 active:scale-95 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    {loading ? (
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <ShieldAlert className="w-5 h-5 group-hover:animate-bounce" />
                                            <span>{isRTL ? 'تأكيد الإغلاق' : 'AUTHORIZE CLOSE'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="relative w-full max-w-sm bg-card rounded-[3.5rem] p-12 text-center shadow-[0_48px_128px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden"
                    >
                        {/* Final summary circle animation */}
                        <div className="relative w-32 h-32 mx-auto mb-10 flex items-center justify-center">
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                                className="absolute inset-0 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-inner"
                            />
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            >
                                <CheckCircle2 className="w-16 h-16 text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                            </motion.div>
                        </div>

                        <h3 className="text-3xl font-black text-main uppercase tracking-tighter mb-4">
                            {isRTL ? 'تم الإغلاق بنجاح' : 'Session Ended'}
                        </h3>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-10 px-8 leading-relaxed">
                            {isRTL ? 'جاري رفع التقارير للسحابة وتحديث المخزون...' : 'Cloud reporting and inventory sync in progress...'}
                        </p>

                        <div className="bg-elevated/40 p-6 rounded-[2rem] border border-border/10 mb-10 flex flex-col gap-2">
                             <span className="text-[10px] font-black text-muted uppercase tracking-widest">{isRTL ? 'النقدية النهائية' : 'DECLARED BALANCE'}</span>
                             <div className="flex items-baseline justify-center gap-2">
                                <span className="text-4xl font-black text-indigo-500 tabular-nums">{(report.actualBalance || 0).toFixed(2)}</span>
                                <span className="text-xs font-black text-muted italic">EGP</span>
                             </div>
                        </div>

                        <div className="h-1.5 bg-border/20 w-full rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5 }}
                                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                            />
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
