import { financeEngine } from './financeEngine';

export const postPosOrderEntry = async (data: { orderId: string; amount: number; branchId?: string; userId?: string }) => {
    const amount = Number(data.amount || 0);
    if (amount <= 0) return;
    await financeEngine.postDoubleEntry({
        description: `POS Order ${data.orderId}`,
        amount,
        debitAccountCode: '1110',
        creditAccountCode: '4100',
        referenceId: data.orderId,
        source: 'POS_ORDER',
        metadata: { branchId: data.branchId },
        updatedBy: data.userId || 'system',
    });
};

export const postPurchaseReceiptEntry = async (data: { poId: string; amount: number; branchId?: string; userId?: string }) => {
    const amount = Number(data.amount || 0);
    if (amount <= 0) return;
    await financeEngine.postDoubleEntry({
        description: `PO Receipt ${data.poId}`,
        amount,
        debitAccountCode: '1210',
        creditAccountCode: '2100',
        referenceId: data.poId,
        source: 'PO_RECEIPT',
        metadata: { branchId: data.branchId },
        updatedBy: data.userId || 'system',
    });
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
    await financeEngine.postDoubleEntry({
        description: `Wastage ${data.referenceId}`,
        amount,
        debitAccountCode: '5110',
        creditAccountCode: '1210',
        referenceId: data.referenceId,
        source: 'WASTAGE',
        metadata: { branchId: data.branchId, reason: data.reason || null },
        updatedBy: data.userId || 'system',
    });
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
