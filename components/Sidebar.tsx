import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  Package,
  Bot,
  LogOut,
  Moon,
  Sun,
  Users,
  BarChart3,
  BookOpen,
  Landmark,
  Languages,
  Sparkles,
  Settings,
  Menu,
  X,
  ChevronLeft,
  Headset,
  Shield,
  Fingerprint,
  Building2,
  ShoppingBag,
  Calculator,
  Tablet,
  Printer as PrinterIcon,
  Zap,
  Factory,
  Megaphone,
  Truck,
  ShieldCheck,
  Map as MapIcon,
  Wifi,
  WifiOff
} from 'lucide-react';
import { UserRole, AppPermission, AppTheme } from '../types';
import { translations } from '../services/translations';
import { useAuthStore } from '../stores/useAuthStore';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useOrderStore } from '../stores/useOrderStore';
import { useModal } from './Modal';
import { useFinanceStore } from '../stores/useFinanceStore';
import { OrderType } from '../types';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission: AppPermission;
  loaderKey?: string;
}

import CalculatorWidget from './common/CalculatorWidget';
import { loaders } from '../routes';
import { syncService } from '../services/syncService';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handlePreload = (key?: string) => {
    if (key && (loaders as any)[key]) {
      (loaders as any)[key]();
    }
  };

  const settings = useAuthStore(state => state.settings);
  const branches = useAuthStore(state => state.branches);
  const logout = useAuthStore(state => state.logout);
  const updateSettings = useAuthStore(state => state.updateSettings);
  const hasPermission = useAuthStore(state => state.hasPermission);
  const isSidebarCollapsed = useAuthStore(state => state.isSidebarCollapsed);
  const toggleSidebar = useAuthStore(state => state.toggleSidebar);
  const setActiveBranch = useAuthStore(state => state.setActiveBranch);

  const activeOrderType = useOrderStore(state => state.activeOrderType);
  const setOrderMode = useOrderStore(state => state.setOrderMode);
  const discount = useOrderStore(state => state.discount);
  const setDiscount = useOrderStore(state => state.setDiscount);
  const clearCart = useOrderStore(state => state.clearCart);
  const { showModal } = useModal();
  const activeShift = useFinanceStore(state => state.activeShift);
  const setIsCloseShiftModalOpen = useFinanceStore(state => state.setIsCloseShiftModalOpen);

  const location = useLocation();
  const isPOS = location.pathname === '/pos';
  const lang = (settings.language || 'en') as 'en' | 'ar';
  const isDarkMode = settings.isDarkMode;
  const isTouchMode = settings.isTouchMode;
  const theme = settings.theme;
  const user = settings.currentUser;
  const activeBranchId = settings.activeBranchId;
  const isCollapsed = isSidebarCollapsed;
  const isAdmin = user?.role === UserRole.SUPER_ADMIN;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStats, setSyncStats] = useState({ total: 0, pending: 0, failed: 0, synced: 0 });
  const t = translations[lang] || translations['en'];

  const isCallCenter = user?.role === UserRole.CALL_CENTER;
  const isCallCenterPage = location.pathname === '/call-center';

  const sectionsToUse = useMemo(() => {
    // 1. Call Center Specialist UI
    if (isCallCenter) {
      return [
        {
          title: lang === 'ar' ? 'مركز الاتصال' : 'Call Center',
          items: [
            { path: '/call-center', label: t.call_center, icon: Headset, permission: AppPermission.NAV_CALL_CENTER, loaderKey: 'CallCenter' },
            { path: '/crm', label: t.crm, icon: Users, permission: AppPermission.NAV_CRM, loaderKey: 'CRM' },
          ]
        }
      ];
    }

    // 2. Super Admin (Control Hub FOCUS) - Well-organized sections for easy navigation
    if (isAdmin) {
      return [
        // 🏠 القسم الرئيسي - Dashboard Only
        {
          title: lang === 'ar' ? 'الرئيسية' : 'Home',
          items: [
            { path: '/', label: t.dashboard, icon: LayoutDashboard, permission: AppPermission.NAV_DASHBOARD, loaderKey: 'Dashboard' },
          ]
        },
        // 🛒 العمليات التشغيلية - POS, KDS, Call Center
        {
          title: lang === 'ar' ? 'العمليات التشغيلية' : 'Operations',
          items: [
            { path: '/pos', label: t.pos, icon: UtensilsCrossed, permission: AppPermission.NAV_POS, loaderKey: 'POS' },
            { path: '/kds', label: t.kds, icon: ChefHat, permission: AppPermission.NAV_KDS, loaderKey: 'KDS' },
            { path: '/call-center', label: t.call_center, icon: Headset, permission: AppPermission.NAV_CALL_CENTER, loaderKey: 'CallCenter' },
          ]
        },
        // 📦 المخازن والإمداد - Inventory, Production, Recipes
        {
          title: lang === 'ar' ? 'المخازن والإمداد' : 'Inventory & Supply',
          items: [
            { path: '/inventory', label: t.inventory, icon: Package, permission: AppPermission.NAV_INVENTORY, loaderKey: 'Inventory' },
            { path: '/production', label: t.production, icon: Factory, permission: AppPermission.NAV_PRODUCTION, loaderKey: 'Production' },
            { path: '/recipes', label: t.recipes, icon: ChefHat, permission: AppPermission.NAV_RECIPES, loaderKey: 'RecipeManager' },
          ]
        },
        // 💰 المالية والمحاسبة - Finance, Fiscal Compliance
        {
          title: lang === 'ar' ? 'المالية والمحاسبة' : 'Finance & Accounting',
          items: [
            { path: '/finance', label: t.finance, icon: Landmark, permission: AppPermission.NAV_FINANCE, loaderKey: 'Finance' },
            { path: '/fiscal', label: lang === 'ar' ? 'الامتثال الضريبي' : 'Fiscal Compliance', icon: ShieldCheck, permission: AppPermission.NAV_FINANCE, loaderKey: 'FiscalHub' },
          ]
        },
        // 📊 التقارير والذكاء - Reports, AI Insights, Analytics
        {
          title: lang === 'ar' ? 'التقارير والتحليلات' : 'Reports & Analytics',
          items: [
            { path: '/franchise', label: lang === 'ar' ? 'إدارة الفروع' : 'Multi-Branch', icon: Building2, permission: AppPermission.NAV_REPORTS, loaderKey: 'FranchiseManager' },
            { path: '/reports', label: lang === 'ar' ? 'التقارير' : 'Reports', icon: BarChart3, permission: AppPermission.NAV_REPORTS, loaderKey: 'Reports' },
            { path: '/ai-insights', label: t.ai_insights, icon: Sparkles, permission: AppPermission.NAV_AI_ASSISTANT, loaderKey: 'AIInsights' },
            { path: '/ai-assistant', label: t.ai_assistant, icon: Bot, permission: AppPermission.NAV_AI_ASSISTANT, loaderKey: 'AIAssistant' },
            { path: '/forensics', label: t.forensics, icon: Fingerprint, permission: AppPermission.NAV_FORENSICS, loaderKey: 'ForensicsHub' },
          ]
        },
        // 👥 الموارد البشرية والعملاء - HR, CRM
        {
          title: lang === 'ar' ? 'الموارد والعملاء' : 'People & Customers',
          items: [
            { path: '/people', label: lang === 'ar' ? 'الموارد البشرية' : 'HR & Staff', icon: Users, permission: AppPermission.NAV_PEOPLE, loaderKey: 'People' },
            { path: '/crm', label: t.crm, icon: Users, permission: AppPermission.NAV_CRM, loaderKey: 'CRM' },
          ]
        },
        // 🚚 التوصيل والتسويق - Dispatch, Marketing
        {
          title: lang === 'ar' ? 'التوصيل والتسويق' : 'Delivery & Marketing',
          items: [
            { path: '/dispatch', label: lang === 'ar' ? 'اللوجستيات' : 'Logistics', icon: Truck, permission: AppPermission.NAV_DASHBOARD, loaderKey: 'Dispatch' },
            { path: '/marketing', label: lang === 'ar' ? 'حملات النمو' : 'Marketing', icon: Megaphone, permission: AppPermission.NAV_REPORTS, loaderKey: 'CampaignHub' },
          ]
        },
        // ⚙️ إدارة النظام - Settings, Security, Printers, Menu Manager
        {
          title: lang === 'ar' ? 'إدارة النظام' : 'System Settings',
          items: [
            { path: '/menu', label: t.menu, icon: BookOpen, permission: AppPermission.NAV_MENU_MANAGER, loaderKey: 'MenuManager' },
            { path: '/settings', label: t.settings, icon: Settings, permission: AppPermission.NAV_SETTINGS, loaderKey: 'SettingsHub' },
            { path: '/security', label: t.security, icon: Shield, permission: AppPermission.NAV_SECURITY, loaderKey: 'SecurityHub' },
            { path: '/printers', label: t.printers, icon: PrinterIcon, permission: AppPermission.NAV_PRINTERS, loaderKey: 'PrinterManager' },
          ]
        }
      ];
    }

    // 3. Default Operational UI (Cashier, Branch Manager, etc.) - Organized by function
    return [
      // 🏠 الرئيسية
      {
        title: lang === 'ar' ? 'الرئيسية' : 'Home',
        items: [
          { path: '/', label: t.dashboard, icon: LayoutDashboard, permission: AppPermission.NAV_DASHBOARD, loaderKey: 'Dashboard' },
        ]
      },
      // 🛒 العمليات التشغيلية
      {
        title: lang === 'ar' ? 'العمليات' : 'Operations',
        items: [
          { path: '/pos', label: t.pos, icon: UtensilsCrossed, permission: AppPermission.NAV_POS, loaderKey: 'POS' },
          { path: '/kds', label: t.kds, icon: ChefHat, permission: AppPermission.NAV_KDS, loaderKey: 'KDS' },
          { path: '/call-center', label: t.call_center, icon: Headset, permission: AppPermission.NAV_CALL_CENTER, loaderKey: 'CallCenter' },
        ]
      },
      // 📦 المخازن
      {
        title: lang === 'ar' ? 'المخازن' : 'Inventory',
        items: [
          { path: '/inventory', label: t.inventory, icon: Package, permission: AppPermission.NAV_INVENTORY, loaderKey: 'Inventory' },
        ]
      },
      // 👥 العملاء والذكاء
      {
        title: lang === 'ar' ? 'العملاء والمساعد' : 'Customers & AI',
        items: [
          { path: '/crm', label: t.crm, icon: Users, permission: AppPermission.NAV_CRM, loaderKey: 'CRM' },
          { path: '/ai-assistant', label: t.ai_assistant, icon: Sparkles, permission: AppPermission.NAV_AI_ASSISTANT, loaderKey: 'AIAssistant' },
        ]
      }
    ];
  }, [isAdmin, isCallCenter, lang, t]);

  const filteredSections = useMemo(() => {
    const userRole = settings.currentUser?.role;
    // Admins and direct Call Center roles are already defined in sectionsToUse
    if (isAdmin || isCallCenter) return sectionsToUse;

    return sectionsToUse.map(section => ({
      ...section,
      items: section.items.filter(item => hasPermission(item.permission))
    })).filter(section => section.items.length > 0);
  }, [sectionsToUse, settings.currentUser, isAdmin, isCallCenter, hasPermission]);

  const handleNavClick = () => {
    setIsMobileOpen(false);
  };

  const currentBranchName = branches.find(b => b.id === activeBranchId)?.name || (lang === 'ar' ? 'كل الفروع' : 'All Branches');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleDarkMode = () => {
    updateSettings({ isDarkMode: !isDarkMode });
  };

  const handleToggleTouchMode = () => {
    updateSettings({ isTouchMode: !isTouchMode });
  };

  const handleToggleLang = () => {
    updateSettings({ language: lang === 'en' ? 'ar' : 'en' });
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    updateSettings({ theme: newTheme });
  };

  useEffect(() => {
    let mounted = true;
    const refreshStats = async () => {
      try {
        const stats = await syncService.getQueueStats();
        if (mounted) setSyncStats(stats);
      } catch {
        // ignore stats errors in UI
      }
    };
    const onOnline = () => {
      setIsOnline(true);
      refreshStats();
    };
    const onOffline = () => {
      setIsOnline(false);
      refreshStats();
    };
    refreshStats();
    const interval = window.setInterval(refreshStats, 5000);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className={`lg:hidden fixed top-[max(0.75rem,var(--safe-top))] z-[60] p-2 bg-slate-900 text-white rounded-xl shadow-lg ${lang === 'ar' ? 'right-3' : 'left-3'}`}
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isCollapsed ? 'w-20' : (isTouchMode ? 'w-72' : 'w-64')} 
        bg-sidebar/95 backdrop-blur-3xl text-main flex flex-col app-viewport h-screen 
        fixed top-0 shadow-[0_0_40px_rgba(0,0,0,0.08)] z-[80] transition-all duration-500
        ${lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} border-border/50
        ${isMobileOpen ? 'translate-x-0' : `${lang === 'ar' ? 'translate-x-full' : '-translate-x-full'} lg:translate-x-0`}
      `}>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Header Branding */}
        <div className={`relative flex flex-col items-center transition-all duration-500 ${isCollapsed ? 'py-6 px-2' : 'p-6'}`}>
          <div className={`p-2.5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center transition-all duration-500 ${isCollapsed ? 'w-11 h-11' : 'w-14 h-14 mb-3'}`}>
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-xl" />
          </div>

          {!isPOS && !isCollapsed && (
            <div className="text-center animate-in fade-in slide-in-from-top-1 duration-700">
              <h2 className="text-[9px] font-black text-primary tracking-[0.3em] uppercase opacity-70">{lang === 'ar' ? 'نظام الإدارة' : 'Management System'}</h2>
              <p className="text-[7px] font-black text-muted uppercase tracking-[0.1em] opacity-40">{lang === 'ar' ? 'المتكامل' : 'Enterprise'}</p>
            </div>
          )}

          {isPOS && !isCollapsed && (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <h2 className="text-[10px] font-black text-primary tracking-[0.4em] uppercase">{lang === 'ar' ? 'نقطة البيع' : 'POINT OF SALE'}</h2>
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                <span className="text-[7px] font-black text-muted uppercase tracking-widest">{activeShift ? (lang === 'ar' ? 'شفت مفتوح' : 'Active Shift') : (lang === 'ar' ? 'مغلق' : 'Closed')}</span>
              </div>
            </div>
          )}

          {/* Persistent Floating Toggle Hub */}
          <button
            onClick={toggleSidebar}
            className={`
                hidden lg:flex absolute top-10 ${lang === 'ar' ? '-left-3' : '-right-3'} 
                w-7 h-10 bg-primary text-white rounded-xl items-center justify-center 
                shadow-xl shadow-primary/30 hover:scale-110 active:scale-90 transition-all z-[100] 
                border-2 border-white dark:border-slate-950 group
             `}
          >
            <ChevronLeft size={16} className={`transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''} ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-4 no-scrollbar scroll-smooth">
          {/* 
             🛡️ POS VESSEL PROTOCOL - PROTECTED SECTION 
             This section is isolated from global design changes to maintain 
             cashier consistency. DO NOT MODIFY without Protocol Unlock.
          */}
          {isPOS && (
            <div className="mb-8 p-2 rounded-[2rem] bg-card/90 border border-border/50 shadow-sm relative overflow-hidden group/pos">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              {!isCollapsed && (
                <div className="px-4 pt-4 pb-3 flex justify-between items-center">
                  <h3 className="text-[11px] font-black text-primary/70 uppercase tracking-[0.22em]">
                    {lang === 'ar' ? 'التحكم السريع' : 'Command Center'}
                  </h3>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                    <div className="w-1 h-1 rounded-full bg-primary/30" />
                  </div>
                </div>
              )}

              <div className={`flex ${isCollapsed ? 'flex-col items-center mt-4' : 'justify-between px-2 pt-2'} gap-2.5`}>
                {[
                  { mode: OrderType.DINE_IN, icon: UtensilsCrossed, activeClass: 'bg-primary text-white shadow-lg shadow-primary/20 ring-1 ring-white/10', inactiveClass: 'bg-card/70 text-muted hover:text-primary hover:bg-primary/5', label: t.dine_in },
                  { mode: OrderType.TAKEAWAY, icon: ShoppingBag, activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/10', inactiveClass: 'bg-card/70 text-muted hover:text-emerald-500 hover:bg-emerald-500/5', label: t.takeaway },
                  { mode: OrderType.PICKUP, icon: MapIcon, activeClass: 'bg-teal-500 text-white shadow-lg shadow-teal-500/20 ring-1 ring-white/10', inactiveClass: 'bg-card/70 text-muted hover:text-teal-500 hover:bg-teal-500/5', label: t.pickup || 'Pickup' },
                  { mode: OrderType.DELIVERY, icon: Building2, activeClass: 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 ring-1 ring-white/10', inactiveClass: 'bg-card/70 text-muted hover:text-orange-500 hover:bg-orange-500/5', label: t.delivery },
                ].map((m) => (
                  <button
                    key={m.mode}
                    onClick={() => setOrderMode(m.mode)}
                    className={`
                      group relative rounded-2xl transition-all duration-500 hover:scale-105 active:scale-95
                      ${activeOrderType === m.mode ? m.activeClass : m.inactiveClass}
                      ${!isCollapsed ? 'flex-1 flex flex-col items-center gap-2 py-4' : 'p-3.5'}
                    `}
                  >
                    <m.icon size={isCollapsed ? 18 : 18} className={`transition-transform duration-500 ${activeOrderType === m.mode ? 'scale-110' : ''}`} />
                    {!isCollapsed && (
                      <span className={`text-[9px] font-black uppercase tracking-wider text-center transition-colors ${activeOrderType === m.mode ? 'text-white' : 'text-muted'}`}>
                        {m.label}
                      </span>
                    )}
                    {isCollapsed && (
                      <div className={`absolute ${lang === 'ar' ? 'right-full mr-5' : 'left-full ml-5'} top-1/2 -translate-y-1/2 px-4 py-2 bg-elevated text-main shadow-2xl z-[100] border border-primary/20`}>
                        {m.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {!isCollapsed && (
                <div className="flex flex-col gap-3 p-3 mt-2">
                  {/* Quick Stats/Discount */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDiscount(discount === 0 ? 10 : 0)}
                      className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl border transition-all group ${discount > 0 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600' : 'bg-card/70 border-border/50 hover:border-indigo-500/30'}`}
                    >
                      <span className="text-[9px] font-black uppercase opacity-70 mb-0.5">{lang === 'ar' ? 'خصم' : 'Discount'}</span>
                      <span className="text-base font-black tracking-tighter">{discount}%</span>
                    </button>
                    <button
                      disabled
                      className="flex-1 flex flex-col items-center justify-center py-3 rounded-2xl border border-border/50 bg-card/40 opacity-40 cursor-not-allowed"
                    >
                      <span className="text-[9px] font-black uppercase opacity-70 mb-0.5">{lang === 'ar' ? 'نقاط' : 'Points'}</span>
                      <span className="text-base font-black tracking-tighter">0</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowCalc(!showCalc)}
                    className="w-full flex items-center justify-between p-3 bg-elevated/70 border border-border/50 rounded-2xl text-[9px] font-black uppercase tracking-wider hover:border-primary/50 transition-all group"
                  >
                    <span className="flex items-center gap-2.5"><Calculator size={14} className="text-primary group-hover:rotate-12 transition-transform" /> {lang === 'ar' ? 'الآلة الحاسبة' : 'Calculator'}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${showCalc ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  </button>

                  {showCalc && (
                    <div className="mt-1 p-0.5 rounded-2xl bg-elevated/70 backdrop-blur-md border border-primary/20 animate-in zoom-in-95 duration-300 overflow-hidden">
                      <CalculatorWidget isCompact />
                    </div>
                  )}

                  <button
                    onClick={handleToggleTouchMode}
                    className={`w-full flex items-center justify-between p-3 border rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all group ${isTouchMode ? 'bg-amber-500/10 border-amber-500/50 text-amber-600' : 'bg-elevated/60 border-border/50 hover:border-amber-500/30'}`}
                  >
                    <span className="flex items-center gap-2.5"><Tablet size={14} className={`${isTouchMode ? 'animate-bounce' : 'group-hover:scale-110'}`} /> {lang === 'ar' ? 'وضع اللمس' : 'Touch Mode'}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${isTouchMode ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  </button>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => {
                        showModal({
                          title: t.confirm,
                          message: t.void_confirm,
                          type: 'danger',
                          confirmText: t.confirm,
                          cancelText: t.cancel,
                          onConfirm: () => clearCart()
                        });
                      }}
                      className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all flex flex-col items-center justify-center gap-1 group"
                    >
                      <Zap size={14} className="group-hover:animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-wider">{lang === 'ar' ? 'إلغاء' : 'Void'}</span>
                    </button>
                    <button className="p-3 bg-elevated/70 rounded-2xl border border-border/50 hover:bg-main hover:text-sidebar transition-all flex flex-col items-center justify-center gap-1 group">
                      <PrinterIcon size={14} />
                      <span className="text-[8px] font-black uppercase tracking-wider">{lang === 'ar' ? 'الأخير' : 'Last'}</span>
                    </button>
                  </div>
                </div>
              )}

              {isCollapsed && (
                <div className="flex flex-col items-center gap-4 mt-4 py-4 border-t border-primary/10">
                  <button onClick={() => setDiscount(discount === 0 ? 10 : 0)} className={`group relative p-3.5 rounded-2xl border transition-all ${discount > 0 ? 'bg-indigo-500 text-white shadow-lg' : 'bg-card border-border'}`}>
                    <Sparkles size={18} />
                    <div className={`absolute ${lang === 'ar' ? 'right-full mr-5' : 'left-full ml-5'} top-1/2 -translate-y-1/2 px-4 py-2 bg-elevated text-main shadow-2xl z-[100] border border-primary/20`}>
                      {lang === 'ar' ? 'خصم 10%' : '10% Discount'}
                    </div>
                  </button>
                  <button onClick={() => setShowCalc(!showCalc)} className="group relative p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all">
                    <Calculator size={18} className={showCalc ? 'text-primary' : 'text-muted'} />
                    <div className={`absolute ${lang === 'ar' ? 'right-full mr-5' : 'left-full ml-5'} top-1/2 -translate-y-1/2 px-4 py-2 bg-elevated text-main shadow-2xl z-[100] border border-primary/20`}>
                      {lang === 'ar' ? 'الآلة الحاسبة' : 'Calculator'}
                    </div>
                  </button>
                  <button onClick={handleToggleTouchMode} className={`group relative p-3.5 rounded-2xl border transition-all ${isTouchMode ? 'bg-amber-500 text-white shadow-lg' : 'bg-card border-border'}`}>
                    <Tablet size={18} />
                    <div className={`absolute ${lang === 'ar' ? 'right-full mr-5' : 'left-full ml-5'} top-1/2 -translate-y-1/2 px-4 py-2 bg-elevated text-main shadow-2xl z-[100] border border-primary/20`}>
                      {lang === 'ar' ? 'وضع اللمس' : 'Touch Mode'}
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 📞 CALL CENTER COMMAND CENTER */}
          {isCallCenter && (
            <div className="mb-8 p-2 rounded-[2rem] bg-elevated/50 dark:bg-elevated/20 border border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
              {!isCollapsed && (
                <div className="px-4 pt-4 pb-3 flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">
                    {lang === 'ar' ? 'أدوات الاتصال' : 'Operator Tools'}
                  </h3>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                  </div>
                </div>
              )}

              {!isCollapsed && (
                <div className="flex flex-col gap-3 p-3">
                  {/* Discount Quick Select */}
                  <div className="bg-elevated/70 dark:bg-card/40 rounded-2xl p-3 border border-primary/20">
                    <span className="text-[8px] font-black uppercase text-indigo-500 tracking-widest block mb-2">
                      {lang === 'ar' ? 'خصم سريع' : 'Quick Discount'}
                    </span>
                    <div className="flex gap-1">
                      {[0, 5, 10, 15, 20].map(d => (
                        <button
                          key={d}
                          onClick={() => setDiscount(d)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${discount === d
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-100'
                            }`}
                        >
                          {d}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Branch Selector */}
                  <div className="bg-elevated/70 dark:bg-card/40 rounded-2xl p-3 border border-primary/20">
                    <span className="text-[8px] font-black uppercase text-indigo-500 tracking-widest block mb-2">
                      {lang === 'ar' ? 'توجيه الطلب إلى' : 'Route to Branch'}
                    </span>
                    <select
                      value={activeBranchId || ''}
                      onChange={(e) => setActiveBranch(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Actions Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowCalc(!showCalc)}
                      className={`flex flex-col items-center gap-1 p-3.5 rounded-2xl border transition-all ${showCalc
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white/60 dark:bg-slate-900/40 border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-300'
                        }`}
                    >
                      <Calculator size={16} />
                      <span className="text-[8px] font-black uppercase">{lang === 'ar' ? 'حاسبة' : 'Calc'}</span>
                    </button>
                    <button
                      onClick={handleToggleTouchMode}
                      className={`flex flex-col items-center gap-1 p-3.5 rounded-2xl border transition-all ${isTouchMode
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white/60 dark:bg-slate-900/40 border-indigo-100 dark:border-indigo-900/30 hover:border-amber-300'
                        }`}
                    >
                      <Tablet size={16} />
                      <span className="text-[8px] font-black uppercase">{lang === 'ar' ? 'لمس' : 'Touch'}</span>
                    </button>
                  </div>

                  {/* Calculator Panel */}
                  {showCalc && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <CalculatorWidget isCompact />
                    </div>
                  )}
                </div>
              )}

              {/* Collapsed State Icons */}
              {isCollapsed && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <button onClick={() => setDiscount(discount === 0 ? 10 : 0)} className={`group relative p-3.5 rounded-2xl transition-all ${discount > 0 ? 'bg-primary text-white' : 'bg-card border border-border'}`}>
                    <Sparkles size={18} />
                    <div className={`absolute ${lang === 'ar' ? 'right-full mr-4' : 'left-full ml-4'} top-1/2 -translate-y-1/2 px-3 py-2 bg-elevated text-main shadow-2xl z-[100] border border-primary/20`}>
                      {lang === 'ar' ? 'خصم' : 'Discount'}
                    </div>
                  </button>
                  <button onClick={() => setShowCalc(!showCalc)} className="group relative p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800">
                    <Calculator size={18} className={showCalc ? 'text-indigo-600' : ''} />
                    <div className={`absolute ${lang === 'ar' ? 'right-full mr-4' : 'left-full ml-4'} top-1/2 -translate-y-1/2 px-3 py-2 bg-elevated text-main shadow-2xl z-[100] border border-primary/20`}>
                      {lang === 'ar' ? 'حاسبة' : 'Calculator'}
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {!isPOS && filteredSections.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {!isCollapsed && (
                <h3 className="px-4 text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4 opacity-50">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    onMouseEnter={() => handlePreload(item.loaderKey)}
                    className={({ isActive }) => `
                      flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] transition-all duration-300 group relative overflow-hidden
                      ${isActive
                        ? 'bg-primary text-white shadow-xl shadow-primary/30 ring-4 ring-primary/5'
                        : 'text-muted hover:bg-primary/5 hover:text-primary'
                      }
                      ${isCollapsed ? 'justify-center p-4' : ''}
                    `}
                  >
                    <item.icon size={22} className={`transition-transform duration-500 ${isCollapsed ? '' : 'group-hover:scale-110'}`} />
                    {!isCollapsed && <span className="font-black text-[11px] uppercase tracking-widest">{item.label}</span>}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl z-[100]">
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {isPOS && (
            <div className="space-y-4">
              <NavLink
                to="/"
                className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] transition-all duration-300 group relative overflow-hidden
                    text-primary bg-primary/5 border border-primary/20
                    ${isCollapsed ? 'justify-center p-4' : ''}
                  `}
              >
                <LayoutDashboard size={22} className="group-hover:rotate-12 transition-transform" />
                {!isCollapsed && <span className="font-black text-[11px] uppercase tracking-widest">{lang === 'ar' ? 'العودة للرئيسية' : 'Back to Dashboard'}</span>}
              </NavLink>
            </div>
          )}



          {/* Theme Picker */}
          {!isCollapsed && !isPOS && (
            <div className="px-2 pt-6 border-t border-border">
              <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-50">Interface Skin</span>
              </div>
              <div className="flex justify-between px-2">
                {([
                  { id: 'xen', color: '#00B4D8' },
                  { id: 'ember', color: '#F97316' },
                  { id: 'graphite', color: '#52525B' },
                  { id: 'ocean', color: '#3B82F6' },
                  { id: 'carbon', color: '#171717' }
                ] as const satisfies ReadonlyArray<{ id: AppTheme; color: string }>).map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-125 hover:rotate-12 ${theme === t.id ? 'border-primary ring-4 ring-primary/20 scale-125' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: t.color }}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border space-y-4">
          {!isCollapsed && (
            <div className="p-3 rounded-2xl border border-border bg-elevated/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted">Sync Health</span>
                <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-card border border-border px-2 py-1.5 text-center">
                  <div className="text-[8px] font-black uppercase text-muted">Pending</div>
                  <div className="text-xs font-black text-amber-500">{syncStats.pending}</div>
                </div>
                <div className="rounded-xl bg-card border border-border px-2 py-1.5 text-center">
                  <div className="text-[8px] font-black uppercase text-muted">Failed</div>
                  <div className="text-xs font-black text-rose-500">{syncStats.failed}</div>
                </div>
                <div className="rounded-xl bg-card border border-border px-2 py-1.5 text-center">
                  <div className="text-[8px] font-black uppercase text-muted">Queued</div>
                  <div className="text-xs font-black text-main">{syncStats.total}</div>
                </div>
              </div>
            </div>
          )}

          {!isCollapsed && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={handleToggleDarkMode}
                className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-all text-muted hover:text-primary shadow-sm"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={handleToggleTouchMode}
                className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${isTouchMode ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'bg-slate-100 dark:bg-slate-900 text-muted hover:bg-primary/10 hover:text-primary shadow-sm'}`}
              >
                <Tablet size={16} />
              </button>
              <button
                onClick={handleToggleLang}
                className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-all text-[9px] font-black uppercase col-span-2 text-muted hover:text-primary shadow-sm tracking-widest"
              >
                {lang === 'en' ? 'العربية' : 'English'}
              </button>
            </div>
          )}

          {/* Shift Out Button - Prominent in POS */}
          {activeShift && (isPOS || !isCollapsed) && (
            <button
              onClick={() => setIsCloseShiftModalOpen(true)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-500 ${isCollapsed ? 'justify-center p-4' : ''} shadow-lg shadow-indigo-500/20 group relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
              {!isCollapsed && <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t.close_shift || 'Shift Out'}</span>}
              {isCollapsed && (
                <div className={`absolute ${lang === 'ar' ? 'right-full mr-5' : 'left-full ml-5'} top-1/2 -translate-y-1/2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-2xl z-[100]`}>
                  {t.close_shift || 'Shift Out'}
                </div>
              )}
            </button>
          )}

          <button
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-500 ${isCollapsed ? 'justify-center p-4' : ''} shadow-sm group`}
            onClick={handleLogout}
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            {!isCollapsed && <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t.sign_out}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default React.memo(Sidebar);
