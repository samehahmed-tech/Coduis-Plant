import { Router } from 'express';
import {
    getInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    updateStock,
    transferStock,
    getTransferMovements
} from '../controllers/inventoryController';
import { validate } from '../middleware/validate';
import { stockUpdateSchema, stockTransferSchema } from '../middleware/validation';

const router = Router();

router.post('/stock/update', validate(stockUpdateSchema), updateStock);
router.post('/stock/transfer', validate(stockTransferSchema), transferStock);
router.get('/stock/transfers', getTransferMovements);
router.get('/', getInventoryItems);
router.post('/', createInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;
