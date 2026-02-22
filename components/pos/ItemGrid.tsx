import React, { useMemo } from 'react';
import { Ban } from 'lucide-react';
import { MenuItem } from '../../types';
import MenuItemCard from './MenuItemCard';

interface ItemGridProps {
    items: MenuItem[];
    onAddItem: (item: MenuItem) => void;
    onRemoveItem?: (itemId: string) => void;
    cartItems?: any[];
    currencySymbol: string;
    isTouchMode: boolean;
    density?: 'comfortable' | 'compact' | 'ultra' | 'buttons';
    lang?: 'en' | 'ar';
    highlightedItemId?: string | null;
}

const ItemGrid: React.FC<ItemGridProps> = React.memo(({
    items, onAddItem, onRemoveItem, cartItems = [],
    currencySymbol, isTouchMode,
    density = 'comfortable', lang = 'en', highlightedItemId = null,
}) => {
    const quantityByItemId = useMemo(() => {
        const map: Record<string, number> = {};
        for (const ci of cartItems) {
            map[ci.id] = (map[ci.id] || 0) + (ci.quantity || 0);
        }
        return map;
    }, [cartItems]);

    // Identify popular items for dynamic sizing (top 5 popular or most ordered)
    const popularIds = useMemo(() => {
        const popular = new Set<string>();
        items.forEach(item => {
            if (item.isPopular) popular.add(item.id);
        });
        return popular;
    }, [items]);

    if (items.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-muted opacity-40 flex-col gap-2">
                <Ban size={32} />
                <p className="font-bold text-xs uppercase tracking-widest">
                    {lang === 'ar' ? 'لا يوجد أصناف' : 'No items found'}
                </p>
            </div>
        );
    }

    const renderCard = (item: MenuItem, isLarge?: boolean) => (
        <div
            key={item.id}
            className={isLarge ? 'col-span-2 row-span-2' : ''}
        >
            <MenuItemCard
                item={item}
                onAddItem={onAddItem}
                onRemoveItem={onRemoveItem}
                quantity={quantityByItemId[item.id] || 0}
                currencySymbol={currencySymbol}
                isTouchMode={isTouchMode}
                density={density}
                lang={lang}
                highlighted={highlightedItemId === item.id}
            />
        </div>
    );

    // Grid config by density
    const gridClass = (() => {
        switch (density) {
            case 'buttons':
                return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1 p-1';
            case 'ultra':
                return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 p-1';
            case 'compact':
                return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 p-1';
            default: // comfortable — popular items get double size
                return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 p-1 auto-rows-fr';
        }
    })();

    // In comfortable mode, first few popular items get double-size cards
    const useDoubleSize = density === 'comfortable' && popularIds.size > 0 && items.length > 6;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className={gridClass}>
                {items.map((item, i) => {
                    const isLarge = useDoubleSize && popularIds.has(item.id) && i < 8;
                    return renderCard(item, isLarge);
                })}
            </div>
        </div>
    );
});

export default ItemGrid;
