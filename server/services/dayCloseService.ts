/**
 * Day Close Service - End of Day Processing
 * Handles day closing, report generation, and email dispatch
 */

import { db } from '../db';
import { orders, payments, branches, auditLogs } from '../../src/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { createSignedAuditLog } from './auditService';

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

    /**
     * Close the day for a branch
     */
    async closeDay(
        branchId: string,
        date: string,
        userId: string,
        options?: { emailConfig?: EmailConfig; notes?: string }
    ) {
        const report = await this.generateReport(branchId, date);

        // Mark as closed
        report.status = 'CLOSED';
        report.closedBy = userId;
        report.closedAt = new Date();

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
        // Build email content based on included reports
        const sections: string[] = [];

        if (config.includeReports.includes('sales')) {
            sections.push(`
## ملخص المبيعات - Sales Summary
- إجمالي الطلبات: ${report.salesSummary.totalOrders}
- إجمالي الإيرادات: ${report.salesSummary.totalRevenue.toFixed(2)} EGP
- صافي المبيعات: ${report.salesSummary.netSales.toFixed(2)} EGP
- الخصومات: ${report.salesSummary.totalDiscount.toFixed(2)} EGP
- الضريبة: ${report.salesSummary.totalTax.toFixed(2)} EGP
- متوسط قيمة الطلب: ${report.salesSummary.averageOrderValue.toFixed(2)} EGP
            `);
        }

        if (config.includeReports.includes('payments')) {
            const paymentLines = report.paymentBreakdown.map(p =>
                `- ${p.method}: ${p.count} عملية - ${p.total.toFixed(2)} EGP`
            ).join('\n');
            sections.push(`
## طرق الدفع - Payment Methods
${paymentLines}
            `);
        }

        if (config.includeReports.includes('audit')) {
            sections.push(`
## ملخص المراجعة - Audit Summary
- إجمالي الأحداث: ${report.auditSummary.totalEvents}
- الإلغاءات: ${report.auditSummary.voidCount}
- الخصومات: ${report.auditSummary.discountCount}
- المرتجعات: ${report.auditSummary.refundCount}
            `);
        }

        const emailBody = `
# تقرير إغلاق اليوم - Day Close Report
**التاريخ:** ${report.date}
**الفرع:** ${report.branchName || report.branchId}
**تم الإغلاق في:** ${report.closedAt?.toISOString()}

${sections.join('\n---\n')}
        `;

        // Send via email service (placeholder - integrate with actual email provider)
        try {
            console.log('📧 Sending day close email to:', config.to);
            console.log('Subject:', config.subject);
            console.log('Body:', emailBody);

            return { sent: true, recipients: config.to };
        } catch (error: any) {
            console.error('Email send failed:', error);
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
        }));
    },
};

export default dayCloseService;
