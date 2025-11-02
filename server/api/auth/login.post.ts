// FILE: /server/api/auth/login.post.ts - PRODUCTION READY
// User login with comprehensive error handling
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import bcrypt from 'bcrypt'

interface LoginRequest {
  email: string
  password: string
}

export default defineEventHandler(async (event) => {
  // CRITICAL: Set JSON response header IMMEDIATELY
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    console.log('[Login API] ========== REQUEST START ==========')

    // Read request body
    let body: LoginRequest
    try {
      body = await readBody(event)
    } catch (parseError) {
      console.error('[Login API] Failed to parse request body:', parseError)
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Invalid request format'
      }
    }

    console.log('[Login API] Request data:', { email: body?.email })

    // Validate required fields
    if (!body?.email?.trim() || !body?.password?.trim()) {
      console.log('[Login API] Validation failed: Missing email or password')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Email and password are required'
      }
    }

    // Initialize Supabase client
    let supabase
    try {
      supabase = await serverSupabaseClient(event)
      console.log('[Login API] Supabase client initialized')
    } catch (supabaseError) {
      console.error('[Login API] Failed to initialize Supabase:', supabaseError)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Database connection failed'
      }
    }

    // Query profile by email
    console.log('[Login API] Querying profile...')
    let profile
    try {
      const { data: foundProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', body.email.toLowerCase())
        .single()

      if (profileError || !foundProfile) {
        console.log('[Login API] User not found:', body.email)
        setResponseStatus(event, 401)
        return {
          success: false,
          message: 'Invalid email or password'
        }
      }

      profile = foundProfile
    } catch (profileException) {
      console.error('[Login API] Exception during profile query:', profileException)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to retrieve user profile'
      }
    }

    // Verify password
    console.log('[Login API] Verifying password...')
    let passwordMatch = false
    try {
      passwordMatch = await bcrypt.compare(body.password, profile.password_hash)
    } catch (bcryptError) {
      console.error('[Login API] Password verification failed:', bcryptError)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to verify password'
      }
    }

    if (!passwordMatch) {
      console.log('[Login API] Password mismatch for user:', body.email)
      setResponseStatus(event, 401)
      return {
        success: false,
        message: 'Invalid email or password'
      }
    }

    // Generate JWT token
    console.log('[Login API] Generating JWT token...')
    let token
    try {
      const jwt = await import('jsonwebtoken')
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      
      token = jwt.sign(
        {
          userId: profile.id,
          email: profile.email,
          username: profile.username,
          role: profile.role
        },
        JWT_SECRET,
        { expiresIn: '7d', algorithm: 'HS256' }
      )
    } catch (jwtError) {
      console.error('[Login API] JWT generation failed:', jwtError)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to generate authentication token'
      }
    }

    console.log('[Login API] ========== REQUEST SUCCESS ==========')

    // Return success response
    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        role: profile.role,
        profile: {
          email_verified: profile.email_verified,
          profile_completed: profile.profile_completed
        }
      }
    }

  } catch (error: any) {
    console.error('[Login API] ========== CRITICAL ERROR ==========')
    console.error('[Login API] Error:', {
      message: error?.message,
      code: error?.code,
      statusCode: error?.statusCode,
      stack: error?.stack
    })

    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Login failed. Please try again.'
    }
  }
})
