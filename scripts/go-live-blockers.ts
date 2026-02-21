import fs from 'node:fs';
import path from 'node:path';

type Blocker = { key: string; ok: boolean; details: string };

const get = (key: string) => (process.env[key] || '').trim();
const isEnabled = (key: string, fallback = false) => {
  const raw = get(key).toLowerCase();
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw);
};

const readJson = (p: string) => {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
};

const main = () => {
  const root = process.cwd();
  const launchGatesPath = path.join(root, 'artifacts', 'gates', 'launch-gates.json');
  const uatPath = path.join(root, 'artifacts', 'uat', 'role-signoff.json');
  const rollbackPath = path.join(root, 'artifacts', 'rollback', 'drill-report.json');

  const launch = readJson(launchGatesPath);
  const uat = readJson(uatPath);
  const rollback = readJson(rollbackPath);

  const blockers: Blocker[] = [];

  const REQUIRE_ETA = isEnabled('GO_LIVE_REQUIRE_ETA', false);
  const REQUIRE_REDIS_REALTIME =
    isEnabled('GO_LIVE_REQUIRE_REDIS_REALTIME', false) || isEnabled('SOCKET_REDIS_ENABLED', false);

  if (!launch) {
    blockers.push({ key: 'launch-gates', ok: false, details: 'launch-gates.json is missing' });
  } else {
    blockers.push({
      key: 'launch-gates',
      ok: Boolean(launch.ok),
      details: `ok=${Boolean(launch.ok)} failedRequired=${launch?.summary?.failedRequired ?? 'n/a'}`,
    });
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
    blockers.push({
      key: 'uat-signoff',
      ok: pending === 0 && roles.length > 0,
      details: `roles=${roles.length} pending_or_fail=${pending}`,
    });
  }

  if (!rollback) {
    blockers.push({ key: 'rollback-drill', ok: false, details: 'drill-report.json is missing' });
  } else {
    const timings = rollback?.timing || {};
    const approvals = rollback?.approvals || {};
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
  const report = {
    ok,
    generatedAt: new Date().toISOString(),
    blockers,
    summary: {
      total: blockers.length,
      failed: blockers.filter((b) => !b.ok).length,
    },
  };

  const outDir = path.join(root, 'artifacts', 'evidence');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'go-live-blockers.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report, null, 2));
  if (!ok) process.exit(1);
};

main();
