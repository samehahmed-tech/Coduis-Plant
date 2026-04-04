import React from 'react';

interface ButtonGroupItem {
    key: string;
    label: string;
    icon?: React.FC<{ size?: number; className?: string }>;
    disabled?: boolean;
}

interface ButtonGroupProps {
    items: ButtonGroupItem[];
    activeKey: string;
    onChange: (key: string) => void;
    size?: 'sm' | 'md';
}

/**
 * Segmented button group for toggling between options.
 *
 * Usage:
 *   <ButtonGroup items={[
 *     { key: 'day', label: 'Day' },
 *     { key: 'week', label: 'Week' },
 *     { key: 'month', label: 'Month' },
 *   ]} activeKey={range} onChange={setRange} />
 */
const ButtonGroup: React.FC<ButtonGroupProps> = ({ items, activeKey, onChange, size = 'md' }) => {
    const sizeClass = size === 'sm' ? 'text-[7px] px-2.5 py-1.5 gap-1' : 'text-[8px] px-3.5 py-2 gap-1.5';

    return (
        <div className="inline-flex rounded-xl border border-border/50 overflow-hidden bg-elevated/30">
            {items.map((item, i) => {
                const isActive = item.key === activeKey;
                const Icon = item.icon;
                return (
                    <button
                        key={item.key}
                        onClick={() => !item.disabled && onChange(item.key)}
                        disabled={item.disabled}
                        className={`flex items-center ${sizeClass} font-black uppercase tracking-widest transition-all ${isActive ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-main hover:bg-elevated/50'} ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''} ${i > 0 ? 'border-l border-border/30' : ''}`}
                    >
                        {Icon && <Icon size={size === 'sm' ? 10 : 12} />}
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
};

export default ButtonGroup;
