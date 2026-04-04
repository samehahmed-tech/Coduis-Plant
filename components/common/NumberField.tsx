import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberFieldProps {
    label?: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    error?: string;
    disabled?: boolean;
    suffix?: string;
    className?: string;
}

/**
 * Numeric input with +/- stepper buttons.
 *
 * Usage:
 *   <NumberField label="Quantity" value={qty} onChange={setQty} min={1} max={100} suffix="pcs" />
 */
const NumberField: React.FC<NumberFieldProps> = ({
    label, value, onChange, min = 0, max = Infinity, step = 1, error, disabled, suffix, className = '',
}) => {
    const adjust = (delta: number) => {
        const next = Math.round((value + delta) * 100) / 100;
        if (next >= min && next <= max) onChange(next);
    };

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">{label}</label>}
            <div className="flex items-center gap-0">
                <button onClick={() => adjust(-step)} disabled={disabled || value <= min}
                    className="w-9 h-9 flex items-center justify-center bg-elevated/40 border border-border/50 rounded-l-xl text-muted hover:text-primary hover:bg-elevated transition-all disabled:opacity-40">
                    <Minus size={14} />
                </button>
                <div className="flex items-center gap-1 px-3 h-9 border-y border-border/50 bg-elevated/20 min-w-[60px] justify-center">
                    <span className="text-sm font-black text-main tabular-nums">{value}</span>
                    {suffix && <span className="text-[8px] text-muted font-bold">{suffix}</span>}
                </div>
                <button onClick={() => adjust(step)} disabled={disabled || value >= max}
                    className="w-9 h-9 flex items-center justify-center bg-elevated/40 border border-border/50 rounded-r-xl text-muted hover:text-primary hover:bg-elevated transition-all disabled:opacity-40">
                    <Plus size={14} />
                </button>
            </div>
            {error && <p className="text-[9px] text-rose-500 font-bold">{error}</p>}
        </div>
    );
};

export default NumberField;
