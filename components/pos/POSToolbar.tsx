/**
 * POSToolbar — Slim mode switcher + context actions + cart badge
 * Designed to be as thin as possible, ~36px tall
 */
import React from 'react';
import {
    UtensilsCrossed, ShoppingBag, MapPin, Truck, LayoutGrid, Zap, Plus
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
    onNewCustomer: () => void;
    onQuickPay: () => void;
    onFocusSearch: () => void;
    hasCartItems: boolean;
    cartTotal: number;
    currencySymbol: string;
}

const modeConfig = [
    { mode: OrderType.DINE_IN, icon: UtensilsCrossed, label_en: 'Dine', label_ar: 'محلي' },
    { mode: OrderType.TAKEAWAY, icon: ShoppingBag, label_en: 'Take', label_ar: 'سفري' },
    { mode: OrderType.PICKUP, icon: MapPin, label_en: 'Pick', label_ar: 'استلام' },
    { mode: OrderType.DELIVERY, icon: Truck, label_en: 'Deliver', label_ar: 'توصيل' },
];

const POSToolbar: React.FC<POSToolbarProps> = ({
    activeOrderType, onSetOrderMode, lang, t, cartCount,
    onToggleCart, onShowTables, onShowCustomers, onQuickPay, onFocusSearch,
    hasCartItems, cartTotal, currencySymbol,
}) => {
    const isRTL = lang === 'ar';

    return (
        <div className="pos-toolbar-slim shrink-0 border-b border-border/12 bg-white/60 backdrop-blur-sm px-2 py-1 relative z-30 will-change-transform" style={{ transform: 'translate3d(0,0,0)' }}>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {/* Mode pills — compact */}
                <div className="flex items-center bg-elevated/40 rounded-lg p-0.5 shrink-0 border border-border/12">
                    {modeConfig.map((entry) => {
                        const isActive = activeOrderType === entry.mode;
                        return (
                            <button
                                key={entry.mode}
                                onClick={() => onSetOrderMode(entry.mode)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-100
                                    ${isActive
                                        ? 'bg-primary text-white shadow-sm shadow-primary/15'
                                        : 'text-muted hover:text-main hover:bg-elevated/70'
                                    }`}
                            >
                                <entry.icon size={12} />
                                <span className="hidden sm:inline">{isRTL ? entry.label_ar : entry.label_en}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Context actions inline */}
                {activeOrderType === OrderType.DINE_IN && (
                    <button onClick={onShowTables} className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/5 text-primary border border-primary/10 text-[9px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-colors active:scale-95">
                        <LayoutGrid size={12} />
                        <span className="hidden sm:inline">{isRTL ? 'الطاولات' : 'Tables'}</span>
                    </button>
                )}
                {activeOrderType === OrderType.DELIVERY && (
                    <div className="flex items-center gap-0.5">
                        <button onClick={onShowCustomers} className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-warning/5 text-warning border border-warning/10 text-[9px] font-bold uppercase tracking-wider hover:bg-warning hover:text-white transition-colors active:scale-95">
                            <Truck size={12} />
                            <span className="hidden sm:inline">{isRTL ? 'العملاء' : 'Customers'}</span>
                        </button>
                        <button onClick={onNewCustomer} className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-warning/10 border border-warning/20 text-warning hover:bg-warning hover:text-white transition-all active:scale-90">
                            <Plus size={12} />
                        </button>
                    </div>
                )}

                {/* Cart toggle (mobile) */}
                <button onClick={onToggleCart} className="shrink-0 hidden max-lg:inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-elevated/40 border border-border/12 text-muted hover:text-primary transition-colors active:scale-95 relative">
                    <ShoppingBag size={14} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-primary text-white text-[8px] font-bold flex items-center justify-center shadow-sm shadow-primary/20">
                            {cartCount > 9 ? '9+' : cartCount}
                        </span>
                    )}
                </button>

                <div className="flex-1" />

                {/* Total + Quick Pay */}
                {hasCartItems && (
                    <div className="shrink-0 hidden md:flex items-center gap-1.5">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70">{isRTL ? 'الإجمالي' : 'Total'}</span>
                            <span className="text-sm font-black tabular-nums text-primary">{currencySymbol}{(cartTotal || 0).toFixed(2)}</span>
                        </div>
                        <button
                            onClick={onQuickPay}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold uppercase tracking-wider hover:shadow-md hover:shadow-amber-500/15 transition-all active:scale-95"
                        >
                            <Zap size={12} fill="currentColor" />
                            <span className="hidden sm:inline">{isRTL ? 'سريع' : 'Quick'}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(POSToolbar);
