import React from 'react';
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
    const isCompact = density === 'compact' || density === 'ultra';
    const isUltra = density === 'ultra';

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAvailable) onAddItem(item);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemoveItem) onRemoveItem(item.id);
    };

    return (
        <div
            onClick={() => isAvailable && onAddItem(item)}
            className={`
                group relative flex flex-col bg-card border rounded-xl overflow-hidden transition-all duration-200
                ${isAvailable
                    ? 'border-border/40 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]'
                    : 'opacity-50 grayscale-[0.4] border-border/30 cursor-not-allowed'
                }
                ${quantity > 0 ? 'ring-2 ring-primary/60 border-primary/20' : ''}
                ${highlighted ? 'ring-2 ring-emerald-400 border-emerald-300' : ''}
            `}
        >
            {/* Image */}
            <div className={`relative overflow-hidden bg-elevated/30 ${isUltra ? 'h-20 sm:h-24' : isCompact ? 'h-24 sm:h-28' : 'h-28 sm:h-36'}`}>
                {item.image ? (
                    <img
                        src={item.image}
                        alt={displayName}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted/30">
                        <span className="text-3xl">{displayName.charAt(0)}</span>
                    </div>
                )}

                {/* Popular badge */}
                {item.isPopular && isAvailable && (
                    <div className={`absolute top-1.5 ${lang === 'ar' ? 'right-1.5' : 'left-1.5'} flex items-center gap-1 px-1.5 py-0.5 bg-amber-400 text-black text-[8px] font-black rounded-full`}>
                        <Sparkles size={8} fill="currentColor" />
                        {isCompact ? '★' : (lang === 'ar' ? 'مميز' : 'HOT')}
                    </div>
                )}

                {/* Quantity badge */}
                {quantity > 0 && (
                    <div className={`absolute top-1.5 ${lang === 'ar' ? 'left-1.5' : 'right-1.5'} w-6 h-6 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-sm`}>
                        {quantity}
                    </div>
                )}

                {/* Unavailable overlay */}
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-slate-800/90 rounded-lg text-red-500 text-[10px] font-bold">
                            <Ban size={12} />
                            {lang === 'ar' ? 'غير متوفر' : 'N/A'}
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={`flex flex-col flex-1 ${isUltra ? 'p-1.5 gap-0.5' : isCompact ? 'p-2 gap-1' : 'p-2.5 gap-1.5'}`}>
                <h3 className={`${isUltra ? 'text-[10px]' : isCompact ? 'text-xs' : 'text-xs sm:text-sm'} font-bold text-main leading-tight line-clamp-2`}>
                    {displayName}
                </h3>

                <div className="mt-auto flex items-center justify-between gap-1">
                    <span className={`${isUltra ? 'text-sm' : isCompact ? 'text-sm' : 'text-base'} font-black text-primary`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {item.price.toFixed(2)}
                        <span className="text-[8px] ml-0.5 text-muted font-bold">{currencySymbol}</span>
                    </span>

                    {/* Add/Remove controls */}
                    {isAvailable && (
                        <div className="flex items-center gap-0.5">
                            {quantity > 0 && (
                                <button
                                    onClick={handleRemove}
                                    className="w-6 h-6 rounded-lg bg-elevated text-muted flex items-center justify-center hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    <Minus size={12} strokeWidth={2.5} />
                                </button>
                            )}
                            <button
                                onClick={handleAdd}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${quantity > 0
                                        ? 'bg-primary text-white'
                                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                                    }`}
                            >
                                <Plus size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default MenuItemCard;
