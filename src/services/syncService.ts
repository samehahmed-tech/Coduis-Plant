import { localDb, SyncQueueItem } from '../db/localDb';
import { auditApi, branchesApi, customersApi, inventoryApi, menuApi, ordersApi, settingsApi, tablesApi } from '../../services/api';

const createQueueItem = (entity: string, action: string, payload: any): SyncQueueItem => ({
    id: `SYNC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
    entity,
    action,
    payload,
    status: 'PENDING',
    retryCount: 0,
    createdAt: Date.now(),
});

export const syncService = {
    async queue(entity: string, action: string, payload: any) {
        await localDb.syncQueue.add(createQueueItem(entity, action, payload));
    },

    async syncPending() {
        if (!navigator.onLine) return;

        const pending = await localDb.syncQueue
            .where('status')
            .equals('PENDING')
            .toArray();

        for (const item of pending) {
            try {
                await this.processItem(item);
                await localDb.syncQueue.update(item.id, { status: 'SYNCED', updatedAt: Date.now() });
            } catch (error: any) {
                await localDb.syncQueue.update(item.id, {
                    status: 'FAILED',
                    retryCount: (item.retryCount || 0) + 1,
                    lastError: error.message,
                    updatedAt: Date.now(),
                });
            }
        }
    },

    async processItem(item: SyncQueueItem) {
        const { entity, action, payload } = item;

        switch (entity) {
            case 'menuCategory':
                if (action === 'CREATE') return menuApi.createCategory(payload);
                if (action === 'UPDATE') return menuApi.updateCategory(payload.id, payload);
                if (action === 'DELETE') return menuApi.deleteCategory(payload.id);
                break;
            case 'menuItem':
                if (action === 'CREATE') return menuApi.createItem(payload);
                if (action === 'UPDATE') return menuApi.updateItem(payload.id, payload);
                if (action === 'DELETE') return menuApi.deleteItem(payload.id);
                break;
            case 'inventoryItem':
                if (action === 'CREATE') return inventoryApi.create(payload);
                if (action === 'UPDATE') return inventoryApi.update(payload.id, payload);
                if (action === 'DELETE') return inventoryApi.delete(payload.id);
                break;
            case 'warehouse':
                if (action === 'CREATE') return inventoryApi.createWarehouse(payload);
                break;
            case 'branch':
                if (action === 'CREATE') return branchesApi.create(payload);
                break;
            case 'stockUpdate':
                return inventoryApi.updateStock(payload);
            case 'customer':
                if (action === 'CREATE') return customersApi.create(payload);
                if (action === 'UPDATE') return customersApi.update(payload.id, payload);
                if (action === 'DELETE') return customersApi.delete(payload.id);
                break;
            case 'order':
                if (action === 'CREATE') {
                    const result = await ordersApi.create(payload);
                    await localDb.orders.update(payload.id, { syncStatus: 'SYNCED' } as any);
                    return result;
                }
                break;
            case 'orderStatus':
                if (action === 'UPDATE') {
                    const result = await ordersApi.updateStatus(payload.id, payload.data);
                    const existing = await localDb.orders.get(payload.id);
                    if (existing) {
                        await localDb.orders.put({ ...existing, status: payload.data.status } as any);
                    }
                    return result;
                }
                break;
            case 'tableStatus':
                if (action === 'UPDATE') return tablesApi.updateStatus(payload.id, payload.status, payload.currentOrderId);
                break;
            case 'setting':
                if (action === 'UPDATE') return settingsApi.update(payload.key, payload.value, payload.category, payload.updated_by);
                break;
            case 'settingsBulk':
                if (action === 'UPDATE') return settingsApi.updateBulk(payload);
                break;
            case 'auditLog':
                if (action === 'CREATE') return auditApi.create(payload);
                break;
            default:
                throw new Error(`Unknown sync entity: ${entity}`);
        }
    },

    initSyncInterval(ms: number = 30000) {
        setInterval(() => {
            if (navigator.onLine) {
                this.syncPending();
            }
        }, ms);
    }
};

export default syncService;

