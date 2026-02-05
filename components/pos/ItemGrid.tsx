import React from 'react';
import { MenuItem } from '../../types';
import MenuItemCard from './MenuItemCard';

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
});

export default ItemGrid;
