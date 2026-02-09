import React, { useMemo } from 'react';
import { MenuCategory } from '../../types';
import { LayoutGrid, Search, Sparkles, Coffee, Pizza, Utensils, GlassWater, IceCream } from 'lucide-react';

interface CategorySidebarProps {
    categories: MenuCategory[];
    activeCategory: string;
    onSetCategory: (category: string) => void;
    lang: 'en' | 'ar';
}

const CategorySidebar: React.FC<CategorySidebarProps> = React.memo(({
    categories,
    activeCategory,
    onSetCategory,
    lang,
}) => {
    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [categories]);

    // Icon mapping logic for visual flair
    const getCategoryIcon = (name: string, iconName?: string) => {
        const lowerName = name.toLowerCase();
        if (iconName === 'Coffee' || lowerName.includes('coffee') || lowerName.includes('قهوة')) return <Coffee size={22} />;
        if (iconName === 'Pizza' || lowerName.includes('pizza') || lowerName.includes('بيتزا')) return <Pizza size={22} />;
        if (iconName === 'GlassWater' || lowerName.includes('drink') || lowerName.includes('مشروبات')) return <GlassWater size={22} />;
        if (iconName === 'IceCream' || lowerName.includes('dessert') || lowerName.includes('حلو')) return <IceCream size={22} />;
        if (lowerName.includes('breakfast') || lowerName.includes('فطار')) return <Sparkles size={22} />;
        return <Utensils size={22} />;
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-24 md:w-28 shrink-0 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <LayoutGrid size={24} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-3 px-2">
                {/* 'All' button */}
                <button
                    onClick={() => onSetCategory('all')}
                    className={`
                        w-full flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300
                        ${activeCategory === 'all'
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }
                    `}
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeCategory === 'all' ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                        <LayoutGrid size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-center line-clamp-1">
                        {lang === 'ar' ? 'الكل' : 'All'}
                    </span>
                </button>

                {sortedCategories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => onSetCategory(cat.id)}
                        className={`
                            w-full flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300
                            ${activeCategory === cat.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }
                        `}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${activeCategory === cat.id ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                            {cat.image ? (
                                <img src={cat.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                            ) : (
                                getCategoryIcon(cat.name, cat.icon)
                            )}
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tight text-center leading-tight line-clamp-2">
                            {lang === 'ar' ? cat.nameAr || cat.name : cat.name}
                        </span>
                        {activeCategory === cat.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
});

export default CategorySidebar;
