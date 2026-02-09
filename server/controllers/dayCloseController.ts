import { Request, Response } from 'express';
import { dayCloseService } from '../services/dayCloseService';

/**
 * Get day close report preview
 * GET /api/day-close/:branchId/:date
 */
export const getDayCloseReport = async (req: Request, res: Response) => {
    try {
        const branchId = req.params.branchId as string;
        const date = req.params.date as string;

        if (!branchId || !date) {
            return res.status(400).json({
                error: 'BRANCH_ID_AND_DATE_REQUIRED',
                message: 'يرجى تحديد الفرع والتاريخ - Please provide branch and date'
            });
        }

        const report = await dayCloseService.generateReport(branchId, date);
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Close the day for a branch
 * POST /api/day-close/:branchId/:date/close
 */
export const closeDay = async (req: Request, res: Response) => {
    try {
        const branchId = req.params.branchId as string;
        const date = req.params.date as string;
        const userId = (req as any).user?.id || req.body.userId;
        const { emailConfig, notes } = req.body;

        if (!branchId || !date) {
            return res.status(400).json({
                error: 'BRANCH_ID_AND_DATE_REQUIRED',
                message: 'يرجى تحديد الفرع والتاريخ - Please provide branch and date'
            });
        }

        if (!userId) {
            return res.status(401).json({
                error: 'USER_ID_REQUIRED',
                message: 'يجب تسجيل الدخول - Authentication required'
            });
        }

        const report = await dayCloseService.closeDay(branchId, date, userId, {
            emailConfig,
            notes,
        });

        res.json({
            success: true,
            message: 'تم إغلاق اليوم بنجاح - Day closed successfully',
            report,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get day close history
 * GET /api/day-close/:branchId/history
 */
export const getDayCloseHistory = async (req: Request, res: Response) => {
    try {
        const branchId = req.params.branchId as string;
        const limit = parseInt(req.query.limit as string) || 30;

        if (!branchId) {
            return res.status(400).json({
                error: 'BRANCH_ID_REQUIRED',
                message: 'يرجى تحديد الفرع - Please provide branch ID'
            });
        }

        const history = await dayCloseService.getCloseHistory(branchId, limit);
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Send day close email manually
 * POST /api/day-close/:branchId/:date/send-email
 */
export const sendDayCloseEmail = async (req: Request, res: Response) => {
    try {
        const branchId = req.params.branchId as string;
        const date = req.params.date as string;
        const { emailConfig } = req.body;

        if (!branchId || !date) {
            return res.status(400).json({
                error: 'BRANCH_ID_AND_DATE_REQUIRED',
                message: 'يرجى تحديد الفرع والتاريخ - Please provide branch and date'
            });
        }

        if (!emailConfig || !emailConfig.to || !emailConfig.to.length) {
            return res.status(400).json({
                error: 'EMAIL_CONFIG_REQUIRED',
                message: 'يرجى تحديد إعدادات البريد - Please provide email config'
            });
        }

        const report = await dayCloseService.generateReport(branchId, date);
        const result = await dayCloseService.sendDayCloseEmail(report, emailConfig);

        res.json({
            success: result.sent,
            message: result.sent
                ? 'تم إرسال البريد الإلكتروني - Email sent'
                : 'فشل إرسال البريد - Email failed',
            ...result,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
