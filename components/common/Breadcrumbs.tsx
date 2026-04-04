import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { translations } from '../../services/translations';

// Map of raw paths to generic translation keys
const PATH_MAP: Record<string, string> = {
    'pos': 'pos',
    'kitchen': 'kitchen',
    'orders': 'orders',
    'tables': 'tables',
    'production': 'production',
    'menu': 'menu',
    'inventory': 'inventory',
    'finance': 'finance',
    'reports': 'reports',
    'crm': 'crm',
    'user-management': 'team',
    'call-center': 'call_center',
    'dispatch': 'dispatch',
    'ai-assistant': 'ai_assistant',
    'marketing': 'marketing',
    'settings': 'settings',
};

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const { settings } = useAuthStore();
    const language = (settings.language || 'en') as 'en' | 'ar';
    const isRtl = language === 'ar';
    const t = translations[language];

    const breadcrumbs = useMemo(() => {
        const pathnames = location.pathname.split('/').filter((x) => x);
        const crumbs = [];

        // Always add Home
        crumbs.push({
            name: isRtl ? 'الرئيسية' : 'Home',
            path: '/',
            isLast: pathnames.length === 0,
        });

        let currentPath = '';

        pathnames.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === pathnames.length - 1;

            // Try to translate the segment, otherwise capitalize
            let name = segment;
            const mappedKey = PATH_MAP[segment];
            if (mappedKey && (t as any)[mappedKey]) {
                name = (t as any)[mappedKey];
            } else if (segment.length === 36 && segment.includes('-')) {
                name = isRtl ? 'تفاصيل' : 'Details'; // UUID detection
            } else {
                name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
            }

            crumbs.push({
                name,
                path: currentPath,
                isLast,
            });
        });

        return crumbs;
    }, [location.pathname, t, isRtl]);

    if (location.pathname === '/' || location.pathname === '/pos' || location.pathname === '/kitchen') {
        return null; // Less clutter on operational screens
    }

    return (
        <nav
            aria-label="Breadcrumb"
            className={`px-4 sm:px-6 pt-4 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}
        >
            <div className={`workspace-breadcrumbs ${isRtl ? 'workspace-breadcrumbs-rtl' : ''}`}>
                <div className="workspace-breadcrumbs-meta">
                    <span className="workspace-breadcrumbs-kicker">{isRtl ? 'مسار العمل' : 'Workspace Path'}</span>
                    <span className="workspace-breadcrumbs-title">
                        {breadcrumbs[breadcrumbs.length - 1]?.name}
                    </span>
                </div>
                <ol className={`flex items-center gap-1.5 sm:gap-2.5 w-full flex-wrap`}>
                {breadcrumbs.map((crumb, index) => {
                    const isFirst = index === 0;

                    return (
                        <li key={crumb.path} className={`flex items-center ${isRtl && index > 0 ? 'flex-row-reverse' : ''}`}>
                            {index > 0 && (
                                <ChevronRight
                                    size={14}
                                    className={`text-muted/40 mx-1 shrink-0 ${isRtl ? 'rotate-180' : ''}`}
                                    aria-hidden="true"
                                />
                            )}

                            {crumb.isLast ? (
                                <span className="text-[11px] sm:text-[13px] font-bold text-main flex items-center gap-1.5 transition-colors">
                                    {isFirst && <Home size={14} className="text-muted/70" />}
                                    {crumb.name}
                                </span>
                            ) : (
                                <Link
                                    to={crumb.path}
                                    className="text-[11px] sm:text-[13px] font-semibold text-muted hover:text-primary transition-colors flex items-center gap-1.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                >
                                    {isFirst && <Home size={14} className={isRtl ? 'ml-1' : 'mr-1'} />}
                                    {crumb.name}
                                </Link>
                            )}
                        </li>
                    );
                })}
                </ol>
            </div>
        </nav>
    );
};

export default Breadcrumbs;
