import React, { useState } from 'react';
import {
    Users,
    Timer,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    LayoutGrid,
    Coffee,
    MoreVertical,
    Plus
} from 'lucide-react';
import { Table, TableStatus } from '../types';

interface TableMapProps {
    tables: Table[];
    onSelectTable: (table: Table) => void;
    lang: 'en' | 'ar';
    t: any;
    isDarkMode: boolean;
}

const TableMap: React.FC<TableMapProps> = ({ tables, onSelectTable, lang, t, isDarkMode }) => {
    const [activeSection, setActiveSection] = useState<'HALL' | 'VIP' | 'TERRACE'>('HALL');

    const sections = [
        { id: 'HALL', label: lang === 'ar' ? 'الصالة الرئيسية' : 'Main Hall' },
        { id: 'VIP', label: lang === 'ar' ? 'قسم VIP' : 'VIP Section' },
        { id: 'TERRACE', label: lang === 'ar' ? 'التراس' : 'Terrace' },
    ];

    // Mock categorizing tables for demo purposes until real data is updated
    const filteredTables = tables.filter((_, i) => {
        if (activeSection === 'VIP') return i >= 8;
        if (activeSection === 'TERRACE') return i >= 5 && i < 8;
        return i < 5;
    });

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
            case TableStatus.AVAILABLE: return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800';
            case TableStatus.OCCUPIED: return 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800';
            case TableStatus.RESERVED: return 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800';
            case TableStatus.DIRTY: return 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-800';
            default: return 'bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="flex flex-col h-full gap-8 animate-in fade-in duration-500">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <LayoutGrid className="text-indigo-600" size={32} />
                        {lang === 'ar' ? 'خريطة الطاولات' : 'Table Floor Plan'}
                    </h1>
                    <p className="text-slate-500 font-bold mt-1">
                        {lang === 'ar' ? 'إجمالي 12 طاولة متوفرة اليوم' : 'Total 12 tables available today'}
                    </p>
                </div>

                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.5rem] shadow-sm">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id as any)}
                            className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all uppercase tracking-widest ${activeSection === section.id
                                ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 px-1">
                {[
                    { status: TableStatus.AVAILABLE, label: lang === 'ar' ? 'متاحة' : 'Available', count: 8 },
                    { status: TableStatus.OCCUPIED, label: lang === 'ar' ? 'مشغولة' : 'Occupied', count: 3 },
                    { status: TableStatus.RESERVED, label: lang === 'ar' ? 'محجوزة' : 'Reserved', count: 1 },
                    { status: TableStatus.DIRTY, label: lang === 'ar' ? 'تحتاج تنظيف' : 'Need Cleaning', count: 0 },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(item.status)} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{item.count}</span>
                    </div>
                ))}
            </div>

            {/* Floor Map */}
            <div className={`relative flex-1 ${activeSection === 'HALL' ? 'min-h-[600px] bg-slate-50 dark:bg-slate-950/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800' : 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'}`}>
                {filteredTables.map((table) => {
                    const useCoordinates = activeSection === 'HALL' && table.position;
                    const style: React.CSSProperties = useCoordinates ? {
                        position: 'absolute',
                        left: `${table.position!.x}%`,
                        top: `${table.position!.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '280px',
                        height: '240px'
                    } : {};

                    return (
                        <div
                            key={table.id}
                            onClick={() => table.status !== TableStatus.DIRTY && onSelectTable(table)}
                            style={style}
                            className={`group rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 hover:translate-y--2 hover:shadow-2xl relative flex flex-col p-8 overflow-hidden ${getStatusBG(table.status)} ${!useCoordinates ? 'h-64' : ''}`}
                        >
                            {/* Table Number & Status Indicator */}
                            <div className="flex justify-between items-start z-10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Table</span>
                                    <p className="text-5xl font-black text-slate-900 dark:text-white mt-1 group-hover:scale-110 transition-transform origin-left">{table.name}</p>
                                </div>
                                <div className={`p-4 rounded-[1.5rem] shadow-lg ${getStatusColor(table.status)} text-white transform group-hover:rotate-12 transition-transform`}>
                                    <Coffee size={24} />
                                </div>
                            </div>

                            {/* Table Info */}
                            <div className="mt-auto z-10 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-white/20">
                                        <Users size={14} className="text-slate-500" />
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{table.seats} Pax</span>
                                    </div>
                                    {table.status === TableStatus.OCCUPIED && (
                                        <div className="flex items-center gap-1.5 bg-indigo-600/10 px-3 py-1.5 rounded-xl border border-indigo-600/20">
                                            <Timer size={14} className="text-indigo-600" />
                                            <span className="text-xs font-black text-indigo-600">45m</span>
                                        </div>
                                    )}
                                </div>

                                {table.status === TableStatus.OCCUPIED ? (
                                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Current Bill</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">EGP {table.currentOrderTotal?.toFixed(2) || '0.00'}</p>
                                        </div>
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/50 rounded-xl text-indigo-600 group-hover:translate-x-1 transition-transform">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                ) : (
                                    <button className="w-full py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all">
                                        {lang === 'ar' ? 'فتح الطلب' : 'Start Order'}
                                    </button>
                                )}
                            </div>

                            {/* Decorative Background Element */}
                            <div className={`absolute -right-12 -bottom-12 w-48 h-48 rounded-full opacity-5 blur-3xl transition-all group-hover:opacity-10 ${getStatusColor(table.status)}`} />
                        </div>
                    );
                })}

                {/* Add Table Placeholder - only show in non-hall or if hall is small */}
                {activeSection !== 'HALL' && (
                    <div className="h-64 rounded-[2.5rem] border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-indigo-300 hover:text-indigo-300 transition-all cursor-pointer group">
                        <div className="p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                            <Plus size={32} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Add Table</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TableMap;
