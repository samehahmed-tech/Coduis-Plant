import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface KDSProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const KDS: React.FC<KDSProps> = ({ orders, onUpdateStatus }) => {
  const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);

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
    <div className="p-8 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Kitchen Display System</h2>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
          {activeOrders.length} Active Orders
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeOrders.map(order => (
          <div key={order.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-fade-in transition-colors">
            {/* Ticket Header */}
            <div className={`p-4 border-b dark:border-slate-800 flex justify-between items-center ${getHeaderColor(order.status)}`}>
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Order ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">#{order.id}</span>
              </div>
              <div className="text-right">
                 <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Table</span>
                 <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{order.tableId}</span>
              </div>
            </div>
            
            {/* Timer Strip */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white text-xs py-1 px-4 flex items-center justify-between">
               <span className="flex items-center gap-1 opacity-80">
                 <Clock size={12} />
                 {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </span>
               <span className="font-bold tracking-wider">
                 {Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000)} MIN AGO
               </span>
            </div>

            {/* Items List */}
            <div className="p-4 flex-1">
              <ul className="space-y-3">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-slate-700 dark:text-slate-300">
                    <span className="font-bold w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded text-sm shrink-0">
                      {item.quantity}
                    </span>
                    <span className="font-medium leading-snug">{item.name}</span>
                  </li>
                ))}
              </ul>
              {order.notes && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded border border-red-100 dark:border-red-900/30">
                  <span className="font-bold">Note:</span> {order.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 grid gap-2">
              <div className={`text-center py-1 px-3 rounded-full text-xs font-bold uppercase border ${getStatusColor(order.status)} mb-2`}>
                {order.status}
              </div>
              
              {order.status === OrderStatus.PENDING && (
                <button 
                  onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Start Cooking
                </button>
              )}
              
              {order.status === OrderStatus.PREPARING && (
                <button 
                  onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
                  className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Mark Ready
                </button>
              )}
              
              {order.status === OrderStatus.READY && (
                <button 
                  onClick={() => onUpdateStatus(order.id, OrderStatus.DELIVERED)}
                  className="w-full py-2 bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-medium hover:bg-slate-900 transition-colors"
                >
                  Complete Order
                </button>
              )}
            </div>
          </div>
        ))}

        {activeOrders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
             <ChefHat size={48} className="mb-4 opacity-50" />
             <p className="text-lg">All caught up! No active orders.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for empty state
const ChefHat = ({size, className}: {size: number, className?: string}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
    <line x1="6" y1="17" x2="18" y2="17"/>
  </svg>
);

export default KDS;