import { Router } from 'express';
import * as shiftController from '../controllers/shiftController';
import { requireRoles } from '../middleware/auth';

const router = Router();
const posAuth = requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'CASHIER', 'WAITER');

router.get('/active', posAuth, shiftController.getActiveShift);
router.get('/:id/x-report', posAuth, shiftController.getXReport);
router.post('/open', posAuth, shiftController.openShift);
router.put('/:id/close', posAuth, shiftController.closeShift);

export default router;
