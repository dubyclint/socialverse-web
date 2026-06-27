// ============================================================================
// FILE: /server/api/auth/resend-verification.post.ts - PRODUCTION RECONCILED
// ============================================================================
import { defineEventHandler, readBody, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'

interface ResendRequest {
  email: string
}

export default defineEventHandler(async (event) => {
  console.log('[RESEND-VERIFICATION] ============ START ============')
  try {
    const body = await readBody<ResendRequest>(event)
    
    if (!body || !body.email) {
      console.error('[RESEND-VERIFICATION] ❌ Validation mismatch: missing email field.')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email address is required.'
      })
    }

    const email = body.email.toLowerCase().trim()
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[RESEND-VERIFICATION] ❌ Engine missing environment initialization states.')
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal server configuration initialization error.'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    console.log('[RESEND-VERIFICATION] Communicating dispatch message request to Supabase...')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (error) {
      console.error('[RESEND-VERIFICATION] ❌ Supabase core rejected dispatch:', error.message)
      throw createError({
        statusCode: 400,
        statusMessage: `Failed to resend confirmation data: ${error.message}`
      })
    }

    console.log('[RESEND-VERIFICATION] ✅ Callback email successfully transmitted to messaging queue.')
    console.log('[RESEND-VERIFICATION] ============ END ============')

    return {
      success: true,
      message: 'Verification email sent! Check your inbox.'
    }

  } catch (error: any) {
    console.error('[RESEND-VERIFICATION] Exception caught inside processing channel:', error?.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal resend verification pipeline exception encountered.'
    })
  }
})
