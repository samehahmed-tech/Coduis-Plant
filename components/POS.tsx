/**
 * POS — Main Point of Sale Orchestrator
 * State management + layout composition only.
 * UI is delegated to: POSToolbar, POSItemsPanel, POSCartSidebar
 */
import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from 'react';
import { Search, ShoppingBag, X, LogOut, SlidersHorizontal, ArrowUpDown, LayoutGrid, Grid2x2, Plus, UtensilsCrossed, Truck, MapPin, Keyboard } from 'lucide-react';
import {
   Order, OrderItem, OrderStatus, Table, PaymentMethod,
   OrderType, Customer, PaymentRecord, RestaurantMenu,
   MenuCategory, AppPermission, RecipeIngredient, WarehouseType, JournalEntry, TableStatus, MenuItem
} from '../types';

import TableMap from './TableMap';
import POSHeader from './pos/POSHeader';
import CategoryTabs from './pos/CategoryTabs';
import ItemGrid from './pos/ItemGrid';
import CartItem from './pos/CartItem';
import PaymentSummary from './pos/PaymentSummary';
import SplitBillModal from './pos/SplitBillModal';
import NoteModal from './pos/NoteModal';
import CustomerSelectView from './pos/CustomerSelectView';
import CalculatorWidget from './common/CalculatorWidget';
import { ShiftOverlays, CloseShiftModal } from './pos/ShiftOverlays';
import { ManagerApprovalModal } from './pos/ManagerApprovalModal';
import TableManagementModal from './pos/TableManagementModal';
import POSToolbar from './pos/POSToolbar';
import POSItemsPanel from './pos/POSItemsPanel';
import CategorySidebar from './pos/CategorySidebar';
import POSCartSidebar from './pos/POSCartSidebar';
import { printService } from '../src/services/printService';
import { formatReceipt } from '../services/receiptFormatter';
import { printKitchenTicketsByRouting, printOrderReceipt } from '../services/posPrintOrchestrator';
import { useToast } from './Toast';
import { useModal } from './Modal';

// Services
import { translations } from '../services/translations';
import { getActionableErrorMessage, shiftsApi } from '../services/api';

// Stores
import { useAuthStore } from '../stores/useAuthStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useMenuStore } from '../stores/useMenuStore';
import { useCRMStore } from '../stores/useCRMStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useFinanceStore } from '../stores/useFinanceStore';

const POS: React.FC = () => {
   const POS_UI_PREFS_KEY = 'restoflow_pos_ui_prefs_v1';
   const POS_ITEM_USAGE_KEY = 'restoflow_pos_item_usage_v1';
   const POS_PAYMENT_PREFS_KEY = 'restoflow_pos_payment_prefs_v1';
   const POS_CART_LAYOUT_KEY = 'restoflow_pos_cart_layout_v1';
   // --- Global State (Selective Picking for Performance) ---
   const settings = useAuthStore(state => state.settings);
   const branches = useAuthStore(state => state.branches);
   const printers = useAuthStore(state => state.printers);
   const hasPermission = useAuthStore(state => state.hasPermission);
   const updateSettings = useAuthStore(state => state.updateSettings);

   const orders = useOrderStore(state => state.orders);
   const activeCart = useOrderStore(state => state.activeCart);
   const addToCart = useOrderStore(state => state.addToCart);
   const removeFromCart = useOrderStore(state => state.removeFromCart);
   const updateCartItemQuantity = useOrderStore(state => state.updateCartItemQuantity);
   const updateCartItemNotes = useOrderStore(state => state.updateCartItemNotes);
   const clearCart = useOrderStore(state => state.clearCart);
   const placeOrder = useOrderStore(state => state.placeOrder);
   const activeOrderType = useOrderStore(state => state.activeOrderType);
   const setOrderMode = useOrderStore(state => state.setOrderMode);
   const discount = useOrderStore(state => state.discount);
   const setDiscount = useOrderStore(state => state.setDiscount);
   const activeCoupon = useOrderStore(state => state.activeCoupon);
   const applyCoupon = useOrderStore(state => state.applyCoupon);
   const clearCoupon = useOrderStore(state => state.clearCoupon);
   const heldOrders = useOrderStore(state => state.heldOrders);
   const recallOrder = useOrderStore(state => state.recallOrder);
   const recalledOrder = useOrderStore(state => state.recalledOrder);
   const clearRecalledOrder = useOrderStore(state => state.clearRecalledOrder);
   const tables = useOrderStore(state => state.tables);
   const zones = useOrderStore(state => state.zones);
   const transferTable = useOrderStore(state => state.transferTable);
   const transferItems = useOrderStore(state => state.transferItems);
   const splitTable = useOrderStore(state => state.splitTable);
   const loadTableOrder = useOrderStore(state => state.loadTableOrder);
   const fetchTables = useOrderStore(state => state.fetchTables);
   const updateTableStatus = useOrderStore(state => state.updateTableStatus);
   const updateOrderStatus = useOrderStore(state => state.updateOrderStatus);
   const tableDrafts = useOrderStore(state => state.tableDrafts);
   const saveTableDraft = useOrderStore(state => state.saveTableDraft);
   const loadTableDraft = useOrderStore(state => state.loadTableDraft);
   const clearTableDraft = useOrderStore(state => state.clearTableDraft);

   const menus = useMenuStore(state => state.menus);
   const categories = useMenuStore(state => state.categories);
   const activePriceListId = useMenuStore(state => state.activePriceListId);
   const setPriceList = useMenuStore(state => state.setPriceList);
   const fetchMenu = useMenuStore(state => state.fetchMenu);
   const customers = useCRMStore(state => state.customers);
   const inventory = useInventoryStore(state => state.inventory);
   const updateStock = useInventoryStore(state => state.updateStock);
   const warehouses = useInventoryStore(state => state.warehouses);
   const recordTransaction = useFinanceStore(state => state.recordTransaction);

   const branchId = settings.activeBranchId || 'b1';
   const activeBranch = branches.find(b => b.id === branchId);

   // --- Local State ---
   const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
   const [managedTableId, setManagedTableId] = useState<string | null>(null);
   const [deliveryCustomer, setDeliveryCustomer] = useState<Customer | null>(null);
   // cart is now activeCart from store
   const [activeCategory, setActiveCategory] = useState<string>('all');
   const [searchQuery, setSearchQuery] = useState('');
   const [categorySidebarCollapsed, setCategorySidebarCollapsed] = useState(false);
   const [itemFilter, setItemFilter] = useState<'all' | 'available' | 'popular'>('all');
   const [itemSort, setItemSort] = useState<'smart' | 'name' | 'price_asc' | 'price_desc'>('smart');
   const [itemDensity, setItemDensity] = useState<'comfortable' | 'compact' | 'ultra' | 'buttons'>('compact');
   const [editingItemId, setEditingItemId] = useState<string | null>(null);
   const [noteInput, setNoteInput] = useState('');
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
   const [splitPayments, setSplitPayments] = useState<PaymentRecord[]>([]);
   const [showSplitModal, setShowSplitModal] = useState(false);
   const [showCalculator, setShowCalculator] = useState(false);
   const [showApprovalModal, setShowApprovalModal] = useState(false);
   const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);
   const [showMobileFilters, setShowMobileFilters] = useState(false);
   const [isTabletViewport, setIsTabletViewport] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 1180 : false);
   const [showCategoryStrip, setShowCategoryStrip] = useState(true);
   const [cartPanelWidth, setCartPanelWidth] = useState<'compact' | 'normal' | 'wide'>('normal');
   const [isPaymentPanelCollapsed, setIsPaymentPanelCollapsed] = useState(false);
   const [cartSearchQuery, setCartSearchQuery] = useState('');
   const [couponCode, setCouponCode] = useState('');
   const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
   const [approvalCallback, setApprovalCallback] = useState<{ fn: () => void; action: string } | null>(null);
   const activeShift = useFinanceStore(state => state.activeShift);
   const setShift = useFinanceStore(state => state.setShift);
   const isCloseShiftModalOpen = useFinanceStore(state => state.isCloseShiftModalOpen);
   const setIsCloseShiftModalOpen = useFinanceStore(state => state.setIsCloseShiftModalOpen);

   const [isOnline, setIsOnline] = useState(navigator.onLine);
   const [nowTick, setNowTick] = useState(Date.now());
   const [itemUsageMap, setItemUsageMap] = useState<Record<string, number>>({});
   const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
   const { showToast } = useToast();
   const { showModal } = useModal();
   const requestManagerApproval = useCallback((action: string, fn: () => void | Promise<void>) => {
      setApprovalCallback({
         action,
         fn: async () => {
            try {
               await fn();
            } catch (error: any) {
               showToast(
                  getActionableErrorMessage(error, (settings.language || 'en') as 'en' | 'ar'),
                  'error'
               );
            } finally {
               setApprovalCallback(null);
            }
         }
      });
      setShowApprovalModal(true);
   }, [showToast, settings.language]);

   // 🔄 Fetch menu data from database on POS mount
   useEffect(() => {
      fetchMenu(true);
      if (branchId) fetchTables(branchId);
   }, [fetchMenu, fetchTables, branchId]);

   useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
         window.removeEventListener('online', handleOnline);
         window.removeEventListener('offline', handleOffline);
      };
   }, []);

   useEffect(() => {
      const timer = setInterval(() => setNowTick(Date.now()), 60000);
      return () => clearInterval(timer);
   }, []);

   useEffect(() => {
      const updateViewport = () => {
         const isTablet = window.innerWidth <= 1180;
         setIsTabletViewport(isTablet);
         if (!isTablet) {
            setShowCategoryStrip(true);
         }
      };
      updateViewport();
      window.addEventListener('resize', updateViewport);
      return () => window.removeEventListener('resize', updateViewport);
   }, []);

   useEffect(() => {
      try {
         const raw = localStorage.getItem(POS_UI_PREFS_KEY);
         if (!raw) return;
         const parsed = JSON.parse(raw);
         if (parsed?.itemFilter && ['all', 'available', 'popular'].includes(parsed.itemFilter)) {
            setItemFilter(parsed.itemFilter);
         }
         if (parsed?.itemSort && ['smart', 'name', 'price_asc', 'price_desc'].includes(parsed.itemSort)) {
            setItemSort(parsed.itemSort);
         }
         if (parsed?.itemDensity && ['comfortable', 'compact', 'ultra'].includes(parsed.itemDensity)) {
            setItemDensity(parsed.itemDensity);
         }
      } catch {
         // ignore malformed local prefs
      }
   }, []);

   useEffect(() => {
      try {
         localStorage.setItem(POS_UI_PREFS_KEY, JSON.stringify({
            itemFilter,
            itemSort,
            itemDensity
         }));
      } catch {
         // ignore storage errors
      }
   }, [itemFilter, itemSort, itemDensity]);

   useEffect(() => {
      try {
         const raw = localStorage.getItem(POS_ITEM_USAGE_KEY);
         if (!raw) return;
         const parsed = JSON.parse(raw);
         if (parsed && typeof parsed === 'object') setItemUsageMap(parsed);
      } catch {
         // ignore malformed usage data
      }
   }, []);

   useEffect(() => {
      try {
         const raw = localStorage.getItem(POS_CART_LAYOUT_KEY);
         if (!raw) return;
         const parsed = JSON.parse(raw);
         if (parsed?.cartPanelWidth && ['compact', 'normal', 'wide'].includes(parsed.cartPanelWidth)) {
            setCartPanelWidth(parsed.cartPanelWidth);
         }
         if (typeof parsed?.isPaymentPanelCollapsed === 'boolean') {
            setIsPaymentPanelCollapsed(parsed.isPaymentPanelCollapsed);
         }
      } catch {
         // ignore malformed layout prefs
      }
   }, []);

   useEffect(() => {
      try {
         localStorage.setItem(POS_CART_LAYOUT_KEY, JSON.stringify({
            cartPanelWidth,
            isPaymentPanelCollapsed,
         }));
      } catch {
         // ignore storage errors
      }
   }, [cartPanelWidth, isPaymentPanelCollapsed]);

   useEffect(() => {
      try {
         const raw = localStorage.getItem(POS_PAYMENT_PREFS_KEY);
         if (!raw) return;
         const parsed = JSON.parse(raw);
         if (parsed && typeof parsed === 'object') {
            paymentPrefsRef.current = parsed;
         }
      } catch {
         // ignore malformed payment prefs
      }
   }, []);

   useEffect(() => {
      const preferred = paymentPrefsRef.current[activeOrderType];
      if (preferred) {
         setPaymentMethod(preferred);
      } else {
         setPaymentMethod(PaymentMethod.CASH);
      }
   }, [activeOrderType]);

   useEffect(() => {
      if (!lastAddedItemId) return;
      const timer = window.setTimeout(() => setLastAddedItemId(null), 700);
      return () => window.clearTimeout(timer);
   }, [lastAddedItemId]);

   // Default menu
   const activeMenuId = (menus || []).find(m => m.isDefault)?.id || (menus || [])[0]?.id;

   const searchInputRef = useRef<HTMLInputElement>(null);
   const tableNumberBufferRef = useRef('');
   const tableNumberTimerRef = useRef<number | null>(null);
   const scannerBufferRef = useRef('');
   const scannerLastInputAtRef = useRef(0);
   const scannerFlushTimerRef = useRef<number | null>(null);
   const paymentPrefsRef = useRef<Partial<Record<OrderType, PaymentMethod>>>({});
   const deferredSearchQuery = useDeferredValue(searchQuery);

   // --- Derived Data ---
   const lang = settings.language;
   const t = translations[lang];
   const isDarkMode = settings.isDarkMode;
   const isTouchMode = settings.isTouchMode;
   const currencySymbol = settings.currencySymbol;

   const currentCategories = useMemo(() =>
      (categories || []).filter(cat =>
         cat.isActive !== false
      ),
      [categories]);

   const categoryHotkeys = useMemo(() =>
      ['all', ...currentCategories.map(c => c.id)],
      [currentCategories]);

   const normalizePriceListName = useCallback((value: string) =>
      value.toLowerCase().replace(/[^a-z0-9]+/g, ''),
      []);

   const priceListKeywords: Record<OrderType, string[]> = useMemo(() => ({
      [OrderType.DINE_IN]: ['dinein', 'dine', 'walkin', 'pos'],
      [OrderType.TAKEAWAY]: ['takeaway', 'takeout', 'togo'],
      [OrderType.DELIVERY]: ['delivery', 'del'],
      [OrderType.PICKUP]: ['pickup', 'pick']
   }), []);

   const resolveItemPrice = useCallback((item: MenuItem) => {
      const lists = item.priceLists || [];
      if (activePriceListId) {
         const activeList = lists.find(list => normalizePriceListName(list.name) === normalizePriceListName(activePriceListId));
         if (activeList) return activeList.price;
      }
      const branchMatch = lists.find(list => list.branchIds?.includes(branchId));
      if (branchMatch) return branchMatch.price;

      const matchKeywords = priceListKeywords[activeOrderType] || [];
      const orderMatch = lists.find(list => matchKeywords.includes(normalizePriceListName(list.name)));
      if (orderMatch) return orderMatch.price;

      return item.price;
   }, [activePriceListId, activeOrderType, branchId, normalizePriceListName, priceListKeywords]);

   const isItemAvailableNow = useCallback((item: MenuItem, now: Date) => {
      if (item.isAvailable === false) return false;
      let days: string[] = [];
      if (Array.isArray(item.availableDays)) {
         days = item.availableDays;
      } else if (typeof item.availableDays === 'string') {
         try {
            const parsed = JSON.parse(item.availableDays);
            days = Array.isArray(parsed) ? parsed : [];
         } catch {
            days = [];
         }
      }

      if (days.length > 0) {
         const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
         if (!days.includes(dayKey)) return false;
      }

      const toMinutes = (value?: string) => {
         if (!value) return null;
         const [h, m] = value.split(':').map(Number);
         if (Number.isNaN(h) || Number.isNaN(m)) return null;
         return h * 60 + m;
      };

      const from = toMinutes(item.availableFrom);
      const to = toMinutes(item.availableTo);
      if (from === null && to === null) return true;

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (from !== null && to !== null) {
         if (from <= to) return nowMinutes >= from && nowMinutes <= to;
         return nowMinutes >= from || nowMinutes <= to;
      }
      if (from !== null) return nowMinutes >= from;
      if (to !== null) return nowMinutes <= to;
      return true;
   }, []);

   const indexedItems = useMemo(() => {
      const now = new Date(nowTick);
      return currentCategories.flatMap((category) =>
         (category.items || []).map((item) => {
            const displayName = lang === 'ar' ? (item.nameAr || item.name) : item.name;
            const resolvedPrice = resolveItemPrice(item);
            const isAvailable = isItemAvailableNow(item, now);
            return {
               ...item,
               displayCategory: lang === 'ar' ? (category.nameAr || category.name) : category.name,
               displayName,
               resolvedPrice,
               isAvailable,
               searchBlob: [
                  item.name,
                  item.nameAr,
                  item.description,
                  item.descriptionAr,
                  category.name,
                  category.nameAr
               ].filter(Boolean).join(' ').toLowerCase()
            };
         })
      );
   }, [currentCategories, lang, nowTick, resolveItemPrice, isItemAvailableNow]);

   const normalizedSearchQuery = useMemo(
      () => deferredSearchQuery.trim().toLowerCase(),
      [deferredSearchQuery]
   );

   const filteredItems = useMemo(() => {
      return indexedItems
         .filter((item) => {
            const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
            const matchesSearch = !normalizedSearchQuery || item.searchBlob.includes(normalizedSearchQuery);
            const matchesFilter =
               itemFilter === 'all' ||
               (itemFilter === 'available' && item.isAvailable) ||
               (itemFilter === 'popular' && !!item.isPopular);
            return matchesCategory && matchesSearch && matchesFilter;
         })
         .sort((a, b) => {
            if (itemSort === 'name') {
               return a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase());
            }
            if (itemSort === 'price_asc') return a.resolvedPrice - b.resolvedPrice;
            if (itemSort === 'price_desc') return b.resolvedPrice - a.resolvedPrice;

            if (a.isAvailable && !b.isAvailable) return -1;
            if (!a.isAvailable && b.isAvailable) return 1;
            if (a.isPopular && !b.isPopular) return -1;
            if (!a.isPopular && b.isPopular) return 1;
            return a.displayName.localeCompare(b.displayName);
         });
   }, [indexedItems, activeCategory, normalizedSearchQuery, itemFilter, itemSort]);

   const pricedItems = useMemo(() =>
      filteredItems.map(item => ({
         ...item,
         displayDescription: lang === 'ar' ? (item.descriptionAr || item.description) : item.description,
         price: item.resolvedPrice,
         isActuallyAvailable: item.isAvailable
      })),
      [filteredItems, lang]);

   const categoryResultCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      for (const c of currentCategories) counts[c.id] = 0;

      for (const item of indexedItems) {
         const matchesSearch = !normalizedSearchQuery || item.searchBlob.includes(normalizedSearchQuery);
         const matchesFilter =
            itemFilter === 'all' ||
            (itemFilter === 'available' && item.isAvailable) ||
            (itemFilter === 'popular' && Boolean(item.isPopular));
         if (!matchesSearch || !matchesFilter) continue;
         counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
      }
      return counts;
   }, [currentCategories, indexedItems, normalizedSearchQuery, itemFilter]);

   const totalMatchedAcrossCategories = useMemo(
      () => Object.values(categoryResultCounts).reduce((sum, count) => sum + count, 0),
      [categoryResultCounts]
   );

   const quickCategoryNav = useMemo(() => {
      const withCounts = currentCategories
         .map((cat) => ({ ...cat, count: categoryResultCounts[cat.id] || 0 }))
         .filter((cat) => cat.count > 0)
         .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return String(lang === 'ar' ? (a.nameAr || a.name) : a.name).localeCompare(
               String(lang === 'ar' ? (b.nameAr || b.name) : b.name)
            );
         });

      const top = withCounts.slice(0, 8);
      const active = withCounts.find((cat) => cat.id === activeCategory);
      if (active && !top.some((cat) => cat.id === active.id)) {
         return [active, ...top.slice(0, 7)];
      }
      return top;
   }, [currentCategories, categoryResultCounts, activeCategory, lang]);

   useEffect(() => {
      if (activeCategory === 'all') return;
      const currentCount = categoryResultCounts[activeCategory] || 0;
      if (currentCount > 0) return;

      const firstAvailableCategory = currentCategories.find(c => (categoryResultCounts[c.id] || 0) > 0);
      setActiveCategory(firstAvailableCategory?.id || 'all');
   }, [activeCategory, categoryResultCounts, currentCategories]);

   const quickPickItems = useMemo(() => {
      const available = pricedItems.filter(item => (item as any).isActuallyAvailable !== false);
      if (available.length === 0) return [];
      const sortedByUsage = [...available].sort((a, b) => {
         const usageDiff = (itemUsageMap[b.id] || 0) - (itemUsageMap[a.id] || 0);
         if (usageDiff !== 0) return usageDiff;
         if (a.isPopular && !b.isPopular) return -1;
         if (!a.isPopular && b.isPopular) return 1;
         return (a.name || '').localeCompare(b.name || '');
      });
      return sortedByUsage.slice(0, 10);
   }, [pricedItems, itemUsageMap]);

   const safeActiveCart = activeCart || [];

   const upsellSuggestions = useMemo(() => {
      if (safeActiveCart.length === 0) return [];
      const inCart = new Set(safeActiveCart.map(item => item.id));
      const anchorItem = safeActiveCart[safeActiveCart.length - 1];
      const sameCategoryCandidates = pricedItems.filter(item =>
         item.categoryId === anchorItem.categoryId &&
         !inCart.has(item.id) &&
         (item as any).isActuallyAvailable !== false
      );
      const fallbackCandidates = pricedItems.filter(item =>
         !inCart.has(item.id) &&
         !!item.isPopular &&
         (item as any).isActuallyAvailable !== false
      );
      const pool = sameCategoryCandidates.length > 0 ? sameCategoryCandidates : fallbackCandidates;
      return pool.slice(0, 6);
   }, [safeActiveCart, pricedItems]);

   const { cartSubtotal, cartTotal } = useMemo(() => {
      const subtotal = safeActiveCart.reduce((acc, item) => {
         const modsPrice = (item.selectedModifiers || []).reduce((sum, mod) => sum + mod.price, 0);
         return acc + ((item.price + modsPrice) * item.quantity);
      }, 0);
      const afterDiscount = subtotal * (1 - discount / 100);
      const total = afterDiscount * 1.1; // 10% tax
      return { cartSubtotal: subtotal, cartTotal: total };
   }, [safeActiveCart, discount]);

   const cartQuery = useMemo(() => cartSearchQuery.trim().toLowerCase(), [cartSearchQuery]);
   const filteredCartItems = useMemo(() => {
      if (!cartQuery) return safeActiveCart;
      return safeActiveCart.filter((item) => {
         const name = String(lang === 'ar' ? (item.nameAr || item.name) : item.name).toLowerCase();
         const note = String(item.notes || '').toLowerCase();
         return name.includes(cartQuery) || note.includes(cartQuery);
      });
   }, [safeActiveCart, cartQuery, lang]);

   const cartStats = useMemo(() => {
      const totalQty = safeActiveCart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return {
         lines: safeActiveCart.length,
         qty: totalQty,
      };
   }, [safeActiveCart]);

   const currentOrderPreview = useMemo(() => {
      if (safeActiveCart.length === 0) return [];
      return safeActiveCart.slice(0, 3).map((item) => ({
         id: item.cartId,
         name: lang === 'ar' ? (item.nameAr || item.name) : item.name,
         quantity: Number(item.quantity || 0),
      }));
   }, [safeActiveCart, lang]);

   // --- Shift Sync ---
   useEffect(() => {
      const syncShift = async () => {
         if (!activeShift && settings.activeBranchId) {
            try {
               const shift = await shiftsApi.getActive(settings.activeBranchId);
               setShift(shift);
            } catch (e) {
               console.log('No active shift found for user');
            }
         }
      };
      syncShift();
   }, [settings.activeBranchId]);

   // --- Effects ---
   useEffect(() => {
      if (recalledOrder) {
         // Active cart is already set by store recallOrder action
         if (recalledOrder.tableId) setSelectedTableId(recalledOrder.tableId);
         if (recalledOrder.customerId) {
            const customer = customers.find(c => c.id === recalledOrder.customerId);
            if (customer) setDeliveryCustomer(customer);
         }
         clearRecalledOrder(); // Clear the "signal"
      }
   }, [recalledOrder, customers, clearRecalledOrder]);

   const sortedTables = useMemo(() => {
      const normalize = (value?: string) => {
         if (!value) return { num: Number.MAX_SAFE_INTEGER, text: '' };
         const match = value.match(/\d+/);
         const num = match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
         return { num, text: value.toLowerCase() };
      };
      return [...tables].sort((a, b) => {
         const aKey = normalize(a.name || a.id);
         const bKey = normalize(b.name || b.id);
         if (aKey.num !== bKey.num) return aKey.num - bKey.num;
         return aKey.text.localeCompare(bKey.text);
      });
   }, [tables]);

   const currentTableIndex = useMemo(() => {
      if (!selectedTableId) return -1;
      return sortedTables.findIndex(t => t.id === selectedTableId);
   }, [sortedTables, selectedTableId]);

   const saveCurrentTableDraft = useCallback(() => {
      if (!selectedTableId) return;
      if (safeActiveCart.length > 0 || discount > 0) {
         saveTableDraft(selectedTableId, safeActiveCart, discount);
      } else {
         clearTableDraft(selectedTableId);
      }
   }, [safeActiveCart, discount, selectedTableId, saveTableDraft, clearTableDraft]);

   const switchToTable = useCallback((tableId: string) => {
      if (!tableId) return;
      if (tableId === selectedTableId && activeOrderType === OrderType.DINE_IN) return;

      if (activeOrderType === OrderType.DINE_IN) {
         saveCurrentTableDraft();
      }

      const activeOrder = orders.find(o => o.tableId === tableId && o.status !== OrderStatus.DELIVERED);
      if (activeOrder) {
         loadTableOrder(tableId);
         clearTableDraft(tableId);
      } else if (tableDrafts[tableId]) {
         loadTableDraft(tableId);
      } else {
         clearCart();
         setDiscount(0);
      }

      setSelectedTableId(tableId);
   }, [
      activeOrderType,
      selectedTableId,
      orders,
      tableDrafts,
      saveCurrentTableDraft,
      loadTableOrder,
      loadTableDraft,
      clearTableDraft,
      clearCart,
      setDiscount
   ]);

   const leaveTable = useCallback(() => {
      if (!selectedTableId) return;
      saveCurrentTableDraft();
      clearCart();
      setSelectedTableId(null);
      setIsCartOpenMobile(false);
   }, [selectedTableId, saveCurrentTableDraft, clearCart]);

   const findTableByNumber = useCallback((value: string) => {
      const normalized = value.replace(/^0+/, '');
      return tables.find((table) => {
         const label = table.name || table.id || '';
         const match = label.match(/\d+/);
         if (!match) return false;
         const tableNumber = match[0].replace(/^0+/, '');
         return tableNumber === normalized;
      });
   }, [tables]);

   const showMap = activeOrderType === OrderType.DINE_IN && !selectedTableId;
   const showCustomerSelect = activeOrderType === OrderType.DELIVERY && !deliveryCustomer;
   const isPOS = true;

   const handleSetPaymentMethod = useCallback((method: PaymentMethod) => {
      setPaymentMethod(method);
      const nextPrefs: Partial<Record<OrderType, PaymentMethod>> = {
         ...paymentPrefsRef.current,
         [activeOrderType]: method,
      };
      paymentPrefsRef.current = nextPrefs;
      try {
         localStorage.setItem(POS_PAYMENT_PREFS_KEY, JSON.stringify(nextPrefs));
      } catch {
         // ignore storage errors
      }
   }, [activeOrderType]);

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         const processScannerBuffer = () => {
            const rawCode = scannerBufferRef.current.trim();
            scannerBufferRef.current = '';
            if (rawCode.length < 4) return false;

            const code = rawCode.toLowerCase();
            const matched = indexedItems.find((item) => {
               const barcode = String((item as any).barcode || '').toLowerCase();
               const sku = String((item as any).sku || '').toLowerCase();
               const name = String(item.name || '').toLowerCase();
               const nameAr = String(item.nameAr || '').toLowerCase();
               return barcode === code || sku === code || name === code || nameAr === code;
            });

            if (!matched) {
               showToast(
                  lang === 'ar'
                     ? `لم يتم العثور على منتج للكود: ${rawCode}`
                     : `No product found for code: ${rawCode}`,
                  'error'
               );
               return true;
            }

            const existingItem = safeActiveCart.find(ci =>
               ci.id === matched.id && JSON.stringify(ci.selectedModifiers) === JSON.stringify([])
            );
            if (existingItem) {
               updateCartItemQuantity(existingItem.cartId, 1);
            } else {
               addToCart({ ...matched, cartId: Math.random().toString(36).substr(2, 9), quantity: 1, selectedModifiers: [] });
            }

            setLastAddedItemId(matched.id);
            setItemUsageMap(prev => {
               const next = { ...prev, [matched.id]: (prev[matched.id] || 0) + 1 };
               try {
                  localStorage.setItem(POS_ITEM_USAGE_KEY, JSON.stringify(next));
               } catch {
                  // ignore storage errors
               }
               return next;
            });
            setIsCartOpenMobile(true);
            showToast(
               lang === 'ar'
                  ? `تمت إضافة ${matched.nameAr || matched.name}`
                  : `${matched.name} added`,
               'success'
            );
            return true;
         };

         const isInput = (e.target as HTMLElement).tagName === 'INPUT';
         const isTextarea = (e.target as HTMLElement).tagName === 'TEXTAREA';
         const isScannerChar = e.key.length === 1 && /[a-zA-Z0-9\-_.]/.test(e.key);

         if (!isInput && !isTextarea && !e.altKey && !e.ctrlKey && !e.metaKey) {
            if (isScannerChar) {
               const now = Date.now();
               const delta = now - scannerLastInputAtRef.current;
               if (scannerBufferRef.current && delta > 90) {
                  scannerBufferRef.current = '';
               }
               scannerBufferRef.current += e.key;
               scannerLastInputAtRef.current = now;
               if (scannerFlushTimerRef.current) window.clearTimeout(scannerFlushTimerRef.current);
               scannerFlushTimerRef.current = window.setTimeout(() => {
                  const buffered = scannerBufferRef.current;
                  scannerBufferRef.current = '';
                  if (buffered.length >= 8) {
                     processScannerBuffer();
                  }
               }, 140);

               // Scanner streams are fast; suppress other shortcuts while sequence is being captured.
               if (delta < 90 || scannerBufferRef.current.length >= 6) {
                  return;
               }
            }
            if (e.key === 'Enter' && scannerBufferRef.current.length >= 4) {
               e.preventDefault();
               processScannerBuffer();
               return;
            }
         }

         if (isInput || isTextarea) {
            if (e.key === 'Escape') {
               (e.target as HTMLElement).blur();
               if (showSplitModal) setShowSplitModal(false);
               if (editingItemId) setEditingItemId(null);
            }
            if (e.key === 'Enter' && !isTextarea) {
               (e.target as HTMLElement).blur();
               if (safeActiveCart.length > 0) handleSubmitOrder();
            }
            return;
         }

         if (e.key === 'Escape') {
            if (showSplitModal) setShowSplitModal(false);

            if (isPOS && (safeActiveCart.length > 0 || selectedTableId)) {
               if (activeOrderType === OrderType.DINE_IN) setSelectedTableId(null);
               else clearCart();
            }
         }
         if (!isInput && e.key >= '1' && e.key <= '9') {
            const catIndex = parseInt(e.key) - 1;
            if (catIndex < categoryHotkeys.length) setActiveCategory(categoryHotkeys[catIndex]);
         }
         if (!isInput && showMap && activeOrderType === OrderType.DINE_IN) {
            const isDigit = e.key >= '0' && e.key <= '9';
            if (isDigit) {
               e.preventDefault();
               tableNumberBufferRef.current += e.key;
               if (tableNumberTimerRef.current) {
                  window.clearTimeout(tableNumberTimerRef.current);
               }
               tableNumberTimerRef.current = window.setTimeout(() => {
                  const target = tableNumberBufferRef.current;
                  tableNumberBufferRef.current = '';
                  tableNumberTimerRef.current = null;
                  if (!target) return;
                  const table = findTableByNumber(target);
                  if (table) {
                     switchToTable(table.id);
                  }
               }, 700);
            }
            if (e.key === 'Enter') {
               e.preventDefault();
               if (tableNumberTimerRef.current) {
                  window.clearTimeout(tableNumberTimerRef.current);
                  tableNumberTimerRef.current = null;
               }
               const target = tableNumberBufferRef.current;
               tableNumberBufferRef.current = '';
               if (target) {
                  const table = findTableByNumber(target);
                  if (table) {
                     switchToTable(table.id);
                  }
               }
            }
         }
         if (e.key === '/' && !isInput) {
            e.preventDefault();
            searchInputRef.current?.focus();
         }
         if (e.shiftKey && e.key === 'Enter' && safeActiveCart.length > 0 && !showSplitModal) {
            e.preventDefault();
            handleQuickPay();
            return;
         }
         if (e.ctrlKey && e.key === 'Enter' && safeActiveCart.length > 0 && !showSplitModal) {
            e.preventDefault();
            handleSendKitchen();
            return;
         }
         if (e.key === 'Enter' && safeActiveCart.length > 0 && !showSplitModal) handleSubmitOrder();
         if (e.key === 'Delete' && safeActiveCart.length > 0) handleVoidOrder();

         if (e.altKey && !isInput) {
            if (e.key === '1') {
               e.preventDefault();
               setOrderMode(OrderType.DINE_IN);
            }
            if (e.key === '2') {
               e.preventDefault();
               setOrderMode(OrderType.TAKEAWAY);
            }
            if (e.key === '3') {
               e.preventDefault();
               setOrderMode(OrderType.PICKUP);
            }
            if (e.key === '4') {
               e.preventDefault();
               setOrderMode(OrderType.DELIVERY);
            }
            if (e.key.toLowerCase() === 'r') {
               e.preventDefault();
               if (heldOrders.length > 0) {
                  recallOrder(heldOrders.length - 1);
                  showToast(
                     lang === 'ar' ? 'تم استرجاع آخر طلب مُعلق' : 'Last held order recalled',
                     'success'
                  );
               } else if (orders.length > 0) {
                  const lastOrder = orders[0];
                  clearCart();
                  lastOrder.items.forEach(item => {
                     addToCart({
                        ...item,
                        cartId: Math.random().toString(36).substr(2, 9)
                     });
                  });
                  if (lastOrder.tableId) setSelectedTableId(lastOrder.tableId);
                  if (lastOrder.type) setOrderMode(lastOrder.type);
                  showToast(
                     lang === 'ar' ? 'تم استرجاع آخر طلب' : 'Last order recalled',
                     'success'
                  );
               } else {
                  showToast(
                     lang === 'ar' ? 'لا يوجد طلبات للاسترجاع' : 'No orders available to recall',
                     'error'
                  );
               }
            }
         }

         if (activeOrderType === OrderType.DINE_IN && e.altKey && !isInput) {
            if (e.key === 'ArrowRight' && sortedTables.length > 0) {
               e.preventDefault();
               const nextIndex = currentTableIndex === -1 ? 0 : (currentTableIndex + 1) % sortedTables.length;
               switchToTable(sortedTables[nextIndex].id);
            }
            if (e.key === 'ArrowLeft' && sortedTables.length > 0) {
               e.preventDefault();
               const prevIndex = currentTableIndex <= 0 ? sortedTables.length - 1 : currentTableIndex - 1;
               switchToTable(sortedTables[prevIndex].id);
            }
            if (e.key >= '5' && e.key <= '9') {
               const idx = parseInt(e.key, 10) - 1;
               if (idx >= 0 && idx < sortedTables.length) {
                  e.preventDefault();
                  switchToTable(sortedTables[idx].id);
               }
            }
            if (e.key === '0') {
               e.preventDefault();
               leaveTable();
            }
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
         window.removeEventListener('keydown', handleKeyDown);
         if (scannerFlushTimerRef.current) window.clearTimeout(scannerFlushTimerRef.current);
      };
   }, [
      safeActiveCart,
      selectedTableId,
      showSplitModal,
      editingItemId,
      activeOrderType,
      showMap,
      categoryHotkeys,
      clearCart,
      sortedTables,
      currentTableIndex,
      setOrderMode,
      switchToTable,
      leaveTable,
      findTableByNumber,
      indexedItems,
      addToCart,
      updateCartItemQuantity,
      showToast,
      lang,
      orders,
      heldOrders,
      recallOrder
   ]);

   // --- Handlers (Memoized to prevent child re-renders) ---
   const handleAddItem = useCallback((item: any) => {
      const existingItem = safeActiveCart.find(ci =>
         ci.id === item.id && JSON.stringify(ci.selectedModifiers) === JSON.stringify([])
      );

      if (existingItem) {
         updateCartItemQuantity(existingItem.cartId, 1);
      } else {
         addToCart({ ...item, cartId: Math.random().toString(36).substr(2, 9), quantity: 1, selectedModifiers: [] });
      }
      setLastAddedItemId(item.id);
      setItemUsageMap(prev => {
         const next = { ...prev, [item.id]: (prev[item.id] || 0) + 1 };
         try {
            localStorage.setItem(POS_ITEM_USAGE_KEY, JSON.stringify(next));
         } catch {
            // ignore storage errors
         }
         return next;
      });
      setIsCartOpenMobile(true);
   }, [safeActiveCart, addToCart, updateCartItemQuantity]);

   const handleUpdateQuantity = useCallback((cartId: string, delta: number) => {
      updateCartItemQuantity(cartId, delta);
   }, [updateCartItemQuantity]);

   const handleRemoveOneFromCart = useCallback((itemId: string) => {
      const itemsOfThisType = safeActiveCart.filter(ci => ci.id === itemId);
      if (itemsOfThisType.length > 0) {
         const itemToUpdate = itemsOfThisType[itemsOfThisType.length - 1];
         handleUpdateQuantity(itemToUpdate.cartId, -1);
      }
   }, [safeActiveCart, handleUpdateQuantity]);

   const handleQuickPay = () => {
      handleSetPaymentMethod(PaymentMethod.CASH);
      setTimeout(() => handleSubmitOrder(), 0);
   };

   const handleRecallLastOrder = () => {
      if (heldOrders.length > 0) {
         const idx = heldOrders.length - 1;
         recallOrder(idx);
         showToast(
            lang === 'ar'
               ? 'تم استرجاع آخر طلب مُعلق'
               : 'Last held order recalled',
            'success'
         );
         return;
      }
      if (orders.length > 0) {
         const lastOrder = orders[0];
         // Restore items to cart
         clearCart();
         lastOrder.items.forEach(item => {
            addToCart({
               ...item,
               cartId: Math.random().toString(36).substr(2, 9)
            });
         });
         if (lastOrder.tableId) setSelectedTableId(lastOrder.tableId);
         if (lastOrder.type) setOrderMode(lastOrder.type);
         showToast(
            lang === 'ar'
               ? 'تم استرجاع آخر طلب'
               : 'Last order recalled',
            'success'
         );
      } else {
         showToast(
            lang === 'ar'
               ? 'لا يوجد طلبات للاسترجاع'
               : 'No orders available to recall',
            'error'
         );
      }
   };

   const performCloseTable = async (tableId: string) => {
      const activeOrder = orders.find(o => o.tableId === tableId && o.status !== OrderStatus.DELIVERED);
      if (activeOrder) {
         // Completion receipt is printed by the centralized order-status flow.
         await updateOrderStatus(activeOrder.id, OrderStatus.DELIVERED);
      }
      updateTableStatus(tableId, TableStatus.DIRTY);
      clearTableDraft(tableId);
      setManagedTableId(null);
      showToast(t.table_closed || (lang === 'ar' ? 'تم إغلاق الترابيزة' : 'Table closed'), 'success');
   };

   const handleCloseTable = async (tableId: string) => {
      requestManagerApproval('CLOSE_TABLE', () => performCloseTable(tableId));
   };

   const handleMergeTables = async (sourceTableId: string, targetTableId: string, itemCartIds: string[]) => {
      if (!sourceTableId || !targetTableId || sourceTableId === targetTableId) return;

      const sourceOrder = orders.find(o => o.tableId === sourceTableId && o.status !== OrderStatus.DELIVERED);
      if (!sourceOrder) {
         showToast(lang === 'ar' ? 'لا يوجد طلب على الطاولة المصدر' : 'No active order on source table', 'error');
         return;
      }

      const sourceItemIds = (sourceOrder.items || []).map(i => i.cartId);
      const idsToMove = (itemCartIds && itemCartIds.length > 0) ? itemCartIds : sourceItemIds;
      if (idsToMove.length === 0) {
         showToast(lang === 'ar' ? 'اختر أصناف للدمج' : 'Select items to merge', 'error');
         return;
      }

      const movingAll = idsToMove.length === sourceItemIds.length;
      if (movingAll) {
         await transferTable(sourceTableId, targetTableId);
         clearTableDraft(sourceTableId);
         setManagedTableId(null);
         showToast(t.tables_merged || (lang === 'ar' ? 'تم دمج الترابيزات' : 'Tables merged'), 'success');
         return;
      }

      // Partial merge: move selected items to the target table order.
      await transferItems(sourceTableId, targetTableId, idsToMove);
      await updateTableStatus(targetTableId, TableStatus.OCCUPIED);

      const remainingCount = (sourceOrder.items || []).filter(i => !idsToMove.includes(i.cartId)).length;
      if (remainingCount === 0) {
         await updateTableStatus(sourceTableId, TableStatus.AVAILABLE);
         clearTableDraft(sourceTableId);
      }

      setManagedTableId(null);
      showToast(t.tables_merged || (lang === 'ar' ? 'تم دمج الترابيزات' : 'Tables merged'), 'success');
   };

   const handleTempBill = async (tableId: string) => {
      const activeOrder = orders.find(o => o.tableId === tableId && o.status !== OrderStatus.DELIVERED);
      if (!activeOrder) return;
      await printService.print({
         type: 'RECEIPT',
         content: formatReceipt({
            order: activeOrder,
            title: t.temp_bill || (lang === 'ar' ? 'شيك مؤقت' : 'Temporary Bill'),
            settings,
            currencySymbol,
            lang,
            t,
            branch: activeBranch
         })
      });
      showToast(t.temp_bill_printed || (lang === 'ar' ? 'تم طباعة شيك مؤقت' : 'Temporary bill printed'), 'success');
   };
   const buildDraftOrder = (withPayment: boolean): Order => ({
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      type: activeOrderType,
      branchId: branchId,
      tableId: selectedTableId || undefined,
      customerId: activeOrderType === OrderType.DELIVERY ? deliveryCustomer?.id : undefined,
      items: [...safeActiveCart],
      // New orders always start from PENDING; kitchen fire moves to PREPARING.
      status: OrderStatus.PENDING,
      subtotal: cartTotal / 1.1,
      tax: cartTotal - (cartTotal / 1.1),
      total: cartTotal,
      createdAt: new Date(),
      paymentMethod: withPayment ? paymentMethod : undefined,
      payments: withPayment
         ? (paymentMethod === PaymentMethod.SPLIT ? splitPayments : [{ method: paymentMethod, amount: cartTotal }])
         : [],
      syncStatus: 'PENDING'
   });

   const resetAfterOrderCommit = () => {
      setDeliveryCustomer(null);
      setSplitPayments([]);
      setPaymentMethod(PaymentMethod.CASH);
      setCouponCode('');
      clearCoupon();
   };

   const fireOrderToKitchen = async (order: Order) => {
      await printKitchenTicketsByRouting({
         order,
         categories: currentCategories,
         printers,
         branchId,
         maxKitchenPrinters: settings.maxKitchenPrinters,
         settings,
         currencySymbol,
         lang,
         t,
         branch: activeBranch
      });
      await updateOrderStatus(order.id, OrderStatus.PREPARING);
   };

   const handleSendKitchen = async () => {
      if (safeActiveCart.length === 0) return;
      try {
         const draftOrder = buildDraftOrder(false);
         const savedOrder = await placeOrder(draftOrder);

         if (activeOrderType === OrderType.DINE_IN && selectedTableId) {
            updateTableStatus(selectedTableId, TableStatus.OCCUPIED);
            clearTableDraft(selectedTableId);
         }

         await fireOrderToKitchen(savedOrder);
         resetAfterOrderCommit();
         showToast(
            lang === 'ar'
               ? 'تم إرسال الطلب للمطبخ بنجاح'
               : 'Kitchen ticket sent successfully',
            'success'
         );
      } catch (error: any) {
         showToast(getActionableErrorMessage(error, lang), 'error');
      }
   };

   const handleSubmitOrder = async () => {
      if (safeActiveCart.length === 0) return;
      if (paymentMethod === PaymentMethod.SPLIT) {
         const splitTotal = splitPayments.reduce((sum, p) => sum + p.amount, 0);
         if (Math.abs(splitTotal - cartTotal) > 0.01) {
            showToast(t.split_total_error, 'error');
            return;
         }
      }
      try {
         const draftOrder = buildDraftOrder(true);

         // 1. Place Order in Store (Syncs with server which now handles inventory)
         const savedOrder = await placeOrder(draftOrder);

         // Update Table Status to OCCUPIED if Dine-In
         if (activeOrderType === OrderType.DINE_IN && selectedTableId) {
            updateTableStatus(selectedTableId, TableStatus.OCCUPIED);
            clearTableDraft(selectedTableId);
            setSelectedTableId(null);
         } else if (activeOrderType === OrderType.DINE_IN) {
            setSelectedTableId(null);
         }

         // 2. Record Finance Transactions (Keeping for now although this belongs to an event listener too)
         recordTransaction({
            date: new Date(),
            description: `Sale - Order #${savedOrder.id}`,
            debitAccountId: '1-1-1',
            creditAccountId: '4-1',
            amount: savedOrder.total,
            referenceId: savedOrder.id
         });

         // 3. Trigger kitchen fire on submit for all order types.
         await fireOrderToKitchen(savedOrder);

         // 4. Trigger customer receipts.
         const shouldPrintOnSubmit = (settings.autoPrintReceiptOnSubmit ?? settings.autoPrintReceipt ?? false) === true;
         if (shouldPrintOnSubmit) {
            await printOrderReceipt({
               order: savedOrder,
               printers,
               settings,
               currencySymbol,
               lang,
               t,
               branch: activeBranch
            });
         }
         if (paymentMethod === PaymentMethod.CASH) {
            await printService.triggerCashDrawer();
         }
         resetAfterOrderCommit();
      } catch (error: any) {
         showToast(getActionableErrorMessage(error, lang), 'error');
      }
   };

   const handleVoidOrder = () => {
      if (safeActiveCart.length === 0) return;

      showModal({
         title: t.confirm,
         message: t.void_confirm,
         type: 'danger',
         confirmText: t.confirm,
         cancelText: t.cancel,
         onConfirm: () => {
            requestManagerApproval('VOID_ORDER', () => {
               clearCart();
               setDeliveryCustomer(null);
               setSplitPayments([]);
               setPaymentMethod(PaymentMethod.CASH);
               setCouponCode('');
               clearCoupon();
               setSelectedTableId(null);
            });
         }
      });
   };

   const handleApplyCoupon = async () => {
      const code = couponCode.trim();
      if (!code) return;
      if (cartSubtotal <= 0) {
         showToast(lang === 'ar' ? 'أضف أصناف أولاً' : 'Add items first', 'error');
         return;
      }
      requestManagerApproval('APPLY_DISCOUNT', async () => {
         try {
            setIsApplyingCoupon(true);
            await applyCoupon({
               code,
               branchId,
               orderType: activeOrderType,
               subtotal: cartSubtotal,
               customerId: deliveryCustomer?.id,
            });
            showToast(lang === 'ar' ? 'تم تطبيق الكوبون' : 'Coupon applied', 'success');
         } catch (error: any) {
            showToast(getActionableErrorMessage(error, lang), 'error');
         } finally {
            setIsApplyingCoupon(false);
         }
      });
   };

   const modeShortcuts = useMemo(() => ([
      { mode: OrderType.DINE_IN, icon: UtensilsCrossed, label: t.dine_in, keyHint: 'Alt+1', activeClass: 'bg-primary text-white border-primary' },
      { mode: OrderType.TAKEAWAY, icon: ShoppingBag, label: t.takeaway, keyHint: 'Alt+2', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
      { mode: OrderType.PICKUP, icon: MapPin, label: t.pickup || (lang === 'ar' ? 'استلام' : 'Pickup'), keyHint: 'Alt+3', activeClass: 'bg-teal-600 text-white border-teal-600' },
      { mode: OrderType.DELIVERY, icon: Truck, label: t.delivery, keyHint: 'Alt+4', activeClass: 'bg-orange-600 text-white border-orange-600' },
   ]), [t, lang]);

   const orderTypeLabel =
      activeOrderType === OrderType.DINE_IN
         ? t.dine_in
         : activeOrderType === OrderType.DELIVERY
            ? t.delivery
            : activeOrderType === OrderType.PICKUP
               ? (t.pickup || 'Pickup')
               : t.takeaway;
   const orderTypeSubLabel =
      activeOrderType === OrderType.DINE_IN
         ? `${t.table} ${tables.find(tb => tb.id === selectedTableId)?.name || selectedTableId || '-'}`.trim()
         : activeOrderType === OrderType.DELIVERY
            ? (deliveryCustomer?.name || t.select_customer)
            : activeOrderType === OrderType.PICKUP
               ? (t.pickup || 'Pickup')
               : t.quick_order;
   const shouldShowCart = (safeActiveCart.length > 0 || selectedTableId) && !showMap && !showCustomerSelect;
   const shouldRenderCartPanel = !showMap && !showCustomerSelect;
   const hasCartItems = safeActiveCart.length > 0;
   const cartPanelWidthClass =
      cartPanelWidth === 'compact'
         ? 'sm:w-[280px] lg:w-[310px]'
         : cartPanelWidth === 'wide'
            ? 'sm:w-[360px] lg:w-[400px]'
            : 'sm:w-[320px] lg:w-[340px]';
   const desktopWorkspaceClass = shouldRenderCartPanel
      ? (cartPanelWidth === 'compact'
         ? 'lg:grid-cols-[minmax(0,1fr)_310px] 2xl:grid-cols-[minmax(0,1fr)_330px]'
         : cartPanelWidth === 'wide'
            ? 'lg:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_430px]'
            : 'lg:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_370px]')
      : 'lg:grid-cols-1';

   useEffect(() => {
      if (showMap || showCustomerSelect) setIsCartOpenMobile(false);
   }, [showMap, showCustomerSelect]);

   useEffect(() => {
      if (safeActiveCart.length === 0 && !selectedTableId) setIsCartOpenMobile(false);
   }, [safeActiveCart.length, selectedTableId]);

   return (
      <div className="flex app-viewport pos-shell bg-app text-main transition-colors overflow-hidden min-h-0">
         <ShiftOverlays onOpen={() => console.log('Shift opened')} />

         <CloseShiftModal
            isOpen={isCloseShiftModalOpen}
            onClose={() => setIsCloseShiftModalOpen(false)}
         />

         <ManagerApprovalModal
            isOpen={showApprovalModal}
            onClose={() => { setShowApprovalModal(false); setApprovalCallback(null); }}
            onApproved={() => approvalCallback?.fn()}
            actionName={approvalCallback?.action || 'Operation Authorization'}
         />

         {showCalculator && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20">
               <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCalculator(false)} />
               <div className="relative w-full max-w-md">
                  <CalculatorWidget onClose={() => setShowCalculator(false)} />
               </div>
            </div>
         )}

         <div className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-0">
            <POSHeader
               activeMode={activeOrderType}
               lang={lang}
               t={t}
               selectedTableId={selectedTableId}
               onClearTable={leaveTable}
               deliveryCustomer={deliveryCustomer}
               onClearCustomer={() => setDeliveryCustomer(null)}
               isTouchMode={isTouchMode}
               onRecall={handleRecallLastOrder}
               activePriceListId={activePriceListId}
               onSetPriceList={setPriceList}
               isOnline={isOnline}
            />

            {/* ═══ Compact Toolbar ═══ */}
            <POSToolbar
               activeOrderType={activeOrderType}
               onSetOrderMode={setOrderMode}
               lang={lang}
               t={t}
               cartCount={safeActiveCart.length}
               onToggleCart={() => setIsCartOpenMobile(prev => !prev)}
               onShowTables={() => setSelectedTableId(null)}
               onShowCustomers={() => setDeliveryCustomer(null)}
               onQuickPay={handleQuickPay}
               onFocusSearch={() => searchInputRef.current?.focus()}
               hasCartItems={safeActiveCart.length > 0}
            />

            <NoteModal
               isOpen={!!editingItemId}
               onClose={() => setEditingItemId(null)}
               note={noteInput}
               onNoteChange={setNoteInput}
               onSave={() => {
                  if (editingItemId) updateCartItemNotes(editingItemId, noteInput);
                  setEditingItemId(null);
               }}
               lang={lang}
               t={t}
            />

            <div className="flex-1 flex overflow-hidden relative min-h-0 bg-app">
               {/* Cart Mobile Overlay */}
               {shouldShowCart && isCartOpenMobile && (
                  <div className="xl:hidden fixed inset-0 bg-black/30 z-30 animate-in fade-in" onClick={() => setIsCartOpenMobile(false)} />
               )}

               {showMap ? (
                  <div className="flex-1 p-3 md:p-5 lg:p-8 bg-app overflow-y-auto min-h-0">
                     <TableMap
                        tables={tables}
                        zones={zones}
                        orders={orders}
                        onSelectTable={(table) => {
                           if (table.status === TableStatus.DIRTY) {
                              showModal({
                                 title: t.confirm,
                                 message: t.mark_table_clean,
                                 type: 'confirm',
                                 confirmText: t.confirm,
                                 cancelText: t.cancel,
                                 onConfirm: () => updateTableStatus(table.id, TableStatus.AVAILABLE)
                              });
                              return;
                           }
                           if (
                              table.status === TableStatus.OCCUPIED ||
                              table.status === TableStatus.WAITING_FOOD ||
                              table.status === TableStatus.READY_TO_PAY
                           ) {
                              setManagedTableId(table.id);
                           } else {
                              switchToTable(table.id);
                           }
                        }}
                        onResumeTable={(table) => {
                           switchToTable(table.id);
                        }}
                        onTempBill={(table) => handleTempBill(table.id)}
                        onCloseTable={(table) => handleCloseTable(table.id)}
                        onMergeTable={(table) => setManagedTableId(table.id)}
                        onUpdateOrderStatus={(orderId, status) => updateOrderStatus(orderId, status)}
                        lang={lang}
                        t={t}
                        isDarkMode={isDarkMode}
                     />
                  </div>
               ) : showCustomerSelect ? (
                  <CustomerSelectView
                     customers={customers}
                     onSelectCustomer={(c) => { setDeliveryCustomer(c); setIsCartOpenMobile(true); }}
                     lang={lang}
                     t={t}
                  />
               ) : (
                  <>
                     <div className={`flex-1 min-h-0 h-full overflow-hidden grid grid-cols-1 ${desktopWorkspaceClass} gap-0`}>
                        <div className="flex overflow-hidden min-h-0 min-w-0">
                        {/* ═══ Category Sidebar (Desktop) ═══ */}
                        <CategorySidebar
                           categories={currentCategories}
                           activeCategory={activeCategory}
                           onSetCategory={setActiveCategory}
                           lang={lang}
                           counts={categoryResultCounts}
                           totalCount={totalMatchedAcrossCategories}
                           collapsed={categorySidebarCollapsed}
                           onToggleCollapse={() => setCategorySidebarCollapsed(p => !p)}
                        />

                        {/* ═══ Items Panel (Left) ═══ */}
                        <POSItemsPanel
                           categories={currentCategories}
                           activeCategory={activeCategory}
                           onSetCategory={setActiveCategory}
                           categoryResultCounts={categoryResultCounts}
                           totalMatchedCount={totalMatchedAcrossCategories}
                           hasActiveFiltering={Boolean(normalizedSearchQuery || itemFilter !== 'all')}
                           pricedItems={pricedItems}
                           cartItems={safeActiveCart}
                           onAddItem={handleAddItem}
                           onRemoveItem={handleRemoveOneFromCart}
                           highlightedItemId={lastAddedItemId}
                           searchQuery={searchQuery}
                           onSearchChange={setSearchQuery}
                           searchInputRef={searchInputRef}
                           itemFilter={itemFilter}
                           onSetFilter={setItemFilter}
                           itemSort={itemSort}
                           onSetSort={setItemSort}
                           itemDensity={itemDensity}
                           onSetDensity={setItemDensity}
                           showMobileFilters={showMobileFilters}
                           onToggleFilters={() => setShowMobileFilters(prev => !prev)}
                           onResetFilters={() => { setSearchQuery(''); setItemFilter('all'); setItemSort('smart'); }}
                           quickPickItems={quickPickItems}
                           upsellSuggestions={upsellSuggestions}
                           showCategoryStrip={showCategoryStrip}
                           onToggleCategoryStrip={() => setShowCategoryStrip(prev => !prev)}
                           isTabletViewport={isTabletViewport}
                           quickCategoryNav={quickCategoryNav}
                           isTouchMode={isTouchMode}
                           lang={lang}
                           t={t}
                           currencySymbol={currencySymbol}
                           isCartVisible={shouldRenderCartPanel}
                           cartStats={cartStats}
                           cartTotal={cartTotal}
                           currentOrderPreview={currentOrderPreview}
                           isCartOpenMobile={isCartOpenMobile}
                           onOpenCart={() => setIsCartOpenMobile(true)}
                           selectedTableId={selectedTableId}
                           hasCartItems={hasCartItems}
                        />
                        </div>

                        {/* ═══ Mobile FAB (fixed bottom cart button) ═══ */}
                        {shouldRenderCartPanel && !isCartOpenMobile && !showMap && !showCustomerSelect && (
                           <div className={`md:hidden fixed bottom-[max(1rem,var(--safe-bottom))] ${lang === 'ar' ? 'right-4 left-4' : 'left-4 right-4'} z-40`}>
                              <button
                                 onClick={() => setIsCartOpenMobile(true)}
                                 className="w-full h-12 px-4 rounded-xl bg-slate-900/90 backdrop-blur-md text-white shadow-2xl border border-slate-700/50 flex items-center justify-between"
                              >
                                 <div className="min-w-0 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                       <ShoppingBag size={14} className="text-primary" />
                                    </div>
                                    <div className="text-left min-w-0">
                                       <p className="text-[9px] font-black uppercase tracking-widest text-white/60">
                                          {lang === 'ar' ? 'الطلب الحالي' : 'Current Order'}
                                       </p>
                                       <p className="text-xs font-black truncate">
                                          {safeActiveCart.length > 0
                                             ? `${safeActiveCart.length} ${lang === 'ar' ? 'بنود' : 'lines'} • ${currencySymbol}${cartTotal.toFixed(2)}`
                                             : (lang === 'ar' ? 'السلة فارغة' : 'Cart empty')}
                                       </p>
                                    </div>
                                 </div>
                                 <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                                    {lang === 'ar' ? 'فتح' : 'Open'}
                                 </span>
                              </button>
                           </div>
                        )}

                        {/* ═══ Cart Sidebar (Right) ═══ */}
                        {shouldRenderCartPanel && (
                           <POSCartSidebar
                              activeCart={safeActiveCart}
                              filteredCartItems={filteredCartItems}
                              cartSubtotal={cartSubtotal}
                              cartTotal={cartTotal}
                              cartStats={cartStats}
                              discount={discount}
                              orderTypeLabel={orderTypeLabel}
                              orderTypeSubLabel={orderTypeSubLabel}
                              activeOrderType={activeOrderType}
                              selectedTableId={selectedTableId}
                              cartSearchQuery={cartSearchQuery}
                              onCartSearchChange={setCartSearchQuery}
                              cartPanelWidth={cartPanelWidth}
                              onSetCartWidth={setCartPanelWidth}
                              paymentMethod={paymentMethod}
                              onSetPaymentMethod={handleSetPaymentMethod}
                              isPaymentPanelCollapsed={isPaymentPanelCollapsed}
                              onTogglePaymentCollapsed={() => setIsPaymentPanelCollapsed(prev => !prev)}
                              couponCode={couponCode}
                              activeCoupon={activeCoupon}
                              isApplyingCoupon={isApplyingCoupon}
                              onCouponCodeChange={setCouponCode}
                              onApplyCoupon={handleApplyCoupon}
                              onClearCoupon={() => { setCouponCode(''); clearCoupon(); }}
                              onEditNote={(cartId, note) => { setEditingItemId(cartId); setNoteInput(note); }}
                              onUpdateQuantity={handleUpdateQuantity}
                              onRemoveItem={(cartId) => removeFromCart(cartId)}
                              onVoid={handleVoidOrder}
                              onSendKitchen={handleSendKitchen}
                              onSubmit={handleSubmitOrder}
                              onQuickPay={handleQuickPay}
                              onShowSplitModal={() => setShowSplitModal(true)}
                              onLeaveTable={leaveTable}
                              onCloseCart={() => { if (activeOrderType === OrderType.DINE_IN) leaveTable(); setIsCartOpenMobile(false); }}
                              onFocusSearch={() => searchInputRef.current?.focus()}
                              currencySymbol={currencySymbol}
                              isTouchMode={isTouchMode}
                              lang={lang}
                              t={t}
                              isCartOpenMobile={isCartOpenMobile}
                              shouldShowCart={shouldShowCart}
                              cartPanelWidthClass={cartPanelWidthClass}
                           />
                        )}
                     </div>
                  </>
               )}
            </div>

            <SplitBillModal
               isOpen={showSplitModal}
               onClose={() => setShowSplitModal(false)}
               total={cartTotal}
               currencySymbol={currencySymbol}
               lang={lang}
               t={t}
               splitPayments={splitPayments}
               onSetPayments={setSplitPayments}
               onAddPayment={(method) => {
                  const currentSplitSum = splitPayments.reduce((s, p) => s + p.amount, 0);
                  const remaining = Math.max(0, cartTotal - currentSplitSum);
                  if (remaining > 0) setSplitPayments(prev => [...prev, { method, amount: remaining }]);
               }}
               onRemovePayment={(idx) => setSplitPayments(prev => prev.filter((_, i) => i !== idx))}
               onUpdateAmount={(idx, val) => setSplitPayments(prev => prev.map((p, i) => i === idx ? { ...p, amount: val } : p))}
            />

            {managedTableId && (
               <TableManagementModal
                  sourceTable={tables.find(t => t.id === managedTableId)!}
                  allTables={tables}
                  orders={orders}
                  lang={lang}
                  onClose={() => setManagedTableId(null)}
                  onCloseTable={handleCloseTable}
                  onMergeTables={(targetId, itemIds) => handleMergeTables(managedTableId, targetId, itemIds)}
                  onEditOrder={() => {
                     switchToTable(managedTableId);
                     setManagedTableId(null);
                  }}
                  onTransferTable={(targetId) => {
                     transferTable(managedTableId, targetId);
                     setManagedTableId(null);
                  }}
                  onTransferItems={async (targetId, itemIds) => {
                     await transferItems(managedTableId, targetId, itemIds);
                     setManagedTableId(null);
                  }}
                  onSplitTable={async (targetId, itemIds) => {
                     await splitTable(managedTableId, targetId, itemIds);
                     setManagedTableId(null);
                  }}
               />
            )}
         </div>
      </div>
   );
};

export default POS;
