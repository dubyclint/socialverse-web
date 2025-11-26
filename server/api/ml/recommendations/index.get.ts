// FILE 10: /server/api/ml/recommendations/index.get.ts
// ============================================================================
// GET /api/ml/recommendations - Get personalized recommendations
// ============================================================================

import { getRecommendations, logUserEvent } from '../../middleware/ml-service';

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
    const type = (query.type as 'users' | 'posts' | 'streams') || 'posts';
    const limit = parseInt(query.limit as string) || 20;

    const recommendations = await getRecommendations(event, user.id, type, limit);

    // Log the event
    await logUserEvent(event, user.id, {
      eventType: 'recommendations_viewed',
      itemType: type,
      metadata: { count: recommendations?.length || 0 }
    });

    return {
      success: true,
      data: {
        type,
        recommendations: recommendations || [],
        count: recommendations?.length || 0
      }
    };
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get recommendations'
    });
  }
});
