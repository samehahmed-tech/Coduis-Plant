import type { ThemeConfig } from '../tokens';

export const fluentTheme: ThemeConfig = {
    id: 'fluent',
    name: 'Fluent',
    description: 'Warm & calm — Cream neutrals, Notion-inspired serenity',
    tags: ['Warm', 'Calm'],
    shape: {
        radius: '8px',
        radiusSm: '4px',
        radiusLg: '12px',
        radiusXl: '16px',
    },
    surfaces: {
        blur: '16px',
        surfaceOpacity: 0.88,
        borderWidth: '1px',
        borderOpacity: 0.08,
    },
    shadows: {
        card: '0 1.6px 3.6px rgba(0,0,0,0.03), 0 0.3px 0.9px rgba(0,0,0,0.02)',
        hover: '0 3.2px 7.2px rgba(0,0,0,0.06), 0 0.6px 1.8px rgba(0,0,0,0.04)',
        elevated: '0 6.4px 14.4px rgba(0,0,0,0.07), 0 1.2px 3.6px rgba(0,0,0,0.04)',
    },
    motion: {
        style: 'decelerate',
        easing: 'cubic-bezier(0, 0, 0, 1)',
        duration: '167ms',
        durationSlow: '300ms',
    },
    typography: {
        fontWeight: 500,
        headingWeight: 700,
        letterSpacing: '0em',
    },
    spacing: {
        unit: '1rem',
        density: 1,
        gap: '0.75rem',
        sectionGap: '1.5rem',
    },
    components: {
        button: { variant: 'solid', height: '2.5rem', padding: '0.625rem 1.25rem' },
        card: { variant: 'elevated' },
        sidebar: { variant: 'blurred', width: '250px', collapsedWidth: '72px' },
        table: { density: 'comfortable', rowHeight: '3rem' },
        input: { variant: 'filled', height: '2.5rem' },
        modal: { variant: 'centered' },
    },
    layout: {
        sidebarStyle: 'blurred',
        cardStyle: 'elevated',
        density: 'normal',
        containerPadding: '1.5rem',
    },
};
