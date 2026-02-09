import { Router } from 'express';
import * as financeController from '../controllers/financeController';

const router = Router();

router.get('/accounts', financeController.getAccounts);
router.get('/journal', financeController.getJournal);
router.post('/journal', financeController.createJournalEntry);
router.get('/trial-balance', financeController.getTrialBalance);
router.get('/reconciliations', financeController.getReconciliations);
router.post('/reconciliations', financeController.createReconciliation);
router.put('/reconciliations/:id/resolve', financeController.resolveReconciliation);
router.get('/period-closes', financeController.getPeriodCloses);
router.post('/period-close', financeController.closePeriod);

export default router;
