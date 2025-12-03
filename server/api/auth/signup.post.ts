// FILE: /server/api/auth/signup.post.ts
// ============================================================================
// SIGNUP ENDPOINT - Create new user account
// ============================================================================

export default defineEventHandler(async (event) => {
  console.log('[Auth/Signup] POST request received')
  
  try {
    const body = await readBody(event)
    console.log('[Auth/Signup] Email:', body.email)

    const { email, password, username, fullName } = body

    // Validate
    if (!email || !password || !username) {
      console.error('[Auth/Signup] Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    // Get Supabase
    const supabase = await serverSupabaseClient(event)
    if (!supabase) {
      console.error('[Auth/Signup] Supabase not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database unavailable'
      })
    }

    console.log('[Auth/Signup] Creating user:', email)

    // Sign up
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
      console.error('[Auth/Signup] Error:', authError.message)
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

    console.log('[Auth/Signup] User created:', authData.user.id)

    // Create profile
    try {
      await supabase.from('profiles').insert({
        id: authData.user.id,
        username,
        email,
        full_name: fullName || '',
        created_at: new Date().toISOString()
      })
    } catch (err) {
      console.warn('[Auth/Signup] Profile creation warning:', err)
    }

    console.log('[Auth/Signup] ✅ Success')

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
    console.error('[Auth/Signup] Error:', error.message)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Signup failed'
    })
  }
})
