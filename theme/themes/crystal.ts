import type { ThemeConfig } from '../tokens';

export const crystalTheme: ThemeConfig = {
    id: 'crystal',
    name: 'Crystal Clean',
    description: 'Ultra clean minimalist design with sky blue accents',
    tags: ['Minimalist', 'Clean', 'Mac'],
    shape: {
        radius: '12px',
        radiusSm: '6px',
        radiusLg: '16px',
        radiusXl: '24px',
    },
    surfaces: {
        blur: '16px',
        surfaceOpacity: 0.9,
        borderWidth: '1px',
        borderOpacity: 0.8,
    },
    shadows: {
        card: 'none',
        hover: '0 10px 25px rgba(0,0,0,0.02)',
        elevated: '0 20px 40px rgba(0,0,0,0.04)',
    },
    motion: {
        style: 'smooth',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        duration: '250ms',
        durationSlow: '400ms',
    },
    typography: {
        fontWeight: 400,
        headingWeight: 500,
        letterSpacing: '0.01em',
    },
    spacing: {
        unit: '1.25rem',
        density: 1.1,
        gap: '1.25rem',
        sectionGap: '2rem',
    },
    components: {
        button: { variant: 'soft', height: '2.75rem', padding: '0.75rem 1.5rem' },
        card: { variant: 'glass' },
        sidebar: { variant: 'floating', width: '260px', collapsedWidth: '70px' },
        table: { density: 'comfortable', rowHeight: '3.5rem' },
        input: { variant: 'filled', height: '2.75rem' },
        modal: { variant: 'centered' },
    },
    layout: {
        sidebarStyle: 'floating',
        cardStyle: 'glass',
        density: 'spacious',
        containerPadding: '2rem',
    },
};
