
import React, { useState, useMemo } from 'react';
import {
   BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import {
   DollarSign, TrendingUp, ShoppingBag, Calendar, Download,
   ChevronDown, Filter, Target, Megaphone, Zap, Scale, Info
} from 'lucide-react';

import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../services/api';

const Reports: React.FC = () => {
   const navigate = useNavigate();
   const { settings } = useAuthStore();
   const activeBranchId = settings.activeBranchId;

   const [activeTab, setActiveTab] = useState<'SALES' | 'PROFIT' | 'FOOD_COST' | 'VAT'>('SALES');
   const [dateRange, setDateRange] = useState({
      start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
   });
   const [appliedRange, setAppliedRange] = useState(dateRange);
   const [dailySales, setDailySales] = useState<Array<{ day: string; revenue: number; net: number; tax: number; orderCount: number }>>([]);
   const [profitDaily, setProfitDaily] = useState<Array<{ day: string; revenue: number; net: number; tax: number; orderCount: number; cogs: number; grossProfit: number }>>([]);
   const [overview, setOverview] = useState<{ orderCount: number; grossSales: number; netSales: number; taxTotal: number; discountTotal: number; serviceChargeTotal: number } | null>(null);
   const [profitSummary, setProfitSummary] = useState<{ grossSales: number; netSales: number; taxTotal: number; orderCount: number; cogs: number; grossProfit: number; foodCostPercent: number } | null>(null);
   const [foodCostData, setFoodCostData] = useState<Array<{ id: string; name: string; price: number; cost: number; margin: number; marginPercent: number; soldQty: number; soldRevenue: number }>>([]);
   const [paymentSummary, setPaymentSummary] = useState<Array<{ method: string; total: number; count: number }>>([]);
   const [vatReport, setVatReport] = useState<any>(null);
   const [isLoadingReport, setIsLoadingReport] = useState(false);
   const [reportError, setReportError] = useState<string | null>(null);
   const [integrity, setIntegrity] = useState<any>(null);

   const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
   };

   const handleExportCsv = async () => {
      try {
         const blob = await reportsApi.exportCsv({
            branchId: activeBranchId,
            startDate: appliedRange.start,
            endDate: appliedRange.end,
            reportType: activeTab
         });
         downloadBlob(blob, `reports_${activeTab.toLowerCase()}_${appliedRange.start}_${appliedRange.end}.csv`);
      } catch (error: any) {
         setReportError(error?.message || 'Failed to export CSV');
      }
   };

   const handleExportPdf = async (reportType: string) => {
      try {
         const blob = await reportsApi.exportPdf({
            branchId: activeBranchId,
            startDate: appliedRange.start,
            endDate: appliedRange.end,
            reportType,
         });
         downloadBlob(blob, `reports_${reportType.toLowerCase()}_${appliedRange.start}_${appliedRange.end}.pdf`);
      } catch (error: any) {
         setReportError(error?.message || 'Failed to export PDF');
      }
   };

   React.useEffect(() => {
      const loadReports = async () => {
         setIsLoadingReport(true);
         setReportError(null);
         try {
            const params = { branchId: activeBranchId, startDate: appliedRange.start, endDate: appliedRange.end };
            const [overviewData, profitSummaryData, foodCostDataRes, profitDailyData, vatData, dailyData, paymentsData] = await Promise.all([
               reportsApi.getOverview(params),
               reportsApi.getProfitSummary(params),
               reportsApi.getFoodCost(params),
               reportsApi.getProfitDaily(params),
               reportsApi.getVat(params),
               reportsApi.getDailySales(params),
               reportsApi.getPayments(params)
            ]);
            setOverview(overviewData || null);
            setProfitSummary(profitSummaryData || null);
            setFoodCostData(foodCostDataRes || []);
            setProfitDaily(profitDailyData || []);
            setVatReport(vatData || null);
            setDailySales(dailyData || []);
            setPaymentSummary(paymentsData || []);
            const integrityData = await reportsApi.getIntegrity(params);
            setIntegrity(integrityData);
         } catch (error: any) {
            setReportError(error.message || 'Failed to load reports');
         } finally {
            setIsLoadingReport(false);
         }
      };
      loadReports();
   }, [activeBranchId, appliedRange.start, appliedRange.end]);

   const salesSeries = useMemo(() => (
      profitDaily.map(row => ({
         name: row.day,
         revenue: Number(row.revenue || 0),
         cost: Number(row.cogs || 0),
         profit: Number(row.grossProfit || 0),
         tax: Number(row.tax || 0)
      }))
   ), [profitDaily]);

   return (
      <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors animate-fade-in pb-24">
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
            <div>
               <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Business Intelligence</h2>
               <p className="text-slate-500 dark:text-slate-400 font-semibold">Financial insights and operational performance tracking.</p>
            </div>
            <div className="flex flex-col xl:flex-row gap-3 w-full lg:w-auto">
               <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm">
                  {['SALES', 'PROFIT', 'FOOD_COST', 'VAT'].map(tab => (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                     >
                        {tab === 'VAT' ? 'Z-Report' : tab.replace('_', ' ')}
                     </button>
                  ))}
               </div>
               <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl shadow-sm w-full xl:w-auto">
                  <Calendar size={16} className="text-slate-400" />
                  <input
                     type="date"
                     value={dateRange.start}
                     onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                     className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-200 outline-none"
                  />
                  <span className="text-slate-300">-</span>
                  <input
                     type="date"
                     value={dateRange.end}
                     onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                     className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-200 outline-none"
                  />
                  <button
                     onClick={() => setAppliedRange(dateRange)}
                     className="ml-auto px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2"
                  >
                     <Filter size={12} />
                     Apply
                  </button>
               </div>
            </div>
         </div>

         {isLoadingReport && (
            <div className="mb-6 text-[10px] font-black uppercase tracking-widest text-indigo-600">Loading report data from PostgreSQL...</div>
         )}
         {reportError && (
            <div className="mb-6 text-[10px] font-black uppercase tracking-widest text-rose-500">{reportError}</div>
         )}
         {integrity && (
            <div className={`mb-6 text-[10px] font-black uppercase tracking-widest ${integrity.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
               Integrity Checks: {integrity.summary?.passed || 0}/{integrity.summary?.total || 0} passed
            </div>
         )}

         {activeTab === 'FOOD_COST' ? (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Avg. Food Cost %</p>
                     <h3 className="text-4xl font-black text-indigo-600">{Number(profitSummary?.foodCostPercent || 0).toFixed(1)}%</h3>
                     <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase">STABLE PERFORMANCE</p>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                     <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <Scale size={24} className="text-indigo-600" /> Item Profitability Matrix
                     </h3>
                     <button onClick={handleExportCsv} className="text-xs font-black text-indigo-600 uppercase flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 px-4 py-2 rounded-xl transition-all">
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
                  <div className="min-h-[320px] md:h-[420px] lg:h-[500px] w-full relative overflow-hidden">
                     <ResponsiveContainer width="100%" height="100%" minHeight={500}>
                        <AreaChart data={salesSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                           <Area type="monotone" dataKey="cost" name="Tax + Discounts Impact" stroke="#f43f5e" fill="url(#colorCost)" strokeWidth={2} strokeDasharray="5 5" />
                           <Line type="monotone" dataKey="profit" name="Gross Profit" stroke="#10b981" strokeWidth={5} dot={{ r: 6, fill: '#10b981', strokeWidth: 4, stroke: '#fff' }} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
         ) : activeTab === 'VAT' ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
               <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                     <Info className="text-indigo-600" />
                     <div>
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Fiscal Compliance</p>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">For ETA submissions and audit trail, open Fiscal Hub.</p>
                     </div>
                  </div>
                  <button
                     onClick={() => navigate('/fiscal')}
                     className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg"
                  >
                     Open Fiscal Hub
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                     <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
                        <Scale className="text-indigo-600" />
                     </div>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Fiscal VAT (14%)</p>
                     <h3 className="text-3xl font-black text-slate-800 dark:text-white">{(vatReport?.summary?.taxTotal || 0).toLocaleString()} <span className="text-xs text-slate-400">LE</span></h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                     <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
                        <TrendingUp className="text-emerald-600" />
                     </div>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Net Sales</p>
                     <h3 className="text-3xl font-black text-slate-800 dark:text-white">{(vatReport?.summary?.netTotal || 0).toLocaleString()} <span className="text-xs text-slate-400">LE</span></h3>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                  <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                     <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">Daily Z-Report</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Reconciliation for {(vatReport?.summary?.count || 0)} Taxable Transactions</p>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => handleExportPdf('VAT')} className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-indigo-500/40 transition-all active:scale-95 flex items-center gap-2">
                           <Download size={16} /> Export Fiscal PDF
                        </button>
                     </div>
                  </div>
                  <div className="p-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Info size={14} className="text-indigo-500" /> Revenue Breakdown
                           </h4>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                                 <span className="text-[11px] font-black uppercase text-slate-500">Gross Sales</span>
                                 <span className="text-sm font-black text-slate-800 dark:text-white">{(vatReport?.summary?.grandTotal || 0).toLocaleString()} LE</span>
                              </div>
                              <div className="flex justify-between items-center p-4">
                                 <span className="text-[11px] font-black uppercase text-slate-500 text-rose-500">Total Discounts</span>
                                 <span className="text-sm font-black text-rose-500">- {(overview?.discountTotal || 0).toLocaleString()} LE</span>
                              </div>
                              <div className="flex justify-between items-center p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl">
                                 <span className="text-[11px] font-black uppercase text-slate-800 dark:text-white">Net Taxable Amount</span>
                                 <span className="text-sm font-black text-indigo-600 underline underline-offset-4">{(vatReport?.summary?.netTotal || 0).toLocaleString()} LE</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Scale size={14} className="text-emerald-500" /> Tax & Charges
                           </h4>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                 <span className="text-[11px] font-black uppercase text-emerald-600">VAT (14%)</span>
                                 <span className="text-sm font-black text-emerald-600">+ {(vatReport?.summary?.taxTotal || 0).toLocaleString()} LE</span>
                              </div>
                              <div className="flex justify-between items-center p-4">
                                 <span className="text-[11px] font-black uppercase text-slate-500">Service Charge ({(vatReport?.summary?.serviceChargeTotal > 0 ? '12%' : '0%')})</span>
                                 <span className="text-sm font-black text-slate-600">+ {(vatReport?.summary?.serviceChargeTotal || 0).toLocaleString()} LE</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-10 tracking-tight">Sales Distribution</h3>
                  <div className="min-h-[260px] md:h-[340px] lg:h-[400px] w-full relative overflow-hidden">
                     <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                        <BarChart data={salesSeries}>
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
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-2">Payment Mix</h3>
                  <p className="text-slate-500 font-bold text-center max-w-xs mb-8 uppercase text-xs tracking-widest">Live payment totals from database.</p>
                  <div className="w-full space-y-3">
                     {paymentSummary.length === 0 ? (
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">No payments in selected range</div>
                     ) : paymentSummary.map((p) => (
                        <div key={p.method} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{p.method}</span>
                           <span className="text-sm font-black text-slate-800 dark:text-white">{Number(p.total || 0).toLocaleString()} LE</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Reports;
