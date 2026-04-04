import { Request, Response } from 'express';
import { db } from '../db';
import { orders, payments, orderItems, menuItems, menuCategories, recipes, recipeIngredients, inventoryItems, branches, stockMovements, inventoryStock, inventoryBatches, warehouses, journalEntries, journalLines, chartOfAccounts, employees, attendance, payrollCycles, payrollPayouts, customers, campaigns, shifts, managerApprovals, purchaseOrders, purchaseOrderItems, suppliers, drivers, fiscalLogs, etaDeadLetters, auditLogs } from '../../src/db/schema';
import { eq, and, sql, gte, lte, inArray, desc, asc } from 'drizzle-orm';
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

export const getHourlySales = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];

        const rows = await db.select({
            hour: sql<string>`to_char(${orders.createdAt}, 'HH24:00')`,
            revenue: sql<number>`sum(${orders.total})`,
            orderCount: sql<number>`count(*)`
        }).from(orders)
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId as string) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, deliveredStatuses)
                )
            )
            .groupBy(sql`to_char(${orders.createdAt}, 'HH24:00')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'HH24:00') asc`);

        res.json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCashierSummary = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const summary = await db.select({
            cashier: sql<string>`coalesce(${payments.processedBy}, 'System/Online')`,
            method: payments.method,
            totalCollected: sql<number>`sum(${payments.amount})`,
            transactionCount: sql<number>`count(*)`
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
            .groupBy(sql`coalesce(${payments.processedBy}, 'System/Online')`, payments.method)
            .orderBy(sql`coalesce(${payments.processedBy}, 'System/Online') desc`);

        res.json(summary);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getRefundsReport = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const refunds = await db.select({
            orderNumber: orders.orderNumber,
            total: orders.total,
            cancelReason: orders.cancelReason,
            cancelledAt: orders.cancelledAt,
            status: orders.status
        }).from(orders)
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId as string) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, ['CANCELLED', 'REFUNDED'])
                )
            )
            .orderBy(desc(orders.cancelledAt));

        res.json(refunds);
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
        const lines: string[] = [];
        lines.push(`Report Type,${reportType}`);
        lines.push(`Branch,${branchId || 'ALL'}`);
        lines.push(`Start Date,${start.toISOString()}`);
        lines.push(`End Date,${end.toISOString()}`);
        lines.push('');

        switch (reportType) {
            case 'TRIAL_BALANCE': {
                const rows = await db.select({
                    code: chartOfAccounts.code, name: chartOfAccounts.name, type: chartOfAccounts.type,
                    debit: sql<number>`coalesce(sum(${journalLines.debit}), 0)`,
                    credit: sql<number>`coalesce(sum(${journalLines.credit}), 0)`,
                }).from(journalLines)
                    .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
                    .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
                    .where(and(gte(journalEntries.date, start), lte(journalEntries.date, end), eq(journalEntries.status, 'POSTED')))
                    .groupBy(chartOfAccounts.code, chartOfAccounts.name, chartOfAccounts.type)
                    .orderBy(chartOfAccounts.code);
                lines.push('Code,Account,Type,Debit,Credit,Balance');
                rows.forEach(r => lines.push([r.code, `"${r.name}"`, r.type, Number(r.debit).toFixed(2), Number(r.credit).toFixed(2), (Number(r.debit) - Number(r.credit)).toFixed(2)].join(',')));
                break;
            }
            case 'TOP_EXPENSES': {
                const rows = await db.select({
                    name: chartOfAccounts.name,
                    total: sql<number>`coalesce(sum(${journalLines.debit}) - sum(${journalLines.credit}), 0)`,
                }).from(journalLines)
                    .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
                    .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
                    .where(and(gte(journalEntries.date, start), lte(journalEntries.date, end), eq(journalEntries.status, 'POSTED'), eq(chartOfAccounts.type, 'EXPENSE')))
                    .groupBy(chartOfAccounts.name)
                    .orderBy(sql`sum(${journalLines.debit}) - sum(${journalLines.credit}) desc`).limit(20);
                lines.push('Expense Account,Total');
                rows.forEach(r => lines.push([`"${r.name}"`, Number(r.total).toFixed(2)].join(',')));
                break;
            }
            case 'STOCK_MOVEMENTS': {
                const rows = await db.select({
                    itemName: inventoryItems.name, type: stockMovements.type, quantity: stockMovements.quantity,
                    totalCost: stockMovements.totalCost, reason: stockMovements.reason, createdAt: stockMovements.createdAt,
                }).from(stockMovements)
                    .innerJoin(inventoryItems, eq(stockMovements.itemId, inventoryItems.id))
                    .where(and(gte(stockMovements.createdAt, start), lte(stockMovements.createdAt, end)))
                    .orderBy(desc(stockMovements.createdAt)).limit(500);
                lines.push('Item,Type,Quantity,Cost,Reason,Date');
                rows.forEach(r => lines.push([`"${r.itemName}"`, r.type, r.quantity, Number(r.totalCost || 0).toFixed(2), `"${r.reason || ''}"`, new Date(r.createdAt!).toISOString()].join(',')));
                break;
            }
            case 'WASTE_LOSS': {
                const rows = await db.select({
                    itemName: inventoryItems.name, unit: inventoryItems.unit, quantity: stockMovements.quantity,
                    totalCost: stockMovements.totalCost, reason: stockMovements.reason, createdAt: stockMovements.createdAt,
                }).from(stockMovements)
                    .innerJoin(inventoryItems, eq(stockMovements.itemId, inventoryItems.id))
                    .where(and(gte(stockMovements.createdAt, start), lte(stockMovements.createdAt, end), inArray(stockMovements.type, ['WASTE', 'ADJUSTMENT'])))
                    .orderBy(desc(stockMovements.createdAt)).limit(500);
                lines.push('Item,Unit,Quantity,Cost,Reason,Date');
                rows.forEach(r => lines.push([`"${r.itemName}"`, r.unit, r.quantity, Number(r.totalCost || 0).toFixed(2), `"${r.reason || ''}"`, new Date(r.createdAt!).toISOString()].join(',')));
                break;
            }
            case 'REORDER_ALERTS': {
                const rows = await db.select({
                    itemName: inventoryItems.name, unit: inventoryItems.unit, threshold: inventoryItems.threshold,
                    currentStock: sql<number>`coalesce(sum(${inventoryStock.quantity}), 0)`,
                }).from(inventoryItems)
                    .leftJoin(inventoryStock, eq(inventoryItems.id, inventoryStock.itemId))
                    .where(eq(inventoryItems.isActive, true))
                    .groupBy(inventoryItems.id, inventoryItems.name, inventoryItems.unit, inventoryItems.threshold)
                    .having(sql`coalesce(sum(${inventoryStock.quantity}), 0) <= ${inventoryItems.threshold}`)
                    .orderBy(sql`coalesce(sum(${inventoryStock.quantity}), 0) asc`);
                lines.push('Item,Unit,Current Stock,Threshold,Deficit');
                rows.forEach(r => lines.push([`"${r.itemName}"`, r.unit, Number(r.currentStock), r.threshold, Number(r.threshold || 0) - Number(r.currentStock)].join(',')));
                break;
            }
            case 'EXPIRING_BATCHES': {
                const thirtyDaysLater = new Date(); thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
                const rows = await db.select({
                    itemName: inventoryItems.name, batchNumber: inventoryBatches.batchNumber,
                    currentQty: inventoryBatches.currentQty, unitCost: inventoryBatches.unitCost, expiryDate: inventoryBatches.expiryDate,
                }).from(inventoryBatches)
                    .innerJoin(inventoryItems, eq(inventoryBatches.itemId, inventoryItems.id))
                    .where(and(lte(inventoryBatches.expiryDate, thirtyDaysLater), gte(inventoryBatches.currentQty, sql`0.01`), inArray(inventoryBatches.status, ['ACTIVE', 'QUARANTINE'])))
                    .orderBy(inventoryBatches.expiryDate).limit(200);
                lines.push('Item,Batch,Qty,Unit Cost,Value,Expiry Date');
                rows.forEach(r => lines.push([`"${r.itemName}"`, r.batchNumber, r.currentQty, Number(r.unitCost).toFixed(2), (Number(r.currentQty) * Number(r.unitCost)).toFixed(2), new Date(r.expiryDate!).toISOString().split('T')[0]].join(',')));
                break;
            }
            case 'PAYROLL': {
                const conditions: any[] = [gte(payrollCycles.periodStart, start), lte(payrollCycles.periodEnd, end)];
                if (branchId) conditions.push(eq(payrollCycles.branchId, branchId));
                const cycles = await db.select().from(payrollCycles).where(and(...conditions));
                if (cycles.length > 0) {
                    const payouts = await db.select({
                        employeeName: employees.name, role: employees.role, basicSalary: payrollPayouts.basicSalary,
                        deductions: payrollPayouts.deductions, overtime: payrollPayouts.overtime, netPay: payrollPayouts.netPay,
                    }).from(payrollPayouts).innerJoin(employees, eq(payrollPayouts.employeeId, employees.id))
                        .where(inArray(payrollPayouts.cycleId, cycles.map(c => c.id)));
                    lines.push('Employee,Role,Basic Salary,Overtime,Deductions,Net Pay');
                    payouts.forEach(p => lines.push([`"${p.employeeName}"`, p.role, Number(p.basicSalary).toFixed(2), Number(p.overtime || 0).toFixed(2), Number(p.deductions || 0).toFixed(2), Number(p.netPay).toFixed(2)].join(',')));
                }
                break;
            }
            case 'ATTENDANCE': {
                const conditions: any[] = [gte(attendance.date, start), lte(attendance.date, end)];
                if (branchId) conditions.push(eq(attendance.branchId, branchId));
                const rows = await db.select({
                    employeeName: employees.name, role: employees.role,
                    totalDays: sql<number>`count(*)`,
                    presentDays: sql<number>`count(*) filter (where ${attendance.status} = 'PRESENT')`,
                    lateDays: sql<number>`count(*) filter (where ${attendance.status} = 'LATE')`,
                    absentDays: sql<number>`count(*) filter (where ${attendance.status} = 'ABSENT')`,
                    totalHours: sql<number>`coalesce(sum(${attendance.totalHours}), 0)`,
                }).from(attendance).innerJoin(employees, eq(attendance.employeeId, employees.id))
                    .where(and(...conditions)).groupBy(employees.name, employees.role);
                lines.push('Employee,Role,Total Days,Present,Late,Absent,Total Hours');
                rows.forEach(r => lines.push([`"${r.employeeName}"`, r.role, r.totalDays, r.presentDays, r.lateDays, r.absentDays, Number(r.totalHours).toFixed(1)].join(',')));
                break;
            }
            case 'OVERTIME': {
                const conditions: any[] = [gte(attendance.date, start), lte(attendance.date, end)];
                if (branchId) conditions.push(eq(attendance.branchId, branchId));
                const rows = await db.select({
                    employeeName: employees.name, role: employees.role, hourlyRate: employees.hourlyRate,
                    totalHours: sql<number>`coalesce(sum(${attendance.totalHours}), 0)`,
                    overtimeHours: sql<number>`coalesce(sum(greatest(${attendance.totalHours} - 8, 0)), 0)`,
                }).from(attendance).innerJoin(employees, eq(attendance.employeeId, employees.id))
                    .where(and(...conditions)).groupBy(employees.name, employees.role, employees.hourlyRate)
                    .having(sql`sum(greatest(${attendance.totalHours} - 8, 0)) > 0`);
                lines.push('Employee,Role,Total Hours,Overtime Hours,Hourly Rate,OT Cost');
                rows.forEach(r => lines.push([`"${r.employeeName}"`, r.role, Number(r.totalHours).toFixed(1), Number(r.overtimeHours).toFixed(1), Number(r.hourlyRate || 0).toFixed(2), (Number(r.overtimeHours) * Number(r.hourlyRate || 0) * 1.5).toFixed(2)].join(',')));
                break;
            }
            case 'CUSTOMER_LTV': {
                const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, ['DELIVERED', 'COMPLETED']), sql`${orders.customerId} is not null`];
                if (branchId) conditions.push(eq(orders.branchId, branchId));
                const rows = await db.select({
                    customerName: customers.name, phone: customers.phone,
                    totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`, orderCount: sql<number>`count(*)`,
                    avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
                }).from(orders).innerJoin(customers, eq(orders.customerId, customers.id))
                    .where(and(...conditions)).groupBy(customers.name, customers.phone)
                    .orderBy(sql`sum(${orders.total}) desc`).limit(100);
                lines.push('Customer,Phone,Total Spent,Orders,Avg Ticket');
                rows.forEach(r => lines.push([`"${r.customerName}"`, r.phone, Number(r.totalSpent).toFixed(2), r.orderCount, Number(r.avgTicket).toFixed(2)].join(',')));
                break;
            }
            case 'CAMPAIGN_ROI': {
                const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(50);
                lines.push('Campaign,Type,Status,Reach,Conversions,Revenue,Budget,ROI %');
                rows.forEach(r => {
                    const roi = Number(r.budget || 0) > 0 ? ((Number(r.revenue || 0) - Number(r.budget || 0)) / Number(r.budget || 0) * 100).toFixed(1) : '0';
                    lines.push([`"${r.name}"`, r.type, r.status, r.reach, r.conversions, Number(r.revenue || 0).toFixed(2), Number(r.budget || 0).toFixed(2), roi].join(','));
                });
                break;
            }
            case 'BRANCH_PERFORMANCE': {
                const rows = await db.select({
                    branchName: branches.name, orderCount: sql<number>`count(*)`,
                    revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
                    avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
                    cancelledCount: sql<number>`count(*) filter (where ${orders.status} = 'CANCELLED')`,
                }).from(orders).innerJoin(branches, eq(orders.branchId, branches.id))
                    .where(and(gte(orders.createdAt, start), lte(orders.createdAt, end)))
                    .groupBy(branches.name).orderBy(sql`sum(${orders.total}) desc`);
                lines.push('Branch,Orders,Revenue,Avg Ticket,Cancelled');
                rows.forEach(r => lines.push([`"${r.branchName}"`, r.orderCount, Number(r.revenue).toFixed(2), Number(r.avgTicket).toFixed(2), r.cancelledCount].join(',')));
                break;
            }
            case 'ORDER_PREP_TIME': {
                const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, ['DELIVERED', 'COMPLETED']), sql`${orders.completedAt} is not null`];
                if (branchId) conditions.push(eq(orders.branchId, branchId));
                const rows = await db.select({
                    branchName: branches.name, orderType: orders.type,
                    avgPrepMinutes: sql<number>`coalesce(avg(extract(epoch from (${orders.completedAt} - ${orders.createdAt})) / 60), 0)`,
                    orderCount: sql<number>`count(*)`,
                }).from(orders).innerJoin(branches, eq(orders.branchId, branches.id))
                    .where(and(...conditions)).groupBy(branches.name, orders.type);
                lines.push('Branch,Order Type,Orders,Avg Prep (min)');
                rows.forEach(r => lines.push([`"${r.branchName}"`, r.orderType, r.orderCount, Number(r.avgPrepMinutes).toFixed(1)].join(',')));
                break;
            }
            default: {
                // Default: sales overview
                const snapshot = await getExportSnapshot(branchId, start, end);
                const dailyRows = aggregateDailyRows(snapshot.daily, granularity);
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
                    lines.push([row.day, Number(row.revenue || 0).toFixed(2), Number(row.net || 0).toFixed(2), Number(row.tax || 0).toFixed(2), Number(row.orderCount || 0)].join(','));
                });
                lines.push('');
                lines.push('Payments');
                lines.push('Method,Total,Count');
                snapshot.payments.forEach((p: any) => {
                    lines.push([p.method, Number(p.total || 0).toFixed(2), Number(p.count || 0)].join(','));
                });
                break;
            }
        }

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
        const filename = `report_${reportType.toLowerCase()}_${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const doc = new PDFDocument({ margin: 36, size: 'A4' });
        doc.pipe(res);

        doc.fontSize(18).text('RestoFlow Report Export', { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Type: ${reportType}`);
        doc.text(`Branch: ${branchId || 'ALL'}`);
        doc.text(`Range: ${start.toISOString().split('T')[0]} → ${end.toISOString().split('T')[0]}`);
        doc.moveDown();

        const addTableHeader = (headers: string[]) => {
            doc.fontSize(8).font('Helvetica-Bold');
            const colWidth = (doc.page.width - 72) / headers.length;
            headers.forEach((h, i) => doc.text(h, 36 + i * colWidth, doc.y, { width: colWidth, continued: i < headers.length - 1 }));
            doc.moveDown(0.3);
            doc.font('Helvetica').fontSize(8);
        };

        switch (reportType) {
            case 'TRIAL_BALANCE': {
                const rows = await db.select({
                    code: chartOfAccounts.code, name: chartOfAccounts.name, type: chartOfAccounts.type,
                    debit: sql<number>`coalesce(sum(${journalLines.debit}), 0)`,
                    credit: sql<number>`coalesce(sum(${journalLines.credit}), 0)`,
                }).from(journalLines)
                    .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
                    .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
                    .where(and(gte(journalEntries.date, start), lte(journalEntries.date, end), eq(journalEntries.status, 'POSTED')))
                    .groupBy(chartOfAccounts.code, chartOfAccounts.name, chartOfAccounts.type).orderBy(chartOfAccounts.code);
                doc.fontSize(12).text('Trial Balance', { underline: true }); doc.moveDown(0.5);
                rows.forEach(r => { doc.text(`${r.code} | ${r.name} | Dr ${Number(r.debit).toFixed(2)} | Cr ${Number(r.credit).toFixed(2)} | Bal ${(Number(r.debit) - Number(r.credit)).toFixed(2)}`); });
                break;
            }
            case 'TOP_EXPENSES': {
                const rows = await db.select({
                    name: chartOfAccounts.name,
                    total: sql<number>`coalesce(sum(${journalLines.debit}) - sum(${journalLines.credit}), 0)`,
                }).from(journalLines)
                    .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
                    .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
                    .where(and(gte(journalEntries.date, start), lte(journalEntries.date, end), eq(journalEntries.status, 'POSTED'), eq(chartOfAccounts.type, 'EXPENSE')))
                    .groupBy(chartOfAccounts.name).orderBy(sql`sum(${journalLines.debit}) - sum(${journalLines.credit}) desc`).limit(20);
                doc.fontSize(12).text('Top Expenses', { underline: true }); doc.moveDown(0.5);
                rows.forEach((r, i) => { doc.text(`${i + 1}. ${r.name}: ${Number(r.total).toFixed(2)} LE`); });
                break;
            }
            case 'REORDER_ALERTS': {
                const rows = await db.select({
                    itemName: inventoryItems.name, unit: inventoryItems.unit, threshold: inventoryItems.threshold,
                    currentStock: sql<number>`coalesce(sum(${inventoryStock.quantity}), 0)`,
                }).from(inventoryItems)
                    .leftJoin(inventoryStock, eq(inventoryItems.id, inventoryStock.itemId))
                    .where(eq(inventoryItems.isActive, true))
                    .groupBy(inventoryItems.id, inventoryItems.name, inventoryItems.unit, inventoryItems.threshold)
                    .having(sql`coalesce(sum(${inventoryStock.quantity}), 0) <= ${inventoryItems.threshold}`);
                doc.fontSize(12).text(`Reorder Alerts (${rows.length} items)`, { underline: true }); doc.moveDown(0.5);
                rows.forEach(r => { doc.text(`${r.itemName} (${r.unit}): Stock ${Number(r.currentStock)} / Threshold ${r.threshold}`); });
                break;
            }
            case 'PAYROLL': {
                const conditions: any[] = [gte(payrollCycles.periodStart, start), lte(payrollCycles.periodEnd, end)];
                if (branchId) conditions.push(eq(payrollCycles.branchId, branchId));
                const cycles = await db.select().from(payrollCycles).where(and(...conditions));
                doc.fontSize(12).text('Payroll Summary', { underline: true }); doc.moveDown(0.5);
                if (cycles.length > 0) {
                    const payouts = await db.select({
                        employeeName: employees.name, role: employees.role, netPay: payrollPayouts.netPay,
                    }).from(payrollPayouts).innerJoin(employees, eq(payrollPayouts.employeeId, employees.id))
                        .where(inArray(payrollPayouts.cycleId, cycles.map(c => c.id)));
                    const total = payouts.reduce((s, p) => s + Number(p.netPay), 0);
                    doc.text(`Total Payroll: ${total.toFixed(2)} LE`); doc.moveDown(0.3);
                    payouts.forEach(p => { doc.text(`${p.employeeName} (${p.role}): ${Number(p.netPay).toFixed(2)} LE`); });
                } else {
                    doc.text('No payroll cycles found for this period.');
                }
                break;
            }
            case 'ATTENDANCE': {
                const conditions: any[] = [gte(attendance.date, start), lte(attendance.date, end)];
                if (branchId) conditions.push(eq(attendance.branchId, branchId));
                const rows = await db.select({
                    employeeName: employees.name, role: employees.role,
                    presentDays: sql<number>`count(*) filter (where ${attendance.status} = 'PRESENT')`,
                    lateDays: sql<number>`count(*) filter (where ${attendance.status} = 'LATE')`,
                    absentDays: sql<number>`count(*) filter (where ${attendance.status} = 'ABSENT')`,
                    totalHours: sql<number>`coalesce(sum(${attendance.totalHours}), 0)`,
                }).from(attendance).innerJoin(employees, eq(attendance.employeeId, employees.id))
                    .where(and(...conditions)).groupBy(employees.name, employees.role);
                doc.fontSize(12).text('Attendance Report', { underline: true }); doc.moveDown(0.5);
                rows.forEach(r => { doc.text(`${r.employeeName} (${r.role}): P:${r.presentDays} L:${r.lateDays} A:${r.absentDays} | ${Number(r.totalHours).toFixed(1)}h`); });
                break;
            }
            case 'CUSTOMER_LTV': {
                const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, ['DELIVERED', 'COMPLETED']), sql`${orders.customerId} is not null`];
                if (branchId) conditions.push(eq(orders.branchId, branchId));
                const rows = await db.select({
                    customerName: customers.name, totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
                    orderCount: sql<number>`count(*)`,
                }).from(orders).innerJoin(customers, eq(orders.customerId, customers.id))
                    .where(and(...conditions)).groupBy(customers.name).orderBy(sql`sum(${orders.total}) desc`).limit(50);
                doc.fontSize(12).text('Customer LTV', { underline: true }); doc.moveDown(0.5);
                rows.forEach((r, i) => { doc.text(`${i + 1}. ${r.customerName}: ${Number(r.totalSpent).toFixed(2)} LE (${r.orderCount} orders)`); });
                break;
            }
            case 'BRANCH_PERFORMANCE': {
                const rows = await db.select({
                    branchName: branches.name, orderCount: sql<number>`count(*)`,
                    revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
                    avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
                }).from(orders).innerJoin(branches, eq(orders.branchId, branches.id))
                    .where(and(gte(orders.createdAt, start), lte(orders.createdAt, end)))
                    .groupBy(branches.name).orderBy(sql`sum(${orders.total}) desc`);
                doc.fontSize(12).text('Branch Performance', { underline: true }); doc.moveDown(0.5);
                rows.forEach(r => { doc.text(`${r.branchName}: ${Number(r.revenue).toFixed(2)} LE | ${r.orderCount} orders | Avg ${Number(r.avgTicket).toFixed(2)} LE`); });
                break;
            }
            default: {
                const snapshot = await getExportSnapshot(branchId, start, end);
                const dailyRows = aggregateDailyRows(snapshot.daily, granularity);
                doc.fontSize(12).text('Summary', { underline: true }); doc.fontSize(10);
                doc.text(`Orders: ${Number(snapshot.overview.orderCount || 0)}`);
                doc.text(`Gross Sales: ${Number(snapshot.overview.grossSales || 0).toFixed(2)}`);
                doc.text(`Net Sales: ${Number(snapshot.overview.netSales || 0).toFixed(2)}`);
                doc.text(`Tax Total: ${Number(snapshot.overview.taxTotal || 0).toFixed(2)}`);
                doc.text(`Discount Total: ${Number(snapshot.overview.discountTotal || 0).toFixed(2)}`);
                doc.text(`COGS: ${Number(snapshot.profit.cogs || 0).toFixed(2)}`);
                doc.moveDown();
                doc.fontSize(12).text('Time Series', { underline: true }); doc.fontSize(9);
                dailyRows.slice(0, 20).forEach((row: any) => {
                    doc.text(`${row.day} | Rev ${Number(row.revenue || 0).toFixed(2)} | Net ${Number(row.net || 0).toFixed(2)} | Orders ${Number(row.orderCount || 0)}`);
                });
                doc.moveDown();
                doc.fontSize(12).text('Payment Mix', { underline: true }); doc.fontSize(9);
                snapshot.payments.forEach((p: any) => { doc.text(`${p.method} | ${Number(p.total || 0).toFixed(2)} | count ${Number(p.count || 0)}`); });
                break;
            }
        }

        doc.end();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// FINANCE REPORTS
// ============================================================================

export const getTrialBalance = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const rows = await db.select({
            accountId: journalLines.accountId,
            accountCode: chartOfAccounts.code,
            accountName: chartOfAccounts.name,
            accountType: chartOfAccounts.type,
            totalDebit: sql<number>`coalesce(sum(${journalLines.debit}), 0)`,
            totalCredit: sql<number>`coalesce(sum(${journalLines.credit}), 0)`,
        })
            .from(journalLines)
            .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
            .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
            .where(and(
                gte(journalEntries.date, start),
                lte(journalEntries.date, end),
                eq(journalEntries.status, 'POSTED')
            ))
            .groupBy(journalLines.accountId, chartOfAccounts.code, chartOfAccounts.name, chartOfAccounts.type)
            .orderBy(chartOfAccounts.code);

        const result = rows.map(r => ({
            ...r,
            totalDebit: Number(r.totalDebit),
            totalCredit: Number(r.totalCredit),
            balance: Number(r.totalDebit) - Number(r.totalCredit),
        }));

        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getProfitAndLoss = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const conditions = [
            gte(journalEntries.date, start),
            lte(journalEntries.date, end),
            eq(journalEntries.status, 'POSTED'),
        ];

        const rows = await db.select({
            accountType: chartOfAccounts.type,
            accountName: chartOfAccounts.name,
            totalDebit: sql<number>`coalesce(sum(${journalLines.debit}), 0)`,
            totalCredit: sql<number>`coalesce(sum(${journalLines.credit}), 0)`,
        })
            .from(journalLines)
            .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
            .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
            .where(and(...conditions))
            .groupBy(chartOfAccounts.type, chartOfAccounts.name)
            .orderBy(chartOfAccounts.type);

        const revenue = rows.filter(r => r.accountType === 'REVENUE').reduce((s, r) => s + Number(r.totalCredit) - Number(r.totalDebit), 0);
        const expenses = rows.filter(r => r.accountType === 'EXPENSE').reduce((s, r) => s + Number(r.totalDebit) - Number(r.totalCredit), 0);

        res.json({
            revenue,
            expenses,
            netProfit: revenue - expenses,
            details: rows.map(r => ({
                type: r.accountType,
                name: r.accountName,
                debit: Number(r.totalDebit),
                credit: Number(r.totalCredit),
                net: Number(r.totalCredit) - Number(r.totalDebit),
            })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getTopExpenses = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const rows = await db.select({
            accountName: chartOfAccounts.name,
            total: sql<number>`coalesce(sum(${journalLines.debit}) - sum(${journalLines.credit}), 0)`,
        })
            .from(journalLines)
            .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
            .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
            .where(and(
                gte(journalEntries.date, start),
                lte(journalEntries.date, end),
                eq(journalEntries.status, 'POSTED'),
                eq(chartOfAccounts.type, 'EXPENSE')
            ))
            .groupBy(chartOfAccounts.name)
            .orderBy(sql`sum(${journalLines.debit}) - sum(${journalLines.credit}) desc`)
            .limit(20);

        res.json(rows.map(r => ({ name: r.accountName, total: Number(r.total) })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// INVENTORY REPORTS
// ============================================================================

export const getStockMovementLog = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const rows = await db.select({
            id: stockMovements.id,
            itemName: inventoryItems.name,
            quantity: stockMovements.quantity,
            unitCost: stockMovements.unitCost,
            totalCost: stockMovements.totalCost,
            type: stockMovements.type,
            reason: stockMovements.reason,
            performedBy: stockMovements.performedBy,
            createdAt: stockMovements.createdAt,
        })
            .from(stockMovements)
            .innerJoin(inventoryItems, eq(stockMovements.itemId, inventoryItems.id))
            .where(and(
                gte(stockMovements.createdAt, start),
                lte(stockMovements.createdAt, end)
            ))
            .orderBy(desc(stockMovements.createdAt))
            .limit(500);

        res.json(rows);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getWasteLossLog = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const rows = await db.select({
            id: stockMovements.id,
            itemName: inventoryItems.name,
            unit: inventoryItems.unit,
            quantity: stockMovements.quantity,
            unitCost: stockMovements.unitCost,
            totalCost: stockMovements.totalCost,
            reason: stockMovements.reason,
            performedBy: stockMovements.performedBy,
            createdAt: stockMovements.createdAt,
        })
            .from(stockMovements)
            .innerJoin(inventoryItems, eq(stockMovements.itemId, inventoryItems.id))
            .where(and(
                gte(stockMovements.createdAt, start),
                lte(stockMovements.createdAt, end),
                inArray(stockMovements.type, ['WASTE', 'ADJUSTMENT'])
            ))
            .orderBy(desc(stockMovements.createdAt))
            .limit(500);

        const totalWasteCost = rows.reduce((s, r) => s + Number(r.totalCost || 0), 0);
        res.json({ items: rows, totalWasteCost, count: rows.length });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getReorderAlerts = async (_req: Request, res: Response) => {
    try {
        const rows = await db.select({
            itemId: inventoryItems.id,
            itemName: inventoryItems.name,
            unit: inventoryItems.unit,
            threshold: inventoryItems.threshold,
            costPrice: inventoryItems.costPrice,
            currentStock: sql<number>`coalesce(sum(${inventoryStock.quantity}), 0)`,
        })
            .from(inventoryItems)
            .leftJoin(inventoryStock, eq(inventoryItems.id, inventoryStock.itemId))
            .where(eq(inventoryItems.isActive, true))
            .groupBy(inventoryItems.id, inventoryItems.name, inventoryItems.unit, inventoryItems.threshold, inventoryItems.costPrice)
            .having(sql`coalesce(sum(${inventoryStock.quantity}), 0) <= ${inventoryItems.threshold}`)
            .orderBy(sql`coalesce(sum(${inventoryStock.quantity}), 0) asc`);

        res.json(rows.map(r => ({
            ...r,
            currentStock: Number(r.currentStock),
            deficit: Number(r.threshold || 0) - Number(r.currentStock),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getExpiringBatches = async (_req: Request, res: Response) => {
    try {
        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        const rows = await db.select({
            batchId: inventoryBatches.id,
            batchNumber: inventoryBatches.batchNumber,
            itemName: inventoryItems.name,
            unit: inventoryItems.unit,
            currentQty: inventoryBatches.currentQty,
            unitCost: inventoryBatches.unitCost,
            expiryDate: inventoryBatches.expiryDate,
            receivedDate: inventoryBatches.receivedDate,
            status: inventoryBatches.status,
        })
            .from(inventoryBatches)
            .innerJoin(inventoryItems, eq(inventoryBatches.itemId, inventoryItems.id))
            .where(and(
                lte(inventoryBatches.expiryDate, thirtyDaysLater),
                gte(inventoryBatches.currentQty, sql`0.01`),
                inArray(inventoryBatches.status, ['ACTIVE', 'QUARANTINE'])
            ))
            .orderBy(inventoryBatches.expiryDate)
            .limit(200);

        const totalAtRiskValue = rows.reduce((s, r) => s + Number(r.currentQty) * Number(r.unitCost), 0);
        const alreadyExpired = rows.filter(r => new Date(r.expiryDate!) <= now).length;

        res.json({ items: rows, totalAtRiskValue, alreadyExpired, totalBatches: rows.length });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// HR REPORTS
// ============================================================================

export const getPayrollSummary = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const conditions: any[] = [
            gte(payrollCycles.periodStart, start),
            lte(payrollCycles.periodEnd, end),
        ];
        if (branchId) conditions.push(eq(payrollCycles.branchId, branchId as string));

        const cycles = await db.select().from(payrollCycles).where(and(...conditions)).orderBy(desc(payrollCycles.periodStart));

        if (cycles.length === 0) return res.json({ cycles: [], payouts: [], totalPayroll: 0 });

        const cycleIds = cycles.map(c => c.id);
        const payouts = await db.select({
            cycleId: payrollPayouts.cycleId,
            employeeName: employees.name,
            role: employees.role,
            basicSalary: payrollPayouts.basicSalary,
            deductions: payrollPayouts.deductions,
            overtime: payrollPayouts.overtime,
            netPay: payrollPayouts.netPay,
            status: payrollPayouts.status,
        })
            .from(payrollPayouts)
            .innerJoin(employees, eq(payrollPayouts.employeeId, employees.id))
            .where(inArray(payrollPayouts.cycleId, cycleIds))
            .orderBy(employees.name);

        const totalPayroll = payouts.reduce((s, p) => s + Number(p.netPay), 0);
        res.json({ cycles, payouts, totalPayroll });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAttendanceReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const conditions: any[] = [
            gte(attendance.date, start),
            lte(attendance.date, end),
        ];
        if (branchId) conditions.push(eq(attendance.branchId, branchId as string));

        const rows = await db.select({
            employeeName: employees.name,
            role: employees.role,
            totalDays: sql<number>`count(*)`,
            presentDays: sql<number>`count(*) filter (where ${attendance.status} = 'PRESENT')`,
            lateDays: sql<number>`count(*) filter (where ${attendance.status} = 'LATE')`,
            absentDays: sql<number>`count(*) filter (where ${attendance.status} = 'ABSENT')`,
            sickDays: sql<number>`count(*) filter (where ${attendance.status} = 'SICK_LEAVE')`,
            totalHours: sql<number>`coalesce(sum(${attendance.totalHours}), 0)`,
            avgHoursPerDay: sql<number>`coalesce(avg(${attendance.totalHours}), 0)`,
        })
            .from(attendance)
            .innerJoin(employees, eq(attendance.employeeId, employees.id))
            .where(and(...conditions))
            .groupBy(employees.name, employees.role)
            .orderBy(employees.name);

        res.json(rows.map(r => ({
            ...r,
            totalDays: Number(r.totalDays),
            presentDays: Number(r.presentDays),
            lateDays: Number(r.lateDays),
            absentDays: Number(r.absentDays),
            sickDays: Number(r.sickDays),
            totalHours: Number(Number(r.totalHours).toFixed(1)),
            avgHoursPerDay: Number(Number(r.avgHoursPerDay).toFixed(1)),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getOvertimeReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const conditions: any[] = [
            gte(attendance.date, start),
            lte(attendance.date, end),
        ];
        if (branchId) conditions.push(eq(attendance.branchId, branchId as string));

        const rows = await db.select({
            employeeName: employees.name,
            role: employees.role,
            hourlyRate: employees.hourlyRate,
            totalHours: sql<number>`coalesce(sum(${attendance.totalHours}), 0)`,
            workDays: sql<number>`count(*)`,
            overtimeHours: sql<number>`coalesce(sum(greatest(${attendance.totalHours} - 8, 0)), 0)`,
        })
            .from(attendance)
            .innerJoin(employees, eq(attendance.employeeId, employees.id))
            .where(and(...conditions))
            .groupBy(employees.name, employees.role, employees.hourlyRate)
            .having(sql`sum(greatest(${attendance.totalHours} - 8, 0)) > 0`)
            .orderBy(sql`sum(greatest(${attendance.totalHours} - 8, 0)) desc`);

        res.json(rows.map(r => ({
            ...r,
            totalHours: Number(Number(r.totalHours).toFixed(1)),
            workDays: Number(r.workDays),
            overtimeHours: Number(Number(r.overtimeHours).toFixed(1)),
            overtimeCost: Number((Number(r.overtimeHours) * Number(r.hourlyRate || 0) * 1.5).toFixed(2)),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// CRM REPORTS
// ============================================================================

export const getCustomerLTV = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];

        const conditions: any[] = [
            gte(orders.createdAt, start),
            lte(orders.createdAt, end),
            inArray(orders.status, deliveredStatuses),
            sql`${orders.customerId} is not null`,
        ];
        if (branchId) conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            customerId: orders.customerId,
            customerName: customers.name,
            phone: customers.phone,
            totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
            orderCount: sql<number>`count(*)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
            firstOrder: sql<string>`min(${orders.createdAt})`,
            lastOrder: sql<string>`max(${orders.createdAt})`,
        })
            .from(orders)
            .innerJoin(customers, eq(orders.customerId, customers.id))
            .where(and(...conditions))
            .groupBy(orders.customerId, customers.name, customers.phone)
            .orderBy(sql`sum(${orders.total}) desc`)
            .limit(100);

        res.json(rows.map(r => ({
            ...r,
            totalSpent: Number(Number(r.totalSpent).toFixed(2)),
            orderCount: Number(r.orderCount),
            avgTicket: Number(Number(r.avgTicket).toFixed(2)),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getCampaignROI = async (_req: Request, res: Response) => {
    try {
        const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(50);

        res.json(rows.map(r => ({
            id: r.id,
            name: r.name,
            type: r.type,
            status: r.status,
            reach: r.reach || 0,
            conversions: r.conversions || 0,
            revenue: Number(r.revenue || 0),
            budget: Number(r.budget || 0),
            roi: Number(r.budget || 0) > 0 ? Number(((Number(r.revenue || 0) - Number(r.budget || 0)) / Number(r.budget || 0) * 100).toFixed(1)) : 0,
            conversionRate: Number(r.reach || 0) > 0 ? Number((Number(r.conversions || 0) / Number(r.reach || 0) * 100).toFixed(1)) : 0,
            createdAt: r.createdAt,
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// OPERATIONS REPORTS
// ============================================================================

export const getBranchPerformance = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];

        const rows = await db.select({
            branchId: orders.branchId,
            branchName: branches.name,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
            cancelledCount: sql<number>`count(*) filter (where ${orders.status} = 'CANCELLED')`,
        })
            .from(orders)
            .innerJoin(branches, eq(orders.branchId, branches.id))
            .where(and(
                gte(orders.createdAt, start),
                lte(orders.createdAt, end),
            ))
            .groupBy(orders.branchId, branches.name)
            .orderBy(sql`sum(${orders.total}) desc`);

        res.json(rows.map(r => ({
            ...r,
            orderCount: Number(r.orderCount),
            revenue: Number(Number(r.revenue).toFixed(2)),
            avgTicket: Number(Number(r.avgTicket).toFixed(2)),
            cancelledCount: Number(r.cancelledCount),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getOrderPrepTime = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];

        const conditions: any[] = [
            gte(orders.createdAt, start),
            lte(orders.createdAt, end),
            inArray(orders.status, deliveredStatuses),
            sql`${orders.completedAt} is not null`,
        ];
        if (branchId) conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            branchName: branches.name,
            orderType: orders.type,
            avgPrepMinutes: sql<number>`coalesce(avg(extract(epoch from (${orders.completedAt} - ${orders.createdAt})) / 60), 0)`,
            minPrepMinutes: sql<number>`coalesce(min(extract(epoch from (${orders.completedAt} - ${orders.createdAt})) / 60), 0)`,
            maxPrepMinutes: sql<number>`coalesce(max(extract(epoch from (${orders.completedAt} - ${orders.createdAt})) / 60), 0)`,
            orderCount: sql<number>`count(*)`,
        })
            .from(orders)
            .innerJoin(branches, eq(orders.branchId, branches.id))
            .where(and(...conditions))
            .groupBy(branches.name, orders.type)
            .orderBy(branches.name);

        res.json(rows.map(r => ({
            ...r,
            avgPrepMinutes: Number(Number(r.avgPrepMinutes).toFixed(1)),
            minPrepMinutes: Number(Number(r.minPrepMinutes).toFixed(1)),
            maxPrepMinutes: Number(Number(r.maxPrepMinutes).toFixed(1)),
            orderCount: Number(r.orderCount),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// EXTENDED SALES REPORTS
// ============================================================================

export const getSalesByOrderType = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            orderType: orders.type,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            netRevenue: sql<number>`coalesce(sum(${orders.subtotal} - ${orders.discount}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
            totalDiscount: sql<number>`coalesce(sum(${orders.discount}), 0)`,
            totalDeliveryFee: sql<number>`coalesce(sum(${orders.deliveryFee}), 0)`,
            totalTax: sql<number>`coalesce(sum(${orders.tax}), 0)`,
        }).from(orders)
            .where(and(...conditions))
            .groupBy(orders.type)
            .orderBy(sql`sum(${orders.total}) desc`);

        const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue), 0);
        res.json(rows.map(r => ({
            ...r,
            orderCount: Number(r.orderCount),
            revenue: Number(Number(r.revenue).toFixed(2)),
            netRevenue: Number(Number(r.netRevenue).toFixed(2)),
            avgTicket: Number(Number(r.avgTicket).toFixed(2)),
            totalDiscount: Number(Number(r.totalDiscount).toFixed(2)),
            totalDeliveryFee: Number(Number(r.totalDeliveryFee).toFixed(2)),
            totalTax: Number(Number(r.totalTax).toFixed(2)),
            percentage: totalRevenue > 0 ? Number(((Number(r.revenue) / totalRevenue) * 100).toFixed(1)) : 0,
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getSalesByItem = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            menuItemId: orderItems.menuItemId,
            itemName: orderItems.name,
            qtySold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
            revenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)`,
            cost: sql<number>`coalesce(sum(coalesce(${orderItems.cost}, 0) * ${orderItems.quantity}), 0)`,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(...conditions))
            .groupBy(orderItems.menuItemId, orderItems.name)
            .orderBy(sql`sum(${orderItems.price} * ${orderItems.quantity}) desc`)
            .limit(100);

        res.json(rows.map(r => ({
            menuItemId: r.menuItemId,
            itemName: r.itemName,
            qtySold: Number(r.qtySold),
            revenue: Number(Number(r.revenue).toFixed(2)),
            cost: Number(Number(r.cost).toFixed(2)),
            profit: Number((Number(r.revenue) - Number(r.cost)).toFixed(2)),
            marginPercent: Number(r.revenue) > 0 ? Number(((Number(r.revenue) - Number(r.cost)) / Number(r.revenue) * 100).toFixed(1)) : 0,
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getSalesByCategory = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            categoryId: menuItems.categoryId,
            categoryName: menuCategories.name,
            qtySold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
            revenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)`,
            cost: sql<number>`coalesce(sum(coalesce(${orderItems.cost}, 0) * ${orderItems.quantity}), 0)`,
            itemCount: sql<number>`count(distinct ${orderItems.menuItemId})`,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
            .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
            .where(and(...conditions))
            .groupBy(menuItems.categoryId, menuCategories.name)
            .orderBy(sql`sum(${orderItems.price} * ${orderItems.quantity}) desc`);

        const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue), 0);
        res.json(rows.map(r => ({
            categoryId: r.categoryId,
            categoryName: r.categoryName || 'Uncategorized',
            qtySold: Number(r.qtySold),
            revenue: Number(Number(r.revenue).toFixed(2)),
            cost: Number(Number(r.cost).toFixed(2)),
            profit: Number((Number(r.revenue) - Number(r.cost)).toFixed(2)),
            itemCount: Number(r.itemCount),
            percentage: totalRevenue > 0 ? Number(((Number(r.revenue) / totalRevenue) * 100).toFixed(1)) : 0,
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getDiscountAnalysis = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [
            gte(orders.createdAt, start), lte(orders.createdAt, end),
            inArray(orders.status, deliveredStatuses),
            sql`${orders.discount} > 0`
        ];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        // By reason
        const byReason = await db.select({
            reason: sql<string>`coalesce(${orders.discountReason}, 'No Reason')`,
            orderCount: sql<number>`count(*)`,
            totalDiscount: sql<number>`coalesce(sum(${orders.discount}), 0)`,
            avgDiscount: sql<number>`coalesce(avg(${orders.discount}), 0)`,
        }).from(orders)
            .where(and(...conditions))
            .groupBy(orders.discountReason)
            .orderBy(sql`sum(${orders.discount}) desc`);

        // By type
        const byType = await db.select({
            discountType: sql<string>`coalesce(${orders.discountType}, 'unknown')`,
            orderCount: sql<number>`count(*)`,
            totalDiscount: sql<number>`coalesce(sum(${orders.discount}), 0)`,
        }).from(orders)
            .where(and(...conditions))
            .groupBy(orders.discountType);

        // Summary
        const [summary] = await db.select({
            totalOrders: sql<number>`count(*)`,
            totalDiscount: sql<number>`coalesce(sum(${orders.discount}), 0)`,
            avgDiscount: sql<number>`coalesce(avg(${orders.discount}), 0)`,
            maxDiscount: sql<number>`coalesce(max(${orders.discount}), 0)`,
        }).from(orders).where(and(...conditions));

        // Total orders to get discount rate
        const [allOrders] = await db.select({
            totalOrders: sql<number>`count(*)`,
        }).from(orders).where(and(
            gte(orders.createdAt, start), lte(orders.createdAt, end),
            inArray(orders.status, deliveredStatuses),
            branchId && branchId !== 'undefined' ? eq(orders.branchId, branchId as string) : undefined
        ));

        res.json({
            summary: {
                totalDiscountedOrders: Number(summary?.totalOrders || 0),
                totalOrders: Number(allOrders?.totalOrders || 0),
                discountRate: Number(allOrders?.totalOrders || 0) > 0
                    ? Number(((Number(summary?.totalOrders || 0) / Number(allOrders?.totalOrders || 1)) * 100).toFixed(1))
                    : 0,
                totalDiscount: Number(Number(summary?.totalDiscount || 0).toFixed(2)),
                avgDiscount: Number(Number(summary?.avgDiscount || 0).toFixed(2)),
                maxDiscount: Number(Number(summary?.maxDiscount || 0).toFixed(2)),
            },
            byReason: byReason.map(r => ({
                reason: r.reason,
                orderCount: Number(r.orderCount),
                totalDiscount: Number(Number(r.totalDiscount).toFixed(2)),
                avgDiscount: Number(Number(r.avgDiscount).toFixed(2)),
            })),
            byType: byType.map(r => ({
                discountType: r.discountType,
                orderCount: Number(r.orderCount),
                totalDiscount: Number(Number(r.totalDiscount).toFixed(2)),
            })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getCancelledOrders = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [
            gte(orders.createdAt, start), lte(orders.createdAt, end),
            eq(orders.status, 'CANCELLED'),
        ];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            type: orders.type,
            total: orders.total,
            cancelReason: orders.cancelReason,
            cancelledAt: orders.cancelledAt,
            createdAt: orders.createdAt,
            customerName: orders.customerName,
        }).from(orders)
            .where(and(...conditions))
            .orderBy(desc(orders.cancelledAt))
            .limit(200);

        // Summary
        const [summary] = await db.select({
            cancelledCount: sql<number>`count(*)`,
            cancelledTotal: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions));

        const [allOrders] = await db.select({
            totalOrders: sql<number>`count(*)`,
        }).from(orders).where(and(
            gte(orders.createdAt, start), lte(orders.createdAt, end),
            branchId && branchId !== 'undefined' ? eq(orders.branchId, branchId as string) : undefined
        ));

        // By reason
        const byReason = await db.select({
            reason: sql<string>`coalesce(${orders.cancelReason}, 'No Reason')`,
            count: sql<number>`count(*)`,
            total: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders)
            .where(and(...conditions))
            .groupBy(orders.cancelReason)
            .orderBy(sql`count(*) desc`);

        res.json({
            summary: {
                cancelledCount: Number(summary?.cancelledCount || 0),
                cancelledTotal: Number(Number(summary?.cancelledTotal || 0).toFixed(2)),
                totalOrders: Number(allOrders?.totalOrders || 0),
                cancelRate: Number(allOrders?.totalOrders || 0) > 0
                    ? Number(((Number(summary?.cancelledCount || 0) / Number(allOrders?.totalOrders || 1)) * 100).toFixed(1))
                    : 0,
            },
            byReason: byReason.map(r => ({
                reason: r.reason,
                count: Number(r.count),
                total: Number(Number(r.total).toFixed(2)),
            })),
            orders: rows.map(r => ({
                ...r,
                total: Number(Number(r.total).toFixed(2)),
            })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getDeliveryPerformance = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [
            gte(orders.createdAt, start), lte(orders.createdAt, end),
            inArray(orders.status, deliveredStatuses),
            eq(orders.type, 'DELIVERY'),
        ];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const [summary] = await db.select({
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
            totalDeliveryFees: sql<number>`coalesce(sum(${orders.deliveryFee}), 0)`,
            freeDeliveryCount: sql<number>`count(*) filter (where ${orders.freeDelivery} = true)`,
            avgDeliveryMinutes: sql<number>`coalesce(avg(extract(epoch from (${orders.actualDeliveryTime} - ${orders.createdAt})) / 60), 0)`,
        }).from(orders).where(and(...conditions));

        // By driver
        const byDriver = await db.select({
            driverId: orders.driverId,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgDeliveryMinutes: sql<number>`coalesce(avg(extract(epoch from (${orders.actualDeliveryTime} - ${orders.createdAt})) / 60), 0)`,
        }).from(orders)
            .where(and(...conditions, sql`${orders.driverId} is not null`))
            .groupBy(orders.driverId)
            .orderBy(sql`count(*) desc`);

        res.json({
            summary: {
                orderCount: Number(summary?.orderCount || 0),
                revenue: Number(Number(summary?.revenue || 0).toFixed(2)),
                avgTicket: Number(Number(summary?.avgTicket || 0).toFixed(2)),
                totalDeliveryFees: Number(Number(summary?.totalDeliveryFees || 0).toFixed(2)),
                freeDeliveryCount: Number(summary?.freeDeliveryCount || 0),
                avgDeliveryMinutes: Number(Number(summary?.avgDeliveryMinutes || 0).toFixed(1)),
            },
            byDriver: byDriver.map(d => ({
                driverId: d.driverId,
                orderCount: Number(d.orderCount),
                revenue: Number(Number(d.revenue).toFixed(2)),
                avgDeliveryMinutes: Number(Number(d.avgDeliveryMinutes).toFixed(1)),
            })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getSalesBySource = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            source: sql<string>`coalesce(${orders.source}, 'pos')`,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
        }).from(orders)
            .where(and(...conditions))
            .groupBy(orders.source)
            .orderBy(sql`sum(${orders.total}) desc`);

        const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue), 0);
        res.json(rows.map(r => ({
            source: r.source,
            orderCount: Number(r.orderCount),
            revenue: Number(Number(r.revenue).toFixed(2)),
            avgTicket: Number(Number(r.avgTicket).toFixed(2)),
            percentage: totalRevenue > 0 ? Number(((Number(r.revenue) / totalRevenue) * 100).toFixed(1)) : 0,
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getDineInTableAnalysis = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [
            gte(orders.createdAt, start), lte(orders.createdAt, end),
            inArray(orders.status, deliveredStatuses),
            eq(orders.type, 'DINE_IN'),
            sql`${orders.tableId} is not null`,
        ];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            tableId: orders.tableId,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
            avgDurationMinutes: sql<number>`coalesce(avg(extract(epoch from (${orders.completedAt} - ${orders.createdAt})) / 60), 0)`,
        }).from(orders)
            .where(and(...conditions))
            .groupBy(orders.tableId)
            .orderBy(sql`sum(${orders.total}) desc`);

        res.json(rows.map(r => ({
            tableId: r.tableId,
            orderCount: Number(r.orderCount),
            revenue: Number(Number(r.revenue).toFixed(2)),
            avgTicket: Number(Number(r.avgTicket).toFixed(2)),
            avgDurationMinutes: Number(Number(r.avgDurationMinutes).toFixed(1)),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// ADVANCED SALES ANALYTICS
// ============================================================================

export const getPeakHoursHeatmap = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            dayOfWeek: sql<number>`extract(dow from ${orders.createdAt})`,
            hour: sql<number>`extract(hour from ${orders.createdAt})`,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`extract(dow from ${orders.createdAt})`, sql`extract(hour from ${orders.createdAt})`)
            .orderBy(sql`extract(dow from ${orders.createdAt})`, sql`extract(hour from ${orders.createdAt})`);

        res.json(rows.map(r => ({
            dayOfWeek: Number(r.dayOfWeek),
            hour: Number(r.hour),
            orderCount: Number(r.orderCount),
            revenue: Number(Number(r.revenue).toFixed(2)),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getModifierSales = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            id: orderItems.id,
            itemName: orderItems.name,
            modifiers: orderItems.modifiers,
            quantity: orderItems.quantity,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(...conditions, sql`${orderItems.modifiers} is not null`));

        const modifierMap = new Map<string, { name: string; count: number; revenue: number }>();
        for (const row of rows) {
            const mods = row.modifiers as any[];
            if (!mods || !Array.isArray(mods)) continue;
            for (const mod of mods) {
                const key = `${mod.groupName}:${mod.optionName}`;
                const existing = modifierMap.get(key) || { name: `${mod.groupName} → ${mod.optionName}`, count: 0, revenue: 0 };
                existing.count += (row.quantity || 1);
                existing.revenue += (mod.price || 0) * (row.quantity || 1);
                modifierMap.set(key, existing);
            }
        }

        const result = Array.from(modifierMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 100);

        res.json(result.map(r => ({ ...r, revenue: Number(r.revenue.toFixed(2)) })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAvgTicketTrend = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

        res.json(rows.map(r => ({
            day: r.day,
            avgTicket: Number(Number(r.avgTicket).toFixed(2)),
            orderCount: Number(r.orderCount),
            revenue: Number(Number(r.revenue).toFixed(2)),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getSalesComparison = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, compareStartDate, compareEndDate, branchId } = req.query;
        if (!startDate || !endDate || !compareStartDate || !compareEndDate) return res.status(400).json({ error: 'Both date ranges are required' });
        const { start: s1, end: e1 } = parseLocalDateRange(startDate as string, endDate as string);
        const { start: s2, end: e2 } = parseLocalDateRange(compareStartDate as string, compareEndDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];

        const buildConditions = (s: Date, e: Date) => {
            const c: any[] = [gte(orders.createdAt, s), lte(orders.createdAt, e), inArray(orders.status, deliveredStatuses)];
            if (branchId && branchId !== 'undefined') c.push(eq(orders.branchId, branchId as string));
            return c;
        };

        const [current] = await db.select({
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
            totalDiscount: sql<number>`coalesce(sum(${orders.discount}), 0)`,
        }).from(orders).where(and(...buildConditions(s1, e1)));

        const [compare] = await db.select({
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
            totalDiscount: sql<number>`coalesce(sum(${orders.discount}), 0)`,
        }).from(orders).where(and(...buildConditions(s2, e2)));

        const pct = (a: number, b: number) => b > 0 ? Number((((a - b) / b) * 100).toFixed(1)) : 0;
        const cur = { orderCount: Number(current?.orderCount || 0), revenue: Number(Number(current?.revenue || 0).toFixed(2)), avgTicket: Number(Number(current?.avgTicket || 0).toFixed(2)), totalDiscount: Number(Number(current?.totalDiscount || 0).toFixed(2)) };
        const cmp = { orderCount: Number(compare?.orderCount || 0), revenue: Number(Number(compare?.revenue || 0).toFixed(2)), avgTicket: Number(Number(compare?.avgTicket || 0).toFixed(2)), totalDiscount: Number(Number(compare?.totalDiscount || 0).toFixed(2)) };

        res.json({
            current: { period: `${startDate} → ${endDate}`, ...cur },
            compare: { period: `${compareStartDate} → ${compareEndDate}`, ...cmp },
            change: {
                orderCount: pct(cur.orderCount, cmp.orderCount),
                revenue: pct(cur.revenue, cmp.revenue),
                avgTicket: pct(cur.avgTicket, cmp.avgTicket),
                totalDiscount: pct(cur.totalDiscount, cmp.totalDiscount),
            },
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getSlowMovingItems = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            menuItemId: orderItems.menuItemId,
            itemName: orderItems.name,
            qtySold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
            revenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)`,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(...conditions))
            .groupBy(orderItems.menuItemId, orderItems.name)
            .orderBy(asc(sql`sum(${orderItems.quantity})`))
            .limit(50);

        res.json(rows.map(r => ({
            menuItemId: r.menuItemId,
            itemName: r.itemName,
            qtySold: Number(r.qtySold),
            revenue: Number(Number(r.revenue).toFixed(2)),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getRevenueByWeekday = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            dayOfWeek: sql<number>`extract(dow from ${orders.createdAt})`,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`extract(dow from ${orders.createdAt})`)
            .orderBy(sql`extract(dow from ${orders.createdAt})`);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        res.json(rows.map(r => ({
            dayOfWeek: Number(r.dayOfWeek),
            dayName: dayNames[Number(r.dayOfWeek)] || 'Unknown',
            orderCount: Number(r.orderCount),
            revenue: Number(Number(r.revenue).toFixed(2)),
            avgTicket: Number(Number(r.avgTicket).toFixed(2)),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getVoidItemsLog = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [
            gte(orders.createdAt, start), lte(orders.createdAt, end),
            inArray(orderItems.status, ['VOID', 'VOIDED', 'CANCELLED']),
        ];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            itemName: orderItems.name,
            orderId: orderItems.orderId,
            orderNumber: orders.orderNumber,
            price: orderItems.price,
            quantity: orderItems.quantity,
            createdAt: orders.createdAt,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(...conditions))
            .orderBy(desc(orders.createdAt))
            .limit(200);

        const [summary] = await db.select({
            voidCount: sql<number>`count(*)`,
            voidTotal: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)`,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(...conditions));

        res.json({
            summary: { voidCount: Number(summary?.voidCount || 0), voidTotal: Number(Number(summary?.voidTotal || 0).toFixed(2)) },
            items: rows.map(r => ({ ...r, total: Number((Number(r.price) * Number(r.quantity)).toFixed(2)) })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// FINANCE REPORTS
// ============================================================================

export const getTipsReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses), sql`${orders.tipAmount} > 0`];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const [summary] = await db.select({
            totalTips: sql<number>`coalesce(sum(${orders.tipAmount}), 0)`,
            orderCount: sql<number>`count(*)`,
            avgTip: sql<number>`coalesce(avg(${orders.tipAmount}), 0)`,
            maxTip: sql<number>`coalesce(max(${orders.tipAmount}), 0)`,
        }).from(orders).where(and(...conditions));

        const byType = await db.select({
            orderType: orders.type,
            totalTips: sql<number>`coalesce(sum(${orders.tipAmount}), 0)`,
            count: sql<number>`count(*)`,
        }).from(orders).where(and(...conditions)).groupBy(orders.type).orderBy(sql`sum(${orders.tipAmount}) desc`);

        const daily = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            totalTips: sql<number>`coalesce(sum(${orders.tipAmount}), 0)`,
            count: sql<number>`count(*)`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

        res.json({
            summary: { totalTips: Number(Number(summary?.totalTips || 0).toFixed(2)), orderCount: Number(summary?.orderCount || 0), avgTip: Number(Number(summary?.avgTip || 0).toFixed(2)), maxTip: Number(Number(summary?.maxTip || 0).toFixed(2)) },
            byType: byType.map(r => ({ orderType: r.orderType, totalTips: Number(Number(r.totalTips).toFixed(2)), count: Number(r.count) })),
            daily: daily.map(r => ({ day: r.day, totalTips: Number(Number(r.totalTips).toFixed(2)), count: Number(r.count) })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getServiceChargeReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses), sql`${orders.serviceCharge} > 0`];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const [summary] = await db.select({
            totalServiceCharge: sql<number>`coalesce(sum(${orders.serviceCharge}), 0)`,
            orderCount: sql<number>`count(*)`,
            avgServiceCharge: sql<number>`coalesce(avg(${orders.serviceCharge}), 0)`,
        }).from(orders).where(and(...conditions));

        const daily = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            totalServiceCharge: sql<number>`coalesce(sum(${orders.serviceCharge}), 0)`,
            count: sql<number>`count(*)`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

        res.json({
            summary: { totalServiceCharge: Number(Number(summary?.totalServiceCharge || 0).toFixed(2)), orderCount: Number(summary?.orderCount || 0), avgServiceCharge: Number(Number(summary?.avgServiceCharge || 0).toFixed(2)) },
            daily: daily.map(r => ({ day: r.day, totalServiceCharge: Number(Number(r.totalServiceCharge).toFixed(2)), count: Number(r.count) })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getShiftSummary = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(shifts.openingTime, start), lte(shifts.openingTime, end)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(shifts.branchId, branchId as string));

        const rows = await db.select({
            shiftId: shifts.id,
            branchId: shifts.branchId,
            userId: shifts.userId,
            openingTime: shifts.openingTime,
            closingTime: shifts.closingTime,
            openingBalance: shifts.openingBalance,
            expectedBalance: shifts.expectedBalance,
            actualBalance: shifts.actualBalance,
            status: shifts.status,
            notes: shifts.notes,
        }).from(shifts).where(and(...conditions)).orderBy(desc(shifts.openingTime));

        // For each shift, get order stats
        const result = [];
        for (const shift of rows) {
            const shiftOrders = shift.shiftId ? await db.select({
                orderCount: sql<number>`count(*)`,
                revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
                cancelledCount: sql<number>`count(*) filter (where ${orders.status} = 'CANCELLED')`,
            }).from(orders).where(eq(orders.shiftId, shift.shiftId)) : [{ orderCount: 0, revenue: 0, cancelledCount: 0 }];

            const so = shiftOrders[0] || { orderCount: 0, revenue: 0, cancelledCount: 0 };
            const variance = Number(shift.actualBalance || 0) - Number(shift.expectedBalance || 0);
            result.push({
                ...shift,
                orderCount: Number(so.orderCount || 0),
                revenue: Number(Number(so.revenue || 0).toFixed(2)),
                cancelledCount: Number(so.cancelledCount || 0),
                variance: Number(variance.toFixed(2)),
                openingBalance: Number(shift.openingBalance || 0),
                expectedBalance: Number(shift.expectedBalance || 0),
                actualBalance: Number(shift.actualBalance || 0),
            });
        }

        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// INVENTORY ANALYTICS
// ============================================================================

export const getActualVsTheoretical = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const orderConditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') orderConditions.push(eq(orders.branchId, branchId as string));

        // Theoretical consumption: qty sold × recipe ingredient qty / recipe yield
        const theoreticalRows = await db.select({
            inventoryItemId: recipeIngredients.inventoryItemId,
            itemName: inventoryItems.name,
            unit: recipeIngredients.unit,
            theoreticalQty: sql<number>`coalesce(sum(${orderItems.quantity} * ${recipeIngredients.quantity} / coalesce(${recipes.yield}, 1)), 0)`,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .innerJoin(recipes, eq(orderItems.menuItemId, recipes.menuItemId))
            .innerJoin(recipeIngredients, eq(recipes.id, recipeIngredients.recipeId))
            .innerJoin(inventoryItems, eq(recipeIngredients.inventoryItemId, inventoryItems.id))
            .where(and(...orderConditions))
            .groupBy(recipeIngredients.inventoryItemId, inventoryItems.name, recipeIngredients.unit);

        // Actual consumption: stock movements with type = CONSUMPTION/PRODUCTION/SALE
        const movementConditions: any[] = [gte(stockMovements.createdAt, start), lte(stockMovements.createdAt, end), inArray(stockMovements.type, ['CONSUMPTION', 'PRODUCTION', 'SALE', 'MANUAL_OUT'])];

        const actualRows = await db.select({
            inventoryItemId: stockMovements.itemId,
            actualQty: sql<number>`coalesce(sum(abs(${stockMovements.quantity})), 0)`,
        }).from(stockMovements).where(and(...movementConditions)).groupBy(stockMovements.itemId);

        const actualMap = new Map(actualRows.map(r => [r.inventoryItemId, Number(r.actualQty)]));

        res.json(theoreticalRows.map(r => {
            const theoretical = Number(Number(r.theoreticalQty).toFixed(3));
            const actual = actualMap.get(r.inventoryItemId) || 0;
            const variance = Number((actual - theoretical).toFixed(3));
            const variancePercent = theoretical > 0 ? Number(((variance / theoretical) * 100).toFixed(1)) : 0;
            return {
                inventoryItemId: r.inventoryItemId,
                itemName: r.itemName,
                unit: r.unit,
                theoreticalQty: theoretical,
                actualQty: Number(actual.toFixed(3)),
                variance,
                variancePercent,
            };
        }));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getPurchaseHistory = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(purchaseOrders.createdAt, start), lte(purchaseOrders.createdAt, end)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(purchaseOrders.branchId, branchId as string));

        const bySupplier = await db.select({
            supplierId: purchaseOrders.supplierId,
            supplierName: suppliers.name,
            poCount: sql<number>`count(*)`,
            totalSpend: sql<number>`coalesce(sum(${purchaseOrders.subtotal}), 0)`,
        }).from(purchaseOrders)
            .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
            .where(and(...conditions))
            .groupBy(purchaseOrders.supplierId, suppliers.name)
            .orderBy(sql`sum(${purchaseOrders.subtotal}) desc`);

        const byStatus = await db.select({
            status: purchaseOrders.status,
            count: sql<number>`count(*)`,
            total: sql<number>`coalesce(sum(${purchaseOrders.subtotal}), 0)`,
        }).from(purchaseOrders).where(and(...conditions)).groupBy(purchaseOrders.status);

        const [summary] = await db.select({
            totalPOs: sql<number>`count(*)`,
            totalSpend: sql<number>`coalesce(sum(${purchaseOrders.subtotal}), 0)`,
            avgPO: sql<number>`coalesce(avg(${purchaseOrders.subtotal}), 0)`,
        }).from(purchaseOrders).where(and(...conditions));

        res.json({
            summary: { totalPOs: Number(summary?.totalPOs || 0), totalSpend: Number(Number(summary?.totalSpend || 0).toFixed(2)), avgPO: Number(Number(summary?.avgPO || 0).toFixed(2)) },
            bySupplier: bySupplier.map(r => ({ ...r, poCount: Number(r.poCount), totalSpend: Number(Number(r.totalSpend).toFixed(2)) })),
            byStatus: byStatus.map(r => ({ status: r.status, count: Number(r.count), total: Number(Number(r.total).toFixed(2)) })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getInventoryValuation = async (_req: Request, res: Response) => {
    try {
        // Current stock valuation from batches
        const batchValuation = await db.select({
            itemId: inventoryBatches.itemId,
            itemName: inventoryItems.name,
            unit: inventoryItems.unit,
            totalQty: sql<number>`coalesce(sum(${inventoryBatches.currentQty}), 0)`,
            totalValue: sql<number>`coalesce(sum(${inventoryBatches.currentQty} * ${inventoryBatches.unitCost}), 0)`,
            avgUnitCost: sql<number>`coalesce(avg(${inventoryBatches.unitCost}), 0)`,
            batchCount: sql<number>`count(*)`,
        }).from(inventoryBatches)
            .innerJoin(inventoryItems, eq(inventoryBatches.itemId, inventoryItems.id))
            .where(sql`${inventoryBatches.currentQty} > 0`)
            .groupBy(inventoryBatches.itemId, inventoryItems.name, inventoryItems.unit)
            .orderBy(sql`sum(${inventoryBatches.currentQty} * ${inventoryBatches.unitCost}) desc`);

        const totalValue = batchValuation.reduce((s, r) => s + Number(r.totalValue), 0);

        res.json({
            totalValue: Number(totalValue.toFixed(2)),
            items: batchValuation.map(r => ({
                itemId: r.itemId,
                itemName: r.itemName,
                unit: r.unit,
                totalQty: Number(Number(r.totalQty).toFixed(3)),
                totalValue: Number(Number(r.totalValue).toFixed(2)),
                avgUnitCost: Number(Number(r.avgUnitCost).toFixed(2)),
                batchCount: Number(r.batchCount),
            })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// HR ANALYTICS
// ============================================================================

export const getStaffCostVsRevenue = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const revConditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') revConditions.push(eq(orders.branchId, branchId as string));

        const [rev] = await db.select({
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...revConditions));

        const payrollConditions: any[] = [gte(payrollPayouts.createdAt, start), lte(payrollPayouts.createdAt, end)];
        const [payroll] = await db.select({
            totalPayroll: sql<number>`coalesce(sum(${payrollPayouts.netPay}), 0)`,
            employeeCount: sql<number>`count(distinct ${payrollPayouts.employeeId})`,
        }).from(payrollPayouts).where(and(...payrollConditions));

        const revenue = Number(Number(rev?.revenue || 0).toFixed(2));
        const staffCost = Number(Number(payroll?.totalPayroll || 0).toFixed(2));
        const staffCostPercent = revenue > 0 ? Number(((staffCost / revenue) * 100).toFixed(1)) : 0;

        res.json({
            revenue,
            staffCost,
            staffCostPercent,
            employeeCount: Number(payroll?.employeeCount || 0),
            costPerEmployee: Number(payroll?.employeeCount || 0) > 0 ? Number((staffCost / Number(payroll?.employeeCount || 1)).toFixed(2)) : 0,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getSalesPerLaborHour = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const revConditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') revConditions.push(eq(orders.branchId, branchId as string));

        const [rev] = await db.select({
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...revConditions));

        const attConditions: any[] = [gte(attendance.date, start), lte(attendance.date, end)];
        const [att] = await db.select({
            totalHours: sql<number>`coalesce(sum(${attendance.totalHours}), 0)`,
            totalDays: sql<number>`count(*)`,
        }).from(attendance).where(and(...attConditions));

        const revenue = Number(Number(rev?.revenue || 0).toFixed(2));
        const totalHours = Number(Number(att?.totalHours || 0).toFixed(1));
        const salesPerHour = totalHours > 0 ? Number((revenue / totalHours).toFixed(2)) : 0;

        res.json({
            revenue,
            totalLaborHours: totalHours,
            totalLaborDays: Number(att?.totalDays || 0),
            salesPerLaborHour: salesPerHour,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// CRM ANALYTICS
// ============================================================================

export const getCustomerRetention = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses), sql`${orders.customerId} is not null`];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        // Customers in this period
        const periodCustomers = await db.select({
            customerId: orders.customerId,
            orderCount: sql<number>`count(*)`,
            firstOrder: sql<string>`min(${orders.createdAt})`,
        }).from(orders).where(and(...conditions)).groupBy(orders.customerId);

        // Customers who also ordered BEFORE this period
        const returningIds = new Set<string>();
        for (const c of periodCustomers) {
            if (!c.customerId) continue;
            const [prev] = await db.select({ cnt: sql<number>`count(*)` }).from(orders)
                .where(and(eq(orders.customerId, c.customerId), sql`${orders.createdAt} < ${start}`, inArray(orders.status, deliveredStatuses)));
            if (Number(prev?.cnt || 0) > 0) returningIds.add(c.customerId);
        }

        const total = periodCustomers.length;
        const returning = returningIds.size;
        const newCustomers = total - returning;

        res.json({
            totalCustomers: total,
            returningCustomers: returning,
            newCustomers,
            retentionRate: total > 0 ? Number(((returning / total) * 100).toFixed(1)) : 0,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getNewVsReturning = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses), sql`${orders.customerId} is not null`];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        // All orders in range with customer
        const ordersInRange = await db.select({
            customerId: orders.customerId,
            total: orders.total,
        }).from(orders).where(and(...conditions));

        // Get first-ever order for each customer
        const customerFirstOrder = await db.select({
            customerId: orders.customerId,
            firstOrder: sql<string>`min(${orders.createdAt})`,
        }).from(orders).where(and(inArray(orders.status, deliveredStatuses), sql`${orders.customerId} is not null`)).groupBy(orders.customerId);

        const firstOrderMap = new Map(customerFirstOrder.map(c => [c.customerId, new Date(c.firstOrder)]));
        let newRevenue = 0, newOrders = 0, returnRevenue = 0, returnOrders = 0;

        for (const o of ordersInRange) {
            const firstDate = firstOrderMap.get(o.customerId!);
            if (firstDate && firstDate >= start) {
                newRevenue += Number(o.total);
                newOrders++;
            } else {
                returnRevenue += Number(o.total);
                returnOrders++;
            }
        }

        res.json({
            new: { orders: newOrders, revenue: Number(newRevenue.toFixed(2)) },
            returning: { orders: returnOrders, revenue: Number(returnRevenue.toFixed(2)) },
            totalOrders: newOrders + returnOrders,
            totalRevenue: Number((newRevenue + returnRevenue).toFixed(2)),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getCustomerFrequency = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses), sql`${orders.customerId} is not null`];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const customerOrders = await db.select({
            customerId: orders.customerId,
            customerName: orders.customerName,
            orderCount: sql<number>`count(*)`,
            totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions))
            .groupBy(orders.customerId, orders.customerName)
            .orderBy(sql`count(*) desc`)
            .limit(100);

        const distribution = { once: 0, twice: 0, thrice: 0, frequent: 0, veryFrequent: 0 };
        for (const c of customerOrders) {
            const cnt = Number(c.orderCount);
            if (cnt === 1) distribution.once++;
            else if (cnt === 2) distribution.twice++;
            else if (cnt === 3) distribution.thrice++;
            else if (cnt <= 10) distribution.frequent++;
            else distribution.veryFrequent++;
        }

        res.json({
            distribution,
            topCustomers: customerOrders.slice(0, 20).map(c => ({
                customerId: c.customerId,
                customerName: c.customerName || 'Unknown',
                orderCount: Number(c.orderCount),
                totalSpent: Number(Number(c.totalSpent).toFixed(2)),
            })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// KITCHEN PERFORMANCE
// ============================================================================

export const getKitchenPerformance = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [
            gte(orders.createdAt, start), lte(orders.createdAt, end),
            sql`${orderItems.preparedAt} is not null`,
        ];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            itemName: orderItems.name,
            totalPrepared: sql<number>`count(*)`,
            avgPrepMinutes: sql<number>`coalesce(avg(extract(epoch from (${orderItems.preparedAt} - ${orders.createdAt})) / 60), 0)`,
            minPrepMinutes: sql<number>`coalesce(min(extract(epoch from (${orderItems.preparedAt} - ${orders.createdAt})) / 60), 0)`,
            maxPrepMinutes: sql<number>`coalesce(max(extract(epoch from (${orderItems.preparedAt} - ${orders.createdAt})) / 60), 0)`,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(...conditions))
            .groupBy(orderItems.name)
            .orderBy(sql`count(*) desc`)
            .limit(50);

        res.json(rows.map(r => ({
            itemName: r.itemName,
            totalPrepared: Number(r.totalPrepared),
            avgPrepMinutes: Number(Number(r.avgPrepMinutes).toFixed(1)),
            minPrepMinutes: Number(Number(r.minPrepMinutes).toFixed(1)),
            maxPrepMinutes: Number(Number(r.maxPrepMinutes).toFixed(1)),
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// STRATEGIC SALES ANALYTICS
// ============================================================================

export const getMenuEngineeringMatrix = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            menuItemId: orderItems.menuItemId,
            itemName: orderItems.name,
            qtySold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
            revenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)`,
            cost: sql<number>`coalesce(sum(coalesce(${menuItems.cost}, 0) * ${orderItems.quantity}), 0)`,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
            .where(and(...conditions))
            .groupBy(orderItems.menuItemId, orderItems.name);

        const totalQty = rows.reduce((s, r) => s + Number(r.qtySold), 0);
        const avgQty = totalQty / (rows.length || 1);
        const items = rows.map(r => {
            const qty = Number(r.qtySold);
            const rev = Number(r.revenue);
            const cost = Number(r.cost);
            const profit = rev - cost;
            const margin = rev > 0 ? (profit / rev) * 100 : 0;
            const avgMargin = rows.reduce((s, rr) => s + ((Number(rr.revenue) - Number(rr.cost)) / (Number(rr.revenue) || 1)) * 100, 0) / (rows.length || 1);
            const highPop = qty >= avgQty;
            const highProfit = margin >= avgMargin;
            let classification: string;
            if (highPop && highProfit) classification = 'Star';
            else if (highPop && !highProfit) classification = 'Plowhorse';
            else if (!highPop && highProfit) classification = 'Puzzle';
            else classification = 'Dog';
            return { menuItemId: r.menuItemId, itemName: r.itemName, qtySold: qty, revenue: Number(rev.toFixed(2)), cost: Number(cost.toFixed(2)), profit: Number(profit.toFixed(2)), margin: Number(margin.toFixed(1)), classification };
        }).sort((a, b) => b.revenue - a.revenue);
        const summary = { stars: items.filter(i => i.classification === 'Star').length, plowhorses: items.filter(i => i.classification === 'Plowhorse').length, puzzles: items.filter(i => i.classification === 'Puzzle').length, dogs: items.filter(i => i.classification === 'Dog').length };
        res.json({ summary, items });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getDaypartAnalysis = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            hour: sql<number>`extract(hour from ${orders.createdAt})`,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions)).groupBy(sql`extract(hour from ${orders.createdAt})`);

        const dayparts = [
            { name: 'Breakfast', start: 6, end: 11, orderCount: 0, revenue: 0, avgTicket: 0, hours: [] as number[] },
            { name: 'Lunch', start: 11, end: 15, orderCount: 0, revenue: 0, avgTicket: 0, hours: [] as number[] },
            { name: 'Afternoon', start: 15, end: 18, orderCount: 0, revenue: 0, avgTicket: 0, hours: [] as number[] },
            { name: 'Dinner', start: 18, end: 23, orderCount: 0, revenue: 0, avgTicket: 0, hours: [] as number[] },
            { name: 'Late Night', start: 23, end: 6, orderCount: 0, revenue: 0, avgTicket: 0, hours: [] as number[] },
        ];

        for (const row of rows) {
            const h = Number(row.hour);
            for (const dp of dayparts) {
                const inRange = dp.start < dp.end ? (h >= dp.start && h < dp.end) : (h >= dp.start || h < dp.end);
                if (inRange) { dp.orderCount += Number(row.orderCount); dp.revenue += Number(row.revenue); dp.hours.push(h); break; }
            }
        }
        const totalRev = dayparts.reduce((s, d) => s + d.revenue, 0);
        res.json(dayparts.map(d => ({ name: d.name, orderCount: d.orderCount, revenue: Number(d.revenue.toFixed(2)), avgTicket: d.orderCount > 0 ? Number((d.revenue / d.orderCount).toFixed(2)) : 0, percentage: totalRev > 0 ? Number(((d.revenue / totalRev) * 100).toFixed(1)) : 0 })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getBasketAnalysis = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const ordersList = await db.select({ orderId: orders.id }).from(orders).where(and(...conditions)).limit(5000);
        const orderIds = ordersList.map(o => o.orderId);
        if (orderIds.length === 0) return res.json([]);

        const items = await db.select({ orderId: orderItems.orderId, itemName: orderItems.name })
            .from(orderItems).where(inArray(orderItems.orderId, orderIds));

        const orderMap = new Map<string, string[]>();
        for (const item of items) {
            const list = orderMap.get(item.orderId!) || [];
            if (!list.includes(item.itemName!)) list.push(item.itemName!);
            orderMap.set(item.orderId!, list);
        }

        const pairMap = new Map<string, number>();
        for (const [, itemsList] of orderMap) {
            if (itemsList.length < 2) continue;
            for (let i = 0; i < itemsList.length; i++) for (let j = i + 1; j < itemsList.length; j++) {
                const pair = [itemsList[i], itemsList[j]].sort().join(' + ');
                pairMap.set(pair, (pairMap.get(pair) || 0) + 1);
            }
        }

        const result = Array.from(pairMap.entries()).map(([pair, count]) => ({ pair, count, percentage: Number(((count / orderIds.length) * 100).toFixed(1)) }))
            .sort((a, b) => b.count - a.count).slice(0, 30);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getSeasonalityReport = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        const conditions: any[] = [inArray(orders.status, ['DELIVERED', 'COMPLETED'])];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
            .limit(24);

        res.json(rows.map(r => ({ month: r.month, orderCount: Number(r.orderCount), revenue: Number(Number(r.revenue).toFixed(2)), avgTicket: Number(Number(r.avgTicket).toFixed(2)) })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getOnlineVsOfflineTrend = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            source: orders.source,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`, orders.source)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

        const online = ['online', 'app', 'website'];
        const dailyMap = new Map<string, { online: number; offline: number; onlineOrders: number; offlineOrders: number }>();
        for (const r of rows) {
            const d = dailyMap.get(r.day) || { online: 0, offline: 0, onlineOrders: 0, offlineOrders: 0 };
            if (online.includes(r.source?.toLowerCase() || '')) { d.online += Number(r.revenue); d.onlineOrders += Number(r.orderCount); }
            else { d.offline += Number(r.revenue); d.offlineOrders += Number(r.orderCount); }
            dailyMap.set(r.day, d);
        }

        res.json(Array.from(dailyMap.entries()).map(([day, d]) => ({
            day, onlineRevenue: Number(d.online.toFixed(2)), offlineRevenue: Number(d.offline.toFixed(2)),
            onlineOrders: d.onlineOrders, offlineOrders: d.offlineOrders,
            onlinePercent: (d.online + d.offline) > 0 ? Number(((d.online / (d.online + d.offline)) * 100).toFixed(1)) : 0,
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// STRATEGIC FINANCE
// ============================================================================

export const getFoodCostTrend = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            revenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)`,
            cost: sql<number>`coalesce(sum(coalesce(${menuItems.cost}, 0) * ${orderItems.quantity}), 0)`,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
            .where(and(...conditions))
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

        res.json(rows.map(r => {
            const rev = Number(r.revenue); const cost = Number(r.cost);
            return { day: r.day, revenue: Number(rev.toFixed(2)), cost: Number(cost.toFixed(2)), foodCostPercent: rev > 0 ? Number(((cost / rev) * 100).toFixed(1)) : 0 };
        }));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getTaxComplianceSummary = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const fiscalStats = await db.select({
            status: fiscalLogs.status,
            count: sql<number>`count(*)`,
        }).from(fiscalLogs).where(and(gte(fiscalLogs.createdAt, start), lte(fiscalLogs.createdAt, end))).groupBy(fiscalLogs.status);

        const deadLetters = await db.select({
            status: etaDeadLetters.status,
            count: sql<number>`count(*)`,
        }).from(etaDeadLetters).where(and(gte(etaDeadLetters.createdAt, start), lte(etaDeadLetters.createdAt, end))).groupBy(etaDeadLetters.status);

        const total = fiscalStats.reduce((s, r) => s + Number(r.count), 0);
        const submitted = Number(fiscalStats.find(r => r.status === 'SUBMITTED')?.count || 0);
        const failed = Number(fiscalStats.find(r => r.status === 'FAILED')?.count || 0);

        res.json({
            fiscal: { total, submitted, failed, pending: total - submitted - failed, successRate: total > 0 ? Number(((submitted / total) * 100).toFixed(1)) : 0 },
            deadLetters: deadLetters.map(r => ({ status: r.status, count: Number(r.count) })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAuditTrailReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(auditLogs.createdAt, start), lte(auditLogs.createdAt, end)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(auditLogs.branchId, branchId as string));

        const byType = await db.select({
            eventType: auditLogs.eventType,
            count: sql<number>`count(*)`,
        }).from(auditLogs).where(and(...conditions)).groupBy(auditLogs.eventType).orderBy(sql`count(*) desc`).limit(20);

        const byUser = await db.select({
            userName: auditLogs.userName,
            userRole: auditLogs.userRole,
            count: sql<number>`count(*)`,
        }).from(auditLogs).where(and(...conditions)).groupBy(auditLogs.userName, auditLogs.userRole).orderBy(sql`count(*) desc`).limit(20);

        const recent = await db.select({
            id: auditLogs.id,
            eventType: auditLogs.eventType,
            userName: auditLogs.userName,
            userRole: auditLogs.userRole,
            reason: auditLogs.reason,
            createdAt: auditLogs.createdAt,
        }).from(auditLogs).where(and(...conditions)).orderBy(desc(auditLogs.createdAt)).limit(100);

        res.json({ byType: byType.map(r => ({ ...r, count: Number(r.count) })), byUser: byUser.map(r => ({ ...r, count: Number(r.count) })), recent });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getCashFlowForecast = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        // Last 12 weeks of daily revenue
        const rows = await db.select({
            week: sql<string>`to_char(${orders.createdAt}, 'IYYY-IW')`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            orderCount: sql<number>`count(*)`,
        }).from(orders).where(and(...conditions, sql`${orders.createdAt} > now() - interval '12 weeks'`))
            .groupBy(sql`to_char(${orders.createdAt}, 'IYYY-IW')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'IYYY-IW')`);

        const weeklyRevenues = rows.map(r => Number(r.revenue));
        const avgWeekly = weeklyRevenues.length > 0 ? weeklyRevenues.reduce((s, v) => s + v, 0) / weeklyRevenues.length : 0;
        const trend = weeklyRevenues.length >= 2 ? (weeklyRevenues[weeklyRevenues.length - 1] - weeklyRevenues[0]) / (weeklyRevenues.length - 1) : 0;

        const forecast = Array.from({ length: 4 }).map((_, i) => ({
            week: `+${i + 1}`,
            projectedRevenue: Number((avgWeekly + trend * (i + 1)).toFixed(2)),
        }));

        res.json({ history: rows.map(r => ({ week: r.week, revenue: Number(Number(r.revenue).toFixed(2)), orderCount: Number(r.orderCount) })), forecast, avgWeeklyRevenue: Number(avgWeekly.toFixed(2)), weeklyTrend: Number(trend.toFixed(2)) });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// STRATEGIC INVENTORY
// ============================================================================

export const getSupplierPriceTracking = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(purchaseOrders.createdAt, start), lte(purchaseOrders.createdAt, end)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(purchaseOrders.branchId, branchId as string));

        const rows = await db.select({
            itemId: purchaseOrderItems.itemId,
            itemName: inventoryItems.name,
            supplierId: purchaseOrders.supplierId,
            supplierName: suppliers.name,
            avgPrice: sql<number>`coalesce(avg(${purchaseOrderItems.unitPrice}), 0)`,
            minPrice: sql<number>`coalesce(min(${purchaseOrderItems.unitPrice}), 0)`,
            maxPrice: sql<number>`coalesce(max(${purchaseOrderItems.unitPrice}), 0)`,
            totalQty: sql<number>`coalesce(sum(${purchaseOrderItems.receivedQty}), 0)`,
        }).from(purchaseOrderItems)
            .innerJoin(purchaseOrders, eq(purchaseOrderItems.poId, purchaseOrders.id))
            .innerJoin(inventoryItems, eq(purchaseOrderItems.itemId, inventoryItems.id))
            .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
            .where(and(...conditions))
            .groupBy(purchaseOrderItems.itemId, inventoryItems.name, purchaseOrders.supplierId, suppliers.name)
            .orderBy(inventoryItems.name);

        res.json(rows.map(r => ({ itemId: r.itemId, itemName: r.itemName, supplierId: r.supplierId, supplierName: r.supplierName, avgPrice: Number(Number(r.avgPrice).toFixed(2)), minPrice: Number(Number(r.minPrice).toFixed(2)), maxPrice: Number(Number(r.maxPrice).toFixed(2)), totalQty: Number(Number(r.totalQty).toFixed(2)), priceVariance: Number((Number(r.maxPrice) - Number(r.minPrice)).toFixed(2)) })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getRecipeCostAlerts = async (_req: Request, res: Response) => {
    try {
        const allRecipes = await db.select({
            recipeId: recipes.id,
            menuItemId: recipes.menuItemId,
            menuItemName: menuItems.name,
            menuItemPrice: menuItems.price,
            calculatedCost: recipes.calculatedCost,
        }).from(recipes).innerJoin(menuItems, eq(recipes.menuItemId, menuItems.id));

        const alerts = allRecipes.map(r => {
            const price = Number(r.menuItemPrice) || 0;
            const cost = Number(r.calculatedCost) || 0;
            const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
            return { recipeId: r.recipeId, menuItemId: r.menuItemId, menuItemName: r.menuItemName, price: Number(price.toFixed(2)), cost: Number(cost.toFixed(2)), margin: Number(margin.toFixed(1)), alert: margin < 30 ? 'CRITICAL' : margin < 50 ? 'WARNING' : 'OK' };
        }).sort((a, b) => a.margin - b.margin);

        res.json({ critical: alerts.filter(a => a.alert === 'CRITICAL').length, warning: alerts.filter(a => a.alert === 'WARNING').length, ok: alerts.filter(a => a.alert === 'OK').length, items: alerts });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getABCClassification = async (_req: Request, res: Response) => {
    try {
        const rows = await db.select({
            itemId: inventoryBatches.itemId,
            itemName: inventoryItems.name,
            unit: inventoryItems.unit,
            totalValue: sql<number>`coalesce(sum(${inventoryBatches.currentQty} * ${inventoryBatches.unitCost}), 0)`,
            totalQty: sql<number>`coalesce(sum(${inventoryBatches.currentQty}), 0)`,
        }).from(inventoryBatches)
            .innerJoin(inventoryItems, eq(inventoryBatches.itemId, inventoryItems.id))
            .where(sql`${inventoryBatches.currentQty} > 0`)
            .groupBy(inventoryBatches.itemId, inventoryItems.name, inventoryItems.unit)
            .orderBy(sql`sum(${inventoryBatches.currentQty} * ${inventoryBatches.unitCost}) desc`);

        const totalValue = rows.reduce((s, r) => s + Number(r.totalValue), 0);
        let cumulative = 0;
        const classified = rows.map(r => {
            cumulative += Number(r.totalValue);
            const cumulativePercent = totalValue > 0 ? (cumulative / totalValue) * 100 : 0;
            return { itemId: r.itemId, itemName: r.itemName, unit: r.unit, totalValue: Number(Number(r.totalValue).toFixed(2)), totalQty: Number(Number(r.totalQty).toFixed(3)), valuePercent: totalValue > 0 ? Number(((Number(r.totalValue) / totalValue) * 100).toFixed(1)) : 0, cumulativePercent: Number(cumulativePercent.toFixed(1)), classification: cumulativePercent <= 80 ? 'A' : cumulativePercent <= 95 ? 'B' : 'C' };
        });

        res.json({ totalValue: Number(totalValue.toFixed(2)), a: classified.filter(c => c.classification === 'A').length, b: classified.filter(c => c.classification === 'B').length, c: classified.filter(c => c.classification === 'C').length, items: classified });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// STRATEGIC HR
// ============================================================================

export const getEmployeeProductivity = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, deliveredStatuses)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            agentId: orders.callCenterAgentId,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions, sql`${orders.callCenterAgentId} is not null`))
            .groupBy(orders.callCenterAgentId)
            .orderBy(sql`sum(${orders.total}) desc`);

        res.json(rows.map(r => ({ userId: r.agentId, orderCount: Number(r.orderCount), revenue: Number(Number(r.revenue).toFixed(2)), avgTicket: Number(Number(r.avgTicket).toFixed(2)) })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// STRATEGIC CRM
// ============================================================================

export const getCustomerChurn = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
        const conditions: any[] = [inArray(orders.status, deliveredStatuses), sql`${orders.customerId} is not null`];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const customerLastOrder = await db.select({
            customerId: orders.customerId,
            customerName: orders.customerName,
            lastOrder: sql<string>`max(${orders.createdAt})`,
            orderCount: sql<number>`count(*)`,
            totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions)).groupBy(orders.customerId, orders.customerName);

        const now = new Date();
        const churn30 = customerLastOrder.filter(c => (now.getTime() - new Date(c.lastOrder).getTime()) > 30 * 86400000 && (now.getTime() - new Date(c.lastOrder).getTime()) <= 60 * 86400000);
        const churn60 = customerLastOrder.filter(c => (now.getTime() - new Date(c.lastOrder).getTime()) > 60 * 86400000 && (now.getTime() - new Date(c.lastOrder).getTime()) <= 90 * 86400000);
        const churn90 = customerLastOrder.filter(c => (now.getTime() - new Date(c.lastOrder).getTime()) > 90 * 86400000);
        const active = customerLastOrder.filter(c => (now.getTime() - new Date(c.lastOrder).getTime()) <= 30 * 86400000);

        res.json({
            summary: { total: customerLastOrder.length, active: active.length, atRisk30: churn30.length, atRisk60: churn60.length, churned90: churn90.length },
            atRisk: [...churn30, ...churn60, ...churn90].slice(0, 50).map(c => ({
                customerId: c.customerId, customerName: c.customerName || 'Unknown', lastOrder: c.lastOrder,
                daysSinceLastOrder: Math.floor((now.getTime() - new Date(c.lastOrder).getTime()) / 86400000),
                orderCount: Number(c.orderCount), totalSpent: Number(Number(c.totalSpent).toFixed(2)),
            })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getLoyaltyPointsReport = async (_req: Request, res: Response) => {
    try {
        const tiers = await db.select({
            tier: customers.loyaltyTier,
            count: sql<number>`count(*)`,
            totalPoints: sql<number>`coalesce(sum(${customers.loyaltyPoints}), 0)`,
            avgPoints: sql<number>`coalesce(avg(${customers.loyaltyPoints}), 0)`,
            totalSpent: sql<number>`coalesce(sum(${customers.totalSpent}), 0)`,
        }).from(customers).groupBy(customers.loyaltyTier).orderBy(sql`sum(${customers.totalSpent}) desc`);

        const [totals] = await db.select({
            totalCustomers: sql<number>`count(*)`,
            totalPoints: sql<number>`coalesce(sum(${customers.loyaltyPoints}), 0)`,
            totalSpent: sql<number>`coalesce(sum(${customers.totalSpent}), 0)`,
        }).from(customers);

        const topPointHolders = await db.select({
            id: customers.id,
            name: customers.name,
            loyaltyTier: customers.loyaltyTier,
            loyaltyPoints: customers.loyaltyPoints,
            totalSpent: customers.totalSpent,
            visits: customers.visits,
        }).from(customers).orderBy(desc(customers.loyaltyPoints)).limit(20);

        res.json({
            summary: { totalCustomers: Number(totals?.totalCustomers || 0), totalPoints: Number(totals?.totalPoints || 0), totalSpent: Number(Number(totals?.totalSpent || 0).toFixed(2)) },
            tiers: tiers.map(r => ({ tier: r.tier, count: Number(r.count), totalPoints: Number(r.totalPoints), avgPoints: Number(Number(r.avgPoints).toFixed(0)), totalSpent: Number(Number(r.totalSpent).toFixed(2)) })),
            topPointHolders,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getPromotionImpact = async (req: Request, res: Response) => {
    try {
        const { campaignId } = req.query;
        const allCampaigns = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(20);

        if (campaignId) {
            const camp = allCampaigns.find(c => c.id === campaignId);
            if (!camp) return res.status(404).json({ error: 'Campaign not found' });
            const roi = Number(camp.budget) > 0 ? Number((((Number(camp.revenue) - Number(camp.budget)) / Number(camp.budget)) * 100).toFixed(1)) : 0;
            return res.json({ ...camp, roi });
        }

        res.json(allCampaigns.map(c => ({
            id: c.id, name: c.name, type: c.type, status: c.status,
            reach: Number(c.reach), conversions: Number(c.conversions),
            revenue: Number(Number(c.revenue).toFixed(2)), budget: Number(Number(c.budget).toFixed(2)),
            roi: Number(c.budget) > 0 ? Number((((Number(c.revenue) - Number(c.budget)) / Number(c.budget)) * 100).toFixed(1)) : 0,
            conversionRate: Number(c.reach) > 0 ? Number(((Number(c.conversions) / Number(c.reach)) * 100).toFixed(1)) : 0,
            createdAt: c.createdAt,
        })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// STRATEGIC OPERATIONS
// ============================================================================

export const getTableTurnoverRate = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, ['DELIVERED', 'COMPLETED']), eq(orders.type, 'DINE_IN'), sql`${orders.tableId} is not null`];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));

        const rows = await db.select({
            tableId: orders.tableId,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions)).groupBy(orders.tableId).orderBy(sql`count(*) desc`);

        res.json(rows.map(r => ({ tableId: r.tableId, totalOrders: Number(r.orderCount), turnsPerDay: Number((Number(r.orderCount) / daysDiff).toFixed(1)), revenue: Number(Number(r.revenue).toFixed(2)), revenuePerDay: Number((Number(r.revenue) / daysDiff).toFixed(2)) })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getWaitTimeReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, ['DELIVERED', 'COMPLETED']), sql`${orders.completedAt} is not null`];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const byType = await db.select({
            orderType: orders.type,
            orderCount: sql<number>`count(*)`,
            avgWaitMinutes: sql<number>`coalesce(avg(extract(epoch from (${orders.completedAt} - ${orders.createdAt})) / 60), 0)`,
            minWaitMinutes: sql<number>`coalesce(min(extract(epoch from (${orders.completedAt} - ${orders.createdAt})) / 60), 0)`,
            maxWaitMinutes: sql<number>`coalesce(max(extract(epoch from (${orders.completedAt} - ${orders.createdAt})) / 60), 0)`,
        }).from(orders).where(and(...conditions)).groupBy(orders.type);

        const daily = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            avgWaitMinutes: sql<number>`coalesce(avg(extract(epoch from (${orders.completedAt} - ${orders.createdAt})) / 60), 0)`,
            orderCount: sql<number>`count(*)`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

        res.json({
            byType: byType.map(r => ({ orderType: r.orderType, orderCount: Number(r.orderCount), avgWaitMinutes: Number(Number(r.avgWaitMinutes).toFixed(1)), minWaitMinutes: Number(Number(r.minWaitMinutes).toFixed(1)), maxWaitMinutes: Number(Number(r.maxWaitMinutes).toFixed(1)) })),
            daily: daily.map(r => ({ day: r.day, avgWaitMinutes: Number(Number(r.avgWaitMinutes).toFixed(1)), orderCount: Number(r.orderCount) })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getDriverUtilization = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, ['DELIVERED', 'COMPLETED']), eq(orders.type, 'DELIVERY'), sql`${orders.driverId} is not null`];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            driverId: orders.driverId,
            driverName: drivers.name,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            totalDeliveryFees: sql<number>`coalesce(sum(${orders.deliveryFee}), 0)`,
            avgDeliveryMinutes: sql<number>`coalesce(avg(extract(epoch from (${orders.completedAt} - ${orders.createdAt})) / 60), 0)`,
        }).from(orders)
            .leftJoin(drivers, eq(orders.driverId, drivers.id))
            .where(and(...conditions))
            .groupBy(orders.driverId, drivers.name)
            .orderBy(sql`count(*) desc`);

        const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
        res.json(rows.map(r => ({ driverId: r.driverId, driverName: r.driverName || 'Unknown', orderCount: Number(r.orderCount), ordersPerDay: Number((Number(r.orderCount) / daysDiff).toFixed(1)), revenue: Number(Number(r.revenue).toFixed(2)), totalDeliveryFees: Number(Number(r.totalDeliveryFees).toFixed(2)), avgDeliveryMinutes: Number(Number(r.avgDeliveryMinutes).toFixed(1)) })));
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getBranchComparison = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const deliveredStatuses = ['DELIVERED', 'COMPLETED'];

        const rows = await db.select({
            branchId: orders.branchId,
            branchName: branches.name,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
            cancelCount: sql<number>`count(*) filter (where ${orders.status} = 'CANCELLED')`,
            totalDiscount: sql<number>`coalesce(sum(${orders.discount}), 0)`,
        }).from(orders)
            .leftJoin(branches, eq(orders.branchId, branches.id))
            .where(and(gte(orders.createdAt, start), lte(orders.createdAt, end)))
            .groupBy(orders.branchId, branches.name)
            .orderBy(sql`sum(${orders.total}) desc`);

        const topBranch = rows.length > 0 ? rows[0] : null;
        res.json({
            branches: rows.map(r => ({
                branchId: r.branchId, branchName: r.branchName || 'N/A',
                orderCount: Number(r.orderCount), revenue: Number(Number(r.revenue).toFixed(2)),
                avgTicket: Number(Number(r.avgTicket).toFixed(2)), cancelCount: Number(r.cancelCount),
                totalDiscount: Number(Number(r.totalDiscount).toFixed(2)),
            })),
            topBranch: topBranch?.branchName || 'N/A',
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================================
// AI & PREDICTIVE REPORTS
// ============================================================================

export const getDemandForecast = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        const conditions: any[] = [inArray(orders.status, ['DELIVERED', 'COMPLETED'])];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        // Get last 8 weeks daily data
        const daily = await db.select({
            dayOfWeek: sql<number>`extract(dow from ${orders.createdAt})`,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions, sql`${orders.createdAt} > now() - interval '8 weeks'`))
            .groupBy(sql`extract(dow from ${orders.createdAt})`)
            .orderBy(sql`extract(dow from ${orders.createdAt})`);

        // Top items last 4 weeks
        const topItems = await db.select({
            itemName: orderItems.name,
            avgDailyQty: sql<number>`coalesce(sum(${orderItems.quantity}) / 28.0, 0)`,
            totalQty: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(...conditions, sql`${orders.createdAt} > now() - interval '4 weeks'`))
            .groupBy(orderItems.name)
            .orderBy(sql`sum(${orderItems.quantity}) desc`)
            .limit(20);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeksCount = 8;
        const forecast = daily.map(d => ({
            dayOfWeek: dayNames[Number(d.dayOfWeek)] || d.dayOfWeek,
            avgOrders: Math.round(Number(d.orderCount) / weeksCount),
            avgRevenue: Number((Number(d.revenue) / weeksCount).toFixed(2)),
            predictedOrders: Math.round(Number(d.orderCount) / weeksCount * 1.05),
            predictedRevenue: Number((Number(d.revenue) / weeksCount * 1.05).toFixed(2)),
        }));

        res.json({ weeklyForecast: forecast, topItemsDemand: topItems.map(t => ({ itemName: t.itemName, avgDailyQty: Number(Number(t.avgDailyQty).toFixed(1)), weeklyQty: Number(Number(t.totalQty).toFixed(0)) })) });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getPriceElasticity = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        const conditions: any[] = [inArray(orders.status, ['DELIVERED', 'COMPLETED'])];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const items = await db.select({
            menuItemId: orderItems.menuItemId,
            itemName: orderItems.name,
            currentPrice: sql<number>`max(${orderItems.price})`,
            cost: sql<number>`coalesce(max(${menuItems.cost}), 0)`,
            totalQty: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
            revenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)`,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
            .where(and(...conditions, sql`${orders.createdAt} > now() - interval '30 days'`))
            .groupBy(orderItems.menuItemId, orderItems.name)
            .orderBy(sql`sum(${orderItems.quantity}) desc`)
            .limit(30);

        const simulations = items.map(item => {
            const price = Number(item.currentPrice);
            const cost = Number(item.cost);
            const qty = Number(item.totalQty);
            const scenarios = [
                { change: -10, newPrice: price * 0.9, estQty: Math.round(qty * 1.15), estRevenue: Number((price * 0.9 * qty * 1.15).toFixed(2)), estProfit: Number(((price * 0.9 - cost) * qty * 1.15).toFixed(2)) },
                { change: -5, newPrice: price * 0.95, estQty: Math.round(qty * 1.07), estRevenue: Number((price * 0.95 * qty * 1.07).toFixed(2)), estProfit: Number(((price * 0.95 - cost) * qty * 1.07).toFixed(2)) },
                { change: 0, newPrice: price, estQty: qty, estRevenue: Number((price * qty).toFixed(2)), estProfit: Number(((price - cost) * qty).toFixed(2)) },
                { change: 5, newPrice: price * 1.05, estQty: Math.round(qty * 0.95), estRevenue: Number((price * 1.05 * qty * 0.95).toFixed(2)), estProfit: Number(((price * 1.05 - cost) * qty * 0.95).toFixed(2)) },
                { change: 10, newPrice: price * 1.10, estQty: Math.round(qty * 0.88), estRevenue: Number((price * 1.10 * qty * 0.88).toFixed(2)), estProfit: Number(((price * 1.10 - cost) * qty * 0.88).toFixed(2)) },
            ];
            return { menuItemId: item.menuItemId, itemName: item.itemName, currentPrice: price, cost, currentQty: qty, currentRevenue: Number(item.revenue), scenarios };
        });
        res.json(simulations);
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getMenuCannibalization = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        const conditions: any[] = [inArray(orders.status, ['DELIVERED', 'COMPLETED'])];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const recent = await db.select({ itemName: orderItems.name, qty: sql<number>`sum(${orderItems.quantity})`, revenue: sql<number>`sum(${orderItems.price} * ${orderItems.quantity})` })
            .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(...conditions, sql`${orders.createdAt} > now() - interval '30 days'`))
            .groupBy(orderItems.name);

        const prior = await db.select({ itemName: orderItems.name, qty: sql<number>`sum(${orderItems.quantity})`, revenue: sql<number>`sum(${orderItems.price} * ${orderItems.quantity})` })
            .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(...conditions, sql`${orders.createdAt} > now() - interval '60 days' AND ${orders.createdAt} <= now() - interval '30 days'`))
            .groupBy(orderItems.name);

        const priorMap = new Map(prior.map(p => [p.itemName, { qty: Number(p.qty), revenue: Number(p.revenue) }]));
        const results = recent.map(r => {
            const p = priorMap.get(r.itemName);
            const recentQty = Number(r.qty); const priorQty = p?.qty || 0;
            return { itemName: r.itemName, recentQty, priorQty, qtyChange: recentQty - priorQty, qtyChangePercent: priorQty > 0 ? Number(((recentQty - priorQty) / priorQty * 100).toFixed(1)) : null, recentRevenue: Number(Number(r.revenue).toFixed(2)), priorRevenue: Number((p?.revenue || 0).toFixed(2)) };
        }).sort((a, b) => (a.qtyChangePercent ?? 0) - (b.qtyChangePercent ?? 0));

        const declining = results.filter(r => (r.qtyChangePercent ?? 0) < -10);
        const growing = results.filter(r => (r.qtyChangePercent ?? 0) > 10);
        res.json({ declining, growing, all: results });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getAnomalyDetection = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        // Unusual high-discount orders
        const highDiscounts = await db.select({ id: orders.id, orderNumber: orders.orderNumber, discount: orders.discount, total: orders.total, createdAt: orders.createdAt })
            .from(orders).where(and(...conditions, sql`${orders.discount} > ${orders.subtotal} * 0.3`)).orderBy(desc(orders.discount)).limit(20);

        // Off-hours orders (before 6AM or after midnight)
        const offHours = await db.select({ hour: sql<number>`extract(hour from ${orders.createdAt})`, count: sql<number>`count(*)` })
            .from(orders).where(and(...conditions, sql`extract(hour from ${orders.createdAt}) < 6 OR extract(hour from ${orders.createdAt}) >= 24`))
            .groupBy(sql`extract(hour from ${orders.createdAt})`);

        // Cancelled rate by day
        const dailyCancel = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            totalOrders: sql<number>`count(*)`,
            cancelledOrders: sql<number>`count(*) filter (where ${orders.status} = 'CANCELLED')`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .having(sql`count(*) filter (where ${orders.status} = 'CANCELLED')::float / count(*)::float > 0.15`)
            .orderBy(sql`count(*) filter (where ${orders.status} = 'CANCELLED')::float / count(*)::float desc`);

        res.json({
            highDiscounts: highDiscounts.map(o => ({ ...o, discountPercent: Number(o.total) > 0 ? Number(((Number(o.discount) / (Number(o.total) + Number(o.discount))) * 100).toFixed(1)) : 0 })),
            offHoursOrders: offHours.map(o => ({ ...o, count: Number(o.count) })),
            highCancelDays: dailyCancel.map(d => ({ ...d, totalOrders: Number(d.totalOrders), cancelledOrders: Number(d.cancelledOrders), cancelRate: Number((Number(d.cancelledOrders) / Number(d.totalOrders) * 100).toFixed(1)) })),
        });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getBreakEvenAnalysis = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        const conditions: any[] = [inArray(orders.status, ['DELIVERED', 'COMPLETED'])];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        // Monthly revenue & COGS
        const monthly = await db.select({
            month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            orderCount: sql<number>`count(*)`,
        }).from(orders).where(and(...conditions, sql`${orders.createdAt} > now() - interval '6 months'`))
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

        // Estimate fixed costs from chart of accounts
        const [fixedCosts] = await db.select({
            total: sql<number>`coalesce(sum(${journalLines.debit}), 0)`,
        }).from(journalLines)
            .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
            .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
            .where(sql`${chartOfAccounts.type} = 'EXPENSE' AND ${journalEntries.createdAt} > now() - interval '1 month'`);

        const avgRevenue = monthly.length > 0 ? monthly.reduce((s, m) => s + Number(m.revenue), 0) / monthly.length : 0;
        const avgOrders = monthly.length > 0 ? monthly.reduce((s, m) => s + Number(m.orderCount), 0) / monthly.length : 0;
        const avgTicket = avgOrders > 0 ? avgRevenue / avgOrders : 0;
        const fixedMonthly = Number(fixedCosts?.total || 0);
        const breakEvenRevenue = fixedMonthly > 0 ? fixedMonthly * 1.5 : avgRevenue * 0.7; // approx
        const breakEvenOrders = avgTicket > 0 ? Math.ceil(breakEvenRevenue / avgTicket) : 0;

        res.json({ monthly: monthly.map(m => ({ ...m, revenue: Number(Number(m.revenue).toFixed(2)), orderCount: Number(m.orderCount) })), fixedCostsEstimate: Number(fixedMonthly.toFixed(2)), avgMonthlyRevenue: Number(avgRevenue.toFixed(2)), avgMonthlyOrders: Math.round(avgOrders), avgTicket: Number(avgTicket.toFixed(2)), breakEvenRevenue: Number(breakEvenRevenue.toFixed(2)), breakEvenOrders, breakEvenOrdersPerDay: Math.ceil(breakEvenOrders / 30) });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getPaymentReconciliation = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);

        const orderConditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, ['DELIVERED', 'COMPLETED'])];
        if (branchId && branchId !== 'undefined') orderConditions.push(eq(orders.branchId, branchId as string));

        const [orderTotals] = await db.select({
            totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            orderCount: sql<number>`count(*)`,
        }).from(orders).where(and(...orderConditions));

        const paymentConditions: any[] = [gte(payments.createdAt, start), lte(payments.createdAt, end)];

        const paymentsByMethod = await db.select({
            method: payments.method,
            total: sql<number>`coalesce(sum(${payments.amount}), 0)`,
            count: sql<number>`count(*)`,
        }).from(payments).where(and(...paymentConditions)).groupBy(payments.method);

        const totalPayments = paymentsByMethod.reduce((s, p) => s + Number(p.total), 0);
        const discrepancy = Number(orderTotals?.totalRevenue || 0) - totalPayments;

        res.json({
            orderTotal: Number(Number(orderTotals?.totalRevenue || 0).toFixed(2)),
            orderCount: Number(orderTotals?.orderCount || 0),
            paymentTotal: Number(totalPayments.toFixed(2)),
            discrepancy: Number(discrepancy.toFixed(2)),
            discrepancyPercent: Number(orderTotals?.totalRevenue || 0) > 0 ? Number((discrepancy / Number(orderTotals?.totalRevenue || 1) * 100).toFixed(2)) : 0,
            byMethod: paymentsByMethod.map(p => ({ method: p.method, total: Number(Number(p.total).toFixed(2)), count: Number(p.count) })),
        });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getDailyFlashReport = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const conditions: any[] = [gte(orders.createdAt, today), lte(orders.createdAt, tomorrow)];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const [salesAll] = await db.select({ revenue: sql<number>`coalesce(sum(${orders.total}), 0)`, orderCount: sql<number>`count(*)`, avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`, totalDiscount: sql<number>`coalesce(sum(${orders.discount}), 0)`, totalTips: sql<number>`coalesce(sum(${orders.tipAmount}), 0)` })
            .from(orders).where(and(...conditions, inArray(orders.status, ['DELIVERED', 'COMPLETED'])));

        const [cancels] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(and(...conditions, eq(orders.status, 'CANCELLED')));

        const byType = await db.select({ type: orders.type, count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${orders.total}), 0)` })
            .from(orders).where(and(...conditions, inArray(orders.status, ['DELIVERED', 'COMPLETED']))).groupBy(orders.type);

        const payMethods = await db.select({ method: payments.method, total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
            .from(payments).where(and(gte(payments.createdAt, today), lte(payments.createdAt, tomorrow))).groupBy(payments.method);

        res.json({
            date: today.toISOString().split('T')[0],
            revenue: Number(Number(salesAll?.revenue || 0).toFixed(2)),
            orderCount: Number(salesAll?.orderCount || 0),
            avgTicket: Number(Number(salesAll?.avgTicket || 0).toFixed(2)),
            totalDiscount: Number(Number(salesAll?.totalDiscount || 0).toFixed(2)),
            totalTips: Number(Number(salesAll?.totalTips || 0).toFixed(2)),
            cancelledOrders: Number(cancels?.count || 0),
            byType: byType.map(t => ({ type: t.type, count: Number(t.count), revenue: Number(Number(t.revenue).toFixed(2)) })),
            paymentMix: payMethods.map(p => ({ method: p.method, total: Number(Number(p.total).toFixed(2)) })),
        });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getMenuItemLifecycle = async (req: Request, res: Response) => {
    try {
        const { branchId, menuItemId } = req.query;
        const conditions: any[] = [inArray(orders.status, ['DELIVERED', 'COMPLETED'])];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));
        if (menuItemId) conditions.push(eq(orderItems.menuItemId, menuItemId as string));

        const monthly = await db.select({
            month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
            itemName: orderItems.name,
            qty: sql<number>`sum(${orderItems.quantity})`,
            revenue: sql<number>`sum(${orderItems.price} * ${orderItems.quantity})`,
        }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(...conditions)).groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`, orderItems.name)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
            .limit(200);

        res.json(monthly.map(m => ({ month: m.month, itemName: m.itemName, qty: Number(m.qty), revenue: Number(Number(m.revenue).toFixed(2)) })));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getCategoryContribution = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, ['DELIVERED', 'COMPLETED'])];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const rows = await db.select({
            categoryId: menuItems.categoryId,
            categoryName: menuCategories.name,
            qtySold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
            revenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)`,
            cost: sql<number>`coalesce(sum(coalesce(${menuItems.cost}, 0) * ${orderItems.quantity}), 0)`,
        }).from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
            .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
            .where(and(...conditions))
            .groupBy(menuItems.categoryId, menuCategories.name)
            .orderBy(sql`sum(${orderItems.price} * ${orderItems.quantity}) desc`);

        const totalRev = rows.reduce((s, r) => s + Number(r.revenue), 0);
        const totalProfit = rows.reduce((s, r) => s + (Number(r.revenue) - Number(r.cost)), 0);
        res.json(rows.map(r => {
            const rev = Number(r.revenue); const cost = Number(r.cost); const profit = rev - cost;
            return { categoryId: r.categoryId, categoryName: r.categoryName || 'Uncategorized', qtySold: Number(r.qtySold), revenue: Number(rev.toFixed(2)), cost: Number(cost.toFixed(2)), profit: Number(profit.toFixed(2)), margin: rev > 0 ? Number((profit / rev * 100).toFixed(1)) : 0, revenueShare: totalRev > 0 ? Number((rev / totalRev * 100).toFixed(1)) : 0, profitShare: totalProfit > 0 ? Number((profit / totalProfit * 100).toFixed(1)) : 0 };
        }));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getShiftProfitability = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const shiftConditions: any[] = [gte(shifts.openingTime, start), lte(shifts.openingTime, end)];
        if (branchId && branchId !== 'undefined') shiftConditions.push(eq(shifts.branchId, branchId as string));

        const shiftData = await db.select({
            shiftId: shifts.id,
            openingTime: shifts.openingTime,
            closingTime: shifts.closingTime,
            openingCash: shifts.openingBalance,
            closingCash: shifts.actualBalance,
            expectedCash: shifts.expectedBalance,
        }).from(shifts).where(and(...shiftConditions)).orderBy(desc(shifts.openingTime)).limit(50);

        const result = [];
        for (const s of shiftData) {
            const [rev] = await db.select({ revenue: sql<number>`coalesce(sum(${orders.total}), 0)`, orderCount: sql<number>`count(*)` })
                .from(orders).where(and(eq(orders.shiftId, s.shiftId!), inArray(orders.status, ['DELIVERED', 'COMPLETED'])));
            result.push({ shiftId: s.shiftId, openingTime: s.openingTime, closingTime: s.closingTime, revenue: Number(Number(rev?.revenue || 0).toFixed(2)), orderCount: Number(rev?.orderCount || 0), openingCash: Number(s.openingCash || 0), closingCash: Number(s.closingCash || 0), expectedCash: Number(s.expectedCash || 0), variance: Number((Number(s.closingCash || 0) - Number(s.expectedCash || 0)).toFixed(2)) });
        }
        res.json(result);
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getDeliveryZoneAnalysis = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), eq(orders.type, 'DELIVERY'), inArray(orders.status, ['DELIVERED', 'COMPLETED']), sql`${orders.deliveryAddress} is not null`];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const zones = await db.select({
            area: sql<string>`split_part(${orders.deliveryAddress}, ',', -1)`,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgTicket: sql<number>`coalesce(avg(${orders.total}), 0)`,
            totalFees: sql<number>`coalesce(sum(${orders.deliveryFee}), 0)`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`split_part(${orders.deliveryAddress}, ',', -1)`)
            .orderBy(sql`count(*) desc`).limit(30);

        res.json(zones.map(z => ({ area: z.area?.trim() || 'Unknown', orderCount: Number(z.orderCount), revenue: Number(Number(z.revenue).toFixed(2)), avgTicket: Number(Number(z.avgTicket).toFixed(2)), totalFees: Number(Number(z.totalFees).toFixed(2)) })));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getDeliveryCostVsRevenue = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), eq(orders.type, 'DELIVERY'), inArray(orders.status, ['DELIVERED', 'COMPLETED'])];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const daily = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            deliveryFees: sql<number>`coalesce(sum(${orders.deliveryFee}), 0)`,
            freeDeliveries: sql<number>`count(*) filter (where ${orders.freeDelivery} = true)`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

        const [totals] = await db.select({
            totalOrders: sql<number>`count(*)`,
            totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            totalFees: sql<number>`coalesce(sum(${orders.deliveryFee}), 0)`,
            freeCount: sql<number>`count(*) filter (where ${orders.freeDelivery} = true)`,
        }).from(orders).where(and(...conditions));

        res.json({
            summary: { totalOrders: Number(totals?.totalOrders || 0), totalRevenue: Number(Number(totals?.totalRevenue || 0).toFixed(2)), totalFees: Number(Number(totals?.totalFees || 0).toFixed(2)), freeDeliveries: Number(totals?.freeCount || 0), feePercentOfRevenue: Number(totals?.totalRevenue || 0) > 0 ? Number((Number(totals?.totalFees || 0) / Number(totals?.totalRevenue || 1) * 100).toFixed(1)) : 0 },
            daily: daily.map(d => ({ day: d.day, orderCount: Number(d.orderCount), revenue: Number(Number(d.revenue).toFixed(2)), deliveryFees: Number(Number(d.deliveryFees).toFixed(2)), freeDeliveries: Number(d.freeDeliveries) })),
        });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getCustomerJourneyFunnel = async (_req: Request, res: Response) => {
    try {
        const [totalCustomers] = await db.select({ count: sql<number>`count(*)` }).from(customers);
        const [oneOrder] = await db.select({ count: sql<number>`count(*)` }).from(customers).where(sql`${customers.visits} >= 1`);
        const [twoPlus] = await db.select({ count: sql<number>`count(*)` }).from(customers).where(sql`${customers.visits} >= 2`);
        const [fivePlus] = await db.select({ count: sql<number>`count(*)` }).from(customers).where(sql`${customers.visits} >= 5`);
        const [tenPlus] = await db.select({ count: sql<number>`count(*)` }).from(customers).where(sql`${customers.visits} >= 10`);
        const [vip] = await db.select({ count: sql<number>`count(*)` }).from(customers).where(inArray(customers.loyaltyTier, ['Gold', 'Platinum']));

        const total = Number(totalCustomers?.count || 0);
        const funnel = [
            { stage: 'Registered', count: total, percent: 100 },
            { stage: 'First Order', count: Number(oneOrder?.count || 0), percent: total > 0 ? Number((Number(oneOrder?.count || 0) / total * 100).toFixed(1)) : 0 },
            { stage: '2+ Orders (Repeat)', count: Number(twoPlus?.count || 0), percent: total > 0 ? Number((Number(twoPlus?.count || 0) / total * 100).toFixed(1)) : 0 },
            { stage: '5+ Orders (Regular)', count: Number(fivePlus?.count || 0), percent: total > 0 ? Number((Number(fivePlus?.count || 0) / total * 100).toFixed(1)) : 0 },
            { stage: '10+ Orders (Loyal)', count: Number(tenPlus?.count || 0), percent: total > 0 ? Number((Number(tenPlus?.count || 0) / total * 100).toFixed(1)) : 0 },
            { stage: 'VIP (Gold/Platinum)', count: Number(vip?.count || 0), percent: total > 0 ? Number((Number(vip?.count || 0) / total * 100).toFixed(1)) : 0 },
        ];
        res.json(funnel);
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getChannelMixTrend = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), inArray(orders.status, ['DELIVERED', 'COMPLETED'])];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const daily = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            source: orders.source,
            count: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions))
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`, orders.source)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

        res.json(daily.map(d => ({ day: d.day, source: d.source || 'pos', count: Number(d.count), revenue: Number(Number(d.revenue).toFixed(2)) })));
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getOptimalPricing = async (_req: Request, res: Response) => {
    try {
        const items = await db.select({
            id: menuItems.id,
            name: menuItems.name,
            price: menuItems.price,
            cost: menuItems.cost,
        }).from(menuItems).where(sql`${menuItems.isAvailable} = true`);

        const result = items.map(item => {
            const price = Number(item.price) || 0;
            const cost = Number(item.cost) || 0;
            const margin = price > 0 ? (price - cost) / price * 100 : 0;
            const targetMargin = 65;
            const suggestedPrice = cost > 0 ? Number((cost / (1 - targetMargin / 100)).toFixed(2)) : price;
            const priceChange = suggestedPrice - price;
            return { id: item.id, name: item.name, currentPrice: price, cost, currentMargin: Number(margin.toFixed(1)), suggestedPrice, priceChange: Number(priceChange.toFixed(2)), action: margin < 30 ? 'INCREASE' : margin > 80 ? 'DECREASE' : 'OK' };
        }).sort((a, b) => a.currentMargin - b.currentMargin);

        res.json({ targetMargin: 65, items: result, needsIncrease: result.filter(r => r.action === 'INCREASE').length, ok: result.filter(r => r.action === 'OK').length, canDecrease: result.filter(r => r.action === 'DECREASE').length });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getThirdPartyVsInHouse = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
        const { start, end } = parseLocalDateRange(startDate as string, endDate as string);
        const conditions: any[] = [gte(orders.createdAt, start), lte(orders.createdAt, end), eq(orders.type, 'DELIVERY'), inArray(orders.status, ['DELIVERED', 'COMPLETED'])];
        if (branchId && branchId !== 'undefined') conditions.push(eq(orders.branchId, branchId as string));

        const inHouse = await db.select({
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            avgDeliveryMinutes: sql<number>`coalesce(avg(extract(epoch from (${orders.completedAt} - ${orders.createdAt})) / 60), 0)`,
        }).from(orders).where(and(...conditions, sql`${orders.driverId} is not null`));

        const thirdParty = await db.select({
            orderCount: sql<number>`count(*)`,
            revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        }).from(orders).where(and(...conditions, sql`${orders.driverId} is null`));

        res.json({
            inHouse: { orderCount: Number(inHouse[0]?.orderCount || 0), revenue: Number(Number(inHouse[0]?.revenue || 0).toFixed(2)), avgDeliveryMinutes: Number(Number(inHouse[0]?.avgDeliveryMinutes || 0).toFixed(1)) },
            thirdParty: { orderCount: Number(thirdParty[0]?.orderCount || 0), revenue: Number(Number(thirdParty[0]?.revenue || 0).toFixed(2)) },
        });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const getTimeToFirstOrder = async (_req: Request, res: Response) => {
    try {
        const recentItems = await db.select({
            id: menuItems.id,
            name: menuItems.name,
            createdAt: menuItems.createdAt,
        }).from(menuItems).orderBy(desc(menuItems.createdAt)).limit(30);

        const result = [];
        for (const item of recentItems) {
            const [firstOrder] = await db.select({
                firstOrderDate: sql<string>`min(${orders.createdAt})`,
                totalOrders: sql<number>`count(*)`,
                totalQty: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
                totalRevenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)`,
            }).from(orderItems)
                .innerJoin(orders, eq(orderItems.orderId, orders.id))
                .where(and(eq(orderItems.menuItemId, item.id), inArray(orders.status, ['DELIVERED', 'COMPLETED'])));

            const addedDate = new Date(item.createdAt!);
            const firstDate = firstOrder?.firstOrderDate ? new Date(firstOrder.firstOrderDate) : null;
            const daysToFirst = firstDate ? Math.max(0, Math.floor((firstDate.getTime() - addedDate.getTime()) / 86400000)) : null;

            result.push({
                itemId: item.id, itemName: item.name, addedDate: item.createdAt,
                firstOrderDate: firstOrder?.firstOrderDate || null,
                daysToFirstOrder: daysToFirst,
                totalOrders: Number(firstOrder?.totalOrders || 0),
                totalQty: Number(firstOrder?.totalQty || 0),
                totalRevenue: Number(Number(firstOrder?.totalRevenue || 0).toFixed(2)),
            });
        }
        res.json(result);
    } catch (error: any) { res.status(400).json({ error: error.message }); }
};
