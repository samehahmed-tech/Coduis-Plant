// ═══════════════════════════════════════════════════════════════════
//  THEME ENGINE — Design Token Type System
//  Every theme implements this contract to produce a full UI personality
// ═══════════════════════════════════════════════════════════════════

import type { AppTheme } from '../types';

/* ── Shape Tokens ── */
export interface ShapeTokens {
    radius: string;       // e.g. '14px'
    radiusSm: string;
    radiusLg: string;
    radiusXl: string;
}

/* ── Surface Tokens ── */
export interface SurfaceTokens {
    blur: string;         // e.g. '12px'
    surfaceOpacity: number; // 0–1
    borderWidth: string;
    borderOpacity: number;
}

/* ── Shadow Tokens ── */
export interface ShadowTokens {
    card: string;
    hover: string;
    elevated: string;
}

/* ── Motion / Animation Tokens ── */
export type MotionStyle = 'smooth' | 'springy' | 'crisp' | 'decelerate' | 'elastic' | 'instant' | 'bouncy' | 'ease-out';

export interface MotionTokens {
    style: MotionStyle;
    easing: string;       // CSS cubic-bezier
    duration: string;     // e.g. '200ms'
    durationSlow: string;
}

/* ── Typography Tokens ── */
export interface TypographyTokens {
    fontWeight: number;
    headingWeight: number;
    letterSpacing: string;
}

/* ── Spacing / Density ── */
export interface SpacingTokens {
    unit: string;         // base spacing unit e.g. '1rem'
    density: number;      // multiplier: 0.85 = compact, 1 = normal, 1.2 = spacious
    gap: string;          // standard gap between elements
    sectionGap: string;   // gap between major sections
}

/* ── Component Variant Tokens ── */
export type ButtonVariant = 'soft' | 'glass' | 'solid' | 'tile';
export type CardVariant = 'elevated' | 'glass' | 'flat';
export type SidebarVariant = 'solid' | 'floating' | 'blurred';
export type TableDensity = 'dense' | 'comfortable';
export type InputVariant = 'outline' | 'filled' | 'glass';
export type ModalVariant = 'centered' | 'sheet' | 'floating';

export interface ComponentTokens {
    button: {
        variant: ButtonVariant;
        height: string;
        padding: string;
    };
    card: {
        variant: CardVariant;
    };
    sidebar: {
        variant: SidebarVariant;
        width: string;
        collapsedWidth: string;
    };
    table: {
        density: TableDensity;
        rowHeight: string;
    };
    input: {
        variant: InputVariant;
        height: string;
    };
    modal: {
        variant: ModalVariant;
    };
}

/* ── Layout Tokens ── */
export interface LayoutTokens {
    sidebarStyle: SidebarVariant;
    cardStyle: CardVariant;
    density: 'compact' | 'normal' | 'spacious';
    containerPadding: string;
}

/* ═══════════════════════════════════════════════
   Master Theme Config — full UI personality
   ═══════════════════════════════════════════════ */
export interface ThemeConfig {
    id: AppTheme;
    name: string;
    description: string;
    tags: string[];
    shape: ShapeTokens;
    surfaces: SurfaceTokens;
    shadows: ShadowTokens;
    motion: MotionTokens;
    typography: TypographyTokens;
    spacing: SpacingTokens;
    components: ComponentTokens;
    layout: LayoutTokens;
}

/* ── Theme Registry ── */
import { modernTheme } from './themes/modern';
import { glassyTheme } from './themes/glassy';
import { tilesTheme } from './themes/tiles';
import { fluentTheme } from './themes/fluent';
import { crystalTheme } from './themes/crystal';
import { matteTheme } from './themes/matte';
import { touchTheme } from './themes/touch';
import { acrylicTheme } from './themes/acrylic';

export const THEME_REGISTRY: Record<AppTheme, ThemeConfig> = {
    modern: modernTheme,
    glassy: glassyTheme,
    tiles: tilesTheme,
    fluent: fluentTheme,
    crystal: crystalTheme,
    matte: matteTheme,
    touch_ui: touchTheme,
    acrylic: acrylicTheme,
};

export const THEME_LIST: ThemeConfig[] = Object.values(THEME_REGISTRY);
