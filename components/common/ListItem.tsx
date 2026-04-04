import React from 'react';

interface ListItemProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    icon?: React.FC<{ size?: number; className?: string }>;
    avatar?: string;
    trailing?: React.ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

/**
 * Consistent list item for sidebars, dropdown lists, and detail panels.
 *
 * Usage:
 *   <ListItem title="John Doe" subtitle="Manager" icon={User} trailing={<Badge>VIP</Badge>} onClick={open} />
 */
const ListItem: React.FC<ListItemProps> = ({ children, title, subtitle, icon: Icon, avatar, trailing, onClick, selected }) => (
    <div onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${onClick ? 'cursor-pointer hover:bg-elevated' : ''} ${selected ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'}`}>
        {Icon && (
            <div className="w-9 h-9 rounded-xl bg-elevated/50 border border-border/30 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-muted" />
            </div>
        )}
        {avatar && (
            <img src={avatar} alt={title} className="w-9 h-9 rounded-xl object-cover shrink-0" />
        )}
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-main truncate">{title}</p>
            {subtitle && <p className="text-[8px] text-muted truncate">{subtitle}</p>}
            {children}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
);

export default ListItem;
