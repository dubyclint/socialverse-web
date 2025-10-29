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
    
    // Validate required fields
    if (!body.email || !body.password || !body.username || !body.fullName || !body.phone) {
      console.error('[Signup] Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, username, full name, and phone number are required'
      })
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      console.error('[Signup] Invalid email format:', body.email)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }
    
    // Validate phone format
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
    if (!phoneRegex.test(body.phone.replace(/\s/g, ''))) {
      console.error('[Signup] Invalid phone format:', body.phone)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid phone number format'
      })
    }
    
    // Normalize and validate username
    const trimmedUsername = body.username.trim().toLowerCase()
    
    if (trimmedUsername.length < 3) {
      console.error('[Signup] Username too short:', trimmedUsername)
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be at least 3 characters'
      })
    }
    
    if (trimmedUsername.length > 30) {
      console.error('[Signup] Username too long:', trimmedUsername)
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be less than 30 characters'
      })
    }
    
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(trimmedUsername)) {
      console.error('[Signup] Invalid username format:', trimmedUsername)
      throw createError({
        statusCode: 400,
        statusMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
      })
    }
    
    // Check for duplicate username BEFORE creating auth user
    console.log('[Signup] Checking for duplicate username:', trimmedUsername)
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('username', trimmedUsername)
    
    if (usernameCheckError) {
      console.error('[Signup] Error checking username:', usernameCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${usernameCheckError.message}`
      })
    }
    
    if (existingUsername && existingUsername.length > 0) {
      console.error('[Signup] Username already taken:', trimmedUsername)
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already taken'
      })
    }
    
    // Create Supabase auth user
    console.log('[Signup] Creating Supabase auth user for:', body.email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email.toLowerCase().trim(),
      password: body.password,
      options: {
        data: {
          username: trimmedUsername,
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
    
    // Create user profile
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
      // Delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      // Handle unique constraint violation
      if (profileError.code === '23505') {
        throw createError({
          statusCode: 409,
          statusMessage: 'Username already taken'
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: `Profile creation error: ${profileError.message}`
      })
    }
    
    console.log('[Signup] ✅ User profile created successfully')
    
    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: trimmedUsername
      },
      message: 'Account created successfully. Please verify your email.'
    }
    
  } catch (err) {
    console.error('[Signup] Unexpected error:', err)
    throw err
  }
})
