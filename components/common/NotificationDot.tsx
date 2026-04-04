import React from 'react';

type DotVariant = 'primary' | 'danger' | 'warning' | 'success';

interface NotificationDotProps {
    variant?: DotVariant;
    show?: boolean;
    count?: number;
    children: React.ReactNode;
}

const COLORS: Record<DotVariant, string> = {
    primary: 'bg-primary',
    danger: 'bg-rose-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
};

/**
 * Wraps any element with a pinging notification dot.
 *
 * Usage:
 *   <NotificationDot show={hasNew} variant="danger" count={3}>
 *     <Bell size={16} />
 *   </NotificationDot>
 */
const NotificationDot: React.FC<NotificationDotProps> = ({ variant = 'danger', show = true, count, children }) => {
    if (!show) return <>{children}</>;
    return (
        <span className="relative inline-flex">
            {children}
            <span className="absolute -top-1 -right-1 flex items-center justify-center">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${COLORS[variant]} opacity-75`} />
                <span className={`relative flex items-center justify-center rounded-full ${COLORS[variant]} ${count ? 'min-w-[14px] h-[14px] px-0.5' : 'w-2 h-2'}`}>
                    {count && <span className="text-[7px] font-black text-white leading-none">{count > 9 ? '9+' : count}</span>}
                </span>
            </span>
        </span>
    );
};

export default NotificationDot;
