import { Router } from 'express';
import * as reportController from '../controllers/reportController';

const router = Router();

router.get('/vat', reportController.getVatReport);
router.get('/payments', reportController.getPaymentMethodSummary);
router.get('/fiscal', reportController.getFiscalSummary);
router.get('/daily-sales', reportController.getDailySales);
router.get('/overview', reportController.getOverview);
router.get('/profit-summary', reportController.getProfitSummary);
router.get('/profit-daily', reportController.getProfitDaily);
router.get('/food-cost', reportController.getFoodCostReport);
router.get('/dashboard-kpis', reportController.getDashboardKpis);
router.get('/integrity', reportController.getIntegrityChecks);
router.get('/export/csv', reportController.exportReportCsv);
router.get('/export/pdf', reportController.exportReportPdf);

export default router;
