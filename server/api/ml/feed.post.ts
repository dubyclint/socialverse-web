// FILE 11: /server/api/ml/feed.post.ts (UPDATED)
// ============================================================================
// POST /api/ml/feed - Generate personalized feed with ML
// ============================================================================

import { generatePersonalizedFeed, logUserEvent } from '../middleware/ml-service';
import { checkPremiumStatus } from '../middleware/premium-check';

interface FeedRequest {
  limit?: number;
  offset?: number;
  filters?: {
    category?: string;
    interests?: string[];
  };
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const body = await readBody<FeedRequest>(event);
    const limit = body.limit || 50;
    const offset = body.offset || 0;

    // Generate personalized feed using ML
    const feed = await generatePersonalizedFeed(event, user.id, limit);

    if (!feed) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to generate feed'
      });
    }

    // Check premium status for ad-free experience
    const premiumStatus = await checkPremiumStatus(event);

    // Log event
    await logUserEvent(event, user.id, {
      eventType: 'feed_generated',
      metadata: {
        limit,
        offset,
        count: feed.length,
        isPremium: premiumStatus.isPremium
      }
    });

    return {
      success: true,
      data: {
        feed,
        count: feed.length,
        hasMore: feed.length === limit,
        isPremium: premiumStatus.isPremium
      }
    };
  } catch (error) {
    console.error('Error generating feed:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate personalized feed'
    });
  }
});
