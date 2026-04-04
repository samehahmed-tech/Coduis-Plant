
import React, { useState, useMemo, useRef } from 'react';
import {
   BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import {
   DollarSign, TrendingUp, ShoppingBag, Calendar, Download, Printer,
   ChevronDown, Filter, Target, Megaphone, Zap, Scale, Info, Users, Clock, Box, ShieldCheck, Activity, LineChart as ChartIcon
} from 'lucide-react';

import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../services/api/reports';
import { getReportPrintCSS } from '../services/reportPrintStyles';

const REPORT_CATEGORIES = [
   { id: 'SALES', label: 'Sales & Revenue', icon: DollarSign, subReports: ['Daily Sales', 'Hourly Trends', 'Payment Mix', 'Cashier Summary', 'Refunds', 'Sales by Order Type', 'Sales by Item', 'Sales by Category', 'Discounts', 'Cancelled Orders', 'Sales by Source', 'Peak Hours Heatmap', 'Modifier Sales', 'Avg Ticket Trend', 'Sales Comparison', 'Slow-Moving Items', 'Revenue by Weekday', 'Void Items Log', 'Menu Engineering', 'Daypart Analysis', 'Basket Analysis', 'Seasonality', 'Online vs Offline', 'Menu Cannibalization', 'Menu Item Lifecycle', 'Category Contribution', 'Time-to-First-Order'] },
   { id: 'FINANCE', label: 'Financials & VAT', icon: Scale, subReports: ['Z-Report / Fiscal', 'Profit & Loss (P&L)', 'Trial Balance', 'Top Expenses', 'Tips Report', 'Service Charge', 'Shift Summary', 'Food Cost % Trend', 'Cash Flow Forecast', 'Tax Compliance', 'Audit Trail', 'Break-Even Analysis', 'Payment Reconciliation', 'Shift Profitability'] },
   { id: 'INVENTORY', label: 'Inventory & Supply', icon: Box, subReports: ['COGS & Margin', 'Stock Movement', 'Waste/Loss Log', 'Reorder Alerts', 'Expiring Batches', 'Actual vs Theoretical', 'Purchase History', 'Inventory Valuation', 'Supplier Price Tracking', 'Recipe Cost Alerts', 'ABC Classification', 'Optimal Pricing'] },
   { id: 'HR', label: 'HR & Payroll', icon: Users, subReports: ['Payroll Summary', 'Attendance & Delays', 'Overtime Report', 'Staff Cost %', 'Sales per Labor Hour', 'Employee Productivity'] },
   { id: 'CRM', label: 'Customers & CRM', icon: Megaphone, subReports: ['Customer LTV', 'Campaign ROI', 'Customer Retention', 'New vs Returning', 'Customer Frequency', 'Customer Churn', 'Loyalty Points', 'Promotion Impact', 'Customer Journey Funnel'] },
   { id: 'OPS', label: 'Operations', icon: Activity, subReports: ['Branch Performance', 'Order Preparation Time', 'Delivery Performance', 'Dine-in Tables', 'Kitchen Performance', 'Table Turnover', 'Wait Time', 'Driver Utilization', 'Branch Comparison', 'Delivery Zone Analytics', 'Delivery Cost vs Revenue', '3rd Party vs In-House'] },
   { id: 'AI', label: 'AI & Predictive', icon: Activity, subReports: ['Daily Flash Report', 'Demand Forecasting', 'Price Elasticity Simulator', 'Anomaly Detection', 'Channel Mix Trend'] }
];

const Reports: React.FC = () => {
   const navigate = useNavigate();
   const { settings } = useAuthStore();
   const activeBranchId = settings.activeBranchId;

   const [activeCategory, setActiveCategory] = useState<string>('SALES');
   const [activeSubReport, setActiveSubReport] = useState<string>('Daily Sales');
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
   const [hourlySales, setHourlySales] = useState<Array<{ hour: string; revenue: number; orderCount: number }>>([]);
   const [cashierSummary, setCashierSummary] = useState<Array<{ cashier: string; method: string; totalCollected: number; transactionCount: number }>>([]);
   const [refunds, setRefunds] = useState<Array<{ orderNumber: number; total: number; cancelReason: string; cancelledAt: string; status: string }>>([]);
   const [isLoadingReport, setIsLoadingReport] = useState(false);
   const [reportError, setReportError] = useState<string | null>(null);
   const [integrity, setIntegrity] = useState<any>(null);
   const [trialBalance, setTrialBalance] = useState<Array<{ accountId: string; accountCode: string; accountName: string; accountType: string; totalDebit: number; totalCredit: number; balance: number }>>([]);
   const [profitAndLoss, setProfitAndLoss] = useState<{ revenue: number; expenses: number; netProfit: number; details: Array<{ type: string; name: string; debit: number; credit: number; net: number }> } | null>(null);
   const [topExpenses, setTopExpenses] = useState<Array<{ name: string; total: number }>>([]);
   const [stockMovementLog, setStockMovementLog] = useState<Array<{ id: number; itemName: string; quantity: number; unitCost: number; totalCost: number; type: string; reason: string; performedBy: string; createdAt: string }>>([]);
   const [wasteLoss, setWasteLoss] = useState<{ items: any[]; totalWasteCost: number; count: number } | null>(null);
   const [reorderAlerts, setReorderAlerts] = useState<Array<{ itemId: string; itemName: string; unit: string; threshold: number; costPrice: number; currentStock: number; deficit: number }>>([]);
   const [expiringBatches, setExpiringBatches] = useState<{ items: any[]; totalAtRiskValue: number; alreadyExpired: number; totalBatches: number } | null>(null);
   const [payrollData, setPayrollData] = useState<{ cycles: any[]; payouts: any[]; totalPayroll: number } | null>(null);
   const [attendanceData, setAttendanceData] = useState<Array<{ employeeName: string; role: string; totalDays: number; presentDays: number; lateDays: number; absentDays: number; sickDays: number; totalHours: number; avgHoursPerDay: number }>>([]);
   const [overtimeData, setOvertimeData] = useState<Array<{ employeeName: string; role: string; hourlyRate: number; totalHours: number; workDays: number; overtimeHours: number; overtimeCost: number }>>([]);
   const [customerLTV, setCustomerLTV] = useState<Array<{ customerId: string; customerName: string; phone: string; totalSpent: number; orderCount: number; avgTicket: number; firstOrder: string; lastOrder: string }>>([]);
   const [campaignROI, setCampaignROI] = useState<Array<{ id: string; name: string; type: string; status: string; reach: number; conversions: number; revenue: number; budget: number; roi: number; conversionRate: number; createdAt: string }>>([]);
   const [branchPerformance, setBranchPerformance] = useState<Array<{ branchId: string; branchName: string; orderCount: number; revenue: number; avgTicket: number; cancelledCount: number }>>([]);
   const [orderPrepTime, setOrderPrepTime] = useState<Array<{ branchName: string; orderType: string; avgPrepMinutes: number; minPrepMinutes: number; maxPrepMinutes: number; orderCount: number }>>([]);
   const [salesByOrderType, setSalesByOrderType] = useState<Array<{ orderType: string; orderCount: number; revenue: number; netRevenue: number; avgTicket: number; totalDiscount: number; totalDeliveryFee: number; totalTax: number; percentage: number }>>([]);
   const [salesByItem, setSalesByItem] = useState<Array<{ menuItemId: string; itemName: string; qtySold: number; revenue: number; cost: number; profit: number; marginPercent: number }>>([]);
   const [salesByCategory, setSalesByCategory] = useState<Array<{ categoryId: string; categoryName: string; qtySold: number; revenue: number; cost: number; profit: number; itemCount: number; percentage: number }>>([]);
   const [discountAnalysis, setDiscountAnalysis] = useState<{ summary: any; byReason: any[]; byType: any[] } | null>(null);
   const [cancelledOrders, setCancelledOrders] = useState<{ summary: any; byReason: any[]; orders: any[] } | null>(null);
   const [deliveryPerformance, setDeliveryPerformance] = useState<{ summary: any; byDriver: any[] } | null>(null);
   const [salesBySource, setSalesBySource] = useState<Array<{ source: string; orderCount: number; revenue: number; avgTicket: number; percentage: number }>>([]);
   const [dineInTables, setDineInTables] = useState<Array<{ tableId: string; orderCount: number; revenue: number; avgTicket: number; avgDurationMinutes: number }>>([]);
   const [peakHoursData, setPeakHoursData] = useState<Array<{ dayOfWeek: number; hour: number; orderCount: number; revenue: number }>>([]);
   const [modifierSalesData, setModifierSalesData] = useState<Array<{ name: string; count: number; revenue: number }>>([]);
   const [avgTicketTrend, setAvgTicketTrend] = useState<Array<{ day: string; avgTicket: number; orderCount: number; revenue: number }>>([]);
   const [salesComparisonData, setSalesComparisonData] = useState<any>(null);
   const [slowMovingItems, setSlowMovingItems] = useState<Array<{ menuItemId: string; itemName: string; qtySold: number; revenue: number }>>([]);
   const [revenueByWeekday, setRevenueByWeekday] = useState<Array<{ dayOfWeek: number; dayName: string; orderCount: number; revenue: number; avgTicket: number }>>([]);
   const [voidItemsData, setVoidItemsData] = useState<{ summary: any; items: any[] } | null>(null);
   const [tipsData, setTipsData] = useState<{ summary: any; byType: any[]; daily: any[] } | null>(null);
   const [serviceChargeData, setServiceChargeData] = useState<{ summary: any; daily: any[] } | null>(null);
   const [shiftSummaryData, setShiftSummaryData] = useState<any[]>([]);
   const [actualVsTheoreticalData, setActualVsTheoreticalData] = useState<any[]>([]);
   const [purchaseHistoryData, setPurchaseHistoryData] = useState<any>(null);
   const [inventoryValuationData, setInventoryValuationData] = useState<any>(null);
   const [staffCostData, setStaffCostData] = useState<any>(null);
   const [salesPerLaborData, setSalesPerLaborData] = useState<any>(null);
   const [customerRetentionData, setCustomerRetentionData] = useState<any>(null);
   const [newVsReturningData, setNewVsReturningData] = useState<any>(null);
   const [customerFrequencyData, setCustomerFrequencyData] = useState<any>(null);
   const [kitchenPerformanceData, setKitchenPerformanceData] = useState<any[]>([]);
   const [menuEngineeringData, setMenuEngineeringData] = useState<any>(null);
   const [daypartData, setDaypartData] = useState<any[]>([]);
   const [basketData, setBasketData] = useState<any[]>([]);
   const [seasonalityData, setSeasonalityData] = useState<any[]>([]);
   const [onlineOfflineData, setOnlineOfflineData] = useState<any[]>([]);
   const [foodCostTrendData, setFoodCostTrendData] = useState<any[]>([]);
   const [taxComplianceData, setTaxComplianceData] = useState<any>(null);
   const [auditTrailData, setAuditTrailData] = useState<any>(null);
   const [cashFlowData, setCashFlowData] = useState<any>(null);
   const [supplierPriceData, setSupplierPriceData] = useState<any[]>([]);
   const [recipeCostData, setRecipeCostData] = useState<any>(null);
   const [abcData, setAbcData] = useState<any>(null);
   const [empProductivityData, setEmpProductivityData] = useState<any[]>([]);
   const [churnData, setChurnData] = useState<any>(null);
   const [loyaltyData, setLoyaltyData] = useState<any>(null);
   const [promoImpactData, setPromoImpactData] = useState<any[]>([]);
   const [tableTurnoverData, setTableTurnoverData] = useState<any[]>([]);
   const [waitTimeData, setWaitTimeData] = useState<any>(null);
   const [driverUtilData, setDriverUtilData] = useState<any[]>([]);
   const [branchCompData, setBranchCompData] = useState<any>(null);
   const [demandForecastData, setDemandForecastData] = useState<any>(null);
   const [priceElasticityData, setPriceElasticityData] = useState<any[]>([]);
   const [cannibalizationData, setCannibalizationData] = useState<any>(null);
   const [anomalyData, setAnomalyData] = useState<any>(null);
   const [breakEvenData, setBreakEvenData] = useState<any>(null);
   const [reconciliationData, setReconciliationData] = useState<any>(null);
   const [dailyFlashData, setDailyFlashData] = useState<any>(null);
   const [menuLifecycleData, setMenuLifecycleData] = useState<any[]>([]);
   const [catContribData, setCatContribData] = useState<any[]>([]);
   const [shiftProfitData, setShiftProfitData] = useState<any[]>([]);
   const [deliveryZoneData, setDeliveryZoneData] = useState<any[]>([]);
   const [deliveryCostData, setDeliveryCostData] = useState<any>(null);
   const [journeyFunnelData, setJourneyFunnelData] = useState<any[]>([]);
   const [channelMixData, setChannelMixData] = useState<any[]>([]);
   const [optimalPricingData, setOptimalPricingData] = useState<any>(null);
   const [thirdPartyData, setThirdPartyData] = useState<any>(null);
   const [timeToFirstData, setTimeToFirstData] = useState<any[]>([]);
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

   const getExportReportType = (sub: string): string => {
      const map: Record<string, string> = {
         'Trial Balance': 'TRIAL_BALANCE', 'Top Expenses': 'TOP_EXPENSES', 'Profit & Loss (P&L)': 'PROFIT_LOSS',
         'Stock Movement': 'STOCK_MOVEMENTS', 'Waste/Loss Log': 'WASTE_LOSS', 'Reorder Alerts': 'REORDER_ALERTS',
         'Expiring Batches': 'EXPIRING_BATCHES', 'Payroll Summary': 'PAYROLL', 'Attendance & Delays': 'ATTENDANCE',
         'Overtime Report': 'OVERTIME', 'Customer LTV': 'CUSTOMER_LTV', 'Campaign ROI': 'CAMPAIGN_ROI',
         'Branch Performance': 'BRANCH_PERFORMANCE', 'Order Preparation Time': 'ORDER_PREP_TIME',
         'Sales by Order Type': 'SALES_BY_ORDER_TYPE', 'Sales by Item': 'SALES_BY_ITEM', 'Sales by Category': 'SALES_BY_CATEGORY',
         'Discounts': 'DISCOUNT_ANALYSIS', 'Cancelled Orders': 'CANCELLED_ORDERS', 'Delivery Performance': 'DELIVERY_PERFORMANCE',
         'Sales by Source': 'SALES_BY_SOURCE', 'Dine-in Tables': 'DINE_IN_TABLES',
         'Peak Hours Heatmap': 'PEAK_HOURS_HEATMAP', 'Modifier Sales': 'MODIFIER_SALES', 'Avg Ticket Trend': 'AVG_TICKET_TREND',
         'Sales Comparison': 'SALES_COMPARISON', 'Slow-Moving Items': 'SLOW_MOVING_ITEMS', 'Revenue by Weekday': 'REVENUE_BY_WEEKDAY',
         'Void Items Log': 'VOID_ITEMS', 'Tips Report': 'TIPS_REPORT', 'Service Charge': 'SERVICE_CHARGE',
         'Shift Summary': 'SHIFT_SUMMARY', 'Actual vs Theoretical': 'ACTUAL_VS_THEORETICAL', 'Purchase History': 'PURCHASE_HISTORY',
         'Inventory Valuation': 'INVENTORY_VALUATION', 'Staff Cost %': 'STAFF_COST_VS_REVENUE', 'Sales per Labor Hour': 'SALES_PER_LABOR_HOUR',
         'Customer Retention': 'CUSTOMER_RETENTION', 'New vs Returning': 'NEW_VS_RETURNING', 'Customer Frequency': 'CUSTOMER_FREQUENCY',
         'Kitchen Performance': 'KITCHEN_PERFORMANCE', 'Menu Engineering': 'MENU_ENGINEERING', 'Daypart Analysis': 'DAYPART_ANALYSIS',
         'Basket Analysis': 'BASKET_ANALYSIS', 'Seasonality': 'SEASONALITY', 'Online vs Offline': 'ONLINE_VS_OFFLINE',
         'Food Cost % Trend': 'FOOD_COST_TREND', 'Tax Compliance': 'TAX_COMPLIANCE', 'Audit Trail': 'AUDIT_TRAIL',
         'Cash Flow Forecast': 'CASH_FLOW_FORECAST', 'Supplier Price Tracking': 'SUPPLIER_PRICE_TRACKING',
         'Recipe Cost Alerts': 'RECIPE_COST_ALERTS', 'ABC Classification': 'ABC_CLASSIFICATION',
         'Employee Productivity': 'EMPLOYEE_PRODUCTIVITY', 'Customer Churn': 'CUSTOMER_CHURN',
         'Loyalty Points': 'LOYALTY_POINTS', 'Promotion Impact': 'PROMOTION_IMPACT',
         'Table Turnover': 'TABLE_TURNOVER', 'Wait Time': 'WAIT_TIME',
         'Driver Utilization': 'DRIVER_UTILIZATION', 'Branch Comparison': 'BRANCH_COMPARISON',
         'Demand Forecasting': 'DEMAND_FORECAST', 'Price Elasticity Simulator': 'PRICE_ELASTICITY',
         'Menu Cannibalization': 'MENU_CANNIBALIZATION', 'Anomaly Detection': 'ANOMALY_DETECTION',
         'Break-Even Analysis': 'BREAK_EVEN', 'Payment Reconciliation': 'PAYMENT_RECONCILIATION',
         'Daily Flash Report': 'DAILY_FLASH', 'Menu Item Lifecycle': 'MENU_LIFECYCLE',
         'Category Contribution': 'CATEGORY_CONTRIBUTION', 'Shift Profitability': 'SHIFT_PROFITABILITY',
         'Delivery Zone Analytics': 'DELIVERY_ZONE', 'Delivery Cost vs Revenue': 'DELIVERY_COST_REVENUE',
         'Customer Journey Funnel': 'CUSTOMER_JOURNEY', 'Channel Mix Trend': 'CHANNEL_MIX',
         'Optimal Pricing': 'OPTIMAL_PRICING', '3rd Party vs In-House': 'THIRD_PARTY_VS_INHOUSE',
         'Time-to-First-Order': 'TIME_TO_FIRST_ORDER',
      };
      return map[sub] || sub.toUpperCase().replace(/\s+/g, '_');
   };

   const handleExportCsv = async () => {
      try {
         const blob = await reportsApi.exportCsv({
            branchId: activeBranchId,
            startDate: appliedRange.start,
            endDate: appliedRange.end,
            reportType: getExportReportType(activeSubReport)
         });
         downloadBlob(blob, `reports_${activeSubReport.replace(/\s+/g, '_').toLowerCase()}_${appliedRange.start}_${appliedRange.end}.csv`);
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
            reportType: getExportReportType(reportType),
         });
         downloadBlob(blob, `reports_${reportType.toLowerCase().replace(/\s+/g, '_')}_${appliedRange.start}_${appliedRange.end}.pdf`);
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

      const restaurantName = settings.restaurantName || 'RestoFlow ERP';
      const dateRangeStr = `${appliedRange.start} to ${appliedRange.end}`;
      const printCSS = getReportPrintCSS(restaurantName, activeSubReport, dateRangeStr);

      printWindow.document.write(`
        <html>
          <head>
            <title>${restaurantName} - ${activeSubReport}</title>
            ${styleNodes}
            ${printCSS}
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
      }, 400);
   };

   // ── On-Demand Report Loading (Phase 2 Performance) ──
   // Only fetch data needed for the currently active sub-report.
   // This replaces the old approach of loading ALL 70+ reports at once.
   const loadedReports = React.useRef<Set<string>>(new Set());

   React.useEffect(() => {
      // Reset loaded cache when date range changes
      loadedReports.current = new Set();
   }, [appliedRange.start, appliedRange.end]);

   React.useEffect(() => {
      const params = { branchId: activeBranchId, startDate: appliedRange.start, endDate: appliedRange.end };
      const key = `${activeSubReport}__${appliedRange.start}__${appliedRange.end}__${activeBranchId}`;
      if (loadedReports.current.has(key)) return;

      const load = async () => {
         setIsLoadingReport(true);
         setReportError(null);
         try {
            // Always load overview + profit summary (used in sidebar KPIs)
            if (!overview) {
               const [ov, ps] = await Promise.all([
                  reportsApi.getOverview(params).catch(() => null),
                  reportsApi.getProfitSummary(params).catch(() => null),
               ]);
               setOverview(ov); setProfitSummary(ps);
            }
            // Load integrity once
            if (!integrity) {
               const intData = await reportsApi.getIntegrity(params).catch(() => null);
               setIntegrity(intData);
            }

            // ── SALES Category ──
            switch (activeSubReport) {
               case 'Daily Sales': {
                  const [d, pd, pm] = await Promise.all([
                     reportsApi.getDailySales(params), reportsApi.getProfitDaily(params), reportsApi.getPayments(params),
                  ]);
                  setDailySales(d || []); setProfitDaily(pd || []); setPaymentSummary(pm || []);
                  break;
               }
               case 'Hourly Trends': { const r = await reportsApi.getHourlySales(params); setHourlySales(r || []); break; }
               case 'Payment Mix': { const r = await reportsApi.getPayments(params); setPaymentSummary(r || []); break; }
               case 'Cashier Summary': { const r = await reportsApi.getCashierSummary(params); setCashierSummary(r || []); break; }
               case 'Refunds': { const r = await reportsApi.getRefundsReport(params); setRefunds(r || []); break; }
               case 'Sales by Order Type': { const r = await reportsApi.getSalesByOrderType(params).catch(() => []); setSalesByOrderType(r as any || []); break; }
               case 'Sales by Item': { const r = await reportsApi.getSalesByItem(params).catch(() => []); setSalesByItem(r as any || []); break; }
               case 'Sales by Category': { const r = await reportsApi.getSalesByCategory(params).catch(() => []); setSalesByCategory(r as any || []); break; }
               case 'Discounts': { const r = await reportsApi.getDiscountAnalysis(params).catch(() => null); setDiscountAnalysis(r as any); break; }
               case 'Cancelled Orders': { const r = await reportsApi.getCancelledOrders(params).catch(() => null); setCancelledOrders(r as any); break; }
               case 'Sales by Source': { const r = await reportsApi.getSalesBySource(params).catch(() => []); setSalesBySource(r as any || []); break; }
               case 'Peak Hours Heatmap': { const r = await reportsApi.getPeakHoursHeatmap(params).catch(() => []); setPeakHoursData(r as any || []); break; }
               case 'Modifier Sales': { const r = await reportsApi.getModifierSales(params).catch(() => []); setModifierSalesData(r as any || []); break; }
               case 'Avg Ticket Trend': { const r = await reportsApi.getAvgTicketTrend(params).catch(() => []); setAvgTicketTrend(r as any || []); break; }
               case 'Sales Comparison': {
                  const compareEnd = new Date(new Date(params.startDate).getTime() - 86400000).toISOString().split('T')[0];
                  const duration = new Date(params.endDate).getTime() - new Date(params.startDate).getTime();
                  const compareStart = new Date(new Date(params.startDate).getTime() - duration - 86400000).toISOString().split('T')[0];
                  const r = await reportsApi.getSalesComparison({ ...params, compareStartDate: compareStart, compareEndDate: compareEnd }).catch(() => null);
                  setSalesComparisonData(r as any); break;
               }
               case 'Slow-Moving Items': { const r = await reportsApi.getSlowMovingItems(params).catch(() => []); setSlowMovingItems(r as any || []); break; }
               case 'Revenue by Weekday': { const r = await reportsApi.getRevenueByWeekday(params).catch(() => []); setRevenueByWeekday(r as any || []); break; }
               case 'Void Items Log': { const r = await reportsApi.getVoidItemsLog(params).catch(() => null); setVoidItemsData(r as any); break; }
               case 'Menu Engineering': { const r = await reportsApi.getMenuEngineering(params).catch(() => null); setMenuEngineeringData(r as any); break; }
               case 'Daypart Analysis': { const r = await reportsApi.getDaypartAnalysis(params).catch(() => []); setDaypartData(r as any || []); break; }
               case 'Basket Analysis': { const r = await reportsApi.getBasketAnalysis(params).catch(() => []); setBasketData(r as any || []); break; }
               case 'Seasonality': { const r = await reportsApi.getSeasonality({ branchId: params.branchId }).catch(() => []); setSeasonalityData(r as any || []); break; }
               case 'Online vs Offline': { const r = await reportsApi.getOnlineVsOffline(params).catch(() => []); setOnlineOfflineData(r as any || []); break; }
               case 'Menu Cannibalization': { const r = await reportsApi.getMenuCannibalization({ branchId: params.branchId }).catch(() => null); setCannibalizationData(r as any); break; }
               case 'Menu Item Lifecycle': { const r = await reportsApi.getMenuLifecycle({ branchId: params.branchId }).catch(() => []); setMenuLifecycleData(r as any || []); break; }
               case 'Category Contribution': { const r = await reportsApi.getCategoryContribution(params).catch(() => []); setCatContribData(r as any || []); break; }
               case 'Time-to-First-Order': { const r = await reportsApi.getTimeToFirstOrder().catch(() => []); setTimeToFirstData(r as any || []); break; }

               // ── FINANCE Category ──
               case 'Z-Report / Fiscal': { const r = await reportsApi.getVat(params); setVatReport(r || null); break; }
               case 'Profit & Loss (P&L)': {
                  const [pd, pl] = await Promise.all([reportsApi.getProfitDaily(params), reportsApi.getProfitAndLoss(params).catch(() => null)]);
                  setProfitDaily(pd || []); setProfitAndLoss(pl as any);
                  break;
               }
               case 'Trial Balance': { const r = await reportsApi.getTrialBalance(params).catch(() => []); setTrialBalance(r as any || []); break; }
               case 'Top Expenses': { const r = await reportsApi.getTopExpenses(params).catch(() => []); setTopExpenses(r as any || []); break; }
               case 'Tips Report': { const r = await reportsApi.getTipsReport(params).catch(() => null); setTipsData(r as any); break; }
               case 'Service Charge': { const r = await reportsApi.getServiceChargeReport(params).catch(() => null); setServiceChargeData(r as any); break; }
               case 'Shift Summary': { const r = await reportsApi.getShiftSummary(params).catch(() => []); setShiftSummaryData(r as any || []); break; }
               case 'Food Cost % Trend': { const r = await reportsApi.getFoodCostTrend(params).catch(() => []); setFoodCostTrendData(r as any || []); break; }
               case 'Cash Flow Forecast': { const r = await reportsApi.getCashFlowForecast({ branchId: params.branchId }).catch(() => null); setCashFlowData(r as any); break; }
               case 'Tax Compliance': { const r = await reportsApi.getTaxCompliance(params).catch(() => null); setTaxComplianceData(r as any); break; }
               case 'Audit Trail': { const r = await reportsApi.getAuditTrail(params).catch(() => null); setAuditTrailData(r as any); break; }
               case 'Break-Even Analysis': { const r = await reportsApi.getBreakEven({ branchId: params.branchId }).catch(() => null); setBreakEvenData(r as any); break; }
               case 'Payment Reconciliation': { const r = await reportsApi.getPaymentReconciliation(params).catch(() => null); setReconciliationData(r as any); break; }
               case 'Shift Profitability': { const r = await reportsApi.getShiftProfitability(params).catch(() => []); setShiftProfitData(r as any || []); break; }

               // ── INVENTORY Category ──
               case 'COGS & Margin': { const r = await reportsApi.getFoodCost(params); setFoodCostData(r || []); break; }
               case 'Stock Movement': { const r = await reportsApi.getStockMovements(params).catch(() => []); setStockMovementLog(r as any || []); break; }
               case 'Waste/Loss Log': { const r = await reportsApi.getWasteLoss(params).catch(() => null); setWasteLoss(r as any); break; }
               case 'Reorder Alerts': { const r = await reportsApi.getReorderAlerts().catch(() => []); setReorderAlerts(r as any || []); break; }
               case 'Expiring Batches': { const r = await reportsApi.getExpiringBatches().catch(() => null); setExpiringBatches(r as any); break; }
               case 'Actual vs Theoretical': { const r = await reportsApi.getActualVsTheoretical(params).catch(() => []); setActualVsTheoreticalData(r as any || []); break; }
               case 'Purchase History': { const r = await reportsApi.getPurchaseHistory(params).catch(() => null); setPurchaseHistoryData(r as any); break; }
               case 'Inventory Valuation': { const r = await reportsApi.getInventoryValuation().catch(() => null); setInventoryValuationData(r as any); break; }
               case 'Supplier Price Tracking': { const r = await reportsApi.getSupplierPriceTracking(params).catch(() => []); setSupplierPriceData(r as any || []); break; }
               case 'Recipe Cost Alerts': { const r = await reportsApi.getRecipeCostAlerts().catch(() => null); setRecipeCostData(r as any); break; }
               case 'ABC Classification': { const r = await reportsApi.getABCClassification().catch(() => null); setAbcData(r as any); break; }
               case 'Optimal Pricing': { const r = await reportsApi.getOptimalPricing().catch(() => null); setOptimalPricingData(r as any); break; }

               // ── HR Category ──
               case 'Payroll Summary': { const r = await reportsApi.getPayrollSummary(params).catch(() => null); setPayrollData(r as any); break; }
               case 'Attendance & Delays': { const r = await reportsApi.getAttendanceReport(params).catch(() => []); setAttendanceData(r as any || []); break; }
               case 'Overtime Report': { const r = await reportsApi.getOvertimeReport(params).catch(() => []); setOvertimeData(r as any || []); break; }
               case 'Staff Cost %': { const r = await reportsApi.getStaffCostVsRevenue(params).catch(() => null); setStaffCostData(r as any); break; }
               case 'Sales per Labor Hour': { const r = await reportsApi.getSalesPerLaborHour(params).catch(() => null); setSalesPerLaborData(r as any); break; }
               case 'Employee Productivity': { const r = await reportsApi.getEmployeeProductivity(params).catch(() => []); setEmpProductivityData(r as any || []); break; }

               // ── CRM Category ──
               case 'Customer LTV': { const r = await reportsApi.getCustomerLTV(params).catch(() => []); setCustomerLTV(r as any || []); break; }
               case 'Campaign ROI': { const r = await reportsApi.getCampaignROI().catch(() => []); setCampaignROI(r as any || []); break; }
               case 'Customer Retention': { const r = await reportsApi.getCustomerRetention(params).catch(() => null); setCustomerRetentionData(r as any); break; }
               case 'New vs Returning': { const r = await reportsApi.getNewVsReturning(params).catch(() => null); setNewVsReturningData(r as any); break; }
               case 'Customer Frequency': { const r = await reportsApi.getCustomerFrequency(params).catch(() => null); setCustomerFrequencyData(r as any); break; }
               case 'Customer Churn': { const r = await reportsApi.getCustomerChurn({ branchId: params.branchId }).catch(() => null); setChurnData(r as any); break; }
               case 'Loyalty Points': { const r = await reportsApi.getLoyaltyPoints().catch(() => null); setLoyaltyData(r as any); break; }
               case 'Promotion Impact': { const r = await reportsApi.getPromotionImpact().catch(() => []); setPromoImpactData(r as any || []); break; }
               case 'Customer Journey Funnel': { const r = await reportsApi.getCustomerJourney().catch(() => []); setJourneyFunnelData(r as any || []); break; }

               // ── OPS Category ──
               case 'Branch Performance': { const r = await reportsApi.getBranchPerformance(params).catch(() => []); setBranchPerformance(r as any || []); break; }
               case 'Order Preparation Time': { const r = await reportsApi.getOrderPrepTime(params).catch(() => []); setOrderPrepTime(r as any || []); break; }
               case 'Delivery Performance': { const r = await reportsApi.getDeliveryPerformance(params).catch(() => null); setDeliveryPerformance(r as any); break; }
               case 'Dine-in Tables': { const r = await reportsApi.getDineInTableAnalysis(params).catch(() => []); setDineInTables(r as any || []); break; }
               case 'Kitchen Performance': { const r = await reportsApi.getKitchenPerformance(params).catch(() => []); setKitchenPerformanceData(r as any || []); break; }
               case 'Table Turnover': { const r = await reportsApi.getTableTurnover(params).catch(() => []); setTableTurnoverData(r as any || []); break; }
               case 'Wait Time': { const r = await reportsApi.getWaitTime(params).catch(() => null); setWaitTimeData(r as any); break; }
               case 'Driver Utilization': { const r = await reportsApi.getDriverUtilization(params).catch(() => []); setDriverUtilData(r as any || []); break; }
               case 'Branch Comparison': { const r = await reportsApi.getBranchComparison(params).catch(() => null); setBranchCompData(r as any); break; }
               case 'Delivery Zone Analytics': { const r = await reportsApi.getDeliveryZone(params).catch(() => []); setDeliveryZoneData(r as any || []); break; }
               case 'Delivery Cost vs Revenue': { const r = await reportsApi.getDeliveryCostRevenue(params).catch(() => null); setDeliveryCostData(r as any); break; }
               case '3rd Party vs In-House': { const r = await reportsApi.getThirdPartyVsInHouse(params).catch(() => null); setThirdPartyData(r as any); break; }

               // ── AI Category ──
               case 'Daily Flash Report': { const r = await reportsApi.getDailyFlash({ branchId: params.branchId }).catch(() => null); setDailyFlashData(r as any); break; }
               case 'Demand Forecasting': { const r = await reportsApi.getDemandForecast({ branchId: params.branchId }).catch(() => null); setDemandForecastData(r as any); break; }
               case 'Price Elasticity Simulator': { const r = await reportsApi.getPriceElasticity({ branchId: params.branchId }).catch(() => []); setPriceElasticityData(r as any || []); break; }
               case 'Anomaly Detection': { const r = await reportsApi.getAnomalyDetection(params).catch(() => null); setAnomalyData(r as any); break; }
               case 'Channel Mix Trend': { const r = await reportsApi.getChannelMix(params).catch(() => []); setChannelMixData(r as any || []); break; }

               default:
                  console.warn('No loader defined for report:', activeSubReport);
            }
            loadedReports.current.add(key);
         } catch (error: any) {
            setReportError(error.message || 'Failed to load report');
         } finally {
            setIsLoadingReport(false);
         }
      };
      load();
   }, [activeSubReport, activeBranchId, appliedRange.start, appliedRange.end]);

   const salesSeries = useMemo(() => (
      profitDaily.map(row => ({
         name: row.day,
         revenue: Number(row.revenue || 0),
         cost: Number(row.cogs || 0),
         profit: Number(row.grossProfit || 0),
         tax: Number(row.tax || 0)
      }))
   ), [profitDaily]);

   const activeCategoryData = REPORT_CATEGORIES.find(c => c.id === activeCategory);

   return (
      <div ref={printableRootRef} className="flex h-screen bg-app overflow-hidden font-neo pb-20 md:pb-0 text-main relative z-10 transition-colors duration-500">
         {/* Vertical Sidebar */}
         <div className="w-20 md:w-64 flex-shrink-0 bg-card/80 backdrop-blur-xl border-r border-border/50 flex flex-col items-center md:items-stretch py-8 shadow-2xl z-20 overflow-y-auto no-scrollbar">
            <div className="px-6 mb-8 hidden md:block">
               <h2 className="text-xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 uppercase tracking-tighter flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                     <ChartIcon size={18} strokeWidth={3} />
                  </div>
                  Reports
               </h2>
               <p className="text-[10px] text-muted font-bold tracking-[0.2em] uppercase mt-2">Enterprise Insights</p>
            </div>

            <nav className="flex-1 w-full space-y-2 px-2 md:px-4">
               {REPORT_CATEGORIES.map(category => {
                  const isActive = activeCategory === category.id;
                  const Icon = category.icon;
                  return (
                     <div key={category.id} className="w-full">
                        <button
                           onClick={() => {
                              setActiveCategory(category.id);
                              setActiveSubReport(category.subReports[0]);
                           }}
                           className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-3.5 md:p-4 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/25 text-white' : 'hover:bg-elevated text-slate-500 hover:text-main'}`}
                        >
                           <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} strokeWidth={isActive ? 2.5 : 2} />
                           <span className="hidden md:block text-xs font-black uppercase tracking-wider">{category.label}</span>
                        </button>

                        {isActive && (
                           <div className="hidden md:flex flex-col gap-1 mt-2 pl-4 border-l-2 border-indigo-500/20 ml-6 animate-in slide-in-from-top-2 duration-300">
                              {category.subReports.map(sub => (
                                 <button
                                    key={sub}
                                    onClick={() => setActiveSubReport(sub)}
                                    className={`text-left px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeSubReport === sub ? 'bg-indigo-500/10 text-indigo-500' : 'text-muted hover:text-main hover:bg-elevated'}`}
                                 >
                                    {sub}
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                  );
               })}
            </nav>
         </div>

         {/* Main Content Area */}
         <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div className="absolute top-0 right-0 w-full h-[50vh] bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

            {/* Header / Global Filters */}
            <div className="flex-shrink-0 p-6 md:p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-border/50 bg-card/95 z-10 sticky top-0">
               <div>
                  <h3 className="text-2xl font-black text-main flex items-center gap-3 uppercase tracking-tighter">
                     {activeCategoryData?.icon && React.createElement(activeCategoryData.icon, { size: 24, className: "text-indigo-500" })}
                     {activeSubReport}
                  </h3>
                  <p className="text-xs text-muted font-bold tracking-widest uppercase mt-1">
                     {activeCategoryData?.label} Division
                  </p>
               </div>

               <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  <div className="flex items-center gap-3 bg-elevated/80 border border-border/50 p-2 rounded-2xl shadow-sm">
                     <Calendar size={16} className="text-indigo-500 ml-2" />
                     <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-transparent text-[11px] font-black text-main outline-none min-w-[110px]"
                     />
                     <span className="text-muted/50 font-black">-</span>
                     <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-transparent text-[11px] font-black text-main outline-none min-w-[110px] mr-2"
                     />
                     <button
                        onClick={() => setAppliedRange(dateRange)}
                        className="px-4 py-2 rounded-xl bg-indigo-500 border border-indigo-400 text-[10px] font-black uppercase tracking-widest text-white shrink-0 hover:bg-indigo-600 transition-colors shadow-md"
                     >
                        Apply
                     </button>
                  </div>

                  <div className="flex items-center gap-2">
                     <button
                        onClick={handleExportCsv}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all shadow-sm text-[10px] font-black uppercase tracking-widest"
                        title="Export Excel / CSV"
                     >
                        <Download size={16} />
                        CSV
                     </button>
                     <button
                        onClick={() => handleExportPdf(activeCategory)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all shadow-sm text-[10px] font-black uppercase tracking-widest"
                        title="Export PDF"
                     >
                        <Download size={16} />
                        PDF
                     </button>
                     <button
                        onClick={handlePrintCurrentReport}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 transition-all shadow-sm text-[10px] font-black uppercase tracking-widest"
                        title="Print Report"
                     >
                        <Printer size={16} />
                        Print
                     </button>
                  </div>
               </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar relative z-0 pb-32">

               {isLoadingReport && (
                  <div className="w-full flex justify-center py-12">
                     <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                        <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Compiling Data...</span>
                     </div>
                  </div>
               )}

               {reportError && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                     <Target size={16} />
                     {reportError}
                  </div>
               )}

               {integrity && (
                  <div className={`text-[10px] font-black uppercase tracking-widest ${integrity.ok ? 'text-emerald-500/70' : 'text-rose-500/70'} flex justify-end`}>
                     Data Integrity Link: {integrity.summary?.passed || 0}/{integrity.summary?.total || 0} Synced
                  </div>
               )}


               {/* Dynamic Content Routing */}
               {activeCategory === 'SALES' && activeSubReport === 'Daily Sales' && (
                  <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8 animate-in slide-in-from-bottom-5 duration-700">
                     <div className="bg-card/80 backdrop-blur-xl p-8 md:p-10 rounded-[3.5rem] border border-border/50 shadow-2xl relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-[3.5rem]" />
                        <h3 className="text-3xl font-black text-main mb-10 tracking-tighter uppercase flex items-center gap-4">
                           <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full" />
                           Sales Distribution
                        </h3>
                        <div className="min-h-[260px] md:h-[340px] lg:h-[400px] w-full relative overflow-hidden z-10">
                           <ResponsiveContainer width="100%" height="100%" minHeight={400} minWidth={0}>
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

               {activeCategory === 'FINANCE' && activeSubReport === 'Profit & Loss (P&L)' && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
                     <div className="bg-card/80 backdrop-blur-xl p-8 md:p-12 rounded-[3.5rem] border border-border/50 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                        <h3 className="text-3xl font-black text-main mb-10 tracking-tighter uppercase flex items-center gap-4">
                           <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full" />
                           Revenue vs Cost Analysis
                        </h3>
                        <div className="min-h-[360px] md:h-[460px] lg:h-[540px] w-full relative overflow-hidden z-10">
                           <ResponsiveContainer width="100%" height="100%" minHeight={400} minWidth={0}>
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
               )}

               {activeCategory === 'INVENTORY' && activeSubReport === 'COGS & Margin' && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 border border-border/50 shadow-2xl relative overflow-hidden group">
                           <div className="absolute -inset-1.5 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                           <div className="relative z-10">
                              <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Avg. Food Cost %</p>
                              <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 mb-2">{Number(profitSummary?.foodCostPercent || 0).toFixed(1)}%</h3>
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
                        </div>
                        <div className="responsive-table">
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
               )}

               {activeCategory === 'FINANCE' && activeSubReport === 'Z-Report / Fiscal' && (
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

                     <div className="card-primary rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                           <div>
                              <h3 className="text-2xl font-black text-slate-800 dark:text-white">Daily Z-Report</h3>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Reconciliation for {(vatReport?.summary?.count || 0)} Taxable Transactions</p>
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
               )}

               {activeCategory === 'FINANCE' && activeSubReport === 'Trial Balance' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-elevated/30">
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter flex items-center gap-4">
                              <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20 text-violet-500"><Scale size={24} /></div>
                              Trial Balance
                           </h3>
                        </div>
                        {trialBalance.length === 0 ? (
                           <div className="p-16 text-center text-muted text-xs font-black uppercase tracking-widest">No journal entries found for this period</div>
                        ) : (
                           <div className="responsive-table">
                              <table className="w-full text-left border-collapse">
                                 <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-5">Code</th><th className="px-6 py-5">Account</th><th className="px-6 py-5">Type</th><th className="px-6 py-5 text-right">Debit</th><th className="px-6 py-5 text-right">Credit</th><th className="px-8 py-5 text-right">Balance</th>
                                 </tr></thead>
                                 <tbody className="divide-y divide-border/30">
                                    {trialBalance.map((row, idx) => (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                          <td className="px-8 py-4 font-mono text-xs font-bold text-indigo-500">{row.accountCode}</td>
                                          <td className="px-6 py-4 text-xs font-black text-main uppercase">{row.accountName}</td>
                                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${row.accountType === 'REVENUE' ? 'bg-emerald-500/10 text-emerald-500' : row.accountType === 'EXPENSE' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'}`}>{row.accountType}</span></td>
                                          <td className="px-6 py-4 font-mono text-sm font-bold text-main text-right">{row.totalDebit.toLocaleString()}</td>
                                          <td className="px-6 py-4 font-mono text-sm font-bold text-main text-right">{row.totalCredit.toLocaleString()}</td>
                                          <td className={`px-8 py-4 font-mono text-sm font-black text-right ${row.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{row.balance.toLocaleString()}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {activeCategory === 'FINANCE' && activeSubReport === 'Top Expenses' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-elevated/30">
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter flex items-center gap-4">
                              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 text-rose-500"><TrendingUp size={24} /></div>
                              Top Expenses
                           </h3>
                        </div>
                        {topExpenses.length === 0 ? (
                           <div className="p-16 text-center text-muted text-xs font-black uppercase tracking-widest">No expense data found</div>
                        ) : (
                           <div className="p-8 space-y-3">
                              {topExpenses.map((exp, idx) => (
                                 <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-elevated/40 transition-colors group">
                                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 text-[10px] font-black">{idx + 1}</div>
                                    <div className="flex-1">
                                       <p className="text-xs font-black text-main uppercase">{exp.name}</p>
                                       <div className="mt-1.5 h-2 bg-elevated rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000" style={{ width: `${topExpenses[0]?.total ? (exp.total / topExpenses[0].total * 100) : 0}%` }} /></div>
                                    </div>
                                    <span className="font-mono text-sm font-black text-rose-500">{exp.total.toLocaleString()} LE</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {activeCategory === 'FINANCE' && activeSubReport === 'Profit & Loss (P&L)' && profitAndLoss && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 border border-border/50 shadow-2xl">
                           <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Revenue</p>
                           <h3 className="text-4xl font-black text-emerald-500">{profitAndLoss.revenue.toLocaleString()} <span className="text-sm">LE</span></h3>
                        </div>
                        <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 border border-border/50 shadow-2xl">
                           <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Expenses</p>
                           <h3 className="text-4xl font-black text-rose-500">{profitAndLoss.expenses.toLocaleString()} <span className="text-sm">LE</span></h3>
                        </div>
                        <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 border border-border/50 shadow-2xl">
                           <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Net Profit</p>
                           <h3 className={`text-4xl font-black ${profitAndLoss.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{profitAndLoss.netProfit.toLocaleString()} <span className="text-sm">LE</span></h3>
                        </div>
                     </div>
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="responsive-table">
                           <table className="w-full text-left border-collapse">
                              <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                 <th className="px-8 py-5">Account</th><th className="px-6 py-5">Type</th><th className="px-6 py-5 text-right">Debit</th><th className="px-6 py-5 text-right">Credit</th><th className="px-8 py-5 text-right">Net</th>
                              </tr></thead>
                              <tbody className="divide-y divide-border/30">
                                 {profitAndLoss.details.map((d, idx) => (
                                    <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                       <td className="px-8 py-4 text-xs font-black text-main uppercase">{d.name}</td>
                                       <td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${d.type === 'REVENUE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{d.type}</span></td>
                                       <td className="px-6 py-4 font-mono text-sm text-right">{d.debit.toLocaleString()}</td>
                                       <td className="px-6 py-4 font-mono text-sm text-right">{d.credit.toLocaleString()}</td>
                                       <td className={`px-8 py-4 font-mono text-sm font-black text-right ${d.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{d.net.toLocaleString()}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               )}

               {activeCategory === 'INVENTORY' && activeSubReport === 'Stock Movement' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-elevated/30">
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter flex items-center gap-4">
                              <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 text-cyan-500"><Box size={24} /></div>
                              Stock Movement Log <span className="text-sm text-muted font-bold ml-2">({stockMovementLog.length} entries)</span>
                           </h3>
                        </div>
                        {stockMovementLog.length === 0 ? (
                           <div className="p-16 text-center text-muted text-xs font-black uppercase tracking-widest">No stock movements found for this period</div>
                        ) : (
                           <div className="responsive-table">
                              <table className="w-full text-left border-collapse">
                                 <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-5">Item</th><th className="px-6 py-5">Type</th><th className="px-6 py-5 text-right">Qty</th><th className="px-6 py-5 text-right">Cost</th><th className="px-6 py-5">Reason</th><th className="px-8 py-5">Date</th>
                                 </tr></thead>
                                 <tbody className="divide-y divide-border/30">
                                    {stockMovementLog.slice(0, 100).map((row, idx) => (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                          <td className="px-8 py-4 text-xs font-black text-main uppercase">{row.itemName}</td>
                                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${row.type === 'PURCHASE' ? 'bg-emerald-500/10 text-emerald-500' : row.type === 'WASTE' ? 'bg-rose-500/10 text-rose-500' : row.type === 'TRANSFER' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'}`}>{row.type}</span></td>
                                          <td className="px-6 py-4 font-mono text-sm font-bold text-right">{row.quantity}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{Number(row.totalCost || 0).toLocaleString()} LE</td>
                                          <td className="px-6 py-4 text-xs text-muted">{row.reason || '—'}</td>
                                          <td className="px-8 py-4 text-xs text-muted">{new Date(row.createdAt).toLocaleDateString()}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {activeCategory === 'INVENTORY' && activeSubReport === 'Waste/Loss Log' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     {wasteLoss && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 border border-rose-500/20 shadow-2xl">
                              <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Waste Cost</p>
                              <h3 className="text-4xl font-black text-rose-500">{wasteLoss.totalWasteCost.toLocaleString()} <span className="text-sm">LE</span></h3>
                           </div>
                           <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 border border-border/50 shadow-2xl">
                              <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Waste Incidents</p>
                              <h3 className="text-4xl font-black text-amber-500">{wasteLoss.count}</h3>
                           </div>
                        </div>
                     )}
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="responsive-table">
                           <table className="w-full text-left border-collapse">
                              <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                 <th className="px-8 py-5">Item</th><th className="px-6 py-5">Unit</th><th className="px-6 py-5 text-right">Qty</th><th className="px-6 py-5 text-right">Cost</th><th className="px-6 py-5">Reason</th><th className="px-8 py-5">Date</th>
                              </tr></thead>
                              <tbody className="divide-y divide-border/30">
                                 {(wasteLoss?.items || []).map((row: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                       <td className="px-8 py-4 text-xs font-black text-main uppercase">{row.itemName}</td>
                                       <td className="px-6 py-4 text-xs text-muted uppercase">{row.unit}</td>
                                       <td className="px-6 py-4 font-mono text-sm font-bold text-rose-500 text-right">{row.quantity}</td>
                                       <td className="px-6 py-4 font-mono text-sm text-right">{Number(row.totalCost || 0).toLocaleString()} LE</td>
                                       <td className="px-6 py-4 text-xs text-muted">{row.reason || '—'}</td>
                                       <td className="px-8 py-4 text-xs text-muted">{new Date(row.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               )}

               {activeCategory === 'INVENTORY' && activeSubReport === 'Reorder Alerts' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-amber-500/20 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-amber-500/5">
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter flex items-center gap-4">
                              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 text-amber-500"><Zap size={24} /></div>
                              Reorder Alerts <span className="text-sm text-amber-500 font-bold ml-2">({reorderAlerts.length} items below threshold)</span>
                           </h3>
                        </div>
                        {reorderAlerts.length === 0 ? (
                           <div className="p-16 text-center text-emerald-500 text-xs font-black uppercase tracking-widest">✓ All items are above reorder thresholds</div>
                        ) : (
                           <div className="responsive-table">
                              <table className="w-full text-left border-collapse">
                                 <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-5">Item</th><th className="px-6 py-5">Unit</th><th className="px-6 py-5 text-right">Current Stock</th><th className="px-6 py-5 text-right">Threshold</th><th className="px-6 py-5 text-right">Deficit</th><th className="px-8 py-5 text-right">Urgency</th>
                                 </tr></thead>
                                 <tbody className="divide-y divide-border/30">
                                    {reorderAlerts.map((row, idx) => (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                          <td className="px-8 py-4 text-xs font-black text-main uppercase">{row.itemName}</td>
                                          <td className="px-6 py-4 text-xs text-muted uppercase">{row.unit}</td>
                                          <td className="px-6 py-4 font-mono text-sm font-bold text-rose-500 text-right">{row.currentStock}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{row.threshold}</td>
                                          <td className="px-6 py-4 font-mono text-sm font-black text-rose-500 text-right">-{row.deficit}</td>
                                          <td className="px-8 py-4 text-right">
                                             <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block ${row.currentStock <= 0 ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-amber-500/10 text-amber-500'}`}>{row.currentStock <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'}</span>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {activeCategory === 'INVENTORY' && activeSubReport === 'Expiring Batches' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     {expiringBatches && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 border border-border/50 shadow-2xl">
                              <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">At-Risk Batches</p>
                              <h3 className="text-4xl font-black text-amber-500">{expiringBatches.totalBatches}</h3>
                           </div>
                           <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 border border-rose-500/20 shadow-2xl">
                              <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Already Expired</p>
                              <h3 className="text-4xl font-black text-rose-500">{expiringBatches.alreadyExpired}</h3>
                           </div>
                           <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 border border-border/50 shadow-2xl">
                              <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">At-Risk Value</p>
                              <h3 className="text-4xl font-black text-rose-500">{expiringBatches.totalAtRiskValue.toLocaleString()} <span className="text-sm">LE</span></h3>
                           </div>
                        </div>
                     )}
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="responsive-table">
                           <table className="w-full text-left border-collapse">
                              <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                 <th className="px-8 py-5">Item</th><th className="px-6 py-5">Batch #</th><th className="px-6 py-5 text-right">Qty</th><th className="px-6 py-5 text-right">Value</th><th className="px-6 py-5">Expiry</th><th className="px-8 py-5 text-right">Status</th>
                              </tr></thead>
                              <tbody className="divide-y divide-border/30">
                                 {(expiringBatches?.items || []).map((batch: any, idx: number) => {
                                    const isExpired = new Date(batch.expiryDate) <= new Date();
                                    return (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                          <td className="px-8 py-4 text-xs font-black text-main uppercase">{batch.itemName}</td>
                                          <td className="px-6 py-4 font-mono text-xs text-indigo-500">{batch.batchNumber}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{batch.currentQty} {batch.unit}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{(batch.currentQty * batch.unitCost).toLocaleString()} LE</td>
                                          <td className="px-6 py-4 text-xs font-bold">{new Date(batch.expiryDate).toLocaleDateString()}</td>
                                          <td className="px-8 py-4 text-right"><span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block ${isExpired ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-amber-500/10 text-amber-500'}`}>{isExpired ? 'EXPIRED' : 'EXPIRING SOON'}</span></td>
                                       </tr>
                                    );
                                 })}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               )}

               {activeCategory === 'HR' && activeSubReport === 'Payroll Summary' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     {payrollData && (
                        <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 border border-border/50 shadow-2xl">
                           <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Payroll</p>
                           <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">{payrollData.totalPayroll.toLocaleString()} <span className="text-sm">LE</span></h3>
                        </div>
                     )}
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-elevated/30">
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter">Employee Payouts</h3>
                        </div>
                        {(!payrollData || payrollData.payouts.length === 0) ? (
                           <div className="p-16 text-center text-muted text-xs font-black uppercase tracking-widest">No payroll data found for this period</div>
                        ) : (
                           <div className="responsive-table">
                              <table className="w-full text-left border-collapse">
                                 <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-5">Employee</th><th className="px-6 py-5">Role</th><th className="px-6 py-5 text-right">Basic</th><th className="px-6 py-5 text-right">Overtime</th><th className="px-6 py-5 text-right">Deductions</th><th className="px-8 py-5 text-right">Net Pay</th>
                                 </tr></thead>
                                 <tbody className="divide-y divide-border/30">
                                    {payrollData.payouts.map((p: any, idx: number) => (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                          <td className="px-8 py-4 text-xs font-black text-main uppercase">{p.employeeName}</td>
                                          <td className="px-6 py-4 text-xs text-muted uppercase">{p.role}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{Number(p.basicSalary).toLocaleString()}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-emerald-500 text-right">+{Number(p.overtime || 0).toLocaleString()}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-rose-500 text-right">-{Number(p.deductions || 0).toLocaleString()}</td>
                                          <td className="px-8 py-4 font-mono text-sm font-black text-main text-right">{Number(p.netPay).toLocaleString()} LE</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {activeCategory === 'HR' && activeSubReport === 'Attendance & Delays' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-elevated/30">
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-500"><Clock size={24} /></div>
                              Attendance Report
                           </h3>
                        </div>
                        {attendanceData.length === 0 ? (
                           <div className="p-16 text-center text-muted text-xs font-black uppercase tracking-widest">No attendance data found for this period</div>
                        ) : (
                           <div className="responsive-table">
                              <table className="w-full text-left border-collapse">
                                 <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-5">Employee</th><th className="px-6 py-5">Role</th><th className="px-6 py-5 text-center">Present</th><th className="px-6 py-5 text-center">Late</th><th className="px-6 py-5 text-center">Absent</th><th className="px-6 py-5 text-center">Sick</th><th className="px-6 py-5 text-right">Total Hours</th><th className="px-8 py-5 text-right">Avg/Day</th>
                                 </tr></thead>
                                 <tbody className="divide-y divide-border/30">
                                    {attendanceData.map((row, idx) => (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                          <td className="px-8 py-4 text-xs font-black text-main uppercase">{row.employeeName}</td>
                                          <td className="px-6 py-4 text-xs text-muted uppercase">{row.role}</td>
                                          <td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-black">{row.presentDays}</span></td>
                                          <td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-black">{row.lateDays}</span></td>
                                          <td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-xs font-black">{row.absentDays}</span></td>
                                          <td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-black">{row.sickDays}</span></td>
                                          <td className="px-6 py-4 font-mono text-sm font-bold text-right">{row.totalHours}h</td>
                                          <td className="px-8 py-4 font-mono text-sm text-right">{row.avgHoursPerDay}h</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {activeCategory === 'HR' && activeSubReport === 'Overtime Report' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-elevated/30">
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter flex items-center gap-4">
                              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 text-amber-500"><Clock size={24} /></div>
                              Overtime Report <span className="text-sm text-muted font-bold ml-2">(1.5x rate)</span>
                           </h3>
                        </div>
                        {overtimeData.length === 0 ? (
                           <div className="p-16 text-center text-muted text-xs font-black uppercase tracking-widest">No overtime recorded for this period</div>
                        ) : (
                           <div className="responsive-table">
                              <table className="w-full text-left border-collapse">
                                 <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-5">Employee</th><th className="px-6 py-5">Role</th><th className="px-6 py-5 text-right">Work Days</th><th className="px-6 py-5 text-right">Total Hours</th><th className="px-6 py-5 text-right">Overtime Hours</th><th className="px-8 py-5 text-right">OT Cost</th>
                                 </tr></thead>
                                 <tbody className="divide-y divide-border/30">
                                    {overtimeData.map((row, idx) => (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                          <td className="px-8 py-4 text-xs font-black text-main uppercase">{row.employeeName}</td>
                                          <td className="px-6 py-4 text-xs text-muted uppercase">{row.role}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{row.workDays}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{row.totalHours}h</td>
                                          <td className="px-6 py-4 font-mono text-sm font-black text-amber-500 text-right">{row.overtimeHours}h</td>
                                          <td className="px-8 py-4 font-mono text-sm font-black text-rose-500 text-right">{row.overtimeCost.toLocaleString()} LE</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {activeCategory === 'CRM' && activeSubReport === 'Customer LTV' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-elevated/30">
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter flex items-center gap-4">
                              <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20 text-violet-500"><Users size={24} /></div>
                              Customer Lifetime Value
                           </h3>
                        </div>
                        {customerLTV.length === 0 ? (
                           <div className="p-16 text-center text-muted text-xs font-black uppercase tracking-widest">No customer orders found for this period</div>
                        ) : (
                           <div className="responsive-table">
                              <table className="w-full text-left border-collapse">
                                 <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-5">#</th><th className="px-6 py-5">Customer</th><th className="px-6 py-5">Phone</th><th className="px-6 py-5 text-right">Orders</th><th className="px-6 py-5 text-right">Avg Ticket</th><th className="px-8 py-5 text-right">Total Spent</th>
                                 </tr></thead>
                                 <tbody className="divide-y divide-border/30">
                                    {customerLTV.map((c, idx) => (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors group">
                                          <td className="px-8 py-4 text-xs font-black text-muted">{idx + 1}</td>
                                          <td className="px-6 py-4 text-xs font-black text-main uppercase group-hover:text-indigo-500 transition-colors">{c.customerName}</td>
                                          <td className="px-6 py-4 font-mono text-xs text-muted">{c.phone}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{c.orderCount}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{c.avgTicket.toLocaleString()} LE</td>
                                          <td className="px-8 py-4 font-mono text-sm font-black text-emerald-500 text-right">{c.totalSpent.toLocaleString()} LE</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {activeCategory === 'CRM' && activeSubReport === 'Campaign ROI' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-elevated/30">
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter flex items-center gap-4">
                              <div className="w-12 h-12 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center border border-fuchsia-500/20 text-fuchsia-500"><Megaphone size={24} /></div>
                              Campaign ROI
                           </h3>
                        </div>
                        {campaignROI.length === 0 ? (
                           <div className="p-16 text-center text-muted text-xs font-black uppercase tracking-widest">No campaigns found</div>
                        ) : (
                           <div className="responsive-table">
                              <table className="w-full text-left border-collapse">
                                 <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-5">Campaign</th><th className="px-6 py-5">Type</th><th className="px-6 py-5">Status</th><th className="px-6 py-5 text-right">Reach</th><th className="px-6 py-5 text-right">Conv. %</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-8 py-5 text-right">ROI %</th>
                                 </tr></thead>
                                 <tbody className="divide-y divide-border/30">
                                    {campaignROI.map((c, idx) => (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                          <td className="px-8 py-4 text-xs font-black text-main uppercase">{c.name}</td>
                                          <td className="px-6 py-4"><span className="px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[9px] font-black uppercase">{c.type}</span></td>
                                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${c.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : c.status === 'ACTIVE' ? 'bg-cyan-500/10 text-cyan-500' : 'bg-slate-500/10 text-slate-500'}`}>{c.status}</span></td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{c.reach.toLocaleString()}</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{c.conversionRate}%</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{c.revenue.toLocaleString()} LE</td>
                                          <td className={`px-8 py-4 font-mono text-sm font-black text-right ${c.roi >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{c.roi > 0 ? '+' : ''}{c.roi}%</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {activeCategory === 'OPS' && activeSubReport === 'Branch Performance' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-elevated/30">
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-500"><Activity size={24} /></div>
                              Branch Performance
                           </h3>
                        </div>
                        {branchPerformance.length === 0 ? (
                           <div className="p-16 text-center text-muted text-xs font-black uppercase tracking-widest">No branch data found for this period</div>
                        ) : (
                           <div className="responsive-table">
                              <table className="w-full text-left border-collapse">
                                 <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-5">Branch</th><th className="px-6 py-5 text-right">Orders</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-6 py-5 text-right">Avg Ticket</th><th className="px-8 py-5 text-right">Cancelled</th>
                                 </tr></thead>
                                 <tbody className="divide-y divide-border/30">
                                    {branchPerformance.map((b, idx) => (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                          <td className="px-8 py-4 text-xs font-black text-main uppercase">{b.branchName}</td>
                                          <td className="px-6 py-4 font-mono text-sm font-bold text-right">{b.orderCount}</td>
                                          <td className="px-6 py-4 font-mono text-sm font-black text-emerald-500 text-right">{b.revenue.toLocaleString()} LE</td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{b.avgTicket.toLocaleString()} LE</td>
                                          <td className="px-8 py-4 font-mono text-sm text-rose-500 text-right">{b.cancelledCount}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {activeCategory === 'OPS' && activeSubReport === 'Order Preparation Time' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-elevated/30">
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter flex items-center gap-4">
                              <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 text-cyan-500"><Clock size={24} /></div>
                              Order Preparation Time
                           </h3>
                        </div>
                        {orderPrepTime.length === 0 ? (
                           <div className="p-16 text-center text-muted text-xs font-black uppercase tracking-widest">No completed orders with prep time data found</div>
                        ) : (
                           <div className="responsive-table">
                              <table className="w-full text-left border-collapse">
                                 <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-5">Branch</th><th className="px-6 py-5">Order Type</th><th className="px-6 py-5 text-right">Orders</th><th className="px-6 py-5 text-right">Avg (min)</th><th className="px-6 py-5 text-right">Min</th><th className="px-8 py-5 text-right">Max</th>
                                 </tr></thead>
                                 <tbody className="divide-y divide-border/30">
                                    {orderPrepTime.map((row, idx) => (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                          <td className="px-8 py-4 text-xs font-black text-main uppercase">{row.branchName}</td>
                                          <td className="px-6 py-4"><span className="px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[9px] font-black uppercase">{row.orderType}</span></td>
                                          <td className="px-6 py-4 font-mono text-sm text-right">{row.orderCount}</td>
                                          <td className="px-6 py-4 font-mono text-sm font-black text-right">{row.avgPrepMinutes} min</td>
                                          <td className="px-6 py-4 font-mono text-sm text-emerald-500 text-right">{row.minPrepMinutes} min</td>
                                          <td className="px-8 py-4 font-mono text-sm text-rose-500 text-right">{row.maxPrepMinutes} min</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {/* ============ EXTENDED SALES REPORTS ============ */}

               {activeCategory === 'SALES' && activeSubReport === 'Sales by Order Type' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {salesByOrderType.map((row, idx) => (
                           <div key={idx} className="card-primary rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
                              <div className="flex items-center gap-3 mb-4">
                                 <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${row.orderType === 'DINE_IN' ? 'bg-blue-500/10 text-blue-500' : row.orderType === 'DELIVERY' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    {row.orderType === 'DINE_IN' ? '🍽️ Dine-In' : row.orderType === 'DELIVERY' ? '🚗 Delivery' : row.orderType === 'TAKEAWAY' ? '📦 Takeaway' : row.orderType}
                                 </span>
                                 <span className="text-xs font-black text-slate-400">{row.percentage}%</span>
                              </div>
                              <p className="text-3xl font-black text-main">{row.revenue.toLocaleString()} <span className="text-xs font-bold text-muted">LE</span></p>
                              <div className="mt-3 w-full bg-elevated/50 rounded-full h-2"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${row.percentage}%` }} /></div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 text-xs text-muted">
                                 <span>Orders: <b className="text-main">{row.orderCount}</b></span>
                                 <span>Avg Ticket: <b className="text-main">{row.avgTicket} LE</b></span>
                                 <span>Tax: <b className="text-main">{row.totalTax.toLocaleString()} LE</b></span>
                                 <span>Discounts: <b className="text-rose-500">{row.totalDiscount.toLocaleString()} LE</b></span>
                              </div>
                           </div>
                        ))}
                     </div>
                     {salesByOrderType.length === 0 && <p className="text-center text-muted py-16">No sales data for this period.</p>}
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Sales by Item' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                           <h3 className="text-xl font-black text-main">Sales by Item — Top 100</h3>
                           <p className="text-xs text-muted mt-1">Ranked by revenue</p>
                        </div>
                        <div className="responsive-table">
                           <table className="w-full text-xs">
                              <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                 <th className="px-8 py-5 text-left">#</th><th className="px-6 py-5 text-left">Item</th><th className="px-6 py-5 text-right">Qty Sold</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-6 py-5 text-right">Cost</th><th className="px-6 py-5 text-right">Profit</th><th className="px-8 py-5 text-right">Margin %</th>
                              </tr></thead>
                              <tbody className="divide-y divide-border/30">
                                 {salesByItem.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                       <td className="px-8 py-4 font-mono text-muted">{idx + 1}</td>
                                       <td className="px-6 py-4 text-xs font-black text-main">{row.itemName}</td>
                                       <td className="px-6 py-4 font-mono text-right">{row.qtySold}</td>
                                       <td className="px-6 py-4 font-mono font-bold text-right">{row.revenue.toLocaleString()}</td>
                                       <td className="px-6 py-4 font-mono text-muted text-right">{row.cost.toLocaleString()}</td>
                                       <td className="px-6 py-4 font-mono text-emerald-500 text-right">{row.profit.toLocaleString()}</td>
                                       <td className="px-8 py-4 text-right"><span className={`px-2 py-1 rounded-lg text-[9px] font-black ${row.marginPercent >= 50 ? 'bg-emerald-500/10 text-emerald-500' : row.marginPercent >= 30 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>{row.marginPercent}%</span></td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                        {salesByItem.length === 0 && <p className="text-center text-muted py-16">No item data available.</p>}
                     </div>
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Sales by Category' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                           <h3 className="text-xl font-black text-main">Sales by Category / Department</h3>
                        </div>
                        <div className="responsive-table">
                           <table className="w-full text-xs">
                              <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                 <th className="px-8 py-5 text-left">Category</th><th className="px-6 py-5 text-right">Items</th><th className="px-6 py-5 text-right">Qty Sold</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-6 py-5 text-right">Cost</th><th className="px-6 py-5 text-right">Profit</th><th className="px-8 py-5 text-right">Share %</th>
                              </tr></thead>
                              <tbody className="divide-y divide-border/30">
                                 {salesByCategory.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                       <td className="px-8 py-4 text-xs font-black text-main">{row.categoryName}</td>
                                       <td className="px-6 py-4 font-mono text-right">{row.itemCount}</td>
                                       <td className="px-6 py-4 font-mono text-right">{row.qtySold}</td>
                                       <td className="px-6 py-4 font-mono font-bold text-right">{row.revenue.toLocaleString()}</td>
                                       <td className="px-6 py-4 font-mono text-muted text-right">{row.cost.toLocaleString()}</td>
                                       <td className="px-6 py-4 font-mono text-emerald-500 text-right">{row.profit.toLocaleString()}</td>
                                       <td className="px-8 py-4 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                             <div className="w-16 bg-elevated/50 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${row.percentage}%` }} /></div>
                                             <span className="text-[10px] font-black w-8 text-right">{row.percentage}%</span>
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                        {salesByCategory.length === 0 && <p className="text-center text-muted py-16">No category data available.</p>}
                     </div>
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Discounts' && discountAnalysis && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[{ label: 'Total Discounts', value: `${discountAnalysis.summary.totalDiscount.toLocaleString()} LE`, sub: `${discountAnalysis.summary.totalDiscountedOrders} orders` },
                        { label: 'Discount Rate', value: `${discountAnalysis.summary.discountRate}%`, sub: `of ${discountAnalysis.summary.totalOrders} orders` },
                        { label: 'Avg Discount', value: `${discountAnalysis.summary.avgDiscount} LE`, sub: 'per discounted order' },
                        { label: 'Max Discount', value: `${discountAnalysis.summary.maxDiscount} LE`, sub: 'single order' },
                        ].map((card, idx) => (
                           <div key={idx} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted">{card.label}</p>
                              <p className="text-2xl font-black text-main mt-1">{card.value}</p>
                              <p className="text-[10px] text-muted mt-1">{card.sub}</p>
                           </div>
                        ))}
                     </div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Discounts by Reason</h3></div>
                        <div className="responsive-table">
                           <table className="w-full text-xs">
                              <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                 <th className="px-8 py-5 text-left">Reason</th><th className="px-6 py-5 text-right">Orders</th><th className="px-6 py-5 text-right">Total</th><th className="px-8 py-5 text-right">Avg</th>
                              </tr></thead>
                              <tbody className="divide-y divide-border/30">
                                 {discountAnalysis.byReason.map((row: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                       <td className="px-8 py-4 text-xs font-black text-main">{row.reason}</td>
                                       <td className="px-6 py-4 font-mono text-right">{row.orderCount}</td>
                                       <td className="px-6 py-4 font-mono font-bold text-rose-500 text-right">{row.totalDiscount.toLocaleString()} LE</td>
                                       <td className="px-8 py-4 font-mono text-muted text-right">{row.avgDiscount} LE</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               )}
               {activeCategory === 'SALES' && activeSubReport === 'Discounts' && !discountAnalysis && (
                  <p className="text-center text-muted py-16">No discount data available.</p>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Cancelled Orders' && cancelledOrders && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[{ label: 'Cancelled Orders', value: cancelledOrders.summary.cancelledCount, color: 'text-rose-500' },
                        { label: 'Lost Revenue', value: `${cancelledOrders.summary.cancelledTotal.toLocaleString()} LE`, color: 'text-rose-500' },
                        { label: 'Cancel Rate', value: `${cancelledOrders.summary.cancelRate}%`, color: 'text-amber-500' },
                        { label: 'Total Orders', value: cancelledOrders.summary.totalOrders, color: 'text-main' },
                        ].map((card, idx) => (
                           <div key={idx} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted">{card.label}</p>
                              <p className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</p>
                           </div>
                        ))}
                     </div>
                     {cancelledOrders.byReason.length > 0 && (
                        <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                           <div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">By Reason</h3></div>
                           <div className="divide-y divide-border/30">
                              {cancelledOrders.byReason.map((r: any, idx: number) => (
                                 <div key={idx} className="flex items-center justify-between px-8 py-4">
                                    <span className="text-xs font-black text-main">{r.reason}</span>
                                    <div className="flex gap-6 text-xs">
                                       <span className="font-mono">{r.count} orders</span>
                                       <span className="font-mono text-rose-500">{r.total.toLocaleString()} LE</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Cancelled Order Log</h3></div>
                        <div className="responsive-table">
                           <table className="w-full text-xs">
                              <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                 <th className="px-8 py-5 text-left">#</th><th className="px-6 py-5 text-left">Type</th><th className="px-6 py-5 text-left">Customer</th><th className="px-6 py-5 text-right">Total</th><th className="px-6 py-5 text-left">Reason</th><th className="px-8 py-5 text-right">When</th>
                              </tr></thead>
                              <tbody className="divide-y divide-border/30">
                                 {cancelledOrders.orders.map((row: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                       <td className="px-8 py-4 font-mono text-muted">{row.orderNumber}</td>
                                       <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-500/10 rounded-lg text-[9px] font-black uppercase">{row.type}</span></td>
                                       <td className="px-6 py-4 text-xs">{row.customerName || '—'}</td>
                                       <td className="px-6 py-4 font-mono font-bold text-rose-500 text-right">{row.total.toLocaleString()} LE</td>
                                       <td className="px-6 py-4 text-xs text-muted">{row.cancelReason || '—'}</td>
                                       <td className="px-8 py-4 font-mono text-[10px] text-muted text-right">{row.cancelledAt ? new Date(row.cancelledAt).toLocaleString() : '—'}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               )}
               {activeCategory === 'SALES' && activeSubReport === 'Cancelled Orders' && !cancelledOrders && (
                  <p className="text-center text-muted py-16">No cancelled orders data.</p>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Sales by Source' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {salesBySource.map((row, idx) => (
                           <div key={idx} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
                              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-500">{row.source}</span>
                              <p className="text-2xl font-black text-main mt-3">{row.revenue.toLocaleString()} <span className="text-xs text-muted">LE</span></p>
                              <div className="flex gap-4 mt-2 text-xs text-muted">
                                 <span>{row.orderCount} orders</span>
                                 <span>Avg {row.avgTicket} LE</span>
                                 <span className="font-black">{row.percentage}%</span>
                              </div>
                              <div className="mt-2 w-full bg-elevated/50 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${row.percentage}%` }} /></div>
                           </div>
                        ))}
                     </div>
                     {salesBySource.length === 0 && <p className="text-center text-muted py-16">No source data available.</p>}
                  </div>
               )}

               {activeCategory === 'OPS' && activeSubReport === 'Delivery Performance' && deliveryPerformance && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[{ label: 'Delivery Orders', value: deliveryPerformance.summary.orderCount },
                        { label: 'Revenue', value: `${deliveryPerformance.summary.revenue.toLocaleString()} LE` },
                        { label: 'Avg Ticket', value: `${deliveryPerformance.summary.avgTicket} LE` },
                        { label: 'Delivery Fees', value: `${deliveryPerformance.summary.totalDeliveryFees.toLocaleString()} LE` },
                        { label: 'Free Deliveries', value: deliveryPerformance.summary.freeDeliveryCount },
                        { label: 'Avg Delivery Time', value: `${deliveryPerformance.summary.avgDeliveryMinutes} min` },
                        ].map((card, idx) => (
                           <div key={idx} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted">{card.label}</p>
                              <p className="text-2xl font-black text-main mt-1">{card.value}</p>
                           </div>
                        ))}
                     </div>
                     {deliveryPerformance.byDriver.length > 0 && (
                        <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                           <div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">By Driver</h3></div>
                           <div className="responsive-table">
                              <table className="w-full text-xs">
                                 <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-5 text-left">Driver</th><th className="px-6 py-5 text-right">Orders</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-8 py-5 text-right">Avg Time</th>
                                 </tr></thead>
                                 <tbody className="divide-y divide-border/30">
                                    {deliveryPerformance.byDriver.map((d: any, idx: number) => (
                                       <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                          <td className="px-8 py-4 text-xs font-black text-main">{d.driverId}</td>
                                          <td className="px-6 py-4 font-mono text-right">{d.orderCount}</td>
                                          <td className="px-6 py-4 font-mono font-bold text-right">{d.revenue.toLocaleString()} LE</td>
                                          <td className="px-8 py-4 font-mono text-right">{d.avgDeliveryMinutes} min</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     )}
                  </div>
               )}
               {activeCategory === 'OPS' && activeSubReport === 'Delivery Performance' && !deliveryPerformance && (
                  <p className="text-center text-muted py-16">No delivery data available.</p>
               )}

               {activeCategory === 'OPS' && activeSubReport === 'Dine-in Tables' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                           <h3 className="text-xl font-black text-main">Dine-in Table Analysis</h3>
                           <p className="text-xs text-muted mt-1">Revenue and utilization per table</p>
                        </div>
                        <div className="responsive-table">
                           <table className="w-full text-xs">
                              <thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                                 <th className="px-8 py-5 text-left">Table</th><th className="px-6 py-5 text-right">Orders</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-6 py-5 text-right">Avg Ticket</th><th className="px-8 py-5 text-right">Avg Duration</th>
                              </tr></thead>
                              <tbody className="divide-y divide-border/30">
                                 {dineInTables.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                                       <td className="px-8 py-4 text-xs font-black text-main">Table {row.tableId}</td>
                                       <td className="px-6 py-4 font-mono text-right">{row.orderCount}</td>
                                       <td className="px-6 py-4 font-mono font-bold text-right">{row.revenue.toLocaleString()} LE</td>
                                       <td className="px-6 py-4 font-mono text-right">{row.avgTicket} LE</td>
                                       <td className="px-8 py-4 font-mono text-right">{row.avgDurationMinutes} min</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                        {dineInTables.length === 0 && <p className="text-center text-muted py-16">No dine-in data available.</p>}
                     </div>
                  </div>
               )}

               {/* ============ ADVANCED SALES ANALYTICS ============ */}

               {activeCategory === 'SALES' && activeSubReport === 'Peak Hours Heatmap' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-8">
                        <h3 className="text-xl font-black text-main mb-6">Peak Hours Heatmap</h3>
                        <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-0.5 text-[8px]">
                           <div />{Array.from({ length: 24 }).map((_, h) => <div key={h} className="text-center text-muted font-black">{h}:00</div>)}
                           {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, di) => (<React.Fragment key={di}><div className="text-right pr-2 text-muted font-black flex items-center">{day}</div>{Array.from({ length: 24 }).map((_, h) => { const cell = peakHoursData.find(c => c.dayOfWeek === di && c.hour === h); const maxOC = Math.max(...peakHoursData.map(c => c.orderCount), 1); const intensity = cell ? cell.orderCount / maxOC : 0; return <div key={h} title={`${cell?.orderCount || 0} orders / ${cell?.revenue || 0} LE`} className="rounded-sm aspect-square" style={{ backgroundColor: `rgba(59,130,246,${Math.min(intensity, 1)})`, minHeight: 18 }} />; })}</React.Fragment>))}
                        </div>
                     </div>
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Modifier Sales' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Modifier / Add-on Sales</h3></div>
                        <div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Modifier</th><th className="px-6 py-5 text-right">Count</th><th className="px-8 py-5 text-right">Revenue</th></tr></thead><tbody className="divide-y divide-border/30">{modifierSalesData.map((r, i) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.name}</td><td className="px-6 py-4 font-mono text-right">{r.count}</td><td className="px-8 py-4 font-mono font-bold text-right">{r.revenue.toLocaleString()} LE</td></tr>)}</tbody></table></div>
                        {modifierSalesData.length === 0 && <p className="text-center text-muted py-16">No modifier data.</p>}
                     </div>
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Avg Ticket Trend' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Average Ticket Trend</h3></div>
                        <div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Day</th><th className="px-6 py-5 text-right">Orders</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-8 py-5 text-right">Avg Ticket</th></tr></thead><tbody className="divide-y divide-border/30">{avgTicketTrend.map((r, i) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.day}</td><td className="px-6 py-4 font-mono text-right">{r.orderCount}</td><td className="px-6 py-4 font-mono text-right">{r.revenue.toLocaleString()}</td><td className="px-8 py-4 font-mono font-bold text-right">{r.avgTicket} LE</td></tr>)}</tbody></table></div>
                        {avgTicketTrend.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                     </div>
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Sales Comparison' && salesComparisonData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['current', 'compare'].map(period => (<div key={period} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">{period === 'current' ? 'Current Period' : 'Comparison Period'}</p><p className="text-xs text-muted mb-3">{salesComparisonData[period]?.period}</p>{[{ l: 'Orders', v: salesComparisonData[period]?.orderCount }, { l: 'Revenue', v: `${salesComparisonData[period]?.revenue?.toLocaleString()} LE` }, { l: 'Avg Ticket', v: `${salesComparisonData[period]?.avgTicket} LE` }].map((c, i) => (<div key={i} className="flex justify-between py-1 text-xs"><span className="text-muted">{c.l}</span><span className="font-black text-main">{c.v}</span></div>))}</div>))}
                     </div>
                     <div className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">Change %</p><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ l: 'Orders', v: salesComparisonData.change?.orderCount }, { l: 'Revenue', v: salesComparisonData.change?.revenue }, { l: 'Avg Ticket', v: salesComparisonData.change?.avgTicket }, { l: 'Discounts', v: salesComparisonData.change?.totalDiscount }].map((c, i) => (<div key={i} className="text-center"><p className="text-[10px] text-muted">{c.l}</p><p className={`text-2xl font-black ${Number(c.v) > 0 ? 'text-emerald-500' : Number(c.v) < 0 ? 'text-rose-500' : 'text-muted'}`}>{Number(c.v) > 0 ? '+' : ''}{c.v}%</p></div>))}</div></div>
                  </div>
               )}
               {activeCategory === 'SALES' && activeSubReport === 'Sales Comparison' && !salesComparisonData && <p className="text-center text-muted py-16">No comparison data.</p>}

               {activeCategory === 'SALES' && activeSubReport === 'Slow-Moving Items' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Slow-Moving Items</h3><p className="text-xs text-muted mt-1">Items with lowest sales — consider removing or promoting</p></div>
                        <div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">#</th><th className="px-6 py-5 text-left">Item</th><th className="px-6 py-5 text-right">Qty Sold</th><th className="px-8 py-5 text-right">Revenue</th></tr></thead><tbody className="divide-y divide-border/30">{slowMovingItems.map((r, i) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 font-mono text-muted">{i + 1}</td><td className="px-6 py-4 text-xs font-black text-main">{r.itemName}</td><td className="px-6 py-4 font-mono text-right text-rose-500 font-bold">{r.qtySold}</td><td className="px-8 py-4 font-mono text-right">{r.revenue.toLocaleString()} LE</td></tr>)}</tbody></table></div>
                        {slowMovingItems.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                     </div>
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Revenue by Weekday' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-7 gap-3">
                        {revenueByWeekday.map((r, i) => { const maxRev = Math.max(...revenueByWeekday.map(d => d.revenue), 1); return <div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg text-center"><p className="text-[10px] font-black uppercase text-muted">{r.dayName}</p><p className="text-lg font-black text-main mt-1">{r.revenue.toLocaleString()}</p><p className="text-[9px] text-muted">LE</p><div className="mt-2 mx-auto w-6 bg-elevated/50 rounded-full" style={{ height: 60 }}><div className="w-6 rounded-full bg-blue-500 mt-auto" style={{ height: `${(r.revenue / maxRev) * 100}%`, marginTop: `${100 - (r.revenue / maxRev) * 100}%` }} /></div><p className="text-[9px] text-muted mt-2">{r.orderCount} orders</p><p className="text-[9px] text-muted">Avg {r.avgTicket} LE</p></div> })}
                     </div>
                     {revenueByWeekday.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Void Items Log' && voidItemsData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 gap-4"><div className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">Void Count</p><p className="text-2xl font-black text-rose-500 mt-1">{voidItemsData.summary.voidCount}</p></div><div className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">Lost Revenue</p><p className="text-2xl font-black text-rose-500 mt-1">{voidItemsData.summary.voidTotal.toLocaleString()} LE</p></div></div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Voided Items Log</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Order #</th><th className="px-6 py-5 text-left">Item</th><th className="px-6 py-5 text-right">Qty</th><th className="px-6 py-5 text-right">Total</th><th className="px-8 py-5 text-right">When</th></tr></thead><tbody className="divide-y divide-border/30">{voidItemsData.items.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 font-mono text-muted">{r.orderNumber}</td><td className="px-6 py-4 text-xs font-black text-main">{r.itemName}</td><td className="px-6 py-4 font-mono text-right">{r.quantity}</td><td className="px-6 py-4 font-mono font-bold text-rose-500 text-right">{r.total} LE</td><td className="px-8 py-4 font-mono text-[10px] text-muted text-right">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'SALES' && activeSubReport === 'Void Items Log' && !voidItemsData && <p className="text-center text-muted py-16">No void data.</p>}

               {/* ============ ADVANCED FINANCE ============ */}

               {activeCategory === 'FINANCE' && activeSubReport === 'Tips Report' && tipsData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ l: 'Total Tips', v: `${tipsData.summary.totalTips.toLocaleString()} LE` }, { l: 'Tipped Orders', v: tipsData.summary.orderCount }, { l: 'Avg Tip', v: `${tipsData.summary.avgTip} LE` }, { l: 'Max Tip', v: `${tipsData.summary.maxTip} LE` }].map((c, i) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className="text-2xl font-black text-main mt-1">{c.v}</p></div>))}</div>
                     {tipsData.byType.length > 0 && <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Tips by Order Type</h3></div><div className="divide-y divide-border/30">{tipsData.byType.map((r: any, i: number) => (<div key={i} className="flex items-center justify-between px-8 py-4"><span className="text-xs font-black text-main">{r.orderType}</span><div className="flex gap-6 text-xs"><span className="font-mono">{r.count} orders</span><span className="font-mono font-bold text-emerald-500">{r.totalTips.toLocaleString()} LE</span></div></div>))}</div></div>}
                  </div>
               )}
               {activeCategory === 'FINANCE' && activeSubReport === 'Tips Report' && !tipsData && <p className="text-center text-muted py-16">No tips data.</p>}

               {activeCategory === 'FINANCE' && activeSubReport === 'Service Charge' && serviceChargeData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-3 gap-4">{[{ l: 'Total Service Charge', v: `${serviceChargeData.summary.totalServiceCharge.toLocaleString()} LE` }, { l: 'Orders with SC', v: serviceChargeData.summary.orderCount }, { l: 'Avg SC', v: `${serviceChargeData.summary.avgServiceCharge} LE` }].map((c, i) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className="text-2xl font-black text-main mt-1">{c.v}</p></div>))}</div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Daily Breakdown</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Day</th><th className="px-6 py-5 text-right">Orders</th><th className="px-8 py-5 text-right">Total SC</th></tr></thead><tbody className="divide-y divide-border/30">{serviceChargeData.daily.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.day}</td><td className="px-6 py-4 font-mono text-right">{r.count}</td><td className="px-8 py-4 font-mono font-bold text-right">{r.totalServiceCharge.toLocaleString()} LE</td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'FINANCE' && activeSubReport === 'Service Charge' && !serviceChargeData && <p className="text-center text-muted py-16">No service charge data.</p>}

               {activeCategory === 'FINANCE' && activeSubReport === 'Shift Summary' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Shift Summary / Cash Drawer</h3></div>
                        <div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Open</th><th className="px-4 py-5 text-left">Close</th><th className="px-4 py-5 text-left">Status</th><th className="px-4 py-5 text-right">Orders</th><th className="px-4 py-5 text-right">Revenue</th><th className="px-4 py-5 text-right">Opening</th><th className="px-4 py-5 text-right">Expected</th><th className="px-4 py-5 text-right">Actual</th><th className="px-6 py-5 text-right">Variance</th></tr></thead><tbody className="divide-y divide-border/30">{shiftSummaryData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 font-mono text-[10px]">{r.openingTime ? new Date(r.openingTime).toLocaleString() : '—'}</td><td className="px-4 py-4 font-mono text-[10px]">{r.closingTime ? new Date(r.closingTime).toLocaleString() : '—'}</td><td className="px-4 py-4"><span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${r.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{r.status}</span></td><td className="px-4 py-4 font-mono text-right">{r.orderCount}</td><td className="px-4 py-4 font-mono font-bold text-right">{r.revenue.toLocaleString()}</td><td className="px-4 py-4 font-mono text-right text-muted">{r.openingBalance}</td><td className="px-4 py-4 font-mono text-right">{r.expectedBalance}</td><td className="px-4 py-4 font-mono text-right">{r.actualBalance}</td><td className={`px-6 py-4 font-mono font-bold text-right ${r.variance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{r.variance >= 0 ? '+' : ''}{r.variance} LE</td></tr>)}</tbody></table></div>
                        {shiftSummaryData.length === 0 && <p className="text-center text-muted py-16">No shifts found.</p>}
                     </div>
                  </div>
               )}

               {/* ============ ADVANCED INVENTORY ============ */}

               {activeCategory === 'INVENTORY' && activeSubReport === 'Actual vs Theoretical' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Actual vs Theoretical Consumption</h3><p className="text-xs text-muted mt-1">Compares recipe-based expected usage with actual stock movements</p></div>
                        <div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Item</th><th className="px-4 py-5 text-left">Unit</th><th className="px-4 py-5 text-right">Theoretical</th><th className="px-4 py-5 text-right">Actual</th><th className="px-4 py-5 text-right">Variance</th><th className="px-6 py-5 text-right">Var %</th></tr></thead><tbody className="divide-y divide-border/30">{actualVsTheoreticalData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.itemName}</td><td className="px-4 py-4 text-muted text-xs">{r.unit}</td><td className="px-4 py-4 font-mono text-right">{r.theoreticalQty}</td><td className="px-4 py-4 font-mono text-right">{r.actualQty}</td><td className={`px-4 py-4 font-mono font-bold text-right ${r.variance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{r.variance > 0 ? '+' : ''}{r.variance}</td><td className="px-6 py-4 text-right"><span className={`px-2 py-1 rounded-lg text-[9px] font-black ${Math.abs(r.variancePercent) > 10 ? 'bg-rose-500/10 text-rose-500' : Math.abs(r.variancePercent) > 5 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{r.variancePercent > 0 ? '+' : ''}{r.variancePercent}%</span></td></tr>)}</tbody></table></div>
                        {actualVsTheoreticalData.length === 0 && <p className="text-center text-muted py-16">No recipe data to compare.</p>}
                     </div>
                  </div>
               )}

               {activeCategory === 'INVENTORY' && activeSubReport === 'Purchase History' && purchaseHistoryData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-3 gap-4">{[{ l: 'Total POs', v: purchaseHistoryData.summary.totalPOs }, { l: 'Total Spend', v: `${purchaseHistoryData.summary.totalSpend.toLocaleString()} LE` }, { l: 'Avg PO', v: `${purchaseHistoryData.summary.avgPO} LE` }].map((c, i) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className="text-2xl font-black text-main mt-1">{c.v}</p></div>))}</div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">By Supplier</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Supplier</th><th className="px-6 py-5 text-right">PO Count</th><th className="px-8 py-5 text-right">Total Spend</th></tr></thead><tbody className="divide-y divide-border/30">{purchaseHistoryData.bySupplier.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.supplierName}</td><td className="px-6 py-4 font-mono text-right">{r.poCount}</td><td className="px-8 py-4 font-mono font-bold text-right">{r.totalSpend.toLocaleString()} LE</td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'INVENTORY' && activeSubReport === 'Purchase History' && !purchaseHistoryData && <p className="text-center text-muted py-16">No purchase data.</p>}

               {activeCategory === 'INVENTORY' && activeSubReport === 'Inventory Valuation' && inventoryValuationData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">Total Inventory Value</p><p className="text-3xl font-black text-main mt-1">{inventoryValuationData.totalValue.toLocaleString()} <span className="text-xs text-muted">LE</span></p></div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Items by Value</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Item</th><th className="px-4 py-5 text-left">Unit</th><th className="px-4 py-5 text-right">Qty</th><th className="px-4 py-5 text-right">Avg Cost</th><th className="px-4 py-5 text-right">Batches</th><th className="px-6 py-5 text-right">Total Value</th></tr></thead><tbody className="divide-y divide-border/30">{inventoryValuationData.items.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.itemName}</td><td className="px-4 py-4 text-muted">{r.unit}</td><td className="px-4 py-4 font-mono text-right">{r.totalQty}</td><td className="px-4 py-4 font-mono text-right">{r.avgUnitCost}</td><td className="px-4 py-4 font-mono text-right">{r.batchCount}</td><td className="px-6 py-4 font-mono font-bold text-right">{r.totalValue.toLocaleString()} LE</td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'INVENTORY' && activeSubReport === 'Inventory Valuation' && !inventoryValuationData && <p className="text-center text-muted py-16">No valuation data.</p>}

               {/* ============ ADVANCED HR ============ */}

               {activeCategory === 'HR' && activeSubReport === 'Staff Cost %' && staffCostData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[{ l: 'Revenue', v: `${staffCostData.revenue.toLocaleString()} LE` }, { l: 'Staff Cost', v: `${staffCostData.staffCost.toLocaleString()} LE` }, { l: 'Staff Cost %', v: `${staffCostData.staffCostPercent}%`, color: staffCostData.staffCostPercent > 30 ? 'text-rose-500' : 'text-emerald-500' }, { l: 'Employees', v: staffCostData.employeeCount }, { l: 'Cost/Employee', v: `${staffCostData.costPerEmployee.toLocaleString()} LE` }].map((c: any, i: number) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.color || 'text-main'}`}>{c.v}</p></div>))}</div>
                  </div>
               )}
               {activeCategory === 'HR' && activeSubReport === 'Staff Cost %' && !staffCostData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'HR' && activeSubReport === 'Sales per Labor Hour' && salesPerLaborData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ l: 'Revenue', v: `${salesPerLaborData.revenue.toLocaleString()} LE` }, { l: 'Labor Hours', v: salesPerLaborData.totalLaborHours }, { l: 'Labor Days', v: salesPerLaborData.totalLaborDays }, { l: 'Sales / Hour', v: `${salesPerLaborData.salesPerLaborHour} LE` }].map((c, i) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className="text-2xl font-black text-main mt-1">{c.v}</p></div>))}</div>
                  </div>
               )}
               {activeCategory === 'HR' && activeSubReport === 'Sales per Labor Hour' && !salesPerLaborData && <p className="text-center text-muted py-16">No data.</p>}

               {/* ============ ADVANCED CRM ============ */}

               {activeCategory === 'CRM' && activeSubReport === 'Customer Retention' && customerRetentionData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ l: 'Total Customers', v: customerRetentionData.totalCustomers }, { l: 'Returning', v: customerRetentionData.returningCustomers, color: 'text-emerald-500' }, { l: 'New', v: customerRetentionData.newCustomers, color: 'text-blue-500' }, { l: 'Retention Rate', v: `${customerRetentionData.retentionRate}%`, color: customerRetentionData.retentionRate > 30 ? 'text-emerald-500' : 'text-amber-500' }].map((c: any, i: number) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.color || 'text-main'}`}>{c.v}</p></div>))}</div>
                  </div>
               )}
               {activeCategory === 'CRM' && activeSubReport === 'Customer Retention' && !customerRetentionData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'CRM' && activeSubReport === 'New vs Returning' && newVsReturningData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">New Customers</p><p className="text-3xl font-black text-blue-500">{newVsReturningData.new.orders} <span className="text-xs text-muted">orders</span></p><p className="text-lg font-bold text-muted mt-1">{newVsReturningData.new.revenue.toLocaleString()} LE</p></div>
                        <div className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Returning Customers</p><p className="text-3xl font-black text-emerald-500">{newVsReturningData.returning.orders} <span className="text-xs text-muted">orders</span></p><p className="text-lg font-bold text-muted mt-1">{newVsReturningData.returning.revenue.toLocaleString()} LE</p></div>
                     </div>
                  </div>
               )}
               {activeCategory === 'CRM' && activeSubReport === 'New vs Returning' && !newVsReturningData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'CRM' && activeSubReport === 'Customer Frequency' && customerFrequencyData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-5 gap-3">{[{ l: '1 Visit', v: customerFrequencyData.distribution.once, c: 'text-slate-400' }, { l: '2 Visits', v: customerFrequencyData.distribution.twice, c: 'text-blue-400' }, { l: '3 Visits', v: customerFrequencyData.distribution.thrice, c: 'text-indigo-500' }, { l: '4-10 Visits', v: customerFrequencyData.distribution.frequent, c: 'text-emerald-500' }, { l: '10+ Visits', v: customerFrequencyData.distribution.veryFrequent, c: 'text-amber-500' }].map((c, i) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg text-center"><p className="text-[9px] font-black uppercase text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.c}`}>{c.v}</p></div>))}</div>
                     {customerFrequencyData.topCustomers?.length > 0 && <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Top 20 Customers by Frequency</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Customer</th><th className="px-6 py-5 text-right">Orders</th><th className="px-8 py-5 text-right">Total Spent</th></tr></thead><tbody className="divide-y divide-border/30">{customerFrequencyData.topCustomers.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.customerName}</td><td className="px-6 py-4 font-mono text-right">{r.orderCount}</td><td className="px-8 py-4 font-mono font-bold text-right">{r.totalSpent.toLocaleString()} LE</td></tr>)}</tbody></table></div></div>}
                  </div>
               )}
               {activeCategory === 'CRM' && activeSubReport === 'Customer Frequency' && !customerFrequencyData && <p className="text-center text-muted py-16">No data.</p>}

               {/* ============ ADVANCED OPS ============ */}

               {activeCategory === 'OPS' && activeSubReport === 'Kitchen Performance' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Kitchen Performance by Item</h3><p className="text-xs text-muted mt-1">Preparation times per menu item</p></div>
                        <div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Item</th><th className="px-6 py-5 text-right">Prepared</th><th className="px-4 py-5 text-right">Avg (min)</th><th className="px-4 py-5 text-right">Min</th><th className="px-6 py-5 text-right">Max</th></tr></thead><tbody className="divide-y divide-border/30">{kitchenPerformanceData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.itemName}</td><td className="px-6 py-4 font-mono text-right">{r.totalPrepared}</td><td className="px-4 py-4 font-mono font-bold text-right">{r.avgPrepMinutes} min</td><td className="px-4 py-4 font-mono text-emerald-500 text-right">{r.minPrepMinutes}</td><td className="px-6 py-4 font-mono text-rose-500 text-right">{r.maxPrepMinutes}</td></tr>)}</tbody></table></div>
                        {kitchenPerformanceData.length === 0 && <p className="text-center text-muted py-16">No kitchen data available.</p>}
                     </div>
                  </div>
               )}

               {/* ============ STRATEGIC SALES ============ */}

               {activeCategory === 'SALES' && activeSubReport === 'Menu Engineering' && menuEngineeringData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-4 gap-4">{[{ l: '⭐ Stars', v: menuEngineeringData.summary.stars, c: 'text-amber-500' }, { l: '🐎 Plowhorses', v: menuEngineeringData.summary.plowhorses, c: 'text-blue-500' }, { l: '🧩 Puzzles', v: menuEngineeringData.summary.puzzles, c: 'text-indigo-500' }, { l: '🐕 Dogs', v: menuEngineeringData.summary.dogs, c: 'text-rose-500' }].map((c, i) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-xs font-black text-muted">{c.l}</p><p className={`text-3xl font-black mt-1 ${c.c}`}>{c.v}</p></div>))}</div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Menu Engineering Matrix</h3><p className="text-xs text-muted">High/Low Popularity × High/Low Profit Margin</p></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Item</th><th className="px-4 py-5 text-right">Qty</th><th className="px-4 py-5 text-right">Revenue</th><th className="px-4 py-5 text-right">Cost</th><th className="px-4 py-5 text-right">Profit</th><th className="px-4 py-5 text-right">Margin</th><th className="px-6 py-5 text-center">Class</th></tr></thead><tbody className="divide-y divide-border/30">{menuEngineeringData.items.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.itemName}</td><td className="px-4 py-4 font-mono text-right">{r.qtySold}</td><td className="px-4 py-4 font-mono text-right">{r.revenue.toLocaleString()}</td><td className="px-4 py-4 font-mono text-right text-muted">{r.cost.toLocaleString()}</td><td className="px-4 py-4 font-mono font-bold text-right">{r.profit.toLocaleString()}</td><td className="px-4 py-4 font-mono text-right">{r.margin}%</td><td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-lg text-[9px] font-black ${r.classification === 'Star' ? 'bg-amber-500/10 text-amber-500' : r.classification === 'Plowhorse' ? 'bg-blue-500/10 text-blue-500' : r.classification === 'Puzzle' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-rose-500/10 text-rose-500'}`}>{r.classification}</span></td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'SALES' && activeSubReport === 'Menu Engineering' && !menuEngineeringData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'SALES' && activeSubReport === 'Daypart Analysis' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-5 gap-3">{daypartData.map((d: any, i: number) => { const maxRev = Math.max(...daypartData.map((x: any) => x.revenue), 1); return <div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg text-center"><p className="text-[10px] font-black uppercase text-muted">{d.name}</p><p className="text-xl font-black text-main mt-1">{d.revenue.toLocaleString()}</p><p className="text-[9px] text-muted">{d.orderCount} orders · {d.percentage}%</p><div className="mt-2 mx-auto w-8 bg-elevated/50 rounded-full" style={{ height: 50 }}><div className="w-8 rounded-full bg-blue-500" style={{ height: `${(d.revenue / maxRev) * 100}%`, marginTop: `${100 - (d.revenue / maxRev) * 100}%` }} /></div><p className="text-[9px] text-muted mt-1">Avg {d.avgTicket} LE</p></div> })}</div>
                     {daypartData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Basket Analysis' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Cross-Sell / Basket Analysis</h3><p className="text-xs text-muted mt-1">Items most frequently purchased together</p></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">#</th><th className="px-6 py-5 text-left">Item Pair</th><th className="px-6 py-5 text-right">Count</th><th className="px-8 py-5 text-right">% of Orders</th></tr></thead><tbody className="divide-y divide-border/30">{basketData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 font-mono text-muted">{i + 1}</td><td className="px-6 py-4 text-xs font-black text-main">{r.pair}</td><td className="px-6 py-4 font-mono text-right">{r.count}</td><td className="px-8 py-4 font-mono font-bold text-right">{r.percentage}%</td></tr>)}</tbody></table></div></div>
                     {basketData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Seasonality' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Monthly Seasonality</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Month</th><th className="px-6 py-5 text-right">Orders</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-8 py-5 text-right">Avg Ticket</th></tr></thead><tbody className="divide-y divide-border/30">{seasonalityData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.month}</td><td className="px-6 py-4 font-mono text-right">{r.orderCount}</td><td className="px-6 py-4 font-mono font-bold text-right">{r.revenue.toLocaleString()} LE</td><td className="px-8 py-4 font-mono text-right">{r.avgTicket} LE</td></tr>)}</tbody></table></div></div>
                     {seasonalityData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Online vs Offline' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Online vs Offline Trend</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Day</th><th className="px-4 py-5 text-right">Online Rev</th><th className="px-4 py-5 text-right">Offline Rev</th><th className="px-4 py-5 text-right">Online %</th></tr></thead><tbody className="divide-y divide-border/30">{onlineOfflineData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.day}</td><td className="px-4 py-4 font-mono text-right text-blue-500">{r.onlineRevenue.toLocaleString()}</td><td className="px-4 py-4 font-mono text-right">{r.offlineRevenue.toLocaleString()}</td><td className="px-4 py-4 font-mono font-bold text-right">{r.onlinePercent}%</td></tr>)}</tbody></table></div></div>
                     {onlineOfflineData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {/* ============ STRATEGIC FINANCE ============ */}

               {activeCategory === 'FINANCE' && activeSubReport === 'Food Cost % Trend' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Food Cost % Trend</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Day</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-6 py-5 text-right">Cost</th><th className="px-8 py-5 text-right">Food Cost %</th></tr></thead><tbody className="divide-y divide-border/30">{foodCostTrendData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.day}</td><td className="px-6 py-4 font-mono text-right">{r.revenue.toLocaleString()}</td><td className="px-6 py-4 font-mono text-right text-muted">{r.cost.toLocaleString()}</td><td className="px-8 py-4 font-mono font-bold text-right"><span className={`px-2 py-1 rounded-lg text-[9px] font-black ${r.foodCostPercent > 40 ? 'bg-rose-500/10 text-rose-500' : r.foodCostPercent > 30 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{r.foodCostPercent}%</span></td></tr>)}</tbody></table></div></div>
                     {foodCostTrendData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'FINANCE' && activeSubReport === 'Cash Flow Forecast' && cashFlowData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 gap-4"><div className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">Avg Weekly Revenue</p><p className="text-2xl font-black text-main mt-1">{cashFlowData.avgWeeklyRevenue.toLocaleString()} LE</p></div><div className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">Weekly Trend</p><p className={`text-2xl font-black mt-1 ${cashFlowData.weeklyTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{cashFlowData.weeklyTrend >= 0 ? '+' : ''}{cashFlowData.weeklyTrend.toLocaleString()} LE</p></div></div>
                     <div className="grid grid-cols-2 gap-6"><div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6"><h3 className="text-lg font-black text-main mb-4">History (12 wks)</h3>{cashFlowData.history.map((h: any, i: number) => (<div key={i} className="flex justify-between py-1.5 text-xs"><span className="text-muted font-mono">W{h.week}</span><span className="font-black text-main">{h.revenue.toLocaleString()} LE</span></div>))}</div><div className="card-primary rounded-[2rem] border border-blue-200 dark:border-blue-800 shadow-xl overflow-hidden p-6 bg-blue-50/30 dark:bg-blue-950/20"><h3 className="text-lg font-black text-blue-500 mb-4">Forecast</h3>{cashFlowData.forecast.map((f: any, i: number) => (<div key={i} className="flex justify-between py-2 text-xs"><span className="text-blue-400 font-mono">Week {f.week}</span><span className="font-black text-blue-500">{f.projectedRevenue.toLocaleString()} LE</span></div>))}</div></div>
                  </div>
               )}
               {activeCategory === 'FINANCE' && activeSubReport === 'Cash Flow Forecast' && !cashFlowData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'FINANCE' && activeSubReport === 'Tax Compliance' && taxComplianceData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[{ l: 'Total Invoices', v: taxComplianceData.fiscal.total }, { l: 'Submitted', v: taxComplianceData.fiscal.submitted, c: 'text-emerald-500' }, { l: 'Failed', v: taxComplianceData.fiscal.failed, c: 'text-rose-500' }, { l: 'Pending', v: taxComplianceData.fiscal.pending, c: 'text-amber-500' }, { l: 'Success Rate', v: `${taxComplianceData.fiscal.successRate}%`, c: taxComplianceData.fiscal.successRate > 90 ? 'text-emerald-500' : 'text-rose-500' }].map((c: any, i: number) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.c || 'text-main'}`}>{c.v}</p></div>))}</div>
                     {taxComplianceData.deadLetters.length > 0 && <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6"><h3 className="text-lg font-black text-main mb-4">Dead Letters by Status</h3>{taxComplianceData.deadLetters.map((d: any, i: number) => (<div key={i} className="flex justify-between py-1.5 text-xs"><span className="text-muted">{d.status}</span><span className="font-black text-main">{d.count}</span></div>))}</div>}
                  </div>
               )}
               {activeCategory === 'FINANCE' && activeSubReport === 'Tax Compliance' && !taxComplianceData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'FINANCE' && activeSubReport === 'Audit Trail' && auditTrailData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 gap-6"><div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6"><h3 className="text-lg font-black text-main mb-4">By Event Type</h3>{auditTrailData.byType.map((r: any, i: number) => (<div key={i} className="flex justify-between py-1.5 text-xs"><span className="text-muted font-mono">{r.eventType}</span><span className="font-black text-main">{r.count}</span></div>))}</div><div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6"><h3 className="text-lg font-black text-main mb-4">By User</h3>{auditTrailData.byUser.map((r: any, i: number) => (<div key={i} className="flex justify-between py-1.5 text-xs"><span className="text-muted">{r.userName} <span className="text-[9px] text-muted/50">({r.userRole})</span></span><span className="font-black text-main">{r.count}</span></div>))}</div></div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Recent Activity</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Event</th><th className="px-4 py-5 text-left">User</th><th className="px-4 py-5 text-left">Reason</th><th className="px-6 py-5 text-right">When</th></tr></thead><tbody className="divide-y divide-border/30">{auditTrailData.recent.slice(0, 30).map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-3 font-mono text-[10px]">{r.eventType}</td><td className="px-4 py-3 text-xs">{r.userName}</td><td className="px-4 py-3 text-xs text-muted">{r.reason || '—'}</td><td className="px-6 py-3 font-mono text-[10px] text-muted text-right">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'FINANCE' && activeSubReport === 'Audit Trail' && !auditTrailData && <p className="text-center text-muted py-16">No data.</p>}

               {/* ============ STRATEGIC HR ============ */}

               {activeCategory === 'HR' && activeSubReport === 'Employee Productivity' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Employee Productivity Ranking</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">#</th><th className="px-6 py-5 text-left">Employee ID</th><th className="px-6 py-5 text-right">Orders</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-8 py-5 text-right">Avg Ticket</th></tr></thead><tbody className="divide-y divide-border/30">{empProductivityData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 font-mono text-muted">{i + 1}</td><td className="px-6 py-4 text-xs font-black text-main">{r.userId}</td><td className="px-6 py-4 font-mono text-right">{r.orderCount}</td><td className="px-6 py-4 font-mono font-bold text-right">{r.revenue.toLocaleString()} LE</td><td className="px-8 py-4 font-mono text-right">{r.avgTicket} LE</td></tr>)}</tbody></table></div></div>
                     {empProductivityData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {/* ============ STRATEGIC INVENTORY ============ */}

               {activeCategory === 'INVENTORY' && activeSubReport === 'Supplier Price Tracking' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Supplier Price Tracking</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Item</th><th className="px-4 py-5 text-left">Supplier</th><th className="px-4 py-5 text-right">Avg Price</th><th className="px-4 py-5 text-right">Min</th><th className="px-4 py-5 text-right">Max</th><th className="px-4 py-5 text-right">Variance</th><th className="px-6 py-5 text-right">Qty</th></tr></thead><tbody className="divide-y divide-border/30">{supplierPriceData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.itemName}</td><td className="px-4 py-4 text-xs text-muted">{r.supplierName}</td><td className="px-4 py-4 font-mono text-right">{r.avgPrice}</td><td className="px-4 py-4 font-mono text-right text-emerald-500">{r.minPrice}</td><td className="px-4 py-4 font-mono text-right text-rose-500">{r.maxPrice}</td><td className="px-4 py-4 font-mono font-bold text-right">{r.priceVariance}</td><td className="px-6 py-4 font-mono text-right">{r.totalQty}</td></tr>)}</tbody></table></div></div>
                     {supplierPriceData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'INVENTORY' && activeSubReport === 'Recipe Cost Alerts' && recipeCostData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-3 gap-4">{[{ l: '🔴 Critical (<30%)', v: recipeCostData.critical, c: 'text-rose-500' }, { l: '🟡 Warning (<50%)', v: recipeCostData.warning, c: 'text-amber-500' }, { l: '🟢 OK (≥50%)', v: recipeCostData.ok, c: 'text-emerald-500' }].map((c, i) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-xs font-black text-muted">{c.l}</p><p className={`text-3xl font-black mt-1 ${c.c}`}>{c.v}</p></div>))}</div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Item</th><th className="px-4 py-5 text-right">Price</th><th className="px-4 py-5 text-right">Cost</th><th className="px-4 py-5 text-right">Margin</th><th className="px-6 py-5 text-center">Alert</th></tr></thead><tbody className="divide-y divide-border/30">{recipeCostData.items.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.menuItemName}</td><td className="px-4 py-4 font-mono text-right">{r.price}</td><td className="px-4 py-4 font-mono text-right text-muted">{r.cost}</td><td className="px-4 py-4 font-mono text-right">{r.margin}%</td><td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-lg text-[9px] font-black ${r.alert === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500' : r.alert === 'WARNING' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{r.alert}</span></td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'INVENTORY' && activeSubReport === 'Recipe Cost Alerts' && !recipeCostData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'INVENTORY' && activeSubReport === 'ABC Classification' && abcData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-4 gap-4"><div className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase text-muted">Total Stock Value</p><p className="text-2xl font-black text-main mt-1">{abcData.totalValue.toLocaleString()} LE</p></div>{[{ l: 'A Items (80%)', v: abcData.a, c: 'text-rose-500' }, { l: 'B Items (15%)', v: abcData.b, c: 'text-amber-500' }, { l: 'C Items (5%)', v: abcData.c, c: 'text-emerald-500' }].map((c, i) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.c}`}>{c.v}</p></div>))}</div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Item</th><th className="px-4 py-5 text-right">Qty</th><th className="px-4 py-5 text-right">Value</th><th className="px-4 py-5 text-right">% of Total</th><th className="px-4 py-5 text-right">Cumul %</th><th className="px-6 py-5 text-center">Class</th></tr></thead><tbody className="divide-y divide-border/30">{abcData.items.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.itemName}</td><td className="px-4 py-4 font-mono text-right">{r.totalQty} {r.unit}</td><td className="px-4 py-4 font-mono font-bold text-right">{r.totalValue.toLocaleString()}</td><td className="px-4 py-4 font-mono text-right">{r.valuePercent}%</td><td className="px-4 py-4 font-mono text-right text-muted">{r.cumulativePercent}%</td><td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-lg text-[9px] font-black ${r.classification === 'A' ? 'bg-rose-500/10 text-rose-500' : r.classification === 'B' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{r.classification}</span></td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'INVENTORY' && activeSubReport === 'ABC Classification' && !abcData && <p className="text-center text-muted py-16">No data.</p>}

               {/* ============ STRATEGIC CRM ============ */}

               {activeCategory === 'CRM' && activeSubReport === 'Customer Churn' && churnData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-5 gap-3">{[{ l: 'Total', v: churnData.summary.total }, { l: 'Active (30d)', v: churnData.summary.active, c: 'text-emerald-500' }, { l: 'At Risk (30-60d)', v: churnData.summary.atRisk30, c: 'text-amber-500' }, { l: 'At Risk (60-90d)', v: churnData.summary.atRisk60, c: 'text-orange-500' }, { l: 'Churned (90+ d)', v: churnData.summary.churned90, c: 'text-rose-500' }].map((c: any, i: number) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.c || 'text-main'}`}>{c.v}</p></div>))}</div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">At-Risk Customers</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Customer</th><th className="px-4 py-5 text-right">Days Since</th><th className="px-4 py-5 text-right">Orders</th><th className="px-4 py-5 text-right">Total Spent</th><th className="px-6 py-5 text-right">Last Order</th></tr></thead><tbody className="divide-y divide-border/30">{churnData.atRisk.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.customerName}</td><td className="px-4 py-4 font-mono text-right"><span className={`px-2 py-1 rounded-lg text-[9px] font-black ${r.daysSinceLastOrder > 90 ? 'bg-rose-500/10 text-rose-500' : r.daysSinceLastOrder > 60 ? 'bg-orange-500/10 text-orange-500' : 'bg-amber-500/10 text-amber-500'}`}>{r.daysSinceLastOrder}d</span></td><td className="px-4 py-4 font-mono text-right">{r.orderCount}</td><td className="px-4 py-4 font-mono text-right">{r.totalSpent.toLocaleString()} LE</td><td className="px-6 py-4 font-mono text-[10px] text-muted text-right">{r.lastOrder ? new Date(r.lastOrder).toLocaleDateString() : '—'}</td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'CRM' && activeSubReport === 'Customer Churn' && !churnData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'CRM' && activeSubReport === 'Loyalty Points' && loyaltyData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-3 gap-4">{[{ l: 'Total Customers', v: loyaltyData.summary.totalCustomers }, { l: 'Points Outstanding', v: loyaltyData.summary.totalPoints.toLocaleString(), c: 'text-amber-500' }, { l: 'Total Spent', v: `${loyaltyData.summary.totalSpent.toLocaleString()} LE`, c: 'text-emerald-500' }].map((c: any, i: number) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.c || 'text-main'}`}>{c.v}</p></div>))}</div>
                     <div className="grid grid-cols-2 gap-6"><div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl p-6"><h3 className="text-lg font-black text-main mb-4">By Tier</h3>{loyaltyData.tiers.map((t: any, i: number) => (<div key={i} className="flex justify-between py-2 text-xs border-b border-border/20"><span className="font-black">{t.tier}</span><span className="text-muted">{t.count} customers · {t.totalPoints} pts · {t.totalSpent.toLocaleString()} LE</span></div>))}</div><div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl p-6"><h3 className="text-lg font-black text-main mb-4">Top Point Holders</h3>{loyaltyData.topPointHolders.slice(0, 10).map((c: any, i: number) => (<div key={i} className="flex justify-between py-1.5 text-xs"><span className="text-main font-bold">{c.name}</span><span className="font-mono text-amber-500">{c.loyaltyPoints} pts</span></div>))}</div></div>
                  </div>
               )}
               {activeCategory === 'CRM' && activeSubReport === 'Loyalty Points' && !loyaltyData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'CRM' && activeSubReport === 'Promotion Impact' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Campaign / Promotion Impact</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Campaign</th><th className="px-4 py-5 text-left">Type</th><th className="px-4 py-5 text-right">Reach</th><th className="px-4 py-5 text-right">Conv.</th><th className="px-4 py-5 text-right">Conv %</th><th className="px-4 py-5 text-right">Revenue</th><th className="px-4 py-5 text-right">Budget</th><th className="px-6 py-5 text-right">ROI</th></tr></thead><tbody className="divide-y divide-border/30">{(Array.isArray(promoImpactData) ? promoImpactData : []).map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.name}</td><td className="px-4 py-4 text-xs text-muted">{r.type}</td><td className="px-4 py-4 font-mono text-right">{r.reach}</td><td className="px-4 py-4 font-mono text-right">{r.conversions}</td><td className="px-4 py-4 font-mono text-right">{r.conversionRate}%</td><td className="px-4 py-4 font-mono text-right">{r.revenue.toLocaleString()}</td><td className="px-4 py-4 font-mono text-right text-muted">{r.budget.toLocaleString()}</td><td className="px-6 py-4 font-mono font-bold text-right"><span className={r.roi >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{r.roi}%</span></td></tr>)}</tbody></table></div></div>
                  </div>
               )}

               {/* ============ STRATEGIC OPERATIONS ============ */}

               {activeCategory === 'OPS' && activeSubReport === 'Table Turnover' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Table Turnover Rate</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Table</th><th className="px-6 py-5 text-right">Orders</th><th className="px-6 py-5 text-right">Turns/Day</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-8 py-5 text-right">Rev/Day</th></tr></thead><tbody className="divide-y divide-border/30">{tableTurnoverData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.tableId}</td><td className="px-6 py-4 font-mono text-right">{r.totalOrders}</td><td className="px-6 py-4 font-mono font-bold text-right">{r.turnsPerDay}</td><td className="px-6 py-4 font-mono text-right">{r.revenue.toLocaleString()} LE</td><td className="px-8 py-4 font-mono text-right">{r.revenuePerDay} LE</td></tr>)}</tbody></table></div></div>
                     {tableTurnoverData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'OPS' && activeSubReport === 'Wait Time' && waitTimeData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{waitTimeData.byType.map((r: any, i: number) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{r.orderType}</p><p className="text-2xl font-black text-main mt-1">{r.avgWaitMinutes} min</p><p className="text-[9px] text-muted">{r.orderCount} orders · {r.minWaitMinutes}–{r.maxWaitMinutes} min range</p></div>))}</div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Daily Avg Wait Time</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Day</th><th className="px-6 py-5 text-right">Avg Wait (min)</th><th className="px-8 py-5 text-right">Orders</th></tr></thead><tbody className="divide-y divide-border/30">{waitTimeData.daily.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 text-xs font-black text-main">{r.day}</td><td className="px-6 py-4 font-mono font-bold text-right">{r.avgWaitMinutes} min</td><td className="px-8 py-4 font-mono text-right">{r.orderCount}</td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'OPS' && activeSubReport === 'Wait Time' && !waitTimeData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'OPS' && activeSubReport === 'Driver Utilization' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Driver Utilization</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Driver</th><th className="px-4 py-5 text-right">Orders</th><th className="px-4 py-5 text-right">Orders/Day</th><th className="px-4 py-5 text-right">Revenue</th><th className="px-4 py-5 text-right">Del. Fees</th><th className="px-6 py-5 text-right">Avg Delivery</th></tr></thead><tbody className="divide-y divide-border/30">{driverUtilData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.driverName}</td><td className="px-4 py-4 font-mono text-right">{r.orderCount}</td><td className="px-4 py-4 font-mono text-right">{r.ordersPerDay}</td><td className="px-4 py-4 font-mono text-right">{r.revenue.toLocaleString()}</td><td className="px-4 py-4 font-mono text-right text-muted">{r.totalDeliveryFees.toLocaleString()}</td><td className="px-6 py-4 font-mono font-bold text-right">{r.avgDeliveryMinutes} min</td></tr>)}</tbody></table></div></div>
                     {driverUtilData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'OPS' && activeSubReport === 'Branch Comparison' && branchCompData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-2xl border border-blue-200 dark:border-blue-800 p-5 shadow-lg bg-blue-50/30 dark:bg-blue-950/20"><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">🏆 Top Branch</p><p className="text-2xl font-black text-blue-500 mt-1">{branchCompData.topBranch}</p></div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Branch</th><th className="px-4 py-5 text-right">Orders</th><th className="px-4 py-5 text-right">Revenue</th><th className="px-4 py-5 text-right">Avg Ticket</th><th className="px-4 py-5 text-right">Cancelled</th><th className="px-6 py-5 text-right">Discounts</th></tr></thead><tbody className="divide-y divide-border/30">{branchCompData.branches.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.branchName}</td><td className="px-4 py-4 font-mono text-right">{r.orderCount}</td><td className="px-4 py-4 font-mono font-bold text-right">{r.revenue.toLocaleString()} LE</td><td className="px-4 py-4 font-mono text-right">{r.avgTicket} LE</td><td className="px-4 py-4 font-mono text-right text-rose-500">{r.cancelCount}</td><td className="px-6 py-4 font-mono text-right text-muted">{r.totalDiscount.toLocaleString()}</td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'OPS' && activeSubReport === 'Branch Comparison' && !branchCompData && <p className="text-center text-muted py-16">No data.</p>}

               {/* ============ PHASE 4: MENU INTELLIGENCE ============ */}

               {activeCategory === 'SALES' && activeSubReport === 'Menu Cannibalization' && cannibalizationData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 gap-6"><div className="card-primary rounded-[2rem] border border-rose-200 dark:border-rose-800 shadow-xl p-6 bg-rose-50/30 dark:bg-rose-950/20"><h3 className="text-lg font-black text-rose-500 mb-4">📉 Declining ({cannibalizationData.declining.length})</h3>{cannibalizationData.declining.slice(0, 10).map((r: any, i: number) => (<div key={i} className="flex justify-between py-1.5 text-xs border-b border-rose-100 dark:border-rose-900/30"><span className="font-black text-main">{r.itemName}</span><span className="font-mono text-rose-500">{r.qtyChangePercent}%</span></div>))}</div><div className="card-primary rounded-[2rem] border border-emerald-200 dark:border-emerald-800 shadow-xl p-6 bg-emerald-50/30 dark:bg-emerald-950/20"><h3 className="text-lg font-black text-emerald-500 mb-4">📈 Growing ({cannibalizationData.growing.length})</h3>{cannibalizationData.growing.slice(0, 10).map((r: any, i: number) => (<div key={i} className="flex justify-between py-1.5 text-xs border-b border-emerald-100 dark:border-emerald-900/30"><span className="font-black text-main">{r.itemName}</span><span className="font-mono text-emerald-500">+{r.qtyChangePercent}%</span></div>))}</div></div>
                  </div>
               )}
               {activeCategory === 'SALES' && activeSubReport === 'Menu Cannibalization' && !cannibalizationData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'SALES' && activeSubReport === 'Menu Item Lifecycle' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Menu Item Lifecycle (Monthly)</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Month</th><th className="px-4 py-5 text-left">Item</th><th className="px-4 py-5 text-right">Qty</th><th className="px-6 py-5 text-right">Revenue</th></tr></thead><tbody className="divide-y divide-border/30">{menuLifecycleData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 font-mono text-muted">{r.month}</td><td className="px-4 py-4 text-xs font-black text-main">{r.itemName}</td><td className="px-4 py-4 font-mono text-right">{r.qty}</td><td className="px-6 py-4 font-mono font-bold text-right">{r.revenue.toLocaleString()} LE</td></tr>)}</tbody></table></div></div>
                     {menuLifecycleData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Category Contribution' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Category Contribution Matrix</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Category</th><th className="px-4 py-5 text-right">Qty</th><th className="px-4 py-5 text-right">Revenue</th><th className="px-4 py-5 text-right">Cost</th><th className="px-4 py-5 text-right">Profit</th><th className="px-4 py-5 text-right">Margin</th><th className="px-4 py-5 text-right">Rev %</th><th className="px-6 py-5 text-right">Profit %</th></tr></thead><tbody className="divide-y divide-border/30">{catContribData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.categoryName}</td><td className="px-4 py-4 font-mono text-right">{r.qtySold}</td><td className="px-4 py-4 font-mono text-right">{r.revenue.toLocaleString()}</td><td className="px-4 py-4 font-mono text-right text-muted">{r.cost.toLocaleString()}</td><td className="px-4 py-4 font-mono font-bold text-right">{r.profit.toLocaleString()}</td><td className="px-4 py-4 font-mono text-right">{r.margin}%</td><td className="px-4 py-4 font-mono text-right text-blue-500">{r.revenueShare}%</td><td className="px-6 py-4 font-mono font-bold text-right text-emerald-500">{r.profitShare}%</td></tr>)}</tbody></table></div></div>
                     {catContribData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'SALES' && activeSubReport === 'Time-to-First-Order' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Time-to-First-Order (New Items)</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Item</th><th className="px-4 py-5 text-left">Added</th><th className="px-4 py-5 text-right">Days</th><th className="px-4 py-5 text-right">Orders</th><th className="px-4 py-5 text-right">Qty</th><th className="px-6 py-5 text-right">Revenue</th></tr></thead><tbody className="divide-y divide-border/30">{timeToFirstData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.itemName}</td><td className="px-4 py-4 font-mono text-[10px] text-muted">{r.addedDate ? new Date(r.addedDate).toLocaleDateString() : '—'}</td><td className="px-4 py-4 font-mono text-right"><span className={`px-2 py-1 rounded-lg text-[9px] font-black ${r.daysToFirstOrder === null ? 'bg-rose-500/10 text-rose-500' : r.daysToFirstOrder <= 1 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{r.daysToFirstOrder !== null ? `${r.daysToFirstOrder}d` : 'None'}</span></td><td className="px-4 py-4 font-mono text-right">{r.totalOrders}</td><td className="px-4 py-4 font-mono text-right">{r.totalQty}</td><td className="px-6 py-4 font-mono font-bold text-right">{r.totalRevenue.toLocaleString()} LE</td></tr>)}</tbody></table></div></div>
                     {timeToFirstData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {/* ============ PHASE 4: FINANCE DEEP-DIVE ============ */}

               {activeCategory === 'FINANCE' && activeSubReport === 'Break-Even Analysis' && breakEvenData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ l: 'Avg Monthly Revenue', v: `${breakEvenData.avgMonthlyRevenue.toLocaleString()} LE` }, { l: 'Avg Monthly Orders', v: breakEvenData.avgMonthlyOrders }, { l: 'Break-Even Revenue', v: `${breakEvenData.breakEvenRevenue.toLocaleString()} LE`, c: 'text-amber-500' }, { l: 'Break-Even Orders/Day', v: breakEvenData.breakEvenOrdersPerDay, c: 'text-rose-500' }].map((c: any, i: number) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.c || 'text-main'}`}>{c.v}</p></div>))}</div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Monthly Revenue Trend</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-8 py-5 text-left">Month</th><th className="px-6 py-5 text-right">Revenue</th><th className="px-8 py-5 text-right">Orders</th></tr></thead><tbody className="divide-y divide-border/30">{breakEvenData.monthly.map((m: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-8 py-4 font-mono text-main">{m.month}</td><td className="px-6 py-4 font-mono font-bold text-right">{m.revenue.toLocaleString()} LE</td><td className="px-8 py-4 font-mono text-right">{m.orderCount}</td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'FINANCE' && activeSubReport === 'Break-Even Analysis' && !breakEvenData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'FINANCE' && activeSubReport === 'Payment Reconciliation' && reconciliationData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ l: 'Order Total', v: `${reconciliationData.orderTotal.toLocaleString()} LE` }, { l: 'Payment Total', v: `${reconciliationData.paymentTotal.toLocaleString()} LE` }, { l: 'Discrepancy', v: `${reconciliationData.discrepancy.toLocaleString()} LE`, c: reconciliationData.discrepancy > 0 ? 'text-rose-500' : 'text-emerald-500' }, { l: 'Discrepancy %', v: `${reconciliationData.discrepancyPercent}%`, c: Math.abs(reconciliationData.discrepancyPercent) > 2 ? 'text-rose-500' : 'text-emerald-500' }].map((c: any, i: number) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.c || 'text-main'}`}>{c.v}</p></div>))}</div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6"><h3 className="text-lg font-black text-main mb-4">By Payment Method</h3>{reconciliationData.byMethod.map((m: any, i: number) => (<div key={i} className="flex justify-between py-2 text-xs border-b border-border/20"><span className="font-black">{m.method}</span><span className="text-muted">{m.count} txns · <span className="font-black text-main">{m.total.toLocaleString()} LE</span></span></div>))}</div>
                  </div>
               )}
               {activeCategory === 'FINANCE' && activeSubReport === 'Payment Reconciliation' && !reconciliationData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'FINANCE' && activeSubReport === 'Shift Profitability' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Shift Profitability</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Opened</th><th className="px-4 py-5 text-right">Orders</th><th className="px-4 py-5 text-right">Revenue</th><th className="px-4 py-5 text-right">Opening</th><th className="px-4 py-5 text-right">Closing</th><th className="px-4 py-5 text-right">Expected</th><th className="px-6 py-5 text-right">Variance</th></tr></thead><tbody className="divide-y divide-border/30">{shiftProfitData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 font-mono text-[10px] text-main">{r.openingTime ? new Date(r.openingTime).toLocaleString() : '—'}</td><td className="px-4 py-4 font-mono text-right">{r.orderCount}</td><td className="px-4 py-4 font-mono font-bold text-right">{r.revenue.toLocaleString()}</td><td className="px-4 py-4 font-mono text-right text-muted">{r.openingCash}</td><td className="px-4 py-4 font-mono text-right">{r.closingCash}</td><td className="px-4 py-4 font-mono text-right text-muted">{r.expectedCash}</td><td className="px-6 py-4 font-mono font-bold text-right"><span className={r.variance >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{r.variance >= 0 ? '+' : ''}{r.variance}</span></td></tr>)}</tbody></table></div></div>
                     {shiftProfitData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {/* ============ PHASE 4: INVENTORY ============ */}

               {activeCategory === 'INVENTORY' && activeSubReport === 'Optimal Pricing' && optimalPricingData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-4 gap-4"><div className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase text-muted">Target Margin</p><p className="text-2xl font-black text-blue-500 mt-1">{optimalPricingData.targetMargin}%</p></div>{[{ l: '⬆ Needs Increase', v: optimalPricingData.needsIncrease, c: 'text-rose-500' }, { l: '✅ OK', v: optimalPricingData.ok, c: 'text-emerald-500' }, { l: '⬇ Can Decrease', v: optimalPricingData.canDecrease, c: 'text-amber-500' }].map((c, i) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.c}`}>{c.v}</p></div>))}</div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Item</th><th className="px-4 py-5 text-right">Price</th><th className="px-4 py-5 text-right">Cost</th><th className="px-4 py-5 text-right">Margin</th><th className="px-4 py-5 text-right">Suggested</th><th className="px-4 py-5 text-right">Change</th><th className="px-6 py-5 text-center">Action</th></tr></thead><tbody className="divide-y divide-border/30">{optimalPricingData.items.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.name}</td><td className="px-4 py-4 font-mono text-right">{r.currentPrice}</td><td className="px-4 py-4 font-mono text-right text-muted">{r.cost}</td><td className="px-4 py-4 font-mono text-right">{r.currentMargin}%</td><td className="px-4 py-4 font-mono font-bold text-right">{r.suggestedPrice}</td><td className="px-4 py-4 font-mono text-right"><span className={r.priceChange > 0 ? 'text-emerald-500' : 'text-rose-500'}>{r.priceChange > 0 ? '+' : ''}{r.priceChange}</span></td><td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-lg text-[9px] font-black ${r.action === 'INCREASE' ? 'bg-rose-500/10 text-rose-500' : r.action === 'DECREASE' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{r.action}</span></td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'INVENTORY' && activeSubReport === 'Optimal Pricing' && !optimalPricingData && <p className="text-center text-muted py-16">No data.</p>}

               {/* ============ PHASE 4: CRM ============ */}

               {activeCategory === 'CRM' && activeSubReport === 'Customer Journey Funnel' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-8"><h3 className="text-xl font-black text-main mb-6">Customer Journey Funnel</h3><div className="space-y-3">{journeyFunnelData.map((s: any, i: number) => { const maxW = 100; const w = s.percent; return <div key={i} className="flex items-center gap-4"><span className="text-xs font-black text-muted w-40 text-right">{s.stage}</span><div className="flex-1 relative"><div className="h-10 rounded-xl bg-blue-500/10 transition-all" style={{ width: `${w}%` }}><div className="h-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center px-4" style={{ width: `${Math.max(w, 5)}%` }}><span className="text-[10px] font-black text-white whitespace-nowrap">{s.count} ({s.percent}%)</span></div></div></div></div> })}</div></div>
                     {journeyFunnelData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {/* ============ PHASE 4: OPS (DELIVERY) ============ */}

               {activeCategory === 'OPS' && activeSubReport === 'Delivery Zone Analytics' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Delivery Zone Analytics</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Area</th><th className="px-4 py-5 text-right">Orders</th><th className="px-4 py-5 text-right">Revenue</th><th className="px-4 py-5 text-right">Avg Ticket</th><th className="px-6 py-5 text-right">Fees</th></tr></thead><tbody className="divide-y divide-border/30">{deliveryZoneData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.area}</td><td className="px-4 py-4 font-mono text-right">{r.orderCount}</td><td className="px-4 py-4 font-mono font-bold text-right">{r.revenue.toLocaleString()} LE</td><td className="px-4 py-4 font-mono text-right">{r.avgTicket} LE</td><td className="px-6 py-4 font-mono text-right text-muted">{r.totalFees.toLocaleString()}</td></tr>)}</tbody></table></div></div>
                     {deliveryZoneData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'OPS' && activeSubReport === 'Delivery Cost vs Revenue' && deliveryCostData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ l: 'Total Delivery Orders', v: deliveryCostData.summary.totalOrders }, { l: 'Revenue', v: `${deliveryCostData.summary.totalRevenue.toLocaleString()} LE` }, { l: 'Total Fees', v: `${deliveryCostData.summary.totalFees.toLocaleString()} LE`, c: 'text-amber-500' }, { l: 'Fee % of Revenue', v: `${deliveryCostData.summary.feePercentOfRevenue}%`, c: 'text-blue-500' }].map((c: any, i: number) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.c || 'text-main'}`}>{c.v}</p></div>))}</div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="text-lg font-black text-main">Daily Breakdown</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Day</th><th className="px-4 py-5 text-right">Orders</th><th className="px-4 py-5 text-right">Revenue</th><th className="px-4 py-5 text-right">Del. Fees</th><th className="px-6 py-5 text-right">Free</th></tr></thead><tbody className="divide-y divide-border/30">{deliveryCostData.daily.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 font-mono text-main">{r.day}</td><td className="px-4 py-4 font-mono text-right">{r.orderCount}</td><td className="px-4 py-4 font-mono text-right">{r.revenue.toLocaleString()}</td><td className="px-4 py-4 font-mono text-right text-muted">{r.deliveryFees.toLocaleString()}</td><td className="px-6 py-4 font-mono text-right">{r.freeDeliveries}</td></tr>)}</tbody></table></div></div>
                  </div>
               )}
               {activeCategory === 'OPS' && activeSubReport === 'Delivery Cost vs Revenue' && !deliveryCostData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'OPS' && activeSubReport === '3rd Party vs In-House' && thirdPartyData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="grid grid-cols-2 gap-6"><div className="card-primary rounded-[2rem] border border-blue-200 dark:border-blue-800 shadow-xl p-6 bg-blue-50/30 dark:bg-blue-950/20"><h3 className="text-lg font-black text-blue-500 mb-4">🏠 In-House Delivery</h3><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-muted">Orders</span><span className="font-black text-main">{thirdPartyData.inHouse.orderCount}</span></div><div className="flex justify-between"><span className="text-muted">Revenue</span><span className="font-black text-main">{thirdPartyData.inHouse.revenue.toLocaleString()} LE</span></div><div className="flex justify-between"><span className="text-muted">Avg Delivery</span><span className="font-black text-blue-500">{thirdPartyData.inHouse.avgDeliveryMinutes} min</span></div></div></div><div className="card-primary rounded-[2rem] border border-purple-200 dark:border-purple-800 shadow-xl p-6 bg-purple-50/30 dark:bg-purple-950/20"><h3 className="text-lg font-black text-purple-500 mb-4">🏢 3rd Party</h3><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-muted">Orders</span><span className="font-black text-main">{thirdPartyData.thirdParty.orderCount}</span></div><div className="flex justify-between"><span className="text-muted">Revenue</span><span className="font-black text-main">{thirdPartyData.thirdParty.revenue.toLocaleString()} LE</span></div></div></div></div>
                  </div>
               )}
               {activeCategory === 'OPS' && activeSubReport === '3rd Party vs In-House' && !thirdPartyData && <p className="text-center text-muted py-16">No data.</p>}

               {/* ============ PHASE 4: AI & PREDICTIVE ============ */}

               {activeCategory === 'AI' && activeSubReport === 'Daily Flash Report' && dailyFlashData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-2xl border border-blue-200 dark:border-blue-800 p-5 shadow-lg bg-blue-50/30 dark:bg-blue-950/20"><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">📊 Daily Flash — {dailyFlashData.date}</p></div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ l: 'Revenue', v: `${dailyFlashData.revenue.toLocaleString()} LE` }, { l: 'Orders', v: dailyFlashData.orderCount }, { l: 'Avg Ticket', v: `${dailyFlashData.avgTicket} LE` }, { l: 'Cancelled', v: dailyFlashData.cancelledOrders, c: 'text-rose-500' }, { l: 'Discounts', v: `${dailyFlashData.totalDiscount.toLocaleString()} LE`, c: 'text-amber-500' }, { l: 'Tips', v: `${dailyFlashData.totalTips.toLocaleString()} LE`, c: 'text-emerald-500' }].map((c: any, i: number) => (<div key={i} className="card-primary rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-lg"><p className="text-[10px] font-black uppercase tracking-widest text-muted">{c.l}</p><p className={`text-2xl font-black mt-1 ${c.c || 'text-main'}`}>{c.v}</p></div>))}</div>
                     <div className="grid grid-cols-2 gap-6"><div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl p-6"><h3 className="text-lg font-black text-main mb-3">By Type</h3>{dailyFlashData.byType.map((t: any, i: number) => (<div key={i} className="flex justify-between py-1.5 text-xs border-b border-border/20"><span className="font-black">{t.type}</span><span className="text-muted">{t.count} orders · {t.revenue.toLocaleString()} LE</span></div>))}</div><div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl p-6"><h3 className="text-lg font-black text-main mb-3">Payments</h3>{dailyFlashData.paymentMix.map((p: any, i: number) => (<div key={i} className="flex justify-between py-1.5 text-xs border-b border-border/20"><span className="font-black">{p.method}</span><span className="font-mono font-bold">{p.total.toLocaleString()} LE</span></div>))}</div></div>
                  </div>
               )}
               {activeCategory === 'AI' && activeSubReport === 'Daily Flash Report' && !dailyFlashData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'AI' && activeSubReport === 'Demand Forecasting' && demandForecastData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">🔮 Weekly Demand Forecast</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Day</th><th className="px-4 py-5 text-right">Avg Orders</th><th className="px-4 py-5 text-right">Avg Revenue</th><th className="px-4 py-5 text-right">Predicted Orders</th><th className="px-6 py-5 text-right">Predicted Revenue</th></tr></thead><tbody className="divide-y divide-border/30">{demandForecastData.weeklyForecast.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 text-xs font-black text-main">{r.dayOfWeek}</td><td className="px-4 py-4 font-mono text-right">{r.avgOrders}</td><td className="px-4 py-4 font-mono text-right">{r.avgRevenue.toLocaleString()} LE</td><td className="px-4 py-4 font-mono font-bold text-right text-blue-500">{r.predictedOrders}</td><td className="px-6 py-4 font-mono font-bold text-right text-blue-500">{r.predictedRevenue.toLocaleString()} LE</td></tr>)}</tbody></table></div></div>
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl p-6"><h3 className="text-lg font-black text-main mb-4">Top Items Demand (Daily Avg)</h3>{demandForecastData.topItemsDemand.map((t: any, i: number) => (<div key={i} className="flex justify-between py-1.5 text-xs border-b border-border/20"><span className="font-black text-main">{t.itemName}</span><span className="font-mono text-muted">{t.avgDailyQty}/day · {t.weeklyQty}/week</span></div>))}</div>
                  </div>
               )}
               {activeCategory === 'AI' && activeSubReport === 'Demand Forecasting' && !demandForecastData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'AI' && activeSubReport === 'Price Elasticity Simulator' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     {priceElasticityData.map((item: any, idx: number) => (<div key={idx} className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"><div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-sm font-black text-main">{item.itemName} <span className="text-muted font-normal">({item.currentPrice} LE · Cost: {item.cost} LE)</span></h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-4 text-right">Change</th><th className="px-4 py-4 text-right">Price</th><th className="px-4 py-4 text-right">Est. Qty</th><th className="px-4 py-4 text-right">Est. Revenue</th><th className="px-6 py-4 text-right">Est. Profit</th></tr></thead><tbody className="divide-y divide-border/30">{item.scenarios.map((s: any, si: number) => <tr key={si} className={`hover:bg-elevated/40 transition-colors ${s.change === 0 ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}><td className="px-6 py-3 font-mono text-right"><span className={s.change > 0 ? 'text-emerald-500' : s.change < 0 ? 'text-rose-500' : 'text-blue-500'}>{s.change > 0 ? '+' : ''}{s.change}%</span></td><td className="px-4 py-3 font-mono text-right">{Number(s.newPrice).toFixed(2)}</td><td className="px-4 py-3 font-mono text-right">{s.estQty}</td><td className="px-4 py-3 font-mono text-right">{s.estRevenue.toLocaleString()}</td><td className="px-6 py-3 font-mono font-bold text-right">{s.estProfit.toLocaleString()}</td></tr>)}</tbody></table></div></div>))}
                     {priceElasticityData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

               {activeCategory === 'AI' && activeSubReport === 'Anomaly Detection' && anomalyData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-rose-200 dark:border-rose-800 shadow-xl p-6 bg-rose-50/30 dark:bg-rose-950/20"><h3 className="text-lg font-black text-rose-500 mb-4">⚠️ High Discount Orders ({anomalyData.highDiscounts.length})</h3><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="text-muted text-[10px] uppercase font-black"><th className="px-4 py-3 text-left">Order #</th><th className="px-4 py-3 text-right">Discount</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">% Off</th></tr></thead><tbody>{anomalyData.highDiscounts.map((o: any, i: number) => <tr key={i} className="border-t border-rose-100 dark:border-rose-900/30"><td className="px-4 py-2 font-mono">{o.orderNumber}</td><td className="px-4 py-2 font-mono text-right text-rose-500">{Number(o.discount)}</td><td className="px-4 py-2 font-mono text-right">{Number(o.total)}</td><td className="px-4 py-2 font-mono text-right">{o.discountPercent}%</td></tr>)}</tbody></table></div></div>
                     <div className="card-primary rounded-[2rem] border border-amber-200 dark:border-amber-800 shadow-xl p-6 bg-amber-50/30 dark:bg-amber-950/20"><h3 className="text-lg font-black text-amber-500 mb-4">📅 High Cancel Days ({anomalyData.highCancelDays.length})</h3>{anomalyData.highCancelDays.map((d: any, i: number) => (<div key={i} className="flex justify-between py-1.5 text-xs border-b border-amber-100 dark:border-amber-900/30"><span className="font-black">{d.day}</span><span className="text-muted">{d.cancelledOrders}/{d.totalOrders} orders · <span className="text-rose-500 font-black">{d.cancelRate}% cancelled</span></span></div>))}</div>
                  </div>
               )}
               {activeCategory === 'AI' && activeSubReport === 'Anomaly Detection' && !anomalyData && <p className="text-center text-muted py-16">No data.</p>}

               {activeCategory === 'AI' && activeSubReport === 'Channel Mix Trend' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                     <div className="card-primary rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"><div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xl font-black text-main">Channel Mix Trend (Daily)</h3></div><div className="responsive-table"><table className="w-full text-xs"><thead><tr className="bg-elevated/20 text-muted text-[10px] uppercase font-black tracking-[0.2em]"><th className="px-6 py-5 text-left">Day</th><th className="px-4 py-5 text-left">Source</th><th className="px-4 py-5 text-right">Orders</th><th className="px-6 py-5 text-right">Revenue</th></tr></thead><tbody className="divide-y divide-border/30">{channelMixData.map((r: any, i: number) => <tr key={i} className="hover:bg-elevated/40 transition-colors"><td className="px-6 py-4 font-mono text-muted">{r.day}</td><td className="px-4 py-4 text-xs font-black text-main">{r.source}</td><td className="px-4 py-4 font-mono text-right">{r.count}</td><td className="px-6 py-4 font-mono font-bold text-right">{r.revenue.toLocaleString()} LE</td></tr>)}</tbody></table></div></div>
                     {channelMixData.length === 0 && <p className="text-center text-muted py-16">No data.</p>}
                  </div>
               )}

            </div>
         </div>
      </div>
   );
};

export default Reports;
