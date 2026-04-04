import { Router } from 'express';
import { getTables, getZones, saveLayout, updateTableStatus, transferTableOrder, splitTableOrder, mergeTableOrders } from '../controllers/tableController';
import { requireRoles } from '../middleware/auth';

const router = Router();
const posAuth = requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'CASHIER', 'WAITER');
const managerAuth = requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER');

router.get('/', posAuth, getTables);
router.get('/zones', posAuth, getZones);
router.post('/layout', managerAuth, saveLayout); // Save full layout
router.post('/transfer', posAuth, transferTableOrder);
router.post('/split', posAuth, splitTableOrder);
router.post('/merge', posAuth, mergeTableOrders);
router.put('/:id/status', posAuth, updateTableStatus); // Sync status

export default router;
