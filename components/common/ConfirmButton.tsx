import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmButtonProps {
    children: React.ReactNode;
    onConfirm: () => void;
    confirmText?: string;
    variant?: 'danger' | 'warning';
    disabled?: boolean;
    icon?: React.FC<{ size?: number; className?: string }>;
}

const VARIANTS = {
    danger: { idle: 'bg-rose-500/5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10', confirm: 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' },
    warning: { idle: 'bg-amber-500/5 text-amber-500 border-amber-500/20 hover:bg-amber-500/10', confirm: 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' },
};

/**
 * Button that requires double-click to confirm a destructive action.
 * First click shows "Are you sure?", second click executes.
 *
 * Usage:
 *   <ConfirmButton onConfirm={deleteItem} variant="danger" icon={Trash2}>Delete</ConfirmButton>
 */
const ConfirmButton: React.FC<ConfirmButtonProps> = ({ children, onConfirm, confirmText = 'Confirm?', variant = 'danger', disabled, icon: Icon }) => {
    const [confirming, setConfirming] = useState(false);
    const style = VARIANTS[variant];

    const handleClick = () => {
        if (confirming) {
            onConfirm();
            setConfirming(false);
        } else {
            setConfirming(true);
            setTimeout(() => setConfirming(false), 3000); // Auto-reset
        }
    };

    return (
        <button onClick={handleClick} disabled={disabled}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${confirming ? style.confirm : style.idle} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {confirming ? <AlertTriangle size={12} /> : Icon && <Icon size={12} />}
            {confirming ? confirmText : children}
        </button>
    );
};

export default ConfirmButton;
