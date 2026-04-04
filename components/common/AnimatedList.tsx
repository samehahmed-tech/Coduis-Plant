import React from 'react';

interface AnimatedListProps {
    children: React.ReactNode[];
    stagger?: number;
    className?: string;
}

/**
 * Wrapper that staggers children entry with CSS animation delays.
 *
 * Usage:
 *   <AnimatedList stagger={50}>
 *     {items.map(item => <Card key={item.id}>{item.name}</Card>)}
 *   </AnimatedList>
 */
const AnimatedList: React.FC<AnimatedListProps> = ({ children, stagger = 40, className = '' }) => (
    <div className={className}>
        {React.Children.map(children, (child, i) => (
            <div
                className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
                style={{ animationDelay: `${i * stagger}ms` }}
            >
                {child}
            </div>
        ))}
    </div>
);

export default AnimatedList;
