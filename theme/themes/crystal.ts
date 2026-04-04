import type { ThemeConfig } from '../tokens';

export const crystalTheme: ThemeConfig = {
    id: 'crystal',
    name: 'Crystal',
    description: 'Bold & sleek — Pure black & white, Vercel-inspired',
    tags: ['Bold', 'Sleek'],
    shape: {
        radius: '18px',
        radiusSm: '10px',
        radiusLg: '24px',
        radiusXl: '32px',
    },
    surfaces: {
        blur: '28px',
        surfaceOpacity: 0.68,
        borderWidth: '1px',
        borderOpacity: 0.12,
    },
    shadows: {
        card: '0 4px 16px rgba(236,72,153,0.06), 0 2px 8px rgba(168,85,247,0.04)',
        hover: '0 8px 28px rgba(236,72,153,0.12), 0 4px 12px rgba(168,85,247,0.08)',
        elevated: '0 16px 40px rgba(236,72,153,0.15), 0 8px 20px rgba(168,85,247,0.1)',
    },
    motion: {
        style: 'elastic',
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        duration: '280ms',
        durationSlow: '450ms',
    },
    typography: {
        fontWeight: 400,
        headingWeight: 700,
        letterSpacing: '0.01em',
    },
    spacing: {
        unit: '1.1rem',
        density: 1.05,
        gap: '0.875rem',
        sectionGap: '1.75rem',
    },
    components: {
        button: { variant: 'glass', height: '2.625rem', padding: '0.625rem 1.5rem' },
        card: { variant: 'glass' },
        sidebar: { variant: 'floating', width: '260px', collapsedWidth: '72px' },
        table: { density: 'comfortable', rowHeight: '3.125rem' },
        input: { variant: 'glass', height: '2.625rem' },
        modal: { variant: 'floating' },
    },
    layout: {
        sidebarStyle: 'floating',
        cardStyle: 'glass',
        density: 'normal',
        containerPadding: '1.75rem',
    },
};
