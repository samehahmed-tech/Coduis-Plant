import type { ThemeConfig } from '../tokens';

export const glassTheme: ThemeConfig = {
    id: 'glass',
    name: 'Vibrant Glass',
    description: 'Deep glassmorphism perfect for dark mode dashboards',
    tags: ['Glass', 'Blur', 'Premium'],
    shape: {
        radius: '20px',
        radiusSm: '10px',
        radiusLg: '30px',
        radiusXl: '40px',
    },
    surfaces: {
        blur: '40px',
        surfaceOpacity: 0.4,
        borderWidth: '1px',
        borderOpacity: 1,
    },
    shadows: {
        card: '0 8px 32px rgba(31, 38, 135, 0.07)',
        hover: '0 8px 32px rgba(31, 38, 135, 0.15)',
        elevated: '0 8px 32px rgba(31, 38, 135, 0.2)',
    },
    motion: {
        style: 'smooth',
        easing: 'ease-out',
        duration: '300ms',
        durationSlow: '500ms',
    },
    typography: {
        fontWeight: 500,
        headingWeight: 700,
        letterSpacing: '0em',
    },
    spacing: {
        unit: '1.25rem',
        density: 1.1,
        gap: '1.5rem',
        sectionGap: '2.5rem',
    },
    components: {
        button: { variant: 'glass', height: '3rem', padding: '0.75rem 1.75rem' },
        card: { variant: 'glass' },
        sidebar: { variant: 'blurred', width: '270px', collapsedWidth: '80px' },
        table: { density: 'comfortable', rowHeight: '3.5rem' },
        input: { variant: 'glass', height: '3rem' },
        modal: { variant: 'floating' },
    },
    layout: {
        sidebarStyle: 'blurred',
        cardStyle: 'glass',
        density: 'spacious',
        containerPadding: '2.5rem',
    },
};
