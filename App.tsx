import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useAuthStore } from './stores/useAuthStore';
import { useDataInit } from './hooks/useDataInit';
import { Loader2, WifiOff, Wifi } from 'lucide-react';

// Loading Screen Component
const LoadingScreen: React.FC<{ isConnected: boolean }> = ({ isConnected }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
          <span className="text-4xl font-black text-white">CZ</span>
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center animate-pulse">
          <Loader2 size={16} className="text-white animate-spin" />
        </div>
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Coduis Zen</h1>
      <p className="text-sm text-slate-400 mb-4">جاري تحميل البيانات...</p>
      <div className="flex items-center justify-center gap-2 text-xs">
        {isConnected ? (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Wifi size={12} /> متصل بقاعدة البيانات
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-amber-400">
            <WifiOff size={12} /> وضع غير متصل
          </span>
        )}
      </div>
    </div>
  </div>
);

import { auditService } from './services/auditService';
import { aiIntelligenceService } from './services/aiIntelligenceService';

const App: React.FC = () => {
  const { settings } = useAuthStore();
  const { isLoading, isConnected } = useDataInit();

  useEffect(() => {
    // Initialize services
    auditService.init();
    aiIntelligenceService.init();

    // Apply theme to document root
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);

    if (settings.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (settings.language === 'ar') {
      root.setAttribute('dir', 'rtl');
      root.lang = 'ar';
    } else {
      root.setAttribute('dir', 'ltr');
      root.lang = 'en';
    }
  }, [settings.theme, settings.isDarkMode, settings.language]);

  // Warm up the module cache for ALL routes after initial data load
  useEffect(() => {
    if (!isLoading) {
      const preload = async () => {
        const { loaders } = await import('./routes');
        // Preload everything in background
        Object.values(loaders).forEach(loader => (loader as Function)());
      };
      preload();
    }
  }, [isLoading]);

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen isConnected={isConnected} />;
  }

  return <RouterProvider router={router} />;
}

export default App;
