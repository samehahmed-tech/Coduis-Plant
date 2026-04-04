import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectFieldProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    disabled?: boolean;
    icon?: React.FC<{ size?: number; className?: string }>;
    className?: string;
}

/**
 * Styled SelectField matching the InputField design system.
 *
 * Usage:
 *   <SelectField label="Branch" value={branch} onChange={setBranch}
 *     options={[{ value: 'main', label: 'Main Branch' }, { value: 'downtown', label: 'Downtown' }]}
 *     required />
 */
const SelectField: React.FC<SelectFieldProps> = ({
    label, value, onChange, options, placeholder, error, helperText, required, disabled, icon: Icon, className = '',
}) => {
    const hasError = !!error;

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1">
                    {label}
                    {required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${hasError ? 'text-rose-500' : 'text-muted'} pointer-events-none`} />
                )}
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className={`w-full ${Icon ? 'pl-9' : 'pl-3.5'} pr-9 py-2.5 bg-elevated/40 border rounded-xl text-xs font-bold text-main outline-none transition-all appearance-none cursor-pointer ${hasError ? 'border-rose-500/50 focus:ring-rose-500/20' : 'border-border/50 focus:border-primary/40 focus:ring-primary/10'} focus:ring-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {placeholder && <option value="" disabled>{placeholder}</option>}
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
            {error && (
                <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                    <AlertCircle size={10} /> {error}
                </p>
            )}
            {!error && helperText && (
                <p className="text-[8px] text-muted">{helperText}</p>
            )}
        </div>
    );
};

export default SelectField;
