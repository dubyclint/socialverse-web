// FILE: /server/api/auth/signup.post.ts - FIXED
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
  try {
    // Set response header to JSON - CRITICAL FIX
    setHeader(event, 'Content-Type', 'application/json')

    console.log('[Signup] ========== SIGNUP REQUEST STARTED ==========')
    
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<SignupRequest>(event)

    console.log('[Signup] Step 1: Request body received', { 
      email: body.email, 
      username: body.username,
      passwordLength: body.password?.length 
    })

    // STEP 1: VALIDATE INPUT
    if (!body.email || !body.password || !body.username) {
      console.log('[Signup] Step 1 FAILED: Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      console.log('[Signup] Step 1 FAILED: Invalid email format')
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(body.password)) {
      console.log('[Signup] Step 1 FAILED: Password does not meet requirements')
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 8 characters with uppercase, number, and special character'
      })
    }

    console.log('[Signup] Step 1 PASSED: Input validation successful')

    // STEP 2: CHECK EMAIL UNIQUENESS
    console.log('[Signup] Step 2: Checking email uniqueness...')
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', body.email)
      .single()

    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
      console.log('[Signup] Step 2 FAILED: Database error', emailCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${emailCheckError.message}`
      })
    }

    if (existingEmail) {
      console.log('[Signup] Step 2 FAILED: Email already exists')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email already registered'
      })
    }

    console.log('[Signup] Step 2 PASSED: Email is unique')

    // STEP 3: HASH PASSWORD
    console.log('[Signup] Step 3: Hashing password...')
    const passwordHash = await bcrypt.hash(body.password, 10)
    console.log('[Signup] Step 3 PASSED: Password hashed')

    // STEP 4: GENERATE VERIFICATION TOKEN
    console.log('[Signup] Step 4: Generating verification token...')
    const { token: verificationToken, expiresAt: tokenExpiry } = generateEmailVerificationToken()
    console.log('[Signup] Step 4 PASSED: Token generated')

    // STEP 5: CREATE PROFILE RECORD
    console.log('[Signup] Step 5: Creating profile record...')
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

    if (profileError) {
      console.log('[Signup] Step 5 FAILED: Profile creation error', profileError)
      throw createError({
        statusCode: 400,
        statusMessage: `Profile creation failed: ${profileError.message}`
      })
    }

    console.log('[Signup] Step 5 PASSED: Profile created with ID:', profile.id)

    // STEP 6: INITIALIZE WALLETS
    console.log('[Signup] Step 6: Initializing wallets...')
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
      console.warn('[Signup] Step 6 WARNING: Wallet creation error', walletError)
    } else {
      console.log('[Signup] Step 6 PASSED: Wallets initialized')
    }

    // STEP 7: INITIALIZE RANKS
    console.log('[Signup] Step 7: Initializing ranks...')
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
      console.warn('[Signup] Step 7 WARNING: Rank initialization error', rankError)
    } else {
      console.log('[Signup] Step 7 PASSED: Ranks initialized')
    }

    // STEP 8: INITIALIZE PRIVACY SETTINGS
    console.log('[Signup] Step 8: Initializing privacy settings...')
    const { error: privacyError } = await supabase
      .from('profile_privacy_settings')
      .insert({
        user_id: profile.id,
        show_profile_views: true,
        show_online_status: true,
        allow_messages: true,
        allow_friend_requests: true,
        show_email: false,
        show_phone: false,
        show_location: false,
        show_interests: true,
        profile_visibility: 'public'
      })

    if (privacyError) {
      console.warn('[Signup] Step 8 WARNING: Privacy settings error', privacyError)
    } else {
      console.log('[Signup] Step 8 PASSED: Privacy settings initialized')
    }

    // STEP 9: INITIALIZE USER SETTINGS
    console.log('[Signup] Step 9: Initializing user settings...')
    const { error: settingsError } = await supabase
      .from('user_settings_categories')
      .insert({
        user_id: profile.id,
        notifications_enabled: true,
        email_notifications: true,
        push_notifications: true,
        theme: 'light',
        language: 'en',
        two_factor_enabled: false,
        backup_codes: []
      })

    if (settingsError) {
      console.warn('[Signup] Step 9 WARNING: User settings error', settingsError)
    } else {
      console.log('[Signup] Step 9 PASSED: User settings initialized')
    }

    // STEP 10: INITIALIZE WALLET LOCK SETTINGS
    console.log('[Signup] Step 10: Initializing wallet lock settings...')
    const { error: lockError } = await supabase
      .from('wallet_lock_settings')
      .insert({
        user_id: profile.id,
        is_locked: false
      })

    if (lockError) {
      console.warn('[Signup] Step 10 WARNING: Wallet lock settings error', lockError)
    } else {
      console.log('[Signup] Step 10 PASSED: Wallet lock settings initialized')
    }

    // STEP 11: SEND VERIFICATION EMAIL
    console.log('[Signup] Step 11: Sending verification email...')
    try {
      await sendVerificationEmail(profile.email, profile.username, verificationToken)
      console.log('[Signup] Step 11 PASSED: Verification email sent')
    } catch (emailError) {
      console.warn('[Signup] Step 11 WARNING: Email sending failed', emailError)
    }

    // STEP 12: RETURN SUCCESS
    console.log('[Signup] ========== SIGNUP COMPLETED SUCCESSFULLY ==========')
    return {
      success: true,
      message: 'Account created. Check your email to verify.',
      userId: profile.id,
      email: profile.email,
      nextStep: 'email_verification'
    }

  } catch (error: any) {
    console.error('[Signup] ========== SIGNUP FAILED ==========')
    console.error('[Signup] Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      stack: error.stack
    })
    
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }
    
    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Signup failed'
    })
  }
})
