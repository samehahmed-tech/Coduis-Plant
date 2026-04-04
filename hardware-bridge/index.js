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

// ── DRY RUN: Save to file instead of printing ──
const DRY_RUN = String(process.env.PRINT_DRY_RUN || 'false').toLowerCase() === 'true';
const PREVIEW_DIR = path.join(os.homedir(), '.restoflow-previews');
if (!fs.existsSync(PREVIEW_DIR)) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve saved previews as static files
app.use('/previews', express.static(PREVIEW_DIR));

/**
 * DRY RUN: Save content to file instead of real printing
 */
const dryRunPrint = async (job) => {
  const contentType = String(job.contentType || job.content_type || 'text').toLowerCase();
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const type = String(job.type || 'RECEIPT').toLowerCase();

  if (contentType === 'image') {
    const filename = `${type}_${ts}.png`;
    const filepath = path.join(PREVIEW_DIR, filename);
    const imgBuffer = Buffer.from(job.content || '', 'base64');
    fs.writeFileSync(filepath, imgBuffer);
    console.log(`[DRY-RUN] Image receipt saved: ${filepath}`);
    console.log(`[DRY-RUN] View at: http://localhost:${PORT}/previews/${filename}`);
  } else {
    const filename = `${type}_${ts}.txt`;
    const filepath = path.join(PREVIEW_DIR, filename);
    fs.writeFileSync(filepath, job.content || '', 'utf8');
    console.log(`[DRY-RUN] Text receipt saved: ${filepath}`);
    console.log(`[DRY-RUN] View at: http://localhost:${PORT}/previews/${filename}`);
  }
  return true;
};

/**
 * Print image (raster) from base64 PNG data.
 * This enables full Arabic + styled receipt printing.
 */
const printImageWithEscpos = async (job) => {
  const address = job.printerAddress || job.printer_address || '';
  const pType = String(job.printerType || job.printer_type || 'LOCAL').toUpperCase();
  const imageBase64 = job.content || '';

  console.log(`[print-image] type=${pType} address=${address || '(none)'} imageLen=${imageBase64.length}`);

  return new Promise((resolve, reject) => {
    try {
      let device;
      if (address) {
        device = new escpos.Network(String(address));
      } else if (pType === 'NETWORK') {
        return reject(new Error('PRINTER_ADDRESS_REQUIRED'));
      } else {
        try {
          device = new escpos.USB();
        } catch {
          return reject(new Error('NO_USB_PRINTER_FOUND'));
        }
      }

      // Decode base64 to buffer
      const imgBuffer = Buffer.from(imageBase64, 'base64');

      // Save to temp file for escpos.Image
      const tmpFile = path.join(os.tmpdir(), `receipt_${Date.now()}.png`);
      fs.writeFileSync(tmpFile, imgBuffer);

      escpos.Image.load(tmpFile, (image) => {
        if (!image) {
          fs.unlinkSync(tmpFile);
          return reject(new Error('FAILED_TO_LOAD_IMAGE'));
        }

        const printer = new escpos.Printer(device);
        device.open((error) => {
          if (error) {
            fs.unlinkSync(tmpFile);
            return reject(error);
          }

          printer
            .align('ct')
            .raster(image)
            .cut()
            .close(() => {
              fs.unlinkSync(tmpFile);
            });

          return resolve(true);
        });
      });
    } catch (error) {
      return reject(error);
    }
  });
};

/**
 * Print text with escpos.
 */
const printWithEscpos = async (job) => {
  const address = job.printerAddress || job.printer_address || '';
  const pType = String(job.printerType || job.printer_type || 'LOCAL').toUpperCase();
  const type = String(job.type || '').toUpperCase();
  const content = job.content || '';
  console.log(`[print] type=${pType} address=${address || '(none)'} contentLen=${content.length}`);

  return new Promise((resolve, reject) => {
    try {
      let device;
      if (address) {
        device = new escpos.Network(String(address));
      } else if (pType === 'NETWORK') {
        return reject(new Error('PRINTER_ADDRESS_REQUIRED'));
      } else {
        try {
          device = new escpos.USB();
        } catch {
          return reject(new Error('NO_USB_PRINTER_FOUND — configure a NETWORK printer with an IP address'));
        }
      }

      const printer = new escpos.Printer(device);
      device.open((error) => {
        if (error) return reject(error);

        // Drawer pulse command
        if (type === 'RECEIPT' && content === '\x1B\x70\x00\x19\xFA') {
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

/**
 * Smart print — routes to dryRun, image, or text based on mode.
 */
const smartPrint = async (job) => {
  if (DRY_RUN) {
    return dryRunPrint(job);
  }
  const contentType = String(job.contentType || job.content_type || 'text').toLowerCase();
  if (contentType === 'image') {
    return printImageWithEscpos(job);
  }
  return printWithEscpos(job);
};

app.get('/health', async (_req, res) => {
  res.json({
    ok: true,
    service: 'print-gateway',
    dryRun: DRY_RUN,
    gatewayId: GATEWAY_ID,
    branchId: BRANCH_ID,
    backendBase: BACKEND_BASE,
    hasGatewayToken: Boolean(GATEWAY_TOKEN),
    previewDir: PREVIEW_DIR,
    ts: new Date().toISOString(),
  });
});

// Show latest preview in browser
app.get('/preview/latest', async (_req, res) => {
  try {
    const files = fs.readdirSync(PREVIEW_DIR)
      .filter(f => f.endsWith('.png') || f.endsWith('.txt'))
      .sort()
      .reverse();
    if (files.length === 0) {
      return res.send('<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>No previews yet</h2><p>Print a receipt with DRY_RUN enabled first.</p></body></html>');
    }
    const latest = files[0];
    if (latest.endsWith('.png')) {
      res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:20px;background:#f0f0f0">
        <h3 style="color:#333">Receipt Preview (${latest})</h3>
        <img src="/previews/${latest}" style="max-width:400px;border:2px solid #ccc;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15)" />
        <br><br>
        <p style="color:#666;font-size:12px">${files.length} previews saved in ${PREVIEW_DIR}</p>
        </body></html>`);
    } else {
      const content = fs.readFileSync(path.join(PREVIEW_DIR, latest), 'utf8');
      res.send(`<html><body style="font-family:monospace;padding:20px;background:#1a1a1a;color:#0f0">
        <h3 style="color:#fff">Receipt Preview (${latest})</h3>
        <pre style="background:#000;padding:20px;border-radius:8px;border:2px solid #333;max-width:400px;margin:0 auto">${content.replace(/</g, '&lt;')}</pre>
        <br>
        <p style="color:#666;font-size:12px">${files.length} previews saved</p>
        </body></html>`);
    }
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.post('/print', async (req, res) => {
  try {
    await smartPrint(req.body || {});
    return res.json({ ok: true, status: DRY_RUN ? 'dry-run-saved' : 'sent' });
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
        await smartPrint(job);
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
