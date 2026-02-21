// Auth Store - Connected to Database API (Production Ready)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AppSettings, AppPermission, UserRole, INITIAL_ROLE_PERMISSIONS, Branch, Printer } from '../types';
import { usersApi, branchesApi, settingsApi, authApi, printersApi } from '../services/api';
import { localDb } from '../db/localDb';
import { syncService } from '../services/syncService';

interface AuthState {
    settings: AppSettings;
    branches: Branch[];
    printers: Printer[];
    users: User[];
    isAuthenticated: boolean;
    token: string | null;
    isSidebarCollapsed: boolean;
    isLoading: boolean;
    error: string | null;

    // Async Actions (API)
    loginWithPassword: (email: string, password: string) => Promise<User>;
    restoreSession: () => Promise<void>;
    fetchUsers: () => Promise<void>;
    fetchBranches: () => Promise<void>;
    fetchSettings: () => Promise<void>;
    fetchPrinters: () => Promise<void>;
    createUser: (user: User) => Promise<void>;
    updateUserInDB: (user: User) => Promise<void>;
    deleteUserFromDB: (id: string) => Promise<void>;
    createPrinterInDB: (printer: Printer) => Promise<void>;
    updatePrinterInDB: (printer: Printer) => Promise<void>;
    deletePrinterFromDB: (id: string) => Promise<void>;
    heartbeatPrinterInDB: (id: string) => Promise<boolean>;
    createBranch: (branch: Branch) => Promise<void>;
    syncToDatabase: () => Promise<void>;

    // Local Actions
    login: (user: User) => void;
    logout: () => void;
    updateSettings: (settings: Partial<AppSettings>) => void;
    hasPermission: (permission: AppPermission) => boolean;
    setActiveBranch: (branchId: string) => void;
    setBranches: (branches: Branch[]) => void;
    setPrinters: (printers: Printer[]) => void;
    updateUsers: (users: User[]) => void;
    updatePrinters: (printers: Printer[]) => void;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    clearError: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
    restaurantName: 'Restaurant ERP',
    currency: 'EGP',
    currencySymbol: 'ج.م',
    taxRate: 14,
    serviceCharge: 0,
    language: 'ar',
    isDarkMode: true,
    isTouchMode: false,
    theme: 'xen',
    branchAddress: '',
    phone: '',
    receiptLogoUrl: '',
    receiptQrUrl: '',
    receiptBrandingByOrderType: {},
    primaryCashierPrinterId: '',
    autoPrintReceiptOnSubmit: false,
    autoPrintCompletionReceipt: true,
    autoPrintReports: true,
    currentUser: undefined,
    activeBranchId: undefined,
    syncAuthority: 'SERVER',
    branchHierarchy: { id: 'central', level: 'MASTER' },
};

// Only keep ONE admin user for first login - rest comes from database
const INITIAL_USERS: User[] = [
    { id: 'u1', name: 'مدير النظام', email: 'admin@coduiszen.com', role: UserRole.SUPER_ADMIN, permissions: INITIAL_ROLE_PERMISSIONS[UserRole.SUPER_ADMIN], isActive: true },
];

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            settings: DEFAULT_SETTINGS,
            branches: [], // Empty - loads from database
            printers: [],
            users: INITIAL_USERS,
            isAuthenticated: false,
            token: null,
            isSidebarCollapsed: false,
            isLoading: false,
            error: null,

            // ============ API Actions ============

            loginWithPassword: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const deviceName = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown-device';
                    const result = await authApi.login(email, password, deviceName);
                    if (result.mfaRequired && result.mfaToken) {
                        const mfaErr: any = new Error('MFA_REQUIRED');
                        mfaErr.code = 'MFA_REQUIRED';
                        mfaErr.mfaToken = result.mfaToken;
                        throw mfaErr;
                    }
                    if (!result.token || !result.user) {
                        throw new Error('INVALID_AUTH_RESPONSE');
                    }
                    const { token, refreshToken, user } = result;

                    if (token) {
                        localStorage.setItem('auth_token', token);
                    }
                    if (refreshToken) {
                        localStorage.setItem('auth_refresh_token', refreshToken);
                    }

                    const mappedUser: User = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions || INITIAL_ROLE_PERMISSIONS[user.role as UserRole] || [],
                        isActive: user.isActive !== false,
                        assignedBranchId: user.assignedBranchId,
                        mfaEnabled: user.mfaEnabled === true,
                    };

                    set((state) => ({
                        token,
                        settings: { ...state.settings, currentUser: mappedUser, activeBranchId: mappedUser.assignedBranchId || state.branches[0]?.id },
                        isAuthenticated: true,
                        isLoading: false
                    }));
                    syncService.syncPending();
                    return mappedUser;
                } catch (error: any) {
                    set({ error: error.message || 'Login failed', isLoading: false });
                    throw error;
                }
            },

            restoreSession: async () => {
                const token = localStorage.getItem('auth_token');
                if (!token) return;
                try {
                    const { user } = await authApi.me();
                    const mappedUser: User = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions || INITIAL_ROLE_PERMISSIONS[user.role as UserRole] || [],
                        isActive: user.isActive !== false,
                        assignedBranchId: user.assignedBranchId,
                        mfaEnabled: user.mfaEnabled === true,
                    };
                    set((state) => ({
                        token,
                        settings: { ...state.settings, currentUser: mappedUser, activeBranchId: mappedUser.assignedBranchId || state.branches[0]?.id },
                        isAuthenticated: true
                    }));
                } catch {
                    const cachedUser = get().settings.currentUser;
                    // Offline fallback only: keep cached session when backend is unreachable and user was previously restored.
                    if (!navigator.onLine && cachedUser) {
                        set((state) => ({
                            token,
                            settings: { ...state.settings, currentUser: cachedUser, activeBranchId: cachedUser.assignedBranchId || state.branches[0]?.id },
                            isAuthenticated: true
                        }));
                    } else {
                        localStorage.removeItem('auth_token');
                        set((state) => ({
                            token: null,
                            isAuthenticated: false,
                            settings: {
                                ...state.settings,
                                currentUser: undefined,
                                activeBranchId: undefined,
                            },
                        }));
                    }
                }
            },

            fetchUsers: async () => {
                set({ isLoading: true });
                try {
                    if (navigator.onLine) {
                        const data = await usersApi.getAll();
                        if (data.length > 0) {
                            const users = data.map((u: any) => ({
                                id: u.id,
                                name: u.name,
                                email: u.email,
                                role: u.role as UserRole,
                                permissions: u.permissions || INITIAL_ROLE_PERMISSIONS[u.role as UserRole] || [],
                                isActive: u.is_active !== false,
                                assignedBranchId: u.assigned_branch_id,
                                mfaEnabled: u.mfa_enabled === true,
                            }));
                            set({ users, isLoading: false });
                            await localDb.users.bulkPut(users);
                        } else {
                            set({ isLoading: false });
                        }
                    } else {
                        const cached = await localDb.users.toArray();
                        if (cached.length > 0) set({ users: cached as User[], isLoading: false });
                        else set({ isLoading: false });
                    }
                } catch (error: any) {
                    set({ isLoading: false });
                    const code = String(error?.code || error?.message || '').toUpperCase();
                    if (code.includes('INVALID_TOKEN') || Number(error?.status) === 401) return;
                    console.error('Failed to fetch users:', error);
                }
            },

            fetchBranches: async () => {
                try {
                    if (navigator.onLine) {
                        const data = await branchesApi.getAll();
                        if (data.length > 0) {
                            const branches = data.map((b: any) => ({
                                id: b.id,
                                name: b.name,
                                location: b.location || b.address,
                                address: b.address,
                                phone: b.phone,
                                isActive: b.is_active !== false,
                            }));
                            set({ branches });
                            await localDb.branches.bulkPut(branches as any[]);
                        }
                    } else {
                        const cached = await localDb.branches.toArray();
                        if (cached.length > 0) set({ branches: cached as Branch[] });
                    }
                } catch (error) {
                    const code = String((error as any)?.code || (error as any)?.message || '').toUpperCase();
                    if (code.includes('INVALID_TOKEN') || Number((error as any)?.status) === 401) return;
                    console.error('Failed to fetch branches:', error);
                }
            },

            fetchSettings: async () => {
                try {
                    if (navigator.onLine) {
                        const data = await settingsApi.getAll();
                        if (Object.keys(data).length > 0) {
                            set((state) => ({
                                settings: {
                                    ...state.settings,
                                    restaurantName: data.restaurantName || state.settings.restaurantName,
                                    phone: data.phone || state.settings.phone,
                                    branchAddress: data.branchAddress || state.settings.branchAddress,
                                    receiptLogoUrl: data.receiptLogoUrl || state.settings.receiptLogoUrl,
                                    receiptQrUrl: data.receiptQrUrl || state.settings.receiptQrUrl,
                                    receiptBrandingByOrderType: data.receiptBrandingByOrderType || state.settings.receiptBrandingByOrderType,
                                    primaryCashierPrinterId: data.primaryCashierPrinterId || state.settings.primaryCashierPrinterId,
                                    autoPrintReceipt: data.autoPrintReceipt ?? state.settings.autoPrintReceipt,
                                    autoPrintReceiptOnSubmit: data.autoPrintReceiptOnSubmit ?? state.settings.autoPrintReceiptOnSubmit,
                                    autoPrintCompletionReceipt: data.autoPrintCompletionReceipt ?? state.settings.autoPrintCompletionReceipt,
                                    autoPrintReports: data.autoPrintReports ?? state.settings.autoPrintReports,
                                    currency: data.currency || state.settings.currency,
                                    taxRate: data.taxRate ?? state.settings.taxRate,
                                    serviceCharge: data.serviceCharge ?? state.settings.serviceCharge,
                                    language: data.language || state.settings.language,
                                    isDarkMode: data.isDarkMode ?? state.settings.isDarkMode,
                                    theme: data.theme || state.settings.theme,
                                    currencySymbol: data.currencySymbol || state.settings.currencySymbol,
                                    isTouchMode: data.isTouchMode ?? state.settings.isTouchMode,
                                }
                            }));
                            await localDb.settings.put({ key: 'app', value: data, updatedAt: Date.now() });
                        }
                    } else {
                        const cached = await localDb.settings.get('app');
                        if (cached?.value) {
                            const data = cached.value;
                            set((state) => ({
                                settings: {
                                    ...state.settings,
                                    restaurantName: data.restaurantName || state.settings.restaurantName,
                                    phone: data.phone || state.settings.phone,
                                    branchAddress: data.branchAddress || state.settings.branchAddress,
                                    receiptLogoUrl: data.receiptLogoUrl || state.settings.receiptLogoUrl,
                                    receiptQrUrl: data.receiptQrUrl || state.settings.receiptQrUrl,
                                    receiptBrandingByOrderType: data.receiptBrandingByOrderType || state.settings.receiptBrandingByOrderType,
                                    primaryCashierPrinterId: data.primaryCashierPrinterId || state.settings.primaryCashierPrinterId,
                                    autoPrintReceipt: data.autoPrintReceipt ?? state.settings.autoPrintReceipt,
                                    autoPrintReceiptOnSubmit: data.autoPrintReceiptOnSubmit ?? state.settings.autoPrintReceiptOnSubmit,
                                    autoPrintCompletionReceipt: data.autoPrintCompletionReceipt ?? state.settings.autoPrintCompletionReceipt,
                                    autoPrintReports: data.autoPrintReports ?? state.settings.autoPrintReports,
                                    currency: data.currency || state.settings.currency,
                                    taxRate: data.taxRate ?? state.settings.taxRate,
                                    serviceCharge: data.serviceCharge ?? state.settings.serviceCharge,
                                    language: data.language || state.settings.language,
                                    isDarkMode: data.isDarkMode ?? state.settings.isDarkMode,
                                    theme: data.theme || state.settings.theme,
                                    currencySymbol: data.currencySymbol || state.settings.currencySymbol,
                                    isTouchMode: data.isTouchMode ?? state.settings.isTouchMode,
                                }
                            }));
                        }
                    }
                } catch (error) {
                    const code = String((error as any)?.code || (error as any)?.message || '').toUpperCase();
                    if (code.includes('INVALID_TOKEN') || Number((error as any)?.status) === 401) return;
                    console.error('Failed to fetch settings:', error);
                }
            },

            fetchPrinters: async () => {
                try {
                    if (!navigator.onLine) return;
                    const data = await printersApi.getAll();
                    const printers = data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        code: p.code || '',
                        type: p.type,
                        address: p.address || '',
                        isActive: p.is_active !== false,
                        branchId: p.branch_id || '',
                        role: p.role || 'OTHER',
                        isPrimaryCashier: p.is_primary_cashier === true,
                        isOnline: p.heartbeat_status ? String(p.heartbeat_status).toUpperCase() === 'ONLINE' : p.is_active !== false,
                        lastHeartbeatAt: p.last_heartbeat_at || undefined,
                    }));
                    set({ printers });
                } catch (error) {
                    const code = String((error as any)?.code || (error as any)?.message || '').toUpperCase();
                    if (code.includes('INVALID_TOKEN') || Number((error as any)?.status) === 401) return;
                    console.error('Failed to fetch printers:', error);
                }
            },

            createUser: async (user) => {
                set({ isLoading: true });
                try {
                    await usersApi.create({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions,
                        assigned_branch_id: user.assignedBranchId,
                        is_active: user.isActive,
                        password: (user as any).password,
                        pin: (user as any).pin,
                    });
                    set((state) => ({ users: [...state.users, user], isLoading: false }));
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            updateUserInDB: async (user) => {
                try {
                    await usersApi.update(user.id, {
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions,
                        assigned_branch_id: user.assignedBranchId,
                        is_active: user.isActive,
                    });
                    set((state) => ({
                        users: state.users.map(u => u.id === user.id ? user : u)
                    }));
                } catch (error: any) {
                    console.error('Failed to update user:', error);
                    throw error;
                }
            },

            deleteUserFromDB: async (id) => {
                try {
                    await usersApi.delete(id);
                    set((state) => ({
                        users: state.users.filter(u => u.id !== id)
                    }));
                } catch (error: any) {
                    console.error('Failed to delete user:', error);
                    throw error;
                }
            },

            createPrinterInDB: async (printer) => {
                try {
                    const created = await printersApi.create({
                        id: printer.id,
                        name: printer.name,
                        code: printer.code,
                        type: printer.type,
                        address: printer.address,
                        branch_id: printer.branchId,
                        role: printer.role,
                        is_primary_cashier: printer.isPrimaryCashier === true,
                        is_active: printer.isActive,
                    });
                    const mapped: Printer = {
                        id: created.id,
                        name: created.name,
                        code: created.code || '',
                        type: created.type,
                        address: created.address || '',
                        isActive: created.is_active !== false,
                        branchId: created.branch_id || '',
                        role: created.role || 'OTHER',
                        isPrimaryCashier: created.is_primary_cashier === true,
                        isOnline: created.heartbeat_status ? String(created.heartbeat_status).toUpperCase() === 'ONLINE' : created.is_active !== false,
                        lastHeartbeatAt: created.last_heartbeat_at || undefined,
                    };
                    set((state) => ({ printers: [mapped, ...state.printers] }));
                } catch (error: any) {
                    console.error('Failed to create printer:', error);
                    throw error;
                }
            },

            updatePrinterInDB: async (printer) => {
                try {
                    const updated = await printersApi.update(printer.id, {
                        name: printer.name,
                        code: printer.code,
                        type: printer.type,
                        address: printer.address,
                        branch_id: printer.branchId,
                        role: printer.role,
                        is_primary_cashier: printer.isPrimaryCashier === true,
                        is_active: printer.isActive,
                    });
                    const mapped: Printer = {
                        id: updated.id,
                        name: updated.name,
                        code: updated.code || '',
                        type: updated.type,
                        address: updated.address || '',
                        isActive: updated.is_active !== false,
                        branchId: updated.branch_id || '',
                        role: updated.role || 'OTHER',
                        isPrimaryCashier: updated.is_primary_cashier === true,
                        isOnline: updated.heartbeat_status ? String(updated.heartbeat_status).toUpperCase() === 'ONLINE' : updated.is_active !== false,
                        lastHeartbeatAt: updated.last_heartbeat_at || undefined,
                    };
                    set((state) => ({
                        printers: state.printers.map(p => p.id === mapped.id ? mapped : p)
                    }));
                } catch (error: any) {
                    console.error('Failed to update printer:', error);
                    throw error;
                }
            },

            deletePrinterFromDB: async (id) => {
                try {
                    await printersApi.delete(id);
                    set((state) => ({
                        printers: state.printers.filter(p => p.id !== id)
                    }));
                } catch (error: any) {
                    console.error('Failed to delete printer:', error);
                    throw error;
                }
            },

            heartbeatPrinterInDB: async (id) => {
                try {
                    const res = await printersApi.heartbeat(id);
                    const mapped: Printer = {
                        id: res.printer.id,
                        name: res.printer.name,
                        code: res.printer.code || '',
                        type: res.printer.type,
                        address: res.printer.address || '',
                        isActive: res.printer.is_active !== false,
                        branchId: res.printer.branch_id || '',
                        role: res.printer.role || 'OTHER',
                        isPrimaryCashier: res.printer.is_primary_cashier === true,
                        isOnline: res.online === true,
                        lastHeartbeatAt: res.printer.last_heartbeat_at || undefined,
                    };
                    set((state) => ({
                        printers: state.printers.map(p => p.id === mapped.id ? mapped : p)
                    }));
                    return Boolean(res.online);
                } catch (error: any) {
                    console.error('Failed to heartbeat printer:', error);
                    return false;
                }
            },

            createBranch: async (branch) => {
                set({ isLoading: true });
                try {
                    if (navigator.onLine) {
                        await branchesApi.create({
                            id: branch.id,
                            name: branch.name,
                            location: branch.location,
                            address: branch.address,
                            phone: branch.phone,
                            is_active: branch.isActive,
                        });
                    } else {
                        await syncService.queue('branch', 'CREATE', {
                            id: branch.id,
                            name: branch.name,
                            location: branch.location,
                            address: branch.address,
                            phone: branch.phone,
                            is_active: branch.isActive,
                        });
                    }
                    set((state) => ({ branches: [...state.branches, branch], isLoading: false }));
                    await localDb.branches.put(branch as any);
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            syncToDatabase: async () => {
                await syncService.syncPending();
            },

            // ============ Local Actions ============

            login: (user: User) => set((state) => ({
                settings: { ...state.settings, currentUser: user, activeBranchId: user.assignedBranchId || state.branches[0]?.id },
                isAuthenticated: true
            })),

            logout: () => {
                authApi.logout().catch(() => undefined);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_refresh_token');
                set((state) => ({
                    settings: { ...state.settings, currentUser: undefined, activeBranchId: undefined },
                    isAuthenticated: false,
                    token: null
                }));
            },

            updateSettings: (newSettings) => {
                set((state) => ({
                    settings: { ...state.settings, ...newSettings }
                }));
                // Sync to database in background
                if (navigator.onLine) {
                    settingsApi.updateBulk(newSettings).catch(console.error);
                } else {
                    syncService.queue('settingsBulk', 'UPDATE', newSettings).catch(console.error);
                }
                localDb.settings.put({ key: 'app', value: { ...get().settings, ...newSettings }, updatedAt: Date.now() }).catch(console.error);
            },

            setActiveBranch: (branchId) => set((state) => ({
                settings: { ...state.settings, activeBranchId: branchId }
            })),

            setBranches: (branches) => set({ branches }),
            setPrinters: (printers) => set({ printers }),
            updatePrinters: (printers) => set({ printers }),
            updateUsers: (users) => set({ users }),

            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),

            hasPermission: (permission) => {
                const user = get().settings.currentUser;
                if (!user) return false;
                if (user.role === UserRole.SUPER_ADMIN) return true;
                if (user.role === UserRole.BRANCH_MANAGER && permission.startsWith('NAV_')) return true;
                return user.permissions.includes(permission);
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'coduis-zen-auth',
            partialize: (state) => ({
                settings: state.settings,
                isAuthenticated: state.isAuthenticated,
                isSidebarCollapsed: state.isSidebarCollapsed,
            }),
        }
    )
);
