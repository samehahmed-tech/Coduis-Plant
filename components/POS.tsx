import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
   Search, Plus, Minus, ShoppingBag,
   Trash2, CreditCard, Banknote, X, ChevronRight,
   Trash, Wallet, Smartphone, Landmark, Calculator, AlertCircle, RefreshCcw,
   Percent, Ban
} from 'lucide-react';
import { MenuItem, Order, OrderItem, OrderStatus, Table, TableStatus, PaymentMethod, OrderType, Customer, PaymentRecord, RestaurantMenu, MenuCategory, AppPermission } from '../types';
import TableMap from './TableMap';

// Static constants removed to support dynamic menus from props

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
}

const POS: React.FC<POSProps> = ({
   onPlaceOrder, customers, menus, categories,
   currencySymbol, setGlobalCurrency, t, lang,
   isDarkMode, tables, isSidebarCollapsed = false,
   branchId, hasPermission, activeMode = OrderType.DINE_IN
}) => {
   // Internal state for sub-views
   const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
   const [deliveryCustomer, setDeliveryCustomer] = useState<Customer | null>(null);

   // View Logic:
   // DINE_IN -> TableMap (unless table selected)
   // DELIVERY -> CustomerSelect (unless customer selected)
   // TAKEAWAY -> Menu directly

   const showMap = activeMode === OrderType.DINE_IN && !selectedTableId;
   const showCustomerSelect = activeMode === OrderType.DELIVERY && !deliveryCustomer;

   const [selectedCustomerForDelivery, setSelectedCustomerForDelivery] = useState<Customer | null>(null);

   const [cart, setCart] = useState<OrderItem[]>([]);
   const [activeCategory, setActiveCategory] = useState('All');
   const [searchQuery, setSearchQuery] = useState('');

   // Note Modal State
   const [editingItemId, setEditingItemId] = useState<string | null>(null);
   const [noteInput, setNoteInput] = useState('');

   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
   const [splitPayments, setSplitPayments] = useState<PaymentRecord[]>([]);
   const [showSplitModal, setShowSplitModal] = useState(false);
   const searchInputRef = useRef<HTMLInputElement>(null);

   const [activeMenuId, setActiveMenuId] = useState((menus || []).find(m => m.isDefault)?.id || (menus || [])[0]?.id);

   const currentMenu = (menus || []).find(m => m.id === activeMenuId);
   const currentCategories = (categories || []).filter(cat => cat.menuIds.includes(activeMenuId || ''));
   const dynamicCategories = ['All', ...currentCategories.map(c => c.name)];

   // Keyboard Shortcuts
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         const isInput = (e.target as HTMLElement).tagName === 'INPUT';
         if (e.key === 'Escape') {
            if (showSplitModal) setShowSplitModal(false);
            else if (viewMode === 'ORDER') setViewMode('MAP');
         }
         if (isInput && e.key !== 'Enter' && e.key !== 'Escape') return;

         if (!isInput && e.key >= '1' && e.key <= '9') {
            const catIndex = parseInt(e.key) - 1;
            if (catIndex < dynamicCategories.length) {
               setActiveCategory(dynamicCategories[catIndex]);
            }
         }
         if (e.key === '/' && !isInput) {
            e.preventDefault();
            searchInputRef.current?.focus();
         }
         if (e.key === 'Enter' && cart.length > 0 && !showSplitModal) {
            if (isInput) (e.target as HTMLElement).blur();
            handleSubmitOrder();
         }
         if (e.key === 'Delete' && cart.length > 0 && !isInput) {
            handleVoidOrder();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [cart, showMap, showSplitModal, lang, dynamicCategories, activeMode]);

   const cartTotal = cart.reduce((acc, item) => {
      const modsPrice = item.selectedModifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
      return acc + ((item.price + modsPrice) * item.quantity);
   }, 0) * 1.1;

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
         setSelectedCustomerForDelivery(null);
         setDeliveryCustomer(null);
         setSplitPayments([]);
         setPaymentMethod(PaymentMethod.CASH);
         setSelectedTableId(null);
      }
   };

   const addSplitEntry = (method: PaymentMethod) => {
      const currentSplitSum = splitPayments.reduce((s, p) => s + p.amount, 0);
      const remaining = Math.max(0, cartTotal - currentSplitSum);
      if (remaining <= 0) return;
      setSplitPayments(prev => [...prev, { method, amount: remaining }]);
   };

   // Added missing removeSplitEntry function to handle deletion of specific payment records in the split bill modal
   const removeSplitEntry = (idx: number) => {
      setSplitPayments(prev => prev.filter((_, i) => i !== idx));
   };

   const updateSplitAmount = (idx: number, val: number) => {
      setSplitPayments(prev => prev.map((p, i) => i === idx ? { ...p, amount: val } : p));
   };

   const filteredItems = useMemo(() => {
      const allItems = currentCategories.flatMap(c => c.items);
      return allItems.filter(item =>
         (activeCategory === 'All' || item.category === activeCategory) &&
         (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
   }, [currentCategories, activeCategory, searchQuery]);

   return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
         {/* POS Top Header - Responsive */}
         <div className={`fixed top-0 h-14 md:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 md:px-6 z-20 ${lang === 'ar'
            ? (isSidebarCollapsed ? 'lg:right-16' : 'lg:right-56 xl:right-64')
            : (isSidebarCollapsed ? 'lg:left-16' : 'lg:left-56 xl:left-64')
            } right-0 left-0 transition-all duration-300`}>

            <div className="flex items-center gap-4">
               {activeMode === OrderType.DINE_IN && (
                  <div className="flex items-center gap-2">
                     <span className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                        {lang === 'ar' ? 'الصالة' : 'DINE IN'}
                     </span>
                     {selectedTableId ? (
                        <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black flex items-center gap-2">
                           TABLE {selectedTableId}
                           <button onClick={() => setSelectedTableId(null)} className="hover:text-red-600"><X size={12} /></button>
                        </div>
                     ) : (
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Select Table</span>
                     )}
                  </div>
               )}

               {activeMode === OrderType.TAKEAWAY && (
                  <span className="text-xl font-black text-emerald-600 uppercase tracking-tighter flex items-center gap-2">
                     <ShoppingBag size={24} />
                     {lang === 'ar' ? 'سفري / تيك أواي' : 'TAKE AWAY'}
                  </span>
               )}

               {activeMode === OrderType.DELIVERY && (
                  <div className="flex items-center gap-3">
                     <span className="text-xl font-black text-orange-600 uppercase tracking-tighter flex items-center gap-2">
                        <Building2 size={24} />
                        {lang === 'ar' ? 'توصيل' : 'DELIVERY'}
                     </span>
                     {deliveryCustomer ? (
                        <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs font-black flex items-center gap-2">
                           {deliveryCustomer.name}
                           <button onClick={() => setDeliveryCustomer(null)} className="hover:text-red-600"><X size={12} /></button>
                        </div>
                     ) : (
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Select Customer</span>
                     )}
                  </div>
               )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
                  {lang === 'ar' ? 'الموظف: أدمن' : 'User: Admin'}
               </span>
               <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">A</div>
            </div>
         </div >

         {/* Edit Note Modal */}
         {
            editingItemId && (
               <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-4 shadow-2xl animate-in zoom-in-95">
                     <h3 className="text-sm font-black uppercase tracking-widest mb-3">Add Note</h3>
                     <textarea
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold min-h-[100px] outline-none focus:ring-2 ring-indigo-500"
                        placeholder="e.g. No Onions, Extra Sauce..."
                        value={noteInput}
                        onChange={e => setNoteInput(e.target.value)}
                        autoFocus
                     />
                     <div className="grid grid-cols-2 gap-2 mt-4">
                        <button onClick={() => setEditingItemId(null)} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs uppercase">Cancel</button>
                        <button onClick={() => {
                           setCart(prev => prev.map(i => i.cartId === editingItemId ? { ...i, notes: noteInput } : i));
                           setEditingItemId(null);
                        }} className="p-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase">Save Note</button>
                     </div>
                  </div>
               </div>
            )
         }

         <div className="flex-1 mt-14 md:mt-16 flex overflow-hidden relative">
            {showMap ? (
               <div className="flex-1 p-4 md:p-6 lg:p-10 bg-slate-100 dark:bg-slate-950 overflow-y-auto">
                  <TableMap
                     tables={tables}
                     onSelectTable={(table) => {
                        setSelectedTableId(table.id);
                        setCart([]);
                     }}
                     lang={lang}
                     t={t}
                     isDarkMode={false}
                  />
               </div>
            ) : showCustomerSelect ? (
               <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-10">
                  <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl text-center">
                     <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users size={32} />
                     </div>
                     <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Select Customer</h2>
                     <p className="text-slate-400 text-sm mb-8">Delivery orders require a customer.</p>

                     <div className="space-y-3">
                        {/* Mock Customer List for Demo */}
                        {customers.length > 0 ? customers.map(c => (
                           <button key={c.id} onClick={() => setDeliveryCustomer(c)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 flex items-center justify-between group transition-colors">
                              <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600">{c.name}</span>
                              <span className="text-xs text-slate-400">{c.phone}</span>
                           </button>
                        )) : (
                           <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase">No Customers Found</div>
                        )}

                        <button className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors">
                           + Create New Guest
                        </button>
                     </div>
                  </div>
               </div>
            ) : (
               <>
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                     <div className="bg-white dark:bg-slate-900 p-3 md:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-sm">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                           {dynamicCategories.map(cat => (
                              <button
                                 key={cat}
                                 onClick={() => setActiveCategory(cat)}
                                 className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black whitespace-nowrap transition-all uppercase tracking-wider ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'} `}
                              >
                                 {lang === 'ar' && cat === 'All' ? 'الكل' : cat}
                              </button>
                           ))}
                        </div>
                        <div className="relative w-full sm:w-64 xl:w-80">
                           <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 md:w-4 md:h-4 ${lang === 'ar' ? 'right-4' : 'left-4'} `} />
                           <input
                              ref={searchInputRef}
                              type="text"
                              placeholder={lang === 'ar' ? 'البحث...' : "Search..."}
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className={`w-full py-2 md:py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm ${lang === 'ar' ? 'pr-10 md:pr-12 pl-4 text-right' : 'pl-10 md:pl-12 pr-4'} `}
                           />
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 md:p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
                           {filteredItems.map(item => (
                              <div key={item.id} onClick={() => setCart(prev => [...prev, { ...item, cartId: Math.random().toString(36).substr(2, 9), quantity: 1, selectedModifiers: [] }])} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:shadow-xl hover:border-indigo-400 transition-all group active:scale-95">
                                 <div className="h-24 bg-slate-200 relative overflow-hidden">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                 </div>
                                 <div className="p-3">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{item.name}</h3>
                                    <p className="text-indigo-600 font-black mt-0.5">{currencySymbol}{item.price.toFixed(2)}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className={`
                     fixed lg:relative inset-y-0 right-0 w-[85%] sm:w-[400px] xl:w-[480px] bg-white dark:bg-slate-900 flex flex-col h-full shadow-2xl z-40 transition-transform duration-300
                     ${lang === 'ar' ? 'border-r left-0' : 'border-l right-0'} border-slate-200 dark:border-slate-800
                     ${viewMode === 'ORDER' ? 'translate-x-0' : (lang === 'ar' ? '-translate-x-full' : 'translate-x-full')} lg:translate-x-0
   `}>
                     <div className="p-4 md:p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center shrink-0">
                        <div className="min-w-0">
                           <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{lang === 'ar' ? (activeMode === OrderType.DINE_IN ? 'طلب طاولات' : (activeMode === OrderType.DELIVERY ? 'طلب توصيل' : 'يك أواي')) : `${activeMode} `}</h2>
                           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5 md:mt-1 truncate">{activeMode === OrderType.DINE_IN ? (lang === 'ar' ? `طاولة ${selectedTableId} ` : `Table ${selectedTableId} `) : (activeMode === OrderType.DELIVERY ? deliveryCustomer?.name : 'Quick Order')}</p>
                        </div>
                        <button onClick={() => {
                           if (activeMode === OrderType.DINE_IN) setSelectedTableId(null);
                           // For Delivery/Takeaway, this might just clear cart or do nothing if we want to stay in order mode
                        }} className="p-2 md:p-3 text-slate-400 hover:text-indigo-600 transition-all bg-white dark:bg-slate-800 rounded-full shadow-sm flex-shrink-0">
                           <X size={20} className="md:w-6 md:h-6" />
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {cart.map(item => (
                           <div key={item.cartId} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center shadow-sm animate-in slide-in-from-right-2 transition-all hover:border-indigo-100">
                              <div className="flex-1 min-w-0">
                                 <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{item.name}</h4>
                                 <p className="text-sm font-bold text-indigo-600">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
                                 {item.notes && <p className="text-[10px] text-amber-600 font-bold mt-1">📝 {item.notes}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                 <button
                                    onClick={(e) => { e.stopPropagation(); setEditingItemId(item.cartId); setNoteInput(item.notes || ''); }}
                                    className="w-8 h-8 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-colors flex items-center justify-center mr-1"
                                 >
                                    <span className="text-xs">✏️</span>
                                 </button>
                                 <button
                                    onClick={(e) => { e.stopPropagation(); setCart(prev => prev.map(i => i.cartId === item.cartId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i)); }}
                                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-indigo-100 hover:text-indigo-600 transition-all"
                                 >
                                    <Minus size={14} />
                                 </button>
                                 <span className="w-8 text-center font-black text-slate-800 dark:text-white">{item.quantity}</span>
                                 <button
                                    onClick={(e) => { e.stopPropagation(); setCart(prev => prev.map(i => i.cartId === item.cartId ? { ...i, quantity: i.quantity + 1 } : i)); }}
                                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-indigo-100 hover:text-indigo-600 transition-all"
                                 >
                                    <Plus size={14} />
                                 </button>
                                 <button onClick={() => setCart(prev => prev.filter(i => i.cartId !== item.cartId))} className="w-8 h-8 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center">
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </div>
                        ))}
                        {cart.length === 0 && (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 opacity-30">
                              <ShoppingBag size={60} className="mb-4" />
                              <p className="font-black uppercase tracking-widest">{lang === 'ar' ? 'السلة فارغة' : 'Empty'}</p>
                           </div>
                        )}
                     </div>

                     {/* Payment Controls - Dense & Responsive */}
                     <div className="p-4 md:p-6 xl:p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 space-y-4 md:space-y-6 lg:space-y-8 shrink-0">
                        <div className="space-y-3 md:space-y-4">
                           <h4 className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">{t.payment_method}</h4>
                           <div className="grid grid-cols-5 gap-2 md:gap-3">
                              {[
                                 { id: PaymentMethod.CASH, label: lang === 'ar' ? 'كاش' : 'Cash', icon: Banknote },
                                 { id: PaymentMethod.VISA, label: lang === 'ar' ? 'فيزا' : 'Visa', icon: CreditCard },
                                 { id: PaymentMethod.VODAFONE_CASH, label: lang === 'ar' ? 'فودافون' : 'V-Cash', icon: Smartphone },
                                 { id: PaymentMethod.INSTAPAY, label: lang === 'ar' ? 'إنستا' : 'Insta', icon: Landmark },
                                 { id: PaymentMethod.SPLIT, label: lang === 'ar' ? 'تقسيم' : 'Split', icon: Calculator },
                              ].map(btn => (
                                 <button
                                    key={btn.id}
                                    onClick={() => {
                                       setPaymentMethod(btn.id);
                                       if (btn.id === PaymentMethod.SPLIT) setShowSplitModal(true);
                                    }}
                                    className={`flex flex-col items-center justify-center gap-1.5 md:gap-2.5 py-3 md:py-4 rounded-xl md:rounded-3xl border-2 transition-all active:scale-95 ${paymentMethod === btn.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-indigo-300'} `}
                                 >
                                    <btn.icon size={16} className="md:w-5 md:h-5" />
                                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tight text-center">{btn.label}</span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-1.5 md:space-y-2.5">
                           <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                              <span>{t.subtotal}</span>
                              <span>{currencySymbol}{(cartTotal / 1.1).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                              <span>{t.tax}</span>
                              <span>{currencySymbol}{(cartTotal - (cartTotal / 1.1)).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-xl md:text-2xl xl:text-3xl font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                              <span>{t.total}</span>
                              <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
                           </div>
                        </div>

                        <div className="flex gap-3 md:gap-4">
                           <button onClick={handleVoidOrder} className="flex-1 py-3 md:py-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl md:rounded-[1.5rem] font-black text-[10px] md:text-sm uppercase tracking-wider hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">
                              <Trash size={14} className="md:w-[18px] md:h-[18px]" /> <span className="hidden sm:inline">{t.void}</span>
                           </button>
                           <button onClick={handleSubmitOrder} disabled={cart.length === 0} className="flex-[2] py-3 md:py-5 bg-indigo-600 text-white rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-xl uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all">
                              {t.place_order}
                           </button>
                        </div>
                     </div>
                  </div>
               </>
            )}
         </div>

         {/* SPLIT PAYMENT MODAL */}
         {
            showSplitModal && (
               <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                  <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                     <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl">
                              <Calculator size={28} />
                           </div>
                           <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.split_bill}</h3>
                        </div>
                        <button onClick={() => setShowSplitModal(false)} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                           <X size={28} />
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl flex justify-between items-center border border-indigo-100 dark:border-indigo-800 shadow-sm">
                           <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{lang === 'ar' ? 'إجمالي الفاتورة' : 'Bill Total'}</span>
                           <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300">{currencySymbol}{cartTotal.toFixed(2)}</span>
                        </div>

                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">{lang === 'ar' ? 'دفعات مضافة' : 'Added Payments'}</h4>
                           {splitPayments.map((p, idx) => (
                              <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-4 transition-all hover:border-indigo-100">
                                 <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-indigo-600">
                                    {p.method === PaymentMethod.CASH && <Banknote size={20} />}
                                    {p.method === PaymentMethod.VISA && <CreditCard size={20} />}
                                    {p.method === PaymentMethod.VODAFONE_CASH && <Smartphone size={20} />}
                                    {p.method === PaymentMethod.INSTAPAY && <Landmark size={20} />}
                                 </div>
                                 <span className="flex-1 text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">{p.method.replace('_', ' ')}</span>
                                 <div className="relative w-40">
                                    <span className={`absolute top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold ${lang === 'ar' ? 'left-4' : 'left-3'} `}>{currencySymbol}</span>
                                    <input
                                       type="number"
                                       value={p.amount}
                                       onChange={(e) => updateSplitAmount(idx, parseFloat(e.target.value))}
                                       className={`w-full py-3 rounded-2xl bg-white dark:bg-slate-900 border-none outline-none font-black text-base shadow-sm ${lang === 'ar' ? 'pl-10 pr-4 text-left' : 'pl-8 pr-4 text-right'} `}
                                    />
                                 </div>
                                 <button onClick={() => removeSplitEntry(idx)} className="text-slate-200 hover:text-red-500 transition-all p-2">
                                    <Trash2 size={20} />
                                 </button>
                              </div>
                           ))}
                           {splitPayments.length === 0 && (
                              <p className="text-center text-slate-400 text-sm font-bold py-10 italic">{lang === 'ar' ? 'أضف طرق دفع لتقسيم الفاتورة...' : 'Add payment methods below to split the bill...'}</p>
                           )}
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                           {[
                              { id: PaymentMethod.CASH, icon: Banknote },
                              { id: PaymentMethod.VISA, icon: CreditCard },
                              { id: PaymentMethod.VODAFONE_CASH, icon: Smartphone },
                              { id: PaymentMethod.INSTAPAY, icon: Landmark }
                           ].map(m => (
                              <button key={m.id} onClick={() => addSplitEntry(m.id)} className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                                 <m.icon size={28} />
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-6">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                           <span className="text-slate-500">{t.remaining}</span>
                           <span className={`text-lg ${cartTotal - splitPayments.reduce((s, p) => s + p.amount, 0) > 0.01 ? 'text-red-500' : 'text-green-500'} `}>
                              {currencySymbol}{(cartTotal - splitPayments.reduce((s, p) => s + p.amount, 0)).toFixed(2)}
                           </span>
                        </div>
                        <button
                           onClick={() => {
                              const sum = splitPayments.reduce((s, p) => s + p.amount, 0);
                              if (Math.abs(sum - cartTotal) < 0.01) setShowSplitModal(false);
                              else alert(lang === 'ar' ? 'المجموع غير مطابق!' : "Payment sum doesn't match total!");
                           }}
                           className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/20 transition-all"
                        >
                           {lang === 'ar' ? 'تأكيد التقسيم' : 'Confirm Split'}
                        </button>
                     </div>
                  </div>
               </div>
            )
         }
      </div >
   );
};

export default POS;