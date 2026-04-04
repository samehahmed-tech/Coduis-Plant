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
import { generateBarcodeLabels, previewBarcodeLabel } from '../controllers/barcodeLabelController';
import { validate } from '../middleware/validate';
import { stockUpdateSchema, stockTransferSchema } from '../middleware/validation';
import { requireRoles } from '../middleware/auth';

const router = Router();
const posAuth = requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'CASHIER', 'WAITER');
const managerAuth = requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER');

router.post('/stock/update', posAuth, validate(stockUpdateSchema), updateStock);
router.post('/stock/transfer', managerAuth, validate(stockTransferSchema), transferStock);
router.get('/stock/transfers', managerAuth, getTransferMovements);

// Barcode Labels
router.post('/barcode-labels', managerAuth, generateBarcodeLabels);
router.get('/barcode-labels/preview/:id', managerAuth, previewBarcodeLabel);

router.get('/', posAuth, getInventoryItems);
router.post('/', managerAuth, createInventoryItem);
router.put('/:id', managerAuth, updateInventoryItem);
router.delete('/:id', managerAuth, deleteInventoryItem);

export default router;

