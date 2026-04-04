import React from 'react';

interface HighlightTextProps {
    text: string;
    query: string;
    className?: string;
}

/**
 * Highlights matching portions of text for search results.
 *
 * Usage:
 *   <HighlightText text={item.name} query={searchTerm} />
 */
const HighlightText: React.FC<HighlightTextProps> = ({ text, query, className = '' }) => {
    if (!query.trim()) return <span className={className}>{text}</span>;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, i) =>
                regex.test(part)
                    ? <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5 font-bold">{part}</mark>
                    : <span key={i}>{part}</span>
            )}
        </span>
    );
};

export default HighlightText;
