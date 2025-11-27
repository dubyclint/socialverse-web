// FILE: /server/api/auth/signup.post.ts
// ============================================================================

import { getDB, getDBAdmin } from '~/server/utils/db-helpers'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  
  try {
    console.log('[Signup] ========== START ==========')
    
    let body: any
    try {
      body = await readBody(event)
    } catch (error) {
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Invalid request body'
      }))
    }

    const { email, password, username } = body

    if (!email || !password || !username) {
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      }))
    }

    // ✅ GET CLIENTS FROM CONTEXT
    const supabase = await getDB(event)
    const supabaseAdmin = await getDBAdmin(event)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    })

    if (authError) {
      console.error('[Signup] Auth error:', authError.message)
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: authError.message
      }))
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user?.id,
        username,
        email,
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('[Signup] Profile error:', profileError.message)
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Failed to create user profile'
      }))
    }

    console.log('[Signup] ========== SUCCESS ==========')
    return {
      success: true,
      user: authData.user,
      message: 'Signup successful'
    }
  } catch (error) {
    console.error('[Signup] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    }))
  }
})
