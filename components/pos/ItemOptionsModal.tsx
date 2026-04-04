import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Plus, Minus, AlertCircle, DollarSign } from 'lucide-react';
import { MenuItem, ItemSize } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ItemOptionsModalProps {
    isOpen: boolean;
    item: MenuItem | null;
    onClose: () => void;
    onConfirm: (item: MenuItem, selectedModifiers: { groupName: string; optionName: string; price: number }[], newQuantity: number) => void;
    currencySymbol: string;
    lang: string;
}

const ItemOptionsModal: React.FC<ItemOptionsModalProps> = ({
    isOpen, item, onClose, onConfirm, currencySymbol, lang
}) => {
    const isRTL = lang === 'ar';
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState<ItemSize | null>(null);
    const [selectedMods, setSelectedMods] = useState<Record<string, Set<string>>>({});
    const [customPrice, setCustomPrice] = useState('');
    const priceInputRef = useRef<HTMLInputElement>(null);

    // Open price = item with price 0 or isWeighted flag
    const isOpenPrice = item ? (item.price === 0 || item.isWeighted) : false;

    useEffect(() => {
        if (isOpen && item) {
            setQuantity(1);
            setSelectedSize(item.sizes && item.sizes.length > 0 ? item.sizes[0] || null : null);
            setSelectedMods({});
            setCustomPrice(item.isWeighted ? '' : (item.price === 0 ? '' : String(item.price)));
            // Auto-focus price input for open price items
            if (item.price === 0 || item.isWeighted) {
                setTimeout(() => priceInputRef.current?.focus(), 300);
            }
        }
    }, [isOpen, item]);

    const parsedCustomPrice = parseFloat(customPrice) || 0;
    const basePrice = isOpenPrice ? parsedCustomPrice : (selectedSize ? selectedSize.price : (item?.price || 0));

    const modsPrice = useMemo(() => {
        let total = 0;
        if (!item?.modifierGroups) return total;
        for (const group of item.modifierGroups) {
            const selectedSet = selectedMods[group.id];
            if (!selectedSet) continue;
            for (const optId of selectedSet) {
                const opt = group.options.find(o => o.id === optId);
                if (opt) total += opt.price;
            }
        }
        return total;
    }, [selectedMods, item]);

    const totalPrice = (basePrice + modsPrice) * quantity;

    const isValid = useMemo(() => {
        if (!item?.modifierGroups) return true;
        for (const group of item.modifierGroups) {
            const selectedCount = selectedMods[group.id]?.size || 0;
            if (group.minSelection > 0 && selectedCount < group.minSelection) return false;
        }
        return true;
    }, [selectedMods, item]);

    const handleToggleMod = (groupId: string, optionId: string, groupMin: number, groupMax: number) => {
        setSelectedMods(prev => {
            const next = { ...prev };
            const set = new Set(next[groupId] || []);
            if (set.has(optionId)) {
                set.delete(optionId);
            } else {
                if (groupMax === 1) {
                    set.clear();
                    set.add(optionId);
                } else if (set.size < groupMax || groupMax === 0) {
                    set.add(optionId);
                }
            }
            next[groupId] = set;
            return next;
        });
    };

    const handleConfirm = () => {
        if (!isValid || !item) return;
        if (isOpenPrice && parsedCustomPrice <= 0) return;
        const finalItem = { ...item };

        // Apply open price
        if (isOpenPrice) {
            finalItem.price = parsedCustomPrice;
        }

        if (selectedSize) {
            finalItem.price = selectedSize.price;
            if (lang === 'ar') {
                finalItem.nameAr = `${item.nameAr || item.name} (${selectedSize.nameAr || selectedSize.name})`;
                finalItem.name = `${item.name} (${selectedSize.name})`;
            } else {
                finalItem.name = `${item.name} (${selectedSize.name})`;
                finalItem.nameAr = `${item.nameAr || item.name} (${selectedSize.nameAr || selectedSize.name})`;
            }
        }

        const finalMods: { groupName: string; optionName: string; price: number }[] = [];
        if (item.modifierGroups) {
            for (const group of item.modifierGroups) {
                const selectedSet = selectedMods[group.id];
                if (!selectedSet) continue;
                for (const optId of selectedSet) {
                    const opt = group.options.find(o => o.id === optId);
                    if (opt) finalMods.push({ groupName: group.name, optionName: opt.name, price: opt.price });
                }
            }
        }
        onConfirm(finalItem, finalMods, quantity);
        onClose();
    };

    if (!isOpen || !item) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md sm:p-4">
                <div className="absolute inset-0" onClick={onClose} />
                <motion.div initial={{ y: "100%", scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className={`relative w-full sm:max-w-xl bg-card sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-border/20 ${isRTL ? 'text-right' : 'text-left'}`}>

                    {/* Header Image & Info */}
                    <div className="flex flex-col relative shrink-0">
                        {item.image && (
                            <div className="w-full h-32 sm:h-40 overflow-hidden relative">
                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                            </div>
                        )}
                        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10 border border-white/10 shadow-sm">
                            <X size={18} />
                        </button>

                        <div className={`px-6 pb-4 pt-4 border-b border-border/10 bg-card ${item.image ? '-mt-10 relative z-10' : ''}`}>
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-main leading-tight drop-shadow-sm">
                                        {lang === 'ar' ? (item.nameAr || item.name) : item.name}
                                    </h2>
                                    {(item.description || item.descriptionAr) && (
                                        <p className="text-xs font-medium text-muted mt-1 leading-relaxed max-w-md">
                                            {lang === 'ar' ? (item.descriptionAr || item.description) : item.description}
                                        </p>
                                    )}
                                </div>
                                <div className="shrink-0 text-right bg-elevated/50 px-3 py-1.5 rounded-xl border border-border/20 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">{isRTL ? 'السعر' : 'Base'}</p>
                                    <p className="text-lg font-black text-indigo-500 tabular-nums leading-none mt-0.5">
                                        <span className="text-xs uppercase mr-0.5">{currencySymbol}</span>
                                        {basePrice.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-card relative z-10">
                        {/* Open Price Input */}
                        {isOpenPrice && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                        <DollarSign size={14} className="text-emerald-500" />
                                        {isRTL ? 'أدخل السعر' : 'Enter Price'}
                                    </h3>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                        {item.isWeighted ? (isRTL ? 'صنف بالوزن' : 'Weighted Item') : (isRTL ? 'سعر مفتوح' : 'Open Price')}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-muted/50">{currencySymbol}</span>
                                    <input
                                        ref={priceInputRef}
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        min="0"
                                        value={customPrice}
                                        onChange={e => setCustomPrice(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                                        placeholder="0.00"
                                        className="w-full pl-12 pr-4 py-4 bg-elevated/50 border-2 border-border/30 rounded-2xl text-2xl font-black text-main outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all tabular-nums text-center"
                                    />
                                </div>
                                {/* Quick Price Presets */}
                                <div className="flex gap-2">
                                    {[10, 25, 50, 100, 250].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setCustomPrice(String(p))}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                                                customPrice === String(p)
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                    : 'bg-elevated/40 border border-border/20 text-muted hover:bg-emerald-500/10 hover:text-emerald-500'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Sizes */}
                        {item.sizes && item.sizes.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted">{isRTL ? 'الحجم' : 'Size'}</h3>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">{isRTL ? 'مطلوب (اختيار 1)' : 'Required (Select 1)'}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {item.sizes.map(size => {
                                        const isSelected = selectedSize?.id === size.id;
                                        return (
                                            <button
                                                key={size.id} onClick={() => setSelectedSize(size)} disabled={!size.isAvailable}
                                                className={`flex flex-col items-start p-3 rounded-xl transition-all border text-left active:scale-95 ${!size.isAvailable ? 'opacity-50 bg-elevated/30 border-border/10 cursor-not-allowed' : isSelected ? 'bg-indigo-500 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-elevated/40 border-border/20 text-main hover:bg-elevated shadow-sm'}`}
                                            >
                                                <span className={`font-black text-sm truncate w-full ${isSelected ? 'text-white' : 'text-main'}`}>
                                                    {lang === 'ar' ? (size.nameAr || size.name) : size.name}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isSelected ? 'text-indigo-200' : 'text-muted'}`}>
                                                    +{size.price.toFixed(2)} {currencySymbol}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Modifiers */}
                        {item.modifierGroups && item.modifierGroups.map((group) => {
                            const selectedCount = selectedMods[group.id]?.size || 0;
                            const isRequired = group.minSelection > 0;
                            const hasMetMin = selectedCount >= group.minSelection;

                            return (
                                <div key={group.id} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted">{group.name}</h3>
                                        <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border flex gap-1 items-center ${isRequired ? (!hasMetMin ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20') : 'text-muted bg-elevated/50 border-border/20'}`}>
                                            {isRequired ? (isRTL ? `إختر ${group.minSelection}` : `Min ${group.minSelection}`) : (isRTL ? 'إختياري' : 'Optional')}
                                            {group.maxSelection > 0 && <span className="opacity-60">· Max {group.maxSelection}</span>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {group.options.map(opt => {
                                            const isSelected = selectedMods[group.id]?.has(opt.id);
                                            return (
                                                <label key={opt.id} className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${isSelected ? 'bg-indigo-500/5 border-indigo-500/40 shadow-sm' : 'bg-elevated/40 border-border/20 hover:bg-elevated hover:shadow-sm'}`}>
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 shrink-0 transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-600 shadow-inner' : 'bg-card border-border/40'}`}>
                                                        {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 bg-white rounded-sm" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-main'}`}>{opt.name}</p>
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-widest shrink-0 ${opt.price > 0 ? (isSelected ? 'text-indigo-500' : 'text-muted') : 'text-emerald-500'}`}>
                                                        {opt.price > 0 ? `+${opt.price.toFixed(2)}` : (isRTL ? 'مجاني' : 'FREE')}
                                                    </span>
                                                    <input type="checkbox" className="hidden" checked={isSelected || false} onChange={() => handleToggleMod(group.id, opt.id, group.minSelection, group.maxSelection)} />
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Controls */}
                    <div className="p-5 border-t border-border/20 bg-elevated/50 shrink-0 space-y-4 relative z-20">
                        <AnimatePresence>
                            {!isValid && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">
                                        <AlertCircle size={16} className="shrink-0" />
                                        <span>{isRTL ? 'يرجى استكمال الخيارات المطلوبة' : 'Missing required options'}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-3">
                            {/* Quantity Stepper */}
                            <div className="flex items-center bg-card border border-border/20 rounded-2xl shadow-inner h-14 shrink-0 px-1">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-12 h-12 flex items-center justify-center text-muted hover:text-main hover:bg-elevated rounded-xl transition-all">
                                    <Minus size={20} />
                                </button>
                                <div className="w-10 text-center font-black text-xl text-main tabular-nums leading-none">
                                    {quantity}
                                </div>
                                <button onClick={() => setQuantity(q => q + 1)} className="w-12 h-12 flex items-center justify-center text-muted hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all">
                                    <Plus size={20} />
                                </button>
                            </div>

                            {/* Add Button */}
                            <button
                                onClick={handleConfirm} disabled={!isValid || (!selectedSize && item.sizes && item.sizes.length > 0) || (isOpenPrice && parsedCustomPrice <= 0)}
                                className="flex-1 h-14 bg-main text-app hover:bg-main/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black transition-all flex items-center justify-between px-6 shadow-xl shadow-main/10 border border-main active:scale-[0.98] group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-app/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                                <span className="uppercase tracking-widest text-sm relative z-10">{isRTL ? 'إضافة للطلب' : 'Add Item'}</span>
                                <span className="text-xl tabular-nums relative z-10 flex items-center gap-1">
                                    <span className="text-xs uppercase opacity-70 mt-1">{currencySymbol}</span>
                                    {totalPrice.toFixed(2)}
                                </span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ItemOptionsModal;
