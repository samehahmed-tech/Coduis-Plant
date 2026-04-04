import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounce?: number;
    autoFocus?: boolean;
    className?: string;
}

/**
 * Styled search input with built-in debounce and clear button.
 *
 * Usage:
 *   <SearchInput onChange={setSearch} placeholder="Search orders..." debounce={300} />
 */
const SearchInput: React.FC<SearchInputProps> = ({
    value: externalValue, onChange, placeholder = 'Search...', debounce = 300, autoFocus = false, className = '',
}) => {
    const [localValue, setLocalValue] = useState(externalValue || '');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (externalValue !== undefined) setLocalValue(externalValue);
    }, [externalValue]);

    const handleChange = (val: string) => {
        setLocalValue(val);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onChange(val), debounce);
    };

    const handleClear = () => {
        setLocalValue('');
        onChange('');
        inputRef.current?.focus();
    };

    return (
        <div className={`relative group ${className}`}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={e => handleChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="w-full pl-9 pr-8 py-2.5 bg-elevated/40 border border-border/50 focus:border-primary/40 rounded-xl text-xs font-bold text-main placeholder-muted outline-none transition-all focus:ring-2 focus:ring-primary/10"
            />
            {localValue && (
                <button onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-main transition-colors">
                    <X size={12} />
                </button>
            )}
        </div>
    );
};

export default SearchInput;
