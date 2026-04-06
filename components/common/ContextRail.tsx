import React, { lazy, Suspense, useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Pin,
    PinOff,
    Menu,
    LogOut,
    Wifi,
    WifiOff,
    Search,
    X,
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../../stores/useAuthStore';
import { useOrderStore } from '../../stores/useOrderStore';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { syncService } from '../../services/syncService';
import { NAV_SECTIONS, CONTEXTUAL_NAV_MAP } from './navigation';
import { UserRole } from '../../types';

const AppearanceModal = lazy(() => import('./AppearanceModal'));

interface ContextRailProps { onOpenCommand: () => void; }

const ContextRail: React.FC<ContextRailProps> = ({ onOpenCommand }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { activeBranchId, branches, currentUser, hasPermission, isSidebarCollapsed, language, logout, setActiveBranch, toggleSidebar } = useAuthStore(
        useShallow((state) => ({
            activeBranchId: state.settings.activeBranchId,
            branches: state.branches,
            currentUser: state.settings.currentUser,
            hasPermission: state.hasPermission,
            isSidebarCollapsed: state.isSidebarCollapsed,
            language: state.settings.language,
            logout: state.logout,
            setActiveBranch: state.setActiveBranch,
            toggleSidebar: state.toggleSidebar,
        }))
    );
    const setDiscount = useOrderStore((state) => state.setDiscount);
    const discount = useOrderStore((state) => state.discount);
    const activeShift = useFinanceStore((state) => state.activeShift);
    const setIsCloseShiftModalOpen = useFinanceStore((state) => state.setIsCloseShiftModalOpen);

    const lang = (language || 'en') as 'en' | 'ar';
    const isRtl = lang === 'ar';
    const user = currentUser;
    const isCC = user?.role === UserRole.CALL_CENTER;
    const pinned = !isSidebarCollapsed;

    const [mobileOpen, setMobileOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [syncStats, setSyncStats] = useState({ total: 0, pending: 0, failed: 0, synced: 0 });
    const [showAppearanceModal, setShowAppearanceModal] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
    const navRef = useRef<HTMLElement>(null);

    const filteredSections = useMemo(() => {
        const baseSections = CONTEXTUAL_NAV_MAP[location.pathname] || NAV_SECTIONS;
        return baseSections
            .map((section) => ({
                ...section,
                items: section.items.filter((item) => hasPermission(item.permission)),
            }))
            .filter((section) => section.items.length > 0);
    }, [hasPermission, location.pathname]);

    useEffect(() => {
        const initialMap: Record<string, boolean> = {};
        filteredSections.forEach((section) => {
            initialMap[section.id] = true;
        });
        setOpenSections((prev) => (Object.keys(prev).length === 0 ? initialMap : prev));
    }, [filteredSections]);

    const toggleSection = useCallback((id: string) => {
        setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    useEffect(() => {
        let mounted = true;
        const refresh = async () => {
            try {
                const stats = await syncService.getQueueStats();
                if (mounted) {
                    setSyncStats(stats);
                }
            } catch {
                // ignore sync status errors in the shell
            }
        };
        const onOnline = () => {
            setIsOnline(true);
            refresh();
        };
        const onOffline = () => {
            setIsOnline(false);
            refresh();
        };

        refresh();
        const id = window.setInterval(refresh, 8000);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        return () => {
            mounted = false;
            window.clearInterval(id);
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    useEffect(() => {
        const open = () => setMobileOpen(true);
        window.addEventListener('rf:open-rail', open as EventListener);
        return () => window.removeEventListener('rf:open-rail', open as EventListener);
    }, []);

    const handleLogout = useCallback(() => {
        logout();
        navigate('/login');
    }, [logout, navigate]);

    const syncHasError = syncStats.failed > 0;
    const syncHasPending = syncStats.pending > 0;
    const userInitials = user?.name?.split(' ').map((word) => word[0]).join('').substring(0, 2).toUpperCase() || 'AD';
    const totalNavItems = filteredSections.reduce((sum, section) => sum + section.items.length, 0);

    return (
        <>
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-[70]"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <button
                onClick={() => setMobileOpen(true)}
                className={`lg:hidden fixed top-3 z-[60] p-2.5 rounded-xl border shadow-lg bg-card/95 text-main border-border/30 ${isRtl ? 'right-3' : 'left-3'}`}
                aria-label="Open menu"
            >
                <Menu size={18} />
            </button>

            <aside
                className={`
                    workspace-rail
                    ${pinned ? 'rail-pinned' : ''}
                    ${mobileOpen ? 'translate-x-0' : `${isRtl ? 'translate-x-full' : '-translate-x-full'} lg:translate-x-0`}
                `}
                style={{
                    fontFamily: isRtl ? 'var(--font-arabic)' : 'var(--font-body)',
                    [isRtl ? 'right' : 'left']: 'var(--rail-margin, 8px)',
                }}
            >
                <div className="sidebar-hero shrink-0">
                    <div className="sidebar-hero-top">
                        <div className="sidebar-logomark shrink-0" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                            <span>RF</span>
                        </div>
                        <div className="sidebar-text-block sidebar-brand-meta min-w-0 flex-1">
                            <div className="text-[12px] font-extrabold tracking-tight text-main leading-none">RestoFlow</div>
                            <div className="text-[9px] font-semibold text-muted/50 tracking-widest uppercase mt-0.5">
                                {lang === 'ar' ? 'ظ†ط¸ط§ظ… ط§ظ„ط·ط¹ط§ظ…' : 'Restaurant OS'}
                            </div>
                        </div>
                        <button
                            onClick={toggleSidebar}
                            className="sidebar-pin-btn hidden lg:flex shrink-0 ml-auto"
                            title={pinned ? (lang === 'ar' ? 'ط¥ظ„ط؛ط§ط، ط§ظ„طھط«ط¨ظٹطھ' : 'Unpin sidebar') : (lang === 'ar' ? 'طھط«ط¨ظٹطھ ط§ظ„ط³ط§ظٹط¯ط¨ط§ط±' : 'Pin sidebar')}
                        >
                            {pinned ? <PinOff size={12} /> : <Pin size={12} />}
                        </button>
                        {mobileOpen && (
                            <button onClick={() => setMobileOpen(false)} className="lg:hidden sidebar-collapse-btn shrink-0 ml-auto">
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    <div className="sidebar-text-block sidebar-brand-chip">
                        <span className={`sidebar-brand-status ${isOnline ? 'is-online' : 'is-offline'}`}>
                            {isOnline ? (lang === 'ar' ? 'ظ…طھطµظ„' : 'Online') : (lang === 'ar' ? 'ط؛ظٹط± ظ…طھطµظ„' : 'Offline')}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={onOpenCommand}
                            className="sidebar-search-btn"
                            title={lang === 'ar' ? 'ظپطھط­ ط§ظ„ط¨ط­ط«' : 'Open Search'}
                        >
                            <Search size={13} />
                            <span className="sidebar-nav-label">{lang === 'ar' ? 'ط¨ط­ط« ط³ط±ظٹط¹' : 'Quick Search'}</span>
                            <span className="sidebar-kbd ms-auto sidebar-nav-label">⌘K</span>
                        </button>
                        <div className="sidebar-overview">
                            <div className="sidebar-overview-pill">
                                <Sparkles size={10} />
                                <span>{totalNavItems} {lang === 'ar' ? 'ظ…ط³ط§ط±' : 'routes'}</span>
                            </div>
                            <div className={`sidebar-overview-pill ${isOnline ? 'is-live' : 'is-offline'}`}>
                                {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                                <span>{isOnline ? (lang === 'ar' ? 'ظ…طھطµظ„' : 'Live') : (lang === 'ar' ? 'ط؛ظٹط± ظ…طھطµظ„' : 'Off')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {isCC && (
                    <div className="mx-2 mb-2 shrink-0">
                        <div className="sidebar-panel">
                            <div className="sidebar-panel-title">{lang === 'ar' ? 'ط£ط¯ظˆط§طھ ط§ظ„ظ…ط´ط؛ظ„' : 'Operator Tools'}</div>
                            <div className="flex gap-1 flex-wrap mb-2">
                                {[0, 5, 10, 15, 20].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => setDiscount(value)}
                                        className={`sidebar-chip ${discount === value ? 'sidebar-chip-active' : ''}`}
                                    >
                                        {value}%
                                    </button>
                                ))}
                            </div>
                            <select
                                value={activeBranchId || ''}
                                onChange={(event) => setActiveBranch(event.target.value)}
                                className="sidebar-select"
                            >
                                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                <nav ref={navRef} className="sidebar-nav sidebar-nav-shell flex-1 overflow-y-auto overflow-x-hidden px-1.5">
                    {filteredSections.map((section, idx) => {
                        const isOpen = openSections[section.id] ?? true;
                        return (
                            <div key={section.id} className={`sidebar-nav-group ${idx > 0 ? 'mt-3' : 'mt-0.5'}`}>
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="sidebar-text-block sidebar-section-trigger w-full flex items-center justify-between group"
                                >
                                    <span>{lang === 'ar' ? (section as any).labelAr ?? section.label : section.label}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="sidebar-section-count">{section.items.length}</span>
                                        <ChevronDown
                                            size={11}
                                            className="text-muted/40 transition-transform duration-200"
                                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                        />
                                    </div>
                                </button>

                                <div
                                    className="sidebar-section-wrap grid transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                    style={{
                                        gridTemplateRows: isOpen ? '1fr' : '0fr',
                                        opacity: isOpen ? 1 : 0,
                                        marginTop: isOpen ? '2px' : '0px',
                                    }}
                                >
                                    <div className="sidebar-section-list flex flex-col gap-0.5 overflow-hidden">
                                        {section.items.map((item) => {
                                            const Icon = item.icon;
                                            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                                            return (
                                                <NavLink
                                                    key={item.id}
                                                    to={item.path}
                                                    onClick={() => setMobileOpen(false)}
                                                    className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
                                                    title={lang === 'ar' ? item.labelAr : item.label}
                                                >
                                                    <span className="sidebar-nav-glow" />
                                                    <span className={`sidebar-nav-icon ${isActive ? 'sidebar-nav-icon-active' : ''}`}>
                                                        <Icon size={14} />
                                                    </span>
                                                    <span className="sidebar-nav-label">{lang === 'ar' ? item.labelAr : item.label}</span>
                                                    <span className="sidebar-nav-hint">
                                                        <ChevronRight size={11} />
                                                    </span>
                                                    {isActive && <span className="sidebar-nav-dot" />}
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div className="h-3" />
                </nav>

                <div className="sidebar-footer shrink-0">
                    <div className="sidebar-sync-bar">
                        <div className="flex items-center gap-1.5">
                            {isOnline ? <Wifi size={9} className="text-emerald-500" /> : <WifiOff size={9} className="text-rose-500" />}
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isOnline ? 'Live' : 'Offline'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 ms-auto">
                            {syncHasError && (
                                <span className="sidebar-sync-badge danger">
                                    <AlertTriangle size={7} />{syncStats.failed}
                                </span>
                            )}
                            {syncHasPending && (
                                <span className="sidebar-sync-badge warn">
                                    {syncStats.pending} {lang === 'ar' ? 'ط§ظ†طھط¸ط§ط±' : 'wait'}
                                </span>
                            )}
                            {!syncHasError && !syncHasPending && syncStats.synced > 0 && (
                                <span className="sidebar-sync-badge ok">
                                    <CheckCircle size={7} />{lang === 'ar' ? 'ظ…ط²ط§ظ…ظ†' : 'synced'}
                                </span>
                            )}
                        </div>
                    </div>

                    {activeShift && (
                        <div className="px-2 pb-0.5">
                            <button
                                onClick={() => setIsCloseShiftModalOpen(true)}
                                className="sidebar-close-shift"
                            >
                                <LogOut size={12} />
                                <span className="sidebar-nav-label">{lang === 'ar' ? 'ط¥ط؛ظ„ط§ظ‚ ط§ظ„ظˆط±ط¯ظٹط©' : 'Close Shift'}</span>
                                <span className="sidebar-nav-label ms-auto text-[8px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                    {lang === 'ar' ? 'ظ†ط´ط·ط©' : 'Active'}
                                </span>
                            </button>
                        </div>
                    )}

                    <div className="px-2 pb-2.5 relative">
                        <div className="sidebar-user-card cursor-pointer hover:border-primary/20 transition-colors" onClick={() => setShowAppearanceModal(true)}>
                            <div className="sidebar-user-avatar">
                                {userInitials}
                                <span className="sidebar-user-online" />
                            </div>
                            <div className="sidebar-text-block min-w-0 flex-1 pr-1">
                                <div className="text-[10px] font-bold text-main truncate leading-tight">{user?.name || 'User'}</div>
                                <div className="text-[8px] font-semibold text-muted/50 uppercase tracking-[0.12em] mt-0.5">{user?.role}</div>
                            </div>
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleLogout();
                                }}
                                className="sidebar-text-block p-1 rounded-lg text-muted/50 hover:text-rose-500 hover:bg-rose-500/8 transition-all shrink-0"
                                title={lang === 'ar' ? 'طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬' : 'Logout'}
                            >
                                <LogOut size={11} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
            <Suspense fallback={null}>
                {showAppearanceModal ? (
                    <AppearanceModal isOpen={showAppearanceModal} onClose={() => setShowAppearanceModal(false)} />
                ) : null}
            </Suspense>
        </>
    );
};

export default React.memo(ContextRail);
