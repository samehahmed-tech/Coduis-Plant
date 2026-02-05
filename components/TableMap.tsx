import React, { useState, useMemo } from 'react';
import {
    Users,
    LayoutGrid,
    Search,
    Grid3X3,
    Maximize2,
    Crown,
    Percent,
    Layers,
    List
} from 'lucide-react';
import { Table, TableStatus, FloorZone, Order, OrderStatus } from '../types';

interface TableMapProps {
    tables: Table[];
    zones: FloorZone[];
    orders: Order[];
    onSelectTable: (table: Table) => void;
    onResumeTable: (table: Table) => void;
    onTempBill: (table: Table) => void;
    onCloseTable: (table: Table) => void;
    onMergeTable: (table: Table) => void;
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    lang: 'en' | 'ar';
    t: any;
    isDarkMode: boolean;
}

const TableMap: React.FC<TableMapProps> = ({
    tables,
    zones,
    orders,
    onSelectTable,
    onResumeTable,
    onTempBill,
    onCloseTable,
    onMergeTable,
    onUpdateOrderStatus,
    lang,
    t,
    isDarkMode
}) => {
    const formattedZones = useMemo(() => {
        return [{ id: 'all', name: t.all_zones || (lang === 'ar' ? 'جميع المناطق' : 'All Zones'), color: '#64748b' }, ...zones];
    }, [zones, lang, t]);

    const [activeZone, setActiveZone] = useState<string>(zones[0]?.id || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter] = useState<TableStatus | 'ALL'>('ALL');
    const [viewMode, setViewMode] = useState<'GRID' | 'COMPACT' | 'LIST'>('GRID');
    void isDarkMode;
    const isRtl = lang === 'ar';

    const tableTotals = useMemo(() => {
        const map: Record<string, number> = {};
        orders
            .filter(o => o.tableId && o.status !== OrderStatus.DELIVERED)
            .forEach(o => {
                const key = o.tableId as string;
                map[key] = (map[key] || 0) + (o.total || 0);
            });
        return map;
    }, [orders]);

    const activeOrderByTable = useMemo(() => {
        const map: Record<string, Order> = {};
        const list = orders.filter(o => o.tableId && o.status !== OrderStatus.DELIVERED);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        list.forEach(o => {
            const key = o.tableId as string;
            if (!map[key]) map[key] = o;
        });
        return map;
    }, [orders]);

    const tableSummaries = useMemo(() => {
        const map: Record<string, { items: number; total: number; status: OrderStatus; openedAt?: Date; lastActivity?: Date }> = {};
        orders
            .filter(o => o.tableId && o.status !== OrderStatus.DELIVERED)
            .forEach(o => {
                const key = o.tableId as string;
                const itemsCount = (o.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
                if (!map[key]) {
                    map[key] = {
                        items: itemsCount,
                        total: o.total || 0,
                        status: o.status,
                        openedAt: o.createdAt ? new Date(o.createdAt) : undefined,
                        lastActivity: o.createdAt ? new Date(o.createdAt) : undefined
                    };
                } else {
                    map[key].items += itemsCount;
                    map[key].total += o.total || 0;
                    if (o.createdAt) {
                        const activity = new Date(o.createdAt);
                        if (!map[key].lastActivity || activity > map[key].lastActivity) {
                            map[key].lastActivity = activity;
                        }
                    }
                }
            });
        return map;
    }, [orders]);

    const decoratedTables = useMemo(() => {
        return tables.map(table => {
            if (tableTotals[table.id]) {
                return { ...table, status: TableStatus.OCCUPIED, currentOrderTotal: tableTotals[table.id] };
            }
            return table;
        });
    }, [tables, tableTotals]);

    const sortedDecoratedTables = useMemo(() => {
        const normalize = (value?: string) => {
            if (!value) return { num: Number.MAX_SAFE_INTEGER, text: '' };
            const match = value.match(/\d+/);
            const num = match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
            return { num, text: value.toLowerCase() };
        };
        return [...decoratedTables].sort((a, b) => {
            const aKey = normalize(a.name || a.id);
            const bKey = normalize(b.name || b.id);
            if (aKey.num !== bKey.num) return aKey.num - bKey.num;
            return aKey.text.localeCompare(bKey.text);
        });
    }, [decoratedTables]);

    const filteredTables = useMemo(() => {
        return sortedDecoratedTables.filter((table) => {
            if (activeZone !== 'all' && table.zoneId !== activeZone) return false;
            if (searchQuery && !table.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (statusFilter !== 'ALL' && table.status !== statusFilter) return false;
            return true;
        });
    }, [sortedDecoratedTables, activeZone, searchQuery, statusFilter]);

    React.useEffect(() => {
        if (activeZone === 'all') setViewMode('GRID');
        else setViewMode('FLOOR');
    }, [activeZone]);

    const stats = useMemo(() => {
        const openOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED);
        const closedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
        return {
            available: decoratedTables.filter(t => t.status === TableStatus.AVAILABLE).length,
            occupied: decoratedTables.filter(t => t.status === TableStatus.OCCUPIED).length,
            reserved: decoratedTables.filter(t => t.status === TableStatus.RESERVED).length,
            dirty: decoratedTables.filter(t => t.status === TableStatus.DIRTY).length,
            total: decoratedTables.length,
            openSales: openOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            closedSales: closedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
        };
    }, [decoratedTables, orders]);

    const getElapsedMinutes = (date?: Date) => {
        if (!date) return null;
        return Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
    };

    const getStatusColor = (status: TableStatus) => {
        switch (status) {
            case TableStatus.AVAILABLE: return 'bg-emerald-500';
            case TableStatus.OCCUPIED: return 'bg-indigo-600';
            case TableStatus.RESERVED: return 'bg-amber-500';
            case TableStatus.DIRTY: return 'bg-rose-500';
            default: return 'bg-slate-400';
        }
    };

    const getStatusBG = (status: TableStatus) => {
        const base = 'bg-card border border-border shadow-sm';
        switch (status) {
            case TableStatus.AVAILABLE: return `${base} ring-1 ring-emerald-400/40 dark:ring-emerald-400/30 hover:shadow-md`;
            case TableStatus.OCCUPIED: return `${base} ring-1 ring-indigo-400/40 dark:ring-indigo-400/30 hover:shadow-md`;
            case TableStatus.RESERVED: return `${base} ring-1 ring-amber-400/40 dark:ring-amber-400/30 hover:shadow-md`;
            case TableStatus.DIRTY: return `${base} ring-1 ring-rose-400/40 dark:ring-rose-400/30 hover:shadow-md`;
            default: return `${base} ring-1 ring-slate-200/60 dark:ring-slate-700/60`;
        }
    };

    const getStatusLabel = (status: TableStatus) => {
        switch (status) {
            case TableStatus.AVAILABLE: return t.free;
            case TableStatus.OCCUPIED: return t.busy;
            case TableStatus.RESERVED: return t.reserved;
            case TableStatus.DIRTY: return t.dirty;
            default: return '';
        }
    };

    const getStatusBadge = (status: TableStatus) => {
        switch (status) {
            case TableStatus.AVAILABLE: return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
            case TableStatus.OCCUPIED: return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30';
            case TableStatus.RESERVED: return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30';
            case TableStatus.DIRTY: return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30';
            default: return 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/30';
        }
    };

    const renderStatusButtons = (table: Table) => {
        const order = activeOrderByTable[table.id];
        if (!order) return null;
        const buttons = [
            { status: OrderStatus.PENDING, label: t.status_pending || 'Pending', color: 'bg-amber-500' },
            { status: OrderStatus.PREPARING, label: t.status_preparing || 'Preparing', color: 'bg-blue-500' },
            { status: OrderStatus.READY, label: t.status_ready || 'Ready', color: 'bg-emerald-600' }
        ];
        return (
            <div className="flex items-center gap-1">
                {buttons.map(btn => {
                    const isActive = order.status === btn.status;
                    return (
                        <button
                            key={btn.status}
                            onClick={(e) => { e.stopPropagation(); onUpdateOrderStatus(order.id, btn.status); }}
                            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${btn.color} ${isActive ? 'text-white' : 'text-white/70 opacity-60'}`}
                        >
                            {btn.label}
                        </button>
                    );
                })}
            </div>
        );
    };

    const CompactTableCard = ({ table }: { table: Table }) => {
        const summary = tableSummaries[table.id];
        const hasTotal = Boolean(tableTotals[table.id]);
        const elapsedTime = summary?.openedAt ? getElapsedMinutes(summary.openedAt) : null;
        const isUrgent = elapsedTime && elapsedTime > 20;

        return (
            <div
                onClick={() => onSelectTable(table)}
                className={`group rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${getStatusBG(table.status)} ${isUrgent ? 'ring-2 ring-rose-500' : ''} ${isRtl ? 'text-right' : 'text-left'}`}
            >
                {/* Status Bar */}
                <div className={`h-1.5 ${getStatusColor(table.status)}`} />

                <div className="p-3">
                    {/* Header */}
                    <div className={`flex items-center justify-between gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <span className="text-lg font-black text-main">{table.name}</span>
                            </div>
                            <div>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${getStatusBadge(table.status)}`}>
                                    {getStatusLabel(table.status)}
                                </span>
                            </div>
                        </div>

                        {/* Timer */}
                        {hasTotal && elapsedTime && (
                            <div className={`px-2 py-1 rounded-lg text-center ${isUrgent ? 'bg-rose-500/20 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                <span className="text-xs font-black">{elapsedTime}</span>
                                <span className="text-[7px] font-bold">{t.min_short || 'm'}</span>
                            </div>
                        )}
                    </div>

                    {/* Info Row */}
                    <div className={`mt-2 flex items-center gap-1.5 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                            <Users size={10} className="text-slate-400" />
                            <span className="font-bold text-main">{table.seats}</span>
                        </span>
                        {summary && summary.items > 0 && (
                            <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded text-[10px] text-indigo-600">
                                <Layers size={10} />
                                <span className="font-bold">{summary.items}</span>
                            </span>
                        )}
                    </div>

                    {/* Bill & Action */}
                    {hasTotal ? (
                        <div className={`mt-2 flex items-center justify-between gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-lg p-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div>
                                <p className="text-[8px] font-black text-indigo-500 uppercase">{t.bill}</p>
                                <p className="text-sm font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {t.currency || 'ج.م'} {tableTotals[table.id].toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onResumeTable(table); }}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-black uppercase shadow-sm transition-all"
                            >
                                {lang === 'ar' ? 'افتح' : 'Open'}
                            </button>
                        </div>
                    ) : (
                        <button className="mt-2 w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-[9px] font-black uppercase shadow-sm transition-all">
                            {t.open_table}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const GridTableCard = ({ table }: { table: Table }) => {
        const summary = tableSummaries[table.id];
        const hasTotal = Boolean(tableTotals[table.id]);
        const elapsedTime = summary?.openedAt ? getElapsedMinutes(summary.openedAt) : null;
        const isUrgent = elapsedTime && elapsedTime > 20;
        const order = activeOrderByTable[table.id];

        return (
            <div
                onClick={() => onSelectTable(table)}
                className={`group rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative flex flex-col overflow-hidden ${getStatusBG(table.status)} ${isUrgent ? 'ring-2 ring-rose-500 animate-pulse' : ''} ${isRtl ? 'text-right' : 'text-left'}`}
                style={{ minHeight: hasTotal ? '280px' : '200px' }}
            >
                {/* Status Bar with Gradient */}
                <div className={`h-2 ${getStatusColor(table.status)}`}
                    style={{
                        background: table.status === TableStatus.OCCUPIED
                            ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                            : table.status === TableStatus.AVAILABLE
                                ? 'linear-gradient(90deg, #10b981, #34d399)'
                                : undefined
                    }}
                />

                {/* Header Section */}
                <div className={`flex justify-between items-start p-4 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner">
                            <span className="text-2xl font-black text-main">{table.name}</span>
                        </div>
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted">{t.table}</div>
                            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${getStatusBadge(table.status)}`}>
                                    {getStatusLabel(table.status)}
                                </span>
                                {table.isVIP && <Crown size={14} className="text-amber-500" />}
                            </div>
                        </div>
                    </div>

                    {/* Timer Badge for Occupied Tables */}
                    {hasTotal && elapsedTime && (
                        <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${isUrgent ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                            <span className="text-lg font-black">{elapsedTime}</span>
                            <span className="text-[8px] font-bold uppercase">{t.min_short || 'min'}</span>
                        </div>
                    )}
                </div>

                {/* Info Row */}
                <div className={`px-4 py-2 flex items-center gap-2 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl">
                        <Users size={12} className="text-slate-500" />
                        <span className="text-xs font-bold text-main">{table.seats}</span>
                    </span>
                    {summary && summary.items > 0 && (
                        <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-1.5 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <Layers size={12} />
                            <span className="text-xs font-bold">{summary.items} {lang === 'ar' ? 'صنف' : 'items'}</span>
                        </span>
                    )}
                    {table.discount && table.discount > 0 && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1.5 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <Percent size={12} />
                            <span className="text-xs font-bold">{table.discount}%</span>
                        </span>
                    )}
                </div>

                {/* Order Status Buttons */}
                {order && (
                    <div className={`px-4 py-2 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        {[
                            { status: OrderStatus.PENDING, label: t.status_pending || 'Pending', color: 'bg-amber-500', activeColor: 'bg-amber-500' },
                            { status: OrderStatus.PREPARING, label: t.status_preparing || 'Prep', color: 'bg-blue-500', activeColor: 'bg-blue-500' },
                            { status: OrderStatus.READY, label: t.status_ready || 'Ready', color: 'bg-emerald-500', activeColor: 'bg-emerald-500' }
                        ].map(btn => {
                            const isActive = order.status === btn.status;
                            return (
                                <button
                                    key={btn.status}
                                    onClick={(e) => { e.stopPropagation(); onUpdateOrderStatus(order.id, btn.status); }}
                                    className={`flex-1 px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${isActive
                                        ? `${btn.activeColor} text-white shadow-lg scale-105`
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    {btn.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Bill Section - Always Visible for Occupied */}
                <div className="mt-auto p-4 pt-2">
                    {hasTotal ? (
                        <div className="space-y-3">
                            {/* Bill Amount */}
                            <div className={`flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div>
                                    <div className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">{t.bill}</div>
                                    <div className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                        {t.currency || 'ج.م'} {tableTotals[table.id].toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Always Visible */}
                            <div className={`grid grid-cols-4 gap-1.5 ${isRtl ? 'direction-rtl' : ''}`}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onResumeTable(table); }}
                                    className="col-span-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-black uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                                >
                                    {t.resume || 'استئناف'}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onTempBill(table); }}
                                    className="col-span-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
                                >
                                    {t.temp_short || 'مؤقت'}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onCloseTable(table); }}
                                    className="col-span-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                                >
                                    {t.close_table || 'إغلاق'}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onMergeTable(table); }}
                                    className="col-span-1 py-2.5 rounded-xl bg-slate-600 hover:bg-slate-700 text-white text-[8px] font-black uppercase tracking-wider shadow-lg shadow-slate-500/30 transition-all hover:scale-105"
                                >
                                    {t.merge_tables || 'دمج'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02]">
                            {t.open_table}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const ListTableRow = ({ table }: { table: Table }) => {
        const summary = tableSummaries[table.id];
        const hasTotal = Boolean(tableTotals[table.id]);
        const lastUpdate = summary?.lastActivity ? getElapsedMinutes(summary.lastActivity) : null;
        return (
            <div
                onClick={() => onSelectTable(table)}
                className={`group grid grid-cols-12 items-center gap-3 rounded-2xl border-2 px-4 py-3 cursor-pointer transition-all hover:shadow-md ${getStatusBG(table.status)} ${isRtl ? 'text-right' : 'text-left'}`}
            >
                <div className={`col-span-4 flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="h-11 w-11 rounded-xl bg-elevated border border-border flex items-center justify-center text-lg font-black text-main">
                        {table.name}
                    </div>
                    <div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted">{t.table}</div>
                        <div className="text-base font-black text-main">{table.name}</div>
                    </div>
                </div>

                <div className={`col-span-2 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest max-w-[84px] truncate ${getStatusBadge(table.status)}`}>
                        {getStatusLabel(table.status)}
                    </span>
                </div>

                <div className={`col-span-2 flex items-center gap-2 text-[11px] text-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className="inline-flex items-center gap-1 bg-elevated px-2 py-1 rounded-lg">
                        <Users size={12} />
                        <span className="font-bold text-main">{table.seats}</span>
                    </span>
                    {summary ? (
                        <span className="inline-flex items-center gap-1 bg-elevated px-2 py-1 rounded-lg">
                            <Layers size={12} />
                            <span className="font-bold text-main">{summary.items}</span>
                        </span>
                    ) : null}
                </div>

                <div className={`col-span-2 ${isRtl ? 'text-left' : 'text-right'}`}>
                    <div className="text-[9px] font-black uppercase text-muted">{t.bill}</div>
                    <div className="text-sm font-black text-main">
                        {hasTotal ? `${t.currency || 'EGP'} ${tableTotals[table.id].toFixed(0)}` : '—'}
                    </div>
                    {lastUpdate ? (
                        <div className="text-[9px] font-black uppercase text-muted">
                            {t.last_update || 'Last'} {lastUpdate} {t.min_short || 'm'}
                        </div>
                    ) : null}
                </div>

                <div className={`col-span-2 flex items-center justify-end gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    {hasTotal ? (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onResumeTable(table); }}
                                className="px-2.5 py-1 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-sm"
                            >
                                {t.resume || 'Resume'}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onTempBill(table); }}
                                className="px-2.5 py-1 rounded-lg bg-elevated text-main text-[9px] font-black uppercase tracking-widest border border-border"
                            >
                                {t.temp_short || 'Temp'}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onCloseTable(table); }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest shadow-sm"
                            >
                                {t.close_table || 'Close'}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onMergeTable(table); }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest shadow-sm"
                            >
                                {t.merge_tables || 'Merge'}
                            </button>
                        </>
                    ) : (
                        <button className="px-3 py-1.5 rounded-lg bg-elevated text-main text-[9px] font-black uppercase tracking-widest border border-border">
                            {t.open_table}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-300">
            {/* Enhanced Header with Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <LayoutGrid className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {t.floor_map}
                            </h1>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {stats.total} {lang === 'ar' ? 'ترابيزة' : 'Tables'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Available count */}
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                            <p className="text-[9px] font-black text-emerald-600 uppercase">{t.free || 'Available'}</p>
                            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{stats.available}</p>
                        </div>
                    </div>

                    {/* Occupied count */}
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        <div className="w-3 h-3 rounded-full bg-indigo-600" />
                        <div>
                            <p className="text-[9px] font-black text-indigo-600 uppercase">{t.busy || 'Occupied'}</p>
                            <p className="text-lg font-black text-indigo-700 dark:text-indigo-400">{stats.occupied}</p>
                        </div>
                    </div>

                    {/* Reserved count */}
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div>
                            <p className="text-[9px] font-black text-amber-600 uppercase">{t.reserved || 'Reserved'}</p>
                            <p className="text-lg font-black text-amber-700 dark:text-amber-400">{stats.reserved}</p>
                        </div>
                    </div>

                    {/* Open Sales */}
                    <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        <div>
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{lang === 'ar' ? 'المبيعات المفتوحة' : 'Open Sales'}</p>
                            <p className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {t.currency || 'ج.م'} {stats.openSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Closed Sales */}
                    <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/50 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div>
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{lang === 'ar' ? 'المبيعات المغلقة' : 'Closed Sales'}</p>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                {t.currency || 'ج.م'} {stats.closedSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and View Mode */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-none">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} size={16} />
                        <input
                            type="text"
                            placeholder={lang === 'ar' ? 'بحث عن ترابيزة...' : 'Search tables...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full lg:w-48 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        />
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl gap-1">
                        {[
                            { mode: 'GRID', icon: Grid3X3, label: lang === 'ar' ? 'شبكة' : 'Grid' },
                            { mode: 'COMPACT', icon: Maximize2, label: lang === 'ar' ? 'مضغوط' : 'Compact' },
                            { mode: 'LIST', icon: List, label: lang === 'ar' ? 'قائمة' : 'List' }
                        ].map(({ mode, icon: Icon, label }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode as any)}
                                title={label}
                                className={`p-2.5 rounded-lg transition-all ${viewMode === mode
                                    ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600 scale-105'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            >
                                <Icon size={18} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Zone Tabs */}
            <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-x-auto no-scrollbar">
                {formattedZones.map(zone => (
                    <button
                        key={zone.id}
                        onClick={() => setActiveZone(zone.id)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 whitespace-nowrap ${activeZone === zone.id
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                            : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'
                            }`}
                    >
                        {zone.name}
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${activeZone === zone.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            {zone.id === 'all' ? decoratedTables.length : decoratedTables.filter(t => t.zoneId === zone.id).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 md:p-6 shadow-inner relative">
                {viewMode === 'LIST' ? (
                    <div className="flex flex-col gap-3">
                        <div className={`grid grid-cols-12 gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl ${isRtl ? 'text-right' : 'text-left'}`}>
                            <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-slate-500">{t.table}</div>
                            <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{t.status || (lang === 'ar' ? 'الحالة' : 'Status')}</div>
                            <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{lang === 'ar' ? 'السعة' : 'Capacity'}</div>
                            <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{t.bill}</div>
                            <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-slate-500">{lang === 'ar' ? 'إجراءات' : 'Actions'}</div>
                        </div>
                        {filteredTables.map((table) => (
                            <ListTableRow key={table.id} table={table} />
                        ))}
                    </div>
                ) : (
                    <div className={`grid ${viewMode === 'GRID'
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5'
                        : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3'
                        }`}>
                        {filteredTables.map((table) => (
                            viewMode === 'GRID'
                                ? <GridTableCard key={table.id} table={table} />
                                : <CompactTableCard key={table.id} table={table} />
                        ))}
                    </div>
                )}

                {filteredTables.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-8 text-center">
                            <LayoutGrid size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                            <p className="font-black uppercase tracking-widest text-slate-400 text-sm">{t.no_tables || 'No Tables Found'}</p>
                            <p className="text-xs text-slate-400 mt-1">{lang === 'ar' ? 'حاول تغيير معايير البحث' : 'Try adjusting your search'}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend Footer */}
            <div className="flex flex-wrap justify-center items-center gap-4 py-3 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                {[
                    { status: TableStatus.AVAILABLE, label: t.free || 'Available', color: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-400' },
                    { status: TableStatus.OCCUPIED, label: t.busy || 'Occupied', color: 'bg-indigo-600', gradient: 'from-indigo-600 to-purple-500' },
                    { status: TableStatus.RESERVED, label: t.reserved || 'Reserved', color: 'bg-amber-500', gradient: 'from-amber-500 to-amber-400' },
                    { status: TableStatus.DIRTY, label: t.dirty || 'Dirty', color: 'bg-rose-500', gradient: 'from-rose-500 to-rose-400' }
                ].map(item => (
                    <div key={item.status} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${item.gradient}`} />
                        <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableMap;
