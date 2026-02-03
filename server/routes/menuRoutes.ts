import { Router } from 'express';
import * as menuController from '../controllers/menuController';

const router = Router();

router.get('/categories', menuController.getAllCategories);
router.post('/categories', menuController.createCategory);
router.put('/categories/:id', menuController.updateCategory);
router.delete('/categories/:id', menuController.deleteCategory);

router.get('/items', menuController.getMenuItems);
router.post('/items', menuController.createItem);
router.put('/items/:id', menuController.updateItem);
router.delete('/items/:id', menuController.deleteItem);

router.get('/full', menuController.getFullMenu);

export default router;
