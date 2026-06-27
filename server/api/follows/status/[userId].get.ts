// server/api/follows/status/[userId].get.ts - Check Follow Status
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = getRouterParam(event, 'userId')
    
    // Get current user from auth
    const user = await requireAuth(event)
    const currentUserId = user?.id

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    if (!currentUserId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Check if current user follows the target user
    const { data: follow, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to check follow status'
      })
    }

    return {
      success: true,
      is_following: !!follow,
      follower_id: currentUserId,
      following_id: userId
    }
  } catch (error: any) {
    console.error('Error checking follow status:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to check follow status'
    })
  }
})
