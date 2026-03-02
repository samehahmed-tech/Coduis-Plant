
import React, { useState, useMemo, useRef } from 'react';
import {
   BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import {
   DollarSign, TrendingUp, ShoppingBag, Calendar, Download, Printer,
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
   const printableRootRef = useRef<HTMLDivElement | null>(null);

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

   const handlePrintCurrentReport = () => {
      if (settings.autoPrintReports === false) return;
      const node = printableRootRef.current;
      if (!node) return;
      const printWindow = window.open('', '_blank', 'width=1280,height=900');
      if (!printWindow) return;

      const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
         .map((el) => el.outerHTML)
         .join('\n');

      printWindow.document.write(`
        <html>
          <head>
            <title>RestoFlow Report - ${activeTab}</title>
            ${styleNodes}
          </head>
          <body>
            <div style="padding:16px">${node.innerHTML}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
         printWindow.print();
         printWindow.close();
      }, 300);
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
      <div ref={printableRootRef} className="p-8 min-h-screen bg-app transition-colors animate-fade-in pb-24 relative z-10">
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
            <div>
               <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 uppercase tracking-tighter flex items-center gap-4">
                  Reports
                  <div className="relative flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                  </div>
               </h2>
               <p className="text-muted md:text-lg font-bold tracking-wide mt-2">Financial insights and operational performance tracking.</p>
            </div>
            <div className="flex flex-col xl:flex-row gap-4 w-full lg:w-auto">
               <div className="flex bg-card/60 backdrop-blur-md border border-border/50 p-2 rounded-[1.5rem] shadow-sm">
                  {['SALES', 'PROFIT', 'FOOD_COST', 'VAT'].map(tab => (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === tab ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 scale-105' : 'text-slate-500 hover:text-main'}`}
                     >
                        {tab === 'VAT' ? 'Z-Report' : tab.replace('_', ' ')}
                     </button>
                  ))}
               </div>
               <div className="flex items-center gap-3 bg-card/60 backdrop-blur-md border border-border/50 p-3 rounded-[1.5rem] shadow-lg w-full xl:w-auto overflow-x-auto no-scrollbar">
                  <Calendar size={18} className="text-indigo-500 animate-pulse shrink-0" />
                  <input
                     type="date"
                     value={dateRange.start}
                     onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                     className="bg-transparent text-xs font-black text-main outline-none min-w-[120px]"
                  />
                  <span className="text-muted/50 font-black">-</span>
                  <input
                     type="date"
                     value={dateRange.end}
                     onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                     className="bg-transparent text-xs font-black text-main outline-none min-w-[120px]"
                  />
                  <button
                     onClick={() => setAppliedRange(dateRange)}
                     className="ml-auto px-4 py-2.5 rounded-xl bg-elevated text-[10px] font-black uppercase tracking-[0.2em] text-main shrink-0 flex items-center gap-2 border border-border/50 hover:border-indigo-500 hover:text-indigo-500 transition-all duration-300 shadow-sm"
                  >
                     <Filter size={14} />
                     <span className="hidden sm:inline">Apply</span>
                  </button>
                  <button
                     onClick={handlePrintCurrentReport}
                     className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shrink-0 flex items-center gap-2 hover:opacity-90 shadow-lg shadow-indigo-500/25 transition-all duration-300"
                  >
                     <Printer size={14} />
                     <span className="hidden sm:inline">Print</span>
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
            <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 border border-border/50 shadow-2xl relative overflow-hidden group">
                     <div className="absolute -inset-1.5 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                     <div className="relative z-10">
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Avg. Food Cost %</p>
                        <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 mb-2">{Number(profitSummary?.foodCostPercent || 0).toFixed(1)}%</h3>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> STABLE PERFORMANCE
                        </p>
                     </div>
                  </div>
               </div>

               <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 opacity-50" />
                  <div className="p-8 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-elevated/30">
                     <h3 className="text-2xl font-black text-main flex items-center gap-4 uppercase tracking-tighter">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-500">
                           <Scale size={24} />
                        </div>
                        Item Profitability
                     </h3>
                     <button onClick={handleExportCsv} className="w-full md:w-auto text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 px-6 py-3.5 rounded-xl transition-all duration-300">
                        <Download size={16} /> Export Analysis
                     </button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                              <th className="px-8 py-6">Menu Item</th>
                              <th className="px-6 py-6">Selling Price</th>
                              <th className="px-6 py-6">Recipe Cost</th>
                              <th className="px-6 py-6">Gross Margin</th>
                              <th className="px-6 py-6">Margin (%)</th>
                              <th className="px-8 py-6 text-right">Health Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                           {foodCostData.map((item, idx) => (
                              <tr key={idx} className="hover:bg-elevated/40 transition-colors group">
                                 <td className="px-8 py-5 font-black text-main uppercase text-xs group-hover:text-indigo-500 transition-colors">{item.name}</td>
                                 <td className="px-6 py-5 font-mono text-sm font-bold text-main">{item.price.toFixed(2)} ج.م</td>
                                 <td className="px-6 py-5 font-mono text-sm font-bold text-rose-500 bg-rose-500/5">{item.cost.toFixed(2)} ج.م</td>
                                 <td className="px-6 py-5 font-black text-sm text-emerald-500 bg-emerald-500/5">{item.margin.toFixed(2)} ج.م</td>
                                 <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                       <div className="w-24 bg-elevated h-2.5 rounded-full overflow-hidden border border-border/50">
                                          <div className={`h-full transition-all duration-1000 ${item.marginPercent > 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : item.marginPercent > 40 ? 'bg-gradient-to-r from-indigo-400 to-indigo-600' : 'bg-gradient-to-r from-rose-400 to-rose-600'}`} style={{ width: `${item.marginPercent}%` }} />
                                       </div>
                                       <span className="text-xs font-black text-main">{item.marginPercent.toFixed(1)}%</span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    {item.marginPercent > 60 ? (
                                       <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-inner inline-block">Star Performer</span>
                                    ) : item.cost > item.price ? (
                                       <span className="px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-inner inline-block animate-pulse">Loss Maker</span>
                                    ) : (
                                       <span className="px-3 py-1.5 bg-elevated text-muted border border-border/50 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block">Standard</span>
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
            <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
               <div className="bg-card/80 backdrop-blur-xl p-8 md:p-12 rounded-[3.5rem] border border-border/50 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                  <h3 className="text-3xl font-black text-main mb-10 tracking-tighter uppercase flex items-center gap-4">
                     <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full" />
                     Revenue vs Cost Analysis
                  </h3>
                  <div className="min-h-[360px] md:h-[460px] lg:h-[540px] w-full relative overflow-hidden z-10">
                     <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                        <AreaChart data={salesSeries} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#818cf8', fontSize: 13, fontWeight: 900 }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fill: '#818cf8', fontSize: 12, fontWeight: 900 }} dx={-10} />
                           <Tooltip contentStyle={{ borderRadius: '1.5rem', backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: '24px' }} itemStyle={{ fontWeight: 'black' }} />
                           <Legend iconType="circle" wrapperStyle={{ paddingTop: '40px', fontWeight: 'bold' }} />
                           <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#6366f1" fill="url(#colorRev)" strokeWidth={4} />
                           <Area type="monotone" dataKey="cost" name="Tax + Discounts Impact" stroke="#f43f5e" fill="url(#colorCost)" strokeWidth={3} strokeDasharray="5 5" />
                           <Line type="monotone" dataKey="profit" name="Gross Profit" stroke="#10b981" strokeWidth={5} dot={{ r: 6, fill: '#10b981', strokeWidth: 4, stroke: 'currentColor' }} activeDot={{ r: 10, strokeWidth: 0 }} />
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
                  <div className="card-primary rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                     <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
                        <Scale className="text-indigo-600" />
                     </div>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Fiscal VAT (14%)</p>
                     <h3 className="text-3xl font-black text-slate-800 dark:text-white">{(vatReport?.summary?.taxTotal || 0).toLocaleString()} <span className="text-xs text-slate-400">LE</span></h3>
                  </div>
                  <div className="card-primary rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                     <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
                        <TrendingUp className="text-emerald-600" />
                     </div>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Net Sales</p>
                     <h3 className="text-3xl font-black text-slate-800 dark:text-white">{(vatReport?.summary?.netTotal || 0).toLocaleString()} <span className="text-xs text-slate-400">LE</span></h3>
                  </div>
               </div>

               <div className="card-primary rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
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
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8 animate-in slide-in-from-bottom-5 duration-700">
               <div className="bg-card/80 backdrop-blur-xl p-8 md:p-10 rounded-[3.5rem] border border-border/50 shadow-2xl relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-[3.5rem]" />
                  <h3 className="text-3xl font-black text-main mb-10 tracking-tighter uppercase flex items-center gap-4">
                     <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full" />
                     Sales Distribution
                  </h3>
                  <div className="min-h-[260px] md:h-[340px] lg:h-[400px] w-full relative overflow-hidden z-10">
                     <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                        <BarChart data={salesSeries} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" /><stop offset="95%" stopColor="#06b6d4" /></linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#818cf8', fontWeight: 900 }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fill: '#818cf8', fontSize: 12, fontWeight: 900 }} dx={-10} />
                           <Tooltip contentStyle={{ borderRadius: '1.5rem', backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: '24px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                           <Bar dataKey="revenue" fill="url(#colorBar)" radius={[12, 12, 12, 12]} barSize={48} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-card/80 backdrop-blur-xl p-8 md:p-10 rounded-[3.5rem] border border-border/50 shadow-2xl flex flex-col relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.1),transparent_70%)] opacity-50" />

                  <div className="relative z-10 flex flex-col items-center flex-1">
                     <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-8 mt-4 shadow-inner">
                        <Target size={40} className="text-indigo-500" />
                     </div>
                     <h3 className="text-3xl font-black text-main uppercase tracking-tighter mb-4">Payment Mix</h3>
                     <p className="text-indigo-400 font-bold text-center max-w-xs mb-10 uppercase text-xs tracking-[0.2em] bg-indigo-500/10 px-4 py-2 rounded-xl">Live DB Tracker</p>

                     <div className="w-full space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1">
                        {paymentSummary.length === 0 ? (
                           <div className="p-8 border-2 border-dashed border-border/50 rounded-3xl text-[10px] font-black uppercase tracking-widest text-muted text-center mt-8">No payments in selected range</div>
                        ) : paymentSummary.map((p) => (
                           <div key={p.method} className="flex items-center justify-between rounded-2xl bg-elevated/50 border border-border/50 px-6 py-4 hover:border-indigo-500/50 hover:bg-elevated transition-colors group/item">
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted group-hover/item:text-indigo-400 transition-colors">{p.method}</span>
                              <span className="text-sm md:text-base font-black text-main">{Number(p.total || 0).toLocaleString()} LE</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Reports;
