// routes/pewGiftRoutes.js - Enhanced PewGift Routes
import express from 'express';
import { PewGiftController } from '../controllers/pewGiftController.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Gift sending routes
router.post('/send', rateLimitMiddleware(10, 60), PewGiftController.sendGift);
router.post('/send-bulk', rateLimitMiddleware(5, 60), PewGiftController.sendBulkGifts);
router.get('/preview', PewGiftController.getGiftPreview);

// Transaction management
router.get('/history', PewGiftController.getTransactionHistory);
router.get('/analytics', PewGiftController.getGiftAnalytics);
router.delete('/cancel/:transactionId', PewGiftController.cancelGift);

// Balance management
router.get('/balance', PewGiftController.getUserBalance);

export default router;
