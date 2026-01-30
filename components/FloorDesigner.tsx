import React, { useState, useRef, useEffect } from 'react';
import {
    Plus,
    Trash2,
    RotateCcw,
    Save,
    Maximize2,
    Square,
    Circle,
    ChevronLeft,
    Layout,
    Users,
    Move
} from 'lucide-react';
import { Table, TableStatus } from '../types';

interface FloorDesignerProps {
    tables: Table[];
    onSave: (tables: Table[]) => void;
    onClose: () => void;
    lang: 'en' | 'ar';
}

const FloorDesigner: React.FC<FloorDesignerProps> = ({ tables, onSave, onClose, lang }) => {
    const [localTables, setLocalTables] = useState<Table[]>(tables);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const addTable = () => {
        const newTable: Table = {
            id: `table-${Date.now()}`,
            name: `${localTables.length + 1}`,
            status: TableStatus.AVAILABLE,
            seats: 4,
            position: { x: 50, y: 50 }
        };
        setLocalTables([...localTables, newTable]);
        setSelectedTableId(newTable.id);
    };

    const deleteTable = (id: string) => {
        setLocalTables(localTables.filter(t => t.id !== id));
        setSelectedTableId(null);
    };

    const updateTable = (id: string, updates: Partial<Table>) => {
        setLocalTables(localTables.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleDrag = (e: React.MouseEvent | React.TouchEvent, tableId: string) => {
        if (!canvasRef.current) return;
        setIsDragging(true);
        setSelectedTableId(tableId);

        const canvas = canvasRef.current.getBoundingClientRect();

        const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

            let x = ((clientX - canvas.left) / canvas.width) * 100;
            let y = ((clientY - canvas.top) / canvas.height) * 100;

            // Bound checks (0-90 to keep inside)
            x = Math.max(2, Math.min(92, x));
            y = Math.max(2, Math.min(92, y));

            updateTable(tableId, { position: { x, y } });
        };

        const stopHandler = () => {
            setIsDragging(false);
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', stopHandler);
            window.removeEventListener('touchmove', moveHandler);
            window.removeEventListener('touchend', stopHandler);
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', stopHandler);
        window.addEventListener('touchmove', moveHandler);
        window.addEventListener('touchend', stopHandler);
    };

    const selectedTable = localTables.find(t => t.id === selectedTableId);

    return (
        <div className="fixed inset-0 bg-slate-900 z-[200] flex flex-col animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <div className="h-20 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8">
                <div className="flex items-center gap-6">
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">
                            {lang === 'ar' ? 'مصمم مخطط الصالة' : 'Floor Plan Architect'}
                        </h2>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Custom Layout Mode</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setLocalTables(tables)} className="px-5 py-2.5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-white transition-all">
                        <RotateCcw size={16} className="inline mr-2" /> Reset
                    </button>
                    <button
                        onClick={() => { onSave(localTables); onClose(); }}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                    >
                        <Save size={16} className="inline mr-2" /> Save Changes
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Area */}
                <div className="flex-1 bg-slate-900 relative p-10 overflow-hidden">
                    <div
                        ref={canvasRef}
                        className="w-full h-full bg-slate-800/30 rounded-[3rem] border-4 border-dashed border-slate-700/50 relative overflow-hidden"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    >
                        {localTables.map((table) => (
                            <div
                                key={table.id}
                                onMouseDown={(e) => handleDrag(e, table.id)}
                                onTouchStart={(e) => handleDrag(e, table.id)}
                                className={`absolute w-32 h-32 cursor-move transition-shadow ${selectedTableId === table.id ? 'ring-4 ring-indigo-500 shadow-2xl z-10' : 'hover:scale-105'} flex flex-col items-center justify-center`}
                                style={{
                                    left: `${table.position?.x}%`,
                                    top: `${table.position?.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                <div className={`w-full h-full bg-slate-700 rounded-3xl border-2 border-slate-600 flex flex-col items-center justify-center relative shadow-xl overflow-hidden`}>
                                    {/* Table Shape decorative elements */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-600 rounded-full opacity-50" />

                                    <span className="text-2xl font-black text-white">{table.name}</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Users size={12} className="text-slate-500" />
                                        <span className="text-[10px] font-black text-slate-500">{table.seats}</span>
                                    </div>

                                    {/* Drag handle icon */}
                                    <div className="absolute bottom-2 right-2 text-slate-600 opacity-20">
                                        <Move size={12} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="w-80 bg-slate-950 border-l border-slate-800 p-8 flex flex-col gap-8 overflow-y-auto">
                    <div>
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Architect Tools</h3>
                        <button
                            onClick={addTable}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                        >
                            <Plus size={18} className="text-indigo-500" /> Add New Table
                        </button>
                    </div>

                    {selectedTable ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Table {selectedTable.name} Settings</h3>
                                <button onClick={() => deleteTable(selectedTable.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Label / Number</label>
                                    <input
                                        type="text"
                                        value={selectedTable.name}
                                        onChange={(e) => updateTable(selectedTable.id, { name: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Capacity (Seats)</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[2, 4, 6, 8].map(qty => (
                                            <button
                                                key={qty}
                                                onClick={() => updateTable(selectedTable.id, { seats: qty })}
                                                className={`py-3 rounded-xl font-black text-xs transition-all ${selectedTable.seats === qty ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
                                            >
                                                {qty}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Properties</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-indigo-400 transition-all">
                                            <Square size={20} />
                                            <span className="text-[10px] font-black uppercase tracking-tight">Square</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-indigo-400 transition-all">
                                            <Circle size={20} />
                                            <span className="text-[10px] font-black uppercase tracking-tight">Round</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-800">
                            <Layout size={40} className="text-slate-800 mb-4" />
                            <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-widest">Select a table on the canvas to configure properties</p>
                        </div>
                    )}

                    <div className="mt-auto bg-slate-900 p-5 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-3 text-indigo-400 mb-2">
                            <Maximize2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Precision Placement</span>
                        </div>
                        <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                            Coordinates are saved as percentage of floor width/height to ensure responsiveness across different screen sizes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FloorDesigner;
