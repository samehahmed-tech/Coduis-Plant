import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

type BannerVariant = 'info' | 'warning' | 'danger' | 'promo';

interface AnnouncementBarProps {
    children: React.ReactNode;
    variant?: BannerVariant;
    dismissible?: boolean;
    onDismiss?: () => void;
    icon?: React.FC<{ size?: number; className?: string }>;
}

const VARIANTS: Record<BannerVariant, { bg: string; text: string; DefaultIcon: typeof Info }> = {
    info: { bg: 'bg-primary/10 border-primary/20', text: 'text-primary', DefaultIcon: Info },
    warning: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', DefaultIcon: AlertTriangle },
    danger: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', DefaultIcon: AlertTriangle },
    promo: { bg: 'bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', DefaultIcon: Info },
};

/**
 * Top-of-page announcement or alert bar.
 *
 * Usage:
 *   <AnnouncementBar variant="warning" dismissible onDismiss={close}>System maintenance tonight at 2 AM</AnnouncementBar>
 *   <AnnouncementBar variant="promo">🎉 New feature: Smart Inventory is live!</AnnouncementBar>
 */
const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ children, variant = 'info', dismissible, onDismiss, icon: CustomIcon }) => {
    const { bg, text, DefaultIcon } = VARIANTS[variant];
    const Icon = CustomIcon || DefaultIcon;

    return (
        <div className={`w-full px-4 py-2.5 ${bg} border-b flex items-center justify-center gap-2 ${text}`}>
            <Icon size={14} className="shrink-0" />
            <span className="text-[10px] font-bold">{children}</span>
            {dismissible && (
                <button onClick={onDismiss} className="ml-2 p-1 hover:bg-black/5 rounded-lg transition-colors shrink-0">
                    <X size={12} />
                </button>
            )}
        </div>
    );
};

export default AnnouncementBar;
