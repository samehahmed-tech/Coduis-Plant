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
   MenuCategory, AppPermission, RecipeIngredient, WarehouseType, JournalEntry, TableStatus
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

// Services
import { translations } from '../services/translations';

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

   // --- Local State ---
   const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
   const [managedTableId, setManagedTableId] = useState<string | null>(null);
   const [deliveryCustomer, setDeliveryCustomer] = useState<Customer | null>(null);
   // cart is now activeCart from store
   const [activeCategory, setActiveCategory] = useState('All');
   const [searchQuery, setSearchQuery] = useState('');
   const [editingItemId, setEditingItemId] = useState<string | null>(null);
   const [noteInput, setNoteInput] = useState('');
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
   const [splitPayments, setSplitPayments] = useState<PaymentRecord[]>([]);
   const [showSplitModal, setShowSplitModal] = useState(false);
   const [showCalculator, setShowCalculator] = useState(false);
   const [showApprovalModal, setShowApprovalModal] = useState(false);
   const [approvalCallback, setApprovalCallback] = useState<{ fn: () => void; action: string } | null>(null);
   const activeShift = useFinanceStore(state => state.activeShift);
   const setShift = useFinanceStore(state => state.setShift);
   const isCloseShiftModalOpen = useFinanceStore(state => state.isCloseShiftModalOpen);
   const setIsCloseShiftModalOpen = useFinanceStore(state => state.setIsCloseShiftModalOpen);

   const [isOnline, setIsOnline] = useState(navigator.onLine);

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

   // Default menu
   const activeMenuId = (menus || []).find(m => m.isDefault)?.id || (menus || [])[0]?.id;

   const searchInputRef = useRef<HTMLInputElement>(null);

   // --- Derived Data ---
   const lang = settings.language;
   const t = translations[lang];
   const isDarkMode = settings.isDarkMode;
   const isTouchMode = settings.isTouchMode;
   const currencySymbol = settings.currencySymbol;
   const branchId = settings.activeBranchId || 'b1';

   const currentCategories = useMemo(() =>
      (categories || []).filter(cat => cat.menuIds.includes(activeMenuId || '')),
      [categories, activeMenuId]);

   const dynamicCategories = useMemo(() =>
      ['All', ...currentCategories.map(c => c.name)],
      [currentCategories]);

   const filteredItems = useMemo(() => {
      const allItems = currentCategories.flatMap(c => c.items);
      return allItems.filter(item =>
         (activeCategory === 'All' || item.category === activeCategory) &&
         (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
   }, [currentCategories, activeCategory, searchQuery]);

   const { cartSubtotal, cartTotal } = useMemo(() => {
      const subtotal = activeCart.reduce((acc, item) => {
         const modsPrice = item.selectedModifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
         return acc + ((item.price + modsPrice) * item.quantity);
      }, 0);
      const afterDiscount = subtotal * (1 - discount / 100);
      const total = afterDiscount * 1.1; // 10% tax
      return { cartSubtotal: subtotal, cartTotal: total };
   }, [activeCart, discount]);

   // --- Shift Sync ---
   useEffect(() => {
      const syncShift = async () => {
         if (!activeShift && settings.activeBranchId) {
            try {
               const shift = await shiftsApi.getActive(useAuthStore.getState().user?.id || 'u1', settings.activeBranchId);
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
               if (activeCart.length > 0) handleSubmitOrder();
            }
            return;
         }

         if (e.key === 'Escape') {
            if (showSplitModal) setShowSplitModal(false);

            if (isPOS && (activeCart.length > 0 || selectedTableId)) {
               if (activeOrderType === OrderType.DINE_IN) setSelectedTableId(null);
               else clearCart();
            }
         }
         if (!isInput && e.key >= '1' && e.key <= '9') {
            const catIndex = parseInt(e.key) - 1;
            if (catIndex < dynamicCategories.length) setActiveCategory(dynamicCategories[catIndex]);
         }
         if (e.key === '/' && !isInput) {
            e.preventDefault();
            searchInputRef.current?.focus();
         }
         if (e.key === 'Enter' && activeCart.length > 0 && !showSplitModal) handleSubmitOrder();
         if (e.key === 'Delete' && activeCart.length > 0) handleVoidOrder();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [activeCart, selectedTableId, showSplitModal, editingItemId, activeOrderType, dynamicCategories, clearCart]);

   // --- Handlers (Memoized to prevent child re-renders) ---
   const handleAddItem = useCallback((item: any) => {
      const existingItem = activeCart.find(ci =>
         ci.id === item.id && JSON.stringify(ci.selectedModifiers) === JSON.stringify([])
      );

      if (existingItem) {
         updateCartItemQuantity(existingItem.cartId, 1);
      } else {
         addToCart({ ...item, cartId: Math.random().toString(36).substr(2, 9), quantity: 1, selectedModifiers: [] });
      }
   }, [activeCart, addToCart, updateCartItemQuantity]);

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

   const handleSubmitOrder = async () => {
      if (activeCart.length === 0) return;
      if (paymentMethod === PaymentMethod.SPLIT) {
         const splitTotal = splitPayments.reduce((sum, p) => sum + p.amount, 0);
         if (Math.abs(splitTotal - cartTotal) > 0.01) {
            alert(t.split_total_error);
            return;
         }
      }

      const newOrder: Order = {
         id: Math.random().toString(36).substr(2, 9).toUpperCase(),
         type: activeOrderType,
         branchId: branchId,
         tableId: selectedTableId || undefined,
         customerId: activeOrderType === OrderType.DELIVERY ? deliveryCustomer?.id : undefined,
         items: [...activeCart],
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

      // Update Table Status to DIRTY if Dine-In
      if (activeOrderType === OrderType.DINE_IN && selectedTableId) {
         updateTableStatus(selectedTableId, TableStatus.DIRTY);
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

      // 3. Trigger Thermal Receipt
      await printService.print({
         type: 'RECEIPT',
         content: `ORDER #${newOrder.id}\nTOTAL: ${newOrder.total}\nDATE: ${new Date().toLocaleString()}`
      });
      if (paymentMethod === PaymentMethod.CASH) {
         await printService.triggerCashDrawer();
      }
   };

   const handleVoidOrder = () => {
      if (activeCart.length === 0) return;

      setApprovalCallback({
         action: 'VOID_ORDER',
         fn: () => {
            if (confirm(t.void_confirm)) {
               clearCart();
               setDeliveryCustomer(null);
               setSplitPayments([]);
               setPaymentMethod(PaymentMethod.CASH);
               setSelectedTableId(null);
            }
         }
      });
      setShowApprovalModal(true);
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
   const showMap = activeOrderType === OrderType.DINE_IN && !selectedTableId;
   const showCustomerSelect = activeOrderType === OrderType.DELIVERY && !deliveryCustomer;

   return (
      <div className="flex h-screen bg-app text-main transition-colors overflow-hidden">
         <ShiftOverlays onOpen={() => console.log('Shift opened')} />

         <CloseShiftModal
            isOpen={isCloseShiftModalOpen}
            onClose={() => setIsCloseShiftModalOpen(false)}
         />

         <ManagerApprovalModal
            isOpen={showApprovalModal}
            onClose={() => setShowApprovalModal(false)}
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

         <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <POSHeader
               activeMode={activeOrderType}
               lang={lang}
               t={t}
               selectedTableId={selectedTableId}
               onClearTable={() => setSelectedTableId(null)}
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

            <div className="flex-1 flex overflow-hidden relative">
               {/* Cart Mobile Overlay */}
               {(activeCart.length > 0 || selectedTableId) && !showMap && !showCustomerSelect && (
                  <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 animate-in fade-in" />
               )}

               {showMap ? (
                  <div className="flex-1 p-4 md:p-6 lg:p-10 bg-app dark:bg-app overflow-y-auto">
                     <TableMap
                        tables={tables}
                        zones={zones}
                        orders={orders}
                        onSelectTable={(table) => {
                           if (table.status === TableStatus.DIRTY) {
                              if (window.confirm("Mark table as Clean?")) {
                                 updateTableStatus(table.id, TableStatus.AVAILABLE);
                              }
                              return;
                           }
                           if (table.status === TableStatus.OCCUPIED) {
                              setManagedTableId(table.id);
                           } else {
                              setSelectedTableId(table.id);
                              clearCart();
                              setShowMap(false);
                           }
                        }}
                        lang={lang}
                        t={t}
                        isDarkMode={isDarkMode}
                     />
                  </div>
               ) : showCustomerSelect ? (
                  <CustomerSelectView
                     customers={customers}
                     onSelectCustomer={setDeliveryCustomer}
                     lang={lang}
                     t={t}
                  />
               ) : (
                  <>
                     <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="bg-card dark:bg-card p-3 md:p-5 border-b border-border/50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-sm">
                           <CategoryTabs
                              categories={currentCategories}
                              activeCategory={activeCategory}
                              onSetCategory={setActiveCategory}
                              isTouchMode={isTouchMode}
                              lang={lang}
                              t={t}
                           />
                           <div className="relative w-full sm:w-64 xl:w-80">
                              <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isTouchMode ? 'w-6 h-6' : 'w-3.5 h-3.5 md:w-4 md:h-4'} ${lang === 'ar' ? 'right-4' : 'left-4'} `} />
                              <input
                                 ref={searchInputRef}
                                 type="text"
                                 placeholder={t.search_placeholder}
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                                 className={`w-full ${isTouchMode ? 'py-4 text-lg pr-12 pl-12' : 'py-2 md:py-3 text-sm pr-10 md:pr-12 pl-4 text-right'} bg-elevated dark:bg-elevated/50 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-primary font-bold ${lang === 'ar' ? 'text-right' : 'text-left'} `}
                              />
                           </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                           <ItemGrid
                              items={filteredItems}
                              onAddItem={handleAddItem}
                              currencySymbol={currencySymbol}
                              isTouchMode={isTouchMode}
                           />
                        </div>
                     </div>

                     {/* Cart Sidebar */}
                     <div className={`
                     fixed lg:relative inset-y-0 w-[85%] sm:w-[400px] xl:w-[480px] bg-card dark:bg-card flex flex-col h-full shadow-2xl z-40 transition-transform duration-300
                     ${lang === 'ar' ? 'border-r left-0' : 'border-l right-0'} border-slate-200 dark:border-slate-800
                     ${activeCart.length > 0 || selectedTableId ? 'translate-x-0' : (lang === 'ar' ? '-translate-x-full' : 'translate-x-full')} lg:translate-x-0
                  `}>
                        <div className="p-4 md:p-8 border-b border-slate-200 dark:border-slate-800 bg-elevated dark:bg-elevated/50 flex justify-between items-center shrink-0">
                           <div className="min-w-0">
                              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                 {activeOrderType === OrderType.DINE_IN ? t.dine_in : (activeOrderType === OrderType.DELIVERY ? t.delivery : t.takeaway)}
                              </h2>
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5 md:mt-1 truncate">
                                 {activeOrderType === OrderType.DINE_IN ? `${t.table} ${selectedTableId}` : (activeOrderType === OrderType.DELIVERY ? deliveryCustomer?.name : t.quick_order)}
                              </p>
                           </div>
                           <button onClick={() => { if (activeOrderType === OrderType.DINE_IN) setSelectedTableId(null); }} className="p-2 md:p-3 text-muted hover:text-primary transition-all bg-card dark:bg-elevated rounded-full shadow-sm flex-shrink-0">
                              <X size={20} className="md:w-6 md:h-6" />
                           </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                           {activeCart.map(item => (
                              <CartItem
                                 key={item.cartId}
                                 item={item}
                                 currencySymbol={currencySymbol}
                                 isTouchMode={isTouchMode}
                                 onEditNote={(id, note) => { setEditingItemId(id); setNoteInput(note); }}
                                 onUpdateQuantity={handleUpdateQuantity}
                                 onRemove={(id) => removeFromCart(id)}
                              />
                           ))}
                           {activeCart.length === 0 && (
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
                           onSubmit={handleSubmitOrder}
                           onQuickPay={handleQuickPay}
                           canSubmit={activeCart.length > 0}
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
                  onEditOrder={() => {
                     loadTableOrder(managedTableId);
                     setSelectedTableId(managedTableId);
                     setManagedTableId(null);
                     setShowMap(false);
                  }}
                  onTransferTable={(targetId) => {
                     transferTable(managedTableId, targetId);
                     setManagedTableId(null);
                  }}
                  onTransferItems={(targetId, itemIds) => {
                     transferItems(managedTableId, targetId, itemIds);
                     setManagedTableId(null);
                  }}
                  onSplitTable={(targetId, itemIds) => {
                     splitTable(managedTableId, targetId, itemIds);
                     setManagedTableId(null);
                  }}
               />
            )}
         </div>
      </div>
   );
};

export default POS;
