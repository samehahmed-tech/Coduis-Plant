import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useAuthStore } from './stores/useAuthStore';
import { useDataInit } from './hooks/useDataInit';
import { Loader2, WifiOff, Wifi } from 'lucide-react';
import { setupApi } from './services/api/setup';
import { socketService } from './services/socketService';
import { useOrderStore } from './stores/useOrderStore';
import { ToastProvider } from './components/common/ToastProvider';
import { ConfirmProvider } from './components/common/ConfirmProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ThemeProvider } from './theme';

// Loading Screen Component
const LoadingScreen: React.FC<{ isConnected: boolean }> = ({ isConnected }) => (
  <div className="min-h-screen relative overflow-hidden bg-[#0f1718] text-white flex items-center justify-center">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.35),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.2),transparent_18%),linear-gradient(180deg,#122022_0%,#0d1416_55%,#0a1011_100%)]" />
    <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
    <div className="absolute top-[10%] left-[12%] h-64 w-64 rounded-full bg-teal-400/10 blur-3xl animate-pulse" />
    <div className="absolute bottom-[12%] right-[10%] h-72 w-72 rounded-full bg-amber-400/10 blur-3xl animate-pulse delay-1000" />

    <div className="relative z-10 text-center animate-fade-in-up px-6">
      <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/10 bg-white/6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,rgba(17,94,89,0.95),rgba(180,110,28,0.92))] shadow-[0_16px_40px_rgba(20,184,166,0.25)]">
          <span className="text-3xl font-black tracking-tight text-white">RF</span>
        </div>
      </div>

      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.4em] text-teal-200/70">RestoFlow ERP</p>
      <h1 className="mb-2 text-4xl font-black tracking-tight text-white">Operational Control, Warming Up</h1>
      <p className="mb-8 text-sm font-medium tracking-wide text-white/55">Preparing services, workspace context, and live restaurant data.</p>

      <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/6 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 w-fit mx-auto">
        {isConnected ? (
          <span className="flex items-center gap-2 text-emerald-300">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
            </div>
            <Wifi size={14} className="opacity-80" /> Database Connected
          </span>
        ) : (
          <span className="flex items-center gap-2 text-amber-300">
            <div className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            <WifiOff size={14} className="opacity-80" /> Offline Mode
          </span>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 text-white/45">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-xs font-semibold uppercase tracking-[0.28em]">Initializing system assets</span>
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
    // Theme / dark / RTL are now managed by <ThemeProvider>
  }, []);

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

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
