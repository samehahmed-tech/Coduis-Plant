import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { validate } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../middleware/validation';

const router = Router();

router.get('/', orderController.getAllOrders);
router.post('/coupons/validate', orderController.validateCoupon);
router.post('/', validate(createOrderSchema), orderController.createOrder);
router.put('/:id/status', validate(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;
