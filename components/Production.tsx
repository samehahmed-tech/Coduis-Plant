import React, { useEffect, useState } from 'react';
import {
    Factory,
    Plus,
    ClipboardList,
    ArrowRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    Package,
    Layers,
    History
} from 'lucide-react';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useAuthStore } from '../stores/useAuthStore';
import { translations } from '../services/translations';
import { ProductionStatus, ProductionOrder } from '../types';

const Production: React.FC = () => {
    const { settings } = useAuthStore();
    const { inventory, warehouses, productionOrders, fetchProductionOrders, addProductionOrder, startProductionOrder, completeProductionOrder, cancelProductionOrder } = useInventoryStore();
    const lang = settings.language || 'en';
    const t = translations[lang];

    const [activeTab, setActiveTab] = useState<'ORDERS' | 'PLANNING' | 'HISTORY'>('ORDERS');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [targetItemId, setTargetItemId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [quantityRequested, setQuantityRequested] = useState(1);

    useEffect(() => {
        fetchProductionOrders();
    }, []);

    // Filter composite items for production
    const compositeItems = inventory.filter(i => i.isComposite);

    const getStatusStyles = (status: ProductionStatus) => {
        switch (status) {
            case ProductionStatus.COMPLETED: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case ProductionStatus.IN_PROGRESS: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case ProductionStatus.PENDING: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case ProductionStatus.CANCELLED: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default: return '';
        }
    };

    return (
        <div className="p-4 md:p-8 lg:p-12 bg-app min-h-screen">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/30">
                            <Factory size={32} />
                        </div>
                        <h2 className="text-4xl font-black text-main uppercase tracking-tighter">
                            {t.production}
                        </h2>
                    </div>
                    <p className="text-muted font-bold text-sm uppercase tracking-widest opacity-60">
                        {lang === 'ar' ? 'إدارة خطوط الإنتاج والكميات الكبيرة' : 'Central Kitchen & Batch Production Control'}
                    </p>
                </div>

                <div className="flex gap-4 w-full xl:w-auto">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-widest"
                    >
                        <Plus size={20} /> {lang === 'ar' ? 'أمر إنتاج جديد' : 'New Production Order'}
                    </button>
                    <button className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-card border border-border text-main px-8 py-4 rounded-2xl hover:bg-elevated transition-all shadow-sm font-black text-xs uppercase tracking-widest">
                        <History size={20} /> {lang === 'ar' ? 'السجل' : 'Batch Logs'}
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: lang === 'ar' ? 'نشط' : 'Active Batches', value: productionOrders.filter(o => o.status === ProductionStatus.IN_PROGRESS).length, icon: Clock, color: 'text-blue-500' },
                    { label: lang === 'ar' ? 'مكتمل (اليوم)' : 'Completed (Today)', value: productionOrders.filter(o => o.status === ProductionStatus.COMPLETED).length, icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: lang === 'ar' ? 'قيد الانتظار' : 'Pending Queue', value: productionOrders.filter(o => o.status === ProductionStatus.PENDING).length, icon: ClipboardList, color: 'text-amber-500' },
                    { label: lang === 'ar' ? 'تنبيهات نقص' : 'Stock Shortages', value: 0, icon: AlertCircle, color: 'text-rose-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card p-6 rounded-[2rem] border border-border shadow-sm flex items-center gap-5">
                        <div className={`p-4 rounded-2xl bg-app ${stat.color} shadow-inner`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-main">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-card p-2 rounded-2xl border border-border w-fit">
                {(['ORDERS', 'PLANNING', 'HISTORY'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:bg-elevated'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="bg-card rounded-[2.5rem] border border-border shadow-2xl shadow-primary/5 overflow-hidden min-h-[360px] md:min-h-[440px] lg:min-h-[500px]">
                {activeTab === 'ORDERS' && (
                    <div className="p-8">
                        {productionOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                <Layers size={80} className="mb-6" />
                                <p className="text-xl font-black uppercase tracking-tighter">{lang === 'ar' ? 'لا يوجد أوامر نشطة' : 'No Production Orders Ready'}</p>
                                <p className="text-sm font-bold uppercase tracking-widest mt-2">{lang === 'ar' ? 'ابدأ بإنشاء تشغيلة جديدة' : 'Initialize a production batch to start'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {productionOrders.map(order => {
                                    const item = inventory.find(i => i.id === order.targetItemId);
                                    return (
                                        <div key={order.id} className="p-6 bg-elevated/30 border border-border rounded-[2rem] hover:border-primary/40 transition-all group">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                        <Package size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-main uppercase leading-tight">{lang === 'ar' ? item?.nameAr : item?.name}</h4>
                                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">BATCH: {order.batchNumber}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="p-4 bg-card rounded-2xl border border-border/50">
                                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">Target Qty</p>
                                                    <p className="text-xl font-black text-main">{order.quantityRequested} {item?.unit}</p>
                                                </div>
                                                <div className="p-4 bg-card rounded-2xl border border-border/50">
                                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">Created</p>
                                                    <p className="text-sm font-black text-main uppercase">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 mt-auto">
                                                {order.status === ProductionStatus.PENDING && (
                                                    <button
                                                        onClick={() => startProductionOrder(order.id)}
                                                        className="flex-1 py-3.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/10"
                                                    >
                                                        Start <ArrowRight size={14} />
                                                    </button>
                                                )}
                                                {order.status === ProductionStatus.IN_PROGRESS && (
                                                    <button
                                                        onClick={() => completeProductionOrder(order.id, order.quantityRequested)}
                                                        className="flex-1 py-3.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-500/10"
                                                    >
                                                        Complete <CheckCircle2 size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => cancelProductionOrder(order.id)}
                                                    className="px-4 py-3.5 bg-card border border-border text-muted rounded-xl font-black text-[10px] uppercase hover:text-rose-500 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                        <h3 className="text-lg font-black">Create Production Order</h3>
                        <select className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" value={targetItemId} onChange={(e) => setTargetItemId(e.target.value)}>
                            <option value="">Select Composite Item</option>
                            {compositeItems.map((item) => (
                                <option key={item.id} value={item.id}>{lang === 'ar' ? item.nameAr || item.name : item.name}</option>
                            ))}
                        </select>
                        <select className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                            <option value="">Select Warehouse</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                        <input type="number" min={1} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" value={quantityRequested} onChange={(e) => setQuantityRequested(Number(e.target.value || 0))} />
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    if (!targetItemId || !warehouseId || quantityRequested <= 0) return;
                                    await addProductionOrder({
                                        id: `TMP-${Date.now()}`,
                                        targetItemId,
                                        quantityRequested,
                                        quantityProduced: 0,
                                        warehouseId,
                                        status: ProductionStatus.PENDING,
                                        batchNumber: `B-${Date.now()}`,
                                        createdAt: new Date(),
                                        actorId: settings.currentUser?.id || 'system',
                                        ingredientsConsumed: [],
                                    });
                                    setIsCreateModalOpen(false);
                                    setTargetItemId('');
                                    setWarehouseId('');
                                    setQuantityRequested(1);
                                }}
                                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase"
                            >
                                Create
                            </button>
                            <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-black uppercase">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Production;
