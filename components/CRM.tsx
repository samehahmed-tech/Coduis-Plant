
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
    <div className="p-8 bg-app min-h-screen transition-colors pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 uppercase tracking-tighter flex items-center gap-4">
            Customer Relationship
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </div>
          </h2>
          <p className="text-sm md:text-base text-muted font-bold tracking-wide mt-1">Customer management and loyalty tracking.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-4 rounded-[1.5rem] hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/25 font-black uppercase text-xs tracking-[0.2em]"
        >
          <Plus size={18} className="animate-pulse" />
          Register Customer
        </button>
      </div>

      <div className="bg-card/60 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/5 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-emerald-500 opacity-70" />
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between bg-elevated/20 relative z-10">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-md opacity-20 focus-within:opacity-40 transition-opacity duration-500" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5 focus-within:text-primary transition-colors z-10" />
              <input
                type="text"
                placeholder="Filter by profile name or identity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-card/80 backdrop-blur-md text-main border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-sm shadow-inner"
              />
            </div>
          </div>
          <div className="flex items-center gap-5 bg-card/50 p-3 pr-6 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ShieldCheck size={24} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-0.5">Active Database</p>
              <p className="text-lg font-black text-main uppercase tracking-tight drop-shadow-sm">{customers.length} Profiles</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-elevated/30 text-muted text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                <th className="px-8 py-5">Customer Profile</th>
                <th className="px-6 py-5">Security Contact</th>
                <th className="px-6 py-5">Logistics Hub</th>
                <th className="px-6 py-5">Loyalty Rank</th>
                <th className="px-6 py-5">Value (LTV)</th>
                <th className="px-8 py-5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-elevated/40 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-out shadow-inner">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-main uppercase text-[13px] tracking-tight mb-0.5 group-hover:text-primary transition-colors">{customer.name}</div>
                        <div className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">UID-{customer.id.slice(-6).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2.5 text-main font-bold text-[12px] bg-elevated/40 w-fit px-3 py-1.5 rounded-lg border border-white/5 shadow-sm">
                      <Phone size={14} className="text-primary" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2.5 text-muted font-bold text-[12px] max-w-[200px] truncate bg-elevated/40 w-fit px-3 py-1.5 rounded-lg border border-white/5 shadow-sm hover:text-main transition-colors">
                      <MapPin size={14} className="text-rose-400" />
                      {customer.address || "No Hub Registered"}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-amber-500 font-black bg-amber-500/10 w-fit px-3 py-1.5 rounded-lg border border-amber-500/20 shadow-sm">
                      <Star size={14} fill="currentColor" />
                      <span className="text-[12px]">{customer.loyaltyPoints}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-black tracking-tight text-[13px] text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-sm">{customer.totalSpent.toLocaleString()} {settings?.currencySymbol || 'EGP'}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="bg-card/50 backdrop-blur-md border border-white/10 text-muted hover:bg-primary hover:text-white hover:border-primary/50 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/25 active:scale-95">
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-muted font-black uppercase tracking-[0.2em] text-[11px]">
                    No customers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-card/80 backdrop-blur-3xl p-8 rounded-[2.5rem] w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/10 animate-in zoom-in-95 duration-500 ease-out relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
            <h3 className="text-2xl font-black text-main uppercase tracking-tight mb-8 flex items-center gap-3 border-b border-white/10 pb-6 relative z-10">
              <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                <UserCheck size={24} />
              </div>
              Register Profile
            </h3>
            <div className="space-y-6 relative z-10">
              <div className="group/input">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-muted group-focus-within/input:text-primary transition-colors">Full Legal Name</label>
                <input
                  className="w-full p-4 bg-elevated/40 backdrop-blur-md border border-white/5 rounded-2xl text-main font-bold outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted/40 shadow-inner"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="e.g. Sameh Ahmed"
                />
              </div>
              <div className="group/input">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-muted group-focus-within/input:text-primary transition-colors">Mobile Terminal</label>
                <input
                  className="w-full p-4 bg-elevated/40 backdrop-blur-md border border-white/5 rounded-2xl text-main font-bold outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted/40 shadow-inner"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+20 1..."
                />
              </div>
              <div className="group/input">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-muted group-focus-within/input:text-primary transition-colors">Dispatch Location</label>
                <textarea
                  className="w-full p-4 bg-elevated/40 backdrop-blur-md border border-white/5 rounded-2xl text-main font-bold outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none placeholder:text-muted/40 shadow-inner"
                  rows={3}
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Street, Building, Flat..."
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-main bg-elevated/30 hover:bg-elevated/60 border border-white/5 hover:border-white/20 rounded-2xl transition-all backdrop-blur-sm active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomer}
                className="flex-[2] px-8 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:opacity-90 shadow-[0_10px_20px_rgba(var(--primary-rgb),0.3)] transition-all active:scale-95 border border-primary/20"
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