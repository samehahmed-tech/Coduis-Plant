import { Router } from 'express';
import {
    confirmMfaSetup,
    disableMfa,
    getSessions,
    initiateMfaSetup,
    login,
    loginWithPin,
    logout,
    me,
    revokeOtherSessions,
    revokeSession,
    verifyMfaChallenge,
    setupPin,
    disablePin,
    adminSetUserPin,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Standard login
router.post('/login', login);
router.post('/pin-login', loginWithPin);
router.post('/mfa/verify', verifyMfaChallenge);

// Protected routes
router.get('/me', authenticateToken, me);
router.post('/logout', authenticateToken, logout);

// Session management
router.get('/sessions', authenticateToken, getSessions);
router.delete('/sessions/:id', authenticateToken, revokeSession);
router.post('/sessions/revoke-others', authenticateToken, revokeOtherSessions);

// MFA management
router.post('/mfa/setup/initiate', authenticateToken, initiateMfaSetup);
router.post('/mfa/setup/confirm', authenticateToken, confirmMfaSetup);
router.post('/mfa/disable', authenticateToken, disableMfa);

// PIN management
router.post('/pin/setup', authenticateToken, setupPin);
router.post('/pin/disable', authenticateToken, disablePin);
router.post('/pin/admin-set', authenticateToken, adminSetUserPin);

export default router;
