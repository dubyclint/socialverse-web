// routes/premiumRoutes.js - Premium Subscription Routes
import express from 'express';
import { PremiumController } from '../controllers/premiumController.js';
import { authenticateUser } from '../middleware/auth.js';
import { requireSubscriptionTier, addPremiumContext } from '../middleware/premiumMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Add premium context to all requests
router.use(addPremiumContext);

// Public premium routes
router.get('/pricing', PremiumController.getPricing);
router.get('/features/:tier?', PremiumController.getFeatures);

// User subscription management
router.get('/status', PremiumController.getSubscriptionStatus);
router.post('/upgrade', PremiumController.upgradeSubscription);
router.post('/cancel', PremiumController.cancelSubscription);
router.get('/check/:featureKey', PremiumController.checkFeatureAccess);

// Admin routes
router.get('/admin/subscriptions', requireSubscriptionTier('VIP'), PremiumController.getAllSubscriptions);
router.post('/admin/process-renewals', requireSubscriptionTier('VIP'), PremiumController.processRenewals);

export default router;
