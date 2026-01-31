
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AppSettings, AppPermission, UserRole, INITIAL_ROLE_PERMISSIONS, Branch, Printer } from '../types';

interface AuthState {
    settings: AppSettings;
    branches: Branch[];
    printers: any[]; // Using any for Printer type to avoid import issues if not exported, or should import Printer
    login: (user: User) => void;
    logout: () => void;
    updateSettings: (settings: Partial<AppSettings>) => void;
    hasPermission: (permission: AppPermission) => boolean;
    setActiveBranch: (branchId: string) => void;
    setBranches: (branches: Branch[]) => void;
    setPrinters: (printers: any[]) => void;
    users: User[];
    updateUsers: (users: User[]) => void;
    updatePrinters: (printers: any[]) => void;
    isAuthenticated: boolean;
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
    restaurantName: 'Coduis Zen ERP',
    currency: 'EGP',
    currencySymbol: 'ج.م',
    taxRate: 14,
    serviceCharge: 12,
    language: 'ar',
    isDarkMode: true,
    isTouchMode: false,
    theme: 'xen',
    branchAddress: 'Sheikh Zayed, Cairo',
    phone: '19000',
    currentUser: undefined,
    activeBranchId: undefined,
    geminiApiKey: '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'
};

const INITIAL_BRANCHES: Branch[] = [
    { id: 'b1', name: 'Headquarters', location: 'Main Location', isActive: true, phone: '' },
];

const INITIAL_PRINTERS: any[] = [
    { id: 'p1', name: 'Kitchen Printer', type: 'NETWORK', address: '192.168.1.100', location: 'Kitchen' },
    { id: 'p2', name: 'Receipt Printer', type: 'USB', address: 'USB001', location: 'Counter' },
    { id: 'p3', name: 'Bar Printer', type: 'NETWORK', address: '192.168.1.101', location: 'Bar' },
];

const INITIAL_USERS: User[] = [
    { id: 'u1', name: 'Super Admin', email: 'admin@restoflow.com', role: UserRole.SUPER_ADMIN, permissions: INITIAL_ROLE_PERMISSIONS[UserRole.SUPER_ADMIN], isActive: true },
    { id: 'u2', name: 'Branch Manager', email: 'manager@restoflow.com', role: UserRole.MANAGER, permissions: INITIAL_ROLE_PERMISSIONS[UserRole.MANAGER], isActive: true, assignedBranchId: 'b1' },
    { id: 'u3', name: 'Cashier One', email: 'pos1@restoflow.com', role: UserRole.CASHIER, permissions: INITIAL_ROLE_PERMISSIONS[UserRole.CASHIER], isActive: true, assignedBranchId: 'b1' },
];

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            settings: DEFAULT_SETTINGS,
            branches: INITIAL_BRANCHES,
            printers: INITIAL_PRINTERS,
            isAuthenticated: false,
            isSidebarCollapsed: false,

            login: (user: User) => set((state) => ({
                settings: { ...state.settings, currentUser: user, activeBranchId: user.assignedBranchId || 'b1' },
                isAuthenticated: true
            })),

            logout: () => set((state) => ({
                settings: { ...state.settings, currentUser: undefined, activeBranchId: undefined },
                isAuthenticated: false
            })),

            updateSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings }
            })),

            setActiveBranch: (branchId) => set((state) => ({
                settings: { ...state.settings, activeBranchId: branchId }
            })),

            setBranches: (branches) => set({ branches }),

            setPrinters: (printers) => set({ printers }),
            updatePrinters: (printers) => set({ printers }),

            users: INITIAL_USERS,
            updateUsers: (users) => set({ users }),

            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

            setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),

            hasPermission: (permission) => {
                const user = get().settings.currentUser;
                if (!user) return false;
                if (user.role === UserRole.SUPER_ADMIN) return true;
                return user.permissions.includes(permission);
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ settings: state.settings, isAuthenticated: state.isAuthenticated, branches: state.branches, printers: state.printers, isSidebarCollapsed: state.isSidebarCollapsed }),
        }
    )
);
