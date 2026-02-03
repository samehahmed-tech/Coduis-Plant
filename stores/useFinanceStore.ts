import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FinancialAccount, JournalEntry, AccountType } from '../types';

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
    recordTransaction: (tx: Omit<JournalEntry, 'id'>) => void;
    setShift: (shift: Shift | null) => void;
    setIsCloseShiftModalOpen: (isOpen: boolean) => void;
}

const INITIAL_ACCOUNTS: FinancialAccount[] = [
    // ... (rest of INITIAL_ACCOUNTS remains same)
    {
        id: '1', code: '1000', name: 'Assets', type: AccountType.ASSET, balance: 0, children: [
            {
                id: '1-1', code: '1100', name: 'Cash & Cash Equivalents', type: AccountType.ASSET, balance: 0, children: [
                    { id: '1-1-1', code: '1110', name: 'Cashier Main', type: AccountType.ASSET, balance: 0 },
                ]
            },
            {
                id: '1-2', code: '1200', name: 'Inventory Stock', type: AccountType.ASSET, balance: 0, children: [
                    { id: '1-2-1', code: '1210', name: 'Raw Materials', type: AccountType.ASSET, balance: 0 },
                ]
            },
        ]
    },
    {
        id: '2', code: '2000', name: 'Liabilities', type: AccountType.LIABILITY, balance: 0, children: [
            { id: '2-1', code: '2100', name: 'Accounts Payable', type: AccountType.LIABILITY, balance: 0 },
        ]
    },
    {
        id: '4', code: '4000', name: 'Revenue', type: AccountType.REVENUE, balance: 0, children: [
            { id: '4-1', code: '4100', name: 'Sales', type: AccountType.REVENUE, balance: 0 },
        ]
    },
    {
        id: '5', code: '5000', name: 'Expenses', type: AccountType.EXPENSE, balance: 0, children: [
            {
                id: '5-1', code: '5100', name: 'Direct Costs (COGS)', type: AccountType.EXPENSE, balance: 0, children: [
                    { id: '5-1-1', code: '5110', name: 'Inventory Cost', type: AccountType.EXPENSE, balance: 0 },
                ]
            },
        ]
    },
];

export const useFinanceStore = create<FinanceState>()(
    persist(
        (set) => ({
            accounts: INITIAL_ACCOUNTS,
            transactions: [],
            activeShift: null,
            isCloseShiftModalOpen: false,

            setShift: (shift) => set({ activeShift: shift }),
            setIsCloseShiftModalOpen: (isOpen) => set({ isCloseShiftModalOpen: isOpen }),

            recordTransaction: (tx) => set((state) => {
                const newTx = { ...tx, id: Math.random().toString(36).substr(2, 9).toUpperCase() };

                const updateBalance = (accs: FinancialAccount[]): FinancialAccount[] => {
                    return accs.map(acc => {
                        let newBalance = acc.balance;
                        if (acc.id === tx.debitAccountId) newBalance += tx.amount;
                        if (acc.id === tx.creditAccountId) newBalance -= tx.amount;
                        return {
                            ...acc,
                            balance: newBalance,
                            children: acc.children ? updateBalance(acc.children) : undefined
                        };
                    });
                };

                return {
                    transactions: [newTx, ...state.transactions],
                    accounts: updateBalance(state.accounts)
                };
            })
        }),
        {
            name: 'finance-storage'
        }
    )
);
