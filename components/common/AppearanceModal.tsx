import React, { useState, useCallback, useMemo } from 'react';
import {
    X, Moon, Sun, Check, Sparkles, MonitorSmartphone, Hand,
    Languages, Palette, Layers, Zap, Eye, Grip, Box,
    LayoutGrid, Gauge, Move, Type
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { THEME_LIST, type ThemeConfig } from '../../theme/tokens';
import type { AppTheme } from '../../types';

/* ═══════════════════════════════════════════════════════
   Theme Preview Colors — light + dark
   ═══════════════════════════════════════════════════════ */
const THEME_PREVIEW: Record<AppTheme, {
    primary: string;
    accent: string;
    light: { bg: string; card: string; sidebar: string; text: string; muted: string; border: string };
    dark: { bg: string; card: string; sidebar: string; text: string; muted: string; border: string };
}> = {
    modern: {
        primary: '#6366f1', accent: '#a855f7',
        light: { bg: '#fafaff', card: '#ffffff', sidebar: '#fcfcff', text: '#111827', muted: '#64748b', border: '#e2e8f0' },
        dark: { bg: '#0a0a12', card: '#12121e', sidebar: '#0e0e18', text: '#f8fafc', muted: '#a2aabe', border: '#2a2a3e' },
    },
    glassy: {
        primary: '#8b5cf6', accent: '#c084fc',
        light: { bg: '#f5f3ff', card: 'rgba(255,255,255,0.45)', sidebar: '#faf8ff', text: '#1e143c', muted: '#6b5f94', border: 'rgba(221,214,254,0.5)' },
        dark: { bg: '#080514', card: 'rgba(16,12,36,0.5)', sidebar: '#0c081c', text: '#f5f3ff', muted: '#b2a8d2', border: 'rgba(48,38,82,0.6)' },
    },
    tiles: {
        primary: '#0ea5e9', accent: '#38bdf8',
        light: { bg: '#f4f8fc', card: '#ffffff', sidebar: '#f8fafc', text: '#0c1e30', muted: '#476482', border: '#d2e1f0' },
        dark: { bg: '#060c14', card: '#0c1624', sidebar: '#081018', text: '#f4f8fc', muted: '#94afc8', border: '#243850' },
    },
    fluent: {
        primary: '#0078d4', accent: '#0099ff',
        light: { bg: '#f3f3f3', card: '#ffffff', sidebar: '#f9f9f9', text: '#1a1a1a', muted: '#606060', border: '#dadada' },
        dark: { bg: '#121212', card: '#1c1c1c', sidebar: '#161616', text: '#ffffff', muted: '#acacac', border: '#383838' },
    },
    crystal: {
        primary: '#ec4899', accent: '#f472b6',
        light: { bg: '#fdf8fc', card: 'rgba(255,255,255,0.6)', sidebar: '#fcf6fc', text: '#30102a', muted: '#805a78', border: 'rgba(238,218,235,0.6)' },
        dark: { bg: '#0e060e', card: 'rgba(26,14,26,0.55)', sidebar: '#140a14', text: '#fdf8fc', muted: '#c8aac3', border: 'rgba(62,38,58,0.6)' },
    },
    matte: {
        primary: '#78716c', accent: '#a8a29e',
        light: { bg: '#f5f5f4', card: '#fcfcfa', sidebar: '#f8f8f6', text: '#1c1917', muted: '#57534e', border: '#d6d3d1' },
        dark: { bg: '#10100e', card: '#1c1c1a', sidebar: '#161614', text: '#f5f5f4', muted: '#a8a29e', border: '#3c3834' },
    },
    touch_ui: {
        primary: '#f97316', accent: '#fb923c',
        light: { bg: '#fefcfa', card: '#ffffff', sidebar: '#fffdf8', text: '#1e140a', muted: '#6b5a48', border: '#f0dac4' },
        dark: { bg: '#0e0a06', card: '#1a120c', sidebar: '#140e08', text: '#fefcfa', muted: '#c8af96', border: '#402e20' },
    },
    acrylic: {
        primary: '#06b6d4', accent: '#22d3ee',
        light: { bg: '#f2fafc', card: 'rgba(255,255,255,0.45)', sidebar: '#f6fcfe', text: '#081c26', muted: '#3e6276', border: 'rgba(200,230,240,0.5)' },
        dark: { bg: '#040a10', card: 'rgba(10,22,32,0.4)', sidebar: '#061018', text: '#f2fafc', muted: '#94bed2', border: 'rgba(28,56,72,0.5)' },
    },
};

/* ═══════════════════════════════════════════════════════
   Motion Icons
   ═══════════════════════════════════════════════════════ */
const MOTION_ICON: Record<string, string> = {
    smooth: '⟶', springy: '🌀', crisp: '⚡', decelerate: '↘',
    elastic: '🔮', instant: '⏱', bouncy: '🏀', 'ease-out': '🌊',
};

/* ═══════════════════════════════════════════════════════
   Mini UI Thumbnail — Pure CSS mini-app preview
   ═══════════════════════════════════════════════════════ */
const ThemeThumbnail: React.FC<{ theme: ThemeConfig; isDark: boolean; isActive: boolean }> = ({ theme, isDark, isActive }) => {
    const p = THEME_PREVIEW[theme.id];
    const c = isDark ? p.dark : p.light;
    const r = theme.shape.radius;
    const rSm = theme.shape.radiusSm;
    const hasBlur = parseInt(theme.surfaces.blur) > 0;
    const opacity = isDark ? 0.04 : 0.03;

    return (
        <div
            className="w-full aspect-[16/10] relative overflow-hidden select-none"
            style={{
                background: c.bg,
                borderRadius: theme.shape.radiusLg,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            }}
        >
            {/* Dot pattern */}
            <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle, ${c.muted} 0.5px, transparent 0.5px)`,
                backgroundSize: '10px 10px', opacity
            }} />

            {/* Ambient glow for glass themes */}
            {hasBlur && (
                <>
                    <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full" style={{
                        background: p.primary, opacity: isDark ? 0.15 : 0.08, filter: 'blur(20px)'
                    }} />
                    <div className="absolute -bottom-4 -right-4 w-14 h-14 rounded-full" style={{
                        background: p.accent, opacity: isDark ? 0.1 : 0.06, filter: 'blur(18px)'
                    }} />
                </>
            )}

            <div className="absolute inset-0 flex p-[6px] gap-[4px]">
                {/* Mini Sidebar */}
                <div className="w-[28%] h-full flex flex-col gap-[3px] p-[4px]" style={{
                    background: hasBlur && isDark ? c.sidebar : c.card,
                    borderRadius: rSm,
                    border: `0.5px solid ${c.border}`,
                    backdropFilter: hasBlur ? `blur(${theme.surfaces.blur})` : 'none',
                    opacity: theme.surfaces.surfaceOpacity,
                }}>
                    {/* Logo */}
                    <div className="flex items-center gap-[3px] mb-[2px]">
                        <div className="w-[8px] h-[8px] rounded-[3px]" style={{ background: p.primary }} />
                        <div className="flex-1 h-[3px] rounded-full" style={{ background: c.muted, opacity: 0.3 }} />
                    </div>
                    {/* Nav items */}
                    {[0.5, 0.7, 0.4, 0.6, 0.3].map((w, i) => (
                        <div key={i} className="flex items-center gap-[3px]" style={{ padding: '1px 2px', borderRadius: rSm, ...(i === 1 ? { background: `${p.primary}18` } : {}) }}>
                            <div className="w-[5px] h-[5px] rounded-[2px]" style={{ background: i === 1 ? p.primary : c.muted, opacity: i === 1 ? 1 : 0.25 }} />
                            <div className="h-[2px] rounded-full" style={{ width: `${w * 100}%`, background: i === 1 ? p.primary : c.muted, opacity: i === 1 ? 0.6 : 0.15 }} />
                        </div>
                    ))}
                    <div className="flex-1" />
                    {/* Footer */}
                    <div className="flex gap-[2px] mt-auto">
                        <div className="w-[6px] h-[6px] rounded-full" style={{ background: c.muted, opacity: 0.15 }} />
                        <div className="flex-1 h-[2.5px] rounded-full my-auto" style={{ background: c.muted, opacity: 0.1 }} />
                    </div>
                </div>

                {/* Mini Content */}
                <div className="flex-1 flex flex-col gap-[3px]">
                    {/* Top bar */}
                    <div className="flex items-center gap-[4px] px-[3px] py-[2px]">
                        <div className="h-[3px] rounded-full" style={{ width: '30%', background: c.text, opacity: 0.7 }} />
                        <div className="ml-auto flex gap-[2px]">
                            <div className="w-[5px] h-[5px] rounded-full" style={{ background: c.muted, opacity: 0.2 }} />
                            <div className="w-[5px] h-[5px] rounded-full" style={{ background: c.muted, opacity: 0.15 }} />
                        </div>
                    </div>

                    {/* Stat cards row */}
                    <div className="grid grid-cols-3 gap-[3px]">
                        {[p.primary, p.accent, `${c.muted}`].map((col, i) => (
                            <div key={i} className="p-[3px] pb-[4px]" style={{
                                background: hasBlur ? c.card : c.card,
                                borderRadius: rSm,
                                border: `0.5px solid ${c.border}`,
                                backdropFilter: hasBlur ? `blur(8px)` : 'none',
                                opacity: theme.surfaces.surfaceOpacity,
                            }}>
                                <div className="h-[2px] w-[60%] rounded-full mb-[2px]" style={{ background: col, opacity: 0.6 }} />
                                <div className="h-[5px] w-full rounded-[2px]" style={{ background: col, opacity: 0.1 }} />
                            </div>
                        ))}
                    </div>

                    {/* Main card */}
                    <div className="flex-1 p-[4px]" style={{
                        background: c.card,
                        borderRadius: r,
                        border: `0.5px solid ${c.border}`,
                        backdropFilter: hasBlur ? `blur(${theme.surfaces.blur})` : 'none',
                        opacity: theme.surfaces.surfaceOpacity,
                    }}>
                        <div className="h-[2.5px] w-[40%] rounded-full mb-[3px]" style={{ background: c.text, opacity: 0.5 }} />
                        <div className="h-[2px] w-[70%] rounded-full mb-[2px]" style={{ background: c.muted, opacity: 0.15 }} />
                        <div className="h-[2px] w-[55%] rounded-full mb-[4px]" style={{ background: c.muted, opacity: 0.12 }} />
                        {/* Mini table rows */}
                        {[0.8, 0.65, 0.75].map((w, i) => (
                            <div key={i} className="flex items-center gap-[3px] py-[1.5px]" style={{ borderBottom: `0.5px solid ${c.border}` }}>
                                <div className="w-[4px] h-[4px] rounded-[1.5px]" style={{ background: c.muted, opacity: 0.15 }} />
                                <div className="h-[2px] rounded-full" style={{ width: `${w * 100}%`, background: c.muted, opacity: 0.12 }} />
                            </div>
                        ))}
                    </div>

                    {/* Bottom action bar */}
                    <div className="flex gap-[3px]">
                        <div className="flex-1 h-[8px] flex items-center justify-center" style={{
                            background: p.primary, borderRadius: rSm, opacity: 0.85,
                        }}>
                            <div className="w-[35%] h-[2px] rounded-full bg-white/60" />
                        </div>
                        <div className="w-[20px] h-[8px]" style={{
                            background: `${c.muted}15`, borderRadius: rSm, border: `0.5px solid ${c.border}`
                        }} />
                    </div>
                </div>
            </div>

            {/* Active checkmark */}
            {isActive && (
                <div className="absolute top-[5px] right-[5px] w-[14px] h-[14px] rounded-full flex items-center justify-center shadow-sm" style={{ background: p.primary }}>
                    <Check size={8} className="text-white" strokeWidth={3} />
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════
   Theme Spec Pills — visual token indicators
   ═══════════════════════════════════════════════════════ */
const SpecPill: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-elevated/40 border border-border/10 text-[9px]">
        <span className="text-muted opacity-60">{icon}</span>
        <span className="font-bold text-muted/70 uppercase tracking-wider">{label}</span>
        <span className="font-black text-main ml-auto">{value}</span>
    </div>
);

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT — AppearanceModal (Advanced Theme Manager)
   ═══════════════════════════════════════════════════════ */
interface AppearanceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AppearanceModal: React.FC<AppearanceModalProps> = ({ isOpen, onClose }) => {
    const { settings, updateSettings } = useAuthStore();
    const isArabic = settings.language === 'ar';
    const isDark = settings.isDarkMode;
    const [hoveredTheme, setHoveredTheme] = useState<AppTheme | null>(null);

    const activeConfig = useMemo(
        () => THEME_LIST.find(t => t.id === settings.theme) || THEME_LIST[0],
        [settings.theme]
    );

    const displayedConfig = useMemo(
        () => (hoveredTheme ? THEME_LIST.find(t => t.id === hoveredTheme) : null) || activeConfig,
        [hoveredTheme, activeConfig]
    );

    const handleThemeSelect = useCallback((id: AppTheme) => {
        updateSettings({ theme: id });
    }, [updateSettings]);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 ${isArabic ? 'rtl' : 'ltr'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
                onClick={onClose}
                style={{ animation: 'fadeIn 200ms ease forwards' }}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden"
                style={{
                    background: `rgb(var(--bg-card))`,
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    borderRadius: 'var(--theme-radius-xl, 28px)',
                    border: '1px solid rgba(var(--border-color), 0.15)',
                    boxShadow: isDark
                        ? '0 40px 120px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.05)'
                        : '0 40px 120px rgba(0,0,0,0.2), 0 0 1px rgba(0,0,0,0.1)',
                    animation: 'scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}
            >
                {/* ── Header ── */}
                <div className="relative shrink-0">
                    {/* Gradient decoration */}
                    <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 'var(--theme-radius-xl, 28px) var(--theme-radius-xl, 28px) 0 0' }}>
                        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${THEME_PREVIEW[settings.theme]?.primary || '#6366f1'}, transparent 70%)` }} />
                        <div className="absolute -top-10 -right-20 w-48 h-48 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${THEME_PREVIEW[settings.theme]?.accent || '#a855f7'}, transparent 70%)` }} />
                    </div>

                    <div className="relative flex items-center justify-between px-6 sm:px-8 py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg text-white" style={{
                                background: `linear-gradient(135deg, ${THEME_PREVIEW[settings.theme]?.primary || '#6366f1'}, ${THEME_PREVIEW[settings.theme]?.accent || '#a855f7'})`,
                                boxShadow: `0 8px 24px ${THEME_PREVIEW[settings.theme]?.primary || '#6366f1'}40`,
                            }}>
                                <Palette size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-main tracking-tight leading-tight">
                                    {isArabic ? 'مدير المظهر' : 'Theme Manager'}
                                </h2>
                                <p className="text-[11px] font-semibold text-muted mt-0.5">
                                    {isArabic ? 'اختر شخصية واجهة النظام' : 'Choose your interface personality'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-main hover:bg-elevated/60 border border-border/15 transition-all hover:scale-105 active:scale-95"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="relative flex-1 overflow-y-auto px-6 sm:px-8 pb-6 custom-scrollbar">

                    {/* Quick Settings Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                        {/* Dark/Light Toggle */}
                        <div className="p-1 rounded-2xl border border-border/15 flex relative" style={{ background: 'rgba(var(--bg-elevated), 0.3)' }}>
                            <button
                                onClick={() => updateSettings({ isDarkMode: false })}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all relative z-10 ${!isDark ? 'text-primary' : 'text-muted hover:text-main'}`}
                            >
                                <Sun size={14} />
                                {isArabic ? 'فاتح' : 'Light'}
                            </button>
                            <button
                                onClick={() => updateSettings({ isDarkMode: true })}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all relative z-10 ${isDark ? 'text-primary' : 'text-muted hover:text-main'}`}
                            >
                                <Moon size={14} />
                                {isArabic ? 'داكن' : 'Dark'}
                            </button>
                            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl shadow-md border border-border/30 transition-all duration-300 z-0 ${isDark ? (isArabic ? 'left-1' : 'left-[calc(50%+2px)]') : (isArabic ? 'right-1' : 'left-1')}`} style={{ background: 'rgba(var(--bg-card), 1)' }} />
                        </div>

                        {/* Touch Mode */}
                        <button
                            onClick={() => updateSettings({ isTouchMode: !settings.isTouchMode })}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border transition-all ${settings.isTouchMode ? 'bg-amber-500/10 border-amber-500/25' : 'border-border/15 hover:bg-elevated/40'}`}
                            style={{ background: settings.isTouchMode ? undefined : 'rgba(var(--bg-elevated), 0.3)' }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${settings.isTouchMode ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-elevated/50 text-muted border border-border/20'}`}>
                                    {settings.isTouchMode ? <Hand size={14} /> : <MonitorSmartphone size={14} />}
                                </div>
                                <div className="text-start">
                                    <div className={`text-xs font-bold ${settings.isTouchMode ? 'text-amber-600 dark:text-amber-400' : 'text-main'}`}>
                                        {isArabic ? 'وضع اللمس' : 'Touch Mode'}
                                    </div>
                                </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${settings.isTouchMode ? 'bg-amber-500' : 'bg-border/40'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${settings.isTouchMode ? (isArabic ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                            </div>
                        </button>

                        {/* Language */}
                        <button
                            onClick={() => updateSettings({ language: settings.language === 'en' ? 'ar' : 'en' })}
                            className="flex items-center justify-between px-4 py-2.5 rounded-2xl border border-border/15 hover:bg-elevated/40 transition-all"
                            style={{ background: 'rgba(var(--bg-elevated), 0.3)' }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-elevated/50 border border-border/20 text-primary flex items-center justify-center">
                                    <Languages size={14} />
                                </div>
                                <div className="text-start">
                                    <div className="text-xs font-bold text-main">{isArabic ? 'اللغة' : 'Language'}</div>
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted px-2 py-0.5 rounded-md bg-elevated/50">{isArabic ? 'العربية' : 'English'}</span>
                        </button>
                    </div>

                    {/* Section Title */}
                    <div className="flex items-center gap-3 mb-5">
                        <h3 className="text-base font-black text-main">{isArabic ? 'معرض الثيمات' : 'Theme Gallery'}</h3>
                        <div className="h-px flex-1 bg-border/15" />
                        <span className="text-[9px] font-bold text-muted/60 uppercase tracking-widest">{THEME_LIST.length} {isArabic ? 'شخصيات' : 'Personalities'}</span>
                    </div>

                    {/* Theme Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {THEME_LIST.map(th => {
                            const isActive = settings.theme === th.id;
                            const preview = THEME_PREVIEW[th.id];

                            return (
                                <button
                                    key={th.id}
                                    onClick={() => handleThemeSelect(th.id)}
                                    onMouseEnter={() => setHoveredTheme(th.id)}
                                    onMouseLeave={() => setHoveredTheme(null)}
                                    className={`group relative flex flex-col text-start rounded-[22px] border-2 p-1.5 transition-all duration-300 focus:outline-none
                                        ${isActive
                                            ? 'border-primary shadow-[0_0_0_3px_rgba(var(--primary),0.12)] scale-[1.01]'
                                            : 'border-transparent hover:border-border/30 hover:scale-[1.005]'
                                        }`}
                                    style={{
                                        background: isActive ? `rgba(var(--primary), 0.04)` : 'transparent',
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <ThemeThumbnail theme={th} isDark={isDark} isActive={isActive} />

                                    {/* Info */}
                                    <div className="px-2 pt-2.5 pb-2 w-full">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: preview.primary }} />
                                            <h4 className={`text-sm font-black tracking-tight ${isActive ? 'text-primary' : 'text-main'}`}>
                                                {th.name}
                                            </h4>
                                            {isActive && (
                                                <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                                                    {isArabic ? 'نشط' : 'Active'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-semibold text-muted mb-2.5 leading-tight">{th.description}</p>

                                        {/* Token Pills */}
                                        <div className="flex flex-wrap gap-1">
                                            <span className="px-1.5 py-[1px] rounded text-[8px] font-black uppercase tracking-wider bg-elevated/50 text-muted/70" title="Radius">
                                                ◉ {th.shape.radius}
                                            </span>
                                            <span className="px-1.5 py-[1px] rounded text-[8px] font-black uppercase tracking-wider bg-elevated/50 text-muted/70" title="Blur">
                                                ◎ {th.surfaces.blur}
                                            </span>
                                            <span className="px-1.5 py-[1px] rounded text-[8px] font-black uppercase tracking-wider bg-elevated/50 text-muted/70" title="Motion">
                                                {MOTION_ICON[th.motion.style] || '○'} {th.motion.style}
                                            </span>
                                            <span className="px-1.5 py-[1px] rounded text-[8px] font-black uppercase tracking-wider bg-elevated/50 text-muted/70" title="Density">
                                                ▣ {th.layout.density}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Wallpaper Section ── */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-base font-black text-main">{isArabic ? 'خلفية المساحة' : 'Workspace Wallpaper'}</h3>
                            <div className="h-px flex-1 bg-border/15" />
                            <span className="text-[9px] font-bold text-muted/60 uppercase tracking-widest">{isArabic ? 'خلفية' : 'Background'}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
                            {/* None option */}
                            <button
                                onClick={() => updateSettings({ wallpaper: 'none' })}
                                className={`relative aspect-[16/10] rounded-2xl border-2 transition-all duration-200 flex items-center justify-center ${(!settings.wallpaper || settings.wallpaper === 'none')
                                        ? 'border-primary shadow-[0_0_0_3px_rgba(var(--primary),0.12)] ring-1 ring-primary/20'
                                        : 'border-border/20 hover:border-border/40 hover:scale-[1.02]'
                                    }`}
                                style={{ background: 'rgba(var(--bg-elevated), 0.4)' }}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <X size={18} className="text-muted" />
                                    <span className="text-[8px] font-black text-muted uppercase tracking-wider">
                                        {isArabic ? 'بدون' : 'None'}
                                    </span>
                                </div>
                                {(!settings.wallpaper || settings.wallpaper === 'none') && (
                                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: `rgb(var(--primary))` }}>
                                        <Check size={8} className="text-white" strokeWidth={3} />
                                    </div>
                                )}
                            </button>

                            {/* Image wallpapers */}
                            {[
                                { key: 'aurora', label: isArabic ? 'شفق' : 'Aurora' },
                                { key: 'mesh', label: isArabic ? 'شبكة' : 'Mesh' },
                                { key: 'waves', label: isArabic ? 'أمواج' : 'Waves' },
                                { key: 'geometric', label: isArabic ? 'هندسي' : 'Geo' },
                                { key: 'nebula', label: isArabic ? 'سديم' : 'Nebula' },
                                { key: 'topography', label: isArabic ? 'طبو' : 'Topo' },
                            ].map(wp => {
                                const isActive = settings.wallpaper === wp.key;
                                return (
                                    <button
                                        key={wp.key}
                                        onClick={() => updateSettings({ wallpaper: wp.key, wallpaperOpacity: settings.wallpaperOpacity || 0.12 })}
                                        className={`relative aspect-[16/10] rounded-2xl border-2 overflow-hidden transition-all duration-200 group ${isActive
                                                ? 'border-primary shadow-[0_0_0_3px_rgba(var(--primary),0.12)] scale-[1.02] ring-1 ring-primary/20'
                                                : 'border-border/20 hover:border-border/40 hover:scale-[1.02]'
                                            }`}
                                    >
                                        {/* Image thumbnail */}
                                        <img
                                            src={`/wallpapers/${wp.key}.png`}
                                            alt={wp.label}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        {/* Label overlay */}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent pt-4 pb-1.5 px-2">
                                            <span className="text-[8px] font-black text-white uppercase tracking-wider">
                                                {wp.label}
                                            </span>
                                        </div>
                                        {isActive && (
                                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center shadow-lg" style={{ background: `rgb(var(--primary))` }}>
                                                <Check size={8} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Opacity slider — only show when a wallpaper is selected */}
                        {settings.wallpaper && settings.wallpaper !== 'none' && (
                            <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border/15" style={{ background: 'rgba(var(--bg-elevated), 0.3)' }}>
                                <span className="text-[10px] font-black text-muted uppercase tracking-wider whitespace-nowrap">
                                    {isArabic ? 'الشفافية' : 'Intensity'}
                                </span>
                                <input
                                    type="range"
                                    min="0.05"
                                    max="0.35"
                                    step="0.01"
                                    value={settings.wallpaperOpacity ?? 0.12}
                                    onChange={e => updateSettings({ wallpaperOpacity: parseFloat(e.target.value) })}
                                    className="flex-1 h-1.5 appearance-none rounded-full cursor-pointer accent-[rgb(var(--primary))]"
                                    style={{
                                        background: `linear-gradient(to right, rgb(var(--primary)) 0%, rgb(var(--primary)) ${((settings.wallpaperOpacity ?? 0.12) - 0.05) / 0.30 * 100}%, rgba(var(--border-color), 0.3) ${((settings.wallpaperOpacity ?? 0.12) - 0.05) / 0.30 * 100}%, rgba(var(--border-color), 0.3) 100%)`,
                                        borderRadius: '8px',
                                    }}
                                />
                                <span className="text-[10px] font-black text-primary tabular-nums min-w-[32px] text-center">
                                    {Math.round((settings.wallpaperOpacity ?? 0.12) * 100)}%
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── Active Theme Details Panel ── */}
                    <div className="rounded-2xl border border-border/15 overflow-hidden" style={{ background: 'rgba(var(--bg-elevated), 0.25)' }}>
                        <div className="flex items-center gap-3 px-5 py-3 border-b border-border/10">
                            <Eye size={14} className="text-primary" />
                            <span className="text-xs font-black text-main uppercase tracking-wider">
                                {isArabic ? 'تفاصيل الثيم الحالي' : `${displayedConfig.name} Personality Specs`}
                            </span>
                            {hoveredTheme && hoveredTheme !== settings.theme && (
                                <span className="text-[9px] font-bold text-muted bg-elevated/50 px-2 py-0.5 rounded-full ml-auto uppercase tracking-widest">{isArabic ? 'معاينة' : 'Preview'}</span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-4">
                            <SpecPill icon={<Box size={10} />} label={isArabic ? 'استدارة' : 'Radius'} value={displayedConfig.shape.radius} />
                            <SpecPill icon={<Layers size={10} />} label={isArabic ? 'تمويه' : 'Blur'} value={displayedConfig.surfaces.blur} />
                            <SpecPill icon={<Eye size={10} />} label={isArabic ? 'شفافية' : 'Opacity'} value={`${Math.round(displayedConfig.surfaces.surfaceOpacity * 100)}%`} />
                            <SpecPill icon={<Zap size={10} />} label={isArabic ? 'حركة' : 'Motion'} value={displayedConfig.motion.style} />
                            <SpecPill icon={<Gauge size={10} />} label={isArabic ? 'سرعة' : 'Speed'} value={displayedConfig.motion.duration} />
                            <SpecPill icon={<Type size={10} />} label={isArabic ? 'سُمك' : 'Weight'} value={String(displayedConfig.typography.fontWeight)} />
                            <SpecPill icon={<LayoutGrid size={10} />} label={isArabic ? 'كثافة' : 'Density'} value={displayedConfig.layout.density} />
                            <SpecPill icon={<Grip size={10} />} label={isArabic ? 'أزرار' : 'Buttons'} value={displayedConfig.components.button.variant} />
                            <SpecPill icon={<Layers size={10} />} label={isArabic ? 'بطاقات' : 'Cards'} value={displayedConfig.components.card.variant} />
                            <SpecPill icon={<Move size={10} />} label={isArabic ? 'شريط' : 'Sidebar'} value={displayedConfig.components.sidebar.variant} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppearanceModal;
