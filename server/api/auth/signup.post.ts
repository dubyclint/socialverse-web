import { serverSupabaseClient } from '#supabase/server'

interface SignupRequest {
  email: string
  password: string
  username: string
  fullName: string
  phone?: string
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
          full_name: body.fullName || '',
          phone: body.phone || '',
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

    // Create profile with all required fields
    try {
      const profileData = {
        id: userId,
        email: body.email,
        email_lower: body.email.toLowerCase(),
        username: body.username,
        username_lower: body.username.toLowerCase(),
        full_name: body.fullName || '',
        phone: body.phone || '',
        bio: body.bio || '',
        location: body.location || '',
        avatar_url: null,
        role: 'user',
        status: 'active',
        email_verified: false,
        profile_completed: false,
        preferences: {},
        metadata: {},
        privacy_settings: {}
      }

      console.log('[Signup] Inserting profile with data:', profileData)

      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()

      if (profileError) {
        console.error('[Signup] Profile insertion error:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
          status: profileError.status
        })

        // Rollback: Delete the auth user
        await supabase.auth.admin.deleteUser(userId).catch(err => {
          console.error('[Signup] Rollback failed:', err.message)
        })

        throw createError({
          statusCode: 500,
          statusMessage: `Database error: ${profileError.message}`
        })
      }

      console.log('[Signup] ✅ Profile created successfully')

      return {
        success: true,
        message: 'Signup successful. Please verify your email.',
        user: {
          id: userId,
          email: authData.user.email,
          username: body.username
        }
      }
    } catch (dbError: any) {
      console.error('[Signup] Database error:', dbError.message)

      // Rollback
      await supabase.auth.admin.deleteUser(userId).catch(err => {
        console.error('[Signup] Rollback failed:', err.message)
      })

      throw createError({
        statusCode: 500,
        statusMessage: dbError.message || 'Database error saving new user'
      })
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
