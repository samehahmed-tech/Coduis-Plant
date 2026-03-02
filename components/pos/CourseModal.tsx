import React, { useState, useEffect } from 'react';
import { X, Utensils } from 'lucide-react';

interface CourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCourse: string | undefined;
    onSave: (course: string | undefined) => void;
    lang: 'en' | 'ar';
}

const COURSES = ['APPETIZER', 'MAIN', 'DESSERT', 'DRINKS'];

const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, currentCourse, onSave, lang }) => {
    const isRTL = lang === 'ar';
    const [selectedCourse, setSelectedCourse] = useState<string | undefined>(currentCourse);

    useEffect(() => {
        if (isOpen) setSelectedCourse(currentCourse);
    }, [isOpen, currentCourse]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className={`relative w-full max-w-sm bg-app rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 ${isRTL ? 'text-right' : 'text-left'}`}>
                {/* Header */}
                <div className="relative shrink-0 p-4 border-b border-border/30 bg-elevated/40 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                        <Utensils className="text-teal-500" size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-main uppercase tracking-widest leading-tight">
                            {isRTL ? 'تحديد دورة تقديم الطعام' : 'Assign Kitchen Course'}
                        </h3>
                        <p className="text-[11px] font-semibold text-muted uppercase mt-0.5 tracking-wider">
                            {isRTL ? 'ترتيب تحضير الأطباق' : 'Manage firing sequence'}
                        </p>
                    </div>
                    <button onClick={onClose} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-2 text-muted hover:text-main hover:bg-elevated rounded-lg transition-colors`}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 grid grid-cols-2 gap-2">
                    {COURSES.map(course => (
                        <button
                            key={course}
                            onClick={() => setSelectedCourse(course)}
                            className={`p-3 rounded-xl border-2 font-black tracking-widest uppercase text-xs transition-all ${selectedCourse === course ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'border-border/50 text-muted hover:bg-elevated hover:text-main'}`}
                        >
                            {course}
                        </button>
                    ))}
                    <button
                        onClick={() => setSelectedCourse(undefined)}
                        className={`col-span-2 mt-2 p-3 rounded-xl border border-dashed font-black tracking-widest uppercase text-xs transition-all ${!selectedCourse ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400' : 'border-border/50 text-muted hover:bg-elevated hover:text-main'}`}
                    >
                        {isRTL ? 'مسح (تحضير مباشر)' : 'Clear (Fire Immediately)'}
                    </button>
                </div>

                {/* Footer */}
                <div className="shrink-0 p-4 border-t border-border/30 bg-elevated/20 flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl border border-border/50 text-muted font-black uppercase tracking-widest text-xs hover:bg-elevated hover:text-main transition-colors"
                    >
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                        onClick={() => onSave(selectedCourse)}
                        className="flex-1 h-12 rounded-xl bg-teal-500 text-white font-black uppercase tracking-widest text-xs hover:bg-teal-600 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/20"
                    >
                        {isRTL ? 'حفظ' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseModal;
