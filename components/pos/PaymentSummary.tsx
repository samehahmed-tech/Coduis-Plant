import React from 'react';
import { Banknote, CreditCard, Smartphone, Landmark, Calculator, Trash, Wallet, Zap, ChefHat } from 'lucide-react';
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
}) => {
    const paymentMethods = [
        { id: PaymentMethod.CASH, label: t.cash, icon: Banknote },
        { id: PaymentMethod.VISA, label: t.visa, icon: CreditCard },
        { id: PaymentMethod.VODAFONE_CASH, label: t.v_cash, icon: Smartphone },
        { id: PaymentMethod.INSTAPAY, label: t.insta, icon: Landmark },
        { id: PaymentMethod.SPLIT, label: t.split, icon: Calculator },
    ];

    return (
        <div className="p-5 md:p-7 xl:p-8 bg-elevated dark:bg-elevated/30 border-t border-border/50 space-y-5 md:space-y-6 lg:space-y-7 shrink-0">
            <div className="space-y-3 md:space-y-4">
                <h4 className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    {t.payment_method}
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                    {paymentMethods.map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => {
                                onSetPaymentMethod(btn.id);
                                if (btn.id === PaymentMethod.SPLIT) onShowSplitModal();
                            }}
                            className={`flex flex-col items-center justify-center gap-2 md:gap-2.5 rounded-2xl md:rounded-3xl border-2 transition-all active:scale-95 ${paymentMethod === btn.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-card border-border/50 text-muted hover:border-primary/30'} ${isTouchMode ? 'py-4 md:py-5' : 'py-3 md:py-3.5'}`}
                        >
                            <btn.icon size={isTouchMode ? 24 : 16} className="md:w-5 md:h-5" />
                            <span className={`${isTouchMode ? 'text-xs' : 'text-[9px] md:text-[10px]'} font-black uppercase tracking-tight text-center`}>
                                {btn.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2 md:space-y-3 bg-card/70 dark:bg-card/40 border border-border/50 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Coupon Code"
                        value={couponCode}
                        onChange={(e) => onCouponCodeChange(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-elevated dark:bg-elevated/50 border border-border/50 text-xs font-black uppercase tracking-wider"
                    />
                    <button
                        onClick={onApplyCoupon}
                        disabled={!couponCode.trim() || isApplyingCoupon}
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                        {isApplyingCoupon ? '...' : 'Apply'}
                    </button>
                    {activeCoupon && (
                        <button
                            onClick={onClearCoupon}
                            className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-[10px] font-black uppercase tracking-widest"
                        >
                            Clear
                        </button>
                    )}
                </div>
                <div className="flex justify-between text-[10px] md:text-xs font-bold text-muted uppercase tracking-wider">
                    <span>{t.subtotal}</span>
                    <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-[10px] md:text-xs font-bold text-green-600 uppercase tracking-wider">
                        <span>{t.discount} ({discount.toFixed(2)}%) {activeCoupon ? `- ${activeCoupon}` : ''}</span>
                        <span>-{currencySymbol}{(subtotal * discount / 100).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-[10px] md:text-xs font-bold text-muted uppercase tracking-wider">
                    <span>{t.tax}</span>
                    <span>{currencySymbol}{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl md:text-2xl xl:text-3xl font-black text-main pt-2 border-t border-border/50">
                    <span>{t.total}</span>
                    <span>{currencySymbol}{total.toFixed(2)}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button
                    onClick={onVoid}
                    className="py-4 md:py-5 bg-card dark:bg-elevated/50 text-muted rounded-2xl md:rounded-[1.5rem] font-black text-[11px] md:text-sm uppercase tracking-wider hover:bg-danger/10 hover:text-danger transition-all flex items-center justify-center gap-2 border border-border/50 min-h-[58px]"
                >
                    <Trash size={14} className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden sm:inline">{t.void}</span>
                </button>
                <button
                    onClick={onSendKitchen}
                    disabled={!canSubmit}
                    className="py-4 md:py-5 bg-slate-900 text-white rounded-2xl md:rounded-[1.5rem] font-black text-[11px] md:text-sm uppercase tracking-wider hover:bg-slate-800 shadow-xl shadow-slate-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[58px]"
                >
                    <ChefHat size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden sm:inline">{t.send_kitchen || 'Send Kitchen'}</span>
                </button>
                <button
                    onClick={onQuickPay}
                    disabled={!canSubmit}
                    title="Quick Pay (Cash)"
                    className="py-4 md:py-5 bg-emerald-500 text-white rounded-2xl md:rounded-[1.5rem] hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center min-h-[58px]"
                >
                    <Zap size={24} className="animate-pulse" />
                </button>
                <button
                    onClick={onSubmit}
                    disabled={!canSubmit}
                    className="py-4 md:py-5 bg-primary text-white rounded-2xl md:rounded-[1.5rem] font-black text-sm md:text-xl uppercase tracking-widest hover:bg-primary-hover shadow-xl shadow-primary/20 disabled:opacity-50 transition-all min-h-[58px]"
                >
                    {t.place_order}
                </button>
            </div>
        </div>
    );
};

export default PaymentSummary;
