import { Router } from 'express';
import { getTables, getZones, saveLayout, updateTableStatus } from '../controllers/tableController';

const router = Router();

router.get('/', getTables);
router.get('/zones', getZones);
router.post('/layout', saveLayout); // Save full layout
router.put('/:id/status', updateTableStatus); // Sync status

export default router;
