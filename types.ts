
export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export enum AuditEventType {
  POS_VOID = 'POS_VOID',
  POS_DISCOUNT = 'POS_DISCOUNT',
  POS_ORDER_PLACEMENT = 'POS_ORDER_PLACEMENT',
  POS_PAYMENT = 'POS_PAYMENT',
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT',
  INVENTORY_TRANSFER = 'INVENTORY_TRANSFER',
  PO_STATUS_CHANGE = 'PO_STATUS_CHANGE',
  SECURITY_PERMISSION_CHANGE = 'SECURITY_PERMISSION_CHANGE',
  SECURITY_LOGIN = 'SECURITY_LOGIN',
  ACCOUNTING_ADJUSTMENT = 'ACCOUNTING_ADJUSTMENT',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE'
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId: string;
  userName: string;
  userRole: string;
  branchId: string;
  deviceId: string;
  ipAddress?: string;
  payload: {
    before?: any;
    after: any;
    reason?: string;
  };
  metadata?: Record<string, any>;
  isTampered?: boolean; // For forensic detection
  signature?: string; // Potential HMAC for verification
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY'
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  DIRTY = 'DIRTY'
}

export enum PaymentMethod {
  CASH = 'CASH',
  VISA = 'VISA',
  VODAFONE_CASH = 'VODAFONE_CASH',
  INSTAPAY = 'INSTAPAY',
  SPLIT = 'SPLIT'
}

export interface PaymentRecord {
  method: PaymentMethod;
  amount: number;
}

// --- Accounting & Finance ---
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export interface FinancialAccount {
  id: string;
  code: string; // e.g., "1101"
  name: string;
  type: AccountType;
  balance: number;
  parentId?: string;
  children?: FinancialAccount[];
}

export interface JournalEntry {
  id: string;
  date: Date;
  description: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  referenceId?: string; // Order ID or PO ID
}
// --- Inventory & Recipe ---

export interface RecipeIngredient {
  itemId: string; // Link to InventoryItem
  quantity: number;
  unit: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  recipe?: RecipeIngredient[]; // Recipe for the specific modifier option
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelection: number;
  maxSelection: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  image?: string;
  categoryId: string;
  isAvailable: boolean;
  preparationTime?: number;
  isPopular?: boolean;
  recipe?: RecipeIngredient[]; // Link to raw materials
  modifierGroups?: ModifierGroup[];
}

export enum WarehouseType {
  MAIN = 'MAIN',
  SUB = 'SUB',
  KITCHEN = 'KITCHEN',
  POINT_OF_SALE = 'POINT_OF_SALE'
}

export interface Warehouse {
  id: string;
  name: string;
  branchId: string;
  type: WarehouseType;
  isActive: boolean;
  linkedWarehouses?: string[]; // IDs of warehouses for distribution
}


export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  category: string;
  threshold: number;
  costPrice: number;
  supplierId?: string;
  warehouseQuantities: {
    warehouseId: string;
    quantity: number;
  }[];
  recipe?: RecipeIngredient[]; // If this is a semi-finished product
}

export interface StockMovement {
  id: string;
  itemId: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  quantity: number;
  type: 'TRANSFER' | 'ADJUSTMENT' | 'PURCHASE' | 'SALE_CONSUMPTION' | 'WASTE';
  date: Date;
  actorId: string;
  referenceId?: string; // Order ID or PO ID
}

export interface OrderItem extends MenuItem {
  cartId: string;
  quantity: number;
  selectedModifiers: {
    groupName: string;
    optionName: string;
    price: number
  }[];
}

export interface Order {
  id: string;
  type: OrderType;
  branchId: string; // The branch handling this order
  tableId?: string;
  customerId?: string;
  deliveryAddress?: string;
  isCallCenterOrder?: boolean;
  items: OrderItem[];
  status: OrderStatus;
  syncStatus?: SyncStatus; // Offline-first sync tracking
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
  paymentMethod?: PaymentMethod;
  payments?: PaymentRecord[];
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  items: {
    itemId: string; // Link to InventoryItem
    itemName: string;
    quantity: number;
    unitPrice: number;
    receivedQuantity?: number;
  }[];
  totalCost: number;
  date: Date;
  receivedDate?: Date;
  targetWarehouseId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastOrderDate?: Date;
}

export interface FloorZone {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  managerName?: string;
  phone: string;
  email?: string;
  menuId?: string; // Main menu for this branch
  isActive: boolean;
  openingHours?: string;
  taxNumber?: string;
}

export interface DeliveryPlatform {
  id: string;
  name: string;
  icon?: string;
  isActive: boolean;
}

export interface Table {
  id: string;
  name: string;
  status: TableStatus;
  seats: number;
  currentOrderTotal?: number;
  position?: { x: number; y: number };
  zoneId?: string;
  shape?: 'square' | 'round' | 'rectangle';
  discount?: number;
  minSpend?: number;
  isVIP?: boolean;
  notes?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
  menuIds: string[]; // Linked to these menu IDs
}

export interface RestaurantMenu {
  id: string;
  name: string;
  isDefault: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  targetBranches?: string[];
  targetZones?: string[];
  targetPlatforms?: string[];
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  isActive: boolean;
}

export enum AppPermission {
  // --- Navigation & View Access ---
  NAV_DASHBOARD = 'NAV_DASHBOARD',
  NAV_ADMIN_DASHBOARD = 'NAV_ADMIN_DASHBOARD',
  NAV_POS = 'NAV_POS',
  NAV_KDS = 'NAV_KDS',
  NAV_CALL_CENTER = 'NAV_CALL_CENTER',
  NAV_INVENTORY = 'NAV_INVENTORY',
  NAV_FINANCE = 'NAV_FINANCE',
  NAV_REPORTS = 'NAV_REPORTS',
  NAV_CRM = 'NAV_CRM',
  NAV_MENU_MANAGER = 'NAV_MENU_MANAGER',
  NAV_RECIPES = 'NAV_RECIPES',
  NAV_FORENSICS = 'NAV_FORENSICS',
  NAV_AI_ASSISTANT = 'NAV_AI_ASSISTANT',
  NAV_SETTINGS = 'NAV_SETTINGS',
  NAV_SECURITY = 'NAV_SECURITY',

  // --- Data & Financial Visibility ---
  DATA_VIEW_REVENUE = 'DATA_VIEW_REVENUE',
  DATA_VIEW_COSTS = 'DATA_VIEW_COSTS',
  DATA_VIEW_PROFITS = 'DATA_VIEW_PROFITS',
  DATA_VIEW_CUSTOMER_SENSITIVE = 'DATA_VIEW_CUSTOMER_SENSITIVE', // Phone/Address
  DATA_VIEW_STOCK_LEVELS = 'DATA_VIEW_STOCK_LEVELS',
  DATA_VIEW_AUDIT_LOGS = 'DATA_VIEW_AUDIT_LOGS',

  // --- Operational Actions ---
  OP_VOID_ORDER = 'OP_VOID_ORDER',
  OP_APPLY_DISCOUNT = 'OP_APPLY_DISCOUNT',
  OP_PROCESS_REFUND = 'OP_PROCESS_REFUND',
  OP_TRANSFER_STOCK = 'OP_TRANSFER_STOCK',
  OP_ADJUST_STOCK = 'OP_ADJUST_STOCK',
  OP_PLACE_ORDER = 'OP_PLACE_ORDER',
  OP_CLOSE_DAY = 'OP_CLOSE_DAY',

  // --- Configuration ---
  CFG_MANAGE_USERS = 'CFG_MANAGE_USERS',
  CFG_MANAGE_ROLES = 'CFG_MANAGE_ROLES',
  CFG_EDIT_MENU_PRICING = 'CFG_EDIT_MENU_PRICING',
  CFG_EDIT_FLOOR_PLAN = 'CFG_EDIT_FLOOR_PLAN',
  CFG_MANAGE_BRANCHES = 'CFG_MANAGE_BRANCHES',
  CFG_OFFLINE_MODE = 'CFG_OFFLINE_MODE'
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  CASHIER = 'CASHIER',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
  CALL_CENTER = 'CALL_CENTER',
  CUSTOM = 'CUSTOM'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // For simulation
  assignedBranchId?: string;
  isActive: boolean;
  permissions: AppPermission[]; // Final effective permissions
  customOverrides?: {
    added: AppPermission[];
    removed: AppPermission[];
  };
}

export interface UserRoleDefinition {
  role: UserRole;
  name: string;
  defaultPermissions: AppPermission[];
}

export const INITIAL_ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(AppPermission),
  [UserRole.BRANCH_MANAGER]: [
    AppPermission.NAV_DASHBOARD,
    AppPermission.NAV_POS,
    AppPermission.NAV_KDS,
    AppPermission.NAV_INVENTORY,
    AppPermission.NAV_REPORTS,
    AppPermission.NAV_MENU_MANAGER,
    AppPermission.DATA_VIEW_REVENUE,
    AppPermission.DATA_VIEW_COSTS,
    AppPermission.DATA_VIEW_STOCK_LEVELS,
    AppPermission.OP_PLACE_ORDER,
    AppPermission.OP_APPLY_DISCOUNT,
    AppPermission.OP_TRANSFER_STOCK,
    AppPermission.OP_ADJUST_STOCK
  ],
  [UserRole.CASHIER]: [
    AppPermission.NAV_POS,
    AppPermission.OP_PLACE_ORDER
  ],
  [UserRole.KITCHEN_STAFF]: [
    AppPermission.NAV_KDS
  ],
  [UserRole.CALL_CENTER]: [
    AppPermission.NAV_CALL_CENTER,
    AppPermission.NAV_CRM,
    AppPermission.OP_PLACE_ORDER,
    AppPermission.DATA_VIEW_CUSTOMER_SENSITIVE
  ],
  [UserRole.CUSTOM]: []
};

export type AppTheme = 'classic' | 'nebula' | 'emerald' | 'sunset' | 'quartz' | 'violet' | 'touch';

export interface AppSettings {
  restaurantName: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  serviceCharge: number;
  language: 'en' | 'ar';
  isDarkMode: boolean;
  isTouchMode: boolean;
  theme: AppTheme;
  branchAddress: string;
  phone: string;
  activeBranchId?: string; // Current operating branch context
  currentUser?: User;
  geminiApiKey?: string;
}

export type ViewState = 'DASHBOARD' | 'POS' | 'KDS' | 'INVENTORY' | 'FINANCE' | 'CRM' | 'REPORTS' | 'MENU_MANAGER' | 'AI_ASSISTANT' | 'AI_INSIGHTS' | 'SETTINGS' | 'CALL_CENTER' | 'FORENSICS' | 'SECURITY' | 'RECIPES';
