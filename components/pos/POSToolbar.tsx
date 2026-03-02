/**
 * POSToolbar — Order mode pills + Total + Quick Pay
 * Clean horizontal strip with smart header showing total
 */
import React from 'react';
import {
    UtensilsCrossed, ShoppingBag, MapPin, Truck, LayoutGrid, Zap, Search
} from 'lucide-react';
import { OrderType } from '../../types';

interface POSToolbarProps {
    activeOrderType: OrderType;
    onSetOrderMode: (mode: OrderType) => void;
    lang: string;
    t: any;
    cartCount: number;
    onToggleCart: () => void;
    onShowTables: () => void;
    onShowCustomers: () => void;
    onQuickPay: () => void;
    onFocusSearch: () => void;
    hasCartItems: boolean;
    cartTotal: number;
    currencySymbol: string;
}

const modeConfig = [
    { mode: OrderType.DINE_IN, icon: UtensilsCrossed, colorActive: 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 border-transparent' },
    { mode: OrderType.TAKEAWAY, icon: ShoppingBag, colorActive: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25 border-transparent' },
    { mode: OrderType.PICKUP, icon: MapPin, colorActive: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 border-transparent' },
    { mode: OrderType.DELIVERY, icon: Truck, colorActive: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 border-transparent' },
];

const POSToolbar: React.FC<POSToolbarProps> = ({
    activeOrderType, onSetOrderMode, lang, t, cartCount,
    onToggleCart, onShowTables, onShowCustomers, onQuickPay, onFocusSearch,
    hasCartItems, cartTotal, currencySymbol,
}) => {
    const labels: Record<OrderType, string> = {
        [OrderType.DINE_IN]: t.dine_in,
        [OrderType.TAKEAWAY]: t.takeaway,
        [OrderType.PICKUP]: t.pickup || 'Pickup',
        [OrderType.DELIVERY]: t.delivery,
    };
    const isRTL = lang === 'ar';

    return (
        <div className="shrink-0 border-b border-border/50 bg-card/80 backdrop-blur-xl px-3 md:px-5 py-2 relative z-30 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {/* Order mode pills */}
                <div className="flex items-center bg-elevated/80 rounded-[1.2rem] p-1 shrink-0 border border-border/50 shadow-inner">
                    {modeConfig.map((entry) => (
                        <button
                            key={entry.mode}
                            onClick={() => onSetOrderMode(entry.mode)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border
                                ${activeOrderType === entry.mode ? entry.colorActive : 'text-muted border-transparent hover:text-main hover:bg-elevated'}`}
                        >
                            <entry.icon size={16} />
                            <span className="hidden sm:inline">{labels[entry.mode]}</span>
                        </button>
                    ))}
                </div>

                {/* Context actions */}
                {activeOrderType === OrderType.DINE_IN && (
                    <button onClick={onShowTables} className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[1.2rem] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-indigo-500 transition-all shadow-sm active:scale-95">
                        <LayoutGrid size={16} />
                        <span className="hidden sm:inline">{isRTL ? 'الطاولات' : 'Tables'}</span>
                    </button>
                )}
                {activeOrderType === OrderType.DELIVERY && (
                    <button onClick={onShowCustomers} className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[1.2rem] bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-amber-500 transition-all shadow-sm active:scale-95">
                        <Truck size={16} />
                        <span className="hidden sm:inline">{isRTL ? 'العملاء' : 'Customers'}</span>
                    </button>
                )}

                {/* Search shortcut */}
                <button onClick={onFocusSearch} className="shrink-0 hidden md:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[1.2rem] bg-elevated/50 border border-border/50 text-muted hover:text-indigo-500 hover:border-indigo-500/30 transition-all shadow-sm active:scale-95">
                    <Search size={16} />
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-elevated/80 font-black tracking-widest text-[9px]">/</span>
                </button>

                {/* Cart toggle (mobile) */}
                <button onClick={onToggleCart} className="shrink-0 lg:hidden inline-flex items-center gap-1.5 px-3 py-2.5 rounded-[1.2rem] bg-elevated/50 border border-border/50 text-muted hover:text-indigo-500 hover:border-indigo-500/30 transition-all shadow-sm active:scale-95 relative">
                    <ShoppingBag size={18} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-indigo-500/25 animate-in zoom-in">
                            {cartCount > 9 ? '9+' : cartCount}
                        </span>
                    )}
                </button>

                <div className="flex-1" />

                {/* ═══ Smart Header: Total in toolbar ═══ */}
                {hasCartItems && (
                    <div className="shrink-0 hidden md:flex items-center gap-2 px-4 py-2.5 rounded-[1.2rem] bg-gradient-to-r from-indigo-500/10 to-cyan-500/5 border border-indigo-500/20 shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 relative z-10">{isRTL ? 'الإجمالي' : 'Total'}</span>
                        <span className="text-lg font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 relative z-10 drop-shadow-sm">{currencySymbol}{(cartTotal || 0).toFixed(2)}</span>
                    </div>
                )}

                {/* Quick Pay */}
                {hasCartItems && (
                    <button
                        onClick={onQuickPay}
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-3 rounded-[1.2rem] bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-amber-500/25 active:scale-95 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <Zap size={16} fill="currentColor" className="relative z-10" />
                        <span className="hidden sm:inline relative z-10">{isRTL ? 'دفع سريع' : 'Quick Pay'}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default React.memo(POSToolbar);
