import React, { useState } from 'react';
import { Users, Search, Plus, Star, Phone, MapPin } from 'lucide-react';
import { Customer } from '../types';

interface CRMProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
}

const CRM: React.FC<CRMProps> = ({ customers, onAddCustomer }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ name: '', phone: '', address: '' });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const handleSaveCustomer = () => {
    if (newCustomer.name && newCustomer.phone) {
      onAddCustomer({
        id: Date.now().toString(),
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
        loyaltyPoints: 0,
        totalSpent: 0,
        lastOrderDate: undefined
      });
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', address: '' });
    }
  };

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Customer Management</h2>
          <p className="text-slate-500 dark:text-slate-400">View customer history, loyalty points, and delivery addresses.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Loyalty Points</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{customer.name}</div>
                        <div className="text-xs text-slate-500">ID: {customer.id.slice(-4)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                     <div className="flex items-center gap-2">
                        <Phone size={14} className="opacity-70"/>
                        {customer.phone}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="opacity-70"/>
                        {customer.address || "N/A"}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-orange-500 font-bold">
                      <Star size={16} fill="currentColor" />
                      {customer.loyaltyPoints}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-800 dark:text-slate-200">
                    ${customer.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View History</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Add New Customer</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Name</label>
                <input 
                  className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Phone</label>
                <input 
                  className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Address</label>
                <textarea 
                  className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSaveCustomer} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;