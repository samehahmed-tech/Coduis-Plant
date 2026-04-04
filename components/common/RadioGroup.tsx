import React from 'react';

interface RadioOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
}

interface RadioGroupProps {
    options: RadioOption[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
    direction?: 'horizontal' | 'vertical';
}

/**
 * Styled radio button group.
 *
 * Usage:
 *   <RadioGroup label="Payment" value={method} onChange={setMethod}
 *     options={[{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }]} />
 */
const RadioGroup: React.FC<RadioGroupProps> = ({ options, value, onChange, label, direction = 'vertical' }) => (
    <div>
        {label && <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-2 block">{label}</label>}
        <div className={`${direction === 'horizontal' ? 'flex gap-2 flex-wrap' : 'space-y-2'}`}>
            {options.map(opt => {
                const isActive = opt.value === value;
                return (
                    <button key={opt.value} onClick={() => !opt.disabled && onChange(opt.value)} disabled={opt.disabled}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all text-left w-full ${isActive ? 'bg-primary/5 border-primary/30' : 'bg-elevated/20 border-border/30 hover:border-primary/20'} ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isActive ? 'border-primary' : 'border-slate-400'}`}>
                            {isActive && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-main block">{opt.label}</span>
                            {opt.description && <span className="text-[8px] text-muted block mt-0.5">{opt.description}</span>}
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
);

export default RadioGroup;
