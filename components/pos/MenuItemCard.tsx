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

const ImageCard: React.FC<{
    item: MenuItem; displayName: string; isAvailable: boolean; isCompact: boolean;
    quantity: number; currencySymbol: string; lang: string; highlighted: boolean;
    onAdd: () => void; onRemove: () => void; onCardClick: () => void;
}> = ({ item, displayName, isAvailable, isCompact, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => {
    return (
        <div
            onClick={(e) => {
                if (!isAvailable) return;
                // Only trigger add if clicking the empty card (not the +/- buttons)
                const target = e.target as HTMLElement;
                if (!target.closest('button')) {
                    onAdd();
                }
            }}
            className={`
                group relative flex flex-col overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 ease-out
                ${isAvailable
                    ? `cursor-pointer active:scale-[0.98] ${quantity > 0
                        ? 'border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                    }`
                    : 'opacity-50 cursor-not-allowed grayscale'
                }
                ${highlighted ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-app' : ''}
            `}
        >
            {/* Out of Stock Overlay */}
            {!isAvailable && (
                <div className="absolute inset-x-0 top-0 h-10 z-30 flex items-center justify-center bg-rose-500/90 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                    Sold Out
                </div>
            )}

            {/* Top section: Square Image + Name */}
            <div className={`p-4 pb-2 flex-grow flex flex-col`}>
                {item.image ? (
                    <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-slate-50 dark:bg-slate-800">
                        <img src={item.image} alt={displayName} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                ) : (
                    // Optional placeholder or empty space if no image
                    <div className="w-full h-2 mb-2" />
                )}

                <h3 className={`text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2`}>
                    {displayName}
                </h3>
            </div>

            {/* Price & Quantity Controls */}
            <div className={`p-4 pt-0 flex flex-col justify-end mt-auto`}>
                <div className="flex items-center justify-between mb-2">
                    {/* Price — THE HERO */}
                    <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-black text-indigo-600 dark:text-indigo-400`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {item.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currencySymbol}</span>
                    </div>

                    {/* Simple badge if popular */}
                    {item.isPopular && isAvailable && (
                        <div className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest">
                            Top
                        </div>
                    )}
                </div>

                {/* Inline +/- tap targets */}
                <div className={`h-10 mt-1 flex items-center rounded-xl overflow-hidden transition-all ${quantity > 0 ? 'bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30' : 'bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                    {quantity > 0 ? (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                className="h-full px-4 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
                            >
                                <Minus size={18} />
                            </button>
                            <div className="flex-1 text-center font-black text-base text-indigo-700 dark:text-indigo-300 tabular-nums">
                                {quantity}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                                className="h-full px-4 flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAdd(); }}
                            disabled={!isAvailable}
                            className={`w-full h-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${isAvailable
                                    ? 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800'
                                    : 'text-slate-400'
                                }`}
                        >
                            <Plus size={14} />
                            <span>Add</span>
                        </button>
                    )}
                </div>
            </div>
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
