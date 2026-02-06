
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
    <div className="p-4 md:p-6 lg:p-8 bg-app min-h-screen transition-colors animate-fade-in pb-24">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-3">
          <AlertCircle size={20} />
          {lang === 'ar' ? 'خطأ في تحميل البيانات: ' : 'Error loading data: '}{error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-main uppercase tracking-tight flex items-center gap-3">
            <UtensilsCrossed className="text-primary" size={32} />
            {lang === 'ar' ? 'كتالوج المنيو' : 'Menu Catalog'}
            {isLoading && <Loader2 className="w-5 h-5 text-primary/70 animate-spin" />}
          </h2>
          <p className="text-xs md:text-sm text-muted font-bold uppercase tracking-widest mt-1 opacity-70">
            {lang === 'ar' ? 'هندس قائمتك بذكاء لتحقيق أفضل ربح' : 'Engineer your recipes for maximum profit'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCategoryModal({
              isOpen: true,
              mode: 'ADD',
              category: { id: '', name: '', items: [], menuIds: [selectedMenuId], targetOrderTypes: [] }
            })}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-elevated transition-all border border-primary"
          >
            <Plus size={18} />
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
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95"
            disabled={filteredCategories.length === 0}
          >
            <UtensilsCrossed size={18} />
            {lang === 'ar' ? 'صنف جديد' : 'New Item'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-8">
        <div className="flex bg-card p-1.5 rounded-2xl shadow-sm border border-border shrink-0 self-start">
          <button onClick={() => setActiveTab('MENUS')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'MENUS' ? 'bg-primary text-white shadow-md' : 'text-muted hover:text-main'}`}>
            <LayoutGrid size={14} className="inline mr-2" /> {lang === 'ar' ? 'القوائم النشطة' : 'Active Menus'}
          </button>
          <button onClick={() => setActiveTab('OFFERS')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'OFFERS' ? 'bg-primary text-white shadow-md' : 'text-muted hover:text-main'}`}>
            <Gift size={14} className="inline mr-2" /> {lang === 'ar' ? 'العروض' : 'Offers'}
          </button>
        </div>
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input type="text" placeholder={lang === 'ar' ? 'بحث عن أصناف...' : 'Search items...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm font-bold text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-3">
          {menus.map(menu => (
            <div key={menu.id} className="relative group">
              <button
                onClick={() => setSelectedMenuId(menu.id)}
                className={`w-full text-left p-5 rounded-[2rem] border transition-all duration-300 ${selectedMenuId === menu.id ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 translate-x-1' : 'bg-card border-border hover:border-primary/40'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-black text-sm truncate pr-6 ${selectedMenuId === menu.id ? 'text-white' : 'text-main'}`}>{menu.name}</span>
                  {menu.isDefault && <div className={`w-2 h-2 rounded-full ${selectedMenuId === menu.id ? 'bg-card' : 'bg-primary'} animate-pulse`} />}
                </div>
                <div className="flex flex-wrap gap-1 items-center mt-2">
                  <span className="text-[9px] font-black uppercase opacity-60">{menu.status}</span>
                  {(menu.targetPlatforms?.length || 0) > 0 && <span className="text-[9px] font-black bg-card/20 px-1.5 py-0.5 rounded text-white">{menu.targetPlatforms?.length} Apps</span>}
                  {(menu.targetBranches?.length || 0) > 0 && <span className="text-[9px] font-black bg-primary/100/30 px-1.5 py-0.5 rounded text-white">{menu.targetBranches?.length} Br.</span>}
                </div>
              </button>
              <button
                onClick={() => {
                  const newName = prompt(lang === 'ar' ? 'اسم المنيو الجديد:' : 'New Menu Name:', menu.name);
                  if (newName) updateMenu({ ...menu, name: newName });
                }}
                className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card/10 hover:bg-card/20 rounded-xl text-white"
              >
                <Edit3 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Categories & Items */}
        <div className="lg:col-span-9 space-y-12">
          {filteredCategories.length > 0 ? filteredCategories.map(category => (
            <div key={category.id} className="relative z-10">
              <div className="flex justify-between items-end mb-6 px-2 border-b border-border pb-4">
                <div className="flex items-center gap-4">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className="p-4 bg-primary/10 dark:bg-primary/10 rounded-[1.5rem] text-primary">
                      <Layers size={24} />
                    </div>
                  )}
                  <div>
                    <h4 className="text-2xl font-black text-main uppercase tracking-tight">{lang === 'ar' ? (category.nameAr || category.name) : category.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{category.items.length} {lang === 'ar' ? 'أصناف' : 'Items'}</p>
                      {category.targetOrderTypes && category.targetOrderTypes.length > 0 && (
                        <div className="flex gap-1">
                          {category.targetOrderTypes.includes('DINE_IN' as any) && <span className="p-1 rounded bg-orange-100 text-orange-600" title="Dine In"><UtensilsCrossed size={10} /></span>}
                          {category.targetOrderTypes.includes('TAKEAWAY' as any) && <span className="p-1 rounded bg-blue-100 text-blue-600" title="Takeaway"><ShoppingBag size={10} /></span>}
                          {category.targetOrderTypes.includes('PICKUP' as any) && <span className="p-1 rounded bg-teal-100 text-teal-600" title="Pickup"><Map size={10} /></span>}
                          {category.targetOrderTypes.includes('DELIVERY' as any) && <span className="p-1 rounded bg-green-100 text-green-600" title="Delivery"><Truck size={10} /></span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCategoryModal({ isOpen: true, mode: 'EDIT', category })}
                    className="p-2 text-muted hover:text-primary transition-all"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => deleteCategory(selectedMenuId, category.id)} className="p-2 text-muted hover:text-rose-500 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {category.items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(item => (
                  <div key={item.id} className={`bg-card rounded-[2.5rem] border border-border p-6 shadow-sm hover:shadow-2xl transition-all group relative flex flex-col h-full overflow-hidden ${item.layoutType === 'wide' ? 'md:col-span-2' : ''}`}>
                    <div className="absolute top-6 left-6 flex gap-2">
                      {item.sortOrder !== undefined && <span className="px-3 py-1 bg-primary text-white text-[9px] font-black rounded-full shadow-md">#{item.sortOrder}</span>}
                      {item.printerIds && item.printerIds.length > 0 && <span className="px-3 py-1 bg-elevated/70 dark:bg-elevated text-muted text-[9px] font-black rounded-full flex items-center gap-1"><PrinterIcon size={8} /> {item.printerIds.length}</span>}
                    </div>
                    <button
                      onClick={() => updateMenuItem(selectedMenuId, category.id, { ...item, isAvailable: !item.isAvailable })}
                      className={`absolute top-6 right-6 p-2 rounded-xl ${item.isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}
                      title={item.isAvailable ? (lang === 'ar' ? 'إيقاف الصنف (86)' : 'Disable item (86)') : (lang === 'ar' ? 'تشغيل الصنف' : 'Enable item')}
                    >
                      {item.isAvailable ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    <div className={`mb-6 flex ${item.layoutType === 'wide' ? 'justify-start gap-6' : 'justify-center flex-col items-center'}`}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className={`${item.layoutType === 'wide' ? 'w-32 h-32' : 'w-40 h-40'} object-cover rounded-[2rem] shadow-lg`} />
                      ) : (
                        <div className={`${item.layoutType === 'wide' ? 'w-32 h-32' : 'w-40 h-40'} bg-elevated dark:bg-elevated rounded-[2rem] flex items-center justify-center text-muted group-hover:text-primary/70 transition-colors`}>
                          <ImageIcon size={48} />
                        </div>
                      )}

                      <div className={`${item.layoutType === 'wide' ? 'text-left flex-1 py-2' : 'text-center mt-4'}`}>
                        <h5 className="font-black text-lg text-main mb-1">{lang === 'ar' ? (item.nameAr || item.name) : item.name}</h5>
                        <p className="text-xl font-black text-primary">{settings.currencySymbol} {item.price.toFixed(2)}</p>
                        {item.layoutType === 'wide' && item.description && <p className="text-[10px] text-muted font-medium line-clamp-2 mt-2">{lang === 'ar' ? (item.descriptionAr || item.description) : item.description}</p>}
                      </div>
                    </div>

                    <div className="mt-auto flex gap-2 pt-4 border-t border-border dark:border-border/50">
                      <button onClick={() => setItemModal({ isOpen: true, mode: 'EDIT', menuId: selectedMenuId, categoryId: category.id, item })} className="flex-1 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-primary">Edit</button>
                      <button onClick={() => setRecipeModal({ isOpen: true, menuId: selectedMenuId, categoryId: category.id, item, tempRecipe: item.recipe || [] })} className="p-3 bg-card border border-border text-muted hover:text-primary rounded-2xl transition-all shadow-sm"><Scale size={18} /></button>
                      <button onClick={() => deleteMenuItem(selectedMenuId, category.id, item.id)} className="p-3 text-muted hover:text-rose-500 transition-all"><Trash2 size={18} /></button>
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-card w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-border dark:border-border flex justify-between items-center">
              <div className="flex items-center gap-4"><div className="p-4 bg-primary text-white rounded-2xl"><Settings size={28} /></div><div><h3 className="text-2xl font-black text-main">Menu Targets</h3><p className="text-[10px] font-bold text-muted uppercase tracking-widest">Where should this menu appear?</p></div></div>
              <button onClick={() => setMenuSettingsModal(null)} className="text-muted"><X size={32} /></button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-muted uppercase tracking-widest"><Building2 size={14} /> Active Branches</h4>
                <div className="grid grid-cols-2 gap-3">
                  {branches.map(b => (
                    <button key={b.id} onClick={() => toggleTarget('branch', b.id)} className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${menuSettingsModal.targetBranches?.includes(b.id) ? 'bg-primary border-primary text-white' : 'bg-elevated border-border dark:border-border text-muted'}`}>
                      <span className="font-black text-xs">{b.name}</span>
                      {menuSettingsModal.targetBranches?.includes(b.id) && <CheckCircle2 size={16} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-muted uppercase tracking-widest"><Globe size={14} /> Delivery Platforms</h4>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map(p => (
                    <button key={p.id} onClick={() => toggleTarget('platform', p.id)} className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${menuSettingsModal.targetPlatforms?.includes(p.id) ? 'bg-primary border-primary text-white' : 'bg-elevated border-border dark:border-border text-muted'}`}>
                      <span className="font-black text-xs">{p.name}</span>
                      {menuSettingsModal.targetPlatforms?.includes(p.id) && <CheckCircle2 size={16} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center gap-3 text-amber-600 mb-2 font-black text-xs uppercase tracking-widest"><AlertCircle size={16} /> Notice</div>
                <p className="text-xs text-amber-600/80 font-medium">Changes to targets will sync instantly with the respective POS or Application APIs.</p>
              </div>
            </div>
            <div className="p-8 border-t border-border dark:border-border bg-app/50 flex gap-4">
              <button onClick={() => setMenuSettingsModal(null)} className="flex-1 py-4 bg-card text-muted rounded-2xl font-black uppercase tracking-widest border border-border">Cancel</button>
              <button onClick={() => { updateMenu(menuSettingsModal); setMenuSettingsModal(null); }} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20">Apply Configuration</button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      {itemModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-card w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 border-b border-border dark:border-border flex justify-between items-center bg-elevated/50 dark:bg-elevated/40">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary text-white rounded-[1.5rem] shadow-xl">
                  <UtensilsCrossed size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-main uppercase">
                    {itemModal.mode === 'ADD' ? (lang === 'ar' ? 'صنف جديد' : 'New Item') : (lang === 'ar' ? 'تعديل صنف' : 'Edit Item')}
                  </h3>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    {lang === 'ar' ? 'تخصيص بيانات وتفاصيل المنتج' : 'Customize product details and printers'}
                  </p>
                </div>
              </div>
              <button onClick={() => setItemModal(null)} className="p-3 bg-card dark:bg-elevated text-muted rounded-2xl shadow-sm hover:rotate-90 transition-all"><X size={28} /></button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
              {/* Basic Info Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'الاسم (EN)' : 'Name (English)'}</label>
                    <input type="text" value={itemModal.item.name} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, name: e.target.value } })} className="w-full p-5 bg-elevated rounded-2xl font-bold border border-transparent focus:border-primary transition-all outline-none" placeholder="e.g. Classic Burger" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'الاسم (AR)' : 'Name (Arabic)'}</label>
                    <input type="text" value={itemModal.item.nameAr || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, nameAr: e.target.value } })} className="w-full p-5 bg-elevated rounded-2xl font-bold text-right border border-transparent focus:border-primary transition-all outline-none" placeholder="مثلاً: برجر كلاسيك" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'السعر' : 'Price'}</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input type="number" value={itemModal.item.price || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, price: parseFloat(e.target.value) || 0 } })} className="w-full pl-12 pr-4 py-5 bg-elevated rounded-2xl font-black outline-none border border-transparent focus:border-primary transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'الترتيب' : 'Sort Order'}</label>
                      <input type="number" value={itemModal.item.sortOrder || 0} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, sortOrder: parseInt(e.target.value) || 0 } })} className="w-full p-5 bg-elevated rounded-2xl font-black outline-none border border-transparent focus:border-primary transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'كود الضريبة' : 'Fiscal Code (GS1)'}</label>
                      <input type="text" value={itemModal.item.fiscalCode || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, fiscalCode: e.target.value } })} className="w-full p-5 bg-elevated rounded-2xl font-black outline-none border border-transparent focus:border-primary transition-all" placeholder="e.g. 10001234" />
                    </div>
                    <div className="flex flex-col justify-end pb-1">
                      <button
                        onClick={() => setItemModal({ ...itemModal, item: { ...itemModal.item, isWeighted: !itemModal.item.isWeighted } })}
                        className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${itemModal.item.isWeighted ? 'bg-amber-500 border-amber-500 text-white' : 'bg-elevated border-border text-muted'}`}
                      >
                        <Scale size={14} />
                        {lang === 'ar' ? 'ميزان' : 'Scale Required'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ImageUploader
                      value={itemModal.item.image || ''}
                      onChange={(url) => setItemModal({ ...itemModal, item: { ...itemModal.item, image: url } })}
                      type="item"
                      label={lang === 'ar' ? 'صورة الصنف' : 'Item Image'}
                      lang={lang}
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'القسم' : 'Category'}</label>
                      <select
                        value={itemModal.categoryId}
                        onChange={(e) => setItemModal({ ...itemModal, categoryId: e.target.value, item: { ...itemModal.item, categoryId: e.target.value } })}
                        className="w-full p-5 bg-elevated rounded-2xl font-bold border border-transparent focus:border-primary transition-all outline-none appearance-none"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{lang === 'ar' ? (cat.nameAr || cat.name) : cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout & Printers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'شكل العرض' : 'Appearance Layout'}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['standard', 'wide', 'image-only'].map(layout => (
                      <button
                        key={layout}
                        onClick={() => setItemModal({ ...itemModal, item: { ...itemModal.item, layoutType: layout as any } })}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${itemModal.item.layoutType === layout ? 'border-primary bg-primary/10 dark:bg-primary/10 text-primary' : 'border-border dark:border-border text-muted'}`}
                      >
                        {layout === 'standard' && <LayoutGrid size={20} />}
                        {layout === 'wide' && <List size={20} />}
                        {layout === 'image-only' && <ImageIcon size={20} />}
                        <span className="text-[8px] font-black uppercase text-center">{layout}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'توجيه الطباعة' : 'Print Routing'}</label>
                  <div className="flex flex-wrap gap-2">
                    {printers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggleItemPrinter(p.id)}
                        className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${itemModal.item.printerIds?.includes(p.id) ? 'bg-primary border-primary text-white' : 'bg-elevated border-border text-muted'}`}
                      >
                        <PrinterIcon size={12} />
                        {p.name}
                      </button>
                    ))}
                    {printers.length === 0 && <p className="text-[10px] text-muted italic">No printers configured. Go to Printer Hub.</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'مواعيد الإتاحة' : 'Availability Schedule'}</label>
                  <div className="flex flex-wrap gap-2">
                    {dayOptions.map(day => (
                      <button
                        key={day.id}
                        onClick={() => toggleItemDay(day.id)}
                        className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${itemModal.item.availableDays?.includes(day.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-elevated border-border text-muted'}`}
                      >
                        {lang === 'ar' ? day.ar : day.en}
                      </button>
                    ))}
                    {dayOptions.length === 0 && <p className="text-[10px] text-muted italic">No days configured.</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'من الساعة' : 'From'}</label>
                      <input
                        type="time"
                        value={itemModal.item.availableFrom || ''}
                        onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, availableFrom: e.target.value } })}
                        className="w-full p-4 bg-elevated rounded-2xl font-black outline-none border border-transparent focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'إلى الساعة' : 'To'}</label>
                      <input
                        type="time"
                        value={itemModal.item.availableTo || ''}
                        onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, availableTo: e.target.value } })}
                        className="w-full p-4 bg-elevated rounded-2xl font-black outline-none border border-transparent focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'قوائم أسعار الفروع' : 'Branch Price Lists'}</label>
                    <button onClick={addPriceList} className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest">Add Price</button>
                  </div>
                  <div className="space-y-4">
                    {(itemModal.item.priceLists || []).map((list, idx) => (
                      <div key={`${list.name}-${idx}`} className="p-4 rounded-2xl border border-border bg-card/70 dark:bg-primary/50 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-2 sm:col-span-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'اسم القائمة' : 'List Name'}</label>
                            <input
                              type="text"
                              value={list.name}
                              onChange={(e) => updatePriceList(idx, { name: e.target.value })}
                              className="w-full p-3 bg-elevated rounded-xl font-bold outline-none border border-transparent focus:border-primary transition-all"
                              placeholder={lang === 'ar' ? 'توصيل' : 'Delivery'}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'السعر' : 'Price'}</label>
                            <input
                              type="number"
                              value={list.price}
                              onChange={(e) => updatePriceList(idx, { price: parseFloat(e.target.value) || 0 })}
                              className="w-full p-3 bg-elevated rounded-xl font-black outline-none border border-transparent focus:border-primary transition-all"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {branches.map(branch => (
                            <button
                              key={branch.id}
                              onClick={() => togglePriceListBranch(idx, branch.id)}
                              className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${list.branchIds?.includes(branch.id) ? 'bg-primary border-primary text-white' : 'bg-elevated border-border text-muted'}`}
                            >
                              {lang === 'ar' ? (branch.nameAr || branch.name) : branch.name}
                            </button>
                          ))}
                          {branches.length === 0 && <p className="text-[10px] text-muted italic">No branches configured.</p>}
                        </div>
                        <button onClick={() => removePriceList(idx)} className="text-[10px] font-black uppercase tracking-widest text-rose-500">Remove</button>
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
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'مجموعات الإضافات' : 'Modifier Groups'}</label>
                  <button onClick={addModifierGroup} className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest">Add Group</button>
                </div>
                <div className="space-y-4">
                  {(itemModal.item.modifierGroups || []).map(group => (
                    <div key={group.id} className="p-4 rounded-2xl border border-border bg-card/70 dark:bg-primary/50 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-2 sm:col-span-2">
                          <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'اسم المجموعة' : 'Group Name'}</label>
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => updateModifierGroup(group.id, { name: e.target.value })}
                            className="w-full p-3 bg-elevated rounded-xl font-bold outline-none border border-transparent focus:border-primary transition-all"
                            placeholder={lang === 'ar' ? 'إضافات' : 'Toppings'}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'حد أدنى' : 'Min'}</label>
                          <input
                            type="number"
                            value={group.minSelection}
                            onChange={(e) => updateModifierGroup(group.id, { minSelection: parseInt(e.target.value) || 0 })}
                            className="w-full p-3 bg-elevated rounded-xl font-black outline-none border border-transparent focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'حد أقصى' : 'Max'}</label>
                          <input
                            type="number"
                            value={group.maxSelection}
                            onChange={(e) => updateModifierGroup(group.id, { maxSelection: parseInt(e.target.value) || 0 })}
                            className="w-full p-3 bg-elevated rounded-xl font-black outline-none border border-transparent focus:border-primary transition-all"
                          />
                        </div>
                        <div className="flex items-end">
                          <button onClick={() => addModifierOption(group.id)} className="w-full px-4 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest">Add Option</button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {(group.options || []).map(option => (
                          <div key={option.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                value={option.name}
                                onChange={(e) => updateModifierOption(group.id, option.id, { name: e.target.value })}
                                className="w-full p-3 bg-elevated rounded-xl font-bold outline-none border border-transparent focus:border-primary transition-all"
                                placeholder={lang === 'ar' ? 'جبنة' : 'Cheese'}
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                value={option.price}
                                onChange={(e) => updateModifierOption(group.id, option.id, { price: parseFloat(e.target.value) || 0 })}
                                className="w-full p-3 bg-elevated rounded-xl font-black outline-none border border-transparent focus:border-primary transition-all"
                              />
                            </div>
                            <div>
                              <button onClick={() => removeModifierOption(group.id, option.id)} className="w-full px-4 py-3 rounded-xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest">Remove</button>
                            </div>
                          </div>
                        ))}
                        {(group.options || []).length === 0 && (
                          <p className="text-[11px] text-muted italic">{lang === 'ar' ? 'لا توجد إضافات بعد' : 'No options yet.'}</p>
                        )}
                      </div>
                      <button onClick={() => removeModifierGroup(group.id)} className="text-[10px] font-black uppercase tracking-widest text-rose-500">Remove Group</button>
                    </div>
                  ))}
                  {(itemModal.item.modifierGroups || []).length === 0 && (
                    <p className="text-[11px] text-muted italic">{lang === 'ar' ? 'لم يتم إضافة مجموعات بعد' : 'No modifier groups yet.'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'الوصف (EN)' : 'Description (English)'}</label>
                  <textarea rows={3} value={itemModal.item.description || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, description: e.target.value } })} className="w-full p-5 bg-elevated rounded-2xl resize-none outline-none border border-transparent focus:border-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'الوصف (AR)' : 'Description (Arabic)'}</label>
                  <textarea rows={3} value={itemModal.item.descriptionAr || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, descriptionAr: e.target.value } })} className="w-full p-5 bg-elevated rounded-2xl resize-none text-right outline-none border border-transparent focus:border-primary transition-all" />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-border dark:border-border flex gap-4 bg-app/20">
              <button
                onClick={() => setItemModal(null)}
                className="flex-1 py-5 bg-card dark:bg-elevated text-muted rounded-2xl font-black uppercase tracking-widest border border-border hover:bg-elevated/70 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary-hover transition-all"
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
          <div className="bg-card w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-border dark:border-border flex justify-between items-center bg-elevated/50 dark:bg-elevated/40">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary text-white rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-primary/20">
                  <Layers size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-main uppercase">{categoryModal.mode === 'ADD' ? (lang === 'ar' ? 'قسم جديد' : 'New Section') : (lang === 'ar' ? 'تعديل قسم' : 'Edit Section')}</h3>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{lang === 'ar' ? 'تهيئة وتخصيص المجموعات' : 'Configure group & visibility'}</p>
                </div>
              </div>
              <button onClick={() => setCategoryModal(null)} className="p-2 text-muted hover:rotate-90 transition-all"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'الاسم (EN)' : 'Name (English)'}</label>
                  <input type="text" value={categoryModal.category.name} onChange={(e) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, name: e.target.value } })} className="w-full p-4 bg-elevated rounded-2xl font-bold border border-transparent focus:border-primary transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'الاسم (AR)' : 'Name (Arabic)'}</label>
                  <input type="text" value={categoryModal.category.nameAr || ''} onChange={(e) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, nameAr: e.target.value } })} className="w-full p-4 bg-elevated rounded-2xl font-bold text-right border border-transparent focus:border-primary transition-all outline-none" />
                </div>
              </div>

              <ImageUploader
                value={categoryModal.category.image || ''}
                onChange={(url) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, image: url } })}
                type="category"
                label={lang === 'ar' ? 'صورة القسم' : 'Category Image'}
                lang={lang}
              />

              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'أنواع الطلبات المسموحة' : 'Available Order Modes'}</label>
                <div className="grid grid-cols-3 gap-3">
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
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected ? 'border-primary bg-primary/10 dark:bg-primary/10 text-primary' : 'border-border dark:border-border text-muted'}`}
                      >
                        <mode.icon size={20} />
                        <span className="text-[9px] font-black uppercase">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{lang === 'ar' ? 'ربط بالقوائم' : 'Linked Menus'}</label>
                <div className="flex flex-wrap gap-2">
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
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${isLinked ? 'bg-primary border-primary text-white' : 'bg-transparent border-border text-muted'}`}
                      >
                        {menu.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-border dark:border-border bg-app/20">
              <button onClick={handleSaveCategory} className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all">
                {categoryModal.mode === 'ADD' ? (lang === 'ar' ? 'إنشاء القسم' : 'Create Section') : (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECIPE MODAL */}
      {recipeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-card w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-border dark:border-border bg-app/50 flex justify-between items-center">
              <div className="flex items-center gap-4"><div className="p-4 bg-primary text-white rounded-2xl"><Scale size={32} /></div><div><h3 className="text-xl font-black text-main">Recipe: {recipeModal.item.name}</h3></div></div>
              <button onClick={() => setRecipeModal(null)} className="text-muted"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              <div className="space-y-3">
                {recipeModal.tempRecipe.map((ri) => {
                  const inv = inventory.find(i => i.id === ri.itemId);
                  return (
                    <div key={ri.itemId} className="flex justify-between items-center p-5 bg-elevated rounded-2xl border border-border dark:border-border"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-card dark:bg-elevated rounded-xl flex items-center justify-center text-primary font-black">{inv?.name.charAt(0)}</div><div><p className="font-black text-main">{inv?.name}</p></div></div><div className="flex items-center gap-4"><span className="text-xl font-black text-primary">{ri.quantity}</span><button onClick={() => setRecipeModal({ ...recipeModal, tempRecipe: recipeModal.tempRecipe.filter(r => r.itemId !== ri.itemId) })} className="p-2 text-muted hover:text-red-500 transition-all"><Trash2 size={18} /></button></div></div>
                  );
                })}
              </div>
              <div className="bg-primary/10 dark:bg-primary/10 p-6 rounded-[2rem] border border-primary/20 dark:border-primary/20">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <select value={newIngredientId} onChange={(e) => setNewIngredientId(e.target.value)} className="w-full p-4 rounded-2xl bg-card dark:bg-elevated border-none outline-none text-sm font-black shadow-sm"><option value="">Select Item...</option>{inventory.map(inv => (<option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>))}</select>
                  <input type="number" step="0.01" value={newIngredientQty || ''} onChange={(e) => setNewIngredientQty(parseFloat(e.target.value))} placeholder="0.00" className="w-full p-4 rounded-2xl bg-card dark:bg-elevated border-none outline-none text-sm font-black shadow-sm" />
                </div>
                <button onClick={addIngredientToTemp} disabled={!newIngredientId || newIngredientQty <= 0} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase transition-all shadow-sm">Add Link</button>
              </div>
            </div>
            <div className="p-8 border-t border-border dark:border-border flex gap-4"><button onClick={() => setRecipeModal(null)} className="flex-1 py-4 bg-card text-muted rounded-2xl font-black border border-border">Cancel</button><button onClick={handleSaveRecipe} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20">Sync Stock</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
