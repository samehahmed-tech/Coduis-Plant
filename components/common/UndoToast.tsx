import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Undo2, X } from 'lucide-react';

interface UndoToastProps {
    message: string;
    duration?: number;
    onUndo: () => void;
    onDismiss: () => void;
}

/**
 * Toast with undo action and countdown progress bar.
 * Auto-dismisses after duration. "Undo" cancels the action.
 *
 * Usage:
 *   {showUndo && <UndoToast message="Item deleted" duration={5000}
 *     onUndo={() => { restoreItem(); setShowUndo(false); }}
 *     onDismiss={() => setShowUndo(false)} />}
 */
const UndoToast: React.FC<UndoToastProps> = ({ message, duration = 5000, onUndo, onDismiss }) => {
    const [progress, setProgress] = useState(100);
    const startRef = useRef(Date.now());
    const rafRef = useRef<number>(0);

    const tick = useCallback(() => {
        const elapsed = Date.now() - startRef.current;
        const pct = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(pct);
        if (pct <= 0) {
            onDismiss();
        } else {
            rafRef.current = requestAnimationFrame(tick);
        }
    }, [duration, onDismiss]);

    useEffect(() => {
        startRef.current = Date.now();
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [tick]);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="relative bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl overflow-hidden border border-border/30 min-w-[300px]">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-xs font-bold">{message}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={onUndo}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">
                            <Undo2 size={12} /> Undo
                        </button>
                        <button onClick={onDismiss} className="p-1.5 text-white/40 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>
                {/* Countdown bar */}
                <div className="h-[2px] bg-elevated/40">
                    <div className="h-full bg-primary transition-none" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
};

export default UndoToast;
