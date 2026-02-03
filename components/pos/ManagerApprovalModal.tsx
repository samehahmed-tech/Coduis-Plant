import React, { useState } from 'react';
import { ShieldCheck, X, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { approvalsApi } from '../../services/api';
import { translations } from '../../services/translations';

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
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                        <ShieldCheck className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.approval_required || 'Authorization Required'}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{actionName}</p>
                </div>

                <div className="flex justify-center gap-3 mb-8">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 border-indigo-600 transition-all ${pin.length > i ? 'bg-indigo-600' : 'bg-transparent opacity-30'}`} />
                    ))}
                </div>

                {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center mb-6 animate-pulse">{error}</p>}

                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} onClick={() => handleDigit(num.toString())} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xl font-black text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-indigo-900/30 transition-all active:scale-95">{num}</button>
                    ))}
                    <button onClick={handleClear} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase text-rose-500">CLR</button>
                    <button onClick={() => handleDigit('0')} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xl font-black text-slate-700 dark:text-white">0</button>
                    <button onClick={handleSubmit} disabled={pin.length < 4 || loading} className="h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center disabled:opacity-30"><ChevronRight /></button>
                </div>

                <button onClick={onClose} className="w-full py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-colors">Cancel Access</button>
            </div>
        </div>
    );
};
