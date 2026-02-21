import React from 'react';
import { ShoppingBag, Building2, X, RotateCcw, Tag, Cloud, CloudOff } from 'lucide-react';
import { OrderType, Customer } from '../../types';

interface POSHeaderProps {
    activeMode: OrderType;
    lang: 'en' | 'ar';
    t: any;
    selectedTableId: string | null;
    onClearTable: () => void;
    deliveryCustomer: Customer | null;
    onClearCustomer: () => void;
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
    isTouchMode,
    onRecall,
    activePriceListId,
    onSetPriceList,
    isOnline,
}) => {
    const isRTL = lang === 'ar';

    return (
        <div className="h-11 md:h-12 bg-card border-b border-border/60 flex justify-between items-center px-2 md:px-4 py-1 z-20 shrink-0">
            {/* Left: Order type context */}
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                {activeMode === OrderType.DINE_IN && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-main uppercase tracking-tight">{t.dine_in}</span>
                        {selectedTableId ? (
                            <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-black flex items-center gap-1">
                                {t.table} {selectedTableId}
                                <button onClick={onClearTable} className="hover:text-red-500 transition-colors"><X size={10} /></button>
                            </div>
                        ) : (
                            <span className="text-[9px] text-muted font-bold uppercase tracking-widest animate-pulse">{t.select_table}</span>
                        )}
                    </div>
                )}
                {activeMode === OrderType.TAKEAWAY && (
                    <span className="text-sm font-black text-emerald-600 uppercase tracking-tight flex items-center gap-1.5">
                        <ShoppingBag size={15} />{t.takeaway}
                    </span>
                )}
                {activeMode === OrderType.PICKUP && (
                    <span className="text-sm font-black text-teal-600 uppercase tracking-tight flex items-center gap-1.5">
                        <ShoppingBag size={15} />{t.pickup || 'Pickup'}
                    </span>
                )}
                {activeMode === OrderType.DELIVERY && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-orange-600 uppercase tracking-tight flex items-center gap-1.5">
                            <Building2 size={15} />{t.delivery}
                        </span>
                        {deliveryCustomer ? (
                            <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-black flex items-center gap-1 max-w-[140px]">
                                <span className="truncate">{deliveryCustomer.name}</span>
                                <button onClick={onClearCustomer} className="hover:text-red-500 shrink-0"><X size={10} /></button>
                            </div>
                        ) : (
                            <span className="text-[9px] text-muted font-bold uppercase tracking-widest animate-pulse">{t.select_customer}</span>
                        )}
                    </div>
                )}

                <div className="h-5 w-px bg-border/40 mx-0.5 hidden sm:block" />

                {/* Price list selector */}
                <div className="hidden sm:flex items-center gap-1.5 bg-elevated/50 rounded-lg px-2 py-1 border border-border/30">
                    <Tag size={11} className="text-primary shrink-0" />
                    <select
                        value={activePriceListId || 'standard'}
                        onChange={(e) => onSetPriceList(e.target.value === 'standard' ? null : e.target.value)}
                        className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer text-main appearance-none"
                    >
                        <option value="standard">{isRTL ? 'تسعير قياسي' : 'Standard'}</option>
                        <option value="delivery">{isRTL ? 'توصيل' : 'Delivery'}</option>
                        <option value="vip">VIP</option>
                    </select>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
                {onRecall && (
                    <button
                        onClick={onRecall}
                        className="flex items-center gap-1.5 px-2 py-1 bg-elevated/50 text-muted rounded-lg transition-colors text-[9px] font-black uppercase tracking-wider border border-border/30 hover:text-primary"
                        title="Recall Last Order"
                    >
                        <RotateCcw size={11} />
                        <span className="hidden lg:inline">{t.recall || 'Recall'}</span>
                    </button>
                )}

                <div className="flex items-center gap-1 px-2 py-1 bg-elevated/50 border border-border/30 rounded-lg">
                    {isOnline ? (
                        <div className="flex items-center gap-1 text-success">
                            <Cloud size={11} />
                            <span className="text-[8px] font-black uppercase">Live</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-danger animate-pulse">
                            <CloudOff size={11} />
                            <span className="text-[8px] font-black uppercase">Local</span>
                        </div>
                    )}
                </div>

                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                    A
                </div>
            </div>
        </div>
    );
});

export default POSHeader;
