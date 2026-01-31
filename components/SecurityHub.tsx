
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
    MoreVertical,
    Key
} from 'lucide-react';
import {
    User,
    UserRole,
    AppPermission,
    INITIAL_ROLE_PERMISSIONS
} from '../types';

// Stores
import { useAuthStore } from '../stores/useAuthStore';

// Services
import { translations } from '../services/translations';

const SecurityHub: React.FC = () => {
    const { users, updateUsers, branches, settings } = useAuthStore();
    const lang = (settings.language || 'en') as 'en' | 'ar';
    const t = translations[lang] || translations['en'];

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
        updateUsers(users.map(u => u.id === user.id ? updatedUser : u));
        setSelectedUser(updatedUser);
    };

    const handleRoleChange = (user: User, role: UserRole) => {
        const defaultPerms = INITIAL_ROLE_PERMISSIONS[role] || [];
        const updatedUser = {
            ...user,
            role,
            permissions: defaultPerms
        };
        updateUsers(users.map(u => u.id === user.id ? updatedUser : u));
        setSelectedUser(updatedUser);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Shield className="text-indigo-600" size={32} />
                        Security & Access Center
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-semibold italic">Manage staff encryption, roles and advanced system permissions.</p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm">
                    <button
                        onClick={() => setActiveTab('USERS')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Users size={16} /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('ROLES')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'ROLES' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Lock size={16} /> Roles
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* User List Panel */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-6 mb-8 items-center">
                            <div className="flex-1 relative w-full group">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search authorized identities..."
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-6 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all whitespace-nowrap flex items-center justify-center gap-2">
                                <UserPlus size={18} /> Onboard Identity
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                        <th className="px-6 py-5">Identity Profile</th>
                                        <th className="px-6 py-5">Role Context</th>
                                        <th className="px-6 py-5">Assigned Node</th>
                                        <th className="px-6 py-5 text-center">Status</th>
                                        <th className="px-6 py-5">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredUsers.map(user => (
                                        <tr
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className={`hover:bg-slate-50 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors group ${selectedUser?.id === user.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200/50 group-hover:scale-110 transition-transform">
                                                        <Ghost size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{user.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-mono">
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-[0.1em]">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    {branches.find(b => b.id === user.assignedBranchId)?.name || 'GLOBAL'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className={`w-3 h-3 rounded-full mx-auto shadow-sm ring-4 ${user.isActive ? 'bg-emerald-500 ring-emerald-500/20' : 'bg-slate-300 ring-slate-300/20'}`} />
                                            </td>
                                            <td className="px-6 py-5">
                                                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                    <MoreVertical size={20} />
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
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-right-4 duration-300 sticky top-24">
                            <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30">
                                        <ShieldCheck size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase leading-none tracking-tight">{selectedUser.name}</h3>
                                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-2">Core Auth Overrides</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 block">Primary Protocol (Role)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {rolesList.map(role => (
                                            <button
                                                key={role}
                                                onClick={() => handleRoleChange(selectedUser, role)}
                                                className={`px-4 py-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all tracking-widest ${selectedUser.role === role ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-indigo-200'}`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 block">Cortex Permissions</label>
                                    <div className="space-y-10 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                                        {Object.entries({
                                            "NAV ARCHITECTURE": permissionsList.filter(p => p.startsWith('NAV_')),
                                            "SYSTEM DATA (KERNEL)": permissionsList.filter(p => p.startsWith('DATA_')),
                                            "OPERATIONAL FIELD": permissionsList.filter(p => p.startsWith('OP_')),
                                            "GLOBAL CONFIG": permissionsList.filter(p => p.startsWith('CFG_'))
                                        }).map(([category, perms]) => (
                                            <div key={category} className="space-y-3">
                                                <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg inline-block">
                                                    {category}
                                                </h4>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {perms.map(perm => {
                                                        const isEnabled = selectedUser.permissions.includes(perm);
                                                        return (
                                                            <div
                                                                key={perm}
                                                                onClick={() => togglePermission(selectedUser, perm)}
                                                                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${isEnabled ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-500/30 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/50'}`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isEnabled ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'}`}>
                                                                        <Key size={16} />
                                                                    </div>
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isEnabled ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                                                                        {perm.split('_').slice(1).join(' ')}
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    className={`w-12 h-6 rounded-full relative transition-colors shadow-inner ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                                                                >
                                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${isEnabled ? 'left-7' : 'left-1'}`} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                    <button className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all">
                                        Authorize & Deploy
                                    </button>
                                    <button className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-500 transition-colors">
                                        REVERT TO PROTOCOL DEFAULTS
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-8 border-4 border-white dark:border-slate-900 shadow-xl">
                                <Shield size={48} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Identity Inspector</h3>
                            <p className="text-xs font-bold text-slate-400 mt-3 max-w-xs mx-auto leading-relaxed uppercase tracking-widest">Select an authorized identity from the registry to decrypt and manage node permissions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityHub;
