import { Router } from 'express';
import * as printerController from '../controllers/printerController';

const router = Router();

router.get('/', printerController.getPrinters);
router.get('/:id', printerController.getPrinterById);
router.post('/', printerController.createPrinter);
router.put('/:id', printerController.updatePrinter);
router.post('/:id/heartbeat', printerController.heartbeatPrinter);
router.delete('/:id', printerController.deletePrinter);

export default router;
