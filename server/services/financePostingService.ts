import { financeEngine } from './financeEngine';
import { GLService } from './glService';
import { db } from '../db';
import { orders, paymentMethodAccounts, taxAccounts, chartOfAccounts } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
export const postPosOrderEntry = async (data: { orderId: string; amount: number; branchId?: string; userId?: string }) => {
    try {
        const [order] = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);
        if (!order) return;

        await GLService.postSalesOrder(
            order.id,
            order.subtotal || 0,
            order.tax || 0,
            order.paymentMethod || 'CASH',
            data.amount,
            order.branchId
        );
    } catch (err) {
        console.error('GL Sync Failed (POS_ORDER):', err);
    }
};

export const postPurchaseReceiptEntry = async (data: { poId: string; amount: number; branchId?: string; userId?: string }) => {
    const amount = Number(data.amount || 0);
    if (amount <= 0) return;
    try {
        await GLService.postJournalEntry({
            reference: data.poId,
            referenceType: 'GRN',
            description: `PO Receipt ${data.poId}`,
            createdBy: data.userId || 'system',
            branchId: data.branchId,
            lines: [
                { accountCode: '1210', debit: amount, credit: 0 }, // Inventory Asset
                { accountCode: '2100', debit: 0, credit: amount }, // Accounts Payable
            ]
        });
    } catch (err) {
        console.error('GL Sync Failed (PO_RECEIPT):', err);
    }
};

export const postInventoryAdjustmentEntry = async (data: {
    referenceId: string;
    amount: number;
    branchId?: string;
    userId?: string;
    reason?: string;
}) => {
    const amount = Number(data.amount || 0);
    if (amount <= 0) return;
    await financeEngine.postDoubleEntry({
        description: `Inventory Adjustment ${data.referenceId}`,
        amount,
        debitAccountCode: '5110',
        creditAccountCode: '1210',
        referenceId: data.referenceId,
        source: 'INVENTORY_ADJUSTMENT',
        metadata: { branchId: data.branchId, reason: data.reason || null },
        updatedBy: data.userId || 'system',
    });
};

export const postInventoryAdjustmentReversalEntry = async (data: {
    referenceId: string;
    amount: number;
    branchId?: string;
    userId?: string;
    reason?: string;
}) => {
    const amount = Number(data.amount || 0);
    if (amount <= 0) return;
    await financeEngine.postDoubleEntry({
        description: `Inventory Adjustment Reversal ${data.referenceId}`,
        amount,
        debitAccountCode: '1210',
        creditAccountCode: '5110',
        referenceId: data.referenceId,
        source: 'INVENTORY_ADJUSTMENT_REVERSAL',
        metadata: { branchId: data.branchId, reason: data.reason || null },
        updatedBy: data.userId || 'system',
    });
};

export const postWastageEntry = async (data: { referenceId: string; amount: number; branchId?: string; userId?: string; reason?: string }) => {
    const amount = Number(data.amount || 0);
    if (amount <= 0) return;
    try {
        await GLService.postJournalEntry({
            reference: data.referenceId,
            referenceType: 'WASTE',
            description: `Wastage: ${data.reason || data.referenceId}`,
            createdBy: data.userId || 'system',
            branchId: data.branchId,
            lines: [
                { accountCode: '5110', debit: amount, credit: 0 }, // Wastage Expense
                { accountCode: '1210', debit: 0, credit: amount }, // Inventory Asset
            ]
        });
    } catch (err) {
        console.error('GL Sync Failed (WASTAGE):', err);
    }
};

export const postProductionCompletionEntry = async (data: {
    productionOrderId: string;
    amount: number;
    branchId?: string;
    userId?: string;
}) => {
    const amount = Number(data.amount || 0);
    if (amount <= 0) return;
    await financeEngine.postDoubleEntry({
        description: `Production Completion ${data.productionOrderId}`,
        amount,
        debitAccountCode: '1220',
        creditAccountCode: '1210',
        referenceId: data.productionOrderId,
        source: 'PRODUCTION_COMPLETION',
        metadata: { branchId: data.branchId },
        updatedBy: data.userId || 'system',
    });
};
