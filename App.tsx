import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useAuthStore } from './stores/useAuthStore';
import { useDataInit } from './hooks/useDataInit';
import { Loader2, WifiOff, Wifi } from 'lucide-react';
import { setupApi } from './services/api';
import { socketService } from './services/socketService';
import { useOrderStore } from './stores/useOrderStore';

// Loading Screen Component
const LoadingScreen: React.FC<{ isConnected: boolean }> = ({ isConnected }) => (
  <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] flex items-center justify-center overflow-hidden relative">
    {/* Floating Orbs Background */}
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />

    <div className="text-center relative z-10 animate-fade-in-up">
      <div className="relative mb-10 w-32 h-32 mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-[2.5rem] blur-xl opacity-60 animate-pulse" />
        <div className="relative w-full h-full bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
          <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-200 tracking-tighter">CZ</span>
        </div>
        <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
          <Loader2 size={18} className="text-white animate-spin" />
        </div>
      </div>

      <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Coduis Zen</h1>
      <p className="text-sm text-indigo-200/60 font-medium tracking-wide mb-6 uppercase">Initializing System Assets...</p>

      <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 w-fit mx-auto">
        {isConnected ? (
          <span className="flex items-center gap-2 text-emerald-400">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <Wifi size={14} className="opacity-80" /> Database Connected
          </span>
        ) : (
          <span className="flex items-center gap-2 text-amber-400">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <WifiOff size={14} className="opacity-80" /> Offline Mode
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
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const token = useAuthStore(state => state.token);
  const logout = useAuthStore(state => state.logout);
  const fetchOrders = useOrderStore(state => state.fetchOrders);
  const fetchTables = useOrderStore(state => state.fetchTables);
  const restoreSession = useAuthStore(state => state.restoreSession);
  const { isLoading, isConnected } = useDataInit();
  const [setupStatus, setSetupStatus] = useState<'checking' | 'needs' | 'ready'>('checking');

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    let active = true;
    const checkSetup = async () => {
      try {
        const result = await setupApi.status();
        if (!active) return;
        const needsSetup = !!result?.needsSetup;
        setSetupStatus(needsSetup ? 'needs' : 'ready');
        if (needsSetup && window.location.pathname !== '/setup') {
          window.history.replaceState(null, '', '/setup');
        }
        if (!needsSetup && window.location.pathname === '/setup') {
          window.history.replaceState(null, '', '/login');
        }
      } catch {
        if (active) setSetupStatus('ready');
      }
    };
    checkSetup();
    return () => {
      active = false;
    };
  }, []);

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

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    socketService.init(token);
    socketService.joinBranch(settings.activeBranchId);

    const handleOrderCreated = () => fetchOrders({ limit: 50 });
    const handleOrderStatus = () => fetchOrders({ limit: 50 });
    const handleDispatchAssigned = () => fetchOrders({ limit: 50 });
    const handleDriverStatus = () => fetchOrders({ limit: 50 });
    const handleTableStatus = () => {
      if (settings.activeBranchId) fetchTables(settings.activeBranchId);
    };
    const handleTableLayout = () => {
      if (settings.activeBranchId) fetchTables(settings.activeBranchId);
    };
    const handleSessionRevoked = () => {
      logout();
      window.location.href = '/login';
    };

    socketService.on('order:created', handleOrderCreated);
    socketService.on('order:status', handleOrderStatus);
    socketService.on('dispatch:assigned', handleDispatchAssigned);
    socketService.on('driver:status', handleDriverStatus);
    socketService.on('table:status', handleTableStatus);
    socketService.on('table:layout', handleTableLayout);
    socketService.on('security:session-revoked', handleSessionRevoked);

    return () => {
      socketService.off('order:created', handleOrderCreated);
      socketService.off('order:status', handleOrderStatus);
      socketService.off('dispatch:assigned', handleDispatchAssigned);
      socketService.off('driver:status', handleDriverStatus);
      socketService.off('table:status', handleTableStatus);
      socketService.off('table:layout', handleTableLayout);
      socketService.off('security:session-revoked', handleSessionRevoked);
    };
  }, [isAuthenticated, token, settings.activeBranchId, fetchOrders, fetchTables, logout]);

  // Show loading screen while initializing
  if (isLoading || setupStatus === 'checking') {
    return <LoadingScreen isConnected={isConnected} />;
  }

  return <RouterProvider router={router} />;
}

export default App;
