import React from 'react';
import {
    Building2,
    DollarSign,
    Map as MapIcon,
    Globe,
    ShieldCheck,
    Printer,
    BellRing,
    Smartphone,
    CreditCard,
    Save,
    Palette,
    Truck,
    Store,
    Plus,
    Package,
    ExternalLink,
    Cpu
} from 'lucide-react';
import { AppSettings, Branch, DeliveryPlatform, Warehouse, WarehouseType } from '../types';

interface SettingsHubProps {
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    branches: Branch[];
    platforms: DeliveryPlatform[];
    warehouses: Warehouse[];
    lang: 'en' | 'ar';
    t: any;
    onChangeView: (view: any) => void;
    onOpenFloorDesigner: () => void;
}

const SettingsHub: React.FC<SettingsHubProps> = ({
    settings, onUpdateSettings, branches, platforms, warehouses,
    lang, t, onChangeView, onOpenFloorDesigner
}) => {
    const handleChange = (key: keyof AppSettings, value: any) => {
        onUpdateSettings({ ...settings, [key]: value });
    };

    const sections = [
        {
            id: 'IDENTITY',
            title: lang === 'ar' ? 'هوية المطعم' : 'Restaurant Identity',
            icon: Building2,
            color: 'bg-indigo-600',
            fields: [
                { key: 'restaurantName', label: lang === 'ar' ? 'اسم المطعم' : 'Restaurant Name', type: 'text' },
                { key: 'phone', label: lang === 'ar' ? 'رقم الهاتف' : 'Phone Number', type: 'text' },
                { key: 'branchAddress', label: lang === 'ar' ? 'عنوان الفرع' : 'Branch Address', type: 'text' },
            ]
        },
        {
            id: 'FINANCE',
            title: lang === 'ar' ? 'المالية والضرائب' : 'Finance & Tax',
            icon: DollarSign,
            color: 'bg-emerald-600',
            fields: [
                { key: 'currency', label: lang === 'ar' ? 'العملة' : 'Currency', type: 'text' },
                { key: 'taxRate', label: lang === 'ar' ? 'نسبة الضريبة (%)' : 'Tax Rate (%)', type: 'number' },
                { key: 'serviceCharge', label: lang === 'ar' ? 'خدمة الصالة (%)' : 'Service Charge (%)', type: 'number' },
            ]
        },
        {
            id: 'BRANCHES',
            title: lang === 'ar' ? 'إدارة الفروع' : 'Branch Management',
            icon: Store,
            color: 'bg-purple-600',
            customRender: () => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branches.map(b => (
                        <div key={b.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center font-black">{b.name.charAt(0)}</div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white leading-tight">{b.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{b.location}</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>{b.isActive ? 'Active' : 'Close'}</div>
                        </div>
                    ))}
                    <button className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-black text-xs uppercase hover:text-purple-600 hover:border-purple-400 transition-all">
                        <Plus size={16} /> {lang === 'ar' ? 'إضافة فرع' : 'Add Branch'}
                    </button>
                </div>
            )
        },
        {
            id: 'PLATFORMS',
            title: lang === 'ar' ? 'تطبيقات التوصيل' : 'Delivery Platforms',
            icon: Truck,
            color: 'bg-orange-600',
            customRender: () => (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {platforms.map(p => (
                        <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center text-center gap-3 group border border-transparent hover:border-orange-400 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
                                <Globe size={24} />
                            </div>
                            <p className="font-black text-xs text-slate-800 dark:text-white uppercase tracking-tight">{p.name}</p>
                        </div>
                    ))}
                    <button className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-orange-600 hover:border-orange-400 transition-all">
                        <Plus size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'إيجاد تطبيق' : 'Add App'}</span>
                    </button>
                </div>
            )
        },
        {
            id: 'WAREHOUSES',
            title: lang === 'ar' ? 'إدارة المخازن' : 'Warehouse Setup',
            icon: Package,
            color: 'bg-blue-600',
            customRender: () => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {warehouses.map(w => {
                        const branch = branches.find(b => b.id === w.branchId);
                        return (
                            <div key={w.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between border border-transparent hover:border-blue-400 transition-all cursor-pointer">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white leading-tight uppercase tracking-tight">{w.name}</p>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{branch?.name} • {w.type}</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                    <ExternalLink size={14} />
                                </div>
                            </div>
                        );
                    })}
                    <button className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-black text-xs uppercase hover:text-blue-600 hover:border-blue-400 transition-all">
                        <Plus size={16} /> {lang === 'ar' ? 'إضافة مخزن' : 'Add Warehouse'}
                    </button>
                </div>
            )
        },
        {
            id: 'THEME',
            title: lang === 'ar' ? 'الثيمات والمظهر' : 'Themes & Appearance',
            icon: Palette,
            color: 'bg-rose-600',
            customRender: () => (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                        { id: 'xen', name: lang === 'ar' ? 'زين الأساسي' : 'Xen Default', colors: ['#00B4D8', '#1E293B'] },
                        { id: 'ember', name: lang === 'ar' ? 'رمادي وبرتقالي' : 'Grey & Orange', colors: ['#F97316', '#262626'] },
                        { id: 'graphite', name: lang === 'ar' ? 'جرافيت أنيق' : 'Graphite Minimal', colors: ['#52525B', '#18181B'] },
                        { id: 'ocean', name: lang === 'ar' ? 'أوشن أزرق' : 'Ocean Blue', colors: ['#3B82F6', '#0F172A'] },
                        { id: 'carbon', name: lang === 'ar' ? 'كاربون داكن' : 'Carbon Dark', colors: ['#171717', '#22C55E'] },
                    ].map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => handleChange('theme', theme.id)}
                            className={`p-4 rounded-[2rem] border-2 transition-all text-left space-y-3 relative overflow-hidden group ${settings.theme === theme.id ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-rose-200'}`}
                        >
                            <div className="flex gap-1.5 relative z-10">
                                {theme.colors.map((c, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-800 dark:text-white relative z-10">{theme.name}</p>
                            {settings.theme === theme.id && (
                                <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                            )}
                        </button>
                    ))}
                </div>
            )
        },
        {
            id: 'AI_AUTOMATION',
            title: lang === 'ar' ? 'الذكاء الاصطناعي والأتمتة' : 'AI & Automation',
            icon: Cpu,
            color: 'bg-cyan-600',
            fields: [
                { key: 'geminiApiKey', label: lang === 'ar' ? 'مفتاح OpenRouter API' : 'OpenRouter API Key', type: 'text' },
            ]
        }
    ];

    return (
        <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="heading-xl text-slate-800 dark:text-white uppercase">
                        {lang === 'ar' ? 'مركز التحكم والإعدادات' : 'System Settings Hub'}
                    </h2>
                    <p className="body-md text-slate-500 mt-1">
                        {lang === 'ar' ? 'قم بتخصيص كل تفصيلة في نظامك' : 'Fully customize every aspect of your ERP environment'}
                    </p>
                </div>
                <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white btn-theme font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none">
                    <Save size={18} />
                    {lang === 'ar' ? 'حفظ التغييرات' : 'Save Configurations'}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Main Settings Sections */}
                <div className="xl:col-span-8 space-y-8">
                    {sections.map((section) => (
                        <div key={section.id} className="card-primary !p-0 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-4">
                                <div className={`p-3 ${section.color} text-white btn-theme shadow-lg`}>
                                    <section.icon size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{section.title}</h3>
                            </div>
                            <div className="p-8">
                                {section.fields ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {section.fields.map((field) => (
                                            <div key={field.key} className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
                                                <input
                                                    type={field.type}
                                                    value={(settings as any)[field.key]}
                                                    onChange={(e) => handleChange(field.key as any, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none btn-theme font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    section.customRender && section.customRender()
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Special Customization Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Floor Designer Entry */}
                        <div
                            onClick={onOpenFloorDesigner}
                            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group cursor-pointer hover:border-indigo-500 transition-all active:scale-95"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <MapIcon size={28} />
                                </div>
                                <div className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full tracking-widest">Active</div>
                            </div>
                            <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">{lang === 'ar' ? 'مصمم الصالات' : 'Floor Designer'}</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                {lang === 'ar' ? 'صمم توزيع الطاولات والأقسام بالسحب والإفلات' : 'Drag-and-drop your table layouts across various restaurant zones'}
                            </p>
                        </div>

                        {/* UI Info */}
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] border border-indigo-500 shadow-xl shadow-indigo-200 dark:shadow-none group relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-white/20 backdrop-blur-md text-white rounded-2xl">
                                        <Palette size={28} />
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase rounded-full tracking-widest">Premium UI</div>
                                </div>
                                <h4 className="text-xl font-black text-white mb-2">{lang === 'ar' ? 'تخصيص الواجهة' : 'UI Customization'}</h4>
                                <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                                    {lang === 'ar' ? 'تم تحسين الخطوط والمساحات لضمان أفضل تجربة قراءة واستخدام.' : 'Typography and spacing have been optimized for maximum readability and a premium user experience.'}
                                </p>
                            </div>
                            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                        </div>
                    </div>
                </div>

                {/* Sidebar Info / Shortcuts */}
                <div className="xl:col-span-4 space-y-8">
                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                                <ShieldCheck size={20} /> System Integrity
                            </h4>
                            <p className="text-indigo-100 text-sm font-medium mb-6">
                                Last configuration backup: <span className="text-white font-black">Today, 10:45 AM</span>
                            </p>
                            <div className="space-y-3">
                                {[
                                    { label: 'Cloud Sync', icon: Globe },
                                    { label: 'POS Local DB', icon: Smartphone },
                                    { label: 'Printer Server', icon: Printer }
                                ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center p-3 bg-white/10 rounded-xl">
                                        <span className="text-xs font-black uppercase flex items-center gap-2 italic">
                                            <item.icon size={14} /> {item.label}
                                        </span>
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <BellRing size={16} /> Notification Rules
                        </h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Low Stock Alerts', active: true },
                                { label: 'High VOID Warning', active: true },
                                { label: 'Shift Reports', active: false }
                            ].map(rule => (
                                <div key={rule.label} className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{rule.label}</span>
                                    <div className={`w-10 h-5 rounded-full relative transition-all ${rule.active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${rule.active ? 'right-1' : 'left-1'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsHub;
