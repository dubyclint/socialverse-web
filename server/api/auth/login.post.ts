// FILE: /server/api/auth/login.post.ts - UPDATED
// ============================================================================

import { db } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')

  try {
    console.log('[Login] ========== START ==========')

    let body: any
    try {
      body = await readBody(event)
    } catch (error) {
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Invalid request body'
      }))
    }

    const { email, password } = body

    if (!email || !password) {
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      }))
    }

    // ✅ NOW USE ASYNC FUNCTION
    const supabase = await db()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('[Login] Auth error:', error.message)
      return sendError(event, createError({
        statusCode: 401,
        statusMessage: error.message
      }))
    }

    console.log('[Login] ========== SUCCESS ==========')
    return {
      success: true,
      user: data.user,
      session: data.session
    }
  } catch (error) {
    console.error('[Login] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    }))
  }
})
