// /server/routes/api/auth/register.post.ts
// ✅ USING ROUTES INSTEAD OF API - BYPASSES MIDDLEWARE

export default defineEventHandler(async (event) => {
  try {
    console.log('[Register Route] Request received')
    
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    
    console.log('[Register Route] Body:', {
      email: body.email,
      username: body.username,
      fullName: body.fullName,
      phone: body.phone
    })
    
    // ✅ VALIDATE REQUIRED FIELDS
    if (!body.email || !body.password || !body.username || !body.fullName || !body.phone) {
      console.error('[Register Route] Missing required fields')
      return {
        success: false,
        message: 'Missing required fields: email, password, username, fullName, phone'
      }
    }
    
    // ✅ NORMALIZE DATA
    const email = body.email.toLowerCase().trim()
    const username = body.username.toLowerCase().trim()
    const fullName = body.fullName.trim()
    const phone = body.phone.trim()
    const bio = body.bio ? body.bio.trim() : ''
    const location = body.location ? body.location.trim() : ''
    
    // ✅ VALIDATE EMAIL FORMAT
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Invalid email format'
      }
    }
    
    // ✅ VALIDATE PHONE FORMAT
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      return {
        success: false,
        message: 'Phone number must have at least 10 digits'
      }
    }
    
    // ✅ VALIDATE USERNAME
    if (username.length < 3 || username.length > 30) {
      return {
        success: false,
        message: 'Username must be 3-30 characters'
      }
    }
    
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      return {
        success: false,
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      }
    }
    
    // ✅ CHECK FOR DUPLICATE USERNAME
    console.log('[Register Route] Checking for duplicate username...')
    const { count: usernameCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('username', username)
    
    if (usernameCount && usernameCount > 0) {
      return {
        success: false,
        message: 'Username already taken'
      }
    }
    
    // ✅ CHECK FOR DUPLICATE EMAIL
    console.log('[Register Route] Checking for duplicate email...')
    const { count: emailCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('email', email)
    
    if (emailCount && emailCount > 0) {
      return {
        success: false,
        message: 'Email already registered'
      }
    }
    
    // ✅ CREATE SUPABASE AUTH USER
    console.log('[Register Route] Creating Supabase auth user...')
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
      console.error('[Register Route] Auth error:', authError)
      return {
        success: false,
        message: authError.message
      }
    }
    
    if (!authData.user) {
      return {
        success: false,
        message: 'Failed to create user account'
      }
    }
    
    console.log('[Register Route] ✅ Auth user created:', authData.user.id)
    
    // ✅ CREATE USER PROFILE
    console.log('[Register Route] Creating user profile...')
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
    
    const { error: profileError, data: profileResult } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (profileError) {
      console.error('[Register Route] Profile creation error:', profileError)
      
      // Try to delete auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
        console.log('[Register Route] Orphaned auth user deleted')
      } catch (deleteErr) {
        console.error('[Register Route] Failed to delete orphaned auth user:', deleteErr)
      }
      
      return {
        success: false,
        message: profileError.message || 'Failed to create user profile'
      }
    }
    
    console.log('[Register Route] ✅ User profile created successfully')
    
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
    console.error('[Register Route] Error:', err)
    
    return {
      success: false,
      message: err.message || 'Registration failed'
    }
  }
})
