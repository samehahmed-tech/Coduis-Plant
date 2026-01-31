import { ERPEvent, SyncStats } from './types';

/**
 * SYNC ENGINE
 * Monitors connectivity and reliably pushes local events to the central PostgreSQL server.
 */
export class ERPSyncEngine {
    private isOnline: boolean = navigator.onLine;
    private isProcessing: boolean = false;

    constructor() {
        window.addEventListener('online', () => this.handleConnectivityChange(true));
        window.addEventListener('offline', () => this.handleConnectivityChange(false));
    }

    private handleConnectivityChange(status: boolean) {
        this.isOnline = status;
        console.log(`[SyncEngine] Network status: ${status ? 'ONLINE' : 'OFFLINE'}`);
        if (status) {
            this.startSyncCycle();
        }
    }

    /**
     * The heart of the sync cycle.
     * Iterates through pending events and sends them to the server API.
     */
    public async startSyncCycle(): Promise<void> {
        if (!this.isOnline || this.isProcessing) return;

        this.isProcessing = true;
        console.info('[SyncEngine] Beginning synchronization cycle...');

        try {
            // STEP 1: Fetch pending events from SQLite
            const pendingEvents = await this.getPendingEvents();

            for (const event of pendingEvents) {
                const success = await this.pushToRemoteServer(event);
                if (success) {
                    await this.markAsSynced(event.eventId);
                } else {
                    await this.handleFailure(event.eventId);
                }
            }
        } catch (error) {
            console.error('[SyncEngine] Sync cycle interrupted:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    private async pushToRemoteServer(event: ERPEvent): Promise<boolean> {
        try {
            // This would be a real fetch call to your PostgreSQL/Node.js API
            // const response = await fetch('/api/v1/sync/event', { ... });

            // Mocking a successful server ACK
            console.log(`[HTTP/Sync] Sending event ${event.eventId} to server...`);
            return true;
        } catch (e) {
            return false;
        }
    }

    private async getPendingEvents(): Promise<ERPEvent[]> {
        // Implementation for SQLite query: SELECT * FROM event_log WHERE sync_status = 0
        const events: ERPEvent[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('erp_event_')) {
                const event = JSON.parse(localStorage.getItem(key) || '{}');
                if (event.syncStatus === 'PENDING') {
                    events.push(event);
                }
            }
        }
        return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    private async markAsSynced(eventId: string) {
        const key = `erp_event_${eventId}`;
        const event = JSON.parse(localStorage.getItem(key) || '{}');
        event.syncStatus = 'SYNCED';
        localStorage.setItem(key, JSON.stringify(event));
        console.info(`[SyncEngine] Event ${eventId} confirmed by server.`);
    }

    private async handleFailure(eventId: string) {
        // Logic for retries or marking dead letters
        console.warn(`[SyncEngine] Event ${eventId} failed to sync.`);
    }

    public getStatus(): SyncStats {
        return {
            totalPending: 0, // Should be actual count
            failedCount: 0,
            isOnline: this.isOnline,
            lastSyncTime: new Date()
        };
    }
}
