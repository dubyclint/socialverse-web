// FILE: /server/api/auth/login.post.ts - MINIMAL BULLETPROOF VERSION
// ============================================================================

export default defineEventHandler(async (event) => {
  // STEP 1: Set JSON header FIRST
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  setResponseStatus(event, 200)

  try {
    console.log('[Login] REQUEST RECEIVED')
    
    const body = await readBody(event)
    console.log('[Login] Body parsed:', { email: body?.email })

    if (!body?.email || !body?.password) {
      console.log('[Login] VALIDATION FAILED: Missing fields')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Email and password are required'
      }
    }

    const { serverSupabaseClient } = await import('#supabase/server')
    const bcrypt = await import('bcrypt')
    const jwt = await import('jsonwebtoken')

    const supabase = await serverSupabaseClient(event)
    console.log('[Login] Supabase client ready')

    // Query profile
    console.log('[Login] Querying profile...')
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', body.email.toLowerCase())
      .single()

    if (!profile) {
      console.log('[Login] User not found')
      setResponseStatus(event, 401)
      return {
        success: false,
        message: 'Invalid email or password'
      }
    }

    // Verify password
    console.log('[Login] Verifying password...')
    const passwordMatch = await bcrypt.default.compare(body.password, profile.password_hash)

    if (!passwordMatch) {
      console.log('[Login] Password mismatch')
      setResponseStatus(event, 401)
      return {
        success: false,
        message: 'Invalid email or password'
      }
    }

    // Generate JWT
    console.log('[Login] Generating JWT...')
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const token = jwt.default.sign(
      {
        userId: profile.id,
        email: profile.email,
        username: profile.username,
        role: profile.role
      },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    )

    console.log('[Login] SUCCESS')
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
    console.error('[Login] CRITICAL ERROR:', error?.message || error)
    setResponseStatus(event, 500)
    
    return {
      success: false,
      message: error?.message || 'Login failed'
    }
  }
})
