// FILE 13: /server/api/ads/serve.ts (UPDATED)
// ============================================================================
// GET /api/ads/serve - Serve personalized ads with ML
// ============================================================================

import { servePersonalizedAds, logUserEvent } from '../middleware/ml-service';
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

    const query = getQuery(event);
    const page = (query.page as string) || 'home';
    const location = (query.location as string) || 'Nigeria';

    // Check if user is premium
    const premiumStatus = await checkPremiumStatus(event);

    // If premium, return empty ads (ad-free experience)
    if (premiumStatus.isPremium) {
      await logUserEvent(event, user.id, {
        eventType: 'ads_served',
        metadata: { page, count: 0, isPremium: true }
      });

      return {
        success: true,
        data: {
          ads: [],
          count: 0,
          isPremium: true,
          message: 'Ad-free experience for premium users'
        }
      };
    }

    // Get page context
    const pageContext = {
      page,
      location,
      userInterests: user.interests || [],
      userRank: user.rank || 'Homie'
    };

    // Serve personalized ads using ML
    const ads = await servePersonalizedAds(event, user.id, pageContext, 3);

    // Log event
    await logUserEvent(event, user.id, {
      eventType: 'ads_served',
      metadata: { page, count: ads?.length || 0, isPremium: false }
    });

    return {
      success: true,
      data: {
        ads: ads || [],
        count: ads?.length || 0,
        isPremium: false
      }
    };
  } catch (error) {
    console.error('Error serving ads:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to serve ads'
    });
  }
});
