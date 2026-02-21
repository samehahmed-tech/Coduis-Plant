/**
 * POSToolbar — Compact order-mode selector + action buttons
 * Inspired by modern POS reference: single horizontal strip
 */
import React from 'react';
import {
    UtensilsCrossed, ShoppingBag, MapPin, Truck, LayoutGrid, Plus, Search
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
}

const modeConfig = [
    { mode: OrderType.DINE_IN, icon: UtensilsCrossed, colorActive: 'bg-primary text-white border-primary shadow-sm' },
    { mode: OrderType.TAKEAWAY, icon: ShoppingBag, colorActive: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
    { mode: OrderType.PICKUP, icon: MapPin, colorActive: 'bg-teal-600 text-white border-teal-600 shadow-sm' },
    { mode: OrderType.DELIVERY, icon: Truck, colorActive: 'bg-orange-600 text-white border-orange-600 shadow-sm' },
];

const POSToolbar: React.FC<POSToolbarProps> = ({
    activeOrderType, onSetOrderMode, lang, t, cartCount,
    onToggleCart, onShowTables, onShowCustomers, onQuickPay, onFocusSearch, hasCartItems,
}) => {
    const labels: Record<OrderType, string> = {
        [OrderType.DINE_IN]: t.dine_in,
        [OrderType.TAKEAWAY]: t.takeaway,
        [OrderType.PICKUP]: t.pickup || 'Pickup',
        [OrderType.DELIVERY]: t.delivery,
    };

    return (
        <div className="shrink-0 border-b border-border/60 bg-card px-2 md:px-4 py-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {/* Order mode pills */}
                <div className="flex items-center bg-elevated/60 dark:bg-elevated/40 rounded-xl p-0.5 shrink-0">
                    {modeConfig.map((entry) => (
                        <button
                            key={entry.mode}
                            onClick={() => onSetOrderMode(entry.mode)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200
                        ${activeOrderType === entry.mode
                                    ? entry.colorActive
                                    : 'text-muted hover:text-main'
                                }`}
                        >
                            <entry.icon size={13} />
                            <span className="hidden sm:inline">{labels[entry.mode]}</span>
                        </button>
                    ))}
                </div>

                <div className="h-5 w-px bg-border/50 mx-0.5 hidden md:block shrink-0" />

                {/* Contextual actions */}
                {activeOrderType === OrderType.DINE_IN && (
                    <button
                        onClick={onShowTables}
                        className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-elevated/50 text-muted text-[10px] font-black uppercase tracking-wider hover:text-primary transition-colors"
                    >
                        <LayoutGrid size={13} />
                        <span className="hidden sm:inline">{lang === 'ar' ? 'الطاولات' : 'Tables'}</span>
                    </button>
                )}
                {activeOrderType === OrderType.DELIVERY && (
                    <button
                        onClick={onShowCustomers}
                        className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-elevated/50 text-muted text-[10px] font-black uppercase tracking-wider hover:text-primary transition-colors"
                    >
                        <Truck size={13} />
                        <span className="hidden sm:inline">{lang === 'ar' ? 'العملاء' : 'Customers'}</span>
                    </button>
                )}

                {/* Search trigger */}
                <button
                    onClick={onFocusSearch}
                    className="shrink-0 hidden md:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-elevated/50 text-muted text-[10px] font-black uppercase tracking-wider hover:text-primary transition-colors"
                >
                    <Search size={13} />
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-elevated">/</span>
                </button>

                {/* Cart (mobile only) */}
                <button
                    onClick={onToggleCart}
                    className="shrink-0 lg:hidden inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-elevated/50 text-muted text-[10px] font-black uppercase tracking-wider hover:text-primary transition-colors relative"
                >
                    <ShoppingBag size={13} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[8px] font-black flex items-center justify-center">
                            {cartCount > 9 ? '9+' : cartCount}
                        </span>
                    )}
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Quick Pay */}
                {hasCartItems && (
                    <button
                        onClick={onQuickPay}
                        className="shrink-0 hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 transition-colors shadow-sm shadow-emerald-600/20"
                    >
                        <Plus size={12} />
                        {lang === 'ar' ? 'دفع سريع' : 'Quick Pay'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default React.memo(POSToolbar);
