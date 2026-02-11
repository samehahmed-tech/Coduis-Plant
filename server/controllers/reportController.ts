import { Request, Response } from 'express';
import { db } from '../db';
import { orders, payments, orderItems, menuItems, menuCategories, recipes, recipeIngredients, inventoryItems, branches } from '../../src/db/schema';
import { eq, and, sql, gte, lte, inArray, desc } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

const parseLocalDateRange = (startDate: string, endDate: string) => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error('INVALID_DATE_RANGE');
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

export const getVatReport = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const report = await db.select({
            count: sql<number>`count(*)`,
            netTotal: sql<number>`sum(subtotal - discount)`,
            taxTotal: sql<number>`sum(tax)`,
            serviceChargeTotal: sql<number>`sum(service_charge)`,
            grandTotal: sql<number>`sum(total)`
        }).from(orders)
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId as string) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, ['DELIVERED', 'COMPLETED'])
                )
            );

        res.json({
            period: { start, end },
            branchId: branchId || 'ALL',
            summary: report[0] || { count: 0, netTotal: 0, taxTotal: 0, serviceChargeTotal: 0, grandTotal: 0 }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPaymentMethodSummary = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const summary = await db.select({
            method: payments.method,
            total: sql<number>`sum(amount)`,
            count: sql<number>`count(*)`
        }).from(payments)
            .innerJoin(orders, eq(payments.orderId, orders.id))
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId as string) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    eq(payments.status, 'COMPLETED')
                )
            )
            .groupBy(payments.method);

        res.json(summary);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getFiscalSummary = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const summary = await db.select({
            totalSales: sql<number>`sum(total)`,
            netSales: sql<number>`sum(subtotal - discount)`,
            vatAmount: sql<number>`sum(tax)`,
            orderCount: sql<number>`count(*)`
        }).from(orders)
            .where(
                and(
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, ['DELIVERED', 'COMPLETED'])
                )
            );

        const [latestOrder] = await db.select({ id: orders.id }).from(orders).orderBy(desc(orders.createdAt)).limit(1);

        res.json({
            taxPeriod: `${start.getFullYear()}-${start.getMonth() + 1}`,
            data: {
                ...(summary[0] || { totalSales: 0, netSales: 0, vatAmount: 0, orderCount: 0 }),
                latestOrderId: latestOrder?.id
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDailySales = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const rows = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            revenue: sql<number>`sum(${orders.total})`,
            net: sql<number>`sum(${orders.subtotal} - ${orders.discount})`,
            tax: sql<number>`sum(${orders.tax})`,
            orderCount: sql<number>`count(*)`
        }).from(orders)
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId as string) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, ['DELIVERED', 'COMPLETED'])
                )
            )
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD') asc`);

        res.json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getOverview = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];

        const [summary] = await db.select({
            orderCount: sql<number>`count(*)`,
            grossSales: sql<number>`coalesce(sum(${orders.total}), 0)`,
            netSales: sql<number>`coalesce(sum(${orders.subtotal} - ${orders.discount}), 0)`,
            taxTotal: sql<number>`coalesce(sum(${orders.tax}), 0)`,
            discountTotal: sql<number>`coalesce(sum(${orders.discount}), 0)`,
            serviceChargeTotal: sql<number>`coalesce(sum(${orders.serviceCharge}), 0)`,
        }).from(orders).where(
            and(
                branchId ? eq(orders.branchId, branchId as string) : undefined,
                gte(orders.createdAt, start),
                lte(orders.createdAt, end),
                inArray(orders.status, deliveredStatuses)
            )
        );

        res.json(summary || {
            orderCount: 0,
            grossSales: 0,
            netSales: 0,
            taxTotal: 0,
            discountTotal: 0,
            serviceChargeTotal: 0,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getProfitSummary = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];

        const [sales] = await db.select({
            grossSales: sql<number>`coalesce(sum(${orders.total}), 0)`,
            netSales: sql<number>`coalesce(sum(${orders.subtotal} - ${orders.discount}), 0)`,
            taxTotal: sql<number>`coalesce(sum(${orders.tax}), 0)`,
            orderCount: sql<number>`count(*)`,
        }).from(orders).where(
            and(
                branchId ? eq(orders.branchId, branchId as string) : undefined,
                gte(orders.createdAt, start),
                lte(orders.createdAt, end),
                inArray(orders.status, deliveredStatuses)
            )
        );

        const cogsRows = await db.select({
            cogs: sql<number>`coalesce(sum(${orderItems.quantity} * coalesce(${menuItems.cost}, 0)), 0)`,
        })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId as string) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, deliveredStatuses)
                )
            );

        const grossSales = Number(sales?.grossSales || 0);
        const netSales = Number(sales?.netSales || 0);
        const cogs = Number(cogsRows[0]?.cogs || 0);
        const grossProfit = netSales - cogs;
        const foodCostPercent = netSales > 0 ? (cogs / netSales) * 100 : 0;

        res.json({
            grossSales,
            netSales,
            taxTotal: Number(sales?.taxTotal || 0),
            orderCount: Number(sales?.orderCount || 0),
            cogs,
            grossProfit,
            foodCostPercent,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getProfitDaily = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];

        const salesRows = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            net: sql<number>`coalesce(sum(${orders.subtotal} - ${orders.discount}), 0)`,
            tax: sql<number>`coalesce(sum(${orders.tax}), 0)`,
            orderCount: sql<number>`count(*)`,
        }).from(orders)
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId as string) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, deliveredStatuses)
                )
            )
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD') asc`);

        const cogsRows = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            cogs: sql<number>`coalesce(sum(${orderItems.quantity} * coalesce(${menuItems.cost}, 0)), 0)`,
        })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId as string) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, deliveredStatuses)
                )
            )
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD') asc`);

        const cogsMap = new Map(cogsRows.map((r) => [r.day, Number(r.cogs || 0)]));
        const rows = salesRows.map((r) => {
            const cogs = Number(cogsMap.get(r.day) || 0);
            const net = Number(r.net || 0);
            return {
                day: r.day,
                revenue: Number(r.revenue || 0),
                net,
                tax: Number(r.tax || 0),
                orderCount: Number(r.orderCount || 0),
                cogs,
                grossProfit: net - cogs,
            };
        });

        res.json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getFoodCostReport = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];

        const [menu, recs, recIngredients, inv, soldRows] = await Promise.all([
            db.select().from(menuItems),
            db.select().from(recipes),
            db.select().from(recipeIngredients),
            db.select().from(inventoryItems),
            db.select({
                menuItemId: orderItems.menuItemId,
                soldQty: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
                soldRevenue: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.price}), 0)`,
            })
                .from(orderItems)
                .innerJoin(orders, eq(orderItems.orderId, orders.id))
                .where(
                    and(
                        branchId ? eq(orders.branchId, branchId as string) : undefined,
                        gte(orders.createdAt, start),
                        lte(orders.createdAt, end),
                        inArray(orders.status, deliveredStatuses)
                    )
                )
                .groupBy(orderItems.menuItemId),
        ]);

        const recipeByMenuItem = new Map(recs.map((r) => [r.menuItemId, r]));
        const ingredientsByRecipe = new Map<string, any[]>();
        for (const ri of recIngredients) {
            const list = ingredientsByRecipe.get(ri.recipeId) || [];
            list.push(ri);
            ingredientsByRecipe.set(ri.recipeId, list);
        }
        const invCostById = new Map(inv.map((i) => [i.id, Number(i.costPrice || i.purchasePrice || 0)]));
        const soldByMenuItem = new Map(soldRows.map((r) => [r.menuItemId, { qty: Number(r.soldQty || 0), revenue: Number(r.soldRevenue || 0) }]));

        const items = menu.map((item) => {
            const recipe = recipeByMenuItem.get(item.id);
            const recipeItems = recipe ? (ingredientsByRecipe.get(recipe.id) || []) : [];
            const recipeCost = recipeItems.reduce((sum, ri) => sum + Number(ri.quantity || 0) * Number(invCostById.get(ri.inventoryItemId) || 0), 0);
            const baseCost = recipeCost > 0 ? recipeCost : Number(item.cost || 0);
            const price = Number(item.price || 0);
            const margin = price - baseCost;
            const marginPercent = price > 0 ? (margin / price) * 100 : 0;
            const sold = soldByMenuItem.get(item.id);
            return {
                id: item.id,
                name: item.name,
                price,
                cost: baseCost,
                margin,
                marginPercent,
                soldQty: Number(sold?.qty || 0),
                soldRevenue: Number(sold?.revenue || 0),
            };
        }).sort((a, b) => b.marginPercent - a.marginPercent);

        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

type ReportGranularity = 'DAILY' | 'WEEKLY' | 'MONTHLY';

const parseReportFilters = (req: Request) => {
    const { branchId, startDate, endDate, reportType, granularity } = req.query;
    if (!startDate || !endDate) throw new Error('Start date and end date are required');
    const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
    return {
        branchId: branchId ? String(branchId) : undefined,
        start,
        end,
        reportType: String(reportType || 'overview').toUpperCase(),
        granularity: String(granularity || 'DAILY').toUpperCase() as ReportGranularity,
    };
};

const DELIVERED_STATUSES = ['DELIVERED', 'COMPLETED'];
type DashboardScope = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL';

const resolveScopedBranchId = (req: Request, requestedBranchId?: string) => {
    const user = req.user;
    if (!user) {
        throw new Error('AUTH_REQUIRED');
    }
    const effectiveRequestedId = requestedBranchId && requestedBranchId !== 'undefined' && requestedBranchId !== 'null' ? requestedBranchId : undefined;

    if (user.role === 'SUPER_ADMIN') {
        return effectiveRequestedId;
    }
    if (!user.branchId) {
        throw new Error('BRANCH_SCOPE_REQUIRED');
    }
    if (effectiveRequestedId && effectiveRequestedId !== user.branchId) {
        throw new Error('FORBIDDEN_BRANCH_SCOPE');
    }
    return user.branchId;
};

export const getDashboardKpis = async (req: Request, res: Response) => {
    try {
        const { branchId: rawBranchId, startDate, endDate, scope } = req.query as {
            branchId?: string;
            startDate?: string;
            endDate?: string;
            scope?: DashboardScope;
        };
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const branchId = resolveScopedBranchId(req, rawBranchId);
        const { start, end } = parseLocalDateRange(startDate, endDate);
        const scopeValue: DashboardScope = (scope || 'DAILY') as DashboardScope;

        const [overviewRows, paymentsMix, paidRevenueRows, uniqueCustomersRows, itemsSoldRows, opsStatusRows, orderTypeRows, trendRows, topItemsRows, categoryRows, branchRows, topCustomerRows] = await Promise.all([
            db.select({
                orderCount: sql<number>`count(*)`,
                grossSales: sql<number>`coalesce(sum(${orders.total}), 0)`,
                netSales: sql<number>`coalesce(sum(${orders.subtotal} - ${orders.discount}), 0)`,
                taxTotal: sql<number>`coalesce(sum(${orders.tax}), 0)`,
                discountTotal: sql<number>`coalesce(sum(${orders.discount}), 0)`,
                serviceChargeTotal: sql<number>`coalesce(sum(${orders.serviceCharge}), 0)`,
            }).from(orders).where(
                and(
                    branchId ? eq(orders.branchId, branchId) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, DELIVERED_STATUSES)
                )
            ),
            db.select({
                name: payments.method,
                value: sql<number>`coalesce(sum(${payments.amount}), 0)`,
            }).from(payments)
                .innerJoin(orders, eq(payments.orderId, orders.id))
                .where(
                    and(
                        branchId ? eq(orders.branchId, branchId) : undefined,
                        gte(orders.createdAt, start),
                        lte(orders.createdAt, end),
                        eq(payments.status, 'COMPLETED'),
                        inArray(orders.status, DELIVERED_STATUSES)
                    )
                )
                .groupBy(payments.method),
            db.select({
                paidRevenue: sql<number>`coalesce(sum(${payments.amount}), 0)`,
            }).from(payments)
                .innerJoin(orders, eq(payments.orderId, orders.id))
                .where(
                    and(
                        branchId ? eq(orders.branchId, branchId) : undefined,
                        gte(orders.createdAt, start),
                        lte(orders.createdAt, end),
                        eq(payments.status, 'COMPLETED'),
                        inArray(orders.status, DELIVERED_STATUSES)
                    )
                ),
            db.select({
                uniqueCustomers: sql<number>`count(distinct coalesce(${orders.customerId}, ${orders.customerPhone}))`,
            }).from(orders).where(
                and(
                    branchId ? eq(orders.branchId, branchId) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, DELIVERED_STATUSES)
                )
            ),
            db.select({
                itemsSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
            }).from(orderItems)
                .innerJoin(orders, eq(orderItems.orderId, orders.id))
                .where(
                    and(
                        branchId ? eq(orders.branchId, branchId) : undefined,
                        gte(orders.createdAt, start),
                        lte(orders.createdAt, end),
                        inArray(orders.status, DELIVERED_STATUSES)
                    )
                ),
            db.select({
                status: orders.status,
                count: sql<number>`count(*)`,
            }).from(orders).where(
                and(
                    branchId ? eq(orders.branchId, branchId) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end)
                )
            ).groupBy(orders.status),
            db.select({
                name: orders.type,
                value: sql<number>`count(*)`,
            }).from(orders).where(
                and(
                    branchId ? eq(orders.branchId, branchId) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, DELIVERED_STATUSES)
                )
            ).groupBy(orders.type),
            (scopeValue === 'DAILY'
                ? db.select({
                    name: sql<string>`to_char(${orders.createdAt}, 'HH24:00')`,
                    revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
                }).from(orders).where(
                    and(
                        branchId ? eq(orders.branchId, branchId) : undefined,
                        gte(orders.createdAt, start),
                        lte(orders.createdAt, end),
                        inArray(orders.status, DELIVERED_STATUSES)
                    )
                ).groupBy(sql`to_char(${orders.createdAt}, 'HH24:00')`).orderBy(sql`to_char(${orders.createdAt}, 'HH24:00') asc`)
                : db.select({
                    name: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
                    revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
                }).from(orders).where(
                    and(
                        branchId ? eq(orders.branchId, branchId) : undefined,
                        gte(orders.createdAt, start),
                        lte(orders.createdAt, end),
                        inArray(orders.status, DELIVERED_STATUSES)
                    )
                ).groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`).orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD') asc`)),
            db.select({
                name: sql<string>`coalesce(${orderItems.name}, 'Unknown')`,
                qty: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
                revenue: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.price}), 0)`,
            }).from(orderItems)
                .innerJoin(orders, eq(orderItems.orderId, orders.id))
                .where(
                    and(
                        branchId ? eq(orders.branchId, branchId) : undefined,
                        gte(orders.createdAt, start),
                        lte(orders.createdAt, end),
                        inArray(orders.status, DELIVERED_STATUSES)
                    )
                )
                .groupBy(sql`coalesce(${orderItems.name}, 'Unknown')`)
                .orderBy(sql`coalesce(sum(${orderItems.quantity}), 0) desc`)
                .limit(8),
            db.select({
                name: sql<string>`coalesce(${menuCategories.name}, 'Uncategorized')`,
                value: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.price}), 0)`,
            }).from(orderItems)
                .innerJoin(orders, eq(orderItems.orderId, orders.id))
                .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
                .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
                .where(
                    and(
                        branchId ? eq(orders.branchId, branchId) : undefined,
                        gte(orders.createdAt, start),
                        lte(orders.createdAt, end),
                        inArray(orders.status, DELIVERED_STATUSES)
                    )
                )
                .groupBy(sql`coalesce(${menuCategories.name}, 'Uncategorized')`)
                .orderBy(sql`coalesce(sum(${orderItems.quantity} * ${orderItems.price}), 0) desc`)
                .limit(6),
            db.select({
                branchId: orders.branchId,
                branchName: sql<string>`coalesce(${branches.name}, ${orders.branchId})`,
                orders: sql<number>`count(*)`,
                revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            }).from(orders)
                .leftJoin(branches, eq(orders.branchId, branches.id))
                .where(
                    and(
                        branchId ? eq(orders.branchId, branchId) : undefined,
                        gte(orders.createdAt, start),
                        lte(orders.createdAt, end),
                        inArray(orders.status, DELIVERED_STATUSES)
                    )
                )
                .groupBy(orders.branchId, branches.name)
                .orderBy(sql`coalesce(sum(${orders.total}), 0) desc`)
                .limit(6),
            db.select({
                id: sql<string>`coalesce(${orders.customerId}, ${orders.customerPhone}, ${orders.customerName}, 'guest')`,
                name: sql<string>`coalesce(max(${orders.customerName}), max(${orders.customerPhone}), 'Guest')`,
                visits: sql<number>`count(*)`,
                totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
            }).from(orders).where(
                and(
                    branchId ? eq(orders.branchId, branchId) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, DELIVERED_STATUSES)
                )
            )
                .groupBy(sql`coalesce(${orders.customerId}, ${orders.customerPhone}, ${orders.customerName}, 'guest')`)
                .orderBy(sql`coalesce(sum(${orders.total}), 0) desc`)
                .limit(5),
        ]);

        const summary = overviewRows[0] || {
            orderCount: 0,
            grossSales: 0,
            netSales: 0,
            taxTotal: 0,
            discountTotal: 0,
            serviceChargeTotal: 0,
        };
        const orderCount = Number(summary.orderCount || 0);
        const grossSales = Number(summary.grossSales || 0);
        const pending = Number(opsStatusRows.find(r => r.status === 'PENDING')?.count || 0)
            + Number(opsStatusRows.find(r => r.status === 'PREPARING')?.count || 0)
            + Number(opsStatusRows.find(r => r.status === 'READY')?.count || 0)
            + Number(opsStatusRows.find(r => r.status === 'OUT_FOR_DELIVERY')?.count || 0);
        const cancelled = Number(opsStatusRows.find(r => r.status === 'CANCELLED')?.count || 0);
        const delivered = Number(opsStatusRows.find(r => r.status === 'DELIVERED')?.count || 0)
            + Number(opsStatusRows.find(r => r.status === 'COMPLETED')?.count || 0);

        res.json({
            branchId: branchId || 'ALL',
            scope: scopeValue,
            period: { start, end },
            totals: {
                revenue: grossSales,
                paidRevenue: Number(paidRevenueRows[0]?.paidRevenue || 0),
                discounts: Number(summary.discountTotal || 0),
                orderCount,
                avgTicket: orderCount > 0 ? grossSales / orderCount : 0,
                uniqueCustomers: Number(uniqueCustomersRows[0]?.uniqueCustomers || 0),
                itemsSold: Number(itemsSoldRows[0]?.itemsSold || 0),
                cancelled,
                pending,
                delivered,
                cancelRate: orderCount > 0 ? (cancelled / orderCount) * 100 : 0,
            },
            trendData: trendRows.map((row) => ({
                name: row.name,
                revenue: Number(row.revenue || 0),
            })),
            paymentBreakdown: paymentsMix.map((row) => ({
                name: row.name,
                value: Number(row.value || 0),
            })),
            orderTypeBreakdown: orderTypeRows.map((row) => ({
                name: row.name,
                value: Number(row.value || 0),
            })),
            categoryData: categoryRows.map((row) => ({
                name: row.name,
                value: Number(row.value || 0),
            })),
            topItems: topItemsRows.map((row) => ({
                name: row.name,
                qty: Number(row.qty || 0),
                revenue: Number(row.revenue || 0),
            })),
            branchPerformance: branchRows.map((row) => {
                const branchOrders = Number(row.orders || 0);
                const revenue = Number(row.revenue || 0);
                return {
                    branchId: row.branchId,
                    branchName: row.branchName,
                    orders: branchOrders,
                    revenue,
                    avgTicket: branchOrders > 0 ? revenue / branchOrders : 0,
                };
            }),
            topCustomers: topCustomerRows.map((row) => ({
                id: row.id,
                name: row.name,
                visits: Number(row.visits || 0),
                totalSpent: Number(row.totalSpent || 0),
            })),
            reportParity: {
                overview: {
                    orderCount: Number(summary.orderCount || 0),
                    grossSales: Number(summary.grossSales || 0),
                    netSales: Number(summary.netSales || 0),
                    taxTotal: Number(summary.taxTotal || 0),
                    discountTotal: Number(summary.discountTotal || 0),
                    serviceChargeTotal: Number(summary.serviceChargeTotal || 0),
                },
            },
        });
    } catch (error: any) {
        const message = error?.message || 'Failed to load dashboard KPIs';
        if (message === 'AUTH_REQUIRED') return res.status(401).json({ error: message });
        if (message === 'FORBIDDEN_BRANCH_SCOPE' || message === 'BRANCH_SCOPE_REQUIRED') return res.status(403).json({ error: message });
        return res.status(500).json({ error: message });
    }
};

const getExportSnapshot = async (branchId: string | undefined, start: Date, end: Date) => {
    const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
    const [overview] = await db.select({
        orderCount: sql<number>`count(*)`,
        grossSales: sql<number>`coalesce(sum(${orders.total}), 0)`,
        netSales: sql<number>`coalesce(sum(${orders.subtotal} - ${orders.discount}), 0)`,
        taxTotal: sql<number>`coalesce(sum(${orders.tax}), 0)`,
        discountTotal: sql<number>`coalesce(sum(${orders.discount}), 0)`,
        serviceChargeTotal: sql<number>`coalesce(sum(${orders.serviceCharge}), 0)`,
    }).from(orders).where(
        and(
            branchId ? eq(orders.branchId, branchId) : undefined,
            gte(orders.createdAt, start),
            lte(orders.createdAt, end),
            inArray(orders.status, deliveredStatuses)
        )
    );

    const daily = await db.select({
        day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
        revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        net: sql<number>`coalesce(sum(${orders.subtotal} - ${orders.discount}), 0)`,
        tax: sql<number>`coalesce(sum(${orders.tax}), 0)`,
        orderCount: sql<number>`count(*)`,
    }).from(orders)
        .where(
            and(
                branchId ? eq(orders.branchId, branchId) : undefined,
                gte(orders.createdAt, start),
                lte(orders.createdAt, end),
                inArray(orders.status, deliveredStatuses)
            )
        )
        .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD') asc`);

    const [profit] = await db.select({
        cogs: sql<number>`coalesce(sum(${orderItems.quantity} * coalesce(${menuItems.cost}, 0)), 0)`,
    }).from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(
            and(
                branchId ? eq(orders.branchId, branchId) : undefined,
                gte(orders.createdAt, start),
                lte(orders.createdAt, end),
                inArray(orders.status, deliveredStatuses)
            )
        );

    const paymentsSummary = await db.select({
        method: payments.method,
        total: sql<number>`sum(amount)`,
        count: sql<number>`count(*)`
    }).from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .where(
            and(
                branchId ? eq(orders.branchId, branchId) : undefined,
                gte(orders.createdAt, start),
                lte(orders.createdAt, end),
                eq(payments.status, 'COMPLETED')
            )
        )
        .groupBy(payments.method);

    return {
        overview: overview || {
            orderCount: 0,
            grossSales: 0,
            netSales: 0,
            taxTotal: 0,
            discountTotal: 0,
            serviceChargeTotal: 0,
        },
        daily,
        profit: {
            cogs: Number(profit?.cogs || 0),
        },
        payments: paymentsSummary,
    };
};

const almostEqual = (a: number, b: number, tolerance = 0.01) => Math.abs(Number(a || 0) - Number(b || 0)) <= tolerance;

export const getIntegrityChecks = async (req: Request, res: Response) => {
    try {
        const { branchId, start, end } = parseReportFilters(req);
        const snapshot = await getExportSnapshot(branchId, start, end);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];

        const dailyRevenueSum = snapshot.daily.reduce((sum: number, row: any) => sum + Number(row.revenue || 0), 0);
        const dailyNetSum = snapshot.daily.reduce((sum: number, row: any) => sum + Number(row.net || 0), 0);
        const dailyTaxSum = snapshot.daily.reduce((sum: number, row: any) => sum + Number(row.tax || 0), 0);
        const paymentSum = snapshot.payments.reduce((sum: number, row: any) => sum + Number(row.total || 0), 0);
        const computedGrossProfit = Number(snapshot.overview.netSales || 0) - Number(snapshot.profit.cogs || 0);

        const [paymentCoverageRows] = await db.select({
            paidOrders: sql<number>`count(distinct ${payments.orderId})`,
            deliveredOrders: sql<number>`count(distinct ${orders.id})`,
        }).from(orders)
            .leftJoin(payments, eq(payments.orderId, orders.id))
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    eq(payments.status, 'COMPLETED'),
                    inArray(orders.status, deliveredStatuses)
                )
            );
        const coverageRatio = Number(paymentCoverageRows?.deliveredOrders || 0) > 0
            ? Number(paymentCoverageRows?.paidOrders || 0) / Number(paymentCoverageRows?.deliveredOrders || 1)
            : 1;

        const checks = [
            {
                id: 'DAILY_REVENUE_MATCH_OVERVIEW',
                description: 'Sum(daily revenue) equals overview gross sales',
                left: Number(dailyRevenueSum.toFixed(2)),
                right: Number(Number(snapshot.overview.grossSales || 0).toFixed(2)),
                diff: Number((dailyRevenueSum - Number(snapshot.overview.grossSales || 0)).toFixed(4)),
                pass: almostEqual(dailyRevenueSum, Number(snapshot.overview.grossSales || 0)),
            },
            {
                id: 'DAILY_NET_MATCH_OVERVIEW',
                description: 'Sum(daily net) equals overview net sales',
                left: Number(dailyNetSum.toFixed(2)),
                right: Number(Number(snapshot.overview.netSales || 0).toFixed(2)),
                diff: Number((dailyNetSum - Number(snapshot.overview.netSales || 0)).toFixed(4)),
                pass: almostEqual(dailyNetSum, Number(snapshot.overview.netSales || 0)),
            },
            {
                id: 'DAILY_TAX_MATCH_OVERVIEW',
                description: 'Sum(daily tax) equals overview tax total',
                left: Number(dailyTaxSum.toFixed(2)),
                right: Number(Number(snapshot.overview.taxTotal || 0).toFixed(2)),
                diff: Number((dailyTaxSum - Number(snapshot.overview.taxTotal || 0)).toFixed(4)),
                pass: almostEqual(dailyTaxSum, Number(snapshot.overview.taxTotal || 0)),
            },
            {
                id: 'PROFIT_FORMULA_VALID',
                description: 'Gross profit equals net sales - COGS',
                left: Number(computedGrossProfit.toFixed(2)),
                right: Number((Number(snapshot.overview.netSales || 0) - Number(snapshot.profit.cogs || 0)).toFixed(2)),
                diff: 0,
                pass: almostEqual(computedGrossProfit, Number(snapshot.overview.netSales || 0) - Number(snapshot.profit.cogs || 0)),
            },
            {
                id: 'PAYMENT_TOTAL_MATCH_GROSS',
                description: 'Payment totals approximately match gross sales (depends on payment coverage)',
                left: Number(paymentSum.toFixed(2)),
                right: Number(Number(snapshot.overview.grossSales || 0).toFixed(2)),
                diff: Number((paymentSum - Number(snapshot.overview.grossSales || 0)).toFixed(4)),
                pass: coverageRatio < 0.95 ? true : almostEqual(paymentSum, Number(snapshot.overview.grossSales || 0), 0.1),
                meta: {
                    paymentCoverageRatio: Number(coverageRatio.toFixed(4)),
                    note: coverageRatio < 0.95 ? 'Coverage below threshold; check treated as informational/pass' : undefined,
                },
            },
        ];

        const passedCount = checks.filter(c => c.pass).length;
        const failed = checks.filter(c => !c.pass);
        res.json({
            branchId: branchId || 'ALL',
            period: { start, end },
            checks,
            summary: {
                total: checks.length,
                passed: passedCount,
                failed: checks.length - passedCount,
                passRate: Number((passedCount / Math.max(1, checks.length)).toFixed(4)),
            },
            ok: failed.length === 0,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

const toWeekBucket = (isoDay: string) => {
    const date = new Date(`${isoDay}T00:00:00.000Z`);
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const aggregateDailyRows = (rows: any[], granularity: ReportGranularity) => {
    if (granularity === 'DAILY') return rows;

    const grouped = new Map<string, { revenue: number; net: number; tax: number; orderCount: number }>();
    for (const row of rows) {
        const bucket = granularity === 'MONTHLY'
            ? String(row.day).slice(0, 7)
            : toWeekBucket(String(row.day));
        const existing = grouped.get(bucket) || { revenue: 0, net: 0, tax: 0, orderCount: 0 };
        existing.revenue += Number(row.revenue || 0);
        existing.net += Number(row.net || 0);
        existing.tax += Number(row.tax || 0);
        existing.orderCount += Number(row.orderCount || 0);
        grouped.set(bucket, existing);
    }

    return Array.from(grouped.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, values]) => ({
            day,
            revenue: values.revenue,
            net: values.net,
            tax: values.tax,
            orderCount: values.orderCount,
        }));
};

export const exportReportCsv = async (req: Request, res: Response) => {
    try {
        const { branchId, start, end, reportType, granularity } = parseReportFilters(req);
        const snapshot = await getExportSnapshot(branchId, start, end);
        const dailyRows = aggregateDailyRows(snapshot.daily, granularity);

        const lines: string[] = [];
        lines.push(`Report Type,${reportType}`);
        lines.push(`Granularity,${granularity}`);
        lines.push(`Branch,${branchId || 'ALL'}`);
        lines.push(`Start Date,${start.toISOString()}`);
        lines.push(`End Date,${end.toISOString()}`);
        lines.push('');
        lines.push('Summary');
        lines.push('Order Count,Gross Sales,Net Sales,Tax Total,Discount Total,Service Charge,COGS');
        lines.push([
            Number(snapshot.overview.orderCount || 0),
            Number(snapshot.overview.grossSales || 0).toFixed(2),
            Number(snapshot.overview.netSales || 0).toFixed(2),
            Number(snapshot.overview.taxTotal || 0).toFixed(2),
            Number(snapshot.overview.discountTotal || 0).toFixed(2),
            Number(snapshot.overview.serviceChargeTotal || 0).toFixed(2),
            Number(snapshot.profit.cogs || 0).toFixed(2),
        ].join(','));
        lines.push('');
        lines.push('Time Series');
        lines.push('Period,Revenue,Net,Tax,Order Count');
        dailyRows.forEach((row: any) => {
            lines.push([
                row.day,
                Number(row.revenue || 0).toFixed(2),
                Number(row.net || 0).toFixed(2),
                Number(row.tax || 0).toFixed(2),
                Number(row.orderCount || 0),
            ].join(','));
        });
        lines.push('');
        lines.push('Payments');
        lines.push('Method,Total,Count');
        snapshot.payments.forEach((p: any) => {
            lines.push([
                p.method,
                Number(p.total || 0).toFixed(2),
                Number(p.count || 0),
            ].join(','));
        });

        const csv = lines.join('\n');
        const filename = `report_${reportType.toLowerCase()}_${Date.now()}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const exportReportPdf = async (req: Request, res: Response) => {
    try {
        const { branchId, start, end, reportType, granularity } = parseReportFilters(req);
        const snapshot = await getExportSnapshot(branchId, start, end);
        const dailyRows = aggregateDailyRows(snapshot.daily, granularity);
        const filename = `report_${reportType.toLowerCase()}_${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const doc = new PDFDocument({ margin: 36, size: 'A4' });
        doc.pipe(res);

        doc.fontSize(18).text('RestoFlow Report Export', { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Type: ${reportType}`);
        doc.text(`Granularity: ${granularity}`);
        doc.text(`Branch: ${branchId || 'ALL'}`);
        doc.text(`Range: ${start.toISOString()} -> ${end.toISOString()}`);
        doc.moveDown();

        doc.fontSize(12).text('Summary', { underline: true });
        doc.fontSize(10);
        doc.text(`Orders: ${Number(snapshot.overview.orderCount || 0)}`);
        doc.text(`Gross Sales: ${Number(snapshot.overview.grossSales || 0).toFixed(2)}`);
        doc.text(`Net Sales: ${Number(snapshot.overview.netSales || 0).toFixed(2)}`);
        doc.text(`Tax Total: ${Number(snapshot.overview.taxTotal || 0).toFixed(2)}`);
        doc.text(`Discount Total: ${Number(snapshot.overview.discountTotal || 0).toFixed(2)}`);
        doc.text(`Service Charge: ${Number(snapshot.overview.serviceChargeTotal || 0).toFixed(2)}`);
        doc.text(`COGS: ${Number(snapshot.profit.cogs || 0).toFixed(2)}`);
        doc.moveDown();

        doc.fontSize(12).text('Time Series Snapshot', { underline: true });
        doc.fontSize(9);
        dailyRows.slice(0, 20).forEach((row: any) => {
            doc.text(`${row.day} | Rev ${Number(row.revenue || 0).toFixed(2)} | Net ${Number(row.net || 0).toFixed(2)} | Tax ${Number(row.tax || 0).toFixed(2)} | Orders ${Number(row.orderCount || 0)}`);
        });
        doc.moveDown();

        doc.fontSize(12).text('Payment Mix', { underline: true });
        doc.fontSize(9);
        snapshot.payments.forEach((p: any) => {
            doc.text(`${p.method} | ${Number(p.total || 0).toFixed(2)} | count ${Number(p.count || 0)}`);
        });

        doc.end();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
