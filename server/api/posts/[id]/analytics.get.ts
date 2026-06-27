// server/api/posts/[id]/analytics.get.ts
// ============================================================================
// GET POST ANALYTICS
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const postId = getRouterParam(event, 'id')

    const supabase = await serverSupabaseClient(event)

    // Verify post ownership
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (post?.user_id !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Unauthorized'
      })
    }

    // Get analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('post_analytics')
      .select('*')
      .eq('post_id', postId)
      .single()

    if (analyticsError && analyticsError.code !== 'PGRST116') {
      throw analyticsError
    }

    // Get engagement data
    const { data: likes } = await supabase
      .from('post_likes')
      .select('created_at')
      .eq('post_id', postId)

    const { data: comments } = await supabase
      .from('post_comments')
      .select('created_at')
      .eq('post_id', postId)

    const { data: shares } = await supabase
      .from('post_shares')
      .select('shared_at')
      .eq('post_id', postId)

    const { data: views } = await supabase
      .from('post_views')
      .select('viewed_at, device_type, country')
      .eq('post_id', postId)

    // Calculate engagement rate
    const totalEngagement = (likes?.length || 0) + (comments?.length || 0) + (shares?.length || 0)
    const engagementRate = views && views.length > 0
      ? ((totalEngagement / views.length) * 100).toFixed(2)
      : '0'

    // Get device breakdown
    const deviceBreakdown = views?.reduce((acc: any, view: any) => {
      acc[view.device_type] = (acc[view.device_type] || 0) + 1
      return acc
    }, {}) || {}

    // Get top countries
    const countryBreakdown = views?.reduce((acc: any, view: any) => {
      if (view.country) {
        acc[view.country] = (acc[view.country] || 0) + 1
      }
      return acc
    }, {}) || {}

    const topCountries = Object.entries(countryBreakdown)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([country]) => country)

    return {
      success: true,
      data: {
        likes: likes?.length || 0,
        comments: comments?.length || 0,
        shares: shares?.length || 0,
        views: views?.length || 0,
        engagementRate: parseFloat(engagementRate),
        deviceBreakdown,
        topCountries,
        timeline: {
          likes: likes?.map(l => l.created_at) || [],
          comments: comments?.map(c => c.created_at) || [],
          shares: shares?.map(s => s.shared_at) || []
        }
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch analytics'
    })
  }
})
        
