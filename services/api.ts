// API Client for Restaurant ERP
// Connects frontend to backend API

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const IS_DEV = import.meta.env.DEV;
const API_DEBUG = IS_DEV && import.meta.env.VITE_DEBUG_API === 'true';

export type AppApiError = Error & {
    status?: number;
    endpoint?: string;
    code?: string;
    requestId?: string;
    details?: any;
    silent?: boolean;
};

const toAppApiError = (
    payload: any,
    status: number,
    endpoint: string,
): AppApiError => {
    const code = String(payload?.code || payload?.error || `HTTP_${status}`);
    const message = String(payload?.message || payload?.error || code);
    const err = new Error(message) as AppApiError;
    err.status = status;
    err.endpoint = endpoint;
    err.code = code;
    err.requestId = payload?.requestId ? String(payload.requestId) : undefined;
    err.details = payload?.details;
    return err;
};

export const getActionableErrorMessage = (error: any, lang: 'en' | 'ar' = 'en') => {
    const code = String(error?.code || error?.message || '').toUpperCase();
    const fallback = lang === 'ar' ? 'حدث خطأ غير متوقع. حاول مرة أخرى.' : 'Unexpected error. Please try again.';
    const mapAr: Record<string, string> = {
        ORDER_VERSION_CONFLICT: 'الطلب تم تعديله من جهاز آخر. تم تحديث البيانات، حاول مرة أخرى.',
        FORBIDDEN: 'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
        FORBIDDEN_BRANCH_SCOPE: 'لا يمكن تنفيذ الإجراء خارج فرعك الحالي.',
        STATUS_TRANSITION_FORBIDDEN: 'ليس لديك صلاحية تغيير حالة الطلب إلى هذه الحالة.',
        INVALID_STATUS_TRANSITION: 'لا يمكن نقل الطلب لهذه الحالة مباشرة.',
        CANCELLATION_REASON_REQUIRED: 'سبب الإلغاء مطلوب قبل إلغاء الطلب.',
        SHIFT_REQUIRED: 'لا يوجد شيفت مفتوح. افتح شيفت أولاً ثم أعد المحاولة.',
        IDEMPOTENCY_KEY_PAYLOAD_CONFLICT: 'تم إرسال نفس العملية ببيانات مختلفة. راجع الطلب وأعد الإرسال.',
        IDEMPOTENCY_KEY_IN_PROGRESS: 'جاري تنفيذ نفس العملية بالفعل. انتظر لحظات ثم حدّث الشاشة.',
        TOO_MANY_LOGIN_ATTEMPTS: 'محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.',
        VALIDATION_ERROR: 'بعض البيانات غير صحيحة. راجع المدخلات.',
    };
    const mapEn: Record<string, string> = {
        ORDER_VERSION_CONFLICT: 'Order was updated from another device. Data was refreshed, please retry.',
        FORBIDDEN: 'You do not have permission to perform this action.',
        FORBIDDEN_BRANCH_SCOPE: 'Action is not allowed outside your branch scope.',
        STATUS_TRANSITION_FORBIDDEN: 'You are not allowed to move order to this status.',
        INVALID_STATUS_TRANSITION: 'This order status transition is not allowed.',
        CANCELLATION_REASON_REQUIRED: 'Cancellation reason is required before cancelling this order.',
        SHIFT_REQUIRED: 'No active shift. Open a shift first, then retry.',
        IDEMPOTENCY_KEY_PAYLOAD_CONFLICT: 'Same request key used with different payload. Review and retry.',
        IDEMPOTENCY_KEY_IN_PROGRESS: 'Same request is still processing. Wait and refresh.',
        TOO_MANY_LOGIN_ATTEMPTS: 'Too many attempts. Please wait and retry.',
        VALIDATION_ERROR: 'Some fields are invalid. Please review your input.',
    };
    const mapped = (lang === 'ar' ? mapAr : mapEn)[code];
    if (mapped) return mapped;
    return error?.message || fallback;
};

const getAuthToken = () => {
    try {
        return localStorage.getItem('auth_token');
    } catch {
        return null;
    }
};

const getRefreshToken = () => {
    try {
        return localStorage.getItem('auth_refresh_token');
    } catch {
        return null;
    }
};

const setAuthToken = (token: string) => {
    try { localStorage.setItem('auth_token', token); } catch { /* */ }
};

const setRefreshToken = (token: string) => {
    try { localStorage.setItem('auth_refresh_token', token); } catch { /* */ }
};

const handleUnauthorizedToken = (endpoint: string) => {
    // Ignore explicit auth endpoints; they have their own UX handling.
    if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/mfa') || endpoint.startsWith('/auth/refresh') || endpoint.startsWith('/setup/')) return;
    try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
    } catch {
        // ignore storage errors
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('restoflow:auth-invalid', { detail: { endpoint } }));
    }
};

// Refresh token lock to prevent concurrent refresh calls
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const tryRefreshToken = async (): Promise<string | null> => {
    if (isRefreshing && refreshPromise) return refreshPromise;
    const rt = getRefreshToken();
    if (!rt) return null;

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const url = `${API_BASE_URL}/auth/refresh`;
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: rt }),
            });
            if (!resp.ok) return null;
            const data = await resp.json();
            if (data.token) {
                setAuthToken(data.token);
                return data.token as string;
            }
            return null;
        } catch {
            return null;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();
    return refreshPromise;
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
    if (API_DEBUG) {
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
            const error = await response.json().catch(() => ({ code: `HTTP_${response.status}`, message: 'Request failed' }));

            // Auto-refresh on 401 (except auth endpoints themselves)
            if (response.status === 401 && !endpoint.startsWith('/auth/')) {
                const newToken = await tryRefreshToken();
                if (newToken) {
                    // Retry the original request with the new token
                    const retryConfig: RequestInit = {
                        ...options,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${newToken}`,
                            ...options.headers,
                        },
                    };
                    const retryResponse = await fetch(url, retryConfig);
                    if (retryResponse.ok) {
                        return await retryResponse.json();
                    }
                }
                handleUnauthorizedToken(endpoint);
            }

            const err = toAppApiError(error, response.status, endpoint);
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
        if (!error?.silent && API_DEBUG) {
            console.error(`API Error [${endpoint}]:`, error.message);
        }
        // If it's a syntax error with '<', it's likely we hit an HTML page instead of JSON
        if (!error?.silent && API_DEBUG && error.message?.includes('Unexpected token')) {
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
        const err = toAppApiError({ message: text || 'Request failed' }, response.status, endpoint);
        throw err;
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
        apiRequest<{ token?: string; refreshToken?: string; user?: any; mfaRequired?: boolean; mfaToken?: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, deviceName }) }),
    verifyMfa: (mfaToken: string, code: string, deviceName?: string) =>
        apiRequest<{ token: string; refreshToken: string; user: any }>('/auth/mfa/verify', { method: 'POST', body: JSON.stringify({ mfaToken, code, deviceName }) }),
    pinLogin: (pin: string, branchId?: string, deviceName?: string) =>
        apiRequest<{ token: string; refreshToken: string; user: any }>('/auth/pin-login', { method: 'POST', body: JSON.stringify({ pin, branchId, deviceName }) }),
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
    // Optional idempotencyKey is used by offline sync retries to avoid duplicate server writes.
    getAll: (params?: { status?: string; branch_id?: string; type?: string; date?: string; limit?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/orders${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest<any>(`/orders/${id}`),
    create: (order: any, options?: { idempotencyKey?: string }) => apiRequest<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
        ...(options?.idempotencyKey ? { headers: { 'Idempotency-Key': options.idempotencyKey } } : {}),
    }),
    updateStatus: (
        id: string,
        data: { status: string; changed_by?: string; notes?: string; expected_updated_at?: string; expectedUpdatedAt?: string },
        options?: { idempotencyKey?: string },
    ) =>
        apiRequest<any>(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...(options?.idempotencyKey ? { headers: { 'Idempotency-Key': options.idempotencyKey } } : {}),
        }),
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
    updateStock: (data: { item_id: string; warehouse_id: string; quantity: number; type: string; reason?: string; actor_id?: string; reference_id?: string }) =>
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
    getTelemetry: (branchId?: string) => apiRequest<Array<{
        driverId: string;
        branchId?: string | null;
        lat: number;
        lng: number;
        speedKmh?: number;
        accuracy?: number;
        updatedAt: string;
    }>>(`/delivery/telemetry${branchId ? `?branchId=${branchId}` : ''}`),
    updateDriverLocation: (id: string, data: { lat: number; lng: number; speedKmh?: number; accuracy?: number }) =>
        apiRequest<any>(`/delivery/drivers/${id}/location`, { method: 'PUT', body: JSON.stringify(data) }),
    getSlaAlerts: (params?: { branchId?: string; delayMinutes?: number; staleLocationMinutes?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<{ branchId: string; total: number; alerts: any[] }>(`/delivery/sla-alerts${query ? `?${query}` : ''}`);
    },
    autoEscalateSlaAlerts: (data?: { branchId?: string; delayMinutes?: number; staleLocationMinutes?: number }) =>
        apiRequest<{ scanned: number; escalated: number; branchId: string; escalations: any[] }>(
            '/delivery/sla-alerts/escalate',
            { method: 'POST', body: JSON.stringify(data || {}) }
        ),
    assign: (data: { orderId: string; driverId: string }) => apiRequest<any>('/delivery/assign', { method: 'POST', body: JSON.stringify(data) }),
    updateDriverStatus: (id: string, status: string) => apiRequest<any>(`/delivery/drivers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// ============================================================================
// Call Center Supervisor API
// ============================================================================

export const callCenterSupervisorApi = {
    getEscalations: (params?: { status?: 'OPEN' | 'RESOLVED'; branchId?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/call-center/escalations${query ? `?${query}` : ''}`);
    },
    createEscalation: (data: { orderId: string; branchId?: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; reason: string; notes?: string; assignedTo?: string }) =>
        apiRequest<any>('/call-center/escalations', { method: 'POST', body: JSON.stringify(data) }),
    scanEscalations: (data?: { thresholdMinutes?: number; branchId?: string }) =>
        apiRequest<{ scanned: number; created: number; thresholdMinutes: number; branchId: string; escalations: any[] }>(
            '/call-center/escalations/scan',
            { method: 'POST', body: JSON.stringify(data || {}) },
        ),
    resolveEscalation: (id: string, resolutionNotes?: string) =>
        apiRequest<any>(`/call-center/escalations/${id}/resolve`, { method: 'PUT', body: JSON.stringify({ resolutionNotes }) }),
    getCoachingNotes: (params?: { agentId?: string; branchId?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any[]>(`/call-center/coaching-notes${query ? `?${query}` : ''}`);
    },
    addCoachingNote: (data: { agentId: string; branchId?: string; note: string; tags?: string[] }) =>
        apiRequest<any>('/call-center/coaching-notes', { method: 'POST', body: JSON.stringify(data) }),
    getDiscountAbuse: (params?: { branchId?: string; startDate?: string; endDate?: string; thresholdPercent?: number; thresholdAmount?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any>(`/call-center/discount-abuse${query ? `?${query}` : ''}`);
    },
    approveDiscountViolation: (data: { orderId: string; agentId?: string; branchId?: string; status?: 'APPROVED' | 'REJECTED'; reason?: string }) =>
        apiRequest<any>('/call-center/discount-abuse/approve', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================================================
// Campaigns API
// ============================================================================

export const campaignsApi = {
    getAll: () => apiRequest<any[]>('/campaigns'),
    getStats: () => apiRequest<any>('/campaigns/stats'),
    create: (data: any) => apiRequest<any>('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
    dispatch: (id: string, data: { mode?: 'DRY_RUN' | 'SEND'; phones?: string[]; customerIds?: string[]; message?: string }) =>
        apiRequest<{
            ok: boolean;
            campaignId: string;
            method: 'SMS' | 'Email' | 'Push' | 'WHATSAPP';
            dryRun: boolean;
            recipients: number;
            sent: number;
            failed: number;
            dispatchId: string;
        }>(`/campaigns/${id}/dispatch`, { method: 'POST', body: JSON.stringify(data) }),
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
    // Financial Statements
    getProfitAndLoss: (params?: { start?: string; end?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any>(`/finance/statements/pnl${query ? `?${query}` : ''}`);
    },
    getBalanceSheet: (date?: string) =>
        apiRequest<any>(`/finance/statements/balance-sheet${date ? `?date=${date}` : ''}`),
    getCashFlow: (params?: { start?: string; end?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any>(`/finance/statements/cash-flow${query ? `?${query}` : ''}`);
    },
    getAccountsReceivable: () => apiRequest<any>('/finance/statements/ar'),
    getAccountsPayable: () => apiRequest<any>('/finance/statements/ap'),
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
    getReadiness: (branchId?: string) =>
        apiRequest<{
            ok: boolean;
            branchId: string;
            period: { from: string; to: string };
            config: { ok: boolean; missing: string[] };
            metrics24h: { submitted: number; pending: number; failed: number; total: number; successRate: number };
            deadLetter: { pendingCount: number; oldestPendingAgeMinutes: number };
            alerts: { configMissing: boolean; lowSuccessRate: boolean; hasPendingDlq: boolean; stalePendingDlq: boolean };
        }>(`/fiscal/readiness${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''}`),
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
    saveLayout: (data: { branchId: string; zones: any[]; tables: any[]; reference_id?: string }) =>
        apiRequest<any>('/tables/layout', { method: 'POST', body: JSON.stringify(data) }),
    transfer: (data: { sourceTableId: string; targetTableId: string; reference_id?: string }) =>
        apiRequest<any>('/tables/transfer', { method: 'POST', body: JSON.stringify(data) }),
    split: (data: { sourceTableId: string; targetTableId: string; items: Array<{ name: string; price: number; quantity: number }>; reference_id?: string }) =>
        apiRequest<any>('/tables/split', { method: 'POST', body: JSON.stringify(data) }),
    merge: (data: { sourceTableId: string; targetTableId: string; items: Array<{ name: string; price: number; quantity: number }>; reference_id?: string }) =>
        apiRequest<any>('/tables/merge', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, currentOrderId?: string, reference_id?: string) =>
        apiRequest<any>(`/tables/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, currentOrderId, reference_id }) }),
};

// ============================================================================
// AI API
// ============================================================================

export const aiApi = {
    getInsights: (branchId?: string) => {
        const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
        return apiRequest<{ insight: string }>(`/ai/insights${query}`);
    },
    chat: (data: { message: string; context?: Record<string, any>; lang?: 'en' | 'ar' }) =>
        apiRequest<{ text: string; actions: any[]; suggestion?: any | null }>('/ai/chat', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    previewAction: (data: { action: Record<string, any> } | { actionType: string; parameters?: Record<string, any> }) =>
        apiRequest<{ guarded: any; allowed: boolean }>('/ai/action-preview', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    actionExecute: (data: { action: Record<string, any>; explanation?: string } | { actionType: string; parameters?: Record<string, any>; explanation?: string }) =>
        apiRequest<{ success: boolean; message: string; actionId: string; guarded?: any; result?: any }>('/ai/action-execute', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    // Legacy compatibility wrapper
    executeAction: (data: { actionType: string; parameters?: Record<string, any>; explanation?: string }) =>
        apiRequest<{ success: boolean; message: string; actionId: string }>('/ai/execute', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    getKeyConfig: () =>
        apiRequest<{
            provider: 'OPENROUTER' | 'OLLAMA';
            providerOptions: Array<{ id: 'OPENROUTER' | 'OLLAMA'; label: string }>;
            ollama: { enabled: boolean; baseUrl: string; model: string; modelDefault: string };
            source: 'DEFAULT' | 'CUSTOM';
            hasCustomKey: boolean;
            maskedCustomKey: string | null;
            usingDefaultAvailable: boolean;
            model: string;
            defaultModel: string;
            availableModels: Array<{ id: string; label: string; provider: string }>;
        }>('/ai/key-config'),
    updateKeyConfig: (data: { source: 'DEFAULT' | 'CUSTOM'; customKey?: string; model?: string; provider?: 'OPENROUTER' | 'OLLAMA'; ollamaModel?: string }) =>
        apiRequest<{
            provider: 'OPENROUTER' | 'OLLAMA';
            providerOptions: Array<{ id: 'OPENROUTER' | 'OLLAMA'; label: string }>;
            ollama: { enabled: boolean; baseUrl: string; model: string; modelDefault: string };
            source: 'DEFAULT' | 'CUSTOM';
            hasCustomKey: boolean;
            maskedCustomKey: string | null;
            usingDefaultAvailable: boolean;
            model: string;
            defaultModel: string;
            availableModels: Array<{ id: string; label: string; provider: string }>;
        }>('/ai/key-config', {
            method: 'PUT',
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
    getGoLiveSummary: () =>
        apiRequest<{
            ok: boolean;
            generatedAt: string;
            blockers: any;
            launchGates: any;
            uat: any;
            rollback: any;
            evidence: any;
            daily: any;
        }>('/ops/go-live/summary'),
    refreshGoLiveReports: () => apiRequest<{ ok: boolean; blockers: any }>('/ops/go-live/refresh', { method: 'POST' }),
    updateUatSignoffArtifact: (data: any) => apiRequest<{ ok: boolean }>('/ops/go-live/uat-signoff', { method: 'PUT', body: JSON.stringify(data) }),
    updateRollbackDrillArtifact: (data: any) => apiRequest<{ ok: boolean }>('/ops/go-live/rollback-drill', { method: 'PUT', body: JSON.stringify(data) }),
};

// ============================================================================
// Print Gateway API
// ============================================================================

export const printGatewayApi = {
    getJobs: (params?: { branchId?: string; status?: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; limit?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<{ ok: boolean; stats: { queued: number; processing: number; completed: number; failed: number; total: number }; jobs: any[] }>(`/print-gateway/jobs${query ? `?${query}` : ''}`);
    },
    retryJob: (jobId: string) => apiRequest<{ ok: boolean; job: any }>(`/print-gateway/jobs/${jobId}/retry`, { method: 'POST' }),
};

// ============================================================================
// WhatsApp API
// ============================================================================

export const whatsappApi = {
    getStatus: () => apiRequest<{
        ok: boolean;
        provider: 'mock' | 'meta' | 'twilio';
        configured: boolean;
        lastWebhookAt: string | null;
        inboxCount: number;
        openEscalations: number;
    }>('/whatsapp/status'),
    sendTest: (data: { to: string; text: string }) =>
        apiRequest<{ ok: boolean; result: any }>('/whatsapp/send-test', { method: 'POST', body: JSON.stringify(data) }),
    getInbox: (params?: { limit?: number; from?: string; branchId?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<{ ok: boolean; total: number; inbox: any[] }>(`/whatsapp/inbox${query ? `?${query}` : ''}`);
    },
    getEscalations: (status?: 'OPEN' | 'RESOLVED') =>
        apiRequest<{ ok: boolean; total: number; escalations: any[] }>(`/whatsapp/escalations${status ? `?status=${status}` : ''}`),
    resolveEscalation: (id: string, resolutionNotes?: string) =>
        apiRequest<{ ok: boolean; escalation: any }>(`/whatsapp/escalations/${id}/resolve`, {
            method: 'PUT',
            body: JSON.stringify({ resolutionNotes: resolutionNotes || '' }),
        }),
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
    callCenterSupervisor: callCenterSupervisorApi,
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
    printGateway: printGatewayApi,
    whatsapp: whatsappApi,
};

// ============================================================================
// Inventory Intelligence API
// ============================================================================

export const inventoryIntelligenceApi = {
    getReorderAlerts: (warehouseId?: string) =>
        apiRequest<any[]>(`/inventory-intelligence/reorder-alerts${warehouseId ? `?warehouseId=${warehouseId}` : ''}`),
    getPurchaseSuggestions: (warehouseId?: string) =>
        apiRequest<any[]>(`/inventory-intelligence/purchase-suggestions${warehouseId ? `?warehouseId=${warehouseId}` : ''}`),
    convertUnit: (value: number, from: string, to: string) =>
        apiRequest<any>(`/inventory-intelligence/convert-unit?value=${value}&from=${from}&to=${to}`),
    getSupportedUnits: () =>
        apiRequest<string[]>('/inventory-intelligence/supported-units'),
    createStockCount: (warehouseId: string) =>
        apiRequest<any>('/inventory-intelligence/stock-count', { method: 'POST', body: JSON.stringify({ warehouseId }) }),
    updateStockCount: (sessionId: string, counts: { itemId: string; countedQty: number; notes?: string }[]) =>
        apiRequest<any>(`/inventory-intelligence/stock-count/${sessionId}`, { method: 'PUT', body: JSON.stringify({ counts }) }),
    completeStockCount: (sessionId: string, applyAdjustments?: boolean) =>
        apiRequest<any>(`/inventory-intelligence/stock-count/${sessionId}/complete`, { method: 'POST', body: JSON.stringify({ applyAdjustments }) }),
};

// ============================================================================
// Refund API
// ============================================================================

export const refundApi = {
    getRefunds: (filters?: { branchId?: string; status?: string; orderId?: string }) => {
        const query = new URLSearchParams(filters as any).toString();
        return apiRequest<any[]>(`/refunds${query ? `?${query}` : ''}`);
    },
    getRefundById: (id: string) => apiRequest<any>(`/refunds/${id}`),
    requestRefund: (data: {
        orderId: string; type: string; reason: string; reasonCategory: string;
        refundMethod: string; requestedByName?: string;
        items?: { orderItemId: number; quantity: number; reason?: string }[];
        customAmount?: number;
    }) => apiRequest<any>('/refunds', { method: 'POST', body: JSON.stringify(data) }),
    approveRefund: (id: string) =>
        apiRequest<any>(`/refunds/${id}/approve`, { method: 'PUT' }),
    rejectRefund: (id: string, reason: string) =>
        apiRequest<any>(`/refunds/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),
    processRefund: (id: string) =>
        apiRequest<any>(`/refunds/${id}/process`, { method: 'POST' }),
    getPolicy: () => apiRequest<any>('/refunds/policy'),
    updatePolicy: (policy: any) =>
        apiRequest<any>('/refunds/policy', { method: 'PUT', body: JSON.stringify(policy) }),
    getStats: (branchId?: string, startDate?: string, endDate?: string) => {
        const params: any = {};
        if (branchId) params.branchId = branchId;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const query = new URLSearchParams(params).toString();
        return apiRequest<any>(`/refunds/stats${query ? `?${query}` : ''}`);
    },
};

// ============================================================================
// HR Extended API
// ============================================================================

export const hrExtendedApi = {
    getDepartments: () => apiRequest<any[]>('/hr-extended/departments'),
    createDepartment: (data: { name: string; nameAr?: string; managerId?: string }) =>
        apiRequest<any>('/hr-extended/departments', { method: 'POST', body: JSON.stringify(data) }),
    getJobTitles: () => apiRequest<any[]>('/hr-extended/job-titles'),
    createJobTitle: (data: { name: string; nameAr?: string; departmentId?: string }) =>
        apiRequest<any>('/hr-extended/job-titles', { method: 'POST', body: JSON.stringify(data) }),
    getLeaveTypes: () => apiRequest<any[]>('/hr-extended/leave-types'),
    getLeaveRequests: (filters?: { employeeId?: string; status?: string }) => {
        const query = new URLSearchParams(filters as any).toString();
        return apiRequest<any[]>(`/hr-extended/leave-requests${query ? `?${query}` : ''}`);
    },
    createLeaveRequest: (data: {
        employeeId: string; employeeName: string; leaveTypeId: string;
        startDate: string; endDate: string; reason: string;
    }) => apiRequest<any>('/hr-extended/leave-requests', { method: 'POST', body: JSON.stringify(data) }),
    approveLeave: (id: string) =>
        apiRequest<any>(`/hr-extended/leave-requests/${id}/approve`, { method: 'PUT' }),
    rejectLeave: (id: string, reason: string) =>
        apiRequest<any>(`/hr-extended/leave-requests/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),
    getLeaveBalance: (employeeId: string) =>
        apiRequest<any[]>(`/hr-extended/leave-balance/${employeeId}`),
    getOvertimeEntries: (filters?: { employeeId?: string; status?: string; month?: string }) => {
        const query = new URLSearchParams(filters as any).toString();
        return apiRequest<any[]>(`/hr-extended/overtime${query ? `?${query}` : ''}`);
    },
    recordOvertime: (data: {
        employeeId: string; date: string; regularHours: number;
        overtimeHours: number; overtimeRate?: number; baseSalaryPerHour?: number;
    }) => apiRequest<any>('/hr-extended/overtime', { method: 'POST', body: JSON.stringify(data) }),
    approveOvertime: (id: string) =>
        apiRequest<any>(`/hr-extended/overtime/${id}/approve`, { method: 'PUT' }),
};

// ============================================================================
// Main API Export
// ============================================================================

export const api = {
    auth: authApi,
    users: usersApi,
    branches: branchesApi,
    customers: customersApi,
    menu: menuApi,
    orders: ordersApi,
    inventory: inventoryApi,
    shifts: shiftsApi,
    settings: settingsApi,
    delivery: deliveryApi,
    callCenterSupervisor: callCenterSupervisorApi,
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
    printGateway: printGatewayApi,
    whatsapp: whatsappApi,
    inventoryIntelligence: inventoryIntelligenceApi,
    refunds: refundApi,
    hrExtended: hrExtendedApi,
};
