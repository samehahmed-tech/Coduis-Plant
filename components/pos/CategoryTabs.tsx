import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Grid3X3, LayoutList } from 'lucide-react';
import { MenuCategory } from '../../types';

interface CategoryTabsProps {
    categories: MenuCategory[];
    activeCategory: string;
    onSetCategory: (category: string) => void;
    isTouchMode: boolean;
    lang: 'en' | 'ar';
    t: any;
}

const CategoryTabs: React.FC<CategoryTabsProps> = React.memo(({
    categories,
    activeCategory,
    onSetCategory,
    isTouchMode,
    lang,
    t,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [viewMode, setViewMode] = useState<'scroll' | 'grid'>('scroll');

    // Check scroll position for arrows
    useEffect(() => {
        const checkScroll = () => {
            if (!scrollRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        };
        checkScroll();
        scrollRef.current?.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        return () => {
            scrollRef.current?.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [categories]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const scrollAmount = 300;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    // "All" category card
    const allCategory = {
        id: 'all',
        name: 'All',
        nameAr: 'الكل',
        items: [],
        menuIds: [],
        image: undefined,
    };

    const allCategories = [allCategory, ...categories];

    // Grid view for many categories
    if (viewMode === 'grid') {
        return (
            <div className="space-y-3">
                {/* View Toggle */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setViewMode('scroll')}
                        className="p-2 rounded-xl bg-elevated dark:bg-elevated text-muted hover:bg-card dark:hover:bg-card transition-all"
                        title={lang === 'ar' ? 'عرض أفقي' : 'Horizontal View'}
                    >
                        <LayoutList size={18} />
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {allCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => onSetCategory(cat.name)}
                            className={`
                                group relative overflow-hidden rounded-2xl transition-all duration-300
                                ${activeCategory === cat.name
                                    ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-app shadow-lg shadow-primary/20'
                                    : 'hover:-translate-y-1 hover:shadow-lg'
                                }
                            `}
                        >
                            {/* Background Image or Gradient */}
                            <div className="aspect-square relative">
                                {cat.image ? (
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className={`w-full h-full ${cat.name === 'All'
                                        ? 'bg-gradient-to-br from-primary to-primary-hover/80'
                                        : 'bg-gradient-to-br from-elevated to-elevated/80 dark:from-elevated/30 dark:to-elevated/10'
                                        }`} />
                                )}

                                {/* Overlay */}
                                <div className={`absolute inset-0 ${activeCategory === cat.name
                                    ? 'bg-primary/70'
                                    : 'bg-black/30 group-hover:bg-black/40'
                                    } transition-all`} />

                                {/* Icon for All */}
                                {cat.name === 'All' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Grid3X3 size={32} className="text-white/80" />
                                    </div>
                                )}
                            </div>

                            {/* Label */}
                            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-[10px] sm:text-xs font-bold text-white text-center truncate">
                                    {cat.name === 'All'
                                        ? (lang === 'ar' ? 'الكل' : 'All')
                                        : (lang === 'ar' ? cat.nameAr || cat.name : cat.name)
                                    }
                                </p>
                                {cat.items && cat.items.length > 0 && (
                                    <p className="text-[8px] text-white/60 text-center">
                                        {cat.items.length} {lang === 'ar' ? 'صنف' : 'items'}
                                    </p>
                                )}
                            </div>

                            {/* Active Indicator */}
                            {activeCategory === cat.name && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-lg" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Horizontal Scroll View (default)
    return (
        <div className="relative">
            {/* View Toggle */}
            {categories.length > 6 && (
                <div className="absolute -top-10 right-0 z-10">
                    <button
                        onClick={() => setViewMode('grid')}
                        className="p-2 rounded-xl bg-elevated dark:bg-elevated text-muted hover:bg-card dark:hover:bg-card transition-all"
                        title={lang === 'ar' ? 'عرض شبكي' : 'Grid View'}
                    >
                        <Grid3X3 size={18} />
                    </button>
                </div>
            )}

            {/* Left Arrow */}
            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-card dark:bg-elevated shadow-lg hover:bg-elevated dark:hover:bg-card transition-all"
                >
                    <ChevronLeft size={20} className="text-main dark:text-main" />
                </button>
            )}

            {/* Categories Scroll Container */}
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto no-scrollbar px-8 py-2"
            >
                {allCategories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => onSetCategory(cat.name)}
                        className={`
                            group flex-shrink-0 relative overflow-hidden rounded-2xl transition-all duration-300
                            ${isTouchMode ? 'w-28 h-28 md:w-32 md:h-32' : 'w-20 h-20 md:w-24 md:h-24'}
                            ${activeCategory === cat.name
                                ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-app shadow-lg shadow-primary/20 scale-105'
                                : 'hover:scale-105 hover:shadow-lg'
                            }
                        `}
                    >
                        {/* Background Image or Gradient */}
                        {cat.image ? (
                            <img
                                src={cat.image}
                                alt={cat.name}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <div className={`absolute inset-0 ${cat.name === 'All'
                                ? 'bg-gradient-to-br from-primary to-primary-hover/80'
                                : 'bg-gradient-to-br from-elevated to-elevated/80 dark:from-elevated/30 dark:to-elevated/10'
                                }`} />
                        )}

                        {/* Overlay */}
                        <div className={`absolute inset-0 ${activeCategory === cat.name
                            ? 'bg-primary/60'
                            : 'bg-black/20 group-hover:bg-black/30'
                            } transition-all`} />

                        {/* Icon for All */}
                        {cat.name === 'All' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Grid3X3 size={isTouchMode ? 28 : 24} className="text-white/80" />
                            </div>
                        )}

                        {/* Label */}
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className={`font-bold text-white text-center truncate ${isTouchMode ? 'text-xs' : 'text-[10px]'}`}>
                                {cat.name === 'All'
                                    ? (lang === 'ar' ? 'الكل' : 'All')
                                    : (lang === 'ar' ? cat.nameAr || cat.name : cat.name)
                                }
                            </p>
                        </div>

                        {/* Item Count Badge */}
                        {cat.items && cat.items.length > 0 && (
                            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-card/90 dark:bg-card/90 text-main dark:text-main">
                                {cat.items.length}
                            </div>
                        )}

                        {/* Active Check */}
                        {activeCategory === cat.name && (
                            <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-white shadow animate-pulse" />
                        )}
                    </button>
                ))}
            </div>

            {/* Right Arrow */}
            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-card dark:bg-elevated shadow-lg hover:bg-elevated dark:hover:bg-card transition-all"
                >
                    <ChevronRight size={20} className="text-main dark:text-main" />
                </button>
            )}
        </div>
    );
});

export default CategoryTabs;
