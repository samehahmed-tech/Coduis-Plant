import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Plus, Search, X, Truck, FileText, Package,
  User, Phone, Mail, Tag, ExternalLink, Briefcase, CheckCircle, Clock,
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
    inventory, suppliers, purchaseOrders, warehouses,
    fetchInventory, fetchWarehouses,
    addInventoryItem, updateInventoryItem,
    addWarehouse, updateStock,
    addPurchaseOrder, receivePurchaseOrder, addSupplier
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

  useEffect(() => {
    fetchInventory();
    fetchWarehouses();
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
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-elevated dark:bg-elevated/30 text-muted text-[10px] uppercase tracking-wider font-semibold">
            <th className="px-6 py-4">{lang === 'ar' ? 'الصنف' : 'Item Name'}</th>
            <th className="px-6 py-4">{lang === 'ar' ? 'التوزيع' : 'Warehouses'}</th>
            <th className="px-6 py-4">{lang === 'ar' ? 'الكمية الإجمالية' : 'Total Qty'}</th>
            <th className="px-6 py-4">{lang === 'ar' ? 'سعر الشراء' : 'Purchase Price'}</th>
            <th className="px-6 py-4">{lang === 'ar' ? 'التكلفة' : 'Cost'}</th>
            <th className="px-6 py-4">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody className="divide-y border-border/50">
          {inventory.filter(i => (i.name + (i.nameAr || '')).toLowerCase().includes(searchQuery.toLowerCase())).map((item) => {
            const totalQty = item.warehouseQuantities.reduce((acc, curr) => acc + curr.quantity, 0);
            const isLow = totalQty <= item.threshold;
            return (
              <tr key={item.id} className="hover:bg-elevated transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${item.isComposite ? 'text-violet-500' : 'text-slate-400'}`}>
                      {item.isComposite ? <Layers size={18} /> : <Package size={18} />}
                    </div>
                    <div>
                      <div className="font-bold text-main">{lang === 'ar' ? item.nameAr || item.name : item.name}</div>
                      <div className="text-[10px] flex items-center gap-2">
                        <span className="uppercase font-black text-slate-400">{item.category}</span>
                        {item.sku && <span className="font-mono text-indigo-500">[{item.sku}]</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {item.warehouseQuantities.map(wq => {
                      const wh = warehouses.find(w => w.id === wq.warehouseId);
                      return (
                        <span key={wq.warehouseId} className="px-2 py-0.5 bg-elevated border border-border/50 rounded-md text-[9px] font-black">
                          {wh?.name}: {wq.quantity}
                        </span>
                      );
                    })}
                    {item.warehouseQuantities.length === 0 && <span className="text-[10px] italic text-slate-400">Empty Stock</span>}
                  </div>
                </td>
                <td className="px-6 py-4 font-black">
                  <span className={isLow ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}>
                    {totalQty} {item.unit}
                  </span>
                  {isLow && <div className="text-[8px] uppercase font-black text-rose-500 tracking-tighter">Low Stock</div>}
                </td>
                <td className="px-6 py-4 font-mono text-sm">${(item.purchasePrice || 0).toFixed(2)}</td>
                <td className="px-6 py-4 font-mono text-sm text-slate-500">${item.costPrice.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingItem(item); setItemModalOpen(true); }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-500"
                    >
                      <Tag size={16} />
                    </button>
                    <button
                      onClick={() => { setEditingItem(item); setAdjustmentModalOpen(true); }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500"
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
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <button
        onClick={() => setWarehouseModalOpen(true)}
        className="bg-card flex flex-col items-center justify-center border-2 border-dashed border-border/50 hover:border-primary group transition-all min-h-[160px]"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mb-3 transition-all group-hover:bg-primary-hover">
          <Plus size={24} />
        </div>
        <span className="text-sm font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest">{lang === 'ar' ? 'إضافة مخزن' : 'Add Warehouse'}</span>
      </button>

      {warehouses.map(wh => {
        const branch = branches.find(b => b.id === wh.branchId);
        const parent = warehouses.find(w => w.id === wh.parentId);
        return (
          <div key={wh.id} className="card-primary !p-6 flex flex-col justify-between group cursor-pointer hover:border-emerald-500/30" onClick={() => setSelectedWarehouse(wh)}>
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                <Home size={28} />
              </div>
              <div className="text-right">
                <div className={`w-3 h-3 rounded-full ml-auto mb-1 ${wh.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                <span className="text-[10px] font-black uppercase text-slate-400">{wh.isActive ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-tight">{wh.name}</h4>
                {wh.parentId && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-black text-slate-500 uppercase rounded-md border border-slate-200 dark:border-slate-700">Sub</span>}
              </div>
              <p className="text-sm text-slate-500 font-bold mb-4">{branch?.name || 'Central'} • {wh.type}</p>

              <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-1.5">
                  <Package size={14} className="text-emerald-500" />
                  {inventory.filter(i => i.warehouseQuantities.some(wq => wq.warehouseId === wh.id)).length} SKUs
                </div>
                {parent && (
                  <div className="flex items-center gap-1.5">
                    <ArrowRightLeft size={14} className="text-indigo-500" />
                    {parent.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-10 bg-app min-h-screen transition-colors">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20">
              <Package size={24} />
            </div>
            <h2 className="text-3xl xl:text-4xl font-black text-main uppercase tracking-tighter">
              {lang === 'ar' ? 'المخزن والتوريد' : 'Smart Inventory'}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold max-w-xl">
            {lang === 'ar'
              ? 'إدارة مخزون المركز والفروع، التحكم في التوريد، تحويلات بين المخازن، والجرد الدوري بنظام تتبع متكامل.'
              : 'Enterprise-grade supply chain management. Control stock across multiple branches, manage transfers, and track audit history.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button
            onClick={() => setReceiptModalOpen(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/10 font-black text-xs uppercase tracking-widest"
          >
            <Download size={18} /> {lang === 'ar' ? 'إذن استلام' : 'Receive'}
          </button>
          <button
            onClick={() => setTransferModalOpen(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-3.5 rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/10 font-black text-xs uppercase tracking-widest"
          >
            <ArrowRightLeft size={18} /> {lang === 'ar' ? 'تحويل' : 'Transfer'}
          </button>
          <button
            onClick={() => setItemModalOpen(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3.5 rounded-2xl hover:scale-105 transition-all shadow-xl shadow-black/10 font-black text-xs uppercase tracking-widest"
          >
            <Plus size={18} /> {lang === 'ar' ? 'إضافة صنف' : 'Add Item'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
        <div className="flex gap-2 md:gap-4 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'STOCK', label: lang === 'ar' ? 'الأصناف' : 'Stock Items', icon: Package, color: 'text-indigo-600' },
            { id: 'SUPPLIERS', label: lang === 'ar' ? 'الموردين' : 'Suppliers', icon: Truck, color: 'text-emerald-600' },
            { id: 'PO', label: lang === 'ar' ? 'طلبات الشراء' : 'Purchase Orders', icon: FileText, color: 'text-amber-600' },
            { id: 'WAREHOUSES', label: lang === 'ar' ? 'المخازن' : 'Warehouses', icon: Home, color: 'text-rose-600' },
            { id: 'BRANCHES', label: lang === 'ar' ? 'الفروع' : 'Branches', icon: Briefcase, color: 'text-slate-600' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 text-xs md:text-sm font-black flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? `border-indigo-600 ${tab.color}` : 'border-transparent text-slate-400 hover:text-slate-700'}`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={lang === 'ar' ? 'بحث عن صنف، رقم كود، مورد...' : "Search inventory..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm font-bold text-sm"
          />
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-border/50 overflow-hidden min-h-[420px] md:min-h-[520px] lg:min-h-[600px]">
        {activeTab === 'STOCK' && renderStock()}
        {activeTab === 'WAREHOUSES' && renderWarehouses()}
        {activeTab === 'SUPPLIERS' && <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Supplier Module Integration In Progress</div>}
        {activeTab === 'PO' && <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Purchase Order Module Integration In Progress</div>}
        {activeTab === 'BRANCHES' && <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Branch Logistics Support Coming Soon</div>}
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
