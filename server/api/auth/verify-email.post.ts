// ============================================================================
// FILE: /server/api/auth/verify-email.post.ts - FINAL PRODUCTION VERSION
// ============================================================================
// ✅ Verifies email
// ✅ Updates user_profiles table
// ✅ Redirects to feed page
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import { getAdminClient } from '../../utils/supabase-server'

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

    // ============================================================================
    // STEP 1: Decode and validate token
    // ============================================================================
    console.log('[VERIFY-EMAIL] STEP 1: Decoding token...')

    let tokenData
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString())
    } catch (e) {
      console.error('[VERIFY-EMAIL] ❌ Invalid token format')
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification token'
      })
    }

    const { userId, email } = tokenData

    if (!userId || !email) {
      console.error('[VERIFY-EMAIL] ❌ Invalid token data')
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid token data'
      })
    }

    console.log('[VERIFY-EMAIL] ✅ Token decoded successfully')
    console.log('[VERIFY-EMAIL] User ID:', userId)
    console.log('[VERIFY-EMAIL] Email:', email)

    // ============================================================================
    // STEP 2: Update user_profiles table
    // ============================================================================
    console.log('[VERIFY-EMAIL] STEP 2: Updating verification status...')

    const supabase = await getAdminClient()

    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        is_verified: true,
        verification_status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[VERIFY-EMAIL] ❌ Update error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to verify email: ' + updateError.message
      })
    }

    if (!updatedProfile) {
      console.error('[VERIFY-EMAIL] ❌ Profile not found')
      throw createError({
        statusCode: 404,
        statusMessage: 'User profile not found'
      })
    }

    console.log('[VERIFY-EMAIL] ✅ Email verified successfully')
    console.log('[VERIFY-EMAIL] Profile updated:', {
      id: updatedProfile.id,
      is_verified: updatedProfile.is_verified,
      verification_status: updatedProfile.verification_status
    })

    // ============================================================================
    // STEP 3: Return success response with redirect
    // ============================================================================
    console.log('[VERIFY-EMAIL] ✅ EMAIL VERIFICATION COMPLETE')

    return {
      success: true,
      message: 'Email verified successfully! Redirecting to feed...',
      user: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        username: updatedProfile.username,
        is_verified: updatedProfile.is_verified,
        verification_status: updatedProfile.verification_status
      },
      redirectTo: '/feed'
    }

  } catch (error: any) {
    console.error('[VERIFY-EMAIL] ❌ Error:', error?.message || error)
    throw error
  }
})
