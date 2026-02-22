import React, { useCallback, useState } from 'react';
import { Plus, Minus, Star, X } from 'lucide-react';
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

// ═══════════════════════════════════════════════════════════════
// Quick Action Overlay — appears on tap when item has qty
// ═══════════════════════════════════════════════════════════════
const QuickOverlay: React.FC<{
    quantity: number;
    onAdd: () => void;
    onRemove: () => void;
    onClose: () => void;
    lang: string;
}> = ({ quantity, onAdd, onRemove, onClose, lang }) => (
    <div
        className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-in fade-in duration-100"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button onClick={onRemove} className="w-11 h-11 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                <Minus size={20} />
            </button>
            <span className="w-10 text-center text-2xl font-black text-white drop-shadow-lg">{quantity}</span>
            <button onClick={onAdd} className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                <Plus size={20} />
            </button>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════════
// IMAGE CARD — clean: image + name + price. Tap to add.
// ═══════════════════════════════════════════════════════════════
const ImageCard: React.FC<{
    item: MenuItem; displayName: string; isAvailable: boolean; isCompact: boolean;
    quantity: number; currencySymbol: string; lang: string; highlighted: boolean;
    onAdd: () => void; onRemove: () => void; onCardClick: () => void;
}> = ({ item, displayName, isAvailable, isCompact, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => {
    const [showOverlay, setShowOverlay] = useState(false);

    return (
        <div
            onClick={() => {
                if (!isAvailable) return;
                if (quantity > 0) { setShowOverlay(true); return; }
                onCardClick();
            }}
            className={`
                group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-100
                ${isAvailable
                    ? `cursor-pointer active:scale-[0.97] ${quantity > 0
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-400/40 shadow-sm'
                        : 'bg-card border-border/15 hover:shadow-lg hover:border-emerald-300/30 hover:-translate-y-0.5'
                    }`
                    : 'opacity-35 bg-card border-border/15 cursor-not-allowed'
                }
                ${highlighted ? 'ring-2 ring-amber-400 ring-offset-2' : ''}
            `}
        >
            {/* Image */}
            {item.image ? (
                <div className={`relative overflow-hidden ${isCompact ? 'h-20' : 'h-[90px]'}`}>
                    <img src={item.image} alt={displayName} loading="lazy" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="h-1 bg-gradient-to-r from-emerald-400/30 via-teal-300/15 to-transparent" />
            )}

            {/* Content — minimal: just name + price */}
            <div className="flex flex-col flex-1 p-2.5 gap-1">
                <h3 className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold text-main leading-snug line-clamp-2`}>{displayName}</h3>
                <div className="mt-auto pt-0.5">
                    <span className={`${isCompact ? 'text-sm' : 'text-base'} font-black text-emerald-700 dark:text-emerald-400`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {item.price.toFixed(2)}
                        <span className="text-[9px] text-muted font-bold mx-0.5">{currencySymbol}</span>
                    </span>
                </div>
            </div>

            {/* Qty badge */}
            {quantity > 0 && (
                <div className={`absolute top-1.5 ${lang === 'ar' ? 'left-1.5' : 'right-1.5'} min-w-[1.5rem] h-6 px-1.5 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-lg z-10`}>
                    {quantity}
                </div>
            )}

            {/* Popular */}
            {item.isPopular && isAvailable && (
                <div className={`absolute top-1.5 ${lang === 'ar' ? 'right-1.5' : 'left-1.5'} z-10`}>
                    <Star size={14} fill="currentColor" className="text-amber-400 drop-shadow" />
                </div>
            )}

            {/* Quick action overlay */}
            {showOverlay && (
                <QuickOverlay
                    quantity={quantity}
                    onAdd={() => { onAdd(); }}
                    onRemove={() => { onRemove(); if (quantity <= 1) setShowOverlay(false); }}
                    onClose={() => setShowOverlay(false)}
                    lang={lang}
                />
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// LIST ROW — ultra: compact row, tap to add
// ═══════════════════════════════════════════════════════════════
const ListCard: React.FC<{
    item: MenuItem; displayName: string; isAvailable: boolean;
    quantity: number; currencySymbol: string; lang: string; highlighted: boolean;
    onAdd: () => void; onRemove: () => void; onCardClick: () => void;
}> = ({ item, displayName, isAvailable, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => (
    <div
        onClick={() => { if (isAvailable) onCardClick(); }}
        className={`
            flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-75
            ${isAvailable
                ? `cursor-pointer active:scale-[0.99] ${quantity > 0 ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-300/25' : 'bg-card border-border/10 hover:border-emerald-200/25'
                }`
                : 'opacity-35 bg-card border-border/10 cursor-not-allowed'
            }
            ${highlighted ? 'ring-1 ring-amber-400' : ''}
        `}
    >
        {item.image && (
            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
        )}
        <span className="flex-1 min-w-0 text-sm font-semibold text-main truncate">{displayName}</span>
        <span className="shrink-0 text-sm font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
            {item.price.toFixed(2)}
        </span>
        {quantity > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="w-7 h-7 rounded-lg bg-elevated text-muted flex items-center justify-center hover:text-red-500">
                    <Minus size={13} />
                </button>
                <span className="w-5 text-center text-sm font-black text-emerald-600">{quantity}</span>
                <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Plus size={13} />
                </button>
            </div>
        )}
    </div>
);

// ═══════════════════════════════════════════════════════════════
// BUTTON — max density, tap to add
// ═══════════════════════════════════════════════════════════════
const ButtonCard: React.FC<{
    item: MenuItem; displayName: string; isAvailable: boolean;
    quantity: number; currencySymbol: string; lang: string; highlighted: boolean;
    onAdd: () => void; onRemove: () => void; onCardClick: () => void;
}> = ({ item, displayName, isAvailable, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => (
    <button
        onClick={() => { if (isAvailable) onCardClick(); }}
        disabled={!isAvailable}
        className={`
            relative w-full text-left rounded-xl border transition-all duration-75 px-2.5 py-2
            ${isAvailable
                ? `cursor-pointer active:scale-[0.97] ${quantity > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/15 border-emerald-300/30'
                    : 'bg-card border-border/10 hover:border-emerald-200/25'
                }`
                : 'opacity-25 bg-card border-border/10 cursor-not-allowed'
            }
            ${highlighted ? 'ring-1 ring-amber-400' : ''}
        `}
    >
        <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold truncate flex-1">{displayName}</span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 shrink-0 tabular-nums">
                {item.price.toFixed(0)}
            </span>
            {quantity > 0 && (
                <span className="min-w-[18px] h-4.5 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">
                    {quantity}
                </span>
            )}
        </div>
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

    const handleAdd = useCallback(() => {
        if (isAvailable) onAddItem(item);
    }, [isAvailable, onAddItem, item]);

    const handleRemove = useCallback(() => {
        if (onRemoveItem) onRemoveItem(item.id);
    }, [onRemoveItem, item.id]);

    const p = { item, displayName, isAvailable, quantity, currencySymbol, lang, highlighted, onAdd: handleAdd, onRemove: handleRemove, onCardClick: handleAdd };

    switch (density) {
        case 'buttons': return <ButtonCard {...p} />;
        case 'ultra': return <ListCard {...p} />;
        case 'compact': return <ImageCard {...p} isCompact={true} />;
        default: return <ImageCard {...p} isCompact={false} />;
    }
});

export default MenuItemCard;
