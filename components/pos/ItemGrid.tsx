import React from 'react';
import { MenuItem } from '../../types';
import MenuItemCard from './MenuItemCard';

interface ItemGridProps {
    items: MenuItem[];
    onAddItem: (item: MenuItem) => void;
    currencySymbol: string;
    isTouchMode: boolean;
}

const ItemGrid: React.FC<ItemGridProps> = ({
    items,
    onAddItem,
    currencySymbol,
    isTouchMode,
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
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
};

export default ItemGrid;
