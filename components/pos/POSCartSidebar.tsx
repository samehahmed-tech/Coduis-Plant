import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronDown, X, Trash2 } from 'lucide-react';
import CartItem from './CartItem';
import PaymentSummary from './PaymentSummary';
import type { OrderItem, OrderType, PaymentMethod } from '../../types';

interface POSCartSidebarProps {
    activeCart: OrderItem[];
    filteredCartItems: OrderItem[];
    cartSubtotal: number;
    cartTotal: number;
    cartTax: number;
    cartStats: { lines: number; qty: number };
    discount: number;
    orderDiscountAmount?: number;
    itemDiscountTotal?: number;
    orderTypeLabel: string;
    orderTypeSubLabel: string;
    activeOrderType: OrderType;
    selectedTableId: string | null;
    cartSearchQuery: string;
    onCartSearchChange: (q: string) => void;
    cartPanelWidth: 'compact' | 'normal' | 'wide';
    onSetCartWidth: (w: 'compact' | 'normal' | 'wide') => void;
    tipAmount: number;
    onSetTipAmount: (amount: number) => void;
    paymentMethod: PaymentMethod;
    onSetPaymentMethod: (m: PaymentMethod) => void;
    isPaymentPanelCollapsed: boolean;
    onTogglePaymentCollapsed: () => void;
    couponCode: string;
    activeCoupon: any;
    isApplyingCoupon: boolean;
    onCouponCodeChange: (c: string) => void;
    onApplyCoupon: () => void;
    onClearCoupon: () => void;
    onEditNote: (cartId: string, note: string) => void;
    onEditSeat: (cartId: string, seat?: number) => void;
    onEditCourse: (cartId: string, course?: string) => void;
    onUpdateQuantity: (cartId: string, delta: number) => void;
    onRemoveItem: (cartId: string) => void;
    onEditItemDiscount?: (cartId: string) => void;
    onVoid: () => void;
    onClear: () => void;
    onSendKitchen: () => void;
    onSubmit: () => void;
    onQuickPay: () => void;
    onShowSplitModal: () => void;
    onLeaveTable: () => void;
    onCloseCart: () => void;
    onFocusSearch: () => void;
    currencySymbol: string;
    isTouchMode: boolean;
    lang: 'en' | 'ar';
    t: any;
    isCartOpenMobile: boolean;
    shouldShowCart: boolean;
    cartPanelWidthClass: string;
}

const POSCartSidebar: React.FC<POSCartSidebarProps> = ({
    activeCart, filteredCartItems, cartSubtotal, cartTotal, cartTax, cartStats, discount, orderDiscountAmount = 0,
    orderTypeLabel, orderTypeSubLabel, activeOrderType, selectedTableId,
    paymentMethod, onSetPaymentMethod,
    couponCode, activeCoupon, isApplyingCoupon, onCouponCodeChange, onApplyCoupon, onClearCoupon,
    onEditNote, onEditSeat, onEditCourse, onUpdateQuantity, onRemoveItem, onEditItemDiscount,
    onVoid, onClear, onSendKitchen, onSubmit, onQuickPay, onShowSplitModal,
    onLeaveTable, onCloseCart, onFocusSearch,
    tipAmount, onSetTipAmount,
    currencySymbol, isTouchMode, lang, t,
    isCartOpenMobile, shouldShowCart, cartPanelWidthClass,
}) => {
    const isRTL = lang === 'ar';
    const hasCartItems = activeCart.length > 0;
    const isDineIn = activeOrderType === ('DINE_IN' as OrderType);

    // --- Premium Visual Feedback ---
    const [isGlowing, setIsGlowing] = useState(false);
    const prevItemCount = useRef(cartStats.qty);

    useEffect(() => {
        if (cartStats.qty > prevItemCount.current) {
            setIsGlowing(true);
            const timer = setTimeout(() => setIsGlowing(false), 800);
            return () => clearTimeout(timer);
        }
        prevItemCount.current = cartStats.qty;
    }, [cartStats.qty]);

    return (
        <div
            className={`
                pos-cart-sidebar ${cartPanelWidthClass}
                backdrop-blur-2xl flex flex-col min-h-0 overflow-hidden
                transition-all duration-300 ease-out will-change-transform
                ${shouldShowCart && isCartOpenMobile ? 'cart-open' : ''}
                ${isGlowing ? 'ring-4 ring-primary/20' : ''}
            `}
            style={{ 
                boxShadow: isGlowing 
                    ? `inset 0 0 40px rgba(var(--primary-rgb), 0.08), -8px 0 32px rgba(var(--primary-rgb), 0.1)` 
                    : undefined 
            }}
        >
            {/* ─── Cart Header ─── */}
            <div className="shrink-0 px-3 py-2.5 border-b border-border/8 bg-gradient-to-b from-white/50 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                            <ShoppingBag size={14} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-main leading-none truncate">{orderTypeLabel}</h3>
                            <p className="text-[9px] text-muted/70 mt-0.5 font-medium tabular-nums">
                                {cartStats.lines} {isRTL ? 'صنف' : 'items'} · {cartStats.qty} {isRTL ? 'وحدة' : 'qty'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {isDineIn && selectedTableId && (
                            <span className="text-[9px] font-bold text-primary bg-primary/6 px-2 py-0.5 rounded-md border border-primary/10 flex items-center gap-1.5">
                                {orderTypeSubLabel}
                                <button onClick={onLeaveTable} className="w-3.5 h-3.5 rounded-full hover:bg-rose-500 hover:text-white text-primary/40 flex items-center justify-center transition-colors">
                                    <X size={8} />
                                </button>
                            </span>
                        )}
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-base font-black text-main tabular-nums">{(cartTotal || 0).toFixed(2)}</span>
                            <span className="text-[8px] text-muted/50 font-bold">{currencySymbol}</span>
                        </div>
                        {/* Mobile close */}
                        <button onClick={onCloseCart} className="hidden max-lg:flex w-8 h-8 rounded-lg bg-elevated/50 border border-border/10 items-center justify-center text-muted hover:text-main hover:bg-elevated transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Cart Items ─── */}
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1.5 pos-scroll space-y-1 overscroll-contain">
                {filteredCartItems.map((item, idx) => (
                    <CartItem
                        key={item.cartId}
                        item={item} currencySymbol={currencySymbol} isTouchMode={isTouchMode}
                        lang={lang} onEditNote={onEditNote} onEditSeat={onEditSeat}
                        onEditCourse={onEditCourse} onUpdateQuantity={onUpdateQuantity}
                        onRemove={onRemoveItem} onEditItemDiscount={onEditItemDiscount}
                        isLastAdded={idx === filteredCartItems.length - 1 && filteredCartItems.length > 0}
                    />
                ))}

                {/* Empty state */}
                {activeCart.length === 0 && (
                    <div className="h-full flex items-center justify-center py-10">
                        <div className="text-center cursor-pointer group" onClick={onFocusSearch}>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/8 flex items-center justify-center mx-auto mb-3 text-muted group-hover:text-primary group-hover:border-primary/20 transition-all">
                                <ShoppingBag size={20} />
                            </div>
                            <p className="font-bold text-sm text-main">{t.empty_cart}</p>
                            <p className="text-[10px] text-muted/60 mt-1">{isRTL ? 'اختر من القائمة' : 'Select items from the menu'}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Payment Footer ─── */}
            <div className="shrink-0 border-t border-border/10 bg-gradient-to-t from-card to-card/90 p-2.5">
                <PaymentSummary
                    subtotal={cartSubtotal} discount={discount} discountAmount={orderDiscountAmount} tax={cartTax} total={cartTotal}
                    currencySymbol={currencySymbol} paymentMethod={paymentMethod} onSetPaymentMethod={onSetPaymentMethod}
                    onShowSplitModal={onShowSplitModal} isTouchMode={isTouchMode} lang={lang} t={t}
                    tipAmount={tipAmount} onSetTipAmount={onSetTipAmount} onVoid={onVoid}
                    onSendKitchen={onSendKitchen} onSubmit={onSubmit} onQuickPay={onQuickPay}
                    canSubmit={hasCartItems} couponCode={couponCode} activeCoupon={activeCoupon}
                    isApplyingCoupon={isApplyingCoupon} onCouponCodeChange={onCouponCodeChange}
                    onApplyCoupon={onApplyCoupon} onClearCoupon={onClearCoupon} itemCount={cartStats.qty}
                />
            </div>
        </div>
    );
};

export default React.memo(POSCartSidebar);
