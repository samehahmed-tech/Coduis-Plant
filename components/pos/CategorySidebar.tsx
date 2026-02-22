import React, { useMemo } from 'react';
import { MenuCategory } from '../../types';
import { LayoutGrid, Sparkles, Coffee, Pizza, Utensils, GlassWater, IceCream, Salad, Soup, Sandwich, Beef, Fish, Cake } from 'lucide-react';

interface CategorySidebarProps {
    categories: MenuCategory[];
    activeCategory: string;
    onSetCategory: (category: string) => void;
    lang: 'en' | 'ar';
    counts?: Record<string, number>;
    totalCount?: number;
}

const getCategoryIcon = (name: string, iconName?: string) => {
    const n = name.toLowerCase();
    if (iconName === 'Coffee' || n.includes('coffee') || n.includes('قهوة') || n.includes('ساخن')) return <Coffee size={18} />;
    if (iconName === 'Pizza' || n.includes('pizza') || n.includes('بيتزا')) return <Pizza size={18} />;
    if (iconName === 'GlassWater' || n.includes('drink') || n.includes('مشروب') || n.includes('عصير') || n.includes('بارد')) return <GlassWater size={18} />;
    if (iconName === 'IceCream' || n.includes('dessert') || n.includes('حلو') || n.includes('آيس') || n.includes('ايس')) return <IceCream size={18} />;
    if (n.includes('salad') || n.includes('سلط')) return <Salad size={18} />;
    if (n.includes('soup') || n.includes('شورب')) return <Soup size={18} />;
    if (n.includes('sandwich') || n.includes('ساندو') || n.includes('ملاخن') || n.includes('فطار') || n.includes('breakfast')) return <Sandwich size={18} />;
    if (n.includes('meat') || n.includes('لحم') || n.includes('ستيك') || n.includes('مشوي')) return <Beef size={18} />;
    if (n.includes('fish') || n.includes('سمك') || n.includes('بحر')) return <Fish size={18} />;
    if (n.includes('cake') || n.includes('كيك') || n.includes('تورت')) return <Cake size={18} />;
    if (n.includes('special') || n.includes('عرض') || n.includes('مميز')) return <Sparkles size={18} />;
    return <Utensils size={18} />;
};

const CategorySidebar: React.FC<CategorySidebarProps> = React.memo(({
    categories, activeCategory, onSetCategory, lang, counts, totalCount,
}) => {
    const isRTL = lang === 'ar';
    const sorted = useMemo(() =>
        [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        [categories]);

    const renderButton = (id: string, label: string, icon: React.ReactNode, image?: string, count?: number) => {
        const isActive = activeCategory === id;
        return (
            <button
                key={id}
                onClick={() => onSetCategory(id)}
                className={`
                    w-full flex flex-col items-center gap-1 px-1 py-2 rounded-xl transition-all duration-150 relative
                    ${isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-muted hover:bg-elevated/60 hover:text-main'
                    }
                `}
                title={label}
            >
                {/* Image or Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${isActive ? 'bg-white/20' : 'bg-elevated/50'}`}>
                    {image ? (
                        <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                        icon
                    )}
                </div>

                {/* Label */}
                <span className="text-[8px] font-bold uppercase tracking-tight text-center leading-tight line-clamp-2 w-full px-0.5">
                    {label}
                </span>

                {/* Count badge */}
                {count !== undefined && count > 0 && (
                    <span className={`absolute top-0.5 ${isRTL ? 'left-0.5' : 'right-0.5'} min-w-[14px] h-3.5 px-0.5 rounded-full text-[7px] font-black flex items-center justify-center ${isActive ? 'bg-white/30 text-white' : 'bg-primary/10 text-primary'}`}>
                        {count}
                    </span>
                )}

                {/* Active indicator */}
                {isActive && (
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? '-left-0.5' : '-right-0.5'} w-1 h-6 bg-primary rounded-full`} />
                )}
            </button>
        );
    };

    return (
        <div className={`hidden md:flex flex-col w-[72px] shrink-0 bg-card ${isRTL ? 'border-l' : 'border-r'} border-border/30 h-full overflow-hidden`}>
            {/* All items button */}
            <div className="shrink-0 px-1 pt-1.5 pb-0.5">
                {renderButton('all', isRTL ? 'الكل' : 'All', <LayoutGrid size={18} />, undefined, totalCount)}
            </div>

            <div className="w-8 h-px bg-border/20 mx-auto my-0.5" />

            {/* Scrollable categories */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-0.5 space-y-0.5">
                {sorted.map(cat =>
                    renderButton(
                        cat.id,
                        isRTL ? (cat.nameAr || cat.name) : cat.name,
                        getCategoryIcon(cat.name, cat.icon),
                        cat.image,
                        counts?.[cat.id]
                    )
                )}
            </div>
        </div>
    );
});

export default CategorySidebar;
