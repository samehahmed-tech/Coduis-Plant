import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

const ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
};

const STYLES: Record<ToastType, { bg: string; border: string; iconColor: string; progressClass: string }> = {
    success: { bg: 'bg-card', border: 'border-emerald-500/30', iconColor: 'text-emerald-500', progressClass: 'success' },
    error: { bg: 'bg-card', border: 'border-rose-500/30', iconColor: 'text-rose-500', progressClass: 'danger' },
    warning: { bg: 'bg-card', border: 'border-amber-500/30', iconColor: 'text-amber-500', progressClass: 'warning' },
    info: { bg: 'bg-card', border: 'border-primary/30', iconColor: 'text-primary', progressClass: '' },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none" style={{ maxWidth: '360px' }}>
                {toasts.map((toast, idx) => {
                    const Icon = ICONS[toast.type];
                    const style = STYLES[toast.type];
                    const durationSecs = `${(toast.duration || 4000) / 1000}s`;
                    return (
                        <div
                            key={toast.id}
                            className={`
                                relative overflow-hidden
                                ${style.bg} border ${style.border}
                                text-main px-4 py-3.5 rounded-2xl
                                shadow-xl shadow-black/10
                                flex items-center gap-3
                                pointer-events-auto
                                animate-in slide-in-from-right-5 fade-in duration-300
                            `}
                            style={{ animationDelay: `${idx * 40}ms` }}
                        >
                            {/* Icon */}
                            <div className={`${style.iconColor} shrink-0`}>
                                <Icon size={18} />
                            </div>
                            {/* Message */}
                            <p className="text-sm font-semibold flex-1 leading-snug">{toast.message}</p>
                            {/* Close */}
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="icon-btn shrink-0 !w-7 !h-7"
                            >
                                <X size={13} />
                            </button>
                            {/* Progress bar */}
                            <div
                                className={`toast-progress ${style.progressClass}`}
                                style={{ '--toast-duration': durationSecs } as React.CSSProperties}
                            />
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
