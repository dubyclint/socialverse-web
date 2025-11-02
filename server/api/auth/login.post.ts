// FILE: /server/api/auth/login.post.ts - COMPLETE REWRITE
// ============================================================================

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')

  try {
    console.log('[Login] ========== START ==========')

    let body: any
    try {
      body = await readBody(event)
    } catch (e) {
      console.error('[Login] Body parse error:', e)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid request body' }
    }

    const { email, password } = body || {}

    if (!email || !password) {
      console.log('[Login] Missing fields')
      setResponseStatus(event, 400)
      return { success: false, message: 'Email and password are required' }
    }

    let supabase: any
    try {
      const { serverSupabaseClient } = await import('#supabase/server')
      supabase = await serverSupabaseClient(event)
    } catch (e) {
      console.error('[Login] Supabase init error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Database connection failed' }
    }

    // Query profile
    let profile: any
    try {
      const { data: foundProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (!foundProfile) {
        console.log('[Login] User not found')
        setResponseStatus(event, 401)
        return { success: false, message: 'Invalid email or password' }
      }

      profile = foundProfile
    } catch (e) {
      console.error('[Login] Profile query error:', e)
      setResponseStatus(event, 401)
      return { success: false, message: 'Invalid email or password' }
    }

    // Verify password
    let passwordMatch = false
    try {
      const bcrypt = await import('bcrypt')
      passwordMatch = await bcrypt.default.compare(password, profile.password_hash)
    } catch (e) {
      console.error('[Login] Password verify error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Failed to verify password' }
    }

    if (!passwordMatch) {
      console.log('[Login] Password mismatch')
      setResponseStatus(event, 401)
      return { success: false, message: 'Invalid email or password' }
    }

    // Generate JWT
    let token: string
    try {
      const jwt = await import('jsonwebtoken')
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

      token = jwt.default.sign(
        {
          userId: profile.id,
          email: profile.email,
          username: profile.username,
          role: profile.role
        },
        JWT_SECRET,
        { expiresIn: '7d', algorithm: 'HS256' }
      )
    } catch (e) {
      console.error('[Login] JWT generation error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Failed to generate token' }
    }

    console.log('[Login] ========== SUCCESS ==========')
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
    console.error('[Login] ========== CRITICAL ERROR ==========')
    console.error('[Login] Error:', error?.message || error)

    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Login failed'
    }
  }
})
