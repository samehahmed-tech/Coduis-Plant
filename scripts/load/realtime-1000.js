import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';

const API_BASE = __ENV.API_BASE || 'http://localhost:3001';
const WS_BASE = __ENV.WS_BASE || 'ws://localhost:3001/socket.io/?EIO=4&transport=websocket';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export const options = {
  scenarios: {
    api_smoke: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30s',
      exec: 'apiHealth',
    },
    ws_realtime: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '60s',
      exec: 'wsConnect',
      startTime: '5s',
    },
  },
  thresholds: {
    checks: ['rate>0.95'],
    http_req_failed: ['rate<0.05'],
  },
};

export function apiHealth() {
  const res = http.get(`${API_BASE}/api/health`);
  check(res, {
    'health status 200': (r) => r.status === 200,
  });
  sleep(1);
}

export function wsConnect() {
  const headers = AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};
  const url = AUTH_TOKEN ? `${WS_BASE}&token=${encodeURIComponent(AUTH_TOKEN)}` : WS_BASE;

  const response = ws.connect(url, { headers }, function (socket) {
    socket.on('open', () => {
      check(null, { 'ws connected': () => true });
      // Engine.IO ping support
      socket.send('2');
    });

    socket.on('message', (msg) => {
      if (msg === '3') {
        check(null, { 'ws pong received': () => true });
      }
    });

    socket.on('close', () => {
      check(null, { 'ws closed cleanly': () => true });
    });

    socket.setTimeout(() => {
      socket.close();
    }, 5000);
  });

  check(response, {
    'ws handshake success': (r) => r && r.status === 101,
  });
}
