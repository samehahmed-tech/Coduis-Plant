import { Router } from 'express';
import * as wastageController from '../controllers/wastageController';

const router = Router();

router.post('/', wastageController.recordWastage);
router.get('/report', wastageController.getWastageReport);
router.get('/recent', wastageController.getRecentWastage);

export default router;
