import React, { useState } from 'react';
import {
  AlertTriangle, Plus, Search, Bell, X, Truck, FileText, Package,
  User, Phone, Mail, Tag, ExternalLink, Briefcase
} from 'lucide-react';
import { InventoryItem, Supplier, PurchaseOrder } from '../types';

interface InventoryProps {
  inventory: InventoryItem[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onAddPO: (po: PurchaseOrder) => void;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, suppliers, purchaseOrders, onAddPO }) => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'SUPPLIERS' | 'PO'>('STOCK');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // --- TAB CONTENT RENDERERS ---

  const renderStock = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <th className="px-6 py-4">Item Name</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Quantity</th>
            <th className="px-6 py-4">Cost Price</th>
            <th className="px-6 py-4">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {inventory.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => {
            const isLow = item.quantity <= item.threshold;
            return (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                <td className="px-6 py-4">
                  {isLow ? <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-bold">Low Stock</span> : <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-bold">In Stock</span>}
                </td>
                <td className="px-6 py-4">{item.quantity} {item.unit}</td>
                <td className="px-6 py-4">${item.costPrice.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{item.lastUpdated.toLocaleDateString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderSuppliers = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <th className="px-6 py-4">Company</th>
            <th className="px-6 py-4">Contact</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
            <tr
              key={s.id}
              onClick={() => setSelectedSupplier(s)}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Briefcase size={16} />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="font-medium text-slate-700 dark:text-slate-300">{s.contactPerson}</div>
                <div className="text-slate-500 text-xs">{s.phone}</div>
              </td>
              <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs border border-slate-200 dark:border-slate-700">{s.category}</span></td>
              <td className="px-6 py-4">
                <button
                  onClick={(e) => { e.stopPropagation(); /* Logic for PO */ }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
                >
                  Create PO <ExternalLink size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPOs = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <th className="px-6 py-4">PO ID</th>
            <th className="px-6 py-4">Supplier</th>
            <th className="px-6 py-4">Total Cost</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {purchaseOrders.map(po => {
            const supplier = suppliers.find(s => s.id === po.supplierId);
            return (
              <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 font-mono text-slate-600">#{po.id}</td>
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{supplier?.name || 'Unknown'}</td>
                <td className="px-6 py-4">${po.totalCost.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${po.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{po.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{po.date.toLocaleDateString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            {lang === 'ar' ? 'المخزن والتوريد' : 'Inventory'}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold">{lang === 'ar' ? 'إدارة المخزون، الموردين، وطلبات الشراء.' : 'Manage stocks, suppliers, and purchase orders.'}</p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none font-black text-xs md:text-sm uppercase tracking-wider">
          <Plus size={18} />
          {activeTab === 'STOCK' ? (lang === 'ar' ? 'إضافة صنف' : 'Add Item') : activeTab === 'SUPPLIERS' ? (lang === 'ar' ? 'إضافة مورد' : 'Add Supplier') : (lang === 'ar' ? 'طلب جديد' : 'Create PO')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
        <div className="flex gap-2 md:gap-4 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`pb-3 px-1 md:px-2 text-xs md:text-sm font-bold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'STOCK' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Package size={16} /> {lang === 'ar' ? 'الأصناف' : 'Stock Items'}
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`pb-3 px-1 md:px-2 text-xs md:text-sm font-bold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'SUPPLIERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Truck size={16} /> {lang === 'ar' ? 'الموردين' : 'Suppliers'}
          </button>
          <button
            onClick={() => setActiveTab('PO')}
            className={`pb-3 px-1 md:px-2 text-xs md:text-sm font-bold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'PO' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={16} /> {lang === 'ar' ? 'طلبات الشراء' : 'Purchase Orders'}
          </button>
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder={lang === 'ar' ? 'بحث...' : "Search..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[400px]">
        {activeTab === 'STOCK' && renderStock()}
        {activeTab === 'SUPPLIERS' && renderSuppliers()}
        {activeTab === 'PO' && renderPOs()}
      </div>

      {/* Supplier Details Modal - Fully Responsive */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Briefcase size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="truncate">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white truncate">{selectedSupplier.name}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedSupplier.category} Supplier</p>
                </div>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0">
                <X size={24} />
              </button>
            </div>

            <div className="p-5 md:p-8 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Contact Information</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <User size={18} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Contact Person</p>
                        <p className="font-bold">{selectedSupplier.contactPerson}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Phone size={18} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Phone Number</p>
                        <p className="font-bold">{selectedSupplier.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Mail size={18} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Email Address</p>
                        <p className="font-bold">{selectedSupplier.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Supplied Goods</h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap gap-2">
                      {inventory.filter(item => item.supplierId === selectedSupplier.id).length > 0 ? (
                        inventory.filter(item => item.supplierId === selectedSupplier.id).map(item => (
                          <span key={item.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Package size={14} className="text-indigo-500" />
                            {item.name}
                          </span>
                        ))
                      ) : (
                        <div className="text-center py-4 w-full">
                          <Tag size={24} className="mx-auto text-slate-300 mb-2 opacity-50" />
                          <p className="text-xs text-slate-400 italic">No inventory items linked to this supplier</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 font-bold mb-1">Last Purchase</p>
                    <p className="text-sm text-indigo-900 dark:text-indigo-200 font-medium">No recent orders found</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 shrink-0 mt-4">
                <button className="flex-1 py-3 md:py-4 bg-indigo-600 text-white rounded-xl font-black text-xs md:text-sm uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                  <FileText size={18} /> Create PO
                </button>
                <button onClick={() => setSelectedSupplier(null)} className="flex-1 py-3 md:py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;