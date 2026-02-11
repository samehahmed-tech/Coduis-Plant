import React, { useMemo } from 'react';
import { Ban } from 'lucide-react';
import { MenuItem } from '../../types';
import MenuItemCard from './MenuItemCard';
import VirtualGrid from '../common/VirtualGrid';

interface ItemGridProps {
    items: MenuItem[];
    onAddItem: (item: MenuItem) => void;
    onRemoveItem?: (itemId: string) => void;
    cartItems?: any[]; // To track quantities
    currencySymbol: string;
    isTouchMode: boolean;
    density?: 'comfortable' | 'compact' | 'ultra';
    lang?: 'en' | 'ar';
    highlightedItemId?: string | null;
}

const ItemGrid: React.FC<ItemGridProps> = React.memo(({
    items,
    onAddItem,
    onRemoveItem,
    cartItems = [],
    currencySymbol,
    isTouchMode,
    density = 'comfortable',
    lang = 'en',
    highlightedItemId = null,
}) => {
    const isUltra = density === 'ultra';
    const isCompact = density === 'compact';
    const columnWidth = isUltra
        ? (isTouchMode ? 210 : 188)
        : isCompact
            ? (isTouchMode ? 236 : 216)
            : (isTouchMode ? 280 : 250);
    const rowHeight = isUltra
        ? (isTouchMode ? 232 : 218)
        : isCompact
            ? (isTouchMode ? 270 : 252)
            : (isTouchMode ? 320 : 300);
    const gap = isUltra ? 10 : (isCompact ? (isTouchMode ? 14 : 12) : (isTouchMode ? 24 : 16));

    const quantityByItemId = useMemo(() => {
        const map: Record<string, number> = {};
        for (const cartItem of cartItems) {
            map[cartItem.id] = (map[cartItem.id] || 0) + (cartItem.quantity || 0);
        }
        return map;
    }, [cartItems]);

    if (items.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400 opacity-50 flex-col gap-4">
                <Ban size={48} />
                <p className="font-bold text-lg uppercase tracking-widest text-center">
                    {lang === 'ar' ? 'لا يوجد أصناف مطابقة' : 'No items found'}
                </p>
            </div>
        );
    }

    return (
        <VirtualGrid
            itemCount={items.length}
            columnWidth={columnWidth}
            rowHeight={rowHeight}
            gap={gap}
            className="h-full pr-2 custom-scrollbar"
            renderItem={(index) => {
                const item = items[index];
                return (
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
                );
            }}
            getKey={(index) => items[index]?.id || index}
        />
    );
});

export default ItemGrid;
