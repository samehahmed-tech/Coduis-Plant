import { Router } from 'express';
import * as deliveryController from '../controllers/deliveryController';

const router = Router();

router.get('/zones', deliveryController.getAllZones);
router.get('/drivers', deliveryController.getAvailableDrivers);
router.post('/assign', deliveryController.assignDriver);

export default router;
