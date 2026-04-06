import React, { memo, useEffect, useRef, useState } from 'react';
import { X, Command } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface Shortcut {
    keys: string[];
    label: string;
    labelAr?: string;
}

const SHORTCUTS: { group: string; groupAr: string; items: Shortcut[] }[] = [
    {
        group: 'Navigation', groupAr: 'ط§ظ„طھظ†ظ‚ظ„',
        items: [
            { keys: ['Ctrl', 'K'], label: 'Quick Search', labelAr: 'ط¨ط­ط« ط³ط±ظٹط¹' },
            { keys: ['Ctrl', 'Shift', 'P'], label: 'POS', labelAr: 'ظ†ظ‚ط·ط© ط§ظ„ط¨ظٹط¹' },
            { keys: ['?'], label: 'Keyboard Shortcuts', labelAr: 'ط§ط®طھطµط§ط±ط§طھ ظ„ظˆط­ط© ط§ظ„ظ…ظپط§طھظٹط­' },
        ],
    },
    {
        group: 'Actions', groupAr: 'ط¥ط¬ط±ط§ط،ط§طھ',
        items: [
            { keys: ['Esc'], label: 'Close modal / drawer', labelAr: 'ط¥ط؛ظ„ط§ظ‚ ط§ظ„ظ†ط§ظپط°ط©' },
            { keys: ['↑', '↓'], label: 'Navigate lists', labelAr: 'طھظ†ظ‚ظ„ ظپظٹ ط§ظ„ظ‚ظˆط§ط¦ظ…' },
            { keys: ['Enter'], label: 'Select / confirm', labelAr: 'ط§ط®طھظٹط§ط± / طھط£ظƒظٹط¯' },
        ],
    },
    {
        group: 'Export', groupAr: 'طھطµط¯ظٹط±',
        items: [
            { keys: ['Ctrl', 'E'], label: 'Export current view (if available)', labelAr: 'طھطµط¯ظٹط± ط§ظ„ط¹ط±ط¶ ط§ظ„ط­ط§ظ„ظٹ' },
        ],
    },
];

const KeyboardShortcuts: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const isOpenRef = useRef(false);
    const lang = useAuthStore((state) => state.settings.language || 'en');

    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.key === '?'
                && !event.ctrlKey
                && !event.metaKey
                && !(event.target instanceof HTMLInputElement)
                && !(event.target instanceof HTMLTextAreaElement)
                && !(event.target instanceof HTMLSelectElement)
            ) {
                event.preventDefault();
                setIsOpen((prev) => !prev);
                return;
            }

            if (event.key === 'Escape' && isOpenRef.current) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990] flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
            <div className="bg-card border border-border rounded-[2rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={(event) => event.stopPropagation()}>
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Command size={20} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-main">{lang === 'ar' ? 'ط§ط®طھطµط§ط±ط§طھ ظ„ظˆط­ط© ط§ظ„ظ…ظپط§طھظٹط­' : 'Keyboard Shortcuts'}</h3>
                            <p className="text-[9px] text-muted font-bold uppercase tracking-widest">{lang === 'ar' ? 'ط§ط¶ط؛ط· ? ظ„ط¥ط؛ظ„ط§ظ‚' : 'Press ? to close'}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 text-muted hover:text-main transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {SHORTCUTS.map((group) => (
                        <div key={group.group}>
                            <h4 className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-3">{lang === 'ar' ? group.groupAr : group.group}</h4>
                            <div className="space-y-2">
                                {group.items.map((shortcut, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-app rounded-xl border border-border/50">
                                        <span className="text-xs font-bold text-main">{lang === 'ar' ? shortcut.labelAr || shortcut.label : shortcut.label}</span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, j) => (
                                                <React.Fragment key={j}>
                                                    {j > 0 && <span className="text-[8px] text-muted">+</span>}
                                                    <kbd className="px-2 py-1 rounded-lg bg-card border border-border text-[10px] font-black text-muted min-w-[24px] text-center shadow-sm">{key}</kbd>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(KeyboardShortcuts);
