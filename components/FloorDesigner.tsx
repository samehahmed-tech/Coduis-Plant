import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    Plus,
    Trash2,
    RotateCcw,
    Save,
    Square,
    Circle,
    ChevronLeft,
    Layout,
    Users,
    Move,
    Layers,
    Percent,
    Crown,
    StickyNote,
    DollarSign,
    Copy,
    Palette,
    RectangleHorizontal,
    AlertTriangle
} from 'lucide-react';
import { Table, TableStatus, FloorZone } from '../types';

interface FloorDesignerProps {
    tables: Table[];
    onSave: (tables: Table[], zones: FloorZone[]) => void;
    onClose: () => void;
    lang: 'en' | 'ar';
}

const DEFAULT_ZONES: FloorZone[] = [
    { id: 'hall', name: 'Main Hall', color: '#6366f1' },
    { id: 'terrace', name: 'Terrace', color: '#10b981' },
    { id: 'vip', name: 'VIP Lounge', color: '#f59e0b' },
];

const LAYOUT_TEMPLATES = [
    {
        id: 'classic',
        name: 'Classic Restaurant',
        tables: [
            { x: 15, y: 20 }, { x: 35, y: 20 }, { x: 55, y: 20 }, { x: 75, y: 20 },
            { x: 15, y: 50 }, { x: 35, y: 50 }, { x: 55, y: 50 }, { x: 75, y: 50 },
            { x: 25, y: 80 }, { x: 50, y: 80 }, { x: 75, y: 80 }
        ]
    },
    {
        id: 'cafe',
        name: 'Café Style',
        tables: [
            { x: 20, y: 25 }, { x: 40, y: 25 }, { x: 60, y: 25 }, { x: 80, y: 25 },
            { x: 20, y: 55 }, { x: 40, y: 55 }, { x: 60, y: 55 }, { x: 80, y: 55 },
        ]
    },
    {
        id: 'fine-dining',
        name: 'Fine Dining',
        tables: [
            { x: 25, y: 30 }, { x: 50, y: 30 }, { x: 75, y: 30 },
            { x: 25, y: 70 }, { x: 50, y: 70 }, { x: 75, y: 70 },
        ]
    },
];

const TABLE_SIZE = 100; // px
const COLLISION_THRESHOLD = 12; // % distance

const FloorDesigner: React.FC<FloorDesignerProps> = ({ tables, onSave, onClose, lang }) => {
    const [localTables, setLocalTables] = useState<Table[]>(tables);
    const [zones, setZones] = useState<FloorZone[]>(DEFAULT_ZONES);
    const [activeZone, setActiveZone] = useState<string>('hall');
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
    const [showZoneEditor, setShowZoneEditor] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Check for collision with other tables
    const checkCollision = useCallback((tableId: string, x: number, y: number): boolean => {
        for (const t of localTables) {
            if (t.id === tableId) continue;
            if (t.zoneId !== activeZone) continue;
            if (!t.position) continue;

            const distance = Math.sqrt(Math.pow(t.position.x - x, 2) + Math.pow(t.position.y - y, 2));
            if (distance < COLLISION_THRESHOLD) {
                return true;
            }
        }
        return false;
    }, [localTables, activeZone]);

    const addTable = () => {
        // Find free spot
        let x = 20, y = 20;
        let attempts = 0;
        while (checkCollision('', x, y) && attempts < 50) {
            x += 15;
            if (x > 85) { x = 20; y += 15; }
            if (y > 85) y = 20;
            attempts++;
        }

        const zonePrefix = zones.find(z => z.id === activeZone)?.name.charAt(0) || 'T';
        const zoneTableCount = localTables.filter(t => t.zoneId === activeZone).length;

        const newTable: Table = {
            id: `table-${Date.now()}`,
            name: `${zonePrefix}${zoneTableCount + 1}`,
            status: TableStatus.AVAILABLE,
            seats: 4,
            position: { x, y },
            zoneId: activeZone,
            shape: 'square',
            discount: 0,
            isVIP: activeZone === 'vip'
        };
        setLocalTables([...localTables, newTable]);
        setSelectedTableId(newTable.id);
    };

    const deleteTable = (id: string) => {
        setLocalTables(localTables.filter(t => t.id !== id));
        setSelectedTableId(null);
    };

    const duplicateTable = (table: Table) => {
        const newTable: Table = {
            ...table,
            id: `table-${Date.now()}`,
            name: `${table.name}-copy`,
            position: { x: (table.position?.x || 50) + 10, y: (table.position?.y || 50) + 10 }
        };
        setLocalTables([...localTables, newTable]);
        setSelectedTableId(newTable.id);
    };

    const updateTable = (id: string, updates: Partial<Table>) => {
        setLocalTables(localTables.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const applyTemplate = (template: typeof LAYOUT_TEMPLATES[0]) => {
        const newTables = template.tables.map((pos, i) => ({
            id: `table-${Date.now()}-${i}`,
            name: `${i + 1}`,
            status: TableStatus.AVAILABLE,
            seats: 4,
            position: pos,
            zoneId: activeZone,
            shape: 'square' as const
        }));
        setLocalTables(prev => [...prev.filter(t => t.zoneId !== activeZone), ...newTables]);
    };

    const addZone = () => {
        const colors = ['#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'];
        const newZone: FloorZone = {
            id: `zone-${Date.now()}`,
            name: `Zone ${zones.length + 1}`,
            color: colors[zones.length % colors.length]
        };
        setZones([...zones, newZone]);
        setActiveZone(newZone.id);
    };

    const handleDrag = (e: React.MouseEvent | React.TouchEvent, tableId: string) => {
        if (!canvasRef.current) return;
        setSelectedTableId(tableId);

        const canvas = canvasRef.current.getBoundingClientRect();

        const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

            let x = ((clientX - canvas.left) / canvas.width) * 100;
            let y = ((clientY - canvas.top) / canvas.height) * 100;

            x = Math.max(5, Math.min(95, x));
            y = Math.max(5, Math.min(95, y));

            // Collision check
            if (checkCollision(tableId, x, y)) {
                setCollisionWarning(lang === 'ar' ? 'لا يمكن وضع طاولتين في نفس المكان!' : 'Tables cannot overlap!');
                return;
            } else {
                setCollisionWarning(null);
            }

            updateTable(tableId, { position: { x, y } });
        };

        const stopHandler = () => {
            setCollisionWarning(null);
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
    const activeZoneData = zones.find(z => z.id === activeZone);
    const zoneTables = localTables.filter(t => t.zoneId === activeZone);

    return (
        <div className="fixed inset-0 bg-slate-900 z-[200] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header - Responsive */}
            <div className="h-14 md:h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0">
                <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="truncate">
                        <h2 className="text-sm md:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <Layout size={16} className="text-indigo-500 hidden sm:block" />
                            {lang === 'ar' ? 'مصمم الصالات' : 'Designer'}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setLocalTables(tables)} className="hidden sm:block px-3 py-2 text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider hover:text-white transition-all">
                        {lang === 'ar' ? 'إعادة' : 'Reset'}
                    </button>
                    <button
                        onClick={() => { onSave(localTables, zones); onClose(); }}
                        className="px-4 md:px-6 py-1.5 md:py-2.5 bg-indigo-600 text-white rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider shadow-lg hover:bg-indigo-700 transition-all"
                    >
                        {lang === 'ar' ? 'حفظ' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Zone Tabs */}
            <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-6 gap-2 overflow-x-auto">
                {zones.map(zone => (
                    <button
                        key={zone.id}
                        onClick={() => setActiveZone(zone.id)}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeZone === zone.id
                            ? 'text-white shadow-lg'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                        style={{ backgroundColor: activeZone === zone.id ? zone.color : undefined }}
                    >
                        <Layers size={14} />
                        {zone.name}
                        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                            {localTables.filter(t => t.zoneId === zone.id).length}
                        </span>
                    </button>
                ))}
                <button
                    onClick={addZone}
                    className="p-2 rounded-xl bg-slate-800 text-slate-500 hover:text-indigo-400 hover:bg-slate-700 transition-all"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Collision Warning */}
            {collisionWarning && (
                <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-2xl animate-in zoom-in">
                    <AlertTriangle size={18} /> {collisionWarning}
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Area - Adaptive Padding */}
                <div className="flex-1 bg-slate-900 relative p-3 md:p-6 overflow-hidden">
                    {/* Templates Bar - Responsive */}
                    <div className="absolute top-2 md:top-4 left-2 md:left-4 z-20 flex gap-1.5 max-w-[90%] overflow-x-auto no-scrollbar py-1">
                        {LAYOUT_TEMPLATES.map(template => (
                            <button
                                key={template.id}
                                onClick={() => applyTemplate(template)}
                                className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-800/90 backdrop-blur-md text-slate-300 rounded-lg md:rounded-xl text-[9px] md:text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all whitespace-nowrap border border-white/5"
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>

                    <div
                        ref={canvasRef}
                        className="w-full h-full rounded-2xl md:rounded-3xl border-2 border-dashed relative overflow-hidden"
                        style={{
                            borderColor: activeZoneData?.color || '#334155',
                            backgroundColor: `${activeZoneData?.color}10`,
                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                            backgroundSize: '30px 30px'
                        }}
                    >
                        {/* Zone Label */}
                        <div
                            className="absolute top-2 md:top-4 right-2 md:right-4 px-3 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black uppercase tracking-wider text-white shadow-lg z-10"
                            style={{ backgroundColor: activeZoneData?.color }}
                        >
                            {activeZoneData?.name}
                        </div>

                        {zoneTables.map((table) => (
                            <div
                                key={table.id}
                                onMouseDown={(e) => handleDrag(e, table.id)}
                                onTouchStart={(e) => handleDrag(e, table.id)}
                                className={`absolute cursor-move transition-all duration-100 ${selectedTableId === table.id ? 'ring-4 ring-white shadow-2xl z-10 scale-105' : 'hover:scale-105'
                                    }`}
                                style={{
                                    left: `${table.position?.x}%`,
                                    top: `${table.position?.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    width: `${TABLE_SIZE}px`,
                                    height: `${TABLE_SIZE}px`,
                                }}
                            >
                                <div
                                    className={`w-full h-full flex flex-col items-center justify-center relative shadow-xl border-2 ${table.shape === 'round' ? 'rounded-full' : table.shape === 'rectangle' ? 'rounded-2xl' : 'rounded-2xl'
                                        }`}
                                    style={{
                                        backgroundColor: table.isVIP ? '#f59e0b' : '#475569',
                                        borderColor: selectedTableId === table.id ? '#fff' : '#64748b',
                                        aspectRatio: table.shape === 'rectangle' ? '1.5' : '1'
                                    }}
                                >
                                    <span className="text-xl font-black text-white">{table.name}</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Users size={10} className="text-white/60" />
                                        <span className="text-[10px] font-bold text-white/60">{table.seats}</span>
                                    </div>

                                    {table.isVIP && (
                                        <Crown size={12} className="absolute top-1 right-1 text-white" />
                                    )}
                                    {table.discount && table.discount > 0 && (
                                        <div className="absolute -top-2 -left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                            <Percent size={10} className="text-white" />
                                        </div>
                                    )}

                                    <div className="absolute bottom-1 text-white/30">
                                        <Move size={10} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Controls - Optimized for Space */}
                <div className="w-64 md:w-72 bg-slate-950 border-l border-slate-800 p-3 md:p-5 flex flex-col gap-4 md:gap-5 overflow-y-auto shrink-0 hidden lg:flex">
                    <button
                        onClick={addTable}
                        className="w-full py-2.5 md:py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold text-[11px] md:text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Plus size={16} /> {lang === 'ar' ? 'إضافة طاولة' : 'Add Table'}
                    </button>

                    {selectedTable ? (
                        <div className="space-y-4 md:space-y-5 animate-in fade-in slide-in-from-right duration-200">
                            <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-white/5">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">
                                    {lang === 'ar' ? 'إعدادات الطاولة' : 'Settings'}
                                </h3>
                                <div className="flex gap-1">
                                    <button onClick={() => duplicateTable(selectedTable)} className="p-1.5 text-slate-500 hover:text-indigo-400 rounded transition-all">
                                        <Copy size={13} />
                                    </button>
                                    <button onClick={() => deleteTable(selectedTable.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-all">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Name */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'ar' ? 'الاسم' : 'Label'}</label>
                                <input
                                    type="text"
                                    value={selectedTable.name}
                                    onChange={(e) => updateTable(selectedTable.id, { name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-bold text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Seats & Shape - Grid for better density */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'ar' ? 'المقاعد' : 'Seats'}</label>
                                    <select
                                        value={selectedTable.seats}
                                        onChange={(e) => updateTable(selectedTable.id, { seats: parseInt(e.target.value) })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-bold text-xs outline-none"
                                    >
                                        {[1, 2, 4, 6, 8, 10, 12].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'ar' ? 'الشكل' : 'Shape'}</label>
                                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                        {[
                                            { id: 'square', icon: Square },
                                            { id: 'round', icon: Circle },
                                            { id: 'rectangle', icon: RectangleHorizontal }
                                        ].map(({ id, icon: Icon }) => (
                                            <button
                                                key={id}
                                                onClick={() => updateTable(selectedTable.id, { shape: id as any })}
                                                className={`p-2 rounded-lg transition-all flex items-center justify-center flex-1 ${selectedTable.shape === id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'}`}
                                            >
                                                <Icon size={12} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* VIP Toggle */}
                            <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Crown size={12} className="text-amber-500 shrink-0" />
                                    <span className="text-[10px] font-bold text-slate-300 truncate">{lang === 'ar' ? 'طاولة VIP' : 'VIP'}</span>
                                </div>
                                <button
                                    onClick={() => updateTable(selectedTable.id, { isVIP: !selectedTable.isVIP })}
                                    className={`w-8 h-4 rounded-full transition-all relative shrink-0 ${selectedTable.isVIP ? 'bg-amber-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${selectedTable.isVIP ? 'right-0.5' : 'left-0.5'}`} />
                                </button>
                            </div>

                            {/* Discount & Min Spend */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 truncate">
                                        <Percent size={9} /> {lang === 'ar' ? 'خصم %' : 'Disc%'}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={selectedTable.discount || 0}
                                        onChange={(e) => updateTable(selectedTable.id, { discount: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-bold text-xs outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 truncate">
                                        <DollarSign size={9} /> {lang === 'ar' ? 'أدنى طلب' : 'Min$'}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={selectedTable.minSpend || 0}
                                        onChange={(e) => updateTable(selectedTable.id, { minSpend: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-bold text-xs outline-none"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <StickyNote size={9} /> {lang === 'ar' ? 'ملاحظات' : 'Notes'}
                                </label>
                                <textarea
                                    value={selectedTable.notes || ''}
                                    onChange={(e) => updateTable(selectedTable.id, { notes: e.target.value })}
                                    rows={2}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-bold text-xs outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                    placeholder="..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                            <Layout size={24} className="text-slate-700 mb-2" />
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                {lang === 'ar' ? 'اختر طاولة' : 'Select table'}
                            </p>
                        </div>
                    )}

                    {/* Zone Editor - Compact */}
                    <div className="mt-auto p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                <Palette size={10} /> {lang === 'ar' ? 'إعدادات الصالة' : 'Zone'}
                            </h4>
                        </div>
                        {activeZoneData && (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={activeZoneData.name}
                                    onChange={(e) => setZones(prev => prev.map(z => z.id === activeZone ? { ...z, name: e.target.value } : z))}
                                    className="w-full bg-slate-800 border-none rounded-lg px-3 py-1.5 text-white font-bold text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <div className="flex flex-wrap gap-1">
                                    {['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setZones(prev => prev.map(z => z.id === activeZone ? { ...z, color } : z))}
                                            className={`w-6 h-6 rounded-md transition-all ${activeZoneData.color === color ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FloorDesigner;
