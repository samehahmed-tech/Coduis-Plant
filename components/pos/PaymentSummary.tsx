import React from 'react';
import { Banknote, CreditCard, Smartphone, Landmark, Calculator, Trash, Wallet, Zap } from 'lucide-react';
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
    canSubmit: boolean;
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
    canSubmit,
}) => {
    const paymentMethods = [
        { id: PaymentMethod.CASH, label: t.cash, icon: Banknote },
        { id: PaymentMethod.VISA, label: t.visa, icon: CreditCard },
        { id: PaymentMethod.VODAFONE_CASH, label: t.v_cash, icon: Smartphone },
        { id: PaymentMethod.INSTAPAY, label: t.insta, icon: Landmark },
        { id: PaymentMethod.SPLIT, label: t.split, icon: Calculator },
    ];

    return (
        <div className="p-4 md:p-6 xl:p-8 bg-elevated dark:bg-elevated/30 border-t border-border/50 space-y-4 md:space-y-6 lg:space-y-8 shrink-0">
            <div className="space-y-3 md:space-y-4">
                <h4 className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    {t.payment_method}
                </h4>
                <div className="grid grid-cols-5 gap-2 md:gap-3">
                    {paymentMethods.map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => {
                                onSetPaymentMethod(btn.id);
                                if (btn.id === PaymentMethod.SPLIT) onShowSplitModal();
                            }}
                            className={`flex flex-col items-center justify-center gap-1.5 md:gap-2.5 rounded-xl md:rounded-3xl border-2 transition-all active:scale-95 ${paymentMethod === btn.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-card border-border/50 text-muted hover:border-primary/30'} ${isTouchMode ? 'py-5 md:py-6' : 'py-3 md:py-4'}`}
                        >
                            <btn.icon size={isTouchMode ? 24 : 16} className="md:w-5 md:h-5" />
                            <span className={`${isTouchMode ? 'text-xs' : 'text-[8px] md:text-[9px]'} font-black uppercase tracking-tight text-center`}>
                                {btn.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5 md:space-y-2.5">
                <div className="flex justify-between text-[10px] md:text-xs font-bold text-muted uppercase tracking-wider px-1">
                    <span>{t.subtotal}</span>
                    <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-[10px] md:text-xs font-bold text-green-600 uppercase tracking-wider px-1">
                        <span>{t.discount} ({discount}%)</span>
                        <span>-{currencySymbol}{(subtotal * discount / 100).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-[10px] md:text-xs font-bold text-muted uppercase tracking-wider px-1">
                    <span>{t.tax}</span>
                    <span>{currencySymbol}{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl md:text-2xl xl:text-3xl font-black text-main pt-2 border-t border-border/50">
                    <span>{t.total}</span>
                    <span>{currencySymbol}{total.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex gap-3 md:gap-4">
                <button
                    onClick={onVoid}
                    className="flex-1 py-3 md:py-5 bg-card dark:bg-elevated/50 text-muted rounded-xl md:rounded-[1.5rem] font-black text-[10px] md:text-sm uppercase tracking-wider hover:bg-danger/10 hover:text-danger transition-all flex items-center justify-center gap-2 border border-border/50"
                >
                    <Trash size={14} className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden sm:inline">{t.void}</span>
                </button>
                <button
                    onClick={onQuickPay}
                    disabled={!canSubmit}
                    title="Quick Pay (Cash)"
                    className="p-3 md:p-5 bg-emerald-500 text-white rounded-xl md:rounded-[1.5rem] hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center aspect-square"
                >
                    <Zap size={24} className="animate-pulse" />
                </button>
                <button
                    onClick={onSubmit}
                    disabled={!canSubmit}
                    className="flex-[2] py-3 md:py-5 bg-primary text-white rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-xl uppercase tracking-widest hover:bg-primary-hover shadow-xl shadow-primary/20 disabled:opacity-50 transition-all"
                >
                    {t.place_order}
                </button>
            </div>
        </div>
    );
};

export default PaymentSummary;
