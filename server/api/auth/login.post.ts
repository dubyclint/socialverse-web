// FILE: /server/api/auth/login.post.ts - FIXED
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
  try {
    // Set response header to JSON
    setHeader(event, 'Content-Type', 'application/json')

    const supabase = await serverSupabaseClient(event)
    const body = await readBody<LoginRequest>(event)

    console.log('[Login] Login attempt:', { email: body.email })

    // STEP 1: VALIDATE INPUT
    if (!body.email || !body.password) {
      console.log('[Login] FAILED: Missing email or password')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // STEP 2: QUERY PROFILE BY EMAIL
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', body.email)
      .single()

    if (profileError || !profile) {
      console.log('[Login] FAILED: User not found')
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    // STEP 3: VERIFY PASSWORD
    const passwordMatch = await bcrypt.compare(body.password, profile.password_hash)
    if (!passwordMatch) {
      console.log('[Login] FAILED: Password mismatch')
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    // STEP 4: GENERATE JWT TOKEN
    const token = generateJWT({
      userId: profile.id,
      email: profile.email,
      username: profile.username,
      role: profile.role
    })

    console.log('[Login] SUCCESS: User logged in')

    // STEP 5: RETURN SUCCESS RESPONSE
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
    console.error('[Login] ERROR:', error.message)

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Login failed'
    })
  }
})
