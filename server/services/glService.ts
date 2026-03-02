import { db } from '../db';
import {
    journalEntries,
    journalLines,
    chartOfAccounts,
    costCenters,
    fiscalPeriods,
    paymentMethodAccounts,
    taxAccounts
} from '../../src/db/schema';
import { eq, sql, sum } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export type ReferenceType = 'ORDER' | 'PAYMENT' | 'GRN' | 'WASTE' | 'MANUAL' | 'REFUND' | 'VOID' | 'SHIFT_CLOSE' | 'COGS';

export interface JournalLineInput {
    accountCode?: string;
    accountId?: string;
    costCenterId?: string;
    debit: number;
    credit: number;
    description?: string;
}

export interface JournalEntryInput {
    reference: string;
    referenceType: ReferenceType;
    description: string;
    date?: Date;
    lines: JournalLineInput[];
    createdBy?: string;
    branchId?: string; // Used to derive default cost center if not provided on lines
}

export class GLService {
    /**
     * Core method to post a balanced Journal Entry into the General Ledger.
     */
    static async postJournalEntry(input: JournalEntryInput) {
        return await db.transaction(async (tx) => {
            // 1. Verify Trial Balance Equilibrium
            const totalDebit = input.lines.reduce((acc, line) => acc + (line.debit || 0), 0);
            const totalCredit = input.lines.reduce((acc, line) => acc + (line.credit || 0), 0);

            // Using toFixed(4) to avoid JS float math issues
            if (totalDebit.toFixed(4) !== totalCredit.toFixed(4)) {
                throw new Error(`Double-Entry Violation: Debits (${totalDebit}) must equal Credits (${totalCredit})`);
            }

            // 2. Fetch Open Fiscal Period
            const currentDate = input.date || new Date();
            const periodRows = await tx.select()
                .from(fiscalPeriods)
                .where(sql`${fiscalPeriods.status} = 'OPEN' AND ${fiscalPeriods.startDate} <= ${currentDate} AND ${fiscalPeriods.endDate} >= ${currentDate}`);

            // Let's fallback if no period is set up to prevent blocking production, but log warning
            // Proper ERP would strictly fail here.
            const periodId = periodRows.length > 0 ? periodRows[0].id : null;

            // 3. Resolve Account IDs from Codes if necessary
            for (const line of input.lines) {
                if (!line.accountId && line.accountCode) {
                    const accRow = await tx.select().from(chartOfAccounts).where(eq(chartOfAccounts.code, line.accountCode)).limit(1);
                    if (accRow.length === 0) throw new Error(`GL Account Not Found for code: ${line.accountCode}`);
                    line.accountId = accRow[0].id;
                }
                if (!line.accountId) throw new Error('accountId or accountCode is required for every journal line');
            }

            // 4. Determine Global/Branch Cost Center
            let defaultCostCenterId: string | undefined = undefined;
            if (input.branchId) {
                const head = await tx.select().from(costCenters).where(eq(costCenters.branchId, input.branchId)).limit(1);
                if (head.length > 0) defaultCostCenterId = head[0].id;
            }

            // 5. Insert Entry
            const entryId = randomUUID();
            await tx.insert(journalEntries).values({
                id: entryId,
                date: currentDate,
                reference: input.reference,
                referenceType: input.referenceType,
                description: input.description,
                status: 'POSTED',
                fiscalPeriodId: periodId, // Allows nullable now based on schema fallback
                createdBy: input.createdBy,
            });

            // 6. Insert Lines
            const linesToInsert = input.lines.map((line) => ({
                journalEntryId: entryId,
                accountId: line.accountId!,
                costCenterId: line.costCenterId || defaultCostCenterId,
                debit: line.debit,
                credit: line.credit,
                description: line.description || input.description,
            }));

            await tx.insert(journalLines).values(linesToInsert);

            return { entryId, status: 'POSTED' };
        });
    }

    /**
     * Map Sales (Orders) to GL
     * Expected: Debit Cash/Bank | Credit Sales Revenue | Credit Output VAT
     */
    static async postSalesOrder(orderId: string, subtotal: number, tax: number, paymentMethod: string, amountPaid: number, branchId: string) {
        // Fetch accounts mapping
        // In reality, these should be cached or configured system settings
        const paymentAcc = await db.select().from(paymentMethodAccounts).where(eq(paymentMethodAccounts.paymentMethod, paymentMethod)).limit(1);
        const taxAcc = await db.select().from(taxAccounts).where(eq(taxAccounts.taxType, 'OUTPUT_VAT')).limit(1);
        const revenueAcc = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.code, '4000')).limit(1); // Standard Revenue code

        if (paymentAcc.length === 0 || taxAcc.length === 0 || revenueAcc.length === 0) {
            console.warn('Accounting configuration missing for Sales posting. Skipping GL sync.');
            return;
        }

        const lines: JournalLineInput[] = [
            { accountId: paymentAcc[0].accountId, debit: amountPaid, credit: 0 },
            { accountId: revenueAcc[0].id, debit: 0, credit: subtotal },
            { accountId: taxAcc[0].accountId, debit: 0, credit: tax }
        ];

        return await this.postJournalEntry({
            reference: orderId,
            referenceType: 'ORDER',
            description: `Sales Order #${orderId}`,
            lines,
            branchId
        });
    }

    /**
     * Auto reverse an entry, useful for Voids/Refunds
     */
    static async reverseEntry(originalEntryId: string, reversalReference: string, createdBy?: string) {
        return await db.transaction(async (tx) => {
            const original = await tx.select().from(journalEntries).where(eq(journalEntries.id, originalEntryId)).limit(1);
            if (!original || original.length === 0) throw new Error('Original Journal Entry not found');

            const lines = await tx.select().from(journalLines).where(eq(journalLines.journalEntryId, originalEntryId));

            const newLines: JournalLineInput[] = lines.map(line => ({
                accountId: line.accountId,
                costCenterId: line.costCenterId || undefined,
                debit: line.credit, // SWAPPED
                credit: line.debit, // SWAPPED
                description: `Reversal of Entry #${original[0].entryNumber}`
            }));

            const reversal = await this.postJournalEntry({
                reference: reversalReference,
                referenceType: 'REFUND',
                description: `Reversal of Entry #${original[0].entryNumber}`,
                lines: newLines,
                createdBy,
            });

            // Mark original reversed
            await tx.update(journalEntries).set({ status: 'REVERSED' }).where(eq(journalEntries.id, originalEntryId));

            return reversal;
        });
    }
}
