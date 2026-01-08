// ============================================================================
// FILE: /server/api/auth/verify-email.post.ts - UPDATED FOR CUSTOM TOKENS
// ============================================================================
// ✅ Handles custom verification tokens
// ✅ Marks user as verified in database
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const query = getQuery(event)
    
    console.log('[VERIFY-EMAIL] ============ START ============')
    
    // Accept token from either body or query
    let token = body.token || query.code || query.token
    
    if (!token) {
      console.error('[VERIFY-EMAIL] ❌ Token is missing')
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token is required'
      })
    }

    console.log('[VERIFY-EMAIL] Token received (first 20 chars):', String(token).substring(0, 20) + '...')

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[VERIFY-EMAIL] ❌ Missing Supabase credentials')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[VERIFY-EMAIL] ✅ Supabase admin client created')

    // ============================================================================
    // STEP 1: Try to decode custom verification token
    // ============================================================================
    console.log('[VERIFY-EMAIL] STEP 1: Attempting to decode custom token...')
    try {
      const decodedToken = JSON.parse(
        Buffer.from(String(token), 'base64').toString('utf-8')
      )
      
      console.log('[VERIFY-EMAIL] ✅ Custom token decoded')
      console.log('[VERIFY-EMAIL] User ID:', decodedToken.userId)
      console.log('[VERIFY-EMAIL] Email:', decodedToken.email)
      
      const userId = decodedToken.userId
      const email = decodedToken.email

      // ============================================================================
      // Mark user as verified in database
      // ============================================================================
      console.log('[VERIFY-EMAIL] Marking user as verified...')
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('user')
        .update({
          is_verified: true,
          verification_status: 'verified',
          email_verified_at: new Date().toISOString(),
          verification_token: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (updateError) {
        console.error('[VERIFY-EMAIL] ❌ Error updating verification status:', updateError.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to verify email: ' + updateError.message
        })
      }

      console.log('[VERIFY-EMAIL] ✅ User marked as verified')
      console.log('[VERIFY-EMAIL] ============ END ============')

      return {
        success: true,
        message: 'Email verified successfully!',
        user: {
          id: userId,
          email: email,
          is_verified: true
        }
      }
    } catch (err: any) {
      console.log('[VERIFY-EMAIL] Custom token decode failed:', err.message)
      // Continue to try other methods
    }

    // ============================================================================
    // STEP 2: If custom token fails, return error
    // ============================================================================
    console.log('[VERIFY-EMAIL] ❌ Token verification failed')
    console.log('[VERIFY-EMAIL] ============ END ============')
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired verification token'
    })

  } catch (error: any) {
    console.error('[VERIFY-EMAIL] ============ ERROR ============')
    console.error('[VERIFY-EMAIL] Error:', error.message)
    console.error('[VERIFY-EMAIL] ============ END ERROR ============')
    throw error
  }
})
