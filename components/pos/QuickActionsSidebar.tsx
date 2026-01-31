import React, { useState } from 'react';
import {
    Utensils,
    ShoppingBag,
    Truck,
    Calculator as CalcIcon,
    Smartphone,
    History,
    Zap,
    Maximize,
    Lock
} from 'lucide-react';
import { OrderType } from '../../types';

interface QuickActionsSidebarProps {
    activeMode: OrderType;
    onSetMode: (mode: OrderType) => void;
    isTouchMode: boolean;
    onToggleTouchMode: () => void;
    onToggleCalculator: () => void;
    lang: 'en' | 'ar';
    t: any;
}

const QuickActionsSidebar: React.FC<QuickActionsSidebarProps> = ({
    activeMode,
    onSetMode,
    isTouchMode,
    onToggleTouchMode,
    onToggleCalculator,
    lang,
    t
}) => {
    return (
        <div className={`w-20 bg-card/60 backdrop-blur-3xl border-r border-border flex flex-col items-center py-8 gap-8 z-30 transition-all duration-700 relative`}>
            {/* Glossy Accent Line */}
            <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

            {/* Mode Switchers Container */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => onSetMode(OrderType.DINE_IN)}
                    className={`group relative p-4 rounded-2xl transition-all duration-500 hover:scale-110 active:scale-90 ${activeMode === OrderType.DINE_IN ? 'bg-primary text-white shadow-2xl shadow-primary/40 ring-2 ring-primary/20' : 'bg-elevated/40 text-muted hover:text-primary hover:bg-primary/5'}`}
                >
                    <Utensils size={22} className={`transition-transform duration-500 ${activeMode === OrderType.DINE_IN ? 'scale-110' : 'group-hover:rotate-12'}`} />
                    {activeMode === OrderType.DINE_IN && (
                        <div className={`absolute ${lang === 'ar' ? '-right-1' : '-left-1'} top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full blur-sm animate-pulse`} />
                    )}
                    {/* Tooltip */}
                    <div className={`absolute ${lang === 'ar' ? 'right-full mr-5' : 'left-full ml-5'} top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-2xl border border-white/10 scale-90 group-hover:scale-100 z-[100]`}>
                        {t.dine_in}
                    </div>
                </button>

                <button
                    onClick={() => onSetMode(OrderType.TAKEAWAY)}
                    className={`group relative p-4 rounded-2xl transition-all duration-500 hover:scale-110 active:scale-90 ${activeMode === OrderType.TAKEAWAY ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 ring-2 ring-emerald-500/20' : 'bg-elevated/40 text-muted hover:text-emerald-500 hover:bg-emerald-500/5'}`}
                >
                    <ShoppingBag size={22} className={`transition-transform duration-500 ${activeMode === OrderType.TAKEAWAY ? 'scale-110' : 'group-hover:rotate-12'}`} />
                    {activeMode === OrderType.TAKEAWAY && (
                        <div className={`absolute ${lang === 'ar' ? '-right-1' : '-left-1'} top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full blur-sm animate-pulse`} />
                    )}
                    <div className={`absolute ${lang === 'ar' ? 'right-full mr-5' : 'left-full ml-5'} top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-2xl border border-white/10 scale-90 group-hover:scale-100 z-[100]`}>
                        {t.takeaway}
                    </div>
                </button>

                <button
                    onClick={() => onSetMode(OrderType.DELIVERY)}
                    className={`group relative p-4 rounded-2xl transition-all duration-500 hover:scale-110 active:scale-90 ${activeMode === OrderType.DELIVERY ? 'bg-orange-500 text-white shadow-2xl shadow-orange-500/40 ring-2 ring-orange-500/20' : 'bg-elevated/40 text-muted hover:text-orange-500 hover:bg-orange-500/5'}`}
                >
                    <Truck size={22} className={`transition-transform duration-500 ${activeMode === OrderType.DELIVERY ? 'scale-110' : 'group-hover:rotate-12'}`} />
                    {activeMode === OrderType.DELIVERY && (
                        <div className={`absolute ${lang === 'ar' ? '-right-1' : '-left-1'} top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full blur-sm animate-pulse`} />
                    )}
                    <div className={`absolute ${lang === 'ar' ? 'right-full mr-5' : 'left-full ml-5'} top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-2xl border border-white/10 scale-90 group-hover:scale-100 z-[100]`}>
                        {t.delivery}
                    </div>
                </button>
            </div>

            <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent my-4 opacity-50" />

            {/* Quick Tools Container */}
            <div className="flex flex-col gap-4">
                {[
                    { icon: CalcIcon, onClick: onToggleCalculator, label: lang === 'ar' ? 'تحصيل سريع' : 'Calculator', color: 'hover:text-primary' },
                    { icon: Smartphone, onClick: onToggleTouchMode, label: lang === 'ar' ? 'وضع اللمس' : 'Touch Mode', color: 'hover:text-amber-500', isActive: isTouchMode },
                    { icon: History, onClick: () => { }, label: lang === 'ar' ? 'السجل' : 'Recent Sales', color: 'hover:text-purple-500' },
                ].map((tool, i) => (
                    <button
                        key={i}
                        onClick={tool.onClick}
                        className={`group relative p-4 rounded-2xl transition-all duration-500 hover:scale-110 active:scale-90 ${tool.isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-elevated/40 text-muted ' + tool.color + ' hover:bg-app/50'}`}
                    >
                        <tool.icon size={22} className="group-hover:rotate-6 transition-transform" />
                        <div className={`absolute ${lang === 'ar' ? 'right-full mr-5' : 'left-full ml-5'} top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-2xl border border-white/10 scale-90 group-hover:scale-100 z-[100]`}>
                            {tool.label}
                        </div>
                    </button>
                ))}
            </div>

            {/* Emergency & Lock at Bottom */}
            <div className="mt-auto flex flex-col gap-4">
                <button
                    className="group relative p-4 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all duration-500 hover:scale-110 shadow-sm"
                >
                    <Zap size={22} />
                    <div className={`absolute ${lang === 'ar' ? 'right-full mr-5' : 'left-full ml-5'} top-1/2 -translate-y-1/2 px-4 py-2 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-2xl scale-90 group-hover:scale-100 z-[100]`}>
                        {lang === 'ar' ? 'طوارئ' : 'Emergency Stop'}
                    </div>
                </button>

                <button
                    className="group relative p-4 bg-elevated/40 text-muted hover:bg-slate-900/80 hover:text-white rounded-2xl transition-all duration-500 hover:scale-110 shadow-sm"
                >
                    <Lock size={22} />
                    <div className={`absolute ${lang === 'ar' ? 'right-full mr-5' : 'left-full ml-5'} top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-2xl border border-white/10 scale-90 group-hover:scale-100 z-[100]`}>
                        Lock Terminal
                    </div>
                </button>
            </div>
        </div>
    );
};

export default QuickActionsSidebar;
