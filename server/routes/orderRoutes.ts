import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { validate } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../middleware/validation';
import { requireRoles } from '../middleware/auth';

const router = Router();
const posAuth = requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'CASHIER', 'WAITER');

router.get('/', posAuth, orderController.getAllOrders);
router.post('/coupons/validate', posAuth, orderController.validateCoupon);
router.post('/', posAuth, validate(createOrderSchema), orderController.createOrder);
router.put('/:id/status', posAuth, validate(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;
