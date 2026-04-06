import React, { useState } from 'react';
import { ShieldCheck, X, ChevronRight, Lock, Unlock, Fingerprint } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { approvalsApi } from '../../services/api/approval';
import { translations } from '../../services/translations';
import { motion, AnimatePresence } from 'framer-motion';

interface ManagerApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApproved: () => void;
    actionName: string;
}

export const ManagerApprovalModal: React.FC<ManagerApprovalModalProps> = ({ isOpen, onClose, onApproved, actionName }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const settings = useAuthStore(state => state.settings);
    const t = translations[settings.language];
    const isRTL = settings.language === 'ar';

    if (!isOpen) return null;

    const handleDigit = (digit: string) => {
        if (pin.length < 4) {
             // Subtle haptic-like feedback could go here
             setPin(prev => prev + digit);
        }
    };

    const handleClear = () => setPin('');

    const handleSubmit = async () => {
        if (pin.length < 4) return;
        setLoading(true);
        setError('');
        try {
            const res = await approvalsApi.verifyPin({
                branchId: settings.activeBranchId || 'b1',
                pin,
                action: actionName,
            });

            if (res.approved) {
                onApproved();
                onClose();
                setPin('');
            } else {
                setError(res.error || 'Invalid Manager PIN');
                setPin('');
            }
        } catch (err) {
            setError('Verification failed');
            setPin('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center theme-modal-overlay p-0 sm:p-4">
                <div className="absolute inset-0" onClick={onClose} />
                
                <motion.div
                    initial={{ y: "100%", scale: 1 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 1 }} transition={{ type: "spring", damping: 26, stiffness: 300 }}
                    className={`theme-modal-content w-full max-w-sm relative overflow-hidden flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
                >
                    <div className="p-10 pt-16 relative">
                        {/* Close button */}
                        <div className="absolute top-6 right-8">
                            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all active:scale-90">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="text-center mb-10">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <motion.div 
                                    className="absolute inset-0 bg-amber-500/20 rounded-[2rem] blur-xl"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />
                                <div className="relative w-20 h-20 bg-amber-500 rounded-[2rem] flex items-center justify-center shadow-lg border border-amber-400">
                                    {pin.length === 4 && !loading ? <Unlock className="w-10 h-10 text-white" /> : <Lock className="w-10 h-10 text-white" />}
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-main uppercase tracking-tighter leading-tight">
                                {isRTL ? 'تأكيد الصلاحية' : 'SecurID Access'}
                            </h2>
                            <div className="mt-3 flex justify-center">
                                <span className="text-[10px] font-black text-amber-600 bg-amber-600/10 px-4 py-1.5 rounded-full border border-amber-600/20 uppercase tracking-widest">
                                    {isRTL ? 'مطلوب إذن مدير' : 'MANAGER_VOID_AUTH'}
                                </span>
                            </div>
                            <p className="mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                {actionName.replace(/_/g, ' ')}
                            </p>
                        </div>

                        {/* PIN Entry View */}
                        <div className="flex justify-center gap-5 mb-10">
                            {[0, 1, 2, 3].map(i => (
                                <motion.div 
                                    key={i} 
                                    initial={false}
                                    animate={pin.length > i ? { scale: 1.2, backgroundColor: '#f59e0b' } : { scale: 1, backgroundColor: 'rgba(148,163,184,0.2)' }}
                                    className={`w-5 h-5 rounded-full transition-all duration-200 ${pin.length > i ? 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'border-2 border-border/20'}`} 
                                />
                            ))}
                        </div>

                        {error && (
                            <motion.p 
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center mb-8 bg-rose-500/10 py-3 rounded-2xl border border-rose-500/20 px-4"
                            >
                                {error}
                            </motion.p>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button key={num} onClick={() => handleDigit(num.toString())} className="h-16 rounded-2xl bg-elevated/40 border border-border/10 text-3xl font-black text-main hover:bg-elevated hover:border-amber-500/40 hover:shadow-lg transition-all active:scale-95">{num}</button>
                            ))}
                            <button onClick={handleClear} className="h-16 rounded-2xl border border-transparent text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all active:scale-95 flex items-center justify-center gap-1">CLR</button>
                            <button onClick={() => handleDigit('0')} className="h-16 rounded-2xl bg-elevated/40 border border-border/10 text-3xl font-black text-main hover:bg-elevated hover:border-amber-500/40 hover:shadow-lg transition-all active:scale-95">0</button>
                            <button 
                                onClick={handleSubmit} 
                                disabled={pin.length < 4 || loading} 
                                className={`h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${pin.length === 4 && !loading ? 'bg-primary text-white shadow-primary/30 border border-primary hover:bg-primary-hover' : 'bg-elevated text-muted opacity-50 cursor-not-allowed'}`}
                            >
                                {loading ? <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={32} className={isRTL ? 'rotate-180' : ''} />}
                            </button>
                        </div>
                        
                        <div className="mt-10 text-center">
                            <div className="flex items-center justify-center gap-2 opacity-30">
                                <Fingerprint size={16} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{isRTL ? 'تأمين بواسطة ريستوفلو' : 'SECURED BY RESTOFLOW'}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
