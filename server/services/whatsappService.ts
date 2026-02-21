type WhatsAppProvider = 'mock' | 'meta' | 'twilio';

export type WhatsAppSendPayload = {
    to: string;
    text: string;
};

export type WhatsAppSendResult = {
    provider: WhatsAppProvider;
    messageId: string;
    to: string;
    acceptedAt: string;
};

const getProvider = (): WhatsAppProvider => {
    const raw = String(process.env.WHATSAPP_PROVIDER || 'mock').trim().toLowerCase();
    if (raw === 'meta') return 'meta';
    if (raw === 'twilio') return 'twilio';
    return 'mock';
};

const normalizePhone = (value: string) => value.replace(/[^\d+]/g, '').trim();

const sendViaMeta = async (payload: WhatsAppSendPayload): Promise<WhatsAppSendResult> => {
    const token = String(process.env.WHATSAPP_META_TOKEN || '').trim();
    const phoneNumberId = String(process.env.WHATSAPP_META_PHONE_NUMBER_ID || '').trim();
    if (!token || !phoneNumberId) {
        throw new Error('WHATSAPP_META_CONFIG_MISSING');
    }

    const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: normalizePhone(payload.to),
            type: 'text',
            text: { body: payload.text },
        }),
    });

    const body: any = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(body?.error?.message || `WHATSAPP_META_HTTP_${response.status}`);
    }

    return {
        provider: 'meta',
        messageId: String(body?.messages?.[0]?.id || `meta-${Date.now()}`),
        to: normalizePhone(payload.to),
        acceptedAt: new Date().toISOString(),
    };
};

const sendViaTwilio = async (payload: WhatsAppSendPayload): Promise<WhatsAppSendResult> => {
    const sid = String(process.env.WHATSAPP_TWILIO_ACCOUNT_SID || '').trim();
    const authToken = String(process.env.WHATSAPP_TWILIO_AUTH_TOKEN || '').trim();
    const from = String(process.env.WHATSAPP_TWILIO_FROM || '').trim();
    if (!sid || !authToken || !from) {
        throw new Error('WHATSAPP_TWILIO_CONFIG_MISSING');
    }

    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const form = new URLSearchParams({
        From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
        To: payload.to.startsWith('whatsapp:') ? payload.to : `whatsapp:${normalizePhone(payload.to)}`,
        Body: payload.text,
    });

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
    });

    const body: any = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(body?.message || `WHATSAPP_TWILIO_HTTP_${response.status}`);
    }

    return {
        provider: 'twilio',
        messageId: String(body?.sid || `twilio-${Date.now()}`),
        to: normalizePhone(payload.to),
        acceptedAt: new Date().toISOString(),
    };
};

const sendViaMock = async (payload: WhatsAppSendPayload): Promise<WhatsAppSendResult> => ({
    provider: 'mock',
    messageId: `mock-${Date.now()}`,
    to: normalizePhone(payload.to),
    acceptedAt: new Date().toISOString(),
});

export const getWhatsAppProviderStatus = () => {
    const provider = getProvider();
    if (provider === 'meta') {
        return {
            provider,
            configured: Boolean(process.env.WHATSAPP_META_TOKEN && process.env.WHATSAPP_META_PHONE_NUMBER_ID),
        };
    }
    if (provider === 'twilio') {
        return {
            provider,
            configured: Boolean(
                process.env.WHATSAPP_TWILIO_ACCOUNT_SID &&
                process.env.WHATSAPP_TWILIO_AUTH_TOKEN &&
                process.env.WHATSAPP_TWILIO_FROM
            ),
        };
    }
    return { provider, configured: true };
};

export const sendWhatsAppText = async (payload: WhatsAppSendPayload): Promise<WhatsAppSendResult> => {
    const to = normalizePhone(payload.to);
    const text = String(payload.text || '').trim();
    if (!to) throw new Error('WHATSAPP_TO_REQUIRED');
    if (!text) throw new Error('WHATSAPP_TEXT_REQUIRED');
    if (text.length > 4096) throw new Error('WHATSAPP_TEXT_TOO_LONG');

    const provider = getProvider();
    if (provider === 'meta') return sendViaMeta({ to, text });
    if (provider === 'twilio') return sendViaTwilio({ to, text });
    return sendViaMock({ to, text });
};
