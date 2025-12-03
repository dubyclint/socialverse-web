// FILE: /server/api/auth/login.post.ts - SIMPLIFIED WORKING VERSION
// ============================================================================
// ✅ SIMPLIFIED: Direct implementation without complex error handling
// ============================================================================

export default defineEventHandler(async (event) => {
  try {
    console.log('[Login API] Request received')
    
    const body = await readBody(event)
    console.log('[Login API] Login attempt for:', body.email)

    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      console.error('[Login API] Missing email or password')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // Get Supabase client
    const supabase = await serverSupabaseClient(event)
    if (!supabase) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }

    console.log('[Login API] Authenticating user:', email)

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('[Login API] Auth error:', error.message)
      throw createError({
        statusCode: 401,
        statusMessage: error.message || 'Invalid email or password'
      })
    }

    if (!data.session || !data.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Login failed - no session'
      })
    }

    console.log('[Login API] ✅ Login successful for:', email)

    return {
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username || ''
      }
    }

  } catch (error: any) {
    console.error('[Login API] Error:', error.message || error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Login failed'
    })
  }
})
