import React from 'react';
import { Calendar } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface DateRangePresetsProps {
    value: string;
    onChange: (key: string, from: Date, to: Date) => void;
}

const getPresets = (lang: string) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000 - 1);

    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return [
        { key: 'today', label: lang === 'ar' ? 'اليوم' : 'Today', from: startOfDay, to: endOfDay },
        { key: 'yesterday', label: lang === 'ar' ? 'أمس' : 'Yesterday', from: new Date(startOfDay.getTime() - 86400000), to: new Date(startOfDay.getTime() - 1) },
        { key: 'week', label: lang === 'ar' ? 'هذا الأسبوع' : 'This Week', from: startOfWeek, to: endOfDay },
        { key: 'month', label: lang === 'ar' ? 'هذا الشهر' : 'This Month', from: startOfMonth, to: endOfDay },
        { key: 'last_month', label: lang === 'ar' ? 'الشهر الماضي' : 'Last Month', from: startOfLastMonth, to: endOfLastMonth },
        { key: 'year', label: lang === 'ar' ? 'هذه السنة' : 'This Year', from: startOfYear, to: endOfDay },
    ];
};

/**
 * Quick date range selector with preset periods.
 *
 * Usage:
 *   <DateRangePresets value={range} onChange={(key, from, to) => { setRange(key); fetchData(from, to); }} />
 */
const DateRangePresets: React.FC<DateRangePresetsProps> = ({ value, onChange }) => {
    const lang = useAuthStore(s => s.settings.language) || 'en';
    const presets = getPresets(lang);

    return (
        <div className="flex items-center gap-1 flex-wrap">
            <Calendar size={14} className="text-muted mr-1" />
            {presets.map(p => (
                <button key={p.key} onClick={() => onChange(p.key, p.from, p.to)}
                    className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${value === p.key ? 'bg-primary text-white shadow-sm' : 'bg-elevated/40 text-muted hover:text-main hover:bg-elevated border border-border/30'}`}>
                    {p.label}
                </button>
            ))}
        </div>
    );
};

export default DateRangePresets;
