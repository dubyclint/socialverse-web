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
    
    console.log('[Signup] Request received:', { email: body.email, username: body.username, phone: body.phone })
    
    // Validate required fields
    if (!body.email || !body.password || !body.username || !body.fullName || !body.phone) {
      console.error('[Signup] Missing required fields:', { email: !!body.email, password: !!body.password, username: !!body.username, fullName: !!body.fullName, phone: !!body.phone })
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
    
    // Validate phone format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
    if (!phoneRegex.test(body.phone.replace(/\s/g, ''))) {
      console.error('[Signup] Invalid phone format:', body.phone)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid phone number format'
      })
    }
    
    // Check if username is already taken
    console.log('[Signup] Checking if username exists:', body.username)
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', body.username)
      .single()
    
    if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
      console.error('[Signup] Error checking username:', usernameCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error checking username: ${usernameCheckError.message}`
      })
    }
    
    if (existingUsername) {
      console.error('[Signup] Username already taken:', body.username)
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already taken'
      })
    }
    
    // Check if email is already taken
    console.log('[Signup] Checking if email exists:', body.email)
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', body.email)
      .single()
    
    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
      console.error('[Signup] Error checking email:', emailCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error checking email: ${emailCheckError.message}`
      })
    }
    
    if (existingEmail) {
      console.error('[Signup] Email already registered:', body.email)
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already registered'
      })
    }
    
    // Check if phone is already taken
    console.log('[Signup] Checking if phone exists:', body.phone)
    const { data: existingPhone, error: phoneCheckError } = await supabase
      .from('profiles')
      .select('phone_number')
      .eq('phone_number', body.phone)
      .single()
    
    if (phoneCheckError && phoneCheckError.code !== 'PGRST116') {
      console.error('[Signup] Error checking phone:', phoneCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error checking phone: ${phoneCheckError.message}`
      })
    }
    
    if (existingPhone) {
      console.error('[Signup] Phone already registered:', body.phone)
      throw createError({
        statusCode: 409,
        statusMessage: 'Phone number already registered'
      })
    }
    
    // Create auth user
    console.log('[Signup] Creating auth user for:', body.email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password
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
    
    console.log('[Signup] Auth user created:', authData.user.id)
    
    // Create user profile with all required fields
    console.log('[Signup] Creating user profile for ID:', authData.user.id)
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
        role: 'user',
        status: 'active',
        is_verified: false,
        rank: 'bronze',
        rank_points: 0,
        email_verified: false,
        preferences: {},
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error('[Signup] Profile creation failed:', profileError)
      // If profile creation fails, delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      throw createError({
        statusCode: 500,
        statusMessage: `Profile creation failed: ${profileError.message}`
      })
    }
    
    console.log('[Signup] User profile created successfully')
    
    // Add user interests if provided
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
        // Don't fail the signup if interests fail to save
      }
    }
    
    console.log('[Signup] Signup completed successfully for:', body.email)
    
    // Return success response with user ID and profile data
    return {
      success: true,
      statusMessage: 'Account created successfully. Please verify your email.',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: body.username,
          fullName: body.fullName,
          phone: body.phone
        },
        session: authData.session
      }
    }
    
  } catch (error) {
    console.error('[Signup] Error caught:', error)
    
    if ((error as any).statusCode) {
      console.error('[Signup] Throwing error with status:', (error as any).statusCode, (error as any).statusMessage)
      throw error
    }
    
    console.error('[Signup] Unexpected error:', (error as any).message || error)
    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${(error as any).message || 'Unknown error during signup'}`
    })
  }
})
