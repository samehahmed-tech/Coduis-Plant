import type { ThemeConfig } from '../tokens';

export const acrylicTheme: ThemeConfig = {
    id: 'acrylic',
    name: 'Acrylic',
    description: 'Translucent — Teal accent, macOS-inspired blur',
    tags: ['macOS', 'Translucent'],
    shape: {
        radius: '16px',
        radiusSm: '8px',
        radiusLg: '22px',
        radiusXl: '30px',
    },
    surfaces: {
        blur: '48px',
        surfaceOpacity: 0.5,
        borderWidth: '1px',
        borderOpacity: 0.1,
    },
    shadows: {
        card: '0 4px 20px rgba(6,182,212,0.05), 0 1px 6px rgba(0,0,0,0.03)',
        hover: '0 8px 28px rgba(6,182,212,0.1), 0 2px 8px rgba(0,0,0,0.04)',
        elevated: '0 16px 40px rgba(6,182,212,0.12), 0 4px 16px rgba(0,0,0,0.06)',
    },
    motion: {
        style: 'ease-out',
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        duration: '240ms',
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
