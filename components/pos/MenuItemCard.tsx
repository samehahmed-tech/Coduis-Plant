import React, { useCallback } from 'react';
import { Plus, Minus } from 'lucide-react';
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

/* ─── Visual Card (comfortable & compact) ─── */
const ImageCard: React.FC<{
    item: MenuItem;
    displayName: string;
    isAvailable: boolean;
    isCompact: boolean;
    quantity: number;
    currencySymbol: string;
    lang: string;
    highlighted: boolean;
    onAdd: () => void;
    onRemove: () => void;
    onCardClick: () => void;
}> = ({ item, displayName, isAvailable, isCompact, quantity, currencySymbol, lang, highlighted, onAdd, onRemove, onCardClick }) => (
    <div
        onClick={(e) => {
            if (!isAvailable) return;
            const target = e.target as HTMLElement;
            if (!target.closest('button')) onCardClick();
        }}
        className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-150 will-change-transform
            ${isCompact ? 'min-h-[190px]' : 'min-h-[220px]'}
            ${isAvailable
                ? `cursor-pointer active:scale-[0.98] ${quantity > 0
                    ? 'border-primary/25 shadow-md shadow-primary/8 ring-1 ring-primary/10'
                    : 'border-border/15 hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-lg hover:shadow-black/[0.06]'
                    }`
                : 'cursor-not-allowed grayscale opacity-40'
            } ${highlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-app' : ''}`}
    >
        {/* Image */}
        {item.image && (
            <div className="relative mx-2 mt-2 overflow-hidden rounded-xl bg-elevated/50">
                <img
                    src={item.image} alt=""
                    className={`w-full object-cover transition-transform duration-200 group-hover:scale-[1.03] ${isCompact ? 'h-[78px]' : 'h-[95px]'}`}
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            </div>
        )}

        {/* Sold out */}
        {!isAvailable && (
            <div className="absolute inset-x-0 top-0 z-30 flex h-7 items-center justify-center bg-rose-500/90 text-[8px] font-bold uppercase tracking-wider text-white">
                {lang === 'ar' ? 'نفذ' : 'Sold Out'}
            </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
            <div className="flex items-start justify-between gap-1.5">
                <h3 className="line-clamp-2 text-[12px] lg:text-[13px] font-bold leading-snug text-main">{displayName}</h3>
                {quantity > 0 && (
                    <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary tabular-nums">{quantity}×</span>
                )}
            </div>

            {item.isPopular && isAvailable && (
                <span className="mt-1 inline-flex w-fit rounded-md bg-amber-500/8 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-600 border border-amber-500/10">
                    {lang === 'ar' ? 'مميز' : 'Popular'}
                </span>
            )}

            {/* Price & Add */}
            <div className="mt-auto pt-2.5">
                <div className="mb-2 flex items-end gap-0.5">
                    <span className="text-[1.4rem] leading-none font-black text-primary tabular-nums">{item.price.toFixed(2)}</span>
                    <span className="pb-0.5 text-[9px] font-bold uppercase tracking-wider text-muted/50">{currencySymbol}</span>
                </div>

                <div className={`flex h-11 items-center overflow-hidden rounded-xl border transition-all ${quantity > 0
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-border/15 bg-elevated/50 hover:bg-elevated/80'
                    }`}>
                    {quantity > 0 ? (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="flex h-full w-10 items-center justify-center text-primary hover:bg-primary/10 transition-colors active:scale-90">
                                <Minus size={14} />
                            </button>
                            <div className="flex-1 text-center text-sm font-black text-main tabular-nums">{quantity}</div>
                            <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="flex h-full w-10 items-center justify-center bg-primary text-white hover:bg-primary/90 transition-colors active:scale-90">
                                <Plus size={14} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAdd(); }}
                            disabled={!isAvailable}
                            className={`flex h-full w-full items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${isAvailable
                                ? 'text-muted hover:bg-primary/5 hover:text-primary'
                                : 'text-muted/30'
                                }`}
                        >
                            <Plus size={13} />
                            <span>{lang === 'ar' ? 'أضف' : 'Add'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
);

/* ─── List Row (ultra density) ─── */
const ListCard: React.FC<{
    item: MenuItem;
    displayName: string;
    isAvailable: boolean;
    quantity: number;
    currencySymbol: string;
    lang: string;
    highlighted: boolean;
    onAdd: () => void;
    onRemove: () => void;
    onCardClick: () => void;
}> = ({ item, displayName, isAvailable, quantity, highlighted, onAdd, onRemove, onCardClick }) => (
    <div
        onClick={() => { if (isAvailable) onCardClick(); }}
        className={`flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2 transition-all duration-100 will-change-transform
            ${isAvailable
                ? `cursor-pointer active:scale-[0.99] ${quantity > 0 ? 'border-primary/20 bg-primary/3 ring-1 ring-primary/8' : 'border-border/12 hover:border-primary/12 hover:shadow-sm'}`
                : 'cursor-not-allowed opacity-30'
            } ${highlighted ? 'ring-1 ring-primary/50' : ''}`}
    >
        {item.image && (
            <div className="h-9 w-9 overflow-hidden rounded-lg shrink-0">
                <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-main">{displayName}</span>
        <span className="shrink-0 text-sm font-extrabold text-primary tabular-nums">{item.price.toFixed(2)}</span>
        {quantity > 0 && (
            <div className="flex shrink-0 items-center gap-0.5">
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="flex h-7 w-7 items-center justify-center rounded-lg bg-elevated text-muted hover:bg-rose-500/10 hover:text-rose-500 transition-colors active:scale-90">
                    <Minus size={12} />
                </button>
                <span className="w-5 text-center text-xs font-extrabold text-primary tabular-nums">{quantity}</span>
                <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors active:scale-90">
                    <Plus size={12} />
                </button>
            </div>
        )}
    </div>
);

/* ─── Button Tile (maximum density) ─── */
const ButtonCard: React.FC<{
    item: MenuItem;
    displayName: string;
    isAvailable: boolean;
    quantity: number;
    highlighted: boolean;
    onCardClick: () => void;
}> = ({ item, displayName, isAvailable, quantity, highlighted, onCardClick }) => (
    <button
        onClick={() => { if (isAvailable) onCardClick(); }}
        disabled={!isAvailable}
        className={`relative w-full rounded-xl border bg-white px-2.5 py-2 text-left transition-all duration-100 will-change-transform
            ${isAvailable
                ? `cursor-pointer active:scale-[0.96] ${quantity > 0 ? 'border-primary/20 bg-primary/4 ring-1 ring-primary/8' : 'border-border/12 hover:border-primary/12 hover:shadow-sm'}`
                : 'cursor-not-allowed opacity-25'
            } ${highlighted ? 'ring-1 ring-primary/50' : ''}`}
    >
        <div className="flex items-center justify-between gap-1.5">
            <span className="flex-1 truncate text-xs font-bold text-main">{displayName}</span>
            <span className="shrink-0 text-xs font-extrabold text-primary tabular-nums">{item.price.toFixed(0)}</span>
            {quantity > 0 && (
                <span className="flex min-w-[16px] items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[8px] font-bold text-white">{quantity}</span>
            )}
        </div>
    </button>
);

/* ─── Main Component ─── */
const MenuItemCard: React.FC<MenuItemCardProps> = React.memo(({
    item, onAddItem, onRemoveItem, quantity = 0,
    currencySymbol, density = 'comfortable', lang, highlighted = false,
}) => {
    const displayName = (item as any).displayName || item.name;
    const isAvailable = (item as any).isActuallyAvailable !== false && item.isAvailable !== false;

    const handleAdd = useCallback(() => {
        if (isAvailable) onAddItem(item);
    }, [isAvailable, onAddItem, item]);

    const handleRemove = useCallback(() => {
        if (onRemoveItem) onRemoveItem(item.id);
    }, [onRemoveItem, item.id]);

    const shared = {
        item, displayName, isAvailable, quantity, currencySymbol, lang,
        highlighted, onAdd: handleAdd, onRemove: handleRemove, onCardClick: handleAdd,
    };

    switch (density) {
        case 'buttons':
            return <ButtonCard item={item} displayName={displayName} isAvailable={isAvailable} quantity={quantity} highlighted={highlighted} onCardClick={handleAdd} />;
        case 'ultra':
            return <ListCard {...shared} />;
        case 'compact':
            return <ImageCard {...shared} isCompact={true} />;
        default:
            return <ImageCard {...shared} isCompact={false} />;
    }
});

export default MenuItemCard;
