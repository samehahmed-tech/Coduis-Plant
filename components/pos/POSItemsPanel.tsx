import React, { useEffect, useRef, useState } from 'react';
import {
    Search,
    X,
    SlidersHorizontal,
    LayoutGrid,
    Grid2x2,
    List,
    Grid3x3,
    ShoppingBag,
    Star,
    CheckCircle,
    RotateCcw,
    Sparkles,
    ArrowUpDown,
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

const ToolsDropdown: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    itemSort: string;
    onSetSort: (s: any) => void;
    itemDensity: string;
    onSetDensity: (d: any) => void;
    onReset: () => void;
    lang: string;
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

    const densityOptions = [
        { id: 'comfortable', icon: LayoutGrid, label: isRTL ? 'مريح' : 'Cards' },
        { id: 'compact', icon: Grid2x2, label: isRTL ? 'مضغوط' : 'Small' },
        { id: 'ultra', icon: List, label: isRTL ? 'قائمة' : 'List' },
        { id: 'buttons', icon: Grid3x3, label: isRTL ? 'سريع' : 'Fast' },
    ];

    const sortOptions = [
        { id: 'smart', label: isRTL ? 'ذكي' : 'Smart' },
        { id: 'name', label: isRTL ? 'أبجدي' : 'A → Z' },
        { id: 'price_asc', label: isRTL ? 'الأرخص' : 'Price ↑' },
        { id: 'price_desc', label: isRTL ? 'الأغلى' : 'Price ↓' },
    ];

    return (
        <div
            ref={ref}
            className={`absolute top-full z-50 mt-1.5 w-[280px] rounded-2xl border border-border/20 bg-white/98 backdrop-blur-xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-scale-in ${isRTL ? 'left-0' : 'right-0'}`}
        >
            <div className="space-y-3">
                <div>
                    <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted/60">
                        {isRTL ? 'طريقة العرض' : 'View Mode'}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                        {densityOptions.map((view) => {
                            const active = itemDensity === view.id;
                            return (
                                <button
                                    key={view.id}
                                    onClick={() => {
                                        onSetDensity(view.id);
                                        onClose();
                                    }}
                                    className={`flex h-[52px] flex-col items-center justify-center rounded-xl border transition-all duration-100 active:scale-95 ${active
                                        ? 'border-primary/30 bg-primary text-white shadow-md shadow-primary/15'
                                        : 'border-border/15 bg-elevated/40 text-muted hover:text-main hover:bg-elevated/80'
                                        }`}
                                >
                                    <view.icon size={14} />
                                    <span className="mt-1 text-[9px] font-bold">{view.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted/60">
                        {isRTL ? 'الترتيب' : 'Sort By'}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {sortOptions.map((opt) => {
                            const active = itemSort === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        onSetSort(opt.id);
                                        onClose();
                                    }}
                                    className={`h-9 rounded-xl border text-[10px] font-bold transition-all active:scale-95 ${active
                                        ? 'border-primary/25 bg-primary/8 text-primary'
                                        : 'border-border/15 bg-elevated/30 text-muted hover:text-main'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={() => {
                        onReset();
                        onClose();
                    }}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-border/15 bg-elevated/30 text-[10px] font-bold uppercase tracking-wider text-muted hover:text-main hover:bg-elevated/60 transition-colors active:scale-[0.97]"
                >
                    <RotateCcw size={11} />
                    {isRTL ? 'إعادة الضبط' : 'Reset All'}
                </button>
            </div>
        </div>
    );
};

const POSItemsPanel: React.FC<POSItemsPanelProps> = ({
    categories,
    activeCategory,
    onSetCategory,
    categoryResultCounts,
    totalMatchedCount,
    hasActiveFiltering,
    pricedItems,
    cartItems,
    onAddItem,
    onRemoveItem,
    highlightedItemId,
    searchQuery,
    onSearchChange,
    searchInputRef,
    itemFilter,
    onSetFilter,
    itemSort,
    onSetSort,
    itemDensity,
    onSetDensity,
    showMobileFilters,
    onToggleFilters,
    onResetFilters,
    quickPickItems,
    quickCategoryNav,
    isTouchMode,
    lang,
    t,
    currencySymbol,
    isCartVisible,
    cartStats,
    cartTotal,
    isCartOpenMobile,
    onOpenCart,
    hasCartItems,
}) => {
    const isRTL = lang === 'ar';
    const [toolsOpen, setToolsOpen] = useState(false);
    const quickCategories = quickCategoryNav;

    return (
        <div className="flex flex-1 h-full min-h-0 min-w-0 flex-col overflow-hidden bg-app">
            {/* ─── Unified Toolbar ─── */}
            <div className="pos-items-toolbar shrink-0 border-b border-border/10 bg-white/80 backdrop-blur-sm px-2.5 py-1.5 md:px-3">
                {/* Row 1: Search + Filters + Tools */}
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative min-w-0 flex-1">
                        <Search className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted/50 ${isRTL ? 'right-3' : 'left-3'}`} size={16} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={t.search_placeholder}
                            className={`h-10 w-full rounded-xl border border-border/15 bg-card/60 px-3 text-sm font-bold text-main outline-none placeholder:text-muted/40 focus:border-primary/30 focus:ring-2 focus:ring-primary/8 transition-all ${isRTL ? 'pr-9 pl-9' : 'pl-9 pr-9'}`}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange('')}
                                className={`absolute top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-elevated/80 text-muted hover:bg-rose-500 hover:text-white transition-colors ${isRTL ? 'left-1.5' : 'right-1.5'}`}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Stats badge */}
                    <div className="hidden md:flex items-center gap-1 rounded-lg bg-primary/6 border border-primary/10 px-2 py-1.5 shrink-0">
                        <Sparkles size={11} className="text-primary" />
                        <span className="text-[10px] font-bold text-primary tabular-nums">{totalMatchedCount}</span>
                    </div>

                    {/* Quick filter pills */}
                    <button
                        onClick={() => onSetFilter(itemFilter === 'popular' ? 'all' : 'popular')}
                        className={`shrink-0 flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${itemFilter === 'popular'
                            ? 'border-amber-500/30 bg-amber-500 text-white shadow-sm shadow-amber-500/15'
                            : 'border-border/15 bg-card/60 text-muted hover:text-amber-600 hover:border-amber-200'
                            }`}
                    >
                        <Star size={13} className={itemFilter === 'popular' ? 'fill-current' : ''} />
                        <span className="hidden sm:inline">{isRTL ? 'مميز' : 'Top'}</span>
                    </button>
                    <button
                        onClick={() => onSetFilter(itemFilter === 'available' ? 'all' : 'available')}
                        className={`shrink-0 flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${itemFilter === 'available'
                            ? 'border-primary/30 bg-primary text-white shadow-sm shadow-primary/15'
                            : 'border-border/15 bg-card/60 text-muted hover:text-primary hover:border-primary/20'
                            }`}
                    >
                        <CheckCircle size={13} />
                        <span className="hidden sm:inline">{isRTL ? 'متاح' : 'Stock'}</span>
                    </button>

                    {/* Tools dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setToolsOpen((prev) => !prev)}
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-95 ${toolsOpen
                                ? 'border-primary/25 bg-primary text-white shadow-sm'
                                : 'border-border/15 bg-card/60 text-muted hover:text-main'
                                }`}
                        >
                            <SlidersHorizontal size={15} />
                        </button>
                        <ToolsDropdown
                            isOpen={toolsOpen}
                            onClose={() => setToolsOpen(false)}
                            itemSort={itemSort}
                            onSetSort={onSetSort}
                            itemDensity={itemDensity}
                            onSetDensity={onSetDensity}
                            onReset={onResetFilters}
                            lang={lang}
                        />
                    </div>

                    {/* Mobile cart button */}
                    {isCartVisible && !isCartOpenMobile && hasCartItems && (
                        <button
                            onClick={onOpenCart}
                            className="lg:hidden flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-white shadow-sm shadow-primary/20 active:scale-95 transition-all"
                        >
                            <ShoppingBag size={14} />
                            <span className="text-[10px] font-bold tabular-nums">
                                {cartStats.qty}
                            </span>
                        </button>
                    )}
                </div>

                {/* Row 2: Category pills (desktop) */}
                <div className="hidden gap-1.5 overflow-x-auto pos-scroll mt-2 pb-0.5 md:flex">
                    {quickCategories.map((category) => {
                        const count = categoryResultCounts[category.id] || 0;
                        const isActive = activeCategory === category.id;
                        const isEmpty = count === 0;
                        return (
                            <button
                                key={category.id}
                                onClick={() => onSetCategory(category.id)}
                                className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${isActive
                                    ? 'border-primary/25 bg-primary text-white shadow-sm shadow-primary/10'
                                    : isEmpty
                                        ? 'border-border/8 bg-card/30 text-muted/40'
                                        : 'border-border/12 bg-card/50 text-main hover:bg-elevated/60 hover:border-border/25'
                                    }`}
                            >
                                {isRTL ? (category.nameAr || category.name) : category.name}
                                <span className={`ml-1.5 text-[9px] tabular-nums ${isActive ? 'text-white/60' : 'text-muted/50'}`}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mobile category tabs */}
            <div className="shrink-0 border-b border-border/8 px-1.5 py-2 md:hidden">
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

            {/* ─── Item Grid ─── */}
            <div className="flex-1 min-h-0 overflow-auto">
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
