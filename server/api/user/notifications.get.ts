// FILE: /server/api/user/notifications.get.ts (FIXED - COMPLETE VERSION)
// ============================================================================
// GET USER NOTIFICATIONS - FIXED: Proper authentication and user ID extraction
// ============================================================================
// ✅ CRITICAL FIX: Properly extracts user ID from authenticated session
// ✅ Uses server-side authentication context
// ✅ Validates pagination parameters
// ✅ Handles missing notifications table gracefully
// ✅ Comprehensive error handling at each step
// ✅ Detailed logging for debugging
// ✅ Proper response structure with pagination info
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface Notification {
  id: string
  user_id: string
  type?: string
  title?: string
  message?: string
  data?: Record<string, any>
  read?: boolean
  created_at: string
  [key: string]: any
}

interface NotificationsResponse {
  success: boolean
  notifications: Notification[]
  total: number
  page: number
  limit: number
  has_more: boolean
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
    // STEP 2: Authenticate user and extract user ID
    // ============================================================================
    console.log('[Notifications API] Step 2: Authenticating user...')

    // ✅ CRITICAL FIX: Get user from server-side context
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      console.error('[Notifications API] ❌ Authentication failed:', authError?.message)
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please login first'
      })
    }

    const userId = user.id

    console.log('[Notifications API] ✅ User authenticated:', user.email)
    console.log('[Notifications API] ✅ User ID extracted:', userId)

    // ============================================================================
    // STEP 3: Validate user ID format (UUID)
    // ============================================================================
    console.log('[Notifications API] Step 3: Validating user ID format...')
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    if (!uuidRegex.test(userId)) {
      console.error('[Notifications API] ❌ Invalid user ID format:', userId)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user ID format'
      })
    }

    console.log('[Notifications API] ✅ User ID format is valid')

    // ============================================================================
    // STEP 4: Parse and validate pagination parameters
    // ============================================================================
    console.log('[Notifications API] Step 4: Parsing pagination parameters...')

    const query = getQuery(event)
    
    // ✅ Parse page parameter with validation
    let page = 1
    if (query.page) {
      const parsedPage = parseInt(query.page as string)
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage
      } else {
        console.warn('[Notifications API] ⚠️ Invalid page parameter:', query.page, 'using default: 1')
      }
    }

    // ✅ Parse limit parameter with validation (max 100)
    let limit = 20
    if (query.limit) {
      const parsedLimit = parseInt(query.limit as string)
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limit = parsedLimit
      } else {
        console.warn('[Notifications API] ⚠️ Invalid limit parameter:', query.limit, 'using default: 20')
      }
    }

    const offset = (page - 1) * limit

    console.log('[Notifications API] ✅ Pagination parameters parsed')
    console.log('[Notifications API] Page:', page)
    console.log('[Notifications API] Limit:', limit)
    console.log('[Notifications API] Offset:', offset)

    // ============================================================================
    // STEP 5: Fetch notifications from database
    // ============================================================================
    console.log('[Notifications API] Step 5: Fetching notifications from database...')

    let notifications: Notification[] = []
    let totalCount = 0

    try {
      // ✅ CRITICAL FIX: Fetch notifications with proper user ID
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId) // ✅ Filter by authenticated user ID
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
            total: 0,
            page,
            limit,
            has_more: false,
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
          total: 0,
          page,
          limit,
          has_more: false,
          message: 'Notifications table not yet created'
        }
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch notifications'
      })
    }

    // ============================================================================
    // STEP 6: Validate and sanitize notifications
    // ============================================================================
    console.log('[Notifications API] Step 6: Validating notifications...')

    const validatedNotifications = notifications.map((notif) => ({
      id: notif.id || '',
      user_id: notif.user_id || userId,
      type: notif.type || 'general',
      title: notif.title || undefined,
      message: notif.message || undefined,
      data: notif.data || undefined,
      read: notif.read || false,
      created_at: notif.created_at || new Date().toISOString(),
      // Include any other fields that exist in the actual table
      ...Object.keys(notif)
        .filter(key => !['id', 'user_id', 'type', 'title', 'message', 'data', 'read', 'created_at'].includes(key))
        .reduce((acc, key) => {
          acc[key] = notif[key]
          return acc
        }, {} as Record<string, any>)
    }))

    console.log('[Notifications API] ✅ Notifications validated')

    // ============================================================================
    // STEP 7: Calculate pagination info
    // ============================================================================
    console.log('[Notifications API] Step 7: Calculating pagination info...')

    const has_more = (page * limit) < totalCount
    const totalPages = Math.ceil(totalCount / limit)

    console.log('[Notifications API] ✅ Pagination info calculated')
    console.log('[Notifications API] Current page:', page)
    console.log('[Notifications API] Total pages:', totalPages)
    console.log('[Notifications API] Has more:', has_more)

    // ============================================================================
    // STEP 8: Build and return response
    // ============================================================================
    console.log('[Notifications API] Step 8: Building response...')

    // ✅ CRITICAL FIX: Ensure all required fields are present
    const response: NotificationsResponse = {
      success: true,
      notifications: validatedNotifications,
      total: totalCount,
      page,
      limit,
      has_more
    }

    console.log('[Notifications API] ========================================')
    console.log('[Notifications API] ✅ Notifications fetched successfully')
    console.log('[Notifications API] User ID:', userId)
    console.log('[Notifications API] Total notifications:', response.total)
    console.log('[Notifications API] Returned:', response.notifications.length)
    console.log('[Notifications API] Page:', page, 'of', totalPages)
    console.log('[Notifications API] ========================================')

    return response

  } catch (error: any) {
    console.error('[Notifications API] ========================================')
    console.error('[Notifications API] ❌ ERROR:', error.message)
    console.error('[Notifications API] Status Code:', error.statusCode)
    console.error('[Notifications API] Stack:', error.stack)
    console.error('[Notifications API] ========================================')

    // ✅ CRITICAL FIX: If it's already a proper error, throw it
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
