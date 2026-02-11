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
    // Default high-end food image if none provided
    const defaultImage = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800";

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
                group relative flex flex-col bg-white dark:bg-slate-900 border-2 rounded-[2rem] overflow-hidden transition-all duration-300
                ${isAvailable
                    ? 'border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:border-primary/40 hover:-translate-y-1'
                    : 'opacity-60 grayscale-[0.5] border-slate-200 dark:border-slate-800'
                }
                ${quantity > 0 ? 'ring-2 ring-primary border-primary/20' : ''}
                ${highlighted ? 'ring-2 ring-emerald-400 border-emerald-300 animate-pulse' : ''}
            `}
        >
            {/* Image & Status Badge */}
            <div className={`relative overflow-hidden ${isUltra ? 'h-24 md:h-28' : isCompact ? 'h-28 md:h-32' : 'h-40 md:h-48'}`}>
                <img
                    src={item.image || defaultImage}
                    alt={displayName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Popular Badge */}
                {item.isPopular && isAvailable && (
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-black text-[10px] font-black rounded-full shadow-lg animate-bounce">
                        <Sparkles size={12} fill="currentColor" />
                        {lang === 'ar' ? 'الأكثر طلبًا' : 'POPULAR'}
                    </div>
                )}

                {/* Availability Badge */}
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                        <div className={`flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-800/90 rounded-2xl text-red-500 font-bold shadow-xl ${isCompact ? 'text-xs' : 'text-sm'}`}>
                            <Ban size={18} />
                            {lang === 'ar' ? 'غير متوفر' : 'Unavailable'}
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className={`${isUltra ? 'p-2.5 md:p-3 gap-2' : isCompact ? 'p-3 md:p-4 gap-2.5' : 'p-4 md:p-6 gap-4'} flex flex-col flex-1`}>
                <div className="space-y-1">
                    <h3 className={`${isUltra ? 'text-xs md:text-sm' : isCompact ? 'text-sm md:text-base' : 'text-base md:text-lg'} font-black text-slate-800 dark:text-white leading-tight line-clamp-2`}>
                        {displayName}
                    </h3>
                    <p className={`${isUltra ? 'text-[8px] md:text-[9px]' : isCompact ? 'text-[9px] md:text-[10px]' : 'text-[10px] md:text-xs'} text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider`}>
                        {(item as any).displayCategory || item.category || 'Main'}
                    </p>
                </div>

                <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className={`${isUltra ? 'text-base md:text-lg' : isCompact ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'} font-black text-primary tracking-tight`}>
                            {item.price.toFixed(2)}
                            <span className="text-[10px] md:text-xs ml-1 text-slate-400">{currencySymbol}</span>
                        </span>
                    </div>

                    {/* Quantity Controls */}
                    {isAvailable && (
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1">
                            {quantity > 0 && (
                                <>
                                    <button
                                        onClick={handleRemove}
                                        className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-white flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
                                    >
                                        <Minus size={16} strokeWidth={3} />
                                    </button>
                                    <span className="w-6 text-center text-sm font-black text-slate-800 dark:text-white">
                                        {quantity}
                                    </span>
                                </>
                            )}
                            <button
                                onClick={handleAdd}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm ${quantity > 0 ? 'bg-primary text-white hover:bg-primary/90' : 'bg-primary text-white hover:scale-105'}`}
                            >
                                <Plus size={16} strokeWidth={3} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default MenuItemCard;
