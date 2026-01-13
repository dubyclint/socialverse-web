// ============================================================================
// FILE: /server/api/user/notifications.get.ts - FIXED VERSION
// ============================================================================
// FIXED: Maps is_read column to read for frontend compatibility
// FIXED: Proper RLS policy enforcement
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
  is_read?: boolean
  created_at: string
  updated_at?: string
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
  error?: string
}

export default defineEventHandler(async (event): Promise<NotificationsResponse> => {
  try {
    console.log('[Notifications API] ========================================'')
    console.log('[Notifications API] Fetching user notifications')
    console.log('[Notifications API] ========================================'')

    // ============================================================================
    // STEP 1: Initialize Supabase client
    // ============================================================================
    console.log('[Notifications API] Step 1: Initializing Supabase client...')

    let supabase
    try {
      supabase = await serverSupabaseClient(event)
    } catch (err: any) {
      console.error('[Notifications API] ❌ Supabase initialization error:', err.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase initialization failed: ' + err.message
      })
    }

    if (!supabase) {
      console.error('[Notifications API] ❌ Supabase client not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database client not available'
      })
    }

    console.log('[Notifications API] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 2: Authenticate user and extract user ID
    // ============================================================================
    console.log('[Notifications API] Step 2: Authenticating user...')

    let userId: string
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user?.id) {
        console.error('[Notifications API] ❌ Authentication failed:', authError?.message)
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized - Please login first'
        })
      }

      userId = user.id
      console.log('[Notifications API] ✅ User authenticated:', user.email)
      console.log('[Notifications API] ✅ User ID extracted:', userId)
    } catch (err: any) {
      if (err.statusCode === 401) {
        throw err
      }
      console.error('[Notifications API] ❌ Auth error:', err.message)
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication failed'
      })
    }

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
    
    let page = 1
    if (query.page) {
      const parsedPage = parseInt(query.page as string)
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage
      }
    }

    let limit = 20
    if (query.limit) {
      const parsedLimit = parseInt(query.limit as string)
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limit = parsedLimit
      }
    }

    const offset = (page - 1) * limit

    console.log('[Notifications API] ✅ Pagination: page=' + page + ', limit=' + limit + ', offset=' + offset)

    // ============================================================================
    // STEP 5: Fetch notifications from database
    // ============================================================================
    console.log('[Notifications API] Step 5: Fetching notifications from database...')

    let notifications: Notification[] = []
    let totalCount = 0

    try {
      // ✅ FIXED: Query with proper RLS enforcement
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.warn('[Notifications API] ⚠️ Query error:', error.message, 'Code:', error.code)

        // Check if table doesn't exist
        if (
          error.message.includes('does not exist') ||
          error.code === 'PGRST116' ||
          error.code === '42P01'
        ) {
          console.log('[Notifications API] ℹ️ Notifications table does not exist yet')
          
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

        throw error
      }

      notifications = data || []
      totalCount = count || 0

      // ✅ FIXED: Map is_read to read for frontend compatibility
      notifications = notifications.map((notif: any) => ({
        ...notif,
        read: notif.is_read // Map is_read column to read field
      }))

      console.log('[Notifications API] ✅ Notifications fetched')
      console.log('[Notifications API] Total count:', totalCount)
      console.log('[Notifications API] Returned:', notifications.length)

    } catch (err: any) {
      console.error('[Notifications API] ❌ Fetch failed:', err.message)

      // Check if table doesn't exist
      if (
        err.message?.includes('does not exist') ||
        err.code === 'PGRST116' ||
        err.code === '42P01'
      ) {
        console.log('[Notifications API] ℹ️ Returning empty notifications (table not found)')
        
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
        statusMessage: 'Failed to fetch notifications: ' + err.message
      })
    }

    // ============================================================================
    // STEP 6: Calculate pagination info and return
    // ============================================================================
    const has_more = offset + limit < totalCount

    console.log('[Notifications API] ✅ Pagination info: has_more=' + has_more)
    console.log('[Notifications API] ========================================'')
    console.log('[Notifications API] ✅ Request completed successfully')
    console.log('[Notifications API] ========================================'')

    return {
      success: true,
      notifications,
      total: totalCount,
      page,
      limit,
      has_more
    }

  } catch (error: any) {
    console.error('[Notifications API] ❌ FATAL ERROR:', error.message || error)
    console.error('[Notifications API] Stack:', error.stack)

    // If it's already a formatted error, throw it
    if (error.statusCode) {
      throw error
    }

    // Return graceful error response instead of 500
    return {
      success: false,
      notifications: [],
      total: 0,
      page: 1,
      limit: 20,
      has_more: false,
      error: error.message || 'Failed to fetch notifications'
    }
  }
})
