import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { AtSign, ArrowRight, Globe, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { INITIAL_ROLE_PERMISSIONS, User, UserRole } from '../types';

const backgrounds = ['/BG/1.png', '/BG/2.png', '/BG/3.png', '/BG/4.png', '/BG/5.png'];

const Login: React.FC = () => {
    const { loginWithPassword, settings, updateSettings } = useAuthStore();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaToken, setMfaToken] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);
    const [error, setError] = useState<string | undefined>();

    const t = {
        en: {
            title: 'Restaurant ERP',
            email: 'Email Address',
            password: 'Password',
            login: 'Sign In',
            verify: 'Verify',
            forgot: 'Forgot Password?',
            footer: '© 2026 Restaurant Management System. v3.0',
            switch: 'Arabic',
            invalidCredentials: 'Invalid credentials',
            invalidMfaCode: 'Invalid verification code',
            remember: 'Remember me',
            mfaCode: '6-digit verification code',
        },
        ar: {
            title: 'نظام إدارة المطاعم',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            login: 'تسجيل الدخول',
            verify: 'تحقق',
            forgot: 'نسيت كلمة المرور؟',
            footer: '© 2026 نظام إدارة المطاعم. v3.0',
            switch: 'English',
            invalidCredentials: 'بيانات الدخول غير صحيحة',
            invalidMfaCode: 'كود التحقق غير صحيح',
            remember: 'تذكرني',
            mfaCode: 'كود التحقق 6 أرقام',
        },
    }[settings.language];

    const navigateByRole = (role: string) => {
        if (role === 'CASHIER') navigate('/pos');
        else if (role === 'KITCHEN_STAFF') navigate('/kitchen');
        else navigate('/');
    };

    const handlePasswordLogin = async () => {
        try {
            setError(undefined);
            const user = await loginWithPassword(email, password);
            navigateByRole(user.role);
        } catch (err: any) {
            if (err?.code === 'MFA_REQUIRED' && err?.mfaToken) {
                setMfaToken(err.mfaToken);
                setMfaRequired(true);
                return;
            }
            setError(t.invalidCredentials);
        }
    };

    const handleMfaVerify = async () => {
        if (!mfaToken || mfaCode.length !== 6) return;
        try {
            setError(undefined);
            const deviceName = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown-device';
            const result = await authApi.verifyMfa(mfaToken, mfaCode, deviceName);
            const { token, user } = result;
            localStorage.setItem('auth_token', token);

            const mappedUser: User = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role as UserRole,
                permissions: user.permissions || INITIAL_ROLE_PERMISSIONS[user.role as UserRole] || [],
                isActive: user.isActive !== false,
                assignedBranchId: user.assignedBranchId,
                mfaEnabled: user.mfaEnabled === true,
            };

            useAuthStore.setState((state) => ({
                token,
                settings: {
                    ...state.settings,
                    currentUser: mappedUser,
                    activeBranchId: mappedUser.assignedBranchId || state.branches[0]?.id,
                },
                isAuthenticated: true,
                isLoading: false,
            }));

            navigateByRole(mappedUser.role);
        } catch {
            setError(t.invalidMfaCode);
        }
    };

    useEffect(() => {
        setBgIndex(Math.floor(Math.random() * backgrounds.length));
        const interval = setInterval(() => setBgIndex((prev) => (prev + 1) % backgrounds.length), 10000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(async () => {
            if (mfaRequired) await handleMfaVerify();
            else await handlePasswordLogin();
            setIsSubmitting(false);
        }, 300);
    };

    return (
        <div className="fixed inset-0 app-viewport safe-area flex items-center justify-center p-4 overflow-hidden font-outfit">
            {backgrounds.map((bg, index) => (
                <div
                    key={bg}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${bgIndex === index ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
                    style={{
                        backgroundImage: `url(${bg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transition: 'opacity 2000ms ease-in-out, transform 15000ms linear',
                    }}
                />
            ))}

            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />

            <button
                onClick={() => updateSettings({ language: settings.language === 'en' ? 'ar' : 'en' })}
                className="absolute top-8 right-8 z-50 px-6 py-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-2 text-white/70 hover:text-white hover:bg-black/40 transition-all text-sm font-black tracking-widest uppercase"
            >
                <Globe size={18} />
                {t.switch}
            </button>

            <div className={`relative z-10 w-full max-w-md ${settings.language === 'ar' ? 'rtl' : 'ltr'}`}>
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="relative group mb-6">
                        <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/40 transition-all duration-500" />
                        <img
                            src="/logo.png"
                            alt={t.title}
                            className="relative h-32 w-auto drop-shadow-[0_0_30px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                            {mfaRequired ? t.verify : t.login}
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
                                    disabled={mfaRequired}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t.email}
                                    className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all text-base font-semibold backdrop-blur-sm disabled:opacity-60"
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                <input
                                    type="password"
                                    required={!mfaRequired}
                                    disabled={mfaRequired}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t.password}
                                    className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all text-base font-semibold backdrop-blur-sm disabled:opacity-60"
                                />
                            </div>

                            {mfaRequired && (
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder={t.mfaCode}
                                        className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all text-base font-semibold backdrop-blur-sm"
                                    />
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-bold text-center">
                                {error}
                            </div>
                        )}

                        {!mfaRequired && (
                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-700 bg-slate-800 checked:bg-indigo-500 checked:border-indigo-500 transition-all cursor-pointer" />
                                        <ShieldCheck className="absolute opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 text-white transition-opacity pointer-events-none" size={16} />
                                    </div>
                                    <span className="text-slate-400 text-sm font-bold">{t.remember}</span>
                                </label>
                                <button type="button" className="text-slate-300 text-sm font-bold hover:text-white transition-colors">
                                    {t.forgot}
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || (mfaRequired && mfaCode.length !== 6)}
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
                                    {mfaRequired ? t.verify : t.login}
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
