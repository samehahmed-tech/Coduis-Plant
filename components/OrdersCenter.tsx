import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Search, Filter, Calendar, ClipboardCheck, Eye, Trash2, 
    X, ChevronDown, CheckCircle, Clock, ChefHat, Package, 
    Bike, XCircle, AlertCircle, RefreshCw, Printer, User, MapPin, Phone
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useOrderStore } from '../stores/useOrderStore';
import { OrderStatus, OrderType, AppPermission, Order } from '../types';
import { translations } from '../services/translations';
import { ordersApi } from '../services/api/orders';
import { useToast } from './Toast';
import { getActionableErrorMessage } from '../services/api/core';
import PageSkeleton from './common/PageSkeleton';
import { ManagerApprovalModal } from './pos/ManagerApprovalModal';
import { printOrderReceipt } from '../services/posPrintOrchestrator';

const OrdersCenter: React.FC = () => {
    const { settings, branches, hasPermission } = useAuthStore();
    const { fetchOrders, updateOrderStatus } = useOrderStore(); // We use store's global state if synced, but for history we might want fresh fetch
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [branchFilter, setBranchFilter] = useState<string>(settings.activeBranchId || 'ALL');
    const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
    
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalAction, setApprovalAction] = useState<() => void>(() => {});

    const lang = settings.language || 'en';
    const isAr = lang === 'ar';
    const t = translations[lang] || translations['en'];
    const { showToast } = useToast();

    const loadOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: any = { limit: 100 };
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (branchFilter !== 'ALL') params.branch_id = branchFilter;
            if (typeFilter !== 'ALL') params.type = typeFilter;
            if (dateFilter) params.date = dateFilter;

            const data = await ordersApi.getAll(params);
            setOrders(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(getActionableErrorMessage(err, lang as any));
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, branchFilter, typeFilter, dateFilter, lang]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const filteredOrders = useMemo(() => {
        if (!searchQuery) return orders;
        const q = searchQuery.toLowerCase();
        return orders.filter(o => 
            o.id.toLowerCase().includes(q) || 
            (o.customerName && o.customerName.toLowerCase().includes(q)) ||
            (o.customerPhone && o.customerPhone.includes(q))
        );
    }, [orders, searchQuery]);

    const selectedOrder = useMemo(() => 
        orders.find(o => o.id === selectedOrderId), 
    [orders, selectedOrderId]);

    const handleVoidOrder = (orderId: string) => {
        if (!hasPermission(AppPermission.OP_VOID_ORDER)) {
            setApprovalAction(() => () => executeVoidOrder(orderId));
            setShowApprovalModal(true);
            return;
        }
        executeVoidOrder(orderId);
    };

    const executeVoidOrder = async (orderId: string) => {
        try {
            await updateOrderStatus(orderId, OrderStatus.CANCELLED);
            showToast(isAr ? 'تم إلغاء الطلب' : 'Order cancelled', 'success');
            loadOrders();
        } catch (err: any) {
            showToast(getActionableErrorMessage(err, lang as any), 'error');
        }
    };

    const handlePrintReceipt = async (order: Order) => {
        try {
            await printOrderReceipt(order);
            showToast(isAr ? 'جاري طباعة الفاتورة' : 'Printing receipt...', 'success');
        } catch (err) {
            showToast(isAr ? 'خطأ في الطباعة' : 'Print failed', 'error');
        }
    };

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING: return <Clock size={14} className="text-amber-500" />;
            case OrderStatus.PREPARING: return <ChefHat size={14} className="text-cyan-500" />;
            case OrderStatus.READY: return <Package size={14} className="text-indigo-500" />;
            case OrderStatus.OUT_FOR_DELIVERY: return <Bike size={14} className="text-violet-500" />;
            case OrderStatus.DELIVERED: return <CheckCircle size={14} className="text-emerald-500" />;
            case OrderStatus.CANCELLED: return <XCircle size={14} className="text-rose-500" />;
            default: return <AlertCircle size={14} className="text-muted" />;
        }
    };

    const getStatusLabel = (status: OrderStatus) => {
        const labels: Record<string, { en: string; ar: string }> = {
            [OrderStatus.PENDING]: { en: 'Pending', ar: 'معلق' },
            [OrderStatus.PREPARING]: { en: 'Preparing', ar: 'تحضير' },
            [OrderStatus.READY]: { en: 'Ready', ar: 'جاهز' },
            [OrderStatus.OUT_FOR_DELIVERY]: { en: 'On Way', ar: 'في الطريق' },
            [OrderStatus.DELIVERED]: { en: 'Delivered', ar: 'تم التسليم' },
            [OrderStatus.CANCELLED]: { en: 'Cancelled', ar: 'ملغي' },
        };
        return isAr ? labels[status]?.ar : labels[status]?.en;
    };

    if (isLoading && orders.length === 0) return <div className="p-8 h-full"><PageSkeleton type="table" rows={10} /></div>;

    return (
        <div className="flex h-screen bg-app overflow-hidden" style={{ transform: 'translate3d(0,0,0)' }}>
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Section */}
                <div className="px-6 py-5 bg-card/60 backdrop-blur-xl border-b border-border/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <ClipboardCheck size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-main uppercase tracking-tight">{isAr ? 'مركز الطلبات' : 'Orders Center'}</h1>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">{isAr ? 'إدارة ومراجعة جميع طلبات الفروع' : 'Manage and review all branch orders'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={16} />
                            <input 
                                type="text"
                                placeholder={isAr ? 'بحث برقم الطلب...' : 'Search order #...'}
                                className="pl-10 pr-4 py-2.5 bg-elevated rounded-xl border border-border/50 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button onClick={loadOrders} className="p-2.5 rounded-xl bg-elevated border border-border/50 text-muted hover:text-main transition-all">
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="px-6 py-3 bg-card/40 backdrop-blur-md border-b border-border/30 flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-elevated rounded-lg border border-border/50">
                        <Filter size={12} className="text-muted" />
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase outline-none text-main"
                        >
                            <option value="ALL">{isAr ? 'كل الحالات' : 'All Status'}</option>
                            {Object.values(OrderStatus).map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-elevated rounded-lg border border-border/50">
                        <Calendar size={12} className="text-muted" />
                        <input 
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black outline-none text-main"
                        />
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-elevated rounded-lg border border-border/50">
                        <MapPin size={12} className="text-muted" />
                        <select 
                            value={branchFilter} 
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase outline-none text-main"
                        >
                            <option value="ALL">{isAr ? 'كل الفروع' : 'All Branches'}</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Orders List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                    {filteredOrders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted py-20 grayscale opacity-40">
                            <ClipboardCheck size={64} className="mb-4" />
                            <p className="text-sm font-black uppercase tracking-widest">{isAr ? 'لا توجد طلبات مطابقة' : 'No matching orders'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredOrders.map(order => (
                                <div 
                                    key={order.id}
                                    onClick={() => setSelectedOrderId(order.id)}
                                    className={`group flex items-center gap-4 bg-card/80 backdrop-blur-sm border rounded-2xl p-4 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${selectedOrderId === order.id ? 'border-primary ring-2 ring-primary/10 bg-primary/5' : 'border-border/50'}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${selectedOrderId === order.id ? 'bg-primary text-white border-primary/20' : 'bg-elevated text-muted border-border/30'}`}>
                                        <ClipboardCheck size={20} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-black text-main">#{order.id.slice(-8).toUpperCase()}</span>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-main/5 rounded text-[9px] font-black uppercase tracking-widest">
                                                {getStatusIcon(order.status)}
                                                {getStatusLabel(order.status)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-muted">
                                            <span className="text-[10px] font-bold truncate max-w-[120px]">{order.customerName || (isAr ? 'عميل عابر' : 'Walk-in')}</span>
                                            <span className="text-[10px] font-bold flex items-center gap-1"><Clock size={10} /> {new Date(order.createdAt).toLocaleTimeString()}</span>
                                            <span className="text-[10px] font-black text-primary ml-auto">{order.total.toFixed(2)} EGP</span>
                                        </div>
                                    </div>
                                    
                                    <button className="p-2 rounded-xl bg-elevated border border-border/30 text-muted opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary">
                                        <Eye size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Side Detail Panel */}
            <div className={`w-[400px] bg-card/95 backdrop-blur-2xl border-l border-border/50 flex flex-col shadow-2xl transition-all duration-300 ${selectedOrder ? 'translate-x-0' : (isAr ? '-translate-x-full' : 'translate-x-full')} invisible md:visible`}>
                {selectedOrder ? (
                    <>
                        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-main/[0.02]">
                            <div>
                                <h3 className="text-lg font-black text-main uppercase italic">Order Details</h3>
                                <p className="text-[10px] font-black text-muted opacity-70">#{selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrderId(null)} className="p-2 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-muted transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Customer Section */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 flex items-center gap-2">
                                    <User size={12} /> {isAr ? 'معلومات العميل' : 'Customer Info'}
                                </h4>
                                <div className="bg-elevated/40 rounded-2xl p-4 border border-border/20 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-muted">{isAr ? 'الاسم' : 'Name'}</span>
                                        <span className="text-xs font-black text-main">{selectedOrder.customerName || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-muted">{isAr ? 'الهاتف' : 'Phone'}</span>
                                        <span className="text-xs font-black text-primary flex items-center gap-1"><Phone size={10} /> {selectedOrder.customerPhone || '-'}</span>
                                    </div>
                                    {selectedOrder.deliveryAddress && (
                                        <div className="space-y-1 mt-1">
                                            <span className="text-[10px] font-bold text-muted">{isAr ? 'العنوان' : 'Address'}</span>
                                            <p className="text-xs font-bold text-main leading-relaxed">{selectedOrder.deliveryAddress}</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Items List */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 flex items-center gap-2">
                                    <ShoppingBag size={12} /> {isAr ? 'الأصناف' : 'Items'} ({selectedOrder.items.length})
                                </h4>
                                <div className="space-y-2">
                                    {selectedOrder.items.map(item => (
                                        <div key={item.cartId} className="flex items-center justify-between p-3 bg-main/5 rounded-xl border border-border/10">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 flex items-center justify-center bg-card rounded-lg text-[10px] font-black border border-border/30">{item.quantity}</span>
                                                <div>
                                                    <p className="text-xs font-black text-main">{isAr ? (item.nameAr || item.name) : item.name}</p>
                                                    <p className="text-[9px] font-bold text-muted italic">{(item.price * item.quantity).toFixed(2)} EGP</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Totals */}
                            <section className="bg-main/5 rounded-2xl p-5 border border-main/10">
                                <div className="space-y-2 mb-4 pt-2">
                                    <div className="flex justify-between text-[10px] font-bold text-muted"><span>Subtotal</span><span>{selectedOrder.subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold text-muted"><span>Tax</span><span>{selectedOrder.tax.toFixed(2)}</span></div>
                                    {selectedOrder.discount ? <div className="flex justify-between text-[10px] font-bold text-success"><span>Discount</span><span>-{((selectedOrder.subtotal * selectedOrder.discount)/100).toFixed(2)}</span></div> : null}
                                    <div className="flex justify-between text-lg font-black text-main pt-2 border-t border-border/30 mt-2"><span>Total</span><span>{selectedOrder.total.toFixed(2)}</span></div>
                                </div>
                            </section>
                        </div>

                        {/* Actions Panel */}
                        <div className="p-6 bg-card border-t border-border/50 grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handlePrintReceipt(selectedOrder)}
                                className="flex items-center justify-center gap-2 py-3.5 bg-elevated rounded-xl text-xs font-black uppercase tracking-widest text-muted hover:text-main hover:bg-border transition-all border border-border/30"
                            >
                                <Printer size={16} /> Print
                            </button>
                            <button 
                                onClick={() => handleVoidOrder(selectedOrder.id)}
                                className="flex items-center justify-center gap-2 py-3.5 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:opacity-90 active:scale-95 transition-all"
                            >
                                <Trash2 size={16} /> Void
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted/30 p-10 text-center">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-elevated flex items-center justify-center mb-6">
                            <Eye size={40} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em]">{isAr ? 'اختر طلب للمعاينة' : 'Select Order to View'}</h3>
                        <p className="text-[10px] font-bold mt-2 leading-relaxed italic">Click on any order card from the left to view full customer details, status timeline and order items.</p>
                    </div>
                )}
            </div>

            <ManagerApprovalModal 
                isOpen={showApprovalModal}
                onClose={() => setShowApprovalModal(false)}
                onApproved={approvalAction}
                actionName="VOID_ORDER"
            />
        </div>
    );
};

export default OrdersCenter;
