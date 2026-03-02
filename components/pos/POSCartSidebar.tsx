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
    tipAmount: number;
    onSetTipAmount: (amount: number) => void;
    // Actions
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
    onEditSeat: (cartId: string, seat?: number) => void;
    onEditCourse: (cartId: string, course?: string) => void;
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
    onEditNote, onEditSeat, onEditCourse, onUpdateQuantity, onRemoveItem,
    onVoid, onSendKitchen, onSubmit, onQuickPay, onShowSplitModal,
    onLeaveTable, onCloseCart, onFocusSearch,
    tipAmount, onSetTipAmount,
    currencySymbol, isTouchMode, lang, t,
    isCartOpenMobile, shouldShowCart, cartPanelWidthClass,
}) => {
    const isRTL = lang === 'ar';
    const hasCartItems = activeCart.length > 0;
    const isDineIn = activeOrderType === ('DINE_IN' as OrderType);

    return (
        <div className={`
         fixed lg:sticky lg:top-1.5 inset-y-0 w-[85%] max-w-[380px] lg:w-full ${cartPanelWidthClass}
         bg-card/60 backdrop-blur-3xl flex flex-col h-full lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)]
         shadow-2xl z-40 transition-transform duration-500 ease-out
         ${isRTL ? 'border-r left-0' : 'border-l right-0'} border-white/10 dark:border-white/5
         ${shouldShowCart && isCartOpenMobile ? 'translate-x-0' : (isRTL ? '-translate-x-full' : 'translate-x-full')} lg:translate-x-0
         lg:mx-1.5 lg:self-start lg:rounded-[1.5rem] lg:border lg:border-white/10 lg:dark:border-white/5 lg:shadow-2xl lg:overflow-hidden relative
      `}>
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none mix-blend-overlay" />

            {/* ═══ Cart Header ═══ */}
            <div className="shrink-0 p-3 border-b border-white/10 dark:border-white/5 bg-elevated/20 relative z-10">
                {/* Total + order info */}
                <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0">
                        <h2 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 uppercase tracking-tight truncate">
                            {orderTypeLabel}
                        </h2>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-0.5 truncate">
                            {orderTypeSubLabel}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {isDineIn && selectedTableId && (
                            <button
                                onClick={onLeaveTable}
                                title={t.back_to_tables}
                                className="p-2.5 text-muted hover:text-rose-500 transition-all bg-elevated rounded-[12px] border border-border/50 hover:border-rose-500/30 hover:bg-rose-500/10 active:scale-95 shadow-sm"
                            >
                                <LogOut size={16} />
                            </button>
                        )}
                        <button
                            onClick={onCloseCart}
                            className="p-2.5 text-muted hover:text-rose-500 transition-all bg-elevated rounded-[12px] lg:hidden border border-border/50 hover:border-rose-500/30 hover:bg-rose-500/10 active:scale-95 shadow-sm"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 mb-2">
                    <span className="px-3 py-1 rounded-[10px] bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-sm">
                        {cartStats.lines} {isRTL ? 'بنود' : 'lines'}
                    </span>
                    <span className="px-3 py-1 rounded-[10px] bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {currencySymbol}{(cartTotal || 0).toFixed(2)}
                    </span>
                    {/* Cart width controls (desktop) */}
                    <div className="hidden lg:inline-flex ml-auto bg-elevated/80 rounded-[10px] p-0.5 border border-border/50 shadow-sm">
                        {(['compact', 'normal', 'wide'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => onSetCartWidth(mode)}
                                className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${cartPanelWidth === mode ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md' : 'text-muted hover:text-main'
                                    }`}
                            >
                                {mode === 'compact' ? 'S' : mode === 'normal' ? 'M' : 'L'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative group">
                    <Search className={`absolute top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors w-3.5 h-3.5 ${isRTL ? 'right-3' : 'left-3'}`} />
                    <input
                        type="text"
                        value={cartSearchQuery}
                        onChange={(e) => onCartSearchChange(e.target.value)}
                        placeholder={isRTL ? 'بحث داخل السلة' : 'Search cart'}
                        className={`w-full h-10 rounded-[12px] bg-elevated border border-border/50 text-xs font-bold outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder-muted ${isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                            }`}
                    />
                </div>
            </div>

            {/* ═══ Cart Items ═══ */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="min-h-0 flex flex-col border-b border-border/30">
                    {/* Section header */}
                    <div className="shrink-0 px-4 py-2 border-b border-border/30 flex items-center justify-between gap-2 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                            {isRTL ? 'تفاصيل الأوردر' : 'Order Details'}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                            {filteredCartItems.length}/{activeCart.length}
                        </p>
                    </div>

                    {/* Items list */}
                    <div className="flex-1 overflow-y-auto px-1 py-0.5 custom-scrollbar min-h-0">
                        {filteredCartItems.map((item, idx) => (
                            <CartItem
                                key={item.cartId}
                                item={item}
                                currencySymbol={currencySymbol}
                                isTouchMode={isTouchMode}
                                lang={lang}
                                onEditNote={onEditNote}
                                onEditSeat={onEditSeat}
                                onEditCourse={onEditCourse}
                                onUpdateQuantity={onUpdateQuantity}
                                onRemove={onRemoveItem}
                                isLastAdded={idx === filteredCartItems.length - 1 && filteredCartItems.length > 0}
                            />
                        ))}

                        {/* No search results */}
                        {activeCart.length > 0 && filteredCartItems.length === 0 && (
                            <div className="py-6 text-center text-muted">
                                <p className="text-xs font-black uppercase tracking-widest">{isRTL ? 'لا نتائج في السلة' : 'No cart matches'}</p>
                            </div>
                        )}

                        {/* Empty cart — Strong Visual CTA */}
                        {activeCart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center py-8 px-6">
                                <div className="w-full h-full min-h-[160px] rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/5 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 p-6 transition-colors hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer" onClick={onFocusSearch}>
                                    <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-500 shadow-inner">
                                        <ShoppingBag size={28} />
                                    </div>
                                    <h3 className="font-black text-lg uppercase tracking-widest mb-2 text-center text-indigo-900 dark:text-indigo-300">
                                        {t.empty_cart}
                                    </h3>
                                    <p className="text-sm font-medium text-center text-indigo-600/70 dark:text-indigo-400/70 leading-relaxed max-w-[200px]">
                                        {isRTL ? 'إضغط هنا للبحث السريع أو إختر من القائمة' : 'Tap to search items or select from the menu'}
                                    </p>
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
                        tipAmount={tipAmount}
                        onSetTipAmount={onSetTipAmount}
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
