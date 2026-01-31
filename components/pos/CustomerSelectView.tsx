import React from 'react';
import { Users } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerSelectViewProps {
    customers: Customer[];
    onSelectCustomer: (customer: Customer) => void;
    lang: 'en' | 'ar';
}

const CustomerSelectView: React.FC<CustomerSelectViewProps> = ({
    customers,
    onSelectCustomer,
    lang,
}) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-10">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl text-center">
                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                    {lang === 'ar' ? 'اختر عميل' : 'Select Customer'}
                </h2>
                <p className="text-slate-400 text-sm mb-8">
                    {lang === 'ar' ? 'طلبات التوصيل تتطلب تحديد عميل.' : 'Delivery orders require a customer.'}
                </p>

                <div className="space-y-3">
                    {customers.length > 0 ? customers.map(c => (
                        <button key={c.id} onClick={() => onSelectCustomer(c)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 flex items-center justify-between group transition-colors">
                            <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600">{c.name}</span>
                            <span className="text-xs text-slate-400">{c.phone}</span>
                        </button>
                    )) : (
                        <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase">
                            {lang === 'ar' ? 'لا يوجد عملاء' : 'No Customers Found'}
                        </div>
                    )}

                    <button className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors">
                        {lang === 'ar' ? '+ إضافة عميل جديد' : '+ Create New Guest'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerSelectView;
