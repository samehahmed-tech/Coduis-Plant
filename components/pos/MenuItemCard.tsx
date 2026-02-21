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
    density?: 'comfortable' | 'compact' | 'ultra';
    lang: 'en' | 'ar';
    highlighted?: boolean;
}

// Generate a consistent color from item name for placeholder backgrounds
const nameToColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = [
        'from-blue-500/20 to-indigo-500/10',
        'from-emerald-500/20 to-teal-500/10',
        'from-rose-500/20 to-pink-500/10',
        'from-amber-500/20 to-orange-500/10',
        'from-violet-500/20 to-purple-500/10',
        'from-cyan-500/20 to-sky-500/10',
        'from-lime-500/20 to-green-500/10',
        'from-fuchsia-500/20 to-pink-500/10',
    ];
    return colors[Math.abs(hash) % colors.length];
};

// ═══════════════════════════════════════════════════════════════
// IMAGE CARD — beautiful card with image, name, price, controls
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
}> = ({ item, displayName, isAvailable, isCompact, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => {
    const hasImage = !!item.image;
    const placeholderGradient = nameToColor(displayName);

    return (
        <div
            onClick={onCardClick}
            className={`
                group relative flex flex-col overflow-hidden transition-all duration-200
                rounded-2xl border
                ${isAvailable
                    ? `cursor-pointer active:scale-[0.97] ${quantity > 0
                        ? 'bg-primary/[0.04] border-primary/40 shadow-md shadow-primary/8 ring-1 ring-primary/20'
                        : 'bg-card border-border/30 hover:shadow-lg hover:border-primary/25'
                    }`
                    : 'opacity-40 grayscale-[0.5] bg-card border-border/20 cursor-not-allowed'
                }
                ${highlighted ? 'ring-2 ring-emerald-400 border-emerald-300' : ''}
            `}
        >
            {/* Image / Placeholder */}
            <div className={`relative overflow-hidden ${isCompact ? 'h-[6.5rem]' : 'h-[8rem]'}`}>
                {hasImage ? (
                    <img
                        src={item.image}
                        alt={displayName}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${placeholderGradient} flex items-center justify-center relative`}>
                        <span className="text-5xl font-black text-primary/20 select-none group-hover:scale-110 transition-transform duration-300">
                            {displayName.charAt(0)}
                        </span>
                        {/* Decorative circles */}
                        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary/5" />
                        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-primary/[0.03]" />
                    </div>
                )}

                {/* Bottom gradient */}
                {hasImage && (
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />
                )}

                {/* Popular badge */}
                {item.isPopular && isAvailable && (
                    <div className={`absolute top-1.5 ${lang === 'ar' ? 'right-1.5' : 'left-1.5'}`}>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-black text-[8px] font-black rounded-full shadow-md shadow-amber-500/20">
                            <Sparkles size={8} fill="currentColor" />
                            {lang === 'ar' ? 'مميز' : 'HOT'}
                        </div>
                    </div>
                )}

                {/* Quantity badge (top-right / top-left for RTL) */}
                {quantity > 0 && (
                    <div className={`absolute top-1.5 ${lang === 'ar' ? 'left-1.5' : 'right-1.5'}`}>
                        <div className="min-w-[1.75rem] h-7 px-1 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shadow-lg shadow-primary/30 ring-2 ring-white/20">
                            {quantity}
                        </div>
                    </div>
                )}

                {/* Quick add button on hover (for items not in cart) */}
                {isAvailable && quantity === 0 && (
                    <div className={`absolute bottom-1.5 ${lang === 'ar' ? 'left-1.5' : 'right-1.5'} opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150`}>
                        <button
                            onClick={onAdd}
                            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/25 hover:scale-110 active:scale-95 transition-transform"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                )}

                {/* Unavailable overlay */}
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 rounded-xl text-red-500 text-xs font-bold shadow-lg">
                            <Ban size={14} />
                            {lang === 'ar' ? 'غير متوفر' : 'N/A'}
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={`flex flex-col flex-1 ${isCompact ? 'px-2.5 py-2 gap-0.5' : 'px-3 py-2.5 gap-1'}`}>
                <h3 className={`${isCompact ? 'text-[11px]' : 'text-xs sm:text-[13px]'} font-bold text-main leading-snug line-clamp-2`}>
                    {displayName}
                </h3>

                <div className="mt-auto flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-baseline gap-0.5">
                        <span className={`${isCompact ? 'text-[13px]' : 'text-sm'} font-black text-primary`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {item.price.toFixed(2)}
                        </span>
                        <span className="text-[8px] text-muted font-bold">{currencySymbol}</span>
                    </div>

                    {/* Quantity stepper (only when qty > 0) */}
                    {isAvailable && quantity > 0 && (
                        <div className="flex items-center bg-elevated/60 rounded-full p-[3px] gap-px">
                            <button
                                onClick={onRemove}
                                className="w-[1.4rem] h-[1.4rem] rounded-full bg-card text-muted flex items-center justify-center hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                            >
                                <Minus size={10} strokeWidth={3} />
                            </button>
                            <span className="w-5 text-center text-[10px] font-black text-main select-none">{quantity}</span>
                            <button
                                onClick={onAdd}
                                className="w-[1.4rem] h-[1.4rem] rounded-full bg-primary text-white flex items-center justify-center hover:brightness-110 transition-all shadow-sm"
                            >
                                <Plus size={10} strokeWidth={3} />
                            </button>
                        </div>
                    )}

                    {/* Simple + button when qty is 0 (for touch devices, always visible) */}
                    {isAvailable && quantity === 0 && (
                        <button
                            onClick={onAdd}
                            className="w-7 h-7 rounded-full bg-primary/8 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all md:opacity-0 md:group-hover:opacity-100"
                        >
                            <Plus size={14} strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// LIST CARD — ultra-compact row: name + price + controls
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
}> = ({ item, displayName, isAvailable, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => {
    const placeholderGradient = nameToColor(displayName);

    return (
        <div
            onClick={onCardClick}
            className={`
                group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all duration-150
                ${isAvailable
                    ? `cursor-pointer active:scale-[0.99] ${quantity > 0
                        ? 'bg-primary/[0.04] border-primary/30'
                        : 'bg-card border-border/20 hover:border-primary/20 hover:bg-elevated/20'
                    }`
                    : 'opacity-40 bg-card border-border/10 cursor-not-allowed'
                }
                ${highlighted ? 'ring-1 ring-emerald-400' : ''}
            `}
        >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${!item.image ? `bg-gradient-to-br ${placeholderGradient}` : 'bg-elevated/30'}`}>
                {item.image ? (
                    <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <span className="text-base font-black text-primary/30 select-none">{displayName.charAt(0)}</span>
                )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-main leading-tight truncate">{displayName}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {item.isPopular && (
                        <span className="text-[7px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-0.5">
                            <Sparkles size={7} fill="currentColor" /> {lang === 'ar' ? 'مميز' : 'HOT'}
                        </span>
                    )}
                    {!isAvailable && (
                        <span className="text-[7px] font-black text-red-500 uppercase">{lang === 'ar' ? 'غير متاح' : 'N/A'}</span>
                    )}
                </div>
            </div>

            {/* Price */}
            <div className="shrink-0 text-right px-1">
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
                            <span className="w-5 text-center text-xs font-black text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>{quantity}</span>
                        </>
                    )}
                    <button
                        onClick={onAdd}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${quantity > 0
                                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                            }`}
                    >
                        <Plus size={13} strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// MAIN — switches between Image Card and List Card
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

    if (isUltra) {
        return (
            <ListCard
                item={item} displayName={displayName} isAvailable={isAvailable}
                quantity={quantity} currencySymbol={currencySymbol} lang={lang}
                highlighted={highlighted} onAdd={handleAdd} onRemove={handleRemove}
                onCardClick={handleCardClick}
            />
        );
    }

    return (
        <ImageCard
            item={item} displayName={displayName} isAvailable={isAvailable}
            isCompact={isCompact} quantity={quantity} currencySymbol={currencySymbol}
            lang={lang} highlighted={highlighted} onAdd={handleAdd}
            onRemove={handleRemove} onCardClick={handleCardClick}
        />
    );
});

export default MenuItemCard;
