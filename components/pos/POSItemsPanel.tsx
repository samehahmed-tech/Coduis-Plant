/**
 * POSItemsPanel — Search bar with inline filters + Items Grid
 * Minimal: search + filter chips + count + tools dropdown
 * Categories handled by CategorySidebar on desktop, CategoryTabs on mobile
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    Search, X, SlidersHorizontal, LayoutGrid, Grid2x2, List, Grid3x3,
    ShoppingBag, Flame, Star, CheckCircle
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
                            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[9px] font-bold transition-colors ${itemDensity === v.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'text-muted hover:bg-elevated/50'
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

            <button onClick={onReset} className="w-full py-1.5 rounded-lg bg-elevated/40 text-muted hover:text-emerald-600 text-[10px] font-bold transition-colors">
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
            {/* Mobile-only: horizontal category strip */}
            <div className="md:hidden shrink-0">
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

            {/* ═══ Search + Inline Filters — single compact row ═══ */}
            <div className="shrink-0 px-2 py-1.5 flex items-center gap-1.5 border-b border-border/15 bg-card/50">
                {/* Search input */}
                <div className="relative flex-1 min-w-0">
                    <Search className={`absolute top-1/2 -translate-y-1/2 text-muted/40 w-4 h-4 ${isRTL ? 'right-2.5' : 'left-2.5'}`} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t.search_placeholder}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={`w-full h-9 text-sm bg-elevated/20 border border-border/15 rounded-xl focus:ring-1 focus:ring-emerald-400/30 focus:border-emerald-400/30 font-semibold outline-none transition-all ${isRTL ? 'pr-8 pl-8 text-right' : 'pl-8 pr-8 text-left'}`}
                    />
                    {searchQuery && (
                        <button onClick={() => onSearchChange('')} className={`absolute top-1/2 -translate-y-1/2 text-muted hover:text-emerald-600 transition-colors ${isRTL ? 'left-2' : 'right-2'}`}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Inline quick filter chips */}
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => onSetFilter(itemFilter === 'popular' ? 'all' : 'popular')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${itemFilter === 'popular' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' : 'bg-elevated/30 text-muted hover:text-amber-500'
                            }`}
                    >
                        <Star size={10} fill={itemFilter === 'popular' ? 'currentColor' : 'none'} />
                        {isRTL ? 'مميز' : 'Popular'}
                    </button>
                    <button
                        onClick={() => onSetFilter(itemFilter === 'available' ? 'all' : 'available')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${itemFilter === 'available' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' : 'bg-elevated/30 text-muted hover:text-emerald-500'
                            }`}
                    >
                        <CheckCircle size={10} />
                        {isRTL ? 'متاح' : 'Available'}
                    </button>
                </div>

                {/* Count badge */}
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg shrink-0 tabular-nums">
                    {pricedItems.length}
                </span>

                {/* Tools */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setToolsOpen(p => !p)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${toolsOpen ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-elevated/30 text-muted hover:text-emerald-600'
                            }`}
                    >
                        <SlidersHorizontal size={14} />
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
                    <button onClick={onOpenCart} className="lg:hidden shrink-0 w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center relative shadow-sm">
                        <ShoppingBag size={14} />
                        <span className="absolute -top-1 -right-1 min-w-[15px] h-4 px-0.5 rounded-full bg-amber-400 text-black text-[8px] font-black flex items-center justify-center">
                            {cartStats.qty}
                        </span>
                    </button>
                )}
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
