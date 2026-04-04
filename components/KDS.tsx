import React from 'react';
import { Clock, CheckCircle, Volume2, VolumeX, MonitorPlay, AlertTriangle, Play, Truck, Settings, Flame, ChefHat, Sparkles, X, Plus, UtensilsCrossed, Search, Zap, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderStatus, AuditEventType } from '../types';
import { useOrderStore } from '../stores/useOrderStore';
import { eventBus } from '../services/eventBus';
import { useAuthStore } from '../stores/useAuthStore';

type Station = 'ALL' | string;

interface StationConfig {
  name: string;
  keywords: string[];
}

const DEFAULT_STATIONS: StationConfig[] = [
  { name: 'GRILL', keywords: ['grill', 'bbq', 'kebab', 'steak', 'skewer', 'chicken', 'meat'] },
  { name: 'BAR', keywords: ['coffee', 'espresso', 'latte', 'mocha', 'tea', 'juice', 'soda', 'drink', 'bar'] },
  { name: 'DESSERT', keywords: ['dessert', 'cake', 'sweet', 'icecream', 'ice', 'chocolate', 'pudding'] },
  { name: 'FRYER', keywords: ['fries', 'fry', 'fried', 'crispy', 'nugget'] },
  { name: 'SALAD', keywords: ['salad', 'green', 'vegan', 'bowl'] },
  { name: 'BAKERY', keywords: ['bread', 'bakery', 'pastry', 'croissant', 'bun'] },
];

/* ═══════════════════════════════════════════════════
   🔊 Web Audio Sound Generator
   ═══════════════════════════════════════════════════ */
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
  playBeep(880, 0.15, 0.4);
  setTimeout(() => playBeep(1100, 0.2, 0.5), 180);
};

const playUrgentAlertSound = () => {
  playBeep(1200, 0.12, 0.5);
  setTimeout(() => playBeep(1200, 0.12, 0.5), 200);
  setTimeout(() => playBeep(1500, 0.25, 0.6), 400);
};

/* ═══════════════════════════════════════════════════
   ⏰ Isolated Live Clock — only re-renders itself
   ═══════════════════════════════════════════════════ */
const LiveClock = React.memo(() => {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2">
      <Clock size={14} style={{ color: 'rgb(var(--text-muted))' }} />
      <span
        className="tabular-nums tracking-tight"
        style={{ fontSize: '1.1rem', fontWeight: 900, color: 'rgb(var(--text-main))' }}
      >
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
});

/* ═══════════════════════════════════════════════════
   🎨 Column Theme Configs — using CSS variable tokens
   ═══════════════════════════════════════════════════ */
const COLUMN_THEMES = {
  PENDING: {
    token: '--warning',
    icon: <Flame size={18} />,
    label: 'QUEUE',
    subtitle: 'Waiting to fire',
  },
  PREPARING: {
    token: '--primary',
    icon: <ChefHat size={18} />,
    label: 'FIRE',
    subtitle: 'In the kitchen',
  },
  READY: {
    token: '--success',
    icon: <Sparkles size={18} />,
    label: 'PASS',
    subtitle: 'Ready to serve',
  },
};

/* ═══════════════════════════════════════════════════
   SLA Thresholds
   ═══════════════════════════════════════════════════ */
const SLA = { warning: 7, risk: 12, critical: 20 };

/* ═══════════════════════════════════════════════════
   Helper: normalize text for station matching
   ═══════════════════════════════════════════════════ */
const normalizeToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

/* ═══════════════════════════════════════════════════
   🏪 KDS — Main Component (Performance Optimized)
   ═══════════════════════════════════════════════════ */
const KDS: React.FC = () => {
  const { orders, updateOrderStatus, fetchOrders } = useOrderStore();
  const { settings } = useAuthStore();
  const isArabic = settings.language === 'ar';
  const activeBranchId = settings.activeBranchId;

  const [nowTick, setNowTick] = React.useState(Date.now());
  const [activeStatus, setActiveStatus] = React.useState<'ALL' | OrderStatus>('ALL');
  const [activeStations, setActiveStations] = React.useState<Set<Station>>(new Set(['ALL']));
  const [soundMode, setSoundMode] = React.useState<'ALL' | 'OFF'>('ALL');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showStationSettings, setShowStationSettings] = React.useState(false);
  const [pendingBump, setPendingBump] = React.useState<string | null>(null);
  const [highlightedIdx, setHighlightedIdx] = React.useState(-1);
  const [kdsMode, setKdsMode] = React.useState<'simple' | 'advanced'>(() => {
    try { return (localStorage.getItem('kds_mode') as any) || 'simple'; } catch { return 'simple'; }
  });
  const [quickInput, setQuickInput] = React.useState('');
  const quickInputRef = React.useRef<HTMLInputElement>(null);

  const [stations, setStations] = React.useState<StationConfig[]>(() => {
    try {
      const saved = localStorage.getItem('kds_stations');
      return saved ? JSON.parse(saved) : DEFAULT_STATIONS;
    } catch { return DEFAULT_STATIONS; }
  });

  const saveStations = React.useCallback((updated: StationConfig[]) => {
    setStations(updated);
    localStorage.setItem('kds_stations', JSON.stringify(updated));
  }, []);

  const stationKeywords: Record<string, string[]> = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    stations.forEach(s => { map[s.name] = s.keywords; });
    return map;
  }, [stations]);

  // Fetch orders on mount + listen for events
  React.useEffect(() => {
    const params = activeBranchId ? { branch_id: activeBranchId, limit: 300 } : { limit: 300 };
    fetchOrders(params);
    const unsubOrder = eventBus.on(AuditEventType.POS_ORDER_PLACEMENT, () => {
      fetchOrders(params);
      if (soundMode === 'ALL') playNewOrderSound();
    });
    const unsubStatus = eventBus.on(AuditEventType.ORDER_STATUS_CHANGE, () => {
      fetchOrders(params);
    });
    return () => { unsubOrder(); unsubStatus(); };
  }, [fetchOrders, soundMode, activeBranchId]);

  // Timer tick — every 5s for elapsed time calculations
  React.useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen listener
  React.useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = React.useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { }
  }, []);

  const getStationForItem = React.useCallback((item: any) => {
    const name = normalizeToken(item?.name || '');
    const category = normalizeToken(item?.category || item?.categoryId || '');
    const source = `${name} ${category}`;
    for (const [station, tokens] of Object.entries(stationKeywords)) {
      if (tokens.some(token => source.includes(normalizeToken(token)))) return station as Station;
    }
    return stations[0]?.name || 'GENERAL';
  }, [stationKeywords, stations]);

  const toggleStation = React.useCallback((station: Station) => {
    setActiveStations(prev => {
      const next = new Set(prev);
      if (station === 'ALL') return new Set(['ALL']);
      next.delete('ALL');
      if (next.has(station)) next.delete(station);
      else next.add(station);
      if (next.size === 0) return new Set(['ALL']);
      return next;
    });
  }, []);

  // Filter & sort orders — filter stale orders (>24h)
  const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
  const activeOrders = React.useMemo(() => {
    let base = orders.filter(o =>
      o.status !== OrderStatus.DELIVERED &&
      o.status !== OrderStatus.CANCELLED &&
      (!activeBranchId || o.branchId === activeBranchId) &&
      (Date.now() - new Date(o.createdAt).getTime()) < MAX_AGE_MS
    );
    if (activeStatus !== 'ALL') base = base.filter(o => o.status === activeStatus);
    if (!activeStations.has('ALL')) base = base.filter(o => (o.items || []).some((item: any) => activeStations.has(getStationForItem(item))));
    return base.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders, activeStatus, activeStations, activeBranchId, getStationForItem, nowTick]);

  const getElapsedMins = React.useCallback((createdAt: any) =>
    Math.floor((nowTick - new Date(createdAt).getTime()) / 60000), [nowTick]);

  // Urgent sound alert
  React.useEffect(() => {
    if (soundMode === 'OFF') return;
    const hasCritical = activeOrders.some(o => getElapsedMins(o.createdAt) >= SLA.critical && o.status !== OrderStatus.READY);
    if (hasCritical) playUrgentAlertSound();
  }, [nowTick, soundMode, activeOrders, getElapsedMins]);

  // Station workload
  const stationWorkload = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const order of activeOrders) {
      for (const item of order.items || []) {
        const station = getStationForItem(item);
        map[station] = (map[station] || 0) + Math.max(1, Number(item?.quantity || 1));
      }
    }
    return map;
  }, [activeOrders, getStationForItem]);

  const advanceOrder = React.useCallback(async (order: any) => {
    if (pendingBump !== order.id) {
      setPendingBump(order.id);
      setTimeout(() => setPendingBump(prev => prev === order.id ? null : prev), 1500);
      return;
    }
    setPendingBump(null);
    const next = order.status === OrderStatus.PENDING ? OrderStatus.PREPARING
      : order.status === OrderStatus.PREPARING ? OrderStatus.READY
        : OrderStatus.DELIVERED;
    if (next !== order.status) await updateOrderStatus(order.id, next, undefined, undefined, { skipPrint: true });
  }, [pendingBump, updateOrderStatus]);

  const completeReadyBatch = React.useCallback(async () => {
    const readyOrders = activeOrders.filter(o => o.status === OrderStatus.READY);
    for (const order of readyOrders) await updateOrderStatus(order.id, OrderStatus.DELIVERED, undefined, undefined, { skipPrint: true });
  }, [activeOrders, updateOrderStatus]);

  // Live match preview — find order as user types
  const matchedOrder = React.useMemo(() => {
    const trimmed = quickInput.trim();
    if (!trimmed) return null;
    return activeOrders.find(o =>
      String(o.orderNumber) === trimmed ||
      String(o.orderNumber).includes(trimmed) ||
      o.id.slice(0, 6).toLowerCase() === trimmed.toLowerCase()
    ) || null;
  }, [quickInput, activeOrders]);

  // Quick-complete confirmed match (Simple Mode) — chain through statuses
  const confirmQuickComplete = React.useCallback(async () => {
    if (!matchedOrder) return;
    const o = matchedOrder;
    try {
      if (o.status === OrderStatus.PENDING) await updateOrderStatus(o.id, OrderStatus.PREPARING, undefined, undefined, { skipPrint: true });
      if (o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING) await updateOrderStatus(o.id, OrderStatus.READY, undefined, undefined, { skipPrint: true });
      await updateOrderStatus(o.id, OrderStatus.DELIVERED, undefined, undefined, { skipPrint: true });
    } catch { /* ignore transition errors */ }
    setQuickInput('');
  }, [matchedOrder, updateOrderStatus]);

  const toggleKdsMode = React.useCallback(() => {
    setKdsMode(prev => {
      const next = prev === 'simple' ? 'advanced' : 'simple';
      localStorage.setItem('kds_mode', next);
      return next;
    });
  }, []);

  const getTimerUrgency = React.useCallback((mins: number, status: OrderStatus): 'ok' | 'warning' | 'risk' | 'critical' | 'ready' => {
    if (status === OrderStatus.READY) return 'ready';
    if (mins >= SLA.critical) return 'critical';
    if (mins >= SLA.risk) return 'risk';
    if (mins >= SLA.warning) return 'warning';
    return 'ok';
  }, []);

  // Derived counts
  const pendingOrders = React.useMemo(() => activeOrders.filter(o => o.status === OrderStatus.PENDING), [activeOrders]);
  const preparingOrders = React.useMemo(() => activeOrders.filter(o => o.status === OrderStatus.PREPARING), [activeOrders]);
  const readyOrders = React.useMemo(() => activeOrders.filter(o => o.status === OrderStatus.READY), [activeOrders]);

  const showPending = activeStatus === 'ALL' || activeStatus === OrderStatus.PENDING;
  const showPreparing = activeStatus === 'ALL' || activeStatus === OrderStatus.PREPARING;
  const showReady = activeStatus === 'ALL' || activeStatus === OrderStatus.READY;

  const totalStationLoad = Object.values(stationWorkload).reduce((a, b) => a + b, 0);
  const maxStationLoad = Math.max(1, ...Object.values(stationWorkload));

  const statusFilters = React.useMemo(() => [
    { key: 'ALL' as const, label: 'ALL', count: activeOrders.length },
    { key: OrderStatus.PENDING, label: 'QUEUE', count: pendingOrders.length },
    { key: OrderStatus.PREPARING, label: 'FIRE', count: preparingOrders.length },
    { key: OrderStatus.READY, label: 'PASS', count: readyOrders.length },
  ], [activeOrders.length, pendingOrders.length, preparingOrders.length, readyOrders.length]);

  // ⌨️ Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showStationSettings) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case '1': setActiveStatus('ALL'); break;
        case '2': setActiveStatus(OrderStatus.PENDING); break;
        case '3': setActiveStatus(OrderStatus.PREPARING); break;
        case '4': setActiveStatus(OrderStatus.READY); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'm': case 'M': setSoundMode(p => p === 'OFF' ? 'ALL' : 'OFF'); break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIdx(p => Math.min(p + 1, activeOrders.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIdx(p => Math.max(p - 1, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (highlightedIdx >= 0 && highlightedIdx < activeOrders.length) {
            advanceOrder(activeOrders[highlightedIdx]);
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showStationSettings, toggleFullscreen, activeOrders, highlightedIdx, advanceOrder]);

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden font-sans"
      style={{ background: 'rgb(var(--bg-app))', color: 'rgb(var(--text-main))' }}
    >
      {/* ═══ TOP ACCENT LINE — themed gradient ═══ */}
      <div
        className="shrink-0"
        style={{
          height: 3,
          background: `linear-gradient(90deg, rgb(var(--warning)), rgb(var(--primary)), rgb(var(--success)))`,
          opacity: 0.7,
        }}
      />

      {/* ═══ HEADER BAR ═══ */}
      <div
        className="shrink-0 flex items-center justify-between px-5 py-2"
        style={{
          background: 'rgba(var(--bg-card), 0.88)',
          backdropFilter: 'blur(var(--theme-blur, 16px))',
          borderBottom: '1px solid rgba(var(--border-color), 0.2)',
        }}
      >
        {/* Left: Brand + Clock + Active count */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center"
              style={{
                width: 34, height: 34,
                borderRadius: 'var(--theme-radius-sm, 8px)',
                background: `linear-gradient(135deg, rgb(var(--primary)), rgba(var(--primary), 0.6))`,
                boxShadow: '0 4px 12px rgba(var(--primary), 0.25)',
              }}
            >
              <ChefHat size={16} className="text-white" />
            </div>
            <div>
              <h1 style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.18em', color: 'rgb(var(--text-main))' }} className="uppercase leading-none">KITCHEN</h1>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgb(var(--text-muted))', letterSpacing: '0.12em' }} className="uppercase">DISPLAY SYSTEM</p>
            </div>
          </div>

          <div style={{ width: 1, height: 24, background: 'rgba(var(--border-color), 0.25)' }} />
          <LiveClock />
          <div style={{ width: 1, height: 24, background: 'rgba(var(--border-color), 0.25)' }} />

          {/* Active ticket counter */}
          <div
            className="flex items-center gap-2 px-3 py-1.5"
            style={{
              borderRadius: 'var(--theme-radius-sm, 8px)',
              background: 'rgba(var(--bg-elevated), 0.6)',
              border: '1px solid rgba(var(--border-color), 0.2)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'rgb(var(--success))' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'rgb(var(--success))' }} />
            </span>
            <span className="tabular-nums" style={{ fontSize: 12, fontWeight: 900 }}>{activeOrders.length}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--text-muted))' }} className="uppercase">active</span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <button
            onClick={toggleKdsMode}
            className="flex items-center gap-1.5 px-3 py-2 uppercase transition-all duration-200"
            style={{
              borderRadius: 'var(--theme-radius-sm, 8px)',
              fontSize: 10, fontWeight: 900,
              background: kdsMode === 'simple' ? 'rgba(var(--success), 0.12)' : 'rgba(var(--primary), 0.12)',
              color: kdsMode === 'simple' ? 'rgb(var(--success))' : 'rgb(var(--primary))',
              border: `1px solid ${kdsMode === 'simple' ? 'rgba(var(--success), 0.25)' : 'rgba(var(--primary), 0.25)'}`,
            }}
          >
            {kdsMode === 'simple' ? <Zap size={14} /> : <Layers size={14} />}
            {kdsMode === 'simple' ? 'SIMPLE' : 'ADVANCED'}
          </button>

          {/* Quick complete input (Simple mode) */}
          {kdsMode === 'simple' && (
            <div className="relative">
              <div className="flex items-center" style={{
                borderRadius: 'var(--theme-radius-sm, 8px)',
                background: matchedOrder ? 'rgba(var(--success), 0.1)' : 'rgba(var(--bg-elevated), 0.6)',
                border: `1px solid ${matchedOrder ? 'rgba(var(--success), 0.35)' : quickInput && !matchedOrder ? 'rgba(var(--danger), 0.3)' : 'rgba(var(--border-color), 0.25)'}`,
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}>
                <Search size={14} style={{ margin: '0 8px', color: matchedOrder ? 'rgb(var(--success))' : 'rgb(var(--text-muted))' }} />
                <input
                  ref={quickInputRef}
                  value={quickInput}
                  onChange={e => setQuickInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmQuickComplete(); } if (e.key === 'Escape') { setQuickInput(''); } }}
                  placeholder="Order # → Enter"
                  className="bg-transparent outline-none"
                  style={{
                    width: 110, padding: '6px 8px 6px 0',
                    fontSize: 12, fontWeight: 700,
                    color: 'rgb(var(--text-main))',
                  }}
                />
                {matchedOrder && (
                  <div className="flex items-center gap-1.5 pr-2 shrink-0" style={{ color: 'rgb(var(--success))', fontSize: 11, fontWeight: 900 }}>
                    <span>#{matchedOrder.orderNumber || matchedOrder.id.slice(0, 5)}</span>
                    <span style={{ fontSize: 9, opacity: 0.7 }}>↵</span>
                  </div>
                )}
                {quickInput && !matchedOrder && (
                  <div className="pr-2 shrink-0" style={{ color: 'rgb(var(--danger))', fontSize: 10, fontWeight: 700 }}>✕</div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setSoundMode(soundMode === 'OFF' ? 'ALL' : 'OFF')}
            className="flex items-center gap-1.5 px-3 py-2 uppercase transition-all duration-200"
            style={{
              borderRadius: 'var(--theme-radius-sm, 8px)',
              fontSize: 10, fontWeight: 900,
              background: soundMode === 'OFF' ? 'rgba(var(--danger), 0.12)' : 'rgba(var(--success), 0.12)',
              color: soundMode === 'OFF' ? 'rgb(var(--danger))' : 'rgb(var(--success))',
              border: `1px solid ${soundMode === 'OFF' ? 'rgba(var(--danger), 0.2)' : 'rgba(var(--success), 0.2)'}`,
            }}
          >
            {soundMode === 'OFF' ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {soundMode === 'OFF' ? 'MUTED' : 'LIVE'}
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 uppercase transition-all duration-200"
            style={{
              borderRadius: 'var(--theme-radius-sm, 8px)',
              fontSize: 10, fontWeight: 900,
              background: 'rgba(var(--bg-elevated), 0.5)',
              color: 'rgb(var(--text-muted))',
              border: '1px solid rgba(var(--border-color), 0.2)',
            }}
          >
            <MonitorPlay size={14} /> {isFullscreen ? 'EXIT' : 'FULL'}
          </button>
          <button
            onClick={() => setShowStationSettings(true)}
            className="flex items-center justify-center transition-all duration-200"
            style={{
              width: 36, height: 36,
              borderRadius: 'var(--theme-radius-sm, 8px)',
              background: 'rgba(var(--bg-elevated), 0.5)',
              color: 'rgb(var(--text-muted))',
              border: '1px solid rgba(var(--border-color), 0.2)',
            }}
            title="Configure Stations"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT — Simple or Advanced ═══ */}
      {kdsMode === 'simple' ? (
        <SimpleGrid
          orders={activeOrders.filter(o => o.status !== OrderStatus.READY && o.status !== OrderStatus.DELIVERED)}
          readyOrders={readyOrders}
          getElapsedMins={getElapsedMins}
          getTimerUrgency={getTimerUrgency}
          getStationForItem={getStationForItem}
          updateOrderStatus={updateOrderStatus}
          isArabic={isArabic}
        />
      ) : (
        <>
          {/* ═══ FILTER RIBBON (Advanced only) ═══ */}
          <div
            className="shrink-0 flex items-center gap-3 px-5 py-2 overflow-x-auto no-scrollbar"
            style={{
              background: 'rgba(var(--bg-card), 0.5)',
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid rgba(var(--border-color), 0.12)',
            }}
          >
            <div className="flex items-center gap-1.5">
              {statusFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveStatus(f.key as any)}
                  className="flex items-center gap-1.5 uppercase tracking-wider transition-all duration-200"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--theme-radius-sm, 8px)',
                    fontSize: 10, fontWeight: 900,
                    background: activeStatus === f.key ? 'rgb(var(--primary))' : 'rgba(var(--bg-elevated), 0.4)',
                    color: activeStatus === f.key ? 'white' : 'rgb(var(--text-muted))',
                    boxShadow: activeStatus === f.key ? '0 4px 12px rgba(var(--primary), 0.25)' : 'none',
                  }}
                >
                  {f.label}
                  <span className="tabular-nums" style={{ padding: '1px 6px', borderRadius: 'var(--theme-radius-sm, 6px)', fontSize: 9, fontWeight: 900, background: activeStatus === f.key ? 'rgba(255,255,255,0.2)' : 'rgba(var(--bg-app), 0.6)' }}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 20, background: 'rgba(var(--border-color), 0.15)' }} />
            <div className="flex items-center gap-1">
              {['ALL', ...stations.map(s => s.name)].map(station => {
                const isActive = activeStations.has(station as Station);
                const load = station !== 'ALL' ? stationWorkload[station] || 0 : totalStationLoad;
                return (
                  <button key={station} onClick={() => toggleStation(station as Station)}
                    className="flex items-center gap-1 uppercase tracking-wider transition-all duration-200"
                    style={{ padding: '5px 10px', borderRadius: 'var(--theme-radius-sm, 8px)', fontSize: 9, fontWeight: 900, background: isActive ? 'rgba(var(--success), 0.12)' : 'transparent', color: isActive ? 'rgb(var(--success))' : 'rgb(var(--text-muted))', border: isActive ? '1px solid rgba(var(--success), 0.25)' : '1px solid transparent' }}
                  >
                    {station}
                    {load > 0 && <span className="flex items-center justify-center tabular-nums" style={{ width: 18, height: 18, borderRadius: '50%', fontSize: 8, fontWeight: 900, background: load > 5 ? 'rgba(var(--danger), 0.2)' : 'rgba(var(--bg-elevated), 0.8)', color: load > 5 ? 'rgb(var(--danger))' : 'inherit' }}>{load}</span>}
                  </button>
                );
              })}
            </div>
            {totalStationLoad > 0 && (
              <>
                <div style={{ width: 1, height: 20, background: 'rgba(var(--border-color), 0.15)' }} />
                <div className="flex items-center gap-2 ml-auto">
                  <span className="flex items-center gap-1 uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 700, color: 'rgb(var(--text-muted))' }}><AlertTriangle size={10} /> LOAD</span>
                  <div className="flex items-end gap-px" style={{ height: 16 }}>
                    {stations.map(st => {
                      const load = stationWorkload[st.name] || 0;
                      if (load === 0) return null;
                      const pct = Math.min(100, (load / maxStationLoad) * 100);
                      return (<div key={st.name} title={`${st.name}: ${load}`}><div className="rounded-full transition-all" style={{ width: 5, height: `${Math.max(4, pct * 0.16)}px`, background: load > 5 ? 'rgb(var(--danger))' : load > 3 ? 'rgb(var(--warning))' : 'rgb(var(--success))' }} /></div>);
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ═══ KANBAN COLUMNS ═══ */}
          <div className={`flex-1 min-h-0 flex ${isArabic ? 'flex-row-reverse' : 'flex-row'} gap-2.5 p-2.5`}>
            {showPending && <KanbanColumn theme={COLUMN_THEMES.PENDING} orders={pendingOrders} actionLabel="START OLDEST" actionIcon={<Play size={12} />} onAction={pendingOrders.length > 0 ? () => advanceOrder(pendingOrders[0]) : undefined} getElapsedMins={getElapsedMins} getTimerUrgency={getTimerUrgency} advanceOrder={advanceOrder} getStationForItem={getStationForItem} isArabic={isArabic} pendingBump={pendingBump} highlightedId={highlightedIdx >= 0 ? activeOrders[highlightedIdx]?.id : null} />}
            {showPreparing && <KanbanColumn theme={COLUMN_THEMES.PREPARING} orders={preparingOrders} actionLabel="READY OLDEST" actionIcon={<CheckCircle size={12} />} onAction={preparingOrders.length > 0 ? () => advanceOrder(preparingOrders[0]) : undefined} getElapsedMins={getElapsedMins} getTimerUrgency={getTimerUrgency} advanceOrder={advanceOrder} getStationForItem={getStationForItem} isArabic={isArabic} pendingBump={pendingBump} highlightedId={highlightedIdx >= 0 ? activeOrders[highlightedIdx]?.id : null} />}
            {showReady && <KanbanColumn theme={COLUMN_THEMES.READY} orders={readyOrders} actionLabel="DELIVER ALL" actionIcon={<Truck size={12} />} onAction={readyOrders.length > 0 ? completeReadyBatch : undefined} getElapsedMins={getElapsedMins} getTimerUrgency={getTimerUrgency} advanceOrder={advanceOrder} getStationForItem={getStationForItem} isArabic={isArabic} pendingBump={pendingBump} highlightedId={highlightedIdx >= 0 ? activeOrders[highlightedIdx]?.id : null} />}
          </div>
        </>
      )}

      {/* ═══ Station Settings Modal ═══ */}
      <AnimatePresence>
        {showStationSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowStationSettings(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg space-y-4"
              style={{
                background: 'rgb(var(--bg-card))',
                borderRadius: 'var(--theme-radius-lg, 16px)',
                border: '1px solid rgba(var(--border-color), 0.25)',
                padding: 24,
                boxShadow: 'var(--theme-shadow-elevated)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-4" style={{ borderBottom: '1px solid rgba(var(--border-color), 0.15)' }}>
                <h3 className="flex items-center gap-2 uppercase tracking-wider" style={{ fontSize: 14, fontWeight: 900, color: 'rgb(var(--text-main))' }}>
                  <Settings size={16} style={{ color: 'rgb(var(--primary))' }} /> Station Config
                </h3>
                <button
                  onClick={() => setShowStationSettings(false)}
                  className="flex items-center justify-center transition-colors"
                  style={{
                    width: 32, height: 32,
                    borderRadius: 'var(--theme-radius-sm, 8px)',
                    background: 'rgba(var(--bg-elevated), 0.5)',
                    color: 'rgb(var(--text-muted))',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: '60vh' }}>
                {stations.map((s, i) => (
                  <div
                    key={i}
                    className="space-y-2"
                    style={{
                      background: 'rgba(var(--bg-elevated), 0.5)',
                      borderRadius: 'var(--theme-radius, 12px)',
                      padding: 14,
                      border: '1px solid rgba(var(--border-color), 0.15)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <input
                        value={s.name}
                        onChange={e => {
                          const updated = [...stations];
                          updated[i] = { ...s, name: e.target.value.toUpperCase() };
                          saveStations(updated);
                        }}
                        className="bg-transparent outline-none uppercase transition-colors"
                        style={{
                          color: 'rgb(var(--text-main))',
                          fontWeight: 900, fontSize: 13,
                          borderBottom: '1px solid transparent',
                          width: 128,
                        }}
                        onFocus={e => e.target.style.borderBottomColor = 'rgb(var(--primary))'}
                        onBlur={e => e.target.style.borderBottomColor = 'transparent'}
                      />
                      <button
                        onClick={() => saveStations(stations.filter((_, j) => j !== i))}
                        className="uppercase transition-colors"
                        style={{
                          fontSize: 10, fontWeight: 900,
                          color: 'rgb(var(--danger))',
                          padding: '4px 8px',
                          borderRadius: 'var(--theme-radius-sm, 6px)',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      value={s.keywords.join(', ')}
                      onChange={e => {
                        const updated = [...stations];
                        updated[i] = { ...s, keywords: e.target.value.split(',').map(k => k.trim().toLowerCase()).filter(Boolean) };
                        saveStations(updated);
                      }}
                      className="w-full outline-none transition-colors"
                      style={{
                        background: 'rgb(var(--bg-app))',
                        border: '1px solid rgba(var(--border-color), 0.2)',
                        borderRadius: 'var(--theme-radius-sm, 8px)',
                        padding: '8px 12px',
                        fontSize: 12, fontWeight: 700,
                        color: 'rgb(var(--text-muted))',
                      }}
                      placeholder="Keywords (comma separated)"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => saveStations([...stations, { name: `STATION${stations.length + 1}`, keywords: [] }])}
                className="w-full flex items-center justify-center gap-1.5 uppercase tracking-widest transition-all"
                style={{
                  padding: '10px 0',
                  borderRadius: 'var(--theme-radius, 12px)',
                  background: 'rgb(var(--primary))',
                  color: 'white',
                  fontSize: 10, fontWeight: 900,
                  boxShadow: '0 4px 12px rgba(var(--primary), 0.25)',
                }}
              >
                <Plus size={12} /> Add Station
              </button>
              <button
                onClick={() => saveStations(DEFAULT_STATIONS)}
                className="w-full uppercase tracking-widest transition-colors"
                style={{
                  padding: '8px 0',
                  fontSize: 10, fontWeight: 900,
                  color: 'rgb(var(--text-muted))',
                }}
              >
                Reset to Defaults
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   📋 Kanban Column — Themed, memoized
   ═══════════════════════════════════════════════════ */
const KanbanColumn = React.memo(({
  theme, orders, actionLabel, actionIcon, onAction,
  getElapsedMins, getTimerUrgency, advanceOrder, getStationForItem, isArabic, pendingBump, highlightedId,
}: any) => (
  <div
    className="flex-1 flex flex-col overflow-hidden"
    style={{
      borderRadius: 'var(--theme-radius-lg, 16px)',
      border: '1px solid rgba(var(--border-color), 0.12)',
      background: 'rgba(var(--bg-card), 0.45)',
      backdropFilter: 'blur(var(--theme-blur, 12px))',
      boxShadow: 'var(--theme-shadow-card)',
    }}
  >
    {/* Column Header */}
    <div
      className="shrink-0 flex items-center justify-between px-4 py-3"
      style={{
        background: `linear-gradient(135deg, rgba(var(${theme.token}), 0.12), rgba(var(${theme.token}), 0.04))`,
        borderBottom: '1px solid rgba(var(--border-color), 0.1)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <span style={{ color: `rgb(var(${theme.token}))` }}>{theme.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="uppercase tracking-wider" style={{ fontSize: 13, fontWeight: 900, color: `rgb(var(${theme.token}))` }}>
              {theme.label}
            </h2>
            <span
              className="tabular-nums"
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--theme-radius-sm, 6px)',
                fontSize: 10, fontWeight: 900,
                background: `rgba(var(${theme.token}), 0.12)`,
                color: `rgb(var(${theme.token}))`,
                border: `1px solid rgba(var(${theme.token}), 0.2)`,
              }}
            >
              {orders.length}
            </span>
          </div>
          <p className="uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 700, color: 'rgb(var(--text-muted))' }}>
            {theme.subtitle}
          </p>
        </div>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 uppercase tracking-wider active:scale-95 transition-all"
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--theme-radius, 10px)',
            fontSize: 9, fontWeight: 900,
            background: `linear-gradient(135deg, rgb(var(${theme.token})), rgba(var(${theme.token}), 0.8))`,
            color: 'white',
            boxShadow: `0 4px 12px rgba(var(${theme.token}), 0.3)`,
          }}
        >
          {actionIcon} {actionLabel}
        </button>
      )}
    </div>

    {/* Scrollable ticket area */}
    <div className="flex-1 overflow-y-auto p-2.5 space-y-2 no-scrollbar relative">
      <AnimatePresence mode="sync">
        {orders.map((order: any) => (
          <TicketCard
            key={order.id}
            order={order}
            getElapsedMins={getElapsedMins}
            getTimerUrgency={getTimerUrgency}
            advanceOrder={advanceOrder}
            getStationForItem={getStationForItem}
            isArabic={isArabic}
            isPendingBump={pendingBump === order.id}
            isHighlighted={highlightedId === order.id}
          />
        ))}
      </AnimatePresence>
      {orders.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 opacity-25">
          <UtensilsCrossed size={32} style={{ color: 'rgb(var(--text-muted))' }} />
          <p className="uppercase tracking-widest mt-3" style={{ fontSize: 10, fontWeight: 900, color: 'rgb(var(--text-muted))' }}>
            No tickets
          </p>
          <p className="mt-1" style={{ fontSize: 9, fontWeight: 600, color: 'rgb(var(--text-muted))', opacity: 0.6 }}>
            Orders will appear here
          </p>
        </div>
      )}
    </div>
  </div>
));

/* ═══════════════════════════════════════════════════
   🎫 Ticket Card — Themed, with progress bar
   ═══════════════════════════════════════════════════ */
const TicketCard = React.memo(({ order, getElapsedMins, getTimerUrgency, advanceOrder, getStationForItem, isArabic, isPendingBump, isHighlighted }: any) => {
  const elapsed = getElapsedMins(order.createdAt);
  const urgency = getTimerUrgency(elapsed, order.status);
  const isReady = order.status === OrderStatus.READY;

  // Progress bar: 0-100% based on SLA critical threshold
  const progressPct = Math.min(100, (elapsed / SLA.critical) * 100);

  // Urgency-based token for colors
  const urgencyToken = urgency === 'critical' ? '--danger'
    : urgency === 'risk' ? '--danger'
      : urgency === 'warning' ? '--warning'
        : urgency === 'ready' ? '--success'
          : '--success';

  const cardBg = isReady
    ? 'rgba(var(--success), 0.06)'
    : urgency === 'critical'
      ? 'rgba(var(--danger), 0.06)'
      : 'rgba(var(--bg-elevated), 0.5)';

  const cardBorder = isReady
    ? 'rgba(var(--success), 0.2)'
    : urgency === 'critical'
      ? 'rgba(var(--danger), 0.25)'
      : 'rgba(var(--border-color), 0.15)';

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      onClick={() => advanceOrder(order)}
      className="w-full text-left block overflow-hidden transition-all active:scale-[0.98] group"
      style={{
        borderRadius: 'var(--theme-radius, 12px)',
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        outline: isPendingBump ? `2px solid rgb(var(--primary))` : isHighlighted ? `2px solid rgb(var(--accent))` : 'none',
        outlineOffset: isPendingBump || isHighlighted ? 1 : 0,
        boxShadow: urgency === 'critical' ? '0 0 20px rgba(var(--danger), 0.1)' : 'none',
      }}
    >
      {/* ── Progress bar at top ── */}
      <div style={{ height: 3, background: 'rgba(var(--border-color), 0.1)', position: 'relative', overflow: 'hidden' }}>
        <div
          className="transition-all duration-1000"
          style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: `${isReady ? 100 : progressPct}%`,
            background: isReady
              ? `rgb(var(--success))`
              : `linear-gradient(90deg, rgb(var(--success)), rgb(var(${urgencyToken})))`,
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>

      {/* ── Timer + Type strip ── */}
      <div
        className="flex justify-between items-center px-3 py-1.5"
        style={{
          background: `rgba(var(${urgencyToken}), ${urgency === 'critical' ? 0.15 : 0.08})`,
        }}
      >
        <div className="flex items-center gap-1 tabular-nums uppercase" style={{ fontSize: 12, fontWeight: 900, color: `rgb(var(${urgencyToken}))` }}>
          <Clock size={12} /> {elapsed}m
          {urgency === 'critical' && <span className="animate-pulse">🔥</span>}
        </div>
        <div className="uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 900, color: `rgb(var(${urgencyToken}))`, opacity: 0.8 }}>
          {order.type || 'ORDER'}
        </div>
      </div>

      {/* ── Order identifiers ── */}
      <div
        className="flex justify-between items-center px-3 py-2"
        style={{ borderBottom: '1px solid rgba(var(--border-color), 0.08)' }}
      >
        <div>
          <span className="block uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 700, color: 'rgb(var(--text-muted))' }}>
            {order.orderNumber ? `ORDER #${order.orderNumber}` : 'ORDER'}
          </span>
          <span
            className="uppercase tracking-tight leading-none tabular-nums"
            style={{
              fontSize: '1.75rem', fontWeight: 900,
              color: isReady ? 'rgb(var(--success))' : 'rgb(var(--text-main))',
            }}
          >
            #{order.orderNumber || order.id.slice(0, 5)}
          </span>
        </div>
        <div className="text-right">
          <span className="block uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 700, color: 'rgb(var(--text-muted))' }}>
            {order.tableId ? 'TABLE' : 'MODE'}
          </span>
          <span className="uppercase leading-none" style={{ fontSize: 15, fontWeight: 900, color: 'rgb(var(--primary))' }}>
            {order.tableId || order.type}
          </span>
        </div>
      </div>

      {/* ── Notes ── */}
      {(order.kitchenNotes || order.notes) && (
        <div
          className="flex items-start gap-1 px-3 py-1.5 uppercase leading-snug"
          style={{
            background: 'rgba(var(--warning), 0.06)',
            borderBottom: '1px solid rgba(var(--warning), 0.1)',
            color: 'rgb(var(--warning))',
            fontSize: 10, fontWeight: 700,
          }}
        >
          <span className="shrink-0 mt-px">📝</span>
          <span className="line-clamp-2">{order.kitchenNotes || order.notes}</span>
        </div>
      )}

      {/* ── Items ── */}
      <div style={{ padding: 10 }}>
        <ul className="space-y-1.5">
          {order.items.map((item: any, idx: number) => {
            const mods = Array.isArray(item.selectedModifiers) && item.selectedModifiers.length > 0
              ? item.selectedModifiers
              : (Array.isArray(item.modifiers) ? item.modifiers : []);
            const isDone = item._done;

            return (
              <li key={idx} className={`flex gap-2 transition-colors ${isDone ? 'opacity-30' : ''}`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = { ...order };
                    updated.items = [...order.items];
                    updated.items[idx] = { ...item, _done: !isDone };
                  }}
                  className="shrink-0 flex items-center justify-center transition-all"
                  style={{
                    width: 28, height: 28,
                    borderRadius: 'var(--theme-radius-sm, 6px)',
                    fontSize: 13, fontWeight: 900,
                    background: isDone ? 'rgb(var(--success))' : item.quantity > 1 ? 'rgba(var(--primary), 0.1)' : 'rgba(var(--bg-elevated), 0.6)',
                    border: `1px solid ${isDone ? 'rgb(var(--success))' : item.quantity > 1 ? 'rgba(var(--primary), 0.3)' : 'rgba(var(--border-color), 0.25)'}`,
                    color: isDone ? 'white' : item.quantity > 1 ? 'rgb(var(--primary))' : 'rgb(var(--text-main))',
                  }}
                  title="Mark item done"
                >
                  {isDone ? '✓' : item.quantity}
                </button>
                <div className={`flex-1 min-w-0 flex flex-col ${isDone ? 'line-through' : ''}`}>
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="uppercase line-clamp-2 leading-snug" style={{ fontSize: 13, fontWeight: 900, color: 'rgb(var(--text-main))' }}>
                      {item.name}
                    </span>
                    <span
                      className="shrink-0 mt-0.5 uppercase tracking-widest"
                      style={{
                        padding: '1px 4px',
                        borderRadius: 'var(--theme-radius-sm, 4px)',
                        fontSize: 7, fontWeight: 900,
                        background: 'rgba(var(--bg-app), 0.8)',
                        color: 'rgb(var(--text-muted))',
                        border: '1px solid rgba(var(--border-color), 0.15)',
                      }}
                    >
                      {getStationForItem(item)}
                    </span>
                  </div>

                  {mods.length > 0 && (
                    <div className="mt-0.5 pl-1.5 flex flex-col" style={{ borderLeft: '1px solid rgba(var(--border-color), 0.25)' }}>
                      {mods.map((m: any, mIdx: number) => (
                        <span key={mIdx} className="uppercase leading-snug" style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--text-muted))' }}>
                          + {m.optionName || m.name || m.groupName}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <span
                      className="mt-0.5 pl-1.5 block italic uppercase"
                      style={{
                        borderLeft: '1px solid rgba(var(--danger), 0.5)',
                        color: 'rgb(var(--danger))',
                        fontSize: 10, fontWeight: 700,
                      }}
                    >
                      {item.notes}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Footer — Bump hint ── */}
      <div
        className="py-1.5 text-center uppercase transition-all"
        style={{
          fontSize: 8, fontWeight: 900, letterSpacing: '0.2em',
          background: isPendingBump
            ? 'rgb(var(--primary))'
            : isReady
              ? 'rgba(var(--success), 0.08)'
              : 'rgba(var(--bg-elevated), 0.3)',
          color: isPendingBump
            ? 'white'
            : isReady
              ? 'rgb(var(--success))'
              : 'rgb(var(--text-muted))',
        }}
      >
        {isPendingBump ? '⚡ TAP AGAIN TO CONFIRM' : isReady ? '✓ TAP TO DELIVER' : 'TAP TWICE TO ADVANCE'}
      </div>
    </motion.button>
  );
});

/* ═══════════════════════════════════════════════════
   ⚡ Simple Grid — Flat view, one-tap-to-complete
   ═══════════════════════════════════════════════════ */
const SimpleGrid = React.memo(({ orders, readyOrders, getElapsedMins, getTimerUrgency, getStationForItem, updateOrderStatus, isArabic }: any) => {
  const allOrders = React.useMemo(() => [...orders, ...readyOrders], [orders, readyOrders]);

  // Chain through proper status transitions: PENDING → PREPARING → READY → DELIVERED
  const completeOrder = React.useCallback(async (order: any) => {
    try {
      if (order.status === OrderStatus.PENDING) await updateOrderStatus(order.id, OrderStatus.PREPARING, undefined, undefined, { skipPrint: true });
      if (order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARING) await updateOrderStatus(order.id, OrderStatus.READY, undefined, undefined, { skipPrint: true });
      await updateOrderStatus(order.id, OrderStatus.DELIVERED, undefined, undefined, { skipPrint: true });
    } catch { /* ignore if already transitioned */ }
  }, [updateOrderStatus]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-3 no-scrollbar">
      {allOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full opacity-25">
          <UtensilsCrossed size={48} style={{ color: 'rgb(var(--text-muted))' }} />
          <p className="uppercase tracking-widest mt-4" style={{ fontSize: 14, fontWeight: 900, color: 'rgb(var(--text-muted))' }}>No active orders</p>
          <p className="mt-1" style={{ fontSize: 11, color: 'rgb(var(--text-muted))', opacity: 0.6 }}>New orders will appear here automatically</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          <AnimatePresence mode="sync">
            {allOrders.map((order: any) => {
              const elapsed = getElapsedMins(order.createdAt);
              const urgency = getTimerUrgency(elapsed, order.status);
              const isReady = order.status === OrderStatus.READY;
              const urgencyToken = urgency === 'critical' ? '--danger' : urgency === 'risk' ? '--danger' : urgency === 'warning' ? '--warning' : urgency === 'ready' ? '--success' : '--success';

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  onDoubleClick={() => completeOrder(order)}
                  onClick={() => completeOrder(order)}
                  className="cursor-pointer overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.98]"
                  style={{
                    borderRadius: 'var(--theme-radius-lg, 16px)',
                    background: isReady ? 'rgba(var(--success), 0.08)' : urgency === 'critical' ? 'rgba(var(--danger), 0.06)' : 'rgba(var(--bg-card), 0.65)',
                    border: `2px solid ${isReady ? 'rgba(var(--success), 0.3)' : urgency === 'critical' ? 'rgba(var(--danger), 0.3)' : 'rgba(var(--border-color), 0.15)'}`,
                    backdropFilter: 'blur(var(--theme-blur, 8px))',
                    boxShadow: urgency === 'critical' ? '0 0 24px rgba(var(--danger), 0.12)' : 'var(--theme-shadow-card)',
                  }}
                >
                  {/* Progress bar */}
                  <div style={{ height: 4, background: 'rgba(var(--border-color), 0.08)' }}>
                    <div className="transition-all duration-1000" style={{
                      height: '100%',
                      width: `${isReady ? 100 : Math.min(100, (elapsed / SLA.critical) * 100)}%`,
                      background: isReady ? 'rgb(var(--success))' : `linear-gradient(90deg, rgb(var(--success)), rgb(var(${urgencyToken})))`,
                    }} />
                  </div>

                  {/* ── BIG ORDER NUMBER ── */}
                  <div className="px-4 pt-3 pb-2 flex items-start justify-between">
                    <div>
                      <span className="block uppercase tracking-widest" style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--text-muted))' }}>
                        {order.type || 'ORDER'}
                      </span>
                      <span className="block tabular-nums" style={{
                        fontSize: '2.5rem', fontWeight: 900, lineHeight: 1,
                        color: isReady ? 'rgb(var(--success))' : 'rgb(var(--text-main))',
                        letterSpacing: '-0.02em',
                      }}>
                        #{order.orderNumber || order.id.slice(0, 4)}
                      </span>
                    </div>
                    <div className="text-right">
                      {/* Timer */}
                      <div className="flex items-center gap-1 justify-end tabular-nums" style={{
                        fontSize: 13, fontWeight: 900,
                        color: `rgb(var(${urgencyToken}))`,
                      }}>
                        <Clock size={14} />
                        {elapsed}m
                        {urgency === 'critical' && <span className="animate-pulse">🔥</span>}
                      </div>
                      {/* Table/Mode */}
                      {order.tableId && (
                        <span className="block mt-1 uppercase" style={{ fontSize: 11, fontWeight: 900, color: 'rgb(var(--primary))' }}>
                          TABLE {order.tableId}
                        </span>
                      )}
                      {/* Status badge */}
                      <span className="inline-block mt-1 uppercase tracking-wider" style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--theme-radius-sm, 6px)',
                        fontSize: 9, fontWeight: 900,
                        background: isReady ? 'rgba(var(--success), 0.15)' : `rgba(var(${urgencyToken}), 0.12)`,
                        color: isReady ? 'rgb(var(--success))' : `rgb(var(${urgencyToken}))`,
                      }}>
                        {isReady ? 'READY' : order.status === OrderStatus.PREPARING ? 'COOKING' : 'QUEUED'}
                      </span>
                    </div>
                  </div>

                  {/* ── Notes ── */}
                  {(order.kitchenNotes || order.notes) && (
                    <div className="mx-4 mb-2 flex items-start gap-1.5 uppercase" style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--theme-radius-sm, 8px)',
                      background: 'rgba(var(--warning), 0.08)',
                      border: '1px solid rgba(var(--warning), 0.15)',
                      color: 'rgb(var(--warning))',
                      fontSize: 11, fontWeight: 700, lineHeight: 1.4,
                    }}>
                      <span className="shrink-0">📝</span>
                      <span className="line-clamp-3">{order.kitchenNotes || order.notes}</span>
                    </div>
                  )}

                  {/* ── Items list ── */}
                  <div className="px-4 pb-2" style={{ borderTop: '1px solid rgba(var(--border-color), 0.08)', paddingTop: 8 }}>
                    {order.items.map((item: any, idx: number) => {
                      const mods = Array.isArray(item.selectedModifiers) && item.selectedModifiers.length > 0 ? item.selectedModifiers : (Array.isArray(item.modifiers) ? item.modifiers : []);
                      return (
                        <div key={idx} className="flex items-start gap-2 py-1">
                          <span className="shrink-0 flex items-center justify-center tabular-nums" style={{
                            width: 24, height: 24,
                            borderRadius: 'var(--theme-radius-sm, 6px)',
                            fontSize: 13, fontWeight: 900,
                            background: item.quantity > 1 ? 'rgba(var(--primary), 0.12)' : 'rgba(var(--bg-elevated), 0.6)',
                            color: item.quantity > 1 ? 'rgb(var(--primary))' : 'rgb(var(--text-main))',
                            border: `1px solid ${item.quantity > 1 ? 'rgba(var(--primary), 0.2)' : 'rgba(var(--border-color), 0.2)'}`,
                          }}>
                            {item.quantity}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="block uppercase font-black leading-snug" style={{ fontSize: 13, color: 'rgb(var(--text-main))' }}>{item.name}</span>
                            {mods.map((m: any, mIdx: number) => (
                              <span key={mIdx} className="block uppercase" style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--text-muted))' }}>
                                + {m.optionName || m.name || m.groupName}
                              </span>
                            ))}
                            {item.notes && (
                              <span className="block italic uppercase mt-0.5" style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--danger))' }}>⚠ {item.notes}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Footer ── */}
                  <div className="py-2 text-center uppercase" style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: '0.15em',
                    background: isReady ? 'rgba(var(--success), 0.1)' : 'rgba(var(--bg-elevated), 0.3)',
                    color: isReady ? 'rgb(var(--success))' : 'rgb(var(--text-muted))',
                  }}>
                    {isReady ? '✓ TAP TO COMPLETE' : 'TAP TO MARK DONE'}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

export default KDS;
