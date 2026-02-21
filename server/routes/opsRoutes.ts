import { Router } from 'express';
import { getPlatformHealth, getRealtimeHealth } from '../controllers/opsController';
import { getGoLiveSummary, refreshGoLiveReports, updateRollbackDrillArtifact, updateUatSignoffArtifact } from '../controllers/goLiveOpsController';

const router = Router();

router.get('/realtime-health', getRealtimeHealth);
router.get('/platform-health', getPlatformHealth);

// Go-live governance artifacts (SUPER_ADMIN only via /api/ops guard)
router.get('/go-live/summary', getGoLiveSummary);
router.post('/go-live/refresh', refreshGoLiveReports);
router.put('/go-live/uat-signoff', updateUatSignoffArtifact);
router.put('/go-live/rollback-drill', updateRollbackDrillArtifact);

export default router;
