import React, { useState, useEffect } from 'react';
import { X, Save, Package, Tag, Hash, DollarSign, Settings, Layers, Trash2, Plus } from 'lucide-react';
import { InventoryItem, InventoryUnit, RecipeIngredient, Warehouse } from '../../types';

interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: InventoryItem) => void;
    lang: 'en' | 'ar';
    warehouses: Warehouse[];
    existingItems: InventoryItem[]; // For BOM selection
    initialItem?: InventoryItem | null;
}

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSave, lang, warehouses, existingItems, initialItem }) => {
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        name: '',
        nameAr: '',
        sku: '',
        barcode: '',
        unit: InventoryUnit.COUNT,
        category: '',
        costPrice: 0,
        purchasePrice: 0,
        threshold: 0,
        isAudited: true,
        auditFrequency: 'DAILY',
        isComposite: false,
        bom: [],
        warehouseQuantities: []
    });

    useEffect(() => {
        if (initialItem) {
            setFormData(initialItem);
        } else {
            setFormData({
                id: crypto.randomUUID(),
                name: '',
                nameAr: '',
                sku: '',
                barcode: '',
                unit: InventoryUnit.COUNT,
                category: '',
                costPrice: 0,
                purchasePrice: 0,
                threshold: 0,
                isAudited: true,
                auditFrequency: 'DAILY',
                isComposite: false,
                bom: [],
                warehouseQuantities: warehouses.map(w => ({ warehouseId: w.id, quantity: 0 }))
            });
        }
    }, [initialItem, warehouses, isOpen]);

    if (!isOpen) return null;

    const handleAddIngredient = () => {
        setFormData({
            ...formData,
            bom: [...(formData.bom || []), { itemId: '', quantity: 0, unit: '' }]
        });
    };

    const handleRemoveIngredient = (index: number) => {
        const newBom = [...(formData.bom || [])];
        newBom.splice(index, 1);
        setFormData({ ...formData, bom: newBom });
    };

    const handleUpdateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
        const newBom = [...(formData.bom || [])];
        newBom[index] = { ...newBom[index], [field]: value };
        setFormData({ ...formData, bom: newBom });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as InventoryItem);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                            <Package size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                {lang === 'ar' ? (initialItem ? 'تعديل صنف' : 'إضافة صنف جديد') : (initialItem ? 'Edit Item' : 'Add New Item')}
                            </h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {lang === 'ar' ? 'تعريف بيانات المخزون والشراء' : 'Define inventory and purchase data'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                    {/* Basic Info */}
                    <section className="space-y-4">
                        <h4 className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">
                            <Tag size={14} /> {lang === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{lang === 'ar' ? 'اسم الصنف (EN)' : 'Item Name (EN)'}</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-1.5" dir="rtl">
                                <label className="text-[10px] font-black text-slate-400 uppercase mr-1">{lang === 'ar' ? 'اسم الصنف (AR)' : 'Item Name (AR)'}</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.nameAr}
                                    onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">SKU / Code</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{lang === 'ar' ? 'الوحدة' : 'Unit'}</label>
                                <select
                                    value={formData.unit}
                                    onChange={e => setFormData({ ...formData, unit: e.target.value as InventoryUnit })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold appearance-none"
                                >
                                    {Object.values(InventoryUnit).map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                    <option value="CUSTOM">{lang === 'ar' ? 'وحدة مخصصة' : 'Custom Unit'}</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{lang === 'ar' ? 'التصنيف' : 'Category'}</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                    placeholder="e.g. Vegetables, Meat..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Pricing & Threshold */}
                    <section className="space-y-4">
                        <h4 className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">
                            <DollarSign size={14} /> {lang === 'ar' ? 'التسعير والمخزون' : 'Pricing & Inventory'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{lang === 'ar' ? 'سعر الشراء' : 'Purchase Price'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.purchasePrice}
                                    onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{lang === 'ar' ? 'تكلفة الوحدة' : 'Cost Price'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.costPrice}
                                    onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{lang === 'ar' ? 'حد التنبيه' : 'Alert Threshold'}</label>
                                <input
                                    type="number"
                                    value={formData.threshold}
                                    onChange={e => setFormData({ ...formData, threshold: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Audit Settings */}
                    <section className="space-y-4">
                        <h4 className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">
                            <Settings size={14} /> {lang === 'ar' ? 'إعدادات الجرد' : 'Audit Settings'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.isAudited}
                                    onChange={e => setFormData({ ...formData, isAudited: e.target.checked })}
                                    className="hidden"
                                />
                                <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.isAudited ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isAudited ? 'left-7' : 'left-1'}`} />
                                </div>
                                <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase">{lang === 'ar' ? 'خاضع للجرد' : 'Is Audited'}</span>
                            </label>

                            {formData.isAudited && (
                                <div className="flex items-center gap-4 flex-1">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'تكرار الجرد:' : 'Cycle:'}</span>
                                    <div className="flex gap-2">
                                        {['DAILY', 'WEEKLY', 'MONTHLY'].map(freq => (
                                            <button
                                                key={freq}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, auditFrequency: freq as any })}
                                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.auditFrequency === freq
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                                                    }`}
                                            >
                                                {freq}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Composite / BOM */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">
                                <Layers size={14} /> {lang === 'ar' ? 'صنف مجمع (Recipe / BOM)' : 'Composite / BOM'}
                            </h4>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isComposite}
                                    onChange={e => setFormData({ ...formData, isComposite: e.target.checked })}
                                    className="hidden"
                                />
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.isComposite ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.isComposite ? 'left-5.5' : 'left-0.5'}`} />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase">{lang === 'ar' ? 'تفعيل' : 'Enable BOM'}</span>
                            </label>
                        </div>

                        {formData.isComposite && (
                            <div className="p-6 bg-violet-50 dark:bg-violet-950/20 rounded-2xl border border-violet-100 dark:border-violet-900/50 space-y-4">
                                <div className="space-y-3">
                                    {formData.bom?.map((ing, idx) => (
                                        <div key={idx} className="flex gap-3 items-center">
                                            <select
                                                value={ing.itemId}
                                                onChange={e => handleUpdateIngredient(idx, 'itemId', e.target.value)}
                                                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm font-bold"
                                            >
                                                <option value="">{lang === 'ar' ? 'اختر صنف...' : 'Select item...'}</option>
                                                {existingItems.filter(i => i.id !== formData.id).map(item => (
                                                    <option key={item.id} value={item.id}>{lang === 'ar' ? item.nameAr : item.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={ing.quantity}
                                                onChange={e => handleUpdateIngredient(idx, 'quantity', Number(e.target.value))}
                                                className="w-24 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm font-bold"
                                            />
                                            <span className="text-xs font-black text-slate-400 w-12">{existingItems.find(i => i.id === ing.itemId)?.unit || '-'}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveIngredient(idx)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddIngredient}
                                    className="w-full py-3 border-2 border-dashed border-violet-200 dark:border-violet-900 rounded-xl text-violet-600 font-black text-[10px] uppercase tracking-widest hover:bg-violet-50 dark:hover:bg-violet-900/10 flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> {lang === 'ar' ? 'إضافة مكون' : 'Add Ingredient'}
                                </button>
                            </div>
                        )}
                    </section>
                </form>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-4 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all"
                    >
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> {lang === 'ar' ? 'حفظ الصنف' : 'Save Item'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemModal;
