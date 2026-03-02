import React, { useMemo, useCallback } from 'react';
import { MenuCategory } from '../../types';
import { LayoutGrid, Coffee, Pizza, Utensils, GlassWater, IceCream, Salad, Soup, Sandwich, Beef, Fish, Cake, Sparkles, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface CategorySidebarProps {
    categories: MenuCategory[];
    activeCategory: string;
    onSetCategory: (category: string) => void;
    lang: 'en' | 'ar';
    counts?: Record<string, number>;
    totalCount?: number;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}


const iconMap: [RegExp, React.ReactNode][] = [
    [/coffee|قهوة|ساخن/i, <Coffee size={20} />],
    [/pizza|بيتزا/i, <Pizza size={20} />],
    [/drink|مشروب|عصير|بارد/i, <GlassWater size={20} />],
    [/ice|dessert|حلو|آيس|ايس/i, <IceCream size={20} />],
    [/salad|سلط/i, <Salad size={20} />],
    [/soup|شورب/i, <Soup size={20} />],
    [/sandwich|ساندو|فطار|breakfast/i, <Sandwich size={20} />],
    [/meat|لحم|ستيك|مشوي|فراخ|دجاج|chicken/i, <Beef size={20} />],
    [/fish|سمك|بحر/i, <Fish size={20} />],
    [/cake|كيك|تورت/i, <Cake size={20} />],
    [/special|عرض|مميز/i, <Sparkles size={20} />],
];

const getIcon = (name: string) => {
    for (const [re, icon] of iconMap) {
        if (re.test(name)) return icon;
    }
    return <Utensils size={20} />;
};

const CategoryButton: React.FC<{
    id: string; label: string; image?: string; icon: React.ReactNode;
    isActive: boolean; isRTL: boolean; collapsed: boolean; onClick: () => void; count?: number;
}> = React.memo(({ id, label, image, icon, isActive, isRTL, collapsed, onClick, count }) => (
    <button
        onClick={onClick}
        title={label}
        className={`
            w-full flex ${collapsed ? 'justify-center' : 'flex-col items-center gap-1.5'} 
            ${collapsed ? 'p-2' : 'px-1 py-2'} rounded-[1rem] transition-all duration-300 relative overflow-hidden group
            ${isActive
                ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
                : 'text-muted hover:bg-elevated/60 hover:text-indigo-500 border border-transparent hover:border-indigo-500/20 active:scale-95'
            }
        `}
    >
        {isActive && !collapsed && (
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        )}
        <div className={`${collapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-2xl flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105 ${isActive ? 'bg-white/20 shadow-inner' : 'bg-elevated/40'}`}>
            {image ? (
                <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : <span className="scale-90">{icon}</span>}
        </div>
        {!collapsed && (
            <div className="flex flex-col items-center gap-0.5 relative z-10">
                <span className={`text-[12px] font-bold text-center leading-tight line-clamp-2 w-full px-0.5 tracking-wide ${isActive ? 'drop-shadow-sm font-black' : ''}`}>
                    {label}
                </span>
                {count !== undefined && count > 0 && (
                    <span className={`text-[9px] font-black tabular-nums ${isActive ? 'text-white/70' : 'text-muted/60'}`}>{count}</span>
                )}
            </div>
        )}
        {isActive && !collapsed && (
            <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? '-left-1' : '-right-1'} w-1.5 h-6 bg-white/50 rounded-full blur-[1px]`} />
        )}
    </button>
));

const CategorySidebar: React.FC<CategorySidebarProps> = React.memo(({
    categories, activeCategory, onSetCategory, lang, counts, totalCount,
    collapsed = false, onToggleCollapse,
}) => {
    const isRTL = lang === 'ar';

    const sorted = useMemo(() =>
        [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        [categories]);

    const handleClick = useCallback((id: string) => {
        onSetCategory(id);
    }, [onSetCategory]);

    return (
        <div className={`hidden md:flex flex-col ${collapsed ? 'w-[64px]' : 'w-[110px]'} shrink-0 bg-card/80 backdrop-blur-xl ${isRTL ? 'border-l' : 'border-r'} border-border/50 h-full overflow-hidden transition-all duration-300 shadow-xl z-20`}>
            {/* Collapse toggle */}
            {onToggleCollapse && (
                <button
                    onClick={onToggleCollapse}
                    className="shrink-0 mx-auto mt-2 mb-1 w-10 h-8 rounded-xl bg-elevated/50 text-muted hover:text-indigo-500 hover:bg-indigo-500/10 flex items-center justify-center transition-all shadow-sm border border-border/30"
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    {collapsed
                        ? (isRTL ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />)
                        : (isRTL ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />)
                    }
                </button>
            )}

            {/* All */}
            <div className="shrink-0 px-1 pb-0.5">
                <CategoryButton
                    id="all"
                    label={isRTL ? 'الكل' : 'All'}
                    icon={<LayoutGrid size={20} />}
                    isActive={activeCategory === 'all'}
                    isRTL={isRTL}
                    collapsed={collapsed}
                    onClick={() => handleClick('all')}
                    count={totalCount}
                />
            </div>

            <div className={`${collapsed ? 'w-8' : 'w-12'} h-px bg-border/50 mx-auto my-1`} />

            {/* Categories */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1.5 py-1 space-y-1.5">
                {sorted.map(cat => (
                    <CategoryButton
                        key={cat.id}
                        id={cat.id}
                        label={isRTL ? (cat.nameAr || cat.name) : cat.name}
                        image={cat.image}
                        icon={getIcon(cat.name)}
                        isActive={activeCategory === cat.id}
                        isRTL={isRTL}
                        collapsed={collapsed}
                        count={counts?.[cat.id]}
                        onClick={() => handleClick(cat.id)}
                    />
                ))}
            </div>
        </div>
    );
});

export default CategorySidebar;
