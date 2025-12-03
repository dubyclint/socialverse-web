// FILE: /server/api/auth/signup.post.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Proper error handling, profile creation, and user data return
// ============================================================================

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  
  try {
    console.log('[Signup API] ========== START ==========')
    
    let body: any
    try {
      body = await readBody(event)
    } catch (error) {
      console.error('[Signup API] Invalid request body')
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Invalid request body'
      }))
    }

    const { email, password, username, fullName, phone, bio, location } = body

    if (!email || !password || !username) {
      console.error('[Signup API] Missing required fields')
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      }))
    }

    // Validate username format
    if (!/^[a-z0-9_-]+$/i.test(username)) {
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
      }))
    }

    if (username.length < 3 || username.length > 30) {
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Username must be between 3 and 30 characters'
      }))
    }

    // Get Supabase client
    const supabase = await serverSupabaseClient(event)

    if (!supabase) {
      console.error('[Signup API] Supabase client not available')
      return sendError(event, createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      }))
    }

    console.log('[Signup API] Creating account for:', email)

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      console.error('[Signup API] Username already taken:', username)
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Username already taken'
      }))
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName || '',
          phone: phone || '',
          bio: bio || '',
          location: location || ''
        }
      }
    })

    if (authError) {
      console.error('[Signup API] Auth error:', authError.message)
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: authError.message
      }))
    }

    if (!authData.user) {
      console.error('[Signup API] No user returned from signup')
      return sendError(event, createError({
        statusCode: 500,
        statusMessage: 'Signup failed - no user created'
      }))
    }

    // Create user profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        email,
        full_name: fullName || '',
        phone: phone || '',
        bio: bio || '',
        location: location || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('[Signup API] Profile creation error:', profileError.message)
      // Don't fail the signup if profile creation fails
      // The user is already created in auth
      console.warn('[Signup API] User created but profile creation failed')
    }

    console.log('[Signup API] ✅ Signup successful for:', email)
    console.log('[Signup API] ========== SUCCESS ==========')

    // Check if email confirmation is required
    const needsConfirmation = !authData.session

    return {
      success: true,
      needsConfirmation,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username,
        fullName: fullName || '',
      },
      token: authData.session?.access_token || null,
      refreshToken: authData.session?.refresh_token || null,
      message: needsConfirmation 
        ? 'Account created! Please check your email to verify your account.'
        : 'Account created successfully!'
    }

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[Signup API] Unexpected error:', err.message)
    console.error('[Signup API] Stack:', err.stack)
    
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred during signup'
    }))
  }
})
