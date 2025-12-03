// FILE: /server/api/auth/login.post.ts
// ============================================================================
// LOGIN ENDPOINT - Authenticate user
// ============================================================================

export default defineEventHandler(async (event) => {
  console.log('[Auth/Login] POST request received')
  
  try {
    const body = await readBody(event)
    console.log('[Auth/Login] Email:', body.email)

    const { email, password } = body

    // Validate
    if (!email || !password) {
      console.error('[Auth/Login] Missing email or password')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // Get Supabase
    const supabase = await serverSupabaseClient(event)
    if (!supabase) {
      console.error('[Auth/Login] Supabase not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database unavailable'
      })
    }

    console.log('[Auth/Login] Authenticating:', email)

    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('[Auth/Login] Error:', error.message)
      throw createError({
        statusCode: 401,
        statusMessage: error.message || 'Invalid credentials'
      })
    }

    if (!data.session || !data.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Login failed'
      })
    }

    console.log('[Auth/Login] ✅ Success for:', email)

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
    console.error('[Auth/Login] Error:', error.message)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Login failed'
    })
  }
})
