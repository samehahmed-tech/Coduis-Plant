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

    const renderCard = (item: MenuItem) => (
        <MenuItemCard
            key={item.id}
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
    );

    // Grid class based on density — all use CSS grid now (simpler, more responsive)
    const gridClass = (() => {
        switch (density) {
            case 'buttons':
                return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1';
            case 'ultra':
                return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1';
            case 'compact':
                return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-1.5';
            default: // comfortable
                return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2';
        }
    })();

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className={gridClass}>
                {items.map(renderCard)}
            </div>
        </div>
    );
});

export default ItemGrid;
