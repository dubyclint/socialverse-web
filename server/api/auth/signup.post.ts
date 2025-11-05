// FILE: /server/api/auth/signup.post.ts
// FIXED VERSION - Uses Supabase Auth + profiles table

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  
  try {
    console.log('[Signup] ========== START ==========')
    
    let body: any
    try {
      body = await readBody(event)
    } catch (e) {
      console.error('[Signup] Body parse error:', e)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid request body' }
    }

    const { email, password, username, full_name } = body || {}

    if (!email || !password || !username) {
      console.log('[Signup] Missing required fields')
      setResponseStatus(event, 400)
      return { success: false, message: 'Email, password, and username are required' }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('[Signup] Invalid email format')
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid email format' }
    }

    if (password.length < 8) {
      console.log('[Signup] Password too short')
      setResponseStatus(event, 400)
      return { success: false, message: 'Password must be at least 8 characters' }
    }

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      console.log('[Signup] Invalid username format')
      setResponseStatus(event, 400)
      return { success: false, message: 'Username must be 3-20 characters (alphanumeric, underscore, hyphen only)' }
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Signup] Missing Supabase credentials')
      setResponseStatus(event, 500)
      return { success: false, message: 'Server configuration error' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[Signup] Supabase client initialized')

    console.log('[Signup] Checking if username exists...')
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Signup] Error checking username:', checkError)
      setResponseStatus(event, 500)
      return { success: false, message: 'Database error' }
    }

    if (existingProfile) {
      console.log('[Signup] Username already exists')
      setResponseStatus(event, 409)
      return { success: false, message: 'Username already taken' }
    }

    console.log('[Signup] Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    })

    if (authError) {
      console.error('[Signup] Auth error:', authError)
      setResponseStatus(event, 400)
      return { success: false, message: authError.message || 'Failed to create user' }
    }

    const userId = authData.user.id
    console.log('[Signup] Auth user created:', userId)

    console.log('[Signup] Creating profile...')
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
      
      await supabase.auth.admin.deleteUser(userId)
      console.log('[Signup] Rolled back auth user due to profile error')
      
      setResponseStatus(event, 400)
      return { success: false, message: 'Failed to create user profile' }
    }

    console.log('[Signup] ========== SUCCESS ==========')
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
    setResponseStatus(event, 500)
    return { success: false, message: 'An unexpected error occurred' }
  }
})
