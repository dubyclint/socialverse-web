// FILE: /server/api/user/notifications.get.ts
// ============================================================================
// GET USER NOTIFICATIONS - PRODUCTION READY
// ============================================================================
// This endpoint fetches all notifications for the authenticated user with:
// - User authentication
// - Pagination support
// - Filtering options (read/unread)
// - Sorting by date
// - Graceful handling of missing tables
// - Comprehensive error handling
// - Detailed logging
//
// Features:
// - Returns up to 50 most recent notifications
// - Handles missing notifications table gracefully
// - Supports filtering by read status
// - Detailed error messages
// - Optimized database queries
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface Notification {
  id: string
  user_id: string
  type: string
  title?: string
  message?: string
  data?: Record<string, any>
  read: boolean
  created_at: string
}

interface NotificationsResponse {
  success: boolean
  notifications: Notification[]
  count: number
  unread_count: number
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
    const unreadOnly = query.unread === 'true'

    console.log('[Notifications API] ✅ Query parameters parsed')
    console.log('[Notifications API] Limit:', limit)
    console.log('[Notifications API] Offset:', offset)
    console.log('[Notifications API] Unread only:', unreadOnly)

    // ============================================================================
    // STEP 4: Fetch notifications from database
    // ============================================================================
    console.log('[Notifications API] Step 4: Fetching notifications from database...')

    let notifications: Notification[] = []
    let totalCount = 0
    let unreadCount = 0
    let queryError = null

    try {
      // Build query
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Filter by read status if requested
      if (unreadOnly) {
        query = query.eq('read', false)
      }

      // Order by date (newest first)
      query = query.order('created_at', { ascending: false })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      // Execute query
      const { data, error, count } = await query

      notifications = data || []
      queryError = error
      totalCount = count || 0

      if (queryError) {
        console.warn('[Notifications API] ⚠️ Query error:', queryError.message)

        // Check if table doesn't exist
        if (queryError.message.includes('does not exist') || queryError.code === 'PGRST116') {
          console.log('[Notifications API] ℹ️ Notifications table does not exist yet')
          console.log('[Notifications API] Returning empty notifications list')
          
          return {
            success: true,
            notifications: [],
            count: 0,
            unread_count: 0,
            message: 'Notifications table not yet created'
          }
        }

        // For other errors, throw
        throw queryError
      }

      console.log('[Notifications API] ✅ Notifications fetched')
      console.log('[Notifications API] Total count:', totalCount)
      console.log('[Notifications API] Returned:', notifications.length)

    } catch (err: any) {
      console.error('[Notifications API] ❌ Fetch failed:', err.message)

      // If table doesn't exist, return empty list gracefully
      if (err.message?.includes('does not exist')) {
        console.log('[Notifications API] ℹ️ Notifications table does not exist')
        return {
          success: true,
          notifications: [],
          count: 0,
          unread_count: 0,
          message: 'Notifications table not yet created'
        }
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch notifications'
      })
    }

    // ============================================================================
    // STEP 5: Count unread notifications
    // ============================================================================
    console.log('[Notifications API] Step 5: Counting unread notifications...')

    try {
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (countError) {
        console.warn('[Notifications API] ⚠️ Unread count query error:', countError.message)
        // Continue without unread count
      } else if (count !== null) {
        unreadCount = count
        console.log('[Notifications API] ✅ Unread count:', unreadCount)
      }
    } catch (err: any) {
      console.warn('[Notifications API] ⚠️ Could not count unread:', err.message)
      // Continue without unread count
    }

    // ============================================================================
    // STEP 6: Validate and sanitize notifications
    // ============================================================================
    console.log('[Notifications API] Step 6: Validating notifications...')

    const validatedNotifications = notifications.map((notif) => ({
      id: notif.id || '',
      user_id: notif.user_id || user.id,
      type: notif.type || 'general',
      title: notif.title || undefined,
      message: notif.message || undefined,
      data: notif.data || undefined,
      read: notif.read === true,
      created_at: notif.created_at || new Date().toISOString()
    }))

    console.log('[Notifications API] ✅ Notifications validated')

    // ============================================================================
    // STEP 7: Build and return response
    // ============================================================================
    console.log('[Notifications API] Step 7: Building response...')

    const response: NotificationsResponse = {
      success: true,
      notifications: validatedNotifications,
      count: totalCount,
      unread_count: unreadCount
    }

    console.log('[Notifications API] ========================================')
    console.log('[Notifications API] ✅ Notifications fetched successfully')
    console.log('[Notifications API] Total:', response.count)
    console.log('[Notifications API] Unread:', response.unread_count)
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
