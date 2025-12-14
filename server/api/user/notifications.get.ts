// FILE: /server/api/user/notifications.get.ts
// ============================================================================
// GET USER NOTIFICATIONS - PRODUCTION READY (FIXED)
// ============================================================================
// This endpoint fetches all notifications for the authenticated user with:
// - User authentication
// - Pagination support
// - Graceful handling of missing tables
// - Comprehensive error handling
// - Detailed logging
//
// Features:
// - Returns up to 50 most recent notifications
// - Handles missing notifications table gracefully
// - Works with actual Supabase notifications schema
// - Detailed error messages
// - Optimized database queries
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface Notification {
  id: string
  user_id: string
  type?: string
  title?: string
  message?: string
  data?: Record<string, any>
  created_at: string
  [key: string]: any
}

interface NotificationsResponse {
  success: boolean
  notifications: Notification[]
  count: number
  message?: string
}

export default defineEventHandler(async (event): Promise<NotificationsResponse> => {
  try {
    console.log('[Notifications API] ========================================')
    console.log('[Notifications API] Fetching user notifications')
    console.log('[Notifications API] ========================================')

    // ============================================================================
    // STEP 1: Initialize Supabase client
    // ============================================================================
    console.log('[Notifications API] Step 1: Initializing Supabase client...')

    const supabase = await serverSupabaseClient(event)

    if (!supabase) {
      console.error('[Notifications API] ❌ Supabase client not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }

    console.log('[Notifications API] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 2: Authenticate user
    // ============================================================================
    console.log('[Notifications API] Step 2: Authenticating user...')

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      console.error('[Notifications API] ❌ Authentication failed:', authError?.message)
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please login first'
      })
    }

    console.log('[Notifications API] ✅ User authenticated:', user.email)
    console.log('[Notifications API] User ID:', user.id)

    // ============================================================================
    // STEP 3: Get query parameters
    // ============================================================================
    console.log('[Notifications API] Step 3: Parsing query parameters...')

    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 50, 100) // Max 100
    const offset = parseInt(query.offset as string) || 0

    console.log('[Notifications API] ✅ Query parameters parsed')
    console.log('[Notifications API] Limit:', limit)
    console.log('[Notifications API] Offset:', offset)

    // ============================================================================
    // STEP 4: Fetch notifications from database
    // ============================================================================
    console.log('[Notifications API] Step 4: Fetching notifications from database...')

    let notifications: Notification[] = []
    let totalCount = 0

    try {
      // Build query - fetch all columns without filtering by 'read' column
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.warn('[Notifications API] ⚠️ Query error:', error.message)
        console.warn('[Notifications API] Error code:', error.code)

        // Check if table doesn't exist
        if (
          error.message.includes('does not exist') ||
          error.code === 'PGRST116' ||
          error.code === '42P01'
        ) {
          console.log('[Notifications API] ℹ️ Notifications table does not exist yet')
          console.log('[Notifications API] Returning empty notifications list')

          return {
            success: true,
            notifications: [],
            count: 0,
            message: 'Notifications table not yet created'
          }
        }

        // For other errors, throw
        throw error
      }

      notifications = data || []
      totalCount = count || 0

      console.log('[Notifications API] ✅ Notifications fetched')
      console.log('[Notifications API] Total count:', totalCount)
      console.log('[Notifications API] Returned:', notifications.length)

    } catch (err: any) {
      console.error('[Notifications API] ❌ Fetch failed:', err.message)

      // If table doesn't exist, return empty list gracefully
      if (
        err.message?.includes('does not exist') ||
        err.code === 'PGRST116' ||
        err.code === '42P01'
      ) {
        console.log('[Notifications API] ℹ️ Notifications table does not exist')
        return {
          success: true,
          notifications: [],
          count: 0,
          message: 'Notifications table not yet created'
        }
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch notifications'
      })
    }

    // ============================================================================
    // STEP 5: Validate and sanitize notifications
    // ============================================================================
    console.log('[Notifications API] Step 5: Validating notifications...')

    const validatedNotifications = notifications.map((notif) => ({
      id: notif.id || '',
      user_id: notif.user_id || user.id,
      type: notif.type || 'general',
      title: notif.title || undefined,
      message: notif.message || undefined,
      data: notif.data || undefined,
      created_at: notif.created_at || new Date().toISOString(),
      // Include any other fields that exist in the actual table
      ...Object.keys(notif)
        .filter(key => !['id', 'user_id', 'type', 'title', 'message', 'data', 'created_at'].includes(key))
        .reduce((acc, key) => {
          acc[key] = notif[key]
          return acc
        }, {} as Record<string, any>)
    }))

    console.log('[Notifications API] ✅ Notifications validated')

    // ============================================================================
    // STEP 6: Build and return response
    // ============================================================================
    console.log('[Notifications API] Step 6: Building response...')

    const response: NotificationsResponse = {
      success: true,
      notifications: validatedNotifications,
      count: totalCount
    }

    console.log('[Notifications API] ========================================')
    console.log('[Notifications API] ✅ Notifications fetched successfully')
    console.log('[Notifications API] Total:', response.count)
    console.log('[Notifications API] ========================================')

    return response

  } catch (error: any) {
    console.error('[Notifications API] ========================================')
    console.error('[Notifications API] ❌ ERROR:', error.message)
    console.error('[Notifications API] Status Code:', error.statusCode)
    console.error('[Notifications API] ========================================')

    // If it's already a proper error, throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, wrap it
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch notifications'
    })
  }
})
