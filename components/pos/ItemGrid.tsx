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
                <Ban size={28} />
                <p className="font-bold text-xs uppercase tracking-wider">
                    {lang === 'ar' ? 'لا يوجد أصناف' : 'No items found'}
                </p>
            </div>
        );
    }

    // Grid config by density — responsive min-width
    const isSmallViewport = typeof window !== 'undefined' && window.innerWidth <= 1366;
    const minColumnWidth = (() => {
        switch (density) {
            case 'buttons': return isSmallViewport ? 120 : 140;
            case 'ultra': return 360;
            case 'compact': return isSmallViewport ? 160 : 196;
            default: return isSmallViewport ? 190 : 236;
        }
    })();

    return (
        <div
            className="h-full overflow-y-auto pos-scroll overscroll-contain will-change-scroll"
            style={{ transform: 'translate3d(0,0,0)' }}
        >
            <div
                className={density === 'ultra' ? 'flex flex-col' : 'grid'}
                style={density === 'ultra' ? {
                    gap: '6px',
                    padding: 'clamp(6px, 0.8vw, 10px)',
                } : {
                    gap: 'clamp(10px, 0.9vw, 16px)',
                    padding: 'clamp(6px, 0.8vw, 12px)',
                    gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`,
                }}
            >
                {items.map((item) => (
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
});

export default ItemGrid;
