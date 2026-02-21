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
        <div className={`fixed inset-0 flex items-center justify-center overflow-hidden ${isArabic ? 'rtl' : 'ltr'}`}>
            {/* === Animated Background === */}
            <div className="absolute inset-0 bg-[#0a0e1a]">
                {/* Gradient orbs */}
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
                <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[80px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
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
            <div className="relative z-10 w-full max-w-[420px] mx-4">
                {/* Glow behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-cyan-500/10 to-violet-500/20 rounded-[2.5rem] blur-xl opacity-60" />

                <div className="relative bg-white/[0.04] backdrop-blur-2xl rounded-[2.5rem] border border-white/[0.08] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
                    {/* Top accent line */}
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

                    <div className="p-8 sm:p-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="relative inline-flex mb-5">
                                <div className="absolute -inset-3 bg-indigo-500/20 rounded-2xl blur-lg" />
                                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <Fingerprint size={32} className="text-white" />
                                </div>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1.5">
                                {mfaRequired ? t.verify : t.welcome}
                            </h1>
                            <p className="text-white/30 text-sm font-medium">
                                {mfaRequired ? t.mfaCode : t.subtitle}
                            </p>
                        </div>

                        {/* Mode Switcher */}
                        {!mfaRequired && (
                            <div className="flex bg-white/[0.04] rounded-2xl p-1 mb-7 border border-white/[0.06]">
                                {([
                                    { mode: 'pin' as const, icon: KeyRound, label: t.pinLogin },
                                    { mode: 'password' as const, icon: AtSign, label: t.emailLogin },
                                ]).map(item => (
                                    <button
                                        key={item.mode}
                                        type="button"
                                        onClick={() => { setLoginMode(item.mode); setError(undefined); }}
                                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2
                                            ${loginMode === item.mode
                                                ? 'bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/25'
                                                : 'text-white/30 hover:text-white/60'
                                            }`}
                                    >
                                        <item.icon size={14} />
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
                                    <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
                                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                                            <button
                                                key={digit}
                                                type="button"
                                                onClick={() => handlePinDigit(digit)}
                                                className={`h-14 rounded-2xl font-black text-xl transition-all duration-150 border
                                                    ${pressedKey === digit
                                                        ? 'bg-indigo-500/30 border-indigo-500/50 text-white scale-90'
                                                        : 'bg-white/[0.03] border-white/[0.06] text-white/80 hover:bg-white/[0.08] hover:text-white active:scale-90'
                                                    }`}
                                            >
                                                {digit}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => { setPin(''); pinInputRef.current?.focus(); }}
                                            className="h-14 rounded-2xl text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest transition-all border border-transparent"
                                        >
                                            {isArabic ? 'مسح' : 'CLR'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handlePinDigit('0')}
                                            className={`h-14 rounded-2xl font-black text-xl transition-all duration-150 border
                                                ${pressedKey === '0'
                                                    ? 'bg-indigo-500/30 border-indigo-500/50 text-white scale-90'
                                                    : 'bg-white/[0.03] border-white/[0.06] text-white/80 hover:bg-white/[0.08] hover:text-white active:scale-90'
                                                }`}
                                        >
                                            0
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handlePinBackspace}
                                            className={`h-14 rounded-2xl text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10 text-lg font-black transition-all border border-transparent
                                                ${pressedKey === 'back' ? 'scale-90' : ''}`}
                                        >
                                            ←
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ─── Password Mode ─── */}
                            {loginMode === 'password' && !mfaRequired && (
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity -m-0.5" />
                                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors z-10" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t.email}
                                            className="relative w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 outline-none transition-all text-sm font-semibold"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity -m-0.5" />
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors z-10" size={18} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={t.password}
                                            className="relative w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 outline-none transition-all text-sm font-semibold"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors z-10"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder={t.mfaCode}
                                        autoFocus
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 outline-none transition-all text-sm font-semibold tracking-[0.5em] text-center"
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
                                className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl font-black text-sm tracking-wider flex items-center justify-center gap-3 shadow-[0_8px_32px_-4px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_40px_-4px_rgba(99,102,241,0.6)] disabled:opacity-40 disabled:shadow-none transition-all duration-300 group active:scale-[0.98] uppercase"
                            >
                                {isSubmitting ? (
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
                                        <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                ) : (
                                    <>
                                        {mfaRequired ? t.verify : t.login}
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
