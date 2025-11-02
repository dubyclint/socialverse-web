// FILE: /server/api/auth/login.post.ts - COMPLETE WORKING VERSION
// User login with authentication
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import bcrypt from 'bcrypt'
import { generateJWT } from '~/server/utils/token'

interface LoginRequest {
  email: string
  password: string
}

export default defineEventHandler(async (event) => {
  // CRITICAL: Set JSON response header FIRST
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    console.log('[Login] ========== LOGIN REQUEST STARTED ==========')
    
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<LoginRequest>(event)

    console.log('[Login] Request received:', { email: body?.email })

    // VALIDATION
    if (!body?.email || !body?.password) {
      console.log('[Login] FAILED: Missing email or password')
      return sendError(event, 400, 'Email and password are required')
    }

    // Query profile by email
    console.log('[Login] Querying profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', body.email)
      .single()

    if (profileError || !profile) {
      console.log('[Login] FAILED: User not found')
      return sendError(event, 401, 'Invalid email or password')
    }

    // Verify password
    console.log('[Login] Verifying password...')
    const passwordMatch = await bcrypt.compare(body.password, profile.password_hash)
    
    if (!passwordMatch) {
      console.log('[Login] FAILED: Password mismatch')
      return sendError(event, 401, 'Invalid email or password')
    }

    // Generate JWT token
    console.log('[Login] Generating JWT token...')
    const token = generateJWT({
      userId: profile.id,
      email: profile.email,
      username: profile.username,
      role: profile.role
    })

    console.log('[Login] ========== LOGIN COMPLETED SUCCESSFULLY ==========')

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
    console.error('[Login] CRITICAL ERROR:', error)
    
    // Return error response
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error.message || 'Login failed'
    }
  }
})

function sendError(event: any, statusCode: number, message: string) {
  setResponseStatus(event, statusCode)
  return {
    success: false,
    message
  }
}
