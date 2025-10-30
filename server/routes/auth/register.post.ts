// /server/routes/auth-register.post.ts
// ✅ SIMPLIFIED ROUTE - DIRECT NITRO HANDLER

export default defineEventHandler(async (event) => {
  try {
    console.log('[Auth Register] Request received')
    
    const body = await readBody(event)
    
    console.log('[Auth Register] Body:', {
      email: body.email,
      username: body.username,
      fullName: body.fullName,
      phone: body.phone
    })
    
    // ✅ VALIDATE REQUIRED FIELDS
    if (!body.email || !body.password || !body.username || !body.fullName || !body.phone) {
      console.error('[Auth Register] Missing required fields')
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
    
    console.log('[Auth Register] Normalized:', { email, username, fullName, phone })
    
    // ✅ GET SUPABASE CLIENT
    let supabase
    try {
      supabase = await serverSupabaseClient(event)
      console.log('[Auth Register] Supabase client initialized')
    } catch (err) {
      console.error('[Auth Register] Supabase client error:', err)
      return {
        success: false,
        message: 'Server configuration error'
      }
    }
    
    // ✅ VALIDATE EMAIL FORMAT
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('[Auth Register] Invalid email:', email)
      return {
        success: false,
        message: 'Invalid email format'
      }
    }
    
    // ✅ VALIDATE PHONE FORMAT
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      console.error('[Auth Register] Invalid phone:', phone)
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
    console.log('[Auth Register] Checking duplicate username...')
    const { count: usernameCount, error: usernameError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('username', username)
    
    if (usernameError) {
      console.error('[Auth Register] Username check error:', usernameError)
      return {
        success: false,
        message: 'Database error'
      }
    }
    
    if (usernameCount && usernameCount > 0) {
      console.error('[Auth Register] Username taken:', username)
      return {
        success: false,
        message: 'Username already taken'
      }
    }
    
    // ✅ CHECK FOR DUPLICATE EMAIL
    console.log('[Auth Register] Checking duplicate email...')
    const { count: emailCount, error: emailError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('email', email)
    
    if (emailError) {
      console.error('[Auth Register] Email check error:', emailError)
      return {
        success: false,
        message: 'Database error'
      }
    }
    
    if (emailCount && emailCount > 0) {
      console.error('[Auth Register] Email taken:', email)
      return {
        success: false,
        message: 'Email already registered'
      }
    }
    
    // ✅ CREATE AUTH USER
    console.log('[Auth Register] Creating auth user...')
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
      console.error('[Auth Register] Auth error:', authError)
      return {
        success: false,
        message: authError.message
      }
    }
    
    if (!authData.user) {
      console.error('[Auth Register] No user returned')
      return {
        success: false,
        message: 'Failed to create user account'
      }
    }
    
    console.log('[Auth Register] ✅ Auth user created:', authData.user.id)
    
    // ✅ CREATE PROFILE
    console.log('[Auth Register] Creating profile...')
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
    
    console.log('[Auth Register] Inserting profile...')
    const { error: profileError, data: profileResult } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (profileError) {
      console.error('[Auth Register] Profile error:', profileError)
      
      // Try to delete auth user
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
        console.log('[Auth Register] Deleted orphaned auth user')
      } catch (deleteErr) {
        console.error('[Auth Register] Delete error:', deleteErr)
      }
      
      return {
        success: false,
        message: profileError.message || 'Failed to create profile'
      }
    }
    
    console.log('[Auth Register] ✅ Profile created successfully')
    
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
    console.error('[Auth Register] Fatal error:', err)
    
    return {
      success: false,
      message: err.message || 'Registration failed'
    }
  }
})
    
