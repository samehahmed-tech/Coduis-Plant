
import React, { useState, useMemo } from 'react';
import {
    Phone,
    Search,
    MapPin,
    Truck,
    Plus,
    Minus,
    Trash2,
    CheckCircle2,
    Clock,
    ArrowRight,
    User,
    Navigation,
    ShoppingBag
} from 'lucide-react';
import {
    OrderItem,
    OrderStatus,
    OrderType,
    Order
} from '../types';

// Stores
import { useCRMStore } from '../stores/useCRMStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useMenuStore } from '../stores/useMenuStore';
import { useOrderStore } from '../stores/useOrderStore';

// Services
import { translations } from '../services/translations';

const CallCenter: React.FC = () => {
    // --- Global State ---
    const { customers } = useCRMStore();
    const { branches, settings } = useAuthStore();
    const { categories } = useMenuStore();
    const { orders, placeOrder } = useOrderStore();

    const lang = (settings.language || 'en') as 'en' | 'ar';
    const t = translations[lang] || translations['en'];

    const [phoneSearch, setPhoneSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [deliveryAddress, setDeliveryAddress] = useState('');

    const allMenuItems = useMemo(() => categories.flatMap(cat => cat.items), [categories]);

    const handleCustomerSearch = () => {
        const found = customers.find(c => c.phone.includes(phoneSearch));
        if (found) {
            setSelectedCustomer(found);
            setDeliveryAddress(found.address || '');
        }
    };

    const addToCart = (item: any) => {
        const existing = cart.find(i => i.id === item.id);
        if (existing) {
            setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, { ...item, quantity: 1, cartId: Math.random().toString(36).substr(2, 9) }]);
        }
    };

    const removeFromCart = (cartId: string) => {
        setCart(cart.filter(i => i.cartId !== cartId));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.14;
    const total = subtotal + tax;

    const handleSubmitOrder = () => {
        if (!selectedBranchId || cart.length === 0 || !selectedCustomer) return;

        const newOrder: Order = {
            id: `CC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            type: OrderType.DELIVERY,
            branchId: selectedBranchId,
            customerId: selectedCustomer.id,
            deliveryAddress: deliveryAddress,
            isCallCenterOrder: true,
            items: cart,
            status: OrderStatus.PENDING,
            subtotal,
            tax,
            total,
            createdAt: new Date(),
            notes: "Call Center Dispatch"
        };

        placeOrder(newOrder);

        // Reset state
        setCart([]);
        setSelectedCustomer(null);
        setPhoneSearch('');
        setDeliveryAddress('');
        setSelectedBranchId('');
    };

    const dispatchOrders = orders.filter(o => o.isCallCenterOrder);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen pb-24">
            {/* Left Panel: Customer & Order Entry */}
            <div className="xl:col-span-8 space-y-6">

                {/* Step 1: Customer Lookup */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                            <User size={20} />
                        </div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {lang === 'ar' ? 'بيانات العميل' : 'Customer Details'}
                        </h3>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={lang === 'ar' ? 'بحث برقم الهاتف...' : 'Search by phone number...'}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                value={phoneSearch}
                                onChange={(e) => setPhoneSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                            />
                        </div>
                        <button
                            onClick={handleCustomerSearch}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                        >
                            <Search size={16} /> {lang === 'ar' ? 'بحث' : 'Search'}
                        </button>
                    </div>

                    {selectedCustomer && (
                        <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{selectedCustomer.name}</p>
                                    <p className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-1">
                                        <MapPin size={12} /> {selectedCustomer.address}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">LOYAL CUSTOMER</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Visits: {selectedCustomer.visits || 0}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 2: Item Selection */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                            <Plus size={20} />
                        </div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {lang === 'ar' ? 'إضافة أصناف' : 'Add Items'}
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {allMenuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addToCart(item)}
                                className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-orange-500 hover:scale-[1.02] transition-all text-left group"
                            >
                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase leading-tight mb-2 group-hover:text-orange-600">{item.name}</p>
                                <p className="text-xs font-bold text-slate-400">{item.price} ج.م</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dispatch History */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-slate-400" />
                        {lang === 'ar' ? 'سجل التوصيل اليوم' : 'Daily Dispatch History'}
                    </h3>
                    <div className="space-y-3">
                        {dispatchOrders.length === 0 ? (
                            <p className="text-sm text-slate-400 font-bold italic py-4">No dispatch activity yet today.</p>
                        ) : (
                            dispatchOrders.map(order => (
                                <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${order.status === OrderStatus.DELIVERED ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500 animate-pulse'}`}>
                                            <Truck size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase">{order.id}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{branches.find(b => b.id === order.branchId)?.name} • {order.status}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">{order.total} ج.م</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel: Cart & Dispatch */}
            <div className="xl:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 sticky top-24 flex flex-col min-h-[600px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {lang === 'ar' ? 'سلة الطلبات' : 'Order Basket'}
                        </h3>
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase">{cart.length} Items</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <ShoppingBag size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
                                <p className="text-sm text-slate-400 font-black uppercase">Basket is Empty</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.cartId} className="flex justify-between items-center group">
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase">{item.name}</p>
                                        <p className="text-xs text-slate-400 font-bold">{item.quantity} x {item.price} ج.م</p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => removeFromCart(item.cartId)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-8 space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                        {/* Branch Dispatch Logic */}
                        <div>
                            <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-2 block">
                                Dispatch Through
                            </label>
                            <div className="relative">
                                <Navigation size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => setSelectedBranchId(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold uppercase outline-none appearance-none"
                                >
                                    <option value="">Select Target Branch</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                                    ))}
                                </select>
                            </div>
                            {selectedBranchId && (
                                <p className="text-[9px] text-emerald-600 font-bold uppercase mt-2 flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Active & Ready for dispatch
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                <span>Subtotal</span>
                                <span>{subtotal.toFixed(2)} ج.م</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                <span>Tax (14%)</span>
                                <span>{tax.toFixed(2)} ج.م</span>
                            </div>
                            <div className="flex justify-between text-lg font-black text-slate-800 dark:text-white uppercase pt-2">
                                <span>Total</span>
                                <span>{total.toFixed(2)} ج.م</span>
                            </div>
                        </div>

                        <button
                            disabled={!selectedBranchId || cart.length === 0 || !selectedCustomer}
                            onClick={handleSubmitOrder}
                            className="w-full bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
                        >
                            Dispatch to Branch <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallCenter;
