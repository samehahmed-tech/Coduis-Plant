/**
 * GlobalSearch - Cmd+K / Ctrl+K spotlight search
 * Searches: Pages, Orders, Customers, Menu Items
 */
import React, { useDeferredValue, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search, ArrowRight, LayoutDashboard, ShoppingCart, Phone, Monitor, UtensilsCrossed,
    Package, Users, DollarSign, BarChart3, Brain, Shield, Settings, Factory, Truck,
    Megaphone, Clock, FileText, Wallet, Layers, MessageCircle,
    Globe, Award, ChefHat, Hash, Sparkles, Fingerprint,
    RotateCcw, Trash2
} from 'lucide-react';
import { useOrderStore } from '../../stores/useOrderStore';
import { useMenuStore } from '../../stores/useMenuStore';
import { useCRMStore } from '../../stores/useCRMStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useInventoryStore } from '../../stores/useInventoryStore';

interface SearchResult {
    id: string;
    type: 'page' | 'order' | 'customer' | 'menu' | 'inventory';
    icon: React.ElementType;
    title: string;
    subtitle?: string;
    path?: string;
    meta?: string;
}

const PAGES: { path: string; icon: React.ElementType; en: string; ar: string; keywords: string }[] = [
    { path: '/admin-dashboard', icon: LayoutDashboard, en: 'Dashboard', ar: 'ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…', keywords: 'home main analytics kpi' },
    { path: '/pos', icon: ShoppingCart, en: 'Point of Sale', ar: 'ظ†ظ‚ط·ط© ط§ظ„ط¨ظٹط¹', keywords: 'cashier register sell bill receipt pos' },
    { path: '/call-center', icon: Phone, en: 'Call Center', ar: 'ط§ظ„ظƒظˆظ„ ط³ظ†طھط±', keywords: 'phone delivery order call' },
    { path: '/kds', icon: Monitor, en: 'Kitchen Display', ar: 'ط´ط§ط´ط© ط§ظ„ظ…ط·ط¨ط®', keywords: 'kitchen cook prep station kds' },
    { path: '/menu', icon: UtensilsCrossed, en: 'Menu Manager', ar: 'ظ…ط¯ظٹط± ط§ظ„ظ‚ط§ط¦ظ…ط©', keywords: 'food items categories pricing modifier menu' },
    { path: '/recipes', icon: ChefHat, en: 'Recipes', ar: 'ط§ظ„ظˆطµظپط§طھ', keywords: 'recipe cost ingredient' },
    { path: '/inventory', icon: Package, en: 'Inventory', ar: 'ظ§ظ„ظ…ط®ط²ظˆظ†', keywords: 'stock warehouse supplier purchase order inventory' },
    { path: '/crm', icon: Users, en: 'CRM', ar: 'ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ…ظ„ط§ط،', keywords: 'customer loyalty member segment crm' },
    { path: '/finance', icon: DollarSign, en: 'Finance', ar: 'ط§ظ„ظ…ط§ظ„ظٹط©', keywords: 'accounting journal ledger GL payment finance' },
    { path: '/reports', icon: BarChart3, en: 'Reports', ar: 'ط§ظ„طھظ‚ط§ط±ظٹط±', keywords: 'report analytics sales revenue graph' },
    { path: '/ai-insights', icon: Brain, en: 'AI Insights', ar: 'طھط­ظ„ظٹظ„ط§طھ ط§ظ„ط°ظƒط§ط،', keywords: 'ai prediction forecast anomaly intelligence' },
    { path: '/ai-assistant', icon: Sparkles, en: 'AI Assistant', ar: 'ظ…ط³ط§ط¹ط¯ ط§ظ„ط°ظƒط§ط،', keywords: 'ai assistant chat help' },
    { path: '/security', icon: Shield, en: 'Security Hub', ar: 'ظ…ط±ظƒط² ط§ظ„ط£ظ…ط§ظ†', keywords: 'user role permission password security' },
    { path: '/forensics', icon: Fingerprint, en: 'Forensics', ar: 'ط§ظ„طھط­ظ‚ظٹظ‚ط§طھ', keywords: 'forensics audit trail log' },
    { path: '/settings', icon: Settings, en: 'Settings', ar: 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ', keywords: 'config branch currency language tax printer settings' },
    { path: '/production', icon: Factory, en: 'Production', ar: 'ط§ظ„ط¥ظ†طھط§ط¬', keywords: 'production manufacturing batch' },
    { path: '/dispatch', icon: Truck, en: 'Dispatch Hub', ar: 'ظ…ط±ظƒط² ط§ظ„طھظˆطµظٹظ„', keywords: 'delivery driver dispatch tracking' },
    { path: '/marketing', icon: Megaphone, en: 'Marketing', ar: 'ط§ظ„طھط³ظˆظٹظ‚', keywords: 'campaign promotion discount coupon marketing' },
    { path: '/people', icon: Users, en: 'HR (ZenPeople)', ar: 'ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©', keywords: 'employee payroll attendance leave salary hr people' },
    { path: '/fiscal', icon: Wallet, en: 'Fiscal', ar: 'ط§ظ„ظ…ظٹط²ط§ظ†ظٹط©', keywords: 'fiscal budget tax' },
    { path: '/day-close', icon: Clock, en: 'Day Close', ar: 'ط¥ظ‚ظپط§ظ„ ط§ظ„ظٹظˆظ…', keywords: 'shift close end day cash count' },
    { path: '/refunds', icon: RotateCcw, en: 'Refunds', ar: 'ط§ظ„ظ…ط±طھط¬ط¹ط§طھ', keywords: 'refund return void cancel' },
    { path: '/wastage', icon: Trash2, en: 'Wastage', ar: 'ط§ظ„ظ‡ط¯ط±', keywords: 'waste spoilage loss expired' },
    { path: '/approvals', icon: FileText, en: 'Approvals', ar: 'ط§ظ„ظ…ظˆط§ظپظ‚ط§طھ', keywords: 'approve review pending request' },
    { path: '/whatsapp', icon: MessageCircle, en: 'WhatsApp', ar: 'ظˆط§طھط³ط§ط¨', keywords: 'whatsapp message chat notify' },
    { path: '/platforms', icon: Globe, en: 'Platforms', ar: 'ط§ظ„ظ…ظ†طµط§طھ', keywords: 'talabat elmenus aggregator integration platform' },
    { path: '/franchise', icon: Award, en: 'Franchise', ar: 'ط§ظ„ط§ظ…طھظٹط§ط² ط§ظ„طھط¬ط§ط±ظٹ', keywords: 'franchise branch multi' },
    { path: '/inventory-intelligence', icon: Layers, en: 'Inventory Intelligence', ar: 'ط°ظƒط§ط، ط§ظ„ظ…ط®ط²ظˆظ†', keywords: 'smart inventory forecast intelligence' },
];

const GlobalSearch: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIdx, setSelectedIdx] = useState(0);
    const deferredQuery = useDeferredValue(query);

    const lang = useAuthStore((state) => (state.settings.language || 'en') as 'en' | 'ar');
    const orders = useOrderStore((state) => state.orders);
    const menus = useMenuStore((state) => state.menus);
    const customers = useCRMStore((state) => state.customers);
    const inventory = useInventoryStore((state) => state.inventory);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                setIsOpen((prev) => !prev);
                return;
            }
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        setQuery('');
        setSelectedIdx(0);
        const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
        return () => window.cancelAnimationFrame(frame);
    }, [isOpen]);

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    const results = useMemo((): SearchResult[] => {
        if (!deferredQuery.trim()) {
            return PAGES.slice(0, 8).map((page) => ({
                id: `page-${page.path}`,
                type: 'page',
                icon: page.icon,
                title: lang === 'ar' ? page.ar : page.en,
                subtitle: lang === 'ar' ? 'طµظپط­ط©' : 'Page',
                path: page.path,
            }));
        }

        const q = deferredQuery.toLowerCase();
        const resultsList: SearchResult[] = [];

        PAGES.forEach((page) => {
            if (page.en.toLowerCase().includes(q) || page.ar.includes(q) || page.keywords.includes(q)) {
                resultsList.push({
                    id: `page-${page.path}`,
                    type: 'page',
                    icon: page.icon,
                    title: lang === 'ar' ? page.ar : page.en,
                    subtitle: lang === 'ar' ? 'طµظپط­ط©' : 'Page',
                    path: page.path,
                });
            }
        });

        if (resultsList.length < 15) {
            orders.slice(0, 100).forEach((order) => {
                const orderNumber = String(order.orderNumber || '');
                const id = String(order.id || '');
                if (orderNumber.includes(q) || id.toLowerCase().includes(q) || order.customerName?.toLowerCase().includes(q)) {
                    resultsList.push({
                        id: `order-${order.id}`,
                        type: 'order',
                        icon: Hash,
                        title: `#${order.orderNumber || order.id.slice(0, 8)}`,
                        subtitle: `${order.type} · ${order.status} · ${order.total?.toFixed(2) || '0'}`,
                        meta: lang === 'ar' ? 'ط·ظ„ط¨' : 'Order',
                        path: '/reports',
                    });
                }
            });
        }

        if (resultsList.length < 15) {
            customers.slice(0, 200).forEach((customer) => {
                if (customer.name?.toLowerCase().includes(q) || customer.phone?.includes(q)) {
                    resultsList.push({
                        id: `customer-${customer.id}`,
                        type: 'customer',
                        icon: Users,
                        title: customer.name || customer.phone,
                        subtitle: customer.phone,
                        meta: lang === 'ar' ? 'ط¹ظ…ظٹظ„' : 'Customer',
                        path: '/crm',
                    });
                }
            });
        }

        if (resultsList.length < 15) {
            menus.slice(0, 100).forEach((item) => {
                const name = lang === 'ar' ? (item.nameAr || item.name) : item.name;
                if (name.toLowerCase().includes(q)) {
                    resultsList.push({
                        id: `menu-${item.id}`,
                        type: 'menu',
                        icon: UtensilsCrossed,
                        title: name,
                        subtitle: `${(item as any).price?.toFixed(2) || '0'}`,
                        meta: lang === 'ar' ? 'طµظ†ظپ ظ…ظ†ظٹظˆ' : 'Menu Item',
                        path: '/menu',
                    });
                }
            });
        }

        if (resultsList.length < 15) {
            inventory.slice(0, 100).forEach((item) => {
                const name = lang === 'ar' ? (item.nameAr || item.name) : item.name;
                if (name.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q)) {
                    resultsList.push({
                        id: `inv-${item.id}`,
                        type: 'inventory',
                        icon: Package,
                        title: name,
                        subtitle: `${item.sku || 'No SKU'} · ${item.unit}`,
                        meta: lang === 'ar' ? 'ظ…ط®ط²ظˆظ†' : 'Inventory',
                        path: '/inventory',
                    });
                }
            });
        }

        return resultsList.slice(0, 15);
    }, [customers, deferredQuery, inventory, lang, menus, orders]);

    useEffect(() => {
        setSelectedIdx(0);
    }, [results.length]);

    const handleSelect = useCallback((result: SearchResult) => {
        if (result.path) {
            navigate(result.path);
        }
        setIsOpen(false);
    }, [navigate]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIdx((prev) => Math.max(prev - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (results[selectedIdx]) {
                handleSelect(results[selectedIdx]);
            }
        } else if (event.key === 'Escape') {
            setIsOpen(false);
        }
    }, [handleSelect, results, selectedIdx]);

    if (!isOpen) return null;

    const typeColors: Record<SearchResult['type'], string> = {
        page: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10',
        order: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
        customer: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
        menu: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10',
        inventory: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10',
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/30 w-[540px] max-w-[92vw] overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200 border border-slate-200/50 dark:border-slate-700/50"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <Search size={20} className="text-slate-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={lang === 'ar' ? 'ط§ط¨ط­ط« ط¹ظ† طµظپط­ط§طھطŒ ط·ظ„ط¨ط§طھطŒ ط¹ظ…ظ„ط§ط،طŒ ط£طµظ†ط§ظپ...' : 'Search pages, orders, customers, items...'}
                        className="flex-1 bg-transparent text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                        ESC
                    </kbd>
                </div>

                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {results.length === 0 && query.trim() && (
                        <div className="py-12 px-6 text-center">
                            <Search size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-400">
                                {lang === 'ar' ? 'ظ„ط§ ظ†طھط§ط¦ط¬' : 'No results found'}
                            </p>
                        </div>
                    )}

                    {results.map((result, idx) => {
                        const Icon = result.icon;
                        const selected = idx === selectedIdx;

                        return (
                            <button
                                key={result.id}
                                onClick={() => handleSelect(result)}
                                onMouseEnter={() => setSelectedIdx(idx)}
                                className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left ${selected ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeColors[result.type]}`}>
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>{result.title}</p>
                                    {result.subtitle && <p className="text-[11px] font-medium text-slate-400 truncate">{result.subtitle}</p>}
                                </div>
                                {result.meta && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">{result.meta}</span>}
                                {selected && <ArrowRight size={14} className="text-indigo-500 shrink-0" />}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <kbd className="px-1.5 py-0.5 text-[9px] font-black text-slate-400 bg-slate-200 dark:bg-slate-700 rounded">↑↓</kbd>
                        <span className="text-[9px] font-bold text-slate-400">{lang === 'ar' ? 'طھط­ط±ظƒ' : 'Navigate'}</span>
                        <kbd className="px-1.5 py-0.5 text-[9px] font-black text-slate-400 bg-slate-200 dark:bg-slate-700 rounded">↵</kbd>
                        <span className="text-[9px] font-bold text-slate-400">{lang === 'ar' ? 'ظپطھط­' : 'Open'}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{results.length} {lang === 'ar' ? 'ظ†طھظٹط¬ط©' : 'results'}</span>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
