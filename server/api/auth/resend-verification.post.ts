// FILE: /server/api/auth/resend-verification.post.ts - UPDATED
// ============================================================================

import { supabase } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    console.log('[Resend Verification] ========== START ==========')

    let body: any
    try {
      body = await readBody(event)
    } catch (e) {
      console.error('[Resend Verification] Body parse error:', e)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid request body' }
    }

    const { email } = body || {}

    if (!email) {
      console.log('[Resend Verification] Missing email')
      setResponseStatus(event, 400)
      return { success: false, message: 'Email is required' }
    }

  // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('[Resend Verification] Invalid email format:', email)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid email format' }
    }

    // Use consolidated Supabase client
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      console.error('[Resend Verification] Error:', error.message)
      setResponseStatus(event, 400)
      return { success: false, message: error.message }
    }
    console.log('[Resend Verification] ========== SUCCESS ==========')
    return {
      success: true,
      message: 'Verification email sent successfully',
    }
  } catch (error: any) {
    console.error('[Resend Verification] Unexpected error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error.message || 'Failed to resend verification email',
    }
  }
})
