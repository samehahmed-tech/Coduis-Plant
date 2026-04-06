import type { ThemeConfig } from '../tokens';

export const modernTheme: ThemeConfig = {
    id: 'modern',
    name: 'Modern Bold',
    description: 'Telerik inspired modern UI with large shadows and bold typography',
    tags: ['Modern', 'Bold', 'Contrast'],
    shape: {
        radius: '12px',
        radiusSm: '6px',
        radiusLg: '16px',
        radiusXl: '20px',
    },
    surfaces: {
        blur: '0px',
        surfaceOpacity: 1,
        borderWidth: '0px',
        borderOpacity: 0,
    },
    shadows: {
        card: '0 4px 20px rgba(0,0,0,0.05)',
        hover: '0 10px 40px rgba(0,0,0,0.08)',
        elevated: '0 20px 60px rgba(0,0,0,0.12)',
    },
    motion: {
        style: 'springy',
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        duration: '300ms',
        durationSlow: '450ms',
    },
    typography: {
        fontWeight: 500,
        headingWeight: 800,
        letterSpacing: '-0.02em',
    },
    spacing: {
        unit: '1rem',
        density: 1,
        gap: '1rem',
        sectionGap: '2rem',
    },
    components: {
        button: { variant: 'solid', height: '3rem', padding: '0.75rem 1.5rem' },
        card: { variant: 'elevated' },
        sidebar: { variant: 'solid', width: '260px', collapsedWidth: '80px' },
        table: { density: 'comfortable', rowHeight: '3.5rem' },
        input: { variant: 'filled', height: '3rem' },
        modal: { variant: 'centered' },
    },
    layout: {
        sidebarStyle: 'solid',
        cardStyle: 'elevated',
        density: 'normal',
        containerPadding: '2rem',
    },
};
