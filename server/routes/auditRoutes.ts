import { Router } from 'express';
import { getAuditLogs, createAuditLog } from '../controllers/auditController';

const router = Router();

router.get('/', getAuditLogs);
router.post('/', createAuditLog);

export default router;
