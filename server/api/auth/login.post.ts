// FILE: /server/api/auth/login.post.ts - UPDATED WITH CONSOLIDATED DB
// ============================================================================

import { supabase } from '~/server/utils/database'

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
      console.log('[Login] Missing credentials')
      setResponseStatus(event, 400)
      return { success: false, message: 'Email and password are required' }
    }

    // Use consolidated Supabase client
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[Login] Auth error:', error.message)
      setResponseStatus(event, 401)
      return { success: false, message: error.message }
    }

    console.log('[Login] ========== SUCCESS ==========')
    return {
      success: true,
      user: data.user,
      session: data.session,
    }
  } catch (error: any) {
    console.error('[Login] Unexpected error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error.message || 'Login failed',
    }
  }
})
