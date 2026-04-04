import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bell, X, CheckCircle2, AlertTriangle, Package, DollarSign,
    Clock, ShoppingCart, Users, Trash2, Volume2, VolumeX
} from 'lucide-react';
import { socketService } from '../../services/socketService';
import { useAuthStore } from '../../stores/useAuthStore';

type Notification = {
    id: string;
    type: 'ORDER' | 'STOCK' | 'REFUND' | 'APPROVAL' | 'ALERT' | 'INFO';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
};

const TYPE_META: Record<string, { icon: any; color: string; bg: string }> = {
    ORDER: { icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    STOCK: { icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    REFUND: { icon: DollarSign, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    APPROVAL: { icon: Clock, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    ALERT: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    INFO: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

const NotificationBell: React.FC = () => {
    const { settings } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const panelRef = useRef<HTMLDivElement>(null);

    const addNotification = useCallback((type: Notification['type'], title: string, message: string) => {
        const notif: Notification = {
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            type, title, message,
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [notif, ...prev].slice(0, 50));

        // Play sound
        if (soundEnabled) {
            try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain).connect(ctx.destination);
                osc.frequency.value = 800;
                gain.gain.value = 0.1;
                osc.start(); osc.stop(ctx.currentTime + 0.1);
            } catch { }
        }
    }, [soundEnabled]);

    useEffect(() => {
        const handlers: [string, (...a: any[]) => void][] = [
            ['order:new', (data: any) => addNotification('ORDER', 'New Order', `Order #${data?.orderNumber || ''} received`)],
            ['order:cancelled', (data: any) => addNotification('ALERT', 'Order Cancelled', `Order #${data?.orderNumber || ''} was cancelled`)],
            ['inventory:low-stock', (data: any) => addNotification('STOCK', 'Low Stock Alert', `${data?.itemName || 'Item'} is below reorder point`)],
            ['refund:requested', (data: any) => addNotification('REFUND', 'Refund Requested', `Refund for Order #${data?.orderId || ''}`)],
            ['approval:pending', (data: any) => addNotification('APPROVAL', 'Approval Needed', data?.message || 'New approval request')],
        ];

        handlers.forEach(([event, handler]) => socketService.on(event, handler));
        return () => { handlers.forEach(([event, handler]) => socketService.off(event, handler)); };
    }, [addNotification]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const clearAll = () => setNotifications([]);
    const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    const timeAgo = (d: Date) => {
        const s = Math.floor((Date.now() - d.getTime()) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    };

    return (
        <div ref={panelRef} className="fixed top-4 right-4 z-[60]" style={{ direction: 'ltr' }}>
            {/* Bell Button */}
            <button onClick={() => setIsOpen(!isOpen)}
                className="relative w-11 h-11 rounded-2xl bg-card/90 backdrop-blur-xl border border-border shadow-lg flex items-center justify-center text-muted hover:text-main hover:scale-105 transition-all group">
                <Bell size={18} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-rose-500/40">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute top-14 right-0 w-[360px] max-h-[480px] bg-card border border-border rounded-[1.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-center justify-between bg-elevated/30">
                        <h3 className="text-xs font-black text-main uppercase tracking-widest">Notifications</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-elevated/60 transition-colors" title={soundEnabled ? 'Mute' : 'Unmute'}>
                                {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                            </button>
                            {notifications.length > 0 && (
                                <>
                                    <button onClick={markAllRead} className="text-[9px] font-bold text-blue-500 hover:underline">Mark all read</button>
                                    <button onClick={clearAll} className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"><Trash2 size={12} /></button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-[380px] no-scrollbar">
                        {notifications.length === 0 && (
                            <div className="p-8 text-center">
                                <Bell size={32} className="text-muted/30 mx-auto mb-3" />
                                <p className="text-xs text-muted">No notifications yet</p>
                            </div>
                        )}
                        {notifications.map(n => {
                            const meta = TYPE_META[n.type] || TYPE_META.INFO;
                            return (
                                <button key={n.id} onClick={() => markRead(n.id)}
                                    className={`w-full flex items-start gap-3 p-4 text-left border-b border-border/50 hover:bg-elevated/30 transition-all ${!n.read ? 'bg-blue-500/[0.03]' : ''}`}>
                                    <div className={`w-8 h-8 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                        <meta.icon size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-[10px] font-black uppercase tracking-wider ${!n.read ? 'text-main' : 'text-muted'}`}>{n.title}</p>
                                            {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                                        </div>
                                        <p className="text-[10px] text-muted leading-relaxed mt-0.5 truncate">{n.message}</p>
                                        <p className="text-[8px] text-muted/50 mt-1">{timeAgo(n.timestamp)}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
