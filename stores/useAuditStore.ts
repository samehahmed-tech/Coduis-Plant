
import { create } from 'zustand';
import { AuditLog, AuditEventType } from '../types';

interface AuditState {
    logs: AuditLog[];
    addLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
    clearLogs: () => void;
}

const INITIAL_LOGS: AuditLog[] = [
    {
        id: 'LOG-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        userName: 'Super Admin',
        userRole: 'SUPER_ADMIN' as any,
        userId: 'u1',
        eventType: AuditEventType.SECURITY_PERMISSION_CHANGE,
        deviceId: 'SYS-MAIN-01',
        branchId: 'b1',
        payload: { after: { permission: 'NAV_FINANCE', targetUser: 'Cashier One' } }
    },
    {
        id: 'LOG-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        userName: 'Branch Manager',
        userRole: 'MANAGER' as any,
        userId: 'u2',
        eventType: AuditEventType.POS_VOID,
        deviceId: 'POS-TERM-02',
        branchId: 'b1',
        payload: { before: { total: 450.00 }, reason: 'Customer changed mind' }
    },
    {
        id: 'LOG-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        userName: 'Super Admin',
        userRole: 'SUPER_ADMIN' as any,
        userId: 'u1',
        eventType: AuditEventType.PO_STATUS_CHANGE,
        deviceId: 'SYS-MAIN-01',
        branchId: 'b1',
        payload: { before: 'PENDING', after: 'RECEIVED', poId: 'PO-882' }
    }
];

export const useAuditStore = create<AuditState>((set) => ({
    logs: INITIAL_LOGS,
    addLog: (log) => set((state) => ({
        logs: [{
            ...log,
            id: 'LOG-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            timestamp: new Date()
        }, ...state.logs]
    })),
    clearLogs: () => set({ logs: [] })
}));
