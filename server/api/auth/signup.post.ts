 /server/api/auth/signup.post.ts - UPDATE
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
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<SignupRequest>(event)

    // STEP 1: VALIDATE INPUT
    if (!body.email || !body.password || !body.username) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(body.password)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 8 characters with uppercase, number, and special character'
      })
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
    if (!usernameRegex.test(body.username)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be 3-30 characters (letters, numbers, underscore, hyphen only)'
      })
    }

    // STEP 2: CHECK UNIQUENESS
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', body.email)
      .single()

    if (existingEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email already registered'
      })
    }

    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', body.username)
      .single()

    if (existingUsername) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username already taken'
      })
    }

    // STEP 3: HASH PASSWORD
    const passwordHash = await bcrypt.hash(body.password, 10)

    // STEP 4: GENERATE VERIFICATION TOKEN
    const { token: verificationToken, expiresAt: tokenExpiry } = generateEmailVerificationToken()

    // STEP 5: CREATE PROFILE RECORD
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
      console.error('[Signup] Profile creation error:', profileError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create profile'
      })
    }

    // STEP 6: INITIALIZE WALLETS (7 currencies)
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
      console.warn('[Signup] Wallet creation warning:', walletError)
    }

    // STEP 7: INITIALIZE RANKS (4 categories)
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
      console.warn('[Signup] Rank initialization warning:', rankError)
    }

    // STEP 8: INITIALIZE PRIVACY SETTINGS
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
      console.warn('[Signup] Privacy settings warning:', privacyError)
    }

    // STEP 9: INITIALIZE USER SETTINGS
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
      console.warn('[Signup] User settings warning:', settingsError)
    }

    // STEP 10: INITIALIZE WALLET LOCK SETTINGS
    const { error: lockError } = await supabase
      .from('wallet_lock_settings')
      .insert({
        user_id: profile.id,
        is_locked: false
      })

    if (lockError) {
      console.warn('[Signup] Wallet lock settings warning:', lockError)
    }

    // STEP 11: SEND VERIFICATION EMAIL
    try {
      await sendVerificationEmail(profile.email, profile.username, verificationToken)
    } catch (emailError) {
      console.warn('[Signup] Email sending failed:', emailError)
      // Don't fail signup if email fails
    }

    // STEP 12: RETURN SUCCESS
    return {
      success: true,
      message: 'Account created. Check your email to verify.',
      userId: profile.id,
      email: profile.email,
      nextStep: 'email_verification'
    }

  } catch (error) {
    console.error('[Signup] Error:', error)
    throw error
  }
})
