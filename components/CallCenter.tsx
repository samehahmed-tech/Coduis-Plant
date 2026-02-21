
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Assign Dispatcher</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select driver for branch: {branchId} {orderId ? `| Order ${orderId}` : ''}</p>
                </div>

                <div className="space-y-3">
                    {isLoading && (
                        <div className="p-6 text-center text-xs font-bold text-slate-500">Loading drivers...</div>
                    )}
                    {!isLoading && errorMessage && (
                        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">{errorMessage}</div>
                    )}
                    {!isLoading && !errorMessage && drivers.length === 0 && (
                        <div className="p-6 text-center text-xs font-bold text-slate-500">No drivers available for this branch.</div>
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
                                className={`w-full p-6 rounded-2xl flex items-center justify-between transition-all ${isAvailable ? 'bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white group' : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-900'}`}
                            >
                                <div className="text-left">
                                    <p className="font-black uppercase text-xs tracking-tight">{driver.name || driver.fullName || 'Driver'}</p>
                                    <p className="text-[10px] font-bold opacity-60 tracking-widest">{driver.phone || '-'}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${isAvailable ? 'bg-emerald-500/10 text-emerald-600 group-hover:bg-white group-hover:text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {isAssigningThisDriver ? 'ASSIGNING' : String(driver.status || 'UNKNOWN')}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <button onClick={onClose} className="w-full mt-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-colors">Cancel Dispatch</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <UserPlus size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">{lang === 'ar' ? 'تسجيل عميل جديد' : 'New Customer'}</h3>
                            <p className="text-xs text-slate-400">{lang === 'ar' ? 'أدخل بيانات العميل' : 'Enter customer details'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">{lang === 'ar' ? 'الاسم *' : 'Name *'}</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder={lang === 'ar' ? 'اسم العميل' : 'Customer name'} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">{lang === 'ar' ? 'الهاتف *' : 'Phone *'}</label>
                            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">{lang === 'ar' ? 'البريد' : 'Email'}</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase text-slate-500 mb-3">{lang === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <input type="text" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder={lang === 'ar' ? 'المنطقة' : 'Area/District'} />
                            </div>
                            <div className="col-span-2">
                                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder={lang === 'ar' ? 'الشارع والعنوان *' : 'Street Address *'} />
                            </div>
                            <input type="text" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder={lang === 'ar' ? 'المبنى' : 'Building'} />
                            <div className="flex gap-2">
                                <input type="text" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder={lang === 'ar' ? 'الدور' : 'Floor'} />
                                <input type="text" value={form.apartment} onChange={e => setForm({ ...form, apartment: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder={lang === 'ar' ? 'الشقة' : 'Apt'} />
                            </div>
                            <div className="col-span-2">
                                <input type="text" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder={lang === 'ar' ? 'علامة مميزة' : 'Landmark'} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-20" placeholder={lang === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'} />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-50 transition-colors">
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button onClick={handleSubmit} disabled={!form.name || !form.phone || !form.address} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <Save size={16} /> {lang === 'ar' ? 'حفظ وبدء الطلب' : 'Save & Start Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Order Status Badge Component
const OrderStatusBadge: React.FC<{ status: OrderStatus; lang: 'en' | 'ar' }> = ({ status, lang }) => {
    const config: Record<OrderStatus, { bg: string; text: string; icon: any; label: { en: string; ar: string } }> = {
        [OrderStatus.PENDING]: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600', icon: Clock, label: { en: 'Pending', ar: 'جديد' } },
        [OrderStatus.PREPARING]: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600', icon: ChefHat, label: { en: 'Preparing', ar: 'قيد التحضير' } },
        [OrderStatus.READY]: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600', icon: Package, label: { en: 'Ready', ar: 'جاهز' } },
        [OrderStatus.OUT_FOR_DELIVERY]: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600', icon: Bike, label: { en: 'On the Way', ar: 'في الطريق' } },
        [OrderStatus.DELIVERED]: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600', icon: CheckCircle, label: { en: 'Delivered', ar: 'تم التوصيل' } },
        [OrderStatus.CANCELLED]: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600', icon: XCircle, label: { en: 'Cancelled', ar: 'ملغي' } },
    };
    const c = config[status];
    const Icon = c.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${c.bg} ${c.text}`}>
            <Icon size={12} /> {c.label[lang]}
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
        <div className="flex flex-col app-viewport overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">

            {/* ==================== TOP HEADER ==================== */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-3 shrink-0 shadow-sm z-30">
                <div className="max-w-[1800px] mx-auto px-4 md:px-6 flex flex-col lg:flex-row lg:items-center gap-4">

                    {/* View Switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
                        <button
                            onClick={() => setActiveView('order')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeView === 'order' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Headset size={14} /> {lang === 'ar' ? 'طلب جديد' : 'New Order'}
                        </button>
                        <button
                            onClick={() => setActiveView('tracking')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeView === 'tracking' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Activity size={14} /> {lang === 'ar' ? 'متابعة الطلبات' : 'Order Tracking'}
                            {pendingCount > 0 && (
                                <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">{pendingCount}</span>
                            )}
                        </button>
                    </div>

                    {activeView === 'order' && (
                        <>
                            {/* Call Status Indicator */}
                            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${isCallActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                <button onClick={() => setIsCallActive(!isCallActive)} className={`p-2 rounded-xl transition-all ${isCallActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                    {isCallActive ? <PhoneCall size={16} /> : <PhoneOff size={16} />}
                                </button>
                                <div className="text-center">
                                    <p className={`text-xl font-black tracking-tight ${isCallActive ? 'text-emerald-600' : 'text-slate-400'}`}>{formatDuration(callDuration)}</p>
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{isCallActive ? (lang === 'ar' ? 'مكالمة نشطة' : 'Active') : (lang === 'ar' ? 'انتظار' : 'Idle')}</p>
                                </div>
                            </div>

                            {/* Customer Search */}
                            <div className="flex-1 relative">
                                <Phone size={16} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
                                <input
                                    id="customer-search"
                                    type="text"
                                    placeholder={lang === 'ar' ? 'أدخل رقم الهاتف (F1)...' : 'Enter Phone Number (F1)...'}
                                    className={`w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 ${lang === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all`}
                                    value={phoneSearch}
                                    onChange={(e) => { setPhoneSearch(e.target.value); setCustomerSearched(false); }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                                />
                            </div>

                            <button onClick={handleCustomerSearch} className="h-12 bg-indigo-600 text-white px-6 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                                <Search size={16} /> {lang === 'ar' ? 'بحث' : 'Search'}
                            </button>
                        </>
                    )}

                    {/* Quick Stats */}
                    <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                        <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
                            <p className="text-lg font-black text-amber-500">{pendingCount}</p>
                            <p className="text-[8px] font-black uppercase text-slate-400">{lang === 'ar' ? 'جديد' : 'New'}</p>
                        </div>
                        <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
                            <p className="text-lg font-black text-blue-500">{preparingCount}</p>
                            <p className="text-[8px] font-black uppercase text-slate-400">{lang === 'ar' ? 'تحضير' : 'Prep'}</p>
                        </div>
                        <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
                            <p className="text-lg font-black text-indigo-500">{outForDeliveryCount}</p>
                            <p className="text-[8px] font-black uppercase text-slate-400">{lang === 'ar' ? 'توصيل' : 'OFD'}</p>
                        </div>
                        <div className="text-center px-3">
                            <p className="text-lg font-black text-emerald-500">{deliveredTodayCount}</p>
                            <p className="text-[8px] font-black uppercase text-slate-400">{lang === 'ar' ? 'تم' : 'Done'}</p>
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
                            <div className="max-w-[1800px] mx-auto px-4 md:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                                        <AlertCircle size={24} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">{lang === 'ar' ? 'العميل غير مسجل' : 'Customer Not Found'}</p>
                                        <p className="text-xs text-slate-500">{lang === 'ar' ? 'هل تريد تسجيل عميل جديد بهذا الرقم؟' : 'Would you like to register a new customer?'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowRegistrationModal(true)} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
                                    <UserPlus size={16} /> {lang === 'ar' ? 'تسجيل عميل جديد' : 'Register New Customer'}
                                </button>
                            </div>
                        </div>
                    )}

                    {selectedCustomer && (
                        <div className="bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-indigo-500/5 dark:from-indigo-900/20 dark:via-violet-900/20 dark:to-indigo-900/20 border-b border-indigo-200/30 dark:border-indigo-800/30 px-6 py-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="max-w-[1800px] mx-auto px-4 md:px-6 flex flex-col lg:flex-row lg:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/30">
                                        {selectedCustomer.name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{selectedCustomer.name}</p>
                                        <p className="text-xs text-slate-500 font-bold">{selectedCustomer.phone}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl">
                                    <Star size={14} className="text-amber-500" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">{lang === 'ar' ? 'الولاء' : 'Loyalty'}</p>
                                        <p className="text-xs font-black text-slate-800 dark:text-white">{selectedCustomer.loyaltyTier || 'Bronze'} • {selectedCustomer.visits || 0} {lang === 'ar' ? 'طلب' : 'orders'}</p>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{lang === 'ar' ? 'العنوان' : 'Address'}</p>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl">
                                        <MapPinned size={14} className="text-indigo-500" />
                                        <input
                                            type="text"
                                            value={deliveryAddress}
                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                            className="flex-1 bg-transparent text-sm font-bold outline-none"
                                            placeholder={lang === 'ar' ? 'أدخل العنوان...' : 'Enter address...'}
                                        />
                                    </div>
                                </div>

                                <button onClick={() => { setSelectedCustomer(null); setIsCallActive(false); setCustomerSearched(false); }} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Main Content - Only show if customer selected */}
                    {selectedCustomer ? (
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Menu Area */}
                            <div className="flex-1 flex flex-col min-w-0">
                                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-wrap justify-between items-center gap-4">
                                    <CategoryTabs categories={categories} activeCategory={activeCategory} onSetCategory={setActiveCategory} isTouchMode={false} lang={lang} t={t} />
                                    <div className="relative w-72">
                                        <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${lang === 'ar' ? 'right-4' : 'left-4'}`} size={16} />
                                        <input id="item-search" type="text" placeholder={lang === 'ar' ? 'بحث عن منتج (F2)...' : 'Search Product (F2)...'} className={`w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2.5 ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-10 pr-4'} text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/30`} value={itemSearchQuery} onChange={(e) => setItemSearchQuery(e.target.value)} />
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
                                                <button key={order.id} onClick={() => recallOrder(order.id)} className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-800 hover:bg-amber-50 transition-all">
                                                    <Play size={12} className="text-amber-600" />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-white">{order.customer?.name || 'Guest'}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Panel: Cart */}
                            <div className="w-full lg:w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
                                        <ShoppingBag size={20} className="text-indigo-600" /> {lang === 'ar' ? 'السلة' : 'Cart'}
                                    </h3>
                                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-black">{cart.length}</span>
                                </div>

                                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 no-scrollbar">
                                    {cart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-16">
                                            <ShoppingBag size={48} className="mb-4 opacity-50" />
                                            <p className="text-xs font-black uppercase opacity-50">{t.empty_cart}</p>
                                        </div>
                                    ) : cart.map(item => (
                                        <CartItem key={item.cartId} item={item} currencySymbol={currencySymbol} isTouchMode={false} lang={lang} onEditNote={(id, note) => { setEditingItemId(id); setNoteInput(note); }} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} />
                                    ))}
                                </div>

                                {/* Quick Actions */}
                                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                    <div className="grid grid-cols-5 gap-1">
                                        {[0, 5, 10, 15, 20].map(d => (
                                            <button key={d} onClick={() => setDiscount(d)} className={`py-2 rounded-lg text-[10px] font-black transition-all ${discount === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-100'}`}>{d}%</button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setFreeDelivery(!freeDelivery)} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${freeDelivery ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            <Bike size={14} /> {lang === 'ar' ? 'توصيل مجاني' : 'Free Delivery'}
                                        </button>
                                        <button onClick={() => setUrgentFlag(!urgentFlag)} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${urgentFlag ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            <Zap size={14} /> {lang === 'ar' ? 'عاجل' : 'Urgent'}
                                        </button>
                                    </div>
                                    <input type="text" placeholder={lang === 'ar' ? 'ملاحظات التوصيل...' : 'Delivery notes...'} value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold outline-none" />
                                    <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold outline-none">
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>

                                {/* Pricing & Submit */}
                                <div className="px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                                    <div className="space-y-1 mb-4">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
                                        {discount > 0 && <div className="flex justify-between text-[10px] font-bold text-emerald-500"><span>Discount ({discount}%)</span><span>-{discountAmount.toFixed(2)}</span></div>}
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400"><span>Tax (14%)</span><span>{tax.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400"><span>Delivery</span><span>{freeDelivery ? 'FREE' : deliveryFee.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-lg font-black text-indigo-600 pt-2 border-t border-slate-200 dark:border-slate-700"><span>Total</span><span>{total.toFixed(2)} {currencySymbol}</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={holdCurrentOrder} disabled={cart.length === 0} className="h-12 rounded-xl font-black uppercase text-xs bg-amber-500/10 text-amber-600 border border-amber-500/30 disabled:opacity-30 flex items-center justify-center gap-2">
                                            <Pause size={14} /> Hold (F4)
                                        </button>
                                        <button onClick={handleSubmitOrder} disabled={cart.length === 0} className={`h-12 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 ${cart.length === 0 ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white shadow-lg'}`}>
                                            Send (F3) <ArrowRight size={14} />
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
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Filters Bar */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4">
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                            {[
                                { value: 'all', label: lang === 'ar' ? 'الكل' : 'All', count: callCenterOrders.length },
                                { value: OrderStatus.PENDING, label: lang === 'ar' ? 'جديد' : 'New', count: pendingCount },
                                { value: OrderStatus.PREPARING, label: lang === 'ar' ? 'تحضير' : 'Prep', count: preparingCount },
                                { value: OrderStatus.OUT_FOR_DELIVERY, label: lang === 'ar' ? 'توصيل' : 'OFD', count: outForDeliveryCount },
                                { value: OrderStatus.DELIVERED, label: lang === 'ar' ? 'تم' : 'Done', count: callCenterOrders.filter(o => o.status === OrderStatus.DELIVERED).length },
                            ].map(f => (
                                <button key={f.value} onClick={() => setTrackingFilter(f.value as any)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${trackingFilter === f.value ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {f.label}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${trackingFilter === f.value ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>{f.count}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex-1" />

                        <select value={trackingBranch} onChange={(e) => setTrackingBranch(e.target.value)} className="bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold outline-none">
                            <option value="all">{lang === 'ar' ? 'كل الفروع' : 'All Branches'}</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>

                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                            <button onClick={() => setTrackingView('grid')} className={`p-2 rounded-lg transition-all ${trackingView === 'grid' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}><LayoutGrid size={16} /></button>
                            <button onClick={() => setTrackingView('list')} className={`p-2 rounded-lg transition-all ${trackingView === 'list' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}><List size={16} /></button>
                        </div>
                    </div>

                    {/* Orders Grid/List */}
                    <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                        {filteredTrackingOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Package size={48} className="mb-4 opacity-30" />
                                <p className="text-sm font-bold">{lang === 'ar' ? 'لا توجد طلبات' : 'No orders found'}</p>
                            </div>
                        ) : trackingView === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                {filteredTrackingOrders.map(order => (
                                    <div key={order.id} className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 hover:shadow-lg transition-all ${order.isUrgent ? 'border-rose-500/50 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-xs font-black text-indigo-600">#{order.id}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                            <OrderStatusBadge status={order.status} lang={lang} />
                                        </div>

                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <User size={12} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-white">{order.customerName || 'Guest'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone size={12} className="text-slate-400" />
                                                <span className="text-[11px] text-slate-500">{order.customerPhone}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin size={12} className="text-slate-400 mt-0.5" />
                                                <span className="text-[11px] text-slate-500 line-clamp-2">{order.deliveryAddress}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-500">{branches.find(b => b.id === order.branchId)?.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-indigo-600">{order.total?.toFixed(2)} {currencySymbol}</span>
                                        </div>

                                        {order.isUrgent && (
                                            <div className="mt-2 flex items-center gap-1 text-rose-500">
                                                <Zap size={12} />
                                                <span className="text-[10px] font-black uppercase">{lang === 'ar' ? 'عاجل' : 'Urgent'}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredTrackingOrders.map(order => (
                                    <div key={order.id} className={`bg-white dark:bg-slate-900 rounded-xl border p-4 flex items-center gap-6 hover:shadow-lg transition-all ${order.isUrgent ? 'border-rose-500/50' : 'border-slate-200 dark:border-slate-800'}`}>
                                        <div className="w-24">
                                            <p className="text-xs font-black text-indigo-600">#{order.id}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-700 dark:text-white">{order.customerName}</p>
                                            <p className="text-xs text-slate-400">{order.deliveryAddress}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-slate-400 mb-1">{lang === 'ar' ? 'الفرع' : 'Branch'}</p>
                                            <p className="text-xs font-bold">{branches.find(b => b.id === order.branchId)?.name}</p>
                                        </div>
                                        <OrderStatusBadge status={order.status} lang={lang} />
                                        {order.status === OrderStatus.READY && (
                                            <button
                                                onClick={() => { setSelectedTrackingOrder(order); setShowDriverModal(true); }}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                Dispatch
                                            </button>
                                        )}
                                        <p className="text-lg font-black text-indigo-600 w-28 text-right">{order.total?.toFixed(2)} {currencySymbol}</p>
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

