// FILE: /server/api/auth/signup.post.ts - PRODUCTION READY
// User registration with comprehensive error handling
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import bcrypt from 'bcrypt'

interface SignupRequest {
  email: string
  password: string
  username: string
}

export default defineEventHandler(async (event) => {
  // CRITICAL: Set JSON response header IMMEDIATELY
  setResponseHeader(event, 'Content-Type', 'application/json')
  
  try {
    console.log('[Signup API] ========== REQUEST START ==========')
    
    // Read request body
    let body: SignupRequest
    try {
      body = await readBody(event)
    } catch (parseError) {
      console.error('[Signup API] Failed to parse request body:', parseError)
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Invalid request format'
      }
    }

    console.log('[Signup API] Request data:', {
      email: body?.email,
      username: body?.username,
      hasPassword: !!body?.password
    })

    // Validate required fields
    if (!body?.email?.trim() || !body?.password?.trim() || !body?.username?.trim()) {
      console.log('[Signup API] Validation failed: Missing required fields')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Email, password, and username are required'
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      console.log('[Signup API] Validation failed: Invalid email format')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Invalid email format'
      }
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(body.password)) {
      console.log('[Signup API] Validation failed: Password does not meet requirements')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Password must be at least 8 characters with uppercase, number, and special character'
      }
    }

    // Initialize Supabase client
    let supabase
    try {
      supabase = await serverSupabaseClient(event)
      console.log('[Signup API] Supabase client initialized')
    } catch (supabaseError) {
      console.error('[Signup API] Failed to initialize Supabase:', supabaseError)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Database connection failed'
      }
    }

    // Check if email already exists
    console.log('[Signup API] Checking email uniqueness...')
    try {
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', body.email.toLowerCase())
        .single()

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        console.error('[Signup API] Email check database error:', emailCheckError)
        setResponseStatus(event, 500)
        return {
          success: false,
          message: 'Database error during email check'
        }
      }

      if (existingEmail) {
        console.log('[Signup API] Email already registered:', body.email)
        setResponseStatus(event, 400)
        return {
          success: false,
          message: 'Email already registered'
        }
      }
    } catch (emailCheckException) {
      console.error('[Signup API] Exception during email check:', emailCheckException)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to check email availability'
      }
    }

    // Hash password
    console.log('[Signup API] Hashing password...')
    let passwordHash
    try {
      passwordHash = await bcrypt.hash(body.password, 10)
    } catch (hashError) {
      console.error('[Signup API] Password hashing failed:', hashError)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to process password'
      }
    }

    // Generate verification token
    const crypto = await import('crypto')
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Create profile
    console.log('[Signup API] Creating profile...')
    let profile
    try {
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: body.email.toLowerCase(),
          email_lower: body.email.toLowerCase(),
          username: body.username.toLowerCase(),
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

      if (profileError || !newProfile) {
        console.error('[Signup API] Profile creation failed:', profileError)
        setResponseStatus(event, 400)
        return {
          success: false,
          message: 'Failed to create profile'
        }
      }

      profile = newProfile
      console.log('[Signup API] Profile created successfully:', profile.id)
    } catch (profileException) {
      console.error('[Signup API] Exception during profile creation:', profileException)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to create profile'
      }
    }

    // Initialize wallets (non-critical - don't fail signup if this fails)
    try {
      console.log('[Signup API] Initializing wallets...')
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

      const { error: walletError } = await supabase
        .from('wallets')
        .insert(walletInserts)

      if (walletError) {
        console.warn('[Signup API] Wallet initialization warning:', walletError)
      } else {
        console.log('[Signup API] Wallets initialized')
      }
    } catch (walletException) {
      console.warn('[Signup API] Wallet initialization exception:', walletException)
    }

    // Initialize ranks (non-critical)
    try {
      console.log('[Signup API] Initializing ranks...')
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

      const { error: rankError } = await supabase
        .from('ranks')
        .insert(rankInserts)

      if (rankError) {
        console.warn('[Signup API] Rank initialization warning:', rankError)
      } else {
        console.log('[Signup API] Ranks initialized')
      }
    } catch (rankException) {
      console.warn('[Signup API] Rank initialization exception:', rankException)
    }

    console.log('[Signup API] ========== REQUEST SUCCESS ==========')
    
    // Return success response
    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Account created successfully. Check your email to verify.',
      userId: profile.id,
      email: profile.email,
      username: profile.username,
      nextStep: 'email_verification'
    }

  } catch (error: any) {
    console.error('[Signup API] ========== CRITICAL ERROR ==========')
    console.error('[Signup API] Error:', {
      message: error?.message,
      code: error?.code,
      statusCode: error?.statusCode,
      stack: error?.stack
    })

    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Signup failed. Please try again.'
    }
  }
})
