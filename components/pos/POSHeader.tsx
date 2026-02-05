import React from 'react';
import { ShoppingBag, Building2, X, RotateCcw } from 'lucide-react';
import { OrderType, Customer } from '../../types';
import { Tag, Cloud, CloudOff } from 'lucide-react';

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
    onRecall?: () => void;
    activePriceListId: string | null;
    onSetPriceList: (id: string | null) => void;
    isOnline: boolean;
}

const POSHeader: React.FC<POSHeaderProps> = React.memo(({
    activeMode,
    lang,
    t,
    selectedTableId,
    onClearTable,
    deliveryCustomer,
    onClearCustomer,
    isSidebarCollapsed,
    isTouchMode,
    onRecall,
    activePriceListId,
    onSetPriceList,
    isOnline,
}) => {
    return (
        <div className={`min-h-14 md:min-h-20 bg-card border-b border-border flex justify-between items-center px-4 md:px-8 py-2 md:py-0 z-20 transition-all duration-300 flex-wrap gap-3`}>

            <div className="flex flex-wrap items-center gap-4 min-w-0">
                {activeMode === OrderType.DINE_IN && (
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-main uppercase tracking-tighter">
                            {t.dine_in}
                        </span>
                        {selectedTableId ? (
                            <div className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black flex items-center gap-2">
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

                {activeMode === OrderType.PICKUP && (
                    <span className="text-xl font-black text-teal-600 uppercase tracking-tighter flex items-center gap-2">
                        <ShoppingBag size={24} />
                        {t.pickup || (lang === 'ar' ? 'استلام' : 'Pickup')}
                    </span>
                )}

                {activeMode === OrderType.DELIVERY && (
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-orange-600 uppercase tracking-tighter flex items-center gap-2">
                            <Building2 size={24} />
                            {t.delivery}
                        </span>
                        {deliveryCustomer ? (
                            <div className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black flex items-center gap-2">
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

                <div className="h-8 w-[1px] bg-border/50 mx-2 hidden sm:block" />

                {/* Price List Selector */}
                <div className="flex items-center gap-2 bg-app rounded-xl px-3 py-1.5 border border-border/50 group hover:border-primary/30 transition-all cursor-pointer relative">
                    <Tag size={14} className="text-primary" />
                    <select
                        value={activePriceListId || 'standard'}
                        onChange={(e) => onSetPriceList(e.target.value === 'standard' ? null : e.target.value)}
                        className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-main appearance-none pr-4"
                    >
                        <option value="standard">Standard Pricing</option>
                        <option value="delivery">Delivery Rates</option>
                        <option value="vip">VIP Membership</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {onRecall && (
                    <button
                        onClick={onRecall}
                        className="flex items-center gap-2 px-4 py-2 bg-elevated dark:bg-elevated/50 hover:bg-card dark:hover:bg-card text-muted rounded-xl transition-all text-xs font-black uppercase tracking-widest"
                        title="Recall Last Order"
                    >
                        <RotateCcw size={14} />
                        <span className="hidden lg:inline">{t.recall || 'Recall'}</span>
                    </button>
                )}
                <span className="text-[10px] font-black text-muted uppercase tracking-widest hidden md:block">
                    {lang === 'ar' ? 'الموظف: أدمن' : 'User: Admin'}
                </span>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl">
                    {isOnline ? (
                        <div className="flex items-center gap-1.5 text-success">
                            <Cloud size={14} />
                            <span className="text-[8px] font-black uppercase">Live</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-danger animate-pulse">
                            <CloudOff size={14} />
                            <span className="text-[8px] font-black uppercase">Local</span>
                        </div>
                    )}
                </div>

                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    A
                </div>
            </div>
        </div>
    );
});

export default POSHeader;
