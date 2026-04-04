import React from 'react';

interface CountBadgeProps {
    count: number;
    max?: number;
    color?: 'primary' | 'rose' | 'amber' | 'emerald';
    size?: 'sm' | 'md';
    pulse?: boolean;
}

const COLOR_MAP: Record<string, string> = {
    primary: 'bg-primary text-white',
    rose: 'bg-rose-500 text-white',
    amber: 'bg-amber-500 text-white',
    emerald: 'bg-emerald-500 text-white',
};

/**
 * Numeric count badge for notifications, cart items, etc.
 *
 * Usage:
 *   <CountBadge count={3} color="rose" pulse />
 *   <CountBadge count={99} max={9} />  // displays "9+"
 */
const CountBadge: React.FC<CountBadgeProps> = ({ count, max, color = 'rose', size = 'md', pulse = false }) => {
    if (count <= 0) return null;

    const display = max && count > max ? `${max}+` : String(count);
    const bg = COLOR_MAP[color] || COLOR_MAP.rose;
    const sizeClass = size === 'sm' ? 'min-w-[16px] h-4 text-[7px] px-1' : 'min-w-[20px] h-5 text-[8px] px-1.5';

    return (
        <span className={`inline-flex items-center justify-center ${sizeClass} ${bg} font-black rounded-full shadow-sm ${pulse ? 'animate-pulse' : ''}`}>
            {display}
        </span>
    );
};

export default CountBadge;
