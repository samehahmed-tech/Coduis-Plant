import { apiRequest } from './core';

export const inventoryApi = {
    getAll: () => apiRequest<any[]>('/inventory'),
    create: (item: any) => apiRequest<any>('/inventory', { method: 'POST', body: JSON.stringify(item) }),
    update: (id: string, item: any) => apiRequest<any>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
    delete: (id: string) => apiRequest<any>(`/inventory/${id}`, { method: 'DELETE' }),
    getWarehouses: () => apiRequest<any[]>('/warehouses'),
    createWarehouse: (warehouse: any) => apiRequest<any>('/warehouses', { method: 'POST', body: JSON.stringify(warehouse) }),
    updateStock: (data: { item_id: string; warehouse_id: string; quantity: number; type: string; reason?: string; actor_id?: string; reference_id?: string }) =>
        apiRequest<any>('/inventory/stock/update', { method: 'POST', body: JSON.stringify(data) }),
    transferStock: (data: { item_id: string; from_warehouse_id: string; to_warehouse_id: string; quantity: number; reason?: string; actor_id?: string; reference_id?: string }) =>
        apiRequest<any>('/inventory/stock/transfer', { method: 'POST', body: JSON.stringify(data) }),
    getTransfers: (limit?: number) => apiRequest<any[]>(`/inventory/stock/transfers${limit ? `?limit=${limit}` : ''}`),
};
