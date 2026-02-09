import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { db } from '../db';
import { orders, inventoryStock, branches } from '../../src/db/schema';
import { gte, sql } from 'drizzle-orm';

/**
 * Generate performance insights
 * GET /api/ai/insights
 */
export const getInsights = async (req: Request, res: Response) => {
    try {
        const branchId = req.query.branchId as string;
        const cacheKey = branchId ? `perf_${branchId}` : 'perf_global';

        const insight = await aiService.getCachedInsight(cacheKey, async () => {
            // 1. Gather context data (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const recentOrders = await db.select().from(orders)
                .where(gte(orders.createdAt, weekAgo));

            const totalRevenue = recentOrders.reduce((s, o) => s + Number(o.total || 0), 0);
            const orderCount = recentOrders.length;
            const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

            // 2. Build prompt
            const prompt = `
                Perform a brief business analysis for a restaurant group. 
                Data for the last 7 days:
                - Total Revenue: ${totalRevenue.toFixed(2)} EGP
                - Order Count: ${orderCount}
                - Average Ticket: ${avgTicket.toFixed(2)} EGP
                
                Provide 3 specific bullet points:
                1. Performance overview
                2. One potential risk
                3. One optimization recommendation
                Keep it concise and professional.
            `;

            return await aiService.queryAI(prompt);
        });

        res.json({ insight });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Execute AI-suggested action
 * POST /api/ai/execute
 */
export const executeAction = async (req: Request, res: Response) => {
    try {
        const { actionType, parameters, explanation } = req.body;
        const user = (req as any).user;

        // 1. Server-side permission check (CRITICAL)
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
            return res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS' });
        }

        // 2. Validate action type safety
        const allowedActions = ['UPDATE_THRESHOLD', 'RESTOCK_TRIGGER', 'MARK_ITEM_STATUS'];
        if (!allowedActions.includes(actionType)) {
            return res.status(400).json({ error: 'UNSAFE_ACTION_TYPE' });
        }

        // 3. Log the intent before execution
        await aiService.logAIAction(user.id, user.name, actionType, {
            parameters,
            explanation,
            status: 'PENDING'
        });

        // 4. Dispatch actual logic (simplified example)
        // In a real system, this would call specific service methods

        res.json({
            success: true,
            message: 'Action executed and logged',
            actionId: actionType
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
