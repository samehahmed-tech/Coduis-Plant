import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, TrendingUp, Info, X } from 'lucide-react';
import { eventBus } from '../services/eventBus';
import { AuditEventType } from '../types';

interface AIAlert {
    id: string;
    type: 'INVENTORY_FORECAST' | 'HIGH_VOID_RATE' | 'DEMAND_INSIGHT';
    message: string;
    timestamp: Date;
    isRead: boolean;
}

const AIAlertsWidget: React.FC = () => {
    const [alerts, setAlerts] = useState<AIAlert[]>([]);

    useEffect(() => {
        // Listen for AI generated insights
        const unsubscribeInsight = eventBus.on(AuditEventType.AI_INSIGHT_GENERATED, (payload) => {
            addAlert({
                id: Math.random().toString(36).substr(2, 9),
                type: payload.type,
                message: payload.insight,
                timestamp: payload.timestamp,
                isRead: false
            });
        });

        // Listen for anomalies
        const unsubscribeAnomaly = eventBus.on(AuditEventType.AI_ANOMALY_DETECTED, (payload) => {
            addAlert({
                id: Math.random().toString(36).substr(2, 9),
                type: payload.type,
                message: payload.message,
                timestamp: payload.timestamp,
                isRead: false
            });
        });

        return () => {
            unsubscribeInsight();
            unsubscribeAnomaly();
        };
    }, []);

    const addAlert = (alert: AIAlert) => {
        setAlerts(prev => [alert, ...prev].slice(0, 5));
    };

    const dismissAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    if (alerts.length === 0) return null;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-2 mb-2 px-1">
                <Sparkles className="text-amber-500" size={16} />
                <h3 className="text-[10px] font-black uppercase text-muted tracking-widest">Zen AI Insights</h3>
            </div>

            {alerts.map(alert => (
                <div
                    key={alert.id}
                    className={`relative p-5 rounded-[2rem] border-2 transition-all group overflow-hidden ${alert.type === 'HIGH_VOID_RATE'
                        ? 'bg-danger/10 border-danger/30'
                        : 'bg-card dark:bg-card border-border/50 shadow-sm'
                        }`}
                >
                    <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${alert.type === 'HIGH_VOID_RATE' ? 'bg-danger text-white' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                            }`}>
                            {alert.type === 'HIGH_VOID_RATE' ? <AlertCircle size={20} /> : <TrendingUp size={20} />}
                        </div>
                        <div className="flex-1 pr-6">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[8px] font-black uppercase tracking-widest ${alert.type === 'HIGH_VOID_RATE' ? 'text-danger' : 'text-amber-600'
                                    }`}>
                                    {alert.type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[8px] font-bold text-muted uppercase">
                                    {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-main leading-relaxed uppercase tracking-tight">
                                {alert.message}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => dismissAlert(alert.id)}
                        className="absolute top-4 right-4 p-1 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                        <X size={14} />
                    </button>
                    {/* Progress pulse for importance */}
                    {alert.type === 'HIGH_VOID_RATE' && (
                        <div className="absolute bottom-0 left-0 h-1 bg-danger animate-pulse w-full opacity-30" />
                    )}
                </div>
            ))}
        </div>
    );
};

export default AIAlertsWidget;
