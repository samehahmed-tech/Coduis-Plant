import { Router } from 'express';
import * as supplierController from '../controllers/supplierController';

const router = Router();

router.get('/', supplierController.getSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.post('/', supplierController.createSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deactivateSupplier);

export default router;
