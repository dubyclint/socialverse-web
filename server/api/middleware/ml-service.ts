// FILE 5: /server/api/middleware/ml-service.ts
// ============================================================================
// ML Service middleware for recommendations and personalization
// ============================================================================

import { H3Event } from 'h3';
import { MLService } from '../../ml/core/ml-service';

export async function generatePersonalizedFeed(
  event: H3Event,
  userId: string,
  limit: number = 50
): Promise<any[] | null> {
  try {
    const mlService = event.context.mlService as MLService;
    
    if (!mlService) {
      console.error('ML Service not initialized');
      return null;
    }

    return await mlService.generateFeed(userId, limit);
  } catch (error) {
    console.error('Error generating personalized feed:', error);
    return null;
  }
}

export async function servePersonalizedAds(
  event: H3Event,
  userId: string,
  pageContext: any,
  limit: number = 3
): Promise<any[] | null> {
  try {
    const mlService = event.context.mlService as MLService;
    
    if (!mlService) {
      console.error('ML Service not initialized');
      return null;
    }

    return await mlService.serveAds?.(userId, pageContext, limit) || [];
  } catch (error) {
    console.error('Error serving personalized ads:', error);
    return null;
  }
}

export async function getRecommendations(
  event: H3Event,
  userId: string,
  type: 'users' | 'posts' | 'streams' = 'posts',
  limit: number = 20
): Promise<any[] | null> {
  try {
    const mlService = event.context.mlService as MLService;
    
    if (!mlService) {
      console.error('ML Service not initialized');
      return null;
    }

    return await mlService.getRecommendations?.(userId, type, limit) || [];
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return null;
  }
}

export async function logUserEvent(
  event: H3Event,
  userId: string,
  eventData: {
    eventType: string;
    itemId?: string;
    itemType?: string;
    action?: string;
    metadata?: any;
  }
): Promise<void> {
  try {
    const mlService = event.context.mlService as MLService;
    
    if (!mlService) {
      return;
    }

    await mlService.logEvent?.({
      userId,
      timestamp: Date.now(),
      ...eventData
    });
  } catch (error) {
    console.error('Error logging user event:', error);
  }
}

export async function getModelMetrics(
  event: H3Event
): Promise<any | null> {
  try {
    const mlService = event.context.mlService as MLService;
    
    if (!mlService) {
      return null;
    }

    return await mlService.getMetrics?.();
  } catch (error) {
    console.error('Error getting model metrics:', error);
    return null;
  }
}
