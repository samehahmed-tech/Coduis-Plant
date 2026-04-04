
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Plus, UtensilsCrossed, Loader2, AlertCircle, X, Sparkles, DollarSign,
    ChevronRight
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { MenuItem, MenuCategory } from '../../types';
import { useMenuStore } from '../../stores/useMenuStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import MenuSidebar from './MenuSidebar';
import MenuToolbar from './MenuToolbar';
import ItemCard from './ItemCard';
import ItemTable from './ItemTable';
import ItemDrawer from './ItemDrawer';
import CategoryDrawer from './CategoryDrawer';
import BulkActionsBar from './BulkActionsBar';
import AnalyticsPanel from './AnalyticsPanel';

export type ViewMode = 'grid' | 'list' | 'analytics';
export type DensityMode = 'comfortable' | 'compact';
export type SortField = 'name' | 'price' | 'margin' | 'sales' | 'revenue' | 'recent';
export type FilterTag = 'all' | 'active' | 'inactive' | 'low-margin' | 'best-seller' | 'no-image' | 'archived';

const MenuProfitCenter: React.FC = () => {
    const {
        menus, categories, isLoading, error,
        updateMenuItem, addMenuItem, deleteMenuItem,
        addCategory, updateCategory, deleteCategory, reorderCategories,
        addMenu, updateMenu, linkCategory, fetchMenu,
        bulkUpdateItems, archiveItem, restoreItem, duplicateItem
    } = useMenuStore();
    const { inventory } = useInventoryStore();
    const { branches, printers, settings } = useAuthStore();
    const lang = settings.language;

    useEffect(() => { fetchMenu(); }, [fetchMenu]);

    // --- State ---
    const [selectedMenuId, setSelectedMenuId] = useState<string>(menus[0]?.id || '');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [density, setDensity] = useState<DensityMode>('comfortable');
    const [sortField, setSortField] = useState<SortField>('name');
    const [filterTag, setFilterTag] = useState<FilterTag>('all');
    const [sidebarSection, setSidebarSection] = useState<'menus' | 'offers' | 'scheduled' | 'archived'>('menus');

    // Drawers
    const [drawerItem, setDrawerItem] = useState<{ item: MenuItem; menuId: string; categoryId: string; mode: 'ADD' | 'EDIT' } | null>(null);
    const [drawerCategory, setDrawerCategory] = useState<{ category: MenuCategory; mode: 'ADD' | 'EDIT' } | null>(null);

    // Bulk selection
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [multiSelectMode, setMultiSelectMode] = useState(false);

    // Quick Add
    const [quickAdd, setQuickAdd] = useState<{ name: string; price: string }>({ name: '', price: '' });

    // Branch selection (multi-branch)
    const [selectedBranchId, setSelectedBranchId] = useState<string | 'all'>('all');
    const [comparisonMode, setComparisonMode] = useState(false);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                handleNewItem();
            }
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                document.getElementById('menu-search-input')?.focus();
            }
            if (e.key === 'Escape') {
                setDrawerItem(null);
                setSelectedItemIds(new Set());
                setMultiSelectMode(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const selectedMenu = menus.find(m => m.id === selectedMenuId);

    // --- Computed ---
    const allItems = useMemo(() => {
        if (!selectedMenu) return [];
        const cats = categories.filter(cat => cat.menuIds.includes(selectedMenu.id));
        return cats.flatMap(cat => cat.items.map(item => ({
            ...item,
            _categoryId: cat.id,
            _categoryName: cat.name,
            _categoryNameAr: cat.nameAr || cat.name,
        })));
    }, [selectedMenu, categories]);

    const filteredItems = useMemo(() => {
        let items = [...allItems];

        // Filter by section
        if (sidebarSection === 'archived') {
            items = items.filter(i => i.archivedAt);
        } else {
            items = items.filter(i => !i.archivedAt);
        }

        // Filter by category
        if (selectedCategoryId !== 'all') {
            items = items.filter(i => i._categoryId === selectedCategoryId);
        }

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(i =>
                i.name.toLowerCase().includes(q) ||
                i.nameAr?.toLowerCase().includes(q) ||
                i.sku?.toLowerCase().includes(q) ||
                i.barcode?.toLowerCase().includes(q) ||
                i.description?.toLowerCase().includes(q) ||
                String(i.price).includes(q)
            );
        }

        // Filter tag
        if (filterTag === 'active') items = items.filter(i => i.isAvailable);
        if (filterTag === 'inactive') items = items.filter(i => !i.isAvailable);
        if (filterTag === 'low-margin') items = items.filter(i => i.cost && i.price > 0 && ((i.price - i.cost) / i.price) < 0.15);
        if (filterTag === 'best-seller') items = items.filter(i => i.tags?.includes('best-seller') || (i.salesData?.last30 || 0) > 50);
        if (filterTag === 'no-image') items = items.filter(i => !i.image);
        if (filterTag === 'archived') items = items.filter(i => i.archivedAt);

        // Sort
        items.sort((a, b) => {
            switch (sortField) {
                case 'price': return b.price - a.price;
                case 'margin': {
                    const mA = a.cost ? (a.price - a.cost) / a.price : 0;
                    const mB = b.cost ? (b.price - b.cost) / b.price : 0;
                    return mB - mA;
                }
                case 'sales': return (b.salesData?.last30 || 0) - (a.salesData?.last30 || 0);
                case 'revenue': return (b.salesData?.revenue30 || 0) - (a.salesData?.revenue30 || 0);
                case 'recent': return (b.sortOrder || 0) - (a.sortOrder || 0);
                default: return a.name.localeCompare(b.name);
            }
        });

        return items;
    }, [allItems, searchQuery, filterTag, sortField, sidebarSection]);

    const filteredCategories = useMemo(() => {
        if (!selectedMenu) return [];
        return categories.filter(cat => cat.menuIds.includes(selectedMenu.id));
    }, [selectedMenu, categories]);

    // --- Handlers ---
    const handleNewItem = () => {
        const firstCat = filteredCategories[0];
        if (!firstCat) return;
        setDrawerItem({
            mode: 'ADD',
            menuId: selectedMenuId,
            categoryId: firstCat.id,
            item: {
                id: '', name: '', price: 0, categoryId: firstCat.id,
                isAvailable: true, availableDays: [], availableFrom: '', availableTo: '',
                modifierGroups: [], priceLists: [], printerIds: [], sizes: [], platformPricing: [],
                tags: [], versionHistory: [],
            }
        });
    };

    const handleItemClick = (item: MenuItem & { _categoryId: string }, e: React.MouseEvent) => {
        if (multiSelectMode || e.shiftKey) {
            setMultiSelectMode(true);
            setSelectedItemIds(prev => {
                const next = new Set(prev);
                if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                return next;
            });
        } else {
            setDrawerItem({ mode: 'EDIT', menuId: selectedMenuId, categoryId: item._categoryId, item });
        }
    };

    const handleDragItemEnd = (result: DropResult) => {
        if (!result.destination || selectedCategoryId === 'all') return;

        const itemsToReorder = Array.from(filteredItems);
        const [reorderedItem] = itemsToReorder.splice(result.source.index, 1);
        itemsToReorder.splice(result.destination.index, 0, reorderedItem);

        // Calculate updates
        const updates = itemsToReorder.map((item, index) => ({
            menuId: selectedMenuId,
            categoryId: selectedCategoryId,
            itemId: item.id,
            changes: { sortOrder: index }
        }));

        // Optimize UI locally by telling Zustand to bulk update
        bulkUpdateItems(updates);
    };

    const handleSaveItem = (item: MenuItem, categoryId: string) => {
        if (!drawerItem) return;
        if (drawerItem.mode === 'ADD') {
            addMenuItem(drawerItem.menuId, categoryId, { ...item, id: `item-${Date.now()}` });
        } else {
            updateMenuItem(drawerItem.menuId, categoryId, item);
        }
        setDrawerItem(null);
    };

    const handleToggleAvailability = (item: MenuItem & { _categoryId: string }) => {
        updateMenuItem(selectedMenuId, item._categoryId, { ...item, isAvailable: !item.isAvailable });
    };

    const handleDuplicate = (item: MenuItem & { _categoryId: string }) => {
        duplicateItem(selectedMenuId, item._categoryId, item.id);
    };

    const handleArchive = (item: MenuItem & { _categoryId: string }) => {
        archiveItem(selectedMenuId, item._categoryId, item.id);
    };

    const handleDelete = (item: MenuItem & { _categoryId: string }) => {
        deleteMenuItem(selectedMenuId, item._categoryId, item.id);
    };

    const handleBulkApply = (changes: Partial<MenuItem>) => {
        const updates = Array.from(selectedItemIds).map(id => {
            const item = allItems.find(i => i.id === id);
            return item ? { menuId: selectedMenuId, categoryId: item._categoryId, itemId: id, changes } : null;
        }).filter(Boolean) as any[];
        bulkUpdateItems(updates);
        setSelectedItemIds(new Set());
        setMultiSelectMode(false);
    };

    const handleQuickAdd = () => {
        if (!quickAdd.name.trim() || !quickAdd.price) return;
        const firstCat = filteredCategories[0];
        if (!firstCat) return;
        addMenuItem(selectedMenuId, firstCat.id, {
            id: `item-${Date.now()}`,
            name: quickAdd.name.trim(),
            price: parseFloat(quickAdd.price) || 0,
            categoryId: firstCat.id,
            isAvailable: true,
            availableDays: [],
            modifierGroups: [],
            priceLists: [],
            printerIds: [],
        });
        setQuickAdd({ name: '', price: '' });
    };

    // Summary stats
    const totalRevenue = allItems.reduce((s, i) => s + (i.salesData?.revenue30 || 0), 0);
    const avgMargin = allItems.length > 0
        ? allItems.reduce((s, i) => s + (i.cost && i.price > 0 ? ((i.price - i.cost) / i.price) * 100 : 0), 0) / allItems.length
        : 0;

    // --- Loading ---
    if (isLoading && categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-app">
                <Loader2 className="w-10 h-10 text-gray-400 dark:text-muted animate-spin mb-3" />
                <p className="text-gray-500 dark:text-muted font-medium text-[13px]">
                    {lang === 'ar' ? 'جاري تحميل المنيو...' : 'Loading menu...'}
                </p>
            </div>
        );
    }

    // --- Empty State (SaaS Style) ---
    if (allItems.length === 0 && !isLoading && !searchQuery && sidebarSection === 'menus') {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-app px-4 relative">
                <div className="text-center max-w-sm w-full bg-card p-8 rounded-lg border border-border/20 shadow-sm">
                    <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-blue-50 dark:bg-indigo-500/10 flex items-center justify-center text-blue-600 dark:text-indigo-500">
                        <UtensilsCrossed size={20} />
                    </div>
                    <h2 className="text-[16px] font-semibold text-gray-800 dark:text-main mb-2">
                        {lang === 'ar' ? 'قم ببناء المنيو' : 'Build Your Menu'}
                    </h2>
                    <p className="text-[13px] text-gray-500 dark:text-muted mb-6 leading-relaxed">
                        {lang === 'ar' ? 'أضف أول صنف للبدء.' : 'Add your first item to get started.'}
                    </p>
                    <button
                        onClick={handleNewItem}
                        className="w-full bg-blue-600 dark:bg-indigo-500 hover:bg-blue-700 dark:hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={16} />
                        {lang === 'ar' ? 'أضف الصنف الأول' : 'Add First Item'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-app relative">
            {/* Error Banner */}
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[200] py-2.5 px-4 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400 text-[12px] font-medium flex items-center gap-3 max-w-lg">
                    <AlertCircle size={16} />
                    {error}
                    <button onClick={() => useMenuStore.getState().clearError()} className="ml-auto p-1 hover:bg-rose-500/10 rounded"><X size={14} /></button>
                </div>
            )}

            <div className="flex h-full overflow-hidden">
                <MenuSidebar
                    menus={menus}
                    categories={filteredCategories}
                    selectedMenuId={selectedMenuId}
                    onSelectMenu={(id) => { setSelectedMenuId(id); setSelectedCategoryId('all'); }}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                    section={sidebarSection}
                    onChangeSection={setSidebarSection}
                    onAddCategory={() => setDrawerCategory({ mode: 'ADD', category: { id: `cat-${Date.now()}`, name: '', isActive: true, menuIds: [selectedMenuId], items: [] } })}
                    onEditCategory={(cat) => setDrawerCategory({ mode: 'EDIT', category: cat })}
                    onReorderCategories={(reordered) => reorderCategories(selectedMenuId, reordered)}
                    allItems={allItems}
                    totalRevenue={totalRevenue}
                    avgMargin={avgMargin}
                    lang={lang}
                    currency={settings.currencySymbol}
                />



                {/* MAIN CONTENT */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* TOP TOOLBAR */}
                    <MenuToolbar
                        categories={filteredCategories}
                        selectedCategoryId={selectedCategoryId}
                        onSelectCategory={setSelectedCategoryId}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        density={density}
                        onDensityChange={setDensity}
                        sortField={sortField}
                        onSortChange={setSortField}
                        filterTag={filterTag}
                        onFilterChange={setFilterTag}
                        onNewItem={handleNewItem}
                        multiSelectMode={multiSelectMode}
                        onToggleMultiSelect={() => {
                            setMultiSelectMode(!multiSelectMode);
                            if (multiSelectMode) setSelectedItemIds(new Set());
                        }}
                        itemCount={filteredItems.length}
                        selectedCount={selectedItemIds.size}
                        lang={lang}
                        branches={branches}
                        selectedBranchId={selectedBranchId}
                        onSelectBranch={setSelectedBranchId}
                        comparisonMode={comparisonMode}
                        onToggleComparison={() => setComparisonMode(!comparisonMode)}
                    />

                    {/* BREADCRUMB + METRICS STRIP */}
                    <div className="px-5 py-2.5 border-b border-gray-100 dark:border-white/[0.04] flex items-center gap-4">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-1.5 text-[12px]">
                            <span className="text-gray-400 dark:text-muted/50">{lang === 'ar' ? 'المنيو' : 'Menu'}</span>
                            <ChevronRight size={10} className="text-gray-300 dark:text-muted/30" />
                            <span className="text-gray-700 dark:text-main font-medium">{selectedMenu?.name || (lang === 'ar' ? 'القائمة الرئيسية' : 'Main Menu')}</span>
                        </div>

                        <div className="flex-1" />

                        {/* Compact Metrics */}
                        <div className="flex items-center gap-4 text-[11px]">
                            <div>
                                <span className="text-gray-400 dark:text-muted/50">{lang === 'ar' ? 'إجمالي' : 'Total'}: </span>
                                <span className="font-medium text-gray-700 dark:text-main">{filteredItems.length}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 dark:text-muted/50">{lang === 'ar' ? 'نشط' : 'Active'}: </span>
                                <span className="font-medium text-emerald-600 dark:text-emerald-500">{allItems.filter(i => i.isAvailable && !i.archivedAt).length}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 dark:text-muted/50">{lang === 'ar' ? 'الهامش' : 'Avg Margin'}: </span>
                                <span className={`font-medium ${avgMargin >= 50 ? 'text-emerald-600 dark:text-emerald-500' : avgMargin >= 30 ? 'text-amber-600 dark:text-amber-500' : 'text-red-600 dark:text-rose-500'}`}>{avgMargin.toFixed(0)}%</span>
                            </div>
                            {totalRevenue > 0 && (
                                <div>
                                    <span className="text-gray-400 dark:text-muted/50">30D: </span>
                                    <span className="font-medium text-gray-700 dark:text-main">{settings.currencySymbol}{totalRevenue > 1000 ? `${(totalRevenue / 1000).toFixed(1)}K` : totalRevenue.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CONTENT AREA */}
                    <div className="flex-1 overflow-y-auto p-5 pb-32 no-scrollbar">
                        {viewMode === 'analytics' ? (
                            <AnalyticsPanel items={allItems} lang={lang} currency={settings.currencySymbol} />
                        ) : viewMode === 'list' ? (
                            <div className="max-w-[1600px] h-full">
                                <ItemTable
                                    items={filteredItems}
                                    selectedItemIds={selectedItemIds}
                                    multiSelectMode={multiSelectMode}
                                    onToggleSelection={(id, shift) => {
                                        setSelectedItemIds(prev => {
                                            const next = new Set(prev);
                                            if (next.has(id)) next.delete(id); else next.add(id);
                                            return next;
                                        });
                                        if (!multiSelectMode) setMultiSelectMode(true);
                                    }}
                                    onSelectAll={() => {
                                        if (selectedItemIds.size === filteredItems.length) {
                                            setSelectedItemIds(new Set());
                                        } else {
                                            setSelectedItemIds(new Set(filteredItems.map(i => i.id)));
                                        }
                                    }}
                                    onToggleAvailability={(item) => handleToggleAvailability(item)}
                                    onDuplicate={(item) => handleDuplicate(item)}
                                    onArchive={(item) => handleArchive(item)}
                                    onDelete={(item) => handleDelete(item)}
                                    onEdit={(item) => setDrawerItem({ mode: 'EDIT', menuId: selectedMenuId, categoryId: item._categoryId, item })}
                                    onInlineUpdate={(categoryId, item) => updateMenuItem(selectedMenuId, categoryId, item)}
                                    lang={lang}
                                    currency={settings.currencySymbol}
                                />
                            </div>
                        ) : (
                            <DragDropContext onDragEnd={handleDragItemEnd}>
                                <Droppable droppableId="itemsGrid" direction="horizontal" type="item">
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`grid gap-4 max-w-[1600px] pb-4 ${density === 'compact' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}`}
                                        >
                                            {filteredItems.map((item, idx) => (
                                                <Draggable
                                                    key={item.id}
                                                    draggableId={item.id}
                                                    index={idx}
                                                    isDragDisabled={selectedCategoryId === 'all' || sidebarSection !== 'menus'}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            style={provided.draggableProps.style}
                                                            className={snapshot.isDragging ? 'z-50' : 'z-auto'}
                                                        >
                                                            <ItemCard
                                                                item={item}
                                                                viewMode={viewMode}
                                                                density={density}
                                                                isSelected={selectedItemIds.has(item.id)}
                                                                multiSelectMode={multiSelectMode}
                                                                onClick={(e) => handleItemClick(item, e)}
                                                                onToggleAvailability={() => handleToggleAvailability(item)}
                                                                onDuplicate={() => handleDuplicate(item)}
                                                                onArchive={() => handleArchive(item)}
                                                                onDelete={() => handleDelete(item)}
                                                                onEdit={() => setDrawerItem({ mode: 'EDIT', menuId: selectedMenuId, categoryId: item._categoryId, item })}
                                                                lang={lang}
                                                                currency={settings.currencySymbol}
                                                                index={idx}
                                                                dragHandleProps={provided.dragHandleProps}
                                                                draggableContext={selectedCategoryId !== 'all' && sidebarSection === 'menus'}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            {/* Quick Add Card — always last in grid */}
                                            {selectedCategoryId !== 'all' && sidebarSection === 'menus' && (
                                                <div className="rounded-lg border border-dashed border-border/40 bg-card/30 flex flex-col justify-center min-h-[160px] hover:bg-white/[0.02] hover:border-indigo-500/30 transition-colors group/qa p-4">
                                                    <div className="w-full space-y-2">
                                                        <div className="flex items-center gap-1.5 text-indigo-400">
                                                            <Sparkles size={14} />
                                                            <span className="text-[12px] font-medium">
                                                                {lang === 'ar' ? 'إضافة سريعة' : 'Quick Add'}
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder={lang === 'ar' ? 'اسم الصنف (مثال: قهوة عربي)...' : 'Item name (e.g. Arabic Coffee)...'}
                                                            value={quickAdd.name}
                                                            onChange={(e) => setQuickAdd(prev => ({ ...prev, name: e.target.value }))}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                                                            className="w-full bg-elevated h-9 px-3 rounded-md border border-border/30 text-[13px] text-main outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-muted/50"
                                                        />
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <div className="relative flex-1">
                                                                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted/50 w-3.5 h-3.5" />
                                                                <input
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    value={quickAdd.price}
                                                                    onChange={(e) => setQuickAdd(prev => ({ ...prev, price: e.target.value }))}
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                                                                    className="w-full bg-elevated h-9 pl-8 pr-3 rounded-md border border-border/30 text-[13px] font-medium text-emerald-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-muted/50"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={handleQuickAdd}
                                                                disabled={!quickAdd.name.trim() || !quickAdd.price}
                                                                className="bg-indigo-500 hover:bg-indigo-600 text-white h-9 px-3 rounded-md transition-colors disabled:opacity-50 flex items-center"
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}

                        {filteredItems.length === 0 && searchQuery && (
                            <div className="text-center py-20">
                                <p className="text-muted/60 font-medium text-[13px]">
                                    {lang === 'ar' ? 'لا توجد نتائج لـ' : 'No items match'} "{searchQuery}"
                                </p>
                                <p className="text-muted/40 text-[11px] mt-1">
                                    {lang === 'ar' ? 'جرب بحث مختلف' : 'Try a different search term'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BULK ACTIONS BAR */}
            {selectedItemIds.size > 0 && (
                <BulkActionsBar
                    selectedCount={selectedItemIds.size}
                    onApply={handleBulkApply}
                    onClearSelection={() => { setSelectedItemIds(new Set()); setMultiSelectMode(false); }}
                    lang={lang}
                    currency={settings.currencySymbol}
                />
            )}

            {/* ITEM DRAWER */}
            {drawerItem && (
                <ItemDrawer
                    item={drawerItem.item}
                    mode={drawerItem.mode}
                    categoryId={drawerItem.categoryId}
                    categories={filteredCategories}
                    printers={printers}
                    branches={branches}
                    inventory={inventory}
                    onSave={handleSaveItem}
                    onClose={() => setDrawerItem(null)}
                    onDelete={drawerItem.mode === 'EDIT' ? () => {
                        const cat = categories.find(c => c.items.some(i => i.id === drawerItem.item.id));
                        if (cat) deleteMenuItem(selectedMenuId, cat.id, drawerItem.item.id);
                        setDrawerItem(null);
                    } : undefined}
                    currency={settings.currencySymbol}
                    lang={lang}
                />
            )}

            {/* CATEGORY DRAWER */}
            {drawerCategory && (
                <CategoryDrawer
                    category={drawerCategory.category}
                    mode={drawerCategory.mode}
                    menuId={selectedMenuId}
                    printers={printers}
                    onSave={(cat) => {
                        if (drawerCategory.mode === 'ADD') {
                            addCategory(selectedMenuId, cat);
                        } else {
                            updateCategory(cat);
                        }
                        setDrawerCategory(null);
                    }}
                    onClose={() => setDrawerCategory(null)}
                    onDelete={drawerCategory.mode === 'EDIT' ? () => {
                        deleteCategory(selectedMenuId, drawerCategory.category.id);
                        setDrawerCategory(null);
                    } : undefined}
                    lang={lang}
                />
            )}
        </div>
    );
};

export default MenuProfitCenter;
