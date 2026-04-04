import React, { useEffect, useRef } from 'react';
import { X, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: string;
    onNoteChange: (note: string) => void;
    onSave: () => void;
    lang: 'en' | 'ar';
    t: any;
}

const NoteModal: React.FC<NoteModalProps> = ({
    isOpen,
    onClose,
    note,
    onNoteChange,
    onSave,
    lang,
    t,
}) => {
    const isRTL = lang === 'ar';
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
                <div className="absolute inset-0" onClick={onClose} />
                <motion.div
                    initial={{ y: "100%", scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={`relative w-full max-w-sm bg-card sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col border border-border/20 ${isRTL ? 'text-right' : 'text-left'}`}
                >
                    <div className="p-5 border-b border-border/10 bg-elevated/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                                <Pencil size={18} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-main">
                                {t.item_notes}
                            </h3>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-elevated/50 hover:bg-elevated text-muted hover:text-main transition-colors border border-transparent hover:border-border/20">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 bg-card">
                        <textarea
                            ref={inputRef}
                            className="w-full p-4 bg-elevated/40 border border-border/20 rounded-2xl text-sm font-bold min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 text-main transition-all placeholder:text-muted/50 resize-none shadow-inner"
                            placeholder={isRTL ? 'نموذج: بدون بصل، صوص إضافي...' : "e.g. No Onions, Extra Sauce..."}
                            value={note}
                            onChange={e => onNoteChange(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && e.ctrlKey) onSave();
                            }}
                        />
                    </div>

                    <div className="p-5 border-t border-border/10 bg-elevated/40 flex gap-3">
                        <button onClick={onClose} className="flex-1 h-14 rounded-2xl bg-card border border-border/20 font-black text-xs uppercase tracking-widest text-main hover:bg-elevated transition-colors active:scale-95 shadow-sm">
                            {t.cancel}
                        </button>
                        <button onClick={onSave} className="flex-1 h-14 rounded-2xl bg-indigo-500 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 active:scale-[0.98] border border-indigo-400">
                            {t.save_note}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NoteModal;
