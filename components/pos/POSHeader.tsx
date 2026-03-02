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
        <div className="h-12 md:h-14 bg-card/60 backdrop-blur-3xl border-b border-white/10 dark:border-white/5 flex justify-between items-center px-4 py-1.5 z-20 shrink-0 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none mix-blend-overlay" />
            <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            {/* Left: Order type context */}
            <div className="flex items-center gap-3 min-w-0 overflow-hidden relative z-10 transition-all">
                {activeMode === OrderType.DINE_IN && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] md:text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 uppercase tracking-widest drop-shadow-sm">{t.dine_in}</span>
                        {selectedTableId ? (
                            <div className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-[0.8rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                {t.table} {selectedTableId}
                                <button onClick={onClearTable} className="hover:text-rose-500 hover:bg-rose-500/10 p-0.5 rounded-md transition-all active:scale-95"><X size={12} /></button>
                            </div>
                        ) : (
                            <span className="text-[8px] md:text-[9px] text-muted font-black uppercase tracking-[0.2em] animate-pulse bg-elevated/50 px-2 py-1 rounded-lg border border-border/50">{t.select_table}</span>
                        )}
                    </div>
                )}
                {activeMode === OrderType.TAKEAWAY && (
                    <span className="text-[11px] md:text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500 uppercase tracking-widest flex items-center gap-1.5 drop-shadow-sm">
                        <ShoppingBag size={14} className="text-emerald-500" />{t.takeaway}
                    </span>
                )}
                {activeMode === OrderType.PICKUP && (
                    <span className="text-[11px] md:text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500 uppercase tracking-widest flex items-center gap-1.5 drop-shadow-sm">
                        <ShoppingBag size={14} className="text-cyan-500" />{t.pickup || 'Pickup'}
                    </span>
                )}
                {activeMode === OrderType.DELIVERY && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] md:text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 uppercase tracking-widest flex items-center gap-1.5 drop-shadow-sm">
                            <Building2 size={14} className="text-orange-500" />{t.delivery}
                        </span>
                        {deliveryCustomer ? (
                            <div className="px-2.5 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-[0.8rem] text-[9px] md:text-[10px] font-black flex items-center gap-1.5 max-w-[140px] shadow-sm uppercase tracking-widest">
                                <span className="truncate">{deliveryCustomer.name}</span>
                                <button onClick={onClearCustomer} className="shrink-0 hover:text-rose-500 hover:bg-rose-500/10 p-0.5 rounded-md transition-all active:scale-95"><X size={12} /></button>
                            </div>
                        ) : (
                            <span className="text-[8px] md:text-[9px] text-muted font-black uppercase tracking-[0.2em] animate-pulse bg-elevated/50 px-2 py-1 rounded-lg border border-border/50">{t.select_customer}</span>
                        )}
                    </div>
                )}

                <div className="h-5 w-[1px] bg-border/50 mx-1 hidden sm:block rounded-full" />

                {/* Price list selector */}
                <div className="hidden sm:flex items-center gap-1.5 bg-card/60 rounded-[0.8rem] px-2.5 py-1 border border-border/50 shadow-inner transition-all hover:border-indigo-500/30">
                    <Tag size={12} className="text-indigo-500 shrink-0" />
                    <select
                        value={activePriceListId || 'standard'}
                        onChange={(e) => onSetPriceList(e.target.value === 'standard' ? null : e.target.value)}
                        className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer text-main appearance-none pr-1"
                    >
                        <option value="standard">{isRTL ? 'تسعير قياسي' : 'Standard'}</option>
                        <option value="delivery">{isRTL ? 'توصيل' : 'Delivery'}</option>
                        <option value="vip">VIP</option>
                    </select>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5 shrink-0 relative z-10">
                {onRecall && (
                    <button
                        onClick={onRecall}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-card/60 text-muted rounded-[0.8rem] transition-all text-[9px] font-black uppercase tracking-widest border border-border/50 hover:text-indigo-500 hover:border-indigo-500/30 hover:bg-indigo-500/5 shadow-inner active:scale-95"
                        title="Recall Last Order"
                    >
                        <RotateCcw size={12} />
                        <span className="hidden lg:inline">{t.recall || 'Recall'}</span>
                    </button>
                )}

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card/60 border border-border/50 rounded-[0.8rem] shadow-inner">
                    {isOnline ? (
                        <div className="flex items-center gap-1 text-emerald-500">
                            <Cloud size={12} />
                            <span className="text-[8px] font-black tracking-widest uppercase">Live</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-rose-500 animate-pulse">
                            <CloudOff size={12} />
                            <span className="text-[8px] font-black tracking-widest uppercase">Local</span>
                        </div>
                    )}
                </div>

                <div className="w-10 h-10 rounded-[1.2rem] bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/25 border border-white/20">
                    A
                </div>
            </div>
        </div>
    );
});

export default POSHeader;
