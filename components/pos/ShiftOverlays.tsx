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
                
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl opacity-50" />

                <motion.div 
                    initial={{ y: 40, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    className="relative w-full max-w-4xl bg-white dark:bg-slate-950 shadow-[0_32px_128px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col md:flex-row mb-10 md:mb-0 rounded-[3rem] min-h-[500px]"
                >
                    {/* Left Side: Branding & Info */}
                    <div className="md:w-5/12 bg-primary p-10 flex flex-col justify-between relative overflow-hidden shrink-0">
                        {/* Subtle Background Pattern */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 opacity-30" />
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full -ml-20 -mb-20 opacity-20" />
                        
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-white/20 backdrop-blur-md">
                                <Lock className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-4xl font-black text-white leading-tight mb-4 uppercase tracking-tighter">
                                {isRTL ? 'وردية جديدة' : 'Safe Lock'}
                            </h2>
                            <p className="text-white/80 text-base font-medium leading-relaxed max-w-[90%]">
                                {t.open_shift_message || 'Initialize the POS system by declaring your starting cash drawer balance.'}
                            </p>
                        </div>

                        <div className="relative z-10 space-y-4 mt-8 md:mt-12">
                            <div className="flex items-center gap-4 p-5 bg-black/20 rounded-2xl border border-white/10 shadow-sm backdrop-blur-sm">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em]">{isRTL ? 'الموظف' : 'OPERATOR'}</p>
                                    <p className="text-base font-black text-white uppercase truncate">{user?.username || 'GUEST MANAGER'}</p>
                                </div>
                            </div>
                            <div className="pt-5 border-t border-white/10">
                                <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">RestoFlow Production v1.2</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Input & Actions */}
                    <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800">
                        <div className="mb-10 text-center md:text-left">
                            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6">
                                {isRTL ? 'رصيد الافتتاح' : 'DECLARE STARTING CASH'}
                            </h3>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 dark:text-slate-600">EGP</span>
                                <input
                                    type="number"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                    className="w-full py-8 pl-24 pr-8 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-3xl text-5xl font-black text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all text-left tabular-nums outline-none shadow-inner"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-3 gap-4 mb-10">
                            {[100, 200, 500].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => addAmount(amt)}
                                    className="py-4 px-2 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-lg font-black text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all active:scale-95 shadow-sm"
                                >
                                    +{amt}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleOpenShift}
                            disabled={loading || parseFloat(openingBalance) < 0}
                            className="w-full py-6 mt-auto bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-[0_8px_30px_rgba(var(--primary-rgb),0.3)]"
                        >
                            {loading ? (
                                <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
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

