// server/api/auth/signup.post.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    console.log('[API] Signup request body:', body)

    const { email, password, username, fullName, phone, bio, location } = body

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

    // ✅ STEP 2: INSERT user profile with ALL required fields
    console.log('[API] Creating user profile...')
    const { data: profileData, error: profileError } = await supabase
      .from('user')
      .insert({
        user_id: userId,
        username: username.trim().toLowerCase(),
        display_name: fullName?.trim() || username.trim(),
        avatar_url: null, // Default avatar
        bio: bio?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('[API] Profile creation error:', profileError)
      
      // ✅ CLEANUP: Delete the auth user if profile creation fails
      console.log('[API] Cleaning up auth user due to profile creation failure...')
      await supabase.auth.admin.deleteUser(userId)
      
      throw createError({
        statusCode: 400,
        statusMessage: profileError.message || 'Failed to create user profile'
      })
    }

    console.log('[API] ✅ User profile created')

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
      message: 'Account created successfully! Please check your email to verify your account.'
    }

  } catch (error: any) {
    console.error('[API] Signup error:', error)
    throw error
  }
})
