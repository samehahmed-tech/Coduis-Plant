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

    // Grid dimensions for image cards
    const columnWidth = isCompact
        ? (isTouchMode ? 185 : 170)
        : (isTouchMode ? 210 : 190);

    const rowHeight = isCompact
        ? (isTouchMode ? 215 : 200)
        : (isTouchMode ? 260 : 240);

    const gap = isCompact ? 8 : 10;

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

    // Ultra mode: simple scrollable list (no grid, no virtualization needed for rows)
    if (isUltra) {
        return (
            <div className="h-full overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 p-0.5">
                    {items.map(item => (
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
                    ))}
                </div>
            </div>
        );
    }

    // Image card modes: virtualized grid
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
