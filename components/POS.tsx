/**
 * 🔒 POS VESSEL PROTOCOL - LOCKED AS PERFECTION 🔒
 * This file is under the Seal of Perfection. DO NOT MODIFY.
 * Manual Unlock Required: "INITIATE POS PROTOCOL UNLOCK"
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, ShoppingBag, X, LogOut } from 'lucide-react';
import {
   Order, OrderItem, OrderStatus, Table, PaymentMethod,
   OrderType, Customer, PaymentRecord, RestaurantMenu,
   MenuCategory, AppPermission, RecipeIngredient, WarehouseType, JournalEntry, TableStatus, MenuItem
} from '../types';

import TableMap from './TableMap';
import POSHeader from './pos/POSHeader';
import CategoryTabs from './pos/CategoryTabs';
import CategorySidebar from './pos/CategorySidebar';
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
   // --- Global State (Selective Picking for Performance) ---
   const settings = useAuthStore(state => state.settings);
   const branches = useAuthStore(state => state.branches);
   const hasPermission = useAuthStore(state => state.hasPermission);
   const updateSettings = useAuthStore(state => state.updateSettings);
   const isSidebarCollapsed = useAuthStore(state => state.isSidebarCollapsed);
   const setSidebarCollapsed = useAuthStore(state => state.setSidebarCollapsed);

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
   const [editingItemId, setEditingItemId] = useState<string | null>(null);
   const [noteInput, setNoteInput] = useState('');
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
   const [splitPayments, setSplitPayments] = useState<PaymentRecord[]>([]);
   const [showSplitModal, setShowSplitModal] = useState(false);
   const [showCalculator, setShowCalculator] = useState(false);
   const [showApprovalModal, setShowApprovalModal] = useState(false);
   const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);
   const [couponCode, setCouponCode] = useState('');
   const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
   const [approvalCallback, setApprovalCallback] = useState<{ fn: () => void; action: string } | null>(null);
   const activeShift = useFinanceStore(state => state.activeShift);
   const setShift = useFinanceStore(state => state.setShift);
   const isCloseShiftModalOpen = useFinanceStore(state => state.isCloseShiftModalOpen);
   const setIsCloseShiftModalOpen = useFinanceStore(state => state.setIsCloseShiftModalOpen);

   const [isOnline, setIsOnline] = useState(navigator.onLine);
   const [nowTick, setNowTick] = useState(Date.now());
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

   // Default menu
   const activeMenuId = (menus || []).find(m => m.isDefault)?.id || (menus || [])[0]?.id;

   const searchInputRef = useRef<HTMLInputElement>(null);
   const tableNumberBufferRef = useRef('');
   const tableNumberTimerRef = useRef<number | null>(null);

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

   const dynamicCategories = useMemo(() =>
      ['All', ...currentCategories.map(c => c.name)],
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

   const filteredItems = useMemo(() => {
      const now = new Date(nowTick);
      const allItems = currentCategories.flatMap(c =>
         (c.items || []).map(item => ({
            ...item,
            displayCategory: lang === 'ar' ? (c.nameAr || c.name) : c.name,
         }))
      );
      const q = searchQuery.toLowerCase();

      return allItems.filter(item => {
         // Matches category ID or 'all'
         const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;

         const matchesSearch = !q ||
            item.name.toLowerCase().includes(q) ||
            (item.nameAr || '').toLowerCase().includes(q);

         return matchesCategory && matchesSearch && isItemAvailableNow(item, now);
      });
   }, [currentCategories, activeCategory, searchQuery, isItemAvailableNow, nowTick, lang]);

   const pricedItems = useMemo(() =>
      filteredItems.map(item => ({
         ...item,
         displayName: lang === 'ar' ? (item.nameAr || item.name) : item.name,
         displayDescription: lang === 'ar' ? (item.descriptionAr || item.description) : item.description,
         price: resolveItemPrice(item)
      })),
      [filteredItems, resolveItemPrice, lang]);

   const safeActiveCart = activeCart || [];

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
            if (catIndex < dynamicCategories.length) setActiveCategory(dynamicCategories[catIndex]);
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
            if (e.key >= '1' && e.key <= '9') {
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
      dynamicCategories,
      clearCart,
      sortedTables,
      currentTableIndex,
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
      setIsCartOpenMobile(true);
   }, [safeActiveCart, addToCart, updateCartItemQuantity]);

   const handleUpdateQuantity = useCallback((cartId: string, delta: number) => {
      updateCartItemQuantity(cartId, delta);
   }, [updateCartItemQuantity]);

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

      await printService.print({
         type: 'KITCHEN',
         content: formatReceipt({
            order: newOrder,
            title: t.kitchen_ticket || (lang === 'ar' ? 'شيك المطبخ' : 'Kitchen Ticket'),
            settings,
            currencySymbol,
            lang,
            t,
            branch: activeBranch
         })
      });
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
      await printService.print({
         type: 'KITCHEN',
         content: formatReceipt({
            order: newOrder,
            title: t.kitchen_ticket || (lang === 'ar' ? 'شيك المطبخ' : 'Kitchen Ticket'),
            settings,
            currencySymbol,
            lang,
            t,
            branch: activeBranch
         })
      });
      await printService.print({
         type: 'RECEIPT',
         content: formatReceipt({
            order: newOrder,
            title: t.order_receipt || 'Order Receipt',
            settings,
            currencySymbol,
            lang,
            t,
            branch: activeBranch
         })
      });
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

   // Auto-expand sidebar on POS entry to show icons + titles
   useEffect(() => {
      const wasCollapsed = isSidebarCollapsed;
      if (wasCollapsed) {
         setSidebarCollapsed(false);
      }
      return () => {
         if (wasCollapsed) {
            setSidebarCollapsed(true);
         }
      };
   }, []);
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
               isSidebarCollapsed={isSidebarCollapsed}
               isTouchMode={isTouchMode}
               onRecall={handleRecallLastOrder}
               activePriceListId={activePriceListId}
               onSetPriceList={setPriceList}
               isOnline={isOnline}
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

            <div className="flex-1 flex overflow-hidden relative min-h-0">
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
                     <div className="flex-1 flex flex-row h-full overflow-hidden min-h-0">
                        {/* Professionl Category Sidebar (Desktop/Tablet) */}
                        <div className="hidden sm:block">
                           <CategorySidebar
                              categories={currentCategories}
                              activeCategory={activeCategory}
                              onSetCategory={setActiveCategory}
                              lang={lang}
                           />
                        </div>

                        <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
                           <div className="bg-card dark:bg-card p-3 md:p-5 border-b border-border/50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 shadow-sm">
                              <div className="sm:hidden">
                                 <CategoryTabs
                                    categories={currentCategories}
                                    activeCategory={activeCategory}
                                    onSetCategory={setActiveCategory}
                                    isTouchMode={isTouchMode}
                                    lang={lang as any}
                                 />
                              </div>

                              <div className="hidden sm:flex items-center gap-3">
                                 <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                 <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
                                    {activeCategory === 'all' ? (lang === 'ar' ? 'جميع الأصناف' : 'All Items') :
                                       (currentCategories.find(c => c.id === activeCategory)?.nameAr ||
                                          currentCategories.find(c => c.id === activeCategory)?.name || (lang === 'ar' ? 'القسم' : 'Category'))}
                                 </h2>
                              </div>

                              <div className="relative w-full sm:w-64 xl:w-96">
                                 <Search className={`absolute top-1/2 -translate-y-1/2 text-primary/40 w-4 h-4 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
                                 <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={t.search_placeholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full py-2.5 md:py-3.5 text-sm pr-11 pl-11 bg-elevated dark:bg-elevated/50 border-none rounded-2xl focus:ring-2 focus:ring-primary font-bold ${lang === 'ar' ? 'text-right' : 'text-left'} `}
                                 />
                              </div>
                           </div>
                           <div className="flex-1 overflow-y-auto p-4 md:p-8 min-h-0 bg-slate-50/30 dark:bg-slate-950/20">
                              <ItemGrid
                                 items={pricedItems}
                                 onAddItem={handleAddItem}
                                 currencySymbol={currencySymbol}
                                 isTouchMode={isTouchMode}
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
                     <div className={`
                     fixed lg:relative inset-y-0 w-[92%] max-w-[94vw] sm:w-[420px] xl:w-[480px] bg-card dark:bg-card flex flex-col h-full shadow-2xl z-40 transition-transform duration-300
                     ${lang === 'ar' ? 'border-r left-0' : 'border-l right-0'} border-slate-200 dark:border-slate-800
                     ${shouldShowCart && isCartOpenMobile ? 'translate-x-0' : (lang === 'ar' ? '-translate-x-full' : 'translate-x-full')} lg:translate-x-0
                  `}>
                        <div className="p-4 md:p-8 border-b border-slate-200 dark:border-slate-800 bg-elevated dark:bg-elevated/50 flex justify-between items-center shrink-0">
                           <div className="min-w-0">
                              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                 {orderTypeLabel}
                              </h2>
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5 md:mt-1 truncate">
                                 {orderTypeSubLabel}
                              </p>
                           </div>
                           <div className="flex items-center gap-2">
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
                                 className="p-2 md:p-3 text-muted hover:text-primary transition-all bg-card dark:bg-elevated rounded-full shadow-sm flex-shrink-0"
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

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar min-h-0">
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
                              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 opacity-30">
                                 <ShoppingBag size={60} className="mb-4" />
                                 <p className="font-black uppercase tracking-widest">{t.empty_cart}</p>
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
