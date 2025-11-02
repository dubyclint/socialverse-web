// FILE: /server/api/auth/login.post.ts - COMPLETE WORKING VERSION
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')

  try {
    console.log('[Login] ========== START ==========')

    let body: any
    try {
      body = await readBody(event)
    } catch (e) {
      console.error('[Login] Body parse error:', e)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid request body' }
    }

    const { email, password } = body || {}

    if (!email || !password) {
      console.log('[Login] Missing credentials')
      setResponseStatus(event, 400)
      return { success: false, message: 'Email and password are required' }
    }

    // Get Supabase client - DIRECT INITIALIZATION
    let supabase: any
    try {
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials')
      }

      supabase = createClient(supabaseUrl, supabaseKey)
      console.log('[Login] Supabase client initialized')
    } catch (e) {
      console.error('[Login] Supabase init error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Database connection failed' }
    }

    // Get user profile
    let profile: any
    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (error || !user) {
        console.log('[Login] User not found')
        setResponseStatus(event, 401)
        return { success: false, message: 'Invalid email or password' }
      }

      profile = user
    } catch (e) {
      console.error('[Login] User lookup error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Failed to lookup user' }
    }

    // Verify password
    try {
      const bcrypt = await import('bcrypt')
      const isValid = await bcrypt.default.compare(password, profile.password_hash)

      if (!isValid) {
        console.log('[Login] Invalid password')
        setResponseStatus(event, 401)
        return { success: false, message: 'Invalid email or password' }
      }
    } catch (e) {
      console.error('[Login] Password verification error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Failed to verify password' }
    }

    // Generate JWT token
    let token: string
    try {
      const jwt = await import('jsonwebtoken')
      const secret = process.env.JWT_SECRET || 'your-secret-key-change-this'
      
      token = jwt.default.sign(
        {
          userId: profile.id,
          email: profile.email,
          username: profile.username,
          role: profile.role
        },
        secret,
        { expiresIn: '7d' }
      )
    } catch (e) {
      console.error('[Login] Token generation error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Failed to generate token' }
    }

    console.log('[Login] ========== SUCCESS ==========')
    setResponseStatus(event, 200)

    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        role: profile.role
      }
    }

  } catch (error: any) {
    console.error('[Login] ========== CRITICAL ERROR ==========')
    console.error('[Login] Error:', error?.message || error)

    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Login failed'
    }
  }
})
