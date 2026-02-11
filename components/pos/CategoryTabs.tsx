import React from 'react';
import { Grid3X3, LayoutGrid } from 'lucide-react';
import { MenuCategory } from '../../types';

interface CategoryTabsProps {
    categories: MenuCategory[];
    activeCategory: string;
    onSetCategory: (category: string) => void;
    isTouchMode: boolean;
    lang: 'en' | 'ar';
    t?: any;
    counts?: Record<string, number>;
    totalCount?: number;
    hasActiveFiltering?: boolean;
}

const CategoryTabs: React.FC<CategoryTabsProps> = React.memo(({
    categories,
    activeCategory,
    onSetCategory,
    isTouchMode,
    lang,
    counts = {},
    totalCount = 0,
    hasActiveFiltering = false,
}) => {
    const validCategories = categories
        .filter(c => c.isActive !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const allCategories = [
        {
            id: 'all',
            name: 'All Menu',
            nameAr: 'كل المنيو',
            icon: 'LayoutGrid',
        },
        ...validCategories
    ];

    return (
        <div className="relative w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="px-3 md:px-4 py-2.5">
                <div className="md:hidden flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {allCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onSetCategory(cat.id)}
                            disabled={hasActiveFiltering && cat.id !== 'all' && (counts[cat.id] || 0) === 0}
                            className={`
                                flex flex-col items-center justify-center gap-1.5 min-w-[96px] h-[92px] rounded-xl border shrink-0 transition-all
                                ${activeCategory === cat.id
                                    ? 'bg-primary border-primary text-white shadow-md'
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-300'}
                                ${hasActiveFiltering && cat.id !== 'all' && (counts[cat.id] || 0) === 0 ? 'opacity-45 cursor-not-allowed' : ''}
                            `}
                            title={lang === 'ar' ? (cat.nameAr || cat.name) : cat.name}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeCategory === cat.id ? 'bg-white/20' : 'bg-white dark:bg-slate-800'}`}>
                                {cat.id === 'all' ? <LayoutGrid size={18} /> : <Grid3X3 size={18} className={activeCategory === cat.id ? 'text-white' : 'text-primary/60'} />}
                            </div>
                            <span className="text-[10px] font-black tracking-tight text-center px-1 line-clamp-2 leading-tight">
                                {lang === 'ar' ? cat.nameAr || cat.name : cat.name}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="hidden md:grid grid-flow-col grid-rows-2 auto-cols-[minmax(170px,1fr)] gap-2 overflow-x-auto no-scrollbar">
                    {allCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onSetCategory(cat.id)}
                            disabled={hasActiveFiltering && cat.id !== 'all' && (counts[cat.id] || 0) === 0}
                            className={`
                                flex items-center justify-between gap-2 px-3 py-2 h-[64px] rounded-xl border transition-all min-w-[170px]
                                ${activeCategory === cat.id
                                    ? 'bg-primary border-primary text-white shadow-md'
                                    : 'bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-700 dark:text-slate-200 hover:border-primary/25'}
                                ${hasActiveFiltering && cat.id !== 'all' && (counts[cat.id] || 0) === 0 ? 'opacity-45 cursor-not-allowed' : ''}
                            `}
                            title={lang === 'ar' ? (cat.nameAr || cat.name) : cat.name}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${activeCategory === cat.id ? 'bg-white/20' : 'bg-white dark:bg-slate-800'}`}>
                                    {cat.id === 'all' ? <LayoutGrid size={15} /> : <Grid3X3 size={15} className={activeCategory === cat.id ? 'text-white' : 'text-primary/60'} />}
                                </div>
                                <span className="text-[12px] font-black tracking-tight leading-tight line-clamp-2 text-start">
                                    {lang === 'ar' ? cat.nameAr || cat.name : cat.name}
                                </span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black shrink-0 ${activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                                {cat.id === 'all' ? totalCount : (counts[cat.id] || 0)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default CategoryTabs;
