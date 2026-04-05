import React, { useState } from 'react';
import { Banknote, CreditCard, Smartphone, Landmark, Calculator, Trash, ChefHat, ChevronDown, Tag, HandCoins } from 'lucide-react';
import { PaymentMethod } from '../../types';

interface PaymentSummaryProps {
    subtotal: number;
    discount: number;
    discountAmount?: number;
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
    itemCount?: number;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
    subtotal = 0, discount = 0, discountAmount = 0, tax = 0, total = 0, currencySymbol, paymentMethod, onSetPaymentMethod, onShowSplitModal,
    isTouchMode, lang, t, tipAmount = 0, onSetTipAmount, onVoid, onSubmit, onQuickPay, onSendKitchen,
    canSubmit, couponCode, activeCoupon, isApplyingCoupon, onCouponCodeChange, onApplyCoupon, onClearCoupon, itemCount = 0
}) => {
    const [openSection, setOpenSection] = useState<'methods' | 'tips' | 'coupon' | null>(null);
    const [amountTendered, setAmountTendered] = useState<number>(0);
    const toggleSection = (section: 'methods' | 'tips' | 'coupon') => setOpenSection(p => p === section ? null : section);
    const changeDue = amountTendered > 0 ? amountTendered - total : 0;

    const paymentMethodsList = [
        { id: PaymentMethod.CASH, label: t.cash, icon: Banknote },
        { id: PaymentMethod.VISA, label: t.visa, icon: CreditCard },
        { id: PaymentMethod.VODAFONE_CASH, label: t.v_cash, icon: Smartphone },
        { id: PaymentMethod.INSTAPAY, label: t.insta, icon: Landmark },
        { id: PaymentMethod.SPLIT, label: t.split, icon: Calculator },
    ];

    const isAr = lang === 'ar';
    const activeMethodLabel = paymentMethodsList.find(m => m.id === paymentMethod)?.label.split(' ')[0] || t.cash;

    return (
        <div className="space-y-2.5 shrink-0 flex flex-col pt-0.5">
            {/* Breakdown */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-muted">
                    <span className="flex items-center gap-1">
                        {t.subtotal} <b className="text-main tabular-nums bg-elevated/40 px-1.5 py-0.5 rounded border border-border/15">{subtotal.toFixed(2)}</b>
                    </span>
                    <span className="flex items-center gap-1 opacity-70">
                        {t.tax} <b className="tabular-nums">{tax.toFixed(2)}</b>
                    </span>
                </div>
                {discount > 0 && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-success bg-success/8 px-1.5 py-0.5 rounded flex items-center gap-1 border border-success/15">
                        {t.discount} <b className="tabular-nums">-{discountAmount.toFixed(2)}</b>
                    </span>
                )}
            </div>

            {/* Action Toggles */}
            <div className="flex gap-1.5">
                <button
                    onClick={() => toggleSection('methods')}
                    className={`flex-[2] h-9 flex items-center justify-between px-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-colors active:scale-[0.97] ${openSection === 'methods' ? 'bg-primary text-white border-primary' : 'bg-elevated/40 border-border/15 text-muted hover:text-main'}`}
                >
                    <div className="flex items-center gap-1.5">
                        <Banknote size={12} />
                        <span className="truncate max-w-[100px]">{isAr ? `دفع: ${activeMethodLabel}` : `Pay ${activeMethodLabel}`}</span>
                    </div>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${openSection === 'methods' ? 'rotate-180' : ''}`} />
                </button>

                <button
                    onClick={() => setOpenSection(openSection === 'tips' || openSection === 'coupon' ? null : 'tips')}
                    className={`flex-1 h-9 flex items-center justify-between px-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-colors active:scale-[0.97] ${(openSection === 'tips' || openSection === 'coupon' || activeCoupon || tipAmount > 0) ? 'bg-primary text-white border-primary' : 'bg-elevated/40 border-border/15 text-muted hover:text-main'}`}
                >
                    <div className="flex items-center gap-1.5">
                        <Tag size={12} />
                        <span className="truncate">{isAr ? 'إضافات' : 'Extras'}</span>
                    </div>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${openSection === 'tips' || openSection === 'coupon' ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Sub-tabs for Extras */}
            {(openSection === 'tips' || openSection === 'coupon') && (
                <div className="flex bg-elevated/40 p-1 rounded-xl border border-border/15 gap-1">
                    <button 
                        onClick={() => setOpenSection('tips')}
                        className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${openSection === 'tips' ? 'bg-card text-main shadow-sm' : 'text-muted'}`}
                    >
                        {isAr ? 'إكرامية' : 'Tips'} {tipAmount > 0 ? `(${tipAmount})` : ''}
                    </button>
                    <button 
                        onClick={() => setOpenSection('coupon')}
                        className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${openSection === 'coupon' ? 'bg-card text-main shadow-sm' : 'text-muted'}`}
                    >
                        {isAr ? 'خصم' : 'Discount'} {activeCoupon ? '✓' : ''}
                    </button>
                </div>
            )}

            {/* Expanded Panels */}
            {openSection === 'methods' && (
                <div className="flex bg-elevated/30 rounded-xl p-1 gap-0.5 border border-border/15 animate-fade-in">
                    {paymentMethodsList.map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => {
                                onSetPaymentMethod(btn.id);
                                if (btn.id === PaymentMethod.SPLIT) onShowSplitModal();
                                setOpenSection(null);
                            }}
                            className={`flex flex-col flex-1 items-center justify-center py-1.5 px-1 rounded-lg transition-colors active:scale-95 ${paymentMethod === btn.id ? 'bg-card text-main shadow ring-1 ring-border/20' : 'text-muted hover:text-main hover:bg-elevated/60'}`}
                        >
                            <btn.icon size={14} />
                            <span className="text-[8px] font-bold uppercase tracking-wider mt-1 leading-none truncate w-full text-center">{btn.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            )}

            {openSection === 'tips' && (
                <div className="flex bg-elevated/30 rounded-xl p-1 gap-0.5 border border-border/15 animate-fade-in">
                    {[0, Math.round(subtotal * 0.05), Math.round(subtotal * 0.1), Math.round(subtotal * 0.15)].map((amt, i) => (
                        <button
                            key={amt}
                            onClick={() => { onSetTipAmount(amt); setOpenSection(null); }}
                            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors active:scale-95 ${tipAmount === amt ? 'bg-card text-primary shadow ring-1 ring-border/20' : 'text-muted hover:text-main hover:bg-elevated/60'}`}
                        >
                            <span className="text-xs font-extrabold tabular-nums leading-none">{amt === 0 ? '0' : `+${amt}`}</span>
                            {i > 0 && <span className="text-[7px] font-bold mt-0.5 uppercase opacity-60">{i * 5}%</span>}
                        </button>
                    ))}
                </div>
            )}

            {openSection === 'coupon' && (
                <div className="flex gap-1.5 animate-fade-in">
                    <div className="flex-1 flex items-center bg-elevated/30 border border-border/15 rounded-xl px-2.5 shadow-inner focus-within:ring-2 focus-within:ring-primary/15 transition-all h-9">
                        <Tag size={12} className="text-muted mr-1.5" />
                        <input
                            type="text" placeholder={isAr ? 'أدخل كود الكوبون' : 'Discount Code'}
                            value={couponCode} onChange={(e) => onCouponCodeChange(e.target.value)}
                            className="w-full bg-transparent text-xs font-bold outline-none uppercase placeholder:text-muted/50"
                        />
                    </div>
                    <button
                        onClick={activeCoupon ? onClearCoupon : onApplyCoupon}
                        disabled={isApplyingCoupon || (!activeCoupon && !couponCode)}
                        className={`shrink-0 w-20 rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center justify-center transition-colors disabled:opacity-40 h-9 ${activeCoupon ? 'bg-rose-500/8 text-rose-500 hover:bg-rose-500/15' : 'bg-card text-main border border-border/20 hover:bg-elevated'}`}
                    >
                        {activeCoupon ? (isAr ? 'حذف' : 'Remove') : (isApplyingCoupon ? '...' : (isAr ? 'تطبيق' : 'Apply'))}
                    </button>
                </div>
            )}

            {/* Cash tender */}
            {paymentMethod === PaymentMethod.CASH && total > 0 && (
                <div className="bg-elevated/30 border border-border/15 rounded-xl p-2.5 space-y-1.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-muted">{isAr ? 'المبلغ المدفوع' : 'Tendered'}</span>
                        {amountTendered > 0 && <button onClick={() => setAmountTendered(0)} className="text-[8px] font-bold text-rose-500 hover:text-rose-600 uppercase transition-colors">{isAr ? 'مسح' : 'Clear'}</button>}
                    </div>
                    <div className="flex gap-1">
                        {[50, 100, 200, 500].map(amt => (
                            <button
                                key={amt} onClick={() => setAmountTendered(amt)}
                                className={`flex-1 h-8 rounded-lg text-xs font-bold transition-colors active:scale-95 border ${amountTendered === amt ? 'bg-primary text-white border-primary shadow-sm' : 'bg-card text-muted hover:text-main border-border/20'}`}
                            >
                                {amt}
                            </button>
                        ))}
                        <button
                            onClick={() => setAmountTendered(Math.ceil(total))}
                            className={`flex-1 h-8 rounded-lg text-[10px] font-bold transition-colors active:scale-95 border ${amountTendered === Math.ceil(total) ? 'bg-success text-white border-success shadow-sm' : 'bg-card border-border/20 text-success'}`}
                        >
                            {isAr ? 'بالضبط' : 'Exact'}
                        </button>
                    </div>
                    {amountTendered > 0 && (
                        <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${changeDue >= 0 ? 'bg-success/8 border-success/15' : 'bg-rose-500/8 border-rose-500/15'}`}>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${changeDue >= 0 ? 'text-success' : 'text-rose-500'}`}>
                                {changeDue >= 0 ? (isAr ? 'الباقي' : 'Change') : (isAr ? 'ناقص' : 'Short')}
                            </span>
                            <span className={`text-base font-extrabold tabular-nums ${changeDue >= 0 ? 'text-success' : 'text-rose-500'}`}>
                                {Math.abs(changeDue).toFixed(2)} <span className="text-[9px] uppercase opacity-60">{currencySymbol}</span>
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-1.5 pt-0.5">
                <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                        onClick={onSendKitchen} disabled={!canSubmit}
                        className="w-11 h-full bg-elevated/40 border border-border/15 text-muted hover:text-primary hover:bg-primary/8 rounded-xl flex items-center justify-center disabled:opacity-30 transition-colors"
                        title={t.send_kitchen}
                    >
                        <ChefHat size={20} />
                    </button>
                </div>

                <button
                    onClick={onSubmit} disabled={!canSubmit}
                    className="flex-1 h-14 bg-primary hover:bg-primary-hover text-white rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:hover:translate-y-0 transition-all relative overflow-hidden group will-change-transform"
                >
                    <span className="font-extrabold text-base md:text-lg uppercase tracking-wider z-10">{isAr ? 'دفع' : 'Pay'}</span>
                    <div className="flex items-center gap-1 z-10">
                        <span className="text-xl md:text-2xl font-extrabold tabular-nums tracking-tight">{total.toFixed(2)}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider leading-none mt-1.5 opacity-70">{currencySymbol}</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default PaymentSummary;
