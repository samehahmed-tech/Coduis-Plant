import React from 'react';

interface ProgressBarProps {
    value: number;      // 0-100
    max?: number;
    color?: 'primary' | 'emerald' | 'amber' | 'rose' | 'indigo';
    size?: 'sm' | 'md';
    label?: string;
    showPercent?: boolean;
    animated?: boolean;
}

const COLOR_MAP: Record<string, string> = {
    primary: 'bg-primary',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
};

const GLOW_MAP: Record<string, string> = {
    primary: 'shadow-primary/30',
    emerald: 'shadow-emerald-500/30',
    amber: 'shadow-amber-500/30',
    rose: 'shadow-rose-500/30',
    indigo: 'shadow-indigo-500/30',
};

/**
 * Reusable ProgressBar.
 *
 * Usage:
 *   <ProgressBar value={75} color="emerald" label="Completion" showPercent />
 *   <ProgressBar value={30} max={50} size="sm" animated />
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
    value, max = 100, color = 'primary', size = 'md', label, showPercent = false, animated = false,
}) => {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    const barColor = COLOR_MAP[color] || COLOR_MAP.primary;
    const glow = GLOW_MAP[color] || GLOW_MAP.primary;
    const heightClass = size === 'sm' ? 'h-1.5' : 'h-2.5';

    return (
        <div>
            {(label || showPercent) && (
                <div className="flex justify-between items-center mb-1.5">
                    {label && <span className="text-[9px] font-black text-muted uppercase tracking-widest">{label}</span>}
                    {showPercent && <span className="text-[9px] font-black text-main">{percent.toFixed(0)}%</span>}
                </div>
            )}
            <div className={`w-full ${heightClass} bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden`}>
                <div
                    className={`${heightClass} ${barColor} rounded-full transition-all duration-700 ease-out shadow-sm ${glow} ${animated ? 'animate-pulse' : ''}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
