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
      phone: body.phone
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
    
    // Normalize username and email
    const trimmedUsername = body.username.trim().toLowerCase()
    const normalizedEmail = body.email.toLowerCase().trim()
    
    // Validate username
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
    
    // Check for duplicate username in profiles table
    console.log('[Signup] Checking for duplicate username:', trimmedUsername)
    const { data: existingUsers, error: checkError, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('username', trimmedUsername)
    
    if (checkError) {
      console.error('[Signup] Error checking username:', checkError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${checkError.message}`
      })
    }
    
    if (count && count > 0) {
      console.error('[Signup] Username already taken:', trimmedUsername)
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already taken'
      })
    }
    
    // Check for duplicate email in profiles table
    console.log('[Signup] Checking for duplicate email:', normalizedEmail)
    const { data: existingEmails, error: emailCheckError, count: emailCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('email', normalizedEmail)
    
    if (emailCheckError) {
      console.error('[Signup] Error checking email:', emailCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${emailCheckError.message}`
      })
    }
    
    if (emailCount && emailCount > 0) {
      console.error('[Signup] Email already registered:', normalizedEmail)
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already registered'
      })
    }
    
    // ✅ FIX: Create Supabase auth user WITH email verification
    console.log('[Signup] Creating Supabase auth user for:', normalizedEmail)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: body.password,
      options: {
        emailRedirectTo: `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify-email`,
        data: {
          username: trimmedUsername,
          full_name: body.fullName
        }
      }
    })
    
    if (authError) {
      console.error('[Signup] Auth creation failed:', authError)
      if (authError.message.includes('already registered') || authError.message.includes('duplicate')) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email already registered or username already taken'
        })
      }
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
    
    // ✅ FIX: Create user profile
    console.log('[Signup] Creating user profile for ID:', authData.user.id)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: trimmedUsername,
        email: normalizedEmail,
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
        location: body.location || '',
        interests: body.interests || [],
        preferences: {
          emailNotifications: true,
          profilePrivate: false
        },
        metadata: {}
      })
    
    if (profileError) {
      console.error('[Signup] Profile creation failed:', profileError)
      
      // Try to delete auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (deleteErr) {
        console.error('[Signup] Failed to delete orphaned auth user:', deleteErr)
      }
      
      if (profileError.code === '23505') {
        throw createError({
          statusCode: 409,
          statusMessage: 'Username or email already taken'
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: `Profile creation error: ${profileError.message}`
      })
    }
    
    console.log('[Signup] ✅ User profile created successfully')
    
    // ✅ FIX: Return success with email verification status
    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: trimmedUsername
      },
      needsConfirmation: !authData.session, // If no session, email confirmation required
      message: 'Account created successfully. Please check your email to verify your account.'
    }
    
  } catch (err: any) {
    console.error('[Signup] Error:', err)
    throw err
  }
})
