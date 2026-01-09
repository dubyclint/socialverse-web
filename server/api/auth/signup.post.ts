// FIXED: /server/api/auth/signup.post.ts - Handle Supabase email errors
import { createClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password, username } = body

    console.log('[SIGNUP] Starting signup for:', email)

    if (!email || !password || !username) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    console.log('[SIGNUP] Creating auth user...')
    
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          username: username.trim().toLowerCase()
        },
        // Disable Supabase's automatic email confirmation
        emailRedirectTo: undefined
      }
    })

    // Check if error is related to email sending
    if (authError) {
      console.error('[SIGNUP] Auth error:', authError.message)
      
      // If it's an email error, don't block signup
      if (authError.message && authError.message.toLowerCase().includes('email')) {
        console.warn('[SIGNUP] ⚠️ Email-related error from Supabase, but continuing with signup')
        // Continue - user was likely created despite email error
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: authError.message
        })
      }
    }

    const authUserId = authData?.user?.id
    if (!authUserId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed'
      })
    }

    console.log('[SIGNUP] Auth user created:', authUserId)
    console.log('[SIGNUP] Waiting for profile creation...')
    await new Promise(resolve => setTimeout(resolve, 500))

    let emailSent = false
    let emailError = null
    const skipEmail = process.env.SKIP_EMAIL_VERIFICATION === 'true'

    if (skipEmail) {
      console.log('[SIGNUP] ⏭️ Email verification skipped')
    } else {
      console.log('[SIGNUP] Attempting to send verification email...')
      
      try {
        const verificationToken = Buffer.from(
          JSON.stringify({
            userId: authUserId,
            email: email.trim().toLowerCase(),
            timestamp: Date.now()
          })
        ).toString('base64')

        const emailResult = await sendVerificationEmail(
          email.trim().toLowerCase(),
          username.trim(),
          verificationToken
        )

        if (emailResult?.success) {
          console.log('[SIGNUP] ✅ Email sent')
          emailSent = true
        } else {
          console.warn('[SIGNUP] ⚠️ Email failed:', emailResult?.error)
          emailError = emailResult?.error
        }
      } catch (err: any) {
        console.warn('[SIGNUP] ⚠️ Email exception:', err?.message)
        emailError = err?.message
      }
    }

    console.log('[SIGNUP] ✅ SIGNUP SUCCESS')

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase()
      },
      message: 'Account created successfully!',
      requiresEmailVerification: !skipEmail,
      emailSent: emailSent,
      emailError: emailError || null
    }

  } catch (error: any) {
    console.error('[SIGNUP] ❌ Fatal error:', error?.message)
    throw error
  }
})
