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
    density?: 'comfortable' | 'compact' | 'ultra' | 'buttons';
    lang?: 'en' | 'ar';
    highlightedItemId?: string | null;
}

const ItemGrid: React.FC<ItemGridProps> = React.memo(({
    items, onAddItem, onRemoveItem, cartItems = [],
    currencySymbol, isTouchMode,
    density = 'comfortable', lang = 'en', highlightedItemId = null,
}) => {
    const isUltra = density === 'ultra';
    const isButtons = density === 'buttons';
    const isCompact = density === 'compact';

    const columnWidth = isCompact ? (isTouchMode ? 170 : 155) : (isTouchMode ? 200 : 180);
    const rowHeight = isCompact ? (isTouchMode ? 175 : 160) : (isTouchMode ? 230 : 210);
    const gap = isCompact ? 6 : 8;

    const quantityByItemId = useMemo(() => {
        const map: Record<string, number> = {};
        for (const cartItem of cartItems) {
            map[cartItem.id] = (map[cartItem.id] || 0) + (cartItem.quantity || 0);
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

    // BUTTONS mode: tiny button grid, max items per screen
    if (isButtons) {
        return (
            <div className="h-full overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 p-0.5">
                    {items.map(renderCard)}
                </div>
            </div>
        );
    }

    // ULTRA mode: list rows, responsive columns
    if (isUltra) {
        return (
            <div className="h-full overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 p-0.5">
                    {items.map(renderCard)}
                </div>
            </div>
        );
    }

    // IMAGE modes: virtualized grid for performance
    return (
        <VirtualGrid
            itemCount={items.length}
            columnWidth={columnWidth}
            rowHeight={rowHeight}
            gap={gap}
            className="h-full custom-scrollbar"
            renderItem={(index) => renderCard(items[index])}
            getKey={(index) => items[index]?.id || index}
        />
    );
});

export default ItemGrid;
