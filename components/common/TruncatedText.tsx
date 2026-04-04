import React, { useState } from 'react';

interface TruncatedTextProps {
    text: string;
    maxLength?: number;
    className?: string;
}

/**
 * Text that truncates with "...more" toggle.
 *
 * Usage:
 *   <TruncatedText text={longDescription} maxLength={80} />
 */
const TruncatedText: React.FC<TruncatedTextProps> = ({ text, maxLength = 100, className = '' }) => {
    const [expanded, setExpanded] = useState(false);
    const needsTruncation = text.length > maxLength;

    if (!needsTruncation) return <span className={className}>{text}</span>;

    return (
        <span className={className}>
            {expanded ? text : `${text.slice(0, maxLength)}…`}
            <button onClick={() => setExpanded(!expanded)}
                className="ml-1 text-primary text-[9px] font-bold hover:underline">
                {expanded ? 'less' : 'more'}
            </button>
        </span>
    );
};

export default TruncatedText;
