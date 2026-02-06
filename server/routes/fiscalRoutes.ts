import { Router } from 'express';
import { getFiscalLogs, submitReceipt, getFiscalConfig } from '../controllers/fiscalController';

const router = Router();

router.post('/submit', submitReceipt);
router.get('/logs', getFiscalLogs);
router.get('/config', getFiscalConfig);

export default router;
