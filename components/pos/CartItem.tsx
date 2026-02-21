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

    return (
        <div className="bg-card dark:bg-card p-2.5 rounded-xl border border-border/50 shadow-sm transition-all hover:border-primary/30">
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[13px] text-main dark:text-main leading-tight line-clamp-2">{displayName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-elevated dark:bg-elevated/40 text-slate-500">
                            {currencySymbol}{unitPrice.toFixed(2)} x {item.quantity}
                        </span>
                        <span className="text-xs font-black text-primary">
                            {currencySymbol}{lineTotal.toFixed(2)}
                        </span>
                    </div>
                    {item.notes && <p className="text-[10px] text-amber-600 font-bold mt-1.5 line-clamp-1">Note: {item.notes}</p>}
                </div>
                <button
                    onClick={() => onRemove(item.cartId)}
                    className={`${isTouchMode ? 'w-10 h-10' : 'w-7 h-7'} rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center`}
                >
                    <Trash2 size={13} />
                </button>
            </div>

            <div className="flex items-center gap-1 mt-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEditNote(item.cartId, item.notes || '');
                    }}
                    className={`${isTouchMode ? 'w-10 h-10' : 'w-7 h-7'} rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-colors flex items-center justify-center`}
                >
                    <Pencil size={13} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(item.cartId, -1);
                    }}
                    className={`${isTouchMode ? 'w-10 h-10' : 'w-7 h-7'} rounded-lg bg-elevated dark:bg-elevated/50 text-muted dark:text-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all`}
                >
                    <Minus size={isTouchMode ? 16 : 13} />
                </button>
                <span className={`${isTouchMode ? 'w-9 text-base' : 'w-7 text-sm'} text-center font-black text-main dark:text-main`}>
                    {item.quantity}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(item.cartId, 1);
                    }}
                    className={`${isTouchMode ? 'w-10 h-10' : 'w-7 h-7'} rounded-lg bg-primary/10 text-primary dark:text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all`}
                >
                    <Plus size={isTouchMode ? 16 : 13} />
                </button>
            </div>
        </div>
    );
});

export default CartItem;
