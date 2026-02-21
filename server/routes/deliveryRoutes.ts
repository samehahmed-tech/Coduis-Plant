import { Router } from 'express';
import * as deliveryController from '../controllers/deliveryController';

const router = Router();

router.get('/zones', deliveryController.getAllZones);
router.get('/drivers/all', deliveryController.getDrivers);
router.get('/drivers', deliveryController.getAvailableDrivers);
router.get('/telemetry', deliveryController.getDriverTelemetry);
router.get('/sla-alerts', deliveryController.getSlaAlerts);
router.put('/drivers/:id/status', deliveryController.updateDriverStatus);
router.put('/drivers/:id/location', deliveryController.updateDriverLocation);
router.post('/assign', deliveryController.assignDriver);
router.post('/sla-alerts/escalate', deliveryController.autoEscalateSlaAlerts);

export default router;
