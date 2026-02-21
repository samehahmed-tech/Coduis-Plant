import { Router } from 'express';
import { requireRoles } from '../middleware/auth';
import {
    getWhatsAppEscalations,
    getWhatsAppInbox,
    getWhatsAppStatus,
    resolveWhatsAppEscalation,
    sendWhatsAppTest,
} from '../controllers/whatsappController';

const router = Router();

router.get('/status', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), getWhatsAppStatus);
router.post('/send-test', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), sendWhatsAppTest);
router.get('/inbox', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), getWhatsAppInbox);
router.get('/escalations', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), getWhatsAppEscalations);
router.put('/escalations/:id/resolve', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), resolveWhatsAppEscalation);

export default router;
