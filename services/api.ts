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

async function apiRequestBlob(
    endpoint: string,
    options: RequestInit = {}
): Promise<Blob> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
        ...options,
        headers: {
            ...(getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {}),
            ...options.headers,
        },
    };
    const response = await fetch(url, config);
    if (!response.ok) {
        const text = await response.text().catch(() => 'Request failed');
        throw new Error(text || `HTTP Error: ${response.status}`);
    }
    return response.blob();
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
    login: (email: string, password: string, deviceName?: string) =>
        apiRequest<{ token?: string; user?: any; mfaRequired?: boolean; mfaToken?: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, deviceName }) }),
    verifyMfa: (mfaToken: string, code: string, deviceName?: string) =>
        apiRequest<{ token: string; user: any }>('/auth/mfa/verify', { method: 'POST', body: JSON.stringify({ mfaToken, code, deviceName }) }),
    me: () => apiRequest<{ user: any }>('/auth/me'),
    logout: () => apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
    getSessions: () => apiRequest<Array<{
        id: string;
        deviceName?: string | null;
        userAgent?: string | null;
        ipAddress?: string | null;
        isActive: boolean;
        createdAt: string;
        lastSeenAt?: string | null;
        expiresAt: string;
        revokedAt?: string | null;
        isCurrent: boolean;
    }>>('/auth/sessions'),
    revokeSession: (id: string) => apiRequest<{ ok: boolean }>(`/auth/sessions/${id}`, { method: 'DELETE' }),
    revokeOtherSessions: () => apiRequest<{ ok: boolean }>('/auth/sessions/revoke-others', { method: 'POST' }),
    initiateMfaSetup: () => apiRequest<{ setupToken: string; secret: string; otpAuthUrl: string }>('/auth/mfa/setup/initiate', { method: 'POST' }),
    confirmMfaSetup: (setupToken: string, code: string) =>
        apiRequest<{ ok: boolean }>('/auth/mfa/setup/confirm', { method: 'POST', body: JSON.stringify({ setupToken, code }) }),
    disableMfa: (code: string) =>
        apiRequest<{ ok: boolean }>('/auth/mfa/disable', { method: 'POST', body: JSON.stringify({ code }) }),
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
    validateCoupon: (data: { code: string; branchId?: string; orderType: string; subtotal: number; customerId?: string }) =>
        apiRequest<{
            valid: boolean;
            message: string;
            code?: string;
            discountType?: 'PERCENT' | 'FIXED';
            discountValue?: number;
            discountAmount?: number;
            discountPercent?: number;
        }>('/orders/coupons/validate', { method: 'POST', body: JSON.stringify(data) }),
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
    transferStock: (data: { item_id: string; from_warehouse_id: string; to_warehouse_id: string; quantity: number; reason?: string; actor_id?: string; reference_id?: string }) =>
        apiRequest<any>('/inventory/stock/transfer', { method: 'POST', body: JSON.stringify(data) }),
    getTransfers: (limit?: number) => apiRequest<any[]>(`/inventory/stock/transfers${limit ? `?limit=${limit}` : ''}`),
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
// Delivery API
// ============================================================================

export const deliveryApi = {
    getZones: (branchId?: string) => apiRequest<any[]>(`/delivery/zones${branchId ? `?branchId=${branchId}` : ''}`),
    getAvailableDrivers: (branchId?: string) => apiRequest<any[]>(`/delivery/drivers${branchId ? `?branchId=${branchId}` : ''}`),
    getDrivers: (params?: { branchId?: string; status?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/delivery/drivers/all${query ? `?${query}` : ''}`);
    },
    assign: (data: { orderId: string; driverId: string }) => apiRequest<any>('/delivery/assign', { method: 'POST', body: JSON.stringify(data) }),
    updateDriverStatus: (id: string, status: string) => apiRequest<any>(`/delivery/drivers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// ============================================================================
// Campaigns API
// ============================================================================

export const campaignsApi = {
    getAll: () => apiRequest<any[]>('/campaigns'),
    getStats: () => apiRequest<any>('/campaigns/stats'),
    create: (data: any) => apiRequest<any>('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest<any>(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest<any>(`/campaigns/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Analytics API
// ============================================================================

export const analyticsApi = {
    getBranchPerformance: (params?: { branchId?: string; startDate?: string; endDate?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/analytics/branches${query ? `?${query}` : ''}`);
    },
};

// ============================================================================
// HR API
// ============================================================================

export const hrApi = {
    getEmployees: () => apiRequest<any[]>('/hr/employees'),
    upsertEmployee: (data: any) => apiRequest<any>('/hr/employees', { method: 'POST', body: JSON.stringify(data) }),
    getAttendance: (params?: { employeeId?: string; branchId?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/hr/attendance${query ? `?${query}` : ''}`);
    },
    clockIn: (data: { employeeId: string; branchId?: string; deviceId?: string }) =>
        apiRequest<any>('/hr/attendance/clock-in', { method: 'POST', body: JSON.stringify(data) }),
    clockOut: (data: { employeeId: string }) =>
        apiRequest<any>('/hr/attendance/clock-out', { method: 'POST', body: JSON.stringify(data) }),
    payrollSummary: (params: { employeeId: string; startDate: string; endDate: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any>(`/hr/payroll/summary?${query}`);
    },
    getPayrollCycles: () => apiRequest<any[]>('/hr/payroll/cycles'),
    getPayouts: () => apiRequest<any[]>('/hr/payroll/payouts'),
    executePayroll: (data: { startDate: string; endDate: string; branchId?: string }) =>
        apiRequest<any>('/hr/payroll/execute', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================================================
// Finance Engine API
// ============================================================================

export const financeApi = {
    getAccounts: () => apiRequest<any[]>('/finance/accounts'),
    getJournal: (limit?: number) => apiRequest<any[]>(`/finance/journal${limit ? `?limit=${limit}` : ''}`),
    createJournal: (data: { description: string; amount: number; debitAccountCode: string; creditAccountCode: string; referenceId?: string; source?: string; metadata?: any }) =>
        apiRequest<any>('/finance/journal', { method: 'POST', body: JSON.stringify(data) }),
    getTrialBalance: () => apiRequest<{ accounts: any[]; totals: { debit: number; credit: number }; balanced: boolean }>('/finance/trial-balance'),
    getReconciliations: () => apiRequest<any[]>('/finance/reconciliations'),
    createReconciliation: (data: { accountCode: string; statementDate: string; statementBalance: number; notes?: string }) =>
        apiRequest<any>('/finance/reconciliations', { method: 'POST', body: JSON.stringify(data) }),
    resolveReconciliation: (id: string, data?: { adjustWithJournal?: boolean; adjustmentAccountCode?: string; notes?: string }) =>
        apiRequest<any>(`/finance/reconciliations/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data || {}) }),
    getPeriodCloses: () => apiRequest<any[]>('/finance/period-closes'),
    closePeriod: (data: { periodStart: string; periodEnd: string }) =>
        apiRequest<any>('/finance/period-close', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================================================
// Production API
// ============================================================================

export const productionApi = {
    getOrders: (params?: { status?: string; branchId?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/production/orders${query ? `?${query}` : ''}`);
    },
    createOrder: (data: { targetItemId: string; quantityRequested: number; warehouseId: string; actorId?: string }) =>
        apiRequest<any>('/production/orders', { method: 'POST', body: JSON.stringify(data) }),
    startOrder: (id: string, data?: { actorId?: string }) =>
        apiRequest<any>(`/production/orders/${id}/start`, { method: 'PUT', body: JSON.stringify(data || {}) }),
    completeOrder: (id: string, data: { quantityProduced: number; actorId?: string }) =>
        apiRequest<any>(`/production/orders/${id}/complete`, { method: 'PUT', body: JSON.stringify(data) }),
    cancelOrder: (id: string, data?: { actorId?: string }) =>
        apiRequest<any>(`/production/orders/${id}/cancel`, { method: 'PUT', body: JSON.stringify(data || {}) }),
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
    getOverview: (params: { branchId?: string; startDate: string; endDate: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<{ orderCount: number; grossSales: number; netSales: number; taxTotal: number; discountTotal: number; serviceChargeTotal: number }>(`/reports/overview?${query}`);
    },
    getProfitSummary: (params: { branchId?: string; startDate: string; endDate: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<{ grossSales: number; netSales: number; taxTotal: number; orderCount: number; cogs: number; grossProfit: number; foodCostPercent: number }>(`/reports/profit-summary?${query}`);
    },
    getProfitDaily: (params: { branchId?: string; startDate: string; endDate: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<Array<{ day: string; revenue: number; net: number; tax: number; orderCount: number; cogs: number; grossProfit: number }>>(`/reports/profit-daily?${query}`);
    },
    getFoodCost: (params: { branchId?: string; startDate: string; endDate: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<Array<{ id: string; name: string; price: number; cost: number; margin: number; marginPercent: number; soldQty: number; soldRevenue: number }>>(`/reports/food-cost?${query}`);
    },
    getDashboardKpis: (params: { branchId?: string; startDate: string; endDate: string; scope?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL' }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<{
            branchId: string;
            scope: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL';
            period: { start: string; end: string };
            totals: {
                revenue: number;
                paidRevenue: number;
                discounts: number;
                orderCount: number;
                avgTicket: number;
                uniqueCustomers: number;
                itemsSold: number;
                cancelled: number;
                pending: number;
                delivered: number;
                cancelRate: number;
            };
            trendData: Array<{ name: string; revenue: number }>;
            paymentBreakdown: Array<{ name: string; value: number }>;
            orderTypeBreakdown: Array<{ name: string; value: number }>;
            categoryData: Array<{ name: string; value: number }>;
            topItems: Array<{ name: string; qty: number; revenue: number }>;
            branchPerformance: Array<{ branchId: string; branchName: string; orders: number; revenue: number; avgTicket: number }>;
            topCustomers: Array<{ id: string; name: string; visits: number; totalSpent: number }>;
            reportParity: {
                overview: {
                    orderCount: number;
                    grossSales: number;
                    netSales: number;
                    taxTotal: number;
                    discountTotal: number;
                    serviceChargeTotal: number;
                };
            };
        }>(`/reports/dashboard-kpis?${query}`);
    },
    getIntegrity: (params: { branchId?: string; startDate: string; endDate: string; reportType?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any>(`/reports/integrity?${query}`);
    },
    exportCsv: (params: { branchId?: string; startDate: string; endDate: string; reportType?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequestBlob(`/reports/export/csv?${query}`);
    },
    exportPdf: (params: { branchId?: string; startDate: string; endDate: string; reportType?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequestBlob(`/reports/export/pdf?${query}`);
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
// Day Close API
// ============================================================================

export const dayCloseApi = {
    getReport: (branchId: string, date: string) => apiRequest<any>(`/day-close/${branchId}/${date}`),
    getHistory: (branchId: string, limit = 30) => apiRequest<any[]>(`/day-close/${branchId}/history?limit=${limit}`),
    close: (branchId: string, date: string, payload?: { notes?: string; enforceFiscalClean?: boolean; emailConfig?: any }) =>
        apiRequest<{ success: boolean; message: string; report: any }>(`/day-close/${branchId}/${date}/close`, {
            method: 'POST',
            body: JSON.stringify(payload || {}),
        }),
    sendEmail: (branchId: string, date: string, emailConfig: { to: string[]; cc?: string[]; subject: string; includeReports: Array<'sales' | 'payments' | 'audit'> }) =>
        apiRequest<{ success: boolean; message: string }>(`/day-close/${branchId}/${date}/send-email`, {
            method: 'POST',
            body: JSON.stringify({ emailConfig }),
        }),
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
// Printers API
// ============================================================================

export const printersApi = {
    getAll: (params?: { branchId?: string; active?: boolean }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/printers${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest<any>(`/printers/${id}`),
    create: (data: any) => apiRequest<any>('/printers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest<any>(`/printers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    heartbeat: (id: string) => apiRequest<{ id: string; online: boolean; printer: any }>(`/printers/${id}/heartbeat`, { method: 'POST' }),
    delete: (id: string) => apiRequest<any>(`/printers/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Tables API
// ============================================================================

export const tablesApi = {
    getAll: (branchId: string) => apiRequest<any[]>(`/tables?branchId=${branchId}`),
    getZones: (branchId: string) => apiRequest<any[]>(`/tables/zones?branchId=${branchId}`),
    saveLayout: (data: { branchId: string; zones: any[]; tables: any[] }) =>
        apiRequest<any>('/tables/layout', { method: 'POST', body: JSON.stringify(data) }),
    transfer: (data: { sourceTableId: string; targetTableId: string }) =>
        apiRequest<any>('/tables/transfer', { method: 'POST', body: JSON.stringify(data) }),
    split: (data: { sourceTableId: string; targetTableId: string; items: Array<{ name: string; price: number; quantity: number }> }) =>
        apiRequest<any>('/tables/split', { method: 'POST', body: JSON.stringify(data) }),
    merge: (data: { sourceTableId: string; targetTableId: string; items: Array<{ name: string; price: number; quantity: number }> }) =>
        apiRequest<any>('/tables/merge', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, currentOrderId?: string) =>
        apiRequest<any>(`/tables/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, currentOrderId }) }),
};

// ============================================================================
// AI API
// ============================================================================

export const aiApi = {
    getInsights: (branchId?: string) => {
        const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
        return apiRequest<{ insight: string }>(`/ai/insights${query}`);
    },
    executeAction: (data: { actionType: string; parameters?: Record<string, any>; explanation?: string }) =>
        apiRequest<{ success: boolean; message: string; actionId: string }>('/ai/execute', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// ============================================================================
// Ops API
// ============================================================================

export const opsApi = {
    getRealtimeHealth: () =>
        apiRequest<{
            ok: boolean;
            timestamp: string;
            database: { ok: boolean; latencyMs: number };
            socket: Record<string, any>;
        }>('/ops/realtime-health'),
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
    delivery: deliveryApi,
    campaigns: campaignsApi,
    analytics: analyticsApi,
    hr: hrApi,
    financeEngine: financeApi,
    reports: reportsApi,
    fiscal: fiscalApi,
    dayClose: dayCloseApi,
    wastage: wastageApi,
    suppliers: suppliersApi,
    purchaseOrders: purchaseOrdersApi,
    printers: printersApi,
    tables: tablesApi,
    ai: aiApi,
    ops: opsApi,
};


