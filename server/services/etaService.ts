import crypto from 'crypto';
import { requireEnv } from '../config/env';

const ETA_BASE_URL = process.env.ETA_BASE_URL;
const ETA_TOKEN_URL = process.env.ETA_TOKEN_URL;
const ETA_CLIENT_ID = process.env.ETA_CLIENT_ID;
const ETA_CLIENT_SECRET = process.env.ETA_CLIENT_SECRET;
const ETA_API_KEY = process.env.ETA_API_KEY;
const ETA_PRIVATE_KEY = process.env.ETA_PRIVATE_KEY;
const ETA_PRIVATE_KEY_PASSPHRASE = process.env.ETA_PRIVATE_KEY_PASSPHRASE;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getAccessToken = async (): Promise<string> => {
    if (!ETA_TOKEN_URL || !ETA_CLIENT_ID || !ETA_CLIENT_SECRET) {
        throw new Error('ETA token configuration missing');
    }
    const res = await fetch(ETA_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: ETA_CLIENT_ID,
            client_secret: ETA_CLIENT_SECRET,
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`ETA token error: ${text}`);
    }
    const data = await res.json();
    return data.access_token;
};

const signPayload = (payload: any) => {
    if (!ETA_PRIVATE_KEY) return undefined;
    try {
        const signer = crypto.createSign('RSA-SHA256');
        signer.update(JSON.stringify(payload));
        signer.end();
        return signer.sign({ key: ETA_PRIVATE_KEY, passphrase: ETA_PRIVATE_KEY_PASSPHRASE }, 'base64');
    } catch (err: any) {
        throw new Error(`ETA signature failed: ${err.message}`);
    }
};

export const etaService = {
    async submitReceipt(payload: any) {
        if (!ETA_BASE_URL) {
            throw new Error('ETA_BASE_URL is not configured');
        }
        if (!ETA_API_KEY) {
            throw new Error('ETA_API_KEY is not configured');
        }
        const token = await getAccessToken();
        const signature = signPayload(payload);
        const requestBody = signature ? { ...payload, signature } : payload;

        const res = await fetch(`${ETA_BASE_URL.replace(/\/$/, '')}/receipts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-api-key': ETA_API_KEY,
            },
            body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`ETA submit failed: ${text}`);
        }
        return res.json();
    },

    async submitWithRetry(payload: any, retries = 3) {
        let lastError: any;
        for (let attempt = 1; attempt <= retries; attempt += 1) {
            try {
                return await this.submitReceipt(payload);
            } catch (err) {
                lastError = err;
                await sleep(1000 * attempt);
            }
        }
        throw lastError;
    }
};
