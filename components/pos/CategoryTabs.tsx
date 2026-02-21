import React from 'react';
import { LayoutGrid } from 'lucide-react';
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
        { id: 'all', name: 'All Items', nameAr: 'الكل' },
        ...validCategories
    ];
    const isRTL = lang === 'ar';

    return (
        <div className="w-full bg-card border-b border-border/40">
            <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 overflow-x-auto no-scrollbar">
                {allCategories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    const count = cat.id === 'all' ? totalCount : (counts[cat.id] || 0);
                    const isDisabled = hasActiveFiltering && cat.id !== 'all' && count === 0;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSetCategory(cat.id)}
                            disabled={isDisabled}
                            className={`
                                shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200
                                ${isActive
                                    ? 'bg-primary text-white shadow-sm shadow-primary/25'
                                    : 'bg-elevated/50 text-muted hover:text-main hover:bg-elevated'
                                }
                                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            {cat.id === 'all' && <LayoutGrid size={13} />}
                            <span className="whitespace-nowrap">
                                {isRTL ? ((cat as any).nameAr || cat.name) : cat.name}
                            </span>
                            {hasActiveFiltering && (
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-elevated'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

export default CategoryTabs;
