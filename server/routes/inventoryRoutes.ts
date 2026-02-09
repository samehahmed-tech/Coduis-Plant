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

const router = Router();

router.post('/stock/update', updateStock);
router.post('/stock/transfer', transferStock);
router.get('/stock/transfers', getTransferMovements);
router.get('/', getInventoryItems);
router.post('/', createInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;
