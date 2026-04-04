import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ChevronRight, GitBranch, ShoppingBag, ChefHat, Truck, Clock } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useFinanceStore } from '../../stores/useFinanceStore';
import LiveClock from './LiveClock';
import { NAV_SECTIONS } from './navigation';

interface WorkspaceTopBarProps {
    onOpenCommand: () => void;
    recentPaths: string[]; // Kept for interface compatibility but not used in UI
}

const WorkspaceTopBar: React.FC<WorkspaceTopBarProps> = ({ onOpenCommand }) => {
    const location = useLocation();
    const { settings, branches } = useAuthStore();
    const activeShift = useFinanceStore(s => s.activeShift);
    const lang = (settings.language || 'en') as 'en' | 'ar';
    const isRtl = lang === 'ar';

    const activeBranch = branches.find(b => b.id === settings.activeBranchId);

    const getPageInfo = () => {
        for (const section of NAV_SECTIONS) {
            const item = section.items.find(i => i.path === location.pathname);
            if (item) return {
                title: lang === 'ar' ? item.labelAr : item.label,
                sectionTitle: lang === 'ar' ? (section as any).labelAr ?? section.label : section.label,
            };
        }
        return { title: lang === 'ar' ? 'لوحة القيادة التشغيلية' : 'Command Center', sectionTitle: '' };
    };

    const { title, sectionTitle } = getPageInfo();
    const subtitle = activeBranch?.name || (lang === 'ar' ? 'جميع الفروع' : 'All Branches');



    return (
        <div className="workspace-topbar border-b border-border/20">
            {/* Left: breadcrumb title & shift status */}
            <div className="topbar-left flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-muted/60 uppercase tracking-widest mb-0.5">
                    {sectionTitle && (
                        <>
                            <span>{sectionTitle}</span>
                            <ChevronRight size={10} className="opacity-50" />
                        </>
                    )}
                    <span className="text-main/80">{title}</span>
                </div>
                <div className="topbar-subtitle flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-main font-bold">
                        <GitBranch size={11} className="text-primary" />
                        {subtitle}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    {activeShift ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {lang === 'ar' ? 'وردية نشطة' : 'Active Shift'}
                        </span>
                    ) : (
                        <span className="text-amber-500 font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {lang === 'ar' ? 'مغلق' : 'Closed'}
                        </span>
                    )}
                </div>
            </div>

            {/* Center: Command Palette (Search) */}
            <div className="flex items-center justify-center flex-1 px-4 hidden md:flex">
                <button onClick={onOpenCommand} className="group relative w-full max-w-[400px] flex items-center gap-3 px-4 py-2 bg-card border border-border/50 rounded-2xl hover:border-primary/40 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <Search size={16} className="text-muted group-hover:text-primary transition-colors" />
                    <span className="text-[12px] text-muted/80 font-semibold tracking-wide flex-1 text-left">{lang === 'ar' ? 'البحث أو الأتصال...' : 'Search or command...'}</span>
                    <div className="flex items-center gap-1">
                        <kbd className="bg-elevated text-muted border border-border/40 shadow-sm rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest group-hover:border-primary/30 transition-colors">CTRL</kbd>
                        <kbd className="bg-elevated text-muted border border-border/40 shadow-sm rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest group-hover:border-primary/30 transition-colors">K</kbd>
                    </div>
                </button>
            </div>

            {/* Right: Clock */}
            <div className="topbar-right flex items-center gap-3">
                <button onClick={onOpenCommand} className="md:hidden p-2 text-muted hover:text-primary transition-colors">
                    <Search size={18} />
                </button>
                <div className="hidden sm:block">
                    <LiveClock />
                </div>
            </div>
        </div>
    );
};

export default WorkspaceTopBar;
