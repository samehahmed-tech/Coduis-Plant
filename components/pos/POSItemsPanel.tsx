/**
 * POSItemsPanel — Left panel: Search bar + Category chips + Filter bar + Item Grid
 * Clean layout with compact vertical usage for maximum item visibility.
 */
import React from 'react';
import {
    Search, X, SlidersHorizontal, ArrowUpDown, LayoutGrid, Grid2x2, Plus, Sparkles
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
    itemDensity: 'comfortable' | 'compact' | 'ultra';
    onSetDensity: (d: 'comfortable' | 'compact' | 'ultra') => void;
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
        <div className={`min-w-0 flex flex-col h-full overflow-hidden min-h-0 bg-app transition-all duration-200 ${isCartVisible ? 'lg:rounded-xl lg:border lg:border-border/30 lg:mx-1 lg:my-1' : ''}`}>

            {/* ── Category Tabs (compact horizontal pills) ── */}
            {(!isTabletViewport || showCategoryStrip) && (
                <div className="shrink-0">
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

            {/* ── Search & Controls ── */}
            <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
                <div className="px-2 md:px-3 py-1.5 flex flex-col gap-1.5 border-b border-border/30 bg-card/80">
                    {/* Search bar + controls row */}
                    <div className="flex items-center gap-1.5">
                        <div className="relative flex-1 min-w-0">
                            <Search className={`absolute top-1/2 -translate-y-1/2 text-muted/40 w-3.5 h-3.5 ${isRTL ? 'right-2.5' : 'left-2.5'}`} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={t.search_placeholder}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className={`w-full h-8 text-xs bg-elevated/40 border border-border/30 rounded-lg focus:ring-1 focus:ring-primary/30 focus:border-primary/40 font-semibold outline-none transition-all ${isRTL ? 'pr-8 pl-8 text-right' : 'pl-8 pr-8 text-left'}`}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => onSearchChange('')}
                                    className={`absolute top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors ${isRTL ? 'left-2.5' : 'right-2.5'}`}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Compact action buttons */}
                        <span className="text-[9px] font-black text-primary px-1.5 py-0.5 bg-primary/10 rounded-md whitespace-nowrap">
                            {pricedItems.length}
                        </span>

                        {isTabletViewport && (
                            <button
                                onClick={onToggleCategoryStrip}
                                className="shrink-0 w-7 h-7 rounded-lg bg-elevated/50 text-muted hover:text-primary flex items-center justify-center transition-colors"
                                title={showCategoryStrip ? 'Hide categories' : 'Show categories'}
                            >
                                <LayoutGrid size={13} />
                            </button>
                        )}

                        <button
                            onClick={onToggleFilters}
                            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${showMobileFilters ? 'bg-primary/10 text-primary' : 'bg-elevated/50 text-muted hover:text-primary'}`}
                        >
                            <SlidersHorizontal size={13} />
                        </button>
                    </div>

                    {/* Inline cart mini-bar (mobile only) */}
                    {isCartVisible && !isCartOpenMobile && (hasCartItems || selectedTableId) && (
                        <div className="lg:hidden rounded-lg border border-border/40 bg-elevated/40 px-2.5 py-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">
                                        {isRTL ? 'الأوردر الحالي' : 'Current Order'}
                                    </p>
                                    <p className="text-[11px] font-black text-main truncate">
                                        {hasCartItems
                                            ? `${cartStats.lines} ${isRTL ? 'بنود' : 'lines'} • ${currencySymbol}${cartTotal.toFixed(2)}`
                                            : (isRTL ? 'لا توجد بنود' : 'No items yet')}
                                    </p>
                                </div>
                                <button
                                    onClick={onOpenCart}
                                    className="shrink-0 px-2.5 py-1 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-wider"
                                >
                                    {isRTL ? 'مراجعة' : 'Review'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filter controls (collapsed by default) */}
                    {showMobileFilters && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {/* Filter pills */}
                            <div className="inline-flex bg-elevated/60 rounded-lg p-0.5">
                                {[
                                    { id: 'all', label: isRTL ? 'الكل' : 'All' },
                                    { id: 'available', label: isRTL ? 'متاح' : 'Available' },
                                    { id: 'popular', label: isRTL ? 'الأكثر' : 'Popular' },
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => onSetFilter(filter.id as any)}
                                        className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors ${itemFilter === filter.id ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>

                            {/* Sort */}
                            <div className="relative">
                                <ArrowUpDown size={10} className={`absolute top-1/2 -translate-y-1/2 text-muted ${isRTL ? 'right-1.5' : 'left-1.5'}`} />
                                <select
                                    value={itemSort}
                                    onChange={(e) => onSetSort(e.target.value as any)}
                                    className={`h-6 rounded-md bg-elevated/60 border-0 text-[9px] font-black uppercase tracking-wider text-muted ${isRTL ? 'pr-5 pl-1.5' : 'pl-5 pr-1.5'}`}
                                >
                                    <option value="smart">{isRTL ? 'ذكي' : 'Smart'}</option>
                                    <option value="name">{isRTL ? 'الاسم' : 'Name'}</option>
                                    <option value="price_asc">{isRTL ? 'الأقل' : 'Price ↑'}</option>
                                    <option value="price_desc">{isRTL ? 'الأعلى' : 'Price ↓'}</option>
                                </select>
                            </div>

                            {/* Density */}
                            <div className="inline-flex bg-elevated/60 rounded-lg p-0.5">
                                <button onClick={() => onSetDensity('comfortable')} className={`w-6 h-6 rounded-md flex items-center justify-center ${itemDensity === 'comfortable' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}>
                                    <LayoutGrid size={11} />
                                </button>
                                <button onClick={() => onSetDensity('compact')} className={`w-6 h-6 rounded-md flex items-center justify-center ${itemDensity === 'compact' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}>
                                    <Grid2x2 size={11} />
                                </button>
                                <button onClick={() => onSetDensity('ultra')} className={`w-6 h-6 rounded-md flex items-center justify-center ${itemDensity === 'ultra' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}>
                                    <span className="text-[7px] font-black">UL</span>
                                </button>
                            </div>

                            {(searchQuery || itemFilter !== 'all' || itemSort !== 'smart') && (
                                <button onClick={onResetFilters} className="px-1.5 py-1 rounded-md text-muted hover:text-primary text-[9px] font-black uppercase">
                                    {isRTL ? 'إعادة' : 'Reset'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Quick picks */}
                    {showMobileFilters && quickPickItems.length > 0 && (
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                            <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-muted flex items-center gap-0.5">
                                <Sparkles size={9} /> {isRTL ? 'سريع' : 'Quick'}
                            </span>
                            {quickPickItems.map((item: any) => (
                                <button
                                    key={`qp-${item.id}`}
                                    onClick={() => onAddItem(item)}
                                    className="shrink-0 inline-flex items-center gap-0.5 px-2 py-1 rounded-full bg-elevated/60 text-main hover:bg-primary hover:text-white transition-colors"
                                >
                                    <Plus size={9} />
                                    <span className="text-[9px] font-bold whitespace-nowrap">{(item as any).displayName || item.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Item Grid (maximized area) ── */}
                <div className="flex-1 overflow-y-auto p-1.5 md:p-2 min-h-0 bg-app custom-scrollbar">
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
