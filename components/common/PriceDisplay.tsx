import React from 'react';

interface PriceDisplayProps {
    amount: number;
    currency?: string;
    size?: 'sm' | 'md' | 'lg';
    strikethrough?: number;
    className?: string;
}

/**
 * Formatted price display with optional original price strikethrough.
 *
 * Usage:
 *   <PriceDisplay amount={285} currency="LE" />
 *   <PriceDisplay amount={199} strikethrough={299} currency="LE" size="lg" />
 */
const PriceDisplay: React.FC<PriceDisplayProps> = ({ amount, currency = 'LE', size = 'md', strikethrough, className = '' }) => {
    const sizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' };
    const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    return (
        <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
            {strikethrough && (
                <span className="text-[10px] text-muted line-through font-bold">
                    {strikethrough.toLocaleString()} {currency}
                </span>
            )}
            <span className={`${sizes[size]} font-black text-main tabular-nums`}>{formatted}</span>
            <span className="text-[8px] font-bold text-muted uppercase">{currency}</span>
        </span>
    );
};

export default PriceDisplay;
