import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Star, Phone, MapPin, UserCheck,
  ShieldCheck, TrendingUp, Clock, ShoppingBag,
  ChevronRight, X, AlertTriangle, Activity, Award, Layers
} from 'lucide-react';
import { Customer } from '../types';
import { useCRMStore } from '../stores/useCRMStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useOrderStore } from '../stores/useOrderStore';
import { translations } from '../services/translations';
import { useDebounce } from '../hooks';

const CRMMetric: React.FC<{
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
        <h2 className="text-xl lg:text-3xl font-black text-main tracking-tighter tabular-nums flex items-end gap-1.5">
          {value}
        </h2>
      </div>
      <div className={`p-4 rounded-2xl border flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12`} style={{ borderColor: `${color}30`, backgroundColor: `${color}15`, color }}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const CRM: React.FC = () => {
  const { customers, addCustomer } = useCRMStore();
  const { settings } = useAuthStore();
  const lang = settings.language || 'en';
  const t = translations[lang];

  const { orders } = useOrderStore();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ name: '', phone: '', address: '' });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.phone.includes(debouncedSearch) ||
      (c.loyaltyTier && c.loyaltyTier.toLowerCase().includes(debouncedSearch.toLowerCase()))
    );
  }, [customers, debouncedSearch]);

  const activeLoyaltyMembers = useMemo(() => customers.filter(c => c.loyaltyPoints > 0).length, [customers]);
  const avgLTV = useMemo(() => customers.length > 0 ? customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length : 0, [customers]);
  const atRiskProfiles = useMemo(() => customers.filter(c => {
    if (!c.createdAt) return false;
    const daysSince = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 3600 * 24);
    return c.visits < 2 && daysSince > 30;
  }).length, [customers]);

  const isPhoneValid = (phone?: string) => {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-()]/g, '');
    return /^01[0-9]{9}$/.test(cleaned) || /^\+201[0-9]{9}$/.test(cleaned);
  };

  const handleSaveCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    if (!isPhoneValid(newCustomer.phone)) return;
    await addCustomer({
      name: newCustomer.name,
      phone: newCustomer.phone.replace(/[\s\-()]/g, ''),
      address: newCustomer.address,
      loyaltyPoints: 0,
      totalSpent: 0,
      visits: 0,
      loyaltyTier: 'Bronze'
    });
    setShowAddModal(false);
    setNewCustomer({ name: '', phone: '', address: '' });
  };

  const getTierColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return 'text-violet-500 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20';
      case 'gold': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      case 'silver': return 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
      default: return 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20'; // Bronze
    }
  };

  const getAITag = (customer: Customer) => {
    if (customer.totalSpent > 5000) return { label: lang === 'ar' ? 'عميل كبار الشخصيات' : 'VIP Whale', color: 'text-violet-600 bg-violet-50 border-violet-200' };
    if (customer.visits > 10) return { label: lang === 'ar' ? 'متردد دائم' : 'Frequent Buyer', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (customer.visits === 1) return { label: lang === 'ar' ? 'مشتري لمرة واحدة' : 'One-time Trailing', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: lang === 'ar' ? 'تفاعل عادي' : 'Standard Engagement', color: 'text-slate-600 bg-slate-50 border-slate-200' };
  };

  return (
    <div className="relative min-h-screen bg-app overflow-hidden selection:bg-primary/30">
      {/* ── Visual Effects Overlay ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-500/5 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1920px] mx-auto overflow-y-auto max-h-screen custom-scrollbar pb-32">
        
        {/* ── Header ── */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-border/20">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-violet-500 p-0.5 shadow-xl shadow-indigo-500/20">
              <div className="w-full h-full rounded-[1.1rem] bg-card flex items-center justify-center">
                <ShieldCheck size={32} className="text-indigo-500 animate-pulse-soft" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-black text-main tracking-tight flex items-center gap-3">
                {lang === 'ar' ? 'مركز تواصل العملاء' : 'CRM Intelligence'}
                <span className="hidden md:flex px-3 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left duration-700">
                  {lang === 'ar' ? 'الولاء والنمو' : 'Loyalty Hub'}
                </span>
              </h1>
              <p className="text-xs font-bold text-muted mt-2 opacity-60 uppercase tracking-widest leading-relaxed">
                {lang === 'ar' 
                  ? 'إدارة علاقات العملاء والولاء الذكي وتحليل السلوك' 
                  : 'Customer Relationship & Predictive Loyalty Intelligence'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 rounded-2xl hover:shadow-xl hover:shadow-indigo-500/20 transition-all font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 border-b-4 border-indigo-800/40"
              >
                <Plus size={18} /> {lang === 'ar' ? 'تسجيل عميل' : 'REGISTER PROFILE'}
              </button>
              <button className="h-14 w-14 rounded-2xl bg-card/60 backdrop-blur-md border border-border/30 text-muted flex items-center justify-center hover:bg-elevated hover:text-main transition-all active:scale-95" onClick={() => window.location.reload()}>
                <Activity size={20} />
              </button>
          </div>
        </header>

        {/* ── Row 1: Insights ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <CRMMetric 
            label={lang === 'ar' ? 'إجمالي القاعدة' : 'Total Database'}
            value={customers.length.toLocaleString()}
            icon={UsersGroup}
            color="#6366f1"
          />
          <CRMMetric 
            label={lang === 'ar' ? 'شريحة الولاء النشطة' : 'Active Loyalty'}
            value={activeLoyaltyMembers.toLocaleString()}
            icon={Award}
            color="#10b981"
          />
          <CRMMetric 
            label={lang === 'ar' ? 'متوسط القيمة الدائمة' : 'Avg Lifetime Value'}
            value={`${avgLTV.toFixed(0)} LE`}
            icon={TrendingUp}
            color="#0ea5e9"
          />
          <CRMMetric 
            label={lang === 'ar' ? 'عملاء في خطر التسرب' : 'At-Risk Profiles'}
            value={atRiskProfiles}
            icon={AlertTriangle}
            color="#f43f5e"
          />
        </section>

        {/* ── Search Hub ── */}
        <div className="relative w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted w-6 h-6 group-focus-within:text-indigo-500 transition-colors z-10" />
          <input
            type="text"
            placeholder={lang === 'ar' ? 'بحث شامل بالتليفون، الاسم، أو المستوى...' : "Global search by identity, terminal, or tier..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-card/60 backdrop-blur-md border border-border/30 rounded-[2rem] outline-none focus:border-indigo-500/50 transition-all font-black text-sm text-main placeholder:text-muted/50 shadow-inner tracking-tight"
          />
        </div>

        {/* ── Main View ── */}
        <div className="bg-card/60 backdrop-blur-3xl rounded-[2.5rem] border border-border/20 overflow-hidden min-h-[600px] relative z-20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5 opacity-50 pointer-events-none" />
          
          <div className="responsive-table flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-elevated/40 text-muted text-[10px] uppercase font-black tracking-[0.2em] border-b border-white/5">
                <tr>
                  <th className="px-8 py-6">{lang === 'ar' ? 'العميل' : 'Customer Asset'}</th>
                  <th className="px-6 py-6">{lang === 'ar' ? 'التواصل' : 'Terminal Info'}</th>
                  <th className="px-6 py-6">{lang === 'ar' ? 'مستوى الولاء' : 'Loyalty Matrix'}</th>
                  <th className="px-6 py-6">{lang === 'ar' ? 'القيمة / الزيارات' : 'LTV / Velocity'}</th>
                  <th className="px-8 py-6 text-right">{lang === 'ar' ? 'تحليل' : 'Deep Analysis'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.map((customer) => {
                  const aiTag = getAITag(customer);
                  return (
                    <tr key={customer.id} className="hover:bg-indigo-500/5 transition-colors group cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border-2 group-hover:scale-110 transition-transform shadow-lg ${getTierColor(customer.loyaltyTier)}`}>
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-main uppercase text-sm tracking-tight mb-1 group-hover:text-indigo-400 transition-colors">{customer.name}</div>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${aiTag.color} backdrop-blur-md`}>{aiTag.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 text-muted font-black text-[13px] tabular-nums tracking-wide">
                          <Phone size={14} className="text-indigo-400" />
                          {customer.phone}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`flex items-center gap-2 font-black w-fit px-4 py-2 rounded-xl border shadow-sm backdrop-blur-md ${getTierColor(customer.loyaltyTier)}`}>
                          <Star size={14} className={['Gold', 'Platinum'].includes(customer.loyaltyTier || '') ? 'fill-current' : ''} />
                          <span className="text-[10px] uppercase tracking-[0.2em]">{customer.loyaltyTier || 'Bronze'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <span className="font-black tracking-tight text-[15px] text-emerald-500 tabular-nums">{(customer.totalSpent || 0).toLocaleString()} LE</span>
                          <div className="text-[10px] text-muted font-black mt-1 tracking-widest uppercase opacity-60">{customer.visits} Interaction cycles</div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-muted group-hover:text-indigo-400 transition-all p-3 rounded-2xl bg-elevated/40 border border-border/30 active:scale-90">
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center text-muted font-black uppercase tracking-[0.4em] text-xs opacity-20">
                      {lang === 'ar' ? 'لا توجد بيانات مطابقة' : 'NO PROFILE DATA DETECTED'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deep Profile Drawer */}
      {selectedCustomer && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-opacity animate-in fade-in" onClick={() => setSelectedCustomer(null)} />
          <div className={`fixed inset-y-0 ${lang === 'ar' ? 'left-0' : 'right-0'} w-full max-w-lg bg-card/80 backdrop-blur-3xl shadow-3xl z-[101] flex flex-col animate-in slide-in-from-${lang === 'ar' ? 'left' : 'right'}-full duration-500 border-${lang === 'ar' ? 'r' : 'l'} border-white/10`}>
             <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-main flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
                  <Activity size={24} />
                </div>
                {lang === 'ar' ? 'ملف العميل المتكامل' : 'Global Profile Insight'}
              </h3>
              <button onClick={() => setSelectedCustomer(null)} className="h-12 w-12 rounded-2xl bg-elevated/40 border border-border/30 text-muted flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar relative">
              <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
              
              {/* Profile Bio */}
              <div className="text-center relative z-10">
                <div className={`w-32 h-32 mx-auto rounded-[3rem] flex items-center justify-center text-5xl font-black mb-6 shadow-2xl border-4 ${getTierColor(selectedCustomer.loyaltyTier)} animate-pulse-soft`}>
                  {selectedCustomer.name.charAt(0)}
                </div>
                <h2 className="text-3xl font-black text-main tracking-tighter uppercase">{selectedCustomer.name}</h2>
                <div className="flex justify-center gap-4 mt-3">
                   <p className="text-muted font-black tracking-[0.2em] uppercase text-[10px] flex items-center gap-2 bg-elevated/40 px-3 py-1.5 rounded-full border border-white/5">
                      <Phone size={12} className="text-indigo-400" /> {selectedCustomer.phone}
                   </p>
                </div>
              </div>

              {/* Behavior Insight */}
              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-600/20 overflow-hidden group">
                 <div className="absolute -right-4 -top-4 p-4 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                    <Layers size={120} />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100 mb-4 flex items-center gap-2">
                    <TrendingUp size={14} /> Intelligence Protocol
                 </h4>
                 <p className="font-bold text-sm leading-relaxed tracking-tight">
                    {selectedCustomer.visits > 5
                      ? 'High affinity beacon. Operational data suggests high weekend engagement. VIP treatment prioritized.'
                      : 'Developing profile. Lower frequency detected. Recommendation: Trigger retention sequence via SMS.'}
                 </p>
              </div>

              {/* Deep Metrics */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl border border-border/20 bg-elevated/20 backdrop-blur-md">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Portfolio Value</p>
                  <p className="text-2xl font-black text-emerald-500 tabular-nums">{selectedCustomer.totalSpent.toLocaleString()} <span className="text-xs">LE</span></p>
                </div>
                <div className="p-6 rounded-3xl border border-border/20 bg-elevated/20 backdrop-blur-md">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Visits Context</p>
                  <p className="text-2xl font-black text-main tabular-nums">{selectedCustomer.visits}</p>
                </div>
                <div className="p-6 rounded-3xl border border-border/20 bg-elevated/20 backdrop-blur-md col-span-2">
                  <div className="flex justify-between items-end mb-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Loyalty Core Output</p>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getTierColor(selectedCustomer.loyaltyTier)}`}>
                      {selectedCustomer.loyaltyTier || 'Bronze'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-app rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${Math.min(100, (selectedCustomer.loyaltyPoints / 1000) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-3">
                     <p className="text-[10px] font-black text-main tabular-nums">{selectedCustomer.loyaltyPoints} PTS</p>
                     <p className="text-[9px] font-black text-muted uppercase tracking-widest opacity-60">NEXT TARGET: 1,000</p>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Historical Trace
                </h4>
                {orders.filter(o => o.customerId === selectedCustomer.id).length === 0 ? (
                   <div className="p-8 text-center bg-elevated/10 rounded-3xl border border-dashed border-border/40">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest italic opacity-40">Zero transaction records in local cache.</p>
                   </div>
                ) : (
                  <div className="grid gap-3">
                    {orders.filter(o => o.customerId === selectedCustomer.id).slice(0, 5).map(o => (
                      <div key={o.id} className="flex items-center justify-between p-5 rounded-2xl bg-card border border-border/30 hover:bg-elevated/40 transition-all shadow-sm">
                        <div>
                          <p className="text-[11px] font-black text-main uppercase tracking-tighter">#{o.id}</p>
                          <p className="text-[9px] font-bold text-muted mt-1">{new Date(o.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-emerald-500">{o.total?.toFixed(2)} LE</p>
                          <p className="text-[9px] font-black text-indigo-400/80 uppercase tracking-widest mt-1">{o.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-elevated/20">
              <button className="w-full h-16 bg-main text-app rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3">
                <ShoppingBag size={18} /> INITIALIZE TERMINAL SESSION
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modernized Add Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300" onClick={() => setShowAddModal(false)}>
          <div className="bg-card border border-white/10 rounded-[3rem] w-full max-w-xl shadow-3xl animate-in zoom-in-95 duration-500 relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-10" />
            
            <header className="p-8 lg:p-10 border-b border-white/5 flex justify-between items-center bg-elevated/20">
              <div>
                <h3 className="text-3xl font-black text-main tracking-tighter flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-xl">
                    <UserCheck size={28} />
                  </div>
                  {lang === 'ar' ? 'تسجيل بروفايل' : 'PROFILE REGISTRATION'}
                </h3>
                <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em] mt-2 opacity-50">Authorized Identity Access Manager</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="h-12 w-12 rounded-2xl bg-elevated/40 border border-border/30 text-muted flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90 shadow-lg">
                <X size={20} />
              </button>
            </header>

            <div className="p-8 lg:p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted pl-1">Global Identity (Full Name)</label>
                <div className="relative group">
                   <UserCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                   <input
                     className="w-full pl-14 pr-6 py-5 bg-elevated/20 border border-border/30 rounded-2xl text-main font-black text-sm outline-none focus:border-indigo-500/50 transition-all shadow-inner focus:bg-elevated/30 placeholder:text-muted/30"
                     value={newCustomer.name}
                     onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                     placeholder="AUTHORIZED IDENTITY NAME..."
                   />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted pl-1">Mobile Terminal (Phone)</label>
                <div className="relative group">
                   <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                   <input
                     className="w-full pl-14 pr-6 py-5 bg-elevated/20 border border-border/30 rounded-2xl text-main font-black text-sm outline-none focus:border-indigo-500/50 transition-all shadow-inner tabular-nums focus:bg-elevated/30 placeholder:text-muted/30"
                     value={newCustomer.phone}
                     onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                     placeholder="01XXXXXXXXX..."
                   />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted pl-1">Operational Dispatch (Address)</label>
                <div className="relative group">
                   <MapPin className="absolute left-5 top-6 text-muted/30 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                   <textarea
                     className="w-full pl-14 pr-6 py-5 bg-elevated/20 border border-border/30 rounded-2xl text-main font-black text-sm outline-none focus:border-indigo-500/50 transition-all resize-none shadow-inner h-32 focus:bg-elevated/30 placeholder:text-muted/30"
                     value={newCustomer.address}
                     onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                     placeholder="GEOGRAPHICAL LOCATION DATA..."
                   />
                </div>
              </div>
            </div>

            <div className="p-8 lg:p-10 border-t border-white/5 bg-elevated/30 flex gap-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 h-16 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:bg-elevated/60 bg-app border border-border rounded-2xl transition-all"
              >
                {lang === 'ar' ? 'إلغاء' : 'ABORT'}
              </button>
              <button
                onClick={handleSaveCustomer}
                className="flex-[2] h-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:shadow-indigo-500/40 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Save size={20} />
                {lang === 'ar' ? 'حفظ وتثبيت' : 'SEAL & DEPLOY PROFILE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Mock component for the icon since UsersGroup is not in standard lucide-react (using Users instead if needed)
import { Users as UsersGroup } from 'lucide-react';

export default CRM;