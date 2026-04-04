import { apiRequest } from './core';

export const financeApi = {
    getAccounts: () => apiRequest<any[]>('/finance/accounts'),
    getJournal: (limit?: number) => apiRequest<any[]>(`/finance/journal${limit ? `?limit=${limit}` : ''}`),
    createJournal: (data: { description: string; amount: number; debitAccountCode: string; creditAccountCode: string; referenceId?: string; source?: string; metadata?: any }) =>
        apiRequest<any>('/finance/journal', { method: 'POST', body: JSON.stringify(data) }),
    getTrialBalance: () => apiRequest<{ accounts: any[]; totals: { debit: number; credit: number }; balanced: boolean }>('/finance/trial-balance'),
    getReconciliations: () => apiRequest<any[]>('/finance/reconciliations'),
    createReconciliation: (data: { accountCode: string; statementDate: string; statementBalance: number; notes?: string }) =>
        apiRequest<any>('/finance/reconciliations', { method: 'POST', body: JSON.stringify(data) }),
    resolveReconciliation: (id: string, data?: { adjustWithJournal?: boolean; adjustmentAccountCode?: string; notes?: string }) =>
        apiRequest<any>(`/finance/reconciliations/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data || {}) }),
    getPeriodCloses: () => apiRequest<any[]>('/finance/period-closes'),
    closePeriod: (data: { periodStart: string; periodEnd: string }) =>
        apiRequest<any>('/finance/period-close', { method: 'POST', body: JSON.stringify(data) }),
    getProfitAndLoss: (params?: { start?: string; end?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any>(`/finance/statements/pnl${query ? `?${query}` : ''}`);
    },
    getBalanceSheet: (date?: string) =>
        apiRequest<any>(`/finance/statements/balance-sheet${date ? `?date=${date}` : ''}`),
    getCashFlow: (params?: { start?: string; end?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any>(`/finance/statements/cash-flow${query ? `?${query}` : ''}`);
    },
    getAccountsReceivable: () => apiRequest<any>('/finance/statements/ar'),
    getAccountsPayable: () => apiRequest<any>('/finance/statements/ap'),
};
