import { apiRequest } from './core';

export const opsApi = {
    getRealtimeHealth: () =>
        apiRequest<{
            ok: boolean;
            timestamp: string;
            database: { ok: boolean; latencyMs: number };
            socket: Record<string, any>;
        }>('/ops/realtime-health'),
    getGoLiveSummary: () =>
        apiRequest<{
            ok: boolean;
            generatedAt: string;
            blockers: any;
            launchGates: any;
            uat: any;
            rollback: any;
            evidence: any;
            daily: any;
        }>('/ops/go-live/summary'),
    refreshGoLiveReports: () => apiRequest<{ ok: boolean; blockers: any }>('/ops/go-live/refresh', { method: 'POST' }),
    updateUatSignoffArtifact: (data: any) => apiRequest<{ ok: boolean }>('/ops/go-live/uat-signoff', { method: 'PUT', body: JSON.stringify(data) }),
    updateRollbackDrillArtifact: (data: any) => apiRequest<{ ok: boolean }>('/ops/go-live/rollback-drill', { method: 'PUT', body: JSON.stringify(data) }),
};
