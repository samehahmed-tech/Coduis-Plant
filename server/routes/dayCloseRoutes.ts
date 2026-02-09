import { Router } from 'express';
import {
    getDayCloseReport,
    closeDay,
    getDayCloseHistory,
    sendDayCloseEmail
} from '../controllers/dayCloseController';

const router = Router();

// Get day close report preview
router.get('/:branchId/:date', getDayCloseReport);

// Get day close history for a branch
router.get('/:branchId/history', getDayCloseHistory);

// Close the day
router.post('/:branchId/:date/close', closeDay);

// Send email report
router.post('/:branchId/:date/send-email', sendDayCloseEmail);

export default router;
