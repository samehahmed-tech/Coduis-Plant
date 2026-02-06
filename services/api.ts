// API Client for Restaurant ERP
// Connects frontend to backend API

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const IS_DEV = import.meta.env.DEV;
const getAuthToken = () => {
    try {
        return localStorage.getItem('auth_token');
    } catch {
        return null;
    }
};

// ============================================================================
// Generic API Functions
// ============================================================================

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    // Debug log for API calls
    if (IS_DEV) {
        console.log(`API Request: ${options.method || 'GET'} ${url}`);
    }

    const config: RequestInit = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {}),
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            const err: any = new Error(error.message || error.error || `HTTP Error: ${response.status}`);
            err.status = response.status;
            err.endpoint = endpoint;
            if (response.status === 401 && endpoint === '/auth/me') {
                err.silent = true;
            }
            if (endpoint === '/health') {
                err.silent = true;
            }
            throw err;
        }

        const data = await response.json();
        return data;
    } catch (error: any) {
        if (!error?.silent && IS_DEV) {
            console.error(`API Error [${endpoint}]:`, error.message);
        }
        // If it's a syntax error with '<', it's likely we hit an HTML page instead of JSON
        if (!error?.silent && IS_DEV && error.message?.includes('Unexpected token')) {
            console.error('Hint: The server might be returning an HTML page. Check if the backend is running and the API URL is correct.');
        }
        throw error;
    }
}

// ============================================================================
// Health Check
// ============================================================================

export const checkHealth = async () => {
    try {
        return await apiRequest<{ status: string; timestamp: string; database?: string }>('/health');
    } catch {
        return { status: 'down', timestamp: new Date().toISOString() };
    }
};
// ============================================================================
// Setup API (First-Time Bootstrap)
// ============================================================================

export const setupApi = {
    status: () => apiRequest<{ needsSetup: boolean }>('/setup/status'),
    bootstrap: (payload: any) => apiRequest<{ ok: boolean }>('/setup/bootstrap', { method: 'POST', body: JSON.stringify(payload) }),
};
// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
    login: (email: string, password: string) =>
        apiRequest<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => apiRequest<{ user: any }>('/auth/me'),
};

// ============================================================================
// Users API
// ============================================================================

export const usersApi = {
    getAll: () => apiRequest<any[]>('/users'),
    getById: (id: string) => apiRequest<any>(`/users/${id}`),
    create: (user: any) => apiRequest<any>('/users', { method: 'POST', body: JSON.stringify(user) }),
    update: (id: string, user: any) => apiRequest<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
    delete: (id: string) => apiRequest<any>(`/users/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Branches API
// ============================================================================

export const branchesApi = {
    getAll: () => apiRequest<any[]>('/branches'),
    getById: (id: string) => apiRequest<any>(`/branches/${id}`),
    create: (branch: any) => apiRequest<any>('/branches', { method: 'POST', body: JSON.stringify(branch) }),
    update: (id: string, branch: any) => apiRequest<any>(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(branch) }),
    delete: (id: string) => apiRequest<any>(`/branches/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Customers API
// ============================================================================

export const customersApi = {
    getAll: (params?: { search?: string; phone?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/customers${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest<any>(`/customers/${id}`),
    getByPhone: (phone: string) => apiRequest<any>(`/customers/phone/${phone}`),
    create: (customer: any) => apiRequest<any>('/customers', { method: 'POST', body: JSON.stringify(customer) }),
    update: (id: string, customer: any) => apiRequest<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(customer) }),
    delete: (id: string) => apiRequest<any>(`/customers/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Menu API
// ============================================================================

export const menuApi = {
    // Categories
    getCategories: () => apiRequest<any[]>('/menu/categories'),
    createCategory: (category: any) => apiRequest<any>('/menu/categories', { method: 'POST', body: JSON.stringify(category) }),
    updateCategory: (id: string, category: any) => apiRequest<any>(`/menu/categories/${id}`, { method: 'PUT', body: JSON.stringify(category) }),
    deleteCategory: (id: string) => apiRequest<any>(`/menu/categories/${id}`, { method: 'DELETE' }),

    // Items
    getItems: (categoryId?: string) => {
        const query = categoryId ? `?category_id=${categoryId}` : '';
        return apiRequest<any[]>(`/menu/items${query}`);
    },
    getItemById: (id: string) => apiRequest<any>(`/menu/items/${id}`),
    createItem: (item: any) => apiRequest<any>('/menu/items', { method: 'POST', body: JSON.stringify(item) }),
    updateItem: (id: string, item: any) => apiRequest<any>(`/menu/items/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
    deleteItem: (id: string) => apiRequest<any>(`/menu/items/${id}`, { method: 'DELETE' }),

    // Full menu with categories and items
    getFullMenu: (availableOnly?: boolean) => apiRequest<any[]>(`/menu/full${availableOnly ? '?available_only=true' : ''}`),
};

// ============================================================================
// Orders API
// ============================================================================

export const ordersApi = {
    getAll: (params?: { status?: string; branch_id?: string; type?: string; date?: string; limit?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/orders${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest<any>(`/orders/${id}`),
    create: (order: any) => apiRequest<any>('/orders', { method: 'POST', body: JSON.stringify(order) }),
    updateStatus: (id: string, data: { status: string; changed_by?: string; notes?: string; expected_updated_at?: string; expectedUpdatedAt?: string }) =>
        apiRequest<any>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest<any>(`/orders/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Inventory API
// ============================================================================

export const inventoryApi = {
    getAll: () => apiRequest<any[]>('/inventory'),
    create: (item: any) => apiRequest<any>('/inventory', { method: 'POST', body: JSON.stringify(item) }),
    update: (id: string, item: any) => apiRequest<any>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
    delete: (id: string) => apiRequest<any>(`/inventory/${id}`, { method: 'DELETE' }),

    // Warehouses
    getWarehouses: () => apiRequest<any[]>('/warehouses'),
    createWarehouse: (warehouse: any) => apiRequest<any>('/warehouses', { method: 'POST', body: JSON.stringify(warehouse) }),

    // Stock
    updateStock: (data: { item_id: string; warehouse_id: string; quantity: number; type: string; reason?: string; actor_id?: string }) =>
        apiRequest<any>('/inventory/stock/update', { method: 'POST', body: JSON.stringify(data) }),
};


// ============================================================================
// Settings API
// ============================================================================

export const settingsApi = {
    getAll: () => apiRequest<Record<string, any>>('/settings'),
    update: (key: string, value: any, category?: string, updatedBy?: string) =>
        apiRequest<any>(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value, category, updated_by: updatedBy }) }),
    updateBulk: (settings: Record<string, any>) =>
        apiRequest<any>('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
};

// ============================================================================
// Audit Logs API
// ============================================================================

export const auditApi = {
    getAll: (params?: { event_type?: string; user_id?: string; limit?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/audit-logs${query ? `?${query}` : ''}`);
    },
    create: (log: any) => apiRequest<any>('/audit-logs', { method: 'POST', body: JSON.stringify(log) }),
};

// ============================================================================
// Shifts API
// ============================================================================

export const shiftsApi = {
    getActive: (branchId: string) =>
        apiRequest<any>(`/shifts/active?branchId=${branchId}`),
    getXReport: (shiftId: string) =>
        apiRequest<any>(`/shifts/${shiftId}/x-report`),
    open: (data: { id: string; branchId: string; userId: string; openingBalance: number; notes?: string }) =>
        apiRequest<any>('/shifts/open', { method: 'POST', body: JSON.stringify(data) }),
    close: (id: string, data: { actualBalance: number; notes?: string }) =>
        apiRequest<any>(`/shifts/${id}/close`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ============================================================================
// Manager Approvals API
// ============================================================================

export const approvalsApi = {
    getAll: (branchId?: string) =>
        apiRequest<any[]>(`/approvals${branchId ? `?branchId=${branchId}` : ''}`),
    create: (approval: any) =>
        apiRequest<any>('/approvals', { method: 'POST', body: JSON.stringify(approval) }),
    verifyPin: (data: { branchId: string; pin: string; action: string }) =>
        apiRequest<{ approved: boolean; managerId?: string; managerName?: string; error?: string }>(
            '/approvals/verify-pin',
            { method: 'POST', body: JSON.stringify(data) }
        ),
};

// ============================================================================
// Reports API
// ============================================================================

export const reportsApi = {
    getVat: (params: { branchId?: string; startDate: string; endDate: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any>(`/reports/vat?${query}`);
    },
    getPayments: (params: { branchId?: string; startDate: string; endDate: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/reports/payments?${query}`);
    },
    getFiscal: (params: { startDate: string; endDate: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any>(`/reports/fiscal?${query}`);
    },
    getDailySales: (params: { branchId?: string; startDate: string; endDate: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<Array<{ day: string; revenue: number; net: number; tax: number; orderCount: number }>>(`/reports/daily-sales?${query}`);
    },
};

// ============================================================================
// Fiscal API
// ============================================================================

export const fiscalApi = {
    submit: (orderId: string, options?: { force?: boolean }) =>
        apiRequest<any>('/fiscal/submit', { method: 'POST', body: JSON.stringify({ orderId, ...options }) }),
    getLogs: (params?: { branchId?: string; limit?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/fiscal/logs${query ? `?${query}` : ''}`);
    },
    getConfig: () => apiRequest<{ ok: boolean; missing: string[] }>('/fiscal/config'),
};

// ============================================================================
// Wastage API
// ============================================================================

export const wastageApi = {
    record: (data: { itemId: string; warehouseId: string; quantity: number; reason: string; notes?: string; performedBy?: string }) =>
        apiRequest<any>('/wastage', { method: 'POST', body: JSON.stringify(data) }),
    getReport: () => apiRequest<any>('/wastage/report'),
    getRecent: (limit?: number) => apiRequest<any[]>(`/wastage/recent${limit ? `?limit=${limit}` : ''}`),
};

// ============================================================================
// Suppliers API
// ============================================================================

export const suppliersApi = {
    getAll: (active?: boolean) => apiRequest<any[]>(`/suppliers${active ? '?active=true' : ''}`),
    getById: (id: string) => apiRequest<any>(`/suppliers/${id}`),
    create: (data: any) => apiRequest<any>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest<any>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest<any>(`/suppliers/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Purchase Orders API
// ============================================================================

export const purchaseOrdersApi = {
    getAll: (params?: { status?: string; supplierId?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/purchase-orders${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest<any>(`/purchase-orders/${id}`),
    create: (data: any) => apiRequest<any>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    receive: (id: string, data: { warehouseId: string; items: { itemId: string; receivedQty: number }[]; receivedBy?: string }) =>
        apiRequest<any>(`/purchase-orders/${id}/receive`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
        apiRequest<any>(`/purchase-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// ============================================================================
// Tables API
// ============================================================================

export const tablesApi = {
    getAll: (branchId: string) => apiRequest<any[]>(`/tables?branchId=${branchId}`),
    getZones: (branchId: string) => apiRequest<any[]>(`/tables/zones?branchId=${branchId}`),
    saveLayout: (data: { branchId: string; zones: any[]; tables: any[] }) =>
        apiRequest<any>('/tables/layout', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, currentOrderId?: string) =>
        apiRequest<any>(`/tables/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, currentOrderId }) }),
};

// ============================================================================
// Export all
// ============================================================================

export default {
    health: checkHealth,
    setup: setupApi,
    auth: authApi,
    users: usersApi,
    branches: branchesApi,
    customers: customersApi,
    menu: menuApi,
    orders: ordersApi,
    inventory: inventoryApi,
    settings: settingsApi,
    audit: auditApi,
    shifts: shiftsApi,
    approvals: approvalsApi,
    reports: reportsApi,
    fiscal: fiscalApi,
    wastage: wastageApi,
    suppliers: suppliersApi,
    purchaseOrders: purchaseOrdersApi,
    tables: tablesApi,
};


