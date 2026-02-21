const os = require('os');
const path = require('path');
const fs = require('fs');
const envCandidates = [
  process.env.PRINT_GATEWAY_ENV_FILE,
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env'),
].filter(Boolean);
const envPath = envCandidates.find((p) => fs.existsSync(p));
if (envPath) {
  require('dotenv').config({ path: envPath });
}
const express = require('express');
const cors = require('cors');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');
escpos.Network = require('escpos-network');

const app = express();
const PORT = Number(process.env.PRINT_BRIDGE_PORT || 3002);
const BACKEND_BASE = String(process.env.PRINT_BACKEND_URL || 'http://localhost:3001/api/print-gateway/gateway').replace(/\/$/, '');
const GATEWAY_TOKEN = String(
  process.env.PRINT_GATEWAY_TOKEN
  || (process.env.NODE_ENV !== 'production' ? 'dev_print_gateway_token' : '')
).trim();
const GATEWAY_ID = String(process.env.PRINT_GATEWAY_ID || `gw-${os.hostname()}`).trim();
const BRANCH_ID = String(process.env.PRINT_BRANCH_ID || 'b1').trim();
const POLL_MS = Math.max(500, Number(process.env.PRINT_GATEWAY_POLL_MS || 1200));

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const printWithEscpos = async ({ type, content, printerAddress, printerType }) => {
  return new Promise((resolve, reject) => {
    try {
      const safePrinterType = String(printerType || 'LOCAL').toUpperCase();
      let device;
      if (safePrinterType === 'NETWORK') {
        if (!printerAddress) return reject(new Error('PRINTER_ADDRESS_REQUIRED'));
        device = new escpos.Network(String(printerAddress));
      } else {
        device = new escpos.USB();
      }

      const printer = new escpos.Printer(device);
      device.open((error) => {
        if (error) return reject(error);

        // Drawer pulse command can be sent as receipt payload too.
        if (String(type || '').toUpperCase() === 'RECEIPT' && content === '\x1B\x70\x00\x19\xFA') {
          printer.raw(content).close();
          return resolve(true);
        }

        printer
          .font('a')
          .align('lt')
          .style('normal')
          .size(1, 1)
          .text(String(content || ''))
          .cut()
          .close();
        return resolve(true);
      });
    } catch (error) {
      return reject(error);
    }
  });
};

app.get('/health', async (_req, res) => {
  res.json({
    ok: true,
    service: 'print-gateway',
    gatewayId: GATEWAY_ID,
    branchId: BRANCH_ID,
    backendBase: BACKEND_BASE,
    hasGatewayToken: Boolean(GATEWAY_TOKEN),
    ts: new Date().toISOString(),
  });
});

app.post('/print', async (req, res) => {
  try {
    await printWithEscpos(req.body || {});
    return res.json({ ok: true, status: 'sent' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error.message || error) });
  }
});

const gatewayHeaders = {
  'Content-Type': 'application/json',
  'x-print-gateway-token': GATEWAY_TOKEN,
};

const waitForBackend = async () => {
  while (true) {
    try {
      const healthUrl = BACKEND_BASE.replace(/\/api\/print-gateway\/gateway$/, '/api/health');
      const res = await fetch(healthUrl);
      if (res.ok) {
        console.log(`[gateway] backend reachable: ${healthUrl}`);
        return;
      }
    } catch {
      // ignore until backend is up
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
};

const claimJob = async () => {
  const res = await fetch(`${BACKEND_BASE}/claim`, {
    method: 'POST',
    headers: gatewayHeaders,
    body: JSON.stringify({ gatewayId: GATEWAY_ID, branchId: BRANCH_ID }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`CLAIM_FAILED ${res.status} ${body}`);
  }
  const data = await res.json();
  return data?.job || null;
};

const ackJob = async (jobId) => {
  await fetch(`${BACKEND_BASE}/${encodeURIComponent(jobId)}/ack`, {
    method: 'POST',
    headers: gatewayHeaders,
    body: JSON.stringify({ gatewayId: GATEWAY_ID }),
  });
};

const failJob = async (jobId, errorMessage) => {
  await fetch(`${BACKEND_BASE}/${encodeURIComponent(jobId)}/fail`, {
    method: 'POST',
    headers: gatewayHeaders,
    body: JSON.stringify({ gatewayId: GATEWAY_ID, error: String(errorMessage || 'PRINT_FAILED') }),
  });
};

const loop = async () => {
  if (!GATEWAY_TOKEN) {
    console.warn('[gateway] PRINT_GATEWAY_TOKEN is missing; queue polling disabled.');
    while (true) {
      await new Promise((r) => setTimeout(r, 15000));
    }
  }

  while (true) {
    try {
      const job = await claimJob();
      if (!job) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        continue;
      }

      try {
        await printWithEscpos(job);
        await ackJob(job.id);
        console.log(`[gateway] printed job ${job.id}`);
      } catch (printError) {
        await failJob(job.id, printError?.message || 'PRINT_FAILED');
        console.error(`[gateway] failed job ${job.id}:`, printError?.message || printError);
      }
    } catch (error) {
      console.error('[gateway] polling error:', error?.message || error);
      await new Promise((r) => setTimeout(r, Math.max(POLL_MS, 2000)));
    }
  }
};

app.listen(PORT, () => {
  console.log(`[gateway] listening on http://localhost:${PORT}`);
  console.log(`[gateway] id=${GATEWAY_ID} branch=${BRANCH_ID} backend=${BACKEND_BASE}`);
  (async () => {
    await waitForBackend();
    await loop();
  })().catch((error) => {
    console.error('[gateway] fatal loop error:', error?.message || error);
  });
});


