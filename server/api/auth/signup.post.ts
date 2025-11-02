// FILE: /server/api/auth/signup.post.ts - COMPLETE WORKING VERSION
// User registration with email verification
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import bcrypt from 'bcrypt'
import { generateEmailVerificationToken } from '~/server/utils/token'
import { sendVerificationEmail } from '~/server/utils/email'

interface SignupRequest {
  email: string
  password: string
  username: string
}

export default defineEventHandler(async (event) => {
  // CRITICAL: Set JSON response header FIRST
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    console.log('[Signup] ========== SIGNUP REQUEST STARTED ==========')
    
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<SignupRequest>(event)

    console.log('[Signup] Request received:', { 
      email: body?.email, 
      username: body?.username
    })

    // VALIDATION
    if (!body?.email || !body?.password || !body?.username) {
      console.log('[Signup] FAILED: Missing required fields')
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      }))
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      console.log('[Signup] FAILED: Invalid email format')
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      }))
    }

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(body.password)) {
      console.log('[Signup] FAILED: Password does not meet requirements')
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 8 characters with uppercase, number, and special character'
      }))
    }

    // Check email uniqueness
    console.log('[Signup] Checking email uniqueness...')
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', body.email)
      .single()

    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
      console.log('[Signup] Database error:', emailCheckError)
      return sendError(event, createError({
        statusCode: 500,
        statusMessage: 'Database error'
      }))
    }

    if (existingEmail) {
      console.log('[Signup] FAILED: Email already exists')
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Email already registered'
      }))
    }

    // Hash password
    console.log('[Signup] Hashing password...')
    const passwordHash = await bcrypt.hash(body.password, 10)

    // Generate verification token
    const { token: verificationToken, expiresAt: tokenExpiry } = generateEmailVerificationToken()

    // Create profile
    console.log('[Signup] Creating profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        email: body.email.toLowerCase(),
        email_lower: body.email.toLowerCase(),
        username: body.username,
        username_lower: body.username.toLowerCase(),
        password_hash: passwordHash,
        role: 'user',
        status: 'active',
        email_verified: false,
        profile_completed: false,
        preferences: {},
        metadata: {},
        privacy_settings: {},
        email_verification_token: verificationToken,
        email_verification_expires_at: tokenExpiry
      })
      .select()
      .single()

    if (profileError || !profile) {
      console.log('[Signup] Profile creation failed:', profileError)
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Failed to create profile'
      }))
    }

    console.log('[Signup] Profile created:', profile.id)

    // Initialize wallets (non-critical)
    try {
      const currencies = [
        { code: 'USDT', name: 'Tether' },
        { code: 'USDC', name: 'USD Coin' },
        { code: 'BTC', name: 'Bitcoin' },
        { code: 'ETH', name: 'Ethereum' },
        { code: 'SOL', name: 'Solana' },
        { code: 'MATIC', name: 'Polygon' },
        { code: 'XAUT', name: 'Tether Gold' }
      ]

      const walletInserts = currencies.map(currency => ({
        user_id: profile.id,
        currency_code: currency.code,
        currency_name: currency.name,
        balance: 0.00,
        locked_balance: 0.00,
        is_locked: false
      }))

      await supabase.from('wallets').insert(walletInserts)
      console.log('[Signup] Wallets initialized')
    } catch (walletError) {
      console.warn('[Signup] Wallet initialization warning:', walletError)
    }

    // Initialize ranks (non-critical)
    try {
      const rankCategories = ['trading', 'social', 'content', 'overall']
      const rankInserts = rankCategories.map(category => ({
        user_id: profile.id,
        category,
        current_rank: 'Bronze I',
        rank_level: 1,
        points: 0,
        next_rank: 'Bronze II',
        points_to_next: 100,
        achievements: [],
        season_start: new Date().toISOString()
      }))

      await supabase.from('ranks').insert(rankInserts)
      console.log('[Signup] Ranks initialized')
    } catch (rankError) {
      console.warn('[Signup] Rank initialization warning:', rankError)
    }

    // Send verification email (non-critical)
    try {
      await sendVerificationEmail(profile.email, profile.username, verificationToken)
      console.log('[Signup] Verification email sent')
    } catch (emailError) {
      console.warn('[Signup] Email sending warning:', emailError)
    }

    console.log('[Signup] ========== SIGNUP COMPLETED SUCCESSFULLY ==========')
    
    // Return success response
    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Account created successfully. Check your email to verify.',
      userId: profile.id,
      email: profile.email,
      nextStep: 'email_verification'
    }

  } catch (error: any) {
    console.error('[Signup] CRITICAL ERROR:', error)
    
    // Return error response
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error.message || 'Signup failed'
    }
  }
})

function sendError(event: any, error: any) {
  setResponseStatus(event, error.statusCode || 500)
  return {
    success: false,
    message: error.statusMessage || error.message || 'An error occurred'
  }
}
