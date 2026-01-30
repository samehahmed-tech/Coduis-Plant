
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { 
  DollarSign, TrendingUp, ShoppingBag, Calendar, Download, 
  ChevronDown, Filter, Target, Megaphone, Zap, Scale, Info
} from 'lucide-react';
import { MenuItem, InventoryItem } from '../types';

// Mock data expansion for the new financial reports
const salesData7D = [
  { name: 'Mon', revenue: 2400, cost: 800, profit: 1600 },
  { name: 'Tue', revenue: 1398, cost: 500, profit: 898 },
  { name: 'Wed', revenue: 4500, cost: 1600, profit: 2900 },
  { name: 'Thu', revenue: 3908, cost: 1400, profit: 2508 },
  { name: 'Fri', revenue: 4800, cost: 1700, profit: 3100 },
  { name: 'Sat', revenue: 8800, cost: 3100, profit: 5700 },
  { name: 'Sun', revenue: 7300, cost: 2600, profit: 4700 },
];

const Reports: React.FC<{ menuItems: MenuItem[], inventory: InventoryItem[] }> = ({ menuItems, inventory }) => {
  const [activeTab, setActiveTab] = useState<'SALES' | 'PROFIT' | 'FOOD_COST'>('SALES');

  const foodCostData = useMemo(() => {
    return menuItems.map(item => {
      let cost = 0;
      if (item.recipe) {
        item.recipe.forEach(ri => {
          const invItem = inventory.find(inv => inv.id === ri.inventoryItemId);
          if (invItem) cost += invItem.costPrice * ri.quantityNeeded;
        });
      }
      const margin = item.price - cost;
      const marginPercent = item.price > 0 ? (margin / item.price) * 100 : 0;
      return {
        name: item.name,
        price: item.price,
        cost: cost,
        margin: margin,
        marginPercent: marginPercent
      };
    }).sort((a, b) => b.marginPercent - a.marginPercent);
  }, [menuItems, inventory]);

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Business Intelligence</h2>
          <p className="text-slate-500 dark:text-slate-400">Financial insights and operational performance tracking.</p>
        </div>
        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
           {['SALES', 'PROFIT', 'FOOD_COST'].map(tab => (
             <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
             >
               {tab.replace('_', ' ')}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'FOOD_COST' ? (
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                 <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Avg. Food Cost %</p>
                 <h3 className="text-3xl font-black text-indigo-600">28.5%</h3>
                 <p className="text-[10px] text-green-500 font-bold mt-2">Within Industry Target</p>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Scale size={20} className="text-indigo-600" /> Item Profitability Matrix
                 </h3>
                 <button className="text-xs font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline">
                    <Download size={14}/> Export Analysis
                 </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest">
                          <th className="px-8 py-4">Menu Item</th>
                          <th className="px-6 py-4">Selling Price</th>
                          <th className="px-6 py-4">Recipe Cost</th>
                          <th className="px-6 py-4">Gross Margin ($)</th>
                          <th className="px-6 py-4">Margin (%)</th>
                          <th className="px-6 py-4">Health Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                       {foodCostData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                             <td className="px-8 py-4 font-bold text-slate-800 dark:text-white">{item.name}</td>
                             <td className="px-6 py-4 font-mono text-sm">${item.price.toFixed(2)}</td>
                             <td className="px-6 py-4 font-mono text-sm text-red-500">${item.cost.toFixed(2)}</td>
                             <td className="px-6 py-4 font-black text-sm text-green-600">${item.margin.toFixed(2)}</td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                   <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                      <div className={`h-full ${item.marginPercent > 70 ? 'bg-green-500' : item.marginPercent > 40 ? 'bg-indigo-500' : 'bg-red-500'}`} style={{ width: `${item.marginPercent}%` }} />
                                   </div>
                                   <span className="text-xs font-black">{item.marginPercent.toFixed(1)}%</span>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                {item.marginPercent > 60 ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase">Star Performer</span>
                                ) : item.cost > item.price ? (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase">Loss Maker</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase">Standard</span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      ) : activeTab === 'PROFIT' ? (
        <div className="space-y-8">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8">Revenue vs Cost vs Net Profit</h3>
              <div className="h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData7D}>
                       <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f033" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                       <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                       <Legend iconType="circle" />
                       <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" fill="url(#colorRev)" strokeWidth={3} />
                       <Area type="monotone" dataKey="cost" name="COGS" stroke="#f43f5e" fill="url(#colorCost)" strokeWidth={2} strokeDasharray="5 5" />
                       <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={4} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales data as before but with financial focus */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8">Weekly Sales Trajectory</h3>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={salesData7D}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f033" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
