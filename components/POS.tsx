/**
 * 🔒 POS VESSEL PROTOCOL - LOCKED AS PERFECTION 🔒
 * This file is under the Seal of Perfection. DO NOT MODIFY.
 * Manual Unlock Required: "INITIATE POS PROTOCOL UNLOCK"
 */
import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from 'react';
import { Search, ShoppingBag, X, LogOut, SlidersHorizontal, ArrowUpDown, LayoutGrid, Grid2x2, PanelRightOpen, PanelRightClose, Plus, UtensilsCrossed, Truck, MapPin, Keyboard } from 'lucide-react';
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
import { printService } from '../src/services/printService';
import { formatReceipt } from '../services/receiptFormatter';
import { printKitchenTicketsByRouting, printOrderReceipt } from '../services/posPrintOrchestrator';
import { useToast } from './Toast';
import { useModal } from './Modal';

// Services
import { translations } from '../services/translations';
import { shiftsApi } from '../services/api';

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
   const [itemFilter, setItemFilter] = useState<'all' | 'available' | 'popular'>('all');
   const [itemSort, setItemSort] = useState<'smart' | 'name' | 'price_asc' | 'price_desc'>('smart');
   const [itemDensity, setItemDensity] = useState<'comfortable' | 'compact' | 'ultra'>('compact');
   const [editingItemId, setEditingItemId] = useState<string | null>(null);
   const [noteInput, setNoteInput] = useState('');
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
   const [splitPayments, setSplitPayments] = useState<PaymentRecord[]>([]);
   const [showSplitModal, setShowSplitModal] = useState(false);
   const [showCalculator, setShowCalculator] = useState(false);
   const [showApprovalModal, setShowApprovalModal] = useState(false);
   const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);
   const [cartPanelWidth, setCartPanelWidth] = useState<'compact' | 'normal' | 'wide'>('normal');
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
               showToast(error?.message || (settings.language === 'ar' ? 'فشل تنفيذ العملية' : 'Action failed'), 'error');
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
         if (parsed?.cartPanelWidth && ['compact', 'normal', 'wide'].includes(parsed.cartPanelWidth)) {
            setCartPanelWidth(parsed.cartPanelWidth);
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
            itemDensity,
            cartPanelWidth
         }));
      } catch {
         // ignore storage errors
      }
   }, [itemFilter, itemSort, itemDensity, cartPanelWidth]);

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
      if (!lastAddedItemId) return;
      const timer = window.setTimeout(() => setLastAddedItemId(null), 700);
      return () => window.clearTimeout(timer);
   }, [lastAddedItemId]);

   // Default menu
   const activeMenuId = (menus || []).find(m => m.isDefault)?.id || (menus || [])[0]?.id;

   const searchInputRef = useRef<HTMLInputElement>(null);
   const tableNumberBufferRef = useRef('');
   const tableNumberTimerRef = useRef<number | null>(null);
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

   useEffect(() => {
      if (activeCategory === 'all') return;
      const currentCount = categoryResultCounts[activeCategory] || 0;
      if (currentCount > 0) return;

      const firstAvailableCategory = currentCategories.find(c => (categoryResultCounts[c.id] || 0) > 0);
      setActiveCategory(firstAvailableCategory?.id || 'all');
   }, [activeCategory, categoryResultCounts, currentCategories]);

   const availableVisibleCount = useMemo(
      () => pricedItems.filter(item => (item as any).isActuallyAvailable !== false).length,
      [pricedItems]
   );

   const popularVisibleCount = useMemo(
      () => pricedItems.filter(item => !!item.isPopular).length,
      [pricedItems]
   );

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
      setIsCartOpenMobile(true);
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

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         const isInput = (e.target as HTMLElement).tagName === 'INPUT';
         const isTextarea = (e.target as HTMLElement).tagName === 'TEXTAREA';
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
      return () => window.removeEventListener('keydown', handleKeyDown);
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
      findTableByNumber
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
      setPaymentMethod(PaymentMethod.CASH);
      setTimeout(() => handleSubmitOrder(), 0);
   };

   const handleRecallLastOrder = () => {
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
      }
   };

   const performCloseTable = async (tableId: string) => {
      const activeOrder = orders.find(o => o.tableId === tableId && o.status !== OrderStatus.DELIVERED);
      if (activeOrder) {
         await updateOrderStatus(activeOrder.id, OrderStatus.DELIVERED);
         await printService.print({
            type: 'RECEIPT',
            content: formatReceipt({
               order: activeOrder,
               title: t.final_bill || 'Final Bill',
               settings,
               currencySymbol,
               lang,
               t,
               branch: activeBranch
            })
         });
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
   const handleSendKitchen = async () => {
      if (safeActiveCart.length === 0) return;

      const newOrder: Order = {
         id: Math.random().toString(36).substr(2, 9).toUpperCase(),
         type: activeOrderType,
         branchId: branchId,
         tableId: selectedTableId || undefined,
         customerId: activeOrderType === OrderType.DELIVERY ? deliveryCustomer?.id : undefined,
         items: [...safeActiveCart],
         status: OrderStatus.PREPARING,
         subtotal: cartTotal / 1.1,
         tax: cartTotal - (cartTotal / 1.1),
         total: cartTotal,
         createdAt: new Date(),
         payments: [],
         syncStatus: 'PENDING'
      };

      await placeOrder(newOrder);

      if (activeOrderType === OrderType.DINE_IN && selectedTableId) {
         updateTableStatus(selectedTableId, TableStatus.OCCUPIED);
         clearTableDraft(selectedTableId);
      }

      setDeliveryCustomer(null);
      setSplitPayments([]);
      setPaymentMethod(PaymentMethod.CASH);
      setCouponCode('');
      clearCoupon();

      await printKitchenTicketsByRouting({
         order: newOrder,
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
      if (settings.autoPrintReceipt !== false) {
         await printOrderReceipt({
            order: newOrder,
            settings,
            currencySymbol,
            lang,
            t,
            branch: activeBranch
         });
      }
      showToast(t.send_kitchen || (lang === 'ar' ? 'تم إرسال الطلب للمطبخ' : 'Sent to kitchen'), 'success');
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

      const newOrder: Order = {
         id: Math.random().toString(36).substr(2, 9).toUpperCase(),
         type: activeOrderType,
         branchId: branchId,
         tableId: selectedTableId || undefined,
         customerId: activeOrderType === OrderType.DELIVERY ? deliveryCustomer?.id : undefined,
         items: [...safeActiveCart],
         status: OrderStatus.PENDING,
         subtotal: cartTotal / 1.1,
         tax: cartTotal - (cartTotal / 1.1),
         total: cartTotal,
         createdAt: new Date(),
         paymentMethod: paymentMethod,
         payments: paymentMethod === PaymentMethod.SPLIT ? splitPayments : [{ method: paymentMethod, amount: cartTotal }],
         syncStatus: 'PENDING'
      };

      // 1. Place Order in Store (Syncs with server which now handles inventory)
      await placeOrder(newOrder);

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
         description: `Sale - Order #${newOrder.id}`,
         debitAccountId: '1-1-1',
         creditAccountId: '4-1',
         amount: newOrder.total,
         referenceId: newOrder.id
      });

      // Reset Local State
      setDeliveryCustomer(null);
      setSplitPayments([]);
      setPaymentMethod(PaymentMethod.CASH);
      setCouponCode('');
      clearCoupon();

      // 3. Trigger Kitchen + Customer Receipts
      await printKitchenTicketsByRouting({
         order: newOrder,
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
      if (settings.autoPrintReceipt !== false) {
         await printOrderReceipt({
            order: newOrder,
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
            showToast(error?.message || (lang === 'ar' ? 'كوبون غير صالح' : 'Invalid coupon'), 'error');
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
         ? `${t.table} ${selectedTableId || ''}`.trim()
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
         ? 'sm:w-[360px] xl:w-[400px]'
         : cartPanelWidth === 'wide'
            ? 'sm:w-[460px] xl:w-[540px]'
            : 'sm:w-[420px] xl:w-[480px]';
   const desktopWorkspaceClass = shouldRenderCartPanel
      ? (cartPanelWidth === 'compact'
         ? 'lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]'
         : cartPanelWidth === 'wide'
            ? 'lg:grid-cols-[minmax(0,1fr)_500px] xl:grid-cols-[minmax(0,1fr)_560px]'
            : 'lg:grid-cols-[minmax(0,1fr)_430px] xl:grid-cols-[minmax(0,1fr)_500px]')
      : 'lg:grid-cols-1';

   useEffect(() => {
      if (showMap || showCustomerSelect) setIsCartOpenMobile(false);
   }, [showMap, showCustomerSelect]);

   useEffect(() => {
      if (safeActiveCart.length === 0 && !selectedTableId) setIsCartOpenMobile(false);
   }, [safeActiveCart.length, selectedTableId]);

   return (
      <div className="flex app-viewport bg-app text-main transition-colors overflow-hidden min-h-0">
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
            <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 md:px-6 py-2.5">
               <div className="flex flex-wrap items-center gap-2">
                  {modeShortcuts.map((entry) => (
                     <button
                        key={entry.mode}
                        onClick={() => setOrderMode(entry.mode)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-colors ${activeOrderType === entry.mode ? entry.activeClass : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border-transparent hover:border-primary/40'}`}
                     >
                        <entry.icon size={14} />
                        <span>{entry.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${activeOrderType === entry.mode ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>{entry.keyHint}</span>
                     </button>
                  ))}

                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />

                  <button
                     onClick={() => searchInputRef.current?.focus()}
                     className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider hover:text-primary"
                  >
                     <Search size={14} />
                     {lang === 'ar' ? 'بحث' : 'Search'}
                     <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700">/</span>
                  </button>

                  <button
                     onClick={() => setIsCartOpenMobile((prev) => !prev)}
                     className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider hover:text-primary"
                  >
                     <ShoppingBag size={14} />
                     {lang === 'ar' ? 'السلة' : 'Cart'}
                     <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700">{safeActiveCart.length}</span>
                  </button>

                  {activeOrderType === OrderType.DINE_IN && (
                     <button
                        onClick={() => setSelectedTableId(null)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider hover:text-primary"
                     >
                        <LayoutGrid size={14} />
                        {lang === 'ar' ? 'الطاولات' : 'Tables'}
                     </button>
                  )}

                  {activeOrderType === OrderType.DELIVERY && (
                     <button
                        onClick={() => setDeliveryCustomer(null)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider hover:text-primary"
                     >
                        <Truck size={14} />
                        {lang === 'ar' ? 'العملاء' : 'Customers'}
                     </button>
                  )}

                  {safeActiveCart.length > 0 && (
                     <button
                        onClick={handleQuickPay}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700"
                     >
                        <Plus size={14} />
                        {lang === 'ar' ? 'دفع سريع' : 'Quick Pay'}
                     </button>
                  )}

                  <div className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                     <Keyboard size={12} />
                     {lang === 'ar' ? 'اختصارات لوحة المفاتيح مفعلة' : 'Keyboard shortcuts enabled'}
                  </div>
               </div>
            </div>


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

            <div className="flex-1 flex overflow-hidden relative min-h-0 bg-slate-100/70 dark:bg-slate-950">
               {/* Cart Mobile Overlay */}
               {shouldShowCart && isCartOpenMobile && (
                  <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 animate-in fade-in" onClick={() => setIsCartOpenMobile(false)} />
               )}

               {showMap ? (
                  <div className="flex-1 p-3 md:p-5 lg:p-8 bg-app dark:bg-app overflow-y-auto min-h-0">
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
                           if (table.status === TableStatus.OCCUPIED) {
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
                     <div className={`flex-1 min-h-0 grid grid-cols-1 ${desktopWorkspaceClass} gap-0 lg:gap-2`}>
                        <div className={`min-w-0 flex flex-col h-full overflow-hidden min-h-0 bg-slate-50 dark:bg-slate-950 transition-all duration-300 ${shouldRenderCartPanel ? 'lg:rounded-2xl lg:border lg:border-slate-200/70 lg:dark:border-slate-800 lg:shadow-sm lg:mx-2 lg:my-2' : ''}`}>
                        {/* Professional Categories Bar At Top */}
                        <div className="shrink-0 flex-col flex overflow-hidden">
                           <CategoryTabs
                              categories={currentCategories}
                              activeCategory={activeCategory}
                              onSetCategory={setActiveCategory}
                              isTouchMode={isTouchMode}
                              lang={lang as any}
                              counts={categoryResultCounts}
                              totalCount={totalMatchedAcrossCategories}
                              hasActiveFiltering={Boolean(normalizedSearchQuery || itemFilter !== 'all')}
                           />
                        </div>

                        <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
                           {/* Search & Actions Bar (Clean & Flexible) */}
                           <div className="px-3 md:px-5 xl:px-6 py-3 md:py-4 flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                 <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
                                       {activeCategory === 'all' ? (lang === 'ar' ? 'جميع الأصناف' : 'All Items') :
                                          (currentCategories.find(c => c.id === activeCategory)?.nameAr ||
                                             currentCategories.find(c => c.id === activeCategory)?.name || (lang === 'ar' ? 'القسم' : 'Category'))}
                                    </h2>
                                 </div>

                                 <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider">
                                    <span className="px-2.5 py-1.5 rounded-full bg-primary/10 text-primary">
                                       {pricedItems.length} {lang === 'ar' ? 'صنف' : 'items'}
                                    </span>
                                    <span className="px-2.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300">
                                       {availableVisibleCount} {lang === 'ar' ? 'متاح' : 'available'}
                                    </span>
                                    <span className="px-2.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300">
                                       {popularVisibleCount} {lang === 'ar' ? 'رائج' : 'popular'}
                                    </span>
                                    {(searchQuery || itemFilter !== 'all' || itemSort !== 'smart') && (
                                       <button
                                          onClick={() => {
                                             setSearchQuery('');
                                             setItemFilter('all');
                                             setItemSort('smart');
                                          }}
                                          className="px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                                       >
                                          {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
                                       </button>
                                    )}
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,1fr)_auto] gap-3 items-center">
                                 <div className="relative w-full xl:max-w-2xl">
                                    <Search className={`absolute top-1/2 -translate-y-1/2 text-primary/30 w-4 h-4 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
                                    <input
                                       ref={searchInputRef}
                                       type="text"
                                       placeholder={t.search_placeholder}
                                       value={searchQuery}
                                       onChange={(e) => setSearchQuery(e.target.value)}
                                       className={`w-full py-2.5 md:py-3 text-sm pr-12 pl-12 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-primary font-bold ${lang === 'ar' ? 'text-right' : 'text-left'} `}
                                    />
                                    {searchQuery && (
                                       <button
                                          onClick={() => setSearchQuery('')}
                                          className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary ${lang === 'ar' ? 'left-3' : 'right-3'}`}
                                       >
                                          <X size={16} />
                                       </button>
                                    )}
                                 </div>

                                 <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                    <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                                       {[
                                          { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
                                          { id: 'available', label: lang === 'ar' ? 'متاح' : 'Available' },
                                          { id: 'popular', label: lang === 'ar' ? 'الأكثر طلباً' : 'Popular' }
                                       ].map((filter) => (
                                          <button
                                             key={filter.id}
                                             onClick={() => setItemFilter(filter.id as 'all' | 'available' | 'popular')}
                                             className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${itemFilter === filter.id ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
                                          >
                                             {filter.label}
                                          </button>
                                       ))}
                                    </div>

                                    <div className="relative">
                                       <ArrowUpDown size={14} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${lang === 'ar' ? 'right-2.5' : 'left-2.5'}`} />
                                       <select
                                          value={itemSort}
                                          onChange={(e) => setItemSort(e.target.value as 'smart' | 'name' | 'price_asc' | 'price_desc')}
                                          className={`h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-200 ${lang === 'ar' ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
                                       >
                                          <option value="smart">{lang === 'ar' ? 'ترتيب ذكي' : 'Smart'}</option>
                                          <option value="name">{lang === 'ar' ? 'الاسم' : 'Name'}</option>
                                          <option value="price_asc">{lang === 'ar' ? 'السعر: الأقل' : 'Price: Low'}</option>
                                          <option value="price_desc">{lang === 'ar' ? 'السعر: الأعلى' : 'Price: High'}</option>
                                       </select>
                                    </div>

                                    <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                                       <button
                                          onClick={() => setItemDensity('comfortable')}
                                          title={lang === 'ar' ? 'عرض مريح' : 'Comfortable view'}
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${itemDensity === 'comfortable' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
                                       >
                                          <LayoutGrid size={15} />
                                       </button>
                                       <button
                                          onClick={() => setItemDensity('compact')}
                                          title={lang === 'ar' ? 'عرض مضغوط' : 'Compact view'}
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${itemDensity === 'compact' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
                                       >
                                          <Grid2x2 size={15} />
                                       </button>
                                       <button
                                          onClick={() => setItemDensity('ultra')}
                                          title={lang === 'ar' ? 'عرض فائق الكثافة' : 'Ultra compact view'}
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${itemDensity === 'ultra' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
                                       >
                                          <span className="text-[9px] font-black">UL</span>
                                       </button>
                                    </div>
                                 </div>
                              </div>

                              {quickPickItems.length > 0 && (
                                 <div className="flex md:flex-wrap items-center gap-2 overflow-x-auto md:overflow-visible no-scrollbar py-1.5 px-0.5">
                                    <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                       {lang === 'ar' ? 'اختيارات ذكية' : 'Smart picks'}
                                    </span>
                                    {quickPickItems.map((item) => (
                                       <button
                                          key={item.id}
                                          onClick={() => handleAddItem(item)}
                                          className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-primary hover:text-white transition-colors"
                                       >
                                          <Plus size={12} />
                                          <span className="text-[11px] font-black">
                                             {(item as any).displayName || item.name}
                                          </span>
                                          <span className="text-[10px] font-bold opacity-80">
                                             {item.price.toFixed(2)} {currencySymbol}
                                          </span>
                                       </button>
                                    ))}
                                 </div>
                              )}
                              {upsellSuggestions.length > 0 && (
                                 <div className="flex md:flex-wrap items-center gap-2 overflow-x-auto md:overflow-visible no-scrollbar py-1 px-0.5">
                                    <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
                                       {lang === 'ar' ? 'مقترحات إضافة' : 'Upsell'}
                                    </span>
                                    {upsellSuggestions.map((item) => (
                                       <button
                                          key={`upsell-${item.id}`}
                                          onClick={() => handleAddItem(item)}
                                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors"
                                       >
                                          <Plus size={11} />
                                          <span className="text-[11px] font-black">{(item as any).displayName || item.name}</span>
                                       </button>
                                    ))}
                                 </div>
                              )}
                           </div>
                           <div className="flex-1 overflow-y-auto p-3 md:p-4 xl:p-5 min-h-0 bg-slate-50/30 dark:bg-slate-950/20">
                              <ItemGrid
                                 items={pricedItems}
                                 onAddItem={handleAddItem}
                                 onRemoveItem={handleRemoveOneFromCart}
                                 cartItems={safeActiveCart}
                                 currencySymbol={currencySymbol}
                                 isTouchMode={isTouchMode}
                                 density={itemDensity}
                                 lang={lang as any}
                                 highlightedItemId={lastAddedItemId}
                              />
                           </div>
                        </div>
                        </div>

                     {shouldShowCart && !isCartOpenMobile && (
                        <button
                           onClick={() => setIsCartOpenMobile(true)}
                           className={`lg:hidden fixed bottom-[max(1rem,var(--safe-bottom))] z-40 px-4 py-3 bg-primary text-white rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 ${lang === 'ar' ? 'right-4' : 'left-4'}`}
                        >
                           {t.checkout || 'Cart'} ({safeActiveCart.length})
                        </button>
                     )}

                     {/* Cart Sidebar */}
                     {shouldRenderCartPanel && (
                        <div className={`
                     fixed lg:static inset-y-0 w-[92%] max-w-[94vw] lg:w-full ${cartPanelWidthClass} bg-card dark:bg-card flex flex-col h-full lg:h-[calc(100%-1rem)] shadow-2xl z-40 transition-transform duration-300
                     ${lang === 'ar' ? 'border-r left-0' : 'border-l right-0'} border-slate-200 dark:border-slate-800
                     ${shouldShowCart && isCartOpenMobile ? 'translate-x-0' : (lang === 'ar' ? '-translate-x-full' : 'translate-x-full')} lg:translate-x-0
                     lg:mx-2 lg:my-2 lg:self-center lg:rounded-2xl lg:border lg:shadow-xl lg:overflow-hidden
                  `}>
                        <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 bg-elevated dark:bg-elevated/50 flex justify-between items-center shrink-0">
                           <div className="min-w-0">
                              <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                 {orderTypeLabel}
                              </h2>
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5 md:mt-1 truncate">
                                 {orderTypeSubLabel}
                              </p>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                                 <button
                                    onClick={() => setCartPanelWidth('compact')}
                                    title={lang === 'ar' ? 'سلة أصغر' : 'Compact cart'}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${cartPanelWidth === 'compact' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
                                 >
                                    <PanelRightClose size={15} />
                                 </button>
                                 <button
                                    onClick={() => setCartPanelWidth('normal')}
                                    title={lang === 'ar' ? 'سلة متوسطة' : 'Normal cart'}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${cartPanelWidth === 'normal' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
                                 >
                                    <SlidersHorizontal size={15} />
                                 </button>
                                 <button
                                    onClick={() => setCartPanelWidth('wide')}
                                    title={lang === 'ar' ? 'سلة أوسع' : 'Wide cart'}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${cartPanelWidth === 'wide' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
                                 >
                                    <PanelRightOpen size={15} />
                                 </button>
                              </div>
                              {activeOrderType === OrderType.DINE_IN && selectedTableId && (
                                 <button
                                    onClick={leaveTable}
                                    title={t.back_to_tables}
                                    className="p-2 md:p-3 text-muted hover:text-primary transition-all bg-card dark:bg-elevated rounded-full shadow-sm flex-shrink-0"
                                 >
                                    <LogOut size={20} className="md:w-6 md:h-6" />
                                 </button>
                              )}
                              <button
                                 onClick={() => { if (activeOrderType === OrderType.DINE_IN) leaveTable(); setIsCartOpenMobile(false); }}
                                 className="p-2 text-muted hover:text-primary transition-all bg-card dark:bg-elevated rounded-full shadow-sm flex-shrink-0 lg:hidden"
                              >
                                 <X size={20} className="md:w-6 md:h-6" />
                              </button>
                           </div>
                        </div>
                        {activeOrderType === OrderType.DINE_IN && selectedTableId && (
                           <div className="px-4 md:px-8 py-3 border-b border-slate-200 dark:border-slate-800 bg-card/50 dark:bg-card/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted shrink-0">
                                 {t.quick_switch}
                              </span>
                              <button
                                 onClick={() => {
                                    if (sortedTables.length === 0) return;
                                    const prevIndex = currentTableIndex <= 0 ? sortedTables.length - 1 : currentTableIndex - 1;
                                    switchToTable(sortedTables[prevIndex].id);
                                 }}
                                 className="px-2.5 py-1.5 text-xs font-black rounded-full bg-elevated dark:bg-elevated/60 text-main"
                              >
                                 {t.prev_table}
                              </button>
                              <button
                                 onClick={() => {
                                    if (sortedTables.length === 0) return;
                                    const nextIndex = currentTableIndex === -1 ? 0 : (currentTableIndex + 1) % sortedTables.length;
                                    switchToTable(sortedTables[nextIndex].id);
                                 }}
                                 className="px-2.5 py-1.5 text-xs font-black rounded-full bg-elevated dark:bg-elevated/60 text-main"
                              >
                                 {t.next_table}
                              </button>
                              <div className="flex items-center gap-2">
                                 {sortedTables.slice(0, 10).map((table) => {
                                    const hasDraft = !!tableDrafts[table.id];
                                    const isActive = table.id === selectedTableId;
                                    return (
                                       <button
                                          key={table.id}
                                          onClick={() => switchToTable(table.id)}
                                          className={`px-2.5 py-1.5 text-xs font-black rounded-full border transition ${isActive ? 'bg-primary text-white border-primary' : 'bg-card dark:bg-card border-slate-200 dark:border-slate-700 text-main'} ${hasDraft && !isActive ? 'ring-2 ring-primary/30' : ''}`}
                                       >
                                          {table.name || table.id}
                                       </button>
                                    );
                                 })}
                              </div>
                           </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-2.5 md:p-3 space-y-2 no-scrollbar min-h-0">
                           {safeActiveCart.map(item => (
                              <CartItem
                                 key={item.cartId}
                                 item={item}
                                 currencySymbol={currencySymbol}
                                 isTouchMode={isTouchMode}
                                 lang={lang}
                                 onEditNote={(cartId, note) => {
                                    setEditingItemId(cartId);
                                    setNoteInput(note);
                                 }}
                                 onUpdateQuantity={handleUpdateQuantity}
                                 onRemove={(cartId) => removeFromCart(cartId)}
                              />
                           ))}
                           {safeActiveCart.length === 0 && (
                              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 md:py-16 px-4">
                                 <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 opacity-70">
                                    <ShoppingBag size={28} />
                                 </div>
                                 <p className="font-black uppercase tracking-widest opacity-70">{t.empty_cart}</p>
                                 <p className="text-xs font-bold mt-2 opacity-50 text-center">
                                    {lang === 'ar' ? 'ابدأ بإضافة أصناف أو استخدم البحث السريع' : 'Start adding items or use quick search'}
                                 </p>
                                 <div className="flex items-center gap-2 mt-4">
                                    <button
                                       onClick={() => searchInputRef.current?.focus()}
                                       className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase tracking-wider hover:text-primary"
                                    >
                                       {lang === 'ar' ? 'بحث' : 'Search'}
                                    </button>
                                    {!hasCartItems && (
                                       <button
                                          onClick={() => setItemFilter('popular')}
                                          className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 text-xs font-black uppercase tracking-wider"
                                       >
                                          {lang === 'ar' ? 'الأكثر طلباً' : 'Popular'}
                                       </button>
                                    )}
                                 </div>
                              </div>
                           )}
                        </div>

                        <PaymentSummary
                           subtotal={cartSubtotal}
                           discount={discount}
                           tax={cartTotal - (cartTotal / 1.1)}
                           total={cartTotal}
                           currencySymbol={currencySymbol}
                           paymentMethod={paymentMethod}
                           onSetPaymentMethod={setPaymentMethod}
                           onShowSplitModal={() => setShowSplitModal(true)}
                           isTouchMode={isTouchMode}
                           lang={lang}
                           t={t}
                           onVoid={handleVoidOrder}
                           onSendKitchen={handleSendKitchen}
                           onSubmit={handleSubmitOrder}
                           onQuickPay={handleQuickPay}
                           canSubmit={safeActiveCart.length > 0}
                           couponCode={couponCode}
                           activeCoupon={activeCoupon}
                           isApplyingCoupon={isApplyingCoupon}
                           onCouponCodeChange={setCouponCode}
                           onApplyCoupon={handleApplyCoupon}
                           onClearCoupon={() => { setCouponCode(''); clearCoupon(); }}
                        />
                        </div>
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
