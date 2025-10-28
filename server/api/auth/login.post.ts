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
    }

    console.log('[Login] Login successful for:', body.email)

    // Return authenticated user data
    return {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email
        },
        session: authData.session
      }
    }

  } catch (error) {
    console.error('[Login] Error caught:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${(error as any).message || 'Unknown error'}`
    })
  }
})
