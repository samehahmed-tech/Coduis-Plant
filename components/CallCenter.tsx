
import React, { useState, useMemo, useEffect } from 'react';
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
    ShoppingBag,
    Headset,
    Gift,
    Star,
    History,
    Timer,
    AlertCircle,
    Percent,
    RefreshCcw,
    Pause,
    Play,
    Edit3,
    MessageSquare,
    PhoneCall,
    PhoneOff,
    TrendingUp,
    Users,
    Package,
    Zap,
    MapPinned,
    Bike,
    Ban,
    X,
    ChevronDown,
    ChevronUp,
    Copy,
    ExternalLink,
    Sparkles,
    UserPlus,
    Save,
    Eye,
    Filter,
    ChefHat,
    CheckCircle,
    XCircle,
    ArrowUpRight,
    Building2,
    LayoutGrid,
    List,
    Activity
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
import { printKitchenTicketsByRouting, printOrderReceipt } from '../services/posPrintOrchestrator';
import { deliveryApi, getActionableErrorMessage } from '../services/api';
import { useToast } from './Toast';

// POS Components
import ItemGrid from './pos/ItemGrid';
import CategoryTabs from './pos/CategoryTabs';
import CartItem from './pos/CartItem';
import NoteModal from './pos/NoteModal';

// ============================================================================
// 📞 INTELLIGENT CALL CENTER MODULE v2.0
// Enterprise-grade call center for restaurant operations
// Features: Customer Registration, Real-time Order Tracking, Multi-branch View
// ============================================================================

const DriverAssignmentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAssign: (driverId: string) => Promise<void> | void;
    branchId: string;
    orderId?: string;
    lang: 'en' | 'ar';
}> = ({ isOpen, onClose, onAssign, branchId, orderId, lang }) => {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const loadDrivers = async () => {
            if (!isOpen || !branchId) return;
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const data = await deliveryApi.getDrivers({ branchId });
                setDrivers(Array.isArray(data) ? data : []);
            } catch (error: any) {
                setErrorMessage(getActionableErrorMessage(error, lang));
                setDrivers([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadDrivers();
    }, [isOpen, branchId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-app/80 backdrop-blur-md">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative w-full max-w-md bg-card/90 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-border/50 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-black text-main uppercase tracking-tight">Assign Dispatcher</h2>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">Select driver for branch: {branchId} {orderId ? `| Order ${orderId}` : ''}</p>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading && (
                        <div className="p-6 text-center text-xs font-bold text-muted">Loading drivers...</div>
                    )}
                    {!isLoading && errorMessage && (
                        <div className="p-4 rounded-[1.2rem] bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">{errorMessage}</div>
                    )}
                    {!isLoading && !errorMessage && drivers.length === 0 && (
                        <div className="p-6 text-center text-xs font-bold text-muted">No drivers available for this branch.</div>
                    )}
                    {!isLoading && !errorMessage && drivers.map(driver => {
                        const isAvailable = String(driver.status || '').toUpperCase() === 'AVAILABLE';
                        const isAssigningThisDriver = assigningDriverId === driver.id;
                        return (
                            <button
                                key={driver.id}
                                disabled={!isAvailable || isAssigningThisDriver}
                                onClick={async () => {
                                    setAssigningDriverId(driver.id);
                                    setErrorMessage(null);
                                    try {
                                        await onAssign(driver.id);
                                        onClose();
                                    } catch (error: any) {
                                        setErrorMessage(getActionableErrorMessage(error, lang));
                                    } finally {
                                        setAssigningDriverId(null);
                                    }
                                }}
                                className={`w-full p-5 rounded-[1.5rem] flex items-center justify-between transition-all border shadow-sm ${isAvailable ? 'bg-elevated/80 border-border/50 hover:bg-indigo-500/5 hover:border-indigo-500/30 hover:shadow-indigo-500/10 group' : 'opacity-50 cursor-not-allowed bg-card/30 border-transparent'}`}
                            >
                                <div className="text-left">
                                    <p className="font-black uppercase text-sm tracking-tight text-main">{driver.name || driver.fullName || 'Driver'}</p>
                                    <p className="text-[10px] font-bold text-muted tracking-widest mt-0.5">{driver.phone || '-'}</p>
                                </div>
                                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${isAvailable ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:bg-indigo-500/10 group-hover:text-indigo-500 group-hover:border-indigo-500/20' : 'bg-muted/10 text-muted border-transparent'}`}>
                                    {isAssigningThisDriver ? 'ASSIGNING' : String(driver.status || 'UNKNOWN')}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <button onClick={onClose} className="w-full mt-8 py-4 text-[10px] font-black uppercase text-muted tracking-widest hover:text-rose-500 transition-colors">Cancel Dispatch</button>
            </div>
        </div>
    );
};

// Customer Registration Modal Component
const CustomerRegistrationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    initialPhone: string;
    onSave: (customer: any) => void;
    lang: 'en' | 'ar';
}> = ({ isOpen, onClose, initialPhone, onSave, lang }) => {
    const [form, setForm] = useState({
        name: '',
        phone: initialPhone,
        email: '',
        address: '',
        area: '',
        building: '',
        floor: '',
        apartment: '',
        landmark: '',
        notes: ''
    });

    useEffect(() => {
        setForm(f => ({ ...f, phone: initialPhone }));
    }, [initialPhone]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!form.name || !form.phone || !form.address) return;
        onSave({
            id: `CUS-${Date.now()}`,
            ...form,
            createdAt: new Date(),
            visits: 0,
            totalSpent: 0,
            loyaltyTier: 'Bronze'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-app/80 backdrop-blur-md animate-in fade-in">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="bg-card/90 backdrop-blur-xl rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-border/50 animate-in zoom-in-95 slide-in-from-bottom-4 relative z-10">
                <div className="p-6 border-b border-border/50 flex justify-between items-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 pointer-events-none rounded-t-[2.5rem]" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                            <UserPlus size={28} className="text-indigo-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-main uppercase tracking-tight">{lang === 'ar' ? 'تسجيل عميل جديد' : 'New Customer'}</h3>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">{lang === 'ar' ? 'أدخل بيانات العميل' : 'Enter customer details'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3.5 rounded-[1.2rem] bg-elevated hover:bg-rose-500/10 hover:text-rose-500 text-muted transition-all border border-border/50 relative z-10 active:scale-95">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 group">
                            <label className="text-[9px] font-black uppercase text-muted tracking-[0.2em] mb-1.5 block group-focus-within:text-indigo-500 transition-colors">{lang === 'ar' ? 'الاسم *' : 'Name *'}</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-elevated rounded-[1.2rem] py-3.5 px-5 text-sm font-bold outline-none border border-border/50 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-main placeholder-muted" placeholder={lang === 'ar' ? 'اسم العميل' : 'Customer name'} />
                        </div>
                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-muted tracking-[0.2em] mb-1.5 block group-focus-within:text-indigo-500 transition-colors">{lang === 'ar' ? 'الهاتف *' : 'Phone *'}</label>
                            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-elevated rounded-[1.2rem] py-3.5 px-5 text-sm font-bold outline-none border border-border/50 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-main" />
                        </div>
                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-muted tracking-[0.2em] mb-1.5 block group-focus-within:text-indigo-500 transition-colors">{lang === 'ar' ? 'البريد' : 'Email'}</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-elevated rounded-[1.2rem] py-3.5 px-5 text-sm font-bold outline-none border border-border/50 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-main placeholder-muted" placeholder="optional@email.com" />
                        </div>
                    </div>

                    <div className="pt-5 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={16} className="text-cyan-500" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">{lang === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 group">
                                <input type="text" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="w-full bg-elevated rounded-[1.2rem] py-3.5 px-5 text-sm font-bold outline-none border border-border/50 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all text-main placeholder-muted" placeholder={lang === 'ar' ? 'المنطقة' : 'Area/District'} />
                            </div>
                            <div className="col-span-2 group">
                                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full bg-elevated/50 border border-cyan-500/30 rounded-[1.2rem] py-3.5 px-5 text-sm font-bold outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all text-main placeholder-cyan-500/50" placeholder={lang === 'ar' ? 'الشارع والعنوان *' : 'Street Address *'} />
                            </div>
                            <input type="text" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} className="w-full bg-elevated rounded-[1.2rem] py-3.5 px-5 text-sm font-bold outline-none border border-border/50 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all text-main placeholder-muted" placeholder={lang === 'ar' ? 'المبنى' : 'Building'} />
                            <div className="flex gap-2">
                                <input type="text" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} className="w-full bg-elevated rounded-[1.2rem] py-3.5 px-4 text-sm font-bold outline-none border border-border/50 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all text-main placeholder-muted" placeholder={lang === 'ar' ? 'الدور' : 'Floor'} />
                                <input type="text" value={form.apartment} onChange={e => setForm({ ...form, apartment: e.target.value })} className="w-full bg-elevated rounded-[1.2rem] py-3.5 px-4 text-sm font-bold outline-none border border-border/50 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all text-main placeholder-muted" placeholder={lang === 'ar' ? 'الشقة' : 'Apt'} />
                            </div>
                            <div className="col-span-2">
                                <input type="text" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} className="w-full bg-elevated rounded-[1.2rem] py-3.5 px-5 text-sm font-bold outline-none border border-border/50 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all text-main placeholder-muted" placeholder={lang === 'ar' ? 'علامة مميزة' : 'Landmark'} />
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-[9px] font-black uppercase text-muted tracking-[0.2em] mb-1.5 block group-focus-within:text-indigo-500 transition-colors">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full bg-elevated rounded-[1.2rem] py-3.5 px-5 text-sm font-bold outline-none border border-border/50 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-main placeholder-muted resize-none h-24" placeholder={lang === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'} />
                    </div>
                </div>

                <div className="p-6 border-t border-border/50 flex gap-4 bg-app/50 rounded-b-[2.5rem]">
                    <button onClick={onClose} className="flex-1 py-4 rounded-[1.2rem] border border-border/50 bg-elevated text-muted font-black tracking-[0.2em] text-[10px] uppercase hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/50 transition-all active:scale-95 shadow-sm">
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button onClick={handleSubmit} disabled={!form.name || !form.phone || !form.address} className="flex-1 py-4 rounded-[1.2rem] bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black tracking-[0.2em] text-[10px] uppercase hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/25 active:scale-95 disabled:active:scale-100">
                        <Save size={16} /> {lang === 'ar' ? 'حفظ وبدء الطلب' : 'Save & Start'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Order Status Badge Component
const OrderStatusBadge: React.FC<{ status: OrderStatus; lang: 'en' | 'ar' }> = ({ status, lang }) => {
    const config: Record<OrderStatus, { bg: string; text: string; border: string; icon: any; label: { en: string; ar: string } }> = {
        [OrderStatus.PENDING]: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', icon: Clock, label: { en: 'Pending', ar: 'جديد' } },
        [OrderStatus.PREPARING]: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-500', icon: ChefHat, label: { en: 'Preparing', ar: 'تحضير' } },
        [OrderStatus.READY]: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-500', icon: Package, label: { en: 'Ready', ar: 'جاهز' } },
        [OrderStatus.OUT_FOR_DELIVERY]: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-500', icon: Bike, label: { en: 'On the Way', ar: 'في الطريق' } },
        [OrderStatus.DELIVERED]: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', icon: CheckCircle, label: { en: 'Delivered', ar: 'مكتمل' } },
        [OrderStatus.CANCELLED]: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-500', icon: XCircle, label: { en: 'Cancelled', ar: 'ملغي' } },
    };
    const c = config[status];
    const Icon = c.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${c.bg} ${c.text} ${c.border} shadow-sm`}>
            <Icon size={12} className={status === OrderStatus.PENDING || status === OrderStatus.PREPARING || status === OrderStatus.OUT_FOR_DELIVERY ? 'animate-pulse' : ''} /> {c.label[lang]}
        </span>
    );
};

const CallCenter: React.FC = () => {
    // --- Global State ---
    const { customers, addCustomer } = useCRMStore();
    const { branches, settings, printers } = useAuthStore();
    const { categories } = useMenuStore();
    const { orders, placeOrder, discount, setDiscount, fetchOrders } = useOrderStore();

    const lang = (settings.language || 'en') as 'en' | 'ar';
    const t = translations[lang] || translations['en'];
    const currencySymbol = lang === 'ar' ? 'ج.م' : 'EGP';
    const { showToast } = useToast();

    // --- View State ---
    const [activeView, setActiveView] = useState<'order' | 'tracking'>('order');

    // --- Order Creation State ---
    const [phoneSearch, setPhoneSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearched, setCustomerSearched] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [cart, setCart] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [noteInput, setNoteInput] = useState('');

    // Call Center Specific State
    const [isCallActive, setIsCallActive] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [freeDelivery, setFreeDelivery] = useState(false);
    const [heldOrders, setHeldOrders] = useState<any[]>([]);
    const [orderNotes, setOrderNotes] = useState('');
    const [urgentFlag, setUrgentFlag] = useState(false);

    // --- Order Tracking State ---
    const [trackingFilter, setTrackingFilter] = useState<'all' | OrderStatus>(OrderStatus.PENDING);
    const [trackingBranch, setTrackingBranch] = useState<string>('all');
    const [trackingView, setTrackingView] = useState<'grid' | 'list'>('grid');
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<any>(null);

    // --- Timer for active call ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCallActive) {
            interval = setInterval(() => setCallDuration(d => d + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isCallActive]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // --- Menu & Items ---
    const allMenuItems = useMemo(() => categories.flatMap(cat => cat.items.map(item => ({ ...item, categoryId: cat.name }))), [categories]);
    // CategoryTabs expects full category objects (it adds "All" internally)

    const filteredItems = useMemo(() => {
        let items = allMenuItems;
        if (activeCategory !== 'All') items = items.filter(i => i.categoryId === activeCategory);
        if (itemSearchQuery) items = items.filter(i => i.name.toLowerCase().includes(itemSearchQuery.toLowerCase()));
        return items;
    }, [allMenuItems, activeCategory, itemSearchQuery]);

    // --- Customer Search Logic ---
    const handleCustomerSearch = () => {
        if (!phoneSearch.trim()) return;

        const found = customers.find(c => c.phone.includes(phoneSearch) || c.name?.toLowerCase().includes(phoneSearch.toLowerCase()));
        setCustomerSearched(true);

        if (found) {
            setSelectedCustomer(found);
            setDeliveryAddress(found.address || '');
            setIsCallActive(true);
            setCallDuration(0);
        } else {
            // Customer not found - show registration modal
            setSelectedCustomer(null);
            setShowRegistrationModal(true);
        }
    };

    const handleSaveNewCustomer = (customer: any) => {
        addCustomer(customer);
        setSelectedCustomer(customer);
        setDeliveryAddress(customer.address || '');
        setShowRegistrationModal(false);
        setIsCallActive(true);
        setCallDuration(0);
    };

    // --- Cart Functions ---
    const addToCart = (item: any) => {
        const existingItem = cart.find(i => i.id === item.id);
        if (existingItem) {
            updateQuantity(existingItem.cartId, 1);
        } else {
            const cartId = Math.random().toString(36).substr(2, 9);
            setCart([...cart, { ...item, quantity: 1, cartId, notes: '' }]);
        }
    };

    const updateQuantity = (cartId: string, delta: number) => {
        setCart(cart.map(i => i.cartId === cartId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
    };

    const removeFromCart = (cartId: string) => setCart(cart.filter(i => i.cartId !== cartId));
    const updateCartItemNotes = (cartId: string, notes: string) => setCart(cart.map(i => i.cartId === cartId ? { ...i, notes } : i));

    // --- Pricing ---
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (discount / 100);
    const deliveryFee = freeDelivery ? 0 : 15;
    const tax = (subtotal - discountAmount) * 0.14;
    const total = subtotal - discountAmount + tax + deliveryFee;

    // --- Hold Order ---
    const holdCurrentOrder = () => {
        if (cart.length === 0) return;
        setHeldOrders([...heldOrders, {
            id: `HOLD-${Date.now()}`,
            customer: selectedCustomer,
            cart: [...cart],
            timestamp: new Date(),
            notes: orderNotes
        }]);
        resetOrder();
    };

    const recallOrder = (holdId: string) => {
        const order = heldOrders.find(o => o.id === holdId);
        if (order) {
            setSelectedCustomer(order.customer);
            setCart(order.cart);
            setOrderNotes(order.notes);
            setHeldOrders(heldOrders.filter(o => o.id !== holdId));
        }
    };

    const resetOrder = () => {
        setCart([]);
        setSelectedCustomer(null);
        setPhoneSearch('');
        setDeliveryAddress('');
        setOrderNotes('');
        setDiscount(0);
        setFreeDelivery(false);
        setUrgentFlag(false);
        setIsCallActive(false);
        setCallDuration(0);
        setCustomerSearched(false);
    };

    // --- Submit Order ---
    const handleSubmitOrder = async () => {
        if (!selectedBranchId || cart.length === 0 || !selectedCustomer) return;

        try {
            const newOrder: Order = {
                id: `CC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                type: OrderType.DELIVERY,
                branchId: selectedBranchId,
                customerId: selectedCustomer?.id,
                customerName: selectedCustomer?.name,
                customerPhone: selectedCustomer?.phone,
                deliveryAddress: deliveryAddress,
                isCallCenterOrder: true,
                items: cart,
                status: OrderStatus.PENDING,
                subtotal,
                tax,
                total,
                createdAt: new Date(),
                notes: orderNotes,
                freeDelivery: freeDelivery,
                isUrgent: urgentFlag,
                discount: discount
            };

            const savedOrder = await placeOrder(newOrder);
            const activeBranch = branches.find(b => b.id === selectedBranchId);
            await printKitchenTicketsByRouting({
                order: savedOrder,
                categories,
                printers,
                branchId: selectedBranchId,
                maxKitchenPrinters: settings.maxKitchenPrinters,
                settings,
                currencySymbol: settings.currencySymbol,
                lang,
                t,
                branch: activeBranch
            });
            const shouldPrintOnSubmit = (settings.autoPrintReceiptOnSubmit ?? settings.autoPrintReceipt ?? false) === true;
            if (shouldPrintOnSubmit) {
                await printOrderReceipt({
                    order: savedOrder,
                    printers,
                    settings,
                    currencySymbol: settings.currencySymbol,
                    lang,
                    t,
                    branch: activeBranch,
                    title: t.order_receipt || (lang === 'ar' ? 'إيصال الطلب' : 'Order Receipt')
                });
            }
            resetOrder();
            showToast(lang === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Order sent successfully', 'success');
        } catch (error: any) {
            showToast(getActionableErrorMessage(error, lang), 'error');
        }
    };

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'F1') { e.preventDefault(); document.getElementById('customer-search')?.focus(); }
            if (e.key === 'F2') { e.preventDefault(); document.getElementById('item-search')?.focus(); }
            if (e.key === 'F3') { e.preventDefault(); handleSubmitOrder(); }
            if (e.key === 'F4') { e.preventDefault(); holdCurrentOrder(); }
            if (e.key === 'F5') { e.preventDefault(); resetOrder(); }
            if (e.key === 'Escape') { resetOrder(); }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [cart, selectedBranchId, selectedCustomer]);

    // --- Order Tracking Data ---
    const callCenterOrders = useMemo(() => {
        return orders.filter(o => o.isCallCenterOrder);
    }, [orders]);

    const filteredTrackingOrders = useMemo(() => {
        let filtered = callCenterOrders;
        if (trackingFilter !== 'all') {
            filtered = filtered.filter(o => o.status === trackingFilter);
        }
        if (trackingBranch !== 'all') {
            filtered = filtered.filter(o => o.branchId === trackingBranch);
        }
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [callCenterOrders, trackingFilter, trackingBranch]);

    // --- Stats ---
    const todayOrders = callCenterOrders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
    const pendingCount = callCenterOrders.filter(o => o.status === OrderStatus.PENDING).length;
    const preparingCount = callCenterOrders.filter(o => o.status === OrderStatus.PREPARING).length;
    const outForDeliveryCount = callCenterOrders.filter(o => o.status === OrderStatus.OUT_FOR_DELIVERY).length;
    const deliveredTodayCount = todayOrders.filter(o => o.status === OrderStatus.DELIVERED).length;

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="flex flex-col min-h-screen app-viewport overflow-hidden bg-app">

            {/* ==================== TOP HEADER ==================== */}
            <div className="bg-card/80 backdrop-blur-xl border-b border-border/50 px-6 py-4 shrink-0 shadow-sm z-30 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 pointer-events-none" />
                <div className="max-w-[1800px] mx-auto px-4 md:px-6 flex flex-col lg:flex-row lg:items-center gap-6 relative z-10">

                    {/* View Switcher */}
                    <div className="flex bg-card/50 backdrop-blur-md rounded-[1.5rem] p-1.5 border border-border/50 shadow-sm">
                        <button
                            onClick={() => setActiveView('order')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeView === 'order' ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 scale-105' : 'text-muted hover:text-main'}`}
                        >
                            <Headset size={16} /> {lang === 'ar' ? 'طلب جديد' : 'New Order'}
                        </button>
                        <button
                            onClick={() => setActiveView('tracking')}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeView === 'tracking' ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 scale-105' : 'text-muted hover:text-main'}`}
                        >
                            <Activity size={16} /> {lang === 'ar' ? 'متابعة الطلبات' : 'Order Tracking'}
                            {pendingCount > 0 && (
                                <span className="bg-white text-indigo-500 text-[9px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse">{pendingCount}</span>
                            )}
                        </button>
                    </div>

                    {activeView === 'order' && (
                        <>
                            {/* Call Status Indicator */}
                            <div className={`flex items-center gap-4 px-5 py-2.5 rounded-[1.5rem] border transition-all duration-300 shadow-sm ${isCallActive ? 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10' : 'bg-card/50 border-border/50'}`}>
                                <button onClick={() => setIsCallActive(!isCallActive)} className={`p-3 rounded-2xl transition-all duration-300 ${isCallActive ? 'bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-500/30' : 'bg-elevated text-muted hover:bg-emerald-500/10 hover:text-emerald-500'}`}>
                                    {isCallActive ? <PhoneCall size={18} /> : <PhoneOff size={18} />}
                                </button>
                                <div className="text-center min-w-[60px]">
                                    <p className={`text-2xl font-black tracking-tighter ${isCallActive ? 'text-emerald-500' : 'text-muted'}`}>{formatDuration(callDuration)}</p>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">{isCallActive ? (lang === 'ar' ? 'مكالمة نشطة' : 'Active') : (lang === 'ar' ? 'انتظار' : 'Idle')}</p>
                                </div>
                            </div>

                            {/* Customer Search */}
                            <div className="flex-1 relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[1.5rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
                                <Phone size={18} className={`absolute top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors z-10 ${lang === 'ar' ? 'right-5' : 'left-5'}`} />
                                <input
                                    id="customer-search"
                                    type="text"
                                    placeholder={lang === 'ar' ? 'أدخل رقم الهاتف (F1)...' : 'Enter Phone Number (F1)...'}
                                    className={`relative w-full bg-card/90 backdrop-blur-sm border border-border/50 rounded-[1.5rem] py-4 ${lang === 'ar' ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5'} font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm text-main`}
                                    value={phoneSearch}
                                    onChange={(e) => { setPhoneSearch(e.target.value); setCustomerSearched(false); }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                                />
                            </div>

                            <button onClick={handleCustomerSearch} className="h-[56px] bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-indigo-500/25 active:scale-95 shrink-0">
                                <Search size={18} /> {lang === 'ar' ? 'بحث' : 'Search'}
                            </button>
                        </>
                    )}

                    {/* Quick Stats */}
                    <div className="hidden xl:flex items-center gap-4 px-6 py-3 bg-card/50 backdrop-blur-md border border-border/50 rounded-[1.5rem] shadow-sm">
                        <div className="text-center px-4 border-r border-border/50">
                            <p className="text-xl font-black text-amber-500">{pendingCount}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">{lang === 'ar' ? 'جديد' : 'New'}</p>
                        </div>
                        <div className="text-center px-4 border-r border-border/50">
                            <p className="text-xl font-black text-cyan-500">{preparingCount}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">{lang === 'ar' ? 'تحضير' : 'Prep'}</p>
                        </div>
                        <div className="text-center px-4 border-r border-border/50">
                            <p className="text-xl font-black text-indigo-500">{outForDeliveryCount}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">{lang === 'ar' ? 'توصيل' : 'OFD'}</p>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-xl font-black text-emerald-500">{deliveredTodayCount}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">{lang === 'ar' ? 'تم' : 'Done'}</p>
                        </div>
                    </div>

                    {activeView === 'order' && (
                        <button onClick={resetOrder} className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all" title="New Call (F5)">
                            <RefreshCcw size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* ==================== ORDER VIEW ==================== */}
            {activeView === 'order' && (
                <>
                    {/* Customer Context or "Not Found" Message */}
                    {customerSearched && !selectedCustomer && !showRegistrationModal && (
                        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 animate-in slide-in-from-top-2">
                            <div className="max-w-[1800px] mx-auto px-4 md:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-[1.5rem] bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shadow-inner">
                                        <AlertCircle size={28} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-main uppercase tracking-tight">{lang === 'ar' ? 'العميل غير مسجل' : 'Customer Not Found'}</p>
                                        <p className="text-xs font-bold text-muted mt-0.5">{lang === 'ar' ? 'هل تريد تسجيل عميل جديد بهذا الرقم؟' : 'Would you like to register a new customer?'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowRegistrationModal(true)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-[1.5rem] font-black tracking-[0.2em] text-[10px] uppercase hover:opacity-90 transition-all shadow-xl shadow-indigo-500/25 active:scale-95">
                                    <UserPlus size={16} /> {lang === 'ar' ? 'تسجيل عميل جديد' : 'Register New Customer'}
                                </button>
                            </div>
                        </div>
                    )}

                    {selectedCustomer && (
                        <div className="bg-card/90 backdrop-blur-xl border-b border-border/50 px-6 py-4 animate-in slide-in-from-top-2 duration-300 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-cyan-500/5 to-indigo-500/5 pointer-events-none" />
                            <div className="max-w-[1800px] mx-auto px-4 md:px-6 flex flex-col lg:flex-row lg:items-center gap-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/30">
                                        {selectedCustomer.name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-main uppercase tracking-tight">{selectedCustomer.name}</p>
                                        <p className="text-sm text-muted font-bold tracking-widest">{selectedCustomer.phone}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-5 py-3 rounded-[1.5rem] shadow-inner">
                                    <Star size={20} className="text-amber-500 animate-pulse" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">{lang === 'ar' ? 'الولاء' : 'Loyalty'}</p>
                                        <p className="text-sm font-black text-main">{selectedCustomer.loyaltyTier || 'Bronze'} • {selectedCustomer.visits || 0} {lang === 'ar' ? 'طلب' : 'orders'}</p>
                                    </div>
                                </div>

                                <div className="flex-1 group">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-1.5">{lang === 'ar' ? 'العنوان' : 'Address'}</p>
                                    <div className="flex items-center gap-3 bg-elevated/50 px-5 py-3 rounded-[1.5rem] border border-border/50 group-focus-within:border-indigo-500/50 transition-colors shadow-sm">
                                        <MapPinned size={18} className="text-indigo-500" />
                                        <input
                                            type="text"
                                            value={deliveryAddress}
                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                            className="flex-1 bg-transparent text-sm font-bold outline-none text-main placeholder-muted"
                                            placeholder={lang === 'ar' ? 'أدخل العنوان...' : 'Enter address...'}
                                        />
                                    </div>
                                </div>

                                <button onClick={() => { setSelectedCustomer(null); setIsCallActive(false); setCustomerSearched(false); }} className="p-3.5 rounded-[1.5rem] bg-elevated hover:bg-rose-500/10 text-muted hover:text-rose-500 transition-all border border-border/50 shadow-sm active:scale-95">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Main Content - Only show if customer selected */}
                    {selectedCustomer ? (
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Menu Area */}
                            <div className="flex-1 flex flex-col min-w-0">
                                <div className="bg-card/60 backdrop-blur-xl px-6 py-4 border-b border-border/50 flex flex-wrap justify-between items-center gap-4 relative z-10">
                                    <CategoryTabs categories={categories} activeCategory={activeCategory} onSetCategory={setActiveCategory} isTouchMode={false} lang={lang} t={t} />
                                    <div className="relative w-80 group">
                                        <Search className={`absolute top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors z-10 ${lang === 'ar' ? 'right-5' : 'left-5'}`} size={18} />
                                        <input id="item-search" type="text" placeholder={lang === 'ar' ? 'بحث عن منتج (F2)...' : 'Search Product (F2)...'} className={`w-full bg-elevated/50 border border-border/50 rounded-[1.5rem] py-3.5 ${lang === 'ar' ? 'pr-12 pl-5' : 'pl-12 pr-5'} text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all text-main`} value={itemSearchQuery} onChange={(e) => setItemSearchQuery(e.target.value)} />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                                    <ItemGrid items={filteredItems} onAddItem={addToCart} currencySymbol={currencySymbol} isTouchMode={false} />
                                </div>

                                {heldOrders.length > 0 && (
                                    <div className="bg-amber-500/10 border-t border-amber-500/20 px-6 py-3">
                                        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                                            <div className="flex items-center gap-2 text-amber-600 shrink-0">
                                                <Pause size={16} />
                                                <span className="text-xs font-black uppercase">{lang === 'ar' ? 'معلقة' : 'Held'} ({heldOrders.length})</span>
                                            </div>
                                            {heldOrders.map(order => (
                                                <button key={order.id} onClick={() => recallOrder(order.id)} className="shrink-0 flex items-center gap-2 px-4 py-2 card-primary rounded-xl border border-amber-300 dark:border-amber-800 hover:bg-amber-50 transition-all">
                                                    <Play size={12} className="text-amber-600" />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-white">{order.customer?.name || 'Guest'}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Panel: Cart */}
                            <div className="w-full lg:w-[480px] bg-card/90 backdrop-blur-2xl border-l border-border/50 flex flex-col shadow-2xl relative z-20">
                                <div className="px-6 py-5 border-b border-border/50 flex justify-between items-center">
                                    <h3 className="text-lg font-black text-main uppercase tracking-widest flex items-center gap-3">
                                        <ShoppingBag size={22} className="text-indigo-500" /> {lang === 'ar' ? 'السلة' : 'Cart'}
                                    </h3>
                                    <span className="bg-indigo-500/10 text-indigo-500 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border border-indigo-500/20">{cart.length} ITEMS</span>
                                </div>

                                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 no-scrollbar">
                                    {cart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-16">
                                            <ShoppingBag size={48} className="mb-4 opacity-50" />
                                            <p className="text-xs font-black uppercase opacity-50">{t.empty_cart}</p>
                                        </div>
                                    ) : cart.map(item => (
                                        <CartItem key={item.cartId} item={item} currencySymbol={currencySymbol} isTouchMode={false} lang={lang} onEditNote={(id, note) => { setEditingItemId(id); setNoteInput(note); }} onEditSeat={() => { }} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} />
                                    ))}
                                </div>

                                {/* Quick Actions */}
                                <div className="px-5 py-4 border-t border-border/50 space-y-4 bg-app/50">
                                    <div className="grid grid-cols-5 gap-2">
                                        {[0, 5, 10, 15, 20].map(d => (
                                            <button key={d} onClick={() => setDiscount(d)} className={`py-2.5 rounded-[1rem] text-[10px] font-black transition-all ${discount === d ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md' : 'bg-elevated text-muted hover:bg-indigo-500/10 border border-border/50 hover:text-indigo-500'}`}>{d}%</button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setFreeDelivery(!freeDelivery)} className={`flex items-center justify-center gap-2 py-3.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${freeDelivery ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-elevated text-muted border border-border/50 hover:border-emerald-500/30'}`}>
                                            <Bike size={16} /> {lang === 'ar' ? 'توصيل مجاني' : 'Free Delivery'}
                                        </button>
                                        <button onClick={() => setUrgentFlag(!urgentFlag)} className={`flex items-center justify-center gap-2 py-3.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${urgentFlag ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/25' : 'bg-elevated text-muted border border-border/50 hover:border-rose-500/30'}`}>
                                            <Zap size={16} /> {lang === 'ar' ? 'عاجل' : 'Urgent'}
                                        </button>
                                    </div>
                                    <input type="text" placeholder={lang === 'ar' ? 'ملاحظات التوصيل...' : 'Delivery notes...'} value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} className="w-full bg-elevated rounded-[1.2rem] py-3.5 px-5 text-sm font-bold outline-none border border-border/50 focus:border-indigo-500/50 text-main placeholder-muted" />
                                    <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} className="w-full bg-elevated rounded-[1.2rem] py-3.5 px-5 text-sm font-bold outline-none border border-border/50 focus:border-indigo-500/50 text-main">
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>

                                {/* Pricing & Submit */}
                                <div className="px-6 py-5 bg-card/80 backdrop-blur-xl border-t border-border/50 relative z-20">
                                    <div className="space-y-1.5 mb-5">
                                        <div className="flex justify-between text-[11px] font-black tracking-widest uppercase text-muted"><span>Subtotal</span><span className="text-main">{subtotal.toFixed(2)}</span></div>
                                        {discount > 0 && <div className="flex justify-between text-[11px] font-black tracking-widest uppercase text-emerald-500"><span>Discount ({discount}%)</span><span>-{discountAmount.toFixed(2)}</span></div>}
                                        <div className="flex justify-between text-[11px] font-black tracking-widest uppercase text-muted"><span>Tax (14%)</span><span className="text-main">{tax.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-[11px] font-black tracking-widest uppercase text-muted"><span>Delivery</span><span className={freeDelivery ? 'text-emerald-500' : 'text-main'}>{freeDelivery ? 'FREE' : deliveryFee.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-2xl font-black text-indigo-500 pt-3 border-t border-border/50 mt-2"><span>Total</span><span>{total.toFixed(2)} <span className="text-sm font-bold opacity-50">{currencySymbol}</span></span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={holdCurrentOrder} disabled={cart.length === 0} className="h-14 rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/30 disabled:opacity-30 disabled:pointer-events-none hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2">
                                            <Pause size={16} /> Hold (F4)
                                        </button>
                                        <button onClick={handleSubmitOrder} disabled={cart.length === 0} className={`h-14 rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all ${cart.length === 0 ? 'bg-elevated text-muted' : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-xl shadow-indigo-500/25 hover:opacity-90 active:scale-95'}`}>
                                            Send (F3) <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-indigo-500/10 flex items-center justify-center">
                                    <Phone size={40} className="text-indigo-400" />
                                </div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">{lang === 'ar' ? 'ابدأ بالبحث عن العميل' : 'Start by Searching Customer'}</h2>
                                <p className="text-sm text-slate-400 mb-6">{lang === 'ar' ? 'أدخل رقم الهاتف للبحث أو تسجيل عميل جديد' : 'Enter phone number to search or register new customer'}</p>
                                <p className="text-xs text-slate-400">Press <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded font-mono">F1</kbd> to focus search</p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ==================== TRACKING VIEW ==================== */}
            {activeView === 'tracking' && (
                <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 pointer-events-none" />

                    {/* Filters Bar */}
                    <div className="bg-card/60 backdrop-blur-xl px-6 py-4 border-b border-border/50 flex flex-wrap items-center gap-4 relative z-20">
                        <div className="flex bg-elevated rounded-[1.5rem] p-1.5 border border-border/50">
                            {[
                                { value: 'all', label: lang === 'ar' ? 'الكل' : 'All', count: callCenterOrders.length },
                                { value: OrderStatus.PENDING, label: lang === 'ar' ? 'جديد' : 'New', count: pendingCount },
                                { value: OrderStatus.PREPARING, label: lang === 'ar' ? 'تحضير' : 'Prep', count: preparingCount },
                                { value: OrderStatus.OUT_FOR_DELIVERY, label: lang === 'ar' ? 'توصيل' : 'OFD', count: outForDeliveryCount },
                                { value: OrderStatus.DELIVERED, label: lang === 'ar' ? 'تم' : 'Done', count: callCenterOrders.filter(o => o.status === OrderStatus.DELIVERED).length },
                            ].map(f => (
                                <button key={f.value} onClick={() => setTrackingFilter(f.value as any)} className={`px-5 py-2.5 rounded-[1.2rem] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${trackingFilter === f.value ? 'bg-indigo-500 text-white shadow-md' : 'text-muted hover:text-main'}`}>
                                    {f.label}
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-widest ${trackingFilter === f.value ? 'bg-white/20 text-white' : 'bg-card text-muted'}`}>{f.count}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex-1" />

                        <select value={trackingBranch} onChange={(e) => setTrackingBranch(e.target.value)} className="bg-elevated rounded-[1.2rem] py-3.5 px-5 text-sm font-bold outline-none border border-border/50 focus:border-indigo-500/50 text-main transition-colors shadow-sm">
                            <option value="all">{lang === 'ar' ? 'كل الفروع' : 'All Branches'}</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>

                        <div className="flex bg-elevated rounded-[1.2rem] p-1.5 border border-border/50 shadow-sm">
                            <button onClick={() => setTrackingView('grid')} className={`p-2.5 rounded-xl transition-all ${trackingView === 'grid' ? 'bg-card shadow-sm text-indigo-500' : 'text-muted hover:text-main'}`}><LayoutGrid size={18} /></button>
                            <button onClick={() => setTrackingView('list')} className={`p-2.5 rounded-xl transition-all ${trackingView === 'list' ? 'bg-card shadow-sm text-indigo-500' : 'text-muted hover:text-main'}`}><List size={18} /></button>
                        </div>
                    </div>

                    {/* Orders Grid/List */}
                    <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative z-20">
                        {filteredTrackingOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted">
                                <Package size={64} className="mb-6 opacity-20" />
                                <p className="text-xl font-black uppercase tracking-widest">{lang === 'ar' ? 'لا توجد طلبات' : 'No orders found'}</p>
                            </div>
                        ) : trackingView === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                {filteredTrackingOrders.map(order => (
                                    <div key={order.id} className={`bg-card/80 backdrop-blur-md rounded-[2rem] border p-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group ${order.isUrgent ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20' : 'border-border/50 shadow-sm'}`}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div>
                                                <p className="text-sm font-black text-indigo-500">#{order.id}</p>
                                                <p className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                            <OrderStatusBadge status={order.status} lang={lang} />
                                        </div>

                                        <div className="space-y-3 mb-5 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0"><User size={14} className="text-indigo-500" /></div>
                                                <span className="text-sm font-black text-main">{order.customerName || 'Guest'}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0"><Phone size={14} className="text-cyan-500" /></div>
                                                <span className="text-xs font-bold text-muted">{order.customerPhone}</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0 mt-0.5"><MapPin size={14} className="text-emerald-500" /></div>
                                                <span className="text-xs font-bold text-muted line-clamp-2 pt-1.5">{order.deliveryAddress}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-border/50 relative z-10">
                                            <div className="flex items-center gap-2 bg-elevated px-3 py-1.5 rounded-xl border border-border/50">
                                                <Building2 size={12} className="text-muted" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted">{branches.find(b => b.id === order.branchId)?.name}</span>
                                            </div>
                                            <span className="text-xl font-black text-main">{order.total?.toFixed(2)} <span className="text-[10px] tracking-widest opacity-50">{currencySymbol}</span></span>
                                        </div>

                                        {order.isUrgent && (
                                            <div className="mt-4 flex items-center justify-center gap-2 text-rose-500 bg-rose-500/10 py-2 rounded-xl border border-rose-500/20 relative z-10">
                                                <Zap size={14} className="animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{lang === 'ar' ? 'عاجل' : 'Urgent'}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3 relative z-10">
                                {filteredTrackingOrders.map(order => (
                                    <div key={order.id} className={`bg-card/80 backdrop-blur-md rounded-[1.5rem] border p-5 flex items-center gap-6 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 overflow-hidden relative group ${order.isUrgent ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-border/50 shadow-sm'}`}>
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
                                        <div className="w-24 relative z-10">
                                            <p className="text-sm font-black text-indigo-500">#{order.id}</p>
                                            <p className="text-[10px] font-bold text-muted mt-0.5 uppercase tracking-widest">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="flex-1 relative z-10">
                                            <p className="text-sm font-black text-main">{order.customerName}</p>
                                            <p className="text-xs font-bold text-muted truncate">{order.deliveryAddress}</p>
                                        </div>
                                        <div className="text-center relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">{lang === 'ar' ? 'الفرع' : 'Branch'}</p>
                                            <p className="text-xs font-bold text-main">{branches.find(b => b.id === order.branchId)?.name}</p>
                                        </div>
                                        <div className="relative z-10">
                                            <OrderStatusBadge status={order.status} lang={lang} />
                                        </div>
                                        {order.status === OrderStatus.READY && (
                                            <button
                                                onClick={() => { setSelectedTrackingOrder(order); setShowDriverModal(true); }}
                                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-indigo-500/25 relative z-10"
                                            >
                                                Dispatch
                                            </button>
                                        )}
                                        <p className="text-2xl font-black text-main w-36 text-right relative z-10">
                                            {order.total?.toFixed(2)} <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{currencySymbol}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            <CustomerRegistrationModal
                isOpen={showRegistrationModal}
                onClose={() => setShowRegistrationModal(false)}
                initialPhone={phoneSearch}
                onSave={handleSaveNewCustomer}
                lang={lang}
            />

            <DriverAssignmentModal
                isOpen={showDriverModal}
                onClose={() => setShowDriverModal(false)}
                onAssign={async (driverId) => {
                    if (!selectedTrackingOrder?.id) return;
                    await deliveryApi.assign({ orderId: selectedTrackingOrder.id, driverId });
                    await fetchOrders();
                }}
                branchId={selectedTrackingOrder?.branchId || ''}
                orderId={selectedTrackingOrder?.id}
                lang={lang}
            />

            <NoteModal
                isOpen={!!editingItemId}
                onClose={() => setEditingItemId(null)}
                note={noteInput}
                onNoteChange={setNoteInput}
                onSave={() => { if (editingItemId) updateCartItemNotes(editingItemId, noteInput); setEditingItemId(null); }}
                lang={lang}
                t={t}
            />
        </div>
    );
};

export default CallCenter;

