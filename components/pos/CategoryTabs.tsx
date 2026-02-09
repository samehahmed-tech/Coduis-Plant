import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Grid3X3, LayoutList } from 'lucide-react';
import { MenuCategory } from '../../types';

interface CategoryTabsProps {
    categories: MenuCategory[];
    activeCategory: string;
    onSetCategory: (category: string) => void;
    isTouchMode: boolean;
    lang: 'en' | 'ar';
}

const CategoryTabs: React.FC<CategoryTabsProps> = React.memo(({
    categories,
    activeCategory,
    onSetCategory,
    isTouchMode,
    lang,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [viewMode, setViewMode] = useState<'scroll' | 'grid'>('scroll');

    const checkScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

        // Logical Scroll Progress
        // In RTL, scrollLeft starts at 0 and goes negative (left)
        const absScrollLeft = Math.abs(scrollLeft);
        const maxScroll = scrollWidth - clientWidth;

        // Right arrow means "go towards initial position" (Right in RTL)
        // Left arrow means "go further into the list" (Left in RTL)
        setShowRightArrow(absScrollLeft > 10);
        setShowLeftArrow(absScrollLeft < maxScroll - 10);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        checkScroll();
        window.addEventListener('resize', checkScroll);

        // Re-check after a short delay for layout shifts
        const timer = setTimeout(checkScroll, 300);

        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timer);
        };
    }, [checkScroll, categories, viewMode, lang]);

    // Add mouse wheel support for easier navigation
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                el.scrollLeft += e.deltaY; // Browser handles RTL scrollLeft automatically
                checkScroll();
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [checkScroll]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const clientWidth = scrollRef.current.clientWidth;
        const scrollAmount = clientWidth * 0.7;

        // In RTL (Arabic), 'left' means scrolling further away from 0 (negative)
        // 'right' means scrolling back towards 0
        const finalAmount = direction === 'left' ? -scrollAmount : scrollAmount;

        scrollRef.current.scrollBy({ left: finalAmount, behavior: 'smooth' });
        setTimeout(checkScroll, 500);
    };

    const validCategories = categories.filter(c => c.isActive !== false);

    const allCategories = [
        {
            id: 'all',
            name: 'All',
            nameAr: 'الكل',
            image: null,
            items: categories.flatMap(c => c.items || []),
        },
        ...validCategories
    ];

    if (viewMode === 'grid') {
        return (
            <div className="relative p-7 bg-white dark:bg-slate-900 shadow-2xl rounded-[3rem] border-2 border-primary/10 mb-8 animate-in fade-in zoom-in-95 duration-500 z-[100]">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <Grid3X3 className="text-primary" />
                            {lang === 'ar' ? 'جميع الأقسام' : 'All Categories'}
                        </h3>
                        <p className="text-sm font-bold text-slate-500">
                            {validCategories.length} {lang === 'ar' ? 'مجموعة متوفرة' : 'Available Collections'}
                        </p>
                    </div>
                    <button
                        onClick={() => setViewMode('scroll')}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:bg-primary hover:text-white transition-all text-sm font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700"
                    >
                        <LayoutList size={20} />
                        {lang === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                    {allCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                onSetCategory(cat.id);
                                setViewMode('scroll');
                            }}
                            className={`group flex flex-col items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-300 ${activeCategory === cat.id
                                ? 'bg-primary border-primary text-white shadow-2xl scale-105 z-10'
                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white hover:border-primary/40 hover:-translate-y-2 hover:shadow-xl'
                                }`}
                        >
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                {cat.image ? (
                                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Grid3X3 size={28} className={activeCategory === cat.id ? 'text-white' : 'text-primary/40'} />
                                )}
                            </div>
                            <div className="text-center min-w-0 w-full">
                                <p className="font-black truncate text-xs leading-tight">
                                    {lang === 'ar' ? cat.nameAr || cat.name : cat.name}
                                </p>
                                <p className={`text-[10px] font-bold mt-1 ${activeCategory === cat.id ? 'text-white/70' : 'text-primary/60'}`}>
                                    {cat.items?.length || 0} {lang === 'ar' ? 'صنف' : 'items'}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="relative mb-10 bg-white dark:bg-slate-950 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-7 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.6)]" />
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                            {lang === 'ar' ? 'الأقسام والمجموعات' : 'Menu Collections'}
                        </h3>
                    </div>
                </div>
                {validCategories.length > 3 && (
                    <button
                        onClick={() => setViewMode('grid')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all text-[11px] font-black uppercase tracking-widest border border-primary/20 shadow-sm"
                    >
                        <Grid3X3 size={16} />
                        {lang === 'ar' ? 'كل المجموعات' : 'View Hub'}
                    </button>
                )}
            </div>

            <div className="relative">
                {/* Navigation Arrows - Using absolute positioning with better z-index and pointer-events */}
                <div className="absolute inset-y-0 -left-6 -right-6 flex justify-between items-center pointer-events-none z-50">
                    <div className="flex items-center">
                        {showLeftArrow && (
                            <button
                                onClick={() => scroll('left')}
                                className="pointer-events-auto w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-700 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-primary hover:scale-110 active:scale-90 translate-x-4"
                                aria-label="Scroll Left"
                            >
                                <ChevronLeft size={32} strokeWidth={3} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center">
                        {showRightArrow && (
                            <button
                                onClick={() => scroll('right')}
                                className="pointer-events-auto w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-700 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-primary hover:scale-110 active:scale-90 -translate-x-4"
                                aria-label="Scroll Right"
                            >
                                <ChevronRight size={32} strokeWidth={3} />
                            </button>
                        )}
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="flex gap-5 overflow-x-auto no-scrollbar py-3 px-2 scroll-smooth mask-fade-edges touch-pan-x"
                    style={{ scrollSnapType: 'x proximity' }}
                >
                    {allCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => onSetCategory(cat.id)}
                            className={`
                                flex-shrink-0 flex items-center gap-5 rounded-[1.5rem] transition-all duration-300 border-2
                                ${isTouchMode ? 'h-24 px-7' : 'h-20 px-6'}
                                ${activeCategory === cat.id
                                    ? 'bg-primary border-primary text-white shadow-2xl shadow-primary/30 scale-105 z-10'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }
                            `}
                            style={{ scrollSnapAlign: 'start', minWidth: '180px' }}
                        >
                            <div className={`rounded-2xl overflow-hidden shrink-0 ${isTouchMode ? 'w-14 h-14' : 'w-12 h-12'} ${activeCategory === cat.id ? 'bg-white/25' : 'bg-slate-100 dark:bg-slate-800 shadow-inner'}`}>
                                {cat.image ? (
                                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Grid3X3 size={isTouchMode ? 28 : 24} className={activeCategory === cat.id ? 'text-white' : 'text-primary/30'} />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1 text-left rtl:text-right">
                                <p className={`font-black truncate ${isTouchMode ? 'text-base' : 'text-sm'} leading-tight`}>
                                    {lang === 'ar' ? cat.nameAr || cat.name : cat.name}
                                </p>
                                <span className={`text-xs font-bold block mt-1 ${activeCategory === cat.id ? 'text-white/80' : 'text-slate-400'}`}>
                                    {cat.items?.length || 0} {lang === 'ar' ? 'صنف' : 'items'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default CategoryTabs;
