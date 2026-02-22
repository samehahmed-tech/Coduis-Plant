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
        <div className="group flex items-center gap-1.5 px-2 py-1.5 border-b border-border/20 hover:bg-elevated/20 transition-colors">
            {/* Qty controls */}
            <div className="flex items-center gap-px shrink-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, -1); }}
                    className="w-5 h-5 rounded bg-elevated text-muted flex items-center justify-center hover:text-red-500 transition-colors"
                >
                    <Minus size={9} />
                </button>
                <span className="w-5 text-center text-[10px] font-black text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.quantity}
                </span>
                <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, 1); }}
                    className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                >
                    <Plus size={9} />
                </button>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-main truncate block leading-tight">{displayName}</span>
                {item.notes && (
                    <span className="text-[8px] text-amber-600 truncate block leading-tight">📝 {item.notes}</span>
                )}
            </div>

            {/* Price */}
            <span className="shrink-0 text-[10px] font-black text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {currencySymbol}{lineTotal.toFixed(2)}
            </span>

            {/* Actions (show on hover) */}
            <div className="flex items-center gap-px shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onEditNote(item.cartId, item.notes || ''); }}
                    className="w-5 h-5 rounded text-muted/40 hover:text-amber-500 flex items-center justify-center transition-colors"
                >
                    <Pencil size={8} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(item.cartId); }}
                    className="w-5 h-5 rounded text-muted/40 hover:text-red-500 flex items-center justify-center transition-colors"
                >
                    <Trash2 size={8} />
                </button>
            </div>
        </div>
    );
});

export default CartItem;
