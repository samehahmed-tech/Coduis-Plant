import { Router } from 'express';
import * as productionController from '../controllers/productionController';

const router = Router();

router.get('/orders', productionController.getProductionOrders);
router.post('/orders', productionController.createProductionOrder);
router.put('/orders/:id/start', productionController.startProductionOrder);
router.put('/orders/:id/complete', productionController.completeProductionOrder);
router.put('/orders/:id/cancel', productionController.cancelProductionOrder);

export default router;

