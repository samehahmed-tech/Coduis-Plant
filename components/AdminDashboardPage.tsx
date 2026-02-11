import React from 'react';
import AdminDashboard from './AdminDashboard';
import { useAuthStore } from '../stores/useAuthStore';
import { analyticsApi } from '../services/api';

const AdminDashboardPage: React.FC = () => {
    const lang = (useAuthStore((state) => state.settings.language) || 'en') as 'en' | 'ar';
    const [rows, setRows] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const period = React.useMemo(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        return {
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
            label: lang === 'ar'
                ? `${start.toLocaleDateString('ar-EG')} - ${end.toLocaleDateString('ar-EG')}`
                : `${start.toLocaleDateString('en-US')} - ${end.toLocaleDateString('en-US')}`,
        };
    }, [lang]);

    React.useEffect(() => {
        let mounted = true;
        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await analyticsApi.getBranchPerformance({
                    startDate: period.startDate,
                    endDate: period.endDate,
                });
                if (mounted) setRows(Array.isArray(data) ? data : []);
            } catch (e: any) {
                if (mounted) {
                    setError(e?.message || (lang === 'ar' ? 'تعذر تحميل بيانات الفروع' : 'Failed to load branch analytics'));
                    setRows([]);
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [period.startDate, period.endDate, lang]);

    return <AdminDashboard lang={lang} rows={rows} isLoading={isLoading} error={error} periodLabel={period.label} />;
};

export default AdminDashboardPage;
