
import React from 'react';
import { Clock, CheckCircle, Flame, Filter, Timer, RefreshCw, MonitorPlay, Volume2, VolumeX, Layers, Settings2 } from 'lucide-react';
import { OrderStatus, AuditEventType } from '../types';
import { useOrderStore } from '../stores/useOrderStore';
import { eventBus } from '../services/eventBus';
import { socketService } from '../services/socketService';
import { useAuthStore } from '../stores/useAuthStore';
import { translations } from '../services/translations';
import VirtualList from './common/VirtualList';

const KDS: React.FC = () => {
  const { orders, updateOrderStatus, fetchOrders } = useOrderStore();
  const { settings } = useAuthStore();
  const t = translations[settings.language || 'en'];

  const [lastOrderTime, setLastOrderTime] = React.useState<number>(Date.now());
  const [isFlashing, setIsFlashing] = React.useState(false);
  const [nowTick, setNowTick] = React.useState(Date.now());
  const [activeStatus, setActiveStatus] = React.useState<'ALL' | OrderStatus>('ALL');
  const [sortMode, setSortMode] = React.useState<'OLDEST' | 'NEWEST' | 'PRIORITY'>('PRIORITY');
  const [activeStation, setActiveStation] = React.useState<'ALL' | 'GRILL' | 'BAR' | 'DESSERT' | 'FRYER' | 'SALAD' | 'BAKERY'>('ALL');
  const [soundMode, setSoundMode] = React.useState<'ALL' | 'URGENT' | 'OFF'>('ALL');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const overdueNotifiedRef = React.useRef<Set<string>>(new Set());
  const [isStationSettingsOpen, setIsStationSettingsOpen] = React.useState(false);
  const [stationKeywords, setStationKeywords] = React.useState<Record<string, string>>({
    GRILL: 'grill,bbq,kebab,steak,skewer,chicken,meat',
    BAR: 'coffee,espresso,latte,mocha,tea,juice,soda,drink,bar',
    DESSERT: 'dessert,cake,sweet,icecream,ice,chocolate,pudding',
    FRYER: 'fries,fry,fried,crispy,nugget',
    SALAD: 'salad,green,vegan,bowl',
    BAKERY: 'bread,bakery,pastry,croissant,bun'
  });
  const [stationLock, setStationLock] = React.useState<'ALL' | 'GRILL' | 'BAR' | 'DESSERT' | 'FRYER' | 'SALAD' | 'BAKERY' | null>(null);

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
        if (soundMode === 'ALL') {
          const audio = new Audio('/sounds/notification.mp3');
          audio.play();
        }
      } catch (e) {
        // Ignore if sound fails
      }
    });

    const unsubscribeStatus = eventBus.on(AuditEventType.ORDER_STATUS_CHANGE, () => {
      fetchOrders();
    });

    return () => {
      unsubscribe();
      unsubscribeStatus();
    };
  }, [fetchOrders, soundMode]);

  React.useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const handleOrder = () => fetchOrders();
    socketService.on('order:created', handleOrder);
    socketService.on('order:status', handleOrder);
    return () => {
      socketService.off('order:created', handleOrder);
      socketService.off('order:status', handleOrder);
    };
  }, [fetchOrders]);

  React.useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const normalizeToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const getStationForItem = (item: any) => {
    const name = normalizeToken(item?.name || '');
    const category = normalizeToken(item?.category || '');
    const source = `${name} ${category}`;
    const entries = Object.entries(stationKeywords) as [string, string][];
    for (const [station, list] of entries) {
      const tokens = list.split(',').map(s => s.trim()).filter(Boolean);
      if (tokens.some(token => source.includes(normalizeToken(token)))) {
        return station as any;
      }
    }
    return 'GRILL';
  };

  const activeOrders = React.useMemo(() => {
    const base = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);
    const filteredByStatus = activeStatus === 'ALL' ? base : base.filter(o => o.status === activeStatus);
    const stationToUse = stationLock && stationLock !== 'ALL' ? stationLock : activeStation;
    const filtered = stationToUse === 'ALL'
      ? filteredByStatus
      : filteredByStatus.filter(o => (o.items || []).some((item: any) => getStationForItem(item) === stationToUse));

    const priorityWeight = (status: OrderStatus) => {
      if (status === OrderStatus.PENDING) return 3;
      if (status === OrderStatus.PREPARING) return 2;
      if (status === OrderStatus.READY) return 1;
      return 0;
    };

    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (sortMode === 'NEWEST') return bTime - aTime;
      if (sortMode === 'OLDEST') return aTime - bTime;
      const byPriority = priorityWeight(b.status as OrderStatus) - priorityWeight(a.status as OrderStatus);
      if (byPriority !== 0) return byPriority;
      return aTime - bTime;
    });

    return sorted;
  }, [orders, activeStatus, sortMode, activeStation, stationLock, stationKeywords]);

  const getElapsedMins = (createdAt: any) => Math.floor((nowTick - new Date(createdAt).getTime()) / 60000);

  const getTimerStyle = (elapsedMins: number) => {
    if (elapsedMins >= 20) return 'bg-rose-600 text-white';
    if (elapsedMins >= 12) return 'bg-amber-500 text-white';
    if (elapsedMins >= 7) return 'bg-yellow-500 text-white';
    return 'bg-slate-900 text-white';
  };

  React.useEffect(() => {
    if (soundMode === 'OFF') return;
    const overdue = activeOrders.filter(o => getElapsedMins(o.createdAt) >= 20);
    overdue.forEach(o => {
      if (overdueNotifiedRef.current.has(o.id)) return;
      overdueNotifiedRef.current.add(o.id);
      if (soundMode === 'ALL' || soundMode === 'URGENT') {
        try {
          const audio = new Audio('/sounds/alert.mp3');
          audio.play();
        } catch {
          // ignore
        }
      }
    });
  }, [activeOrders, soundMode, nowTick]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  const groupByStatus = (status: OrderStatus) =>
    activeOrders.filter(o => o.status === status);

  const completeReadyBatch = async () => {
    const readyOrders = groupByStatus(OrderStatus.READY);
    for (const order of readyOrders) {
      await updateOrderStatus(order.id, OrderStatus.DELIVERED);
    }
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('kds_station_keywords');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setStationKeywords(prev => ({ ...prev, ...parsed }));
        }
      } catch {
        // ignore
      }
    }
    const params = new URLSearchParams(window.location.search);
    const stationParam = params.get('station');
    if (stationParam) {
      const normalized = stationParam.toUpperCase();
      if (['GRILL', 'BAR', 'DESSERT', 'FRYER', 'SALAD', 'BAKERY', 'ALL'].includes(normalized)) {
        setStationLock(normalized as any);
        setActiveStation(normalized as any);
      }
    }
  }, []);

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
    <div className="p-8 min-h-screen bg-app transition-colors pb-24">
      <div className={`flex justify-between items-center mb-6 p-6 rounded-[2rem] transition-all duration-700 ${isFlashing ? 'bg-primary shadow-2xl shadow-primary/40' : 'bg-transparent'}`}>
        <div>
          <h2 className={`text-3xl font-black uppercase tracking-tight transition-colors ${isFlashing ? 'text-white' : 'text-main'}`}>
            {isFlashing ? '🚨 NEW ORDER RECEIVED 🚨' : 'Kitchen Module'}
          </h2>
          <p className={`font-semibold text-sm transition-colors ${isFlashing ? 'text-indigo-100' : 'text-muted'}`}>
            {isFlashing ? 'Immediate attention required for incoming ticket.' : 'Real-time order tracking and kitchen efficiency.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isFullscreen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-card border-border/50 text-muted hover:text-primary'}`}
          >
            <MonitorPlay size={14} className="inline mr-2" />
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button
            onClick={() => setIsStationSettingsOpen(true)}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all bg-card border-border/50 text-muted hover:text-primary"
          >
            <Settings2 size={14} className="inline mr-2" />
            Stations
          </button>
          <button
            onClick={() => setSoundMode(soundMode === 'OFF' ? 'ALL' : 'OFF')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${soundMode === 'OFF' ? 'bg-slate-200 text-slate-500 border-slate-200' : 'bg-card border-border/50 text-muted hover:text-primary'}`}
          >
            {soundMode === 'OFF' ? <VolumeX size={14} className="inline mr-2" /> : <Volume2 size={14} className="inline mr-2" />}
            {soundMode === 'OFF' ? 'Muted' : 'Sound'}
          </button>
          <div className={`text-sm font-black px-6 py-2.5 rounded-2xl shadow-sm border uppercase tracking-widest transition-all ${isFlashing ? 'bg-white text-indigo-600 border-white scale-110' : 'bg-card dark:text-primary border-border/50'}`}>
            {activeOrders.length} Active Tickets
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY].map(status => (
            <button
              key={status}
              onClick={() => setActiveStatus(status as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                activeStatus === status ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-card border-border/50 text-muted hover:text-primary'
              }`}
            >
              {status === 'ALL' ? 'All Tickets' : status}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/50 text-[10px] font-black uppercase tracking-widest text-muted">
            <Layers size={14} />
            <span>{stationLock ? 'Station Locked' : 'Station'}</span>
          </div>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'GRILL', label: 'Grill' },
            { id: 'BAR', label: 'Bar' },
            { id: 'DESSERT', label: 'Dessert' },
            { id: 'FRYER', label: 'Fryer' },
            { id: 'SALAD', label: 'Salad' },
            { id: 'BAKERY', label: 'Bakery' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setActiveStation(opt.id as any)}
              disabled={Boolean(stationLock) && stationLock !== opt.id}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                activeStation === opt.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card border-border/50 text-muted hover:text-primary'
              } ${stationLock && stationLock !== opt.id ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/50 text-[10px] font-black uppercase tracking-widest text-muted">
            <Filter size={14} />
            <span>Sort</span>
          </div>
          {[
            { id: 'PRIORITY', label: 'Priority', icon: Flame },
            { id: 'OLDEST', label: 'Oldest', icon: Timer },
            { id: 'NEWEST', label: 'Newest', icon: RefreshCw }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setSortMode(opt.id as any)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                sortMode === opt.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-card border-border/50 text-muted hover:text-primary'
              }`}
            >
              <opt.icon size={12} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {[OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY].map(status => {
          const ordersForStatus = groupByStatus(status);
          return (
          <div key={status} className="bg-white/40 dark:bg-slate-950/30 border border-border/50 rounded-[2rem] p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${status === OrderStatus.PENDING ? 'bg-yellow-400' : status === OrderStatus.PREPARING ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{status}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400">{ordersForStatus.length} Tickets</span>
                {status === OrderStatus.READY && ordersForStatus.length > 0 && (
                  <button
                    onClick={completeReadyBatch}
                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  >
                    Complete All
                  </button>
                )}
              </div>
            </div>
            <div className="h-[70vh] overflow-hidden">
              <VirtualList
                itemCount={ordersForStatus.length}
                itemHeight={420}
                className="h-full no-scrollbar"
                getKey={(index) => ordersForStatus[index]?.id || index}
                renderItem={(index) => {
                  const order = ordersForStatus[index];
                  if (!order) return null;
                  return (
          <div className="bg-card rounded-[2rem] shadow-sm border border-border/50 overflow-hidden flex flex-col animate-fade-in transition-colors">
            {/* Ticket Header */}
            <div className={`p-6 border-b dark:border-slate-800 flex justify-between items-center ${getHeaderColor(order.status)}`}>
              <div>
                <span className="text-[10px] font-black uppercase text-muted block mb-1 tracking-widest">Order ID</span>
                <span className="font-mono font-black text-main font-black">#{order.id}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-muted block mb-1 tracking-widest">Table / Mode</span>
                <span className="font-mono font-black text-main font-black">{order.tableId || order.type}</span>
              </div>
            </div>

            {/* Timer Strip */}
            <div className={`${getTimerStyle(getElapsedMins(order.createdAt))} text-[10px] font-black py-2 px-6 flex items-center justify-between uppercase tracking-widest`}>
              <span className="flex items-center gap-1 opacity-80">
                <Clock size={12} />
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="font-bold">
                {getElapsedMins(order.createdAt)} MINS ELAPSED
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
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {getStationForItem(item)}
                        </span>
                      </div>
                      {item.notes && <p className="text-[10px] text-rose-500 font-bold mt-1 italic">Note: {item.notes}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="p-6 bg-elevated dark:bg-elevated/50 border-t border-border/50 grid gap-3">
              <div className={`text-center py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(order.status)}`}>
                {order.status}
              </div>

              {order.status === OrderStatus.PENDING && (
                <button
                  onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARING)}
                  className="w-full py-3 bg-primary text-white rounded-2xl font-black uppercase text-xs hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
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
                  );
                }}
              />
              {ordersForStatus.length === 0 && (
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                  No tickets
                </div>
              )}
            </div>
          </div>
        );
        })}

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

      {isStationSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Stations Setup</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comma-separated keywords per station</p>
              </div>
              <button onClick={() => setIsStationSettingsOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(stationKeywords).map(([station, value]) => (
                <div key={station} className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{station}</label>
                  <textarea
                    rows={3}
                    value={value}
                    onChange={(e) => setStationKeywords(prev => ({ ...prev, [station]: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-black border border-slate-200 dark:border-slate-700"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Tip: add category names to route items correctly.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsStationSettingsOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 font-black text-[10px] uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('kds_station_keywords', JSON.stringify(stationKeywords));
                    setIsStationSettingsOpen(false);
                  }}
                  className="px-4 py-3 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                >
                  Save Stations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KDS;
