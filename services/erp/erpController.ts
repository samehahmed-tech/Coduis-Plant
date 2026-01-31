import { ERPEventService } from './eventService';
import { ERPSyncEngine } from './syncEngine';
import { DeviceIdentity } from './types';

/**
 * ERP GLOBAL CONTROLLER
 * Single entry point for the application to interact with the offline-first core.
 */
class ERPController {
    public events: ERPEventService;
    public sync: ERPSyncEngine;
    private identity: DeviceIdentity;

    constructor() {
        // Initialization Identity (In production, this is loaded from a persistent .env or SQLite meta table)
        this.identity = {
            branchId: 'BR-CAI-01',
            deviceId: this.getOrCreateDeviceId(),
            deviceName: 'Main-Terminal-POS-01'
        };

        this.events = new ERPEventService(this.identity);
        this.sync = new ERPSyncEngine();

        // Initial sync attempt
        this.sync.startSyncCycle();
    }

    private getOrCreateDeviceId(): string {
        let id = localStorage.getItem('erp_device_id');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('erp_device_id', id);
        }
        return id;
    }

    /**
     * Helper to get system status for UI badges
     */
    public getSystemHealth() {
        return {
            identity: this.identity,
            sync: this.sync.getStatus()
        };
    }
}

// Singleton Export
export const ERP = new ERPController();
