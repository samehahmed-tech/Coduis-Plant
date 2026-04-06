import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet, Plus, Search, ChevronRight, ChevronDown, History, BookText,
  ShieldCheck, CalendarCheck2, X, Save, TrendingUp, TrendingDown,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Layers, Scale,
  FileText, DollarSign, Building2, RefreshCw, AlertTriangle
} from 'lucide-react';
import { FinancialAccount } from '../types';
import { useFinanceStore } from '../stores/useFinanceStore';
import ExportButton from './common/ExportButton';
import { useToast } from './Toast';
import { reportsApi } from '../services/api/reports';

// Shared Components
import VirtualList from './common/VirtualList';
import PageSkeleton from './common/PageSkeleton';
import Skeleton from './common/Skeleton';

type FinanceTab = 'dashboard' | 'coa' | 'journal' | 'reconciliation' | 'periods' | 'pnl';

const TABS: { id: FinanceTab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'pnl', label: 'P&L', icon: TrendingUp },
  { id: 'coa', label: 'Chart of Accounts', icon: BookText },
  { id: 'journal', label: 'Journal', icon: History },
  { id: 'reconciliation', label: 'Reconciliation', icon: ShieldCheck },
  { id: 'periods', label: 'Closed Periods', icon: CalendarCheck2 },
];

const FinanceMetric: React.FC<{
  label: string;
  value: any;
  icon: any;
  color: string;
  lang?: string;
}> = ({ label, value, icon: Icon, color, lang }) => (
  <div className="relative group overflow-hidden bg-card/60 backdrop-blur-xl border border-border/30 rounded-[1.5rem] p-5 lg:p-6 transition-all hover:scale-[1.02] hover:bg-card/70 hover:shadow-2xl hover:shadow-black/5 active:scale-[0.98]">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br transition-opacity duration-500 opacity-20 group-hover:opacity-30 blur-3xl`} style={{ background: color }} />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.15em] text-muted mb-2">{label}</p>
        <h2 className="text-xl lg:text-3xl font-black text-main tracking-tighter tabular-nums">
          {value}
        </h2>
      </div>
      <div className={`p-4 rounded-2xl border flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12`} style={{ borderColor: `${color}30`, backgroundColor: `${color}15`, color }}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const Finance: React.FC = () => {
  const {
    accounts, transactions, fetchFinanceData, trialBalance, isLoading,
    recordTransaction, reconciliations, periodCloses, createReconciliation,
    resolveReconciliation, closePeriod,
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [journalSearch, setJournalSearch] = useState('');
  const [journalDateFrom, setJournalDateFrom] = useState('');
  const [journalDateTo, setJournalDateTo] = useState('');
  const [journalModal, setJournalModal] = useState(false);
  const [reconModal, setReconModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [form, setForm] = useState({ description: '', amount: 0, debit: '1110', credit: '4100' });
  const [reconForm, setReconForm] = useState({ accountCode: '1110', statementDate: new Date().toISOString().slice(0, 10), statementBalance: 0, notes: '' });
  const [closeForm, setCloseForm] = useState({ periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), periodEnd: new Date().toISOString().slice(0, 10) });
  const [closeConfirmText, setCloseConfirmText] = useState('');
  const { showToast } = useToast();

  // P&L state
  const [pnlData, setPnlData] = useState<{ revenue: number; expenses: number; netProfit: number; details: { type: string; name: string; debit: number; credit: number; net: number }[] } | null>(null);
  const [pnlLoading, setPnlLoading] = useState(false);
  const [pnlDateFrom, setPnlDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [pnlDateTo, setPnlDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const loadPnl = async () => {
    setPnlLoading(true);
    try {
      const data = await reportsApi.getProfitAndLoss({ startDate: pnlDateFrom, endDate: pnlDateTo });
      setPnlData(data);
    } catch (e) { console.error(e); }
    setPnlLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'pnl' && !pnlData) loadPnl();
  }, [activeTab]);

  useEffect(() => { fetchFinanceData(); }, [fetchFinanceData]);

  const flatAccounts = useMemo(() => {
    const out: FinancialAccount[] = [];
    const walk = (arr: FinancialAccount[]) => { arr.forEach(a => { out.push(a); if (a.children?.length) walk(a.children); }); };
    walk(accounts);
    return out;
  }, [accounts]);

  // Compute financial summaries
  const financialSummary = useMemo(() => {
    const assets = flatAccounts.filter(a => a.code?.startsWith('1')).reduce((s, a) => s + Number(a.balance || 0), 0);
    const liabilities = flatAccounts.filter(a => a.code?.startsWith('2')).reduce((s, a) => s + Number(a.balance || 0), 0);
    const equity = flatAccounts.filter(a => a.code?.startsWith('3')).reduce((s, a) => s + Number(a.balance || 0), 0);
    const revenue = flatAccounts.filter(a => a.code?.startsWith('4')).reduce((s, a) => s + Number(a.balance || 0), 0);
    const expenses = flatAccounts.filter(a => a.code?.startsWith('5')).reduce((s, a) => s + Number(a.balance || 0), 0);
    const netIncome = revenue - expenses;
    return { assets, liabilities, equity, revenue, expenses, netIncome };
  }, [flatAccounts]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (journalSearch) {
      result = result.filter(tx =>
        `${tx.description} ${tx.debitAccountId} ${tx.creditAccountId}`.toLowerCase().includes(journalSearch.toLowerCase())
      );
    }
    if (journalDateFrom) {
      const from = new Date(journalDateFrom);
      result = result.filter(tx => new Date(tx.date) >= from);
    }
    if (journalDateTo) {
      const to = new Date(journalDateTo); to.setHours(23, 59, 59);
      result = result.filter(tx => new Date(tx.date) <= to);
    }
    return result;
  }, [transactions, journalSearch, journalDateFrom, journalDateTo]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedAccounts);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedAccounts(next);
  };

  const renderAccountRow = (account: FinancialAccount, level = 0): React.ReactNode => {
    const hasChildren = Boolean(account.children && account.children.length > 0);
    const isExpanded = expandedAccounts.has(account.id);
    const matches = `${account.code} ${account.name}`.toLowerCase().includes(search.toLowerCase());
    if (!matches && search && !hasChildren) return null;
    return (
      <React.Fragment key={account.id}>
        <div className={`flex items-center justify-between px-4 py-3 border-b border-border/50 hover:bg-elevated/20 transition-all ${level === 0 ? 'bg-app/30' : ''}`}
          style={{ paddingLeft: `${level * 1.25 + 1}rem` }}>
          <button className="flex items-center gap-2 text-left" onClick={() => hasChildren && toggleExpand(account.id)}>
            {hasChildren ? (isExpanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />) : <span className="w-[14px]" />}
            <span className="font-mono text-[10px] font-black text-muted w-12">{account.code}</span>
            <span className="text-xs font-black text-main uppercase">{account.name}</span>
          </button>
          <span className={`font-mono text-xs font-black ${Number(account.balance || 0) < 0 ? 'text-rose-500' : 'text-main'}`}>
            {Number(account.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        {hasChildren && isExpanded && account.children!.map(c => renderAccountRow(c, level + 1))}
      </React.Fragment>
    );
  };

  const submitManualEntry = async () => {
    if (!form.description || form.amount <= 0) return;
    await recordTransaction({ date: new Date(), description: form.description, debitAccountId: form.debit, creditAccountId: form.credit, amount: Number(form.amount), referenceId: undefined });
    setJournalModal(false);
    setForm({ description: '', amount: 0, debit: '1110', credit: '4100' });
  };

  const submitReconciliation = async () => {
    await createReconciliation({ accountCode: reconForm.accountCode, statementDate: new Date(reconForm.statementDate).toISOString(), statementBalance: Number(reconForm.statementBalance || 0), notes: reconForm.notes || undefined });
    setReconModal(false);
    setReconForm({ accountCode: '1110', statementDate: new Date().toISOString().slice(0, 10), statementBalance: 0, notes: '' });
  };

  const submitPeriodClose = async () => {
    if (closeConfirmText !== 'CLOSE') return;
    await closePeriod({ periodStart: new Date(closeForm.periodStart).toISOString(), periodEnd: new Date(closeForm.periodEnd).toISOString() });
    setCloseModal(false);
    setCloseConfirmText('');
    showToast('Period closed successfully', 'success');
  };

  return (
    <div className="relative min-h-screen bg-app overflow-hidden selection:bg-indigo-500/30">
      {/* Visual Effects Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-500/5 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 p-4 lg:p-10 space-y-8 max-w-[1920px] mx-auto overflow-y-auto max-h-screen custom-scrollbar pb-32">
        {/* Header */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-8 border-b border-border/20">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-indigo-600 to-violet-600 p-0.5 shadow-2xl shadow-indigo-600/20">
              <div className="w-full h-full rounded-[1.6rem] bg-card flex items-center justify-center">
                <DollarSign size={36} className="text-indigo-600 animate-pulse-soft" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl lg:text-5xl font-black text-main tracking-tighter uppercase flex items-center gap-4">
                {activeTab === 'dashboard' ? 'Financial Nexus' : activeTab.toUpperCase()}
                <span className="hidden md:flex px-3 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Secure Ledger
                </span>
              </h1>
              <p className="text-muted font-bold text-xs uppercase tracking-[0.2em] mt-2 opacity-60">
                Real-time financial reconciliation · Enterprise Auditing · Multi-Branch GL
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <button
                onClick={() => setJournalModal(true)}
                className="h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 rounded-2xl shadow-2xl shadow-indigo-600/30 font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={18} /> RECORD ENTRY
              </button>
              <button
                onClick={() => setReconModal(true)}
                className="h-14 flex items-center justify-center gap-3 bg-card/60 backdrop-blur-md text-emerald-500 px-8 rounded-2xl border border-border/30 font-black text-[11px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-lg"
              >
                <ShieldCheck size={18} /> RECONCILE
              </button>
              <button
                onClick={() => setCloseModal(true)}
                className="h-14 flex items-center justify-center gap-3 bg-slate-900 text-white px-8 rounded-2xl hover:bg-black transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 shadow-xl"
              >
                <CalendarCheck2 size={18} /> CLOSE PERIOD
              </button>
          </div>
        </header>

        {/* ── Row 1: Finance KPI's ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <FinanceMetric 
            label="Trial Balance Debit"
            value={(trialBalance?.debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            icon={Scale}
            color="#6366f1"
          />
          <FinanceMetric 
            label="Trial Balance Credit"
            value={(trialBalance?.credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            icon={Scale}
            color="#8b5cf6"
          />
          <FinanceMetric 
            label="Net Income (MTD)"
            value={financialSummary.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            icon={financialSummary.netIncome >= 0 ? TrendingUp : TrendingDown}
            color={financialSummary.netIncome >= 0 ? "#10b981" : "#f43f5e"}
          />
          <FinanceMetric 
            label="System Status"
            value={trialBalance?.balanced ? 'BALANCED' : 'UNBALANCED'}
            icon={trialBalance?.balanced ? ShieldCheck : AlertTriangle}
            color={trialBalance?.balanced ? "#10b981" : "#f59e0b"}
          />
        </section>

        {/* Tabs Navigation */}
        <div className="flex flex-col xl:flex-row justify-between items-stretch lg:items-center gap-6 relative z-20">
          <div className="flex bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/30 p-2 overflow-x-auto no-scrollbar w-fit">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/20 scale-105' : 'text-muted hover:text-main hover:bg-elevated/60'}`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted w-5 h-5 group-focus-within:text-indigo-500 transition-colors z-10" />
            <input
              type="text"
              placeholder="Search audit ledger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] outline-none focus:border-indigo-500/50 transition-all font-bold text-sm text-main placeholder:text-muted/40 shadow-xl"
            />
          </div>
        </div>

        {/* Main Content View */}
        <div className="bg-card/60 backdrop-blur-3xl rounded-[3.5rem] border border-border/20 overflow-hidden min-h-[600px] relative z-20 shadow-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5 opacity-50 pointer-events-none" />

          {activeTab === 'dashboard' && (
            <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
                {[
                  { label: 'Asset Total', value: financialSummary.assets, icon: Wallet, color: 'indigo' },
                  { label: 'Liabilities', value: financialSummary.liabilities, icon: TrendingDown, color: 'rose' },
                  { label: 'Equity Balance', value: financialSummary.equity, icon: Layers, color: 'violet' },
                  { label: 'Revenue MTD', value: financialSummary.revenue, icon: ArrowUpRight, color: 'emerald' },
                  { label: 'Expense MTD', value: financialSummary.expenses, icon: ArrowDownRight, color: 'amber' },
                  { label: 'Net Surplus', value: financialSummary.netIncome, icon: DollarSign, color: financialSummary.netIncome >= 0 ? 'emerald' : 'rose' },
                ].map((stat, i) => (
                  <div key={i} className="bg-card/40 backdrop-blur-md border border-border/30 p-6 rounded-[2rem] shadow-xl hover:translate-y--2 transition-all group overflow-hidden relative">
                    <div className={`absolute top-0 right-0 w-16 h-16 bg-${stat.color}-500/10 blur-2xl group-hover:scale-150 transition-transform`} />
                    <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500 flex items-center justify-center mb-5 group-hover:rotate-12 transition-transform shadow-lg border border-${stat.color}-500/10`}><stat.icon size={18} /></div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 opacity-50">{stat.label}</p>
                    <h4 className="text-xl font-black text-main font-mono tabular-nums">{stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                  </div>
                ))}
              </div>

              {/* Reconciliation & Cycles */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                 <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-[2.5rem] p-8 shadow-xl">
                    <h3 className="text-lg font-black text-main uppercase mb-8 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><History size={20} /></div>
                      Recent Ledger Activity
                    </h3>
                    <div className="space-y-4">
                       {transactions.slice(0, 5).map(tx => (
                          <div key={tx.id} className="flex items-center justify-between p-4 bg-app/40 rounded-2xl border border-border/20 hover:bg-app transition-colors group">
                             <div>
                                <p className="text-xs font-black text-main uppercase pr-4">{tx.description}</p>
                                <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-widest opacity-60">{tx.debitAccountId} <span className="text-indigo-500/50 mx-1">→</span> {tx.creditAccountId}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-lg font-mono font-black text-main tabular-nums">{tx.amount.toLocaleString()}</p>
                                <p className="text-[9px] text-muted font-bold uppercase mt-1">{new Date(tx.date).toLocaleDateString()}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl group-hover:scale-150 transition-all" />
                      <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-4">Pending Audits</p>
                        <p className="text-6xl font-black text-emerald-500 tracking-tighter tabular-nums">{reconciliations.filter((r: any) => r.status !== 'RESOLVED').length}</p>
                      </div>
                      <div className="w-full h-2 bg-emerald-500/10 rounded-full mt-8 overflow-hidden">
                         <div className="h-full bg-emerald-500 shadow-lg shadow-emerald-500/20" style={{ width: '40%' }} />
                      </div>
                    </div>
                    <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl group-hover:scale-150 transition-all" />
                      <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-4">Cycle Stability</p>
                        <p className="text-6xl font-black text-violet-500 tracking-tighter tabular-nums">100%</p>
                      </div>
                      <p className="text-[10px] text-muted font-black mt-8 uppercase tracking-widest opacity-60">Verified Integrity</p>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Render other tabs here... */}
          {activeTab === 'coa' && (
            <div className="p-8 animate-in slide-in-from-bottom-5 duration-500">
               <div className="bg-app/40 rounded-[2.5rem] border border-border/30 overflow-hidden shadow-2xl">
                 <div className="p-8 border-b border-border/20 flex items-center justify-between bg-elevated/30">
                   <h3 className="text-xl font-black text-main uppercase tracking-tighter flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20"><BookText size={24} /></div>
                     Chart of Accounts
                   </h3>
                 </div>
                 <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                   {accounts.map(acc => renderAccountRow(acc))}
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals... */}
      {journalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setJournalModal(false)}>
          <div className="bg-card border border-border/50 rounded-[3rem] w-full max-w-xl shadow-3xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-10" />
            <div className="p-8 border-b border-border/20 flex items-center justify-between bg-elevated/30">
              <div>
                <h3 className="text-2xl font-black text-main tracking-tighter uppercase">Manual Entry</h3>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Authorized Double-Entry Ledger Posting</p>
              </div>
              <button onClick={() => setJournalModal(false)} className="w-12 h-12 rounded-2xl bg-elevated/50 flex items-center justify-center text-muted hover:text-rose-500 transition-all border border-border/20 shadow-lg"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted pl-1">Description</label>
                  <input className="w-full px-6 py-5 bg-app/50 border border-border/40 rounded-2xl text-sm font-black text-main outline-none focus:border-indigo-500/50 shadow-inner focus:bg-app transition-all" placeholder="Enter transaction purpose..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted pl-1">Amount (LE)</label>
                  <input type="number" className="w-full px-6 py-5 bg-app/50 border border-border/40 rounded-2xl text-sm font-black text-main outline-none focus:border-indigo-500/50 shadow-inner focus:bg-app transition-all tabular-nums" placeholder="0.00" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value || 0) })} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted pl-1">Post Date</label>
                  <div className="px-6 py-5 bg-app/50 border border-border/40 rounded-2xl text-sm font-black text-muted shadow-inner">{new Date().toLocaleDateString()}</div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted pl-1">Debit Origin</label>
                  <select className="w-full px-6 py-5 bg-app/50 border border-border/40 rounded-2xl text-xs font-black text-main outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer" value={form.debit} onChange={(e) => setForm({ ...form, debit: e.target.value })}>{flatAccounts.map(a => <option key={`d-${a.id}`} value={a.code}>{a.code} · {a.name}</option>)}</select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted pl-1">Credit Destination</label>
                  <select className="w-full px-6 py-5 bg-app/50 border border-border/40 rounded-2xl text-xs font-black text-main outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer" value={form.credit} onChange={(e) => setForm({ ...form, credit: e.target.value })}>{flatAccounts.map(a => <option key={`c-${a.id}`} value={a.code}>{a.code} · {a.name}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-border/20 bg-elevated/30 flex gap-4">
              <button onClick={() => setJournalModal(false)} className="flex-1 h-16 bg-app border border-border rounded-2xl text-[10px] font-black text-muted uppercase tracking-widest hover:bg-border transition-all">ABORT</button>
              <button onClick={submitManualEntry} className="flex-[2] h-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all">
                <Plus size={18} /> COMMIT TO LEDGER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recon Modal... simplified update */}
      {reconModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setReconModal(false)}>
          <div className="bg-card border border-border/50 rounded-[3rem] w-full max-w-xl shadow-3xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] -z-10" />
             <div className="p-8 border-b border-border/20 flex items-center justify-between bg-elevated/30">
               <div>
                 <h3 className="text-2xl font-black text-main tracking-tighter uppercase">Audit Reconciliation</h3>
                 <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Aligning Internal Ledger with External Statements</p>
               </div>
               <button onClick={() => setReconModal(false)} className="w-12 h-12 rounded-2xl bg-elevated/50 flex items-center justify-center text-muted hover:text-rose-500 transition-all border border-border/20"><X size={20} /></button>
             </div>
             <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="col-span-2 space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted pl-1">Target Account</label>
                     <select className="w-full px-6 py-5 bg-app/50 border border-border/40 rounded-2xl text-sm font-black text-main outline-none focus:border-emerald-500/50 appearance-none transition-all" value={reconForm.accountCode} onChange={(e) => setReconForm({ ...reconForm, accountCode: e.target.value })}>{flatAccounts.map(a => <option key={`r-${a.id}`} value={a.code}>{a.code} · {a.name}</option>)}</select>
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted pl-1">Statement Date</label>
                     <input type="date" className="w-full px-6 py-5 bg-app/50 border border-border/40 rounded-2xl text-sm font-black text-main outline-none focus:border-emerald-500/50 transition-all" value={reconForm.statementDate} onChange={(e) => setReconForm({ ...reconForm, statementDate: e.target.value })} />
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted pl-1">Reported Balance</label>
                     <input type="number" className="w-full px-6 py-5 bg-app/50 border border-border/40 rounded-2xl text-sm font-black text-main outline-none focus:border-emerald-500/50 transition-all tabular-nums" value={reconForm.statementBalance || ''} onChange={(e) => setReconForm({ ...reconForm, statementBalance: Number(e.target.value || 0) })} />
                   </div>
                </div>
             </div>
             <div className="p-8 border-t border-border/20 bg-elevated/30 flex gap-4">
               <button onClick={() => setReconModal(false)} className="flex-1 h-16 bg-app border border-border rounded-2xl text-[10px] font-black text-muted uppercase tracking-widest hover:bg-border transition-all">ABORT</button>
               <button onClick={submitReconciliation} className="flex-[2] h-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all">
                 <ShieldCheck size={18} /> GENERATE AUDIT
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
