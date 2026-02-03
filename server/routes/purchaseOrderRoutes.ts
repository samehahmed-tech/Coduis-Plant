import { Router } from 'express';
import * as poController from '../controllers/purchaseOrderController';

const router = Router();

router.get('/', poController.getPOs);
router.get('/:id', poController.getPOById);
router.post('/', poController.createPO);
router.put('/:id/receive', poController.receivePO);
router.put('/:id/status', poController.updatePOStatus);

export default router;
