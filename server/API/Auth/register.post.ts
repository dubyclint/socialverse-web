// /server/api/auth/register.post.ts
// ✅ COMPLETE SIGNUP WITH FULL PROFILE DATA

export default defineEventHandler(async (event) => {
  try {
    console.log('[Register API] Request received')
    
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    
    console.log('[Register API] Received data:', {
      email: body.email,
      username: body.username,
      fullName: body.fullName,
      phone: body.phone,
      bio: body.bio,
      location: body.location
    })
    
    // ✅ VALIDATE REQUIRED FIELDS
    if (!body.email || !body.password || !body.username || !body.fullName || !body.phone) {
      console.error('[Register API] Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: email, password, username, fullName, phone'
      })
    }
    
    // ✅ NORMALIZE DATA
    const email = body.email.toLowerCase().trim()
    const username = body.username.toLowerCase().trim()
    const fullName = body.fullName.trim()
    const phone = body.phone.trim()
    const bio = body.bio ? body.bio.trim() : ''
    const location = body.location ? body.location.trim() : ''
    
    console.log('[Register API] Normalized data:', {
      email,
      username,
      fullName,
      phone,
      bio,
      location
    })
    
    // ✅ VALIDATE EMAIL FORMAT
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }
    
    // ✅ VALIDATE PHONE FORMAT (at least 10 digits)
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Phone number must have at least 10 digits'
      })
    }
    
    // ✅ VALIDATE USERNAME
    if (username.length < 3 || username.length > 30) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be 3-30 characters'
      })
    }
    
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
      })
    }
    
    // ✅ CHECK FOR DUPLICATE USERNAME
    console.log('[Register API] Checking for duplicate username...')
    const { count: usernameCount, error: usernameCheckError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('username', username)
    
    if (usernameCheckError) {
      console.error('[Register API] Username check error:', usernameCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error checking username'
      })
    }
    
    if (usernameCount && usernameCount > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already taken'
      })
    }
    
    // ✅ CHECK FOR DUPLICATE EMAIL
    console.log('[Register API] Checking for duplicate email...')
    const { count: emailCount, error: emailCheckError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('email', email)
    
    if (emailCheckError) {
      console.error('[Register API] Email check error:', emailCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error checking email'
      })
    }
    
    if (emailCount && emailCount > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already registered'
      })
    }
    
    // ✅ CREATE SUPABASE AUTH USER
    console.log('[Register API] Creating Supabase auth user...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: body.password,
      options: {
        emailRedirectTo: `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify-email`,
        data: {
          username,
          full_name: fullName,
          phone,
          bio,
          location
        }
      }
    })
    
    if (authError) {
      console.error('[Register API] Auth error:', authError)
      throw createError({
        statusCode: 400,
        statusMessage: authError.message
      })
    }
    
    if (!authData.user) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user account'
      })
    }
    
    console.log('[Register API] ✅ Auth user created:', authData.user.id)
    
    // ✅ CREATE USER PROFILE WITH ALL DATA
    console.log('[Register API] Creating user profile with full data...')
    const profileData = {
      id: authData.user.id,
      email,
      username,
      full_name: fullName,
      phone_number: phone,
      bio,
      location,
      avatar_url: null,
      role: 'user',
      status: 'active',
      email_verified: false,
      is_verified: false,
      rank: 'bronze',
      rank_points: 0,
      preferences: {
        emailNotifications: true,
        profilePrivate: false,
        showOnlineStatus: true
      },
      metadata: {
        signupDate: new Date().toISOString(),
        signupMethod: 'email'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('[Register API] Profile data to insert:', profileData)
    
    const { error: profileError, data: profileResult } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (profileError) {
      console.error('[Register API] Profile creation error:', profileError)
      
      // Try to delete auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
        console.log('[Register API] Orphaned auth user deleted')
      } catch (deleteErr) {
        console.error('[Register API] Failed to delete orphaned auth user:', deleteErr)
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: profileError.message || 'Failed to create user profile'
      })
    }
    
    console.log('[Register API] ✅ User profile created successfully')
    console.log('[Register API] Profile result:', profileResult)
    
    // ✅ RETURN SUCCESS
    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username,
        fullName,
        phone
      },
      profile: profileResult,
      message: 'Account created successfully. Please check your email to verify your account.'
    }
    
  } catch (err: any) {
    console.error('[Register API] Error:', err)
    
    if (err.statusCode) {
      throw err
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Registration failed'
    })
  }
})
