import { Router } from 'express';
import { requireRoles } from '../middleware/auth';
import { chatAssistant, executeAction, getAiKeyConfig, getInsights, previewAction, updateAiKeyConfig } from '../controllers/aiController';

const router = Router();

// GET AI-driven insights with caching
router.get('/insights', getInsights);

// POST chat orchestration
router.post('/chat', chatAssistant);

// POST preview suggested action (guard + permission)
router.post('/action-preview', previewAction);

// POST execute suggested action (guard + permission + audit)
router.post('/action-execute', executeAction);

// Legacy alias for existing frontend paths
router.post('/execute', executeAction);

// AI key management (server-side encrypted)
router.get('/key-config', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER'), getAiKeyConfig);
router.put('/key-config', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER'), updateAiKeyConfig);

export default router;
