// server/api/user/notifications.ts
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 10

    console.log('[API] Fetching notifications - limit:', limit)

    // Get authenticated user
    const user = await requireAuth(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

  const _supabase = await serverSupabaseClient(event)

    // Fetch notifications for user
    const { data: notifications, error } = await _supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[API] Error fetching notifications:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch notifications'
      })
    }

    console.log('[API] ✅ Notifications fetched:', notifications?.length)

    return {
      success: true,
      data: notifications || []
    }

  } catch (error: any) {
    console.error('[API] Notifications error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch notifications'
    })
  }
})
