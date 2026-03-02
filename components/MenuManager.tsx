
import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Search, Edit3, Trash2, Tag,
  Layers, Clock, CheckCircle2, AlertCircle,
  ChevronRight, MoreVertical, Image as ImageIcon,
  DollarSign, Percent, Gift, Eye, EyeOff, Scale,
  Save, X, Info, LayoutGrid, List, Sparkles, Link, ShoppingBag,
  ArrowRight, Filter, ChevronDown, UtensilsCrossed,
  Settings, Building2, Globe, Truck, Map, Printer as PrinterIcon, Loader2
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

const MenuManager: React.FC = () => {
  // Global State
  const {
    menus, categories, platforms, isLoading, error,
    updateMenuItem, addMenuItem, deleteMenuItem,
    addCategory, updateCategory, deleteCategory,
    addMenu, updateMenu, linkCategory, fetchMenu
  } = useMenuStore();
  const { inventory } = useInventoryStore();
  const { branches, printers, settings } = useAuthStore();
  const lang = settings.language;
  // const t = translations[lang]; // Not heavily used here yet, using ternary for labels

  // ًں”„ Fetch menu data from database on component mount
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const [activeTab, setActiveTab] = useState<'MENUS' | 'OFFERS'>('MENUS');
  const [selectedMenuId, setSelectedMenuId] = useState<string>(menus[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddExistingCategory, setShowAddExistingCategory] = useState(false);

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

  const filteredCategories = useMemo(() => {
    if (!selectedMenu) return [];
    let cats = categories.filter(cat => cat.menuIds.includes(selectedMenu.id));
    if (!searchQuery) return cats;
    return cats.map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(cat => cat.items.length > 0);
  }, [selectedMenu, categories, searchQuery]);

  const otherCategories = useMemo(() => {
    if (!selectedMenu) return [];
    return categories.filter(cat => !cat.menuIds.includes(selectedMenu.id));
  }, [selectedMenu, categories]);

  // --- HANDLERS ---
  const handleSaveItem = () => {
    if (!itemModal) return;
    if (itemModal.mode === 'ADD') {
      addMenuItem(itemModal.menuId, itemModal.categoryId, { ...itemModal.item, id: `item-${Date.now()}` });
    } else {
      updateMenuItem(itemModal.menuId, itemModal.categoryId, itemModal.item);
    }
    setItemModal(null);
  };

  const handleSaveCategory = () => {
    if (!categoryModal) return;
    if (categoryModal.mode === 'ADD') {
      const newCat: MenuCategory = {
        ...categoryModal.category,
        id: `cat-${Date.now()}`,
        items: []
      };
      // The modal logic ensures menuIds has at least the current menu
      addCategory(selectedMenuId, newCat);
    } else {
      updateCategory(categoryModal.category);
    }
    setCategoryModal(null);
  };

  const handleSaveRecipe = () => {
    if (!recipeModal) return;
    updateMenuItem(recipeModal.menuId, recipeModal.categoryId, { ...recipeModal.item, recipe: recipeModal.tempRecipe });
    setRecipeModal(null);
  };

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

  const toggleCategoryPrinter = (printerId: string) => {
    if (!categoryModal) return;
    const currentPrinters = categoryModal.category.printerIds || [];
    const nextPrinters = currentPrinters.includes(printerId)
      ? currentPrinters.filter(id => id !== printerId)
      : [...currentPrinters, printerId];
    setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, printerIds: nextPrinters } });
  };

  const dayOptions = [
    { id: 'mon', en: 'Mon', ar: 'الاثنين' },
    { id: 'tue', en: 'Tue', ar: 'الثلاثاء' },
    { id: 'wed', en: 'Wed', ar: 'الأربعاء' },
    { id: 'thu', en: 'Thu', ar: 'الخميس' },
    { id: 'fri', en: 'Fri', ar: 'الجمعة' },
    { id: 'sat', en: 'Sat', ar: 'السبت' },
    { id: 'sun', en: 'Sun', ar: 'الأحد' }
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

  // ًں”„ Loading State
  if (isLoading && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-app">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted font-bold uppercase tracking-widest text-sm">
          {lang === 'ar' ? 'جاري تحميل القوائم...' : 'Loading menu data...'}
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
          {lang === 'ar' ? 'خطأ في تحميل البيانات: ' : 'Error loading data: '}{error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 relative z-20">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 uppercase tracking-tighter flex items-center gap-4 drop-shadow-sm">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-[1.5rem] flex items-center justify-center border border-indigo-500/30 text-indigo-500 shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <UtensilsCrossed size={24} />
            </div>
            {lang === 'ar' ? 'كتالوج المنيو' : 'Menu Catalog'}
            {isLoading && <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />}
          </h2>
          <p className="text-sm md:text-base text-muted font-bold tracking-wide mt-2">
            {lang === 'ar' ? 'هندس قائمتك بذكاء لتحقيق أفضل ربح' : 'Engineer your recipes for maximum profit'}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <button
            onClick={() => setCategoryModal({
              isOpen: true,
              mode: 'ADD',
              category: { id: '', name: '', items: [], menuIds: [selectedMenuId], targetOrderTypes: [], printerIds: [] }
            })}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-card/50 backdrop-blur-md text-main px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] border border-white/5 hover:border-indigo-500/30 hover:text-indigo-400 transition-all shadow-sm active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            {lang === 'ar' ? 'قسم جديد' : 'New Section'}
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
            {lang === 'ar' ? 'صنف جديد' : 'New Item'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 mb-10 relative z-20">
        <div className="flex bg-card/50 backdrop-blur-xl p-2 rounded-[2rem] shadow-inner border border-white/5 shrink-0 self-start">
          <button onClick={() => setActiveTab('MENUS')} className={`px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'MENUS' ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 scale-105 border border-indigo-400/30' : 'text-muted hover:text-main hover:bg-white/5'}`}>
            <LayoutGrid size={16} className="inline mr-2" /> {lang === 'ar' ? 'القوائم النشطة' : 'Active Menus'}
          </button>
          <button onClick={() => setActiveTab('OFFERS')} className={`px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'OFFERS' ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 scale-105 border border-orange-400/30' : 'text-muted hover:text-main hover:bg-white/5'}`}>
            <Gift size={16} className="inline mr-2" /> {lang === 'ar' ? 'العروض' : 'Offers'}
          </button>
        </div>
        <div className="relative flex-1 lg:max-w-md group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[1.5rem] blur-md opacity-20 group-focus-within:opacity-40 transition-opacity duration-500" />
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted w-5 h-5 group-focus-within:text-indigo-500 transition-colors z-10" />
            <input type="text" placeholder={lang === 'ar' ? 'بحث عن أصناف...' : 'Search items...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-card/60 backdrop-blur-md border border-white/10 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner font-bold text-sm text-main placeholder:text-muted/50" />
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
                className={`w-full text-left p-6 rounded-[2.5rem] border backdrop-blur-3xl transition-all duration-500 hover:shadow-2xl overflow-hidden relative ${selectedMenuId === menu.id ? 'bg-card/80 border-indigo-500/50 text-white shadow-[0_15px_40px_rgba(99,102,241,0.2)] translate-x-2' : 'bg-card/40 border-white/5 hover:bg-card/60 hover:border-indigo-500/30 shadow-lg'}`}
              >
                {selectedMenuId === menu.id && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-cyan-500/5 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px] pointer-events-none" />
                  </>
                )}
                <div className="flex justify-between items-center mb-3 relative z-10">
                  <span className={`font-black text-xl tracking-tight truncate pr-6 transition-colors ${selectedMenuId === menu.id ? 'text-white drop-shadow-sm' : 'text-main'}`}>{menu.name}</span>
                  {menu.isDefault && <div className={`w-3 h-3 rounded-full border-2 border-transparent ${selectedMenuId === menu.id ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] border-white/20' : 'bg-indigo-500 shadow-sm'} animate-pulse`} />}
                </div>
                <div className="flex flex-wrap gap-2 items-center mt-3 relative z-10">
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${selectedMenuId === menu.id ? 'bg-indigo-500 text-white border-indigo-400/50 shadow-inner' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>{menu.status}</span>
                  {(menu.targetPlatforms?.length || 0) > 0 && <span className={`text-[9px] font-black tracking-[0.2em] px-2.5 py-1 rounded-lg border ${selectedMenuId === menu.id ? 'bg-indigo-500/50 text-white border-indigo-400/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{menu.targetPlatforms?.length} Apps</span>}
                  {(menu.targetBranches?.length || 0) > 0 && <span className={`text-[9px] font-black tracking-[0.2em] px-2.5 py-1 rounded-lg border ${selectedMenuId === menu.id ? 'bg-indigo-500/50 text-white border-indigo-400/30' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'}`}>{menu.targetBranches?.length} Br.</span>}
                </div>
              </button>
              <button
                onClick={() => {
                  const newName = prompt(lang === 'ar' ? 'اسم المنيو الجديد:' : 'New Menu Name:', menu.name);
                  if (newName) updateMenu({ ...menu, name: newName });
                }}
                className={`absolute top-6 right-6 p-2.5 opacity-0 group-hover:opacity-100 transition-all rounded-[1rem] shadow-lg hover:scale-110 active:scale-95 border backdrop-blur-md z-20 ${selectedMenuId === menu.id ? 'bg-indigo-400/20 text-white border-indigo-300/30 hover:bg-indigo-400/40' : 'bg-card/80 border-white/10 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30'}`}
              >
                <Edit3 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Categories & Items */}
        <div className="lg:col-span-9 space-y-12">
          {filteredCategories.length > 0 ? filteredCategories.map(category => (
            <div key={category.id} className="relative z-10 animate-fade-in pb-10">
              <div className="flex justify-between items-end mb-8 px-4 border-b border-white/5 pb-6">
                <div className="flex items-center gap-5">
                  {category.image ? (
                    <div className="relative w-16 h-16 group/cat-img cursor-pointer">
                      <div className="absolute inset-0 bg-indigo-500/20 rounded-[1.2rem] blur-xl opacity-0 group-hover/cat-img:opacity-100 transition-opacity duration-500" />
                      <img src={category.image} alt={category.name} className="relative w-full h-full rounded-[1.2rem] object-cover shadow-lg border border-white/10" />
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-[1.2rem] text-indigo-400 border border-white/5 shadow-inner">
                      <Layers size={24} />
                    </div>
                  )}
                  <div>
                    <h4 className="text-2xl md:text-3xl font-black text-main uppercase tracking-tight drop-shadow-sm">{lang === 'ar' ? (category.nameAr || category.name) : category.name}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-2.5 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20">{category.items.length} {lang === 'ar' ? 'أصناف' : 'Items'}</p>
                      {category.printerIds && category.printerIds.length > 0 && (
                        <span className="px-2.5 py-1 bg-elevated/70 text-muted text-[10px] font-black rounded-lg flex items-center gap-1.5 border border-white/5 shadow-sm">
                          <PrinterIcon size={12} /> {category.printerIds.length}
                        </span>
                      )}
                      {category.targetOrderTypes && category.targetOrderTypes.length > 0 && (
                        <div className="flex gap-1">
                          {category.targetOrderTypes.includes('DINE_IN' as any) && <span className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 shadow-sm" title="Dine In"><UtensilsCrossed size={12} /></span>}
                          {category.targetOrderTypes.includes('TAKEAWAY' as any) && <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-sm" title="Takeaway"><ShoppingBag size={12} /></span>}
                          {category.targetOrderTypes.includes('PICKUP' as any) && <span className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-500 shadow-sm" title="Pickup"><Map size={12} /></span>}
                          {category.targetOrderTypes.includes('DELIVERY' as any) && <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-sm" title="Delivery"><Truck size={12} /></span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCategoryModal({ isOpen: true, mode: 'EDIT', category })}
                    className="p-3 bg-card/60 backdrop-blur-md rounded-[1rem] border border-white/5 text-muted hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all shadow-sm active:scale-95"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => deleteCategory(selectedMenuId, category.id)} className="p-3 bg-card/60 backdrop-blur-md rounded-[1rem] border border-white/5 text-muted hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all shadow-sm active:scale-95">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {category.items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((item, idx) => (
                  <div key={item.id} className={`bg-card/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-6 shadow-lg hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-2 hover:border-white/10 transition-all duration-500 group relative flex flex-col h-full overflow-hidden ${item.layoutType === 'wide' ? 'md:col-span-2' : ''}`} style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-cyan-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
                    <div className="absolute top-6 left-6 flex gap-2 z-10">
                      {item.sortOrder !== undefined && <span className="px-3 py-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-[9px] font-black rounded-[0.8rem] shadow-lg tracking-widest border border-indigo-400/50">#{item.sortOrder}</span>}
                      {item.printerIds && item.printerIds.length > 0 && <span className="px-3 py-1.5 bg-card/80 backdrop-blur-sm border border-white/10 text-muted text-[9px] font-black rounded-[0.8rem] flex items-center gap-1.5 shadow-sm"><PrinterIcon size={10} /> {item.printerIds.length}</span>}
                    </div>
                    <button
                      onClick={() => updateMenuItem(selectedMenuId, category.id, { ...item, isAvailable: !item.isAvailable })}
                      className={`absolute top-6 right-6 p-3 rounded-xl z-10 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg border backdrop-blur-md ${item.isAvailable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'}`}
                      title={item.isAvailable ? (lang === 'ar' ? 'إيقاف الصنف (86)' : 'Disable item (86)') : (lang === 'ar' ? 'تشغيل الصنف' : 'Enable item')}
                    >
                      {item.isAvailable ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>

                    <div className={`mb-8 flex ${item.layoutType === 'wide' ? 'justify-start gap-8 mt-12' : 'justify-center flex-col items-center mt-6'} relative z-10`}>
                      {item.image ? (
                        <div className={`relative ${item.layoutType === 'wide' ? 'w-40 h-40' : 'w-48 h-48 group-hover:scale-[1.03] transition-transform duration-700 ease-out'}`}>
                          <div className={`absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                          <img src={item.image} alt={item.name} className={`relative w-full h-full object-cover rounded-[2.5rem] shadow-[0_10px_20px_rgba(0,0,0,0.3)] border border-white/10`} />
                        </div>
                      ) : (
                        <div className={`${item.layoutType === 'wide' ? 'w-40 h-40' : 'w-48 h-48'} bg-elevated/30 rounded-[2.5rem] flex items-center justify-center text-muted group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all border border-white/5 shadow-inner group-hover:scale-105 duration-700`}>
                          <ImageIcon size={64} className="opacity-40" />
                        </div>
                      )}

                      <div className={`${item.layoutType === 'wide' ? 'text-left flex-1 py-4' : 'text-center mt-8'}`}>
                        <h5 className="font-black text-xl lg:text-2xl text-main mb-2 tracking-tight group-hover:text-indigo-400 transition-colors duration-500 drop-shadow-sm">{lang === 'ar' ? (item.nameAr || item.name) : item.name}</h5>
                        <p className="text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tighter drop-shadow-sm">{settings.currencySymbol} {item.price.toFixed(2)}</p>
                        {item.layoutType === 'wide' && item.description && <p className="text-xs text-muted font-bold line-clamp-3 mt-4 leading-relaxed">{lang === 'ar' ? (item.descriptionAr || item.description) : item.description}</p>}
                      </div>
                    </div>

                    <div className="mt-auto flex gap-3 pt-6 border-t border-white/5 relative z-10">
                      <button onClick={() => setItemModal({ isOpen: true, mode: 'EDIT', menuId: selectedMenuId, categoryId: category.id, item })} className="flex-[3] py-4 bg-indigo-500/10 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-cyan-500 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:shadow-[0_10px_20px_rgba(99,102,241,0.3)] active:scale-95 duration-300">Edit Details</button>
                      <button onClick={() => setRecipeModal({ isOpen: true, menuId: selectedMenuId, categoryId: category.id, item, tempRecipe: item.recipe || [] })} className="flex-1 flex items-center justify-center p-4 bg-card/60 backdrop-blur-md border border-white/5 text-muted hover:text-amber-400 hover:border-amber-400/30 rounded-[1.2rem] transition-all shadow-sm hover:bg-amber-500/10 active:scale-95 duration-300" title="Manage Recipe"><Scale size={18} /></button>
                      <button onClick={() => deleteMenuItem(selectedMenuId, category.id, item.id)} className="flex-1 flex items-center justify-center p-4 bg-card/60 backdrop-blur-md border border-white/5 text-muted hover:text-rose-400 hover:border-rose-400/30 rounded-[1.2rem] transition-all shadow-sm hover:bg-rose-500/10 active:scale-95 duration-300" title="Delete Item"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="py-20 text-center bg-card rounded-[3rem] border border-border"><p className="text-muted font-black uppercase tracking-widest">{lang === 'ar' ? 'لا يوجد أقسام لعرضها' : 'No sections linked to this menu'}</p></div>
          )}

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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-2xl rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-elevated/40 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] shadow-[0_10px_20px_rgba(99,102,241,0.3)] border border-white/20">
                  <Settings size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-main uppercase tracking-tight drop-shadow-sm">Menu Targets</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Where should this menu appear?</p>
                </div>
              </div>
              <button onClick={() => setMenuSettingsModal(null)} className="p-3 bg-card/60 backdrop-blur-md text-muted hover:text-rose-400 border border-white/5 hover:border-rose-500/30 rounded-2xl transition-all shadow-sm active:scale-95"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar relative z-10">
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4"><Building2 size={16} /> Active Branches</h4>
                <div className="grid grid-cols-2 gap-4">
                  {branches.map(b => (
                    <button key={b.id} onClick={() => toggleTarget('branch', b.id)} className={`p-5 rounded-[1.5rem] border transition-all duration-300 text-left flex items-center justify-between group ${menuSettingsModal.targetBranches?.includes(b.id) ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/5 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] backdrop-blur-md' : 'bg-elevated/40 border-white/5 hover:border-indigo-500/30 hover:bg-elevated/60 backdrop-blur-sm shadow-inner'}`}>
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
                    <button key={p.id} onClick={() => toggleTarget('platform', p.id)} className={`p-5 rounded-[1.5rem] border transition-all duration-300 text-left flex items-center justify-between group ${menuSettingsModal.targetPlatforms?.includes(p.id) ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md' : 'bg-elevated/40 border-white/5 hover:border-emerald-500/30 hover:bg-elevated/60 backdrop-blur-sm shadow-inner'}`}>
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
            <div className="p-6 border-t border-white/5 bg-elevated/40 backdrop-blur-xl flex gap-4 relative z-10">
              <button onClick={() => setMenuSettingsModal(null)} className="flex-1 py-4 bg-card/60 backdrop-blur-md text-muted rounded-[1.2rem] font-black uppercase text-[10px] tracking-[0.2em] border border-white/5 hover:bg-card hover:text-main transition-all active:scale-95 shadow-sm">Cancel</button>
              <button onClick={() => { updateMenu(menuSettingsModal); setMenuSettingsModal(null); }} className="flex-[2] py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_10px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 border border-indigo-400/30 transition-all active:scale-95">Apply Configuration</button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      {itemModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-card w-full max-w-4xl rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col max-h-[95vh] relative text-main">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/5 pointer-events-none" />

            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-elevated/40 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] shadow-[0_10px_20px_rgba(99,102,241,0.3)] border border-white/20">
                  <UtensilsCrossed size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-main uppercase tracking-tight drop-shadow-sm">
                    {itemModal.mode === 'ADD' ? (lang === 'ar' ? 'صنف جديد' : 'New Item') : (lang === 'ar' ? 'تعديل صنف' : 'Edit Item')}
                  </h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                    {lang === 'ar' ? 'تخصيص بيانات وتفاصيل المنتج' : 'Customize product details and printers'}
                  </p>
                </div>
              </div>
              <button onClick={() => setItemModal(null)} className="p-3 bg-card/60 backdrop-blur-sm text-muted rounded-[1rem] shadow-sm hover:text-rose-400 border border-white/5 hover:border-rose-500/30 hover:rotate-90 transition-all active:scale-95"><X size={28} /></button>
            </div>

            <div className="p-8 space-y-10 overflow-y-auto no-scrollbar relative z-10">
              {/* Basic Info Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="group/input space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? 'الاسم (EN)' : 'Name (English)'}</label>
                    <input type="text" value={itemModal.item.name} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, name: e.target.value } })} className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-bold text-main border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none shadow-inner text-sm" placeholder="e.g. Classic Burger" />
                  </div>
                  <div className="group/input space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? 'الاسم (AR)' : 'Name (Arabic)'}</label>
                    <input type="text" value={itemModal.item.nameAr || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, nameAr: e.target.value } })} className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-bold text-main text-right border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none shadow-inner text-sm" placeholder="مثلاً: برجر كلاسيك" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group/input space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? 'السعر' : 'Price'}</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-indigo-400 transition-colors" size={18} />
                        <input type="number" value={itemModal.item.price || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, price: parseFloat(e.target.value) || 0 } })} className="w-full pl-12 pr-4 py-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-black text-main text-sm outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" />
                      </div>
                    </div>
                    <div className="group/input space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? 'الترتيب' : 'Sort Order'}</label>
                      <input type="number" value={itemModal.item.sortOrder || 0} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, sortOrder: parseInt(e.target.value) || 0 } })} className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-black text-main text-sm outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group/input space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? 'كود الضريبة' : 'Fiscal Code (GS1)'}</label>
                      <input type="text" value={itemModal.item.fiscalCode || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, fiscalCode: e.target.value } })} className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-black text-main text-sm outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" placeholder="e.g. 10001234" />
                    </div>
                    <div className="flex flex-col justify-end pb-1">
                      <button
                        onClick={() => setItemModal({ ...itemModal, item: { ...itemModal.item, isWeighted: !itemModal.item.isWeighted } })}
                        className={`flex items-center justify-center gap-2 p-4.5 rounded-[1.2rem] border transition-all duration-300 font-black text-[10px] uppercase tracking-[0.2em] h-[64px] ${itemModal.item.isWeighted ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400/30 text-white shadow-[0_5px_15px_rgba(245,158,11,0.2)]' : 'bg-elevated/40 border-white/5 text-muted hover:text-amber-400 hover:border-amber-400/30 shadow-inner'}`}
                      >
                        <Scale size={16} />
                        {lang === 'ar' ? 'ميزان' : 'Scale Required'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="group/input space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? 'القسم' : 'Category'}</label>
                      <select
                        value={itemModal.categoryId}
                        onChange={(e) => setItemModal({ ...itemModal, categoryId: e.target.value, item: { ...itemModal.item, categoryId: e.target.value } })}
                        className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-bold text-main border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none appearance-none shadow-inner text-sm cursor-pointer"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id} className="bg-card text-main">{lang === 'ar' ? (cat.nameAr || cat.name) : cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <ImageUploader
                        value={itemModal.item.image || ''}
                        onChange={(url) => setItemModal({ ...itemModal, item: { ...itemModal.item, image: url } })}
                        type="item"
                        label={lang === 'ar' ? 'صورة الصنف' : 'Item Image'}
                        lang={lang}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout & Printers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><LayoutGrid size={14} /> {lang === 'ar' ? 'شكل العرض' : 'Appearance Layout'}</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['standard', 'wide', 'image-only'].map(layout => (
                      <button
                        key={layout}
                        onClick={() => setItemModal({ ...itemModal, item: { ...itemModal.item, layoutType: layout as any } })}
                        className={`p-5 rounded-[1.5rem] border transition-all duration-300 flex flex-col items-center gap-3 ${itemModal.item.layoutType === layout ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] shadow-inner' : 'border-white/5 bg-elevated/30 text-muted hover:border-indigo-500/30 hover:text-main'}`}
                      >
                        {layout === 'standard' && <LayoutGrid size={24} />}
                        {layout === 'wide' && <List size={24} />}
                        {layout === 'image-only' && <ImageIcon size={24} />}
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-center">{layout}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><PrinterIcon size={14} /> {lang === 'ar' ? 'توجيه الطباعة' : 'Print Routing'}</label>
                  <div className="flex flex-wrap gap-3">
                    {printers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggleItemPrinter(p.id)}
                        className={`px-5 py-3 rounded-[1rem] border text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${itemModal.item.printerIds?.includes(p.id) ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 border-indigo-400/30 text-white shadow-[0_5px_15px_rgba(99,102,241,0.2)]' : 'bg-elevated/40 border-white/5 text-muted hover:border-indigo-500/30 hover:text-indigo-400 shadow-inner'}`}
                      >
                        <PrinterIcon size={14} />
                        {p.name}
                      </button>
                    ))}
                    {printers.length === 0 && <p className="text-[10px] text-muted italic px-2">No printers configured. Go to Printer Hub.</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Clock size={14} /> {lang === 'ar' ? 'مواعيد الإتاحة' : 'Availability Schedule'}</label>
                  <div className="flex flex-wrap gap-3">
                    {dayOptions.map(day => (
                      <button
                        key={day.id}
                        onClick={() => toggleItemDay(day.id)}
                        className={`px-4 py-2.5 rounded-[0.8rem] border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${itemModal.item.availableDays?.includes(day.id) ? 'bg-gradient-to-r from-emerald-500 to-teal-400 border-emerald-400/30 text-white shadow-[0_5px_15px_rgba(16,185,129,0.2)]' : 'bg-elevated/40 border-white/5 text-muted hover:border-emerald-500/30 hover:text-emerald-400 shadow-inner'}`}
                      >
                        {lang === 'ar' ? day.ar : day.en}
                      </button>
                    ))}
                    {dayOptions.length === 0 && <p className="text-[10px] text-muted italic">No days configured.</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group/input space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? 'من الساعة' : 'From'}</label>
                      <input
                        type="time"
                        value={itemModal.item.availableFrom || ''}
                        onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, availableFrom: e.target.value } })}
                        className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-black text-main text-sm outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                      />
                    </div>
                    <div className="group/input space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? 'إلى الساعة' : 'To'}</label>
                      <input
                        type="time"
                        value={itemModal.item.availableTo || ''}
                        onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, availableTo: e.target.value } })}
                        className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-black text-main text-sm outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><MapPin size={14} /> {lang === 'ar' ? 'قوائم أسعار الفروع' : 'Branch Price Lists'}</label>
                    <button onClick={addPriceList} className="px-4 py-2.5 rounded-[0.8rem] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-cyan-500 hover:text-white hover:border-indigo-400/30 text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 duration-300">Add Price</button>
                  </div>
                  <div className="space-y-4">
                    {(itemModal.item.priceLists || []).map((list, idx) => (
                      <div key={`${list.name}-${idx}`} className="p-5 rounded-[1.5rem] border border-white/5 bg-elevated/30 backdrop-blur-md space-y-4 shadow-inner relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[1.5rem]" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                          <div className="space-y-2 sm:col-span-2 group/listname">
                            <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/listname:text-indigo-400 transition-colors">{lang === 'ar' ? 'اسم القائمة' : 'List Name'}</label>
                            <input
                              type="text"
                              value={list.name}
                              onChange={(e) => updatePriceList(idx, { name: e.target.value })}
                              className="w-full p-4 bg-card/60 rounded-[1rem] font-bold text-main outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-xs shadow-inner"
                              placeholder={lang === 'ar' ? 'توصيل' : 'Delivery'}
                            />
                          </div>
                          <div className="space-y-2 group/listprice">
                            <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/listprice:text-indigo-400 transition-colors">{lang === 'ar' ? 'السعر' : 'Price'}</label>
                            <input
                              type="number"
                              value={list.price}
                              onChange={(e) => updatePriceList(idx, { price: parseFloat(e.target.value) || 0 })}
                              className="w-full p-4 bg-card/60 rounded-[1rem] font-black text-emerald-400 outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-xs shadow-inner"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 relative z-10">
                          {branches.map(branch => (
                            <button
                              key={branch.id}
                              onClick={() => togglePriceListBranch(idx, branch.id)}
                              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border transition-all ${list.branchIds?.includes(branch.id) ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 border-indigo-400/30 text-white shadow-[0_5px_15px_rgba(99,102,241,0.2)]' : 'bg-card border-white/5 text-muted hover:border-indigo-500/30 hover:text-indigo-400 shadow-inner'}`}
                            >
                              {lang === 'ar' ? (branch.nameAr || branch.name) : branch.name}
                            </button>
                          ))}
                          {branches.length === 0 && <p className="text-[10px] text-muted italic">No branches configured.</p>}
                        </div>
                        <button onClick={() => removePriceList(idx)} className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-rose-400 transition-colors relative z-10">Remove</button>
                      </div>
                    ))}
                    {(itemModal.item.priceLists || []).length === 0 && (
                      <p className="text-[11px] text-muted italic">{lang === 'ar' ? 'لا توجد قوائم أسعار خاصة بعد' : 'No branch-specific pricing yet.'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Layers size={14} /> {lang === 'ar' ? 'مجموعات الإضافات' : 'Modifier Groups'}</label>
                  <button onClick={addModifierGroup} className="px-4 py-2.5 rounded-[0.8rem] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-cyan-500 hover:text-white hover:border-indigo-400/30 text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 duration-300">Add Group</button>
                </div>
                <div className="space-y-6">
                  {(itemModal.item.modifierGroups || []).map(group => (
                    <div key={group.id} className="p-6 rounded-[2rem] border border-white/5 bg-elevated/30 backdrop-blur-md space-y-6 shadow-inner relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2rem]" />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                        <div className="space-y-2 sm:col-span-2 group/modname">
                          <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/modname:text-indigo-400 transition-colors">{lang === 'ar' ? 'اسم المجموعة' : 'Group Name'}</label>
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => updateModifierGroup(group.id, { name: e.target.value })}
                            className="w-full p-4 bg-card/60 rounded-[1rem] font-bold text-main outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm shadow-inner"
                            placeholder={lang === 'ar' ? 'إضافات' : 'Toppings'}
                          />
                        </div>
                        <div className="space-y-2 group/min">
                          <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/min:text-indigo-400 transition-colors">{lang === 'ar' ? 'حد أدنى' : 'Min'}</label>
                          <input
                            type="number"
                            value={group.minSelection}
                            onChange={(e) => updateModifierGroup(group.id, { minSelection: parseInt(e.target.value) || 0 })}
                            className="w-full p-4 bg-card/60 rounded-[1rem] font-black text-main outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm shadow-inner"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                        <div className="space-y-2 group/max">
                          <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/max:text-indigo-400 transition-colors">{lang === 'ar' ? 'حد أقصى' : 'Max'}</label>
                          <input
                            type="number"
                            value={group.maxSelection}
                            onChange={(e) => updateModifierGroup(group.id, { maxSelection: parseInt(e.target.value) || 0 })}
                            className="w-full p-4 bg-card/60 rounded-[1rem] font-black text-main outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm shadow-inner"
                          />
                        </div>
                        <div className="flex items-end">
                          <button onClick={() => addModifierOption(group.id)} className="w-full px-4 py-4 rounded-[1rem] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-cyan-500 hover:text-white hover:border-indigo-400/30 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 duration-300">Add Option</button>
                        </div>
                      </div>
                      <div className="space-y-3 relative z-10 bg-card/40 p-4 rounded-[1.5rem] border border-white/5 shadow-inner">
                        <h5 className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-4">Options</h5>
                        {(group.options || []).map(option => (
                          <div key={option.id} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                value={option.name}
                                onChange={(e) => updateModifierOption(group.id, option.id, { name: e.target.value })}
                                className="w-full p-3.5 bg-elevated/50 rounded-[1rem] font-bold text-main outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-xs shadow-inner"
                                placeholder={lang === 'ar' ? 'جبنة' : 'Cheese'}
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                value={option.price}
                                onChange={(e) => updateModifierOption(group.id, option.id, { price: parseFloat(e.target.value) || 0 })}
                                className="w-full p-3.5 bg-elevated/50 rounded-[1rem] font-black text-emerald-400 outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-xs shadow-inner"
                              />
                            </div>
                            <div>
                              <button onClick={() => removeModifierOption(group.id, option.id)} className="w-full px-4 py-3.5 rounded-[1rem] bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 duration-300">Remove</button>
                            </div>
                          </div>
                        ))}
                        {(group.options || []).length === 0 && (
                          <p className="text-[11px] text-muted italic p-2">{lang === 'ar' ? 'لا توجد إضافات بعد' : 'No options yet.'}</p>
                        )}
                      </div>
                      <button onClick={() => removeModifierGroup(group.id)} className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-rose-400 transition-colors relative z-10">Remove Group</button>
                    </div>
                  ))}
                  {(itemModal.item.modifierGroups || []).length === 0 && (
                    <p className="text-[11px] text-muted italic">{lang === 'ar' ? 'لم يتم إضافة مجموعات بعد' : 'No modifier groups yet.'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group/textarea space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/textarea:text-indigo-400 transition-colors">{lang === 'ar' ? 'الوصف (EN)' : 'Description (English)'}</label>
                  <textarea rows={3} value={itemModal.item.description || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, description: e.target.value } })} className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] text-sm text-main resize-none outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner font-medium" />
                </div>
                <div className="group/textarea space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/textarea:text-indigo-400 transition-colors">{lang === 'ar' ? 'الوصف (AR)' : 'Description (Arabic)'}</label>
                  <textarea rows={3} value={itemModal.item.descriptionAr || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, descriptionAr: e.target.value } })} className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] text-sm text-main resize-none text-right outline-none border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner font-medium" />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-elevated/40 backdrop-blur-xl flex gap-4 relative z-10">
              <button
                onClick={() => setItemModal(null)}
                className="flex-[1] py-5 bg-card/60 backdrop-blur-md text-muted rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] border border-white/5 hover:bg-card hover:text-main transition-all active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="flex-[2] py-5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 border border-indigo-400/30 transition-all active:scale-95"
              >
                Save {itemModal.item.name || 'New Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {categoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-card w-full max-w-2xl rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col max-h-[95vh] relative text-main">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-elevated/40 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] shadow-[0_10px_20px_rgba(99,102,241,0.3)] border border-white/20">
                  <Layers size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-main uppercase tracking-tight drop-shadow-sm">{categoryModal.mode === 'ADD' ? (lang === 'ar' ? 'قسم جديد' : 'New Section') : (lang === 'ar' ? 'تعديل قسم' : 'Edit Section')}</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">{lang === 'ar' ? 'تهيئة وتخصيص المجموعات' : 'Configure group & visibility'}</p>
                </div>
              </div>
              <button onClick={() => setCategoryModal(null)} className="p-3 bg-card/60 backdrop-blur-sm text-muted rounded-[1rem] shadow-sm hover:text-rose-400 border border-white/5 hover:border-rose-500/30 hover:rotate-90 transition-all active:scale-95"><X size={28} /></button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="group/input space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? 'الاسم (EN)' : 'Name (English)'}</label>
                  <input type="text" value={categoryModal.category.name} onChange={(e) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, name: e.target.value } })} className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-bold text-main border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none shadow-inner text-sm" placeholder="e.g. Burgers" />
                </div>
                <div className="group/input space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">{lang === 'ar' ? 'الاسم (AR)' : 'Name (Arabic)'}</label>
                  <input type="text" value={categoryModal.category.nameAr || ''} onChange={(e) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, nameAr: e.target.value } })} className="w-full p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.2rem] font-bold text-main text-right border border-white/5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none shadow-inner text-sm" placeholder="مثلاً: برجر" />
                </div>
              </div>

              <div className="space-y-4">
                <ImageUploader
                  value={categoryModal.category.image || ''}
                  onChange={(url) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, image: url } })}
                  type="category"
                  label={lang === 'ar' ? 'صورة القسم' : 'Category Image'}
                  lang={lang}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><LayoutGrid size={14} /> {lang === 'ar' ? 'أنواع الطلبات المسموحة' : 'Available Order Modes'}</label>
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
                        className={`p-5 rounded-[1.5rem] border transition-all duration-300 flex flex-col items-center gap-3 ${isSelected ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] shadow-inner' : 'border-white/5 bg-elevated/30 text-muted hover:border-indigo-500/30 hover:text-main'}`}
                      >
                        <mode.icon size={24} />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-center">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Layers size={14} /> {lang === 'ar' ? 'ربط بالقوائم' : 'Linked Menus'}</label>
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
                        className={`px-5 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${isLinked ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 border-indigo-400/30 text-white shadow-[0_5px_15px_rgba(99,102,241,0.2)]' : 'bg-elevated/40 border-white/5 text-muted hover:border-indigo-500/30 hover:text-indigo-400 shadow-inner'}`}
                      >
                        {menu.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><PrinterIcon size={14} /> {lang === 'ar' ? 'طابعات القسم الافتراضية' : 'Default Section Printers'}</label>
                <div className="flex flex-wrap gap-3">
                  {printers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => toggleCategoryPrinter(p.id)}
                      className={`px-5 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-[0.2em] border transition-all flex items-center gap-2 ${categoryModal.category.printerIds?.includes(p.id) ? 'bg-gradient-to-r from-emerald-500 to-teal-400 border-emerald-400/30 text-white shadow-[0_5px_15px_rgba(16,185,129,0.2)]' : 'bg-elevated/40 border-white/5 text-muted hover:border-emerald-500/30 hover:text-emerald-400 shadow-inner'}`}
                    >
                      <PrinterIcon size={14} />
                      {p.name}
                    </button>
                  ))}
                  {printers.length === 0 && (
                    <p className="text-[11px] text-muted italic px-2">{lang === 'ar' ? 'لا توجد طابعات مضافة' : 'No printers configured yet.'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-elevated/40 backdrop-blur-xl flex gap-4 relative z-10">
              <button
                onClick={() => setCategoryModal(null)}
                className="flex-[1] py-5 bg-card/60 backdrop-blur-md text-muted rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] border border-white/5 hover:bg-card hover:text-main transition-all active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button onClick={handleSaveCategory} className="flex-[2] py-5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 border border-indigo-400/30 transition-all active:scale-95">
                {categoryModal.mode === 'ADD' ? (lang === 'ar' ? 'إنشاء القسم' : 'Create Section') : (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECIPE MODAL */}
      {recipeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-card w-full max-w-3xl rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col max-h-[95vh] relative text-main">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 pointer-events-none" />
            <div className="p-8 border-b border-white/5 bg-elevated/40 backdrop-blur-md flex justify-between items-center relative z-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-[1.2rem] shadow-[0_10px_20px_rgba(245,158,11,0.3)] border border-white/20">
                  <Scale size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-main uppercase tracking-tight drop-shadow-sm">Recipe: {recipeModal.item.name}</h3>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Manage components and quantities</p>
                </div>
              </div>
              <button onClick={() => setRecipeModal(null)} className="p-3 bg-card/60 backdrop-blur-sm text-muted rounded-[1rem] shadow-sm hover:text-rose-400 border border-white/5 hover:border-rose-500/30 hover:rotate-90 transition-all active:scale-95"><X size={28} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar relative z-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 ml-1"><Layers size={14} /> Components</h4>
                <div className="space-y-3">
                  {recipeModal.tempRecipe.map((ri) => {
                    const inv = inventory.find(i => i.id === ri.itemId);
                    return (
                      <div key={ri.itemId} className="flex justify-between items-center p-5 bg-elevated/40 backdrop-blur-sm rounded-[1.5rem] border border-white/5 shadow-inner hover:border-amber-500/30 transition-all group">
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
                    <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-[2rem] bg-elevated/20">
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
                    <select value={newIngredientId} onChange={(e) => setNewIngredientId(e.target.value)} className="w-full p-4.5 rounded-[1.2rem] bg-card/60 backdrop-blur-sm border border-white/5 outline-none text-sm font-bold shadow-inner focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-main">
                      <option value="" className="bg-card">Select Item...</option>
                      {inventory.map(inv => (<option key={inv.id} value={inv.id} className="bg-card">{inv.name} ({inv.unit})</option>))}
                    </select>
                  </div>
                  <div className="group/qty space-y-2">
                    <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1 group-focus-within/qty:text-amber-500 transition-colors">Quantity</label>
                    <input type="number" step="0.01" value={newIngredientQty || ''} onChange={(e) => setNewIngredientQty(parseFloat(e.target.value))} placeholder="0.00" className="w-full p-4.5 rounded-[1.2rem] bg-card/60 backdrop-blur-sm border border-white/5 outline-none text-sm font-black shadow-inner focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-main" />
                  </div>
                </div>
                <button onClick={addIngredientToTemp} disabled={!newIngredientId || newIngredientQty <= 0} className="w-full py-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-white hover:border-amber-400/30 rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none">Add To Recipe</button>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-elevated/40 backdrop-blur-xl flex gap-4 relative z-10">
              <button onClick={() => setRecipeModal(null)} className="flex-[1] py-5 bg-card/60 backdrop-blur-md text-muted rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] border border-white/5 hover:bg-card hover:text-main transition-all active:scale-95 shadow-sm">Cancel</button>
              <button onClick={handleSaveRecipe} className="flex-[2] py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_30px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 border border-amber-400/30 transition-all active:scale-95">Save & Sync Stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
