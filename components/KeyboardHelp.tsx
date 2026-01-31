import React, { useState, useEffect } from 'react';
import { Keyboard, X, Command } from 'lucide-react';

interface ShortcutGroup {
    title: string;
    titleAr: string;
    shortcuts: { keys: string[]; action: string; actionAr: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
    {
        title: 'POS Actions',
        titleAr: 'نقطة البيع',
        shortcuts: [
            { keys: ['P'], action: 'Open Pay Dialog', actionAr: 'فتح الدفع' },
            { keys: ['V'], action: 'Void Order', actionAr: 'إلغاء الطلب' },
            { keys: ['H'], action: 'Hold Order', actionAr: 'تعليق الطلب' },
            { keys: ['C'], action: 'Clear Cart', actionAr: 'مسح السلة' },
            { keys: ['Esc'], action: 'Cancel / Close', actionAr: 'إلغاء / إغلاق' },
        ]
    },
    {
        title: 'Navigation',
        titleAr: 'التنقل',
        shortcuts: [
            { keys: ['1'], action: 'Dashboard', actionAr: 'لوحة التحكم' },
            { keys: ['2'], action: 'POS Screen', actionAr: 'نقطة البيع' },
            { keys: ['3'], action: 'Kitchen Display', actionAr: 'شاشة المطبخ' },
            { keys: ['S'], action: 'Toggle Sidebar', actionAr: 'إظهار/إخفاء القائمة' },
        ]
    },
    {
        title: 'General',
        titleAr: 'عام',
        shortcuts: [
            { keys: ['?'], action: 'Show This Help', actionAr: 'عرض المساعدة' },
            { keys: ['/', 'Ctrl', 'K'], action: 'Search', actionAr: 'بحث' },
            { keys: ['D'], action: 'Toggle Dark Mode', actionAr: 'الوضع الداكن' },
        ]
    },
];

interface KeyboardHelpProps {
    lang: 'en' | 'ar';
}

const KeyboardHelp: React.FC<KeyboardHelpProps> = ({ lang }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9997] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center">
                            <Keyboard size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                {lang === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
                            </h2>
                            <p className="text-xs text-slate-400 font-bold">
                                {lang === 'ar' ? 'اضغط ? للفتح/الإغلاق' : 'Press ? to toggle'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                    {SHORTCUTS.map((group, idx) => (
                        <div key={idx}>
                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-3">
                                {lang === 'ar' ? group.titleAr : group.title}
                            </h3>
                            <div className="space-y-2">
                                {group.shortcuts.map((shortcut, sIdx) => (
                                    <div key={sIdx} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {lang === 'ar' ? shortcut.actionAr : shortcut.action}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, kIdx) => (
                                                <React.Fragment key={kIdx}>
                                                    {kIdx > 0 && <span className="text-xs text-slate-400 mx-1">+</span>}
                                                    <kbd className="min-w-[28px] h-7 px-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-sm">
                                                        {key === 'Command' ? <Command size={12} /> : key}
                                                    </kbd>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 text-center">
                    <p className="text-xs text-slate-400">
                        {lang === 'ar' ? 'اضغط ESC أو انقر خارج النافذة للإغلاق' : 'Press ESC or click outside to close'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KeyboardHelp;
