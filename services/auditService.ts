import { eventBus } from './eventBus';
import { AuditEventType, AuditLog } from '../types';
import { auditApi } from './api';
import { useAuthStore } from '../stores/useAuthStore';
import { syncService } from './syncService';

class AuditService {
    private secretKey = 'restoflow-secure-audit-secret'; // Should be in .env

    init() {
        // Subscribe to all audit event types
        Object.values(AuditEventType).forEach(eventType => {
            eventBus.on(eventType, (payload) => this.recordEvent(eventType, payload));
        });
    }

    private async recordEvent(eventType: AuditEventType, payload: any) {
        const { user, settings } = useAuthStore.getState();

        const logEntry: Omit<AuditLog, 'id' | 'timestamp'> = {
            eventType,
            userId: user?.id || 'system',
            userName: user?.name || 'System',
            userRole: user?.role || 'SYSTEM',
            branchId: settings.activeBranchId || 'central',
            deviceId: 'browser-client', // Should detect device ID
            payload: {
                before: payload.before,
                after: payload.after || payload.order || payload,
                reason: payload.reason
            },
            metadata: payload.metadata
        };

        // Create the full log with ID and timestamp
        const finalLog: AuditLog = {
            ...logEntry,
            id: `LOG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            timestamp: new Date(),
        };

        // Generate HMAC signature for tamper-proofing
        finalLog.signature = this.generateSignature(finalLog);

        try {
            await auditApi.create(finalLog);
        } catch (error) {
            console.error('Failed to persist audit log:', error);
            syncService.queue('auditLog', 'CREATE', finalLog).catch(console.error);
        }
    }

    private generateSignature(log: AuditLog): string {
        const dataToSign = JSON.stringify({
            id: log.id,
            timestamp: log.timestamp,
            eventType: log.eventType,
            userId: log.userId,
            payload: log.payload
        });

        // Simplified signature for demonstration
        // In production, use crypto-js or Web Crypto API
        let hash = 0;
        const combined = dataToSign + this.secretKey;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `SIG-${hash.toString(16).toUpperCase()}`;
    }

    /**
     * Verify if a log has been tampered with
     */
    verifyLog(log: AuditLog): boolean {
        if (!log.signature) return false;
        return log.signature === this.generateSignature(log);
    }
}

export const auditService = new AuditService();
