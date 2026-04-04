import { apiRequest } from './core';

export const setupApi = {
    status: () => apiRequest<{ needsSetup: boolean }>('/setup/status'),
    bootstrap: (payload: any) => apiRequest<{ ok: boolean }>('/setup/bootstrap', { method: 'POST', body: JSON.stringify(payload) }),
};
