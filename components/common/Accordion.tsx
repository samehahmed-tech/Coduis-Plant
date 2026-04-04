import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
    key: string;
    title: string;
    content: React.ReactNode;
    icon?: React.FC<{ size?: number; className?: string }>;
}

interface AccordionProps {
    items: AccordionItem[];
    multiple?: boolean;
    defaultOpen?: string[];
}

/**
 * Collapsible Accordion for FAQs, settings, and grouped content.
 * Usage:
 *   <Accordion items={[
 *     { key: 'q1', title: 'How to add items?', content: <p>...</p> },
 *     { key: 'q2', title: 'How to export?', content: <p>...</p>, icon: Download },
 *   ]} />
 */
const Accordion: React.FC<AccordionProps> = ({ items, multiple = false, defaultOpen = [] }) => {
    const [openKeys, setOpenKeys] = useState<string[]>(defaultOpen);

    const toggle = (key: string) => {
        setOpenKeys(prev => {
            if (prev.includes(key)) return prev.filter(k => k !== key);
            return multiple ? [...prev, key] : [key];
        });
    };

    return (
        <div className="space-y-2">
            {items.map(item => {
                const isOpen = openKeys.includes(item.key);
                const Icon = item.icon;
                return (
                    <div key={item.key} className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl overflow-hidden transition-all">
                        <button onClick={() => toggle(item.key)}
                            className="w-full flex items-center gap-3 p-4 text-left hover:bg-elevated/20 transition-colors">
                            {Icon && <Icon size={16} className={isOpen ? 'text-primary' : 'text-muted'} />}
                            <span className="flex-1 text-xs font-bold text-main">{item.title}</span>
                            <ChevronDown size={14} className={`text-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="px-4 pb-4 text-xs text-muted leading-relaxed">
                                {item.content}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Accordion;
