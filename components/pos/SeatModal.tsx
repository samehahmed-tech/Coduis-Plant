import React, { useEffect, useRef } from 'react';
import { X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SeatModalProps {
    isOpen: boolean;
    onClose: () => void;
    seatNumber: number | undefined;
    onSeatChange: (val: number | undefined) => void;
    onSave: () => void;
    lang: 'en' | 'ar';
}

const SeatModal: React.FC<SeatModalProps> = ({ isOpen, onClose, seatNumber, onSeatChange, onSave, lang }) => {
    const isRTL = lang === 'ar';
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md sm:p-4">
                <div className="absolute inset-0" onClick={onClose} />
                <motion.div
                    initial={{ y: "100%", scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={`relative w-full max-w-xs bg-card sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl border border-border/20 overflow-hidden flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
                >
                    {/* Header */}
                    <div className="relative shrink-0 p-5 border-b border-border/10 bg-elevated/40 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-inner">
                                <User className="text-indigo-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-main uppercase tracking-widest leading-tight">
                                    {isRTL ? 'تحديد المقعد' : 'Assign Seat'}
                                </h3>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-muted hover:text-main hover:bg-elevated rounded-xl transition-all border border-transparent hover:border-border/20 active:scale-95">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 bg-card">
                        <div className="bg-elevated/40 border border-border/20 rounded-2xl shadow-inner p-2 flex items-center h-20">
                            <input
                                ref={inputRef}
                                type="number"
                                className="w-full h-full bg-transparent text-main px-4 text-center font-black text-4xl outline-none transition-all placeholder:text-muted/30"
                                placeholder="1"
                                value={seatNumber || ''}
                                onChange={(e) => {
                                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                                    onSeatChange(val);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onSave();
                                    if (e.key === 'Escape') onClose();
                                }}
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 p-5 border-t border-border/10 bg-elevated/40 flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl border border-border/20 text-main font-black uppercase tracking-widest text-xs hover:bg-elevated bg-card shadow-sm active:scale-95 transition-all"
                        >
                            {isRTL ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                            onClick={onSave}
                            className="flex-1 h-14 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-600 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 border border-indigo-400"
                        >
                            {isRTL ? 'حفظ' : 'Save'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SeatModal;
