import { Router } from 'express';
import * as menuController from '../controllers/menuController';

const router = Router();

router.get('/categories', menuController.getAllCategories);
router.post('/categories', menuController.createCategory);
router.get('/items', menuController.getMenuItems);
router.get('/full', menuController.getFullMenu);

export default router;
