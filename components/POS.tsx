import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ShoppingBag, X } from 'lucide-react';
import {
   Order, OrderItem, OrderStatus, Table, PaymentMethod,
   OrderType, Customer, PaymentRecord, RestaurantMenu,
   MenuCategory, AppPermission
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

interface POSProps {
   onPlaceOrder: (order: Order) => void;
   customers: Customer[];
   menus: RestaurantMenu[];
   categories: MenuCategory[];
   currencySymbol: string;
   setGlobalCurrency: (curr: 'USD' | 'EGP') => void;
   t: any;
   lang: 'en' | 'ar';
   isDarkMode: boolean;
   tables: Table[];
   isSidebarCollapsed?: boolean;
   branchId: string;
   hasPermission: (perm: AppPermission) => boolean;
   activeMode: OrderType;
   isTouchMode: boolean;
   onSetOrderMode: (mode: OrderType) => void;
   onToggleDarkMode: () => void;
   onToggleTouchMode: () => void;
   theme: string;
   onThemeChange: (theme: string) => void;
   discount: number;
   onSetDiscount: (val: number) => void;
   heldOrders: any[];
   onHoldOrder: (order: any) => void;
   onRecallOrder: (index: number) => void;
   recalledOrder?: { cart: any[], tableId?: string, customerId?: string } | null;
   onClearRecalledOrder?: () => void;
}

const POS: React.FC<POSProps> = ({
   onPlaceOrder, customers, menus, categories,
   currencySymbol, t, lang, tables,
   isSidebarCollapsed = false, branchId, activeMode = OrderType.DINE_IN,
   isTouchMode, discount, onSetDiscount, onHoldOrder,
   recalledOrder, onClearRecalledOrder
}) => {
   // --- Internal State ---
   const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
   const [deliveryCustomer, setDeliveryCustomer] = useState<Customer | null>(null);
   const [cart, setCart] = useState<OrderItem[]>([]);
   const [activeCategory, setActiveCategory] = useState('All');
   const [searchQuery, setSearchQuery] = useState('');
   const [editingItemId, setEditingItemId] = useState<string | null>(null);
   const [noteInput, setNoteInput] = useState('');
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
   const [splitPayments, setSplitPayments] = useState<PaymentRecord[]>([]);
   const [showSplitModal, setShowSplitModal] = useState(false);
   const [activeMenuId] = useState((menus || []).find(m => m.isDefault)?.id || (menus || [])[0]?.id);

   const searchInputRef = useRef<HTMLInputElement>(null);

   // --- Derived Data ---
   const currentCategories = (categories || []).filter(cat => cat.menuIds.includes(activeMenuId || ''));
   const dynamicCategories = ['All', ...currentCategories.map(c => c.name)];

   const filteredItems = useMemo(() => {
      const allItems = currentCategories.flatMap(c => c.items);
      return allItems.filter(item =>
         (activeCategory === 'All' || item.category === activeCategory) &&
         (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
   }, [currentCategories, activeCategory, searchQuery]);

   const cartSubtotal = cart.reduce((acc, item) => {
      const modsPrice = item.selectedModifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
      return acc + ((item.price + modsPrice) * item.quantity);
   }, 0);
   const cartAfterDiscount = cartSubtotal * (1 - discount / 100);
   const cartTotal = cartAfterDiscount * 1.1; // 10% tax

   // --- Effects ---
   useEffect(() => {
      if (recalledOrder) {
         setCart(recalledOrder.cart);
         if (recalledOrder.tableId) setSelectedTableId(recalledOrder.tableId);
         if (recalledOrder.customerId) {
            const customer = customers.find(c => c.id === recalledOrder.customerId);
            if (customer) setDeliveryCustomer(customer);
         }
         onClearRecalledOrder?.();
      }
   }, [recalledOrder, customers, onClearRecalledOrder]);

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
               if (cart.length > 0) handleSubmitOrder();
            }
            return;
         }

         if (e.key === 'Escape') {
            if (showSplitModal) setShowSplitModal(false);
            else if (cart.length > 0 || selectedTableId) {
               if (activeMode === OrderType.DINE_IN) setSelectedTableId(null);
               else setCart([]);
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
         if (e.key === 'Enter' && cart.length > 0 && !showSplitModal) handleSubmitOrder();
         if (e.key === 'Delete' && cart.length > 0) handleVoidOrder();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [cart, selectedTableId, showSplitModal, editingItemId, activeMode, dynamicCategories]);

   // --- Handlers ---
   const handleAddItem = (item: any) => {
      setCart(prev => {
         const existingIndex = prev.findIndex(ci =>
            ci.id === item.id && JSON.stringify(ci.selectedModifiers) === JSON.stringify([])
         );
         if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
            return updated;
         }
         return [...prev, { ...item, cartId: Math.random().toString(36).substr(2, 9), quantity: 1, selectedModifiers: [] }];
      });
   };

   const handleUpdateQuantity = (cartId: string, delta: number) => {
      setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
   };

   const handleSubmitOrder = () => {
      if (cart.length === 0) return;
      if (paymentMethod === PaymentMethod.SPLIT) {
         const splitTotal = splitPayments.reduce((sum, p) => sum + p.amount, 0);
         if (Math.abs(splitTotal - cartTotal) > 0.01) {
            alert(lang === 'ar' ? 'مجموع الدفع يجب أن يساوي الإجمالي!' : "Split total must equal order total!");
            return;
         }
      }

      const newOrder: Order = {
         id: Math.random().toString(36).substr(2, 9).toUpperCase(),
         type: activeMode,
         branchId: branchId,
         tableId: selectedTableId || undefined,
         customerId: activeMode === OrderType.DELIVERY ? deliveryCustomer?.id : undefined,
         items: [...cart],
         status: OrderStatus.PENDING,
         subtotal: cartTotal / 1.1,
         tax: cartTotal - (cartTotal / 1.1),
         total: cartTotal,
         createdAt: new Date(),
         paymentMethod: paymentMethod,
         payments: paymentMethod === PaymentMethod.SPLIT ? splitPayments : [{ method: paymentMethod, amount: cartTotal }]
      };

      onPlaceOrder(newOrder);
      setCart([]);
      setDeliveryCustomer(null);
      setSplitPayments([]);
      setPaymentMethod(PaymentMethod.CASH);
      if (activeMode === OrderType.DINE_IN) setSelectedTableId(null);
   };

   const handleVoidOrder = () => {
      if (cart.length === 0) return;
      if (confirm(t.void_confirm)) {
         setCart([]);
         setDeliveryCustomer(null);
         setSplitPayments([]);
         setPaymentMethod(PaymentMethod.CASH);
         setSelectedTableId(null);
      }
   };

   const showMap = activeMode === OrderType.DINE_IN && !selectedTableId;
   const showCustomerSelect = activeMode === OrderType.DELIVERY && !deliveryCustomer;

   return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
         <POSHeader
            activeMode={activeMode}
            lang={lang}
            selectedTableId={selectedTableId}
            onClearTable={() => setSelectedTableId(null)}
            deliveryCustomer={deliveryCustomer}
            onClearCustomer={() => setDeliveryCustomer(null)}
            isSidebarCollapsed={isSidebarCollapsed}
            isTouchMode={isTouchMode}
         />

         <NoteModal
            isOpen={!!editingItemId}
            onClose={() => setEditingItemId(null)}
            note={noteInput}
            onNoteChange={setNoteInput}
            onSave={() => {
               setCart(prev => prev.map(i => i.cartId === editingItemId ? { ...i, notes: noteInput } : i));
               setEditingItemId(null);
            }}
            lang={lang}
         />

         <div className="flex-1 mt-14 md:mt-16 flex overflow-hidden relative">
            {showMap ? (
               <div className="flex-1 p-4 md:p-6 lg:p-10 bg-slate-100 dark:bg-slate-950 overflow-y-auto">
                  <TableMap
                     tables={tables}
                     onSelectTable={(table) => { setSelectedTableId(table.id); setCart([]); }}
                     lang={lang}
                     t={t}
                     isDarkMode={false}
                  />
               </div>
            ) : showCustomerSelect ? (
               <CustomerSelectView
                  customers={customers}
                  onSelectCustomer={setDeliveryCustomer}
                  lang={lang}
               />
            ) : (
               <>
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                     <div className="bg-white dark:bg-slate-900 p-3 md:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-sm">
                        <CategoryTabs
                           categories={dynamicCategories}
                           activeCategory={activeCategory}
                           onSetCategory={setActiveCategory}
                           isTouchMode={isTouchMode}
                           lang={lang}
                        />
                        <div className="relative w-full sm:w-64 xl:w-80">
                           <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isTouchMode ? 'w-6 h-6' : 'w-3.5 h-3.5 md:w-4 md:h-4'} ${lang === 'ar' ? 'right-4' : 'left-4'} `} />
                           <input
                              ref={searchInputRef}
                              type="text"
                              placeholder={lang === 'ar' ? 'البحث...' : "Search..."}
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className={`w-full ${isTouchMode ? 'py-4 text-lg pr-12 pl-12' : 'py-2 md:py-3 text-sm pr-10 md:pr-12 pl-4 text-right'} bg-slate-100 dark:bg-slate-800 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold ${lang === 'ar' ? 'text-right' : 'text-left'} `}
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
                     fixed lg:relative inset-y-0 right-0 w-[85%] sm:w-[400px] xl:w-[480px] bg-white dark:bg-slate-900 flex flex-col h-full shadow-2xl z-40 transition-transform duration-300
                     ${lang === 'ar' ? 'border-r left-0' : 'border-l right-0'} border-slate-200 dark:border-slate-800
                     ${cart.length > 0 || selectedTableId ? 'translate-x-0' : (lang === 'ar' ? '-translate-x-full' : 'translate-x-full')} lg:translate-x-0
                  `}>
                     <div className="p-4 md:p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center shrink-0">
                        <div className="min-w-0">
                           <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                              {lang === 'ar' ? (activeMode === OrderType.DINE_IN ? 'طلب طاولات' : (activeMode === OrderType.DELIVERY ? 'طلب توصيل' : 'تيك أواي')) : `${activeMode} `}
                           </h2>
                           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5 md:mt-1 truncate">
                              {activeMode === OrderType.DINE_IN ? (lang === 'ar' ? `طاولة ${selectedTableId} ` : `Table ${selectedTableId} `) : (activeMode === OrderType.DELIVERY ? deliveryCustomer?.name : 'Quick Order')}
                           </p>
                        </div>
                        <button onClick={() => { if (activeMode === OrderType.DINE_IN) setSelectedTableId(null); }} className="p-2 md:p-3 text-slate-400 hover:text-indigo-600 transition-all bg-white dark:bg-slate-800 rounded-full shadow-sm flex-shrink-0">
                           <X size={20} className="md:w-6 md:h-6" />
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {cart.map(item => (
                           <CartItem
                              key={item.cartId}
                              item={item}
                              currencySymbol={currencySymbol}
                              isTouchMode={isTouchMode}
                              onEditNote={(id, note) => { setEditingItemId(id); setNoteInput(note); }}
                              onUpdateQuantity={handleUpdateQuantity}
                              onRemove={(id) => setCart(prev => prev.filter(i => i.cartId !== id))}
                           />
                        ))}
                        {cart.length === 0 && (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 opacity-30">
                              <ShoppingBag size={60} className="mb-4" />
                              <p className="font-black uppercase tracking-widest">{lang === 'ar' ? 'السلة فارغة' : 'Empty'}</p>
                           </div>
                        )}
                     </div>

                     <PaymentSummary
                        subtotal={cartSubtotal}
                        discount={discount}
                        tax={cartAfterDiscount * 0.1}
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
                        canSubmit={cart.length > 0}
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
      </div >
   );
};

export default POS;
