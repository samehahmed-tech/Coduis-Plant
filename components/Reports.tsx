
import React, { useState, useMemo } from 'react';
import {
   BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import {
   DollarSign, TrendingUp, ShoppingBag, Calendar, Download,
   ChevronDown, Filter, Target, Megaphone, Zap, Scale, Info
} from 'lucide-react';

// Stores
import { useMenuStore } from '../stores/useMenuStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useAuthStore } from '../stores/useAuthStore';

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

const Reports: React.FC = () => {
   const { categories } = useMenuStore();
   const { inventory } = useInventoryStore();
   const { settings } = useAuthStore();

   const menuItems = useMemo(() => categories.flatMap(cat => cat.items), [categories]);
   const [activeTab, setActiveTab] = useState<'SALES' | 'PROFIT' | 'FOOD_COST'>('SALES');

   const foodCostData = useMemo(() => {
      return menuItems.map(item => {
         let cost = 0;
         if (item.recipe) {
            item.recipe.forEach(ri => {
               const invItem = inventory.find(inv => inv.id === ri.itemId || inv.id === (ri as any).inventoryItemId);
               if (invItem) cost += invItem.costPrice * ri.quantity;
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
      <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors animate-fade-in pb-24">
         <div className="flex justify-between items-center mb-10">
            <div>
               <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Business Intelligence</h2>
               <p className="text-slate-500 dark:text-slate-400 font-semibold">Financial insights and operational performance tracking.</p>
            </div>
            <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm">
               {['SALES', 'PROFIT', 'FOOD_COST'].map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                     {tab.replace('_', ' ')}
                  </button>
               ))}
            </div>
         </div>

         {activeTab === 'FOOD_COST' ? (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Avg. Food Cost %</p>
                     <h3 className="text-4xl font-black text-indigo-600">28.5%</h3>
                     <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase">STABLE PERFORMANCE</p>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                     <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <Scale size={24} className="text-indigo-600" /> Item Profitability Matrix
                     </h3>
                     <button className="text-xs font-black text-indigo-600 uppercase flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 px-4 py-2 rounded-xl transition-all">
                        <Download size={16} /> Export Analysis
                     </button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest">
                              <th className="px-8 py-5">Menu Item</th>
                              <th className="px-6 py-5">Selling Price</th>
                              <th className="px-6 py-5">Recipe Cost</th>
                              <th className="px-6 py-5">Gross Margin</th>
                              <th className="px-6 py-5">Margin (%)</th>
                              <th className="px-6 py-5">Health Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {foodCostData.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                 <td className="px-8 py-5 font-black text-slate-800 dark:text-white uppercase text-xs">{item.name}</td>
                                 <td className="px-6 py-5 font-mono text-sm font-bold text-slate-600 dark:text-slate-400">{item.price.toFixed(2)} ج.م</td>
                                 <td className="px-6 py-5 font-mono text-sm font-bold text-rose-500">{item.cost.toFixed(2)} ج.م</td>
                                 <td className="px-6 py-5 font-black text-sm text-emerald-600">{item.margin.toFixed(2)} ج.م</td>
                                 <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                       <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                          <div className={`h-full transition-all duration-1000 ${item.marginPercent > 70 ? 'bg-emerald-500' : item.marginPercent > 40 ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${item.marginPercent}%` }} />
                                       </div>
                                       <span className="text-xs font-black text-slate-700 dark:text-slate-300">{item.marginPercent.toFixed(1)}%</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5">
                                    {item.marginPercent > 60 ? (
                                       <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Star Performer</span>
                                    ) : item.cost > item.price ? (
                                       <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Loss Maker</span>
                                    ) : (
                                       <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Standard</span>
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
               <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-10 tracking-tight">Revenue vs Cost Analysis</h3>
                  <div className="h-[500px] w-full min-h-[500px] relative overflow-hidden">
                     <ResponsiveContainer width="100%" height="100%" minHeight={500}>
                        <AreaChart data={salesData7D} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f011" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 900 }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }} dx={-10} />
                           <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '20px' }} />
                           <Legend iconType="circle" wrapperStyle={{ paddingTop: '40px' }} />
                           <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#6366f1" fill="url(#colorRev)" strokeWidth={4} />
                           <Area type="monotone" dataKey="cost" name="Operation Cost" stroke="#f43f5e" fill="url(#colorCost)" strokeWidth={2} strokeDasharray="5 5" />
                           <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={5} dot={{ r: 6, fill: '#10b981', strokeWidth: 4, stroke: '#fff' }} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-10 tracking-tight">Sales Distribution</h3>
                  <div className="h-[400px] w-full min-h-[400px] relative overflow-hidden">
                     <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                        <BarChart data={salesData7D}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f011" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900 }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }} dx={-10} />
                           <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '20px' }} />
                           <Bar dataKey="revenue" fill="#6366f1" radius={[12, 12, 0, 0]} barSize={40} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
                  <Target size={48} className="text-indigo-600 mb-6" />
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-2">Performance Metrics</h3>
                  <p className="text-slate-500 font-bold text-center max-w-xs mb-8 uppercase text-xs tracking-widest">System is analyzing real-time data to generate predictive sales models.</p>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div className="w-2/3 h-full bg-indigo-600 animate-pulse" />
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Reports;
