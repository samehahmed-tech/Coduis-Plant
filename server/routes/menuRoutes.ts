import { Router } from 'express';
import * as menuController from '../controllers/menuController';

const router = Router();

router.get('/categories', menuController.getAllCategories);
router.post('/categories', menuController.createCategory);
router.put('/categories/:id', menuController.updateCategory);
router.delete('/categories/:id', menuController.deleteCategory);

router.get('/items', menuController.getMenuItems);
router.get('/items/pending', menuController.getPendingItems);
router.get('/items/export', menuController.exportItemsCSV);
router.post('/items/import', menuController.importItemsCSV);
router.post('/items', menuController.createItem);
router.put('/items/:id', menuController.updateItem);
router.delete('/items/:id', menuController.deleteItem);

// Lifecycle workflow
router.post('/items/:id/approve', menuController.approveItem);
router.post('/items/:id/publish', menuController.publishItem);
router.post('/items/:id/request-price-change', menuController.requestPriceChange);
router.post('/items/:id/approve-price', menuController.approvePriceChange);

router.get('/full', menuController.getFullMenu);

export default router;
