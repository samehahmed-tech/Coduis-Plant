import React from 'react';
import { Minus, Plus, Trash2, Pencil } from 'lucide-react';
import { OrderItem } from '../../types';

interface CartItemProps {
    item: OrderItem;
    currencySymbol: string;
    isTouchMode: boolean;
    onEditNote: (cartId: string, currentNote: string) => void;
    onUpdateQuantity: (cartId: string, delta: number) => void;
    onRemove: (cartId: string) => void;
    lang: 'en' | 'ar';
}

const CartItem: React.FC<CartItemProps> = React.memo(({
    item, currencySymbol, isTouchMode, onEditNote, onUpdateQuantity, onRemove, lang,
}) => {
    const displayName = lang === 'ar' ? (item.nameAr || item.name) : item.name;
    const unitPrice = Number(item.price || 0);
    const lineTotal = unitPrice * Number(item.quantity || 0);

    return (
        <div className="group flex items-center gap-2 px-2.5 py-2 border-b border-border/15 hover:bg-elevated/20 transition-colors">
            {/* Qty controls */}
            <div className="flex items-center gap-px shrink-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, -1); }}
                    className="w-6 h-6 rounded-md bg-elevated text-muted flex items-center justify-center hover:text-red-500 transition-colors"
                >
                    <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-black text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.quantity}
                </span>
                <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, 1); }}
                    className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                >
                    <Plus size={12} />
                </button>
            </div>

            {/* Name + note */}
            <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-main truncate block">{displayName}</span>
                {item.notes && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 truncate block">📝 {item.notes}</span>
                )}
            </div>

            {/* Price */}
            <span className="shrink-0 text-sm font-black text-primary tabular-nums">
                {lineTotal.toFixed(2)}
            </span>

            {/* Actions — hover only */}
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onEditNote(item.cartId, item.notes || ''); }}
                    className="w-6 h-6 rounded text-muted/50 hover:text-amber-500 flex items-center justify-center"
                >
                    <Pencil size={10} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(item.cartId); }}
                    className="w-6 h-6 rounded text-muted/50 hover:text-red-500 flex items-center justify-center"
                >
                    <Trash2 size={10} />
                </button>
            </div>
        </div>
    );
});

export default CartItem;
