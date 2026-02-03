import React from 'react';
import { MenuItem } from '../../types';

interface MenuItemCardProps {
    item: MenuItem;
    onAddItem: (item: MenuItem) => void;
    currencySymbol: string;
    isTouchMode: boolean;
}

const MenuItemCard: React.FC<MenuItemCardProps> = React.memo(({
    item,
    onAddItem,
    currencySymbol,
    isTouchMode,
}) => {
    // Default high-end food image if none provided
    const defaultImage = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800";

    return (
        <div
            onClick={() => onAddItem(item)}
            className="group relative flex flex-row bg-card dark:bg-card border border-border/50 hover:shadow-xl hover:border-primary/40 active:ring-4 active:ring-primary/20 active:border-primary"
        >
            {/* Image Section */}
            <div className="w-[38%] md:w-[40%] relative overflow-hidden shrink-0">
                <img
                    src={item.image || defaultImage}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent dark:from-black/20" />
                {item.isPopular && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-amber-400 text-[8px] font-black rounded-lg shadow-sm">
                        HOT
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-4 md:p-5 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                    <span className="text-[9px] font-bold text-primary/80 uppercase tracking-widest">
                        {item.categoryAr || item.category || 'Main'}
                    </span>
                    <h3 className={`${isTouchMode ? 'text-base md:text-lg' : 'text-sm md:text-base'} font-black text-main dark:text-main leading-tight line-clamp-2`}>
                        {item.name}
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-muted dark:text-muted/80 font-medium leading-snug line-clamp-2 mt-1">
                        {item.description || "Freshly made with premium ingredients and our signature seasoning."}
                    </p>
                </div>

                <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter mb-0.5">Price</p>
                        <div className="flex items-baseline">
                            <span className="text-xl md:text-2xl font-black text-main dark:text-main tracking-tight">
                                {item.price.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Visual hint on hover */}
                    <div className="w-8 h-1 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </div>
    );
});

export default MenuItemCard;
