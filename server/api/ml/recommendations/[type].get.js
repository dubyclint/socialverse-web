// Get specific recommendation types
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthenticatedUser(event)
    const type = getRouterParam(event, 'type')
    const query = getQuery(event)
    
    const supabase = serverSupabaseServiceRole(event)
    
    switch (type) {
      case 'similar-users':
        return await getSimilarUsers(user.id, query, supabase)
      
      case 'trending-topics':
        return await getTrendingTopics(query, supabase)
      
      case 'recommended-follows':
        return await getRecommendedFollows(user.id, query, supabase)
      
      case 'content-categories':
        return await getRecommendedCategories(user.id, query, supabase)
      
      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid recommendation type'
        })
    }
    
  } catch (error) {
    console.error('Recommendations error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get recommendations'
    })
  }
})

async function getSimilarUsers(userId, query, supabase) {
  const limit = Math.min(parseInt(query.limit) || 10, 50)
  
  // Get user embedding
  const { data: userEmbedding } = await supabase
    .from('user_embeddings')
    .select('embedding')
    .eq('user_id', userId)
    .single()
  
  if (!userEmbedding?.embedding) {
    return { users: [] }
  }
  
  // Find similar users using vector similarity
  // In production, use pgvector or external vector DB
  const { data: similarUsers } = await supabase.rpc('find_similar_users', {
    target_embedding: userEmbedding.embedding,
    similarity_threshold: 0.7,
    limit_count: limit
  })
  
  return { users: similarUsers || [] }
}

async function getTrendingTopics(query, supabase) {
  const timeWindow = query.timeWindow || '24h'
  const limit = Math.min(parseInt(query.limit) || 20, 100)
  
  // Get trending hashtags and topics
  const { data: trending } = await supabase.rpc('get_trending_topics', {
    time_window: timeWindow,
    limit_count: limit
  })
  
  return { topics: trending || [] }
}

async function getRecommendedFollows(userId, query, supabase) {
  const limit = Math.min(parseInt(query.limit) || 10, 50)
  
  // Get users followed by similar users
  const { data: recommendations } = await supabase.rpc('get_follow_recommendations', {
    target_user_id: userId,
    limit_count: limit
  })
  
  return { users: recommendations || [] }
}

async function getRecommendedCategories(userId, query, supabase) {
  // Get categories based on user interests and behavior
  const { data: userFeatures } = await supabase
    .from('user_features')
    .select('feature_data')
    .eq('user_id', userId)
    .single()
  
  const interests = userFeatures?.feature_data?.top_categories || []
  
  // Get related categories
  const { data: categories } = await supabase.rpc('get_related_categories', {
    user_interests: interests,
    limit_count: 20
  })
  
  return { categories: categories || [] }
}
