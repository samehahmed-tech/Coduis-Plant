import { Router } from 'express';
import * as ctrl from '../controllers/refundController';
import { validate } from '../middleware/validate';
import { createRefundSchema } from '../middleware/validation';

const router = Router();

// Refund CRUD
router.get('/', ctrl.getRefunds);
router.get('/stats', ctrl.getRefundStats);
router.get('/policy', ctrl.getRefundPolicy);
router.put('/policy', ctrl.updateRefundPolicy);
router.get('/:id', ctrl.getRefundById);
router.post('/', validate(createRefundSchema), ctrl.requestRefund);
router.put('/:id/approve', ctrl.approveRefund);
router.put('/:id/reject', ctrl.rejectRefund);
router.post('/:id/process', ctrl.processRefund);

export default router;
