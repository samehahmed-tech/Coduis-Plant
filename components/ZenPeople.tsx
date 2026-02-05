import React, { useEffect, useState } from 'react';
import {
    Users,
    Clock,
    Wallet,
    ShieldCheck,
    Calendar,
    Search,
    Plus,
    ChevronRight,
    TrendingDown,
    TrendingUp,
    Fingerprint,
    Award
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useHRStore } from '../stores/useHRStore';
import { translations } from '../services/translations';

const ZenPeople: React.FC = () => {
    const { settings } = useAuthStore();
    const { employees, attendance, fetchEmployees, clockIn, clockOut, calculatePayroll } = useHRStore();
    const lang = settings.language || 'en';
    const t = translations[lang];

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const activeAttendance = attendance.filter(a => !a.clockOut);

    return (
        <div className="p-4 md:p-8 lg:p-12 bg-app min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                            <Users size={32} />
                        </div>
                        <h2 className="text-4xl font-black text-main uppercase tracking-tighter">
                            {lang === 'ar' ? 'الموارد البشرية' : 'Human Resources'}
                        </h2>
                    </div>
                    <p className="text-muted font-bold text-sm uppercase tracking-widest opacity-60">
                        {lang === 'ar' ? 'إدارة رأس المال البشري والكفاءة التشغيلية' : 'Human Capital Management & Operational Vitality'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="bg-card border border-border text-main px-6 py-4 rounded-2xl shadow-sm font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-elevated transition-all">
                        <Fingerprint size={18} className="text-indigo-600" />
                        {lang === 'ar' ? 'تسجيل حضور' : 'Attendance Log'}
                    </button>
                    <button className="bg-primary text-white px-8 py-4 rounded-2xl shadow-2xl shadow-primary/30 font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                        <Plus size={18} />
                        {lang === 'ar' ? 'موظف جديد' : 'Onboard Talent'}
                    </button>
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Workforce', value: '24', sub: 'Across 3 branches', icon: Users, color: 'text-blue-500' },
                    { label: 'Active Now', value: activeAttendance.length.toString(), sub: 'On-site personnel', icon: Clock, color: 'text-emerald-500' },
                    { label: 'Payroll Liability', value: '184K ج.م', sub: 'Projected this month', icon: Wallet, color: 'text-indigo-500' },
                    { label: 'Operational Health', value: '98%', sub: 'Punctuality rate', icon: ShieldCheck, color: 'text-amber-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <stat.icon size={80} />
                        </div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className="text-3xl font-black text-main uppercase">{stat.value}</h4>
                        <p className="text-[10px] font-bold text-muted mt-2 opacity-60">{stat.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Employee Directory */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-[3rem] shadow-sm overflow-hidden min-h-[360px] md:min-h-[440px] lg:min-h-[500px]">
                        <div className="p-8 border-b border-border bg-elevated/30 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="text-xl font-black text-main uppercase tracking-tight">{lang === 'ar' ? 'دليل الفريق' : 'Talent Roster'}</h3>
                            <div className="relative w-full max-w-xs group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4 h-4 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Find employee..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 bg-app border border-border rounded-xl font-bold text-xs focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-app/50 text-[10px] font-black uppercase text-muted tracking-widest">
                                    <tr>
                                        <th className="px-8 py-5">Full Name</th>
                                        <th className="px-6 py-5">Position</th>
                                        <th className="px-6 py-5">Status</th>
                                        <th className="px-6 py-5">Base Salary</th>
                                        <th className="px-8 py-5 text-right">Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {employees.map(emp => (
                                        <tr key={emp.id} className="hover:bg-elevated/20 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 group-hover:scale-110 transition-transform">
                                                        {emp.id.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-main uppercase">Employee {emp.id}</p>
                                                        <p className="text-[10px] font-bold text-muted uppercase tracking-tighter mt-0.5">Joined {new Date(emp.joinDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 font-bold text-xs text-muted">Operations Manager</td>
                                            <td className="px-6 py-6 font-bold text-xs text-muted">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${activeAttendance.find(a => a.employeeId === emp.id) ? 'bg-emerald-500 animate-pulse' : 'bg-muted/40'}`} />
                                                    <span className="uppercase text-[10px] font-black">{activeAttendance.find(a => a.employeeId === emp.id) ? 'CLOCK-IN' : 'OFFLINE'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 font-mono text-sm font-black text-main">
                                                {emp.salary.toLocaleString()} <span className="text-[10px] text-muted">ج.م/{emp.salaryType === 'MONTHLY' ? 'M' : 'H'}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="text-muted hover:text-indigo-600 transition-all p-2">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Payroll & Shift Sidebar */}
                <div className="space-y-8">
                    <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8">
                            <Wallet className="text-indigo-600" />
                            <h3 className="text-lg font-black text-main uppercase tracking-tight">{lang === 'ar' ? 'كشف الرواتب' : 'Payroll Draft'}</h3>
                        </div>

                        <div className="space-y-6">
                            {employees.map(emp => (
                                <div key={emp.id} className="flex justify-between items-center p-4 bg-app rounded-2xl border border-border/50 group hover:border-indigo-500/20 transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-main uppercase">Emp {emp.id}</p>
                                        <p className="text-[9px] font-bold text-muted tracking-widest">{emp.salaryType}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-indigo-600">
                                            {calculatePayroll(emp.id, new Date('2025-02-01'), new Date()).toLocaleString()} ج.م
                                        </p>
                                        <div className="flex items-center gap-1.5 opacity-40 justify-end">
                                            <TrendingUp size={10} className="text-emerald-500" />
                                            <span className="text-[8px] font-black uppercase">Earned So Far</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                            {lang === 'ar' ? 'إصدار الرواتب' : 'Execute Payroll'}
                        </button>
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-600/30">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-white/10 rounded-2xl">
                                <Award size={28} />
                            </div>
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tighter mb-4">{lang === 'ar' ? 'موظف الشهر' : 'Elite Talent'}</h4>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name=Ahmed+Hassan&background=random" alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase">Ahmed Hassan</p>
                                <p className="text-[10px] font-bold opacity-60">120 Successful Orders</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZenPeople;
