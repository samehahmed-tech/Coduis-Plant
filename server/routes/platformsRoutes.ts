import { Router } from 'express';
import * as platformsController from '../controllers/platformsController';

const router = Router();

router.get('/', platformsController.getPlatforms);
router.post('/', platformsController.createPlatform);
router.put('/:id', platformsController.updatePlatform);
router.delete('/:id', platformsController.deletePlatform);

export default router;
