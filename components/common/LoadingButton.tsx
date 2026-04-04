import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface LoadingButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: React.FC<{ size?: number; className?: string }>;
    fullWidth?: boolean;
    type?: 'button' | 'submit';
}

const VARIANTS: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm shadow-primary/20',
    secondary: 'bg-elevated border border-border text-main hover:bg-card',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/20',
    ghost: 'text-muted hover:text-main hover:bg-elevated/50',
};

const SIZES: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-[9px] gap-1.5 rounded-lg',
    md: 'px-4 py-2.5 text-[10px] gap-2 rounded-xl',
    lg: 'px-6 py-3 text-xs gap-2 rounded-2xl',
};

/**
 * Button with loading spinner, multiple variants and sizes.
 *
 * Usage:
 *   <LoadingButton loading={saving} onClick={save} variant="primary" icon={Save}>Save</LoadingButton>
 *   <LoadingButton loading={deleting} variant="danger">Delete</LoadingButton>
 */
const LoadingButton: React.FC<LoadingButtonProps> = ({
    children, onClick, loading = false, disabled = false, variant = 'primary',
    size = 'md', icon: Icon, fullWidth = false, type = 'button',
}) => {
    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={`inline-flex items-center justify-center font-black uppercase tracking-widest transition-all ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
        >
            {loading ? (
                <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />
            ) : Icon ? (
                <Icon size={size === 'sm' ? 12 : 14} />
            ) : null}
            {children}
        </button>
    );
};

export default LoadingButton;
