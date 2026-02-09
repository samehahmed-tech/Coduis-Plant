import * as dotenv from 'dotenv';
import { io, Socket } from 'socket.io-client';

dotenv.config();

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const SOCKET_BASE = process.env.SOCKET_BASE || API_BASE;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const BRANCH_ID = process.env.BRANCH_ID || 'b1';
const API_REQUESTS = Number(process.env.API_REQUESTS || 200);
const WS_CLIENTS = Number(process.env.WS_CLIENTS || 200);
const WS_HOLD_MS = Number(process.env.WS_HOLD_MS || 10000);

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
    const api = await runApiLoad();
    const ws = await runWsLoad();

    console.log(JSON.stringify({
        api,
        ws,
        config: {
            API_BASE,
            SOCKET_BASE,
            BRANCH_ID,
            API_REQUESTS,
            WS_CLIENTS,
            WS_HOLD_MS,
            hasToken: Boolean(AUTH_TOKEN),
        },
    }, null, 2));
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
