import { Router } from 'express';
import { getRealtimeHealth } from '../controllers/opsController';

const router = Router();

router.get('/realtime-health', getRealtimeHealth);

export default router;
