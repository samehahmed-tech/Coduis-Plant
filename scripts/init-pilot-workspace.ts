import { mkdirSync, existsSync, copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dateKey = process.env.PILOT_DATE || new Date().toISOString().slice(0, 10);
const branchId = process.env.PILOT_BRANCH_ID || 'b1';

const base = join('artifacts', 'pilot', dateKey);
const uatDir = join('artifacts', 'uat');

mkdirSync(base, { recursive: true });
mkdirSync(uatDir, { recursive: true });

const dailyLogPath = join(base, 'daily-log.md');
if (!existsSync(dailyLogPath)) {
    copyFileSync('docs/PILOT_DAILY_LOG_TEMPLATE.md', dailyLogPath);
}

const uatSignoffPath = join(uatDir, 'role-signoff.json');
if (!existsSync(uatSignoffPath)) {
    copyFileSync('docs/UAT_ROLE_SIGNOFF_TEMPLATE.json', uatSignoffPath);
}

const metaPath = join(base, 'pilot-meta.json');
writeFileSync(metaPath, JSON.stringify({
    branchId,
    dateKey,
    createdAt: new Date().toISOString(),
    files: {
        dailyLogPath,
        uatSignoffPath,
    },
}, null, 2), 'utf8');

console.log(JSON.stringify({
    ok: true,
    branchId,
    dateKey,
    base,
    dailyLogPath,
    uatSignoffPath,
    metaPath,
}, null, 2));
