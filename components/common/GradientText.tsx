import React from 'react';

type GradientPreset = 'primary' | 'sunset' | 'ocean' | 'emerald' | 'rose' | 'gold';

interface GradientTextProps {
    children: React.ReactNode;
    gradient?: GradientPreset;
    className?: string;
    as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}

const GRADIENTS: Record<GradientPreset, string> = {
    primary: 'from-indigo-500 to-cyan-500',
    sunset: 'from-orange-500 to-rose-500',
    ocean: 'from-blue-500 to-teal-500',
    emerald: 'from-emerald-500 to-lime-500',
    rose: 'from-rose-500 to-pink-500',
    gold: 'from-amber-400 to-yellow-500',
};

/**
 * Gradient text for headings and hero text.
 *
 * Usage:
 *   <GradientText as="h1" gradient="primary" className="text-3xl font-black">Dashboard</GradientText>
 *   <GradientText gradient="sunset">Hot Deal!</GradientText>
 */
const GradientText: React.FC<GradientTextProps> = ({ children, gradient = 'primary', className = '', as: Tag = 'span' }) => (
    <Tag className={`bg-gradient-to-r ${GRADIENTS[gradient]} bg-clip-text text-transparent ${className}`}>
        {children}
    </Tag>
);

export default GradientText;
