// FILE 6: /server/api/premium/status.get.ts
// ============================================================================
// GET /api/premium/status - Get user's premium subscription status
// ============================================================================

import { checkPremiumStatus } from '../middleware/premium-check';

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const premiumStatus = await checkPremiumStatus(event);

    return {
      success: true,
      data: {
        userId: user.id,
        isPremium: premiumStatus.isPremium,
        tier: premiumStatus.tier,
        features: premiumStatus.features,
        expiresAt: premiumStatus.expiresAt,
        daysRemaining: premiumStatus.expiresAt 
          ? Math.ceil((premiumStatus.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
      }
    };
  } catch (error) {
    console.error('Error getting premium status:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get premium status'
    });
  }
});
