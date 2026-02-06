
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import React, { Suspense } from 'react';
import Login from './components/Login';

// Lazy load components for better performance
// Export loaders for preloading
export const loaders = {
    Dashboard: () => import('./components/Dashboard'),
    POS: () => import('./components/POS'),
    CallCenter: () => import('./components/CallCenter'),
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
    FranchiseManager: () => import('./components/FranchiseManager'),
    SetupWizard: () => import('./components/SetupWizard'),
};

// Lazy load components using exported loaders
const Dashboard = React.lazy(loaders.Dashboard);
const POS = React.lazy(loaders.POS);
const CallCenter = React.lazy(loaders.CallCenter);
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
const FranchiseManager = React.lazy(loaders.FranchiseManager);
const LazySetupWizard = React.lazy(loaders.SetupWizard);

const Loading = () => <div className="p-8 text-center text-slate-400 font-black uppercase tracking-widest text-[8px] opacity-40">Initializing Module...</div>;

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: (
                    <Suspense fallback={<Loading />}>
                        <Dashboard />
                    </Suspense>
                ),
            },
            {
                path: 'pos',
                element: (
                    <Suspense fallback={<Loading />}>
                        <POS />
                    </Suspense>
                ),
            },
            {
                path: 'call-center',
                element: (
                    <Suspense fallback={<Loading />}>
                        <CallCenter />
                    </Suspense>
                ),
            },
            {
                path: 'kds',
                element: (
                    <Suspense fallback={<Loading />}>
                        <KDS />
                    </Suspense>
                ),
            },
            {
                path: 'menu',
                element: (
                    <Suspense fallback={<Loading />}>
                        <MenuManager />
                    </Suspense>
                ),
            },
            {
                path: 'printers',
                element: (
                    <Suspense fallback={<Loading />}>
                        <PrinterManager />
                    </Suspense>
                ),
            },
            {
                path: 'recipes',
                element: (
                    <Suspense fallback={<Loading />}>
                        <RecipeManager />
                    </Suspense>
                ),
            },
            {
                path: 'inventory',
                element: (
                    <Suspense fallback={<Loading />}>
                        <Inventory />
                    </Suspense>
                ),
            },
            {
                path: 'crm',
                element: (
                    <Suspense fallback={<Loading />}>
                        <CRM />
                    </Suspense>
                ),
            },
            {
                path: 'finance',
                element: (
                    <Suspense fallback={<Loading />}>
                        <Finance />
                    </Suspense>
                ),
            },
            {
                path: 'reports',
                element: (
                    <Suspense fallback={<Loading />}>
                        <Reports />
                    </Suspense>
                ),
            },
            {
                path: 'ai-insights',
                element: (
                    <Suspense fallback={<Loading />}>
                        <AIInsights />
                    </Suspense>
                ),
            },
            {
                path: 'ai-assistant',
                element: (
                    <Suspense fallback={<Loading />}>
                        <AIAssistant />
                    </Suspense>
                ),
            },
            {
                path: 'security',
                element: (
                    <Suspense fallback={<Loading />}>
                        <SecurityHub />
                    </Suspense>
                ),
            },
            {
                path: 'forensics',
                element: (
                    <Suspense fallback={<Loading />}>
                        <ForensicsHub />
                    </Suspense>
                ),
            },
            {
                path: 'settings',
                element: (
                    <Suspense fallback={<Loading />}>
                        <SettingsHub />
                    </Suspense>
                ),
            },
            {
                path: 'production',
                element: (
                    <Suspense fallback={<Loading />}>
                        <Production />
                    </Suspense>
                ),
            },
            {
                path: 'dispatch',
                element: (
                    <Suspense fallback={<Loading />}>
                        <DispatchHub />
                    </Suspense>
                ),
            },
            {
                path: 'marketing',
                element: (
                    <Suspense fallback={<Loading />}>
                        <CampaignHub />
                    </Suspense>
                ),
            },
            {
                path: 'people',
                element: (
                    <Suspense fallback={<Loading />}>
                        <ZenPeople />
                    </Suspense>
                ),
            },
            {
                path: 'fiscal',
                element: (
                    <Suspense fallback={<Loading />}>
                        <FiscalHub />
                    </Suspense>
                ),
            },
            {
                path: 'franchise',
                element: (
                    <Suspense fallback={<Loading />}>
                        <FranchiseManager />
                    </Suspense>
                ),
            },
        ],
    },
    {
        path: 'floor-designer',
        element: (
            <Suspense fallback={<Loading />}>
                <FloorDesigner />
            </Suspense>
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
