import React, { useState } from 'react';
import { ShieldCheck, X, ChevronRight } from 'lucide-react';
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
        if (pin.length < 4) setPin(prev => prev + digit);
    };

    const handleClear = () => setPin('');

    const handleSubmit = async () => {
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md sm:p-4">
                <div className="absolute inset-0" onClick={onClose} />
                <motion.div
                    initial={{ y: "100%", scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={`relative w-full max-w-sm bg-card sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl border border-border/20 overflow-hidden flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
                >
                    <div className="p-8">
                        <div className="absolute top-4 right-4">
                            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-muted hover:text-main hover:bg-elevated rounded-xl transition-all border border-transparent hover:border-border/20 active:scale-95">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-inner">
                                <ShieldCheck className="w-8 h-8 text-amber-500" />
                            </div>
                            <h2 className="text-xl font-black text-main uppercase tracking-tight leading-tight">{t.approval_required || 'Authorization Required'}</h2>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2 px-4 py-1.5 bg-amber-500/10 rounded-full inline-block border border-amber-500/20">{actionName}</p>
                        </div>

                        <div className="flex justify-center gap-4 mb-8">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-amber-500 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-elevated border-2 border-border/40 scale-100'}`} />
                            ))}
                        </div>

                        {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center mb-6 animate-pulse bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">{error}</p>}

                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button key={num} onClick={() => handleDigit(num.toString())} className="h-16 rounded-2xl bg-elevated/40 border border-border/20 text-2xl font-black text-main hover:bg-elevated hover:border-amber-500/30 transition-all active:scale-95 shadow-sm">{num}</button>
                            ))}
                            <button onClick={handleClear} className="h-16 rounded-2xl bg-elevated/40 border border-border/20 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all active:scale-95 shadow-sm">CLR</button>
                            <button onClick={() => handleDigit('0')} className="h-16 rounded-2xl bg-elevated/40 border border-border/20 text-2xl font-black text-main hover:bg-elevated hover:border-amber-500/30 transition-all active:scale-95 shadow-sm">0</button>
                            <button onClick={handleSubmit} disabled={pin.length < 4 || loading} className={`h-16 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${pin.length === 4 && !loading ? 'bg-amber-500 text-white shadow-amber-500/30 border border-amber-400 hover:bg-amber-600' : 'bg-elevated border border-border/20 text-muted opacity-50 cursor-not-allowed'}`}>
                                <ChevronRight size={28} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
