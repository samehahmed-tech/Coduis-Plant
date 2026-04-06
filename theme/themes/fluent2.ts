import type { ThemeConfig } from '../tokens';

export const fluent2Theme: ThemeConfig = {
    id: 'fluent2',
    name: 'Fluent 2.0',
    description: 'Crisp borders and solid interactions inspired by Syncfusion Fluent',
    tags: ['Fluent', 'Dense', 'Professional'],
    shape: {
        radius: '4px',
        radiusSm: '2px',
        radiusLg: '8px',
        radiusXl: '12px',
    },
    surfaces: {
        blur: '0px',
        surfaceOpacity: 1,
        borderWidth: '1px',
        borderOpacity: 1,
    },
    shadows: {
        card: '0 1px 3px rgba(0,0,0,0.06)',
        hover: '0 4px 12px rgba(0,0,0,0.1)',
        elevated: '0 8px 16px rgba(0,0,0,0.12)',
    },
    motion: {
        style: 'crisp',
        easing: 'ease-in-out',
        duration: '200ms',
        durationSlow: '400ms',
    },
    typography: {
        fontWeight: 400,
        headingWeight: 600,
        letterSpacing: '0em',
    },
    spacing: {
        unit: '0.875rem',
        density: 0.9, /* Denser than normal */
        gap: '0.75rem',
        sectionGap: '1.25rem',
    },
    components: {
        button: { variant: 'solid', height: '2rem', padding: '0.25rem 0.75rem' },
        card: { variant: 'flat' },
        sidebar: { variant: 'solid', width: '220px', collapsedWidth: '60px' },
        table: { density: 'dense', rowHeight: '2.5rem' },
        input: { variant: 'outline', height: '2rem' },
        modal: { variant: 'centered' },
    },
    layout: {
        sidebarStyle: 'solid',
        cardStyle: 'flat',
        density: 'compact',
        containerPadding: '1rem',
    },
};
