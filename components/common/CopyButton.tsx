import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useCopyToClipboard } from '../../hooks';

interface CopyButtonProps {
    text: string;
    label?: string;
    size?: 'sm' | 'md';
}

/**
 * One-click copy button with checkmark feedback.
 *
 * Usage:
 *   <CopyButton text={orderId} label="Copy ID" />
 *   <CopyButton text={apiKey} />
 */
const CopyButton: React.FC<CopyButtonProps> = ({ text, label, size = 'sm' }) => {
    const { copied, copy } = useCopyToClipboard();
    const sizeClass = size === 'sm' ? 'p-1.5 gap-1' : 'px-2.5 py-1.5 gap-1.5';
    const iconSize = size === 'sm' ? 12 : 14;

    return (
        <button onClick={() => copy(text)}
            className={`inline-flex items-center ${sizeClass} rounded-lg text-[8px] font-bold transition-all ${copied ? 'bg-emerald-500/10 text-emerald-500' : 'bg-elevated/30 text-muted hover:text-primary hover:bg-elevated border border-border/30'}`}>
            {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
            {label && <span className="uppercase tracking-widest font-black">{copied ? 'Copied!' : label}</span>}
        </button>
    );
};

export default CopyButton;
