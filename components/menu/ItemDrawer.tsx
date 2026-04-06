
import React, { useState, useEffect, useCallback } from 'react';
import {
    X, Save, Trash2, Plus, Minus, Sparkles, Scale,
    LayoutGrid, Printer as PrinterIcon, Layers, Clock,
    DollarSign, Globe, History, Package, ImageIcon
} from 'lucide-react';
import { MenuItem, MenuCategory, Printer, Branch, InventoryItem, ModifierGroup, ModifierOption, ItemSize, PlatformPrice, RecipeIngredient } from '../../types';
import ImageUploader from '../common/ImageUploader';
import BarcodeScanner from '../common/BarcodeScanner';
import { barcodeApi } from '../../services/api';

type DrawerTab = 'BASIC' | 'SIZES' | 'MODIFIERS' | 'RECIPE' | 'PRICING' | 'PLATFORMS' | 'SCHEDULE' | 'HISTORY';

interface Props {
    item: MenuItem;
    mode: 'ADD' | 'EDIT';
    categoryId: string;
    categories: MenuCategory[];
    printers: Printer[];
    branches: Branch[];
    inventory: InventoryItem[];
    onSave: (item: MenuItem, categoryId: string) => void;
    onClose: () => void;
    onDelete?: () => void;
    lang: string;
    currency: string;
}

const ItemDrawer: React.FC<Props> = ({
    item: initialItem, mode, categoryId: initialCategoryId,
    categories, printers, branches, inventory,
    onSave, onClose, onDelete, lang, currency
}) => {
    const [item, setItem] = useState<MenuItem>({ ...initialItem });
    const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
    const [tab, setTab] = useState<DrawerTab>('BASIC');
    const [scannerOpen, setScannerOpen] = useState(false);
    const [generatingBarcode, setGeneratingBarcode] = useState(false);

    const handleGenerateBarcode = useCallback(async () => {
        setGeneratingBarcode(true);
        try {
            const result = await barcodeApi.generate();
            update({ barcode: result.barcode });
        } catch (err) {
            console.error('Failed to generate barcode:', err);
        } finally {
            setGeneratingBarcode(false);
        }
    }, []);

    const handleBarcodeScan = useCallback((code: string) => {
        update({ barcode: code });
        setScannerOpen(false);
    }, []);

    useEffect(() => {
        setItem({ ...initialItem });
        setActiveCategoryId(initialCategoryId);
        setTab('BASIC');
    }, [initialItem, initialCategoryId]);

    const update = (changes: Partial<MenuItem>) => setItem(prev => ({ ...prev, ...changes }));

    const tabs: { id: DrawerTab; icon: React.ElementType; labelEn: string; labelAr: string }[] = [
        { id: 'BASIC', icon: LayoutGrid, labelEn: 'Basic', labelAr: 'أساسي' },
        { id: 'SIZES', icon: Package, labelEn: 'Sizes', labelAr: 'الأحجام' },
        { id: 'MODIFIERS', icon: Layers, labelEn: 'Modifiers', labelAr: 'الإضافات' },
        { id: 'RECIPE', icon: Scale, labelEn: 'Recipe', labelAr: '\u0627\u0644\u0631\u064a\u0633\u0628\u064a' },
        { id: 'PRICING', icon: DollarSign, labelEn: 'Pricing', labelAr: 'الأسعار' },
        { id: 'PLATFORMS', icon: Globe, labelEn: 'Platforms', labelAr: 'المنصات' },
        { id: 'SCHEDULE', icon: Clock, labelEn: 'Schedule', labelAr: 'الجدولة' },
        { id: 'HISTORY', icon: History, labelEn: 'History', labelAr: 'السجل' },
    ];

    // Size handlers
    const addSize = () => update({ sizes: [...(item.sizes || []), { id: `sz-${Date.now()}`, name: '', price: item.price, isAvailable: true }] });
    const updateSize = (sizeId: string, changes: Partial<ItemSize>) => update({ sizes: (item.sizes || []).map(s => s.id === sizeId ? { ...s, ...changes } : s) });
    const removeSize = (sizeId: string) => update({ sizes: (item.sizes || []).filter(s => s.id !== sizeId) });

    // Modifier handlers
    const addModGroup = () => update({ modifierGroups: [...(item.modifierGroups || []), { id: `mod-${Date.now()}`, name: '', minSelection: 0, maxSelection: 1, options: [] }] });
    const updateModGroup = (gId: string, changes: Partial<ModifierGroup>) => update({ modifierGroups: (item.modifierGroups || []).map(g => g.id === gId ? { ...g, ...changes } : g) });
    const removeModGroup = (gId: string) => update({ modifierGroups: (item.modifierGroups || []).filter(g => g.id !== gId) });
    const addModOption = (gId: string) => update({
        modifierGroups: (item.modifierGroups || []).map(g => g.id === gId ? { ...g, options: [...g.options, { id: `opt-${Date.now()}`, name: '', price: 0 }] } : g)
    });
    const updateModOption = (gId: string, oId: string, changes: Partial<ModifierOption>) => update({
        modifierGroups: (item.modifierGroups || []).map(g => g.id === gId ? { ...g, options: g.options.map(o => o.id === oId ? { ...o, ...changes } : o) } : g)
    });
    const removeModOption = (gId: string, oId: string) => update({
        modifierGroups: (item.modifierGroups || []).map(g => g.id === gId ? { ...g, options: g.options.filter(o => o.id !== oId) } : g)
    });

    // Platform pricing
    const addPlatformPrice = () => update({ platformPricing: [...(item.platformPricing || []), { platformId: '', price: item.price }] });
    const updatePlatformPrice = (idx: number, changes: Partial<PlatformPrice>) => update({
        platformPricing: (item.platformPricing || []).map((p, i) => i === idx ? { ...p, ...changes } : p)
    });
    const removePlatformPrice = (idx: number) => update({ platformPricing: (item.platformPricing || []).filter((_, i) => i !== idx) });

    // Printer toggle
    const togglePrinter = (pId: string) => {
        const current = item.printerIds || [];
        update({ printerIds: current.includes(pId) ? current.filter(id => id !== pId) : [...current, pId] });
    };

    // Recipe handlers
    const [recipeIngredientId, setRecipeIngredientId] = useState('');
    const [recipeIngredientQty, setRecipeIngredientQty] = useState(0);

    const addRecipeIngredient = () => {
        if (!recipeIngredientId || recipeIngredientQty <= 0) return;
        const inv = inventory.find(i => i.id === recipeIngredientId);
        if (!inv) return;
        const existing = item.recipe || [];
        const found = existing.find(r => r.itemId === recipeIngredientId);
        if (found) {
            update({ recipe: existing.map(r => r.itemId === recipeIngredientId ? { ...r, quantity: r.quantity + recipeIngredientQty } : r) });
        } else {
            update({ recipe: [...existing, { itemId: recipeIngredientId, quantity: recipeIngredientQty, unit: String(inv.unit) }] });
        }
        setRecipeIngredientId('');
        setRecipeIngredientQty(0);
    };

    const removeRecipeIngredient = (iId: string) => {
        update({ recipe: (item.recipe || []).filter(r => r.itemId !== iId) });
    };

    const recipeCost = (item.recipe || []).reduce((sum, r) => {
        const inv = inventory.find(i => i.id === r.itemId);
        return sum + (inv ? inv.costPrice * r.quantity : 0);
    }, 0);
    const recipeMargin = item.price > 0 && recipeCost > 0 ? ((item.price - recipeCost) / item.price * 100) : null;

    // Day toggle
    const toggleDay = (dayId: string) => {
        const current = item.availableDays || [];
        update({ availableDays: current.includes(dayId) ? current.filter(d => d !== dayId) : [...current, dayId] });
    };

    const dayOptions = [
        { id: 'mon', en: 'Mon', ar: 'الاثنين' }, { id: 'tue', en: 'Tue', ar: 'الثلاثاء' },
        { id: 'wed', en: 'Wed', ar: 'الأربعاء' }, { id: 'thu', en: 'Thu', ar: 'الخميس' },
        { id: 'fri', en: 'Fri', ar: 'الجمعة' }, { id: 'sat', en: 'Sat', ar: 'السبت' },
        { id: 'sun', en: 'Sun', ar: 'الأحد' },
    ];

    const platformOptions = [
        { id: 'talabat', name: 'Talabat' }, { id: 'elmenus', name: 'elmenus' },
        { id: 'uber_eats', name: 'Uber Eats' }, { id: 'store_direct', name: 'Store Direct' },
    ];

    const dietaryOptions = [
        { id: 'vegan', labelEn: 'Vegan', labelAr: 'نباتي صرف', color: 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-900/50' },
        { id: 'vegetarian', labelEn: 'Vegetarian', labelAr: 'نباتي', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50' },
        { id: 'gluten-free', labelEn: 'Gluten Free', labelAr: 'خالي من الجلوتين', color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50' },
        { id: 'spicy', labelEn: 'Spicy', labelAr: 'حار', color: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50' },
        { id: 'keto', labelEn: 'Keto', labelAr: 'كيتو', color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50' },
        { id: 'new', labelEn: 'New', labelAr: 'جديد', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-900/50' },
        { id: 'best-seller', labelEn: 'Best Seller', labelAr: 'الأكثر مبيعاً', color: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900/50' },
    ];

    const toggleBadge = (badgeId: string) => {
        const current = item.dietaryBadges || [];
        update({ dietaryBadges: current.includes(badgeId) ? current.filter(b => b !== badgeId) : [...current, badgeId] });
    };


    const margin = item.cost && item.price > 0 ? ((item.price - item.cost) / item.price * 100) : null;
    const marginColor = margin === null ? 'text-muted' : margin >= 30 ? 'text-emerald-500' : margin >= 15 ? 'text-amber-500' : 'text-rose-500';

    const inputCls = "w-full h-10 px-3.5 bg-white/[0.04] rounded-xl border border-white/[0.08] focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 text-[13px] text-main placeholder:text-muted/40 hover:border-white/[0.14]";
    const labelCls = "text-[11px] font-semibold text-muted/70 uppercase tracking-wider mb-2 block";

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} style={{ animation: 'fadeIn 200ms ease-out' }} />

            {/* Drawer */}
            <div className="relative w-full max-w-[560px] bg-gradient-to-b from-[#1a1b2e] to-[#141520] shadow-2xl shadow-black/50 flex flex-col overflow-hidden" style={{ animation: 'slideInRight 300ms cubic-bezier(0.16, 1, 0.3, 1)' }}>

                {/* Header — Premium with image preview */}
                <div className="relative px-6 pt-5 pb-4">
                    {/* Gradient accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

                    <div className="flex items-start gap-4">
                        {/* Image thumbnail */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/[0.08] shrink-0 bg-white/[0.03]">
                            {item.image ? (
                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted/20">
                                    <ImageIcon size={20} />
                                </div>
                            )}
                        </div>

                        {/* Title + meta */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[17px] font-bold text-white tracking-tight truncate">
                                {item.name || (mode === 'ADD' ? (lang === 'ar' ? 'صنف جديد' : 'New Item') : (lang === 'ar' ? 'تعديل الصنف' : 'Edit Item'))}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                {item.price > 0 && (
                                    <span className="text-[12px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        {currency}{item.price.toFixed(2)}
                                    </span>
                                )}
                                {margin !== null && (
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${margin >= 30 ? 'text-emerald-400 bg-emerald-500/10' : margin >= 15 ? 'text-amber-400 bg-amber-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                                        {margin.toFixed(0)}% {lang === 'ar' ? 'هامش' : 'margin'}
                                    </span>
                                )}
                                {item.sku && (
                                    <span className="text-[10px] font-mono text-muted/50 bg-white/[0.03] px-1.5 py-0.5 rounded">{item.sku}</span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {onDelete && (
                                <button onClick={onDelete} className="p-2 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200">
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all duration-200">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Nav — Modern underline style */}
                <div className="px-6 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
                    <div className="flex gap-0.5">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`relative flex items-center gap-1.5 px-3 py-3 text-[11px] font-semibold whitespace-nowrap transition-all duration-200 rounded-t-md ${tab === t.id
                                    ? 'text-white'
                                    : 'text-white/35 hover:text-white/60 hover:bg-white/[0.02]'
                                    }`}
                            >
                                <t.icon size={13} className={tab === t.id ? 'text-indigo-400' : ''} />
                                {lang === 'ar' ? t.labelAr : t.labelEn}
                                {tab === t.id && (
                                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar" style={{ scrollBehavior: 'smooth' }}>

                    {/* BASIC TAB */}
                    {tab === 'BASIC' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>{lang === 'ar' ? 'الاسم (EN)' : 'Name (EN)'}</label>
                                    <input type="text" value={item.name} onChange={e => update({ name: e.target.value })} className={inputCls} placeholder="Classic Burger" />
                                </div>
                                <div>
                                    <label className={labelCls}>{lang === 'ar' ? 'الاسم (AR)' : 'Name (AR)'}</label>
                                    <input type="text" value={item.nameAr || ''} onChange={e => update({ nameAr: e.target.value })} className={`${inputCls} text-right`} placeholder="برجر كلاسيك" dir="rtl" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelCls}>{lang === 'ar' ? 'السعر' : 'Price'}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted/50">{currency}</span>
                                        <input type="number" value={item.price} onChange={e => update({ price: parseFloat(e.target.value) || 0 })} className={`${inputCls} pl-9 font-medium text-emerald-500`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>{lang === 'ar' ? 'التكلفة' : 'Cost'}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted/50">{currency}</span>
                                        <input type="number" value={item.cost || ''} onChange={e => update({ cost: parseFloat(e.target.value) || 0 })} className={`${inputCls} pl-9`} placeholder="0.00" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>{lang === 'ar' ? 'الهامش' : 'Margin'}</label>
                                    <div className={`h-9 flex items-center justify-center rounded-md border border-border/20 bg-elevated/50 text-[13px] font-medium ${marginColor}`}>
                                        {margin !== null ? `${margin.toFixed(1)}%` : '—'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>SKU</label>
                                    <input type="text" value={item.sku || ''} onChange={e => update({ sku: e.target.value })} className={inputCls} placeholder="SKU-001" />
                                </div>
                                <div>
                                    <label className={labelCls}>{lang === 'ar' ? 'باركود' : 'Barcode'}</label>
                                    <input type="text" value={item.barcode || ''} onChange={e => update({ barcode: e.target.value })} className={inputCls} placeholder="6281234567890" />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>{lang === 'ar' ? 'القسم' : 'Category'}</label>
                                <div className="relative group">
                                    <select value={activeCategoryId} onChange={e => setActiveCategoryId(e.target.value)} className={`${inputCls} appearance-none cursor-pointer pr-8`}>
                                        {categories.map(c => <option key={c.id} value={c.id} className="bg-card">{c.name}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted/50">▼</div>
                                </div>
                            </div>

                            {/* Dietary Badges Section */}
                            <div className="pt-2">
                                <label className={labelCls}>{lang === 'ar' ? 'العلامات والشارات (اختياري)' : 'Badges & Tags (Optional)'}</label>
                                <div className="flex flex-wrap gap-2">
                                    {dietaryOptions.map(badge => {
                                        const isSelected = (item.dietaryBadges || []).includes(badge.id);
                                        return (
                                            <button
                                                key={badge.id}
                                                onClick={() => toggleBadge(badge.id)}
                                                className={`px-3 py-1 items-center justify-center rounded-full text-[11px] font-medium border transition-colors ${isSelected
                                                    ? badge.color
                                                    : 'bg-transparent border-border/30 text-muted hover:border-border/40 hover:text-main'
                                                    }`}
                                            >
                                                {lang === 'ar' ? badge.labelAr : badge.labelEn}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>{lang === 'ar' ? 'الوصف (EN)' : 'Description (EN)'}</label>
                                    <textarea rows={2} value={item.description || ''} onChange={e => update({ description: e.target.value })} className={`${inputCls} h-auto py-2 resize-none`} placeholder="Brief description..." />
                                </div>
                                <div>
                                    <label className={labelCls}>{lang === 'ar' ? 'الوصف (AR)' : 'Description (AR)'}</label>
                                    <textarea rows={2} value={item.descriptionAr || ''} onChange={e => update({ descriptionAr: e.target.value })} className={`${inputCls} h-auto py-2 resize-none text-right`} placeholder="وصف موجز..." dir="rtl" />
                                </div>
                            </div>

                            {/* Magic Fill */}
                            <button
                                onClick={() => {
                                    if (!item.name) return;
                                    update({
                                        nameAr: item.nameAr || (item.name + ' مترجم'),
                                        description: item.description || `Delicious ${item.name} prepared with fresh ingredients.`,
                                        descriptionAr: item.descriptionAr || `${item.name} لذيذ محضر من مكونات طازجة.`,
                                    });
                                }}
                                className="w-full flex items-center justify-center gap-2 h-9 bg-indigo-500/10 text-indigo-400 rounded-md text-[12px] font-medium hover:bg-indigo-500/20 transition-colors"
                            >
                                <Sparkles size={14} className="text-cyan-400" />
                                {lang === 'ar' ? 'توليد المحتوى الناقص (AI)' : 'Auto-fill Missing Content'}
                            </button>

                            {/* Image */}
                            <div>
                                <label className={labelCls}>{lang === 'ar' ? 'الصورة' : 'Image'}</label>
                                <div className="p-3 border border-border/30 rounded-md bg-elevated/50">
                                    <ImageUploader value={item.image || ''} onChange={url => update({ image: url })} type="item" label={lang === 'ar' ? 'صورة الصنف' : 'Item Image'} lang={lang as 'en' | 'ar'} />
                                </div>
                            </div>

                            {/* Printers */}
                            <div>
                                <label className={labelCls}>{lang === 'ar' ? 'التوجيه للطباعة' : 'Print Routing'}</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {printers.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => togglePrinter(p.id)}
                                            className={`h-8 px-3 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 ${item.printerIds?.includes(p.id)
                                                ? 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30'
                                                : 'bg-elevated border border-border/30 text-muted/80 hover:text-main'
                                                }`}
                                        >
                                            <PrinterIcon size={12} className={item.printerIds?.includes(p.id) ? '' : 'opacity-50'} /> {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SIZES TAB */}
                    {tab === 'SIZES' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <label className={labelCls}>{lang === 'ar' ? 'الأحجام والمتغيرات' : 'Sizes & Variations'}</label>
                                <button onClick={addSize} className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                    <Plus size={14} /> {lang === 'ar' ? 'إضافة حجم' : 'Add Size'}
                                </button>
                            </div>

                            {(item.sizes || []).length === 0 && (
                                <div className="text-center py-10 bg-elevated/30 rounded-md border border-dashed border-border/30">
                                    <Package size={24} className="mx-auto mb-2 text-muted/30" />
                                    <p className="text-[12px] font-medium text-muted/70">{lang === 'ar' ? 'لا يوجد أحجام' : 'No sizes configured'}</p>
                                    <button onClick={addSize} className="mt-3 text-[11px] font-medium text-indigo-400 hover:text-indigo-300">
                                        + {lang === 'ar' ? 'أضف أول حجم' : 'Add your first size'}
                                    </button>
                                </div>
                            )}

                            {(item.sizes || []).map(size => {
                                const sMargin = size.cost && size.price > 0 ? ((size.price - size.cost) / size.price * 100) : null;
                                return (
                                    <div key={size.id} className="p-3 bg-elevated/30 rounded-md border border-border/20 space-y-3 relative group">
                                        <div className="flex items-center gap-3">
                                            <input type="text" value={size.name} onChange={e => updateSize(size.id, { name: e.target.value })} placeholder={lang === 'ar' ? 'الاسم (مثال: كبير)' : 'Name (e.g. Large)'} className={`${inputCls} flex-1`} />
                                            <button onClick={() => updateSize(size.id, { isAvailable: !size.isAvailable })} className={`h-9 px-3 rounded-md border text-[11px] font-medium transition-colors ${size.isAvailable ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-rose-500/30 text-rose-500 bg-rose-500/10'}`}>
                                                {size.isAvailable ? 'Active' : 'Hidden'}
                                            </button>
                                            <button onClick={() => removeSize(size.id)} className="h-9 w-9 flex items-center justify-center rounded-md border border-border/20 text-muted/50 hover:text-rose-400 hover:border-rose-500/30 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className={labelCls}>{lang === 'ar' ? 'السعر' : 'Price'}</label>
                                                <input type="number" value={size.price} onChange={e => updateSize(size.id, { price: parseFloat(e.target.value) || 0 })} className={`${inputCls} text-emerald-500 font-medium`} />
                                            </div>
                                            <div>
                                                <label className={labelCls}>{lang === 'ar' ? 'التكلفة' : 'Cost'}</label>
                                                <input type="number" value={size.cost || ''} onChange={e => updateSize(size.id, { cost: parseFloat(e.target.value) || 0 })} className={inputCls} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className={labelCls}>{lang === 'ar' ? 'الهامش' : 'Margin'}</label>
                                                <div className={`h-9 flex items-center justify-center rounded-md border border-border/20 bg-elevated/50 text-[12px] font-medium ${sMargin === null ? 'text-muted/50' : sMargin >= 30 ? 'text-emerald-500' : sMargin >= 15 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                    {sMargin !== null ? `${sMargin.toFixed(0)}%` : '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* MODIFIERS TAB */}
                    {tab === 'MODIFIERS' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <label className={labelCls}>{lang === 'ar' ? 'مجموعات الإضافات' : 'Modifier Groups'}</label>
                                <button onClick={addModGroup} className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                    <Plus size={14} /> {lang === 'ar' ? 'إضافة مجموعة' : 'Add Group'}
                                </button>
                            </div>

                            {(item.modifierGroups || []).length === 0 && (
                                <div className="text-center py-10 bg-elevated/30 rounded-md border border-dashed border-border/30">
                                    <Layers size={24} className="mx-auto mb-2 text-muted/30" />
                                    <p className="text-[12px] font-medium text-muted/70">{lang === 'ar' ? 'لا يوجد إضافات' : 'No modifiers configured'}</p>
                                </div>
                            )}

                            {(item.modifierGroups || []).map(group => (
                                <div key={group.id} className="p-4 bg-elevated/30 rounded-md border border-border/20 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <input type="text" value={group.name} onChange={e => updateModGroup(group.id, { name: e.target.value })} placeholder={lang === 'ar' ? 'اسم المجموعة (مثال: الإضافات)' : 'Group name (e.g. Add-ons)'} className={`${inputCls} flex-1`} />
                                        <button onClick={() => removeModGroup(group.id)} className="h-9 w-9 flex items-center justify-center rounded-md border border-border/20 text-muted/50 hover:text-rose-400 hover:border-rose-500/30 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelCls}>{lang === 'ar' ? 'الحد الأدنى' : 'Min Selection'}</label>
                                            <input type="number" min={0} value={group.minSelection} onChange={e => updateModGroup(group.id, { minSelection: parseInt(e.target.value) || 0 })} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>{lang === 'ar' ? 'الحد الأقصى' : 'Max Selection'}</label>
                                            <input type="number" min={1} value={group.maxSelection} onChange={e => updateModGroup(group.id, { maxSelection: parseInt(e.target.value) || 1 })} className={inputCls} />
                                        </div>
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-2 pt-2 border-t border-border/20">
                                        <p className="text-[10px] text-muted/60 font-semibold uppercase tracking-wider">{lang === 'ar' ? 'الخيارات' : 'Options'}</p>
                                        {group.options.map((opt, oIdx) => (
                                            <div key={opt.id} className="flex items-center gap-2">
                                                <input type="text" value={opt.name} onChange={e => updateModOption(group.id, opt.id, { name: e.target.value })} placeholder={`Option ${oIdx + 1}`} className={`${inputCls} flex-1`} />
                                                <div className="relative w-28">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted/50">+</span>
                                                    <input type="number" value={opt.price} onChange={e => updateModOption(group.id, opt.id, { price: parseFloat(e.target.value) || 0 })} className={`${inputCls} pl-6 font-medium text-emerald-500`} placeholder="0" />
                                                </div>
                                                <button onClick={() => removeModOption(group.id, opt.id)} className="h-9 w-9 flex items-center justify-center rounded-md border border-border/20 text-muted/50 hover:text-rose-400 transition-colors shrink-0"><Minus size={14} /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => addModOption(group.id)} className="text-[11px] font-medium text-indigo-400 flex items-center gap-1 hover:text-indigo-300 mt-2">
                                            <Plus size={12} /> {lang === 'ar' ? 'إضافة خيار' : 'Add Option'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* RECIPE TAB */}
                    {tab === 'RECIPE' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {(item.recipe || []).length > 0 && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 bg-elevated/30 rounded-md border border-border/20 text-center">
                                        <p className="text-[10px] text-muted/60 font-semibold uppercase">{lang === 'ar' ? 'تكلفة الريسبي' : 'Recipe Cost'}</p>
                                        <p className="text-[14px] font-bold text-amber-500 mt-1">{currency}{recipeCost.toFixed(2)}</p>
                                    </div>
                                    <div className="p-3 bg-elevated/30 rounded-md border border-border/20 text-center">
                                        <p className="text-[10px] text-muted/60 font-semibold uppercase">{lang === 'ar' ? 'سعر البيع' : 'Sell Price'}</p>
                                        <p className="text-[14px] font-bold text-emerald-500 mt-1">{currency}{item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="p-3 bg-elevated/30 rounded-md border border-border/20 text-center">
                                        <p className="text-[10px] text-muted/60 font-semibold uppercase">{lang === 'ar' ? 'الهامش' : 'Margin'}</p>
                                        <p className={`text-[14px] font-bold mt-1 ${recipeMargin !== null ? (recipeMargin >= 30 ? 'text-emerald-500' : recipeMargin >= 15 ? 'text-amber-500' : 'text-rose-500') : 'text-muted/50'}`}>
                                            {recipeMargin !== null ? recipeMargin.toFixed(0) + '%' : '—'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <label className={labelCls}>{lang === 'ar' ? 'مكونات الريسبي' : 'Recipe Ingredients'}</label>
                                <span className="text-[10px] text-muted/50">{(item.recipe || []).length} {lang === 'ar' ? 'مكون' : 'items'}</span>
                            </div>
                            {(item.recipe || []).length === 0 && (
                                <div className="text-center py-10 bg-elevated/30 rounded-md border border-dashed border-border/30">
                                    <Scale size={24} className="mx-auto mb-2 text-muted/30" />
                                    <p className="text-[12px] font-medium text-muted/70">{lang === 'ar' ? 'لم يتم إضافة مكونات بعد' : 'No ingredients added yet'}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                {(item.recipe || []).map(ri => {
                                    const inv = inventory.find(i => i.id === ri.itemId);
                                    const lineCost = inv ? inv.costPrice * ri.quantity : 0;
                                    return (
                                        <div key={ri.itemId} className="flex items-center gap-3 p-3 bg-elevated/30 rounded-md border border-border/20 group">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-medium text-main truncate">{inv?.name || ri.itemId}</p>
                                                <p className="text-[10px] text-muted/60">{ri.quantity} {ri.unit} × {currency}{inv?.costPrice?.toFixed(2) || '0.00'}</p>
                                            </div>
                                            <span className="text-[12px] font-medium text-amber-500 shrink-0">{currency}{lineCost.toFixed(2)}</span>
                                            <input type="number" step="0.01" value={ri.quantity}
                                                onChange={e => { const qty = parseFloat(e.target.value) || 0; update({ recipe: (item.recipe || []).map(r => r.itemId === ri.itemId ? { ...r, quantity: qty } : r) }); }}
                                                className={`${inputCls} w-20 text-center`} />
                                            <button onClick={() => removeRecipeIngredient(ri.itemId)} className="h-8 w-8 flex items-center justify-center rounded-md border border-border/20 text-muted/50 hover:text-rose-400 hover:border-rose-500/30 transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-4 bg-amber-500/5 rounded-md border border-amber-500/20 space-y-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5"><Plus size={12} /> {lang === 'ar' ? 'إضافة مكون' : 'Add Ingredient'}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>{lang === 'ar' ? 'صنف المخزون' : 'Inventory Item'}</label>
                                        <div className="relative">
                                            <select value={recipeIngredientId} onChange={e => setRecipeIngredientId(e.target.value)} className={`${inputCls} appearance-none cursor-pointer pr-8`}>
                                                <option value="">{lang === 'ar' ? 'اختر صنف...' : 'Select item...'}</option>
                                                {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>)}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted/50">▼</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>{lang === 'ar' ? 'الكمية' : 'Quantity'}</label>
                                        <input type="number" step="0.01" value={recipeIngredientQty || ''} onChange={e => setRecipeIngredientQty(parseFloat(e.target.value) || 0)} placeholder="0.00" className={inputCls} />
                                    </div>
                                </div>
                                <button onClick={addRecipeIngredient} disabled={!recipeIngredientId || recipeIngredientQty <= 0}
                                    className="w-full h-9 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-md text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                                    <Plus size={14} /> {lang === 'ar' ? 'أضف للريسبي' : 'Add to Recipe'}
                                </button>
                            </div>
                            {recipeCost > 0 && item.cost !== parseFloat(recipeCost.toFixed(2)) && (
                                <button onClick={() => update({ cost: parseFloat(recipeCost.toFixed(2)) })}
                                    className="w-full flex items-center justify-center gap-2 h-9 bg-indigo-500/10 text-indigo-400 rounded-md text-[12px] font-medium hover:bg-indigo-500/20 transition-colors">
                                    <Sparkles size={14} />
                                    {lang === 'ar' ? 'تحديث التكلفة: ' + currency + recipeCost.toFixed(2) : 'Sync Cost from Recipe: ' + currency + recipeCost.toFixed(2)}
                                </button>
                            )}
                        </div>
                    )}

                    {/* PRICING TAB */}
                    {tab === 'PRICING' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <label className={labelCls}>{lang === 'ar' ? 'قوائم الأسعار للفروع' : 'Branch Price Lists'}</label>
                                <button onClick={() => update({ priceLists: [...(item.priceLists || []), { name: '', price: item.price, branchIds: [] }] })} className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300">
                                    <Plus size={14} /> {lang === 'ar' ? 'إضافة قائمة' : 'Add List'}
                                </button>
                            </div>
                            {(item.priceLists || []).length === 0 && (
                                <div className="text-center py-10 bg-elevated/30 rounded-md border border-dashed border-border/30">
                                    <DollarSign size={24} className="mx-auto mb-2 text-muted/30" />
                                    <p className="text-[12px] font-medium text-muted/70">{lang === 'ar' ? 'لا يوجد تسعير مخصص' : 'No custom pricing lists'}</p>
                                </div>
                            )}
                            {(item.priceLists || []).map((pl, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-elevated/30 rounded-md border border-border/20">
                                    <input type="text" value={pl.name} onChange={e => {
                                        const lists = [...(item.priceLists || [])];
                                        lists[idx] = { ...lists[idx], name: e.target.value };
                                        update({ priceLists: lists });
                                    }} placeholder={lang === 'ar' ? 'اسم القائمة' : 'List Name'} className={`${inputCls} flex-1`} />
                                    <input type="number" value={pl.price} onChange={e => {
                                        const lists = [...(item.priceLists || [])];
                                        lists[idx] = { ...lists[idx], price: parseFloat(e.target.value) || 0 };
                                        update({ priceLists: lists });
                                    }} className={`${inputCls} w-28 text-emerald-500 font-medium`} />
                                    <button onClick={() => update({ priceLists: (item.priceLists || []).filter((_, i) => i !== idx) })} className="h-9 w-9 flex items-center justify-center rounded-md border border-border/20 text-muted/50 hover:text-rose-400 transition-colors"><Minus size={14} /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PLATFORMS TAB */}
                    {tab === 'PLATFORMS' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <label className={labelCls}>{lang === 'ar' ? 'أسعار المنصات' : 'Platform Pricing'}</label>
                                <button onClick={addPlatformPrice} className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300">
                                    <Plus size={14} /> {lang === 'ar' ? 'إضافة منصة' : 'Add Platform'}
                                </button>
                            </div>

                            {(item.platformPricing || []).length === 0 && (
                                <div className="text-center py-10 bg-elevated/30 rounded-md border border-dashed border-border/30">
                                    <Globe size={24} className="mx-auto mb-2 text-muted/30" />
                                    <p className="text-[12px] font-medium text-muted/70">{lang === 'ar' ? 'غير مرتبط بأي منصة' : 'Not linked to any platforms'}</p>
                                </div>
                            )}

                            {(item.platformPricing || []).map((pp, idx) => (
                                <div key={idx} className="p-4 bg-elevated/30 rounded-md border border-border/20 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative group flex-1">
                                            <select value={pp.platformId} onChange={e => updatePlatformPrice(idx, { platformId: e.target.value })} className={`${inputCls} appearance-none cursor-pointer pr-8`}>
                                                <option value="">Select Platform</option>
                                                {platformOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted/50">▼</div>
                                        </div>
                                        <button onClick={() => removePlatformPrice(idx)} className="h-9 w-9 flex items-center justify-center rounded-md border border-border/20 text-muted/50 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelCls}>{lang === 'ar' ? 'السعر' : 'Price'}</label>
                                            <input type="number" value={pp.price} onChange={e => updatePlatformPrice(idx, { price: parseFloat(e.target.value) || 0 })} className={`${inputCls} text-emerald-500 font-medium`} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>{lang === 'ar' ? 'العمولة %' : 'Commission %'}</label>
                                            <input type="number" value={(pp.commission || 0) * 100} onChange={e => updatePlatformPrice(idx, { commission: (parseFloat(e.target.value) || 0) / 100 })} className={inputCls} placeholder="15" />
                                        </div>
                                    </div>
                                    {pp.commission && pp.price > 0 && (
                                        <p className="text-[11px] text-muted/70 mt-2">
                                            {lang === 'ar' ? 'صافي الإيراد:' : 'Expected Net:'} <span className="text-main font-medium">{currency}{(pp.price * (1 - pp.commission)).toFixed(2)}</span>
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SCHEDULE TAB */}
                    {tab === 'SCHEDULE' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div>
                                <label className={labelCls}>{lang === 'ar' ? 'أيام التوفر' : 'Available Days'}</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {dayOptions.map(d => (
                                        <button
                                            key={d.id}
                                            onClick={() => toggleDay(d.id)}
                                            className={`h-8 px-3 rounded-md text-[11px] font-medium transition-colors ${item.availableDays?.includes(d.id)
                                                ? 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30'
                                                : 'bg-elevated border border-border/30 text-muted/80 hover:text-main'
                                                }`}
                                        >
                                            {lang === 'ar' ? d.ar : d.en}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>{lang === 'ar' ? 'متاح من الساعة' : 'From Time'}</label>
                                    <input type="time" value={item.availableFrom || ''} onChange={e => update({ availableFrom: e.target.value })} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>{lang === 'ar' ? 'إلى الساعة' : 'To Time'}</label>
                                    <input type="time" value={item.availableTo || ''} onChange={e => update({ availableTo: e.target.value })} className={inputCls} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {tab === 'HISTORY' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <label className={labelCls}>{lang === 'ar' ? 'سجل التعديلات' : 'Audit Log'}</label>
                            {(item.versionHistory || []).length === 0 ? (
                                <div className="text-center py-10 bg-elevated/30 rounded-md border border-dashed border-border/30">
                                    <History size={24} className="mx-auto mb-2 text-muted/30" />
                                    <p className="text-[12px] font-medium text-muted/70">{lang === 'ar' ? 'لا يوجد سجل' : 'No history details'}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {[...(item.versionHistory || [])].reverse().map((entry, idx) => (
                                        <div key={idx} className="p-3 bg-elevated/30 rounded-md border border-border/20 flex gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 opacity-50 shrink-0" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className="text-[12px] font-medium text-main">{entry.field}</p>
                                                    <p className="text-[10px] text-muted/60">{new Date(entry.timestamp).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px]">
                                                    <span className="text-muted/70 strike text-rose-400">{String(entry.oldValue)}</span>
                                                    <span className="text-muted/40">→</span>
                                                    <span className="text-emerald-500">{String(entry.newValue)}</span>
                                                </div>
                                                <p className="text-[10px] text-muted/50 mt-1">Edited by {entry.userName}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer — Premium elevated */}
                <div className="p-4 border-t border-white/[0.06] bg-gradient-to-t from-black/20 to-transparent backdrop-blur-sm flex gap-3">
                    <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.1] text-[12px] font-semibold text-white/60 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-200">
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                        onClick={() => onSave(item, activeCategoryId)}
                        disabled={!item.name.trim()}
                        className="flex-[2] h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-[12px] font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                    >
                        <Save size={14} /> {lang === 'ar' ? 'حفظ الصنف' : 'Save Item'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemDrawer;
