// ============================================================================
// FILE: /server/api/auth/verify-email.post.ts - PRODUCTION SECURED
// ============================================================================
import { defineEventHandler, readBody, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  console.log('[VERIFY-EMAIL] ============ VERIFICATION START ============')
  try {
    const body = await readBody(event)
    const { token, type } = body

    if (!token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token is required'
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal server engine misconfiguration'
      })
    }

    // Initialize elevated Admin client to bypass RLS restrictions safely
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    console.log(`[VERIFY-EMAIL] Processing type verification matching: [${type || 'signup'}]`)

    // Verify user token context with Supabase Auth Layer
    // runtime-guard the admin API because some supabase client builds may not include the admin surface
    const verifyFn: any = (supabaseAdmin as any)?.auth?.admin?.verifyUserWithToken
    if (typeof verifyFn !== 'function') {
      console.error('[VERIFY-EMAIL] supabase admin verifyUserWithToken is not available on this runtime')
      throw createError({ statusCode: 500, statusMessage: 'Verification backend not available' })
    }

    const { data: authData, error: authError } = await verifyFn({
      type: (type === 'signup' ? 'signup' : 'email'),
      token: token
    })

    if (authError || !authData?.user) {
      console.error('[VERIFY-EMAIL] ❌ Token challenge failed:', authError?.message)
      throw createError({
        statusCode: 400,
        statusMessage: authError?.message || 'Invalid or expired verification token'
      })
    }

    const userId = authData.user.id
    console.log('[VERIFY-EMAIL] ✅ Token valid. User UUID verified:', userId)

    // ✅ FIXED: Targets 'user_id' instead of 'id' to match your actual database structural constraint
    const { error: dbError } = await supabaseAdmin
      .from('profiles')
      .update({ is_verified: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (dbError) {
      console.error('[VERIFY-EMAIL] ❌ Failed updating schema row inside profiles:', dbError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Database sync error updating profile verification state'
      })
    }

    console.log('[VERIFY-EMAIL] ✅ Verification database flag saved to profiles table.')
    console.log('[VERIFY-EMAIL] ============ VERIFICATION END ============')

    return {
      success: true,
      user: {
        id: userId,
        email: authData.user.email,
        username: authData.user.user_metadata?.username || authData.user.email?.split('@'),
        full_name: authData.user.user_metadata?.full_name || ''
      }
    }

  } catch (error: any) {
    console.error('[VERIFY-EMAIL] Critical error caught in handler:', error?.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal verification endpoint exception'
    })
  }
})
