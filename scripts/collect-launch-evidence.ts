import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

type Step = {
    name: string;
    command: string;
    required: boolean;
    reportPath?: string;
};

type StepResult = {
    name: string;
    command: string;
    required: boolean;
    ok: boolean;
    exitCode: number | null;
    durationMs: number;
    reportPath?: string;
    parsedReport?: any;
    stdoutTail: string;
    stderrTail: string;
};

const outputPath = process.env.EVIDENCE_MANIFEST_PATH || 'artifacts/evidence/launch-evidence-manifest.json';

const tail = (value: string, max = 2000) => {
    if (value.length <= max) return value;
    return value.slice(value.length - max);
};

const tryReadJson = (path?: string) => {
    if (!path) return undefined;
    try {
        const raw = readFileSync(path, 'utf8');
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
};

const run = (step: Step): StepResult => {
    const started = Date.now();
    const res = spawnSync(step.command, {
        shell: true,
        encoding: 'utf8',
        env: process.env,
    });

    return {
        name: step.name,
        command: step.command,
        required: step.required,
        ok: res.status === 0,
        exitCode: res.status,
        durationMs: Date.now() - started,
        reportPath: step.reportPath,
        parsedReport: tryReadJson(step.reportPath),
        stdoutTail: tail(String(res.stdout || '').trim()),
        stderrTail: tail(String(res.stderr || '').trim()),
    };
};

const steps: Step[] = [
    {
        name: 'launch-gates',
        command: 'npm run ops:launch-gates',
        required: true,
        reportPath: 'artifacts/gates/launch-gates.json',
    },
    {
        name: 'realtime-bench',
        command: 'npm run load:realtime:bench',
        required: true,
        reportPath: 'artifacts/load/realtime-bench-summary.json',
    },
];

if (String(process.env.INCLUDE_ROLLBACK_CHECK || '').toLowerCase() === 'true') {
    steps.push({
        name: 'rollback-drill-check',
        command: 'npm run ops:rollback-drill-check',
        required: true,
        reportPath: process.env.ROLLBACK_DRILL_REPORT_PATH || undefined,
    });
}

const results = steps.map(run);
const failedRequired = results.filter((r) => r.required && !r.ok);

const manifest = {
    ok: failedRequired.length === 0,
    generatedAt: new Date().toISOString(),
    summary: {
        total: results.length,
        passed: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        failedRequired: failedRequired.length,
    },
    results,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log(JSON.stringify(manifest, null, 2));
if (!manifest.ok) process.exit(2);
