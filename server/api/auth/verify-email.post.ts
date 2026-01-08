// ============================================================================
// FILE: /server/api/auth/verify-email.post.ts - SIMPLIFIED VERSION
// ============================================================================
// ✅ SIMPLE EMAIL VERIFICATION
// ✅ User clicks link in email
// ✅ Verifies email
// ✅ Redirects to feed page
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { token } = body

    console.log('[VERIFY-EMAIL] Starting email verification...')

    if (!token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token is required'
      })
    }

    // Decode token
    let tokenData
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString())
    } catch (e) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification token'
      })
    }

    const { userId, email } = tokenData

    if (!userId || !email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid token data'
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ============================================================================
    // STEP 1: Update user verification status
    // ============================================================================
    console.log('[VERIFY-EMAIL] Updating verification status for user:', userId)

    const { data: updatedUser, error: updateError } = await supabase
      .from('user')
      .update({
        is_verified: true,
        verification_status: 'verified'
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.log('[VERIFY-EMAIL] Update error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to verify email: ' + updateError.message
      })
    }

    console.log('[VERIFY-EMAIL] ✓ Email verified successfully')

    return {
      success: true,
      message: 'Email verified! You can now login.',
      user: updatedUser,
      redirectTo: '/feed'  // Redirect to feed page
    }

  } catch (error: any) {
    console.log('[VERIFY-EMAIL] Error:', error?.message || error)
    throw error
  }
})
