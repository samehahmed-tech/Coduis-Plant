type StatusCheckInput = {
    currentStatus: string;
    nextStatus: string;
    notes?: string;
    userRole?: string;
    userBranchId?: string | null;
    orderBranchId?: string | null;
};

const TRANSITION_MAP: Record<string, string[]> = {
    PENDING: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'COMPLETED', 'CANCELLED'],
    DELIVERED: [],
    COMPLETED: [],
    CANCELLED: [],
};

const HIGH_RISK_ROLES = new Set(['SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER']);

export const evaluateOrderStatusUpdate = (input: StatusCheckInput): { ok: boolean; code?: string } => {
    const current = String(input.currentStatus || '').toUpperCase();
    const next = String(input.nextStatus || '').toUpperCase();
    const role = String(input.userRole || '').toUpperCase();
    const userBranch = input.userBranchId ? String(input.userBranchId) : null;
    const orderBranch = input.orderBranchId ? String(input.orderBranchId) : null;

    if (!next) return { ok: false, code: 'STATUS_REQUIRED' };
    if (current === next) return { ok: true };

    if (role !== 'SUPER_ADMIN' && userBranch && orderBranch && userBranch !== orderBranch) {
        return { ok: false, code: 'FORBIDDEN_BRANCH_SCOPE' };
    }

    const allowed = TRANSITION_MAP[current];
    if (!allowed || !allowed.includes(next)) {
        return { ok: false, code: 'INVALID_STATUS_TRANSITION' };
    }

    if (next === 'CANCELLED' && !HIGH_RISK_ROLES.has(role)) {
        return { ok: false, code: 'STATUS_TRANSITION_FORBIDDEN' };
    }
    if (next === 'CANCELLED' && !String(input.notes || '').trim()) {
        return { ok: false, code: 'CANCELLATION_REASON_REQUIRED' };
    }

    return { ok: true };
};
