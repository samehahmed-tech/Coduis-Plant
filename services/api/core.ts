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

const handleUnauthorizedToken = (endpoint: string) => {
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

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const tryRefreshToken = async (): Promise<string | null> => {
    if (isRefreshing && refreshPromise) return refreshPromise;
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            if (!response.ok) return null;
            const data = await response.json();
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

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    if (API_DEBUG) {
        console.log(`API Request: ${options.method || 'GET'} ${url}`);
    }

    const authToken = getAuthToken();
    const config: RequestInit = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ code: `HTTP_${response.status}`, message: 'Request failed' }));

            if (response.status === 401 && !endpoint.startsWith('/auth/')) {
                const newToken = await tryRefreshToken();
                if (newToken) {
                    const retryResponse = await fetch(url, {
                        ...options,
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${newToken}`,
                            ...options.headers,
                        },
                    });
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

        return await response.json();
    } catch (error: any) {
        if (!error?.silent && API_DEBUG) {
            console.error(`API Error [${endpoint}]:`, error.message);
        }
        if (!error?.silent && API_DEBUG && error.message?.includes('Unexpected token')) {
            console.error('Hint: The server might be returning an HTML page. Check if the backend is running and the API URL is correct.');
        }
        throw error;
    }
}

export async function apiRequestBlob(
    endpoint: string,
    options: RequestInit = {},
): Promise<Blob> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const authToken = getAuthToken();
    const config: RequestInit = {
        ...options,
        headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...options.headers,
        },
    };
    const response = await fetch(url, config);
    if (!response.ok) {
        const text = await response.text().catch(() => 'Request failed');
        throw toAppApiError({ message: text || 'Request failed' }, response.status, endpoint);
    }
    return response.blob();
}

export const checkHealth = async () => {
    try {
        return await apiRequest<{ status: string; timestamp: string; database?: string }>('/health');
    } catch {
        return { status: 'down', timestamp: new Date().toISOString() };
    }
};
