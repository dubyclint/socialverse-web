// FILE: /server/api/auth/signup.post.ts - COMPLETE FIX
// ============================================================================
// IMPROVEMENTS:
// 1. Better error messages from Supabase errors
// 2. Proper error status codes for different scenarios
// 3. Enhanced logging for debugging
// 4. Better handling of edge cases
// 5. Consistent response structure
// 6. Proper error message extraction from Supabase errors

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  
  try {
    console.log('[Signup] ========== START ==========')
    
    // Parse request body
    let body: any
    try {
      body = await readBody(event)
    } catch (e) {
      console.error('[Signup] Body parse error:', e)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid request body' }
    }

    const { email, password, username, full_name } = body || {}

    // Validate required fields
    if (!email || !password || !username) {
      console.log('[Signup] Missing required fields:', { email: !!email, password: !!password, username: !!username })
      setResponseStatus(event, 400)
      return { success: false, message: 'Email, password, and username are required' }
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('[Signup] Invalid email format:', email)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid email format' }
    }

    // Validate password length
    if (password.length < 8) {
      console.log('[Signup] Password too short:', password.length)
      setResponseStatus(event, 400)
      return { success: false, message: 'Password must be at least 8 characters' }
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      console.log('[Signup] Invalid username format:', username)
      setResponseStatus(event, 400)
      return { success: false, message: 'Username must be 3-20 characters (alphanumeric, underscore, hyphen only)' }
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Signup] Missing Supabase credentials')
      setResponseStatus(event, 500)
      return { success: false, message: 'Server configuration error' }
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[Signup] Supabase client initialized')

    // Check if username already exists
    console.log('[Signup] Checking if username exists:', username)
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    // PGRST116 is the "no rows" error code - that's expected
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Signup] Error checking username:', checkError)
      setResponseStatus(event, 500)
      return { success: false, message: 'Database error while checking username' }
    }

    if (existingProfile) {
      console.log('[Signup] Username already exists:', username)
      setResponseStatus(event, 409)
      return { success: false, message: 'Username already taken' }
    }

    // Create auth user in Supabase
    console.log('[Signup] Creating auth user for email:', email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    })

    if (authError) {
      console.error('[Signup] Auth error:', authError)
      setResponseStatus(event, 400)
      
      // Extract meaningful error message from Supabase auth error
      let errorMessage = 'Failed to create user'
      
      if (authError.message) {
        // Handle common Supabase auth errors
        if (authError.message.includes('already exists')) {
          errorMessage = 'Email already registered'
          setResponseStatus(event, 409)
        } else if (authError.message.includes('password')) {
          errorMessage = 'Password does not meet requirements'
        } else if (authError.message.includes('email')) {
          errorMessage = 'Invalid email address'
        } else {
          errorMessage = authError.message
        }
      }
      
      return { success: false, message: errorMessage }
    }

    const userId = authData.user.id
    console.log('[Signup] Auth user created successfully:', userId)

    // Create user profile
    console.log('[Signup] Creating profile for user:', userId)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username,
        full_name: full_name || username,
        avatar_url: '',
        bio: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      console.error('[Signup] Profile creation error:', profileError)
      
      // Rollback: delete the auth user since profile creation failed
      try {
        await supabase.auth.admin.deleteUser(userId)
        console.log('[Signup] Rolled back auth user due to profile error')
      } catch (rollbackError) {
        console.error('[Signup] Error during rollback:', rollbackError)
      }
      
      setResponseStatus(event, 400)
      
      // Extract meaningful error message
      let errorMessage = 'Failed to create user profile'
      if (profileError.message) {
        if (profileError.message.includes('duplicate')) {
          errorMessage = 'Username already taken'
        } else {
          errorMessage = profileError.message
        }
      }
      
      return { success: false, message: errorMessage }
    }

    console.log('[Signup] ========== SUCCESS ==========')
    console.log('[Signup] User registered:', { userId, email, username })
    
    setResponseStatus(event, 201)
    return {
      success: true,
      message: 'Signup successful. Please check your email to verify your account.',
      user: {
        id: userId,
        email,
        username,
      },
    }
  } catch (error: any) {
    console.error('[Signup] Unexpected error:', error)
    console.error('[Signup] Error stack:', error?.stack)
    
    setResponseStatus(event, 500)
    return { 
      success: false, 
      message: 'An unexpected error occurred. Please try again later.' 
    }
  }
})
