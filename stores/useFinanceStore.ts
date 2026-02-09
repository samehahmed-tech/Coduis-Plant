import { create } from 'zustand';
import { FinancialAccount, JournalEntry } from '../types';
import { financeApi } from '../services/api';

interface Shift {
    id: string;
    branchId: string;
    userId: string;
    status: 'OPEN' | 'CLOSED';
    openingBalance: number;
    openingTime: string;
    expectedBalance?: number;
    actualBalance?: number;
}

interface FinanceState {
    accounts: FinancialAccount[];
    transactions: JournalEntry[];
    activeShift: Shift | null;
    isCloseShiftModalOpen: boolean;
    isLoading: boolean;
    error: string | null;
    trialBalance: { debit: number; credit: number; balanced: boolean } | null;
    reconciliations: any[];
    periodCloses: any[];

    fetchFinanceData: () => Promise<void>;
    recordTransaction: (tx: Omit<JournalEntry, 'id'>) => Promise<void>;
    createReconciliation: (payload: { accountCode: string; statementDate: string; statementBalance: number; notes?: string }) => Promise<void>;
    resolveReconciliation: (id: string, payload?: { adjustWithJournal?: boolean; adjustmentAccountCode?: string; notes?: string }) => Promise<void>;
    closePeriod: (payload: { periodStart: string; periodEnd: string }) => Promise<void>;
    setShift: (shift: Shift | null) => void;
    setIsCloseShiftModalOpen: (isOpen: boolean) => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    accounts: [],
    transactions: [],
    activeShift: null,
    isCloseShiftModalOpen: false,
    isLoading: false,
    error: null,
    trialBalance: null,
    reconciliations: [],
    periodCloses: [],

    setShift: (shift) => set({ activeShift: shift }),
    setIsCloseShiftModalOpen: (isOpen) => set({ isCloseShiftModalOpen: isOpen }),

    fetchFinanceData: async () => {
        set({ isLoading: true, error: null });
        try {
            const [recsData, periodsData, accData, jrnData, tbData] = await Promise.all([
                financeApi.getReconciliations(),
                financeApi.getPeriodCloses(),
                financeApi.getAccounts(),
                financeApi.getJournal(200),
                financeApi.getTrialBalance(),
            ]);

            const mappedAccounts: FinancialAccount[] = accData.map((a: any) => ({
                id: a.id,
                code: a.code,
                name: a.name,
                type: a.type,
                balance: Number(a.balance || 0),
                parentId: a.parentId,
            }));

            // Convert flat accounts to tree for current finance UI component
            const byId = new Map(mappedAccounts.map(a => [a.id, { ...a, children: [] as FinancialAccount[] }]));
            const roots: FinancialAccount[] = [];
            byId.forEach(acc => {
                if (acc.parentId && byId.has(acc.parentId)) {
                    byId.get(acc.parentId)!.children!.push(acc);
                } else {
                    roots.push(acc);
                }
            });

            const mappedJournal: JournalEntry[] = jrnData.map((j: any) => ({
                id: j.id,
                date: new Date(j.date),
                description: j.description,
                debitAccountId: j.debitAccountCode,
                creditAccountId: j.creditAccountCode,
                amount: Number(j.amount || 0),
                referenceId: j.referenceId,
            }));

            set({
                accounts: roots,
                transactions: mappedJournal,
                trialBalance: {
                    debit: Number(tbData.totals?.debit || 0),
                    credit: Number(tbData.totals?.credit || 0),
                    balanced: Boolean(tbData.balanced),
                },
                reconciliations: recsData,
                periodCloses: periodsData,
                isLoading: false,
            });
        } catch (error: any) {
            set({ isLoading: false, error: error.message });
        }
    },

    recordTransaction: async (tx) => {
        try {
            await financeApi.createJournal({
                description: tx.description,
                amount: tx.amount,
                debitAccountCode: tx.debitAccountId,
                creditAccountCode: tx.creditAccountId,
                referenceId: tx.referenceId,
                source: 'MANUAL',
            });
            await get().fetchFinanceData();
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    createReconciliation: async (payload) => {
        try {
            await financeApi.createReconciliation(payload);
            await get().fetchFinanceData();
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    resolveReconciliation: async (id, payload) => {
        try {
            await financeApi.resolveReconciliation(id, payload);
            await get().fetchFinanceData();
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    closePeriod: async (payload) => {
        try {
            await financeApi.closePeriod(payload);
            await get().fetchFinanceData();
        } catch (error: any) {
            set({ error: error.message });
        }
    },
}));
