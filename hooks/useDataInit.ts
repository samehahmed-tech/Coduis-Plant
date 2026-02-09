// Data Initialization Hook
// Loads data from API on app start

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useMenuStore } from '../stores/useMenuStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useCRMStore } from '../stores/useCRMStore';
import { checkHealth } from '../services/api';
import { syncService } from '../services/syncService';

interface InitResult {
    isLoading: boolean;
    isConnected: boolean;
    error: string | null;
}

export const useDataInit = (): InitResult => {
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useAuthStore(state => state.fetchUsers);
    const fetchBranches = useAuthStore(state => state.fetchBranches);
    const fetchSettings = useAuthStore(state => state.fetchSettings);
    const fetchPrinters = useAuthStore(state => state.fetchPrinters);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const fetchMenu = useMenuStore(state => state.fetchMenu);
    const fetchOrders = useOrderStore(state => state.fetchOrders);
    const fetchCustomers = useCRMStore(state => state.fetchCustomers);

    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                if (!isAuthenticated) {
                    setIsLoading(false);
                    return;
                }
                // Check API health first
                const health = await checkHealth();
                const connected = health.status === 'ok';
                setIsConnected(connected);
                if (connected) {
                    syncService.syncPending();
                }

                // Load all data in parallel
                await Promise.allSettled([
                    fetchUsers(),
                    fetchBranches(),
                    fetchSettings(),
                    fetchPrinters(),
                    fetchMenu(),
                    fetchOrders({ limit: 50 }),
                    fetchCustomers(),
                ]);

                console.log('Data loaded from database');
            } catch (err: any) {
                setError(err.message);
                setIsConnected(false);
                console.warn('Running in offline mode:', err.message);
            } finally {
                syncService.init();
                setIsLoading(false);
            }
        };

        initData();
    }, [isAuthenticated]);

    return { isLoading, isConnected, error };
};

// Hook to sync data to database
export const useSyncToDatabase = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const syncAuth = useAuthStore(state => state.syncToDatabase);
    const syncMenu = useMenuStore(state => state.syncToDatabase);

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

