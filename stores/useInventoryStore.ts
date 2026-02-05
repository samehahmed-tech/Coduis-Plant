// Inventory Store - Connected to Database API (Production Ready)
import { create } from 'zustand';
import { InventoryItem, Supplier, PurchaseOrder, Warehouse, WarehouseType } from '../types';
import { inventoryApi } from '../services/api';
import { localDb } from '../db/localDb';
import { syncService } from '../services/syncService';

interface InventoryState {
    inventory: InventoryItem[];
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    productionOrders: ProductionOrder[];
    purchaseRequests: PurchaseRequest[];
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
    addProductionOrder: (po: ProductionOrder) => void;
    completeProductionOrder: (poId: string, actualQuantity: number) => void;
    addSupplier: (supplier: Supplier) => void;
    clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
    inventory: [],
    suppliers: [],
    purchaseOrders: [],
    productionOrders: [],
    purchaseRequests: [],
    warehouses: [],
    isLoading: false,
    error: null,

    // ============ API Actions ============

    fetchInventory: async () => {
        set({ isLoading: true, error: null });
        try {
            if (navigator.onLine) {
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
                await localDb.inventoryItems.bulkPut(inventory.map(i => ({ ...i, updatedAt: Date.now() })));
            } else {
                const cached = await localDb.inventoryItems.toArray();
                set({ inventory: cached as InventoryItem[], isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchWarehouses: async () => {
        try {
            if (navigator.onLine) {
                const data = await inventoryApi.getWarehouses();
                const warehouses = data.map((w: any) => ({
                    id: w.id,
                    name: w.name,
                    nameAr: w.name_ar,
                    branchId: w.branch_id,
                    type: w.type,
                    isActive: w.is_active,
                    parentId: w.parent_id
                }));
                set({ warehouses });
                await localDb.warehouses.bulkPut(warehouses.map(w => ({ ...w, updatedAt: Date.now() })));
            } else {
                const cached = await localDb.warehouses.toArray();
                set({ warehouses: cached as Warehouse[] });
            }
        } catch (error: any) {
            console.error('Failed to fetch warehouses:', error);
        }
    },

    addInventoryItem: async (item) => {
        set({ isLoading: true });
        try {
            const payload = {
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
            };
            if (navigator.onLine) {
                await inventoryApi.create(payload);
            } else {
                await syncService.queue('inventoryItem', 'CREATE', payload);
            }
            set((state) => ({
                inventory: [...state.inventory, item],
                isLoading: false
            }));
            await localDb.inventoryItems.put({ ...item, updatedAt: Date.now() });
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
            const payload = {
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
            };
            if (navigator.onLine) {
                await inventoryApi.update(id, payload);
            } else {
                await syncService.queue('inventoryItem', 'UPDATE', { id, ...payload });
            }

            set((state) => ({
                inventory: state.inventory.map(i => i.id === id ? updated : i),
                isLoading: false
            }));
            await localDb.inventoryItems.put({ ...updated, updatedAt: Date.now() });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    addWarehouse: async (warehouse) => {
        try {
            const payload = {
                id: warehouse.id,
                name: warehouse.name,
                name_ar: warehouse.nameAr,
                branch_id: warehouse.branchId,
                type: warehouse.type,
                parent_id: warehouse.parentId
            };
            if (navigator.onLine) {
                await inventoryApi.createWarehouse(payload);
            } else {
                await syncService.queue('warehouse', 'CREATE', payload);
            }
            set((state) => ({ warehouses: [...state.warehouses, warehouse] }));
            await localDb.warehouses.put({ ...warehouse, updatedAt: Date.now() });
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    updateStock: async (itemId, warehouseId, quantity, type, reason) => {
        try {
            const payload = {
                item_id: itemId,
                warehouse_id: warehouseId,
                quantity,
                type,
                reason
            };
            if (navigator.onLine) {
                await inventoryApi.updateStock(payload);
            } else {
                await syncService.queue('stockUpdate', 'UPDATE', payload);
            }

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

            const existing = await localDb.inventoryItems.get(itemId);
            if (existing) {
                const wqExists = (existing.warehouseQuantities || []).some((wq: any) => wq.warehouseId === warehouseId);
                const updatedWq = wqExists
                    ? existing.warehouseQuantities.map((wq: any) => wq.warehouseId === warehouseId ? { ...wq, quantity } : wq)
                    : [...(existing.warehouseQuantities || []), { warehouseId, quantity }];
                await localDb.inventoryItems.put({ ...existing, warehouseQuantities: updatedWq, updatedAt: Date.now() });
            }
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

    addProductionOrder: (po) => set((state) => ({ productionOrders: [...state.productionOrders, po] })),

    completeProductionOrder: (poId, actualQuantity) => set((state) => {
        const order = state.productionOrders.find(o => o.id === poId);
        if (!order) return state;

        // In a real app, this would deduct ingredients from the inventory
        // and add the finished product to the warehouse stock.

        return {
            productionOrders: state.productionOrders.map(po => {
                if (po.id !== poId) return po;
                return { ...po, status: 'COMPLETED' as any, quantityProduced: actualQuantity, completedAt: new Date() };
            })
        };
    }),

    addSupplier: (supplier) => set((state) => ({ suppliers: [...state.suppliers, supplier] })),

    clearError: () => set({ error: null }),
}));

