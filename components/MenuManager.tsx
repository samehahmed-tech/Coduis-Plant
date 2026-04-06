
import React, { useState, useMemo, useEffect, useCallback, useTransition, useRef, lazy, Suspense } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  Plus, Search, Edit3, Trash2, Tag,
  Layers, Clock, CheckCircle2, AlertCircle,
  ChevronRight, MoreVertical, Image as ImageIcon,
  DollarSign, Percent, Gift, Eye, EyeOff, Scale,
  Save, X, Info, LayoutGrid, List, Sparkles, Link, ShoppingBag,
  ArrowRight, Filter, ChevronDown, UtensilsCrossed,
  Settings, Building2, Globe, Truck, Map, Printer as PrinterIcon, Loader2, MapPin
} from 'lucide-react';
import { RestaurantMenu, MenuItem, Offer, MenuCategory, InventoryItem, RecipeIngredient, Branch, DeliveryPlatform, Printer, AppSettings, ModifierGroup, ModifierOption } from '../types';

// Stores
import { useMenuStore } from '../stores/useMenuStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useInventoryStore } from '../stores/useInventoryStore';

// Services
import { translations } from '../services/translations';

// Components
import ImageUploader from './common/ImageUploader';
import MenuCategoryList from './menu/MenuCategoryList';
const ItemDrawer = lazy(() =>
  import('./menu/ItemDrawer').then((module) => ({
    default: module.ItemDrawer,
  }))
);

const MenuManager: React.FC = () => {
  // Global State
  const {
    menus, categories, platforms, isLoading, error,
    updateMenuItem, addMenuItem, deleteMenuItem,
    addCategory, updateCategory, deleteCategory,
    addMenu, updateMenu, linkCategory, fetchMenu
  } = useMenuStore(
    useShallow((state) => ({
      menus: state.menus,
      categories: state.categories,
      platforms: state.platforms,
      isLoading: state.isLoading,
      error: state.error,
      updateMenuItem: state.updateMenuItem,
      addMenuItem: state.addMenuItem,
      deleteMenuItem: state.deleteMenuItem,
      addCategory: state.addCategory,
      updateCategory: state.updateCategory,
      deleteCategory: state.deleteCategory,
      addMenu: state.addMenu,
      updateMenu: state.updateMenu,
      linkCategory: state.linkCategory,
      fetchMenu: state.fetchMenu,
    }))
  );
  const { inventory } = useInventoryStore(
    useShallow((state) => ({
      inventory: state.inventory,
    }))
  );
  const { branches, printers, settings } = useAuthStore(
    useShallow((state) => ({
      branches: state.branches,
      printers: state.printers,
      settings: state.settings,
    }))
  );
  const lang = settings.language;
  // const t = translations[lang]; // Not heavily used here yet, using ternary for labels

  // 🔄 Fetch menu data from database on component mount
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'MENUS' | 'OFFERS'>('MENUS');
  const [selectedMenuId, setSelectedMenuId] = useState<string>(menus[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [deferredSearch, setDeferredSearch] = useState('');
  const [showAddExistingCategory, setShowAddExistingCategory] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      startTransition(() => setDeferredSearch(value));
    }, 150);
  }, []);

  // Modals
  const [itemModal, setItemModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; menuId: string; categoryId: string; item: MenuItem; } | null>(null);
  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    mode: 'ADD' | 'EDIT';
    category: MenuCategory
  } | null>(null);
  const [recipeModal, setRecipeModal] = useState<{ isOpen: boolean; menuId: string; categoryId: string; item: MenuItem; tempRecipe: RecipeIngredient[]; } | null>(null);
  const [menuSettingsModal, setMenuSettingsModal] = useState<RestaurantMenu | null>(null);

  const [newIngredientId, setNewIngredientId] = useState('');
  const [newIngredientQty, setNewIngredientQty] = useState<number>(0);

  const selectedMenu = menus.find(m => m.id === selectedMenuId);

  useEffect(() => {
    if (!selectedMenuId && menus.length > 0) {
      setSelectedMenuId(menus[0].id);
    }
  }, [menus, selectedMenuId]);

  const filteredCategories = useMemo(() => {
    if (!selectedMenu) return [];
    let cats = categories.filter(cat => cat.menuIds.includes(selectedMenu.id));
    // Pre-sort items inside each category once
    cats = cats.map(cat => ({
      ...cat,
      items: [...cat.items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    }));
    if (!deferredSearch) return cats;
    const q = deferredSearch.toLowerCase();
    return cats.map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      )
    })).filter(cat => cat.items.length > 0);
  }, [selectedMenu, categories, deferredSearch]);

  const otherCategories = useMemo(() => {
    if (!selectedMenu) return [];
    return categories.filter(cat => !cat.menuIds.includes(selectedMenu.id));
  }, [selectedMenu, categories]);

  // --- HANDLERS ---
  const handleSaveItem = useCallback(() => {
    if (!itemModal) return;
    // Use startTransition so modal closes instantly while store update reconciles in background
    startTransition(() => {
      if (itemModal.mode === 'ADD') {
        addMenuItem(itemModal.menuId, itemModal.categoryId, { ...itemModal.item, id: `item-${Date.now()}` });
      } else {
        updateMenuItem(itemModal.menuId, itemModal.categoryId, itemModal.item);
      }
    });
    setItemModal(null);
  }, [itemModal, addMenuItem, updateMenuItem, startTransition]);

  const handleSaveCategory = useCallback(() => {
    if (!categoryModal) return;
    startTransition(() => {
      if (categoryModal.mode === 'ADD') {
        const newCat: MenuCategory = {
          ...categoryModal.category,
          id: `cat-${Date.now()}`,
          items: []
        };
        addCategory(selectedMenuId, newCat);
      } else {
        updateCategory(categoryModal.category);
      }
    });
    setCategoryModal(null);
  }, [categoryModal, selectedMenuId, addCategory, updateCategory, startTransition]);

  const handleSaveRecipe = useCallback(() => {
    if (!recipeModal) return;
    startTransition(() => {
      updateMenuItem(recipeModal.menuId, recipeModal.categoryId, { ...recipeModal.item, recipe: recipeModal.tempRecipe });
    });
    setRecipeModal(null);
  }, [recipeModal, updateMenuItem, startTransition]);

  const addIngredientToTemp = () => {
    if (!newIngredientId || newIngredientQty <= 0 || !recipeModal) return;
    setRecipeModal(prev => {
      if (!prev) return null;
      const existingIdx = prev.tempRecipe.findIndex(ri => ri.itemId === newIngredientId);
      let nextRecipe = [...prev.tempRecipe];
      const inv = inventory.find(i => i.id === newIngredientId);
      const unit = String(inv?.unit || '');
      if (existingIdx !== -1) nextRecipe[existingIdx] = { ...nextRecipe[existingIdx], quantity: nextRecipe[existingIdx].quantity + newIngredientQty };
      else nextRecipe.push({ itemId: newIngredientId, quantity: newIngredientQty, unit });
      return { ...prev, tempRecipe: nextRecipe };
    });
    setNewIngredientId('');
    setNewIngredientQty(0);
  };

  const toggleTarget = (type: 'branch' | 'platform', id: string) => {
    if (!menuSettingsModal) return;
    const key = type === 'branch' ? 'targetBranches' : 'targetPlatforms';
    const current = (menuSettingsModal as any)[key] || [];
    const next = current.includes(id) ? current.filter((cid: string) => cid !== id) : [...current, id];
    setMenuSettingsModal({ ...menuSettingsModal, [key]: next });
  };

  const toggleItemPrinter = (printerId: string) => {
    if (!itemModal) return;
    const currentPrinters = itemModal.item.printerIds || [];
    const nextPrinters = currentPrinters.includes(printerId)
      ? currentPrinters.filter(id => id !== printerId)
      : [...currentPrinters, printerId];
    setItemModal({ ...itemModal, item: { ...itemModal.item, printerIds: nextPrinters } });
  };

  const handleQuickAdd = useCallback((catId: string, name: string, price: string) => {
    if (!selectedMenuId || !name.trim() || !price) return;

    const parsedPrice = parseFloat(price) || 0;
    const category = categories.find(c => c.id === catId);
    const order = category ? category.items.length + 1 : 1;

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: name.trim(),
      price: parsedPrice,
      categoryId: catId,
      isAvailable: true,
      availableDays: [],
      availableFrom: '',
      availableTo: '',
      modifierGroups: [],
      priceLists: [],
      printerIds: category?.printerIds || [],
      sortOrder: order,
    };

    addMenuItem(selectedMenuId, catId, newItem);
  }, [selectedMenuId, categories, addMenuItem]);

  const toggleCategoryPrinter = (printerId: string) => {
    if (!categoryModal) return;
    const currentPrinters = categoryModal.category.printerIds || [];
    const nextPrinters = currentPrinters.includes(printerId)
      ? currentPrinters.filter(id => id !== printerId)
      : [...currentPrinters, printerId];
    setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, printerIds: nextPrinters } });
  };

  // Stable callbacks for memoized MenuItemCard
  const handleToggleAvailability = useCallback((mId: string, catId: string, item: MenuItem) => {
    updateMenuItem(mId, catId, { ...item, isAvailable: !item.isAvailable });
  }, [updateMenuItem]);

  const handleEditItem = useCallback((mId: string, catId: string, item: MenuItem) => {
    setItemModal({ isOpen: true, mode: 'EDIT', menuId: mId, categoryId: catId, item });
  }, []);

  const handleOpenRecipe = useCallback((mId: string, catId: string, item: MenuItem) => {
    setRecipeModal({ isOpen: true, menuId: mId, categoryId: catId, item, tempRecipe: item.recipe || [] });
  }, []);

  const handleEditCategory = useCallback((category: MenuCategory) => {
    setCategoryModal({ isOpen: true, mode: 'EDIT', category });
  }, []);

  const dayOptions = [
    { id: 'mon', en: 'Mon', ar: '�������' },
    { id: 'tue', en: 'Tue', ar: '��������' },
    { id: 'wed', en: 'Wed', ar: '��������' },
    { id: 'thu', en: 'Thu', ar: '������' },
    { id: 'fri', en: 'Fri', ar: '������' },
    { id: 'sat', en: 'Sat', ar: '�����' },
    { id: 'sun', en: 'Sun', ar: '�����' }
  ];

  const toggleItemDay = (dayId: string) => {
    if (!itemModal) return;
    const current = itemModal.item.availableDays || [];
    const next = current.includes(dayId) ? current.filter(d => d !== dayId) : [...current, dayId];
    setItemModal({ ...itemModal, item: { ...itemModal.item, availableDays: next } });
  };

  const addModifierGroup = () => {
    if (!itemModal) return;
    const nextGroup = {
      id: `mod-${Date.now()}`,
      name: '',
      minSelection: 0,
      maxSelection: 1,
      options: []
    };
    const groups = itemModal.item.modifierGroups || [];
    setItemModal({ ...itemModal, item: { ...itemModal.item, modifierGroups: [...groups, nextGroup] } });
  };

  const updateModifierGroup = (groupId: string, updates: Partial<ModifierGroup>) => {
    if (!itemModal) return;
    const groups = (itemModal.item.modifierGroups || []).map(group =>
      group.id === groupId ? { ...group, ...updates } : group
    );
    setItemModal({ ...itemModal, item: { ...itemModal.item, modifierGroups: groups } });
  };

  const removeModifierGroup = (groupId: string) => {
    if (!itemModal) return;
    const groups = (itemModal.item.modifierGroups || []).filter(group => group.id !== groupId);
    setItemModal({ ...itemModal, item: { ...itemModal.item, modifierGroups: groups } });
  };

  const addModifierOption = (groupId: string) => {
    if (!itemModal) return;
    const groups = (itemModal.item.modifierGroups || []).map(group => {
      if (group.id !== groupId) return group;
      const nextOption = { id: `opt-${Date.now()}`, name: '', price: 0 };
      return { ...group, options: [...(group.options || []), nextOption] };
    });
    setItemModal({ ...itemModal, item: { ...itemModal.item, modifierGroups: groups } });
  };

  const updateModifierOption = (groupId: string, optionId: string, updates: Partial<ModifierOption>) => {
    if (!itemModal) return;
    const groups = (itemModal.item.modifierGroups || []).map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        options: (group.options || []).map(option => option.id === optionId ? { ...option, ...updates } : option)
      };
    });
    setItemModal({ ...itemModal, item: { ...itemModal.item, modifierGroups: groups } });
  };

  const removeModifierOption = (groupId: string, optionId: string) => {
    if (!itemModal) return;
    const groups = (itemModal.item.modifierGroups || []).map(group => {
      if (group.id !== groupId) return group;
      return { ...group, options: (group.options || []).filter(option => option.id !== optionId) };
    });
    setItemModal({ ...itemModal, item: { ...itemModal.item, modifierGroups: groups } });
  };

  const addPriceList = () => {
    if (!itemModal) return;
    const nextList = { name: '', price: 0, branchIds: [] as string[] };
    const lists = itemModal.item.priceLists || [];
    setItemModal({ ...itemModal, item: { ...itemModal.item, priceLists: [...lists, nextList] } });
  };

  const updatePriceList = (index: number, updates: { name?: string; price?: number; branchIds?: string[] }) => {
    if (!itemModal) return;
    const lists = (itemModal.item.priceLists || []).map((list, i) => i === index ? { ...list, ...updates } : list);
    setItemModal({ ...itemModal, item: { ...itemModal.item, priceLists: lists } });
  };

  const removePriceList = (index: number) => {
    if (!itemModal) return;
    const lists = (itemModal.item.priceLists || []).filter((_, i) => i !== index);
    setItemModal({ ...itemModal, item: { ...itemModal.item, priceLists: lists } });
  };

  const togglePriceListBranch = (index: number, branchId: string) => {
    if (!itemModal) return;
    const lists = itemModal.item.priceLists || [];
    const current = lists[index]?.branchIds || [];
    const next = current.includes(branchId) ? current.filter(id => id !== branchId) : [...current, branchId];
    updatePriceList(index, { branchIds: next });
  };

  // 🔄 Loading State
  if (isLoading && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-app">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted font-bold uppercase tracking-widest text-sm">
          {lang === 'ar' ? '���� ����� �������...' : 'Loading menu data...'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 min-h-screen bg-app transition-colors animate-fade-in pb-24 relative z-10">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] text-rose-500 text-sm font-bold flex items-center gap-3 backdrop-blur-md shadow-lg shadow-rose-500/5">
          <AlertCircle size={20} />
          {lang === 'ar' ? '��� �� ����� ��������: ' : 'Error loading data: '}{error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 relative z-20">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 uppercase tracking-tighter flex items-center gap-4 drop-shadow-sm">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-[1.5rem] flex items-center justify-center border border-indigo-500/30 text-indigo-500 shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <UtensilsCrossed size={24} />
            </div>
            {lang === 'ar' ? '������ ������' : 'Menu Catalog'}
            {isLoading && <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />}
          </h2>
          <p className="text-sm md:text-base text-muted font-bold tracking-wide mt-2">
            {lang === 'ar' ? '���� ������ ����� ������ ���� ���' : 'Engineer your recipes for maximum profit'}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <button
            onClick={() => setCategoryModal({
              isOpen: true,
              mode: 'ADD',
              category: { id: '', name: '', items: [], menuIds: [selectedMenuId], targetOrderTypes: [], printerIds: [] }
            })}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-card/50 backdrop-blur-md text-main px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] border border-border/20 hover:border-indigo-500/30 hover:text-indigo-400 transition-all shadow-sm active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            {lang === 'ar' ? '��� ����' : 'New Section'}
          </button>

          <button
            onClick={() => setItemModal({
              isOpen: true,
              mode: 'ADD',
              menuId: selectedMenuId,
              categoryId: filteredCategories[0]?.id || '',
              item: {
                id: '',
                name: '',
                price: 0,
                categoryId: '',
                isAvailable: true,
                availableDays: [],
                availableFrom: '',
                availableTo: '',
                modifierGroups: [],
                priceLists: [],
                printerIds: []
              }
            })}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 border border-indigo-400/30"
            disabled={filteredCategories.length === 0}
          >
            <UtensilsCrossed size={18} />
            {lang === 'ar' ? '��� ����' : 'New Item'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 mb-10 relative z-20">
        <div className="flex bg-card/50 backdrop-blur-xl p-2 rounded-[2rem] shadow-inner border border-border/20 shrink-0 self-start">
          <button onClick={() => setActiveTab('MENUS')} className={`px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'MENUS' ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 scale-105 border border-indigo-400/30' : 'text-muted hover:text-main hover:bg-elevated/40'}`}>
            <LayoutGrid size={16} className="inline mr-2" /> {lang === 'ar' ? '������� ������' : 'Active Menus'}
          </button>
          <button onClick={() => setActiveTab('OFFERS')} className={`px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'OFFERS' ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 scale-105 border border-orange-400/30' : 'text-muted hover:text-main hover:bg-elevated/40'}`}>
            <Gift size={16} className="inline mr-2" /> {lang === 'ar' ? '������' : 'Offers'}
          </button>
        </div>
        <div className="relative flex-1 lg:max-w-md group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[1.5rem] blur-md opacity-20 group-focus-within:opacity-40 transition-opacity duration-500" />
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted w-5 h-5 group-focus-within:text-indigo-500 transition-colors z-10" />
            <input type="text" placeholder={lang === 'ar' ? '��� �� �����...' : 'Search items...'} value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-card/60 backdrop-blur-md border border-border/30 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner font-bold text-sm text-main placeholder:text-muted/50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          {menus.map(menu => (
            <div key={menu.id} className="relative group">
              <button
                onClick={() => setSelectedMenuId(menu.id)}
                className={`w-full text-left p-6 rounded-[2.5rem] border backdrop-blur-3xl transition-all duration-500 hover:shadow-2xl overflow-hidden relative ${selectedMenuId === menu.id ? 'bg-card/80 border-indigo-500/50 text-white shadow-[0_15px_40px_rgba(99,102,241,0.2)] translate-x-2' : 'bg-card/40 border-border/20 hover:bg-card/60 hover:border-indigo-500/30 shadow-lg'}`}
              >
                {selectedMenuId === menu.id && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-cyan-500/5 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px] pointer-events-none" />
                  </>
                )}
                <div className="flex justify-between items-center mb-3 relative z-10">
                  <span className={`font-black text-xl tracking-tight truncate pr-6 transition-colors ${selectedMenuId === menu.id ? 'text-white drop-shadow-sm' : 'text-main'}`}>{menu.name}</span>
                  {menu.isDefault && <div className={`w-3 h-3 rounded-full border-2 border-transparent ${selectedMenuId === menu.id ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] border-border/40' : 'bg-indigo-500 shadow-sm'} animate-pulse`} />}
                </div>
                <div className="flex flex-wrap gap-2 items-center mt-3 relative z-10">
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${selectedMenuId === menu.id ? 'bg-indigo-500 text-white border-indigo-400/50 shadow-inner' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>{menu.status}</span>
                  {(menu.targetPlatforms?.length || 0) > 0 && <span className={`text-[9px] font-black tracking-[0.2em] px-2.5 py-1 rounded-lg border ${selectedMenuId === menu.id ? 'bg-indigo-500/50 text-white border-indigo-400/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{menu.targetPlatforms?.length} Apps</span>}
                  {(menu.targetBranches?.length || 0) > 0 && <span className={`text-[9px] font-black tracking-[0.2em] px-2.5 py-1 rounded-lg border ${selectedMenuId === menu.id ? 'bg-indigo-500/50 text-white border-indigo-400/30' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'}`}>{menu.targetBranches?.length} Br.</span>}
                </div>
              </button>
              <button
                onClick={() => {
                  const newName = prompt(lang === 'ar' ? '��� ������ ������:' : 'New Menu Name:', menu.name);
                  if (newName) updateMenu({ ...menu, name: newName });
                }}
                className={`absolute top-6 right-6 p-2.5 opacity-0 group-hover:opacity-100 transition-all rounded-[1rem] shadow-lg hover:scale-110 active:scale-95 border backdrop-blur-md z-20 ${selectedMenuId === menu.id ? 'bg-indigo-400/20 text-white border-indigo-300/30 hover:bg-indigo-400/40' : 'bg-card/80 border-border/30 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30'}`}
              >
                <Edit3 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Categories & Items — Memoized to prevent re-render on modal state changes */}
        <div className="lg:col-span-9 space-y-12">
          <MenuCategoryList
            categories={filteredCategories}
            selectedMenuId={selectedMenuId}
            lang={lang}
            currencySymbol={settings.currencySymbol}
            onEditCategory={handleEditCategory}
            onDeleteCategory={deleteCategory}
            onToggleAvailability={handleToggleAvailability}
            onEditItem={handleEditItem}
            onRecipeItem={handleOpenRecipe}
            onDeleteItem={deleteMenuItem}
            onQuickAdd={handleQuickAdd}
          />

          {/* Link Existing */}
          {otherCategories.length > 0 && !showAddExistingCategory && (
            <button onClick={() => setShowAddExistingCategory(true)} className="w-full py-8 border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center gap-2 text-muted hover:text-primary transition-all font-black text-xs uppercase tracking-widest"><Layers size={32} /> Link Existing Group</button>
          )}

          {showAddExistingCategory && (
            <div className="p-8 bg-primary/10 dark:bg-primary rounded-[2.5rem] border border-primary/20 dark:border-border animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6"><h4 className="text-sm font-black text-primary uppercase tracking-widest">Available to link</h4><button onClick={() => setShowAddExistingCategory(false)} className="text-muted hover:text-muted font-bold text-xs uppercase">Close</button></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {otherCategories.map(cat => (
                  <button key={cat.id} onClick={() => { linkCategory(selectedMenuId, cat.id); setShowAddExistingCategory(false); }} className="p-4 bg-card dark:bg-elevated rounded-2xl border border-border hover:border-primary/40 transition-all text-left">
                    <p className="font-black text-xs text-main">{cat.name}</p>
                    <p className="text-[9px] font-bold text-muted uppercase">{cat.items.length} Items</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MENU SETTINGS MODAL */}
      {menuSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-2xl rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-border/30 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="p-8 border-b border-border/20 flex justify-between items-center bg-elevated/40 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] shadow-[0_10px_20px_rgba(99,102,241,0.3)] border border-border/40">
                  <Settings size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-main uppercase tracking-tight drop-shadow-sm">Menu Targets</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Where should this menu appear?</p>
                </div>
              </div>
              <button onClick={() => setMenuSettingsModal(null)} className="p-3 bg-card/60 backdrop-blur-md text-muted hover:text-rose-400 border border-border/20 hover:border-rose-500/30 rounded-2xl transition-all shadow-sm active:scale-95"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar relative z-10">
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4"><Building2 size={16} /> Active Branches</h4>
                <div className="grid grid-cols-2 gap-4">
                  {branches.map(b => (
                    <button key={b.id} onClick={() => toggleTarget('branch', b.id)} className={`p-5 rounded-[1.5rem] border transition-all duration-300 text-left flex items-center justify-between group ${menuSettingsModal.targetBranches?.includes(b.id) ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/5 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] backdrop-blur-md' : 'bg-elevated/40 border-border/20 hover:border-indigo-500/30 hover:bg-elevated/60 backdrop-blur-sm shadow-inner'}`}>
                      <span className={`font-black text-xs uppercase tracking-wider transition-colors ${menuSettingsModal.targetBranches?.includes(b.id) ? 'text-indigo-400' : 'text-muted group-hover:text-main'}`}>{b.name}</span>
                      {menuSettingsModal.targetBranches?.includes(b.id) && <CheckCircle2 size={20} className="text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4"><Globe size={16} /> Delivery Platforms</h4>
                <div className="grid grid-cols-2 gap-4">
                  {platforms.map(p => (
                    <button key={p.id} onClick={() => toggleTarget('platform', p.id)} className={`p-5 rounded-[1.5rem] border transition-all duration-300 text-left flex items-center justify-between group ${menuSettingsModal.targetPlatforms?.includes(p.id) ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md' : 'bg-elevated/40 border-border/20 hover:border-emerald-500/30 hover:bg-elevated/60 backdrop-blur-sm shadow-inner'}`}>
                      <span className={`font-black text-xs uppercase tracking-wider transition-colors ${menuSettingsModal.targetPlatforms?.includes(p.id) ? 'text-emerald-400' : 'text-muted group-hover:text-main'}`}>{p.name}</span>
                      {menuSettingsModal.targetPlatforms?.includes(p.id) && <CheckCircle2 size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-[2rem] border border-amber-500/20 backdrop-blur-md shadow-inner">
                <div className="flex items-center gap-3 text-amber-500 mb-3 font-black text-[10px] uppercase tracking-[0.2em]"><AlertCircle size={18} /> Instant Sync Notice</div>
                <p className="text-sm text-amber-500/80 font-bold leading-relaxed">Changes to targets will sync instantly with the respective POS or Application APIs. Ensure branches are ready to process orders before enabling.</p>
              </div>
            </div>
            <div className="p-6 border-t border-border/20 bg-elevated/40 backdrop-blur-xl flex gap-4 relative z-10">
              <button onClick={() => setMenuSettingsModal(null)} className="flex-1 py-4 bg-card/60 backdrop-blur-md text-muted rounded-[1.2rem] font-black uppercase text-[10px] tracking-[0.2em] border border-border/20 hover:bg-card hover:text-main transition-all active:scale-95 shadow-sm">Cancel</button>
              <button onClick={() => { updateMenu(menuSettingsModal); setMenuSettingsModal(null); }} className="flex-[2] py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_10px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 border border-indigo-400/30 transition-all active:scale-95">Apply Configuration</button>
            </div>
          </div>
        </div>
      )}

      {itemModal && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 backdrop-blur-xl">
              <div className="flex items-center gap-3 rounded-full border border-border/20 bg-card/70 px-6 py-3 text-sm font-black text-main shadow-2xl">
                <Loader2 size={18} className="animate-spin text-indigo-400" />
                Preparing editor...
              </div>
            </div>
          }
        >
          <ItemDrawer
            item={itemModal.item}
            mode={itemModal.mode}
            categoryId={itemModal.categoryId}
            categories={categories}
            printers={printers}
            branches={branches}
            inventory={inventory}
            lang={lang}
            currency={settings.currencySymbol || 'EGP'}
            onClose={() => setItemModal(null)}
            onDelete={itemModal.mode === 'EDIT' ? () => {
              deleteMenuItem(itemModal.menuId, itemModal.categoryId, itemModal.item.id);
              setItemModal(null);
            } : undefined}
            onSave={(nextItem, nextCategoryId) => {
              startTransition(() => {
                if (itemModal.mode === 'ADD') {
                  addMenuItem(itemModal.menuId, nextCategoryId, { ...nextItem, id: `item-${Date.now()}` });
                } else if (nextCategoryId !== itemModal.categoryId) {
                  deleteMenuItem(itemModal.menuId, itemModal.categoryId, itemModal.item.id);
                  addMenuItem(itemModal.menuId, nextCategoryId, { ...nextItem, categoryId: nextCategoryId });
                } else {
                  updateMenuItem(itemModal.menuId, nextCategoryId, { ...nextItem, categoryId: nextCategoryId });
                }
              });
              setItemModal(null);
            }}
          />
        </Suspense>
      )}

      {/* CATEGORY MODAL */}
      {categoryModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[110] p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-card w-full max-w-2xl rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-border/30 overflow-hidden flex flex-col max-h-[95vh] relative text-main">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="p-8 border-b border-border/20 flex justify-between items-center bg-elevated/40 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] shadow-[0_10px_20px_rgba(99,102,241,0.3)] border border-border/40">
                  <Layers size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-main uppercase tracking-tight drop-shadow-sm">{categoryModal.mode === 'ADD' ? (lang === 'ar' ? '��� ����' : 'New Section') : (lang === 'ar' ? '����� ���' : 'Edit Section')}</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">{lang === 'ar' ? '����� ������ ���������' : 'Configure group & visibility'}</p>
                </div>
              </div>
              <button onClick={() => setCategoryModal(null)} className="p-3 bg-card/60 backdrop-blur-sm text-muted rounded-[1rem] shadow-sm hover:text-rose-400 border border-border/20 hover:border-rose-500/30 hover:rotate-90 transition-all active:scale-95"><X size={28} /></button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="group/input space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? '����� (EN)' : 'Name (English)'}</label>
                  <input type="text" value={categoryModal.category.name} onChange={(e) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, name: e.target.value } })} className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-bold text-main border border-border/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none shadow-inner text-sm" placeholder="e.g. Burgers" />
                </div>
                <div className="group/input space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? '����� (AR)' : 'Name (Arabic)'}</label>
                  <input type="text" value={categoryModal.category.nameAr || ''} onChange={(e) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, nameAr: e.target.value } })} className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-bold text-main text-right border border-border/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none shadow-inner text-sm" placeholder="�����: ����" />
                </div>
              </div>

              <div className="space-y-4">
                <ImageUploader
                  value={categoryModal.category.image || ''}
                  onChange={(url) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, image: url } })}
                  type="category"
                  label={lang === 'ar' ? '���� �����' : 'Category Image'}
                  lang={lang}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><LayoutGrid size={14} /> {lang === 'ar' ? '����� ������� ��������' : 'Available Order Modes'}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: 'DINE_IN', icon: UtensilsCrossed, label: 'Dine In' },
                    { id: 'TAKEAWAY', icon: ShoppingBag, label: 'Takeaway' },
                    { id: 'PICKUP', icon: Map, label: 'Pickup' },
                    { id: 'DELIVERY', icon: Truck, label: 'Delivery' }
                  ].map(mode => {
                    const isSelected = categoryModal.category.targetOrderTypes?.includes(mode.id as any);
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          const types = categoryModal.category.targetOrderTypes || [];
                          const newTypes = types.includes(mode.id as any)
                            ? types.filter(t => t !== mode.id)
                            : [...types, mode.id];
                          setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, targetOrderTypes: newTypes as any } });
                        }}
                        className={`p-5 rounded-[1.5rem] border transition-all duration-300 flex flex-col items-center gap-3 ${isSelected ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] shadow-inner' : 'border-border/20 bg-elevated/30 text-muted hover:border-indigo-500/30 hover:text-main'}`}
                      >
                        <mode.icon size={24} />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-center">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Layers size={14} /> {lang === 'ar' ? '��� ��������' : 'Linked Menus'}</label>
                <div className="flex flex-wrap gap-3">
                  {menus.map(menu => {
                    const isLinked = categoryModal.category.menuIds.includes(menu.id);
                    return (
                      <button
                        key={menu.id}
                        onClick={() => {
                          const ids = categoryModal.category.menuIds;
                          const newIds = ids.includes(menu.id) ? ids.filter(id => id !== menu.id) : [...ids, menu.id];
                          setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, menuIds: newIds } });
                        }}
                        className={`px-5 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${isLinked ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 border-indigo-400/30 text-white shadow-[0_5px_15px_rgba(99,102,241,0.2)]' : 'bg-elevated/40 border-border/20 text-muted hover:border-indigo-500/30 hover:text-indigo-400 shadow-inner'}`}
                      >
                        {menu.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><PrinterIcon size={14} /> {lang === 'ar' ? '������ ����� ����������' : 'Default Section Printers'}</label>
                <div className="flex flex-wrap gap-3">
                  {printers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => toggleCategoryPrinter(p.id)}
                      className={`px-5 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-[0.2em] border transition-all flex items-center gap-2 ${categoryModal.category.printerIds?.includes(p.id) ? 'bg-gradient-to-r from-emerald-500 to-teal-400 border-emerald-400/30 text-white shadow-[0_5px_15px_rgba(16,185,129,0.2)]' : 'bg-elevated/40 border-border/20 text-muted hover:border-emerald-500/30 hover:text-emerald-400 shadow-inner'}`}
                    >
                      <PrinterIcon size={14} />
                      {p.name}
                    </button>
                  ))}
                  {printers.length === 0 && (
                    <p className="text-[11px] text-muted italic px-2">{lang === 'ar' ? '�� ���� ������ �����' : 'No printers configured yet.'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-border/20 bg-elevated/40 backdrop-blur-xl flex gap-4 relative z-10">
              <button
                onClick={() => setCategoryModal(null)}
                className="flex-[1] py-5 bg-card/60 backdrop-blur-md text-muted rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] border border-border/20 hover:bg-card hover:text-main transition-all active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button onClick={handleSaveCategory} className="flex-[2] py-5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 border border-indigo-400/30 transition-all active:scale-95">
                {categoryModal.mode === 'ADD' ? (lang === 'ar' ? '����� �����' : 'Create Section') : (lang === 'ar' ? '��� ���������' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECIPE MODAL */}
      {recipeModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[110] p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-card w-full max-w-3xl rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-border/30 overflow-hidden flex flex-col max-h-[95vh] relative text-main">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 pointer-events-none" />
            <div className="p-8 border-b border-border/20 bg-elevated/40 backdrop-blur-md flex justify-between items-center relative z-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-[1.2rem] shadow-[0_10px_20px_rgba(245,158,11,0.3)] border border-border/40">
                  <Scale size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-main uppercase tracking-tight drop-shadow-sm">Recipe: {recipeModal.item.name}</h3>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Manage components and quantities</p>
                </div>
              </div>
              <button onClick={() => setRecipeModal(null)} className="p-3 bg-card/60 backdrop-blur-sm text-muted rounded-[1rem] shadow-sm hover:text-rose-400 border border-border/20 hover:border-rose-500/30 hover:rotate-90 transition-all active:scale-95"><X size={28} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar relative z-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 ml-1"><Layers size={14} /> Components</h4>
                <div className="space-y-3">
                  {recipeModal.tempRecipe.map((ri) => {
                    const inv = inventory.find(i => i.id === ri.itemId);
                    return (
                      <div key={ri.itemId} className="flex justify-between items-center p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.5rem] border border-border/20 shadow-inner hover:border-amber-500/30 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-[1rem] flex items-center justify-center text-amber-500 font-black border border-amber-500/30 group-hover:scale-105 transition-transform">
                            {inv?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-main text-sm">{inv?.name}</p>
                            <p className="text-[10px] font-bold text-muted mt-0.5">Stock Unit: {inv?.unit}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-5">
                          <span className="text-lg font-black text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">{ri.quantity}</span>
                          <button onClick={() => setRecipeModal({ ...recipeModal, tempRecipe: recipeModal.tempRecipe.filter(r => r.itemId !== ri.itemId) })} className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-[1rem] transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    );
                  })}
                  {recipeModal.tempRecipe.length === 0 && (
                    <div className="p-10 text-center border-2 border-dashed border-border/30 rounded-[2rem] bg-elevated/20">
                      <p className="text-muted font-bold text-sm">No components added to this recipe yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-8 rounded-[2rem] border border-amber-500/20 shadow-inner">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-6"><Plus size={14} /> Add Component</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div className="group/sel space-y-2">
                    <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/sel:text-amber-500 transition-colors">Inventory Item</label>
                    <select value={newIngredientId} onChange={(e) => setNewIngredientId(e.target.value)} className="w-full p-4.5 rounded-[1.2rem] bg-card/60 backdrop-blur-sm border border-border/20 outline-none text-sm font-bold shadow-inner focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-main">
                      <option value="" className="bg-card">Select Item...</option>
                      {inventory.map(inv => (<option key={inv.id} value={inv.id} className="bg-card">{inv.name} ({inv.unit})</option>))}
                    </select>
                  </div>
                  <div className="group/qty space-y-2">
                    <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/qty:text-amber-500 transition-colors">Quantity</label>
                    <input type="number" step="0.01" value={newIngredientQty || ''} onChange={(e) => setNewIngredientQty(parseFloat(e.target.value))} placeholder="0.00" className="w-full p-4.5 rounded-[1.2rem] bg-card/60 backdrop-blur-sm border border-border/20 outline-none text-sm font-black shadow-inner focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-main" />
                  </div>
                </div>
                <button onClick={addIngredientToTemp} disabled={!newIngredientId || newIngredientQty <= 0} className="w-full py-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-white hover:border-amber-400/30 rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none">Add To Recipe</button>
              </div>
            </div>

            <div className="p-8 border-t border-border/20 bg-elevated/40 backdrop-blur-xl flex gap-4 relative z-10">
              <button onClick={() => setRecipeModal(null)} className="flex-[1] py-5 bg-card/60 backdrop-blur-md text-muted rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] border border-border/20 hover:bg-card hover:text-main transition-all active:scale-95 shadow-sm">Cancel</button>
              <button onClick={handleSaveRecipe} className="flex-[2] py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_30px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 border border-amber-400/30 transition-all active:scale-95">Save & Sync Stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
