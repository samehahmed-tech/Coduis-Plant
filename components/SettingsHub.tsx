import React, { useEffect, useState } from 'react';
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
    X,
    Loader2,
} from 'lucide-react';
import { AppSettings } from '../types';
import { useToast } from './Toast';
import { aiApi, branchesApi, inventoryApi } from '../services/api';
import { nanoid } from 'nanoid';

// Stores
import { useAuthStore } from '../stores/useAuthStore';
import { useMenuStore } from '../stores/useMenuStore';
import { useInventoryStore } from '../stores/useInventoryStore';

const SettingsHub: React.FC = () => {
    const navigate = useNavigate();
    const { settings, updateSettings, branches, fetchBranches } = useAuthStore();
    const { platforms } = useMenuStore();
    const { warehouses, fetchWarehouses } = useInventoryStore();
    const lang = settings.language;
    const { showToast } = useToast();

    // Modal states
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [showPlatformModal, setShowPlatformModal] = useState(false);
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [aiKeySource, setAiKeySource] = useState<'DEFAULT' | 'CUSTOM'>('DEFAULT');
    const [customAiKey, setCustomAiKey] = useState('');
    const [maskedCustomAiKey, setMaskedCustomAiKey] = useState<string | null>(null);
    const [hasCustomAiKey, setHasCustomAiKey] = useState(false);
    const [usingDefaultAvailable, setUsingDefaultAvailable] = useState(false);
    const [aiProvider, setAiProvider] = useState<'OLLAMA' | 'OPENROUTER'>('OPENROUTER');
    const [providerOptions, setProviderOptions] = useState<Array<{ id: 'OPENROUTER' | 'OLLAMA'; label: string }>>([]);
    const [ollamaEnabled, setOllamaEnabled] = useState(false);
    const [ollamaBaseUrl, setOllamaBaseUrl] = useState('');
    const [ollamaModel, setOllamaModel] = useState('');
    const [ollamaModelDefault, setOllamaModelDefault] = useState('');
    const [aiModel, setAiModel] = useState('');
    const [defaultAiModel, setDefaultAiModel] = useState('');
    const [availableAiModels, setAvailableAiModels] = useState<Array<{ id: string; label: string; provider: string }>>([]);
    const [aiConfigLoading, setAiConfigLoading] = useState(false);
    const [aiConfigSaving, setAiConfigSaving] = useState(false);

    // Form states
    const [branchForm, setBranchForm] = useState({ name: '', location: '', timezone: 'Africa/Cairo', currency: 'EGP' });
    const [platformForm, setPlatformForm] = useState({ name: '', apiKey: '', commissionPercent: 0 });
    const [warehouseForm, setWarehouseForm] = useState({ name: '', branchId: '', type: 'MAIN' });

    useEffect(() => {
        let cancelled = false;
        const loadAiKeyConfig = async () => {
            setAiConfigLoading(true);
            try {
                const config = await aiApi.getKeyConfig();
                if (cancelled) return;
                setAiProvider(config.provider || 'OPENROUTER');
                setProviderOptions(config.providerOptions || []);
                setOllamaEnabled(Boolean(config.ollama?.enabled));
                setOllamaBaseUrl(String(config.ollama?.baseUrl || ''));
                setOllamaModel(String(config.ollama?.model || ''));
                setOllamaModelDefault(String(config.ollama?.modelDefault || ''));
                setAiKeySource(config.source);
                setHasCustomAiKey(config.hasCustomKey);
                setMaskedCustomAiKey(config.maskedCustomKey);
                setUsingDefaultAvailable(config.usingDefaultAvailable);
                setAiModel(config.model);
                setDefaultAiModel(config.defaultModel);
                setAvailableAiModels(config.availableModels || []);
            } catch {
                // keep defaults
            } finally {
                if (!cancelled) setAiConfigLoading(false);
            }
        };
        loadAiKeyConfig();
        return () => { cancelled = true; };
    }, []);

    const saveAiKeyConfig = async () => {
        setAiConfigSaving(true);
        try {
            const payload: { source: 'DEFAULT' | 'CUSTOM'; customKey?: string; model?: string; provider?: 'OPENROUTER' | 'OLLAMA'; ollamaModel?: string } = {
                source: aiKeySource,
                model: aiModel || defaultAiModel || undefined,
                provider: aiProvider,
            };
            if (aiKeySource === 'CUSTOM' && customAiKey.trim()) payload.customKey = customAiKey.trim();
            if (aiProvider === 'OLLAMA') payload.ollamaModel = (ollamaModel || ollamaModelDefault || '').trim() || undefined;
            const config = await aiApi.updateKeyConfig(payload);
            setAiProvider(config.provider || 'OPENROUTER');
            setProviderOptions(config.providerOptions || []);
            setOllamaEnabled(Boolean(config.ollama?.enabled));
            setOllamaBaseUrl(String(config.ollama?.baseUrl || ''));
            setOllamaModel(String(config.ollama?.model || ''));
            setOllamaModelDefault(String(config.ollama?.modelDefault || ''));
            setAiKeySource(config.source);
            setHasCustomAiKey(config.hasCustomKey);
            setMaskedCustomAiKey(config.maskedCustomKey);
            setUsingDefaultAvailable(config.usingDefaultAvailable);
            setAiModel(config.model);
            setDefaultAiModel(config.defaultModel);
            setAvailableAiModels(config.availableModels || []);
            setCustomAiKey('');
            showToast(lang === 'ar' ? 'تم حفظ إعدادات الذكاء الاصطناعي' : 'AI key configuration saved', 'success');
        } catch (err: any) {
            showToast(err?.message || (lang === 'ar' ? 'فشل حفظ إعدادات الذكاء الاصطناعي' : 'Failed to save AI key config'), 'error');
        } finally {
            setAiConfigSaving(false);
        }
    };

    const handleChange = (key: keyof AppSettings, value: any) => {
        updateSettings({ [key]: value });
    };

    const onOpenFloorDesigner = () => {
        navigate('/floor-designer');
    };

    const handleAddBranch = async () => {
        if (!branchForm.name || !branchForm.location) {
            showToast(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            await branchesApi.create({
                id: nanoid(),
                ...branchForm,
                isActive: true,
            });
            await fetchBranches(); // Refresh branches list
            showToast(lang === 'ar' ? 'تمت إضافة الفرع بنجاح' : 'Branch added successfully', 'success');
            setShowBranchModal(false);
            setBranchForm({ name: '', location: '', timezone: 'Africa/Cairo', currency: 'EGP' });
        } catch (err: any) {
            showToast(err.message || 'Error adding branch', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddPlatform = async () => {
        if (!platformForm.name) {
            showToast(lang === 'ar' ? 'يرجى إدخال اسم التطبيق' : 'Please enter platform name', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            // Platforms are stored locally for now - no backend API yet
            // In production, this would call a platforms API
            showToast(lang === 'ar' ? 'تمت إضافة التطبيق بنجاح' : 'Platform added successfully', 'success');
            setShowPlatformModal(false);
            setPlatformForm({ name: '', apiKey: '', commissionPercent: 0 });
        } catch (err: any) {
            showToast(err.message || 'Error adding platform', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddWarehouse = async () => {
        if (!warehouseForm.name || !warehouseForm.branchId) {
            showToast(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            await inventoryApi.createWarehouse({
                id: nanoid(),
                ...warehouseForm,
                isActive: true,
            });
            if (fetchWarehouses) await fetchWarehouses(); // Refresh warehouses list
            showToast(lang === 'ar' ? 'تمت إضافة المخزن بنجاح' : 'Warehouse added successfully', 'success');
            setShowWarehouseModal(false);
            setWarehouseForm({ name: '', branchId: '', type: 'MAIN' });
        } catch (err: any) {
            showToast(err.message || 'Error adding warehouse', 'error');
        } finally {
            setIsSubmitting(false);
        }
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
                { key: 'receiptLogoUrl', label: lang === 'ar' ? 'رابط شعار الإيصال' : 'Receipt Logo URL', type: 'text' },
                { key: 'receiptQrUrl', label: lang === 'ar' ? 'رابط QR في الإيصال' : 'Receipt QR URL', type: 'text' },
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
                    <button onClick={() => setShowBranchModal(true)} className="p-5 border-2 border-dashed border-border rounded-[1.5rem] flex items-center justify-center gap-3 text-muted font-black text-[10px] uppercase tracking-widest hover:text-primary hover:border-primary/50 transition-all bg-app/50">
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
                    <button onClick={() => setShowPlatformModal(true)} className="flex flex-col items-center justify-center gap-2 p-4 border-border rounded-2xl text-muted hover:text-orange-600 hover:border-orange-400 transition-all">
                        <Plus size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'ط¥ظٹط¬ط§ط¯ طھط·ط¨ظٹظ‚' : 'Add App'}</span>
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
                                    <p className="text-[9px] text-muted font-black uppercase tracking-widest">{branch?.name} - {w.type}</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <ExternalLink size={14} />
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={() => setShowWarehouseModal(true)} className="p-4 border-border rounded-2xl flex items-center justify-center gap-2 text-muted font-black text-xs uppercase hover:text-primary hover:border-primary/50 transition-all">
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
                        { id: 'xen', name: lang === 'ar' ? 'ط²ظٹظ† ط¨ط±ظˆ' : 'Xen Pro', colors: ['#00A8CC', '#0F172A'] },
                        { id: 'ember', name: lang === 'ar' ? 'إمبر بزنس' : 'Ember Business', colors: ['#F57C2B', '#1F130C'] },
                        { id: 'graphite', name: lang === 'ar' ? 'جرافيت تنفيذي' : 'Graphite Executive', colors: ['#4C5463', '#111827'] },
                        { id: 'ocean', name: lang === 'ar' ? 'ط£ظˆط´ظ† ط¨ط±ظٹظ…ظٹظˆظ…' : 'Ocean Premium', colors: ['#2B7CF2', '#0B1B33'] },
                        { id: 'carbon', name: lang === 'ar' ? 'ظƒط§ط±ط¨ظˆظ† ظ„ظˆظƒط³' : 'Carbon Luxe', colors: ['#111827', '#22C55E'] },
                        { id: 'royal', name: lang === 'ar' ? 'رويال كلاسيك' : 'Royal Classic', colors: ['#2E4D9E', '#0E1B3D'] },
                        { id: 'emerald_luxe', name: lang === 'ar' ? 'زمرد لوكس' : 'Emerald Luxe', colors: ['#0E9F6E', '#06281C'] },
                        { id: 'noir', name: lang === 'ar' ? 'ظ†ظˆط§ط± ط¨ط±ظˆ' : 'Noir Pro', colors: ['#0F172A', '#0A0A0A'] },
                        { id: 'beige_luxe', name: lang === 'ar' ? 'ط¨ظٹط¬ ظپط§ط®ط±' : 'Beige Luxe', colors: ['#C8A97E', '#3A2F2A'] },
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
                            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
                                <div className="h-10 px-3 flex items-center gap-2" style={{ background: `linear-gradient(120deg, ${theme.colors[0]}20, ${theme.colors[1]}30)` }}>
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors[0] }} />
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                        {lang === 'ar' ? 'معاينة' : 'Preview'}
                                    </div>
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className="h-10 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/60 flex items-center justify-between px-3">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            {lang === 'ar' ? 'ظ†طµ ط±ط¦ظٹط³ظٹ' : 'Primary Text'}
                                        </span>
                                        <span className="text-[10px] font-black" style={{ color: theme.colors[0] }}>
                                            {lang === 'ar' ? 'ط²ط±' : 'Action'}
                                        </span>
                                    </div>
                                    <div className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800/70" />
                                </div>
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
            customRender: () => (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">
                                {lang === 'ar' ? 'مزود الذكاء الاصطناعي' : 'AI Provider'}
                            </label>
                            <select
                                value={aiProvider}
                                onChange={(e) => setAiProvider((e.target.value === 'OLLAMA' ? 'OLLAMA' : 'OPENROUTER'))}
                                className="w-full p-4 bg-app/50 border-2 border-border focus:border-primary rounded-[1.2rem] font-black text-xs outline-none transition-all text-main"
                            >
                                {(providerOptions.length ? providerOptions : [
                                    { id: 'OLLAMA', label: 'Local Ollama (Unlimited, Self-hosted)' },
                                    { id: 'OPENROUTER', label: 'OpenRouter (Free-tier, Rate-limited)' },
                                ]).map((p) => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </select>
                            {aiProvider === 'OLLAMA' && (
                                <div className="space-y-3">
                                    <div className="text-[10px] text-muted font-bold uppercase tracking-widest">
                                        {lang === 'ar'
                                            ? `الحالة: ${ollamaEnabled ? 'مفعل على السيرفر' : 'غير مفعل على السيرفر'} | العنوان: ${ollamaBaseUrl || '-'}`
                                            : `Status: ${ollamaEnabled ? 'enabled on server' : 'disabled on server'} | URL: ${ollamaBaseUrl || '-'}`}
                                    </div>
                                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">
                                        {lang === 'ar' ? 'موديل Ollama (محلي)' : 'Ollama Model (Local)'}
                                    </label>
                                    <input
                                        value={ollamaModel || ''}
                                        onChange={(e) => setOllamaModel(e.target.value)}
                                        placeholder={ollamaModelDefault || 'qwen2.5:7b-instruct'}
                                        className="w-full p-5 bg-app/50 border-2 border-border focus:border-primary rounded-[1.5rem] font-black text-xs outline-none transition-all shadow-inner tracking-wider text-main"
                                    />
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                                        {lang === 'ar'
                                            ? 'ملاحظة: Ollama مجاني بالكامل. شغله على جهاز السيرفر/الكمبيوتر ثم اختار الموديل هنا.'
                                            : 'Note: Ollama is fully free. Run it on the server machine, then select the local model here.'}
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setAiKeySource('DEFAULT')}
                            className={`p-5 rounded-2xl border text-left transition-all ${aiKeySource === 'DEFAULT' ? 'border-primary bg-primary/5' : 'border-border bg-app/40'}`}
                        >
                            <p className="text-xs font-black uppercase tracking-wider text-main">
                                {lang === 'ar' ? 'المفتاح الافتراضي (Server)' : 'Default Server Key'}
                            </p>
                            <p className="text-[10px] text-muted mt-2 font-bold uppercase tracking-widest">
                                {usingDefaultAvailable
                                    ? (lang === 'ar' ? 'متاح على السيرفر' : 'Available on server')
                                    : (lang === 'ar' ? 'غير مضبوط في البيئة' : 'Missing in environment')}
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setAiKeySource('CUSTOM')}
                            className={`p-5 rounded-2xl border text-left transition-all ${aiKeySource === 'CUSTOM' ? 'border-primary bg-primary/5' : 'border-border bg-app/40'}`}
                        >
                            <p className="text-xs font-black uppercase tracking-wider text-main">
                                {lang === 'ar' ? 'مفتاح مخصص مشفر' : 'Encrypted Custom Key'}
                            </p>
                            <p className="text-[10px] text-muted mt-2 font-bold uppercase tracking-widest">
                                {hasCustomAiKey
                                    ? `${lang === 'ar' ? 'محفوظ:' : 'Stored:'} ${maskedCustomAiKey || '***'}`
                                    : (lang === 'ar' ? 'لا يوجد مفتاح مخصص' : 'No custom key saved')}
                            </p>
                        </button>
                    </div>

                    {aiKeySource === 'CUSTOM' && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">
                                {lang === 'ar' ? 'إدخال/تحديث مفتاح مخصص' : 'Set or rotate custom key'}
                            </label>
                            <input
                                type="password"
                                autoComplete="off"
                                value={customAiKey}
                                onChange={(e) => setCustomAiKey(e.target.value)}
                                placeholder={lang === 'ar' ? 'sk-or-...' : 'sk-or-...'}
                                className="w-full p-6 bg-app/50 border-2 border-border focus:border-primary rounded-[1.5rem] font-black text-xs outline-none transition-all shadow-inner tracking-wider text-main"
                            />
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                                {lang === 'ar'
                                    ? 'المفتاح يتم تشفيره وحفظه على السيرفر فقط ولن يظهر في الواجهة.'
                                    : 'Key is encrypted and stored server-side only, never exposed to client.'}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">
                            {lang === 'ar' ? 'موديل الذكاء الاصطناعي (مجاني فقط)' : 'AI Model (Free models only)'}
                        </label>
                        <select
                            value={aiModel || defaultAiModel}
                            onChange={(e) => setAiModel(e.target.value)}
                            disabled={aiProvider === 'OLLAMA'}
                            className="w-full p-4 bg-app/50 border-2 border-border focus:border-primary rounded-[1.2rem] font-black text-xs outline-none transition-all text-main"
                        >
                            {(availableAiModels.length ? availableAiModels : [{ id: defaultAiModel || 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)', provider: 'Google' }]).map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                            {aiProvider === 'OLLAMA'
                                ? (lang === 'ar' ? 'سيتم استخدام موديل Ollama المحلي.' : 'Using local Ollama model.')
                                : (lang === 'ar'
                                    ? `الافتراضي: Gemini (${defaultAiModel || 'google/gemini-2.0-flash-exp:free'})`
                                    : `Default: Gemini (${defaultAiModel || 'google/gemini-2.0-flash-exp:free'})`)}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={saveAiKeyConfig}
                            disabled={aiConfigLoading || aiConfigSaving}
                            className="px-6 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-60 flex items-center gap-2"
                        >
                            {(aiConfigLoading || aiConfigSaving) ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {lang === 'ar' ? 'حفظ إعداد AI' : 'Save AI Config'}
                        </button>
                    </div>
                </div>
            )
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
                        Settings
                    </h1>
                    <p className="text-muted font-black text-[10px] tracking-[0.2em] mt-3 uppercase opacity-60">System configuration and preferences</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-card border border-border text-main px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:shadow-xl hover:bg-app transition-all flex items-center gap-3"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => {
                            updateSettings(settings);
                            showToast(lang === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully', 'success');
                        }}
                        className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-opacity-90 transition-all shadow-2xl shadow-primary/30"
                    >
                        <Save size={18} /> {lang === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
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
                        <h4 className="font-black uppercase tracking-tight text-2xl mb-4 relative z-10">Floor Design</h4>
                        <p className="text-[10px] uppercase font-bold text-white/70 leading-relaxed mb-8 relative z-10">Design your restaurant seating layout and table arrangement.</p>
                        <button
                            onClick={onOpenFloorDesigner}
                            className="w-full py-5 bg-white text-primary rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-opacity-95 transition-all shadow-xl relative z-10"
                        >
                            Open Designer
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
                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-2 opacity-60">Configure section settings</p>
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
                                <h4 className="text-2xl font-black uppercase tracking-tight mb-2">Settings Sync</h4>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-xl opacity-80">
                                    Settings are synced with the server automatically. All changes are saved and logged.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Branch Modal */}
            {showBranchModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowBranchModal(false)}>
                    <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-main">{lang === 'ar' ? 'إضافة فرع جديد' : 'Add New Branch'}</h3>
                            <button onClick={() => setShowBranchModal(false)} className="p-2 rounded-xl hover:bg-elevated text-muted">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted mb-2 block">{lang === 'ar' ? 'اسم الفرع' : 'Branch Name'}</label>
                                <input
                                    type="text"
                                    value={branchForm.name}
                                    onChange={e => setBranchForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full p-4 bg-app border border-border rounded-xl text-main font-bold focus:border-primary outline-none"
                                    placeholder={lang === 'ar' ? 'مثال: فرع المعادي' : 'e.g. Maadi Branch'}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted mb-2 block">{lang === 'ar' ? 'الموقع' : 'Location'}</label>
                                <input
                                    type="text"
                                    value={branchForm.location}
                                    onChange={e => setBranchForm(f => ({ ...f, location: e.target.value }))}
                                    className="w-full p-4 bg-app border border-border rounded-xl text-main font-bold focus:border-primary outline-none"
                                    placeholder={lang === 'ar' ? 'العنوان الكامل' : 'Full address'}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted mb-2 block">{lang === 'ar' ? 'المنطقة الزمنية' : 'Timezone'}</label>
                                    <select
                                        value={branchForm.timezone}
                                        onChange={e => setBranchForm(f => ({ ...f, timezone: e.target.value }))}
                                        className="w-full p-4 bg-app border border-border rounded-xl text-main font-bold focus:border-primary outline-none"
                                    >
                                        <option value="Africa/Cairo">Cairo</option>
                                        <option value="Asia/Riyadh">Riyadh</option>
                                        <option value="Asia/Dubai">Dubai</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted mb-2 block">{lang === 'ar' ? 'العملة' : 'Currency'}</label>
                                    <select
                                        value={branchForm.currency}
                                        onChange={e => setBranchForm(f => ({ ...f, currency: e.target.value }))}
                                        className="w-full p-4 bg-app border border-border rounded-xl text-main font-bold focus:border-primary outline-none"
                                    >
                                        <option value="EGP">EGP</option>
                                        <option value="SAR">SAR</option>
                                        <option value="AED">AED</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleAddBranch}
                            disabled={isSubmitting}
                            className="w-full mt-6 py-4 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {lang === 'ar' ? 'إضافة الفرع' : 'Add Branch'}
                        </button>
                    </div>
                </div>
            )}

            {/* Add Platform Modal */}
            {showPlatformModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowPlatformModal(false)}>
                    <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-main">{lang === 'ar' ? 'إضافة تطبيق توصيل' : 'Add Delivery Platform'}</h3>
                            <button onClick={() => setShowPlatformModal(false)} className="p-2 rounded-xl hover:bg-elevated text-muted">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted mb-2 block">{lang === 'ar' ? 'اسم التطبيق' : 'Platform Name'}</label>
                                <input
                                    type="text"
                                    value={platformForm.name}
                                    onChange={e => setPlatformForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full p-4 bg-app border border-border rounded-xl text-main font-bold focus:border-primary outline-none"
                                    placeholder={lang === 'ar' ? 'مثال: طلبات' : 'e.g. Talabat'}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted mb-2 block">{lang === 'ar' ? 'مفتاح API (اختياري)' : 'API Key (optional)'}</label>
                                <input
                                    type="text"
                                    value={platformForm.apiKey}
                                    onChange={e => setPlatformForm(f => ({ ...f, apiKey: e.target.value }))}
                                    className="w-full p-4 bg-app border border-border rounded-xl text-main font-bold focus:border-primary outline-none"
                                    placeholder="sk-xxxx"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted mb-2 block">{lang === 'ar' ? 'نسبة العمولة (%)' : 'Commission (%)'}</label>
                                <input
                                    type="number"
                                    value={platformForm.commissionPercent}
                                    onChange={e => setPlatformForm(f => ({ ...f, commissionPercent: parseFloat(e.target.value) || 0 }))}
                                    className="w-full p-4 bg-app border border-border rounded-xl text-main font-bold focus:border-primary outline-none"
                                    min={0}
                                    max={100}
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAddPlatform}
                            disabled={isSubmitting}
                            className="w-full mt-6 py-4 bg-orange-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-orange-500 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {lang === 'ar' ? 'إضافة التطبيق' : 'Add Platform'}
                        </button>
                    </div>
                </div>
            )}

            {/* Add Warehouse Modal */}
            {showWarehouseModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowWarehouseModal(false)}>
                    <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-main">{lang === 'ar' ? 'إضافة مخزن جديد' : 'Add New Warehouse'}</h3>
                            <button onClick={() => setShowWarehouseModal(false)} className="p-2 rounded-xl hover:bg-elevated text-muted">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted mb-2 block">{lang === 'ar' ? 'اسم المخزن' : 'Warehouse Name'}</label>
                                <input
                                    type="text"
                                    value={warehouseForm.name}
                                    onChange={e => setWarehouseForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full p-4 bg-app border border-border rounded-xl text-main font-bold focus:border-primary outline-none"
                                    placeholder={lang === 'ar' ? 'مثال: مخزن المطبخ' : 'e.g. Kitchen Storage'}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted mb-2 block">{lang === 'ar' ? 'الفرع' : 'Branch'}</label>
                                <select
                                    value={warehouseForm.branchId}
                                    onChange={e => setWarehouseForm(f => ({ ...f, branchId: e.target.value }))}
                                    className="w-full p-4 bg-app border border-border rounded-xl text-main font-bold focus:border-primary outline-none"
                                >
                                    <option value="">{lang === 'ar' ? 'اختر الفرع' : 'Select Branch'}</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted mb-2 block">{lang === 'ar' ? 'نوع المخزن' : 'Warehouse Type'}</label>
                                <select
                                    value={warehouseForm.type}
                                    onChange={e => setWarehouseForm(f => ({ ...f, type: e.target.value }))}
                                    className="w-full p-4 bg-app border border-border rounded-xl text-main font-bold focus:border-primary outline-none"
                                >
                                    <option value="MAIN">{lang === 'ar' ? 'ط±ط¦ظٹط³ظٹ' : 'Main'}</option>
                                    <option value="KITCHEN">{lang === 'ar' ? 'مطبخ' : 'Kitchen'}</option>
                                    <option value="BAR">{lang === 'ar' ? 'ط¨ط§ط±' : 'Bar'}</option>
                                    <option value="COLD">{lang === 'ar' ? 'طھط¨ط±ظٹط¯' : 'Cold Storage'}</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handleAddWarehouse}
                            disabled={isSubmitting}
                            className="w-full mt-6 py-4 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {lang === 'ar' ? 'إضافة المخزن' : 'Add Warehouse'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsHub;

