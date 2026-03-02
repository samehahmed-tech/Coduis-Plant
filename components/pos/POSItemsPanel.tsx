/**
 * POSItemsPanel — Search bar with inline filters + Items Grid
 * Minimal: search + filter chips + count + tools dropdown
 * Categories handled by CategorySidebar on desktop, CategoryTabs on mobile
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    Search, X, SlidersHorizontal, LayoutGrid, Grid2x2, List, Grid3x3,
    ShoppingBag, Flame, Star, CheckCircle, Clock, Heart
} from 'lucide-react';
import CategoryTabs from './CategoryTabs';
import ItemGrid from './ItemGrid';
import type { MenuCategory, OrderItem } from '../../types';

interface POSItemsPanelProps {
    categories: MenuCategory[];
    activeCategory: string;
    onSetCategory: (id: string) => void;
    categoryResultCounts: Record<string, number>;
    totalMatchedCount: number;
    hasActiveFiltering: boolean;
    pricedItems: any[];
    cartItems: OrderItem[];
    onAddItem: (item: any) => void;
    onRemoveItem: (item: any) => void;
    highlightedItemId: string | null;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    itemFilter: 'all' | 'available' | 'popular';
    onSetFilter: (f: 'all' | 'available' | 'popular') => void;
    itemSort: 'smart' | 'name' | 'price_asc' | 'price_desc';
    onSetSort: (s: 'smart' | 'name' | 'price_asc' | 'price_desc') => void;
    itemDensity: 'comfortable' | 'compact' | 'ultra' | 'buttons';
    onSetDensity: (d: 'comfortable' | 'compact' | 'ultra' | 'buttons') => void;
    showMobileFilters: boolean;
    onToggleFilters: () => void;
    onResetFilters: () => void;
    quickPickItems: any[];
    upsellSuggestions: any[];
    showCategoryStrip: boolean;
    onToggleCategoryStrip: () => void;
    isTabletViewport: boolean;
    quickCategoryNav: any[];
    isTouchMode: boolean;
    lang: string;
    t: any;
    currencySymbol: string;
    isCartVisible: boolean;
    cartStats: { lines: number; qty: number };
    cartTotal: number;
    currentOrderPreview: { id: string; name: string; quantity: number }[];
    isCartOpenMobile: boolean;
    onOpenCart: () => void;
    selectedTableId: string | null;
    hasCartItems: boolean;
}

// Tools dropdown — view + sort only (filters are inline now)
const ToolsDropdown: React.FC<{
    isOpen: boolean; onClose: () => void;
    itemSort: string; onSetSort: (s: any) => void;
    itemDensity: string; onSetDensity: (d: any) => void;
    onReset: () => void; lang: string;
}> = ({ isOpen, onClose, itemSort, onSetSort, itemDensity, onSetDensity, onReset, lang }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isRTL = lang === 'ar';

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div ref={ref} className={`absolute top-full mt-1 ${isRTL ? 'left-0' : 'right-0'} z-50 w-52 bg-card border border-border/30 rounded-xl shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-100`}>
            {/* View mode */}
            <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-1">{isRTL ? 'طريقة العرض' : 'View'}</p>
                <div className="flex gap-1">
                    {[
                        { id: 'comfortable', icon: <LayoutGrid size={14} />, label: isRTL ? 'بطاقات' : 'Cards' },
                        { id: 'compact', icon: <Grid2x2 size={14} />, label: isRTL ? 'صغير' : 'Small' },
                        { id: 'ultra', icon: <List size={14} />, label: isRTL ? 'قائمة' : 'List' },
                        { id: 'buttons', icon: <Grid3x3 size={14} />, label: isRTL ? 'أزرار' : 'Buttons' },
                    ].map(v => (
                        <button
                            key={v.id}
                            onClick={() => { onSetDensity(v.id); onClose(); }}
                            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${itemDensity === v.id ? 'bg-indigo-500/10 text-indigo-500 shadow-sm' : 'text-muted hover:bg-elevated/80 hover:text-main'
                                }`}
                        >
                            {v.icon}
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort */}
            <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-1">{isRTL ? 'ترتيب' : 'Sort'}</p>
                <select
                    value={itemSort}
                    onChange={(e) => { onSetSort(e.target.value); onClose(); }}
                    className="w-full h-8 rounded-lg bg-elevated/50 border-0 text-xs font-semibold text-main px-2"
                >
                    <option value="smart">{isRTL ? 'ذكي' : 'Smart'}</option>
                    <option value="name">{isRTL ? 'الاسم' : 'Name'}</option>
                    <option value="price_asc">{isRTL ? 'السعر ↑' : 'Price ↑'}</option>
                    <option value="price_desc">{isRTL ? 'السعر ↓' : 'Price ↓'}</option>
                </select>
            </div>

            <button onClick={onReset} className="w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-600 text-[10px] font-black uppercase tracking-widest transition-all mt-2">
                {isRTL ? 'إعادة ضبط' : 'Reset All'}
            </button>
        </div>
    );
};

const POSItemsPanel: React.FC<POSItemsPanelProps> = ({
    categories, activeCategory, onSetCategory, categoryResultCounts, totalMatchedCount, hasActiveFiltering,
    pricedItems, cartItems, onAddItem, onRemoveItem, highlightedItemId,
    searchQuery, onSearchChange, searchInputRef,
    itemFilter, onSetFilter, itemSort, onSetSort, itemDensity, onSetDensity,
    showMobileFilters, onToggleFilters, onResetFilters,
    quickPickItems, upsellSuggestions,
    showCategoryStrip, onToggleCategoryStrip, isTabletViewport,
    quickCategoryNav,
    isTouchMode, lang, t, currencySymbol,
    isCartVisible,
    cartStats, cartTotal, currentOrderPreview, isCartOpenMobile, onOpenCart, selectedTableId, hasCartItems,
}) => {
    const isRTL = lang === 'ar';
    const [toolsOpen, setToolsOpen] = useState(false);

    return (
        <div className="min-w-0 flex flex-col h-full overflow-hidden min-h-0 bg-app">
            {/* ═══ Quick Action Ribbon ═══ */}
            <div className="shrink-0 px-3 py-2 flex items-center gap-2 border-b border-border/30 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl relative z-20">
                {/* Search input — prominent */}
                <div className="relative flex-1 min-w-0 group">
                    <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-4.5 h-4.5 ${isRTL ? 'right-3.5' : 'left-3.5'}`} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t.search_placeholder}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={`w-full h-10 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 font-semibold outline-none transition-all placeholder-slate-400 shadow-sm ${isRTL ? 'pr-10 pl-9 text-right' : 'pl-10 pr-9 text-left'}`}
                    />
                    {searchQuery && (
                        <button onClick={() => onSearchChange('')} className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all ${isRTL ? 'left-2' : 'right-2'}`}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Quick filter chips */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => onSetFilter(itemFilter === 'popular' ? 'all' : 'popular')}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${itemFilter === 'popular' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-amber-500/10'}`}
                    >
                        <Star size={14} fill={itemFilter === 'popular' ? 'currentColor' : 'none'} />
                        {isRTL ? 'الأكثر' : 'Top'}
                    </button>
                    <button
                        onClick={() => onSetFilter(itemFilter === 'available' ? 'all' : 'available')}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${itemFilter === 'available' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-500/10'}`}
                    >
                        <CheckCircle size={14} />
                        {isRTL ? 'متاح' : 'Available'}
                    </button>
                </div>

                {/* Count + Tools */}
                <span className="text-[11px] font-black text-indigo-500 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg tabular-nums shrink-0">
                    {pricedItems.length}
                </span>

                <div className="relative shrink-0">
                    <button
                        onClick={() => setToolsOpen(p => !p)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${toolsOpen ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 active:scale-95'}`}
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                    <ToolsDropdown
                        isOpen={toolsOpen}
                        onClose={() => setToolsOpen(false)}
                        itemSort={itemSort}
                        onSetSort={onSetSort}
                        itemDensity={itemDensity}
                        onSetDensity={onSetDensity}
                        onReset={() => { onResetFilters(); setToolsOpen(false); }}
                        lang={lang}
                    />
                </div>

                {/* Cart toggle (mobile) */}
                {isCartVisible && !isCartOpenMobile && hasCartItems && (
                    <button onClick={onOpenCart} className="lg:hidden shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white flex items-center justify-center relative shadow-lg shadow-indigo-500/25 active:scale-95 transition-all">
                        <ShoppingBag size={18} />
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center shadow-md animate-in zoom-in">
                            {cartStats.qty}
                        </span>
                    </button>
                )}
            </div>

            {/* ═══ Category Tabs ═══ */}
            <div className="shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-border/20 px-2 py-2.5">
                <CategoryTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    onSetCategory={onSetCategory}
                    isTouchMode={isTouchMode}
                    lang={lang as any}
                    counts={categoryResultCounts}
                    totalCount={totalMatchedCount}
                    hasActiveFiltering={hasActiveFiltering}
                />
            </div>

            {/* ═══ Item Grid ═══ */}
            <div className="flex-1 min-h-0 bg-app">
                <ItemGrid
                    items={pricedItems}
                    onAddItem={onAddItem}
                    onRemoveItem={onRemoveItem}
                    cartItems={cartItems}
                    currencySymbol={currencySymbol}
                    isTouchMode={isTouchMode}
                    density={itemDensity}
                    lang={lang as any}
                    highlightedItemId={highlightedItemId}
                />
            </div>
        </div>
    );
};

export default React.memo(POSItemsPanel);
