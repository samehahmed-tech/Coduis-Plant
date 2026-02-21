import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

type StepResult = {
  name: string;
  command: string;
  ok: boolean;
  exitCode: number;
  durationMs: number;
};

const run = (name: string, command: string): StepResult => {
  const startedAt = Date.now();
  const result = spawnSync(command, { shell: true, stdio: 'inherit' });
  const exitCode = typeof result.status === 'number' ? result.status : 1;
  return {
    name,
    command,
    ok: exitCode === 0,
    exitCode,
    durationMs: Date.now() - startedAt,
  };
};

const main = () => {
  const steps = [
    { name: 'platform-health', command: 'npm run ops:platform-health' },
    { name: 'launch-gates', command: 'npm run ops:launch-gates' },
    { name: 'go-live-blockers', command: 'npm run ops:go-live:blockers' },
    { name: 'go-live-plan', command: 'npm run ops:go-live:plan' },
    { name: 'uat-signoff-check', command: 'npm run ops:uat-signoff-check' },
    { name: 'rollback-drill-check', command: 'npm run ops:rollback-drill-check' },
    { name: 'collect-evidence', command: 'npm run ops:collect-evidence' },
  ];

  const results = steps.map((s) => run(s.name, s.command));
  const ok = results.every((r) => r.ok);
  const report = {
    ok,
    generatedAt: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    },
    results,
  };

  const outDir = path.join(process.cwd(), 'artifacts', 'evidence');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'go-live-daily.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(JSON.stringify(report, null, 2));
  if (!ok) process.exit(1);
};

main();
