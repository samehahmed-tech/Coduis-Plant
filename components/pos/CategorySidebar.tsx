import React, { useMemo, useCallback } from 'react';
import { MenuCategory } from '../../types';
import { LayoutGrid, Coffee, Pizza, Utensils, GlassWater, IceCream, Salad, Soup, Sandwich, Beef, Fish, Cake, Sparkles } from 'lucide-react';

interface CategorySidebarProps {
    categories: MenuCategory[];
    activeCategory: string;
    onSetCategory: (category: string) => void;
    lang: 'en' | 'ar';
    counts?: Record<string, number>;
    totalCount?: number;
}

const iconMap: [RegExp, React.ReactNode][] = [
    [/coffee|قهوة|ساخن/i, <Coffee size={20} />],
    [/pizza|بيتزا/i, <Pizza size={20} />],
    [/drink|مشروب|عصير|بارد/i, <GlassWater size={20} />],
    [/ice|dessert|حلو|آيس|ايس/i, <IceCream size={20} />],
    [/salad|سلط/i, <Salad size={20} />],
    [/soup|شورب/i, <Soup size={20} />],
    [/sandwich|ساندو|فطار|breakfast|ملاخن/i, <Sandwich size={20} />],
    [/meat|لحم|ستيك|مشوي/i, <Beef size={20} />],
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
    isActive: boolean; isRTL: boolean; onClick: () => void;
}> = React.memo(({ id, label, image, icon, isActive, isRTL, onClick }) => (
    <button
        onClick={onClick}
        className={`
            w-full flex flex-col items-center gap-1.5 px-1 py-2.5 rounded-xl transition-colors duration-75 relative
            ${isActive
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-muted hover:bg-elevated/50 hover:text-main'
            }
        `}
    >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${isActive ? 'bg-white/20' : 'bg-elevated/40'}`}>
            {image ? (
                <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : icon}
        </div>
        <span className="text-[9px] font-bold text-center leading-tight line-clamp-2 w-full px-0.5">
            {label}
        </span>
        {isActive && (
            <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? '-left-0.5' : '-right-0.5'} w-1 h-7 bg-primary rounded-full`} />
        )}
    </button>
));

const CategorySidebar: React.FC<CategorySidebarProps> = React.memo(({
    categories, activeCategory, onSetCategory, lang, counts, totalCount,
}) => {
    const isRTL = lang === 'ar';

    const sorted = useMemo(() =>
        [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        [categories]);

    const handleClick = useCallback((id: string) => {
        onSetCategory(id);
    }, [onSetCategory]);

    return (
        <div className={`hidden md:flex flex-col w-20 shrink-0 bg-card ${isRTL ? 'border-l' : 'border-r'} border-border/20 h-full overflow-hidden`}>
            {/* All */}
            <div className="shrink-0 px-1.5 pt-1.5 pb-1">
                <CategoryButton
                    id="all"
                    label={isRTL ? 'الكل' : 'All'}
                    icon={<LayoutGrid size={20} />}
                    isActive={activeCategory === 'all'}
                    isRTL={isRTL}
                    onClick={() => handleClick('all')}
                />
            </div>

            <div className="w-10 h-px bg-border/15 mx-auto" />

            {/* Categories */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1.5 py-1 space-y-0.5">
                {sorted.map(cat => (
                    <CategoryButton
                        key={cat.id}
                        id={cat.id}
                        label={isRTL ? (cat.nameAr || cat.name) : cat.name}
                        image={cat.image}
                        icon={getIcon(cat.name)}
                        isActive={activeCategory === cat.id}
                        isRTL={isRTL}
                        onClick={() => handleClick(cat.id)}
                    />
                ))}
            </div>
        </div>
    );
});

export default CategorySidebar;
