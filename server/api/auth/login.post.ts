// FILE: /server/api/auth/login.post.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Proper error handling, token management, and user data return
// ============================================================================

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')

  try {
    console.log('[Login API] ========== START ==========')

    let body: any
    try {
      body = await readBody(event)
    } catch (error) {
      console.error('[Login API] Invalid request body')
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Invalid request body'
      }))
    }

    const { email, password } = body

    if (!email || !password) {
      console.error('[Login API] Missing email or password')
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      }))
    }

    // Get Supabase client
    const supabase = await serverSupabaseClient(event)

    if (!supabase) {
      console.error('[Login API] Supabase client not available')
      return sendError(event, createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      }))
    }

    console.log('[Login API] Attempting login for:', email)

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('[Login API] Auth error:', error.message)
      return sendError(event, createError({
        statusCode: 401,
        statusMessage: error.message || 'Invalid email or password'
      }))
    }

    if (!data.session || !data.user) {
      console.error('[Login API] No session or user returned')
      return sendError(event, createError({
        statusCode: 401,
        statusMessage: 'Login failed - no session'
      }))
    }

    console.log('[Login API] ✅ Login successful for:', email)
    console.log('[Login API] ========== SUCCESS ==========')

    return {
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username || '',
        fullName: data.user.user_metadata?.full_name || '',
        avatar: data.user.user_metadata?.avatar_url || null,
      },
      expiresIn: data.session.expires_in,
      expiresAt: data.session.expires_at
    }

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[Login API] Unexpected error:', err.message)
    console.error('[Login API] Stack:', err.stack)
    
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred during login'
    }))
  }
})
