import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { AtSign, ArrowRight, Globe, Lock, ShieldCheck, KeyRound, Fingerprint, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { INITIAL_ROLE_PERMISSIONS, User, UserRole } from '../types';

const Login: React.FC = () => {
    const { loginWithPassword, settings, updateSettings } = useAuthStore();
    const navigate = useNavigate();

    const [loginMode, setLoginMode] = useState<'password' | 'pin'>('pin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [pin, setPin] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaToken, setMfaToken] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [pressedKey, setPressedKey] = useState<string | null>(null);
    const [timeStr, setTimeStr] = useState('');

    const pinInputRef = useRef<HTMLInputElement>(null);
    const isArabic = settings.language === 'ar';

    // Live clock
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTimeStr(now.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }));
        };
        tick();
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, [isArabic]);

    // Auto-focus PIN input
    useEffect(() => {
        if (loginMode === 'pin' && !mfaRequired) {
            setTimeout(() => pinInputRef.current?.focus(), 100);
        }
    }, [loginMode, mfaRequired]);

    const t = {
        en: {
            welcome: 'Welcome Back',
            subtitle: 'Sign in to your workspace',
            email: 'Email Address',
            password: 'Password',
            login: 'Sign In',
            verify: 'Verify Code',
            forgot: 'Forgot Password?',
            footer: 'Coduis Zen ERP • v3.0',
            switch: 'العربية',
            invalidCredentials: 'Invalid credentials',
            invalidMfaCode: 'Invalid verification code',
            invalidPin: 'Invalid PIN code',
            remember: 'Remember me',
            mfaCode: '6-digit verification code',
            pinLogin: 'Quick PIN',
            emailLogin: 'Email Login',
            enterPin: 'Enter your PIN code',
            pinHint: 'Type on keyboard or tap the pad',
        },
        ar: {
            welcome: 'مرحباً بعودتك',
            subtitle: 'سجل دخولك إلى نظامك',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            login: 'تسجيل الدخول',
            verify: 'تحقق من الكود',
            forgot: 'نسيت كلمة المرور؟',
            footer: 'Coduis Zen ERP • v3.0',
            switch: 'English',
            invalidCredentials: 'بيانات الدخول غير صحيحة',
            invalidMfaCode: 'كود التحقق غير صحيح',
            invalidPin: 'كود PIN غير صحيح',
            remember: 'تذكرني',
            mfaCode: 'كود التحقق 6 أرقام',
            pinLogin: 'كود سريع',
            emailLogin: 'إيميل وباسوورد',
            enterPin: 'أدخل كود PIN الخاص بك',
            pinHint: 'اكتب من الكيبورد أو اضغط الأزرار',
        },
    }[settings.language];

    const navigateByRole = (role: string) => {
        if (role === 'CASHIER') navigate('/pos');
        else if (role === 'KITCHEN_STAFF') navigate('/kitchen');
        else navigate('/');
    };

    const handleLoginSuccess = (token: string, refreshToken: string | undefined, user: any) => {
        localStorage.setItem('auth_token', token);
        if (refreshToken) localStorage.setItem('auth_refresh_token', refreshToken);
        const mappedUser: User = {
            id: user.id, name: user.name, email: user.email,
            role: user.role as UserRole,
            permissions: user.permissions || INITIAL_ROLE_PERMISSIONS[user.role as UserRole] || [],
            isActive: user.isActive !== false,
            assignedBranchId: user.assignedBranchId,
            mfaEnabled: user.mfaEnabled === true,
        };
        useAuthStore.setState((state) => ({
            token, settings: { ...state.settings, currentUser: mappedUser, activeBranchId: mappedUser.assignedBranchId || state.branches[0]?.id },
            isAuthenticated: true, isLoading: false,
        }));
        navigateByRole(mappedUser.role);
    };

    const handlePasswordLogin = async () => {
        try {
            setError(undefined);
            const user = await loginWithPassword(email, password);
            navigateByRole(user.role);
        } catch (err: any) {
            if (err?.code === 'MFA_REQUIRED' && err?.mfaToken) { setMfaToken(err.mfaToken); setMfaRequired(true); return; }
            if (err?.details && Array.isArray(err.details)) { setError(err.details.map((d: any) => d.message || d).join('\n')); }
            else { setError(t.invalidCredentials); }
        }
    };

    const handlePinLogin = async () => {
        try {
            setError(undefined);
            const result = await authApi.pinLogin(pin);
            if (result.token && result.user) { handleLoginSuccess(result.token, result.refreshToken, result.user); }
            else { setError(t.invalidPin); }
        } catch (err: any) {
            if (err?.code === 'MFA_REQUIRED' && err?.mfaToken) { setMfaToken(err.mfaToken); setMfaRequired(true); return; }
            setError(t.invalidPin);
        }
    };

    const handleMfaVerify = async () => {
        if (!mfaToken || mfaCode.length !== 6) return;
        try {
            setError(undefined);
            const deviceName = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown-device';
            const result = await authApi.verifyMfa(mfaToken, mfaCode, deviceName);
            handleLoginSuccess(result.token, result.refreshToken, result.user);
        } catch { setError(t.invalidMfaCode); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(async () => {
            if (mfaRequired) await handleMfaVerify();
            else if (loginMode === 'pin') await handlePinLogin();
            else await handlePasswordLogin();
            setIsSubmitting(false);
        }, 300);
    };

    const handlePinDigit = useCallback((digit: string) => {
        setPressedKey(digit);
        setTimeout(() => setPressedKey(null), 150);
        setPin(prev => prev.length < 6 ? prev + digit : prev);
        pinInputRef.current?.focus();
    }, []);

    const handlePinBackspace = useCallback(() => {
        setPressedKey('back');
        setTimeout(() => setPressedKey(null), 150);
        setPin(prev => prev.slice(0, -1));
        pinInputRef.current?.focus();
    }, []);

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
    return (
        <div className={`fixed inset-0 flex items-center justify-center overflow-hidden transition-colors duration-700 ${isArabic ? 'rtl' : 'ltr'}`}>
            {/* === Animated Background === */}
            <div className="absolute inset-0 bg-[#060913] transition-colors duration-1000">
                {/* Dynamic Gradient Orbs */}
                <div className="absolute top-[-25%] left-[-15%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] max-w-[600px] max-h-[600px] rounded-full bg-cyan-500/10 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
                <div className="absolute top-[30%] right-[10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full bg-violet-600/10 blur-[90px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />

                {/* Advanced Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
                }} />
            </div>

            {/* === Top Bar === */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-50">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                    <span className="text-white/30 text-xs font-bold tracking-[0.3em] uppercase hidden sm:inline">{t.footer}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-white/20 text-sm font-mono font-bold">{timeStr}</span>
                    <button
                        onClick={() => updateSettings({ language: settings.language === 'en' ? 'ar' : 'en' })}
                        className="px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-2 text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs font-black tracking-widest uppercase"
                    >
                        <Globe size={14} />
                        {t.switch}
                    </button>
                </div>
            </div>

            {/* === Main Card === */}
            <div className="relative z-10 w-full max-w-[440px] px-4 md:px-0 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                {/* Luxurious Glow behind card */}
                <div className="absolute -inset-1.5 bg-gradient-to-br from-indigo-500/30 via-transparent to-cyan-500/30 rounded-[2.5rem] blur-2xl opacity-60 animate-pulse" style={{ animationDuration: '4s' }} />

                <div className="relative bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] overflow-hidden">
                    {/* Top glass reflection highlight */}
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent" />

                    <div className="p-8 sm:p-10 relative">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="relative inline-flex mb-6 group">
                                <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl group-hover:bg-indigo-500/30 transition-all duration-500" />
                                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transform group-hover:scale-105 transition-all duration-300">
                                    <Fingerprint size={32} className="text-white drop-shadow-md" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight mb-2">
                                {mfaRequired ? t.verify : t.welcome}
                            </h1>
                            <p className="text-slate-400 text-sm font-medium tracking-wide">
                                {mfaRequired ? t.mfaCode : t.subtitle}
                            </p>
                        </div>

                        {/* Mode Switcher */}
                        {!mfaRequired && (
                            <div className="flex bg-slate-800/50 rounded-2xl p-1.5 mb-8 border border-white/5 shadow-inner">
                                {([
                                    { mode: 'pin' as const, icon: KeyRound, label: t.pinLogin },
                                    { mode: 'password' as const, icon: AtSign, label: t.emailLogin },
                                ]).map(item => (
                                    <button
                                        key={item.mode}
                                        type="button"
                                        onClick={() => { setLoginMode(item.mode); setError(undefined); }}
                                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5
                                            ${loginMode === item.mode
                                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-100'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5 scale-95'
                                            }`}
                                    >
                                        <item.icon size={16} className={loginMode === item.mode ? 'opacity-100' : 'opacity-70'} />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* ─── PIN Mode ─── */}
                            {loginMode === 'pin' && !mfaRequired && (
                                <div className="space-y-5">
                                    {/* Hidden keyboard input */}
                                    <input
                                        ref={pinInputRef}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={pin}
                                        autoFocus
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && pin.length >= 4) handleSubmit(e as any); }}
                                        className="sr-only"
                                        aria-label="PIN input"
                                    />

                                    {/* PIN dots */}
                                    <div
                                        className="flex items-center justify-center gap-3 py-3 cursor-text"
                                        onClick={() => pinInputRef.current?.focus()}
                                    >
                                        {[0, 1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="relative">
                                                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length
                                                    ? 'bg-indigo-400 scale-125 shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                                                    : i < 4
                                                        ? 'bg-white/10 border border-white/20'
                                                        : 'bg-white/5 border border-white/10'
                                                    }`} />
                                                {i === pin.length && (
                                                    <div className="absolute inset-0 rounded-full border-2 border-indigo-400/50 animate-pulse" />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <p className="text-center text-white/20 text-[11px] font-bold tracking-wider">
                                        {t.pinHint}
                                    </p>

                                    {/* Number Pad */}
                                    <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mt-6">
                                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                                            <button
                                                key={digit}
                                                type="button"
                                                onClick={() => handlePinDigit(digit)}
                                                className={`h-16 rounded-2xl font-black text-2xl transition-all duration-200 border shadow-sm
                                                    ${pressedKey === digit
                                                        ? 'bg-indigo-500 border-indigo-400 text-white scale-95 shadow-inner'
                                                        : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20 active:scale-95'
                                                    }`}
                                            >
                                                {digit}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => { setPin(''); pinInputRef.current?.focus(); }}
                                            className="h-16 rounded-2xl text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 text-xs font-black uppercase tracking-widest transition-all border border-transparent active:scale-95"
                                        >
                                            {isArabic ? 'مسح' : 'CLR'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handlePinDigit('0')}
                                            className={`h-16 rounded-2xl font-black text-2xl transition-all duration-200 border shadow-sm
                                                ${pressedKey === '0'
                                                    ? 'bg-indigo-500 border-indigo-400 text-white scale-95 shadow-inner'
                                                    : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20 active:scale-95'
                                                }`}
                                        >
                                            0
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handlePinBackspace}
                                            className={`h-16 rounded-2xl text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 flex items-center justify-center transition-all border border-transparent active:scale-95
                                                ${pressedKey === 'back' ? 'bg-amber-500/20 scale-95' : ''}`}
                                        >
                                            <ArrowRight size={24} className={isArabic ? 'rotate-0' : 'rotate-180'} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ─── Password Mode ─── */}
                            {loginMode === 'password' && !mfaRequired && (
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity -m-0.5" />
                                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors z-10" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t.email}
                                            className="relative w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-white/30 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-slate-800/80 outline-none transition-all text-sm font-semibold shadow-inner"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity -m-0.5" />
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors z-10" size={18} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={t.password}
                                            className="relative w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-white/30 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-slate-800/80 outline-none transition-all text-sm font-semibold shadow-inner"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors z-10"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between px-1 pt-1">
                                        <label className="flex items-center gap-2.5 cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input type="checkbox" className="peer appearance-none w-4 h-4 rounded-md border border-white/20 bg-white/5 checked:bg-indigo-500 checked:border-indigo-500 transition-all cursor-pointer" />
                                                <ShieldCheck className="absolute opacity-0 peer-checked:opacity-100 left-0 top-0 text-white transition-opacity pointer-events-none" size={16} />
                                            </div>
                                            <span className="text-white/30 text-xs font-bold">{t.remember}</span>
                                        </label>
                                        <button type="button" className="text-white/30 text-xs font-bold hover:text-indigo-400 transition-colors">
                                            {t.forgot}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ─── MFA ─── */}
                            {mfaRequired && (
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder={t.mfaCode}
                                        autoFocus
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-white/30 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all text-sm font-semibold tracking-[0.5em] text-center shadow-inner"
                                    />
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold text-center whitespace-pre-line flex items-center justify-center gap-2">
                                    <Sparkles size={14} className="text-rose-400/60 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    (mfaRequired && mfaCode.length !== 6) ||
                                    (loginMode === 'pin' && !mfaRequired && pin.length < 4)
                                }
                                className="w-full mt-8 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-2xl font-black text-sm tracking-[0.15em] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] disabled:opacity-50 disabled:shadow-none transition-all duration-300 group active:scale-[0.98] uppercase"
                            >
                                {isSubmitting ? (
                                    <div className="flex gap-1.5 items-center h-5">
                                        <div className="w-2 h-2 rounded-full bg-white/80 animate-[bounce_1s_infinite_0ms]" />
                                        <div className="w-2 h-2 rounded-full bg-white/80 animate-[bounce_1s_infinite_200ms]" />
                                        <div className="w-2 h-2 rounded-full bg-white/80 animate-[bounce_1s_infinite_400ms]" />
                                    </div>
                                ) : (
                                    <>
                                        {mfaRequired ? t.verify : t.login}
                                        <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Bottom accent */}
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-white/15 text-[10px] font-bold tracking-[0.3em] uppercase">{t.footer}</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
