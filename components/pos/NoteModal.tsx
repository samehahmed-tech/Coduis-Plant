import React from 'react';

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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-4 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-sm font-black uppercase tracking-widest mb-3 text-slate-800 dark:text-white">
                    {t.item_notes}
                </h3>
                <textarea
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold min-h-[100px] outline-none focus:ring-2 ring-indigo-500 text-slate-800 dark:text-white"
                    placeholder={lang === 'ar' ? 'نموذج: بدون بصل، صوص إضافي...' : "e.g. No Onions, Extra Sauce..."}
                    value={note}
                    onChange={e => onNoteChange(e.target.value)}
                    autoFocus
                />
                <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={onClose} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs uppercase text-slate-600 dark:text-slate-400">
                        {t.cancel}
                    </button>
                    <button onClick={onSave} className="p-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase">
                        {t.save_note}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoteModal;
