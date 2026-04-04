import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, UserPlus, Package, DollarSign, AlertTriangle,
    Clock, ArrowRight, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface Activity {
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    time: string;
    icon: React.FC<{ size?: number; className?: string }>;
    color: string;
    bg: string;
}

const ACTIVITY_ICONS: Record<string, { icon: React.FC<{ size?: number; className?: string }>; color: string; bg: string }> = {
    order: { icon: ShoppingBag, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    customer: { icon: UserPlus, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    inventory: { icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    payment: { icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    alert: { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    default: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

const MOCK_ACTIVITIES: Activity[] = [
    { id: '1', type: 'order', title: 'New order #1847', subtitle: '3 items · 285 LE', time: '2m ago', ...ACTIVITY_ICONS.order },
    { id: '2', type: 'payment', title: 'Payment received', subtitle: 'Order #1846 · Cash', time: '5m ago', ...ACTIVITY_ICONS.payment },
    { id: '3', type: 'customer', title: 'New customer registered', subtitle: 'Ahmed Hassan', time: '12m ago', ...ACTIVITY_ICONS.customer },
    { id: '4', type: 'inventory', title: 'Low stock alert', subtitle: 'Chicken Breast — 2kg left', time: '18m ago', ...ACTIVITY_ICONS.alert },
    { id: '5', type: 'order', title: 'Order completed #1845', subtitle: '5 items · 420 LE', time: '25m ago', ...ACTIVITY_ICONS.order },
    { id: '6', type: 'payment', title: 'Refund processed', subtitle: 'Order #1840 · 85 LE', time: '32m ago', ...ACTIVITY_ICONS.payment },
];

const ActivityFeed: React.FC = () => {
    const { settings } = useAuthStore();
    const lang = settings.language || 'en';
    const [activities] = useState<Activity[]>(MOCK_ACTIVITIES);

    return (
        <div className="relative overflow-hidden bg-card/60 backdrop-blur-xl rounded-[1.8rem] border border-border/20 shadow-xl group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="p-5 border-b border-border/30 flex items-center justify-between relative z-10">
                <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock size={14} className="text-primary" />
                    {lang === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
                </h3>
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </div>
            </div>
            <div className="divide-y divide-border/20 relative z-10">
                {activities.map(activity => (
                    <div key={activity.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-elevated/20 transition-all group/item">
                        <div className={`w-8 h-8 rounded-xl ${activity.bg} flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform`}>
                            <activity.icon size={14} className={activity.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-main truncate">{activity.title}</p>
                            {activity.subtitle && <p className="text-[9px] text-muted truncate">{activity.subtitle}</p>}
                        </div>
                        <span className="text-[8px] font-bold text-muted/50 uppercase tracking-wider shrink-0">{activity.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityFeed;
