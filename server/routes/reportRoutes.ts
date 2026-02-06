import { Router } from 'express';
import * as reportController from '../controllers/reportController';

const router = Router();

router.get('/vat', reportController.getVatReport);
router.get('/payments', reportController.getPaymentMethodSummary);
router.get('/fiscal', reportController.getFiscalSummary);
router.get('/daily-sales', reportController.getDailySales);

export default router;
