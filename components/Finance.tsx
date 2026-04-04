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
    <div className="p-4 md:p-8 lg:p-10 bg-app min-h-screen pb-24">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/30">
              <DollarSign size={28} />
            </div>
            <h2 className="text-3xl font-black text-main uppercase tracking-tighter">Finance & Accounting</h2>
          </div>
          <p className="text-muted font-bold text-xs uppercase tracking-widest opacity-60">Double-Entry Ledger · Reconciliation · Period Close</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setJournalModal(true)} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"><Plus size={14} /> Record Entry</button>
          <button onClick={() => setReconModal(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"><ShieldCheck size={14} /> Reconcile</button>
          <button onClick={() => setCloseModal(true)} className="bg-slate-800 dark:bg-slate-700 text-white px-5 py-2.5 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"><CalendarCheck2 size={14} /> Close Period</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-8 bg-elevated/40 p-1.5 rounded-2xl border border-border w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20' : 'text-muted hover:text-main hover:bg-elevated/60'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ DASHBOARD TAB ═══════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
          {/* Trial Balance Status */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="card-primary border border-border p-6 rounded-[2rem] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><Scale size={18} /></div>
              </div>
              <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Trial Balance Debit</p>
              <h4 className="text-2xl font-black text-main font-mono">{isLoading ? '...' : (trialBalance?.debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
            </div>
            <div className="card-primary border border-border p-6 rounded-[2rem] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center"><Scale size={18} /></div>
              </div>
              <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Trial Balance Credit</p>
              <h4 className="text-2xl font-black text-main font-mono">{isLoading ? '...' : (trialBalance?.credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
            </div>
            <div className="card-primary border border-border p-6 rounded-[2rem] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${trialBalance?.balanced ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} flex items-center justify-center`}>
                  {trialBalance?.balanced ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                </div>
              </div>
              <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Status</p>
              <h4 className={`text-2xl font-black ${trialBalance?.balanced ? 'text-emerald-500' : 'text-rose-500'}`}>{trialBalance?.balanced ? 'Balanced' : 'Unbalanced'}</h4>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Total Assets', value: financialSummary.assets, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Liabilities', value: financialSummary.liabilities, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
              { label: 'Equity', value: financialSummary.equity, icon: Layers, color: 'text-violet-500', bg: 'bg-violet-500/10' },
              { label: 'Revenue', value: financialSummary.revenue, icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Expenses', value: financialSummary.expenses, icon: ArrowDownRight, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Net Income', value: financialSummary.netIncome, icon: DollarSign, color: financialSummary.netIncome >= 0 ? 'text-emerald-500' : 'text-rose-500', bg: financialSummary.netIncome >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' },
            ].map((stat, i) => (
              <div key={i} className="card-primary border border-border p-5 rounded-[1.5rem] shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}><stat.icon size={14} /></div>
                <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                <h4 className="text-lg font-black text-main font-mono">{stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-primary border border-border p-6 rounded-[2rem] shadow-sm">
              <h3 className="text-xs font-black text-main uppercase mb-3 flex items-center gap-2"><History size={14} className="text-indigo-500" /> Recent Entries</h3>
              <p className="text-3xl font-black text-indigo-500">{transactions.length}</p>
              <p className="text-[9px] text-muted font-bold mt-1">Total journal entries</p>
            </div>
            <div className="card-primary border border-border p-6 rounded-[2rem] shadow-sm">
              <h3 className="text-xs font-black text-main uppercase mb-3 flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> Reconciliations</h3>
              <p className="text-3xl font-black text-emerald-500">{reconciliations.length}</p>
              <p className="text-[9px] text-muted font-bold mt-1">Pending: {reconciliations.filter((r: any) => r.status !== 'RESOLVED').length}</p>
            </div>
            <div className="card-primary border border-border p-6 rounded-[2rem] shadow-sm">
              <h3 className="text-xs font-black text-main uppercase mb-3 flex items-center gap-2"><CalendarCheck2 size={14} className="text-violet-500" /> Closed Periods</h3>
              <p className="text-3xl font-black text-violet-500">{periodCloses.length}</p>
              <p className="text-[9px] text-muted font-bold mt-1">Accounting cycles completed</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ COA TAB ═══════════ */}
      {activeTab === 'coa' && (
        <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
          <div className="p-6 border-b border-border bg-elevated/30 flex items-center justify-between gap-4">
            <h3 className="text-lg font-black text-main uppercase tracking-tight flex items-center gap-2"><BookText size={18} className="text-indigo-500" /> Chart of Accounts</h3>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-app border border-border rounded-xl font-bold text-xs outline-none focus:border-emerald-500 transition-colors" placeholder="Search accounts..." />
            </div>
          </div>
          <div className="max-h-[600px] overflow-auto">
            {accounts.map(acc => renderAccountRow(acc))}
          </div>
        </div>
      )}

      {/* ═══════════ JOURNAL TAB ═══════════ */}
      {activeTab === 'journal' && (
        <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-500 h-[70vh] flex flex-col">
          <div className="p-6 border-b border-border bg-elevated/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
            <h3 className="text-lg font-black text-main uppercase tracking-tight flex items-center gap-2"><History size={18} className="text-indigo-500" /> Journal Entries ({filteredTransactions.length})</h3>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none md:w-52">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                <input value={journalSearch} onChange={(e) => setJournalSearch(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-app border border-border rounded-xl font-bold text-xs outline-none focus:border-emerald-500 transition-colors" placeholder="Search entries..." />
              </div>
              <input type="date" value={journalDateFrom} onChange={e => setJournalDateFrom(e.target.value)} className="px-3 py-3 bg-app border border-border rounded-xl font-bold text-xs outline-none focus:border-indigo-500 transition-colors text-muted" title="From date" />
              <input type="date" value={journalDateTo} onChange={e => setJournalDateTo(e.target.value)} className="px-3 py-3 bg-app border border-border rounded-xl font-bold text-xs outline-none focus:border-indigo-500 transition-colors text-muted" title="To date" />
              {(journalDateFrom || journalDateTo) && (
                <button onClick={() => { setJournalDateFrom(''); setJournalDateTo(''); }} className="text-[9px] font-black text-rose-400 hover:text-rose-500 uppercase px-2">Clear</button>
              )}
            </div>
          </div>

          {/* Header */}
          <div className="grid grid-cols-[1fr_2fr_1.2fr_1.2fr_1fr] gap-4 px-6 py-4 bg-app/50 text-[9px] font-black uppercase text-muted tracking-[0.2em] border-b border-border/50 shrink-0">
            <div>Date</div>
            <div>Description</div>
            <div>Debit Account</div>
            <div>Credit Account</div>
            <div className="text-right">Amount</div>
          </div>

          <div className="flex-1 overflow-hidden min-h-0 bg-card/5">
            {isLoading && filteredTransactions.length === 0 ? (
              <div className="p-10 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <VirtualList
                itemCount={filteredTransactions.length}
                itemHeight={56}
                overscan={10}
                getKey={(idx) => filteredTransactions[idx].id}
                renderItem={(index) => {
                  const tx = filteredTransactions[index];
                  return (
                    <div className="grid grid-cols-[1fr_2fr_1.2fr_1.2fr_1fr] gap-4 px-6 items-center h-full hover:bg-elevated/20 transition-all border-b border-border/30">
                      <div className="font-mono text-[10px] text-muted">{new Date(tx.date).toLocaleDateString()}</div>
                      <div className="text-xs font-black text-main truncate pr-4" title={tx.description}>{tx.description}</div>
                      <div><span className="px-2 py-1 rounded-lg text-[9px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/10">{tx.debitAccountId}</span></div>
                      <div><span className="px-2 py-1 rounded-lg text-[9px] font-black bg-violet-500/10 text-violet-500 border border-violet-500/10">{tx.creditAccountId}</span></div>
                      <div className="text-right font-mono text-sm font-black text-main">{(Number(tx.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                  );
                }}
              />
            )}
            {filteredTransactions.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <History size={48} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">No journal entries found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ RECONCILIATION TAB ═══════════ */}
      {activeTab === 'reconciliation' && (
        <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
          <div className="p-6 border-b border-border bg-elevated/30 flex items-center justify-between">
            <h3 className="text-lg font-black text-main uppercase tracking-tight flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500" /> Reconciliations ({reconciliations.length})</h3>
            <button onClick={() => setReconModal(true)} className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase hover:bg-emerald-500/20 transition-colors flex items-center gap-2"><Plus size={14} /> New</button>
          </div>
          <div className="responsive-table">
            <table className="w-full text-left">
              <thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-4">Account</th>
                  <th className="px-4 py-4">Statement Date</th>
                  <th className="px-4 py-4 text-right">Statement Balance</th>
                  <th className="px-4 py-4 text-right">Difference</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {reconciliations.map((r: any) => (
                  <tr key={r.id} className="hover:bg-elevated/20 transition-all">
                    <td className="px-6 py-4 font-mono text-xs font-black text-main">{r.accountCode}</td>
                    <td className="px-4 py-4 text-[10px] text-muted">{new Date(r.statementDate).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs font-bold text-main">{Number(r.statementBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`px-4 py-4 text-right font-mono text-xs font-bold ${Number(r.difference || 0) !== 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{Number(r.difference || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-4"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-black ${r.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{r.status}</span></td>
                    <td className="px-6 py-4 text-center">
                      {r.status !== 'RESOLVED' && (
                        <button onClick={() => resolveReconciliation(r.id, { adjustWithJournal: true, adjustmentAccountCode: '5110' })} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase hover:bg-emerald-500/20">Resolve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reconciliations.length === 0 && <p className="text-center text-muted py-16 text-sm">No reconciliations yet.</p>}
        </div>
      )}

      {/* ═══════════ CLOSED PERIODS TAB ═══════════ */}
      {activeTab === 'periods' && (
        <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
          <div className="p-6 border-b border-border bg-elevated/30 flex items-center justify-between">
            <h3 className="text-lg font-black text-main uppercase tracking-tight flex items-center gap-2"><CalendarCheck2 size={18} className="text-violet-500" /> Closed Periods ({periodCloses.length})</h3>
            <button onClick={() => setCloseModal(true)} className="px-4 py-2 rounded-xl bg-violet-500/10 text-violet-600 text-[10px] font-black uppercase hover:bg-violet-500/20 transition-colors flex items-center gap-2"><Plus size={14} /> Close Period</button>
          </div>
          <div className="responsive-table">
            <table className="w-full text-left">
              <thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-4 py-4 text-right">TB Debit</th>
                  <th className="px-4 py-4 text-right">TB Credit</th>
                  <th className="px-6 py-4">Balanced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {periodCloses.map((p: any) => (
                  <tr key={p.id} className="hover:bg-elevated/20 transition-all">
                    <td className="px-6 py-4 text-xs font-black text-main">{new Date(p.periodStart).toLocaleDateString()} → {new Date(p.periodEnd).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs font-bold text-main">{Number(p.trialBalance?.debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs font-bold text-main">{Number(p.trialBalance?.credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-emerald-500/10 text-emerald-500">CLOSED</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {periodCloses.length === 0 && <p className="text-center text-muted py-16 text-sm">No closed periods yet.</p>}
        </div>
      )}

      {/* ═══════════ JOURNAL ENTRY MODAL ═══════════ */}
      {journalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setJournalModal(false)}>
          <div className="bg-card border border-border rounded-[2rem] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-black text-main">Manual Journal Entry</h3>
              <button onClick={() => setJournalModal(false)} className="p-2 text-muted hover:text-main"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Description</label>
                <input className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-emerald-500 text-main" placeholder="Transaction description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Amount</label>
                <input type="number" className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-emerald-500 text-main" placeholder="0.00" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value || 0) })} />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Debit Account</label>
                <select className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none text-main" value={form.debit} onChange={(e) => setForm({ ...form, debit: e.target.value })}>{flatAccounts.map(a => <option key={`d-${a.id}`} value={a.code}>{a.code} - {a.name}</option>)}</select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Credit Account</label>
                <select className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none text-main" value={form.credit} onChange={(e) => setForm({ ...form, credit: e.target.value })}>{flatAccounts.map(a => <option key={`c-${a.id}`} value={a.code}>{a.code} - {a.name}</option>)}</select>
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button onClick={() => setJournalModal(false)} className="flex-1 px-4 py-3 bg-app border border-border rounded-xl text-xs font-black text-muted uppercase tracking-widest">Cancel</button>
              <button onClick={submitManualEntry} className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"><Save size={14} /> Post Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ RECONCILIATION MODAL ═══════════ */}
      {reconModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReconModal(false)}>
          <div className="bg-card border border-border rounded-[2rem] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-black text-main">Create Reconciliation</h3>
              <button onClick={() => setReconModal(false)} className="p-2 text-muted hover:text-main"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Account</label>
                <select className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none text-main" value={reconForm.accountCode} onChange={(e) => setReconForm({ ...reconForm, accountCode: e.target.value })}>{flatAccounts.map(a => <option key={`r-${a.id}`} value={a.code}>{a.code} - {a.name}</option>)}</select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Statement Date</label>
                <input type="date" className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none text-main" value={reconForm.statementDate} onChange={(e) => setReconForm({ ...reconForm, statementDate: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Statement Balance</label>
                <input type="number" className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none text-main" value={reconForm.statementBalance || ''} onChange={(e) => setReconForm({ ...reconForm, statementBalance: Number(e.target.value || 0) })} />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Notes</label>
                <input className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none text-main" placeholder="Optional" value={reconForm.notes} onChange={(e) => setReconForm({ ...reconForm, notes: e.target.value })} />
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button onClick={() => setReconModal(false)} className="flex-1 px-4 py-3 bg-app border border-border rounded-xl text-xs font-black text-muted uppercase tracking-widest">Cancel</button>
              <button onClick={submitReconciliation} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"><Save size={14} /> Create</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ P&L TAB ═══════════ */}
      {activeTab === 'pnl' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
          <div className="flex flex-wrap items-center gap-4">
            <input type="date" value={pnlDateFrom} onChange={(e) => setPnlDateFrom(e.target.value)} className="px-4 py-2.5 bg-app border border-border rounded-xl text-xs font-bold text-main" />
            <span className="text-muted text-xs font-bold">→</span>
            <input type="date" value={pnlDateTo} onChange={(e) => setPnlDateTo(e.target.value)} className="px-4 py-2.5 bg-app border border-border rounded-xl text-xs font-bold text-main" />
            <button onClick={loadPnl} disabled={pnlLoading} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all active:scale-95">
              <TrendingUp size={14} /> {pnlLoading ? '...' : 'Generate'}
            </button>
          </div>

          {pnlData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-primary border border-border p-6 rounded-[2rem] shadow-sm">
                  <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Revenue</p>
                  <h3 className="text-3xl font-black text-emerald-500">{pnlData.revenue.toLocaleString()} <span className="text-sm">LE</span></h3>
                </div>
                <div className="card-primary border border-border p-6 rounded-[2rem] shadow-sm">
                  <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Expenses</p>
                  <h3 className="text-3xl font-black text-rose-500">{pnlData.expenses.toLocaleString()} <span className="text-sm">LE</span></h3>
                </div>
                <div className="card-primary border border-border p-6 rounded-[2rem] shadow-sm">
                  <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Net Profit</p>
                  <h3 className={`text-3xl font-black ${pnlData.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{pnlData.netProfit.toLocaleString()} <span className="text-sm">LE</span></h3>
                </div>
              </div>

              {pnlData.details.length > 0 && (
                <div className="card-primary border border-border rounded-[2rem] shadow-sm overflow-hidden">
                  <div className="responsive-table">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-elevated/30 text-muted text-[10px] uppercase font-black tracking-[0.2em]">
                          <th className="px-6 py-4">Account</th>
                          <th className="px-4 py-4">Type</th>
                          <th className="px-4 py-4 text-right">Debit</th>
                          <th className="px-4 py-4 text-right">Credit</th>
                          <th className="px-6 py-4 text-right">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {pnlData.details.map((d, idx) => (
                          <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                            <td className="px-6 py-3 text-xs font-black text-main">{d.name}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${d.type === 'REVENUE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{d.type}</span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-right tabular-nums">{d.debit.toLocaleString()}</td>
                            <td className="px-4 py-3 font-mono text-xs text-right tabular-nums">{d.credit.toLocaleString()}</td>
                            <td className={`px-6 py-3 font-mono text-xs font-black text-right tabular-nums ${d.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{d.net.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {!pnlData && !pnlLoading && (
            <div className="text-center py-16">
              <TrendingUp size={48} className="mx-auto text-muted/30 mb-4" />
              <p className="text-muted font-bold text-sm">Select date range and click Generate</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ CLOSE PERIOD MODAL ═══════════ */}
      {closeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCloseModal(false)}>
          <div className="bg-card border border-border rounded-[2rem] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-black text-main">Close Accounting Period</h3>
              <button onClick={() => setCloseModal(false)} className="p-2 text-muted hover:text-main"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
                ⚠️ This action is irreversible. All transactions in this period will be locked.
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Period Start</label>
                <input type="date" className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none text-main" value={closeForm.periodStart} onChange={(e) => setCloseForm({ ...closeForm, periodStart: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 block">Period End</label>
                <input type="date" className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none text-main" value={closeForm.periodEnd} onChange={(e) => setCloseForm({ ...closeForm, periodEnd: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-1 block">Type CLOSE to confirm</label>
                <input className="w-full px-4 py-3 bg-app border-2 border-rose-500/30 rounded-xl text-xs font-bold outline-none text-main focus:border-rose-500 transition-colors" placeholder="CLOSE" value={closeConfirmText} onChange={(e) => setCloseConfirmText(e.target.value)} />
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button onClick={() => { setCloseModal(false); setCloseConfirmText(''); }} className="flex-1 px-4 py-3 bg-app border border-border rounded-xl text-xs font-black text-muted uppercase tracking-widest">Cancel</button>
              <button onClick={submitPeriodClose} disabled={closeConfirmText !== 'CLOSE'} className="flex-1 px-4 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"><CalendarCheck2 size={14} /> Close Period</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
