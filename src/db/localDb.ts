import Dexie, { Table } from 'dexie';
import { Order, OrderItem, SyncStatus } from '../types';

export interface LocalOrder extends Order {
    id: string;
    syncStatus: SyncStatus;
}

export class RestoFlowLocalDb extends Dexie {
    orders!: Table<LocalOrder>;
    inventoryUpdates!: Table<{ id: string; itemId: string; quantity: number; timestamp: number }>;

    constructor() {
        super('RestoFlowLocalDb');
        this.version(1).stores({
            orders: 'id, status, syncStatus, createdAt',
            inventoryUpdates: 'id, itemId, timestamp'
        });
    }
}

export const localDb = new RestoFlowLocalDb();
