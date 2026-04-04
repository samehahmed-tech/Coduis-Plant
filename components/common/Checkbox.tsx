import React from 'react';
import { Check, Minus } from 'lucide-react';

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    indeterminate?: boolean;
}

/**
 * Styled checkbox with label, description, and indeterminate state.
 *
 * Usage:
 *   <Checkbox checked={agreed} onChange={setAgreed} label="I agree to terms" />
 *   <Checkbox checked={someChecked} indeterminate onChange={toggleAll} label="Select all" />
 */
const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, description, disabled, indeterminate }) => {
    const isActive = checked || indeterminate;
    return (
        <label className={`inline-flex items-start gap-2.5 cursor-pointer group ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <button
                type="button"
                role="checkbox"
                aria-checked={indeterminate ? 'mixed' : checked}
                onClick={() => !disabled && onChange(!checked)}
                className={`mt-0.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-primary border-primary' : 'border-slate-400 group-hover:border-primary/50'}`}
            >
                {checked && !indeterminate && <Check size={12} className="text-white" strokeWidth={3} />}
                {indeterminate && <Minus size={12} className="text-white" strokeWidth={3} />}
            </button>
            {(label || description) && (
                <div>
                    {label && <span className="text-[10px] font-bold text-main block">{label}</span>}
                    {description && <span className="text-[8px] text-muted block mt-0.5">{description}</span>}
                </div>
            )}
        </label>
    );
};

export default Checkbox;
