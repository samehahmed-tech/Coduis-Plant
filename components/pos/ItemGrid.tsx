import React, { useMemo } from 'react';
import { Ban } from 'lucide-react';
import { MenuItem } from '../../types';
import MenuItemCard from './MenuItemCard';
import VirtualGrid from '../common/VirtualGrid';

interface ItemGridProps {
    items: MenuItem[];
    onAddItem: (item: MenuItem) => void;
    onRemoveItem?: (itemId: string) => void;
    cartItems?: any[];
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

    // Tighter dimensions for better space usage
    const columnWidth = isUltra
        ? (isTouchMode ? 160 : 144)
        : isCompact
            ? (isTouchMode ? 185 : 170)
            : (isTouchMode ? 210 : 190);

    const rowHeight = isUltra
        ? (isTouchMode ? 180 : 168)
        : isCompact
            ? (isTouchMode ? 210 : 195)
            : (isTouchMode ? 250 : 230);

    const gap = isUltra ? 6 : (isCompact ? 8 : 10);

    const quantityByItemId = useMemo(() => {
        const map: Record<string, number> = {};
        for (const cartItem of cartItems) {
            map[cartItem.id] = (map[cartItem.id] || 0) + (cartItem.quantity || 0);
        }
        return map;
    }, [cartItems]);

    if (items.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-muted opacity-40 flex-col gap-3">
                <Ban size={40} />
                <p className="font-bold text-sm uppercase tracking-widest text-center">
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
            className="h-full custom-scrollbar"
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
