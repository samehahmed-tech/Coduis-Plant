import type { ThemeConfig } from '../tokens';

export const tilesTheme: ThemeConfig = {
    id: 'tiles',
    name: 'Tiles',
    description: 'Sharp & minimal — Clean grey, GitHub-inspired flat',
    tags: ['Flat', 'Minimal'],
    shape: {
        radius: '4px',
        radiusSm: '2px',
        radiusLg: '6px',
        radiusXl: '8px',
    },
    surfaces: {
        blur: '0px',
        surfaceOpacity: 1,
        borderWidth: '2px',
        borderOpacity: 0.2,
    },
    shadows: {
        card: '0 2px 0 rgba(0,0,0,0.04)',
        hover: '0 4px 0 rgba(14,165,233,0.15), 0 2px 8px rgba(0,0,0,0.06)',
        elevated: '0 6px 0 rgba(14,165,233,0.1), 0 4px 16px rgba(0,0,0,0.08)',
    },
    motion: {
        style: 'crisp',
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
        duration: '150ms',
        durationSlow: '250ms',
    },
    typography: {
        fontWeight: 600,
        headingWeight: 900,
        letterSpacing: '0.01em',
    },
    spacing: {
        unit: '0.875rem',
        density: 0.85,
        gap: '0.5rem',
        sectionGap: '1rem',
    },
    components: {
        button: { variant: 'tile', height: '2.25rem', padding: '0.5rem 1rem' },
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
