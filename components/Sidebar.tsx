import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard, UtensilsCrossed, ChefHat, Package, Bot, LogOut, Moon, Sun,
  Users, BarChart3, BookOpen, Landmark, Languages, Sparkles, Settings, Menu, X,
  ChevronLeft, ChevronRight, Headset, Shield, Fingerprint, Building2, ShoppingBag,
  Calculator, Tablet, Printer as PrinterIcon, Zap, Factory, Megaphone, Truck,
  ShieldCheck, ClipboardCheck, Map as MapIcon, Wifi, WifiOff, ChevronDown
} from 'lucide-react';
import { UserRole, AppPermission, AppTheme } from '../types';
import { translations } from '../services/translations';
import { useAuthStore } from '../stores/useAuthStore';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useOrderStore } from '../stores/useOrderStore';
import { useModal } from './Modal';
import { useFinanceStore } from '../stores/useFinanceStore';
import { OrderType } from '../types';
import CalculatorWidget from './common/CalculatorWidget';
import AppearanceModal from './common/AppearanceModal';
import { loaders } from '../routes';
import { syncService } from '../services/syncService';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission: AppPermission;
  loaderKey?: string;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handlePreload = (key?: string) => {
    if (key && (loaders as any)[key]) (loaders as any)[key]();
  };

  const settings = useAuthStore(s => s.settings);
  const branches = useAuthStore(s => s.branches);
  const logout = useAuthStore(s => s.logout);
  const updateSettings = useAuthStore(s => s.updateSettings);
  const hasPermission = useAuthStore(s => s.hasPermission);
  const isSidebarCollapsed = useAuthStore(s => s.isSidebarCollapsed);
  const toggleSidebar = useAuthStore(s => s.toggleSidebar);
  const setActiveBranch = useAuthStore(s => s.setActiveBranch);

  const activeOrderType = useOrderStore(s => s.activeOrderType);
  const setOrderMode = useOrderStore(s => s.setOrderMode);
  const discount = useOrderStore(s => s.discount);
  const setDiscount = useOrderStore(s => s.setDiscount);
  const clearCart = useOrderStore(s => s.clearCart);
  const { showModal } = useModal();
  const activeShift = useFinanceStore(s => s.activeShift);
  const setIsCloseShiftModalOpen = useFinanceStore(s => s.setIsCloseShiftModalOpen);

  const isPOS = location.pathname === '/pos';
  const lang = (settings.language || 'en') as 'en' | 'ar';
  const isDarkMode = settings.isDarkMode;
  const isTouchMode = settings.isTouchMode;
  const theme = settings.theme;
  const user = settings.currentUser;
  const activeBranchId = settings.activeBranchId;
  const isCollapsed = isSidebarCollapsed;
  const isAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isCallCenter = user?.role === UserRole.CALL_CENTER;
  const isRtl = lang === 'ar';

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncStats, setSyncStats] = useState({ total: 0, pending: 0, failed: 0, synced: 0 });
  const t = translations[lang] || translations['en'];

  /* ────────── Nav sections ────────── */
  const sectionsToUse = useMemo(() => {
    if (isCallCenter) {
      return [{
        title: lang === 'ar' ? 'مركز الاتصال' : 'Call Center',
        items: [
          { path: '/call-center', label: lang === 'ar' ? 'لوحة الاتصال' : 'Call Center', icon: Headset, permission: 'VIEW_REPORTS' as AppPermission, loaderKey: 'callCenter' },
        ],
      }];
    }
    return [
      {
        title: lang === 'ar' ? 'العمليات' : 'Operations',
        items: [
          { path: '/', label: lang === 'ar' ? 'الرئيسية' : 'Dashboard', icon: LayoutDashboard, permission: 'VIEW_REPORTS' as AppPermission, loaderKey: 'dashboard' },
          { path: '/pos', label: lang === 'ar' ? 'نقطة البيع' : 'POS', icon: ShoppingBag, permission: 'MANAGE_ORDERS' as AppPermission, loaderKey: 'pos' },
          { path: '/kitchen', label: lang === 'ar' ? 'المطبخ' : 'Kitchen', icon: ChefHat, permission: 'VIEW_KDS' as AppPermission, loaderKey: 'kitchen' },
          { path: '/orders', label: lang === 'ar' ? 'الطلبات' : 'Orders', icon: ClipboardCheck, permission: 'VIEW_ORDERS' as AppPermission, loaderKey: 'orders' },
          { path: '/tables', label: lang === 'ar' ? 'الطاولات' : 'Tables', icon: MapIcon, permission: 'MANAGE_TABLES' as AppPermission, loaderKey: 'tables' },
          { path: '/production', label: lang === 'ar' ? 'الإنتاج' : 'Production', icon: Factory, permission: 'MANAGE_ORDERS' as AppPermission, loaderKey: 'production' },
        ],
      },
      {
        title: lang === 'ar' ? 'المنيو والمخزون' : 'Menu & Stock',
        items: [
          { path: '/menu', label: lang === 'ar' ? 'المنيو' : 'Menu', icon: BookOpen, permission: 'MANAGE_MENU' as AppPermission, loaderKey: 'menu' },
          { path: '/inventory', label: lang === 'ar' ? 'المخزون' : 'Inventory', icon: Package, permission: 'MANAGE_INVENTORY' as AppPermission, loaderKey: 'inventory' },
        ],
      },
      {
        title: lang === 'ar' ? 'ماليات وتقارير' : 'Finance & Reports',
        items: [
          { path: '/finance', label: lang === 'ar' ? 'الماليات' : 'Finance', icon: Landmark, permission: 'VIEW_REPORTS' as AppPermission, loaderKey: 'finance' },
          { path: '/reports', label: lang === 'ar' ? 'التقارير' : 'Reports', icon: BarChart3, permission: 'VIEW_REPORTS' as AppPermission, loaderKey: 'reports' },
        ],
      },
      {
        title: lang === 'ar' ? 'الفريق والعملاء' : 'Team & CRM',
        items: [
          { path: '/crm', label: lang === 'ar' ? 'العملاء' : 'CRM', icon: Users, permission: 'VIEW_REPORTS' as AppPermission, loaderKey: 'crm' },
          { path: '/user-management', label: lang === 'ar' ? 'إدارة الفريق' : 'User & Security Center', icon: ShieldCheck, permission: 'NAV_USER_MANAGEMENT' as AppPermission, loaderKey: 'userManagement' },
          { path: '/call-center', label: lang === 'ar' ? 'مركز الاتصال' : 'Call Center', icon: Headset, permission: 'VIEW_REPORTS' as AppPermission, loaderKey: 'callCenter' },
          { path: '/dispatch', label: lang === 'ar' ? 'التوصيل' : 'Dispatch', icon: Truck, permission: 'VIEW_REPORTS' as AppPermission, loaderKey: 'dispatch' },
        ],
      },
      {
        title: lang === 'ar' ? 'نظام' : 'System',
        items: [
          { path: '/ai-assistant', label: lang === 'ar' ? 'مساعد AI' : 'AI Assistant', icon: Bot, permission: 'VIEW_REPORTS' as AppPermission, loaderKey: 'aiAssistant' },
          { path: '/marketing', label: lang === 'ar' ? 'التسويق' : 'Marketing', icon: Megaphone, permission: 'VIEW_REPORTS' as AppPermission, loaderKey: 'marketing' },
          ...(isAdmin ? [{ path: '/settings', label: lang === 'ar' ? 'الإعدادات' : 'Settings', icon: Settings, permission: 'MANAGE_USERS' as AppPermission, loaderKey: 'settings' }] : []),
        ],
      },
    ];
  }, [lang, isAdmin, isCallCenter]);

  const filteredSections = useMemo(() =>
    sectionsToUse.map(s => ({
      ...s,
      items: s.items.filter(item => hasPermission(item.permission)),
    })).filter(s => s.items.length > 0),
    [sectionsToUse, hasPermission]
  );

  /* ────────── Sync / Online ────────── */
  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try { const s = await syncService.getQueueStats(); if (mounted) setSyncStats(s); } catch { /* ignore */ }
    };
    const onOnline = () => { setIsOnline(true); refresh(); };
    const onOffline = () => { setIsOnline(false); refresh(); };
    refresh();
    const id = window.setInterval(refresh, 5000);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      mounted = false;
      window.clearInterval(id);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  /* ────────── Handlers ────────── */
  const handleLogout = () => { logout(); navigate('/login'); };
  const handleToggleTouch = () => updateSettings({ isTouchMode: !isTouchMode });
  const handleNavClick = () => setIsMobileOpen(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  /* ── widths ── */
  const EXPANDED_W = isTouchMode ? 'w-72' : 'w-60';
  const COLLAPSED_W = 'w-[70px]';
  const sidebarW = isCollapsed ? COLLAPSED_W : EXPANDED_W;

  /* ── Tooltip helper ── */
  const Tooltip = ({ label }: { label: string }) => (
    <div
      className={`
        absolute ${isRtl ? 'right-full mr-3' : 'left-full ml-3'} top-1/2 -translate-y-1/2
        px-2.5 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-[10px] font-bold
        rounded-lg shadow-xl whitespace-nowrap
        opacity-0 group-hover:opacity-100 pointer-events-none
        transition-opacity duration-150 z-[300]
      `}
    >
      {label}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Mobile overlay ── */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className={`
          lg:hidden fixed top-3 z-[60] p-2.5
          bg-card/90 backdrop-blur-xl text-main
          rounded-xl border border-border/50 shadow-md
          transition-all hover:bg-card
          ${isRtl ? 'right-3' : 'left-3'}
        `}
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* ════════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════════ */}
      <aside
        className={`
          ${sidebarW}
          fixed top-0 bottom-0
          ${isRtl ? 'right-0 border-l' : 'left-0 border-r'}
          z-[80] flex flex-col
          bg-card/95 dark:bg-card/98
          backdrop-blur-2xl
          border-border/30
          shadow-xl dark:shadow-black/40
          transition-[width,transform] duration-300 ease-out
          ${isMobileOpen
            ? 'translate-x-0'
            : `${isRtl ? 'translate-x-full' : '-translate-x-full'} lg:translate-x-0`
          }
        `}
        style={{ fontFamily: isRtl ? 'var(--font-arabic)' : 'var(--font-body)' }}
      >

        {/* ── Header ── */}
        <div className={`flex items-center h-14 shrink-0 border-b border-border/20 ${isCollapsed ? 'justify-center px-3' : 'px-4 gap-3'}`}>
          {/* Logo */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md shadow-primary/20 overflow-hidden">
              <img
                src="/logo.png" alt="Logo"
                className="w-6 h-6 object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-card ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>

          {/* Brand name */}
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-[11px] font-black text-main uppercase tracking-[0.15em] leading-tight truncate">
                {isPOS ? (lang === 'ar' ? 'نقطة البيع' : 'Point of Sale') : 'RestoFlow'}
              </p>
              <p className="text-[9px] font-semibold text-muted truncate mt-px">
                {isPOS
                  ? (activeShift ? (lang === 'ar' ? '● وردية نشطة' : '● Active Shift') : (lang === 'ar' ? '○ مغلقة' : '○ Shift Closed'))
                  : (lang === 'ar' ? 'نظام المطاعم' : 'Restaurant ERP')
                }
              </p>
            </div>
          )}

          {/* Mobile close */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden ml-auto p-1.5 text-muted hover:text-main rounded-lg transition-colors"
          >
            <X size={16} />
          </button>

          {/* Desktop collapse toggle */}
          {!isMobileOpen && (
            <button
              onClick={toggleSidebar}
              className={`
                hidden lg:flex ml-auto p-1.5 text-muted hover:text-main
                rounded-lg transition-all hover:bg-elevated/60
                ${isCollapsed ? '' : ''}
              `}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isRtl
                ? (isCollapsed ? <ChevronLeft size={15} /> : <ChevronRight size={15} />)
                : (isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />)
              }
            </button>
          )}
        </div>

        {/* ── POS Command Center ── */}
        {isPOS && (
          <div className={`mx-2 mt-2 mb-1 p-2 rounded-2xl bg-elevated/40 border border-border/30 shrink-0`}>
            {!isCollapsed && (
              <p className="text-[8px] font-black text-muted/60 uppercase tracking-[0.25em] px-1 mb-2">
                {lang === 'ar' ? 'نوع الطلب' : 'Order Type'}
              </p>
            )}
            <div className={`grid ${isCollapsed ? 'grid-cols-1 gap-1' : 'grid-cols-2 gap-1'}`}>
              {[
                { mode: OrderType.DINE_IN, icon: UtensilsCrossed, color: 'from-primary to-primary/80 shadow-primary/25', label: t.dine_in },
                { mode: OrderType.TAKEAWAY, icon: ShoppingBag, color: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25', label: t.takeaway },
                { mode: OrderType.PICKUP, icon: MapIcon, color: 'from-teal-500 to-teal-600 shadow-teal-500/25', label: t.pickup || 'Pickup' },
                { mode: OrderType.DELIVERY, icon: Building2, color: 'from-orange-500 to-orange-600 shadow-orange-500/25', label: t.delivery },
              ].map(m => {
                const active = activeOrderType === m.mode;
                return (
                  <button
                    key={m.mode}
                    onClick={() => setOrderMode(m.mode)}
                    className={`
                      group relative flex items-center gap-1.5 rounded-xl transition-all duration-150
                      ${isCollapsed ? 'justify-center p-2.5' : 'px-2.5 py-2'}
                      ${active
                        ? `bg-gradient-to-br ${m.color} text-white shadow-md`
                        : 'bg-card/50 text-muted hover:bg-card hover:text-main border border-border/20'
                      }
                    `}
                  >
                    <m.icon size={13} />
                    {!isCollapsed && <span className="text-[8px] font-black uppercase tracking-wide truncate">{m.label}</span>}
                    {isCollapsed && <Tooltip label={m.label} />}
                  </button>
                );
              })}
            </div>

            {!isCollapsed && (
              <div className="mt-1.5 space-y-1">
                <button
                  onClick={() => setDiscount(discount === 0 ? 10 : 0)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all ${discount > 0 ? 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/20' : 'bg-card/40 text-muted border border-border/20 hover:border-primary/20'}`}
                >
                  <span>{lang === 'ar' ? 'خصم' : 'Discount'}</span>
                  <span className={discount > 0 ? 'text-indigo-400' : 'text-muted'}>{discount}%</span>
                </button>

                <button
                  onClick={() => setShowCalc(!showCalc)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all ${showCalc ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-card/40 text-muted border border-border/20 hover:border-primary/20'}`}
                >
                  <span className="flex items-center gap-1.5"><Calculator size={11} />{lang === 'ar' ? 'الحاسبة' : 'Calc'}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${showCalc ? 'bg-primary animate-pulse' : 'bg-border'}`} />
                </button>

                {showCalc && (
                  <div className="rounded-xl overflow-hidden border border-border/20 animate-scale-in">
                    <CalculatorWidget isCompact />
                  </div>
                )}

                <button
                  onClick={handleToggleTouch}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all ${isTouchMode ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20' : 'bg-card/40 text-muted border border-border/20'}`}
                >
                  <span className="flex items-center gap-1.5"><Tablet size={11} />{lang === 'ar' ? 'اللمس' : 'Touch'}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isTouchMode ? 'bg-amber-500 animate-pulse' : 'bg-border'}`} />
                </button>

                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => showModal({ title: t.confirm, message: t.void_confirm, type: 'danger', confirmText: t.confirm, cancelText: t.cancel, onConfirm: () => clearCart() })}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[8px] font-black uppercase hover:bg-rose-500/15 transition-all"
                  >
                    <Zap size={10} />{lang === 'ar' ? 'إلغاء' : 'Void'}
                  </button>
                  <button className="flex items-center justify-center gap-1 py-1.5 rounded-xl bg-card/40 text-muted border border-border/20 text-[8px] font-black uppercase hover:text-main transition-all">
                    <PrinterIcon size={10} />{lang === 'ar' ? 'آخر' : 'Last'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Call Center Panel ── */}
        {isCallCenter && !isCollapsed && (
          <div className="mx-2 mb-1 p-3 rounded-2xl bg-elevated/40 border border-border/30 shrink-0">
            <p className="text-[8px] font-black text-muted/50 uppercase tracking-[0.25em] mb-2">
              {lang === 'ar' ? 'أدوات المشغّل' : 'Operator Tools'}
            </p>
            <div className="space-y-2">
              <div className="bg-card/50 rounded-xl p-2 border border-border/20">
                <span className="text-[7px] font-black uppercase text-primary/70 tracking-widest block mb-1.5">
                  {lang === 'ar' ? 'خصم سريع' : 'Quick Discount'}
                </span>
                <div className="flex gap-1">
                  {[0, 5, 10, 15, 20].map(d => (
                    <button
                      key={d}
                      onClick={() => setDiscount(d)}
                      className={`flex-1 py-1 rounded-lg text-[8px] font-black transition-all ${discount === d ? 'bg-primary text-white' : 'bg-elevated text-muted hover:text-main'}`}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>
              <select
                value={activeBranchId || ''}
                onChange={e => setActiveBranch(e.target.value)}
                className="w-full bg-card/50 border border-border/20 rounded-xl py-2 px-2.5 text-[9px] font-bold text-main outline-none focus:border-primary/30 transition-all"
              >
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ════════ NAV ════════ */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent">

          {/* POS → back to dashboard */}
          {isPOS && (
            <NavLink
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-primary bg-primary/8 border border-primary/15 mb-2 hover:bg-primary/12 transition-all text-[10px] font-black uppercase tracking-wide"
            >
              <LayoutDashboard size={15} />
              {!isCollapsed && <span>{lang === 'ar' ? 'لوحة القيادة' : 'Dashboard'}</span>}
              {isCollapsed && <Tooltip label={lang === 'ar' ? 'لوحة القيادة' : 'Dashboard'} />}
            </NavLink>
          )}

          {!isPOS && filteredSections.map((section, idx) => (
            <div key={idx} className={idx > 0 ? 'mt-3' : ''}>
              {/* Section label */}
              {!isCollapsed && (
                <p className={`text-[8px] font-black text-muted/40 uppercase tracking-[0.3em] px-3 mb-1 ${idx > 0 ? 'pt-2 border-t border-border/15 mt-2' : ''}`}>
                  {section.title}
                </p>
              )}
              {isCollapsed && idx > 0 && (
                <div className="mx-3 my-1.5 border-t border-border/15" />
              )}

              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    onMouseEnter={() => handlePreload(item.loaderKey)}
                    className={({ isActive }) => `
                      group relative flex items-center gap-2.5 rounded-xl overflow-hidden
                      transition-all duration-150
                      ${isCollapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2'}
                      ${isActive
                        ? 'bg-primary/10 text-primary border border-primary/15'
                        : 'text-muted hover:text-main hover:bg-elevated/50 border border-transparent'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active bar */}
                        <span
                          className={`
                            absolute top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary
                            transition-opacity duration-200
                            ${isRtl ? 'right-0' : 'left-0'}
                            ${isActive && !isCollapsed ? 'opacity-100' : 'opacity-0'}
                          `}
                        />
                        <item.icon
                          size={16}
                          className={`shrink-0 transition-transform ${isActive ? 'text-primary' : 'text-current'} ${!isCollapsed && 'group-hover:scale-105'}`}
                        />
                        {!isCollapsed && (
                          <span className="text-[10px] font-bold truncate">{item.label}</span>
                        )}
                        {isCollapsed && <Tooltip label={item.label} />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ════════ FOOTER ════════ */}
        <div className={`border-t border-border/20 pt-2 pb-3 shrink-0 ${isCollapsed ? 'px-1.5 space-y-1' : 'px-2 space-y-2'} relative`}>



          {/* Sync stats */}
          {!isCollapsed && (
            <div className="rounded-xl bg-elevated/30 border border-border/15 px-2.5 py-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[7px] font-black uppercase text-muted/40 tracking-widest">Sync</span>
                <span className={`flex items-center gap-1 text-[7px] font-black uppercase ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {isOnline ? <Wifi size={9} /> : <WifiOff size={9} />}
                  {isOnline ? 'Live' : 'Offline'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                {[
                  { label: 'Queue', value: syncStats.total, color: 'text-muted' },
                  { label: 'Wait', value: syncStats.pending, color: 'text-amber-500' },
                  { label: 'Err', value: syncStats.failed, color: 'text-rose-500' },
                ].map(s => (
                  <div key={s.label} className="bg-card/50 rounded-md py-0.5">
                    <div className="text-[6px] text-muted/40 font-black uppercase">{s.label}</div>
                    <div className={`text-[8px] font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shift close */}
          {activeShift && (
            isCollapsed
              ? (
                <button
                  onClick={() => setIsCloseShiftModalOpen(true)}
                  className="group relative w-full flex justify-center py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/15 transition-all"
                  title="Close Shift"
                >
                  <LogOut size={14} />
                  <Tooltip label={t.close_shift || 'Close Shift'} />
                </button>
              )
              : (
                <button
                  onClick={() => setIsCloseShiftModalOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 border border-primary/15 transition-all text-[9px] font-black uppercase tracking-wide"
                >
                  <LogOut size={13} />
                  <span>{t.close_shift || 'Close Shift'}</span>
                </button>
              )
          )}

          {/* User card */}
          {isCollapsed ? (
            <button
              onClick={handleLogout}
              className="group relative w-full flex justify-center py-2.5 rounded-xl text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              title="Sign Out"
            >
              <LogOut size={14} />
              <Tooltip label="Sign Out" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-card border border-border/40 hover:border-primary/30 transition-colors shadow-sm cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-[9px] font-black shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-[10px] font-bold text-main truncate leading-tight">{user?.name || 'User'}</p>
                <p className="text-[8px] text-muted/60 uppercase tracking-widest truncate">{user?.role}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                title="Sign Out"
              >
                <LogOut size={12} />
              </button>
            </div>
          )}
        </div>
      </aside>
      <AppearanceModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

export default React.memo(Sidebar);

