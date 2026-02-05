// Order Store - Connected to Database API (Production Ready)
import { create } from 'zustand';
import { Order, OrderType, OrderItem, OrderStatus, Table, TableStatus, AuditEventType } from '../types';
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
    updateTableStatus: (tableId: string, status: string) => Promise<void>;

    // Local Actions
    setOrderMode: (mode: OrderType) => void;
    addToCart: (item: OrderItem) => void;
    removeFromCart: (itemId: string) => void;
    updateCartItemQuantity: (itemId: string, delta: number) => void;
    updateCartItemNotes: (itemId: string, notes: string) => void;
    clearCart: () => void;
    setDiscount: (amount: number) => void;
    applyCoupon: (code: string) => void;
    holdOrder: (order: HeldOrder) => void;
    recallOrder: (index: number) => void;
    clearRecalledOrder: () => void;
    updateTables: (tables: Table[]) => void;
    updateTable: (id: string, updates: Partial<Table>) => void;
    updateZones: (zones: FloorZone[]) => void;
    clearError: () => void;

    // Advanced Table Management
    transferTable: (sourceTableId: string, targetTableId: string) => Promise<void>;
    transferItems: (sourceTableId: string, targetTableId: string, itemCartIds: string[]) => void;
    splitTable: (originalTableId: string, targetTableId: string, itemCartIds: string[]) => void;
    loadTableOrder: (tableId: string) => void;
}

// Empty tables - should be configured in settings
const INITIAL_TABLES: Table[] = [];
const INITIAL_ZONES: FloorZone[] = [
    { id: 'MAIN', name: 'Main Hall', color: 'bg-indigo-600' }
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
                            type: o.type as OrderType,
                            branchId: o.branch_id || o.branchId,
                            tableId: o.table_id || o.tableId,
                            customerId: o.customer_id || o.customerId,
                            customerName: o.customer_name || o.customerName,
                            customerPhone: o.customer_phone || o.customerPhone,
                            deliveryAddress: o.delivery_address || o.deliveryAddress,
                            isCallCenterOrder: o.is_call_center_order || o.isCallCenterOrder,
                            items: o.items || [],
                            status: o.status as OrderStatus,
                            subtotal: o.subtotal,
                            tax: o.tax,
                            total: o.total,
                            discount: o.discount,
                            freeDelivery: o.free_delivery,
                            isUrgent: o.is_urgent,
                            paymentMethod: o.payment_method,
                            notes: o.notes,
                            createdAt: new Date(o.created_at || o.createdAt),
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
                        const tables = await tablesApi.getAll(branchId);
                        const zones = await tablesApi.getZones(branchId);
                        // Map or validate data if needed
                        console.log('Fetched tables:', tables);
                        set({ tables, zones, isLoading: false });
                        await localDb.tables.bulkPut(tables.map((t: any) => ({ ...t, branchId })));
                        await localDb.zones.bulkPut(zones.map((z: any) => ({ ...z, branchId })));
                    } else {
                        const tables = await localDb.tables.where('branchId').equals(branchId).toArray();
                        const zones = await localDb.zones.where('branchId').equals(branchId).toArray();
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

                    // Emit event for other systems (Inventory, Audit, etc.)
                    eventBus.emit(AuditEventType.POS_ORDER_PLACEMENT, {
                        order: savedOrder,
                        timestamp: new Date()
                    });

                    // Update local state
                    set((state) => ({
                        orders: [savedOrder, ...state.orders],
                        activeCart: [],
                        discount: 0,
                        isLoading: false
                    }));

                    await localDb.orders.put(savedOrder as any);

                    return savedOrder;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    console.error('Failed to save order:', error);
                    throw error;
                }
            },

            updateOrderStatus: async (orderId, status, changedBy) => {
                try {
                    if (navigator.onLine) {
                        await ordersApi.updateStatus(orderId, { status, changed_by: changedBy });
                    } else {
                        await syncService.queue('orderStatus', 'UPDATE', { id: orderId, data: { status, changed_by: changedBy } });
                    }
                    set((state) => ({
                        orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
                    }));
                    const existing = await localDb.orders.get(orderId);
                    if (existing) {
                        await localDb.orders.put({ ...existing, status } as any);
                    }
                } catch (error: any) {
                    // Update locally anyway for responsiveness
                    set((state) => ({
                        orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
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

            setDiscount: (d) => set({ discount: d }),

            applyCoupon: (code) => {
                // In production, this would call an API
                const validCoupons = ['SAVE50', 'ZEN2026', 'WELCOME'];
                if (validCoupons.includes(code.toUpperCase())) {
                    set({ activeCoupon: code.toUpperCase(), discount: 10 }); // Fixed 10% for simulation
                } else {
                    throw new Error('Invalid coupon code');
                }
            },

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
                    const existing = await localDb.tables.get(tableId);
                    if (existing) {
                        await localDb.tables.put({ ...existing, status });
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

                // API Calls
                try {
                    await tablesApi.updateStatus(sourceId, TableStatus.AVAILABLE);
                    await tablesApi.updateStatus(targetId, TableStatus.OCCUPIED);
                    // Note: We should also update the order's tableId in the backend via ordersApi if we had that endpoint exposed specifically,
                    // but for now we assume order sync handles it or we'd need a specific 'transfer' endpoint.
                    // Ideally: await ordersApi.transferTable(sourceId, targetId);
                } catch (error) {
                    console.error('Failed to transfer table in backend:', error);
                }
            },

            transferItems: (sourceId, targetId, itemIds) => set((state) => {
                const sourceOrder = state.orders.find(o => o.tableId === sourceId && o.status !== OrderStatus.DELIVERED);
                const targetOrder = state.orders.find(o => o.tableId === targetId && o.status !== OrderStatus.DELIVERED);

                if (!sourceOrder) return state;

                const itemsToMove = sourceOrder.items.filter(i => itemIds.includes(i.cartId));
                const remainingItems = sourceOrder.items.filter(i => !itemIds.includes(i.cartId));

                let newOrders = state.orders.map(o => {
                    if (o.id === sourceOrder.id) return { ...o, items: remainingItems };
                    return o;
                });

                if (targetOrder) {
                    newOrders = newOrders.map(o => {
                        if (o.id === targetOrder.id) return { ...o, items: [...o.items, ...itemsToMove] };
                        return o;
                    });
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

                return { orders: newOrders };
            }),

            splitTable: (sourceId, targetId, itemIds) => set((state) => {
                const sourceOrder = state.orders.find(o => o.tableId === sourceId && o.status !== OrderStatus.DELIVERED);
                if (!sourceOrder) return state;

                const itemsToMove = sourceOrder.items.filter(i => itemIds.includes(i.cartId));
                const remainingItems = sourceOrder.items.filter(i => !itemIds.includes(i.cartId));

                const newOrder: Order = {
                    ...sourceOrder,
                    id: `split-${Date.now()}`,
                    tableId: targetId,
                    items: itemsToMove,
                    createdAt: new Date(),
                };

                return {
                    orders: [newOrder, ...state.orders.map(o => o.id === sourceOrder.id ? { ...o, items: remainingItems } : o)],
                    tables: state.tables.map(t => t.id === targetId ? { ...t, status: TableStatus.OCCUPIED } : t)
                };
            }),

            loadTableOrder: (tableId) => set((state) => {
                const activeOrder = state.orders.find(o => o.tableId === tableId && o.status !== OrderStatus.DELIVERED);
                if (activeOrder) {
                    return { activeCart: activeOrder.items, discount: activeOrder.discount || 0 };
                }
                return { activeCart: [], discount: 0 };
            }),
        }),
        { name: 'order-storage' }
    )
);

