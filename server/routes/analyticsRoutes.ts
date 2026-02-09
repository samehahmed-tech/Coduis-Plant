import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

router.get('/branches', analyticsController.getBranchPerformance);

export default router;
