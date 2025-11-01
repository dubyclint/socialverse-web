 /server/api/auth/check-username.post.ts - UPDATE
// Check username availability
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface CheckUsernameRequest {
  username: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<CheckUsernameRequest>(event)

    if (!body.username || typeof body.username !== 'string') {
      return { available: false, reason: 'Invalid username' }
    }

    const trimmedUsername = body.username.trim().toLowerCase()

    // Validation
    if (trimmedUsername.length < 3) {
      return { available: false, reason: 'Username must be at least 3 characters' }
    }

    if (trimmedUsername.length > 30) {
      return { available: false, reason: 'Username must be less than 30 characters' }
    }

    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(trimmedUsername)) {
      return { available: false, reason: 'Username can only contain letters, numbers, underscore, and hyphen' }
    }

    // Check availability
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', trimmedUsername)
      .single()

    if (error && error.code === 'PGRST116') {
      // No rows found - username is available
      return { available: true }
    }

    if (data) {
      // Username exists
      return { available: false, reason: 'Username already taken' }
    }

    return { available: true }

  } catch (error) {
    console.error('[CheckUsername] Error:', error)
    return { available: false, reason: 'Error checking username' }
  }
})
