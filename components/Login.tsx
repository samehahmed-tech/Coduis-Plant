
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import {
    Lock,
    AtSign,
    ArrowRight,
    Globe,
    ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const backgrounds = [
    '/BG/1.png',
    '/BG/2.png',
    '/BG/3.png',
    '/BG/4.png',
    '/BG/5.png'
];

const Login: React.FC = () => {
    const { login, settings, updateSettings } = useAuthStore();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);
    const [error, setError] = useState<string | undefined>();

    // Mock User Database for Demo
    const handleLogin = (e: string, p: string) => {
        // In a real app, this would hit an API
        // For demo, we verify against hardcoded demo users (which we could also pull from a constant or store)
        const DEMO_USERS = [
            { email: 'admin@1.com', role: 'SUPER_ADMIN', name: 'Super Admin', id: 'u1', isActive: true, permissions: [] },
            { email: 'manager@1.com', role: 'BRANCH_MANAGER', name: 'Manager Base', id: 'u2', isActive: true, permissions: [], assignedBranchId: 'b1' },
            { email: 'cashier@1.com', role: 'CASHIER', name: 'Cashier Main', id: 'u3', isActive: true, permissions: [], assignedBranchId: 'b1' },
            { email: 'kitchen@1.com', role: 'KITCHEN_STAFF', name: 'Kitchen Display', id: 'u4', isActive: true, permissions: [], assignedBranchId: 'b1' },
            { email: 'callcenter@1.com', role: 'CALL_CENTER', name: 'Call Center', id: 'u5', isActive: true, permissions: [] }
        ];

        const user = DEMO_USERS.find(u => u.email === e);

        if (user) {
            // @ts-ignore - simplistic casting for demo
            login(user);
            if (user.role === 'CASHIER') navigate('/pos');
            else if (user.role === 'KITCHEN_STAFF') navigate('/kitchen');
            else navigate('/');
        } else {
            setError(settings.language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials');
        }
    };

    useEffect(() => {
        // Random initial background
        setBgIndex(Math.floor(Math.random() * backgrounds.length));

        // Slideshow every 10 seconds
        const interval = setInterval(() => {
            setBgIndex(prev => (prev + 1) % backgrounds.length);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            handleLogin(email, password);
            setIsSubmitting(false);
        }, 800);
    };

    const t = {
        en: {
            title: 'Coduis Zen',
            subtitle: 'Unified Enterprise Suite',
            email: 'Email Address',
            password: 'Password',
            login: 'Sign In',
            forgot: 'Forgot Password?',
            desc: 'Centralized production, supply chain, and multi-branch intelligence.',
            footer: '© 2026 Coduis Zen. Global Operations v3.0',
            switch: 'العربية'
        },
        ar: {
            title: 'كوديوس زين',
            subtitle: 'المنظومة المؤسسية الموحدة',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            login: 'تسجيل الدخول',
            forgot: 'نسيت كلمة المرور؟',
            desc: 'نظام مركزي متكامل لإدارة الإنتاج، سلاسل الإمداد، والعمليات متعددة الفروع.',
            footer: '© ٢٠٢٦ كوديوس زين. العمليات العالمية v3.0',
            switch: 'English'
        }
    }[settings.language];

    return (
        <div className="fixed inset-0 min-h-screen flex items-center justify-center p-4 overflow-hidden font-outfit">
            {/* Background Slideshow */}
            {backgrounds.map((bg, index) => (
                <div
                    key={bg}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${bgIndex === index ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
                    style={{
                        backgroundImage: `url(${bg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transition: 'opacity 2000ms ease-in-out, transform 15000ms linear'
                    }}
                />
            ))}

            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />

            {/* Demo Login Helpers */}
            <div className="absolute bottom-8 left-8 right-8 z-50 flex gap-2 justify-center flex-wrap">
                {[
                    { email: 'admin@1.com', label: 'Admin' },
                    { email: 'manager@1.com', label: 'Manager' },
                    { email: 'cashier@1.com', label: 'Cashier' },
                    { email: 'kitchen@1.com', label: 'Kitchen' },
                    { email: 'callcenter@1.com', label: 'Call Center' }
                ].map(u => (
                    <button
                        key={u.email}
                        onClick={() => handleLogin(u.email, '123456')}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white/60 hover:text-white text-[10px] font-bold uppercase transition-all tracking-wider border border-white/5"
                    >
                        {u.label}
                    </button>
                ))}
            </div>

            {/* Language Toggle */}
            <button
                onClick={() => updateSettings({ language: settings.language === 'en' ? 'ar' : 'en' })}
                className="absolute top-8 right-8 z-50 px-6 py-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-2 text-white/70 hover:text-white hover:bg-black/40 transition-all text-sm font-black tracking-widest uppercase"
            >
                <Globe size={18} />
                {t.switch}
            </button>

            {/* Center Content */}
            <div className={`relative z-10 w-full max-w-md ${settings.language === 'ar' ? 'rtl' : 'ltr'}`}>
                {/* Large Logo */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="relative group mb-6">
                        <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/40 transition-all duration-500" />
                        <img
                            src="/logo.png"
                            alt="Coduis Zen"
                            className="relative h-32 w-auto drop-shadow-[0_0_30px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                </div>

                {/* Glassy Form Box */}
                <div className="bg-slate-900/60 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                            {settings.language === 'ar' ? 'مرحباً بعودتك' : 'Welcome Back'}
                        </h2>
                        <div className="h-1.5 w-12 bg-indigo-500 rounded-full mx-auto" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t.email}
                                    className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all text-base font-semibold backdrop-blur-sm"
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t.password}
                                    className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all text-base font-semibold backdrop-blur-sm"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-bold text-center">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-700 bg-slate-800 checked:bg-indigo-500 checked:border-indigo-500 transition-all cursor-pointer" />
                                    <ShieldCheck className="absolute opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 text-white transition-opacity pointer-events-none" size={16} />
                                </div>
                                <span className="text-slate-400 text-sm font-bold">{settings.language === 'ar' ? 'تذكرني' : 'Remember me'}</span>
                            </label>
                            <button type="button" className="text-slate-300 text-sm font-bold hover:text-white transition-colors">
                                {t.forgot}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-50 transition-all group active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            ) : (
                                <>
                                    {t.login}
                                    <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-white/40 text-sm font-bold tracking-widest uppercase">{t.footer}</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
