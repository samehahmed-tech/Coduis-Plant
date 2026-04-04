import type { ThemeConfig } from '../tokens';

export const modernTheme: ThemeConfig = {
    id: 'modern',
    name: 'Modern',
    description: 'Clean & professional — Indigo accent, Stripe-inspired',
    tags: ['Professional', 'Clean'],
    shape: {
        radius: '14px',
        radiusSm: '8px',
        radiusLg: '20px',
        radiusXl: '28px',
    },
    surfaces: {
        blur: '12px',
        surfaceOpacity: 0.95,
        borderWidth: '1px',
        borderOpacity: 0.12,
    },
    shadows: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        hover: '0 8px 24px rgba(0,0,0,0.08)',
        elevated: '0 12px 32px rgba(0,0,0,0.1)',
    },
    motion: {
        style: 'smooth',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        duration: '200ms',
        durationSlow: '350ms',
    },
    typography: {
        fontWeight: 500,
        headingWeight: 800,
        letterSpacing: '-0.01em',
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
        sidebar: { variant: 'solid', width: '250px', collapsedWidth: '72px' },
        table: { density: 'comfortable', rowHeight: '3rem' },
        input: { variant: 'outline', height: '2.5rem' },
        modal: { variant: 'centered' },
    },
    layout: {
        sidebarStyle: 'solid',
        cardStyle: 'elevated',
        density: 'normal',
        containerPadding: '1.5rem',
    },
};
