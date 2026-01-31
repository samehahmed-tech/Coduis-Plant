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
  Shield,
  Fingerprint,
  Building2,
  ShoppingBag,
  Palette
} from 'lucide-react';
import { ViewState, User, UserRole, AppPermission, Branch } from '../types';
import { translations } from '../services/translations';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
  user?: User;
  isAdmin: boolean;
  branches: Branch[];
  activeBranchId?: string;
  onSelectBranch: (id: string) => void;
  hasPermission: (perm: AppPermission) => boolean;
  onLogout: () => void;
  theme: string;
  onThemeChange: (theme: any) => void;
  onSetOrderMode: (mode: any) => void;
}

// ... Calculator Definition ...

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  isDarkMode,
  onToggleDarkMode,
  isCollapsed,
  onToggleCollapse,
  lang,
  onToggleLang,
  user,
  isAdmin,
  branches,
  activeBranchId,
  onSelectBranch,
  hasPermission,
  onLogout,
  theme,
  onThemeChange,
  onSetOrderMode
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const t = translations[lang];

  // ... (navigationSections) ...

  const navigationSections = [
    {
      title: lang === 'ar' ? 'العمليات الميدانية' : 'Operations',
      items: [
        { id: 'DASHBOARD' as ViewState, label: t.dashboard, icon: LayoutDashboard, permission: AppPermission.NAV_DASHBOARD },
        { id: 'POS' as ViewState, label: t.pos, icon: UtensilsCrossed, permission: AppPermission.NAV_POS },
        { id: 'CALL_CENTER' as ViewState, label: t.call_center, icon: Headset, permission: AppPermission.NAV_CALL_CENTER },
        { id: 'KDS' as ViewState, label: t.kds, icon: ChefHat, permission: AppPermission.NAV_KDS },
      ]
    },
    {
      title: lang === 'ar' ? 'إدارة الموارد' : 'Resources',
      items: [
        { id: 'MENU_MANAGER' as ViewState, label: t.menu, icon: BookOpen, permission: AppPermission.NAV_MENU_MANAGER },
        { id: 'RECIPES' as ViewState, label: t.recipes, icon: ChefHat, permission: AppPermission.NAV_RECIPES },
        { id: 'INVENTORY' as ViewState, label: t.inventory, icon: Package, permission: AppPermission.NAV_INVENTORY },
        { id: 'CRM' as ViewState, label: t.crm, icon: Users, permission: AppPermission.NAV_CRM },
      ]
    },
    {
      title: lang === 'ar' ? 'التحليلات والمالية' : 'Finance & Insights',
      items: [
        { id: 'FINANCE' as ViewState, label: t.finance, icon: Landmark, permission: AppPermission.NAV_FINANCE },
        { id: 'REPORTS' as ViewState, label: t.reports, icon: BarChart3, permission: AppPermission.NAV_REPORTS },
        { id: 'AI_INSIGHTS' as ViewState, label: t.ai_insights, icon: Sparkles, permission: AppPermission.NAV_AI_ASSISTANT },
      ]
    },
    {
      title: lang === 'ar' ? 'أدوات ذكية' : 'Smart Tools',
      items: [
        { id: 'AI_ASSISTANT' as ViewState, label: t.ai, icon: Bot, permission: AppPermission.NAV_AI_ASSISTANT },
        { id: 'SECURITY' as ViewState, label: t.security, icon: Shield, permission: AppPermission.NAV_SECURITY },
        { id: 'FORENSICS' as ViewState, label: t.forensics, icon: Fingerprint, permission: AppPermission.NAV_FORENSICS },
        { id: 'SETTINGS' as ViewState, label: t.settings, icon: Settings, permission: AppPermission.NAV_SETTINGS },
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

  const currentBranchName = branches.find(b => b.id === activeBranchId)?.name || (lang === 'ar' ? 'كل الفروع' : 'All Branches');

  // Quick Actions for Cashier
  const isCashier = user?.role === UserRole.CASHIER || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.BRANCH_MANAGER;

  const handleModeClick = (mode: string) => {
    // Map string to OrderType
    // DINE_IN, TAKEAWAY, DELIVERY
    let type = 'DINE_IN';
    if (mode === 'TakeAway') type = 'TAKEAWAY';
    if (mode === 'Delivery') type = 'DELIVERY';
    onSetOrderMode(type);
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className={`lg:hidden fixed top-3 z-[60] p-2 bg-slate-900 text-white rounded-xl shadow-lg ${lang === 'ar' ? 'right-3' : 'left-3'}`}
      >
        <Menu size={20} />
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={`
        ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white flex flex-col h-screen fixed top-0 shadow-2xl z-[80] transition-all duration-300
        ${lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} border-slate-100 dark:border-slate-800
        ${isMobileOpen ? 'translate-x-0' : `${lang === 'ar' ? 'translate-x-full' : '-translate-x-full'} lg:translate-x-0`}
      `}>
        {/* Header Branding */}
        <div className={`p-6 border-b border-slate-100 dark:border-slate-800 ${isCollapsed ? 'items-center' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Sparkles className="text-white" size={20} />
            </div>
            {!isCollapsed && (
              <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">
                RestoFlow <span className="block text-[10px] text-indigo-600 font-bold tracking-widest mt-1">ERP CENTER</span>
              </h1>
            )}
          </div>
        </div>

        {/* User Profile & Branch Selector */}
        {!isCollapsed && user && (
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center font-black text-white shadow-md">
                {user.name[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black truncate">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role.replace('_', ' ')}</p>
              </div>
            </div>

            {isAdmin && (
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">{t.switch_branch}</p>
                <select
                  value={activeBranchId}
                  onChange={(e) => onSelectBranch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t.all_branches}</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            {!isAdmin && user.assignedBranchId && (
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl flex items-center gap-2 border border-indigo-100 dark:border-indigo-900/30">
                <Building2 size={12} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">{currentBranchName}</span>
              </div>
            )}
          </div>
        )}

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-6 px-3 no-scrollbar space-y-8">
          {filteredSections.map(section => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{section.title}</p>
              )}
              {section.items.map(item => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-2xl transition-all group
                      ${isActive
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                    {!isCollapsed && <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Cashier Toolkit */}
          {isCashier && !isCollapsed && (
            <div className="space-y-4 px-1 animate-in slide-in-from-bottom-5 duration-500">
              <p className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Quick Tools</p>

              {/* Order Mode Toggles */}
              <div className="grid grid-cols-3 gap-2 px-1">
                {['DineIn', 'TakeAway', 'Delivery'].map((mode, idx) => (
                  <button
                    key={mode}
                    onClick={() => handleModeClick(mode)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors"
                  >
                    {idx === 0 && <UtensilsCrossed size={14} />}
                    {idx === 1 && <ShoppingBag size={14} />}
                    {idx === 2 && <Building2 size={14} />}
                    <span className="text-[9px] font-bold uppercase">{lang === 'ar' ? ['صالة', 'تيك اواي', 'توصيل'][idx] : mode}</span>
                  </button>
                ))}
              </div>

              {/* Calculator Toggle */}
              <div className="px-1">
                <button onClick={() => setShowCalc(!showCalc)} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold uppercase hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <span className="flex items-center gap-2"><ChefHat size={14} /> Calculator</span>
                  <span className="text-[10px] text-slate-400">{showCalc ? 'Hide' : 'Show'}</span>
                </button>
                {showCalc && <div className="mt-2"><Calculator /></div>}
              </div>

              {/* Style Picker */}
              <div className="px-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Theme Style</span>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">{theme}</span>
                </div>
                <div className="flex gap-2">
                  {['nebula', 'emerald', 'sunset', 'violet'].map(t => (
                    <button
                      key={t}
                      onClick={() => onThemeChange(t)}
                      className={`w-6 h-6 rounded-full border-2 ${theme === t ? 'border-white ring-2 ring-indigo-500' : 'border-transparent'} transition-all hover:scale-110`}
                      style={{ backgroundColor: t === 'nebula' ? '#6366f1' : t === 'emerald' ? '#10b981' : t === 'sunset' ? '#f97316' : '#8b5cf6' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {!isCollapsed && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button onClick={onToggleDarkMode} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-indigo-50 transition-colors text-slate-500 hover:text-indigo-600">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={onToggleLang} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-indigo-50 transition-colors text-[10px] font-black uppercase">
                {lang === 'en' ? 'AR' : 'EN'}
              </button>
            </div>
          )}

          <button
            className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 transition-all ${isCollapsed ? 'justify-center' : ''}`}
            onClick={onLogout}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">{t.sign_out}</span>}
          </button>

          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft size={16} className={lang === 'ar' ? 'rotate-180' : ''} />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
