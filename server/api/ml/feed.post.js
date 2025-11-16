// Main feed generation endpoint
import { MLService } from '../../ml/core/ml-service.js'

let mlService = null

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthenticatedUser(event)
    const body = await readBody(event)
    
    // Initialize ML service if not already done
    if (!mlService) {
      mlService = new MLService()
      await mlService.initialize()
    }

    const context = {
      deviceType: getHeader(event, 'user-agent')?.includes('Mobile') ? 'mobile' : 'desktop',
      location: body.location || await getUserLocation(event),
      sessionLength: body.sessionLength || 0,
      previousActions: body.previousActions || [],
      feedType: body.feedType || 'home', // home, explore, following
      lastRefresh: body.lastRefresh
    }

    // Generate personalized feed
    const feedResult = await mlService.generateFeed(user.id, context)

    // Log feed request for analytics
    await logFeedRequest(user.id, context, feedResult.metadata)

    return {
      success: true,
      feed: feedResult.feed,
      metadata: feedResult.metadata,
      nextCursor: generateNextCursor(feedResult.feed),
      refreshToken: generateRefreshToken(user.id)
    }

  } catch (error) {
    console.error('Feed generation error:', error)
    
    // Return fallback feed on error
    const fallbackFeed = await getFallbackFeed(user?.id)
    
    return {
      success: false,
      feed: fallbackFeed,
      error: 'ML service temporarily unavailable',
      fallback: true
    }
  }
})

async function getUserLocation(event) {
  // Get location from IP or user preferences
  const clientIP = getClientIP(event)
  // In production, use IP geolocation service
  return 'US' // Simplified
}

async function logFeedRequest(userId, context, metadata) {
  const supabase = serverSupabaseServiceRole(event)
  
  await supabase
    .from('feed_generation_logs')
    .insert({
      user_id: userId,
      generation_time_ms: metadata.generationTime,
      candidates_considered: metadata.candidatesConsidered,
      final_feed_size: metadata.feed?.length || 0,
      exploration_mode: metadata.explorationMode,
      exploration_rate: metadata.explorationRate,
      diversity_score: metadata.diversityScore,
      context_features: context,
      experiment_group: metadata.experimentGroup
    })
}

function generateNextCursor(feed) {
  if (!feed || feed.length === 0) return null
  const lastItem = feed[feed.length - 1]
  return Buffer.from(JSON.stringify({
    timestamp: lastItem.created_at,
    id: lastItem.id,
    score: lastItem.score
  })).toString('base64')
}

function generateRefreshToken(userId) {
  return Buffer.from(JSON.stringify({
    userId,
    timestamp: Date.now(),
    nonce: Math.random().toString(36)
  })).toString('base64')
}
