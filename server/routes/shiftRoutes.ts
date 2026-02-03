import { Router } from 'express';
import * as shiftController from '../controllers/shiftController';

const router = Router();

router.get('/active', shiftController.getActiveShift);
router.get('/:id/x-report', shiftController.getXReport);
router.post('/open', shiftController.openShift);
router.put('/:id/close', shiftController.closeShift);

export default router;
