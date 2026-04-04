import React from 'react';
import { AlertCircle } from 'lucide-react';

interface TextAreaFieldProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    disabled?: boolean;
    rows?: number;
    maxLength?: number;
    className?: string;
}

/**
 * Styled TextAreaField with optional character counter.
 *
 * Usage:
 *   <TextAreaField label="Notes" value={notes} onChange={setNotes} maxLength={500} rows={4} />
 */
const TextAreaField: React.FC<TextAreaFieldProps> = ({
    label, value, onChange, placeholder, error, helperText, required, disabled, rows = 3, maxLength, className = '',
}) => {
    const hasError = !!error;
    const charCount = value.length;

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1">
                    {label}
                    {required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                maxLength={maxLength}
                className={`w-full px-3.5 py-2.5 bg-elevated/40 border rounded-xl text-xs font-bold text-main placeholder-muted/60 outline-none transition-all resize-y ${hasError ? 'border-rose-500/50 focus:ring-rose-500/20' : 'border-border/50 focus:border-primary/40 focus:ring-primary/10'} focus:ring-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <div className="flex justify-between items-center">
                <div>
                    {error && (
                        <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                            <AlertCircle size={10} /> {error}
                        </p>
                    )}
                    {!error && helperText && (
                        <p className="text-[8px] text-muted">{helperText}</p>
                    )}
                </div>
                {maxLength && (
                    <span className={`text-[8px] font-bold ${charCount >= maxLength ? 'text-rose-500' : 'text-muted'}`}>
                        {charCount}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    );
};

export default TextAreaField;
