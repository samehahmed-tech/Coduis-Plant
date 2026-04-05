import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Pin, PinOff, Menu, LogOut,
    Wifi, WifiOff, Search, X, AlertTriangle, CheckCircle, ChevronDown, Sparkles, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useOrderStore } from '../../stores/useOrderStore';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { syncService } from '../../services/syncService';
import { NAV_SECTIONS, CONTEXTUAL_NAV_MAP } from './navigation';
import { AppTheme, UserRole } from '../../types';
import AppearanceModal from './AppearanceModal';

interface ContextRailProps { onOpenCommand: () => void; }

const ContextRail: React.FC<ContextRailProps> = ({ onOpenCommand }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        settings, branches, hasPermission, logout,
        updateSettings, toggleSidebar, isSidebarCollapsed, setActiveBranch,
    } = useAuthStore();
    const setDiscount = useOrderStore(s => s.setDiscount);
    const discount = useOrderStore(s => s.discount);
    const activeShift = useFinanceStore(s => s.activeShift);
    const setIsCloseShiftModalOpen = useFinanceStore(s => s.setIsCloseShiftModalOpen);

    const lang = (settings.language || 'en') as 'en' | 'ar';
    const isRtl = lang === 'ar';
    const user = settings.currentUser;
    const isCC = user?.role === UserRole.CALL_CENTER;
    const pinned = !isSidebarCollapsed; // pinned = expanded & locked

    const [mobileOpen, setMobileOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [syncStats, setSyncStats] = useState({ total: 0, pending: 0, failed: 0, synced: 0 });
    const [showAppearanceModal, setShowAppearanceModal] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
    const navRef = useRef<HTMLElement>(null);

    const filteredSections = useMemo(() => {
        const baseSections = CONTEXTUAL_NAV_MAP[location.pathname] || NAV_SECTIONS;
        return baseSections.map(section => ({
            ...section,
            items: section.items.filter(item => hasPermission(item.permission)),
        })).filter(section => section.items.length > 0);
    }, [hasPermission, location.pathname]);

    // Initialize all sections as open by default
    useEffect(() => {
        const initialMap: Record<string, boolean> = {};
        filteredSections.forEach(sec => initialMap[sec.id] = true);
        setOpenSections(prev => Object.keys(prev).length === 0 ? initialMap : prev);
    }, [filteredSections]);

    const toggleSection = useCallback((id: string) => {
        setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    useEffect(() => {
        let mounted = true;
        const refresh = async () => {
            try { const s = await syncService.getQueueStats(); if (mounted) setSyncStats(s); } catch { /* ok */ }
        };
        const onOnline = () => { setIsOnline(true); refresh(); };
        const onOffline = () => { setIsOnline(false); refresh(); };
        refresh();
        const id = window.setInterval(refresh, 8000); // Reduced polling frequency for perf
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => { mounted = false; clearInterval(id); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
    }, []);

    useEffect(() => {
        const open = () => setMobileOpen(true);
        window.addEventListener('rf:open-rail', open as EventListener);
        return () => window.removeEventListener('rf:open-rail', open as EventListener);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const syncHasError = syncStats.failed > 0;
    const syncHasPending = syncStats.pending > 0;

    const userInitials = user?.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'AD';
    const totalNavItems = filteredSections.reduce((sum, section) => sum + section.items.length, 0);

    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-[70]"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                className={`lg:hidden fixed top-3 z-[60] p-2.5 rounded-xl border shadow-lg
                    bg-card/95 text-main border-border/30
                    ${isRtl ? 'right-3' : 'left-3'}`}
                aria-label="Open menu"
            >
                <Menu size={18} />
            </button>

            {/* ── SIDEBAR ── */}
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

                {/* ╔═══════════════════╗
                    ║  HEADER / BRAND   ║
                    ╚═══════════════════╝ */}
                <div className="sidebar-hero shrink-0">
                    <div className="sidebar-hero-top">
                    {/* Logo mark */}
                    <div className="sidebar-logomark shrink-0" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <span>RF</span>
                    </div>
                    <div className="sidebar-text-block sidebar-brand-meta min-w-0 flex-1">
                        <div className="text-[12px] font-extrabold tracking-tight text-main leading-none">RestoFlow</div>
                        <div className="text-[9px] font-semibold text-muted/50 tracking-widest uppercase mt-0.5">
                            {lang === 'ar' ? 'نظام المطاعم' : 'Restaurant OS'}
                        </div>
                    </div>
                    {/* Pin toggle (desktop) */}
                    <button
                        onClick={toggleSidebar}
                        className="sidebar-pin-btn hidden lg:flex shrink-0 ml-auto"
                        title={pinned ? (lang === 'ar' ? 'إلغاء التثبيت' : 'Unpin sidebar') : (lang === 'ar' ? 'تثبيت السايدبار' : 'Pin sidebar')}
                    >
                        {pinned ? <PinOff size={12} /> : <Pin size={12} />}
                    </button>
                    {/* Mobile close */}
                    {mobileOpen && (
                        <button onClick={() => setMobileOpen(false)} className="lg:hidden sidebar-collapse-btn shrink-0 ml-auto">
                            <X size={13} />
                        </button>
                    )}
                    </div>

                    <div className="sidebar-text-block sidebar-brand-chip">
                        <span className={`sidebar-brand-status ${isOnline ? 'is-online' : 'is-offline'}`}>
                            {isOnline ? (lang === 'ar' ? 'متصل' : 'Online') : (lang === 'ar' ? 'غير متصل' : 'Offline')}
                        </span>
                    </div>

                    <div className="space-y-2">
                    <button
                        onClick={onOpenCommand}
                        className="sidebar-search-btn"
                        title={lang === 'ar' ? 'فتح البحث' : 'Open Search'}
                    >
                        <Search size={13} />
                        <span className="sidebar-nav-label">{lang === 'ar' ? 'بحث سريع' : 'Quick Search'}</span>
                        <span className="sidebar-kbd ms-auto sidebar-nav-label">⌘K</span>
                    </button>
                    <div className="sidebar-overview">
                        <div className="sidebar-overview-pill">
                            <Sparkles size={10} />
                            <span>{totalNavItems} {lang === 'ar' ? 'مسار' : 'routes'}</span>
                        </div>
                        <div className={`sidebar-overview-pill ${isOnline ? 'is-live' : 'is-offline'}`}>
                            {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                            <span>{isOnline ? (lang === 'ar' ? 'متصل' : 'Live') : (lang === 'ar' ? 'غير متصل' : 'Off')}</span>
                        </div>
                    </div>
                    </div>
                </div>

                {/* ╔══════════════════════╗
                    ║  CALL CENTER PANEL   ║
                    ╚══════════════════════╝ */}
                {isCC && (
                    <div className="mx-2 mb-2 shrink-0">
                        <div className="sidebar-panel">
                            <div className="sidebar-panel-title">{lang === 'ar' ? 'أدوات المشغل' : 'Operator Tools'}</div>
                            <div className="flex gap-1 flex-wrap mb-2">
                                {[0, 5, 10, 15, 20].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDiscount(d)}
                                        className={`sidebar-chip ${discount === d ? 'sidebar-chip-active' : ''}`}
                                    >
                                        {d}%
                                    </button>
                                ))}
                            </div>
                            <select
                                value={settings.activeBranchId || ''}
                                onChange={e => setActiveBranch(e.target.value)}
                                className="sidebar-select"
                            >
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* ╔══════════════════════╗
                    ║    NAVIGATION        ║
                    ╚══════════════════════╝ */}
                <nav ref={navRef} className="sidebar-nav sidebar-nav-shell flex-1 overflow-y-auto overflow-x-hidden px-1.5">
                    {filteredSections.map((section, idx) => {
                        const isOpen = openSections[section.id] ?? true;
                        return (
                            <div key={section.id} className={`sidebar-nav-group ${idx > 0 ? 'mt-3' : 'mt-0.5'}`}>
                                {/* Section label (Collapsible Button) */}
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

                                {/* Items Container with smooth expand/collapse */}
                                <div
                                    className="sidebar-section-wrap grid transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                    style={{
                                        gridTemplateRows: isOpen ? '1fr' : '0fr',
                                        opacity: isOpen ? 1 : 0,
                                        marginTop: isOpen ? '2px' : '0px'
                                    }}
                                >
                                    <div className="sidebar-section-list flex flex-col gap-0.5 overflow-hidden">
                                        {section.items.map(item => {
                                            const Icon = item.icon;
                                            const isActive = location.pathname === item.path
                                                || (item.path !== '/' && location.pathname.startsWith(item.path));
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
                    <div className="h-3" /> {/* bottom padding */}
                </nav>

                {/* ╔══════════════════════╗
                    ║       FOOTER         ║
                    ╚══════════════════════╝ */}
                <div className="sidebar-footer shrink-0">

                    {/* ── Sync Status Bar ── */}
                    <div className="sidebar-sync-bar">
                        <div className="flex items-center gap-1.5">
                            {isOnline
                                ? <Wifi size={9} className="text-emerald-500" />
                                : <WifiOff size={9} className="text-rose-500" />}
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
                                    {syncStats.pending} {lang === 'ar' ? 'انتظار' : 'wait'}
                                </span>
                            )}
                            {!syncHasError && !syncHasPending && syncStats.synced > 0 && (
                                <span className="sidebar-sync-badge ok">
                                    <CheckCircle size={7} />{lang === 'ar' ? 'مزامن' : 'synced'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── Close Shift ── */}
                    {activeShift && (
                        <div className="px-2 pb-0.5">
                            <button
                                onClick={() => setIsCloseShiftModalOpen(true)}
                                className="sidebar-close-shift"
                            >
                                <LogOut size={12} />
                                <span className="sidebar-nav-label">{lang === 'ar' ? 'إغلاق الوردية' : 'Close Shift'}</span>
                                <span className="sidebar-nav-label ms-auto text-[8px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                    {lang === 'ar' ? 'نشطة' : 'Active'}
                                </span>
                            </button>
                        </div>
                    )}

                    {/* ── User Profile ── */}
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
                                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                                className="sidebar-text-block p-1 rounded-lg text-muted/50 hover:text-rose-500 hover:bg-rose-500/8 transition-all shrink-0"
                                title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                            >
                                <LogOut size={11} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
            <AppearanceModal isOpen={showAppearanceModal} onClose={() => setShowAppearanceModal(false)} />
        </>
    );
};

export default ContextRail;
