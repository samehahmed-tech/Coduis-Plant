import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Plus, Search, X, Truck, FileText, Package,
  Tag, Briefcase,
  ArrowRightLeft, ListChecks, Download, Calculator, Home, Layers,
  ClipboardCheck, Activity, Play, CheckCircle2, Save, Calendar
} from 'lucide-react';
import { Supplier, PurchaseOrder, Warehouse, Branch, WarehouseType, InventoryItem } from '../types';

// Stores
import { useInventoryStore } from '../stores/useInventoryStore';
import { useAuthStore } from '../stores/useAuthStore';

// Services
import { translations } from '../services/translations';
import { inventoryIntelligenceApi } from '../services/api/inventoryIntelligence';
import { reportsApi } from '../services/api/reports';
import { socketService } from '../services/socketService';

// Modals
import ItemModal from './inventory/ItemModal';
import WarehouseModal from './inventory/WarehouseModal';
import StockAdjustmentModal from './inventory/StockAdjustmentModal';
import StockTransferModal from './inventory/StockTransferModal';
import ReceiptModal from './inventory/ReceiptModal';

// Shared Components
import VirtualList from './common/VirtualList';
import PageSkeleton from './common/PageSkeleton';
import Skeleton from './common/Skeleton';

const Inventory: React.FC = () => {
  // Global State
  const {
    inventory, suppliers, purchaseOrders, warehouses, transferMovements,
    fetchInventory, fetchWarehouses, fetchSuppliers, fetchPurchaseOrders, fetchTransferMovements,
    addInventoryItem, updateInventoryItem,
    addWarehouse, updateStock,
    createSupplierInDB, updateSupplierInDB, deactivateSupplierInDB,
    createPurchaseOrderInDB, updatePurchaseOrderStatusInDB, receivePurchaseOrderInDB,
    createBranchTransferInDB
  } = useInventoryStore();

  const { branches, settings } = useAuthStore();
  const lang = settings.language;
  const t = translations[lang];

  // UI State
  const [activeTab, setActiveTab] = useState<'STOCK' | 'SUPPLIERS' | 'PO' | 'WAREHOUSES' | 'BRANCHES' | 'STOCKCOUNT' | 'MOVEMENTS'>('STOCK');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockSort, setStockSort] = useState<'name' | 'qty-asc' | 'qty-desc' | 'cost' | 'low-first'>('name');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Modal Visibility State
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [supplierForm, setSupplierForm] = useState<Supplier>({
    id: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: '',
  });
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poItemId, setPoItemId] = useState('');
  const [poQty, setPoQty] = useState(1);
  const [poPrice, setPoPrice] = useState(0);
  const [poWarehouseId, setPoWarehouseId] = useState('');
  const [branchTransferItemId, setBranchTransferItemId] = useState('');
  const [branchTransferFromWh, setBranchTransferFromWh] = useState('');
  const [branchTransferToWh, setBranchTransferToWh] = useState('');
  const [branchTransferQty, setBranchTransferQty] = useState(1);
  const [branchTransferReason, setBranchTransferReason] = useState('Inter-branch transfer');

  useEffect(() => {
    fetchInventory();
    fetchWarehouses();
    fetchSuppliers();
    fetchPurchaseOrders();
    fetchTransferMovements();

    // --- Real-time Stock Sync ---
    const handleStockUpdate = (data: any) => {
        // Optional: Compare branchId if multi-branch restricted
        fetchInventory();
    };

    socketService.on('stock:updated', handleStockUpdate);
    return () => {
        socketService.off('stock:updated', handleStockUpdate);
    };
  }, []);

  const handleSaveItem = async (item: InventoryItem) => {
    if (editingItem) {
      await updateInventoryItem(item.id, item);
    } else {
      await addInventoryItem(item);
    }
    setItemModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveWarehouse = async (wh: Warehouse) => {
    await addWarehouse(wh);
    setWarehouseModalOpen(false);
  };

  const handleAdjustment = async (itemId: string, warehouseId: string, quantity: number, reason: string) => {
    await updateStock(itemId, warehouseId, quantity, 'ADJUSTMENT', reason);
  };

  const handleTransfer = async (itemId: string, fromWh: string, toWh: string, qty: number) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    // In a real system, the server would handle this transactionally.
    // For now we simulate with two updates.
    const sourceQty = (item.warehouseQuantities.find(wq => wq.warehouseId === fromWh)?.quantity || 0) - qty;
    const destQty = (item.warehouseQuantities.find(wq => wq.warehouseId === toWh)?.quantity || 0) + qty;

    await updateStock(itemId, fromWh, sourceQty, 'TRANSFER', `Transfer to ${toWh}`);
    await updateStock(itemId, toWh, destQty, 'TRANSFER', `Transfer from ${fromWh}`);
  };

  const handleReceipt = async (warehouseId: string, items: { itemId: string; quantity: number; costPrice?: number }[]) => {
    for (const entry of items) {
      const item = inventory.find(i => i.id === entry.itemId);
      if (!item) continue;
      const currentQty = item.warehouseQuantities.find(wq => wq.warehouseId === warehouseId)?.quantity || 0;
      await updateStock(entry.itemId, warehouseId, currentQty + entry.quantity, 'PURCHASE', 'Incoming Receipt');

      if (entry.costPrice && entry.costPrice !== item.purchasePrice) {
        await updateInventoryItem(entry.itemId, { purchasePrice: entry.costPrice });
      }
    }
  };
  // --- AI Forecasting State ---
  const [aiForecasts, setAiForecasts] = useState<Record<string, { text: string; loading: boolean }>>({});

  const handleRequestForecast = async (itemId: string) => {
    setAiForecasts(prev => ({ ...prev, [itemId]: { text: '', loading: true } }));
    try {
      const forecast = await inventoryIntelligenceApi.getAIForecast(itemId);
      setAiForecasts(prev => ({ ...prev, [itemId]: { text: forecast, loading: false } }));
    } catch (e) {
      setAiForecasts(prev => ({ ...prev, [itemId]: { text: 'Forecast failed.', loading: false } }));
    }
  };

  // --- STOCK COUNT STATE ---
  const [countSession, setCountSession] = useState<any>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [selectedCountWarehouse, setSelectedCountWarehouse] = useState('');

  const handleStartCount = async () => {
    if (!selectedCountWarehouse) return;
    setCountLoading(true);
    try {
      const session = await inventoryIntelligenceApi.createStockCount(selectedCountWarehouse);
      setCountSession(session);
    } catch (e) { console.error(e); }
    setCountLoading(false);
  };

  const handleUpdateCountItem = (itemId: string, field: string, value: any) => {
    if (!countSession) return;
    setCountSession((prev: any) => ({
      ...prev,
      items: prev.items.map((it: any) => it.itemId === itemId ? { ...it, [field]: value } : it),
    }));
  };

  const handleCompleteCount = async (apply: boolean) => {
    if (!countSession) return;
    setCountLoading(true);
    try {
      const counts = countSession.items
        .filter((it: any) => it.countedQty !== null)
        .map((it: any) => ({ itemId: it.itemId, countedQty: Number(it.countedQty), notes: it.notes || '' }));
      await inventoryIntelligenceApi.updateStockCount(countSession.id, counts);
      await inventoryIntelligenceApi.completeStockCount(countSession.id, apply);
      setCountSession(null);
      fetchInventory();
    } catch (e) { console.error(e); }
    setCountLoading(false);
  };

  // --- MOVEMENT LOG STATE ---
  const [movementLog, setMovementLog] = useState<any[]>([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementDateFrom, setMovementDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [movementDateTo, setMovementDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const loadMovements = async () => {
    setMovementLoading(true);
    try {
      const data = await reportsApi.getStockMovements({ startDate: movementDateFrom, endDate: movementDateTo });
      setMovementLog(data || []);
    } catch (e) { console.error(e); setMovementLog([]); }
    setMovementLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'MOVEMENTS') loadMovements();
  }, [activeTab]);

  // --- TAB CONTENT RENDERERS ---

  const renderStock = () => {
    const filtered = inventory
      .filter(item => {
        const q = searchQuery.toLowerCase();
        if (!q) return true;
        return (
          (item.name || '').toLowerCase().includes(q) ||
          (item.nameAr || '').toLowerCase().includes(q) ||
          (item.sku || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const totalA = a.warehouseQuantities.reduce((s, w) => s + w.quantity, 0);
        const totalB = b.warehouseQuantities.reduce((s, w) => s + w.quantity, 0);
        switch (stockSort) {
          case 'qty-asc': return totalA - totalB;
          case 'qty-desc': return totalB - totalA;
          case 'cost': return b.costPrice - a.costPrice;
          case 'low-first': return (totalA <= a.threshold ? 0 : 1) - (totalB <= b.threshold ? 0 : 1) || totalA - totalB;
          default: return (a.name || '').localeCompare(b.name || '');
        }
      });

    if (inventory.length === 0 && !searchQuery) {
      return (
        <div className="p-8">
          <PageSkeleton />
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col min-h-0 relative z-10 w-full overflow-hidden">
        {/* Sort Bar */}
        <div className="px-6 py-4 flex items-center gap-2 border-b border-border/20 bg-elevated/20 sticky top-0 z-20 backdrop-blur-md">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted mr-2">{lang === 'ar' ? 'ترتيب:' : 'Sort:'}</span>
          {[
            { id: 'name', label: lang === 'ar' ? 'الاسم' : 'Name' },
            { id: 'qty-asc', label: lang === 'ar' ? 'الأقل كمية' : 'Qty ↑' },
            { id: 'qty-desc', label: lang === 'ar' ? 'الأكثر كمية' : 'Qty ↓' },
            { id: 'cost', label: lang === 'ar' ? 'التكلفة' : 'Cost' },
            { id: 'low-first', label: lang === 'ar' ? 'نقص أولاً' : 'Low First' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStockSort(s.id as any)}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border ${stockSort === s.id
                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'bg-card/30 text-muted border-border/20 hover:border-emerald-500/20 hover:text-emerald-400'
                }`}
            >
              {s.label}
            </button>
          ))}
          <span className="ml-auto text-[9px] font-bold text-muted tabular-nums bg-elevated/40 px-2 py-1 rounded-lg border border-border/10">
            {filtered.length} {lang === 'ar' ? 'صنف' : 'items'}
          </span>
        </div>

        {/* Header Row */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.8fr] gap-4 px-8 py-5 bg-elevated/30 border-b border-border/20 text-muted text-[10px] uppercase font-black tracking-widest sticky top-0 z-20">
          <div className="whitespace-nowrap">{lang === 'ar' ? 'الصنف' : 'Item Name'}</div>
          <div className="whitespace-nowrap">{lang === 'ar' ? 'التوزيع' : 'Warehouses'}</div>
          <div className="whitespace-nowrap">{lang === 'ar' ? 'الكمية الإجمالية' : 'Total Qty'}</div>
          <div className="whitespace-nowrap font-secondary">{lang === 'ar' ? 'سعر الشراء' : 'Purchase Price'}</div>
          <div className="whitespace-nowrap">{lang === 'ar' ? 'التكلفة' : 'Cost'}</div>
          <div className="whitespace-nowrap text-right">{lang === 'ar' ? 'إجراءات' : 'Actions'}</div>
        </div>

        {/* Virtualized Body */}
        <div className="flex-1 overflow-hidden min-h-0 bg-card/10">
          <VirtualList
            itemCount={filtered.length}
            itemHeight={100}
            overscan={5}
            getKey={(index) => filtered[index].id}
            renderItem={(index) => {
              const item = filtered[index];
              const totalQty = item.warehouseQuantities.reduce((acc, curr) => acc + curr.quantity, 0);
              const isLow = totalQty <= item.threshold;
              return (
                <div 
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.8fr] gap-4 px-8 items-center h-full hover:bg-emerald-500/5 transition-colors border-b border-white/5 group"
                >
                  {/* Item Profile */}
                  <div className="flex items-center gap-4 py-2">
                    <div className={`p-3.5 rounded-[1.2rem] border ${item.isComposite ? 'bg-violet-500/10 text-violet-500 border-violet-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'} shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-out`}>
                      {item.isComposite ? <Layers size={20} /> : <Package size={20} />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-main text-[13px] truncate group-hover:text-emerald-500 transition-colors uppercase">
                        {lang === 'ar' ? item.nameAr || item.name : item.name}
                      </div>
                      <div className="text-[10px] flex items-center gap-2 mt-1 truncate">
                        <span className="uppercase font-black tracking-widest text-muted">{item.category}</span>
                        {item.sku && <span className="font-mono font-bold tracking-widest text-teal-500 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">[{item.sku}]</span>}
                      </div>
                    </div>
                  </div>

                  {/* Warehouses */}
                  <div className="flex flex-wrap gap-1.5 py-2">
                    {item.warehouseQuantities.slice(0, 3).map(wq => {
                      const wh = warehouses.find(w => w.id === wq.warehouseId);
                      return (
                        <span key={wq.warehouseId} className="px-2 py-1 bg-elevated/40 border border-border/20 shadow-sm rounded-lg text-[9px] font-bold text-main hover:border-emerald-500/30 transition-colors">
                          {wh?.name}: {wq.quantity}
                        </span>
                      );
                    })}
                    {item.warehouseQuantities.length > 3 && <span className="text-[9px] font-black text-muted">+{item.warehouseQuantities.length - 3} More</span>}
                    {item.warehouseQuantities.length === 0 && <span className="text-[10px] italic text-muted opacity-60">Empty Stock</span>}
                  </div>

                  {/* Qty */}
                  <div className="font-black py-2">
                    <div className={`text-[13px] ${isLow ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'text-main'}`}>
                      {totalQty} <span className="text-[10px] text-muted ml-0.5 font-normal">{item.unit}</span>
                    </div>
                    {isLow && (
                      <div className="text-[8px] uppercase font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 w-fit px-1.5 py-0.25 rounded mt-1 overflow-hidden whitespace-nowrap animate-pulse">
                        Low Stock
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="font-black text-[13px] text-emerald-500 drop-shadow-sm py-2">
                    {settings.currencySymbol || 'ج.م'} {(item.purchasePrice || 0).toLocaleString()}
                  </div>

                  {/* Cost */}
                  <div className="font-black text-[13px] text-muted/80 py-2">
                    {settings.currencySymbol || 'ج.م'} {item.costPrice.toLocaleString()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pr-2 opacity-30 group-hover:opacity-100 transition-opacity">
                    {/* AI Forecast Button */}
                    <button
                      onClick={() => handleRequestForecast(item.id)}
                      disabled={aiForecasts[item.id]?.loading}
                      title={lang === 'ar' ? 'توقعات الذكاء الاصطناعي' : 'AI Forecast'}
                      className={`p-2.5 backdrop-blur-md border border-border/20 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 ${
                        aiForecasts[item.id]?.loading 
                          ? 'bg-primary/5 text-primary animate-pulse' 
                          : 'bg-card/50 hover:bg-primary/10 hover:border-primary/30 text-muted hover:text-primary'
                      }`}
                    >
                      <Activity size={15} />
                      {aiForecasts[item.id]?.text && (
                        <div className="absolute bottom-full right-0 mb-3 w-64 p-3 bg-card/95 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl z-50 text-[10px] normal-case font-bold text-main leading-relaxed ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-2">
                           <div className="flex items-center gap-2 mb-1.5 text-primary uppercase tracking-tighter">
                              <Activity size={10} /> 
                              {lang === 'ar' ? 'تحليل ذكي' : 'Smart Insight'}
                           </div>
                           {aiForecasts[item.id].text}
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => { setEditingItem(item); setItemModalOpen(true); }}
                      className="p-2.5 bg-card/50 backdrop-blur-md hover:bg-emerald-500/10 border border-border/20 hover:border-emerald-500/30 rounded-xl text-muted hover:text-emerald-500 transition-all shadow-sm active:scale-95"
                    >
                      <Tag size={15} />
                    </button>
                    <button
                      onClick={() => { setEditingItem(item); setAdjustmentModalOpen(true); }}
                      className="p-2.5 bg-card/50 backdrop-blur-md hover:bg-amber-500/10 border border-border/20 hover:border-amber-500/30 rounded-xl text-muted hover:text-amber-500 transition-all shadow-sm active:scale-95"
                    >
                      <Calculator size={15} />
                    </button>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>
    );
  };
  const renderWarehouses = () => (
    <div className="p-8 grid-auto-fit gap-8 relative z-10 w-full">
      <button
        onClick={() => setWarehouseModalOpen(true)}
        className="bg-card/40 backdrop-blur-md border-2 border-dashed border-border/30 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300 group min-h-[200px]"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-1 shadow-inner">
          <Plus size={32} />
        </div>
        <span className="text-[11px] font-black text-muted group-hover:text-emerald-500 uppercase tracking-[0.2em] transition-colors">{lang === 'ar' ? 'إضافة مخزن' : 'Add Warehouse'}</span>
      </button>

      {warehouses.map(wh => {
        const branch = branches.find(b => b.id === wh.branchId);
        const parent = warehouses.find(w => w.id === wh.parentId);
        return (
          <div key={wh.id} className="bg-card/60 backdrop-blur-3xl border border-border/20 p-8 rounded-[2.5rem] flex flex-col justify-between group cursor-pointer hover:border-emerald-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] transition-all duration-500 ease-out hover:-translate-y-2 relative overflow-hidden" onClick={() => setSelectedWarehouse(wh)}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 ease-out">
                <Home size={28} />
              </div>
              <div className="text-right flex flex-col items-end">
                <div className={`w-3 h-3 rounded-full mb-2 border-2 border-card ${wh.isActive ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-slate-500 shadow-inner'}`} />
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border ${wh.isActive ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : 'text-slate-400 border-slate-500/20 bg-slate-500/10'}`}>
                  {wh.isActive ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-black text-2xl text-main uppercase tracking-tight group-hover:text-emerald-500 transition-colors drop-shadow-sm">{wh.name}</h4>
                {wh.parentId && <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-500 uppercase tracking-widest rounded shadow-sm">Sub</span>}
              </div>
              <p className="text-[13px] text-muted font-bold mb-8 flex items-center gap-2">
                <Briefcase size={14} className="opacity-50" />
                {branch?.name || 'Central'} <span className="opacity-50">•</span> {wh.type}
              </p>

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted border-t border-border/30 pt-5">
                <div className="flex items-center gap-2 bg-elevated/40 px-3 py-1.5 rounded-lg border border-border/20 shadow-sm">
                  <Package size={14} className="text-emerald-500" />
                  <span className="text-main">{inventory.filter(i => i.warehouseQuantities.some(wq => wq.warehouseId === wh.id)).length} SKUs</span>
                </div>
                {parent && (
                  <div className="flex items-center gap-2 text-indigo-400">
                    <ArrowRightLeft size={14} />
                    <span className="truncate max-w-[100px]">{parent.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const handleUpsertSupplier = async () => {
    if (!supplierForm.name.trim()) return;
    if (supplierForm.id) {
      await updateSupplierInDB(supplierForm);
    } else {
      await createSupplierInDB({ ...supplierForm, id: `sup-${Date.now()}` });
    }
    setSupplierForm({ id: '', name: '', contactPerson: '', phone: '', email: '', category: '' });
    setSelectedSupplier(null);
  };

  const renderSuppliers = () => (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-10 w-full">
      <div className="xl:col-span-1 bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/20 p-6 space-y-4 shadow-lg group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 flex items-center gap-2 relative z-10">
          <Truck size={16} /> {supplierForm.id ? 'Edit Supplier' : 'Add Supplier'}
        </h4>
        <div className="space-y-3 relative z-10">
          <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Supplier Name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
          <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Contact Person" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} />
          <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
          <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
          <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Category" value={supplierForm.category} onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-4 border-t border-border/20 relative z-10">
          <button onClick={() => { setSupplierForm({ id: '', name: '', contactPerson: '', phone: '', email: '', category: '' }); setSelectedSupplier(null); }} className="flex-1 px-4 py-3.5 rounded-2xl bg-elevated/30 hover:bg-elevated/60 text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-border/20 active:scale-95 text-muted hover:text-main">Clear</button>
          <button onClick={handleUpsertSupplier} className="flex-[2] px-4 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 border border-indigo-400/30">{supplierForm.id ? 'Update' : 'Register'}</button>
        </div>
      </div>
      <div className="xl:col-span-2 bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/20 overflow-hidden shadow-lg flex flex-col relative z-10">
        <div className="responsive-table flex-1">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-elevated/30 text-[10px] uppercase font-black tracking-widest text-muted border-b border-border/20">
              <tr>
                <th className="px-6 py-5 whitespace-nowrap">Supplier Profile</th>
                <th className="px-6 py-5 whitespace-nowrap">Contact Info</th>
                <th className="px-6 py-5 whitespace-nowrap">Category Segment</th>
                <th className="px-6 py-5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {suppliers
                .filter(s => (s.name + s.contactPerson + s.phone + s.email).toLowerCase().includes(searchQuery.toLowerCase()))
                .map((s) => (
                  <tr key={s.id} className="hover:bg-indigo-500/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-lg border border-indigo-500/20 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                          {s.name.charAt(0)}
                        </div>
                        <div className="font-bold text-main text-[13px] group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{s.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[12px] font-bold text-main flex items-center gap-2 mb-1">
                        {s.contactPerson || <span className="text-muted italic text-[10px]">No Contact</span>}
                      </div>
                      <div className="text-[11px] font-bold text-muted flex items-center gap-2">
                        {s.phone || '-'} <span className="opacity-30">•</span> {s.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {s.category ? (
                        <span className="px-2.5 py-1 bg-elevated/50 border border-border/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-muted">{s.category}</span>
                      ) : (
                        <span className="text-muted/50 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelectedSupplier(s); setSupplierForm(s); }} className="px-3 py-1.5 rounded-lg bg-card/50 border border-border/30 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30 text-[10px] font-black uppercase tracking-widest text-muted transition-all active:scale-95">Edit</button>
                        <button onClick={() => deactivateSupplierInDB(s.id)} className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">Suspend</button>
                      </div>
                    </td>
                  </tr>
                ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted font-black uppercase tracking-[0.2em] text-[11px]">
                    No suppliers matched your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handleCreatePO = async () => {
    if (!poSupplierId || !poItemId || poQty <= 0 || poPrice <= 0) return;
    const item = inventory.find(i => i.id === poItemId);
    if (!item) return;
    const activeBranchId = settings.activeBranchId || branches[0]?.id;
    if (!activeBranchId) return;
    await createPurchaseOrderInDB({
      id: `po-${Date.now()}`,
      supplierId: poSupplierId,
      status: 'DRAFT',
      items: [{ itemId: poItemId, itemName: item.name, quantity: poQty, unitPrice: poPrice }],
      totalCost: poQty * poPrice,
      date: new Date(),
      targetWarehouseId: poWarehouseId || undefined,
      approvedById: undefined,
    }, activeBranchId);
    setPoQty(1);
    setPoPrice(0);
    setPoItemId('');
    await fetchPurchaseOrders();
  };

  const handlePoStatusUpdate = async (poId: string, status: PurchaseOrder['status']) => {
    await updatePurchaseOrderStatusInDB(poId, status);
    await fetchPurchaseOrders();
  };

  const handleReceivePO = async (po: PurchaseOrder) => {
    const wh = po.targetWarehouseId || poWarehouseId || warehouses[0]?.id;
    if (!wh) return;
    await receivePurchaseOrderInDB(po.id, wh, []);
    await fetchPurchaseOrders();
  };

  const handleCreateBranchTransfer = async () => {
    if (!branchTransferItemId || !branchTransferFromWh || !branchTransferToWh || branchTransferQty <= 0) return;
    await createBranchTransferInDB({
      itemId: branchTransferItemId,
      fromWarehouseId: branchTransferFromWh,
      toWarehouseId: branchTransferToWh,
      quantity: branchTransferQty,
      reason: branchTransferReason,
      actorId: settings.currentUser?.id,
    });
    setBranchTransferQty(1);
  };

  const renderBranchLogistics = () => {
    const sourceWarehouse = warehouses.find(w => w.id === branchTransferFromWh);
    const currentSourceBranchId = sourceWarehouse?.branchId;
    const destinationWarehouses = warehouses.filter(w => w.id !== branchTransferFromWh && (!currentSourceBranchId || w.branchId !== currentSourceBranchId));

    return (
      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-10 w-full">
        <div className="xl:col-span-1 bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/20 p-6 space-y-4 shadow-lg group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-6 flex items-center gap-2 relative z-10">
            <ArrowRightLeft size={16} /> Inter-Branch Transfer
          </h4>
          <div className="space-y-3 relative z-10">
            <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={branchTransferItemId} onChange={(e) => setBranchTransferItemId(e.target.value)}>
              <option value="" className="bg-card">Select Item</option>
              {inventory.map(i => <option key={i.id} value={i.id} className="bg-card">{i.name}</option>)}
            </select>
            <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={branchTransferFromWh} onChange={(e) => setBranchTransferFromWh(e.target.value)}>
              <option value="" className="bg-card">From Warehouse</option>
              {warehouses.map(w => <option key={w.id} value={w.id} className="bg-card">{w.name}</option>)}
            </select>
            <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={branchTransferToWh} onChange={(e) => setBranchTransferToWh(e.target.value)}>
              <option value="" className="bg-card">To Warehouse (different branch)</option>
              {destinationWarehouses.map(w => <option key={w.id} value={w.id} className="bg-card">{w.name}</option>)}
            </select>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[10px] font-black uppercase">Qty</span>
              <input type="number" className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all text-main font-bold text-sm shadow-inner" value={branchTransferQty} onChange={(e) => setBranchTransferQty(Number(e.target.value || 0))} />
            </div>
            <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Reason for Transfer..." value={branchTransferReason} onChange={(e) => setBranchTransferReason(e.target.value)} />
          </div>
          <div className="pt-4 border-t border-border/20 relative z-10">
            <button onClick={handleCreateBranchTransfer} className="w-full px-4 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(6,182,212,0.2)] hover:shadow-[0_15px_30px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 border border-cyan-400/30">Execute Transfer</button>
          </div>
        </div>
        <div className="xl:col-span-2 bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/20 overflow-hidden shadow-lg flex flex-col relative z-10">
          <div className="responsive-table flex-1">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-elevated/30 text-[10px] uppercase font-black tracking-widest text-muted border-b border-border/20">
                <tr>
                  <th className="px-6 py-5 whitespace-nowrap">Timestamp</th>
                  <th className="px-6 py-5 whitespace-nowrap">Asset</th>
                  <th className="px-6 py-5 whitespace-nowrap">Source</th>
                  <th className="px-6 py-5 whitespace-nowrap">Destination</th>
                  <th className="px-6 py-5 whitespace-nowrap">Qty</th>
                  <th className="px-6 py-5 whitespace-nowrap">Manifest Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transferMovements.map((mv: any) => (
                  <tr key={mv.id} className="hover:bg-cyan-500/5 transition-colors group">
                    <td className="px-6 py-5 text-[11px] font-bold text-muted">{new Date(mv.createdAt).toLocaleDateString()} {new Date(mv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-[13px] text-main">{mv.itemName}</div>
                    </td>
                    <td className="px-6 py-5 text-[12px] font-bold text-muted">{mv.fromWarehouseName}</td>
                    <td className="px-6 py-5 text-[12px] font-bold text-muted">{mv.toWarehouseName}</td>
                    <td className="px-6 py-5">
                      <span className="text-[12px] font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{Number(mv.quantity || 0)}</span>
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-muted truncate max-w-[150px]">{mv.reason || '-'}</td>
                  </tr>
                ))}
                {transferMovements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted font-black uppercase tracking-[0.2em] text-[11px]">
                      No logistics movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPurchaseOrders = () => (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-10 w-full">
      <div className="xl:col-span-1 bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/20 p-6 space-y-4 shadow-lg group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500 mb-6 flex items-center gap-2 relative z-10">
          <FileText size={16} /> Create Purchase Order
        </h4>
        <div className="space-y-3 relative z-10">
          <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={poSupplierId} onChange={(e) => setPoSupplierId(e.target.value)}>
            <option value="" className="bg-card">Select Supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id} className="bg-card">{s.name}</option>)}
          </select>
          <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={poItemId} onChange={(e) => setPoItemId(e.target.value)}>
            <option value="" className="bg-card">Select Item</option>
            {inventory.map(i => <option key={i.id} value={i.id} className="bg-card">{i.name}</option>)}
          </select>
          <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={poWarehouseId} onChange={(e) => setPoWarehouseId(e.target.value)}>
            <option value="" className="bg-card">Target Warehouse (optional)</option>
            {warehouses.map(w => <option key={w.id} value={w.id} className="bg-card">{w.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[10px] font-black uppercase">Qty</span>
              <input type="number" className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all text-main font-bold text-sm shadow-inner" value={poQty} onChange={(e) => setPoQty(Number(e.target.value || 0))} />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[10px] font-black uppercase">Price</span>
              <input type="number" className="w-full pl-14 pr-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-border/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all text-main font-bold text-sm shadow-inner" value={poPrice} onChange={(e) => setPoPrice(Number(e.target.value || 0))} />
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-border/20 relative z-10">
          <button onClick={handleCreatePO} className="w-full px-4 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_30px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 border border-amber-400/30">Create PO</button>
        </div>
      </div>
      <div className="xl:col-span-2 bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/20 overflow-hidden shadow-lg flex flex-col relative z-10">
        <div className="responsive-table flex-1">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-elevated/30 text-[10px] uppercase font-black tracking-widest text-muted border-b border-border/20">
              <tr>
                <th className="px-6 py-5 whitespace-nowrap">Order Info</th>
                <th className="px-6 py-5 whitespace-nowrap">Supplier</th>
                <th className="px-6 py-5 whitespace-nowrap">Status</th>
                <th className="px-6 py-5 whitespace-nowrap">Amount</th>
                <th className="px-6 py-5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {purchaseOrders
                .filter(po => po.id.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((po) => (
                  <tr key={po.id} className="hover:bg-amber-500/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-mono text-[11px] font-black text-amber-500 bg-amber-500/10 w-fit px-2 py-1 rounded border border-amber-500/20">{po.id}</div>
                      <div className="text-[10px] font-bold text-muted mt-1.5 flex items-center gap-1">
                        <Package size={12} /> {po.items.length > 0 ? `${po.items.length} item(s)` : 'Empty'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-[13px] text-main">{suppliers.find(s => s.id === po.supplierId)?.name || po.supplierId}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${po.status === 'RECEIVED' || po.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : po.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : po.status === 'DRAFT' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-black text-[13px] text-main drop-shadow-sm">{po.totalCost.toLocaleString()} {settings?.currencySymbol || 'EGP'}</div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity flex-wrap justify-end max-w-[200px] ml-auto">
                        {po.status === 'DRAFT' && (
                          <button onClick={() => handlePoStatusUpdate(po.id, 'PENDING_APPROVAL')} className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">Submit</button>
                        )}
                        {po.status === 'PENDING_APPROVAL' && (
                          <button onClick={() => handlePoStatusUpdate(po.id, 'ORDERED')} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">Approve</button>
                        )}
                        {po.status === 'ORDERED' && (
                          <button onClick={() => handlePoStatusUpdate(po.id, 'SENT')} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">Send</button>
                        )}
                        {po.status !== 'RECEIVED' && po.status !== 'CLOSED' && po.status !== 'CANCELLED' && (
                          <button onClick={() => handlePoStatusUpdate(po.id, 'CANCELLED')} className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">Cancel</button>
                        )}
                        {(po.status === 'SENT' || po.status === 'PARTIAL') && (
                          <button onClick={() => handleReceivePO(po)} className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 border border-teal-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm">Receive</button>
                        )}
                        {po.status === 'RECEIVED' && (
                          <button onClick={() => handlePoStatusUpdate(po.id, 'CLOSED')} className="px-3 py-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">Close</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-shell min-h-[100dvh] transition-colors animate-fade-in relative z-10 pb-24 space-y-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-2xl md:text-3xl font-black text-main tracking-tight flex items-center gap-4">
              <div className="w-11 h-11 bg-elevated/70 rounded-2xl flex items-center justify-center border border-border/50 text-primary shrink-0 shadow-sm">
                <Package size={24} />
              </div>
              {lang === 'ar' ? 'المخزن والتوريد' : 'Smart Inventory'}
            </h2>
          </div>
          <p className="text-sm text-muted font-semibold mt-2 max-w-2xl">
            {lang === 'ar'
              ? 'إدارة مخزون المركز والفروع، التحكم في التوريد، تحويلات بين المخازن، والجرد الدوري بنظام تتبع متكامل.'
              : 'Enterprise-grade supply chain management. Control stock across multiple branches, manage transfers, and track audit history.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          <button
            onClick={() => setReceiptModalOpen(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-card/80 text-emerald-500 px-6 py-4 rounded-[1.5rem] hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:shadow-emerald-500/20 active:scale-95"
          >
            <Download size={18} /> {lang === 'ar' ? 'إذن استلام' : 'Receive'}
          </button>
          <button
            onClick={() => setTransferModalOpen(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-card/80 text-indigo-500 px-6 py-4 rounded-[1.5rem] hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20 font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:shadow-indigo-500/20 active:scale-95"
          >
            <ArrowRightLeft size={18} /> {lang === 'ar' ? 'تحويل' : 'Transfer'}
          </button>
          <button
            onClick={() => setItemModalOpen(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-[1.5rem] hover:opacity-90 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/25 active:scale-95 border border-emerald-400/30"
          >
            <Plus size={18} /> {lang === 'ar' ? 'إضافة صنف' : 'Add Item'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-8 mb-8 relative z-20">
        <div className="flex gap-2 md:gap-4 border-b border-border/20 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'STOCK', label: lang === 'ar' ? 'الأصناف' : 'Stock Items', icon: Package, color: 'text-emerald-500', activeBg: 'bg-emerald-500/10' },
            { id: 'STOCKCOUNT', label: lang === 'ar' ? 'الجرد' : 'Stock Count', icon: ClipboardCheck, color: 'text-violet-500', activeBg: 'bg-violet-500/10' },
            { id: 'MOVEMENTS', label: lang === 'ar' ? 'حركة المخزون' : 'Movements', icon: Activity, color: 'text-sky-500', activeBg: 'bg-sky-500/10' },
            { id: 'SUPPLIERS', label: lang === 'ar' ? 'الموردين' : 'Suppliers', icon: Truck, color: 'text-indigo-500', activeBg: 'bg-indigo-500/10' },
            { id: 'PO', label: lang === 'ar' ? 'طلبات الشراء' : 'Purchase Orders', icon: FileText, color: 'text-amber-500', activeBg: 'bg-amber-500/10' },
            { id: 'WAREHOUSES', label: lang === 'ar' ? 'المخازن' : 'Warehouses', icon: Home, color: 'text-rose-500', activeBg: 'bg-rose-500/10' },
            { id: 'BRANCHES', label: lang === 'ar' ? 'الفروع' : 'Branches', icon: Briefcase, color: 'text-cyan-500', activeBg: 'bg-cyan-500/10' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-4 text-[10px] md:text-[11px] font-black flex items-center gap-2 transition-all border-b-2 whitespace-nowrap uppercase tracking-[0.2em] relative overflow-hidden ${activeTab === tab.id ? `border-current ${tab.color}` : 'border-transparent text-muted hover:text-main'}`}
            >
              <div className={`${activeTab === tab.id ? tab.activeBg : 'bg-transparent'} p-1.5 rounded-xl transition-colors`}>
                <tab.icon size={18} />
              </div>
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-50" />}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-96 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[1.5rem] blur-md opacity-20 group-focus-within:opacity-40 transition-opacity duration-500" />
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted w-5 h-5 group-focus-within:text-emerald-500 transition-colors z-10" />
            <input
              type="text"
              placeholder={lang === 'ar' ? 'بحث عن صنف، رقم كود، مورد...' : "Search inventory..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-card/80 border border-border/30 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner font-bold text-sm text-main placeholder:text-muted/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-card/90 rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-border/20 overflow-hidden min-h-[420px] md:min-h-[520px] lg:min-h-[600px] relative z-20 group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-50 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 opacity-50" />
        {activeTab === 'STOCK' && renderStock()}
        {activeTab === 'WAREHOUSES' && renderWarehouses()}
        {activeTab === 'SUPPLIERS' && renderSuppliers()}
        {activeTab === 'PO' && renderPurchaseOrders()}
        {activeTab === 'BRANCHES' && renderBranchLogistics()}

        {/* ═══ STOCK COUNT TAB ═══ */}
        {activeTab === 'STOCKCOUNT' && (
          <div className="p-6 md:p-8 space-y-6 relative z-10">
            {!countSession ? (
              <div className="text-center py-16 space-y-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/30 shadow-lg shadow-violet-500/10">
                  <ClipboardCheck size={36} className="text-violet-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-main mb-2">
                    {lang === 'ar' ? 'بدء جلسة جرد جديدة' : 'Start New Stock Count'}
                  </h3>
                  <p className="text-muted text-sm font-medium max-w-md mx-auto">
                    {lang === 'ar' ? 'اختر المخزن وابدأ عد الأصناف مقابل الكميات في النظام' : 'Select a warehouse and count physical items against system quantities'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <select
                    value={selectedCountWarehouse}
                    onChange={(e) => setSelectedCountWarehouse(e.target.value)}
                    className="px-5 py-3 bg-card border border-border rounded-2xl text-main font-bold text-sm min-w-[200px]"
                  >
                    <option value="">{lang === 'ar' ? 'اختر المخزن...' : 'Select Warehouse...'}</option>
                    {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                  </select>
                  <button
                    onClick={handleStartCount}
                    disabled={!selectedCountWarehouse || countLoading}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-violet-500/25 hover:opacity-90 disabled:opacity-40 transition-all active:scale-95"
                  >
                    <Play size={16} />
                    {countLoading ? '...' : (lang === 'ar' ? 'بدء الجرد' : 'Start Count')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-main flex items-center gap-2">
                      <ClipboardCheck size={22} className="text-violet-500" />
                      {lang === 'ar' ? `جلسة جرد — ${warehouses.find(w => w.id === countSession.warehouseId)?.name || ''}` : `Count Session — ${warehouses.find(w => w.id === countSession.warehouseId)?.name || ''}`}
                    </h3>
                    <p className="text-xs text-muted font-bold mt-1">
                      {countSession.items?.length || 0} {lang === 'ar' ? 'صنف' : 'items'} • ID: {countSession.id?.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCompleteCount(false)}
                      disabled={countLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-2xl text-muted font-black text-xs uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                    >
                      <X size={14} />
                      {lang === 'ar' ? 'إلغاء بدون تسوية' : 'Cancel (No Adjust)'}
                    </button>
                    <button
                      onClick={() => handleCompleteCount(true)}
                      disabled={countLoading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-all active:scale-95"
                    >
                      <CheckCircle2 size={14} />
                      {countLoading ? '...' : (lang === 'ar' ? 'اعتماد وتطبيق التسوية' : 'Complete & Apply')}
                    </button>
                  </div>
                </div>

                <div className="responsive-table">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'الصنف' : 'Item'}</th>
                        <th className="text-center px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'الوحدة' : 'Unit'}</th>
                        <th className="text-center px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'كمية النظام' : 'System Qty'}</th>
                        <th className="text-center px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'العد الفعلي' : 'Counted'}</th>
                        <th className="text-center px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'الفرق' : 'Variance'}</th>
                        <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {(countSession.items || []).map((ci: any) => {
                        const variance = ci.countedQty !== null ? ci.countedQty - ci.systemQty : 0;
                        return (
                          <tr key={ci.itemId} className="hover:bg-card/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-main">{ci.itemName}</td>
                            <td className="px-4 py-3 text-center text-muted text-xs font-bold uppercase">{ci.unit}</td>
                            <td className="px-4 py-3 text-center font-bold text-muted tabular-nums">{ci.systemQty}</td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                value={ci.countedQty ?? ''}
                                onChange={(e) => handleUpdateCountItem(ci.itemId, 'countedQty', e.target.value === '' ? null : Number(e.target.value))}
                                className="w-20 text-center px-2 py-1.5 bg-card border border-border rounded-xl font-bold text-main text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none"
                                placeholder="—"
                              />
                            </td>
                            <td className={`px-4 py-3 text-center font-black tabular-nums ${ci.countedQty === null ? 'text-muted' : variance > 0 ? 'text-emerald-500' : variance < 0 ? 'text-rose-500' : 'text-muted'
                              }`}>
                              {ci.countedQty !== null ? (variance > 0 ? `+${variance}` : variance) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={ci.notes || ''}
                                onChange={(e) => handleUpdateCountItem(ci.itemId, 'notes', e.target.value)}
                                className="w-full px-2 py-1.5 bg-card border border-border rounded-xl text-xs font-medium text-main outline-none focus:ring-2 focus:ring-violet-500/50"
                                placeholder={lang === 'ar' ? 'ملاحظة...' : 'Note...'}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ MOVEMENTS LOG TAB ═══ */}
        {activeTab === 'MOVEMENTS' && (
          <div className="p-6 md:p-8 space-y-6 relative z-10">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-sky-500" />
                <input
                  type="date"
                  value={movementDateFrom}
                  onChange={(e) => setMovementDateFrom(e.target.value)}
                  className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-bold text-main"
                />
                <span className="text-muted text-xs font-bold">{lang === 'ar' ? 'إلى' : 'to'}</span>
                <input
                  type="date"
                  value={movementDateTo}
                  onChange={(e) => setMovementDateTo(e.target.value)}
                  className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-bold text-main"
                />
              </div>
              <button
                onClick={loadMovements}
                disabled={movementLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-500/10 text-sky-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-sky-500/20 hover:bg-sky-500 hover:text-white transition-all active:scale-95"
              >
                <Activity size={14} />
                {movementLoading ? '...' : (lang === 'ar' ? 'تحميل' : 'Load')}
              </button>
              <span className="text-xs font-bold text-muted">
                {movementLog.length} {lang === 'ar' ? 'حركة' : 'movements'}
              </span>
            </div>

            <div className="overflow-x-auto">
              {movementLog.length === 0 ? (
                <div className="text-center py-16">
                  <Activity size={48} className="mx-auto text-muted/30 mb-4" />
                  <p className="text-muted font-bold text-sm">
                    {movementLoading ? (lang === 'ar' ? 'جارٍ التحميل...' : 'Loading...') : (lang === 'ar' ? 'لا توجد حركات في هذه الفترة' : 'No movements in this period')}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                      <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'الصنف' : 'Item'}</th>
                      <th className="text-center px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                      <th className="text-center px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                      <th className="text-center px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'التكلفة' : 'Cost'}</th>
                      <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'السبب' : 'Reason'}</th>
                      <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider">{lang === 'ar' ? 'بواسطة' : 'By'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {movementLog.map((mv, idx) => {
                      const typeColors: Record<string, string> = {
                        ADJUSTMENT: 'bg-amber-500/10 text-amber-600', TRANSFER: 'bg-indigo-500/10 text-indigo-600',
                        PURCHASE: 'bg-emerald-500/10 text-emerald-600', SALE: 'bg-rose-500/10 text-rose-600',
                        WASTE: 'bg-red-500/10 text-red-600', SALE_CONSUMPTION: 'bg-rose-500/10 text-rose-600',
                      };
                      return (
                        <tr key={mv.id || idx} className="hover:bg-card/50 transition-colors">
                          <td className="px-4 py-3 text-xs font-bold text-muted whitespace-nowrap tabular-nums">
                            {new Date(mv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 font-bold text-main text-xs">{mv.itemName}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${typeColors[mv.type] || 'bg-card text-muted'}`}>
                              {mv.type}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-center font-black tabular-nums ${mv.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-muted tabular-nums text-xs">
                            {mv.totalCost ? `${mv.totalCost.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted font-medium truncate max-w-[200px]">{mv.reason || '—'}</td>
                          <td className="px-4 py-3 text-xs text-muted font-bold">{mv.performedBy || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ItemModal
        isOpen={itemModalOpen}
        onClose={() => { setItemModalOpen(false); setEditingItem(null); }}
        onSave={handleSaveItem}
        lang={lang}
        warehouses={warehouses}
        existingItems={inventory}
        initialItem={editingItem}
      />

      <WarehouseModal
        isOpen={warehouseModalOpen}
        onClose={() => setWarehouseModalOpen(false)}
        onSave={handleSaveWarehouse}
        lang={lang}
        branches={branches}
        warehouses={warehouses}
      />

      <StockAdjustmentModal
        isOpen={adjustmentModalOpen}
        onClose={() => { setAdjustmentModalOpen(false); setEditingItem(null); }}
        onSave={handleAdjustment}
        lang={lang}
        items={inventory}
        warehouses={warehouses}
        initialItem={editingItem}
      />

      <StockTransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSave={handleTransfer}
        lang={lang}
        items={inventory}
        warehouses={warehouses}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        onSave={handleReceipt}
        lang={lang}
        inventory={inventory}
        warehouses={warehouses}
        suppliers={suppliers}
      />
    </div>
  );
};

export default Inventory;
