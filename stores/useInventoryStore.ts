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
    fetchWarehouses: () => Promise<void>;
    addInventoryItem: (item: InventoryItem) => Promise<void>;
    updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
    addWarehouse: (warehouse: Warehouse) => Promise<void>;
    updateStock: (itemId: string, warehouseId: string, quantity: number, type: string, reason?: string) => Promise<void>;

    // Local Actions
    addPurchaseOrder: (po: PurchaseOrder) => void;
    receivePurchaseOrder: (poId: string, receivedAt: Date) => void;
    addSupplier: (supplier: Supplier) => void;
    clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
    inventory: [],
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
                costPrice: Number(item.cost_price),
                purchasePrice: Number(item.purchase_price),
                threshold: Number(item.threshold),
                isAudited: item.is_audited,
                auditFrequency: item.audit_frequency,
                isComposite: item.is_composite,
                bom: item.bom,
                warehouseQuantities: item.warehouseQuantities || [],
            }));
            set({ inventory, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchWarehouses: async () => {
        try {
            const data = await inventoryApi.getWarehouses();
            set({
                warehouses: data.map((w: any) => ({
                    id: w.id,
                    name: w.name,
                    nameAr: w.name_ar,
                    branchId: w.branch_id,
                    type: w.type,
                    isActive: w.is_active,
                    parentId: w.parent_id
                }))
            });
        } catch (error: any) {
            console.error('Failed to fetch warehouses:', error);
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
                purchase_price: item.purchasePrice,
                threshold: item.threshold,
                is_audited: item.isAudited,
                audit_frequency: item.auditFrequency,
                is_composite: item.isComposite,
                bom: item.bom
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

    updateInventoryItem: async (id, item) => {
        set({ isLoading: true });
        try {
            const current = get().inventory.find(i => i.id === id);
            if (!current) return;

            const updated = { ...current, ...item };
            await inventoryApi.update(id, {
                name: updated.name,
                name_ar: updated.nameAr,
                sku: updated.sku,
                barcode: updated.barcode,
                unit: updated.unit,
                category: updated.category,
                cost_price: updated.costPrice,
                purchase_price: updated.purchasePrice,
                threshold: updated.threshold,
                is_audited: updated.isAudited,
                audit_frequency: updated.auditFrequency,
                is_composite: updated.isComposite,
                bom: updated.bom,
                is_active: true
            });

            set((state) => ({
                inventory: state.inventory.map(i => i.id === id ? updated : i),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    addWarehouse: async (warehouse) => {
        try {
            await inventoryApi.createWarehouse({
                id: warehouse.id,
                name: warehouse.name,
                name_ar: warehouse.nameAr,
                branch_id: warehouse.branchId,
                type: warehouse.type,
                parent_id: warehouse.parentId
            });
            set((state) => ({ warehouses: [...state.warehouses, warehouse] }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    updateStock: async (itemId, warehouseId, quantity, type, reason) => {
        try {
            await inventoryApi.updateStock({
                item_id: itemId,
                warehouse_id: warehouseId,
                quantity,
                type,
                reason
            });

            set((state) => ({
                inventory: state.inventory.map(item => {
                    if (item.id !== itemId) return item;
                    const wqExists = item.warehouseQuantities.some(wq => wq.warehouseId === warehouseId);
                    const updatedWq = wqExists
                        ? item.warehouseQuantities.map(wq => wq.warehouseId === warehouseId ? { ...wq, quantity } : wq)
                        : [...item.warehouseQuantities, { warehouseId, quantity }];

                    return { ...item, warehouseQuantities: updatedWq };
                })
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    // ============ Local Actions ============

    addPurchaseOrder: (po) => set((state) => ({ purchaseOrders: [...state.purchaseOrders, po] })),

    receivePurchaseOrder: (poId, receivedAt) => set((state) => ({
        purchaseOrders: state.purchaseOrders.map(po => {
            if (po.id !== poId) return po;
            return { ...po, status: 'RECEIVED', receivedDate: receivedAt };
        })
    })),

    addSupplier: (supplier) => set((state) => ({ suppliers: [...state.suppliers, supplier] })),

    clearError: () => set({ error: null }),
}));

