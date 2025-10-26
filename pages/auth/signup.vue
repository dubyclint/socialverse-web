import { serverSupabaseClient } from '#supabase/server'

interface SignupRequest {
  email: string
  password: string
  username: string
  fullName: string
  phone: string
  interests?: string[]
  profile?: {
    bio?: string
    avatar_url?: string
  }
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<SignupRequest>(event)
    
    // Validate required fields
    if (!body.email || !body.password || !body.username || !body.fullName || !body.phone) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, username, full name, and phone number are required'
      })
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }
    
    // Validate phone format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
    if (!phoneRegex.test(body.phone.replace(/\s/g, ''))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid phone number format'
      })
    }
    
    // Check if username is already taken
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', body.username)
      .single()
    
    if (existingUsername) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already taken'
      })
    }
    
    // Check if email is already taken
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', body.email)
      .single()
    
    if (existingEmail) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already registered'
      })
    }
    
    // Check if phone is already taken
    const { data: existingPhone } = await supabase
      .from('profiles')
      .select('phone_number')
      .eq('phone_number', body.phone)
      .single()
    
    if (existingPhone) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Phone number already registered'
      })
    }
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password
    })
    
    if (authError) {
      throw createError({
        statusCode: 400,
        statusMessage: authError.message,
        data: authError
      })
    }
    
    if (!authData.user) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user'
      })
    }
    
    // Create user profile with all required fields
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: body.username,
        email: body.email,
        full_name: body.fullName,
        phone_number: body.phone,
        bio: body.profile?.bio || '',
        avatar_url: body.profile?.avatar_url || null,
        role: 'user', // Default role
        is_verified: false,
        rank: 'bronze', // Default rank
        rank_points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      // If profile creation fails, delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create profile',
        data: profileError
      })
    }
    
    // Add user interests if provided
    if (body.interests && body.interests.length > 0) {
      const userInterests = body.interests.map(interestId => ({
        user_id: authData.user.id,
        interest_id: interestId,
        created_at: new Date().toISOString()
      }))
      
      const { error: interestsError } = await supabase
        .from('user_interests')
        .insert(userInterests)
      
      if (interestsError) {
        console.error('Failed to add user interests:', interestsError)
        // Don't fail the signup if interests fail to save
      }
    }
    
    // Return success response with user ID and profile data
    return {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: body.username,
          fullName: body.fullName,
          phone: body.phone
        },
        session: authData.session
      },
      message: 'Account created successfully. Please verify your email.'
    }
    
  } catch (error) {
    console.error('Signup error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during signup',
      data: error
    })
  }
})
