import React, { useState, useMemo } from 'react';
import {
    Users,
    Timer,
    ChevronRight,
    LayoutGrid,
    Coffee,
    Plus,
    Search,
    Filter,
    Grid3X3,
    List,
    Maximize2,
    Crown,
    Percent,
    Layers
} from 'lucide-react';
import { Table, TableStatus, FloorZone, Order, OrderStatus } from '../types';

interface TableMapProps {
    tables: Table[];
    zones: FloorZone[];
    orders: Order[];
    onSelectTable: (table: Table) => void;
    lang: 'en' | 'ar';
    t: any;
    isDarkMode: boolean;
}

const TableMap: React.FC<TableMapProps> = ({ tables, zones, orders, onSelectTable, lang, t, isDarkMode }) => {
    const formattedZones = useMemo(() => {
        return [{ id: 'all', name: t.all_zones || (lang === 'ar' ? 'جميع المناطق' : 'All Zones'), color: '#64748b' }, ...zones];
    }, [zones, lang, t]);

    const [activeZone, setActiveZone] = useState<string>(zones[0]?.id || 'all');

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TableStatus | 'ALL'>('ALL');
    const [viewMode, setViewMode] = useState<'GRID' | 'COMPACT' | 'FLOOR'>('FLOOR');

    // Filter tables based on zone, search, and status
    const filteredTables = useMemo(() => {
        return tables.filter((table) => {
            // Zone filter
            if (activeZone !== 'all' && table.zoneId !== activeZone) return false;

            // Search filter
            if (searchQuery && !table.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

            // Status filter
            if (statusFilter !== 'ALL' && table.status !== statusFilter) return false;

            return true;
        });
    }, [tables, activeZone, searchQuery, statusFilter]);

    // Auto-switch to GRID if "All Zones" is selected
    React.useEffect(() => {
        if (activeZone === 'all') setViewMode('GRID');
        else setViewMode('FLOOR');
    }, [activeZone]);

    // Status statistics & Sales
    const stats = useMemo(() => {
        const openOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED);
        const closedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);

        return {
            available: tables.filter(t => t.status === TableStatus.AVAILABLE).length,
            occupied: tables.filter(t => t.status === TableStatus.OCCUPIED).length,
            reserved: tables.filter(t => t.status === TableStatus.RESERVED).length,
            dirty: tables.filter(t => t.status === TableStatus.DIRTY).length,
            total: tables.length,
            openSales: openOrders.reduce((sum, o) => sum + o.total, 0),
            closedSales: closedOrders.reduce((sum, o) => sum + o.total, 0)
        };
    }, [tables, orders]);

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
        switch (status) {
            case TableStatus.AVAILABLE: return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400';
            case TableStatus.OCCUPIED: return 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400';
            case TableStatus.RESERVED: return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 hover:border-amber-400';
            case TableStatus.DIRTY: return 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 hover:border-rose-400';
            default: return 'bg-slate-50 border-slate-200';
        }
    };

    const activeZoneData = formattedZones.find(z => z.id === activeZone) || formattedZones[0];

    // Compact table card
    const CompactTableCard = ({ table }: { table: Table }) => (
        <div
            onClick={() => onSelectTable(table)}
            className={`p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg hover:scale-105 flex items-center justify-between gap-2 ${getStatusBG(table.status)}`}
        >
            <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-lg ${getStatusColor(table.status)} text-white flex items-center justify-center font-black text-sm relative`}>
                    {table.name}
                    {table.isVIP && <Crown size={8} className="absolute -top-1 -right-1 text-amber-300" />}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Users size={10} /> {table.seats}
                </div>
            </div>
            {table.status === TableStatus.OCCUPIED && (
                <span className="text-xs font-black text-slate-800 dark:text-white">
                    ${table.currentOrderTotal?.toFixed(0) || '0'}
                </span>
            )}
        </div>
    );

    // Floor plan table
    const FloorTableCard = ({ table }: { table: Table }) => (
        <div
            onClick={() => onSelectTable(table)}
            style={{
                position: 'absolute',
                left: `${table.position.x}px`,
                top: `${table.position.y}px`,
                width: `${table.width}px`,
                height: `${table.height}px`
            }}
            className={`rounded-2xl ${table.shape === 'round' ? 'rounded-full' : ''
                } ${getStatusBG(table.status)} border-4 cursor-pointer transition-all hover:shadow-xl hover:scale-110 flex flex-col items-center justify-center relative shadow-sm`}
        >
            <span className="text-lg font-black text-slate-800 dark:text-white">{table.name}</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Users size={10} /> {table.seats}
            </div>
            {table.isVIP && <Crown size={12} className="absolute -top-3 -right-3 text-amber-500 bg-white dark:bg-slate-800 rounded-full p-1 shadow-lg border border-slate-100 dark:border-slate-700" />}
            {table.discount && table.discount > 0 && (
                <div className="absolute -top-3 -left-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    <Percent size={10} className="text-white" />
                </div>
            )}
            {table.status === TableStatus.OCCUPIED && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full shadow-md z-10 whitespace-nowrap">
                    ${table.currentOrderTotal?.toFixed(0) || '0'}
                </div>
            )}
        </div>
    );

    // Grid card
    const GridTableCard = ({ table }: { table: Table }) => (
        <div
            onClick={() => onSelectTable(table)}
            className={`group h-40 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] relative flex flex-col p-4 overflow-hidden ${getStatusBG(table.status)}`}
        >
            <div className="flex justify-between items-start z-10">
                <div className="flex flex-col text-slate-900 dark:text-white">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.table}</span>
                    <p className="text-3xl font-black">{table.name}</p>
                </div>
                <div className={`p-2 rounded-lg shadow ${getStatusColor(table.status)} text-white relative`}>
                    <Coffee size={14} />
                    {table.isVIP && <Crown size={10} className="absolute -top-1 -right-1 text-amber-300" />}
                </div>
            </div>

            <div className="mt-auto z-10 space-y-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-1 rounded-lg text-xs">
                        <Users size={10} className="text-slate-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">{table.seats}</span>
                    </div>
                </div>

                {table.status === TableStatus.OCCUPIED ? (
                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase">{t.bill}</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">${table.currentOrderTotal?.toFixed(2) || '0.00'}</p>
                        </div>
                        <ChevronRight size={14} className="text-indigo-600" />
                    </div>
                ) : (
                    <button className="w-full py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white transition-all">
                        {t.open_table}
                    </button>
                )}
            </div>

            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 ${getStatusColor(table.status)}`} />
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
                            <LayoutGrid className="text-indigo-600 w-5 h-5 md:w-6 md:h-6" />
                            <span className="truncate">{t.floor_map}</span>
                        </h1>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {stats.total} UNTS
                        </span>
                    </div>

                    <div className="hidden xl:flex items-center gap-6 border-l border-slate-200 dark:border-slate-800 pl-6">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'مبيعات مفتوحة' : 'Open Sales'}</p>
                            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">${stats.openSales.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'مبيعات مغلقة' : 'Closed Sales'}</p>
                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">${stats.closedSales.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-32 lg:w-48 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border-none rounded-xl text-xs md:text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {[
                            { mode: 'FLOOR', icon: Layers },
                            { mode: 'GRID', icon: Grid3X3 },
                            { mode: 'COMPACT', icon: Maximize2 }
                        ].map(({ mode, icon: Icon }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode as any)}
                                className={`p-2 rounded-lg transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Icon size={16} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Zone Selector */}
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-[1.25rem] overflow-x-auto no-scrollbar">
                {formattedZones.map(zone => (
                    <button
                        key={zone.id}
                        onClick={() => setActiveZone(zone.id)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 whitespace-nowrap shadow-sm ${activeZone === zone.id
                            ? 'bg-indigo-600 text-white translate-y-[-2px]'
                            : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        {zone.name}
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] ${activeZone === zone.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            {zone.id === 'all' ? tables.length : tables.filter(t => t.zoneId === zone.id).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-auto rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-inner relative">
                {viewMode === 'FLOOR' ? (
                    <div className="relative bg-slate-50 dark:bg-slate-900 shadow-2xl" style={{ width: '1600px', height: '1200px' }}>
                        {/* Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                        {filteredTables.map((table) => (
                            <FloorTableCard key={table.id} table={table} />
                        ))}
                    </div>
                ) : (
                    <div className={`grid ${viewMode === 'GRID'
                        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4'
                        : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3'
                        }`}>
                        {filteredTables.map((table) => (
                            viewMode === 'GRID'
                                ? <GridTableCard key={table.id} table={table} />
                                : <CompactTableCard key={table.id} table={table} />
                        ))}
                    </div>
                )}

                {filteredTables.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 opacity-20">
                        <LayoutGrid size={80} className="mb-4" />
                        <p className="font-black uppercase tracking-widest">{t.no_tables || 'No Data Found'}</p>
                    </div>
                )}
            </div>

            {/* Quick Status HUD */}
            <div className="flex justify-center gap-4 py-2">
                {[
                    { status: TableStatus.AVAILABLE, label: t.free, color: 'bg-emerald-500' },
                    { status: TableStatus.OCCUPIED, label: t.busy, color: 'bg-indigo-600' },
                    { status: TableStatus.RESERVED, label: t.reserved, color: 'bg-amber-500' },
                ].map(item => (
                    <div key={item.status} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableMap;
