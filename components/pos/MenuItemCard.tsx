import React, { useCallback, useState } from 'react';
import { Plus, Minus, Ban, Star } from 'lucide-react';
import { MenuItem } from '../../types';

interface MenuItemCardProps {
    item: MenuItem;
    onAddItem: (item: MenuItem) => void;
    onRemoveItem?: (itemId: string) => void;
    quantity?: number;
    currencySymbol: string;
    isTouchMode: boolean;
    density?: 'comfortable' | 'compact' | 'ultra' | 'buttons';
    lang: 'en' | 'ar';
    highlighted?: boolean;
}

// Numpad popup for quick quantity input
const NumpadPopup: React.FC<{
    quantity: number;
    onSet: (qty: number) => void;
    onClose: () => void;
    lang: string;
}> = ({ quantity, onSet, onClose, lang }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative bg-card rounded-2xl shadow-2xl border border-border/30 p-4 w-[220px]" onClick={e => e.stopPropagation()}>
            <p className="text-center text-xs font-bold text-muted mb-3 uppercase tracking-wider">
                {lang === 'ar' ? 'تعديل الكمية' : 'Set Quantity'}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                    <button
                        key={n}
                        onClick={() => onSet(n)}
                        className={`h-12 rounded-xl font-black text-lg transition-colors ${quantity === n ? 'bg-emerald-600 text-white' : 'bg-elevated hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-main'
                            }`}
                    >
                        {n}
                    </button>
                ))}
                <button
                    onClick={onClose}
                    className="h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 font-bold text-sm hover:bg-red-100 transition-colors col-span-2"
                >
                    {lang === 'ar' ? 'إغلاق' : 'Close'}
                </button>
            </div>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════════
// IMAGE CARD — comfortable/compact: warm, rounded, readable
// ═══════════════════════════════════════════════════════════════
const ImageCard: React.FC<{
    item: MenuItem; displayName: string; isAvailable: boolean; isCompact: boolean;
    quantity: number; currencySymbol: string; lang: string; highlighted: boolean;
    isTouchMode: boolean;
    onAdd: (e: React.MouseEvent) => void; onRemove: (e: React.MouseEvent) => void;
    onCardClick: () => void; onQuantityClick: () => void;
}> = ({ item, displayName, isAvailable, isCompact, quantity, currencySymbol, lang, highlighted, isTouchMode, onAdd, onRemove, onCardClick, onQuantityClick }) => (
    <div
        onClick={onCardClick}
        className={`
            group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-100
            ${isAvailable
                ? `cursor-pointer active:scale-[0.97] ${quantity > 0
                    ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-400/50 shadow-md shadow-emerald-500/5'
                    : 'bg-card border-border/20 hover:shadow-lg hover:border-emerald-300/30'
                }`
                : 'opacity-40 bg-card border-border/20 cursor-not-allowed'
            }
            ${highlighted ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
        `}
    >
        {/* Image */}
        {item.image ? (
            <div className={`relative overflow-hidden ${isCompact ? 'h-20' : 'h-24'}`}>
                <img src={item.image} alt={displayName} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-red-500/80 px-2 py-1 rounded-lg">{lang === 'ar' ? 'غير متوفر' : 'N/A'}</span>
                    </div>
                )}
            </div>
        ) : (
            <div className="h-1.5 bg-gradient-to-r from-emerald-400/30 via-teal-400/20 to-transparent shrink-0" />
        )}

        {/* Content */}
        <div className="flex flex-col flex-1 p-3 gap-1.5">
            <h3 className="text-sm font-bold text-main leading-snug line-clamp-2">{displayName}</h3>

            <div className="mt-auto flex items-center justify-between pt-1">
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.price.toFixed(2)}
                    <span className="text-[10px] text-muted font-bold mx-0.5">{currencySymbol}</span>
                </span>

                {isAvailable && quantity > 0 ? (
                    <div className="flex items-center gap-0.5 bg-emerald-100/60 dark:bg-emerald-900/20 rounded-full px-1 py-0.5">
                        <button onClick={onRemove} className="w-8 h-8 rounded-full bg-white dark:bg-card text-muted flex items-center justify-center hover:text-red-500 transition-colors shadow-sm">
                            <Minus size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onQuantityClick(); }} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-emerald-700 dark:text-emerald-400 hover:bg-white/50 transition-colors">
                            {quantity}
                        </button>
                        <button onClick={onAdd} className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm hover:bg-emerald-500 transition-colors">
                            <Plus size={14} />
                        </button>
                    </div>
                ) : isAvailable ? (
                    <button onClick={onAdd} className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                        <Plus size={18} />
                    </button>
                ) : null}
            </div>
        </div>

        {/* Qty badge */}
        {quantity > 0 && (
            <div className={`absolute top-2 ${lang === 'ar' ? 'left-2' : 'right-2'} min-w-[1.5rem] h-6 px-1.5 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-lg`}>
                {quantity}
            </div>
        )}

        {/* Popular */}
        {item.isPopular && isAvailable && (
            <div className={`absolute top-2 ${lang === 'ar' ? 'right-2' : 'left-2'}`}>
                <Star size={16} fill="currentColor" className="text-amber-400 drop-shadow" />
            </div>
        )}
    </div>
);

// ═══════════════════════════════════════════════════════════════
// LIST ROW — ultra mode
// ═══════════════════════════════════════════════════════════════
const ListCard: React.FC<{
    item: MenuItem; displayName: string; isAvailable: boolean;
    quantity: number; currencySymbol: string; lang: string; highlighted: boolean;
    onAdd: (e: React.MouseEvent) => void; onRemove: (e: React.MouseEvent) => void;
    onCardClick: () => void; onQuantityClick: () => void;
}> = ({ item, displayName, isAvailable, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick, onQuantityClick }) => (
    <div
        onClick={onCardClick}
        className={`
            flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-75
            ${isAvailable
                ? `cursor-pointer active:scale-[0.99] ${quantity > 0 ? 'bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-300/30' : 'bg-card border-border/15 hover:border-emerald-200/30'
                }`
                : 'opacity-40 bg-card border-border/10 cursor-not-allowed'
            }
            ${highlighted ? 'ring-1 ring-amber-400' : ''}
        `}
    >
        {item.image && (
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-main truncate block">{displayName}</span>
        </div>
        <span className="shrink-0 text-sm font-black text-emerald-700 dark:text-emerald-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {item.price.toFixed(2)} <span className="text-[9px] text-muted">{currencySymbol}</span>
        </span>
        {isAvailable && (
            <div className="flex items-center gap-0.5 shrink-0">
                {quantity > 0 && (
                    <>
                        <button onClick={onRemove} className="w-8 h-8 rounded-lg bg-elevated text-muted flex items-center justify-center hover:text-red-500">
                            <Minus size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onQuantityClick(); }} className="w-6 text-center text-sm font-black text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer">
                            {quantity}
                        </button>
                    </>
                )}
                <button onClick={onAdd} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${quantity > 0 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}>
                    <Plus size={14} />
                </button>
            </div>
        )}
    </div>
);

// ═══════════════════════════════════════════════════════════════
// BUTTON mode
// ═══════════════════════════════════════════════════════════════
const ButtonCard: React.FC<{
    item: MenuItem; displayName: string; isAvailable: boolean;
    quantity: number; currencySymbol: string; lang: string; highlighted: boolean;
    onAdd: (e: React.MouseEvent) => void; onRemove: (e: React.MouseEvent) => void; onCardClick: () => void;
}> = ({ item, displayName, isAvailable, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => (
    <button
        onClick={onCardClick}
        disabled={!isAvailable}
        className={`
            relative w-full text-left rounded-xl border transition-all duration-75 px-3 py-2.5
            ${isAvailable
                ? `cursor-pointer active:scale-[0.97] ${quantity > 0
                    ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-300/40'
                    : 'bg-card border-border/15 hover:border-emerald-200/30'
                }`
                : 'opacity-30 bg-card border-border/10 cursor-not-allowed'
            }
            ${highlighted ? 'ring-1 ring-amber-400' : ''}
        `}
    >
        <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold truncate flex-1">{displayName}</span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {item.price.toFixed(0)}
            </span>
        </div>
        {quantity > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
                <button onClick={onRemove} className="w-6 h-6 rounded-lg bg-white dark:bg-card text-muted flex items-center justify-center hover:text-red-500 shadow-sm">
                    <Minus size={10} />
                </button>
                <span className="text-xs font-black text-emerald-600 w-4 text-center">{quantity}</span>
                <button onClick={onAdd} className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Plus size={10} />
                </button>
            </div>
        )}
    </button>
);

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
const MenuItemCard: React.FC<MenuItemCardProps> = React.memo(({
    item, onAddItem, onRemoveItem, quantity = 0,
    currencySymbol, isTouchMode, density = 'comfortable', lang, highlighted = false,
}) => {
    const displayName = (item as any).displayName || item.name;
    const isAvailable = (item as any).isActuallyAvailable !== false && item.isAvailable !== false;
    const [showNumpad, setShowNumpad] = useState(false);

    const handleAdd = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAvailable) onAddItem(item);
    }, [isAvailable, onAddItem, item]);

    const handleRemove = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemoveItem) onRemoveItem(item.id);
    }, [onRemoveItem, item.id]);

    const handleCardClick = useCallback(() => {
        if (isAvailable) onAddItem(item);
    }, [isAvailable, onAddItem, item]);

    const handleNumpadSet = useCallback((qty: number) => {
        if (!onRemoveItem) return;
        // Remove all then add desired qty
        for (let i = 0; i < quantity; i++) onRemoveItem(item.id);
        for (let i = 0; i < qty; i++) onAddItem(item);
        setShowNumpad(false);
    }, [quantity, onRemoveItem, onAddItem, item]);

    const p = {
        item, displayName, isAvailable, quantity, currencySymbol, lang, highlighted, isTouchMode,
        onAdd: handleAdd, onRemove: handleRemove, onCardClick: handleCardClick,
        onQuantityClick: () => setShowNumpad(true),
    };

    return (
        <>
            {density === 'buttons' ? <ButtonCard {...p} /> :
                density === 'ultra' ? <ListCard {...p} /> :
                    <ImageCard {...p} isCompact={density === 'compact'} />}
            {showNumpad && (
                <NumpadPopup
                    quantity={quantity}
                    onSet={handleNumpadSet}
                    onClose={() => setShowNumpad(false)}
                    lang={lang}
                />
            )}
        </>
    );
});

export default MenuItemCard;
