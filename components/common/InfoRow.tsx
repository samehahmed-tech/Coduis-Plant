import React from 'react';

interface InfoRowProps {
    label: string;
    value: string | number | React.ReactNode;
    icon?: React.FC<{ size?: number; className?: string }>;
    muted?: boolean;
}

/**
 * Key-value display row for detail panels and sidebars.
 *
 * Usage:
 *   <InfoRow label="Order ID" value="#12345" icon={Hash} />
 *   <InfoRow label="Total" value="285 LE" />
 */
const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon: Icon, muted = false }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
        <span className="flex items-center gap-1.5 text-[9px] font-bold text-muted uppercase tracking-widest">
            {Icon && <Icon size={12} className="text-muted/60" />}
            {label}
        </span>
        <span className={`text-[10px] font-bold ${muted ? 'text-muted' : 'text-main'}`}>{value}</span>
    </div>
);

export default InfoRow;
