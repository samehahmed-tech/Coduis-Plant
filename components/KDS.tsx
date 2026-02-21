
import React from 'react';
import { Clock, CheckCircle, Flame, Filter, Timer, RefreshCw, MonitorPlay, Volume2, VolumeX, Layers, Settings2, Zap } from 'lucide-react';
import { OrderStatus, AuditEventType } from '../types';
import { useOrderStore } from '../stores/useOrderStore';
import { eventBus } from '../services/eventBus';
import { socketService } from '../services/socketService';
import { useAuthStore } from '../stores/useAuthStore';
import { translations } from '../services/translations';
import { settingsApi } from '../services/api';

type Station = 'ALL' | 'GRILL' | 'BAR' | 'DESSERT' | 'FRYER' | 'SALAD' | 'BAKERY';

// ── Web Audio Sound Generator (no external files needed) ──
const audioCtxRef = { current: null as AudioContext | null };
const getAudioCtx = () => {
  if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtxRef.current;
};

const playBeep = (frequency: number, duration: number, volume = 0.3) => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* ignore audio errors */ }
};

const playNewOrderSound = () => {
  // Pleasant double-beep
  playBeep(880, 0.15, 0.25);
  setTimeout(() => playBeep(1100, 0.2, 0.3), 180);
};

const playStatusChangeSound = () => {
  // Soft single tone
  playBeep(660, 0.12, 0.15);
};

const playUrgentAlertSound = () => {
  // Urgent triple-beep
  playBeep(1200, 0.12, 0.35);
  setTimeout(() => playBeep(1200, 0.12, 0.35), 200);
  setTimeout(() => playBeep(1500, 0.25, 0.4), 400);
};

const KDS: React.FC = () => {
  const { orders, updateOrderStatus, fetchOrders } = useOrderStore();
  const { settings, printers } = useAuthStore();
  const t = translations[settings.language || 'en'];
  const isArabic = settings.language === 'ar';
  const activeBranchId = settings.activeBranchId;
  const currentUser = settings.currentUser;

  const [lastOrderTime, setLastOrderTime] = React.useState<number>(Date.now());
  const [isFlashing, setIsFlashing] = React.useState(false);
  const [nowTick, setNowTick] = React.useState(Date.now());
  const [activeStatus, setActiveStatus] = React.useState<'ALL' | OrderStatus>('ALL');
  const [sortMode, setSortMode] = React.useState<'OLDEST' | 'NEWEST' | 'PRIORITY'>('PRIORITY');
  const [activeStation, setActiveStation] = React.useState<Station>('ALL');
  const [soundMode, setSoundMode] = React.useState<'ALL' | 'URGENT' | 'OFF'>('ALL');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const overdueNotifiedRef = React.useRef<Set<string>>(new Set());
  const [isStationSettingsOpen, setIsStationSettingsOpen] = React.useState(false);
  const [stationAssignmentsByUser, setStationAssignmentsByUser] = React.useState<Record<string, Station[]>>({});
  const [slaThresholds, setSlaThresholds] = React.useState<{ warning: number; risk: number; critical: number }>({
    warning: 7,
    risk: 12,
    critical: 20,
  });
  const [stationKeywords, setStationKeywords] = React.useState<Record<string, string>>({
    GRILL: 'grill,bbq,kebab,steak,skewer,chicken,meat',
    BAR: 'coffee,espresso,latte,mocha,tea,juice,soda,drink,bar',
    DESSERT: 'dessert,cake,sweet,icecream,ice,chocolate,pudding',
    FRYER: 'fries,fry,fried,crispy,nugget',
    SALAD: 'salad,green,vegan,bowl',
    BAKERY: 'bread,bakery,pastry,croissant,bun'
  });
  const [stationLock, setStationLock] = React.useState<Station | null>(null);
  const [isCompactLayout, setIsCompactLayout] = React.useState(false);
  const [showCompactControls, setShowCompactControls] = React.useState(false);
  const [printerStationMap, setPrinterStationMap] = React.useState<Record<string, Station>>({});
  const branchPrinters = React.useMemo(
    () => (printers || []).filter((p: any) => p.isActive && (!activeBranchId || !p.branchId || p.branchId === activeBranchId)),
    [printers, activeBranchId],
  );

  const allStations = React.useMemo<Station[]>(() => ['ALL', 'GRILL', 'BAR', 'DESSERT', 'FRYER', 'SALAD', 'BAKERY'], []);

  const allowedStations = React.useMemo<Station[]>(() => {
    if (!currentUser) return ['ALL'];
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'BRANCH_MANAGER') return allStations;
    const assigned = stationAssignmentsByUser[currentUser.id];
    if (assigned && assigned.length > 0) return ['ALL', ...assigned.filter(s => s !== 'ALL')];
    if (currentUser.role === 'KITCHEN_STAFF') return ['ALL', 'GRILL'];
    return allStations;
  }, [currentUser, stationAssignmentsByUser, allStations]);

  React.useEffect(() => {
    fetchOrders(activeBranchId ? { branch_id: activeBranchId, limit: 300 } : { limit: 300 }); // Initial fetch

    // Listen for new orders via EventBus
    const unsubscribe = eventBus.on(AuditEventType.POS_ORDER_PLACEMENT, () => {
      fetchOrders(activeBranchId ? { branch_id: activeBranchId, limit: 300 } : { limit: 300 });
      setLastOrderTime(Date.now());
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 3000);

      // Play new order sound
      if (soundMode === 'ALL') {
        playNewOrderSound();
      }
    });

    const unsubscribeStatus = eventBus.on(AuditEventType.ORDER_STATUS_CHANGE, () => {
      fetchOrders(activeBranchId ? { branch_id: activeBranchId, limit: 300 } : { limit: 300 });
      if (soundMode === 'ALL') {
        playStatusChangeSound();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeStatus();
    };
  }, [fetchOrders, soundMode, activeBranchId]);

  React.useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const updateLayoutMode = () => {
      const compact = window.innerWidth <= 1024;
      setIsCompactLayout(compact);
      if (!compact) setShowCompactControls(true);
    };
    updateLayoutMode();
    window.addEventListener('resize', updateLayoutMode);
    return () => window.removeEventListener('resize', updateLayoutMode);
  }, []);

  React.useEffect(() => {
    if (!isCompactLayout) return;
    setShowCompactControls(false);
  }, [isCompactLayout]);

  React.useEffect(() => {
    const handleOrder = () => fetchOrders(activeBranchId ? { branch_id: activeBranchId, limit: 300 } : { limit: 300 });
    socketService.on('order:created', handleOrder);
    socketService.on('order:status', handleOrder);
    return () => {
      socketService.off('order:created', handleOrder);
      socketService.off('order:status', handleOrder);
    };
  }, [fetchOrders, activeBranchId]);

  React.useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const normalizeToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const getStationForItem = (item: any) => {
    const itemPrinters: string[] = Array.isArray(item?.printerIds) ? item.printerIds : [];
    for (const printerId of itemPrinters) {
      const mapped = printerStationMap[printerId];
      if (mapped && mapped !== 'ALL') return mapped;
    }

    const name = normalizeToken(item?.name || '');
    const category = normalizeToken(item?.category || item?.categoryId || '');
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
    const base = orders.filter(o =>
      o.status !== OrderStatus.DELIVERED &&
      o.status !== OrderStatus.CANCELLED &&
      (!activeBranchId || o.branchId === activeBranchId)
    );
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
  }, [orders, activeStatus, sortMode, activeStation, stationLock, stationKeywords, activeBranchId]);

  const getElapsedMins = (createdAt: any) => Math.floor((nowTick - new Date(createdAt).getTime()) / 60000);
  const stationWorkload = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const order of activeOrders) {
      for (const item of order.items || []) {
        const station = getStationForItem(item);
        const qty = Math.max(1, Number(item?.quantity || 1));
        map[station] = (map[station] || 0) + qty;
      }
    }
    return map;
  }, [activeOrders, stationKeywords, printerStationMap]);

  const estimateItemPrepMinutes = (item: any) => {
    const prep = Number(item?.preparationTime || item?.prepTime || item?.prepMinutes || 4);
    const qty = Math.max(1, Number(item?.quantity || 1));
    return Math.max(1, prep) * qty;
  };

  const estimateOrderPrepMinutes = (order: any) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    if (items.length === 0) return 0;
    const baseMinutes = items.reduce((sum: number, item: any) => sum + estimateItemPrepMinutes(item), 0);
    const stations = new Set<string>(items.map((item: any) => String(getStationForItem(item))));
    const avgLoad = stations.size > 0
      ? Array.from(stations).reduce((sum: number, station: string) => sum + (stationWorkload[station] || 0), 0) / stations.size
      : 0;
    const loadFactor = 1 + Math.min(0.6, avgLoad / 30);
    return Math.max(1, Math.round(baseMinutes * loadFactor));
  };
  const stationLoadList = React.useMemo(
    () => (['GRILL', 'BAR', 'DESSERT', 'FRYER', 'SALAD', 'BAKERY'] as const).map((station) => ({
      station,
      load: stationWorkload[station] || 0,
    })),
    [stationWorkload],
  );
  const bottleneckStation = React.useMemo(() => {
    const sorted = [...stationLoadList].sort((a, b) => b.load - a.load);
    return sorted[0] && sorted[0].load > 0 ? sorted[0] : null;
  }, [stationLoadList]);
  const suggestedBatches = React.useMemo(() => {
    const candidates = activeOrders.filter((o) => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING);
    const byStation = new Map<string, any[]>();
    for (const order of candidates) {
      const stations = new Set<string>((order.items || []).map((item: any) => String(getStationForItem(item))));
      for (const station of stations) {
        const arr = byStation.get(station) || [];
        arr.push(order);
        byStation.set(station, arr);
      }
    }

    const suggestions: Array<{ station: string; orderRefs: string[]; totalItems: number }> = [];
    for (const [station, ordersForStation] of byStation.entries()) {
      const sorted = [...ordersForStation].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const batch = sorted.slice(0, 2);
      if (batch.length < 2) continue;
      const totalItems = batch.reduce((sum, order) => sum + (order.items || []).reduce((s: number, item: any) => s + Number(item.quantity || 1), 0), 0);
      suggestions.push({
        station,
        orderRefs: batch.map((order) => formatOrderRef(order)),
        totalItems,
      });
    }
    return suggestions.slice(0, 4);
  }, [activeOrders, stationKeywords, printerStationMap]);

  const getTimerStyle = (elapsedMins: number) => {
    if (elapsedMins >= slaThresholds.critical) return 'bg-rose-600 text-white';
    if (elapsedMins >= slaThresholds.risk) return 'bg-amber-500 text-white';
    if (elapsedMins >= slaThresholds.warning) return 'bg-yellow-500 text-white';
    return 'bg-slate-900 text-white';
  };

  function formatOrderRef(order: any) {
    const numberValue = Number(order?.orderNumber);
    if (Number.isFinite(numberValue) && numberValue > 0) {
      return `#${String(numberValue).padStart(6, '0')}`;
    }
    return `#${order.id}`;
  }

  React.useEffect(() => {
    if (soundMode === 'OFF') return;
    const overdue = activeOrders.filter(o => getElapsedMins(o.createdAt) >= slaThresholds.critical);
    overdue.forEach(o => {
      if (overdueNotifiedRef.current.has(o.id)) return;
      overdueNotifiedRef.current.add(o.id);
      if (soundMode === 'ALL' || soundMode === 'URGENT') {
        playUrgentAlertSound();
      }
    });
  }, [activeOrders, soundMode, nowTick, slaThresholds.critical]);

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

  const getNextStatus = (status: OrderStatus) => {
    if (status === OrderStatus.PENDING) return OrderStatus.PREPARING;
    if (status === OrderStatus.PREPARING) return OrderStatus.READY;
    if (status === OrderStatus.READY) return OrderStatus.DELIVERED;
    return status;
  };

  const advanceOrder = async (order: any) => {
    const next = getNextStatus(order.status);
    if (next !== order.status) {
      await updateOrderStatus(order.id, next);
    }
  };

  const nextPendingOrder = React.useMemo(() => {
    const pending = groupByStatus(OrderStatus.PENDING);
    return [...pending].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
  }, [activeOrders]);

  const nextPreparingOrder = React.useMemo(() => {
    const preparing = groupByStatus(OrderStatus.PREPARING);
    return [...preparing].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
  }, [activeOrders]);

  const nextReadyOrder = React.useMemo(() => {
    const ready = groupByStatus(OrderStatus.READY);
    return [...ready].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
  }, [activeOrders]);

  const completeReadyBatch = async () => {
    const readyOrders = groupByStatus(OrderStatus.READY);
    for (const order of readyOrders) {
      await updateOrderStatus(order.id, OrderStatus.DELIVERED);
    }
  };

  React.useEffect(() => {
    const loadStationSettings = async () => {
      let loadedFromDb = false;
      try {
        const allSettings = await settingsApi.getAll();
        const fromDb = allSettings?.kdsStationKeywords;
        const assignments = allSettings?.kdsStationAssignments;
        const thresholds = allSettings?.kdsSlaThresholds;
        const printerMap = allSettings?.kdsPrinterStationMap;
        loadedFromDb = true;
        if (fromDb && typeof fromDb === 'object') {
          setStationKeywords(prev => ({ ...prev, ...fromDb }));
        }
        if (thresholds && typeof thresholds === 'object') {
          const parsed = {
            warning: Number(thresholds.warning ?? 7),
            risk: Number(thresholds.risk ?? 12),
            critical: Number(thresholds.critical ?? 20),
          };
          if (parsed.warning > 0 && parsed.risk > parsed.warning && parsed.critical > parsed.risk) {
            setSlaThresholds(parsed);
          }
        }
        if (assignments && typeof assignments === 'object') {
          const forBranch = activeBranchId ? assignments[activeBranchId] : assignments;
          if (forBranch && typeof forBranch === 'object') {
            setStationAssignmentsByUser(forBranch as Record<string, Station[]>);
          }
        }
        if (printerMap && typeof printerMap === 'object') {
          const branchMap = activeBranchId ? printerMap[activeBranchId] : printerMap;
          if (branchMap && typeof branchMap === 'object') {
            setPrinterStationMap(branchMap as Record<string, Station>);
          }
        }
      } catch {
        // keep defaults when backend settings are unavailable
      }
    };

    loadStationSettings();

    const params = new URLSearchParams(window.location.search);
    const stationParam = params.get('station');
    if (stationParam) {
      const normalized = stationParam.toUpperCase();
      if (['GRILL', 'BAR', 'DESSERT', 'FRYER', 'SALAD', 'BAKERY', 'ALL'].includes(normalized)) {
        setStationLock(normalized as any);
        setActiveStation(normalized as any);
      }
    }
  }, [activeBranchId]);

  React.useEffect(() => {
    if (allowedStations.includes(activeStation)) return;
    setActiveStation(allowedStations[0] || 'ALL');
  }, [allowedStations, activeStation]);

  React.useEffect(() => {
    if (!stationLock) return;
    if (!allowedStations.includes(stationLock)) {
      setStationLock(null);
    }
  }, [stationLock, allowedStations]);

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
    <div className="p-3 md:p-5 xl:p-8 min-h-screen bg-app transition-colors pb-24">
      <div className={`sticky top-2 z-20 backdrop-blur-md flex justify-between items-center mb-4 md:mb-6 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] transition-all duration-700 ${isFlashing ? 'bg-primary shadow-2xl shadow-primary/40' : 'bg-card/90 border border-border/40'}`}>
        <div>
          <h2 className={`text-xl md:text-3xl font-black uppercase tracking-tight transition-colors ${isFlashing ? 'text-white' : 'text-main'}`}>
            {isFlashing ? (isArabic ? 'طلب جديد وصل' : 'New Order Received') : (isArabic ? 'شاشة المطبخ' : 'Kitchen Module')}
          </h2>
          <p className={`font-semibold text-xs md:text-sm transition-colors ${isFlashing ? 'text-indigo-100' : 'text-muted'}`}>
            {isFlashing ? 'Immediate attention required for incoming ticket.' : 'Real-time order tracking and kitchen efficiency.'}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleFullscreen}
            className={`px-3 md:px-4 py-2.5 min-h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isFullscreen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-card border-border/50 text-muted hover:text-primary'}`}
          >
            <MonitorPlay size={14} className="inline mr-2" />
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button
            onClick={() => setIsStationSettingsOpen(true)}
            className="hidden md:inline-flex px-4 py-2.5 min-h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all bg-card border-border/50 text-muted hover:text-primary"
          >
            <Settings2 size={14} className="inline mr-2" />
            Stations
          </button>
          <button
            onClick={() => setSoundMode(soundMode === 'OFF' ? 'ALL' : 'OFF')}
            className={`px-3 md:px-4 py-2.5 min-h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${soundMode === 'OFF' ? 'bg-slate-200 text-slate-500 border-slate-200' : 'bg-card border-border/50 text-muted hover:text-primary'}`}
          >
            {soundMode === 'OFF' ? <VolumeX size={14} className="inline mr-2" /> : <Volume2 size={14} className="inline mr-2" />}
            {soundMode === 'OFF' ? 'Muted' : 'Sound'}
          </button>
          <div className={`text-xs md:text-sm font-black px-3 md:px-6 py-2.5 rounded-2xl shadow-sm border uppercase tracking-widest transition-all ${isFlashing ? 'bg-white text-indigo-600 border-white scale-110' : 'bg-card dark:text-primary border-border/50'}`}>
            {activeOrders.length} Active Tickets
          </div>
        </div>
      </div>

      <div className="mb-4 md:mb-5 grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <button
          disabled={!nextPendingOrder}
          onClick={() => nextPendingOrder && advanceOrder(nextPendingOrder)}
          className="min-h-12 px-4 rounded-2xl bg-amber-500 text-white disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Zap size={14} />
          {isArabic ? 'ابدأ أقدم طلب' : 'Start Oldest Pending'}
        </button>
        <button
          disabled={!nextPreparingOrder}
          onClick={() => nextPreparingOrder && advanceOrder(nextPreparingOrder)}
          className="min-h-12 px-4 rounded-2xl bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Zap size={14} />
          {isArabic ? 'حوّل أقدم تجهيز إلى جاهز' : 'Ready Oldest Preparing'}
        </button>
        <button
          disabled={!nextReadyOrder}
          onClick={() => nextReadyOrder && advanceOrder(nextReadyOrder)}
          className="min-h-12 px-4 rounded-2xl bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Zap size={14} />
          {isArabic ? 'سلّم أقدم طلب جاهز' : 'Deliver Oldest Ready'}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY].map(status => (
            <button
              key={status}
              onClick={() => setActiveStatus(status as any)}
              className={`px-4 py-2.5 min-h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeStatus === status ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-card border-border/50 text-muted hover:text-primary'
                }`}
            >
              {status === 'ALL' ? 'All Tickets' : status}
            </button>
          ))}
        </div>
        {isCompactLayout && (
          <button
            onClick={() => setShowCompactControls(prev => !prev)}
            className="px-3 py-2.5 min-h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all bg-card border-border/50 text-muted hover:text-primary"
          >
            {showCompactControls ? (isArabic ? 'إخفاء التحكم' : 'Hide Controls') : (isArabic ? 'إظهار التحكم' : 'Show Controls')}
          </button>
        )}
        {(!isCompactLayout || showCompactControls) && (
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
                disabled={(Boolean(stationLock) && stationLock !== opt.id) || !allowedStations.includes(opt.id as Station)}
                className={`px-3 py-2.5 min-h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeStation === opt.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card border-border/50 text-muted hover:text-primary'
                  } ${(stationLock && stationLock !== opt.id) || !allowedStations.includes(opt.id as Station) ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {!isCompactLayout && (
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
                className={`px-3 py-2.5 min-h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${sortMode === opt.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-card border-border/50 text-muted hover:text-primary'
                  }`}
              >
                <opt.icon size={12} />
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="col-span-full bg-white/50 dark:bg-slate-900/30 border border-border/50 rounded-2xl p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-2">
            {stationLoadList.map((item) => {
              const isBottleneck = bottleneckStation?.station === item.station && item.load >= 8;
              return (
                <div
                  key={`load-${item.station}`}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isBottleneck
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/40'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                >
                  {item.station}: {item.load}
                </div>
              );
            })}
            {bottleneckStation && bottleneckStation.load >= 8 && (
              <div className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white">
                {isArabic
                  ? `عنق زجاجة: ${bottleneckStation.station}`
                  : `Bottleneck: ${bottleneckStation.station}`}
              </div>
            )}
            {suggestedBatches.map((batch, idx) => (
              <div
                key={`batch-${batch.station}-${idx}`}
                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/40"
              >
                {isArabic
                  ? `اقتراح دفعة ${batch.station}: ${batch.orderRefs.join(' + ')}`
                  : `Batch ${batch.station}: ${batch.orderRefs.join(' + ')}`}
              </div>
            ))}
          </div>
        </div>
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
              <div className="h-[62vh] md:h-[66vh] xl:h-[72vh] overflow-hidden">
                <div className="h-full no-scrollbar overflow-y-auto pr-1 space-y-4">
                  {ordersForStatus.map((order) => (
                    <div key={order.id} className="bg-card rounded-[2rem] shadow-sm border border-border/50 overflow-hidden flex flex-col animate-fade-in transition-colors">
                      {/* Ticket Header */}
                      <div className={`p-6 border-b dark:border-slate-800 flex justify-between items-center ${getHeaderColor(order.status)}`}>
                        <div>
                          <span className="text-[10px] font-black uppercase text-muted block mb-1 tracking-widest">Order</span>
                          <span className="font-mono font-black text-main text-lg">{formatOrderRef(order)}</span>
                          {order.id && (
                            <p className="text-[10px] text-muted mt-1 font-bold">ID: {order.id}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-muted block mb-1 tracking-widest">Table / Mode</span>
                          <span className="font-mono font-black text-main">{order.tableId || order.type}</span>
                          {order.customerName && (
                            <p className="text-[10px] text-muted mt-1 font-bold">{order.customerName}</p>
                          )}
                          <p className="text-[10px] font-black mt-1 text-indigo-600 dark:text-indigo-300">
                            {isArabic ? `تقدير التحضير ~ ${estimateOrderPrepMinutes(order)} د` : `Prep ETA ~ ${estimateOrderPrepMinutes(order)}m`}
                          </p>
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
                      <div className="p-6 flex-1 space-y-4">
                        {(order.kitchenNotes || order.notes || order.deliveryNotes) && (
                          <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/70 dark:bg-amber-900/10 p-3">
                            {order.kitchenNotes && (
                              <p className="text-[11px] font-black text-amber-800 dark:text-amber-300">
                                Kitchen Note: <span className="font-bold">{order.kitchenNotes}</span>
                              </p>
                            )}
                            {order.notes && (
                              <p className="text-[11px] font-black text-amber-800 dark:text-amber-300 mt-1">
                                Order Note: <span className="font-bold">{order.notes}</span>
                              </p>
                            )}
                            {order.deliveryNotes && (
                              <p className="text-[11px] font-black text-amber-800 dark:text-amber-300 mt-1">
                                Delivery Note: <span className="font-bold">{order.deliveryNotes}</span>
                              </p>
                            )}
                          </div>
                        )}

                        <ul className="space-y-4">
                          {order.items.map((item, idx) => (
                            (() => {
                              const rawModifiers = (item as any).modifiers as any[] | undefined;
                              return (
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
                                    {Array.isArray(item.selectedModifiers) && item.selectedModifiers.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1.5">
                                        {item.selectedModifiers.map((m: any, modifierIndex: number) => (
                                          <span
                                            key={`${item.name}-mod-${modifierIndex}`}
                                            className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200/70 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-bold"
                                          >
                                            {m.optionName || m.name || m.groupName}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {Array.isArray(rawModifiers) && rawModifiers.length > 0 && (!item.selectedModifiers || item.selectedModifiers.length === 0) && (
                                      <div className="mt-1 flex flex-wrap gap-1.5">
                                        {rawModifiers.map((m: any, modifierIndex: number) => (
                                          <span
                                            key={`${item.name}-raw-mod-${modifierIndex}`}
                                            className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200/70 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-bold"
                                          >
                                            {m.optionName || m.name || m.groupName}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {item.notes && <p className="text-[10px] text-rose-500 font-bold mt-1 italic">Note: {item.notes}</p>}
                                  </div>
                                </li>
                              );
                            })()
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
                            onClick={() => advanceOrder(order)}
                            className="w-full py-3.5 min-h-12 bg-primary text-white rounded-2xl font-black uppercase text-xs hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                          >
                            {isArabic ? 'ابدأ التحضير' : 'Start Preparation'}
                          </button>
                        )}

                        {order.status === OrderStatus.PREPARING && (
                          <button
                            onClick={() => advanceOrder(order)}
                            className="w-full py-3.5 min-h-12 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                          >
                            <CheckCircle size={18} />
                            {isArabic ? 'تم التجهيز - جاهز' : 'Mark as Ready'}
                          </button>
                        )}

                        {order.status === OrderStatus.READY && (
                          <button
                            onClick={() => advanceOrder(order)}
                            className="w-full py-3.5 min-h-12 bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-900 transition-all shadow-lg"
                          >
                            {isArabic ? 'تسليم الطلب' : 'Complete Order'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Warning (min)</label>
                <input
                  type="number"
                  min={1}
                  value={slaThresholds.warning}
                  onChange={(e) => setSlaThresholds(prev => ({ ...prev, warning: Number(e.target.value || 1) }))}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-black border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Risk (min)</label>
                <input
                  type="number"
                  min={1}
                  value={slaThresholds.risk}
                  onChange={(e) => setSlaThresholds(prev => ({ ...prev, risk: Number(e.target.value || 1) }))}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-black border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Critical (min)</label>
                <input
                  type="number"
                  min={1}
                  value={slaThresholds.critical}
                  onChange={(e) => setSlaThresholds(prev => ({ ...prev, critical: Number(e.target.value || 1) }))}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-black border border-slate-200 dark:border-slate-700"
                />
              </div>
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
                  onClick={async () => {
                    const warning = Math.max(1, Number(slaThresholds.warning || 1));
                    const risk = Math.max(warning + 1, Number(slaThresholds.risk || warning + 1));
                    const critical = Math.max(risk + 1, Number(slaThresholds.critical || risk + 1));
                    const safeThresholds = { warning, risk, critical };
                    setSlaThresholds(safeThresholds);
                    try {
                      const allSettings = await settingsApi.getAll();
                      const existingPrinterMap = allSettings?.kdsPrinterStationMap && typeof allSettings.kdsPrinterStationMap === 'object'
                        ? allSettings.kdsPrinterStationMap
                        : {};
                      const nextPrinterMap = activeBranchId
                        ? { ...existingPrinterMap, [activeBranchId]: printerStationMap }
                        : printerStationMap;
                      await settingsApi.update('kdsStationKeywords', stationKeywords, 'kds');
                      await settingsApi.update('kdsSlaThresholds', safeThresholds, 'kds');
                      await settingsApi.update('kdsPrinterStationMap', nextPrinterMap, 'kds');
                    } catch {
                      // keep current in-memory settings and let user retry saving when backend is available
                    }
                    setIsStationSettingsOpen(false);
                  }}
                  className="px-4 py-3 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                >
                  Save Stations
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Printer Station Mapping</h4>
              {branchPrinters.length === 0 && (
                <p className="text-[11px] font-bold text-slate-400">No active printers found for this branch.</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {branchPrinters.map((printer: any) => (
                  <div key={printer.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/40">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{printer.type || 'PRINTER'}</div>
                    <div className="text-xs font-black text-slate-800 dark:text-white mt-1">{printer.name || printer.id}</div>
                    <div className="mt-2">
                      <select
                        value={printerStationMap[printer.id] || 'GRILL'}
                        onChange={(e) => setPrinterStationMap(prev => ({ ...prev, [printer.id]: e.target.value as Station }))}
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-black"
                      >
                        {['GRILL', 'BAR', 'DESSERT', 'FRYER', 'SALAD', 'BAKERY'].map((station) => (
                          <option key={station} value={station}>{station}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KDS;
