
import React, { useState, useRef, useEffect } from 'react';
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
    X,
    Settings2,
    Type,
    Tag,
    Crown,
    ChevronDown,
    Undo2,
    Grid3X3,
    Table as TableIcon,
    Palette,
    Wind,
    Home,
    Palmtree,
    Monitor
} from 'lucide-react';
import { Table, TableStatus, FloorZone } from '../types';

// Stores
import { useOrderStore } from '../stores/useOrderStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

// Services
import { translations } from '../services/translations';

const ZONE_ICONS: Record<string, any> = {
    Home,
    Wind,
    Palmtree,
    Monitor,
    Layers
};

const FloorDesigner: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const navigate = useNavigate();
    const { tables, updateTables, zones, updateZones } = useOrderStore();
    const { settings } = useAuthStore();

    const lang = (settings.language || 'en') as 'en' | 'ar';
    const t = translations[lang] || translations['en'];

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [localTables, setLocalTables] = useState<Table[]>(tables);
    const [localZones, setLocalZones] = useState<FloorZone[]>(zones);
    const [activeZone, setActiveZone] = useState<string>(zones[0]?.id || 'MAIN');
    const [isZoneManagerOpen, setIsZoneManagerOpen] = useState(false);

    // Layout Templates
    const LAYOUT_TEMPLATES = [
        { id: 'grid', name: 'Standard Grid', icon: Grid3X3 },
        { id: 'cafeteria', name: 'Cafeteria Row', icon: TableIcon },
        { id: 'lounge', name: 'Lounge Circular', icon: Circle },
        { id: 'banquet', name: 'Banquet Hall', icon: Layers },
        { id: 'fine-dining', name: 'Fine Dining', icon: Crown }
    ];

    const designerRef = useRef<HTMLDivElement>(null);

    // Overlap Prevention Logic
    const isOverlapping = (id: string, x: number, y: number, width: number, height: number) => {
        return localTables.some(t => {
            if (t.id === id || t.zoneId !== activeZone) return false;
            const margin = 10; // Extra buffer
            return (
                x < t.position.x + t.width + margin &&
                x + width + margin > t.position.x &&
                y < t.position.y + t.height + margin &&
                y + height + margin > t.position.y
            );
        });
    };

    const handleAddTable = (shape: 'square' | 'round' | 'rectangle') => {
        const width = shape === 'rectangle' ? 140 : 100;
        const height = 100;

        // Find non-overlapping position
        let x = 100;
        let y = 100;
        let attempts = 0;
        while (isOverlapping(`new-${Date.now()}`, x, y, width, height) && attempts < 20) {
            x += 40;
            if (x > 800) { x = 100; y += 40; }
            attempts++;
        }

        const newTable: Table = {
            id: `tbl-${Date.now()}`,
            name: String(localTables.length + 1),
            seats: shape === 'rectangle' ? 6 : 4,
            status: TableStatus.AVAILABLE,
            position: { x, y },
            width,
            height,
            shape,
            zoneId: activeZone,
            discount: 0,
            isVIP: false
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
            name: `${table.name} (Copy)`,
            position: { x: table.position.x + 20, y: table.position.y + 20 }
        };
        setLocalTables([...localTables, newTable]);
        setSelectedId(newTable.id);
    };

    const handleApplyLayout = (type: string) => {
        // Clear current zone tables
        let newTables = localTables.filter(t => t.zoneId !== activeZone);

        if (type === 'grid') {
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 4; j++) {
                    newTables.push({
                        id: `tbl-grid-${i}-${j}-${Date.now()}`,
                        name: `${newTables.length + 1}`,
                        seats: 4,
                        status: TableStatus.AVAILABLE,
                        position: { x: 100 + j * 160, y: 100 + i * 160 },
                        width: 100, height: 100, shape: 'square', zoneId: activeZone, discount: 0, isVIP: false
                    });
                }
            }
        } else if (type === 'cafeteria') {
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 6; j++) {
                    newTables.push({
                        id: `tbl-caf-${i}-${j}-${Date.now()}`,
                        name: `C${newTables.length + 1}`,
                        seats: 6,
                        status: TableStatus.AVAILABLE,
                        position: { x: 80 + j * 160, y: 150 + i * 250 },
                        width: 140, height: 80, shape: 'rectangle', zoneId: activeZone, discount: 0, isVIP: false
                    });
                }
            }
        } else if (type === 'lounge') {
            const centerX = 600, centerY = 400, radius = 300, count = 8;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                newTables.push({
                    id: `tbl-lng-${i}-${Date.now()}`,
                    name: `L${i + 1}`,
                    seats: 4,
                    status: TableStatus.AVAILABLE,
                    position: { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius },
                    width: 100, height: 100, shape: 'round', zoneId: activeZone, discount: 0, isVIP: false
                });
            }
        } else if (type === 'banquet') {
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 5; j++) {
                    newTables.push({
                        id: `tbl-bnq-${i}-${j}-${Date.now()}`,
                        name: `B${newTables.length + 1}`,
                        seats: 8,
                        status: TableStatus.AVAILABLE,
                        position: { x: 100 + j * 200, y: 100 + i * 180 },
                        width: 120, height: 120, shape: 'round', zoneId: activeZone, discount: 0, isVIP: false
                    });
                }
            }
        } else if (type === 'fine-dining') {
            const spots = [{ x: 200, y: 200 }, { x: 600, y: 200 }, { x: 1000, y: 200 }, { x: 400, y: 500 }, { x: 800, y: 500 }];
            spots.forEach((pos, idx) => {
                newTables.push({
                    id: `tbl-fine-${idx}-${Date.now()}`,
                    name: `VIP ${idx + 1}`,
                    seats: 4,
                    status: TableStatus.AVAILABLE,
                    position: pos,
                    width: 120, height: 120, shape: 'square', zoneId: activeZone, discount: 0, isVIP: true
                });
            });
        }
        setLocalTables(newTables);
    };

    const handleExit = () => {
        if (onClose) onClose();
        else navigate('/settings');
    };

    const handleSave = () => {
        updateTables(localTables);
        updateZones(localZones);
        handleExit();
    };

    const selectedTable = localTables.find(t => t.id === selectedId);
    const tablesInZone = localTables.filter(t => t.zoneId === activeZone);

    return (
        <div className={`fixed inset-0 bg-slate-100 dark:bg-slate-950 z-[200] flex flex-col animate-in fade-in duration-300 ${settings.language === 'ar' ? 'font-cairo' : 'font-outfit'}`} dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Top Navigation */}
            <div className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={handleExit} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 transition-all">
                        <X size={24} />
                    </button>
                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            <Layout className="text-indigo-600" /> Interior Architecture
                        </h2>
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Zone:</p>
                            <div className="flex items-center gap-1">
                                {localZones.map(z => (
                                    <button
                                        key={z.id}
                                        onClick={() => setActiveZone(z.id)}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${activeZone === z.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        {z.name}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setIsZoneManagerOpen(true)}
                                    className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-all"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-2 mr-6">
                        {LAYOUT_TEMPLATES.map(lt => (
                            <button
                                key={lt.id}
                                onClick={() => handleApplyLayout(lt.id)}
                                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-all group relative"
                                title={`Apply ${lt.name}`}
                            >
                                <lt.icon size={20} />
                                <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-800 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Apply {lt.name}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleSave}
                        className="bg-indigo-600 text-white px-8 py-3.5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <Save size={18} /> Deploy Layout
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Toolbar */}
                <div className="w-85 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 p-8 flex flex-col gap-10 overflow-y-auto no-scrollbar shadow-2xl z-20">
                    {/* Element Library */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Plus size={14} className="text-indigo-600" /> Structure Library
                        </p>
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => handleAddTable('square')}
                                className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent hover:border-indigo-600/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        <Square size={24} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Standard Table</span>
                                </div>
                                <Plus size={18} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button
                                onClick={() => handleAddTable('rectangle')}
                                className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent hover:border-indigo-600/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        <RectangleHorizontal size={24} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Family Bench</span>
                                </div>
                                <Plus size={18} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button
                                onClick={() => handleAddTable('round')}
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
                                <Settings2 size={14} className="text-indigo-600" /> Node Configuration
                            </p>

                            <div className="space-y-6 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Type size={10} /> Identifier
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedTable.name}
                                        onChange={(e) => handleUpdateTable(selectedTable.id, { name: e.target.value })}
                                        className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-black text-sm uppercase tracking-widest outline-none border-2 border-transparent focus:border-indigo-600 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacity</label>
                                        <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl">
                                            <Users size={14} className="text-slate-400" />
                                            <input
                                                type="number"
                                                value={selectedTable.seats}
                                                onChange={(e) => handleUpdateTable(selectedTable.id, { seats: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-transparent font-black text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount %</label>
                                        <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl">
                                            <Tag size={14} className="text-slate-400" />
                                            <input
                                                type="number"
                                                value={selectedTable.discount || 0}
                                                onChange={(e) => handleUpdateTable(selectedTable.id, { discount: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-transparent font-black text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-transparent has-[:checked]:border-indigo-600 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${selectedTable.isVIP ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Crown size={16} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">VIP Privilege</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedTable.isVIP}
                                        onChange={(e) => handleUpdateTable(selectedTable.id, { isVIP: e.target.checked })}
                                        className="w-5 h-5 accent-indigo-600"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Notes</label>
                                    <textarea
                                        value={selectedTable.notes || ''}
                                        onChange={(e) => handleUpdateTable(selectedTable.id, { notes: e.target.value })}
                                        className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-bold text-xs outline-none border-2 border-transparent focus:border-indigo-600 transition-all h-20 resize-none"
                                        placeholder="Special handling instructions..."
                                    />
                                </div>

                                <div className="pt-6 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleDuplicateTable(selectedTable)}
                                        className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-xl flex items-center justify-center gap-2 hover:text-indigo-600 transition-all shadow-sm group border border-slate-100 dark:border-slate-800"
                                    >
                                        <Copy size={16} /> <span className="text-[10px] font-black uppercase">Clone</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTable(selectedTable.id)}
                                        className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all shadow-sm group"
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
                <div className="flex-1 relative bg-slate-100 dark:bg-slate-900 overflow-auto p-16 group/designer">
                    <div
                        ref={designerRef}
                        className="relative bg-white dark:bg-slate-950 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 rounded-sm"
                        style={{ width: '1600px', height: '1200px' }}
                        onClick={() => setSelectedId(null)}
                    >
                        {/* Visual Grid Background */}
                        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
                            style={{
                                backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                            }}
                        />
                        {tablesInZone.map(table => (
                            <div
                                key={table.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(table.id); }}
                                onMouseDown={(e) => {
                                    const startX = e.clientX - table.position.x;
                                    const startY = e.clientY - table.position.y;

                                    const onMouseMove = (moveEvent: MouseEvent) => {
                                        const newX = moveEvent.clientX - startX;
                                        const newY = moveEvent.clientY - startY;

                                        // Update state immediately for visual feedback
                                        handleUpdateTable(table.id, {
                                            position: { x: newX, y: newY }
                                        });
                                    };

                                    const onMouseUp = (upEvent: MouseEvent) => {
                                        document.removeEventListener('mousemove', onMouseMove);
                                        document.removeEventListener('mouseup', onMouseUp);

                                        const finalX = upEvent.clientX - startX;
                                        const finalY = upEvent.clientY - startY;

                                        // Overlap check on release
                                        if (isOverlapping(table.id, finalX, finalY, table.width, table.height)) {
                                            // Optional: visual feedback for invalid drop
                                            console.warn('Overlap detected');
                                        }
                                    };

                                    document.addEventListener('mousemove', onMouseMove);
                                    document.addEventListener('mouseup', onMouseUp);
                                }}
                                style={{
                                    position: 'absolute',
                                    left: table.position.x,
                                    top: table.position.y,
                                    width: table.width,
                                    height: table.height,
                                    cursor: 'move',
                                    borderRadius: table.shape === 'round' ? '100%' : '1.5rem',
                                    zIndex: selectedId === table.id ? 100 : 10
                                }}
                                className={`flex flex-col items-center justify-center border-4 transition-all shadow-2xl relative ${selectedId === table.id ? 'border-indigo-600 bg-white dark:bg-indigo-900/40 ring-8 ring-indigo-500/10 scale-105' : 'border-slate-800 dark:border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md hover:scale-102'}`}
                            >
                                {table.isVIP && (
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-slate-800 transform rotate-12">
                                        <Crown size={14} />
                                    </div>
                                )}

                                <span className={`text-lg font-black transition-colors ${selectedId === table.id ? 'text-indigo-600 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                                    {table.name}
                                </span>

                                <div className="flex items-center gap-1.5 mt-1 opacity-50">
                                    <Users size={12} />
                                    <span className="text-[11px] font-black">{table.seats}</span>
                                    {table.discount ? (
                                        <div className="flex items-center gap-1 ml-1 text-emerald-500">
                                            <Tag size={10} />
                                            <span className="text-[9px] font-black">{table.discount}%</span>
                                        </div>
                                    ) : null}
                                </div>

                                {selectedId === table.id && (
                                    <div className="absolute -bottom-12 flex gap-2 animate-in slide-in-from-top-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDuplicateTable(table); }}
                                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }}
                                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* HUD / Info Overlay */}
                    <div className="absolute right-10 bottom-10 flex flex-col items-end gap-3 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                        <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse" />
                                <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">Live Mapping Active</span>
                            </div>
                            <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[10px] font-black uppercase text-slate-400">{tablesInZone.length} Units in {localZones.find(z => z.id === activeZone)?.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zone Manager Modal */}
            {isZoneManagerOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Zone Architecture</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage distinct spatial areas</p>
                            </div>
                            <button onClick={() => setIsZoneManagerOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {localZones.map(zone => (
                                <div key={zone.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-transparent hover:border-indigo-600/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${zone.color} text-white`}>
                                            <Layers size={18} />
                                        </div>
                                        <div>
                                            <input
                                                value={zone.name}
                                                onChange={(e) => setLocalZones(localZones.map(z => z.id === zone.id ? { ...z, name: e.target.value } : z))}
                                                className="bg-transparent font-black text-sm uppercase tracking-widest outline-none text-slate-800 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (localZones.length > 1) {
                                                    setLocalTables(localTables.filter(t => t.zoneId !== zone.id));
                                                    setLocalZones(localZones.filter(z => z.id !== zone.id));
                                                    if (activeZone === zone.id) setActiveZone(localZones[0].id);
                                                }
                                            }}
                                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                const newId = `zone-${Date.now()}`;
                                setLocalZones([...localZones, { id: newId, name: 'New Area', color: 'bg-emerald-600' }]);
                            }}
                            className="w-full py-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hove:text-indigo-600 hover:border-indigo-600 transition-all group"
                        >
                            <Plus size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">Provision New Area</span>
                        </button>

                        <button
                            onClick={() => setIsZoneManagerOpen(false)}
                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
                        >
                            Initialize Environment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloorDesigner;
