import { serverSupabaseClient } from '#supabase/server'

interface LoginRequest {
  email: string
  password: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<LoginRequest>(event)

    // Validate required fields
    if (!body.email || !body.password) {
      console.error('[Login] Missing required fields:', { email: !!body.email, password: !!body.password })
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    console.log('[Login] Attempting login for:', body.email)

    // Authenticate user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    })

    if (authError) {
      console.error('[Login] Auth error:', authError)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    if (!authData.user) {
      console.error('[Login] No user returned from auth')
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication failed'
      })
    }

    console.log('[Login] User authenticated:', authData.user.id)

    // ✅ FIX: Fetch user profile with error handling
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[Login] Profile fetch error:', profileError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch user profile'
      })
    }

    // ✅ FIX: If profile doesn't exist, create it
    if (!profile) {
      console.log('[Login] Profile not found, creating default profile')
      const { error: profileCreateError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          role: 'user',
          status: 'active',
          email_verified: !!authData.user.email_confirmed_at,
          preferences: {},
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileCreateError) {
        console.error('[Login] Profile creation error:', profileCreateError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create user profile'
        })
      }

      // ✅ FIX: Fetch the newly created profile
      const { data: newProfile, error: newProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (newProfileError) {
        console.error('[Login] Failed to fetch newly created profile:', newProfileError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to fetch user profile'
        })
      }

      console.log('[Login] Login successful for:', body.email)

      // ✅ CRITICAL FIX: Return COMPLETE profile data
      return {
        success: true,
        statusMessage: 'Login successful',
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            username: newProfile?.username,
            fullName: newProfile?.full_name,
            phone: newProfile?.phone_number,
            role: newProfile?.role,
            status: newProfile?.status,
            avatar_url: newProfile?.avatar_url,
            bio: newProfile?.bio,
            email_verified: newProfile?.email_verified
          },
          profile: newProfile,
          session: authData.session
        }
      }
    }

    console.log('[Login] Login successful for:', body.email)

    // ✅ CRITICAL FIX: Return COMPLETE profile data
    return {
      success: true,
      statusMessage: 'Login successful',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: profile?.username,
          fullName: profile?.full_name,
          phone: profile?.phone_number,
          role: profile?.role,
          status: profile?.status,
          avatar_url: profile?.avatar_url,
          bio: profile?.bio,
          email_verified: profile?.email_verified
        },
        profile: profile,
        session: authData.session
      }
    }

  } catch (error) {
    console.error('[Login] Error caught:', error)
    
    if ((error as any).statusCode) {
      console.error('[Login] Throwing error with status:', (error as any).statusCode, (error as any).statusMessage)
      throw error
    }
    
    console.error('[Login] Unexpected error:', (error as any).message || error)
    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${(error as any).message || 'Unknown error during login'}`
    })
  }
})
