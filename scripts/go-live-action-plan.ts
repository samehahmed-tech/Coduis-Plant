import fs from 'node:fs';
import path from 'node:path';

type Action = {
  title: string;
  severity: 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW';
  why: string;
  how: string[];
  evidence?: string[];
};

const readJson = (p: string) => {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
};

const get = (key: string) => (process.env[key] || '').trim();
const isEnabled = (key: string, fallback = false) => {
  const raw = get(key).toLowerCase();
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw);
};

const asUpper = (v: unknown) => String(v || '').toUpperCase();

const main = () => {
  const root = process.cwd();
  const blockersPath = path.join(root, 'artifacts', 'evidence', 'go-live-blockers.json');
  const gatesPath = path.join(root, 'artifacts', 'gates', 'launch-gates.json');
  const uatPath = path.join(root, 'artifacts', 'uat', 'role-signoff.json');
  const rollbackPath = path.join(root, 'artifacts', 'rollback', 'drill-report.json');

  const blockers = readJson(blockersPath);
  const gates = readJson(gatesPath);
  const uat = readJson(uatPath);
  const rollback = readJson(rollbackPath);

  const actions: Action[] = [];

  const REQUIRE_ETA = isEnabled('GO_LIVE_REQUIRE_ETA', false);
  const REQUIRE_REDIS_REALTIME =
    isEnabled('GO_LIVE_REQUIRE_REDIS_REALTIME', false) || isEnabled('SOCKET_REDIS_ENABLED', false);

  // 1) ETA
  const etaGate = Array.isArray(gates?.results) ? gates.results.find((r: any) => String(r.name) === 'eta-config-check') : null;
  const etaOk = etaGate ? Boolean(etaGate.ok) && !etaGate.skipped : false;
  if (REQUIRE_ETA && !etaOk) {
    actions.push({
      title: 'Configure ETA production credentials (Egypt fiscal)',
      severity: 'BLOCKER',
      why: 'GO_LIVE_REQUIRE_ETA=true but ETA env is missing or gate is failing.',
      how: [
        'Fill required `ETA_*` variables in production env (see `.env.production.example`).',
        'Re-run: `npm run eta:check` then `npm run eta:smoke`.',
        'Then re-run: `npm run ops:launch-gates`.',
      ],
      evidence: ['artifacts/gates/launch-gates.json', 'scripts/eta-config-check.ts', 'scripts/eta-e2e-smoke.ts'],
    });
  } else if (!REQUIRE_ETA) {
    actions.push({
      title: 'Decide ETA launch scope',
      severity: 'MEDIUM',
      why: 'ETA gates are optional unless GO_LIVE_REQUIRE_ETA=true.',
      how: [
        'If ETA is in scope for Egypt go-live: set `GO_LIVE_REQUIRE_ETA=true` and configure `ETA_*`.',
        'If not in scope for this launch: keep `GO_LIVE_REQUIRE_ETA=false` and ensure fiscal UI is disabled/hidden per branch policy.',
      ],
      evidence: ['scripts/go-live-preflight.ts', '.env.production.example'],
    });
  }

  // 2) Redis realtime gate
  const redisGate = Array.isArray(gates?.results) ? gates.results.find((r: any) => String(r.name) === 'realtime-redis-gate') : null;
  const redisOk = redisGate ? Boolean(redisGate.ok) && !redisGate.skipped : false;
  if (REQUIRE_REDIS_REALTIME && !redisOk) {
    actions.push({
      title: 'Close Redis realtime adapter gate (multi-instance scaling)',
      severity: 'BLOCKER',
      why: 'SOCKET_REDIS_ENABLED/GO_LIVE_REQUIRE_REDIS_REALTIME is enabled but realtime redis gate is failing.',
      how: [
        'Ensure backend is running and reachable at `HEALTH_API_BASE_URL` (default `http://localhost:3001/api`).',
        'Set `SOCKET_REDIS_URL=redis://...` and enable `SOCKET_REDIS_ENABLED=true` in the server environment.',
        'Re-run: `npm run ops:realtime-gate`.',
      ],
      evidence: ['scripts/realtime-redis-gate.ts', 'artifacts/gates/launch-gates.json'],
    });
  } else if (!REQUIRE_REDIS_REALTIME) {
    actions.push({
      title: 'Decide realtime scaling scope',
      severity: 'LOW',
      why: 'Redis adapter is required only when running multiple backend instances or when explicitly enabled.',
      how: [
        'If production will run multiple instances: set `SOCKET_REDIS_ENABLED=true` + `SOCKET_REDIS_URL` and pass `ops:realtime-gate`.',
        'If single instance only: keep it disabled, but document the scaling constraint.',
      ],
      evidence: ['docs/GO_LIVE_READINESS.md', '.env.production.example'],
    });
  }

  // 3) UAT signoff
  const roles = Array.isArray(uat?.roles) ? uat.roles : [];
  const pendingRoles = roles.filter((r: any) => asUpper(r.status) !== 'PASS');
  if (roles.length === 0) {
    actions.push({
      title: 'Initialize UAT signoff artifact',
      severity: 'HIGH',
      why: 'No roles found in role-signoff.json.',
      how: [
        'Run: `npm run ops:sync-launch-templates`.',
        'Assign owners and start executing the role test matrix in `artifacts/uat/role-signoff.json`.',
        'Validate continuously with: `npm run ops:uat-signoff-check`.',
      ],
      evidence: ['artifacts/uat/role-signoff.json', 'docs/UAT_EXECUTION_PACK.md'],
    });
  } else if (pendingRoles.length > 0) {
    actions.push({
      title: 'Complete UAT per role (sign-off gate)',
      severity: 'BLOCKER',
      why: `Pending/failing roles: ${pendingRoles.map((r: any) => r.role || r.id || 'UNKNOWN').join(', ')}`,
      how: [
        'For each role: set `owner`, execute test cases, attach evidence fields, set `status=PASS`.',
        'Re-run: `npm run ops:uat-signoff-check` until PASS.',
      ],
      evidence: ['artifacts/uat/role-signoff.json', 'scripts/uat-signoff-check.ts'],
    });
  }

  // 4) Rollback drill
  const timing = rollback?.timing || {};
  const approvals = rollback?.approvals || {};
  const hasTimings =
    Number.isFinite(Number(timing?.detectionToRollbackStartMinutes)) &&
    Number.isFinite(Number(timing?.rollbackDurationMinutes)) &&
    Number.isFinite(Number(timing?.recoveryVerificationMinutes));
  const approved = Boolean(approvals?.ops && approvals?.product);
  const checklist = Array.isArray(rollback?.checklist) ? rollback.checklist : [];
  const checklistIncomplete = checklist.filter((c: any) => !c?.completed);

  if (!rollback) {
    actions.push({
      title: 'Initialize rollback drill artifact',
      severity: 'HIGH',
      why: 'Rollback drill report is missing.',
      how: [
        'Run: `npm run ops:sync-launch-templates`.',
        'Execute the drill and fill timing + approvals.',
        'Validate with: `npm run ops:rollback-drill-check`.',
      ],
      evidence: ['docs/ROLLBACK_DRILL_PLAYBOOK.md', 'artifacts/rollback/drill-report.json'],
    });
  } else if (!hasTimings || !approved || checklistIncomplete.length > 0) {
    actions.push({
      title: 'Execute and record rollback drill (measurable + approved)',
      severity: 'BLOCKER',
      why: `timings=${hasTimings ? 'ok' : 'missing'} approvals=${approved ? 'ok' : 'missing'} checklistIncomplete=${checklistIncomplete.length}`,
      how: [
        'Run the drill steps from `docs/ROLLBACK_DRILL_PLAYBOOK.md`.',
        'Fill `artifacts/rollback/drill-report.json`: timing fields + mark checklist items `completed=true` + set `approvals.ops/product=true`.',
        'Re-run: `npm run ops:rollback-drill-check`.',
      ],
      evidence: ['docs/ROLLBACK_DRILL_PLAYBOOK.md', 'scripts/rollback-drill-check.ts'],
    });
  }

  // 5) Pilot execution (still field work, but keep it explicit)
  actions.push({
    title: 'Run pilot branch for 7-14 days with daily evidence',
    severity: 'HIGH',
    why: 'This is the last real-world confidence gate before market go-live.',
    how: [
      'Run daily: `npm run ops:go-live:daily` and keep `artifacts/evidence/go-live-daily.json` history.',
      'Log operational incidents and fixes in `artifacts/pilot/<date>/daily-log.md`.',
      'At end: close remaining blockers then generate final manifest with `npm run ops:collect-evidence`.',
    ],
    evidence: ['docs/PILOT_BRANCH_RUNBOOK.md', 'docs/PILOT_DAILY_LOG_TEMPLATE.md'],
  });

  const report = {
    generatedAt: new Date().toISOString(),
    flags: {
      requireEta: REQUIRE_ETA,
      requireRedisRealtime: REQUIRE_REDIS_REALTIME,
      socketRedisEnabled: isEnabled('SOCKET_REDIS_ENABLED', false),
    },
    currentBlockers: blockers?.blockers || [],
    actions,
  };

  const outDir = path.join(root, 'artifacts', 'evidence');
  fs.mkdirSync(outDir, { recursive: true });
  const outJson = path.join(outDir, 'go-live-action-plan.json');
  const outMd = path.join(outDir, 'go-live-action-plan.md');

  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf8');

  const md = [
    '# Go-Live Action Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Flags',
    '',
    `- requireEta: \`${report.flags.requireEta}\``,
    `- requireRedisRealtime: \`${report.flags.requireRedisRealtime}\``,
    `- socketRedisEnabled: \`${report.flags.socketRedisEnabled}\``,
    '',
    '## Current Blockers (from tooling)',
    '',
    ...(Array.isArray(report.currentBlockers) && report.currentBlockers.length > 0
      ? report.currentBlockers.map((b: any) => `- ${b.ok ? '[PASS]' : '[FAIL]'} \`${b.key}\`: ${b.details}`)
      : ['- (none)']),
    '',
    '## Actions',
    '',
    ...actions.flatMap((a) => [
      `### ${a.severity}: ${a.title}`,
      '',
      `Why: ${a.why}`,
      '',
      'How:',
      ...a.how.map((x) => `- ${x}`),
      ...(a.evidence && a.evidence.length > 0 ? ['', 'Evidence:', ...a.evidence.map((e) => `- \`${e}\``)] : []),
      '',
    ]),
  ].join('\n');

  fs.writeFileSync(outMd, md, 'utf8');

  console.log(JSON.stringify({ ok: true, outJson, outMd, actions: actions.length }, null, 2));
};

main();

