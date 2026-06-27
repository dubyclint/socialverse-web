// ============================================================================
// FILE: /server/api/auth/me.get.ts
// ============================================================================
// Stable auth identity endpoint:
// - Supports cookie session and Bearer token
// - Returns 401 for auth failures
// - Returns 500 only for real server faults
// ============================================================================

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // 1) Cookie/session user first
    const sessionUser = await serverSupabaseUser(event)

    // 2) Bearer token user fallback
    let bearerUser: any = null
    const authHeader =
      getHeader(event, 'authorization') ||
      event.node.req.headers.authorization ||
      ''

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim()

      if (token) {
        const supabase = await serverSupabaseClient(event)
        const { data, error } = await supabase.auth.getUser(token)

        if (!error && data?.user) {
          bearerUser = data.user
        }
      }
    }

    const user = sessionUser || bearerUser

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const resolvedId = String(user.id || user.user_id || '')
      .split(':')[0]
      .trim()

    if (!resolvedId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    return {
      success: true,

      id: resolvedId,
      user_id: resolvedId,
      email: user.email || null,

      user: {
        id: resolvedId,
        user_id: resolvedId,
        email: user.email || null,
        phone: user.phone || null,
        app_metadata: user.app_metadata || {},
        user_metadata: user.user_metadata || {},
        aud: user.aud || null,
        role: user.role || null,
        created_at: user.created_at || null,
        updated_at: user.updated_at || null
      },

      data: {
        id: resolvedId,
        user_id: resolvedId,
        user: {
          id: resolvedId,
          user_id: resolvedId,
          email: user.email || null,
          phone: user.phone || null,
          app_metadata: user.app_metadata || {},
          user_metadata: user.user_metadata || {},
          aud: user.aud || null,
          role: user.role || null,
          created_at: user.created_at || null,
          updated_at: user.updated_at || null
        }
      }
    }
  } catch (error: any) {
    // Preserve intentional auth errors
    if (error?.statusCode === 401) {
      throw error
    }

    // Real server fault
    console.error('[GET /api/auth/me] Internal error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
