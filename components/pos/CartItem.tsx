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
    item,
    currencySymbol,
    isTouchMode,
    onEditNote,
    onUpdateQuantity,
    onRemove,
    lang,
}) => {
    const displayName = lang === 'ar' ? (item.nameAr || item.name) : item.name;
    const unitPrice = Number(item.price || 0);
    const lineTotal = unitPrice * Number(item.quantity || 0);
    const btnSize = isTouchMode ? 'w-8 h-8' : 'w-6 h-6';

    return (
        <div className="bg-card p-2 rounded-lg border border-border/30 transition-all hover:border-primary/20 group">
            {/* Row 1: Name + price + delete */}
            <div className="flex items-start gap-1.5">
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-main leading-tight line-clamp-1">{displayName}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-semibold text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {currencySymbol}{unitPrice.toFixed(2)} × {item.quantity}
                        </span>
                        <span className="text-[11px] font-black text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            = {currencySymbol}{lineTotal.toFixed(2)}
                        </span>
                    </div>
                    {item.notes && (
                        <p className="text-[9px] text-amber-600 font-semibold mt-0.5 line-clamp-1 italic">📝 {item.notes}</p>
                    )}
                </div>
                <button
                    onClick={() => onRemove(item.cartId)}
                    className={`${btnSize} shrink-0 rounded-md text-muted/40 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100`}
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* Row 2: Quantity controls + note */}
            <div className="flex items-center gap-1 mt-1.5">
                <button
                    onClick={(e) => { e.stopPropagation(); onEditNote(item.cartId, item.notes || ''); }}
                    className={`${btnSize} rounded-md text-muted/60 hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center`}
                >
                    <Pencil size={11} />
                </button>

                <div className="flex items-center gap-0.5 ml-auto bg-elevated/40 rounded-lg p-0.5">
                    <button
                        onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, -1); }}
                        className={`${btnSize} rounded-md bg-card text-muted flex items-center justify-center hover:text-primary transition-colors`}
                    >
                        <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-xs font-black text-main" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {item.quantity}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, 1); }}
                        className={`${btnSize} rounded-md bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors`}
                    >
                        <Plus size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
});

export default CartItem;
