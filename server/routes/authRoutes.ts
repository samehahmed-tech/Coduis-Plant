import { Router } from 'express';
import {
    confirmMfaSetup,
    disableMfa,
    getSessions,
    initiateMfaSetup,
    login,
    logout,
    me,
    revokeOtherSessions,
    revokeSession,
    verifyMfaChallenge,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/mfa/verify', verifyMfaChallenge);
router.get('/me', authenticateToken, me);
router.post('/logout', authenticateToken, logout);
router.get('/sessions', authenticateToken, getSessions);
router.delete('/sessions/:id', authenticateToken, revokeSession);
router.post('/sessions/revoke-others', authenticateToken, revokeOtherSessions);
router.post('/mfa/setup/initiate', authenticateToken, initiateMfaSetup);
router.post('/mfa/setup/confirm', authenticateToken, confirmMfaSetup);
router.post('/mfa/disable', authenticateToken, disableMfa);

export default router;
