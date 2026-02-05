import Dexie, { Table } from 'dexie';
import { Order, SyncStatus } from '../../types';

export interface LocalOrder extends Order {
    id: string;
    syncStatus: SyncStatus;
}

export interface SyncQueueItem {
    id: string;
    entity: string;
    action: string;
    payload: any;
    status: 'PENDING' | 'SYNCED' | 'FAILED';
    retryCount: number;
    lastError?: string;
    createdAt: number;
    updatedAt?: number;
}

export class RestoFlowLocalDb extends Dexie {
    orders!: Table<LocalOrder>;
    menuCategories!: Table<any>;
    menuItems!: Table<any>;
    customers!: Table<any>;
    inventoryItems!: Table<any>;
    warehouses!: Table<any>;
    settings!: Table<{ key: string; value: any; updatedAt?: number }>;
    users!: Table<any>;
    branches!: Table<any>;
    auditLogs!: Table<any>;
    tables!: Table<any>;
    zones!: Table<any>;
    syncQueue!: Table<SyncQueueItem>;

    constructor() {
        super('RestoFlowLocalDb');

        // Legacy version
        this.version(1).stores({
            orders: 'id, status, syncStatus, createdAt',
        });

        // Current version
        this.version(2).stores({
            orders: 'id, status, syncStatus, createdAt',
            menuCategories: 'id, updatedAt',
            menuItems: 'id, categoryId, updatedAt',
            customers: 'id, phone, updatedAt',
            inventoryItems: 'id, updatedAt',
            warehouses: 'id, branchId, updatedAt',
            settings: 'key, updatedAt',
            users: 'id, email',
            branches: 'id',
            auditLogs: 'id, createdAt',
            tables: 'id, branchId',
            zones: 'id, branchId',
            syncQueue: 'id, status, createdAt, entity'
        });
    }
}

export const localDb = new RestoFlowLocalDb();

