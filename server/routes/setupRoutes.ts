import { Router } from 'express';
import { bootstrapSetup, getSetupStatus } from '../controllers/setupController';

const router = Router();

router.get('/status', getSetupStatus);
router.post('/bootstrap', bootstrapSetup);

export default router;
