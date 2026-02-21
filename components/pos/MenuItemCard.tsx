import React, { useCallback } from 'react';
import { Plus, Minus, Ban, Sparkles, ShoppingBag } from 'lucide-react';
import { MenuItem } from '../../types';

interface MenuItemCardProps {
    item: MenuItem;
    onAddItem: (item: MenuItem) => void;
    onRemoveItem?: (itemId: string) => void;
    quantity?: number;
    currencySymbol: string;
    isTouchMode: boolean;
    density?: 'comfortable' | 'compact' | 'ultra';
    lang: 'en' | 'ar';
    highlighted?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// IMAGE CARD — beautiful card with image, name, price, controls
// Used in 'comfortable' and 'compact' density modes
// ═══════════════════════════════════════════════════════════════
const ImageCard: React.FC<{
    item: MenuItem;
    displayName: string;
    isAvailable: boolean;
    isCompact: boolean;
    quantity: number;
    currencySymbol: string;
    lang: 'en' | 'ar';
    highlighted: boolean;
    onAdd: (e: React.MouseEvent) => void;
    onRemove: (e: React.MouseEvent) => void;
    onCardClick: () => void;
}> = ({ item, displayName, isAvailable, isCompact, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => (
    <div
        onClick={onCardClick}
        className={`
            group relative flex flex-col bg-card overflow-hidden transition-all duration-200
            rounded-2xl border
            ${isAvailable
                ? 'border-border/30 hover:shadow-xl hover:border-primary/30 cursor-pointer active:scale-[0.97]'
                : 'opacity-45 grayscale-[0.5] border-border/20 cursor-not-allowed'
            }
            ${quantity > 0 ? 'ring-2 ring-primary/50 border-primary/20 shadow-md shadow-primary/5' : ''}
            ${highlighted ? 'ring-2 ring-emerald-400 border-emerald-300 animate-pulse' : ''}
        `}
    >
        {/* Image with gradient overlay */}
        <div className={`relative overflow-hidden ${isCompact ? 'h-24 sm:h-28' : 'h-32 sm:h-36'}`}>
            {item.image ? (
                <img
                    src={item.image}
                    alt={displayName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/5 via-elevated/60 to-primary/10 flex items-center justify-center">
                    <span className="text-4xl font-black text-primary/20">{displayName.charAt(0)}</span>
                </div>
            )}

            {/* Bottom gradient fade */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Popular badge */}
            {item.isPopular && isAvailable && (
                <div className={`absolute top-2 ${lang === 'ar' ? 'right-2' : 'left-2'}`}>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-black text-[8px] font-black rounded-full shadow-md shadow-amber-400/30">
                        <Sparkles size={8} fill="currentColor" />
                        {lang === 'ar' ? 'مميز' : 'HOT'}
                    </div>
                </div>
            )}

            {/* Quantity indicator */}
            {quantity > 0 && (
                <div className={`absolute top-2 ${lang === 'ar' ? 'left-2' : 'right-2'}`}>
                    <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shadow-lg shadow-primary/30 ring-2 ring-white/30">
                        {quantity}
                    </div>
                </div>
            )}

            {/* Quick add on hover (shown on bottom-right of image) */}
            {isAvailable && quantity === 0 && (
                <div className={`absolute bottom-2 ${lang === 'ar' ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200`}>
                    <button
                        onClick={onAdd}
                        className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 transition-transform"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                    </button>
                </div>
            )}

            {/* Unavailable overlay */}
            {!isAvailable && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 rounded-xl text-red-500 text-xs font-bold shadow-lg">
                        <Ban size={14} />
                        {lang === 'ar' ? 'غير متوفر' : 'Unavailable'}
                    </div>
                </div>
            )}
        </div>

        {/* Content */}
        <div className={`flex flex-col flex-1 ${isCompact ? 'p-2 gap-0.5' : 'p-3 gap-1'}`}>
            <h3 className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold text-main leading-tight line-clamp-2`}>
                {displayName}
            </h3>

            <div className="mt-auto flex items-center justify-between gap-1 pt-0.5">
                <div className="flex items-baseline gap-0.5">
                    <span className={`${isCompact ? 'text-sm' : 'text-base'} font-black text-primary`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {item.price.toFixed(2)}
                    </span>
                    <span className="text-[8px] text-muted font-bold">{currencySymbol}</span>
                </div>

                {/* Inline quantity controls (only when qty > 0) */}
                {isAvailable && quantity > 0 && (
                    <div className="flex items-center gap-0.5 bg-elevated/60 rounded-full p-0.5">
                        <button
                            onClick={onRemove}
                            className="w-6 h-6 rounded-full bg-card text-muted flex items-center justify-center hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                        >
                            <Minus size={11} strokeWidth={2.5} />
                        </button>
                        <span className="w-5 text-center text-[11px] font-black text-main">{quantity}</span>
                        <button
                            onClick={onAdd}
                            className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/80 transition-colors shadow-sm"
                        >
                            <Plus size={11} strokeWidth={2.5} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════════
// LIST CARD — ultra-compact row view: just name + price + controls
// Used in 'ultra' density mode — fits many more items on screen
// ═══════════════════════════════════════════════════════════════
const ListCard: React.FC<{
    item: MenuItem;
    displayName: string;
    isAvailable: boolean;
    quantity: number;
    currencySymbol: string;
    lang: 'en' | 'ar';
    highlighted: boolean;
    onAdd: (e: React.MouseEvent) => void;
    onRemove: (e: React.MouseEvent) => void;
    onCardClick: () => void;
}> = ({ item, displayName, isAvailable, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => (
    <div
        onClick={onCardClick}
        className={`
            group flex items-center gap-2 px-3 py-2 bg-card rounded-xl border transition-all duration-150
            ${isAvailable
                ? 'border-border/20 hover:border-primary/30 hover:bg-elevated/30 cursor-pointer active:scale-[0.98]'
                : 'opacity-45 border-border/10 cursor-not-allowed'
            }
            ${quantity > 0 ? 'border-primary/30 bg-primary/[0.03]' : ''}
            ${highlighted ? 'ring-1 ring-emerald-400' : ''}
        `}
    >
        {/* Small avatar / image thumbnail */}
        <div className="w-9 h-9 rounded-lg bg-elevated/50 overflow-hidden shrink-0 flex items-center justify-center">
            {item.image ? (
                <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
                <span className="text-sm font-black text-primary/30">{displayName.charAt(0)}</span>
            )}
        </div>

        {/* Name + category */}
        <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-main leading-tight truncate">{displayName}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
                {item.isPopular && (
                    <span className="text-[7px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-0.5">
                        <Sparkles size={7} fill="currentColor" />
                        {lang === 'ar' ? 'مميز' : 'HOT'}
                    </span>
                )}
                {!isAvailable && (
                    <span className="text-[7px] font-black text-red-500 uppercase tracking-wider">
                        {lang === 'ar' ? 'غير متاح' : 'N/A'}
                    </span>
                )}
            </div>
        </div>

        {/* Price */}
        <div className="shrink-0 text-right">
            <span className="text-sm font-black text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {item.price.toFixed(2)}
            </span>
            <span className="text-[7px] text-muted font-bold ml-0.5">{currencySymbol}</span>
        </div>

        {/* Controls */}
        {isAvailable && (
            <div className="flex items-center gap-0.5 shrink-0">
                {quantity > 0 && (
                    <>
                        <button
                            onClick={onRemove}
                            className="w-7 h-7 rounded-lg bg-elevated text-muted flex items-center justify-center hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors"
                        >
                            <Minus size={12} strokeWidth={2.5} />
                        </button>
                        <span className="w-5 text-center text-xs font-black text-primary">{quantity}</span>
                    </>
                )}
                <button
                    onClick={onAdd}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${quantity > 0
                            ? 'bg-primary text-white shadow-sm shadow-primary/20'
                            : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                        }`}
                >
                    <Plus size={12} strokeWidth={2.5} />
                </button>
            </div>
        )}

        {/* Quantity badge on list row */}
        {quantity > 0 && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-white text-[8px] font-black flex items-center justify-center shadow-sm ring-2 ring-card hidden">
                {quantity}
            </div>
        )}
    </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT — switches between Image Card and List Card
// ═══════════════════════════════════════════════════════════════
const MenuItemCard: React.FC<MenuItemCardProps> = React.memo(({
    item,
    onAddItem,
    onRemoveItem,
    quantity = 0,
    currencySymbol,
    isTouchMode,
    density = 'comfortable',
    lang,
    highlighted = false,
}) => {
    const displayName = (item as any).displayName || item.name;
    const isAvailable = (item as any).isActuallyAvailable !== false && item.isAvailable !== false;
    const isCompact = density === 'compact';
    const isUltra = density === 'ultra';

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

    // Ultra density = List view (no image, compact row)
    if (isUltra) {
        return (
            <ListCard
                item={item}
                displayName={displayName}
                isAvailable={isAvailable}
                quantity={quantity}
                currencySymbol={currencySymbol}
                lang={lang}
                highlighted={highlighted}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onCardClick={handleCardClick}
            />
        );
    }

    // Comfortable / Compact = Image card
    return (
        <ImageCard
            item={item}
            displayName={displayName}
            isAvailable={isAvailable}
            isCompact={isCompact}
            quantity={quantity}
            currencySymbol={currencySymbol}
            lang={lang}
            highlighted={highlighted}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onCardClick={handleCardClick}
        />
    );
});

export default MenuItemCard;
