// FILE: /server/api/auth/signup.post.ts - MINIMAL BULLETPROOF VERSION
// ============================================================================

export default defineEventHandler(async (event) => {
  // STEP 1: Set JSON header FIRST - before anything else
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  
  // STEP 2: Set status code
  setResponseStatus(event, 200)

  try {
    console.log('[Signup] REQUEST RECEIVED')
    
    // STEP 3: Parse body
    const body = await readBody(event)
    console.log('[Signup] Body parsed:', { email: body?.email, username: body?.username })

    // STEP 4: Validate
    if (!body?.email || !body?.password || !body?.username) {
      console.log('[Signup] VALIDATION FAILED: Missing fields')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Email, password, and username are required'
      }
    }

    // STEP 5: Import dependencies
    const { serverSupabaseClient } = await import('#supabase/server')
    const bcrypt = await import('bcrypt')
    const crypto = await import('crypto')

    // STEP 6: Get Supabase client
    const supabase = await serverSupabaseClient(event)
    console.log('[Signup] Supabase client ready')

    // STEP 7: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      console.log('[Signup] Invalid email format')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Invalid email format'
      }
    }

    // STEP 8: Validate password
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(body.password)) {
      console.log('[Signup] Password does not meet requirements')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Password must be at least 8 characters with uppercase, number, and special character'
      }
    }

    // STEP 9: Check if email exists
    console.log('[Signup] Checking if email exists...')
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', body.email.toLowerCase())
      .single()

    if (existingEmail) {
      console.log('[Signup] Email already exists')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Email already registered'
      }
    }

    // STEP 10: Hash password
    console.log('[Signup] Hashing password...')
    const passwordHash = await bcrypt.default.hash(body.password, 10)

    // STEP 11: Generate token
    const verificationToken = crypto.default.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // STEP 12: Create profile
    console.log('[Signup] Creating profile...')
    const { data: profile, error: profileError } = await supabase
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

    if (profileError || !profile) {
      console.log('[Signup] Profile creation failed:', profileError)
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Failed to create profile'
      }
    }

    console.log('[Signup] Profile created:', profile.id)

    // STEP 13: Initialize wallets (non-critical)
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

      await supabase.from('wallets').insert(
        currencies.map(c => ({
          user_id: profile.id,
          currency_code: c.code,
          currency_name: c.name,
          balance: 0,
          locked_balance: 0,
          is_locked: false
        }))
      )
      console.log('[Signup] Wallets created')
    } catch (e) {
      console.warn('[Signup] Wallet creation failed (non-critical):', e)
    }

    // STEP 14: Initialize ranks (non-critical)
    try {
      const categories = ['trading', 'social', 'content', 'overall']
      await supabase.from('ranks').insert(
        categories.map(cat => ({
          user_id: profile.id,
          category: cat,
          current_rank: 'Bronze I',
          rank_level: 1,
          points: 0,
          next_rank: 'Bronze II',
          points_to_next: 100,
          achievements: [],
          season_start: new Date().toISOString()
        }))
      )
      console.log('[Signup] Ranks created')
    } catch (e) {
      console.warn('[Signup] Rank creation failed (non-critical):', e)
    }

    console.log('[Signup] SUCCESS')
    setResponseStatus(event, 200)
    
    return {
      success: true,
      message: 'Account created successfully',
      userId: profile.id,
      email: profile.email,
      username: profile.username,
      nextStep: 'email_verification'
    }

  } catch (error: any) {
    console.error('[Signup] CRITICAL ERROR:', error?.message || error)
    setResponseStatus(event, 500)
    
    return {
      success: false,
      message: error?.message || 'Signup failed'
    }
  }
})
