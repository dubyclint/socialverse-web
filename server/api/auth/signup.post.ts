import { serverSupabaseClient } from '#supabase/server'

interface SignupRequest {
  email: string
  password: string
  username: string
  fullName: string
  phone: string
  bio?: string
  location?: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<SignupRequest>(event)

    // Validate required fields
    if (!body.email || !body.password || !body.username) {
      console.error('[Signup] Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    console.log('[Signup] Creating auth user:', body.email)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          username: body.username,
          full_name: body.fullName,
          phone: body.phone,
          bio: body.bio || '',
          location: body.location || ''
        }
      }
    })

    if (authError) {
      console.error('[Signup] Auth error:', authError)
      throw createError({
        statusCode: 400,
        statusMessage: authError.message || 'Signup failed'
      })
    }

    if (!authData.user) {
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed'
      })
    }

    const userId = authData.user.id
    console.log('[Signup] Auth user created:', userId)

    // Create profile with minimal data first
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: body.email,
          username: body.username,
          full_name: body.fullName || '',
          phone: body.phone || '',
          bio: body.bio || '',
          location: body.location || '',
          role: 'user',
          status: 'active',
          email_verified: false
        })

      if (profileError) {
        console.error('[Signup] Profile error:', profileError)
        throw profileError
      }

      console.log('[Signup] ✅ Profile created successfully')
    } catch (dbError: any) {
      console.error('[Signup] Database error details:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint
      })
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error saving new user'
      })
    }

    return {
      success: true,
      message: 'Signup successful. Please verify your email.',
      user: {
        id: userId,
        email: authData.user.email
      }
    }

  } catch (error: any) {
    console.error('[Signup] Error:', error.message)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'An unexpected error occurred'
    })
  }
})
