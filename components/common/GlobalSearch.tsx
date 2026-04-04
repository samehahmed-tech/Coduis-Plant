/**
 * GlobalSearch — Cmd+K / Ctrl+K spotlight search
 * Searches: Pages, Orders, Customers, Menu Items
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search, X, ArrowRight, LayoutDashboard, ShoppingCart, Phone, Monitor, UtensilsCrossed,
    Package, Users, DollarSign, BarChart3, Brain, Shield, Settings, Factory, Truck,
    Megaphone, Clock, FileText, Wallet, AlertTriangle, Layers, MessageCircle,
    Clipboard, Globe, Award, ChefHat, Hash, Sparkles, BookOpen, Fingerprint,
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
    { path: '/admin-dashboard', icon: LayoutDashboard, en: 'Dashboard', ar: 'لوحة التحكم', keywords: 'home main analytics kpi' },
    { path: '/pos', icon: ShoppingCart, en: 'Point of Sale', ar: 'نقطة البيع', keywords: 'cashier register sell bill receipt pos' },
    { path: '/call-center', icon: Phone, en: 'Call Center', ar: 'الكول سنتر', keywords: 'phone delivery order call' },
    { path: '/kds', icon: Monitor, en: 'Kitchen Display', ar: 'شاشة المطبخ', keywords: 'kitchen cook prep station kds' },
    { path: '/menu', icon: UtensilsCrossed, en: 'Menu Manager', ar: 'مدير القائمة', keywords: 'food items categories pricing modifier menu' },
    { path: '/recipes', icon: ChefHat, en: 'Recipes', ar: 'الوصفات', keywords: 'recipe cost ingredient' },
    { path: '/inventory', icon: Package, en: 'Inventory', ar: 'المخزون', keywords: 'stock warehouse supplier purchase order inventory' },
    { path: '/crm', icon: Users, en: 'CRM', ar: 'إدارة العملاء', keywords: 'customer loyalty member segment crm' },
    { path: '/finance', icon: DollarSign, en: 'Finance', ar: 'المالية', keywords: 'accounting journal ledger GL payment finance' },
    { path: '/reports', icon: BarChart3, en: 'Reports', ar: 'التقارير', keywords: 'report analytics sales revenue graph' },
    { path: '/ai-insights', icon: Brain, en: 'AI Insights', ar: 'تحليلات الذكاء', keywords: 'ai prediction forecast anomaly intelligence' },
    { path: '/ai-assistant', icon: Sparkles, en: 'AI Assistant', ar: 'مساعد الذكاء', keywords: 'ai assistant chat help' },
    { path: '/security', icon: Shield, en: 'Security Hub', ar: 'مركز الأمان', keywords: 'user role permission password security' },
    { path: '/forensics', icon: Fingerprint, en: 'Forensics', ar: 'التحقيقات', keywords: 'forensics audit trail log' },
    { path: '/settings', icon: Settings, en: 'Settings', ar: 'الإعدادات', keywords: 'config branch currency language tax printer settings' },
    { path: '/production', icon: Factory, en: 'Production', ar: 'الإنتاج', keywords: 'production manufacturing batch' },
    { path: '/dispatch', icon: Truck, en: 'Dispatch Hub', ar: 'مركز التوصيل', keywords: 'delivery driver dispatch tracking' },
    { path: '/marketing', icon: Megaphone, en: 'Marketing', ar: 'التسويق', keywords: 'campaign promotion discount coupon marketing' },
    { path: '/people', icon: Users, en: 'HR (ZenPeople)', ar: 'الموارد البشرية', keywords: 'employee payroll attendance leave salary hr people' },
    { path: '/fiscal', icon: Wallet, en: 'Fiscal', ar: 'الميزانية', keywords: 'fiscal budget tax' },
    { path: '/day-close', icon: Clock, en: 'Day Close', ar: 'إقفال اليوم', keywords: 'shift close end day cash count' },
    { path: '/refunds', icon: RotateCcw, en: 'Refunds', ar: 'المرتجعات', keywords: 'refund return void cancel' },
    { path: '/wastage', icon: Trash2, en: 'Wastage', ar: 'الهدر', keywords: 'waste spoilage loss expired' },
    { path: '/approvals', icon: FileText, en: 'Approvals', ar: 'الموافقات', keywords: 'approve review pending request' },
    { path: '/whatsapp', icon: MessageCircle, en: 'WhatsApp', ar: 'واتساب', keywords: 'whatsapp message chat notify' },
    { path: '/platforms', icon: Globe, en: 'Platforms', ar: 'المنصات', keywords: 'talabat elmenus aggregator integration platform' },
    { path: '/franchise', icon: Award, en: 'Franchise', ar: 'الامتياز التجاري', keywords: 'franchise branch multi' },
    { path: '/inventory-intelligence', icon: Layers, en: 'Inventory Intelligence', ar: 'ذكاء المخزون', keywords: 'smart inventory forecast intelligence' },
];

const GlobalSearch: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIdx, setSelectedIdx] = useState(0);

    const settings = useAuthStore(s => s.settings);
    const lang: 'en' | 'ar' = (settings.language || 'en') as 'en' | 'ar';

    const orders = useOrderStore(s => s.orders);
    const menus = useMenuStore(s => s.menus);
    const customers = useCRMStore(s => s.customers);
    const inventory = useInventoryStore(s => s.inventory);

    // Global Cmd+K listener
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen]);

    // Focus on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIdx(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Close on navigation
    useEffect(() => { setIsOpen(false); }, [location.pathname]);

    const results = useMemo((): SearchResult[] => {
        if (!query.trim()) {
            return PAGES.slice(0, 8).map(p => ({
                id: `page-${p.path}`,
                type: 'page' as const,
                icon: p.icon,
                title: lang === 'ar' ? p.ar : p.en,
                subtitle: lang === 'ar' ? 'صفحة' : 'Page',
                path: p.path,
            }));
        }

        const q = query.toLowerCase();
        const out: SearchResult[] = [];

        // Pages
        PAGES.forEach(p => {
            if (p.en.toLowerCase().includes(q) || p.ar.includes(q) || p.keywords.includes(q)) {
                out.push({
                    id: `page-${p.path}`,
                    type: 'page',
                    icon: p.icon,
                    title: lang === 'ar' ? p.ar : p.en,
                    subtitle: lang === 'ar' ? 'صفحة' : 'Page',
                    path: p.path,
                });
            }
        });

        // Orders
        if (out.length < 15) {
            orders.slice(0, 100).forEach(o => {
                const orderNum = String(o.orderNumber || '');
                const id = String(o.id || '');
                if (orderNum.includes(q) || id.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q)) {
                    out.push({
                        id: `order-${o.id}`,
                        type: 'order',
                        icon: Hash,
                        title: `#${o.orderNumber || o.id.slice(0, 8)}`,
                        subtitle: `${o.type} · ${o.status} · ${o.total?.toFixed(2) || '0'}`,
                        meta: lang === 'ar' ? 'طلب' : 'Order',
                        path: '/reports',
                    });
                }
            });
        }

        // Customers
        if (out.length < 15) {
            customers.slice(0, 200).forEach(c => {
                if (c.name?.toLowerCase().includes(q) || c.phone?.includes(q)) {
                    out.push({
                        id: `customer-${c.id}`,
                        type: 'customer',
                        icon: Users,
                        title: c.name || c.phone,
                        subtitle: c.phone,
                        meta: lang === 'ar' ? 'عميل' : 'Customer',
                        path: '/crm',
                    });
                }
            });
        }

        // Menu Items
        if (out.length < 15) {
            menus.slice(0, 100).forEach(item => {
                const name = lang === 'ar' ? (item.nameAr || item.name) : item.name;
                if (name.toLowerCase().includes(q)) {
                    out.push({
                        id: `menu-${item.id}`,
                        type: 'menu',
                        icon: UtensilsCrossed,
                        title: name,
                        subtitle: `${(item as any).price?.toFixed(2) || '0'}`,
                        meta: lang === 'ar' ? 'صنف منيو' : 'Menu Item',
                        path: '/menu',
                    });
                }
            });
        }

        // Inventory Items
        if (out.length < 15) {
            inventory.slice(0, 100).forEach(item => {
                const name = lang === 'ar' ? (item.nameAr || item.name) : item.name;
                if (name.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q)) {
                    out.push({
                        id: `inv-${item.id}`,
                        type: 'inventory',
                        icon: Package,
                        title: name,
                        subtitle: `${item.sku || 'No SKU'} · ${item.unit}`,
                        meta: lang === 'ar' ? 'مخزون' : 'Inventory',
                        path: '/inventory',
                    });
                }
            });
        }

        return out.slice(0, 15);
    }, [query, lang, orders, customers, menus]);

    useEffect(() => setSelectedIdx(0), [results.length]);

    const handleSelect = useCallback((result: SearchResult) => {
        if (result.path) navigate(result.path);
        setIsOpen(false);
    }, [navigate]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(prev => Math.min(prev + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(prev => Math.max(prev - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); if (results[selectedIdx]) handleSelect(results[selectedIdx]); }
        else if (e.key === 'Escape') { setIsOpen(false); }
    }, [results, selectedIdx, handleSelect]);

    if (!isOpen) return null;

    const typeColors: Record<string, string> = {
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
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <Search size={20} className="text-slate-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={lang === 'ar' ? 'ابحث عن صفحات، طلبات، عملاء، أصناف...' : 'Search pages, orders, customers, items...'}
                        className="flex-1 bg-transparent text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {results.length === 0 && query.trim() && (
                        <div className="py-12 px-6 text-center">
                            <Search size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-400">
                                {lang === 'ar' ? 'لا نتائج' : 'No results found'}
                            </p>
                        </div>
                    )}

                    {results.map((r, idx) => {
                        const Icon = r.icon;
                        const sel = idx === selectedIdx;
                        return (
                            <button
                                key={r.id}
                                onClick={() => handleSelect(r)}
                                onMouseEnter={() => setSelectedIdx(idx)}
                                className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left ${sel ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeColors[r.type] || 'text-slate-400 bg-slate-100'}`}>
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${sel ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>{r.title}</p>
                                    {r.subtitle && <p className="text-[11px] font-medium text-slate-400 truncate">{r.subtitle}</p>}
                                </div>
                                {r.meta && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">{r.meta}</span>}
                                {sel && <ArrowRight size={14} className="text-indigo-500 shrink-0" />}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <kbd className="px-1.5 py-0.5 text-[9px] font-black text-slate-400 bg-slate-200 dark:bg-slate-700 rounded">↑↓</kbd>
                        <span className="text-[9px] font-bold text-slate-400">{lang === 'ar' ? 'تحرك' : 'Navigate'}</span>
                        <kbd className="px-1.5 py-0.5 text-[9px] font-black text-slate-400 bg-slate-200 dark:bg-slate-700 rounded">↵</kbd>
                        <span className="text-[9px] font-bold text-slate-400">{lang === 'ar' ? 'فتح' : 'Open'}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{results.length} {lang === 'ar' ? 'نتيجة' : 'results'}</span>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
