// ============================================================================
// FILE: /server/api/auth/resend-verification.post.ts - NEW ENDPOINT
// ============================================================================
// RESEND VERIFICATION EMAIL ENDPOINT
// ============================================================================

import { sendVerificationEmail } from '~/server/utils/email'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    console.log('[RESEND-VERIFICATION] ============ START ============')
    
    const body = await readBody(event)
    const { email } = body

    if (!email) {
      console.error('[RESEND-VERIFICATION] ❌ Email is required')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }

    console.log('[RESEND-VERIFICATION] Email:', email)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[RESEND-VERIFICATION] ❌ Missing Supabase config')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    // ============================================================================
    // REQUEST NEW VERIFICATION EMAIL FROM SUPABASE
    // ============================================================================
    console.log('[RESEND-VERIFICATION] Requesting verification email from Supabase...')
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase().trim()
    })

    if (error) {
      console.error('[RESEND-VERIFICATION] ❌ Supabase resend error:', error.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to resend verification email: ' + error.message
      })
    }

    console.log('[RESEND-VERIFICATION] ✅ Verification email resent successfully')
    console.log('[RESEND-VERIFICATION] ============ END ============')

    return {
      success: true,
      message: 'Verification email sent! Check your inbox.'
    }

  } catch (error: any) {
    console.error('[RESEND-VERIFICATION] ❌ Error:', error.message)
    throw error
  }
})
