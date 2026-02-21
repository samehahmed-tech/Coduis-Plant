import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';

type Json = any;

const root = () => process.cwd();
const artifactsPath = (...parts: string[]) => path.join(root(), 'artifacts', ...parts);

const readJson = (p: string): Json | null => {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
};

const writeJsonAtomic = (p: string, value: any) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(tmp, p);
};

const get = (key: string) => (process.env[key] || '').trim();
const isEnabled = (key: string, fallback = false) => {
  const raw = get(key).toLowerCase();
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw);
};

const computeBlockers = () => {
  const launch = readJson(artifactsPath('gates', 'launch-gates.json'));
  const uat = readJson(artifactsPath('uat', 'role-signoff.json'));
  const rollback = readJson(artifactsPath('rollback', 'drill-report.json'));

  const blockers: Array<{ key: string; ok: boolean; details: string }> = [];

  const REQUIRE_ETA = isEnabled('GO_LIVE_REQUIRE_ETA', false);
  const REQUIRE_REDIS_REALTIME =
    isEnabled('GO_LIVE_REQUIRE_REDIS_REALTIME', false) || isEnabled('SOCKET_REDIS_ENABLED', false);

  if (!launch) {
    blockers.push({ key: 'launch-gates', ok: false, details: 'launch-gates.json is missing' });
  } else {
    blockers.push({ key: 'launch-gates', ok: Boolean(launch.ok), details: `ok=${Boolean(launch.ok)} failedRequired=${launch?.summary?.failedRequired ?? 'n/a'}` });
    const eta = Array.isArray(launch.results) ? launch.results.find((r: any) => String(r.name) === 'eta-config-check') : null;
    const redis = Array.isArray(launch.results) ? launch.results.find((r: any) => String(r.name) === 'realtime-redis-gate') : null;

    if (REQUIRE_ETA) {
      if (!eta) blockers.push({ key: 'eta-config', ok: false, details: 'eta-config-check missing from launch-gates report' });
      else blockers.push({ key: 'eta-config', ok: Boolean(eta.ok) && !eta.skipped, details: eta.skipped ? 'skipped but required (GO_LIVE_REQUIRE_ETA=true)' : eta.ok ? 'configured' : 'missing required ETA env' });
    } else if (eta && !eta.skipped) {
      blockers.push({ key: 'eta-config', ok: Boolean(eta.ok), details: eta.ok ? 'configured' : 'missing required ETA env' });
    }

    if (REQUIRE_REDIS_REALTIME) {
      if (!redis) blockers.push({ key: 'redis-realtime-gate', ok: false, details: 'realtime-redis-gate missing from launch-gates report' });
      else blockers.push({ key: 'redis-realtime-gate', ok: Boolean(redis.ok) && !redis.skipped, details: redis.skipped ? 'skipped but required (SOCKET_REDIS_ENABLED/GO_LIVE_REQUIRE_REDIS_REALTIME)' : redis.ok ? 'pass' : `fail exit=${redis.exitCode}` });
    } else if (redis && !redis.skipped) {
      blockers.push({ key: 'redis-realtime-gate', ok: Boolean(redis.ok), details: redis.ok ? 'pass' : `fail exit=${redis.exitCode}` });
    }
  }

  if (!uat) {
    blockers.push({ key: 'uat-signoff', ok: false, details: 'role-signoff.json is missing' });
  } else {
    const roles = Array.isArray(uat.roles) ? uat.roles : [];
    const pending = roles.filter((r: any) => String(r.status || '').toUpperCase() !== 'PASS').length;
    blockers.push({ key: 'uat-signoff', ok: pending === 0 && roles.length > 0, details: `roles=${roles.length} pending_or_fail=${pending}` });
  }

  if (!rollback) {
    blockers.push({ key: 'rollback-drill', ok: false, details: 'drill-report.json is missing' });
  } else {
    const timings = rollback?.timing || {};
    const approvals = rollback?.approvals || rollback?.approvedBy || {};
    const hasTimings =
      Number.isFinite(Number(timings?.detectionToRollbackStartMinutes)) &&
      Number.isFinite(Number(timings?.rollbackDurationMinutes)) &&
      Number.isFinite(Number(timings?.recoveryVerificationMinutes));
    const approved = Boolean(approvals?.ops && approvals?.product);
    blockers.push({
      key: 'rollback-drill',
      ok: hasTimings && approved,
      details: `hasTimings=${hasTimings} approvals(ops,product)=(${Boolean(approvals?.ops)},${Boolean(approvals?.product)})`,
    });
  }

  const ok = blockers.every((b) => b.ok);
  return {
    ok,
    generatedAt: new Date().toISOString(),
    blockers,
    summary: {
      total: blockers.length,
      failed: blockers.filter((b) => !b.ok).length,
    },
    flags: {
      requireEta: REQUIRE_ETA,
      requireRedisRealtime: REQUIRE_REDIS_REALTIME,
      socketRedisEnabled: isEnabled('SOCKET_REDIS_ENABLED', false),
    },
  };
};

export const getGoLiveSummary = async (req: Request, res: Response) => {
  const launch = readJson(artifactsPath('gates', 'launch-gates.json'));
  const uat = readJson(artifactsPath('uat', 'role-signoff.json'));
  const rollback = readJson(artifactsPath('rollback', 'drill-report.json'));
  const evidence = readJson(artifactsPath('evidence', 'launch-evidence-manifest.json'));
  const daily = readJson(artifactsPath('evidence', 'go-live-daily.json'));

  const blockers = computeBlockers();

  return res.json({
    ok: blockers.ok,
    generatedAt: new Date().toISOString(),
    blockers,
    launchGates: launch,
    uat,
    rollback,
    evidence,
    daily,
  });
};

export const refreshGoLiveReports = async (req: Request, res: Response) => {
  const blockers = computeBlockers();
  writeJsonAtomic(artifactsPath('evidence', 'go-live-blockers.json'), blockers);
  return res.json({ ok: true, blockers });
};

export const updateUatSignoffArtifact = async (req: Request, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'INVALID_BODY' });
  writeJsonAtomic(artifactsPath('uat', 'role-signoff.json'), body);
  return res.json({ ok: true });
};

export const updateRollbackDrillArtifact = async (req: Request, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'INVALID_BODY' });
  writeJsonAtomic(artifactsPath('rollback', 'drill-report.json'), body);
  return res.json({ ok: true });
};

