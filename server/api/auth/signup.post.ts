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

    console.log('[Signup] Step 1: Creating auth user:', body.email)

    // Step 1: Create auth user
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
    console.log('[Signup] Step 2: Auth user created:', userId)

    // Step 2: Manually create profile (don't rely on trigger)
    console.log('[Signup] Step 3: Creating profile in database')
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: body.email,
        username: body.username,
        full_name: body.fullName,
        phone: body.phone,
        bio: body.bio || '',
        location: body.location || '',
        email_verified: false,
        role: 'user',
        status: 'active'
      })
      .select()
      .single()

    if (profileError) {
      console.error('[Signup] Profile creation error:', profileError)
      console.error('[Signup] Error details:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details
      })
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error saving new user'
      })
    }

    console.log('[Signup] ✅ Profile created successfully:', profileData)

    return {
      success: true,
      message: 'Signup successful. Please verify your email.',
      user: {
        id: userId,
        email: authData.user.email
      }
    }

  } catch (error: any) {
    console.error('[Signup] Catch block error:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'An unexpected error occurred'
    })
  }
})
