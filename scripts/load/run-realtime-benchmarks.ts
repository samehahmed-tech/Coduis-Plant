import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const reportPath = process.env.LOAD_BENCH_REPORT_PATH || 'artifacts/load/realtime-bench-summary.json';

type StepResult = {
    name: string;
    command: string;
    ok: boolean;
    exitCode: number | null;
    durationMs: number;
    stdoutTail: string;
    stderrTail: string;
};

const tail = (value: string, max = 2000) => {
    if (value.length <= max) return value;
    return value.slice(value.length - max);
};

const run = (name: string, command: string): StepResult => {
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
        durationMs: Date.now() - started,
        stdoutTail: tail(String(result.stdout || '').trim()),
        stderrTail: tail(String(result.stderr || '').trim()),
    };
};

const steps = [
    { name: 'realtime-500', command: 'npm run load:realtime:500' },
    { name: 'realtime-1000', command: 'npm run load:realtime:1000' },
];

const results = steps.map((s) => run(s.name, s.command));
const report = {
    ok: results.every((r) => r.ok),
    generatedAt: new Date().toISOString(),
    summary: {
        total: results.length,
        passed: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
    },
    results,
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(2);
