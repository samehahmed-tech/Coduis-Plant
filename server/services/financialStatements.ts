/**
 * Financial Statements Service
 * Generates: P&L (Income Statement), Balance Sheet, Cash Flow Statement
 * Implements: Section 4 of the ERP Launch Readiness Checklist
 */

import { financeEngine, FinanceAccount, FinanceJournalEntry } from './financeEngine';

// =============================================================================
// Types
// =============================================================================

export interface ProfitAndLossReport {
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
    revenue: {
        items: AccountLineItem[];
        total: number;
    };
    costOfGoodsSold: {
        items: AccountLineItem[];
        total: number;
    };
    grossProfit: number;
    grossMargin: number; // percentage
    operatingExpenses: {
        items: AccountLineItem[];
        total: number;
    };
    operatingIncome: number;
    otherIncome: {
        items: AccountLineItem[];
        total: number;
    };
    otherExpenses: {
        items: AccountLineItem[];
        total: number;
    };
    netIncome: number;
    netMargin: number; // percentage
}

export interface BalanceSheetReport {
    asOfDate: string;
    generatedAt: string;
    assets: {
        current: { items: AccountLineItem[]; total: number };
        nonCurrent: { items: AccountLineItem[]; total: number };
        total: number;
    };
    liabilities: {
        current: { items: AccountLineItem[]; total: number };
        nonCurrent: { items: AccountLineItem[]; total: number };
        total: number;
    };
    equity: {
        items: AccountLineItem[];
        retainedEarnings: number;
        total: number;
    };
    totalLiabilitiesAndEquity: number;
    balanced: boolean;
}

export interface CashFlowReport {
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
    operating: {
        items: CashFlowLineItem[];
        total: number;
    };
    investing: {
        items: CashFlowLineItem[];
        total: number;
    };
    financing: {
        items: CashFlowLineItem[];
        total: number;
    };
    netCashFlow: number;
    openingCashBalance: number;
    closingCashBalance: number;
}

export interface AccountLineItem {
    code: string;
    name: string;
    amount: number;
}

export interface CashFlowLineItem {
    description: string;
    amount: number;
    source?: string;
}

export interface AccountsReceivableSummary {
    totalOutstanding: number;
    current: number;      // 0-30 days
    days30_60: number;
    days60_90: number;
    over90: number;
    customers: ARAPEntry[];
}

export interface AccountsPayableSummary {
    totalOutstanding: number;
    current: number;
    days30_60: number;
    days60_90: number;
    over90: number;
    vendors: ARAPEntry[];
}

export interface ARAPEntry {
    id: string;
    name: string;
    amount: number;
    dueDate?: string;
    agingBucket: 'CURRENT' | '30-60' | '60-90' | 'OVER_90';
    referenceId?: string;
}

// =============================================================================
// Account Code Mappings
// =============================================================================

const ACCOUNT_CODES = {
    // Revenue codes (4xxx)
    REVENUE_PREFIX: '4',
    SALES: '4100',
    OTHER_REVENUE: '4200',
    // COGS codes (51xx)
    COGS_PREFIX: '51',
    INVENTORY_COST: '5110',
    // Operating expense codes (52xx-59xx)
    OPEX_PREFIX_START: '52',
    OPEX_PREFIX_END: '59',
    // Asset codes (1xxx)
    ASSET_PREFIX: '1',
    CASH: '1110',
    INVENTORY_RAW: '1210',
    INVENTORY_FINISHED: '1220',
    ACCOUNTS_RECEIVABLE: '1300',
    // Liability codes (2xxx)
    LIABILITY_PREFIX: '2',
    ACCOUNTS_PAYABLE: '2100',
    VAT_PAYABLE: '2200',
    // Equity codes (3xxx)
    EQUITY_PREFIX: '3',
    OWNER_EQUITY: '3100',
    RETAINED_EARNINGS: '3200',
    // Current asset codes (11xx-13xx)
    CURRENT_ASSET_MAX: '1399',
    // Non-current asset codes (14xx+)
    NON_CURRENT_ASSET_MIN: '1400',
    // Current liability codes (21xx-23xx)
    CURRENT_LIABILITY_MAX: '2399',
};

// =============================================================================
// Helpers
// =============================================================================

function filterJournalByPeriod(journal: FinanceJournalEntry[], start: string, end: string): FinanceJournalEntry[] {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    return journal.filter(j => {
        const d = new Date(j.date);
        return d >= startDate && d <= endDate;
    });
}

function calculateAccountMovement(journal: FinanceJournalEntry[], accountCode: string): number {
    let movement = 0;
    for (const entry of journal) {
        if (entry.debitAccountCode === accountCode) movement += Number(entry.amount || 0);
        if (entry.creditAccountCode === accountCode) movement -= Number(entry.amount || 0);
    }
    return movement;
}

function isAccountInRange(code: string, prefix: string): boolean {
    return code.startsWith(prefix);
}

function isAccountInCodeRange(code: string, min: string, max: string): boolean {
    return code >= min && code <= max;
}

// =============================================================================
// Financial Statements Service
// =============================================================================

export const financialStatements = {

    // =========================================================================
    // Profit & Loss (Income Statement)
    // =========================================================================
    async profitAndLoss(periodStart: string, periodEnd: string): Promise<ProfitAndLossReport> {
        const accounts = await financeEngine.getAccounts();
        const journal = await financeEngine.getJournal();
        const periodJournal = filterJournalByPeriod(journal, periodStart, periodEnd);

        // Revenue: accounts starting with 4
        const revenueAccounts = accounts.filter(a => isAccountInRange(a.code, ACCOUNT_CODES.REVENUE_PREFIX));
        const revenueItems: AccountLineItem[] = revenueAccounts
            .filter(a => !accounts.some(x => x.parentId === a.id)) // leaf accounts only
            .map(a => ({
                code: a.code,
                name: a.name,
                amount: Math.abs(calculateAccountMovement(periodJournal, a.code)),
            }))
            .filter(item => item.amount > 0);
        const totalRevenue = revenueItems.reduce((sum, i) => sum + i.amount, 0);

        // COGS: accounts starting with 51
        const cogsAccounts = accounts.filter(a => isAccountInRange(a.code, ACCOUNT_CODES.COGS_PREFIX));
        const cogsItems: AccountLineItem[] = cogsAccounts
            .filter(a => !accounts.some(x => x.parentId === a.id))
            .map(a => ({
                code: a.code,
                name: a.name,
                amount: Math.abs(calculateAccountMovement(periodJournal, a.code)),
            }))
            .filter(item => item.amount > 0);
        const totalCOGS = cogsItems.reduce((sum, i) => sum + i.amount, 0);

        const grossProfit = totalRevenue - totalCOGS;

        // Operating Expenses: accounts 52xx-59xx
        const opexAccounts = accounts.filter(a =>
            a.type === 'EXPENSE' &&
            !isAccountInRange(a.code, ACCOUNT_CODES.COGS_PREFIX) &&
            isAccountInRange(a.code, '5')
        );
        const opexItems: AccountLineItem[] = opexAccounts
            .filter(a => !accounts.some(x => x.parentId === a.id))
            .map(a => ({
                code: a.code,
                name: a.name,
                amount: Math.abs(calculateAccountMovement(periodJournal, a.code)),
            }))
            .filter(item => item.amount > 0);
        const totalOpex = opexItems.reduce((sum, i) => sum + i.amount, 0);

        const operatingIncome = grossProfit - totalOpex;

        // Other Income: account 4200+
        const otherIncomeAccounts = accounts.filter(a =>
            a.type === 'REVENUE' && a.code >= '4200'
        );
        const otherIncomeItems: AccountLineItem[] = otherIncomeAccounts
            .map(a => ({
                code: a.code,
                name: a.name,
                amount: Math.abs(calculateAccountMovement(periodJournal, a.code)),
            }))
            .filter(item => item.amount > 0);
        const totalOtherIncome = otherIncomeItems.reduce((sum, i) => sum + i.amount, 0);

        // Other Expenses: accounts 6xxx
        const otherExpenseAccounts = accounts.filter(a => isAccountInRange(a.code, '6'));
        const otherExpenseItems: AccountLineItem[] = otherExpenseAccounts
            .map(a => ({
                code: a.code,
                name: a.name,
                amount: Math.abs(calculateAccountMovement(periodJournal, a.code)),
            }))
            .filter(item => item.amount > 0);
        const totalOtherExpenses = otherExpenseItems.reduce((sum, i) => sum + i.amount, 0);

        const netIncome = operatingIncome + totalOtherIncome - totalOtherExpenses;

        return {
            periodStart,
            periodEnd,
            generatedAt: new Date().toISOString(),
            revenue: { items: revenueItems, total: totalRevenue },
            costOfGoodsSold: { items: cogsItems, total: totalCOGS },
            grossProfit,
            grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
            operatingExpenses: { items: opexItems, total: totalOpex },
            operatingIncome,
            otherIncome: { items: otherIncomeItems, total: totalOtherIncome },
            otherExpenses: { items: otherExpenseItems, total: totalOtherExpenses },
            netIncome,
            netMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
        };
    },

    // =========================================================================
    // Balance Sheet
    // =========================================================================
    async balanceSheet(asOfDate?: string): Promise<BalanceSheetReport> {
        const accounts = await financeEngine.getAccounts();
        const journal = await financeEngine.getJournal();

        // Filter journal entries up to the asOfDate
        const effectiveDate = asOfDate || new Date().toISOString().split('T')[0];
        const cutoffDate = new Date(effectiveDate);
        cutoffDate.setHours(23, 59, 59, 999);

        const filteredJournal = journal.filter(j => new Date(j.date) <= cutoffDate);

        // Calculate running balances from journal entries
        const balances: Record<string, number> = {};
        for (const acc of accounts) {
            balances[acc.code] = calculateAccountMovement(filteredJournal, acc.code);
        }

        // Assets
        const assetAccounts = accounts.filter(a => a.type === 'ASSET');
        const currentAssets = assetAccounts
            .filter(a => !accounts.some(x => x.parentId === a.id))
            .filter(a => a.code <= ACCOUNT_CODES.CURRENT_ASSET_MAX)
            .map(a => ({ code: a.code, name: a.name, amount: balances[a.code] || 0 }))
            .filter(i => Math.abs(i.amount) > 0.001);
        const nonCurrentAssets = assetAccounts
            .filter(a => !accounts.some(x => x.parentId === a.id))
            .filter(a => a.code >= ACCOUNT_CODES.NON_CURRENT_ASSET_MIN)
            .map(a => ({ code: a.code, name: a.name, amount: balances[a.code] || 0 }))
            .filter(i => Math.abs(i.amount) > 0.001);

        const totalCurrentAssets = currentAssets.reduce((s, i) => s + i.amount, 0);
        const totalNonCurrentAssets = nonCurrentAssets.reduce((s, i) => s + i.amount, 0);
        const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

        // Liabilities
        const liabilityAccounts = accounts.filter(a => a.type === 'LIABILITY');
        const currentLiabilities = liabilityAccounts
            .filter(a => !accounts.some(x => x.parentId === a.id))
            .filter(a => a.code <= ACCOUNT_CODES.CURRENT_LIABILITY_MAX)
            .map(a => ({ code: a.code, name: a.name, amount: Math.abs(balances[a.code] || 0) }))
            .filter(i => i.amount > 0.001);
        const nonCurrentLiabilities = liabilityAccounts
            .filter(a => !accounts.some(x => x.parentId === a.id))
            .filter(a => a.code > ACCOUNT_CODES.CURRENT_LIABILITY_MAX)
            .map(a => ({ code: a.code, name: a.name, amount: Math.abs(balances[a.code] || 0) }))
            .filter(i => i.amount > 0.001);

        const totalCurrentLiabilities = currentLiabilities.reduce((s, i) => s + i.amount, 0);
        const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce((s, i) => s + i.amount, 0);
        const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

        // Equity
        const equityAccounts = accounts.filter(a => a.type === 'EQUITY');
        const equityItems = equityAccounts
            .filter(a => !accounts.some(x => x.parentId === a.id))
            .map(a => ({ code: a.code, name: a.name, amount: Math.abs(balances[a.code] || 0) }))
            .filter(i => i.amount > 0.001);

        // Retained Earnings = Total Revenue - Total Expenses (all-time up to cutoff)
        const revenueAccounts = accounts.filter(a => a.type === 'REVENUE');
        const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE');
        const totalRevenueAllTime = revenueAccounts.reduce((s, a) => s + Math.abs(balances[a.code] || 0), 0);
        const totalExpensesAllTime = expenseAccounts.reduce((s, a) => s + Math.abs(balances[a.code] || 0), 0);
        const retainedEarnings = totalRevenueAllTime - totalExpensesAllTime;

        const totalEquityItems = equityItems.reduce((s, i) => s + i.amount, 0);
        const totalEquity = totalEquityItems + retainedEarnings;

        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        return {
            asOfDate: effectiveDate,
            generatedAt: new Date().toISOString(),
            assets: {
                current: { items: currentAssets, total: totalCurrentAssets },
                nonCurrent: { items: nonCurrentAssets, total: totalNonCurrentAssets },
                total: totalAssets,
            },
            liabilities: {
                current: { items: currentLiabilities, total: totalCurrentLiabilities },
                nonCurrent: { items: nonCurrentLiabilities, total: totalNonCurrentLiabilities },
                total: totalLiabilities,
            },
            equity: {
                items: equityItems,
                retainedEarnings,
                total: totalEquity,
            },
            totalLiabilitiesAndEquity,
            balanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
        };
    },

    // =========================================================================
    // Cash Flow Statement
    // =========================================================================
    async cashFlowStatement(periodStart: string, periodEnd: string): Promise<CashFlowReport> {
        const accounts = await financeEngine.getAccounts();
        const journal = await financeEngine.getJournal();
        const periodJournal = filterJournalByPeriod(journal, periodStart, periodEnd);

        // Get the P&L for operating activities
        const pnl = await this.profitAndLoss(periodStart, periodEnd);

        // Operating Activities
        const operatingItems: CashFlowLineItem[] = [];

        // Start with net income
        operatingItems.push({ description: 'Net Income', amount: pnl.netIncome, source: 'P&L' });

        // Adjustments for non-cash items
        // Inventory changes (increase in inventory = cash outflow)
        const inventoryChange = calculateAccountMovement(periodJournal, ACCOUNT_CODES.INVENTORY_RAW) +
            calculateAccountMovement(periodJournal, ACCOUNT_CODES.INVENTORY_FINISHED);
        if (Math.abs(inventoryChange) > 0.01) {
            operatingItems.push({
                description: inventoryChange > 0 ? 'Increase in Inventory' : 'Decrease in Inventory',
                amount: -inventoryChange,
                source: 'WORKING_CAPITAL',
            });
        }

        // AR changes (increase in AR = cash outflow)
        const arChange = calculateAccountMovement(periodJournal, ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);
        if (Math.abs(arChange) > 0.01) {
            operatingItems.push({
                description: arChange > 0 ? 'Increase in Accounts Receivable' : 'Decrease in Accounts Receivable',
                amount: -arChange,
                source: 'WORKING_CAPITAL',
            });
        }

        // AP changes (increase in AP = cash inflow)
        const apChange = calculateAccountMovement(periodJournal, ACCOUNT_CODES.ACCOUNTS_PAYABLE);
        if (Math.abs(apChange) > 0.01) {
            operatingItems.push({
                description: apChange < 0 ? 'Increase in Accounts Payable' : 'Decrease in Accounts Payable',
                amount: apChange < 0 ? Math.abs(apChange) : -Math.abs(apChange),
                source: 'WORKING_CAPITAL',
            });
        }

        const totalOperating = operatingItems.reduce((s, i) => s + i.amount, 0);

        // Investing Activities
        const investingItems: CashFlowLineItem[] = [];
        // Look for fixed asset purchases (14xx accounts)
        const fixedAssetAccounts = accounts.filter(a => a.code >= '1400' && a.code < '2000');
        for (const acc of fixedAssetAccounts) {
            const movement = calculateAccountMovement(periodJournal, acc.code);
            if (Math.abs(movement) > 0.01) {
                investingItems.push({
                    description: movement > 0 ? `Purchase of ${acc.name}` : `Sale of ${acc.name}`,
                    amount: -movement,
                    source: 'INVESTING',
                });
            }
        }
        const totalInvesting = investingItems.reduce((s, i) => s + i.amount, 0);

        // Financing Activities
        const financingItems: CashFlowLineItem[] = [];
        // Look for equity and long-term liability changes
        const equityAccounts = accounts.filter(a => a.type === 'EQUITY');
        for (const acc of equityAccounts) {
            const movement = calculateAccountMovement(periodJournal, acc.code);
            if (Math.abs(movement) > 0.01) {
                financingItems.push({
                    description: movement < 0 ? `Capital Contribution (${acc.name})` : `Distribution (${acc.name})`,
                    amount: Math.abs(movement),
                    source: 'FINANCING',
                });
            }
        }
        const totalFinancing = financingItems.reduce((s, i) => s + i.amount, 0);

        const netCashFlow = totalOperating + totalInvesting + totalFinancing;

        // Calculate opening and closing cash balances
        const allJournalBeforePeriod = journal.filter(j => new Date(j.date) < new Date(periodStart));
        const openingCashBalance = calculateAccountMovement(allJournalBeforePeriod, ACCOUNT_CODES.CASH);
        const closingCashBalance = openingCashBalance + netCashFlow;

        return {
            periodStart,
            periodEnd,
            generatedAt: new Date().toISOString(),
            operating: { items: operatingItems, total: totalOperating },
            investing: { items: investingItems, total: totalInvesting },
            financing: { items: financingItems, total: totalFinancing },
            netCashFlow,
            openingCashBalance,
            closingCashBalance,
        };
    },

    // =========================================================================
    // Accounts Receivable Summary
    // =========================================================================
    async accountsReceivable(): Promise<AccountsReceivableSummary> {
        const journal = await financeEngine.getJournal();
        const now = new Date();

        // Find all AR-related journal entries
        const arEntries = journal.filter(j =>
            j.debitAccountCode === ACCOUNT_CODES.ACCOUNTS_RECEIVABLE ||
            j.creditAccountCode === ACCOUNT_CODES.ACCOUNTS_RECEIVABLE
        );

        // Group by reference (customer/order)
        const arByRef: Record<string, { amount: number; date: string; source?: string }> = {};
        for (const entry of arEntries) {
            const ref = entry.referenceId || entry.id;
            if (!arByRef[ref]) arByRef[ref] = { amount: 0, date: entry.date, source: entry.source };
            if (entry.debitAccountCode === ACCOUNT_CODES.ACCOUNTS_RECEIVABLE) {
                arByRef[ref].amount += Number(entry.amount || 0);
            }
            if (entry.creditAccountCode === ACCOUNT_CODES.ACCOUNTS_RECEIVABLE) {
                arByRef[ref].amount -= Number(entry.amount || 0);
            }
        }

        let current = 0, days30_60 = 0, days60_90 = 0, over90 = 0;
        const customers: ARAPEntry[] = [];

        for (const [ref, data] of Object.entries(arByRef)) {
            if (data.amount <= 0.01) continue; // settled
            const daysSince = Math.floor((now.getTime() - new Date(data.date).getTime()) / (1000 * 60 * 60 * 24));
            let bucket: ARAPEntry['agingBucket'] = 'CURRENT';
            if (daysSince <= 30) { current += data.amount; bucket = 'CURRENT'; }
            else if (daysSince <= 60) { days30_60 += data.amount; bucket = '30-60'; }
            else if (daysSince <= 90) { days60_90 += data.amount; bucket = '60-90'; }
            else { over90 += data.amount; bucket = 'OVER_90'; }

            customers.push({
                id: ref,
                name: data.source || ref,
                amount: data.amount,
                agingBucket: bucket,
                referenceId: ref,
            });
        }

        return {
            totalOutstanding: current + days30_60 + days60_90 + over90,
            current,
            days30_60,
            days60_90,
            over90,
            customers: customers.sort((a, b) => b.amount - a.amount),
        };
    },

    // =========================================================================
    // Accounts Payable Summary
    // =========================================================================
    async accountsPayable(): Promise<AccountsPayableSummary> {
        const journal = await financeEngine.getJournal();
        const now = new Date();

        const apEntries = journal.filter(j =>
            j.debitAccountCode === ACCOUNT_CODES.ACCOUNTS_PAYABLE ||
            j.creditAccountCode === ACCOUNT_CODES.ACCOUNTS_PAYABLE
        );

        const apByRef: Record<string, { amount: number; date: string; source?: string }> = {};
        for (const entry of apEntries) {
            const ref = entry.referenceId || entry.id;
            if (!apByRef[ref]) apByRef[ref] = { amount: 0, date: entry.date, source: entry.source };
            if (entry.creditAccountCode === ACCOUNT_CODES.ACCOUNTS_PAYABLE) {
                apByRef[ref].amount += Number(entry.amount || 0);
            }
            if (entry.debitAccountCode === ACCOUNT_CODES.ACCOUNTS_PAYABLE) {
                apByRef[ref].amount -= Number(entry.amount || 0);
            }
        }

        let current = 0, days30_60 = 0, days60_90 = 0, over90 = 0;
        const vendors: ARAPEntry[] = [];

        for (const [ref, data] of Object.entries(apByRef)) {
            if (data.amount <= 0.01) continue;
            const daysSince = Math.floor((now.getTime() - new Date(data.date).getTime()) / (1000 * 60 * 60 * 24));
            let bucket: ARAPEntry['agingBucket'] = 'CURRENT';
            if (daysSince <= 30) { current += data.amount; bucket = 'CURRENT'; }
            else if (daysSince <= 60) { days30_60 += data.amount; bucket = '30-60'; }
            else if (daysSince <= 90) { days60_90 += data.amount; bucket = '60-90'; }
            else { over90 += data.amount; bucket = 'OVER_90'; }

            vendors.push({
                id: ref,
                name: data.source || ref,
                amount: data.amount,
                agingBucket: bucket,
                referenceId: ref,
            });
        }

        return {
            totalOutstanding: current + days30_60 + days60_90 + over90,
            current,
            days30_60,
            days60_90,
            over90,
            vendors: vendors.sort((a, b) => b.amount - a.amount),
        };
    },
};

export default financialStatements;
