import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    hideClose?: boolean;
}

const SIZE_MAP = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

/**
 * Clean modal dialog wrapper.
 *
 * Usage:
 *   <Modal isOpen={show} onClose={() => setShow(false)} title="New Order" size="lg">
 *     <OrderForm />
 *   </Modal>
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, subtitle, size = 'md', hideClose = false }) => {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />
            <div className={`relative w-full ${SIZE_MAP[size]} bg-card/95 backdrop-blur-2xl rounded-[1.8rem] border border-white/5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] overflow-hidden zenith-transition`}>
                {(title || !hideClose) && (
                    <div className="flex items-center justify-between p-5 border-b border-border/50">
                        <div>
                            {title && <h2 className="text-sm font-black text-main">{title}</h2>}
                            {subtitle && <p className="text-[9px] font-bold text-muted mt-0.5">{subtitle}</p>}
                        </div>
                        {!hideClose && (
                            <button onClick={onClose} className="p-2 text-muted hover:text-main rounded-xl hover:bg-elevated transition-colors">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}
                <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
