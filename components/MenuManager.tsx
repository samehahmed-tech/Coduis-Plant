
import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Edit3, Trash2, Tag,
  Layers, Clock, CheckCircle2, AlertCircle,
  ChevronRight, MoreVertical, Image as ImageIcon,
  DollarSign, Percent, Gift, Eye, EyeOff, Scale,
  Save, X, Info, LayoutGrid, List, Sparkles, Link, ShoppingBag,
  ArrowRight, Filter, ChevronDown, UtensilsCrossed,
  Settings, Building2, Globe, Truck, Map, Printer as PrinterIcon
} from 'lucide-react';
import { RestaurantMenu, MenuItem, Offer, MenuCategory, InventoryItem, RecipeIngredient, Branch, DeliveryPlatform, Printer, AppSettings } from '../types';

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
    menus, categories, platforms,
    updateMenuItem, addMenuItem, deleteMenuItem,
    addCategory, updateCategory, deleteCategory,
    addMenu, updateMenu, linkCategory
  } = useMenuStore();
  const { inventory } = useInventoryStore();
  const { branches, printers, settings } = useAuthStore();
  const lang = settings.language;
  // const t = translations[lang]; // Not heavily used here yet, using ternary for labels

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
      const existingIdx = prev.tempRecipe.findIndex(ri => ri.inventoryItemId === newIngredientId);
      let nextRecipe = [...prev.tempRecipe];
      if (existingIdx !== -1) nextRecipe[existingIdx] = { ...nextRecipe[existingIdx], quantityNeeded: nextRecipe[existingIdx].quantityNeeded + newIngredientQty };
      else nextRecipe.push({ inventoryItemId: newIngredientId, quantityNeeded: newIngredientQty });
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

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <UtensilsCrossed className="text-indigo-600" size={32} />
            {lang === 'ar' ? 'كتالوج المنيو' : 'Menu Catalog'}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
            {lang === 'ar' ? 'أطلق العنان للهندسة الذكية لقائمة طعامك' : 'Engineer your recipes for maximum profit'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCategoryModal({
              isOpen: true,
              mode: 'ADD',
              category: { id: '', name: '', items: [], menuIds: [selectedMenuId], targetOrderTypes: [] }
            })}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 text-white px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all border border-slate-900 dark:border-slate-700"
          >
            <Plus size={18} />
            {lang === 'ar' ? 'قسم جديد' : 'New Section'}
          </button>

          <button
            onClick={() => setItemModal({ isOpen: true, mode: 'ADD', menuId: selectedMenuId, categoryId: filteredCategories[0]?.id || '', item: { id: '', name: '', price: 0, categoryId: '', isAvailable: true } })}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
            disabled={filteredCategories.length === 0}
          >
            <UtensilsCrossed size={18} />
            {lang === 'ar' ? 'صنف جديد' : 'New Item'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-8">
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 shrink-0 self-start">
          <button onClick={() => setActiveTab('MENUS')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'MENUS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            <LayoutGrid size={14} className="inline mr-2" /> {lang === 'ar' ? 'القوائم النشطة' : 'Active Menus'}
          </button>
          <button onClick={() => setActiveTab('OFFERS')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'OFFERS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            <Gift size={14} className="inline mr-2" /> {lang === 'ar' ? 'العروض' : 'Offers'}
          </button>
        </div>
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder={lang === 'ar' ? 'بحث عن أصناف...' : 'Search items...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm font-bold text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-3">
          {menus.map(menu => (
            <div key={menu.id} className="relative group">
              <button
                onClick={() => setSelectedMenuId(menu.id)}
                className={`w-full text-left p-5 rounded-[2rem] border transition-all duration-300 ${selectedMenuId === menu.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-black text-sm truncate pr-6 ${selectedMenuId === menu.id ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{menu.name}</span>
                  {menu.isDefault && <div className={`w-2 h-2 rounded-full ${selectedMenuId === menu.id ? 'bg-white' : 'bg-indigo-600'} animate-pulse`} />}
                </div>
                <div className="flex flex-wrap gap-1 items-center mt-2">
                  <span className="text-[9px] font-black uppercase opacity-60">{menu.status}</span>
                  {(menu.targetPlatforms?.length || 0) > 0 && <span className="text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded text-white">{menu.targetPlatforms?.length} Apps</span>}
                  {(menu.targetBranches?.length || 0) > 0 && <span className="text-[9px] font-black bg-indigo-500/30 px-1.5 py-0.5 rounded text-white">{menu.targetBranches?.length} Br.</span>}
                </div>
              </button>
              <button
                onClick={() => {
                  const newName = prompt(lang === 'ar' ? 'اسم المنيو الجديد:' : 'New Menu Name:', menu.name);
                  if (newName) updateMenu({ ...menu, name: newName });
                }}
                className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 rounded-xl text-white"
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
              <div className="flex justify-between items-end mb-6 px-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-4">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className="p-4 bg-indigo-100 dark:bg-indigo-900/20 rounded-[1.5rem] text-indigo-600">
                      <Layers size={24} />
                    </div>
                  )}
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{lang === 'ar' ? (category.nameAr || category.name) : category.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{category.items.length} {lang === 'ar' ? 'أصناف' : 'Items'}</p>
                      {category.targetOrderTypes && category.targetOrderTypes.length > 0 && (
                        <div className="flex gap-1">
                          {category.targetOrderTypes.includes('DINE_IN' as any) && <span className="p-1 rounded bg-orange-100 text-orange-600" title="Dine In"><UtensilsCrossed size={10} /></span>}
                          {category.targetOrderTypes.includes('TAKEAWAY' as any) && <span className="p-1 rounded bg-blue-100 text-blue-600" title="Takeaway"><ShoppingBag size={10} /></span>}
                          {category.targetOrderTypes.includes('DELIVERY' as any) && <span className="p-1 rounded bg-green-100 text-green-600" title="Delivery"><Truck size={10} /></span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCategoryModal({ isOpen: true, mode: 'EDIT', category })}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-all"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => deleteCategory(selectedMenuId, category.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {category.items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(item => (
                  <div key={item.id} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-2xl transition-all group relative flex flex-col h-full overflow-hidden ${item.layoutType === 'wide' ? 'md:col-span-2' : ''}`}>
                    <div className="absolute top-6 left-6 flex gap-2">
                      {item.sortOrder !== undefined && <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-full shadow-md">#{item.sortOrder}</span>}
                      {item.printerIds && item.printerIds.length > 0 && <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-black rounded-full flex items-center gap-1"><PrinterIcon size={8} /> {item.printerIds.length}</span>}
                    </div>
                    <button className={`absolute top-6 right-6 p-2 rounded-xl ${item.isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {item.isAvailable ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    <div className={`mb-6 flex ${item.layoutType === 'wide' ? 'justify-start gap-6' : 'justify-center flex-col items-center'}`}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className={`${item.layoutType === 'wide' ? 'w-32 h-32' : 'w-40 h-40'} object-cover rounded-[2rem] shadow-lg`} />
                      ) : (
                        <div className={`${item.layoutType === 'wide' ? 'w-32 h-32' : 'w-40 h-40'} bg-slate-5: dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-200 group-hover:text-indigo-400 transition-colors`}>
                          <ImageIcon size={48} />
                        </div>
                      )}

                      <div className={`${item.layoutType === 'wide' ? 'text-left flex-1 py-2' : 'text-center mt-4'}`}>
                        <h5 className="font-black text-lg text-slate-800 dark:text-white mb-1">{lang === 'ar' ? (item.nameAr || item.name) : item.name}</h5>
                        <p className="text-xl font-black text-indigo-600">{settings.currencySymbol} {item.price.toFixed(2)}</p>
                        {item.layoutType === 'wide' && item.description && <p className="text-[10px] text-slate-400 font-medium line-clamp-2 mt-2">{lang === 'ar' ? (item.descriptionAr || item.description) : item.description}</p>}
                      </div>
                    </div>

                    <div className="mt-auto flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                      <button onClick={() => setItemModal({ isOpen: true, mode: 'EDIT', menuId: selectedMenuId, categoryId: category.id, item })} className="flex-1 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600">Edit</button>
                      <button onClick={() => setRecipeModal({ isOpen: true, menuId: selectedMenuId, categoryId: category.id, item, tempRecipe: item.recipe || [] })} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 rounded-2xl transition-all shadow-sm"><Scale size={18} /></button>
                      <button onClick={() => deleteMenuItem(selectedMenuId, category.id, item.id)} className="p-3 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800"><p className="text-slate-400 font-black uppercase tracking-widest">{lang === 'ar' ? 'لا يوجد أقسام لعرضها' : 'No sections linked to this menu'}</p></div>
          )}

          {/* Link Existing */}
          {otherCategories.length > 0 && !showAddExistingCategory && (
            <button onClick={() => setShowAddExistingCategory(true)} className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-black text-xs uppercase tracking-widest"><Layers size={32} /> Link Existing Group</button>
          )}

          {showAddExistingCategory && (
            <div className="p-8 bg-indigo-50 dark:bg-slate-900 rounded-[2.5rem] border border-indigo-100 dark:border-slate-800 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6"><h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Available to link</h4><button onClick={() => setShowAddExistingCategory(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase">Close</button></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {otherCategories.map(cat => (
                  <button key={cat.id} onClick={() => { linkCategory(selectedMenuId, cat.id); setShowAddExistingCategory(false); }} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-all text-left">
                    <p className="font-black text-xs text-slate-800 dark:text-white">{cat.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{cat.items.length} Items</p>
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4"><div className="p-4 bg-indigo-600 text-white rounded-2xl"><Settings size={28} /></div><div><h3 className="text-2xl font-black text-slate-800 dark:text-white">Menu Targets</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Where should this menu appear?</p></div></div>
              <button onClick={() => setMenuSettingsModal(null)} className="text-slate-400"><X size={32} /></button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><Building2 size={14} /> Active Branches</h4>
                <div className="grid grid-cols-2 gap-3">
                  {branches.map(b => (
                    <button key={b.id} onClick={() => toggleTarget('branch', b.id)} className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${menuSettingsModal.targetBranches?.includes(b.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                      <span className="font-black text-xs">{b.name}</span>
                      {menuSettingsModal.targetBranches?.includes(b.id) && <CheckCircle2 size={16} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><Globe size={14} /> Delivery Platforms</h4>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map(p => (
                    <button key={p.id} onClick={() => toggleTarget('platform', p.id)} className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${menuSettingsModal.targetPlatforms?.includes(p.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
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
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex gap-4">
              <button onClick={() => setMenuSettingsModal(null)} className="flex-1 py-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl font-black uppercase tracking-widest border border-slate-200">Cancel</button>
              <button onClick={() => { updateMenu(menuSettingsModal); setMenuSettingsModal(null); }} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20">Apply Configuration</button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      {itemModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl">
                  <UtensilsCrossed size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase">
                    {itemModal.mode === 'ADD' ? (lang === 'ar' ? 'صنف جديد' : 'New Item') : (lang === 'ar' ? 'تعديل صنف' : 'Edit Item')}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {lang === 'ar' ? 'تخصيص بيانات وتفاصيل المنتج' : 'Customize product details and printers'}
                  </p>
                </div>
              </div>
              <button onClick={() => setItemModal(null)} className="p-3 bg-white dark:bg-slate-800 text-slate-400 rounded-2xl shadow-sm hover:rotate-90 transition-all"><X size={28} /></button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
              {/* Basic Info Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'الاسم (EN)' : 'Name (English)'}</label>
                    <input type="text" value={itemModal.item.name} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, name: e.target.value } })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-indigo-600 transition-all outline-none" placeholder="e.g. Classic Burger" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'الاسم (AR)' : 'Name (Arabic)'}</label>
                    <input type="text" value={itemModal.item.nameAr || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, nameAr: e.target.value } })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-right border border-transparent focus:border-indigo-600 transition-all outline-none" placeholder="مثلاً: برجر كلاسيك" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'السعر' : 'Price'}</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="number" value={itemModal.item.price || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, price: parseFloat(e.target.value) || 0 } })} className="w-full pl-12 pr-4 py-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none border border-transparent focus:border-indigo-600 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'الترتيب' : 'Sort Order'}</label>
                      <input type="number" value={itemModal.item.sortOrder || 0} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, sortOrder: parseInt(e.target.value) || 0 } })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none border border-transparent focus:border-indigo-600 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ImageUploader
                      value={itemModal.item.image || ''}
                      onChange={(url) => setItemModal({ ...itemModal, item: { ...itemModal.item, image: url } })}
                      type="item"
                      size="md"
                      label={lang === 'ar' ? 'صورة الصنف' : 'Item Image'}
                      lang={lang}
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'القسم' : 'Category'}</label>
                      <select
                        value={itemModal.categoryId}
                        onChange={(e) => setItemModal({ ...itemModal, categoryId: e.target.value, item: { ...itemModal.item, categoryId: e.target.value } })}
                        className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-indigo-600 transition-all outline-none appearance-none"
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'شكل العرض' : 'Appearance Layout'}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['standard', 'wide', 'image-only'].map(layout => (
                      <button
                        key={layout}
                        onClick={() => setItemModal({ ...itemModal, item: { ...itemModal.item, layoutType: layout as any } })}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${itemModal.item.layoutType === layout ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'توجيه الطباعة' : 'Print Routing'}</label>
                  <div className="flex flex-wrap gap-2">
                    {printers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggleItemPrinter(p.id)}
                        className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${itemModal.item.printerIds?.includes(p.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500'}`}
                      >
                        <PrinterIcon size={12} />
                        {p.name}
                      </button>
                    ))}
                    {printers.length === 0 && <p className="text-[10px] text-slate-400 italic">No printers configured. Go to Printer Hub.</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'الوصف (EN)' : 'Description (English)'}</label>
                  <textarea rows={3} value={itemModal.item.description || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, description: e.target.value } })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl resize-none outline-none border border-transparent focus:border-indigo-600 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'الوصف (AR)' : 'Description (Arabic)'}</label>
                  <textarea rows={3} value={itemModal.item.descriptionAr || ''} onChange={(e) => setItemModal({ ...itemModal, item: { ...itemModal.item, descriptionAr: e.target.value } })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl resize-none text-right outline-none border border-transparent focus:border-indigo-600 transition-all" />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50 dark:bg-slate-950/20">
              <button
                onClick={() => setItemModal(null)}
                className="flex-1 py-5 bg-white dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all"
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Layers size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">{categoryModal.mode === 'ADD' ? (lang === 'ar' ? 'قسم جديد' : 'New Section') : (lang === 'ar' ? 'تعديل قسم' : 'Edit Section')}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'تهيئة وتخصيص المجموعات' : 'Configure group & visibility'}</p>
                </div>
              </div>
              <button onClick={() => setCategoryModal(null)} className="p-2 text-slate-400 hover:rotate-90 transition-all"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'الاسم (EN)' : 'Name (English)'}</label>
                  <input type="text" value={categoryModal.category.name} onChange={(e) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, name: e.target.value } })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-indigo-600 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'الاسم (AR)' : 'Name (Arabic)'}</label>
                  <input type="text" value={categoryModal.category.nameAr || ''} onChange={(e) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, nameAr: e.target.value } })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-right border border-transparent focus:border-indigo-600 transition-all outline-none" />
                </div>
              </div>

              <ImageUploader
                value={categoryModal.category.image || ''}
                onChange={(url) => setCategoryModal({ ...categoryModal, category: { ...categoryModal.category, image: url } })}
                type="category"
                size="md"
                label={lang === 'ar' ? 'صورة القسم' : 'Category Image'}
                lang={lang}
              />

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'أنواع الطلبات المسموحة' : 'Available Order Modes'}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'DINE_IN', icon: UtensilsCrossed, label: 'Dine In' },
                    { id: 'TAKEAWAY', icon: ShoppingBag, label: 'Takeaway' },
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
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                      >
                        <mode.icon size={20} />
                        <span className="text-[9px] font-black uppercase">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'ar' ? 'ربط بالقوائم' : 'Linked Menus'}</label>
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
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${isLinked ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500'}`}
                      >
                        {menu.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
              <button onClick={handleSaveCategory} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                {categoryModal.mode === 'ADD' ? (lang === 'ar' ? 'إنشاء القسم' : 'Create Section') : (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECIPE MODAL */}
      {recipeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
              <div className="flex items-center gap-4"><div className="p-4 bg-indigo-600 text-white rounded-2xl"><Scale size={32} /></div><div><h3 className="text-xl font-black text-slate-800 dark:text-white">Recipe: {recipeModal.item.name}</h3></div></div>
              <button onClick={() => setRecipeModal(null)} className="text-slate-400"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              <div className="space-y-3">
                {recipeModal.tempRecipe.map((ri) => {
                  const inv = inventory.find(i => i.id === ri.inventoryItemId);
                  return (
                    <div key={ri.inventoryItemId} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-indigo-600 font-black">{inv?.name.charAt(0)}</div><div><p className="font-black text-slate-800 dark:text-white">{inv?.name}</p></div></div><div className="flex items-center gap-4"><span className="text-xl font-black text-indigo-600">{ri.quantityNeeded}</span><button onClick={() => setRecipeModal({ ...recipeModal, tempRecipe: recipeModal.tempRecipe.filter(r => r.inventoryItemId !== ri.inventoryItemId) })} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button></div></div>
                  );
                })}
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <select value={newIngredientId} onChange={(e) => setNewIngredientId(e.target.value)} className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border-none outline-none text-sm font-black shadow-sm"><option value="">Select Item...</option>{inventory.map(inv => (<option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>))}</select>
                  <input type="number" step="0.01" value={newIngredientQty || ''} onChange={(e) => setNewIngredientQty(parseFloat(e.target.value))} placeholder="0.00" className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border-none outline-none text-sm font-black shadow-sm" />
                </div>
                <button onClick={addIngredientToTemp} disabled={!newIngredientId || newIngredientQty <= 0} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase transition-all shadow-sm">Add Link</button>
              </div>
            </div>
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4"><button onClick={() => setRecipeModal(null)} className="flex-1 py-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl font-black border border-slate-200">Cancel</button><button onClick={handleSaveRecipe} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20">Sync Stock</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
