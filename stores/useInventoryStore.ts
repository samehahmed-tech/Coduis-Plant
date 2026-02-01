// Inventory Store - Connected to Database API (Production Ready)
import { create } from 'zustand';
import { InventoryItem, Supplier, PurchaseOrder, Warehouse, WarehouseType } from '../types';
import { inventoryApi } from '../services/api';

interface InventoryState {
    inventory: InventoryItem[];
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    warehouses: Warehouse[];
    isLoading: boolean;
    error: string | null;

    // Async Actions (API)
    fetchInventory: () => Promise<void>;
    addInventoryItem: (item: InventoryItem) => Promise<void>;

    // Local Actions
    updateStock: (itemId: string, warehouseId: string, quantity: number) => void;
    addPurchaseOrder: (po: PurchaseOrder) => void;
    receivePurchaseOrder: (poId: string, receivedAt: Date) => void;
    addSupplier: (supplier: Supplier) => void;
    addWarehouse: (warehouse: Warehouse) => void;
    clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
    inventory: [], // Empty - loads from database
    suppliers: [],
    purchaseOrders: [],
    warehouses: [],
    isLoading: false,
    error: null,

    // ============ API Actions ============

    fetchInventory: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await inventoryApi.getAll();
            const inventory = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                nameAr: item.name_ar,
                sku: item.sku,
                barcode: item.barcode,
                unit: item.unit,
                category: item.category,
                costPrice: item.cost_price,
                threshold: item.threshold,
                warehouseQuantities: [{ warehouseId: 'w1', quantity: item.total_quantity || 0 }],
            }));
            set({ inventory, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            console.error('Failed to fetch inventory:', error);
        }
    },

    addInventoryItem: async (item) => {
        set({ isLoading: true });
        try {
            await inventoryApi.create({
                id: item.id,
                name: item.name,
                name_ar: item.nameAr,
                sku: item.sku,
                barcode: item.barcode,
                unit: item.unit,
                category: item.category,
                cost_price: item.costPrice,
                threshold: item.threshold,
            });
            set((state) => ({
                inventory: [...state.inventory, item],
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // ============ Local Actions ============

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
            return { ...po, status: 'RECEIVED', receivedDate: receivedAt };
        })
    })),

    addSupplier: (supplier) => set((state) => ({ suppliers: [...state.suppliers, supplier] })),

    addWarehouse: (warehouse) => set((state) => ({ warehouses: [...state.warehouses, warehouse] })),

    clearError: () => set({ error: null }),
}));
