import React, { useCallback } from 'react';
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

// ═══════════════════════════════════════════════════════════════
// IMAGE CARD — comfortable/compact
// ═══════════════════════════════════════════════════════════════
const ImageCard: React.FC<{
    item: MenuItem; displayName: string; isAvailable: boolean; isCompact: boolean;
    quantity: number; currencySymbol: string; lang: string; highlighted: boolean;
    onAdd: (e: React.MouseEvent) => void; onRemove: (e: React.MouseEvent) => void; onCardClick: () => void;
}> = ({ item, displayName, isAvailable, isCompact, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => (
    <div
        onClick={onCardClick}
        className={`
            group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-100
            ${isAvailable
                ? `cursor-pointer active:scale-[0.98] ${quantity > 0
                    ? 'bg-primary/[0.06] border-primary/40 shadow-sm'
                    : 'bg-card border-border/30 hover:shadow-md hover:border-primary/20'
                }`
                : 'opacity-40 bg-card border-border/20 cursor-not-allowed'
            }
            ${highlighted ? 'ring-2 ring-amber-400' : ''}
        `}
    >
        {/* Image or color bar */}
        {item.image ? (
            <div className={`relative overflow-hidden ${isCompact ? 'h-20' : 'h-24'}`}>
                <img src={item.image} alt={displayName} loading="lazy" className="w-full h-full object-cover" />
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-red-500/80 px-2 py-0.5 rounded-md">{lang === 'ar' ? 'غير متوفر' : 'N/A'}</span>
                    </div>
                )}
            </div>
        ) : (
            <div className="h-1 bg-primary/20 shrink-0" />
        )}

        {/* Content */}
        <div className="flex flex-col flex-1 p-2.5 gap-1">
            {/* Name — READABLE size */}
            <h3 className="text-sm font-bold text-main leading-snug line-clamp-2">
                {displayName}
            </h3>

            {/* Price row */}
            <div className="mt-auto flex items-center justify-between pt-1">
                <span className="text-base font-black text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.price.toFixed(2)}
                    <span className="text-[10px] text-muted font-bold mr-0.5 ml-0.5">{currencySymbol}</span>
                </span>

                {/* Controls */}
                {isAvailable && quantity > 0 ? (
                    <div className="flex items-center gap-0.5 bg-elevated/60 rounded-full px-1 py-0.5">
                        <button onClick={onRemove} className="w-7 h-7 rounded-full bg-card text-muted flex items-center justify-center hover:text-red-500 transition-colors shadow-sm">
                            <Minus size={14} />
                        </button>
                        <span className="w-7 text-center text-sm font-black text-primary">{quantity}</span>
                        <button onClick={onAdd} className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                            <Plus size={14} />
                        </button>
                    </div>
                ) : isAvailable ? (
                    <button onClick={onAdd} className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                        <Plus size={16} />
                    </button>
                ) : null}
            </div>
        </div>

        {/* Qty badge */}
        {quantity > 0 && (
            <div className={`absolute top-1.5 ${lang === 'ar' ? 'left-1.5' : 'right-1.5'} min-w-[1.5rem] h-6 px-1 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shadow-md`}>
                {quantity}
            </div>
        )}

        {/* Popular */}
        {item.isPopular && isAvailable && (
            <div className={`absolute top-1.5 ${lang === 'ar' ? 'right-1.5' : 'left-1.5'}`}>
                <Star size={14} fill="currentColor" className="text-amber-400 drop-shadow" />
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
    onAdd: (e: React.MouseEvent) => void; onRemove: (e: React.MouseEvent) => void; onCardClick: () => void;
}> = ({ item, displayName, isAvailable, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => (
    <div
        onClick={onCardClick}
        className={`
            flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all duration-100
            ${isAvailable
                ? `cursor-pointer active:scale-[0.99] ${quantity > 0 ? 'bg-primary/[0.05] border-primary/25' : 'bg-card border-border/15 hover:border-primary/15'
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
        <span className="shrink-0 text-sm font-black text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {item.price.toFixed(2)} <span className="text-[9px] text-muted">{currencySymbol}</span>
        </span>
        {isAvailable && (
            <div className="flex items-center gap-0.5 shrink-0">
                {quantity > 0 && (
                    <>
                        <button onClick={onRemove} className="w-7 h-7 rounded-lg bg-elevated text-muted flex items-center justify-center hover:text-red-500">
                            <Minus size={13} />
                        </button>
                        <span className="w-5 text-center text-sm font-black text-primary">{quantity}</span>
                    </>
                )}
                <button onClick={onAdd} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${quantity > 0 ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
                    <Plus size={13} />
                </button>
            </div>
        )}
    </div>
);

// ═══════════════════════════════════════════════════════════════
// BUTTON — buttons mode, max density
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
            relative w-full text-left rounded-lg border transition-all duration-100 px-2.5 py-2
            ${isAvailable
                ? `cursor-pointer active:scale-[0.98] ${quantity > 0
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-card border-border/20 hover:border-primary/15'
                }`
                : 'opacity-30 bg-card border-border/10 cursor-not-allowed'
            }
            ${highlighted ? 'ring-1 ring-amber-400' : ''}
        `}
    >
        <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold truncate flex-1">{displayName}</span>
            <span className="text-xs font-black text-primary shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {item.price.toFixed(0)}
            </span>
        </div>
        {quantity > 0 && (
            <div className="flex items-center gap-1 mt-1">
                <button onClick={onRemove} className="w-6 h-6 rounded bg-card text-muted flex items-center justify-center hover:text-red-500">
                    <Minus size={10} />
                </button>
                <span className="text-xs font-black text-primary w-4 text-center">{quantity}</span>
                <button onClick={onAdd} className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center">
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

    const p = { item, displayName, isAvailable, quantity, currencySymbol, lang, highlighted, onAdd: handleAdd, onRemove: handleRemove, onCardClick: handleCardClick };

    switch (density) {
        case 'buttons': return <ButtonCard {...p} />;
        case 'ultra': return <ListCard {...p} />;
        case 'compact': return <ImageCard {...p} isCompact={true} />;
        default: return <ImageCard {...p} isCompact={false} />;
    }
});

export default MenuItemCard;
