import React from 'react';

type DotColor = 'emerald' | 'rose' | 'amber' | 'blue' | 'indigo' | 'slate' | 'primary';

interface ColorDotProps {
    color?: DotColor;
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
    label?: string;
}

const COLORS: Record<DotColor, string> = {
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    slate: 'bg-slate-400',
    primary: 'bg-primary',
};

const SIZES: Record<string, string> = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
};

/**
 * Small colored dot indicator.
 *
 * Usage:
 *   <ColorDot color="emerald" label="Online" />
 *   <ColorDot color="rose" pulse />
 */
const ColorDot: React.FC<ColorDotProps> = ({ color = 'slate', size = 'md', pulse = false, label }) => (
    <span className="inline-flex items-center gap-1.5">
        <span className="relative flex">
            {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${COLORS[color]} opacity-75`} />}
            <span className={`relative inline-flex rounded-full ${SIZES[size]} ${COLORS[color]}`} />
        </span>
        {label && <span className="text-[9px] font-bold text-muted">{label}</span>}
    </span>
);

export default ColorDot;
