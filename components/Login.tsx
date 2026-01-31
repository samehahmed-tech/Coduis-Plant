import React, { useState } from 'react';
import {
    User as UserIcon,
    Lock,
    AtSign,
    ArrowRight,
    Sparkles,
    Globe,
    ShieldCheck,
    Building2,
    ChefHat,
    LayoutDashboard
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginProps {
    onLogin: (email: string, password: string) => void;
    lang: 'en' | 'ar';
    setLang: (lang: 'en' | 'ar') => void;
    error?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, lang, setLang, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            onLogin(email, password);
            setIsSubmitting(false);
        }, 800);
    };

    const t = {
        en: {
            title: 'RestoFlow ERP',
            subtitle: 'Enterprise Operation Center 2026',
            email: 'Professional Email',
            password: 'Secure Pin / Password',
            login: 'Authenticate',
            forgot: 'Forgot Identity?',
            desc: 'Secure multi-branch network access with biometric-ready encryption.',
            footer: 'Authorized Personnel Only',
            switch: 'العربية'
        },
        ar: {
            title: 'ريستو فلو ERP',
            subtitle: 'مركز العمليات المؤسسي ٢٠٢٦',
            email: 'البريد المهني',
            password: 'كلمة المرور / الرقم السري',
            login: 'تسجيل الدخول',
            forgot: 'نسيت الهوية؟',
            desc: 'وصول آمن لشبكة الفروع المتعددة مع تشفير جاهز للقياسات الحيوية.',
            footer: 'للموظفين المصرح لهم فقط',
            switch: 'English'
        }
    }[lang];

    return (
        <div className="fixed inset-0 min-h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            {/* Language Toggle */}
            <button
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className="absolute top-8 right-8 z-50 px-4 py-2 glass rounded-2xl flex items-center gap-2 text-white/70 hover:text-white transition-all text-sm font-black"
            >
                <Globe size={16} />
                {t.switch}
            </button>

            <div className={`relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-700 ${lang === 'ar' ? 'rtl' : 'ltr'}`}>

                {/* Artistic Branding Side */}
                <div className="hidden lg:flex flex-col p-12 bg-gradient-to-br from-indigo-600/40 via-violet-600/30 to-transparent relative border-r border-white/10">
                    <div className="mb-auto">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-8 group hover:scale-110 transition-transform duration-500">
                            <Sparkles className="text-indigo-600" size={32} />
                        </div>
                        <h1 className="text-5xl font-black text-white leading-tight tracking-tighter mb-4">
                            {t.title}
                        </h1>
                        <p className="text-white/60 text-lg font-bold tracking-wide uppercase italic">
                            {t.subtitle}
                        </p>
                    </div>

                    <div className="space-y-8 mt-12">
                        <div className="flex items-center gap-4 text-white/80">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <Building2 size={24} className="text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-widest">Multi-Branch Sync</h4>
                                <p className="text-xs text-white/40 font-bold">Real-time global reconciliation.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-white/80">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <ShieldCheck size={24} className="text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-widest">Enterprise Security</h4>
                                <p className="text-xs text-white/40 font-bold">Encrypted role-based access.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto border-t border-white/10 pt-8 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em]">{t.footer}</span>
                        <div className="flex gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="p-8 md:p-16 lg:p-20 flex flex-col justify-center">
                    <div className="mb-12">
                        <h2 className="text-3xl font-black text-white mb-3">
                            {lang === 'ar' ? 'مرحباً بعودتك' : 'Identity Verification'}
                        </h2>
                        <p className="text-white/40 text-sm font-bold leading-relaxed max-w-xs">
                            {t.desc}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <AtSign className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t.email}
                                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white font-black placeholder:text-white/20 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t.password}
                                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white font-black placeholder:text-white/20 focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-black uppercase text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between px-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-5 h-5 rounded-lg border-2 border-white/10 flex items-center justify-center bg-white/5 group-hover:border-indigo-500 transition-all">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 opacity-0 group-has-[:checked]:opacity-100" />
                                </div>
                                <input type="checkbox" className="hidden" />
                                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'تذكرني' : 'Remember'}</span>
                            </label>
                            <button type="button" className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-indigo-400 transition-colors">{t.forgot}</button>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all group"
                        >
                            {isSubmitting ? (
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-75" />
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-150" />
                                </div>
                            ) : (
                                <>
                                    {t.login}
                                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 lg:hidden border-t border-white/10 pt-8 flex justify-center flex-col items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                            <Sparkles size={20} />
                        </div>
                        <h1 className="text-xl font-black text-white italic tracking-tighter">{t.title}</h1>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
