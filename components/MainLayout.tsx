
import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Login from './Login';
import { useAuthStore } from '../stores/useAuthStore';

const MainLayout: React.FC = () => {
    const { isAuthenticated, settings, isSidebarCollapsed } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Login />;
    }

    // Sidebar widths matching Sidebar.tsx
    const sidebarWidth = isSidebarCollapsed ? 'lg:pl-20' : (settings.isTouchMode ? 'lg:pl-80' : 'lg:pl-64');
    const sidebarWidthRtl = isSidebarCollapsed ? 'lg:pr-20' : (settings.isTouchMode ? 'lg:pr-80' : 'lg:pr-64');

    // Apply theme and dark mode
    const theme = settings.theme || 'xen';
    const isDark = settings.isDarkMode;
    const fontClass = settings.language === 'ar' ? 'font-cairo' : 'font-outfit';
    const direction = settings.language === 'ar' ? 'rtl' : 'ltr';
    const layoutPadding = settings.language === 'ar' ? sidebarWidthRtl : sidebarWidth;

    return (
        <div
            className={`flex h-screen bg-app text-main ${isDark ? 'dark' : ''} ${fontClass} transition-colors duration-500`}
            dir={direction}
            data-theme={theme}
        >
            {/* Premium Static Background Gradient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] dark:bg-primary/10" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] dark:bg-secondary/5" />
            </div>

            <Sidebar />
            <main className={`flex-1 overflow-hidden relative transition-all duration-300 z-10 ${layoutPadding}`}>
                <div className="h-full overflow-y-auto no-scrollbar scroll-smooth">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
