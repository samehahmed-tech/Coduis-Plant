import React from 'react';
import { ChefHat, Truck, Clock, AlertTriangle, Users } from 'lucide-react';

export const KitchenPerformanceWidget = () => {
    return (
        <div className="flex flex-col h-full w-full bg-transparent">
            {/* Header */}
            <div className="shrink-0 flex justify-between items-center p-3 lg:p-4 border-b border-border/20 bg-card/40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                        <ChefHat size={14} />
                    </div>
                    <div>
                        <h3 className="text-[11px] lg:text-[12px] font-black uppercase tracking-widest text-main leading-none">
                            Kitchen Status
                        </h3>
                        <p className="text-[9px] text-muted font-bold tracking-widest mt-1 uppercase">Live Station Load</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                    </span>
                    <span className="text-[9px] uppercase tracking-widest font-black text-amber-500 leading-none mt-0.5">Active</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-3 lg:p-4 bg-app/30 overflow-hidden">
                <div className="shrink-0 grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-elevated/80 p-3 rounded-2xl border border-border/40 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xl font-black text-main tabular-nums tracking-tight">85%</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">Global Load</span>
                    </div>
                    <div className="bg-elevated/80 p-3 rounded-2xl border border-border/40 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xl font-black text-amber-500 tabular-nums tracking-tight">14m</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">Avg Ticket</span>
                    </div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {[
                        { station: 'Grill', load: 90, status: 'warning', delayed: 2 },
                        { station: 'Fryer', load: 45, status: 'stable', delayed: 0 },
                        { station: 'Salad', load: 60, status: 'stable', delayed: 0 }
                    ].map((station, i) => (
                        <div key={i} className="flex flex-col gap-2 p-3 rounded-xl bg-card border border-border/30 hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-main">{station.station}</span>
                                {station.delayed > 0 ? (
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                        <AlertTriangle size={10} /> {station.delayed} delayed
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Normal</span>
                                )}
                            </div>
                            <div className="w-full bg-elevated rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full ${station.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full transition-all duration-500`}
                                    style={{ width: `${station.load}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const DeliveryStatusWidget = () => {
    return (
        <div className="flex flex-col h-full w-full bg-transparent overflow-hidden border border-border/20 rounded-2xl bg-card/60 shadow-sm">
            {/* Header */}
            <div className="shrink-0 flex justify-between items-center p-3 lg:p-4 border-b border-border/20 bg-card/40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
                        <Truck size={14} />
                    </div>
                    <div>
                        <h3 className="text-[11px] lg:text-[12px] font-black uppercase tracking-widest text-main leading-none">
                            Fleet Dispatch
                        </h3>
                        {/* Status text */}
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-muted font-bold tracking-widest uppercase">Live Tracking</span>
                            <span className="flex items-center gap-1 text-[9px] font-black tracking-widest uppercase text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                <Users size={10} /> 4 Drivers
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-3 lg:p-4 bg-app/30 overflow-hidden">
                <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {[
                        { driver: 'Ahmed M.', zone: 'Downtown', time: '12m', est: '8 mins away', status: 'enroute' },
                        { driver: 'Kareem R.', zone: 'Westside', time: '24m', est: 'Arriving', status: 'arriving' },
                        { driver: 'Omar T.', zone: 'Eastside', time: '5m', est: 'En route', status: 'enroute' },
                        { driver: 'M. Ali', zone: 'North', time: '—', est: 'Idle', status: 'idle' },
                    ].map((fleet, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-card border border-border/30 hover:border-indigo-500/30 hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full ${fleet.status === 'idle' ? 'bg-elevated text-muted' : 'bg-indigo-500/20 text-indigo-500'} flex items-center justify-center font-bold text-[10px]`}>
                                    {fleet.driver.charAt(0)}
                                </div>
                                <div>
                                    <span className="block text-[11px] font-bold text-main">{fleet.driver}</span>
                                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider">{fleet.zone}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`block text-[11px] font-black ${fleet.status === 'idle' ? 'text-muted' : 'text-emerald-500'}`}>{fleet.est}</span>
                                <span className="flex items-center justify-end gap-1 text-[9px] font-bold text-muted uppercase mt-0.5">
                                    <Clock size={10} /> {fleet.time}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
