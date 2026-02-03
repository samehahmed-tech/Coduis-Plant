import { Router } from 'express';
import * as orderController from '../controllers/orderController';

const router = Router();

router.get('/', orderController.getAllOrders);
router.post('/', orderController.createOrder);
router.put('/:id/status', orderController.updateOrderStatus);

export default router;
