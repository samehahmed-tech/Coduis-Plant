import React, { useEffect, useMemo, useState } from 'react';
import {
    Truck,
    MapPin,
    Clock,
    User,
    PackageCheck,
    Navigation,
    Smartphone,
    ChevronRight,
    Package,
    AlertTriangle
} from 'lucide-react';
import { useOrderStore } from '../stores/useOrderStore';
import { useAuthStore } from '../stores/useAuthStore';
import { OrderStatus, OrderType, Driver } from '../types';
import { deliveryApi } from '../services/api';
import { socketService } from '../services/socketService';

const SLA_MINUTES = 45;

const DispatchHub: React.FC = () => {
    const { settings } = useAuthStore();
    const { orders, updateOrderStatus, fetchOrders } = useOrderStore();
    const lang = settings.language || 'en';
    const activeBranchId = settings.activeBranchId;

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
    const [isAssigningOrderId, setIsAssigningOrderId] = useState<string | null>(null);

    const loadDrivers = async () => {
        setIsLoadingDrivers(true);
        try {
            const data = await deliveryApi.getDrivers(activeBranchId ? { branchId: activeBranchId } : undefined);
            const mapped: Driver[] = data.map((d: any) => ({
                id: d.id,
                name: d.name,
                phone: d.phone,
                status: d.status === 'BUSY' ? 'ON_DELIVERY' : (d.status || 'OFFLINE'),
                vehicleType: 'BIKE',
                currentOrderId: undefined,
            }));
            setDrivers(mapped);
        } catch (error) {
            console.error('Failed to load drivers:', error);
        } finally {
            setIsLoadingDrivers(false);
        }
    };

    useEffect(() => {
        loadDrivers();
    }, [activeBranchId]);

    useEffect(() => {
        const onDriverStatus = (payload: { id: string; status: string }) => {
            setDrivers(prev => prev.map(d => d.id === payload.id ? { ...d, status: payload.status === 'BUSY' ? 'ON_DELIVERY' : payload.status as any } : d));
        };
        const onDispatchAssigned = () => {
            if (activeBranchId) fetchOrders({ branch_id: activeBranchId, limit: 100 });
            loadDrivers();
        };
        socketService.on('driver:status', onDriverStatus as any);
        socketService.on('dispatch:assigned', onDispatchAssigned);
        return () => {
            socketService.off('driver:status', onDriverStatus as any);
            socketService.off('dispatch:assigned', onDispatchAssigned);
        };
    }, [activeBranchId, fetchOrders]);

    const deliveryOrders = orders.filter(o => o.type === OrderType.DELIVERY);
    const pendingDispatch = deliveryOrders.filter(o =>
        (o.status === OrderStatus.READY || o.status === OrderStatus.PREPARING) &&
        (!activeBranchId || o.branchId === activeBranchId)
    );
    const activeDeliveries = deliveryOrders.filter(o =>
        o.status === OrderStatus.OUT_FOR_DELIVERY &&
        (!activeBranchId || o.branchId === activeBranchId)
    );
    const availableDrivers = useMemo(() => drivers.filter(d => d.status === 'AVAILABLE'), [drivers]);

    const delayedDeliveries = useMemo(() => {
        const now = Date.now();
        return activeDeliveries.filter(order => {
            const elapsedMin = (now - new Date(order.createdAt).getTime()) / (1000 * 60);
            return elapsedMin > SLA_MINUTES;
        });
    }, [activeDeliveries]);

    const avgDeliveryMinutes = useMemo(() => {
        if (activeDeliveries.length === 0) return 0;
        const now = Date.now();
        const total = activeDeliveries.reduce((sum, o) => {
            return sum + ((now - new Date(o.createdAt).getTime()) / (1000 * 60));
        }, 0);
        return total / activeDeliveries.length;
    }, [activeDeliveries]);

    const assignDriver = async (orderId: string, driverId: string) => {
        setIsAssigningOrderId(orderId);
        try {
            await deliveryApi.assign({ orderId, driverId });
            await updateOrderStatus(orderId, OrderStatus.OUT_FOR_DELIVERY);
            await fetchOrders(activeBranchId ? { branch_id: activeBranchId, limit: 100 } : { limit: 100 });
            await loadDrivers();
        } catch (error) {
            console.error('Failed to assign driver:', error);
        } finally {
            setIsAssigningOrderId(null);
        }
    };

    return (
        <div className="p-4 md:p-8 lg:p-12 bg-app min-h-screen">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/30">
                            <Truck size={32} />
                        </div>
                        <h2 className="text-4xl font-black text-main uppercase tracking-tighter">
                            {lang === 'ar' ? 'مركز التوصيل' : 'Dispatch Control'}
                        </h2>
                    </div>
                    <p className="text-muted font-bold text-sm uppercase tracking-widest opacity-60">
                        {lang === 'ar' ? 'إدارة الأسطول وتتبع العمليات الميدانية' : 'Fleet Management & Field Operations Tracking'}
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-border shadow-sm">
                    <div className="px-6 py-2 border-r border-border">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">{lang === 'ar' ? 'سائقين متاحين' : 'Available Drivers'}</p>
                        <p className="text-xl font-black text-main">{availableDrivers.length}</p>
                    </div>
                    <div className="px-6 py-2 border-r border-border">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">{lang === 'ar' ? 'تحت التوصيل' : 'In Transit'}</p>
                        <p className="text-xl font-black text-main">{activeDeliveries.length}</p>
                    </div>
                    <div className="px-6 py-2">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Delayed</p>
                        <p className="text-xl font-black text-rose-600">{delayedDeliveries.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h3 className="text-lg font-black text-main uppercase tracking-tight flex items-center gap-3">
                            <PackageCheck className="text-primary" />
                            {lang === 'ar' ? 'طلبات قيد الإرسال' : 'Pending Assignment'}
                        </h3>
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black">
                            {pendingDispatch.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {pendingDispatch.length === 0 ? (
                            <div className="xl:col-span-2 py-20 bg-card/50 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center opacity-40">
                                <Package size={48} className="mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">{lang === 'ar' ? 'لا توجد طلبات جاهزة' : 'Clear for now. No orders ready.'}</p>
                            </div>
                        ) : (
                            pendingDispatch.map(order => (
                                <div key={order.id} className="bg-card border border-border rounded-[2rem] p-6 hover:shadow-xl transition-all relative">
                                    <div className={`absolute top-0 right-0 w-2 h-full ${order.status === OrderStatus.READY ? 'bg-success' : 'bg-amber-500'}`} />

                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[10px] font-black text-muted uppercase tracking-widest">ORDER #{order.id.slice(-5)}</p>
                                            <h4 className="text-lg font-black text-main uppercase">{order.customerName || 'Walk-in'}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-main">{order.total.toFixed(2)} ج.م</p>
                                            <div className="flex items-center gap-1.5 text-muted mt-1">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-bold">LIVE</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-app/50 p-4 rounded-2xl border border-border/50 mb-6 flex items-start gap-3">
                                        <MapPin className="text-rose-500 shrink-0 mt-0.5" size={16} />
                                        <p className="text-xs font-bold text-muted line-clamp-2 uppercase leading-relaxed">
                                            {order.deliveryAddress || 'No Address Data'}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">{lang === 'ar' ? 'تخصيص سائق' : 'Assign Fleet Member'}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {availableDrivers.map(driver => (
                                                <button
                                                    key={driver.id}
                                                    onClick={() => assignDriver(order.id, driver.id)}
                                                    disabled={isAssigningOrderId === order.id}
                                                    className="px-3 py-2 bg-app hover:bg-primary hover:text-white border border-border rounded-xl transition-all flex items-center gap-2 disabled:opacity-60"
                                                >
                                                    <div className="w-6 h-6 rounded-lg bg-card flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                                        {driver.name.charAt(0)}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-tight">{driver.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h3 className="text-lg font-black text-main uppercase tracking-tight flex items-center gap-3">
                            <Navigation className="text-primary" />
                            {lang === 'ar' ? 'الأسطول الميداني' : 'Field Fleet'}
                        </h3>
                        <span className="bg-card border border-border text-muted px-3 py-1 rounded-full text-[10px] font-black">
                            {drivers.length} TOTAL
                        </span>
                    </div>

                    {delayedDeliveries.length > 0 && (
                        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200/40 rounded-3xl p-5">
                            <h4 className="text-xs font-black uppercase tracking-widest text-rose-600 mb-3 flex items-center gap-2">
                                <AlertTriangle size={14} />
                                SLA Delay Alerts
                            </h4>
                            <div className="space-y-2 max-h-44 overflow-auto">
                                {delayedDeliveries.map(order => {
                                    const elapsed = Math.round((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60));
                                    return (
                                        <div key={order.id} className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/30 border border-rose-200/30 flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-black text-main">#{order.id.slice(-6)} {order.customerName || 'Guest'}</p>
                                                <p className="text-[10px] text-muted">{order.deliveryAddress || '-'}</p>
                                            </div>
                                            <span className="text-[10px] font-black text-rose-600">{elapsed}m</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {drivers.map(driver => (
                            <div key={driver.id} className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${driver.status === 'AVAILABLE' ? 'bg-success/10 text-success' : driver.status === 'ON_DELIVERY' ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'}`}>
                                    <User size={24} />
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${driver.status === 'AVAILABLE' ? 'bg-success' : driver.status === 'ON_DELIVERY' ? 'bg-primary' : 'bg-muted'}`} />
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-black text-main uppercase text-xs">{driver.name}</h5>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{driver.vehicleType}</p>
                                        <div className="w-1 h-1 rounded-full bg-border" />
                                        <p className="text-[10px] font-bold text-muted">{driver.phone}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {driver.status === 'ON_DELIVERY' ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 text-primary">
                                            <Clock size={10} strokeWidth={3} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">LIVE</span>
                                        </div>
                                    ) : (
                                        <button className="p-2 text-muted hover:text-primary transition-colors">
                                            <Smartphone size={16} />
                                        </button>
                                    )}
                                    <ChevronRight size={16} className="text-muted group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                            <Navigation size={120} />
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tighter mb-4">{lang === 'ar' ? 'كفاءة التوصيل' : 'Supply Efficiency'}</h4>
                        <div className="space-y-6 relative">
                            <div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">
                                    <span>{lang === 'ar' ? 'متوسط الوقت' : 'Avg Delivery Time'}</span>
                                    <span>{avgDeliveryMinutes > 0 ? `${Math.round(avgDeliveryMinutes)} MINS` : '--'}</span>
                                </div>
                                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]"
                                        style={{ width: `${Math.min(100, Math.max(8, (avgDeliveryMinutes / SLA_MINUTES) * 100))}%` }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Online Drivers</p>
                                    <p className="text-lg font-black">{isLoadingDrivers ? '...' : drivers.filter(d => d.status !== 'OFFLINE').length}</p>
                                </div>
                                <div className="bg-white/10 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Available</p>
                                    <p className="text-lg font-black">{isLoadingDrivers ? '...' : availableDrivers.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DispatchHub;
