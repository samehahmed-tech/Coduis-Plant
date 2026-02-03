import React from 'react';
import { useNavigate } from 'react-router-dom';
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
    Cpu,
    Settings,
    ChevronRight,
} from 'lucide-react';
import { AppSettings } from '../types';

// Stores
import { useAuthStore } from '../stores/useAuthStore';
import { useMenuStore } from '../stores/useMenuStore';
import { useInventoryStore } from '../stores/useInventoryStore';

const SettingsHub: React.FC = () => {
    const navigate = useNavigate();
    const { settings, updateSettings, branches } = useAuthStore();
    const { platforms } = useMenuStore();
    const { warehouses } = useInventoryStore();
    const lang = settings.language;

    const handleChange = (key: keyof AppSettings, value: any) => {
        updateSettings({ [key]: value });
    };

    const onOpenFloorDesigner = () => {
        navigate('/floor-designer');
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
                        <div key={b.id} className="p-5 bg-card dark:bg-card/40 border border-border rounded-[1.5rem] flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110">{b.name.charAt(0)}</div>
                                <div>
                                    <p className="font-black text-main uppercase text-sm leading-tight tracking-tight">{b.name}</p>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">{b.location}</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${b.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                {b.isActive ? 'Active' : 'Closed'}
                            </div>
                        </div>
                    ))}
                    <button className="p-5 border-2 border-dashed border-border rounded-[1.5rem] flex items-center justify-center gap-3 text-muted font-black text-[10px] uppercase tracking-widest hover:text-primary hover:border-primary/50 transition-all bg-app/50">
                        <Plus size={18} /> {lang === 'ar' ? 'إضافة فرع' : 'Provision New Branch'}
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
                        <div key={p.id} className="p-4 bg-elevated rounded-2xl flex flex-col items-center text-center gap-3 group border border-transparent hover:border-orange-400 transition-all">
                            <div className="w-12 h-12 bg-card dark:bg-elevated/50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
                                <Globe size={24} />
                            </div>
                            <p className="font-black text-xs text-main uppercase tracking-tight">{p.name}</p>
                        </div>
                    ))}
                    <button className="flex flex-col items-center justify-center gap-2 p-4 border-border rounded-2xl text-muted hover:text-orange-600 hover:border-orange-400 transition-all">
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
                            <div key={w.id} className="p-4 bg-elevated rounded-2xl flex items-center justify-between border border-transparent hover:border-primary transition-all cursor-pointer">
                                <div>
                                    <p className="font-bold text-main leading-tight uppercase tracking-tight">{w.name}</p>
                                    <p className="text-[9px] text-muted font-black uppercase tracking-widest">{branch?.name} • {w.type}</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <ExternalLink size={14} />
                                </div>
                            </div>
                        );
                    })}
                    <button className="p-4 border-border rounded-2xl flex items-center justify-center gap-2 text-muted font-black text-xs uppercase hover:text-primary hover:border-primary/50 transition-all">
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
        <div className="p-10 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-border pb-10">
                <div>
                    <h1 className="text-4xl font-black text-main uppercase tracking-tight flex items-center gap-4">
                        <div className="p-4 bg-primary/10 text-primary rounded-[2rem] shadow-inner">
                            <Settings size={36} className="animate-spin-slow" />
                        </div>
                        Control Engine
                    </h1>
                    <p className="text-muted font-black text-[10px] tracking-[0.2em] mt-3 uppercase opacity-60">Master Configuration & Global Protcols v3.0</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-card border border-border text-main px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:shadow-xl hover:bg-app transition-all flex items-center gap-3"
                    >
                        Exit Terminal
                    </button>
                    <button
                        onClick={() => {
                            updateSettings(settings);
                            alert(lang === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings deployed successfully!');
                        }}
                        className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-opacity-90 transition-all shadow-2xl shadow-primary/30"
                    >
                        <Save size={18} /> Deploy Configurations
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Navigation */}
                <div className="lg:col-span-4 space-y-4 h-fit sticky top-10">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => {
                                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="w-full flex items-center gap-5 p-6 rounded-[2.5rem] bg-card border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className={`p-4 ${section.color} text-white rounded-2xl z-10 shadow-lg`}>
                                <section.icon size={22} />
                            </div>
                            <span className="font-black text-[10px] uppercase tracking-[0.2em] text-main z-10">{section.title}</span>
                            <div className="ml-auto p-2 bg-app rounded-xl text-muted group-hover:text-primary transition-colors z-10">
                                <ChevronRight size={14} />
                            </div>
                        </button>
                    ))}

                    <div className="p-10 bg-primary rounded-[3rem] text-white shadow-2xl shadow-primary/40 mt-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <h4 className="font-black uppercase tracking-tight text-2xl mb-4 relative z-10">Interior Architecture</h4>
                        <p className="text-[10px] uppercase font-bold text-white/70 leading-relaxed mb-8 relative z-10">Construct spatial seating matrices and terminal distribution.</p>
                        <button
                            onClick={onOpenFloorDesigner}
                            className="w-full py-5 bg-white text-primary rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-opacity-95 transition-all shadow-xl relative z-10"
                        >
                            Activate Designer
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div className="lg:col-span-8 space-y-12">
                    {sections.map(section => (
                        <div key={section.id} id={section.id} className="bg-card border border-border p-12 rounded-[3.5rem] scroll-mt-10 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

                            <div className="flex items-center gap-6 mb-12 pb-8 border-b border-border relative z-10">
                                <div className={`p-5 ${section.color} text-white rounded-2xl shadow-xl`}>
                                    <section.icon size={28} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-main uppercase tracking-tight">{section.title}</h3>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-2 opacity-60">Operational Constraints & Registry Logic</p>
                                </div>
                            </div>

                            <div className="relative z-10">
                                {section.customRender ? (
                                    section.customRender()
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {section.fields?.map(field => (
                                            <div key={field.key} className="space-y-4">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {field.label}
                                                </label>
                                                <input
                                                    type={field.type}
                                                    value={(settings as any)[field.key] || ''}
                                                    onChange={e => handleChange(field.key as keyof AppSettings, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                                    className="w-full p-6 bg-app/50 border-2 border-border focus:border-primary rounded-[1.5rem] font-black text-xs outline-none transition-all shadow-inner uppercase tracking-widest text-main"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="p-6 bg-primary rounded-[2rem] shadow-xl shadow-primary/30 border border-white/10">
                                <Cpu size={40} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black uppercase tracking-tight mb-2">Cryptographic Syncronization</h4>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-xl opacity-80">
                                    Global configuration hashes are synchronized across the <span className="text-white">Hybrid-Cloud Lattice</span>. All changes are immutable and logged in the forensic record.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsHub;
