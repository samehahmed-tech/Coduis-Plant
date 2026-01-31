
import React, { useState } from 'react';
import {
    Shield,
    Users,
    Lock,
    UserPlus,
    ShieldCheck,
    X,
    Ghost,
    CheckCircle2,
    AlertTriangle,
    ChevronRight,
    Search,
    Settings,
    MoreVertical,
    Key
} from 'lucide-react';
import {
    User,
    UserRole,
    AppPermission,
    INITIAL_ROLE_PERMISSIONS,
    Branch
} from '../types';

interface SecurityHubProps {
    users: User[];
    onUpdateUsers: (users: User[]) => void;
    branches: Branch[];
    lang: 'en' | 'ar';
    t: any;
}

const SecurityHub: React.FC<SecurityHubProps> = ({
    users,
    onUpdateUsers,
    branches,
    lang,
    t
}) => {
    const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const permissionsList = Object.values(AppPermission);
    const rolesList = Object.values(UserRole);

    const togglePermission = (user: User, permission: AppPermission) => {
        const hasPermission = user.permissions.includes(permission);
        const updatedPermissions = hasPermission
            ? user.permissions.filter(p => p !== permission)
            : [...user.permissions, permission];

        const updatedUser = { ...user, permissions: updatedPermissions };
        onUpdateUsers(users.map(u => u.id === user.id ? updatedUser : u));
        setSelectedUser(updatedUser);
    };

    const handleRoleChange = (user: User, role: UserRole) => {
        const defaultPerms = INITIAL_ROLE_PERMISSIONS[role] || [];
        const updatedUser = {
            ...user,
            role,
            permissions: defaultPerms
        };
        onUpdateUsers(users.map(u => u.id === user.id ? updatedUser : u));
        setSelectedUser(updatedUser);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Shield className="text-indigo-600" />
                        {lang === 'ar' ? 'مركز الأمن والتحكم' : 'Security & Access Center'}
                    </h2>
                    <p className="text-sm text-slate-500 font-bold">
                        {lang === 'ar' ? 'إدارة الموظفين، الأدوار والصلاحيات المتقدمة.' : 'Manage staff, roles and advanced system permissions.'}
                    </p>
                </div>
                <div className="flex gap-2 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('USERS')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Users size={16} /> {lang === 'ar' ? 'المستخدمين' : 'Users'}
                    </button>
                    <button
                        onClick={() => setActiveTab('ROLES')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'ROLES' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Lock size={16} /> {lang === 'ar' ? 'الأدوار' : 'Roles'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* User List Panel */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                    <div className="card-primary !p-6">
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={lang === 'ar' ? 'بحث عن مستخدم...' : 'Search users...'}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="btn-theme bg-indigo-600 text-white px-8 py-3 font-black uppercase text-xs flex items-center gap-2">
                                <UserPlus size={18} /> {lang === 'ar' ? 'إضافة مستخدم' : 'Add User'}
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                                        <th className="px-4 py-4">User</th>
                                        <th className="px-4 py-4">Role</th>
                                        <th className="px-4 py-4">Assigned Branch</th>
                                        <th className="px-4 py-4">Permissions</th>
                                        <th className="px-4 py-4 text-center">Status</th>
                                        <th className="px-4 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filteredUsers.map(user => (
                                        <tr
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className={`hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors ${selectedUser?.id === user.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                        <Ghost size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{user.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">
                                                {branches.find(b => b.id === user.assignedBranchId)?.name || (lang === 'ar' ? 'كل الفروع' : 'All Branches')}
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                                                    {user.permissions.length} <span className="text-slate-400 font-bold">Enabled</span>
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className={`w-2.5 h-2.5 rounded-full mx-auto ${user.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            </td>
                                            <td className="px-4 py-4">
                                                <button className="p-2 text-slate-400 hover:text-indigo-600">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Permission Customization Drawer */}
                <div className="lg:col-span-12 xl:col-span-4">
                    {selectedUser ? (
                        <div className="card-primary !p-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 dark:text-white uppercase leading-tight">{selectedUser.name}</h3>
                                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">Advanced Overrides</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-rose-500">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">User Role</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {rolesList.map(role => (
                                            <button
                                                key={role}
                                                onClick={() => handleRoleChange(selectedUser, role)}
                                                className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${selectedUser.role === role ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500'}`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Granular Permissions</label>
                                    <div className="space-y-6 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                                        {Object.entries({
                                            "Navigation": permissionsList.filter(p => p.startsWith('NAV_')),
                                            "Data Visibility": permissionsList.filter(p => p.startsWith('DATA_')),
                                            "Operational Actions": permissionsList.filter(p => p.startsWith('OP_')),
                                            "System Configuration": permissionsList.filter(p => p.startsWith('CFG_'))
                                        }).map(([category, perms]) => (
                                            <div key={category} className="space-y-2">
                                                <h4 className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded inline-block mb-1">
                                                    {category}
                                                </h4>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {perms.map(perm => {
                                                        const isEnabled = selectedUser.permissions.includes(perm);
                                                        return (
                                                            <label
                                                                key={perm}
                                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isEnabled ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                                                        <Key size={14} />
                                                                    </div>
                                                                    <span className={`text-[10px] font-black uppercase tracking-tight ${isEnabled ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                                                                        {perm.split('_').slice(1).join(' ')}
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    onClick={() => togglePermission(selectedUser, perm)}
                                                                    className={`w-10 h-6 rounded-full relative transition-colors ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                                                                >
                                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isEnabled ? 'left-5' : 'left-1'}`} />
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <button className="w-full btn-theme bg-indigo-600 text-white py-4 font-black uppercase tracking-widest text-xs">
                                        Apply Changes
                                    </button>
                                    <button className="w-full py-4 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">
                                        Reset to Role Defaults
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card-primary !p-12 flex flex-col items-center justify-center text-center opacity-50">
                            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-6">
                                <Shield size={40} />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-white uppercase">User Inspector</h3>
                            <p className="text-xs text-slate-500 font-bold mt-2">Select a user from the list to manage their granular permissions and system access.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityHub;
