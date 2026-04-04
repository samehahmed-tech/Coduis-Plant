import React, { useState, useRef, useCallback } from 'react';
import { Minus, Plus, Trash2, Pencil, Tag, Percent } from 'lucide-react';
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
    onEditItemDiscount?: (cartId: string) => void;
    lang: 'en' | 'ar';
    isLastAdded?: boolean;
}

const CartItem: React.FC<CartItemProps> = React.memo(({
    item, currencySymbol, isTouchMode, onEditNote, onUpdateQuantity, onRemove, onEditItemDiscount, lang, isLastAdded,
}) => {
    const displayName = lang === 'ar' ? (item.nameAr || item.name) : item.name;
    const unitPrice = Number(item.price || 0);
    const modPrice = (item.selectedModifiers || []).reduce((s, m) => s + (m.price || 0), 0);
    const lineGross = (unitPrice + modPrice) * Number(item.quantity || 0);

    let discountAmount = 0;
    if (item.itemDiscount && item.itemDiscount > 0) {
        discountAmount = item.itemDiscountType === 'percent'
            ? lineGross * (item.itemDiscount / 100)
            : item.itemDiscount;
    }
    const lineTotal = lineGross - discountAmount;

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const startEdit = () => {
        setDraft(String(item.quantity));
        setEditing(true);
        setTimeout(() => { inputRef.current?.select(); }, 0);
    };

    const commitEdit = useCallback(() => {
        const parsed = parseInt(draft, 10);
        if (!isNaN(parsed) && parsed > 0) {
            const delta = parsed - item.quantity;
            if (delta !== 0) onUpdateQuantity(item.cartId, delta);
        }
        setEditing(false);
    }, [draft, item.quantity, item.cartId, onUpdateQuantity]);

    const cancelEdit = () => setEditing(false);

    return (
        <div className={`group relative flex items-center gap-2 px-2 py-1.5 rounded-xl border transition-all duration-100
            ${isLastAdded
                ? 'bg-primary/4 border-primary/15 shadow-sm shadow-primary/5'
                : 'bg-white/60 border-border/8 hover:bg-white/90 hover:border-border/15'
            }`}
        >
            {/* Quantity Stepper */}
            <div className="flex items-center bg-elevated/40 rounded-lg border border-border/10 overflow-hidden shrink-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, -1); }}
                    className="w-6 h-6 flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/8 active:scale-90 transition-colors"
                >
                    <Minus size={10} />
                </button>

                {editing ? (
                    <input
                        ref={inputRef}
                        type="number" min={1}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => {
                            e.stopPropagation();
                            if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                            if (e.key === 'Escape') cancelEdit();
                        }}
                        className="w-7 h-6 text-center text-[11px] font-extrabold text-primary bg-primary/8 border-x border-primary/15 outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                ) : (
                    <button
                        onClick={startEdit}
                        title={lang === 'ar' ? 'اضغط لتعديل الكمية' : 'Tap to edit qty'}
                        className="w-7 h-6 flex items-center justify-center text-[11px] font-extrabold text-main tabular-nums hover:text-primary hover:bg-primary/5 transition-colors cursor-text"
                    >
                        {item.quantity}
                    </button>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, 1); }}
                    className="w-6 h-6 flex items-center justify-center text-muted hover:text-primary hover:bg-primary/8 active:scale-90 transition-colors"
                >
                    <Plus size={10} />
                </button>
            </div>

            {/* Name + Modifiers */}
            <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-[11px] font-bold text-main leading-snug truncate">{displayName}</p>
                {((item.selectedModifiers && item.selectedModifiers.length > 0) || item.notes || (item.itemDiscount && item.itemDiscount > 0)) && (
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <span className="text-[8px] text-muted/70 font-medium truncate max-w-[80px]">+{item.selectedModifiers.map(m => m.optionName).join(', ')}</span>
                        )}
                        {item.notes && (
                            <span className="text-[8px] font-bold text-warning/80 bg-warning/6 px-1 py-px rounded border border-warning/10 truncate max-w-[60px]">{item.notes}</span>
                        )}
                        {item.itemDiscount && item.itemDiscount > 0 && (
                            <span className="text-[8px] font-bold text-success bg-success/6 px-1 py-px rounded border border-success/10 flex items-center gap-0.5">
                                <Percent size={6} />
                                {item.itemDiscountType === 'percent' ? `${item.itemDiscount}%` : `-${item.itemDiscount.toFixed(0)}`}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Total */}
            <div className="shrink-0 text-right">
                <span className="text-[11px] font-extrabold text-main tabular-nums">{lineTotal.toFixed(2)}</span>
                {discountAmount > 0 && (
                    <div className="text-[8px] text-muted/50 line-through tabular-nums">{lineGross.toFixed(2)}</div>
                )}
            </div>

            {/* Actions — absolutely positioned, zero layout impact */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 invisible group-hover:visible bg-card/95 backdrop-blur-sm rounded-lg border border-border/15 px-1 py-0.5 shadow-md z-10 transition-all">
                {onEditItemDiscount && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onEditItemDiscount(item.cartId); }}
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${item.itemDiscount && item.itemDiscount > 0 ? 'text-success bg-success/8' : 'text-muted hover:text-success hover:bg-success/8'}`}
                    >
                        <Tag size={9} />
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onEditNote(item.cartId, item.notes || ''); }}
                    className="w-6 h-6 rounded text-muted hover:text-primary hover:bg-primary/8 transition-colors flex items-center justify-center"
                >
                    <Pencil size={9} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(item.cartId); }}
                    className="w-6 h-6 rounded text-muted hover:text-rose-500 hover:bg-rose-500/8 transition-colors flex items-center justify-center"
                >
                    <Trash2 size={9} />
                </button>
            </div>
        </div>
    );
});

export default CartItem;
