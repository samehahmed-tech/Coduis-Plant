
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import React, { Suspense } from 'react';
import Login from './components/Login';
import { useAuthStore } from './stores/useAuthStore';
import { AppPermission } from './types';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load components for better performance
// Export loaders for preloading
export const loaders = {
    Dashboard: () => import('./components/Dashboard'),
    AdminDashboardPage: () => import('./components/AdminDashboardPage'),
    POS: () => import('./components/POS'),
    CallCenter: () => import('./components/CallCenter'),
    CallCenterManager: () => import('./components/CallCenterManager'),
    KDS: () => import('./components/KDS'),
    MenuManager: () => import('./components/menu/MenuProfitCenter'),
    PrinterManager: () => import('./components/PrinterManager'),
    ReceiptDesigner: () => import('./components/ReceiptDesigner'),
    RecipeManager: () => import('./components/RecipeManager'),
    Inventory: () => import('./components/Inventory'),
    CRM: () => import('./components/CRM'),
    Finance: () => import('./components/Finance'),
    Reports: () => import('./components/Reports'),
    AIInsights: () => import('./components/AIInsights'),
    AIAssistant: () => import('./components/AIAssistant'),

    ForensicsHub: () => import('./components/ForensicsHub'),
    SettingsHub: () => import('./components/SettingsHub'),
    FloorDesigner: () => import('./components/FloorDesigner'),
    Production: () => import('./components/Production'),
    DispatchHub: () => import('./components/DispatchHub'),
    CampaignHub: () => import('./components/CampaignHub'),

    FiscalHub: () => import('./components/FiscalHub'),
    DayCloseHub: () => import('./components/DayCloseHub'),
    FranchiseManager: () => import('./components/FranchiseManager'),
    SetupWizard: () => import('./components/SetupWizard'),
    GoLiveCenter: () => import('./components/GoLiveCenter'),
    RefundManager: () => import('./components/RefundManager'),
    WastageManager: () => import('./components/WastageManager'),
    InventoryIntelligence: () => import('./components/InventoryIntelligence'),
    ApprovalCenter: () => import('./components/ApprovalCenter'),
    WhatsAppHub: () => import('./components/WhatsAppHub'),
    PlatformAggregator: () => import('./components/PlatformAggregator'),
    UserManagement: () => import('./components/UserManagement'),
    OrdersCenter: () => import('./components/OrdersCenter'),
};

// Lazy load components using exported loaders
const Dashboard = React.lazy(loaders.Dashboard);
const AdminDashboardPage = React.lazy(loaders.AdminDashboardPage);
const POS = React.lazy(loaders.POS);
const CallCenter = React.lazy(loaders.CallCenter);
const CallCenterManager = React.lazy(loaders.CallCenterManager);
const KDS = React.lazy(loaders.KDS);
const MenuManager = React.lazy(loaders.MenuManager);
const PrinterManager = React.lazy(loaders.PrinterManager);
const ReceiptDesigner = React.lazy(loaders.ReceiptDesigner);
const RecipeManager = React.lazy(loaders.RecipeManager);
const Inventory = React.lazy(loaders.Inventory);
const CRM = React.lazy(loaders.CRM);
const Finance = React.lazy(loaders.Finance);
const Reports = React.lazy(loaders.Reports);
const AIInsights = React.lazy(loaders.AIInsights);
const AIAssistant = React.lazy(loaders.AIAssistant);

const ForensicsHub = React.lazy(loaders.ForensicsHub);
const SettingsHub = React.lazy(loaders.SettingsHub);
const FloorDesigner = React.lazy(loaders.FloorDesigner);
const Production = React.lazy(loaders.Production);
const DispatchHub = React.lazy(loaders.DispatchHub);
const CampaignHub = React.lazy(loaders.CampaignHub);

const FiscalHub = React.lazy(loaders.FiscalHub);
const DayCloseHub = React.lazy(loaders.DayCloseHub);
const FranchiseManager = React.lazy(loaders.FranchiseManager);
const LazySetupWizard = React.lazy(loaders.SetupWizard);
const GoLiveCenter = React.lazy(loaders.GoLiveCenter);
const RefundManager = React.lazy(loaders.RefundManager);
const WastageManager = React.lazy(loaders.WastageManager);
const InventoryIntelligence = React.lazy(loaders.InventoryIntelligence);
const ApprovalCenter = React.lazy(loaders.ApprovalCenter);
const WhatsAppHub = React.lazy(loaders.WhatsAppHub);
const PlatformAggregator = React.lazy(loaders.PlatformAggregator);
const UserManagement = React.lazy(loaders.UserManagement);
const OrdersCenter = React.lazy(loaders.OrdersCenter);

import PageSkeleton from './components/common/PageSkeleton';

const Loading = () => <PageSkeleton type="table" rows={5} />;

const RequirePermission: React.FC<{ permission: AppPermission; children: React.ReactNode }> = ({ permission, children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasPermission = useAuthStore((state) => state.hasPermission);
    const fallbackPath = hasPermission(AppPermission.NAV_DASHBOARD)
        ? '/'
        : hasPermission(AppPermission.NAV_POS)
            ? '/pos'
            : hasPermission(AppPermission.NAV_CALL_CENTER)
                ? '/call-center'
                : hasPermission(AppPermission.NAV_KDS)
                    ? '/kds'
                    : hasPermission(AppPermission.NAV_REPORTS)
                        ? '/reports'
                        : '/login';
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!hasPermission(permission)) return <Navigate to={fallbackPath} replace />;
    return <>{children}</>;
};

/** Wraps a lazy component with ErrorBoundary + Suspense for safe route rendering */
const withSafe = (Component: React.ComponentType) => (
    <ErrorBoundary>
        <Suspense fallback={<Loading />}>
            <Component />
        </Suspense>
    </ErrorBoundary>
);

const withPermission = (permission: AppPermission, element: React.ReactNode) => (
    <RequirePermission permission={permission}>{element}</RequirePermission>
);

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            { index: true, element: withPermission(AppPermission.NAV_DASHBOARD, withSafe(Dashboard)) },
            { path: 'admin-dashboard', element: withPermission(AppPermission.NAV_ADMIN_DASHBOARD, withSafe(AdminDashboardPage)) },
            { path: 'pos', element: withPermission(AppPermission.NAV_POS, withSafe(POS)) },
            { path: 'call-center', element: withPermission(AppPermission.NAV_CALL_CENTER, withSafe(CallCenter)) },
            { path: 'call-center-manager', element: withPermission(AppPermission.NAV_CALL_CENTER, withSafe(CallCenterManager)) },
            { path: 'kds', element: withPermission(AppPermission.NAV_KDS, withSafe(KDS)) },
            { path: 'menu', element: withPermission(AppPermission.NAV_MENU_MANAGER, withSafe(MenuManager)) },
            { path: 'printers', element: withPermission(AppPermission.NAV_PRINTERS, withSafe(PrinterManager)) },
            { path: 'recipes', element: withPermission(AppPermission.NAV_RECIPES, withSafe(RecipeManager)) },
            { path: 'receipt-designer', element: withPermission(AppPermission.NAV_PRINTERS, withSafe(ReceiptDesigner)) },
            { path: 'inventory', element: withPermission(AppPermission.NAV_INVENTORY, withSafe(Inventory)) },
            { path: 'crm', element: withPermission(AppPermission.NAV_CRM, withSafe(CRM)) },
            { path: 'finance', element: withPermission(AppPermission.NAV_FINANCE, withSafe(Finance)) },
            { path: 'reports', element: withPermission(AppPermission.NAV_REPORTS, withSafe(Reports)) },
            { path: 'ai-insights', element: withPermission(AppPermission.NAV_AI_ASSISTANT, withSafe(AIInsights)) },
            { path: 'ai-assistant', element: withPermission(AppPermission.NAV_AI_ASSISTANT, withSafe(AIAssistant)) },
            { path: 'security', element: <Navigate to="/user-management" replace /> },
            { path: 'forensics', element: withPermission(AppPermission.NAV_FORENSICS, withSafe(ForensicsHub)) },
            { path: 'settings', element: withPermission(AppPermission.NAV_SETTINGS, withSafe(SettingsHub)) },
            { path: 'go-live', element: withPermission(AppPermission.NAV_SECURITY, withSafe(GoLiveCenter)) },
            { path: 'production', element: withPermission(AppPermission.NAV_PRODUCTION, withSafe(Production)) },
            { path: 'dispatch', element: withPermission(AppPermission.NAV_DASHBOARD, withSafe(DispatchHub)) },
            { path: 'marketing', element: withPermission(AppPermission.NAV_REPORTS, withSafe(CampaignHub)) },
            { path: 'people', element: <Navigate to="/user-management" replace /> },
            { path: 'fiscal', element: withPermission(AppPermission.NAV_FINANCE, withSafe(FiscalHub)) },
            { path: 'day-close', element: withPermission(AppPermission.NAV_REPORTS, withSafe(DayCloseHub)) },
            { path: 'franchise', element: withPermission(AppPermission.NAV_REPORTS, withSafe(FranchiseManager)) },
            { path: 'refunds', element: withPermission(AppPermission.NAV_FINANCE, withSafe(RefundManager)) },
            { path: 'wastage', element: withPermission(AppPermission.NAV_INVENTORY, withSafe(WastageManager)) },
            { path: 'inventory-intelligence', element: withPermission(AppPermission.NAV_INVENTORY, withSafe(InventoryIntelligence)) },
            { path: 'approvals', element: withPermission(AppPermission.NAV_SECURITY, withSafe(ApprovalCenter)) },
            { path: 'whatsapp', element: withPermission(AppPermission.NAV_REPORTS, withSafe(WhatsAppHub)) },
            { path: 'platforms', element: withPermission(AppPermission.NAV_SETTINGS, withSafe(PlatformAggregator)) },
            { path: 'user-management', element: withPermission(AppPermission.NAV_USER_MANAGEMENT, withSafe(UserManagement)) },
            { path: 'orders', element: withPermission(AppPermission.NAV_ORDERS, withSafe(OrdersCenter)) },
        ],
    },
    {
        path: 'floor-designer',
        element: (
            <RequirePermission permission={AppPermission.NAV_FLOOR_PLAN}>
                {withSafe(FloorDesigner)}
            </RequirePermission>
        ),
    },
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/setup',
        element: withSafe(LazySetupWizard),
    },
]);

