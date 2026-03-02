import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Plus, Search, X, Truck, FileText, Package,
  Tag, Briefcase,
  ArrowRightLeft, ListChecks, Download, Calculator, Home, Layers
} from 'lucide-react';
import { Supplier, PurchaseOrder, Warehouse, Branch, WarehouseType, InventoryItem } from '../types';

// Stores
import { useInventoryStore } from '../stores/useInventoryStore';
import { useAuthStore } from '../stores/useAuthStore';

// Services
import { translations } from '../services/translations';

// Modals
import ItemModal from './inventory/ItemModal';
import WarehouseModal from './inventory/WarehouseModal';
import StockAdjustmentModal from './inventory/StockAdjustmentModal';
import StockTransferModal from './inventory/StockTransferModal';
import ReceiptModal from './inventory/ReceiptModal';

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
  const [activeTab, setActiveTab] = useState<'STOCK' | 'SUPPLIERS' | 'PO' | 'WAREHOUSES' | 'BRANCHES'>('STOCK');
  const [searchQuery, setSearchQuery] = useState('');
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

  // --- TAB CONTENT RENDERERS ---

  const renderStock = () => (
    <div className="overflow-x-auto relative z-10 w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-elevated/30 border-b border-white/5 text-muted text-[10px] uppercase font-black tracking-widest">
            <th className="px-8 py-5 whitespace-nowrap">{lang === 'ar' ? 'الصنف' : 'Item Name'}</th>
            <th className="px-6 py-5 whitespace-nowrap">{lang === 'ar' ? 'التوزيع' : 'Warehouses'}</th>
            <th className="px-6 py-5 whitespace-nowrap">{lang === 'ar' ? 'الكمية الإجمالية' : 'Total Qty'}</th>
            <th className="px-6 py-5 whitespace-nowrap">{lang === 'ar' ? 'سعر الشراء' : 'Purchase Price'}</th>
            <th className="px-6 py-5 whitespace-nowrap">{lang === 'ar' ? 'التكلفة' : 'Cost'}</th>
            <th className="px-8 py-5 whitespace-nowrap text-right">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {inventory.filter(i => (i.name + (i.nameAr || '')).toLowerCase().includes(searchQuery.toLowerCase())).map((item) => {
            const totalQty = item.warehouseQuantities.reduce((acc, curr) => acc + curr.quantity, 0);
            const isLow = totalQty <= item.threshold;
            return (
              <tr key={item.id} className="hover:bg-emerald-500/5 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className={`p-3.5 rounded-[1.2rem] border ${item.isComposite ? 'bg-violet-500/10 text-violet-500 border-violet-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'} shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-out`}>
                      {item.isComposite ? <Layers size={20} /> : <Package size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-main text-[13px] group-hover:text-emerald-500 transition-colors">{lang === 'ar' ? item.nameAr || item.name : item.name}</div>
                      <div className="text-[10px] flex items-center gap-2 mt-1">
                        <span className="uppercase font-black tracking-widest text-muted">{item.category}</span>
                        {item.sku && <span className="font-mono font-bold tracking-widest text-teal-500 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">[{item.sku}]</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                    {item.warehouseQuantities.map(wq => {
                      const wh = warehouses.find(w => w.id === wq.warehouseId);
                      return (
                        <span key={wq.warehouseId} className="px-2 py-1 bg-elevated/40 border border-white/5 shadow-sm rounded-lg text-[10px] font-bold text-main hover:border-emerald-500/30 transition-colors">
                          <span className="text-muted">{wh?.name}:</span> {wq.quantity}
                        </span>
                      );
                    })}
                    {item.warehouseQuantities.length === 0 && <span className="text-[10px] italic text-muted opacity-60">Empty Stock</span>}
                  </div>
                </td>
                <td className="px-6 py-5 font-black">
                  <span className={`text-[13px] ${isLow ? 'text-rose-500' : 'text-main'}`}>
                    {totalQty} <span className="text-[10px] text-muted ml-0.5">{item.unit}</span>
                  </span>
                  {isLow && <div className="text-[9px] uppercase font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 w-fit px-2 py-0.5 rounded mt-1.5 tracking-[0.2em]">Low Stock</div>}
                </td>
                <td className="px-6 py-5 font-black text-[13px] text-emerald-500 drop-shadow-sm">{settings.currencySymbol || 'ج.م'} {(item.purchasePrice || 0).toLocaleString()}</td>
                <td className="px-6 py-5 font-black text-[13px] text-muted">{settings.currencySymbol || 'ج.م'} {item.costPrice.toLocaleString()}</td>
                <td className="px-8 py-5">
                  <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingItem(item); setItemModalOpen(true); }}
                      className="p-2.5 bg-card/50 backdrop-blur-md hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-xl text-muted hover:text-emerald-500 transition-all shadow-sm active:scale-95"
                    >
                      <Tag size={16} />
                    </button>
                    <button
                      onClick={() => { setEditingItem(item); setAdjustmentModalOpen(true); }}
                      className="p-2.5 bg-card/50 backdrop-blur-md hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 rounded-xl text-muted hover:text-amber-500 transition-all shadow-sm active:scale-95"
                    >
                      <Calculator size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderWarehouses = () => (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10 w-full">
      <button
        onClick={() => setWarehouseModalOpen(true)}
        className="bg-card/40 backdrop-blur-md border-2 border-dashed border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300 group min-h-[200px]"
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
          <div key={wh.id} className="bg-card/60 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between group cursor-pointer hover:border-emerald-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] transition-all duration-500 ease-out hover:-translate-y-2 relative overflow-hidden" onClick={() => setSelectedWarehouse(wh)}>
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

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted border-t border-white/10 pt-5">
                <div className="flex items-center gap-2 bg-elevated/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-sm">
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
      <div className="xl:col-span-1 bg-card/40 backdrop-blur-md rounded-[2rem] border border-white/5 p-6 space-y-4 shadow-lg group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 flex items-center gap-2 relative z-10">
          <Truck size={16} /> {supplierForm.id ? 'Edit Supplier' : 'Add Supplier'}
        </h4>
        <div className="space-y-3 relative z-10">
          <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Supplier Name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
          <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Contact Person" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} />
          <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
          <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
          <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Category" value={supplierForm.category} onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-4 border-t border-white/5 relative z-10">
          <button onClick={() => { setSupplierForm({ id: '', name: '', contactPerson: '', phone: '', email: '', category: '' }); setSelectedSupplier(null); }} className="flex-1 px-4 py-3.5 rounded-2xl bg-elevated/30 hover:bg-elevated/60 text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 active:scale-95 text-muted hover:text-main">Clear</button>
          <button onClick={handleUpsertSupplier} className="flex-[2] px-4 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 border border-indigo-400/30">{supplierForm.id ? 'Update' : 'Register'}</button>
        </div>
      </div>
      <div className="xl:col-span-2 bg-card/40 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden shadow-lg flex flex-col relative z-10">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-elevated/30 text-[10px] uppercase font-black tracking-widest text-muted border-b border-white/5">
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
                        <span className="px-2.5 py-1 bg-elevated/50 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-muted">{s.category}</span>
                      ) : (
                        <span className="text-muted/50 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelectedSupplier(s); setSupplierForm(s); }} className="px-3 py-1.5 rounded-lg bg-card/50 border border-white/10 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30 text-[10px] font-black uppercase tracking-widest text-muted transition-all active:scale-95">Edit</button>
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
        <div className="xl:col-span-1 bg-card/40 backdrop-blur-md rounded-[2rem] border border-white/5 p-6 space-y-4 shadow-lg group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-6 flex items-center gap-2 relative z-10">
            <ArrowRightLeft size={16} /> Inter-Branch Transfer
          </h4>
          <div className="space-y-3 relative z-10">
            <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={branchTransferItemId} onChange={(e) => setBranchTransferItemId(e.target.value)}>
              <option value="" className="bg-card">Select Item</option>
              {inventory.map(i => <option key={i.id} value={i.id} className="bg-card">{i.name}</option>)}
            </select>
            <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={branchTransferFromWh} onChange={(e) => setBranchTransferFromWh(e.target.value)}>
              <option value="" className="bg-card">From Warehouse</option>
              {warehouses.map(w => <option key={w.id} value={w.id} className="bg-card">{w.name}</option>)}
            </select>
            <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={branchTransferToWh} onChange={(e) => setBranchTransferToWh(e.target.value)}>
              <option value="" className="bg-card">To Warehouse (different branch)</option>
              {destinationWarehouses.map(w => <option key={w.id} value={w.id} className="bg-card">{w.name}</option>)}
            </select>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[10px] font-black uppercase">Qty</span>
              <input type="number" className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all text-main font-bold text-sm shadow-inner" value={branchTransferQty} onChange={(e) => setBranchTransferQty(Number(e.target.value || 0))} />
            </div>
            <input className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all text-main font-bold text-sm placeholder:text-muted/50 shadow-inner" placeholder="Reason for Transfer..." value={branchTransferReason} onChange={(e) => setBranchTransferReason(e.target.value)} />
          </div>
          <div className="pt-4 border-t border-white/5 relative z-10">
            <button onClick={handleCreateBranchTransfer} className="w-full px-4 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(6,182,212,0.2)] hover:shadow-[0_15px_30px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 border border-cyan-400/30">Execute Transfer</button>
          </div>
        </div>
        <div className="xl:col-span-2 bg-card/40 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden shadow-lg flex flex-col relative z-10">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-elevated/30 text-[10px] uppercase font-black tracking-widest text-muted border-b border-white/5">
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
      <div className="xl:col-span-1 bg-card/40 backdrop-blur-md rounded-[2rem] border border-white/5 p-6 space-y-4 shadow-lg group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500 mb-6 flex items-center gap-2 relative z-10">
          <FileText size={16} /> Create Purchase Order
        </h4>
        <div className="space-y-3 relative z-10">
          <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={poSupplierId} onChange={(e) => setPoSupplierId(e.target.value)}>
            <option value="" className="bg-card">Select Supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id} className="bg-card">{s.name}</option>)}
          </select>
          <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={poItemId} onChange={(e) => setPoItemId(e.target.value)}>
            <option value="" className="bg-card">Select Item</option>
            {inventory.map(i => <option key={i.id} value={i.id} className="bg-card">{i.name}</option>)}
          </select>
          <select className="w-full px-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all text-main font-bold text-sm shadow-inner appearance-none cursor-pointer" value={poWarehouseId} onChange={(e) => setPoWarehouseId(e.target.value)}>
            <option value="" className="bg-card">Target Warehouse (optional)</option>
            {warehouses.map(w => <option key={w.id} value={w.id} className="bg-card">{w.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[10px] font-black uppercase">Qty</span>
              <input type="number" className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all text-main font-bold text-sm shadow-inner" value={poQty} onChange={(e) => setPoQty(Number(e.target.value || 0))} />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[10px] font-black uppercase">Price</span>
              <input type="number" className="w-full pl-14 pr-4 py-3.5 rounded-2xl bg-elevated/40 backdrop-blur-sm border border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all text-main font-bold text-sm shadow-inner" value={poPrice} onChange={(e) => setPoPrice(Number(e.target.value || 0))} />
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-white/5 relative z-10">
          <button onClick={handleCreatePO} className="w-full px-4 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_30px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 border border-amber-400/30">Create PO</button>
        </div>
      </div>
      <div className="xl:col-span-2 bg-card/40 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden shadow-lg flex flex-col relative z-10">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-elevated/30 text-[10px] uppercase font-black tracking-widest text-muted border-b border-white/5">
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
    <div className="p-4 md:p-6 lg:p-10 bg-app min-h-screen transition-colors animate-fade-in relative z-10 pb-24">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10 relative z-20">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 uppercase tracking-tighter flex items-center gap-4 drop-shadow-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 text-emerald-500 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Package size={24} />
              </div>
              {lang === 'ar' ? 'المخزن والتوريد' : 'Smart Inventory'}
            </h2>
          </div>
          <p className="text-sm md:text-base text-muted font-bold tracking-wide mt-2 max-w-2xl">
            {lang === 'ar'
              ? 'إدارة مخزون المركز والفروع، التحكم في التوريد، تحويلات بين المخازن، والجرد الدوري بنظام تتبع متكامل.'
              : 'Enterprise-grade supply chain management. Control stock across multiple branches, manage transfers, and track audit history.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          <button
            onClick={() => setReceiptModalOpen(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-card/50 backdrop-blur-md text-emerald-500 px-6 py-4 rounded-[1.5rem] hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:shadow-emerald-500/20 active:scale-95"
          >
            <Download size={18} /> {lang === 'ar' ? 'إذن استلام' : 'Receive'}
          </button>
          <button
            onClick={() => setTransferModalOpen(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-card/50 backdrop-blur-md text-indigo-500 px-6 py-4 rounded-[1.5rem] hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20 font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:shadow-indigo-500/20 active:scale-95"
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
        <div className="flex gap-2 md:gap-4 border-b border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'STOCK', label: lang === 'ar' ? 'الأصناف' : 'Stock Items', icon: Package, color: 'text-emerald-500', activeBg: 'bg-emerald-500/10' },
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
              className="w-full pl-14 pr-6 py-4 bg-card/60 backdrop-blur-md border border-white/10 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner font-bold text-sm text-main placeholder:text-muted/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-card/60 backdrop-blur-3xl rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/5 overflow-hidden min-h-[420px] md:min-h-[520px] lg:min-h-[600px] relative z-20 group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-50 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 opacity-50" />
        {activeTab === 'STOCK' && renderStock()}
        {activeTab === 'WAREHOUSES' && renderWarehouses()}
        {activeTab === 'SUPPLIERS' && renderSuppliers()}
        {activeTab === 'PO' && renderPurchaseOrders()}
        {activeTab === 'BRANCHES' && renderBranchLogistics()}
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
