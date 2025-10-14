// routes/adminRoutes.js
import express from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard stats
router.get('/stats', AdminController.getDashboardStats);

// User management
router.post('/users/ban', AdminController.banUser);
router.post('/users/verify', AdminController.verifyUser);

// Balance management
router.post('/balance/adjust', AdminController.adjustUserBalance);

// Manager assignment
router.post('/managers/assign', AdminController.assignManager);

// Content moderation
router.get('/content/flagged', AdminController.getFlaggedContent);

// Activity log
router.get('/activity', AdminController.getAdminActivity);

export default router;
