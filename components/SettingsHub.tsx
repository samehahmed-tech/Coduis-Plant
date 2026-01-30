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
    Palette
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsHubProps {
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    lang: 'en' | 'ar';
    t: any;
    onChangeView: (view: any) => void;
    onOpenFloorDesigner: () => void;
}

const SettingsHub: React.FC<SettingsHubProps> = ({ settings, onUpdateSettings, lang, t, onChangeView, onOpenFloorDesigner }) => {
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
        }
    ];

    return (
        <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {lang === 'ar' ? 'مركز التحكم والإعدادات' : 'System Settings Hub'}
                    </h2>
                    <p className="text-slate-500 font-bold mt-1">
                        {lang === 'ar' ? 'قم بتخصيص كل تفصيلة في نظامك' : 'Fully customize every aspect of your ERP environment'}
                    </p>
                </div>
                <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none">
                    <Save size={18} />
                    {lang === 'ar' ? 'حفظ التغييرات' : 'Save Configurations'}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Main Settings Sections */}
                <div className="xl:col-span-8 space-y-8">
                    {sections.map((section) => (
                        <div key={section.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-4">
                                <div className={`p-3 ${section.color} text-white rounded-2xl shadow-lg`}>
                                    <section.icon size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{section.title}</h3>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {section.fields.map((field) => (
                                    <div key={field.key} className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
                                        <input
                                            type={field.type}
                                            value={(settings as any)[field.key]}
                                            onChange={(e) => handleChange(field.key as any, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                ))}
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

                        {/* UI Palette */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group cursor-pointer">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
                                    <Palette size={28} />
                                </div>
                            </div>
                            <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">{lang === 'ar' ? 'المظهر والألوان' : 'Branding & UI'}</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                {lang === 'ar' ? 'قم بتخصيص الثيم والألوان والشعار الخاص بك' : 'Configure colors, dark mode, and upload your custom business logo'}
                            </p>
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
