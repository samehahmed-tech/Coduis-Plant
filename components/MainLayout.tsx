import React, { Suspense, lazy, useCallback, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import Login from './Login';
import ContextRail from './common/ContextRail';
import MobileBottomNav from './common/MobileBottomNav';
import ScrollToTop from './common/ScrollToTop';
import Breadcrumbs from './common/Breadcrumbs';
import { useAuthStore } from '../stores/useAuthStore';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTheme } from '../theme';

const GlobalSearch = lazy(() => import('./common/GlobalSearch'));
const KeyboardShortcuts = lazy(() => import('./common/KeyboardShortcuts'));
const OnlineStatus = lazy(() => import('./common/OnlineStatus'));
const AIWidgetsRenderer = lazy(() => import('./common/AIWidgetsRenderer'));

const MainLayout: React.FC = () => {
    const { isAuthenticated, language } = useAuthStore(
        useShallow((state) => ({
            isAuthenticated: state.isAuthenticated,
            language: state.settings.language,
        }))
    );
    const location = useLocation();
    const { config } = useTheme();

    usePageTitle();

    const isFullscreenRoute = location.pathname === '/pos' || location.pathname === '/kds';
    const { densityClass, direction, fontClass } = useMemo(() => {
        const isRtl = language === 'ar';
        return {
            densityClass: `density-${config.layout.density}`,
            direction: isRtl ? 'rtl' : 'ltr',
            fontClass: isRtl ? 'font-neo-ar' : 'font-neo',
        };
    }, [config.layout.density, language]);

    const handleOpenCommand = useCallback(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' }));
    }, []);

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

            {!isFullscreenRoute && <ContextRail onOpenCommand={handleOpenCommand} />}

            <main className="flex-1 flex flex-col relative z-10 overflow-hidden min-w-0 min-h-0">
                <div className={`flex-1 min-h-0 ${isFullscreenRoute ? 'overflow-hidden h-full' : 'overflow-y-auto overflow-x-hidden'}`}>
                    <div className={`flex flex-col ${isFullscreenRoute ? 'h-full overflow-hidden' : 'min-h-full'}`}>
                        {!isFullscreenRoute && <Breadcrumbs />}
                        <div key={location.pathname} className={`animate-fade-in flex-1 ${isFullscreenRoute ? 'h-full' : ''}`}>
                            <Outlet />
                        </div>
                    </div>
                </div>

                {!isFullscreenRoute && <MobileBottomNav onOpenCommand={handleOpenCommand} />}
            </main>

            <Suspense fallback={null}>
                <GlobalSearch />
                <KeyboardShortcuts />
                <OnlineStatus />
                <AIWidgetsRenderer />
            </Suspense>
            {!isFullscreenRoute && <ScrollToTop />}
        </div>
    );
};

export default MainLayout;
