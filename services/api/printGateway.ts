import { apiRequest } from './core';

export const printGatewayApi = {
    getJobs: (params?: { branchId?: string; status?: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; limit?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<{ ok: boolean; stats: { queued: number; processing: number; completed: number; failed: number; total: number }; jobs: any[] }>(`/print-gateway/jobs${query ? `?${query}` : ''}`);
    },
    retryJob: (jobId: string) => apiRequest<{ ok: boolean; job: any }>(`/print-gateway/jobs/${jobId}/retry`, { method: 'POST' }),
    cancelJob: (jobId: string) => apiRequest<{ ok: boolean; job: any }>(`/print-gateway/jobs/${jobId}`, { method: 'DELETE' }),
    purgeJobs: () => apiRequest<{ ok: boolean; purged: number }>('/print-gateway/jobs/purge', { method: 'DELETE' }),
};
