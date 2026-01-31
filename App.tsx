
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import KDS from './components/KDS';
import Inventory from './components/Inventory';
import Finance from './components/Finance';
import AIAssistant from './components/AIAssistant';
import CRM from './components/CRM';
import Reports from './components/Reports';
import MenuManager from './components/MenuManager';
import AIInsights from './components/AIInsights';
import SettingsHub from './components/SettingsHub';
import FloorDesigner from './components/FloorDesigner';
import AdminDashboard from './components/AdminDashboard';
import CallCenter from './components/CallCenter';
import SecurityHub from './components/SecurityHub';
import {
  ViewState, Order, OrderStatus, OrderItem, PaymentMethod,
  OrderType, Customer, Supplier, PurchaseOrder, InventoryItem,
  FinancialAccount, AccountType, JournalEntry, RestaurantMenu, MenuItem,
  Table, TableStatus, MenuCategory, Branch, DeliveryPlatform, Warehouse, WarehouseType, User, UserRole,
  AppPermission, INITIAL_ROLE_PERMISSIONS, AppSettings
} from './types';

const INITIAL_TABLES: Table[] = [
  { id: '1', name: 'H1', status: TableStatus.AVAILABLE, seats: 2, zoneId: 'hall', position: { x: 15, y: 20 } },
  { id: '2', name: 'H2', status: TableStatus.AVAILABLE, seats: 2, zoneId: 'hall', position: { x: 35, y: 20 } },
  { id: '3', name: 'H3', status: TableStatus.OCCUPIED, seats: 4, currentOrderTotal: 45.50, zoneId: 'hall', position: { x: 55, y: 20 } },
  { id: '4', name: 'H4', status: TableStatus.AVAILABLE, seats: 4, zoneId: 'hall', position: { x: 75, y: 20 } },
  { id: '5', name: 'H5', status: TableStatus.RESERVED, seats: 6, zoneId: 'hall', position: { x: 15, y: 50 } },
  { id: '6', name: 'H6', status: TableStatus.OCCUPIED, seats: 2, currentOrderTotal: 12.00, zoneId: 'hall', position: { x: 35, y: 50 } },
  { id: '7', name: 'T1', status: TableStatus.AVAILABLE, seats: 4, zoneId: 'terrace', position: { x: 25, y: 30 } },
  { id: '8', name: 'T2', status: TableStatus.AVAILABLE, seats: 2, zoneId: 'terrace', position: { x: 50, y: 30 } },
  { id: '9', name: 'T3', status: TableStatus.AVAILABLE, seats: 4, zoneId: 'terrace', position: { x: 75, y: 30 } },
  { id: '10', name: 'V1', status: TableStatus.AVAILABLE, seats: 8, zoneId: 'vip', isVIP: true, minSpend: 500, position: { x: 30, y: 40 } },
  { id: '11', name: 'V2', status: TableStatus.AVAILABLE, seats: 2, zoneId: 'vip', isVIP: true, discount: 10, position: { x: 70, y: 40 } },
  { id: '12', name: 'V3', status: TableStatus.AVAILABLE, seats: 4, zoneId: 'vip', isVIP: true, position: { x: 50, y: 70 } },
];

const INITIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: '1', code: '1000', name: 'Assets', type: AccountType.ASSET, balance: 142500, children: [
      { id: '1-1', code: '1100', name: 'Cash & Bank', type: AccountType.ASSET, balance: 42500 },
      { id: '1-2', code: '1200', name: 'Inventory Stock', type: AccountType.ASSET, balance: 100000 },
    ]
  },
  {
    id: '4', code: '4000', name: 'Revenue', type: AccountType.REVENUE, balance: 25500, children: [
      { id: '4-1', code: '4100', name: 'Food Sales', type: AccountType.REVENUE, balance: 18000 },
      { id: '4-2', code: '4200', name: 'Beverage Sales', type: AccountType.REVENUE, balance: 7500 },
    ]
  },
  {
    id: '5', code: '5000', name: 'Expenses', type: AccountType.EXPENSE, balance: 8250, children: [
      { id: '5-1', code: '5100', name: 'COGS (Food Cost)', type: AccountType.EXPENSE, balance: 6000 },
      { id: '5-2', code: '5200', name: 'Operational Costs', type: AccountType.EXPENSE, balance: 2250 },
    ]
  },
];

const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Zayed Branch', location: 'Sheikh Zayed', isActive: true, phone: '01012345678' },
  { id: 'b2', name: 'Maadi Branch', location: 'Maadi', isActive: true, phone: '01112345678' },
];

const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'w1', name: 'Main Hub - Zayed', branchId: 'b1', type: WarehouseType.MAIN, isActive: true },
  { id: 'w2', name: 'Kitchen - Zayed', branchId: 'b1', type: WarehouseType.KITCHEN, isActive: true },
  { id: 'w3', name: 'Main Hub - Maadi', branchId: 'b2', type: WarehouseType.MAIN, isActive: true },
];

const INITIAL_PLATFORMS: DeliveryPlatform[] = [
  { id: 'p1', name: 'Talabat', isActive: true },
  { id: 'p2', name: 'Elmenus', isActive: true },
  { id: 'p3', name: 'Mrsool', isActive: true },
  { id: 'p4', name: 'RestoFlow Direct', isActive: true },
];

const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Super Admin',
    email: 'admin@restoflow.com',
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    permissions: INITIAL_ROLE_PERMISSIONS[UserRole.SUPER_ADMIN]
  },
  {
    id: 'u2',
    name: 'Sameh Ahmed',
    email: 'sameh@zayed.com',
    role: UserRole.BRANCH_MANAGER,
    assignedBranchId: 'b1',
    isActive: true,
    permissions: INITIAL_ROLE_PERMISSIONS[UserRole.BRANCH_MANAGER]
  },
  {
    id: 'u3',
    name: 'Branch Mgr October',
    email: 'mgr@october.com',
    role: UserRole.BRANCH_MANAGER,
    assignedBranchId: 'b2',
    isActive: true,
    permissions: INITIAL_ROLE_PERMISSIONS[UserRole.BRANCH_MANAGER]
  },
  {
    id: 'u4',
    name: 'Call Center Agent',
    email: 'cc@restoflow.com',
    role: UserRole.CALL_CENTER,
    isActive: true,
    permissions: INITIAL_ROLE_PERMISSIONS[UserRole.CALL_CENTER]
  },
  {
    id: 'u5',
    name: 'Zayed Cashier',
    email: 'cashier@zayed.com',
    role: UserRole.CASHIER,
    assignedBranchId: 'b1',
    isActive: true,
    permissions: INITIAL_ROLE_PERMISSIONS[UserRole.CASHIER]
  }
];

const INITIAL_MENUS: RestaurantMenu[] = [
  {
    id: 'm1',
    name: 'Main Menu (Full Day)',
    isDefault: true,
    status: 'ACTIVE',
    targetBranches: ['b1', 'b2'],
    targetPlatforms: ['p1', 'p2', 'p4'],
  },
  {
    id: 'm2',
    name: 'Breakfast Menu',
    isDefault: false,
    status: 'ACTIVE',
    targetBranches: ['b1'],
  }
];

const INITIAL_CATEGORIES: MenuCategory[] = [
  {
    id: 'cat1',
    name: 'Burgers',
    menuIds: ['m1'],
    items: [
      {
        id: 'i1',
        name: 'Classic Cheeseburger',
        price: 8.50,
        category: 'Burgers',
        isActive: true,
        description: 'Angus beef with cheddar cheese, lettuce, tomato, and our secret sauce.',
        recipe: [
          { inventoryItemId: 'inv1', quantityNeeded: 1 },
          { inventoryItemId: 'inv2', quantityNeeded: 1 },
          { inventoryItemId: 'inv3', quantityNeeded: 0.05 }
        ],
      },
      {
        id: 'i101',
        name: 'Double BBQ Bacon',
        price: 12.50,
        category: 'Burgers',
        isActive: true,
        description: 'Double patty, smoky bacon, onion rings, and BBQ sauce.',
        recipe: [
          { inventoryItemId: 'inv1', quantityNeeded: 2 },
          { inventoryItemId: 'inv2', quantityNeeded: 1 }
        ],
      },
    ]
  },
  {
    id: 'cat2',
    name: 'Starters',
    menuIds: ['m1'],
    items: [
      {
        id: 'i2',
        name: 'Chicken Wings',
        price: 10.00,
        category: 'Starters',
        isActive: true,
        description: 'Crispy wings with buffalo or BBQ sauce.',
        recipe: [],
      },
      {
        id: 'i202',
        name: 'Mozzarella Sticks',
        price: 7.50,
        category: 'Starters',
        isActive: true,
        description: 'Golden fried cheese with marinara dip.',
        recipe: [],
      },
    ]
  },
  {
    id: 'cat-b1',
    name: 'Breakfast Classics',
    menuIds: ['m2'],
    items: [
      { id: 'ib1', name: 'English Breakfast', price: 11.00, category: 'Breakfast Classics', isActive: true, description: 'Eggs, beans, sausage, and toast.' },
      { id: 'ib2', name: 'Pancakes', price: 8.50, category: 'Breakfast Classics', isActive: true, description: 'Fluffy pancakes with maple syrup.' }
    ]
  }
];

const translations = {
  en: {
    dashboard: "Dashboard",
    pos: "Point of Sale",
    menu: "Menu Catalog",
    kds: "Kitchen Display",
    inventory: "Inventory",
    finance: "Finance & COA",
    crm: "Customers (CRM)",
    reports: "Business Reports",
    ai: "Smart Manager",
    settings: "Settings",
    sign_out: "Sign Out",
    light_mode: "Light Mode",
    dark_mode: "Dark Mode",
    lang: "Language",
    total_rev: "Total Revenue",
    orders: "Total Orders",
    tables: "Active Tables",
    growth: "Growth",
    confirm: "Confirm",
    void: "Void",
    place_order: "Place Order",
    subtotal: "Subtotal",
    tax: "VAT (10%)",
    total: "Total",
    checkout: "Checkout",
    payment_method: "Payment Method",
    split_bill: "Split Bill",
    remaining: "Remaining to Pay",
    void_confirm: "Void current order?",
    ai_insights: "AI Analytics",
    settings: "Settings",
    security: "Security & Users"
  },
  ar: {
    dashboard: "لوحة التحكم",
    pos: "نقطة البيع",
    menu: "قائمة الطعام",
    kds: "شاشة المطبخ",
    inventory: "المخازن",
    finance: "المالية والحسابات",
    crm: "إدارة العملاء",
    reports: "التقارير",
    ai: "المدير الذكي",
    settings: "الإعدادات",
    sign_out: "تسجيل الخروج",
    light_mode: "الوضع المضيء",
    dark_mode: "الوضع الليلي",
    lang: "اللغة",
    total_rev: "إجمالي الإيرادات",
    orders: "إجمالي الطلبات",
    tables: "الطاولات النشطة",
    growth: "النمو",
    confirm: "تأكيد",
    void: "إلغاء",
    place_order: "إتمام الطلب",
    subtotal: "الإجمالي الفرعي",
    tax: "الضريبة (10%)",
    total: "الإجمالي النهائي",
    checkout: "الدفع",
    payment_method: "طريقة الدفع",
    split_bill: "تقسيم الفاتورة",
    remaining: "المتبقي للدفع",
    void_confirm: "هل تريد إلغاء الطلب الحالي؟",
    ai_insights: "تحليلات الذكاء الاصطناعي",
    settings: "الإعدادات",
    security: "الأمان والمستخدمين"
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [lang, setLang] = useState<'en' | 'ar'>('ar');
  const [currency, setCurrency] = useState<'USD' | 'EGP'>('EGP');

  const [accounts, setAccounts] = useState<FinancialAccount[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<JournalEntry[]>([]);
  const [menus, setMenus] = useState<RestaurantMenu[]>(INITIAL_MENUS);
  const [categories, setCategories] = useState<MenuCategory[]>(INITIAL_CATEGORIES);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [platforms, setPlatforms] = useState<DeliveryPlatform[]>(INITIAL_PLATFORMS);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: 'inv1', name: 'Beef Patty', unit: 'pcs', category: 'Meat', threshold: 10, costPrice: 2.50,
      warehouseQuantities: [{ warehouseId: 'w1', quantity: 30 }, { warehouseId: 'w2', quantity: 20 }]
    },
    {
      id: 'inv2', name: 'Buns', unit: 'pcs', category: 'Bakery', threshold: 20, costPrice: 0.50,
      warehouseQuantities: [{ warehouseId: 'w1', quantity: 100 }]
    },
    {
      id: 'inv3', name: 'Cheddar Cheese', unit: 'kg', category: 'Dairy', threshold: 1, costPrice: 12.00,
      warehouseQuantities: [{ warehouseId: 'w2', quantity: 5 }]
    },
  ]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [settings, setSettings] = useState<AppSettings>({
    restaurantName: 'RestoFlow ERP',
    currency: 'EGP',
    currencySymbol: 'ج.م',
    taxRate: 14,
    serviceCharge: 12,
    language: 'ar',
    isDarkMode: true,
    theme: 'nebula',
    branchAddress: 'Sheikh Zayed, Cairo',
    phone: '19000',
    currentUser: INITIAL_USERS[0],
    activeBranchId: 'b1'
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    if (settings.isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.theme, settings.isDarkMode]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showFloorDesigner, setShowFloorDesigner] = useState(false);

  const t = translations[settings.language];

  // Logic to handle User Permissions & Multi-Branch Visibility
  // const [users, setUsers] = useState<User[]>(INITIAL_USERS); // This line was duplicated, removed.

  const hasPermission = (permission: AppPermission) => {
    if (!settings.currentUser) return false;
    if (settings.currentUser.role === UserRole.SUPER_ADMIN) return true;
    return settings.currentUser.permissions.includes(permission);
  };

  const isAdmin = settings.currentUser?.role === UserRole.SUPER_ADMIN;
  const userBranchId = settings.currentUser?.assignedBranchId;
  const effectiveBranchId = isAdmin ? settings.activeBranchId : userBranchId;

  const currentBranch = branches.find(b => b.id === effectiveBranchId) || branches[0];

  const commonProps = {
    settings,
    lang: settings.language,
    t,
    isDarkMode: settings.isDarkMode,
    onChangeView: setCurrentView,
    currentView,
    isAdmin,
    users,
    onUpdateUsers: setUsers,
    hasPermission
  };

  // Auto-redirect if user doesn't have permission for the current view
  useEffect(() => {
    const requiredPermission: AppPermission | null = (() => {
      switch (currentView) {
        case 'DASHBOARD': return AppPermission.NAV_DASHBOARD;
        case 'POS': return AppPermission.NAV_POS;
        case 'KDS': return AppPermission.NAV_KDS;
        case 'FINANCE': return AppPermission.NAV_FINANCE;
        case 'INVENTORY': return AppPermission.NAV_INVENTORY;
        case 'REPORTS': return AppPermission.NAV_REPORTS;
        case 'MENU_MANAGER': return AppPermission.NAV_MENU_MANAGER;
        case 'CRM': return AppPermission.NAV_CRM;
        case 'AI_ASSISTANT': return AppPermission.NAV_AI_ASSISTANT;
        case 'AI_INSIGHTS': return AppPermission.NAV_ADMIN_DASHBOARD;
        case 'SETTINGS': return AppPermission.NAV_SETTINGS;
        case 'CALL_CENTER': return AppPermission.NAV_CALL_CENTER;
        case 'SECURITY': return AppPermission.NAV_SECURITY;
        case 'FLOOR_DESIGNER': return AppPermission.CFG_EDIT_FLOOR_PLAN;
        default: return null;
      }
    })();

    if (requiredPermission && !hasPermission(requiredPermission)) {
      setCurrentView('DASHBOARD'); // Redirect to dashboard if no permission
    }
  }, [currentView, settings.currentUser]);

  // Role-based Auto-Redirect on App Start/Login
  useEffect(() => {
    if (settings.currentUser) {
      if (settings.currentUser.role === UserRole.CASHIER) setCurrentView('POS');
      else if (settings.currentUser.role === UserRole.KITCHEN_STAFF) setCurrentView('KDS');
      else if (settings.currentUser.role === UserRole.CALL_CENTER) setCurrentView('CALL_CENTER');
      else if (settings.currentUser.role === UserRole.SUPER_ADMIN) setCurrentView('DASHBOARD');
    }
  }, [settings.currentUser?.id]);


  const recordTransaction = useCallback((tx: Omit<JournalEntry, 'id'>) => {
    const newTx = { ...tx, id: Math.random().toString(36).substr(2, 9).toUpperCase() };
    setTransactions(prev => [newTx, ...prev]);

    const updateBalance = (accs: FinancialAccount[]): FinancialAccount[] => {
      return accs.map(acc => {
        let newBalance = acc.balance;
        if (acc.id === tx.debitAccountId) newBalance += tx.amount;
        if (acc.id === tx.creditAccountId) newBalance -= tx.amount;
        return {
          ...acc,
          balance: newBalance,
          children: acc.children ? updateBalance(acc.children) : undefined
        };
      });
    };
    setAccounts(prev => updateBalance(prev));
  }, []);

  const handlePlaceOrder = (newOrder: Order) => {
    // Ensure order always has a branchId if not already set (e.g., from POS)
    const orderWithBranch = {
      ...newOrder,
      branchId: newOrder.branchId || effectiveBranchId
    };

    setOrders(prev => [...prev, orderWithBranch]);
    let totalCOGS = 0;
    setInventory(prevInv => {
      const nextInv = [...prevInv];
      newOrder.items.forEach(item => {
        let latestRecipe = item.recipe;
        categories.forEach(cat => {
          const found = cat.items.find(mi => mi.id === item.id);
          if (found) latestRecipe = found.recipe;
        });
        if (latestRecipe) {
          latestRecipe.forEach(ri => {
            const idx = nextInv.findIndex(i => i.id === ri.inventoryItemId);
            if (idx !== -1) {
              const invItem = nextInv[idx];
              totalCOGS += invItem.costPrice * ri.quantityNeeded * item.quantity;
              nextInv[idx] = {
                ...invItem,
                quantity: Math.max(0, invItem.quantity - (ri.quantityNeeded * item.quantity)),
                lastUpdated: new Date()
              };
            }
          });
        }
      });
      return nextInv;
    });
    recordTransaction({
      date: new Date(),
      description: `Sale - Order #${newOrder.id}`,
      debitAccountId: '1-1',
      creditAccountId: '4-1',
      amount: newOrder.total,
      referenceId: newOrder.id
    });
    recordTransaction({
      date: new Date(),
      description: `Inventory Depletion - Order #${newOrder.id}`,
      debitAccountId: '5-1',
      creditAccountId: '1-2',
      amount: totalCOGS,
      referenceId: newOrder.id
    });
  };

  const handleUpdateMenuItem = (menuId: string, categoryId: string, updatedItem: MenuItem) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => item.id === updatedItem.id ? updatedItem : item)
      };
    }));
  };

  const handleAddMenuItem = (menuId: string, categoryId: string, newItem: MenuItem) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return { ...cat, items: [...cat.items, newItem] };
    }));
  };

  const handleDeleteMenuItem = (menuId: string, categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return { ...cat, items: cat.items.filter(item => item.id !== itemId) };
    }));
  };

  const handleAddCategory = (menuId: string, newCategory: MenuCategory) => {
    setCategories(prev => [...prev, { ...newCategory, menuIds: [menuId] }]);
  };

  const handleDeleteCategory = (menuId: string, categoryId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return { ...cat, menuIds: cat.menuIds.filter(id => id !== menuId) };
    }).filter(cat => cat.menuIds.length > 0)); // Delete if no menus
  };

  const handleAddMenu = (newMenu: RestaurantMenu) => {
    setMenus(prev => [...prev, newMenu]);
  };

  const handleUpdateMenu = (updatedMenu: RestaurantMenu) => {
    setMenus(prev => prev.map(m => m.id === updatedMenu.id ? updatedMenu : m));
  };

  const handleLinkCategory = (menuId: string, categoryId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      if (cat.menuIds.includes(menuId)) return cat;
      return { ...cat, menuIds: [...cat.menuIds, menuId] };
    }));
  };

  const currencySymbol = currency === 'USD' ? '$' : 'ج.م';

  const renderView = () => {
    const allItems = categories.flatMap(c => c.items);
    // const commonProps = { lang, t, isDarkMode: settings.isDarkMode };

    return (
      <div className="view-transition w-full h-full overflow-y-auto no-scrollbar pb-20">
        {(() => {
          switch (currentView) {
            case 'DASHBOARD': return isAdmin ? <AdminDashboard {...commonProps} branches={branches} /> : <Dashboard {...commonProps} onChangeView={setCurrentView} />;
            case 'POS': return (
              <POS
                {...commonProps}
                onPlaceOrder={handlePlaceOrder}
                customers={customers}
                menus={menus}
                categories={categories}
                currencySymbol={currencySymbol}
                setGlobalCurrency={setCurrency}
                tables={tables}
                isSidebarCollapsed={isSidebarCollapsed}
                branchId={effectiveBranchId}
              />
            );
            case 'KDS':
              const branchOrders = orders.filter(o => o.branchId === effectiveBranchId);
              return <KDS {...commonProps} orders={branchOrders} onReady={(id) => { }} />;
            case 'FINANCE': return <Finance {...commonProps} accounts={accounts} transactions={transactions} />;
            case 'INVENTORY': return (
              <Inventory
                {...commonProps}
                inventory={inventory}
                suppliers={suppliers}
                purchaseOrders={purchaseOrders}
                onAddPO={(po) => setPurchaseOrders([po, ...purchaseOrders])}
                warehouses={warehouses}
                branches={branches}
              />
            );
            case 'REPORTS': return <Reports {...commonProps} menuItems={allItems} inventory={inventory} />;
            case 'MENU_MANAGER': return (
              <MenuManager
                {...commonProps}
                inventory={inventory}
                menus={menus}
                categories={categories}
                branches={branches}
                platforms={platforms}
                onUpdateMenuItem={handleUpdateMenuItem}
                onAddMenuItem={handleAddMenuItem}
                onDeleteMenuItem={handleDeleteMenuItem}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddMenu={handleAddMenu}
                onUpdateMenu={handleUpdateMenu}
                onLinkCategory={handleLinkCategory}
              />
            );
            case 'CRM': return <CRM {...commonProps} customers={customers} onAddCustomer={() => { }} />;
            case 'AI_ASSISTANT': return <AIAssistant {...commonProps} />;
            case 'AI_INSIGHTS': return (
              <AIInsights
                {...commonProps}
                menuItems={allItems}
                inventory={inventory}
                orders={orders}
              />
            );
            case 'SETTINGS': return (
              <SettingsHub
                {...commonProps}
                settings={settings}
                branches={branches}
                platforms={platforms}
                warehouses={warehouses}
                onUpdateSettings={setSettings}
                onChangeView={setCurrentView}
                onOpenFloorDesigner={() => setShowFloorDesigner(true)}
              />
            );
            case 'CALL_CENTER': return (
              <CallCenter
                {...commonProps}
                customers={customers}
                branches={branches}
                categories={categories}
                onPlaceOrder={handlePlaceOrder}
                orders={orders}
              />
            );
            case 'SECURITY': return (
              <SecurityHub
                users={users}
                onUpdateUsers={setUsers}
                branches={branches}
                {...commonProps}
              />
            );
            default: return <Dashboard {...commonProps} />;
          }
        })()}
      </div>
    );
  };

  return (
    <div className={`flex min-h-screen transition-all duration-500 bg-slate-50 dark:bg-slate-950`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        isDarkMode={settings.isDarkMode}
        onToggleDarkMode={() => setSettings({ ...settings, isDarkMode: !settings.isDarkMode })}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        lang={settings.language}
        onToggleLang={() => setSettings({ ...settings, language: settings.language === 'en' ? 'ar' : 'en' })}
        user={settings.currentUser}
        isAdmin={isAdmin}
        branches={branches}
        activeBranchId={settings.activeBranchId}
        onSelectBranch={(id) => setSettings({ ...settings, activeBranchId: id })}
        hasPermission={hasPermission}
      />

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${lang === 'ar'
        ? (isSidebarCollapsed ? 'lg:mr-16' : 'lg:mr-56 xl:mr-64')
        : (isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56 xl:ml-64')
        } relative overflow-hidden`}>
        {renderView()}
      </main>
      {showFloorDesigner && (
        <FloorDesigner
          tables={tables}
          onSave={(newTables, newZones) => {
            setTables(newTables);
            // Zones can be persisted to settings or separate state if needed
          }}
          onClose={() => setShowFloorDesigner(false)}
          lang={lang}
        />
      )}
    </div>
  );
};

export default App;
