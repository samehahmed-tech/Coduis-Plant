import { Request, Response } from 'express';
import { db } from '../db';
import { settings, orders } from '../../src/db/schema';
import { and, desc, eq, gte } from 'drizzle-orm';

type Campaign = {
    id: string;
    name: string;
    status: 'ACTIVE' | 'AUTOMATED' | 'SCHEDULED' | 'PAUSED';
    method: 'SMS' | 'Email' | 'Push';
    discount?: string;
    outreach: number;
    conversions: number;
    spend?: number;
    createdAt: string;
    updatedAt: string;
};

const CAMPAIGN_KEY = 'marketing_campaigns';

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
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
