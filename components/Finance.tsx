import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  History,
  BookText,
  ShieldCheck,
  CalendarCheck2,
} from 'lucide-react';
import { FinancialAccount } from '../types';
import { useFinanceStore } from '../stores/useFinanceStore';

const Finance: React.FC = () => {
  const {
    accounts,
    transactions,
    fetchFinanceData,
    trialBalance,
    isLoading,
    recordTransaction,
    reconciliations,
    periodCloses,
    createReconciliation,
    resolveReconciliation,
    closePeriod,
  } = useFinanceStore();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [journalModal, setJournalModal] = useState(false);
  const [reconModal, setReconModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [form, setForm] = useState({
    description: '',
    amount: 0,
    debit: '1110',
    credit: '4100',
  });
  const [reconForm, setReconForm] = useState({
    accountCode: '1110',
    statementDate: new Date().toISOString().slice(0, 10),
    statementBalance: 0,
    notes: '',
  });
  const [closeForm, setCloseForm] = useState({
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    periodEnd: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const flatAccounts = useMemo(() => {
    const out: FinancialAccount[] = [];
    const walk = (arr: FinancialAccount[]) => {
      arr.forEach(a => {
        out.push(a);
        if (a.children?.length) walk(a.children);
      });
    };
    walk(accounts);
    return out;
  }, [accounts]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedAccounts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedAccounts(next);
  };

  const renderAccountRow = (account: FinancialAccount, level = 0) => {
    const hasChildren = Boolean(account.children && account.children.length > 0);
    const isExpanded = expandedAccounts.has(account.id);
    const matches = `${account.code} ${account.name}`.toLowerCase().includes(search.toLowerCase());

    if (!matches && search && !hasChildren) return null;

    return (
      <React.Fragment key={account.id}>
        <div
          className={`flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${level === 0 ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''}`}
          style={{ paddingLeft: `${level * 1.25 + 1}rem` }}
        >
          <button className="flex items-center gap-2 text-left" onClick={() => hasChildren && toggleExpand(account.id)}>
            {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-[14px]" />}
            <span className="font-mono text-[10px] font-black text-slate-400 w-12">{account.code}</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase">{account.name}</span>
          </button>
          <span className={`font-mono text-xs font-black ${account.balance < 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
            {Number(account.balance || 0).toFixed(2)}
          </span>
        </div>
        {hasChildren && isExpanded && account.children!.map(c => renderAccountRow(c, level + 1))}
      </React.Fragment>
    );
  };

  const submitManualEntry = async () => {
    if (!form.description || form.amount <= 0) return;
    await recordTransaction({
      date: new Date(),
      description: form.description,
      debitAccountId: form.debit,
      creditAccountId: form.credit,
      amount: Number(form.amount),
      referenceId: undefined,
    });
    setJournalModal(false);
    setForm({ description: '', amount: 0, debit: '1110', credit: '4100' });
  };

  const submitReconciliation = async () => {
    await createReconciliation({
      accountCode: reconForm.accountCode,
      statementDate: new Date(reconForm.statementDate).toISOString(),
      statementBalance: Number(reconForm.statementBalance || 0),
      notes: reconForm.notes || undefined,
    });
    setReconModal(false);
    setReconForm({
      accountCode: '1110',
      statementDate: new Date().toISOString().slice(0, 10),
      statementBalance: 0,
      notes: '',
    });
  };

  const submitPeriodClose = async () => {
    await closePeriod({
      periodStart: new Date(closeForm.periodStart).toISOString(),
      periodEnd: new Date(closeForm.periodEnd).toISOString(),
    });
    setCloseModal(false);
  };

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase">Finance Engine</h2>
          <p className="text-sm text-slate-500 font-semibold">Backend-driven double-entry ledger.</p>
        </div>
        <button
          onClick={() => setJournalModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs"
        >
          <Plus size={16} />
          Record Entry
        </button>
        <button
          onClick={() => setReconModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs"
        >
          <ShieldCheck size={16} />
          Reconcile
        </button>
        <button
          onClick={() => setCloseModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs"
        >
          <CalendarCheck2 size={16} />
          Close Period
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase">Trial Balance Debit</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{isLoading ? '...' : (trialBalance?.debit || 0).toFixed(2)}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase">Trial Balance Credit</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{isLoading ? '...' : (trialBalance?.credit || 0).toFixed(2)}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase">Status</p>
          <h3 className={`text-2xl font-black mt-1 ${trialBalance?.balanced ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trialBalance?.balanced ? 'Balanced' : 'Unbalanced'}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <BookText size={20} className="text-indigo-600" />
              Chart of Accounts
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                placeholder="Search accounts..."
              />
            </div>
          </div>
          <div className="max-h-[560px] overflow-auto">
            {accounts.map(acc => renderAccountRow(acc))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <History size={20} className="text-indigo-600" />
              Journal
            </h3>
          </div>
          <div className="max-h-[560px] overflow-auto p-4 space-y-3">
            {transactions.length === 0 && (
              <div className="p-4 text-sm text-slate-400">No entries yet.</div>
            )}
            {transactions.map(tx => (
              <div key={tx.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100">{tx.description}</p>
                  <span className="text-[10px] font-black text-indigo-600">{tx.amount.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{tx.debitAccountId} {'->'} {tx.creditAccountId}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(tx.date).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Reconciliations</h3>
          </div>
          <div className="p-4 max-h-[320px] overflow-auto space-y-2">
            {reconciliations.length === 0 && <p className="text-sm text-slate-400">No reconciliations yet.</p>}
            {reconciliations.map((r: any) => (
              <div key={r.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black">{r.accountCode} | {new Date(r.statementDate).toLocaleDateString()}</p>
                  <span className={`text-[10px] font-black ${r.status === 'RESOLVED' ? 'text-emerald-600' : 'text-amber-600'}`}>{r.status}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Diff: {Number(r.difference || 0).toFixed(2)}</p>
                {r.status !== 'RESOLVED' && (
                  <button
                    onClick={() => resolveReconciliation(r.id, { adjustWithJournal: true, adjustmentAccountCode: '5110' })}
                    className="mt-2 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase"
                  >
                    Resolve With Journal
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Closed Periods</h3>
          </div>
          <div className="p-4 max-h-[320px] overflow-auto space-y-2">
            {periodCloses.length === 0 && <p className="text-sm text-slate-400">No closed periods yet.</p>}
            {periodCloses.map((p: any) => (
              <div key={p.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-black">{new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()}</p>
                <p className="text-[10px] text-slate-500 mt-1">TB: D {Number(p.trialBalance?.debit || 0).toFixed(2)} | C {Number(p.trialBalance?.credit || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {journalModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[120]">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-sm font-black uppercase">Manual Journal Entry</h4>
            <input className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input type="number" className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value || 0) })} />
            <select className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" value={form.debit} onChange={(e) => setForm({ ...form, debit: e.target.value })}>
              {flatAccounts.map(a => <option key={`d-${a.id}`} value={a.code}>Debit {a.code} - {a.name}</option>)}
            </select>
            <select className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" value={form.credit} onChange={(e) => setForm({ ...form, credit: e.target.value })}>
              {flatAccounts.map(a => <option key={`c-${a.id}`} value={a.code}>Credit {a.code} - {a.name}</option>)}
            </select>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setJournalModal(false)} className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-black uppercase">Cancel</button>
              <button onClick={submitManualEntry} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase">Post</button>
            </div>
          </div>
        </div>
      )}

      {reconModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[120]">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-sm font-black uppercase">Create Reconciliation</h4>
            <select className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" value={reconForm.accountCode} onChange={(e) => setReconForm({ ...reconForm, accountCode: e.target.value })}>
              {flatAccounts.map(a => <option key={`r-${a.id}`} value={a.code}>{a.code} - {a.name}</option>)}
            </select>
            <input type="date" className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" value={reconForm.statementDate} onChange={(e) => setReconForm({ ...reconForm, statementDate: e.target.value })} />
            <input type="number" className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" placeholder="Statement Balance" value={reconForm.statementBalance} onChange={(e) => setReconForm({ ...reconForm, statementBalance: Number(e.target.value || 0) })} />
            <input className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" placeholder="Notes (optional)" value={reconForm.notes} onChange={(e) => setReconForm({ ...reconForm, notes: e.target.value })} />
            <div className="flex gap-2 pt-2">
              <button onClick={() => setReconModal(false)} className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-black uppercase">Cancel</button>
              <button onClick={submitReconciliation} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase">Create</button>
            </div>
          </div>
        </div>
      )}

      {closeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[120]">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-sm font-black uppercase">Close Accounting Period</h4>
            <input type="date" className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" value={closeForm.periodStart} onChange={(e) => setCloseForm({ ...closeForm, periodStart: e.target.value })} />
            <input type="date" className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800" value={closeForm.periodEnd} onChange={(e) => setCloseForm({ ...closeForm, periodEnd: e.target.value })} />
            <div className="flex gap-2 pt-2">
              <button onClick={() => setCloseModal(false)} className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-black uppercase">Cancel</button>
              <button onClick={submitPeriodClose} className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
