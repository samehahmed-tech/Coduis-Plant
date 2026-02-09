import { Router } from 'express';
import * as deliveryController from '../controllers/deliveryController';

const router = Router();

router.get('/zones', deliveryController.getAllZones);
router.get('/drivers/all', deliveryController.getDrivers);
router.get('/drivers', deliveryController.getAvailableDrivers);
router.put('/drivers/:id/status', deliveryController.updateDriverStatus);
router.post('/assign', deliveryController.assignDriver);

export default router;
