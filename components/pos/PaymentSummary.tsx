import React from 'react';
import { Banknote, CreditCard, Smartphone, Landmark, Calculator, Trash, Zap, ChefHat, X, ChevronDown, ChevronUp } from 'lucide-react';
import { PaymentMethod } from '../../types';

interface PaymentSummaryProps {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    currencySymbol: string;
    paymentMethod: PaymentMethod;
    onSetPaymentMethod: (method: PaymentMethod) => void;
    onShowSplitModal: () => void;
    isTouchMode: boolean;
    lang: 'en' | 'ar';
    t: any;
    onVoid: () => void;
    onSubmit: () => void;
    onQuickPay: () => void;
    onSendKitchen: () => void;
    canSubmit: boolean;
    couponCode: string;
    activeCoupon: string | null;
    isApplyingCoupon: boolean;
    onCouponCodeChange: (value: string) => void;
    onApplyCoupon: () => void;
    onClearCoupon: () => void;
    collapsed?: boolean;
    onToggleCollapsed?: () => void;
    itemCount?: number;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
    subtotal,
    discount,
    tax,
    total,
    currencySymbol,
    paymentMethod,
    onSetPaymentMethod,
    onShowSplitModal,
    isTouchMode,
    lang,
    t,
    onVoid,
    onSubmit,
    onQuickPay,
    onSendKitchen,
    canSubmit,
    couponCode,
    activeCoupon,
    isApplyingCoupon,
    onCouponCodeChange,
    onApplyCoupon,
    onClearCoupon,
    collapsed = false,
    onToggleCollapsed,
    itemCount = 0,
}) => {
    const paymentMethods = [
        { id: PaymentMethod.CASH, label: t.cash, icon: Banknote },
        { id: PaymentMethod.VISA, label: t.visa, icon: CreditCard },
        { id: PaymentMethod.VODAFONE_CASH, label: t.v_cash, icon: Smartphone },
        { id: PaymentMethod.INSTAPAY, label: t.insta, icon: Landmark },
        { id: PaymentMethod.SPLIT, label: t.split, icon: Calculator },
    ];

    return (
        <div className="p-2.5 md:p-3 bg-elevated dark:bg-elevated/30 border-b border-border/50 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between bg-card/70 dark:bg-card/40 border border-border/50 rounded-xl px-3 py-2">
                <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.total} {itemCount > 0 ? `(${itemCount})` : ''}</p>
                    <p className="text-base md:text-lg font-black text-main">{currencySymbol}{total.toFixed(2)}</p>
                </div>
                {onToggleCollapsed && (
                    <button
                        onClick={onToggleCollapsed}
                        className="p-2 rounded-xl bg-elevated dark:bg-elevated/50 text-slate-500 hover:text-primary transition-colors"
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                )}
            </div>

            {collapsed ? (
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={onSendKitchen}
                        disabled={!canSubmit}
                        className="py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                        {lang === 'ar' ? 'مطبخ' : 'Kitchen'}
                    </button>
                    <button
                        onClick={onQuickPay}
                        disabled={!canSubmit}
                        className="py-2 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-600 disabled:opacity-50 transition-all"
                    >
                        {lang === 'ar' ? 'دفع سريع' : 'Quick Pay'}
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!canSubmit}
                        className="py-2 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-primary-hover disabled:opacity-50 transition-all"
                    >
                        {lang === 'ar' ? 'تنفيذ' : 'Submit'}
                    </button>
                </div>
            ) : (
                <>
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onVoid}
                    className="py-2.5 bg-card dark:bg-elevated/50 text-muted rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-danger/10 hover:text-danger transition-all flex items-center justify-center gap-2 border border-border/50 min-h-[44px]"
                >
                    <Trash size={14} />
                    <span>{t.void}</span>
                </button>
                <button
                    onClick={onSendKitchen}
                    disabled={!canSubmit}
                    className="py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-slate-800 shadow-xl shadow-slate-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                >
                    <ChefHat size={15} />
                    <span>{t.send_kitchen}</span>
                </button>
                <button
                    onClick={onQuickPay}
                    disabled={!canSubmit}
                    title={lang === 'ar' ? 'Quick Pay (Cash)' : 'Quick Pay (Cash)'}
                    className="py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                >
                    <Zap size={18} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'Quick Pay' : 'Quick Pay'}</span>
                </button>
                <button
                    onClick={onSubmit}
                    disabled={!canSubmit}
                    className="py-2.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover shadow-xl shadow-primary/20 disabled:opacity-50 transition-all min-h-[44px]"
                >
                    {t.place_order}
                </button>
            </div>

            <div className="space-y-2">
                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">
                    {t.payment_method}
                </h4>
                <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar pb-0.5">
                    {paymentMethods.map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => {
                                onSetPaymentMethod(btn.id);
                                if (btn.id === PaymentMethod.SPLIT) onShowSplitModal();
                            }}
                            className={`shrink-0 min-w-[74px] flex flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all active:scale-95 ${paymentMethod === btn.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-card border-border/50 text-muted hover:border-primary/30'} ${isTouchMode ? 'py-2.5 px-2' : 'py-2 px-2'}`}
                        >
                            <btn.icon size={isTouchMode ? 18 : 15} />
                            <span className="text-[9px] font-black uppercase tracking-tight text-center leading-none">
                                {btn.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5 bg-card/70 dark:bg-card/40 border border-border/50 rounded-xl p-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                    <input
                        type="text"
                        placeholder={lang === 'ar' ? 'Coupon Code' : 'Coupon Code'}
                        value={couponCode}
                        onChange={(e) => onCouponCodeChange(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-elevated dark:bg-elevated/50 border border-border/50 text-xs font-black uppercase tracking-wider outline-none focus:border-primary/50"
                    />
                    <button
                        onClick={onApplyCoupon}
                        disabled={!couponCode.trim() || isApplyingCoupon}
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                    >
                        {isApplyingCoupon ? '...' : (lang === 'ar' ? 'Apply' : 'Apply')}
                    </button>
                    {activeCoupon && (
                        <button
                            onClick={onClearCoupon}
                            className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                            title={lang === 'ar' ? 'Clear Coupon' : 'Clear Coupon'}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-muted uppercase tracking-wider">
                    <span>{t.subtotal}</span>
                    <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-[10px] font-bold text-green-600 uppercase tracking-wider">
                        <span>{t.discount} ({discount.toFixed(2)}%) {activeCoupon ? `- ${activeCoupon}` : ''}</span>
                        <span>-{currencySymbol}{(subtotal * discount / 100).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-[10px] font-bold text-muted uppercase tracking-wider">
                    <span>{t.tax}</span>
                    <span>{currencySymbol}{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg md:text-xl font-black text-main pt-1.5 border-t border-border/50">
                    <span>{t.total}</span>
                    <span>{currencySymbol}{total.toFixed(2)}</span>
                </div>
            </div>
                </>
            )}
        </div>
    );
};

export default PaymentSummary;
