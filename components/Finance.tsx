
import React, { useState } from 'react';
import {
  BarChart3, Wallet, ArrowUpRight, ArrowDownLeft,
  Plus, Search, ChevronRight, ChevronDown,
  History, Landmark, BookText
} from 'lucide-react';
import { FinancialAccount, AccountType } from '../types';
import { useFinanceStore } from '../stores/useFinanceStore';

const Finance: React.FC = () => {
  const { accounts, transactions } = useFinanceStore();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(['1', '4', '5']));

  const toggleExpand = (id: string) => {
    const next = new Set(expandedAccounts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedAccounts(next);
  };

  const renderAccountRow = (account: FinancialAccount, level: number = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedAccounts.has(account.id);

    return (
      <React.Fragment key={account.id}>
        <div
          className={`flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer ${level === 0 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}
          style={{ paddingLeft: `${level * 1.5 + 1.5}rem` }}
          onClick={() => hasChildren && toggleExpand(account.id)}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />
            ) : <div className="w-4" />}
            <span className="font-mono text-[10px] font-black text-slate-400 dark:text-slate-600 tracking-tighter w-12">{account.code}</span>
            <span className={`font-black uppercase text-xs tracking-tight ${level === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{account.name}</span>
          </div>
          <div className="flex items-center gap-8">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${account.type === AccountType.ASSET ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
              account.type === AccountType.REVENUE ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                account.type === AccountType.EXPENSE ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}>
              {account.type}
            </span>
            <span className={`font-mono font-black text-xs min-w-[120px] text-right ${account.balance < 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
              {account.balance.toLocaleString()} ج.م
            </span>
          </div>
        </div>
        {hasChildren && isExpanded && account.children!.map(child => renderAccountRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Finance Engine</h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold italic text-sm">Enterprise-grade financial ledger and automated reconciliation.</p>
        </div>
        <div className="w-full md:w-auto flex gap-3">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
            <Plus size={20} /> Record Entry
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex justify-between items-center mb-6">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl"><Wallet size={28} /></div>
            <div className="text-right">
              <span className="text-emerald-500 font-black text-xs flex items-center justify-end gap-1 uppercase tracking-widest"><ArrowUpRight size={14} /> 12.4%</span>
              <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Cash Liquidity</p>
            </div>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Available Funds</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">42,500.00 <span className="text-xs">ج.م</span></h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex justify-between items-center mb-6">
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><Landmark size={28} /></div>
            <div className="text-right">
              <span className="text-indigo-500 font-black text-xs flex items-center justify-end gap-1 uppercase tracking-widest">Audited</span>
              <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Total Net Assets</p>
            </div>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Equity Value</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">128,400.00 <span className="text-xs">ج.م</span></h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex justify-between items-center mb-6">
            <div className="p-4 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl"><ArrowDownLeft size={28} /></div>
            <div className="text-right">
              <span className="text-rose-500 font-black text-xs flex items-center justify-end gap-1 uppercase tracking-widest"><ArrowDownLeft size={14} /> -4% Burn</span>
              <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Operating Exp</p>
            </div>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Monthly OPEX</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">8,250.00 <span className="text-xs">ج.م</span></h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: COA Tree */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <BookText size={24} className="text-indigo-600" /> Chart of Accounts
              </h3>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Scan ledger codes..."
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {accounts.map(acc => renderAccountRow(acc))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Transactions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[420px] md:h-[560px] lg:h-[700px]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <History size={24} className="text-indigo-600" /> Journal Log
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <History size={48} className="mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No entries recorded</p>
                </div>
              ) : (
                transactions.slice(0, 20).map(tx => (
                  <div key={tx.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-500/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg tracking-widest border border-indigo-100/50">ENTRY-{tx.id.slice(-4).toUpperCase()}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(tx.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 dark:text-white mb-4 uppercase leading-relaxed">{tx.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black text-sm text-indigo-600">{tx.amount.toFixed(2)} <span className="text-[10px]">ج.م</span></span>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-100 dark:border-slate-600 text-[10px] font-black text-slate-400">DR</div>
                        <ChevronRight size={12} className="text-slate-300" />
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-100 dark:border-slate-600 text-[10px] font-black text-slate-400">CR</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
              <button className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl">
                Audit Full Ledger
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
