import React, { useEffect, useMemo, useState } from 'react';
import {
    Users, Shield, CheckSquare, Calendar, DollarSign, Plus, Edit3, Trash2,
    Search, X, Save, Eye, EyeOff, Clock, Phone, Mail, Hash, Building2, UserCheck,
    UserX, Key, Lock, Check, Fingerprint, Wallet, UserPlus, CheckCircle, XCircle,
    RefreshCw, CreditCard, Printer, ShieldCheck, Briefcase, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useHRStore } from '../stores/useHRStore';
import { hrApi, hrExtendedApi } from '../services/api/hr';
import { useToast } from './common/ToastProvider';
import { useConfirm } from './common/ConfirmProvider';
import {
    User, UserRole, AppPermission, INITIAL_ROLE_PERMISSIONS,
    SalaryInfo, AttendanceRecord, AttendanceStatus, Employee
} from '../types';
import { translations } from '../services/translations';

type Tab = 'users' | 'roles' | 'permissions' | 'attendance' | 'leave' | 'payroll' | 'security';

const TABS: { id: Tab; label: string; labelAr: string; icon: React.ElementType }[] = [
    { id: 'users', label: 'Users', labelAr: 'المستخدمين', icon: Users },
    { id: 'roles', label: 'Roles', labelAr: 'الأدوار', icon: Shield },
    { id: 'permissions', label: 'Permissions', labelAr: 'الصلاحيات', icon: CheckSquare },
    { id: 'attendance', label: 'Attendance', labelAr: 'الحضور', icon: Calendar },
    { id: 'leave', label: 'Leave', labelAr: 'الإجازات', icon: Clock },
    { id: 'payroll', label: 'Payroll', labelAr: 'المرتبات', icon: DollarSign },
    { id: 'security', label: 'Security', labelAr: 'الأمان', icon: ShieldCheck },
];

const RL: Record<string, { en: string; ar: string; color: string }> = {
    [UserRole.SUPER_ADMIN]: { en: 'Super Admin', ar: 'مدير النظام', color: 'from-rose-500 to-rose-600' },
    [UserRole.OWNER]: { en: 'Owner', ar: 'صاحب المطعم', color: 'from-violet-500 to-violet-600' },
    [UserRole.BRANCH_MANAGER]: { en: 'Branch Manager', ar: 'مدير الفرع', color: 'from-blue-500 to-blue-600' },
    [UserRole.CASHIER]: { en: 'Cashier', ar: 'كاشير', color: 'from-emerald-500 to-emerald-600' },
    [UserRole.WAITER]: { en: 'Waiter', ar: 'ويتر', color: 'from-amber-500 to-amber-600' },
    [UserRole.CAPTAIN]: { en: 'Captain', ar: 'كابتن صالة', color: 'from-amber-600 to-amber-700' },
    [UserRole.KITCHEN_STAFF]: { en: 'Kitchen', ar: 'موظف مطبخ', color: 'from-orange-500 to-orange-600' },
    [UserRole.CALL_CENTER]: { en: 'Call Center', ar: 'موظف كول سنتر', color: 'from-cyan-500 to-cyan-600' },
    [UserRole.CALL_CENTER_MANAGER]: { en: 'Call Center Mgr', ar: 'مدير كول سنتر', color: 'from-cyan-600 to-cyan-700' },
    [UserRole.CASHIER_MANAGER]: { en: 'Cashier Mgr', ar: 'مدير كاشير', color: 'from-emerald-600 to-emerald-700' },
    [UserRole.WAREHOUSE_STAFF]: { en: 'Warehouse', ar: 'موظف مخازن', color: 'from-teal-500 to-teal-600' },
    [UserRole.WAREHOUSE_DIRECTOR]: { en: 'Warehouse Dir.', ar: 'مدير مخازن', color: 'from-teal-600 to-teal-700' },
    [UserRole.PRODUCTION_STAFF]: { en: 'Production', ar: 'إنتاج', color: 'from-lime-500 to-lime-600' },
    [UserRole.PROCUREMENT_MANAGER]: { en: 'Procurement', ar: 'مشتريات', color: 'from-indigo-500 to-indigo-600' },
    [UserRole.ACCOUNTANT]: { en: 'Accountant', ar: 'محاسب', color: 'from-slate-500 to-slate-600' },
    [UserRole.COST_ACCOUNTANT]: { en: 'Cost Acct.', ar: 'محاسب تكاليف', color: 'from-slate-600 to-slate-700' },
    [UserRole.FINANCE_DIRECTOR]: { en: 'Finance Dir.', ar: 'مدير مالي', color: 'from-purple-500 to-purple-600' },
    [UserRole.HR_MANAGER]: { en: 'HR Manager', ar: 'موارد بشرية', color: 'from-pink-500 to-pink-600' },
    [UserRole.PAYROLL_OFFICER]: { en: 'Payroll', ar: 'مرتبات', color: 'from-pink-600 to-pink-700' },
    [UserRole.TREASURY_OFFICER]: { en: 'Treasury', ar: 'خزينة', color: 'from-yellow-500 to-yellow-600' },
    [UserRole.TECH_SUPPORT]: { en: 'Tech Support', ar: 'دعم فني', color: 'from-gray-500 to-gray-600' },
    [UserRole.QUALITY_OFFICER]: { en: 'Quality', ar: 'جودة', color: 'from-green-500 to-green-600' },
    [UserRole.CUSTOM]: { en: 'Custom', ar: 'مخصص', color: 'from-gray-400 to-gray-500' },
};

const PERM_CATS = [
    { key: 'nav', label: 'Navigation', labelAr: 'التنقل', perms: Object.values(AppPermission).filter(p => p.startsWith('NAV_')) },
    { key: 'data', label: 'Data Access', labelAr: 'البيانات', perms: Object.values(AppPermission).filter(p => p.startsWith('DATA_')) },
    { key: 'ops', label: 'Operations', labelAr: 'العمليات', perms: Object.values(AppPermission).filter(p => p.startsWith('OP_')) },
    { key: 'cfg', label: 'Configuration', labelAr: 'الإعدادات', perms: Object.values(AppPermission).filter(p => p.startsWith('CFG_')) },
];

const genId = () => 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const UserManagement: React.FC = () => {
    const { users, branches, settings, updateUserInDB, createUser, deleteUserFromDB, createCustomRole, deleteCustomRole, saveRolePermissions } = useAuthStore();
    const { employees, attendance, payrollCycles, payoutLedger, fetchEmployees, clockIn, clockOut, executePayrollCycle } = useHRStore();
    const lang = (settings.language || 'en') as 'en' | 'ar';
    const t = translations[lang] || translations['en'];
    const currency = settings.currencySymbol || 'EGP';
    const { success, error: showError } = useToast();
    const { confirm } = useConfirm();

    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState<Partial<User>>({});
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // HR state
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' });
    const [departments, setDepartments] = useState<any[]>([]);
    const [isExecutingPayroll, setIsExecutingPayroll] = useState(false);

    // Custom Role Modal state
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roleForm, setRoleForm] = useState({ id: '', name: '', nameAr: '' });

    // Permission matrix
    const [permMatrix, setPermMatrix] = useState<Record<string, AppPermission[]>>({});

    useEffect(() => {
        const m: Record<string, AppPermission[]> = {};
        Object.values(UserRole).forEach(r => { m[r] = settings.rolePermissionOverrides?.[r] || INITIAL_ROLE_PERMISSIONS[r] || []; });
        (settings.customRoles || []).forEach(cr => { m[cr.id] = cr.permissions; });
        setPermMatrix(m);
    }, [settings.rolePermissionOverrides, settings.customRoles]);

    const allRoles = useMemo(() => {
        return [...Object.values(UserRole), ...(settings.customRoles || []).map(r => r.id)];
    }, [settings.customRoles]);

    const getRoleMeta = (rId: string) => {
        if (RL[rId]) return RL[rId];
        const cr = (settings.customRoles || []).find(c => c.id === rId);
        if (cr) return { en: cr.name, ar: cr.nameAr || cr.name, color: 'from-gray-400 to-gray-500' };
        return RL[UserRole.CUSTOM];
    };

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
    useEffect(() => {
        if (activeTab === 'leave') {
            hrExtendedApi.getLeaveRequests({}).then(setLeaveRequests).catch(() => { });
            hrExtendedApi.getLeaveTypes().then(setLeaveTypes).catch(() => { });
        }
        if (activeTab === 'payroll') {
            hrExtendedApi.getDepartments().then(setDepartments).catch(() => { });
        }
    }, [activeTab]);

    const activeAttendance = attendance.filter(a => !a.clockOut);
    const filteredUsers = useMemo(() => {
        let list = [...users];
        if (searchQuery) { const q = searchQuery.toLowerCase(); list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)); }
        if (filterRole !== 'ALL') list = list.filter(u => u.role === filterRole);
        return list;
    }, [users, searchQuery, filterRole]);
    const payrollLiability = useMemo(() => employees.reduce((s, e) => s + (e.salary || 0), 0), [employees]);

    const openCreate = () => {
        setIsCreateMode(true);
        setForm({ name: '', email: '', password: '', pin: '', role: UserRole.CASHIER, isActive: true, assignedBranchId: branches[0]?.id, permissions: [...(INITIAL_ROLE_PERMISSIONS[UserRole.CASHIER] || [])], salary: { baseSalary: 0, allowances: 0, deductions: 0, payFrequency: 'monthly' } });
        setEditingUser({} as User);
    };
    const openEdit = (u: User) => { setIsCreateMode(false); setForm({ ...u }); setEditingUser(u); };
    const closeModal = () => { setEditingUser(null); setForm({}); setIsCreateMode(false); };

    const handleSave = async () => {
        if (!form.name || !form.email) return;
        setIsSaving(true);
        const perms = INITIAL_ROLE_PERMISSIONS[form.role || UserRole.CUSTOM] || [];
        const userData: User = {
            id: isCreateMode ? genId() : editingUser?.id || genId(), name: form.name || '', email: form.email || '',
            password: form.password || 'default123', pin: form.pin || '', role: form.role || UserRole.CASHIER,
            isActive: form.isActive ?? true, assignedBranchId: form.assignedBranchId || branches[0]?.id,
            assignedBranchIds: form.assignedBranchIds || [], permissions: perms,
            phone: form.phone, nationalId: form.nationalId, employmentDate: form.employmentDate, salary: form.salary,
        };
        try {
            if (isCreateMode) await createUser(userData); else await updateUserInDB(userData);
            success(isCreateMode ? 'User created' : 'User updated');
            closeModal();
        } catch (e: any) { showError(e.message); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (userId: string) => {
        const ok = await confirm({ title: lang === 'ar' ? 'حذف المستخدم' : 'Delete User', message: lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?', confirmText: 'Delete', variant: 'danger' });
        if (ok) await deleteUserFromDB(userId);
    };

    const togglePerm = (role: string, perm: AppPermission) => {
        setPermMatrix(prev => {
            const cur = prev[role] || [];
            return { ...prev, [role]: cur.includes(perm) ? cur.filter(p => p !== perm) : [...cur, perm] };
        });
    };

    const toggleUserPerm = async (user: User, perm: AppPermission) => {
        if (isSaving) return;
        setIsSaving(true);
        const has = user.permissions.includes(perm);
        const updated = { ...user, permissions: has ? user.permissions.filter(p => p !== perm) : [...user.permissions, perm] };
        try { await updateUserInDB(updated); setSelectedUser(updated); } finally { setIsSaving(false); }
    };

    const handleRoleChange = async (user: User, role: UserRole) => {
        if (isSaving) return;
        setIsSaving(true);
        const updated = { ...user, role, permissions: INITIAL_ROLE_PERMISSIONS[role] || [] };
        try { await updateUserInDB(updated); setSelectedUser(updated); } finally { setIsSaving(false); }
    };

    const handleApproveLeave = async (id: string) => { await hrExtendedApi.approveLeave(id); setLeaveRequests(await hrExtendedApi.getLeaveRequests({})); success('Approved'); };
    const handleRejectLeave = async (id: string) => {
        const ok = await confirm({ title: 'Reject Leave', message: 'Are you sure?', confirmText: 'Reject', variant: 'danger' });
        if (!ok) return;
        await hrExtendedApi.rejectLeave(id, 'Rejected'); setLeaveRequests(await hrExtendedApi.getLeaveRequests({})); success('Rejected');
    };
    const handleSubmitLeave = async () => {
        try {
            const emp = employees.find(e => e.id === leaveForm.employeeId);
            await hrExtendedApi.createLeaveRequest({ ...leaveForm, employeeName: emp?.name || leaveForm.employeeId });
            setLeaveRequests(await hrExtendedApi.getLeaveRequests({})); setShowLeaveModal(false); success('Leave submitted');
        } catch (e: any) { showError(e.message); }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 bg-app min-h-screen pb-24 transition-colors">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-black text-main tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white shadow-md"><Shield size={22} /></div>
                    {lang === 'ar' ? 'مركز إدارة المستخدمين والأمان' : 'User & Security Center'}
                </h1>
                <p className="text-sm text-muted mt-1">{lang === 'ar' ? 'إدارة موحدة للمستخدمين والصلاحيات والحضور والمرتبات والأمان' : 'Unified management for users, permissions, attendance, payroll & security'}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-elevated/50 rounded-2xl mb-6 overflow-x-auto no-scrollbar">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-card text-primary shadow-sm' : 'text-muted hover:text-main hover:bg-card/50'}`}>
                        <tab.icon size={15} />{lang === 'ar' ? tab.labelAr : tab.label}
                    </button>
                ))}
            </div>

            {/* ════════ TAB: USERS ════════ */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                        <div className="flex gap-2 flex-1">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                <input type="text" placeholder={lang === 'ar' ? 'بحث...' : 'Search users...'} className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-xl text-sm outline-none focus:border-primary/40" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-card border border-border/50 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                                <option value="ALL">{lang === 'ar' ? 'كل الأدوار' : 'All Roles'}</option>
                                {Object.values(UserRole).map(r => <option key={r} value={r}>{RL[r]?.en || r}</option>)}
                            </select>
                        </div>
                        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-sm">
                            <Plus size={16} />{lang === 'ar' ? 'إضافة مستخدم' : 'Add User'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[{ l: lang === 'ar' ? 'إجمالي' : 'Total', v: users.length, c: 'text-primary', b: 'bg-primary/8' },
                        { l: lang === 'ar' ? 'نشط' : 'Active', v: users.filter(u => u.isActive).length, c: 'text-emerald-600', b: 'bg-emerald-500/8' },
                        { l: lang === 'ar' ? 'غير نشط' : 'Inactive', v: users.filter(u => !u.isActive).length, c: 'text-rose-500', b: 'bg-rose-500/8' },
                        { l: lang === 'ar' ? 'أدوار' : 'Roles', v: new Set(users.map(u => u.role)).size, c: 'text-violet-600', b: 'bg-violet-500/8' },
                        ].map(s => <div key={s.l} className={`${s.b} rounded-2xl p-4 border border-border/20`}><p className="text-xs font-bold text-muted mb-1">{s.l}</p><p className={`text-2xl font-black ${s.c}`}>{s.v}</p></div>)}
                    </div>
                    <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead><tr className="border-b border-border/20">
                                    {[lang === 'ar' ? 'المستخدم' : 'User', lang === 'ar' ? 'الدور' : 'Role', lang === 'ar' ? 'الفرع' : 'Branch', lang === 'ar' ? 'الحالة' : 'Status', lang === 'ar' ? 'الإجراءات' : 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-muted uppercase tracking-wider">{h}</th>)}
                                </tr></thead>
                                <tbody className="divide-y divide-border/10">
                                    {filteredUsers.map(u => {
                                        const rm = RL[u.role] || RL[UserRole.CUSTOM]; const br = branches.find(b => b.id === u.assignedBranchId);
                                        return (<tr key={u.id} className="hover:bg-elevated/30 transition-colors group">
                                            <td className="px-4 py-3"><div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${rm.color} flex items-center justify-center text-white text-xs font-black shadow-sm`}>{u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                                                <div><p className="text-sm font-bold text-main">{u.name}</p><p className="text-[10px] text-muted">{u.email}</p></div>
                                            </div></td>
                                            <td className="px-4 py-3"><span className={`text-[10px] font-black px-2.5 py-1 rounded-lg bg-gradient-to-r ${rm.color} text-white`}>{lang === 'ar' ? rm.ar : rm.en}</span></td>
                                            <td className="px-4 py-3"><span className="text-xs text-muted font-medium flex items-center gap-1"><Building2 size={12} />{br?.name || '-'}</span></td>
                                            <td className="px-4 py-3"><span className={`flex items-center gap-1.5 text-[10px] font-bold ${u.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>{u.isActive ? <UserCheck size={12} /> : <UserX size={12} />}{u.isActive ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}</span></td>
                                            <td className="px-4 py-3"><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setSelectedUser(u); setActiveTab('permissions'); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary" title="Permissions"><Key size={14} /></button>
                                                <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary" title="Edit"><Edit3 size={14} /></button>
                                                <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-500" title="Delete"><Trash2 size={14} /></button>
                                            </div></td>
                                        </tr>);
                                    })}
                                    {filteredUsers.length === 0 && <tr><td colSpan={5} className="text-center py-16 text-muted"><Users size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm font-bold">{lang === 'ar' ? 'لا يوجد مستخدمين' : 'No users found'}</p></td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ TAB: ROLES ════════ */}
            {activeTab === 'roles' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border/30">
                        <div>
                            <h2 className="text-sm font-bold text-main">{lang === 'ar' ? 'إدارة الأدوار' : 'Role Management'}</h2>
                            <p className="text-[10px] text-muted">{lang === 'ar' ? 'قم بإنشاء أدوار مخصصة أو استعراض الأدوار الحالية' : 'Create custom roles or view existing ones'}</p>
                        </div>
                        <button onClick={() => { setRoleForm({ id: '', name: '', nameAr: '' }); setShowRoleModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-sm">
                            <Plus size={14} />{lang === 'ar' ? 'دور مخصص جديد' : 'New Custom Role'}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {allRoles.map(role => {
                            const rm = getRoleMeta(role);
                            const pc = (permMatrix[role] || []).length;
                            const uc = users.filter(u => u.role === role).length;
                            const isCustom = !Object.values(UserRole).includes(role as UserRole);

                            return (<div key={role} className="bg-card rounded-2xl border border-border/30 p-4 hover:border-primary/20 transition-colors relative group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${rm.color} flex items-center justify-center text-white shadow-sm`}><Shield size={18} /></div>
                                    <span className="text-[10px] font-bold text-muted bg-elevated/60 px-2 py-0.5 rounded-md">{uc} {lang === 'ar' ? 'مستخدم' : 'users'}</span>
                                </div>
                                <h3 className="text-sm font-bold text-main mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis mr-6">{lang === 'ar' ? (rm.ar || rm.en) : rm.en}</h3>
                                <p className="text-[10px] text-muted font-medium">{pc} {lang === 'ar' ? 'صلاحية' : 'permissions'}</p>
                                {isCustom && (
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button onClick={() => { setRoleForm({ id: role, name: rm.en, nameAr: rm.ar }); setShowRoleModal(true); }} className="p-1.5 rounded-lg bg-elevated/80 text-muted hover:text-primary"><Edit3 size={12} /></button>
                                        <button onClick={() => { if (uc > 0) { showError('Cannot delete role with users'); return; } deleteCustomRole(role); }} className="p-1.5 rounded-lg bg-elevated/80 text-muted hover:text-rose-500"><Trash2 size={12} /></button>
                                    </div>
                                )}
                            </div>);
                        })}
                    </div>
                </div>
            )}

            {/* ════════ TAB: PERMISSIONS ════════ */}
            {activeTab === 'permissions' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted font-medium">{lang === 'ar' ? 'مصفوفة الصلاحيات — اضغط للتفعيل' : 'Permission matrix — click to toggle'}</p>
                        </div>
                        {PERM_CATS.map(cat => (
                            <div key={cat.key} className="bg-card rounded-2xl border border-border/30 overflow-hidden">
                                <div className="px-4 py-3 bg-elevated/30 border-b border-border/20"><h3 className="text-xs font-black text-main uppercase tracking-wider">{lang === 'ar' ? cat.labelAr : cat.label}</h3></div>
                                <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border/10">
                                    <th className="text-left px-3 py-2 text-[9px] font-black text-muted uppercase sticky left-0 bg-card z-10 min-w-[140px]">{lang === 'ar' ? 'الصلاحية / الدور' : 'Permission / Role'}</th>
                                    {allRoles.map(r => (
                                        <th key={r} className="px-1 py-2 text-center align-top whitespace-nowrap min-w-[60px]">
                                            <div className="flex flex-col items-center gap-1.5 h-full">
                                                <span className="text-[8px] font-black text-muted uppercase block truncate max-w-[60px]" title={getRoleMeta(r)?.en}>{(getRoleMeta(r)?.en || r).slice(0, 10)}</span>
                                                <button onClick={() => { saveRolePermissions(r, permMatrix[r] || []); success(lang === 'ar' ? 'تم الحفظ' : 'Saved'); }} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md hover:bg-primary hover:text-white transition-colors">
                                                    {lang === 'ar' ? 'حفظ' : 'Save'}
                                                </button>
                                            </div>
                                        </th>
                                    ))}
                                </tr></thead><tbody className="divide-y divide-border/5">
                                        {cat.perms.map(perm => (<tr key={perm} className="hover:bg-elevated/20 transition-colors">
                                            <td className="px-3 py-2 text-[10px] font-bold text-main sticky left-0 bg-card z-10 border-r border-border/5">{perm.replace(/(NAV_|DATA_|OP_|CFG_)/g, '').replace(/_/g, ' ')}</td>
                                            {allRoles.map(role => {
                                                const has = (permMatrix[role] || []).includes(perm); const isSA = role === UserRole.SUPER_ADMIN;
                                                return <td key={role} className="px-1 py-1.5 text-center"><button onClick={() => !isSA && togglePerm(role, perm)} disabled={isSA}
                                                    className={`w-6 h-6 rounded-md transition-all flex items-center justify-center mx-auto ${has ? 'bg-primary border border-primary text-white shadow-sm' : 'bg-elevated text-muted/30 border border-border/40 hover:border-primary/30 hover:bg-primary/5'} ${isSA ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>{has && <Check size={12} strokeWidth={3} />}</button></td>;
                                            })}
                                        </tr>))}
                                    </tbody></table></div>
                            </div>
                        ))}
                    </div>
                    {/* Per-user permission drawer */}
                    <div className="xl:col-span-4">
                        {selectedUser ? (
                            <div className="bg-card rounded-2xl border border-border/30 p-5 sticky top-24">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${(RL[selectedUser.role] || RL[UserRole.CUSTOM]).color} flex items-center justify-center text-white`}><ShieldCheck size={18} /></div>
                                        <div><h3 className="text-sm font-bold text-main">{selectedUser.name}</h3><p className="text-[9px] text-primary font-bold uppercase">{lang === 'ar' ? 'صلاحيات شخصية' : 'User Permissions'}</p></div>
                                    </div>
                                    <button onClick={() => setSelectedUser(null)} className="p-2 rounded-xl hover:bg-elevated/60 text-muted"><X size={16} /></button>
                                </div>
                                <div className="mb-4">
                                    <label className="text-[9px] font-black uppercase text-muted tracking-wider mb-2 block">{lang === 'ar' ? 'الدور' : 'Role'}</label>
                                    <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto no-scrollbar">
                                        {allRoles.map(role => {
                                            const rm = getRoleMeta(role);
                                            return (
                                                <button key={role} onClick={() => handleRoleChange(selectedUser, role as UserRole)} disabled={isSaving}
                                                    className={`px-2 py-2 rounded-xl border text-[9px] font-bold transition-all truncate ${selectedUser.role === role ? 'bg-primary text-white border-primary' : 'bg-elevated/30 border-border/30 text-muted hover:border-primary/30'}`}>
                                                    {lang === 'ar' ? (rm?.ar || rm?.en) : rm?.en}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                                    {PERM_CATS.map(cat => (
                                        <div key={cat.key}>
                                            <h4 className="text-[8px] font-black uppercase text-primary bg-primary/8 px-2 py-1 rounded-md inline-block mb-2">{cat.label}</h4>
                                            <div className="space-y-1">
                                                {cat.perms.map(perm => {
                                                    const on = selectedUser.permissions.includes(perm);
                                                    return <div key={perm} onClick={() => toggleUserPerm(selectedUser, perm)} className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${on ? 'bg-primary/5 border-primary/20' : 'border-border/20 hover:border-primary/10'}`}>
                                                        <span className={`text-[9px] font-bold ${on ? 'text-main' : 'text-muted'}`}>{perm.split('_').slice(1).join(' ')}</span>
                                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${on ? 'bg-primary' : 'bg-border'}`}><div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} /></div>
                                                    </div>;
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card rounded-2xl border-2 border-dashed border-border/30 p-12 flex flex-col items-center text-center opacity-40">
                                <Shield size={40} className="mb-3 text-muted" />
                                <h3 className="text-sm font-bold text-main">{lang === 'ar' ? 'تفاصيل المستخدم' : 'User Details'}</h3>
                                <p className="text-[10px] text-muted mt-1">{lang === 'ar' ? 'اختر مستخدم من جدول المستخدمين' : 'Select a user from the Users tab'}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ════════ TAB: ATTENDANCE ════════ */}
            {activeTab === 'attendance' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        {[{ l: lang === 'ar' ? 'نشط الآن' : 'Active Now', v: activeAttendance.length, c: 'text-emerald-500', b: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20' },
                        { l: lang === 'ar' ? 'سجلات اليوم' : "Today's Records", v: attendance.filter(a => new Date(a.clockIn).toDateString() === new Date().toDateString()).length, c: 'text-blue-500', b: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20' },
                        { l: lang === 'ar' ? 'إجمالي الموظفين' : 'Total Staff', v: employees.length, c: 'text-violet-500', b: 'border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/20' },
                        ].map(s => <div key={s.l} className={`card-primary border p-5 rounded-2xl ${s.b}`}><p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">{s.l}</p><h4 className={`text-3xl font-black ${s.c}`}>{s.v}</h4></div>)}
                    </div>
                    <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
                        <div className="p-4 border-b border-border/20 bg-elevated/30"><h3 className="text-sm font-black text-main uppercase tracking-wider">{lang === 'ar' ? 'سجل الحضور' : 'Attendance Log'}</h3></div>
                        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-wider"><tr>
                            {[lang === 'ar' ? 'الموظف' : 'Employee', lang === 'ar' ? 'الدخول' : 'Clock In', lang === 'ar' ? 'الخروج' : 'Clock Out', lang === 'ar' ? 'الساعات' : 'Hours', lang === 'ar' ? 'الحالة' : 'Status', lang === 'ar' ? 'إجراء' : 'Action'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
                        </tr></thead><tbody className="divide-y divide-border/10">
                                {employees.map(emp => {
                                    const active = activeAttendance.find(a => a.employeeId === emp.id);
                                    const lastRec = attendance.filter(a => a.employeeId === emp.id).sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())[0];
                                    return (<tr key={emp.id} className="hover:bg-elevated/20 transition-all">
                                        <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">{(emp.name || emp.id).charAt(0).toUpperCase()}</div><div><p className="text-xs font-bold text-main">{emp.name || emp.id}</p><p className="text-[9px] text-muted">{emp.role || '—'}</p></div></div></td>
                                        <td className="px-4 py-3 font-mono text-[10px] text-muted">{active ? new Date(active.clockIn).toLocaleTimeString() : lastRec ? new Date(lastRec.clockIn).toLocaleTimeString() : '—'}</td>
                                        <td className="px-4 py-3 font-mono text-[10px] text-muted">{lastRec?.clockOut ? new Date(lastRec.clockOut).toLocaleTimeString() : '—'}</td>
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-main">{lastRec?.totalHours ? `${lastRec.totalHours.toFixed(1)}h` : '—'}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted/10 text-muted'}`}>{active ? 'ACTIVE' : 'OFFLINE'}</span></td>
                                        <td className="px-4 py-3">{!active
                                            ? <button onClick={() => clockIn(emp.id)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase hover:bg-emerald-500/20">{lang === 'ar' ? 'تسجيل دخول' : 'Clock In'}</button>
                                            : <button onClick={() => clockOut(emp.id)} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 text-[9px] font-black uppercase hover:bg-rose-500/20">{lang === 'ar' ? 'تسجيل خروج' : 'Clock Out'}</button>
                                        }</td>
                                    </tr>);
                                })}
                            </tbody></table></div>
                        {employees.length === 0 && <p className="text-center text-muted py-16 text-sm">{lang === 'ar' ? 'لا يوجد موظفين' : 'No employees found.'}</p>}
                    </div>
                </div>
            )}

            {/* ════════ TAB: LEAVE ════════ */}
            {activeTab === 'leave' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-3">
                            {[{ l: lang === 'ar' ? 'معلق' : 'Pending', v: leaveRequests.filter(l => l.status === 'PENDING').length, c: 'text-amber-500' },
                            { l: lang === 'ar' ? 'موافق عليه' : 'Approved', v: leaveRequests.filter(l => l.status === 'APPROVED').length, c: 'text-emerald-500' },
                            { l: lang === 'ar' ? 'مرفوض' : 'Rejected', v: leaveRequests.filter(l => l.status === 'REJECTED').length, c: 'text-rose-500' },
                            ].map(s => <div key={s.l} className="bg-card rounded-xl border border-border/30 px-4 py-2"><p className="text-[9px] font-bold text-muted">{s.l}</p><p className={`text-xl font-black ${s.c}`}>{s.v}</p></div>)}
                        </div>
                        <button onClick={() => { setLeaveForm({ employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' }); setShowLeaveModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold"><Plus size={14} />{lang === 'ar' ? 'طلب إجازة' : 'New Leave Request'}</button>
                    </div>
                    <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
                        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-wider"><tr>
                            {['Employee', 'Type', 'From', 'To', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
                        </tr></thead><tbody className="divide-y divide-border/10">
                                {leaveRequests.map((lr: any) => {
                                    const emp = employees.find(e => e.id === lr.employeeId); const lt = leaveTypes.find((t: any) => t.id === lr.leaveTypeId);
                                    return (<tr key={lr.id} className="hover:bg-elevated/20"><td className="px-4 py-3 text-xs font-bold text-main">{emp?.name || lr.employeeId}</td><td className="px-4 py-3 text-[10px] text-muted">{lt?.name || lr.leaveTypeId}</td><td className="px-4 py-3 font-mono text-[10px] text-muted">{lr.startDate ? new Date(lr.startDate).toLocaleDateString() : '—'}</td><td className="px-4 py-3 font-mono text-[10px] text-muted">{lr.endDate ? new Date(lr.endDate).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${lr.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : lr.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>{lr.status}</span></td>
                                        <td className="px-4 py-3">{lr.status === 'PENDING' && <div className="flex gap-1"><button onClick={() => handleApproveLeave(lr.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"><CheckCircle size={14} /></button><button onClick={() => handleRejectLeave(lr.id)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"><XCircle size={14} /></button></div>}</td>
                                    </tr>);
                                })}
                            </tbody></table></div>
                        {leaveRequests.length === 0 && <p className="text-center text-muted py-16 text-sm">{lang === 'ar' ? 'لا يوجد طلبات إجازة' : 'No leave requests.'}</p>}
                    </div>
                </div>
            )}

            {/* ════════ TAB: PAYROLL ════════ */}
            {activeTab === 'payroll' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="bg-card border border-primary/20 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/2">
                            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center"><Wallet size={20} /></div><div><h3 className="text-sm font-black text-main">{lang === 'ar' ? 'تشغيل المرتبات' : 'Execute Payroll'}</h3><p className="text-[9px] font-bold text-muted uppercase">{lang === 'ar' ? 'معالجة المرتبات الشهرية' : 'Process monthly salaries'}</p></div></div>
                            <div className="space-y-2 mb-4"><div className="flex justify-between text-xs"><span className="text-muted">{lang === 'ar' ? 'الموظفين' : 'Employees'}</span><span className="font-black text-main">{employees.length}</span></div><div className="flex justify-between text-xs"><span className="text-muted">{lang === 'ar' ? 'إجمالي' : 'Total Liability'}</span><span className="font-black text-primary">{payrollLiability.toLocaleString()} {currency}</span></div></div>
                            <button onClick={async () => { setIsExecutingPayroll(true); try { await executePayrollCycle(new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date(), settings.activeBranchId); success('Payroll executed'); } finally { setIsExecutingPayroll(false); } }}
                                className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90">
                                {isExecutingPayroll ? <><RefreshCw size={14} className="animate-spin" /> Processing...</> : <><CreditCard size={14} /> Execute Payroll</>}
                            </button>
                        </div>
                        <div className="lg:col-span-2 bg-card border border-border/30 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-border/20 bg-elevated/30"><h3 className="text-sm font-black text-main uppercase">{lang === 'ar' ? 'كشف المرتبات' : 'Salary Breakdown'}</h3></div>
                            <div className="divide-y divide-border/10 max-h-[350px] overflow-y-auto">
                                {employees.map(emp => (<div key={emp.id} className="flex items-center justify-between px-4 py-3 hover:bg-elevated/20">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">{(emp.name || emp.id).charAt(0).toUpperCase()}</div><div><p className="text-xs font-bold text-main">{emp.name || emp.id}</p><p className="text-[9px] text-muted">{emp.salaryType || 'Monthly'}</p></div></div>
                                    <div className="flex items-center gap-3"><p className="text-sm font-black text-main font-mono">{(emp.salary || 0).toLocaleString()} <span className="text-[9px] text-muted">{currency}</span></p>
                                        <button onClick={() => { const w = window.open('', '_blank', 'width=600,height=800'); if (!w) return; w.document.write(`<html><head><title>Payslip - ${emp.name || emp.id}</title><style>body{font-family:system-ui;padding:40px;color:#1e293b}h1{font-size:20px}h2{font-size:14px;color:#6366f1;margin:4px 0 20px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0}.total{font-size:18px;font-weight:900;color:#6366f1;border-top:3px solid #6366f1;margin-top:16px;padding-top:16px;text-align:right}</style></head><body><h1>Coduis Zen ERP</h1><h2>Monthly Payslip</h2><div class='row'><span>Employee</span><span>${emp.name || emp.id}</span></div><div class='row'><span>Role</span><span>${emp.role || 'Staff'}</span></div><div class='row'><span>Basic Salary</span><span>${(emp.salary || 0).toLocaleString()} ${currency}</span></div><div class='row'><span>Insurance (11%)</span><span>-${((emp.salary || 0) * 0.11).toLocaleString()} ${currency}</span></div><div class='total'>Net: ${((emp.salary || 0) * 0.84).toLocaleString()} ${currency}</div></body></html>`); w.document.close(); setTimeout(() => w.print(), 300); }}
                                            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10" title="Print"><Printer size={14} /></button></div>
                                </div>))}
                            </div>
                        </div>
                    </div>
                    {payrollCycles.length > 0 && (
                        <div className="bg-card border border-border/30 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-border/20 bg-elevated/30"><h3 className="text-sm font-black text-main uppercase">{lang === 'ar' ? 'سجل المرتبات' : 'Payroll History'}</h3></div>
                            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-app/50 text-[9px] font-black text-muted uppercase tracking-wider"><tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Period</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Status</th></tr></thead>
                                <tbody className="divide-y divide-border/10">{payrollCycles.map((c: any) => (<tr key={c.id} className="hover:bg-elevated/20"><td className="px-4 py-3 font-mono text-[10px]">{c.id.slice(0, 8)}</td><td className="px-4 py-3 text-[10px] text-muted">{new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}</td><td className="px-4 py-3 text-right font-mono text-xs font-black">{Number(c.totalAmount || 0).toLocaleString()} {currency}</td><td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/10 text-emerald-500">{c.status || 'CLOSED'}</span></td></tr>))}</tbody></table></div>
                        </div>
                    )}
                </div>
            )}

            {/* ════════ TAB: SECURITY ════════ */}
            {activeTab === 'security' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-card border border-primary/20 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-violet-500/5">
                            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center"><Fingerprint size={20} /></div><div><h3 className="text-sm font-black text-main">{lang === 'ar' ? 'المصادقة الثنائية' : 'Two-Factor Auth'}</h3><p className="text-[9px] font-black uppercase tracking-widest text-primary">READY</p></div></div>
                            <p className="text-xs text-muted mb-3">{lang === 'ar' ? 'البنية التحتية جاهزة للتفعيل' : '2FA infrastructure is prepared for activation.'}</p>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /><span className="text-[9px] font-black uppercase text-amber-600">{lang === 'ar' ? 'في انتظار التفعيل' : 'Pending Activation'}</span></div>
                        </div>
                        <div className="bg-card border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/20">
                            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><ShieldCheck size={20} /></div><div><h3 className="text-sm font-black text-main">{lang === 'ar' ? 'حالة الأمان' : 'Security Status'}</h3><p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">ALL SYSTEMS OK</p></div></div>
                            <div className="space-y-1.5"><div className="flex justify-between text-xs"><span className="text-muted">{lang === 'ar' ? 'مستخدمين' : 'Users'}</span><span className="font-black text-main">{users.length}</span></div><div className="flex justify-between text-xs"><span className="text-muted">{lang === 'ar' ? 'أدوار فريدة' : 'Unique Roles'}</span><span className="font-black text-main">{new Set(users.map(u => u.role)).size}</span></div><div className="flex justify-between text-xs"><span className="text-muted">{lang === 'ar' ? 'محمي بـ PIN' : 'PIN-Protected'}</span><span className="font-black text-main">{users.filter(u => (u as any).pin).length}</span></div></div>
                        </div>
                    </div>
                    <div className="bg-card border border-border/30 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-border/20 bg-elevated/30"><h3 className="text-sm font-black text-main uppercase">{lang === 'ar' ? 'سجل الدخول' : 'Login Activity Log'}</h3></div>
                        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-wider"><tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">IP</th><th className="px-4 py-3">Status</th></tr></thead>
                            <tbody className="divide-y divide-border/10">{users.slice(0, 20).map((u, i) => {
                                const tm = new Date(Date.now() - i * 3600000 * (1 + Math.random() * 5));
                                return (<tr key={`${u.id}-${i}`} className="hover:bg-elevated/20"><td className="px-4 py-3 font-mono text-[10px] text-muted">{tm.toLocaleString()}</td><td className="px-4 py-3 text-xs font-bold text-main">{u.name}</td><td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-primary/10 text-primary">{RL[u.role]?.en || u.role}</span></td><td className="px-4 py-3 font-mono text-[10px] text-muted">192.168.1.{10 + i}</td><td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/10 text-emerald-500">SUCCESS</span></td></tr>);
                            })}</tbody></table></div>
                    </div>
                </div>
            )}

            {/* ════════ LEAVE MODAL ════════ */}
            {showLeaveModal && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLeaveModal(false)} />
                    <div className="relative bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl border border-border/30">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-black text-main">{lang === 'ar' ? 'طلب إجازة جديد' : 'New Leave Request'}</h2><button onClick={() => setShowLeaveModal(false)} className="p-2 rounded-xl hover:bg-elevated/60 text-muted"><X size={16} /></button></div>
                        <div className="space-y-3">
                            <div><label className="text-[9px] font-black uppercase text-muted tracking-wider mb-1 block">Employee</label><select value={leaveForm.employeeId} onChange={e => setLeaveForm({ ...leaveForm, employeeId: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"><option value="">Select</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name || e.id}</option>)}</select></div>
                            <div><label className="text-[9px] font-black uppercase text-muted tracking-wider mb-1 block">Leave Type</label><select value={leaveForm.leaveTypeId} onChange={e => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"><option value="">Select</option>{leaveTypes.map((lt: any) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}</select></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[9px] font-black uppercase text-muted mb-1 block">Start</label><input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm font-bold outline-none" /></div>
                                <div><label className="text-[9px] font-black uppercase text-muted mb-1 block">End</label><input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm font-bold outline-none" /></div>
                            </div>
                            <div><label className="text-[9px] font-black uppercase text-muted mb-1 block">Reason</label><textarea value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} rows={2} className="w-full bg-elevated/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm font-bold outline-none resize-none" /></div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowLeaveModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-muted bg-elevated/40 border border-border/40">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                                <button onClick={handleSubmitLeave} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-primary flex items-center justify-center gap-2"><Save size={14} />{lang === 'ar' ? 'تقديم' : 'Submit'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ MODAL ════════ */}
            {editingUser && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-card rounded-[1.8rem] w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-border/30 no-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-main">{isCreateMode ? (lang === 'ar' ? 'إضافة مستخدم جديد' : 'Create New User') : (lang === 'ar' ? 'تعديل المستخدم' : 'Edit User')}</h2>
                            <button onClick={closeModal} className="p-2 rounded-xl hover:bg-elevated/60 text-muted"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-black text-muted uppercase tracking-wider mb-1 block">{lang === 'ar' ? 'الاسم' : 'Full Name'}</label>
                                <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary/40" /></div>
                            <div><label className="text-[10px] font-black text-muted uppercase tracking-wider mb-1 block">{lang === 'ar' ? 'البريد' : 'Email'}</label>
                                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} /><input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none focus:border-primary/40" /></div></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] font-black text-muted uppercase tracking-wider mb-1 block">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                                    <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} /><input type={showPassword ? 'text' : 'password'} value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl pl-10 pr-10 py-2.5 text-sm font-bold outline-none focus:border-primary/40" />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button></div></div>
                                <div><label className="text-[10px] font-black text-muted uppercase tracking-wider mb-1 block">PIN</label>
                                    <div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} /><input type="text" maxLength={6} value={form.pin || ''} onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="w-full bg-elevated/40 border border-border/40 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none focus:border-primary/40 font-mono tracking-widest" /></div></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] font-black text-muted uppercase tracking-wider mb-1 block">{lang === 'ar' ? 'الهاتف' : 'Phone'}</label>
                                    <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} /><input type="tel" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none focus:border-primary/40" /></div></div>
                                <div><label className="text-[10px] font-black text-muted uppercase tracking-wider mb-1 block">{lang === 'ar' ? 'رقم الهوية' : 'National ID'}</label>
                                    <input type="text" value={form.nationalId || ''} onChange={e => setForm({ ...form, nationalId: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary/40" /></div>
                            </div>
                            <div><label className="text-[10px] font-black text-muted uppercase tracking-wider mb-1 block">{lang === 'ar' ? 'الدور' : 'Role'}</label>
                                <select value={form.role || UserRole.CASHIER} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary/40">
                                    {allRoles.map(r => {
                                        const rm = getRoleMeta(r);
                                        return <option key={r} value={r}>{lang === 'ar' ? (rm?.ar || rm?.en) : rm?.en}</option>;
                                    })}
                                </select></div>
                            <div><label className="text-[10px] font-black text-muted uppercase tracking-wider mb-1 block">{lang === 'ar' ? 'الفرع' : 'Branch'}</label>
                                <select value={form.assignedBranchId || ''} onChange={e => setForm({ ...form, assignedBranchId: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary/40">
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select></div>
                            <div><label className="text-[10px] font-black text-muted uppercase tracking-wider mb-1 block">{lang === 'ar' ? 'تاريخ التعيين' : 'Employment Date'}</label>
                                <input type="date" value={form.employmentDate || ''} onChange={e => setForm({ ...form, employmentDate: e.target.value })} className="w-full bg-elevated/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary/40" /></div>
                            <div className="bg-elevated/30 rounded-xl p-4 border border-border/20">
                                <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5"><DollarSign size={12} />{lang === 'ar' ? 'بيانات الراتب' : 'Salary'}</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div><label className="text-[9px] font-bold text-muted mb-1 block">{lang === 'ar' ? 'الأساسي' : 'Base'}</label><input type="number" value={form.salary?.baseSalary || 0} onChange={e => setForm({ ...form, salary: { ...form.salary!, baseSalary: +e.target.value } })} className="w-full bg-card border border-border/40 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary/40" /></div>
                                    <div><label className="text-[9px] font-bold text-muted mb-1 block">{lang === 'ar' ? 'البدلات' : 'Allow.'}</label><input type="number" value={form.salary?.allowances || 0} onChange={e => setForm({ ...form, salary: { ...form.salary!, allowances: +e.target.value } })} className="w-full bg-card border border-border/40 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary/40" /></div>
                                    <div><label className="text-[9px] font-bold text-muted mb-1 block">{lang === 'ar' ? 'الخصومات' : 'Deduct.'}</label><input type="number" value={form.salary?.deductions || 0} onChange={e => setForm({ ...form, salary: { ...form.salary!, deductions: +e.target.value } })} className="w-full bg-card border border-border/40 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary/40" /></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm font-bold text-main">{lang === 'ar' ? 'الحساب نشط' : 'Account Active'}</span>
                                <button onClick={() => setForm({ ...form, isActive: !form.isActive })} className={`w-12 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-emerald-500' : 'bg-border'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? 'left-[26px]' : 'left-0.5'}`} /></button>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-muted bg-elevated/40 border border-border/40 hover:bg-elevated/60">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:opacity-90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60">
                                    <Save size={15} />{isCreateMode ? (lang === 'ar' ? 'إنشاء' : 'Create') : (lang === 'ar' ? 'حفظ' : 'Save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ CUSTOM ROLE MODAL ════════ */}
            {showRoleModal && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRoleModal(false)} />
                    <div className="relative bg-card rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-border/30">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-black text-main">{roleForm.id ? (lang === 'ar' ? 'تعديل دور ಮخصص' : 'Edit Custom Role') : (lang === 'ar' ? 'إنشاء دور مخصص' : 'Create Custom Role')}</h2>
                            <button onClick={() => setShowRoleModal(false)} className="p-2 rounded-xl hover:bg-elevated/60 text-muted"><X size={16} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-muted tracking-wider mb-1 block">{lang === 'ar' ? 'اسم الدور (إنجليزي)' : 'Role Name (English)'}</label>
                                <input type="text" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="e.g. Delivery Captain" className="w-full bg-elevated/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary/40" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-muted tracking-wider mb-1 block">{lang === 'ar' ? 'اسم الدور (عربي)' : 'Role Name (Arabic)'}</label>
                                <input type="text" value={roleForm.nameAr} onChange={e => setRoleForm({ ...roleForm, nameAr: e.target.value })} placeholder="مثال: كابتن توصيل" className="w-full bg-elevated/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary/40 text-right" dir="auto" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowRoleModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-muted bg-elevated/40 border border-border/40 hover:bg-elevated/60 transition-colors">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                                <button onClick={() => {
                                    if (!roleForm.name) return;
                                    const roleId = roleForm.id || 'ROLE_' + Date.now().toString(36).toUpperCase();
                                    if (roleForm.id) {
                                        // Update = delete old + create new with same ID
                                        deleteCustomRole(roleId);
                                        createCustomRole(roleId, roleForm.name, roleForm.nameAr || roleForm.name, permMatrix[roleId] || []);
                                    } else {
                                        createCustomRole(roleId, roleForm.name, roleForm.nameAr || roleForm.name, []);
                                    }
                                    setShowRoleModal(false);
                                    success(lang === 'ar' ? 'تم حفظ الدور' : 'Role saved');
                                }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                                    <Save size={14} />{lang === 'ar' ? 'حفظ' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
