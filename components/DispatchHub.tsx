import React, { useState } from 'react';
import {
    Truck,
    MapPin,
    Clock,
    User,
    CheckCircle2,
    AlertCircle,
    PackageCheck,
    Navigation,
    ExternalLink,
    Smartphone,
    ChevronRight,
    Package
} from 'lucide-react';
import { useOrderStore } from '../stores/useOrderStore';
import { useAuthStore } from '../stores/useAuthStore';
import { translations } from '../services/translations';
import { OrderStatus, OrderType, Driver } from '../types';

const DispatchHub: React.FC = () => {
    const { settings } = useAuthStore();
    const { orders, updateOrderStatus } = useOrderStore();
    const lang = settings.language || 'en';
    const t = translations[lang];

    // Simulated drivers (in real app, this would come from a useDriverStore)
    const [drivers] = useState<Driver[]>([
        { id: 'D1', name: 'Ahmed Hassan', phone: '01012345678', status: 'AVAILABLE', vehicleType: 'BIKE' },
        { id: 'D2', name: 'Mohamed Ali', phone: '01198765432', status: 'ON_DELIVERY', vehicleType: 'SCOOTER', currentOrderId: 'ORD-552' },
        { id: 'D3', name: 'Sayed Ibrahim', phone: '01233445566', status: 'AVAILABLE', vehicleType: 'CAR' },
        { id: 'D4', name: 'Mahmoud Reda', phone: '01566778899', status: 'OFFLINE', vehicleType: 'BIKE' },
    ]);

    const deliveryOrders = orders.filter(o => o.type === OrderType.DELIVERY);
    const pendingDispatch = deliveryOrders.filter(o => o.status === OrderStatus.READY || o.status === OrderStatus.PREPARING);
    const activeDeliveries = deliveryOrders.filter(o => o.status === OrderStatus.OUT_FOR_DELIVERY);

    return (
        <div className="p-4 md:p-8 lg:p-12 bg-app min-h-screen">
            {/* Header */}
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
                        <p className="text-xl font-black text-main">{drivers.filter(d => d.status === 'AVAILABLE').length}</p>
                    </div>
                    <div className="px-6 py-2">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">{lang === 'ar' ? 'تحت التوصيل' : 'In Transit'}</p>
                        <p className="text-xl font-black text-main">{activeDeliveries.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Pending Dispatch (Ready Orders) */}
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
                                <div key={order.id} className="bg-card border border-border rounded-[2rem] p-6 hover:shadow-xl transition-all group overflow-hidden relative">
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
                                                <span className="text-[10px] font-bold">12m ago</span>
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
                                            {drivers.filter(d => d.status === 'AVAILABLE').map(driver => (
                                                <button
                                                    key={driver.id}
                                                    onClick={() => updateOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY)}
                                                    className="px-3 py-2 bg-app hover:bg-primary hover:text-white border border-border rounded-xl transition-all flex items-center gap-2 group/btn"
                                                >
                                                    <div className="w-6 h-6 rounded-lg bg-card flex items-center justify-center text-[10px] font-black text-primary group-hover/btn:bg-white/20 group-hover/btn:text-white uppercase">
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

                {/* Column 2: Active Fleet & Map Ticker */}
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
                                            <span className="text-[9px] font-black uppercase tracking-widest">15m</span>
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

                    {/* Quick Stats Sidebar */}
                    <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                            <Navigation size={120} />
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tighter mb-4">{lang === 'ar' ? 'كفاءة التوصيل' : 'Supply Efficiency'}</h4>
                        <div className="space-y-6 relative">
                            <div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">
                                    <span>{lang === 'ar' ? 'متوسط الوقت' : 'Avg Delivery Time'}</span>
                                    <span>24 MINS</span>
                                </div>
                                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-3/4 rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Avg. Cost/Order</p>
                                    <p className="text-lg font-black">18.5 ج.م</p>
                                </div>
                                <div className="bg-white/10 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Driver Rating</p>
                                    <p className="text-lg font-black">4.8/5</p>
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
