import { serverSupabaseClient } from '#supabase/server'

interface ResendVerificationRequest {
  email: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<ResendVerificationRequest>(event)
    
    const { email } = body

    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }

    console.log('[Resend Verification] Request for email:', email)

    // ✅ FIX: Use Supabase to fetch user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, email_verified')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      console.error('[Resend Verification] User not found:', email)
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    if (profile.email_verified) {
      console.log('[Resend Verification] Email already verified:', email)
      return { success: true, message: 'Email already verified' }
    }

    // ✅ FIX: Use Supabase auth to resend verification email
    console.log('[Resend Verification] Resending verification email to:', email)
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (resendError) {
      console.error('[Resend Verification] Resend error:', resendError)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to resend verification email: ${resendError.message}`
      })
    }

    console.log('[Resend Verification] Verification email sent successfully')

    return { 
      success: true, 
      message: 'Verification email sent. Please check your inbox.' 
    }

  } catch (error) {
    console.error('[Resend Verification] Error:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to resend verification email: ${(error as any).message || 'Unknown error'}`
    })
  }
})
