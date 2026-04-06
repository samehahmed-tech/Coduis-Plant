// ═══════════════════════════════════════════════════════════════════
//  ThemeProvider — React context that hydrates CSS variables from
//  the active ThemeConfig and exposes it to the component tree.
// ═══════════════════════════════════════════════════════════════════

import React, { createContext, useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { THEME_REGISTRY, type ThemeConfig } from './tokens';
import type { AppTheme } from '../types';
import windows11ThemeUrl from '../styles/themes/windows11.css?url';
import fluent2ThemeUrl from '../styles/themes/fluent2.css?url';
import crystalThemeUrl from '../styles/themes/crystal.css?url';
import officeTouchThemeUrl from '../styles/themes/office-touch.css?url';
import modernThemeUrl from '../styles/themes/modern.css?url';
import glassThemeUrl from '../styles/themes/glass.css?url';

/* ── Context shape ── */
export interface ThemeContextValue {
    /** Current theme id */
    theme: AppTheme;
    /** Full resolved theme config */
    config: ThemeConfig;
    /** Whether dark mode is active */
    isDark: boolean;
    /** Switch to a different theme */
    setTheme: (theme: AppTheme) => void;
    /** Toggle dark mode */
    toggleDark: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STYLESHEET_ID = 'restoflow-theme-stylesheet';

const THEME_STYLESHEET_URLS: Record<AppTheme, string> = {
    'windows11': windows11ThemeUrl,
    'fluent2': fluent2ThemeUrl,
    'crystal': crystalThemeUrl,
    'office-touch': officeTouchThemeUrl,
    'modern': modernThemeUrl,
    'glass': glassThemeUrl,
};

/* ── CSS variable injection ── */
function applyThemeCSSVariables(config: ThemeConfig) {
    const root = document.documentElement;

    // Component morphing tokens — these extend the existing per-theme CSS
    root.style.setProperty('--theme-spacing-unit', config.spacing.unit);
    root.style.setProperty('--theme-density', String(config.spacing.density));
    root.style.setProperty('--theme-gap', config.spacing.gap);
    root.style.setProperty('--theme-section-gap', config.spacing.sectionGap);
    root.style.setProperty('--theme-container-padding', config.layout.containerPadding);

    // Button morphing
    root.style.setProperty('--theme-button-height', config.components.button.height);
    root.style.setProperty('--theme-button-padding', config.components.button.padding);
    root.style.setProperty('--theme-button-variant', config.components.button.variant);

    // Card / Sidebar / Table / Input
    root.style.setProperty('--theme-card-variant', config.components.card.variant);
    root.style.setProperty('--theme-sidebar-variant', config.components.sidebar.variant);
    root.style.setProperty('--theme-sidebar-width', config.components.sidebar.width);
    root.style.setProperty('--theme-sidebar-collapsed-width', config.components.sidebar.collapsedWidth);
    root.style.setProperty('--theme-table-row-height', config.components.table.rowHeight);
    root.style.setProperty('--theme-input-height', config.components.input.height);
    root.style.setProperty('--theme-input-variant', config.components.input.variant);
    root.style.setProperty('--theme-modal-variant', config.components.modal.variant);

    // Layout density
    root.style.setProperty('--theme-layout-density', config.layout.density);
}

/* ── Provider ── */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const settings = useAuthStore((s) => s.settings);
    const updateSettings = useAuthStore((s) => s.updateSettings);

    const themeId = settings.theme || 'modern';
    const isDark = settings.isDarkMode;
    const config = THEME_REGISTRY[themeId] ?? THEME_REGISTRY.modern;

    // Apply data-theme attribute + dark class + CSS variables
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        root.setAttribute('data-theme', themeId);
        body.setAttribute('data-theme', themeId);

        if (isDark) {
            root.classList.add('dark');
            body.classList.add('dark');
        } else {
            root.classList.remove('dark');
            body.classList.remove('dark');
        }

        // Language / RTL
        if (settings.language === 'ar') {
            root.setAttribute('dir', 'rtl');
            root.lang = 'ar';
        } else {
            root.setAttribute('dir', 'ltr');
            root.lang = 'en';
        }

        // Inject component-morphing CSS variables
        applyThemeCSSVariables(config);

        // Wallpaper engine
        const shell = document.querySelector('.workspace-shell') as HTMLElement | null;
        if (shell) {
            const wp = settings.wallpaper || 'none';
            const wpOpacity = settings.wallpaperOpacity ?? 0.06;
            if (wp && wp !== 'none') {
                shell.setAttribute('data-wallpaper', wp);
                shell.style.setProperty('--wallpaper-opacity', String(wpOpacity));
            } else {
                shell.removeAttribute('data-wallpaper');
                shell.style.setProperty('--wallpaper-opacity', '0');
            }
        }
    }, [themeId, isDark, config, settings.language, settings.wallpaper, settings.wallpaperOpacity]);

    useEffect(() => {
        const href = THEME_STYLESHEET_URLS[themeId] || THEME_STYLESHEET_URLS.windows11;
        let link = document.getElementById(THEME_STYLESHEET_ID) as HTMLLinkElement | null;

        if (!link) {
            link = document.createElement('link');
            link.id = THEME_STYLESHEET_ID;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        if (link.getAttribute('href') !== href) {
            link.setAttribute('href', href);
        }
    }, [themeId]);

    const value = useMemo<ThemeContextValue>(
        () => ({
            theme: themeId,
            config,
            isDark,
            setTheme: (t: AppTheme) => updateSettings({ theme: t }),
            toggleDark: () => updateSettings({ isDarkMode: !isDark }),
        }),
        [themeId, config, isDark, updateSettings],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
