import { Router } from 'express';
import { getInsights, executeAction } from '../controllers/aiController';

const router = Router();

// GET AI-driven insights with caching
router.get('/insights', getInsights);

// POST Execute suggested actions (requires validation)
router.post('/execute', executeAction);

export default router;
