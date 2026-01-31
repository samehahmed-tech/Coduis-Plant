
import React, { useState } from 'react';
import { Search, Plus, Star, Phone, MapPin, UserCheck, ShieldCheck } from 'lucide-react';
import { Customer } from '../types';
import { useCRMStore } from '../stores/useCRMStore';

const CRM: React.FC = () => {
  const { customers, addCustomer } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ name: '', phone: '', address: '' });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleSaveCustomer = () => {
    if (newCustomer.name && newCustomer.phone) {
      addCustomer({
        id: Date.now().toString(),
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
        loyaltyPoints: 0,
        totalSpent: 0,
        lastOrderDate: undefined,
        visits: 0
      });
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', address: '' });
    }
  };

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Customer Relationship</h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold">Intelligence-driven customer loyalty and behavioral tracking.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 font-black uppercase text-xs tracking-widest"
        >
          <Plus size={18} />
          Register Customer
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Filter by profile name or identity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold text-sm shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Database</p>
              <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{customers.length} Profiles</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest">
                <th className="px-8 py-5">Customer Profile</th>
                <th className="px-6 py-5">Security Contact</th>
                <th className="px-6 py-5">Logistics Hub</th>
                <th className="px-6 py-5">Loyalty Rank</th>
                <th className="px-6 py-5">Value (LTV)</th>
                <th className="px-8 py-5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-lg border border-indigo-200/50 dark:border-indigo-800/50 group-hover:scale-110 transition-transform">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-tight">{customer.name}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">UID-{customer.id.slice(-6).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-sm">
                      <Phone size={14} className="opacity-50 text-indigo-500" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 font-bold text-sm max-w-[200px] truncate">
                      <MapPin size={14} className="opacity-50 text-rose-500" />
                      {customer.address || "No Hub Registered"}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-amber-500 font-black">
                      <Star size={16} fill="currentColor" strokeWidth={0} />
                      <span className="text-sm">{customer.loyaltyPoints}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-mono font-black text-sm text-slate-800 dark:text-slate-200">{customer.totalSpent.toFixed(2)} ج.م</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                      Analyze Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
              <UserCheck size={28} className="text-indigo-600" /> Register Profile
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400">Full Legal Name</label>
                <input
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="e.g. Sameh Ahmed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400">Mobile Terminal</label>
                <input
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+20 1..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400">Dispatch Location</label>
                <textarea
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all resize-none"
                  rows={3}
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Street, Building, Flat..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomer}
                className="flex-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
              >
                Seal & Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;