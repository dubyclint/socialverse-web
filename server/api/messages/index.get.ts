// ============================================================================
// FILE: /server/api/messages/index.get.ts
// COMPLETE PRODUCTION IMPLEMENTATION
// ============================================================================
// GET /api/messages - Fetch user messages with pagination
// 
// Query Parameters:
//   - unread_only: boolean (default: false) - fetch only unread messages
//   - limit: number (default: 10, max: 100) - messages per page
//   - offset: number (default: 0) - pagination offset
//
// Response:
//   {
//     success: boolean
//     data: UniverseMessage[]
//     total: number
//     limit: number
//     offset: number
//     unreadCount: number
//     message: string
//   }
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'

interface UniverseMessage {
  id: string
  senderId: string
  recipientId?: string
  content: string
  attachments?: string[]
  isRead: boolean
  readAt?: string
  createdAt: string
  deletedAt?: string
  messageType?: string
  mediaUrl?: string
  replyToId?: string
  location?: string
  isAnonymous?: boolean
}

interface MessagesResponse {
  success: boolean
  data: UniverseMessage[]
  total: number
  limit: number
  offset: number
  unreadCount: number
  message: string
}

export default defineEventHandler(async (event: H3Event): Promise<MessagesResponse> => {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    const contextUser: any = event.context.user
    const userId = contextUser?.id || contextUser?.user_id

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - User not authenticated'
      })
    }

    // ========================================================================
    // 2. PARSE QUERY PARAMETERS
    // ========================================================================
    const query = getQuery(event)
    const unreadOnly = query.unread_only === 'true'
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10))
    const offset = Math.max(0, parseInt(query.offset as string) || 0)

    // ========================================================================
    // 3. INITIALIZE SUPABASE CLIENT
    // ========================================================================
    const supabase = await serverSupabaseClient(event)

    // ========================================================================
    // 4. BUILD QUERY - FETCH MESSAGES
    // ========================================================================
    let messagesQuery = supabase
      .from('universe_messages')
      .select('*', { count: 'exact' })
      .eq('recipientId', userId)
      .is('deletedAt', null)
      .order('createdAt', { ascending: false })

    // Apply unread filter if requested
    if (unreadOnly) {
      messagesQuery = messagesQuery.eq('isRead', false)
    }

    // Apply pagination
    const { data: messages, error: messagesError, count: totalCount } = await messagesQuery
      .range(offset, offset + limit - 1)

    if (messagesError) {
      console.error('[Messages API] Error fetching messages:', messagesError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch messages'
      })
    }

    // ========================================================================
    // 5. FETCH UNREAD COUNT (for UI badge)
    // ========================================================================
    let unreadCount = 0
    try {
      const { count, error: countError } = await supabase
        .from('universe_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipientId', userId)
        .eq('isRead', false)
        .is('deletedAt', null)

      if (!countError && count !== null) {
        unreadCount = count
      }
    } catch (e) {
      console.warn('[Messages API] Failed to fetch unread count:', e)
      // Continue without unread count - not critical
    }

    // ========================================================================
    // 6. RETURN RESPONSE
    // ========================================================================
    return {
      success: true,
      data: (messages || []) as UniverseMessage[],
      total: totalCount || 0,
      limit,
      offset,
      unreadCount,
      message: 'Messages fetched successfully'
    }

  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error?.statusCode) {
      throw error
    }

    // Log unexpected errors
    console.error('[Messages API] Unexpected error:', error)

    // Return generic 500 error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
