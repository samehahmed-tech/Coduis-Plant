
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import React, { Suspense } from 'react';
import Login from './components/Login';

// Lazy load components for better performance
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const POS = React.lazy(() => import('./components/POS'));
const CallCenter = React.lazy(() => import('./components/CallCenter'));
const KDS = React.lazy(() => import('./components/KDS'));
const MenuManager = React.lazy(() => import('./components/MenuManager'));
const PrinterManager = React.lazy(() => import('./components/PrinterManager'));
const RecipeManager = React.lazy(() => import('./components/RecipeManager'));
const Inventory = React.lazy(() => import('./components/Inventory'));
const CRM = React.lazy(() => import('./components/CRM'));
const Finance = React.lazy(() => import('./components/Finance'));
const Reports = React.lazy(() => import('./components/Reports'));
const AIInsights = React.lazy(() => import('./components/AIInsights'));
const AIAssistant = React.lazy(() => import('./components/AIAssistant'));
const SecurityHub = React.lazy(() => import('./components/SecurityHub'));
const ForensicsHub = React.lazy(() => import('./components/ForensicsHub'));
const SettingsHub = React.lazy(() => import('./components/SettingsHub'));
const FloorDesigner = React.lazy(() => import('./components/FloorDesigner'));

const Loading = () => <div className="p-8 text-center text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Loading System Module...</div>;

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
                path: 'floor-designer',
                element: (
                    <Suspense fallback={<Loading />}>
                        <FloorDesigner />
                    </Suspense>
                ),
            },
        ],
    },
    {
        path: '/login',
        element: <Login />,
    }
]);
