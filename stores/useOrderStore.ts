
import { create } from 'zustand';
import { Order, OrderType, OrderItem, PaymentMethod, PaymentRecord, Table, TableStatus } from '../types';

interface HeldOrder {
    cart: OrderItem[];
    tableId?: string;
    customerId?: string;
    timestamp: Date;
}

interface OrderState {
    orders: Order[];
    activeOrderType: OrderType;
    heldOrders: HeldOrder[];
    activeCart: OrderItem[];
    tables: Table[];

    // POS State
    discount: number;
    recalledOrder: HeldOrder | null;

    // Actions
    setOrderMode: (mode: OrderType) => void;
    addToCart: (item: OrderItem) => void;
    removeFromCart: (itemId: string) => void;
    updateCartItemQuantity: (itemId: string, delta: number) => void;
    updateCartItemNotes: (itemId: string, notes: string) => void;
    clearCart: () => void;
    setDiscount: (amount: number) => void;
    placeOrder: (order: Order) => void;
    holdOrder: (order: HeldOrder) => void;
    recallOrder: (index: number) => void;
    clearRecalledOrder: () => void;
    updateTables: (tables: Table[]) => void;
    updateTableStatus: (tableId: string, status: TableStatus) => void;
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const INITIAL_TABLES: Table[] = [
    { id: 't1', name: 'T1', status: TableStatus.AVAILABLE, seats: 4, position: { x: 10, y: 10 }, shape: 'square', zoneId: 'hall', type: 'DINE_IN' },
    { id: 't2', name: 'T2', status: TableStatus.AVAILABLE, seats: 2, position: { x: 30, y: 10 }, shape: 'round', zoneId: 'hall', type: 'DINE_IN' },
    { id: 't3', name: 'T3', status: TableStatus.AVAILABLE, seats: 6, position: { x: 50, y: 10 }, shape: 'rectangle', zoneId: 'hall', type: 'DINE_IN' },
    { id: 't4', name: 'VIP-1', status: TableStatus.RESERVED, seats: 8, position: { x: 80, y: 20 }, shape: 'rectangle', zoneId: 'vip', isVIP: true, minSpend: 500, type: 'DINE_IN' },
    { id: 't5', name: 'T4', status: TableStatus.AVAILABLE, seats: 4, position: { x: 10, y: 40 }, shape: 'square', zoneId: 'hall', type: 'DINE_IN' },
    { id: 't6', name: 'T5', status: TableStatus.AVAILABLE, seats: 4, position: { x: 30, y: 40 }, shape: 'square', zoneId: 'hall', type: 'DINE_IN' },
    { id: 't7', name: 'O-1', status: TableStatus.AVAILABLE, seats: 2, position: { x: 10, y: 70 }, shape: 'round', zoneId: 'terrace', type: 'DINE_IN' },
    { id: 't8', name: 'O-2', status: TableStatus.AVAILABLE, seats: 2, position: { x: 30, y: 70 }, shape: 'round', zoneId: 'terrace', type: 'DINE_IN' },
];

export const useOrderStore = create<OrderState>((set) => ({
    orders: [],
    activeOrderType: OrderType.DINE_IN,
    heldOrders: [],
    activeCart: [],
    tables: INITIAL_TABLES,
    discount: 0,
    recalledOrder: null,

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

    placeOrder: (order) => set((state) => ({
        orders: [order, ...state.orders],
        activeCart: [],
        discount: 0
    })),

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
    updateOrderStatus: (orderId, status) => set((state) => ({
        orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
    }))
}));
