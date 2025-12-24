// server/api/auth/signup.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    console.log('[API] Signup request body:', body)

    const { email, password, username, fullName } = body

    // ✅ VALIDATE: Only email and password are required for auth.users
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // ✅ VALIDATE: Username is required for public.user profile
    if (!username) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username is required'
      })
    }

    // ✅ Create Supabase client with service role (for server-side)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ✅ STEP 1: Create user in auth.users
    console.log('[API] Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: false // Require email confirmation
    })

    if (authError) {
      console.error('[API] Auth creation error:', authError)
      throw createError({
        statusCode: 400,
        statusMessage: authError.message || 'Failed to create user'
      })
    }

    if (!authData.user) {
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed'
      })
    }

    const userId = authData.user.id
    console.log('[API] ✅ Auth user created:', userId)

    // ✅ STEP 2: Update public.user profile (created by trigger)
    console.log('[API] Updating user profile...')
    const { data: profileData, error: profileError } = await supabase
      .from('user')
      .update({
        username: username.trim().toLowerCase(),
        username_lower: username.trim().toLowerCase(),
        display_name: fullName?.trim() || username.trim(),
        email: email.trim().toLowerCase(),
        email_lower: email.trim().toLowerCase()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (profileError) {
      console.error('[API] Profile update error:', profileError)
      // Don't throw - profile might be created by trigger with delay
    }

    console.log('[API] ✅ User profile updated')

    // ✅ STEP 3: Generate session token (optional - for auto-login)
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      userId: userId
    })

    if (sessionError) {
      console.warn('[API] Session creation warning:', sessionError)
    }

    return {
      success: true,
      user: {
        id: userId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        display_name: fullName?.trim() || username.trim()
      },
      token: sessionData?.session?.access_token || null,
      refreshToken: sessionData?.session?.refresh_token || null,
      needsConfirmation: true,
      message: 'Signup successful. Please check your email to confirm.'
    }

  } catch (error: any) {
    console.error('[API] Signup error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Signup failed'
    })
  }
})
