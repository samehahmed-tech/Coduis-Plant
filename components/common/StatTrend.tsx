import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatTrendProps {
    value: number;
    suffix?: string;
    size?: 'sm' | 'md';
    inverted?: boolean;
}

/**
 * Trend indicator showing percentage change with color-coded arrow.
 *
 * Usage:
 *   <StatTrend value={12.5} suffix="%" />
 *   <StatTrend value={-3.2} suffix="%" />
 *   <StatTrend value={0} />
 *   <StatTrend value={5} inverted />  // inverted: positive is bad (e.g., costs)
 */
const StatTrend: React.FC<StatTrendProps> = ({ value, suffix = '%', size = 'sm', inverted = false }) => {
    const isUp = value > 0;
    const isDown = value < 0;
    const isNeutral = value === 0;

    const isPositive = inverted ? isDown : isUp;
    const isNegative = inverted ? isUp : isDown;

    const color = isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-muted';
    const bg = isPositive ? 'bg-emerald-500/10' : isNegative ? 'bg-rose-500/10' : 'bg-slate-500/10';
    const iconSize = size === 'sm' ? 10 : 12;
    const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

    return (
        <span className={`inline-flex items-center gap-0.5 ${bg} ${color} px-1.5 py-0.5 rounded-md ${textSize} font-black`}>
            {isUp && <TrendingUp size={iconSize} />}
            {isDown && <TrendingDown size={iconSize} />}
            {isNeutral && <Minus size={iconSize} />}
            {isUp ? '+' : ''}{value}{suffix}
        </span>
    );
};

export default StatTrend;
