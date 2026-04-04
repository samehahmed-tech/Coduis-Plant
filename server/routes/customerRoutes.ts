import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { requireRoles } from '../middleware/auth';

const router = Router();
const posAuth = requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'CASHIER', 'WAITER');

router.get('/', posAuth, customerController.getAllCustomers);
router.get('/phone/:phone', posAuth, customerController.getCustomerByPhone);
router.post('/', posAuth, customerController.createCustomer);
router.put('/:id', posAuth, customerController.updateCustomer);
router.delete('/:id', posAuth, customerController.deleteCustomer);

export default router;
