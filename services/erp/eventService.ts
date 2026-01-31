import { ERPEvent, ERPEventType, DeviceIdentity } from './types';

/**
 * EVENT SERVICE
 * Responsible for creating immutable business events and persisting them locally.
 * This is the ONLY way state should be mutated in the ERP.
 */
export class ERPEventService {
    private identity: DeviceIdentity;

    constructor(identity: DeviceIdentity) {
        this.identity = identity;
    }

    /**
     * Records a business action as an event and saves it to local SQLite.
     * In a production environment, this would run inside a SQL Transaction.
     */
    public async recordEvent(
        type: ERPEventType,
        entityId: string,
        payload: any
    ): Promise<ERPEvent> {

        const event: ERPEvent = {
            eventId: crypto.randomUUID(),
            branchId: this.identity.branchId,
            deviceId: this.identity.deviceId,
            type,
            entityId,
            payload,
            timestamp: new Date(),
            syncStatus: 'PENDING',
            retryCount: 0
        };

        // STEP 1: Persistent local write (Primary Action)
        await this.persistLocalAction(event);

        // STEP 2: Record in Event Log (Metadata for Sync Engine)
        await this.appendToLocalEventLog(event);

        console.info(`[ERP Event] Recorded: ${type} for entity ${entityId}`);

        return event;
    }

    private async persistLocalAction(event: ERPEvent): Promise<void> {
        // Here we would execute the SQL update for the specific entity type
        // e.g., INSERT INTO orders... if type === ORDER_CREATED
        // This ensures the local database is always ready for offline read.
        console.log(`[SQL] Persisting state for ${event.type} to local entity tables.`);
    }

    private async appendToLocalEventLog(event: ERPEvent): Promise<void> {
        // INSERT INTO event_log (id, type, payload...)
        // This table is what the SyncEngine watches.
        localStorage.setItem(`erp_event_${event.eventId}`, JSON.stringify(event));
    }
}
