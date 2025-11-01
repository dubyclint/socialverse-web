// FILE: /server/api/profile/create-with-username.post.ts - NEW
// Create/update username during profile completion with auto-generation
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface CreateUsernameRequest {
  username: string
}

// Helper function to generate unique username
async (supabase: any, baseUsername: string): Promise<string> => {
  const generateSuffix = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let suffix = ''
    for (let i = 0; i < 3; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return suffix
  }

  let finalUsername = baseUsername.toLowerCase()
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', finalUsername)
      .single()

    if (error && error.code === 'PGRST116') {
      // No rows found - username is available
      return finalUsername
    }

    if (!data) {
      return finalUsername
    }

    // Username taken, append random suffix
    finalUsername = `${baseUsername.toLowerCase()}${generateSuffix()}`
    attempts++
  }

  throw new Error('Could not generate unique username')
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = event.context.user?.id

    // STEP 1: VERIFY AUTHENTICATION
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody<CreateUsernameRequest>(event)

    // STEP 2: VALIDATE USERNAME FORMAT
    if (!body.username || typeof body.username !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username is required'
      })
    }

    const trimmedUsername = body.username.trim()

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be 3-30 characters'
      })
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(trimmedUsername)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
      })
    }

    // STEP 3: GENERATE UNIQUE USERNAME (auto-add suffix if taken)
    const generateSuffix = (): string => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let suffix = ''
      for (let i = 0; i < 3; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return suffix
    }

    let finalUsername = trimmedUsername.toLowerCase()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', finalUsername)
        .single()

      if (error && error.code === 'PGRST116') {
        // No rows found - username is available
        break
      }

      if (!data) {
        break
      }

      // Username taken, append random suffix
      finalUsername = `${trimmedUsername.toLowerCase()}${generateSuffix()}`
      attempts++
    }

    if (attempts >= maxAttempts) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Could not generate unique username'
      })
    }

    // STEP 4: UPDATE PROFILE WITH FINAL USERNAME
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        username: finalUsername,
        username_lower: finalUsername.toLowerCase()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[CreateUsername] Update error:', updateError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to update username'
      })
    }

    return {
      success: true,
      message: 'Username created successfully',
      username: finalUsername,
      wasModified: finalUsername !== trimmedUsername.toLowerCase()
    }

  } catch (error) {
    console.error('[CreateUsername] Error:', error)
    throw error
  }
})
