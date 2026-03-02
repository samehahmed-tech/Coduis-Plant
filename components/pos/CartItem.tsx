import React from 'react';
import { Minus, Plus, Trash2, Pencil, User, Utensils } from 'lucide-react';
import { OrderItem } from '../../types';

interface CartItemProps {
    item: OrderItem;
    currencySymbol: string;
    isTouchMode: boolean;
    onEditNote: (cartId: string, currentNote: string) => void;
    onUpdateQuantity: (cartId: string, delta: number) => void;
    onRemove: (cartId: string) => void;
    onEditSeat: (cartId: string, currentSeat?: number) => void;
    onEditCourse?: (cartId: string, currentCourse?: string) => void;
    lang: 'en' | 'ar';
    isLastAdded?: boolean;
}

const CartItem: React.FC<CartItemProps> = React.memo(({
    item, currencySymbol, isTouchMode, onEditNote, onUpdateQuantity, onRemove, onEditSeat, onEditCourse, lang, isLastAdded,
}) => {
    const displayName = lang === 'ar' ? (item.nameAr || item.name) : item.name;
    const unitPrice = Number(item.price || 0);
    const lineTotal = unitPrice * Number(item.quantity || 0);

    return (
        <div className={`group flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isLastAdded ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
            {/* Qty controls - Horizontal & Bigger */}
            <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, -1); }}
                    className="w-8 h-8 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-indigo-600 shadow-sm active:scale-95 transition-colors"
                >
                    <Minus size={16} />
                </button>
                <div className="w-8 text-center text-sm font-black text-slate-900 dark:text-white tabular-nums">
                    {item.quantity}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, 1); }}
                    className="w-8 h-8 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-indigo-600 shadow-sm active:scale-95 transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Name & Details */}
            <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{displayName}</span>
                    <span className="shrink-0 text-base font-black text-slate-900 dark:text-white tabular-nums">
                        {lineTotal.toFixed(2)}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                    {item.seatNumber && (
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            Seat {item.seatNumber}
                        </span>
                    )}
                    {item.course && (
                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">
                            {item.course}
                        </span>
                    )}
                    {item.notes && (
                        <span className="text-[10px] text-slate-500 truncate mt-0.5 max-w-full block">
                            Note: {item.notes}
                        </span>
                    )}
                </div>
            </div>

            {/* Always Visible Actions */}
            <div className="flex items-center gap-1 shrink-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onEditNote(item.cartId, item.notes || ''); }}
                    className="w-9 h-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 flex items-center justify-center transition-colors"
                    title={lang === 'ar' ? 'ملاحظة' : 'Note'}
                >
                    <Pencil size={18} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(item.cartId); }}
                    className="w-9 h-9 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center transition-colors shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                    title={lang === 'ar' ? 'حذف' : 'Remove'}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
});

export default CartItem;
