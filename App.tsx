
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
import {
  ViewState, Order, OrderStatus, OrderItem, PaymentMethod,
  OrderType, Customer, Supplier, PurchaseOrder, InventoryItem,
  FinancialAccount, AccountType, JournalEntry, RestaurantMenu, MenuItem,
  Table, TableStatus
} from './types';

const INITIAL_TABLES: Table[] = [
  { id: '1', name: '01', status: TableStatus.AVAILABLE, seats: 2 },
  { id: '2', name: '02', status: TableStatus.AVAILABLE, seats: 2 },
  { id: '3', name: '03', status: TableStatus.OCCUPIED, seats: 4, currentOrderTotal: 45.50 },
  { id: '4', name: '04', status: TableStatus.AVAILABLE, seats: 4 },
  { id: '5', name: '05', status: TableStatus.RESERVED, seats: 6 },
  { id: '6', name: '06', status: TableStatus.OCCUPIED, seats: 2, currentOrderTotal: 12.00 },
  { id: '7', name: '07', status: TableStatus.AVAILABLE, seats: 4 },
  { id: '8', name: '08', status: TableStatus.AVAILABLE, seats: 2 },
  { id: '9', name: '09', status: TableStatus.AVAILABLE, seats: 4 },
  { id: '10', name: '10', status: TableStatus.AVAILABLE, seats: 8 },
  { id: '11', name: '11', status: TableStatus.AVAILABLE, seats: 2 },
  { id: '12', name: '12', status: TableStatus.AVAILABLE, seats: 4 },
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

const INITIAL_MENUS: RestaurantMenu[] = [
  {
    id: 'm1',
    name: 'Main Menu (Full Day)',
    isDefault: true,
    status: 'ACTIVE',
    categories: [
      {
        id: 'cat1',
        name: 'Burgers',
        items: [
          {
            id: 'i1',
            name: 'Classic Cheeseburger',
            price: 8.50,
            category: 'Burgers',
            isActive: true,
            description: 'Angus beef with cheddar cheese',
            recipe: [
              { inventoryItemId: 'inv1', quantityNeeded: 1 },
              { inventoryItemId: 'inv2', quantityNeeded: 1 },
              { inventoryItemId: 'inv3', quantityNeeded: 0.05 }
            ],
          },
          {
            id: 'i2',
            name: 'Chicken Wings',
            price: 12.00,
            category: 'Starters',
            isActive: true,
            description: 'Crispy wings with buffalo sauce',
            recipe: [],
          },
        ]
      }
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
    settings: "Settings"
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
    settings: "الإعدادات"
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [lang, setLang] = useState<'en' | 'ar'>('ar');
  const [currency, setCurrency] = useState<'USD' | 'EGP'>('EGP');

  const [accounts, setAccounts] = useState<FinancialAccount[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<JournalEntry[]>([]);
  const [menus, setMenus] = useState<RestaurantMenu[]>(INITIAL_MENUS);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'inv1', name: 'Beef Patty', quantity: 50, unit: 'pcs', threshold: 10, lastUpdated: new Date(), costPrice: 2.50 },
    { id: 'inv2', name: 'Buns', quantity: 100, unit: 'pcs', threshold: 20, lastUpdated: new Date(), costPrice: 0.50 },
    { id: 'inv3', name: 'Cheddar Cheese', quantity: 5, unit: 'kg', threshold: 1, lastUpdated: new Date(), costPrice: 12.00 },
  ]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [settings, setSettings] = useState<AppSettings>({
    restaurantName: 'RestoFlow ERP',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 14,
    serviceCharge: 12,
    language: 'en',
    isDarkMode: false,
    branchAddress: 'Heliopolis, Cairo, Egypt',
    phone: '+20 123 456 789'
  });
  const [showFloorDesigner, setShowFloorDesigner] = useState(false);

  const t = translations[lang];

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
    setOrders(prev => [...prev, newOrder]);
    let totalCOGS = 0;
    setInventory(prevInv => {
      const nextInv = [...prevInv];
      newOrder.items.forEach(item => {
        let latestRecipe = item.recipe;
        menus.forEach(menu => menu.categories.forEach(cat => {
          const found = cat.items.find(mi => mi.id === item.id);
          if (found) latestRecipe = found.recipe;
        }));
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
    setMenus(prev => prev.map(menu => {
      if (menu.id !== menuId) return menu;
      return {
        ...menu,
        categories: menu.categories.map(cat => {
          if (cat.id !== categoryId) return cat;
          return {
            ...cat,
            items: cat.items.map(item => item.id === updatedItem.id ? updatedItem : item)
          };
        })
      };
    }));
  };

  const currencySymbol = currency === 'USD' ? '$' : 'ج.م';

  const renderView = () => {
    const allItems = menus.flatMap(m => m.categories.flatMap(c => c.items));
    const commonProps = { lang, t, isDarkMode };
    switch (currentView) {
      case 'DASHBOARD': return <Dashboard {...commonProps} onChangeView={setCurrentView} />;
      case 'POS': return (
        <POS
          {...commonProps}
          onPlaceOrder={handlePlaceOrder}
          customers={customers}
          currencySymbol={currencySymbol}
          setGlobalCurrency={setCurrency}
          tables={tables}
        />
      );
      case 'FINANCE': return <Finance {...commonProps} accounts={accounts} transactions={transactions} />;
      case 'INVENTORY': return <Inventory {...commonProps} inventory={inventory} suppliers={suppliers} purchaseOrders={purchaseOrders} onAddPO={() => { }} />;
      case 'REPORTS': return <Reports {...commonProps} menuItems={allItems} inventory={inventory} />;
      case 'MENU_MANAGER': return <MenuManager {...commonProps} inventory={inventory} menus={menus} onUpdateMenuItem={handleUpdateMenuItem} />;
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
        <SettingsHub
          {...commonProps}
          settings={settings}
          onUpdateSettings={setSettings}
          onChangeView={setCurrentView}
          onOpenFloorDesigner={() => setShowFloorDesigner(true)}
        />
      default: return <Dashboard {...commonProps} />;
    }
  };

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'dark' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        lang={lang}
        setLang={setLang}
        t={t}
      />
      <main className={`flex-1 transition-all ${lang === 'ar' ? 'mr-64' : 'ml-64'}`}>
        {renderView()}
      </main>
      {showFloorDesigner && (
        <FloorDesigner
          tables={tables}
          onSave={setTables}
          onClose={() => setShowFloorDesigner(false)}
          lang={lang}
        />
      )}
    </div>
  );
};

export default App;
