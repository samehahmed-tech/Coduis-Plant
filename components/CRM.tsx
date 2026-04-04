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
    <div className="p-4 md:p-8 lg:p-12 bg-app min-h-[calc(100vh-theme(spacing.16))] font-sans antialiased text-main flex flex-col pt-20 lg:pt-8 w-full">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/30">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              CRM HUB
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest">
            {lang === 'ar' ? 'إدارة علاقات العملاء والولاء' : 'Customer Relationship & Loyalty Intelligence'}
          </p>
        </div>

        <div className="flex gap-4 w-full xl:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 font-black text-xs uppercase tracking-widest"
          >
            <Plus size={20} /> {lang === 'ar' ? 'تسجيل عميل' : 'Register Profile'}
          </button>
        </div>
      </div>

      {/* Intelligent Insights */}
      <div className="grid-auto-fit mb-12">
        {[
          { label: lang === 'ar' ? 'إجمالي القاعدة' : 'Total Database', value: customers.length, icon: UsersGroup, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: lang === 'ar' ? 'شريحة الولاء النشطة' : 'Active Loyalty', value: activeLoyaltyMembers, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: lang === 'ar' ? 'متوسط القيمة الدائمة' : 'Avg Lifetime Value', value: `${settings?.currencySymbol || 'EGP'} ${avgLTV.toFixed(0)}`, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
          { label: lang === 'ar' ? 'عملاء في خطر التسرب' : 'At-Risk Profiles', value: atRiskProfiles, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-slate-100 dark:text-slate-800/50 rotate-12 group-hover:scale-110 transition-transform">
              <stat.icon size={100} />
            </div>
            <div className={`relative z-10 p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
              <stat.icon size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-indigo-600/5 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder={lang === 'ar' ? 'بحث بالاسم، الهاتف، أو المستوى...' : 'Filter by name, phone, or tier...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-sm shadow-sm"
            />
          </div>
          {/* Filter Pills could go here */}
        </div>

        <div className="responsive-table flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                <th className="px-8 py-5">{lang === 'ar' ? 'العميل' : 'Customer Profile'}</th>
                <th className="px-6 py-5">{lang === 'ar' ? 'التواصل' : 'Contact'}</th>
                <th className="px-6 py-5">{lang === 'ar' ? 'مستوى الولاء' : 'Loyalty Tier'}</th>
                <th className="px-6 py-5">{lang === 'ar' ? 'القيمة / الزيارات' : 'LTV / Visits'}</th>
                <th className="px-8 py-5 text-right">{lang === 'ar' ? 'تحليل' : 'Analyze'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredCustomers.map((customer) => {
                const aiTag = getAITag(customer);
                return (
                  <tr key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center font-black text-xl border group-hover:scale-110 transition-transform shadow-sm ${getTierColor(customer.loyaltyTier)}`}>
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white uppercase text-sm tracking-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{customer.name}</div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${aiTag.color} dark:bg-transparent dark:border-slate-700`}>{aiTag.label}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-bold text-[12px]">
                        <Phone size={14} className="text-slate-400" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`flex items-center gap-2 font-black w-fit px-3 py-1.5 rounded-lg border shadow-sm ${getTierColor(customer.loyaltyTier)}`}>
                        <Star size={14} className={['Gold', 'Platinum'].includes(customer.loyaltyTier || '') ? 'fill-current' : ''} />
                        <span className="text-[10px] uppercase tracking-widest">{customer.loyaltyTier || 'Bronze'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <span className="font-black tracking-tight text-[13px] text-emerald-600 dark:text-emerald-400">{customer.totalSpent.toLocaleString()} {settings?.currencySymbol || 'EGP'}</span>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest uppercase">{customer.visits} {lang === 'ar' ? 'زيارة' : 'Visits'}</div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-500 font-black uppercase tracking-[0.2em] text-[11px]">
                    {lang === 'ar' ? 'لا يوجد عملاء يطابقون بحثك' : 'No customers found matching your criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Profile Drawer */}
      {selectedCustomer && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in" onClick={() => setSelectedCustomer(null)} />
          <div className={`fixed inset-y-0 ${lang === 'ar' ? 'left-0' : 'right-0'} w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col animate-in slide-in-from-${lang === 'ar' ? 'left' : 'right'}-full duration-300 border-${lang === 'ar' ? 'r' : 'l'} border-slate-200 dark:border-slate-800`}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-indigo-600" />
                {lang === 'ar' ? 'تحليل العميل 360' : '360° Profile Analysis'}
              </h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Header Info */}
              <div className="text-center">
                <div className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center text-4xl font-black mb-4 shadow-xl border-4 ${getTierColor(selectedCustomer.loyaltyTier)}`}>
                  {selectedCustomer.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedCustomer.name}</h2>
                <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px] mt-1 flex justify-center items-center gap-1">
                  <Phone size={12} /> {selectedCustomer.phone}
                </p>
              </div>

              {/* AI Insights Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform">
                  <Layers size={80} />
                </div>
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-2 flex items-center gap-1">
                    <TrendingUp size={12} /> {lang === 'ar' ? 'رؤية الذكاء الاصطناعي' : 'AI Behavioral Insight'}
                  </h4>
                  <p className="font-bold text-sm leading-relaxed">
                    {selectedCustomer.visits > 5
                      ? (lang === 'ar' ? 'هذا العميل لديه معدل ولاء عالي. يميل إلى الطلب في عطلات نهاية الأسبوع. نقترح إرسال عرض مخصص للحفاظ على التفاعل.' : 'High affinity customer. Trends show preference for weekend orders. Suggest sending a targeted push notification to maintain engagement.')
                      : (lang === 'ar' ? 'تفاعل العميل منخفض مؤخراً. يوصى بإرسال قسيمة خصم 10% لتحفيز زيارة ثانية.' : 'Customer engagement is low. A 10% retention coupon is highly recommended to stimulate a return visit.')
                    }
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{lang === 'ar' ? 'مجموع الإنفاق' : 'Total Value'}</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{selectedCustomer.totalSpent.toLocaleString()} <span className="text-xs">{settings?.currencySymbol}</span></p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{lang === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{selectedCustomer.visits}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 col-span-2">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{lang === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getTierColor(selectedCustomer.loyaltyTier)}`}>
                      {selectedCustomer.loyaltyTier || 'Bronze'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" style={{ width: `${Math.min(100, (selectedCustomer.loyaltyPoints / 1000) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 mt-2 text-right">{selectedCustomer.loyaltyPoints} / 1000 to next tier</p>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">{lang === 'ar' ? 'سجل الطلبات' : 'Order History'}</h4>
                {(() => {
                  const customerOrders = orders.filter(o => o.customerId === selectedCustomer.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
                  if (customerOrders.length === 0) return <p className="text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'لا يوجد طلبات سابقة' : 'No previous orders'}</p>;
                  return (
                    <div className="space-y-2">
                      {customerOrders.map(o => (
                        <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="text-[10px] font-black text-slate-700 dark:text-white">{o.id}</p>
                            <p className="text-[8px] text-slate-400 font-bold">{new Date(o.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{o.total?.toFixed(2)} {settings?.currencySymbol}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">{o.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Additional Details */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">{lang === 'ar' ? 'معلومات التوصيل' : 'Logistics'}</h4>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedCustomer.address || (lang === 'ar' ? 'لم يتم تسجيل عنوان تسليم' : 'No delivery address registered.')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <button className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                {lang === 'ar' ? 'بدء طلب توصيل لهذا العميل' : 'Initialize Delivery Order'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modern Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                  <UserCheck size={24} />
                </div>
                {lang === 'ar' ? 'تسجيل عميل' : 'Register Profile'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-500">{lang === 'ar' ? 'الاسم بالكامل' : 'Full Legal Name'}</label>
                <input
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-bold outline-none focus:border-indigo-500 focus:ring-0 transition-all placeholder:text-slate-400"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="e.g. Sameh Ahmed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-500">{lang === 'ar' ? 'رقم الهاتف' : 'Mobile Terminal'}</label>
                <input
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-bold outline-none focus:border-indigo-500 focus:ring-0 transition-all placeholder:text-slate-400"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+20 1..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-500">{lang === 'ar' ? 'عنوان التوصيل' : 'Dispatch Location'}</label>
                <textarea
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-bold outline-none focus:border-indigo-500 focus:ring-0 transition-all resize-none placeholder:text-slate-400"
                  rows={3}
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Street, Building, Flat..."
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveCustomer}
                className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
              >
                {lang === 'ar' ? 'حفظ وتسجيل' : 'Seal & Register'}
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