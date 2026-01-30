import React, { useState, useEffect, useRef } from 'react';
import {
   Search, Plus, Minus, ShoppingBag,
   Trash2, CreditCard, Banknote, X, ChevronRight,
   Trash, Wallet, Smartphone, Landmark, Calculator, AlertCircle, RefreshCcw
} from 'lucide-react';
import { MenuItem, Order, OrderItem, OrderStatus, Table, TableStatus, PaymentMethod, OrderType, Customer, PaymentRecord } from '../types';
import TableMap from './TableMap';

const MENU_ITEMS: MenuItem[] = [
   {
      id: '1',
      name: 'Margherita Pizza',
      price: 12.99,
      category: 'Mains',
      isActive: true,
      image: 'https://picsum.photos/200/200?random=1',
      description: 'Classic tomato and mozzarella',
      recipe: [{ inventoryItemId: 'inv3', quantityNeeded: 0.15 }],
      modifierGroups: []
   },
   {
      id: '2',
      name: 'Ribeye Steak',
      price: 24.99,
      category: 'Mains',
      isActive: true,
      image: 'https://picsum.photos/200/200?random=2',
      recipe: [],
      modifierGroups: []
   },
   { id: '3', name: 'Caesar Salad', price: 8.99, category: 'Starters', image: 'https://picsum.photos/200/200?random=3', isActive: true, recipe: [] },
   { id: '4', name: 'Tiramisu', price: 6.99, category: 'Desserts', image: 'https://picsum.photos/200/200?random=4', isActive: true, recipe: [] },
   { id: '5', name: 'Coca Cola', price: 2.50, category: 'Drinks', image: 'https://picsum.photos/200/200?random=5', isActive: true, recipe: [] },
   { id: '6', name: 'Spaghetti Carbonara', price: 15.50, category: 'Mains', image: 'https://picsum.photos/200/200?random=6', isActive: true, recipe: [] },
];

const CATEGORIES = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];

interface POSProps {
   onPlaceOrder: (order: Order) => void;
   customers: Customer[];
   currencySymbol: string;
   setGlobalCurrency: (curr: 'USD' | 'EGP') => void;
   t: any;
   lang: 'en' | 'ar';
   tables: Table[];
}

const POS: React.FC<POSProps> = ({ onPlaceOrder, customers, currencySymbol, setGlobalCurrency, t, lang, tables }) => {
   const [orderType, setOrderType] = useState<OrderType>(OrderType.DINE_IN);
   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
   const [viewMode, setViewMode] = useState<'MAP' | 'ORDER'>('MAP');
   const [cart, setCart] = useState<OrderItem[]>([]);
   const [activeCategory, setActiveCategory] = useState('All');
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
   const [splitPayments, setSplitPayments] = useState<PaymentRecord[]>([]);
   const [showSplitModal, setShowSplitModal] = useState(false);
   const searchInputRef = useRef<HTMLInputElement>(null);

   // Keyboard Shortcuts
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         // Prevent shortcut interference if typing in an input (except for specific navigation)
         const isInput = (e.target as HTMLElement).tagName === 'INPUT';

         if (e.key === 'Escape') {
            if (showSplitModal) setShowSplitModal(false);
            else if (viewMode === 'ORDER') setViewMode('MAP');
         }

         if (isInput && e.key !== 'Enter' && e.key !== 'Escape') return;

         // Category Switching (1-9)
         if (!isInput && e.key >= '1' && e.key <= '9') {
            const catIndex = parseInt(e.key) - 1;
            if (catIndex < CATEGORIES.length) {
               setActiveCategory(CATEGORIES[catIndex]);
            }
         }

         // Search Focus (/)
         if (e.key === '/' && !isInput) {
            e.preventDefault();
            searchInputRef.current?.focus();
         }

         // Checkout (Enter)
         if (e.key === 'Enter' && cart.length > 0 && !showSplitModal) {
            if (isInput) (e.target as HTMLElement).blur();
            handleSubmitOrder();
         }

         // Void (Delete)
         if (e.key === 'Delete' && cart.length > 0 && !isInput) {
            handleVoidOrder();
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [cart, viewMode, showSplitModal, lang]);

   const cartTotal = cart.reduce((acc, item) => {
      const modsPrice = item.selectedModifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
      return acc + (item.price + modsPrice) * item.quantity;
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
         type: orderType,
         tableId: selectedTableId || undefined,
         customerId: selectedCustomer?.id,
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
      setSelectedCustomer(null);
      setSplitPayments([]);
      setPaymentMethod(PaymentMethod.CASH);
      if (orderType === OrderType.DINE_IN) setViewMode('MAP');
   };

   const handleVoidOrder = () => {
      if (cart.length === 0) return;
      if (confirm(t.void_confirm)) {
         setCart([]);
         setSelectedCustomer(null);
         setSplitPayments([]);
         setPaymentMethod(PaymentMethod.CASH);
         if (orderType === OrderType.DINE_IN) setViewMode('MAP');
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

   const filteredItems = MENU_ITEMS.filter(item =>
      (activeCategory === 'All' || item.category === activeCategory) &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
   );

   return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
         <div className={`fixed top-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-6 z-20 ${lang === 'ar' ? 'right-64 left-0' : 'left-64 right-0'}`}>
            <div className="flex items-center gap-4">
               <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                  <button onClick={() => { setOrderType(OrderType.DINE_IN); setViewMode('MAP'); }} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${orderType === OrderType.DINE_IN ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600' : 'text-slate-500'}`}>{lang === 'ar' ? 'طاولات' : 'Dine-in'}</button>
                  <button onClick={() => { setOrderType(OrderType.TAKEAWAY); setViewMode('ORDER'); }} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${orderType === OrderType.TAKEAWAY ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600' : 'text-slate-500'}`}>{lang === 'ar' ? 'سريع' : 'Takeaway'}</button>
               </div>
               <button
                  onClick={() => setGlobalCurrency(currencySymbol === '$' ? 'EGP' : 'USD')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors uppercase tracking-widest"
               >
                  <RefreshCcw size={14} /> {currencySymbol === '$' ? 'Switch to EGP' : 'تغيير إلى USD'}
               </button>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'الموظف: أدمن' : 'User: Admin'}</span>
            </div>
         </div>

         <div className="flex-1 mt-16 flex overflow-hidden">
            {viewMode === 'MAP' ? (
               <div className="flex-1 p-10 bg-slate-100 dark:bg-slate-950 overflow-y-auto">
                  <TableMap
                     tables={tables}
                     onSelectTable={(table) => {
                        setSelectedTableId(table.id);
                        setViewMode('ORDER');
                        setCart([]);
                     }}
                     lang={lang}
                     t={t}
                     isDarkMode={false} // This can be properly passed from props if needed
                  />
               </div>
            ) : (
               <>
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                     <div className="bg-white dark:bg-slate-900 p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[60%]">
                           {CATEGORIES.map(cat => <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>{lang === 'ar' && cat === 'All' ? 'الكل' : cat}</button>)}
                        </div>
                        <div className="relative w-72">
                           <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
                           <input
                              ref={searchInputRef}
                              type="text"
                              placeholder={lang === 'ar' ? 'ابحث في القائمة...' : "Search menu..."}
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className={`w-full py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold ${lang === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'}`}
                           />
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-8">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                           {filteredItems.map(item => (
                              <div key={item.id} onClick={() => setCart(prev => [...prev, { ...item, cartId: Math.random().toString(36).substr(2, 9), quantity: 1, selectedModifiers: [] }])} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:shadow-2xl hover:border-indigo-400 transition-all group active:scale-95">
                                 <div className="h-44 bg-slate-200 relative overflow-hidden">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                 </div>
                                 <div className="p-6">
                                    <h3 className="font-black text-slate-800 dark:text-slate-100 truncate text-lg">{item.name}</h3>
                                    <p className="text-indigo-600 font-black mt-1 text-xl">{currencySymbol}{item.price.toFixed(2)}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Cart Drawer - RTL aware */}
                  <div className={`w-[480px] bg-white dark:bg-slate-900 flex flex-col h-full shadow-2xl z-30 transition-all ${lang === 'ar' ? 'border-r' : 'border-l'} border-slate-200 dark:border-slate-800`}>
                     <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
                        <div>
                           <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{lang === 'ar' ? (orderType === OrderType.DINE_IN ? 'طلب طاولات' : 'طلب سريع') : `${orderType} Order`}</h2>
                           <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-1">{orderType === OrderType.DINE_IN ? (lang === 'ar' ? `طاولة رقم ${selectedTableId}` : `Table ${selectedTableId}`) : (lang === 'ar' ? 'تيك أواي' : 'Fast Checkout')}</p>
                        </div>
                        <button onClick={() => setViewMode('MAP')} className="p-3 text-slate-400 hover:text-indigo-600 transition-all bg-white dark:bg-slate-800 rounded-full shadow-sm">
                           <X size={24} />
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                        {cart.map(item => (
                           <div key={item.cartId} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 flex justify-between items-center shadow-sm animate-in slide-in-from-right-4 transition-all hover:border-indigo-100">
                              <div>
                                 <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg">{item.name}</h4>
                                 <p className="text-sm font-black text-indigo-600">{currencySymbol}{item.price.toFixed(2)}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                 <button onClick={() => setCart(prev => prev.filter(i => i.cartId !== item.cartId))} className="text-slate-200 hover:text-red-500 transition-colors p-2">
                                    <Trash2 size={24} />
                                 </button>
                              </div>
                           </div>
                        ))}
                        {cart.length === 0 && (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400 py-32 opacity-20">
                              <ShoppingBag size={80} className="mb-6" />
                              <p className="font-black uppercase tracking-widest text-lg">{lang === 'ar' ? 'السلة فارغة' : 'Cart is Empty'}</p>
                           </div>
                        )}
                     </div>

                     {/* Payment Controls */}
                     <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 space-y-8">
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">{t.payment_method}</h4>
                           <div className="grid grid-cols-3 gap-3">
                              {[
                                 { id: PaymentMethod.CASH, label: lang === 'ar' ? 'كاش' : 'Cash', icon: Banknote },
                                 { id: PaymentMethod.VISA, label: lang === 'ar' ? 'فيزا' : 'Visa', icon: CreditCard },
                                 { id: PaymentMethod.VODAFONE_CASH, label: lang === 'ar' ? 'فودافون' : 'Vodafone', icon: Smartphone },
                                 { id: PaymentMethod.INSTAPAY, label: lang === 'ar' ? 'إنستاباي' : 'InstaPay', icon: Landmark },
                                 { id: PaymentMethod.SPLIT, label: lang === 'ar' ? 'تقسيم' : 'Split', icon: Calculator },
                              ].map(btn => (
                                 <button
                                    key={btn.id}
                                    onClick={() => {
                                       setPaymentMethod(btn.id);
                                       if (btn.id === PaymentMethod.SPLIT) setShowSplitModal(true);
                                    }}
                                    className={`flex flex-col items-center justify-center gap-2.5 py-4 rounded-3xl border-2 transition-all active:scale-95 ${paymentMethod === btn.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'}`}
                                 >
                                    <btn.icon size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{btn.label}</span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-2.5">
                           <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                              <span>{t.subtotal}</span>
                              <span>{currencySymbol}{(cartTotal / 1.1).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                              <span>{t.tax}</span>
                              <span>{currencySymbol}{(cartTotal - (cartTotal / 1.1)).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-3xl font-black text-slate-900 dark:text-white pt-4">
                              <span>{t.total}</span>
                              <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
                           </div>
                        </div>

                        <div className="flex gap-4">
                           <button onClick={handleVoidOrder} className="flex-1 py-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                              <Trash size={18} /> {t.void}
                           </button>
                           <button onClick={handleSubmitOrder} disabled={cart.length === 0} className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xl uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/20 disabled:opacity-50 transition-all">
                              {t.place_order}
                           </button>
                        </div>
                     </div>
                  </div>
               </>
            )}
         </div>

         {/* SPLIT PAYMENT MODAL */}
         {showSplitModal && (
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
                                 <span className={`absolute top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold ${lang === 'ar' ? 'left-4' : 'left-3'}`}>{currencySymbol}</span>
                                 <input
                                    type="number"
                                    value={p.amount}
                                    onChange={(e) => updateSplitAmount(idx, parseFloat(e.target.value))}
                                    className={`w-full py-3 rounded-2xl bg-white dark:bg-slate-900 border-none outline-none font-black text-base shadow-sm ${lang === 'ar' ? 'pl-10 pr-4 text-left' : 'pl-8 pr-4 text-right'}`}
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
                        <span className={`text-lg ${cartTotal - splitPayments.reduce((s, p) => s + p.amount, 0) > 0.01 ? 'text-red-500' : 'text-green-500'}`}>
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
         )}
      </div>
   );
};

export default POS;