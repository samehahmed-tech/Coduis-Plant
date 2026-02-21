import { Request, Response } from 'express';
import { db } from '../db';
import { settings, orders, customers } from '../../src/db/schema';
import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import { sendWhatsAppText } from '../services/whatsappService';

type Campaign = {
    id: string;
    name: string;
    status: 'ACTIVE' | 'AUTOMATED' | 'SCHEDULED' | 'PAUSED';
    method: 'SMS' | 'Email' | 'Push' | 'WHATSAPP';
    discount?: string;
    outreach: number;
    conversions: number;
    spend?: number;
    createdAt: string;
    updatedAt: string;
};

const CAMPAIGN_KEY = 'marketing_campaigns';
const CAMPAIGN_DISPATCH_LOG_KEY = 'marketing_campaign_dispatches_v1';
const MAX_DISPATCH_RECIPIENTS = 500;

const loadCampaigns = async (): Promise<Campaign[]> => {
    const [row] = await db.select().from(settings).where(eq(settings.key, CAMPAIGN_KEY));
    return (row?.value as Campaign[]) || [];
};

const saveCampaigns = async (campaigns: Campaign[], updatedBy?: string) => {
    const payload = {
        key: CAMPAIGN_KEY,
        value: campaigns,
        category: 'marketing',
        updatedBy: updatedBy || 'system',
        updatedAt: new Date(),
    };
    const [existing] = await db.select().from(settings).where(eq(settings.key, CAMPAIGN_KEY));
    if (existing) {
        await db.update(settings)
            .set({ value: campaigns, category: 'marketing', updatedBy: payload.updatedBy, updatedAt: new Date() })
            .where(eq(settings.key, CAMPAIGN_KEY));
        return;
    }
    await db.insert(settings).values(payload as any);
};

export const getCampaigns = async (_req: Request, res: Response) => {
    try {
        const campaigns = await loadCampaigns();
        res.json(campaigns);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createCampaign = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const campaigns = await loadCampaigns();
        const created: Campaign = {
            id: body.id || `CMP-${Date.now()}`,
            name: body.name || 'Untitled Campaign',
            status: body.status || 'SCHEDULED',
            method: body.method || 'SMS',
            discount: body.discount || '',
            outreach: Number(body.outreach || 0),
            conversions: Number(body.conversions || 0),
            spend: Number(body.spend || 0),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const next = [created, ...campaigns];
        await saveCampaigns(next, req.user?.id);
        res.status(201).json(created);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCampaign = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const campaigns = await loadCampaigns();
        const idx = campaigns.findIndex(c => c.id === id);
        if (idx < 0) return res.status(404).json({ error: 'Campaign not found' });
        const updated: Campaign = {
            ...campaigns[idx],
            ...req.body,
            updatedAt: new Date().toISOString(),
        };
        campaigns[idx] = updated;
        await saveCampaigns(campaigns, req.user?.id);
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCampaign = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const campaigns = await loadCampaigns();
        const next = campaigns.filter(c => c.id !== id);
        await saveCampaigns(next, req.user?.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCampaignStats = async (req: Request, res: Response) => {
    try {
        const campaigns = await loadCampaigns();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        const recentOrders = await db.select().from(orders).where(gte(orders.createdAt, start)).orderBy(desc(orders.createdAt));

        const totalReach = campaigns.reduce((s, c) => s + (c.outreach || 0), 0);
        const totalConversions = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
        const campaignRevenueEstimate = campaigns.reduce((s, c) => s + ((c.conversions || 0) * 120), 0);
        const conversionRate = totalReach > 0 ? (totalConversions / totalReach) * 100 : 0;
        const recentRevenue = recentOrders.reduce((s, o) => s + (o.total || 0), 0);

        res.json({
            totalReach,
            totalConversions,
            conversionRate,
            campaignRevenueEstimate,
            recentRevenue,
            activeCoupons: campaigns.filter(c => c.status === 'ACTIVE').length,
            channels: {
                SMS: campaigns.filter(c => c.method === 'SMS').length,
                Email: campaigns.filter(c => c.method === 'Email').length,
                Push: campaigns.filter(c => c.method === 'Push').length,
                WHATSAPP: campaigns.filter(c => c.method === 'WHATSAPP').length,
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

type CampaignDispatchLog = {
    id: string;
    campaignId: string;
    method: Campaign['method'];
    sent: number;
    failed: number;
    dryRun: boolean;
    branchId?: string | null;
    startedAt: string;
    finishedAt: string;
    actorId?: string | null;
};

const loadDispatchLogs = async (): Promise<CampaignDispatchLog[]> => {
    const [row] = await db.select().from(settings).where(eq(settings.key, CAMPAIGN_DISPATCH_LOG_KEY));
    return (row?.value as CampaignDispatchLog[]) || [];
};

const saveDispatchLogs = async (logs: CampaignDispatchLog[], updatedBy?: string) => {
    const payload = logs.slice(0, 200);
    await db.insert(settings).values({
        key: CAMPAIGN_DISPATCH_LOG_KEY,
        value: payload as any,
        category: 'marketing',
        updatedBy: updatedBy || 'system',
        updatedAt: new Date(),
    }).onConflictDoUpdate({
        target: settings.key,
        set: {
            value: payload as any,
            category: 'marketing',
            updatedBy: updatedBy || 'system',
            updatedAt: new Date(),
        },
    });
};

const normalizePhone = (value: string) => String(value || '').replace(/[^\d+]/g, '').trim();

const collectRecipientPhones = async (input: {
    customerIds?: string[];
    phones?: string[];
}) => {
    const direct = Array.isArray(input.phones) ? input.phones.map(normalizePhone).filter(Boolean) : [];
    const byCustomerIds = Array.isArray(input.customerIds) ? input.customerIds.map((id) => String(id).trim()).filter(Boolean) : [];
    let customerPhones: string[] = [];
    if (byCustomerIds.length > 0) {
        const rows = await db.select({ phone: customers.phone }).from(customers).where(inArray(customers.id, byCustomerIds));
        customerPhones = rows.map((r) => normalizePhone(String(r.phone || ''))).filter(Boolean);
    }
    const unique = Array.from(new Set([...direct, ...customerPhones]));
    return unique.slice(0, MAX_DISPATCH_RECIPIENTS);
};

export const dispatchCampaign = async (req: Request, res: Response) => {
    try {
        const id = String(req.params?.id || '').trim();
        if (!id) return res.status(400).json({ error: 'CAMPAIGN_ID_REQUIRED' });

        const campaigns = await loadCampaigns();
        const idx = campaigns.findIndex((c) => c.id === id);
        if (idx < 0) return res.status(404).json({ error: 'CAMPAIGN_NOT_FOUND' });
        const campaign = campaigns[idx];

        const dryRun = String(req.body?.mode || '').toUpperCase() === 'DRY_RUN';
        const recipientPhones = await collectRecipientPhones({
            customerIds: Array.isArray(req.body?.customerIds) ? req.body.customerIds : [],
            phones: Array.isArray(req.body?.phones) ? req.body.phones : [],
        });
        if (recipientPhones.length === 0) return res.status(400).json({ error: 'CAMPAIGN_RECIPIENTS_REQUIRED' });

        const message = String(req.body?.message || `Offer from ${campaign.name}${campaign.discount ? `: ${campaign.discount}` : ''}`).trim();
        if (!message) return res.status(400).json({ error: 'CAMPAIGN_MESSAGE_REQUIRED' });

        let sent = 0;
        let failed = 0;
        const startedAt = new Date().toISOString();

        if (!dryRun) {
            if (campaign.method === 'WHATSAPP') {
                for (const phone of recipientPhones) {
                    try {
                        await sendWhatsAppText({ to: phone, text: message });
                        sent += 1;
                    } catch {
                        failed += 1;
                    }
                }
            } else {
                // Placeholder for SMS/Email/Push providers.
                sent = recipientPhones.length;
            }
        } else {
            sent = recipientPhones.length;
        }

        campaigns[idx] = {
            ...campaign,
            outreach: Number(campaign.outreach || 0) + sent,
            status: campaign.status === 'SCHEDULED' ? 'ACTIVE' : campaign.status,
            updatedAt: new Date().toISOString(),
        };
        await saveCampaigns(campaigns, req.user?.id);

        const dispatchLog: CampaignDispatchLog = {
            id: `CMP-DISPATCH-${Date.now()}`,
            campaignId: campaign.id,
            method: campaign.method,
            sent,
            failed,
            dryRun,
            branchId: req.user?.branchId || null,
            startedAt,
            finishedAt: new Date().toISOString(),
            actorId: req.user?.id || null,
        };
        const logs = await loadDispatchLogs();
        await saveDispatchLogs([dispatchLog, ...logs], req.user?.id);

        return res.json({
            ok: true,
            campaignId: campaign.id,
            method: campaign.method,
            dryRun,
            recipients: recipientPhones.length,
            sent,
            failed,
            dispatchId: dispatchLog.id,
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'CAMPAIGN_DISPATCH_FAILED' });
    }
};
