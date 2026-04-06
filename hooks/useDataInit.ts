// Data Initialization Hook
// Loads data from API on app start

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../stores/useAuthStore';
import { useMenuStore } from '../stores/useMenuStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useCRMStore } from '../stores/useCRMStore';
import { checkHealth } from '../services/api/core';
import { syncService } from '../services/syncService';
import { UserRole } from '../types';

interface InitResult {
    isLoading: boolean;
    isConnected: boolean;
    error: string | null;
}

export const useDataInit = (): InitResult => {
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { currentUser, fetchBranches, fetchPrinters, fetchSettings, fetchUsers, isAuthenticated, logout } = useAuthStore(
        useShallow((state) => ({
            currentUser: state.settings.currentUser,
            fetchBranches: state.fetchBranches,
            fetchPrinters: state.fetchPrinters,
            fetchSettings: state.fetchSettings,
            fetchUsers: state.fetchUsers,
            isAuthenticated: state.isAuthenticated,
            logout: state.logout,
        }))
    );
    const fetchMenu = useMenuStore((state) => state.fetchMenu);
    const fetchOrders = useOrderStore((state) => state.fetchOrders);
    const fetchCustomers = useCRMStore((state) => state.fetchCustomers);

    useEffect(() => {
        const onInvalidToken = () => {
            logout();
            setError('INVALID_TOKEN');
            setIsConnected(false);
        };

        window.addEventListener('restoflow:auth-invalid', onInvalidToken as EventListener);
        return () => window.removeEventListener('restoflow:auth-invalid', onInvalidToken as EventListener);
    }, [logout]);

    useEffect(() => {
        let cancelled = false;

        const initData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                if (!isAuthenticated) {
                    if (!cancelled) {
                        setIsLoading(false);
                    }
                    return;
                }

                const health = await checkHealth();
                const connected = health.status === 'ok';

                if (!cancelled) {
                    setIsConnected(connected);
                }

                if (connected) {
                    syncService.syncPending();
                }

                const dataPromises: Promise<void>[] = [
                    fetchBranches(),
                    fetchSettings(),
                    fetchPrinters(),
                    fetchMenu(),
                    fetchOrders({ limit: 50 }),
                    fetchCustomers(),
                ];

                if (currentUser?.role === UserRole.SUPER_ADMIN) {
                    dataPromises.push(fetchUsers());
                }

                await Promise.allSettled(dataPromises);
                console.log('Data loaded from database');
            } catch (err: any) {
                if (!cancelled) {
                    setError(err.message);
                    setIsConnected(false);
                }
                console.warn('Running in offline mode:', err.message);
            } finally {
                syncService.init();
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        initData();

        return () => {
            cancelled = true;
        };
    }, [currentUser?.role, fetchBranches, fetchCustomers, fetchMenu, fetchOrders, fetchPrinters, fetchSettings, fetchUsers, isAuthenticated]);

    return { isLoading, isConnected, error };
};

export const useSyncToDatabase = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const syncAuth = useAuthStore((state) => state.syncToDatabase);
    const syncMenu = useMenuStore((state) => state.syncToDatabase);

    const sync = async () => {
        setIsSyncing(true);
        setError(null);

        try {
            await Promise.all([
                syncAuth(),
                syncMenu(),
            ]);
            setLastSync(new Date());
            console.log('Data synced to database');
        } catch (err: any) {
            setError(err.message);
            console.error('Sync failed:', err);
        } finally {
            setIsSyncing(false);
        }
    };

    return { sync, isSyncing, lastSync, error };
};

export default useDataInit;
