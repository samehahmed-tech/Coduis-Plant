import type { ThemeConfig } from '../tokens';

export const glassyTheme: ThemeConfig = {
    id: 'glassy',
    name: 'Glassy',
    description: 'Frosted glass — Soft blue, Apple-inspired translucency',
    tags: ['Frosted', 'Elegant'],
    shape: {
        radius: '20px',
        radiusSm: '12px',
        radiusLg: '28px',
        radiusXl: '36px',
    },
    surfaces: {
        blur: '40px',
        surfaceOpacity: 0.55,
        borderWidth: '1px',
        borderOpacity: 0.15,
    },
    shadows: {
        card: '0 4px 24px rgba(139,92,246,0.06), 0 1px 4px rgba(0,0,0,0.03)',
        hover: '0 8px 32px rgba(139,92,246,0.12)',
        elevated: '0 16px 48px rgba(139,92,246,0.15)',
    },
    motion: {
        style: 'springy',
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        duration: '250ms',
        durationSlow: '400ms',
    },
    typography: {
        fontWeight: 400,
        headingWeight: 700,
        letterSpacing: '0em',
    },
    spacing: {
        unit: '1.1rem',
        density: 1.05,
        gap: '0.875rem',
        sectionGap: '1.75rem',
    },
    components: {
        button: { variant: 'glass', height: '2.625rem', padding: '0.625rem 1.5rem' },
        card: { variant: 'glass' },
        sidebar: { variant: 'blurred', width: '260px', collapsedWidth: '72px' },
        table: { density: 'comfortable', rowHeight: '3.125rem' },
        input: { variant: 'glass', height: '2.625rem' },
        modal: { variant: 'floating' },
    },
    layout: {
        sidebarStyle: 'blurred',
        cardStyle: 'glass',
        density: 'normal',
        containerPadding: '1.75rem',
    },
};
