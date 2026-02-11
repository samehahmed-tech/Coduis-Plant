import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

type Check = {
    name: string;
    ok: boolean;
    detail: string;
    level: 'required' | 'recommended';
};

const { Pool } = pg;

const REQUIRED_CORE_ENV = ['DATABASE_URL', 'JWT_SECRET', 'AUDIT_HMAC_SECRET'] as const;
const ETA_ENV = [
    'ETA_BASE_URL',
    'ETA_TOKEN_URL',
    'ETA_CLIENT_ID',
    'ETA_CLIENT_SECRET',
    'ETA_API_KEY',
    'ETA_PRIVATE_KEY',
    'ETA_RIN',
] as const;
const SMTP_ENV = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] as const;
const S3_ENV = ['S3_REGION', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const;

const get = (key: string) => (process.env[key] || '').trim();
const isSet = (key: string) => get(key).length > 0;

const majorNode = Number((process.versions.node || '0').split('.')[0] || 0);
const checks: Check[] = [];

checks.push({
    name: 'Node version',
    ok: majorNode >= 18,
    detail: `Detected ${process.versions.node}. Required >= 18.`,
    level: 'required',
});

for (const key of REQUIRED_CORE_ENV) {
    checks.push({
        name: `Env ${key}`,
        ok: isSet(key),
        detail: isSet(key) ? 'configured' : 'missing',
        level: 'required',
    });
}

const corsOrigins = get('CORS_ORIGINS');
checks.push({
    name: 'CORS_ORIGINS',
    ok: corsOrigins.length > 0 && !corsOrigins.includes('*'),
    detail: corsOrigins.length === 0 ? 'missing' : corsOrigins.includes('*') ? 'contains wildcard (*)' : corsOrigins,
    level: 'recommended',
});

const anyEtaConfigured = ETA_ENV.some((key) => isSet(key));
if (anyEtaConfigured) {
    const missingEta = ETA_ENV.filter((key) => !isSet(key));
    checks.push({
        name: 'ETA configuration',
        ok: missingEta.length === 0,
        detail: missingEta.length === 0 ? 'configured' : `missing: ${missingEta.join(', ')}`,
        level: 'required',
    });
} else {
    checks.push({
        name: 'ETA configuration',
        ok: false,
        detail: 'not configured (required only if fiscal submission is in scope)',
        level: 'recommended',
    });
}

const anySmtpConfigured = SMTP_ENV.some((key) => isSet(key));
if (anySmtpConfigured) {
    const missing = SMTP_ENV.filter((key) => !isSet(key));
    checks.push({
        name: 'SMTP configuration',
        ok: missing.length === 0,
        detail: missing.length === 0 ? 'configured' : `missing: ${missing.join(', ')}`,
        level: 'required',
    });
} else {
    checks.push({
        name: 'SMTP configuration',
        ok: false,
        detail: 'not configured (required only if day-close email is in scope)',
        level: 'recommended',
    });
}

const anyS3Configured = S3_ENV.some((key) => isSet(key));
if (anyS3Configured) {
    const missing = S3_ENV.filter((key) => !isSet(key));
    checks.push({
        name: 'S3 configuration',
        ok: missing.length === 0,
        detail: missing.length === 0 ? 'configured' : `missing: ${missing.join(', ')}`,
        level: 'required',
    });
} else {
    checks.push({
        name: 'S3 configuration',
        ok: true,
        detail: 'not configured (image upload will use URL mode/manual references)',
        level: 'recommended',
    });
}

const checkDb = async () => {
    if (!isSet('DATABASE_URL')) {
        checks.push({
            name: 'Database connectivity',
            ok: false,
            detail: 'skipped because DATABASE_URL is missing',
            level: 'required',
        });
        return;
    }

    const pool = new Pool({ connectionString: get('DATABASE_URL') });
    try {
        await pool.query('select 1');
        checks.push({
            name: 'Database connectivity',
            ok: true,
            detail: 'connected',
            level: 'required',
        });
    } catch (error: any) {
        checks.push({
            name: 'Database connectivity',
            ok: false,
            detail: error?.message || 'connection failed',
            level: 'required',
        });
    } finally {
        await pool.end().catch(() => undefined);
    }
};

const printSummary = () => {
    const requiredFailed = checks.filter((c) => c.level === 'required' && !c.ok);
    const recommendedFailed = checks.filter((c) => c.level === 'recommended' && !c.ok);

    for (const c of checks) {
        const status = c.ok ? 'PASS' : c.level === 'required' ? 'FAIL' : 'WARN';
        console.log(`[${status}] (${c.level}) ${c.name} - ${c.detail}`);
    }

    console.log('');
    console.log(JSON.stringify({
        ok: requiredFailed.length === 0,
        requiredFailed: requiredFailed.map((c) => ({ name: c.name, detail: c.detail })),
        recommendedWarnings: recommendedFailed.map((c) => ({ name: c.name, detail: c.detail })),
    }, null, 2));

    if (requiredFailed.length > 0) {
        process.exit(1);
    }
};

const main = async () => {
    await checkDb();
    printSummary();
};

main().catch((error) => {
    console.error('Preflight check crashed:', error?.message || error);
    process.exit(1);
});
