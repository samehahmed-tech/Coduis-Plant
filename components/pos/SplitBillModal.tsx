import React, { useState } from 'react';
import { X, Calculator, Banknote, CreditCard, Smartphone, Landmark, Trash2 } from 'lucide-react';
import { PaymentMethod, PaymentRecord } from '../../types';
import { useToast } from '../Toast';

interface SplitBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    currencySymbol: string;
    lang: 'en' | 'ar';
    t: any;
    splitPayments: PaymentRecord[];
    onAddPayment: (method: PaymentMethod) => void;
    onRemovePayment: (index: number) => void;
    onUpdateAmount: (index: number, amount: number) => void;
    onSetPayments: (payments: PaymentRecord[]) => void;
}

const SplitBillModal: React.FC<SplitBillModalProps> = ({
    isOpen,
    onClose,
    total,
    currencySymbol,
    lang,
    t,
    splitPayments,
    onAddPayment,
    onRemovePayment,
    onUpdateAmount,
    onSetPayments,
}) => {
    const [peopleCount, setPeopleCount] = useState(2);
    const { showToast } = useToast();
    const currentSum = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = total - currentSum;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-border">
                <div className="p-8 border-b border-border bg-elevated/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary text-white rounded-2xl shadow-xl">
                            <Calculator size={28} />
                        </div>
                        <h3 className="text-2xl font-black text-main uppercase tracking-tight">
                            {t.split_bill}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-elevated rounded-full transition-colors text-muted">
                        <X size={28} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                    <div className="bg-primary/5 p-6 rounded-3xl flex justify-between items-center border border-primary/10 shadow-sm">
                        <span className="text-xs font-black text-primary uppercase tracking-widest">
                            {lang === 'ar' ? 'إجمالي الفاتورة' : 'Bill Total'}
                        </span>
                        <span className="text-3xl font-black text-primary">
                            {currencySymbol}{total.toFixed(2)}
                        </span>
                    </div>

                    <div className="bg-card border border-border rounded-3xl p-4 flex flex-col md:flex-row items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                                {lang === 'ar' ? 'تقسيم حسب الأشخاص' : 'Split by People'}
                            </span>
                            <input
                                type="number"
                                min={2}
                                value={peopleCount}
                                onChange={(e) => setPeopleCount(Math.max(2, Number(e.target.value) || 2))}
                                className="w-20 py-2 px-3 rounded-xl bg-app border border-border text-center font-black text-sm"
                            />
                        </div>
                        <button
                            onClick={() => {
                                const n = Math.max(2, peopleCount || 2);
                                const base = Math.floor((total / n) * 100) / 100;
                                const payments: PaymentRecord[] = Array.from({ length: n }).map((_, i) => ({
                                    method: PaymentMethod.CASH,
                                    amount: i === n - 1 ? Number((total - base * (n - 1)).toFixed(2)) : base
                                }));
                                onSetPayments(payments);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-primary-hover transition-all"
                        >
                            {lang === 'ar' ? 'تقسيم بالتساوي' : 'Split Evenly'}
                        </button>
                    </div>


                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-muted tracking-widest px-1">
                            {lang === 'ar' ? 'دفعات مضافة' : 'Added Payments'}
                        </h4>
                        {splitPayments.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-card rounded-[1.5rem] border border-border animate-in slide-in-from-top-4 transition-all hover:border-primary/40">
                                <div className="p-3 bg-app rounded-xl shadow-sm text-primary">
                                    {p.method === PaymentMethod.CASH && <Banknote size={20} />}
                                    {p.method === PaymentMethod.VISA && <CreditCard size={20} />}
                                    {p.method === PaymentMethod.VODAFONE_CASH && <Smartphone size={20} />}
                                    {p.method === PaymentMethod.INSTAPAY && <Landmark size={20} />}
                                </div>
                                <span className="flex-1 text-xs font-black uppercase tracking-tight text-main">
                                    {p.method.replace('_', ' ')}
                                </span>
                                <div className="relative w-40">
                                    <span className={`absolute top-1/2 -translate-y-1/2 text-muted text-sm font-bold ${lang === 'ar' ? 'left-4' : 'left-3'} `}>
                                        {currencySymbol}
                                    </span>
                                    <input
                                        type="number"
                                        value={p.amount}
                                        onChange={(e) => onUpdateAmount(idx, parseFloat(e.target.value) || 0)}
                                        className={`w-full py-3 rounded-2xl bg-app border-none outline-none font-black text-base shadow-sm text-main ${lang === 'ar' ? 'pl-10 pr-4 text-left' : 'pl-8 pr-4 text-right'} `}
                                    />
                                </div>
                                <button onClick={() => onRemovePayment(idx)} className="text-muted/20 hover:text-danger transition-all p-2">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                        {splitPayments.length === 0 && (
                            <p className="text-center text-muted text-sm font-bold py-10 italic">
                                {lang === 'ar' ? 'أضف طرق دفع لتقسيم الفاتورة...' : 'Add payment methods below to split the bill...'}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { id: PaymentMethod.CASH, icon: Banknote },
                            { id: PaymentMethod.VISA, icon: CreditCard },
                            { id: PaymentMethod.VODAFONE_CASH, icon: Smartphone },
                            { id: PaymentMethod.INSTAPAY, icon: Landmark }
                        ].map(m => (
                            <button key={m.id} onClick={() => onAddPayment(m.id)} className="p-5 rounded-3xl bg-app text-muted hover:bg-primary hover:text-white transition-all flex items-center justify-center shadow-sm">
                                <m.icon size={28} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-8 border-t border-border bg-elevated/50 space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted">{t.remaining}</span>
                        <span className={`text-lg ${remaining > 0.01 ? 'text-danger' : 'text-success'} `}>
                            {currencySymbol}{remaining.toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            if (Math.abs(remaining) < 0.01) onClose();
                            else showToast(lang === 'ar' ? 'المجموع غير مطابق!' : "Payment sum doesn't match total!", 'error');
                        }}
                        className="w-full py-5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-hover shadow-2xl shadow-primary/20 transition-all"
                    >
                        {lang === 'ar' ? 'تأكيد التقسيم' : 'Confirm Split'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SplitBillModal;
