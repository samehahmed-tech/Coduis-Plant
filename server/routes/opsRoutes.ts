import { Router } from 'express';
import { getPlatformHealth, getRealtimeHealth } from '../controllers/opsController';
import { getGoLiveSummary, refreshGoLiveReports, updateRollbackDrillArtifact, updateUatSignoffArtifact } from '../controllers/goLiveOpsController';
import { triggerBackup, listBackups, downloadBackup } from '../controllers/backupController';

const router = Router();

router.get('/realtime-health', getRealtimeHealth);
router.get('/platform-health', getPlatformHealth);

// Database backup management
router.post('/backup', triggerBackup);
router.get('/backups', listBackups);
router.get('/backups/:filename', downloadBackup);

// Go-live governance artifacts (SUPER_ADMIN only via /api/ops guard)
router.get('/go-live/summary', getGoLiveSummary);
router.post('/go-live/refresh', refreshGoLiveReports);
router.put('/go-live/uat-signoff', updateUatSignoffArtifact);
router.put('/go-live/rollback-drill', updateRollbackDrillArtifact);

export default router;
