// Order Store - Connected to Database API (Production Ready)
import { create } from 'zustand';
import { Order, OrderType, OrderItem, OrderStatus, Table, TableStatus } from '../types';
import { ordersApi } from '../services/api';

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
    isLoading: boolean;
    error: string | null;

    // POS State
    discount: number;
    recalledOrder: HeldOrder | null;

    // Async Actions (API)
    fetchOrders: (params?: { status?: string; branch_id?: string; date?: string; limit?: number }) => Promise<void>;
    placeOrder: (order: Order) => Promise<Order>;
    updateOrderStatus: (orderId: string, status: OrderStatus, changedBy?: string) => Promise<void>;

    // Local Actions
    setOrderMode: (mode: OrderType) => void;
    addToCart: (item: OrderItem) => void;
    removeFromCart: (itemId: string) => void;
    updateCartItemQuantity: (itemId: string, delta: number) => void;
    updateCartItemNotes: (itemId: string, notes: string) => void;
    clearCart: () => void;
    setDiscount: (amount: number) => void;
    holdOrder: (order: HeldOrder) => void;
    recallOrder: (index: number) => void;
    clearRecalledOrder: () => void;
    updateTables: (tables: Table[]) => void;
    updateTableStatus: (tableId: string, status: TableStatus) => void;
    clearError: () => void;
}

// Empty tables - should be configured in settings
const INITIAL_TABLES: Table[] = [];

export const useOrderStore = create<OrderState>((set, get) => ({
    orders: [], // Empty - loads from database
    activeOrderType: OrderType.DINE_IN,
    heldOrders: [],
    activeCart: [],
    tables: INITIAL_TABLES,
    discount: 0,
    recalledOrder: null,
    isLoading: false,
    error: null,

    // ============ API Actions ============

    fetchOrders: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const data = await ordersApi.getAll(params);
            const orders = data.map((o: any) => ({
                id: o.id,
                type: o.type as OrderType,
                branchId: o.branch_id,
                tableId: o.table_id,
                customerId: o.customer_id,
                customerName: o.customer_name,
                customerPhone: o.customer_phone,
                deliveryAddress: o.delivery_address,
                isCallCenterOrder: o.is_call_center_order,
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
                createdAt: new Date(o.created_at),
            }));
            set({ orders, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            console.error('Failed to fetch orders:', error);
        }
    },

    placeOrder: async (order) => {
        set({ isLoading: true, error: null });
        try {
            // Send to API
            const savedOrder = await ordersApi.create({
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
            });

            // Update local state
            set((state) => ({
                orders: [order, ...state.orders],
                activeCart: [],
                discount: 0,
                isLoading: false
            }));

            return savedOrder;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            console.error('Failed to save order:', error);
            throw error;
        }
    },

    updateOrderStatus: async (orderId, status, changedBy) => {
        try {
            await ordersApi.updateStatus(orderId, { status, changed_by: changedBy });
            set((state) => ({
                orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
            }));
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

    clearCart: () => set({ activeCart: [], discount: 0 }),

    setDiscount: (d) => set({ discount: d }),

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

    updateTableStatus: (tableId, status) => set((state) => ({
        tables: state.tables.map(t => t.id === tableId ? { ...t, status } : t)
    })),

    clearError: () => set({ error: null }),
}));
