// routes/securityRoutes.js - Security Management Routes
import express from 'express';
import { SecurityController } from '../controllers/securityController.js';
import { 
  validateSession, 
  checkIPBan, 
  checkAccountSuspension,
  rateLimit,
  securityMonitor
} from '../middleware/securityMiddleware.js';

const router = express.Router();

// Apply security middleware to all routes
router.use(checkIPBan);
router.use(securityMonitor);
router.use(rateLimit({ maxRequests: 60, windowMs: 15 * 60 * 1000 })); // 60 requests per 15 minutes

// Session management routes
router.use(validateSession);
router.use(checkAccountSuspension);

// User security routes
router.get('/sessions', SecurityController.getUserSessions);
router.delete('/sessions/:sessionId', SecurityController.terminateSession);
router.post('/sessions/terminate-all', SecurityController.terminateAllSessions);
router.get('/events', SecurityController.getUserSecurityEvents);
router.get('/statistics', SecurityController.getSecurityStatistics);

// Admin security routes (higher rate limit)
router.use('/admin', rateLimit({ maxRequests: 30, windowMs: 15 * 60 * 1000 }));
router.post('/admin/force-disconnect', SecurityController.forceDisconnectUser);
router.post('/admin/ban-ip', SecurityController.banIP);
router.post('/admin/suspend-account', SecurityController.suspendAccount);
router.get('/admin/events', SecurityController.getAllSecurityEvents);
router.get('/admin/restrictions', SecurityController.getAllRestrictions);
router.delete('/admin/restrictions/:restrictionId', SecurityController.removeRestriction);
router.post('/admin/cleanup', SecurityController.cleanup);

export default router;
