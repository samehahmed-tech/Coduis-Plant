
import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { OrderStatus, AuditEventType } from '../types';
import { useOrderStore } from '../stores/useOrderStore';
import { eventBus } from '../services/eventBus';
import { useAuthStore } from '../stores/useAuthStore';
import { translations } from '../services/translations';

const KDS: React.FC = () => {
  const { orders, updateOrderStatus, fetchOrders } = useOrderStore();
  const { settings } = useAuthStore();
  const t = translations[settings.language || 'en'];

  const [lastOrderTime, setLastOrderTime] = React.useState<number>(Date.now());
  const [isFlashing, setIsFlashing] = React.useState(false);

  React.useEffect(() => {
    fetchOrders(); // Initial fetch

    // Listen for new orders via EventBus
    const unsubscribe = eventBus.on(AuditEventType.POS_ORDER_PLACEMENT, () => {
      fetchOrders();
      setLastOrderTime(Date.now());
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 3000);

      // Play a subtle notification sound if possible
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play();
      } catch (e) {
        // Ignore if sound fails
      }
    });

    return () => unsubscribe();
  }, [fetchOrders]);

  const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case OrderStatus.READY: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  const getHeaderColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-50/50 dark:bg-yellow-900/20';
      case OrderStatus.PREPARING: return 'bg-blue-50/50 dark:bg-blue-900/20';
      case OrderStatus.READY: return 'bg-green-50/50 dark:bg-green-900/20';
      default: return 'bg-slate-50 dark:bg-slate-800';
    }
  }

  return (
    <div className="p-8 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-24">
      <div className={`flex justify-between items-center mb-8 p-6 rounded-[2rem] transition-all duration-700 ${isFlashing ? 'bg-indigo-600 shadow-2xl shadow-indigo-600/40' : 'bg-transparent'}`}>
        <div>
          <h2 className={`text-3xl font-black uppercase tracking-tight transition-colors ${isFlashing ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
            {isFlashing ? '🚨 NEW ORDER RECEIVED 🚨' : 'Kitchen Module'}
          </h2>
          <p className={`font-semibold text-sm transition-colors ${isFlashing ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
            {isFlashing ? 'Immediate attention required for incoming ticket.' : 'Real-time order tracking and kitchen efficiency.'}
          </p>
        </div>
        <div className={`text-sm font-black px-6 py-2.5 rounded-2xl shadow-sm border uppercase tracking-widest transition-all ${isFlashing ? 'bg-white text-indigo-600 border-white scale-110' : 'bg-white dark:bg-slate-900 text-indigo-600 border-slate-200 dark:border-slate-800'}`}>
          {activeOrders.length} Active Tickets
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeOrders.map(order => (
          <div key={order.id} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-fade-in transition-colors">
            {/* Ticket Header */}
            <div className={`p-6 border-b dark:border-slate-800 flex justify-between items-center ${getHeaderColor(order.status)}`}>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block mb-1 tracking-widest">Order ID</span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-100">#{order.id}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block mb-1 tracking-widest">Table / Mode</span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-100">{order.tableId || order.type}</span>
              </div>
            </div>

            {/* Timer Strip */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-black py-2 px-6 flex items-center justify-between uppercase tracking-widest">
              <span className="flex items-center gap-1 opacity-80">
                <Clock size={12} />
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="font-bold">
                {Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000)} MINS ELAPSED
              </span>
            </div>

            {/* Items List */}
            <div className="p-6 flex-1">
              <ul className="space-y-4">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex gap-4 text-slate-700 dark:text-slate-300">
                    <span className="font-black w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                      {item.quantity}
                    </span>
                    <div className="flex-1">
                      <span className="font-bold text-sm uppercase leading-snug">{item.name}</span>
                      {item.notes && <p className="text-[10px] text-rose-500 font-bold mt-1 italic">Note: {item.notes}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 grid gap-3">
              <div className={`text-center py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(order.status)}`}>
                {order.status}
              </div>

              {order.status === OrderStatus.PENDING && (
                <button
                  onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARING)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Start Preparation
                </button>
              )}

              {order.status === OrderStatus.PREPARING && (
                <button
                  onClick={() => updateOrderStatus(order.id, OrderStatus.READY)}
                  className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle size={18} />
                  Mark as Ready
                </button>
              )}

              {order.status === OrderStatus.READY && (
                <button
                  onClick={() => updateOrderStatus(order.id, OrderStatus.DELIVERED)}
                  className="w-full py-3 bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-900 transition-all shadow-lg"
                >
                  Complete Order
                </button>
              )}
            </div>
          </div>
        ))}

        {activeOrders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center h-96 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white dark:bg-slate-900/50">
            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
              <Clock size={40} className="opacity-20" />
            </div>
            <p className="text-xl font-black uppercase tracking-tighter">Kitchen is Quiet</p>
            <p className="text-sm font-bold opacity-60 mt-1">All orders have been dispatched.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KDS;