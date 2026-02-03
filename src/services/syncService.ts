import { localDb } from '../db/localDb';
import { ordersApi } from './api';

export const syncService = {
    async pushPendingOrders() {
        const pendingOrders = await localDb.orders
            .where('syncStatus')
            .equals('PENDING')
            .toArray();

        for (const order of pendingOrders) {
            try {
                await ordersApi.create(order as any);
                await localDb.orders.update(order.id, { syncStatus: 'SYNCED' });
                console.log(`✅ Order ${order.id} synced`);
            } catch (error) {
                console.error(`❌ Failed to sync order ${order.id}:`, error);
                await localDb.orders.update(order.id, { syncStatus: 'FAILED' });
            }
        }
    },

    initSyncInterval(ms: number = 60000) {
        setInterval(() => {
            if (navigator.onLine) {
                this.pushPendingOrders();
            }
        }, ms);
    }
};
