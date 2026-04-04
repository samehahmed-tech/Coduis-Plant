import type { ThemeConfig } from '../tokens';

export const touchTheme: ThemeConfig = {
    id: 'touch_ui',
    name: 'Touch',
    description: 'Friendly & warm — Coral accents, big targets, bouncy',
    tags: ['Friendly', 'Warm'],
    shape: {
        radius: '16px',
        radiusSm: '10px',
        radiusLg: '22px',
        radiusXl: '30px',
    },
    surfaces: {
        blur: '8px',
        surfaceOpacity: 0.92,
        borderWidth: '1px',
        borderOpacity: 0.1,
    },
    shadows: {
        card: '0 2px 8px rgba(249,115,22,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        hover: '0 6px 20px rgba(249,115,22,0.12), 0 2px 6px rgba(0,0,0,0.04)',
        elevated: '0 12px 32px rgba(249,115,22,0.15), 0 4px 12px rgba(0,0,0,0.06)',
    },
    motion: {
        style: 'bouncy',
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        duration: '220ms',
        durationSlow: '380ms',
    },
    typography: {
        fontWeight: 700,
        headingWeight: 900,
        letterSpacing: '-0.01em',
    },
    spacing: {
        unit: '1.25rem',
        density: 1.2,
        gap: '1rem',
        sectionGap: '2rem',
    },
    components: {
        button: { variant: 'solid', height: '3.25rem', padding: '0.875rem 1.75rem' },
        card: { variant: 'elevated' },
        sidebar: { variant: 'solid', width: '270px', collapsedWidth: '80px' },
        table: { density: 'comfortable', rowHeight: '3.5rem' },
        input: { variant: 'filled', height: '3rem' },
        modal: { variant: 'sheet' },
    },
    layout: {
        sidebarStyle: 'solid',
        cardStyle: 'elevated',
        density: 'spacious',
        containerPadding: '2rem',
    },
};
