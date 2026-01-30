
import React from 'react';
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
  Settings
} from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
  t: any;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isDarkMode, toggleTheme, lang, setLang, t }) => {
  const menuItems = [
    { id: 'DASHBOARD' as ViewState, label: t.dashboard, icon: LayoutDashboard },
    { id: 'POS' as ViewState, label: t.pos, icon: UtensilsCrossed },
    { id: 'MENU_MANAGER' as ViewState, label: t.menu, icon: BookOpen },
    { id: 'KDS' as ViewState, label: t.kds, icon: ChefHat },
    { id: 'INVENTORY' as ViewState, label: t.inventory, icon: Package },
    { id: 'FINANCE' as ViewState, label: t.finance, icon: Landmark },
    { id: 'CRM' as ViewState, label: t.crm, icon: Users },
    { id: 'REPORTS' as ViewState, label: t.reports, icon: BarChart3 },
    { id: 'AI_INSIGHTS' as ViewState, label: t.ai_insights, icon: Sparkles },
    { id: 'AI_ASSISTANT' as ViewState, label: t.ai, icon: Bot },
    { id: 'SETTINGS' as ViewState, label: t.settings, icon: Settings },
  ];

  return (
    <div className={`w-64 bg-slate-900 border-slate-800 text-white flex flex-col h-screen fixed top-0 shadow-xl z-50 transition-colors ${lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'}`}>
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-indigo-500/20">R</div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">RestoFlow</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{lang === 'ar' ? 'نظام إدارة متكامل' : 'Enterprise ERP'}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 no-scrollbar">
        <ul className="space-y-1.5 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onChangeView(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 ${isActive
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all group">
          <Languages size={20} className="group-hover:text-indigo-400" />
          <span className="text-sm font-bold">{lang === 'ar' ? 'English' : 'العربية'}</span>
        </button>
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all group">
          {isDarkMode ? <Sun size={20} className="group-hover:text-amber-400" /> : <Moon size={20} className="group-hover:text-indigo-400" />}
          <span className="text-sm font-bold">{isDarkMode ? t.light_mode : t.dark_mode}</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-2xl transition-all group">
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">{t.sign_out}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
