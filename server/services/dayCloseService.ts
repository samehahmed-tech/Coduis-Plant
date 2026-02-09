/**
 * Day Close Service - End of Day Processing
 * Handles day closing, report generation, and email dispatch
 */

import { db } from '../db';
import { orders, payments, branches, auditLogs, fiscalLogs, etaDeadLetters } from '../../src/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { createSignedAuditLog } from './auditService';
import { emailService } from './emailService';

// Day close status
type DayCloseStatus = 'OPEN' | 'CLOSING' | 'CLOSED';

interface DayCloseReport {
    date: string;
    branchId: string;
    branchName?: string;
    status: DayCloseStatus;
    closedBy?: string;
    closedAt?: Date;

    // Sales Summary
    salesSummary: {
        totalOrders: number;
        totalRevenue: number;
        totalTax: number;
        totalDiscount: number;
        netSales: number;
        averageOrderValue: number;
    };

    // Payment Breakdown
    paymentBreakdown: {
        method: string;
        count: number;
        total: number;
    }[];

    // Order Type Breakdown
    orderTypeBreakdown: {
        type: string;
        count: number;
        total: number;
    }[];

    // Audit Trail
    auditSummary: {
        totalEvents: number;
        voidCount: number;
        discountCount: number;
        refundCount: number;
    };

    // Fiscal health snapshot
    fiscalHealth?: {
        submitted: number;
        pending: number;
        failed: number;
        deadLettersPending: number;
    };
}

interface EmailConfig {
    to: string[];
    cc?: string[];
    subject: string;
    includeReports: ('sales' | 'payments' | 'audit')[];
}

export const dayCloseService = {
    /**
     * Generate day close report for a branch
     */
    async generateReport(branchId: string, date: string): Promise<DayCloseReport> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get branch info
        const [branch] = await db.select().from(branches).where(eq(branches.id, branchId));

        // Get all orders for the day
        const dayOrders = await db.select()
            .from(orders)
            .where(and(
                eq(orders.branchId, branchId),
                gte(orders.createdAt, startOfDay),
                lte(orders.createdAt, endOfDay)
            ));

        // Calculate sales summary - use discount and tax fields from schema
        const completedOrders = dayOrders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalTax = completedOrders.reduce((sum, o) => sum + (o.tax || 0), 0);
        const totalDiscount = completedOrders.reduce((sum, o) => sum + (o.discount || 0), 0);

        // Get payments
        const dayPayments = await db.select()
            .from(payments)
            .where(and(
                gte(payments.createdAt, startOfDay),
                lte(payments.createdAt, endOfDay)
            ));

        // Payment breakdown by method
        const paymentByMethod = new Map<string, { count: number; total: number }>();
        for (const p of dayPayments) {
            const method = p.method || 'UNKNOWN';
            const existing = paymentByMethod.get(method) || { count: 0, total: 0 };
            existing.count++;
            existing.total += p.amount || 0;
            paymentByMethod.set(method, existing);
        }

        // Order type breakdown
        const orderByType = new Map<string, { count: number; total: number }>();
        for (const o of completedOrders) {
            const type = o.type || 'UNKNOWN';
            const existing = orderByType.get(type) || { count: 0, total: 0 };
            existing.count++;
            existing.total += o.total || 0;
            orderByType.set(type, existing);
        }

        // Get audit events
        const dayAuditLogs = await db.select()
            .from(auditLogs)
            .where(and(
                eq(auditLogs.branchId, branchId),
                gte(auditLogs.createdAt, startOfDay),
                lte(auditLogs.createdAt, endOfDay)
            ));

        const voidCount = dayAuditLogs.filter(a =>
            a.eventType?.includes('VOID') || a.eventType?.includes('CANCEL')
        ).length;

        const discountCount = dayAuditLogs.filter(a =>
            a.eventType?.includes('DISCOUNT')
        ).length;

        const refundCount = dayAuditLogs.filter(a =>
            a.eventType?.includes('REFUND')
        ).length;

        return {
            date,
            branchId,
            branchName: branch?.name,
            status: 'OPEN',
            salesSummary: {
                totalOrders: completedOrders.length,
                totalRevenue,
                totalTax,
                totalDiscount,
                netSales: totalRevenue - totalDiscount,
                averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
            },
            paymentBreakdown: Array.from(paymentByMethod.entries()).map(([method, data]) => ({
                method,
                ...data,
            })),
            orderTypeBreakdown: Array.from(orderByType.entries()).map(([type, data]) => ({
                type,
                ...data,
            })),
            auditSummary: {
                totalEvents: dayAuditLogs.length,
                voidCount,
                discountCount,
                refundCount,
            },
        };
    },

    async getFiscalHealth(branchId: string, date: string) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const [submittedRows, pendingRows, failedRows, deadLettersRows] = await Promise.all([
            db.select().from(fiscalLogs).where(and(
                eq(fiscalLogs.branchId, branchId),
                eq(fiscalLogs.status, 'SUBMITTED'),
                gte(fiscalLogs.createdAt, startOfDay),
                lte(fiscalLogs.createdAt, endOfDay),
            )),
            db.select().from(fiscalLogs).where(and(
                eq(fiscalLogs.branchId, branchId),
                eq(fiscalLogs.status, 'PENDING'),
                gte(fiscalLogs.createdAt, startOfDay),
                lte(fiscalLogs.createdAt, endOfDay),
            )),
            db.select().from(fiscalLogs).where(and(
                eq(fiscalLogs.branchId, branchId),
                eq(fiscalLogs.status, 'FAILED'),
                gte(fiscalLogs.createdAt, startOfDay),
                lte(fiscalLogs.createdAt, endOfDay),
            )),
            db.select().from(etaDeadLetters).where(and(
                eq(etaDeadLetters.branchId, branchId),
                eq(etaDeadLetters.status, 'PENDING'),
                gte(etaDeadLetters.createdAt, startOfDay),
                lte(etaDeadLetters.createdAt, endOfDay),
            )),
        ]);

        return {
            submitted: submittedRows.length,
            pending: pendingRows.length,
            failed: failedRows.length,
            deadLettersPending: deadLettersRows.length,
        };
    },

    /**
     * Close the day for a branch
     */
    async closeDay(
        branchId: string,
        date: string,
        userId: string,
        options?: { emailConfig?: EmailConfig; notes?: string; enforceFiscalClean?: boolean }
    ) {
        const report = await this.generateReport(branchId, date);
        const fiscalHealth = await this.getFiscalHealth(branchId, date);

        if (options?.enforceFiscalClean && (fiscalHealth.failed > 0 || fiscalHealth.pending > 0 || fiscalHealth.deadLettersPending > 0)) {
            throw new Error('FISCAL_NOT_CLEAN_FOR_DAY_CLOSE');
        }

        // Mark as closed
        report.status = 'CLOSED';
        report.closedBy = userId;
        report.closedAt = new Date();
        report.fiscalHealth = fiscalHealth;

        // Log the day close event
        await createSignedAuditLog({
            eventType: 'DAY_CLOSED',
            userId,
            branchId,
            payload: {
                date,
                report: {
                    totalOrders: report.salesSummary.totalOrders,
                    totalRevenue: report.salesSummary.totalRevenue,
                    netSales: report.salesSummary.netSales,
                },
                fiscalHealth,
                notes: options?.notes,
            },
        });

        // Send email if configured
        if (options?.emailConfig) {
            await this.sendDayCloseEmail(report, options.emailConfig);
        }

        return report;
    },

    /**
     * Send day close email report
     */
    async sendDayCloseEmail(report: DayCloseReport, config: EmailConfig) {
        const sections: string[] = [];

        if (config.includeReports.includes('sales')) {
            sections.push(`
## Sales Summary
- Total Orders: ${report.salesSummary.totalOrders}
- Gross Revenue: ${report.salesSummary.totalRevenue.toFixed(2)} EGP
- Net Sales: ${report.salesSummary.netSales.toFixed(2)} EGP
- Discounts: ${report.salesSummary.totalDiscount.toFixed(2)} EGP
- Tax: ${report.salesSummary.totalTax.toFixed(2)} EGP
- Average Order Value: ${report.salesSummary.averageOrderValue.toFixed(2)} EGP
            `);
        }

        if (config.includeReports.includes('payments')) {
            const paymentLines = report.paymentBreakdown.map(p =>
                `- ${p.method}: ${p.count} tx - ${p.total.toFixed(2)} EGP`
            ).join('\n');
            sections.push(`
## Payment Methods
${paymentLines}
            `);
        }

        if (config.includeReports.includes('audit')) {
            sections.push(`
## Audit Summary
- Total Events: ${report.auditSummary.totalEvents}
- Voids: ${report.auditSummary.voidCount}
- Discounts: ${report.auditSummary.discountCount}
- Refunds: ${report.auditSummary.refundCount}
            `);
        }

        if (report.fiscalHealth) {
            sections.push(`
## Fiscal Health
- Submitted: ${report.fiscalHealth.submitted}
- Pending: ${report.fiscalHealth.pending}
- Failed: ${report.fiscalHealth.failed}
- Dead Letters Pending: ${report.fiscalHealth.deadLettersPending}
            `);
        }

        const emailBody = `
# Day Close Report
Date: ${report.date}
Branch: ${report.branchName || report.branchId}
Closed At: ${report.closedAt?.toISOString() || new Date().toISOString()}

${sections.join('\n---\n')}
        `;

        try {
            const result = await emailService.sendTextMail({
                to: config.to,
                cc: config.cc,
                subject: config.subject,
                text: emailBody,
            });

            return { sent: true, recipients: config.to, messageId: result.messageId };
        } catch (error: any) {
            return { sent: false, error: error.message };
        }
    },

    /**
     * Get day close history for a branch
     */
    async getCloseHistory(branchId: string, limit = 30) {
        const closeLogs = await db.select()
            .from(auditLogs)
            .where(and(
                eq(auditLogs.branchId, branchId),
                eq(auditLogs.eventType, 'DAY_CLOSED')
            ))
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit);

        return closeLogs.map(log => ({
            id: log.id,
            date: (log.payload as any)?.date,
            closedBy: log.userId,
            closedAt: log.createdAt,
            summary: (log.payload as any)?.report,
            fiscalHealth: (log.payload as any)?.fiscalHealth,
        }));
    },
};

export default dayCloseService;
