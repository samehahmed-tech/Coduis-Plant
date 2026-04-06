import { Router } from 'express';
import { bootstrapSetup, getSetupStatus, resetTestData } from '../controllers/setupController';

const router = Router();

router.get('/status', getSetupStatus);
router.post('/bootstrap', bootstrapSetup);
router.post('/reset-test-data', resetTestData);

export default router;
