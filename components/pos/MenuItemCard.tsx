import React, { useCallback } from 'react';
import { Plus, Minus, Ban, Sparkles } from 'lucide-react';
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
// VIEW 1: IMAGE CARD — card with image, name, price
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
            group relative flex flex-col overflow-hidden transition-all duration-150
            rounded-xl border
            ${isAvailable
                ? `cursor-pointer active:scale-[0.97] ${quantity > 0
                    ? 'bg-primary/[0.04] border-primary/40 shadow-sm shadow-primary/5'
                    : 'bg-card border-border/30 hover:shadow-md hover:border-primary/20'
                }`
                : 'opacity-40 grayscale-[0.5] bg-card border-border/20 cursor-not-allowed'
            }
            ${highlighted ? 'ring-2 ring-emerald-400' : ''}
        `}
    >
        {/* Image area — only show if item HAS an image */}
        {item.image ? (
            <div className={`relative overflow-hidden ${isCompact ? 'h-20' : 'h-24 sm:h-28'}`}>
                <img
                    src={item.image}
                    alt={displayName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {quantity > 0 && (
                    <div className={`absolute top-1 ${lang === 'ar' ? 'left-1' : 'right-1'} min-w-[1.5rem] h-6 px-1 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-md`}>
                        {quantity}
                    </div>
                )}
                {item.isPopular && isAvailable && (
                    <div className={`absolute top-1 ${lang === 'ar' ? 'right-1' : 'left-1'} px-1.5 py-0.5 bg-amber-400 text-black text-[7px] font-black rounded-full`}>
                        <Sparkles size={7} fill="currentColor" className="inline" /> {lang === 'ar' ? 'مميز' : 'HOT'}
                    </div>
                )}
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="px-2 py-0.5 bg-white/90 dark:bg-slate-800/90 rounded-lg text-red-500 text-[10px] font-bold flex items-center gap-1">
                            <Ban size={10} /> {lang === 'ar' ? 'غير متوفر' : 'N/A'}
                        </span>
                    </div>
                )}
            </div>
        ) : (
            /* No image: just a thin colored accent strip */
            <div className="h-1.5 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
        )}

        {/* Content */}
        <div className={`flex flex-col flex-1 ${isCompact ? 'px-2 py-1.5' : 'px-2.5 py-2'}`}>
            <div className="flex items-start justify-between gap-1">
                <h3 className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-bold text-main leading-tight line-clamp-2 flex-1`}>
                    {displayName}
                </h3>
                {/* Qty badge when no image */}
                {!item.image && quantity > 0 && (
                    <span className="shrink-0 min-w-[1.25rem] h-5 px-0.5 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center">
                        {quantity}
                    </span>
                )}
            </div>

            <div className="mt-auto flex items-center justify-between gap-1 pt-1">
                <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-black text-primary`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.price.toFixed(2)}
                    <span className="text-[7px] text-muted font-bold ml-0.5">{currencySymbol}</span>
                </span>

                {isAvailable && quantity > 0 && (
                    <div className="flex items-center gap-px bg-elevated/50 rounded-full p-0.5">
                        <button onClick={onRemove} className="w-6 h-6 rounded-full bg-card text-muted flex items-center justify-center hover:text-red-500 transition-colors">
                            <Minus size={11} strokeWidth={2.5} />
                        </button>
                        <span className="w-5 text-center text-[10px] font-black text-main">{quantity}</span>
                        <button onClick={onAdd} className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                            <Plus size={11} strokeWidth={2.5} />
                        </button>
                    </div>
                )}

                {isAvailable && quantity === 0 && (
                    <button onClick={onAdd} className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                        <Plus size={13} strokeWidth={2} />
                    </button>
                )}
            </div>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════════
// VIEW 2: LIST ROW — compact row with name + price + controls
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
            group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-100
            ${isAvailable
                ? `cursor-pointer active:scale-[0.99] ${quantity > 0
                    ? 'bg-primary/[0.04] border-primary/25'
                    : 'bg-card border-border/20 hover:border-primary/15'
                }`
                : 'opacity-40 bg-card border-border/10 cursor-not-allowed'
            }
            ${highlighted ? 'ring-1 ring-emerald-400' : ''}
        `}
    >
        {/* Tiny image if exists */}
        {item.image && (
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-elevated/30">
                <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
        )}

        {/* Name */}
        <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-bold text-main leading-tight truncate">{displayName}</h4>
        </div>

        {/* Price */}
        <span className="shrink-0 text-xs font-black text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {item.price.toFixed(2)}
            <span className="text-[7px] text-muted ml-0.5">{currencySymbol}</span>
        </span>

        {/* Controls */}
        {isAvailable && (
            <div className="flex items-center gap-0.5 shrink-0">
                {quantity > 0 && (
                    <>
                        <button onClick={onRemove} className="w-6 h-6 rounded-md bg-elevated text-muted flex items-center justify-center hover:text-red-500 transition-colors">
                            <Minus size={11} strokeWidth={2.5} />
                        </button>
                        <span className="w-4 text-center text-[10px] font-black text-primary">{quantity}</span>
                    </>
                )}
                <button onClick={onAdd} className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${quantity > 0 ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
                    <Plus size={11} strokeWidth={2.5} />
                </button>
            </div>
        )}
    </div>
);

// ═══════════════════════════════════════════════════════════════
// VIEW 3: BUTTON — ultra minimal, just a button. Max density.
// ═══════════════════════════════════════════════════════════════
const ButtonCard: React.FC<{
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
    <button
        onClick={onCardClick}
        disabled={!isAvailable}
        className={`
            group relative w-full text-left rounded-lg border transition-all duration-100
            ${isAvailable
                ? `cursor-pointer active:scale-[0.98] ${quantity > 0
                    ? 'bg-primary/10 border-primary/40 text-main'
                    : 'bg-card border-border/20 text-main hover:border-primary/20 hover:bg-elevated/30'
                }`
                : 'opacity-35 bg-card border-border/10 cursor-not-allowed text-muted'
            }
            ${highlighted ? 'ring-1 ring-emerald-400' : ''}
            px-2 py-1.5
        `}
    >
        <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold leading-tight truncate flex-1">{displayName}</span>
            <span className="text-[10px] font-black text-primary shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {item.price.toFixed(0)}
            </span>
        </div>
        {quantity > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
                <button onClick={onRemove} className="w-5 h-5 rounded bg-card text-muted flex items-center justify-center hover:text-red-500 text-[10px]">
                    <Minus size={9} />
                </button>
                <span className="text-[9px] font-black text-primary w-3 text-center">{quantity}</span>
                <button onClick={onAdd} className="w-5 h-5 rounded bg-primary text-white flex items-center justify-center text-[10px]">
                    <Plus size={9} />
                </button>
            </div>
        )}
    </button>
);

// ═══════════════════════════════════════════════════════════════
// MAIN — switches between views based on density
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

    const props = { item, displayName, isAvailable, quantity, currencySymbol, lang, highlighted, onAdd: handleAdd, onRemove: handleRemove, onCardClick: handleCardClick };

    switch (density) {
        case 'buttons':
            return <ButtonCard {...props} />;
        case 'ultra':
            return <ListCard {...props} />;
        case 'compact':
            return <ImageCard {...props} isCompact={true} />;
        default:
            return <ImageCard {...props} isCompact={false} />;
    }
});

export default MenuItemCard;
