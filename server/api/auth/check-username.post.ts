// ============================================================================
// FILE: /server/api/auth/check-username.post.ts - PRODUCTION RECONCILED
// ============================================================================
import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

interface CheckUsernameRequest {
  username: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<CheckUsernameRequest>(event)

    if (!body || !body.username || typeof body.username !== 'string') {
      return { available: false, reason: 'Invalid username format provided.' }
    }

    const trimmedUsername = body.username.trim().toLowerCase()

    if (trimmedUsername.length < 3) {
      return { available: false, reason: 'Username must be at least 3 characters long.' }
    }

    if (trimmedUsername.length > 30) {
      return { available: false, reason: 'Username must be less than 30 characters.' }
    }

    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(trimmedUsername)) {
      return { available: false, reason: 'Username can only contain letters, numbers, underscores, and hyphens.' }
    }

    // ✅ UPDATED: Selects 'user_id' instead of 'id' to accurately reflect profile row tracking
    const { data } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('username', trimmedUsername)
      .maybeSingle()

    // Handle standard PostgREST row missing states cleanly
    if (!data) {
      return { available: true }
    }

    return { available: false, reason: 'Username already taken.' }

  } catch (error) {
    console.error('[CheckUsername] Engine calculation fault:', error)
    return { available: false, reason: 'Internal error validating username availability.' }
  }
})
