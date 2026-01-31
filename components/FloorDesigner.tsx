
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    Plus,
    Trash2,
    RotateCcw,
    Save,
    Square,
    Circle,
    Layout,
    Users,
    Move,
    Layers,
    StickyNote,
    Copy,
    RectangleHorizontal,
    X
} from 'lucide-react';
import { Table, TableStatus, FloorZone } from '../types';

// Stores
import { useOrderStore } from '../stores/useOrderStore';
import { useAuthStore } from '../stores/useAuthStore';

// Services
import { translations } from '../services/translations';

const FloorDesigner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { tables, updateTables } = useOrderStore();
    const { settings } = useAuthStore();

    const lang = (settings.language || 'en') as 'en' | 'ar';
    const t = translations[lang] || translations['en'];

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [localTables, setLocalTables] = useState<Table[]>(tables);
    const [activeZone, setActiveZone] = useState<string>('MAIN');
    const designerRef = useRef<HTMLDivElement>(null);

    const handleAddTable = (shape: 'ROUND' | 'SQUARE' | 'RECTANGULAR') => {
        const newTable: Table = {
            id: `tbl-${Date.now()}`,
            number: String(localTables.length + 1),
            capacity: shape === 'RECTANGULAR' ? 6 : 4,
            status: TableStatus.AVAILABLE,
            x: 100,
            y: 100,
            width: shape === 'RECTANGULAR' ? 120 : 80,
            height: 80,
            shape,
            zoneId: activeZone
        };
        setLocalTables([...localTables, newTable]);
        setSelectedId(newTable.id);
    };

    const handleUpdateTable = (id: string, updates: Partial<Table>) => {
        setLocalTables(localTables.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleDeleteTable = (id: string) => {
        setLocalTables(localTables.filter(t => t.id !== id));
        setSelectedId(null);
    };

    const handleDuplicateTable = (table: Table) => {
        const newTable: Table = {
            ...table,
            id: `tbl-${Date.now()}`,
            number: String(localTables.length + 1),
            x: table.x + 20,
            y: table.y + 20
        };
        setLocalTables([...localTables, newTable]);
        setSelectedId(newTable.id);
    };

    const handleSave = () => {
        updateTables(localTables);
        onClose();
    };

    const selectedTable = localTables.find(t => t.id === selectedId);

    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-950 z-[200] flex flex-col animate-in fade-in duration-300">
            {/* Top Navigation */}
            <div className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 transition-all">
                        <X size={24} />
                    </button>
                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            <Layout className="text-indigo-600" /> Architectural Designer
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interactive Floor Mapping Tool v3.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        className="bg-indigo-600 text-white px-8 py-3.5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <Save size={18} /> Compile & Update
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Toolbar */}
                <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 flex flex-col gap-10 overflow-y-auto no-scrollbar">
                    {/* Element Library */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Layers size={14} className="text-indigo-600" /> Element Library
                        </p>
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => handleAddTable('SQUARE')}
                                className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent hover:border-indigo-600/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        <Square size={24} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Square Table</span>
                                </div>
                                <Plus size={18} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button
                                onClick={() => handleAddTable('RECTANGULAR')}
                                className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent hover:border-indigo-600/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        <RectangleHorizontal size={24} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Long Table</span>
                                </div>
                                <Plus size={18} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button
                                onClick={() => handleAddTable('ROUND')}
                                className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent hover:border-indigo-600/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        <Circle size={24} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Round Station</span>
                                </div>
                                <Plus size={18} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>

                    {/* Inspector */}
                    {selectedTable ? (
                        <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Move size={14} className="text-indigo-600" /> Entity Inspector
                            </p>

                            <div className="space-y-6 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Node Identity</label>
                                    <input
                                        type="text"
                                        value={selectedTable.number}
                                        onChange={(e) => handleUpdateTable(selectedTable.id, { number: e.target.value })}
                                        className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-black text-sm uppercase tracking-widest outline-none border-2 border-transparent focus:border-indigo-600 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Seating Payload</label>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-indigo-600 shadow-sm">
                                            <Users size={18} />
                                        </div>
                                        <input
                                            type="number"
                                            value={selectedTable.capacity}
                                            onChange={(e) => handleUpdateTable(selectedTable.id, { capacity: parseInt(e.target.value) || 0 })}
                                            className="flex-1 p-4 bg-white dark:bg-slate-900 rounded-xl font-black text-sm outline-none border-2 border-transparent focus:border-indigo-600 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleDuplicateTable(selectedTable)}
                                        className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-xl flex items-center justify-center gap-2 hover:text-indigo-600 transition-all shadow-sm group"
                                    >
                                        <Copy size={16} /> <span className="text-[10px] font-black uppercase">Clone</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTable(selectedTable.id)}
                                        className="p-4 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-all shadow-sm group"
                                    >
                                        <Trash2 size={16} /> <span className="text-[10px] font-black uppercase">Wipe</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 mt-20">
                            <StickyNote size={64} className="mb-6" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Idle Inspector</p>
                        </div>
                    )}
                </div>

                {/* Main Design Area */}
                <div className="flex-1 relative bg-slate-50 dark:bg-slate-950 overflow-hidden group">
                    {/* Visual Grid Background */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                        style={{
                            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    />

                    <div
                        ref={designerRef}
                        className="w-full h-full relative"
                        onClick={() => setSelectedId(null)}
                    >
                        {localTables.map(table => (
                            <div
                                key={table.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(table.id); }}
                                onMouseDown={(e) => {
                                    const startX = e.clientX - table.x;
                                    const startY = e.clientY - table.y;
                                    const onMouseMove = (moveEvent: MouseEvent) => {
                                        handleUpdateTable(table.id, {
                                            x: moveEvent.clientX - startX,
                                            y: moveEvent.clientY - startY
                                        });
                                    };
                                    const onMouseUp = () => {
                                        document.removeEventListener('mousemove', onMouseMove);
                                        document.removeEventListener('mouseup', onMouseUp);
                                    };
                                    document.addEventListener('mousemove', onMouseMove);
                                    document.addEventListener('mouseup', onMouseUp);
                                }}
                                style={{
                                    position: 'absolute',
                                    left: table.x,
                                    top: table.y,
                                    width: table.width,
                                    height: table.height,
                                    cursor: 'move',
                                    borderRadius: table.shape === 'ROUND' ? '100%' : '1.5rem',
                                }}
                                className={`flex flex-col items-center justify-center border-4 transition-all shadow-2xl ${selectedId === table.id ? 'border-indigo-600 bg-white dark:bg-indigo-900/40 ring-8 ring-indigo-500/10' : 'border-slate-800 dark:border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md'}`}
                            >
                                <span className={`text-sm font-black transition-colors ${selectedId === table.id ? 'text-indigo-600 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                                    {table.number}
                                </span>
                                <div className="flex items-center gap-1 mt-1 opacity-50">
                                    <Users size={10} />
                                    <span className="text-[10px] font-black">{table.capacity}</span>
                                </div>
                                {selectedId === table.id && (
                                    <div className="absolute -bottom-10 flex gap-2 animate-in slide-in-from-top-2">
                                        <button className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">
                                            <RotateCcw size={14} />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">
                                            <Layout size={14} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="absolute right-10 bottom-10 flex flex-col items-end gap-3 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                        <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-600" />
                                <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">Active Layer</span>
                            </div>
                            <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[10px] font-black uppercase text-slate-400">Resolution: 100% (Vector)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FloorDesigner;
