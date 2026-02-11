
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import React, { Suspense } from 'react';
import Login from './components/Login';
import { useAuthStore } from './stores/useAuthStore';
import { AppPermission } from './types';

// Lazy load components for better performance
// Export loaders for preloading
export const loaders = {
    Dashboard: () => import('./components/Dashboard'),
    AdminDashboardPage: () => import('./components/AdminDashboardPage'),
    POS: () => import('./components/POS'),
    CallCenter: () => import('./components/CallCenter'),
    CallCenterManager: () => import('./components/CallCenterManager'),
    KDS: () => import('./components/KDS'),
    MenuManager: () => import('./components/MenuManager'),
    PrinterManager: () => import('./components/PrinterManager'),
    RecipeManager: () => import('./components/RecipeManager'),
    Inventory: () => import('./components/Inventory'),
    CRM: () => import('./components/CRM'),
    Finance: () => import('./components/Finance'),
    Reports: () => import('./components/Reports'),
    AIInsights: () => import('./components/AIInsights'),
    AIAssistant: () => import('./components/AIAssistant'),
    SecurityHub: () => import('./components/SecurityHub'),
    ForensicsHub: () => import('./components/ForensicsHub'),
    SettingsHub: () => import('./components/SettingsHub'),
    FloorDesigner: () => import('./components/FloorDesigner'),
    Production: () => import('./components/Production'),
    DispatchHub: () => import('./components/DispatchHub'),
    CampaignHub: () => import('./components/CampaignHub'),
    ZenPeople: () => import('./components/ZenPeople'),
    FiscalHub: () => import('./components/FiscalHub'),
    DayCloseHub: () => import('./components/DayCloseHub'),
    FranchiseManager: () => import('./components/FranchiseManager'),
    SetupWizard: () => import('./components/SetupWizard'),
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
const RecipeManager = React.lazy(loaders.RecipeManager);
const Inventory = React.lazy(loaders.Inventory);
const CRM = React.lazy(loaders.CRM);
const Finance = React.lazy(loaders.Finance);
const Reports = React.lazy(loaders.Reports);
const AIInsights = React.lazy(loaders.AIInsights);
const AIAssistant = React.lazy(loaders.AIAssistant);
const SecurityHub = React.lazy(loaders.SecurityHub);
const ForensicsHub = React.lazy(loaders.ForensicsHub);
const SettingsHub = React.lazy(loaders.SettingsHub);
const FloorDesigner = React.lazy(loaders.FloorDesigner);
const Production = React.lazy(loaders.Production);
const DispatchHub = React.lazy(loaders.DispatchHub);
const CampaignHub = React.lazy(loaders.CampaignHub);
const ZenPeople = React.lazy(loaders.ZenPeople);
const FiscalHub = React.lazy(loaders.FiscalHub);
const DayCloseHub = React.lazy(loaders.DayCloseHub);
const FranchiseManager = React.lazy(loaders.FranchiseManager);
const LazySetupWizard = React.lazy(loaders.SetupWizard);

const Loading = () => <div className="p-8 text-center text-slate-400 font-black uppercase tracking-widest text-[8px] opacity-40">Initializing Module...</div>;

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

const withPermission = (permission: AppPermission, element: React.ReactNode) => (
    <RequirePermission permission={permission}>{element}</RequirePermission>
);

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: withPermission(AppPermission.NAV_DASHBOARD, (
                    <Suspense fallback={<Loading />}>
                        <Dashboard />
                    </Suspense>
                )),
            },
            {
                path: 'admin-dashboard',
                element: withPermission(AppPermission.NAV_ADMIN_DASHBOARD, (
                    <Suspense fallback={<Loading />}>
                        <AdminDashboardPage />
                    </Suspense>
                )),
            },
            {
                path: 'pos',
                element: withPermission(AppPermission.NAV_POS, (
                    <Suspense fallback={<Loading />}>
                        <POS />
                    </Suspense>
                )),
            },
            {
                path: 'call-center',
                element: withPermission(AppPermission.NAV_CALL_CENTER, (
                    <Suspense fallback={<Loading />}>
                        <CallCenter />
                    </Suspense>
                )),
            },
            {
                path: 'call-center-manager',
                element: withPermission(AppPermission.NAV_CALL_CENTER, (
                    <Suspense fallback={<Loading />}>
                        <CallCenterManager />
                    </Suspense>
                )),
            },
            {
                path: 'kds',
                element: withPermission(AppPermission.NAV_KDS, (
                    <Suspense fallback={<Loading />}>
                        <KDS />
                    </Suspense>
                )),
            },
            {
                path: 'menu',
                element: withPermission(AppPermission.NAV_MENU_MANAGER, (
                    <Suspense fallback={<Loading />}>
                        <MenuManager />
                    </Suspense>
                )),
            },
            {
                path: 'printers',
                element: withPermission(AppPermission.NAV_PRINTERS, (
                    <Suspense fallback={<Loading />}>
                        <PrinterManager />
                    </Suspense>
                )),
            },
            {
                path: 'recipes',
                element: withPermission(AppPermission.NAV_RECIPES, (
                    <Suspense fallback={<Loading />}>
                        <RecipeManager />
                    </Suspense>
                )),
            },
            {
                path: 'inventory',
                element: withPermission(AppPermission.NAV_INVENTORY, (
                    <Suspense fallback={<Loading />}>
                        <Inventory />
                    </Suspense>
                )),
            },
            {
                path: 'crm',
                element: withPermission(AppPermission.NAV_CRM, (
                    <Suspense fallback={<Loading />}>
                        <CRM />
                    </Suspense>
                )),
            },
            {
                path: 'finance',
                element: withPermission(AppPermission.NAV_FINANCE, (
                    <Suspense fallback={<Loading />}>
                        <Finance />
                    </Suspense>
                )),
            },
            {
                path: 'reports',
                element: withPermission(AppPermission.NAV_REPORTS, (
                    <Suspense fallback={<Loading />}>
                        <Reports />
                    </Suspense>
                )),
            },
            {
                path: 'ai-insights',
                element: withPermission(AppPermission.NAV_AI_ASSISTANT, (
                    <Suspense fallback={<Loading />}>
                        <AIInsights />
                    </Suspense>
                )),
            },
            {
                path: 'ai-assistant',
                element: withPermission(AppPermission.NAV_AI_ASSISTANT, (
                    <Suspense fallback={<Loading />}>
                        <AIAssistant />
                    </Suspense>
                )),
            },
            {
                path: 'security',
                element: withPermission(AppPermission.NAV_SECURITY, (
                    <Suspense fallback={<Loading />}>
                        <SecurityHub />
                    </Suspense>
                )),
            },
            {
                path: 'forensics',
                element: withPermission(AppPermission.NAV_FORENSICS, (
                    <Suspense fallback={<Loading />}>
                        <ForensicsHub />
                    </Suspense>
                )),
            },
            {
                path: 'settings',
                element: withPermission(AppPermission.NAV_SETTINGS, (
                    <Suspense fallback={<Loading />}>
                        <SettingsHub />
                    </Suspense>
                )),
            },
            {
                path: 'production',
                element: withPermission(AppPermission.NAV_PRODUCTION, (
                    <Suspense fallback={<Loading />}>
                        <Production />
                    </Suspense>
                )),
            },
            {
                path: 'dispatch',
                element: withPermission(AppPermission.NAV_DASHBOARD, (
                    <Suspense fallback={<Loading />}>
                        <DispatchHub />
                    </Suspense>
                )),
            },
            {
                path: 'marketing',
                element: withPermission(AppPermission.NAV_REPORTS, (
                    <Suspense fallback={<Loading />}>
                        <CampaignHub />
                    </Suspense>
                )),
            },
            {
                path: 'people',
                element: withPermission(AppPermission.NAV_PEOPLE, (
                    <Suspense fallback={<Loading />}>
                        <ZenPeople />
                    </Suspense>
                )),
            },
            {
                path: 'fiscal',
                element: withPermission(AppPermission.NAV_FINANCE, (
                    <Suspense fallback={<Loading />}>
                        <FiscalHub />
                    </Suspense>
                )),
            },
            {
                path: 'day-close',
                element: withPermission(AppPermission.NAV_REPORTS, (
                    <Suspense fallback={<Loading />}>
                        <DayCloseHub />
                    </Suspense>
                )),
            },
            {
                path: 'franchise',
                element: withPermission(AppPermission.NAV_REPORTS, (
                    <Suspense fallback={<Loading />}>
                        <FranchiseManager />
                    </Suspense>
                )),
            },
        ],
    },
    {
        path: 'floor-designer',
        element: (
            <RequirePermission permission={AppPermission.NAV_FLOOR_PLAN}>
                <Suspense fallback={<Loading />}>
                    <FloorDesigner />
                </Suspense>
            </RequirePermission>
        ),
    },
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/setup',
        element: (
            <Suspense fallback={<Loading />}>
                <LazySetupWizard />
            </Suspense>
        ),
    },
]);
