import React from 'react';
import { X, Calculator, Banknote, CreditCard, Smartphone, Landmark, Trash2 } from 'lucide-react';
import { PaymentMethod, PaymentRecord } from '../../types';

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
}) => {
    if (!isOpen) return null;

    const currentSum = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = total - currentSum;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl">
                            <Calculator size={28} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {t.split_bill}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                        <X size={28} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl flex justify-between items-center border border-indigo-100 dark:border-indigo-800 shadow-sm">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                            {lang === 'ar' ? 'إجمالي الفاتورة' : 'Bill Total'}
                        </span>
                        <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300">
                            {currencySymbol}{total.toFixed(2)}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                            {lang === 'ar' ? 'دفعات مضافة' : 'Added Payments'}
                        </h4>
                        {splitPayments.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-4 transition-all hover:border-indigo-100">
                                <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-indigo-600">
                                    {p.method === PaymentMethod.CASH && <Banknote size={20} />}
                                    {p.method === PaymentMethod.VISA && <CreditCard size={20} />}
                                    {p.method === PaymentMethod.VODAFONE_CASH && <Smartphone size={20} />}
                                    {p.method === PaymentMethod.INSTAPAY && <Landmark size={20} />}
                                </div>
                                <span className="flex-1 text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">
                                    {p.method.replace('_', ' ')}
                                </span>
                                <div className="relative w-40">
                                    <span className={`absolute top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold ${lang === 'ar' ? 'left-4' : 'left-3'} `}>
                                        {currencySymbol}
                                    </span>
                                    <input
                                        type="number"
                                        value={p.amount}
                                        onChange={(e) => onUpdateAmount(idx, parseFloat(e.target.value) || 0)}
                                        className={`w-full py-3 rounded-2xl bg-white dark:bg-slate-900 border-none outline-none font-black text-base shadow-sm ${lang === 'ar' ? 'pl-10 pr-4 text-left' : 'pl-8 pr-4 text-right'} `}
                                    />
                                </div>
                                <button onClick={() => onRemovePayment(idx)} className="text-slate-200 hover:text-red-500 transition-all p-2">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                        {splitPayments.length === 0 && (
                            <p className="text-center text-slate-400 text-sm font-bold py-10 italic">
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
                            <button key={m.id} onClick={() => onAddPayment(m.id)} className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                                <m.icon size={28} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">{t.remaining}</span>
                        <span className={`text-lg ${remaining > 0.01 ? 'text-red-500' : 'text-green-500'} `}>
                            {currencySymbol}{remaining.toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            if (Math.abs(remaining) < 0.01) onClose();
                            else alert(lang === 'ar' ? 'المجموع غير مطابق!' : "Payment sum doesn't match total!");
                        }}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/20 transition-all"
                    >
                        {lang === 'ar' ? 'تأكيد التقسيم' : 'Confirm Split'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SplitBillModal;
