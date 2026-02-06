import React from 'react';
import { MenuItem } from '../../types';
import MenuItemCard from './MenuItemCard';
import VirtualGrid from '../common/VirtualGrid';

interface ItemGridProps {
    items: MenuItem[];
    onAddItem: (item: MenuItem) => void;
    currencySymbol: string;
    isTouchMode: boolean;
}

const ItemGrid: React.FC<ItemGridProps> = React.memo(({
    items,
    onAddItem,
    currencySymbol,
    isTouchMode,
}) => {
    const columnWidth = isTouchMode ? 320 : 280;
    const rowHeight = isTouchMode ? 190 : 170;
    const gap = isTouchMode ? 20 : 16;

    if (items.length === 0) {
        return (
            <div className="grid gap-4 md:gap-6 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
                {items.map(item => (
                    <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddItem={onAddItem}
                        currencySymbol={currencySymbol}
                        isTouchMode={isTouchMode}
                    />
                ))}
            </div>
        );
    }

    return (
        <VirtualGrid
            itemCount={items.length}
            columnWidth={columnWidth}
            rowHeight={rowHeight}
            gap={gap}
            className="h-full"
            renderItem={(index) => (
                <MenuItemCard
                    item={items[index]}
                    onAddItem={onAddItem}
                    currencySymbol={currencySymbol}
                    isTouchMode={isTouchMode}
                />
            )}
            getKey={(index) => items[index]?.id || index}
        />
    );
});

export default ItemGrid;
