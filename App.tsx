import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import PrinterManager from './components/PrinterManager';

// Lazy loaded components for better performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const POS = lazy(() => import('./components/POS'));
const KDS = lazy(() => import('./components/KDS'));
const Inventory = lazy(() => import('./components/Inventory'));
const Finance = lazy(() => import('./components/Finance'));
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const CRM = lazy(() => import('./components/CRM'));
const Reports = lazy(() => import('./components/Reports'));
const MenuManager = lazy(() => import('./components/MenuManager'));
const AIInsights = lazy(() => import('./components/AIInsights'));
const SettingsHub = lazy(() => import('./components/SettingsHub'));
const FloorDesigner = lazy(() => import('./components/FloorDesigner'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const CallCenter = lazy(() => import('./components/CallCenter'));
const SecurityHub = lazy(() => import('./components/SecurityHub'));
const RecipeManager = lazy(() => import('./components/RecipeManager'));
const ForensicsHub = lazy(() => import('./components/ForensicsHub'));
const KeyboardHelp = lazy(() => import('./components/KeyboardHelp'));
import {
  ViewState, Order, OrderStatus, OrderItem, PaymentMethod,
  OrderType, Customer, Supplier, PurchaseOrder, InventoryItem,
  FinancialAccount, AccountType, JournalEntry, RestaurantMenu, MenuItem,
  Table, TableStatus, MenuCategory, Branch, DeliveryPlatform, Warehouse, WarehouseType, User, UserRole,
  AppPermission, INITIAL_ROLE_PERMISSIONS, AppSettings, AuditLog, AuditEventType, RecipeIngredient
} from './types';
import { translations } from './services/translations';

// Loading skeleton component for Suspense fallback
const LoadingSkeleton = () => (
  <div className="flex-1 flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-sm font-bold text-slate-400 animate-pulse">Loading...</p>
    </div>
  </div>
);


const INITIAL_TABLES: Table[] = [];

const INITIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: '1', code: '1000', name: 'Assets', type: AccountType.ASSET, balance: 0, children: [
      {
        id: '1-1', code: '1100', name: 'Cash & Cash Equivalents', type: AccountType.ASSET, balance: 0, children: [
          { id: '1-1-1', code: '1110', name: 'Cashier Main', type: AccountType.ASSET, balance: 0 },
        ]
      },
      {
        id: '1-2', code: '1200', name: 'Inventory Stock', type: AccountType.ASSET, balance: 0, children: [
          { id: '1-2-1', code: '1210', name: 'Raw Materials', type: AccountType.ASSET, balance: 0 },
        ]
      },
    ]
  },
  {
    id: '2', code: '2000', name: 'Liabilities', type: AccountType.LIABILITY, balance: 0, children: [
      { id: '2-1', code: '2100', name: 'Accounts Payable', type: AccountType.LIABILITY, balance: 0 },
    ]
  },
  {
    id: '4', code: '4000', name: 'Revenue', type: AccountType.REVENUE, balance: 0, children: [
      { id: '4-1', code: '4100', name: 'Sales', type: AccountType.REVENUE, balance: 0 },
    ]
  },
  {
    id: '5', code: '5000', name: 'Expenses', type: AccountType.EXPENSE, balance: 0, children: [
      {
        id: '5-1', code: '5100', name: 'Direct Costs (COGS)', type: AccountType.EXPENSE, balance: 0, children: [
          { id: '5-1-1', code: '5110', name: 'Inventory Cost', type: AccountType.EXPENSE, balance: 0 },
        ]
      },
    ]
  },
];

const INITIAL_TRANSACTIONS: JournalEntry[] = [];

const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Headquarters', location: 'Main Location', isActive: true, phone: '' },
];

const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'w1', name: 'Store Room', branchId: 'b1', type: WarehouseType.MAIN, isActive: true },
];

const INITIAL_PLATFORMS: DeliveryPlatform[] = [
  { id: 'p1', name: 'Store Direct', isActive: true },
];

const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Super Admin',
    email: 'admin@1.com',
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    permissions: INITIAL_ROLE_PERMISSIONS[UserRole.SUPER_ADMIN]
  }
];

const INITIAL_MENUS: RestaurantMenu[] = [];
const INITIAL_CATEGORIES: MenuCategory[] = [];

// Translations imported from services/translations.ts

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [currency, setCurrency] = useState<'USD' | 'EGP'>('EGP');

  const [accounts, setAccounts] = useState<FinancialAccount[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<JournalEntry[]>(INITIAL_TRANSACTIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [menus, setMenus] = useState<RestaurantMenu[]>(INITIAL_MENUS);
  const [categories, setCategories] = useState<MenuCategory[]>(INITIAL_CATEGORIES);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [platforms, setPlatforms] = useState<DeliveryPlatform[]>(INITIAL_PLATFORMS);

  // Offline & Sync State
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('erp_settings');
    const initial = {
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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed, currentUser: undefined }; // Don't persist user session for security
      } catch (e) {
        return initial;
      }
    }
    return initial;
  });

  useEffect(() => {
    const { currentUser, ...toSave } = settings;
    localStorage.setItem('erp_settings', JSON.stringify(toSave));
  }, [settings]);

  const [loginError, setLoginError] = useState<string | undefined>();

  const handleLogin = (email: string, pass: string) => {
    // Basic simulation of auth
    const user = INITIAL_USERS.find(u => u.email === email);
    if (user) {
      setSettings(prev => ({
        ...prev,
        currentUser: user,
        activeBranchId: user.assignedBranchId || 'b1'
      }));
      // Auto-route based on role
      if (user.role === UserRole.CASHIER) setCurrentView('POS');
      else if (user.role === UserRole.KITCHEN_STAFF) setCurrentView('KDS');
      else setCurrentView('DASHBOARD');

      setLoginError(undefined);
    } else {
      setLoginError(settings.language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid identity credentials');
    }
  };

  const [posMode, setPosMode] = useState<OrderType>(OrderType.DINE_IN); // Default POS Mode
  const [discount, setDiscount] = useState(0);
  const [heldOrders, setHeldOrders] = useState<{ cart: any[], tableId?: string, customerId?: string }[]>([]);
  const [recalledOrder, setRecalledOrder] = useState<{ cart: any[], tableId?: string, customerId?: string } | null>(null);

  const handleSetPosMode = (mode: OrderType) => {
    setPosMode(mode);
    setCurrentView('POS');
  };

  const logout = () => {
    setSettings(prev => ({ ...prev, currentUser: undefined, activeBranchId: undefined }));
    setCurrentView('DASHBOARD');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    if (settings.isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.theme, settings.isDarkMode]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const toggleTouchMode = () => setSettings(prev => ({ ...prev, isTouchMode: !prev.isTouchMode }));
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
        case 'RECIPES': return AppPermission.NAV_RECIPES;
        case 'CRM': return AppPermission.NAV_CRM;
        case 'AI_ASSISTANT': return AppPermission.NAV_AI_ASSISTANT;
        case 'AI_INSIGHTS': return AppPermission.NAV_ADMIN_DASHBOARD;
        case 'SETTINGS': return AppPermission.NAV_SETTINGS;
        case 'CALL_CENTER': return AppPermission.NAV_CALL_CENTER;
        case 'SECURITY': return AppPermission.NAV_SECURITY;
        case 'FORENSICS': return AppPermission.NAV_FORENSICS;
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

  const recordAuditLog = useCallback((
    eventType: AuditEventType,
    payload: { before?: any; after: any; reason?: string },
    metadata?: Record<string, any>
  ) => {
    const user = settings.currentUser;
    if (!user) return;

    const log: AuditLog = {
      id: `LOG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date(),
      eventType,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      branchId: settings.activeBranchId || 'GLOBAL',
      deviceId: 'WEB-CLIENT-SIM', // In production, this would be a real device fingerprint
      payload,
      metadata
    };

    setAuditLogs(prev => [log, ...prev]);
  }, [settings.currentUser, settings.activeBranchId]);

  const handlePlaceOrder = (newOrder: Order) => {
    const orderWithBranch: Order = {
      ...newOrder,
      branchId: newOrder.branchId || effectiveBranchId,
      createdAt: new Date(),
      status: isOnline ? 'COMPLETED' : 'PENDING',
      syncStatus: isOnline ? 'SYNCED' : 'PENDING'
    };

    if (!isOnline) {
      setOfflineQueue(prev => [...prev, orderWithBranch]);
      setOrders(prev => [...prev, orderWithBranch]); // Optimistic UI update

      // Still deduct stock loosely in local state, but don't record valid financial transaction until sync
      // For this simulation, we'll skip financial recording in offline mode and do it on sync.
      return;
    }

    setOrders(prev => [...prev, orderWithBranch]);

    let totalCOGS = 0;
    // Find the target warehouse for depletion (Kitchen or POS warehouse of current branch)
    const targetBranchWarehouse = warehouses.find(w => w.branchId === orderWithBranch.branchId && (w.type === WarehouseType.KITCHEN || w.type === WarehouseType.POINT_OF_SALE)) || warehouses.find(w => w.branchId === orderWithBranch.branchId);

    setInventory(prevInv => {
      const nextInv = [...prevInv];

      newOrder.items.forEach(orderItem => {
        // 1. Get Base Item Recipe
        const menuItems = categories.flatMap(c => c.items);
        const baseItem = menuItems.find(mi => mi.id === orderItem.id);
        const receiptsToProcess: RecipeIngredient[] = [...(baseItem?.recipe || [])];

        // 2. Add Modifier Recipes
        orderItem.selectedModifiers?.forEach(mod => {
          const modGroup = baseItem?.modifierGroups?.find(mg => mg.name === mod.groupName);
          const modOption = modGroup?.options.find(o => o.name === mod.optionName);
          if (modOption?.recipe) {
            receiptsToProcess.push(...modOption.recipe);
          }
        });

        // 3. Deduct stock for all ingredients
        receiptsToProcess.forEach(ri => {
          const invIdx = nextInv.findIndex(ii => ii.id === ri.itemId);
          if (invIdx !== -1) {
            const invItem = nextInv[invIdx];
            totalCOGS += (invItem.costPrice * ri.quantity * orderItem.quantity);

            // Deduct from warehouseQuantities
            const updatedWarehouses = invItem.warehouseQuantities.map(wq => {
              if (targetBranchWarehouse && wq.warehouseId === targetBranchWarehouse.id) {
                return { ...wq, quantity: Math.max(0, wq.quantity - (ri.quantity * orderItem.quantity)) };
              }
              return wq;
            });

            nextInv[invIdx] = {
              ...invItem,
              warehouseQuantities: updatedWarehouses
            };

            // Note: Ideally record stock movement here, but for simulation we update local state
          }
        });
      });

      return nextInv;
    });

    // Recording Financial Transactions (Hierarchical CoA Mapping)
    recordTransaction({
      date: new Date(),
      description: `Sale - Order #${orderWithBranch.id}`,
      debitAccountId: '1-1-1', // Asset: Cashier Main
      creditAccountId: '4-1', // Revenue: Food Sales
      amount: orderWithBranch.total,
      referenceId: orderWithBranch.id
    });

    recordTransaction({
      date: new Date(),
      description: `COGS - Order #${orderWithBranch.id}`,
      debitAccountId: '5-1-1', // Expense: Food Cost
      creditAccountId: '1-2-1', // Asset: Raw Materials
      amount: totalCOGS,
      referenceId: orderWithBranch.id
    });

    recordAuditLog(AuditEventType.POS_ORDER_PLACEMENT, {
      after: orderWithBranch,
      reason: 'Standard customer order'
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

  const handleReceivePO = (poId: string, receivedAt: Date) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id !== poId) return po;
      const updatedPo: PurchaseOrder = { ...po, status: 'RECEIVED', receivedDate: receivedAt };

      // Update Inventory Quantities
      setInventory(prevInv => prevInv.map(invItem => {
        const poItem = updatedPo.items.find(item => item.itemId === invItem.id);
        if (poItem && updatedPo.targetWarehouseId) {
          const updatedWarehouses = invItem.warehouseQuantities.map(wq => {
            if (wq.warehouseId === updatedPo.targetWarehouseId) {
              return { ...wq, quantity: wq.quantity + (poItem.receivedQuantity || poItem.quantity) };
            }
            return wq;
          });
          return { ...invItem, warehouseQuantities: updatedWarehouses };
        }
        return invItem;
      }));

      // Record Audit
      recordAuditLog(AuditEventType.PO_STATUS_CHANGE, {
        before: po,
        after: updatedPo,
        reason: 'Received shipment'
      });

      // Record Transaction
      recordTransaction({
        date: receivedAt,
        description: `Inventory Received - PO #${poId}`,
        debitAccountId: '1-2-1', // Asset: Raw Materials
        creditAccountId: '2-1', // Liability: Accounts Payable
        amount: updatedPo.totalCost,
        referenceId: poId
      });

      return updatedPo;
    }));
  };

  const handleUpdatePrinter = (updatedPrinter: Printer) => {
    setPrinters(prev => prev.map(p => p.id === updatedPrinter.id ? updatedPrinter : p));
  };

  const handleAddPrinter = (newPrinter: Printer) => {
    setPrinters(prev => [...prev, newPrinter]);
  };

  const handleDeletePrinter = (id: string) => {
    setPrinters(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateRecipe = (menuItemId: string, recipe: RecipeIngredient[]) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      items: cat.items.map(item => item.id === menuItemId ? { ...item, recipe } : item)
    })));
  };

  const currencySymbol = currency === 'USD' ? '$' : 'ج.م';

  const renderView = () => {
    const allItems = categories.flatMap(c => c.items);
    // const commonProps = { lang, t, isDarkMode: settings.isDarkMode };

    return (
      <Suspense fallback={<LoadingSkeleton />}>
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
                  hasPermission={hasPermission}
                  activeMode={posMode}
                  isTouchMode={settings.isTouchMode}
                  onSetOrderMode={setPosMode}
                  onToggleDarkMode={() => setSettings(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }))}
                  onToggleTouchMode={() => setSettings(prev => ({ ...prev, isTouchMode: !prev.isTouchMode }))}
                  theme={settings.theme}
                  onThemeChange={(theme) => setSettings(prev => ({ ...prev, theme }))}
                  discount={discount}
                  onSetDiscount={setDiscount}
                  heldOrders={heldOrders}
                  onHoldOrder={(order) => setHeldOrders(prev => [...prev, order])}
                  onRecallOrder={(index) => {
                    const order = heldOrders[index];
                    setHeldOrders(prev => prev.filter((_, i) => i !== index));
                    setRecalledOrder(order);
                  }}
                  recalledOrder={recalledOrder}
                  onClearRecalledOrder={() => setRecalledOrder(null)}
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
                  onAddPO={(po) => setPurchaseOrders(prev => [...prev, po])}
                  onReceivePO={handleReceivePO}
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
                  printers={printers}
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
              case 'PRINTERS': return (
                <PrinterManager
                  {...commonProps}
                  printers={printers}
                  branches={branches}
                  onAddPrinter={handleAddPrinter}
                  onUpdatePrinter={handleUpdatePrinter}
                  onDeletePrinter={handleDeletePrinter}
                />
              );
              case 'RECIPES': return (
                <RecipeManager
                  {...commonProps}
                  menuItems={categories.flatMap(c => c.items)}
                  inventoryItems={inventory}
                  categories={categories}
                  onUpdateRecipe={handleUpdateRecipe}
                  currencySymbol={currencySymbol}
                />
              );
              case 'CRM': return <CRM {...commonProps} customers={customers} onAddCustomer={() => { }} />;
              case 'AI_ASSISTANT': return <AIAssistant {...commonProps} inventory={inventory} orders={orders} menuItems={allItems} accounts={accounts} branches={branches} />;
              case 'AI_INSIGHTS': return (
                <AIInsights
                  {...commonProps}
                  settings={settings}
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
              case 'FORENSICS': return (
                <ForensicsHub
                  logs={auditLogs}
                  users={users}
                  {...commonProps}
                />
              );
              default: return <Dashboard {...commonProps} />;
            }
          })()}
        </div>
      </Suspense>
    );
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme, settings.isDarkMode]);

  if (!settings.currentUser) {
    return (
      <Login
        onLogin={handleLogin}
        lang={settings.language}
        setLang={(l) => setSettings(prev => ({ ...prev, language: l }))}
        error={loginError}
      />
    );
  }

  return (
    <div className={`flex min-h-screen transition-all duration-500 bg-[rgb(var(--bg-app))] text-[rgb(var(--text-main))]`} dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        isDarkMode={settings.isDarkMode}
        onToggleDarkMode={() => setSettings({ ...settings, isDarkMode: !settings.isDarkMode })}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        lang={settings.language}
        onToggleLang={() => setSettings({ ...settings, language: settings.language === 'en' ? 'ar' : 'en' })}
        user={settings.currentUser}
        isAdmin={isAdmin}
        branches={branches}
        activeBranchId={settings.activeBranchId}
        onSelectBranch={(id) => setSettings({ ...settings, activeBranchId: id })}
        hasPermission={hasPermission}
        onLogout={logout}
        theme={settings.theme}
        onThemeChange={(newTheme) => setSettings({ ...settings, theme: newTheme })}
        onSetOrderMode={handleSetPosMode}
        isTouchMode={settings.isTouchMode}
        onToggleTouchMode={() => setSettings(prev => ({ ...prev, isTouchMode: !prev.isTouchMode }))}
        discount={discount}
        onSetDiscount={setDiscount}
        heldOrders={heldOrders}
        onRecallOrder={(index) => {
          const order = heldOrders[index];
          setHeldOrders(prev => prev.filter((_, i) => i !== index));
          setRecalledOrder(order);
          setCurrentView('POS');
        }}
      />

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${settings.language === 'ar'
        ? (isSidebarCollapsed ? 'lg:mr-16' : (settings.isTouchMode ? 'lg:mr-80' : 'lg:mr-64'))
        : (isSidebarCollapsed ? 'lg:ml-16' : (settings.isTouchMode ? 'lg:ml-80' : 'lg:ml-64'))
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
          lang={settings.language}
        />
      )}

      {/* Keyboard Shortcuts Help Overlay */}
      <Suspense fallback={null}>
        <KeyboardHelp lang={settings.language} />
      </Suspense>
    </div>
  );
};

export default App;
