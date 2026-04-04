import React from 'react';
import { ShoppingBag, Building2, X, RotateCcw, Tag, Cloud, CloudOff, Compass, UtensilsCrossed, MapPin, Truck, Zap, Search } from 'lucide-react';
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
    onHomeClick?: () => void;
}

const POSHeader: React.FC<POSHeaderProps> = React.memo(({
    activeMode, lang, t, selectedTableId, onClearTable,
    deliveryCustomer, onClearCustomer, isTouchMode, onRecall,
    activePriceListId, onSetPriceList, isOnline, onHomeClick
}) => {
    const isRTL = lang === 'ar';

    const modeLabel = {
        [OrderType.DINE_IN]: { text: t.dine_in, color: 'primary', icon: UtensilsCrossed },
        [OrderType.TAKEAWAY]: { text: t.takeaway, color: 'success', icon: ShoppingBag },
        [OrderType.PICKUP]: { text: t.pickup || 'Pickup', color: 'accent', icon: MapPin },
        [OrderType.DELIVERY]: { text: t.delivery, color: 'warning', icon: Truck },
    }[activeMode] || { text: '', color: 'primary', icon: UtensilsCrossed };

    const ModeIcon = modeLabel.icon;

    return (
        <header className="pos-header-slim h-11 shrink-0 bg-white/90 backdrop-blur-xl border-b border-border/10 flex items-center justify-between px-2.5 sm:px-3 z-20 sticky top-0 will-change-transform" style={{ transform: 'translate3d(0,0,0)' }}>
            {/* Left: Home + Mode + Context */}
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                {onHomeClick && (
                    <button onClick={onHomeClick} className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-elevated/40 border border-border/8 text-muted hover:text-main hover:bg-elevated/70 transition-colors active:scale-95">
                        <Compass className="w-3.5 h-3.5" />
                    </button>
                )}

                {/* Active mode badge */}
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-${modeLabel.color}/8 border border-${modeLabel.color}/10 shrink-0`}>
                    <ModeIcon size={12} className={`text-${modeLabel.color}`} />
                    <span className={`text-[9px] font-bold uppercase tracking-wider text-${modeLabel.color}`}>{modeLabel.text}</span>
                </div>

                {/* Context badge */}
                <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar">
                    {activeMode === OrderType.DINE_IN && selectedTableId && (
                        <span className="px-2 py-0.5 bg-primary/6 text-primary border border-primary/10 rounded-lg text-[9px] font-bold flex items-center gap-1 shrink-0">
                            {t.table} {selectedTableId}
                            <button onClick={onClearTable} className="w-3.5 h-3.5 rounded-full bg-primary/15 hover:bg-rose-500 flex items-center justify-center hover:text-white transition-colors"><X size={7} /></button>
                        </span>
                    )}
                    {activeMode === OrderType.DINE_IN && !selectedTableId && (
                        <span className="text-[9px] text-muted/60 font-bold uppercase tracking-wider animate-pulse shrink-0">{t.select_table}</span>
                    )}
                    {activeMode === OrderType.DELIVERY && deliveryCustomer && (
                        <span className="px-2 py-0.5 bg-warning/6 text-warning border border-warning/10 rounded-lg text-[9px] font-bold flex items-center gap-1 max-w-[120px] shrink-0">
                            <span className="truncate">{deliveryCustomer.name}</span>
                            <button onClick={onClearCustomer} className="w-3.5 h-3.5 rounded-full bg-warning/15 hover:bg-rose-500 flex items-center justify-center hover:text-white transition-colors shrink-0"><X size={7} /></button>
                        </span>
                    )}
                    {activeMode === OrderType.DELIVERY && !deliveryCustomer && (
                        <span className="text-[9px] text-muted/60 font-bold uppercase tracking-wider animate-pulse shrink-0">{t.select_customer}</span>
                    )}
                </div>
            </div>

            {/* Right: Tools */}
            <div className="flex items-center gap-1.5 shrink-0">
                {/* Price List */}
                <div className="hidden sm:flex items-center gap-1 bg-elevated/30 hover:bg-elevated/60 border border-border/8 rounded-lg px-2 py-1 transition-colors focus-within:ring-1 ring-primary/10">
                    <Tag size={9} className="text-primary/70 shrink-0" />
                    <select
                        value={activePriceListId || 'standard'}
                        onChange={(e) => onSetPriceList(e.target.value === 'standard' ? null : e.target.value)}
                        className="bg-transparent text-[9px] font-bold uppercase tracking-wider text-main outline-none cursor-pointer appearance-none"
                    >
                        <option value="standard">{isRTL ? 'قياسي' : 'Standard'}</option>
                        <option value="delivery">{isRTL ? 'توصيل' : 'Delivery'}</option>
                        <option value="vip">VIP</option>
                    </select>
                </div>

                {/* Recall */}
                {onRecall && (
                    <button onClick={onRecall} className="hidden sm:flex items-center gap-1 px-2 py-1 bg-elevated/30 hover:bg-elevated/60 text-muted hover:text-main rounded-lg border border-border/8 transition-colors font-bold text-[9px] uppercase tracking-wider active:scale-95">
                        <RotateCcw size={10} className={isRTL ? '-scale-x-100' : ''} />
                        <span>{t.recall || 'Recall'}</span>
                    </button>
                )}

                {/* Connection */}
                <div className={`flex items-center justify-center w-6 h-6 rounded-lg border ${isOnline ? 'bg-success/5 border-success/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                    {isOnline ? <Cloud size={11} className="text-success" /> : <CloudOff size={11} className="text-rose-500 animate-pulse" />}
                </div>

                {/* Avatar */}
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-[10px] shadow-sm shadow-primary/10 shrink-0">A</div>
            </div>
        </header>
    );
});

export default POSHeader;
