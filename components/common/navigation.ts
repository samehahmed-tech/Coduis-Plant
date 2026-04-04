import type { ElementType } from 'react';
import {
    LayoutDashboard,
    ShoppingCart,
    ChefHat,
    Phone,
    Monitor,
    UtensilsCrossed,
    Package,
    Users,
    DollarSign,
    BarChart3,
    Brain,
    Sparkles,
    Shield,
    Fingerprint,
    Settings,
    Factory,
    Truck,
    Megaphone,
    Clock,
    FileText,
    Wallet,
    Layers,
    MessageCircle,
    Globe,
    Award,
    RotateCcw,
    Trash2,
    Printer,
    Building2,
    Map as MapIcon,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { AppPermission } from '../../types';

export interface NavItem {
    id: string;
    path: string;
    label: string;
    labelAr: string;
    icon: ElementType;
    permission: AppPermission;
    keywords?: string;
}

export interface NavSection {
    id: string;
    label: string;
    labelAr: string;
    items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
    {
        id: 'operate',
        label: 'Operate',
        labelAr: 'التشغيل',
        items: [
            { id: 'dashboard', path: '/', label: 'Dashboard', labelAr: 'لوحة القيادة', icon: LayoutDashboard, permission: AppPermission.NAV_DASHBOARD, keywords: 'home kpi analytics' },
            { id: 'pos', path: '/pos', label: 'Point of Sale', labelAr: 'نقطة البيع', icon: ShoppingCart, permission: AppPermission.NAV_POS, keywords: 'cashier register receipt' },
            { id: 'kds', path: '/kds', label: 'Kitchen Display', labelAr: 'شاشة المطبخ', icon: ChefHat, permission: AppPermission.NAV_KDS, keywords: 'kitchen station tickets' },
            { id: 'call-center', path: '/call-center', label: 'Call Center', labelAr: 'مركز الاتصال', icon: Phone, permission: AppPermission.NAV_CALL_CENTER, keywords: 'calls delivery' },
            { id: 'call-center-manager', path: '/call-center-manager', label: 'Call Center Manager', labelAr: 'إدارة الاتصال', icon: Monitor, permission: AppPermission.NAV_CALL_CENTER, keywords: 'supervisor' },
            { id: 'dispatch', path: '/dispatch', label: 'Dispatch', labelAr: 'التوصيل', icon: Truck, permission: AppPermission.NAV_DASHBOARD, keywords: 'drivers tracking' },
            { id: 'day-close', path: '/day-close', label: 'Day Close', labelAr: 'إقفال اليوم', icon: Clock, permission: AppPermission.NAV_REPORTS, keywords: 'shift close' },
            { id: 'floor-designer', path: '/floor-designer', label: 'Floor Designer', labelAr: 'تصميم الصالة', icon: MapIcon, permission: AppPermission.NAV_FLOOR_PLAN, keywords: 'tables layout' },
            { id: 'production', path: '/production', label: 'Production', labelAr: 'الإنتاج', icon: Factory, permission: AppPermission.NAV_PRODUCTION, keywords: 'prep' },
        ],
    },
    {
        id: 'manage',
        label: 'Manage',
        labelAr: 'الإدارة',
        items: [
            { id: 'menu', path: '/menu', label: 'Menu Manager', labelAr: 'إدارة المنيو', icon: UtensilsCrossed, permission: AppPermission.NAV_MENU_MANAGER, keywords: 'items pricing modifiers' },
            { id: 'recipes', path: '/recipes', label: 'Recipes', labelAr: 'الوصفات', icon: ChefHat, permission: AppPermission.NAV_RECIPES, keywords: 'costing' },
            { id: 'inventory', path: '/inventory', label: 'Inventory', labelAr: 'المخزون', icon: Package, permission: AppPermission.NAV_INVENTORY, keywords: 'stock warehouse' },
            { id: 'inventory-intel', path: '/inventory-intelligence', label: 'Inventory Intelligence', labelAr: 'ذكاء المخزون', icon: Layers, permission: AppPermission.NAV_INVENTORY, keywords: 'forecast' },
            { id: 'wastage', path: '/wastage', label: 'Wastage', labelAr: 'الهدر', icon: Trash2, permission: AppPermission.NAV_WASTAGE, keywords: 'loss spoilage' },
            { id: 'printers', path: '/printers', label: 'Printers', labelAr: 'الطابعات', icon: Printer, permission: AppPermission.NAV_PRINTERS, keywords: 'routing' },
            { id: 'platforms', path: '/platforms', label: 'Platforms', labelAr: 'المنصات', icon: Globe, permission: AppPermission.NAV_SETTINGS, keywords: 'integrations' },
            { id: 'franchise', path: '/franchise', label: 'Franchise', labelAr: 'إدارة الفروع', icon: Award, permission: AppPermission.NAV_REPORTS, keywords: 'multi-branch' },
            { id: 'people', path: '/people', label: 'People', labelAr: 'الفريق', icon: Users, permission: AppPermission.NAV_PEOPLE, keywords: 'hr attendance payroll' },
        ],
    },
    {
        id: 'analyze',
        label: 'Analyze',
        labelAr: 'التحليل',
        items: [
            { id: 'reports', path: '/reports', label: 'Reports', labelAr: 'التقارير', icon: BarChart3, permission: AppPermission.NAV_REPORTS, keywords: 'analytics' },
            { id: 'finance', path: '/finance', label: 'Finance', labelAr: 'الماليات', icon: DollarSign, permission: AppPermission.NAV_FINANCE, keywords: 'ledger' },
            { id: 'fiscal', path: '/fiscal', label: 'Fiscal', labelAr: 'الامتثال الضريبي', icon: Wallet, permission: AppPermission.NAV_FINANCE, keywords: 'tax' },
            { id: 'refunds', path: '/refunds', label: 'Refunds', labelAr: 'المرتجعات', icon: RotateCcw, permission: AppPermission.NAV_FINANCE, keywords: 'returns' },
            { id: 'admin-dashboard', path: '/admin-dashboard', label: 'Admin Dashboard', labelAr: 'لوحة الإدارة', icon: LayoutDashboard, permission: AppPermission.NAV_ADMIN_DASHBOARD, keywords: 'admin' },
            { id: 'ai-insights', path: '/ai-insights', label: 'AI Insights', labelAr: 'رؤى الذكاء', icon: Brain, permission: AppPermission.NAV_AI_ASSISTANT, keywords: 'forecast anomaly' },
        ],
    },
    {
        id: 'engage',
        label: 'Engage',
        labelAr: 'العملاء',
        items: [
            { id: 'crm', path: '/crm', label: 'CRM', labelAr: 'العملاء', icon: Users, permission: AppPermission.NAV_CRM, keywords: 'loyalty' },
            { id: 'marketing', path: '/marketing', label: 'Marketing', labelAr: 'التسويق', icon: Megaphone, permission: AppPermission.NAV_REPORTS, keywords: 'campaigns' },
            { id: 'whatsapp', path: '/whatsapp', label: 'WhatsApp', labelAr: 'واتساب', icon: MessageCircle, permission: AppPermission.NAV_REPORTS, keywords: 'messaging' },
            { id: 'ai-assistant', path: '/ai-assistant', label: 'AI Assistant', labelAr: 'المساعد الذكي', icon: Sparkles, permission: AppPermission.NAV_AI_ASSISTANT, keywords: 'assistant' },
        ],
    },
    {
        id: 'secure',
        label: 'Secure',
        labelAr: 'الأمان',
        items: [
            { id: 'security', path: '/security', label: 'Security Hub', labelAr: 'مركز الأمان', icon: Shield, permission: AppPermission.NAV_SECURITY, keywords: 'roles permissions' },
            { id: 'forensics', path: '/forensics', label: 'Forensics', labelAr: 'التحقيقات', icon: Fingerprint, permission: AppPermission.NAV_FORENSICS, keywords: 'audit' },
            { id: 'approvals', path: '/approvals', label: 'Approvals', labelAr: 'الموافقات', icon: FileText, permission: AppPermission.NAV_SECURITY, keywords: 'approval' },
            { id: 'settings', path: '/settings', label: 'Settings', labelAr: 'الإعدادات', icon: Settings, permission: AppPermission.NAV_SETTINGS, keywords: 'configuration' },
            { id: 'go-live', path: '/go-live', label: 'Go Live', labelAr: 'الإطلاق', icon: Building2, permission: AppPermission.NAV_SECURITY, keywords: 'checklist' },
        ],
    },
];

export const PRIMARY_MOBILE_NAV: NavItem[] = [
    { id: 'mobile-home', path: '/', label: 'Home', labelAr: 'الرئيسية', icon: LayoutDashboard, permission: AppPermission.NAV_DASHBOARD },
    { id: 'mobile-orders', path: '/pos', label: 'Orders', labelAr: 'الطلبات', icon: ShoppingCart, permission: AppPermission.NAV_POS },
    { id: 'mobile-kitchen', path: '/kds', label: 'Kitchen', labelAr: 'المطبخ', icon: ChefHat, permission: AppPermission.NAV_KDS },
    { id: 'mobile-drivers', path: '/dispatch', label: 'Drivers', labelAr: 'السائقين', icon: Truck, permission: AppPermission.NAV_DASHBOARD },
    { id: 'mobile-more', path: '/menu', label: 'More', labelAr: 'المزيد', icon: Layers, permission: AppPermission.NAV_MENU_MANAGER },
];

export const CONTEXTUAL_NAV_MAP: Record<string, NavSection[]> = {
    '/pos': [
        {
            id: 'pos-context',
            label: 'POS Operations',
            labelAr: 'عمليات الكاشير',
            items: [
                { id: 'pos-tables', path: '/pos', label: 'Tables / Dine-in', labelAr: 'الطاولات', icon: MapIcon, permission: AppPermission.NAV_POS },
                { id: 'pos-orders', path: '/pos#orders', label: 'Active Orders', labelAr: 'الطلبات النشطة', icon: ShoppingCart, permission: AppPermission.NAV_POS },
                { id: 'pos-payments', path: '/pos#payments', label: 'Payments & Split', labelAr: 'الدفع والتقسيم', icon: DollarSign, permission: AppPermission.NAV_POS },
                { id: 'pos-receipts', path: '/pos#receipts', label: 'Recent Receipts', labelAr: 'الإيصالات', icon: FileText, permission: AppPermission.NAV_POS },
            ]
        }
    ],
    '/kds': [
        {
            id: 'kds-context',
            label: 'Kitchen Display',
            labelAr: 'شاشة المطبخ',
            items: [
                { id: 'kds-queue', path: '/kds', label: 'Order Queue', labelAr: 'قائمة الطلبات', icon: UtensilsCrossed, permission: AppPermission.NAV_KDS },
                { id: 'kds-prep', path: '/kds#preparing', label: 'Preparing', labelAr: 'قيد التحضير', icon: ChefHat, permission: AppPermission.NAV_KDS },
                { id: 'kds-ready', path: '/kds#ready', label: 'Ready Orders', labelAr: 'الطلبات الجاهزة', icon: CheckCircle, permission: AppPermission.NAV_KDS },
                { id: 'kds-delayed', path: '/kds#delayed', label: 'Delayed Orders', labelAr: 'الطلبات المتأخرة', icon: AlertTriangle, permission: AppPermission.NAV_KDS },
            ]
        }
    ],
    '/dispatch': [
        {
            id: 'dispatch-context',
            label: 'Dispatch Center',
            labelAr: 'مركز التوصيل',
            items: [
                { id: 'disp-active', path: '/dispatch', label: 'Active Deliveries', labelAr: 'طلبات التوصيل', icon: Truck, permission: AppPermission.NAV_DASHBOARD },
                { id: 'disp-drivers', path: '/dispatch#drivers', label: 'Drivers Online', labelAr: 'السائقين المتاحين', icon: Users, permission: AppPermission.NAV_DASHBOARD },
                { id: 'disp-route', path: '/dispatch#route', label: 'Route Planning', labelAr: 'تخطيط المسار', icon: MapIcon, permission: AppPermission.NAV_DASHBOARD },
            ]
        }
    ]
};

export const flattenNav = () => NAV_SECTIONS.flatMap(section => section.items);
