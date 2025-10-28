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
    
    // ✅ STEP 1: Validate required fields
    if (!body.email || !body.password || !body.username || !body.fullName || !body.phone) {
      console.error('[Signup] Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, username, full name, and phone number are required'
      })
    }
    
    // ✅ STEP 2: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      console.error('[Signup] Invalid email format:', body.email)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }
    
    // ✅ STEP 3: Validate phone format
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
    if (!phoneRegex.test(body.phone.replace(/\s/g, ''))) {
      console.error('[Signup] Invalid phone format:', body.phone)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid phone number format'
      })
    }
    
    // ✅ STEP 4: CREATE SUPABASE AUTH USER
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
    
    // ✅ STEP 5: CHECK FOR DUPLICATES
    console.log('[Signup] Checking for duplicate username:', body.username)
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', body.username)
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
      console.error('[Signup] Username already taken:', body.username)
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already taken'
      })
    }
    
    // ✅ STEP 6: CREATE USER PROFILE
    console.log('[Signup] Creating user profile for ID:', authData.user.id)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: body.username,
        email: body.email,
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
    
    // ✅ STEP 7: ADD USER INTERESTS IF PROVIDED
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
        // Don't fail the signup if interests fail
      } else {
        console.log('[Signup] ✅ User interests added successfully')
      }
    }
    
    console.log('[Signup] ✅ Signup completed successfully for:', body.email)
    
    // ✅ STEP 8: RETURN SUCCESS
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
