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
  const requestId = Math.random().toString(36).substring(7)
  const log = (msg: string, data?: any) => {
    console.log(`[Signup-${requestId}] ${msg}`, data || '')
  }
  
  try {
    log('=== SIGNUP REQUEST STARTED ===')
    
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<SignupRequest>(event)
    
    log('Request body received:', { 
      email: body.email, 
      username: body.username, 
      phone: body.phone
    })
    
    // Validate required fields
    if (!body.email || !body.password || !body.username || !body.fullName || !body.phone) {
      log('❌ Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, username, full name, and phone number are required'
      })
    }
    
    log('✅ All required fields present')
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      log('❌ Invalid email format:', body.email)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }
    
    log('✅ Email format valid')
    
    // Validate phone format
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
    if (!phoneRegex.test(body.phone.replace(/\s/g, ''))) {
      log('❌ Invalid phone format:', body.phone)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid phone number format'
      })
    }
    
    log('✅ Phone format valid')
    
    // Normalize username and email
    const trimmedUsername = body.username.trim().toLowerCase()
    const normalizedEmail = body.email.toLowerCase().trim()
    
    log('Normalized values:', { username: trimmedUsername, email: normalizedEmail })
    
    // Validate username
    if (trimmedUsername.length < 3) {
      log('❌ Username too short')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be at least 3 characters'
      })
    }
    
    if (trimmedUsername.length > 30) {
      log('❌ Username too long')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be less than 30 characters'
      })
    }
    
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(trimmedUsername)) {
      log('❌ Invalid username format')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
      })
    }
    
    log('✅ Username format valid')
    
    // CHECK USERNAME AVAILABILITY
    log('🔍 Checking username availability...')
    const { data: existingUsers, error: checkError, count: userCount } = await supabase
      .from('profiles')
      .select('id, username, email', { count: 'exact' })
      .ilike('username', trimmedUsername)
    
    log('Username check result:', { 
      count: userCount,
      dataLength: existingUsers?.length,
      error: checkError?.message,
      errorCode: checkError?.code,
      data: existingUsers
    })
    
    if (checkError) {
      log('❌ Error checking username:', checkError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${checkError.message}`
      })
    }
    
    if (existingUsers && existingUsers.length > 0) {
      log('❌ Username already taken:', existingUsers)
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already taken'
      })
    }
    
    log('✅ Username is available')
    
    // CHECK EMAIL AVAILABILITY
    log('🔍 Checking email availability...')
    const { data: existingEmails, error: emailCheckError, count: emailCount } = await supabase
      .from('profiles')
      .select('id, email', { count: 'exact' })
      .ilike('email', normalizedEmail)
    
    log('Email check result:', { 
      count: emailCount,
      dataLength: existingEmails?.length,
      error: emailCheckError?.message,
      errorCode: emailCheckError?.code,
      data: existingEmails
    })
    
    if (emailCheckError) {
      log('❌ Error checking email:', emailCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${emailCheckError.message}`
      })
    }
    
    if (existingEmails && existingEmails.length > 0) {
      log('❌ Email already registered:', existingEmails)
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already registered'
      })
    }
    
    log('✅ Email is available')
    
    // CREATE AUTH USER
    log('🔐 Creating Supabase auth user...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: body.password,
      options: {
        data: {
          username: trimmedUsername,
          full_name: body.fullName
        }
      }
    })
    
    log('Auth signup result:', { 
      userId: authData?.user?.id,
      error: authError?.message,
      errorCode: authError?.code
    })
    
    if (authError) {
      log('❌ Auth creation failed:', authError)
      throw createError({
        statusCode: 400,
        statusMessage: `Authentication error: ${authError.message}`
      })
    }
    
    if (!authData.user) {
      log('❌ No user returned from auth signup')
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user account'
      })
    }
    
    log('✅ Auth user created:', authData.user.id)
    
    // CREATE PROFILE
    log('👤 Creating user profile...')
    const profileData = {
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
    }
    
    log('Profile data to insert:', profileData)
    
    const { error: profileError, data: profileResult } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
    
    log('Profile creation result:', { 
      error: profileError?.message,
      errorCode: profileError?.code,
      data: profileResult
    })
    
    if (profileError) {
      log('❌ Profile creation failed:', profileError)
      
      // Delete auth user if profile creation fails
      try {
        log('🗑️ Deleting orphaned auth user...')
        await supabase.auth.admin.deleteUser(authData.user.id)
        log('✅ Orphaned auth user deleted')
      } catch (deleteErr) {
        log('⚠️ Failed to delete orphaned auth user:', deleteErr)
      }
      
      // Handle unique constraint violation
      if (profileError.code === '23505') {
        log('❌ Unique constraint violation')
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
    
    log('✅ User profile created successfully')
    log('=== SIGNUP REQUEST COMPLETED SUCCESSFULLY ===')
    
    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: trimmedUsername
      },
      message: 'Account created successfully. Please verify your email.'
    }
    
  } catch (err: any) {
    log('❌ UNEXPECTED ERROR:', err)
    log('=== SIGNUP REQUEST FAILED ===')
    throw err
  }
})
