
import { create } from 'zustand';
import { InventoryItem, Supplier, PurchaseOrder, Warehouse, WarehouseType, Branch } from '../types';

const INITIAL_WAREHOUSES: Warehouse[] = [
    { id: 'w1', name: 'Main Kitchen Store', branchId: 'b1', type: WarehouseType.KITCHEN, isActive: true },
    { id: 'w2', name: 'Bar Store', branchId: 'b1', type: WarehouseType.POINT_OF_SALE, isActive: true },
];

const INITIAL_INVENTORY: InventoryItem[] = [
    { id: 'inv-1', name: 'Beef Patty', unit: 'pcs', category: 'Meat', costPrice: 40, threshold: 50, warehouseQuantities: [{ warehouseId: 'w1', quantity: 200 }] },
    { id: 'inv-2', name: 'Burger Bun', unit: 'pcs', category: 'Bakery', costPrice: 5, threshold: 100, warehouseQuantities: [{ warehouseId: 'w1', quantity: 300 }] },
    { id: 'inv-3', name: 'Tomato', unit: 'kg', category: 'Vegetables', costPrice: 15, threshold: 10, warehouseQuantities: [{ warehouseId: 'w1', quantity: 50 }] },
    { id: 'inv-4', name: 'Lettuce', unit: 'head', category: 'Vegetables', costPrice: 10, threshold: 20, warehouseQuantities: [{ warehouseId: 'w1', quantity: 40 }] },
    { id: 'inv-5', name: 'Mozzarella Cheese', unit: 'kg', category: 'Dairy', costPrice: 250, threshold: 15, warehouseQuantities: [{ warehouseId: 'w1', quantity: 30 }] },
    { id: 'inv-6', name: 'Pizza Dough', unit: 'pcs', category: 'Bakery', costPrice: 10, threshold: 50, warehouseQuantities: [{ warehouseId: 'w1', quantity: 100 }] },
    { id: 'inv-7', name: 'Cola Can', unit: 'pcs', category: 'Beverage', costPrice: 12, threshold: 100, warehouseQuantities: [{ warehouseId: 'w2', quantity: 500 }] },
];

interface InventoryState {
    inventory: InventoryItem[];
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    warehouses: Warehouse[];

    // Actions
    updateStock: (itemId: string, warehouseId: string, quantity: number) => void;
    addPurchaseOrder: (po: PurchaseOrder) => void;
    receivePurchaseOrder: (poId: string, receivedAt: Date) => void;
    addSupplier: (supplier: Supplier) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
    inventory: INITIAL_INVENTORY,
    suppliers: [],
    purchaseOrders: [],
    warehouses: INITIAL_WAREHOUSES,

    updateStock: (itemId, warehouseId, quantity) => set((state) => ({
        inventory: state.inventory.map(item => {
            if (item.id !== itemId) return item;
            const updatedWq = item.warehouseQuantities.map(wq =>
                wq.warehouseId === warehouseId ? { ...wq, quantity } : wq
            );
            return { ...item, warehouseQuantities: updatedWq };
        })
    })),

    addPurchaseOrder: (po) => set((state) => ({ purchaseOrders: [...state.purchaseOrders, po] })),

    receivePurchaseOrder: (poId, receivedAt) => set((state) => ({
        purchaseOrders: state.purchaseOrders.map(po => {
            if (po.id !== poId) return po;
            // Logic to increase stock should also be triggered here in a real app or effect
            return { ...po, status: 'RECEIVED', receivedDate: receivedAt };
        })
    })),

    addSupplier: (supplier) => set((state) => ({ suppliers: [...state.suppliers, supplier] }))
}));
