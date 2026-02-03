import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { OrderItem } from '../../types';

interface CartItemProps {
    item: OrderItem;
    currencySymbol: string;
    isTouchMode: boolean;
    onEditNote: (cartId: string, currentNote: string) => void;
    onUpdateQuantity: (cartId: string, delta: number) => void;
    onRemove: (cartId: string) => void;
}

const CartItem: React.FC<CartItemProps> = React.memo(({
    item,
    currencySymbol,
    isTouchMode,
    onEditNote,
    onUpdateQuantity,
    onRemove,
}) => {
    return (
        <div className="bg-card dark:bg-card p-4 rounded-2xl border border-border/50 flex justify-between items-center shadow-sm animate-in slide-in-from-right-2 transition-all hover:border-primary/30">
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-main dark:text-main leading-tight mb-0.5">{item.name}</h4>
                <p className="text-sm font-bold text-primary">
                    {(item.price * item.quantity).toFixed(2)}
                </p>
                {item.notes && <p className="text-[10px] text-amber-600 font-bold mt-1">📝 {item.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEditNote(item.cartId, item.notes || '');
                    }}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-colors flex items-center justify-center mr-1"
                >
                    <span className="text-xs">✏️</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(item.cartId, -1);
                    }}
                    className={`${isTouchMode ? 'w-14 h-14' : 'w-8 h-8'} rounded-lg bg-elevated dark:bg-elevated/50 text-muted dark:text-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all`}
                >
                    <Minus size={isTouchMode ? 20 : 14} />
                </button>
                <span className={`${isTouchMode ? 'w-14 text-xl' : 'w-8'} text-center font-black text-main dark:text-main`}>
                    {item.quantity}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(item.cartId, 1);
                    }}
                    className={`${isTouchMode ? 'w-14 h-14' : 'w-8 h-8'} rounded-lg bg-elevated dark:bg-elevated/50 text-muted dark:text-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all`}
                >
                    <Plus size={isTouchMode ? 20 : 14} />
                </button>
                <button
                    onClick={() => onRemove(item.cartId)}
                    className="w-8 h-8 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
});

export default CartItem;
