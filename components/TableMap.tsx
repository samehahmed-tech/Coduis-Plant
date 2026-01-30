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
import { Table, TableStatus, FloorZone } from '../types';

interface TableMapProps {
    tables: Table[];
    onSelectTable: (table: Table) => void;
    lang: 'en' | 'ar';
    t: any;
    isDarkMode: boolean;
}

const DEFAULT_ZONES: FloorZone[] = [
    { id: 'all', name: 'All Zones', color: '#64748b' },
    { id: 'hall', name: 'Main Hall', color: '#6366f1' },
    { id: 'terrace', name: 'Terrace', color: '#10b981' },
    { id: 'vip', name: 'VIP Lounge', color: '#f59e0b' },
];

const TableMap: React.FC<TableMapProps> = ({ tables, onSelectTable, lang, t, isDarkMode }) => {
    const [activeZone, setActiveZone] = useState<string>('all');
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

    // Status statistics
    const stats = useMemo(() => ({
        available: tables.filter(t => t.status === TableStatus.AVAILABLE).length,
        occupied: tables.filter(t => t.status === TableStatus.OCCUPIED).length,
        reserved: tables.filter(t => t.status === TableStatus.RESERVED).length,
        dirty: tables.filter(t => t.status === TableStatus.DIRTY).length,
        total: tables.length
    }), [tables]);

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

    const activeZoneData = DEFAULT_ZONES.find(z => z.id === activeZone) || DEFAULT_ZONES[0];

    // Compact table card for high-density view
    const CompactTableCard = ({ table }: { table: Table }) => (
        <div
            onClick={() => table.status !== TableStatus.DIRTY && onSelectTable(table)}
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
            onClick={() => table.status !== TableStatus.DIRTY && onSelectTable(table)}
            style={{
                position: 'absolute',
                left: `${table.position?.x || 50}%`,
                top: `${table.position?.y || 50}%`,
                transform: 'translate(-50%, -50%)'
            }}
            className={`w-20 h-20 rounded-2xl ${table.shape === 'round' ? 'rounded-full' : table.shape === 'rectangle' ? 'w-28' : ''
                } ${getStatusBG(table.status)} border-2 cursor-pointer transition-all hover:shadow-xl hover:scale-110 flex flex-col items-center justify-center relative`}
        >
            <span className="text-lg font-black text-slate-800 dark:text-white">{table.name}</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Users size={10} /> {table.seats}
            </div>
            {table.isVIP && <Crown size={12} className="absolute -top-1.5 -right-1.5 text-amber-500" />}
            {table.discount && table.discount > 0 && (
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Percent size={8} className="text-white" />
                </div>
            )}
            {table.status === TableStatus.OCCUPIED && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full">
                    ${table.currentOrderTotal?.toFixed(0) || '0'}
                </div>
            )}
        </div>
    );

    // Grid card
    const GridTableCard = ({ table }: { table: Table }) => (
        <div
            onClick={() => table.status !== TableStatus.DIRTY && onSelectTable(table)}
            className={`group h-40 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] relative flex flex-col p-4 overflow-hidden ${getStatusBG(table.status)}`}
        >
            <div className="flex justify-between items-start z-10">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Table</span>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{table.name}</p>
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
                    {table.status === TableStatus.OCCUPIED && (
                        <div className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-lg text-xs">
                            <Timer size={10} className="text-indigo-600" />
                            <span className="font-bold text-indigo-600">45m</span>
                        </div>
                    )}
                    {table.discount && table.discount > 0 && (
                        <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg text-xs">
                            <Percent size={10} className="text-green-600" />
                            <span className="font-bold text-green-600">{table.discount}%</span>
                        </div>
                    )}
                </div>

                {table.status === TableStatus.OCCUPIED ? (
                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase">Bill</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">${table.currentOrderTotal?.toFixed(2) || '0.00'}</p>
                        </div>
                        <ChevronRight size={14} className="text-indigo-600" />
                    </div>
                ) : (
                    <button className="w-full py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white transition-all">
                        {lang === 'ar' ? 'فتح' : 'Open'}
                    </button>
                )}
            </div>

            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 ${getStatusColor(table.status)}`} />
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-3 md:gap-4 animate-in fade-in duration-300">
            {/* Header - Flexible for Mobile */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                    <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <LayoutGrid className="text-indigo-600 w-5 h-5 md:w-6 md:h-6" />
                        <span className="truncate">{lang === 'ar' ? 'خريطة الطاولات' : 'Floor Map'}</span>
                    </h1>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                        {stats.total}
                    </span>
                </div>

                {/* Controls - Adaptive */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                        <input
                            type="text"
                            placeholder={lang === 'ar' ? 'البحث...' : 'Search...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-32 lg:w-40 pl-8 pr-3 py-1.5 md:py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-2 md:px-3 py-1.5 md:py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs md:text-sm font-bold outline-none flex-shrink-0"
                    >
                        <option value="ALL">{lang === 'ar' ? 'الكل' : 'All'}</option>
                        <option value={TableStatus.AVAILABLE}>{lang === 'ar' ? 'متاح' : 'Free'}</option>
                        <option value={TableStatus.OCCUPIED}>{lang === 'ar' ? 'مشغول' : 'Busy'}</option>
                    </select>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 md:p-1 rounded-lg flex-shrink-0">
                        {[
                            { mode: 'FLOOR', icon: Layers },
                            { mode: 'GRID', icon: Grid3X3 },
                            { mode: 'COMPACT', icon: Maximize2 }
                        ].map(({ mode, icon: Icon }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode as any)}
                                className={`p-1.5 rounded transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Icon size={14} className="md:w-4 md:h-4" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Zone Tabs + Stats */}
            <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
                    {DEFAULT_ZONES.map(zone => (
                        <button
                            key={zone.id}
                            onClick={() => setActiveZone(zone.id)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${activeZone === zone.id
                                ? 'shadow text-white'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                            style={{ backgroundColor: activeZone === zone.id ? zone.color : undefined }}
                        >
                            {zone.name}
                            <span className={`px-1 py-0.5 rounded text-[9px] ${activeZone === zone.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                {zone.id === 'all' ? tables.length : tables.filter(t => t.zoneId === zone.id).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Quick Stats */}
                <div className="flex gap-2">
                    {[
                        { status: TableStatus.AVAILABLE, count: stats.available, color: 'bg-emerald-500' },
                        { status: TableStatus.OCCUPIED, count: stats.occupied, color: 'bg-indigo-600' },
                        { status: TableStatus.RESERVED, count: stats.reserved, color: 'bg-amber-500' },
                    ].map(item => (
                        <button
                            key={item.status}
                            onClick={() => setStatusFilter(statusFilter === item.status ? 'ALL' : item.status)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${statusFilter === item.status
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">{item.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Floor Plan / Grid */}
            {viewMode === 'FLOOR' ? (
                <div
                    className="flex-1 relative rounded-2xl border-2 border-dashed overflow-hidden min-h-[500px]"
                    style={{
                        borderColor: activeZoneData.color,
                        backgroundColor: `${activeZoneData.color}08`,
                        backgroundImage: 'radial-gradient(circle, rgba(100,116,139,0.05) 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                >
                    {/* Zone Label */}
                    <div
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white z-10"
                        style={{ backgroundColor: activeZoneData.color }}
                    >
                        {activeZoneData.name}
                    </div>

                    {filteredTables.map((table) => (
                        <FloorTableCard key={table.id} table={table} />
                    ))}

                    {filteredTables.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <Filter size={40} className="mb-3 opacity-30" />
                            <p className="font-bold text-sm">{lang === 'ar' ? 'لا توجد طاولات' : 'No tables found'}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className={`flex-1 overflow-y-auto ${viewMode === 'GRID'
                    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3'
                    : 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2'
                    }`}>
                    {filteredTables.map((table) => (
                        viewMode === 'GRID'
                            ? <GridTableCard key={table.id} table={table} />
                            : <CompactTableCard key={table.id} table={table} />
                    ))}

                    {filteredTables.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                            <Filter size={40} className="mb-3 opacity-30" />
                            <p className="font-bold">{lang === 'ar' ? 'لا توجد طاولات' : 'No tables match filter'}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TableMap;
