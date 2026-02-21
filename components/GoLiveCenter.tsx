import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save, AlertTriangle, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { opsApi } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';

type UatResult = 'PENDING' | 'PASS' | 'FAIL';
type UatRoleStatus = 'PENDING' | 'PASS' | 'FAIL';

const toUat = (v: any): UatResult => {
  const x = String(v || '').toUpperCase();
  if (x === 'PASS' || x === 'FAIL') return x;
  return 'PENDING';
};

const toRoleStatus = (v: any): UatRoleStatus => {
  const x = String(v || '').toUpperCase();
  if (x === 'PASS' || x === 'FAIL') return x;
  return 'PENDING';
};

const Badge: React.FC<{ ok: boolean; labelOk: string; labelBad: string }> = ({ ok, labelOk, labelBad }) => (
  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/40' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/40'}`}>
    {ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
    {ok ? labelOk : labelBad}
  </span>
);

const GoLiveCenter: React.FC = () => {
  const settings = useAuthStore((s) => s.settings);
  const lang = (settings.language || 'en') as 'en' | 'ar';

  const [loading, setLoading] = useState(true);
  const [savingUat, setSavingUat] = useState(false);
  const [savingRollback, setSavingRollback] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [uatDraft, setUatDraft] = useState<any | null>(null);
  const [rollbackDraft, setRollbackDraft] = useState<any | null>(null);

  const isAdmin = String(settings.currentUser?.role || '').toUpperCase() === 'SUPER_ADMIN';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await opsApi.getGoLiveSummary();
      setSummary(data);
      setUatDraft(data.uat || null);
      setRollbackDraft(data.rollback || null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blockers = summary?.blockers?.blockers || [];
  const blockersOk = Boolean(summary?.blockers?.ok);

  const uatStatus = useMemo(() => {
    const roles = Array.isArray(uatDraft?.roles) ? uatDraft.roles : [];
    const pendingOrFail = roles.filter((r: any) => toRoleStatus(r?.status) !== 'PASS').length;
    return { roles, pendingOrFail };
  }, [uatDraft]);

  const rollbackStatus = useMemo(() => {
    const t = rollbackDraft?.timing || {};
    const approvals = rollbackDraft?.approvals || rollbackDraft?.approvedBy || {};
    const hasTimings =
      Number.isFinite(Number(t?.detectionToRollbackStartMinutes)) &&
      Number.isFinite(Number(t?.rollbackDurationMinutes)) &&
      Number.isFinite(Number(t?.recoveryVerificationMinutes));
    const approved = Boolean(approvals?.ops && approvals?.product);
    return { hasTimings, approved };
  }, [rollbackDraft]);

  const saveUat = async () => {
    if (!uatDraft) return;
    setSavingUat(true);
    try {
      await opsApi.updateUatSignoffArtifact(uatDraft);
      await opsApi.refreshGoLiveReports();
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save UAT');
    } finally {
      setSavingUat(false);
    }
  };

  const saveRollback = async () => {
    if (!rollbackDraft) return;
    setSavingRollback(true);
    try {
      await opsApi.updateRollbackDrillArtifact(rollbackDraft);
      await opsApi.refreshGoLiveReports();
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save rollback');
    } finally {
      setSavingRollback(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-10">
        <div className="bg-card border border-border rounded-[2rem] p-8">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="text-slate-400" />
            <div className="font-black text-main">{lang === 'ar' ? 'مركز جاهزية الإطلاق' : 'Go-Live Center'}</div>
          </div>
          <p className="text-sm text-muted mt-3 font-bold">
            {lang === 'ar'
              ? 'هذه الصفحة متاحة لمسؤول النظام فقط (SUPER_ADMIN).'
              : 'This page is available to SUPER_ADMIN only.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-10 pb-32">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-[1.5rem] bg-primary/10 text-primary shadow-inner">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-main uppercase tracking-tight">
                {lang === 'ar' ? 'مركز جاهزية الإطلاق' : 'Go-Live Center'}
              </h1>
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.25em]">
                {summary?.generatedAt ? `Generated: ${summary.generatedAt}` : (lang === 'ar' ? 'تحميل...' : 'Loading...')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge ok={blockersOk} labelOk={lang === 'ar' ? 'جاهز' : 'READY'} labelBad={lang === 'ar' ? 'محجوب' : 'BLOCKED'} />
            <Badge ok={uatStatus.pendingOrFail === 0 && uatStatus.roles.length > 0} labelOk={lang === 'ar' ? 'UAT PASS' : 'UAT PASS'} labelBad={lang === 'ar' ? 'UAT PENDING' : 'UAT PENDING'} />
            <Badge ok={rollbackStatus.hasTimings && rollbackStatus.approved} labelOk={lang === 'ar' ? 'Rollback OK' : 'Rollback OK'} labelBad={lang === 'ar' ? 'Rollback PENDING' : 'Rollback PENDING'} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-card border border-border text-main text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {lang === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
          <button
            onClick={async () => {
              try {
                await opsApi.refreshGoLiveReports();
                await load();
              } catch (e: any) {
                setError(e?.message || 'Refresh failed');
              }
            }}
            className="px-6 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
          >
            <RefreshCw size={14} />
            {lang === 'ar' ? 'إعادة حساب العوائق' : 'Recompute Blockers'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-2xl p-4 text-rose-800 dark:text-rose-200 font-bold">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-main uppercase tracking-tight">
            {lang === 'ar' ? 'العوائق الحالية' : 'Current Blockers'}
          </h2>
          <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
            {lang === 'ar' ? 'من artifacts/*' : 'From artifacts/*'}
          </div>
        </div>
        {loading ? (
          <div className="text-sm text-muted font-bold">{lang === 'ar' ? 'تحميل...' : 'Loading...'}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blockers.map((b: any) => (
              <div key={String(b.key)} className={`p-4 rounded-2xl border ${b.ok ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800/40' : 'border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-800/40'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black text-sm text-main">{String(b.key)}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${b.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                    {b.ok ? 'OK' : 'FAIL'}
                  </div>
                </div>
                <div className="text-xs text-muted font-bold mt-2">{String(b.details || '')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-main uppercase tracking-tight">
            {lang === 'ar' ? 'UAT حسب الدور' : 'Role-Based UAT'}
          </h2>
          <button
            onClick={saveUat}
            disabled={savingUat || loading || !uatDraft}
            className="px-6 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 disabled:opacity-60"
          >
            <Save size={14} />
            {lang === 'ar' ? 'حفظ UAT' : 'Save UAT'}
          </button>
        </div>

        {!uatDraft ? (
          <div className="text-sm text-muted font-bold">{lang === 'ar' ? 'لا يوجد ملف UAT.' : 'No UAT artifact found.'}</div>
        ) : (
          <div className="space-y-4">
            {uatStatus.roles.map((role: any, idx: number) => (
              <div key={String(role.role || idx)} className="border border-border rounded-2xl p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="font-black text-main">{String(role.role || 'Role')}</div>
                  <div className="flex flex-wrap gap-3">
                    <input
                      value={String(role.owner || '')}
                      onChange={(e) => {
                        const next = { ...uatDraft };
                        next.roles = [...uatStatus.roles];
                        next.roles[idx] = { ...next.roles[idx], owner: e.target.value };
                        setUatDraft(next);
                      }}
                      placeholder={lang === 'ar' ? 'المالك/المسؤول' : 'Owner'}
                      className="px-4 py-2 rounded-xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
                    />
                    <select
                      value={toRoleStatus(role.status)}
                      onChange={(e) => {
                        const next = { ...uatDraft };
                        next.roles = [...uatStatus.roles];
                        next.roles[idx] = { ...next.roles[idx], status: toRoleStatus(e.target.value) };
                        setUatDraft(next);
                      }}
                      className="px-4 py-2 rounded-xl border border-border bg-app/40 text-xs font-black text-main outline-none"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <textarea
                    value={String(role.notes || '')}
                    onChange={(e) => {
                      const next = { ...uatDraft };
                      next.roles = [...uatStatus.roles];
                      next.roles[idx] = { ...next.roles[idx], notes: e.target.value };
                      setUatDraft(next);
                    }}
                    placeholder={lang === 'ar' ? 'ملاحظات' : 'Notes'}
                    className="min-h-[80px] p-4 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={String(role.startedAt || '')}
                      onChange={(e) => {
                        const next = { ...uatDraft };
                        next.roles = [...uatStatus.roles];
                        next.roles[idx] = { ...next.roles[idx], startedAt: e.target.value };
                        setUatDraft(next);
                      }}
                      placeholder={lang === 'ar' ? 'بدأ في' : 'Started at'}
                      className="px-4 py-2 rounded-xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
                    />
                    <input
                      value={String(role.completedAt || '')}
                      onChange={(e) => {
                        const next = { ...uatDraft };
                        next.roles = [...uatStatus.roles];
                        next.roles[idx] = { ...next.roles[idx], completedAt: e.target.value };
                        setUatDraft(next);
                      }}
                      placeholder={lang === 'ar' ? 'اكتمل في' : 'Completed at'}
                      className="px-4 py-2 rounded-xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
                    />
                    <input
                      value={String(summary?.uat?.executionWindow?.environment || uatDraft?.executionWindow?.environment || '')}
                      disabled
                      className="px-4 py-2 rounded-xl border border-border bg-slate-50 dark:bg-slate-900/20 text-xs font-bold text-muted outline-none"
                    />
                    <input
                      value={String(uatDraft?.executionWindow?.version || '')}
                      onChange={(e) => {
                        const next = { ...uatDraft };
                        next.executionWindow = { ...(next.executionWindow || {}), version: e.target.value };
                        setUatDraft(next);
                      }}
                      placeholder={lang === 'ar' ? 'Version' : 'Version'}
                      className="px-4 py-2 rounded-xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                    {lang === 'ar' ? 'حالات الاختبار' : 'Test Cases'}
                  </div>
                  <div className="space-y-3">
                    {(Array.isArray(role.testCases) ? role.testCases : []).map((tc: any, tcIdx: number) => (
                      <div key={String(tc.id || tcIdx)} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl border border-border bg-app/20">
                        <div className="md:col-span-2 text-[10px] font-black uppercase tracking-widest text-muted">
                          {String(tc.id || '')}
                        </div>
                        <div className="md:col-span-6 text-sm font-bold text-main">
                          {String(tc.name || '')}
                        </div>
                        <div className="md:col-span-2">
                          <select
                            value={toUat(tc.result)}
                            onChange={(e) => {
                              const next = { ...uatDraft };
                              next.roles = [...uatStatus.roles];
                              const roleNext = { ...next.roles[idx] };
                              roleNext.testCases = [...(Array.isArray(roleNext.testCases) ? roleNext.testCases : [])];
                              roleNext.testCases[tcIdx] = { ...roleNext.testCases[tcIdx], result: toUat(e.target.value) };
                              next.roles[idx] = roleNext;
                              setUatDraft(next);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-border bg-white/70 dark:bg-slate-950/20 text-xs font-black text-main outline-none"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="PASS">PASS</option>
                            <option value="FAIL">FAIL</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <input
                            value={String(tc.evidence || '')}
                            onChange={(e) => {
                              const next = { ...uatDraft };
                              next.roles = [...uatStatus.roles];
                              const roleNext = { ...next.roles[idx] };
                              roleNext.testCases = [...(Array.isArray(roleNext.testCases) ? roleNext.testCases : [])];
                              roleNext.testCases[tcIdx] = { ...roleNext.testCases[tcIdx], evidence: e.target.value };
                              next.roles[idx] = roleNext;
                              setUatDraft(next);
                            }}
                            placeholder={lang === 'ar' ? 'دليل/رابط' : 'Evidence'}
                            className="w-full px-3 py-2 rounded-xl border border-border bg-white/70 dark:bg-slate-950/20 text-xs font-bold text-main outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={String(uatDraft?.approvals?.opsLead || '')}
                onChange={(e) => setUatDraft({ ...uatDraft, approvals: { ...(uatDraft.approvals || {}), opsLead: e.target.value } })}
                placeholder={lang === 'ar' ? 'Ops Lead' : 'Ops Lead'}
                className="px-4 py-3 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
              />
              <input
                value={String(uatDraft?.approvals?.productLead || '')}
                onChange={(e) => setUatDraft({ ...uatDraft, approvals: { ...(uatDraft.approvals || {}), productLead: e.target.value } })}
                placeholder={lang === 'ar' ? 'Product Lead' : 'Product Lead'}
                className="px-4 py-3 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
              />
              <input
                value={String(uatDraft?.approvals?.approvedAt || '')}
                onChange={(e) => setUatDraft({ ...uatDraft, approvals: { ...(uatDraft.approvals || {}), approvedAt: e.target.value } })}
                placeholder={lang === 'ar' ? 'Approved at' : 'Approved at'}
                className="px-4 py-3 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-main uppercase tracking-tight">
            {lang === 'ar' ? 'Rollback Drill' : 'Rollback Drill'}
          </h2>
          <button
            onClick={saveRollback}
            disabled={savingRollback || loading || !rollbackDraft}
            className="px-6 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 disabled:opacity-60"
          >
            <Save size={14} />
            {lang === 'ar' ? 'حفظ Rollback' : 'Save Rollback'}
          </button>
        </div>

        {!rollbackDraft ? (
          <div className="text-sm text-muted font-bold">{lang === 'ar' ? 'لا يوجد ملف rollback.' : 'No rollback artifact found.'}</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={String(rollbackDraft.drillId || '')}
                onChange={(e) => setRollbackDraft({ ...rollbackDraft, drillId: e.target.value })}
                placeholder={lang === 'ar' ? 'Drill ID' : 'Drill ID'}
                className="px-4 py-3 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
              />
              <input
                value={String(rollbackDraft.scenario || '')}
                onChange={(e) => setRollbackDraft({ ...rollbackDraft, scenario: e.target.value })}
                placeholder={lang === 'ar' ? 'السيناريو' : 'Scenario'}
                className="px-4 py-3 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
              />
              <input
                value={String(rollbackDraft.incidentStartAt || '')}
                onChange={(e) => setRollbackDraft({ ...rollbackDraft, incidentStartAt: e.target.value })}
                placeholder={lang === 'ar' ? 'Incident start at' : 'Incident start at'}
                className="px-4 py-3 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={String(rollbackDraft?.timing?.detectionToRollbackStartMinutes ?? '')}
                onChange={(e) => setRollbackDraft({ ...rollbackDraft, timing: { ...(rollbackDraft.timing || {}), detectionToRollbackStartMinutes: e.target.value === '' ? null : Number(e.target.value) } })}
                placeholder={lang === 'ar' ? 'دقائق: اكتشاف -> بدء rollback' : 'min: detection -> rollback start'}
                className="px-4 py-3 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
              />
              <input
                value={String(rollbackDraft?.timing?.rollbackDurationMinutes ?? '')}
                onChange={(e) => setRollbackDraft({ ...rollbackDraft, timing: { ...(rollbackDraft.timing || {}), rollbackDurationMinutes: e.target.value === '' ? null : Number(e.target.value) } })}
                placeholder={lang === 'ar' ? 'دقائق: مدة rollback' : 'min: rollback duration'}
                className="px-4 py-3 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
              />
              <input
                value={String(rollbackDraft?.timing?.recoveryVerificationMinutes ?? '')}
                onChange={(e) => setRollbackDraft({ ...rollbackDraft, timing: { ...(rollbackDraft.timing || {}), recoveryVerificationMinutes: e.target.value === '' ? null : Number(e.target.value) } })}
                placeholder={lang === 'ar' ? 'دقائق: التحقق من التعافي' : 'min: recovery verification'}
                className="px-4 py-3 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
              />
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                {lang === 'ar' ? 'قائمة خطوات rollback' : 'Rollback Checklist'}
              </div>
              <div className="space-y-3">
                {(Array.isArray(rollbackDraft.checklist) ? rollbackDraft.checklist : []).map((step: any, idx: number) => (
                  <div key={String(step.id || idx)} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl border border-border bg-app/20">
                    <div className="md:col-span-2 text-[10px] font-black uppercase tracking-widest text-muted">{String(step.id || '')}</div>
                    <div className="md:col-span-6 text-sm font-bold text-main">{String(step.title || '')}</div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-xs font-black text-main">
                        <input
                          type="checkbox"
                          checked={Boolean(step.completed)}
                          onChange={(e) => {
                            const next = { ...rollbackDraft };
                            next.checklist = [...(Array.isArray(next.checklist) ? next.checklist : [])];
                            next.checklist[idx] = { ...next.checklist[idx], completed: e.target.checked };
                            setRollbackDraft(next);
                          }}
                        />
                        {lang === 'ar' ? 'تم' : 'Done'}
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <input
                        value={String(step.owner || '')}
                        onChange={(e) => {
                          const next = { ...rollbackDraft };
                          next.checklist = [...(Array.isArray(next.checklist) ? next.checklist : [])];
                          next.checklist[idx] = { ...next.checklist[idx], owner: e.target.value };
                          setRollbackDraft(next);
                        }}
                        placeholder={lang === 'ar' ? 'Owner' : 'Owner'}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-white/70 dark:bg-slate-950/20 text-xs font-bold text-main outline-none"
                      />
                      <input
                        value={String(step.at || '')}
                        onChange={(e) => {
                          const next = { ...rollbackDraft };
                          next.checklist = [...(Array.isArray(next.checklist) ? next.checklist : [])];
                          next.checklist[idx] = { ...next.checklist[idx], at: e.target.value };
                          setRollbackDraft(next);
                        }}
                        placeholder={lang === 'ar' ? 'At' : 'At'}
                        className="w-full px-3 py-2 mt-2 rounded-xl border border-border bg-white/70 dark:bg-slate-950/20 text-xs font-bold text-main outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={String(rollbackDraft?.approvedBy?.ops || '')}
                onChange={(e) => setRollbackDraft({ ...rollbackDraft, approvedBy: { ...(rollbackDraft.approvedBy || {}), ops: e.target.value } })}
                placeholder={lang === 'ar' ? 'موافقة Ops' : 'Ops approval'}
                className="px-4 py-3 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
              />
              <input
                value={String(rollbackDraft?.approvedBy?.product || '')}
                onChange={(e) => setRollbackDraft({ ...rollbackDraft, approvedBy: { ...(rollbackDraft.approvedBy || {}), product: e.target.value } })}
                placeholder={lang === 'ar' ? 'موافقة Product' : 'Product approval'}
                className="px-4 py-3 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
              />
            </div>

            <textarea
              value={String(rollbackDraft.notes || '')}
              onChange={(e) => setRollbackDraft({ ...rollbackDraft, notes: e.target.value })}
              placeholder={lang === 'ar' ? 'ملاحظات' : 'Notes'}
              className="min-h-[90px] p-4 rounded-2xl border border-border bg-app/40 text-xs font-bold text-main outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GoLiveCenter;

