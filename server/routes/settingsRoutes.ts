import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';

const router = Router();

router.get('/', settingsController.getAllSettings);
router.put('/', settingsController.updateBulkSettings);
router.put('/:key', settingsController.updateSetting);

export default router;
