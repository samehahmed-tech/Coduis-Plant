import { Router } from 'express';
import { getTables, getZones, saveLayout, updateTableStatus, transferTableOrder, splitTableOrder, mergeTableOrders } from '../controllers/tableController';

const router = Router();

router.get('/', getTables);
router.get('/zones', getZones);
router.post('/layout', saveLayout); // Save full layout
router.post('/transfer', transferTableOrder);
router.post('/split', splitTableOrder);
router.post('/merge', mergeTableOrders);
router.put('/:id/status', updateTableStatus); // Sync status

export default router;
