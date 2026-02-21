import * as dotenv from 'dotenv';
import { io, Socket } from 'socket.io-client';

dotenv.config({ path: ['.env.local', '.env'] as any });

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const SOCKET_BASE = process.env.SOCKET_BASE || API_BASE;
let AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const BRANCH_ID = process.env.BRANCH_ID || 'b1';
const args = process.argv.slice(2);
const readArg = (name: string) => {
    const prefix = `--${name}=`;
    const found = args.find((arg) => arg.startsWith(prefix));
    return found ? found.slice(prefix.length) : undefined;
};
const API_REQUESTS = Number(readArg('api-requests') || process.env.API_REQUESTS || 200);
const WS_CLIENTS = Number(readArg('ws-clients') || process.env.WS_CLIENTS || 200);
const WS_HOLD_MS = Number(readArg('ws-hold-ms') || process.env.WS_HOLD_MS || 10000);
const ASSERT_MAX_FAILURE_RATE = Number(readArg('assert-max-failure-rate') || process.env.ASSERT_MAX_FAILURE_RATE || 0.01);
const REPORT_PATH = readArg('report-path') || process.env.REPORT_PATH || '';

const loginForToken = async (): Promise<{ ok: boolean; token?: string; error?: string; hint?: string }> => {
    const email = (process.env.LOAD_AUTH_EMAIL || '').trim();
    const password = process.env.LOAD_AUTH_PASSWORD || '';
    const deviceName = (process.env.LOAD_AUTH_DEVICE_NAME || 'realtime-load-runner').trim();
    if (!email || !password) {
        return {
            ok: false,
            error: 'LOAD_AUTH_EMAIL/LOAD_AUTH_PASSWORD not set',
            hint: 'Run: `npm run ops:dev:init` to generate `.env.local` with LOAD_AUTH_* automatically (dev only).',
        };
    }

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, deviceName }),
        });
        const body: any = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: body?.error || `login failed (${res.status})` };
        if (body?.mfaRequired) return { ok: false, error: 'MFA_REQUIRED (cannot auto-login for load tests)' };
        const token = String(body?.token || '').trim();
        if (!token) return { ok: false, error: 'login did not return token' };
        return { ok: true, token };
    } catch (e: any) {
        const msg = e?.message || 'login fetch failed';
        return {
            ok: false,
            error: msg,
            hint: msg.includes('fetch failed') ? `Backend not reachable at ${API_BASE}. Start it with: \`npm run server\` (or \`npm run dev:full\`).` : undefined,
        };
    }
};

const jsonRequest = async (url: string) => {
    const res = await fetch(url);
    return {
        ok: res.ok,
        status: res.status,
    };
};

const runApiLoad = async () => {
    const started = Date.now();
    const tasks = Array.from({ length: API_REQUESTS }).map(() => jsonRequest(`${API_BASE}/api/health`));
    const results = await Promise.allSettled(tasks);
    const fulfilled = results.filter((r) => r.status === 'fulfilled') as Array<PromiseFulfilledResult<{ ok: boolean; status: number }>>;
    const failed = results.length - fulfilled.length;
    const ok = fulfilled.filter((r) => r.value.ok).length;
    const elapsedMs = Date.now() - started;

    return {
        total: results.length,
        ok,
        failed,
        elapsedMs,
        rps: Math.round((results.length / Math.max(elapsedMs, 1)) * 1000),
    };
};

const createWsClient = () => {
    const socket: Socket = io(SOCKET_BASE, {
        transports: ['websocket'],
        auth: AUTH_TOKEN ? { token: AUTH_TOKEN } : undefined,
        reconnection: false,
        timeout: 10000,
    });
    return socket;
};

const runWsLoad = async () => {
    if (!AUTH_TOKEN) {
        return {
            skipped: true,
            reason: 'AUTH_TOKEN is missing',
        };
    }

    let connected = 0;
    let failed = 0;
    let disconnected = 0;
    const sockets: Socket[] = [];
    const settled: Promise<void>[] = [];

    for (let i = 0; i < WS_CLIENTS; i += 1) {
        const socket = createWsClient();
        sockets.push(socket);
        settled.push(new Promise((resolve) => {
            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                resolve();
            };

            socket.on('connect', () => {
                connected += 1;
                socket.emit('join', BRANCH_ID);
                finish();
            });

            socket.on('connect_error', () => {
                failed += 1;
                finish();
            });
        }));
    }

    await Promise.all(settled);
    await new Promise((resolve) => setTimeout(resolve, WS_HOLD_MS));
    for (const socket of sockets) {
        if (socket.connected) {
            socket.disconnect();
            disconnected += 1;
        }
    }

    return {
        skipped: false,
        total: WS_CLIENTS,
        connected,
        failed,
        disconnected,
    };
};

const run = async () => {
    let tokenSource: 'env' | 'login' | 'missing' = AUTH_TOKEN ? 'env' : 'missing';
    let authError: string | undefined;
    let authHint: string | undefined;
    if (!AUTH_TOKEN) {
        const login = await loginForToken();
        if (login.ok && login.token) {
            AUTH_TOKEN = login.token;
            tokenSource = 'login';
        } else {
            authError = login.error;
            authHint = login.hint;
        }
    }

    const api = await runApiLoad();
    const ws = AUTH_TOKEN ? await runWsLoad() : {
        skipped: true,
        reason: authError ? `AUTH_TOKEN missing (auto-login failed: ${authError})` : 'AUTH_TOKEN is missing',
        hint: authHint,
    };
    const apiFailureRate = api.total > 0 ? api.failed / api.total : 0;
    const wsFailureRate = (typeof ws === 'object' && !('reason' in ws) && ws.total > 0) ? ws.failed / ws.total : 0;
    const wsRequired = WS_CLIENTS > 0;
    const wsPassed = !wsRequired || (('skipped' in ws && !ws.skipped) ? wsFailureRate <= ASSERT_MAX_FAILURE_RATE : false);
    const passed = apiFailureRate <= ASSERT_MAX_FAILURE_RATE && wsPassed;

    const report = {
        api,
        ws,
        result: {
            apiFailureRate,
            wsFailureRate,
            wsRequired,
            wsPassed,
            maxAllowedFailureRate: ASSERT_MAX_FAILURE_RATE,
            passed,
        },
        config: {
            API_BASE,
            SOCKET_BASE,
            BRANCH_ID,
            API_REQUESTS,
            WS_CLIENTS,
            WS_HOLD_MS,
            hasToken: Boolean(AUTH_TOKEN),
            tokenSource,
            authError: authError || null,
        },
    };

    if (REPORT_PATH) {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const dir = path.dirname(REPORT_PATH);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
    }

    console.log(JSON.stringify(report, null, 2));
    if (!passed) {
        process.exit(2);
    }
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
