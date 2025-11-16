// FILE: /server/api/auth/signup.post.ts - UPDATED WITH CONSOLIDATED DB
// ============================================================================

import { supabase } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  
  try {
    console.log('[Signup] ========== START ==========')
    
    // Parse request body
    let body: any
    try {
      body = await readBody(event)
    } catch (e) {
      console.error('[Signup] Body parse error:', e)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid request body' }
    }

    const { email, password, username } = body || {}

    // Validate input
    if (!email || !password) {
      console.log('[Signup] Missing required fields')
      setResponseStatus(event, 400)
      return { success: false, message: 'Email and password are required' }
    }

  // Use consolidated Supabase client
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
      },
    })

    if (error) {
      console.error('[Signup] Auth error:', error.message)
      setResponseStatus(event, 400)
      return { success: false, message: error.message }
    }

    console.log('[Signup] ========== SUCCESS ==========')
    return {
      success: true,
      user: data.user,
      session: data.session,
      message: 'Signup successful. Please verify your email.',
    }
  } catch (error: any) {
    console.error('[Signup] Unexpected error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error.message || 'Signup failed',
    }
  }
})
