/**
 * POSItemsPanel — Left panel: Search bar + Category chips + Filter bar + Item Grid
 * Clean layout inspired by modern POS UI with compact vertical usage.
 */
import React, { useMemo } from 'react';
import {
    Search, X, SlidersHorizontal, ArrowUpDown, LayoutGrid, Grid2x2, Plus, Sparkles
} from 'lucide-react';
import CategoryTabs from './CategoryTabs';
import ItemGrid from './ItemGrid';
import type { MenuCategory, OrderItem } from '../../types';

interface POSItemsPanelProps {
    // Categories
    categories: MenuCategory[];
    activeCategory: string;
    onSetCategory: (id: string) => void;
    categoryResultCounts: Record<string, number>;
    totalMatchedCount: number;
    hasActiveFiltering: boolean;
    // Items
    pricedItems: any[];
    cartItems: OrderItem[];
    onAddItem: (item: any) => void;
    onRemoveItem: (item: any) => void;
    highlightedItemId: string | null;
    // Search
    searchQuery: string;
    onSearchChange: (q: string) => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    // Filters
    itemFilter: 'all' | 'available' | 'popular';
    onSetFilter: (f: 'all' | 'available' | 'popular') => void;
    itemSort: 'smart' | 'name' | 'price_asc' | 'price_desc';
    onSetSort: (s: 'smart' | 'name' | 'price_asc' | 'price_desc') => void;
    itemDensity: 'comfortable' | 'compact' | 'ultra';
    onSetDensity: (d: 'comfortable' | 'compact' | 'ultra') => void;
    showMobileFilters: boolean;
    onToggleFilters: () => void;
    onResetFilters: () => void;
    // QuickPick
    quickPickItems: any[];
    upsellSuggestions: any[];
    // Category strip
    showCategoryStrip: boolean;
    onToggleCategoryStrip: () => void;
    isTabletViewport: boolean;
    // Quick category nav
    quickCategoryNav: any[];
    // Layout
    isTouchMode: boolean;
    lang: string;
    t: any;
    currencySymbol: string;
    isCartVisible: boolean;
    // Mobile mini cart
    cartStats: { lines: number; qty: number };
    cartTotal: number;
    currentOrderPreview: { id: string; name: string; quantity: number }[];
    isCartOpenMobile: boolean;
    onOpenCart: () => void;
    selectedTableId: string | null;
    hasCartItems: boolean;
}

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

    return (
        <div className={`min-w-0 flex flex-col h-full overflow-hidden min-h-0 bg-app transition-all duration-300 ${isCartVisible ? 'lg:rounded-xl lg:border lg:border-border/40 lg:mx-1.5 lg:my-1.5' : ''}`}>

            {/* ── Category Tabs ── */}
            {(!isTabletViewport || showCategoryStrip) && (
                <div className="shrink-0 flex-col flex overflow-hidden">
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
            )}

            {/* ── Search & Actions Strip ── */}
            <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
                <div className="px-2 md:px-3 py-2 flex flex-col gap-2 border-b border-border/40 bg-card">
                    {/* Row 1: Category label + filter toggles */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1 h-5 bg-primary rounded-full shrink-0" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-muted truncate">
                                {activeCategory === 'all'
                                    ? (isRTL ? 'جميع الأصناف' : 'All Items')
                                    : ((isRTL ? categories.find(c => c.id === activeCategory)?.nameAr : null) ||
                                        categories.find(c => c.id === activeCategory)?.name ||
                                        (isRTL ? 'القسم' : 'Category'))
                                }
                            </h2>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                                {pricedItems.length} {isRTL ? 'صنف' : 'items'}
                            </span>
                            {isTabletViewport && (
                                <button
                                    onClick={onToggleCategoryStrip}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-elevated text-muted hover:text-primary transition-colors"
                                >
                                    <LayoutGrid size={11} />
                                    {showCategoryStrip ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'الأقسام' : 'Categories')}
                                </button>
                            )}
                            <button
                                onClick={onToggleFilters}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${showMobileFilters ? 'bg-primary/10 text-primary' : 'bg-elevated text-muted hover:text-primary'}`}
                            >
                                <SlidersHorizontal size={11} />
                                {isRTL ? 'فلاتر' : 'Filters'}
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Search */}
                    <div className="relative w-full">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-muted/40 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={t.search_placeholder}
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className={`w-full py-2.5 text-sm bg-elevated/50 border border-border/30 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/40 font-semibold outline-none transition-all ${isRTL ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'}`}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange('')}
                                className={`absolute top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors ${isRTL ? 'left-3' : 'right-3'}`}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Row 3: Inline cart mini-bar (mobile, only when cart has items and not open) */}
                    {isCartVisible && !isCartOpenMobile && (hasCartItems || selectedTableId) && (
                        <div className="lg:hidden rounded-xl border border-border/50 bg-elevated/50 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                                        {isRTL ? 'الأوردر الحالي' : 'Current Order'}
                                    </p>
                                    <p className="text-xs font-black text-main truncate">
                                        {hasCartItems
                                            ? `${cartStats.lines} ${isRTL ? 'بنود' : 'lines'} • ${cartStats.qty} ${isRTL ? 'قطعة' : 'items'} • ${currencySymbol}${cartTotal.toFixed(2)}`
                                            : (isRTL ? 'لا توجد بنود بعد' : 'No items yet')}
                                    </p>
                                </div>
                                <button
                                    onClick={onOpenCart}
                                    className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-wider"
                                >
                                    {isRTL ? 'مراجعة' : 'Review'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick category chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        <button
                            onClick={() => onSetCategory('all')}
                            className={`shrink-0 px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${activeCategory === 'all'
                                    ? 'bg-primary text-white'
                                    : 'bg-elevated text-muted hover:text-primary'
                                }`}
                        >
                            {isRTL ? 'الكل' : 'All'}
                        </button>
                        {quickCategoryNav.map((cat: any) => (
                            <button
                                key={`qcat-${cat.id}`}
                                onClick={() => onSetCategory(cat.id)}
                                className={`shrink-0 px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${activeCategory === cat.id
                                        ? 'bg-primary text-white'
                                        : 'bg-elevated text-muted hover:text-primary'
                                    }`}
                            >
                                {isRTL ? (cat.nameAr || cat.name) : cat.name}
                                <span className={`ml-1 text-[9px] ${activeCategory === cat.id ? 'text-white/80' : 'opacity-50'}`}>
                                    {cat.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Filter controls */}
                    {showMobileFilters && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {/* Filter pills */}
                            <div className="inline-flex bg-elevated rounded-lg p-0.5">
                                {[
                                    { id: 'all', label: isRTL ? 'الكل' : 'All' },
                                    { id: 'available', label: isRTL ? 'متاح' : 'Available' },
                                    { id: 'popular', label: isRTL ? 'الأكثر طلباً' : 'Popular' }
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => onSetFilter(filter.id as any)}
                                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors ${itemFilter === filter.id ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>

                            {/* Sort */}
                            <div className="relative">
                                <ArrowUpDown size={12} className={`absolute top-1/2 -translate-y-1/2 text-muted ${isRTL ? 'right-2' : 'left-2'}`} />
                                <select
                                    value={itemSort}
                                    onChange={(e) => onSetSort(e.target.value as any)}
                                    className={`h-7 rounded-lg bg-elevated border-0 text-[10px] font-black uppercase tracking-wider text-muted ${isRTL ? 'pr-7 pl-2' : 'pl-7 pr-2'}`}
                                >
                                    <option value="smart">{isRTL ? 'ذكي' : 'Smart'}</option>
                                    <option value="name">{isRTL ? 'الاسم' : 'Name'}</option>
                                    <option value="price_asc">{isRTL ? 'الأقل' : 'Price ↑'}</option>
                                    <option value="price_desc">{isRTL ? 'الأعلى' : 'Price ↓'}</option>
                                </select>
                            </div>

                            {/* Density */}
                            <div className="inline-flex bg-elevated rounded-lg p-0.5">
                                <button onClick={() => onSetDensity('comfortable')} className={`w-7 h-7 rounded-md flex items-center justify-center ${itemDensity === 'comfortable' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}>
                                    <LayoutGrid size={13} />
                                </button>
                                <button onClick={() => onSetDensity('compact')} className={`w-7 h-7 rounded-md flex items-center justify-center ${itemDensity === 'compact' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}>
                                    <Grid2x2 size={13} />
                                </button>
                                <button onClick={() => onSetDensity('ultra')} className={`w-7 h-7 rounded-md flex items-center justify-center ${itemDensity === 'ultra' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}>
                                    <span className="text-[8px] font-black">UL</span>
                                </button>
                            </div>

                            {(searchQuery || itemFilter !== 'all' || itemSort !== 'smart') && (
                                <button onClick={onResetFilters} className="px-2 py-1 rounded-md bg-elevated text-muted hover:text-primary text-[10px] font-black uppercase tracking-wider">
                                    {isRTL ? 'إعادة ضبط' : 'Reset'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Smart picks */}
                    {showMobileFilters && quickPickItems.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                            <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-muted flex items-center gap-1">
                                <Sparkles size={10} /> {isRTL ? 'مقترحات' : 'Quick'}
                            </span>
                            {quickPickItems.map((item: any) => (
                                <button
                                    key={`qp-${item.id}`}
                                    onClick={() => onAddItem(item)}
                                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-elevated text-main hover:bg-primary hover:text-white transition-colors"
                                >
                                    <Plus size={10} />
                                    <span className="text-[10px] font-bold">{(item as any).displayName || item.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Item Grid ── */}
                <div className="flex-1 overflow-y-auto p-2 md:p-3 min-h-0 bg-app">
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
        </div>
    );
};

export default React.memo(POSItemsPanel);
