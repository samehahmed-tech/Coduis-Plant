import React from 'react';

interface CategoryTabsProps {
    categories: string[];
    activeCategory: string;
    onSetCategory: (category: string) => void;
    isTouchMode: boolean;
    lang: 'en' | 'ar';
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
    categories,
    activeCategory,
    onSetCategory,
    isTouchMode,
    lang,
}) => {
    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => onSetCategory(cat)}
                    className={`
            ${isTouchMode ? 'px-6 md:px-8 py-4 md:py-5 text-sm' : 'px-4 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs'} 
            rounded-xl md:rounded-2xl font-black whitespace-nowrap transition-all uppercase tracking-wider 
            ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}
          `}
                >
                    {lang === 'ar' && cat === 'All' ? 'الكل' : cat}
                </button>
            ))}
        </div>
    );
};

export default CategoryTabs;
