import * as dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] as any });

const API_BASE = (process.env.HEALTH_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');
let TOKEN = process.env.HEALTH_TOKEN || '';
const BRANCH_ID = process.env.HEALTH_BRANCH_ID || '';

const loginForToken = async (): Promise<{ ok: boolean; token?: string; error?: string }> => {
    const email = (process.env.HEALTH_AUTH_EMAIL || '').trim();
    const password = process.env.HEALTH_AUTH_PASSWORD || '';
    const deviceName = (process.env.HEALTH_AUTH_DEVICE_NAME || 'ops-health-check').trim();
    if (!email || !password) return { ok: false, error: 'HEALTH_AUTH_EMAIL/HEALTH_AUTH_PASSWORD not set' };

    try {
        const res = await fetch(`${API_BASE.replace(/\/api$/, '')}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, deviceName }),
        });
        const body: any = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: body?.error || `login failed (${res.status})` };
        if (body?.mfaRequired) return { ok: false, error: 'MFA_REQUIRED (cannot auto-login for ops health checks)' };
        const token = String(body?.token || '').trim();
        if (!token) return { ok: false, error: 'login did not return token' };
        return { ok: true, token };
    } catch (e: any) {
        return { ok: false, error: e?.message || 'login fetch failed' };
    }
};

const main = async () => {
    if (!TOKEN) {
        const login = await loginForToken();
        if (login.ok && login.token) TOKEN = login.token;
    }

    const query = BRANCH_ID ? `?branchId=${encodeURIComponent(BRANCH_ID)}` : '';
    const url = `${API_BASE}/ops/platform-health${query}`;
    let res: Response;
    try {
        res = await fetch(url, {
            headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
        });
    } catch (e: any) {
        console.error(JSON.stringify({
            ok: false,
            error: 'BACKEND_UNREACHABLE',
            url,
            hint: 'Start backend with: `npm run server` (or `npm run dev:full`).',
            details: e?.message || String(e),
        }, null, 2));
        process.exit(3);
        return;
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        console.error('[platform-health] request failed', { status: res.status, body });
        process.exit(1);
    }

    const alerts = body?.alerts || {};
    const hasBlocking =
        Boolean(alerts.dbDown) ||
        Boolean(alerts.fiscalConfigMissing) ||
        Boolean(alerts.fiscalLowSuccessRate);

    console.log(JSON.stringify({
        ok: body?.ok === true && !hasBlocking,
        url,
        branchScope: body?.branchScope,
        database: body?.database,
        socket: body?.socket,
        fiscal: body?.fiscal,
        alerts,
    }, null, 2));

    if (hasBlocking) {
        process.exit(2);
    }
};

main().catch((error) => {
    console.error('[platform-health] fatal', error);
    process.exit(1);
});
