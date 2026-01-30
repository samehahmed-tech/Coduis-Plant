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
  ChevronLeft
} from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView, onChangeView, isDarkMode,
  onToggleDarkMode, lang, onToggleLang,
  isCollapsed, onToggleCollapse
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
  };

  const navigationSections = [
    {
      title: lang === 'ar' ? 'العمليات الميدانية' : 'Operations',
      items: [
        { id: 'DASHBOARD' as ViewState, label: t.dashboard, icon: LayoutDashboard },
        { id: 'POS' as ViewState, label: t.pos, icon: UtensilsCrossed },
        { id: 'KDS' as ViewState, label: t.kds, icon: ChefHat },
      ]
    },
    {
      title: lang === 'ar' ? 'إدارة الموارد' : 'Resources',
      items: [
        { id: 'MENU_MANAGER' as ViewState, label: t.menu, icon: BookOpen },
        { id: 'INVENTORY' as ViewState, label: t.inventory, icon: Package },
        { id: 'CRM' as ViewState, label: t.crm, icon: Users },
      ]
    },
    {
      title: lang === 'ar' ? 'التحليلات والمالية' : 'Finance & Insights',
      items: [
        { id: 'FINANCE' as ViewState, label: t.finance, icon: Landmark },
        { id: 'REPORTS' as ViewState, label: t.reports, icon: BarChart3 },
        { id: 'AI_INSIGHTS' as ViewState, label: t.ai_insights, icon: Sparkles },
      ]
    },
    {
      title: lang === 'ar' ? 'أدوات ذكية' : 'Smart Tools',
      items: [
        { id: 'AI_ASSISTANT' as ViewState, label: t.ai, icon: Bot },
        { id: 'SETTINGS' as ViewState, label: t.settings, icon: Settings },
      ]
    }
  ];

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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
          {navigationSections.map((section, sIdx) => (
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
