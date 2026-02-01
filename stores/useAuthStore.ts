// Auth Store - Connected to Database API (Production Ready)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AppSettings, AppPermission, UserRole, INITIAL_ROLE_PERMISSIONS, Branch, Printer } from '../types';
import { usersApi, branchesApi, settingsApi } from '../services/api';

interface AuthState {
    settings: AppSettings;
    branches: Branch[];
    printers: Printer[];
    users: User[];
    isAuthenticated: boolean;
    isSidebarCollapsed: boolean;
    isLoading: boolean;
    error: string | null;

    // Async Actions (API)
    fetchUsers: () => Promise<void>;
    fetchBranches: () => Promise<void>;
    fetchSettings: () => Promise<void>;
    createUser: (user: User) => Promise<void>;
    updateUserInDB: (user: User) => Promise<void>;
    deleteUserFromDB: (id: string) => Promise<void>;
    createBranch: (branch: Branch) => Promise<void>;

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
    restaurantName: 'Coduis Zen',
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
    currentUser: undefined,
    activeBranchId: undefined,
    geminiApiKey: ''
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
            isSidebarCollapsed: false,
            isLoading: false,
            error: null,

            // ============ API Actions ============

            fetchUsers: async () => {
                set({ isLoading: true });
                try {
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
                        }));
                        set({ users, isLoading: false });
                    } else {
                        set({ isLoading: false });
                    }
                } catch (error: any) {
                    set({ isLoading: false });
                    console.error('Failed to fetch users:', error);
                }
            },

            fetchBranches: async () => {
                try {
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
                    }
                } catch (error) {
                    console.error('Failed to fetch branches:', error);
                }
            },

            fetchSettings: async () => {
                try {
                    const data = await settingsApi.getAll();
                    if (Object.keys(data).length > 0) {
                        set((state) => ({
                            settings: {
                                ...state.settings,
                                restaurantName: data.restaurantName || state.settings.restaurantName,
                                currency: data.currency || state.settings.currency,
                                taxRate: data.taxRate ?? state.settings.taxRate,
                                language: data.language || state.settings.language,
                                isDarkMode: data.isDarkMode ?? state.settings.isDarkMode,
                                theme: data.theme || state.settings.theme,
                            }
                        }));
                    }
                } catch (error) {
                    console.error('Failed to fetch settings:', error);
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

            createBranch: async (branch) => {
                set({ isLoading: true });
                try {
                    await branchesApi.create({
                        id: branch.id,
                        name: branch.name,
                        location: branch.location,
                        address: branch.address,
                        phone: branch.phone,
                        is_active: branch.isActive,
                    });
                    set((state) => ({ branches: [...state.branches, branch], isLoading: false }));
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // ============ Local Actions ============

            login: (user: User) => set((state) => ({
                settings: { ...state.settings, currentUser: user, activeBranchId: user.assignedBranchId || state.branches[0]?.id },
                isAuthenticated: true
            })),

            logout: () => set((state) => ({
                settings: { ...state.settings, currentUser: undefined, activeBranchId: undefined },
                isAuthenticated: false
            })),

            updateSettings: (newSettings) => {
                set((state) => ({
                    settings: { ...state.settings, ...newSettings }
                }));
                // Sync to database in background
                settingsApi.updateBulk(newSettings).catch(console.error);
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
