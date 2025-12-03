// FILE: /server/api/auth/signup.post.ts - SIMPLIFIED WORKING VERSION
// ============================================================================
// ✅ SIMPLIFIED: Direct implementation without complex error handling
// ============================================================================

export default defineEventHandler(async (event) => {
  try {
    console.log('[Signup API] Request received')
    
    const body = await readBody(event)
    console.log('[Signup API] Body:', { email: body.email, username: body.username })

    const { email, password, username, fullName } = body

    // Validate required fields
    if (!email || !password || !username) {
      console.error('[Signup API] Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
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

    console.log('[Signup API] Creating auth user for:', email)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName || ''
        }
      }
    })

    if (authError) {
      console.error('[Signup API] Auth error:', authError.message)
      throw createError({
        statusCode: 400,
        statusMessage: authError.message
      })
    }

    if (!authData.user) {
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed'
      })
    }

    console.log('[Signup API] Auth user created:', authData.user.id)

    // Create profile
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          email,
          full_name: fullName || '',
          created_at: new Date().toISOString()
        })

      if (profileError) {
        console.warn('[Signup API] Profile creation warning:', profileError.message)
      }
    } catch (profileErr) {
      console.warn('[Signup API] Profile creation error:', profileErr)
    }

    console.log('[Signup API] ✅ Signup successful')

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username
      },
      token: authData.session?.access_token || null,
      needsConfirmation: !authData.session
    }

  } catch (error: any) {
    console.error('[Signup API] Error:', error.message || error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Signup failed'
    })
  }
})
