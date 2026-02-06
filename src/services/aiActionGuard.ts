import { AppPermission, AuditEventType } from '../../types';

export type AIAction =
    | { type: 'UPDATE_INVENTORY'; itemId: string; data: any }
    | { type: 'UPDATE_MENU_ITEM'; itemId: string; data: any }
    | { type: 'UPDATE_MENU_PRICE'; itemId: string; price: number }
    | { type: 'CREATE_MENU_ITEM'; categoryId: string; data: any }
    | { type: 'ANALYZE_MENU' }
    | { type: 'ANALYZE_INVENTORY' }
    | { type: 'CREATE_CUSTOMER'; data: any }
    | { type: 'SHOW_REPORT' }
    | { type: string; [key: string]: any };

export interface GuardedAIAction {
    id: string;
    action: AIAction;
    label: string;
    permission?: AppPermission;
    canExecute: boolean;
    reason?: string;
    before?: any;
    after?: any;
    auditType: AuditEventType;
}

export const getActionPermission = (action: AIAction): AppPermission | undefined => {
    switch (action.type) {
        case 'UPDATE_INVENTORY':
            return AppPermission.OP_ADJUST_STOCK;
        case 'UPDATE_MENU_ITEM':
        case 'UPDATE_MENU_PRICE':
        case 'CREATE_MENU_ITEM':
            return AppPermission.CFG_EDIT_MENU_PRICING;
        case 'CREATE_CUSTOMER':
            return AppPermission.NAV_CRM;
        case 'SHOW_REPORT':
        case 'ANALYZE_MENU':
        case 'ANALYZE_INVENTORY':
            return AppPermission.NAV_REPORTS;
        default:
            return undefined;
    }
};

export const guardAction = (action: AIAction, context: {
    inventory: any[];
    menuItems: any[];
    categories: any[];
}): GuardedAIAction => {
    const permission = getActionPermission(action);
    const id = `AI-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    switch (action.type) {
        case 'UPDATE_INVENTORY': {
            const item = context.inventory.find(i => i.id === action.itemId);
            if (!item) {
                return {
                    id,
                    action,
                    label: `Update inventory item ${action.itemId}`,
                    permission,
                    canExecute: false,
                    reason: 'Item not found',
                    auditType: AuditEventType.INVENTORY_ADJUSTMENT,
                };
            }
            return {
                id,
                action,
                label: `Update inventory: ${item.name || action.itemId}`,
                permission,
                canExecute: true,
                before: item,
                after: { ...item, ...action.data },
                auditType: AuditEventType.INVENTORY_ADJUSTMENT,
            };
        }
        case 'UPDATE_MENU_ITEM': {
            const item = context.menuItems.find(i => i.id === action.itemId);
            if (!item) {
                return {
                    id,
                    action,
                    label: `Update menu item ${action.itemId}`,
                    permission,
                    canExecute: false,
                    reason: 'Item not found',
                    auditType: AuditEventType.SETTINGS_CHANGE,
                };
            }
            return {
                id,
                action,
                label: `Update menu item: ${item.name || action.itemId}`,
                permission,
                canExecute: true,
                before: item,
                after: { ...item, ...action.data },
                auditType: AuditEventType.SETTINGS_CHANGE,
            };
        }
        case 'UPDATE_MENU_PRICE': {
            const item = context.menuItems.find(i => i.id === action.itemId);
            if (!item) {
                return {
                    id,
                    action,
                    label: `Update price for ${action.itemId}`,
                    permission,
                    canExecute: false,
                    reason: 'Item not found',
                    auditType: AuditEventType.SETTINGS_CHANGE,
                };
            }
            return {
                id,
                action,
                label: `Update price: ${item.name || action.itemId}`,
                permission,
                canExecute: true,
                before: item,
                after: { ...item, price: action.price },
                auditType: AuditEventType.SETTINGS_CHANGE,
            };
        }
        case 'CREATE_MENU_ITEM': {
            return {
                id,
                action,
                label: `Create menu item: ${action.data?.name || 'New item'}`,
                permission,
                canExecute: true,
                before: null,
                after: { ...action.data, categoryId: action.categoryId },
                auditType: AuditEventType.SETTINGS_CHANGE,
            };
        }
        case 'CREATE_CUSTOMER': {
            return {
                id,
                action,
                label: `Create customer: ${action.data?.name || 'New customer'}`,
                permission,
                canExecute: true,
                before: null,
                after: { ...action.data },
                auditType: AuditEventType.ACCOUNTING_ADJUSTMENT,
            };
        }
        case 'ANALYZE_MENU': {
            return {
                id,
                action,
                label: 'Analyze menu performance',
                permission,
                canExecute: true,
                auditType: AuditEventType.AI_INSIGHT_GENERATED,
            };
        }
        case 'ANALYZE_INVENTORY': {
            return {
                id,
                action,
                label: 'Analyze inventory forecast',
                permission,
                canExecute: true,
                auditType: AuditEventType.AI_INSIGHT_GENERATED,
            };
        }
        case 'SHOW_REPORT': {
            return {
                id,
                action,
                label: 'Open reports view',
                permission,
                canExecute: true,
                auditType: AuditEventType.SETTINGS_CHANGE,
            };
        }
        default:
            return {
                id,
                action,
                label: `Unknown action: ${action.type}`,
                permission,
                canExecute: false,
                reason: 'Unsupported action type',
                auditType: AuditEventType.SETTINGS_CHANGE,
            };
    }
};
