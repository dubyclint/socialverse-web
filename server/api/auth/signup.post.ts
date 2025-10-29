import { serverSupabaseClient } from '#supabase/server'

interface SignupRequest {
  email: string
  password: string
  username: string
  fullName: string
  phone: string
  bio?: string
  location?: string
  interests?: string[]
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<SignupRequest>(event)
    
    console.log('[Signup] Request received:', { 
      email: body.email, 
      username: body.username, 
      phone: body.phone,
      interestsCount: body.interests?.length || 0
    })
    
    if (!body.email || !body.password || !body.username || !body.fullName || !body.phone) {
      console.error('[Signup] Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, username, full name, and phone number are required'
      })
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      console.error('[Signup] Invalid email format:', body.email)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }
    
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
    if (!phoneRegex.test(body.phone.replace(/\s/g, ''))) {
      console.error('[Signup] Invalid phone format:', body.phone)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid phone number format'
      })
    }
    
    console.log('[Signup] Creating Supabase auth user for:', body.email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          username: body.username,
          full_name: body.fullName
        }
      }
    })
    
    if (authError) {
      console.error('[Signup] Auth creation failed:', authError)
      throw createError({
        statusCode: 400,
        statusMessage: `Authentication error: ${authError.message}`
      })
    }
   
    if (!authData.user) {
      console.error('[Signup] No user returned from auth signup')
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user account'
      })
    }
    
    console.log('[Signup] ✅ Supabase auth user created:', authData.user.id)
    
    const trimmedUsername = body.username.trim().toLowerCase()
    
    console.log('[Signup] Checking for duplicate username:', trimmedUsername)
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', trimmedUsername)
      .maybeSingle()
    
    if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
      console.error('[Signup] Error checking username:', usernameCheckError)
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${usernameCheckError.message}`
      })
    }
    
    if (existingUsername) {
      console.error('[Signup] Username already taken:', trimmedUsername)
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already taken'
      })
    }
    
    console.log('[Signup] Creating user profile for ID:', authData.user.id)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: trimmedUsername,
        email: body.email.toLowerCase().trim(),
        full_name: body.fullName,
        phone_number: body.phone,
        bio: body.bio || '',
        avatar_url: null,
        role: 'user',
        status: 'active',
        is_verified: false,
        rank: 'bronze',
        rank_points: 0,
        email_verified: false,
        preferences: {
          location: body.location || '',
          emailNotifications: true,
          profilePrivate: false
        },
        metadata: {}
      })
    
    if (profileError) {
      console.error('[Signup] Profile creation failed:', profileError)
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw createError({
        statusCode: 500,
        statusMessage: `Profile creation failed: ${profileError.message}`
      })
    }
    
    console.log('[Signup] ✅ User profile created successfully')
    
    if (body.interests && body.interests.length > 0) {
      console.log('[Signup] Adding user interests:', body.interests)
      const userInterests = body.interests.map(interestId => ({
        user_id: authData.user.id,
        interest_id: interestId,
        created_at: new Date().toISOString()
      }))
      
      const { error: interestsError } = await supabase
        .from('user_interests')
        .insert(userInterests)
      
      if (interestsError) {
        console.error('[Signup] Failed to add user interests:', interestsError)
      } else {
        console.log('[Signup] ✅ User interests added successfully')
      }
    }
    
    console.log('[Signup] ✅ Signup completed successfully for user:', authData.user.id)
    
    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: trimmedUsername
      },
      message: 'Account created successfully. Please check your email to verify your account.'
    }
    
  } catch (error: any) {
    console.error('[Signup] Error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Signup failed. Please try again.'
    })
  }
})
