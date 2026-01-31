import React, { useState } from 'react';
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
  Briefcase,
  Shield
} from 'lucide-react';
import { ViewState, User, UserRole, AppPermission } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user?: User;
  isAdmin: boolean;
  branches: any[];
  activeBranchId?: string;
  onSelectBranch: (id: string) => void;
  hasPermission: (perm: AppPermission) => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView, onChangeView, isDarkMode,
  onToggleDarkMode, lang, onToggleLang,
  isCollapsed, onToggleCollapse,
  user, isAdmin, branches, activeBranchId, onSelectBranch,
  hasPermission
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const t = {
    dashboard: lang === 'ar' ? 'لوحة التحكم' : 'Dashboard',
    pos: lang === 'ar' ? 'نقطة البيع' : 'POS',
    menu: lang === 'ar' ? 'المنيو' : 'Menu',
    kds: lang === 'ar' ? 'شاشة المطبخ' : 'KDS',
    inventory: lang === 'ar' ? 'المخازن' : 'Inventory',
    finance: lang === 'ar' ? 'الحسابات' : 'Finance',
    crm: lang === 'ar' ? 'العملاء' : 'CRM',
    reports: lang === 'ar' ? 'التقارير' : 'Reports',
    ai_insights: lang === 'ar' ? 'التحليلات' : 'AI Insights',
    ai: lang === 'ar' ? 'المدير الذكي' : 'AI Assistant',
    settings: lang === 'ar' ? 'الإعدادات' : 'Settings',
    security: lang === 'ar' ? 'الأمان والمستخدمين' : 'Security & Users',
    call_center: lang === 'ar' ? 'مركز الاتصال' : 'Call Center',
  };

  const navigationSections = [
    {
      title: lang === 'ar' ? 'العمليات الميدانية' : 'Operations',
      items: [
        { id: 'DASHBOARD' as ViewState, label: t.dashboard, icon: LayoutDashboard, permission: AppPermission.VIEW_DASHBOARD },
        { id: 'POS' as ViewState, label: t.pos, icon: UtensilsCrossed, permission: AppPermission.VIEW_POS },
        { id: 'CALL_CENTER' as ViewState, label: t.call_center, icon: Headset, permission: AppPermission.VIEW_CALL_CENTER },
        { id: 'KDS' as ViewState, label: t.kds, icon: ChefHat, permission: AppPermission.VIEW_KDS },
      ]
    },
    {
      title: lang === 'ar' ? 'إدارة الموارد' : 'Resources',
      items: [
        { id: 'MENU_MANAGER' as ViewState, label: t.menu, icon: BookOpen, permission: AppPermission.MANAGE_MENU },
        { id: 'INVENTORY' as ViewState, label: t.inventory, icon: Package, permission: AppPermission.MANAGE_INVENTORY },
        { id: 'CRM' as ViewState, label: t.crm, icon: Users, permission: AppPermission.VIEW_CRM },
      ]
    },
    {
      title: lang === 'ar' ? 'التحليلات والمالية' : 'Finance & Insights',
      items: [
        { id: 'FINANCE' as ViewState, label: t.finance, icon: Landmark, permission: AppPermission.MANAGE_FINANCE },
        { id: 'REPORTS' as ViewState, label: t.reports, icon: BarChart3, permission: AppPermission.VIEW_REPORTS },
        { id: 'AI_INSIGHTS' as ViewState, label: t.ai_insights, icon: Sparkles, permission: AppPermission.VIEW_AI_INSIGHTS },
      ]
    },
    {
      title: lang === 'ar' ? 'أدوات ذكية' : 'Smart Tools',
      items: [
        { id: 'AI_ASSISTANT' as ViewState, label: t.ai, icon: Bot, permission: AppPermission.VIEW_AI_ASSISTANT },
        { id: 'SECURITY' as ViewState, label: t.security, icon: Shield, permission: AppPermission.MANAGE_SECURITY },
        { id: 'SETTINGS' as ViewState, label: t.settings, icon: Settings, permission: AppPermission.MANAGE_SETTINGS },
      ]
    }
  ];

  const filteredSections = navigationSections.map(section => ({
    ...section,
    items: section.items.filter(item => hasPermission(item.permission))
  })).filter(section => section.items.length > 0);

  const handleNavClick = (view: ViewState) => {
    onChangeView(view);
    setIsMobileOpen(false);
  };

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-56 xl:w-64';

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className={`lg:hidden fixed top-3 z-[60] p-2 bg-slate-900 text-white rounded-xl shadow-lg ${lang === 'ar' ? 'right-3' : 'left-3'}`}
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarWidth} bg-white dark:bg-slate-900 text-white flex flex-col h-screen fixed top-0 shadow-xl z-[80] transition-all duration-300
        ${lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} border-slate-100 dark:border-slate-800
        ${isMobileOpen ? 'translate-x-0' : `${lang === 'ar' ? 'translate-x-full' : '-translate-x-full'} lg:translate-x-0`}
      `}>
        {/* Header */}
        <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/20">
              <UtensilsCrossed className="text-white" size={24} />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="text-xl font-black text-slate-800 dark:text-white leading-tight">RestoFlow</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Enterprise ERP</p>
              </div>
            )}
          </div>

          {/* Collapse Button - Desktop only */}
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all ${isCollapsed ? 'rotate-180' : ''}`}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Close Button - Mobile only */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin Branch Multi-Select (Only for Super Admin) */}
        {isAdmin && !isCollapsed && (
          <div className="mx-4 mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-600/5 dark:bg-indigo-400/5 rounded-2xl -m-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-3 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                  <Briefcase size={16} />
                </div>
                <select
                  value={activeBranchId}
                  onChange={(e) => onSelectBranch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight flex-1"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
          {filteredSections.map((section, sIdx) => (
            <div key={sIdx} className="mb-4">
              {!isCollapsed && (
                <h3 className={`px-6 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500`}>
                  {section.title}
                </h3>
              )}
              <ul className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        key={item.id}
                        onClick={() => {
                          onChangeView(item.id);
                          setIsMobileOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 btn-theme transition-all duration-300 group font-bold ${currentView === item.id
                          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                          } ${isCollapsed ? 'justify-center' : ''}`}
                      >
                        <item.icon size={22} className={currentView === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                        {!isCollapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                        {!isCollapsed && currentView === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer Controls */}
        <div className={`p-3 border-t border-slate-100 dark:border-slate-800 space-y-1 ${isCollapsed ? 'px-2' : ''}`}>
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              onClick={onToggleDarkMode}
              className={`w-full flex items-center gap-3 px-3 py-3 btn-theme text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold ${isCollapsed ? 'justify-center' : ''}`}
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
              {!isCollapsed && <span className="text-sm">{isDarkMode ? t.light_mode : t.dark_mode}</span>}
            </button>

            <button
              onClick={onToggleLang}
              className={`w-full flex items-center gap-3 px-3 py-3 btn-theme text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Languages size={22} />
              {!isCollapsed && <span className="text-sm">{lang === 'ar' ? 'English' : 'العربية'}</span>}
            </button>

            <button className={`w-full flex items-center gap-3 px-3 py-3 btn-theme text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all font-black mt-4 ${isCollapsed ? 'justify-center' : ''}`}>
              <LogOut size={22} />
              {!isCollapsed && <span className="text-sm uppercase tracking-widest">{t.sign_out}</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
