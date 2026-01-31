/**
 * CORE ERP TYPES - Offline-First Event-Based Architecture
 */

export enum ERPEventType {
    ORDER_CREATED = 'ORDER_CREATED',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    STOCK_ADJUSTED = 'STOCK_ADJUSTED',
    SESSION_STARTED = 'SESSION_STARTED',
    SESSION_ENDED = 'SESSION_ENDED',
    BRANCH_CONFIG_UPDATED = 'BRANCH_CONFIG_UPDATED'
}

export interface ERPEvent {
    eventId: string;        // UUID v4
    branchId: string;      // Logical branch anchor
    deviceId: string;      // Persistent device anchor
    type: ERPEventType;
    entityId: string;      // ID of order/item/user
    payload: any;          // The actual data (JSON)
    timestamp: Date;
    syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
    retryCount: number;
}

export interface DeviceIdentity {
    branchId: string;
    deviceId: string;
    deviceName: string;
}

export interface SyncStats {
    totalPending: number;
    failedCount: number;
    isOnline: boolean;
    lastSyncTime?: Date;
}
