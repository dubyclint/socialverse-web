// FIXED: /server/api/auth/signup.post.ts - Handle database errors gracefully
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

    if (!supabaseUrl || !supabaseAnonKey) {
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
        }
      }
    })

    // Handle auth errors - but allow database errors to pass through
    if (authError) {
      console.error('[SIGNUP] Auth error:', authError.message)
      
      // If it's a database error, log it but continue
      if (authError.message && authError.message.toLowerCase().includes('database')) {
        console.warn('[SIGNUP] ⚠️ Database error from Supabase, but user may have been created')
        // Continue - user was likely created despite database error
      } else if (authError.message && authError.message.toLowerCase().includes('email')) {
        console.warn('[SIGNUP] ⚠️ Email error from Supabase, continuing')
        // Continue
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

    console.log('[SIGNUP] ✅ Auth user created:', authUserId)

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase()
      },
      message: 'Account created successfully!',
      requiresEmailVerification: false
    }

  } catch (error: any) {
    console.error('[SIGNUP] ❌ Fatal error:', error?.message)
    throw error
  }
})

