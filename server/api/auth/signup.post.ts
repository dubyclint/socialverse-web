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

    console.log('[Signup] Creating user:', body.email)

    // Create auth user with metadata
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

    console.log('[Signup] ✅ User created successfully:', authData.user.id)

    return {
      success: true,
      message: 'Signup successful. Please verify your email.',
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    }

  } catch (error: any) {
    console.error('[Signup] Error:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'An unexpected error occurred'
    })
  }
})
