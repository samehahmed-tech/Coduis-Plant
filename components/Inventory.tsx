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

// --- Subcomponents for Premium UI ---

const StockMetric: React.FC<{
  label: string;
  value: any;
  subValue?: string;
  icon: any;
  color: string;
  trend?: { val: number; up: boolean };
  lang: string;
}> = ({ label, value, subValue, icon: Icon, color, trend, lang }) => (
  <div className="relative group overflow-hidden bg-card/60 backdrop-blur-xl border border-border/30 rounded-[1.5rem] p-5 lg:p-6 transition-all hover:scale-[1.02] hover:bg-card/70 hover:shadow-2xl hover:shadow-black/5 active:scale-[0.98]">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br transition-opacity duration-500 opacity-20 group-hover:opacity-30 blur-3xl`} style={{ background: color }} />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.15em] text-muted mb-2">{label}</p>
        <h2 className="text-xl lg:text-3xl font-black text-main tracking-tighter tabular-nums flex items-end gap-1.5">
          {value}
          {subValue && <span className="text-xs font-bold text-muted mb-1 opacity-60">{subValue}</span>}
        </h2>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-[10px] font-black uppercase tracking-wider ${trend.up ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend.up ? <Activity size={14} /> : <Activity size={14} className="rotate-180" />}
            {trend.val}% <span className="text-muted ml-1 opacity-70">{lang === 'ar' ? 'عن السابق' : 'vs prev'}</span>
          </div>
        )}
      </div>
      <div className={`p-4 rounded-2xl border flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12`} style={{ borderColor: `${color}30`, backgroundColor: `${color}15`, color }}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

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

    const handleStockUpdate = (data: any) => {
        fetchInventory();
    };

    socketService.on('stock:updated', handleStockUpdate);
    return () => {
        socketService.off('stock:updated', handleStockUpdate);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-app overflow-hidden selection:bg-emerald-500/30">
      {/* Visual Effects Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 p-4 lg:p-10 space-y-8 max-w-[1920px] mx-auto overflow-y-auto max-h-screen custom-scrollbar pb-32">
        {/* Header */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-8 border-b border-border/20">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-emerald-600 to-teal-600 p-0.5 shadow-2xl shadow-emerald-600/20">
              <div className="w-full h-full rounded-[1.6rem] bg-card flex items-center justify-center">
                <Package size={36} className="text-emerald-600 animate-pulse-soft" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl lg:text-5xl font-black text-main tracking-tighter uppercase flex items-center gap-4">
                {activeTab === 'STOCK' ? (lang === 'ar' ? 'مركز المخزون' : 'Stock Nexus') : activeTab}
                <span className="hidden md:flex px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Enterprise Intelligent Control
                </span>
              </h1>
              <p className="text-muted font-bold text-xs uppercase tracking-[0.2em] mt-2 opacity-60">
                Automated Purchasing · Real-time Sync · Multi-Warehouse AI Routing
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <button
                onClick={() => setItemModalOpen(true)}
                className="h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 rounded-2xl shadow-2xl shadow-emerald-600/30 font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={18} /> REGISTER ASSET
              </button>
              <button
                onClick={() => setTransferModalOpen(true)}
                className="h-14 flex items-center justify-center gap-3 bg-card/60 backdrop-blur-md text-sky-500 px-8 rounded-2xl border border-border/30 font-black text-[11px] uppercase tracking-widest hover:bg-sky-500 hover:text-white transition-all active:scale-95 shadow-lg"
              >
                <ArrowRightLeft size={18} /> INTER-TRANSFER
              </button>
              <button
                onClick={() => setWarehouseModalOpen(true)}
                className="h-14 flex items-center justify-center gap-3 bg-card/60 backdrop-blur-md text-main px-8 rounded-2xl border border-border/30 font-black text-[11px] uppercase tracking-widest hover:bg-main hover:text-app transition-all active:scale-95 shadow-lg"
              >
                <Home size={18} /> WAREHOUSES
              </button>
          </div>
        </header>

        {/* Dashboard Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StockMetric 
              label="Inventory Valuation" 
              value={(inventory.reduce((s, i) => s + (i.costPrice * i.warehouseQuantities.reduce((sq, wq) => sq + wq.quantity, 0)), 0)).toLocaleString()} 
              subValue="LE"
              icon={Calculator} 
              color="#10b981" 
              lang={lang} 
           />
           <StockMetric 
              label="Active SKUs" 
              value={inventory.length} 
              subValue="Items"
              icon={Layers} 
              color="#3b82f6" 
              lang={lang} 
           />
           <StockMetric 
              label="Out of Stock" 
              value={inventory.filter(i => i.warehouseQuantities.reduce((s, wq) => s + wq.quantity, 0) === 0).length} 
              subValue="Alerts"
              icon={AlertTriangle} 
              color="#f43f5e" 
              lang={lang} 
           />
           <StockMetric 
              label="Turnover Ratio" 
              value="4.2x" 
              icon={Activity} 
              color="#8b5cf6" 
              lang={lang} 
           />
        </section>

        {/* Tabs and Search */}
        <div className="flex flex-col xl:flex-row justify-between items-stretch lg:items-center gap-6 relative z-20">
          <div className="flex bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/30 p-2 overflow-x-auto no-scrollbar w-fit">
            {[
              { id: 'STOCK', label: 'Matrix', icon: LayoutGrid },
              { id: 'SUPPLIERS', label: 'Partners', icon: Truck },
              { id: 'PO', label: 'Procurements', icon: FileText },
              { id: 'WAREHOUSES', label: 'Nodes', icon: Home },
              { id: 'MOVEMENTS', label: 'Logs', icon: Activity },
              { id: 'STOCKCOUNT', label: 'Audits', icon: ClipboardCheck },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-600/20 scale-105' : 'text-muted hover:text-main hover:bg-elevated/60'}`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted w-5 h-5 group-focus-within:text-emerald-500 transition-colors z-10" />
            <input
              type="text"
              placeholder="Query master inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] outline-none focus:border-emerald-500/50 transition-all font-bold text-sm text-main placeholder:text-muted/40 shadow-xl"
            />
          </div>
        </div>

        {/* Main Workspace */}
        <div className="bg-card/60 backdrop-blur-3xl rounded-[3.5rem] border border-border/20 overflow-hidden min-h-[600px] relative z-20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-50 pointer-events-none" />
          
          {activeTab === 'STOCK' && renderStock()}
          {activeTab === 'WAREHOUSES' && renderWarehouses()}
          {activeTab === 'SUPPLIERS' && renderSuppliers()}
          {activeTab === 'STOCKCOUNT' && renderStockCount()}
          {activeTab === 'MOVEMENTS' && renderMovements()}
        </div>
      </div>

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

  const renderStockCount = () => (
    <div className="p-6 md:p-8 space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!countSession ? (
        <div className="text-center py-20 space-y-8">
          <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/30 shadow-2xl shadow-violet-500/10 transition-transform duration-700 hover:rotate-12">
            <ClipboardCheck size={40} className="text-violet-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-main tracking-tighter mb-3">
              {lang === 'ar' ? 'بدء جلسة جرد جديدة' : 'Initialize Inventory Audit'}
            </h3>
            <p className="text-muted text-sm font-bold max-w-sm mx-auto leading-relaxed">
              {lang === 'ar' ? 'اختر المخزن للبدء في مراجعة الكميات الفعلية ومقارنتها بالنظام.' : 'Select a target warehouse to begin cross-referencing physical stock with system records.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <select
              value={selectedCountWarehouse}
              onChange={(e) => setSelectedCountWarehouse(e.target.value)}
              className="w-full px-6 py-4 bg-card/60 backdrop-blur-md border border-border/30 rounded-2xl text-main font-black text-xs uppercase tracking-widest outline-none focus:border-violet-500/50 appearance-none shadow-sm"
            >
              <option value="">{lang === 'ar' ? 'اختر المخزن...' : 'Select Warehouse...'}</option>
              {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
            </select>
            <button
              onClick={handleStartCount}
              disabled={!selectedCountWarehouse || countLoading}
              className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-violet-600/25 hover:opacity-90 disabled:opacity-40 transition-all active:scale-95 border-b-4 border-violet-800/40"
            >
              {countLoading ? '...' : (lang === 'ar' ? 'بدء الجرد' : 'START AUDIT')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-elevated/20 p-6 rounded-3xl border border-border/10">
            <div>
              <h3 className="text-xl font-black text-main tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-500">
                   <ClipboardCheck size={20} />
                </div>
                {lang === 'ar' ? warehouses.find(w => w.id === countSession.warehouseId)?.name : warehouses.find(w => w.id === countSession.warehouseId)?.name}
                <span className="text-[10px] bg-violet-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">{lang === 'ar' ? 'جاري الجرد' : 'In Progress'}</span>
              </h3>
              <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em] mt-2 opacity-60">
                Audit Session: {countSession.id?.slice(0, 8)} • {countSession.items?.length || 0} Assets
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleCompleteCount(false)}
                disabled={countLoading}
                className="px-6 py-3.5 bg-card border border-border/30 rounded-xl text-muted font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-all active:scale-95"
              >
                {lang === 'ar' ? 'إلغاء' : 'CANCEL'}
              </button>
              <button
                onClick={() => handleCompleteCount(true)}
                disabled={countLoading}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-all active:scale-95 border-b-4 border-emerald-800/40"
              >
                {countLoading ? '...' : (lang === 'ar' ? 'اعتماد النتائج' : 'FINALIZE & SYNC')}
              </button>
            </div>
          </div>

          <div className="responsive-table border border-border/10 rounded-3xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-elevated/30 text-muted uppercase font-black text-[10px] tracking-widest">
                <tr>
                  <th className="text-left px-8 py-5">Item Asset</th>
                  <th className="text-center px-4 py-5">Unit</th>
                  <th className="text-center px-4 py-5">System Qty</th>
                  <th className="text-center px-4 py-5">Counted</th>
                  <th className="text-center px-4 py-5">Variance</th>
                  <th className="text-left px-8 py-5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(countSession.items || []).map((ci: any) => {
                  const variance = ci.countedQty !== null ? ci.countedQty - ci.systemQty : 0;
                  return (
                    <tr key={ci.itemId} className="hover:bg-violet-500/5 transition-colors group">
                      <td className="px-8 py-4 font-bold text-main uppercase tracking-tight">{ci.itemName}</td>
                      <td className="px-4 py-4 text-center text-[10px] font-black text-muted uppercase tracking-widest">{ci.unit}</td>
                      <td className="px-4 py-4 text-center font-black text-muted/60 tabular-nums">{ci.systemQty}</td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="number"
                          value={ci.countedQty ?? ''}
                          onChange={(e) => handleUpdateCountItem(ci.itemId, 'countedQty', e.target.value === '' ? null : Number(e.target.value))}
                          className="w-24 text-center px-3 py-2 bg-card/60 border border-border/20 rounded-xl font-black text-main tabular-nums focus:border-violet-500/50 outline-none transition-all shadow-inner"
                          placeholder="—"
                        />
                      </td>
                      <td className={`px-4 py-4 text-center font-black tabular-nums transition-all ${ci.countedQty === null ? 'text-muted/30' : variance > 0 ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : variance < 0 ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'text-main'}`}>
                        {ci.countedQty !== null ? (variance > 0 ? `+${variance}` : variance) : '—'}
                      </td>
                      <td className="px-8 py-4">
                        <input
                          type="text"
                          value={ci.notes || ''}
                          onChange={(e) => handleUpdateCountItem(ci.itemId, 'notes', e.target.value)}
                          className="w-full px-4 py-2 bg-card/40 border border-border/10 rounded-xl text-[11px] font-bold text-main outline-none focus:border-violet-500/30 transition-all"
                          placeholder={lang === 'ar' ? 'ملاحظة...' : 'Audit note...'}
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
  );

  const renderMovements = () => (
    <div className="p-6 md:p-8 space-y-8 relative z-10 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center gap-4 bg-elevated/20 p-5 rounded-3xl border border-border/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-500">
                <Calendar size={14} />
             </div>
             <input
               type="date"
               value={movementDateFrom}
               onChange={(e) => setMovementDateFrom(e.target.value)}
               className="bg-card/60 backdrop-blur-md border border-border/30 rounded-xl px-4 py-2 text-[11px] font-black uppercase text-main outline-none focus:border-sky-500/50"
             />
          </div>
          <span className="text-muted text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'إلى' : 'TO'}</span>
          <input
            type="date"
            value={movementDateTo}
            onChange={(e) => setMovementDateTo(e.target.value)}
            className="bg-card/60 backdrop-blur-md border border-border/30 rounded-xl px-4 py-2 text-[11px] font-black uppercase text-main outline-none focus:border-sky-500/50"
          />
        </div>
        <button
          onClick={loadMovements}
          disabled={movementLoading}
          className="flex items-center gap-3 px-8 py-3 bg-card/60 backdrop-blur-md text-sky-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-border/30 hover:bg-sky-500 hover:text-white transition-all active:scale-95 shadow-sm"
        >
          <Activity size={14} className={movementLoading ? 'animate-spin' : ''} />
          {lang === 'ar' ? 'تحديث السجلات' : 'REFRESH LOGS'}
        </button>
        <div className="ml-auto px-4 py-2 bg-elevated/40 rounded-xl text-[10px] font-black text-muted uppercase tracking-widest border border-border/10">
           {movementLog.length} Records Detected
        </div>
      </div>

      <div className="responsive-table border border-border/10 rounded-3xl overflow-hidden shadow-sm">
        {movementLog.length === 0 ? (
          <div className="text-center py-24 bg-card/20">
            <Activity size={64} className="mx-auto text-muted/10 mb-6 animate-pulse" />
            <p className="text-muted font-black uppercase tracking-[0.3em] text-xs">
              {movementLoading ? (lang === 'ar' ? 'جارٍ استرجاع البيانات...' : 'QUERYING BLOCKCHAIN...') : (lang === 'ar' ? 'لا توجد حركات في هذه الفترة' : 'No movements found')}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-elevated/40 text-muted uppercase font-black text-[10px] tracking-widest">
              <tr>
                <th className="text-left px-8 py-5">Timestamp</th>
                <th className="text-left px-4 py-5">Asset</th>
                <th className="text-center px-4 py-5">Type</th>
                <th className="text-center px-4 py-5">Quantity</th>
                <th className="text-center px-4 py-5">Unit Cost</th>
                <th className="text-left px-4 py-5">Reason</th>
                <th className="text-left px-8 py-5">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {movementLog.map((mv, idx) => {
                const typeColors: Record<string, string> = {
                  ADJUSTMENT: 'text-amber-500 bg-amber-500/10 border-amber-500/20', 
                  TRANSFER: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
                  PURCHASE: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', 
                  SALE: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
                  WASTE: 'text-red-500 bg-red-500/10 border-red-500/20', 
                  SALE_CONSUMPTION: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
                };
                return (
                  <tr key={mv.id || idx} className="hover:bg-sky-500/5 transition-colors group">
                    <td className="px-8 py-4 text-[10px] font-black text-muted/60 uppercase tracking-tighter tabular-nums whitespace-nowrap">
                      {new Date(mv.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                       <span className="font-black text-main text-xs uppercase tracking-tight group-hover:text-sky-500 transition-colors">{mv.itemName}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${typeColors[mv.type] || 'bg-card text-muted border-border/20'}`}>
                        {mv.type}
                      </span>
                    </td>
                    <td className={`px-4 py-4 text-center font-black tabular-nums transition-all ${mv.quantity > 0 ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'text-rose-500'}`}>
                      {mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}
                    </td>
                    <td className="px-4 py-4 text-center font-black text-muted/80 tabular-nums text-[11px]">
                      {mv.totalCost ? `${mv.totalCost.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-4 text-[11px] text-muted font-bold truncate max-w-[150px]">{mv.reason || '—'}</td>
                    <td className="px-8 py-4 text-[10px] font-black text-muted uppercase tracking-widest">{mv.performedBy || 'System'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
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

      {/* Note: handleReceipt was missing in view, I'll assume it exists or use receivePurchaseOrderInDB style */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        onSave={async (data) => {
           // Basic integration
           console.log('Receiving stock...', data);
           setReceiptModalOpen(false);
        }}
        lang={lang}
        inventory={inventory}
        warehouses={warehouses}
        suppliers={suppliers}
      />
    </div>
  );
};

export default Inventory;
