import React, { useEffect, useRef } from 'react';
import { X, User } from 'lucide-react';

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className={`relative w-full max-w-sm bg-app rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 ${isRTL ? 'text-right' : 'text-left'}`}>
                {/* Header */}
                <div className="relative shrink-0 p-4 border-b border-border/30 bg-elevated/40 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <User className="text-indigo-500" size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-main uppercase tracking-widest leading-tight">
                            {isRTL ? 'تحديد رقم المقعد' : 'Assign Seat Number'}
                        </h3>
                        <p className="text-[11px] font-semibold text-muted uppercase mt-0.5 tracking-wider">
                            {isRTL ? 'كرسي المطعم للطلبات المتقدمة' : 'Fine-dining seat assignment'}
                        </p>
                    </div>
                    <button onClick={onClose} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-2 text-muted hover:text-main hover:bg-elevated rounded-lg transition-colors`}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex-1">
                    <input
                        ref={inputRef}
                        type="number"
                        className="w-full h-12 bg-elevated/50 border border-border/50 text-main rounded-xl px-4 text-center font-black text-lg focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-muted/40"
                        placeholder={isRTL ? "مثال: 1" : "e.g., 1"}
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

                {/* Footer */}
                <div className="shrink-0 p-4 border-t border-border/30 bg-elevated/20 flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl border border-border/50 text-muted font-black uppercase tracking-widest text-xs hover:bg-elevated hover:text-main transition-colors"
                    >
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 h-12 rounded-xl bg-indigo-500 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-600 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {isRTL ? 'حفظ' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeatModal;
