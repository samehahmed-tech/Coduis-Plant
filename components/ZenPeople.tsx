import React, { useEffect, useMemo, useState } from 'react';
import {
    Users,
    Clock,
    Wallet,
    ShieldCheck,
    Search,
    Plus,
    ChevronRight,
    Award
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useHRStore } from '../stores/useHRStore';

const ZenPeople: React.FC = () => {
    const { settings } = useAuthStore();
    const { employees, attendance, payrollCycles, payoutLedger, fetchEmployees, calculatePayroll, executePayrollCycle } = useHRStore();
    const lang = settings.language || 'en';

    const [searchQuery, setSearchQuery] = useState('');
    const [isExecutingPayroll, setIsExecutingPayroll] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const activeAttendance = attendance.filter(a => !a.clockOut);
    const filteredEmployees = useMemo(() => employees.filter(e =>
        `${e.id} ${e.userId}`.toLowerCase().includes(searchQuery.toLowerCase())
    ), [employees, searchQuery]);

    const payrollLiability = useMemo(() => {
        return employees.reduce((sum, e) => sum + calculatePayroll(e.id, new Date('2025-02-01'), new Date()), 0);
    }, [employees, calculatePayroll, attendance]);

    return (
        <div className="p-4 md:p-8 lg:p-12 bg-app min-h-screen">
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
                        {lang === 'ar' ? 'إدارة الموظفين والحضور والرواتب' : 'Employees, attendance, and payroll operations'}
                    </p>
                </div>

                <button className="bg-primary text-white px-8 py-4 rounded-2xl shadow-2xl shadow-primary/30 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                    <Plus size={18} />
                    {lang === 'ar' ? 'موظف جديد' : 'Onboard Talent'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Workforce', value: String(employees.length), sub: 'Backend module', icon: Users, color: 'text-blue-500' },
                    { label: 'Active Now', value: activeAttendance.length.toString(), sub: 'On-site personnel', icon: Clock, color: 'text-emerald-500' },
                    { label: 'Payroll Liability', value: `${payrollLiability.toFixed(2)} EGP`, sub: 'Projected this month', icon: Wallet, color: 'text-indigo-500' },
                    { label: 'Operational Health', value: employees.length > 0 ? `${Math.round((activeAttendance.length / employees.length) * 100)}%` : '0%', sub: 'Attendance ratio', icon: ShieldCheck, color: 'text-amber-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className="text-3xl font-black text-main uppercase">{stat.value}</h4>
                        <p className="text-[10px] font-bold text-muted mt-2 opacity-60">{stat.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-[3rem] shadow-sm overflow-hidden min-h-[460px]">
                        <div className="p-8 border-b border-border bg-elevated/30 flex justify-between items-center gap-4">
                            <h3 className="text-xl font-black text-main uppercase tracking-tight">{lang === 'ar' ? 'دليل الفريق' : 'Talent Roster'}</h3>
                            <div className="relative w-full max-w-xs group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Find employee..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 bg-app border border-border rounded-xl font-bold text-xs outline-none"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-app/50 text-[10px] font-black uppercase text-muted tracking-widest">
                                    <tr>
                                        <th className="px-8 py-5">Employee</th>
                                        <th className="px-6 py-5">Status</th>
                                        <th className="px-6 py-5">Salary</th>
                                        <th className="px-8 py-5 text-right">Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredEmployees.map(emp => (
                                        <tr key={emp.id} className="hover:bg-elevated/20 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100">
                                                        {emp.id.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-main uppercase">{emp.id}</p>
                                                        <p className="text-[10px] font-bold text-muted uppercase tracking-tighter mt-0.5">Joined {new Date(emp.joinDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 font-bold text-xs text-muted">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${activeAttendance.find(a => a.employeeId === emp.id) ? 'bg-emerald-500 animate-pulse' : 'bg-muted/40'}`} />
                                                    <span className="uppercase text-[10px] font-black">{activeAttendance.find(a => a.employeeId === emp.id) ? 'CLOCK-IN' : 'OFFLINE'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 font-mono text-sm font-black text-main">
                                                {emp.salary.toLocaleString()} <span className="text-[10px] text-muted">EGP/{emp.salaryType === 'MONTHLY' ? 'M' : 'H'}</span>
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

                <div className="space-y-8">
                    <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Wallet className="text-indigo-600" />
                            <h3 className="text-lg font-black text-main uppercase tracking-tight">{lang === 'ar' ? 'كشف الرواتب' : 'Payroll Draft'}</h3>
                        </div>

                        <div className="space-y-3">
                            {employees.map(emp => (
                                <div key={emp.id} className="flex justify-between items-center p-3 bg-app rounded-xl border border-border/50">
                                    <div>
                                        <p className="text-[10px] font-black text-main uppercase">{emp.id}</p>
                                        <p className="text-[9px] font-bold text-muted tracking-widest">{emp.salaryType}</p>
                                    </div>
                                    <p className="text-sm font-black text-indigo-600">
                                        {calculatePayroll(emp.id, new Date('2025-02-01'), new Date()).toFixed(2)} EGP
                                    </p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={async () => {
                                setIsExecutingPayroll(true);
                                try {
                                    await executePayrollCycle(new Date('2025-02-01'), new Date(), settings.activeBranchId);
                                } finally {
                                    setIsExecutingPayroll(false);
                                }
                            }}
                            className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                        >
                            {isExecutingPayroll ? 'Processing...' : (lang === 'ar' ? 'إصدار الرواتب' : 'Execute Payroll')}
                        </button>

                        {payrollCycles.length > 0 && (
                            <div className="mt-4 p-3 bg-app rounded-xl border border-border/50">
                                <p className="text-[10px] font-black uppercase text-muted">Latest Cycle</p>
                                <p className="text-xs font-black text-main mt-1">{payrollCycles[0].id}</p>
                                <p className="text-[10px] text-muted mt-1">{Number(payrollCycles[0].totalAmount || 0).toFixed(2)} EGP</p>
                            </div>
                        )}

                        {payoutLedger.length > 0 && (
                            <div className="mt-4 p-3 bg-app rounded-xl border border-border/50">
                                <p className="text-[10px] font-black uppercase text-muted">Payout Entries</p>
                                <p className="text-xs font-black text-main mt-1">{payoutLedger.length}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-600/30">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-white/10 rounded-2xl">
                                <Award size={28} />
                            </div>
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tighter mb-4">{lang === 'ar' ? 'موظف الشهر' : 'Elite Talent'}</h4>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 overflow-hidden" />
                            <div>
                                <p className="text-sm font-black uppercase">Top Performer</p>
                                <p className="text-[10px] font-bold opacity-60">{activeAttendance.length} active shifts</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZenPeople;
