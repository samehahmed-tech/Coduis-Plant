
export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
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
  inventoryItemId: string;
  quantityNeeded: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
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
  price: number;
  category: string;
  image?: string;
  description?: string;
  isActive: boolean;
  recipe?: RecipeIngredient[];
  modifierGroups?: ModifierGroup[];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
  lastUpdated: Date;
  costPrice: number;
  supplierId?: string;
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
  tableId?: string;
  customerId?: string;
  items: OrderItem[];
  status: OrderStatus;
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
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED';
  items: { itemName: string; quantity: number; unitPrice: number }[];
  totalCost: number;
  date: Date;
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
  isActive: boolean;
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

export type AppTheme = 'classic' | 'nebula' | 'emerald' | 'sunset' | 'quartz' | 'violet' | 'touch';

export interface AppSettings {
  restaurantName: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  serviceCharge: number;
  language: 'en' | 'ar';
  isDarkMode: boolean;
  theme: AppTheme;
  branchAddress: string;
  phone: string;
}

export type ViewState = 'DASHBOARD' | 'POS' | 'KDS' | 'INVENTORY' | 'FINANCE' | 'CRM' | 'REPORTS' | 'MENU_MANAGER' | 'AI_ASSISTANT' | 'AI_INSIGHTS' | 'SETTINGS';
