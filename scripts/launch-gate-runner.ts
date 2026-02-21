import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

type GateResult = {
    name: string;
    command: string;
    ok: boolean;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    durationMs: number;
    skipped?: boolean;
};

const reportPath = process.env.GATE_REPORT_PATH || 'artifacts/gates/launch-gates.json';

const get = (key: string) => (process.env[key] || '').trim();
const isEnabled = (key: string, fallback = false) => {
    const raw = get(key).toLowerCase();
    if (!raw) return fallback;
    return ['1', 'true', 'yes', 'on'].includes(raw);
};

const runCommand = (name: string, command: string): GateResult => {
    const started = Date.now();
    const result = spawnSync(command, {
        shell: true,
        encoding: 'utf8',
        env: process.env,
    });

    return {
        name,
        command,
        ok: result.status === 0,
        exitCode: result.status,
        stdout: String(result.stdout || '').trim(),
        stderr: String(result.stderr || '').trim(),
        durationMs: Date.now() - started,
    };
};

const skipGate = (name: string, command: string, reason: string): GateResult => ({
    name,
    command,
    ok: true,
    exitCode: null,
    stdout: `SKIPPED: ${reason}`,
    stderr: '',
    durationMs: 0,
    skipped: true,
});

// Align with go-live preflight flags:
// - ETA gates required only when GO_LIVE_REQUIRE_ETA=true (or any ETA env is configured).
// - Redis realtime gate required only when SOCKET_REDIS_ENABLED=true (or GO_LIVE_REQUIRE_REDIS_REALTIME=true).
const REQUIRE_ETA = isEnabled('GO_LIVE_REQUIRE_ETA', false);
const REQUIRE_REDIS_REALTIME =
    isEnabled('GO_LIVE_REQUIRE_REDIS_REALTIME', false) || isEnabled('SOCKET_REDIS_ENABLED', false);

const ETA_ENV = [
    'ETA_BASE_URL',
    'ETA_TOKEN_URL',
    'ETA_CLIENT_ID',
    'ETA_CLIENT_SECRET',
    'ETA_API_KEY',
    'ETA_PRIVATE_KEY',
    'ETA_RIN',
] as const;
const anyEtaConfigured = ETA_ENV.some((k) => get(k).length > 0);

const gates: Array<{ name: string; command: string; required: boolean; enabled: boolean; reasonIfSkipped?: string }> = [
    {
        name: 'eta-config-check',
        command: 'npm run eta:check',
        required: REQUIRE_ETA,
        enabled: REQUIRE_ETA || anyEtaConfigured,
        reasonIfSkipped: 'ETA is not required (set GO_LIVE_REQUIRE_ETA=true to enforce)',
    },
    {
        name: 'eta-smoke',
        command: 'npm run eta:smoke',
        required: REQUIRE_ETA,
        enabled: REQUIRE_ETA || anyEtaConfigured,
        reasonIfSkipped: 'ETA is not required (set GO_LIVE_REQUIRE_ETA=true to enforce)',
    },
    {
        name: 'realtime-redis-gate',
        command: 'npm run ops:realtime-gate',
        required: REQUIRE_REDIS_REALTIME,
        enabled: REQUIRE_REDIS_REALTIME,
        reasonIfSkipped: 'Redis realtime adapter not required (enable SOCKET_REDIS_ENABLED=true to enforce)',
    },
];

const results = gates.map((gate) => ({
    ...gate,
    result: gate.enabled ? runCommand(gate.name, gate.command) : skipGate(gate.name, gate.command, gate.reasonIfSkipped || 'disabled'),
}));
const failedRequired = results.filter((r) => r.required && !r.result.ok);

const report = {
    ok: failedRequired.length === 0,
    generatedAt: new Date().toISOString(),
    flags: {
        requireEta: REQUIRE_ETA,
        requireRedisRealtime: REQUIRE_REDIS_REALTIME,
        socketRedisEnabled: isEnabled('SOCKET_REDIS_ENABLED', false),
    },
    summary: {
        total: results.length,
        passed: results.filter((r) => r.result.ok).length,
        failed: results.filter((r) => !r.result.ok).length,
        failedRequired: failedRequired.length,
        skipped: results.filter((r) => r.result.skipped).length,
    },
    results: results.map((r) => ({
        name: r.name,
        required: r.required,
        enabled: r.enabled,
        ...r.result,
    })),
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(2);
