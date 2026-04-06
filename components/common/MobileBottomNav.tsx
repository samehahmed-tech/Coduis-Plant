import React, { memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, MoreHorizontal } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../../stores/useAuthStore';
import { PRIMARY_MOBILE_NAV } from './navigation';

interface MobileBottomNavProps {
    onOpenCommand: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenCommand }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission, lang, toggleSidebar } = useAuthStore(
        useShallow((state) => ({
            hasPermission: state.hasPermission,
            lang: state.settings.language || 'en',
            toggleSidebar: state.toggleSidebar,
        }))
    );

    const navItems = PRIMARY_MOBILE_NAV.filter((item) => hasPermission(item.permission));

    return (
        <nav className="workspace-mobile-nav fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            <div className="workspace-mobile-nav-inner flex items-center justify-around px-2 pt-2 pb-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`workspace-mobile-nav-item flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-300 min-w-[64px] ${isActive ? 'workspace-mobile-nav-item-active text-primary transform -translate-y-1' : 'text-muted hover:text-main'}`}
                        >
                            <div className={`workspace-mobile-nav-icon p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/10 shadow-sm' : 'bg-transparent'}`}>
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-primary' : 'text-muted/60'}`}>
                                {lang === 'ar' ? item.labelAr : item.label}
                            </span>
                        </button>
                    );
                })}
                <button
                    onClick={onOpenCommand}
                    className="workspace-mobile-nav-item flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-primary min-w-[64px] transition-all duration-300"
                >
                    <div className="workspace-mobile-nav-icon p-2 rounded-xl bg-primary/10 shadow-sm"><Search size={20} strokeWidth={2} /></div>
                    <span className="text-[9px] font-bold uppercase tracking-wider">{lang === 'ar' ? 'ط¨ط­ط«' : 'Search'}</span>
                </button>
                <button
                    onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                            window.dispatchEvent(new Event('rf:open-rail'));
                        } else {
                            toggleSidebar();
                        }
                    }}
                    className="workspace-mobile-nav-item flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-muted hover:text-main min-w-[64px] transition-all duration-300"
                >
                    <div className="workspace-mobile-nav-icon p-2"><MoreHorizontal size={20} strokeWidth={1.5} /></div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted/60">{lang === 'ar' ? 'ط§ظ„ظ…ط²ظٹط¯' : 'More'}</span>
                </button>
            </div>
        </nav>
    );
};

export default memo(MobileBottomNav);
