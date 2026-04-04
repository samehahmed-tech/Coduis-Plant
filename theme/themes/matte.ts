import type { ThemeConfig } from '../tokens';

export const matteTheme: ThemeConfig = {
    id: 'matte',
    name: 'Matte',
    description: 'Developer — Cool slate, Linear-inspired focus',
    tags: ['Developer', 'Focused'],
    shape: {
        radius: '6px',
        radiusSm: '3px',
        radiusLg: '8px',
        radiusXl: '12px',
    },
    surfaces: {
        blur: '0px',
        surfaceOpacity: 1,
        borderWidth: '1px',
        borderOpacity: 0.18,
    },
    shadows: {
        card: 'none',
        hover: '0 0 0 1px rgba(120,113,108,0.2)',
        elevated: '0 1px 2px rgba(0,0,0,0.06)',
    },
    motion: {
        style: 'instant',
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        duration: '100ms',
        durationSlow: '180ms',
    },
    typography: {
        fontWeight: 600,
        headingWeight: 900,
        letterSpacing: '0.02em',
    },
    spacing: {
        unit: '0.875rem',
        density: 0.9,
        gap: '0.5rem',
        sectionGap: '1.25rem',
    },
    components: {
        button: { variant: 'solid', height: '2.25rem', padding: '0.5rem 1rem' },
        card: { variant: 'flat' },
        sidebar: { variant: 'solid', width: '240px', collapsedWidth: '64px' },
        table: { density: 'dense', rowHeight: '2.5rem' },
        input: { variant: 'outline', height: '2.25rem' },
        modal: { variant: 'centered' },
    },
    layout: {
        sidebarStyle: 'solid',
        cardStyle: 'flat',
        density: 'compact',
        containerPadding: '1rem',
    },
};
