import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Login from './Login';
import ContextRail from './common/ContextRail';
import GlobalSearch from './common/GlobalSearch';
import MobileBottomNav from './common/MobileBottomNav';
import ScrollToTop from './common/ScrollToTop';
import KeyboardShortcuts from './common/KeyboardShortcuts';
import OnlineStatus from './common/OnlineStatus';
import Breadcrumbs from './common/Breadcrumbs';
import { useAuthStore } from '../stores/useAuthStore';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTheme } from '../theme';

const MainLayout: React.FC = () => {
    const { isAuthenticated, settings } = useAuthStore();
    const location = useLocation();
    const { config } = useTheme();

    usePageTitle();

    const isFullscreenRoute = location.pathname === '/pos' || location.pathname === '/kds';
    const isRtl = settings.language === 'ar';
    const fontClass = isRtl ? 'font-neo-ar' : 'font-neo';
    const direction = isRtl ? 'rtl' : 'ltr';
    const densityClass = `density-${config.layout.density}`;

    if (!isAuthenticated) return <Login />;

    return (
        <div
            className={`workspace-shell ${isFullscreenRoute ? 'pos-ui' : 'neo-ui'} ${densityClass} flex h-[100dvh] w-full overflow-hidden text-main ${fontClass} transition-colors duration-300`}
            dir={direction}
        >
            {!isFullscreenRoute && (
                <>
                    <div className="workspace-backdrop-layer fixed inset-0 pointer-events-none z-0" />
                    <div className="workspace-backdrop-grid fixed inset-0 pointer-events-none z-0" />
                    <div className="workspace-backdrop-glow fixed inset-0 pointer-events-none z-0" />
                </>
            )}

            {/* Sidebar — hidden on fullscreen operational screens */}
            {!isFullscreenRoute && <ContextRail onOpenCommand={() => {}} />}

            {/* Main content area — takes all remaining space */}
            <main
                className="flex-1 flex flex-col relative z-10 overflow-hidden min-w-0 min-h-0"
            >
                {/* Scrollable content zone — min-h-0 is CRITICAL for flex overflow */}
                <div className={`flex-1 min-h-0 ${isFullscreenRoute ? 'overflow-hidden h-full' : 'overflow-y-auto overflow-x-hidden'}`}>
                    {/* Inner wrapper for Breadcrumbs + Outlet */}
                    <div className={`flex flex-col ${isFullscreenRoute ? 'h-full overflow-hidden' : 'min-h-full'}`}>
                        {!isFullscreenRoute && <Breadcrumbs />}
                        {/* Page transition wrapper */}
                        <div key={location.pathname} className={`animate-fade-in flex-1 ${isFullscreenRoute ? 'h-full' : ''}`}>
                            <Outlet />
                        </div>
                    </div>
                </div>

                {/* Mobile bottom navigation — only on non-POS below lg */}
                {!isFullscreenRoute && <MobileBottomNav onOpenCommand={() => {}} />}
            </main>

            {/* Global search — mounted once, listens to Cmd+K internally */}
            <GlobalSearch />
            {!isFullscreenRoute && <ScrollToTop />}
            <KeyboardShortcuts />
            <OnlineStatus />
        </div>
    );
};

export default MainLayout;
