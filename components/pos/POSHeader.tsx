import React from 'react';
import { ShoppingBag, Building2, X } from 'lucide-react';
import { OrderType, Customer } from '../../types';

interface POSHeaderProps {
    activeMode: OrderType;
    lang: 'en' | 'ar';
    t: any;
    selectedTableId: string | null;
    onClearTable: () => void;
    deliveryCustomer: Customer | null;
    onClearCustomer: () => void;
    isSidebarCollapsed: boolean;
    isTouchMode: boolean;
}

const POSHeader: React.FC<POSHeaderProps> = ({
    activeMode,
    lang,
    t,
    selectedTableId,
    onClearTable,
    deliveryCustomer,
    onClearCustomer,
    isSidebarCollapsed,
    isTouchMode,
}) => {
    const sideClasses = lang === 'ar'
        ? `left-0 ${isSidebarCollapsed ? 'lg:right-16' : (isTouchMode ? 'lg:right-80' : 'lg:right-64')} right-0`
        : `right-0 ${isSidebarCollapsed ? 'lg:left-16' : (isTouchMode ? 'lg:left-80' : 'lg:left-64')} left-0`;

    return (
        <div className={`fixed top-0 h-14 md:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 md:px-6 z-20 ${sideClasses} transition-all duration-300`}>

            <div className="flex items-center gap-4">
                {activeMode === OrderType.DINE_IN && (
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                            {t.dine_in}
                        </span>
                        {selectedTableId ? (
                            <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black flex items-center gap-2">
                                {t.table} {selectedTableId}
                                <button onClick={onClearTable} className="hover:text-red-600">
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                                {t.select_table}
                            </span>
                        )}
                    </div>
                )}

                {activeMode === OrderType.TAKEAWAY && (
                    <span className="text-xl font-black text-emerald-600 uppercase tracking-tighter flex items-center gap-2">
                        <ShoppingBag size={24} />
                        {t.takeaway}
                    </span>
                )}

                {activeMode === OrderType.DELIVERY && (
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-orange-600 uppercase tracking-tighter flex items-center gap-2">
                            <Building2 size={24} />
                            {t.delivery}
                        </span>
                        {deliveryCustomer ? (
                            <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs font-black flex items-center gap-2">
                                {deliveryCustomer.name}
                                <button onClick={onClearCustomer} className="hover:text-red-600">
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                                {t.select_customer}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
                    {lang === 'ar' ? 'الموظف: أدمن' : 'User: Admin'}
                </span>
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    A
                </div>
            </div>
        </div>
    );
};

export default POSHeader;
