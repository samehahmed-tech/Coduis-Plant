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
    tipAmount: number;
    onSetTipAmount: (amount: number) => void;
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
    tipAmount,
    onSetTipAmount,
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
        <div className="p-3 md:p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/30 space-y-3 shrink-0 relative z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
            {/* ═══ TOTAL — Clean & Bold (No Box) ═══ */}
            <div className="px-2 pt-2 pb-4">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
                            {t.total} {itemCount > 0 ? `(${itemCount})` : ''}
                        </p>
                        <p className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {currencySymbol}{total.toFixed(2)}
                        </p>
                    </div>
                    {onToggleCollapsed && (
                        <button
                            onClick={onToggleCollapsed}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors active:scale-95"
                            title={collapsed ? 'Expand' : 'Collapse'}
                        >
                            {collapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                        </button>
                    )}
                </div>
            </div>

            {collapsed ? (
                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <button
                        onClick={onSendKitchen}
                        disabled={!canSubmit}
                        className="py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-all active:scale-95"
                    >
                        {lang === 'ar' ? 'مطبخ' : 'Kitchen'}
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!canSubmit}
                        className="py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-40 transition-all active:scale-95 shadow-md shadow-indigo-600/20"
                    >
                        {lang === 'ar' ? 'تنفيذ' : 'Pay'} {currencySymbol}{total.toFixed(2)}
                    </button>
                </div>
            ) : (
                <>
                    {/* ═══ PRIMARY ACTION — Process Payment ═══ */}
                    <button
                        onClick={onSubmit}
                        disabled={!canSubmit}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] font-black text-base uppercase tracking-widest disabled:opacity-40 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3"
                    >
                        <span>{lang === 'ar' ? 'تنفيذ الدفع' : 'PROCESS PAYMENT'}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{currencySymbol}{total.toFixed(2)}</span>
                    </button>

                    {/* Secondary actions row */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={onVoid}
                            className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                            <Trash size={14} />
                            <span>{t.void}</span>
                        </button>
                        <button
                            onClick={onSendKitchen}
                            disabled={!canSubmit}
                            className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                            <ChefHat size={14} />
                            <span>{t.send_kitchen}</span>
                        </button>
                        <button
                            onClick={onQuickPay}
                            disabled={!canSubmit}
                            className="py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                            <Zap size={14} />
                            <span>{lang === 'ar' ? 'كاش سريع' : 'Quick Pay'}</span>
                        </button>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-[9px] font-black uppercase text-muted tracking-[0.2em] px-1">
                            {t.payment_method}
                        </h4>
                        <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar pb-1">
                            {paymentMethods.map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => {
                                        onSetPaymentMethod(btn.id);
                                        if (btn.id === PaymentMethod.SPLIT) onShowSplitModal();
                                    }}
                                    className={`shrink-0 min-w-[80px] flex flex-col items-center justify-center gap-1.5 rounded-[1.2rem] border-2 transition-all active:scale-95 ${paymentMethod === btn.id ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-elevated border-border/50 text-muted hover:border-indigo-500/30 hover:bg-indigo-500/5'} ${isTouchMode ? 'py-3 px-2' : 'py-2.5 px-2'}`}
                                >
                                    <btn.icon size={isTouchMode ? 20 : 16} strokeWidth={2.5} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-center leading-none">
                                        {btn.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 bg-card/60 backdrop-blur-md border border-border/50 rounded-[1.5rem] p-3.5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 bg-elevated/50 p-1.5 rounded-[1.2rem] border border-border/30">
                            <input
                                type="text"
                                placeholder={lang === 'ar' ? 'كوبون الخصم' : 'Coupon Code'}
                                value={couponCode}
                                onChange={(e) => onCouponCodeChange(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-xl bg-transparent text-xs font-black uppercase tracking-wider outline-none text-main placeholder-muted"
                            />
                            <button
                                onClick={onApplyCoupon}
                                disabled={!couponCode.trim() || isApplyingCoupon}
                                className="px-4 py-2 rounded-[1rem] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-indigo-500/20 transition-all active:scale-95"
                            >
                                {isApplyingCoupon ? '...' : (lang === 'ar' ? 'تطبيق' : 'Apply')}
                            </button>
                            {activeCoupon && (
                                <button
                                    onClick={onClearCoupon}
                                    className="p-2 rounded-[1rem] bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-95"
                                    title={lang === 'ar' ? 'Clear Coupon' : 'Clear Coupon'}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-muted uppercase tracking-widest px-1">
                            <span>{t.subtotal}</span>
                            <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-[10px] font-black text-emerald-500 uppercase tracking-widest px-1 bg-emerald-500/5 rounded-lg py-1 border border-emerald-500/10">
                                <span>{t.discount} ({discount.toFixed(2)}%) {activeCoupon ? `- ${activeCoupon}` : ''}</span>
                                <span>-{currencySymbol}{(subtotal * discount / 100).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-[10px] font-black text-muted uppercase tracking-widest px-1">
                            <span>{t.tax}</span>
                            <span>{currencySymbol}{tax.toFixed(2)}</span>
                        </div>

                        {/* Tips Section */}
                        <div className="border-t border-border/50 pt-2 space-y-2 mt-1 -mx-1 px-2">
                            <div className="flex justify-between text-[10px] items-center mb-1">
                                <span className="font-black text-muted uppercase tracking-[0.2em]">{lang === 'ar' ? 'إكرامية (Tip)' : 'Tip Amount'}</span>
                                <div className="flex gap-1.5">
                                    {[0, Math.round(subtotal * 0.05), Math.round(subtotal * 0.1), Math.round(subtotal * 0.15)].map((amt) => {
                                        const isSelected = tipAmount === amt;
                                        return (
                                            <button
                                                key={amt}
                                                onClick={() => onSetTipAmount(amt)}
                                                className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${isSelected ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 shadow-sm' : 'bg-elevated border border-border/50 text-muted hover:border-indigo-500/30'}`}
                                            >
                                                {amt === 0 ? (lang === 'ar' ? 'بدون' : '0') : `+${amt}`}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {tipAmount > 0 && (
                                <div className="flex justify-between text-[10px] font-black text-cyan-500 uppercase tracking-widest bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-1.5">
                                    <span>{lang === 'ar' ? 'الإكرامية المضافة' : 'Added Tip'}</span>
                                    <span>{currencySymbol}{tipAmount.toFixed(2)}</span>
                                </div>
                            )}
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
