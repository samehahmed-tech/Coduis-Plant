/**
 * POSCartSidebar — Right panel: Cart header + items list + payment summary
 * Reference: total prominently at top, clean cart items, checkout at bottom.
 */
import React from 'react';
import { Search, ShoppingBag, X, LogOut } from 'lucide-react';
import CartItem from './CartItem';
import PaymentSummary from './PaymentSummary';
import type { OrderItem, OrderType, PaymentMethod, PaymentRecord } from '../../types';

interface POSCartSidebarProps {
    // Cart data
    activeCart: OrderItem[];
    filteredCartItems: OrderItem[];
    cartSubtotal: number;
    cartTotal: number;
    cartStats: { lines: number; qty: number };
    discount: number;
    // Order context
    orderTypeLabel: string;
    orderTypeSubLabel: string;
    activeOrderType: OrderType;
    selectedTableId: string | null;
    // Cart search
    cartSearchQuery: string;
    onCartSearchChange: (q: string) => void;
    // Cart width
    cartPanelWidth: 'compact' | 'normal' | 'wide';
    onSetCartWidth: (w: 'compact' | 'normal' | 'wide') => void;
    // Payment
    paymentMethod: PaymentMethod;
    onSetPaymentMethod: (m: PaymentMethod) => void;
    isPaymentPanelCollapsed: boolean;
    onTogglePaymentCollapsed: () => void;
    // Coupon
    couponCode: string;
    activeCoupon: any;
    isApplyingCoupon: boolean;
    onCouponCodeChange: (c: string) => void;
    onApplyCoupon: () => void;
    onClearCoupon: () => void;
    // Actions
    onEditNote: (cartId: string, note: string) => void;
    onUpdateQuantity: (cartId: string, delta: number) => void;
    onRemoveItem: (cartId: string) => void;
    onVoid: () => void;
    onSendKitchen: () => void;
    onSubmit: () => void;
    onQuickPay: () => void;
    onShowSplitModal: () => void;
    onLeaveTable: () => void;
    onCloseCart: () => void;
    // Search focus
    onFocusSearch: () => void;
    // Layout
    currencySymbol: string;
    isTouchMode: boolean;
    lang: 'en' | 'ar';
    t: any;
    // Visibility
    isCartOpenMobile: boolean;
    shouldShowCart: boolean;
    cartPanelWidthClass: string;
}

const POSCartSidebar: React.FC<POSCartSidebarProps> = ({
    activeCart, filteredCartItems, cartSubtotal, cartTotal, cartStats, discount,
    orderTypeLabel, orderTypeSubLabel, activeOrderType, selectedTableId,
    cartSearchQuery, onCartSearchChange,
    cartPanelWidth, onSetCartWidth,
    paymentMethod, onSetPaymentMethod, isPaymentPanelCollapsed, onTogglePaymentCollapsed,
    couponCode, activeCoupon, isApplyingCoupon, onCouponCodeChange, onApplyCoupon, onClearCoupon,
    onEditNote, onUpdateQuantity, onRemoveItem,
    onVoid, onSendKitchen, onSubmit, onQuickPay, onShowSplitModal,
    onLeaveTable, onCloseCart, onFocusSearch,
    currencySymbol, isTouchMode, lang, t,
    isCartOpenMobile, shouldShowCart, cartPanelWidthClass,
}) => {
    const isRTL = lang === 'ar';
    const hasCartItems = activeCart.length > 0;
    const isDineIn = activeOrderType === ('DINE_IN' as OrderType);

    return (
        <div className={`
         fixed lg:sticky lg:top-1.5 inset-y-0 w-[85%] max-w-[380px] lg:w-full ${cartPanelWidthClass}
         bg-card/80 backdrop-blur-xl flex flex-col h-full lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)]
         shadow-2xl z-40 transition-transform duration-300
         ${isRTL ? 'border-r left-0' : 'border-l right-0'} border-border/50
         ${shouldShowCart && isCartOpenMobile ? 'translate-x-0' : (isRTL ? '-translate-x-full' : 'translate-x-full')} lg:translate-x-0
         lg:mx-1.5 lg:self-start lg:rounded-xl lg:border lg:border-border/40 lg:shadow-lg lg:overflow-hidden
      `}>
            {/* ═══ Cart Header ═══ */}
            <div className="shrink-0 p-3 border-b border-border/50 bg-elevated/30">
                {/* Total + order info */}
                <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0">
                        <h2 className="text-sm font-black text-main uppercase tracking-tight truncate">
                            {orderTypeLabel}
                        </h2>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5 truncate">
                            {orderTypeSubLabel}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {isDineIn && selectedTableId && (
                            <button
                                onClick={onLeaveTable}
                                title={t.back_to_tables}
                                className="p-2 text-muted hover:text-primary transition-all bg-elevated rounded-lg"
                            >
                                <LogOut size={16} />
                            </button>
                        )}
                        <button
                            onClick={onCloseCart}
                            className="p-2 text-muted hover:text-primary transition-all bg-elevated rounded-lg lg:hidden"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Stats badges */}
                <div className="flex items-center gap-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                        {cartStats.lines} {isRTL ? 'بنود' : 'lines'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {currencySymbol}{cartTotal.toFixed(2)}
                    </span>
                    {/* Cart width controls (desktop) */}
                    <div className="hidden lg:inline-flex ml-auto bg-elevated rounded-lg p-0.5 border border-border/30">
                        {(['compact', 'normal', 'wide'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => onSetCartWidth(mode)}
                                className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors ${cartPanelWidth === mode ? 'bg-primary text-white' : 'text-muted hover:text-primary'
                                    }`}
                            >
                                {mode === 'compact' ? 'S' : mode === 'normal' ? 'M' : 'L'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cart search */}
                <div className="relative">
                    <Search className={`absolute top-1/2 -translate-y-1/2 text-muted/40 w-3.5 h-3.5 ${isRTL ? 'right-3' : 'left-3'}`} />
                    <input
                        type="text"
                        value={cartSearchQuery}
                        onChange={(e) => onCartSearchChange(e.target.value)}
                        placeholder={isRTL ? 'بحث داخل السلة' : 'Search cart'}
                        className={`w-full h-8 rounded-lg bg-elevated/60 border border-border/30 text-xs font-semibold outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all ${isRTL ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3 text-left'
                            }`}
                    />
                </div>
            </div>

            {/* ═══ Cart Items ═══ */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="min-h-0 flex flex-col border-b border-border/30">
                    {/* Section header */}
                    <div className="shrink-0 px-3 py-1.5 border-b border-border/20 flex items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase tracking-wider text-muted">
                            {isRTL ? 'تفاصيل الأوردر' : 'Order Details'}
                        </p>
                        <p className="text-xs font-black uppercase tracking-wider text-primary">
                            {filteredCartItems.length}/{activeCart.length}
                        </p>
                    </div>

                    {/* Items list */}
                    <div className="flex-1 overflow-y-auto px-1 py-0.5 custom-scrollbar min-h-0">
                        {filteredCartItems.map(item => (
                            <CartItem
                                key={item.cartId}
                                item={item}
                                currencySymbol={currencySymbol}
                                isTouchMode={isTouchMode}
                                lang={lang}
                                onEditNote={onEditNote}
                                onUpdateQuantity={onUpdateQuantity}
                                onRemove={onRemoveItem}
                            />
                        ))}

                        {/* No search results */}
                        {activeCart.length > 0 && filteredCartItems.length === 0 && (
                            <div className="py-6 text-center text-muted">
                                <p className="text-xs font-black uppercase tracking-widest">{isRTL ? 'لا نتائج في السلة' : 'No cart matches'}</p>
                            </div>
                        )}

                        {/* Empty cart */}
                        {activeCart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-muted py-8 px-4">
                                <div className="w-14 h-14 rounded-2xl bg-elevated flex items-center justify-center mb-3 opacity-60">
                                    <ShoppingBag size={24} />
                                </div>
                                <p className="font-black text-sm uppercase tracking-widest opacity-60">{t.empty_cart}</p>
                                <p className="text-[11px] font-medium mt-1.5 opacity-40 text-center">
                                    {isRTL ? 'ابدأ بإضافة أصناف' : 'Start adding items'}
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                    <button onClick={onFocusSearch} className="px-3 py-1.5 rounded-lg bg-elevated text-xs font-black uppercase tracking-wider hover:text-primary transition-colors">
                                        {isRTL ? 'بحث' : 'Search'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ Payment Summary ═══ */}
                <div className={`shrink-0 border-t border-border/30 overflow-y-auto no-scrollbar bg-elevated/20 ${isPaymentPanelCollapsed ? '' : 'max-h-[38dvh] lg:max-h-[42%]'
                    }`}>
                    <PaymentSummary
                        subtotal={cartSubtotal}
                        discount={discount}
                        tax={cartTotal - (cartTotal / 1.1)}
                        total={cartTotal}
                        currencySymbol={currencySymbol}
                        paymentMethod={paymentMethod}
                        onSetPaymentMethod={onSetPaymentMethod}
                        onShowSplitModal={onShowSplitModal}
                        isTouchMode={isTouchMode}
                        lang={lang}
                        t={t}
                        onVoid={onVoid}
                        onSendKitchen={onSendKitchen}
                        onSubmit={onSubmit}
                        onQuickPay={onQuickPay}
                        canSubmit={hasCartItems}
                        couponCode={couponCode}
                        activeCoupon={activeCoupon}
                        isApplyingCoupon={isApplyingCoupon}
                        onCouponCodeChange={onCouponCodeChange}
                        onApplyCoupon={onApplyCoupon}
                        onClearCoupon={onClearCoupon}
                        collapsed={isPaymentPanelCollapsed}
                        onToggleCollapsed={onTogglePaymentCollapsed}
                        itemCount={cartStats.qty}
                    />
                </div>
            </div>
        </div>
    );
};

export default React.memo(POSCartSidebar);
