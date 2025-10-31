// /server/api/auth/signup.post.ts - NEW IMPLEMENTATION
import { serverSupabaseClient } from '#supabase/server'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

interface SignupRequest {
  email: string
  password: string
  username: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<SignupRequest>(event)

    // Validate required fields
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

    // Validate password strength (min 8 chars, 1 uppercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(body.password)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 8 characters with uppercase, number, and special character'
      })
    }

    // Validate username (3-30 chars, alphanumeric, underscore, hyphen)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
    if (!usernameRegex.test(body.username)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be 3-30 characters (letters, numbers, underscore, hyphen only)'
      })
    }

    // Check if email already exists (case-insensitive)
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .ilike('email', body.email)
      .single()

    if (existingEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email already registered'
      })
    }

    // Check if username already exists (case-insensitive)
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

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 10)

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: body.email.toLowerCase(),
        password_hash: passwordHash,
        role_id: 'user',
        is_active: true,
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_expires_at: tokenExpiry
      })
      .select()
      .single()

    if (userError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user'
      })
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        username: body.username,
        rank: 'bronze',
        rank_points: 0,
        status: 'active',
        profile_completed: false
      })

    if (profileError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create profile'
      })
    }

    // Create wallet
    const { error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: user.id,
        is_locked: false
      })

    if (walletError) {
      console.warn('Wallet creation warning:', walletError)
    }

    // Initialize rank
    const { error: rankError } = await supabase
      .from('user_ranks')
      .insert({
        user_id: user.id,
        category: 'overall',
        current_rank: 'Bronze I',
        rank_level: 1,
        points: 0
      })

    if (rankError) {
      console.warn('Rank initialization warning:', rankError)
    }

    // Send verification email
    // TODO: Implement email sending service
    console.log('[Signup] Verification token:', verificationToken)

    return {
      success: true,
      message: 'Signup successful. Please check your email to verify your account.',
      userId: user.id,
      email: user.email
    }
  } catch (error) {
    console.error('[Signup] Error:', error)
    throw error
  }
})
