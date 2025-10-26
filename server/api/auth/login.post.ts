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

    // Authenticate user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    })

    if (authError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password',
        data: authError
      })
    }

    if (!authData.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication failed'
      })
    }

    // Fetch user profile with all details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch user profile',
        data: profileError
      })
    }

    // Verify user has proper authentication (profile exists and is linked to user ID)
    if (profile.id !== authData.user.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User authentication mismatch'
      })
    }

    // Create JWT token with user ID and role for RBAC
    const token = await generateJWT({
      userId: authData.user.id,
      email: authData.user.email,
      role: profile.role || 'user',
      username: profile.username
    })

    // Return authenticated user data with profile and user ID
    return {
      success: true,
      data: {
        user: {
          id: authData.user.id, // User ID from auth
          email: authData.user.email,
          username: profile.username,
          fullName: profile.full_name,
          phone: profile.phone_number,
          role: profile.role,
          avatar_url: profile.avatar_url,
          is_verified: profile.is_verified,
          rank: profile.rank,
          rank_points: profile.rank_points
        },
        session: authData.session,
        token: token
      },
      message: 'Login successful'
    }

  } catch (error) {
    console.error('Login error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during login',
      data: error
    })
  }
})

// Helper function to generate JWT token
async function generateJWT(payload: any) {
  // This should use your JWT library (jsonwebtoken)
  // For now, returning a placeholder - implement with your JWT setup
  return `jwt_token_${payload.userId}`
}
