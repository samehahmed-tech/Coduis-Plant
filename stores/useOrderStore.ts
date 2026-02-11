// Order Store - Connected to Database API (Production Ready)
import { create } from 'zustand';
import { Order, OrderType, OrderItem, OrderStatus, Table, TableStatus, AuditEventType, FloorZone } from '../types';
import { ordersApi, tablesApi } from '../services/api';
import { localDb } from '../db/localDb';
import { syncService } from '../services/syncService';

interface HeldOrder {
    id: string;
    cart: OrderItem[];
    tableId?: string;
    customerId?: string;
    customerName?: string;
    timestamp: Date;
    notes?: string;
}

interface OrderState {
    orders: Order[];
    activeOrderType: OrderType;
    heldOrders: HeldOrder[];
    activeCart: OrderItem[];
    tableDrafts: Record<string, { cart: OrderItem[]; discount: number; updatedAt: number }>;
    tables: Table[];
    zones: FloorZone[];
    isLoading: boolean;
    error: string | null;

    // POS State
    discount: number;
    activeCoupon: string | null;
    recalledOrder: HeldOrder | null;

    // Async Actions (API)
    fetchOrders: (params?: { status?: string; branch_id?: string; date?: string; limit?: number }) => Promise<void>;
    placeOrder: (order: Order) => Promise<Order>;
    updateOrderStatus: (orderId: string, status: OrderStatus, changedBy?: string) => Promise<void>;

    fetchTables: (branchId: string) => Promise<void>;
    updateTableStatus: (tableId: string, status: TableStatus) => Promise<void>;

    // Local Actions
    setOrderMode: (mode: OrderType) => void;
    addToCart: (item: OrderItem) => void;
    removeFromCart: (itemId: string) => void;
    updateCartItemQuantity: (itemId: string, delta: number) => void;
    updateCartItemNotes: (itemId: string, notes: string) => void;
    clearCart: () => void;
    saveTableDraft: (tableId: string, cart: OrderItem[], discount: number) => void;
    loadTableDraft: (tableId: string) => void;
    clearTableDraft: (tableId: string) => void;
    setDiscount: (amount: number) => void;
    applyCoupon: (payload: { code: string; branchId?: string; orderType: OrderType; subtotal: number; customerId?: string }) => Promise<void>;
    clearCoupon: () => void;
    holdOrder: (order: HeldOrder) => void;
    recallOrder: (index: number) => void;
    clearRecalledOrder: () => void;
    updateTables: (tables: Table[]) => void;
    updateTable: (id: string, updates: Partial<Table>) => void;
    updateZones: (zones: FloorZone[]) => void;
    clearError: () => void;

    // Advanced Table Management
    transferTable: (sourceTableId: string, targetTableId: string) => Promise<void>;
    transferItems: (sourceTableId: string, targetTableId: string, itemCartIds: string[]) => Promise<void>;
    splitTable: (originalTableId: string, targetTableId: string, itemCartIds: string[]) => Promise<void>;
    loadTableOrder: (tableId: string) => void;
}

// Empty tables - should be configured in settings
const INITIAL_TABLES: Table[] = [];
const INITIAL_ZONES: FloorZone[] = [
    { id: 'MAIN', name: 'Main Hall', color: 'bg-indigo-600', width: 1600, height: 1200 }
];
import { persist } from 'zustand/middleware';
import { eventBus } from '../services/eventBus';

export const useOrderStore = create<OrderState>()(
    persist(
        (set, get) => ({
            orders: [], // Empty - loads from database
            activeOrderType: OrderType.DINE_IN,
            heldOrders: [],
            activeCart: [],
            tableDrafts: {},
            tables: INITIAL_TABLES,
            zones: INITIAL_ZONES,
            discount: 0,
            activeCoupon: null,
            recalledOrder: null,
            isLoading: false,
            error: null,

            // ============ API Actions ============

            fetchOrders: async (params) => {
                set({ isLoading: true, error: null });
                try {
                    if (navigator.onLine) {
                        const data = await ordersApi.getAll(params);
                        const orders = data.map((o: any) => ({
                            id: o.id,
                            orderNumber: o.order_number || o.orderNumber,
                            type: o.type as OrderType,
                            branchId: o.branch_id || o.branchId,
                            tableId: o.table_id || o.tableId,
                            customerId: o.customer_id || o.customerId,
                            customerName: o.customer_name || o.customerName,
                            customerPhone: o.customer_phone || o.customerPhone,
                            deliveryAddress: o.delivery_address || o.deliveryAddress,
                            isCallCenterOrder: o.is_call_center_order || o.isCallCenterOrder,
                            items: (o.items || []).map((item: any, index: number) => ({
                                ...item,
                                cartId: item.cartId || item.id || `${o.id}-${index}`,
                                selectedModifiers: item.selectedModifiers || item.modifiers || [],
                            })),
                            status: o.status as OrderStatus,
                            subtotal: o.subtotal,
                            tax: o.tax,
                            total: o.total,
                            discount: o.discount,
                            freeDelivery: o.free_delivery,
                            isUrgent: o.is_urgent,
                            paymentMethod: o.payment_method,
                            notes: o.notes,
                            kitchenNotes: o.kitchen_notes || o.kitchenNotes,
                            deliveryNotes: o.delivery_notes || o.deliveryNotes,
                            createdAt: new Date(o.created_at || o.createdAt),
                            updatedAt: o.updated_at ? new Date(o.updated_at) : (o.updatedAt ? new Date(o.updatedAt) : undefined),
                            syncStatus: o.sync_status || 'SYNCED'
                        }));
                        set({ orders, isLoading: false });
                        await localDb.orders.bulkPut(orders as any[]);
                    } else {
                        const cached = await localDb.orders.toArray();
                        set({ orders: cached as Order[], isLoading: false });
                    }
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    console.error('Failed to fetch orders:', error);
                }
            },

            fetchTables: async (branchId: string) => {
                set({ isLoading: true });
                try {
                    if (navigator.onLine) {
                        const rawTables = await tablesApi.getAll(branchId);
                        const rawZones = await tablesApi.getZones(branchId);
                        const tables = rawTables.map((t: any) => ({
                            ...t,
                            position: {
                                x: t.position?.x ?? t.x ?? 0,
                                y: t.position?.y ?? t.y ?? 0
                            },
                            width: t.width ?? 100,
                            height: t.height ?? 100,
                            zoneId: t.zoneId ?? t.zone_id
                        }));
                        const zones = rawZones.map((z: any) => ({
                            ...z,
                            width: z.width ?? 1600,
                            height: z.height ?? 1200
                        }));
                        // Map or validate data if needed
                        console.log('Fetched tables:', tables);
                        set({ tables, zones, isLoading: false });
                        await localDb.floorTables.bulkPut(tables.map((t: any) => ({ ...t, branchId, x: t.position?.x ?? t.x ?? 0, y: t.position?.y ?? t.y ?? 0 })));
                        await localDb.floorZones.bulkPut(zones.map((z: any) => ({ ...z, branchId })));
                    } else {
                        const tables = (await localDb.floorTables.where('branchId').equals(branchId).toArray())
                            .map((t: any) => ({
                                ...t,
                                position: {
                                    x: t.position?.x ?? t.x ?? 0,
                                    y: t.position?.y ?? t.y ?? 0
                                },
                                width: t.width ?? 100,
                                height: t.height ?? 100
                            }));
                        const zones = await localDb.floorZones.where('branchId').equals(branchId).toArray();
                        set({ tables, zones, isLoading: false });
                    }
                } catch (error: any) {
                    console.error('Failed to fetch tables:', error);
                    set({ error: error.message, isLoading: false });
                }
            },

            placeOrder: async (order) => {
                set({ isLoading: true, error: null });
                try {
                    const payload = {
                        id: order.id,
                        type: order.type,
                        source: order.isCallCenterOrder ? 'call_center' : 'pos',
                        branch_id: order.branchId,
                        table_id: order.tableId,
                        customer_id: order.customerId,
                        customer_name: order.customerName,
                        customer_phone: order.customerPhone,
                        delivery_address: order.deliveryAddress,
                        is_call_center_order: order.isCallCenterOrder,
                        status: order.status || 'PENDING',
                        subtotal: order.subtotal,
                        discount: order.discount,
                        tax: order.tax,
                        total: order.total,
                        free_delivery: order.freeDelivery,
                        is_urgent: order.isUrgent,
                        payment_method: order.paymentMethod,
                        payments: order.payments,
                        notes: order.notes,
                        kitchen_notes: order.kitchenNotes,
                        items: order.items.map(item => ({
                            menu_item_id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            notes: item.notes,
                            modifiers: item.selectedModifiers,
                        }))
                    };

                    let savedOrder: any = order;

                    if (navigator.onLine) {
                        savedOrder = await ordersApi.create(payload);
                    } else {
                        await syncService.queue('order', 'CREATE', payload);
                        savedOrder = { ...order, syncStatus: 'PENDING' };
                    }

                    const normalizedOrder: Order = {
                        id: savedOrder.id,
                        orderNumber: savedOrder.order_number || savedOrder.orderNumber || order.orderNumber,
                        type: savedOrder.type || order.type,
                        branchId: savedOrder.branch_id || savedOrder.branchId || order.branchId,
                        tableId: savedOrder.table_id || savedOrder.tableId || order.tableId,
                        customerId: savedOrder.customer_id || savedOrder.customerId || order.customerId,
                        customerName: savedOrder.customer_name || savedOrder.customerName || order.customerName,
                        customerPhone: savedOrder.customer_phone || savedOrder.customerPhone || order.customerPhone,
                        deliveryAddress: savedOrder.delivery_address || savedOrder.deliveryAddress || order.deliveryAddress,
                        isCallCenterOrder: savedOrder.is_call_center_order || savedOrder.isCallCenterOrder || order.isCallCenterOrder,
                        items: savedOrder.items || order.items || [],
                        status: savedOrder.status || order.status,
                        subtotal: savedOrder.subtotal ?? order.subtotal,
                        tax: savedOrder.tax ?? order.tax,
                        total: savedOrder.total ?? order.total,
                        discount: savedOrder.discount ?? order.discount,
                        freeDelivery: savedOrder.free_delivery ?? order.freeDelivery,
                        isUrgent: savedOrder.is_urgent ?? order.isUrgent,
                        paymentMethod: savedOrder.payment_method ?? order.paymentMethod,
                        payments: savedOrder.payments ?? order.payments,
                        notes: savedOrder.notes ?? order.notes,
                        kitchenNotes: savedOrder.kitchen_notes ?? savedOrder.kitchenNotes ?? order.kitchenNotes,
                        deliveryNotes: savedOrder.delivery_notes ?? savedOrder.deliveryNotes ?? order.deliveryNotes,
                        createdAt: new Date(savedOrder.created_at || savedOrder.createdAt || new Date()),
                        updatedAt: savedOrder.updated_at ? new Date(savedOrder.updated_at) : (savedOrder.updatedAt ? new Date(savedOrder.updatedAt) : undefined),
                        syncStatus: savedOrder.sync_status || savedOrder.syncStatus || 'SYNCED'
                    };

                    // Emit event for other systems (Inventory, Audit, etc.)
                    eventBus.emit(AuditEventType.POS_ORDER_PLACEMENT, {
                        order: normalizedOrder,
                        timestamp: new Date()
                    });

                    // Update local state
                    set((state) => ({
                        orders: [normalizedOrder, ...state.orders],
                        activeCart: [],
                        discount: 0,
                        isLoading: false
                    }));

                    await localDb.orders.put(normalizedOrder as any);

                    return normalizedOrder;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    console.error('Failed to save order:', error);
                    throw error;
                }
            },

            updateOrderStatus: async (orderId, status, changedBy) => {
                try {
                    const current = get().orders.find(o => o.id === orderId);
                    const expectedUpdatedAt = current?.updatedAt ? new Date(current.updatedAt).toISOString() : undefined;
                    if (navigator.onLine) {
                        await ordersApi.updateStatus(orderId, { status, changed_by: changedBy, expected_updated_at: expectedUpdatedAt });
                    } else {
                        await syncService.queue('orderStatus', 'UPDATE', {
                            id: orderId,
                            data: { status, changed_by: changedBy, expected_updated_at: expectedUpdatedAt }
                        });
                    }
                    eventBus.emit(AuditEventType.ORDER_STATUS_CHANGE, {
                        orderId,
                        status,
                        changedBy,
                        timestamp: new Date()
                    });
                    set((state) => ({
                        orders: state.orders.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date() } : o)
                    }));
                    const existing = await localDb.orders.get(orderId);
                    if (existing) {
                        await localDb.orders.put({ ...existing, status, updatedAt: new Date() } as any);
                    }
                } catch (error: any) {
                    // Update locally anyway for responsiveness
                    set((state) => ({
                        orders: state.orders.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date() } : o)
                    }));
                    console.error('Failed to update order status:', error);
                }
            },

            // ============ Local Actions ============

            setOrderMode: (mode) => set({ activeOrderType: mode }),

            addToCart: (item) => set((state) => ({ activeCart: [...state.activeCart, item] })),

            removeFromCart: (itemId) => set((state) => ({
                activeCart: state.activeCart.filter(i => i.cartId !== itemId)
            })),

            updateCartItemQuantity: (itemId, delta) => set((state) => ({
                activeCart: state.activeCart.map(item =>
                    item.cartId === itemId
                        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                        : item
                )
            })),

            updateCartItemNotes: (itemId, notes) => set((state) => ({
                activeCart: state.activeCart.map(item =>
                    item.cartId === itemId ? { ...item, notes } : item
                )
            })),

            clearCart: () => set({ activeCart: [], discount: 0, activeCoupon: null }),

            saveTableDraft: (tableId, cart, discount) => set((state) => ({
                tableDrafts: {
                    ...state.tableDrafts,
                    [tableId]: { cart: [...cart], discount, updatedAt: Date.now() }
                }
            })),

            loadTableDraft: (tableId) => set((state) => {
                const draft = state.tableDrafts[tableId];
                if (!draft) return state;
                return { activeCart: [...draft.cart], discount: draft.discount };
            }),

            clearTableDraft: (tableId) => set((state) => {
                const next = { ...state.tableDrafts };
                delete next[tableId];
                return { tableDrafts: next };
            }),

            setDiscount: (d) => set({ discount: d, activeCoupon: null }),

            applyCoupon: async ({ code, branchId, orderType, subtotal, customerId }) => {
                if (!navigator.onLine) {
                    throw new Error('COUPON_REQUIRES_ONLINE');
                }
                const result = await ordersApi.validateCoupon({
                    code,
                    branchId,
                    orderType,
                    subtotal,
                    customerId,
                });
                if (!result?.valid) {
                    throw new Error(result?.message || 'COUPON_INVALID');
                }
                set({
                    activeCoupon: String(result.code || code).toUpperCase(),
                    discount: Number(result.discountPercent || 0),
                });
            },

            clearCoupon: () => set({ activeCoupon: null, discount: 0 }),

            holdOrder: (order) => set((state) => ({
                heldOrders: [...state.heldOrders, order],
                activeCart: [],
                discount: 0
            })),

            recallOrder: (index) => set((state) => {
                const orderToRecall = state.heldOrders[index];
                const newHeldOrders = state.heldOrders.filter((_, i) => i !== index);
                return {
                    heldOrders: newHeldOrders,
                    recalledOrder: orderToRecall,
                    activeCart: orderToRecall.cart
                };
            }),

            clearRecalledOrder: () => set({ recalledOrder: null }),

            updateTables: (tables) => set({ tables }),

            updateTable: (id, updates) => set((state) => ({
                tables: state.tables.map(t => t.id === id ? { ...t, ...updates } : t)
            })),

            updateTableStatus: async (tableId, status) => {
                // Optimistic Update
                set((state) => ({
                    tables: state.tables.map(t => t.id === tableId ? { ...t, status } : t)
                }));
                try {
                    if (navigator.onLine) {
                        await tablesApi.updateStatus(tableId, status);
                    } else {
                        await syncService.queue('tableStatus', 'UPDATE', { id: tableId, status });
                    }
                    const existing = await localDb.floorTables.get(tableId);
                    if (existing) {
                        await localDb.floorTables.put({ ...existing, status });
                    }
                } catch (error) {
                    console.error('Failed to sync table status:', error);
                }
            },

            updateZones: (zones) => set({ zones }),

            clearError: () => set({ error: null }),

            transferTable: async (sourceId, targetId) => {
                const state = get(); // Access current state
                const sourceTable = state.tables.find(t => t.id === sourceId);
                const targetTable = state.tables.find(t => t.id === targetId);

                if (!sourceTable || !targetTable) return;

                // Optimistic Update
                set((state) => ({
                    tables: state.tables.map(t => {
                        if (t.id === sourceId) return { ...t, status: TableStatus.AVAILABLE, currentOrderTotal: 0 };
                        if (t.id === targetId) return { ...t, status: TableStatus.OCCUPIED, currentOrderTotal: sourceTable.currentOrderTotal };
                        return t;
                    }),
                    orders: state.orders.map(o => (o.tableId === sourceId && o.status !== OrderStatus.DELIVERED) ? { ...o, tableId: targetId } : o)
                }));

                // API Call (transactional on backend)
                try {
                    if (navigator.onLine) {
                        await tablesApi.transfer({ sourceTableId: sourceId, targetTableId: targetId });
                    } else {
                        await tablesApi.updateStatus(sourceId, TableStatus.AVAILABLE);
                        await tablesApi.updateStatus(targetId, TableStatus.OCCUPIED);
                    }
                } catch (error) {
                    console.error('Failed to transfer table in backend:', error);
                }
            },

            transferItems: async (sourceId, targetId, itemIds) => {
                const snapshot = get();
                const sourceOrder = snapshot.orders.find(o => o.tableId === sourceId && o.status !== OrderStatus.DELIVERED);
                const targetOrder = snapshot.orders.find(o => o.tableId === targetId && o.status !== OrderStatus.DELIVERED);
                if (!sourceOrder) return;

                const itemsToMove = sourceOrder.items.filter(i => itemIds.includes(i.cartId));
                if (itemsToMove.length === 0) return;
                const remainingItems = sourceOrder.items.filter(i => !itemIds.includes(i.cartId));

                let newOrders = snapshot.orders.map(o => (o.id === sourceOrder.id ? { ...o, items: remainingItems } : o));
                if (targetOrder) {
                    newOrders = newOrders.map(o => (o.id === targetOrder.id ? { ...o, items: [...o.items, ...itemsToMove] } : o));
                } else {
                    const newOrder: Order = {
                        ...sourceOrder,
                        id: `transfer-${Date.now()}`,
                        tableId: targetId,
                        items: itemsToMove,
                        createdAt: new Date(),
                        payments: [],
                        status: OrderStatus.PENDING
                    };
                    newOrders = [newOrder, ...newOrders];
                }
                set({ orders: newOrders });

                try {
                    if (navigator.onLine) {
                        const payloadItems = itemsToMove.map(i => ({ name: i.name, price: Number(i.price || 0), quantity: Number(i.quantity || 1) }));
                        if (targetOrder) {
                            await tablesApi.merge({ sourceTableId: sourceId, targetTableId: targetId, items: payloadItems });
                        } else {
                            await tablesApi.split({ sourceTableId: sourceId, targetTableId: targetId, items: payloadItems });
                        }
                    }
                } catch (error) {
                    console.error('Failed to transfer/merge items in backend:', error);
                }
            },

            splitTable: async (sourceId, targetId, itemIds) => {
                const state = get();
                const sourceOrder = state.orders.find(o => o.tableId === sourceId && o.status !== OrderStatus.DELIVERED);
                if (!sourceOrder) return;

                const itemsToMove = sourceOrder.items.filter(i => itemIds.includes(i.cartId));
                const remainingItems = sourceOrder.items.filter(i => !itemIds.includes(i.cartId));

                const newOrder: Order = {
                    ...sourceOrder,
                    id: `split-${Date.now()}`,
                    tableId: targetId,
                    items: itemsToMove,
                    createdAt: new Date(),
                };

                set({
                    orders: [newOrder, ...state.orders.map(o => o.id === sourceOrder.id ? { ...o, items: remainingItems } : o)],
                    tables: state.tables.map(t => t.id === targetId ? { ...t, status: TableStatus.OCCUPIED } : t)
                });

                try {
                    if (navigator.onLine) {
                        const payloadItems = itemsToMove.map(i => ({ name: i.name, price: Number(i.price || 0), quantity: Number(i.quantity || 1) }));
                        await tablesApi.split({ sourceTableId: sourceId, targetTableId: targetId, items: payloadItems });
                    }
                } catch (error) {
                    console.error('Failed to split table in backend:', error);
                }
            },

            loadTableOrder: (tableId) => set((state) => {
                const activeOrder = state.orders.find(o => o.tableId === tableId && o.status !== OrderStatus.DELIVERED);
                if (activeOrder) {
                    return { activeCart: activeOrder.items || [], discount: activeOrder.discount || 0 };
                }
                return { activeCart: [], discount: 0 };
            }),
        }),
        { name: 'order-storage' }
    )
);

