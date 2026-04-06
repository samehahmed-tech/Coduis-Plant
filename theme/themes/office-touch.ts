import type { ThemeConfig } from '../tokens';

export const officeTouchTheme: ThemeConfig = {
    id: 'office-touch',
    name: 'Office Touch',
    description: 'Telerik-style flat design with massive tap targets',
    tags: ['Flat', 'Touch', 'POS'],
    shape: {
        radius: '0px',
        radiusSm: '0px',
        radiusLg: '2px',
        radiusXl: '4px',
    },
    surfaces: {
        blur: '0px',
        surfaceOpacity: 1,
        borderWidth: '1px',
        borderOpacity: 1,
    },
    shadows: {
        card: 'none',
        hover: '0 4px 12px rgba(0,0,0,0.1)',
        elevated: '0 8px 16px rgba(0,0,0,0.1)',
    },
    motion: {
        style: 'instant',
        easing: 'linear',
        duration: '100ms',
        durationSlow: '200ms',
    },
    typography: {
        fontWeight: 500,
        headingWeight: 700,
        letterSpacing: '0em',
    },
    spacing: {
        unit: '1.5rem',
        density: 1.25,
        gap: '1.5rem',
        sectionGap: '2rem',
    },
    components: {
        button: { variant: 'tile', height: '3.5rem', padding: '1rem 2rem' },
        card: { variant: 'flat' },
        sidebar: { variant: 'solid', width: '280px', collapsedWidth: '80px' },
        table: { density: 'comfortable', rowHeight: '4rem' },
        input: { variant: 'outline', height: '3.5rem' },
        modal: { variant: 'sheet' },
    },
    layout: {
        sidebarStyle: 'solid',
        cardStyle: 'flat',
        density: 'spacious',
        containerPadding: '2rem',
    },
};
