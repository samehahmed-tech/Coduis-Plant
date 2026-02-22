/**
 * POSItemsPanel — Search + Items Grid
 * Minimal UI: search bar + item count + one "Tools" dropdown for all controls.
 * Categories handled by separate CategorySidebar on desktop,
 * and a compact horizontal strip on mobile only.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    Search, X, SlidersHorizontal, LayoutGrid, Grid2x2, List, Grid3x3,
    ArrowUpDown, Sparkles, Plus, ShoppingBag
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

// Tools dropdown component
const ToolsDropdown: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    itemFilter: string;
    onSetFilter: (f: any) => void;
    itemSort: string;
    onSetSort: (s: any) => void;
    itemDensity: string;
    onSetDensity: (d: any) => void;
    onReset: () => void;
    lang: string;
}> = ({ isOpen, onClose, itemFilter, onSetFilter, itemSort, onSetSort, itemDensity, onSetDensity, onReset, lang }) => {
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
        <div ref={ref} className={`absolute top-full mt-1 ${isRTL ? 'left-0' : 'right-0'} z-50 w-56 bg-card border border-border/40 rounded-xl shadow-xl p-2.5 space-y-2.5 animate-scale-in`}>
            {/* View mode */}
            <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-1">{isRTL ? 'طريقة العرض' : 'View'}</p>
                <div className="flex gap-1">
                    {[
                        { id: 'comfortable', icon: <LayoutGrid size={13} />, label: isRTL ? 'صور' : 'Cards' },
                        { id: 'compact', icon: <Grid2x2 size={13} />, label: isRTL ? 'صغير' : 'Small' },
                        { id: 'ultra', icon: <List size={13} />, label: isRTL ? 'قائمة' : 'List' },
                        { id: 'buttons', icon: <Grid3x3 size={13} />, label: isRTL ? 'أزرار' : 'Buttons' },
                    ].map(v => (
                        <button
                            key={v.id}
                            onClick={() => onSetDensity(v.id)}
                            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[8px] font-bold transition-colors ${itemDensity === v.id ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-elevated/50'
                                }`}
                        >
                            {v.icon}
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filter */}
            <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-1">{isRTL ? 'فلتر' : 'Filter'}</p>
                <div className="flex gap-1">
                    {[
                        { id: 'all', label: isRTL ? 'الكل' : 'All' },
                        { id: 'available', label: isRTL ? 'متاح' : 'Available' },
                        { id: 'popular', label: isRTL ? 'مميز' : 'Popular' },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => onSetFilter(f.id)}
                            className={`flex-1 py-1 rounded-md text-[9px] font-bold transition-colors ${itemFilter === f.id ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-elevated/50'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort */}
            <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-1">{isRTL ? 'ترتيب' : 'Sort'}</p>
                <select
                    value={itemSort}
                    onChange={(e) => onSetSort(e.target.value)}
                    className="w-full h-7 rounded-md bg-elevated/50 border-0 text-[10px] font-bold text-main px-2"
                >
                    <option value="smart">{isRTL ? 'ذكي' : 'Smart'}</option>
                    <option value="name">{isRTL ? 'الاسم' : 'Name'}</option>
                    <option value="price_asc">{isRTL ? 'السعر ↑' : 'Price ↑'}</option>
                    <option value="price_desc">{isRTL ? 'السعر ↓' : 'Price ↓'}</option>
                </select>
            </div>

            {/* Reset */}
            <button
                onClick={onReset}
                className="w-full py-1.5 rounded-md bg-elevated/50 text-muted hover:text-primary text-[9px] font-bold transition-colors"
            >
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

            {/* Search bar row — clean and minimal */}
            <div className="shrink-0 px-2 py-1 flex items-center gap-1.5 border-b border-border/20 bg-card/60">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                    <Search className={`absolute top-1/2 -translate-y-1/2 text-muted/40 w-3.5 h-3.5 ${isRTL ? 'right-2.5' : 'left-2.5'}`} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t.search_placeholder}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={`w-full h-8 text-xs bg-elevated/30 border border-border/20 rounded-lg focus:ring-1 focus:ring-primary/30 focus:border-primary/30 font-semibold outline-none transition-all ${isRTL ? 'pr-8 pl-8 text-right' : 'pl-8 pr-8 text-left'}`}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className={`absolute top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors ${isRTL ? 'left-2' : 'right-2'}`}
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Item count */}
                <span className="text-[9px] font-black text-primary bg-primary/8 px-1.5 py-0.5 rounded-md shrink-0">
                    {pricedItems.length}
                </span>

                {/* Tools button */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setToolsOpen(p => !p)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${toolsOpen ? 'bg-primary/10 text-primary' : 'bg-elevated/40 text-muted hover:text-primary'
                            }`}
                        title="Tools"
                    >
                        <SlidersHorizontal size={13} />
                    </button>
                    <ToolsDropdown
                        isOpen={toolsOpen}
                        onClose={() => setToolsOpen(false)}
                        itemFilter={itemFilter}
                        onSetFilter={onSetFilter}
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
                    <button
                        onClick={onOpenCart}
                        className="lg:hidden shrink-0 w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center relative"
                    >
                        <ShoppingBag size={13} />
                        <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-emerald-500 text-white text-[7px] font-black flex items-center justify-center">
                            {cartStats.qty}
                        </span>
                    </button>
                )}
            </div>

            {/* Item Grid — fills all remaining space */}
            <div className="flex-1 overflow-y-auto p-1.5 min-h-0 bg-app custom-scrollbar">
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
