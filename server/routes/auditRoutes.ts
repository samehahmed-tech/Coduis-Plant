import { Router } from 'express';
import { getAuditLogs, createAuditLog, verifyAuditLog, verifyAllAuditLogs } from '../controllers/auditController';

const router = Router();

router.get('/', getAuditLogs);
router.post('/', createAuditLog);
router.post('/verify-all', verifyAllAuditLogs);
router.post('/:id/verify', verifyAuditLog);

export default router;
