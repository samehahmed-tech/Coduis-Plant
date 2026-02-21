import { Router } from 'express';
import * as financeController from '../controllers/financeController';
import { validate } from '../middleware/validate';
import { createJournalSchema } from '../middleware/validation';

const router = Router();

router.get('/accounts', financeController.getAccounts);
router.get('/journal', financeController.getJournal);
router.post('/journal', validate(createJournalSchema), financeController.createJournalEntry);
router.get('/trial-balance', financeController.getTrialBalance);
router.get('/reconciliations', financeController.getReconciliations);
router.post('/reconciliations', financeController.createReconciliation);
router.put('/reconciliations/:id/resolve', financeController.resolveReconciliation);
router.get('/period-closes', financeController.getPeriodCloses);
router.post('/period-close', financeController.closePeriod);

// Financial Statements
router.get('/statements/pnl', financeController.getProfitAndLoss);
router.get('/statements/balance-sheet', financeController.getBalanceSheet);
router.get('/statements/cash-flow', financeController.getCashFlowStatement);
router.get('/statements/ar', financeController.getAccountsReceivable);
router.get('/statements/ap', financeController.getAccountsPayable);

export default router;
