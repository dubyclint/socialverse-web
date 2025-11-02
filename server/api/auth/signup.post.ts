// FILE: /server/api/auth/signup.post.ts - FIXED VERSION
// ============================================================================

export default defineEventHandler(async (event) => {
  // CRITICAL: Set headers FIRST
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  
  try {
    console.log('[Signup] ========== START ==========')
    
    // Parse body
    let body: any
    try {
      body = await readBody(event)
    } catch (e) {
      console.error('[Signup] Body parse error:', e)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid request body' }
    }

    const { email, password, username } = body || {}

    // Validate inputs
    if (!email || !password || !username) {
      console.log('[Signup] Missing fields')
      setResponseStatus(event, 400)
      return { success: false, message: 'Email, password, and username are required' }
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('[Signup] Invalid email')
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid email format' }
    }

    // Validate password
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      console.log('[Signup] Invalid password')
      setResponseStatus(event, 400)
      return { success: false, message: 'Password must be at least 8 characters with uppercase, number, and special character' }
    }

    // Get Supabase client - FIXED IMPORT
    let supabase: any
    try {
      const { getSupabaseClient } = await import('~/server/utils/supabase')
      supabase = getSupabaseClient()
      console.log('[Signup] Supabase client initialized')
    } catch (e) {
      console.error('[Signup] Supabase init error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Database connection failed' }
    }

    // Check if email exists
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .single()

      if (existing) {
        console.log('[Signup] Email already exists')
        setResponseStatus(event, 400)
        return { success: false, message: 'Email already registered' }
      }
    } catch (e: any) {
      // PGRST116 means no rows found, which is what we want
      if (e?.code !== 'PGRST116') {
        console.error('[Signup] Email check error:', e)
        setResponseStatus(event, 500)
        return { success: false, message: 'Failed to check email' }
      }
    }

    // Hash password
    let passwordHash: string
    try {
      const bcrypt = await import('bcrypt')
      passwordHash = await bcrypt.default.hash(password, 10)
      console.log('[Signup] Password hashed successfully')
    } catch (e) {
      console.error('[Signup] Hash error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Failed to process password' }
    }

    // Generate token
    let verificationToken: string
    try {
      const crypto = await import('crypto')
      verificationToken = crypto.default.randomBytes(32).toString('hex')
    } catch (e) {
      console.error('[Signup] Token generation error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Failed to generate verification token' }
    }

    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Create profile
    let profile: any
    try {
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: email.toLowerCase(),
          email_lower: email.toLowerCase(),
          username: username.toLowerCase(),
          username_lower: username.toLowerCase(),
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
        console.error('[Signup] Profile creation error:', profileError)
        setResponseStatus(event, 400)
        return { success: false, message: 'Failed to create profile' }
      }

      profile = newProfile
      console.log('[Signup] Profile created:', profile.id)
    } catch (e) {
      console.error('[Signup] Profile creation exception:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Failed to create profile' }
    }

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
      console.log('[Signup] Wallets initialized')
    } catch (e) {
      console.warn('[Signup] Wallet init warning:', e)
    }

    // Initialize ranks (non-critical)
    try {
      await supabase.from('ranks').insert([
        { user_id: profile.id, category: 'trading', current_rank: 'Bronze I', rank_level: 1, points: 0, next_rank: 'Bronze II', points_to_next: 100, achievements: [], season_start: new Date().toISOString() },
        { user_id: profile.id, category: 'social', current_rank: 'Bronze I', rank_level: 1, points: 0, next_rank: 'Bronze II', points_to_next: 100, achievements: [], season_start: new Date().toISOString() },
        { user_id: profile.id, category: 'content', current_rank: 'Bronze I', rank_level: 1, points: 0, next_rank: 'Bronze II', points_to_next: 100, achievements: [], season_start: new Date().toISOString() },
        { user_id: profile.id, category: 'overall', current_rank: 'Bronze I', rank_level: 1, points: 0, next_rank: 'Bronze II', points_to_next: 100, achievements: [], season_start: new Date().toISOString() }
      ])
      console.log('[Signup] Ranks initialized')
    } catch (e) {
      console.warn('[Signup] Rank init warning:', e)
    }

    console.log('[Signup] ========== SUCCESS ==========')
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
    console.error('[Signup] ========== CRITICAL ERROR ==========')
    console.error('[Signup] Error:', error?.message || error)
    console.error('[Signup] Stack:', error?.stack)

    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Signup failed'
    }
  }
})
