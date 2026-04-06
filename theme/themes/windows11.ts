import type { ThemeConfig } from '../tokens';

export const windows11Theme: ThemeConfig = {
    id: 'windows11',
    name: 'Windows 11 Mica',
    description: 'Syncfusion/Telerik inspired Windows 11 UI with Mica effect',
    tags: ['Windows', 'Mica', 'Premium'],
    shape: {
        radius: '8px',
        radiusSm: '4px',
        radiusLg: '12px',
        radiusXl: '16px',
    },
    surfaces: {
        blur: '30px',
        surfaceOpacity: 0.75,
        borderWidth: '1px',
        borderOpacity: 0.2,
    },
    shadows: {
        card: '0 2px 8px rgba(0,0,0,0.04)',
        hover: '0 8px 16px rgba(0,0,0,0.08)',
        elevated: '0 32px 64px rgba(0,0,0,0.14)',
    },
    motion: {
        style: 'smooth',
        easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)',
        duration: '150ms',
        durationSlow: '300ms',
    },
    typography: {
        fontWeight: 500,
        headingWeight: 600,
        letterSpacing: '0em',
    },
    spacing: {
        unit: '1rem',
        density: 1,
        gap: '1rem',
        sectionGap: '1.5rem',
    },
    components: {
        button: { variant: 'soft', height: '2.5rem', padding: '0.5rem 1rem' },
        card: { variant: 'elevated' },
        sidebar: { variant: 'blurred', width: '250px', collapsedWidth: '72px' },
        table: { density: 'comfortable', rowHeight: '3rem' },
        input: { variant: 'outline', height: '2.5rem' },
        modal: { variant: 'centered' },
    },
    layout: {
        sidebarStyle: 'blurred',
        cardStyle: 'elevated',
        density: 'normal',
        containerPadding: '1.5rem',
    },
};
