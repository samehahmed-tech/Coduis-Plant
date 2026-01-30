
import React, { useState } from 'react';
import { 
  BarChart3, Wallet, ArrowUpRight, ArrowDownLeft, 
  Plus, Search, ChevronRight, ChevronDown, 
  BookText, History, PieChart, Landmark
} from 'lucide-react';
import { FinancialAccount, AccountType, JournalEntry } from '../types';

interface FinanceProps {
  accounts: FinancialAccount[];
  transactions: JournalEntry[];
}

const Finance: React.FC<FinanceProps> = ({ accounts, transactions }) => {
  const [activeTab, setActiveTab] = useState<'COA' | 'LEDGER'>('COA');
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
          className={`flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${level === 0 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}
          style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
          onClick={() => hasChildren && toggleExpand(account.id)}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />
            ) : <div className="w-4" />}
            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{account.code}</span>
            <span className={`font-bold ${level === 0 ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{account.name}</span>
          </div>
          <div className="flex items-center gap-8">
            <span className={`text-xs font-black px-2 py-0.5 rounded uppercase ${
              account.type === AccountType.ASSET ? 'bg-blue-100 text-blue-700' :
              account.type === AccountType.REVENUE ? 'bg-green-100 text-green-700' :
              account.type === AccountType.EXPENSE ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {account.type}
            </span>
            <span className={`font-black min-w-[100px] text-right ${account.balance < 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
              ${Math.abs(account.balance).toLocaleString()}
            </span>
          </div>
        </div>
        {hasChildren && isExpanded && account.children!.map(child => renderAccountRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Finance & Accounting</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage your chart of accounts and financial ledger.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all">
             <Plus size={20} /> New Entry
           </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-2xl"><Wallet size={24}/></div>
               <span className="text-green-500 font-black text-xs flex items-center gap-1"><ArrowUpRight size={14}/> +12%</span>
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Cash on Hand</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">$42,500.00</h3>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><BarChart3 size={24}/></div>
               <span className="text-blue-500 font-black text-xs flex items-center gap-1">Stable</span>
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Total Assets</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">$128,400.00</h3>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl"><ArrowDownLeft size={24}/></div>
               <span className="text-red-500 font-black text-xs flex items-center gap-1">-4% Monthly</span>
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Monthly Expenses</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">$8,250.00</h3>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: COA Tree */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
                 <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Landmark size={20} className="text-indigo-600" /> Chart of Accounts
                 </h3>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" placeholder="Search accounts..." className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none" />
                 </div>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                 {accounts.map(acc => renderAccountRow(acc))}
              </div>
           </div>
        </div>

        {/* Right Column: Recent Transactions */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                 <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <History size={20} className="text-indigo-600" /> Recent Entries
                 </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {transactions.slice(0, 10).map(tx => (
                   <div key={tx.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">Entry #{tx.id.slice(-4)}</span>
                         <span className="text-[10px] font-bold text-slate-400">{new Date(tx.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white mb-3">{tx.description}</p>
                      <div className="flex justify-between items-center text-xs">
                         <span className="font-black text-slate-800 dark:text-white">${tx.amount.toFixed(2)}</span>
                         <div className="flex items-center gap-2 text-slate-500">
                           <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-600">DR</span>
                           <ChevronRight size={12}/>
                           <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-600">CR</span>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
              <button className="p-4 bg-slate-50 dark:bg-slate-800 text-indigo-600 text-xs font-black uppercase tracking-widest border-t border-slate-100 dark:border-slate-700 hover:bg-indigo-50 transition-colors">
                 View Full Ledger
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
